/**
 * useChatSimulator — state-machine engine for interactive chat simulations.
 *
 * Orchestrates:
 * - Progressive message delays (typing indicator → bubble)
 * - Decision points with 2-3 choices
 * - Correct answer: green feedback, advance, continue thread
 * - Wrong answer: amber feedback (never red), scammer stays in character,
 *   same choice re-presented until user picks correctly (retry loop)
 * - Completion when all choices answered correctly (Modello A)
 * - Final score: correctAnswers / totalAttempts
 *
 * Uses useReducer for predictable state transitions.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type {
  ChatEntry,
  ChoiceOption,
  EnginePhase,
  SimChoice,
  SimFeedback,
  SimMessage,
  SimScore,
  Simulation,
} from '@/types/simulation';

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface EngineState {
  phase: EnginePhase;
  /** Index into simulation.steps */
  stepIndex: number;
  /** Visible chat entries */
  entries: readonly ChatEntry[];
  /** Current choice options (when phase === 'choice') */
  currentChoices: readonly ChoiceOption[];
  /** Queue of follow-up messages to drain after correct feedback */
  followUpQueue: readonly SimMessage[];
  /** Correct answers accumulated across all choice points */
  correctAnswers: number;
  /** Total attempts made (>= correctAnswers) */
  totalAttempts: number;
  /**
   * stepIndex for which the wrongExplanation bubble was already shown.
   * null = not shown for current step. Prevents duplicate amber bubbles
   * when the user answers the same choice wrong more than once.
   */
  wrongShownForStep: number | null;
}

