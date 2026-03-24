/**
 * Direct Gemini API client for SSE streaming in training endpoints.
 *
 * Bypasses N8N for latency-sensitive calls. Two functions:
 * - callGeminiAnalysis: non-streaming, returns structured JSON (behavior scores)
 * - streamGeminiMessage: streaming, yields text chunks (scammer reply)
 *
 * Uses Gemini 2.5 Flash for speed.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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
): Promise<T> {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildGeminiRequest(systemPrompt, userPrompt, {
      temperature: 0.5,
      maxTokens: 1024,
      jsonMode: true,
    })),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

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

  return JSON.parse(cleaned) as T;
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
): Promise<ReadableStream<string>> {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildGeminiRequest(systemPrompt, userPrompt, {
      temperature: 0.9,
      maxTokens: 512,
      jsonMode: false,
    })),
  });

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

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE format: "data: {...}\n\n"
      const lines = chunk.split('\n');
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
    },
    cancel() {
      reader.cancel();
    },
  });
}
