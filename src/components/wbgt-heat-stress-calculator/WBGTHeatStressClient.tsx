// src/components/wbgt-heat-stress-calculator/WBGTHeatStressClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  InputMode,
  OutputMode,
  RiskLevel,
  DayEntry,
  SunExposure,
} from "@/data/wbgt-heat-stress-calculator";
import {
  ACTIVITY_LEVELS,
  WORK_REST_RATIOS,
  RISK_THRESHOLDS,
  SUN_EXPOSURE_OPTIONS,
  WEEKDAY_LABELS,
  createEmptyDayEntry,
} from "@/data/wbgt-heat-stress-calculator";
import {
  calculateDirectWBGT,
  calculateEstimatedWBGT,
  assessWBGT,
  getRiskThreshold,
} from "@/lib/wbgt-heat-stress-calculator/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function fmtNum(v: number | null, dp = 1): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

const RISK_CARD_STYLES: Record<RiskLevel, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  engineering: "Engineering Control",
  administrative: "Administrative Control",
  ppe: "PPE",
  welfare: "Welfare",
};

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  entries: DayEntry[],
  outputMode: OutputMode,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  let y = 0;

  // ── Header bar
  const docRef = `WBGT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("WBGT HEAT STRESS ASSESSMENT", M, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ISO 7243 / HSE Thermal Comfort — ebrora.com/tools/wbgt-heat-stress-calculator", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 5;
  drawFld("Assessment Type:", outputMode === "daily" ? "Daily Assessment" : "Weekly (5-Day) Planner", M + 3, y, 0);
  y += 8;

  // Scope statement
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  const scopeText = `This heat stress assessment covers ${header.site || "the above site"} as at ${header.date || new Date().toLocaleDateString("en-GB")}. It uses the ISO 7243:2017 WBGT methodology with the Lemke & Kjellstrom (2012) simplified estimation. Work/rest ratios assume acclimatised workers. This is a planning aid and does not replace site-specific monitoring with calibrated instruments.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  // Helper to add new page if needed
  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("WBGT HEAT STRESS ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Process each day entry
  const daysToProcess = outputMode === "daily" ? entries.slice(0, 1) : entries;

  daysToProcess.forEach((entry, dayIdx) => {
    checkPage(60);

    // Day header
    doc.setFillColor(240, 240, 240);
    doc.rect(M, y - 3, CW, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 87, 69);
    doc.text(entry.label, M + 3, y + 1);
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Calculate WBGT
    const wbgt = entry.mode === "direct"
      ? calculateDirectWBGT(entry.direct)
      : calculateEstimatedWBGT(entry.estimated);
    const result = assessWBGT(wbgt, entry.activityLevel);
    const threshold = getRiskThreshold(result.riskLevel);
    const actLevel = ACTIVITY_LEVELS.find(a => a.id === entry.activityLevel);

    // Input summary
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    if (entry.mode === "direct") {
      doc.text(`Input Mode: Direct WBGT | Dry Bulb: ${entry.direct.dryBulbC ?? "—"}°C | Wet Bulb: ${entry.direct.wetBulbC ?? "—"}°C | Globe: ${entry.direct.globeTempC ?? "—"}°C`, M, y);
    } else {
      const sunLabel = SUN_EXPOSURE_OPTIONS.find(o => o.value === entry.estimated.sunExposure)?.label || "";
      doc.text(`Input Mode: Estimated | Air Temp: ${entry.estimated.airTempC ?? "—"}°C | Humidity: ${entry.estimated.relativeHumidity ?? "—"}% | Wind: ${entry.estimated.windSpeedKmh ?? "—"} km/h | ${sunLabel}`, M, y);
    }
    y += 4;
    doc.text(`Activity Level: ${actLevel?.label || "—"} — ${actLevel?.constructionExamples || ""}`, M, y);
    y += 6;

    // WBGT result box
    if (wbgt !== null) {
      const riskColour = result.riskLevel === "green" ? [22, 163, 74]
        : result.riskLevel === "amber" ? [217, 119, 6] : [220, 38, 38];
      doc.setFillColor(riskColour[0], riskColour[1], riskColour[2]);
      doc.roundedRect(M, y - 2, 40, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${fmtNum(wbgt)}°C`, M + 4, y + 7);
      doc.setFontSize(7);
      doc.text("WBGT", M + 30, y + 3);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Risk Level: ${threshold.label}`, M + 46, y + 3);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(threshold.description, M + 46, y + 8);
      y += 18;

      // Work/rest ratio table
      checkPage(30);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Work/Rest Ratios (ISO 7243)", M, y);
      y += 4;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(M, y - 2, CW, 5, "F");
      doc.setFontSize(6.5);
      const rCols = [0, 45, 80, 115, 150];
      ["Work/Rest Ratio", "WBGT Limit (°C)", "Work (min)", "Rest (min)", "Status"].forEach((h, i) => {
        doc.text(h, M + rCols[i], y + 1);
      });
      y += 5;

      doc.setFont("helvetica", "normal");
      result.allRatios.forEach(ar => {
        if (ar.applicable) {
          doc.setFillColor(232, 240, 236);
          doc.rect(M, y - 2, CW, 4.5, "F");
        }
        doc.setFontSize(6.5);
        doc.text(ar.ratio.label, M + rCols[0], y + 0.5);
        doc.text(`${ar.wbgtLimit}°C`, M + rCols[1], y + 0.5);
        doc.text(`${ar.ratio.workMinutes}`, M + rCols[2], y + 0.5);
        doc.text(`${ar.ratio.restMinutes}`, M + rCols[3], y + 0.5);
        const status = wbgt <= ar.wbgtLimit ? "OK - Within limit" : "EXCEEDED";
        doc.text(`${ar.applicable ? "► " : ""}${status}`, M + rCols[4], y + 0.5);
        y += 4.5;
      });
      y += 4;

      // Recommended controls
      if (result.controls.length > 0) {
        checkPage(20);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Recommended Controls", M, y);
        y += 4;

        result.controls.forEach(ctrl => {
          checkPage(10);
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.text(`- ${ctrl.title}`, M + 2, y);
          doc.setFont("helvetica", "normal");
          y += 3;
          const lines = doc.splitTextToSize(ctrl.description, CW - 8);
          doc.text(lines, M + 4, y);
          y += lines.length * 3 + 1.5;
        });
        y += 4;
      }
    } else {
      doc.setFontSize(8);
      doc.text("Insufficient data to calculate WBGT.", M, y);
      y += 8;
    }

    // Separator between days
    if (dayIdx < daysToProcess.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(M, y, W - M, y);
      y += 6;
    }
  });

  // ── Sign-off section (bordered table)
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y);
  y += 6;

  // Bordered sign-off table
  const soW = CW / 2 - 2; // half width for 2 columns
  const soH = 8; // row height
  doc.setDrawColor(200, 200, 200);
  doc.setFontSize(7.5);

  // Headers
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD");
  doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5);
  doc.text("Site Manager / Reviewer", M + soW + 7, y + 5.5);
  y += soH;

  // Rows: Name, Position, Signature, Date
  doc.setFont("helvetica", "normal");
  ["Name:", "Position:", "Signature:", "Date:"].forEach(label => {
    doc.rect(M, y, soW, soH, "D");
    doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5);
    doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal");
    y += soH;
  });

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text("This assessment uses the Lemke & Kjellstrom (2012) WBGT estimation and ISO 7243 work/rest reference values. Planning tool only.", M, 287);
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 287);
  }

  doc.save(`wbgt-heat-stress-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function WBGTHeatStressClient() {
  const [outputMode, setOutputMode] = useState<OutputMode>("daily");
  const [days, setDays] = useState<DayEntry[]>([createEmptyDayEntry("Today")]);
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [windUnit, setWindUnit] = useState<"kmh" | "mph">("kmh");

  // Switch output mode
  const switchMode = useCallback((mode: OutputMode) => {
    setOutputMode(mode);
    if (mode === "weekly") {
      setDays(WEEKDAY_LABELS.map(l => createEmptyDayEntry(l)));
    } else {
      setDays([createEmptyDayEntry("Today")]);
    }
  }, []);

  // Update a specific day entry
  const updateDay = useCallback((index: number, patch: Partial<DayEntry>) => {
    setDays(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));
  }, []);

  // Compute results for each day
  const results = useMemo(() => {
    return days.map(entry => {
      const wbgt = entry.mode === "direct"
        ? calculateDirectWBGT(entry.direct)
        : calculateEstimatedWBGT(entry.estimated);
      return assessWBGT(wbgt, entry.activityLevel);
    });
  }, [days]);

  // Primary result (daily mode = first, weekly = worst)
  const primaryResult = useMemo(() => {
    const validResults = results.filter(r => r.wbgt !== null);
    if (validResults.length === 0) return results[0];
    const riskOrder: RiskLevel[] = ["green", "amber", "red"];
    return validResults.reduce((worst, r) => {
      return riskOrder.indexOf(r.riskLevel) > riskOrder.indexOf(worst.riskLevel) ? r : worst;
    }, validResults[0]);
  }, [results]);

  const hasData = primaryResult.wbgt !== null;

  const clearAll = useCallback(() => {
    setDays(outputMode === "weekly"
      ? WEEKDAY_LABELS.map(l => createEmptyDayEntry(l))
      : [createEmptyDayEntry("Today")]
    );
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, [outputMode]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, assessedBy, date: assessDate }, days, outputMode); }
    finally { setExporting(false); }
  }, [site, manager, assessedBy, assessDate, days, outputMode]);

  // Wind speed conversion helpers
  const toKmh = (v: number, unit: "kmh" | "mph") => unit === "mph" ? v * 1.60934 : v;
  const fromKmh = (v: number, unit: "kmh" | "mph") => unit === "mph" ? v / 1.60934 : v;

  // ─── Render Day Card ───────────────────────────────────────────
  function renderDayCard(entry: DayEntry, index: number) {
    const result = results[index];
    const threshold = getRiskThreshold(result.riskLevel);
    const riskStyle = RISK_CARD_STYLES[result.riskLevel];

    return (
      <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Day header (only show in weekly mode) */}
        {outputMode === "weekly" && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">{entry.label}</span>
            {result.wbgt !== null && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${riskStyle.bg} ${riskStyle.border} border ${riskStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${riskStyle.dot}`} />
                {fmtNum(result.wbgt)}°C — {threshold.label}
              </span>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Input mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => updateDay(index, { mode: "direct" })}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                entry.mode === "direct"
                  ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Mode A: Direct WBGT
            </button>
            <button
              onClick={() => updateDay(index, { mode: "estimated" })}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                entry.mode === "estimated"
                  ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Mode B: Estimated WBGT
            </button>
          </div>

          {/* Inputs */}
          {entry.mode === "direct" ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Dry Bulb (°C)", key: "dryBulbC" as const },
                { label: "Wet Bulb (°C)", key: "wetBulbC" as const },
                { label: "Globe Temp (°C)", key: "globeTempC" as const },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input
                    type="number" step="0.1"
                    value={entry.direct[f.key] ?? ""}
                    placeholder="0.0"
                    onChange={e => updateDay(index, {
                      direct: { ...entry.direct, [f.key]: e.target.value === "" ? null : parseFloat(e.target.value) }
                    })}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none tabular-nums"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Air Temp (°C)</label>
                <input
                  type="number" step="0.5"
                  value={entry.estimated.airTempC ?? ""}
                  placeholder="25"
                  onChange={e => updateDay(index, {
                    estimated: { ...entry.estimated, airTempC: e.target.value === "" ? null : parseFloat(e.target.value) }
                  })}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Humidity (%)</label>
                <input
                  type="number" step="1" min={0} max={100}
                  value={entry.estimated.relativeHumidity ?? ""}
                  placeholder="50"
                  onChange={e => updateDay(index, {
                    estimated: { ...entry.estimated, relativeHumidity: e.target.value === "" ? null : parseFloat(e.target.value) }
                  })}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Wind Speed
                  <button onClick={() => setWindUnit(u => u === "kmh" ? "mph" : "kmh")}
                    className="ml-1.5 text-[9px] font-medium text-ebrora hover:text-ebrora-dark">
                    ({windUnit === "kmh" ? "km/h" : "mph"})
                  </button>
                </label>
                <input
                  type="number" step="1" min={0}
                  value={entry.estimated.windSpeedKmh !== null ? Math.round(fromKmh(entry.estimated.windSpeedKmh, windUnit)) : ""}
                  placeholder="10"
                  onChange={e => {
                    const raw = e.target.value === "" ? null : parseFloat(e.target.value);
                    updateDay(index, {
                      estimated: { ...entry.estimated, windSpeedKmh: raw !== null ? toKmh(raw, windUnit) : null }
                    });
                  }}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sun Exposure</label>
                <select
                  value={entry.estimated.sunExposure}
                  onChange={e => updateDay(index, {
                    estimated: { ...entry.estimated, sunExposure: e.target.value as SunExposure }
                  })}
                  className={`w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors ${
                    entry.estimated.sunExposure
                      ? "border-ebrora/30 bg-ebrora-light/40 text-gray-800"
                      : "border-gray-200 bg-blue-50/40 text-gray-500"
                  }`}
                >
                  {SUN_EXPOSURE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Activity level */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Activity Level</label>
            <select
              value={entry.activityLevel}
              onChange={e => updateDay(index, { activityLevel: e.target.value })}
              className={`w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors ${
                entry.activityLevel
                  ? "border-ebrora/30 bg-ebrora-light/40 text-gray-800"
                  : "border-gray-200 bg-blue-50/40 text-gray-500"
              }`}
            >
              {ACTIVITY_LEVELS.map(al => (
                <option key={al.id} value={al.id}>
                  {al.label} ({al.isoLabel}) — {al.constructionExamples}
                </option>
              ))}
            </select>
          </div>

          {/* Met Office hint */}
          {entry.mode === "estimated" && (
            <p className="text-[11px] text-gray-400">
              💡 Check{" "}
              <a href="https://www.metoffice.gov.uk/weather/forecast/" target="_blank" rel="noopener noreferrer" className="text-ebrora hover:text-ebrora-dark underline">
                Met Office
              </a>{" "}
              for today&apos;s air temperature, humidity and wind speed.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Summary Dashboard ─────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(() => {
            const threshold = getRiskThreshold(primaryResult.riskLevel);
            const style = RISK_CARD_STYLES[primaryResult.riskLevel];
            return [
              { label: "WBGT Value", value: `${fmtNum(primaryResult.wbgt)}°C`, sub: outputMode === "weekly" ? "Worst day" : "Current", ...style },
              { label: "Risk Level", value: threshold.label, sub: threshold.description.slice(0, 50), ...style },
              { label: "Work : Rest", value: primaryResult.applicableRatio, sub: `${primaryResult.maxContinuousMinutes} min max continuous`, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
              { label: "Controls Required", value: String(primaryResult.controls.length), sub: primaryResult.riskLevel === "green" ? "Standard precautions" : "See below", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" },
            ];
          })().map(c => (
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

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Output mode toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => switchMode("daily")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${outputMode === "daily" ? "bg-ebrora text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            Daily
          </button>
          <button onClick={() => switchMode("weekly")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${outputMode === "weekly" ? "bg-ebrora text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            Weekly (5-day)
          </button>
        </div>

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

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label>
            <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Assessed By</label>
            <input type="text" value={assessedBy} onChange={e => setAssessedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Day Input Cards ────────────────────────────────── */}
      <div className={outputMode === "weekly" ? "space-y-3" : ""}>
        {days.map((entry, i) => renderDayCard(entry, i))}
      </div>

      {/* ── Work/Rest Ratio Table (always visible when data) ─ */}
      {hasData && outputMode === "daily" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">ISO 7243 Work/Rest Ratio Reference</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">WBGT reference values (°C) for acclimatised workers. Highlighted row = your applicable ratio.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">Work/Rest Ratio</th>
                  {ACTIVITY_LEVELS.map(al => (
                    <th key={al.id} className={`px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide ${al.id === days[0].activityLevel ? "text-ebrora-dark bg-ebrora-light/30" : "text-gray-500"}`}>
                      {al.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results[0].allRatios.map((ar, i) => {
                  const wbgt = results[0].wbgt!;
                  const isApplicable = ar.applicable;
                  return (
                    <tr key={i} className={isApplicable ? "bg-ebrora-light/20" : ""}>
                      <td className={`px-4 py-2 font-medium ${isApplicable ? "text-ebrora-dark" : "text-gray-700"}`}>
                        {isApplicable && <span className="mr-1.5">►</span>}
                        {ar.ratio.label}
                        <span className="text-gray-400 text-xs ml-1.5">({ar.ratio.workMinutes}/{ar.ratio.restMinutes} min)</span>
                      </td>
                      {ACTIVITY_LEVELS.map(al => {
                        const limit = ar.ratio.limits[al.id];
                        const isCurrentActivity = al.id === days[0].activityLevel;
                        const withinLimit = wbgt <= limit;
                        return (
                          <td key={al.id} className={`px-3 py-2 text-center tabular-nums ${
                            isCurrentActivity
                              ? withinLimit ? "font-bold text-emerald-700" : "font-bold text-red-600"
                              : "text-gray-500"
                          }`}>
                            {limit}°C
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        {wbgt <= ar.ratio.limits[days[0].activityLevel]
                          ? <span className="text-emerald-600 text-xs font-medium">✓ OK</span>
                          : <span className="text-red-500 text-xs font-medium">✗ Exceeded</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recommended Controls ───────────────────────────── */}
      {hasData && primaryResult.controls.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Recommended Controls — Heat Stress Action Plan</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {primaryResult.controls.length} controls applicable at {getRiskThreshold(primaryResult.riskLevel).label} risk level.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {primaryResult.controls.map(ctrl => (
              <div key={ctrl.id} className="px-4 py-3 flex gap-3">
                <span className={`mt-0.5 inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                  ctrl.category === "engineering" ? "bg-blue-50 text-blue-700" :
                  ctrl.category === "administrative" ? "bg-purple-50 text-purple-700" :
                  ctrl.category === "ppe" ? "bg-orange-50 text-orange-700" :
                  "bg-emerald-50 text-emerald-700"
                }`}>
                  {CATEGORY_LABELS[ctrl.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{ctrl.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{ctrl.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Red Risk Warning Banner ────────────────────────── */}
      {hasData && primaryResult.riskLevel === "red" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-sm font-bold text-red-800">HIGH RISK — Consider Stopping Work</div>
            <div className="text-xs text-red-700 mt-1">
              The WBGT index exceeds all standard ISO 7243 work/rest limits for the selected activity level.
              Outdoor work should not continue without emergency controls. Document any decision to continue
              with a specific risk assessment and implement all red-level controls listed above.
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on ISO 7243:2017 and HSE guidance on thermal comfort. Mode B uses the Lemke &amp; Kjellstrom (2012)
          simplified outdoor WBGT approximation. For definitive assessments, use calibrated WBGT monitoring equipment.
          Work/rest ratios assume acclimatised workers. This tool is a planning aid — it does not replace a site-specific risk assessment.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools →
        </a>
      </div>
    </div>
  );
}
