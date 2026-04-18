// =============================================================================
// Preset: con-hierarchy-of-controls
// Hierarchy of Controls — ERICPD inverted pyramid, most effective at top.
// Eliminate → Reduce → Isolate → Control → PPE → Discipline/Behavioural.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence } from '../../palettes';

const dataSchema = z.object({
  levels: z.array(z.object({
    name: z.string().min(1).max(20),
    detail: z.string().max(80).optional(),
  })).length(6).default([
    { name: 'Eliminate', detail: 'Remove the hazard entirely' },
    { name: 'Reduce', detail: 'Substitute lower-risk alternatives' },
    { name: 'Isolate', detail: 'Separate people from the hazard' },
    { name: 'Control', detail: 'Engineering / procedural controls' },
    { name: 'PPE', detail: 'Personal protective equipment' },
    { name: 'Discipline', detail: 'Behavioural / admin controls' },
  ]),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  levels: [
    { name: 'Eliminate', detail: 'Remove the hazard entirely' },
    { name: 'Reduce', detail: 'Substitute lower-risk alternatives' },
    { name: 'Isolate', detail: 'Separate people from the hazard' },
    { name: 'Control', detail: 'Engineering / procedural controls' },
    { name: 'PPE', detail: 'Personal protective equipment' },
    { name: 'Discipline', detail: 'Behavioural / admin controls' },
  ],
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const font = settings.font ?? 'Inter, sans-serif';
  // Per handover Pattern D: Elimination (level 0) uses accent to flag it as the
  // most effective control; the remaining 5 use a gradient dark → light that
  // visually decays as effectiveness drops.
  const tierFills = gradientSequence(palette, 6, { from: palette.nodeFill, to: palette.bg });
  tierFills[0] = palette.accent;
  const textLight = palette.text;
  const accentTextFill = palette.accentText;
  const detailText = palette.nodeFill;
  const arrowColour = palette.nodeStroke;
  const effectivenessColour = palette.nodeStroke;

  // Inverted pyramid: top is widest (most effective), bottom is narrowest (least).
  const padding = 24;
  const usableH = height - padding * 2;
  const usableW = width - padding * 2 - 180; // leave room for detail text on right
  const apex = padding + 20;
  const tierCount = 6;
  const tierH = usableH / tierCount;

  const effectiveness = ['Most effective', '', '', '', '', 'Least effective'];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Effectiveness arrow down the left */}
      <defs>
        <marker id="hoc-arrow" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 9 L 10 0 z" fill={arrowColour} />
        </marker>
      </defs>
      <line x1={padding + 8} y1={apex} x2={padding + 8} y2={apex + usableH - 6} stroke={arrowColour} strokeWidth={2} markerEnd="url(#hoc-arrow)" />

      {data.levels.map((level, i) => {
        const top = apex + i * tierH;
        const bottom = top + tierH;
        // Width decreases from top to bottom (inverted pyramid).
        const topWidth = usableW * (1 - (i / tierCount) * 0.85);
        const bottomWidth = usableW * (1 - ((i + 1) / tierCount) * 0.85);
        const centreX = padding + 24 + usableW / 2;
        const tL = centreX - topWidth / 2;
        const tR = centreX + topWidth / 2;
        const bL = centreX - bottomWidth / 2;
        const bR = centreX + bottomWidth / 2;
        const fill = tierFills[i];
        // Level 0 sits on accent → accentText; levels 1-3 sit on dark-ish gradient → text;
        // levels 4-5 sit on light gradient → need dark text (nodeFill).
        const textColor = i === 0 ? accentTextFill : (i < 4 ? textLight : detailText);
        const nodeId = `level-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <polygon points={`${tL},${top} ${tR},${top} ${bR},${bottom} ${bL},${bottom}`} fill={fill} stroke={palette.bg} strokeWidth={1.5} />
            <text x={centreX} y={top + tierH / 2 + 4} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={700} fill={textColor}>
              {level.name}
            </text>
            {/* Detail text to the right */}
            {level.detail ? (
              <text x={padding + 24 + usableW + 12} y={top + tierH / 2 + 4} fontFamily={font} fontSize={11} fill={detailText}>
                {truncate(level.detail, 28)}
              </text>
            ) : null}
            {/* Effectiveness notes */}
            {effectiveness[i] ? (
              <text x={padding + 18} y={top + 14} fontFamily={font} fontSize={9} fill={effectivenessColour} fontWeight={600}>
                {effectiveness[i]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const conHierarchyOfControlsPreset: Preset<Data> = {
  id: 'con-hierarchy-of-controls',
  name: 'Hierarchy of Controls (ERICPD)',
  category: 'construction',
  tags: ['ericpd', 'risk-control', 'hierarchy', 'hsg'],
  description: 'ERICPD hierarchy — Eliminate, Reduce, Isolate, Control, PPE, Discipline.',
  aiDescription: 'Standard Hierarchy of Controls inverted pyramid: Eliminate (most effective) → Reduce → Isolate → Control → PPE → Discipline (least effective). Use whenever the text discusses risk control strategies, H&S mitigation options, or HSG reference material. Each level can have an optional one-line detail.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="2" width="80" height="5" fill="#1B5B50"/>
  <rect x="26" y="8" width="68" height="5" fill="#2A7A6C"/>
  <rect x="32" y="14" width="56" height="5" fill="#4A9A8A"/>
  <rect x="38" y="20" width="44" height="5" fill="#7EBFB2"/>
  <rect x="44" y="26" width="32" height="5" fill="#B5DAD2"/>
  <rect x="50" y="32" width="20" height="5" fill="#E6F0EE"/>
</svg>`,
  render: Render,
  editableFields: ['levels[].name', 'levels[].detail'],
  compatibleFamilies: ['construction', 'hierarchy', 'funnel-pyramid'],
};
