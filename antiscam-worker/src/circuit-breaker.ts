/**
 * In-memory circuit breaker for external service calls.
 *
 * In Cloudflare Workers, module-level state persists within an isolate
 * but NOT across different isolates. Multiple isolates may serve concurrent
 * requests — each learns independently from its own failures.
 *
 * This provides per-isolate protection: if an isolate sees THRESHOLD
 * consecutive failures, it stops calling the service for RESET_WINDOW_MS.
 * Other isolates learn from their own first failure.
 * Partial protection > zero protection.
 *
 * For global circuit breaking across all isolates, use CF KV or Durable Objects.
 */

interface CircuitBreakerState {
  consecutiveFailures: number;
  /** Unix ms when circuit opened, 0 = closed */
  openedAt: number;
}

import { logger } from './logger';

const THRESHOLD = 3;
const RESET_WINDOW_MS = 60_000; // 60s before half-open probe

export function createCircuitBreaker(name: string) {
  const state: CircuitBreakerState = { consecutiveFailures: 0, openedAt: 0 };

  return {
    /** Returns true if the circuit is open (calls should be rejected). */
    isOpen(): boolean {
      if (state.consecutiveFailures < THRESHOLD) return false;
      if (Date.now() - state.openedAt > RESET_WINDOW_MS) {
        // Half-open: allow one probe request through
        state.consecutiveFailures = THRESHOLD - 1;
        state.openedAt = 0;
        return false;
      }
      return true;
    },

    /** Call after a successful response — resets the breaker. */
    recordSuccess(): void {
      state.consecutiveFailures = 0;
      state.openedAt = 0;
    },

    /** Call after an infrastructure failure (timeout, 5xx, network error). */
    recordFailure(): void {
      state.consecutiveFailures++;
      if (state.consecutiveFailures >= THRESHOLD && state.openedAt === 0) {
        state.openedAt = Date.now();
        logger.warn('n8n.circuit.opened', {
          circuit: name,
          failures: state.consecutiveFailures,
        });
      }
    },
  };
}
