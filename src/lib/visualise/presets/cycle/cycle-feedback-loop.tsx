// =============================================================================
// Preset: cycle-feedback-loop
// Linear forward flow of 4 steps with a large curved feedback arrow arcing
// back from the last step to the first, carrying a labelled pill describing
// what's returned as feedback. Visually distinct from cycle-4step (which is
// a symmetric closed loop): here the forward path is emphasised and the
// feedback arrow is drawn dashed beneath, reading as "system → output →
// measurement → adjustment" rather than "step 1 → 2 → 3 → 4 → 1".
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const stepSchema = z.object({
  label: z.string().min(1).max(20),
  detail: z.string().max(40).optional(),
});

const dataSchema = z.object({
  steps: z.array(stepSchema).length(4),
  feedback: z.object({
    label: z.string().min(1).max(28),
  }),
  systemLabel: z.string().max(24).optional(),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  steps: [
    { label: 'Input', detail: 'Starting conditions' },
    { label: 'Process', detail: 'Work carried out' },
    { label: 'Output', detail: 'Result produced' },
    { label: 'Review', detail: 'Measurement and adjustment' },
  ],
  feedback: { label: 'Feedback signal' },
  systemLabel: 'Feedback loop',
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const forwardColour = paletteColor(paletteId, 0);
  const feedbackColour = paletteColor(paletteId, 1);
  const nodeStroke = paletteColor(paletteId, 5);
  const labelText = paletteColor(paletteId, 5);
  const detailText = paletteColor(paletteId, 0);

  const n = 4;
  const paddingX = 40;
  const topY = height * 0.38; // forward row sits above centre so the feedback arc has space below
  const nodeW = Math.min(140, (width - paddingX * 2) / (n + 0.5));
  const nodeH = 64;
  const gap = (width - paddingX * 2 - nodeW * n) / (n - 1);

  const stepPositions = Array.from({ length: n }, (_, i) => ({
    x: paddingX + i * (nodeW + gap),
    y: topY - nodeH / 2,
    cx: paddingX + i * (nodeW + gap) + nodeW / 2,
    cy: topY,
  }));

  // Forward arrow endpoints between consecutive steps (right edge of step i → left edge of step i+1)
  const forwardArrow = (i: number): { x1: number; y1: number; x2: number; y2: number } => {
    const a = stepPositions[i];
    const b = stepPositions[i + 1];
    return { x1: a.x + nodeW, y1: a.cy, x2: b.x - 2, y2: b.cy };
  };

  // Feedback arc — from bottom-centre of last step down around to bottom-centre of first step.
  const firstCx = stepPositions[0].cx;
  const firstBottom = stepPositions[0].y + nodeH;
  const lastCx = stepPositions[n - 1].cx;
  const lastBottom = stepPositions[n - 1].y + nodeH;
  const arcLowY = Math.min(height - 40, topY + nodeH * 1.5);
  const feedbackPath =
    `M ${lastCx} ${lastBottom} ` +
    `C ${lastCx} ${arcLowY}, ${firstCx} ${arcLowY}, ${firstCx} ${firstBottom + 8}`;
  const feedbackMidX = (firstCx + lastCx) / 2;
  const feedbackMidY = arcLowY + 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="fb-forward-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={forwardColour} />
        </marker>
        <marker
          id="fb-feedback-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={feedbackColour} />
        </marker>
      </defs>

      {/* System label (optional) — top of canvas */}
      {data.systemLabel ? (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fontFamily={font}
          fontSize={12}
          fontWeight={600}
          fill={forwardColour}
          opacity={0.85}
        >
          {truncate(data.systemLabel, 24)}
        </text>
      ) : null}

      {/* Forward arrows between consecutive steps */}
      {Array.from({ length: n - 1 }, (_, i) => {
        const a = forwardArrow(i);
        return (
          <line
            key={`fwd-${i}`}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            stroke={forwardColour}
            strokeWidth={2.5}
            markerEnd="url(#fb-forward-arrow)"
          />
        );
      })}

      {/* Feedback arc — dashed to differentiate from forward flow */}
      <g data-id="feedback">
        <path
          d={feedbackPath}
          fill="none"
          stroke={feedbackColour}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          markerEnd="url(#fb-feedback-arrow)"
        />
        {/* Label pill at the bottom of the arc */}
        <rect
          x={feedbackMidX - 80}
          y={feedbackMidY - 11}
          width={160}
          height={22}
          rx={11}
          ry={11}
          fill={customColors['feedback'] ?? feedbackColour}
          stroke={nodeStroke}
          strokeWidth={1}
        />
        <text
          x={feedbackMidX}
          y={feedbackMidY + 4}
          textAnchor="middle"
          fontFamily={font}
          fontSize={11}
          fontWeight={700}
          fill={labelText}
        >
          {truncate(data.feedback.label, 26)}
        </text>
      </g>

      {/* Step nodes */}
      {data.steps.map((step, i) => {
        const pos = stepPositions[i];
        const nodeId = `step-${i}`;
        const fill = customColors[nodeId] ?? paletteColor(paletteId, i % 4);
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={pos.x}
              y={pos.y}
              width={nodeW}
              height={nodeH}
              rx={8}
              ry={8}
              fill={fill}
              stroke={nodeStroke}
              strokeWidth={1.5}
            />
            <text
              x={pos.cx}
              y={step.detail ? pos.cy - 4 : pos.cy + 4}
              textAnchor="middle"
              fontFamily={font}
              fontSize={13}
              fontWeight={700}
              fill={labelText}
            >
              {truncate(step.label, 16)}
            </text>
            {step.detail ? (
              <text
                x={pos.cx}
                y={pos.cy + 12}
                textAnchor="middle"
                fontFamily={font}
                fontSize={10}
                fill={labelText}
                opacity={0.85}
              >
                {truncate(step.detail, 22)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Step-4-to-step-1 connection back up (small riser above the label pill so
          the loop visually closes into the start node) */}
      <line
        x1={firstCx}
        y1={firstBottom + 8}
        x2={firstCx}
        y2={firstBottom + 1}
        stroke={feedbackColour}
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />

      {/* Detail labels for each step sit above — optional; subtitles for detail
          already drawn inside node. Left empty intentionally. */}
    </svg>
  );
}

export const cycleFeedbackLoopPreset: Preset<Data> = {
  id: 'cycle-feedback-loop',
  name: 'Feedback Loop',
  category: 'cycle',
  tags: ['cycle', 'feedback', 'loop', 'system', 'control'],
  description: 'Four linear steps with a labelled feedback arrow returning to the start.',
  aiDescription:
    'Use when the text describes a system with a distinct forward flow and a separate feedback signal that closes back on the start — e.g. measurement-driven adjustment, output-monitoring loops, closed-loop control. The four steps read left-to-right; the dashed arc underneath carries a label describing what is fed back. Prefer "cycle-4step" or "cycle-6step" when every stage is a peer phase in a symmetric loop (no distinct "feedback" channel); prefer "process-pdca" when the content is explicitly Plan-Do-Check-Act quadrants. Do NOT use unless the text explicitly describes a feedback mechanism that closes the loop — a plain linear process is NOT a feedback loop.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="10" width="20" height="12" rx="2" fill="#1B5B50"/>
  <rect x="32" y="10" width="20" height="12" rx="2" fill="#2A7A6C"/>
  <rect x="60" y="10" width="20" height="12" rx="2" fill="#4A9A8A"/>
  <rect x="88" y="10" width="20" height="12" rx="2" fill="#7EBFB2"/>
  <line x1="24" y1="16" x2="32" y2="16" stroke="#1B5B50" stroke-width="1.2"/>
  <line x1="52" y1="16" x2="60" y2="16" stroke="#1B5B50" stroke-width="1.2"/>
  <line x1="80" y1="16" x2="88" y2="16" stroke="#1B5B50" stroke-width="1.2"/>
  <path d="M98 22 C 98 34, 14 34, 14 22" stroke="#2A7A6C" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>
</svg>`,
  render: Render,
  editableFields: ['steps[].label', 'steps[].detail', 'feedback.label', 'systemLabel'],
  compatibleFamilies: ['cycle', 'flow', 'process'],
};
