/**
 * Utility functions for antiscam-worker.
 * Zero types here — see types.ts for all interfaces and type aliases.
 */

import type { AttackType, Difficulty } from './types';

/** Returns the KV cache key for a given attack type + difficulty combination */
export function cacheKey(attackType: AttackType, difficulty: Difficulty): string {
  return `sim:${attackType}:${difficulty}`;
}
