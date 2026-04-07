// src/components/scaffold-load-calculator/ScaffoldLoadCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  DUTY_CLASSES, SCAFFOLD_TYPES, WIND_ZONES, LIFT_HEIGHT, UTIL_STYLES,
  calculateScaffoldLoads,
} from "@/data/scaffold-load-calculator";
import type { ScaffoldType, DutyClass, WindZone, ScaffoldResult } from "@/data/scaffold-load-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Stacked Load Bar ────────────────────────────────────
function LoadStackedBar({ result }: { result: ScaffoldResult }) {
  const { loads } = result;
  const W = 400, H = 120, PAD = { left: 10, right: 80, top: 10, bottom: 25 };
  const cw = W - PAD.left - PAD.right;
  const maxLoad = Math.max(loads.totalLoadPerStandard, loads.allowableCapacity) * 1.1;
  const barH = 30;
  const scale = (v: number) => (v / maxLoad) * cw;

  const deadW = scale(loads.deadLoadPerStandard);
  const impW = scale(loads.imposedLoadPerStandard);
  const windW = scale(loads.windLoadPerStandard);
  const capX = PAD.left + scale(loads.allowableCapacity);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 140 }}>
      {/* Stacked bar */}
      <rect x={PAD.left} y={PAD.top} width={deadW} height={barH} fill="#6B7280" rx={2} />
      <rect x={PAD.left + deadW} y={PAD.top} width={impW} height={barH} fill="#3B82F6" rx={0} />
      <rect x={PAD.left + deadW + impW} y={PAD.top} width={windW} height={barH} fill="#F97316" rx={2} />
      {/* Capacity line */}
      <line x1={capX} y1={PAD.top - 5} x2={capX} y2={PAD.top + barH + 5} stroke="#EF4444" strokeWidth={2} strokeDasharray="4,2" />
      <text x={capX} y={PAD.top + barH + 18} textAnchor="middle" fontSize={8} fill="#EF4444" fontWeight={600}>Capacity: {loads.allowableCapacity} kN</text>
      {/* Total label */}
      <text x={PAD.left + deadW + impW + windW + 4} y={PAD.top + barH / 2 + 3} fontSize={10} fontWeight={700} fill="#374151">{loads.totalLoadPerStandard} kN</text>
      <text x={PAD.left + deadW + impW + windW + 4} y={PAD.top + barH / 2 + 14} fontSize={8} fill="#6B7280">({loads.utilisationPercent}%)</text>
      {/* Legend */}
      {[{ c: "#6B7280", l: `Dead: ${loads.deadLoadPerStandard} kN` }, { c: "#3B82F6", l: `Imposed: ${loads.imposedLoadPerStandard} kN` }, { c: "#F97316", l: `Wind: ${loads.windLoadPerStandard} kN` }].map((item, i) => (
        <g key={i}><rect x={PAD.left + i * 110} y={H - 12} width={8} height={8} fill={item.c} rx={1} />
          <text x={PAD.left + i * 110 + 12} y={H - 4} fontSize={8} fill="#6B7280">{item.l}</text></g>
      ))}
    </svg>
  );
}

// ─── SVG Utilisation Gauge ───────────────────────────────────
function UtilGauge({ percent, level }: { percent: number; level: string }) {
  const W = 200, H = 120, cx = 100, cy = 100, r = 75;
  const clamp = Math.min(150, Math.max(0, percent));
  const ratio = clamp / 150;
  const angle = Math.PI - ratio * Math.PI;
  const nx = cx + (r - 10) * Math.cos(angle);
  const ny = cy - (r - 10) * Math.sin(angle);
  const segments = [
    { s: 0, e: 80 / 150, fill: "#22C55E" },
    { s: 80 / 150, e: 100 / 150, fill: "#EAB308" },
    { s: 100 / 150, e: 1, fill: "#EF4444" },
  ];
  const arc = (s: number, e: number) => {
    const a1 = Math.PI - s * Math.PI, a2 = Math.PI - e * Math.PI;
    return `M ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)} A ${r} ${r} 0 ${Math.abs(e - s) > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(a2)} ${cy - r * Math.sin(a2)}`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 130 }}>
      {segments.map((s, i) => <path key={i} d={arc(s.s, s.e)} fill="none" stroke={s.fill} strokeWidth={14} />)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1B5745" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#1B5745" />
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1B5745">{percent}%</text>
    </svg>
  );
}

