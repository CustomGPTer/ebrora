// =============================================================================
// Preset: process-circular
// Batch 4a-ii-b — flexible-count circular process. Replaces
// process-circular-4step and process-circular-6step with a single preset
// whose render branches on data.steps.length (3–8).
//
// Visually distinct from cycle-steps (which uses discrete circle nodes with
// feedback arrows): this preset emphasises a continuous ring of sequential
// stages around a central hub label — suitable for quarterly cadences,
// N-phase programmes, RIBA-style lifecycles, or any stage ring that isn't
// specifically an iterative feedback loop.
//
// Calibration: counts 4 and 6 reproduce the old process-circular-4step and
// process-circular-6step renderer values exactly (rOuter ratio, rInner ratio,
// gapDeg, fontSize dividers). Counts 3, 5, 7, 8 extrapolate monotonically.
//
// The wedgePath algorithm is count-agnostic — the only per-count nudges are
// the ring geometry (rOuter/rInner), the inter-wedge gap, and the label sizing.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import { SEQUENTIAL_LABEL_MAX, SEQUENTIAL_DETAIL_MAX } from '../common';

// ── Schema ───────────────────────────────────────────────────────────────────
// 3–8 stages. Align label/detail caps with SEQUENTIAL_LABEL_MAX / SEQUENTIAL_DETAIL_MAX
// for consistency with every other sequential/cyclical preset — the old per-count
// schemas had tighter caps (22/40 and 20/28) but the render's font scaling + small
// font fallback handles longer labels gracefully.

const dataSchema = z.object({
  centreLabel: z.string().max(20).optional(),
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(SEQUENTIAL_LABEL_MAX),
        detail: z.string().max(SEQUENTIAL_DETAIL_MAX).optional(),
      }),
    )
    .min(3)
    .max(8),
});

type ProcessCircularData = z.infer<typeof dataSchema>;

