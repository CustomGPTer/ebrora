// src/components/hav-calculator/HAVCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  TOOL_TYPES, TOOL_LIBRARY,
  getManufacturersByType, getToolsByTypeAndMfr, searchTools,
  calculatePoints, calculateA8, getHAVStatus, getStatusColours,
  createDay, createOperative, createEntry,
  newId, EAV_POINTS, ELV_POINTS,
  type DayData, type OperativeData, type ExposureEntry, type ViewMode, type ToolEntry,
} from "@/data/hav-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v === 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }

function getWeekDates(startDate: string): string[] {
  const d = new Date(startDate);
  const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i);
    return dd.toISOString().slice(0, 10);
  });
}

/* ── Operative totals helper ──────────────────────────────────── */

function getOperativeDayTotals(days: DayData[], opName: string) {
  let totalPoints = 0; let totalTriggerMins = 0; let entryCount = 0;
  for (const day of days) {
    for (const op of day.operatives) {
      if (op.name.toLowerCase() === opName.toLowerCase()) {
        for (const e of op.entries) {
          if (e.points > 0) { totalPoints += e.points; totalTriggerMins += e.triggerTimeMinutes; entryCount++; }
        }
      }
    }
  }
  return { totalPoints, totalTriggerMins, entryCount, a8: calculateA8(totalPoints), status: getHAVStatus(totalPoints) };
}

/* ── PDF export ────────────────────────────────────────────────── */

