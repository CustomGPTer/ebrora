// =============================================================================
// Preset: quadrant-swot
// 2x2 SWOT matrix — Strengths, Weaknesses, Opportunities, Threats.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const itemSchema = z.array(z.string().max(60)).min(0).max(5);

const dataSchema = z.object({
  strengths: itemSchema,
  weaknesses: itemSchema,
  opportunities: itemSchema,
  threats: itemSchema,
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  strengths: ['Experienced site team', 'Strong supplier base', 'Proven delivery record'],
  weaknesses: ['Tight programme', 'Limited welfare capacity'],
  opportunities: ['Reuse of site-won material', 'Early contractor involvement'],
  threats: ['Adverse weather', 'Utility clash risk'],
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const gridStroke = paletteColor(p, 3);
  const textDark = paletteColor(p, 0);
  const font = settings.font ?? 'Inter, sans-serif';

  const fills: [string, string, string, string] = [
    paletteColor(p, 1),
    paletteColor(p, 2),
    paletteColor(p, 3),
    paletteColor(p, 4),
  ];

  const halfW = width / 2;
  const halfH = height / 2;

  const quadrants = [
    { id: 'strengths', label: 'Strengths', items: data.strengths, x: 0, y: 0, fill: fills[0] },
    { id: 'weaknesses', label: 'Weaknesses', items: data.weaknesses, x: halfW, y: 0, fill: fills[1] },
    { id: 'opportunities', label: 'Opportunities', items: data.opportunities, x: 0, y: halfH, fill: fills[2] },
    { id: 'threats', label: 'Threats', items: data.threats, x: halfW, y: halfH, fill: fills[3] },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {quadrants.map((q) => (
        <g key={q.id} data-id={q.id}>
          <rect x={q.x} y={q.y} width={halfW} height={halfH} fill={q.fill} fillOpacity={0.18} />
          <text x={q.x + 12} y={q.y + 20} fontFamily={font} fontSize={13} fontWeight={700} fill={textDark}>{q.label}</text>
          {q.items.slice(0, 5).map((item, i) => (
            <text key={i} x={q.x + 16} y={q.y + 40 + i * 14} fontFamily={font} fontSize={11} fill={textDark}>
              • {truncate(item, 28)}
            </text>
          ))}
        </g>
      ))}
      <line x1={halfW} y1={0} x2={halfW} y2={height} stroke={gridStroke} strokeWidth={1.5} />
      <line x1={0} y1={halfH} x2={width} y2={halfH} stroke={gridStroke} strokeWidth={1.5} />
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const quadrantSwotPreset: Preset<Data> = {
  id: 'quadrant-swot',
  name: 'SWOT — 2×2 Matrix',
  category: 'positioning',
  tags: ['swot', 'analysis', 'strategy', 'quadrant'],
  description: 'Strengths, Weaknesses, Opportunities, Threats on a 2×2 grid.',
  aiDescription: 'Classic SWOT 2×2 with 0–5 bullet points per quadrant. Use when the text discusses strategic positioning, pre-tender analysis, or any analysis that splits into internal/external × positive/negative. Do NOT use unless the text explicitly maps to Strengths, Weaknesses, Opportunities, and Threats — a generic 4-item list or a 4-step process is NOT a SWOT.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="56" height="16" fill="#2A7A6C" fill-opacity="0.25"/>
  <rect x="60" y="4" width="56" height="16" fill="#4A9A8A" fill-opacity="0.25"/>
  <rect x="4" y="20" width="56" height="16" fill="#7EBFB2" fill-opacity="0.25"/>
  <rect x="60" y="20" width="56" height="16" fill="#B5DAD2" fill-opacity="0.25"/>
  <line x1="60" y1="4" x2="60" y2="36" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="4" y1="20" x2="116" y2="20" stroke="#7EBFB2" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['strengths', 'weaknesses', 'opportunities', 'threats'],
  compatibleFamilies: ['positioning'],
};
