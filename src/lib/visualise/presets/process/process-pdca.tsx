// =============================================================================
// Preset: process-pdca
// Classic Plan–Do–Check–Act (PDCA / Deming cycle) 2×2 grid with curved
// arrows rotating clockwise around the boundary. Visually distinct from
// cycle-4step (circular node layout) and process-circular-4step (wedge
// ring): the grid form reads well in formal reports and presentations.
//
// The four quadrant titles (Plan / Do / Check / Act) are the canonical
// PDCA labels and are editable per-quadrant. Each quadrant can carry
// 1–4 bullet items describing what happens at that phase.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, lighten } from '../../palettes';

const quadrantSchema = z.object({
  title: z.string().min(1).max(14),
  items: z.array(z.string().min(1).max(40)).min(1).max(4),
});

const dataSchema = z.object({
  quadrants: z.array(quadrantSchema).length(4),
});

type ProcessPdcaData = z.infer<typeof dataSchema>;

const defaultData: ProcessPdcaData = {
  quadrants: [
    {
      title: 'Plan',
      items: ['Define objectives', 'Set success measures', 'Agree resources'],
    },
    {
      title: 'Do',
      items: ['Execute the plan', 'Capture evidence', 'Flag deviations'],
    },
    {
      title: 'Check',
      items: ['Compare to targets', 'Identify gaps', 'Analyse root causes'],
    },
    {
      title: 'Act',
      items: ['Adjust approach', 'Embed improvements', 'Start next cycle'],
    },
  ],
};

// Quadrant positions in DOM order (matches array index):
// 0 = Plan (top-left), 1 = Do (top-right), 2 = Check (bottom-right), 3 = Act (bottom-left).
// Clockwise reading matches the PDCA convention.
const POSITIONS: Array<{ row: number; col: number }> = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
];

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessPdcaData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const titleFill = palette.nodeFill;
  const titleText = palette.text;
  const cellFill = lighten(palette.nodeFill, 0.88);
  const cellText = palette.nodeFill;
  const arrowColour = palette.nodeStroke;
  const bulletColour = palette.accent;

  const pad = 14;
  const gap = 10;
  const cellW = (width - pad * 2 - gap) / 2;
  const cellH = (height - pad * 2 - gap) / 2;
  const titleH = 28;

  const cx = width / 2;
  const cy = height / 2;
  const loopR = Math.min(cellW, cellH) * 0.18;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="process-pdca-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColour} />
        </marker>
      </defs>

      {/* Central rotation loop — four curves forming a clockwise ring */}
      <g pointerEvents="none">
        {[0, 1, 2, 3].map((i) => {
          const a1 = (i * 90 - 90) * (Math.PI / 180) + 0.12;
          const a2 = ((i + 1) * 90 - 90) * (Math.PI / 180) - 0.12;
          const x1 = cx + loopR * Math.cos(a1);
          const y1 = cy + loopR * Math.sin(a1);
          const x2 = cx + loopR * Math.cos(a2);
          const y2 = cy + loopR * Math.sin(a2);
          return (
            <path
              key={`loop-${i}`}
              d={`M ${x1} ${y1} A ${loopR} ${loopR} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={arrowColour}
              strokeWidth={2}
              markerEnd="url(#process-pdca-arrow)"
            />
          );
        })}
      </g>

      {data.quadrants.map((q, i) => {
        const { row, col } = POSITIONS[i];
        const x = pad + col * (cellW + gap);
        const y = pad + row * (cellH + gap);
        const nodeId = `quadrant-${i}`;
        const cellFillResolved = customColors[nodeId] ?? cellFill;
        const titleFillResolved = customColors[`${nodeId}-title`] ?? titleFill;

        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={y} width={cellW} height={cellH} rx={8} ry={8} fill={cellFillResolved} />
            {/* Title banner top */}
            <rect x={x} y={y} width={cellW} height={titleH} rx={8} ry={8} fill={titleFillResolved} />
            {/* Square off the bottom of the banner */}
            <rect x={x} y={y + titleH - 8} width={cellW} height={8} fill={titleFillResolved} />
            <text
              x={x + 14}
              y={y + titleH / 2 + 5}
              textAnchor="start"
              fill={titleText}
              fontFamily={font}
              fontSize={14}
              fontWeight={700}
            >
              {q.title}
            </text>

            {/* Items as bullets */}
            {q.items.slice(0, 4).map((item, ii) => {
              const iy = y + titleH + 14 + ii * 16;
              return (
                <g key={`item-${ii}`}>
                  <circle cx={x + 16} cy={iy - 3} r={2.5} fill={bulletColour} />
                  <text
                    x={x + 24}
                    y={iy}
                    textAnchor="start"
                    fill={cellText}
                    fontFamily={font}
                    fontSize={11}
                  >
                    {item}
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

export const processPdcaPreset: Preset<ProcessPdcaData> = {
  id: 'process-pdca',
  name: 'PDCA — Plan, Do, Check, Act',
  category: 'process',
  tags: ['process', 'pdca', 'deming', 'improvement', 'quadrant'],
  description: 'Classic PDCA (Plan–Do–Check–Act) continuous-improvement 2×2 grid.',
  aiDescription:
    'Use when the text describes a continuous-improvement cycle with four phases: planning, execution, measurement, and adjustment. Canonical for Plan–Do–Check–Act (Deming cycle) write-ups, quality-improvement narratives, audit-and-correct loops, and lean-methodology explanations. Prefer "cycle-4step" when the content is explicitly about a circular-node loop diagram; prefer "process-circular-4step" for a 4-wedge ring where the stages are not explicitly PDCA-named. Do NOT use for linear 4-step sequences where the steps do not repeat as a continuous-improvement loop (e.g. an induction → drug test → RAMS briefing → start-of-shift briefing pre-start sequence is NOT PDCA — use flow-linear-4step, process-numbered-*, or timeline-horizontal-* instead). Do NOT force unrelated items into Plan/Do/Check/Act slots.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="4" width="52" height="14" rx="2" fill="#B5DAD2"/>
  <rect x="62" y="4" width="52" height="14" rx="2" fill="#B5DAD2"/>
  <rect x="6" y="22" width="52" height="14" rx="2" fill="#B5DAD2"/>
  <rect x="62" y="22" width="52" height="14" rx="2" fill="#B5DAD2"/>
  <rect x="6" y="4" width="52" height="5" rx="2" fill="#1B5B50"/>
  <rect x="62" y="4" width="52" height="5" rx="2" fill="#1B5B50"/>
  <rect x="6" y="22" width="52" height="5" rx="2" fill="#1B5B50"/>
  <rect x="62" y="22" width="52" height="5" rx="2" fill="#1B5B50"/>
  <circle cx="60" cy="20" r="4" fill="none" stroke="#2A7A6C" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['quadrants[].title', 'quadrants[].items[]'],
  compatibleFamilies: ['process', 'cycle'],
};
