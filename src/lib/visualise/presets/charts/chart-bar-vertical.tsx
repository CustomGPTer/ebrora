// =============================================================================
// Preset: chart-bar-vertical
// Vertical bar chart with up to 8 bars, auto-scaled y-axis.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  xLabel: z.string().max(40).optional(),
  yLabel: z.string().max(40).optional(),
  bars: z
    .array(
      z.object({
        label: z.string().min(1).max(24),
        value: z.number().finite(),
      }),
    )
    .min(2)
    .max(8),
});

type ChartBarVerticalData = z.infer<typeof dataSchema>;

const defaultData: ChartBarVerticalData = {
  xLabel: 'Phase',
  yLabel: 'Hours',
  bars: [
    { label: 'Groundworks', value: 120 },
    { label: 'MEICA', value: 85 },
    { label: 'Commissioning', value: 40 },
    { label: 'Handover', value: 25 },
  ],
};

function ChartBarVerticalRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ChartBarVerticalData>): ReactElement {
  const { paletteId, customColors } = settings;
  const axisColor = paletteColor(paletteId, 2);
  const gridColor = paletteColor(paletteId, 4);
  const textColor = paletteColor(paletteId, 0);
  const barFill = paletteColor(paletteId, 1);

  const padLeft = 44;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 48;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(...data.bars.map((b) => b.value), 0);
  const niceMax = niceCeil(maxVal);
  const yTicks = 5;
  const barGap = 8;
  const barW = (plotW - barGap * (data.bars.length - 1)) / data.bars.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padTop + (plotH / yTicks) * i;
        const value = niceMax - (niceMax / yTicks) * i;
        return (
          <g key={`grid-${i}`}>
            <line
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke={gridColor}
              strokeWidth={0.75}
              strokeDasharray={i === yTicks ? '0' : '2 3'}
            />
            <text
              x={padLeft - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill={axisColor}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
            >
              {formatTick(value)}
            </text>
          </g>
        );
      })}

      {data.bars.map((bar, i) => {
        const x = padLeft + i * (barW + barGap);
        const h = niceMax > 0 ? (bar.value / niceMax) * plotH : 0;
        const y = padTop + plotH - h;
        const nodeId = `bar-${i}`;
        const fill = customColors[nodeId] ?? barFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={y} width={barW} height={h} rx={2} ry={2} fill={fill} />
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill={textColor}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
            >
              {formatValue(bar.value)}
            </text>
            <text
              x={x + barW / 2}
              y={padTop + plotH + 14}
              textAnchor="middle"
              fontSize={10}
              fill={axisColor}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
            >
              {truncate(bar.label, 14)}
            </text>
          </g>
        );
      })}

      {data.yLabel ? (
        <text
          x={12}
          y={padTop + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${padTop + plotH / 2})`}
          fontSize={11}
          fill={textColor}
          fontFamily={settings.font ?? 'Inter, sans-serif'}
          fontWeight={500}
        >
          {data.yLabel}
        </text>
      ) : null}

      {data.xLabel ? (
        <text
          x={padLeft + plotW / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize={11}
          fill={textColor}
          fontFamily={settings.font ?? 'Inter, sans-serif'}
          fontWeight={500}
        >
          {data.xLabel}
        </text>
      ) : null}
    </svg>
  );
}

function niceCeil(n: number): number {
  if (n <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / pow;
  let nice: number;
  if (m <= 1) nice = 1;
  else if (m <= 2) nice = 2;
  else if (m <= 2.5) nice = 2.5;
  else if (m <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function formatTick(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatValue(n: number): string {
  return formatTick(n);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export const chartBarVerticalPreset: Preset<ChartBarVerticalData> = {
  id: 'chart-bar-vertical',
  name: 'Bar Chart — Vertical',
  category: 'charts',
  tags: ['chart', 'bar', 'comparison', 'numeric'],
  description: 'Vertical bars comparing numeric values across categories.',
  aiDescription:
    'Vertical bar chart with 2–8 bars. Use ONLY when the user text contains concrete numeric values that can be compared across named categories (hours, counts, costs, percentages). Never invent numbers — if no numbers are present, pick a diagram preset instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="16" y1="34" x2="116" y2="34" stroke="#7EBFB2" stroke-width="1"/>
  <rect x="22" y="10" width="14" height="24" fill="#2A7A6C"/>
  <rect x="42" y="18" width="14" height="16" fill="#2A7A6C"/>
  <rect x="62" y="22" width="14" height="12" fill="#2A7A6C"/>
  <rect x="82" y="14" width="14" height="20" fill="#2A7A6C"/>
</svg>`,
  render: ChartBarVerticalRender,
  editableFields: ['xLabel', 'yLabel', 'bars[].label', 'bars[].value'],
  compatibleFamilies: ['charts'],
};
