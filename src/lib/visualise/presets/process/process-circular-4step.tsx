// =============================================================================
// Preset: process-circular-4step
// Four pie-wedge segments arranged around a central hub label. Visually
// distinct from cycle-4step (which uses discrete circle nodes with
// feedback arrows): this preset emphasises a continuous ring of
// sequential stages, not a closed-loop cycle.
// Good for quarterly cadences, 4-phase programmes, or RIBA-style
// high-level lifecycles.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  centreLabel: z.string().max(18).optional(),
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(22),
        detail: z.string().max(40).optional(),
      }),
    )
    .length(4),
});

type ProcessCircular4StepData = z.infer<typeof dataSchema>;

const defaultData: ProcessCircular4StepData = {
  centreLabel: 'Programme',
  steps: [
    { label: 'Mobilise', detail: 'Set up welfare + plant' },
    { label: 'Enabling works', detail: 'Diversions + clearance' },
    { label: 'Construction', detail: 'Main build sequence' },
    { label: 'Handover', detail: 'Commission + demob' },
  ],
};

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

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessCircular4StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const centreFill = paletteColor(paletteId, 0);
  const centreText = paletteColor(paletteId, 5);
  const wedgeText = paletteColor(paletteId, 5);
  const detailText = paletteColor(paletteId, 2);
  const gapStroke = paletteColor(paletteId, 5);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = Math.min(width, height) * 0.42;
  const rInner = rOuter * 0.48;

  const n = data.steps.length;
  const segAngle = 360 / n;
  const gapDeg = 2;

  // Start wedge 0 at the top (centre at -90°)
  const startAngle = -90 - segAngle / 2;

  // Wedge fill indices — alternate to keep adjacent wedges distinguishable
  const fillIndex = (i: number): number => [0, 2, 3, 1][i % 4];

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
        const fill = customColors[nodeId] ?? paletteColor(paletteId, fillIndex(i));

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
              fontSize={Math.min(14, rOuter / 8)}
              fontWeight={700}
            >
              {step.label}
            </text>
            {step.detail ? (
              <text
                x={lx}
                y={ly + 14}
                textAnchor="middle"
                fill={detailText}
                fontFamily={font}
                fontSize={10}
              >
                {step.detail}
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

export const processCircular4StepPreset: Preset<ProcessCircular4StepData> = {
  id: 'process-circular-4step',
  name: 'Circular Process — 4 Stages',
  category: 'process',
  tags: ['process', 'circular', 'wheel', 'stages'],
  description: 'Four pie-wedge stages arranged around a central hub label.',
  aiDescription:
    'Use for a 4-stage programme, quarterly cadence, or high-level lifecycle where each stage is equal weight and proceeds around a ring, but the ring is not an explicit feedback loop. Prefer "cycle-4step" when the relationship is an explicit feedback loop (PDCA-style); prefer "process-stages-4phase" when the content is strategic phases rather than an operational cadence. Do NOT use for one-off 4-step sequences that do not repeat as a ring — use flow-linear-4step or timeline-horizontal-* instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 4 A 16 16 0 0 1 76 20 L 68 20 A 8 8 0 0 0 60 12 Z" fill="#1B5B50"/>
  <path d="M76 20 A 16 16 0 0 1 60 36 L 60 28 A 8 8 0 0 0 68 20 Z" fill="#4A9A8A"/>
  <path d="M60 36 A 16 16 0 0 1 44 20 L 52 20 A 8 8 0 0 0 60 28 Z" fill="#7EBFB2"/>
  <path d="M44 20 A 16 16 0 0 1 60 4 L 60 12 A 8 8 0 0 0 52 20 Z" fill="#2A7A6C"/>
  <circle cx="60" cy="20" r="7" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['centreLabel', 'steps[].label', 'steps[].detail'],
  compatibleFamilies: ['process', 'cycle'],
};
