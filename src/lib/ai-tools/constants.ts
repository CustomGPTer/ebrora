// =============================================================================
// AI Tools — Constants
// Usage limits are SEPARATE from RAMS Builder.
// RAMS keeps its own limits (1 Free / 10 Standard / 30 Pro).
// These apply PER TOOL — each tool gets its own monthly allowance.
// =============================================================================

/** AI tool generation limits per subscription tier (per tool, per month) */
export const AI_TOOL_LIMITS: Record<string, number> = {
  FREE: 1,
  STANDARD: 6,
  PROFESSIONAL: 20,
};

/** Get the monthly generation limit for a given tier */
export function getAiToolLimitByTier(tier: string): number {
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