async function exportPDF(
  header: { company: string; site: string; manager: string; preparedBy: string; date: string },
  days: DayData[], viewMode: ViewMode,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;

  // Collect all operatives across all days
  const opMap = new Map<string, { points: number; triggerMins: number; entries: { date: string; tool: string; mag: number; mins: number; pts: number; notes: string }[] }>();
  for (const day of days) {
    for (const op of day.operatives) {
      if (!op.name) continue;
      if (!opMap.has(op.name)) opMap.set(op.name, { points: 0, triggerMins: 0, entries: [] });
      const data = opMap.get(op.name)!;
      for (const e of op.entries) {
        if (e.points > 0) {
          data.points += e.points; data.triggerMins += e.triggerTimeMinutes;
          data.entries.push({ date: day.date, tool: e.isCustomTool ? e.customToolName : e.toolDisplay, mag: e.magnitudeUsed, mins: e.triggerTimeMinutes, pts: e.points, notes: e.notes });
        }
      }
    }
  }

  // One page per operative
  let pageIdx = 0;
  opMap.forEach((data, opName) => {
    if (pageIdx > 0) doc.addPage();
    pageIdx++;

    const a8 = calculateA8(data.points);
    const status = getHAVStatus(data.points);

    // Ref with operative name and site
    const safeSite = (header.site || "").replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const safeOp = opName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const docRef = `HAV-${safeOp}-${safeSite}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`.replace(/\s+/g, "-");

    // Dark header (PAID)
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("HAND-ARM VIBRATION EXPOSURE ASSESSMENT", M, 10);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Ref: ${docRef} | Rev 0 | HSE Points Method | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
    y = 28; doc.setTextColor(0, 0, 0);

    // Info panel
    doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
    doc.roundedRect(M, y - 3, CW, 24, 1, 1, "FD");
    doc.setFontSize(8);

    const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
      doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
      const lw = doc.getTextWidth(label) + 2;
      if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
      else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
    };
    drawFld("Operative:", opName, M + 3, y, 50);
    drawFld("Date:", header.date, M + CW / 2, y, 30);
    y += 5;
    drawFld("Site:", header.site, M + 3, y, 50);
    drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
    y += 5;
    drawFld("Company:", header.company, M + 3, y, 50);
    drawFld("Prepared By:", header.preparedBy, M + CW / 2, y, 40);
    y += 5;
    drawFld("Assessment Period:", viewMode === "weekly" ? `Week of ${days[0]?.date || ""}` : days[0]?.date || "", M + 3, y, 50);
    y += 10;

    // Summary boxes
    const boxW = (CW - 6) / 4;
    const boxes = [
      { label: "Daily Points", value: fmtNum(data.points, 1), colour: status === "ELV" ? [239, 68, 68] : status === "EAV" ? [245, 158, 11] : [34, 197, 94] },
      { label: "A(8) m/s2", value: fmtNum(a8, 2), colour: [59, 130, 246] },
      { label: "Trigger Time", value: `${Math.floor(data.triggerMins / 60)}h ${data.triggerMins % 60}m`, colour: [107, 114, 128] },
      { label: "Status", value: status === "ELV" ? "EXPOSURE LIMIT EXCEEDED" : status === "EAV" ? "ACTION VALUE REACHED" : "BELOW ACTION VALUE", colour: status === "ELV" ? [185, 28, 28] : status === "EAV" ? [180, 83, 9] : [22, 101, 52] },
    ] as const;

    boxes.forEach((b, i) => {
      const bx = M + i * (boxW + 2);
      doc.setFillColor(b.colour[0], b.colour[1], b.colour[2]);
      doc.roundedRect(bx, y, boxW, 12, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5); doc.setFont("helvetica", "normal");
      doc.text(b.label.toUpperCase(), bx + 3, y + 4);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(b.value, bx + 3, y + 10);
    });
    doc.setTextColor(0, 0, 0); y += 18;

    // Exposure log table
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Exposure Log", M, y); y += 5;
    // Table header
    doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255);
    doc.rect(M, y, CW, 5, "F"); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    const cols = [0, 18, 85, 105, 125, 148, 170];
    const heads = ["Date", "Tool", "Mag m/s2", "Time (min)", "Points", "Status", "Notes"];
    heads.forEach((h, i) => doc.text(h, M + cols[i] + 2, y + 3.5));
    doc.setTextColor(0, 0, 0); y += 5;

    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    data.entries.forEach((e, idx) => {
      if (y + 4.5 > 275) {
        doc.addPage();
        doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text(`HAV ASSESSMENT - ${opName} (continued)`, M, 7);
        doc.setFontSize(6); doc.setFont("helvetica", "normal");
        doc.text(docRef, W - M - 50, 7);
        doc.setTextColor(0, 0, 0); y = 14;
      }
      if (idx % 2 === 0) { doc.setFillColor(248, 248, 248); doc.rect(M, y - 1, CW, 4.5, "F"); }
      const entryStatus = getHAVStatus(e.pts);
      doc.setDrawColor(230, 230, 230); doc.line(M, y + 3, M + CW, y + 3);
      const toolTrunc = e.tool.length > 38 ? e.tool.slice(0, 36) + ".." : e.tool;
      const notesTrunc = e.notes.length > 15 ? e.notes.slice(0, 13) + ".." : e.notes;
      doc.text(e.date, M + cols[0] + 2, y + 2);
      doc.text(toolTrunc, M + cols[1] + 2, y + 2);
      doc.text(fmtNum(e.mag, 1), M + cols[2] + 2, y + 2);
      doc.text(`${e.mins}`, M + cols[3] + 2, y + 2);
      doc.setFont("helvetica", "bold"); doc.text(fmtNum(e.pts, 1), M + cols[4] + 2, y + 2);
      // Status colour
      if (entryStatus === "ELV") doc.setTextColor(185, 28, 28);
      else if (entryStatus === "EAV") doc.setTextColor(180, 83, 9);
      else doc.setTextColor(22, 101, 52);
      doc.text(entryStatus, M + cols[5] + 2, y + 2);
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
      doc.text(notesTrunc, M + cols[6] + 2, y + 2);
      y += 4.5;
    });

    // EAV/ELV reference
    y += 5;
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text("EAV (Exposure Action Value) = 100 points/day = A(8) 2.5 m/s2  |  ELV (Exposure Limit Value) = 400 points/day = A(8) 5.0 m/s2", M, y);
    doc.text("Control of Vibration at Work Regulations 2005. HSE Guidance L140.", M, y + 3.5);
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Sign-off
    if (y + 50 > 275) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(`HAV ASSESSMENT - ${opName} (continued)`, M, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }

    doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
    const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
    doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
    doc.setFillColor(245, 245, 245);
    doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
    doc.setFont("helvetica", "bold");
    doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
    y += soH;
    doc.setFont("helvetica", "normal");
    (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
      doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
      doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
      doc.setFont("helvetica", "normal"); y += soH;
    });
  });

  // Footer on all pages
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Hand-arm vibration assessment per Control of Vibration at Work Regulations 2005 and HSE Guidance L140. This does not replace health surveillance.", M, 290);
    doc.text(`Page ${p} of ${pc}`, W - M - 20, 290);
  }

  doc.save(`hav-assessment-${todayISO()}.pdf`);
}

