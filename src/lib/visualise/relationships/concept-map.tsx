// =============================================================================
// Preset: concept-map
// Web of 6 concept nodes with labelled relationship edges between them.
// Unlike mindmap (radial from one centre) or network-hub-spoke (centred hub),
// a concept map has no focal point — nodes connect to any other node with
// a labelled verb phrase ("leads to", "depends on", etc.).
//
// Concepts fixed at 6 for predictable placement around an ellipse; link count
// variable 4–8. Links reference concept indices by number.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const conceptSchema = z.object({
  label: z.string().min(1).max(24),
});

const linkSchema = z.object({
  from: z.number().int().min(0).max(5),
  to: z.number().int().min(0).max(5),
  label: z.string().min(1).max(18),
});

const dataSchema = z
  .object({
    concepts: z.array(conceptSchema).length(6),
    links: z.array(linkSchema).min(4).max(8),
  })
  .refine(
    (d) => d.links.every((l) => l.from !== l.to),
    { message: 'Link endpoints must differ' },
  );

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  concepts: [
    { label: 'Concept one' },
    { label: 'Concept two' },
    { label: 'Concept three' },
    { label: 'Concept four' },
    { label: 'Concept five' },
    { label: 'Concept six' },
  ],
  links: [
    { from: 0, to: 1, label: 'relates to' },
    { from: 1, to: 2, label: 'leads to' },
    { from: 2, to: 3, label: 'enables' },
    { from: 3, to: 4, label: 'informs' },
    { from: 4, to: 5, label: 'supports' },
    { from: 5, to: 0, label: 'feeds back' },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const nodeFill = paletteColor(paletteId, 2);
  const nodeStroke = paletteColor(paletteId, 0);
  const nodeText = paletteColor(paletteId, 5);
  const edgeColour = paletteColor(paletteId, 1);
  const edgeText = paletteColor(paletteId, 0);

  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.36;
  const ry = height * 0.36;

  const nodeW = Math.min(140, width * 0.22);
  const nodeH = 44;
  const nodeHalfW = nodeW / 2;
  const nodeHalfH = nodeH / 2;

  // Compute positions around an ellipse — start at top (-90°), clockwise.
  const positions = data.concepts.map((_, i) => {
    const angle = (-90 + (360 / data.concepts.length) * i) * (Math.PI / 180);
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  });

  /** Compute the border-point where a line from the rect centre at (cx,cy)
   * toward (tx,ty) exits the rect of given half-dimensions. */
  function rectBorderPoint(
    rectCx: number,
    rectCy: number,
    halfW: number,
    halfH: number,
    targetX: number,
    targetY: number,
  ): { x: number; y: number } {
    const dx = targetX - rectCx;
    const dy = targetY - rectCy;
    if (dx === 0 && dy === 0) return { x: rectCx, y: rectCy };
    // Scale so |dx|=halfW or |dy|=halfH, whichever comes first.
    const sx = halfW / Math.abs(dx || 1e-9);
    const sy = halfH / Math.abs(dy || 1e-9);
    const s = Math.min(sx, sy);
    return { x: rectCx + dx * s, y: rectCy + dy * s };
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="concept-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColour} />
        </marker>
      </defs>

      {/* Edges — drawn first so nodes sit on top */}
      {data.links.map((link, li) => {
        const from = positions[link.from];
        const to = positions[link.to];
        if (!from || !to) return null;
        const start = rectBorderPoint(from.x, from.y, nodeHalfW, nodeHalfH, to.x, to.y);
        const end = rectBorderPoint(to.x, to.y, nodeHalfW, nodeHalfH, from.x, from.y);
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        return (
          <g key={`link-${li}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={edgeColour}
              strokeWidth={1.5}
              opacity={0.7}
              markerEnd="url(#concept-arrow)"
            />
            {/* Label pill at edge midpoint */}
            <rect
              x={mx - 50}
              y={my - 8}
              width={100}
              height={16}
              rx={8}
              ry={8}
              fill={paletteColor(paletteId, 5)}
              stroke={edgeColour}
              strokeWidth={1}
              opacity={0.95}
            />
            <text
              x={mx}
              y={my + 4}
              textAnchor="middle"
              fontFamily={font}
              fontSize={9}
              fontStyle="italic"
              fill={edgeText}
            >
              {truncate(link.label, 18)}
            </text>
          </g>
        );
      })}

      {/* Concept nodes */}
      {data.concepts.map((concept, i) => {
        const pos = positions[i];
        const nodeId = `concept-${i}`;
        const fill = customColors[nodeId] ?? nodeFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={pos.x - nodeHalfW}
              y={pos.y - nodeHalfH}
              width={nodeW}
              height={nodeH}
              rx={10}
              ry={10}
              fill={fill}
              stroke={nodeStroke}
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
              fill={nodeText}
            >
              {truncate(concept.label, 20)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const conceptMapPreset: Preset<Data> = {
  id: 'concept-map',
  name: 'Concept Map',
  category: 'relationships',
  tags: ['concept-map', 'network', 'relationships', 'web'],
  description: '6 concepts on an ellipse connected by labelled relationship arrows.',
  aiDescription:
    'Use when the text describes peer concepts linked by named relationships — no single focal point, no hierarchy. Each of the 6 nodes is a concept; 4–8 directed edges between them carry a short verb phrase ("leads to", "depends on", "enables"). Prefer "hierarchy-mindmap-centre" when there is one anchor topic with subordinate themes; prefer "network-hub-spoke-6" when the shape is explicitly hub-and-spoke topology; prefer "fishbone-ishikawa-6bone" when the content is root-cause analysis of one effect.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="22" y1="8" x2="60" y2="8" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="8" x2="98" y2="8" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="22" y1="32" x2="60" y2="32" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="60" y1="32" x2="98" y2="32" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="22" y1="8" x2="22" y2="32" stroke="#2A7A6C" stroke-width="1"/>
  <line x1="98" y1="8" x2="98" y2="32" stroke="#2A7A6C" stroke-width="1"/>
  <rect x="12" y="3" width="20" height="10" rx="3" fill="#4A9A8A"/>
  <rect x="50" y="3" width="20" height="10" rx="3" fill="#4A9A8A"/>
  <rect x="88" y="3" width="20" height="10" rx="3" fill="#4A9A8A"/>
  <rect x="12" y="27" width="20" height="10" rx="3" fill="#4A9A8A"/>
  <rect x="50" y="27" width="20" height="10" rx="3" fill="#4A9A8A"/>
  <rect x="88" y="27" width="20" height="10" rx="3" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['concepts[].label', 'links[].label'],
  compatibleFamilies: ['relationships'],
};
