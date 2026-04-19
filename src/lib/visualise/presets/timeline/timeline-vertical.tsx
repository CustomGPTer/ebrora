// =============================================================================
// Preset: timeline-vertical
// Batch 4a-ii-c-ii — flexible-count vertical timeline. Replaces
// timeline-vertical-5event with a single preset whose render branches on
// data.events.length (3–10).
//
// Visual identity: events down a central axis. Each event has a circular
// axis marker on the left and a rounded card on the right containing
// label (top-left), optional date pill (top-right), and optional detail
// (second line). Suited to tall-aspect embeds, narrative timelines, and
// reports where each event warrants more descriptive text than a
// horizontal timeline can carry.
//
// Calibration: count 5 reproduces timeline-vertical-5event exactly
// (markerR 8, fontSize 13/11/10, truncs 22/60/14, datePillW 50, card
// internal label+20 / detail+40). Counts 3, 4, 6–10 extrapolate
// monotonically — as count rises, the row height shrinks so card fonts,
// marker radius, and the internal label / detail offsets tighten too.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence, lighten } from '../../palettes';
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
    .max(10),
});

type TimelineVerticalData = z.infer<typeof dataSchema>;

const defaultData: TimelineVerticalData = {
  events: [
    { label: 'Planning', date: 'Q1', detail: 'Scope, resources, and outline timeline' },
    { label: 'Mobilisation', date: 'Q1', detail: 'Setup and onboarding of the team' },
    { label: 'Execution', date: 'Q2–Q3', detail: 'Main delivery phase' },
    { label: 'Verification', date: 'Q4', detail: 'Testing and stakeholder sign-off' },
    { label: 'Handover', date: 'Q4', detail: 'Transition to operations' },
  ],
};

// ── Layout table ─────────────────────────────────────────────────────────────
// labelFont / detailFont / dateFont: font sizes for the three text lines.
// labelTrunc / detailTrunc / dateTrunc: rendered char caps (schema allows 60
//   label / 120 detail — trunc here is per-count based on card width).
// markerR: axis marker circle radius.
// datePillW: date pill width (the right-side badge on the card).
// labelY / detailY: vertical offset from the card's top edge for label /
//   detail text baselines. Both must scale DOWN at higher counts so text
//   stays inside the card's shrinking height (card height = rowH - 8).

interface Layout {
  labelFont: number;
  detailFont: number;
  dateFont: number;
  labelTrunc: number;
  detailTrunc: number;
  dateTrunc: number;
  markerR: number;
  datePillW: number;
  labelY: number;
  detailY: number;
}

