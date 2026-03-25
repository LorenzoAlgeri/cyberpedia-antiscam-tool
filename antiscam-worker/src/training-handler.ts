/**
 * Request handlers for /api/training/* endpoints.
 *
 * Three endpoints:
 * - POST /api/training/start   → Start a new training session
 * - POST /api/training/message → Send user message, get AI response + scores
 * - POST /api/training/reflect → Submit reflection answer, get AI analysis
 *
 * Rate limits (per IP per hour):
 * - /start:   5  (expensive — generates scenario)
 * - /message: 30 (each turn is a call)
 * - /reflect: 20 (reflection questions)
 */

import { getCorsHeaders } from './cors';
import { checkRateLimit } from './ratelimit';
import { N8NTimeoutError, N8NApiError, N8NValidationError } from './n8n';
import { callTrainingStart, callTrainingMessage, callTrainingReflect } from './training-n8n';
import { callGeminiAnalysis, streamGeminiMessage } from './training-gemini';
import {
  buildAnalysisOnlySystemPrompt,
  buildAnalysisOnlyUserPrompt,
  buildScammerMessageSystemPrompt,
  buildScammerMessageUserPrompt,
} from './training-prompt';
import { SendMessageResponseSchema } from './training-schema';
import {
  VALID_TRAINING_ATTACK_TYPES,
  VALID_TRAINING_TARGETS,
  VALID_DIFFICULTIES,
  type TrainingAttackType,
  type Difficulty,
  type TrainingTarget,
  type ScammerGender,
  type StartSessionRequest,
  type SendMessageRequest,
  type ReflectionRequest,
  type ReflectionStep,
  type ScenarioConfig,
  type NarrativePhase,
} from './training-types';
import type { Env } from './types';

// ── Rate limit config per endpoint ───────────────────────────────────────────

