// src/components/noise-exposure-calculator/NoiseExposureCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ACTIVITY_DATABASE,
  ACTIVITY_CATEGORIES,
  HPE_TYPES,
  STATUS_COLOURS,
  LOWER_EAV, UPPER_EAV, ELV,
  SHIFT_HOURS,
  calculateLEPd,
  applyHPEAttenuation,
  getNoiseStatus,
  recommendHPE,
  maxExposureMinutes,
  type NoiseActivity,
  type NoiseStatus,
  type HPEType,
} from "@/data/noise-exposure-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function genId() { return Math.random().toString(36).slice(2, 10); }
function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v === 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function fmtTime(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "--";
  if (mins >= SHIFT_HOURS * 60) return ">8 hrs";
  const h = Math.floor(mins / 60); const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Types ───────────────────────────────────────────────────
interface TaskEntry {
  id: string;
  mode: "manual" | "database";
  activityId: string | null;
  customName: string;
  customLevel: number | null;
  customPeak: number | null;
  durationMinutes: number | null;
  notes: string;
}

function createTask(): TaskEntry {
  return { id: genId(), mode: "manual", activityId: null, customName: "", customLevel: null, customPeak: null, durationMinutes: null, notes: "" };
}

interface TaskResult {
  id: string;
  name: string;
  levelDBA: number;
  peakDBC: number | null;
  durationMinutes: number;
  partialLEPd: number;
  maxMinsUpperEAV: number;
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  results: TaskResult[],
  lepd: number,
  protectedLEPd: number | null,
  overall: NoiseStatus,
  hpeChoice: HPEType | null,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `NEX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("NOISE EXPOSURE ASSESSMENT (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("NOISE EXPOSURE ASSESSMENT - LEP,d", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | Noise at Work Regs 2005 / HSE L108 / ISO 9612 | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
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
  const statusColMap: Record<NoiseStatus, [number, number, number]> = {
    green: [34, 197, 94], amber: [245, 158, 11], red: [239, 68, 68], dark_red: [153, 27, 27],
  };
  const statusLabels: Record<NoiseStatus, string> = {
    green: "BELOW LOWER EAV (80 dB) - NO ACTION REQUIRED",
    amber: "ABOVE LOWER EAV (80 dB) - PROVIDE HPE / INFORMATION",
    red: "ABOVE UPPER EAV (85 dB) - MANDATORY HPE / NOISE ZONE",
    dark_red: "ABOVE EXPOSURE LIMIT (87 dB) - IMMEDIATE ACTION REQUIRED",
  };
  const [sr, sg, sb] = statusColMap[overall];
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(M, y, CW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`LEP,d: ${fmtNum(lepd, 1)} dB(A) - ${statusLabels[overall]}`, M + 4, y + 5.5);
  doc.setTextColor(0, 0, 0); y += 13;

  // HPE protected level
  if (hpeChoice && protectedLEPd !== null) {
    checkPage(12);
    const protStatus = getNoiseStatus(protectedLEPd);
    const [pr, pg, pb] = statusColMap[protStatus];
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(M, y, CW, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`PROTECTED LEP,d: ${fmtNum(protectedLEPd, 1)} dB(A) with ${hpeChoice.name} (SNR ${hpeChoice.snr}, derated to ${Math.max(0, hpeChoice.snr - 4)} dB)`, M + 4, y + 5.5);
    doc.setTextColor(0, 0, 0); y += 13;
  }

  // Exposure summary table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Exposure Action / Limit Values", M, y); y += 5;

  const ealvRows = [
    { label: "Lower Exposure Action Value", value: "80 dB(A) LEP,d / 135 dB(C) peak", result: lepd >= LOWER_EAV ? "EXCEEDED" : "OK" },
    { label: "Upper Exposure Action Value", value: "85 dB(A) LEP,d / 137 dB(C) peak", result: lepd >= UPPER_EAV ? "EXCEEDED" : "OK" },
    { label: "Exposure Limit Value", value: "87 dB(A) LEP,d / 140 dB(C) peak (with HPE)", result: (protectedLEPd ?? lepd) >= ELV ? "EXCEEDED" : "OK" },
  ];
  const eCols = [60, 70, 56];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Threshold", "Value", "Status"].forEach((h, i) => { doc.setFillColor(30, 30, 30); doc.rect(cx, y, eCols[i], 6, "F"); doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += eCols[i]; });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const r of ealvRows) {
    const rowH = 5.5; cx = M;
    const isExc = r.result === "EXCEEDED";
    doc.setFont("helvetica", "normal");
    [r.label, r.value].forEach((t, i) => { doc.rect(cx, y, eCols[i], rowH, "D"); doc.text(t, cx + 2, y + 3.5); cx += eCols[i]; });
    if (isExc) { doc.setFillColor(239, 68, 68); doc.rect(cx, y, eCols[2], rowH, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text("EXCEEDED", cx + 2, y + 3.5); doc.setTextColor(0, 0, 0); }
    else { doc.setFillColor(34, 197, 94); doc.rect(cx, y, eCols[2], rowH, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text("OK", cx + 2, y + 3.5); doc.setTextColor(0, 0, 0); }
    y += rowH;
  }
  y += 6;

  // Task breakdown table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Task Exposure Breakdown", M, y); y += 5;

  const tCols = [52, 22, 22, 22, 28, 40];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Activity", "Level dB(A)", "Peak dB(C)", "Dur (min)", "Partial LEP,d", "Max @ 85 dB(A)"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, tCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += tCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const r of results) {
    const rowH = 5.5; checkPage(rowH); cx = M;
    const nameLines = doc.splitTextToSize(r.name, tCols[0] - 4);
    const rH = Math.max(rowH, nameLines.length * 2.8 + 2);
    [
      { text: nameLines, w: tCols[0] },
      { text: fmtNum(r.levelDBA, 0), w: tCols[1] },
      { text: r.peakDBC ? fmtNum(r.peakDBC, 0) : "--", w: tCols[2] },
      { text: `${r.durationMinutes}`, w: tCols[3] },
      { text: fmtNum(r.partialLEPd, 1), w: tCols[4] },
      { text: fmtTime(r.maxMinsUpperEAV), w: tCols[5] },
    ].forEach((col, i) => {
      doc.rect(cx, y, col.w, rH, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      if (Array.isArray(col.text)) doc.text(col.text, cx + 2, y + 3.5);
      else doc.text(col.text, cx + 2, y + 3.5);
      cx += col.w;
    });
    y += rH;
  }
  y += 6;

  // HPE Recommendation
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Hearing Protection Equipment (HPE)", M, y); y += 5;

  if (hpeChoice) {
    doc.setFillColor(255, 245, 235); doc.setDrawColor(220, 180, 140);
    doc.roundedRect(M, y, CW, 14, 1, 1, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text(`Selected HPE: ${hpeChoice.name}`, M + 3, y + 5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    const protText = protectedLEPd !== null ? `Protected LEP,d: ${fmtNum(protectedLEPd, 1)} dB(A)` : "";
    doc.text(`SNR: ${hpeChoice.snr} dB | Effective attenuation (derated): ${Math.max(0, hpeChoice.snr - 4)} dB | ${protText}`, M + 3, y + 10);
    y += 18;
  } else {
    doc.setFillColor(235, 250, 240); doc.setDrawColor(180, 220, 190);
    doc.roundedRect(M, y, CW, 10, 1, 1, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("No HPE required - LEP,d below lower exposure action value (80 dB(A))", M + 3, y + 6);
    y += 14;
  }

  // Action summary
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Required Actions per Noise at Work Regulations 2005", M, y); y += 5;

  const actions: { condition: boolean; text: string }[] = [
    { condition: lepd >= LOWER_EAV, text: "Reg 6: Carry out noise risk assessment" },
    { condition: lepd >= LOWER_EAV, text: "Reg 7(2): Reduce exposure so far as is reasonably practicable" },
    { condition: lepd >= LOWER_EAV, text: "Reg 8(1): Make HPE available to employees who request it" },
    { condition: lepd >= LOWER_EAV, text: "Reg 10: Provide information, instruction and training on noise risks" },
    { condition: lepd >= UPPER_EAV, text: "Reg 7(1): Establish and implement programme of organisational/technical measures" },
    { condition: lepd >= UPPER_EAV, text: "Reg 8(2): Ensure HPE is worn (mandatory enforcement)" },
    { condition: lepd >= UPPER_EAV, text: "Reg 9: Designate mandatory hearing protection zones with signage" },
    { condition: lepd >= UPPER_EAV, text: "Reg 9(1)(b): Ensure no person enters HPE zone without wearing HPE" },
    { condition: lepd >= UPPER_EAV, text: "Reg 11: Arrange health surveillance (audiometry)" },
  ];

  doc.setFontSize(6.5);
  for (const a of actions) {
    checkPage(5);
    if (a.condition) { doc.setFillColor(255, 240, 240); doc.rect(M, y, CW, 4.5, "F"); }
    doc.setFont("helvetica", "bold");
    doc.text(a.condition ? "[X]" : "[ ]", M + 2, y + 3);
    doc.setFont("helvetica", "normal");
    doc.text(a.text, M + 10, y + 3);
    y += 5;
  }
  y += 5;

  // Sign-off
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

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | Control of Noise at Work Regulations 2005 | HSE L108 | ISO 9612 | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`Noise-Exposure-Assessment-${docRef}.pdf`);
}

// ─── Activity Selector ───────────────────────────────────────
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
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCatFilter("")} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${!catFilter ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>All ({ACTIVITY_DATABASE.length})</button>
        {ACTIVITY_CATEGORIES.map(c => {
          const cnt = ACTIVITY_DATABASE.filter(a => a.category === c.id).length;
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${catFilter === c.id ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>{c.label} ({cnt})</button>
          );
        })}
      </div>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities / tools..." className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
      <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">No activities found</div>
        ) : (
          filtered.map(a => {
            const st = getNoiseStatus(a.typicalMid);
            const sc = STATUS_COLOURS[st];
            return (
              <button key={a.id} onClick={() => onChange(a.id)} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-ebrora-light transition-colors ${value === a.id ? "bg-ebrora-light/60 font-medium" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{a.name}</span>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{a.typicalMid} dB(A)
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Range: {a.typicalLow}-{a.typicalHigh} dB(A){a.peakLevel ? ` | Peak: ${a.peakLevel} dB(C)` : ""}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function NoiseExposureCalculatorClient() {
  const [showSettings, setShowSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Header
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  // Tasks
  const [tasks, setTasks] = useState<TaskEntry[]>([createTask()]);

  // HPE selection
  const [selectedHPE, setSelectedHPE] = useState<string | null>(null);

  const updateTask = useCallback((id: string, patch: Partial<TaskEntry>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.length > 1 ? prev.filter(t => t.id !== id) : prev);
  }, []);

  const addTask = useCallback(() => {
    setTasks(prev => [...prev, createTask()]);
  }, []);

  // Computed results
  const { results, lepd, overall, recHPE, totalMinutes } = useMemo(() => {
    const res: TaskResult[] = [];
    for (const t of tasks) {
      const dur = t.durationMinutes || 0;
      if (dur <= 0) continue;

      let level = 0, peak: number | null = null, name = t.customName || "Unnamed task";

      if (t.mode === "database" && t.activityId) {
        const act = ACTIVITY_DATABASE.find(a => a.id === t.activityId);
        if (act) { level = act.typicalMid; peak = act.peakLevel; name = act.name; }
      } else {
        level = t.customLevel || 0;
        peak = t.customPeak || null;
      }

      if (level <= 0) continue;

      const partial = 10 * Math.log10(Math.pow(10, level / 10) * (dur / (SHIFT_HOURS * 60)));
      const maxMins = maxExposureMinutes(level, UPPER_EAV);

      res.push({ id: t.id, name, levelDBA: level, peakDBC: peak, durationMinutes: dur, partialLEPd: partial, maxMinsUpperEAV: maxMins });
    }

    const lep = calculateLEPd(res.map(r => ({ levelDBA: r.levelDBA, durationMinutes: r.durationMinutes })));
    const ov = getNoiseStatus(lep);
    const rec = recommendHPE(lep);
    const totalMin = res.reduce((s, r) => s + r.durationMinutes, 0);

    return { results: res, lepd: lep, overall: ov, recHPE: rec, totalMinutes: totalMin };
  }, [tasks]);

  const hpeChoice = selectedHPE ? HPE_TYPES.find(h => h.id === selectedHPE) || recHPE : recHPE;
  const protectedLEPd = hpeChoice && lepd > 0 ? applyHPEAttenuation(lepd, hpeChoice.snr) : null;
  const protectedStatus = protectedLEPd !== null ? getNoiseStatus(protectedLEPd) : null;

  const hasData = results.length > 0;

  const handleExport = useCallback(async () => {
    if (!hasData) return;
    setExporting(true);
    try {
      await exportPDF({ company, site, manager, assessedBy, date }, results, lepd, protectedLEPd, overall, hpeChoice);
    } finally { setExporting(false); }
  }, [hasData, company, site, manager, assessedBy, date, results, lepd, protectedLEPd, overall, hpeChoice]);

  const clearAll = useCallback(() => {
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setDate(todayISO());
    setTasks([createTask()]); setSelectedHPE(null);
  }, []);

  const ovSt = STATUS_COLOURS[overall];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3.5 ${ovSt.bg} ${ovSt.border}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${ovSt.text}`}>
            <span className={`w-2 h-2 rounded-full ${ovSt.dot}`} />LEP,d
          </div>
          <div className={`text-xl font-bold mt-1 ${ovSt.text}`}>{hasData ? `${fmtNum(lepd, 1)} dB(A)` : "--"}</div>
          <div className={`text-[10px] mt-0.5 ${ovSt.text} opacity-70`}>{hasData ? ovSt.label : "Add tasks below"}</div>
        </div>

        {protectedLEPd !== null && protectedStatus ? (
          <div className={`rounded-xl border p-3.5 ${STATUS_COLOURS[protectedStatus].bg} ${STATUS_COLOURS[protectedStatus].border}`}>
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLOURS[protectedStatus].text}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOURS[protectedStatus].dot}`} />Protected
            </div>
            <div className={`text-xl font-bold mt-1 ${STATUS_COLOURS[protectedStatus].text}`}>{fmtNum(protectedLEPd, 1)} dB(A)</div>
            <div className={`text-[10px] mt-0.5 ${STATUS_COLOURS[protectedStatus].text} opacity-70`}>With HPE (SNR-4)</div>
          </div>
        ) : (
          <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-400" />Protected
            </div>
            <div className="text-xl font-bold mt-1 text-gray-400">--</div>
            <div className="text-[10px] mt-0.5 text-gray-400">Select HPE below</div>
          </div>
        )}

        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tasks</div>
          <div className="text-xl font-bold mt-1 text-gray-800">{results.length}</div>
          <div className="text-[10px] mt-0.5 text-gray-400">{totalMinutes > 0 ? `${fmtTime(totalMinutes)} total` : "No tasks"}</div>
        </div>

        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">HPE</div>
          <div className="text-sm font-bold mt-1 text-gray-800 leading-tight">{hpeChoice ? hpeChoice.name : "--"}</div>
          <div className="text-[10px] mt-0.5 text-gray-400">{hpeChoice ? `SNR ${hpeChoice.snr} dB` : "None selected"}</div>
        </div>
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
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">TASK {idx + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateTask(task.id, { mode: "manual", activityId: null })} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${task.mode === "manual" ? "bg-ebrora text-white border-ebrora" : "bg-white text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>Manual Entry</button>
                    <button onClick={() => updateTask(task.id, { mode: "database" })} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${task.mode === "database" ? "bg-ebrora text-white border-ebrora" : "bg-white text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>From Database ({ACTIVITY_DATABASE.length})</button>
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
                        <div className="text-xs text-blue-600 mt-1">Typical: {activity.typicalLow}-{activity.typicalHigh} dB(A) | Using mid-point: {activity.typicalMid} dB(A){activity.peakLevel ? ` | Peak: ${activity.peakLevel} dB(C)` : ""}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Activity / Tool Name</label>
                      <input type="text" value={task.customName} onChange={e => updateTask(task.id, { customName: e.target.value })} placeholder="e.g. Hilti TE 60 hammer drill in plant room" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Noise Level dB(A)</label>
                      <input type="number" step="1" min="40" max="140" value={task.customLevel ?? ""} onChange={e => updateTask(task.id, { customLevel: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 95" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Peak Level dB(C) <span className="normal-case font-normal">(optional)</span></label>
                      <input type="number" step="1" min="100" max="160" value={task.customPeak ?? ""} onChange={e => updateTask(task.id, { customPeak: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 135" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                    </div>
                  </div>
                )}

                {/* Duration + notes */}
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

                {/* Task result */}
                {result && (
                  <div className={`rounded-lg border p-3 ${STATUS_COLOURS[getNoiseStatus(result.levelDBA)].bg} ${STATUS_COLOURS[getNoiseStatus(result.levelDBA)].border}`}>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Level</div>
                        <div className="font-bold text-gray-800">{fmtNum(result.levelDBA, 0)} dB(A)</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Partial LEP,d</div>
                        <div className="font-bold text-gray-800">{fmtNum(result.partialLEPd, 1)} dB(A)</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Max @ 85dB</div>
                        <div className={`font-bold ${result.maxMinsUpperEAV < result.durationMinutes ? "text-red-600" : "text-green-600"}`}>{fmtTime(result.maxMinsUpperEAV)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={addTask} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-ebrora/30 hover:text-ebrora transition-colors">
          + Add Another Task
        </button>
      </div>

      {/* HPE Selection */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Hearing Protection Equipment (HPE) - SNR Method</h3>
          {recHPE && !selectedHPE && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <div className="text-xs font-bold text-amber-800">Recommended: {recHPE.name} (SNR {recHPE.snr})</div>
              <div className="text-[11px] text-amber-600">{recHPE.notes}</div>
            </div>
          )}
          <div className="space-y-1.5">
            {HPE_TYPES.map(h => {
              const isSelected = selectedHPE === h.id || (!selectedHPE && recHPE?.id === h.id);
              const protLevel = applyHPEAttenuation(lepd, h.snr);
              const protSt = getNoiseStatus(protLevel);
              const protSc = STATUS_COLOURS[protSt];
              return (
                <button key={h.id} onClick={() => setSelectedHPE(h.id)} className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${isSelected ? "bg-ebrora-light border-ebrora/30" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">{isSelected ? "[X] " : "[ ] "}{h.name}</span>
                      <span className="text-[10px] text-gray-400 ml-2">SNR {h.snr} dB | Type: {h.type}</span>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${protSc.bg} ${protSc.border} ${protSc.text}`}>
                      {fmtNum(protLevel, 1)} dB(A)
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{h.suitableFor}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Max exposure reference */}
      {hasData && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Maximum Unprotected Exposure Time (to Upper EAV 85 dB)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-500 uppercase">Activity</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Level</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Max @ 85dB</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const exceeds = r.maxMinsUpperEAV < r.durationMinutes;
                  return (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="px-2 py-2 font-medium text-gray-800">{r.name}</td>
                      <td className="px-2 py-2 text-right">{fmtNum(r.levelDBA, 0)} dB(A)</td>
                      <td className="px-2 py-2 text-right">{r.durationMinutes} min</td>
                      <td className={`py-2 text-right font-semibold ${exceeds ? "text-red-600" : "text-green-600"}`}>{fmtTime(r.maxMinsUpperEAV)}</td>
                      <td className={`py-2 text-right font-bold ${exceeds ? "text-red-600" : "text-green-600"}`}>{exceeds ? "EXCEEDS" : "OK"}</td>
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
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Noise Exposure Calculator</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Add a task above with a noise level and duration to calculate daily personal noise exposure LEP,d against the Control of Noise at Work Regulations 2005 action values. Enter measurements manually or select from the database.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Calculations per the Control of Noise at Work Regulations 2005, HSE L108 (Controlling noise at work, 2nd edition), and ISO 9612 (Determination of occupational noise exposure). Lower EAV: 80 dB(A) / 135 dB(C). Upper EAV: 85 dB(A) / 137 dB(C). Exposure Limit Value: 87 dB(A) / 140 dB(C) taking account of HPE attenuation.</p>
        <p>HPE attenuation uses the SNR (Single Number Rating) method with a real-world derating of 4 dB per HSE guidance (L108 Table 2). This tool provides an estimate based on published typical noise data and user inputs. It does not replace workplace noise measurements or a noise risk assessment conducted by a competent person.</p>
      </div>
    </div>
  );
}
