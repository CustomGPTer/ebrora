// =============================================================================
// Preset: venn-2circle
// Two overlapping circles — left-only, overlap, right-only items.
// Simpler than venn-3circle; use for "these two things share X and
// differ in Y" narratives.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const sideSchema = z.object({
  label: z.string().min(1).max(20),
  items: z.array(z.string().min(1).max(28)).min(1).max(4),
});

const dataSchema = z.object({
  left: sideSchema,
  right: sideSchema,
  overlap: z.array(z.string().min(1).max(24)).min(1).max(4),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  left: {
    label: 'Option A',
    items: ['Feature one', 'Feature two', 'Feature three'],
  },
  right: {
    label: 'Option B',
    items: ['Feature one', 'Feature two', 'Feature three'],
  },
  overlap: ['Shared trait one', 'Shared trait two'],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const leftFill = paletteColor(paletteId, 0);
  const rightFill = paletteColor(paletteId, 2);
  const overlapFill = paletteColor(paletteId, 1);
  const leftText = paletteColor(paletteId, 5);
  const rightText = paletteColor(paletteId, 5);
  const overlapText = paletteColor(paletteId, 5);
  const labelColour = paletteColor(paletteId, 0);

  const cy = height / 2;
  const r = Math.min(width * 0.3, height * 0.4);
  const overlapOffset = r * 0.55;
  const leftCx = width / 2 - overlapOffset;
  const rightCx = width / 2 + overlapOffset;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Circles (pair) with transparency */}
      <g data-id="left">
        <circle
          cx={leftCx}
          cy={cy}
          r={r}
          fill={customColors['left'] ?? leftFill}
          fillOpacity={0.65}
        />
        {/* Left label above */}
        <text
          x={leftCx}
          y={cy - r - 8}
          textAnchor="middle"
          fill={labelColour}
          fontFamily={font}
          fontSize={13}
          fontWeight={700}
        >
          {truncate(data.left.label, 18)}
        </text>
        {/* Left-only items on the left side of the circle */}
        {data.left.items.slice(0, 4).map((item, i) => (
          <text
            key={`l-item-${i}`}
            x={leftCx - r * 0.45}
            y={cy - 16 + i * 14}
            textAnchor="middle"
            fill={leftText}
            fontFamily={font}
            fontSize={10}
          >
            {truncate(item, 16)}
          </text>
        ))}
      </g>

      <g data-id="right">
        <circle
          cx={rightCx}
          cy={cy}
          r={r}
          fill={customColors['right'] ?? rightFill}
          fillOpacity={0.65}
        />
        {/* Right label above */}
        <text
          x={rightCx}
          y={cy - r - 8}
          textAnchor="middle"
          fill={labelColour}
          fontFamily={font}
          fontSize={13}
          fontWeight={700}
        >
          {truncate(data.right.label, 18)}
        </text>
        {/* Right-only items on the right side of the circle */}
        {data.right.items.slice(0, 4).map((item, i) => (
          <text
            key={`r-item-${i}`}
            x={rightCx + r * 0.45}
            y={cy - 16 + i * 14}
            textAnchor="middle"
            fill={rightText}
            fontFamily={font}
            fontSize={10}
          >
            {truncate(item, 16)}
          </text>
        ))}
      </g>

      {/* Overlap region with a small accent marker + items centred */}
      <g data-id="overlap">
        <ellipse
          cx={width / 2}
          cy={cy}
          rx={overlapOffset * 0.72}
          ry={r * 0.52}
          fill={customColors['overlap'] ?? overlapFill}
          fillOpacity={0.45}
        />
        {data.overlap.slice(0, 4).map((item, i) => (
          <text
            key={`o-item-${i}`}
            x={width / 2}
            y={cy - 16 + i * 14}
            textAnchor="middle"
            fill={overlapText}
            fontFamily={font}
            fontSize={10}
            fontWeight={600}
          >
            {truncate(item, 20)}
          </text>
        ))}
      </g>
    </svg>
  );
}

export const venn2CirclePreset: Preset<Data> = {
  id: 'venn-2circle',
  name: 'Venn — 2 Circles',
  category: 'relationships',
  tags: ['venn', 'overlap', 'comparison', 'shared'],
  description: 'Two overlapping circles — left-only, overlap, right-only.',
  aiDescription:
    'Use when the text compares exactly two groups, options, or concepts and explicitly calls out what they share vs what is unique to each. Good for "A vs B with common ground" narratives. Prefer "venn-3circle" for three-way overlaps; prefer "compare-side-by-side-2col" or "compare-pros-cons" when there is no overlap or the content is just two parallel lists.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="46" cy="20" r="16" fill="#1B5B50" fill-opacity="0.65"/>
  <circle cx="74" cy="20" r="16" fill="#4A9A8A" fill-opacity="0.65"/>
  <ellipse cx="60" cy="20" rx="9" ry="9" fill="#2A7A6C" fill-opacity="0.5"/>
</svg>`,
  render: Render,
  editableFields: ['left.label', 'left.items[]', 'right.label', 'right.items[]', 'overlap[]'],
  compatibleFamilies: ['relationships'],
};
