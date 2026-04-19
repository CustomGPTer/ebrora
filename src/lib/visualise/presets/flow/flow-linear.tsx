// =============================================================================
// Preset: flow-linear
// Batch 4a-i — flexible-count linear flow. Replaces flow-linear-3step,
// flow-linear-4step and flow-linear-5step with a single preset whose
// render function branches on data.steps.length (3–10).
//
// Why one preset instead of eight: the old per-count renderers differed only
// in small numeric nudges (padding, gap, fontSize, chip radius, rx). Consolidating
// to a lookup table keyed on count keeps every count's visual identity intact
// while letting the AI pick the right step count for the content instead of
// being forced to choose a preset by count.
//
// Calibration: counts 3/4/5 exactly reproduce the values from the old
// flow-linear-{3,4,5}step renderers so existing drafts visually round-trip
// after the Batch 4a-i silent preset-ID remap.
//
// Side benefit of consolidation: this render uses LabelText (from common.tsx)
// for adaptive font sizing + 2-line wrap. The old per-count renderers used
// a single-line <text> that clipped long labels; the new render handles
// SEQUENTIAL_LABEL_MAX (60) char labels gracefully via tspan wrapping.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import {
  OrderingChip,
  LabelText,
  SEQUENTIAL_LABEL_MAX,
  SEQUENTIAL_DETAIL_MAX,
} from '../common';

// ── Schema ───────────────────────────────────────────────────────────────────
// 3–10 steps. Each step has a label and optional detail. The detail renders
// as a small line below the rect; the label renders inside the rect.

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

type FlowLinearData = z.infer<typeof dataSchema>;

