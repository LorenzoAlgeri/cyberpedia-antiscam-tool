/**
 * ============================================================================
 * TODO(ops) — AZIONI MANUALI DA COMPLETARE PRIMA DEL LANCIO IN PRODUZIONE
 *
 * 1. Upgrade Cloudflare Workers a piano Paid ($5/mese)
 *    Senza upgrade: max ~250 req/day per KV write limit.
 *    Guida: .planning/ops/verify-cf-plan.md
 *
 * 2. Upgrade Gemini API a Pay-as-you-go (abilita billing su Google Cloud)
 *    Senza upgrade: max ~7 utenti/minuto (15 RPM free tier).
 *    Guida: .planning/ops/verify-gemini-tier.md
 *
 * 3. Configurare WAF Rate Limiting Rules su Cloudflare Dashboard
 *    Una volta fatto, il KV rate limiter puo essere rimosso dal codice.
 *    Guida: .planning/ops/setup-waf-rate-limiting.md
 * ============================================================================
 */

/**
 * antiscam-worker — Cloudflare Worker entry point.
 *
 * Routes:
 *   POST /api/generate-simulation   Generate or serve cached simulation
 *   POST /api/lead                  Store pre-conference lead capture submission
 *   POST /api/training/start        Start AI training session
 *   POST /api/training/message      Send user message, get AI response + scores
 *   POST /api/training/reflect      Submit reflection answer, get AI analysis
 *   POST /api/analytics/batch       Receive anonymous analytics events (aggregated in KV)
 *   OPTIONS *                       CORS preflight
 *
 * Middleware order per request:
 *   CORS → Rate Limit → Cache check → Gemini → Cache set → Response
 *
 * Error mapping:
 *   Rate limit exceeded → 429 Too Many Requests  (Retry-After header)
 *   N8NTimeoutError     → 408 Request Timeout
 *   N8NValidationError  → 422 Unprocessable Entity
 *   N8NApiError         → 502 Bad Gateway
 */

import { getCorsHeaders, handlePreflight } from './cors';
import {
  VALID_ATTACK_TYPES,
  VALID_DIFFICULTIES,
  type Env,
  type AttackType,
  type Difficulty,
  type GenerateRequest,
} from './types';
import { getCached, setCache } from './cache';
import { checkRateLimit } from './ratelimit';
import {
  callN8NWebhook,
  N8NTimeoutError,
  N8NApiError,
  N8NValidationError,
  N8NCircuitOpenError,
} from './n8n';
import { handleTraining } from './training-handler';
import { handleLead } from './lead-handler';
import { handleAnalytics } from './analytics-handler';
import { logger } from './logger';

// ── Handler ───────────────────────────────────────────────────────────────────

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, ip, 100, 'generate');
  if (!rateResult.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { ...cors, 'Retry-After': String(rateResult.retryAfter ?? 3600) } },
    );
  }

  // ── Input validation ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
  }

  const parsed = body as Partial<GenerateRequest>;

  if (!parsed.attackType || typeof parsed.attackType !== 'string') {
    return Response.json(
      { error: 'Missing required field: attackType (string)' },
      { status: 422, headers: cors },
    );
  }

  if (!(VALID_ATTACK_TYPES as readonly string[]).includes(parsed.attackType)) {
    return Response.json(
      { error: `Unknown attackType. Valid values: ${VALID_ATTACK_TYPES.join(', ')}` },
      { status: 422, headers: cors },
    );
  }

  const attackType = parsed.attackType as AttackType;
  const difficulty: Difficulty =
    parsed.difficulty && (VALID_DIFFICULTIES as readonly string[]).includes(parsed.difficulty)
      ? parsed.difficulty
      : 'medium';

  // ── Cache check ────────────────────────────────────────────────────────────
  const cached = await getCached(env.ANTISCAM_SIMULATIONS_CACHE, attackType, difficulty);
  if (cached !== null) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  // ── Gemini generation ──────────────────────────────────────────────────────
  let simulation: Awaited<ReturnType<typeof callN8NWebhook>>;
  try {
    simulation = await callN8NWebhook(attackType, difficulty, env.N8N_WEBHOOK_URL);
  } catch (e) {
    if (e instanceof N8NCircuitOpenError) {
      return Response.json(
        { error: 'Service temporarily unavailable. Please try again in a minute.' },
        { status: 503, headers: cors },
      );
    }
    if (e instanceof N8NTimeoutError) {
      return Response.json(
        { error: 'Generation timed out. Please retry.' },
        { status: 408, headers: cors },
      );
    }
    if (e instanceof N8NValidationError) {
      return Response.json(
        { error: 'Generated content failed validation. Please retry.' },
        { status: 422, headers: cors },
      );
    }
    if (e instanceof N8NApiError) {
      return Response.json(
        { error: 'Upstream error. Please retry later.' },
        { status: 502, headers: cors },
      );
    }
    // Unexpected error — log and return generic message
    logger.error('request.error', {
      endpoint: '/api/generate-simulation',
      error: e instanceof Error ? e.message : String(e),
    });
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: cors },
    );
  }

  // ── Cache set + response ───────────────────────────────────────────────────
  await setCache(env.ANTISCAM_SIMULATIONS_CACHE, attackType, difficulty, simulation);

  return new Response(JSON.stringify(simulation), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json', 'X-Cache': 'MISS', 'X-Source': 'gemini' },
  });
}

// ── Worker export ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    const url = new URL(request.url);
    const endpoint = url.pathname;

    try {
      if (request.method === 'OPTIONS') return handlePreflight(request);

      if (endpoint === '/api/generate-simulation') {
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', {
            status: 405,
            headers: { Allow: 'POST, OPTIONS', ...getCorsHeaders(request) },
          });
        }
        return handleGenerate(request, env);
      }

      // Lead capture endpoint — /api/lead
      if (endpoint === '/api/lead') {
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', {
            status: 405,
            headers: { Allow: 'POST, OPTIONS', ...getCorsHeaders(request) },
          });
        }
        return handleLead(request, env);
      }

      // Analytics batch endpoint — /api/analytics/batch
      if (endpoint === '/api/analytics/batch') {
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', {
            status: 405,
            headers: { Allow: 'POST, OPTIONS', ...getCorsHeaders(request) },
          });
        }
        return handleAnalytics(request, env);
      }

      // Training endpoints — /api/training/*
      if (endpoint.startsWith('/api/training/')) {
        return handleTraining(request, env, endpoint);
      }

      return new Response('Not Found', { status: 404, headers: getCorsHeaders(request) });
    } catch (e) {
      logger.error('request.error', {
        endpoint,
        durationMs: Date.now() - start,
        error: e instanceof Error ? e.message : String(e),
      });
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: getCorsHeaders(request) },
      );
    }
  },
} satisfies ExportedHandler<Env>;
