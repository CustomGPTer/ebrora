// =============================================================================
// Preset: chart-pie
// Pie chart with up to 6 slices, legend at side, percentage labels on slices.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  slices: z.array(z.object({
    label: z.string().min(1).max(24),
    value: z.number().positive().finite(),
  })).min(2).max(6),
  showPercent: z.boolean().default(true),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  slices: [
    { label: 'Preliminaries', value: 18 },
    { label: 'Groundworks', value: 35 },
    { label: 'MEICA', value: 28 },
    { label: 'Commissioning', value: 12 },
    { label: 'Overheads', value: 7 },
  ],
  showPercent: true,
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const font = settings.font ?? 'Inter, sans-serif';
  const textDark = palette.nodeFill;
  // Pattern F: per-slice gradient so each slice is visually distinguishable
  // without shouting. Percentage labels sit on the slice fill, so they use
  // palette.text (always reads on any gradient value).
  const sliceFills = gradientSequence(palette, data.slices.length);
  const sliceStroke = palette.bg;
  const pctText = palette.text;

  const total = data.slices.reduce((sum, s) => sum + s.value, 0);
  const R = Math.min(width * 0.35, height * 0.45);
  const cx = R + 24;
  const cy = height / 2;
  const legendX = cx + R + 24;

  let cumulative = 0;
  const arcs = data.slices.map((slice, i) => {
    const pct = total > 0 ? slice.value / total : 0;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const midAngle = (startAngle + endAngle) / 2;
    const labelX = cx + R * 0.65 * Math.cos(midAngle);
    const labelY = cy + R * 0.65 * Math.sin(midAngle);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, fill: sliceFills[i], pct, label: slice.label, value: slice.value, labelX, labelY };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {arcs.map((a, i) => (
        <g key={`slice-${i}`} data-id={`slice-${i}`}>
          <path d={a.path} fill={a.fill} stroke={sliceStroke} strokeWidth={1.5} />
          {data.showPercent && a.pct >= 0.06 ? (
            <text x={a.labelX} y={a.labelY + 3} textAnchor="middle" fontFamily={font} fontSize={11} fontWeight={600} fill={pctText}>
              {Math.round(a.pct * 100)}%
            </text>
          ) : null}
        </g>
      ))}

      {arcs.map((a, i) => (
        <g key={`leg-${i}`}>
          <rect x={legendX} y={24 + i * 22} width={12} height={12} rx={2} fill={a.fill} />
          <text x={legendX + 18} y={34 + i * 22} fontFamily={font} fontSize={11} fill={textDark}>
            {truncate(a.label, 18)} {data.showPercent ? `· ${Math.round(a.pct * 100)}%` : ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const chartPiePreset: Preset<Data> = {
  id: 'chart-pie',
  name: 'Pie Chart',
  category: 'charts',
  tags: ['pie', 'chart', 'share', 'proportion'],
  description: 'Pie chart showing proportional share across 2–6 categories.',
  aiDescription: 'Pie chart with 2–6 slices showing how a whole is divided. Use ONLY when numbers describe share-of-whole (cost breakdown, time allocation, waste composition) and slices sum to something meaningful. Never invent values — if the text has no numbers, pick a diagram instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="20" r="16" fill="#1B5B50"/>
  <path d="M 32 20 L 32 4 A 16 16 0 0 1 48 20 Z" fill="#2A7A6C"/>
  <path d="M 32 20 L 48 20 A 16 16 0 0 1 38 34 Z" fill="#4A9A8A"/>
  <rect x="58" y="10" width="10" height="4" fill="#1B5B50"/>
  <rect x="58" y="18" width="10" height="4" fill="#2A7A6C"/>
  <rect x="58" y="26" width="10" height="4" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['slices[].label', 'slices[].value', 'showPercent'],
  compatibleFamilies: ['charts'],
};
