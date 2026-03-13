/**
 * useAISimulation — hook for fetching AI-generated simulations from the
 * antiscam-worker Cloudflare Worker.
 *
 * Feature flag: VITE_AI_SIMULATIONS_ENABLED
 *   - false or undefined → fetchAISimulation returns null immediately (static fallback)
 *   - true               → calls the Worker, validates, returns Simulation or null
 *
 * Fallback contract: any failure (network, timeout, validation) returns null.
 * The caller is responsible for falling back to the static simulation script.
 */

import { useState, useCallback } from 'react';
import type { Simulation, SimStep } from '../types/simulation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_URL =
  'https://antiscam-worker.lorenzo-algeri.workers.dev/api/generate-simulation';

const TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// Runtime validation (no Zod in frontend — lightweight structural check)
// ---------------------------------------------------------------------------

function isValidSimStep(step: unknown): step is SimStep {
  if (typeof step !== 'object' || step === null) return false;
  const s = step as Record<string, unknown>;

  if (s['type'] === 'message') {
    return (
      typeof s['sender'] === 'string' &&
      ['scammer', 'user', 'system'].includes(s['sender'] as string) &&
      typeof s['text'] === 'string' &&
      s['text'].length > 0
    );
  }

  if (s['type'] === 'choice') {
    if (!Array.isArray(s['options']) || s['options'].length < 2) return false;
    const opts = s['options'] as unknown[];
    const correctCount = opts.filter(
      (o) =>
        typeof o === 'object' &&
        o !== null &&
        typeof (o as Record<string, unknown>)['id'] === 'string' &&
        typeof (o as Record<string, unknown>)['text'] === 'string' &&
        (o as Record<string, unknown>)['correct'] === true,
    ).length;
    // I2 rule: each choice must have exactly 2 correct options (limite + verifica/esposizione)
    return correctCount === 2;
  }

  if (s['type'] === 'feedback') {
    return (
      typeof s['explanation'] === 'string' &&
      s['explanation'].length > 0 &&
      Array.isArray(s['followUp'])
    );
  }

  return false;
}

function parseSimulation(raw: unknown): Simulation | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;

  if (
    typeof d['id'] !== 'string' ||
    typeof d['title'] !== 'string' ||
    typeof d['description'] !== 'string' ||
    typeof d['icon'] !== 'string' ||
    typeof d['scammerName'] !== 'string' ||
    !Array.isArray(d['steps']) ||
    (d['steps'] as unknown[]).length < 3
  ) {
    return null;
  }

  const steps = d['steps'] as unknown[];
  if (!steps.every(isValidSimStep)) return null;

  return {
    id: d['id'] as string,
    title: d['title'] as string,
    description: d['description'] as string,
    icon: d['icon'] as string,
    scammerName: d['scammerName'] as string,
    steps: steps as readonly SimStep[],
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseAISimulationResult {
  isGenerating: boolean;
  /** Internal debug only — never surfaced to the user in UI */
  generationError: string | null;
  fetchAISimulation: (
    attackType: string,
    difficulty?: string,
  ) => Promise<Simulation | null>;
}

export function useAISimulation(): UseAISimulationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fetchAISimulation = useCallback(
    async (
      attackType: string,
      difficulty: string = 'medium',
    ): Promise<Simulation | null> => {
      // Feature flag check
      if (import.meta.env.VITE_AI_SIMULATIONS_ENABLED !== 'true') {
        console.debug('[useAISimulation] AI disabled via feature flag — using static fallback');
        return null;
      }

      setIsGenerating(true);
      setGenerationError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attackType, difficulty }),
          signal: controller.signal,
        });

        // Log cache status for debugging
        const cacheHeader = response.headers.get('X-Cache');
        console.debug(
          `[useAISimulation] ${attackType}:${difficulty} → HTTP ${response.status} X-Cache:${cacheHeader ?? 'none'}`,
        );

        if (!response.ok) {
          setGenerationError(`Worker error ${response.status}`);
          return null;
        }

        const json: unknown = await response.json();
        const simulation = parseSimulation(json);

        if (simulation === null) {
          setGenerationError('Validation failed — structure mismatch');
          console.debug('[useAISimulation] Validation failed:', json);
          return null;
        }

        return simulation;
      } catch (err) {
        const isTimeout =
          err instanceof Error && err.name === 'AbortError';
        const message = isTimeout
          ? `Timeout after ${TIMEOUT_MS}ms`
          : err instanceof Error
            ? err.message
            : 'Unknown fetch error';

        setGenerationError(message);
        console.debug(`[useAISimulation] Fetch error: ${message}`);
        return null;
      } finally {
        clearTimeout(timeoutId);
        setIsGenerating(false);
      }
    },
    [],
  );

  return { isGenerating, generationError, fetchAISimulation };
}
