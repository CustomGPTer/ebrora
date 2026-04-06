// src/components/concrete-volume-calculator/ConcreteVolumeClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { ConcreteRow, ShapeType } from "@/data/concrete-volume-calculator";
import {
  SHAPES, CONCRETE_MIXES, DEFAULT_WASTE_PERCENT, DEFAULT_TRUCK_CAPACITY,
  calculateShapeVolume, createEmptyRow, genId,
} from "@/data/concrete-volume-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function fmtNum(v: number, dp = 2): string {
  if (!Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── PDF Export (white-label — no Ebrora branding) ───────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; preparedBy: string; date: string },
  rows: ConcreteRow[],
  mix: string,
  wastePercent: number,
  truckCapacity: number,
  totals: { net: number; gross: number; trucks: number },
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 14; const CW = W - M * 2;
  let y = 0;

  // Header — plain dark bar, no Ebrora branding
  const docRef = `CVC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CONCRETE VOLUME CALCULATION", M, 11);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 11);
  doc.text(`Mix: ${mix} | Waste: ${wastePercent}% | Truck: ${truckCapacity} m³`, M, 18);
  y = 30;
  doc.setTextColor(0, 0, 0);

  // Site info panel
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 19, 1, 1, "FD");
  doc.setFontSize(8);
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
  y += 5;
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Prepared By:", header.preparedBy, M + CW / 2, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 9;

  function checkPage(n: number) { if (y + n > 280) { doc.addPage(); y = M; } }

  // Elements table — dark header + bordered cells
  const tblCols = [12, 38, 32, 40, 30, 30];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["#", "Element", "Shape", "Dimensions", "Net Vol (m3)", "Gross Vol (m3)"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, tblCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += tblCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  const activeRows = rows.filter(r => {
    const vol = r.overrideVolume ?? calculateShapeVolume(r.shape, r.values);
    return vol > 0;
  });

  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  activeRows.forEach((row, i) => {
    checkPage(6);
    const netVol = row.overrideVolume ?? calculateShapeVolume(row.shape, row.values);
    const grossVol = netVol * (1 + wastePercent / 100);
    const shapeDef = SHAPES.find(s => s.id === row.shape);
    const dims = shapeDef?.inputs.map(inp => `${row.values[inp.id] ?? "-"}${inp.unit}`).join(" x ") || "";
    const rowH = 5.5;
    cx = M;
    [String(i + 1), row.label || `Element ${i + 1}`, shapeDef?.label || "", dims, fmtNum(netVol, 3), fmtNum(grossVol, 3)].forEach((t, ci) => {
      doc.rect(cx, y, tblCols[ci], rowH, "D");
      doc.setFont("helvetica", ci <= 1 ? "bold" : "normal");
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(t, tblCols[ci] - 4);
      doc.text(lines, cx + 2, y + 3.5);
      cx += tblCols[ci];
    });
    y += rowH;
  });

  // Totals
  y += 2;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("TOTALS", M, y); y += 5;
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y, CW, 22, 1, 1, "FD");
  doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
  [
    [`Net Volume:`, `${fmtNum(totals.net, 3)} m3`],
    [`Gross Volume (inc. ${wastePercent}% waste):`, `${fmtNum(totals.gross, 3)} m3`],
    [`Truck Loads (${truckCapacity} m3 capacity):`, `${Math.ceil(totals.trucks)} loads`],
    [`Concrete Mix:`, mix],
  ].forEach(([l, v], i) => {
    doc.setFont("helvetica", "bold"); doc.text(l, M + 4, y + 5 + i * 4.5);
    doc.setFont("helvetica", "normal"); doc.text(v, M + 70, y + 5 + i * 4.5);
  });
  y += 27;

  // Sign-off
  checkPage(45); y += 6;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 8;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 8;
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  // Bordered sign-off table
  const soW2 = Math.min(CW / 2 - 2, 85); const soH2 = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW2, soH2, "FD"); doc.rect(M + soW2 + 4, y, soW2, soH2, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Approved By", M + soW2 + 7, y + 5.5);
  y += soH2;
  doc.setFont("helvetica", "normal");
  ["Name:", "Position:", "Signature:", "Date:"].forEach(label => {
    doc.rect(M, y, soW2, soH2, "D"); doc.rect(M + soW2 + 4, y, soW2, soH2, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW2 + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH2;
  });

  // Footer
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("This calculation is a planning estimate. Verify all volumes with site measurements before ordering. Waste factors are indicative.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 290);
  }

  doc.save(`concrete-volume-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function ConcreteVolumeClient() {
  const [rows, setRows] = useState<ConcreteRow[]>([createEmptyRow()]);
  const [mix, setMix] = useState("C25/30");
  const [wastePercent, setWastePercent] = useState(DEFAULT_WASTE_PERCENT);
  const [truckCapacity, setTruckCapacity] = useState(DEFAULT_TRUCK_CAPACITY);
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [company, setCompany] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const updateRow = useCallback((id: string, patch: Partial<ConcreteRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);
  const updateRowValue = useCallback((id: string, key: string, val: number | null) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, values: { ...r.values, [key]: val } } : r));
  }, []);
  const addRow = useCallback(() => setRows(prev => [...prev, createEmptyRow()]), []);
  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length <= 1 ? [createEmptyRow()] : prev.filter(r => r.id !== id));
  }, []);
  const clearAll = useCallback(() => {
    setRows([createEmptyRow()]); setMix("C25/30"); setWastePercent(DEFAULT_WASTE_PERCENT);
    setTruckCapacity(DEFAULT_TRUCK_CAPACITY); setSite(""); setManager(""); setPreparedBy(""); setAssessDate(todayISO());
  }, []);

  const totals = useMemo(() => {
    let net = 0;
    rows.forEach(r => { net += r.overrideVolume ?? calculateShapeVolume(r.shape, r.values); });
    const gross = net * (1 + wastePercent / 100);
    return { net, gross, trucks: truckCapacity > 0 ? gross / truckCapacity : 0 };
  }, [rows, wastePercent, truckCapacity]);

  const hasData = totals.net > 0;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, preparedBy, date: assessDate }, rows, mix, wastePercent, truckCapacity, totals); }
    finally { setExporting(false); }
  }, [site, manager, preparedBy, assessDate, rows, mix, wastePercent, truckCapacity, totals]);

  return (
    <div className="space-y-5">
      {/* Dashboard */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Net Volume", value: `${fmtNum(totals.net, 3)} m³`, sub: "Before waste", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
            { label: "Gross Volume", value: `${fmtNum(totals.gross, 3)} m³`, sub: `Inc. ${wastePercent}% waste`, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Truck Loads", value: `${Math.ceil(totals.trucks)}`, sub: `@ ${truckCapacity} m³ per load`, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
            { label: "Concrete Mix", value: mix, sub: CONCRETE_MIXES.find(m => m.designation === mix)?.description || "", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span></div>
              <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
        <button onClick={handleExport} disabled={!hasData || exporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label>
            <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label>
            <input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Name" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Concrete Mix</label>
            <select value={mix} onChange={e => setMix(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
              {CONCRETE_MIXES.map(m => <option key={m.designation} value={m.designation}>{m.designation} — {m.description}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Waste Factor (%)</label>
            <input type="number" step={0.5} min={0} max={30} value={wastePercent} onChange={e => setWastePercent(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Truck Capacity (m³)</label>
            <input type="number" step={0.5} min={1} max={12} value={truckCapacity} onChange={e => setTruckCapacity(parseFloat(e.target.value) || 6)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none tabular-nums" /></div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const shapeDef = SHAPES.find(s => s.id === row.shape)!;
          const netVol = row.overrideVolume ?? calculateShapeVolume(row.shape, row.values);
          const grossVol = netVol * (1 + wastePercent / 100);
          return (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-3 flex-1 flex-wrap items-end">
                  <div className="w-36">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Element Label</label>
                    <input type="text" value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })}
                      placeholder={`Element ${idx + 1}`}
                      className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                  </div>
                  <div className="w-48">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Shape</label>
                    <select value={row.shape} onChange={e => updateRow(row.id, { shape: e.target.value as ShapeType, values: {} })}
                      className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                      {SHAPES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeRow(row.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Shape inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {shapeDef.inputs.map(inp => (
                  <div key={inp.id}>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{inp.label} <span className="text-gray-400 normal-case">({inp.unit})</span></label>
                    <input type="number" step={inp.step} min={0}
                      value={row.values[inp.id] ?? ""}
                      placeholder={inp.placeholder}
                      onChange={e => updateRowValue(row.id, inp.id, e.target.value === "" ? null : parseFloat(e.target.value))}
                      className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
                  </div>
                ))}
                {/* Override volume */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Override Vol <span className="text-gray-400 normal-case">(m³)</span></label>
                  <input type="number" step={0.001} min={0}
                    value={row.overrideVolume ?? ""}
                    placeholder={netVol > 0 ? fmtNum(netVol, 3) : ""}
                    onChange={e => updateRow(row.id, { overrideVolume: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
                </div>
              </div>

              {/* Row output */}
              {netVol > 0 && (
                <div className="flex flex-wrap gap-4 bg-gray-50 rounded-lg p-2.5 text-xs">
                  <div><span className="text-gray-400">Net</span><div className="font-bold text-gray-800 tabular-nums">{fmtNum(netVol, 3)} m³</div></div>
                  <div><span className="text-gray-400">Gross</span><div className="font-bold text-gray-800 tabular-nums">{fmtNum(grossVol, 3)} m³</div></div>
                  <div><span className="text-gray-400">Trucks</span><div className="font-bold text-gray-800 tabular-nums">{fmtNum(grossVol / truckCapacity, 1)}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Row */}
      <button onClick={addRow}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add Element
      </button>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Volumes are geometric calculations. Verify with site measurements before ordering. Waste factor accounts for over-order, spillage, and formwork irregularities.
          Truck loads rounded up to nearest whole load. This is a PAID tool — PDFs are white-label (no Ebrora branding).
        </p>
      </div>
    </div>
  );
}
