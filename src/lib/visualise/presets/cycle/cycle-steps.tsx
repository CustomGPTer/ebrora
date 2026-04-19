// =============================================================================
// Preset: cycle-steps
// Batch 4a-ii-b — flexible-count circular cycle. Replaces cycle-4step and
// cycle-6step with a single preset whose render branches on
// data.steps.length (3–8).
//
// Visually distinct from process-circular (which uses pie wedges around a
// hub): this preset uses discrete circle nodes connected by clockwise
// curved arrows — the classic iterative-loop diagram. Suitable for PDCA,
// governance cycles, review loops, continuous-improvement models, or any
// repeating sequence of equal-weight phases.
//
// Calibration: counts 4 and 6 reproduce the old cycle-4step and cycle-6step
// renderer values exactly (nodeR ratio + ceiling, arcGap, label/detail sizing).
// Counts 3, 5, 7, 8 extrapolate monotonically.
//
// The positioning + arc-path algorithms are count-agnostic (already
// parameterised on n in cycle-6step); the only per-count nudges are node
// radius, inter-arc breathing gap, and label font sizing.
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
    .max(8),
  centreLabel: z.string().max(24).optional(),
});

type CycleStepsData = z.infer<typeof dataSchema>;

const defaultData: CycleStepsData = {
  steps: [
    { label: 'Plan', detail: 'Set objectives' },
    { label: 'Do', detail: 'Carry out work' },
    { label: 'Check', detail: 'Measure results' },
    { label: 'Act', detail: 'Adjust and improve' },
  ],
  centreLabel: 'PDCA',
};

// ── Layout table ─────────────────────────────────────────────────────────────
// Values at count 4 reproduce cycle-4step exactly (nodeR max 46, ratio 0.42,
// arcGap 0.28, label fontSize 13, detail fontSize 10, label trunc 10, detail
// trunc 20).
// Values at count 6 reproduce cycle-6step exactly (nodeR max 42, ratio 0.34,
// arcGap 0.32, label fontSize 12, detail fontSize 10, label trunc 12, detail
// trunc 22).
// Counts 3, 5, 7, 8 extrapolate monotonically. Truncation values give a hard
// rendering cap per count regardless of the schema's 60-char allowance — the
// schema max is there so the inline text editor + AI can accept longer labels
// (viewed on hover / in the editor); the canvas render trims to what fits.

interface Layout {
  /** Node radius cap (absolute pixels). */
  nodeRMax: number;
  /** Node radius as fraction of ring radius R when below the cap. */
  nodeRRatio: number;
  /** Radians of breathing room left at each end of an arc (prevents
   *  arrows from overlapping the node circles). */
  arcGap: number;
  /** Label font size inside the node. */
  labelFontSize: number;
  /** Detail font size outside the node (along radial line). */
  detailFontSize: number;
  /** Rendered label truncation cap — visible chars inside the circle. */
  labelTrunc: number;
  /** Rendered detail truncation cap — visible chars in the outside label. */
  detailTrunc: number;
}