const defaultData: FlowLinearData = {
  steps: [
    { label: 'Plan', detail: 'Define scope and resources' },
    { label: 'Prepare', detail: 'Mobilise site and permits' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Verify', detail: 'Inspect and hand over' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// One entry per supported count. Values at counts 3/4/5 reproduce the old
// flow-linear-{3,4,5}step renderer constants exactly. 6–10 extrapolate
// monotonically: narrower nodes, smaller fonts, tighter gaps, smaller chips.
//
// chipRadius is 7 (not 6) at 9/10 so the two-digit chip labels ("10") don't
// clip. chipPos = chipRadius + 2 so the chip always sits 2px inside the rect
// corner regardless of count.

interface Layout {
  /** Horizontal padding either side of the row. */
  padding: number;
  /** Horizontal gap between rects (and between rect edge and arrow tip). */
  gap: number;
  /** Maximum rect height — clamped against `height * heightRatio`. */
  nodeHeightMax: number;
  /** Fraction of viewport height the rect can occupy. */
  heightRatio: number;
  /** Maximum label font size — LabelText will shrink / wrap if needed. */
  fontSizeMax: number;
  /** OrderingChip radius. */
  chipRadius: number;
  /** Rect corner radius. */
  rx: number;
  /** Detail-line font size (drawn below the rect). */
  detailFontSize: number;
  /** Vertical offset between rect bottom and detail-line baseline. */
  detailYOffset: number;
}

const LAYOUT: Record<number, Layout> = {
  3:  { padding: 20, gap: 20, nodeHeightMax: 88, heightRatio: 0.52, fontSizeMax: 18, chipRadius: 10, rx: 8, detailFontSize: 11, detailYOffset: 24 },
  4:  { padding: 20, gap: 16, nodeHeightMax: 80, heightRatio: 0.50, fontSizeMax: 16, chipRadius: 10, rx: 8, detailFontSize: 11, detailYOffset: 24 },
  5:  { padding: 16, gap: 12, nodeHeightMax: 72, heightRatio: 0.45, fontSizeMax: 14, chipRadius: 8,  rx: 7, detailFontSize: 10, detailYOffset: 22 },
  6:  { padding: 14, gap: 10, nodeHeightMax: 68, heightRatio: 0.42, fontSizeMax: 13, chipRadius: 8,  rx: 7, detailFontSize: 10, detailYOffset: 20 },
  7:  { padding: 12, gap: 9,  nodeHeightMax: 64, heightRatio: 0.40, fontSizeMax: 12, chipRadius: 7,  rx: 6, detailFontSize: 9,  detailYOffset: 18 },
  8:  { padding: 12, gap: 8,  nodeHeightMax: 60, heightRatio: 0.38, fontSizeMax: 12, chipRadius: 7,  rx: 6, detailFontSize: 9,  detailYOffset: 16 },
  9:  { padding: 10, gap: 7,  nodeHeightMax: 56, heightRatio: 0.36, fontSizeMax: 11, chipRadius: 7,  rx: 5, detailFontSize: 8,  detailYOffset: 14 },
  10: { padding: 10, gap: 6,  nodeHeightMax: 52, heightRatio: 0.35, fontSizeMax: 11, chipRadius: 7,  rx: 5, detailFontSize: 8,  detailYOffset: 12 },
};

function FlowLinearRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinearData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const nodeCount = data.steps.length;
  const stepFills = gradientSequence(palette, nodeCount);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;

  // Defensive default — Zod already enforces 3–10, but if a blob slipped past
  // validation somehow we fall back to the 10-step layout (widest row, smallest
  // nodes) rather than throw at render.
  const layout = LAYOUT[nodeCount] ?? LAYOUT[10];
  const { padding, gap, nodeHeightMax, heightRatio, fontSizeMax, chipRadius, rx, detailFontSize, detailYOffset } = layout;

  const nodeWidth = (width - padding * 2 - gap * (nodeCount - 1)) / nodeCount;
  const nodeHeight = Math.min(nodeHeightMax, height * heightRatio);
  const nodeY = (height - nodeHeight) / 2 - 10;
  const detailY = nodeY + nodeHeight + detailYOffset;

  // Unique marker ID so multiple flow-linear instances on the page don't
  // stomp each other's arrow markers.
  const markerId = 'flow-linear-arrow';

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
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowFill} />
        </marker>
      </defs>

      {data.steps.map((step, i) => {
        const x = padding + i * (nodeWidth + gap);
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? stepFills[i];
        // Chip sits 2px inside the top-left corner of the rect regardless of
        // the chip radius — keeps visual rhythm consistent across all counts.
        const chipInset = chipRadius + 2;

        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={x}
              y={nodeY}
              width={nodeWidth}
              height={nodeHeight}
              rx={rx}
              ry={rx}
              fill={fill}
            />
            {/* Batch 2a — ordering chip, top-left of the rect. */}
            <OrderingChip
              index={i}
              cx={x + chipInset}
              cy={nodeY + chipInset}
              radius={chipRadius}
              fill={palette.accent}
              textColour={palette.accentText}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
            />
            {/* Batch 4a-i — label uses LabelText for adaptive sizing + wrap.
                Supersedes the single-line <text> approach in the old
                flow-linear-{3,4,5}step renderers, which clipped long labels. */}
            <LabelText
              label={step.label}
              boxWidth={nodeWidth}
              cx={x + nodeWidth / 2}
              cy={nodeY + nodeHeight / 2}
              maxFontSize={fontSizeMax}
              fill={nodeTextFill}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
              fontWeight={600}
            />
            {step.detail ? (
              <text
                x={x + nodeWidth / 2}
                y={detailY}
                textAnchor="middle"
                fill={detailFill}
                fontFamily={settings.font ?? 'Inter, sans-serif'}
                fontSize={detailFontSize}
              >
                {step.detail}
              </text>
            ) : null}
            {i < nodeCount - 1 ? (
              <line
                x1={x + nodeWidth + 2}
                y1={nodeY + nodeHeight / 2}
                x2={x + nodeWidth + gap - 4}
                y2={nodeY + nodeHeight / 2}
                stroke={arrowFill}
                strokeWidth={2}
                markerEnd={`url(#${markerId})`}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Thumbnail: three solid rects + ellipsis + one faded rect. Communicates
// "sequence, flexible count" without pinning a specific number of steps.
// Opacity 0.4 on the trailing rect is enough to read as secondary without
// becoming invisible on the sidebar gallery's white card background.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="14" width="22" height="12" rx="2" fill="#1B5B50"/>
  <rect x="30" y="14" width="22" height="12" rx="2" fill="#1B5B50"/>
  <rect x="56" y="14" width="22" height="12" rx="2" fill="#1B5B50"/>
  <line x1="26" y1="20" x2="30" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="52" y1="20" x2="56" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="78" y1="20" x2="82" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <text x="90" y="24" font-size="10" fill="#1B5B50" font-weight="700" text-anchor="middle">…</text>
  <rect x="98" y="14" width="18" height="12" rx="2" fill="#1B5B50" opacity="0.4"/>
</svg>`;

export const flowLinearPreset: Preset<FlowLinearData> = {
  id: 'flow-linear',
  name: 'Linear Flow',
  category: 'flow',
  tags: ['process', 'sequence', 'simple', 'horizontal', 'flexible'],
  description: 'Sequential steps connected with arrows. 3 to 10 steps.',
  aiDescription:
    'Horizontal row of 3–10 sequential steps connected by arrows. Use for any process, procedure, method statement, onboarding flow, delivery sequence, or step-by-step explanation where each stage follows directly from the previous one. Pick a count between 3 and 10 based on how many discrete stages the source text describes — do not pad or truncate to fit a specific number. Prefer this over process-numbered for prose-style step lists where the step number is not itself emphasised, and prefer over timeline-horizontal when the stages are not anchored to dates.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: FlowLinearRender,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
