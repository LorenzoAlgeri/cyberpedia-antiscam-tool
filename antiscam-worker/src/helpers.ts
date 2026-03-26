/**
 * Shared utility functions for antiscam-worker handlers.
 *
 * Extracted from lead-handler.ts to avoid duplication across
 * lead-handler, feedback-handler, and future endpoints.
 */

/**
 * Extract client IP from Cloudflare header.
 */
export function getIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

/**
 * Return a JSON error response with CORS headers.
 */
export function jsonError(
  message: string,
  status: number,
  cors: Record<string, string>,
): Response {
  return Response.json({ error: message }, { status, headers: cors });
}

/**
 * Produce a hex-encoded SHA-256 hash of the given string.
 * Used to derive deterministic, non-reversible key suffixes.
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Escape special characters for Telegram HTML parse mode. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
