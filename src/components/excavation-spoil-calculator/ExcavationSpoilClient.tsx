// src/components/excavation-spoil-calculator/ExcavationSpoilClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { ExcavationRow } from "@/data/excavation-spoil-calculator";
import { SOIL_TYPES, DEFAULT_WAGON_TONNES, createEmptyRow, calculateExcavation } from "@/data/excavation-spoil-calculator";

function fmtNum(v: number, dp = 2): string {
  if (!Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

async function exportPDF(
  header: { company: string; site: string; manager: string; preparedBy: string; date: string },
  rows: ExcavationRow[], wagonTonnes: number, totals: { bankM3: number; bulkedM3: number; tonnes: number; wagonLoads: number },
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("l", "mm", "a4");
  const W = 297; const M = 12; const CW = W - M * 2; let y = 0;

  const docRef = `EXC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("EXCAVATION & SPOIL CALCULATION", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")} | Wagon: ${wagonTonnes}t`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

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

  doc.setFillColor(245, 245, 245); doc.rect(M, y - 2, CW, 5, "F");
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  const cols = [0, 8, 55, 80, 105, 130, 160, 195, 225, 255];
  ["#", "Area/Element", "L (m)", "W (m)", "D (m)", "Soil Type", "Bank m³", "Bulked m³", "Tonnes", "Wagons"].forEach((h, i) => doc.text(h, M + cols[i], y + 1));
  y += 5.5; doc.setFont("helvetica", "normal");

  rows.forEach((row, i) => {
    const res = calculateExcavation(row, wagonTonnes);
    if (res.bankM3 === 0) return;
    if (y > 195) { doc.addPage(); y = M; }
    const soil = SOIL_TYPES.find(s => s.id === row.soilTypeId);
    doc.text(String(i + 1), M + cols[0], y);
    doc.text(row.label || `Area ${i + 1}`, M + cols[1], y);
    doc.text(fmtNum(row.length ?? 0, 1), M + cols[2], y);
    doc.text(fmtNum(row.width ?? 0, 1), M + cols[3], y);
    doc.text(fmtNum(row.depth ?? 0, 1), M + cols[4], y);
    doc.text(soil?.name || "—", M + cols[5], y);
    doc.text(fmtNum(res.bankM3, 1), M + cols[6], y);
    doc.text(fmtNum(res.bulkedM3, 1), M + cols[7], y);
    doc.text(fmtNum(res.tonnes, 1), M + cols[8], y);
    doc.text(fmtNum(res.wagonLoads, 1), M + cols[9], y);
    y += 4.5;
  });

  y += 2; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text("TOTALS", M, y);
  doc.text(fmtNum(totals.bankM3, 1), M + cols[6], y);
  doc.text(fmtNum(totals.bulkedM3, 1), M + cols[7], y);
  doc.text(fmtNum(totals.tonnes, 1), M + cols[8], y);
  doc.text(`${Math.ceil(totals.wagonLoads)}`, M + cols[9], y);

  // Sign-off
  y += 12; if (y > 180) { doc.addPage(); y = M; }
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  doc.setFont("helvetica", "normal");
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
    doc.text("Planning estimate. Verify with site investigations. Bulking factors and densities are typical UK values.", M, 205);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 205);
  }
  doc.save(`excavation-spoil-${todayISO()}.pdf`);
}

