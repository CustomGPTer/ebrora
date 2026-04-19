// =============================================================================
// Shared helpers for SEQUENTIAL presets (flow-linear, cycle, process-numbered,
// timeline, process-stages, process-circular). Batch 2a.
//
// Goal: stop copy-pasting the same three concerns into every sequential preset.
// Three things that every sequential preset needs and none should diverge on:
//
//   1. Schema char limits — labels up to 60 chars (raised from the old 40
//      ceiling in Batch 2a), details up to 120. Exposed as constants so the
//      preset schemas stay visibly consistent.
//
//   2. Ordering chip — small numbered circle in the top-left corner of each
//      node so the sequence is legible at a glance even when arrows are
//      covered or the layout isn't strictly left-to-right (e.g. cycle).
//      Rendered as a self-contained <g> the preset drops at its own (x, y).
//
//   3. Adaptive text sizing + 2-line wrapping — when a label is longer than
//      ~18 chars, drop to 2 lines; shrink the font if it still doesn't fit.
//      Pure-SVG implementation via tspan stacking so no DOM measurement is
//      needed. Works at any palette / any preset because colours + font are
//      passed in.
//
// Deliberately NOT shared here:
//   - The outer node shape / colour scheme — each preset is geometric, so
//     it keeps its own <rect> / <circle> / <path> calls.
//   - Arrow markers — same reason.
//   - The `detail` (sub-label) text rendering — most presets already had a
//     bespoke place they draw it (below the node, inside the node, under
//     the shape). Touching that here would force layout breaks. Batch 2b
//     will refresh the AI prompt so details actually get populated;
//     rendering stays where it is.
//
// Backward compatibility:
//   This module is additive. Existing presets continue to compile even if
//   they don't use these helpers — nothing removes them. The Batch 2a PR
//   touches 13 sequential presets to opt in; anything else we leave alone.
// =============================================================================

import type { ReactElement } from 'react';

// ── Char limits ─────────────────────────────────────────────────────────────
// Single source of truth so preset schemas all read the same story. If we
// ever raise these again, change these numbers and the linter will flag
// anything that still hardcodes the old value.

/** Max chars for a sequential-step main label (e.g. "Pour and cure"). */
export const SEQUENTIAL_LABEL_MAX = 60;

/** Max chars for a sequential-step descriptive second line. */
export const SEQUENTIAL_DETAIL_MAX = 120;

// ── Ordering chip ──────────────────────────────────────────────────────────
// A small filled circle with a 1-based index number inside. Rendered as a
// self-contained SVG group at (cx, cy) — the preset is free to position it
// wherever is visually clean (top-left corner of a rect, top of a circle,
// above a dot, …).

export interface OrderingChipProps {
  /** 0-based index; we render `index + 1` as the chip number. */
  index: number;
  /** Centre-X of the chip in SVG user units. */
  cx: number;
  /** Centre-Y of the chip in SVG user units. */
  cy: number;
  /** Chip radius. Default 10 — small enough to sit on a 80px-tall node
   *  without overwhelming it, big enough for a single digit to read. */
  radius?: number;
  /** Fill for the chip background. Typically `palette.accent` to stand
   *  out against the node's primary fill. */
  fill: string;
  /** Text colour for the number inside. Typically `palette.accentText`
   *  so WCAG contrast is preserved. */
  textColour: string;
  /** Font family — passed through from `settings.font`. */
  fontFamily?: string;
  /** Optional data-id so the canvas editor can select the chip
   *  independently of the node (usually unnecessary — leave undefined). */
  dataId?: string;
}

