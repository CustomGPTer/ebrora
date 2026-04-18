// =============================================================================
// Preset: table-clean
// Minimal multi-column data table — one header row, 2–8 data rows, 3–5
// columns. Unlike matrix-3col/4col there is no row-label gutter — every
// column is equal weight and carries a named header. Use for tabular data
// that doesn't fit the "attribute × option" frame (schedules, structured
// lists, sourcing tables).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z
  .object({
    topic: z.string().max(40).optional(),
    columns: z
      .array(z.object({ name: z.string().min(1).max(18) }))
      .min(3)
      .max(5),
    rows: z
      .array(z.object({ cells: z.array(z.string().max(22)).min(3).max(5) }))
      .min(2)
      .max(8),
  })
  .refine((d) => d.rows.every((r) => r.cells.length === d.columns.length), {
    message: 'Every row must have one cell per column',
  });

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  topic: 'Data table',
  columns: [
    { name: 'Column one' },
    { name: 'Column two' },
    { name: 'Column three' },
    { name: 'Column four' },
  ],
  rows: [
    { cells: ['Value', 'Value', 'Value', 'Value'] },
    { cells: ['Value', 'Value', 'Value', 'Value'] },
    { cells: ['Value', 'Value', 'Value', 'Value'] },
    { cells: ['Value', 'Value', 'Value', 'Value'] },
    { cells: ['Value', 'Value', 'Value', 'Value'] },
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
  const cellText = paletteColor(paletteId, 0);
  const borderColour = paletteColor(paletteId, 3);
  const topicText = paletteColor(paletteId, 0);

  const paddingX = 24;
  const topicH = data.topic ? 26 : 0;
  const headerH = 40;

  const tableX = paddingX;
  const tableW = width - paddingX * 2;
  const colW = tableW / data.columns.length;
  const bodyH = height - topicH - headerH - 16;
  const rowH = Math.min(44, bodyH / Math.max(1, data.rows.length));

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

      {/* Header band */}
      <rect
        x={tableX}
        y={topicH}
        width={tableW}
        height={headerH}
        fill={headerFill}
        rx={6}
        ry={6}
      />
      {data.columns.map((col, i) => {
        const cx = tableX + colW * i + colW / 2;
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
              {truncate(col.name, 18)}
            </text>
          </g>
        );
      })}

      {/* Data rows */}
      {data.rows.map((row, r) => {
        const y = topicH + headerH + r * rowH;
        const nodeId = `row-${r}`;
        const altFill = customColors[nodeId] ?? (r % 2 === 0 ? rowAltFill : 'transparent');
        return (
          <g key={nodeId} data-id={nodeId}>
            {r % 2 === 0 ? (
              <rect x={tableX} y={y} width={tableW} height={rowH} fill={altFill} opacity={0.5} />
            ) : null}

            {row.cells.map((cell, c) => {
              const cx = tableX + colW * c + colW / 2;
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
                  {truncate(cell, 22)}
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
              opacity={0.65}
            />
          </g>
        );
      })}

      {/* Column vertical gridlines */}
      {data.columns.slice(1).map((_, i) => {
        const vx = tableX + colW * (i + 1);
        return (
          <line
            key={`vgrid-${i}`}
            x1={vx}
            y1={topicH + headerH}
            x2={vx}
            y2={topicH + headerH + data.rows.length * rowH}
            stroke={borderColour}
            strokeWidth={0.5}
            opacity={0.4}
          />
        );
      })}
    </svg>
  );
}

export const tableCleanPreset: Preset<Data> = {
  id: 'table-clean',
  name: 'Clean Table',
  category: 'comparison',
  tags: ['table', 'tabular', 'data', 'grid', 'list'],
  description: 'Multi-column table with a header row and 2–8 data rows, no row-label gutter.',
  aiDescription:
    'Use for tabular data where every column is equal-weight — a schedule, a sourcing list, a specification table. 3–5 columns with named headers; 2–8 rows of free-form cell values (short, under 22 chars). Every row must have exactly as many cells as there are columns. Prefer "matrix-3col" or "matrix-4col" when the first column is an attribute-name gutter and the remaining columns are options being compared; prefer "side-by-side-2col" when the content is two parallel narrative lists rather than a grid.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="112" height="8" fill="#1B5B50"/>
  <rect x="4" y="14" width="112" height="6" fill="#E6F0EE"/>
  <rect x="4" y="28" width="112" height="6" fill="#E6F0EE"/>
  <line x1="33" y1="4" x2="33" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="62" y1="4" x2="62" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="91" y1="4" x2="91" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="20" x2="116" y2="20" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="28" x2="116" y2="28" stroke="#7EBFB2" stroke-width="0.4"/>
</svg>`,
  render: Render,
  editableFields: ['topic', 'columns[].name', 'rows[].cells[]'],
  compatibleFamilies: ['comparison'],
};
