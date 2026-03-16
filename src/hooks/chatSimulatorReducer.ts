/**
 * chatSimulatorReducer.ts — pure reducer and helper functions
 * for the useChatSimulator engine.
 *
 * No React imports — this is plain TypeScript.
 */

import type { EngineState, Action } from './chatSimulatorTypes';
import { initialState } from './chatSimulatorTypes';
import type { ChoiceOption } from '@/types/simulation';
import { assertNever } from '@/lib/guards';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function reducer(state: EngineState, action: Action): EngineState {
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
      return assertNever(action);
  }
}

// ---------------------------------------------------------------------------
// Typing delay calculator (interaction-design: 100-300ms range)
// ---------------------------------------------------------------------------

/**
 * Sorts choice options so correct answers come first, wrong answer last.
 * Deterministic (no random shuffle) — wrong option is always position 3.
 */
export function sortChoices(opts: readonly ChoiceOption[]): readonly ChoiceOption[] {
  return [...opts].sort((a, b) => (b.correct ? 1 : 0) - (a.correct ? 1 : 0));
}

/** Calculates a realistic typing delay based on message length */
export function calcTypingDelay(text: string): number {
  const base = 600;
  const perChar = 25;
  return Math.min(base + text.length * perChar, 2500);
}

/** Short pause between consecutive messages */
export const MESSAGE_GAP = 300;
