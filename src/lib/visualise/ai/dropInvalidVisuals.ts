// =============================================================================
// Visualise — Per-visual validator
// Second-pass validation: run each visual's `data` payload against its preset's
// own Zod schema. Invalid visuals are dropped (not the whole request) so a bad
// data payload for one visual doesn't kill the others.
//
// This is the graceful-degradation path required by spec §9:
//   > If a visual's data fails validation, drop it (don't retry the whole request).
//   > If all visuals fail, return a single error to the user and refund the
//   > usage record (set status to FAILED — the access check excludes FAILED).
//
// AMENDMENT (Batch 10 — "Variants & Sub-text"):
//   Added `dropInvalidVariants()` sibling for variant-mode responses. Each
//   concept returns up to 3 preset variants; we validate each variant's data
//   against its preset schema, drop invalid ones, and keep the concept if at
//   least 1 variant survives (the first surviving variant becomes active).
//
//   `toVisualInstance()` now accepts optional caption / nodeDescriptions /
//   variants and threads them through to the VisualInstance being created.
// =============================================================================

import type { AiResponse, VariantAiResponse } from './validateResponse';
import { getPresetById } from '@/lib/visualise/presets';
import type {
  VisualInstance,
  VisualSettings,
  VisualCanvasState,
  PaletteId,
  VariantOption,
} from '@/lib/visualise/types';

/**
 * The per-visual shape produced after validation — `data` is now typed as
 * unknown-but-validated (the preset's schema confirmed it parsed). The rest
 * of the pipeline should treat it as the shape matching that preset's schema.
 */
export interface ValidatedVisual {
  presetId: string;
  title: string;
  paletteId: PaletteId;
  data: unknown;
  /** Batch 10: optional caption + per-node descriptions from the AI. */
  caption?: string;
  nodeDescriptions?: string[];
  /** Batch 10: alternate preset+data pairs for the same concept. */
  variants?: VariantOption[];
}

export interface DropInvalidResult {
  valid: ValidatedVisual[];
  droppedCount: number;
  droppedReasons: { presetId: string; reason: string }[];
}

/**
 * Run each visual's data through its preset's Zod schema.
 * Invalid visuals are dropped and logged (console.warn + returned in the summary).
 * The caller decides what to do if `valid` is empty.
 */
export function dropInvalidVisuals(response: AiResponse): DropInvalidResult {
  const valid: ValidatedVisual[] = [];
  const droppedReasons: { presetId: string; reason: string }[] = [];

  for (const v of response.visuals) {
    const preset = getPresetById(v.preset_id);

    // This shouldn't happen — the top-level schema restricts preset_id to
    // registered IDs — but defend anyway in case the registry shifts mid-request.
    if (!preset) {
      droppedReasons.push({ presetId: v.preset_id, reason: 'preset not registered' });
      console.warn('[visualise] Dropped visual — preset not registered', { preset_id: v.preset_id });
      continue;
    }

    const parsed = preset.dataSchema.safeParse(v.data);
    if (!parsed.success) {
      const reason = parsed.error.issues
        .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('; ');
      droppedReasons.push({ presetId: v.preset_id, reason });
      console.warn('[visualise] Dropped visual — data failed preset schema', {
        preset_id: v.preset_id,
        reason,
      });
      continue;
    }

    valid.push({
      presetId: v.preset_id,
      title: v.title,
      paletteId: v.palette_id as PaletteId,
      data: parsed.data,
      caption: v.caption,
      nodeDescriptions: v.node_descriptions,
    });
  }

  return {
    valid,
    droppedCount: droppedReasons.length,
    droppedReasons,
  };
}

/**
 * Variant-mode validator.
 * For each concept returned by the AI, validate every variant's data against
 * its preset's own schema. Drop invalid variants individually. If at least one
 * variant survives, the concept survives: the first surviving variant is
 * promoted to active, the rest become the `variants` array on the visual.
 *
 * If ALL variants for a concept fail, the whole concept is dropped (same
 * behaviour as `dropInvalidVisuals` dropping a visual outright).
 */
export function dropInvalidVariants(response: VariantAiResponse): DropInvalidResult {
  const valid: ValidatedVisual[] = [];
  const droppedReasons: { presetId: string; reason: string }[] = [];

  for (const concept of response.visuals) {
    const survivingVariants: { presetId: string; data: unknown; title?: string }[] = [];

    for (const variant of concept.variants) {
      const preset = getPresetById(variant.preset_id);
      if (!preset) {
        droppedReasons.push({
          presetId: variant.preset_id,
          reason: 'preset not registered',
        });
        console.warn('[visualise] Dropped variant — preset not registered', {
          preset_id: variant.preset_id,
        });
        continue;
      }

      const parsed = preset.dataSchema.safeParse(variant.data);
      if (!parsed.success) {
        const reason = parsed.error.issues
          .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
          .join('; ');
        droppedReasons.push({ presetId: variant.preset_id, reason });
        console.warn('[visualise] Dropped variant — data failed preset schema', {
          preset_id: variant.preset_id,
          reason,
        });
        continue;
      }

      survivingVariants.push({
        presetId: variant.preset_id,
        data: parsed.data,
        title: variant.title,
      });
    }

    if (survivingVariants.length === 0) {
      // The whole concept failed — nothing usable. Already logged per-variant above.
      continue;
    }

    // First surviving variant becomes active; the rest become swap options.
    const [active, ...rest] = survivingVariants;

    valid.push({
      presetId: active.presetId,
      title: active.title ?? concept.title,
      paletteId: concept.palette_id as PaletteId,
      data: active.data,
      caption: concept.caption,
      nodeDescriptions: concept.node_descriptions,
      variants: rest.map(
        (r): VariantOption => ({
          presetId: r.presetId,
          data: r.data,
          title: r.title,
        }),
      ),
    });
  }

  return {
    valid,
    droppedCount: droppedReasons.length,
    droppedReasons,
  };
}

/**
 * Convert a ValidatedVisual into a full VisualInstance ready to store in the blob.
 * Initialises canvas state to defaults (empty nodes map, viewBox 0 0 800 400);
 * the canvas editor in Batch 6 will populate nodes as the user edits.
 */
export function toVisualInstance(
  validated: ValidatedVisual,
  order: number,
  idGenerator: () => string,
): VisualInstance {
  const settings: VisualSettings = {
    paletteId: validated.paletteId,
    font: 'Inter, sans-serif',
    showTitle: true,
    customColors: {},
  };

  const canvas: VisualCanvasState = {
    viewBox: { x: 0, y: 0, w: 800, h: 400 },
    nodes: {},
    groups: {},
  };

  return {
    id: idGenerator(),
    presetId: validated.presetId,
    title: validated.title,
    data: validated.data,
    settings,
    canvas,
    order,
    variants: validated.variants,
    caption: validated.caption,
    nodeDescriptions: validated.nodeDescriptions,
  };
}
