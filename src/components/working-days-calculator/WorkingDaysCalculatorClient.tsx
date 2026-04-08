// src/components/working-days-calculator/WorkingDaysCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  calculateWorkingDays, fmtDate,
  BH_REGIONS, WEEKEND_RULES,
} from "@/data/working-days-calculator";
import type { WeekendRule, BHRegion, NonWorkingPeriod, WorkingDaysResult } from "@/data/working-days-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  d.setDate(d.getDate() - 1); // end of that month period
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let _idCounter = 0;
function nextId() { return `nwp-${++_idCounter}-${Date.now()}`; }

// ─── SVG: Compact Gantt Calendar ─────────────────────────────
function GanttCalendar({ result }: { result: WorkingDaysResult }) {
  const months = result.monthSummaries;
  if (months.length === 0) return null;

  const ROW_H = 18, PAD_L = 65, PAD_R = 10, PAD_T = 28, PAD_B = 10;
  const maxDays = Math.max(...months.map(m => m.calendarDays));
  const cellW = Math.max(6, Math.min(14, (600 - PAD_L - PAD_R) / maxDays));
  const W = PAD_L + maxDays * cellW + PAD_R;
  const H = PAD_T + months.length * ROW_H + PAD_B;

  // Build lookup
  const daysByMonth = new Map<string, typeof result.days>();
  for (const d of result.days) {
    const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!daysByMonth.has(key)) daysByMonth.set(key, []);
    daysByMonth.get(key)!.push(d);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: Math.min(months.length * 22 + 50, 400) }}>
      {/* Day number header */}
      {Array.from({ length: maxDays }).map((_, i) => (
        (i + 1) % 5 === 0 || i === 0 ? (
          <text key={`dh-${i}`} x={PAD_L + i * cellW + cellW / 2} y={PAD_T - 6} textAnchor="middle" fontSize={7} fill="#9CA3AF">{i + 1}</text>
        ) : null
      ))}
      {/* Rows */}
      {months.map((m, ri) => {
        const key = `${m.year}-${m.month}`;
        const mDays = daysByMonth.get(key) || [];
        const y = PAD_T + ri * ROW_H;
        return (
          <g key={key}>
            <text x={PAD_L - 4} y={y + ROW_H / 2 + 3} textAnchor="end" fontSize={8} fill="#374151" fontWeight={600}>{m.label}</text>
            {mDays.map((d, di) => {
              const x = PAD_L + di * cellW;
              let fill = "#E8F0EC"; // working day — ebrora light green
              if (d.isWeekend) fill = "#E5E7EB"; // grey
              else if (d.isBankHoliday) fill = "#BFDBFE"; // blue
              else if (d.isCustomExclusion) fill = "#FECACA"; // red
              return (
                <rect key={d.iso} x={x} y={y} width={cellW - 1} height={ROW_H - 2} fill={fill} rx={1.5} />
              );
            })}
            {/* Working days count */}
            <text x={PAD_L + mDays.length * cellW + 4} y={y + ROW_H / 2 + 3} fontSize={7} fontWeight={600} fill="#1B5745">{m.workingDays}d</text>
          </g>
        );
      })}
      {/* Legend */}
      {[
        { fill: "#E8F0EC", label: "Working" }, { fill: "#E5E7EB", label: "Weekend" },
        { fill: "#BFDBFE", label: "Bank Hol" }, { fill: "#FECACA", label: "Exclusion" },
      ].map((l, i) => (
        <g key={l.label}>
          <rect x={PAD_L + i * 70} y={H - 8} width={8} height={6} fill={l.fill} rx={1} />
          <text x={PAD_L + i * 70 + 11} y={H - 3} fontSize={7} fill="#6B7280">{l.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Monthly Breakdown Bar Chart ────────────────────────
function MonthlyBarChart({ result }: { result: WorkingDaysResult }) {
  const months = result.monthSummaries;
  if (months.length === 0) return null;

  const W = 600, PAD = { top: 15, right: 15, bottom: 30, left: 55 };
  const barH = 20, gap = 6;
  const H = PAD.top + months.length * (barH + gap) + PAD.bottom;
  const cw = W - PAD.left - PAD.right;
  const maxDays = Math.max(...months.map(m => m.calendarDays));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: Math.min(months.length * 28 + 50, 500) }}>
      {months.map((m, i) => {
        const y = PAD.top + i * (barH + gap);
        const scale = cw / maxDays;
        const wW = m.workingDays * scale;
        const weW = m.weekendDays * scale;
        const bhW = m.bankHolidays * scale;
        const exW = m.customExclusions * scale;
        let x = PAD.left;
        return (
          <g key={`${m.year}-${m.month}`}>
            <text x={PAD.left - 4} y={y + barH / 2 + 3} textAnchor="end" fontSize={8} fill="#374151" fontWeight={600}>{m.label}</text>
            <rect x={x} y={y} width={wW} height={barH} fill="#1B5745" rx={2} />
            {(() => { x += wW; return null; })()}
            <rect x={x} y={y} width={weW} height={barH} fill="#D1D5DB" />
            {(() => { x += weW; return null; })()}
            <rect x={x} y={y} width={bhW} height={barH} fill="#93C5FD" />
            {(() => { x += bhW; return null; })()}
            <rect x={x} y={y} width={exW} height={barH} fill="#FCA5A5" rx={2} />
            {/* Count label */}
            <text x={PAD.left + (m.workingDays + m.weekendDays + m.bankHolidays + m.customExclusions) * scale + 4} y={y + barH / 2 + 3} fontSize={8} fontWeight={600} fill="#1B5745">{m.workingDays}</text>
          </g>
        );
      })}
      {/* Legend */}
      {[
        { fill: "#1B5745", label: "Working" }, { fill: "#D1D5DB", label: "Weekend" },
        { fill: "#93C5FD", label: "Bank Hol" }, { fill: "#FCA5A5", label: "Exclusion" },
      ].map((l, i) => (
        <g key={l.label}>
          <rect x={PAD.left + i * 80} y={H - 12} width={8} height={6} fill={l.fill} rx={1} />
          <text x={PAD.left + i * 80 + 11} y={H - 7} fontSize={7} fill="#6B7280">{l.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Non-Working Period Editor ────────────────────────────────
function ExclusionEditor({ periods, onChange }: { periods: NonWorkingPeriod[]; onChange: (p: NonWorkingPeriod[]) => void }) {
  const [mode, setMode] = useState<"single" | "range">("range");
  const [label, setLabel] = useState("");
  const [sDate, setSDate] = useState("");
  const [eDate, setEDate] = useState("");

  const addPeriod = () => {
    if (!sDate) return;
    const end = mode === "single" ? sDate : (eDate || sDate);
    const name = label || (mode === "single" ? "Excluded day" : "Shutdown");
    onChange([...periods, { id: nextId(), label: name, startDate: sDate, endDate: end }]);
    setLabel(""); setSDate(""); setEDate("");
  };

  const remove = (id: string) => onChange(periods.filter(p => p.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Add exclusion:</span>
        <div className="flex rounded-md overflow-hidden border border-gray-200">
          <button onClick={() => setMode("single")} className={`px-2 py-0.5 text-[10px] font-bold ${mode === "single" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>Single date</button>
          <button onClick={() => setMode("range")} className={`px-2 py-0.5 text-[10px] font-bold ${mode === "range" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>Date range</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Label</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder={mode === "single" ? "e.g. Training day" : "e.g. Christmas shutdown"}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">{mode === "single" ? "Date" : "Start date"}</label>
          <input type="date" value={sDate} onChange={e => setSDate(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
        </div>
        {mode === "range" && (
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">End date</label>
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        )}
        <div className="flex items-end">
          <button onClick={addPeriod} disabled={!sDate} className="px-3 py-1 text-xs font-medium bg-ebrora text-white rounded-lg hover:bg-ebrora-dark transition-colors disabled:opacity-40">Add</button>
        </div>
      </div>
      {periods.length > 0 && (
        <div className="space-y-1">
          {periods.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1 bg-red-50 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="font-medium text-red-800">{p.label}</span>
              <span className="text-red-600">{fmtDate(p.startDate)}{p.startDate !== p.endDate ? ` - ${fmtDate(p.endDate)}` : ""}</span>
              <button onClick={() => remove(p.id)} className="ml-auto text-red-400 hover:text-red-600 font-bold">x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  result: WorkingDaysResult,
  weekendRule: WeekendRule,
  region: BHRegion,
  customPeriods: NonWorkingPeriod[],
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `WDC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("WORKING DAYS CALCULATION", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("UK Bank Holidays / NEC4 Programme Planning", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 30, 1, 1, "FD"); doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Site:", header.site, M + halfW, y, 40); y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 50);
  drawFld("Prepared By:", header.assessedBy, M + halfW, y, 40); y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Region:", BH_REGIONS.find(r => r.value === region)!.label, M + halfW, y, 0); y += 5;
  drawFld("Period:", `${fmtDate(result.startDate)} -- ${fmtDate(result.endDate)}`, M + 3, y, 0);
  drawFld("Weekends:", WEEKEND_RULES.find(r => r.value === weekendRule)!.label, M + halfW, y, 0);
  y += 8;

  // Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Working days calculation for ${header.site || "the above site"} from ${fmtDate(result.startDate)} to ${fmtDate(result.endDate)}. Bank holidays: ${BH_REGIONS.find(r => r.value === region)!.label}. Weekend rule: ${WEEKEND_RULES.find(r => r.value === weekendRule)!.label}. ${customPeriods.length > 0 ? `${customPeriods.length} additional exclusion period(s).` : "No additional exclusions."}`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("WORKING DAYS CALCULATION (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Result banner
  const rgb = [27, 87, 69];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`${result.netWorkingDays} WORKING DAYS (${result.programmeWeeks} PROGRAMME WEEKS)`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`${result.totalCalendarDays} calendar days | ${result.weekendDays} weekends | ${result.bankHolidays} bank holidays | ${result.customExclusionDays} exclusions`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // Summary panel
  checkPage(45);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 38, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Calculation Summary", M + 4, y + 2); y += 6;
  const items: [string, string][] = [
    ["Start Date", fmtDate(result.startDate)],
    ["End Date", fmtDate(result.endDate)],
    ["Total Calendar Days", String(result.totalCalendarDays)],
    ["Weekend Days Excluded", String(result.weekendDays)],
    ["Bank Holidays Excluded", String(result.bankHolidays)],
    ["Custom Exclusions", String(result.customExclusionDays)],
    ["Net Working Days", String(result.netWorkingDays)],
    ["Working Days %", `${result.workingDaysPct}%`],
    ["Programme Weeks (/ 5)", String(result.programmeWeeks)],
  ];
  items.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setTextColor(17, 24, 39); doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.4;
  });
  y += 6;

  // Monthly breakdown table
  checkPage(10 + result.monthSummaries.length * 6);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Monthly Breakdown", M, y); y += 5;
  const cols = [32, 28, 28, 28, 28, 28];
  let cx = M;
  ["Month", "Calendar", "Weekends", "Bank Hols", "Exclusions", "Working"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  result.monthSummaries.forEach((m, ri) => {
    checkPage(6);
    cx = M;
    const cells = [m.label, String(m.calendarDays), String(m.weekendDays), String(m.bankHolidays), String(m.customExclusions), String(m.workingDays)];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 || i === 5 ? "bold" : "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 3.8);
      cx += cols[i];
    });
    y += 5.5;
  });
  // Totals row
  cx = M;
  const totals = ["TOTAL", String(result.totalCalendarDays), String(result.weekendDays), String(result.bankHolidays), String(result.customExclusionDays), String(result.netWorkingDays)];
  totals.forEach((t, i) => {
    doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
    doc.rect(cx, y, cols[i], 6, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(t, cx + 2, y + 4);
    cx += cols[i];
  });
  y += 10;

  // Gantt calendar in PDF
  if (result.monthSummaries.length > 0 && result.monthSummaries.length <= 12) {
    checkPage(10 + result.monthSummaries.length * 5);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Calendar View", M, y);
    doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Green = working, grey = weekend, blue = bank holiday, red = exclusion.", M, y + 4);
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 8;

    const daysByMonth = new Map<string, typeof result.days>();
    for (const d of result.days) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      if (!daysByMonth.has(key)) daysByMonth.set(key, []);
      daysByMonth.get(key)!.push(d);
    }

    const cellW2 = Math.min(4.5, (CW - 20) / 31);
    const rowH2 = 4;

    result.monthSummaries.forEach((m, ri) => {
      checkPage(6);
      const key = `${m.year}-${m.month}`;
      const mDays = daysByMonth.get(key) || [];
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text(m.label, M, y + 3);

      mDays.forEach((d, di) => {
        const x = M + 18 + di * cellW2;
        let r2 = 200, g = 230, b = 210; // working (green-ish)
        if (d.isWeekend) { r2 = 220; g = 220; b = 220; }
        else if (d.isBankHoliday) { r2 = 180; g = 210; b = 255; }
        else if (d.isCustomExclusion) { r2 = 255; g = 180; b = 180; }
        doc.setFillColor(r2, g, b);
        doc.rect(x, y, cellW2 - 0.3, rowH2, "F");
      });
      doc.setFontSize(4.5); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
      doc.text(`${m.workingDays}d`, M + 18 + mDays.length * cellW2 + 2, y + 3);
      doc.setTextColor(0, 0, 0);
      y += rowH2 + 1.5;
    });
    y += 4;
  }

  // Monthly bar chart in PDF
  if (result.monthSummaries.length > 0) {
    checkPage(10 + result.monthSummaries.length * 6);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Monthly Working Days Breakdown", M, y);
    doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Stacked bar showing composition of each month's calendar days.", M, y + 4);
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 8;

    const barH2 = 4.5, barGap = 1.5;
    const maxCal = Math.max(...result.monthSummaries.map(m => m.calendarDays));
    const barAreaW = CW - 30;

    result.monthSummaries.forEach((m) => {
      checkPage(7);
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text(m.label, M, y + 3.5);

      let bx = M + 18;
      const scale = barAreaW / maxCal;
      // Working
      doc.setFillColor(27, 87, 69); doc.rect(bx, y, m.workingDays * scale, barH2, "F"); bx += m.workingDays * scale;
      // Weekends
      doc.setFillColor(200, 200, 200); doc.rect(bx, y, m.weekendDays * scale, barH2, "F"); bx += m.weekendDays * scale;
      // Bank hols
      doc.setFillColor(147, 197, 253); doc.rect(bx, y, m.bankHolidays * scale, barH2, "F"); bx += m.bankHolidays * scale;
      // Exclusions
      doc.setFillColor(252, 165, 165); doc.rect(bx, y, m.customExclusions * scale, barH2, "F"); bx += m.customExclusions * scale;

      doc.setFontSize(4.5); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
      doc.text(`${m.workingDays}`, bx + 2, y + 3.5);
      doc.setTextColor(0, 0, 0);
      y += barH2 + barGap;
    });
    y += 6;
  }

  // Bank holiday list
  if (result.bankHolidayList.length > 0) {
    checkPage(10 + result.bankHolidayList.length * 4);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Bank Holidays in Period", M, y); y += 5;
    const bhCols = [35, CW - 35];
    cx = M;
    ["Date", "Holiday"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, bhCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(h, cx + 2, y + 4);
      cx += bhCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    result.bankHolidayList.forEach((bh, ri) => {
      checkPage(6);
      cx = M;
      [fmtDate(bh.date), bh.name].forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, bhCols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, bhCols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
        doc.text(t, cx + 2, y + 3.8);
        cx += bhCols[i];
      });
      y += 5.5;
    });
    y += 6;
  }

  // Custom exclusions list
  if (customPeriods.length > 0) {
    checkPage(10 + customPeriods.length * 4);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Custom Exclusion Periods", M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    customPeriods.forEach(p => {
      checkPage(5);
      doc.text(`- ${p.label}: ${fmtDate(p.startDate)}${p.startDate !== p.endDate ? " -- " + fmtDate(p.endDate) : ""}`, M + 2, y);
      y += 3.5;
    });
    y += 4;
  }

  // Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Notes", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(8);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3.5;
  });
  y += 4;

  // Sign-off
  checkPage(50); y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Working days calculation based on published UK bank holiday dates. Verify exceptional holidays (coronations, state funerals). This is a planning tool -- programme durations should be confirmed.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`working-days-calculation-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function WorkingDaysCalculatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addMonths(todayISO(), 6));
  const [weekendRule, setWeekendRule] = useState<WeekendRule>("sat-sun");
  const [region, setRegion] = useState<BHRegion>("england-wales");
  const [customPeriods, setCustomPeriods] = useState<NonWorkingPeriod[]>([]);

  // Clamp to max 12 months
  const clampedEnd = useMemo(() => {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    const maxEnd = new Date(s);
    maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    if (e > maxEnd) return toISOLocal(maxEnd);
    return endDate;
  }, [startDate, endDate]);

  const result = useMemo(() =>
    calculateWorkingDays(startDate, clampedEnd, weekendRule, region, customPeriods),
    [startDate, clampedEnd, weekendRule, region, customPeriods]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, result, weekendRule, region, customPeriods); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, result, weekendRule, region, customPeriods]);

  const clearAll = useCallback(() => {
    setStartDate(todayISO()); setEndDate(addMonths(todayISO(), 6));
    setWeekendRule("sat-sun"); setRegion("england-wales"); setCustomPeriods([]);
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Working Days", value: String(result.netWorkingDays), sub: `of ${result.totalCalendarDays} calendar days`, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
          { label: "Programme Weeks", value: String(result.programmeWeeks), sub: "Working days / 5", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Working %", value: `${result.workingDaysPct}%`, sub: `${result.weekendDays} weekends + ${result.bankHolidays} bank hols`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Exclusions", value: String(result.bankHolidays + result.customExclusionDays), sub: `${result.bankHolidays} bank hol + ${result.customExclusionDays} custom`, bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Max range warning */}
      {endDate !== clampedEnd && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-orange-600">!</span>
          <div><div className="text-sm font-bold text-orange-900">Date Range Clamped to 12 Months</div>
            <div className="text-xs text-orange-800 mt-1">The maximum supported range is 12 months. End date has been adjusted to {fmtDate(clampedEnd)}.</div></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={result.netWorkingDays > 0}>
          <button onClick={handleExport} disabled={exporting || result.netWorkingDays === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Prepared By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Date Range & Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min="2025-01-01" max="2035-12-31"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} max="2035-12-31"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            {endDate !== clampedEnd && <div className="text-[10px] text-orange-600 mt-1">Clamped to 12 months max</div>}
          </div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Weekend Exclusion</label>
            <select value={weekendRule} onChange={e => setWeekendRule(e.target.value as WeekendRule)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {WEEKEND_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Bank Holidays</label>
            <select value={region} onChange={e => setRegion(e.target.value as BHRegion)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {BH_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select></div>
        </div>
      </div>

      {/* Custom Exclusions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Additional Non-Working Days</h3>
        <p className="text-[11px] text-gray-400">Add shutdowns, client-mandated closures, training days, or any other non-working periods.</p>
        <ExclusionEditor periods={customPeriods} onChange={setCustomPeriods} />
      </div>

      {/* Gantt Calendar */}
      {result.monthSummaries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Calendar View</h3>
          <p className="text-[11px] text-gray-400">Compact calendar showing day types per month. Numbers on right = working days in that month.</p>
          <GanttCalendar result={result} />
        </div>
      )}

      {/* Monthly Bar Chart */}
      {result.monthSummaries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Monthly Breakdown</h3>
          <p className="text-[11px] text-gray-400">Stacked bar showing the composition of calendar days per month.</p>
          <MonthlyBarChart result={result} />
        </div>
      )}

      {/* Bank Holiday List */}
      {result.bankHolidayList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Bank Holidays in Period ({BH_REGIONS.find(r => r.value === region)!.label})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {result.bankHolidayList.map(bh => (
              <div key={bh.date} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-medium text-gray-800 w-32">{fmtDate(bh.date)}</span>
                <span className="text-gray-600">{bh.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Notes</h3></div>
        <div className="px-4 py-3 space-y-2">
          {result.recommendations.map((rec, i) => <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span></div>)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Bank holidays calculated from published UK government dates (2025-2035) using the Anonymous Gregorian Easter computus.
          Includes substitute days for weekends per standard UK rules. Scotland and Northern Ireland additional holidays included.
          This is a planning tool - verify dates for NEC4 contract purposes.
        </p>
      </div>
    </div>
  );
}

// ─── Helper used by clamp ────────────────────────────────────
function toISOLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
