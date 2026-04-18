// =============================================================================
// Preset: timeline-roadmap-quarters
// Four quarter-columns (Q1–Q4 or equivalent) with 1–4 item cards stacked
// inside each. Classic product-roadmap layout — useful for planning
// overviews, release schedules, annual rollouts.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const itemSchema = z.object({
  label: z.string().min(1).max(32),
  tag: z.string().max(10).optional(),
});

const quarterSchema = z.object({
  name: z.string().min(1).max(12),
  items: z.array(itemSchema).min(1).max(4),
});

const dataSchema = z.object({
  quarters: z.array(quarterSchema).length(4),
});

type TimelineRoadmapQuartersData = z.infer<typeof dataSchema>;

const defaultData: TimelineRoadmapQuartersData = {
  quarters: [
    { name: 'Q1', items: [{ label: 'Research and scoping', tag: 'Discovery' }, { label: 'Stakeholder alignment' }] },
    { name: 'Q2', items: [{ label: 'Pilot rollout', tag: 'Delivery' }, { label: 'Feedback loop' }, { label: 'Refine approach' }] },
    { name: 'Q3', items: [{ label: 'Broader launch', tag: 'Scale' }, { label: 'Training programme' }] },
    { name: 'Q4', items: [{ label: 'Review and iterate', tag: 'Embed' }, { label: 'Plan next year' }] },
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
}: PresetRenderProps<TimelineRoadmapQuartersData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const headerFill = paletteColor(paletteId, 0);
  const headerText = paletteColor(paletteId, 5);
  const columnBg = paletteColor(paletteId, 4);
  const itemFill = paletteColor(paletteId, 5);
  const itemLabel = paletteColor(paletteId, 0);
  const tagFill = paletteColor(paletteId, 2);
  const tagText = paletteColor(paletteId, 5);

  const pad = 12;
  const colGap = 8;
  const n = data.quarters.length;
  const colW = (width - pad * 2 - colGap * (n - 1)) / n;
  const headerH = 30;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {data.quarters.map((q, ci) => {
        const x = pad + ci * (colW + colGap);
        const nodeId = `quarter-${ci}`;
        const headerFillResolved = customColors[`${nodeId}-header`] ?? headerFill;

        return (
          <g key={nodeId}>
            {/* Column background */}
            <rect x={x} y={pad} width={colW} height={height - pad * 2} rx={6} ry={6} fill={columnBg} />

            {/* Header — tagged as the column header <g> for inline label edit */}
            <g data-id={nodeId}>
              <rect x={x} y={pad} width={colW} height={headerH} rx={6} ry={6} fill={headerFillResolved} />
              <rect x={x} y={pad + headerH - 6} width={colW} height={6} fill={headerFillResolved} />
              <text
                x={x + colW / 2}
                y={pad + headerH / 2 + 5}
                textAnchor="middle"
                fill={headerText}
                fontFamily={font}
                fontSize={13}
                fontWeight={700}
              >
                {q.name}
              </text>
            </g>

            {/* Items */}
            {q.items.map((item, ii) => {
              const itemH = Math.max(34, (height - pad * 2 - headerH - 16) / 4);
              const y = pad + headerH + 8 + ii * (itemH + 4);
              const itemId = `quarter-${ci}-item-${ii}`;
              const fill = customColors[itemId] ?? itemFill;
              return (
                <g key={itemId} data-id={itemId}>
                  <rect
                    x={x + 6}
                    y={y}
                    width={colW - 12}
                    height={itemH}
                    rx={4}
                    ry={4}
                    fill={fill}
                    stroke={paletteColor(paletteId, 2)}
                    strokeWidth={0.5}
                    opacity={0.95}
                  />
                  {item.tag ? (
                    <>
                      <rect
                        x={x + 10}
                        y={y + 6}
                        width={Math.min(56, (colW - 24) * 0.5)}
                        height={14}
                        rx={3}
                        ry={3}
                        fill={tagFill}
                      />
                      <text
                        x={x + 10 + Math.min(56, (colW - 24) * 0.5) / 2}
                        y={y + 16}
                        textAnchor="middle"
                        fill={tagText}
                        fontFamily={font}
                        fontSize={8}
                        fontWeight={700}
                      >
                        {truncate(item.tag, 10)}
                      </text>
                    </>
                  ) : null}
                  <text
                    x={x + 10}
                    y={y + (item.tag ? itemH - 8 : itemH / 2 + 4)}
                    textAnchor="start"
                    fill={itemLabel}
                    fontFamily={font}
                    fontSize={10}
                    fontWeight={600}
                  >
                    {truncate(item.label, Math.floor((colW - 24) / 5.5))}
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

export const timelineRoadmapQuartersPreset: Preset<TimelineRoadmapQuartersData> = {
  id: 'timeline-roadmap-quarters',
  name: 'Roadmap — Quarters',
  category: 'timeline',
  tags: ['timeline', 'roadmap', 'quarters', 'planning'],
  description: 'Four-column roadmap with 1–4 items per quarter.',
  aiDescription:
    'Use when the text describes plans, activities, or deliverables organised into four time buckets — Q1/Q2/Q3/Q4, four months, four phases, or four release windows. Each column holds 1–4 items, optionally each with a short category tag. Prefer "timeline-horizontal-5event" or "timeline-horizontal-8event" when the content is event-dated milestones rather than grouped activities.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="4" width="27" height="32" rx="2" fill="#B5DAD2"/>
  <rect x="33" y="4" width="27" height="32" rx="2" fill="#B5DAD2"/>
  <rect x="63" y="4" width="27" height="32" rx="2" fill="#B5DAD2"/>
  <rect x="93" y="4" width="24" height="32" rx="2" fill="#B5DAD2"/>
  <rect x="3" y="4" width="27" height="8" rx="2" fill="#1B5B50"/>
  <rect x="33" y="4" width="27" height="8" rx="2" fill="#1B5B50"/>
  <rect x="63" y="4" width="27" height="8" rx="2" fill="#1B5B50"/>
  <rect x="93" y="4" width="24" height="8" rx="2" fill="#1B5B50"/>
  <rect x="6" y="15" width="21" height="6" rx="1" fill="#fff"/>
  <rect x="6" y="24" width="21" height="6" rx="1" fill="#fff"/>
  <rect x="36" y="15" width="21" height="6" rx="1" fill="#fff"/>
  <rect x="66" y="15" width="21" height="6" rx="1" fill="#fff"/>
  <rect x="66" y="24" width="21" height="6" rx="1" fill="#fff"/>
  <rect x="96" y="15" width="18" height="6" rx="1" fill="#fff"/>
</svg>`,
  render: Render,
  editableFields: ['quarters[].name', 'quarters[].items[].label', 'quarters[].items[].tag'],
  compatibleFamilies: ['timeline'],
};
