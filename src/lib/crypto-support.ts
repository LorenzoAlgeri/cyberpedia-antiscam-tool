/**
 * Crypto API availability check.
 *
 * crypto.subtle is undefined in insecure contexts (HTTP, file://)
 * and in very old browsers. Cache the result at module load so
 * consumers can branch without repeated feature detection.
 */

let _cryptoAvailable: boolean | null = null;

/**
 * Check whether the Web Crypto API (crypto.subtle) is available.
 * Result is cached after the first call.
 *
 * When false, the app should fall back to plaintext localStorage
 * and show a persistent warning banner (per CONTEXT.md decision).
 */
export function isCryptoAvailable(): boolean {
  if (_cryptoAvailable === null) {
    _cryptoAvailable =
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof crypto.subtle.encrypt === 'function';
  }
  return _cryptoAvailable;
}
