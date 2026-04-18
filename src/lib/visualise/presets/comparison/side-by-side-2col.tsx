// =============================================================================
// Preset: side-by-side-2col
// Two parallel columns with a title each and a short bullet list underneath.
// Simplest possible "A vs B" comparison shape — no specialised vocabulary,
// no rows of attributes. Use when the text is two narrative descriptions
// placed against each other.
//
// Differentiates from:
//   - pros-cons (semantic: positive vs negative, tick/cross iconography)
//   - matrix-3col / matrix-4col (row-based attribute grid)
//   - vs-card (headline-style head-to-head with stats)
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const columnSchema = z.object({
  title: z.string().min(1).max(28),
  items: z.array(z.string().min(1).max(60)).min(2).max(6),
});

const dataSchema = z.object({
  topic: z.string().max(40).optional(),
  columns: z.array(columnSchema).length(2),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  topic: 'Option comparison',
  columns: [
    {
      title: 'Option A',
      items: [
        'Key characteristic',
        'Key characteristic',
        'Key characteristic',
        'Key characteristic',
      ],
    },
    {
      title: 'Option B',
      items: [
        'Key characteristic',
        'Key characteristic',
        'Key characteristic',
        'Key characteristic',
      ],
    },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const headerText = paletteColor(paletteId, 5);
  const bodyFill = paletteColor(paletteId, 5);
  const bodyStroke = paletteColor(paletteId, 3);
  const itemText = paletteColor(paletteId, 0);
  const topicText = paletteColor(paletteId, 0);

  const paddingX = 40;
  const paddingTopicTop = data.topic ? 22 : 0;
  const headerH = 48;
  const gap = 24;

  const colW = (width - paddingX * 2 - gap) / 2;
  const bodyTop = paddingTopicTop + headerH + 10;
  const bodyH = height - bodyTop - 40;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Topic headline (optional) */}
      {data.topic ? (
        <text
          x={width / 2}
          y={18}
          textAnchor="middle"
          fontFamily={font}
          fontSize={13}
          fontWeight={600}
          fill={topicText}
          opacity={0.85}
        >
          {truncate(data.topic, 40)}
        </text>
      ) : null}

      {data.columns.map((col, i) => {
        const x = paddingX + i * (colW + gap);
        const nodeId = `col-${i}`;
        const headerFill = customColors[nodeId] ?? paletteColor(paletteId, i === 0 ? 0 : 1);

        // Items: spaced down the body
        const itemGap = 10;
        const itemRowH = Math.min(
          34,
          (bodyH - (col.items.length - 1) * itemGap - 20) / col.items.length,
        );

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Header */}
            <rect
              x={x}
              y={paddingTopicTop}
              width={colW}
              height={headerH}
              rx={8}
              ry={8}
              fill={headerFill}
            />
            <text
              x={x + colW / 2}
              y={paddingTopicTop + headerH / 2 + 5}
              textAnchor="middle"
              fontFamily={font}
              fontSize={16}
              fontWeight={700}
              fill={headerText}
            >
              {truncate(col.title, 24)}
            </text>

            {/* Body card */}
            <rect
              x={x}
              y={bodyTop}
              width={colW}
              height={bodyH}
              rx={8}
              ry={8}
              fill={bodyFill}
              stroke={bodyStroke}
              strokeWidth={1}
              opacity={0.6}
            />

            {/* Item rows */}
            {col.items.map((item, ii) => {
              const ry = bodyTop + 12 + ii * (itemRowH + itemGap);
              const bulletCx = x + 18;
              const bulletCy = ry + itemRowH / 2;
              return (
                <g key={`item-${ii}`}>
                  <circle cx={bulletCx} cy={bulletCy} r={3.5} fill={headerFill} />
                  <text
                    x={x + 32}
                    y={bulletCy + 4}
                    fontFamily={font}
                    fontSize={12}
                    fill={itemText}
                  >
                    {truncate(item, 50)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export const sideBySide2ColPreset: Preset<Data> = {
  id: 'side-by-side-2col',
  name: 'Side-by-Side — 2 Columns',
  category: 'comparison',
  tags: ['comparison', 'side-by-side', 'two-column', 'a-vs-b'],
  description: 'Two parallel titled columns, each with a short bullet list.',
  aiDescription:
    'Use for a neutral A-versus-B comparison where each option is described by a short list of characteristics — no positive/negative framing, no attribute rows. Each column has a title and 2–6 bullet items. Prefer "pros-cons" when the two sides are explicitly positive vs negative; prefer "matrix-3col" or "matrix-4col" when the content is a feature grid where every option shares the same attribute rows; prefer "vs-card" when the comparison is headline-style with named stats.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="4" width="48" height="10" rx="2" fill="#1B5B50"/>
  <rect x="64" y="4" width="48" height="10" rx="2" fill="#2A7A6C"/>
  <rect x="8" y="16" width="48" height="20" rx="2" fill="#E6F0EE"/>
  <rect x="64" y="16" width="48" height="20" rx="2" fill="#E6F0EE"/>
  <circle cx="14" cy="22" r="1.3" fill="#1B5B50"/>
  <circle cx="14" cy="28" r="1.3" fill="#1B5B50"/>
  <circle cx="14" cy="34" r="1.3" fill="#1B5B50"/>
  <circle cx="70" cy="22" r="1.3" fill="#2A7A6C"/>
  <circle cx="70" cy="28" r="1.3" fill="#2A7A6C"/>
  <circle cx="70" cy="34" r="1.3" fill="#2A7A6C"/>
  <line x1="18" y1="22" x2="52" y2="22" stroke="#4A9A8A" stroke-width="0.8"/>
  <line x1="18" y1="28" x2="50" y2="28" stroke="#4A9A8A" stroke-width="0.8"/>
  <line x1="18" y1="34" x2="48" y2="34" stroke="#4A9A8A" stroke-width="0.8"/>
  <line x1="74" y1="22" x2="108" y2="22" stroke="#4A9A8A" stroke-width="0.8"/>
  <line x1="74" y1="28" x2="106" y2="28" stroke="#4A9A8A" stroke-width="0.8"/>
  <line x1="74" y1="34" x2="104" y2="34" stroke="#4A9A8A" stroke-width="0.8"/>
</svg>`,
  render: Render,
  editableFields: ['topic', 'columns[].title', 'columns[].items[]'],
  compatibleFamilies: ['comparison'],
};
