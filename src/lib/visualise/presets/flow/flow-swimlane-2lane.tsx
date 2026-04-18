// =============================================================================
// Preset: flow-swimlane-2lane
// Two horizontal swimlanes, each with a named actor/role and a sequence of
// 2–5 steps. Handoffs between lanes are conveyed by the step ordering
// (optional cross-lane arrows left to a canvas-editor annotation pass).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const stepSchema = z.object({
  label: z.string().min(1).max(32),
});

const laneSchema = z.object({
  name: z.string().min(1).max(28),
  steps: z.array(stepSchema).min(2).max(5),
});

const dataSchema = z.object({
  lanes: z.array(laneSchema).length(2),
});

type FlowSwimlane2LaneData = z.infer<typeof dataSchema>;

const defaultData: FlowSwimlane2LaneData = {
  lanes: [
    {
      name: 'Requester',
      steps: [
        { label: 'Submit request' },
        { label: 'Clarify details' },
        { label: 'Accept outcome' },
      ],
    },
    {
      name: 'Reviewer',
      steps: [
        { label: 'Receive and log' },
        { label: 'Assess and decide' },
        { label: 'Communicate result' },
      ],
    },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowSwimlane2LaneData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const laneBg = paletteColor(paletteId, 4);
  const laneHeader = paletteColor(paletteId, 0);
  const laneHeaderText = paletteColor(paletteId, 5);
  const stepFill = paletteColor(paletteId, 2);
  const stepText = paletteColor(paletteId, 5);
  const arrowColour = paletteColor(paletteId, 1);

  const pad = 10;
  const laneHeaderW = 100;
  const laneGap = 8;
  const laneH = (height - pad * 2 - laneGap) / 2;
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
          id="flow-swimlane-2lane-arrow"
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
        const stepGap = 10;
        const stepCount = lane.steps.length;
        const stepW = (lanesW - stepGap * (stepCount - 1) - 12) / stepCount;
        const stepH = Math.min(40, laneH - 20);
        const stepY = laneY + (laneH - stepH) / 2;

        return (
          <g key={`lane-${li}`}>
            <rect
              x={pad}
              y={laneY}
              width={width - pad * 2}
              height={laneH}
              rx={6}
              ry={6}
              fill={laneBg}
            />

            <g data-id={`lane-${li}`}>
              <rect
                x={pad}
                y={laneY}
                width={laneHeaderW}
                height={laneH}
                rx={6}
                ry={6}
                fill={customColors[`lane-${li}`] ?? laneHeader}
              />
              <rect
                x={pad + laneHeaderW - 6}
                y={laneY}
                width={6}
                height={laneH}
                fill={customColors[`lane-${li}`] ?? laneHeader}
              />
              <text
                x={pad + laneHeaderW / 2}
                y={laneY + laneH / 2 + 4}
                textAnchor="middle"
                fill={laneHeaderText}
                fontFamily={font}
                fontSize={12}
                fontWeight={700}
              >
                {lane.name}
              </text>
            </g>

            {lane.steps.map((step, si) => {
              const sx = lanesX + 6 + si * (stepW + stepGap);
              const nodeId = `lane-${li}-step-${si}`;
              const fill = customColors[nodeId] ?? stepFill;
              return (
                <g key={nodeId} data-id={nodeId}>
                  <rect x={sx} y={stepY} width={stepW} height={stepH} rx={6} ry={6} fill={fill} />
                  <text
                    x={sx + stepW / 2}
                    y={stepY + stepH / 2 + 4}
                    textAnchor="middle"
                    fill={stepText}
                    fontFamily={font}
                    fontSize={Math.min(12, stepW / 8)}
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
                      markerEnd="url(#flow-swimlane-2lane-arrow)"
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

export const flowSwimlane2LanePreset: Preset<FlowSwimlane2LaneData> = {
  id: 'flow-swimlane-2lane',
  name: 'Swimlane Flow — 2 Lanes',
  category: 'flow',
  tags: ['process', 'swimlane', 'responsibility', 'handoff'],
  description: 'Two swimlanes (roles/teams) each with a sequence of steps.',
  aiDescription:
    'Use when the text describes a process involving exactly two distinct actors, teams, or roles, each performing a sequence of steps with handoffs between them. Common for any two-party process — requester vs reviewer, site vs office, sender vs recipient. Prefer "flow-swimlane-3lane" for three actors. Prefer a RACI-style preset when the text is about responsibility assignment per task rather than a process flow.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="3" width="116" height="16" rx="2" fill="#B5DAD2"/>
  <rect x="2" y="21" width="116" height="16" rx="2" fill="#B5DAD2"/>
  <rect x="2" y="3" width="24" height="16" rx="2" fill="#1B5B50"/>
  <rect x="2" y="21" width="24" height="16" rx="2" fill="#1B5B50"/>
  <rect x="30" y="7" width="22" height="8" rx="1" fill="#4A9A8A"/>
  <rect x="56" y="7" width="22" height="8" rx="1" fill="#4A9A8A"/>
  <rect x="82" y="7" width="22" height="8" rx="1" fill="#4A9A8A"/>
  <rect x="30" y="25" width="22" height="8" rx="1" fill="#4A9A8A"/>
  <rect x="56" y="25" width="22" height="8" rx="1" fill="#4A9A8A"/>
  <rect x="82" y="25" width="22" height="8" rx="1" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['lanes[].name', 'lanes[].steps[].label'],
  compatibleFamilies: ['flow', 'process'],
};
