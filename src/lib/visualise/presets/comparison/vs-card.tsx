// =============================================================================
// Preset: vs-card
// Head-to-head "VS" comparison card — two options side-by-side with a big
// "VS" divider in the middle, each carrying a title, optional subtitle, and
// 0–3 labelled stats. Use for headline-style comparisons where named
// numbers matter (cost vs cost, duration vs duration, output vs output).
//
// Distinct from side-by-side-2col (bullet lists, narrative) and matrix-3col
// (attribute grid across 3+ options).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const sideSchema = z.object({
  title: z.string().min(1).max(22),
  subtitle: z.string().max(40).optional(),
  stats: z
    .array(
      z.object({
        label: z.string().min(1).max(18),
        value: z.string().min(1).max(14),
      }),
    )
    .max(3),
});

const dataSchema = z.object({
  topic: z.string().max(40).optional(),
  left: sideSchema,
  right: sideSchema,
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  topic: 'Head-to-head',
  left: {
    title: 'Option A',
    subtitle: 'Short summary',
    stats: [
      { label: 'Metric one', value: '—' },
      { label: 'Metric two', value: '—' },
      { label: 'Metric three', value: '—' },
    ],
  },
  right: {
    title: 'Option B',
    subtitle: 'Short summary',
    stats: [
      { label: 'Metric one', value: '—' },
      { label: 'Metric two', value: '—' },
      { label: 'Metric three', value: '—' },
    ],
  },
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const leftColour = paletteColor(paletteId, 0);
  const rightColour = paletteColor(paletteId, 1);
  const cardFill = paletteColor(paletteId, 5);
  const cardStroke = paletteColor(paletteId, 3);
  const titleText = paletteColor(paletteId, 5);
  const subtitleText = paletteColor(paletteId, 5);
  const statLabelText = paletteColor(paletteId, 0);
  const statValueText = paletteColor(paletteId, 0);
  const topicText = paletteColor(paletteId, 0);
  const vsBgColour = paletteColor(paletteId, 0);
  const vsTextColour = paletteColor(paletteId, 5);

  const paddingX = 28;
  const topicH = data.topic ? 26 : 0;
  const vsDiameter = 64;

  const cardTop = topicH + 14;
  const cardH = height - cardTop - 20;
  const cardW = (width - paddingX * 2 - vsDiameter) / 2;

  const headerH = 70;

  type Side = {
    nodeId: 'left' | 'right';
    x: number;
    data: z.infer<typeof sideSchema>;
    colour: string;
  };
  const sides: Side[] = [
    { nodeId: 'left', x: paddingX, data: data.left, colour: leftColour },
    {
      nodeId: 'right',
      x: paddingX + cardW + vsDiameter,
      data: data.right,
      colour: rightColour,
    },
  ];

  const vsCx = paddingX + cardW + vsDiameter / 2;
  const vsCy = cardTop + cardH / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
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

      {sides.map((s) => {
        const headerFill = customColors[s.nodeId] ?? s.colour;
        const stats = s.data.stats ?? [];
        const statsTop = cardTop + headerH + 16;
        const statRowH = Math.min(
          48,
          stats.length > 0 ? (cardH - headerH - 24) / stats.length : 0,
        );

        return (
          <g key={s.nodeId} data-id={s.nodeId}>
            {/* Card background */}
            <rect
              x={s.x}
              y={cardTop}
              width={cardW}
              height={cardH}
              rx={10}
              ry={10}
              fill={cardFill}
              stroke={cardStroke}
              strokeWidth={1}
            />

            {/* Header band */}
            <path
              d={`M ${s.x + 10} ${cardTop}
                  L ${s.x + cardW - 10} ${cardTop}
                  A 10 10 0 0 1 ${s.x + cardW} ${cardTop + 10}
                  L ${s.x + cardW} ${cardTop + headerH}
                  L ${s.x} ${cardTop + headerH}
                  L ${s.x} ${cardTop + 10}
                  A 10 10 0 0 1 ${s.x + 10} ${cardTop} Z`}
              fill={headerFill}
            />

            {/* Title */}
            <text
              x={s.x + cardW / 2}
              y={cardTop + 28}
              textAnchor="middle"
              fontFamily={font}
              fontSize={18}
              fontWeight={700}
              fill={titleText}
            >
              {truncate(s.data.title, 22)}
            </text>

            {/* Subtitle (optional) */}
            {s.data.subtitle ? (
              <text
                x={s.x + cardW / 2}
                y={cardTop + 50}
                textAnchor="middle"
                fontFamily={font}
                fontSize={11}
                fill={subtitleText}
                opacity={0.85}
              >
                {truncate(s.data.subtitle, 38)}
              </text>
            ) : null}

            {/* Stats */}
            {stats.map((stat, i) => {
              const rowY = statsTop + i * statRowH;
              return (
                <g key={`stat-${i}`}>
                  <text
                    x={s.x + 16}
                    y={rowY + statRowH / 2 - 3}
                    fontFamily={font}
                    fontSize={10}
                    fontWeight={600}
                    fill={statLabelText}
                    opacity={0.75}
                  >
                    {truncate(stat.label, 18).toUpperCase()}
                  </text>
                  <text
                    x={s.x + 16}
                    y={rowY + statRowH / 2 + 14}
                    fontFamily={font}
                    fontSize={18}
                    fontWeight={700}
                    fill={statValueText}
                  >
                    {truncate(stat.value, 14)}
                  </text>
                  {i < stats.length - 1 ? (
                    <line
                      x1={s.x + 16}
                      y1={rowY + statRowH - 4}
                      x2={s.x + cardW - 16}
                      y2={rowY + statRowH - 4}
                      stroke={cardStroke}
                      strokeWidth={0.5}
                      opacity={0.6}
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* VS medallion — drawn last so it sits over both cards */}
      <circle
        cx={vsCx}
        cy={vsCy}
        r={vsDiameter / 2}
        fill={vsBgColour}
        stroke={cardFill}
        strokeWidth={4}
      />
      <text
        x={vsCx}
        y={vsCy + 7}
        textAnchor="middle"
        fontFamily={font}
        fontSize={20}
        fontWeight={800}
        fill={vsTextColour}
        letterSpacing={1}
      >
        VS
      </text>
    </svg>
  );
}

export const vsCardPreset: Preset<Data> = {
  id: 'vs-card',
  name: 'Versus Card',
  category: 'comparison',
  tags: ['vs', 'versus', 'head-to-head', 'comparison', 'stats'],
  description: 'Two option cards divided by a "VS" medallion, each with title + stats.',
  aiDescription:
    'Use for a headline-style head-to-head comparison between two named options, each carrying a short title, an optional subtitle, and up to 3 labelled stats (short numeric or keyword values). The "VS" medallion in the middle signals a binary choice. Prefer "side-by-side-2col" when the two sides are narrative bullet lists rather than named stats; prefer "pros-cons" when the framing is positive vs negative for a single option; prefer "matrix-3col" or "matrix-4col" for 3+ options compared across shared attribute rows.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="8" width="48" height="28" rx="3" fill="#E6F0EE" stroke="#7EBFB2" stroke-width="0.5"/>
  <rect x="4" y="8" width="48" height="9" rx="3" fill="#1B5B50"/>
  <rect x="68" y="8" width="48" height="28" rx="3" fill="#E6F0EE" stroke="#7EBFB2" stroke-width="0.5"/>
  <rect x="68" y="8" width="48" height="9" rx="3" fill="#2A7A6C"/>
  <circle cx="60" cy="22" r="9" fill="#1B5B50" stroke="#E6F0EE" stroke-width="1.5"/>
  <text x="60" y="25" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#E6F0EE">VS</text>
  <rect x="8" y="22" width="16" height="2" fill="#1B5B50" fill-opacity="0.4"/>
  <rect x="8" y="28" width="20" height="4" fill="#1B5B50"/>
  <rect x="72" y="22" width="16" height="2" fill="#2A7A6C" fill-opacity="0.4"/>
  <rect x="72" y="28" width="20" height="4" fill="#2A7A6C"/>
</svg>`,
  render: Render,
  editableFields: [
    'topic',
    'left.title',
    'left.subtitle',
    'left.stats[].label',
    'left.stats[].value',
    'right.title',
    'right.subtitle',
    'right.stats[].label',
    'right.stats[].value',
  ],
  compatibleFamilies: ['comparison'],
};
