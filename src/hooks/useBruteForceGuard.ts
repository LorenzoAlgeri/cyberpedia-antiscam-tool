/**
 * Brute-force PIN guard — progressive delay state machine.
 *
 * After 3 wrong PIN attempts, delays escalate: 5s -> 15s -> 30s -> 60s (capped).
 * The attempt counter persists in localStorage across page refresh/tab close.
 * All delays are client-side only — an attacker with DevTools can bypass,
 * but automated scripts are slowed.
 *
 * Per CONTEXT.md decisions:
 * - First 3 attempts: just "PIN errato" (no mention of rate limiting)
 * - Attempt 4: 5s delay with countdown
 * - Attempt 5: 15s, 6: 30s, 7+: 60s (capped)
 * - After 3 wrong attempts: show "forgot PIN?" hint with reset action
 * - Successful unlock resets everything
 */

import { useState, useCallback, useEffect } from 'react';
import { getPersistedAttempts, persistAttempts, clearPersistedAttempts } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Progressive delay curve (indexed by attempt number).
 * Attempts 1-3: no delay (just "PIN errato").
 * Attempt 4: 5s, 5: 15s, 6: 30s, 7+: 60s (capped).
 *
 * Per CONTEXT.md: "Progressive delay after 3 wrong attempts: 5s -> 15s -> 30s -> 60s"
 * Client-side only — an attacker with DevTools can bypass.
 */
const DELAY_CURVE_MS: readonly number[] = [0, 0, 0, 0, 5_000, 15_000, 30_000, 60_000];
// Index 0 is unused (attempts start at 1), indices 1-3 = 0ms, 4 = 5s, etc.

/** Threshold after which the "forgot PIN?" hint is shown. */
const HINT_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDelayForAttempt(attempt: number): number {
  if (attempt < DELAY_CURVE_MS.length) return DELAY_CURVE_MS[attempt] ?? 0;
  return 60_000; // Cap at 60s for attempts beyond the curve
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BruteForceGuardState {
  /** Current consecutive wrong attempt count. */
  readonly attempts: number;
  /** Whether a delay is currently active (PIN input should be disabled). */
  readonly isLocked: boolean;
  /** Remaining delay in milliseconds (for countdown display). */
  readonly remainingMs: number;
  /** Whether to show the "forgot PIN?" hint (attempts >= 3). */
  readonly showHint: boolean;
  /** Call after a failed PIN attempt. Increments counter, starts delay if applicable. */
  readonly recordFailure: () => void;
  /** Call after a successful PIN unlock. Resets everything. */
  readonly resetOnSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBruteForceGuard(): BruteForceGuardState {
  const [attempts, setAttempts] = useState(() => getPersistedAttempts());
  const [remainingMs, setRemainingMs] = useState(0);

  const isLocked = remainingMs > 0;
  const showHint = attempts >= HINT_THRESHOLD;

  // Countdown timer: decrements every 1s while active
  useEffect(() => {
    if (remainingMs <= 0) return;
    const id = setTimeout(() => setRemainingMs((v) => Math.max(0, v - 1000)), 1000);
    return () => clearTimeout(id);
  }, [remainingMs]);

  const recordFailure = useCallback(() => {
    const next = attempts + 1;
    setAttempts(next);
    persistAttempts(next);
    const delay = getDelayForAttempt(next);
    if (delay > 0) setRemainingMs(delay);
  }, [attempts]);

  const resetOnSuccess = useCallback(() => {
    setAttempts(0);
    setRemainingMs(0);
    clearPersistedAttempts();
  }, []);

  return { attempts, isLocked, remainingMs, showHint, recordFailure, resetOnSuccess };
}
