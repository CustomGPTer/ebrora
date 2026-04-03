// =============================================================================
// Unsubscribe token utility.
// Generates and verifies HMAC-SHA256 signed tokens so that unsubscribe links
// cannot be forged by guessing someone else's email address.
//
// Env var required: UNSUBSCRIBE_SECRET  (min 32 chars, random hex or base64)
// =============================================================================

import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_SECRET environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
}

/**
 * Generate an HMAC-SHA256 token for the given email address.
 */
export function signUnsubscribeToken(email: string): string {
  const secret = getSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('hex');
}

/**
 * Verify that a token matches the expected HMAC for the given email.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = signUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(token, 'hex')
  );
}

/**
 * Build a complete signed unsubscribe URL for a given email address.
 */
export function buildUnsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email);
  const encodedEmail = encodeURIComponent(email);
  return `https://www.ebrora.com/unsubscribe?email=${encodedEmail}&token=${token}`;
}
