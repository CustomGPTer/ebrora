// =============================================================================
// Preset: pros-cons
// Two-column pros/cons comparison with tick iconography on the pros side
// and cross iconography on the cons side. Use when the text explicitly
// weighs positives against negatives — an advantage/disadvantage list,
// strengths vs drawbacks, benefits vs risks.
//
// Distinct from side-by-side-2col (neutral, no semantic weight) and matrix
// presets (attribute-row comparison rather than flat lists).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, darken, lighten } from '../../palettes';

const dataSchema = z.object({
  topic: z.string().max(40).optional(),
  pros: z.array(z.string().min(1).max(60)).min(1).max(6),
  cons: z.array(z.string().min(1).max(60)).min(1).max(6),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  topic: 'Pros and cons',
  pros: [
    'Positive point',
    'Positive point',
    'Positive point',
    'Positive point',
  ],
  cons: [
    'Drawback or risk',
    'Drawback or risk',
    'Drawback or risk',
    'Drawback or risk',
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Per handover: pros = nodeFill, cons = darken(nodeFill, 0.2). Tick/cross
  // icons use palette.accent to break up the monochrome reading.
  const prosColour = palette.nodeFill;
  const consColour = darken(palette.nodeFill, 0.2);
  const iconAccent = palette.accent;
  const headerText = palette.text;
  const bodyFill = lighten(palette.nodeFill, 0.88);
  const itemText = palette.nodeFill;
  const topicText = palette.nodeFill;

  const paddingX = 40;
  const paddingTopicTop = data.topic ? 22 : 0;
  const headerH = 44;
  const gap = 28;

  const colW = (width - paddingX * 2 - gap) / 2;
  const bodyTop = paddingTopicTop + headerH + 8;
  const bodyH = height - bodyTop - 30;

  const columns: Array<{
    nodeId: 'pros' | 'cons';
    title: string;
    items: string[];
    colour: string;
    iconType: 'tick' | 'cross';
  }> = [
    { nodeId: 'pros', title: 'Pros', items: data.pros, colour: prosColour, iconType: 'tick' },
    { nodeId: 'cons', title: 'Cons', items: data.cons, colour: consColour, iconType: 'cross' },
  ];

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

      {columns.map((col, ci) => {
        const x = paddingX + ci * (colW + gap);
        const colFill = customColors[col.nodeId] ?? col.colour;
        const itemGap = 10;
        const itemRowH = Math.min(
          32,
          (bodyH - (col.items.length - 1) * itemGap - 20) / col.items.length,
        );

        return (
          <g key={col.nodeId} data-id={col.nodeId}>
            {/* Header pill */}
            <rect
              x={x}
              y={paddingTopicTop}
              width={colW}
              height={headerH}
              rx={8}
              ry={8}
              fill={colFill}
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
              {col.title}
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
              stroke={colFill}
              strokeWidth={1}
              opacity={0.85}
            />

            {/* Items with tick/cross icon */}
            {col.items.map((item, ii) => {
              const ry = bodyTop + 12 + ii * (itemRowH + itemGap);
              const iconCx = x + 18;
              const iconCy = ry + itemRowH / 2;
              return (
                <g key={`item-${ii}`}>
                  <circle cx={iconCx} cy={iconCy} r={8} fill={colFill} opacity={0.2} />
                  {col.iconType === 'tick' ? (
                    <path
                      d={`M ${iconCx - 4} ${iconCy} L ${iconCx - 1} ${iconCy + 3} L ${iconCx + 4} ${iconCy - 3}`}
                      stroke={iconAccent}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ) : (
                    <g stroke={iconAccent} strokeWidth={2} strokeLinecap="round">
                      <line x1={iconCx - 4} y1={iconCy - 4} x2={iconCx + 4} y2={iconCy + 4} />
                      <line x1={iconCx - 4} y1={iconCy + 4} x2={iconCx + 4} y2={iconCy - 4} />
                    </g>
                  )}
                  <text
                    x={x + 34}
                    y={iconCy + 4}
                    fontFamily={font}
                    fontSize={12}
                    fill={itemText}
                  >
                    {truncate(item, 52)}
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

export const prosConsPreset: Preset<Data> = {
  id: 'pros-cons',
  name: 'Pros & Cons',
  category: 'comparison',
  tags: ['pros-cons', 'comparison', 'advantages', 'disadvantages', 'weighing'],
  description: 'Two-column pros/cons list with tick and cross icons.',
  aiDescription:
    'Use when the text explicitly weighs positive points against negative points for a single decision or option — pros on the left with tick icons, cons on the right with cross icons. 1–6 items per side. Prefer "side-by-side-2col" when the comparison is neutral (two things described in parallel, no positive/negative framing); prefer "matrix-3col" when attributes are compared across 3 options in rows.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="4" width="48" height="8" rx="2" fill="#1B5B50"/>
  <rect x="64" y="4" width="48" height="8" rx="2" fill="#2A7A6C"/>
  <rect x="8" y="14" width="48" height="22" rx="2" fill="#E6F0EE" stroke="#1B5B50" stroke-width="0.5"/>
  <rect x="64" y="14" width="48" height="22" rx="2" fill="#E6F0EE" stroke="#2A7A6C" stroke-width="0.5"/>
  <circle cx="14" cy="20" r="2" fill="#1B5B50" fill-opacity="0.25"/>
  <circle cx="14" cy="26" r="2" fill="#1B5B50" fill-opacity="0.25"/>
  <circle cx="14" cy="32" r="2" fill="#1B5B50" fill-opacity="0.25"/>
  <path d="M12 20 L14 22 L16 18" stroke="#1B5B50" stroke-width="1" fill="none"/>
  <path d="M12 26 L14 28 L16 24" stroke="#1B5B50" stroke-width="1" fill="none"/>
  <path d="M12 32 L14 34 L16 30" stroke="#1B5B50" stroke-width="1" fill="none"/>
  <circle cx="70" cy="20" r="2" fill="#2A7A6C" fill-opacity="0.25"/>
  <circle cx="70" cy="26" r="2" fill="#2A7A6C" fill-opacity="0.25"/>
  <circle cx="70" cy="32" r="2" fill="#2A7A6C" fill-opacity="0.25"/>
  <path d="M68 18 L72 22 M72 18 L68 22" stroke="#2A7A6C" stroke-width="1"/>
  <path d="M68 24 L72 28 M72 24 L68 28" stroke="#2A7A6C" stroke-width="1"/>
  <path d="M68 30 L72 34 M72 30 L68 34" stroke="#2A7A6C" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['topic', 'pros[]', 'cons[]'],
  compatibleFamilies: ['comparison'],
};
