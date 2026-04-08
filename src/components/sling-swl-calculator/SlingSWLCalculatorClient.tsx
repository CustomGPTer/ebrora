// src/components/sling-swl-calculator/SlingSWLCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateSling,
  generateCapacityCurve,
  calcAngleFromGeometry,
  SLING_TYPE_LABELS,
  SLING_TYPE_SHORT,
  LEG_OPTIONS,
  MODE_FACTORS,
  ANGLE_TABLE,
  RISK_BAND_CONFIG,
  REGULATIONS,
  type SlingType,
  type LegCount,
  type SlingInput,
  type SlingResult,
} from "@/data/sling-swl-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtNum(v: number, dp = 2): string { if (!Number.isFinite(v) || v < 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }

const DEFAULTS = {
  slingType: "chain" as SlingType, legs: 2 as LegCount, singleLegSWL: 2,
  angleDeg: 60, angleMode: "direct" as "direct" | "geometry",
  verticalHeight: 3, horizontalSpread: 2, loadWeight: 2.5,
};

// ─── SVG Capacity Curve ─────────────────────────────────────
function CapacityCurve({ singleLegSWL, legs, currentAngle, loadWeight }: { singleLegSWL: number; legs: LegCount; currentAngle: number; loadWeight: number }) {
  const data = useMemo(() => generateCapacityCurve(singleLegSWL, legs), [singleLegSWL, legs]);
  if (legs === 1 || data.length < 2) return null;
  const W = 560; const H = 300; const pad = { top: 20, right: 20, bottom: 45, left: 60 };
  const cW = W - pad.left - pad.right; const cH = H - pad.top - pad.bottom;
  const maxSWL = data[0].swl * 1.05;
  const xScale = (a: number) => pad.left + (a / 120) * cW;
  const yScale = (s: number) => pad.top + cH - (s / maxSWL) * cH;
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.angle).toFixed(1)},${yScale(d.swl).toFixed(1)}`).join(" ");
  const xTicks = [0, 15, 30, 45, 60, 75, 90, 105, 120];
  const yMax = Math.ceil(maxSWL);
  const yStep = yMax <= 5 ? 0.5 : yMax <= 20 ? 2 : yMax <= 50 ? 5 : 10;
  const yTicks: number[] = []; for (let v = 0; v <= maxSWL; v += yStep) yTicks.push(v);
  const safeX = xScale(90); const dangerX = xScale(120);
  const cAngle = Math.min(currentAngle, 120);
  const cSWL = data.find(d => d.angle >= cAngle)?.swl ?? 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
      <rect x={pad.left} y={pad.top} width={cW} height={cH} fill="#fafafa" stroke="#e5e7eb" strokeWidth={1} rx={3} />
      <rect x={pad.left} y={pad.top} width={safeX - pad.left} height={cH} fill="rgba(22,163,74,0.04)" />
      <rect x={safeX} y={pad.top} width={dangerX - safeX} height={cH} fill="rgba(245,158,11,0.06)" />
      <rect x={dangerX} y={pad.top} width={pad.left + cW - dangerX} height={cH} fill="rgba(220,38,38,0.06)" />
      <line x1={safeX} y1={pad.top} x2={safeX} y2={pad.top + cH} stroke="#D97706" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      <text x={safeX + 3} y={pad.top + 12} fontSize={8} fill="#D97706" fontFamily="system-ui">90deg</text>
      <line x1={dangerX} y1={pad.top} x2={dangerX} y2={pad.top + cH} stroke="#DC2626" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      <text x={dangerX + 3} y={pad.top + 12} fontSize={8} fill="#DC2626" fontFamily="system-ui">120deg MAX</text>
      {xTicks.map(t => <line key={`xg${t}`} x1={xScale(t)} y1={pad.top} x2={xScale(t)} y2={pad.top + cH} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="2,3" />)}
      {yTicks.map(t => <line key={`yg${t}`} x1={pad.left} y1={yScale(t)} x2={pad.left + cW} y2={yScale(t)} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="2,3" />)}
      {loadWeight > 0 && loadWeight <= maxSWL && (<><line x1={pad.left} y1={yScale(loadWeight)} x2={pad.left + cW} y2={yScale(loadWeight)} stroke="#6366F1" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.7} /><text x={pad.left + cW - 2} y={yScale(loadWeight) - 4} textAnchor="end" fontSize={9} fill="#6366F1" fontWeight={600} fontFamily="system-ui">{fmtNum(loadWeight, 1)}t load</text></>)}
      <path d={pathD} fill="none" stroke="#1B5745" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {cAngle >= 0 && cAngle <= 120 && (<><line x1={xScale(cAngle)} y1={pad.top} x2={xScale(cAngle)} y2={pad.top + cH} stroke="#1B5745" strokeWidth={1.5} strokeDasharray="4,2" opacity={0.5} /><circle cx={xScale(cAngle)} cy={yScale(cSWL)} r={6} fill="#1B5745" stroke="#fff" strokeWidth={2.5} /></>)}
      <line x1={pad.left} y1={pad.top + cH} x2={pad.left + cW} y2={pad.top + cH} stroke="#374151" strokeWidth={1.5} />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + cH} stroke="#374151" strokeWidth={1.5} />
      {xTicks.map(t => <text key={`xl${t}`} x={xScale(t)} y={pad.top + cH + 15} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="system-ui">{t}deg</text>)}
      <text x={pad.left + cW / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui">Included Angle (degrees)</text>
      {yTicks.map(t => <text key={`yl${t}`} x={pad.left - 6} y={yScale(t) + 3} textAnchor="end" fontSize={10} fill="#6b7280" fontFamily="system-ui">{fmtNum(t, 1)}</text>)}
      <text x={12} y={pad.top + cH / 2} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui" transform={`rotate(-90, 12, ${pad.top + cH / 2})`}>Effective SWL (tonnes)</text>
    </svg>
  );
}

// ─── SVG Sling Diagram ──────────────────────────────────────
function SlingDiagram({ legs, angleDeg }: { legs: LegCount; angleDeg: number }) {
  const W = 280; const H = 200; const hookY = 30; const hookX = W / 2;
  const loadY = 170; const loadW = 80; const loadH = 25;
  const halfAngleRad = ((angleDeg / 2) * Math.PI) / 180;
  const legLen = 110;
  const spreadX = Math.sin(halfAngleRad) * legLen;
  const dropY = Math.cos(halfAngleRad) * legLen;
  const attachY = hookY + dropY;
  const legColour = angleDeg > 120 ? "#DC2626" : angleDeg > 90 ? "#D97706" : "#374151";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      <circle cx={hookX} cy={hookY} r={8} fill="none" stroke="#374151" strokeWidth={2} />
      <path d={`M${hookX - 4},${hookY} Q${hookX - 4},${hookY + 8} ${hookX},${hookY + 10} Q${hookX + 4},${hookY + 8} ${hookX + 4},${hookY}`} fill="none" stroke="#374151" strokeWidth={2} />
      {legs === 1 && <line x1={hookX} y1={hookY + 10} x2={hookX} y2={loadY - loadH / 2} stroke={legColour} strokeWidth={2.5} />}
      {legs >= 2 && (<><line x1={hookX} y1={hookY + 10} x2={hookX - spreadX} y2={attachY} stroke={legColour} strokeWidth={2.5} /><line x1={hookX} y1={hookY + 10} x2={hookX + spreadX} y2={attachY} stroke={legColour} strokeWidth={2.5} /></>)}
      {legs >= 3 && <line x1={hookX} y1={hookY + 10} x2={hookX} y2={attachY + 5} stroke={legColour} strokeWidth={2} strokeDasharray="4,2" opacity={0.6} />}
      {legs === 4 && (<><line x1={hookX} y1={hookY + 10} x2={hookX - spreadX * 0.5} y2={attachY + 3} stroke={legColour} strokeWidth={2} strokeDasharray="4,2" opacity={0.6} /><line x1={hookX} y1={hookY + 10} x2={hookX + spreadX * 0.5} y2={attachY + 3} stroke={legColour} strokeWidth={2} strokeDasharray="4,2" opacity={0.6} /></>)}
      {legs >= 2 && angleDeg > 0 && (<><path d={`M${hookX - 20 * Math.sin(halfAngleRad)},${hookY + 10 + 20 * Math.cos(halfAngleRad)} A20,20 0 0,1 ${hookX + 20 * Math.sin(halfAngleRad)},${hookY + 10 + 20 * Math.cos(halfAngleRad)}`} fill="none" stroke="#6366F1" strokeWidth={1.5} /><text x={hookX} y={hookY + 36} textAnchor="middle" fontSize={11} fill="#6366F1" fontWeight={600} fontFamily="system-ui">{fmtNum(angleDeg, 0)}deg</text></>)}
      <rect x={hookX - loadW / 2} y={loadY - loadH / 2} width={loadW} height={loadH} rx={4} fill="#E5E7EB" stroke="#9CA3AF" strokeWidth={1.5} />
      <text x={hookX} y={loadY + 4} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui">LOAD</text>
      {legs >= 2 && (<><line x1={hookX - spreadX} y1={attachY} x2={hookX - loadW / 2 + 5} y2={loadY - loadH / 2} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="2,2" /><line x1={hookX + spreadX} y1={attachY} x2={hookX + loadW / 2 - 5} y2={loadY - loadH / 2} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="2,2" /></>)}
    </svg>
  );
}

// ─── Utilisation Gauge ──────────────────────────────────────
function UtilGauge({ pct, riskBand }: { pct: number; riskBand: SlingResult["riskBand"] }) {
  const cfg = RISK_BAND_CONFIG[riskBand];
  const clampPct = Math.min(pct, 150);
  const angle = -90 + (clampPct / 150) * 180;
  const R = 70; const cx = 80; const cy = 85;
  const needleX = cx + R * 0.75 * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + R * 0.75 * Math.sin((angle * Math.PI) / 180);
  return (
    <svg viewBox="0 0 160 100" className="w-full h-auto" style={{ maxHeight: 120 }}>
      <path d={`M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`} fill="none" stroke="#E5E7EB" strokeWidth={12} strokeLinecap="round" />
      <path d={`M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R * Math.cos((-90 + (80 / 150) * 180) * Math.PI / 180)},${cy + R * Math.sin((-90 + (80 / 150) * 180) * Math.PI / 180)}`} fill="none" stroke="#22C55E" strokeWidth={12} strokeLinecap="round" opacity={0.3} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={cfg.colour} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={cfg.colour} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={18} fontWeight={700} fill={cfg.colour} fontFamily="system-ui">{fmtNum(pct, 0)}%</text>
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function SlingSWLCalculatorClient() {
  const [slingType, setSlingType] = useState<SlingType>(DEFAULTS.slingType);
  const [legs, setLegs] = useState<LegCount>(DEFAULTS.legs);
  const [singleLegSWL, setSingleLegSWL] = useState<number>(DEFAULTS.singleLegSWL);
  const [angleDeg, setAngleDeg] = useState<number>(DEFAULTS.angleDeg);
  const [angleMode, setAngleMode] = useState<"direct" | "geometry">(DEFAULTS.angleMode);
  const [verticalHeight, setVerticalHeight] = useState<number>(DEFAULTS.verticalHeight);
  const [horizontalSpread, setHorizontalSpread] = useState<number>(DEFAULTS.horizontalSpread);
  const [loadWeight, setLoadWeight] = useState<number>(DEFAULTS.loadWeight);
  const [exporting, setExporting] = useState(false);
  const [header, setHeader] = useState({ site: "", manager: "", preparedBy: "", date: todayISO() });
  const [showSettings, setShowSettings] = useState(false);

  const effectiveAngle = useMemo(() => {
    if (legs === 1) return 0;
    if (angleMode === "geometry") return calcAngleFromGeometry(verticalHeight, horizontalSpread);
    return angleDeg;
  }, [legs, angleMode, angleDeg, verticalHeight, horizontalSpread]);

  const input: SlingInput = useMemo(() => ({
    slingType, legs, singleLegSWL, angleDeg: effectiveAngle, angleMode, verticalHeight, horizontalSpread, loadWeight,
  }), [slingType, legs, singleLegSWL, effectiveAngle, angleMode, verticalHeight, horizontalSpread, loadWeight]);

  const result: SlingResult = useMemo(() => calculateSling(input), [input]);
  const hasData = singleLegSWL > 0 && loadWeight > 0;
  const cfg = RISK_BAND_CONFIG[result.riskBand];

  const clearAll = useCallback(() => {
    setSlingType(DEFAULTS.slingType); setLegs(DEFAULTS.legs);
    setSingleLegSWL(DEFAULTS.singleLegSWL); setAngleDeg(DEFAULTS.angleDeg);
    setAngleMode(DEFAULTS.angleMode); setVerticalHeight(DEFAULTS.verticalHeight);
    setHorizontalSpread(DEFAULTS.horizontalSpread); setLoadWeight(DEFAULTS.loadWeight);
    setHeader({ site: "", manager: "", preparedBy: "", date: todayISO() });
  }, []);

  // ─── PDF Export ─────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
      const docRef = `SWL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      function checkPage(need: number) {
        if (y + need > 278) {
          doc.addPage(); doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
          doc.text("SLING / LIFTING GEAR SWL CALCULATOR (continued)", M, 7);
          doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.text("ebrora.com", W - M - 18, 7);
          doc.setTextColor(0, 0, 0); y = 14;
        }
      }

      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("SLING / LIFTING GEAR SWL CALCULATOR", M, 10);
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text(`Ref: ${docRef} | Rev 0 | LOLER 1998 / BS 8437 / LEEA CoP | ${new Date().toLocaleDateString("en-GB")}`, M, 15);
      doc.text("ebrora.com", W - M - 18, 15);
      y = 28; doc.setTextColor(0, 0, 0);

      doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
      doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD"); doc.setFontSize(8);
      const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
        doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
        const lw = doc.getTextWidth(label) + 2;
        if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
        else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
      };
      drawFld("Site:", header.site, M + 3, y, 50);
      drawFld("Date:", header.date ? new Date(header.date + "T00:00:00").toLocaleDateString("en-GB") : "", M + CW / 2, y, 30);
      y += 5;
      drawFld("Site Manager:", header.manager, M + 3, y, 40);
      drawFld("Prepared By:", header.preparedBy, M + CW / 2, y, 40);
      y += 9;

      doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69);
      doc.roundedRect(M, y, CW, 30, 1, 1, "FD");
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
      doc.text("SLING CONFIGURATION", M + 4, y + 6);
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      doc.text(`Sling Type: ${SLING_TYPE_LABELS[slingType]}`, M + 4, y + 12);
      doc.text(`Number of Legs: ${legs}`, M + CW / 2, y + 12);
      doc.text(`Single Leg SWL: ${fmtNum(singleLegSWL, 1)} tonnes`, M + 4, y + 17);
      doc.text(`Included Angle: ${fmtNum(effectiveAngle, 1)} degrees${angleMode === "geometry" ? ` (from H=${fmtNum(verticalHeight, 1)}m, S=${fmtNum(horizontalSpread, 1)}m)` : ""}`, M + CW / 2, y + 17);
      doc.text(`Load Weight: ${fmtNum(loadWeight, 1)} tonnes`, M + 4, y + 22);
      doc.text(`Mode Factor: ${MODE_FACTORS[legs]} | Angle Factor: ${fmtNum(result.angleReductionFactor, 3)}`, M + CW / 2, y + 22);
      doc.setFont("helvetica", "bold");
      doc.text(`Effective SWL: ${fmtNum(result.effectiveSWL, 2)} tonnes | Utilisation: ${fmtNum(result.utilisation, 1)}% | Status: ${cfg.label}`, M + 4, y + 28);
      y += 36;

      // Angle table
      checkPage(40);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("Angle Reduction Factor Table (LEEA)", M, y); y += 5;
      const aCols = [30, 30, 30, 30, 30, 36];
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); let cx = M;
      ["Angle (deg)", "Factor", "Angle (deg)", "Factor", "Angle (deg)", "Factor"].forEach((h, i) => {
        doc.setFillColor(27, 87, 69); doc.rect(cx, y, aCols[i], 6, "F");
        doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += aCols[i];
      });
      doc.setTextColor(0, 0, 0); y += 6;
      const pairs = ANGLE_TABLE; const rowCount = Math.ceil(pairs.length / 3);
      doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
      for (let r = 0; r < rowCount; r++) {
        cx = M;
        for (let c = 0; c < 3; c++) {
          const idx = r + c * rowCount; const p = pairs[idx];
          const aW = aCols[c * 2]; const fW = aCols[c * 2 + 1];
          const isCurrent = p && Math.abs(p.angle - effectiveAngle) < 8;
          if (p) {
            if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, aW, 5.5, "FD"); doc.setFillColor(232, 240, 236); doc.rect(cx + aW, y, fW, 5.5, "FD"); }
            else { doc.rect(cx, y, aW, 5.5, "D"); doc.rect(cx + aW, y, fW, 5.5, "D"); }
            doc.setTextColor(0, 0, 0); doc.setFont("helvetica", isCurrent ? "bold" : "normal");
            doc.text(`${p.angle}`, cx + 2, y + 3.5); doc.text(`${p.factor.toFixed(2)}`, cx + aW + 2, y + 3.5);
          } else { doc.rect(cx, y, aW, 5.5, "D"); doc.rect(cx + aW, y, fW, 5.5, "D"); }
          cx += aW + fW;
        }
        y += 5.5;
      }
      y += 6;

      // Results summary
      checkPage(50);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Results Summary", M, y); y += 5;
      const rCols = [90, 96];
      const summaryRows = [
        ["Effective SWL of sling set", `${fmtNum(result.effectiveSWL, 2)} tonnes`],
        ["Load weight", `${fmtNum(loadWeight, 2)} tonnes`],
        ["Utilisation", `${fmtNum(result.utilisation, 1)}%`],
        ["Status", cfg.label],
        ["Max safe angle for this load", `${fmtNum(result.maxSafeAngle, 1)} degrees`],
        ["Max safe load at this angle", `${fmtNum(result.maxSafeLoad, 2)} tonnes`],
      ];
      doc.setFontSize(6.5); cx = M;
      ["Parameter", "Value"].forEach((h, i) => {
        doc.setFillColor(27, 87, 69); doc.rect(cx, y, rCols[i], 6, "F");
        doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += rCols[i];
      });
      doc.setTextColor(0, 0, 0); y += 6;
      doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
      for (const [label, value] of summaryRows) {
        cx = M;
        doc.rect(cx, y, rCols[0], 5.5, "D"); doc.setFont("helvetica", "bold"); doc.text(label, cx + 2, y + 3.5);
        cx += rCols[0]; doc.rect(cx, y, rCols[1], 5.5, "D"); doc.setFont("helvetica", "normal"); doc.text(value, cx + 2, y + 3.5);
        y += 5.5;
      }
      y += 6;

      // Warnings
      if (result.riskBand === "angle_exceeded") {
        doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38); doc.roundedRect(M, y, CW, 10, 1, 1, "FD");
        doc.setTextColor(220, 38, 38); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text("WARNING: Included angle exceeds 120 degrees -- DO NOT LIFT. Reduce spread or increase hook height.", M + 4, y + 6);
        doc.setTextColor(0, 0, 0); y += 14;
      } else if (result.riskBand === "overloaded") {
        doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38); doc.roundedRect(M, y, CW, 10, 1, 1, "FD");
        doc.setTextColor(220, 38, 38); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text("WARNING: Load exceeds sling set SWL -- DO NOT LIFT. Use higher-rated slings or reduce load.", M + 4, y + 6);
        doc.setTextColor(0, 0, 0); y += 14;
      } else if (result.riskBand === "caution") {
        doc.setFillColor(254, 243, 199); doc.setDrawColor(217, 119, 6); doc.roundedRect(M, y, CW, 10, 1, 1, "FD");
        doc.setTextColor(146, 64, 14); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text("CAUTION: Utilisation >80% or angle >90 degrees. Review rigging arrangement before lifting.", M + 4, y + 6);
        doc.setTextColor(0, 0, 0); y += 14;
      }

      // Regulations
      checkPage(30);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("Applicable Regulations", M, y); y += 4;
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      for (const reg of REGULATIONS) { doc.text(`- ${reg}`, M + 2, y); y += 3.5; }
      y += 4;

      // Sign-off
      checkPage(50);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Sign-Off", M, y); y += 5;
      const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
      doc.setDrawColor(200, 200, 200); doc.setFontSize(7); doc.setFillColor(245, 245, 245);
      doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
      doc.setFont("helvetica", "bold"); doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
      y += soH;
      (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
        doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
        doc.setFont("helvetica", "bold"); doc.setFontSize(6);
        doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
        doc.setFont("helvetica", "normal"); y += soH;
      });

      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(140, 140, 140); doc.setFont("helvetica", "normal");
        doc.text(`${docRef} | Generated by ebrora.com | LOLER 1998 / BS 8437 / LEEA Code of Practice | For guidance only -- verify sling markings and condition before every lift`, M, 290);
        doc.text(`Page ${p} of ${pages}`, W - M, 290, { align: "right" });
      }
      doc.save(`sling-swl-calculator-${docRef}.pdf`);
    } catch (e) { console.error("PDF export error:", e); }
    finally { setExporting(false); }
  }, [slingType, legs, singleLegSWL, effectiveAngle, angleMode, verticalHeight, horizontalSpread, loadWeight, result, header, cfg]);

  // ─── Render ────────────────────────────────────────────────
  const utilCard = result.utilisation > 100
    ? { bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" }
    : result.utilisation > 80
      ? { bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" }
      : { bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Effective SWL", value: `${fmtNum(result.effectiveSWL, 2)} t`, sub: `${legs}-leg ${SLING_TYPE_SHORT[slingType]}`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Load Weight", value: `${fmtNum(loadWeight, 1)} t`, sub: `Angle: ${fmtNum(effectiveAngle, 0)} deg`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Utilisation", value: `${fmtNum(result.utilisation, 1)}%`, sub: cfg.label, ...utilCard },
          { label: "Max Safe Load", value: `${fmtNum(result.maxSafeLoad, 2)} t`, sub: `Max angle: ${fmtNum(result.maxSafeAngle, 0)} deg`, bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { l: "Site", v: header.site, s: (v: string) => setHeader(h => ({ ...h, site: v })) },
            { l: "Site Manager", v: header.manager, s: (v: string) => setHeader(h => ({ ...h, manager: v })) },
            { l: "Prepared By", v: header.preparedBy, s: (v: string) => setHeader(h => ({ ...h, preparedBy: v })) },
          ].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={header.date} onChange={e => setHeader(h => ({ ...h, date: e.target.value }))} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Input section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sling Type</label>
            <select value={slingType} onChange={e => setSlingType(e.target.value as SlingType)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {(Object.keys(SLING_TYPE_LABELS) as SlingType[]).map(t => <option key={t} value={t}>{SLING_TYPE_LABELS[t]}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Legs</label>
            <div className="flex gap-1.5">{LEG_OPTIONS.map(l => (
              <button key={l} onClick={() => setLegs(l)} className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${legs === l ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>{l}</button>
            ))}</div></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Single Leg SWL (tonnes)</label>
            <input type="number" min={0} step={0.1} value={singleLegSWL} onChange={e => setSingleLegSWL(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Load Weight (tonnes)</label>
            <input type="number" min={0} step={0.1} value={loadWeight} onChange={e => setLoadWeight(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
        </div>
        {legs > 1 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Angle Input Method</label>
              <div className="flex gap-1.5">
                <button onClick={() => setAngleMode("direct")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${angleMode === "direct" ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>Direct (degrees)</button>
                <button onClick={() => setAngleMode("geometry")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${angleMode === "geometry" ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>From Height &amp; Spread</button>
              </div>
            </div>
            {angleMode === "direct" ? (
              <div className="max-w-xs"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Included Angle (degrees)</label>
                <input type="number" min={0} max={180} step={1} value={angleDeg} onChange={e => setAngleDeg(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">Included angle between opposite legs. Max 120 degrees.</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Vertical Height to Hook (m)</label>
                  <input type="number" min={0} step={0.1} value={verticalHeight} onChange={e => setVerticalHeight(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Horizontal Spread (m)</label>
                  <input type="number" min={0} step={0.1} value={horizontalSpread} onChange={e => setHorizontalSpread(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
                <p className="text-[10px] text-gray-400 col-span-2">Calculated angle: {fmtNum(effectiveAngle, 1)} degrees</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning banners */}
      {result.riskBand === "angle_exceeded" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">Included angle exceeds 120 degrees - DO NOT LIFT</div>
            <div className="text-xs text-red-800 mt-1">Reduce the horizontal spread or increase the hook height to bring the included angle below 120 degrees.</div></div>
        </div>
      )}
      {result.riskBand === "overloaded" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">Load exceeds sling set SWL - DO NOT LIFT</div>
            <div className="text-xs text-red-800 mt-1">Use higher-rated slings, add legs, reduce the included angle, or reduce the load weight.</div></div>
        </div>
      )}

      {/* Results: diagram, gauge, chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Sling Configuration</h3>
          <SlingDiagram legs={legs} angleDeg={effectiveAngle} />
          <div className="text-center mt-2"><span className="text-xs text-gray-500">{SLING_TYPE_SHORT[slingType]} - {legs} leg{legs > 1 ? "s" : ""}</span></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Utilisation</h3>
          <UtilGauge pct={result.utilisation} riskBand={result.riskBand} />
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${cfg.bgClass} ${cfg.textClass} border ${cfg.borderClass}`}>{cfg.label}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Calculation Summary</h3>
          {[
            { label: "Mode Factor", value: `${MODE_FACTORS[legs]}` },
            { label: "Angle Reduction Factor", value: `${fmtNum(result.angleReductionFactor, 3)}` },
            { label: "Effective SWL", value: `${fmtNum(result.effectiveSWL, 2)} t`, bold: true },
            { label: "Max Safe Angle", value: `${fmtNum(result.maxSafeAngle, 1)} deg` },
            { label: "Max Safe Load", value: `${fmtNum(result.maxSafeLoad, 2)} t` },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
              <span className="text-xs text-gray-500">{r.label}</span>
              <span className={`text-sm ${r.bold ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity curve chart */}
      {legs > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">SWL Capacity vs Included Angle</h3>
          <CapacityCurve singleLegSWL={singleLegSWL} legs={legs} currentAngle={effectiveAngle} loadWeight={loadWeight} />
        </div>
      )}

      {/* Angle reduction reference table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Angle Reduction Factor Table (LEEA)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Angle (deg)</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Factor</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">% of Vertical SWL</th>
            </tr></thead>
            <tbody>{ANGLE_TABLE.map(a => {
              const isCurrent = legs > 1 && Math.abs(a.angle - effectiveAngle) < 8;
              return (
                <tr key={a.angle} className={isCurrent ? "bg-ebrora-light/40 font-bold" : "hover:bg-gray-50"}>
                  <td className="px-3 py-1.5 border-t border-gray-100">{a.angle}</td>
                  <td className="px-3 py-1.5 border-t border-gray-100">{a.factor.toFixed(2)}</td>
                  <td className="px-3 py-1.5 border-t border-gray-100">{(a.factor * 100).toFixed(0)}%</td>
                </tr>);
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-[10px] text-gray-400 leading-relaxed space-y-1 px-1">
        <p>This calculator provides indicative SWL values based on LEEA guidance, BS 8437, and standard angle reduction factors. It does not replace a competent person&apos;s assessment. Always verify sling markings, inspect condition before every lift, and comply with LOLER 1998 Regulation 8.</p>
        <p>References: {REGULATIONS.join("; ")}.</p>
      </div>
    </div>
  );
}
