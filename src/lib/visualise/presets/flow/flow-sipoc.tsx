// =============================================================================
// Preset: flow-sipoc
// SIPOC diagram — 5 fixed columns (Suppliers, Inputs, Process, Outputs,
// Customers). Each column holds 2–5 bulleted items. The "Process" column
// sits centrally and is usually populated with high-level steps.
// Classic Six Sigma / process-improvement tool.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, gradientSequence, lighten } from '../../palettes';

const itemsSchema = z.array(z.string().min(1).max(40)).min(2).max(5);

const dataSchema = z.object({
  suppliers: itemsSchema,
  inputs: itemsSchema,
  process: itemsSchema,
  outputs: itemsSchema,
  customers: itemsSchema,
});

type FlowSipocData = z.infer<typeof dataSchema>;

const defaultData: FlowSipocData = {
  suppliers: ['Ready-mix plant', 'Reinforcement fabricator', 'Formwork hire'],
  inputs: ['C32/40 concrete', '10 kg/m³ rebar', 'Modular formwork'],
  process: ['Set out', 'Excavate', 'Pour and cure', 'Hand over'],
  outputs: ['RC slab', 'Pour record', 'Concrete cube test result'],
  customers: ['MEICA installers', 'Principal contractor', 'Client'],
};

const COLS: Array<{ id: string; header: string; field: keyof FlowSipocData }> = [
  { id: 's', header: 'Suppliers', field: 'suppliers' },
  { id: 'i', header: 'Inputs', field: 'inputs' },
  { id: 'p', header: 'Process', field: 'process' },
  { id: 'o', header: 'Outputs', field: 'outputs' },
  { id: 'c', header: 'Customers', field: 'customers' },
];

function Render({
  data,
  settings,
  width,
  height,
}: PresetRenderProps<FlowSipocData>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const palette = getPalette(paletteId);
  // SIPOC reads left-to-right upstream-to-downstream — per handover recipe,
  // Pattern A for each column header so the 5-stage flow is visually clear.
  const headerFills = gradientSequence(palette, COLS.length);
  const headerText = palette.text;
  const cellFill = lighten(palette.nodeFill, 0.85);
  const cellText = palette.nodeFill;
  const accentColour = palette.accent;

  const pad = 8;
  const colGap = 4;
  const colW = (width - pad * 2 - colGap * 4) / 5;
  const headerH = 28;
  const cellH = Math.max(18, Math.min(26, (height - pad * 2 - headerH - 8) / 5));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {COLS.map((col, ci) => {
        const x = pad + ci * (colW + colGap);
        const items = data[col.field];
        const headerId = `col-${col.id}`;
        const headerColour = customColors[headerId] ?? headerFills[ci];

        return (
          <g key={col.id}>
            <g data-id={headerId}>
              <rect x={x} y={pad} width={colW} height={headerH} rx={4} ry={4} fill={headerColour} />
              <text
                x={x + colW / 2}
                y={pad + headerH / 2 + 5}
                textAnchor="middle"
                fill={headerText}
                fontFamily={font}
                fontSize={13}
                fontWeight={700}
              >
                {col.header}
              </text>
            </g>

            {items.map((item, ii) => {
              const nodeId = `${col.id}-${ii}`;
              const y = pad + headerH + 6 + ii * (cellH + 2);
              const fill = customColors[nodeId] ?? cellFill;
              return (
                <g key={nodeId} data-id={nodeId}>
                  <rect x={x} y={y} width={colW} height={cellH} rx={3} ry={3} fill={fill} />
                  <circle cx={x + 8} cy={y + cellH / 2} r={2} fill={accentColour} />
                  <text
                    x={x + 14}
                    y={y + cellH / 2 + 4}
                    textAnchor="start"
                    fill={cellText}
                    fontFamily={font}
                    fontSize={Math.min(11, colW / 10)}
                  >
                    {item}
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

export const flowSipocPreset: Preset<FlowSipocData> = {
  id: 'flow-sipoc',
  name: 'SIPOC — Suppliers, Inputs, Process, Outputs, Customers',
  category: 'flow',
  tags: ['process', 'sipoc', 'six-sigma', 'commercial'],
  description: 'SIPOC diagram — 5 columns covering supply chain from supplier to customer.',
  aiDescription:
    'Use when the text describes a process in end-to-end supplier-to-customer terms: who supplies what, what inputs are needed, the process steps, what outputs are produced, and who receives them. Classic for process-improvement writeups, lean/six-sigma contexts, and commercial scope-definition. Do not use for simple sequential workflows without an upstream/downstream dimension — pick a linear flow preset instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="4" width="22" height="8" rx="1" fill="#1B5B50"/>
  <rect x="26" y="4" width="22" height="8" rx="1" fill="#1B5B50"/>
  <rect x="50" y="4" width="22" height="8" rx="1" fill="#1B5B50"/>
  <rect x="74" y="4" width="22" height="8" rx="1" fill="#1B5B50"/>
  <rect x="98" y="4" width="20" height="8" rx="1" fill="#1B5B50"/>
  <rect x="2" y="14" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="2" y="21" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="26" y="14" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="26" y="21" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="50" y="14" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="50" y="21" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="50" y="28" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="74" y="14" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="74" y="21" width="22" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="98" y="14" width="20" height="5" rx="1" fill="#B5DAD2"/>
  <rect x="98" y="21" width="20" height="5" rx="1" fill="#B5DAD2"/>
</svg>`,
  render: Render,
  editableFields: ['suppliers[]', 'inputs[]', 'process[]', 'outputs[]', 'customers[]'],
  compatibleFamilies: ['flow', 'process'],
};
