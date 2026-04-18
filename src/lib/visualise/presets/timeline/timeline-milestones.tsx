// =============================================================================
// Preset: timeline-milestones
// Horizontal timeline with 3–6 flagged milestones. Each milestone has a
// flag marker rising above the axis + a prominent label and subtitle
// below. Denser and more celebratory than timeline-horizontal-5event —
// use for significant programme markers rather than every event.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const milestoneSchema = z.object({
  title: z.string().min(1).max(24),
  subtitle: z.string().max(40).optional(),
  when: z.string().max(16).optional(),
});

const dataSchema = z.object({
  milestones: z.array(milestoneSchema).min(3).max(6),
});

type TimelineMilestonesData = z.infer<typeof dataSchema>;

const defaultData: TimelineMilestonesData = {
  milestones: [
    { title: 'Kick-off', when: 'Month 1', subtitle: 'Team assembled, scope agreed' },
    { title: 'Prototype', when: 'Month 3', subtitle: 'First working version' },
    { title: 'Pilot', when: 'Month 5', subtitle: 'Limited release for feedback' },
    { title: 'Launch', when: 'Month 8', subtitle: 'Full rollout' },
    { title: 'Review', when: 'Month 12', subtitle: 'Impact assessment' },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<TimelineMilestonesData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const flagFills = gradientSequence(palette, data.milestones.length);
  const axisColor = palette.nodeStroke;
  const flagText = palette.text;
  const subtitleText = palette.nodeFill;
  const whenText = palette.nodeStroke;

  const pad = 30;
  const axisY = height * 0.55;
  const n = data.milestones.length;
  const stepX = (width - pad * 2) / (n - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <line x1={pad} y1={axisY} x2={width - pad} y2={axisY} stroke={axisColor} strokeWidth={2} />

      {data.milestones.map((m, i) => {
        const x = pad + stepX * i;
        const flagW = Math.min(92, (width - pad * 2) / n - 8);
        const flagH = 28;
        const flagY = axisY - 54;
        const nodeId = `milestone-${i}`;
        const fill = customColors[nodeId] ?? flagFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Flag pole */}
            <line x1={x} y1={axisY} x2={x} y2={flagY + flagH} stroke={axisColor} strokeWidth={1.5} />

            {/* Flag body */}
            <path
              d={`M ${x - flagW / 2} ${flagY} L ${x + flagW / 2 - 6} ${flagY} L ${x + flagW / 2} ${flagY + flagH / 2} L ${x + flagW / 2 - 6} ${flagY + flagH} L ${x - flagW / 2} ${flagY + flagH} Z`}
              fill={fill}
            />
            <text
              x={x - flagW / 2 + 6}
              y={flagY + flagH / 2 + 4}
              textAnchor="start"
              fill={flagText}
              fontFamily={font}
              fontSize={11}
              fontWeight={700}
            >
              {truncate(m.title, 14)}
            </text>

            {/* Axis dot */}
            <circle cx={x} cy={axisY} r={5} fill={flagFills[i]} stroke={palette.bg} strokeWidth={1.5} />

            {/* When (below axis) */}
            {m.when ? (
              <text
                x={x}
                y={axisY + 22}
                textAnchor="middle"
                fill={whenText}
                fontFamily={font}
                fontSize={10}
                fontWeight={700}
              >
                {truncate(m.when, 12)}
              </text>
            ) : null}

            {/* Subtitle */}
            {m.subtitle ? (
              <text
                x={x}
                y={axisY + (m.when ? 36 : 22)}
                textAnchor="middle"
                fill={subtitleText}
                fontFamily={font}
                fontSize={10}
              >
                {truncate(m.subtitle, 26)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const timelineMilestonesPreset: Preset<TimelineMilestonesData> = {
  id: 'timeline-milestones',
  name: 'Timeline — Milestones',
  category: 'timeline',
  tags: ['timeline', 'milestones', 'programme', 'flagged'],
  description: '3–6 prominent milestones with flag markers above a horizontal axis.',
  aiDescription:
    'Use when the text describes a small number (3–6) of significant, flag-worthy milestones — major programme waypoints, key decisions, or high-level release markers. Visually heavier than timeline-horizontal-5event: each milestone gets a flag callout to emphasise its importance. Prefer "timeline-horizontal-5event" or "timeline-horizontal-8event" for dense event lists where each event is equal weight.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="28" x2="110" y2="28" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="20" cy="28" r="2.5" fill="#1B5B50"/>
  <circle cx="45" cy="28" r="2.5" fill="#1B5B50"/>
  <circle cx="72" cy="28" r="2.5" fill="#1B5B50"/>
  <circle cx="100" cy="28" r="2.5" fill="#1B5B50"/>
  <path d="M8 4 L30 4 L33 10 L30 16 L8 16 Z" fill="#1B5B50"/>
  <path d="M33 4 L55 4 L58 10 L55 16 L33 16 Z" fill="#1B5B50"/>
  <path d="M60 4 L82 4 L85 10 L82 16 L60 16 Z" fill="#1B5B50"/>
  <path d="M88 4 L110 4 L113 10 L110 16 L88 16 Z" fill="#1B5B50"/>
  <line x1="20" y1="16" x2="20" y2="28" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="45" y1="16" x2="45" y2="28" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="72" y1="16" x2="72" y2="28" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="100" y1="16" x2="100" y2="28" stroke="#4A9A8A" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['milestones[].title', 'milestones[].subtitle', 'milestones[].when'],
  compatibleFamilies: ['timeline'],
};
