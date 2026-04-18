// =============================================================================
// Preset: quadrant-bcg
// BCG Growth-Share Matrix — portfolio positioning by market growth (vertical)
// and market share (horizontal). Four named quadrants with decades-old
// standard business terminology: Stars (high-growth + high-share),
// Question Marks (high-growth + low-share), Cash Cows (low-growth +
// high-share), Dogs (low-growth + low-share).
//
// Quadrant labels are fixed because they carry specific strategic meaning;
// only the items populate per-instance. Use quadrant-2x2-generic when the
// 2×2 should have custom axes and quadrant titles instead.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  stars: z.array(z.string().min(1).max(32)).min(0).max(5),
  questionMarks: z.array(z.string().min(1).max(32)).min(0).max(5),
  cashCows: z.array(z.string().min(1).max(32)).min(0).max(5),
  dogs: z.array(z.string().min(1).max(32)).min(0).max(5),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  stars: ['Product line A'],
  questionMarks: ['Product line B'],
  cashCows: ['Product line C'],
  dogs: ['Product line D'],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const gridStroke = paletteColor(paletteId, 3);
  const axisText = paletteColor(paletteId, 0);
  const quadrantText = paletteColor(paletteId, 0);

  const padLeft = 60;
  const padBottom = 44;
  const padTop = 20;
  const padRight = 20;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const halfW = innerW / 2;
  const halfH = innerH / 2;

  // Quadrants with BCG-standard layout: x-axis is market share (high-to-low
  // LEFT-TO-RIGHT in the classic BCG diagram — but we render share low-to-high
  // left-to-right to match standard modern usage). Vertical axis: growth low
  // at bottom, high at top. So Stars = top-right (high growth + high share),
  // Question Marks = top-left (high growth + low share), Cash Cows =
  // bottom-right (low growth + high share), Dogs = bottom-left.
  const quadrants: Array<{
    id: 'stars' | 'question-marks' | 'cash-cows' | 'dogs';
    label: string;
    items: string[];
    x: number;
    y: number;
    fill: string;
  }> = [
    {
      id: 'question-marks',
      label: 'Question Marks',
      items: data.questionMarks,
      x: padLeft,
      y: padTop,
      fill: paletteColor(paletteId, 2),
    },
    {
      id: 'stars',
      label: 'Stars',
      items: data.stars,
      x: padLeft + halfW,
      y: padTop,
      fill: paletteColor(paletteId, 0),
    },
    {
      id: 'dogs',
      label: 'Dogs',
      items: data.dogs,
      x: padLeft,
      y: padTop + halfH,
      fill: paletteColor(paletteId, 4),
    },
    {
      id: 'cash-cows',
      label: 'Cash Cows',
      items: data.cashCows,
      x: padLeft + halfW,
      y: padTop + halfH,
      fill: paletteColor(paletteId, 1),
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {quadrants.map((q) => {
        const fill = customColors[q.id] ?? q.fill;
        return (
          <g key={q.id} data-id={q.id}>
            <rect x={q.x} y={q.y} width={halfW} height={halfH} fill={fill} fillOpacity={0.22} />
            <text
              x={q.x + 12}
              y={q.y + 20}
              fontFamily={font}
              fontSize={13}
              fontWeight={700}
              fill={quadrantText}
            >
              {q.label}
            </text>
            {q.items.slice(0, 5).map((item, ii) => (
              <text
                key={`item-${ii}`}
                x={q.x + 16}
                y={q.y + 40 + ii * 14}
                fontFamily={font}
                fontSize={11}
                fill={quadrantText}
              >
                • {truncate(item, 30)}
              </text>
            ))}
          </g>
        );
      })}

      {/* Grid + frame */}
      <line
        x1={padLeft + halfW}
        y1={padTop}
        x2={padLeft + halfW}
        y2={padTop + innerH}
        stroke={gridStroke}
        strokeWidth={1.5}
      />
      <line
        x1={padLeft}
        y1={padTop + halfH}
        x2={padLeft + innerW}
        y2={padTop + halfH}
        stroke={gridStroke}
        strokeWidth={1.5}
      />
      <rect
        x={padLeft}
        y={padTop}
        width={innerW}
        height={innerH}
        fill="none"
        stroke={gridStroke}
        strokeWidth={1}
      />

      {/* X-axis — Market Share, low left, high right */}
      <text
        x={padLeft}
        y={padTop + innerH + 16}
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        Low
      </text>
      <text
        x={padLeft + innerW}
        y={padTop + innerH + 16}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        High
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
        Market Share
      </text>

      {/* Y-axis — Market Growth, low bottom, high top */}
      <text
        x={padLeft - 10}
        y={padTop + innerH}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        Low
      </text>
      <text
        x={padLeft - 10}
        y={padTop + 10}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        High
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
        Market Growth
      </text>
    </svg>
  );
}

export const quadrantBcgPreset: Preset<Data> = {
  id: 'quadrant-bcg',
  name: 'BCG Matrix',
  category: 'positioning',
  tags: ['bcg', 'growth-share', 'portfolio', 'quadrant', 'strategy'],
  description: 'Portfolio matrix with Stars, Question Marks, Cash Cows, and Dogs.',
  aiDescription:
    'Use when the text is portfolio analysis on the classic growth-vs-share frame. Horizontal axis is market share (low left, high right); vertical is market growth (low bottom, high top). Quadrant names are fixed — Stars (high-growth + high-share), Question Marks (high-growth + low-share), Cash Cows (low-growth + high-share), Dogs (low-growth + low-share). Populate 0–5 items per quadrant. Prefer "quadrant-2x2-generic" when the axes or quadrant titles should be custom; prefer "quadrant-impact-effort" for prioritisation shapes.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="4" width="44" height="14" fill="#4A9A8A" fill-opacity="0.3"/>
  <rect x="60" y="4" width="44" height="14" fill="#1B5B50" fill-opacity="0.3"/>
  <rect x="16" y="18" width="44" height="14" fill="#B5DAD2" fill-opacity="0.3"/>
  <rect x="60" y="18" width="44" height="14" fill="#2A7A6C" fill-opacity="0.3"/>
  <line x1="60" y1="4" x2="60" y2="32" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="16" y1="18" x2="104" y2="18" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="16" y1="4" x2="16" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="16" y1="32" x2="104" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <text x="62" y="14" font-size="5" fill="#1B5B50" font-weight="700">Stars</text>
  <text x="20" y="14" font-size="5" fill="#1B5B50" font-weight="700">? Marks</text>
  <text x="62" y="28" font-size="5" fill="#1B5B50" font-weight="700">Cash Cows</text>
  <text x="20" y="28" font-size="5" fill="#1B5B50" font-weight="700">Dogs</text>
</svg>`,
  render: Render,
  editableFields: ['stars', 'questionMarks', 'cashCows', 'dogs'],
  compatibleFamilies: ['positioning'],
};
