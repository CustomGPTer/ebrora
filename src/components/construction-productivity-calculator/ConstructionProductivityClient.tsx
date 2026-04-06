// src/components/construction-productivity-calculator/ConstructionProductivityClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { TaskConfig, TaskInputs, FactorOption } from "@/data/construction-productivity-calculator";
import { TASKS, REGION_OPTIONS, CONSTRAINT_OPTIONS, createDefaultInputs } from "@/data/construction-productivity-calculator";
import { calculateOutput, type CalcBreakdown } from "@/lib/construction-productivity-calculator/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function fmtNum(v: number, dp = 1): string {
  if (!Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { project: string; site: string; preparedBy: string; date: string },
  allInputs: Record<string, TaskInputs>,
  allResults: Record<string, CalcBreakdown>,
  allQuantities: Record<string, number>,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  let y = 0;

  // Header
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTION PRODUCTIVITY CALCULATOR", M, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Based on Spon's, CIRIA and UK industry norms — ebrora.com/tools/construction-productivity-calculator", M, 19);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, W - M - 40, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // Site info
  doc.setFontSize(8);
  const fields: [string, string][] = [
    ["Project:", header.project], ["Site:", header.site],
    ["Prepared By:", header.preparedBy], ["Date:", header.date],
  ];
  const halfW = CW / 2;
  fields.forEach(([lbl, val], i) => {
    const col = i % 2 === 0 ? M : M + halfW;
    if (i > 0 && i % 2 === 0) y += 5;
    doc.setFont("helvetica", "bold"); doc.text(lbl, col, y);
    doc.setFont("helvetica", "normal"); doc.text(val || "—", col + 25, y);
  });
  y += 10;

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("CONSTRUCTION PRODUCTIVITY CALCULATOR (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${header.project || header.site || ""}`, W - M - 40, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Active tasks
  const activeTasks = TASKS.filter(t => allResults[t.id] && allResults[t.id].dailyOutput > 0);

  // Combined summary
  if (activeTasks.length > 1) {
    checkPage(30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Combined Summary", M, y);
    y += 5;

    // Table header with borders
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(240, 240, 240);
    doc.rect(M, y - 2, CW, 5.5, "FD");
    doc.setFontSize(6.5);
    const sCols = [0, 55, 100, 140];
    const sWidths = [55, 45, 40, CW - 140];
    ["Task", "Daily Output", "Total Quantity", "Days to Complete"].forEach((h, i) => doc.text(h, M + sCols[i] + 2, y + 1.5));
    y += 5.5;
    doc.setFont("helvetica", "normal");

    activeTasks.forEach((task, ti) => {
      const result = allResults[task.id];
      const qty = allQuantities[task.id] || 0;
      const days = qty > 0 && result.dailyOutput > 0 ? qty / result.dailyOutput : 0;
      // Alternating row bg
      if (ti % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y - 2, CW, 5, "F"); }
      // Cell borders
      doc.setDrawColor(220, 220, 220);
      sWidths.forEach((w, i) => doc.rect(M + sCols[i], y - 2, w, 5, "D"));
      doc.text(task.name, M + sCols[0] + 2, y + 1);
      doc.text(`${fmtNum(result.dailyOutput)} ${task.unit}`, M + sCols[1] + 2, y + 1);
      doc.text(qty > 0 ? `${fmtNum(qty, 0)} ${task.unit.replace("/day", "").replace(" (bank)", "")}` : "—", M + sCols[2] + 2, y + 1);
      doc.text(days > 0 ? `${fmtNum(days)} days` : "—", M + sCols[3] + 2, y + 1);
      y += 5;
    });
    y += 6;
  }

  // Individual task breakdowns
  activeTasks.forEach(task => {
    checkPage(40);
    const result = allResults[task.id];
    const inputs = allInputs[task.id];
    const qty = allQuantities[task.id] || 0;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(232, 240, 236);
    doc.rect(M, y - 3, CW, 7, "F");
    doc.text(task.name, M + 3, y + 1);
    doc.setFont("helvetica", "normal");
    doc.text(`Output: ${fmtNum(result.dailyOutput)} ${task.unit}`, M + CW - 60, y + 1);
    y += 8;

    // Inputs
    doc.setFontSize(6.5);
    doc.text(`Shift: ${inputs.shiftHours}h | Skilled: ${inputs.skilledOps} | General: ${inputs.generalOps} | Region: ${inputs.region} | Constraints: ${inputs.constraints}`, M, y);
    y += 4;

    // Calculation chain
    doc.setFont("helvetica", "bold");
    doc.text("Calculation Chain:", M, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");

    const chain = [
      { label: `Base Rate (${task.baseRateUnit})`, value: result.baseRate },
      ...(task.gangBased ? [{ label: `× ${task.gangLabel || "gangs"}`, value: result.gangCount }] : [{ label: "× Crew", value: result.crewFactor }]),
      { label: "× Hours scaling", value: result.hoursScaling },
      { label: "× Efficiency", value: result.efficiencyFactor },
      { label: "× Safety", value: result.safetyFactor },
      { label: "× Region", value: result.regionFactor },
      { label: "× Constraints", value: result.constraintsFactor },
      { label: "× Skill mix", value: result.skillFactor },
      ...result.taskFactors.map(tf => ({ label: `× ${tf.label}`, value: tf.value })),
    ];

    chain.forEach(c => {
      doc.text(`  ${c.label}: ${fmtNum(c.value, 3)}`, M + 2, y);
      y += 3;
    });

    doc.setFont("helvetica", "bold");
    doc.text(`  = ${fmtNum(result.dailyOutput)} ${task.unit}`, M + 2, y);
    y += 4;

    if (qty > 0) {
      const days = result.dailyOutput > 0 ? qty / result.dailyOutput : 0;
      doc.text(`  Total quantity: ${fmtNum(qty, 0)} → ${fmtNum(days)} working days`, M + 2, y);
      y += 4;
    }
    // Section separator between tasks
    y += 2;
    doc.setDrawColor(220, 220, 220);
    doc.line(M, y, W - M, y);
    y += 4;
  });

  // Sign-off (bordered table)
  checkPage(45);
  doc.setDrawColor(27, 87, 69);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y);
  y += 6;
  const soW = CW / 2 - 2; const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Approved By", M + soW + 7, y + 5.5);
  y += soH;
  doc.setFont("helvetica", "normal");
  ["Name:", "Position:", "Signature:", "Date:"].forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5);
    doc.setTextColor(130, 130, 130);
    doc.text("Productivity rates are planning estimates based on Spon's, CIRIA and UK industry norms. Actual outputs vary with conditions. All rates are overridable.", M, 290);
    doc.text(`ebrora.com — Page ${p} of ${pageCount}`, W - M - 30, 290);
  }

  doc.save(`construction-productivity-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function ConstructionProductivityClient() {
  const [activeTab, setActiveTab] = useState(TASKS[0].id);
  const [allInputs, setAllInputs] = useState<Record<string, TaskInputs>>(() => {
    const map: Record<string, TaskInputs> = {};
    TASKS.forEach(t => { map[t.id] = createDefaultInputs(t); });
    return map;
  });
  const [allQuantities, setAllQuantities] = useState<Record<string, number>>({});
  const [project, setProject] = useState("");
  const [site, setSite] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const activeTask = TASKS.find(t => t.id === activeTab)!;
  const inputs = allInputs[activeTab];

  // Calculate all results
  const allResults = useMemo(() => {
    const map: Record<string, CalcBreakdown> = {};
    TASKS.forEach(t => { map[t.id] = calculateOutput(t, allInputs[t.id]); });
    return map;
  }, [allInputs]);

  const result = allResults[activeTab];
  const hasData = Object.values(allResults).some(r => r.dailyOutput > 0);
  const qty = allQuantities[activeTab] || 0;
  const daysToComplete = qty > 0 && result.dailyOutput > 0 ? qty / result.dailyOutput : 0;

  // Update input
  const updateInput = useCallback((field: string, value: string | number) => {
    setAllInputs(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value },
    }));
  }, [activeTab]);

  const clearAll = useCallback(() => {
    const map: Record<string, TaskInputs> = {};
    TASKS.forEach(t => { map[t.id] = createDefaultInputs(t); });
    setAllInputs(map);
    setAllQuantities({});
    setProject(""); setSite(""); setPreparedBy(""); setAssessDate(todayISO());
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ project, site, preparedBy, date: assessDate }, allInputs, allResults, allQuantities); }
    finally { setExporting(false); }
  }, [project, site, preparedBy, assessDate, allInputs, allResults, allQuantities]);

  return (
    <div className="space-y-5">
      {/* ── Output Summary Card ────────────────────────── */}
      {result.dailyOutput > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Daily Output", value: fmtNum(result.dailyOutput), sub: activeTask.unit, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
            { label: "Base Rate", value: fmtNum(result.baseRate), sub: activeTask.baseRateUnit, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
            { label: "Crew", value: `${inputs.skilledOps}S + ${inputs.generalOps}G`, sub: `Skill factor: ${fmtNum(result.skillFactor, 2)}`, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" },
            { label: "Days to Complete", value: daysToComplete > 0 ? fmtNum(daysToComplete) : "—", sub: qty > 0 ? `${fmtNum(qty, 0)} total` : "Enter quantity below", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span>
              </div>
              <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!hasData || exporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Project</label>
            <input type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="Project name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label>
            <input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Task Tabs ──────────────────────────────────── */}
      {/* Desktop: scrollable tab strip */}
      <div className="hidden lg:flex gap-1 overflow-x-auto pb-1">
        {TASKS.map(task => {
          const r = allResults[task.id];
          const isActive = task.id === activeTab;
          return (
            <button key={task.id} onClick={() => setActiveTab(task.id)}
              className={`shrink-0 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                isActive
                  ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              <span className="mr-1">{task.icon}</span>
              {task.name}
              {r.dailyOutput > 0 && (
                <span className="ml-1.5 text-[10px] text-gray-400">{fmtNum(r.dailyOutput, 0)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: dropdown selector */}
      <div className="lg:hidden">
        <select value={activeTab} onChange={e => setActiveTab(e.target.value)}
          className="w-full px-3 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
          {TASKS.map(task => {
            const r = allResults[task.id];
            return (
              <option key={task.id} value={task.id}>
                {task.icon} {task.name}{r.dailyOutput > 0 ? ` — ${fmtNum(r.dailyOutput, 0)} ${task.unit}` : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* ── Active Task Inputs ─────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">{activeTask.icon} {activeTask.name}</h3>

        {/* Common inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Shift Hours</label>
            <input type="number" min={7} max={14} step={0.5} value={inputs.shiftHours}
              onChange={e => updateInput("shiftHours", parseFloat(e.target.value) || 8)}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Skilled Ops</label>
            <input type="number" min={0} max={50} step={1} value={inputs.skilledOps}
              onChange={e => updateInput("skilledOps", parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">General Ops</label>
            <input type="number" min={0} max={50} step={1} value={inputs.generalOps}
              onChange={e => updateInput("generalOps", parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Region</label>
            <select value={inputs.region as string} onChange={e => updateInput("region", e.target.value)}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none">
              {REGION_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Constraints</label>
            <select value={inputs.constraints as string} onChange={e => updateInput("constraints", e.target.value)}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none">
              {CONSTRAINT_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Task-specific inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeTask.fields.map(field => (
            <div key={field.id}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {field.label}
                {field.unit && <span className="ml-1 text-gray-400 normal-case">({field.unit})</span>}
              </label>
              {field.type === "select" ? (
                <select value={inputs[field.id] as string}
                  onChange={e => updateInput(field.id, e.target.value)}
                  className={`w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors ${
                    inputs[field.id] ? "border-ebrora/30 bg-ebrora-light/40" : "border-gray-200 bg-blue-50/40"
                  }`}>
                  {field.options!.map(o => <option key={o.label} value={o.label}>{o.label} ({o.value}×)</option>)}
                </select>
              ) : (
                <input type="number" min={field.min} max={field.max} step={field.step}
                  value={inputs[field.id] as number || ""}
                  placeholder={field.placeholder}
                  onChange={e => updateInput(field.id, e.target.value === "" ? 0 : parseFloat(e.target.value))}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
              )}
              {field.helpText && <p className="text-[10px] text-gray-400 mt-0.5">{field.helpText}</p>}
            </div>
          ))}
        </div>

        {/* Total quantity for days-to-complete */}
        <div className="pt-3 border-t border-gray-100">
          <div className="max-w-xs">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total Quantity Needed
              <span className="ml-1 text-gray-400 normal-case">({activeTask.unit.replace("/day", "").replace(" (bank)", "")})</span>
            </label>
            <input type="number" min={0} step={1}
              value={allQuantities[activeTab] || ""}
              placeholder="Enter total quantity for days-to-complete"
              onChange={e => setAllQuantities(prev => ({ ...prev, [activeTab]: parseFloat(e.target.value) || 0 }))}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
          </div>
          {daysToComplete > 0 && (
            <p className="text-sm font-medium text-ebrora-dark mt-2">
              ≈ {fmtNum(daysToComplete)} working days to complete {fmtNum(qty, 0)} {activeTask.unit.replace("/day", "").replace(" (bank)", "")}
            </p>
          )}
        </div>
      </div>

      {/* ── Calculation Chain ──────────────────────────── */}
      {result.dailyOutput > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Full Calculation Breakdown</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">All factors shown. Override any value in Advanced Settings.</p>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {[
              { label: `Base Rate (${activeTask.baseRateUnit})`, value: result.baseRate },
              ...(activeTask.gangBased ? [{ label: `× ${activeTask.gangLabel || "gangs"}`, value: result.gangCount }] : [{ label: "× Crew (total persons)", value: result.crewFactor }]),
              { label: "× Hours scaling", value: result.hoursScaling },
              { label: "× Efficiency factor", value: result.efficiencyFactor },
              { label: "× Safety compliance", value: result.safetyFactor },
              { label: "× Region adjustment", value: result.regionFactor },
              { label: "× Site constraints", value: result.constraintsFactor },
              { label: "× Skill mix factor", value: result.skillFactor },
              ...result.taskFactors.map(tf => ({ label: `× ${tf.label}`, value: tf.value })),
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="tabular-nums font-medium text-gray-800">{fmtNum(item.value, 3)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 mt-2">
              <span className="font-bold text-ebrora-dark">= Calculated Daily Output</span>
              <span className="tabular-nums font-bold text-ebrora-dark text-lg">{fmtNum(result.dailyOutput)} {activeTask.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Base rates derived from Spon&apos;s Civil Engineering and Highway Works Price Book, CIRIA guidance, and UK industry norms.
          All rates are planning estimates — actual outputs vary with site conditions, logistics, and workforce capability.
          Treat as &quot;production potential&quot;, not guaranteed output. All factors overridable.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools →
        </a>
      </div>
    </div>
  );
}
