// src/components/fatigue-risk-calculator/FatigueRiskCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PRESET_PATTERNS, FATIGUE_LEVELS, WEEKDAYS,
  calculateFatigue, createBlankWeek, createBlankRotation, applyPreset,
  getFatigueLevelDef, getFatigueLevel, dayLabel as makeDayLabel,
} from "@/data/fatigue-risk-calculator";
import type { ShiftEntry, PatternMode, FatigueResult, FatigueLevel } from "@/data/fatigue-risk-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function makeId() { return Math.random().toString(36).slice(2, 8); }

// ─── SVG Fatigue Index Line Chart ────────────────────────────
function FatigueLineChart({ result }: { result: FatigueResult }) {
  const data = result.shifts;
  if (data.length < 2) return null;
  const W = 700, H = 200, PAD = { top: 20, right: 20, bottom: 35, left: 45 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const xS = (i: number) => PAD.left + (i / (data.length - 1)) * cw;
  const yS = (v: number) => PAD.top + ch - (v / 100) * ch;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(d.fatigueIndex).toFixed(1)}`).join(" ");

  // Threshold lines
  const thresholds = [{ y: 35, label: "Acceptable", c: "#22C55E" }, { y: 55, label: "Elevated", c: "#EAB308" }, { y: 75, label: "High", c: "#F97316" }];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
      {/* Band shading */}
      <rect x={PAD.left} y={yS(35)} width={cw} height={yS(0) - yS(35)} fill="rgba(34,197,94,0.06)" />
      <rect x={PAD.left} y={yS(55)} width={cw} height={yS(35) - yS(55)} fill="rgba(234,179,8,0.06)" />
      <rect x={PAD.left} y={yS(75)} width={cw} height={yS(55) - yS(75)} fill="rgba(249,115,22,0.06)" />
      <rect x={PAD.left} y={yS(100)} width={cw} height={yS(75) - yS(100)} fill="rgba(239,68,68,0.06)" />
      {thresholds.map(t => (
        <g key={t.y}>
          <line x1={PAD.left} y1={yS(t.y)} x2={W - PAD.right} y2={yS(t.y)} stroke={t.c} strokeWidth={0.8} strokeDasharray="4,3" />
          <text x={W - PAD.right - 2} y={yS(t.y) - 3} textAnchor="end" fontSize={8} fill={t.c}>{t.label}</text>
        </g>
      ))}
      {/* Grid */}
      {[0, 20, 40, 60, 80, 100].map(v => (
        <text key={v} x={PAD.left - 6} y={yS(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}</text>
      ))}
      {/* Line */}
      <path d={line} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Points */}
      {data.map((d, i) => {
        const def = getFatigueLevelDef(d.level);
        return <circle key={i} cx={xS(i)} cy={yS(d.fatigueIndex)} r={d.shiftLength > 0 ? 4 : 2} fill={def.colour} stroke="white" strokeWidth={1.5} />;
      })}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={xS(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#6B7280">{d.dayLabel.slice(0, 3)}</text>
      ))}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={10} fontWeight={600} fill="#6B7280">Fatigue Index</text>
    </svg>
  );
}

// ─── SVG Sleep Debt Chart ────────────────────────────────────
function SleepDebtChart({ result }: { result: FatigueResult }) {
  const data = result.shifts;
  if (data.length < 2) return null;
  const W = 700, H = 170, PAD = { top: 20, right: 20, bottom: 35, left: 45 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const maxDebt = Math.max(15, ...data.map(d => d.sleepDebt));
  const xS = (i: number) => PAD.left + (i / (data.length - 1)) * cw;
  const yS = (v: number) => PAD.top + ch - (v / maxDebt) * ch;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(d.sleepDebt).toFixed(1)}`).join(" ");
  const area = line + ` L${xS(data.length - 1).toFixed(1)},${yS(0).toFixed(1)} L${xS(0).toFixed(1)},${yS(0).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 200 }}>
      <path d={area} fill="rgba(239,68,68,0.1)" />
      <path d={line} fill="none" stroke="#EF4444" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xS(i)} cy={yS(d.sleepDebt)} r={3} fill="#EF4444" />
          <text x={xS(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#6B7280">{d.dayLabel.slice(0, 3)}</text>
        </g>
      ))}
      {[0, 5, 10, 15].filter(v => v <= maxDebt).map(v => (
        <text key={v} x={PAD.left - 6} y={yS(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}h</text>
      ))}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={10} fontWeight={600} fill="#6B7280">Cumulative Sleep Debt (hours)</text>
    </svg>
  );
}

// ─── SVG Risk Multiplier Bars ────────────────────────────────
function RiskBarsChart({ result }: { result: FatigueResult }) {
  const data = result.shifts.filter(s => s.shiftLength > 0);
  if (data.length < 1) return null;
  const W = 700, H = 160, PAD = { top: 20, right: 20, bottom: 35, left: 45 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const maxMult = Math.max(3, ...data.map(d => d.riskMultiplier));
  const barW = Math.min(40, (cw / data.length) * 0.7);
  const gap = (cw - barW * data.length) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 200 }}>
      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + ch - (1 / maxMult) * ch} x2={W - PAD.right} y2={PAD.top + ch - (1 / maxMult) * ch} stroke="#9CA3AF" strokeWidth={0.5} strokeDasharray="4,3" />
      <text x={PAD.left - 6} y={PAD.top + ch - (1 / maxMult) * ch + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">1.0x</text>
      {data.map((d, i) => {
        const x = PAD.left + gap + i * (barW + gap);
        const barH = (d.riskMultiplier / maxMult) * ch;
        const y = PAD.top + ch - barH;
        const def = getFatigueLevelDef(d.level);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={def.colour} rx={2} opacity={0.8} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={600} fill={def.colour}>{d.riskMultiplier}x</text>
            <text x={x + barW / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#6B7280">{d.dayLabel.slice(0, 3)}</text>
          </g>
        );
      })}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={10} fontWeight={600} fill="#6B7280">Relative Risk Multiplier (vs baseline day shift)</text>
    </svg>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  result: FatigueResult, commuteMinutes: number, mode: PatternMode,
  shiftEntries: ShiftEntry[],
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("l", "mm", "a4"); // Landscape for the wide tables
  const W = 297, H = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `FRC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Header bar (FREE = green)
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("FATIGUE RISK ASSESSMENT (SHIFT PATTERNS)", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("HSE RR446 / Working Time Regulations 1998 / HSE GEIS1 -- ebrora.com/tools/fatigue-risk-calculator", M, 16);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 16);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 15, 1, 1, "FD"); doc.setFontSize(8);
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  const q = CW / 4;
  drawFld("Site:", header.site, M + 3, y, 40);
  drawFld("Site Manager:", header.manager, M + q, y, 30);
  drawFld("Assessed By:", header.assessedBy, M + q * 2, y, 30);
  drawFld("Date:", header.date, M + q * 3, y, 20);
  y += 5;
  drawFld("Pattern:", `${mode === "weekly" ? "Weekly" : "Rotation"} (${result.shifts.length} days)`, M + 3, y, 0);
  drawFld("Commute:", `${commuteMinutes} min each way`, M + q, y, 0);
  drawFld("Total Hours:", `${result.totalWorkingHours}h`, M + q * 2, y, 0);
  drawFld("WTR:", result.wtrCompliant ? "COMPLIANT" : "NON-COMPLIANT", M + q * 3, y, 0);
  y += 10;

  function checkPage(need: number) {
    if (y + need > 198) {
      doc.addPage("l");
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 8, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text("FATIGUE RISK ASSESSMENT (continued)", M, 5.5);
      doc.text(`${docRef}`, W - M - 40, 5.5);
      doc.setTextColor(0, 0, 0); y = 12;
    }
  }

  // Risk banner
  const worstDef = result.worstShift ? getFatigueLevelDef(result.worstShift.level) : getFatigueLevelDef("acceptable");
  const rgb = worstDef.colour;
  const r = parseInt(rgb.slice(1, 3), 16), g = parseInt(rgb.slice(3, 5), 16), b = parseInt(rgb.slice(5, 7), 16);
  doc.setFillColor(r, g, b);
  doc.roundedRect(M, y, CW, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(`PEAK FATIGUE: ${result.maxFatigue}/100 -- ${worstDef.label.toUpperCase()} (${result.worstShift?.dayLabel || "N/A"})`, M + 5, y + 5);
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  doc.text(`Avg: ${result.averageFatigue}/100 | Peak sleep debt: ${result.peakSleepDebt}h | Working hours: ${result.totalWorkingHours}h`, M + 5, y + 9.5);
  doc.setTextColor(0, 0, 0); y += 17;

  // Shift table
  checkPage(10);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Shift-by-Shift Analysis", M, y); y += 4;

  const cols = [22, 18, 18, 14, 16, 16, 18, 22, 22, 18, 18, 22, 22, 22];
  const hdrs = ["Day", "Start", "End", "Break", "Length", "Night?", "Consec.", "Rest Before", "Quick Ret?", "Sleep Opp", "Sleep Debt", "Fatigue Idx", "Risk Mult.", "Level"];
  let cx = M;
  hdrs.forEach((h2, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 5, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5);
    doc.text(h2, cx + 1, y + 3.5);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 5;

  result.shifts.forEach((s, idx) => {
    checkPage(5);
    const shift = result.shifts[idx];
    // Find original shift entry for times
    const entry = shiftEntries[idx];
    const isRest = s.shiftLength === 0;
    cx = M;
    const rowData = [
      s.dayLabel.slice(0, 6),
      isRest ? "--" : (entry?.startTime || "--"),
      isRest ? "--" : (entry?.endTime || "--"),
      isRest ? "--" : `${entry?.breakMinutes || 0}m`,
      isRest ? "REST" : `${s.shiftLength}h`,
      isRest ? "--" : (s.isNight ? "YES" : "No"),
      isRest ? "--" : String(s.consecutiveDays),
      isRest ? "--" : `${s.restBeforeHours}h`,
      isRest ? "--" : (s.quickReturn ? "YES" : "No"),
      isRest ? "8.0h" : `${s.sleepOpportunity}h`,
      `${s.sleepDebt}h`,
      String(s.fatigueIndex),
      isRest ? "1.0x" : `${s.riskMultiplier}x`,
      getFatigueLevelDef(s.level).label,
    ];
    const levelDef = getFatigueLevelDef(s.level);
    const levelRGB = levelDef.colour;
    const lr = parseInt(levelRGB.slice(1, 3), 16), lg = parseInt(levelRGB.slice(3, 5), 16), lb = parseInt(levelRGB.slice(5, 7), 16);
    rowData.forEach((t, i) => {
      if (isRest) { doc.setFillColor(240, 240, 255); doc.rect(cx, y, cols[i], 4.5, "FD"); }
      else if (i === 13) { doc.setFillColor(lr, lg, lb); doc.rect(cx, y, cols[i], 4.5, "F"); doc.setTextColor(255, 255, 255); }
      else if (i === 11 && s.fatigueIndex > 35) { doc.setFillColor(lr, lg, lb, 0.15); doc.rect(cx, y, cols[i], 4.5, "FD"); doc.setTextColor(0, 0, 0); }
      else if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 4.5, "FD"); doc.setTextColor(0, 0, 0); }
      else { doc.rect(cx, y, cols[i], 4.5, "D"); doc.setTextColor(0, 0, 0); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(5);
      doc.text(t, cx + 1, y + 3.2);
      doc.setTextColor(0, 0, 0);
      cx += cols[i];
    });
    y += 4.5;
  });
  y += 5;

  // WTR Compliance
  checkPage(20);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Working Time Regulations Compliance", M, y); y += 4;
  result.wtrChecks.forEach(check => {
    checkPage(5);
    doc.setFontSize(6);
    if (check.compliant) { doc.setFillColor(220, 252, 231); doc.setTextColor(22, 101, 52); }
    else { doc.setFillColor(254, 226, 226); doc.setTextColor(153, 27, 27); }
    doc.roundedRect(M + 2, y - 2.5, CW - 4, 4.5, 0.5, 0.5, "F");
    doc.setFont("helvetica", "bold");
    const status = check.compliant ? "[PASS]" : "[FAIL]";
    doc.text(`${status} ${check.rule}: `, M + 4, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${check.actual} (Req: ${check.requirement}) -- ${check.reference}`, M + 57, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  });
  y += 4;

  // Recommendations
  checkPage(15);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 4;
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(5);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3;
  });

  // Fatigue Index Chart
  checkPage(65);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Fatigue Index Across Pattern", M, y);
  doc.setFontSize(5.5); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Chart shows estimated fatigue index (0-100) for each day. Shaded bands: green = acceptable (0-35), amber = elevated (36-55), orange = high (56-75), red = very high (76+).", M, y + 3.5);
  doc.setTextColor(0, 0, 0); y += 7;

  {
    const chartX = M + 12, chartY4 = y, chartW4 = CW - 30, chartH4 = 40;
    const shifts2 = result.shifts;
    const xStep = shifts2.length > 1 ? chartW4 / (shifts2.length - 1) : chartW4;

    // Band backgrounds
    const fatBands = [
      { min: 0, max: 35, r: 220, g: 252, b: 231 },
      { min: 35, max: 55, r: 254, g: 249, b: 195 },
      { min: 55, max: 75, r: 255, g: 237, b: 213 },
      { min: 75, max: 100, r: 254, g: 226, b: 226 },
    ];
    fatBands.forEach(band2 => {
      const top = chartY4 + chartH4 - (band2.max / 100) * chartH4;
      const bot = chartY4 + chartH4 - (band2.min / 100) * chartH4;
      doc.setFillColor(band2.r, band2.g, band2.b);
      doc.rect(chartX, top, chartW4, bot - top, "F");
    });

    // Grid
    doc.setDrawColor(200, 200, 200); doc.setFontSize(4.5); doc.setTextColor(130, 130, 130);
    [0, 25, 50, 75, 100].forEach(v => {
      const yp = chartY4 + chartH4 - (v / 100) * chartH4;
      doc.line(chartX, yp, chartX + chartW4, yp);
      doc.text(String(v), chartX - 6, yp + 1.5);
    });

    // Threshold lines
    doc.setDrawColor(234, 179, 8); doc.setLineWidth(0.3);
    const threshY = chartY4 + chartH4 - (35 / 100) * chartH4;
    doc.line(chartX, threshY, chartX + chartW4, threshY);

    // Fatigue line
    doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.6);
    for (let i = 1; i < shifts2.length; i++) {
      const x1 = chartX + (i - 1) * xStep;
      const y1 = chartY4 + chartH4 - (shifts2[i - 1].fatigueIndex / 100) * chartH4;
      const x2 = chartX + i * xStep;
      const y2v = chartY4 + chartH4 - (shifts2[i].fatigueIndex / 100) * chartH4;
      doc.line(x1, y1, x2, y2v);
    }

    // Data dots with level colour
    shifts2.forEach((s2, i) => {
      const px = chartX + i * xStep;
      const py = chartY4 + chartH4 - (s2.fatigueIndex / 100) * chartH4;
      const lDef = getFatigueLevelDef(s2.level);
      const cr = parseInt(lDef.colour.slice(1, 3), 16);
      const cg = parseInt(lDef.colour.slice(3, 5), 16);
      const cb = parseInt(lDef.colour.slice(5, 7), 16);
      doc.setFillColor(cr, cg, cb); doc.circle(px, py, 1, "F");
    });

    // X labels
    doc.setTextColor(80, 80, 80); doc.setFontSize(4.5);
    shifts2.forEach((s2, i) => {
      doc.text(s2.dayLabel.slice(0, 3), chartX + i * xStep - 3, chartY4 + chartH4 + 3.5);
    });

    doc.setFontSize(5); doc.setTextColor(80, 80, 80);
    doc.text("Fatigue Index", chartX - 10, chartY4 - 2);
    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = chartY4 + chartH4 + 8;
  }

  // Sign-off
  checkPage(45); y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 5;
  const soW = Math.min(CW / 2 - 2, 85), soH = 7;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 4.5); doc.text("Site Manager", M + soW + 7, y + 4.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 4.5); doc.text(label, M + soW + 7, y + 4.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5); doc.setTextColor(130, 130, 130);
    doc.text("Fatigue risk assessment per HSE Research Report RR446 and Working Time Regulations 1998. This is a screening tool -- actual fatigue varies with individual factors.", M, 205);
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 205);
  }

  doc.save(`fatigue-risk-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function FatigueRiskCalculatorClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [mode, setMode] = useState<PatternMode>("weekly");
  const [shifts, setShifts] = useState<ShiftEntry[]>(createBlankWeek);
  const [commuteMinutes, setCommuteMinutes] = useState<number>(30);
  const [rotationDays, setRotationDays] = useState<number>(8);

  const result = useMemo(() => calculateFatigue(shifts, commuteMinutes, mode), [shifts, commuteMinutes, mode]);
  const worstDef = result.worstShift ? getFatigueLevelDef(result.worstShift.level) : getFatigueLevelDef("acceptable");
  const hasData = result.shifts.some(s => s.shiftLength > 0);

  const updateShift = useCallback((idx: number, field: keyof ShiftEntry, value: string | number | boolean) => {
    setShifts(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESET_PATTERNS.find(p => p.id === presetId);
    if (!preset) return;
    setMode(preset.mode);
    setShifts(applyPreset(preset));
  }, []);

  const switchMode = useCallback((newMode: PatternMode) => {
    setMode(newMode);
    if (newMode === "weekly") setShifts(createBlankWeek());
    else setShifts(createBlankRotation(rotationDays));
  }, [rotationDays]);

  const addDay = useCallback(() => {
    if (shifts.length >= 28) return;
    const newDay: ShiftEntry = { id: makeId(), dayLabel: `Day ${shifts.length + 1}`, dayIndex: shifts.length, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false };
    setShifts(prev => [...prev, newDay]);
  }, [shifts.length]);

  const removeDay = useCallback(() => {
    if (shifts.length <= 1) return;
    setShifts(prev => prev.slice(0, -1));
  }, [shifts.length]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, assessedBy, date: assessDate }, result, commuteMinutes, mode, shifts); }
    finally { setExporting(false); }
  }, [site, manager, assessedBy, assessDate, result, commuteMinutes, mode]);

  const clearAll = useCallback(() => {
    setShifts(createBlankWeek()); setMode("weekly"); setCommuteMinutes(30);
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ──────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Peak Fatigue", value: `${result.maxFatigue}/100`, sub: result.worstShift ? `${result.worstShift.dayLabel}` : "--", ...worstDef },
            { label: "Avg Fatigue", value: `${result.averageFatigue}/100`, sub: `${result.totalWorkingHours}h total`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
            { label: "Peak Sleep Debt", value: `${result.peakSleepDebt}h`, sub: result.peakSleepDebt > 10 ? "Consider adding rest day" : "Within manageable range", bgClass: result.peakSleepDebt > 10 ? "bg-red-50" : "bg-purple-50", textClass: result.peakSleepDebt > 10 ? "text-red-800" : "text-purple-800", borderClass: result.peakSleepDebt > 10 ? "border-red-200" : "border-purple-200", dotClass: result.peakSleepDebt > 10 ? "bg-red-500" : "bg-purple-500" },
            { label: "WTR Compliance", value: result.wtrCompliant ? "PASS" : "FAIL", sub: `${result.wtrChecks.filter(c => c.compliant).length}/${result.wtrChecks.length} checks passed`, bgClass: result.wtrCompliant ? "bg-emerald-50" : "bg-red-50", textClass: result.wtrCompliant ? "text-emerald-800" : "text-red-800", borderClass: result.wtrCompliant ? "border-emerald-200" : "border-red-200", dotClass: result.wtrCompliant ? "bg-emerald-500" : "bg-red-500" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span>
              </div>
              <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────── */}
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
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ l: "Site Name", v: site, s: setSite, p: "Site name" }, { l: "Site Manager", v: manager, s: setManager, p: "Manager" }, { l: "Assessed By", v: assessedBy, s: setAssessedBy, p: "Your name" }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.p} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* ── Mode + Presets + Commute ────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button onClick={() => switchMode("weekly")} className={`px-3 py-1.5 text-xs font-bold ${mode === "weekly" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-600"}`}>Weekly (Mon-Sun)</button>
            <button onClick={() => switchMode("rotation")} className={`px-3 py-1.5 text-xs font-bold ${mode === "rotation" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-600"}`}>Rotation (custom days)</button>
          </div>
          <select onChange={e => loadPreset(e.target.value)} value="" className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none">
            <option value="">Load preset pattern...</option>
            {PRESET_PATTERNS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Commute</label>
            <input type="number" value={commuteMinutes} onChange={e => setCommuteMinutes(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={120} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />
            <span className="text-[10px] text-gray-400">min each way</span>
          </div>
        </div>

        {/* Shift Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Day", "Start", "End", "Break (min)", "Rest Day?"].map(h => (
                  <th key={h} className="px-2 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.map((s, i) => (
                <tr key={s.id} className={s.isRestDay ? "bg-blue-50/30" : ""}>
                  <td className="px-2 py-1 text-xs font-medium text-gray-700">{s.dayLabel}</td>
                  <td className="px-2 py-1">
                    <input type="time" value={s.startTime} onChange={e => updateShift(i, "startTime", e.target.value)} disabled={s.isRestDay}
                      className="px-1.5 py-1 text-xs border border-gray-200 rounded bg-white focus:border-ebrora outline-none disabled:opacity-40" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="time" value={s.endTime} onChange={e => updateShift(i, "endTime", e.target.value)} disabled={s.isRestDay}
                      className="px-1.5 py-1 text-xs border border-gray-200 rounded bg-white focus:border-ebrora outline-none disabled:opacity-40" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={s.breakMinutes} onChange={e => updateShift(i, "breakMinutes", parseInt(e.target.value) || 0)} min={0} max={120} disabled={s.isRestDay}
                      className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded bg-white focus:border-ebrora outline-none disabled:opacity-40" />
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => updateShift(i, "isRestDay", !s.isRestDay)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${s.isRestDay ? "bg-blue-500" : "bg-gray-300"}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${s.isRestDay ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mode === "rotation" && (
          <div className="flex gap-2">
            <button onClick={addDay} disabled={shifts.length >= 28} className="px-3 py-1.5 text-xs font-medium text-ebrora border border-dashed border-ebrora/40 rounded-lg hover:bg-ebrora-light/20 disabled:opacity-40">+ Add Day</button>
            <button onClick={removeDay} disabled={shifts.length <= 1} className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">- Remove Day</button>
          </div>
        )}
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      {hasData && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Fatigue Index Across Pattern</h3>
            <p className="text-[11px] text-gray-400">Coloured thresholds: green = acceptable, yellow = elevated, orange = high, red = very high.</p>
            <FatigueLineChart result={result} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Cumulative Sleep Debt</h3>
            <p className="text-[11px] text-gray-400">Running deficit of sleep hours below the 7.5h target. Recovers on rest days.</p>
            <SleepDebtChart result={result} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Relative Risk Multiplier (vs Baseline Day Shift)</h3>
            <p className="text-[11px] text-gray-400">How many times more likely an incident is compared to a standard 8h day shift. 1.0x = baseline.</p>
            <RiskBarsChart result={result} />
          </div>
        </>
      )}

      {/* ── WTR Compliance ──────────────────────────────────── */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Working Time Regulations Compliance</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {result.wtrChecks.map((check, i) => (
              <div key={i} className={`px-4 py-2.5 flex items-start gap-3 ${check.compliant ? "" : "bg-red-50/50"}`}>
                <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${check.compliant ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {check.compliant ? "P" : "F"}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-800">{check.rule}</div>
                  <div className="text-[11px] text-gray-500">{check.requirement} ({check.reference})</div>
                  <div className={`text-[11px] font-medium ${check.compliant ? "text-emerald-700" : "text-red-700"}`}>{check.actual}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendations ─────────────────────────────────── */}
      {hasData && result.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Recommendations</h3>
          </div>
          <div className="px-4 py-3 space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Level Key ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FATIGUE_LEVELS.map(l => (
          <div key={l.level} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${l.bgClass} ${l.textClass} border ${l.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${l.dotClass}`} />{l.label} ({l.min}-{l.max})
          </div>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on HSE Research Report RR446 and the Health and Safety Laboratory Fatigue and Risk Index tool.
          Working Time Regulations checks per WTR 1998 (as amended). This is a screening tool - actual fatigue
          varies with individual factors including fitness, sleep quality, and workload intensity.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">Browse all Ebrora tools</a>
      </div>
    </div>
  );
}