// ─── SVG Duty Class Comparison ───────────────────────────────
function DutyComparisonChart({ result }: { result: ScaffoldResult }) {
  const data = result.dutyClassComparison;
  const W = 500, H = 160, PAD = { top: 15, right: 15, bottom: 30, left: 55 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const barW = Math.min(50, cw / data.length * 0.7);
  const gap = (cw - barW * data.length) / (data.length + 1);
  const maxTotal = Math.max(...data.map(d => d.total), result.loads.allowableCapacity) * 1.1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
      {/* Capacity line */}
      <line x1={PAD.left} y1={PAD.top + ch - (result.loads.allowableCapacity / maxTotal) * ch} x2={W - PAD.right} y2={PAD.top + ch - (result.loads.allowableCapacity / maxTotal) * ch} stroke="#EF4444" strokeWidth={1} strokeDasharray="4,2" />
      <text x={W - PAD.right - 2} y={PAD.top + ch - (result.loads.allowableCapacity / maxTotal) * ch - 3} textAnchor="end" fontSize={7} fill="#EF4444">Capacity</text>
      {data.map((d, i) => {
        const x = PAD.left + gap + i * (barW + gap);
        const barHeight = (d.total / maxTotal) * ch;
        const y = PAD.top + ch - barHeight;
        const colour = d.utilisation <= 80 ? "#22C55E" : d.utilisation <= 100 ? "#EAB308" : "#EF4444";
        const isCurrent = d.dutyClass === DUTY_CLASSES.find(dc => dc.cls === result.dutyClassComparison.find(c => c.utilisation === result.loads.utilisationPercent)?.dutyClass)?.cls;
        return (
          <g key={d.dutyClass}>
            <rect x={x} y={y} width={barW} height={barHeight} fill={colour} rx={2} opacity={0.8} stroke={isCurrent ? "#1B5745" : "none"} strokeWidth={2} />
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={8} fontWeight={600} fill={colour}>{d.total} kN</text>
            <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize={7} fill="#6B7280">{d.utilisation}%</text>
            <text x={x + barW / 2} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={7} fill="#6B7280">Class {d.dutyClass}</text>
          </g>
        );
      })}
      <text x={PAD.left - 4} y={PAD.top - 2} fontSize={9} fontWeight={600} fill="#6B7280">Load (kN)</text>
    </svg>
  );
}

