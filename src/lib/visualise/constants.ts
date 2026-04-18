// =============================================================================
// Visualise — Constants
// Monthly generation limits and draft caps per subscription tier.
// Visualise maintains its OWN quota, independent from the global aiToolUsesPerMonth
// counter used by COSHH / RAMS / other document tools.
//
// STANDARD is a legacy alias for STARTER — both get 4 uses/month.
// =============================================================================

import type { SubscriptionTier } from '@prisma/client';

/**
 * Monthly generation limits per tier.
 * One "use" = one Generate click (up to 3 visuals returned) OR one Regenerate click.
 * Preset cycling, canvas editing, and exports do NOT count.
 */
export const VISUALISE_LIMITS: Record<string, number> = {
  FREE: 0,          // Fully locked — landing page only
  STARTER: 4,
  STANDARD: 4,      // legacy alias → same as STARTER
  PROFESSIONAL: 8,
  UNLIMITED: 20,
};

/**
 * Maximum number of concurrent draft documents per user.
 * 4th save attempt must 409 with a clear message.
 */
export const VISUALISE_DRAFT_CAP = 3;

/**
 * Number of days before a saved draft expires from its last_saved_at.
 * Re-saving a draft refreshes the expiry.
 */
export const VISUALISE_DRAFT_EXPIRY_DAYS = 90;

/**
 * Maximum document blob size in bytes (post JSON.stringify).
 * 3 visuals × ~100 KB canvas state ≈ 300 KB typical.
 */
export const VISUALISE_BLOB_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

/**
 * Maximum user-pasted text length (word count).
 * Minimum 3 words — anything under is rejected client-side and server-side.
 */
export const VISUALISE_TEXT_MIN_WORDS = 3;
export const VISUALISE_TEXT_MAX_WORDS = 200;

/**
 * Maximum visuals returned per generation.
 */
export const VISUALISE_MAX_VISUALS_PER_GENERATION = 3;

/**
 * Per-export white-label logo upload cap (bytes).
 * Larger than the 0.5 MB cap on org-chart photos — logos may be high-res PNGs.
 */
export const VISUALISE_LOGO_MAX_BYTES = 1 * 1024 * 1024; // 1 MB

/**
 * Tool slug for AiToolGeneration / AiToolUsage reuse.
 * Stored as the `tool_slug` string value in those tables; not part of
 * the AiToolSlug TypeScript union because Visualise runs on its own
 * /api/visualise/* routes and doesn't use the generic ai-tools prompt
 * framework (TOOL_CONVERSATION_INSTRUCTIONS, TOOL_GENERATION_SCHEMAS).
 */
export const VISUALISE_TOOL_SLUG = 'visualise' as const;

/**
 * Resolve the monthly generation limit for a given tier.
 * Accepts SubscriptionTier enum or a raw string; returns 0 for unknown tiers.
 */
export function getVisualiseLimit(tier: SubscriptionTier | string | null | undefined): number {
  if (!tier) return VISUALISE_LIMITS.FREE;
  return VISUALISE_LIMITS[tier] ?? VISUALISE_LIMITS.FREE;
}

/**
 * Effective remaining uses after a mid-period tier change.
 * Formula: max(0, newTierLimit − alreadyUsed).
 * Downgrades that put the user over their new cap return 0.
 */
export function effectiveRemaining(newTierLimit: number, alreadyUsed: number): number {
  return Math.max(0, newTierLimit - alreadyUsed);
}
