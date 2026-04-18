// =============================================================================
// Preset: euler-nested
// Three concentric rounded rectangles representing a nested set:
// outer set ⊃ middle set ⊃ inner set. Each set has a label and
// optional 1–3 descriptor items.
// Use for "this is a subset of that" narratives — scope zooms,
// inclusion/exclusion diagrams, nested categories.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const setSchema = z.object({
  label: z.string().min(1).max(26),
  items: z.array(z.string().min(1).max(28)).max(3).optional(),
});

const dataSchema = z.object({
  outer: setSchema,
  middle: setSchema,
  inner: setSchema,
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  outer: { label: 'All items', items: ['Broadest scope'] },
  middle: { label: 'Qualifying subset', items: ['Filtered by criteria'] },
  inner: { label: 'Core set', items: ['Top priority'] },
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const outerFill = paletteColor(paletteId, 4);
  const middleFill = paletteColor(paletteId, 2);
  const innerFill = paletteColor(paletteId, 0);
  const outerText = paletteColor(paletteId, 0);
  const middleText = paletteColor(paletteId, 5);
  const innerText = paletteColor(paletteId, 5);

  const pad = 14;
  const outerW = width - pad * 2;
  const outerH = height - pad * 2;
  const middleInset = 36;
  const middleW = outerW - middleInset * 2;
  const middleH = outerH - middleInset * 2;
  const innerInset = 32;
  const innerW = middleW - innerInset * 2;
  const innerH = middleH - innerInset * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <g data-id="outer">
        <rect
          x={pad}
          y={pad}
          width={outerW}
          height={outerH}
          rx={14}
          ry={14}
          fill={customColors['outer'] ?? outerFill}
        />
        <text
          x={pad + 14}
          y={pad + 22}
          textAnchor="start"
          fill={outerText}
          fontFamily={font}
          fontSize={12}
          fontWeight={700}
        >
          {truncate(data.outer.label, 24)}
        </text>
        {data.outer.items && data.outer.items[0] ? (
          <text
            x={pad + 14}
            y={pad + 36}
            textAnchor="start"
            fill={outerText}
            fontFamily={font}
            fontSize={9}
            opacity={0.8}
          >
            {truncate(data.outer.items[0], 28)}
          </text>
        ) : null}
      </g>

      <g data-id="middle">
        <rect
          x={pad + middleInset}
          y={pad + middleInset}
          width={middleW}
          height={middleH}
          rx={12}
          ry={12}
          fill={customColors['middle'] ?? middleFill}
        />
        <text
          x={pad + middleInset + 12}
          y={pad + middleInset + 20}
          textAnchor="start"
          fill={middleText}
          fontFamily={font}
          fontSize={11}
          fontWeight={700}
        >
          {truncate(data.middle.label, 22)}
        </text>
        {data.middle.items && data.middle.items[0] ? (
          <text
            x={pad + middleInset + 12}
            y={pad + middleInset + 32}
            textAnchor="start"
            fill={middleText}
            fontFamily={font}
            fontSize={9}
            opacity={0.9}
          >
            {truncate(data.middle.items[0], 24)}
          </text>
        ) : null}
      </g>

      <g data-id="inner">
        <rect
          x={pad + middleInset + innerInset}
          y={pad + middleInset + innerInset}
          width={innerW}
          height={innerH}
          rx={10}
          ry={10}
          fill={customColors['inner'] ?? innerFill}
        />
        <text
          x={pad + middleInset + innerInset + innerW / 2}
          y={pad + middleInset + innerInset + innerH / 2 - 2}
          textAnchor="middle"
          fill={innerText}
          fontFamily={font}
          fontSize={12}
          fontWeight={700}
        >
          {truncate(data.inner.label, 20)}
        </text>
        {data.inner.items && data.inner.items[0] ? (
          <text
            x={pad + middleInset + innerInset + innerW / 2}
            y={pad + middleInset + innerInset + innerH / 2 + 14}
            textAnchor="middle"
            fill={innerText}
            fontFamily={font}
            fontSize={9}
            opacity={0.9}
          >
            {truncate(data.inner.items[0], 22)}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

export const eulerNestedPreset: Preset<Data> = {
  id: 'euler-nested',
  name: 'Euler — Nested Sets',
  category: 'relationships',
  tags: ['euler', 'nested', 'subset', 'inclusion', 'scope'],
  description: 'Three concentric rectangles — outer ⊃ middle ⊃ inner.',
  aiDescription:
    'Use when the text describes a strict subset relationship: "all of X; of those, some are Y; of those, some are Z". Good for scope-narrowing diagrams, inclusion chains, zooming from broad to specific. Prefer "venn-2circle" or "venn-3circle" when sets overlap partially rather than being strict subsets. Do NOT use for sequential steps, task lists, or any content where items do not strictly contain each other.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="112" height="32" rx="4" fill="#B5DAD2"/>
  <rect x="18" y="10" width="84" height="20" rx="3" fill="#4A9A8A"/>
  <rect x="36" y="14" width="48" height="12" rx="2" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['outer.label', 'middle.label', 'inner.label'],
  compatibleFamilies: ['relationships', 'hierarchy'],
};
