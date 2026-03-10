/**
 * Client-side encryption module using Web Crypto API.
 *
 * Security model:
 * - User enters a 4–6 digit PIN (never persisted)
 * - PIN is stretched via PBKDF2 (100 000 iterations, SHA-256)
 *   into a 256-bit AES-GCM key
 * - Each encrypt() call generates a fresh 96-bit IV
 * - Output format: base64(IV ‖ ciphertext ‖ authTag)
 * - Salt (16 bytes) is stored *unencrypted* in localStorage
 *   and is required to re-derive the same key from the PIN
 *
 * Why PBKDF2 instead of storing the key?
 * → A raw key in localStorage is readable by any XSS.
 *   With PBKDF2 the key only exists in volatile CryptoKey
 *   form while the user's session is active.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** PBKDF2 iteration count — OWASP 2024 minimum for SHA-256 */
const PBKDF2_ITERATIONS = 100_000;

/** Salt length in bytes */
const SALT_BYTES = 16;

/** AES-GCM initialisation vector length in bytes */
const IV_BYTES = 12;

/** Algorithm identifiers (typed for Web Crypto) */
const KDF_ALGO = 'PBKDF2' as const;
const CIPHER_ALGO = 'AES-GCM' as const;
const HASH_ALGO = 'SHA-256' as const;

// ---------------------------------------------------------------------------
// Helpers: base64 ↔ Uint8Array  (no external deps)
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Salt generation
// ---------------------------------------------------------------------------

/** Generate a cryptographically random salt (16 bytes). */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

/** Encode a salt to a base64 string for localStorage storage. */
export function encodeSalt(salt: Uint8Array): string {
  return toBase64(salt);
}

/** Decode a base64-encoded salt back to bytes. */
export function decodeSalt(encoded: string): Uint8Array {
  return fromBase64(encoded);
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derive an AES-256-GCM CryptoKey from a PIN + salt.
 *
 * 1. Import the PIN as raw key material for PBKDF2
 * 2. Run PBKDF2 with 100 000 iterations
 * 3. Return a non-extractable CryptoKey usable for encrypt/decrypt
 */
export async function deriveKey(
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  // Encode PIN to bytes
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);

  // Import as raw PBKDF2 material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBytes,
    KDF_ALGO,
    false, // not extractable
    ['deriveKey'],
  );

  // Derive AES-256-GCM key
  // Explicit ArrayBuffer cast required by TS 5.9 strict BufferSource typing
  return crypto.subtle.deriveKey(
    {
      name: KDF_ALGO,
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    { name: CIPHER_ALGO, length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string with AES-256-GCM.
 *
 * @returns base64(IV ‖ ciphertext+authTag)
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Fresh IV per encryption — CRITICAL for GCM security
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: CIPHER_ALGO, iv },
    key,
    data,
  );

  // Prepend IV to ciphertext so we can recover it on decrypt
  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(IV_BYTES + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, IV_BYTES);

  return toBase64(combined);
}

/**
 * Decrypt a base64(IV ‖ ciphertext+authTag) payload.
 *
 * @throws DOMException if the PIN (and thus key) is wrong
 */
export async function decrypt(
  ciphertext: string,
  key: CryptoKey,
): Promise<string> {
  const combined = fromBase64(ciphertext);

  // Split IV from ciphertext
  const iv = combined.slice(0, IV_BYTES);
  const data = combined.slice(IV_BYTES);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: CIPHER_ALGO, iv },
    key,
    data,
  );

  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

// ---------------------------------------------------------------------------
// PIN validation
// ---------------------------------------------------------------------------

/** Minimum PIN length */
export const PIN_MIN_LENGTH = 4;

/** Maximum PIN length */
export const PIN_MAX_LENGTH = 6;

/** Validate that a PIN is 4–6 numeric digits. */
export function isValidPin(pin: string): boolean {
  return (
    pin.length >= PIN_MIN_LENGTH &&
    pin.length <= PIN_MAX_LENGTH &&
    /^\d+$/.test(pin)
  );
}
