// =============================================================================
// Preset: con-raci-matrix-4col
// RACI matrix — tasks on rows, 4 roles on columns, R/A/C/I badges per cell.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const raciCell = z.enum(['R', 'A', 'C', 'I', '-']);

const dataSchema = z.object({
  roles: z.array(z.string().min(1).max(16)).length(4),
  tasks: z.array(z.object({
    name: z.string().min(1).max(40),
    assignments: z.array(raciCell).length(4),
  })).min(2).max(6),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  roles: ['PM', 'SGF', 'CSM', 'Subcontractor'],
  tasks: [
    { name: 'Produce RAMS', assignments: ['A', 'C', 'I', 'R'] },
    { name: 'Issue Permit to Work', assignments: ['I', 'R', 'A', 'C'] },
    { name: 'Site Induction', assignments: ['I', 'A', 'R', 'I'] },
    { name: 'Daily Briefing', assignments: ['I', 'R', 'C', 'I'] },
    { name: 'Toolbox Talk Delivery', assignments: ['I', 'A', 'C', 'R'] },
  ],
};

const RACI_LABEL: Record<string, string> = {
  R: 'Responsible',
  A: 'Accountable',
  C: 'Consulted',
  I: 'Informed',
  '-': '—',
};

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const p = settings.paletteId;
  const font = settings.font ?? 'Inter, sans-serif';
  const textDark = paletteColor(p, 0);
  const headerFill = paletteColor(p, 0);
  const headerText = paletteColor(p, 5);
  const rowAlt = paletteColor(p, 5);
  const borderColor = paletteColor(p, 4);

  const colors: Record<string, string> = {
    R: paletteColor(p, 0),
    A: paletteColor(p, 1),
    C: paletteColor(p, 2),
    I: paletteColor(p, 3),
    '-': paletteColor(p, 4),
  };

  const taskColW = Math.min(180, width * 0.35);
  const roleColW = (width - taskColW) / data.roles.length;
  const headerH = 30;
  const rowH = Math.min(28, (height - headerH - 8) / data.tasks.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Header row */}
      <rect x={0} y={0} width={width} height={headerH} fill={headerFill} />
      <text x={12} y={headerH / 2 + 4} fontFamily={font} fontSize={12} fontWeight={700} fill={headerText}>Task</text>
      {data.roles.map((role, i) => (
        <text key={`role-${i}`} x={taskColW + roleColW * i + roleColW / 2} y={headerH / 2 + 4} textAnchor="middle" fontFamily={font} fontSize={12} fontWeight={700} fill={headerText}>
          {truncate(role, 12)}
        </text>
      ))}

      {data.tasks.map((task, r) => {
        const y = headerH + r * rowH;
        return (
          <g key={`task-${r}`} data-id={`task-${r}`}>
            {r % 2 === 0 ? <rect x={0} y={y} width={width} height={rowH} fill={rowAlt} fillOpacity={0.25} /> : null}
            <text x={12} y={y + rowH / 2 + 4} fontFamily={font} fontSize={11} fill={textDark}>
              {truncate(task.name, 26)}
            </text>
            {task.assignments.map((cell, c) => {
              const cx = taskColW + roleColW * c + roleColW / 2;
              const cy = y + rowH / 2;
              const bg = colors[cell] ?? colors['-'];
              return (
                <g key={`cell-${r}-${c}`}>
                  <circle cx={cx} cy={cy} r={10} fill={bg} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontFamily={font} fontSize={11} fontWeight={700} fill={paletteColor(p, 5)}>
                    {cell}
                  </text>
                </g>
              );
            })}
            <line x1={0} y1={y + rowH} x2={width} y2={y + rowH} stroke={borderColor} strokeWidth={0.5} />
          </g>
        );
      })}

      {/* Legend */}
      <g>
        {(['R', 'A', 'C', 'I'] as const).map((k, i) => (
          <g key={`legend-${k}`} transform={`translate(${12 + i * 110}, ${height - 14})`}>
            <circle r={6} cx={0} cy={0} fill={colors[k]} />
            <text x={10} y={3} fontFamily={font} fontSize={10} fill={textDark}>
              <tspan fontWeight={700}>{k}</tspan> {RACI_LABEL[k]}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const conRaciMatrix4ColPreset: Preset<Data> = {
  id: 'con-raci-matrix-4col',
  name: 'RACI Matrix — 4 Roles',
  category: 'construction',
  tags: ['raci', 'responsibility', 'matrix', 'roles'],
  description: 'Tasks versus four roles, with Responsible/Accountable/Consulted/Informed badges.',
  aiDescription: 'RACI matrix with 4 role columns and 2–6 task rows. Each cell must be one of R, A, C, I, or "-" (not applicable). Use for responsibility assignment, NEC contract responsibility splits, or role-clarification exercises. Every task should have exactly one A (Accountable). Do NOT use unless the text explicitly lists roles/people alongside tasks — if the text is just a list of tasks or steps without role assignments, pick flow-linear-*, process-numbered-*, or a checklist format instead.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="116" height="8" fill="#1B5B50"/>
  <circle cx="48" cy="20" r="3" fill="#1B5B50"/>
  <circle cx="68" cy="20" r="3" fill="#2A7A6C"/>
  <circle cx="88" cy="20" r="3" fill="#4A9A8A"/>
  <circle cx="108" cy="20" r="3" fill="#7EBFB2"/>
  <circle cx="48" cy="30" r="3" fill="#2A7A6C"/>
  <circle cx="68" cy="30" r="3" fill="#1B5B50"/>
  <circle cx="88" cy="30" r="3" fill="#7EBFB2"/>
  <circle cx="108" cy="30" r="3" fill="#4A9A8A"/>
</svg>`,
  render: Render,
  editableFields: ['roles', 'tasks[].name', 'tasks[].assignments'],
  compatibleFamilies: ['construction', 'comparison'],
};
