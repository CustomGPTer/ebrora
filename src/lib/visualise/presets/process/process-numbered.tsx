// =============================================================================
// Preset: process-numbered
// Batch 4a-ii-c-i — flexible-count numbered process. Replaces
// process-numbered-6step with a single preset whose render branches on
// data.steps.length (3–10).
//
// Visual identity: each step has a prominent number badge at the top of its
// cell, a centred label, and an optional short detail. This distinguishes
// process-numbered from flow-linear (plain rects with arrows) — use when the
// step number itself matters visually (method statements, inductions,
// walkthroughs).
//
// Layout strategy:
//   - Counts 3–4 render as a single row (like flow-linear but with badges).
//   - Counts 5–10 render as a two-row grid with ceil(n/2) on top and
//     floor(n/2) on bottom. Bottom row reads right-to-left (boustrophedon)
//     so the row-break arrow is a short vertical line under the last cell
//     of the top row. This matches the existing 3×2 layout of process-
//     numbered-6step exactly at count 6.
//
// Calibration: count 6 reproduces the old process-numbered-6step geometry
// exactly (pad 14, gap 12, badgeR formula, label font formula, detail font
// 11). Other counts scale pad/gap/detail font via a small lookup table.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import { SEQUENTIAL_LABEL_MAX, SEQUENTIAL_DETAIL_MAX } from '../common';

const dataSchema = z.object({
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(SEQUENTIAL_LABEL_MAX),
        detail: z.string().max(SEQUENTIAL_DETAIL_MAX).optional(),
      }),
    )
    .min(3)
    .max(10),
});

type ProcessNumberedData = z.infer<typeof dataSchema>;

