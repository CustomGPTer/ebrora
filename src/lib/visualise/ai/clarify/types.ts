// =============================================================================
// Visualise — Clarify Types (Batch CQ)
//
// Shared types for the clarifying-questions flow — referenced by:
//   src/lib/visualise/ai/clarify/decide.ts   — pure decision function
//   src/app/api/visualise/clarify/route.ts   — POST endpoint
//   src/components/visualise/ClarifyPanel.tsx — UI
//   src/components/visualise/VisualiseClient.tsx — session state + wiring
//
// Design rules (per BATCH-CQ-SCOPE.md, decisions locked in by Jon):
//   - Up to 3 rounds, AI stops early when further questions wouldn't help
//     (the "stops early" heuristic is implemented in decide.ts; this file
//     just declares the cap).
//   - 40-word cap on free-text answers only (the `data` topic). Chip
//     answers have no word cap — they're bounded by the chip set.
//   - Session-scoped storage only — no persistence (handled client-side).
//   - No external schema library — shapes are small, zod would be overkill.
// =============================================================================

/**
 * The five topics a clarifying question can cover, in priority order:
 *   1. family  — structural family (flow / hierarchy / timeline / …)
 *   2. preset  — specific preset within a family
 *   3. count   — how many main items in the text
 *   4. palette — visual style
 *   5. data    — free-text answer to a live question about missing data
 *
 * `palette` is declared here for completeness but in practice is woven
 * in opportunistically by `decide.ts` rather than being asked outright —
 * see the decide function's topic-priority comment.
 */
export type ClarifyTopic = 'family' | 'preset' | 'count' | 'palette' | 'data';

/**
 * Structural families recognised by the preset catalogue. Mirrors the
 * `category` field on registered presets but also includes 'process' and
 * 'cycle' as distinct families from the chips UI perspective. `unknown`
 * lets the user explicitly say "no idea — let the AI choose" without
 * breaking downstream resolution.
 */
export type FamilyHint =
  | 'flow'
  | 'timeline'
  | 'hierarchy'
  | 'comparison'
  | 'charts'
  | 'cycle'
  | 'relationships'
  | 'positioning'
  | 'process'
  | 'unknown';

/**
 * A single chip option in a chip-style question. `value` is the canonical
 * form sent back to the server (preset ID, family name, count string,
 * palette ID, or `'unknown'`). `label` is what the user sees.
 */
export interface ClarifyChip {
  value: string;
  label: string;
}

/**
 * A question to ask the user. Chip-style questions come with a `chips`
 * array; the `data` topic is free-text and carries only a `placeholder`.
 * `round` is the 0-indexed round number and is set by the decide function
 * when returning the question (the JSON in questions.json doesn't include
 * it; it's added at decide time).
 */
export interface ClarifyQuestion {
  topic: ClarifyTopic;
  prompt: string;
  /** Present on chip-style questions (family, preset, count, palette). */
  chips?: ClarifyChip[];
  /** Present on free-text questions (data). */
  placeholder?: string;
  /** 0-indexed round number. Injected by decide(); may be absent in raw JSON. */
  round?: number;
}

/**
 * A single user answer. `topic` identifies which question was answered;
 * `value` is the chip value for chip questions or the raw text for data
 * questions (truncated server-side to `CLARIFY_MAX_ANSWER_WORDS`).
 */
export interface ClarifyAnswer {
  topic: ClarifyTopic;
  value: string;
}

/** Request body for POST /api/visualise/clarify. */
export interface ClarifyRequest {
  /** The user's pasted text — required on every call. */
  text: string;
  /** All answers given so far in this clarify session. Empty on round 1. */
  priorAnswers?: ClarifyAnswer[];
}

/**
 * Response from POST /api/visualise/clarify.
 *
 * If `done` is true, client proceeds to POST /api/visualise/generate with
 * `priorAnswers` attached. If `done` is false, `nextQuestion` is set and
 * the client renders it; once answered, the client appends to
 * `priorAnswers` and posts back to /api/visualise/clarify for the next
 * decision.
 */
export interface ClarifyResponse {
  nextQuestion?: ClarifyQuestion;
  done: boolean;
  round?: number;
}

// -----------------------------------------------------------------------------
// Constants

/**
 * Hard cap on clarify rounds before auto-proceeding. Matches Jon's decision
 * in BATCH-CQ-SCOPE.md — "Up to 3 rounds, AI stops early". If the cap is
 * reached, decide() returns done=true regardless of remaining open topics,
 * and /generate runs with whatever hints it has.
 */
export const CLARIFY_MAX_ROUNDS = 3;

/**
 * Word cap for free-text answers (the `data` topic only). Applied
 * client-side at input time and server-side as a safety net in
 * /api/visualise/clarify. Chip answers are naturally bounded.
 */
export const CLARIFY_MAX_ANSWER_WORDS = 40;

// -----------------------------------------------------------------------------
// Helpers — exported for client-side word counting/truncation parity with
// server-side enforcement. Splitting on whitespace (not a unicode-aware
// word segmenter) is intentional — keeps the cap understandable as
// "roughly 40 space-separated tokens" which is what a user thinks of.

/**
 * Count words in a string by splitting on runs of whitespace. Returns 0
 * for empty/whitespace-only input. Does NOT attempt to handle CJK text
 * meaningfully — UK-English construction content is the primary use case.
 */
export function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Truncate a string to at most `CLARIFY_MAX_ANSWER_WORDS` words. Returns
 * the original string if already under the cap. Used as a safety net on
 * the server — clients enforce at entry time.
 */
export function truncateToWordCap(s: string): string {
  const words = s.trim().split(/\s+/);
  if (words.length <= CLARIFY_MAX_ANSWER_WORDS) return s.trim();
  return words.slice(0, CLARIFY_MAX_ANSWER_WORDS).join(' ');
}
