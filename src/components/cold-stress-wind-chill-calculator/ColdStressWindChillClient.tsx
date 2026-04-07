// src/components/cold-stress-wind-chill-calculator/ColdStressWindChillClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateWindChill, generateMatrix, generateWindCurve,
  getRiskBand, getRiskCategory, windChillIndex,
  MATRIX_TEMPS, MATRIX_WINDS, RISK_BANDS,
  fmtTemp, fmtDuration, msToKmh, kmhToMs,
} from "@/data/cold-stress-wind-chill-calculator";
import type { WindUnit, RiskCategory, WindChillResult } from "@/data/cold-stress-wind-chill-calculator";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Heatmap Matrix ──────────────────────────────────────
function WindChillHeatmap({ userTemp, userWind }: { userTemp: number; userWind: number }) {
  const matrix = generateMatrix(MATRIX_TEMPS, MATRIX_WINDS);
  const cellW = 52, cellH = 26, padL = 55, padT = 32, padR = 10, padB = 10;
  const cols = MATRIX_TEMPS.length;
  const rows = MATRIX_WINDS.length;
  const W = padL + cols * cellW + padR;
  const H = padT + rows * cellH + padB;

  // Find closest cell to user input
  const closestTemp = MATRIX_TEMPS.reduce((a, b) => Math.abs(b - userTemp) < Math.abs(a - userTemp) ? b : a);
  const closestWind = MATRIX_WINDS.reduce((a, b) => Math.abs(b - userWind) < Math.abs(a - userWind) ? b : a);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 360 }}>
      {/* Column headers (temps) */}
      {MATRIX_TEMPS.map((t, ci) => (
        <text key={`th-${t}`} x={padL + ci * cellW + cellW / 2} y={padT - 8} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B7280">
          {t > 0 ? `+${t}` : t}C
        </text>
      ))}
      {/* Row headers (winds) */}
      {MATRIX_WINDS.map((w, ri) => (
        <text key={`wh-${w}`} x={padL - 6} y={padT + ri * cellH + cellH / 2 + 3} textAnchor="end" fontSize={9} fill="#6B7280">
          {w} km/h
        </text>
      ))}
      {/* Axis labels */}
      <text x={padL + (cols * cellW) / 2} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="#374151">Air Temperature (C)</text>
      <text x={10} y={padT + (rows * cellH) / 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="#374151" transform={`rotate(-90, 10, ${padT + (rows * cellH) / 2})`}>Wind Speed</text>
      {/* Cells */}
      {matrix.map((row, ri) =>
        row.map((cell, ci) => {
          const x = padL + ci * cellW;
          const y2 = padT + ri * cellH;
          const band = getRiskBand(cell.risk);
          const isUser = cell.temp === closestTemp && cell.wind === closestWind;
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y2} width={cellW} height={cellH} fill={band.matrixFill} stroke={isUser ? "#1B5745" : "#E5E7EB"} strokeWidth={isUser ? 2.5 : 0.5} rx={isUser ? 3 : 0} />
              <text x={x + cellW / 2} y={y2 + cellH / 2 + 3} textAnchor="middle" fontSize={9} fontWeight={isUser ? 700 : 400} fill={isUser ? "#1B5745" : "#374151"}>
                {cell.wci.toFixed(0)}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

// ─── SVG Frostbite Gauge ─────────────────────────────────────
function FrostbiteGauge({ wci }: { wci: number }) {
  const W = 300, H = 170;
  const cx = W / 2, cy = 130, r = 100;
  // Gauge from -60 to 10, mapped to 180deg arc (left to right)
  const minVal = -60, maxVal = 10;
  const clampWCI = Math.max(minVal, Math.min(maxVal, wci));
  const ratio = (clampWCI - minVal) / (maxVal - minVal);
  const angle = Math.PI - ratio * Math.PI; // 180 (left) to 0 (right)

  // Gauge segments
  const segments = [
    { start: 0, end: 0.143, fill: "#7C3AED", label: "<2m" },   // extreme -60 to -50
    { start: 0.143, end: 0.286, fill: "#EF4444", label: "5m" }, // very-high -50 to -40
    { start: 0.286, end: 0.471, fill: "#F97316", label: "10m" }, // high -40 to -27
    { start: 0.471, end: 0.614, fill: "#EAB308", label: "30m" }, // moderate -27 to -17
    { start: 0.614, end: 0.857, fill: "#3B82F6", label: "" },    // low
    { start: 0.857, end: 1, fill: "#22C55E", label: "" },        // minimal
  ];

  const arcPath = (startRatio: number, endRatio: number) => {
    const a1 = Math.PI - startRatio * Math.PI;
    const a2 = Math.PI - endRatio * Math.PI;
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2);
    const largeArc = (startRatio - endRatio) > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle
  const needleLen = r - 15;
  const nx = cx + needleLen * Math.cos(angle);
  const ny = cy - needleLen * Math.sin(angle);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 200 }}>
      {/* Gauge arcs */}
      {segments.map((s, i) => (
        <path key={i} d={arcPath(s.start, s.end)} fill="none" stroke={s.fill} strokeWidth={18} strokeLinecap="butt" />
      ))}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1B5745" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#1B5745" />
      {/* Value */}
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize={18} fontWeight={700} fill="#1B5745">{fmtTemp(wci)}C</text>
      <text x={cx} y={cy + 38} textAnchor="middle" fontSize={10} fill="#6B7280">Wind Chill</text>
      {/* Scale labels */}
      <text x={cx - r - 10} y={cy + 5} textAnchor="end" fontSize={8} fill="#6B7280">-60C</text>
      <text x={cx + r + 10} y={cy + 5} textAnchor="start" fontSize={8} fill="#6B7280">+10C</text>
      <text x={cx} y={cy - r - 8} textAnchor="middle" fontSize={8} fill="#6B7280">-25C</text>
    </svg>
  );
}

// ─── SVG Line Chart — Wind Chill vs Wind Speed ───────────────
function WindCurveChart({ airTemp, userWind }: { airTemp: number; userWind: number }) {
  const curve = generateWindCurve(airTemp, 80, 2);
  if (curve.length < 2) return null;
  const W = 600, H = 200, PAD = { top: 20, right: 20, bottom: 35, left: 50 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxWind = 80;
  const minWCI = Math.min(-50, ...curve.map(p => p.wci));
  const maxWCI = Math.max(airTemp + 2, ...curve.map(p => p.wci));
  const rangeWCI = maxWCI - minWCI || 1;

  const xScale = (w: number) => PAD.left + (w / maxWind) * cw;
  const yScale = (v: number) => PAD.top + ch - ((v - minWCI) / rangeWCI) * ch;

  const line = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.wind).toFixed(1)},${yScale(p.wci).toFixed(1)}`).join(" ");

  // User point
  const userWCI = windChillIndex(airTemp, userWind);
  const ux = xScale(userWind), uy = yScale(userWCI);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {[-50, -40, -30, -20, -10, 0, 10].filter(v => v >= minWCI && v <= maxWCI).map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}C</text>
        </g>
      ))}
      {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(w => (
        <text key={w} x={xScale(w)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">{w}</text>
      ))}
      {/* Air temp reference */}
      <line x1={PAD.left} y1={yScale(airTemp)} x2={W - PAD.right} y2={yScale(airTemp)} stroke="#9CA3AF" strokeWidth={0.5} strokeDasharray="4,3" />
      <text x={W - PAD.right - 2} y={yScale(airTemp) - 4} textAnchor="end" fontSize={8} fill="#9CA3AF">Air temp: {airTemp}C</text>
      {/* Curve */}
      <path d={line} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" />
      {/* User point */}
      <circle cx={ux} cy={uy} r={5} fill="#1B5745" stroke="white" strokeWidth={2} />
      <text x={ux + 8} y={uy - 6} fontSize={10} fontWeight={700} fill="#1B5745">{fmtTemp(userWCI)}C</text>
      {/* Labels */}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={10} fontWeight={600} fill="#6B7280">Wind Chill (C)</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="#6B7280">Wind Speed (km/h)</text>
    </svg>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  result: WindChillResult,
  windUnit: WindUnit,
  durationMinutes: number,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `CWC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const displayWind = windUnit === "ms" ? `${kmhToMs(result.windSpeedKmh).toFixed(1)} m/s (${result.windSpeedKmh.toFixed(0)} km/h)` : `${result.windSpeedKmh.toFixed(0)} km/h`;

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("COLD STRESS / WIND CHILL ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("North American WCI / Environment Canada -- ebrora.com/tools/cold-stress-wind-chill-calculator", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 5;
  drawFld("Air Temp:", `${result.airTemp}C`, M + 3, y, 0);
  drawFld("Wind Speed:", displayWind, M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Cold stress assessment for ${header.site || "the above site"}. Air temperature: ${result.airTemp}C. Wind speed: ${displayWind}. Planned exposure: ${fmtDuration(durationMinutes)}. Wind chill calculated using the North American Wind Chill Index formula (Environment Canada / US NWS). Frostbite and hypothermia risk per Environment Canada thresholds and CSA Z1004-12 guidance.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("COLD STRESS / WIND CHILL ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Risk Banner
  const band = getRiskBand(result.riskCategory);
  const riskRGB: Record<RiskCategory, number[]> = {
    "minimal": [22, 163, 74], "low": [59, 130, 246], "moderate": [234, 179, 8],
    "high": [249, 115, 22], "very-high": [239, 68, 68], "extreme": [124, 58, 237],
  };
  const rgb = riskRGB[result.riskCategory];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`WIND CHILL: ${fmtTemp(result.windChillTemp)}C -- ${band.label.toUpperCase()} RISK`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Frostbite: ${result.frostbiteRisk.label} | Hypothermia: ${result.hypothermiaRisk.label} | Duration: ${fmtDuration(durationMinutes)}`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Summary
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M, y); y += 5;

  const items = [
    ["Air Temperature", `${result.airTemp}C`],
    ["Wind Speed", displayWind],
    ["Wind Chill Temperature", `${fmtTemp(result.windChillTemp)}C`],
    ["Risk Category", band.label],
    ["Frostbite Risk", result.frostbiteRisk.label],
    ["Frostbite Time (exposed skin)", result.frostbiteRisk.timeMinutes ? `${result.frostbiteRisk.timeMinutes} minutes` : "N/A"],
    ["Hypothermia Risk", result.hypothermiaRisk.label],
    ["Max Continuous Exposure", result.maxSafeDurationMinutes ? fmtDuration(result.maxSafeDurationMinutes) : "No limit"],
    ["Warm-Up Break Interval", result.hypothermiaRisk.warmBreakIntervalMinutes ? `Every ${result.hypothermiaRisk.warmBreakIntervalMinutes} min` : "Standard breaks"],
    ["Planned Duration", fmtDuration(durationMinutes)],
    ["Duration Safe?", result.durationSafe ? "YES" : "NO -- EXCEEDS SAFE LIMIT"],
  ];
  items.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(label + ":", M, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, M + 55, y);
    y += 4;
  });
  y += 4;

  // ── Wind Chill Matrix
  checkPage(65);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Wind Chill Matrix (C)", M, y); y += 5;

  const matrix = generateMatrix(MATRIX_TEMPS, MATRIX_WINDS);
  const mCellW = (CW - 14) / (MATRIX_TEMPS.length + 1);
  const mCellH = 5;

  // Header row
  let cx = M + 14;
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
  MATRIX_TEMPS.forEach(t => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, mCellW, mCellH, "F");
    doc.setTextColor(255, 255, 255); doc.text(`${t}C`, cx + 1, y + 3.5);
    cx += mCellW;
  });
  doc.setTextColor(0, 0, 0); y += mCellH;

  // Data rows
  matrix.forEach((row, ri) => {
    checkPage(6);
    cx = M;
    doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
    doc.text(`${MATRIX_WINDS[ri]}`, cx, y + 3.5);
    cx = M + 14;
    row.forEach((cell) => {
      const b = getRiskBand(cell.risk);
      const rgb2 = b.colour;
      // Parse hex to RGB
      const r2 = parseInt(rgb2.slice(1, 3), 16);
      const g = parseInt(rgb2.slice(3, 5), 16);
      const b2 = parseInt(rgb2.slice(5, 7), 16);
      doc.setFillColor(r2, g, b2, 0.15);
      // Use lighter versions
      if (cell.risk === "minimal") doc.setFillColor(187, 247, 208);
      else if (cell.risk === "low") doc.setFillColor(191, 219, 254);
      else if (cell.risk === "moderate") doc.setFillColor(254, 243, 199);
      else if (cell.risk === "high") doc.setFillColor(254, 215, 170);
      else if (cell.risk === "very-high") doc.setFillColor(254, 202, 202);
      else doc.setFillColor(221, 214, 254);
      doc.rect(cx, y, mCellW, mCellH, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5);
      doc.text(`${cell.wci.toFixed(0)}`, cx + 1, y + 3.5);
      cx += mCellW;
    });
    y += mCellH;
  });
  y += 6;

  // ── Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommended Controls", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3.5;
  });
  y += 4;

  // ── Clothing Requirements
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Clothing Requirements", M, y); y += 5;

  const reqItems = result.clothingReqs.filter(c => c.required);
  if (reqItems.length === 0) {
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Standard site PPE -- no additional cold weather clothing required at this wind chill.", M + 2, y);
    y += 5;
  } else {
    // Header
    const cCols = [80, CW - 80];
    let ccx = M;
    ["Item", "Details"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(ccx, y, cCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(h, ccx + 2, y + 4);
      ccx += cCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;

    reqItems.forEach((item, idx) => {
      checkPage(6);
      ccx = M;
      [item.item, item.description].forEach((t, i) => {
        if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(ccx, y, cCols[i], 5.5, "FD"); }
        else { doc.rect(ccx, y, cCols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
        const lines = doc.splitTextToSize(t, cCols[i] - 4);
        doc.text(lines[0], ccx + 2, y + 3.8);
        ccx += cCols[i];
      });
      y += 5.5;
    });
    y += 4;
  }

  // ── Hypothermia Detail
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Hypothermia Risk Assessment", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const hypoLines = doc.splitTextToSize(result.hypothermiaRisk.description, CW - 4);
  doc.text(hypoLines, M + 2, y);
  y += hypoLines.length * 3.5 + 4;

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;

  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5);
  doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Cold stress assessment using the North American Wind Chill Index (Environment Canada / US NWS). Frostbite thresholds per Environment Canada. This is a screening tool -- actual conditions may vary.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }

  doc.save(`cold-stress-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function ColdStressWindChillClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [airTemp, setAirTemp] = useState<number>(0);
  const [windSpeed, setWindSpeed] = useState<number>(30);
  const [windUnit, setWindUnit] = useState<WindUnit>("kmh");
  const [duration, setDuration] = useState<number>(60);

  const windKmh = windUnit === "ms" ? msToKmh(windSpeed) : windSpeed;

  const result = useMemo(() =>
    calculateWindChill(airTemp, windSpeed, windUnit, duration),
    [airTemp, windSpeed, windUnit, duration]
  );

  const band = getRiskBand(result.riskCategory);
  const hasData = true; // Always has data since defaults are set
  const requiredClothing = result.clothingReqs.filter(c => c.required);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, assessedBy, date: assessDate }, result, windUnit, duration); }
    finally { setExporting(false); }
  }, [site, manager, assessedBy, assessDate, result, windUnit, duration]);

  const clearAll = useCallback(() => {
    setAirTemp(0); setWindSpeed(30); setWindUnit("kmh"); setDuration(60);
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Wind Chill", value: `${fmtTemp(result.windChillTemp)}C`, sub: `Air: ${airTemp}C | Wind: ${windKmh.toFixed(0)} km/h`, ...band },
          { label: "Frostbite Risk", value: result.frostbiteRisk.label, sub: result.frostbiteRisk.timeMinutes ? `Exposed skin in ${result.frostbiteRisk.timeMinutes} min` : "Low frostbite risk", bgClass: result.frostbiteRisk.category === "none" ? "bg-emerald-50" : "bg-red-50", textClass: result.frostbiteRisk.category === "none" ? "text-emerald-800" : "text-red-800", borderClass: result.frostbiteRisk.category === "none" ? "border-emerald-200" : "border-red-200", dotClass: result.frostbiteRisk.category === "none" ? "bg-emerald-500" : "bg-red-500" },
          { label: "Hypothermia Risk", value: result.hypothermiaRisk.label, sub: result.hypothermiaRisk.maxContinuousMinutes ? `Max ${fmtDuration(result.hypothermiaRisk.maxContinuousMinutes)} continuous` : "Standard breaks sufficient", bgClass: result.hypothermiaRisk.category === "negligible" ? "bg-emerald-50" : result.hypothermiaRisk.category === "low" ? "bg-blue-50" : "bg-orange-50", textClass: result.hypothermiaRisk.category === "negligible" ? "text-emerald-800" : result.hypothermiaRisk.category === "low" ? "text-blue-800" : "text-orange-800", borderClass: result.hypothermiaRisk.category === "negligible" ? "border-emerald-200" : result.hypothermiaRisk.category === "low" ? "border-blue-200" : "border-orange-200", dotClass: result.hypothermiaRisk.category === "negligible" ? "bg-emerald-500" : result.hypothermiaRisk.category === "low" ? "bg-blue-500" : "bg-orange-500" },
          { label: "Clothing Items", value: `${requiredClothing.length}`, sub: requiredClothing.length > 0 ? "Additional items required" : "Standard PPE only", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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

      {/* ── Duration Warning ──────────────────────────────── */}
      {!result.durationSafe && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">Planned Exposure Exceeds Safe Duration</div>
            <div className="text-xs text-red-800 mt-1">
              Planned exposure of {fmtDuration(duration)} exceeds the maximum safe continuous exposure of {fmtDuration(result.maxSafeDurationMinutes!)} at a wind chill of {fmtTemp(result.windChillTemp)}C. Implement work/warm-up rotation or reduce exposure time.
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
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

      {/* ── Input Controls ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
        <h3 className="text-sm font-bold text-gray-700">Conditions</h3>

        {/* Air Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Air Temperature (C)</label>
            <span className="text-sm font-bold text-gray-800">{airTemp}C</span>
          </div>
          <input type="range" min={-30} max={15} step={1} value={airTemp}
            onChange={e => setAirTemp(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-purple-300 via-blue-300 via-cyan-200 to-emerald-200 rounded-lg appearance-none cursor-pointer accent-ebrora" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>-30C</span><span>-15C</span><span>0C</span><span>+15C</span>
          </div>
          <input type="number" value={airTemp} onChange={e => setAirTemp(Math.max(-30, Math.min(15, parseInt(e.target.value) || 0)))}
            min={-30} max={15} step={1}
            className="mt-2 w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
        </div>

        {/* Wind Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Wind Speed</label>
              <div className="flex rounded-md overflow-hidden border border-gray-200">
                <button onClick={() => { if (windUnit === "ms") { setWindSpeed(Math.round(msToKmh(windSpeed))); setWindUnit("kmh"); } }}
                  className={`px-2 py-0.5 text-[10px] font-bold ${windUnit === "kmh" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>km/h</button>
                <button onClick={() => { if (windUnit === "kmh") { setWindSpeed(Math.round(kmhToMs(windSpeed) * 10) / 10); setWindUnit("ms"); } }}
                  className={`px-2 py-0.5 text-[10px] font-bold ${windUnit === "ms" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>m/s</button>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-800">
              {windSpeed}{windUnit === "kmh" ? " km/h" : " m/s"}
              {windUnit === "ms" && <span className="text-xs font-normal text-gray-400 ml-1">({msToKmh(windSpeed).toFixed(0)} km/h)</span>}
            </span>
          </div>
          <input type="range" min={0} max={windUnit === "kmh" ? 80 : 22} step={windUnit === "kmh" ? 1 : 0.5} value={windSpeed}
            onChange={e => setWindSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-300 rounded-lg appearance-none cursor-pointer accent-ebrora" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Calm</span><span>{windUnit === "kmh" ? "40 km/h" : "11 m/s"}</span><span>{windUnit === "kmh" ? "80 km/h" : "22 m/s"}</span>
          </div>
          <input type="number" value={windSpeed} onChange={e => setWindSpeed(Math.max(0, parseFloat(e.target.value) || 0))}
            min={0} max={windUnit === "kmh" ? 80 : 22} step={windUnit === "kmh" ? 1 : 0.5}
            className="mt-2 w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Continuous Exposure Duration</label>
            <span className="text-sm font-bold text-gray-800">{fmtDuration(duration)}</span>
          </div>
          <input type="range" min={15} max={480} step={15} value={duration}
            onChange={e => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ebrora" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>15 min</span><span>2h</span><span>4h</span><span>8h</span>
          </div>
        </div>
      </div>

      {/* ── Frostbite Gauge ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Wind Chill Gauge</h3>
        <p className="text-[11px] text-gray-400">Frostbite time bands: green = safe, blue = low risk, yellow = 30 min, orange = 10 min, red = 5 min, purple = under 2 min.</p>
        <div className="max-w-sm mx-auto">
          <FrostbiteGauge wci={result.windChillTemp} />
        </div>
      </div>

      {/* ── Heatmap Matrix ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Wind Chill Matrix</h3>
        <p className="text-[11px] text-gray-400">Wind chill temperature (C) across a range of conditions. Your current conditions are highlighted with a bold border.</p>
        <WindChillHeatmap userTemp={airTemp} userWind={windKmh} />
      </div>

      {/* ── Wind Chill vs Wind Speed Chart ─────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Wind Chill vs Wind Speed (at {airTemp}C)</h3>
        <p className="text-[11px] text-gray-400">Shows how wind chill drops as wind speed increases at the entered air temperature. Note the diminishing effect at very high wind speeds.</p>
        <WindCurveChart airTemp={airTemp} userWind={windKmh} />
      </div>

      {/* ── Clothing Requirements ──────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Clothing Requirements</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Based on CSA Z1004-12 and HSE cold work guidance for a wind chill of {fmtTemp(result.windChillTemp)}C</p>
        </div>
        <div className="divide-y divide-gray-100">
          {result.clothingReqs.map(item => (
            <div key={item.item} className={`px-4 py-2.5 flex items-start gap-3 ${item.required ? "" : "opacity-40"}`}>
              <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${item.required ? "bg-ebrora text-white" : "bg-gray-200 text-gray-400"}`}>
                {item.required ? "R" : "-"}
              </span>
              <div>
                <div className={`text-sm font-medium ${item.required ? "text-gray-800" : "text-gray-400"}`}>{item.item}</div>
                <div className="text-[11px] text-gray-400">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommendations ────────────────────────────────── */}
      {result.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Recommended Controls</h3>
          </div>
          <div className="px-4 py-3 space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-ebrora font-bold mt-0.5">-</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hypothermia Detail ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Hypothermia Risk Detail</h3>
        <p className="text-sm text-gray-600">{result.hypothermiaRisk.description}</p>
        {result.hypothermiaRisk.warmBreakIntervalMinutes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>Work/Warm-Up Schedule:</strong> Maximum {fmtDuration(result.hypothermiaRisk.maxContinuousMinutes!)} continuous outdoor work, then minimum {result.hypothermiaRisk.warmBreakIntervalMinutes} minutes in a heated shelter (minimum 18C).
          </div>
        )}
      </div>

      {/* ── Risk Band Key ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {RISK_BANDS.map(b => (
          <div key={b.category} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${b.bgClass} ${b.textClass} border ${b.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${b.dotClass}`} />
            {b.label}
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Wind chill calculated using the North American Wind Chill Index formula (Environment Canada / US NWS, adopted 2001).
          Frostbite thresholds per Environment Canada. Hypothermia guidance per CSA Z1004-12 and HSE cold work guidance.
          This is a screening tool - it does not replace a formal cold stress risk assessment. Actual conditions may vary.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