// ─── SVG Sheeted vs Unsheeted ────────────────────────────────
function SheetedComparisonBar({ result }: { result: ScaffoldResult }) {
  if (!result.loadsUnsheeted) return null;
  const sheeted = result.loads;
  const open = result.loadsUnsheeted;
  const W = 400, H = 90, PAD = { left: 80, right: 60, top: 10, bottom: 10 };
  const cw = W - PAD.left - PAD.right;
  const maxW = Math.max(sheeted.windLoadPerStandard, open.windLoadPerStandard) * 1.2;
  const barH = 22;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
      <text x={PAD.left - 4} y={PAD.top + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>Sheeted</text>
      <rect x={PAD.left} y={PAD.top} width={(sheeted.windLoadPerStandard / maxW) * cw} height={barH} fill="#F97316" rx={2} />
      <text x={PAD.left + (sheeted.windLoadPerStandard / maxW) * cw + 4} y={PAD.top + barH / 2 + 3} fontSize={9} fontWeight={600} fill="#F97316">{sheeted.windLoadPerStandard} kN</text>

      <text x={PAD.left - 4} y={PAD.top + barH + 10 + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>Open</text>
      <rect x={PAD.left} y={PAD.top + barH + 10} width={(open.windLoadPerStandard / maxW) * cw} height={barH} fill="#22C55E" rx={2} />
      <text x={PAD.left + (open.windLoadPerStandard / maxW) * cw + 4} y={PAD.top + barH + 10 + barH / 2 + 3} fontSize={9} fontWeight={600} fill="#22C55E">{open.windLoadPerStandard} kN</text>
    </svg>
  );
}

// ─── PDF Export (PAID = dark header) ─────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  inputs: ScaffoldInputs, result: ScaffoldResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `SCF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const utilStyle = UTIL_STYLES[result.loads.utilisationLevel];
  const height = inputs.numLifts * LIFT_HEIGHT;

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("SCAFFOLD LOAD ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("BS EN 12811-1 / BS 5975 / SG4:10 / NASC TG20 / BS EN 12810-1", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 40, 1, 1, "FD"); doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Site:", header.site, M + halfW, y, 40);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 50);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  const dutyData = DUTY_CLASSES.find(d => d.cls === inputs.dutyClass)!;
  drawFld("Duty Class:", dutyData.label, M + halfW, y, 0);
  y += 5;
  drawFld("Type:", SCAFFOLD_TYPES.find(t => t.type === inputs.scaffoldType)!.label, M + 3, y, 0);
  drawFld("Height:", `${height.toFixed(1)}m (${inputs.numLifts} lifts)`, M + halfW, y, 0);
  y += 5;
  drawFld("Bay:", `${inputs.bayWidth}m W x ${inputs.bayLength}m L`, M + 3, y, 0);
  drawFld("Wind Zone:", WIND_ZONES.find(w => w.zone === inputs.windZone)!.label, M + halfW, y, 0);
  y += 5;
  drawFld("Sheeted:", inputs.sheeted ? "Yes" : "No", M + 3, y, 0);
  drawFld("Debris Net:", inputs.debrisNet ? "Yes" : "No", M + 50, y, 0);
  drawFld("Freestanding:", inputs.freestanding ? "Yes" : "No", M + halfW, y, 0);
  y += 5;
  drawFld("Loaded Bays:", String(inputs.loadedBays), M + 3, y, 0);
  y += 8;

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("SCAFFOLD LOAD ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Utilisation banner
  const rgb = result.loads.utilisationLevel === "safe" ? [22, 163, 74] : result.loads.utilisationLevel === "marginal" ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`UTILISATION: ${result.loads.utilisationPercent}% -- ${utilStyle.label.toUpperCase()}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Total: ${result.loads.totalLoadPerStandard} kN per standard | Capacity: ${result.loads.allowableCapacity} kN`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // Load breakdown (coloured panel)
  checkPage(40);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 30, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Load Breakdown per Standard", M + 4, y + 2); y += 6;
  const items = [
    ["Dead Load (self-weight)", `${result.loads.deadLoadPerStandard} kN`, [100, 116, 139]],
    ["Imposed Load (platform)", `${result.loads.imposedLoadPerStandard} kN`, [59, 130, 246]],
    ["Wind Load", `${result.loads.windLoadPerStandard} kN`, [234, 88, 12]],
    ["TOTAL", `${result.loads.totalLoadPerStandard} kN`, [17, 24, 39]],
    ["Allowable Capacity", `${result.loads.allowableCapacity} kN`, [100, 116, 139]],
    ["Utilisation", `${result.loads.utilisationPercent}%`, rgb],
  ];
  items.forEach(([label, value, colour]) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", label === "TOTAL" || label === "Utilisation" ? "bold" : "normal");
    doc.setTextColor(55, 65, 81); doc.text(label + ":", M + 4, y);
    const c = colour as number[];
    doc.setTextColor(c[0], c[1], c[2]); doc.setFont("helvetica", "bold");
    doc.text(value as string, M + 59, y);
    doc.setTextColor(0, 0, 0);
    y += 3.8;
  });
  y += 5;

  // Stacked bar chart
  checkPage(60);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Load Component Breakdown", M, y);
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Stacked bar showing dead, imposed, and wind load components per standard at base level.", M, y + 4);
  doc.setTextColor(0, 0, 0); y += 8;

  {
    const barX = M + 30, barW = CW - 60, barH = 14;
    const total = result.loads.totalLoadPerStandard;
    const cap = result.loads.allowableCapacity;
    const scale = barW / cap;
    const deadW = result.loads.deadLoadPerStandard * scale;
    const impW = result.loads.imposedLoadPerStandard * scale;
    const windW = result.loads.windLoadPerStandard * scale;

    // Capacity outline
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.rect(barX, y, barW, barH, "D");

    // Stacked bars
    let bx = barX;
    doc.setFillColor(100, 116, 139); doc.rect(bx, y, deadW, barH, "F"); bx += deadW;
    doc.setFillColor(59, 130, 246); doc.rect(bx, y, impW, barH, "F"); bx += impW;
    doc.setFillColor(234, 88, 12); doc.rect(bx, y, windW, barH, "F");

    // Utilisation line
    const utilX = barX + total * scale;
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]); doc.setLineWidth(0.5);
    doc.line(utilX, y - 2, utilX, y + barH + 2);
    doc.setFontSize(5); doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(`${result.loads.utilisationPercent}%`, utilX + 1, y - 1);

    // Legend
    const legY = y + barH + 5;
    doc.setFontSize(5); doc.setTextColor(80, 80, 80);
    doc.setFillColor(100, 116, 139); doc.rect(barX, legY, 4, 2.5, "F");
    doc.text(`Dead (${result.loads.deadLoadPerStandard} kN)`, barX + 6, legY + 2);
    doc.setFillColor(59, 130, 246); doc.rect(barX + 40, legY, 4, 2.5, "F");
    doc.text(`Imposed (${result.loads.imposedLoadPerStandard} kN)`, barX + 46, legY + 2);
    doc.setFillColor(234, 88, 12); doc.rect(barX + 90, legY, 4, 2.5, "F");
    doc.text(`Wind (${result.loads.windLoadPerStandard} kN)`, barX + 96, legY + 2);

    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = legY + 8;
  }

  // Tie calculation
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Tie Calculation", M, y); y += 5;
  [
    ["Wind force per bay", `${result.tieCalc.windForcePerBay} kN`],
    ["Tie capacity (through-tie)", `${result.tieCalc.tieCapacity} kN`],
    ["Max tie spacing (H x V)", `${result.tieCalc.maxTieSpacingH}m x ${result.tieCalc.maxTieSpacingV}m`],
    ["Ties required", String(result.tieCalc.tiesRequired)],
  ].forEach(([l, v]) => { doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(l + ":", M, y); doc.setFont("helvetica", "normal"); doc.text(v, M + 55, y); y += 4; });
  y += 3;

  // Recommendations
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6); const lines = doc.splitTextToSize(`- ${rec}`, CW - 4); doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });

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

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Scaffold load assessment per BS EN 12811-1, BS 5975, and SG4:10. This is a screening tool -- it does not replace a structural design calculation by a competent scaffold designer.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`scaffold-load-assessment-${todayISO()}.pdf`);
}

