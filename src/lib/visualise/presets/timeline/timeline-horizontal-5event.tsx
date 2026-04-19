// =============================================================================
// Preset: timeline-horizontal-5event
// Horizontal timeline with 5 evenly spaced events, alternating above/below.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import { SEQUENTIAL_LABEL_MAX, SEQUENTIAL_DETAIL_MAX } from '../common';

const dataSchema = z.object({
  events: z.array(z.object({
    label: z.string().min(1).max(SEQUENTIAL_LABEL_MAX),
    date: z.string().max(20).optional(),
    detail: z.string().max(SEQUENTIAL_DETAIL_MAX).optional(),
  })).length(5),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  events: [
    { label: 'Mobilisation', date: 'Week 1', detail: 'Compound set up' },
    { label: 'Groundworks', date: 'Week 4' },
    { label: 'MEICA install', date: 'Week 12' },
    { label: 'Commissioning', date: 'Week 20' },
    { label: 'Handover', date: 'Week 24' },
  ],
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const dotFills = gradientSequence(palette, data.events.length);
  const lineColor = palette.nodeStroke;
  const textColor = palette.nodeFill;
  const subTextColor = palette.nodeStroke;
  const font = settings.font ?? 'Inter, sans-serif';

  const padding = 40;
  const lineY = height / 2;
  const stepX = (width - padding * 2) / (data.events.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={padding} y1={lineY} x2={width - padding} y2={lineY} stroke={lineColor} strokeWidth={2} />
      {data.events.map((ev, i) => {
        const x = padding + stepX * i;
        const above = i % 2 === 0;
        const labelY = above ? lineY - 18 : lineY + 32;
        const detailY = above ? lineY - 34 : lineY + 48;
        const dateY = above ? lineY - 50 : lineY + 62;
        const nodeId = `event-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={x} cy={lineY} r={7} fill={dotFills[i]} stroke={palette.bg} strokeWidth={2} />
            <text x={x} y={labelY} textAnchor="middle" fontFamily={font} fontSize={12} fontWeight={600} fill={textColor}>
              {truncate(ev.label, 16)}
            </text>
            {ev.detail ? (
              <text x={x} y={detailY} textAnchor="middle" fontFamily={font} fontSize={10} fill={subTextColor}>
                {truncate(ev.detail, 22)}
              </text>
            ) : null}
            {ev.date ? (
              <text x={x} y={dateY} textAnchor="middle" fontFamily={font} fontSize={10} fontWeight={500} fill={palette.nodeStroke}>
                {truncate(ev.date, 16)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const timelineHorizontal5EventPreset: Preset<Data> = {
  id: 'timeline-horizontal-5event',
  name: 'Timeline — 5 Events',
  category: 'timeline',
  tags: ['timeline', 'chronology', 'milestones', 'schedule'],
  description: 'Five events plotted on a horizontal timeline.',
  aiDescription: 'Horizontal timeline with 5 evenly-spaced milestone events, alternating above/below the axis. Use for chronological sequences like project phases, handover milestones, or historical events. Each event can have an optional date and short detail.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="8" y1="20" x2="112" y2="20" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="16" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="40" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="64" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="88" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="112" cy="20" r="3" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['events[].label', 'events[].date', 'events[].detail'],
  compatibleFamilies: ['timeline'],
};