// Rate limits per hour per IP — generous for normal use, protects against abuse
// A typical session = 1 start + 7 messages + 4 reflections = 12 requests
// 500 messages/hour supports ~70 complete sessions/hour per IP
const RATE_LIMITS: Record<string, number> = {
  start: 50,
  message: 500,
  reflect: 200,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize scenarioConfig to ensure trainingTargets (plural) always exists.
 * The /start endpoint's Gemini prompt + Zod schema only produces trainingTarget (singular),
 * so when the frontend sends the config back, trainingTargets may be missing.
 */
function normalizeScenarioConfig(config: Record<string, unknown>): void {
  if (!Array.isArray(config.trainingTargets) || config.trainingTargets.length === 0) {
    const singular = typeof config.trainingTarget === 'string' && config.trainingTarget
      ? config.trainingTarget
      : 'urgency';
    config.trainingTargets = [singular];
  }
  // Ensure scammerPersona exists with fallback values
  if (!config.scammerPersona || typeof config.scammerPersona !== 'object') {
    config.scammerPersona = { name: 'Sconosciuto', role: 'contatto', tone: 'amichevole' };
  } else {
    const persona = config.scammerPersona as Record<string, unknown>;
    if (!persona.name) persona.name = 'Sconosciuto';
    if (!persona.role) persona.role = 'contatto';
    if (!persona.tone) persona.tone = 'amichevole';
  }
}

function getIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

function jsonError(
  message: string,
  status: number,
  cors: Record<string, string>,
): Response {
  return Response.json({ error: message }, { status, headers: cors });
}

async function parseBody(request: Request): Promise<unknown> {
  return request.json();
}

function mapN8NError(e: unknown, cors: Record<string, string>): Response {
  if (e instanceof N8NTimeoutError) {
    return jsonError('Generation timed out. Please retry.', 408, cors);
  }
  if (e instanceof N8NValidationError) {
    console.error(JSON.stringify({ level: 'warn', handler: 'mapN8NError', detail: e.message }));
    return jsonError('AI response failed validation. Please retry.', 422, cors);
  }
  if (e instanceof N8NApiError) {
    console.error(JSON.stringify({ level: 'error', handler: 'mapN8NError', status: e.status, detail: e.body?.slice(0, 200) }));
    return jsonError('Upstream error. Please retry later.', 502, cors);
  }
  // Unexpected error — log and return generic
  const detail = e instanceof Error ? e.message : String(e);
  console.error(JSON.stringify({ level: 'error', handler: 'mapN8NError.unknown', error: detail }));
  return jsonError('Internal server error', 500, cors);
}

// ── Endpoint: /api/training/start ────────────────────────────────────────────

async function handleStart(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // Rate limit: 5/h
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, getIP(request), RATE_LIMITS.start, 'training-start');
  if (!rateResult.allowed) {
    return jsonError('Too many requests. Please try again later.', 429, {
      ...cors,
      'Retry-After': String(rateResult.retryAfter ?? 3600),
    });
  }

  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<StartSessionRequest>;

  // Validate attackType
  if (
    !parsed.attackType ||
    typeof parsed.attackType !== 'string' ||
    !(VALID_TRAINING_ATTACK_TYPES as readonly string[]).includes(parsed.attackType)
  ) {
    return jsonError(
      `Invalid attackType. Valid: ${VALID_TRAINING_ATTACK_TYPES.join(', ')}`,
      422,
      cors,
    );
  }

  // Validate difficulty (default: medium)
  const difficulty: Difficulty =
    parsed.difficulty &&
    typeof parsed.difficulty === 'string' &&
    (VALID_DIFFICULTIES as readonly string[]).includes(parsed.difficulty)
      ? (parsed.difficulty as Difficulty)
      : 'medium';

  // Validate trainingTargets array
  let trainingTargets: TrainingTarget[];
  const rawTargets = (parsed as Record<string, unknown>).trainingTargets;
  if (Array.isArray(rawTargets) && rawTargets.length > 0) {
    trainingTargets = (rawTargets as unknown[])
      .filter((t): t is string => typeof t === 'string' && (VALID_TRAINING_TARGETS as readonly string[]).includes(t))
      .slice(0, 3) as TrainingTarget[];
    if (trainingTargets.length === 0) trainingTargets = ['urgency'];
  } else if (
    (parsed as Record<string, unknown>).trainingTarget &&
    typeof (parsed as Record<string, unknown>).trainingTarget === 'string' &&
    (VALID_TRAINING_TARGETS as readonly string[]).includes((parsed as Record<string, unknown>).trainingTarget as string)
  ) {
    trainingTargets = [(parsed as Record<string, unknown>).trainingTarget as TrainingTarget];
  } else {
    trainingTargets = ['urgency'];
  }

  // Extract scammerGender
  const rawGender = (parsed as Record<string, unknown>).scammerGender;
  const scammerGender: ScammerGender = (rawGender === 'male' || rawGender === 'female') ? rawGender : 'unspecified';

  // Extract optional custom fields (sanitized with strict length limits)
  const customDescription = typeof parsed.customDescription === 'string' && parsed.customDescription.trim().length > 0
    ? parsed.customDescription.slice(0, 500)
    : undefined;
  let customPersona: { name: string; role: string; tone: string } | undefined;
  if (parsed.customPersona && typeof parsed.customPersona === 'object') {
    const p = parsed.customPersona as Record<string, unknown>;
    if (
      typeof p.name === 'string' && p.name.length <= 100 &&
      typeof p.role === 'string' && p.role.length <= 200 &&
      typeof p.tone === 'string' && p.tone.length <= 200
    ) {
      customPersona = { name: p.name, role: p.role, tone: p.tone };
    }
  }

  try {
    const result = await callTrainingStart(
      {
        attackType: parsed.attackType as TrainingAttackType,
        difficulty,
        trainingTargets,
        scammerGender,
        customDescription,
        customPersona,
      },
      env.N8N_TRAINING_WEBHOOK_URL,
    );

    // Ensure trainingTargets is present in the returned scenarioConfig
    // (Gemini/Zod only produce trainingTarget singular — we add the plural array)
    const enrichedConfig = {
      ...result.scenarioConfig,
      trainingTargets: trainingTargets,
    };

    return Response.json(
      { ...result, scenarioConfig: enrichedConfig },
      {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      },
    );
  } catch (e) {
    return mapN8NError(e, cors);
  }
}

