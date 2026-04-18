// =============================================================================
// Preset: matrix-3col
// Attribute comparison matrix — 3 option columns across the top, 2–6 rows
// underneath. Each row has a label (attribute name) and 3 cells (one value
// per option). Use when the text compares the same attributes across three
// alternatives.
//
// Distinct from con-raci-matrix-4col (RACI badges, 4 role columns,
// construction-scoped) and side-by-side-2col (no shared attribute rows).
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, lighten } from '../../palettes';

const dataSchema = z.object({
  topic: z.string().max(40).optional(),
  columns: z
    .array(z.object({ name: z.string().min(1).max(18) }))
    .length(3),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(22),
        cells: z.array(z.string().min(1).max(22)).length(3),
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
  ],
  rows: [
    { label: 'Attribute one', cells: ['Value', 'Value', 'Value'] },
    { label: 'Attribute two', cells: ['Value', 'Value', 'Value'] },
    { label: 'Attribute three', cells: ['Value', 'Value', 'Value'] },
    { label: 'Attribute four', cells: ['Value', 'Value', 'Value'] },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  const headerFill = palette.accent;
  // Header row sits on accent — its text needs accentText contrast.
  const headerText = palette.accentText;
  const rowAltFill = palette.bg;
  const rowLabelFill = lighten(palette.nodeFill, 0.85);
  const rowLabelText = palette.nodeFill;
  const cellText = palette.nodeFill;
  const borderColour = palette.nodeStroke;
  const topicText = palette.nodeFill;

  const paddingX = 24;
  const topicH = data.topic ? 26 : 0;
  const headerH = 40;
  const labelColW = Math.min(180, width * 0.26);
  const tableX = paddingX;
  const tableW = width - paddingX * 2;
  const colW = (tableW - labelColW) / 3;

  const bodyH = height - topicH - headerH - 10;
  const rowH = Math.min(48, bodyH / data.rows.length);

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

      {/* Header row — empty label cell + 3 column names */}
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
              fontSize={13}
              fontWeight={700}
              fill={headerText}
            >
              {truncate(col.name, 16)}
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
            {/* Row background */}
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

            {/* Row label block */}
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

            {/* Cells */}
            {row.cells.map((cell, c) => {
              const cx = tableX + labelColW + colW * c + colW / 2;
              return (
                <text
                  key={`cell-${c}`}
                  x={cx}
                  y={y + rowH / 2 + 4}
                  textAnchor="middle"
                  fontFamily={font}
                  fontSize={12}
                  fill={cellText}
                >
                  {truncate(cell, 22)}
                </text>
              );
            })}

            {/* Row bottom border */}
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

export const matrix3ColPreset: Preset<Data> = {
  id: 'matrix-3col',
  name: 'Comparison Matrix — 3 Columns',
  category: 'comparison',
  tags: ['matrix', 'comparison', 'three-column', 'attribute-grid'],
  description: '3-option attribute comparison grid with 2–6 attribute rows.',
  aiDescription:
    'Use when the text compares 3 alternatives against the same set of attributes — a feature grid or spec sheet shape. Each column names an option, each row names an attribute, and each cell carries that option\'s value for that attribute (short values, under 22 chars). Prefer "matrix-4col" for 4 options; prefer "side-by-side-2col" for 2 options described as narrative lists rather than attribute grids; prefer "vs-card" when the comparison is headline-style with named numeric stats.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="38" y="4" width="78" height="8" fill="#1B5B50"/>
  <rect x="4" y="14" width="34" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <rect x="4" y="22" width="34" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <rect x="4" y="30" width="34" height="6" fill="#B5DAD2" fill-opacity="0.6"/>
  <line x1="64" y1="14" x2="64" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="90" y1="14" x2="90" y2="36" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="20" x2="116" y2="20" stroke="#7EBFB2" stroke-width="0.4"/>
  <line x1="4" y1="28" x2="116" y2="28" stroke="#7EBFB2" stroke-width="0.4"/>
</svg>`,
  render: Render,
  editableFields: ['topic', 'columns[].name', 'rows[].label', 'rows[].cells[]'],
  compatibleFamilies: ['comparison'],
};
