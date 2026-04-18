// =============================================================================
// Preset: flow-decision-yesno
// Entry box → diamond decision → yes/no branches to outcome boxes.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette } from '../../palettes';

const dataSchema = z.object({
  entry: z.string().min(1).max(40),
  question: z.string().min(1).max(60),
  yesLabel: z.string().min(1).max(32).default('Yes'),
  noLabel: z.string().min(1).max(32).default('No'),
  yesOutcome: z.string().min(1).max(40),
  noOutcome: z.string().min(1).max(40),
});

type FlowDecisionYesNoData = z.infer<typeof dataSchema>;

const defaultData: FlowDecisionYesNoData = {
  entry: 'RAMS received',
  question: 'Approved by PC?',
  yesLabel: 'Yes',
  noLabel: 'No',
  yesOutcome: 'Issue to site',
  noOutcome: 'Return for rework',
};

function FlowDecisionYesNoRender({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowDecisionYesNoData>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const boxFill = palette.nodeFill;
  const diamondFill = palette.nodeStroke;
  const yesFill = palette.nodeFill;
  const noFill = palette.accent;
  const textLight = palette.text;
  const lineColor = palette.nodeStroke;
  const font = settings.font ?? 'Inter, sans-serif';
  const cx = width / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="fd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={lineColor} />
        </marker>
      </defs>

      <g data-id="entry">
        <rect x={cx - 70} y={16} width={140} height={42} rx={8} fill={boxFill} />
        <text x={cx} y={42} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={13} fontWeight={600}>{truncate(data.entry, 20)}</text>
      </g>

      <line x1={cx} y1={58} x2={cx} y2={78} stroke={lineColor} strokeWidth={2} markerEnd="url(#fd-arrow)" />

      <g data-id="decision">
        <polygon points={`${cx},82 ${cx + 90},${height / 2} ${cx},${height - 82} ${cx - 90},${height / 2}`} fill={diamondFill} />
        <text x={cx} y={height / 2 + 4} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={12} fontWeight={600}>{truncate(data.question, 22)}</text>
      </g>

      <line x1={cx - 90} y1={height / 2} x2={40} y2={height / 2} stroke={lineColor} strokeWidth={2} markerEnd="url(#fd-arrow)" />
      <text x={cx - 55} y={height / 2 - 6} textAnchor="middle" fill={palette.nodeStroke} fontFamily={font} fontSize={11} fontWeight={600}>{data.noLabel}</text>

      <line x1={cx + 90} y1={height / 2} x2={width - 40} y2={height / 2} stroke={lineColor} strokeWidth={2} markerEnd="url(#fd-arrow)" />
      <text x={cx + 55} y={height / 2 - 6} textAnchor="middle" fill={palette.nodeStroke} fontFamily={font} fontSize={11} fontWeight={600}>{data.yesLabel}</text>

      <g data-id="no-outcome">
        <rect x={8} y={height / 2 - 21} width={100} height={42} rx={8} fill={noFill} />
        <text x={58} y={height / 2 + 4} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={12} fontWeight={600}>{truncate(data.noOutcome, 16)}</text>
      </g>

      <g data-id="yes-outcome">
        <rect x={width - 108} y={height / 2 - 21} width={100} height={42} rx={8} fill={yesFill} />
        <text x={width - 58} y={height / 2 + 4} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={12} fontWeight={600}>{truncate(data.yesOutcome, 16)}</text>
      </g>
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const flowDecisionYesNoPreset: Preset<FlowDecisionYesNoData> = {
  id: 'flow-decision-yesno',
  name: 'Decision Flow — Yes/No',
  category: 'flow',
  tags: ['decision', 'branching', 'logic'],
  description: 'Entry, a yes/no question, and two outcome branches.',
  aiDescription: 'Diamond-decision flow with a single yes/no question and two outcome boxes. Use for binary approval gates, go/no-go checks, or simple conditional workflows.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="2" width="20" height="8" rx="2" fill="#1B5B50"/>
  <polygon points="60,14 72,20 60,26 48,20" fill="#2A7A6C"/>
  <rect x="4" y="30" width="26" height="8" rx="2" fill="#7EBFB2"/>
  <rect x="90" y="30" width="26" height="8" rx="2" fill="#4A9A8A"/>
  <line x1="60" y1="10" x2="60" y2="14" stroke="#4A9A8A"/>
  <line x1="48" y1="20" x2="17" y2="34" stroke="#4A9A8A"/>
  <line x1="72" y1="20" x2="103" y2="34" stroke="#4A9A8A"/>
</svg>`,
  render: FlowDecisionYesNoRender,
  editableFields: ['entry', 'question', 'yesLabel', 'noLabel', 'yesOutcome', 'noOutcome'],
  compatibleFamilies: ['flow'],
};
