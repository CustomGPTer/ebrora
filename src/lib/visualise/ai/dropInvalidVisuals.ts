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
//
// AMENDMENT (Batch 1 bug fix — "Slot overflow + reasoning"):
//   - dropInvalidVisuals / dropInvalidVariants now ALSO drop any visual whose
//     picked preset's capacity cannot accommodate the AI's declared concept
//     count (if one was declared). This catches the "AI said 8 concepts but
//     picked a 6-slot preset" bug at the validation layer — before such a
//     visual can be shown to the user with silently-truncated content.
//   - DropInvalidResult exposes the (optional) top-level reasoning string so
//     the caller can thread it through to the blob + the UI banner.
// =============================================================================

import { capacityAccommodates, getCapacity } from '@/lib/visualise/presets/capacity';

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
  /**
   * Batch 1: AI's chain-of-thought. Threaded through so the route can store
   * it on the blob and the UI can render it above the visuals.
   */
  reasoning?: string;
}

/**
 * Run each visual's data through its preset's Zod schema.
 * Invalid visuals are dropped and logged (console.warn + returned in the summary).
 * The caller decides what to do if `valid` is empty.
 */
export function dropInvalidVisuals(response: AiResponse): DropInvalidResult {
  const valid: ValidatedVisual[] = [];
  const droppedReasons: { presetId: string; reason: string }[] = [];

  // Index concept_counts by position so we can compare against the chosen
  // preset's capacity. When counts aren't provided, capacity check is skipped.
  const conceptCounts = response.concept_counts ?? [];

  for (let i = 0; i < response.visuals.length; i++) {
    const v = response.visuals[i];
    const preset = getPresetById(v.preset_id);

    // This shouldn't happen — the top-level schema restricts preset_id to
    // registered IDs — but defend anyway in case the registry shifts mid-request.
    if (!preset) {
      droppedReasons.push({ presetId: v.preset_id, reason: 'preset not registered' });
      console.warn('[visualise] Dropped visual — preset not registered', { preset_id: v.preset_id });
      continue;
    }

    // Batch 1: capacity gate. If the AI declared a concept count for this slot
    // and it exceeds the preset's max capacity, drop the visual rather than
    // let it through with silently-truncated data. We intentionally check
    // BEFORE Zod so the dropped-reason is capacity-specific (easier to debug).
    const declaredCount = conceptCounts[i];
    if (typeof declaredCount === 'number' && !capacityAccommodates(v.preset_id, declaredCount)) {
      const cap = getCapacity(v.preset_id);
      const capStr = cap
        ? `${cap.primary.min === cap.primary.max ? `exactly ${cap.primary.max}` : `${cap.primary.min}–${cap.primary.max}`} ${cap.primaryUnit}(s)`
        : 'unknown capacity';
      const reason = `capacity mismatch — AI declared ${declaredCount} concepts, preset holds ${capStr}`;
      droppedReasons.push({ presetId: v.preset_id, reason });
      console.warn('[visualise] Dropped visual — capacity mismatch', {
        preset_id: v.preset_id,
        declaredCount,
        capacity: cap,
      });
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
    reasoning: response.reasoning,
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

  // Index concept_counts by concept position (one count per concept, shared
  // across all variants of that concept because variants carry the same data).
  const conceptCounts = response.concept_counts ?? [];

  for (let ci = 0; ci < response.visuals.length; ci++) {
    const concept = response.visuals[ci];
    const declaredCount = conceptCounts[ci];
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

      // Batch 1: per-variant capacity gate. Each variant must independently
      // accommodate the concept's declared count. Variants that can't are
      // dropped individually; the concept survives as long as at least one
      // does. Matches the existing "ALL variants must fail to drop concept"
      // rule — capacity just becomes another fail reason.
      if (typeof declaredCount === 'number' && !capacityAccommodates(variant.preset_id, declaredCount)) {
        const cap = getCapacity(variant.preset_id);
        const capStr = cap
          ? `${cap.primary.min === cap.primary.max ? `exactly ${cap.primary.max}` : `${cap.primary.min}–${cap.primary.max}`} ${cap.primaryUnit}(s)`
          : 'unknown capacity';
        const reason = `capacity mismatch — concept has ${declaredCount} items, preset holds ${capStr}`;
        droppedReasons.push({ presetId: variant.preset_id, reason });
        console.warn('[visualise] Dropped variant — capacity mismatch', {
          preset_id: variant.preset_id,
          declaredCount,
          capacity: cap,
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
    reasoning: response.reasoning,
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
    // Batch 1b — stamp the AI's initial preset choice so the canvas editor
    // can always point the user back to it via an "AI chose this" badge
    // in the preset gallery, even after they swap templates a few times.
    aiOriginalPresetId: validated.presetId,
  };
}
