/**
 * useTrainingAPI — fetch wrapper for /api/training/* Worker endpoints.
 *
 * Feature flag: VITE_AI_TRAINING_ENABLED
 *   - false or undefined → all methods return null (disabled)
 *   - true               → calls the Worker, validates, returns typed response
 *
 * Timeout: 25s client-side (matches Worker AbortController).
 * Progressive UX: caller should show "sta scrivendo..." immediately,
 * then a secondary message after 5s.
 */

import { useCallback, useRef } from 'react';
import type {
  StartSessionRequest,
  StartSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  ReflectionRequest,
  ReflectionResponse,
  ScenarioConfig,
  ConversationTurn,
  ReflectionStep,
  ReflectionAnswer,
} from '@/types/training';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_BASE =
  'https://antiscam-worker.lorenzo-algeri.workers.dev';

const TIMEOUT_MS = 25_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEnabled(): boolean {
  return import.meta.env.VITE_AI_TRAINING_ENABLED === 'true';
}

async function postJSON<T>(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<T | null> {
  const response = await fetch(`${WORKER_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    console.debug(`[useTrainingAPI] ${path} → HTTP ${response.status}`);
    return null;
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseTrainingAPIResult {
  /** Start a new training session. Returns scenario config + first AI message. */
  startSession: (
    req: StartSessionRequest,
  ) => Promise<StartSessionResponse | null>;

  /** Send a user message. Returns AI response + behavior scores. */
  sendMessage: (
    scenarioConfig: ScenarioConfig,
    conversationHistory: readonly ConversationTurn[],
    userMessage: string,
    turnCount: number,
  ) => Promise<SendMessageResponse | null>;

  /** Submit a reflection answer. Returns AI analysis + next question. */
  submitReflection: (
    scenarioConfig: ScenarioConfig,
    triggerMessage: string,
    reflectionStep: ReflectionStep,
    userAnswer: string,
    previousReflections: readonly ReflectionAnswer[],
  ) => Promise<ReflectionResponse | null>;

  /** Cancel any in-flight request. */
  cancel: () => void;
}

export function useTrainingAPI(): UseTrainingAPIResult {
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  /** Create a fresh AbortController with timeout. */
  const createController = useCallback((): AbortController => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setTimeout(() => controller.abort(), TIMEOUT_MS);
    return controller;
  }, []);

  const startSession = useCallback(
    async (
      req: StartSessionRequest,
    ): Promise<StartSessionResponse | null> => {
      if (!isEnabled()) return null;

      const controller = createController();
      try {
        return await postJSON<StartSessionResponse>(
          '/api/training/start',
          req,
          controller.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.debug('[useTrainingAPI] startSession timed out');
        }
        return null;
      }
    },
    [createController],
  );

  const sendMessage = useCallback(
    async (
      scenarioConfig: ScenarioConfig,
      conversationHistory: readonly ConversationTurn[],
      userMessage: string,
      turnCount: number,
    ): Promise<SendMessageResponse | null> => {
      if (!isEnabled()) return null;

      const controller = createController();
      try {
        return await postJSON<SendMessageResponse>(
          '/api/training/message',
          {
            scenarioConfig,
            conversationHistory,
            userMessage,
            turnCount,
          } satisfies SendMessageRequest,
          controller.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.debug('[useTrainingAPI] sendMessage timed out');
        }
        return null;
      }
    },
    [createController],
  );

  const submitReflection = useCallback(
    async (
      scenarioConfig: ScenarioConfig,
      triggerMessage: string,
      reflectionStep: ReflectionStep,
      userAnswer: string,
      previousReflections: readonly ReflectionAnswer[],
    ): Promise<ReflectionResponse | null> => {
      if (!isEnabled()) return null;

      const controller = createController();
      try {
        return await postJSON<ReflectionResponse>(
          '/api/training/reflect',
          {
            scenarioConfig,
            triggerMessage,
            reflectionStep,
            userAnswer,
            previousReflections,
          } satisfies ReflectionRequest,
          controller.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.debug('[useTrainingAPI] submitReflection timed out');
        }
        return null;
      }
    },
    [createController],
  );

  return { startSession, sendMessage, submitReflection, cancel };
}
