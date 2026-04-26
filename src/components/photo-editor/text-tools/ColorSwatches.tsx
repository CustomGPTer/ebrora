// src/components/photo-editor/text-tools/ColorSwatches.tsx
//
// Curated palette grid. The 24 colours below are tuned for the kind of
// stamps a site / construction-marketing user typically reaches for —
// strong primaries, an Ebrora green family, a few neutrals, and the
// extremes (pure black, pure white). When a swatch matches the current
// `value` we paint the active ring around it.
//
// Used standalone in ColorPanel's Swatches sub-view AND inline by the
// Stroke / Highlight / Shadow panels for their colour rows.

"use client";

import { ColorButton } from "./controls";

/** 24 curated colours. Order is row-by-row visually pleasant, not
 *  alphabetical or hue-sorted. */
export const PALETTE: readonly string[] = [
  // Row 1 — neutrals + Ebrora accent
  "#000000",
  "#444444",
  "#888888",
  "#CCCCCC",
  "#FFFFFF",
  "#1B5B50",
  // Row 2 — warm
  "#E63946",
  "#F4A261",
  "#FFB703",
  "#FB7185",
  "#D62828",
  "#9D0208",
  // Row 3 — cool
  "#1D4ED8",
  "#0EA5E9",
  "#06B6D4",
  "#10B981",
  "#22C55E",
  "#84CC16",
  // Row 4 — accents
  "#7C3AED",
  "#A855F7",
  "#EC4899",
  "#F472B6",
  "#FBBF24",
  "#0F172A",
] as const;

interface ColorSwatchesProps {
  /** Current value (lowercased hex preferred). null = no active swatch. */
  value: string | null;
  onPick: (color: string) => void;
  /** Colour-button diameter. Defaults to 28 (matches ColorButton). */
  size?: number;
}

export function ColorSwatches({ value, onPick, size = 28 }: ColorSwatchesProps) {
  const normalised = value ? value.toLowerCase() : null;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(6, minmax(0, 1fr))`,
        gap: 8,
      }}
    >
      {PALETTE.map((c) => {
        const active = normalised === c.toLowerCase();
        return (
          <div key={c} className="flex items-center justify-center">
            <ColorButton
              color={c}
              active={active}
              onClick={() => onPick(c)}
              ariaLabel={`Use ${c}`}
              size={size}
            />
          </div>
        );
      })}
    </div>
  );
}
