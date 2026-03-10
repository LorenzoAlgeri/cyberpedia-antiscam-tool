/**
 * Encrypted storage layer for emergency data.
 *
 * localStorage layout:
 *   "antiscam-salt"  → base64-encoded 16-byte PBKDF2 salt
 *   "antiscam-data"  → base64(IV ‖ AES-256-GCM ciphertext)
 *
 * The encryption key is NEVER persisted — it is derived at
 * runtime from the user's PIN via PBKDF2 (see encryption.ts).
 *
 * Public API:
 *   hasStoredData()         → boolean (quick check, no PIN needed)
 *   saveEmergencyData(…)    → encrypt & persist
 *   loadEmergencyData(…)    → decrypt & return
 *   clearStoredData()       → wipe both keys from localStorage
 */

import type { EmergencyData } from '@/types/emergency';
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  encodeSalt,
  decodeSalt,
} from '@/lib/encryption';

// ---------------------------------------------------------------------------
// localStorage key names
// ---------------------------------------------------------------------------

const STORAGE_KEY_SALT = 'antiscam-salt' as const;
const STORAGE_KEY_DATA = 'antiscam-data' as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether encrypted emergency data already exists.
 * Does NOT require the PIN — just checks if the keys are present.
 */
export function hasStoredData(): boolean {
  return (
    localStorage.getItem(STORAGE_KEY_SALT) !== null &&
    localStorage.getItem(STORAGE_KEY_DATA) !== null
  );
}

/**
 * Encrypt and persist emergency data.
 *
 * - If no salt exists yet (first save), a fresh one is generated.
 * - Overwrites any previous ciphertext.
 *
 * @param data - The emergency data payload to encrypt
 * @param pin  - The user's 4–6 digit PIN (never stored)
 */
export async function saveEmergencyData(
  data: EmergencyData,
  pin: string,
): Promise<void> {
  // Retrieve or generate the PBKDF2 salt
  let salt: Uint8Array;
  const existingSalt = localStorage.getItem(STORAGE_KEY_SALT);

  if (existingSalt) {
    salt = decodeSalt(existingSalt);
  } else {
    salt = generateSalt();
    localStorage.setItem(STORAGE_KEY_SALT, encodeSalt(salt));
  }

  // Derive key from PIN + salt
  const key = await deriveKey(pin, salt);

  // Stamp the save time
  const stamped: EmergencyData = {
    ...data,
    lastSaved: new Date().toISOString(),
  };

  // Encrypt and persist
  const ciphertext = await encrypt(JSON.stringify(stamped), key);
  localStorage.setItem(STORAGE_KEY_DATA, ciphertext);
}

/**
 * Decrypt and return stored emergency data.
 *
 * @param pin - The user's PIN to re-derive the decryption key
 * @returns The decrypted data, or `null` if nothing is stored
 * @throws {Error} If the PIN is wrong (AES-GCM auth tag mismatch)
 */
export async function loadEmergencyData(
  pin: string,
): Promise<EmergencyData | null> {
  const saltB64 = localStorage.getItem(STORAGE_KEY_SALT);
  const ciphertext = localStorage.getItem(STORAGE_KEY_DATA);

  if (!saltB64 || !ciphertext) {
    return null;
  }

  const salt = decodeSalt(saltB64);
  const key = await deriveKey(pin, salt);

  // decrypt() throws DOMException on wrong PIN (GCM auth failure)
  const json = await decrypt(ciphertext, key);
  return JSON.parse(json) as EmergencyData;
}

/**
 * Remove all stored data from localStorage.
 * Call this for a full reset / "forget my data" flow.
 */
export function clearStoredData(): void {
  localStorage.removeItem(STORAGE_KEY_SALT);
  localStorage.removeItem(STORAGE_KEY_DATA);
}
