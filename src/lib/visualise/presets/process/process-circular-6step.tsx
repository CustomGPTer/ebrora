// =============================================================================
// Preset: process-circular-6step
// Six pie-wedge segments around a central hub. Same visual family as
// process-circular-4step but denser — suitable for 6-stage rollouts,
// six-month cadences, or any sequence where the author has described
// six equal-weight stages.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  centreLabel: z.string().max(14).optional(),
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(20),
        detail: z.string().max(28).optional(),
      }),
    )
    .length(6),
});

type ProcessCircular6StepData = z.infer<typeof dataSchema>;

const defaultData: ProcessCircular6StepData = {
  centreLabel: 'Cycle',
  steps: [
    { label: 'Define', detail: 'Scope and goals' },
    { label: 'Plan', detail: 'Resources and timing' },
    { label: 'Build', detail: 'Produce the work' },
    { label: 'Test', detail: 'Verify against spec' },
    { label: 'Deliver', detail: 'Release to stakeholders' },
    { label: 'Review', detail: 'Feedback and lessons' },
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
}: PresetRenderProps<ProcessCircular6StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const wedgeFills = gradientSequence(palette, data.steps.length);
  const centreFill = palette.accent;
  const centreText = palette.accentText;
  const wedgeText = palette.text;
  const detailText = palette.text;
  const gapStroke = palette.bg;

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = Math.min(width, height) * 0.44;
  const rInner = rOuter * 0.46;

  const n = data.steps.length;
  const segAngle = 360 / n;
  const gapDeg = 1.5;
  const startAngle = -90 - segAngle / 2;

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
              fontSize={Math.min(12, rOuter / 10)}
              fontWeight={700}
            >
              {step.label}
            </text>
            {step.detail ? (
              <text
                x={lx}
                y={ly + 12}
                textAnchor="middle"
                fill={detailText}
                fontFamily={font}
                fontSize={9}
                opacity={0.85}
              >
                {step.detail}
              </text>
            ) : null}
          </g>
        );
      })}

      <g data-id="centre">
        <circle cx={cx} cy={cy} r={rInner - 4} fill={centreFill} />
        {data.centreLabel ? (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={centreText}
            fontFamily={font}
            fontSize={Math.min(13, rInner / 3)}
            fontWeight={700}
          >
            {data.centreLabel}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

export const processCircular6StepPreset: Preset<ProcessCircular6StepData> = {
  id: 'process-circular-6step',
  name: 'Circular Process — 6 Stages',
  category: 'process',
  tags: ['process', 'circular', 'wheel', 'stages'],
  description: 'Six pie-wedge stages arranged around a central hub label.',
  aiDescription:
    'Use for a 6-stage rollout, half-year cadence, or process wheel where each stage is equal weight and proceeds around a ring. Prefer "process-circular-4step" for 4 stages. Prefer a PDCA-style preset when the content is an explicit feedback loop between four phases. Do NOT use for one-off 6-step sequences that do not repeat as a ring — use flow-linear-5step, process-numbered-6step, or timeline-horizontal-* instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="20" r="14" fill="#1B5B50"/>
  <path d="M60 6 A14 14 0 0 1 72 13 L 66 16 A8 8 0 0 0 60 12 Z" fill="#1B5B50"/>
  <path d="M72 13 A14 14 0 0 1 72 27 L 66 24 A8 8 0 0 0 66 16 Z" fill="#4A9A8A"/>
  <path d="M72 27 A14 14 0 0 1 60 34 L 60 28 A8 8 0 0 0 66 24 Z" fill="#2A7A6C"/>
  <path d="M60 34 A14 14 0 0 1 48 27 L 54 24 A8 8 0 0 0 60 28 Z" fill="#7EBFB2"/>
  <path d="M48 27 A14 14 0 0 1 48 13 L 54 16 A8 8 0 0 0 54 24 Z" fill="#1B5B50"/>
  <path d="M48 13 A14 14 0 0 1 60 6 L 60 12 A8 8 0 0 0 54 16 Z" fill="#4A9A8A"/>
  <circle cx="60" cy="20" r="7" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['centreLabel', 'steps[].label', 'steps[].detail'],
  compatibleFamilies: ['process', 'cycle'],
};
