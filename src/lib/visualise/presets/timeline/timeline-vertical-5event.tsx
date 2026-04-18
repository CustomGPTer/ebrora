// =============================================================================
// Preset: timeline-vertical-5event
// Vertical timeline with 5 events down a central axis. Each event has a
// left-side marker and a right-side card with label/date/detail.
// Good for tall-aspect embeds, narrative timelines, and reports where
// each event warrants more descriptive text than a horizontal timeline
// can accommodate.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  events: z
    .array(
      z.object({
        label: z.string().min(1).max(32),
        date: z.string().max(20).optional(),
        detail: z.string().max(80).optional(),
      }),
    )
    .length(5),
});

type TimelineVertical5EventData = z.infer<typeof dataSchema>;

const defaultData: TimelineVertical5EventData = {
  events: [
    { label: 'Planning', date: 'Q1', detail: 'Scope, resources, and outline timeline' },
    { label: 'Mobilisation', date: 'Q1', detail: 'Setup and onboarding of the team' },
    { label: 'Execution', date: 'Q2–Q3', detail: 'Main delivery phase' },
    { label: 'Verification', date: 'Q4', detail: 'Testing and stakeholder sign-off' },
    { label: 'Handover', date: 'Q4', detail: 'Transition to operations' },
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
}: PresetRenderProps<TimelineVertical5EventData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const axisColor = paletteColor(paletteId, 2);
  const markerFill = paletteColor(paletteId, 0);
  const markerStroke = paletteColor(paletteId, 5);
  const cardFill = paletteColor(paletteId, 4);
  const labelText = paletteColor(paletteId, 0);
  const detailText = paletteColor(paletteId, 0);
  const dateBadge = paletteColor(paletteId, 1);
  const dateText = paletteColor(paletteId, 5);

  const axisX = Math.max(70, width * 0.13);
  const pad = 14;
  const n = data.events.length;
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
        const markerFillResolved = customColors[nodeId] ?? markerFill;

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Card */}
            <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={8} ry={8} fill={cardFill} />
            {/* Marker */}
            <circle cx={axisX} cy={cy} r={8} fill={markerFillResolved} stroke={markerStroke} strokeWidth={2} />
            {/* Connector stub */}
            <line x1={axisX + 9} y1={cy} x2={cardX - 2} y2={cy} stroke={axisColor} strokeWidth={2} />

            {/* Label (top-left of card) */}
            <text
              x={cardX + 12}
              y={cardY + 20}
              textAnchor="start"
              fill={labelText}
              fontFamily={font}
              fontSize={13}
              fontWeight={700}
            >
              {truncate(ev.label, 22)}
            </text>

            {/* Date pill (top-right of card) */}
            {ev.date ? (
              <>
                <rect
                  x={cardX + cardW - 58}
                  y={cardY + 8}
                  width={50}
                  height={18}
                  rx={9}
                  ry={9}
                  fill={dateBadge}
                />
                <text
                  x={cardX + cardW - 33}
                  y={cardY + 20}
                  textAnchor="middle"
                  fill={dateText}
                  fontFamily={font}
                  fontSize={10}
                  fontWeight={600}
                >
                  {truncate(ev.date, 14)}
                </text>
              </>
            ) : null}

            {/* Detail */}
            {ev.detail ? (
              <text
                x={cardX + 12}
                y={cardY + 40}
                textAnchor="start"
                fill={detailText}
                fontFamily={font}
                fontSize={11}
              >
                {truncate(ev.detail, 60)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Axis date column — the year/quarter labels beside the axis if present.
          Drawn separately from the <g data-id="event-N"> so only the card content
          is inline-editable. The axis-side date text is a positional duplicate;
          editing the card date is the canonical path. */}
      {data.events.map((ev, i) => {
        const cy = pad + rowH * (i + 0.5);
        return ev.date ? (
          <text
            key={`axis-date-${i}`}
            x={axisX - 16}
            y={cy + 4}
            textAnchor="end"
            fill={paletteColor(paletteId, 0)}
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

export const timelineVertical5EventPreset: Preset<TimelineVertical5EventData> = {
  id: 'timeline-vertical-5event',
  name: 'Vertical Timeline — 5 Events',
  category: 'timeline',
  tags: ['timeline', 'chronology', 'milestones', 'vertical'],
  description: 'Five events down a vertical axis, each with a card showing label, date, and detail.',
  aiDescription:
    'Vertical timeline with 5 events down a central axis. Use when the text describes a chronological sequence with 5 meaningful events and each event deserves a descriptive sentence. Better for tall / portrait canvases and for narrative timelines where horizontal space is limited. Prefer "timeline-horizontal-5event" for compact, wide layouts.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="4" x2="20" y2="36" stroke="#7EBFB2" stroke-width="1.5"/>
  <circle cx="20" cy="8" r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="16" r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="24" r="2.5" fill="#1B5B50"/>
  <circle cx="20" cy="32" r="2.5" fill="#1B5B50"/>
  <rect x="30" y="5" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="13" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="21" width="82" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="30" y="29" width="82" height="5" rx="1" fill="#B5DAD2"/>
</svg>`,
  render: Render,
  editableFields: ['events[].label', 'events[].date', 'events[].detail'],
  compatibleFamilies: ['timeline'],
};
