// src/components/dust-silica-calculator/DustSilicaCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ACTIVITY_DATABASE,
  ACTIVITY_CATEGORIES,
  CONTROL_MEASURES,
  RPE_TYPES,
  WEL,
  SHIFT_HOURS,
  SILICA_RISK_LABELS,
  STATUS_COLOURS,
  calculate8hrTWA,
  applyControls,
  timeToReachWEL,
  recommendRPE,
  getExposureStatus,
  getOverallStatus,
  type DustActivity,
  type ExposureStatus,
  type ControlMeasure,
  type RPEType,
} from "@/data/dust-silica-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function genId() { return Math.random().toString(36).slice(2, 10); }
function fmtNum(v: number, dp = 2): string { if (!Number.isFinite(v) || v === 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }

// ─── Types ───────────────────────────────────────────────────
interface TaskEntry {
  id: string;
  mode: "manual" | "database";
  activityId: string | null;
  customName: string;
  durationMinutes: number | null;
  customRespirable: number | null;
  customRCS: number | null;
  customInhalable: number | null;
  controlIds: string[];
  notes: string;
}

function createTask(): TaskEntry {
  return { id: genId(), mode: "manual", activityId: null, customName: "", durationMinutes: null, customRespirable: null, customRCS: null, customInhalable: null, controlIds: [], notes: "" };
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  tasks: TaskEntry[],
  results: TaskResult[],
  rcsTWA: number, respirableTWA: number, inhalableTWA: number,
  overall: ExposureStatus,
  rpeRec: RPEType | null,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `DSE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("DUST / SILICA EXPOSURE ASSESSMENT (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("DUST / SILICA EXPOSURE ASSESSMENT", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | COSHH 2002 / EH40 / HSE INDG463 / HSG246 | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 19, 1, 1, "FD");
  doc.setFontSize(8);

  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  y += 9;

  // Overall status banner
  const statusColMap: Record<ExposureStatus, [number, number, number]> = {
    green: [34, 197, 94],
    amber: [245, 158, 11],
    red: [239, 68, 68],
  };
  const statusLabels: Record<ExposureStatus, string> = {
    green: "BELOW 50% WEL - LOW RISK",
    amber: "50-100% WEL - MEDIUM RISK - ACTION RECOMMENDED",
    red: "ABOVE WEL - HIGH RISK - IMMEDIATE ACTION REQUIRED",
  };
  const [sr, sg, sb] = statusColMap[overall];
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(M, y, CW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`OVERALL: ${statusLabels[overall]}`, M + 4, y + 5.5);
  doc.setTextColor(0, 0, 0); y += 13;

  // WEL summary box
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("8-Hour TWA Exposure Summary", M, y); y += 5;

  const welRows = [
    { label: "Respirable Crystalline Silica (RCS)", twa: rcsTWA, wel: WEL.rcs, unit: "mg/m3" },
    { label: "Respirable Dust", twa: respirableTWA, wel: WEL.respirable, unit: "mg/m3" },
    { label: "Inhalable Dust", twa: inhalableTWA, wel: WEL.inhalable, unit: "mg/m3" },
  ];

  const welCols = [70, 30, 30, 25, 31];
  doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Exposure Type", "8hr TWA", "WEL", "% of WEL", "Status"].forEach((h, i) => {
    doc.rect(cx, y, welCols[i], 6, "F"); doc.text(h, cx + 2, y + 4); cx += welCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const wr of welRows) {
    const pct = wr.wel > 0 ? (wr.twa / wr.wel) * 100 : 0;
    const st = getExposureStatus(wr.twa, wr.wel);
    const stLabel = st === "green" ? "OK" : st === "amber" ? "CAUTION" : "EXCEEDS WEL";
    const rowH = 5.5;
    checkPage(rowH);
    cx = M;
    doc.setFont("helvetica", "normal");
    [wr.label, `${fmtNum(wr.twa, 4)} ${wr.unit}`, `${wr.wel} ${wr.unit}`, `${fmtNum(pct, 1)}%`, stLabel].forEach((t, i) => {
      if (i === 4) {
        const [cr, cg, cb] = statusColMap[st];
        doc.setFillColor(cr, cg, cb); doc.rect(cx, y, welCols[i], rowH, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
        doc.text(t, cx + 2, y + 3.5);
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
      } else {
        doc.rect(cx, y, welCols[i], rowH, "D"); doc.text(t, cx + 2, y + 3.5);
      }
      cx += welCols[i];
    });
    y += rowH;
  }
  y += 6;

  // Task breakdown table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Task Exposure Breakdown", M, y); y += 5;

  const tCols = [50, 20, 25, 25, 25, 41];
  doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Activity", "Dur (min)", "RCS (mg/m3)", "Resp (mg/m3)", "Inhal (mg/m3)", "Controls Applied"].forEach((h, i) => {
    doc.rect(cx, y, tCols[i], 6, "F"); doc.text(h, cx + 2, y + 4); cx += tCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const r of results) {
    const ctrlNames = r.controlIds.map(cid => CONTROL_MEASURES.find(c => c.id === cid)?.name || cid).join(", ") || "None";
    const ctrlLines = doc.splitTextToSize(ctrlNames, tCols[5] - 4);
    const rowH = Math.max(5.5, ctrlLines.length * 2.8 + 2);
    checkPage(rowH);
    cx = M;
    [r.name, `${r.durationMinutes}`, fmtNum(r.controlledRCS, 4), fmtNum(r.controlledRespirable, 3), fmtNum(r.controlledInhalable, 2)].forEach((t, i) => {
      doc.rect(cx, y, tCols[i], rowH, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      const lines = doc.splitTextToSize(t, tCols[i] - 4);
      doc.text(lines, cx + 2, y + 3.5);
      cx += tCols[i];
    });
    doc.rect(cx, y, tCols[5], rowH, "D");
    doc.setFont("helvetica", "normal");
    doc.text(ctrlLines, cx + 2, y + 3.5);
    y += rowH;
  }
  y += 6;

  // RPE Recommendation
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("RPE Recommendation", M, y); y += 5;

  if (rpeRec) {
    doc.setFillColor(255, 245, 235); doc.setDrawColor(220, 180, 140);
    doc.roundedRect(M, y, CW, 14, 1, 1, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text(`Minimum RPE Required: ${rpeRec.name}`, M + 3, y + 5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Assigned Protection Factor (APF): ${rpeRec.apf} | Face-fit test: ${rpeRec.fitTestRequired ? "Required" : "Not required"} | Max use: ${rpeRec.maxUseHours}hrs`, M + 3, y + 10);
    y += 18;
  } else {
    doc.setFillColor(235, 250, 240); doc.setDrawColor(180, 220, 190);
    doc.roundedRect(M, y, CW, 10, 1, 1, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("No RPE required - exposure below WEL with current controls", M + 3, y + 6);
    y += 14;
  }

  // COSHH Hierarchy reminder
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("COSHH Hierarchy of Control (Applied)", M, y); y += 5;

  const hierarchyLabels = ["1. Elimination", "2. Substitution", "3. Engineering Controls", "4. Administrative Controls", "5. Personal Protective Equipment"];
  doc.setFontSize(6.5); doc.setDrawColor(200, 200, 200);
  for (let i = 0; i < hierarchyLabels.length; i++) {
    checkPage(5);
    const applied = results.some(r => r.controlIds.some(cid => {
      const ctrl = CONTROL_MEASURES.find(c => c.id === cid);
      return ctrl && ctrl.hierarchy === (i + 1);
    }));
    if (applied) { doc.setFillColor(235, 250, 240); doc.rect(M, y, CW, 4.5, "F"); }
    doc.setFont("helvetica", "bold");
    doc.text(applied ? "[X]" : "[ ]", M + 2, y + 3);
    doc.text(hierarchyLabels[i], M + 10, y + 3);
    doc.setFont("helvetica", "normal"); y += 5;
  }
  y += 5;

  // Sign-off section
  checkPage(45);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;

  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
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
    doc.text(`${docRef} | COSHH 2002 | EH40/2005 | HSE INDG463 / HSG246 | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`Dust-Silica-Assessment-${docRef}.pdf`);
}

// ─── Computed task result ────────────────────────────────────
interface TaskResult {
  id: string;
  name: string;
  durationMinutes: number;
  uncontrolledRCS: number;
  uncontrolledRespirable: number;
  uncontrolledInhalable: number;
  controlledRCS: number;
  controlledRespirable: number;
  controlledInhalable: number;
  controlIds: string[];
}

// ─── Activity Selector Component ─────────────────────────────
function ActivitySelector({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ACTIVITY_DATABASE.filter(a => {
      if (catFilter && a.category !== catFilter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    });
  }, [search, catFilter]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCatFilter("")} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${!catFilter ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>All</button>
        {ACTIVITY_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${catFilter === c.id ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>{c.label}</button>
        ))}
      </div>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..." className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">No activities found</div>
        ) : (
          filtered.map(a => {
            const risk = SILICA_RISK_LABELS[a.silicaRisk];
            return (
              <button key={a.id} onClick={() => onChange(a.id)} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-ebrora-light transition-colors ${value === a.id ? "bg-ebrora-light/60 font-medium" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{a.name}</span>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${risk.colour}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${risk.dotColour}`} />{risk.label}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">RCS: {a.uncontrolledRCS} mg/m3 | Resp: {a.uncontrolledRespirable} mg/m3 | Silica: {a.silicaContentPercent}%</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Control Measure Selector ────────────────────────────────
function ControlSelector({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const grouped = useMemo(() => {
    const groups: Record<number, ControlMeasure[]> = {};
    for (const c of CONTROL_MEASURES) {
      if (!groups[c.hierarchy]) groups[c.hierarchy] = [];
      groups[c.hierarchy].push(c);
    }
    return groups;
  }, []);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };

  const costLabel = (r: number) => r === 1 ? "Low" : r === 2 ? "Medium" : "High";
  const practLabel = (p: string) => p === "high" ? "Easy" : p === "medium" ? "Moderate" : "Difficult";

  return (
    <div className="space-y-3">
      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([h, ctrls]) => (
        <div key={h}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{ctrls[0].hierarchyLabel} (Level {h})</div>
          <div className="space-y-1">
            {ctrls.map(c => (
              <button key={c.id} onClick={() => toggle(c.id)} className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selected.includes(c.id) ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{selected.includes(c.id) ? "[X] " : "[ ] "}{c.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{Math.round((1 - c.reductionFactor) * 100)}% reduction</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Cost: {costLabel(c.costRating)} | Practicality: {practLabel(c.practicality)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function DustSilicaCalculatorClient() {
  const [showSettings, setShowSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Header / site info
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  // Tasks
  const [tasks, setTasks] = useState<TaskEntry[]>([createTask()]);

  const updateTask = useCallback((id: string, patch: Partial<TaskEntry>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.length > 1 ? prev.filter(t => t.id !== id) : prev);
  }, []);

  const addTask = useCallback(() => {
    setTasks(prev => [...prev, createTask()]);
  }, []);

  // ── Computed results ────────────────────────────────────────
  const { results, rcsTWA, respirableTWA, inhalableTWA, overall, rpeRec, totalMinutes } = useMemo(() => {
    const res: TaskResult[] = [];
    for (const t of tasks) {
      const dur = t.durationMinutes || 0;
      if (dur <= 0) continue;

      let unRCS = 0, unResp = 0, unInhal = 0, name = t.customName || "Unnamed task";

      if (t.mode === "database" && t.activityId) {
        const act = ACTIVITY_DATABASE.find(a => a.id === t.activityId);
        if (act) {
          unRCS = act.uncontrolledRCS;
          unResp = act.uncontrolledRespirable;
          unInhal = act.uncontrolledInhalable;
          name = act.name;
        }
      } else {
        unRCS = t.customRCS || 0;
        unResp = t.customRespirable || 0;
        unInhal = t.customInhalable || 0;
      }

      const ctrlRCS = applyControls(unRCS, t.controlIds);
      const ctrlResp = applyControls(unResp, t.controlIds);
      const ctrlInhal = applyControls(unInhal, t.controlIds);

      res.push({
        id: t.id, name, durationMinutes: dur,
        uncontrolledRCS: unRCS, uncontrolledRespirable: unResp, uncontrolledInhalable: unInhal,
        controlledRCS: ctrlRCS, controlledRespirable: ctrlResp, controlledInhalable: ctrlInhal,
        controlIds: t.controlIds,
      });
    }

    const rcs = calculate8hrTWA(res.map(r => ({ durationMinutes: r.durationMinutes, concentration: r.controlledRCS })));
    const resp = calculate8hrTWA(res.map(r => ({ durationMinutes: r.durationMinutes, concentration: r.controlledRespirable })));
    const inhal = calculate8hrTWA(res.map(r => ({ durationMinutes: r.durationMinutes, concentration: r.controlledInhalable })));
    const ov = getOverallStatus(rcs, resp, inhal);
    const rpe = recommendRPE(Math.max(...res.map(r => r.controlledRCS), 0), WEL.rcs);
    const totalMin = res.reduce((s, r) => s + r.durationMinutes, 0);

    return { results: res, rcsTWA: rcs, respirableTWA: resp, inhalableTWA: inhal, overall: ov, rpeRec: rpe, totalMinutes: totalMin };
  }, [tasks]);

  const hasData = results.length > 0;

  const handleExport = useCallback(async () => {
    if (!hasData) return;
    setExporting(true);
    try {
      await exportPDF({ company, site, manager, assessedBy, date }, tasks, results, rcsTWA, respirableTWA, inhalableTWA, overall, rpeRec);
    } finally { setExporting(false); }
  }, [hasData, company, site, manager, assessedBy, date, tasks, results, rcsTWA, respirableTWA, inhalableTWA, overall, rpeRec]);

  const clearAll = useCallback(() => {
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setDate(todayISO());
    setTasks([createTask()]);
  }, []);

  // ── Render ──────────────────────────────────────────────────
  const ovSt = STATUS_COLOURS[overall];
  const rcsStatus = getExposureStatus(rcsTWA, WEL.rcs);
  const respStatus = getExposureStatus(respirableTWA, WEL.respirable);
  const inhalStatus = getExposureStatus(inhalableTWA, WEL.inhalable);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3.5 ${ovSt.bg} ${ovSt.border}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${ovSt.text}`}>
            <span className={`w-2 h-2 rounded-full ${ovSt.dot}`} />Overall
          </div>
          <div className={`text-lg font-bold mt-1 ${ovSt.text}`}>{hasData ? ovSt.label : "--"}</div>
        </div>
        {[
          { label: "RCS 8hr TWA", value: fmtNum(rcsTWA, 4), unit: "mg/m3", wel: WEL.rcs, status: rcsStatus },
          { label: "Respirable TWA", value: fmtNum(respirableTWA, 3), unit: "mg/m3", wel: WEL.respirable, status: respStatus },
          { label: "Inhalable TWA", value: fmtNum(inhalableTWA, 2), unit: "mg/m3", wel: WEL.inhalable, status: inhalStatus },
        ].map((c, i) => {
          const st = STATUS_COLOURS[c.status];
          return (
            <div key={i} className={`rounded-xl border p-3.5 ${st.bg} ${st.border}`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${st.text}`}>
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />{c.label}
              </div>
              <div className={`text-lg font-bold mt-1 ${st.text}`}>{hasData ? c.value : "--"} <span className="text-xs font-normal">{c.unit}</span></div>
              <div className={`text-[10px] mt-0.5 ${st.text} opacity-70`}>WEL: {c.wel} {c.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <PaidDownloadButton hasData={hasData}>
            <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </PaidDownloadButton>
        </div>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Company", value: company, set: setCompany },
              { label: "Site", value: site, set: setSite },
              { label: "Site Manager", value: manager, set: setManager },
              { label: "Assessed By", value: assessedBy, set: setAssessedBy },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Task entries */}
      <div className="space-y-4">
        {tasks.map((task, idx) => {
          const activity = task.activityId ? ACTIVITY_DATABASE.find(a => a.id === task.activityId) : null;
          const result = results.find(r => r.id === task.id);

          return (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Task header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">TASK {idx + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateTask(task.id, { mode: "manual", activityId: null })} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${task.mode === "manual" ? "bg-ebrora text-white border-ebrora" : "bg-white text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>Manual Entry</button>
                    <button onClick={() => updateTask(task.id, { mode: "database" })} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${task.mode === "database" ? "bg-ebrora text-white border-ebrora" : "bg-white text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>From Database</button>
                  </div>
                </div>
                {tasks.length > 1 && (
                  <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {task.mode === "database" ? (
                  <>
                    <ActivitySelector value={task.activityId} onChange={id => updateTask(task.id, { activityId: id })} />
                    {activity && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                        <span className="font-semibold">{activity.name}:</span> {activity.notes}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Activity Name</label>
                      <input type="text" value={task.customName} onChange={e => updateTask(task.id, { customName: e.target.value })} placeholder="e.g. Concrete cutting with disc cutter" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">RCS (mg/m3)</label>
                      <input type="number" step="0.01" min="0" value={task.customRCS ?? ""} onChange={e => updateTask(task.id, { customRCS: e.target.value ? Number(e.target.value) : null })} placeholder="0.00" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Respirable (mg/m3)</label>
                      <input type="number" step="0.1" min="0" value={task.customRespirable ?? ""} onChange={e => updateTask(task.id, { customRespirable: e.target.value ? Number(e.target.value) : null })} placeholder="0.0" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Inhalable (mg/m3)</label>
                      <input type="number" step="0.1" min="0" value={task.customInhalable ?? ""} onChange={e => updateTask(task.id, { customInhalable: e.target.value ? Number(e.target.value) : null })} placeholder="0.0" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Exposure Duration (minutes)</label>
                    <input type="number" min="1" max="480" value={task.durationMinutes ?? ""} onChange={e => updateTask(task.id, { durationMinutes: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 60" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
                    <input type="text" value={task.notes} onChange={e => updateTask(task.id, { notes: e.target.value })} placeholder="Optional notes..." className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                  </div>
                </div>

                {/* Control measures */}
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 select-none">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Control Measures ({task.controlIds.length} applied)
                  </summary>
                  <div className="mt-2">
                    <ControlSelector selected={task.controlIds} onChange={ids => updateTask(task.id, { controlIds: ids })} />
                  </div>
                </details>

                {/* Task result summary */}
                {result && (
                  <div className={`rounded-lg border p-3 ${STATUS_COLOURS[getExposureStatus(result.controlledRCS, WEL.rcs)].bg} ${STATUS_COLOURS[getExposureStatus(result.controlledRCS, WEL.rcs)].border}`}>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Controlled RCS</div>
                        <div className="font-bold text-gray-800">{fmtNum(result.controlledRCS, 4)} mg/m3</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Controlled Resp.</div>
                        <div className="font-bold text-gray-800">{fmtNum(result.controlledRespirable, 3)} mg/m3</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Controlled Inhal.</div>
                        <div className="font-bold text-gray-800">{fmtNum(result.controlledInhalable, 2)} mg/m3</div>
                      </div>
                    </div>
                    {task.controlIds.length > 0 && (
                      <div className="text-[10px] text-gray-500 mt-2 text-center">
                        Reduction from uncontrolled: RCS {result.uncontrolledRCS > 0 ? Math.round((1 - result.controlledRCS / result.uncontrolledRCS) * 100) : 0}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add task button */}
        <button onClick={addTask} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-ebrora/30 hover:text-ebrora transition-colors">
          + Add Another Task
        </button>
      </div>

      {/* RPE Recommendation */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">RPE Recommendation</h3>
          {rpeRec ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <div className="font-bold text-amber-800">{rpeRec.name}</div>
              <div className="text-xs text-amber-700">
                APF: {rpeRec.apf} | Face-fit test: {rpeRec.fitTestRequired ? "Required" : "Not required"} | Max continuous use: {rpeRec.maxUseHours} hours
              </div>
              <div className="text-xs text-amber-600">{rpeRec.notes}</div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="font-bold text-green-800">No RPE required</div>
              <div className="text-xs text-green-600">Controlled exposure is below the workplace exposure limit. Continue to monitor.</div>
            </div>
          )}

          {/* All RPE types reference */}
          <details className="mt-3 group">
            <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 select-none">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              RPE Quick Reference
            </summary>
            <div className="mt-2 space-y-1">
              {RPE_TYPES.map(r => (
                <div key={r.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${rpeRec?.id === r.id ? "bg-amber-50 border border-amber-200 font-semibold" : "bg-gray-50"}`}>
                  <span>{r.name}</span>
                  <span className="text-gray-500">APF {r.apf}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Time to WEL reference */}
      {hasData && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Time to Reach WEL (at controlled concentration)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-500 uppercase">Activity</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">RCS Time</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Resp. Time</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Inhal. Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const tRCS = timeToReachWEL(r.controlledRCS, WEL.rcs);
                  const tResp = timeToReachWEL(r.controlledRespirable, WEL.respirable);
                  const tInhal = timeToReachWEL(r.controlledInhalable, WEL.inhalable);
                  const fmtTime = (m: number | null) => {
                    if (m === null || m <= 0) return "--";
                    if (m >= 480) return ">8 hrs";
                    const h = Math.floor(m / 60); const mins = Math.round(m % 60);
                    return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
                  };
                  return (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-800">{r.name}</td>
                      <td className={`py-2 text-right font-semibold ${tRCS !== null && tRCS < 480 ? "text-red-600" : "text-green-600"}`}>{fmtTime(tRCS)}</td>
                      <td className={`py-2 text-right font-semibold ${tResp !== null && tResp < 480 ? "text-red-600" : "text-green-600"}`}>{fmtTime(tResp)}</td>
                      <td className={`py-2 text-right font-semibold ${tInhal !== null && tInhal < 480 ? "text-red-600" : "text-green-600"}`}>{fmtTime(tInhal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Dust / Silica Exposure Calculator</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Add a task above with an exposure duration to calculate 8-hour TWA exposure against COSHH workplace exposure limits. Select from the database or enter measurements manually.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Calculations per Control of Substances Hazardous to Health Regulations 2002 (COSHH), EH40/2005 Workplace Exposure Limits (4th edition, as amended), HSE guidance INDG463 (Controlling construction dust), and HSG246 (Silica). RCS WEL: 0.1 mg/m3 (8-hr TWA). Inhalable dust WEL: 10 mg/m3. Respirable dust WEL: 4 mg/m3.</p>
        <p>This tool provides an estimate of dust and silica exposure based on published activity data and user inputs. It does not replace workplace air monitoring or a COSHH assessment conducted by a competent person. Actual exposure will vary with environmental conditions, duration, controls, and operator practice.</p>
      </div>
    </div>
  );
}
