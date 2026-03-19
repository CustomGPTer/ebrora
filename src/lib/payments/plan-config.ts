export const PLAN_CONFIG = {
  STANDARD_MONTHLY: {
    tier: 'STANDARD',
    billing: 'MONTHLY',
    price: '9.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STANDARD_MONTHLY || '',
    ramsLimit: 10,
    formatsAccess: 'ALL',
  },
  STANDARD_YEARLY: {
    tier: 'STANDARD',
    billing: 'YEARLY',
    price: '99.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_STANDARD_YEARLY || '',
    ramsLimit: 10,
    formatsAccess: 'ALL',
  },
  PROFESSIONAL_MONTHLY: {
    tier: 'PROFESSIONAL',
    billing: 'MONTHLY',
    price: '19.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '',
    ramsLimit: 30,
    formatsAccess: 'ALL',
  },
  PROFESSIONAL_YEARLY: {
    tier: 'PROFESSIONAL',
    billing: 'YEARLY',
    price: '199.99',
    currency: 'GBP',
    paypalPlanId: process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '',
    ramsLimit: 30,
    formatsAccess: 'ALL',
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
    case 'PROFESSIONAL':
      return 30;
    case 'STANDARD':
      return 10;
    case 'FREE':
    default:
      return 1;
  }
}

export function getFormatsAccessByTier(tier: string): 'LIMITED' | 'ALL' {
  switch (tier) {
    case 'PROFESSIONAL':
    case 'STANDARD':
      return 'ALL';
    case 'FREE':
    default:
      return 'LIMITED';
  }
}
