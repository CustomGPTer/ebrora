// =============================================================================
// Preset: cycle-4step
// 4 nodes arranged around a circle, connected by clockwise arrows.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  steps: z.array(z.object({
    label: z.string().min(1).max(32),
    detail: z.string().max(60).optional(),
  })).length(4),
  centreLabel: z.string().max(24).optional(),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  steps: [
    { label: 'Plan', detail: 'Set objectives' },
    { label: 'Do', detail: 'Carry out work' },
    { label: 'Check', detail: 'Measure results' },
    { label: 'Act', detail: 'Adjust and improve' },
  ],
  centreLabel: 'PDCA',
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const stepFills = gradientSequence(palette, data.steps.length);
  const arc = palette.nodeStroke;
  const font = settings.font ?? 'Inter, sans-serif';

  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.36;
  const nodeR = Math.min(46, R * 0.42);

  const positions = [
    { angle: -90, x: cx, y: cy - R },
    { angle: 0, x: cx + R, y: cy },
    { angle: 90, x: cx, y: cy + R },
    { angle: 180, x: cx - R, y: cy },
  ];

  const arcPath = (from: number, to: number) => {
    const a1 = (from * Math.PI) / 180;
    const a2 = (to * Math.PI) / 180;
    const gap = 0.28;
    const r = R;
    const sx = cx + Math.cos(a1 + gap) * r;
    const sy = cy + Math.sin(a1 + gap) * r;
    const ex = cx + Math.cos(a2 - gap) * r;
    const ey = cy + Math.sin(a2 - gap) * r;
    return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="cycle-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arc} />
        </marker>
      </defs>

      {positions.map((pos, i) => {
        const nextAngle = positions[(i + 1) % positions.length].angle;
        return (
          <path key={`arc-${i}`} d={arcPath(pos.angle, nextAngle + (nextAngle < pos.angle ? 360 : 0))} fill="none" stroke={arc} strokeWidth={2} markerEnd="url(#cycle-arrow)" />
        );
      })}

      {data.centreLabel ? (
        <text x={cx} y={cy + 4} textAnchor="middle" fontFamily={font} fontSize={14} fontWeight={700} fill={palette.nodeFill}>
          {truncate(data.centreLabel, 14)}
        </text>
      ) : null}

      {data.steps.map((step, i) => {
        const pos = positions[i];
        const fill = stepFills[i];
        const nodeId = `step-${i}`;
        const labelY = pos.y + 4;
        const detailY = pos.y + nodeR + 14;
        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={pos.x} cy={pos.y} r={nodeR} fill={fill} stroke={palette.bg} strokeWidth={2} />
            <text x={pos.x} y={labelY} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={700} fill={palette.text}>
              {truncate(step.label, 10)}
            </text>
            {step.detail ? (
              <text x={pos.x} y={detailY} textAnchor="middle" fontFamily={font} fontSize={10} fill={palette.nodeFill}>
                {truncate(step.detail, 20)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const cycle4StepPreset: Preset<Data> = {
  id: 'cycle-4step',
  name: 'Cycle — 4 Steps',
  category: 'cycle',
  tags: ['cycle', 'loop', 'iteration', 'pdca'],
  description: 'Four steps arranged in a clockwise circular cycle.',
  aiDescription: 'Circular cycle with 4 nodes and curved arrows between them. Use for iterative loops such as PDCA (Plan-Do-Check-Act), continuous improvement cycles, or any repeating 4-step process. Do NOT use for one-off sequences where the steps do not genuinely repeat (e.g. an onboarding checklist, a construction phase plan, or a one-time project timeline) — those should use flow-linear-4step, timeline-horizontal-*, or process-stages-4phase instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="20" r="16" fill="none" stroke="#4A9A8A" stroke-width="1.5" stroke-dasharray="3 2"/>
  <circle cx="60" cy="4" r="4" fill="#1B5B50"/>
  <circle cx="76" cy="20" r="4" fill="#2A7A6C"/>
  <circle cx="60" cy="36" r="4" fill="#4A9A8A"/>
  <circle cx="44" cy="20" r="4" fill="#7EBFB2"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail', 'centreLabel'],
  compatibleFamilies: ['cycle', 'process'],
};
