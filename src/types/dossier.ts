/**
 * Type definitions for the encrypted scam dossier.
 *
 * Data model:
 * - Scammer identity (name/nickname, contacts)
 * - Evidence (screenshots compressed via canvas, notes, dates, amounts)
 * - All stored encrypted in localStorage with same AES-256-GCM + PIN
 */

/** Contact channel used by the scammer */
export interface ScammerContact {
  type: 'phone' | 'email' | 'social' | 'other';
  value: string;
  label: string;
}

/** A compressed screenshot stored as data URI */
export interface DossierScreenshot {
  /** data:image/jpeg;base64,... */
  dataUri: string;
  /** Original filename for reference */
  filename: string;
  /** Approximate size in bytes of the base64 payload */
  sizeBytes: number;
  /** ISO 8601 timestamp */
  addedAt: string;
}

/** Full dossier payload — encrypted as a single JSON blob */
export interface DossierData {
  scammerName: string;
  scammerContacts: ScammerContact[];
  screenshots: DossierScreenshot[];
  notes: string;
  /** Free-text dates (e.g. "15 marzo 2026 — primo contatto") */
  dates: string;
  /** Free-text amounts (e.g. "500 EUR richiesti via bonifico") */
  amounts: string;
  createdAt: string;
  updatedAt: string;
}

/** Maximum number of screenshots allowed */
export const MAX_SCREENSHOTS = 5;

/**
 * Maximum size per compressed screenshot (base64 data URI string length).
 * ~400KB of base64 ≈ ~300KB of image data.
 * Budget: 5 × 400KB = 2MB → after encrypt+base64 ≈ 2.7MB in localStorage.
 */
export const MAX_SCREENSHOT_STRING_LENGTH = 400_000;

/** Factory for a blank dossier */
export function createEmptyDossier(): DossierData {
  const now = new Date().toISOString();
  return {
    scammerName: '',
    scammerContacts: [],
    screenshots: [],
    notes: '',
    dates: '',
    amounts: '',
    createdAt: now,
    updatedAt: now,
  };
}
