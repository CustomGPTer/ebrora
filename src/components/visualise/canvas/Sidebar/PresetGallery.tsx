'use client';

// =============================================================================
// PresetGallery — left sidebar listing every registered preset, grouped by
// category. Click cycles the current visual's preset.
//
// ── Batch 1b changes ─────────────────────────────────────────────────────────
//
// Two behavioural updates and one visual one, all prompted by the pre-1b UX
// where incompatible preset picks silently swapped to defaultData and left
// the user pointing at a Regenerate button on a different screen:
//
//   1. Compatible swaps (target.dataSchema.safeParse(currentData) passes):
//      behave as before — emit an onSwap() with the reshaped data and
//      warning=null. No AI round-trip, no credit.
//
//   2. Incompatible swaps: DO NOT swap. Instead bubble an onApplyIntent(id)
//      to the parent editor, which opens an ApplyTemplateModal asking the
//      user to confirm a server-side silent auto-remap. This removes the
//      "defaultData shown + find Regenerate elsewhere" trap — the user
//      either cancels (nothing happens, keeps current preset) or confirms
//      (AI re-maps their original source text into the new preset).
//
//   3. Visual: the preset tile matching `aiOriginalPresetId` gets a small
//      green "AI" badge in its top-right corner so the user can always find
//      their way back to the AI's original pick after experimenting. The
//      badge draws over the thumbnail, not in its own row, so it adds zero
//      vertical space. Falls back gracefully when aiOriginalPresetId is
//      absent (pre-1b drafts) — no badge is shown.
//
// The gallery itself still doesn't OWN the warning banner; CanvasEditor
// shows that. We just return the right signal via onSwap / onApplyIntent
// so the parent can decide what UI to surface.
//
// Thumbnails use the preset's own `thumbnailSvg` string (raw SVG markup,
// viewBox 0 0 120 80 by convention). Injected via dangerouslySetInnerHTML
// — the contents come from our own source tree, not untrusted input.
// =============================================================================

import { useMemo } from 'react';
import { getAllPresets } from '@/lib/visualise/presets';
import type { AnyPreset, PresetCategory } from '@/lib/visualise/presets/types';

export interface PresetSwapOutcome {
  presetId: string;
  /** New data — the safeParsed pass-through when the swap was compatible. */
  data: unknown;
  /** Warning to surface in the editor. In Batch 1b this is always null on
   *  onSwap because incompatible swaps now route through onApplyIntent
   *  instead — kept on the interface for backwards compat with the caller. */
  warning: string | null;
}

interface Props {
  currentPresetId: string;
  currentData: unknown;
  /**
   * The preset the AI originally picked for this visual — rendered with an
   * "AI" badge in the gallery so the user can always find their way back.
   * Undefined for pre-Batch-1b drafts (no badge shown in that case).
   */
  aiOriginalPresetId?: string;
  /** Fired for COMPATIBLE swaps — the current data fits the target schema. */
  onSwap: (outcome: PresetSwapOutcome) => void;
  /** Fired for INCOMPATIBLE swaps — the parent should confirm + auto-remap. */
  onApplyIntent: (presetId: string) => void;
}

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  flow: 'Flow',
  process: 'Process',
  timeline: 'Timeline',
  hierarchy: 'Hierarchy',
  relationships: 'Relationships',
  comparison: 'Comparison',
  positioning: 'Positioning',
  'funnel-pyramid': 'Funnel / Pyramid',
  cycle: 'Cycle',
  charts: 'Charts',
  construction: 'Construction',
};

const CATEGORY_ORDER: PresetCategory[] = [
  'flow',
  'process',
  'timeline',
  'hierarchy',
  'relationships',
  'comparison',
  'positioning',
  'funnel-pyramid',
  'cycle',
  'charts',
  'construction',
];

export default function PresetGallery({
  currentPresetId,
  currentData,
  aiOriginalPresetId,
  onSwap,
  onApplyIntent,
}: Props) {
  const grouped = useMemo(() => {
    const byCategory = new Map<PresetCategory, AnyPreset[]>();
    for (const p of getAllPresets()) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    return byCategory;
  }, []);

  const handleSelect = (target: AnyPreset) => {
    if (target.id === currentPresetId) return;
    const result = target.dataSchema.safeParse(currentData);
    if (result.success) {
      // Schema fits — silent client-side swap, no credit consumed.
      onSwap({ presetId: target.id, data: result.data, warning: null });
    } else {
      // Schema doesn't fit — bubble intent to parent; parent confirms
      // + fires a server-side auto-remap. No swap happens here.
      onApplyIntent(target.id);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      {CATEGORY_ORDER.map((cat) => {
        const presets = grouped.get(cat);
        if (!presets || presets.length === 0) return null;
        return (
          <section key={cat}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-1 mb-2">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const active = preset.id === currentPresetId;
                const isAiOriginal = preset.id === aiOriginalPresetId;
                // Batch 3a — pre-compute the fit check so a tile can show a
                // "clean swap" tick when picking it wouldn't need an AI
                // re-map. We don't cache across category re-renders — the
                // underlying safeParse is cheap and the list is small
                // enough (≤50 presets) that this runs in microseconds.
                // Skipped for the active preset (no swap to evaluate).
                const fits = active
                  ? false
                  : preset.dataSchema.safeParse(currentData).success;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelect(preset)}
                    title={
                      isAiOriginal
                        ? `${preset.description} — the AI originally picked this for you`
                        : fits
                          ? `${preset.description} — your current content fits this template, no AI re-map needed`
                          : preset.description
                    }
                    className={`relative flex flex-col items-stretch gap-1 p-2 rounded-lg border text-left transition-colors ${
                      active
                        ? 'border-[#1B5B50] bg-[#E6F0EE]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    aria-pressed={active}
                    aria-label={
                      isAiOriginal
                        ? `${preset.name} — AI's original pick`
                        : preset.name
                    }
                  >
                    {/* Batch 1b — "AI" badge on the preset the AI picked for
                        this visual at generation time. Layered over the
                        thumbnail corner so it doesn't push layout around. */}
                    {isAiOriginal ? (
                      <span
                        className="absolute top-1 right-1 z-10 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-[#1B5B50] text-white shadow-sm"
                        aria-hidden="true"
                      >
                        AI
                      </span>
                    ) : null}
                    {/* Batch 3a — fit-check tick on the opposite corner.
                        Only shows when (a) not the active tile and (b) the
                        AI badge isn't already in that space. Hidden when
                        both badges would collide. */}
                    {fits && !isAiOriginal ? (
                      <span
                        className="absolute top-1 right-1 z-10 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white shadow-sm"
                        aria-label="Current content fits this template"
                        title="Your content fits this template — a swap here won't need an AI re-map"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : null}
                    <div
                      className="h-14 flex items-center justify-center overflow-hidden rounded bg-gray-50 border border-gray-100"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: preset.thumbnailSvg }}
                    />
                    <span
                      className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                        active ? 'text-[#1B5B50]' : 'text-gray-700'
                      }`}
                    >
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
