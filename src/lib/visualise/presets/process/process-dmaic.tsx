// =============================================================================
// Preset: process-dmaic
// DMAIC (Define / Measure / Analyse / Improve / Control) — 5-stage
// horizontal band with chevron-style flow. Canonical Six-Sigma
// improvement framework, domain-neutral in practice.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const stageSchema = z.object({
  title: z.string().min(1).max(14),
  summary: z.string().min(1).max(60),
});

const dataSchema = z.object({
  stages: z.array(stageSchema).length(5),
});

type ProcessDmaicData = z.infer<typeof dataSchema>;

const defaultData: ProcessDmaicData = {
  stages: [
    { title: 'Define', summary: 'Clarify the problem and scope' },
    { title: 'Measure', summary: 'Collect data on current performance' },
    { title: 'Analyse', summary: 'Identify causes of variation' },
    { title: 'Improve', summary: 'Test and implement fixes' },
    { title: 'Control', summary: 'Embed and monitor the new process' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<ProcessDmaicData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Handover suggested Pattern C (flat nodeFill) for DMAIC; using Pattern A here
  // instead because the chevron shape already communicates sequence and flat
  // fills would produce 5 identical chevrons with no visual progression. The
  // gradient subtly reinforces the stage order without implying hierarchy.
  const stageFills = gradientSequence(palette, data.stages.length);
  const titleText = palette.text;
  const summaryText = palette.nodeFill;

  const pad = 14;
  const overlap = 18; // chevron notch depth
  const stageH = Math.min(68, height * 0.48);
  const stageY = pad;
  const nStages = data.stages.length;
  const bandW = width - pad * 2;
  const stageW = (bandW + overlap * (nStages - 1)) / nStages;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {data.stages.map((stage, i) => {
        const x = pad + i * (stageW - overlap);
        const nodeId = `stage-${i}`;
        const fill = customColors[nodeId] ?? stageFills[i];

        // Chevron path — left edge flat for first, notched for subsequent;
        // right edge pointed for all but the last.
        const isFirst = i === 0;
        const isLast = i === nStages - 1;
        const tipX = x + stageW;
        const rightArrow = !isLast
          ? `L ${tipX} ${stageY} L ${tipX + overlap} ${stageY + stageH / 2} L ${tipX} ${stageY + stageH}`
          : `L ${tipX} ${stageY} L ${tipX} ${stageY + stageH}`;
        const leftNotch = !isFirst
          ? `L ${x + overlap} ${stageY + stageH / 2} L ${x} ${stageY + stageH} Z`
          : `L ${x} ${stageY + stageH} Z`;

        const d = `M ${x} ${stageY} ${rightArrow} ${leftNotch}`;

        const textCx = x + stageW / 2 + (isFirst ? -overlap / 2 : 0);

        return (
          <g key={nodeId} data-id={nodeId}>
            <path d={d} fill={fill} />
            <text
              x={textCx}
              y={stageY + stageH / 2 - 2}
              textAnchor="middle"
              fill={titleText}
              fontFamily={font}
              fontSize={Math.min(15, stageW / 8)}
              fontWeight={700}
            >
              {stage.title}
            </text>
          </g>
        );
      })}

      {/* Summaries beneath each stage */}
      {data.stages.map((stage, i) => {
        const x = pad + i * (stageW - overlap);
        const cx = x + stageW / 2;
        return (
          <g key={`sum-${i}`}>
            <text
              x={cx}
              y={stageY + stageH + 22}
              textAnchor="middle"
              fill={summaryText}
              fontFamily={font}
              fontSize={10}
            >
              {stage.summary}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const processDmaicPreset: Preset<ProcessDmaicData> = {
  id: 'process-dmaic',
  name: 'DMAIC — Define, Measure, Analyse, Improve, Control',
  category: 'process',
  tags: ['process', 'dmaic', 'improvement', 'six-sigma'],
  description: 'DMAIC five-stage improvement framework as a chevron band.',
  aiDescription:
    'Use when the text describes a Six-Sigma / process-improvement framework with the specific five stages Define, Measure, Analyse, Improve, Control — or any equivalent five-stage problem-solving approach where each stage feeds into the next. Prefer "process-pdca" for the four-phase Plan-Do-Check-Act cycle; prefer "flow-linear" when the five stages are domain-specific rather than framework-named. Do NOT use unless the text explicitly mentions Six Sigma, DMAIC, or the five named stages. A generic 5-step process is NOT DMAIC — use flow-linear instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 12 L24 12 L30 20 L24 28 L4 28 Z" fill="#1B5B50"/>
  <path d="M24 12 L46 12 L52 20 L46 28 L24 28 L30 20 Z" fill="#2A7A6C"/>
  <path d="M46 12 L68 12 L74 20 L68 28 L46 28 L52 20 Z" fill="#4A9A8A"/>
  <path d="M68 12 L90 12 L96 20 L90 28 L68 28 L74 20 Z" fill="#7EBFB2"/>
  <path d="M90 12 L116 12 L116 28 L90 28 L96 20 Z" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['stages[].title', 'stages[].summary'],
  compatibleFamilies: ['process', 'flow'],
};
