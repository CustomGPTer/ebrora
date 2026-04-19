// =============================================================================
// Preset: timeline-horizontal
// Batch 4a-ii-c-ii — flexible-count horizontal timeline. Replaces
// timeline-horizontal-5event and timeline-horizontal-8event with a single
// preset whose render branches on data.events.length (3–12).
//
// Visual identity: evenly-spaced circular markers on a horizontal axis,
// with labels alternating above and below the line. Each event can carry
// an optional date and short detail.
//
// Calibration: count 5 reproduces timeline-horizontal-5event exactly;
// count 8 reproduces timeline-horizontal-8event exactly. Counts 3, 4, 6,
// 7, 9, 10, 11, 12 extrapolate monotonically — as the count rises, padding
// shrinks, dot radius shrinks, fonts shrink, truncation caps tighten, and
// the above/below offsets pull in closer to the axis.
//
// Count ceiling is 12 (not 10, like most other sequential flexible presets)
// because horizontal timelines handle density well: labels stagger above
// and below so adjacent columns never collide. Per the Batch 4 priority
// clarification, 12 is the natural ceiling for this family.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import { SEQUENTIAL_LABEL_MAX, SEQUENTIAL_DETAIL_MAX } from '../common';

const dataSchema = z.object({
  events: z
    .array(
      z.object({
        label: z.string().min(1).max(SEQUENTIAL_LABEL_MAX),
        date: z.string().max(20).optional(),
        detail: z.string().max(SEQUENTIAL_DETAIL_MAX).optional(),
      }),
    )
    .min(3)
    .max(12),
});

type TimelineHorizontalData = z.infer<typeof dataSchema>;

