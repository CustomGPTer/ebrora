// =============================================================================
// Visualise — AI Response Validator
// Zod schema for the top-level shape the AI is instructed to return.
// Per-visual data payloads are validated in a second pass by the preset's own
// dataSchema — see dropInvalidVisuals.ts.
//
// AMENDMENT (Batch 10 — "Variants & Sub-text"):
//   Two shapes are now accepted:
//
//   (1) Legacy single-visual shape (kept for regenerate mode and any
//       variantMode=false caller):
//         {
//           document_title,
//           visuals: [{ preset_id, title, palette_id, data,
//                       caption?, node_descriptions? }]
//         }
//
//   (2) Variant shape (variantMode=true, the new default for Generate):
//         {
//           document_title,
//           visuals: [{
//             title, palette_id, caption?, node_descriptions?,
//             variants: [
//               { preset_id, data },   // becomes active
//               { preset_id, data },   // variant #2
//               { preset_id, data },   // variant #3
//             ]
//           }]
//         }
//
//   The `caption` and `node_descriptions` fields are OPTIONAL in both shapes
//   so the validator doesn't hard-fail if the model omits them — the UI
//   gracefully hides the sub-text block when they're missing.
// =============================================================================

import { z } from 'zod';
import { PALETTE_IDS } from '@/lib/visualise/palettes';
import { getAllPresetIds } from '@/lib/visualise/presets';
import { VISUALISE_MAX_VISUALS_PER_GENERATION } from '@/lib/visualise/constants';

// ── Shared field constraints ───────────────────────────────────────────────
// Keep caption / node description limits in one place so prompt copy, schema,
// and UI renderers can't drift.
export const VISUALISE_CAPTION_MAX_CHARS = 240; // ~200 target, 240 hard cap
export const VISUALISE_NODE_DESC_MAX_CHARS = 140; // 120 target, 140 hard cap
export const VISUALISE_NODE_DESC_MAX_COUNT = 12; // any preset's primary list maxes out around 8–10

/** Reusable optional string schema with max length, empty treated as absent. */
function optionalCapString(max: number) {
  return z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined));
}

const nodeDescriptionsSchema = z
  .array(z.string().max(VISUALISE_NODE_DESC_MAX_CHARS))
  .max(VISUALISE_NODE_DESC_MAX_COUNT)
  .optional();

/**
 * Build the LEGACY response schema at call time so the preset-ID enum always
 * reflects the current registry. Used by regenerate mode and any non-variant
 * caller. A preset added later becomes a valid ID here without touching this file.
 */
export function buildAiResponseSchema() {
  const presetIds = getAllPresetIds();
  const presetIdEnum = z.enum(presetIds as unknown as [string, ...string[]]);
  const paletteIdEnum = z.enum(PALETTE_IDS as unknown as [string, ...string[]]);

  const visualSchema = z.object({
    preset_id: presetIdEnum,
    title: z.string().min(1).max(60),
    palette_id: paletteIdEnum,
    data: z.unknown(),
    caption: optionalCapString(VISUALISE_CAPTION_MAX_CHARS),
    node_descriptions: nodeDescriptionsSchema,
  });

  return z.object({
    document_title: z.string().min(1).max(100),
    visuals: z.array(visualSchema).min(1).max(VISUALISE_MAX_VISUALS_PER_GENERATION),
  });
}

/**
 * Build the VARIANT response schema. Each `visual` here represents a single
 * *concept* — the AI must return up to 3 preset variants for that concept,
 * picked to show the concept in structurally different styles (e.g. sequence
 * + timeline + process-stages for a step-based concept). The first variant is
 * treated as the recommended/active preset; the other two become swap options.
 *
 * We don't enforce 3 variants exactly — 2 is acceptable when the AI can't find
 * 3 good structural fits (matches question 13 = "return fewer with a note").
 * 1 would degrade to the single-variant UX; allowed but flagged in telemetry.
 */
export function buildVariantAiResponseSchema() {
  const presetIds = getAllPresetIds();
  const presetIdEnum = z.enum(presetIds as unknown as [string, ...string[]]);
  const paletteIdEnum = z.enum(PALETTE_IDS as unknown as [string, ...string[]]);

  const variantSchema = z.object({
    preset_id: presetIdEnum,
    data: z.unknown(),
    /** Optional per-variant title override. Falls back to the concept's title. */
    title: z.string().min(1).max(60).optional(),
  });

  const conceptSchema = z.object({
    title: z.string().min(1).max(60),
    palette_id: paletteIdEnum,
    caption: optionalCapString(VISUALISE_CAPTION_MAX_CHARS),
    node_descriptions: nodeDescriptionsSchema,
    variants: z.array(variantSchema).min(1).max(3),
  });

  return z.object({
    document_title: z.string().min(1).max(100),
    visuals: z.array(conceptSchema).min(1).max(VISUALISE_MAX_VISUALS_PER_GENERATION),
  });
}

/** Inferred type of a validated legacy AI response (pre per-visual validation). */
export type AiResponse = z.infer<ReturnType<typeof buildAiResponseSchema>>;

/** Inferred type of a validated variant-mode AI response. */
export type VariantAiResponse = z.infer<ReturnType<typeof buildVariantAiResponseSchema>>;

/** Convenience: parse an unknown payload against the legacy schema. */
export function parseAiResponse(raw: unknown) {
  const schema = buildAiResponseSchema();
  return schema.safeParse(raw);
}

/** Convenience: parse an unknown payload against the variant schema. */
export function parseVariantAiResponse(raw: unknown) {
  const schema = buildVariantAiResponseSchema();
  return schema.safeParse(raw);
}
