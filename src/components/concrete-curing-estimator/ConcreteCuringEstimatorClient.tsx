// src/components/concrete-curing-estimator/ConcreteCuringEstimatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  CEMENT_TYPES, STRENGTH_CLASSES, CURING_METHODS, TARGET_TYPES,
  calculateCuring, fmtHours, fmtDays,
} from "@/data/concrete-curing-estimator";
import type { CementType, StrengthClass, CuringMethod, TargetType, CuringResult } from "@/data/concrete-curing-estimator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG: Strength vs Time Curve ─────────────────────────────
function StrengthCurveChart({ result }: { result: CuringResult }) {
  const curve = result.strengthCurve;
  const curve20 = result.strengthCurve20C;
  if (curve.length < 2) return null;

  const W = 600, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 55 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;

  const maxH = Math.max(...curve.map(p => p.hours), ...curve20.map(p => p.hours));
  const maxStr = Math.max(result.fcm28 * 1.1, result.targetStrengthMPa * 1.2);

  const xScale = (h: number) => PAD.left + (h / maxH) * cw;
  const yScale = (v: number) => PAD.top + ch - (Math.min(v, maxStr) / maxStr) * ch;

  const pathUser = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.hours).toFixed(1)},${yScale(p.strengthMPa).toFixed(1)}`).join(" ");
  const path20 = curve20.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.hours).toFixed(1)},${yScale(p.strengthMPa).toFixed(1)}`).join(" ");

  // Find intersection of target strength with user curve
  let targetX = -1, targetY = -1;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].strengthMPa >= result.targetStrengthMPa && curve[i - 1].strengthMPa < result.targetStrengthMPa) {
      const frac = (result.targetStrengthMPa - curve[i - 1].strengthMPa) / (curve[i].strengthMPa - curve[i - 1].strengthMPa);
      const h = curve[i - 1].hours + frac * (curve[i].hours - curve[i - 1].hours);
      targetX = xScale(h);
      targetY = yScale(result.targetStrengthMPa);
      break;
    }
  }

  // Grid lines
  const yTicks: number[] = [];
  const step = maxStr > 40 ? 10 : 5;
  for (let v = 0; v <= maxStr; v += step) yTicks.push(v);
  const xTicks = [0, 24, 48, 72, 168, 336, 504, 672].filter(h => h <= maxH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      {yTicks.map(v => (
        <g key={`y-${v}`}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{v}</text>
        </g>
      ))}
      {xTicks.map(h => (
        <text key={`x-${h}`} x={xScale(h)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
          {h < 24 ? `${h}h` : `${(h / 24).toFixed(0)}d`}
        </text>
      ))}
      {/* Target strength line */}
      <line x1={PAD.left} y1={yScale(result.targetStrengthMPa)} x2={W - PAD.right} y2={yScale(result.targetStrengthMPa)} stroke="#EF4444" strokeWidth={1} strokeDasharray="6,3" />
      <text x={W - PAD.right - 2} y={yScale(result.targetStrengthMPa) - 4} textAnchor="end" fontSize={7} fill="#EF4444" fontWeight={600}>Target: {result.targetStrengthMPa} MPa</text>
      {/* 20C reference curve */}
      <path d={path20} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3" />
      {/* User curve */}
      <path d={pathUser} fill="none" stroke="#1B5745" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Intersection point */}
      {targetX > 0 && (
        <>
          <line x1={targetX} y1={targetY} x2={targetX} y2={PAD.top + ch} stroke="#1B5745" strokeWidth={0.8} strokeDasharray="3,2" />
          <circle cx={targetX} cy={targetY} r={5} fill="#1B5745" stroke="white" strokeWidth={2} />
          <text x={targetX + 8} y={targetY - 6} fontSize={9} fontWeight={700} fill="#1B5745">{fmtDays(result.estimatedDays)}</text>
        </>
      )}
      {/* Legend */}
      <line x1={PAD.left} y1={H - 8} x2={PAD.left + 20} y2={H - 8} stroke="#1B5745" strokeWidth={2.5} />
      <text x={PAD.left + 24} y={H - 5} fontSize={8} fill="#6B7280">At {result.effectiveCuringTemp}C</text>
      <line x1={PAD.left + 110} y1={H - 8} x2={PAD.left + 130} y2={H - 8} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3" />
      <text x={PAD.left + 134} y={H - 5} fontSize={8} fill="#9CA3AF">At 20C (reference)</text>
      {/* Axis labels */}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={9} fontWeight={600} fill="#6B7280">Strength (MPa)</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#6B7280">Time</text>
    </svg>
  );
}

