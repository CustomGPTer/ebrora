// =============================================================================
// Preset: hierarchy-tree-generic
// A 2-level generic tree: 1 root with N parents, each having 0–4 children.
// More flexible than hierarchy-org-3level — different parents can have
// different numbers of children. Use when a tree's bottom tier is
// irregular.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, lighten } from '../../palettes';

const leafSchema = z.object({
  label: z.string().min(1).max(20),
});

const branchSchema = z.object({
  label: z.string().min(1).max(22),
  children: z.array(leafSchema).max(4),
});

const dataSchema = z.object({
  root: z.object({ label: z.string().min(1).max(24) }),
  branches: z.array(branchSchema).min(2).max(4),
});

type HierarchyTreeGenericData = z.infer<typeof dataSchema>;

const defaultData: HierarchyTreeGenericData = {
  root: { label: 'Main topic' },
  branches: [
    { label: 'Branch one', children: [{ label: 'Item 1.1' }, { label: 'Item 1.2' }] },
    { label: 'Branch two', children: [{ label: 'Item 2.1' }, { label: 'Item 2.2' }, { label: 'Item 2.3' }] },
    { label: 'Branch three', children: [{ label: 'Item 3.1' }] },
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
}: PresetRenderProps<HierarchyTreeGenericData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // Pattern D for an uneven tree: accent apex, nodeFill branches, lightened leaves.
  const rootFill = palette.accent;
  const branchFill = palette.nodeFill;
  const leafFill = lighten(palette.nodeFill, 0.6);
  const rootText = palette.accentText;
  const branchText = palette.text;
  const leafText = palette.nodeFill;
  const connector = palette.nodeStroke;

  const pad = 12;
  const nBranch = data.branches.length;
  const rowH = (height - pad * 2) / 3;

  const rootW = Math.min(180, width * 0.4);
  const rootH = Math.min(42, rowH - 10);
  const rootX = (width - rootW) / 2;
  const rootY = pad;

  // Branches split the available width. Each branch's children are stacked
  // in a column beneath it — so each branch's slot width is equal.
  const slotW = (width - pad * 2) / nBranch;
  const branchW = Math.min(slotW - 10, 140);
  const branchH = Math.min(34, rowH - 12);
  const branchY = pad + rowH;

  const leafH = Math.min(24, rowH * 0.28);
  const leafGap = 6;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Branch + leaf connectors first (behind boxes) */}
      {data.branches.map((branch, bi) => {
        const branchCx = pad + slotW * (bi + 0.5);
        const branchCy = branchY + branchH / 2;
        const midY = (rootY + rootH + branchY) / 2;

        return (
          <g key={`c-branch-${bi}`}>
            {/* Root → branch connector */}
            <path
              d={`M ${width / 2} ${rootY + rootH} V ${midY} H ${branchCx} V ${branchY}`}
              fill="none"
              stroke={connector}
              strokeWidth={1.5}
            />
            {/* Branch → leaves */}
            {branch.children.map((_, li) => {
              const leafY = branchY + branchH + 8 + li * (leafH + leafGap);
              return (
                <line
                  key={`c-leaf-${bi}-${li}`}
                  x1={branchCx}
                  y1={branchY + branchH}
                  x2={branchCx}
                  y2={leafY + leafH / 2}
                  stroke={connector}
                  strokeWidth={1}
                />
              );
            })}
          </g>
        );
      })}

      {/* Root */}
      <g data-id="root">
        <rect
          x={rootX}
          y={rootY}
          width={rootW}
          height={rootH}
          rx={8}
          ry={8}
          fill={customColors['root'] ?? rootFill}
        />
        <text
          x={width / 2}
          y={rootY + rootH / 2 + 5}
          textAnchor="middle"
          fill={rootText}
          fontFamily={font}
          fontSize={14}
          fontWeight={700}
        >
          {truncate(data.root.label, 24)}
        </text>
      </g>

      {/* Branches and leaves */}
      {data.branches.map((branch, bi) => {
        const branchCx = pad + slotW * (bi + 0.5);
        const branchX = branchCx - branchW / 2;
        const branchId = `branch-${bi}`;

        return (
          <g key={branchId}>
            <g data-id={branchId}>
              <rect
                x={branchX}
                y={branchY}
                width={branchW}
                height={branchH}
                rx={6}
                ry={6}
                fill={customColors[branchId] ?? branchFill}
              />
              <text
                x={branchCx}
                y={branchY + branchH / 2 + 5}
                textAnchor="middle"
                fill={branchText}
                fontFamily={font}
                fontSize={12}
                fontWeight={700}
              >
                {truncate(branch.label, 18)}
              </text>
            </g>

            {branch.children.map((leaf, li) => {
              const leafW = Math.min(branchW - 6, 124);
              const leafX = branchCx - leafW / 2;
              const leafY = branchY + branchH + 8 + li * (leafH + leafGap);
              const leafId = `branch-${bi}-leaf-${li}`;
              return (
                <g key={leafId} data-id={leafId}>
                  <rect
                    x={leafX}
                    y={leafY}
                    width={leafW}
                    height={leafH}
                    rx={4}
                    ry={4}
                    fill={customColors[leafId] ?? leafFill}
                  />
                  <text
                    x={branchCx}
                    y={leafY + leafH / 2 + 4}
                    textAnchor="middle"
                    fill={leafText}
                    fontFamily={font}
                    fontSize={10}
                    fontWeight={500}
                  >
                    {truncate(leaf.label, 16)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export const hierarchyTreeGenericPreset: Preset<HierarchyTreeGenericData> = {
  id: 'hierarchy-tree-generic',
  name: 'Generic Tree',
  category: 'hierarchy',
  tags: ['hierarchy', 'tree', 'taxonomy', 'breakdown'],
  description: 'Root with 2–4 branches, each with 0–4 children — for irregular hierarchies.',
  aiDescription:
    'Use when the text describes a taxonomy, breakdown, or category tree where different branches have different numbers of sub-items. Good for topic breakdowns, document structures, product catalogues, and any "1 parent → several uneven groups" shape. Prefer "hierarchy-org-3level" when the tree is a symmetrical three-tier org structure. Prefer "hierarchy-org-simple" for a flat 1 + N layout.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="46" y="3" width="28" height="9" rx="2" fill="#1B5B50"/>
  <rect x="10" y="17" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="48" y="17" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="86" y="17" width="24" height="8" rx="2" fill="#4A9A8A"/>
  <rect x="12" y="29" width="20" height="6" rx="1" fill="#B5DAD2"/>
  <rect x="48" y="29" width="20" height="6" rx="1" fill="#B5DAD2"/>
  <rect x="88" y="29" width="20" height="6" rx="1" fill="#B5DAD2"/>
  <rect x="48" y="36" width="20" height="3" rx="1" fill="#B5DAD2"/>
  <line x1="60" y1="12" x2="60" y2="14" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="22" y1="14" x2="98" y2="14" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="22" y1="14" x2="22" y2="17" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="60" y1="14" x2="60" y2="17" stroke="#7EBFB2" stroke-width="1"/>
  <line x1="98" y1="14" x2="98" y2="17" stroke="#7EBFB2" stroke-width="1"/>
</svg>`,
  render: Render,
  editableFields: ['root.label', 'branches[].label', 'branches[].children[].label'],
  compatibleFamilies: ['hierarchy'],
};