const defaultData: TimelineHorizontalData = {
  events: [
    { label: 'Mobilisation', date: 'Week 1', detail: 'Compound set up' },
    { label: 'Groundworks', date: 'Week 4' },
    { label: 'MEICA install', date: 'Week 12' },
    { label: 'Commissioning', date: 'Week 20' },
    { label: 'Handover', date: 'Week 24' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// Values at count 5 match timeline-horizontal-5event (padding 40, dot 7,
// label font 12 / trunc 16, detail font 10 / trunc 22, date font 10 /
// trunc 16, offsets 18/32/34/48/50/62).
// Values at count 8 match timeline-horizontal-8event (padding 30, dot 6,
// label font 11 / trunc 12, detail font 9 / trunc 16, date font 9 /
// trunc 10, offsets 14/26/28/40/42/54).
// All other counts are interpolated/extrapolated from those anchors.

interface Layout {
  padding: number;
  dotR: number;
  labelFont: number;
  labelTrunc: number;
  detailFont: number;
  detailTrunc: number;
  dateFont: number;
  dateTrunc: number;
  /** Absolute vertical distance from the axis line to the label baseline
   *  when the event is rendered ABOVE the line. */
  labelAbove: number;
  /** Same distance when the event is rendered BELOW the line. Slightly
   *  larger than `labelAbove` because SVG text baselines sit at the top
   *  of descender — this asymmetry keeps the visible text-edge-to-line
   *  gap the same above and below. */
  labelBelow: number;
  detailAbove: number;
  detailBelow: number;
  dateAbove: number;
  dateBelow: number;
}

const LAYOUT: Record<number, Layout> = {
  3:  { padding: 48, dotR: 8,   labelFont: 13, labelTrunc: 18, detailFont: 11, detailTrunc: 25, dateFont: 11, dateTrunc: 16, labelAbove: 20, labelBelow: 34, detailAbove: 36, detailBelow: 50, dateAbove: 52, dateBelow: 64 },
  4:  { padding: 44, dotR: 7.5, labelFont: 13, labelTrunc: 17, detailFont: 10, detailTrunc: 24, dateFont: 10, dateTrunc: 16, labelAbove: 19, labelBelow: 33, detailAbove: 35, detailBelow: 49, dateAbove: 51, dateBelow: 63 },
  5:  { padding: 40, dotR: 7,   labelFont: 12, labelTrunc: 16, detailFont: 10, detailTrunc: 22, dateFont: 10, dateTrunc: 16, labelAbove: 18, labelBelow: 32, detailAbove: 34, detailBelow: 48, dateAbove: 50, dateBelow: 62 },
  6:  { padding: 36, dotR: 7,   labelFont: 12, labelTrunc: 14, detailFont: 10, detailTrunc: 20, dateFont: 10, dateTrunc: 14, labelAbove: 17, labelBelow: 30, detailAbove: 32, detailBelow: 46, dateAbove: 47, dateBelow: 59 },
  7:  { padding: 33, dotR: 6.5, labelFont: 11, labelTrunc: 13, detailFont: 10, detailTrunc: 18, dateFont: 9,  dateTrunc: 12, labelAbove: 15, labelBelow: 28, detailAbove: 30, detailBelow: 43, dateAbove: 45, dateBelow: 57 },
  8:  { padding: 30, dotR: 6,   labelFont: 11, labelTrunc: 12, detailFont: 9,  detailTrunc: 16, dateFont: 9,  dateTrunc: 10, labelAbove: 14, labelBelow: 26, detailAbove: 28, detailBelow: 40, dateAbove: 42, dateBelow: 54 },
  9:  { padding: 28, dotR: 6,   labelFont: 10, labelTrunc: 11, detailFont: 9,  detailTrunc: 14, dateFont: 9,  dateTrunc: 10, labelAbove: 13, labelBelow: 24, detailAbove: 26, detailBelow: 37, dateAbove: 39, dateBelow: 51 },
  10: { padding: 26, dotR: 5.5, labelFont: 10, labelTrunc: 10, detailFont: 8,  detailTrunc: 12, dateFont: 8,  dateTrunc: 9,  labelAbove: 12, labelBelow: 23, detailAbove: 25, detailBelow: 35, dateAbove: 37, dateBelow: 49 },
  11: { padding: 24, dotR: 5,   labelFont: 10, labelTrunc: 9,  detailFont: 8,  detailTrunc: 11, dateFont: 8,  dateTrunc: 9,  labelAbove: 12, labelBelow: 22, detailAbove: 24, detailBelow: 34, dateAbove: 36, dateBelow: 48 },
  12: { padding: 22, dotR: 5,   labelFont: 9,  labelTrunc: 8,  detailFont: 8,  detailTrunc: 10, dateFont: 8,  dateTrunc: 8,  labelAbove: 11, labelBelow: 21, detailAbove: 23, detailBelow: 33, dateAbove: 35, dateBelow: 47 },
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function TimelineHorizontalRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<TimelineHorizontalData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const font = settings.font ?? 'Inter, sans-serif';
  const n = data.events.length;
  const dotFills = gradientSequence(palette, n);
  const lineColor = palette.nodeStroke;
  const textColor = palette.nodeFill;
  const subTextColor = palette.nodeStroke;
  const dotStroke = palette.bg;

  const layout = LAYOUT[n] ?? LAYOUT[12];
  const {
    padding, dotR, labelFont, labelTrunc, detailFont, detailTrunc, dateFont, dateTrunc,
    labelAbove, labelBelow, detailAbove, detailBelow, dateAbove, dateBelow,
  } = layout;

  const lineY = height / 2;
  const stepX = n > 1 ? (width - padding * 2) / (n - 1) : 0;

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
        const labelY = above ? lineY - labelAbove : lineY + labelBelow;
        const detailY = above ? lineY - detailAbove : lineY + detailBelow;
        const dateY = above ? lineY - dateAbove : lineY + dateBelow;
        const nodeId = `event-${i}`;
        const fill = customColors[nodeId] ?? dotFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={x} cy={lineY} r={dotR} fill={fill} stroke={dotStroke} strokeWidth={2} />
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fontFamily={font}
              fontSize={labelFont}
              fontWeight={600}
              fill={textColor}
            >
              {truncate(ev.label, labelTrunc)}
            </text>
            {ev.detail ? (
              <text
                x={x}
                y={detailY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={detailFont}
                fill={subTextColor}
              >
                {truncate(ev.detail, detailTrunc)}
              </text>
            ) : null}
            {ev.date ? (
              <text
                x={x}
                y={dateY}
                textAnchor="middle"
                fontFamily={font}
                fontSize={dateFont}
                fontWeight={500}
                fill={palette.nodeStroke}
              >
                {truncate(ev.date, dateTrunc)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Thumbnail: horizontal line + 5 dots + ellipsis + trailing faded dot.
// Communicates "horizontal timeline, flexible count" without pinning to a
// specific count.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="8" y1="20" x2="114" y2="20" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="14" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="32" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="50" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="68" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="86" cy="20" r="3" fill="#1B5B50"/>
  <text   x="100" y="24" font-size="8" fill="#1B5B50" font-weight="700" text-anchor="middle">…</text>
  <circle cx="111" cy="20" r="3" fill="#1B5B50" opacity="0.4"/>
</svg>`;

export const timelineHorizontalPreset: Preset<TimelineHorizontalData> = {
  id: 'timeline-horizontal',
  name: 'Horizontal Timeline',
  category: 'timeline',
  tags: ['timeline', 'chronology', 'milestones', 'schedule', 'flexible'],
  description: 'Events plotted on a horizontal timeline with alternating labels. 3 to 12 events.',
  aiDescription:
    'Horizontal timeline with 3–12 evenly-spaced events, each with a dot marker and labels alternating above / below the axis. Each event can have an optional date and short detail. Use for chronological sequences: project phases, handover milestones, historical events, programme schedules, release timelines. Prefer this over flow-linear when the events are anchored to dates or specific moments in time; prefer "timeline-milestones" when only 3–6 flag-worthy waypoints matter rather than a continuous event list; prefer "timeline-gantt-lite" when task durations matter. Pick a count between 3 and 12 based on the number of distinct events the source text describes — do not pad or truncate to fit a specific number.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: TimelineHorizontalRender,
  editableFields: ['events[].label', 'events[].date', 'events[].detail'],
  compatibleFamilies: ['timeline'],
};
