// src/components/uv-index-exposure-checker/UVIndexExposureCheckerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  UK_CITIES, SKIN_TYPES, CLOUD_MULTIPLIERS, RISK_BANDS,
  getRiskCategory, getRiskBand, calculateAssessment, formatUV, formatSED,
  sunriseSunset, isBST,
} from "@/data/uv-index-exposure-checker";
import type {
  CloudCover, PPEControls, UVAssessment, HourlyUV, SkinType,
} from "@/data/uv-index-exposure-checker";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

function fmtMins(mins: number | null): string {
  if (mins === null) return "--";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── SVG Chart — UV over working day ─────────────────────────
function UVLineChart({ hourly, showProtected }: { hourly: HourlyUV[]; showProtected: boolean }) {
  if (hourly.length < 2) return null;
  const W = 700, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 45 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxUV = Math.max(12, ...hourly.map(h => h.adjustedUV), ...hourly.map(h => h.protectedUV));

  const xScale = (i: number) => PAD.left + (i / (hourly.length - 1)) * cw;
  const yScale = (v: number) => PAD.top + ch - (v / maxUV) * ch;

  // Risk band backgrounds
  const bands = [
    { min: 0, max: 2, fill: "rgba(34,197,94,0.08)" },
    { min: 2, max: 5, fill: "rgba(234,179,8,0.08)" },
    { min: 5, max: 7, fill: "rgba(249,115,22,0.1)" },
    { min: 7, max: 10, fill: "rgba(239,68,68,0.1)" },
    { min: 10, max: maxUV, fill: "rgba(124,58,237,0.08)" },
  ];

  const uvLine = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(h.adjustedUV).toFixed(1)}`).join(" ");
  const protLine = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(h.protectedUV).toFixed(1)}`).join(" ");

  // X-axis labels (every 2 hours)
  const xLabels = hourly.filter((_, i) => i % 4 === 0 || i === hourly.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      {/* Band backgrounds */}
      {bands.map((b, i) => (
        <rect key={i} x={PAD.left} y={yScale(Math.min(b.max, maxUV))} width={cw}
          height={yScale(b.min) - yScale(Math.min(b.max, maxUV))} fill={b.fill} />
      ))}
      {/* Grid lines */}
      {[0, 2, 4, 6, 8, 10, 12].filter(v => v <= maxUV).map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={10} fill="#9CA3AF">{v}</text>
        </g>
      ))}
      {/* HSE 2 SED threshold label at UV 3 */}
      <line x1={PAD.left} y1={yScale(3)} x2={W - PAD.right} y2={yScale(3)} stroke="#EAB308" strokeWidth={1} strokeDasharray="4,3" />
      <text x={W - PAD.right - 2} y={yScale(3) - 4} textAnchor="end" fontSize={9} fill="#CA8A04">Moderate (UV 3+)</text>
      {/* UV line */}
      <path d={uvLine} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Protected line */}
      {showProtected && (
        <path d={protLine} fill="none" stroke="#22C55E" strokeWidth={2} strokeDasharray="6,3" strokeLinejoin="round" />
      )}
      {/* Data points */}
      {hourly.filter((_, i) => i % 2 === 0).map((h, idx) => {
        const i = hourly.indexOf(h);
        return <circle key={idx} cx={xScale(i)} cy={yScale(h.adjustedUV)} r={3} fill="#EF4444" />;
      })}
      {/* X labels */}
      {xLabels.map(h => {
        const i = hourly.indexOf(h);
        return (
          <text key={h.label} x={xScale(i)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize={10} fill="#6B7280">{h.label}</text>
        );
      })}
      {/* Axis labels */}
      <text x={PAD.left - 10} y={PAD.top - 6} textAnchor="start" fontSize={10} fill="#6B7280" fontWeight={600}>UV Index</text>
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="#6B7280">Time of Day</text>
      {/* Legend */}
      <line x1={W - PAD.right - 150} y1={PAD.top + 2} x2={W - PAD.right - 130} y2={PAD.top + 2} stroke="#EF4444" strokeWidth={2.5} />
      <text x={W - PAD.right - 126} y={PAD.top + 6} fontSize={9} fill="#6B7280">Unprotected</text>
      {showProtected && (
        <>
          <line x1={W - PAD.right - 150} y1={PAD.top + 16} x2={W - PAD.right - 130} y2={PAD.top + 16} stroke="#22C55E" strokeWidth={2} strokeDasharray="6,3" />
          <text x={W - PAD.right - 126} y={PAD.top + 20} fontSize={9} fill="#6B7280">Protected (with PPE)</text>
        </>
      )}
    </svg>
  );
}

