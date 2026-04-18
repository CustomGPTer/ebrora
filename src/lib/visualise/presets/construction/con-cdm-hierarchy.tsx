// =============================================================================
// Preset: con-cdm-hierarchy
// CDM 2015 duty-holder hierarchy — Client, Principal Designer, Principal
// Contractor, Designers, Contractors, Workers.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { getPalette, lighten, darken } from '../../palettes';

const dataSchema = z.object({
  client: z.string().min(1).max(40).default('Client'),
  principalDesigner: z.string().min(1).max(40).default('Principal Designer'),
  principalContractor: z.string().min(1).max(40).default('Principal Contractor'),
  designers: z.string().min(1).max(40).default('Designers'),
  contractors: z.string().min(1).max(40).default('Contractors'),
  workers: z.string().min(1).max(40).default('Workers'),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  client: 'Client',
  principalDesigner: 'Principal Designer',
  principalContractor: 'Principal Contractor',
  designers: 'Designers',
  contractors: 'Contractors',
  workers: 'Workers',
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const palette = getPalette(p);
  const font = settings.font ?? 'Inter, sans-serif';
  // Pattern D per handover: Client accent (top); rest gradient by hierarchy level.
  // 4 depth levels — client, principals, designers/contractors, workers.
  const lineColor = palette.nodeStroke;
  const clientFill = palette.accent;
  const clientText = palette.accentText;
  const principalFill = palette.nodeFill;
  const designerFill = darken(palette.nodeFill, 0.08);
  const workerFill = lighten(palette.nodeFill, 0.3);
  const nodeText = palette.text;
  // Workers sit on a lightened fill — dark text reads better than `text` (which
  // is tuned for full nodeFill).
  const workerText = palette.nodeFill;

  const boxW = Math.min(180, (width - 40) / 2 - 16);
  const boxH = 36;
  const cx = width / 2;

  // Layout: Client at top; PD and PC on row 2; Designers/Contractors on row 3; Workers at bottom centre
  const rows = 4;
  const yStep = (height - boxH) / (rows - 1);
  const clientY = 8;
  const row2Y = clientY + yStep - 12;
  const row3Y = row2Y + yStep - 10;
  const workersY = row3Y + yStep - 8;

  const pdX = cx - boxW - 12;
  const pcX = cx + 12;
  const desX = cx - boxW - 12;
  const conX = cx + 12;

  const box = (id: string, x: number, y: number, label: string, fill: string, textFill: string, bold = false) => (
    <g key={id} data-id={id}>
      <rect x={x} y={y} width={boxW} height={boxH} rx={6} fill={fill} />
      <text x={x + boxW / 2} y={y + boxH / 2 + 4} textAnchor="middle" fontFamily={font} fontSize={12} fontWeight={bold ? 700 : 600} fill={textFill}>
        {truncate(label, 26)}
      </text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Connector lines */}
      <line x1={cx} y1={clientY + boxH} x2={cx} y2={row2Y - 4} stroke={lineColor} strokeWidth={2} />
      <line x1={pdX + boxW / 2} y1={row2Y - 4} x2={pcX + boxW / 2} y2={row2Y - 4} stroke={lineColor} strokeWidth={2} />
      <line x1={pdX + boxW / 2} y1={row2Y - 4} x2={pdX + boxW / 2} y2={row2Y} stroke={lineColor} strokeWidth={2} />
      <line x1={pcX + boxW / 2} y1={row2Y - 4} x2={pcX + boxW / 2} y2={row2Y} stroke={lineColor} strokeWidth={2} />

      <line x1={pdX + boxW / 2} y1={row2Y + boxH} x2={desX + boxW / 2} y2={row3Y} stroke={lineColor} strokeWidth={2} />
      <line x1={pcX + boxW / 2} y1={row2Y + boxH} x2={conX + boxW / 2} y2={row3Y} stroke={lineColor} strokeWidth={2} />

      <line x1={desX + boxW / 2} y1={row3Y + boxH} x2={cx} y2={workersY} stroke={lineColor} strokeWidth={2} />
      <line x1={conX + boxW / 2} y1={row3Y + boxH} x2={cx} y2={workersY} stroke={lineColor} strokeWidth={2} />

      {box('client', cx - boxW / 2, clientY, data.client, clientFill, clientText, true)}
      {box('principal-designer', pdX, row2Y, data.principalDesigner, principalFill, nodeText)}
      {box('principal-contractor', pcX, row2Y, data.principalContractor, principalFill, nodeText)}
      {box('designers', desX, row3Y, data.designers, designerFill, nodeText)}
      {box('contractors', conX, row3Y, data.contractors, designerFill, nodeText)}
      {box('workers', cx - boxW / 2, workersY, data.workers, workerFill, workerText)}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const conCdmHierarchyPreset: Preset<Data> = {
  id: 'con-cdm-hierarchy',
  name: 'CDM 2015 Hierarchy',
  category: 'construction',
  tags: ['cdm', 'hierarchy', 'duty-holders', 'regulations'],
  description: 'CDM 2015 duty-holder structure from Client through to Workers.',
  aiDescription: 'Standard CDM 2015 duty-holder hierarchy: Client at the top, Principal Designer and Principal Contractor on the second row, Designers and Contractors on the third row, Workers at the bottom. Use whenever the text discusses CDM roles, design/construction phase responsibilities, or the statutory chain of duty-holders.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="48" y="2" width="24" height="6" rx="1" fill="#1B5B50"/>
  <rect x="18" y="12" width="32" height="6" rx="1" fill="#2A7A6C"/>
  <rect x="70" y="12" width="32" height="6" rx="1" fill="#2A7A6C"/>
  <rect x="18" y="22" width="32" height="6" rx="1" fill="#4A9A8A"/>
  <rect x="70" y="22" width="32" height="6" rx="1" fill="#4A9A8A"/>
  <rect x="48" y="32" width="24" height="6" rx="1" fill="#7EBFB2"/>
</svg>`,
  render: Render,
  editableFields: ['client', 'principalDesigner', 'principalContractor', 'designers', 'contractors', 'workers'],
  compatibleFamilies: ['construction', 'hierarchy'],
};
