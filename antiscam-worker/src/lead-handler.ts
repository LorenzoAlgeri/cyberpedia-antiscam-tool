/**
 * Lead capture handler — stores pre-conference signups in KV.
 *
 * POST /api/lead
 * Body: { name: string, email: string, role: string, note?: string, consent: boolean }
 *
 * Validation:
 * - name: required, 1-100 chars
 * - email: required, valid email format, max 254 chars
 * - role: required, one of predefined values
 * - note: optional, max 500 chars
 * - consent: must be true (GDPR)
 *
 * Storage: KV key = "lead:{timestamp}:{emailHash}" to prevent exact dupes
 * Rate limit: 10/hour per IP via existing checkRateLimit
 */

import { getCorsHeaders } from './cors';
import { checkRateLimit } from './ratelimit';
import type { Env } from './types';

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_ROLES = [
  'docente',
  'studente',
  'professionista-it',
  'forze-ordine',
  'altro',
] as const;

type Role = (typeof VALID_ROLES)[number];

/** Lightweight email regex — covers the vast majority of real addresses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_PER_IP = 10;
const RATE_LIMIT_PREFIX = 'lead';

// ── Types ────────────────────────────────────────────────────────────────────

interface LeadPayload {
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly note?: string;
  readonly consent: boolean;
}

interface StoredLead {
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly note?: string | undefined;
  readonly submittedAt: string;
  readonly ip: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For') ??
    'unknown'
  );
}

function jsonError(
  message: string,
  status: number,
  cors: Record<string, string>,
): Response {
  return Response.json({ error: message }, { status, headers: cors });
}

/**
 * Produce a hex-encoded SHA-256 hash of the given string.
 * Used to derive a deterministic, non-reversible key suffix from an email.
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handleLead(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = getIP(request);
  const rateResult = await checkRateLimit(
    env.ANTISCAM_RATELIMIT,
    ip,
    RATE_LIMIT_PER_IP,
    RATE_LIMIT_PREFIX,
  );
  if (!rateResult.allowed) {
    return jsonError('Too many requests. Please try again later.', 429, {
      ...cors,
      'Retry-After': String(rateResult.retryAfter ?? 3600),
    });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  if (typeof body !== 'object' || body === null) {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<LeadPayload>;

  // ── Validate name ────────────────────────────────────────────────────────
  if (
    !parsed.name ||
    typeof parsed.name !== 'string' ||
    parsed.name.trim().length === 0 ||
    parsed.name.length > 100
  ) {
    return jsonError('Invalid or missing field: name (1-100 chars)', 422, cors);
  }

  // ── Validate email ───────────────────────────────────────────────────────
  if (
    !parsed.email ||
    typeof parsed.email !== 'string' ||
    parsed.email.length > 254 ||
    !EMAIL_RE.test(parsed.email)
  ) {
    return jsonError('Invalid or missing field: email', 422, cors);
  }

  // ── Validate role ────────────────────────────────────────────────────────
  if (
    !parsed.role ||
    typeof parsed.role !== 'string' ||
    !(VALID_ROLES as readonly string[]).includes(parsed.role)
  ) {
    return jsonError(
      `Invalid or missing field: role. Valid values: ${VALID_ROLES.join(', ')}`,
      422,
      cors,
    );
  }

  // ── Validate note (optional) ─────────────────────────────────────────────
  if (parsed.note !== undefined && parsed.note !== null) {
    if (typeof parsed.note !== 'string' || parsed.note.length > 500) {
      return jsonError('Field note must be a string of max 500 chars', 422, cors);
    }
  }

  // ── Validate consent (GDPR) ──────────────────────────────────────────────
  if (parsed.consent !== true) {
    return jsonError('Consent is required (consent must be true)', 422, cors);
  }

  // ── Build KV key (dedup by email hash) ───────────────────────────────────
  const emailNormalized = parsed.email.trim().toLowerCase();
  const emailHash = await sha256Hex(emailNormalized);
  const timestamp = Date.now();
  const kvKey = `lead:${timestamp}:${emailHash}`;

  // ── Store in KV ──────────────────────────────────────────────────────────
  const storedLead: StoredLead = {
    name: parsed.name.trim(),
    email: emailNormalized,
    role: parsed.role as Role,
    note: parsed.note?.trim() || undefined,
    submittedAt: new Date(timestamp).toISOString(),
    ip,
  };

  try {
    await env.ANTISCAM_LEADS.put(kvKey, JSON.stringify(storedLead), {
      // Keep leads for 90 days (auto-cleanup)
      expirationTtl: 90 * 24 * 60 * 60,
    });
  } catch (e) {
    console.error(JSON.stringify({
      level: 'error',
      handler: 'handleLead',
      error: e instanceof Error ? e.message : String(e),
    }));
    return jsonError('Internal server error', 500, cors);
  }

  console.log(JSON.stringify({
    level: 'info',
    handler: 'handleLead',
    action: 'lead_stored',
    kvKey,
    role: parsed.role,
  }));

  return Response.json(
    { success: true },
    { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
}