// ── Endpoint: /api/training/message ──────────────────────────────────────────

async function handleMessage(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // Rate limit: 30/h
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, getIP(request), RATE_LIMITS.message, 'training-msg');
  if (!rateResult.allowed) {
    return jsonError('Too many requests. Please try again later.', 429, {
      ...cors,
      'Retry-After': String(rateResult.retryAfter ?? 3600),
    });
  }

  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<SendMessageRequest>;

  if (!parsed.scenarioConfig || typeof parsed.scenarioConfig !== 'object') {
    return jsonError('Missing required field: scenarioConfig', 422, cors);
  }
  if (!parsed.userMessage || typeof parsed.userMessage !== 'string' || parsed.userMessage.trim().length === 0) {
    return jsonError('Missing required field: userMessage', 422, cors);
  }
  if (parsed.userMessage.length > 2000) {
    return jsonError('userMessage must be 2000 characters or less', 422, cors);
  }
  if (!Array.isArray(parsed.conversationHistory)) {
    return jsonError('Missing required field: conversationHistory', 422, cors);
  }
  if (parsed.conversationHistory.length > 80) {
    return jsonError('conversationHistory too long (max 80 turns)', 422, cors);
  }

  normalizeScenarioConfig(parsed.scenarioConfig as unknown as Record<string, unknown>);
  const scenarioConfig = parsed.scenarioConfig as SendMessageRequest['scenarioConfig'];
  const conversationHistory = parsed.conversationHistory as SendMessageRequest['conversationHistory'];
  const turnCount = typeof parsed.turnCount === 'number' ? parsed.turnCount : conversationHistory.length;

  // Count user turns only (for maxTurns enforcement)
  const userTurnCount = conversationHistory.filter(
    (t: { role?: string }) => t.role === 'user',
  ).length + 1; // +1 for the current message being sent

  try {
    const result = await callTrainingMessage(
      {
        scenarioConfig,
        conversationHistory,
        userMessage: parsed.userMessage,
        turnCount,
      },
      env.N8N_TRAINING_WEBHOOK_URL,
    );

    // Safety net: if AI didn't interrupt but maxTurns reached, force it
    const maxTurns = (scenarioConfig as { maxTurns?: number }).maxTurns ?? 7;
    if (!result.shouldInterrupt && userTurnCount >= maxTurns) {
      return Response.json(
        {
          ...result,
          shouldInterrupt: true,
          interruptReason: 'max_turns' as const,
        },
        {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        },
      );
    }

    return Response.json(result, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return mapN8NError(e, cors);
  }
}

// ── Endpoint: /api/training/reflect ──────────────────────────────────────────

const VALID_REFLECTION_STEPS = ['R1', 'R2', 'R3', 'R4'] as const;

