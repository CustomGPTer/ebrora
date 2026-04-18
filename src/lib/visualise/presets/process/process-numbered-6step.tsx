// =============================================================================
// Preset: process-numbered-6step
// Six numbered steps laid out in a 3×2 grid (top-left to bottom-right,
// boustrophedon). Each step has a prominent number badge, a label, and
// an optional short detail. Good for method-statement steps and
// inductions where the number sequence matters visually.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(32),
        detail: z.string().max(80).optional(),
      }),
    )
    .length(6),
});

type ProcessNumbered6StepData = z.infer<typeof dataSchema>;

const defaultData: ProcessNumbered6StepData = {
  steps: [
    { label: 'Prepare', detail: 'Gather inputs and brief the team' },
    { label: 'Check conditions', detail: 'Confirm environment is ready' },
    { label: 'Verify authorisation', detail: 'Make sure approvals are in place' },
    { label: 'Execute', detail: 'Carry out the work as planned' },
    { label: 'Record outcome', detail: 'Capture evidence and results' },
    { label: 'Close out', detail: 'Tidy up and hand back' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessNumbered6StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const badgeFills = gradientSequence(palette, data.steps.length);
  const badgeText = palette.text;
  const boxFill = palette.bg;
  const labelFill = palette.nodeFill;
  const detailFill = palette.nodeStroke;
  const arrowColour = palette.nodeStroke;

  const pad = 14;
  const cols = 3;
  const rows = 2;
  const gap = 12;
  const cellW = (width - pad * 2 - gap * (cols - 1)) / cols;
  const cellH = (height - pad * 2 - gap * (rows - 1)) / rows;

  // Boustrophedon order: top row left→right, bottom row right→left
  const positions: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const effectiveC = r % 2 === 0 ? c : cols - 1 - c;
      positions.push({
        x: pad + effectiveC * (cellW + gap),
        y: pad + r * (cellH + gap),
      });
    }
  }

  const badgeR = Math.min(16, cellH * 0.22);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="process-numbered-6step-arrow"
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

      {/* Arrows between cells (in visit order) */}
      {positions.slice(0, -1).map((p, i) => {
        const next = positions[i + 1];
        // Only draw arrows between adjacent cells in reading order —
        // same row: horizontal; row-break: vertical.
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
              markerEnd="url(#process-numbered-6step-arrow)"
            />
          );
        }
        // Vertical row-break — arrow from the trailing edge of p down into next
        return (
          <line
            key={`arr-${i}`}
            x1={p.x + cellW / 2}
            y1={p.y + cellH + 1}
            x2={p.x + cellW / 2}
            y2={next.y - 2}
            stroke={arrowColour}
            strokeWidth={2}
            markerEnd="url(#process-numbered-6step-arrow)"
          />
        );
      })}

      {data.steps.map((step, i) => {
        const { x, y } = positions[i];
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? boxFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={y} width={cellW} height={cellH} rx={8} ry={8} fill={fill} />
            {/* Number badge — centred at top */}
            <circle cx={x + cellW / 2} cy={y + badgeR + 4} r={badgeR} fill={badgeFills[i]} />
            <text
              x={x + cellW / 2}
              y={y + badgeR + 4 + badgeR / 2.3}
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
              fontSize={Math.min(14, cellW / 10)}
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
                fontSize={11}
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

export const processNumbered6StepPreset: Preset<ProcessNumbered6StepData> = {
  id: 'process-numbered-6step',
  name: 'Numbered Process — 6 Steps',
  category: 'process',
  tags: ['process', 'sequence', 'numbered', 'grid'],
  description: 'Six numbered process steps laid out in a 3×2 reading-order grid.',
  aiDescription:
    'Use when the text describes a process with exactly six ordered steps where the step number matters (e.g. "Step 1:", "Step 2:"). Suits operational procedures, checklists, inductions, or walkthroughs where each stage has a clear number. Prefer "flow-linear-5step" for five-or-fewer sequential steps without prominent numbering. Prefer a 4-phase lifecycle preset for strategic phases rather than operational steps.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="3" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="42" y="3" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="80" y="3" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="4" y="22" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="42" y="22" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <rect x="80" y="22" width="34" height="15" rx="2" fill="#B5DAD2"/>
  <circle cx="21" cy="8" r="3" fill="#1B5B50"/>
  <circle cx="59" cy="8" r="3" fill="#1B5B50"/>
  <circle cx="97" cy="8" r="3" fill="#1B5B50"/>
  <circle cx="97" cy="27" r="3" fill="#1B5B50"/>
  <circle cx="59" cy="27" r="3" fill="#1B5B50"/>
  <circle cx="21" cy="27" r="3" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['process', 'flow'],
};
