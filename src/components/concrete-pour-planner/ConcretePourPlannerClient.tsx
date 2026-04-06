// src/components/concrete-pour-planner/ConcretePourPlannerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { PourInputs } from "@/data/concrete-pour-planner";
import { CONCRETE_MIXES, DEFAULT_INPUTS, calculatePour } from "@/data/concrete-pour-planner";

function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v === 0) return "—"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  inputs: PourInputs, result: ReturnType<typeof calculatePour>,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 14; const CW = W - M * 2; let y = 0;

  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("CONCRETE POUR PLAN", M, 11);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ready-Mix Logistics Planner — Generated ${new Date().toLocaleDateString("en-GB")}`, M, 18);
  y = 30; doc.setTextColor(0, 0, 0);

  doc.setFontSize(8);
  [["Site:", header.site], ["Site Manager:", header.manager], ["Prepared By:", header.preparedBy], ["Date:", header.date]].forEach(([l, v], i) => {
    const col = i % 2 === 0 ? M : M + CW / 2;
    if (i > 0 && i % 2 === 0) y += 5;
    doc.setFont("helvetica", "bold"); doc.text(l, col, y);
    doc.setFont("helvetica", "normal"); doc.text(v || "—", col + 25, y);
  });
  y += 10;

  // Pour summary
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Pour Summary", M, y); y += 5;
  doc.setFontSize(7.5);
  [
    ["Pour Volume:", `${inputs.pourVolume} m³`],
    ["Concrete Mix:", inputs.mixDesignation],
    ["Pump Rate:", `${inputs.pumpRate} m³/hr`],
    ["Truck Capacity:", `${inputs.truckCapacity} m³`],
    ["Round-Trip Time:", `${inputs.roundTripMinutes} min`],
    ["Start Time:", inputs.startTime],
    ["Trucks Required:", `${result.trucksRequired}`],
    ["Trucks On-Site (concurrent):", `${result.trucksOnSite}`],
    ["Pour Duration:", `${result.totalPourDuration} min (${fmtNum(result.totalPourDuration / 60)} hrs)`],
    ["Pour End Time:", result.pourEndTime],
  ].forEach(([l, v]) => {
    doc.setFont("helvetica", "bold"); doc.text(l, M, y);
    doc.setFont("helvetica", "normal"); doc.text(v, M + 55, y); y += 4.5;
  });
  y += 4;

  function checkPage(n: number) { if (y + n > 280) { doc.addPage(); y = M; } }

  // Truck schedule
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Truck Dispatch Schedule", M, y); y += 5;

  doc.setFillColor(245, 245, 245); doc.rect(M, y - 2, CW, 5, "F");
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  const cols = [0, 20, 50, 85, 115, 150];
  ["Truck #", "Arrival", "Depart", "Load (m³)", "Cumulative (m³)", "Status"].forEach((h, i) => doc.text(h, M + cols[i], y + 1));
  y += 5.5; doc.setFont("helvetica", "normal");

  result.schedule.forEach(t => {
    checkPage(5);
    doc.text(String(t.truckNumber), M + cols[0], y);
    doc.text(t.arrivalTime, M + cols[1], y);
    doc.text(t.departTime, M + cols[2], y);
    doc.text(fmtNum(t.loadM3, 1), M + cols[3], y);
    doc.text(fmtNum(t.cumulativeM3, 1), M + cols[4], y);
    const pct = (t.cumulativeM3 / (inputs.pourVolume || 1)) * 100;
    doc.text(`${fmtNum(pct, 0)}%`, M + cols[5], y);
    y += 4;
  });

  // Sign-off
  checkPage(45); y += 6; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 8;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 8;
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  ["Prepared By:", "Signature:", "Date:", "Site Manager:", "Signature:", "Date:"].forEach((lbl, i) => {
    if (i === 3) y += 4; doc.text(lbl, M, y); doc.setDrawColor(180, 180, 180); doc.line(M + 25, y, M + (lbl === "Date:" ? 65 : 95), y); y += 7;
  });

  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) { doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Ready-mix logistics plan. Confirm truck availability with batch plant. Adjust pump rate to site conditions.", M, 290);
    doc.text(`Page ${p} of ${pc}`, W - M - 20, 290); }
  doc.save(`concrete-pour-plan-${todayISO()}.pdf`);
}

export default function ConcretePourPlannerClient() {
  const [inputs, setInputs] = useState<PourInputs>({ ...DEFAULT_INPUTS });
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const update = useCallback((patch: Partial<PourInputs>) => { setInputs(prev => ({ ...prev, ...patch })); }, []);
  const result = useMemo(() => calculatePour(inputs), [inputs]);
  const hasData = result.trucksRequired > 0;

  const clearAll = useCallback(() => { setInputs({ ...DEFAULT_INPUTS }); setSite(""); setManager(""); setPreparedBy(""); }, []);
  const handleExport = useCallback(async () => { setExporting(true); try { await exportPDF({ site, manager, preparedBy, date: assessDate }, inputs, result); } finally { setExporting(false); } }, [site, manager, preparedBy, assessDate, inputs, result]);

  return (
    <div className="space-y-5">
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Trucks Required", value: `${result.trucksRequired}`, sub: `${result.trucksOnSite} on-site`, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
            { label: "Pour Duration", value: `${result.totalPourDuration} min`, sub: `${fmtNum(result.totalPourDuration / 60)} hrs`, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
            { label: "First Truck", value: result.firstTruckArrival, sub: "Arrival time", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Last Truck", value: result.lastTruckArrival, sub: "Arrival time", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
            { label: "Pour Complete", value: result.pourEndTime, sub: `${inputs.pourVolume} m³ placed`, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
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
        <button onClick={handleExport} disabled={!hasData || exporting} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}</button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{l:"Site Name",v:site,s:setSite},{l:"Site Manager",v:manager,s:setManager},{l:"Prepared By",v:preparedBy,s:setPreparedBy}].map(f=>(
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label><input type="text" value={f.v} onChange={e=>f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e=>setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Pour Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Pour Parameters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pour Volume (m³)</label>
            <input type="number" step={1} min={1} value={inputs.pourVolume ?? ""} placeholder="100"
              onChange={e => update({ pourVolume: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pump Rate (m³/hr)</label>
            <input type="number" step={1} min={1} value={inputs.pumpRate ?? ""} placeholder="30"
              onChange={e => update({ pumpRate: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Truck Capacity (m³)</label>
            <input type="number" step={0.5} min={1} max={12} value={inputs.truckCapacity}
              onChange={e => update({ truckCapacity: parseFloat(e.target.value) || 6 })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Round-Trip (min)</label>
            <input type="number" step={5} min={10} value={inputs.roundTripMinutes ?? ""} placeholder="45"
              onChange={e => update({ roundTripMinutes: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Plant to site and back</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
            <input type="time" value={inputs.startTime} onChange={e => update({ startTime: e.target.value })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Concrete Mix</label>
            <select value={inputs.mixDesignation} onChange={e => update({ mixDesignation: e.target.value })}
              className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
              {CONCRETE_MIXES.map(m => <option key={m.designation} value={m.designation}>{m.designation} — {m.description}</option>)}
            </select></div>
        </div>
      </div>

      {/* Truck Schedule */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Truck Dispatch Schedule</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{result.trucksRequired} loads, {result.trucksOnSite} trucks on-site concurrently to keep pump fed.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                {["Truck #", "Arrival", "Depart", "Load (m³)", "Cumulative (m³)", "Progress"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {result.schedule.map(t => {
                  const pct = (t.cumulativeM3 / (inputs.pourVolume || 1)) * 100;
                  return (
                    <tr key={t.truckNumber} className="hover:bg-blue-50/20">
                      <td className="px-4 py-2 text-center font-medium">{t.truckNumber}</td>
                      <td className="px-4 py-2 text-center tabular-nums font-medium text-emerald-700">{t.arrivalTime}</td>
                      <td className="px-4 py-2 text-center tabular-nums text-gray-500">{t.departTime}</td>
                      <td className="px-4 py-2 text-center tabular-nums">{fmtNum(t.loadM3, 1)}</td>
                      <td className="px-4 py-2 text-center tabular-nums font-medium">{fmtNum(t.cumulativeM3, 1)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-gray-500 w-10">{fmtNum(pct, 0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
        Ready-mix logistics plan. Confirm truck availability and plant capacity with your batch plant. Adjust pump rate to actual site conditions. Round-trip time includes loading at plant, travel to site, unloading, and return. White-label PDF.</p></div>
    </div>
  );
}
