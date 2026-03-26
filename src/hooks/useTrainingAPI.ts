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
  BehaviorScores,
  ReflectionRequest,
  ReflectionResponse,
  ReflectionSuggestionsRequest,
  ReflectionSuggestionsResponse,
  ScenarioConfig,
  ConversationTurn,
  ReflectionStep,
  ReflectionAnswer,
  InterruptReason,
} from '@/types/training';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_BASE =
  'https://antiscam-worker.lorenzo-algeri.workers.dev';

const TIMEOUT_MS = 40_000;

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
): Promise<T> {
  const response = await fetch(`${WORKER_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json() as { error?: string };
      detail = errBody.error ?? '';
    } catch { /* ignore parse errors */ }
    throw new Error(
      detail || `Errore server (HTTP ${response.status})`,
    );
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

  /** Fetch suggested answers for a reflection question. */
  fetchReflectionSuggestions: (
    scenarioConfig: ScenarioConfig,
    conversationHistory: readonly ConversationTurn[],
    triggerMessage: string,
    reflectionStep: ReflectionStep,
    currentQuestion: string,
    interruptReason: InterruptReason | undefined,
    previousReflections: readonly ReflectionAnswer[],
  ) => Promise<ReflectionSuggestionsResponse | null>;

  /** Send a message with SSE streaming. Calls onScores, onToken, onDone progressively. */
  sendMessageStream: (
    scenarioConfig: ScenarioConfig,
    conversationHistory: readonly ConversationTurn[],
    userMessage: string,
    turnCount: number,
    callbacks: StreamCallbacks,
  ) => Promise<void>;

  /** Cancel any in-flight request. */
  cancel: () => void;
}

/** Callbacks for SSE streaming message responses */
export interface StreamCallbacks {
  onScores: (data: { behaviorScores: BehaviorScores; shouldInterrupt: boolean; interruptReason?: string; nextPhase: string }) => void;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
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
          throw new Error('Timeout — il server non ha risposto in tempo. Riprova.');
        }
        throw err;
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
          throw new Error('Timeout — il server non ha risposto in tempo. Riprova.');
        }
        throw err;
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
          throw new Error('Timeout — il server non ha risposto in tempo. Riprova.');
        }
        throw err;
      }
    },
    [createController],
  );

  const sendMessageStream = useCallback(
    async (
      scenarioConfig: ScenarioConfig,
      conversationHistory: readonly ConversationTurn[],
      userMessage: string,
      turnCount: number,
      callbacks: StreamCallbacks,
    ): Promise<void> => {
      if (!isEnabled()) {
        callbacks.onError('Training non abilitato');
        return;
      }

      const controller = createController();
      try {
        const response = await fetch(`${WORKER_BASE}/api/training/message-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioConfig,
            conversationHistory,
            userMessage,
            turnCount,
          } satisfies SendMessageRequest),
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail = '';
          try {
            const errBody = await response.json() as { error?: string };
            detail = errBody.error ?? '';
          } catch { /* ignore */ }
          callbacks.onError(detail || `Errore server (HTTP ${response.status})`);
          return;
        }

        if (!response.body) {
          callbacks.onError('Nessuna risposta dal server');
          return;
        }

        // Parse SSE stream — track resolution to guarantee isLoading resets
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamResolved = false;

        let currentEventType = '';

        const processSSELine = (line: string) => {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) return;

            try {
              const data = JSON.parse(dataStr);
              switch (currentEventType) {
                case 'scores':
                  callbacks.onScores(data);
                  break;
                case 'token':
                  callbacks.onToken(data.text ?? '');
                  break;
                case 'done':
                  streamResolved = true;
                  callbacks.onDone();
                  break;
                case 'error': {
                  streamResolved = true;
                  const errMsg = data.error ?? 'Errore sconosciuto';
                  const errDetail = data.detail ? `\n${data.detail}` : '';
                  callbacks.onError(errMsg + errDetail);
                  break;
                }
              }
            } catch {
              // Skip unparseable data
            }
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last incomplete line in buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              processSSELine(line);
            }
          }

          // Flush remaining buffer after stream ends
          if (buffer.trim()) {
            const remaining = buffer.split('\n');
            for (const line of remaining) {
              processSSELine(line);
            }
          }
        } catch (readErr) {
          if (!streamResolved) {
            streamResolved = true;
            const msg = readErr instanceof Error ? readErr.message : 'Connessione interrotta';
            callbacks.onError(`Connessione interrotta durante la lettura. Riprova.\n[read] ${msg}`);
          }
        }

        // Safety net: if stream ended without done/error event, unblock UI
        if (!streamResolved) {
          callbacks.onError('Stream terminato senza risposta completa. Riprova.');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          callbacks.onError('Timeout — il server non ha risposto in tempo. Riprova.');
        } else {
          callbacks.onError(err instanceof Error ? err.message : 'Errore di connessione');
        }
      }
    },
    [createController],
  );

  const fetchReflectionSuggestions = useCallback(
    async (
      scenarioConfig: ScenarioConfig,
      conversationHistory: readonly ConversationTurn[],
      triggerMessage: string,
      reflectionStep: ReflectionStep,
      currentQuestion: string,
      interruptReason: InterruptReason | undefined,
      previousReflections: readonly ReflectionAnswer[],
    ): Promise<ReflectionSuggestionsResponse | null> => {
      if (!isEnabled()) return null;

      const controller = createController();
      try {
        const body: ReflectionSuggestionsRequest = {
          scenarioConfig,
          conversationHistory,
          triggerMessage,
          reflectionStep,
          currentQuestion,
          previousReflections,
          ...(interruptReason ? { interruptReason } : {}),
        };
        return await postJSON<ReflectionSuggestionsResponse>(
          '/api/training/reflection-suggestions',
          body,
          controller.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null; // Graceful degradation — suggestions are optional
        }
        return null;
      }
    },
    [createController],
  );

  return { startSession, sendMessage, sendMessageStream, submitReflection, fetchReflectionSuggestions, cancel };
}
