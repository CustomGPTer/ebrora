'use client';

// =============================================================================
// PaletteChooser — 6 swatches, each showing the 4 visually-distinctive slots
// of one palette. Clicking selects.
//
// Batch 2: migrated from 6-tuple slice to 5-slot Palette object. The 4 strips
// we show are [bg, nodeFill, nodeStroke, accent] — chosen because they're the
// four that define the palette's visual identity; `text` is usually white and
// would render as a blank strip.
//
// Render compact enough to fit in the 260 px settings sidebar without
// horizontal scroll — 3 cols × 2 rows at default sidebar width.
// =============================================================================

import { PALETTE_IDS, PALETTE_LABELS, PALETTES } from '@/lib/visualise/palettes';
import type { PaletteId } from '@/lib/visualise/types';

interface Props {
  value: PaletteId;
  onChange: (id: PaletteId) => void;
}

export default function PaletteChooser({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PALETTE_IDS.map((id) => {
        const active = id === value;
        const palette = PALETTES[id];
        const strips = [palette.bg, palette.nodeFill, palette.nodeStroke, palette.accent];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`group flex flex-col items-stretch gap-1.5 p-2 rounded-lg border text-left transition-colors ${
              active
                ? 'border-[#1B5B50] bg-[#E6F0EE]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            aria-pressed={active}
          >
            <div className="flex h-5 overflow-hidden rounded">
              {strips.map((c, i) => (
                <div key={i} style={{ background: c }} className="flex-1" />
              ))}
            </div>
            <span
              className={`text-xs font-medium truncate ${
                active ? 'text-[#1B5B50]' : 'text-gray-700'
              }`}
            >
              {PALETTE_LABELS[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
