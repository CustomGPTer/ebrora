// =============================================================================
// Preset: hierarchy-pyramid-5tier
// 5-tier pyramid — same visual family as hierarchy-pyramid-4tier with an
// extra tier for frameworks that explicitly split a layer (e.g. 5-tier
// need-hierarchies, 5-level maturity models).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  tiers: z.array(z.object({
    label: z.string().min(1).max(32),
    detail: z.string().max(60).optional(),
  })).length(5),
  direction: z.enum(['ascending', 'descending']).default('descending'),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  tiers: [
    { label: 'Vision', detail: 'Long-range direction' },
    { label: 'Strategy', detail: 'Multi-year priorities' },
    { label: 'Plan', detail: 'Annual objectives' },
    { label: 'Tactics', detail: 'Quarterly initiatives' },
    { label: 'Delivery', detail: 'Day-to-day activities' },
  ],
  direction: 'descending',
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const font = settings.font ?? 'Inter, sans-serif';
  const textLight = paletteColor(p, 5);
  const detailColor = paletteColor(p, 0);
  const { customColors } = settings;

  const padding = 20;
  const usableH = height - padding * 2;
  const usableW = width - padding * 2;
  const tierCount = data.tiers.length;
  const tierH = usableH / tierCount;
  const apex = width / 2;
  const descending = data.direction !== 'ascending';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
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
        const nodeId = `tier-${i}`;
        const fill = customColors[nodeId] ?? paletteColor(p, i);
        const points = `${topLeft},${top} ${topRight},${top} ${bottomRight},${bottom} ${bottomLeft},${bottom}`;
        const useLight = i < tierCount - 1;
        return (
          <g key={nodeId} data-id={nodeId}>
            <polygon points={points} fill={fill} stroke={paletteColor(p, 5)} strokeWidth={1.5} />
            <text
              x={apex}
              y={top + tierH / 2 + 2}
              textAnchor="middle"
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
              fill={useLight ? textLight : detailColor}
            >
              {truncate(tier.label, 20)}
            </text>
            {tier.detail ? (
              <text
                x={apex}
                y={top + tierH / 2 + 14}
                textAnchor="middle"
                fontFamily={font}
                fontSize={9}
                fill={useLight ? textLight : detailColor}
                fillOpacity={0.9}
              >
                {truncate(tier.detail, 30)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const hierarchyPyramid5TierPreset: Preset<Data> = {
  id: 'hierarchy-pyramid-5tier',
  name: 'Pyramid — 5 Tiers',
  category: 'hierarchy',
  tags: ['pyramid', 'hierarchy', 'tiers', 'layers', 'five-level'],
  description: 'Five stacked tiers forming a pyramid, narrow at the top.',
  aiDescription:
    'Use for explicitly 5-tier hierarchies — maturity models, 5-level needs, 5-stage taxonomies where layer order matters. Prefer "hierarchy-pyramid-4tier" for 4-tier pyramids and "pyramid-maslow" when the pyramid is specifically the classic needs-hierarchy five levels.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <polygon points="54,4 66,4 70,10 50,10" fill="#1B5B50"/>
  <polygon points="50,10 70,10 75,17 45,17" fill="#2A7A6C"/>
  <polygon points="45,17 75,17 81,24 39,24" fill="#4A9A8A"/>
  <polygon points="39,24 81,24 87,31 33,31" fill="#7EBFB2"/>
  <polygon points="33,31 87,31 93,38 27,38" fill="#B5DAD2"/>
</svg>`,
  render: Render,
  editableFields: ['tiers[].label', 'tiers[].detail'],
  compatibleFamilies: ['hierarchy', 'funnel-pyramid'],
};
