// =============================================================================
// Preset: con-risk-matrix-5x5
// 5x5 risk matrix — likelihood (rows) x severity (columns), cells coloured
// by risk score (likelihood × severity). Optional risk markers plotted on cells.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const dataSchema = z.object({
  likelihoodLabels: z.array(z.string().max(20)).length(5).default([
    'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain',
  ]),
  severityLabels: z.array(z.string().max(20)).length(5).default([
    'Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic',
  ]),
  risks: z.array(z.object({
    label: z.string().min(1).max(30),
    likelihood: z.number().int().min(1).max(5),
    severity: z.number().int().min(1).max(5),
  })).max(6).default([]),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  likelihoodLabels: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'],
  severityLabels: ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
  risks: [
    { label: 'Underground service strike', likelihood: 3, severity: 4 },
    { label: 'Slips & trips', likelihood: 4, severity: 2 },
    { label: 'Plant overturn', likelihood: 2, severity: 5 },
    { label: 'Noise exposure', likelihood: 4, severity: 3 },
  ],
};

// Map risk score (likelihood × severity) → band colour.
// 1–4 low (green), 5–9 medium (amber), 10–16 high (orange), 17+ very high (red).
function scoreColor(score: number): string {
  if (score <= 4) return '#22c55e';
  if (score <= 9) return '#fbbf24';
  if (score <= 16) return '#fb923c';
  return '#dc2626';
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const font = settings.font ?? 'Inter, sans-serif';
  const p = settings.paletteId;
  const textDark = paletteColor(p, 0);
  const textLight = '#ffffff';

  const padLeft = 92;
  const padTop = 40;
  const padBottom = 44;
  const padRight = 16;
  const gridW = width - padLeft - padRight;
  const gridH = height - padTop - padBottom;
  const cellW = gridW / 5;
  const cellH = gridH / 5;

  // Likelihood axis: row index i corresponds to likelihood (5 - i), so L=5 is top.
  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Axis titles */}
      <text x={12} y={padTop + gridH / 2} transform={`rotate(-90, 12, ${padTop + gridH / 2})`} textAnchor="middle" fontFamily={font} fontSize={11} fontWeight={600} fill={textDark}>
        Likelihood
      </text>
      <text x={padLeft + gridW / 2} y={height - 6} textAnchor="middle" fontFamily={font} fontSize={11} fontWeight={600} fill={textDark}>
        Severity
      </text>

      {/* Cells */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => {
          const likelihood = 5 - row;
          const severity = col + 1;
          const score = likelihood * severity;
          const x = padLeft + col * cellW;
          const y = padTop + row * cellH;
          return (
            <g key={`cell-${row}-${col}`}>
              <rect x={x} y={y} width={cellW} height={cellH} fill={scoreColor(score)} fillOpacity={0.75} stroke={paletteColor(p, 5)} strokeWidth={1.5} />
              <text x={x + cellW - 6} y={y + 12} textAnchor="end" fontFamily={font} fontSize={9} fontWeight={600} fill={textLight} fillOpacity={0.9}>
                {score}
              </text>
            </g>
          );
        }),
      )}

      {/* Row labels */}
      {data.likelihoodLabels.map((lbl, i) => (
        <text key={`lk-${i}`} x={padLeft - 6} y={padTop + (5 - i - 1) * cellH + cellH / 2 + 4} textAnchor="end" fontFamily={font} fontSize={10} fill={textDark}>
          {truncate(lbl, 14)}
        </text>
      ))}

      {/* Column labels */}
      {data.severityLabels.map((lbl, i) => (
        <text key={`sv-${i}`} x={padLeft + i * cellW + cellW / 2} y={padTop - 6} textAnchor="middle" fontFamily={font} fontSize={10} fill={textDark}>
          {truncate(lbl, 12)}
        </text>
      ))}

      {/* Plotted risks */}
      {data.risks.map((risk, i) => {
        const col = risk.severity - 1;
        const row = 5 - risk.likelihood;
        const cx = padLeft + col * cellW + cellW / 2;
        const cy = padTop + row * cellH + cellH / 2;
        const nodeId = `risk-${i}`;
        return (
          <g key={nodeId} data-id={nodeId}>
            <circle cx={cx} cy={cy} r={11} fill={paletteColor(p, 0)} stroke="#ffffff" strokeWidth={2} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontFamily={font} fontSize={10} fontWeight={700} fill="#ffffff">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Legend for plotted risks */}
      {data.risks.length > 0 ? (
        <g transform={`translate(${padLeft}, ${height - 28})`}>
          {data.risks.slice(0, 4).map((risk, i) => (
            <text key={`leg-${i}`} x={i * (gridW / Math.min(data.risks.length, 4))} y={0} fontFamily={font} fontSize={9} fill={textDark}>
              <tspan fontWeight={700}>{i + 1}.</tspan> {truncate(risk.label, 18)}
            </text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

function truncate(s: string, max: number) { return s.length <= max ? s : `${s.slice(0, max - 1)}…`; }

export const conRiskMatrix5x5Preset: Preset<Data> = {
  id: 'con-risk-matrix-5x5',
  name: 'Risk Matrix — 5×5',
  category: 'construction',
  tags: ['risk', 'matrix', 'likelihood', 'severity', 'heatmap'],
  description: 'Standard 5×5 risk matrix with likelihood × severity scoring.',
  aiDescription: '5×5 risk matrix with likelihood on the vertical axis (1=rare, 5=almost certain) and severity on the horizontal axis (1=insignificant, 5=catastrophic). Cells are coloured by score (1–4 green, 5–9 amber, 10–16 orange, 17+ red). Up to 6 specific risks can be plotted as numbered markers. Use for RAMS risk tables, CDM hazard reviews, or any probability × consequence assessment.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="2" width="18" height="7" fill="#22c55e"/>
  <rect x="38" y="2" width="18" height="7" fill="#22c55e"/>
  <rect x="56" y="2" width="18" height="7" fill="#fbbf24"/>
  <rect x="74" y="2" width="18" height="7" fill="#fb923c"/>
  <rect x="92" y="2" width="18" height="7" fill="#dc2626"/>
  <rect x="20" y="9" width="18" height="7" fill="#22c55e"/>
  <rect x="38" y="9" width="18" height="7" fill="#fbbf24"/>
  <rect x="56" y="9" width="18" height="7" fill="#fbbf24"/>
  <rect x="74" y="9" width="18" height="7" fill="#fb923c"/>
  <rect x="92" y="9" width="18" height="7" fill="#dc2626"/>
  <rect x="20" y="16" width="18" height="7" fill="#fbbf24"/>
  <rect x="38" y="16" width="18" height="7" fill="#fbbf24"/>
  <rect x="56" y="16" width="18" height="7" fill="#fb923c"/>
  <rect x="74" y="16" width="18" height="7" fill="#fb923c"/>
  <rect x="92" y="16" width="18" height="7" fill="#dc2626"/>
  <rect x="20" y="23" width="18" height="7" fill="#fbbf24"/>
  <rect x="38" y="23" width="18" height="7" fill="#fb923c"/>
  <rect x="56" y="23" width="18" height="7" fill="#fb923c"/>
  <rect x="74" y="23" width="18" height="7" fill="#dc2626"/>
  <rect x="92" y="23" width="18" height="7" fill="#dc2626"/>
  <rect x="20" y="30" width="18" height="7" fill="#fb923c"/>
  <rect x="38" y="30" width="18" height="7" fill="#fb923c"/>
  <rect x="56" y="30" width="18" height="7" fill="#dc2626"/>
  <rect x="74" y="30" width="18" height="7" fill="#dc2626"/>
  <rect x="92" y="30" width="18" height="7" fill="#dc2626"/>
</svg>`,
  render: Render,
  editableFields: ['likelihoodLabels', 'severityLabels', 'risks[].label', 'risks[].likelihood', 'risks[].severity'],
  compatibleFamilies: ['construction'],
};
