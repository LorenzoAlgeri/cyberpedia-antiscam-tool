/**
 * Structured JSON logger for Cloudflare Workers.
 *
 * Output goes to console (→ Cloudflare Logpush / `wrangler tail`).
 * Every entry is a single JSON line with stable event names for filtering.
 *
 * Privacy: NEVER log user IPs in plaintext, message content, or API keys.
 */

interface LogContext {
  readonly endpoint?: string;
  readonly durationMs?: number;
  readonly status?: number;
  readonly error?: string;
  readonly [key: string]: unknown;
}

export const logger = {
  info(event: string, context: LogContext = {}) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', event, ...context }));
  },
  warn(event: string, context: LogContext = {}) {
    console.warn(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', event, ...context }));
  },
  error(event: string, context: LogContext = {}) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event, ...context }));
  },
};
