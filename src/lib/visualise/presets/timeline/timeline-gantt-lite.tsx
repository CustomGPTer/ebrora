// =============================================================================
// Preset: timeline-gantt-lite
// Minimal Gantt chart — task rows on the left, a shared time axis across
// the top, and duration bars showing each task's start/end positions.
// Not a full dependency-aware Gantt; the AI picks start/end values in
// arbitrary units (e.g. weeks, months) that span the same 0..timeSpan
// axis. Designed for quick programme overviews rather than critical-path
// analysis.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence, lighten } from '../../palettes';

const taskSchema = z.object({
  label: z.string().min(1).max(28),
  start: z.number().min(0),
  end: z.number(),
});

const dataSchema = z.object({
  axisLabel: z.string().max(18).optional(),
  timeSpan: z.number().positive(),
  ticks: z.array(z.string().min(1).max(10)).min(2).max(8),
  tasks: z.array(taskSchema).min(3).max(7),
});

type TimelineGanttLiteData = z.infer<typeof dataSchema>;

const defaultData: TimelineGanttLiteData = {
  axisLabel: 'Weeks',
  timeSpan: 24,
  ticks: ['0', '4', '8', '12', '16', '20', '24'],
  tasks: [
    { label: 'Planning', start: 0, end: 4 },
    { label: 'Mobilisation', start: 3, end: 6 },
    { label: 'Execution', start: 6, end: 20 },
    { label: 'Verification', start: 18, end: 22 },
    { label: 'Handover', start: 21, end: 24 },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<TimelineGanttLiteData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Pattern A: per-task gradient fills so stacked bars are visually distinguishable.
  const barFills = gradientSequence(palette, data.tasks.length);
  const labelColor = palette.nodeFill;
  const axisColor = palette.nodeStroke;
  const gridColor = lighten(palette.nodeFill, 0.75);
  const tickColor = palette.nodeFill;
  const axisLabelColor = palette.nodeStroke;

  const pad = 14;
  const labelColW = Math.max(90, width * 0.22);
  const axisH = 24;
  const chartX = pad + labelColW;
  const chartW = width - chartX - pad;
  const chartY = pad + axisH;
  const chartH = height - pad - chartY;

  const n = data.tasks.length;
  const rowH = chartH / n;

  const xFor = (t: number): number => chartX + (clamp(t, 0, data.timeSpan) / data.timeSpan) * chartW;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Axis label in top-left gutter */}
      {data.axisLabel ? (
        <text
          x={pad}
          y={pad + 14}
          textAnchor="start"
          fill={axisLabelColor}
          fontFamily={font}
          fontSize={11}
          fontWeight={600}
        >
          {truncate(data.axisLabel, 16)}
        </text>
      ) : null}

      {/* Axis line */}
      <line
        x1={chartX}
        y1={chartY}
        x2={chartX + chartW}
        y2={chartY}
        stroke={axisColor}
        strokeWidth={1.5}
      />

      {/* Ticks + vertical grid */}
      {data.ticks.map((label, ti) => {
        const fraction = ti / (data.ticks.length - 1);
        const x = chartX + fraction * chartW;
        return (
          <g key={`tick-${ti}`}>
            <line
              x1={x}
              y1={chartY}
              x2={x}
              y2={chartY + chartH}
              stroke={gridColor}
              strokeWidth={1}
            />
            <text
              x={x}
              y={chartY - 8}
              textAnchor="middle"
              fill={tickColor}
              fontFamily={font}
              fontSize={10}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Task rows */}
      {data.tasks.map((task, i) => {
        const y = chartY + i * rowH;
        const x1 = xFor(task.start);
        const x2 = xFor(Math.max(task.end, task.start));
        const barX = Math.min(x1, x2);
        const barW = Math.max(2, Math.abs(x2 - x1));
        const barH = Math.max(8, rowH * 0.52);
        const barY = y + (rowH - barH) / 2;
        const nodeId = `task-${i}`;
        const barFill = customColors[nodeId] ?? barFills[i];

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Row-divider faint line */}
            {i > 0 ? (
              <line
                x1={pad}
                y1={y}
                x2={chartX + chartW}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                opacity={0.7}
              />
            ) : null}

            {/* Task label on the left gutter */}
            <text
              x={chartX - 8}
              y={y + rowH / 2 + 4}
              textAnchor="end"
              fill={labelColor}
              fontFamily={font}
              fontSize={11}
              fontWeight={600}
            >
              {truncate(task.label, 24)}
            </text>

            {/* Duration bar */}
            <rect x={barX} y={barY} width={barW} height={barH} rx={4} ry={4} fill={barFill} />
          </g>
        );
      })}
    </svg>
  );
}

export const timelineGanttLitePreset: Preset<TimelineGanttLiteData> = {
  id: 'timeline-gantt-lite',
  name: 'Gantt Lite — Task Durations',
  category: 'timeline',
  tags: ['timeline', 'gantt', 'schedule', 'programme', 'duration'],
  description: 'Minimal Gantt chart — tasks with start/end positions on a shared time axis.',
  aiDescription:
    'Use when the text describes multiple activities that run concurrently or overlap over a shared time span, with explicit or implied start and end points for each. Good for programme summaries, rollout sequencing, and concurrent-work overviews. The AI should pick a consistent unit (weeks / months / days) and express each task as numeric start/end values on a 0..timeSpan axis. Prefer a horizontal timeline preset when tasks are singular events rather than durations.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="28" y1="10" x2="116" y2="10" stroke="#7EBFB2" stroke-width="1"/>
  <rect x="30" y="14" width="18" height="5" rx="1" fill="#1B5B50"/>
  <rect x="42" y="22" width="24" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="60" y="30" width="40" height="5" rx="1" fill="#1B5B50"/>
  <text x="24" y="18" text-anchor="end" font-family="sans-serif" font-size="4" fill="#1B5B50">A</text>
  <text x="24" y="26" text-anchor="end" font-family="sans-serif" font-size="4" fill="#1B5B50">B</text>
  <text x="24" y="34" text-anchor="end" font-family="sans-serif" font-size="4" fill="#1B5B50">C</text>
</svg>`,
  render: Render,
  editableFields: ['axisLabel', 'tasks[].label'],
  compatibleFamilies: ['timeline'],
};
