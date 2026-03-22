/**
 * To-do item type shared by generic and attack-specific lists.
 */

export type TodoScope = 'prevention' | 'repair' | 'both' | 'verify';

export interface TodoItem {
  /** Unique ID (stable, used for completed tracking) */
  readonly id: string;
  /** Display text (Italian) */
  readonly text: string;
  /** Priority order (1 = most urgent) */
  readonly priority: number;
  /**
   * High-level scope of the action.
   * Optional for legacy items; when present, used to label
   * prevention vs repair actions in the UI.
   */
  readonly scope?: TodoScope;
  /**
   * Marks an action as critical/severe — checking it triggers
   * the contextual micro-action banner (call bank / copy number).
   */
  readonly severe?: boolean;
  /**
   * Optional helper text shown below the item — expands on tap.
   * Used for items that need extra explanation (e.g. what 2FA is).
   */
  readonly hint?: string;
}
