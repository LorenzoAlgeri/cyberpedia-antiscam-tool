/**
 * Encrypted storage layer for emergency data.
 *
 * localStorage layout (encrypted mode):
 *   "antiscam-salt"  -> base64-encoded 16-byte PBKDF2 salt
 *   "antiscam-data"  -> base64(IV || AES-256-GCM ciphertext)
 *
 * localStorage layout (plaintext fallback -- no Web Crypto API):
 *   "antiscam-data-plain" -> JSON string of EmergencyData
 *
 * The encryption key is NEVER persisted -- it is derived at
 * runtime from the user's PIN via PBKDF2 (see encryption.ts).
 *
 * Public API:
 *   hasStoredData()         -> boolean (quick check, no PIN needed)
 *   saveEmergencyData(...)  -> encrypt & persist
 *   loadEmergencyData(...)  -> decrypt & return
 *   clearStoredData()       -> wipe all known keys from localStorage
 */

import type { EmergencyData } from '@/types/emergency';
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  encodeSalt,
  decodeSalt,
  safeFromBase64,
  safeDecodeSalt,
  isValidCiphertextStructure,
} from '@/lib/encryption';
import { isCryptoAvailable } from '@/lib/crypto-support';

// ---------------------------------------------------------------------------
// localStorage key names
// ---------------------------------------------------------------------------

const STORAGE_KEY_SALT = 'antiscam-salt' as const;
const STORAGE_KEY_DATA = 'antiscam-data' as const;
// Legacy key written by an old implementation that exported a raw AES key.
// The current scheme derives the key from PIN+PBKDF2 and never persists it.
const STORAGE_KEY_LEGACY_KEY = 'antiscam-key' as const;
/** Key for plaintext fallback data (used when Web Crypto API is unavailable). */
const STORAGE_KEY_PLAINTEXT = 'antiscam-data-plain' as const;

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/** Corruption kind for structured error handling in UI. */
type CorruptionKind = 'missing-pair' | 'invalid-salt' | 'invalid-ciphertext';

/**
 * Thrown when localStorage data is structurally invalid (as opposed to
 * a wrong-PIN OperationError from AES-GCM auth failure).
 *
 * Callers (EmergencyPage, NeedModePage) use `instanceof StorageCorruptionError`
 * to distinguish corruption from wrong PIN and show the appropriate Italian message.
 */
export class StorageCorruptionError extends Error {
  readonly kind: CorruptionKind;
  constructor(kind: CorruptionKind) {
    super(`Storage corruption: ${kind}`);
    this.name = 'StorageCorruptionError';
    this.kind = kind;
  }
}

// ---------------------------------------------------------------------------
// Security migration
// ---------------------------------------------------------------------------

/**
 * Erase any legacy raw CryptoKey from localStorage.
 *
 * An early prototype stored an extractable AES-256-GCM key directly in
 * localStorage under "antiscam-key". If found, remove the key, associated
 * ciphertext, and the salt (incompatible with PBKDF2 scheme). The user
 * will be treated as a first-time visitor.
 */
