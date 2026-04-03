// =============================================================================
// AI Tools — Constants
// Usage limits are SEPARATE from RAMS Builder.
// RAMS keeps its own limits (1 Free / 5 Starter / 15 Pro / unlimited Unlimited).
//
// PRICING REBUILD — GLOBAL CAP MODEL
// Single global monthly cap across ALL tools combined.
// Free users can access ANY tool but are limited to 1 total use per month.
// =============================================================================

/**
 * AI tool generation limits per subscription tier.
 * GLOBAL monthly caps across all tools combined.
 * STANDARD is a legacy alias for STARTER.
 */
export const AI_TOOL_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 30,
  STANDARD: 30,        // legacy alias → same as STARTER
  PROFESSIONAL: 150,
  UNLIMITED: 9999,     // effectively unlimited (soft daily rate limit enforced separately)
};

/**
 * Tools restricted from FREE tier.
 * 
 * CLEARED in Batch 2: Free users now access ALL tools with a global cap of 1
 * use per month. The cap itself is the restriction — no tool-level gating.
 * This improves conversion: users see every tool, try one, then hit the wall.
 */
export const RESTRICTED_FREE_TOOLS: Set<string> = new Set([
  // Empty — all tools accessible on all tiers.
  // The global usage cap (1 for Free) is the restriction.
]);

/** Get the monthly generation limit for a given tier and tool */
export function getAiToolLimitByTier(tier: string, toolSlug?: string): number {
  // If FREE tier and tool is restricted, return 0
  if ((!tier || tier === 'FREE') && toolSlug && RESTRICTED_FREE_TOOLS.has(toolSlug)) {
    return 0;
  }
  return AI_TOOL_LIMITS[tier] ?? AI_TOOL_LIMITS.FREE;
}

/**
 * Get the GLOBAL monthly AI tool cap for a tier (ignores tool slug).
 * Primary limit check function for the global cap model.
 */
export function getGlobalAiLimitByTier(tier: string): number {
  return AI_TOOL_LIMITS[tier] ?? AI_TOOL_LIMITS.FREE;
}

/** Conversation guardrails (same as RAMS) */
export const MAX_TOTAL_QUESTIONS = 30;
export const MAX_ROUNDS = 6;
export const MAX_ANSWER_WORDS = 150;
export const MAX_ANSWERS_PER_ROUND = 8;

/** Cooldown between chat rounds per user (ms) */
export const COOLDOWN_MS = 10_000;

/** Abandoned generation expiry (1 hour) */
export const EXPIRY_THRESHOLD_MS = 60 * 60 * 1000;

/** Description word limit */
export const MAX_DESCRIPTION_WORDS = 200;
export const MIN_DESCRIPTION_WORDS = 3;

/** Maximum upload file size for upload tools (10 MB) */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types for Programme Checker */
export const PROGRAMME_CHECKER_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/plain': ['.xer', '.xml'],
  'application/xml': ['.xml'],
};

/** Accepted MIME types for RAMS Review */
export const RAMS_REVIEW_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};
