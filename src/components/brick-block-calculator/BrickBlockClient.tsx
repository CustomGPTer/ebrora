// src/components/brick-block-calculator/BrickBlockClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { WallRow, WallResult } from "@/data/brick-block-calculator";
import { MASONRY_UNITS, MORTAR_TYPES, createEmptyWallRow, createOpening, calculateWall } from "@/data/brick-block-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v === 0) return "—"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

async function exportPDF(
  header: { company: string; site: string; manager: string; preparedBy: string; date: string },
  rows: WallRow[], results: WallResult[], totals: WallResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 14; const CW = W - M * 2; let y = 0;

  const docRef = `BBQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("BRICK & BLOCK QUANTITY CALCULATION", M, 11);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 11);
  y = 30; doc.setTextColor(0, 0, 0);

  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
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

  rows.forEach((row, idx) => {
    const res = results[idx];
    if (res.netArea === 0) return;
    checkPage(35);
    const unit = MASONRY_UNITS.find(u => u.id === row.unitId);
    const mortar = MORTAR_TYPES.find(m => m.id === row.mortarId);

    doc.setFillColor(240, 240, 240); doc.rect(M, y - 3, CW, 7, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${row.label || `Wall Section ${idx + 1}`}`, M + 3, y + 1);
    y += 8;

    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Unit: ${unit?.name || "—"} (${unit?.lengthMm}×${unit?.heightMm}×${unit?.widthMm}mm) | Mortar: ${mortar?.name || "—"} | Bond: Stretcher`, M, y);
    y += 4;
    doc.text(`Wall: ${row.wallLength}m × ${row.wallHeight}m = ${fmtNum(res.grossArea, 2)} m² gross | Openings: ${fmtNum(res.openingArea, 2)} m² | Net: ${fmtNum(res.netArea, 2)} m²`, M, y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`${unit?.category === "brick" ? "Bricks" : "Blocks"}: ${fmtNum(res.unitCount, 0)} | Mortar: ${fmtNum(res.mortarM3, 3)} m³ | Cement: ${res.cementBags} × 25kg bags | Sand: ${fmtNum(res.sandTonnes, 2)} t`, M, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  // Totals table
  checkPage(35);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("COMBINED TOTALS", M, y); y += 5;

  const totCols = [55, 55, 36, 20];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let tcx = M;
  ["Metric", "Value", "Material", "Quantity"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(tcx, y, totCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, tcx + 2, y + 4); tcx += totCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  const totRows = [
    ["Net wall area", `${fmtNum(totals.netArea, 2)} m2`, "Cement (25kg bags)", `${totals.cementBags}`],
    ["Total units", `${fmtNum(totals.unitCount, 0)}`, "Sand", `${fmtNum(totals.sandTonnes, 2)} t`],
    ["Total mortar", `${fmtNum(totals.mortarM3, 3)} m3`, "", ""],
  ];
  for (const tr of totRows) {
    tcx = M;
    tr.forEach((t, i) => {
      doc.rect(tcx, y, totCols[i], 5.5, "D");
      doc.setFont("helvetica", i === 0 || i === 2 ? "bold" : "normal");
      doc.setTextColor(0, 0, 0); doc.text(t, tcx + 2, y + 3.5);
      tcx += totCols[i];
    });
    y += 5.5;
  }
  y += 4;

  // Sign-off
  checkPage(45); y += 6; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 8;
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

  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) { doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Planning estimate. Single-skin stretcher bond. Verify quantities with drawings. Add 5-10% waste allowance when ordering.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 290); }
  doc.save(`brick-block-quantity-${todayISO()}.pdf`);
}

export default function BrickBlockClient() {
  const [rows, setRows] = useState<WallRow[]>([createEmptyWallRow()]);
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [company, setCompany] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const updateRow = useCallback((id: string, patch: Partial<WallRow>) => { setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); }, []);
  const addRow = useCallback(() => setRows(prev => [...prev, createEmptyWallRow()]), []);
  const removeRow = useCallback((id: string) => { setRows(prev => prev.length <= 1 ? [createEmptyWallRow()] : prev.filter(r => r.id !== id)); }, []);
  const addOpening = useCallback((rowId: string) => { setRows(prev => prev.map(r => r.id === rowId ? { ...r, openings: [...r.openings, createOpening()] } : r)); }, []);
  const updateOpening = useCallback((rowId: string, openingId: string, patch: Partial<{ label: string; width: number | null; height: number | null }>) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, openings: r.openings.map(o => o.id === openingId ? { ...o, ...patch } : o) } : r));
  }, []);
  const removeOpening = useCallback((rowId: string, openingId: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, openings: r.openings.filter(o => o.id !== openingId) } : r));
  }, []);
  const clearAll = useCallback(() => { setRows([createEmptyWallRow()]); setSite(""); setManager(""); setPreparedBy(""); }, []);

  const results = useMemo(() => rows.map(calculateWall), [rows]);
  const totals = useMemo(() => results.reduce((a, r) => ({
    grossArea: a.grossArea + r.grossArea, openingArea: a.openingArea + r.openingArea, netArea: a.netArea + r.netArea,
    unitCount: a.unitCount + r.unitCount, mortarM3: a.mortarM3 + r.mortarM3, cementBags: a.cementBags + r.cementBags, sandTonnes: a.sandTonnes + r.sandTonnes,
  }), { grossArea: 0, openingArea: 0, netArea: 0, unitCount: 0, mortarM3: 0, cementBags: 0, sandTonnes: 0 }), [results]);
  const hasData = totals.unitCount > 0;

  const handleExport = useCallback(async () => { setExporting(true); try { await exportPDF({ company, site, manager, preparedBy, date: assessDate }, rows, results, totals); } finally { setExporting(false); } }, [site, manager, preparedBy, assessDate, rows, results, totals]);

  return (
    <div className="space-y-5">
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Units", value: fmtNum(totals.unitCount, 0), sub: `${fmtNum(totals.netArea, 1)} m² net`, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
            { label: "Net Area", value: `${fmtNum(totals.netArea, 1)} m²`, sub: `${fmtNum(totals.openingArea, 1)} m² deducted`, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
            { label: "Mortar", value: `${fmtNum(totals.mortarM3, 3)} m³`, sub: "Total mortar volume", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" },
            { label: "Cement", value: `${totals.cementBags} bags`, sub: "25kg bags", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Sand", value: `${fmtNum(totals.sandTonnes, 2)} t`, sub: "Building sand", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", dot: "bg-yellow-500" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span></div>
              <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings</button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
        <button onClick={handleExport} disabled={!hasData || exporting} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}</button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{l:"Company",v:company,s:setCompany},{l:"Site Name",v:site,s:setSite},{l:"Site Manager",v:manager,s:setManager},{l:"Prepared By",v:preparedBy,s:setPreparedBy}].map(f=>(
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label><input type="text" value={f.v} onChange={e=>f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e=>setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Wall Rows */}
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const res = results[idx];
          const unit = MASONRY_UNITS.find(u => u.id === row.unitId);
          return (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <input type="text" value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} placeholder={`Wall Section ${idx + 1}`}
                  className="flex-1 max-w-xs px-2.5 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />
                <button onClick={() => removeRow(row.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Masonry Unit</label>
                  <select value={row.unitId} onChange={e => updateRow(row.id, { unitId: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    <optgroup label="Bricks">{MASONRY_UNITS.filter(u=>u.category==="brick").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</optgroup>
                    <optgroup label="Blocks">{MASONRY_UNITS.filter(u=>u.category==="block").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</optgroup>
                  </select></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Mortar Type</label>
                  <select value={row.mortarId} onChange={e => updateRow(row.id, { mortarId: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    {MORTAR_TYPES.map(m=><option key={m.id} value={m.id}>{m.name} — {m.description}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Wall Length (m)</label>
                  <input type="number" step={0.1} min={0} value={row.wallLength ?? ""} placeholder="0"
                    onChange={e => updateRow(row.id, { wallLength: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" /></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Wall Height (m)</label>
                  <input type="number" step={0.1} min={0} value={row.wallHeight ?? ""} placeholder="0"
                    onChange={e => updateRow(row.id, { wallHeight: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" /></div>
              </div>

              {/* Override */}
              <div className="max-w-xs">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Override Units/m²</label>
                <input type="number" step={1} value={row.overrideUnitsPerM2 ?? ""} placeholder={String(unit?.unitsPerM2 || "")}
                  onChange={e => updateRow(row.id, { overrideUnitsPerM2: e.target.value === "" ? null : parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" />
              </div>

              {/* Openings */}
              {row.openings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Opening Deductions</span>
                  {row.openings.map(o => (
                    <div key={o.id} className="flex items-end gap-2">
                      <input type="text" value={o.label} onChange={e => updateOpening(row.id, o.id, { label: e.target.value })} placeholder="Door/Window"
                        className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />
                      <div><label className="block text-[10px] text-gray-400 mb-0.5">W (m)</label>
                        <input type="number" step={0.05} value={o.width ?? ""} placeholder="0"
                          onChange={e => updateOpening(row.id, o.id, { width: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" /></div>
                      <div><label className="block text-[10px] text-gray-400 mb-0.5">H (m)</label>
                        <input type="number" step={0.05} value={o.height ?? ""} placeholder="0"
                          onChange={e => updateOpening(row.id, o.id, { height: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" /></div>
                      <span className="text-xs text-gray-400 tabular-nums pb-1.5">{(o.width && o.height) ? `${fmtNum(o.width * o.height, 2)} m²` : ""}</span>
                      <button onClick={() => removeOpening(row.id, o.id)} className="p-1 text-gray-300 hover:text-red-500 pb-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => addOpening(row.id)} className="text-xs text-ebrora hover:text-ebrora-dark font-medium transition-colors">+ Add Opening (door/window)</button>

              {/* Row output */}
              {res.unitCount > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div><span className="text-gray-400">Net Area</span><div className="font-bold tabular-nums">{fmtNum(res.netArea, 1)} m²</div></div>
                  <div><span className="text-gray-400">{unit?.category === "brick" ? "Bricks" : "Blocks"}</span><div className="font-bold tabular-nums">{fmtNum(res.unitCount, 0)}</div></div>
                  <div><span className="text-gray-400">Mortar</span><div className="font-medium tabular-nums">{fmtNum(res.mortarM3, 3)} m³</div></div>
                  <div><span className="text-gray-400">Cement</span><div className="font-medium tabular-nums">{res.cementBags} bags</div></div>
                  <div><span className="text-gray-400">Sand</span><div className="font-medium tabular-nums">{fmtNum(res.sandTonnes, 2)} t</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Wall Section</button>

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
        Single-skin stretcher bond. Add 5–10% waste when ordering. Mortar quantities include bed and perp joints with 10mm joint width. White-label PDF.</p></div>
    </div>
  );
}
