// =============================================================================
// Origin-based CSRF protection for mutation endpoints.
// Validates that the Origin (or Referer) header matches the expected domain.
// Lightweight alternative to full CSRF tokens — no frontend changes needed.
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://www.ebrora.com',
  'https://ebrora.com',
];

// Allow localhost in development
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001');
}

/**
 * Check the Origin (or Referer) header against allowed origins.
 * Returns true if the request origin is trusted.
 *
 * Skips check for:
 * - Requests with no Origin AND no Referer (e.g. server-to-server, curl)
 *   These are allowed because they can't carry cookies cross-site.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // No Origin and no Referer — likely not a browser request (API client, cURL, etc.)
  // These can't perform CSRF because they don't attach cookies automatically.
  if (!origin && !referer) {
    return true;
  }

  // Check Origin header first (most reliable)
  if (origin) {
    return ALLOWED_ORIGINS.includes(origin);
  }

  // Fall back to Referer
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return ALLOWED_ORIGINS.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  return false;
}
