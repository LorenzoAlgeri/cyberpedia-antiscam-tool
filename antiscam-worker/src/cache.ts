/**
 * KV cache helpers for antiscam-worker.
 *
 * getCached() — reads from KV and validates with Zod before returning.
 *   Returns null on miss, on invalid JSON, or on schema mismatch
 *   (invalid entries are deleted so Gemini regenerates a fresh one).
 *
 * setCache() — serialises and stores with a 24h TTL.
 *
 * Both functions accept KVNamespace directly so they remain
 * testable without an Env reference.
 */

import { SimulationSchema, type SimulationOutput } from './schema';
import { cacheKey } from './utils';
import type { AttackType, Difficulty } from './types';

const TTL_SECONDS = 86_400; // 24 hours

/**
 * Returns the cached simulation for the given attack type + difficulty,
 * or null on miss / invalid entry.
 * Deletes the KV entry if the stored value fails Zod validation.
 */
export async function getCached(
  kv: KVNamespace,
  attackType: AttackType,
  difficulty: Difficulty,
): Promise<SimulationOutput | null> {
  const key = cacheKey(attackType, difficulty);
  const raw = await kv.get(key);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt entry — evict and treat as miss
    await kv.delete(key);
    return null;
  }

  const result = SimulationSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Schema mismatch (e.g. after a schema update) — evict and treat as miss
  await kv.delete(key);
  return null;
}

/**
 * Stores a validated simulation in KV with a 24h TTL.
 */
export async function setCache(
  kv: KVNamespace,
  attackType: AttackType,
  difficulty: Difficulty,
  simulation: SimulationOutput,
): Promise<void> {
  const key = cacheKey(attackType, difficulty);
  await kv.put(key, JSON.stringify(simulation), { expirationTtl: TTL_SECONDS });
}
