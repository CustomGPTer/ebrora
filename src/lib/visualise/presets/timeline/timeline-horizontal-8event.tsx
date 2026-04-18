// =============================================================================
// Preset: timeline-horizontal-8event
// Horizontal timeline with 8 evenly-spaced events, alternating above/below
// the axis. Denser variant of timeline-horizontal-5event — tighter labels
// to fit 8 markers across the same canvas width.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  events: z
    .array(
      z.object({
        label: z.string().min(1).max(20),
        date: z.string().max(16).optional(),
        detail: z.string().max(40).optional(),
      }),
    )
    .length(8),
});

type TimelineHorizontal8EventData = z.infer<typeof dataSchema>;

const defaultData: TimelineHorizontal8EventData = {
  events: [
    { label: 'Kick-off', date: 'Jan' },
    { label: 'Design', date: 'Feb' },
    { label: 'Review', date: 'Mar' },
    { label: 'Build', date: 'May' },
    { label: 'Test', date: 'Jul' },
    { label: 'Launch', date: 'Sep' },
    { label: 'Embed', date: 'Oct' },
    { label: 'Close', date: 'Dec' },
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
}: PresetRenderProps<TimelineHorizontal8EventData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const dotFills = gradientSequence(palette, data.events.length);
  const lineColor = palette.nodeStroke;
  const textColor = palette.nodeFill;
  const subTextColor = palette.nodeStroke;
  const dateColor = palette.nodeStroke;
  const dotStroke = palette.bg;

  const padding = 30;
  const lineY = height / 2;
  const stepX = (width - padding * 2) / (data.events.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <line x1={padding} y1={lineY} x2={width - padding} y2={lineY} stroke={lineColor} strokeWidth={2} />

      {data.events.map((ev, i) => {
        const x = padding + stepX * i;
        const above = i % 2 === 0;
        const labelY = above ? lineY - 14 : lineY + 26;
        const detailY = above ? lineY - 28 : lineY + 40;
        const dateY = above ? lineY - 42 : lineY + 54;
        const nodeId = `event-${i}`;
        const fill = customColors[nodeId] ?? dotFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={x} cy={lineY} r={6} fill={fill} stroke={dotStroke} strokeWidth={2} />
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fontFamily={font}
              fontSize={11}
              fontWeight={600}
              fill={textColor}
            >
              {truncate(ev.label, 12)}
            </text>
            {ev.detail ? (
              <text
                x={x}
                y={detailY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={9}
                fill={subTextColor}
              >
                {truncate(ev.detail, 16)}
              </text>
            ) : null}
            {ev.date ? (
              <text
                x={x}
                y={dateY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={9}
                fontWeight={500}
                fill={dateColor}
              >
                {truncate(ev.date, 10)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const timelineHorizontal8EventPreset: Preset<TimelineHorizontal8EventData> = {
  id: 'timeline-horizontal-8event',
  name: 'Timeline — 8 Events',
  category: 'timeline',
  tags: ['timeline', 'chronology', 'milestones', 'schedule', 'dense'],
  description: 'Eight events plotted on a horizontal timeline with alternating labels.',
  aiDescription:
    'Dense horizontal timeline with 8 evenly-spaced events, alternating above/below the axis. Use for longer chronologies with many milestones — annual programmes, multi-phase schedules, historical sequences with several waypoints. Prefer "timeline-horizontal-5event" for 5 or fewer events where each can carry more detail.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="6" y1="20" x2="114" y2="20" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="10" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="24" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="39" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="53" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="67" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="81" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="96" cy="20" r="2.5" fill="#1B5B50"/>
  <circle cx="110" cy="20" r="2.5" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['events[].label', 'events[].date', 'events[].detail'],
  compatibleFamilies: ['timeline'],
};
