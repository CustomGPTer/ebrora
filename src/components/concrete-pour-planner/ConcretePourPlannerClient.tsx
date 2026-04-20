// src/components/concrete-pour-planner/ConcretePourPlannerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { PourInputs, PumpConfig } from "@/data/concrete-pour-planner";
import { CONCRETE_MIXES, DEFAULT_INPUTS, calculatePour, effectiveTaco } from "@/data/concrete-pour-planner";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v === 0) return "—"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// Wagon colour for schedule readability
const WAGON_COLOURS = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
];

async function exportPDF(
  header: { company: string; site: string; manager: string; preparedBy: string; date: string },
  inputs: PourInputs, result: ReturnType<typeof calculatePour>,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("l", "mm", "a4"); // landscape for wide schedule
  const W = 297; const M = 12; const CW = W - M * 2; let y = 0;

  const docRef = `CPP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("CONCRETE POUR PLAN — TRUCK DISPATCH SCHEDULE", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | Ready-Mix Logistics — ${new Date().toLocaleDateString("en-GB")}`, M, 17);
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

  // Summary
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Pour Summary", M, y); y += 5;
  doc.setFontSize(7.5);
  [
    ["Pour Volume:", `${inputs.pourVolume} m3`], ["Mix:", inputs.mixDesignation],
    ["Pumps:", result.pumpStats.map(p => `P${p.pumpNumber}: ${p.rate} m3/hr (${p.label})`).join(" | ")],
    ["Combined Pump Rate:", `${result.combinedPumpRate} m3/hr`],
    ["Truck Capacity:", `${inputs.truckCapacity} m3`],
    ["Fleet Size:", `${inputs.fleetSize} wagons`], ["Stagger:", `${inputs.staggerMinutes} min between first arrivals`],
    ["Round-Trip:", `${inputs.roundTripMinutes} min`], ["Workability Guideline:", `${result.effectiveTacoMinutes} min (base ${inputs.tacoMinutes}, ${inputs.ambientTemp === "below10" ? "<10C +30" : inputs.ambientTemp === "25to30" ? "25-30C -15" : inputs.ambientTemp === "above30" ? ">30C -30" : "10-25C"}${inputs.hasRetarder ? ", retarder +60" : ""})`],
    ["Start:", inputs.startTime], ["Total Loads:", `${result.totalLoads}`],
    ["Pour Duration:", `${result.totalPourDuration} min (${fmtNum(result.totalPourDuration / 60)} hrs)`],
    ["Pour Complete:", result.lastDischargeEnd],
    ["Peak Wagons On-Site:", `${result.peakWagonsOnSite}`],
    ["Exceeds Guideline:", result.tacoExceedances > 0 ? `!! ${result.tacoExceedances} load(s)` : "None"],
  ].forEach(([l, v]) => {
    doc.setFont("helvetica", "bold"); doc.text(l, M, y);
    doc.setFont("helvetica", "normal"); doc.text(v, M + 45, y); y += 4;
  });
  y += 4;

  function checkPage(n: number) {
    if (y + n > 200) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("CONCRETE POUR PLAN (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Schedule table — dark header + bordered cells
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Dispatch Schedule", M, y); y += 5;
  const dCols = [14, 18, 16, 16, 23, 23, 18, 23, 23, 23, 23, 23, 23];
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Load", "Wagon", "Trip", "Pump", "Arrival", "Discharge", "End", "Depart", "Load m3", "Cumul. m3", "Wait", "TACO", "Status"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, dCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += dCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  result.schedule.forEach((t, i) => {
    checkPage(4.5);
    const vals = [
      String(i + 1), `W${t.truckNumber}`, `T${t.tripNumber}`, `P${t.pumpNumber}`,
      t.arrivalTime, t.dischargeStart, t.dischargeEnd, t.departTime,
      fmtNum(t.loadM3, 1), fmtNum(t.cumulativeM3, 1),
      t.waitMinutes > 0 ? `${t.waitMinutes}m` : "-",
      `${t.tacoElapsedMin}m`,
      t.tacoStatus === "exceeds" ? "EXCEEDS" : t.tacoStatus === "caution" ? "CAUTION" : "OK",
    ];
    const rowH = 4.5; cx = M;
    vals.forEach((v, j) => {
      if (j === 12 && t.tacoStatus === "exceeds") {
        doc.setFillColor(254, 226, 226); doc.rect(cx, y, dCols[j], rowH, "FD");
        doc.setTextColor(220, 38, 38); doc.setFont("helvetica", "bold");
      } else if (j === 12 && t.tacoStatus === "caution") {
        doc.setFillColor(254, 243, 199); doc.rect(cx, y, dCols[j], rowH, "FD");
        doc.setTextColor(180, 83, 9); doc.setFont("helvetica", "bold");
      } else if (j === 12 && t.tacoOk) {
        doc.setFillColor(236, 253, 245); doc.rect(cx, y, dCols[j], rowH, "FD");
        doc.setTextColor(22, 163, 74); doc.setFont("helvetica", "bold");
      } else {
        doc.rect(cx, y, dCols[j], rowH, "D");
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
      }
      doc.text(v, cx + 2, y + 3); cx += dCols[j];
    });
    doc.setTextColor(0, 0, 0);
    y += rowH;
  });

  // Sign-off (bordered table)
  checkPage(45); y += 6; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW2 = Math.min(CW / 2 - 2, 120); const soH2 = 7;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW2, soH2, "FD"); doc.rect(M + soW2 + 4, y, soW2, soH2, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW2 + 7, y + 5);
  y += soH2;
  doc.setFont("helvetica", "normal");
  ["Name:", "Position:", "Signature:", "Date:"].forEach(label => {
    doc.rect(M, y, soW2, soH2, "D"); doc.rect(M + soW2 + 4, y, soW2, soH2, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW2 + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH2;
  });

  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) { doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Ready-mix logistics plan. Confirm wagon availability with batch plant. Workability guideline per BS 8500-2:2023 (prescriptive 2-hour limit removed; workability for full compaction is the governing criterion). Adjust for temperature and retarder.", M, 205);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 205); }
  doc.save(`concrete-pour-plan-${todayISO()}.pdf`);
}