const LAYOUT: Record<number, Layout> = {
  3: { nodeRMax: 50, nodeRRatio: 0.48, arcGap: 0.24, labelFontSize: 14, detailFontSize: 11, labelTrunc: 10, detailTrunc: 22 },
  4: { nodeRMax: 46, nodeRRatio: 0.42, arcGap: 0.28, labelFontSize: 13, detailFontSize: 10, labelTrunc: 10, detailTrunc: 20 },
  5: { nodeRMax: 44, nodeRRatio: 0.38, arcGap: 0.30, labelFontSize: 12, detailFontSize: 10, labelTrunc: 11, detailTrunc: 21 },
  6: { nodeRMax: 42, nodeRRatio: 0.34, arcGap: 0.32, labelFontSize: 12, detailFontSize: 10, labelTrunc: 12, detailTrunc: 22 },
  7: { nodeRMax: 38, nodeRRatio: 0.30, arcGap: 0.34, labelFontSize: 11, detailFontSize: 9,  labelTrunc: 12, detailTrunc: 22 },
  8: { nodeRMax: 34, nodeRRatio: 0.28, arcGap: 0.36, labelFontSize: 11, detailFontSize: 9,  labelTrunc: 13, detailTrunc: 22 },
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function CycleStepsRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<CycleStepsData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const n = data.steps.length;
  const stepFills = gradientSequence(palette, n);
  const arc = palette.nodeStroke;
  const centreText = palette.nodeFill;
  const labelText = palette.text;
  const detailText = palette.nodeFill;

  const layout = LAYOUT[n] ?? LAYOUT[8];
  const { nodeRMax, nodeRRatio, arcGap, labelFontSize, detailFontSize, labelTrunc, detailTrunc } = layout;

  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.36;
  const nodeR = Math.min(nodeRMax, R * nodeRRatio);

  // Each node centred on its slice of the ring, starting at -90° (top).
  const positions = Array.from({ length: n }, (_, i) => {
    const angleDeg = -90 + (360 / n) * i;
    const a = (angleDeg * Math.PI) / 180;
    return { angle: angleDeg, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const arcPath = (fromDeg: number, toDegRaw: number): string => {
    const toDeg = toDegRaw < fromDeg ? toDegRaw + 360 : toDegRaw;
    const a1 = (fromDeg * Math.PI) / 180 + arcGap;
    const a2 = (toDeg * Math.PI) / 180 - arcGap;
    const sx = cx + Math.cos(a1) * R;
    const sy = cy + Math.sin(a1) * R;
    const ex = cx + Math.cos(a2) * R;
    const ey = cy + Math.sin(a2) * R;
    return `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
  };

  const markerId = 'cycle-steps-arrow';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arc} />
        </marker>
      </defs>

      {/* Arcs between consecutive nodes. */}
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % n];
        return (
          <path
            key={`arc-${i}`}
            d={arcPath(pos.angle, next.angle)}
            fill="none"
            stroke={arc}
            strokeWidth={2}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {/* Centre label (optional). */}
      {data.centreLabel ? (
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily={font}
          fontSize={14}
          fontWeight={700}
          fill={centreText}
        >
          {truncate(data.centreLabel, 16)}
        </text>
      ) : null}

      {/* Step nodes. */}
      {data.steps.map((step, i) => {
        const pos = positions[i];
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? stepFills[i];
        // Detail placement: push outward along the node's radial line so nodes
        // at 3 o'clock / 9 o'clock still have room for a detail label.
        const a = (pos.angle * Math.PI) / 180;
        const detailX = pos.x + Math.cos(a) * (nodeR + 18);
        const detailY = pos.y + Math.sin(a) * (nodeR + 18) + 3;
        return (
          <g key={nodeId} data-id={nodeId}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeR}
              fill={fill}
              stroke={palette.bg}
              strokeWidth={2}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontFamily={font}
              fontSize={labelFontSize}
              fontWeight={700}
              fill={labelText}
            >
              {truncate(step.label, labelTrunc)}
            </text>
            {step.detail ? (
              <text
                x={detailX}
                y={detailY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={detailFontSize}
                fill={detailText}
              >
                {truncate(step.detail, detailTrunc)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Thumbnail: dashed ring + 4 circle nodes + ellipsis suggesting "more nodes".
// Communicates "cycle, flexible count" without pinning to a specific number.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="20" r="16" fill="none" stroke="#4A9A8A" stroke-width="1.5" stroke-dasharray="3 2"/>
  <circle cx="60" cy="4" r="4" fill="#1B5B50"/>
  <circle cx="76" cy="20" r="4" fill="#2A7A6C"/>
  <circle cx="60" cy="36" r="4" fill="#4A9A8A"/>
  <circle cx="44" cy="20" r="4" fill="#7EBFB2"/>
  <text x="104" y="24" font-size="9" fill="#1B5B50" font-weight="700" text-anchor="middle">…</text>
</svg>`;

export const cycleStepsPreset: Preset<CycleStepsData> = {
  id: 'cycle-steps',
  name: 'Cycle',
  category: 'cycle',
  tags: ['cycle', 'loop', 'iteration', 'flexible'],
  description: 'Discrete circle nodes arranged in a clockwise cycle. 3 to 8 steps.',
  aiDescription:
    'Ring of 3–8 discrete circle nodes connected by clockwise curved arrows. Use for iterative loops such as PDCA (Plan-Do-Check-Act), continuous improvement cycles, governance reviews, or any repeating sequence of equal-weight phases that loops back on itself. Prefer "process-circular" when the emphasis is a continuous wedge-ring of sequential stages around a central hub rather than discrete nodes with a loop-back arrow. Do NOT use for one-off sequences where the steps do not genuinely repeat (onboarding, construction phase plans, one-time project timelines) — those should use flow-linear, timeline-horizontal, or process-stages-4phase instead. Pick a count between 3 and 8 based on the number of distinct phases in the source text.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: CycleStepsRender,
  editableFields: ['steps[].label', 'steps[].detail', 'centreLabel'],
  compatibleFamilies: ['cycle', 'process'],
};
