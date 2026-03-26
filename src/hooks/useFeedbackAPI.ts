/**
 * useFeedbackAPI — fetch wrapper for POST /api/feedback.
 *
 * Pattern: useTrainingAPI.ts (useCallback + AbortController + timeout).
 * Returns { submitFeedback, cancel }.
 */

import { useCallback, useRef } from 'react';
import type { FeedbackPayload } from '@/types/feedback';

const WORKER_BASE = 'https://antiscam-worker.lorenzo-algeri.workers.dev';
const TIMEOUT_MS = 40_000;

export function useFeedbackAPI() {
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const submitFeedback = useCallback(async (payload: FeedbackPayload): Promise<void> => {
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${WORKER_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errBody = await response.json() as { error?: string };
          detail = errBody.error ?? '';
        } catch { /* ignore parse errors */ }
        throw new Error(detail || `Errore server (HTTP ${response.status})`);
      }
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
    }
  }, [cancel]);

  return { submitFeedback, cancel } as const;
}
