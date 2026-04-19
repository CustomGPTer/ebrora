// =============================================================================
// Preset: flow-linear-vertical
// Batch 4a-ii-a — flexible-count vertical linear flow. Replaces
// flow-linear-vertical-4step with a single preset whose render branches on
// data.steps.length (3–10).
//
// Mirrors Batch 4a-i's flow-linear consolidation for the vertical layout.
// Count 4 reproduces the old flow-linear-vertical-4step renderer exactly
// (gap 18, nodeHeight 58, label fontSize 15, detail fontSize 12, default
// chip radius 10); counts 3, 5–10 extrapolate monotonically.
//
// Geometry: a centred column of label rects (labelBoxX / labelBoxW) with the
// detail text rendered to the RIGHT of each rect (not below, unlike the
// horizontal variant). Down-arrow between rects.
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

type FlowLinearVerticalData = z.infer<typeof dataSchema>;

const defaultData: FlowLinearVerticalData = {
  steps: [
    { label: 'Plan', detail: 'Define scope and resources' },
    { label: 'Prepare', detail: 'Mobilise site and permits' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Verify', detail: 'Inspect and hand over' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// Values at count 4 reproduce the old flow-linear-vertical-4step renderer
// constants exactly. Higher counts tighten gap, shrink rects, shrink fonts
// and chips monotonically. At count=10 the rects are small (~26px tall) and
// labels will fall back to the minimum font inside LabelText — acceptable
// trade-off for a 10-row vertical stack.

interface Layout {
  gap: number;
  nodeHeightMax: number;
  fontSizeMax: number;
  detailFontSize: number;
  chipRadius: number;
  rx: number;
  /** Batch 4d — char cap on detail text. Detail sits to the right of the
   *  label rect (textAnchor="start") starting at approximately width/2 + 30,
   *  so available horizontal space is roughly width/2 - 30. At width=900
   *  that gives ~420px which fits ~60–90 chars depending on font; caps
   *  here leave a right-edge margin and tighten at high counts when the
   *  font shrinks further. */
  detailTrunc: number;
}

const LAYOUT: Record<number, Layout> = {
  3:  { gap: 20, nodeHeightMax: 68, fontSizeMax: 16, detailFontSize: 13, chipRadius: 10, rx: 8, detailTrunc: 72 },
  4:  { gap: 18, nodeHeightMax: 58, fontSizeMax: 15, detailFontSize: 12, chipRadius: 10, rx: 8, detailTrunc: 68 },
  5:  { gap: 16, nodeHeightMax: 50, fontSizeMax: 14, detailFontSize: 11, chipRadius: 9,  rx: 7, detailTrunc: 60 },
  6:  { gap: 14, nodeHeightMax: 44, fontSizeMax: 13, detailFontSize: 10, chipRadius: 8,  rx: 7, detailTrunc: 54 },
  7:  { gap: 12, nodeHeightMax: 38, fontSizeMax: 12, detailFontSize: 10, chipRadius: 8,  rx: 6, detailTrunc: 48 },
  8:  { gap: 10, nodeHeightMax: 34, fontSizeMax: 11, detailFontSize: 9,  chipRadius: 7,  rx: 6, detailTrunc: 42 },
  9:  { gap: 9,  nodeHeightMax: 30, fontSizeMax: 11, detailFontSize: 9,  chipRadius: 7,  rx: 5, detailTrunc: 38 },
  10: { gap: 8,  nodeHeightMax: 26, fontSizeMax: 10, detailFontSize: 8,  chipRadius: 6,  rx: 5, detailTrunc: 34 },
};

/** Batch 4d — simple character-cap truncation with ellipsis fallback. */
function truncateDetail(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function FlowLinearVerticalRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinearVerticalData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const nodeCount = data.steps.length;
  const stepFills = gradientSequence(palette, nodeCount);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;
  const font = settings.font ?? 'Inter, sans-serif';

  const layout = LAYOUT[nodeCount] ?? LAYOUT[10];
  const { gap, nodeHeightMax, fontSizeMax, detailFontSize, chipRadius, rx, detailTrunc } = layout;

  // Vertical layout sizing.
  const padTop = 20;
  const padBottom = 20;
  const availableH = height - padTop - padBottom;
  const nodeHeight = Math.min(
    nodeHeightMax,
    (availableH - gap * (nodeCount - 1)) / nodeCount,
  );
  const totalH = nodeHeight * nodeCount + gap * (nodeCount - 1);
  const startY = padTop + (availableH - totalH) / 2;

  // Horizontal layout — label rect on the left half, detail text to its right.
  // Values preserve the old preset's geometry: label box up to 220px wide,
  // offset 100px left of centre so the detail column has room on the right.
  const labelBoxW = Math.min(220, width * 0.32);
  const labelBoxX = (width - labelBoxW) / 2 - 100;
  const detailX = labelBoxX + labelBoxW + 20;

  const markerId = 'flow-linear-vertical-arrow';
  // Chip inset matches Batch 4a-i's horizontal formula: chipRadius + 2 keeps
  // the chip 2px inside the rect corner across all counts.
  const chipInset = chipRadius + 2;

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
          refX="5"
          refY="9"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 0 L 5 10 z" fill={arrowFill} />
        </marker>
      </defs>

      {data.steps.map((step, i) => {
        const y = startY + i * (nodeHeight + gap);
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? stepFills[i];
        const centreX = labelBoxX + labelBoxW / 2;
        const bottomY = y + nodeHeight;
        const nextTopY = y + nodeHeight + gap;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={labelBoxX}
              y={y}
              width={labelBoxW}
              height={nodeHeight}
              rx={rx}
              ry={rx}
              fill={fill}
            />
            <OrderingChip
              index={i}
              cx={labelBoxX + chipInset}
              cy={y + chipInset}
              radius={chipRadius}
              fill={palette.accent}
              textColour={palette.accentText}
              fontFamily={font}
            />
            <LabelText
              label={step.label}
              boxWidth={labelBoxW}
              cx={centreX}
              cy={y + nodeHeight / 2}
              maxFontSize={fontSizeMax}
              fill={nodeTextFill}
              fontFamily={font}
              fontWeight={600}
            />
            {step.detail ? (
              <text
                x={detailX}
                y={y + nodeHeight / 2 + 4}
                textAnchor="start"
                fill={detailFill}
                fontFamily={font}
                fontSize={detailFontSize}
              >
                {truncateDetail(step.detail, detailTrunc)}
              </text>
            ) : null}
            {i < nodeCount - 1 ? (
              <line
                x1={centreX}
                y1={bottomY + 2}
                x2={centreX}
                y2={nextTopY - 4}
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

// Thumbnail: three stacked rects + vertical ellipsis + one faded rect.
// Vertical analogue of the horizontal flow-linear thumbnail.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="42" y="3"  width="36" height="6" rx="1.5" fill="#1B5B50"/>
  <rect x="42" y="11" width="36" height="6" rx="1.5" fill="#1B5B50"/>
  <rect x="42" y="19" width="36" height="6" rx="1.5" fill="#1B5B50"/>
  <line x1="60" y1="9"  x2="60" y2="11" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="17" x2="60" y2="19" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="25" x2="60" y2="27" stroke="#2A7A6C" stroke-width="1"/>
  <text x="60" y="31" font-size="5" fill="#1B5B50" font-weight="700" text-anchor="middle">⋮</text>
  <rect x="46" y="33" width="28" height="5" rx="1" fill="#1B5B50" opacity="0.4"/>
</svg>`;

export const flowLinearVerticalPreset: Preset<FlowLinearVerticalData> = {
  id: 'flow-linear-vertical',
  name: 'Linear Flow — Vertical',
  category: 'flow',
  tags: ['process', 'sequence', 'vertical', 'stack', 'flexible'],
  description: 'Sequential steps stacked vertically with down-arrows. 3 to 10 steps.',
  aiDescription:
    'Vertical stack of 3–10 sequential steps connected by down-arrows. Use when the sequence is naturally top-to-bottom — escalation paths, vertical reporting sequences, onboarding stages presented in a narrow column, or any process that reads downward. Equivalent data shape to flow-linear (horizontal); prefer the vertical variant when the text implies ascent/descent or a strict ordering that reads top-to-bottom. Pick a count between 3 and 10 based on the number of discrete stages in the source text — do not pad or truncate to fit a specific number.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: FlowLinearVerticalRender,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
