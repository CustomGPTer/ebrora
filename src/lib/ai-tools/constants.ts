// =============================================================================
// AI Tools — Constants
// Usage limits are SEPARATE from RAMS Builder.
// RAMS keeps its own limits (1 Free / 10 Standard / 25 Pro).
// These apply PER TOOL — each tool gets its own monthly allowance.
// =============================================================================

/** AI tool generation limits per subscription tier (per tool, per month) */
export const AI_TOOL_LIMITS: Record<string, number> = {
  FREE: 1,
  STANDARD: 6,
  PROFESSIONAL: 20,
};

/**
 * Tools that are NOT available on the FREE tier (limit = 0).
 * These require Standard or Professional to use.
 *
 * Original restricted tools (7):
 *   itp, incident-report, lift-plan, emergency-response,
 *   scope-of-works, early-warning, ncr
 *
 * All 13 new tools are also restricted (Standard+ only).
 */
export const RESTRICTED_FREE_TOOLS: Set<string> = new Set([
  // Existing restricted tools
  'itp',
  'incident-report',
  'lift-plan',
  'emergency-response',
  'scope-of-works',
  'early-warning',
  'ncr',
  // New 13 — all restricted to Standard+ tier
  'programme-checker',
  'cdm-checker',
  'noise-assessment',
  'quote-generator',
  'safety-alert',
  'carbon-footprint',
  'rams-review',
  'delay-notification',
  'variation-confirmation',
  'rfi-generator',
  'payment-application',
  'daywork-sheet',
  'carbon-reduction-plan',
]);

/** Get the monthly generation limit for a given tier and tool */
export function getAiToolLimitByTier(tier: string, toolSlug?: string): number {
  // If FREE tier and tool is restricted, return 0
  if ((!tier || tier === 'FREE') && toolSlug && RESTRICTED_FREE_TOOLS.has(toolSlug)) {
    return 0;
  }
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
