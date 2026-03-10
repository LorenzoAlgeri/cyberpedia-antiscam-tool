/**
 * To-do item type shared by generic and attack-specific lists.
 */

export interface TodoItem {
  /** Unique ID (stable, used for completed tracking) */
  readonly id: string;
  /** Display text (Italian) */
  readonly text: string;
  /** Priority order (1 = most urgent) */
  readonly priority: number;
}