export default function ConcretePourPlannerClient() {
  const [inputs, setInputs] = useState<PourInputs>({ ...DEFAULT_INPUTS });
  const [site, setSite] = useState(""); const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState(""); const [company, setCompany] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const update = useCallback((patch: Partial<PourInputs>) => { setInputs(prev => ({ ...prev, ...patch })); }, []);
  const result = useMemo(() => calculatePour(inputs), [inputs]);
  const hasData = result.totalLoads > 0;

  const clearAll = useCallback(() => { setInputs({ ...DEFAULT_INPUTS }); setSite(""); setManager(""); setPreparedBy(""); }, []);
  const handleExport = useCallback(async () => { setExporting(true); try { await exportPDF({ company, site, manager, preparedBy, date: assessDate }, inputs, result); } finally { setExporting(false); } }, [site, manager, preparedBy, assessDate, inputs, result]);

  return (
    <div className="space-y-5">
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Loads", value: `${result.totalLoads}`, sub: `${inputs.fleetSize} wagons × ${fmtNum((result.totalLoads / inputs.fleetSize), 1)} trips`, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
            { label: "Pour Duration", value: `${result.totalPourDuration} min`, sub: `${fmtNum(result.totalPourDuration / 60)} hrs`, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
            { label: "Peak On-Site", value: `${result.peakWagonsOnSite}`, sub: "Max wagons at once", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Pour Complete", value: result.lastDischargeEnd, sub: `Started ${result.firstTruckArrival}`, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
            { label: "Workability", value: result.tacoExceedances > 0 ? `${result.tacoExceedances} exceed` : result.tacoCautions > 0 ? `${result.tacoCautions} caution` : "All OK", sub: `${result.effectiveTacoMinutes} min guideline`, bg: result.tacoExceedances > 0 ? "bg-red-50" : result.tacoCautions > 0 ? "bg-amber-50" : "bg-green-50", border: result.tacoExceedances > 0 ? "border-red-200" : result.tacoCautions > 0 ? "border-amber-200" : "border-green-200", text: result.tacoExceedances > 0 ? "text-red-800" : result.tacoCautions > 0 ? "text-amber-800" : "text-green-800", dot: result.tacoExceedances > 0 ? "bg-red-500" : result.tacoCautions > 0 ? "bg-amber-500" : "bg-green-500" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span></div>
              <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Workability guideline warning */}
      {result.tacoExceedances > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-800">EXCEEDS WORKABILITY GUIDELINE — {result.tacoExceedances} load{result.tacoExceedances > 1 ? "s" : ""} exceed{result.tacoExceedances === 1 ? "s" : ""} the {result.effectiveTacoMinutes}-minute guideline</div>
            <div className="text-xs text-red-700 mt-1">
              Concrete in these wagons may not remain workable for full compaction by the time discharge starts.
              Consider adding more wagons, reducing round-trip time, or using a retarder admixture.
              BS 8500-2:2023 no longer prescribes a fixed time limit — workability for full compaction is the governing criterion.
            </div>
          </div>
        </div>
      )}
      {result.tacoCautions > 0 && result.tacoExceedances === 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-amber-600">!</span>
          <div>
            <div className="text-sm font-bold text-amber-800">APPROACHING GUIDELINE — {result.tacoCautions} load{result.tacoCautions > 1 ? "s are" : " is"} within 15 minutes of the {result.effectiveTacoMinutes}-minute workability guideline</div>
            <div className="text-xs text-amber-700 mt-1">
              These loads are close to the practical limit. Monitor slump on arrival and consider a slump test before discharge.
            </div>
          </div>
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

      {/* Pour Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Pour Parameters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pour Volume (m3)</label>
            <input type="number" step={1} min={1} value={inputs.pourVolume ?? ""} placeholder="100"
              onChange={e => update({ pourVolume: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Pumps</label>
            <div className="flex rounded-md overflow-hidden border border-gray-200">
              {([1, 2, 3] as const).map(n => (
                <button key={n} onClick={() => update({ pumpCount: n })}
                  className={`flex-1 px-3 py-2 text-xs font-bold ${inputs.pumpCount === n ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>{n}</button>
              ))}
            </div></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Truck Capacity (m3)</label>
            <input type="number" step={0.5} min={1} max={12} value={inputs.truckCapacity}
              onChange={e => update({ truckCapacity: parseFloat(e.target.value) || 6 })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Concrete Mix</label>
            <select value={inputs.mixDesignation} onChange={e => update({ mixDesignation: e.target.value })}
              className="w-full px-2.5 py-2 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg outline-none">
              {CONCRETE_MIXES.map(m => <option key={m.designation} value={m.designation}>{m.designation} — {m.description}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
            <input type="time" value={inputs.startTime} onChange={e => update({ startTime: e.target.value })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
        </div>

        <h3 className="text-sm font-bold text-gray-800 pt-2">Pump Rates</h3>
        <div className={`grid gap-3 ${inputs.pumpCount === 1 ? "grid-cols-1 sm:grid-cols-2" : inputs.pumpCount === 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"}`}>
          {Array.from({ length: inputs.pumpCount }).map((_, pi) => (
            <div key={pi} className="contents">
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">P{pi + 1} Rate (m3/hr)</label>
                <input type="number" step={1} min={1} value={inputs.pumps[pi].rate ?? ""} placeholder="30"
                  onChange={e => { const newPumps = [...inputs.pumps] as [PumpConfig, PumpConfig, PumpConfig]; newPumps[pi] = { ...newPumps[pi], rate: e.target.value === "" ? null : parseFloat(e.target.value) }; update({ pumps: newPumps }); }}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">P{pi + 1} Label</label>
                <input type="text" value={inputs.pumps[pi].label} placeholder={`Pump ${pi + 1}`}
                  onChange={e => { const newPumps = [...inputs.pumps] as [PumpConfig, PumpConfig, PumpConfig]; newPumps[pi] = { ...newPumps[pi], label: e.target.value }; update({ pumps: newPumps }); }}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold text-gray-800 pt-2">Fleet & Logistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Wagons</label>
            <input type="number" step={1} min={1} max={20} value={inputs.fleetSize}
              onChange={e => update({ fleetSize: parseInt(e.target.value) || 1 })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Total wagons in rotation</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Stagger (min)</label>
            <input type="number" step={5} min={0} max={60} value={inputs.staggerMinutes}
              onChange={e => update({ staggerMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Gap between first arrivals</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Round-Trip (min)</label>
            <input type="number" step={5} min={10} value={inputs.roundTripMinutes ?? ""} placeholder="45"
              onChange={e => update({ roundTripMinutes: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Site → plant → load → site</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Base Workability (min)</label>
            <input type="number" step={10} min={30} max={240} value={inputs.tacoMinutes}
              onChange={e => update({ tacoMinutes: parseInt(e.target.value) || 120 })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Rule of thumb: 120 min (BS 8500-2:2023 removed prescriptive limit)</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Discharge Time (min)</label>
            <input type="number" step={1} min={1} value={inputs.dischargeMinutes ?? ""} placeholder={inputs.pumps[0].rate ? fmtNum((inputs.truckCapacity / inputs.pumps[0].rate) * 60, 0) : "auto"}
              onChange={e => update({ dischargeMinutes: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
            <p className="text-[10px] text-gray-400 mt-0.5">Leave blank = auto from pump rate</p></div>
        </div>

        <h3 className="text-sm font-bold text-gray-800 pt-2">Workability Conditions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Ambient Temperature</label>
            <select value={inputs.ambientTemp} onChange={e => update({ ambientTemp: e.target.value as PourInputs["ambientTemp"] })}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
              <option value="below10">Below 10C (+30 min)</option>
              <option value="10to25">10 - 25C (baseline)</option>
              <option value="25to30">25 - 30C (-15 min)</option>
              <option value="above30">Above 30C (-30 min)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-0.5">Hot weather reduces working life</p></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Retarder Admixture</label>
            <div className="flex rounded-md overflow-hidden border border-gray-200 mt-0.5">
              <button onClick={() => update({ hasRetarder: false })}
                className={`flex-1 px-3 py-2 text-xs font-bold ${!inputs.hasRetarder ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>No Retarder</button>
              <button onClick={() => update({ hasRetarder: true })}
                className={`flex-1 px-3 py-2 text-xs font-bold ${inputs.hasRetarder ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>Retarder (+60 min)</button>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Extends working life of the mix</p></div>
          <div className="flex flex-col justify-end">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">Effective Guideline</div>
              <div className="text-lg font-bold text-gray-800">{effectiveTaco(inputs)} min</div>
              <div className="text-[10px] text-gray-400">Base {inputs.tacoMinutes}{inputs.ambientTemp !== "10to25" ? ` ${inputs.ambientTemp === "below10" ? "+30" : inputs.ambientTemp === "25to30" ? "-15" : "-30"}` : ""}{inputs.hasRetarder ? " +60 retarder" : ""}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Truck Schedule */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Truck Dispatch Schedule</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{result.totalLoads} loads across {inputs.fleetSize} wagons and {result.pumpCount} pump{result.pumpCount > 1 ? "s" : ""}. Peak {result.peakWagonsOnSite} on-site simultaneously. <span className="text-gray-500">“TACO” = Time As Charged Out (minutes from batching at the plant to start of discharge on site) — compared against the workability guideline.</span></p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                {["#", "Wagon", "Trip", "Pump", "Arrival", "Discharge", "End", "Depart", "Load", "Cumul.", "Wait", "TACO", "Progress"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500" title={h === "TACO" ? "Time As Charged Out — minutes since batching at the plant" : undefined}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {result.schedule.map((t, i) => {
                  const pct = (t.cumulativeM3 / (inputs.pourVolume || 1)) * 100;
                  const wc = WAGON_COLOURS[(t.truckNumber - 1) % WAGON_COLOURS.length];
                  const PUMP_COLOURS = ["text-blue-700 bg-blue-50 border-blue-200", "text-purple-700 bg-purple-50 border-purple-200", "text-cyan-700 bg-cyan-50 border-cyan-200"];
                  const pc2 = PUMP_COLOURS[(t.pumpNumber - 1) % PUMP_COLOURS.length];
                  return (
                    <tr key={i} className={`hover:bg-blue-50/20 ${t.tacoStatus === "exceeds" ? "bg-red-50/30" : t.tacoStatus === "caution" ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-1.5 text-center text-gray-500 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${wc.bg} ${wc.text} border ${wc.border}`}>W{t.truckNumber}</span>
                      </td>
                      <td className="px-3 py-1.5 text-center text-gray-500 tabular-nums">T{t.tripNumber}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${pc2}`}>P{t.pumpNumber}</span>
                      </td>
                      <td className="px-3 py-1.5 text-center tabular-nums font-medium">{t.arrivalTime}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums text-emerald-700 font-medium">{t.dischargeStart}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums text-gray-500">{t.dischargeEnd}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums text-gray-500">{t.departTime}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums">{fmtNum(t.loadM3, 1)}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums font-medium">{fmtNum(t.cumulativeM3, 1)}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums text-gray-400">{t.waitMinutes > 0 ? `${t.waitMinutes}m` : "—"}</td>
                      <td className={`px-3 py-1.5 text-center tabular-nums text-xs font-medium ${t.tacoStatus === "exceeds" ? "text-red-600" : t.tacoStatus === "caution" ? "text-amber-600" : "text-green-600"}`}>{t.tacoElapsedMin}m {t.tacoStatus === "exceeds" && "!!"}{t.tacoStatus === "caution" && "!"}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-gray-400 w-8">{fmtNum(pct, 0)}%</span>
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

      {/* Per-Pump Breakdown */}
      {hasData && result.pumpStats.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Per-Pump Breakdown</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Combined rate: {result.combinedPumpRate} m3/hr across {result.pumpCount} pumps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {result.pumpStats.map(p => (
              <div key={p.pumpNumber} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${p.pumpNumber === 1 ? "text-blue-700 bg-blue-50 border-blue-200" : p.pumpNumber === 2 ? "text-purple-700 bg-purple-50 border-purple-200" : "text-cyan-700 bg-cyan-50 border-cyan-200"}`}>P{p.pumpNumber}</span>
                  <span className="text-sm font-bold text-gray-800">{p.label}</span>
                </div>
                <div className="text-xs text-gray-500">{p.rate} m3/hr - {p.loads} loads - {fmtNum(p.totalM3, 1)} m3 - {p.busyMinutes} min busy</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-xl">
        Ready-mix logistics plan. Wagons cycle: arrive → discharge at pump → depart → round trip to plant → reload → return. Stagger controls the gap between first arrivals only — subsequent arrivals are determined by the cycling schedule. BS 8500-2:2023 removed the prescriptive 2-hour time limit — workability for full compaction is now the governing criterion. The 120-minute base guideline remains a practical rule of thumb, adjusted for temperature and retarder use. White-label PDF.</p></div>
    </div>
  );
}
