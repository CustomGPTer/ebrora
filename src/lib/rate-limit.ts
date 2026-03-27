// =============================================================================
// In-memory IP rate limiter.
// Simple sliding-window counter per IP. Resets on redeploy (acceptable for
// abuse prevention — not a billing-grade limiter).
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, RateLimitEntry>();

// Periodically purge expired entries to prevent memory leaks
const PURGE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let lastPurge = Date.now();

function purgeExpired() {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}

/**
 * Check whether a request from the given IP should be allowed.
 *
 * @param ip        - Client IP address
 * @param action    - Action identifier (e.g. 'register', 'forgot-password')
 * @param limit     - Max requests allowed per window
 * @param windowMs  - Window duration in milliseconds (default 1 hour)
 * @returns { allowed, remaining, retryAfterMs }
 */
export function rateLimit(
  ip: string,
  action: string,
  limit: number,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  purgeExpired();

  const key = `${action}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);

  // No existing entry or window expired — allow and start fresh
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  // Within window — check count
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/**
 * Extract client IP from request headers (Vercel sets x-forwarded-for).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

// ── Pre-configured limits (per hour) ────────────────────────────────────────
export const RATE_LIMITS = {
  register: 5,
  forgotPassword: 5,
  contact: 10,
  emailCapture: 10,
} as const;
