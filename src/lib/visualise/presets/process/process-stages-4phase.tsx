// =============================================================================
// Preset: process-stages-4phase
// Four strategic phase blocks, each with a big phase number, title, and
// 1–3 bullet points. Visually weightier than a linear-4step flow — used
// for lifecycle narratives (programme phases, product stages, annual
// planning) rather than operational step-by-step flows.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence, lighten } from '../../palettes';

const phaseSchema = z.object({
  title: z.string().min(1).max(20),
  bullets: z.array(z.string().min(1).max(36)).min(1).max(3),
});

const dataSchema = z.object({
  phases: z.array(phaseSchema).length(4),
});

type ProcessStages4PhaseData = z.infer<typeof dataSchema>;

const defaultData: ProcessStages4PhaseData = {
  phases: [
    {
      title: 'Discovery',
      bullets: ['Understand the need', 'Define the goals', 'Agree constraints'],
    },
    {
      title: 'Design',
      bullets: ['Develop options', 'Select the approach', 'Finalise the plan'],
    },
    {
      title: 'Delivery',
      bullets: ['Execute the plan', 'Track progress', 'Resolve blockers'],
    },
    {
      title: 'Closure',
      bullets: ['Verify outcomes', 'Capture lessons', 'Transition to ongoing'],
    },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessStages4PhaseData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Pattern A: per-phase gradient headers so the 4 stages read as a progression.
  const phaseFills = gradientSequence(palette, data.phases.length);
  const phaseBody = lighten(palette.nodeFill, 0.85);
  const numberText = palette.text;
  const bulletText = palette.nodeFill;
  const bulletDot = lighten(palette.nodeFill, 0.2);

  const pad = 12;
  const gap = 10;
  const n = data.phases.length;
  const phaseW = (width - pad * 2 - gap * (n - 1)) / n;
  const headerH = 46;
  const bodyH = height - pad * 2 - headerH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {data.phases.map((phase, i) => {
        const x = pad + i * (phaseW + gap);
        const y = pad;
        const nodeId = `phase-${i}`;
        const headerFill = customColors[`${nodeId}-header`] ?? phaseFills[i];
        const bodyFill = customColors[nodeId] ?? phaseBody;

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Body */}
            <rect x={x} y={y + headerH - 4} width={phaseW} height={bodyH + 4} rx={8} ry={8} fill={bodyFill} />
            {/* Header */}
            <rect x={x} y={y} width={phaseW} height={headerH} rx={8} ry={8} fill={headerFill} />
            {/* Square off the bottom of the header */}
            <rect x={x} y={y + headerH - 8} width={phaseW} height={8} fill={headerFill} />

            {/* Phase number — big, left-aligned */}
            <text
              x={x + 14}
              y={y + headerH - 12}
              textAnchor="start"
              fill={numberText}
              fontFamily={font}
              fontSize={28}
              fontWeight={800}
              opacity={0.85}
            >
              {`0${i + 1}`}
            </text>
            {/* Phase title — right side of header */}
            <text
              x={x + phaseW - 12}
              y={y + headerH - 14}
              textAnchor="end"
              fill={numberText}
              fontFamily={font}
              fontSize={14}
              fontWeight={700}
            >
              {phase.title}
            </text>

            {/* Bullets */}
            {phase.bullets.slice(0, 3).map((b, bi) => {
              const by = y + headerH + 16 + bi * 18;
              return (
                <g key={`bullet-${bi}`}>
                  <circle cx={x + 16} cy={by - 3} r={2.5} fill={bulletDot} />
                  <text
                    x={x + 24}
                    y={by}
                    textAnchor="start"
                    fill={bulletText}
                    fontFamily={font}
                    fontSize={11}
                  >
                    {b}
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

export const processStages4PhasePreset: Preset<ProcessStages4PhaseData> = {
  id: 'process-stages-4phase',
  name: 'Strategic Phases — 4 Stages',
  category: 'process',
  tags: ['process', 'phases', 'lifecycle', 'strategy'],
  description: 'Four strategic phase blocks with phase numbers, titles, and bullet points.',
  aiDescription:
    'Use when the text describes a lifecycle, programme, or initiative in four strategic phases — Discovery / Design / Delivery / Closure, or equivalent. Good for high-level narratives where each phase has a distinct objective and multiple activities. Prefer "flow-linear" for operational step-by-step flows. Prefer "process-pdca" when the content is explicitly about Plan-Do-Check-Act improvement.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="6" width="26" height="28" rx="2" fill="#B5DAD2"/>
  <rect x="34" y="6" width="26" height="28" rx="2" fill="#B5DAD2"/>
  <rect x="64" y="6" width="26" height="28" rx="2" fill="#B5DAD2"/>
  <rect x="94" y="6" width="22" height="28" rx="2" fill="#B5DAD2"/>
  <rect x="4" y="6" width="26" height="10" rx="2" fill="#1B5B50"/>
  <rect x="34" y="6" width="26" height="10" rx="2" fill="#1B5B50"/>
  <rect x="64" y="6" width="26" height="10" rx="2" fill="#1B5B50"/>
  <rect x="94" y="6" width="22" height="10" rx="2" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['phases[].title', 'phases[].bullets[]'],
  compatibleFamilies: ['process', 'flow'],
};