export default function ExcavationSpoilClient() {
  const [rows, setRows] = useState<ExcavationRow[]>([createEmptyRow()]);
  const [wagonTonnes, setWagonTonnes] = useState(DEFAULT_WAGON_TONNES);
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [company, setCompany] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const updateRow = useCallback((id: string, patch: Partial<ExcavationRow>) => { setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); }, []);
  const addRow = useCallback(() => setRows(prev => [...prev, createEmptyRow()]), []);
  const removeRow = useCallback((id: string) => { setRows(prev => prev.length <= 1 ? [createEmptyRow()] : prev.filter(r => r.id !== id)); }, []);
  const clearAll = useCallback(() => { setRows([createEmptyRow()]); setSite(""); setManager(""); setPreparedBy(""); }, []);

  const results = useMemo(() => rows.map(r => calculateExcavation(r, wagonTonnes)), [rows, wagonTonnes]);
  const totals = useMemo(() => results.reduce((a, r) => ({ bankM3: a.bankM3 + r.bankM3, bulkedM3: a.bulkedM3 + r.bulkedM3, tonnes: a.tonnes + r.tonnes, wagonLoads: a.wagonLoads + r.wagonLoads }), { bankM3: 0, bulkedM3: 0, tonnes: 0, wagonLoads: 0 }), [results]);
  const hasData = totals.bankM3 > 0;

  const handleExport = useCallback(async () => { setExporting(true); try { await exportPDF({ company, site, manager, preparedBy, date: assessDate }, rows, wagonTonnes, totals); } finally { setExporting(false); } }, [site, manager, preparedBy, assessDate, rows, wagonTonnes, totals]);

  return (
    <div className="space-y-5">
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Bank Volume", value: `${fmtNum(totals.bankM3, 1)} m³`, sub: "In-situ (undisturbed)", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
            { label: "Bulked Volume", value: `${fmtNum(totals.bulkedM3, 1)} m³`, sub: "After excavation", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
            { label: "Weight", value: `${fmtNum(totals.tonnes, 1)} t`, sub: "For disposal / transport", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
            { label: "Wagon Loads", value: `${Math.ceil(totals.wagonLoads)}`, sub: `@ ${wagonTonnes}t per load`, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
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
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label><input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label><input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label><input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Name" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Wagon (t)</label><input type="number" step={1} min={1} max={40} value={wagonTonnes} onChange={e => setWagonTonnes(parseFloat(e.target.value) || 20)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none tabular-nums" /></div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block border border-gray-200 rounded-xl overflow-visible">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200">
            {["Label", "Length (m)", "Width (m)", "Depth (m)", "Soil Type", "Density (t/m³)", "Bulking", "Bank m³", "Bulked m³", "Tonnes", "Wagons", ""].map(h => (
              <th key={h} className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => {
              const soil = SOIL_TYPES.find(s => s.id === row.soilTypeId);
              const res = results[idx];
              return (
                <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-2 py-1.5 w-36"><input type="text" value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} placeholder={`Area ${idx + 1}`} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" /></td>
                  {(["length", "width", "depth"] as const).map(f => (
                    <td key={f} className="px-2 py-1.5 w-20"><input type="number" step={0.1} min={0} value={row[f] ?? ""} placeholder="0"
                      onChange={e => updateRow(row.id, { [f]: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      className="w-full px-1 py-1.5 text-sm text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" /></td>
                  ))}
                  <td className="px-2 py-1.5 w-36"><select value={row.soilTypeId} onChange={e => updateRow(row.id, { soilTypeId: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
                    {SOIL_TYPES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.bulkingFactor}×)</option>)}
                  </select></td>
                  <td className="px-2 py-1.5 w-20"><input type="number" step={0.01} value={row.overrideDensity ?? ""} placeholder={String(soil?.densityTPerM3 || "")}
                    onChange={e => updateRow(row.id, { overrideDensity: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-1 py-1.5 text-xs text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" /></td>
                  <td className="px-2 py-1.5 w-16"><input type="number" step={0.01} value={row.overrideBulking ?? ""} placeholder={String(soil?.bulkingFactor || "")}
                    onChange={e => updateRow(row.id, { overrideBulking: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-1 py-1.5 text-xs text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" /></td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-medium">{fmtNum(res.bankM3, 1)}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(res.bulkedM3, 1)}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-medium">{fmtNum(res.tonnes, 1)}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(res.wagonLoads, 1)}</td>
                  <td className="px-1 py-1.5"><button onClick={() => removeRow(row.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, idx) => {
          const res = results[idx];
          return (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between gap-2"><input type="text" value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} placeholder={`Area ${idx + 1}`} className="flex-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />
                <button onClick={() => removeRow(row.id)} className="p-1 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
              <div className="grid grid-cols-4 gap-2">
                {[{l:"L (m)",f:"length" as const},{l:"W (m)",f:"width" as const},{l:"D (m)",f:"depth" as const}].map(({l,f})=>(
                  <div key={f}><label className="block text-[10px] text-gray-400 mb-0.5">{l}</label><input type="number" step={0.1} value={row[f] ?? ""} placeholder="0" onChange={e => updateRow(row.id, { [f]: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" /></div>
                ))}
                <div><label className="block text-[10px] text-gray-400 mb-0.5">Soil</label><select value={row.soilTypeId} onChange={e => updateRow(row.id, { soilTypeId: e.target.value })} className="w-full px-1.5 py-1.5 text-xs border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">{SOIL_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              {res.bankM3 > 0 && (
                <div className="grid grid-cols-4 gap-x-3 bg-gray-50 rounded-lg p-2.5 text-xs">
                  <div><span className="text-gray-400">Bank m³</span><div className="font-bold tabular-nums">{fmtNum(res.bankM3, 1)}</div></div>
                  <div><span className="text-gray-400">Bulked m³</span><div className="font-medium tabular-nums">{fmtNum(res.bulkedM3, 1)}</div></div>
                  <div><span className="text-gray-400">Tonnes</span><div className="font-bold tabular-nums">{fmtNum(res.tonnes, 1)}</div></div>
                  <div><span className="text-gray-400">Wagons</span><div className="font-medium tabular-nums">{fmtNum(res.wagonLoads, 1)}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Excavation Area</button>

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
        Bulking factors and densities are typical UK values. Confirm with site investigation data. Bank volume = in-situ undisturbed ground. Bulked volume = after excavation (for transport). White-label PDF — no Ebrora branding.</p></div>
    </div>
  );
}
