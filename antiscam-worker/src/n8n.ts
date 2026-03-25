/**
 * N8N webhook client for antiscam-worker.
 *
 * callN8NWebhook() POSTs { attackType, difficulty } to an N8N workflow that
 * calls Gemini via Google AI Studio and returns a validated SimulationOutput.
 *
 * The webhook URL is injected via Cloudflare secret N8N_WEBHOOK_URL — never
 * hardcoded. Set with: wrangler secret put N8N_WEBHOOK_URL
 *
 * Timeout: 25s (AbortController) — leaves 4s headroom inside the 30s Worker limit.
 *
 * id and icon are overwritten post-parse with deterministic values so the
 * N8N/Gemini pipeline cannot hallucinate them.
 *
 * ⚠️  NOTA ARCHITETTURALE: il prompt per Gemini NON viene costruito da questo
 * Worker — vive nel nodo Gemini del workflow N8N. Il file prompt.ts è la
 * SPEC ufficiale del prompt: quando aggiorni le regole lì, devi replicare
 * le stesse modifiche manualmente nel nodo N8N.
 *
 * I2 RULE (aggiornamento richiesto in N8N):
 *   Ogni SimChoice deve avere ESATTAMENTE 2 opzioni correct:true con skill
 *   diverse. Vedi buildSystemPrompt() in prompt.ts per il testo aggiornato.
 */

import { SimulationSchema, type SimulationOutput } from './schema';
import { ATTACK_ICONS } from './prompt';
import type { AttackType, Difficulty } from './types';
import { createCircuitBreaker } from './circuit-breaker';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 25_000;

// ── Typed errors ──────────────────────────────────────────────────────────────

export class N8NTimeoutError extends Error {
  override readonly name = 'N8NTimeoutError' as const;
  constructor() {
    super(`N8N webhook timed out after ${TIMEOUT_MS}ms`);
  }
}

export class N8NApiError extends Error {
  override readonly name = 'N8NApiError' as const;
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`N8N webhook error ${status}: ${body.slice(0, 200)}`);
  }
}

export class N8NValidationError extends Error {
  override readonly name = 'N8NValidationError' as const;
  constructor(detail?: string) {
    super(detail ? `Validation failed: ${detail}` : 'N8N webhook response failed schema validation');
  }
}

export class N8NCircuitOpenError extends Error {
  override readonly name = 'N8NCircuitOpenError' as const;
  constructor() {
    super('N8N circuit breaker is open — service temporarily unavailable');
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Overwrite id and icon with deterministic values before Zod parse. */
function patchFixedFields(raw: unknown, attackType: AttackType): void {
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    obj['id'] = attackType;
    obj['icon'] = ATTACK_ICONS[attackType];
  }
}

// ── Circuit breaker (per-isolate, see circuit-breaker.ts for caveats) ────────

const simulationCircuitBreaker = createCircuitBreaker('n8n-simulation');

// ── Public API ────────────────────────────────────────────────────────────────

export async function callN8NWebhook(
  attackType: AttackType,
  difficulty: Difficulty,
  webhookUrl: string,
): Promise<SimulationOutput> {
  if (simulationCircuitBreaker.isOpen()) throw new N8NCircuitOpenError();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attackType, difficulty }),
      signal: controller.signal,
    });
  } catch (e) {
    simulationCircuitBreaker.recordFailure();
    if (e instanceof Error && e.name === 'AbortError') throw new N8NTimeoutError();
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  if (!response.ok) {
    if (response.status >= 500) simulationCircuitBreaker.recordFailure();
    throw new N8NApiError(response.status, text);
  }

  simulationCircuitBreaker.recordSuccess();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new N8NApiError(200, `Non-JSON response: ${text.slice(0, 200)}`);
  }

  patchFixedFields(parsed, attackType);

  const result = SimulationSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new N8NValidationError();
}
