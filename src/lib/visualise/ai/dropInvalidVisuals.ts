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
// =============================================================================

import type { AiResponse } from './validateResponse';
import { getPresetById } from '@/lib/visualise/presets';
import type { VisualInstance, VisualSettings, VisualCanvasState, PaletteId } from '@/lib/visualise/types';

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
  };
}
