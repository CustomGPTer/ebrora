// =============================================================================
// Preset: flow-linear-vertical-4step
// Four sequential steps stacked vertically with down-arrows between. Same
// data shape as flow-linear-4step — just a vertical layout, which the
// preset-cycling pass-through in the canvas editor can reuse.
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

type FlowLinearVertical4StepData = z.infer<typeof dataSchema>;

const defaultData: FlowLinearVertical4StepData = {
  steps: [
    { label: 'Plan', detail: 'Define scope and resources' },
    { label: 'Prepare', detail: 'Mobilise site and permits' },
    { label: 'Execute', detail: 'Deliver the works' },
    { label: 'Verify', detail: 'Inspect and hand over' },
  ],
};

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowLinearVertical4StepData>): ReactElement {
  const { paletteId, customColors } = settings;
  const palette = getPalette(paletteId);
  const stepFills = gradientSequence(palette, data.steps.length);
  const nodeTextFill = palette.text;
  const arrowFill = palette.nodeStroke;
  const detailFill = palette.nodeStroke;
  const font = settings.font ?? 'Inter, sans-serif';

  // Centred column. Node block = [label-box | detail-text to the right].
  const padTop = 20;
  const padBottom = 20;
  const nodeCount = data.steps.length;
  const gap = 18;
  const availableH = height - padTop - padBottom;
  const nodeHeight = Math.min(58, (availableH - gap * (nodeCount - 1)) / nodeCount);
  const totalH = nodeHeight * nodeCount + gap * (nodeCount - 1);
  const startY = padTop + (availableH - totalH) / 2;

  const labelBoxW = Math.min(220, width * 0.32);
  const labelBoxX = (width - labelBoxW) / 2 - 100;
  const detailX = labelBoxX + labelBoxW + 20;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="flow-linear-v4-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="9"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 0 L 5 10 z" fill={arrowFill} />
        </marker>
      </defs>

      {data.steps.map((step, i) => {
        const y = startY + i * (nodeHeight + gap);
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? stepFills[i];
        const centreX = labelBoxX + labelBoxW / 2;
        const bottomY = y + nodeHeight;
        const nextTopY = y + nodeHeight + gap;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={labelBoxX}
              y={y}
              width={labelBoxW}
              height={nodeHeight}
              rx={8}
              ry={8}
              fill={fill}
            />
            {/* Batch 2a — ordering chip, top-left of each vertical row. */}
            <OrderingChip
              index={i}
              cx={labelBoxX + 12}
              cy={y + 12}
              fill={palette.accent}
              textColour={palette.accentText}
              fontFamily={font}
            />
            <text
              x={centreX}
              y={y + nodeHeight / 2 + 5}
              textAnchor="middle"
              fill={nodeTextFill}
              fontFamily={font}
              fontSize={15}
              fontWeight={600}
            >
              {step.label}
            </text>
            {step.detail ? (
              <text
                x={detailX}
                y={y + nodeHeight / 2 + 4}
                textAnchor="start"
                fill={detailFill}
                fontFamily={font}
                fontSize={12}
              >
                {step.detail}
              </text>
            ) : null}
            {i < nodeCount - 1 ? (
              <line
                x1={centreX}
                y1={bottomY + 2}
                x2={centreX}
                y2={nextTopY - 4}
                stroke={arrowFill}
                strokeWidth={2}
                markerEnd="url(#flow-linear-v4-arrow)"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const flowLinearVertical4StepPreset: Preset<FlowLinearVertical4StepData> = {
  id: 'flow-linear-vertical-4step',
  name: 'Linear Flow — Vertical, 4 Steps',
  category: 'flow',
  tags: ['process', 'sequence', 'vertical', 'stack'],
  description: 'Four sequential steps stacked vertically with down-arrows.',
  aiDescription:
    '4 steps stacked vertically with arrows pointing downward. Use when the sequence is naturally top-to-bottom — e.g. escalation paths, vertical reporting sequences, onboarding stages presented in a narrow column. Equivalent data shape to flow-linear-4step; prefer vertical when the text implies ascent/descent or a strict ordering that reads down.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="42" y="3" width="36" height="7" rx="1.5" fill="#1B5B50"/>
  <rect x="42" y="12" width="36" height="7" rx="1.5" fill="#1B5B50"/>
  <rect x="42" y="21" width="36" height="7" rx="1.5" fill="#1B5B50"/>
  <rect x="42" y="30" width="36" height="7" rx="1.5" fill="#1B5B50"/>
  <line x1="60" y1="10" x2="60" y2="12" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="19" x2="60" y2="21" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="28" x2="60" y2="30" stroke="#2A7A6C" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail'],
  compatibleFamilies: ['flow', 'process'],
};