const defaultData: ProcessNumberedData = {
  steps: [
    { label: 'Prepare', detail: 'Gather inputs and brief the team' },
    { label: 'Check conditions', detail: 'Confirm environment is ready' },
    { label: 'Verify authorisation', detail: 'Make sure approvals are in place' },
    { label: 'Execute', detail: 'Carry out the work as planned' },
    { label: 'Record outcome', detail: 'Capture evidence and results' },
    { label: 'Close out', detail: 'Tidy up and hand back' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// Only the per-count tuning knobs go in the table. cellW / cellH / badgeR
// derive from the rendered geometry (grid shape × count) so they scale
// automatically. labelFont uses the formula min(labelFontMax, cellW / 10)
// which matches the old process-numbered-6step behaviour at count 6.

interface Layout {
  pad: number;
  gap: number;
  labelFontMax: number;
  detailFontSize: number;
}

const LAYOUT: Record<number, Layout> = {
  3:  { pad: 16, gap: 14, labelFontMax: 16, detailFontSize: 12 },
  4:  { pad: 14, gap: 14, labelFontMax: 15, detailFontSize: 11 },
  5:  { pad: 14, gap: 12, labelFontMax: 14, detailFontSize: 11 },
  6:  { pad: 14, gap: 12, labelFontMax: 14, detailFontSize: 11 },
  7:  { pad: 12, gap: 10, labelFontMax: 13, detailFontSize: 10 },
  8:  { pad: 12, gap: 10, labelFontMax: 13, detailFontSize: 10 },
  9:  { pad: 10, gap: 8,  labelFontMax: 12, detailFontSize: 10 },
  10: { pad: 10, gap: 8,  labelFontMax: 12, detailFontSize: 10 },
};

/**
 * Grid shape for a given step count. n≤4 uses one row (process-numbered
 * then reads like a row of big numbered badges — fine at low counts).
 * n≥5 uses two rows with the larger half on top.
 */
function gridFor(n: number): { rows: number; topCount: number; bottomCount: number } {
  if (n <= 4) return { rows: 1, topCount: n, bottomCount: 0 };
  const topCount = Math.ceil(n / 2);
  return { rows: 2, topCount, bottomCount: n - topCount };
}

/**
 * Cell (x, y) for step i, given the grid shape and cell dimensions.
 *
 * Single-row case: simple left-to-right.
 *
 * Two-row case: top row left-to-right; bottom row right-to-left starting
 * directly beneath the last cell of the top row. That way the row-break
 * arrow (from the last top cell to the first bottom cell) is always a
 * short vertical line — same as the original 3×2 at count 6.
 */
function cellPos(
  i: number,
  n: number,
  cellW: number,
  cellH: number,
  pad: number,
  gap: number,
): { x: number; y: number } {
  const { topCount } = gridFor(n);
  if (i < topCount) {
    const col = i;
    return { x: pad + col * (cellW + gap), y: pad };
  }
  const bottomIdx = i - topCount;
  const col = topCount - 1 - bottomIdx;
  return { x: pad + col * (cellW + gap), y: pad + cellH + gap };
}

function ProcessNumberedRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessNumberedData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const n = data.steps.length;
  const badgeFills = gradientSequence(palette, n);
  const badgeText = palette.text;
  const boxFill = palette.bg;
  const labelFill = palette.nodeFill;
  const detailFill = palette.nodeStroke;
  const arrowColour = palette.nodeStroke;

  const layout = LAYOUT[n] ?? LAYOUT[10];
  const { pad, gap, labelFontMax, detailFontSize } = layout;

  const grid = gridFor(n);
  // Cell width keyed on the wider of the two rows (topCount). When the bottom
  // row has fewer cells, the leftmost column of the bottom row is empty —
  // that's the intended asymmetric grid look.
  const colCount = grid.topCount;
  const cellW = (width - pad * 2 - gap * (colCount - 1)) / colCount;
  const cellH =
    grid.rows === 1
      ? height - pad * 2
      : (height - pad * 2 - gap) / 2;

  const badgeR = Math.min(16, cellH * 0.22);
  const labelFontSize = Math.min(labelFontMax, cellW / 10);

  // Precompute positions once so the arrow loop can reuse them.
  const positions = Array.from({ length: n }, (_, i) =>
    cellPos(i, n, cellW, cellH, pad, gap),
  );

  const markerId = 'process-numbered-arrow';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColour} />
        </marker>
      </defs>

      {/* Arrows between consecutive steps in visit order. Same-row pairs get
          a horizontal arrow (direction inferred from the relative x); the
          row-break pair gets a vertical arrow. */}
      {positions.slice(0, -1).map((p, i) => {
        const next = positions[i + 1];
        const sameRow = Math.abs(p.y - next.y) < 1;
        if (sameRow) {
          const isLeftToRight = next.x > p.x;
          const x1 = isLeftToRight ? p.x + cellW + 1 : p.x - 1;
          const x2 = isLeftToRight ? next.x - 2 : next.x + cellW + 2;
          return (
            <line
              key={`arr-${i}`}
              x1={x1}
              y1={p.y + cellH / 2}
              x2={x2}
              y2={p.y + cellH / 2}
              stroke={arrowColour}
              strokeWidth={2}
              markerEnd={`url(#${markerId})`}
            />
          );
        }
        // Vertical row-break — arrow from the bottom edge of p down to the
        // top edge of next. They share the same column so centre-x aligns.
        return (
          <line
            key={`arr-${i}`}
            x1={p.x + cellW / 2}
            y1={p.y + cellH + 1}
            x2={p.x + cellW / 2}
            y2={next.y - 2}
            stroke={arrowColour}
            strokeWidth={2}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {data.steps.map((step, i) => {
        const { x, y } = positions[i];
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? boxFill;
        const badgeCx = x + cellW / 2;
        const badgeCy = y + badgeR + 4;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={y} width={cellW} height={cellH} rx={8} ry={8} fill={fill} />
            {/* Number badge — centred at top of the cell. Stays prominent
                at all counts because badgeR is derived from cellH. */}
            <circle cx={badgeCx} cy={badgeCy} r={badgeR} fill={badgeFills[i]} />
            <text
              x={badgeCx}
              y={badgeCy + badgeR / 2.3}
              textAnchor="middle"
              fill={badgeText}
              fontFamily={font}
              fontSize={badgeR * 1.1}
              fontWeight={700}
            >
              {i + 1}
            </text>

            <text
              x={x + cellW / 2}
              y={y + cellH * 0.58}
              textAnchor="middle"
              fill={labelFill}
              fontFamily={font}
              fontSize={labelFontSize}
              fontWeight={700}
            >
              {step.label}
            </text>
            {step.detail ? (
              <text
                x={x + cellW / 2}
                y={y + cellH * 0.58 + 16}
                textAnchor="middle"
                fill={detailFill}
                fontFamily={font}
                fontSize={detailFontSize}
              >
                {step.detail}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Thumbnail: 2-row grid of 3+2 cells with prominent number badges — reads
// clearly as "numbered process grid, flexible count" thanks to the trailing
// ellipsis on the second row.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4"  y="3"  width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="42" y="3"  width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="80" y="3"  width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="4"  y="22" width="34" height="15" rx="2" fill="#B5DAD2" opacity="0.4"/>
  <rect x="42" y="22" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="80" y="22" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <circle cx="21" cy="8"  r="3" fill="#1B5B50"/>
  <circle cx="59" cy="8"  r="3" fill="#1B5B50"/>
  <circle cx="97" cy="8"  r="3" fill="#1B5B50"/>
  <circle cx="97" cy="27" r="3" fill="#1B5B50"/>
  <circle cx="59" cy="27" r="3" fill="#1B5B50"/>
  <text   x="21" y="31" font-size="9" fill="#1B5B50" font-weight="700" text-anchor="middle">…</text>
</svg>`;

export const processNumberedPreset: Preset<ProcessNumberedData> = {
  id: 'process-numbered',
  name: 'Numbered Process',
  category: 'process',
  tags: ['process', 'sequence', 'numbered', 'grid', 'flexible'],
  description: 'Numbered process steps in a reading-order grid. 3 to 10 steps.',
  aiDescription:
    'Grid of 3–10 numbered process steps, each with a prominent number badge, a centred label, and optional short detail. Use when the text describes an ordered operational procedure, checklist, induction, or walkthrough where the step number matters visually (e.g. "Step 1:", "Step 2:"). Prefer "flow-linear" when the numbering is not emphasised in the text. Prefer "process-stages-4phase" for a 4-phase strategic lifecycle rather than operational steps. Pick a count between 3 and 10 based on the number of discrete steps the source text describes — do not pad or truncate to fit a specific number.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: ProcessNumberedRender,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['process', 'flow'],
};