async function handleReflect(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // Rate limit: 20/h
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, getIP(request), RATE_LIMITS.reflect, 'training-ref');
  if (!rateResult.allowed) {
    return jsonError('Too many requests. Please try again later.', 429, {
      ...cors,
      'Retry-After': String(rateResult.retryAfter ?? 3600),
    });
  }

  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<ReflectionRequest>;

  if (!parsed.scenarioConfig || typeof parsed.scenarioConfig !== 'object') {
    return jsonError('Missing required field: scenarioConfig', 422, cors);
  }
  if (!parsed.triggerMessage || typeof parsed.triggerMessage !== 'string' || parsed.triggerMessage.trim().length === 0) {
    return jsonError('Missing required field: triggerMessage', 422, cors);
  }
  if (parsed.triggerMessage.length > 2000) {
    return jsonError('triggerMessage must be 2000 characters or less', 422, cors);
  }
  if (
    !parsed.reflectionStep ||
    typeof parsed.reflectionStep !== 'string' ||
    !(VALID_REFLECTION_STEPS as readonly string[]).includes(parsed.reflectionStep)
  ) {
    return jsonError(`Invalid reflectionStep. Valid: ${VALID_REFLECTION_STEPS.join(', ')}`, 422, cors);
  }
  if (!parsed.userAnswer || typeof parsed.userAnswer !== 'string' || parsed.userAnswer.trim().length === 0) {
    return jsonError('Missing required field: userAnswer', 422, cors);
  }
  if (parsed.userAnswer.length > 2000) {
    return jsonError('userAnswer must be 2000 characters or less', 422, cors);
  }

  normalizeScenarioConfig(parsed.scenarioConfig as unknown as Record<string, unknown>);

  try {
    const result = await callTrainingReflect(
      {
        scenarioConfig: parsed.scenarioConfig as ReflectionRequest['scenarioConfig'],
        triggerMessage: parsed.triggerMessage,
        reflectionStep: parsed.reflectionStep as ReflectionStep,
        userAnswer: parsed.userAnswer,
        previousReflections: Array.isArray(parsed.previousReflections) && parsed.previousReflections.length <= 10
          ? (parsed.previousReflections as ReflectionRequest['previousReflections'])
          : [],
      },
      env.N8N_TRAINING_WEBHOOK_URL,
    );

    return Response.json(result, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return mapN8NError(e, cors);
  }
}

// ── Endpoint: /api/training/message-stream (SSE) ─────────────────────────────

