/**
 * chatSimulatorTypes.ts — pure types, state shape, and initial state
 * for the useChatSimulator engine.
 *
 * No React imports — this is plain TypeScript.
 */

import type {
  ChatEntry,
  ChoiceOption,
  EnginePhase,
  SimMessage,
  SimScore,
} from '@/types/simulation';

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

export interface EngineState {
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

export type Action =
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

export const initialState: EngineState = {
  phase: 'idle',
  stepIndex: 0,
  entries: [],
  currentChoices: [],
  followUpQueue: [],
  correctAnswers: 0,
  totalAttempts: 0,
  wrongShownForStep: null,
};

// ---------------------------------------------------------------------------
// Public hook return type
// ---------------------------------------------------------------------------

/** @public Hook return type — exported for consumer type inference */
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
