/**
 * Type definitions for the feedback/bug-report widget.
 *
 * All fields are optional — the user can submit a screenshot-only report,
 * a text-only suggestion, or any combination. The only constraint is that
 * at least one field must have content (empty submissions are rejected).
 */

// ── Feedback categories ──────────────────────────────────────────────────────

export const FEEDBACK_CATEGORIES = [
  'bug',
  'fix-suggestion',
  'improvement',
  'general',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/** Italian labels — non-technical, friendly tone matching the app voice. */
export const FEEDBACK_CATEGORY_LABELS: Readonly<Record<FeedbackCategory, string>> = {
  'bug': 'Ho trovato un errore',
  'fix-suggestion': 'Qualcosa non funziona bene',
  'improvement': 'Suggerimento per migliorare',
  'general': 'Feedback generico',
} as const;

/** Short descriptions shown below each category card. */
export const FEEDBACK_CATEGORY_DESCRIPTIONS: Readonly<Record<FeedbackCategory, string>> = {
  'bug': 'Qualcosa si blocca o non si apre',
  'fix-suggestion': 'Funziona, ma potrebbe andare meglio',
  'improvement': 'Un\'idea per rendere il tool più utile',
  'general': 'Qualsiasi altra cosa tu voglia dirci',
} as const;

// ── Payload ──────────────────────────────────────────────────────────────────

export interface FeedbackPayload {
  readonly category?: FeedbackCategory;
  readonly message?: string;
  /** Email or phone — the user decides the format. */
  readonly contact?: string;
  /** Base64 data URIs from ScreenshotUpload. */
  readonly screenshots?: readonly string[];
  /** Hash/step identifier (e.g. "step-2") for context. */
  readonly page?: string;
  /** Navigator.userAgent for debugging. */
  readonly userAgent?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const MAX_FEEDBACK_SCREENSHOTS = 10;
export const MAX_FEEDBACK_MESSAGE = 2000;
export const MAX_FEEDBACK_CONTACT = 254;