export function OrderingChip({
  index,
  cx,
  cy,
  radius = 10,
  fill,
  textColour,
  fontFamily = 'Inter, sans-serif',
  dataId,
}: OrderingChipProps): ReactElement {
  // Two-digit numbers need a slightly smaller font size to avoid clipping
  // on a 10px-radius circle; one-digit numbers can stay bolder.
  const label = `${index + 1}`;
  const fontSize = label.length > 1 ? radius * 0.9 : radius * 1.1;
  return (
    <g data-id={dataId} aria-hidden="true">
      <circle cx={cx} cy={cy} r={radius} fill={fill} />
      <text
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fill={textColour}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}

// ── Adaptive label rendering ────────────────────────────────────────────────
// Pure-SVG label fitter. Given a box width, a max-font-size, and a label
// string, returns the font size to use AND up to two lines of text to
// render as tspans. No DOM measurement — we use a character-width estimate
// (~0.55 × fontSize per char for Inter) which is conservative enough for
// sans-serif body copy without being cartoonishly padded.

export interface FitLabelResult {
  fontSize: number;
  /** 1 or 2 lines; callers render these as stacked tspans. */
  lines: string[];
}

/**
 * Pick the font size + wrap strategy for a label drawn inside a fixed-
 * width node. We prefer 1 line at `maxFontSize`; if that would overflow
 * we try 2 lines at the same size; if THAT overflows we shrink down to
 * `minFontSize`.
 *
 * Word boundaries are respected — we never break mid-word unless the
 * single word itself is wider than the box (rare at 60-char caps).
 */
export function fitLabelToBox(
  label: string,
  boxWidth: number,
  opts: {
    maxFontSize: number;
    minFontSize?: number;
    /** Horizontal padding inside the box, per side. Default 8. */
    sidePadding?: number;
    /** Char-width multiplier per fontSize unit. Default 0.55 (Inter-ish). */
    charMultiplier?: number;
  },
): FitLabelResult {
  const {
    maxFontSize,
    minFontSize = 10,
    sidePadding = 8,
    charMultiplier = 0.55,
  } = opts;

  const usableWidth = Math.max(0, boxWidth - sidePadding * 2);

  /** Estimated pixel width of a string at a given fontSize. */
  const widthAt = (s: string, fs: number) => s.length * fs * charMultiplier;

  // Try single line at progressively smaller sizes.
  for (let fs = maxFontSize; fs >= minFontSize; fs -= 1) {
    if (widthAt(label, fs) <= usableWidth) {
      return { fontSize: fs, lines: [label] };
    }
  }

  // Try 2 lines — split on word boundary closest to the midpoint.
  const words = label.split(/\s+/);
  if (words.length > 1) {
    let bestSplit = 1;
    let bestBalance = Infinity;
    for (let i = 1; i < words.length; i += 1) {
      const left = words.slice(0, i).join(' ');
      const right = words.slice(i).join(' ');
      const diff = Math.abs(left.length - right.length);
      if (diff < bestBalance) {
        bestBalance = diff;
        bestSplit = i;
      }
    }
    const line1 = words.slice(0, bestSplit).join(' ');
    const line2 = words.slice(bestSplit).join(' ');
    for (let fs = maxFontSize; fs >= minFontSize; fs -= 1) {
      const maxLine = Math.max(line1.length, line2.length);
      if (maxLine * fs * charMultiplier <= usableWidth) {
        return { fontSize: fs, lines: [line1, line2] };
      }
    }
    // Still doesn't fit — accept the clip at min font size. Reality
    // check: a 60-char label simply won't fit in a 100px box at 10px
    // font, and that's acceptable; tspan + svg's implicit text-length
    // handling will render as much as it can without breaking layout.
    return { fontSize: minFontSize, lines: [line1, line2] };
  }

  // Single unbreakable word — accept clip at min font size.
  return { fontSize: minFontSize, lines: [label] };
}

// ── Multi-line label <text> emitter ─────────────────────────────────────────
// Convenience wrapper: build a <text> with one or two <tspan>s for a fitted
// label. Presets call this instead of hand-wiring tspans every time.

export interface LabelTextProps {
  label: string;
  boxWidth: number;
  /** Centre-X in SVG user units. */
  cx: number;
  /** Baseline Y for a single-line label. For 2-line labels the first line
   *  is drawn one half-line HIGHER than this and the second line one
   *  half-line LOWER, so the visual centre stays at `cy`. */
  cy: number;
  maxFontSize: number;
  minFontSize?: number;
  fill: string;
  fontFamily?: string;
  fontWeight?: number;
}

export function LabelText({
  label,
  boxWidth,
  cx,
  cy,
  maxFontSize,
  minFontSize = 10,
  fill,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 600,
}: LabelTextProps): ReactElement {
  const { fontSize, lines } = fitLabelToBox(label, boxWidth, { maxFontSize, minFontSize });
  // Offset so the stack's vertical centre sits at cy. Single line: no offset.
  // Two lines: shift up by half a line-height so line1 top + line2 bottom
  // straddle cy.
  const lineHeight = fontSize * 1.15;
  const firstLineDy =
    lines.length === 1
      ? fontSize * 0.33 // baseline adjustment for true vertical centre
      : -lineHeight / 2 + fontSize * 0.33;

  return (
    <text
      x={cx}
      y={cy + firstLineDy}
      textAnchor="middle"
      fill={fill}
      fontFamily={fontFamily}
      fontSize={fontSize}
      fontWeight={fontWeight}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
