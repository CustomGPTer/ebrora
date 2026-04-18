// =============================================================================
// Preset: cycle-6step
// 6 nodes arranged around a circle, connected by clockwise curved arrows.
// Same visual family as cycle-4step — identical arc algorithm, just 6 nodes
// at 60° intervals starting at -90°. Use when the iteration has 6 distinct
// phases that loop back round (e.g. a governance cycle with more stages than
// plain PDCA).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(28),
        detail: z.string().max(50).optional(),
      }),
    )
    .length(6),
  centreLabel: z.string().max(20).optional(),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  steps: [
    { label: 'Step one', detail: 'Short description' },
    { label: 'Step two', detail: 'Short description' },
    { label: 'Step three', detail: 'Short description' },
    { label: 'Step four', detail: 'Short description' },
    { label: 'Step five', detail: 'Short description' },
    { label: 'Step six', detail: 'Short description' },
  ],
  centreLabel: 'Cycle',
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const arc = paletteColor(paletteId, 2);
  const centreText = paletteColor(paletteId, 0);
  const nodeStroke = paletteColor(paletteId, 5);
  const labelText = paletteColor(paletteId, 5);
  const detailText = paletteColor(paletteId, 0);

  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.36;
  const nodeR = Math.min(42, R * 0.34);

  const n = 6;
  const positions = Array.from({ length: n }, (_, i) => {
    const angleDeg = -90 + (360 / n) * i;
    const a = (angleDeg * Math.PI) / 180;
    return { angle: angleDeg, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const arcPath = (fromDeg: number, toDegRaw: number): string => {
    const toDeg = toDegRaw < fromDeg ? toDegRaw + 360 : toDegRaw;
    const gap = 0.32; // radians — leave breathing room at each node
    const a1 = (fromDeg * Math.PI) / 180 + gap;
    const a2 = (toDeg * Math.PI) / 180 - gap;
    const sx = cx + Math.cos(a1) * R;
    const sy = cy + Math.sin(a1) * R;
    const ex = cx + Math.cos(a2) * R;
    const ey = cy + Math.sin(a2) * R;
    return `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="cycle6-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arc} />
        </marker>
      </defs>

      {/* Arcs between consecutive nodes */}
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % n];
        return (
          <path
            key={`arc-${i}`}
            d={arcPath(pos.angle, next.angle)}
            fill="none"
            stroke={arc}
            strokeWidth={2}
            markerEnd="url(#cycle6-arrow)"
          />
        );
      })}

      {/* Centre label (optional) */}
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

      {/* Step nodes */}
      {data.steps.map((step, i) => {
        const pos = positions[i];
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? paletteColor(paletteId, i % 6);
        const labelY = pos.y + 4;
        // Detail placement: push outward along the node's radial line.
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
              stroke={nodeStroke}
              strokeWidth={2}
            />
            <text
              x={pos.x}
              y={labelY}
              textAnchor="middle"
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
              fill={labelText}
            >
              {truncate(step.label, 12)}
            </text>
            {step.detail ? (
              <text
                x={detailX}
                y={detailY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={10}
                fill={detailText}
              >
                {truncate(step.detail, 22)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const cycle6StepPreset: Preset<Data> = {
  id: 'cycle-6step',
  name: 'Cycle — 6 Steps',
  category: 'cycle',
  tags: ['cycle', 'loop', 'iteration', 'six-phase'],
  description: 'Six steps arranged in a clockwise circular cycle.',
  aiDescription:
    'Six nodes arranged around a circle with clockwise curved arrows between them. Use for iterative cycles with exactly 6 distinct phases — e.g. a governance loop, a review cycle, a six-stage improvement model. Prefer "cycle-4step" for classic 4-phase iterations like Plan-Do-Check-Act; prefer "process-circular-6step" when the shape is a sequenced process rather than a repeating loop.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="20" r="16" fill="none" stroke="#4A9A8A" stroke-width="1.5" stroke-dasharray="3 2"/>
  <circle cx="60" cy="4" r="3.5" fill="#1B5B50"/>
  <circle cx="74" cy="12" r="3.5" fill="#2A7A6C"/>
  <circle cx="74" cy="28" r="3.5" fill="#4A9A8A"/>
  <circle cx="60" cy="36" r="3.5" fill="#7EBFB2"/>
  <circle cx="46" cy="28" r="3.5" fill="#2A7A6C"/>
  <circle cx="46" cy="12" r="3.5" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail', 'centreLabel'],
  compatibleFamilies: ['cycle', 'process'],
};
