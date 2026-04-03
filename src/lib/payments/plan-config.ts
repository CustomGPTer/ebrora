// =============================================================================
// Payment Plan Configuration — 4 Tiers
// STARTER (£9.99) | PROFESSIONAL (£24.99) | UNLIMITED (£49.99)
// STANDARD is kept as a legacy alias for STARTER until Batch 7 migration.
// =============================================================================

export const PLAN_CONFIG = {
  // ── Starter ──
  STARTER_MONTHLY: {
    tier: 'STARTER' as const,
    billing: 'MONTHLY' as const,
    price: '9.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STARTER_MONTHLY || '',
    ramsLimit: 5,
    formatsAccess: 'ALL' as const,
  },
  STARTER_YEARLY: {
    tier: 'STARTER' as const,
    billing: 'YEARLY' as const,
    price: '99.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STARTER_YEARLY || '',
    ramsLimit: 5,
    formatsAccess: 'ALL' as const,
  },
  // ── Legacy STANDARD aliases → same PayPal plans as Starter ──
  // Existing STANDARD subscribers keep working until Batch 7 data migration
  STANDARD_MONTHLY: {
    tier: 'STANDARD' as const,
    billing: 'MONTHLY' as const,
    price: '9.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STARTER_MONTHLY || process.env.PAYPAL_PLAN_STANDARD_MONTHLY || '',
    ramsLimit: 5,
    formatsAccess: 'ALL' as const,
  },
  STANDARD_YEARLY: {
    tier: 'STANDARD' as const,
    billing: 'YEARLY' as const,
    price: '99.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STARTER_YEARLY || process.env.PAYPAL_PLAN_STANDARD_YEARLY || '',
    ramsLimit: 5,
    formatsAccess: 'ALL' as const,
  },
  // ── Professional ──
  PROFESSIONAL_MONTHLY: {
    tier: 'PROFESSIONAL' as const,
    billing: 'MONTHLY' as const,
    price: '24.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY || process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '',
    ramsLimit: 15,
    formatsAccess: 'ALL' as const,
  },
  PROFESSIONAL_YEARLY: {
    tier: 'PROFESSIONAL' as const,
    billing: 'YEARLY' as const,
    price: '249.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY || process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '',
    ramsLimit: 15,
    formatsAccess: 'ALL' as const,
  },
  // ── Unlimited ──
  UNLIMITED_MONTHLY: {
    tier: 'UNLIMITED' as const,
    billing: 'MONTHLY' as const,
    price: '49.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_UNLIMITED_MONTHLY || '',
    ramsLimit: 9999,
    formatsAccess: 'ALL' as const,
  },
  UNLIMITED_YEARLY: {
    tier: 'UNLIMITED' as const,
    billing: 'YEARLY' as const,
    price: '499.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_UNLIMITED_YEARLY || '',
    ramsLimit: 9999,
    formatsAccess: 'ALL' as const,
  },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;
export type PlanConfig = typeof PLAN_CONFIG[PlanKey];

export function getPlanByTierAndBilling(
  tier: string,
  billing: string
): PlanConfig | null {
  const key = `${tier}_${billing}` as PlanKey;
  return PLAN_CONFIG[key] || null;
}

export function getPlanConfigByKey(planKey: string): PlanConfig | null {
  return PLAN_CONFIG[planKey as PlanKey] || null;
}

export const FREE_TIER = {
  tier: 'FREE',
  billing: 'MONTHLY',
  price: '0.00',
  currency: 'GBP',
  ramsLimit: 1,
  formatsAccess: 'LIMITED',
} as const;

export function getRamsLimitByTier(tier: string): number {
  switch (tier) {
    case 'UNLIMITED':
      return 9999;
    case 'PROFESSIONAL':
      return 15;
    case 'STARTER':
    case 'STANDARD': // legacy
      return 5;
    case 'FREE':
    default:
      return 1;
  }
}

export function getFormatsAccessByTier(tier: string): 'LIMITED' | 'ALL' {
  switch (tier) {
    case 'UNLIMITED':
    case 'PROFESSIONAL':
    case 'STARTER':
    case 'STANDARD': // legacy
      return 'ALL';
    case 'FREE':
    default:
      return 'LIMITED';
  }
}

// ── Resolve tier from PayPal plan ID ──
// Checks ALL configured plan IDs.
// Returns null if the plan ID doesn't match any known plan.

export function resolveTierFromPlanId(
  planId: string
): 'STARTER' | 'PROFESSIONAL' | 'UNLIMITED' | null {
  // Unlimited
  const unlimitedMonthly = process.env.PAYPAL_PLAN_UNLIMITED_MONTHLY || '';
  const unlimitedYearly = process.env.PAYPAL_PLAN_UNLIMITED_YEARLY || '';
  if (planId === unlimitedMonthly || planId === unlimitedYearly) {
    return 'UNLIMITED';
  }

  // Professional (check both new and legacy env var names)
  const proMonthly = process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY || process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '';
  const proYearly = process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY || process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '';
  if (planId === proMonthly || planId === proYearly) {
    return 'PROFESSIONAL';
  }

  // Starter (check both new and legacy env var names)
  const starterMonthly = process.env.PAYPAL_PLAN_STARTER_MONTHLY || process.env.PAYPAL_PLAN_STANDARD_MONTHLY || '';
  const starterYearly = process.env.PAYPAL_PLAN_STARTER_YEARLY || process.env.PAYPAL_PLAN_STANDARD_YEARLY || '';
  if (planId === starterMonthly || planId === starterYearly) {
    return 'STARTER';
  }

  console.warn(`Unknown PayPal plan ID: ${planId}`);
  return null;
}

// ── Resolve billing cycle from PayPal plan ID ──

export function resolveBillingFromPlanId(
  planId: string
): 'MONTHLY' | 'YEARLY' {
  const yearlyIds = [
    process.env.PAYPAL_PLAN_STARTER_YEARLY || '',
    process.env.PAYPAL_PLAN_STANDARD_YEARLY || '',       // legacy
    process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY || '',
    process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '',         // legacy
    process.env.PAYPAL_PLAN_UNLIMITED_YEARLY || '',
  ].filter(Boolean);

  if (yearlyIds.includes(planId)) {
    return 'YEARLY';
  }
  return 'MONTHLY';
}
