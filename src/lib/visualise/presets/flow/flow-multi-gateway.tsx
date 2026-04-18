// =============================================================================
// Preset: flow-multi-gateway
// A single source step feeds a diamond decision gateway, which fans out
// into 3–5 labelled outgoing branches. Use for multi-outcome decisions
// that can't be collapsed into a yes/no (e.g. severity triage, role
// routing, status-based escalation).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const branchSchema = z.object({
  condition: z.string().min(1).max(24),
  outcome: z.string().min(1).max(32),
});

const dataSchema = z.object({
  entry: z.string().min(1).max(40),
  decision: z.string().min(1).max(60),
  branches: z.array(branchSchema).min(3).max(5),
});

type FlowMultiGatewayData = z.infer<typeof dataSchema>;

const defaultData: FlowMultiGatewayData = {
  entry: 'Request received',
  decision: 'Priority level?',
  branches: [
    { condition: 'Low', outcome: 'Queue for next review cycle' },
    { condition: 'Standard', outcome: 'Assign to team within 48 hours' },
    { condition: 'High', outcome: 'Escalate to lead for same-day action' },
    { condition: 'Critical', outcome: 'Stop other work and respond immediately' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowMultiGatewayData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const entryFill = paletteColor(paletteId, 0);
  const diamondFill = paletteColor(paletteId, 1);
  const branchFill = paletteColor(paletteId, 2);
  const textOnPrimary = paletteColor(paletteId, 5);
  const arrowColour = paletteColor(paletteId, 1);
  const conditionFill = paletteColor(paletteId, 0);

  const pad = 16;
  const entryW = Math.min(180, width * 0.28);
  const entryH = 44;
  const entryX = pad;
  const entryY = (height - entryH) / 2;

  const diamondSize = Math.min(96, height * 0.55);
  const diamondCx = entryX + entryW + 28 + diamondSize / 2;
  const diamondCy = height / 2;

  const branchX = diamondCx + diamondSize / 2 + 28;
  const branchW = width - branchX - pad;
  const branchH = 34;
  const n = data.branches.length;
  const branchGap = Math.max(6, (height - pad * 2 - branchH * n) / Math.max(1, n - 1));
  const branchY0 = (height - (branchH * n + branchGap * (n - 1))) / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-multi-gateway-arrow"
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

      {/* Entry → decision arrow */}
      <line
        x1={entryX + entryW + 1}
        y1={diamondCy}
        x2={diamondCx - diamondSize / 2 - 4}
        y2={diamondCy}
        stroke={arrowColour}
        strokeWidth={2}
        markerEnd="url(#flow-multi-gateway-arrow)"
      />

      {/* Diamond → each branch arrows */}
      {data.branches.map((_, i) => {
        const by = branchY0 + i * (branchH + branchGap) + branchH / 2;
        return (
          <path
            key={`arr-${i}`}
            d={`M ${diamondCx + diamondSize / 2 - 2} ${diamondCy} C ${diamondCx + diamondSize / 2 + 30} ${diamondCy}, ${branchX - 40} ${by}, ${branchX - 4} ${by}`}
            fill="none"
            stroke={arrowColour}
            strokeWidth={2}
            markerEnd="url(#flow-multi-gateway-arrow)"
          />
        );
      })}

      {/* Entry */}
      <g data-id="entry">
        <rect
          x={entryX}
          y={entryY}
          width={entryW}
          height={entryH}
          rx={8}
          ry={8}
          fill={customColors['entry'] ?? entryFill}
        />
        <text
          x={entryX + entryW / 2}
          y={entryY + entryH / 2 + 5}
          textAnchor="middle"
          fill={textOnPrimary}
          fontFamily={font}
          fontSize={Math.min(13, entryW / 12)}
          fontWeight={600}
        >
          {data.entry}
        </text>
      </g>

      {/* Diamond decision */}
      <g data-id="decision">
        <polygon
          points={`${diamondCx},${diamondCy - diamondSize / 2} ${diamondCx + diamondSize / 2},${diamondCy} ${diamondCx},${diamondCy + diamondSize / 2} ${diamondCx - diamondSize / 2},${diamondCy}`}
          fill={customColors['decision'] ?? diamondFill}
        />
        <text
          x={diamondCx}
          y={diamondCy + 4}
          textAnchor="middle"
          fill={textOnPrimary}
          fontFamily={font}
          fontSize={Math.min(11, diamondSize / 9)}
          fontWeight={700}
        >
          {data.decision}
        </text>
      </g>

      {/* Branches — each <g> contains a small condition pill + outcome rect */}
      {data.branches.map((b, i) => {
        const by = branchY0 + i * (branchH + branchGap);
        const nodeId = `branch-${i}`;
        const fill = customColors[nodeId] ?? branchFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={branchX} y={by} width={branchW} height={branchH} rx={6} ry={6} fill={fill} />
            {/* condition tag */}
            <rect
              x={branchX + 4}
              y={by + 4}
              width={Math.min(80, branchW * 0.35)}
              height={branchH - 8}
              rx={4}
              ry={4}
              fill={conditionFill}
            />
            <text
              x={branchX + 4 + Math.min(80, branchW * 0.35) / 2}
              y={by + branchH / 2 + 4}
              textAnchor="middle"
              fill={textOnPrimary}
              fontFamily={font}
              fontSize={10}
              fontWeight={700}
            >
              {b.condition}
            </text>
            {/* outcome */}
            <text
              x={branchX + Math.min(80, branchW * 0.35) + 12}
              y={by + branchH / 2 + 4}
              textAnchor="start"
              fill={textOnPrimary}
              fontFamily={font}
              fontSize={11}
            >
              {b.outcome}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const flowMultiGatewayPreset: Preset<FlowMultiGatewayData> = {
  id: 'flow-multi-gateway',
  name: 'Multi-Gateway Flow',
  category: 'flow',
  tags: ['process', 'decision', 'gateway', 'multi-branch'],
  description: 'Single decision gateway branching into 3–5 labelled outcomes.',
  aiDescription:
    'Use when the text describes a single decision point with three or more distinct outcomes based on a condition, classification, or severity level. Suits priority triage, multi-option routing, tier-based escalations, or category-based branching. Prefer "flow-decision-yesno" for binary decisions and "flow-branching-1to2" for parallel-execution branches rather than conditional outcomes.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="16" width="22" height="10" rx="2" fill="#1B5B50"/>
  <polygon points="42,20 52,10 62,20 52,30" fill="#2A7A6C"/>
  <rect x="78" y="4" width="36" height="6" rx="1" fill="#4A9A8A"/>
  <rect x="78" y="17" width="36" height="6" rx="1" fill="#4A9A8A"/>
  <rect x="78" y="30" width="36" height="6" rx="1" fill="#4A9A8A"/>
  <line x1="26" y1="21" x2="42" y2="21" stroke="#2A7A6C" stroke-width="1"/>
  <path d="M62 21 C 70 21, 70 7, 78 7" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M62 21 C 70 21, 70 20, 78 20" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M62 21 C 70 21, 70 33, 78 33" stroke="#2A7A6C" stroke-width="1" fill="none"/>
</svg>`,
  render: Render,
  editableFields: ['entry', 'decision', 'branches[].condition', 'branches[].outcome'],
  compatibleFamilies: ['flow', 'process'],
};
