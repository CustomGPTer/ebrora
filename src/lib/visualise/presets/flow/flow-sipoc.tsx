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

// Batch 2b — raise item max from 40 → 60 chars and introduce optional
// descriptions. `itemsSchema` remains a plain string array so existing
// drafts stay valid; `itemDescriptionsSchema` is a parallel optional array
// that, when populated, is rendered as a small second line beneath each
// bullet. The AI is instructed (via systemPrompt.ts) to populate it by
// default when the source text carries enough detail.
const itemsSchema = z.array(z.string().min(1).max(60)).min(2).max(5);
const itemDescriptionsSchema = z.array(z.string().max(120)).max(5).optional();

const dataSchema = z.object({
  suppliers: itemsSchema,
  inputs: itemsSchema,
  process: itemsSchema,
  outputs: itemsSchema,
  customers: itemsSchema,
  // Batch 2b — parallel optional descriptions, one per item in the
  // corresponding column. Index-aligned with the items array; index N of
  // `suppliersDescriptions` describes index N of `suppliers`. AI is free
  // to provide descriptions for some columns and not others.
  suppliersDescriptions: itemDescriptionsSchema,
  inputsDescriptions: itemDescriptionsSchema,
  processDescriptions: itemDescriptionsSchema,
  outputsDescriptions: itemDescriptionsSchema,
  customersDescriptions: itemDescriptionsSchema,
});

type FlowSipocData = z.infer<typeof dataSchema>;

const defaultData: FlowSipocData = {
  suppliers: ['Ready-mix plant', 'Reinforcement fabricator', 'Formwork hire'],
  inputs: ['C32/40 concrete', '10 kg/m³ rebar', 'Modular formwork'],
  process: ['Set out', 'Excavate', 'Pour and cure', 'Hand over'],
  outputs: ['RC slab', 'Pour record', 'Concrete cube test result'],
  customers: ['MEICA installers', 'Principal contractor', 'Client'],
  // Keep defaults terse — too much description on the sample data would
  // make the placeholder look busier than a real populated SIPOC.
  suppliersDescriptions: [
    'Local batching facility with next-day delivery',
    'Off-site fabrication to cut list',
    'Weekly hire with supplier-managed stock',
  ],
  inputsDescriptions: [
    'Minimum 40 N/mm² strength, slump 100–150 mm',
    '10 kg/m³ rebar ratio, B500B carbon steel',
    'Peri or Doka proprietary system formwork',
  ],
  processDescriptions: [
    'Survey control points, mark excavation limits',
    'Bulk dig to formation, inspect subgrade',
    '24-hr pour, 7-day wet cure, cubes lifted',
    'Final inspection and handover documentation',
  ],
  outputsDescriptions: [
    '250 mm reinforced slab on grade',
    'Batch ticket log with slump results',
    '7- and 28-day cube crush test reports',
  ],
  customersDescriptions: [
    'M&E installers fitting services on slab',
    'Takes over for follow-on trades',
    'Accepts asset into long-term ownership',
  ],
};

const COLS: Array<{
  id: string;
  header: string;
  field: keyof FlowSipocData;
  descriptionsField: keyof FlowSipocData;
}> = [
  { id: 's', header: 'Suppliers', field: 'suppliers', descriptionsField: 'suppliersDescriptions' },
  { id: 'i', header: 'Inputs', field: 'inputs', descriptionsField: 'inputsDescriptions' },
  { id: 'p', header: 'Process', field: 'process', descriptionsField: 'processDescriptions' },
  { id: 'o', header: 'Outputs', field: 'outputs', descriptionsField: 'outputsDescriptions' },
  { id: 'c', header: 'Customers', field: 'customers', descriptionsField: 'customersDescriptions' },
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
  const detailText = palette.nodeStroke;
  const accentColour = palette.accent;

  const pad = 8;
  const colGap = 4;
  const colW = (width - pad * 2 - colGap * 4) / 5;
  const headerH = 28;
  // Batch 2b — taller cells to carry an optional description under the label.
  // We compute the maximum number of items across all columns to allocate
  // vertical space consistently (otherwise short columns would have small
  // cells and long columns would have cramped ones). Cells are capped at 44
  // so a 2-item column doesn't inflate to massive rows.
  const maxItems = Math.max(...COLS.map((c) => (data[c.field] as string[]).length));
  const availableCellsH = height - pad * 2 - headerH - 8;
  const cellH = Math.max(
    28,
    Math.min(44, maxItems > 0 ? availableCellsH / maxItems - 2 : 28),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {COLS.map((col, ci) => {
        const x = pad + ci * (colW + colGap);
        const items = data[col.field] as string[];
        const descriptions = (data[col.descriptionsField] as string[] | undefined) ?? [];
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
              const description = descriptions[ii];
              // When we have a description, label sits near top and description
              // fills the remaining cell height. When only the label is present,
              // label is vertically centred as before.
              const labelBaselineY = description ? y + 14 : y + cellH / 2 + 4;
              const descriptionBaselineY = y + cellH - 6;
              return (
                <g key={nodeId} data-id={nodeId}>
                  <rect x={x} y={y} width={colW} height={cellH} rx={3} ry={3} fill={fill} />
                  <circle cx={x + 8} cy={labelBaselineY - 4} r={2} fill={accentColour} />
                  <text
                    x={x + 14}
                    y={labelBaselineY}
                    textAnchor="start"
                    fill={cellText}
                    fontFamily={font}
                    fontSize={Math.min(11, colW / 10)}
                    fontWeight={600}
                  >
                    {item}
                  </text>
                  {description ? (
                    <text
                      x={x + 14}
                      y={descriptionBaselineY}
                      textAnchor="start"
                      fill={detailText}
                      fontFamily={font}
                      fontSize={Math.min(9, colW / 12)}
                    >
                      {description}
                    </text>
                  ) : null}
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
  editableFields: [
    'suppliers[]',
    'inputs[]',
    'process[]',
    'outputs[]',
    'customers[]',
    'suppliersDescriptions[]',
    'inputsDescriptions[]',
    'processDescriptions[]',
    'outputsDescriptions[]',
    'customersDescriptions[]',
  ],
  compatibleFamilies: ['flow', 'process'],
};