// ─── Scaffold Inputs Interface for state ─────────────────────
interface ScaffoldInputs {
  scaffoldType: ScaffoldType; numLifts: number; bayWidth: number; bayLength: number;
  dutyClass: DutyClass; loadedBays: number; sheeted: boolean; debrisNet: boolean;
  windZone: WindZone; freestanding: boolean; scaffoldHeight: number;
}

// ─── Main Component ──────────────────────────────────────────
export default function ScaffoldLoadCalculatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [scaffoldType, setScaffoldType] = useState<ScaffoldType>("tube-fitting");
  const [numLifts, setNumLifts] = useState<number>(5);
  const [bayWidth, setBayWidth] = useState<number>(1.3);
  const [bayLength, setBayLength] = useState<number>(2.4);
  const [dutyClass, setDutyClass] = useState<DutyClass>(3);
  const [loadedBays, setLoadedBays] = useState<number>(2);
  const [sheeted, setSheeted] = useState(false);
  const [debrisNet, setDebrisNet] = useState(false);
  const [windZone, setWindZone] = useState<WindZone>("normal");
  const [freestanding, setFreestanding] = useState(false);

  const scaffoldHeight = numLifts * LIFT_HEIGHT;
  const inputs: ScaffoldInputs = { scaffoldType, numLifts, bayWidth, bayLength, dutyClass, loadedBays, sheeted, debrisNet, windZone, freestanding, scaffoldHeight };
  const result = useMemo(() => calculateScaffoldLoads(inputs), [scaffoldType, numLifts, bayWidth, bayLength, dutyClass, loadedBays, sheeted, debrisNet, windZone, freestanding]);
  const utilStyle = UTIL_STYLES[result.loads.utilisationLevel];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, inputs, result); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, inputs, result]);

  const clearAll = useCallback(() => {
    setScaffoldType("tube-fitting"); setNumLifts(5); setBayWidth(1.3); setBayLength(2.4);
    setDutyClass(3); setLoadedBays(2); setSheeted(false); setDebrisNet(false);
    setWindZone("normal"); setFreestanding(false);
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Utilisation", value: `${result.loads.utilisationPercent}%`, sub: utilStyle.label, ...utilStyle },
          { label: "Total / Standard", value: `${result.loads.totalLoadPerStandard} kN`, sub: `Capacity: ${result.loads.allowableCapacity} kN`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Ties Required", value: String(result.tieCalc.tiesRequired), sub: `${result.tieCalc.maxTieSpacingH}m H x ${result.tieCalc.maxTieSpacingV}m V`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Design Check", value: result.needsDesignCheck ? "REQUIRED" : "Not required", sub: result.needsDesignCheck ? "See recommendations" : "Standard configuration", bgClass: result.needsDesignCheck ? "bg-orange-50" : "bg-emerald-50", textClass: result.needsDesignCheck ? "text-orange-800" : "text-emerald-800", borderClass: result.needsDesignCheck ? "border-orange-200" : "border-emerald-200", dotClass: result.needsDesignCheck ? "bg-orange-500" : "bg-emerald-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Overloaded Warning */}
      {result.loads.utilisationLevel === "overloaded" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">SCAFFOLD OVERLOADED</div>
            <div className="text-xs text-red-800 mt-1">Standard utilisation exceeds 100%. This scaffold configuration must be redesigned before use. Reduce the loading, add intermediate standards, or reduce lift height.</div></div>
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
        <h3 className="text-sm font-bold text-gray-700">Scaffold Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Scaffold Type</label>
            <select value={scaffoldType} onChange={e => setScaffoldType(e.target.value as ScaffoldType)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {SCAFFOLD_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Lifts</label>
            <input type="number" value={numLifts} onChange={e => setNumLifts(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={30}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">Height: {scaffoldHeight.toFixed(1)}m ({numLifts} x {LIFT_HEIGHT}m lifts)</div></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Duty Class (BS EN 12811-1)</label>
            <select value={dutyClass} onChange={e => setDutyClass(parseInt(e.target.value) as DutyClass)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {DUTY_CLASSES.map(d => <option key={d.cls} value={d.cls}>{d.label} ({d.loadKpa} kN/m2)</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Bay Width (m)</label>
            <input type="number" value={bayWidth} onChange={e => setBayWidth(Math.max(0.5, parseFloat(e.target.value) || 1.3))} step={0.1} min={0.5} max={3}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Bay Length (m)</label>
            <input type="number" value={bayLength} onChange={e => setBayLength(Math.max(0.5, parseFloat(e.target.value) || 2.4))} step={0.1} min={0.5} max={4}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Loaded Bays (simultaneously)</label>
            <input type="number" value={loadedBays} onChange={e => setLoadedBays(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={10}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Wind Zone</label>
            <select value={windZone} onChange={e => setWindZone(e.target.value as WindZone)} className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {WIND_ZONES.map(w => <option key={w.zone} value={w.zone}>{w.label} ({w.basicVelocity} m/s)</option>)}
            </select></div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Options</label>
            {[{ l: "Sheeted", v: sheeted, s: setSheeted }, { l: "Debris Netting", v: debrisNet, s: setDebrisNet }, { l: "Freestanding", v: freestanding, s: setFreestanding }].map(opt => (
              <label key={opt.l} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <button onClick={() => opt.s(!opt.v)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${opt.v ? "bg-ebrora" : "bg-gray-300"}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${opt.v ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>{opt.l}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Load Breakdown per Standard</h3>
          <LoadStackedBar result={result} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Utilisation Gauge</h3>
          <div className="max-w-xs mx-auto"><UtilGauge percent={result.loads.utilisationPercent} level={result.loads.utilisationLevel} /></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Duty Class Comparison</h3>
        <p className="text-[11px] text-gray-400">Total load per standard across all 6 duty classes. Red dashed line = capacity.</p>
        <DutyComparisonChart result={result} />
      </div>

      {(sheeted || debrisNet) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Sheeted vs Open Wind Load Comparison</h3>
          <p className="text-[11px] text-gray-400">Wind load per standard: sheeted/netted configuration vs open scaffold.</p>
          <SheetedComparisonBar result={result} />
        </div>
      )}

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
          Based on BS EN 12811-1 (Loading classes), BS 5975 (Scaffolding code of practice), and SG4:10 (NASC guidance).
          Wind loads simplified from BS EN 1991-1-4. This is a screening tool - it does not replace a structural design
          calculation by a competent scaffolding engineer. Always obtain a full design check for complex configurations.
        </p>
      </div>
    </div>
  );
}