const defaultData: ProcessCircularData = {
  centreLabel: 'Programme',
  steps: [
    { label: 'Mobilise', detail: 'Set up welfare + plant' },
    { label: 'Enabling works', detail: 'Diversions + clearance' },
    { label: 'Construction', detail: 'Main build sequence' },
    { label: 'Handover', detail: 'Commission + demob' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// rOuterRatio: fraction of min(w,h) used for the outer ring radius.
// rInnerRatio: fraction of rOuter used for the inner hub boundary.
// gapDeg: degrees of visible separation between adjacent wedges.
// labelFontMax: ceiling for the in-wedge label font size.
// labelFontDiv: rOuter / labelFontDiv gives the font size when below the ceiling.
// detailFontSize: fixed font size for the detail sub-line drawn below each label.
// detailYOffset: pixel offset from label baseline to detail baseline.

interface Layout {
  rOuterRatio: number;
  rInnerRatio: number;
  gapDeg: number;
  labelFontMax: number;
  labelFontDiv: number;
  detailFontSize: number;
  detailYOffset: number;
  /** Batch 4d — char caps to prevent text crossing into adjacent wedges
   *  (wedges narrow as count rises; label/detail horizontal space shrinks). */
  labelTrunc: number;
  detailTrunc: number;
}

const LAYOUT: Record<number, Layout> = {
  3: { rOuterRatio: 0.40, rInnerRatio: 0.50, gapDeg: 2.5, labelFontMax: 15, labelFontDiv: 7,  detailFontSize: 11, detailYOffset: 15, labelTrunc: 18, detailTrunc: 30 },
  4: { rOuterRatio: 0.42, rInnerRatio: 0.48, gapDeg: 2.0, labelFontMax: 14, labelFontDiv: 8,  detailFontSize: 10, detailYOffset: 14, labelTrunc: 15, detailTrunc: 26 },
  5: { rOuterRatio: 0.43, rInnerRatio: 0.47, gapDeg: 1.7, labelFontMax: 13, labelFontDiv: 9,  detailFontSize: 10, detailYOffset: 13, labelTrunc: 14, detailTrunc: 22 },
  6: { rOuterRatio: 0.44, rInnerRatio: 0.46, gapDeg: 1.5, labelFontMax: 12, labelFontDiv: 10, detailFontSize: 10, detailYOffset: 12, labelTrunc: 12, detailTrunc: 20 },
  7: { rOuterRatio: 0.45, rInnerRatio: 0.45, gapDeg: 1.3, labelFontMax: 11, labelFontDiv: 11, detailFontSize: 9,  detailYOffset: 11, labelTrunc: 11, detailTrunc: 18 },
  8: { rOuterRatio: 0.46, rInnerRatio: 0.44, gapDeg: 1.1, labelFontMax: 10, labelFontDiv: 12, detailFontSize: 9,  detailYOffset: 10, labelTrunc: 10, detailTrunc: 16 },
};

/** Batch 4d — simple character-cap truncation with ellipsis fallback. */
function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, a1: number, a2: number): string {
  const rad = (deg: number): number => (deg * Math.PI) / 180;
  const ox1 = cx + rOuter * Math.cos(rad(a1));
  const oy1 = cy + rOuter * Math.sin(rad(a1));
  const ox2 = cx + rOuter * Math.cos(rad(a2));
  const oy2 = cy + rOuter * Math.sin(rad(a2));
  const ix1 = cx + rInner * Math.cos(rad(a2));
  const iy1 = cy + rInner * Math.sin(rad(a2));
  const ix2 = cx + rInner * Math.cos(rad(a1));
  const iy2 = cy + rInner * Math.sin(rad(a1));
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${ox1} ${oy1} A ${rOuter} ${rOuter} 0 ${large} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${rInner} ${rInner} 0 ${large} 0 ${ix2} ${iy2} Z`;
}

function ProcessCircularRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessCircularData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const n = data.steps.length;
  const wedgeFills = gradientSequence(palette, n);
  const centreFill = palette.accent;
  const centreText = palette.accentText;
  const wedgeText = palette.text;
  const detailText = palette.nodeFill;
  const gapStroke = palette.bg;

  const layout = LAYOUT[n] ?? LAYOUT[8];
  const { rOuterRatio, rInnerRatio, gapDeg, labelFontMax, labelFontDiv, detailFontSize, detailYOffset, labelTrunc, detailTrunc } = layout;

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = Math.min(width, height) * rOuterRatio;
  const rInner = rOuter * rInnerRatio;

  const segAngle = 360 / n;
  // Start wedge 0 centred at the top (-90°).
  const startAngle = -90 - segAngle / 2;
  const labelFontSize = Math.min(labelFontMax, rOuter / labelFontDiv);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {data.steps.map((step, i) => {
        const a1 = startAngle + i * segAngle + gapDeg / 2;
        const a2 = startAngle + (i + 1) * segAngle - gapDeg / 2;
        const midA = (a1 + a2) / 2;
        const rad = (midA * Math.PI) / 180;
        const labelR = (rOuter + rInner) / 2;
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);

        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? wedgeFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            <path
              d={wedgePath(cx, cy, rOuter, rInner, a1, a2)}
              fill={fill}
              stroke={gapStroke}
              strokeWidth={1}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              fill={wedgeText}
              fontFamily={font}
              fontSize={labelFontSize}
              fontWeight={700}
            >
              {truncate(step.label, labelTrunc)}
            </text>
            {step.detail ? (
              <text
                x={lx}
                y={ly + detailYOffset}
                textAnchor="middle"
                fill={detailText}
                fontFamily={font}
                fontSize={detailFontSize}
              >
                {truncate(step.detail, detailTrunc)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Centre hub */}
      <g data-id="centre">
        <circle cx={cx} cy={cy} r={rInner - 4} fill={centreFill} />
        {data.centreLabel ? (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={centreText}
            fontFamily={font}
            fontSize={Math.min(14, rInner / 3)}
            fontWeight={700}
          >
            {data.centreLabel}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

// Thumbnail: 4-wedge ring with central hub — representative of the family
// without pinning to a specific count. The abstract "ring + hub" reads as
// "stages around a wheel" regardless of how many stages the preset supports.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 4 A 16 16 0 0 1 76 20 L 68 20 A 8 8 0 0 0 60 12 Z" fill="#1B5B50"/>
  <path d="M76 20 A 16 16 0 0 1 60 36 L 60 28 A 8 8 0 0 0 68 20 Z" fill="#4A9A8A"/>
  <path d="M60 36 A 16 16 0 0 1 44 20 L 52 20 A 8 8 0 0 0 60 28 Z" fill="#7EBFB2"/>
  <path d="M44 20 A 16 16 0 0 1 60 4 L 60 12 A 8 8 0 0 0 52 20 Z" fill="#2A7A6C"/>
  <circle cx="60" cy="20" r="7" fill="#1B5B50"/>
  <text x="104" y="24" font-size="9" fill="#1B5B50" font-weight="700" text-anchor="middle">…</text>
</svg>`;

export const processCircularPreset: Preset<ProcessCircularData> = {
  id: 'process-circular',
  name: 'Circular Process',
  category: 'process',
  tags: ['process', 'circular', 'wheel', 'stages', 'flexible'],
  description: 'Pie-wedge stages arranged around a central hub label. 3 to 8 stages.',
  aiDescription:
    'Pie-wedge ring of 3–8 equal-weight stages around a central hub label. Use for a multi-stage programme, quarterly or periodic cadence, or high-level lifecycle where each stage is equal weight and proceeds around a ring — but the ring is not an explicit feedback loop. Prefer "cycle-steps" when the relationship is an explicit iterative loop (PDCA-style discrete-node cycle); prefer "process-stages-4phase" when the content is strategic phases rather than an operational cadence. Do NOT use for one-off sequences that do not repeat as a ring — use flow-linear or timeline-horizontal instead. Pick a count between 3 and 8 based on the number of distinct stages in the source text.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: ProcessCircularRender,
  editableFields: ['centreLabel', 'steps[].label', 'steps[].detail'],
  compatibleFamilies: ['process', 'cycle'],
};