// ─── SVG: Milestone Bar Chart ────────────────────────────────
function MilestoneChart({ result }: { result: CuringResult }) {
  const items = result.milestones.filter(m => m.achievable);
  if (items.length === 0) return <div className="text-sm text-gray-400 text-center py-4">No milestones achievable at this temperature</div>;

  const W = 500, H = 40 + items.length * 32, PAD = { top: 15, right: 60, bottom: 10, left: 120 };
  const cw = W - PAD.left - PAD.right;
  const maxH = Math.max(...items.map(m => m.hours), 24);
  const barH = 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: items.length * 38 + 30 }}>
      {items.map((m, i) => {
        const y = PAD.top + i * 32;
        const w = Math.max(2, (m.hours / maxH) * cw);
        const isTarget = m.targetMPa === result.targetStrengthMPa;
        const colour = isTarget ? "#1B5745" : "#3B82F6";
        return (
          <g key={m.label}>
            <text x={PAD.left - 6} y={y + barH / 2 + 3} textAnchor="end" fontSize={8} fill="#374151" fontWeight={isTarget ? 700 : 400}>{m.label}</text>
            <rect x={PAD.left} y={y} width={w} height={barH} fill={colour} rx={3} opacity={isTarget ? 1 : 0.6} />
            <text x={PAD.left + w + 4} y={y + barH / 2 + 3} fontSize={9} fontWeight={600} fill={colour}>{fmtHours(m.hours)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG: Temperature Sensitivity Chart ──────────────────────
function TempSensitivityChart({ result, userTemp }: { result: CuringResult; userTemp: number }) {
  const data = result.tempSensitivity.filter(d => isFinite(d.hours) && d.hours < 8760);
  if (data.length < 2) return <div className="text-sm text-gray-400 text-center py-4">Insufficient data at these conditions</div>;

  const W = 500, H = 200, PAD = { top: 20, right: 20, bottom: 35, left: 55 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;

  const minTemp = Math.min(...data.map(d => d.tempC));
  const maxTemp = Math.max(...data.map(d => d.tempC));
  const maxDays = Math.max(...data.map(d => d.days));
  const tempRange = maxTemp - minTemp || 1;

  const xScale = (t: number) => PAD.left + ((t - minTemp) / tempRange) * cw;
  const yScale = (d: number) => PAD.top + ch - (d / maxDays) * ch;

  const line = data.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.tempC).toFixed(1)},${yScale(p.days).toFixed(1)}`).join(" ");

  // User point
  const userData = data.find(d => d.tempC === userTemp) || (isFinite(result.estimatedDays) ? { tempC: userTemp, days: result.estimatedDays } : null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {data.map(d => (
        <g key={`x-${d.tempC}`}>
          <line x1={xScale(d.tempC)} y1={PAD.top} x2={xScale(d.tempC)} y2={PAD.top + ch} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={xScale(d.tempC)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{d.tempC}C</text>
        </g>
      ))}
      {/* Curve */}
      <path d={line} fill="none" stroke="#F97316" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Data points */}
      {data.map(d => (
        <circle key={d.tempC} cx={xScale(d.tempC)} cy={yScale(d.days)} r={3} fill="#F97316" />
      ))}
      {/* User point highlight */}
      {userData && isFinite(userData.days) && (
        <>
          <circle cx={xScale(userData.tempC)} cy={yScale(userData.days)} r={6} fill="#1B5745" stroke="white" strokeWidth={2} />
          <text x={xScale(userData.tempC) + 10} y={yScale(userData.days) - 4} fontSize={9} fontWeight={700} fill="#1B5745">{fmtDays(userData.days)}</text>
        </>
      )}
      {/* Labels */}
      <text x={PAD.left - 10} y={PAD.top - 6} fontSize={9} fontWeight={600} fill="#6B7280">Curing Time (days)</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#6B7280">Curing Temperature (C)</text>
    </svg>
  );
}

// ─── SVG: Strength at 28 Days Comparison ─────────────────────
function Strength28DayChart({ result }: { result: CuringResult }) {
  const curve = result.strengthCurve;
  const curve20 = result.strengthCurve20C;
  const userStr28 = curve.length > 0 ? curve[curve.length - 1].strengthMPa : 0;
  const refStr28 = curve20.length > 0 ? curve20[curve20.length - 1].strengthMPa : 0;

  const W = 300, H = 120, PAD = { top: 15, right: 20, bottom: 25, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const maxStr = Math.max(userStr28, refStr28, result.fcm28) * 1.15;
  const barH = 24;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 140 }}>
      {/* User temp bar */}
      <text x={PAD.left - 4} y={PAD.top + barH / 2 + 3} textAnchor="end" fontSize={8} fill="#374151" fontWeight={600}>{result.effectiveCuringTemp}C</text>
      <rect x={PAD.left} y={PAD.top} width={Math.max(2, (userStr28 / maxStr) * cw)} height={barH} fill="#1B5745" rx={3} />
      <text x={PAD.left + (userStr28 / maxStr) * cw + 4} y={PAD.top + barH / 2 + 3} fontSize={9} fontWeight={600} fill="#1B5745">{userStr28} MPa</text>
      {/* 20C bar */}
      <text x={PAD.left - 4} y={PAD.top + barH + 10 + barH / 2 + 3} textAnchor="end" fontSize={8} fill="#374151" fontWeight={600}>20C (ref)</text>
      <rect x={PAD.left} y={PAD.top + barH + 10} width={Math.max(2, (refStr28 / maxStr) * cw)} height={barH} fill="#9CA3AF" rx={3} />
      <text x={PAD.left + (refStr28 / maxStr) * cw + 4} y={PAD.top + barH + 10 + barH / 2 + 3} fontSize={9} fontWeight={600} fill="#9CA3AF">{refStr28} MPa</text>
      {/* Label */}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#6B7280">Estimated 28-day strength (MPa)</text>
    </svg>
  );
}

// ─── PDF Export (PAID = dark header) ─────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  curingTemp: number,
  thicknessMm: number,
  result: CuringResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `CCT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const scInfo = STRENGTH_CLASSES.find(c => c.cls === result.strengthClass)!;
  const cemInfo = CEMENT_TYPES.find(c => c.type === result.cementType)!;
  const curInfo = CURING_METHODS.find(c => c.method === result.curingMethod)!;
  const tgtInfo = TARGET_TYPES.find(t => {
    if (t.type === "5mpa" && result.targetStrengthMPa === 5) return true;
    if (t.type === "10mpa" && result.targetStrengthMPa === 10) return true;
    if (t.type === "15mpa" && result.targetStrengthMPa === 15) return true;
    return false;
  }) || TARGET_TYPES[3]; // fallback

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("CONCRETE CURING TIME ESTIMATE", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("BS EN 1992-1-1 (Eurocode 2) / PD 6687 / BS EN 13670 / Nurse-Saul Maturity Method", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 45, 1, 1, "FD"); doc.setFontSize(8);
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
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40); y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Strength Class:", scInfo.label, M + halfW, y, 0); y += 5;
  drawFld("Cement Type:", cemInfo.label, M + 3, y, 0); y += 5;
  drawFld("Curing Temp:", `${curingTemp}C (effective: ${result.effectiveCuringTemp}C)`, M + 3, y, 0);
  drawFld("Element Thickness:", `${thicknessMm} mm`, M + halfW, y, 0); y += 5;
  drawFld("Curing Method:", curInfo.label, M + 3, y, 0);
  drawFld("Target:", `${result.targetStrengthMPa} MPa`, M + halfW, y, 0); y += 5;
  drawFld("Insulation Boost:", result.insulationBoost > 0 ? `+${result.insulationBoost}C` : "None", M + 3, y, 0);
  y += 8;

  // Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Concrete curing time estimate for ${header.site || "the above site"}. ${scInfo.label} concrete with ${cemInfo.label} at ${curingTemp}C mean curing temperature. Curing method: ${curInfo.label}. Element thickness: ${thicknessMm}mm. Target strength: ${result.targetStrengthMPa} MPa. Calculated using the Nurse-Saul maturity method per BS EN 1992-1-1 and PD 6687.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("CONCRETE CURING TIME ESTIMATE (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Result banner
  const bannerOK = isFinite(result.estimatedHours) && !result.noGainWarning;
  const rgb = result.frostWarning || result.noGainWarning ? [220, 38, 38] : result.coldWarning ? [234, 179, 8] : result.hotWarning ? [249, 115, 22] : [22, 163, 74];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(bannerOK ? `ESTIMATED CURING TIME: ${fmtDays(result.estimatedDays)}` : "WARNING: STRENGTH GAIN NOT POSSIBLE AT THIS TEMPERATURE", M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(bannerOK ? `${result.targetStrengthMPa} MPa target | ${result.effectiveCuringTemp}C effective temp | ${cemInfo.label}` : `Temperature ${curingTemp}C is at or below datum temperature (${cemInfo.datumTemp}C)`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // Summary panel
  checkPage(55);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 46, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  const items: [string, string][] = [
    ["Strength Class", `${scInfo.label} (fcm = ${scInfo.fcm} MPa)`],
    ["Cement Type", `${cemInfo.label} (s = ${cemInfo.s})`],
    ["Curing Temperature", `${curingTemp}C (effective: ${result.effectiveCuringTemp}C)`],
    ["Element Thickness", `${thicknessMm} mm`],
    ["Curing Method", curInfo.label],
    ["Insulation Boost", result.insulationBoost > 0 ? `+${result.insulationBoost}C` : "None"],
    ["Target Strength", `${result.targetStrengthMPa} MPa`],
    ["Estimated Curing Time", bannerOK ? fmtHours(result.estimatedHours) : "N/A"],
    ["Equivalent Age at 20C", bannerOK ? `${result.equivalentAge20C} days` : "N/A"],
    ["Maturity Required", bannerOK ? `${result.maturityRequired} C-hours` : "N/A"],
  ];
  items.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setTextColor(17, 24, 39); doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 6;

  // Milestone table
  checkPage(40);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Strength Milestones at " + result.effectiveCuringTemp + "C", M, y); y += 5;
  const cols = [70, 30, 35, 35];
  let cx = M;
  ["Milestone", "Target (MPa)", "Time", "Achievable"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  result.milestones.forEach((m, ri) => {
    checkPage(6);
    cx = M;
    const cells = [m.label, String(m.targetMPa), m.achievable ? fmtHours(m.hours) : "N/A", m.achievable ? "[YES]" : "[NO]"];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 3.8);
      cx += cols[i];
    });
    y += 5.5;
  });
  y += 6;

  // Temperature sensitivity table
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Temperature Sensitivity — Time to " + result.targetStrengthMPa + " MPa", M, y); y += 5;
  const tCols = [30, 40, 40, 40];
  cx = M;
  ["Temp (C)", "Time", "Days", "vs 20C"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, tCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4);
    cx += tCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  const ref20 = result.tempSensitivity.find(d => d.tempC === 20);
  result.tempSensitivity.forEach((d, ri) => {
    checkPage(6);
    cx = M;
    const ratio = ref20 && isFinite(ref20.hours) && isFinite(d.hours) ? `${(d.hours / ref20.hours).toFixed(1)}x` : "N/A";
    const isCurrent = d.tempC === Math.round(curingTemp);
    const cells = [`${d.tempC}C`, isFinite(d.hours) ? fmtHours(d.hours) : "N/A", isFinite(d.days) ? fmtDays(d.days) : "N/A", ratio];
    cells.forEach((t, i) => {
      if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, tCols[i], 5.5, "FD"); }
      else if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, tCols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, tCols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", isCurrent ? "bold" : i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 3.8);
      cx += tCols[i];
    });
    y += 5.5;
  });
  y += 6;

  // Strength curve chart in PDF
  checkPage(75);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Strength Development Curve", M, y);
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text(`Estimated strength (MPa) vs time at ${result.effectiveCuringTemp}C. Reference curve at 20C shown dashed. Target marked in red.`, M, y + 4);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 8;

  {
    const chartX = M + 12, chartW2 = CW - 24, chartH2 = 50;
    const chartY2 = y;
    const curve = result.strengthCurve;
    const curve20 = result.strengthCurve20C;
    const maxH = Math.max(...curve.map(p => p.hours));
    const maxStr = Math.max(result.fcm28 * 1.1, result.targetStrengthMPa * 1.2);

    // Background
    doc.setFillColor(248, 250, 252); doc.rect(chartX, chartY2, chartW2, chartH2, "F");

    // Grid
    doc.setDrawColor(220, 220, 220); doc.setFontSize(5); doc.setTextColor(130, 130, 130);
    const sStep = maxStr > 40 ? 10 : 5;
    for (let v = 0; v <= maxStr; v += sStep) {
      const yp = chartY2 + chartH2 - (v / maxStr) * chartH2;
      doc.line(chartX, yp, chartX + chartW2, yp);
      doc.text(`${v}`, chartX - 7, yp + 1.5);
    }
    for (let h = 0; h <= maxH; h += (maxH > 336 ? 168 : 24)) {
      const xp = chartX + (h / maxH) * chartW2;
      doc.line(xp, chartY2, xp, chartY2 + chartH2);
      doc.text(h < 24 ? `${h}h` : `${(h / 24).toFixed(0)}d`, xp - 2, chartY2 + chartH2 + 4);
    }

    // Target line
    const tgtY = chartY2 + chartH2 - (result.targetStrengthMPa / maxStr) * chartH2;
    doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.3);
    doc.line(chartX, tgtY, chartX + chartW2, tgtY);
    doc.setFontSize(4.5); doc.setTextColor(220, 38, 38);
    doc.text(`${result.targetStrengthMPa} MPa`, chartX + chartW2 - 12, tgtY - 1);

    // 20C reference curve (dashed — approximate with short segments)
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.4);
    for (let i = 1; i < curve20.length; i++) {
      const x1 = chartX + (curve20[i - 1].hours / maxH) * chartW2;
      const y1 = chartY2 + chartH2 - (Math.min(curve20[i - 1].strengthMPa, maxStr) / maxStr) * chartH2;
      const x2 = chartX + (curve20[i].hours / maxH) * chartW2;
      const y2v = chartY2 + chartH2 - (Math.min(curve20[i].strengthMPa, maxStr) / maxStr) * chartH2;
      if (i % 2 === 0) doc.line(x1, y1, x2, y2v);
    }

    // User curve
    doc.setDrawColor(27, 87, 69); doc.setLineWidth(0.6);
    for (let i = 1; i < curve.length; i++) {
      const x1 = chartX + (curve[i - 1].hours / maxH) * chartW2;
      const y1 = chartY2 + chartH2 - (Math.min(curve[i - 1].strengthMPa, maxStr) / maxStr) * chartH2;
      const x2 = chartX + (curve[i].hours / maxH) * chartW2;
      const y2v = chartY2 + chartH2 - (Math.min(curve[i].strengthMPa, maxStr) / maxStr) * chartH2;
      doc.line(x1, y1, x2, y2v);
    }

    // Intersection point
    if (isFinite(result.estimatedHours) && result.estimatedHours <= maxH) {
      const ix = chartX + (result.estimatedHours / maxH) * chartW2;
      const iy = tgtY;
      doc.setFillColor(27, 87, 69); doc.circle(ix, iy, 1.5, "F");
      doc.setFontSize(5); doc.setTextColor(27, 87, 69);
      doc.text(fmtDays(result.estimatedDays), ix + 3, iy - 1);
    }

    doc.setFontSize(5.5); doc.setTextColor(80, 80, 80);
    doc.text("Strength (MPa)", chartX - 10, chartY2 - 2);
    doc.text("Time", chartX + chartW2 / 2 - 4, chartY2 + chartH2 + 8);
    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = chartY2 + chartH2 + 12;
  }

  // Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 5;
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
  doc.text("Assessed By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
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
    doc.text("Concrete curing estimate per BS EN 1992-1-1 (Eurocode 2), PD 6687, and BS EN 13670. Nurse-Saul maturity method. This is a screening tool -- verify actual strength by cube testing.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`concrete-curing-estimate-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function ConcreteCuringEstimatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [strengthClass, setStrengthClass] = useState<StrengthClass>("C30/37");
  const [cementType, setCementType] = useState<CementType>("CEM_I_425R");
  const [curingTemp, setCuringTemp] = useState<number>(15);
  const [targetType, setTargetType] = useState<TargetType>("75pct");
  const [curingMethod, setCuringMethod] = useState<CuringMethod>("formwork");
  const [thicknessMm, setThicknessMm] = useState<number>(300);

  const result = useMemo(() =>
    calculateCuring(strengthClass, cementType, curingTemp, targetType, curingMethod, thicknessMm),
    [strengthClass, cementType, curingTemp, targetType, curingMethod, thicknessMm]
  );

  const bannerOK = isFinite(result.estimatedHours) && !result.noGainWarning;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, curingTemp, thicknessMm, result); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, curingTemp, thicknessMm, result]);

  const clearAll = useCallback(() => {
    setStrengthClass("C30/37"); setCementType("CEM_I_425R"); setCuringTemp(15);
    setTargetType("75pct"); setCuringMethod("formwork"); setThicknessMm(300);
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Curing Time", value: bannerOK ? fmtDays(result.estimatedDays) : "N/A",
            sub: bannerOK ? `${fmtHours(result.estimatedHours)} to ${result.targetStrengthMPa} MPa` : "See warnings below",
            bgClass: result.frostWarning || result.noGainWarning ? "bg-red-50" : result.coldWarning ? "bg-orange-50" : "bg-emerald-50",
            textClass: result.frostWarning || result.noGainWarning ? "text-red-800" : result.coldWarning ? "text-orange-800" : "text-emerald-800",
            borderClass: result.frostWarning || result.noGainWarning ? "border-red-200" : result.coldWarning ? "border-orange-200" : "border-emerald-200",
            dotClass: result.frostWarning || result.noGainWarning ? "bg-red-500" : result.coldWarning ? "bg-orange-500" : "bg-emerald-500",
          },
          { label: "Target Strength", value: `${result.targetStrengthMPa} MPa`, sub: `28-day fcm: ${result.fcm28} MPa`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Effective Temp", value: `${result.effectiveCuringTemp}C`, sub: result.insulationBoost > 0 ? `+${result.insulationBoost}C insulation boost` : `${curingTemp}C ambient`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Cement Factor", value: `s = ${CEMENT_TYPES.find(c => c.type === cementType)!.s}`, sub: CEMENT_TYPES.find(c => c.type === cementType)!.label.split(" (")[0], bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {result.frostWarning && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">FROST RISK - DO NOT POUR</div>
            <div className="text-xs text-red-800 mt-1">Curing temperature is at or below 0C. Fresh concrete will suffer frost damage if it freezes before reaching 5 MPa. Use heated enclosures, insulation blankets, or delay the pour until conditions improve.</div></div>
        </div>
      )}
      {result.noGainWarning && !result.frostWarning && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">NO STRENGTH GAIN</div>
            <div className="text-xs text-red-800 mt-1">The effective curing temperature ({result.effectiveCuringTemp}C) is at or below the datum temperature ({CEMENT_TYPES.find(c => c.type === cementType)!.datumTemp}C). Concrete will not gain strength. Heating is essential.</div></div>
        </div>
      )}
      {result.coldWarning && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-orange-600">!</span>
          <div><div className="text-sm font-bold text-orange-900">COLD WEATHER WARNING</div>
            <div className="text-xs text-orange-800 mt-1">Curing temperature is below 10C. Strength development will be significantly slower. Monitor concrete temperature and consider insulation or heated enclosures.</div></div>
        </div>
      )}
      {result.hotWarning && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-orange-600">!</span>
          <div><div className="text-sm font-bold text-orange-900">HOT WEATHER WARNING</div>
            <div className="text-xs text-orange-800 mt-1">Curing temperature exceeds 35C. Risk of thermal cracking and reduced long-term strength. Begin curing immediately, use chilled mix water, and avoid direct sunlight.</div></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={true}>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Assessed By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Concrete & Curing Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Strength Class (BS EN 206)</label>
            <select value={strengthClass} onChange={e => setStrengthClass(e.target.value as StrengthClass)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {STRENGTH_CLASSES.map(c => <option key={c.cls} value={c.cls}>{c.label} (fcm={c.fcm} MPa)</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Cement Type</label>
            <select value={cementType} onChange={e => setCementType(e.target.value as CementType)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {CEMENT_TYPES.map(c => <option key={c.type} value={c.type}>{c.label} (s={c.s})</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Strength</label>
            <select value={targetType} onChange={e => setTargetType(e.target.value as TargetType)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {TARGET_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Curing Method</label>
            <select value={curingMethod} onChange={e => setCuringMethod(e.target.value as CuringMethod)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {CURING_METHODS.map(c => <option key={c.method} value={c.method}>{c.label}</option>)}
            </select>
            <div className="text-[10px] text-gray-400 mt-1">{CURING_METHODS.find(c => c.method === curingMethod)!.description}</div>
          </div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Mean Curing Temperature (C)</label>
            <input type="number" value={curingTemp} onChange={e => setCuringTemp(Math.max(-15, Math.min(45, parseInt(e.target.value) || 0)))} min={-15} max={45} step={1}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            <input type="range" min={-15} max={45} step={1} value={curingTemp} onChange={e => setCuringTemp(parseInt(e.target.value))}
              className="w-full h-1.5 mt-2 bg-gradient-to-r from-blue-300 via-emerald-200 to-red-300 rounded-lg appearance-none cursor-pointer accent-ebrora" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>-15C</span><span>0C</span><span>20C</span><span>45C</span></div>
          </div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Element Thickness (mm)</label>
            <input type="number" value={thicknessMm} onChange={e => setThicknessMm(Math.max(50, Math.min(2000, parseInt(e.target.value) || 300)))} min={50} max={2000} step={25}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">Affects heat-of-hydration retention. Typical: slab 150-300mm, wall 200-500mm, pile cap 500-2000mm</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Strength Development Curve</h3>
        <p className="text-[11px] text-gray-400">Estimated strength (MPa) vs time at {result.effectiveCuringTemp}C. Dashed grey = 20C reference. Red dashed = target. Green dot = estimated curing time.</p>
        <StrengthCurveChart result={result} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Strength Milestones</h3>
          <p className="text-[11px] text-gray-400">Time to reach each standard milestone at {result.effectiveCuringTemp}C. Your selected target highlighted.</p>
          <MilestoneChart result={result} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">28-Day Strength Comparison</h3>
          <p className="text-[11px] text-gray-400">Estimated 28-day strength at your curing temperature vs the standard 20C reference.</p>
          <Strength28DayChart result={result} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Temperature Sensitivity</h3>
        <p className="text-[11px] text-gray-400">How curing time to {result.targetStrengthMPa} MPa changes with temperature. Your conditions highlighted. Shows the dramatic effect of cold weather on curing time.</p>
        <TempSensitivityChart result={result} userTemp={curingTemp} />
      </div>

      {/* Milestone Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Milestone Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Milestone</th>
              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Target (MPa)</th>
              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Estimated Time</th>
              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Achievable</th>
            </tr></thead>
            <tbody>
              {result.milestones.map((m, i) => (
                <tr key={m.label} className={`border-t border-gray-100 ${m.targetMPa === result.targetStrengthMPa ? "bg-ebrora-light/30" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-2 font-medium text-gray-800">{m.label}</td>
                  <td className="px-4 py-2 text-gray-600">{m.targetMPa}</td>
                  <td className="px-4 py-2 font-semibold text-gray-800">{m.achievable ? fmtHours(m.hours) : "N/A"}</td>
                  <td className="px-4 py-2">{m.achievable ? <span className="text-emerald-600 font-bold">Yes</span> : <span className="text-red-500 font-bold">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Recommendations</h3></div>
        <div className="px-4 py-3 space-y-2">
          {result.recommendations.map((rec, i) => <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span></div>)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Concrete curing times estimated using the Nurse-Saul maturity method per BS EN 1992-1-1 (Eurocode 2) and PD 6687.
          Cement s-coefficients from Table 3.1. This is a screening tool - it does not replace cube testing per BS EN 12390-3
          or a formal assessment by a competent engineer. Actual conditions may vary.
        </p>
      </div>
    </div>
  );
}
