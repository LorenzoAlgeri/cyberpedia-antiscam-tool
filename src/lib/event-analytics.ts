/**
 * Privacy-first analytics module — anonymous event tracking.
 *
 * Design principles:
 * - Zero PII: no names, emails, IPs, or fingerprints
 * - Aggregation-first: worker stores only counters, not individual events
 * - Ephemeral buffer: events held in memory, flushed periodically
 * - Graceful degradation: failures are silent, never block UX
 *
 * Events are buffered in-memory and flushed:
 * - Every 30 seconds
 * - On page visibility change (tab hidden / app backgrounded)
 * - On page unload (best-effort via sendBeacon)
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'session_start'
  | 'session_complete'
  | 'session_dropout'
  | 'lever_effectiveness'
  | 'response_time'
  | 'feature_usage'
  | 'utm_capture'
  | 'error';

/** Time bucket for response time tracking */
export type ResponseTimeBucket = 'fast' | 'normal' | 'slow' | 'very_slow';

/** Risk band (never exact scores) */
export type RiskBand = 'low' | 'medium' | 'high';

export interface AnalyticsEvent {
  readonly type: AnalyticsEventType;
  readonly ts: number; // Unix timestamp (seconds)
  readonly data: Record<string, string | number | boolean>;
}

// ── Config ──────────────────────────────────────────────────────────────────

const WORKER_BASE = 'https://antiscam-worker.lorenzo-algeri.workers.dev';
const FLUSH_INTERVAL_MS = 30_000;
const MAX_BUFFER_SIZE = 50;

// ── State ───────────────────────────────────────────────────────────────────

let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Classify response time into privacy-safe buckets. */
export function responseTimeBucket(ms: number): ResponseTimeBucket {
  if (ms < 5_000) return 'fast';
  if (ms < 15_000) return 'normal';
  if (ms < 30_000) return 'slow';
  return 'very_slow';
}

/** Classify risk score into a band (never send exact score). */
export function riskBand(score: number): RiskBand {
  if (score <= 35) return 'low';
  if (score <= 65) return 'medium';
  return 'high';
}

/** Bucket turn count to avoid fingerprinting exact session length. */
export function turnsBucket(turns: number): string {
  if (turns <= 3) return '1-3';
  if (turns <= 6) return '4-6';
  if (turns <= 10) return '7-10';
  return '11+';
}

/** Bucket duration (seconds) into ranges. */
export function durationBucket(seconds: number): string {
  if (seconds < 60) return '<1m';
  if (seconds < 180) return '1-3m';
  if (seconds < 300) return '3-5m';
  if (seconds < 600) return '5-10m';
  return '10m+';
}

// ── Core ────────────────────────────────────────────────────────────────────

/**
 * Track an analytics event. Silently buffers in memory.
 * Safe to call anywhere — never throws.
 */
export function track(
  type: AnalyticsEventType,
  data: Record<string, string | number | boolean> = {},
): void {
  try {
    const event: AnalyticsEvent = {
      type,
      ts: Math.floor(Date.now() / 1000),
      data,
    };
    buffer.push(event);

    // Prevent unbounded memory growth
    if (buffer.length > MAX_BUFFER_SIZE) {
      flush();
    }
  } catch {
    // Silent — analytics must never break the app
  }
}

/**
 * Flush buffered events to the worker.
 * Uses sendBeacon when available (works on page unload), falls back to fetch.
 */
export function flush(): void {
  if (buffer.length === 0) return;

  const events = buffer;
  buffer = [];

  const payload = JSON.stringify({ events });

  try {
    // sendBeacon is fire-and-forget — ideal for unload
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        `${WORKER_BASE}/api/analytics/batch`,
        new Blob([payload], { type: 'application/json' }),
      );
      if (sent) return;
    }

    // Fallback: fetch with keepalive
    fetch(`${WORKER_BASE}/api/analytics/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silent — analytics failures are acceptable
    });
  } catch {
    // Silent
  }
}

/**
 * Initialize analytics: start flush timer + attach lifecycle listeners.
 * Safe to call multiple times — only initializes once.
 */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;

  // Periodic flush
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);

  // Flush on visibility change (tab switch / app background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });

  // Best-effort flush on page unload
  window.addEventListener('pagehide', flush);

  // Capture UTM parameters on first load
  captureUtm();
}

/**
 * Stop analytics (cleanup for testing or unmount).
 */
export function stopAnalytics(): void {
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flush(); // final flush
  initialized = false;
}

// ── UTM Capture ─────────────────────────────────────────────────────────────

function captureUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');

    if (source || medium || campaign) {
      track('utm_capture', {
        ...(source ? { source } : {}),
        ...(medium ? { medium } : {}),
        ...(campaign ? { campaign } : {}),
      });
    }
  } catch {
    // Silent
  }
}

// ── Convenience track helpers ───────────────────────────────────────────────

export function trackSessionStart(scenario: string, difficulty: string, targets: string[]): void {
  track('session_start', {
    scenario,
    difficulty,
    targets: targets.join(','),
    target_count: targets.length,
  });
}

export function trackSessionComplete(
  scenario: string,
  turnCount: number,
  durationSec: number,
  riskScore: number,
): void {
  track('session_complete', {
    scenario,
    turns: turnsBucket(turnCount),
    duration: durationBucket(durationSec),
    risk: riskBand(riskScore),
  });
}

export function trackSessionDropout(phase: string): void {
  track('session_dropout', { phase });
}

export function trackLeverEffectiveness(scenario: string, lever: string): void {
  track('lever_effectiveness', { scenario, lever });
}

export function trackResponseTime(ms: number): void {
  track('response_time', { bucket: responseTimeBucket(ms) });
}

export function trackFeatureUsage(feature: string): void {
  track('feature_usage', { feature });
}

export function trackError(errorType: string): void {
  track('error', { error_type: errorType });
}
