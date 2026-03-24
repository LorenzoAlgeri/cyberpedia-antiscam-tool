/**
 * Encrypted storage for scam dossier data.
 *
 * Reuses the same PBKDF2 salt and PIN as emergency data.
 * Stored under a separate localStorage key so the two can be
 * loaded/saved independently.
 *
 * localStorage key: "antiscam-dossier" → base64(IV ‖ AES-256-GCM ciphertext)
 */

import type { DossierData, DossierScreenshot, ScammerContact } from '@/types/dossier';
import { createEmptyDossier, MAX_SCREENSHOTS } from '@/types/dossier';
import {
  deriveKey,
  encrypt,
  decrypt,
  decodeSalt,
  safeFromBase64,
  isValidCiphertextStructure,
  PBKDF2_ITERATIONS,
} from '@/lib/encryption';
import { isCryptoAvailable } from '@/lib/crypto-support';

const STORAGE_KEY_DOSSIER = 'antiscam-dossier' as const;
const STORAGE_KEY_SALT = 'antiscam-salt' as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidContact(v: unknown): v is ScammerContact {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r['type'] === 'string' &&
    typeof r['value'] === 'string' &&
    typeof r['label'] === 'string'
  );
}

function isValidScreenshot(v: unknown): v is DossierScreenshot {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r['dataUri'] === 'string' &&
    typeof r['filename'] === 'string' &&
    typeof r['sizeBytes'] === 'number' &&
    typeof r['addedAt'] === 'string'
  );
}

/** Validate and normalize unknown JSON into DossierData. Never throws. */
export function validateDossierData(raw: unknown): DossierData {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return createEmptyDossier();
  }
  const obj = raw as Record<string, unknown>;
  const defaults = createEmptyDossier();

  const scammerContacts = Array.isArray(obj['scammerContacts'])
    ? (obj['scammerContacts'] as unknown[]).filter(isValidContact).slice(0, 10)
    : defaults.scammerContacts;

  const screenshots = Array.isArray(obj['screenshots'])
    ? (obj['screenshots'] as unknown[]).filter(isValidScreenshot).slice(0, MAX_SCREENSHOTS)
    : defaults.screenshots;

  return {
    scammerName: typeof obj['scammerName'] === 'string' ? obj['scammerName'] : defaults.scammerName,
    scammerContacts,
    screenshots,
    notes: typeof obj['notes'] === 'string' ? obj['notes'] : defaults.notes,
    dates: typeof obj['dates'] === 'string' ? obj['dates'] : defaults.dates,
    amounts: typeof obj['amounts'] === 'string' ? obj['amounts'] : defaults.amounts,
    createdAt: typeof obj['createdAt'] === 'string' ? obj['createdAt'] : defaults.createdAt,
    updatedAt: typeof obj['updatedAt'] === 'string' ? obj['updatedAt'] : defaults.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Quick check — does a dossier blob exist in localStorage? */
export function hasDossierData(): boolean {
  return localStorage.getItem(STORAGE_KEY_DOSSIER) !== null;
}

/**
 * Encrypt and persist dossier data using the same salt + PIN as emergency data.
 * The salt MUST already exist (user must have set up their PIN via EmergencyPage).
 */
export async function saveDossierData(data: DossierData, pin: string): Promise<void> {
  if (!isCryptoAvailable()) {
    localStorage.setItem(STORAGE_KEY_DOSSIER, JSON.stringify(data));
    return;
  }

  const saltB64 = localStorage.getItem(STORAGE_KEY_SALT);
  if (!saltB64) throw new Error('Nessun PIN configurato. Salva prima il tuo profilo di emergenza.');

  const salt = decodeSalt(saltB64);
  const key = await deriveKey(pin, salt, PBKDF2_ITERATIONS);
  const stamped: DossierData = { ...data, updatedAt: new Date().toISOString() };
  const ciphertext = await encrypt(JSON.stringify(stamped), key);

  try {
    localStorage.setItem(STORAGE_KEY_DOSSIER, ciphertext);
  } catch {
    throw new Error('Spazio di archiviazione esaurito. Prova a rimuovere alcuni screenshot.');
  }
}

/**
 * Decrypt and return dossier data.
 * @returns null if no dossier exists
 * @throws DOMException if PIN is wrong
 */
export async function loadDossierData(pin: string): Promise<DossierData | null> {
  const ciphertext = localStorage.getItem(STORAGE_KEY_DOSSIER);
  if (!ciphertext) return null;

  if (!isCryptoAvailable()) {
    try {
      return validateDossierData(JSON.parse(ciphertext));
    } catch {
      return null;
    }
  }

  const saltB64 = localStorage.getItem(STORAGE_KEY_SALT);
  if (!saltB64) return null;

  const cipherBytes = safeFromBase64(ciphertext);
  if (!cipherBytes || !isValidCiphertextStructure(cipherBytes)) return null;

  const salt = decodeSalt(saltB64);
  const key = await deriveKey(pin, salt, PBKDF2_ITERATIONS);
  const json = await decrypt(ciphertext, key);
  return validateDossierData(JSON.parse(json));
}

/** Remove dossier from localStorage. */
export function clearDossierData(): void {
  localStorage.removeItem(STORAGE_KEY_DOSSIER);
}
