// src/components/daywork-rate-calculator/DayworkRateCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  LABOUR_GRADES, RICS_DEFAULTS, RICS_EDITIONS,
  calculateDaywork, fmtGBP, nextLineId,
} from "@/data/daywork-rate-calculator";
import type { RICSEdition, LabourLine, PlantLine, MaterialLine, DayworkResult } from "@/data/daywork-rate-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG: Cost Breakdown Stacked Bar ─────────────────────────
function CostBreakdownBar({ result }: { result: DayworkResult }) {
  if (result.grandTotal === 0) return null;
  const W = 500, H = 80, PAD = { left: 10, right: 80, top: 10, bottom: 25 };
  const cw = W - PAD.left - PAD.right;
  const barH = 30;
  const scale = cw / result.grandTotal;
  const labW = result.labourTotal * scale;
  const plaW = result.plantTotal * scale;
  const matW = result.materialsTotal * scale;

  // Within each section, show base vs addition
  const labBaseW = result.labourBase * scale;
  const plaBaseW = result.plantBase * scale;
  const matBaseW = result.materialsBase * scale;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
      {/* Base cost (darker) */}
      <rect x={PAD.left} y={PAD.top} width={labBaseW} height={barH} fill="#1B5745" rx={2} />
      <rect x={PAD.left + labBaseW} y={PAD.top} width={labW - labBaseW} height={barH} fill="#2D8B6F" />
      <rect x={PAD.left + labW} y={PAD.top} width={plaBaseW} height={barH} fill="#B45309" />
      <rect x={PAD.left + labW + plaBaseW} y={PAD.top} width={plaW - plaBaseW} height={barH} fill="#D97706" />
      <rect x={PAD.left + labW + plaW} y={PAD.top} width={matBaseW} height={barH} fill="#6366F1" />
      <rect x={PAD.left + labW + plaW + matBaseW} y={PAD.top} width={matW - matBaseW} height={barH} fill="#818CF8" rx={2} />
      {/* Total label */}
      <text x={PAD.left + labW + plaW + matW + 4} y={PAD.top + barH / 2 + 4} fontSize={11} fontWeight={700} fill="#374151">{fmtGBP(result.grandTotal)}</text>
      {/* Legend */}
      {[
        { c: "#1B5745", l: `Labour: ${fmtGBP(result.labourTotal)} (${result.labourPct}%)` },
        { c: "#B45309", l: `Plant: ${fmtGBP(result.plantTotal)} (${result.plantPct}%)` },
        { c: "#6366F1", l: `Materials: ${fmtGBP(result.materialsTotal)} (${result.materialsPct}%)` },
      ].map((item, i) => (
        <g key={i}><rect x={PAD.left + i * 165} y={H - 10} width={8} height={6} fill={item.c} rx={1} />
          <text x={PAD.left + i * 165 + 11} y={H - 5} fontSize={7} fill="#6B7280">{item.l}</text></g>
      ))}
    </svg>
  );
}

