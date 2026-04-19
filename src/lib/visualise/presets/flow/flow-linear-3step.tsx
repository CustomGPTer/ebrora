// =============================================================================
// Preset: flow-linear-3step
// Three sequential steps connected with arrows. Variant of flow-linear-4step
// for simpler processes.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';
import {
  OrderingChip,
  SEQUENTIAL_LABEL_MAX,
  SEQUENTIAL_DETAIL_MAX,
} from '../common';

const dataSchema = z.object({
  steps: z
    .array(
      z.object({
        label: z.string().min(1).max(SEQUENTIAL_LABEL_MAX),
        detail: z.string().max(SEQUENTIAL_DETAIL_MAX).optional(),
      }),
    )
    .length(3),
});

type FlowLinear3StepData = z.infer<typeof dataSchema>;

const defaultData: FlowLinear3StepData = {
  steps: [
    { label: 'Prepare', detail: 'Plan and mobilise' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Close', detail: 'Verify and hand over' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinear3StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const stepFills = gradientSequence(palette, data.steps.length);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;

  const padding = 20;
  const gap = 20;
  const nodeCount = data.steps.length;
  const nodeWidth = (width - padding * 2 - gap * (nodeCount - 1)) / nodeCount;
  const nodeHeight = Math.min(88, height * 0.52);
  const nodeY = (height - nodeHeight) / 2 - 10;
  const detailY = nodeY + nodeHeight + 24;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-linear-3step-arrow"
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

      {data.steps.map((step, i) => {
        const x = padding + i * (nodeWidth + gap);
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? stepFills[i];
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={x}
              y={nodeY}
              width={nodeWidth}
              height={nodeHeight}
              rx={8}
              ry={8}
              fill={fill}
            />
            {/* Batch 2a — ordering chip, top-left of the node rect. */}
            <OrderingChip
              index={i}
              cx={x + 12}
              cy={nodeY + 12}
              fill={palette.accent}
              textColour={palette.accentText}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
            />
            <text
              x={x + nodeWidth / 2}
              y={nodeY + nodeHeight / 2 + 5}
              textAnchor="middle"
              fill={nodeTextFill}
              fontFamily={settings.font ?? 'Inter, sans-serif'}
              fontSize={Math.min(18, nodeWidth / 7)}
              fontWeight={600}
            >
              {step.label}
            </text>
            {step.detail ? (
              <text
                x={x + nodeWidth / 2}
                y={detailY}
                textAnchor="middle"
                fill={detailFill}
                fontFamily={settings.font ?? 'Inter, sans-serif'}
                fontSize={11}
              >
                {step.detail}
              </text>
            ) : null}
            {i < nodeCount - 1 ? (
              <line
                x1={x + nodeWidth + 2}
                y1={nodeY + nodeHeight / 2}
                x2={x + nodeWidth + gap - 4}
                y2={nodeY + nodeHeight / 2}
                stroke={arrowFill}
                strokeWidth={2}
                markerEnd="url(#flow-linear-3step-arrow)"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const flowLinear3StepPreset: Preset<FlowLinear3StepData> = {
  id: 'flow-linear-3step',
  name: 'Linear Flow — 3 Steps',
  category: 'flow',
  tags: ['process', 'sequence', 'simple', 'horizontal'],
  description: 'Three sequential steps connected with arrows.',
  aiDescription:
    '3 steps in a horizontal line with arrows between. Use for simple sequential processes with exactly three stages — e.g. start/middle/end structures, high-level phase summaries, short approval flows. Prefer over 4-step when the text clearly describes three stages and padding a fourth would be artificial.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="12" width="30" height="16" rx="3" fill="#1B5B50"/>
  <rect x="45" y="12" width="30" height="16" rx="3" fill="#1B5B50"/>
  <rect x="84" y="12" width="30" height="16" rx="3" fill="#1B5B50"/>
  <line x1="36" y1="20" x2="45" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="75" y1="20" x2="84" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
