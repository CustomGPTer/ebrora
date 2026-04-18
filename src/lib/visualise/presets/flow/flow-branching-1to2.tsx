// =============================================================================
// Preset: flow-branching-1to2
// A single source step that branches into two parallel outputs.
// Used for decision outcomes, parallel work streams, or A/B paths.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette } from '../../palettes';

const stepSchema = z.object({
  label: z.string().min(1).max(40),
  detail: z.string().max(120).optional(),
});

const dataSchema = z.object({
  source: stepSchema,
  branches: z.array(stepSchema).length(2),
});

type FlowBranching1To2Data = z.infer<typeof dataSchema>;

const defaultData: FlowBranching1To2Data = {
  source: { label: 'Site investigation complete', detail: 'Phase 1 desktop + walkover' },
  branches: [
    { label: 'Contamination suspected', detail: 'Commission Phase 2 intrusive survey' },
    { label: 'No contamination indicators', detail: 'Proceed to detailed design' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowBranching1To2Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Per handover Pattern H: source nodeFill; branches accent for differentiation.
  const sourceFill = palette.nodeFill;
  const branchFill = palette.accent;
  const sourceText = palette.text;
  const branchText = palette.accentText;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;

  const pad = 20;
  const nodeW = Math.min(200, (width - pad * 2) * 0.32);
  const nodeH = Math.min(72, height * 0.32);
  const sourceX = pad;
  const sourceY = (height - nodeH) / 2 - 8;
  const sourceCx = sourceX + nodeW;
  const sourceCy = sourceY + nodeH / 2;

  const branchX = width - pad - nodeW;
  const branchGap = Math.min(40, height * 0.18);
  const branchY0 = (height - (nodeH * 2 + branchGap)) / 2 - 8;
  const branchY1 = branchY0 + nodeH + branchGap;

  const sourceFillResolved = customColors['source'] ?? sourceFill;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-branching-1to2-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowFill} />
        </marker>
      </defs>

      {/* Branch connectors drawn behind nodes */}
      {[branchY0, branchY1].map((by, i) => {
        const bx = branchX;
        const bcy = by + nodeH / 2;
        const midX = (sourceCx + bx) / 2;
        return (
          <path
            key={`connector-${i}`}
            d={`M ${sourceCx + 2} ${sourceCy} C ${midX} ${sourceCy}, ${midX} ${bcy}, ${bx - 4} ${bcy}`}
            fill="none"
            stroke={arrowFill}
            strokeWidth={2}
            markerEnd="url(#flow-branching-1to2-arrow)"
          />
        );
      })}

      {/* Source node */}
      <g data-id="source">
        <rect
          x={sourceX}
          y={sourceY}
          width={nodeW}
          height={nodeH}
          rx={8}
          ry={8}
          fill={sourceFillResolved}
        />
        <text
          x={sourceX + nodeW / 2}
          y={sourceY + nodeH / 2 + 5}
          textAnchor="middle"
          fill={sourceText}
          fontFamily={font}
          fontSize={Math.min(14, nodeW / 12)}
          fontWeight={600}
        >
          {data.source.label}
        </text>
        {data.source.detail ? (
          <text
            x={sourceX + nodeW / 2}
            y={sourceY + nodeH + 18}
            textAnchor="middle"
            fill={detailFill}
            fontFamily={font}
            fontSize={11}
          >
            {data.source.detail}
          </text>
        ) : null}
      </g>

      {/* Branch nodes */}
      {data.branches.map((b, i) => {
        const by = i === 0 ? branchY0 : branchY1;
        const nodeId = `branch-${i}`;
        const fill = customColors[nodeId] ?? branchFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={branchX} y={by} width={nodeW} height={nodeH} rx={8} ry={8} fill={fill} />
            <text
              x={branchX + nodeW / 2}
              y={by + nodeH / 2 + 5}
              textAnchor="middle"
              fill={branchText}
              fontFamily={font}
              fontSize={Math.min(14, nodeW / 12)}
              fontWeight={600}
            >
              {b.label}
            </text>
            {b.detail ? (
              <text
                x={branchX + nodeW / 2}
                y={by + nodeH + 18}
                textAnchor="middle"
                fill={detailFill}
                fontFamily={font}
                fontSize={11}
              >
                {b.detail}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const flowBranching1To2Preset: Preset<FlowBranching1To2Data> = {
  id: 'flow-branching-1to2',
  name: 'Branching Flow — 1 → 2',
  category: 'flow',
  tags: ['process', 'branching', 'parallel', 'split'],
  description: 'One source step that splits into two parallel paths.',
  aiDescription:
    'Use when a single action, decision, or trigger results in two parallel next steps that proceed independently. Good for outcome-of-survey branching, two-stream site works, or approval paths. Prefer "flow-decision-yesno" when the branches are explicitly yes/no answers to a binary question; use this when both branches are real next steps rather than outcome labels.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="14" width="32" height="12" rx="2" fill="#1B5B50"/>
  <rect x="80" y="4" width="32" height="12" rx="2" fill="#4A9A8A"/>
  <rect x="80" y="24" width="32" height="12" rx="2" fill="#4A9A8A"/>
  <path d="M38 20 C 59 20, 59 10, 80 10" stroke="#2A7A6C" stroke-width="1.2" fill="none"/>
  <path d="M38 20 C 59 20, 59 30, 80 30" stroke="#2A7A6C" stroke-width="1.2" fill="none"/>
</svg>`,
  render: Render,
  editableFields: ['source.label', 'source.detail', 'branches[].label', 'branches[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
