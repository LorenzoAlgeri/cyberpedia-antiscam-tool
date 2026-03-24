/**
 * CORS utility for antiscam-worker.
 *
 * Policy:
 * - Reflect the specific allowed origin (never wildcard)
 * - Omit Access-Control-Allow-Origin entirely for disallowed origins
 *   → browser blocks the request, which is the correct behavior
 * - Handles preflight (OPTIONS) with 204 No Content
 */

const ALLOWED_ORIGINS = new Set([
  'https://cyberpedia.it',
  'https://www.cyberpedia.it',
  'https://antiscam.pages.dev',
  'https://cyberpedia-antiscam-tool.pages.dev',
  'http://localhost:5173',
]);

/** Cloudflare Pages preview deploys: *.cyberpedia-antiscam-tool.pages.dev */
const PAGES_PREVIEW_PATTERN = /^https:\/\/[a-z0-9]+\.cyberpedia-antiscam-tool\.pages\.dev$/;

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin) || PAGES_PREVIEW_PATTERN.test(origin);
}

/**
 * Security headers applied to every worker response.
 * The worker is an API — it must never be framed or sniffed.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '0', // modern: rely on CSP, not legacy filter
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Returns CORS + security headers appropriate for the request origin.
 * Access-Control-Allow-Origin is only included for allowlisted origins.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/** Handles CORS preflight — returns 204 with CORS headers */
export function handlePreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
