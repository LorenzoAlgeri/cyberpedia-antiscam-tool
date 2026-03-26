/**
 * Feedback/bug-report handler — receives user feedback and notifies via Telegram + Resend email.
 *
 * POST /api/feedback
 * Body: { category?, message?, contact?, screenshots?: string[], page?, userAgent? }
 *
 * Validation:
 * - All fields optional, but at least one content field must be present
 * - category: one of 'bug' | 'fix-suggestion' | 'improvement' | 'general'
 * - message: max 2000 chars
 * - contact: max 254 chars
 * - screenshots: array of base64 data URIs, max 10
 *
 * Storage: KV key = "feedback:{timestamp}:{hash}" with 90-day TTL
 * Notifications: Telegram + Resend email (fire-and-forget via feedback-notify.ts)
 */

import { getCorsHeaders } from './cors';
import { checkRateLimit } from './ratelimit';
import type { Env } from './types';
import { logger } from './logger';
import { getIP, jsonError, sha256Hex } from './helpers';
import { notifyTelegram, notifyResend } from './feedback-notify';

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['bug', 'fix-suggestion', 'improvement', 'general'] as const;
type FeedbackCategory = (typeof VALID_CATEGORIES)[number];

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  'bug': 'Ho trovato un errore',
  'fix-suggestion': 'Qualcosa non funziona bene',
  'improvement': 'Suggerimento per migliorare',
  'general': 'Feedback generico',
};

const MAX_MESSAGE = 2000;
const MAX_CONTACT = 254;
const MAX_SCREENSHOTS = 10;
const MAX_PAGE = 100;
const MAX_USER_AGENT = 500;

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedbackPayload {
  readonly category?: string;
  readonly message?: string;
  readonly contact?: string;
  readonly screenshots?: unknown[];
  readonly page?: string;
  readonly userAgent?: string;
}

interface StoredFeedback {
  readonly category?: FeedbackCategory | undefined;
  readonly message?: string | undefined;
  readonly contact?: string | undefined;
  readonly screenshotCount: number;
  readonly page?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly submittedAt: string;
  readonly ip: string;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handleFeedback(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const cors = getCorsHeaders(request);

  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = getIP(request);
  const rateResult = await checkRateLimit(env.ANTISCAM_RATELIMIT, ip, 5, 'feedback');
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

  const parsed = body as Partial<FeedbackPayload>;

  // ── Validate fields ──────────────────────────────────────────────────────
  const category = parsed.category as FeedbackCategory | undefined;
  if (category !== undefined && !(VALID_CATEGORIES as readonly string[]).includes(category)) {
    return jsonError(`Invalid category. Valid values: ${VALID_CATEGORIES.join(', ')}`, 422, cors);
  }

  if (parsed.message !== undefined && (typeof parsed.message !== 'string' || parsed.message.length > MAX_MESSAGE)) {
    return jsonError(`Message must be a string of max ${MAX_MESSAGE} chars`, 422, cors);
  }

  if (parsed.contact !== undefined && (typeof parsed.contact !== 'string' || parsed.contact.length > MAX_CONTACT)) {
    return jsonError(`Contact must be a string of max ${MAX_CONTACT} chars`, 422, cors);
  }

  const screenshots: string[] = [];
  if (parsed.screenshots !== undefined) {
    if (!Array.isArray(parsed.screenshots) || parsed.screenshots.length > MAX_SCREENSHOTS) {
      return jsonError(`Screenshots must be an array of max ${MAX_SCREENSHOTS} items`, 422, cors);
    }
    for (const item of parsed.screenshots) {
      if (typeof item !== 'string') {
        return jsonError('Each screenshot must be a base64 string', 422, cors);
      }
      screenshots.push(item);
    }
  }

  if (parsed.page !== undefined && (typeof parsed.page !== 'string' || parsed.page.length > MAX_PAGE)) {
    return jsonError(`Page must be a string of max ${MAX_PAGE} chars`, 422, cors);
  }

  if (parsed.userAgent !== undefined && (typeof parsed.userAgent !== 'string' || parsed.userAgent.length > MAX_USER_AGENT)) {
    return jsonError(`userAgent must be a string of max ${MAX_USER_AGENT} chars`, 422, cors);
  }

  const hasContent = category || parsed.message?.trim() || parsed.contact?.trim() || screenshots.length > 0;
  if (!hasContent) {
    return jsonError('At least one field must have content', 422, cors);
  }

  // ── KV storage ───────────────────────────────────────────────────────────
  const timestamp = Date.now();
  const hash = await sha256Hex(`${parsed.message ?? ''}${parsed.contact ?? ''}${category ?? ''}`);
  const kvKey = `feedback:${timestamp}:${hash}`;

  const stored: StoredFeedback = {
    category: category as FeedbackCategory | undefined,
    message: parsed.message?.trim() || undefined,
    contact: parsed.contact?.trim() || undefined,
    screenshotCount: screenshots.length,
    page: parsed.page?.trim() || undefined,
    userAgent: parsed.userAgent || undefined,
    submittedAt: new Date(timestamp).toISOString(),
    ip,
  };

  try {
    await env.ANTISCAM_LEADS.put(kvKey, JSON.stringify(stored), {
      expirationTtl: 90 * 24 * 60 * 60,
    });
  } catch (e) {
    logger.error('request.error', {
      endpoint: '/api/feedback',
      error: e instanceof Error ? e.message : String(e),
    });
    return jsonError('Internal server error', 500, cors);
  }

  logger.info('feedback.stored', { endpoint: '/api/feedback', kvKey, category });

  // ── Notifications (fire-and-forget) ──────────────────────────────────────
  const catLabel = category ? CATEGORY_LABELS[category] : 'Feedback generico';
  const notifyData = {
    categoryLabel: catLabel,
    message: parsed.message,
    contact: parsed.contact,
    screenshots,
    page: parsed.page,
    userAgent: parsed.userAgent,
    submittedAt: stored.submittedAt,
    ip,
  };

  notifyTelegram(env, ctx, notifyData);
  notifyResend(env, ctx, notifyData);

  return Response.json(
    { success: true },
    { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
}
