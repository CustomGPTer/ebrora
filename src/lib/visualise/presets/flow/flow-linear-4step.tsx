// =============================================================================
// Preset: flow-linear-4step
// Four sequential steps connected with arrows. Classic process flow.
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
    .length(4),
});

type FlowLinear4StepData = z.infer<typeof dataSchema>;

const defaultData: FlowLinear4StepData = {
  steps: [
    { label: 'Plan', detail: 'Define scope and resources' },
    { label: 'Prepare', detail: 'Mobilise site and permits' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Verify', detail: 'Inspect and hand over' },
  ],
};

function FlowLinear4StepRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinear4StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const stepFills = gradientSequence(palette, data.steps.length);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;

  const padding = 20;
  const gap = 16;
  const nodeCount = data.steps.length;
  const nodeWidth = (width - padding * 2 - gap * (nodeCount - 1)) / nodeCount;
  const nodeHeight = Math.min(80, height * 0.5);
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
          id="flow-linear-4step-arrow"
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
            {/* Batch 2a — ordering chip. Sits at the top-left of the rect
                so arrows between nodes don't get cluttered by it. */}
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
              fontSize={Math.min(16, nodeWidth / 7)}
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
                markerEnd="url(#flow-linear-4step-arrow)"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const flowLinear4StepPreset: Preset<FlowLinear4StepData> = {
  id: 'flow-linear-4step',
  name: 'Linear Flow — 4 Steps',
  category: 'flow',
  tags: ['process', 'sequence', 'simple', 'horizontal'],
  description: 'Four sequential steps connected with arrows.',
  aiDescription:
    '4 steps in a horizontal line with arrows between. Use for simple sequential processes where each stage follows directly from the previous one. Good for method statements, onboarding flows, and delivery sequences.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="12" width="22" height="16" rx="3" fill="#1B5B50"/>
  <rect x="34" y="12" width="22" height="16" rx="3" fill="#1B5B50"/>
  <rect x="64" y="12" width="22" height="16" rx="3" fill="#1B5B50"/>
  <rect x="94" y="12" width="22" height="16" rx="3" fill="#1B5B50"/>
  <line x1="26" y1="20" x2="34" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="56" y1="20" x2="64" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="86" y1="20" x2="94" y2="20" stroke="#2A7A6C" stroke-width="1.5"/>
</svg>`,
  render: FlowLinear4StepRender,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
