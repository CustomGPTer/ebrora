// =============================================================================
// Preset: network-hub-spoke-6
// Hub-and-spoke network — central hub node with exactly 6 peripheral
// nodes arranged in a ring. Thicker edges and equal-weight peripheral
// nodes differentiate this from hierarchy-mindmap-centre (which is a
// hierarchical concept map with variable spoke count 4–8).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const nodeSchema = z.object({
  label: z.string().min(1).max(18),
});

const dataSchema = z.object({
  hub: nodeSchema,
  spokes: z.array(nodeSchema).length(6),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  hub: { label: 'Central system' },
  spokes: [
    { label: 'Node A' },
    { label: 'Node B' },
    { label: 'Node C' },
    { label: 'Node D' },
    { label: 'Node E' },
    { label: 'Node F' },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const hubFill = paletteColor(paletteId, 0);
  const hubText = paletteColor(paletteId, 5);
  const spokeFill = paletteColor(paletteId, 2);
  const spokeText = paletteColor(paletteId, 5);
  const edgeColour = paletteColor(paletteId, 1);

  const cx = width / 2;
  const cy = height / 2;
  const hubR = Math.min(width, height) * 0.13;
  const spokeOrbit = Math.min(width, height) * 0.38;
  const spokeR = Math.min(width, height) * 0.09;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Edges */}
      {data.spokes.map((_, i) => {
        const angle = (-90 + 60 * i) * (Math.PI / 180);
        const sx = cx + spokeOrbit * Math.cos(angle);
        const sy = cy + spokeOrbit * Math.sin(angle);
        const hx = cx + hubR * Math.cos(angle);
        const hy = cy + hubR * Math.sin(angle);
        const ex = sx - spokeR * Math.cos(angle);
        const ey = sy - spokeR * Math.sin(angle);
        return (
          <line
            key={`edge-${i}`}
            x1={hx}
            y1={hy}
            x2={ex}
            y2={ey}
            stroke={edgeColour}
            strokeWidth={3}
            opacity={0.75}
          />
        );
      })}

      {/* Spokes */}
      {data.spokes.map((s, i) => {
        const angle = (-90 + 60 * i) * (Math.PI / 180);
        const sx = cx + spokeOrbit * Math.cos(angle);
        const sy = cy + spokeOrbit * Math.sin(angle);
        const nodeId = `spoke-${i}`;
        const fill = customColors[nodeId] ?? spokeFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={sx} cy={sy} r={spokeR} fill={fill} stroke={paletteColor(paletteId, 5)} strokeWidth={1.5} />
            <text
              x={sx}
              y={sy + 4}
              textAnchor="middle"
              fill={spokeText}
              fontFamily={font}
              fontSize={Math.min(11, spokeR / 2.2)}
              fontWeight={600}
            >
              {truncate(s.label, 12)}
            </text>
          </g>
        );
      })}

      {/* Hub on top */}
      <g data-id="hub">
        <circle cx={cx} cy={cy} r={hubR} fill={customColors['hub'] ?? hubFill} stroke={paletteColor(paletteId, 5)} strokeWidth={2} />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill={hubText}
          fontFamily={font}
          fontSize={Math.min(13, hubR / 3)}
          fontWeight={700}
        >
          {truncate(data.hub.label, 14)}
        </text>
      </g>
    </svg>
  );
}

export const networkHubSpoke6Preset: Preset<Data> = {
  id: 'network-hub-spoke-6',
  name: 'Network — Hub & 6 Spokes',
  category: 'relationships',
  tags: ['network', 'hub', 'spoke', 'topology', 'distribution'],
  description: 'Central hub with 6 peripheral nodes connected by edges.',
  aiDescription:
    'Use when the text describes a network topology or distribution — one central point connected equally to exactly six peripheral points. Typical for hub-and-spoke system architectures, regional-office networks, or distribution diagrams. Prefer "hierarchy-mindmap-centre" when the shape is conceptual topic breakdown (4–8 flexible spokes with optional descriptions); prefer this when the emphasis is on network connectivity with uniform peripheral weight.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="60" y1="20" x2="20" y2="10" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="100" y2="10" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="20" y2="30" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="100" y2="30" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="60" y2="4" stroke="#2A7A6C" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="60" y2="36" stroke="#2A7A6C" stroke-width="1.5"/>
  <circle cx="20" cy="10" r="4" fill="#4A9A8A"/>
  <circle cx="100" cy="10" r="4" fill="#4A9A8A"/>
  <circle cx="20" cy="30" r="4" fill="#4A9A8A"/>
  <circle cx="100" cy="30" r="4" fill="#4A9A8A"/>
  <circle cx="60" cy="4" r="4" fill="#4A9A8A"/>
  <circle cx="60" cy="36" r="4" fill="#4A9A8A"/>
  <circle cx="60" cy="20" r="7" fill="#1B5B50"/>
</svg>`,
  render: Render,
  editableFields: ['hub.label', 'spokes[].label'],
  compatibleFamilies: ['relationships'],
};
