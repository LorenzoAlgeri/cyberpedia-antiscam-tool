/**
 * Analytics batch handler — aggregates anonymous events into KV counters.
 *
 * POST /api/analytics/batch
 * Body: { events: AnalyticsEvent[] }
 *
 * Privacy guarantees:
 * - No individual events stored — only aggregated counters
 * - No PII in accepted fields (validated)
 * - KV keys: analytics:{YYYY-MM-DD}:{event_type}
 * - Values: JSON counters with breakdowns
 * - TTL: 180 days (auto-cleanup)
 *
 * Rate limit: 10 batches/hour per IP
 */

import { getCorsHeaders } from './cors';
import { checkRateLimit } from './ratelimit';
import type { Env } from './types';

// ── Constants ────────────────────────────────────────────────────────────────

const RATE_LIMIT_PER_IP = 10;
const RATE_LIMIT_PREFIX = 'analytics';
const TTL_DAYS = 180;
const MAX_EVENTS_PER_BATCH = 50;
const MAX_DATA_VALUE_LENGTH = 100;

const VALID_EVENT_TYPES = new Set([
  'session_start',
  'session_complete',
  'session_dropout',
  'lever_effectiveness',
  'response_time',
  'feature_usage',
  'utm_capture',
  'error',
]);

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsEvent {
  readonly type: string;
  readonly ts: number;
  readonly data: Record<string, string | number | boolean>;
}

interface BatchPayload {
  readonly events: AnalyticsEvent[];
}

/** Aggregated counter stored in KV */
interface AggregatedCounter {
  total: number;
  breakdown: Record<string, number>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/** Get YYYY-MM-DD date string from Unix timestamp (seconds). */
function dateFromTs(ts: number): string {
  const d = new Date(ts * 1000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Validate a single event. Returns true if valid. */
function isValidEvent(event: unknown): event is AnalyticsEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;

  if (typeof e.type !== 'string' || !VALID_EVENT_TYPES.has(e.type)) return false;
  if (typeof e.ts !== 'number' || !Number.isFinite(e.ts)) return false;
  if (typeof e.data !== 'object' || e.data === null || Array.isArray(e.data)) return false;

  // Validate data values — no PII, bounded length
  for (const [key, val] of Object.entries(e.data as Record<string, unknown>)) {
    if (key.length > 50) return false;
    if (typeof val === 'string' && val.length > MAX_DATA_VALUE_LENGTH) return false;
    if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') return false;
  }

  return true;
}

/**
 * Build a breakdown key from event data.
 * This creates a single string key for aggregation bucketing.
 */
function breakdownKey(event: AnalyticsEvent): string {
  switch (event.type) {
    case 'session_start':
      return `${event.data.scenario ?? 'unknown'}:${event.data.difficulty ?? 'unknown'}`;
    case 'session_complete':
      return `${event.data.scenario ?? 'unknown'}:${event.data.risk ?? 'unknown'}`;
    case 'session_dropout':
      return String(event.data.phase ?? 'unknown');
    case 'lever_effectiveness':
      return `${event.data.scenario ?? 'unknown'}:${event.data.lever ?? 'unknown'}`;
    case 'response_time':
      return String(event.data.bucket ?? 'unknown');
    case 'feature_usage':
      return String(event.data.feature ?? 'unknown');
    case 'utm_capture':
      return `${event.data.source ?? 'direct'}:${event.data.medium ?? 'none'}`;
    case 'error':
      return String(event.data.error_type ?? 'unknown');
    default:
      return 'unknown';
  }
}

// ── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Read existing counter from KV, merge new events, write back.
 * Atomic per event type per day (KV eventual consistency is acceptable here).
 */
async function aggregateEvents(
  kv: KVNamespace,
  date: string,
  eventType: string,
  events: AnalyticsEvent[],
): Promise<void> {
  const kvKey = `analytics:${date}:${eventType}`;

  // Read existing counter
  let counter: AggregatedCounter;
  const raw = await kv.get(kvKey);
  if (raw !== null) {
    try {
      counter = JSON.parse(raw) as AggregatedCounter;
    } catch {
      counter = { total: 0, breakdown: {} };
    }
  } else {
    counter = { total: 0, breakdown: {} };
  }

  // Aggregate
  for (const event of events) {
    counter.total += 1;
    const key = breakdownKey(event);
    counter.breakdown[key] = (counter.breakdown[key] ?? 0) + 1;
  }

  // Write back with TTL
  await kv.put(kvKey, JSON.stringify(counter), {
    expirationTtl: TTL_DAYS * 24 * 60 * 60,
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function handleAnalytics(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders(request);

  // ── Rate limit ──────────────────────────────────────────────────────────
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

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400, cors);
  }

  if (typeof body !== 'object' || body === null) {
    return jsonError('Invalid JSON body', 400, cors);
  }

  const parsed = body as Partial<BatchPayload>;

  if (!Array.isArray(parsed.events)) {
    return jsonError('Missing required field: events (array)', 422, cors);
  }

  if (parsed.events.length === 0) {
    return Response.json({ accepted: 0 }, { status: 200, headers: cors });
  }

  if (parsed.events.length > MAX_EVENTS_PER_BATCH) {
    return jsonError(
      `Too many events. Maximum ${MAX_EVENTS_PER_BATCH} per batch.`,
      422,
      cors,
    );
  }

  // ── Validate & group events ─────────────────────────────────────────────
  // Group by date+type for efficient KV writes
  const grouped = new Map<string, AnalyticsEvent[]>();
  let accepted = 0;

  for (const event of parsed.events) {
    if (!isValidEvent(event)) continue;

    const date = dateFromTs(event.ts);
    const groupKey = `${date}:${event.type}`;

    const existing = grouped.get(groupKey);
    if (existing) {
      existing.push(event);
    } else {
      grouped.set(groupKey, [event]);
    }
    accepted++;
  }

  // ── Aggregate into KV ──────────────────────────────────────────────────
  const writePromises: Promise<void>[] = [];
  for (const [groupKey, events] of grouped) {
    const [date, ...typeParts] = groupKey.split(':');
    const eventType = typeParts.join(':');
    if (date && eventType) {
      writePromises.push(aggregateEvents(env.ANTISCAM_ANALYTICS, date, eventType, events));
    }
  }

  try {
    await Promise.all(writePromises);
  } catch (e) {
    console.error(JSON.stringify({
      level: 'error',
      handler: 'handleAnalytics',
      error: e instanceof Error ? e.message : String(e),
    }));
    return jsonError('Internal server error', 500, cors);
  }

  console.log(JSON.stringify({
    level: 'info',
    handler: 'handleAnalytics',
    action: 'batch_aggregated',
    accepted,
    groups: grouped.size,
  }));

  return Response.json(
    { accepted },
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
}