// ─── SVG Chart — Cumulative SED ──────────────────────────────
function SEDAreaChart({ hourly, showProtected }: { hourly: HourlyUV[]; showProtected: boolean }) {
  if (hourly.length < 2) return null;
  const W = 700, H = 180, PAD = { top: 20, right: 20, bottom: 40, left: 45 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxSED = Math.max(3, hourly[hourly.length - 1].sed, hourly[hourly.length - 1].protectedSED) * 1.1;

  const xScale = (i: number) => PAD.left + (i / (hourly.length - 1)) * cw;
  const yScale = (v: number) => PAD.top + ch - (v / maxSED) * ch;

  const sedLine = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(h.sed).toFixed(1)}`).join(" ");
  const sedArea = sedLine + ` L${xScale(hourly.length - 1).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} Z`;

  const protLine = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(h.protectedSED).toFixed(1)}`).join(" ");

  const xLabels = hourly.filter((_, i) => i % 4 === 0 || i === hourly.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {/* Area fill */}
      <path d={sedArea} fill="rgba(239,68,68,0.1)" />
      {/* 2 SED threshold */}
      {maxSED >= 2 && (
        <>
          <line x1={PAD.left} y1={yScale(2)} x2={W - PAD.right} y2={yScale(2)} stroke="#DC2626" strokeWidth={1} strokeDasharray="4,3" />
          <text x={W - PAD.right - 2} y={yScale(2) - 4} textAnchor="end" fontSize={9} fill="#DC2626" fontWeight={600}>HSE 2 SED limit</text>
        </>
      )}
      {/* Grid */}
      {[0, 1, 2, 3, 4, 5].filter(v => v <= maxSED).map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={10} fill="#9CA3AF">{v}</text>
        </g>
      ))}
      {/* SED line */}
      <path d={sedLine} fill="none" stroke="#EF4444" strokeWidth={2} />
      {/* Protected SED line */}
      {showProtected && (
        <path d={protLine} fill="none" stroke="#22C55E" strokeWidth={2} strokeDasharray="6,3" />
      )}
      {/* X labels */}
      {xLabels.map(h => {
        const i = hourly.indexOf(h);
        return <text key={h.label} x={xScale(i)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize={10} fill="#6B7280">{h.label}</text>;
      })}
      <text x={PAD.left - 10} y={PAD.top - 6} textAnchor="start" fontSize={10} fill="#6B7280" fontWeight={600}>Cumulative SED</text>
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="#6B7280">Time of Day</text>
    </svg>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  cityName: string,
  lat: number,
  assessDate: string,
  startHour: number,
  endHour: number,
  cloudCover: CloudCover,
  altitudeM: number,
  skinType: SkinType | null,
  ppe: PPEControls,
  assessment: UVAssessment,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  let y = 0;

  const docRef = `UVI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("UV INDEX EXPOSURE ASSESSMENT", M, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("HSE UV Guidance / WHO UV Index -- ebrora.com/tools/uv-index-exposure-checker", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 25, 1, 1, "FD");
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
  drawFld("Location:", cityName || `Lat ${lat.toFixed(2)}`, M + 3, y, 0);
  drawFld("Assessment Date:", assessDate, M + halfW, y, 0);
  y += 5;
  drawFld("Working Hours:", `${startHour}:00 -- ${endHour}:00`, M + 3, y, 0);
  drawFld("Cloud Cover:", CLOUD_MULTIPLIERS[cloudCover].label, M + halfW, y, 0);
  y += 8;

  // ── Scope statement
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  const scopeText = `This UV exposure assessment covers ${header.site || "the above site"} for ${assessDate}. Working hours: ${startHour}:00-${endHour}:00. Cloud cover: ${CLOUD_MULTIPLIERS[cloudCover].label}. Altitude: ${altitudeM}m. Skin type: ${skinType ? skinType.label : "Not specified"}. PPE controls: ${ppe.enabled ? "Applied" : "None"}. This is a screening tool based on solar position calculations and WHO/WMO UV index data for mid-latitudes. Actual UV conditions may vary.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69);
      doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("UV INDEX EXPOSURE ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0);
      y = 14;
    }
  }

  // ── Risk Rating Banner
  const riskBand = getRiskBand(assessment.riskCategory);
  const riskRGB = assessment.riskCategory === "low" ? [22, 163, 74]
    : assessment.riskCategory === "moderate" ? [234, 179, 8]
    : assessment.riskCategory === "high" ? [249, 115, 22]
    : assessment.riskCategory === "very-high" ? [239, 68, 68]
    : [124, 58, 237];
  doc.setFillColor(riskRGB[0], riskRGB[1], riskRGB[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`PEAK UV RISK: ${riskBand.label.toUpperCase()} (UV ${formatUV(assessment.peakUV)})`, M + 5, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Peak at ${assessment.peakTime} | Total SED: ${formatSED(assessment.totalSED)} | HSE limit: 2 SED/day`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0);
  y += 20;

  // ── Summary Box
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M, y);
  y += 5;

  const summaryItems = [
    ["Peak UV Index", formatUV(assessment.peakUV)],
    ["Peak Time", assessment.peakTime],
    ["Total SED (unprotected)", formatSED(assessment.totalSED)],
    ["Total SED (with PPE)", ppe.enabled ? formatSED(assessment.protectedSED) : "N/A"],
    ["HSE SED Threshold", "2.0 SED/day"],
    ["Exceeds Threshold?", assessment.totalSED > 2 ? "YES" : "NO"],
    ["Skin Type", skinType ? skinType.label : "Not specified"],
    ["Est. Burn Time (peak UV)", assessment.burnTimeMinutes !== null ? fmtMins(assessment.burnTimeMinutes) : "N/A"],
  ];

  const sumCols = [0, 60];
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", M + sumCols[0], y);
    doc.setFont("helvetica", "normal");
    doc.text(value, M + sumCols[1], y);
    y += 4;
  });
  y += 4;

  // ── Hourly UV Table
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Hourly UV Index Readings", M, y);
  y += 5;

  // Header row
  const cols = [18, 22, 22, 28, 24, 24, 24, 20];
  const headers = ["Time", "Solar El.", "Clear UV", "Adjusted UV", "Risk", "SED", "Prot. SED", "Prot. UV"];
  let cx = M;
  headers.forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
    doc.text(h, cx + 1.5, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  // Data rows (every 30 min)
  assessment.hourly.forEach((h, idx) => {
    checkPage(5);
    const isHighlight = h.adjustedUV >= 6;
    cx = M;
    const rowData = [
      h.label,
      `${h.solarElevation.toFixed(1)}`,
      formatUV(h.clearSkyUV),
      formatUV(h.adjustedUV),
      getRiskBand(h.risk).label,
      formatSED(h.sed),
      ppe.enabled ? formatSED(h.protectedSED) : "--",
      ppe.enabled ? formatUV(h.protectedUV) : "--",
    ];
    rowData.forEach((t, i) => {
      if (isHighlight) { doc.setFillColor(254, 226, 226); doc.rect(cx, y, cols[i], 5, "FD"); }
      else if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 1.5, y + 3.5);
      cx += cols[i];
    });
    y += 5;
  });
  y += 6;

  // ── Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommended Controls", M, y);
  y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  assessment.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3.5;
  });
  y += 3;

  // Shade breaks
  if (assessment.shadeBreaks.length > 0) {
    checkPage(12);
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Shade Break Schedule", M, y);
    y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    assessment.shadeBreaks.forEach(sb => {
      const lines = doc.splitTextToSize(`- ${sb}`, CW - 4);
      doc.text(lines, M + 2, y);
      y += lines.length * 3.5;
    });
    y += 3;
  }

  // ── PPE Controls Applied
  if (ppe.enabled) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("PPE Controls Applied", M, y);
    y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    const ppeItems = [];
    if (ppe.sunscreen) ppeItems.push("SPF 30+ sunscreen (50% dose reduction)");
    if (ppe.hat) ppeItems.push("Broad-brimmed hat / hard hat neck flap (30% face/neck reduction)");
    if (ppe.longSleeves) ppeItems.push("Long-sleeved clothing (15% body reduction)");
    if (ppe.shade) ppeItems.push("Shade breaks taken (25% cumulative reduction)");
    if (ppeItems.length === 0) ppeItems.push("PPE toggle enabled but no controls selected");
    ppeItems.forEach(item => {
      doc.text(`- ${item}`, M + 2, y);
      y += 3.5;
    });
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text(`SED reduction: ${formatSED(assessment.totalSED)} --> ${formatSED(assessment.protectedSED)} SED (${Math.round((1 - assessment.protectedSED / Math.max(assessment.totalSED, 0.01)) * 100)}% reduction)`, M + 2, y);
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y);
  y += 6;

  const soW = CW / 2 - 2;
  const soH = 8;
  doc.setDrawColor(200, 200, 200);
  doc.setFontSize(7.5);
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

  // ── Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "This UV exposure assessment is a screening tool based on solar position calculations and WHO/WMO UV data. It does not replace a formal risk assessment. Actual UV conditions may vary.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }

  doc.save(`uv-exposure-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function UVIndexExposureCheckerClient() {
  // Settings
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Inputs
  const [cityIdx, setCityIdx] = useState<number>(30); // Stockport default
  const [manualLat, setManualLat] = useState<number>(53.41);
  const [useManual, setUseManual] = useState(false);
  const [calcDate, setCalcDate] = useState(todayISO());
  const [startHour, setStartHour] = useState<number>(7);
  const [endHour, setEndHour] = useState<number>(18);
  const [cloudCover, setCloudCover] = useState<CloudCover>("clear");
  const [altitude, setAltitude] = useState<number>(0);
  const [skinIdx, setSkinIdx] = useState<number>(2); // Type III default
  const [useSkin, setUseSkin] = useState(true);
  const [ppe, setPPE] = useState<PPEControls>({ enabled: false, sunscreen: false, hat: false, longSleeves: false, shade: false });

  const lat = useManual ? manualLat : UK_CITIES[cityIdx]?.lat ?? 53.41;
  const cityName = useManual ? `Manual (${manualLat.toFixed(2)})` : UK_CITIES[cityIdx]?.name ?? "Stockport";
  const skinType = useSkin ? SKIN_TYPES[skinIdx] : null;
  const dateObj = new Date(calcDate + "T12:00:00");

  // Compute assessment
  const assessment = useMemo(() => {
    return calculateAssessment(lat, dateObj, startHour, endHour, cloudCover, altitude, skinType, ppe);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, calcDate, startHour, endHour, cloudCover, altitude, skinIdx, useSkin, ppe.enabled, ppe.sunscreen, ppe.hat, ppe.longSleeves, ppe.shade]);

  const hasData = assessment.hourly.length > 0 && assessment.peakUV > 0;
  const riskBand = getRiskBand(assessment.riskCategory);

  // Sunrise/sunset info
  const doy = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / 86400000);
  const bstOffset = isBST(dateObj) ? 1 : 0;
  const [srUTC, ssUTC] = sunriseSunset(lat, doy);
  const srLocal = srUTC + bstOffset;
  const ssLocal = ssUTC + bstOffset;
  const srStr = `${Math.floor(srLocal).toString().padStart(2, "0")}:${Math.round((srLocal % 1) * 60).toString().padStart(2, "0")}`;
  const ssStr = `${Math.floor(ssLocal).toString().padStart(2, "0")}:${Math.round((ssLocal % 1) * 60).toString().padStart(2, "0")}`;
  const daylightHrs = (ssLocal - srLocal).toFixed(1);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPDF(
        { site, manager, assessedBy, date: assessDate },
        cityName, lat, calcDate, startHour, endHour, cloudCover, altitude,
        skinType, ppe, assessment,
      );
    } finally { setExporting(false); }
  }, [site, manager, assessedBy, assessDate, cityName, lat, calcDate, startHour, endHour, cloudCover, altitude, skinType, ppe, assessment]);

  const clearAll = useCallback(() => {
    setCityIdx(30); setManualLat(53.41); setUseManual(false);
    setCalcDate(todayISO()); setStartHour(7); setEndHour(18);
    setCloudCover("clear"); setAltitude(0); setSkinIdx(2); setUseSkin(true);
    setPPE({ enabled: false, sunscreen: false, hat: false, longSleeves: false, shade: false });
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const togglePPE = (key: keyof Omit<PPEControls, "enabled">) => {
    setPPE(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Peak UV Index", value: formatUV(assessment.peakUV), sub: `at ${assessment.peakTime}`, ...riskBand },
            { label: "Total SED", value: formatSED(assessment.totalSED), sub: assessment.totalSED > 2 ? "Exceeds HSE 2 SED limit" : "Within HSE 2 SED limit", bgClass: assessment.totalSED > 2 ? "bg-red-50" : "bg-emerald-50", textClass: assessment.totalSED > 2 ? "text-red-800" : "text-emerald-800", borderClass: assessment.totalSED > 2 ? "border-red-200" : "border-emerald-200", dotClass: assessment.totalSED > 2 ? "bg-red-500" : "bg-emerald-500" },
            { label: "Est. Burn Time", value: assessment.burnTimeMinutes !== null ? fmtMins(assessment.burnTimeMinutes) : "--", sub: skinType ? skinType.label : "No skin type set", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
            { label: "Daylight", value: `${daylightHrs}h`, sub: `${srStr} -- ${ssStr} (${isBST(dateObj) ? "BST" : "GMT"})`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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

      {/* ── SED Warning ───────────────────────────────────── */}
      {hasData && assessment.totalSED > 2 && !ppe.enabled && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">Daily SED Exceeds HSE Guidance Threshold</div>
            <div className="text-xs text-red-800 mt-1">
              Total unprotected SED of {formatSED(assessment.totalSED)} exceeds the HSE recommended limit of approximately 2 SED per day for unprotected skin. Enable PPE controls below to see the effect of sun protection measures.
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
        <button onClick={handleExport} disabled={!hasData || exporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
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
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Assessment Inputs</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</label>
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setUseManual(false)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${!useManual ? "bg-ebrora text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                UK City
              </button>
              <button onClick={() => setUseManual(true)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${useManual ? "bg-ebrora text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Manual Lat
              </button>
            </div>
            {!useManual ? (
              <select value={cityIdx} onChange={e => setCityIdx(parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
                {UK_CITIES.map((c, i) => (
                  <option key={c.name} value={i}>{c.name} ({c.lat.toFixed(2)}N) - {c.region}</option>
                ))}
              </select>
            ) : (
              <input type="number" value={manualLat} onChange={e => setManualLat(parseFloat(e.target.value) || 51)} step={0.01} min={49} max={61}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" placeholder="Latitude (49-61)" />
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Assessment Date</label>
            <input type="date" value={calcDate} onChange={e => setCalcDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">
              Sunrise: {srStr} | Sunset: {ssStr} | {isBST(dateObj) ? "BST" : "GMT"} | {daylightHrs}h daylight
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Working Hours</label>
            <div className="flex items-center gap-2">
              <select value={startHour} onChange={e => setStartHour(parseInt(e.target.value))}
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none">
                {Array.from({ length: 14 }, (_, i) => i + 5).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
              <span className="text-xs text-gray-400">to</span>
              <select value={endHour} onChange={e => setEndHour(parseInt(e.target.value))}
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none">
                {Array.from({ length: 14 }, (_, i) => i + 10).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cloud Cover */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Cloud Cover</label>
            <select value={cloudCover} onChange={e => setCloudCover(e.target.value as CloudCover)}
              className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {(Object.entries(CLOUD_MULTIPLIERS) as [CloudCover, typeof CLOUD_MULTIPLIERS[CloudCover]][]).map(([key, val]) => (
                <option key={key} value={key}>{val.label} (x{val.factor})</option>
              ))}
            </select>
          </div>

          {/* Altitude */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Altitude (m above sea level)</label>
            <input type="number" value={altitude} onChange={e => setAltitude(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={1500}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">+6% UV per 1000m elevation</div>
          </div>

          {/* Skin Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-2">
                Skin Type (Fitzpatrick)
                <button onClick={() => setUseSkin(!useSkin)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${useSkin ? "bg-ebrora" : "bg-gray-300"}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useSkin ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </span>
            </label>
            {useSkin && (
              <select value={skinIdx} onChange={e => setSkinIdx(parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
                {SKIN_TYPES.map((st, i) => (
                  <option key={st.type} value={i}>{st.label}</option>
                ))}
              </select>
            )}
            {useSkin && skinType && (
              <div className="text-[10px] text-gray-400 mt-1">{skinType.description}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── PPE Controls Toggle ────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">PPE / Sun Protection Controls</h3>
          <button onClick={() => setPPE(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${ppe.enabled ? "bg-ebrora" : "bg-gray-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ppe.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {ppe.enabled && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: "sunscreen" as const, label: "SPF 30+ Sunscreen", desc: "50% dose reduction", icon: "S" },
              { key: "hat" as const, label: "Broad-Brimmed Hat", desc: "30% face/neck reduction", icon: "H" },
              { key: "longSleeves" as const, label: "Long Sleeves", desc: "15% body reduction", icon: "L" },
              { key: "shade" as const, label: "Shade Breaks", desc: "25% cumulative reduction", icon: "R" },
            ]).map(ctrl => (
              <button key={ctrl.key} onClick={() => togglePPE(ctrl.key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  ppe[ctrl.key]
                    ? "border-ebrora bg-ebrora-light/40 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${ppe[ctrl.key] ? "bg-ebrora text-white" : "bg-gray-200 text-gray-500"}`}>
                    {ctrl.icon}
                  </span>
                  <span className={`text-xs font-bold ${ppe[ctrl.key] ? "text-ebrora-dark" : "text-gray-700"}`}>{ctrl.label}</span>
                </div>
                <p className="text-[10px] text-gray-500">{ctrl.desc}</p>
              </button>
            ))}
          </div>
        )}
        {ppe.enabled && hasData && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
            Protected SED: <strong>{formatSED(assessment.protectedSED)}</strong> (reduced from {formatSED(assessment.totalSED)}) -- {Math.round((1 - assessment.protectedSED / Math.max(assessment.totalSED, 0.01)) * 100)}% reduction
          </div>
        )}
      </div>

      {/* ── UV Line Chart ──────────────────────────────────── */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">UV Index Across Working Day</h3>
          <p className="text-[11px] text-gray-400">Shaded bands show WHO/HSE risk categories. Red line = unprotected UV. Green dashed = protected (with PPE).</p>
          <UVLineChart hourly={assessment.hourly} showProtected={ppe.enabled} />
        </div>
      )}

      {/* ── Cumulative SED Chart ───────────────────────────── */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Cumulative Standard Erythemal Dose (SED)</h3>
          <p className="text-[11px] text-gray-400">Red dashed line = HSE guidance threshold of 2 SED/day for unprotected skin.</p>
          <SEDAreaChart hourly={assessment.hourly} showProtected={ppe.enabled} />
        </div>
      )}

      {/* ── Hourly Breakdown Table ─────────────────────────── */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Hourly UV Breakdown</h3>
          </div>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Time", "Solar El.", "Clear UV", "Adj. UV", "Risk", "Cum. SED", ...(ppe.enabled ? ["Prot. UV", "Prot. SED"] : [])].map(h => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessment.hourly.map(h => {
                  const band = getRiskBand(h.risk);
                  return (
                    <tr key={h.label} className={h.adjustedUV >= 6 ? "bg-red-50/50" : ""}>
                      <td className="px-3 py-1.5 font-medium text-gray-800">{h.label}</td>
                      <td className="px-3 py-1.5 text-gray-600">{h.solarElevation.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{formatUV(h.clearSkyUV)}</td>
                      <td className="px-3 py-1.5 font-medium text-gray-800">{formatUV(h.adjustedUV)}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${band.bgClass} ${band.textClass}`}>{band.label}</span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{formatSED(h.sed)}</td>
                      {ppe.enabled && (
                        <>
                          <td className="px-3 py-1.5 text-emerald-700 font-medium">{formatUV(h.protectedUV)}</td>
                          <td className="px-3 py-1.5 text-emerald-700">{formatSED(h.protectedSED)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {assessment.hourly.filter((_, i) => i % 2 === 0).map(h => {
              const band = getRiskBand(h.risk);
              return (
                <div key={h.label} className={`px-4 py-3 ${h.adjustedUV >= 6 ? "bg-red-50/50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-800">{h.label}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${band.bgClass} ${band.textClass}`}>{band.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-400">UV: </span><span className="font-medium">{formatUV(h.adjustedUV)}</span></div>
                    <div><span className="text-gray-400">SED: </span><span>{formatSED(h.sed)}</span></div>
                    <div><span className="text-gray-400">Elev: </span><span>{h.solarElevation.toFixed(1)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recommendations ────────────────────────────────── */}
      {hasData && assessment.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Recommended Controls</h3>
          </div>
          <div className="px-4 py-3 space-y-2">
            {assessment.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-ebrora font-bold mt-0.5">-</span>
                <span>{rec}</span>
              </div>
            ))}
            {assessment.shadeBreaks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Shade Break Schedule</div>
                {assessment.shadeBreaks.map((sb, i) => (
                  <div key={i} className="flex gap-2 text-sm text-orange-700 font-medium">
                    <span>-</span><span>{sb}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Risk Band Key ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {RISK_BANDS.map(b => (
          <div key={b.category} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${b.bgClass} ${b.textClass} border ${b.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${b.dotClass}`} />
            {b.label} (UV {b.min}{b.max < 99 ? `-${b.max}` : "+"})
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on solar position calculations, WHO/WMO UV index data for mid-latitudes, and HSE UV at work guidance.
          This is a screening tool - it does not replace a formal UV risk assessment. Actual UV conditions may vary due to
          local factors including reflected UV, atmospheric conditions, and ozone levels. SED threshold per HSE INDG147.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
