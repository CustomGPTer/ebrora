// =============================================================================
// Preset: flow-linear-5step
// Five sequential steps connected with arrows. Variant of flow-linear-4step
// for longer processes. Tighter node widths, slightly smaller text.
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
    .length(5),
});

type FlowLinear5StepData = z.infer<typeof dataSchema>;

const defaultData: FlowLinear5StepData = {
  steps: [
    { label: 'Plan', detail: 'Define scope' },
    { label: 'Design', detail: 'Develop solution' },
    { label: 'Prepare', detail: 'Mobilise resources' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Handover', detail: 'Verify and close' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinear5StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const stepFills = gradientSequence(palette, data.steps.length);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;

  const padding = 16;
  const gap = 12;
  const nodeCount = data.steps.length;
  const nodeWidth = (width - padding * 2 - gap * (nodeCount - 1)) / nodeCount;
  const nodeHeight = Math.min(72, height * 0.45);
  const nodeY = (height - nodeHeight) / 2 - 12;
  const detailY = nodeY + nodeHeight + 22;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-linear-5step-arrow"
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
              rx={7}
              ry={7}
              fill={fill}
            />
            {/* Batch 2a — ordering chip, top-left of the node rect. Slightly
                smaller radius than 3/4-step because the boxes are narrower. */}
            <OrderingChip
              index={i}
              cx={x + 10}
              cy={nodeY + 10}
              radius={8}
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
              fontSize={Math.min(14, nodeWidth / 7)}
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
                fontSize={10}
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
                markerEnd="url(#flow-linear-5step-arrow)"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const flowLinear5StepPreset: Preset<FlowLinear5StepData> = {
  id: 'flow-linear-5step',
  name: 'Linear Flow — 5 Steps',
  category: 'flow',
  tags: ['process', 'sequence', 'horizontal', 'extended'],
  description: 'Five sequential steps connected with arrows.',
  aiDescription:
    '5 steps in a horizontal line with arrows between. Use for longer sequential processes — e.g. full project lifecycles (plan/design/prepare/execute/handover), five-stage method statements, or extended approval flows. Prefer over 4-step when the text genuinely describes five distinct stages; do not pad or split to hit five.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="13" width="18" height="14" rx="2" fill="#1B5B50"/>
  <rect x="25" y="13" width="18" height="14" rx="2" fill="#1B5B50"/>
  <rect x="47" y="13" width="18" height="14" rx="2" fill="#1B5B50"/>
  <rect x="69" y="13" width="18" height="14" rx="2" fill="#1B5B50"/>
  <rect x="91" y="13" width="18" height="14" rx="2" fill="#1B5B50"/>
  <line x1="21" y1="20" x2="25" y2="20" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="43" y1="20" x2="47" y2="20" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="65" y1="20" x2="69" y2="20" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="87" y1="20" x2="91" y2="20" stroke="#2A7A6C" stroke-width="1.2"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
