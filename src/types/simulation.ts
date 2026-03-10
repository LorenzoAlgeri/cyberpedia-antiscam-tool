/**
 * Type definitions for the interactive chat simulations.
 *
 * Data model (discriminated union pattern — /typescript-advanced-types):
 * - SimMessage: a single message in the chat thread
 *   - 'scammer' | 'user' | 'system' sender types
 * - SimChoice:  a user decision point with 2-3 options
 * - SimFeedback: correct/wrong feedback after a choice
 * - SimStep:    discriminated union of all step types
 * - Simulation: full script for one simulation scenario
 */

// ---------------------------------------------------------------------------
// Chat message types
// ---------------------------------------------------------------------------

/** Who sent the message */
export type Sender = 'scammer' | 'user' | 'system';

/** A single chat bubble */
export interface SimMessage {
  readonly type: 'message';
  readonly sender: Sender;
  readonly text: string;
  /** Simulated typing delay before showing (ms). Defaults to auto-calc. */
  readonly delay?: number;
}

/** One option within a choice point */
export interface ChoiceOption {
  readonly id: string;
  readonly text: string;
  /** Is this the correct (safe) response? */
  readonly correct: boolean;
}

/** A decision point where the user picks a response */
export interface SimChoice {
  readonly type: 'choice';
  /** 2-3 options to pick from */
  readonly options: readonly ChoiceOption[];
}

/** Feedback shown after the user makes a choice */
export interface SimFeedback {
  readonly type: 'feedback';
  /** If true → user chose correctly */
  readonly correct: boolean;
  /** Explanation of why the choice was right or wrong */
  readonly explanation: string;
  /** Follow-up messages that continue the thread after feedback */
  readonly followUp: readonly SimMessage[];
}

// ---------------------------------------------------------------------------
// Step union — each "step" in a simulation script
// ---------------------------------------------------------------------------

export type SimStep = SimMessage | SimChoice | SimFeedback;

// ---------------------------------------------------------------------------
// Simulation meta + script
// ---------------------------------------------------------------------------

/** Full simulation scenario definition */
export interface Simulation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Lucide icon name for the card */
  readonly icon: string;
  /** Scammer display name shown in chat header */
  readonly scammerName: string;
  /** Ordered script of messages, choices, and feedback */
  readonly steps: readonly SimStep[];
}

// ---------------------------------------------------------------------------
// Runtime state (used by the engine hook)
// ---------------------------------------------------------------------------

/** Current state of the simulation engine */
export type EnginePhase =
  | 'idle'       // not started
  | 'typing'     // showing "sta scrivendo..." indicator
  | 'message'    // displaying a message bubble
  | 'choice'     // waiting for user to pick an option
  | 'feedback'   // showing correct/wrong feedback
  | 'complete';  // simulation finished

/** A rendered chat entry in the visible thread */
export interface ChatEntry {
  readonly id: string;
  readonly sender: Sender | 'feedback';
  readonly text: string;
  /** For feedback entries */
  readonly correct?: boolean;
}
