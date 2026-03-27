// =============================================================================
// Shared tier resolution logic.
// Use this everywhere subscription tier needs to be determined from a DB record.
// Keeps behaviour consistent across JWT callback, download routes, AI tools, etc.
// =============================================================================
import type { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

interface SubscriptionRecord {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end?: Date | null;
}

/**
 * Resolve the effective tier for a user based on their subscription record.
 *
 * Rules:
 * - ACTIVE subscription → use the stored tier.
 * - CANCELLED with current_period_end in the future → use stored tier (grace period).
 * - Everything else (CANCELLED past expiry, PAST_DUE, SUSPENDED, no record) → FREE.
 */
export function resolveEffectiveTier(
  subscription: SubscriptionRecord | null | undefined
): SubscriptionTier {
  if (!subscription) return 'FREE';

  if (subscription.status === 'ACTIVE') {
    return subscription.tier;
  }

  // Cancelled but still within billing period (grace period)
  const isCancelledButValid =
    subscription.status === 'CANCELLED' &&
    subscription.tier !== 'FREE' &&
    subscription.current_period_end &&
    new Date() < subscription.current_period_end;

  if (isCancelledButValid) {
    return subscription.tier;
  }

  return 'FREE';
}