/* ── Sub-components (defined OUTSIDE main component) ──────────── */

function ToolSelector({ entry, onUpdate }: { entry: ExposureEntry; onUpdate: (patch: Partial<ExposureEntry>) => void }) {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const manufacturers = useMemo(() => entry.toolType ? getManufacturersByType(entry.toolType) : [], [entry.toolType]);
  const tools = useMemo(() => entry.toolType && entry.manufacturer ? getToolsByTypeAndMfr(entry.toolType, entry.manufacturer) : [], [entry.toolType, entry.manufacturer]);
  const searchResults = useMemo(() => searchQuery.length >= 2 ? searchTools(searchQuery).slice(0, 15) : [], [searchQuery]);

  const selectTool = useCallback((tool: ToolEntry) => {
    onUpdate({
      toolType: tool.t, manufacturer: tool.m, toolDisplay: tool.d,
      magnitudeLibrary: tool.mag, magnitudeUsed: tool.mag,
      isCustomTool: false, customToolName: "",
    });
    setSearchMode(false); setSearchQuery(""); setShowDropdown(false);
  }, [onUpdate]);

  if (entry.isCustomTool) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Custom Tool</span>
          <button onClick={() => onUpdate({ isCustomTool: false, customToolName: "", magnitudeLibrary: 0, magnitudeUsed: 0, toolDisplay: "", toolType: "", manufacturer: "" })} className="text-[10px] text-gray-400 hover:text-gray-600 underline">Switch to library</button>
        </div>
        <input type="text" placeholder="Tool name/description" value={entry.customToolName} onChange={e => onUpdate({ customToolName: e.target.value, toolDisplay: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Magnitude (m/s2)</label>
          <input type="number" step={0.1} min={0} value={entry.magnitudeUsed || ""} onChange={e => { const v = parseFloat(e.target.value) || 0; onUpdate({ magnitudeUsed: v, magnitudeLibrary: v }); }} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => { setSearchMode(!searchMode); setShowDropdown(false); }} className={`text-[10px] font-medium px-2 py-0.5 rounded ${searchMode ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{searchMode ? "Filter Mode" : "Search"}</button>
        <button onClick={() => onUpdate({ isCustomTool: true, toolType: "", manufacturer: "", toolDisplay: "", magnitudeLibrary: 0, magnitudeUsed: 0 })} className="text-[10px] text-gray-400 hover:text-gray-600 underline">Custom tool</button>
      </div>

      {searchMode ? (
        <div className="relative">
          <input type="text" placeholder="Search tools..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" autoFocus />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((t, i) => (
                <button key={`${t.d}-${i}`} onClick={() => selectTool(t)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                  <span className="font-medium">{t.d}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.mag} m/s2</span>
                  <span className="text-[10px] text-gray-300 ml-2">{t.t}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Tool Type</label>
            <select value={entry.toolType} onChange={e => { onUpdate({ toolType: e.target.value, manufacturer: "", toolDisplay: "", magnitudeLibrary: 0, magnitudeUsed: entry.magnitudeOverride || 0 }); }} className={`w-full px-2.5 py-1.5 text-sm border rounded-lg outline-none ${entry.toolType ? "border-ebrora/30 bg-ebrora-light/40" : "border-gray-200 bg-blue-50/40"}`}>
              <option value="">Select type...</option>
              {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {entry.toolType && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Manufacturer</label>
              <select value={entry.manufacturer} onChange={e => { onUpdate({ manufacturer: e.target.value, toolDisplay: "", magnitudeLibrary: 0, magnitudeUsed: entry.magnitudeOverride || 0 }); }} className={`w-full px-2.5 py-1.5 text-sm border rounded-lg outline-none ${entry.manufacturer ? "border-ebrora/30 bg-ebrora-light/40" : "border-gray-200 bg-blue-50/40"}`}>
                <option value="">Select manufacturer...</option>
                {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {entry.manufacturer && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Tool / Model</label>
              <select value={entry.toolDisplay} onChange={e => { const tool = tools.find(t => t.d === e.target.value); if (tool) selectTool(tool); }} className={`w-full px-2.5 py-1.5 text-sm border rounded-lg outline-none ${entry.toolDisplay ? "border-ebrora/30 bg-ebrora-light/40" : "border-gray-200 bg-blue-50/40"}`}>
                <option value="">Select tool...</option>
                {tools.map((t, i) => <option key={`${t.d}-${i}`} value={t.d}>{t.d} ({t.mag} m/s2)</option>)}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function HAVCalculatorClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [days, setDays] = useState<DayData[]>([createDay()]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const activeDay = days[activeDayIndex] || days[0];

  // Switch to weekly mode
  const switchToWeekly = useCallback(() => {
    if (viewMode === "weekly") { setViewMode("daily"); return; }
    const weekDates = getWeekDates(days[0].date);
    const newDays = weekDates.map(d => {
      const existing = days.find(dd => dd.date === d);
      return existing || createDay(d);
    });
    setDays(newDays); setActiveDayIndex(0); setViewMode("weekly");
  }, [viewMode, days]);

  // Operative management
  const addOperative = useCallback(() => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, operatives: [...d.operatives, createOperative()] } : d));
  }, [activeDayIndex]);

  const removeOperative = useCallback((opId: string) => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, operatives: d.operatives.filter(o => o.id !== opId) } : d));
  }, [activeDayIndex]);

  const updateOperativeName = useCallback((opId: string, name: string) => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, operatives: d.operatives.map(o => o.id === opId ? { ...o, name } : o) } : d));
  }, [activeDayIndex]);

  // Entry management
  const addEntry = useCallback((opId: string) => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, operatives: d.operatives.map(o => o.id === opId ? { ...o, entries: [...o.entries, createEntry()] } : o) } : d));
  }, [activeDayIndex]);

  const removeEntry = useCallback((opId: string, entryId: string) => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, operatives: d.operatives.map(o => o.id === opId ? { ...o, entries: o.entries.filter(e => e.id !== entryId) } : o) } : d));
  }, [activeDayIndex]);

  const updateEntry = useCallback((opId: string, entryId: string, patch: Partial<ExposureEntry>) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return {
        ...d, operatives: d.operatives.map(o => {
          if (o.id !== opId) return o;
          return {
            ...o, entries: o.entries.map(e => {
              if (e.id !== entryId) return e;
              const updated = { ...e, ...patch };
              // Recalculate magnitude used and points
              updated.magnitudeUsed = updated.magnitudeOverride && updated.magnitudeOverride > 0 ? updated.magnitudeOverride : updated.magnitudeLibrary;
              updated.points = calculatePoints(updated.magnitudeUsed, updated.triggerTimeMinutes);
              return updated;
            }),
          };
        }),
      };
    }));
  }, [activeDayIndex]);

  // Dashboard data
  const allOperativeNames = useMemo(() => {
    const names = new Set<string>();
    for (const d of days) for (const o of d.operatives) if (o.name) names.add(o.name);
    return [...names].sort();
  }, [days]);

  const dashboardData = useMemo(() => {
    return allOperativeNames.map(name => {
      const totals = getOperativeDayTotals(days, name);
      return { name, ...totals };
    });
  }, [allOperativeNames, days]);

  // Summary
  const dayTotalPoints = useMemo(() => {
    return activeDay.operatives.reduce((sum, op) => sum + op.entries.reduce((s, e) => s + e.points, 0), 0);
  }, [activeDay]);

  const dayOperativeCount = activeDay.operatives.filter(o => o.name).length;
  const dayEntryCount = activeDay.operatives.reduce((s, o) => s + o.entries.filter(e => e.points > 0).length, 0);

  const clearAll = useCallback(() => {
    setDays([createDay()]); setActiveDayIndex(0); setViewMode("daily");
    setSite(""); setManager(""); setPreparedBy(""); setCompany("");
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, preparedBy, date: assessDate }, days, viewMode); }
    finally { setExporting(false); }
  }, [company, site, manager, preparedBy, assessDate, days, viewMode]);

  const hasData = dayEntryCount > 0;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Operatives", value: `${dayOperativeCount}`, sub: `${dayEntryCount} tool entries`, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
          { label: "Day Points", value: fmtNum(dayTotalPoints, 1), sub: `EAV=${EAV_POINTS} | ELV=${ELV_POINTS}`, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
          { label: "Mode", value: viewMode === "weekly" ? "Weekly" : "Daily", sub: viewMode === "weekly" ? "7-day planner" : activeDay.date, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
          { label: "Date", value: new Date(activeDay.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), sub: activeDay.date, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings</button>
        <button onClick={switchToWeekly} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === "weekly" ? "text-purple-700 bg-purple-100 hover:bg-purple-200" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}>
          {viewMode === "weekly" ? "Switch to Daily" : "Switch to Weekly"}</button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
        <button onClick={handleExport} disabled={!hasData || exporting} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}</button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site Name", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Prepared By", v: preparedBy, s: setPreparedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label><input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Weekly day tabs */}
      {viewMode === "weekly" && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d, i) => {
            const dayName = new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" });
            const dayNum = new Date(d.date).getDate();
            const dayPoints = d.operatives.reduce((s, o) => s + o.entries.reduce((ss, e) => ss + e.points, 0), 0);
            return (
              <button key={d.date} onClick={() => setActiveDayIndex(i)} className={`flex-shrink-0 px-3 py-2 rounded-lg text-center transition-colors border ${i === activeDayIndex ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <div className="text-[10px] font-bold uppercase">{dayName}</div>
                <div className="text-sm font-bold">{dayNum}</div>
                {dayPoints > 0 && <div className={`text-[10px] font-medium ${getHAVStatus(dayPoints) === "ELV" ? "text-red-600" : getHAVStatus(dayPoints) === "EAV" ? "text-amber-600" : "text-green-600"}`}>{fmtNum(dayPoints, 0)}pts</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Date picker for daily mode */}
      {viewMode === "daily" && (
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
          <input type="date" value={activeDay.date} onChange={e => setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, date: e.target.value } : d))} className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
        </div>
      )}

      {/* Operative sections */}
      {activeDay.operatives.map((op) => {
        const opPoints = op.entries.reduce((s, e) => s + e.points, 0);
        const opA8 = calculateA8(opPoints);
        const opStatus = getHAVStatus(opPoints);
        const sc = getStatusColours(opStatus);

        return (
          <div key={op.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Operative header */}
            <div className={`px-4 py-3 border-b flex items-center gap-3 ${sc.bg} ${sc.border}`}>
              <input type="text" placeholder="Operative name" value={op.name} onChange={e => updateOperativeName(op.id, e.target.value)}
                className={`flex-1 px-2.5 py-1.5 text-sm font-medium border rounded-lg bg-white/80 focus:border-ebrora outline-none ${sc.border}`} />
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className={`text-xs font-bold ${sc.text}`}>{fmtNum(opPoints, 1)} pts</div>
                  <div className={`text-[10px] ${sc.text}`}>A(8) {fmtNum(opA8, 2)} m/s2</div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>{opStatus}</span>
                {activeDay.operatives.length > 1 && (
                  <button onClick={() => removeOperative(op.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                )}
              </div>
            </div>

            {/* Entries — mobile card layout */}
            <div className="lg:hidden p-3 space-y-3">
              {op.entries.map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                  <ToolSelector entry={entry} onUpdate={patch => updateEntry(op.id, entry.id, patch)} />

                  {entry.magnitudeUsed > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Trigger Time (min)</label>
                          <input type="number" step={5} min={0} value={entry.triggerTimeMinutes || ""} placeholder="0" onChange={e => updateEntry(op.id, entry.id, { triggerTimeMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Override m/s2</label>
                          <input type="number" step={0.1} min={0} value={entry.magnitudeOverride ?? ""} placeholder={`${entry.magnitudeLibrary}`} onChange={e => updateEntry(op.id, entry.id, { magnitudeOverride: e.target.value === "" ? null : parseFloat(e.target.value) })}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Notes</label>
                        <input type="text" value={entry.notes} onChange={e => updateEntry(op.id, entry.id, { notes: e.target.value })} placeholder="e.g. drilling into concrete" className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Mag: {fmtNum(entry.magnitudeUsed, 1)} m/s2 | Points: <span className="font-bold">{fmtNum(entry.points, 1)}</span></span>
                        <button onClick={() => removeEntry(op.id, entry.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <button onClick={() => addEntry(op.id)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">+ Add Tool Entry</button>
            </div>

            {/* Entries — desktop table */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Tool Selection", "Mag (m/s2)", "Time (min)", "Override", "Points", "Notes", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {op.entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-blue-50/20">
                      <td className="px-3 py-2 w-72">
                        <ToolSelector entry={entry} onUpdate={patch => updateEntry(op.id, entry.id, patch)} />
                      </td>
                      <td className="px-3 py-2 tabular-nums text-center">
                        <span className={`font-medium ${entry.magnitudeOverride ? "text-amber-600" : ""}`}>{entry.magnitudeUsed > 0 ? fmtNum(entry.magnitudeUsed, 1) : "--"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step={5} min={0} value={entry.triggerTimeMinutes || ""} placeholder="0" onChange={e => updateEntry(op.id, entry.id, { triggerTimeMinutes: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step={0.1} min={0} value={entry.magnitudeOverride ?? ""} placeholder="--" onChange={e => updateEntry(op.id, entry.id, { magnitudeOverride: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums text-center" />
                      </td>
                      <td className="px-3 py-2 tabular-nums text-center font-bold">{entry.points > 0 ? fmtNum(entry.points, 1) : "--"}</td>
                      <td className="px-3 py-2">
                        <input type="text" value={entry.notes} onChange={e => updateEntry(op.id, entry.id, { notes: e.target.value })} placeholder="Notes..." className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                      </td>
                      <td className="px-3 py-2"><button onClick={() => removeEntry(op.id, entry.id)} className="text-red-400 hover:text-red-600 text-xs">X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3">
                <button onClick={() => addEntry(op.id)} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">+ Add Tool Entry</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add operative button */}
      <button onClick={addOperative} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:text-ebrora-dark hover:border-ebrora/40 transition-colors">+ Add Operative</button>

      {/* Dashboard */}
      {allOperativeNames.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Operative Dashboard</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Summary of all operatives across {viewMode === "weekly" ? "the week" : "today"}.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {dashboardData.map(op => {
              const sc = getStatusColours(op.status);
              const pctEAV = Math.min((op.totalPoints / EAV_POINTS) * 100, 100);
              const pctELV = Math.min((op.totalPoints / ELV_POINTS) * 100, 100);
              return (
                <div key={op.name} className="px-4 py-3 flex items-center gap-4">
                  <div className="w-36 truncate font-medium text-sm text-gray-800">{op.name}</div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      {/* EAV marker */}
                      <div className="absolute left-[25%] top-0 bottom-0 w-px bg-amber-300 z-10" title="EAV (100pts)" />
                      {/* ELV = full bar */}
                      <div className={`h-full rounded-full transition-all ${op.status === "ELV" ? "bg-red-500" : op.status === "EAV" ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pctELV}%` }} />
                    </div>
                    <div className="flex justify-between mt-0.5 text-[9px] text-gray-400">
                      <span>0</span><span>EAV (100)</span><span>ELV (400)</span>
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <div className="text-sm font-bold tabular-nums">{fmtNum(op.totalPoints, 1)} pts</div>
                    <div className="text-[10px] text-gray-500">A(8) {fmtNum(op.a8, 2)}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>{op.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-xl">
        Hand-arm vibration exposure calculated using the HSE points method per the Control of Vibration at Work Regulations 2005 and HSE Guidance L140. EAV = 2.5 m/s2 A(8) (100 points). ELV = 5.0 m/s2 A(8) (400 points). Tool library magnitudes are manufacturer-declared or from GAP HAV Guide. On-site measurement may differ. White-label PDF — per-operative export.</p></div>
    </div>
  );
}
