// =============================================================================
// Preset: quadrant-2x2-generic
// Generic 2×2 positioning matrix with explicit x-axis and y-axis labels and
// four customisable quadrant titles. The AI fills in whatever framework the
// user's text describes — it could be cost/value, urgency/importance,
// capability/risk, etc. Differentiates from quadrant-swot (fixed SWOT
// labels) and from quadrant-bcg (fixed BCG terminology).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const quadrantSchema = z.object({
  label: z.string().min(1).max(22),
  items: z.array(z.string().min(1).max(40)).min(0).max(5),
});

const dataSchema = z.object({
  xAxis: z.object({
    label: z.string().min(1).max(24),
    low: z.string().min(1).max(14),
    high: z.string().min(1).max(14),
  }),
  yAxis: z.object({
    label: z.string().min(1).max(24),
    low: z.string().min(1).max(14),
    high: z.string().min(1).max(14),
  }),
  // Order: top-left, top-right, bottom-left, bottom-right
  quadrants: z.array(quadrantSchema).length(4),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  xAxis: { label: 'Horizontal axis', low: 'Low', high: 'High' },
  yAxis: { label: 'Vertical axis', low: 'Low', high: 'High' },
  quadrants: [
    { label: 'Top-left', items: ['Item', 'Item'] },
    { label: 'Top-right', items: ['Item', 'Item'] },
    { label: 'Bottom-left', items: ['Item', 'Item'] },
    { label: 'Bottom-right', items: ['Item', 'Item'] },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Pattern G: 4 fills via gradient — no quadrant is semantically special in a
  // generic 2×2, so a gradient gives distinction without implying hierarchy.
  const fills = gradientSequence(palette, 4) as [string, string, string, string];
  const gridStroke = palette.nodeStroke;
  const axisText = palette.nodeFill;
  const quadrantText = palette.nodeFill;

  const padLeft = 52;
  const padBottom = 44;
  const padTop = 20;
  const padRight = 20;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const halfW = innerW / 2;
  const halfH = innerH / 2;

  const positions = [
    { id: 'q-tl', x: padLeft, y: padTop, fill: fills[0] },
    { id: 'q-tr', x: padLeft + halfW, y: padTop, fill: fills[1] },
    { id: 'q-bl', x: padLeft, y: padTop + halfH, fill: fills[2] },
    { id: 'q-br', x: padLeft + halfW, y: padTop + halfH, fill: fills[3] },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Quadrant cells */}
      {positions.map((pos, i) => {
        const q = data.quadrants[i];
        const fill = customColors[pos.id] ?? pos.fill;
        return (
          <g key={pos.id} data-id={pos.id}>
            <rect x={pos.x} y={pos.y} width={halfW} height={halfH} fill={fill} fillOpacity={0.2} />
            <text
              x={pos.x + 10}
              y={pos.y + 18}
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
              fill={quadrantText}
            >
              {truncate(q.label, 22)}
            </text>
            {q.items.slice(0, 5).map((item, ii) => (
              <text
                key={`item-${ii}`}
                x={pos.x + 14}
                y={pos.y + 36 + ii * 14}
                fontFamily={font}
                fontSize={10}
                fill={quadrantText}
              >
                • {truncate(item, 32)}
              </text>
            ))}
          </g>
        );
      })}

      {/* Grid axes */}
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

      {/* Outer frame */}
      <rect
        x={padLeft}
        y={padTop}
        width={innerW}
        height={innerH}
        fill="none"
        stroke={gridStroke}
        strokeWidth={1}
      />

      {/* X-axis labels — low on left end, high on right end, axis title bottom-centre */}
      <text
        x={padLeft}
        y={padTop + innerH + 16}
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.xAxis.low, 14)}
      </text>
      <text
        x={padLeft + innerW}
        y={padTop + innerH + 16}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.xAxis.high, 14)}
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
        {truncate(data.xAxis.label, 24)}
      </text>

      {/* Y-axis labels — rotated vertically along the left edge */}
      <text
        x={padLeft - 10}
        y={padTop + innerH}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.yAxis.low, 14)}
      </text>
      <text
        x={padLeft - 10}
        y={padTop + 10}
        textAnchor="end"
        fontFamily={font}
        fontSize={10}
        fill={axisText}
      >
        {truncate(data.yAxis.high, 14)}
      </text>
      <text
        x={16}
        y={padTop + innerH / 2}
        textAnchor="middle"
        fontFamily={font}
        fontSize={11}
        fontWeight={600}
        fill={axisText}
        transform={`rotate(-90 16 ${padTop + innerH / 2})`}
      >
        {truncate(data.yAxis.label, 24)}
      </text>
    </svg>
  );
}

export const quadrant2x2GenericPreset: Preset<Data> = {
  id: 'quadrant-2x2-generic',
  name: 'Quadrant — 2×2 Generic',
  category: 'positioning',
  tags: ['quadrant', '2x2', 'matrix', 'positioning', 'generic'],
  description: 'Generic 2×2 matrix with customisable axes and quadrant titles.',
  aiDescription:
    'Use for any 2×2 positioning framework that isn\'t a named SWOT, BCG, or Impact-Effort shape — the AI fills in axis labels (low/high endpoints plus axis titles) and the four quadrant titles from the user\'s text. 0–5 bullet items per quadrant. Prefer "quadrant-swot" when the text is explicitly Strengths/Weaknesses/Opportunities/Threats; prefer "quadrant-bcg" for portfolio analysis with growth × market share; prefer "quadrant-impact-effort" for prioritisation. This preset is the catch-all when the text names a custom 2×2 (e.g. risk vs reward, complexity vs value, urgency vs importance).',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="4" width="46" height="14" fill="#2A7A6C" fill-opacity="0.25"/>
  <rect x="60" y="4" width="46" height="14" fill="#4A9A8A" fill-opacity="0.25"/>
  <rect x="14" y="18" width="46" height="14" fill="#7EBFB2" fill-opacity="0.25"/>
  <rect x="60" y="18" width="46" height="14" fill="#B5DAD2" fill-opacity="0.25"/>
  <line x1="60" y1="4" x2="60" y2="32" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="14" y1="18" x2="106" y2="18" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="14" y1="4" x2="14" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="14" y1="32" x2="106" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <text x="60" y="38" text-anchor="middle" font-size="5" fill="#1B5B50">axis label</text>
  <text x="8" y="18" text-anchor="middle" font-size="5" fill="#1B5B50" transform="rotate(-90 8 18)">axis</text>
</svg>`,
  render: Render,
  editableFields: [
    'xAxis.label',
    'xAxis.low',
    'xAxis.high',
    'yAxis.label',
    'yAxis.low',
    'yAxis.high',
    'quadrants[].label',
    'quadrants[].items[]',
  ],
  compatibleFamilies: ['positioning'],
};