function eraseLegacyKey(): void {
  if (localStorage.getItem(STORAGE_KEY_LEGACY_KEY) !== null) {
    localStorage.removeItem(STORAGE_KEY_LEGACY_KEY);
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_SALT);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether emergency data already exists (encrypted or plaintext).
 * Does NOT require the PIN -- just checks if the keys are present.
 */
export function hasStoredData(): boolean {
  eraseLegacyKey();
  if (!isCryptoAvailable()) {
    return localStorage.getItem(STORAGE_KEY_PLAINTEXT) !== null;
  }
  return (
    localStorage.getItem(STORAGE_KEY_SALT) !== null &&
    localStorage.getItem(STORAGE_KEY_DATA) !== null
  );
}

/**
 * Encrypt and persist emergency data.
 *
 * @param data - The emergency data payload to encrypt
 * @param pin  - The user's 4-6 digit PIN (ignored in plaintext fallback)
 */
export async function saveEmergencyData(
  data: EmergencyData,
  pin: string,
): Promise<void> {
  eraseLegacyKey();

  // Stamp the save time
  const stamped: EmergencyData = {
    ...data,
    lastSaved: new Date().toISOString(),
  };

  // --- Plaintext fallback (no Web Crypto API) ---
  // Per CONTEXT.md: "store data in plaintext localStorage if crypto.subtle
  // is unavailable. Tool remains fully functional."
  if (!isCryptoAvailable()) {
    localStorage.setItem(STORAGE_KEY_PLAINTEXT, JSON.stringify(stamped));
    return;
  }

  // --- Encrypted path (normal) ---
  // Empty/default EmergencyData is allowed -- user may save with no fields filled.

  // Retrieve or generate the PBKDF2 salt
  let salt: Uint8Array;
  const existingSalt = localStorage.getItem(STORAGE_KEY_SALT);

  if (existingSalt) {
    salt = decodeSalt(existingSalt);
  } else {
    salt = generateSalt();
    localStorage.setItem(STORAGE_KEY_SALT, encodeSalt(salt));
  }

  const key = await deriveKey(pin, salt);
  const ciphertext = await encrypt(JSON.stringify(stamped), key);
  localStorage.setItem(STORAGE_KEY_DATA, ciphertext);
}

/**
 * Decrypt and return stored emergency data.
 *
 * @param pin - The user's PIN to re-derive the decryption key
 * @returns The decrypted data, or `null` if nothing is stored
 * @throws {StorageCorruptionError} If localStorage data is structurally invalid
 * @throws {DOMException} OperationError if the PIN is wrong (GCM auth failure)
 */
export async function loadEmergencyData(
  pin: string,
): Promise<EmergencyData | null> {
  eraseLegacyKey();

  // --- Plaintext fallback (no Web Crypto API) ---
  if (!isCryptoAvailable()) {
    const plain = localStorage.getItem(STORAGE_KEY_PLAINTEXT);
    if (!plain) return null;
    return JSON.parse(plain) as EmergencyData;
  }

  // --- Encrypted path (normal) ---
  const saltB64 = localStorage.getItem(STORAGE_KEY_SALT);
  const ciphertext = localStorage.getItem(STORAGE_KEY_DATA);

  // Case 1: No data stored at all
  if (!saltB64 && !ciphertext) return null;

  // Case 2: Inconsistent state (salt without data or vice versa)
  if (!saltB64 || !ciphertext) {
    throw new StorageCorruptionError('missing-pair');
  }

  // Case 3: Invalid base64 in salt
  const salt = safeDecodeSalt(saltB64);
  if (!salt) {
    throw new StorageCorruptionError('invalid-salt');
  }

  // Case 4: Invalid base64 or too-short ciphertext
  const cipherBytes = safeFromBase64(ciphertext);
  if (!cipherBytes || !isValidCiphertextStructure(cipherBytes)) {
    throw new StorageCorruptionError('invalid-ciphertext');
  }

  // Case 5: Derive key and attempt decryption
  // decrypt() throws OperationError (DOMException) on wrong PIN
  const key = await deriveKey(pin, salt);
  const json = await decrypt(ciphertext, key);
  return JSON.parse(json) as EmergencyData;
}

/**
 * Remove all stored data from localStorage, including any legacy entries.
 * Call this for a full reset / "forget my data" flow.
 */
/** @public Intentional public API for future "forget my data" feature */
export function clearStoredData(): void {
  localStorage.removeItem(STORAGE_KEY_SALT);
  localStorage.removeItem(STORAGE_KEY_DATA);
  localStorage.removeItem(STORAGE_KEY_LEGACY_KEY);
  localStorage.removeItem(STORAGE_KEY_PLAINTEXT);
  clearPersistedAttempts();
  clearPinCache();
}

// ---------------------------------------------------------------------------
// PIN session cache -- sessionStorage (tab-scoped, cleared on tab close)
// ---------------------------------------------------------------------------

const SESSION_KEY_PIN = 'antiscam-session-pin' as const;
const SESSION_KEY_EXPIRY = 'antiscam-session-expiry' as const;

/** 1 hour in milliseconds */
const PIN_SESSION_TTL_MS = 60 * 60 * 1000;

/**
 * Cache the PIN in sessionStorage for up to 1 hour.
 *
 * sessionStorage is tab-scoped and cleared on tab close, making it
 * significantly safer than localStorage for short-lived credentials.
 */
export function cachePin(pin: string): void {
  const expiry = Date.now() + PIN_SESSION_TTL_MS;
  sessionStorage.setItem(SESSION_KEY_PIN, pin);
  sessionStorage.setItem(SESSION_KEY_EXPIRY, String(expiry));
}

/**
 * Return the cached PIN if the session is still valid, otherwise null.
 * Automatically clears expired cache entries.
 */
export function getCachedPin(): string | null {
  const expiry = sessionStorage.getItem(SESSION_KEY_EXPIRY);
  const expiryMs = parseInt(expiry ?? '', 10);
  if (!expiry || Number.isNaN(expiryMs) || Date.now() > expiryMs) {
    clearPinCache();
    return null;
  }
  return sessionStorage.getItem(SESSION_KEY_PIN);
}

/** Remove the cached PIN and its expiry from sessionStorage. */
export function clearPinCache(): void {
  sessionStorage.removeItem(SESSION_KEY_PIN);
  sessionStorage.removeItem(SESSION_KEY_EXPIRY);
}

// ---------------------------------------------------------------------------
// Brute-force attempt counter -- localStorage (survives refresh/tab close)
// ---------------------------------------------------------------------------

const ATTEMPTS_KEY = 'antiscam-attempts' as const;
const ATTEMPTS_TS_KEY = 'antiscam-attempts-ts' as const;

/** Read persisted attempt count. Returns 0 if missing or corrupt. */
export function getPersistedAttempts(): number {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Persist updated attempt count and timestamp. */
export function persistAttempts(count: number): void {
  localStorage.setItem(ATTEMPTS_KEY, String(count));
  localStorage.setItem(ATTEMPTS_TS_KEY, String(Date.now()));
}

/** Clear persisted attempt counter (called on successful unlock). */
export function clearPersistedAttempts(): void {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(ATTEMPTS_TS_KEY);
}
