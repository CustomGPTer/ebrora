// =============================================================================
// Preset: hierarchy-mindmap-centre
// Central hub node with 4–8 radial spokes. Each spoke has a label and
// optional short detail. More organic than a tree; good for topic maps,
// scope overviews, and "everything connects to this core concept" shapes.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const spokeSchema = z.object({
  label: z.string().min(1).max(22),
  detail: z.string().max(36).optional(),
});

const dataSchema = z.object({
  centre: z.object({ label: z.string().min(1).max(20) }),
  spokes: z.array(spokeSchema).min(4).max(8),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  centre: { label: 'Main topic' },
  spokes: [
    { label: 'Theme one', detail: 'Short description' },
    { label: 'Theme two', detail: 'Short description' },
    { label: 'Theme three', detail: 'Short description' },
    { label: 'Theme four', detail: 'Short description' },
    { label: 'Theme five', detail: 'Short description' },
    { label: 'Theme six', detail: 'Short description' },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const centreFill = paletteColor(paletteId, 0);
  const centreText = paletteColor(paletteId, 5);
  const spokeFill = paletteColor(paletteId, 2);
  const spokeText = paletteColor(paletteId, 5);
  const detailText = paletteColor(paletteId, 0);
  const edgeColour = paletteColor(paletteId, 2);

  const cx = width / 2;
  const cy = height / 2;
  const centreR = Math.min(width, height) * 0.14;
  const spokeOrbit = Math.min(width, height) * 0.38;
  const spokeW = Math.min(120, width * 0.22);
  const spokeH = 40;

  const n = data.spokes.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Edges first — curve from centre to each spoke centre */}
      {data.spokes.map((_, i) => {
        const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
        const sx = cx + spokeOrbit * Math.cos(angle);
        const sy = cy + spokeOrbit * Math.sin(angle);
        const midX = (cx + sx) / 2;
        const midY = (cy + sy) / 2;
        return (
          <path
            key={`edge-${i}`}
            d={`M ${cx + centreR * Math.cos(angle)} ${cy + centreR * Math.sin(angle)} Q ${midX} ${midY} ${sx} ${sy}`}
            fill="none"
            stroke={edgeColour}
            strokeWidth={2}
          />
        );
      })}

      {/* Spokes */}
      {data.spokes.map((s, i) => {
        const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
        const sx = cx + spokeOrbit * Math.cos(angle);
        const sy = cy + spokeOrbit * Math.sin(angle);
        const nodeId = `spoke-${i}`;
        const fill = customColors[nodeId] ?? spokeFill;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect
              x={sx - spokeW / 2}
              y={sy - spokeH / 2}
              width={spokeW}
              height={spokeH}
              rx={8}
              ry={8}
              fill={fill}
            />
            <text
              x={sx}
              y={sy + (s.detail ? -2 : 4)}
              textAnchor="middle"
              fill={spokeText}
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
            >
              {truncate(s.label, 18)}
            </text>
            {s.detail ? (
              <text
                x={sx}
                y={sy + 12}
                textAnchor="middle"
                fill={spokeText}
                fontFamily={font}
                fontSize={9}
                opacity={0.85}
              >
                {truncate(s.detail, 28)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Centre hub drawn last so it sits on top of edges */}
      <g data-id="centre">
        <circle cx={cx} cy={cy} r={centreR} fill={customColors['centre'] ?? centreFill} />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill={centreText}
          fontFamily={font}
          fontSize={Math.min(14, centreR / 3.5)}
          fontWeight={700}
        >
          {truncate(data.centre.label, 16)}
        </text>
      </g>
    </svg>
  );
}

export const hierarchyMindmapCentrePreset: Preset<Data> = {
  id: 'hierarchy-mindmap-centre',
  name: 'Mindmap — Central Topic',
  category: 'hierarchy',
  tags: ['mindmap', 'hierarchy', 'radial', 'topic'],
  description: 'Central hub with 4–8 radial spokes — organic topic map.',
  aiDescription:
    'Use when the text describes a main topic with several peer sub-themes radiating out from it — all equal weight, all directly related to the central concept. Good for topic overviews, scope maps, or "here are the main themes" summaries. Prefer "hierarchy-tree-generic" for asymmetric trees where sub-items have their own children; prefer "network-hub-spoke-6" when the emphasis is on network topology or distribution rather than conceptual grouping.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="20" r="7" fill="#1B5B50"/>
  <rect x="2" y="3" width="22" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="96" y="3" width="22" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="2" y="29" width="22" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="96" y="29" width="22" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="32" y="2" width="22" height="6" rx="2" fill="#4A9A8A"/>
  <rect x="66" y="2" width="22" height="6" rx="2" fill="#4A9A8A"/>
  <path d="M13 7 Q 40 15 55 20" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M107 7 Q 80 15 65 20" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M13 33 Q 40 25 55 20" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M107 33 Q 80 25 65 20" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M43 5 Q 50 12 57 17" stroke="#2A7A6C" stroke-width="1" fill="none"/>
  <path d="M77 5 Q 70 12 63 17" stroke="#2A7A6C" stroke-width="1" fill="none"/>
</svg>`,
  render: Render,
  editableFields: ['centre.label', 'spokes[].label', 'spokes[].detail'],
  compatibleFamilies: ['hierarchy', 'relationships'],
};
