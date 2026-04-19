'use client';

// =============================================================================
// PaletteChooser — swatches for each palette. Clicking selects.
//
// Layout: every palette is shown as a 2-col tile with a 4-strip preview and
// its label underneath. The 4 strips are [bg, nodeFill, nodeStroke, accent]
// — the four that visually define the palette; `text` is usually white and
// `accentText` is a contrast-match so neither renders as a useful preview
// strip.
//
// Primary vs secondary (Batch 1a):
//   The six "primary" palettes (Ebrora Primary / Gold, Hi-Vis, Slate, Mono,
//   Earth) are always visible — 2×3 grid matching the pre-Batch-1a layout
//   exactly. The eight "secondary" palettes (Marine, Stone, Highway, Verdant,
//   Brick, Heritage, Nordic, Rail) are hidden behind a "More colours" toggle
//   that expands a second 2×4 grid in place. This preserves the compact
//   default and exposes the full set without a modal.
//
// Auto-expand rule: if the currently-selected palette is a secondary one
// (e.g. a draft generated before the user ever clicked "More colours" — the
// AI is free to pick any of the 14), the secondary grid opens by default so
// the user can see which tile is active. A user-driven collapse overrides
// this, so choosing a secondary palette and then clicking "Fewer colours"
// hides the secondary grid — the active tile is still selected, just not
// visible until the user expands again.
//
// Render compact enough to fit in the 260 px settings sidebar without
// horizontal scroll — tiles are 2-col at default sidebar width.
// =============================================================================

import { useEffect, useState } from 'react';
import {
  PALETTES,
  PALETTE_IDS_PRIMARY,
  PALETTE_IDS_SECONDARY,
  PALETTE_LABELS,
} from '@/lib/visualise/palettes';
import type { PaletteId } from '@/lib/visualise/types';

interface Props {
  value: PaletteId;
  onChange: (id: PaletteId) => void;
}

/**
 * Render one palette tile. Extracted so the primary and secondary grids
 * render identically — no visual difference between the two groups beyond
 * where they sit in the chooser.
 */
function PaletteTile({
  id,
  active,
  onSelect,
}: {
  id: PaletteId;
  active: boolean;
  onSelect: (id: PaletteId) => void;
}) {
  const palette = PALETTES[id];
  const strips = [palette.bg, palette.nodeFill, palette.nodeStroke, palette.accent];
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group flex flex-col items-stretch gap-1.5 p-2 rounded-lg border text-left transition-colors ${
        active
          ? 'border-[#1B5B50] bg-[#E6F0EE]'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      aria-pressed={active}
      aria-label={`Use ${PALETTE_LABELS[id]} palette`}
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
}

export default function PaletteChooser({ value, onChange }: Props) {
  const isSecondaryActive = PALETTE_IDS_SECONDARY.includes(value);

  // Expanded state: defaults to open when a secondary palette is already
  // selected (so the active tile is visible), collapsed otherwise. User
  // overrides are sticky for the component lifetime.
  const [expanded, setExpanded] = useState<boolean>(isSecondaryActive);

  // If the selected palette changes externally (e.g. the AI regenerates and
  // picks a secondary palette), auto-open so the user can see what's active.
  // Does NOT auto-close when switching from secondary → primary; leaving the
  // panel open on that swap is less disorienting than it snapping shut.
  useEffect(() => {
    if (isSecondaryActive && !expanded) setExpanded(true);
    // Intentionally depend only on `isSecondaryActive` — we don't want
    // `expanded` in the deps array because that would undo the user's
    // manual collapse every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSecondaryActive]);

  return (
    <div className="flex flex-col gap-2">
      {/* Primary grid — always visible. */}
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_IDS_PRIMARY.map((id) => (
          <PaletteTile
            key={id}
            id={id}
            active={id === value}
            onSelect={onChange}
          />
        ))}
      </div>

      {/* Toggle row. A text button rather than an icon-only control so the
          purpose is obvious without hover/tap-to-discover. The chevron is
          decorative — the text label carries the meaning. */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="palette-chooser-secondary-grid"
        className="mt-1 inline-flex items-center justify-center gap-1.5 self-start text-xs font-semibold text-[#1B5B50] hover:text-[#144840] transition-colors"
      >
        <span>{expanded ? 'Fewer colours' : 'More colours'}</span>
        <span
          aria-hidden="true"
          className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {/* Secondary grid — expands in place. Rendered into DOM only when
          expanded so aria-hidden panels don't muddy the tab order. */}
      {expanded ? (
        <div
          id="palette-chooser-secondary-grid"
          className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100"
        >
          {PALETTE_IDS_SECONDARY.map((id) => (
            <PaletteTile
              key={id}
              id={id}
              active={id === value}
              onSelect={onChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
