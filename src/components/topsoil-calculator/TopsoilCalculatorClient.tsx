// src/components/topsoil-calculator/TopsoilCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  TOPSOIL_GRADES, DEPTH_GUIDANCE, DEFAULTS,
  calculateArea,
  type AreaEntry, type AreaResult, type TopsoilGrade,
} from "@/data/topsoil-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function genId() { return Math.random().toString(36).slice(2, 10); }
function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v <= 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function fmtCost(v: number): string { if (!Number.isFinite(v) || v <= 0) return "--"; return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function createArea(idx: number): AreaEntry {
  return { id: genId(), name: `Area ${idx + 1}`, areaSqM: null, depthMM: null };
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  grade: TopsoilGrade,
  results: AreaResult[],
  totals: { vol: number; volS: number; tonLow: number; tonMid: number; tonHigh: number },
  settings: { costPerTonne: number; wagonCapacity: number; bulkBagWeight: number; settlementPercent: number },
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `TOP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function newPage() {
    doc.addPage();
    doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("TOPSOIL CALCULATION (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.text("ebrora.com", W - M - 18, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Green header (FREE)
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("TOPSOIL VOLUME & TONNAGE CALCULATION", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | BS 3882:2015 / Defra CoP | ${new Date().toLocaleDateString("en-GB")}`, M, 15);
  doc.text("ebrora.com", W - M - 18, 15);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
  doc.setFontSize(8);
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 40);
  drawFld("Prepared By:", header.preparedBy, M + CW / 2, y, 40);
  y += 9;

  // Grade info banner
  doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69);
  doc.roundedRect(M, y, CW, 12, 1, 1, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
  doc.text(`Classification: ${grade.name} (${grade.standard})`, M + 4, y + 5);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(`Density: ${grade.densityLow}-${grade.densityHigh} t/m3 (mid ${grade.densityMid}) | Settlement: ${settings.settlementPercent}%`, M + 4, y + 10);
  y += 17;

  // Take-off table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Area Take-Off", M, y); y += 5;

  const tCols = [40, 22, 22, 26, 26, 25, 25];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Area", "m2", "Depth mm", "Vol m3", "Vol + Settle", "Tonnes (low)", "Tonnes (high)"].forEach((h, i) => {
    doc.setFillColor(27, 87, 69); doc.rect(cx, y, tCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += tCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const r of results) {
    checkPage(5.5); cx = M;
    [r.name, fmtNum(r.areaSqM, 0), `${r.depthMM}`, fmtNum(r.volumeM3, 2), fmtNum(r.volumeWithSettlement, 2), fmtNum(r.tonnageLow, 1), fmtNum(r.tonnageHigh, 1)].forEach((t, i) => {
      doc.rect(cx, y, tCols[i], 5.5, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.text(t, cx + 2, y + 3.5);
      cx += tCols[i];
    });
    y += 5.5;
  }
  // Totals row
  cx = M;
  ["TOTAL", "", "", fmtNum(totals.vol, 2), fmtNum(totals.volS, 2), fmtNum(totals.tonLow, 1), fmtNum(totals.tonHigh, 1)].forEach((t, i) => {
    doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200); doc.rect(cx, y, tCols[i], 6, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(t, cx + 2, y + 4); cx += tCols[i];
  });
  y += 12;

  // Order summary
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Order Summary", M, y); y += 5;

  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y, CW, 28, 1, 1, "FD");
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  const wagons = Math.ceil(totals.tonMid / settings.wagonCapacity);
  const bags = Math.ceil(totals.tonMid / settings.bulkBagWeight);
  const cost = totals.tonMid * settings.costPerTonne;

  doc.text(`Order quantity (mid-range): ${fmtNum(totals.tonMid, 1)} tonnes`, M + 4, y + 5);
  doc.text(`Wagon loads (${settings.wagonCapacity}t wagons): ${wagons} loads`, M + 4, y + 10);
  doc.text(`Bulk bags (${settings.bulkBagWeight}t bags): ${bags} bags`, M + 4, y + 15);
  doc.text(`Estimated cost @ ${fmtCost(settings.costPerTonne)}/tonne: ${fmtCost(cost)}`, M + 4, y + 20);
  doc.setFontSize(6); doc.setFont("helvetica", "italic");
  doc.text("Note: Costs are indicative. Obtain supplier quotations for actual pricing.", M + 4, y + 25);
  y += 34;

  // BS 3882 grade reference
  checkPage(35);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("BS 3882:2015 Topsoil Classification", M, y); y += 5;

  const gCols = [32, 35, 32, 87];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Grade", "Density (t/m3)", "pH Range", "Suitable For"].forEach((h, i) => {
    doc.setFillColor(27, 87, 69); doc.rect(cx, y, gCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += gCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const g of TOPSOIL_GRADES) {
    const suitLines = doc.splitTextToSize(g.suitableFor, gCols[3] - 4);
    const rowH = Math.max(5.5, suitLines.length * 2.5 + 2);
    checkPage(rowH);
    const isCurrent = g.id === grade.id;
    cx = M;
    [g.name, `${g.densityLow} - ${g.densityHigh}`, g.phRange].forEach((t, i) => {
      if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, gCols[i], rowH, "FD"); }
      else { doc.rect(cx, y, gCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", i === 0 || isCurrent ? "bold" : "normal");
      doc.text(t, cx + 2, y + 3.5);
      cx += gCols[i];
    });
    if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, gCols[3], rowH, "FD"); }
    else { doc.rect(cx, y, gCols[3], rowH, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    doc.text(suitLines, cx + 2, y + 3.5);
    y += rowH;
  }
  y += 6;

  // Sign-off
  checkPage(45);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;
  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7); doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | BS 3882:2015 | Defra Construction CoP for Sustainable Use of Soils | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`Topsoil-Calculation-${docRef}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function TopsoilCalculatorClient() {
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  const [gradeId, setGradeId] = useState("multipurpose");
  const [costPerTonne, setCostPerTonne] = useState<number>(DEFAULTS.costPerTonne);
  const [wagonCapacity, setWagonCapacity] = useState<number>(DEFAULTS.wagonCapacity);
  const [bulkBagWeight, setBulkBagWeight] = useState<number>(DEFAULTS.bulkBagWeight);
  const [settlementPercent, setSettlementPercent] = useState<number>(DEFAULTS.settlementPercent);

  const [areas, setAreas] = useState<AreaEntry[]>([createArea(0)]);

  const grade = TOPSOIL_GRADES.find(g => g.id === gradeId) || TOPSOIL_GRADES[0];

  const updateArea = useCallback((id: string, patch: Partial<AreaEntry>) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);
  const removeArea = useCallback((id: string) => {
    setAreas(prev => prev.length > 1 ? prev.filter(a => a.id !== id) : prev);
  }, []);
  const addArea = useCallback(() => {
    setAreas(prev => [...prev, createArea(prev.length)]);
  }, []);

  const { results, totals } = useMemo(() => {
    const density = { low: grade.densityLow, mid: grade.densityMid, high: grade.densityHigh };
    const res: AreaResult[] = [];
    for (const a of areas) {
      const r = calculateArea(a, density, settlementPercent);
      if (r) res.push(r);
    }
    const tot = {
      vol: res.reduce((s, r) => s + r.volumeM3, 0),
      volS: res.reduce((s, r) => s + r.volumeWithSettlement, 0),
      tonLow: res.reduce((s, r) => s + r.tonnageLow, 0),
      tonMid: res.reduce((s, r) => s + r.tonnageMid, 0),
      tonHigh: res.reduce((s, r) => s + r.tonnageHigh, 0),
    };
    return { results: res, totals: tot };
  }, [areas, grade, settlementPercent]);

  const hasData = results.length > 0;
  const wagons = hasData ? Math.ceil(totals.tonMid / wagonCapacity) : 0;
  const bags = hasData ? Math.ceil(totals.tonMid / bulkBagWeight) : 0;
  const cost = hasData ? totals.tonMid * costPerTonne : 0;

  const handleExport = useCallback(async () => {
    if (!hasData) return;
    setExporting(true);
    try {
      await exportPDF({ site, manager, preparedBy, date }, grade, results, totals, { costPerTonne, wagonCapacity, bulkBagWeight, settlementPercent });
    } finally { setExporting(false); }
  }, [hasData, site, manager, preparedBy, date, grade, results, totals, costPerTonne, wagonCapacity, bulkBagWeight, settlementPercent]);

  const clearAll = useCallback(() => {
    setSite(""); setManager(""); setPreparedBy(""); setDate(todayISO());
    setGradeId("multipurpose"); setCostPerTonne(DEFAULTS.costPerTonne);
    setWagonCapacity(DEFAULTS.wagonCapacity); setBulkBagWeight(DEFAULTS.bulkBagWeight);
    setSettlementPercent(DEFAULTS.settlementPercent); setAreas([createArea(0)]);
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border p-3.5 bg-emerald-50 border-emerald-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Volume (inc. settlement)</div>
          <div className="text-xl font-bold mt-1 text-emerald-800">{hasData ? `${fmtNum(totals.volS, 1)} m3` : "--"}</div>
          <div className="text-[10px] text-emerald-600">{hasData ? `${fmtNum(totals.vol, 1)} m3 before settlement` : ""}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-blue-50 border-blue-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Tonnage (mid)</div>
          <div className="text-xl font-bold mt-1 text-blue-800">{hasData ? `${fmtNum(totals.tonMid, 1)} t` : "--"}</div>
          <div className="text-[10px] text-blue-600">{hasData ? `${fmtNum(totals.tonLow, 1)} - ${fmtNum(totals.tonHigh, 1)} t range` : ""}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-amber-50 border-amber-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Delivery</div>
          <div className="text-xl font-bold mt-1 text-amber-800">{hasData ? `${wagons} wagons` : "--"}</div>
          <div className="text-[10px] text-amber-600">{hasData ? `or ${bags} bulk bags` : ""}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Est. Cost</div>
          <div className="text-xl font-bold mt-1 text-gray-800">{hasData ? fmtCost(cost) : "--"}</div>
          <div className="text-[10px] text-gray-400">@ {fmtCost(costPerTonne)}/tonne</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </div>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Site", value: site, set: setSite, type: "text" },
              { label: "Site Manager", value: manager, set: setManager, type: "text" },
              { label: "Prepared By", value: preparedBy, set: setPreparedBy, type: "text" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                <input type="text" value={f.value as string} onChange={e => (f.set as (v: string) => void)(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cost per Tonne (GBP)</label>
              <input type="number" step="1" min="1" value={costPerTonne} onChange={e => setCostPerTonne(Number(e.target.value) || DEFAULTS.costPerTonne)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Wagon Capacity (tonnes)</label>
              <input type="number" step="1" min="1" value={wagonCapacity} onChange={e => setWagonCapacity(Number(e.target.value) || DEFAULTS.wagonCapacity)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bulk Bag Weight (tonnes)</label>
              <input type="number" step="0.05" min="0.1" value={bulkBagWeight} onChange={e => setBulkBagWeight(Number(e.target.value) || DEFAULTS.bulkBagWeight)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Settlement Factor (%)</label>
              <input type="number" step="1" min="0" max="30" value={settlementPercent} onChange={e => setSettlementPercent(Number(e.target.value) || 0)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Grade selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Topsoil Classification (BS 3882:2015)</label>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOPSOIL_GRADES.map(g => (
            <button key={g.id} onClick={() => setGradeId(g.id)} className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${gradeId === g.id ? "bg-ebrora-light border-ebrora/30" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
              <div className="font-semibold text-sm text-gray-800">{gradeId === g.id ? "[X] " : "[ ] "}{g.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Density: {g.densityLow}-{g.densityHigh} t/m3 | {g.suitableFor.split(",")[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Area take-off */}
      <div className="space-y-3">
        {/* Desktop table */}
        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase w-48">Area Name</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase w-28">Area (m2)</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase w-28">Depth (mm)</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Volume (m3)</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Tonnage (mid)</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => {
                const r = results.find(res => res.id === area.id);
                return (
                  <tr key={area.id} className="border-b border-gray-100">
                    <td className="px-3 py-2"><input type="text" value={area.name} onChange={e => updateArea(area.id, { name: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></td>
                    <td className="px-3 py-2"><input type="number" step="0.1" min="0" value={area.areaSqM ?? ""} onChange={e => updateArea(area.id, { areaSqM: e.target.value ? Number(e.target.value) : null })} placeholder="0" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></td>
                    <td className="px-3 py-2"><input type="number" step="10" min="0" value={area.depthMM ?? ""} onChange={e => updateArea(area.id, { depthMM: e.target.value ? Number(e.target.value) : null })} placeholder="150" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-700">{r ? fmtNum(r.volumeWithSettlement, 2) : "--"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-700">{r ? fmtNum(r.tonnageMid, 1) : "--"}</td>
                    <td className="px-3 py-2">{areas.length > 1 && <button onClick={() => removeArea(area.id)} className="text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}</td>
                  </tr>
                );
              })}
              {hasData && (
                <tr className="bg-gray-50 font-bold">
                  <td className="px-3 py-2" colSpan={3}>GRAND TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmtNum(totals.volS, 2)} m3</td>
                  <td className="px-3 py-2 text-right">{fmtNum(totals.tonMid, 1)} t</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {areas.map(area => {
            const r = results.find(res => res.id === area.id);
            return (
              <div key={area.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <input type="text" value={area.name} onChange={e => updateArea(area.id, { name: e.target.value })} className="text-sm font-bold text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-ebrora outline-none" />
                  {areas.length > 1 && <button onClick={() => removeArea(area.id)} className="text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Area (m2)</label>
                    <input type="number" step="0.1" min="0" value={area.areaSqM ?? ""} onChange={e => updateArea(area.id, { areaSqM: e.target.value ? Number(e.target.value) : null })} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Depth (mm)</label>
                    <input type="number" step="10" min="0" value={area.depthMM ?? ""} onChange={e => updateArea(area.id, { depthMM: e.target.value ? Number(e.target.value) : null })} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                  </div>
                </div>
                {r && (
                  <div className="grid grid-cols-2 gap-2 text-center text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <div><div className="text-[10px] font-semibold text-gray-500 uppercase">Volume</div><div className="font-bold text-emerald-800">{fmtNum(r.volumeWithSettlement, 2)} m3</div></div>
                    <div><div className="text-[10px] font-semibold text-gray-500 uppercase">Tonnage</div><div className="font-bold text-emerald-800">{fmtNum(r.tonnageMid, 1)} t</div></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={addArea} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-ebrora/30 hover:text-ebrora transition-colors">
          + Add Another Area
        </button>
      </div>

      {/* Depth guidance */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Topsoil Depth Guidance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase">Application</th>
                <th className="text-right px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase">Depth (mm)</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {DEPTH_GUIDANCE.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 cursor-pointer hover:bg-ebrora-light/30" onClick={() => {
                  if (areas.length === 1 && !areas[0].depthMM) updateArea(areas[0].id, { depthMM: d.depthMM });
                }}>
                  <td className="px-2 py-1.5 font-medium text-gray-800">{d.application}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-ebrora">{d.depthMM}</td>
                  <td className="px-2 py-1.5 text-gray-500">{d.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-gray-400 mt-1">Click a row to apply depth to the first area.</div>
        </div>
      </div>

      {/* BS 3882 grade specs */}
      <details className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
        <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-gray-900 flex items-center gap-1.5 select-none">
          <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          BS 3882:2015 Classification
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {TOPSOIL_GRADES.map(g => (
            <div key={g.id} className={`rounded-lg border p-3 ${gradeId === g.id ? "bg-ebrora-light border-ebrora/30 ring-1 ring-ebrora/20" : "bg-gray-50 border-gray-200"}`}>
              <div className="font-bold text-sm text-gray-800">{g.name} <span className="text-[10px] font-normal text-gray-500">({g.standard})</span></div>
              <p className="text-xs text-gray-600 mt-1">{g.description}</p>
              <div className="text-[10px] text-gray-500 mt-1">Density: {g.densityLow}-{g.densityHigh} t/m3 | pH: {g.phRange} | Organic: {g.organicContent}</div>
              <div className="text-[10px] text-gray-500">Suitable for: {g.suitableFor}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Topsoil classification per BS 3882:2015 (Specification for topsoil). Soil handling per Defra Construction Code of Practice for the Sustainable Use of Soils on Construction Sites (2009). Densities are typical loose-tipped values and vary with moisture content, compaction, and organic matter.</p>
        <p>Settlement factor accounts for consolidation after placement. Actual settlement depends on placement method, moisture, and compaction. Costs are indicative - obtain supplier quotations. This tool provides volume and tonnage estimates. A soils specialist should verify grade suitability for the intended use.</p>
      </div>
    </div>
  );
}
