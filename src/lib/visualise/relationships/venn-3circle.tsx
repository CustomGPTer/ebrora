// =============================================================================
// Preset: venn-3circle
// Three overlapping circles with set labels and intersections.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  setA: z.string().min(1).max(24),
  setB: z.string().min(1).max(24),
  setC: z.string().min(1).max(24),
  intersection: z.string().max(30).optional(),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  setA: 'Cost',
  setB: 'Quality',
  setC: 'Time',
  intersection: 'Value',
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const cA = paletteColor(p, 0);
  const cB = paletteColor(p, 1);
  const cC = paletteColor(p, 2);
  const textDark = paletteColor(p, 0);
  const intersectColor = paletteColor(p, 5);
  const font = settings.font ?? 'Inter, sans-serif';

  const cx = width / 2;
  const cy = height / 2 + 4;
  const r = Math.min(width, height) * 0.28;
  const offset = r * 0.6;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g style={{ mixBlendMode: 'multiply' }}>
        <circle data-id="set-a" cx={cx - offset} cy={cy + offset * 0.5} r={r} fill={cA} fillOpacity={0.7} />
        <circle data-id="set-b" cx={cx + offset} cy={cy + offset * 0.5} r={r} fill={cB} fillOpacity={0.7} />
        <circle data-id="set-c" cx={cx} cy={cy - offset * 0.6} r={r} fill={cC} fillOpacity={0.7} />
      </g>

      <text x={cx - offset - r * 0.4} y={cy + offset * 0.5 + r * 0.7} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={600} fill={textDark}>{truncate(data.setA, 12)}</text>
      <text x={cx + offset + r * 0.4} y={cy + offset * 0.5 + r * 0.7} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={600} fill={textDark}>{truncate(data.setB, 12)}</text>
      <text x={cx} y={cy - offset * 0.6 - r * 0.6} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={600} fill={textDark}>{truncate(data.setC, 12)}</text>

      {data.intersection ? (
        <text x={cx} y={cy + 4} textAnchor="middle" fontFamily={font} fontSize={12} fontWeight={700} fill={intersectColor}>{truncate(data.intersection, 14)}</text>
      ) : null}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const venn3CirclePreset: Preset<Data> = {
  id: 'venn-3circle',
  name: 'Venn — 3 Circles',
  category: 'relationships',
  tags: ['venn', 'overlap', 'relationship', 'intersection'],
  description: 'Three overlapping circles with a shared intersection.',
  aiDescription: 'Three-circle Venn diagram showing overlapping sets. Use when the text describes three concepts that share common ground — e.g. cost/quality/time, people/process/technology, safety/quality/schedule.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <g style="mix-blend-mode:multiply">
    <circle cx="45" cy="24" r="12" fill="#1B5B50" fill-opacity="0.7"/>
    <circle cx="75" cy="24" r="12" fill="#2A7A6C" fill-opacity="0.7"/>
    <circle cx="60" cy="12" r="12" fill="#4A9A8A" fill-opacity="0.7"/>
  </g>
</svg>`,
  render: Render,
  editableFields: ['setA', 'setB', 'setC', 'intersection'],
  compatibleFamilies: ['relationships'],
};
