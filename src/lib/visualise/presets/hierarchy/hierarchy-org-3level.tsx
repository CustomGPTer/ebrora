// =============================================================================
// Preset: hierarchy-org-3level
// Three-tier org chart: 1 top-level node, 2–3 mid-tier, 3–6 bottom-tier.
// Tidier than a generic tree when the structure is explicitly role-
// hierarchical and the middle layer has clear groupings.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const nodeSchema = z.object({
  label: z.string().min(1).max(22),
  subtitle: z.string().max(28).optional(),
});

const dataSchema = z.object({
  top: nodeSchema,
  middle: z.array(nodeSchema).min(2).max(3),
  bottom: z.array(nodeSchema).min(3).max(6),
});

type HierarchyOrg3LevelData = z.infer<typeof dataSchema>;

const defaultData: HierarchyOrg3LevelData = {
  top: { label: 'Leadership', subtitle: 'Strategy and oversight' },
  middle: [
    { label: 'Operations', subtitle: 'Day-to-day delivery' },
    { label: 'Support', subtitle: 'Enabling functions' },
    { label: 'Quality', subtitle: 'Assurance and compliance' },
  ],
  bottom: [
    { label: 'Team A' },
    { label: 'Team B' },
    { label: 'Team C' },
    { label: 'Team D' },
    { label: 'Team E' },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<HierarchyOrg3LevelData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const topFill = paletteColor(paletteId, 0);
  const midFill = paletteColor(paletteId, 2);
  const botFill = paletteColor(paletteId, 4);
  const topText = paletteColor(paletteId, 5);
  const midText = paletteColor(paletteId, 5);
  const botText = paletteColor(paletteId, 0);
  const subText = paletteColor(paletteId, 5);
  const botSubText = paletteColor(paletteId, 2);
  const connector = paletteColor(paletteId, 2);

  const pad = 14;
  const nMid = data.middle.length;
  const nBot = data.bottom.length;

  const rowH = (height - pad * 2) / 3;
  const topY = pad;
  const midY = pad + rowH;
  const botY = pad + rowH * 2;

  const topW = Math.min(180, width * 0.38);
  const topH = Math.min(52, rowH - 12);
  const topX = (width - topW) / 2;

  const midW = Math.min(140, (width - pad * 2 - (nMid - 1) * 10) / nMid);
  const midH = Math.min(48, rowH - 14);
  const midGap = (width - pad * 2 - midW * nMid) / (nMid - 1 || 1);

  const botW = Math.min(92, (width - pad * 2 - (nBot - 1) * 8) / nBot);
  const botH = Math.min(40, rowH - 12);
  const botGap = (width - pad * 2 - botW * nBot) / (nBot - 1 || 1);

  const topCx = width / 2;
  const topCy = topY + topH / 2;
  const midCys = data.middle.map((_, i) => midY + midH / 2);
  const midCxs = data.middle.map((_, i) => pad + midW / 2 + i * (midW + midGap));
  const botCxs = data.bottom.map((_, i) => pad + botW / 2 + i * (botW + botGap));
  const botCys = data.bottom.map(() => botY + botH / 2);

  // Map each bottom node to a parent middle node by proportional grouping.
  // e.g. 3 middle + 6 bottom → 2 children each; 3 middle + 5 bottom → 2/2/1.
  const parentForBottom = (bi: number): number => {
    const groupSize = nBot / nMid;
    return Math.min(nMid - 1, Math.floor(bi / groupSize));
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Connectors: top → middle */}
      {data.middle.map((_, mi) => (
        <path
          key={`c-top-${mi}`}
          d={`M ${topCx} ${topCy + topH / 2} V ${(topCy + topH / 2 + midCys[mi] - midH / 2) / 2} H ${midCxs[mi]} V ${midCys[mi] - midH / 2}`}
          fill="none"
          stroke={connector}
          strokeWidth={1.5}
        />
      ))}

      {/* Connectors: middle → bottom */}
      {data.bottom.map((_, bi) => {
        const mi = parentForBottom(bi);
        return (
          <path
            key={`c-bot-${bi}`}
            d={`M ${midCxs[mi]} ${midCys[mi] + midH / 2} V ${(midCys[mi] + midH / 2 + botCys[bi] - botH / 2) / 2} H ${botCxs[bi]} V ${botCys[bi] - botH / 2}`}
            fill="none"
            stroke={connector}
            strokeWidth={1.5}
          />
        );
      })}

      {/* Top node */}
      <g data-id="top">
        <rect x={topX} y={topY} width={topW} height={topH} rx={8} ry={8} fill={customColors['top'] ?? topFill} />
        <text
          x={topCx}
          y={topY + topH / 2 + (data.top.subtitle ? -2 : 5)}
          textAnchor="middle"
          fill={topText}
          fontFamily={font}
          fontSize={14}
          fontWeight={700}
        >
          {truncate(data.top.label, 20)}
        </text>
        {data.top.subtitle ? (
          <text
            x={topCx}
            y={topY + topH / 2 + 14}
            textAnchor="middle"
            fill={subText}
            fontFamily={font}
            fontSize={10}
          >
            {truncate(data.top.subtitle, 26)}
          </text>
        ) : null}
      </g>

      {/* Middle nodes */}
      {data.middle.map((m, mi) => {
        const x = midCxs[mi] - midW / 2;
        const nodeId = `middle-${mi}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={midY} width={midW} height={midH} rx={6} ry={6} fill={customColors[nodeId] ?? midFill} />
            <text
              x={midCxs[mi]}
              y={midY + midH / 2 + (m.subtitle ? -2 : 5)}
              textAnchor="middle"
              fill={midText}
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
            >
              {truncate(m.label, 18)}
            </text>
            {m.subtitle ? (
              <text
                x={midCxs[mi]}
                y={midY + midH / 2 + 13}
                textAnchor="middle"
                fill={subText}
                fontFamily={font}
                fontSize={9}
              >
                {truncate(m.subtitle, 24)}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Bottom nodes */}
      {data.bottom.map((b, bi) => {
        const x = botCxs[bi] - botW / 2;
        const nodeId = `bottom-${bi}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={x} y={botY} width={botW} height={botH} rx={5} ry={5} fill={customColors[nodeId] ?? botFill} />
            <text
              x={botCxs[bi]}
              y={botY + botH / 2 + (b.subtitle ? -2 : 5)}
              textAnchor="middle"
              fill={botText}
              fontFamily={font}
              fontSize={11}
              fontWeight={600}
            >
              {truncate(b.label, 14)}
            </text>
            {b.subtitle ? (
              <text
                x={botCxs[bi]}
                y={botY + botH / 2 + 12}
                textAnchor="middle"
                fill={botSubText}
                fontFamily={font}
                fontSize={9}
              >
                {truncate(b.subtitle, 20)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const hierarchyOrg3LevelPreset: Preset<HierarchyOrg3LevelData> = {
  id: 'hierarchy-org-3level',
  name: 'Org Chart — 3 Levels',
  category: 'hierarchy',
  tags: ['hierarchy', 'org', 'three-level', 'structure'],
  description: 'Three-tier org chart — 1 top node, 2–3 middle, 3–6 bottom.',
  aiDescription:
    'Use when the text describes a three-tier organisational or responsibility structure — leadership / departments / teams, or equivalent. The AI should pick 2 or 3 middle-tier nodes depending on how the text groups the bottom tier; bottom-tier children are distributed proportionally across the middle parents. Prefer "hierarchy-org-simple" for a simpler 1 + N layout. Prefer "hierarchy-tree-generic" when branching is irregular.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="46" y="2" width="28" height="10" rx="2" fill="#1B5B50"/>
  <rect x="14" y="16" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="48" y="16" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="82" y="16" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="6" y="28" width="16" height="8" rx="2" fill="#B5DAD2"/>
  <rect x="26" y="28" width="16" height="8" rx="2" fill="#B5DAD2"/>
  <rect x="46" y="28" width="16" height="8" rx="2" fill="#B5DAD2"/>
  <rect x="66" y="28" width="16" height="8" rx="2" fill="#B5DAD2"/>
  <rect x="86" y="28" width="16" height="8" rx="2" fill="#B5DAD2"/>
  <line x1="60" y1="12" x2="60" y2="14" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="26" y1="14" x2="94" y2="14" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="26" y1="14" x2="26" y2="16" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="60" y1="14" x2="60" y2="16" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="94" y1="14" x2="94" y2="16" stroke="#7EBFB2" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['top.label', 'top.subtitle', 'middle[].label', 'middle[].subtitle', 'bottom[].label', 'bottom[].subtitle'],
  compatibleFamilies: ['hierarchy'],
};