const LAYOUT: Record<number, Layout> = {
  3:  { labelFont: 15, detailFont: 13, dateFont: 12, labelTrunc: 28, detailTrunc: 80, dateTrunc: 16, markerR: 9, datePillW: 56, labelY: 24, detailY: 48 },
  4:  { labelFont: 14, detailFont: 12, dateFont: 11, labelTrunc: 26, detailTrunc: 72, dateTrunc: 16, markerR: 9, datePillW: 54, labelY: 22, detailY: 44 },
  5:  { labelFont: 13, detailFont: 11, dateFont: 10, labelTrunc: 22, detailTrunc: 60, dateTrunc: 14, markerR: 8, datePillW: 50, labelY: 20, detailY: 40 },
  6:  { labelFont: 13, detailFont: 11, dateFont: 10, labelTrunc: 22, detailTrunc: 56, dateTrunc: 14, markerR: 8, datePillW: 50, labelY: 18, detailY: 36 },
  7:  { labelFont: 12, detailFont: 10, dateFont: 10, labelTrunc: 20, detailTrunc: 50, dateTrunc: 14, markerR: 7, datePillW: 46, labelY: 16, detailY: 32 },
  8:  { labelFont: 12, detailFont: 10, dateFont: 10, labelTrunc: 20, detailTrunc: 46, dateTrunc: 14, markerR: 7, datePillW: 44, labelY: 16, detailY: 30 },
  9:  { labelFont: 11, detailFont: 10, dateFont: 9,  labelTrunc: 18, detailTrunc: 42, dateTrunc: 12, markerR: 7, datePillW: 42, labelY: 14, detailY: 26 },
  10: { labelFont: 11, detailFont: 9,  dateFont: 9,  labelTrunc: 16, detailTrunc: 36, dateTrunc: 12, markerR: 6, datePillW: 40, labelY: 12, detailY: 22 },
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function TimelineVerticalRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<TimelineVerticalData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const n = data.events.length;
  const markerFills = gradientSequence(palette, n);
  const axisColor = palette.nodeStroke;
  const markerStroke = palette.bg;
  const cardFill = lighten(palette.nodeFill, 0.85);
  const labelText = palette.nodeFill;
  const detailText = palette.nodeFill;
  const dateBadge = palette.nodeStroke;
  const dateText = palette.text;

  const layout = LAYOUT[n] ?? LAYOUT[10];
  const {
    labelFont, detailFont, dateFont,
    labelTrunc, detailTrunc, dateTrunc,
    markerR, datePillW, labelY, detailY,
  } = layout;

  const axisX = Math.max(70, width * 0.13);
  const pad = 14;
  const rowH = (height - pad * 2) / n;
  const cardX = axisX + 24;
  const cardW = width - cardX - pad;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Axis line */}
      <line
        x1={axisX}
        y1={pad}
        x2={axisX}
        y2={height - pad}
        stroke={axisColor}
        strokeWidth={2}
      />

      {data.events.map((ev, i) => {
        const cy = pad + rowH * (i + 0.5);
        const cardH = rowH - 8;
        const cardY = cy - cardH / 2;
        const nodeId = `event-${i}`;
        const markerFillResolved = customColors[nodeId] ?? markerFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Card */}
            <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={8} ry={8} fill={cardFill} />
            {/* Marker */}
            <circle cx={axisX} cy={cy} r={markerR} fill={markerFillResolved} stroke={markerStroke} strokeWidth={2} />
            {/* Connector stub */}
            <line x1={axisX + markerR + 1} y1={cy} x2={cardX - 2} y2={cy} stroke={axisColor} strokeWidth={2} />

            {/* Label (top-left of card) */}
            <text
              x={cardX + 12}
              y={cardY + labelY}
              textAnchor="start"
              fill={labelText}
              fontFamily={font}
              fontSize={labelFont}
              fontWeight={700}
            >
              {truncate(ev.label, labelTrunc)}
            </text>

            {/* Date pill (top-right of card) */}
            {ev.date ? (
              <>
                <rect
                  x={cardX + cardW - datePillW - 8}
                  y={cardY + 8}
                  width={datePillW}
                  height={18}
                  rx={9}
                  ry={9}
                  fill={dateBadge}
                />
                <text
                  x={cardX + cardW - datePillW / 2 - 8}
                  y={cardY + 20}
                  textAnchor="middle"
                  fill={dateText}
                  fontFamily={font}
                  fontSize={dateFont}
                  fontWeight={600}
                >
                  {truncate(ev.date, dateTrunc)}
                </text>
              </>
            ) : null}

            {/* Detail */}
            {ev.detail ? (
              <text
                x={cardX + 12}
                y={cardY + detailY}
                textAnchor="start"
                fill={detailText}
                fontFamily={font}
                fontSize={detailFont}
              >
                {truncate(ev.detail, detailTrunc)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Axis date column — small muted date labels to the left of the
          axis if present. Drawn outside the <g data-id> so only the card
          content is inline-editable; the axis-side date is a positional
          duplicate. */}
      {data.events.map((ev, i) => {
        const cy = pad + rowH * (i + 0.5);
        return ev.date ? (
          <text
            key={`axis-date-${i}`}
            x={axisX - 16}
            y={cy + 4}
            textAnchor="end"
            fill={palette.nodeFill}
            fontFamily={font}
            fontSize={10}
            fontWeight={500}
            opacity={0.6}
          >
            {truncate(ev.date, 10)}
          </text>
        ) : null;
      })}
    </svg>
  );
}

// Thumbnail: vertical axis + 4 markers + 4 cards + ellipsis signalling
// flexible count. Mirror of the horizontal thumbnail in vertical form.
const THUMBNAIL_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="3" x2="20" y2="33" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="20" cy="6"  r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="14" r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="22" r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="30" r="2.5" fill="#1B5B50"/>
  <rect x="30" y="3"  width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="11" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="19" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="27" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <text x="20" y="38" font-size="7" fill="#1B5B50" font-weight="700" text-anchor="middle">⋮</text>
</svg>`;

export const timelineVerticalPreset: Preset<TimelineVerticalData> = {
  id: 'timeline-vertical',
  name: 'Vertical Timeline',
  category: 'timeline',
  tags: ['timeline', 'chronology', 'milestones', 'vertical', 'flexible'],
  description: 'Events down a vertical axis with label/date/detail cards. 3 to 10 events.',
  aiDescription:
    'Vertical timeline with 3–10 events down a central axis, each represented by a card containing a bold label, optional date pill, and an optional descriptive detail line. Use when the text describes a chronological sequence and each event deserves a descriptive sentence — better for tall / portrait canvases, narrative timelines, and reports where horizontal space is limited. Prefer "timeline-horizontal" for compact, wide layouts where the events are evenly-weighted milestones. Pick a count between 3 and 10 based on the number of distinct events the source text describes.',
  dataSchema,
  defaultData,
  thumbnailSvg: THUMBNAIL_SVG,
  render: TimelineVerticalRender,
  editableFields: ['events[].label', 'events[].date', 'events[].detail'],
  compatibleFamilies: ['timeline'],
};
