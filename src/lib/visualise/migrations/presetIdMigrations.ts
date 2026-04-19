// =============================================================================
// Visualise — Preset-ID migrations
// Batch 4a-i.
//
// When a preset family is consolidated (e.g. flow-linear-3step / -4step /
// -5step → flow-linear), existing draft blobs stored under the OLD preset IDs
// need to keep rendering. We remap at blob-load time rather than running a
// Prisma migration against the blob store because:
//   1. Blobs live in Vercel Blob storage (JSON bytes), not Postgres rows —
//      no schema migration hook exists there.
//   2. Remapping on read is idempotent and self-healing: the next save writes
//      the new presetId to disk, so over time the old IDs drain out naturally
//      without us ever having to touch untouched drafts.
//   3. The remap is a pure function — no AI call, no user notification. Users
//      see their draft open and render exactly as before.
//
// Invariants preserved by migration:
//   - VisualInstance.presetId is remapped (primary effect)
//   - VisualInstance.aiOriginalPresetId is remapped (so Batch 1b's "AI chose
//     this" badge still points at the right tile after consolidation)
//   - VisualInstance.variants[].presetId is remapped (variant mode results
//     from earlier generates can contain old IDs)
//   - All other fields (data, settings, canvas, caption, nodeDescriptions,
//     etc.) are passed through unchanged. The data shape is compatible
//     because the consolidated preset's schema is a superset of each old
//     preset's schema.
//
// This file is the single place to add future remaps. When Batch 4a-ii
// consolidates cycle / process-circular / process-numbered / timeline-*,
// the remaps get added to PRESET_ID_REMAPS below and the wiring stays the
// same.
// =============================================================================

import type { VisualInstance, VisualiseDocumentBlob, VariantOption } from '../types';

/**
 * Map from a retired preset ID to the consolidated preset ID that replaces it.
 *
 * Add entries here when consolidating preset families. Entries are one-way:
 * we never need to un-migrate, and once an entry is added it should stay
 * here permanently (old blobs in storage may still reference the old ID for
 * months or years).
 */
const PRESET_ID_REMAPS: Record<string, string> = {
  // Batch 4a-i — flow-linear consolidation.
  'flow-linear-3step': 'flow-linear',
  'flow-linear-4step': 'flow-linear',
  'flow-linear-5step': 'flow-linear',
  // Batch 4a-ii-a — flow-linear-vertical consolidation.
  'flow-linear-vertical-4step': 'flow-linear-vertical',
  // Batch 4a-ii-b — cycle-steps and process-circular consolidation.
  'cycle-4step': 'cycle-steps',
  'cycle-6step': 'cycle-steps',
  'process-circular-4step': 'process-circular',
  'process-circular-6step': 'process-circular',
  // Batch 4a-ii-c-i — process-numbered consolidation.
  'process-numbered-6step': 'process-numbered',
  // Batch 4a-ii-c-ii — timeline-horizontal and timeline-vertical consolidation.
  'timeline-horizontal-5event': 'timeline-horizontal',
  'timeline-horizontal-8event': 'timeline-horizontal',
  'timeline-vertical-5event': 'timeline-vertical',
};

/**
 * Remap a single preset ID if it has a consolidated replacement, otherwise
 * return it unchanged. Undefined / empty-string input passes through.
 */
export function migratePresetId(presetId: string | undefined): string | undefined {
  if (!presetId) return presetId;
  return PRESET_ID_REMAPS[presetId] ?? presetId;
}

/**
 * Migrate a single variant option. Returns a new object only if a remap was
 * needed; otherwise returns the input reference (cheap no-op for the common
 * case of already-new data).
 */
function migrateVariant(variant: VariantOption): VariantOption {
  const remapped = PRESET_ID_REMAPS[variant.presetId];
  if (!remapped) return variant;
  return { ...variant, presetId: remapped };
}

/**
 * Migrate a single VisualInstance. Remaps presetId, aiOriginalPresetId, and
 * any variants' presetIds. Returns the same reference when no remap was needed.
 */
export function migrateVisualInstance(visual: VisualInstance): VisualInstance {
  const newPresetId = PRESET_ID_REMAPS[visual.presetId];
  const newAiOriginalPresetId =
    visual.aiOriginalPresetId !== undefined
      ? PRESET_ID_REMAPS[visual.aiOriginalPresetId]
      : undefined;

  // Check if variants need remapping — scan once rather than map() blindly
  // so we can short-circuit when there's nothing to do.
  const variantsNeedRemap = visual.variants?.some((v) => v.presetId in PRESET_ID_REMAPS) ?? false;

  // Fast path: nothing needs changing.
  if (!newPresetId && !newAiOriginalPresetId && !variantsNeedRemap) {
    return visual;
  }

  return {
    ...visual,
    presetId: newPresetId ?? visual.presetId,
    aiOriginalPresetId:
      newAiOriginalPresetId ?? visual.aiOriginalPresetId,
    variants: visual.variants?.map(migrateVariant),
  };
}

/**
 * Migrate a full draft blob. Walks visuals[] and remaps each one. Returns a
 * new blob reference only when at least one visual was remapped — otherwise
 * returns the input reference unchanged (cheap no-op).
 *
 * Call this at every server-side blob-load path (currently: the drafts GET
 * handler) BEFORE returning the blob to the client. The client then receives
 * already-migrated data and persists the new IDs on next save.
 */
export function migrateVisualiseDocumentBlob(blob: VisualiseDocumentBlob): VisualiseDocumentBlob {
  let changed = false;
  const migratedVisuals = blob.visuals.map((v) => {
    const migrated = migrateVisualInstance(v);
    if (migrated !== v) changed = true;
    return migrated;
  });
  if (!changed) return blob;
  return { ...blob, visuals: migratedVisuals };
}
