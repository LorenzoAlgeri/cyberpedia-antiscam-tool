/**
 * Worker-side types for antiscam-worker.
 *
 * Intentionally separate from frontend types (src/types/simulation.ts).
 * The Worker validates its own request/response surface independently.
 */

// ── Cloudflare Worker environment ─────────────────────────────────────────────

export interface Env {
  /** KV namespace for caching generated simulations (max 12 combinations) */
  ANTISCAM_SIMULATIONS_CACHE: KVNamespace;
  /** KV namespace for per-IP rate limiting (separate from cache — different TTL/quota) */
  ANTISCAM_RATELIMIT: KVNamespace;
  /** N8N webhook URL — injected via: wrangler secret put N8N_WEBHOOK_URL */
  N8N_WEBHOOK_URL: string;
  /** N8N training webhook URL — injected via: wrangler secret put N8N_TRAINING_WEBHOOK_URL */
  N8N_TRAINING_WEBHOOK_URL: string;
  /** Gemini API key for direct streaming calls — injected via: wrangler secret put GEMINI_API_KEY */
  GEMINI_API_KEY: string;
  /** KV namespace for lead capture form submissions */
  ANTISCAM_LEADS: KVNamespace;
  /** KV namespace for aggregated anonymous analytics counters */
  ANTISCAM_ANALYTICS: KVNamespace;
}

// ── Request validation ────────────────────────────────────────────────────────

export const VALID_ATTACK_TYPES = [
  'romance-scam',
  'urgent-loan',
  'fake-bank-operator',
  'fake-relative',
] as const;

export type AttackType = (typeof VALID_ATTACK_TYPES)[number];

export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type Difficulty = (typeof VALID_DIFFICULTIES)[number];

export interface GenerateRequest {
  readonly attackType: AttackType;
  readonly difficulty?: Difficulty;
}

// ── Error response ────────────────────────────────────────────────────────────

export interface ErrorResponse {
  readonly error: string;
}
