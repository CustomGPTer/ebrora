// =============================================================================
// Preset: kpi-card-grid-3
// Three KPI cards side-by-side. Each has label, big value, delta/trend, unit.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, lighten } from '../../palettes';

const dataSchema = z.object({
  cards: z.array(z.object({
    label: z.string().min(1).max(30),
    value: z.string().min(1).max(16),
    unit: z.string().max(10).optional(),
    delta: z.string().max(16).optional(),
    direction: z.enum(['up', 'down', 'flat']).optional(),
  })).length(3),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  cards: [
    { label: 'On-time delivery', value: '94', unit: '%', delta: '+3%', direction: 'up' },
    { label: 'Close-call reports', value: '27', delta: '+8 vs last month', direction: 'up' },
    { label: 'LTIR', value: '0.12', delta: '−0.04', direction: 'down' },
  ],
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const font = settings.font ?? 'Inter, sans-serif';
  // Per handover: "Card fill nodeFill; accent border on 'headline' KPI (first
  // card)." We take a slightly lighter nodeFill tint for card bg so the big
  // value (nodeFill) still reads as emphasised against it.
  const cardFill = lighten(palette.nodeFill, 0.88);
  const accent = palette.nodeFill;
  const secondary = palette.nodeStroke;
  const borderColor = lighten(palette.nodeFill, 0.55);
  const headlineBorder = palette.accent;

  const gap = 16;
  const cardW = (width - 32 - gap * 2) / 3;
  const cardH = Math.min(height - 32, 140);
  const y = (height - cardH) / 2;

  const deltaColor = (dir?: 'up' | 'down' | 'flat'): string => {
    if (dir === 'up') return palette.nodeStroke;
    if (dir === 'down') return palette.accent;
    return secondary;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.cards.map((card, i) => {
        const x = 16 + i * (cardW + gap);
        const nodeId = `kpi-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={y} width={cardW} height={cardH} rx={10} fill={cardFill} stroke={i === 0 ? headlineBorder : borderColor} strokeWidth={i === 0 ? 2 : 1} />
            <text x={x + 14} y={y + 22} fontFamily={font} fontSize={11} fontWeight={500} fill={secondary} textAnchor="start">
              {truncate(card.label, 22).toUpperCase()}
            </text>
            <text x={x + 14} y={y + cardH / 2 + 10} fontFamily={font} fontSize={32} fontWeight={700} fill={accent} textAnchor="start">
              {card.value}
              {card.unit ? (
                <tspan fontSize={16} fontWeight={500} fill={secondary} dx={4}>{card.unit}</tspan>
              ) : null}
            </text>
            {card.delta ? (
              <g>
                <text x={x + 14} y={y + cardH - 16} fontFamily={font} fontSize={11} fontWeight={600} fill={deltaColor(card.direction)} textAnchor="start">
                  {card.direction === 'up' ? '▲' : card.direction === 'down' ? '▼' : '—'} {truncate(card.delta, 18)}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const kpiCardGrid3Preset: Preset<Data> = {
  id: 'kpi-card-grid-3',
  name: 'KPI Cards — 3',
  category: 'charts',
  tags: ['kpi', 'dashboard', 'metric', 'summary'],
  description: 'Three side-by-side KPI cards showing headline metrics.',
  aiDescription: 'Three KPI cards with label, big-number value, optional unit, and delta with direction arrow. Use when the text describes exactly three headline metrics — dashboard summaries, monthly board updates, executive briefings.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="6" width="34" height="28" rx="3" fill="#E6F0EE" stroke="#B5DAD2"/>
  <rect x="43" y="6" width="34" height="28" rx="3" fill="#E6F0EE" stroke="#B5DAD2"/>
  <rect x="82" y="6" width="34" height="28" rx="3" fill="#E6F0EE" stroke="#B5DAD2"/>
  <text x="21" y="24" text-anchor="middle" font-size="10" font-weight="700" fill="#1B5B50">94</text>
  <text x="60" y="24" text-anchor="middle" font-size="10" font-weight="700" fill="#1B5B50">27</text>
  <text x="99" y="24" text-anchor="middle" font-size="10" font-weight="700" fill="#1B5B50">0.12</text>
</svg>`,
  render: Render,
  editableFields: ['cards[].label', 'cards[].value', 'cards[].unit', 'cards[].delta'],
  compatibleFamilies: ['charts'],
};