/** SSE helper: format an event */
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function handleMessageStream(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // Rate limit (same as /message)
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, getIP(request), RATE_LIMITS.message, 'training-msg');
  if (!rateResult.allowed) {
    return jsonError('Troppe richieste. Attendi qualche minuto.', 429, {
      ...cors,
      'Retry-After': String(rateResult.retryAfter ?? 60),
    });
  }

  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<SendMessageRequest>;

  if (!parsed.scenarioConfig || typeof parsed.scenarioConfig !== 'object') {
    return jsonError('Missing scenarioConfig', 422, cors);
  }
  if (!parsed.userMessage || typeof parsed.userMessage !== 'string' || parsed.userMessage.trim().length === 0 || parsed.userMessage.length > 2000) {
    return jsonError('Invalid userMessage (1-2000 chars required)', 422, cors);
  }
  if (!Array.isArray(parsed.conversationHistory) || parsed.conversationHistory.length > 80) {
    return jsonError('Invalid conversationHistory', 422, cors);
  }

  // Normalize scenarioConfig to fill in trainingTargets + scammerPersona
  normalizeScenarioConfig(parsed.scenarioConfig as unknown as Record<string, unknown>);
  const scenarioConfig = parsed.scenarioConfig as ScenarioConfig;
  const conversationHistory = parsed.conversationHistory as SendMessageRequest['conversationHistory'];
  const userMessage = parsed.userMessage;
  const turnCount = typeof parsed.turnCount === 'number' ? parsed.turnCount : conversationHistory.length;

  // Count user turns for maxTurns enforcement
  const userTurnCount = conversationHistory.filter(
    (t: { role?: string }) => t.role === 'user',
  ).length + 1;

  // SSE response stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const write = (text: string) => writer.write(encoder.encode(text));

  // Start async processing
  const processStream = async () => {
    let sentDone = false;
    try {
      // Phase 1: Behavior analysis (non-streaming, fast)
      const analysisSystemPrompt = buildAnalysisOnlySystemPrompt(scenarioConfig);
      const analysisUserPrompt = buildAnalysisOnlyUserPrompt(
        conversationHistory, userMessage, turnCount,
      );

      let analysis: {
        behaviorScores: { activation: number; impulsivity: number; verification: number; awareness: number; riskScore: number };
        shouldInterrupt: boolean;
        interruptReason?: string;
        nextPhase: string;
      };

      try {
        analysis = await callGeminiAnalysis(
          analysisSystemPrompt, analysisUserPrompt, env.GEMINI_API_KEY,
        );
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        console.error(JSON.stringify({ level: 'error', handler: 'messageStream.analysis', error: detail }));
        await write(sseEvent('error', { error: 'Errore durante l\'analisi. Riprova.' }));
        return; // finally sends done + closes writer
      }

      // MaxTurns safety net
      const maxTurns = (scenarioConfig as { maxTurns?: number }).maxTurns ?? 7;
      if (!analysis.shouldInterrupt && userTurnCount >= maxTurns) {
        analysis.shouldInterrupt = true;
        analysis.interruptReason = 'max_turns';
      }

      // Send scores to client
      await write(sseEvent('scores', {
        behaviorScores: analysis.behaviorScores,
        shouldInterrupt: analysis.shouldInterrupt,
        interruptReason: analysis.interruptReason,
        nextPhase: analysis.nextPhase,
      }));

      // If interrupted, send a short final message and stop
      if (analysis.shouldInterrupt) {
        // Generate a brief closing message
        const msgPrompt = buildScammerMessageSystemPrompt(
          scenarioConfig, analysis.nextPhase as NarrativePhase,
        );
        const msgUserPrompt = buildScammerMessageUserPrompt(
          conversationHistory, userMessage, turnCount,
        );

        try {
          const msgStream = await streamGeminiMessage(msgPrompt, msgUserPrompt, env.GEMINI_API_KEY);
          const reader = msgStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await write(sseEvent('token', { text: value }));
          }
        } catch {
          // If message generation fails, still send done — scores are more important
        }

        await write(sseEvent('done', {}));
        sentDone = true;
        return; // finally closes writer
      }

      // Phase 2: Scammer message (streaming)
      const msgSystemPrompt = buildScammerMessageSystemPrompt(
        scenarioConfig, analysis.nextPhase as NarrativePhase,
      );
      const msgUserPrompt = buildScammerMessageUserPrompt(
        conversationHistory, userMessage, turnCount,
      );

      try {
        const textStream = await streamGeminiMessage(
          msgSystemPrompt, msgUserPrompt, env.GEMINI_API_KEY,
        );
        const reader = textStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await write(sseEvent('token', { text: value }));
        }
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        console.error(JSON.stringify({ level: 'error', handler: 'messageStream.scammerMsg', error: detail }));
        await write(sseEvent('error', { error: 'Errore durante la generazione del messaggio. Riprova.' }));
      }

      await write(sseEvent('done', {}));
      sentDone = true;
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ level: 'error', handler: 'messageStream.outer', error: detail }));
      try {
        await write(sseEvent('error', { error: 'Errore interno del server.' }));
      } catch {
        // Writer may be closed
      }
    } finally {
      // Always send done so frontend never gets stuck on "sta scrivendo..."
      if (!sentDone) {
        try { await write(sseEvent('done', {})); } catch { /* writer closed */ }
      }
      try { await writer.close(); } catch { /* already closed */ }
    }
  };

  // Fire and forget — the stream processes asynchronously
  void processStream();

  return new Response(readable, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ── Router ───────────────────────────────────────────────────────────────────

/** Route /api/training/* requests to the appropriate handler. */
export async function handleTraining(
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response> {
  const cors = getCorsHeaders(request);

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST, OPTIONS', ...cors },
    });
  }

  switch (pathname) {
    case '/api/training/start':
      return handleStart(request, env);
    case '/api/training/message':
      return handleMessage(request, env);
    case '/api/training/message-stream':
      return handleMessageStream(request, env);
    case '/api/training/reflect':
      return handleReflect(request, env);
    default:
      return new Response('Not Found', { status: 404, headers: cors });
  }
}
