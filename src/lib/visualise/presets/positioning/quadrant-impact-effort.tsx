// =============================================================================
// Preset: quadrant-impact-effort
// Prioritisation 2×2 — Impact (vertical, low bottom, high top) × Effort
// (horizontal, low left, high right). Fixed quadrant names from standard
// prioritisation vocabulary: Quick Wins (high-impact + low-effort), Major
// Projects (high-impact + high-effort), Fill-Ins (low-impact + low-effort),
// Thankless Tasks (low-impact + high-effort).
//
// Use quadrant-2x2-generic when the axis semantics should be custom.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  quickWins: z.array(z.string().min(1).max(32)).min(0).max(5),
  majorProjects: z.array(z.string().min(1).max(32)).min(0).max(5),
  fillIns: z.array(z.string().min(1).max(32)).min(0).max(5),
  thanklessTasks: z.array(z.string().min(1).max(32)).min(0).max(5),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  quickWins: ['Task', 'Task'],
  majorProjects: ['Task', 'Task'],
  fillIns: ['Task'],
  thanklessTasks: ['Task'],
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

  // Layout: x = effort (low → high); y = impact (low bottom → high top).
  // Top-left = Quick Wins (high impact, low effort) — prime quadrant.
  // Top-right = Major Projects (high impact, high effort).
  // Bottom-left = Fill-Ins (low impact, low effort).
  // Bottom-right = Thankless Tasks (low impact, high effort) — avoid.
  const quadrants: Array<{
    id: 'quick-wins' | 'major-projects' | 'fill-ins' | 'thankless-tasks';
    label: string;
    items: string[];
    x: number;
    y: number;
    fill: string;
  }> = [
    {
      id: 'quick-wins',
      label: 'Quick Wins',
      items: data.quickWins,
      x: padLeft,
      y: padTop,
      fill: paletteColor(paletteId, 0),
    },
    {
      id: 'major-projects',
      label: 'Major Projects',
      items: data.majorProjects,
      x: padLeft + halfW,
      y: padTop,
      fill: paletteColor(paletteId, 1),
    },
    {
      id: 'fill-ins',
      label: 'Fill-Ins',
      items: data.fillIns,
      x: padLeft,
      y: padTop + halfH,
      fill: paletteColor(paletteId, 2),
    },
    {
      id: 'thankless-tasks',
      label: 'Thankless Tasks',
      items: data.thanklessTasks,
      x: padLeft + halfW,
      y: padTop + halfH,
      fill: paletteColor(paletteId, 4),
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

      {/* X-axis: Effort, low left, high right */}
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
        Effort
      </text>

      {/* Y-axis: Impact, low bottom, high top */}
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
        Impact
      </text>
    </svg>
  );
}

export const quadrantImpactEffortPreset: Preset<Data> = {
  id: 'quadrant-impact-effort',
  name: 'Impact / Effort Matrix',
  category: 'positioning',
  tags: ['prioritisation', 'impact', 'effort', 'quadrant', 'quick-wins'],
  description: 'Prioritisation matrix with Quick Wins, Major Projects, Fill-Ins, and Thankless Tasks.',
  aiDescription:
    'Use when the text is prioritisation or backlog triage — tasks, ideas, or initiatives scored on impact vs effort. Fixed quadrants: Quick Wins (high-impact + low-effort, top-left), Major Projects (high-impact + high-effort, top-right), Fill-Ins (low-impact + low-effort, bottom-left), Thankless Tasks (low-impact + high-effort, bottom-right). 0–5 items per quadrant. Prefer "quadrant-2x2-generic" when axes are something other than impact and effort; prefer "quadrant-bcg" for portfolio analysis with growth × market share. Do NOT use unless the text explicitly positions items on impact and effort — a plain 4-item list or a sequential process is NOT an impact/effort matrix.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="4" width="44" height="14" fill="#1B5B50" fill-opacity="0.3"/>
  <rect x="60" y="4" width="44" height="14" fill="#2A7A6C" fill-opacity="0.3"/>
  <rect x="16" y="18" width="44" height="14" fill="#4A9A8A" fill-opacity="0.3"/>
  <rect x="60" y="18" width="44" height="14" fill="#B5DAD2" fill-opacity="0.3"/>
  <line x1="60" y1="4" x2="60" y2="32" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="16" y1="18" x2="104" y2="18" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="16" y1="4" x2="16" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <line x1="16" y1="32" x2="104" y2="32" stroke="#4A9A8A" stroke-width="1"/>
  <text x="20" y="13" font-size="5" fill="#1B5B50" font-weight="700">Quick Wins</text>
  <text x="62" y="13" font-size="5" fill="#1B5B50" font-weight="700">Major</text>
  <text x="20" y="27" font-size="5" fill="#1B5B50" font-weight="700">Fill-Ins</text>
  <text x="62" y="27" font-size="5" fill="#1B5B50" font-weight="700">Thankless</text>
</svg>`,
  render: Render,
  editableFields: ['quickWins', 'majorProjects', 'fillIns', 'thanklessTasks'],
  compatibleFamilies: ['positioning'],
};
