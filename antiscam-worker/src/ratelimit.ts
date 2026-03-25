/**
 * KV-backed sliding-window rate limiter for antiscam-worker.
 *
 * Algorithm: approximate sliding window (weighted previous + current).
 *   - Window: 1 hour (3600s)
 *   - On each check, effective count = prevCount × overlap + currentCount
 *   - overlap = (windowSize − elapsed) / windowSize
 *   - This prevents burst attacks at window boundaries (fixed-window flaw)
 *
 * Two layers:
 *   1. Per-IP rate limit   — keyed by "rl:{prefix}:{ip}"
 *   2. Global rate limit   — keyed by "rl:global:{prefix}", shared across all IPs
 *
 * Storage: KV namespace ANTISCAM_RATELIMIT (separate from cache).
 */

const WINDOW_SECONDS = 3600; // 1 hour

// ── Global safety-net limits (per endpoint group, across all IPs) ──────────
// These protect against distributed attacks from many IPs.
const GLOBAL_LIMITS: Record<string, number> = {
  generate: 500,            // /api/generate-simulation: 500/h total
  'training-start': 300,    // /api/training/start: 300/h total
  'training-msg': 3000,     // /api/training/message + message-stream: 3000/h total
  'training-ref': 1500,     // /api/training/reflect: 1500/h total
  lead: 200,                // /api/lead: max 200 submissions/h globally
  analytics: 500,           // /api/analytics/batch: max 500 batches/h globally
};

interface SlidingWindowEntry {
  /** Count in current window */
  readonly count: number;
  /** Count from previous window (for weighted calculation) */
  readonly prevCount: number;
  /** Unix timestamp (seconds) when current window started */
  readonly windowStart: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  /** Seconds until window resets (only when !allowed) */
  readonly retryAfter?: number | undefined;
  /** Which limit was hit: 'ip' or 'global' */
  readonly limitType?: 'ip' | 'global' | undefined;
}

/**
 * Calculate effective request count using sliding window approximation.
 *
 * Formula: prevCount × overlapRatio + currentCount
 * where overlapRatio = (windowSize − elapsedInCurrentWindow) / windowSize
 */
function effectiveCount(entry: SlidingWindowEntry, now: number): number {
  const elapsed = now - entry.windowStart;
  if (elapsed >= WINDOW_SECONDS) {
    // Current window fully expired — only the "new" count matters
    return 0;
  }
  const overlapRatio = Math.max(0, (WINDOW_SECONDS - elapsed) / WINDOW_SECONDS);
  return entry.prevCount * overlapRatio + entry.count;
}

/**
 * Read, calculate, and increment a sliding-window counter in KV.
 * Returns true if the request is allowed, false if limit exceeded.
 */
async function checkSlidingWindow(
  kv: KVNamespace,
  key: string,
  limit: number,
  now: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const raw = await kv.get(key);

  if (raw === null) {
    // First request ever — start new window
    const entry: SlidingWindowEntry = { count: 1, prevCount: 0, windowStart: now };
    await kv.put(key, JSON.stringify(entry), { expirationTtl: WINDOW_SECONDS * 2 });
    return { allowed: true };
  }

  let entry: SlidingWindowEntry;
  try {
    entry = JSON.parse(raw) as SlidingWindowEntry;
  } catch {
    // Corrupt entry — reset
    const fresh: SlidingWindowEntry = { count: 1, prevCount: 0, windowStart: now };
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: WINDOW_SECONDS * 2 });
    return { allowed: true };
  }

  const elapsed = now - entry.windowStart;

  // Window expired — rotate: current becomes prev, start new window
  if (elapsed >= WINDOW_SECONDS) {
    const rotated: SlidingWindowEntry = {
      count: 1,
      prevCount: entry.count,
      windowStart: now,
    };

    // Check the effective count AFTER rotation (before incrementing)
    // The "1" is already counted in rotated.count
    const eff = effectiveCount(rotated, now);
    if (eff > limit) {
      const retryAfter = Math.max(1, WINDOW_SECONDS - elapsed);
      return { allowed: false, retryAfter };
    }

    await kv.put(key, JSON.stringify(rotated), { expirationTtl: WINDOW_SECONDS * 2 });
    return { allowed: true };
  }

  // Still in current window — check before incrementing
  const projectedEff = effectiveCount(
    { ...entry, count: entry.count + 1 },
    now,
  );
  if (projectedEff > limit) {
    const retryAfter = Math.max(1, WINDOW_SECONDS - elapsed);
    return { allowed: false, retryAfter };
  }

  // Increment
  const updated: SlidingWindowEntry = {
    count: entry.count + 1,
    prevCount: entry.prevCount,
    windowStart: entry.windowStart,
  };
  const ttl = Math.max(1, WINDOW_SECONDS * 2 - elapsed);
  await kv.put(key, JSON.stringify(updated), { expirationTtl: ttl });
  return { allowed: true };
}

/**
 * Check rate limit for a request. Enforces both per-IP and global limits.
 *
 * @param kv          KV namespace for rate limit data
 * @param ip          Client IP address
 * @param perIpLimit  Max requests per IP per window
 * @param prefix      Endpoint group name (used for global limit lookup and key prefix)
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  perIpLimit: number = 100,
  prefix: string = 'generate',
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);

  // Check per-IP limit first (faster to reject obvious abuse)
  const ipKey = `rl:${prefix}:${ip}`;
  const ipResult = await checkSlidingWindow(kv, ipKey, perIpLimit, now);
  if (!ipResult.allowed) {
    return { allowed: false, retryAfter: ipResult.retryAfter, limitType: 'ip' };
  }

  // Check global limit (distributed attack protection)
  const globalLimit = GLOBAL_LIMITS[prefix];
  if (globalLimit !== undefined) {
    const globalKey = `rl:global:${prefix}`;
    const globalResult = await checkSlidingWindow(kv, globalKey, globalLimit, now);
    if (!globalResult.allowed) {
      return { allowed: false, retryAfter: globalResult.retryAfter, limitType: 'global' };
    }
  }

  return { allowed: true };
}
