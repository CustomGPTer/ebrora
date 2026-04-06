// src/components/trench-backfill-calculator/TrenchBackfillClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { TrenchRow, TrenchZoneResult } from "@/data/trench-backfill-calculator";
import { BACKFILL_MATERIALS, createEmptyTrenchRow, calculateTrenchZones, DEFAULT_BEDDING_DEPTH_MM, DEFAULT_SIDEFILL_ABOVE_CROWN_MM } from "@/data/trench-backfill-calculator";

function fmtNum(v: number, dp = 2): string { if (!Number.isFinite(v) || v === 0) return "—"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  rows: TrenchRow[], results: TrenchZoneResult[], totals: TrenchZoneResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 14; const CW = W - M * 2; let y = 0;

  const docRef = `TBC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("TRENCH BACKFILL & PIPE BEDDING CALCULATION", M, 11);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | Per HAUC/SROH — ${new Date().toLocaleDateString("en-GB")}`, M, 18);
  y = 30; doc.setTextColor(0, 0, 0);

  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
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
  drawFld("Prepared By:", header.preparedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 9;

  function checkPage(n: number) { if (y + n > 280) { doc.addPage(); y = M; } }

  rows.forEach((row, idx) => {
    const res = results[idx];
    if (res.totalTrenchM3 === 0) return;
    checkPage(50);

    const bMat = BACKFILL_MATERIALS.find(m => m.id === row.beddingMaterialId);
    const sMat = BACKFILL_MATERIALS.find(m => m.id === row.sideFillMaterialId);
    const bfMat = BACKFILL_MATERIALS.find(m => m.id === row.backfillMaterialId);

    doc.setFillColor(240, 240, 240); doc.rect(M, y - 3, CW, 7, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${row.label || `Trench Run ${idx + 1}`}`, M + 3, y + 1);
    y += 8;

    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Trench: ${row.trenchLength}m × ${row.trenchWidth}m × ${row.trenchDepth}m | Pipe OD: ${row.pipeOD}mm | Reuse backfill: ${row.backfillReuse ? "Yes" : "No"}`, M, y);
    y += 5;

    // Zone table
    doc.setFillColor(248, 248, 248); doc.rect(M, y - 2, CW, 5, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    ["Zone", "Material", "Volume (m³)", "Tonnes"].forEach((h, i) => doc.text(h, M + [0, 35, 110, 145][i], y + 1));
    y += 5.5; doc.setFont("helvetica", "normal");

    [
      ["Bedding", bMat?.name || "—", res.beddingM3, res.beddingTonnes],
      ["Side Fill (haunch)", sMat?.name || "—", res.sideFillM3, res.sideFillTonnes],
      ["Backfill", bfMat?.name || "—", res.backfillM3, res.backfillTonnes],
    ].forEach(([zone, mat, vol, tonnes]) => {
      doc.text(zone as string, M, y);
      doc.text(mat as string, M + 35, y);
      doc.text(fmtNum(vol as number, 2), M + 110, y);
      doc.text(fmtNum(tonnes as number, 1), M + 145, y);
      y += 4;
    });

    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text(`Import: ${fmtNum(res.importTonnes, 1)} t | Export: ${fmtNum(res.exportTonnes, 1)} t`, M, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  // Totals
  checkPage(20); doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("COMBINED TOTALS", M, y); y += 5;
  doc.setFontSize(7.5);
  [
    ["Total bedding:", `${fmtNum(totals.beddingM3, 2)} m³ / ${fmtNum(totals.beddingTonnes, 1)} t`],
    ["Total side fill:", `${fmtNum(totals.sideFillM3, 2)} m³ / ${fmtNum(totals.sideFillTonnes, 1)} t`],
    ["Total backfill:", `${fmtNum(totals.backfillM3, 2)} m³ / ${fmtNum(totals.backfillTonnes, 1)} t`],
    ["Net import:", `${fmtNum(totals.importTonnes, 1)} t`],
    ["Net export:", `${fmtNum(totals.exportTonnes, 1)} t`],
  ].forEach(([l, v]) => { doc.setFont("helvetica", "bold"); doc.text(l, M, y); doc.setFont("helvetica", "normal"); doc.text(v, M + 35, y); y += 4.5; });

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
    doc.text("Zone depths per HAUC/SROH. Verify with project specification. Densities are typical UK values.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 290);
  }
  doc.save(`trench-backfill-${todayISO()}.pdf`);
}

export default function TrenchBackfillClient() {
  const [rows, setRows] = useState<TrenchRow[]>([createEmptyTrenchRow()]);
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const updateRow = useCallback((id: string, patch: Partial<TrenchRow>) => { setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); }, []);
  const addRow = useCallback(() => setRows(prev => [...prev, createEmptyTrenchRow()]), []);
  const removeRow = useCallback((id: string) => { setRows(prev => prev.length <= 1 ? [createEmptyTrenchRow()] : prev.filter(r => r.id !== id)); }, []);
  const clearAll = useCallback(() => { setRows([createEmptyTrenchRow()]); setSite(""); setManager(""); setPreparedBy(""); }, []);

  const results = useMemo(() => rows.map(calculateTrenchZones), [rows]);
  const totals = useMemo(() => results.reduce((a, r) => ({
    beddingM3: a.beddingM3 + r.beddingM3, sideFillM3: a.sideFillM3 + r.sideFillM3, backfillM3: a.backfillM3 + r.backfillM3,
    totalTrenchM3: a.totalTrenchM3 + r.totalTrenchM3, pipeVolumeM3: a.pipeVolumeM3 + r.pipeVolumeM3,
    beddingTonnes: a.beddingTonnes + r.beddingTonnes, sideFillTonnes: a.sideFillTonnes + r.sideFillTonnes, backfillTonnes: a.backfillTonnes + r.backfillTonnes,
    importTonnes: a.importTonnes + r.importTonnes, exportTonnes: a.exportTonnes + r.exportTonnes,
  }), { beddingM3: 0, sideFillM3: 0, backfillM3: 0, totalTrenchM3: 0, pipeVolumeM3: 0, beddingTonnes: 0, sideFillTonnes: 0, backfillTonnes: 0, importTonnes: 0, exportTonnes: 0 }), [results]);
  const hasData = totals.totalTrenchM3 > 0;

  const handleExport = useCallback(async () => { setExporting(true); try { await exportPDF({ site, manager, preparedBy, date: assessDate }, rows, results, totals); } finally { setExporting(false); } }, [site, manager, preparedBy, assessDate, rows, results, totals]);

  return (
    <div className="space-y-5">
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Bedding", value: `${fmtNum(totals.beddingTonnes, 1)} t`, sub: `${fmtNum(totals.beddingM3, 1)} m³`, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", dot: "bg-yellow-500" },
            { label: "Side Fill", value: `${fmtNum(totals.sideFillTonnes, 1)} t`, sub: `${fmtNum(totals.sideFillM3, 1)} m³`, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
            { label: "Backfill", value: `${fmtNum(totals.backfillTonnes, 1)} t`, sub: `${fmtNum(totals.backfillM3, 1)} m³`, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
            { label: "Net Import", value: `${fmtNum(totals.importTonnes, 1)} t`, sub: "Material to order", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Net Export", value: `${fmtNum(totals.exportTonnes, 1)} t`, sub: "Surplus for disposal", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500" },
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
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings</button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!hasData || exporting} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}</button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label><input type="text" value={site} onChange={e => setSite(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label><input type="text" value={manager} onChange={e => setManager(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label><input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Trench Rows */}
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const res = results[idx];
          return (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <input type="text" value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })}
                  placeholder={`Trench Run ${idx + 1}`} className="flex-1 max-w-xs px-2.5 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />
                <button onClick={() => removeRow(row.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Trench Length <span className="text-gray-400 normal-case">(m)</span></label>
                  <input type="number" step={0.1} min={0} value={row.trenchLength ?? ""} onChange={e => updateRow(row.id, { trenchLength: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Trench Width <span className="text-gray-400 normal-case">(m)</span></label>
                  <input type="number" step={0.05} min={0} value={row.trenchWidth ?? ""} onChange={e => updateRow(row.id, { trenchWidth: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Trench Depth <span className="text-gray-400 normal-case">(m)</span></label>
                  <input type="number" step={0.05} min={0} value={row.trenchDepth ?? ""} onChange={e => updateRow(row.id, { trenchDepth: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pipe OD <span className="text-gray-400 normal-case">(mm)</span></label>
                  <input type="number" step={1} min={0} value={row.pipeOD ?? ""} onChange={e => updateRow(row.id, { pipeOD: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
              </div>

              {/* Materials per zone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Bedding Material</label>
                  <select value={row.beddingMaterialId} onChange={e => updateRow(row.id, { beddingMaterialId: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    {BACKFILL_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.densityTPerM3} t/m³)</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Side Fill Material</label>
                  <select value={row.sideFillMaterialId} onChange={e => updateRow(row.id, { sideFillMaterialId: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    {BACKFILL_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.densityTPerM3} t/m³)</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Backfill Material</label>
                  <select value={row.backfillMaterialId} onChange={e => updateRow(row.id, { backfillMaterialId: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    {BACKFILL_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.densityTPerM3} t/m³)</option>)}</select></div>
              </div>

              {/* Overrides & reuse toggle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Bedding Depth (mm)</label>
                  <input type="number" step={10} value={row.overrideBeddingDepth ?? ""} placeholder={String(DEFAULT_BEDDING_DEPTH_MM)}
                    onChange={e => updateRow(row.id, { overrideBeddingDepth: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Side Fill Above Crown (mm)</label>
                  <input type="number" step={10} value={row.overrideSideFillHeight ?? ""} placeholder={String(DEFAULT_SIDEFILL_ABOVE_CROWN_MM)}
                    onChange={e => updateRow(row.id, { overrideSideFillHeight: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={row.backfillReuse} onChange={e => updateRow(row.id, { backfillReuse: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
                  <label className="text-sm text-gray-700">Re-use excavated for backfill</label>
                </div>
              </div>

              {/* Zone output */}
              {res.totalTrenchM3 > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {[
                      { label: "Bedding", vol: res.beddingM3, tonnes: res.beddingTonnes, colour: "text-yellow-700" },
                      { label: "Side Fill", vol: res.sideFillM3, tonnes: res.sideFillTonnes, colour: "text-orange-700" },
                      { label: "Backfill", vol: res.backfillM3, tonnes: res.backfillTonnes, colour: "text-amber-700" },
                    ].map(z => (
                      <div key={z.label}>
                        <span className={`font-semibold ${z.colour}`}>{z.label}</span>
                        <div className="tabular-nums">{fmtNum(z.vol, 2)} m³ / {fmtNum(z.tonnes, 1)} t</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 text-xs pt-1 border-t border-gray-200">
                    <div><span className="text-emerald-600 font-semibold">Import:</span> <span className="tabular-nums font-bold">{fmtNum(res.importTonnes, 1)} t</span></div>
                    <div><span className="text-red-600 font-semibold">Export:</span> <span className="tabular-nums font-bold">{fmtNum(res.exportTonnes, 1)} t</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Trench Run</button>

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
        Zone depths per HAUC/SROH specification. Bedding default: {DEFAULT_BEDDING_DEPTH_MM}mm below invert. Side fill default: {DEFAULT_SIDEFILL_ABOVE_CROWN_MM}mm above pipe crown. All dimensions and material densities overridable. White-label PDF.</p></div>
    </div>
  );
}
