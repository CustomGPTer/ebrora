'use client';

// =============================================================================
// PresetGallery — left sidebar listing every registered preset, grouped by
// category. Click swaps the current visual's preset.
//
// Swap behaviour matches VisualCard.cycleTo():
//   1. Try target.dataSchema.safeParse(data) — on success, data preserved
//   2. On failure, apply target.defaultData and surface an inline warning
//      ("Data didn't fit 'X' — showing default content. Click Regenerate
//       to let the AI re-map your original text.")
//
// The gallery itself doesn't show the warning — it surfaces via onSwap's
// `warning` arg so the CanvasEditor can display it in a banner. Keeps this
// component a pure picker.
//
// Thumbnails use the preset's own `thumbnailSvg` string (raw SVG markup,
// viewBox 0 0 120 80 by convention). We inject via dangerouslySetInnerHTML
// — the contents come from our own source tree, not untrusted input.
// =============================================================================

import { useMemo } from 'react';
import { getAllPresets } from '@/lib/visualise/presets';
import type { AnyPreset, PresetCategory } from '@/lib/visualise/presets/types';

export interface PresetSwapOutcome {
  presetId: string;
  /** New data — either the safeParsed pass-through, or the target's defaultData. */
  data: unknown;
  /** Warning to surface in the editor if schema didn't fit. */
  warning: string | null;
}

interface Props {
  currentPresetId: string;
  currentData: unknown;
  onSwap: (outcome: PresetSwapOutcome) => void;
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

export default function PresetGallery({ currentPresetId, currentData, onSwap }: Props) {
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
      onSwap({ presetId: target.id, data: result.data, warning: null });
    } else {
      onSwap({
        presetId: target.id,
        data: target.defaultData,
        warning: `Data didn't fit "${target.name}" — showing default content. Click Regenerate to let the AI re-map your original text.`,
      });
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
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelect(preset)}
                    title={preset.description}
                    className={`flex flex-col items-stretch gap-1 p-2 rounded-lg border text-left transition-colors ${
                      active
                        ? 'border-[#1B5B50] bg-[#E6F0EE]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    aria-pressed={active}
                  >
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
