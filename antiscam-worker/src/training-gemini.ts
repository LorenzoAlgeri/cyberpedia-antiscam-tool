/**
 * Direct Gemini API client for SSE streaming in training endpoints.
 *
 * Bypasses N8N for latency-sensitive calls. Two functions:
 * - callGeminiAnalysis: non-streaming, returns structured JSON (behavior scores)
 * - streamGeminiMessage: streaming, yields text chunks (scammer reply)
 *
 * Uses Gemini 2.5 Flash for speed.
 */

import { logger } from './logger';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Resilience: timeout + retry ─────────────────────────────────────────────
// Prevents hung connections when Gemini accepts but never responds (timeout),
// and handles transient 429/5xx errors during traffic spikes (retry).

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Fetch with AbortController timeout (time-to-first-byte).
 * Once headers arrive, the timeout is cleared — streaming body reads are
 * not subject to this timeout.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  // Combine timeout signal with optional external signal (e.g. request.signal
  // for client disconnect detection). AbortSignal.any fires on EITHER.
  const signal = externalSignal
    ? AbortSignal.any([controller.signal, externalSignal])
    : controller.signal;
  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // External abort (client disconnect) → propagate as-is for caller to handle
      if (externalSignal?.aborted) throw err;
      // Our timeout → descriptive error
      throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with timeout + retry for transient Gemini errors (429, 5xx).
 * Conservative: 1 retry max to stay within CF Workers' wall-clock budget.
 * Respects Retry-After header, caps delay at 4s.
 * Timeouts are NOT retried — a hung endpoint won't recover on retry.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  maxRetries = 1,
  externalSignal?: AbortSignal,
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Bail early if client already disconnected (saves a Gemini call)
    if (externalSignal?.aborted) throw new DOMException('Client disconnected', 'AbortError');

    const response = await fetchWithTimeout(url, init, timeoutMs, externalSignal);

    if (!RETRYABLE_STATUSES.has(response.status)) {
      return response;
    }

    lastResponse = response;

    if (attempt < maxRetries) {
      const retryAfterRaw = response.headers.get('Retry-After');
      const delayMs = retryAfterRaw
        ? Math.min(parseInt(retryAfterRaw, 10) * 1000, 4_000)
        : 2_000;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return lastResponse!;
}

interface GeminiRequest {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  systemInstruction: { parts: Array<{ text: string }> };
  generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    responseMimeType?: string;
  };
}

/**
 * Repair common JSON issues from Gemini output:
 * - Trailing commas before } or ]
 * - Single-line // comments
 * - Unescaped newlines inside string values
 * - Unquoted property names (e.g. {activation: 50} → {"activation": 50})
 * - Single-quoted strings (e.g. {'key': 'val'} → {"key": "val"})
 * - Truncated JSON (unclosed braces/brackets)
 */
function repairJSON(input: string): string {
  let s = input;

  // Remove single-line comments (outside strings — simplified heuristic)
  s = s.replace(/^\s*\/\/.*$/gm, '');

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, '$1');

  // Fix unquoted property names: { key: → { "key":
  // Matches word characters after { or , that are followed by :
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // Fix single-quoted strings → double-quoted (simplified: outside existing double quotes)
  s = s.replace(/'/g, '"');

  // Fix unescaped control characters inside strings (newlines, tabs)
  s = s.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
    return match
      .replace(/(?<!\\)\n/g, '\\n')
      .replace(/(?<!\\)\r/g, '\\r')
      .replace(/(?<!\\)\t/g, '\\t');
  });

  // Close unclosed braces/brackets (truncated output)
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  // If truncated inside a string value, close it first
  if (inString) {
    s += '"';
  }
  // Remove any trailing comma before we close
  s = s.replace(/,\s*$/, '');
  while (brackets > 0) { s += ']'; brackets--; }
  while (braces > 0) { s += '}'; braces--; }

  return s;
}

function buildGeminiRequest(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {},
): GeminiRequest {
  return {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: options.maxTokens ?? 2048,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };
}

/**
 * Non-streaming Gemini call for structured JSON analysis.
 * Returns parsed JSON response.
 */
export async function callGeminiAnalysis<T>(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiRequest(systemPrompt, userPrompt, {
        temperature: 0.5,
        maxTokens: 1024,
        jsonMode: true,
      })),
    },
    25_000, // 25s timeout — Gemini 2.5 Flash thinking can take 15s+
    2,
    signal,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  // Log token consumption for cost monitoring
  if (data.usageMetadata?.totalTokenCount) {
    logger.info('gemini.tokens.used', {
      totalTokenCount: data.usageMetadata.totalTokenCount,
      promptTokenCount: data.usageMetadata.promptTokenCount,
      candidatesTokenCount: data.usageMetadata.candidatesTokenCount,
      endpoint: 'analysis',
    });
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned empty response');
  }

  // Strip markdown fences defensively
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Extract outermost JSON object — handles text or comments before/after braces
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    cleaned = cleaned.slice(objStart, objEnd + 1);
  }

  // Try parsing as-is first, then repair, then log for debug
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Repair common Gemini JSON issues before retrying
    try {
      cleaned = repairJSON(cleaned);
      return JSON.parse(cleaned) as T;
    } catch (parseErr) {
      // Log the raw text for debugging
      logger.error('gemini.json.parse.error', {
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
        rawTextPreview: rawText.slice(0, 500),
        repairedPreview: cleaned.slice(0, 500),
        endpoint: 'analysis',
      });
      throw new Error(
        `Gemini ha restituito una risposta non valida. Riprova.`,
      );
    }
  }
}

/**
 * Streaming Gemini call for text generation.
 * Returns a ReadableStream of text chunks.
 *
 * Uses the ?alt=sse parameter for Server-Sent Events format.
 */
export async function streamGeminiMessage(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ReadableStream<string>> {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;

  // Timeout covers TTFB only — once headers arrive, the timeout clears.
  // Stream duration is governed by CF Workers' own limits, not this timeout.
  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiRequest(systemPrompt, userPrompt, {
        temperature: 0.9,
        maxTokens: 1024,
        jsonMode: false,
      })),
    },
    15_000, // 15s TTFB timeout — cleared once headers arrive, stream continues
    1,
    signal,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini streaming error (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error('Gemini streaming: no response body');
  }

  // Transform the Gemini SSE stream into plain text chunks
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let sseBuffer = '';

  return new ReadableStream<string>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Flush remaining buffer
          if (sseBuffer.trim()) {
            processSSELines(sseBuffer.split('\n'), controller);
          }
          controller.close();
          return;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        // Keep the last (possibly incomplete) line in buffer
        sseBuffer = lines.pop() ?? '';
        processSSELines(lines, controller);
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() {
      reader.cancel();
    },
  });}

/** Parse SSE data lines and enqueue text from Gemini responses. */
function processSSELines(
  lines: string[],
  controller: ReadableStreamDefaultController<string>,
): void {
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const jsonStr = line.slice(6).trim();
    if (!jsonStr || jsonStr === '[DONE]') continue;

    try {
      const parsed = JSON.parse(jsonStr) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        controller.enqueue(text);
      }
    } catch {
      // Skip unparseable chunks
    }
  }
}
