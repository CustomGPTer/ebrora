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
 * Rejects requests with no Origin AND no Referer by default.
 * Server-to-server callers (webhooks, cron) should be excluded from
 * CSRF checks at the route level, not via a blanket null-origin bypass.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

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

  // No Origin AND no Referer — reject by default.
  // All modern browsers send at least one of these on form/fetch requests.
  return false;
}
