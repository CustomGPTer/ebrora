// =============================================================================
// Preset: perceptual-map
// Items scattered on a 2-axis plane — each item has a label and (x, y)
// coordinates in the 0..1 range, plotted on a frame with customisable axis
// titles and endpoint labels. Differs from quadrant presets (which group
// items into 4 bins) by emphasising continuous positioning — items sit
// wherever their coordinates place them, including near the centre.
//
// Use for brand positioning, competitor mapping, customer perception,
// product positioning, anywhere the text implies items are placed on two
// continuous scales rather than bucketed into quadrants.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const itemSchema = z.object({
  label: z.string().min(1).max(20),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const dataSchema = z.object({
  xAxis: z.object({
    label: z.string().min(1).max(24),
    low: z.string().min(1).max(14),
    high: z.string().min(1).max(14),
  }),
  yAxis: z.object({
    label: z.string().min(1).max(24),
    low: z.string().min(1).max(14),
    high: z.string().min(1).max(14),
  }),
  items: z.array(itemSchema).min(3).max(10),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  xAxis: { label: 'Horizontal axis', low: 'Low', high: 'High' },
  yAxis: { label: 'Vertical axis', low: 'Low', high: 'High' },
  items: [
    { label: 'Item A', x: 0.2, y: 0.75 },
    { label: 'Item B', x: 0.75, y: 0.8 },
    { label: 'Item C', x: 0.5, y: 0.5 },
    { label: 'Item D', x: 0.8, y: 0.25 },
    { label: 'Item E', x: 0.25, y: 0.3 },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const gridStroke = paletteColor(paletteId, 3);
  const midGridStroke = paletteColor(paletteId, 4);
  const axisText = paletteColor(paletteId, 0);
  const bubbleStroke = paletteColor(paletteId, 5);
  const labelText = paletteColor(paletteId, 0);

  const padLeft = 60;
  const padBottom = 44;
  const padTop = 20;
  const padRight = 24;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  // Clamp to a tiny inset so items at exactly 0 or 1 don't clip the frame edge.
  const clamp = (v: number): number => Math.max(0.02, Math.min(0.98, v));

  // Bubble sizing — slightly larger than labels themselves, scales with canvas.
  const bubbleR = Math.min(18, innerW * 0.04, innerH * 0.05);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Plot area background */}
      <rect
        x={padLeft}
        y={padTop}
        width={innerW}
        height={innerH}
        fill={paletteColor(paletteId, 5)}
        fillOpacity={0.4}
      />

      {/* Mid-axis guide lines (soft) */}
      <line
        x1={padLeft + innerW / 2}
        y1={padTop}
        x2={padLeft + innerW / 2}
        y2={padTop + innerH}
        stroke={midGridStroke}
        strokeWidth={0.75}
        strokeDasharray="4 4"
      />
      <line
        x1={padLeft}
        y1={padTop + innerH / 2}
        x2={padLeft + innerW}
        y2={padTop + innerH / 2}
        stroke={midGridStroke}
        strokeWidth={0.75}
        strokeDasharray="4 4"
      />

      {/* Outer frame */}
      <rect
        x={padLeft}
        y={padTop}
        width={innerW}
        height={innerH}
        fill="none"
        stroke={gridStroke}
        strokeWidth={1}
      />

      {/* Scatter items */}
      {data.items.map((item, i) => {
        const nodeId = `item-${i}`;
        const cx = padLeft + clamp(item.x) * innerW;
        // y is inverted: higher data y → lower screen y
        const cy = padTop + (1 - clamp(item.y)) * innerH;
        const bubbleFill = customColors[nodeId] ?? paletteColor(paletteId, i % 5);

        // Label placement: right of bubble if it fits, left otherwise
        const labelRight = cx + bubbleR + 6 + item.label.length * 3 < padLeft + innerW;
        const labelX = labelRight ? cx + bubbleR + 6 : cx - bubbleR - 6;
        const labelAnchor: 'start' | 'end' = labelRight ? 'start' : 'end';

        return (
          <g key={nodeId} data-id={nodeId}>
            <circle
              cx={cx}
              cy={cy}
              r={bubbleR}
              fill={bubbleFill}
              stroke={bubbleStroke}
              strokeWidth={1.5}
              fillOpacity={0.85}
            />
            <text
              x={labelX}
              y={cy + 4}
              textAnchor={labelAnchor}
              fontFamily={font}
              fontSize={11}
              fontWeight={600}
              fill={labelText}
            >
              {truncate(item.label, 20)}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      <text
        x={padLeft}
        y={padTop + innerH + 16}
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.xAxis.low, 14)}
      </text>
      <text
        x={padLeft + innerW}
        y={padTop + innerH + 16}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.xAxis.high, 14)}
      </text>
      <text
        x={padLeft + innerW / 2}
        y={padTop + innerH + 34}
        textAnchor="middle"
        fontFamily={font}
        fontSize={11}
        fontWeight={600}
        fill={axisText}
      >
        {truncate(data.xAxis.label, 24)}
      </text>

      {/* Y-axis labels */}
      <text
        x={padLeft - 10}
        y={padTop + innerH}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.yAxis.low, 14)}
      </text>
      <text
        x={padLeft - 10}
        y={padTop + 10}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.yAxis.high, 14)}
      </text>
      <text
        x={20}
        y={padTop + innerH / 2}
        textAnchor="middle"
        fontFamily={font}
        fontSize={11}
        fontWeight={600}
        fill={axisText}
        transform={`rotate(-90 20 ${padTop + innerH / 2})`}
      >
        {truncate(data.yAxis.label, 24)}
      </text>
    </svg>
  );
}

export const perceptualMapPreset: Preset<Data> = {
  id: 'perceptual-map',
  name: 'Perceptual Map',
  category: 'positioning',
  tags: ['perceptual-map', 'scatter', 'positioning', 'continuous', 'brand-map'],
  description: '3–10 items plotted on a 2-axis plane with continuous coordinates.',
  aiDescription:
    'Use when the text describes items positioned on two continuous scales without forcing them into 4 quadrants — brand-positioning maps, competitor landscapes, product positioning, perception maps. Each item has a short label and (x, y) coordinates in the 0..1 range (e.g. 0.7 × 0.3 sits right-of-centre and low). The AI infers coordinates from the text; axis labels (title + low/high endpoints) are customisable. Prefer the quadrant presets when the framing is explicitly 4-box categorical rather than continuous.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="4" width="96" height="28" fill="#E6F0EE" stroke="#7EBFB2" stroke-width="0.5"/>
  <line x1="62" y1="4" x2="62" y2="32" stroke="#B5DAD2" stroke-width="0.4" stroke-dasharray="2 2"/>
  <line x1="14" y1="18" x2="110" y2="18" stroke="#B5DAD2" stroke-width="0.4" stroke-dasharray="2 2"/>
  <circle cx="28" cy="10" r="3" fill="#1B5B50" stroke="#E6F0EE"/>
  <circle cx="85" cy="12" r="3" fill="#2A7A6C" stroke="#E6F0EE"/>
  <circle cx="62" cy="22" r="3" fill="#4A9A8A" stroke="#E6F0EE"/>
  <circle cx="95" cy="26" r="3" fill="#7EBFB2" stroke="#E6F0EE"/>
  <circle cx="32" cy="27" r="3" fill="#1B5B50" stroke="#E6F0EE"/>
</svg>`,
  render: Render,
  editableFields: [
    'xAxis.label',
    'xAxis.low',
    'xAxis.high',
    'yAxis.label',
    'yAxis.low',
    'yAxis.high',
    'items[].label',
  ],
  compatibleFamilies: ['positioning'],
};
