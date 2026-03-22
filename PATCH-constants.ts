// PATCH: src/lib/constants.ts
// Replace the existing TIER_LIMITS block with this expanded version.
// Adds templateDownloadsPerMonth and tbtDownloadsPerMonth to each tier.
//
// WHAT CHANGED:
// - FREE: added templateDownloadsPerMonth: 5, tbtDownloadsPerMonth: 4
// - STANDARD: added templateDownloadsPerMonth: 30, tbtDownloadsPerMonth: 20
// - PROFESSIONAL: added templateDownloadsPerMonth: 50, tbtDownloadsPerMonth: 40
// - ENTERPRISE: added templateDownloadsPerMonth: 'unlimited', tbtDownloadsPerMonth: 'unlimited'

/**
 * Tier-based Limits (Site-Wide)
 * One subscription governs RAMS Builder, Free Templates, and Toolbox Talks.
 */
export const TIER_LIMITS = {
  FREE: {
    ramsPerMonth: 1,
    templateDownloadsPerMonth: 5,
    tbtDownloadsPerMonth: 4,
    formats: 2,
    maxLogoSize: 1024 * 1024, // 1MB
    storageHours: 24,
  },
  STANDARD: {
    ramsPerMonth: 10,
    templateDownloadsPerMonth: 30,
    tbtDownloadsPerMonth: 20,
    formats: 10,
    maxLogoSize: 2 * 1024 * 1024, // 2MB
    storageHours: 7 * 24, // 7 days
  },
  PROFESSIONAL: {
    ramsPerMonth: 25,
    templateDownloadsPerMonth: 50,
    tbtDownloadsPerMonth: 40,
    formats: 10,
    maxLogoSize: 5 * 1024 * 1024, // 5MB
    storageHours: 30 * 24, // 30 days
  },
  ENTERPRISE: {
    ramsPerMonth: 'unlimited' as const,
    templateDownloadsPerMonth: 'unlimited' as const,
    tbtDownloadsPerMonth: 'unlimited' as const,
    formats: 10,
    maxLogoSize: 10 * 1024 * 1024, // 10MB
    storageHours: 'unlimited' as const,
  },
} as const;
