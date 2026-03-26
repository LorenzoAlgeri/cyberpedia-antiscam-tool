/**
 * useTrainingSession — state machine for AI training sessions.
 *
 * Manages the full session lifecycle:
 *   setup → conversation → interrupted → reflection → summary → complete
 *
 * State is managed via useReducer (same pattern as useChatSimulator).
 * The hook coordinates between UI actions and the Worker API via useTrainingAPI.
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { useTrainingAPI } from './useTrainingAPI';
import {
  trackSessionStart,
  trackSessionComplete,
  trackSessionDropout,
  trackLeverEffectiveness,
  trackResponseTime,
  trackError,
} from '@/lib/event-analytics';
import type {
  SessionPhase,
  ScenarioConfig,
  ConversationTurn,
  BehaviorScores,
  ReflectionAnswer,
  ReflectionStep,
  InterruptReason,
  NarrativePhase,
  StartSessionRequest,
} from '@/types/training';
import { getReflectionQuestion } from './trainingReflectionQuestions';

/** Translate common English fetch/network errors to Italian */
function translateError(e: unknown): string {
  if (!(e instanceof Error)) return 'Errore di connessione. Riprova.';
  const msg = e.message.toLowerCase();
  if (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return 'Connessione persa. Controlla la rete e riprova.';
  }
  if (msg.includes('timeout') || msg.includes('aborted')) {
    return 'Il server non ha risposto in tempo. Riprova.';
  }
  if (msg.includes('too many requests')) {
    return 'Troppe richieste. Attendi qualche minuto e riprova.';
  }
  return e.message;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface TrainingState {
  phase: SessionPhase;
  scenarioConfig: ScenarioConfig | null;
  turns: ConversationTurn[];
  reflections: ReflectionAnswer[];
  currentReflectionStep: ReflectionStep;
  currentReflectionQuestion: string;
  latestScores: BehaviorScores | null;
  finalScores: BehaviorScores | null;
  interruptedAtTurn: number | null;
  interruptReason: InterruptReason | null;
  triggerMessage: string | null;
  isLoading: boolean;
  error: string | null;
  /** Seconds elapsed since last API call started (for progressive UX) */
  waitSeconds: number;
}

const initialState: TrainingState = {
  phase: 'setup',
  scenarioConfig: null,
  turns: [],
  reflections: [],
  currentReflectionStep: 'R1',
  currentReflectionQuestion: '',
  latestScores: null,
  finalScores: null,
  interruptedAtTurn: null,
  interruptReason: null,
  triggerMessage: null,
  isLoading: false,
  error: null,
  waitSeconds: 0,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: 'START_LOADING' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'TICK_WAIT' }
  | { type: 'SESSION_STARTED'; scenarioConfig: ScenarioConfig; firstMessage: string }
  | { type: 'USER_MESSAGE_SENT'; turn: ConversationTurn }
  | { type: 'AI_RESPONSE'; turn: ConversationTurn; scores: BehaviorScores; nextPhase: NarrativePhase }
  | { type: 'AI_SCORES_RECEIVED'; scores: BehaviorScores; nextPhase: NarrativePhase; shouldInterrupt: boolean; interruptReason?: InterruptReason }
  | { type: 'AI_TOKEN'; text: string }
  | { type: 'AI_STREAM_DONE' }
  | { type: 'INTERRUPTED'; triggerMessage: string; interruptReason: InterruptReason }
  | { type: 'REFLECTION_STARTED'; question: string }
  | { type: 'REFLECTION_ANSWER'; answer: ReflectionAnswer; nextStep: ReflectionStep | null; nextQuestion: string | null }
  | { type: 'SHOW_SUMMARY'; finalScores: BehaviorScores }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }
  | { type: 'CONTINUE_CONVERSATION' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: TrainingState, action: Action): TrainingState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, isLoading: true, error: null, waitSeconds: 0 };

    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.error };

    case 'TICK_WAIT':
      return { ...state, waitSeconds: state.waitSeconds + 1 };

    case 'SESSION_STARTED':
      return {
        ...state,
        phase: 'conversation',
        scenarioConfig: action.scenarioConfig,
        turns: [{
          id: `turn-0`,
          timestamp: new Date().toISOString(),
          role: 'scammer',
          content: action.firstMessage,
          phase: 'P1',
        }],
        isLoading: false,
      };

    case 'USER_MESSAGE_SENT':
      return {
        ...state,
        turns: [...state.turns, action.turn],
        isLoading: true,
        waitSeconds: 0,
      };

    case 'AI_RESPONSE':
      return {
        ...state,
        turns: [...state.turns, action.turn],
        latestScores: action.scores,
        isLoading: false,
      };

    case 'AI_SCORES_RECEIVED': {
      // Scores arrive before the message — create a placeholder scammer turn
      const placeholderTurn: ConversationTurn = {
        id: `turn-${state.turns.length}`,
        timestamp: new Date().toISOString(),
        role: 'scammer',
        content: '', // will be filled by AI_TOKEN events
        phase: action.nextPhase,
      };
      return {
        ...state,
        turns: [...state.turns, placeholderTurn],
        latestScores: action.scores,
        // Keep isLoading true — message is still streaming
      };
    }

    case 'AI_TOKEN': {
      // Append text to the last turn (streaming message)
      if (state.turns.length === 0) return state;
      const tokenTurns = [...state.turns];
      const lastTurn = tokenTurns[tokenTurns.length - 1]!;
      tokenTurns[tokenTurns.length - 1] = {
        id: lastTurn.id,
        timestamp: lastTurn.timestamp,
        role: lastTurn.role,
        content: lastTurn.content + action.text,
        phase: lastTurn.phase,
      };
      return { ...state, turns: tokenTurns };
    }

    case 'AI_STREAM_DONE':
      return { ...state, isLoading: false };

    case 'INTERRUPTED':
      return {
        ...state,
        phase: 'interrupted',
        interruptedAtTurn: state.turns.length - 1,
        interruptReason: action.interruptReason,
        triggerMessage: action.triggerMessage,
        isLoading: false,
      };

    case 'REFLECTION_STARTED':
      return {
        ...state,
        phase: 'reflection',
        currentReflectionStep: 'R1',
        currentReflectionQuestion: action.question,
        isLoading: false,
      };

    case 'REFLECTION_ANSWER': {
      const reflections = [...state.reflections, action.answer];
      if (action.nextStep === null || action.nextQuestion === null) {
        // Reflection complete — move to summary
        return {
          ...state,
          reflections,
          isLoading: false,
          phase: 'summary',
        };
      }
      return {
        ...state,
        reflections,
        currentReflectionStep: action.nextStep,
        currentReflectionQuestion: action.nextQuestion,
        isLoading: false,
      };
    }

    case 'SHOW_SUMMARY':
      return {
        ...state,
        phase: 'summary',
        finalScores: action.finalScores,
        isLoading: false,
      };

    case 'COMPLETE':
      return { ...state, phase: 'complete' };

    case 'CONTINUE_CONVERSATION':
      return { ...state, phase: 'conversation' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseTrainingSessionResult {
  state: TrainingState;
  /** Start a new training session with the given parameters. */
  startSession: (req: StartSessionRequest) => Promise<void>;
  /** Send a free-text message from the user. */
  sendMessage: (text: string) => Promise<void>;
  /** Submit a reflection answer. */
  submitReflection: (answer: string) => Promise<void>;
  /** Start the reflection phase (after interruption). */
  beginReflection: () => void;
  /** Mark the session as complete (from summary view). */
  finish: () => void;
  /** Reset to initial state. */
  reset: () => void;
  /** Resume conversation after viewing summary. */
  continueChat: () => void;
}

export function useTrainingSession(): UseTrainingSessionResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const api = useTrainingAPI();
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Track session start time for duration calculation */
  const sessionStartTimeRef = useRef<number>(0);
  /** Track when the last user message was sent (for response time) */
  const lastMessageTimeRef = useRef<number>(0);

  // Clean up wait timer on unmount
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, []);

  /** Start a 1s interval timer for progressive wait UX. */
  const startWaitTimer = useCallback(() => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    waitTimerRef.current = setInterval(() => {
      dispatch({ type: 'TICK_WAIT' });
    }, 1000);
  }, []);

  const stopWaitTimer = useCallback(() => {
    if (waitTimerRef.current) {
      clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    async (req: StartSessionRequest) => {
      dispatch({ type: 'START_LOADING' });
      startWaitTimer();

      try {
        const result = await api.startSession(req);
        stopWaitTimer();

        if (!result) {
          dispatch({ type: 'SET_ERROR', error: 'Impossibile avviare la sessione. Riprova.' });
          return;
        }

        dispatch({
          type: 'SESSION_STARTED',
          scenarioConfig: result.scenarioConfig,
          firstMessage: result.firstMessage,
        });

        // Analytics: track session start
        sessionStartTimeRef.current = Date.now();
        trackSessionStart(
          req.attackType,
          req.difficulty,
          req.trainingTargets,
        );
      } catch (e) {
        stopWaitTimer();
        dispatch({
          type: 'SET_ERROR',
          error: translateError(e),
        });
      }
    },
    [api, startWaitTimer, stopWaitTimer],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!state.scenarioConfig) return;
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > 500) return;

      const userTurn: ConversationTurn = {
        id: `turn-${state.turns.length}`,
        timestamp: new Date().toISOString(),
        role: 'user',
        content: trimmed,
        phase: state.turns.at(-1)?.phase ?? 'P1',
      };

      dispatch({ type: 'USER_MESSAGE_SENT', turn: userTurn });
      startWaitTimer();
      lastMessageTimeRef.current = Date.now();

      // Track interrupt info from scores callback for use after stream
      let interruptInfo: { shouldInterrupt: boolean; interruptReason?: InterruptReason } | null = null;

      try {
        // Try SSE streaming first
        let accumulatedMessage = '';
        await api.sendMessageStream(
          state.scenarioConfig,
          [...state.turns, userTurn],
          trimmed,
          state.turns.length + 1,
          {
            onScores: (data) => {
              stopWaitTimer();
              // Analytics: track response time (time from user message to first AI response)
              if (lastMessageTimeRef.current > 0) {
                trackResponseTime(Date.now() - lastMessageTimeRef.current);
              }
              interruptInfo = {
                shouldInterrupt: data.shouldInterrupt,
                interruptReason: (data.interruptReason as InterruptReason) ?? undefined,
              };
              const scoresAction: Action = {
                type: 'AI_SCORES_RECEIVED',
                scores: data.behaviorScores,
                nextPhase: data.nextPhase as NarrativePhase,
                shouldInterrupt: data.shouldInterrupt,
                ...(data.interruptReason ? { interruptReason: data.interruptReason as InterruptReason } : {}),
              };
              dispatch(scoresAction);
            },
            onToken: (tokenText) => {
              accumulatedMessage += tokenText;
              dispatch({ type: 'AI_TOKEN', text: tokenText });
            },
            onDone: () => {
              stopWaitTimer();
              dispatch({ type: 'AI_STREAM_DONE' });
              if (interruptInfo?.shouldInterrupt) {
                dispatch({
                  type: 'INTERRUPTED',
                  triggerMessage: trimmed,
                  interruptReason: interruptInfo.interruptReason ?? 'high_risk',
                });
                // Analytics: track which lever/scenario triggered interruption
                if (state.scenarioConfig) {
                  trackLeverEffectiveness(
                    state.scenarioConfig.attackType,
                    state.scenarioConfig.trainingTarget,
                  );
                }
              }
            },
            onError: (error) => {
              stopWaitTimer();
              dispatch({ type: 'SET_ERROR', error });
            },
          },
        );
      } catch (e) {
        stopWaitTimer();
        dispatch({ type: 'SET_ERROR', error: translateError(e) });
        trackError('send_message');
      }
    },
    [state.scenarioConfig, state.turns, api, startWaitTimer, stopWaitTimer],
  );

  const beginReflection = useCallback(() => {
    const question = getReflectionQuestion('R1', state.interruptReason);
    dispatch({ type: 'REFLECTION_STARTED', question });
  }, [state.interruptReason]);

  const submitReflection = useCallback(
    async (answer: string) => {
      if (!state.scenarioConfig || !state.triggerMessage) return;
      const trimmed = answer.trim();
      if (!trimmed) return;

      dispatch({ type: 'START_LOADING' });
      startWaitTimer();

      try {
        const result = await api.submitReflection(
          state.scenarioConfig,
          state.triggerMessage,
          state.currentReflectionStep,
          trimmed,
          state.reflections,
        );
        stopWaitTimer();

        if (!result) {
          dispatch({ type: 'SET_ERROR', error: 'Errore nella riflessione. Riprova.' });
          return;
        }

        const currentAnswer: ReflectionAnswer = {
          step: state.currentReflectionStep,
          question: state.currentReflectionQuestion,
          userAnswer: trimmed,
          aiAnalysis: result.aiAnalysis,
        };

        // R1 → R2 → R3 → R4, then summary
        const stepOrder: ReflectionStep[] = ['R1', 'R2', 'R3', 'R4'];
        const currentIdx = stepOrder.indexOf(state.currentReflectionStep);
        const nextStep = currentIdx < stepOrder.length - 1 ? stepOrder[currentIdx + 1] : null;
        const nextQuestion = nextStep ? (result.nextQuestion ?? getReflectionQuestion(nextStep, state.interruptReason)) : null;

        dispatch({
          type: 'REFLECTION_ANSWER',
          answer: currentAnswer,
          nextStep: nextStep ?? null,
          nextQuestion: nextQuestion ?? null,
        });

        // If reflection is complete, compute final scores from latest
        if (nextStep === null && state.latestScores) {
          dispatch({ type: 'SHOW_SUMMARY', finalScores: state.latestScores });
        }
      } catch (e) {
        stopWaitTimer();
        dispatch({ type: 'SET_ERROR', error: translateError(e) });
      }
    },
    [state, api, startWaitTimer, stopWaitTimer],
  );

  const finish = useCallback(() => {
    dispatch({ type: 'COMPLETE' });

    // Analytics: track session completion
    if (state.scenarioConfig) {
      const durationSec = sessionStartTimeRef.current > 0
        ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0;
      const scores = state.finalScores ?? state.latestScores;
      trackSessionComplete(
        state.scenarioConfig.attackType,
        state.turns.length,
        durationSec,
        scores?.riskScore ?? 50,
      );
    }
  }, [state.scenarioConfig, state.turns.length, state.finalScores, state.latestScores]);

  const continueChat = useCallback(() => {
    dispatch({ type: 'CONTINUE_CONVERSATION' });
  }, []);

  const reset = useCallback(() => {
    // Analytics: track dropout if session was in progress (not complete/setup)
    if (state.phase !== 'setup' && state.phase !== 'complete') {
      trackSessionDropout(state.phase);
    }
    api.cancel();
    stopWaitTimer();
    dispatch({ type: 'RESET' });
  }, [api, stopWaitTimer, state.phase]);

  return {
    state,
    startSession,
    sendMessage,
    submitReflection,
    beginReflection,
    finish,
    reset,
    continueChat,
  };
}
