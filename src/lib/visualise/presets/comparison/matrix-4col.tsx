// =============================================================================
// Preset: matrix-4col
// Attribute comparison matrix — 4 option columns across the top, 2–6 rows
// underneath. Use when the text compares the same attributes across four
// alternatives. Same renderer family as matrix-3col, scaled up by one column.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  topic: z.string().max(40).optional(),
  columns: z
    .array(z.object({ name: z.string().min(1).max(14) }))
    .length(4),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(22),
        cells: z.array(z.string().min(1).max(18)).length(4),
      }),
    )
    .min(2)
    .max(6),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  topic: 'Option comparison',
  columns: [
    { name: 'Option A' },
    { name: 'Option B' },
    { name: 'Option C' },
    { name: 'Option D' },
  ],
  rows: [
    { label: 'Attribute one', cells: ['Value', 'Value', 'Value', 'Value'] },
    { label: 'Attribute two', cells: ['Value', 'Value', 'Value', 'Value'] },
    { label: 'Attribute three', cells: ['Value', 'Value', 'Value', 'Value'] },
    { label: 'Attribute four', cells: ['Value', 'Value', 'Value', 'Value'] },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const headerFill = paletteColor(paletteId, 0);
  const headerText = paletteColor(paletteId, 5);
  const rowAltFill = paletteColor(paletteId, 5);
  const rowLabelFill = paletteColor(paletteId, 4);
  const rowLabelText = paletteColor(paletteId, 0);
  const cellText = paletteColor(paletteId, 0);
  const borderColour = paletteColor(paletteId, 3);
  const topicText = paletteColor(paletteId, 0);

  const paddingX = 20;
  const topicH = data.topic ? 26 : 0;
  const headerH = 40;
  const labelColW = Math.min(160, width * 0.22);
  const tableX = paddingX;
  const tableW = width - paddingX * 2;
  const colW = (tableW - labelColW) / 4;

  const bodyH = height - topicH - headerH - 10;
  const rowH = Math.min(46, bodyH / data.rows.length);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {data.topic ? (
        <text
          x={width / 2}
          y={18}
          textAnchor="middle"
          fontFamily={font}
          fontSize={13}
          fontWeight={600}
          fill={topicText}
          opacity={0.85}
        >
          {truncate(data.topic, 40)}
        </text>
      ) : null}

      {/* Header row */}
      <rect
        x={tableX + labelColW}
        y={topicH}
        width={tableW - labelColW}
        height={headerH}
        fill={headerFill}
        rx={6}
        ry={6}
      />
      {data.columns.map((col, i) => {
        const cx = tableX + labelColW + colW * i + colW / 2;
        const nodeId = `col-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <text
              x={cx}
              y={topicH + headerH / 2 + 5}
              textAnchor="middle"
              fontFamily={font}
              fontSize={12}
              fontWeight={700}
              fill={headerText}
            >
              {truncate(col.name, 14)}
            </text>
          </g>
        );
      })}

      {/* Rows */}
      {data.rows.map((row, r) => {
        const y = topicH + headerH + r * rowH;
        const nodeId = `row-${r}`;
        const altFill = customColors[nodeId] ?? (r % 2 === 0 ? rowAltFill : 'transparent');
        return (
          <g key={nodeId} data-id={nodeId}>
            {r % 2 === 0 ? (
              <rect
                x={tableX}
                y={y}
                width={tableW}
                height={rowH}
                fill={altFill}
                opacity={0.5}
              />
            ) : null}

            <rect
              x={tableX}
              y={y}
              width={labelColW}
              height={rowH}
              fill={rowLabelFill}
              opacity={0.4}
            />
            <text
              x={tableX + 12}
              y={y + rowH / 2 + 4}
              fontFamily={font}
              fontSize={12}
              fontWeight={600}
              fill={rowLabelText}
            >
              {truncate(row.label, 22)}
            </text>

            {row.cells.map((cell, c) => {
              const cx = tableX + labelColW + colW * c + colW / 2;
              return (
                <text
                  key={`cell-${c}`}
                  x={cx}
                  y={y + rowH / 2 + 4}
                  textAnchor="middle"
                  fontFamily={font}
                  fontSize={11}
                  fill={cellText}
                >
                  {truncate(cell, 18)}
                </text>
              );
            })}

            <line
              x1={tableX}
              y1={y + rowH}
              x2={tableX + tableW}
              y2={y + rowH}
              stroke={borderColour}
              strokeWidth={0.75}
              opacity={0.7}
            />
          </g>
        );
      })}
    </svg>
  );
}

export const matrix4ColPreset: Preset<Data> = {
  id: 'matrix-4col',
  name: 'Comparison Matrix — 4 Columns',
  category: 'comparison',
  tags: ['matrix', 'comparison', 'four-column', 'attribute-grid'],
  description: '4-option attribute comparison grid with 2–6 attribute rows.',
  aiDescription:
    'Use when the text compares 4 alternatives against the same set of attributes. Each column names an option, each row names an attribute, each cell carries a short value (under 18 chars). Prefer "matrix-3col" when there are only 3 options; prefer "con-raci-matrix-4col" when the 4 columns are roles and cells are RACI assignments (R/A/C/I), not free-text values.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="34" y="4" width="82" height="8" fill="#1B5B50"/>
  <rect x="4" y="14" width="30" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <rect x="4" y="22" width="30" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <rect x="4" y="30" width="30" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <line x1="54" y1="14" x2="54" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="74" y1="14" x2="74" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="94" y1="14" x2="94" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="20" x2="116" y2="20" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="28" x2="116" y2="28" stroke="#7EBFB2" stroke-width="0.4"/>
</svg>`,
  render: Render,
  editableFields: ['topic', 'columns[].name', 'rows[].label', 'rows[].cells[]'],
  compatibleFamilies: ['comparison'],
};
