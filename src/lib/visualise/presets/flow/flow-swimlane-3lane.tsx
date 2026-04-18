// =============================================================================
// Preset: flow-swimlane-3lane
// Three horizontal swimlanes, each with a named actor/role and a sequence of
// 2–4 steps. Used for cross-functional process flows with three distinct
// participants (e.g. client → PM → subcontractor).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence, lighten } from '../../palettes';

const stepSchema = z.object({
  label: z.string().min(1).max(28),
});

const laneSchema = z.object({
  name: z.string().min(1).max(24),
  steps: z.array(stepSchema).min(2).max(4),
});

const dataSchema = z.object({
  lanes: z.array(laneSchema).length(3),
});

type FlowSwimlane3LaneData = z.infer<typeof dataSchema>;

const defaultData: FlowSwimlane3LaneData = {
  lanes: [
    {
      name: 'Client',
      steps: [
        { label: 'Issue instruction' },
        { label: 'Approve quotation' },
        { label: 'Accept delivery' },
      ],
    },
    {
      name: 'Project manager',
      steps: [
        { label: 'Scope and price' },
        { label: 'Instruct works' },
        { label: 'Certify completion' },
      ],
    },
    {
      name: 'Subcontractor',
      steps: [
        { label: 'Mobilise' },
        { label: 'Execute works' },
        { label: 'Hand over' },
      ],
    },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowSwimlane3LaneData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const laneBg = lighten(palette.nodeFill, 0.92);
  const laneHeader = palette.nodeFill;
  const laneHeaderText = palette.text;
  const stepText = palette.text;
  const arrowColour = palette.nodeStroke;

  const pad = 8;
  const laneHeaderW = 92;
  const laneGap = 6;
  const laneH = (height - pad * 2 - laneGap * 2) / 3;
  const lanesX = pad + laneHeaderW;
  const lanesW = width - pad * 2 - laneHeaderW;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-swimlane-3lane-arrow"
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

      {data.lanes.map((lane, li) => {
        const laneY = pad + li * (laneH + laneGap);
        const stepGap = 8;
        const stepCount = lane.steps.length;
        const stepW = (lanesW - stepGap * (stepCount - 1) - 12) / stepCount;
        const stepH = Math.min(36, laneH - 14);
        const stepY = laneY + (laneH - stepH) / 2;
        const stepFills = gradientSequence(palette, stepCount);

        return (
          <g key={`lane-${li}`}>
            <rect
              x={pad}
              y={laneY}
              width={width - pad * 2}
              height={laneH}
              rx={5}
              ry={5}
              fill={laneBg}
            />

            <g data-id={`lane-${li}`}>
              <rect
                x={pad}
                y={laneY}
                width={laneHeaderW}
                height={laneH}
                rx={5}
                ry={5}
                fill={customColors[`lane-${li}`] ?? laneHeader}
              />
              <rect
                x={pad + laneHeaderW - 5}
                y={laneY}
                width={5}
                height={laneH}
                fill={customColors[`lane-${li}`] ?? laneHeader}
              />
              <text
                x={pad + laneHeaderW / 2}
                y={laneY + laneH / 2 + 4}
                textAnchor="middle"
                fill={laneHeaderText}
                fontFamily={font}
                fontSize={11}
                fontWeight={700}
              >
                {lane.name}
              </text>
            </g>

            {lane.steps.map((step, si) => {
              const sx = lanesX + 6 + si * (stepW + stepGap);
              const nodeId = `lane-${li}-step-${si}`;
              const fill = customColors[nodeId] ?? stepFills[si];
              return (
                <g key={nodeId} data-id={nodeId}>
                  <rect x={sx} y={stepY} width={stepW} height={stepH} rx={5} ry={5} fill={fill} />
                  <text
                    x={sx + stepW / 2}
                    y={stepY + stepH / 2 + 4}
                    textAnchor="middle"
                    fill={stepText}
                    fontFamily={font}
                    fontSize={Math.min(11, stepW / 8)}
                    fontWeight={600}
                  >
                    {step.label}
                  </text>
                  {si < stepCount - 1 ? (
                    <line
                      x1={sx + stepW + 1}
                      y1={stepY + stepH / 2}
                      x2={sx + stepW + stepGap - 2}
                      y2={stepY + stepH / 2}
                      stroke={arrowColour}
                      strokeWidth={1.5}
                      markerEnd="url(#flow-swimlane-3lane-arrow)"
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export const flowSwimlane3LanePreset: Preset<FlowSwimlane3LaneData> = {
  id: 'flow-swimlane-3lane',
  name: 'Swimlane Flow — 3 Lanes',
  category: 'flow',
  tags: ['process', 'swimlane', 'responsibility', 'cross-functional'],
  description: 'Three swimlanes (roles/teams) each with a sequence of steps.',
  aiDescription:
    'Use when the process involves exactly three distinct actors, teams, or roles, each taking turns or acting in parallel with handoffs between them. Common for client → manager → contractor workflows, design-review chains with multiple approvers, or procurement flows spanning requester, approver, and supplier. Use "flow-swimlane-2lane" for two actors.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="116" height="11" rx="2" fill="#B5DAD2"/>
  <rect x="2" y="15" width="116" height="11" rx="2" fill="#B5DAD2"/>
  <rect x="2" y="28" width="116" height="10" rx="2" fill="#B5DAD2"/>
  <rect x="2" y="2" width="22" height="11" rx="2" fill="#1B5B50"/>
  <rect x="2" y="15" width="22" height="11" rx="2" fill="#1B5B50"/>
  <rect x="2" y="28" width="22" height="10" rx="2" fill="#1B5B50"/>
  <rect x="28" y="5" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="58" y="5" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="88" y="5" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="28" y="18" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="58" y="18" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="88" y="18" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="28" y="30" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="58" y="30" width="26" height="5" rx="1" fill="#4A9A8A"/>
  <rect x="88" y="30" width="26" height="5" rx="1" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['lanes[].name', 'lanes[].steps[].label'],
  compatibleFamilies: ['flow', 'process'],
};