type Action =
  | { type: 'START' }
  | { type: 'SHOW_TYPING' }
  | { type: 'SHOW_MESSAGE'; entry: ChatEntry }
  | { type: 'SHOW_CHOICE'; options: readonly ChoiceOption[] }
  | { type: 'SHOW_FEEDBACK'; entry: ChatEntry }
  | { type: 'SHOW_RETRY'; entry: ChatEntry; stepIndex: number }
  | { type: 'RETRY_SILENT' }
  | { type: 'RECORD_CORRECT' }
  | { type: 'RECORD_WRONG' }
  | { type: 'QUEUE_FOLLOW_UPS'; messages: readonly SimMessage[] }
  | { type: 'ADVANCE' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

const initialState: EngineState = {
  phase: 'idle',
  stepIndex: 0,
  entries: [],
  currentChoices: [],
  followUpQueue: [],
  correctAnswers: 0,
  totalAttempts: 0,
  wrongShownForStep: null,
};

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'START':
      return { ...initialState, phase: 'typing', stepIndex: 0 };
    case 'SHOW_TYPING':
      return { ...state, phase: 'typing' };
    case 'SHOW_MESSAGE':
      return {
        ...state,
        phase: 'message',
        entries: [...state.entries, action.entry],
      };
    case 'SHOW_CHOICE':
      return { ...state, phase: 'choice', currentChoices: action.options };
    case 'SHOW_FEEDBACK':
      return {
        ...state,
        phase: 'feedback',
        entries: [...state.entries, action.entry],
        currentChoices: [],
      };
    case 'SHOW_RETRY':
      // Wrong answer: show amber feedback, hide choices, wait for retry
      return {
        ...state,
        phase: 'retry',
        entries: [...state.entries, action.entry],
        currentChoices: [],
        wrongShownForStep: action.stepIndex,
      };
    case 'RETRY_SILENT':
      // Subsequent wrong: change phase without adding a new feedback bubble
      return { ...state, phase: 'retry', currentChoices: [] };
    case 'RECORD_CORRECT':
      return {
        ...state,
        correctAnswers: state.correctAnswers + 1,
        totalAttempts: state.totalAttempts + 1,
      };
    case 'RECORD_WRONG':
      return { ...state, totalAttempts: state.totalAttempts + 1 };
    case 'QUEUE_FOLLOW_UPS':
      return { ...state, followUpQueue: action.messages };
    case 'ADVANCE':
      return { ...state, stepIndex: state.stepIndex + 1 };
    case 'COMPLETE':
      return { ...state, phase: 'complete' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Typing delay calculator (interaction-design: 100-300ms range)
// ---------------------------------------------------------------------------

/** Calculates a realistic typing delay based on message length */
function calcTypingDelay(text: string): number {
  const base = 600;
  const perChar = 25;
  return Math.min(base + text.length * perChar, 2500);
}

/** Short pause between consecutive messages */
const MESSAGE_GAP = 300;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ChatSimulatorResult {
  phase: EnginePhase;
  entries: readonly ChatEntry[];
  currentChoices: readonly ChoiceOption[];
  /** Populated only when phase === 'complete' */
  score: SimScore | null;
  start: () => void;
  selectChoice: (optionId: string) => void;
  reset: () => void;
}

export function useChatSimulator(
  simulation: Simulation | null,
): ChatSimulatorResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const simRef = useRef(simulation);
  useEffect(() => {
    simRef.current = simulation;
  }, [simulation]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Process next step in the script
  // -----------------------------------------------------------------------
  // Ref to hold latest processStep — avoids const TDZ in recursive setTimeout
  const processStepRef = useRef<(stepIndex: number) => void>(() => {});

  const processStep = useCallback(
    (stepIndex: number) => {
      const sim = simRef.current;
      if (!sim) return;

      // Drain follow-up queue first
      if (state.followUpQueue.length > 0) {
        // handled by the follow-up effect
        return;
      }

      if (stepIndex >= sim.steps.length) {
        dispatch({ type: 'COMPLETE' });
        return;
      }

      const step = sim.steps[stepIndex];
      if (!step) {
        dispatch({ type: 'COMPLETE' });
        return;
      }

      if (step.type === 'message') {
        const msg = step as SimMessage;
        dispatch({ type: 'SHOW_TYPING' });
        const delay = msg.delay ?? calcTypingDelay(msg.text);

        timerRef.current = setTimeout(() => {
          const entry: ChatEntry = {
            id: `msg-${stepIndex}-${Date.now()}`,
            sender: msg.sender,
            text: msg.text,
          };
          dispatch({ type: 'SHOW_MESSAGE', entry });
          dispatch({ type: 'ADVANCE' });

          // Small gap then process next — use ref to avoid const TDZ
          timerRef.current = setTimeout(() => {
            processStepRef.current(stepIndex + 1);
          }, MESSAGE_GAP);
        }, delay);
      } else if (step.type === 'choice') {
        const choice = step as SimChoice;
        dispatch({ type: 'SHOW_CHOICE', options: choice.options });
      }
      // 'feedback' steps are handled via selectChoice, not auto-processed
    },
    [state.followUpQueue.length],
  );

  // Keep ref pointing to the latest processStep — updated via effect (react-hooks/refs)
  useEffect(() => {
    processStepRef.current = processStep;
  }, [processStep]);

  // -----------------------------------------------------------------------
  // Follow-up queue draining (runs only after a CORRECT answer)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (state.followUpQueue.length === 0 || state.phase !== 'feedback') return;

    const msgs = [...state.followUpQueue];
    dispatch({ type: 'QUEUE_FOLLOW_UPS', messages: [] });

    let cumulativeDelay = 800; // initial pause after feedback
    const currentIndex = state.stepIndex;

    msgs.forEach((msg, i) => {
      const delay = msg.delay ?? calcTypingDelay(msg.text);

      setTimeout(() => {
        dispatch({ type: 'SHOW_TYPING' });
      }, cumulativeDelay);

      cumulativeDelay += delay;

      setTimeout(() => {
        const entry: ChatEntry = {
          id: `followup-${currentIndex}-${i}-${Date.now()}`,
          sender: msg.sender,
          text: msg.text,
        };
        dispatch({ type: 'SHOW_MESSAGE', entry });

        // After last follow-up, advance to next step
        if (i === msgs.length - 1) {
          timerRef.current = setTimeout(() => {
            processStepRef.current(currentIndex);
          }, MESSAGE_GAP);
        }
      }, cumulativeDelay);

      cumulativeDelay += MESSAGE_GAP;
    });
  }, [state.followUpQueue, state.phase, state.stepIndex, processStep]);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  const start = useCallback(() => {
    dispatch({ type: 'START' });
    // Kick off first step after brief pause
    timerRef.current = setTimeout(() => {
      processStepRef.current(0);
    }, 400);
  }, []);

  const selectChoice = useCallback(
    (optionId: string) => {
      const sim = simRef.current;
      if (!sim || state.phase !== 'choice') return;

      const stepIndex = state.stepIndex;
      const choiceStep = sim.steps[stepIndex];
      if (!choiceStep || choiceStep.type !== 'choice') return;

      const choice = choiceStep as SimChoice;
      const option = choice.options.find((o) => o.id === optionId);
      if (!option) return;

      // Add user's choice as a message
      const userEntry: ChatEntry = {
        id: `user-choice-${stepIndex}-${Date.now()}`,
        sender: 'user',
        text: option.text,
      };
      dispatch({ type: 'SHOW_MESSAGE', entry: userEntry });

      // Look for feedback step right after the choice
      const nextStep = sim.steps[stepIndex + 1];

      if (!nextStep || nextStep.type !== 'feedback') {
        // No feedback step — just advance (no retry possible)
        dispatch({ type: 'ADVANCE' });
        timerRef.current = setTimeout(() => {
          processStepRef.current(stepIndex + 1);
        }, MESSAGE_GAP);
        return;
      }

      const fb = nextStep as SimFeedback;

      if (option.correct) {
        // ── CORRECT ANSWER — green feedback, advance, continue ──────────
        const feedbackEntry: ChatEntry = {
          id: `feedback-${stepIndex}-${Date.now()}`,
          sender: 'feedback',
          text: fb.explanation,
          correct: true,
        };
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'SHOW_FEEDBACK', entry: feedbackEntry });
          dispatch({ type: 'RECORD_CORRECT' });
          dispatch({ type: 'ADVANCE' }); // past choice
          dispatch({ type: 'ADVANCE' }); // past feedback

          if (fb.followUp.length > 0) {
            dispatch({ type: 'QUEUE_FOLLOW_UPS', messages: fb.followUp });
          } else {
            timerRef.current = setTimeout(() => {
              processStepRef.current(stepIndex + 2);
            }, 800);
          }
        }, 500);
      } else {
        // ── WRONG ANSWER — amber feedback + retry ───────────────────────
        // UX rule: amber not red — red triggers panic in stressed users
        // wrongExplanation is shown at most once per SimChoice step.
        const alreadyShownWrong = state.wrongShownForStep === stepIndex;

        const wrongText =
          fb.wrongExplanation ??
          'Attenzione: questa risposta potrebbe metterti a rischio. Riprova.';
        const feedbackEntry: ChatEntry = {
          id: `feedback-wrong-${stepIndex}-${Date.now()}`,
          sender: 'feedback',
          text: wrongText,
          correct: false,
        };

        timerRef.current = setTimeout(() => {
          if (alreadyShownWrong) {
            // Subsequent wrong: change phase without adding a new bubble
            dispatch({ type: 'RETRY_SILENT' });
          } else {
            dispatch({ type: 'SHOW_RETRY', entry: feedbackEntry, stepIndex });
          }
          dispatch({ type: 'RECORD_WRONG' });

          if (fb.retryMessage) {
            // Scammer stays in character — type, show, then re-present choice
            const retryMsg = fb.retryMessage; // capture for closure
            timerRef.current = setTimeout(() => {
              dispatch({ type: 'SHOW_TYPING' });
              const delay = retryMsg.delay ?? calcTypingDelay(retryMsg.text);
              timerRef.current = setTimeout(() => {
                const retryEntry: ChatEntry = {
                  id: `retry-msg-${stepIndex}-${Date.now()}`,
                  sender: retryMsg.sender,
                  text: retryMsg.text,
                };
                dispatch({ type: 'SHOW_MESSAGE', entry: retryEntry });
                timerRef.current = setTimeout(() => {
                  dispatch({ type: 'SHOW_CHOICE', options: choice.options });
                }, MESSAGE_GAP);
              }, delay);
            }, 800);
          } else {
            // No retry message — re-present choice after short pause
            timerRef.current = setTimeout(() => {
              dispatch({ type: 'SHOW_CHOICE', options: choice.options });
            }, 800);
          }
        }, 500);
      }
    },
    [state.phase, state.stepIndex, state.wrongShownForStep],
  );

  const reset = useCallback(() => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    dispatch({ type: 'RESET' });
  }, []);

  // Compute final score — only available at completion
  const score: SimScore | null =
    state.phase === 'complete'
      ? { correctAnswers: state.correctAnswers, totalAttempts: state.totalAttempts }
      : null;

  return {
    phase: state.phase,
    entries: state.entries,
    currentChoices: state.currentChoices,
    score,
    start,
    selectChoice,
    reset,
  };
}
