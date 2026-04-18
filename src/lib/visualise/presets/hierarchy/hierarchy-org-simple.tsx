// =============================================================================
// Preset: hierarchy-org-simple
// 1 root node with 3 child nodes (classic org-chart pattern).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  root: z.object({
    label: z.string().min(1).max(30),
    subtitle: z.string().max(30).optional(),
  }),
  children: z.array(z.object({
    label: z.string().min(1).max(30),
    subtitle: z.string().max(30).optional(),
  })).length(3),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  root: { label: 'Project Director', subtitle: 'Accountable' },
  children: [
    { label: 'Project Manager', subtitle: 'Delivery' },
    { label: 'Senior General Foreman', subtitle: 'Site' },
    { label: 'Commercial Manager', subtitle: 'Cost/NEC' },
  ],
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const rootFill = paletteColor(p, 0);
  const childFill = paletteColor(p, 1);
  const textLight = paletteColor(p, 5);
  const lineColor = paletteColor(p, 2);
  const subColor = paletteColor(p, 3);
  const font = settings.font ?? 'Inter, sans-serif';

  const boxW = Math.min(160, (width - 40) / 3 - 10);
  const boxH = 50;
  const rootX = (width - boxW) / 2;
  const rootY = 20;
  const childY = height - boxH - 20;
  const gap = (width - boxW * 3 - 16) / 2;
  const childXs = [20, 20 + boxW + gap + 8, 20 + boxW * 2 + (gap + 8) * 2 - 16];
  const midY = (rootY + boxH + childY) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={rootX + boxW / 2} y1={rootY + boxH} x2={rootX + boxW / 2} y2={midY} stroke={lineColor} strokeWidth={2} />
      <line x1={childXs[0] + boxW / 2} y1={midY} x2={childXs[2] + boxW / 2} y2={midY} stroke={lineColor} strokeWidth={2} />
      {childXs.map((cx, i) => (
        <line key={`lead-${i}`} x1={cx + boxW / 2} y1={midY} x2={cx + boxW / 2} y2={childY} stroke={lineColor} strokeWidth={2} />
      ))}

      <g data-id="root">
        <rect x={rootX} y={rootY} width={boxW} height={boxH} rx={8} fill={rootFill} />
        <text x={rootX + boxW / 2} y={rootY + (data.root.subtitle ? 22 : boxH / 2 + 5)} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={13} fontWeight={600}>{truncate(data.root.label, 18)}</text>
        {data.root.subtitle ? (
          <text x={rootX + boxW / 2} y={rootY + 38} textAnchor="middle" fill={subColor} fontFamily={font} fontSize={10}>{truncate(data.root.subtitle, 22)}</text>
        ) : null}
      </g>

      {data.children.map((c, i) => {
        const nodeId = `child-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <rect x={childXs[i]} y={childY} width={boxW} height={boxH} rx={8} fill={childFill} />
            <text x={childXs[i] + boxW / 2} y={childY + (c.subtitle ? 22 : boxH / 2 + 5)} textAnchor="middle" fill={textLight} fontFamily={font} fontSize={12} fontWeight={600}>{truncate(c.label, 18)}</text>
            {c.subtitle ? (
              <text x={childXs[i] + boxW / 2} y={childY + 38} textAnchor="middle" fill={paletteColor(p, 4)} fontFamily={font} fontSize={10}>{truncate(c.subtitle, 22)}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const hierarchyOrgSimplePreset: Preset<Data> = {
  id: 'hierarchy-org-simple',
  name: 'Org Hierarchy — 1 to 3',
  category: 'hierarchy',
  tags: ['org', 'hierarchy', 'reporting', 'structure'],
  description: 'One parent role with three direct reports.',
  aiDescription: 'Simple 1-to-3 org hierarchy: one senior role with three direct reports. Use for reporting lines, team structures, or any parent-children grouping where there are exactly 3 peers under a lead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="45" y="4" width="30" height="10" rx="2" fill="#1B5B50"/>
  <rect x="8" y="26" width="26" height="10" rx="2" fill="#2A7A6C"/>
  <rect x="47" y="26" width="26" height="10" rx="2" fill="#2A7A6C"/>
  <rect x="86" y="26" width="26" height="10" rx="2" fill="#2A7A6C"/>
  <line x1="60" y1="14" x2="60" y2="20" stroke="#4A9A8A"/>
  <line x1="21" y1="20" x2="99" y2="20" stroke="#4A9A8A"/>
  <line x1="21" y1="20" x2="21" y2="26" stroke="#4A9A8A"/>
  <line x1="60" y1="20" x2="60" y2="26" stroke="#4A9A8A"/>
  <line x1="99" y1="20" x2="99" y2="26" stroke="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['root.label', 'root.subtitle', 'children[].label', 'children[].subtitle'],
  compatibleFamilies: ['hierarchy'],
};