// ─── SVG: Pie Chart ──────────────────────────────────────────
function CostPieChart({ result }: { result: DayworkResult }) {
  if (result.grandTotal === 0) return null;
  const W = 200, H = 200, cx = 100, cy = 90, r = 70;
  const slices = [
    { pct: result.labourPct, fill: "#1B5745", label: "Labour" },
    { pct: result.plantPct, fill: "#B45309", label: "Plant" },
    { pct: result.materialsPct, fill: "#6366F1", label: "Materials" },
  ].filter(s => s.pct > 0);

  let cumPct = 0;
  const paths = slices.map(s => {
    const startAngle = (cumPct / 100) * 2 * Math.PI - Math.PI / 2;
    cumPct += s.pct;
    const endAngle = (cumPct / 100) * 2 * Math.PI - Math.PI / 2;
    const largeArc = s.pct > 50 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + (r + 14) * Math.cos(midAngle), ly = cy + (r + 14) * Math.sin(midAngle);
    return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, lx, ly };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {paths.map(p => (
        <g key={p.label}>
          <path d={p.d} fill={p.fill} />
          <text x={p.lx} y={p.ly} textAnchor="middle" fontSize={8} fontWeight={600} fill={p.fill}>{p.pct}%</text>
        </g>
      ))}
      {/* Legend */}
      {slices.map((s, i) => (
        <g key={s.label}>
          <rect x={20 + i * 65} y={H - 14} width={8} height={8} fill={s.fill} rx={1} />
          <text x={30 + i * 65} y={H - 7} fontSize={8} fill="#6B7280">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Measured Comparison Bar ────────────────────────────
function MeasuredComparisonBar({ result }: { result: DayworkResult }) {
  if (!result.measuredComparison) return null;
  const mc = result.measuredComparison;
  const W = 400, H = 90, PAD = { left: 80, right: 60, top: 10, bottom: 10 };
  const cw = W - PAD.left - PAD.right;
  const maxV = Math.max(result.grandTotal, mc.measuredCost) * 1.15;
  const barH = 22;
  const dw = (result.grandTotal / maxV) * cw;
  const mw = (mc.measuredCost / maxV) * cw;
  const cheaper = mc.premium <= 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
      <text x={PAD.left - 4} y={PAD.top + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>Daywork</text>
      <rect x={PAD.left} y={PAD.top} width={dw} height={barH} fill={cheaper ? "#22C55E" : "#EF4444"} rx={2} />
      <text x={PAD.left + dw + 4} y={PAD.top + barH / 2 + 3} fontSize={9} fontWeight={600} fill={cheaper ? "#22C55E" : "#EF4444"}>{fmtGBP(result.grandTotal)}</text>
      <text x={PAD.left - 4} y={PAD.top + barH + 10 + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>Measured</text>
      <rect x={PAD.left} y={PAD.top + barH + 10} width={mw} height={barH} fill="#3B82F6" rx={2} />
      <text x={PAD.left + mw + 4} y={PAD.top + barH + 10 + barH / 2 + 3} fontSize={9} fontWeight={600} fill="#3B82F6">{fmtGBP(mc.measuredCost)}</text>
    </svg>
  );
}

// ─── Section Line Editors (defined outside main component) ───
function LabourSection({ lines, onChange, addLine, removeLine }: {
  lines: LabourLine[]; onChange: (lines: LabourLine[]) => void;
  addLine: () => void; removeLine: (id: string) => void;
}) {
  const update = (id: string, patch: Partial<LabourLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const setGrade = (id: string, gradeId: string) => {
    const grade = LABOUR_GRADES.find(g => g.id === gradeId);
    update(id, { gradeId, baseRate: grade?.baseRate || 16 });
  };

  return (
    <div className="space-y-2">
      {lines.map(l => (
        <div key={l.id} className="grid grid-cols-12 gap-2 items-end">
          <div className={l.gradeId === "custom" ? "col-span-3" : "col-span-4"}>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Grade</label>
            <select value={l.gradeId} onChange={e => setGrade(l.id, e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {LABOUR_GRADES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          {l.gradeId === "custom" && (
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Title</label>
              <input type="text" value={l.customLabel} onChange={e => update(l.id, { customLabel: e.target.value })} placeholder="Description"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          )}
          <div className={l.gradeId === "custom" ? "col-span-1" : "col-span-2"}>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">No.</label>
            <input type="number" value={l.numOperatives} onChange={e => update(l.id, { numOperatives: Math.max(1, parseInt(e.target.value) || 1) })} min={1}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Hours</label>
            <input type="number" value={l.hours} onChange={e => update(l.id, { hours: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={0.5}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Rate (£/hr)</label>
            <input type="number" value={l.baseRate} onChange={e => update(l.id, { baseRate: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={0.25}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2 text-right">
            <div className="text-xs font-bold text-gray-700">{fmtGBP(l.numOperatives * l.hours * l.baseRate)}</div>
            <button onClick={() => removeLine(l.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
          </div>
        </div>
      ))}
      <button onClick={addLine} className="text-xs font-medium text-ebrora hover:text-ebrora-dark">+ Add labour line</button>
    </div>
  );
}

function PlantSection({ lines, onChange, addLine, removeLine }: {
  lines: PlantLine[]; onChange: (lines: PlantLine[]) => void;
  addLine: () => void; removeLine: (id: string) => void;
}) {
  const update = (id: string, patch: Partial<PlantLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  return (
    <div className="space-y-2">
      {lines.map(l => (
        <div key={l.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Description</label>
            <input type="text" value={l.description} onChange={e => update(l.id, { description: e.target.value })} placeholder="e.g. 3t mini excavator"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Rate type</label>
            <select value={l.rateType} onChange={e => update(l.id, { rateType: e.target.value as PlantLine["rateType"] })}
              className="w-full px-2 py-1.5 text-xs border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              <option value="week">£/week</option><option value="day">£/day</option><option value="hour">£/hour</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Rate (£)</label>
            <input type="number" value={l.hireRate} onChange={e => update(l.id, { hireRate: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={1}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Qty used</label>
            <input type="number" value={l.quantity} onChange={e => update(l.id, { quantity: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={0.5}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2 text-right">
            <div className="text-xs font-bold text-gray-700">{fmtGBP(l.hireRate * l.quantity)}</div>
            <button onClick={() => removeLine(l.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
          </div>
        </div>
      ))}
      <button onClick={addLine} className="text-xs font-medium text-ebrora hover:text-ebrora-dark">+ Add plant line</button>
    </div>
  );
}

function MaterialsSection({ lines, onChange, addLine, removeLine }: {
  lines: MaterialLine[]; onChange: (lines: MaterialLine[]) => void;
  addLine: () => void; removeLine: (id: string) => void;
}) {
  const update = (id: string, patch: Partial<MaterialLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  return (
    <div className="space-y-2">
      {lines.map(l => (
        <div key={l.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Description</label>
            <input type="text" value={l.description} onChange={e => update(l.id, { description: e.target.value })} placeholder="e.g. 150mm PVC pipe"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Qty</label>
            <input type="number" value={l.quantity} onChange={e => update(l.id, { quantity: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={1}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Unit</label>
            <input type="text" value={l.unit} onChange={e => update(l.id, { unit: e.target.value })} placeholder="m / nr / kg"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Unit cost (£)</label>
            <input type="number" value={l.unitCost} onChange={e => update(l.id, { unitCost: Math.max(0, parseFloat(e.target.value) || 0) })} min={0} step={0.01}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="col-span-2 text-right">
            <div className="text-xs font-bold text-gray-700">{fmtGBP(l.quantity * l.unitCost)}</div>
            <button onClick={() => removeLine(l.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
          </div>
        </div>
      ))}
      <button onClick={addLine} className="text-xs font-medium text-ebrora hover:text-ebrora-dark">+ Add materials line</button>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  edition: RICSEdition,
  labourAddPct: number, plantAddPct: number, matAddPct: number,
  result: DayworkResult,
  dwkRef: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `DWK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("DAYWORK VALUATION SHEET", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`RICS Definition of Prime Cost of Daywork -- ${edition === "civil" ? "Civil Engineering" : "Building"} Edition`, M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 25, 1, 1, "FD"); doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Site:", header.site, M + halfW, y, 40); y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 50);
  drawFld("Prepared By:", header.assessedBy, M + halfW, y, 40); y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  if (dwkRef) drawFld("DWK Ref:", dwkRef, M + halfW, y, 0);
  y += 5;
  drawFld("Labour Addition:", `${labourAddPct}%`, M + 3, y, 0);
  drawFld("Plant Addition:", `${plantAddPct}%`, M + 60, y, 0);
  drawFld("Materials Addition:", `${matAddPct}%`, M + halfW + 20, y, 0);
  y += 8;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("DAYWORK VALUATION SHEET (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Grand total banner
  doc.setFillColor(27, 87, 69);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`GRAND TOTAL: ${fmtGBP(result.grandTotal)}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Labour: ${fmtGBP(result.labourTotal)} (${result.labourPct}%) | Plant: ${fmtGBP(result.plantTotal)} (${result.plantPct}%) | Materials: ${fmtGBP(result.materialsTotal)} (${result.materialsPct}%)`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // Helper to draw a section table
  const drawSectionTable = (title: string, headers: string[], colWidths: number[], rows: string[][], subtotal: [string, string, string]) => {
    checkPage(15 + rows.length * 6);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(title, M, y); y += 5;
    let cx = M;
    headers.forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, colWidths[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
      doc.text(h, cx + 2, y + 4);
      cx += colWidths[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);
    rows.forEach((row, ri) => {
      checkPage(6);
      cx = M;
      row.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, colWidths[i], 5.5, "FD"); }
        else { doc.rect(cx, y, colWidths[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
        doc.text(t, cx + 2, y + 3.8);
        cx += colWidths[i];
      });
      y += 5.5;
    });
    // Subtotal row
    checkPage(8);
    cx = M;
    const stCols = [colWidths.slice(0, -3).reduce((a, b) => a + b, 0), ...colWidths.slice(-3)];
    const stCells = [subtotal[0], subtotal[1], subtotal[2]];
    // First merged cell
    doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
    doc.rect(cx, y, stCols[0], 6, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
    doc.text("SUBTOTAL", cx + 2, y + 4);
    cx += stCols[0];
    stCells.forEach((t, i) => {
      doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
      doc.rect(cx, y, stCols[i + 1], 6, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 4);
      cx += stCols[i + 1];
    });
    y += 10;
  };

  // Labour table
  if (result.labourLines.length > 0) {
    const lCols = [42, 16, 16, 22, 28, 28, 28];
    const lHeaders = ["Grade", "No.", "Hrs", "Rate", "Base Cost", `Addition (${labourAddPct}%)`, "Total"];
    const lRows = result.labourLines.map(l => [l.label, String(l.operatives), String(l.hours), fmtGBP(l.rate), fmtGBP(l.base), fmtGBP(l.addition), fmtGBP(l.total)]);
    drawSectionTable("LABOUR", lHeaders, lCols, lRows, [fmtGBP(result.labourBase), fmtGBP(result.labourAddition), fmtGBP(result.labourTotal)]);
  }

  // Plant table
  if (result.plantLines.length > 0) {
    const pCols = [50, 22, 22, 22, 28, 18, 18];
    const pHeaders = ["Description", "Rate Type", "Rate", "Qty", "Base Cost", `Add (${plantAddPct}%)`, "Total"];
    const pRows = result.plantLines.map(p => [p.description, p.rateType === "week" ? "£/wk" : p.rateType === "day" ? "£/day" : "£/hr", fmtGBP(p.hireRate), String(p.qty), fmtGBP(p.base), fmtGBP(p.addition), fmtGBP(p.total)]);
    drawSectionTable("PLANT", pHeaders, pCols, pRows, [fmtGBP(result.plantBase), fmtGBP(result.plantAddition), fmtGBP(result.plantTotal)]);
  }

  // Materials table
  if (result.materialsLines.length > 0) {
    const mCols = [50, 20, 20, 26, 28, 18, 18];
    const mHeaders = ["Description", "Qty", "Unit", "Unit Cost", "Base Cost", `Add (${matAddPct}%)`, "Total"];
    const mRows = result.materialsLines.map(m => [m.description, String(m.qty), m.unit, fmtGBP(m.unitCost), fmtGBP(m.base), fmtGBP(m.addition), fmtGBP(m.total)]);
    drawSectionTable("MATERIALS", mHeaders, mCols, mRows, [fmtGBP(result.materialsBase), fmtGBP(result.materialsAddition), fmtGBP(result.materialsTotal)]);
  }

  // Grand total panel
  checkPage(20);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 20, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Grand Total Summary", M + 4, y + 2); y += 6;
  [
    ["Labour Total", fmtGBP(result.labourTotal)],
    ["Plant Total", fmtGBP(result.plantTotal)],
    ["Materials Total", fmtGBP(result.materialsTotal)],
    ["GRAND TOTAL", fmtGBP(result.grandTotal)],
  ].forEach(([label, value], i) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(i === 3 ? 27 : 55, i === 3 ? 87 : 65, i === 3 ? 69 : 81);
    doc.text(label + ":", M + 4, y);
    doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.4;
  });
  y += 6;

  // Measured comparison
  if (result.measuredComparison) {
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Measured Rate Comparison", M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Daywork cost: ${fmtGBP(result.grandTotal)}`, M + 2, y); y += 3.5;
    doc.text(`Measured cost: ${fmtGBP(result.measuredComparison.measuredCost)}`, M + 2, y); y += 3.5;
    const prem = result.measuredComparison.premium;
    doc.setFont("helvetica", "bold");
    doc.text(`${prem >= 0 ? "Premium" : "Saving"}: ${fmtGBP(Math.abs(prem))} (${Math.abs(result.measuredComparison.premiumPct)}%)`, M + 2, y);
    doc.setFont("helvetica", "normal"); y += 6;
  }

  // Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Notes", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(8);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });
  y += 4;

  // Sign-off
  checkPage(50); y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Authorised By (PM/Engineer)", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Daywork valuation per RICS Definition of Prime Cost of Daywork. Daywork must be authorised before execution. This is a valuation tool -- verify rates and additions against the contract.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`daywork-valuation-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function DayworkRateCalculatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);
  const [dwkRef, setDwkRef] = useState("");

  const [edition, setEdition] = useState<RICSEdition>("civil");
  const defaults = RICS_DEFAULTS[edition];
  const [labourAddPct, setLabourAddPct] = useState<number>(defaults.labourPct);
  const [plantAddPct, setPlantAddPct] = useState<number>(defaults.plantPct);
  const [matAddPct, setMatAddPct] = useState<number>(defaults.materialsPct);
  const [measuredCost, setMeasuredCost] = useState<string>("");

  const [labourLines, setLabourLines] = useState<LabourLine[]>([
    { id: nextLineId("l"), gradeId: "general", customLabel: "", numOperatives: 2, hours: 8, baseRate: 15.75 },
  ]);
  const [plantLines, setPlantLines] = useState<PlantLine[]>([]);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([]);

  // Sync edition defaults when edition changes
  const switchEdition = (ed: RICSEdition) => {
    setEdition(ed);
    const d = RICS_DEFAULTS[ed];
    setLabourAddPct(d.labourPct);
    setPlantAddPct(d.plantPct);
    setMatAddPct(d.materialsPct);
  };

  const result = useMemo(() =>
    calculateDaywork(labourLines, plantLines, materialLines, labourAddPct, plantAddPct, matAddPct, measuredCost ? parseFloat(measuredCost) : null),
    [labourLines, plantLines, materialLines, labourAddPct, plantAddPct, matAddPct, measuredCost]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, edition, labourAddPct, plantAddPct, matAddPct, result, dwkRef); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, edition, labourAddPct, plantAddPct, matAddPct, result, dwkRef]);

  const clearAll = useCallback(() => {
    switchEdition("civil");
    setLabourLines([{ id: nextLineId("l"), gradeId: "general", customLabel: "", numOperatives: 2, hours: 8, baseRate: 15.75 }]);
    setPlantLines([]); setMaterialLines([]);
    setMeasuredCost(""); setDwkRef("");
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const addLabour = () => setLabourLines([...labourLines, { id: nextLineId("l"), gradeId: "general", customLabel: "", numOperatives: 1, hours: 8, baseRate: 15.75 }]);
  const removeLabour = (id: string) => { if (labourLines.length > 1) setLabourLines(labourLines.filter(l => l.id !== id)); };
  const addPlant = () => setPlantLines([...plantLines, { id: nextLineId("p"), description: "", rateType: "day", hireRate: 0, quantity: 1 }]);
  const removePlant = (id: string) => setPlantLines(plantLines.filter(l => l.id !== id));
  const addMaterial = () => setMaterialLines([...materialLines, { id: nextLineId("m"), description: "", quantity: 1, unit: "nr", unitCost: 0 }]);
  const removeMaterial = (id: string) => setMaterialLines(materialLines.filter(l => l.id !== id));

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Grand Total", value: fmtGBP(result.grandTotal), sub: `Base + additions (${edition === "civil" ? "CE" : "Bldg"} ed.)`, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
          { label: "Labour", value: fmtGBP(result.labourTotal), sub: `${result.labourPct}% of total (${labourAddPct}% addition)`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Plant", value: fmtGBP(result.plantTotal), sub: `${result.plantPct}% of total (${plantAddPct}% addition)`, bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Materials", value: fmtGBP(result.materialsTotal), sub: `${result.materialsPct}% of total (${matAddPct}% addition)`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={result.grandTotal > 0}>
          <button onClick={handleExport} disabled={exporting || result.grandTotal === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Prepared By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* RICS Edition & Rates */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">RICS Edition & Percentage Additions</h3>
          <div className="flex rounded-md overflow-hidden border border-gray-200">
            {RICS_EDITIONS.map(e => (
              <button key={e.value} onClick={() => switchEdition(e.value)} className={`px-3 py-1 text-[10px] font-bold ${edition === e.value ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>{e.label}</button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400">{defaults.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Labour addition %</label>
            <input type="number" value={labourAddPct} onChange={e => setLabourAddPct(Math.max(0, parseFloat(e.target.value) || 0))} min={0} step={1}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Plant addition %</label>
            <input type="number" value={plantAddPct} onChange={e => setPlantAddPct(Math.max(0, parseFloat(e.target.value) || 0))} min={0} step={1}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Materials addition %</label>
            <input type="number" value={matAddPct} onChange={e => setMatAddPct(Math.max(0, parseFloat(e.target.value) || 0))} min={0} step={1}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">DWK Sheet Ref (optional)</label>
            <input type="text" value={dwkRef} onChange={e => setDwkRef(e.target.value)} placeholder="e.g. DWK-001"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      </div>

      {/* Labour Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Labour</h3>
          <div className="text-sm font-bold text-emerald-700">{fmtGBP(result.labourTotal)}</div>
        </div>
        <LabourSection lines={labourLines} onChange={setLabourLines} addLine={addLabour} removeLine={removeLabour} />
        <div className="flex justify-end gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span>Base: {fmtGBP(result.labourBase)}</span>
          <span>Addition ({labourAddPct}%): {fmtGBP(result.labourAddition)}</span>
          <span className="font-bold text-gray-700">Total: {fmtGBP(result.labourTotal)}</span>
        </div>
      </div>

      {/* Plant Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Plant</h3>
          <div className="text-sm font-bold text-orange-700">{fmtGBP(result.plantTotal)}</div>
        </div>
        {plantLines.length > 0 ? (
          <PlantSection lines={plantLines} onChange={setPlantLines} addLine={addPlant} removeLine={removePlant} />
        ) : (
          <button onClick={addPlant} className="text-xs font-medium text-ebrora hover:text-ebrora-dark">+ Add plant item</button>
        )}
        {plantLines.length > 0 && (
          <div className="flex justify-end gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
            <span>Base: {fmtGBP(result.plantBase)}</span>
            <span>Addition ({plantAddPct}%): {fmtGBP(result.plantAddition)}</span>
            <span className="font-bold text-gray-700">Total: {fmtGBP(result.plantTotal)}</span>
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Materials</h3>
          <div className="text-sm font-bold text-purple-700">{fmtGBP(result.materialsTotal)}</div>
        </div>
        {materialLines.length > 0 ? (
          <MaterialsSection lines={materialLines} onChange={setMaterialLines} addLine={addMaterial} removeLine={removeMaterial} />
        ) : (
          <button onClick={addMaterial} className="text-xs font-medium text-ebrora hover:text-ebrora-dark">+ Add materials item</button>
        )}
        {materialLines.length > 0 && (
          <div className="flex justify-end gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
            <span>Base: {fmtGBP(result.materialsBase)}</span>
            <span>Addition ({matAddPct}%): {fmtGBP(result.materialsAddition)}</span>
            <span className="font-bold text-gray-700">Total: {fmtGBP(result.materialsTotal)}</span>
          </div>
        )}
      </div>

      {/* Measured Rate Comparison (optional) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Measured Rate Comparison (optional)</h3>
        <p className="text-[11px] text-gray-400">Enter what this work would have cost at BoQ measured rates to see the daywork premium/saving.</p>
        <div className="w-48">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Measured cost (£)</label>
          <input type="number" value={measuredCost} onChange={e => setMeasuredCost(e.target.value)} min={0} step={1} placeholder="0.00"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
        </div>
        {result.measuredComparison && (
          <div className={`text-sm font-medium ${result.measuredComparison.premium >= 0 ? "text-red-700" : "text-emerald-700"}`}>
            {result.measuredComparison.premium >= 0
              ? `Daywork premium: ${fmtGBP(result.measuredComparison.premium)} (+${result.measuredComparison.premiumPct}% vs measured)`
              : `Daywork saving: ${fmtGBP(Math.abs(result.measuredComparison.premium))} (${result.measuredComparison.premiumPct}% vs measured)`}
          </div>
        )}
      </div>

      {/* Charts */}
      {result.grandTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Cost Breakdown</h3>
            <p className="text-[11px] text-gray-400">Stacked bar showing base cost (dark) and addition (light) for each section.</p>
            <CostBreakdownBar result={result} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Cost Proportion</h3>
            <p className="text-[11px] text-gray-400">Percentage split between labour, plant, and materials.</p>
            <div className="max-w-xs mx-auto"><CostPieChart result={result} /></div>
          </div>
        </div>
      )}

      {result.measuredComparison && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Daywork vs Measured Cost</h3>
          <p className="text-[11px] text-gray-400">Side-by-side comparison. {result.measuredComparison.premium >= 0 ? "Red = daywork is more expensive." : "Green = daywork is cheaper."}</p>
          <MeasuredComparisonBar result={result} />
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Notes</h3></div>
        <div className="px-4 py-3 space-y-2">
          {result.recommendations.map((rec, i) => <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span></div>)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Daywork valuation per RICS Definition of Prime Cost of Daywork ({edition === "civil" ? "Civil Engineering" : "Building"} Edition).
          Labour rates based on CIJC 2025/26 wage agreement (editable). Percentage additions cover employer&apos;s NI, CITB levy,
          holiday pay, pension, travel, supervision, overheads, and profit. This is a valuation tool - verify rates against the contract.
        </p>
      </div>
    </div>
  );
}
