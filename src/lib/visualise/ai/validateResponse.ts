// =============================================================================
// Visualise — AI Response Validator
// Zod schema for the top-level shape the AI is instructed to return.
// Per-visual data payloads are validated in a second pass by the preset's own
// dataSchema — see dropInvalidVisuals.ts.
// =============================================================================

import { z } from 'zod';
import { PALETTE_IDS } from '@/lib/visualise/palettes';
import { getAllPresetIds } from '@/lib/visualise/presets';
import { VISUALISE_MAX_VISUALS_PER_GENERATION } from '@/lib/visualise/constants';

/**
 * Build the response schema at call time so the preset-ID enum always reflects
 * the current registry. A preset added in Batch 8 becomes a valid ID here
 * without touching this file.
 */
export function buildAiResponseSchema() {
  const presetIds = getAllPresetIds();
  // Zod's z.enum requires at least one literal; cast to a non-empty tuple.
  const presetIdEnum = z.enum(presetIds as unknown as [string, ...string[]]);
  const paletteIdEnum = z.enum(PALETTE_IDS as unknown as [string, ...string[]]);

  const visualSchema = z.object({
    preset_id: presetIdEnum,
    title: z.string().min(1).max(60),
    palette_id: paletteIdEnum,
    data: z.unknown(),
  });

  return z.object({
    document_title: z.string().min(1).max(100),
    visuals: z.array(visualSchema).min(1).max(VISUALISE_MAX_VISUALS_PER_GENERATION),
  });
}

/** Inferred type of a validated AI response (pre per-visual validation). */
export type AiResponse = z.infer<ReturnType<typeof buildAiResponseSchema>>;

/** Convenience: parse an unknown payload and return a typed result. */
export function parseAiResponse(raw: unknown) {
  const schema = buildAiResponseSchema();
  return schema.safeParse(raw);
}
