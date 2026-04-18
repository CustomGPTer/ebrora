// =============================================================================
// Preset: hierarchy-pyramid-4tier
// 4-tier pyramid with a label and optional count per tier.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  tiers: z.array(z.object({
    label: z.string().min(1).max(40),
    detail: z.string().max(80).optional(),
  })).length(4),
  direction: z.enum(['ascending', 'descending']).default('descending'),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  tiers: [
    { label: 'Strategic', detail: 'Director-level' },
    { label: 'Tactical', detail: 'Management' },
    { label: 'Operational', detail: 'Supervisors' },
    { label: 'Execution', detail: 'Workforce' },
  ],
  direction: 'descending',
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const font = settings.font ?? 'Inter, sans-serif';
  const textLight = paletteColor(p, 5);
  const detailColor = paletteColor(p, 0);

  const padding = 24;
  const usableH = height - padding * 2;
  const usableW = width - padding * 2;
  const tierCount = data.tiers.length;
  const tierH = usableH / tierCount;
  const apex = width / 2;
  const descending = data.direction !== 'ascending';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.tiers.map((tier, i) => {
        const row = descending ? i : tierCount - 1 - i;
        const topWidth = usableW * ((row + 1) / tierCount);
        const bottomWidth = usableW * ((row + 2) / tierCount);
        const clampedBottom = Math.min(bottomWidth, usableW);
        const top = padding + tierH * i;
        const bottom = top + tierH;
        const topLeft = apex - topWidth / 2;
        const topRight = apex + topWidth / 2;
        const bottomLeft = apex - clampedBottom / 2;
        const bottomRight = apex + clampedBottom / 2;
        const fill = paletteColor(p, i);
        const points = `${topLeft},${top} ${topRight},${top} ${bottomRight},${bottom} ${bottomLeft},${bottom}`;
        const nodeId = `tier-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <polygon points={points} fill={fill} stroke={paletteColor(p, 5)} strokeWidth={1.5} />
            <text x={apex} y={top + tierH / 2 + 2} textAnchor="middle" fontFamily={font} fontSize={13} fontWeight={600} fill={i < 3 ? textLight : detailColor}>
              {truncate(tier.label, 22)}
            </text>
            {tier.detail ? (
              <text x={apex} y={top + tierH / 2 + 16} textAnchor="middle" fontFamily={font} fontSize={10} fill={i < 3 ? textLight : detailColor} fillOpacity={0.85}>
                {truncate(tier.detail, 28)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const hierarchyPyramid4TierPreset: Preset<Data> = {
  id: 'hierarchy-pyramid-4tier',
  name: 'Pyramid — 4 Tiers',
  category: 'hierarchy',
  tags: ['pyramid', 'hierarchy', 'tiers', 'layers'],
  description: 'Four stacked tiers forming a pyramid, narrow at the top.',
  aiDescription: '4-tier pyramid with apex at the top. Use for layered hierarchies where the top represents the most strategic/exclusive level (e.g. strategic→operational, pyramid of needs). Avoid for flat peer groupings.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <polygon points="52,4 68,4 74,12 46,12" fill="#1B5B50"/>
  <polygon points="46,12 74,12 80,22 40,22" fill="#2A7A6C"/>
  <polygon points="40,22 80,22 86,30 34,30" fill="#4A9A8A"/>
  <polygon points="34,30 86,30 92,38 28,38" fill="#7EBFB2"/>
</svg>`,
  render: Render,
  editableFields: ['tiers[].label', 'tiers[].detail'],
  compatibleFamilies: ['hierarchy', 'funnel-pyramid'],
};
