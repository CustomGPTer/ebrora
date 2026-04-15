// src/components/temporary-traffic-management-selector/TemporaryTrafficManagementSelectorClient.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  ROAD_TYPES, WORKS_LOCATIONS, WORKS_DURATIONS,
  TM_LAYOUTS, SCORING_FACTORS, RISK_BANDS, NHSS_REQUIREMENTS,
  DEPLOYMENT_CHECKLIST, REGULATORY_REFERENCES,
  getSigningForSpeed, getNHSSRequirement, selectLayout, getNeighbourLayouts,
  calculateComplexityScore, getOperativesRequired, getSigningSchedule,
  generateWarnings, generateRecommendations, generateCrossReferences,
  autoSyncSelections, getNRSWANote,
} from "@/data/temporary-traffic-management-selector";
import type { RoadType, TMLayout, SigningDistance, TMResult } from "@/data/temporary-traffic-management-selector";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Layout Schematic ───────────────────────────────────────
function LayoutSchematic({ signing, layout, speedMph }: { signing: SigningDistance; layout: TMLayout; speedMph: number }) {
  const W = 700, H = 200;
  const roadY = 90, roadH = 50, laneH = 25;
  const scale = Math.min(1, 500 / (signing.totalLeadInM + 60 + signing.exitTaperM));
  const startX = 40;

  // Key positions
  const signX = startX;
  const taperStartX = startX + signing.advanceSignM * scale;
  const taperEndX = taperStartX + signing.leadInTaperM * scale;
  const safetyEndX = taperEndX + signing.safetyZoneM * scale;
  const worksEndX = safetyEndX + 60 * scale;
  const exitEndX = worksEndX + signing.exitTaperM * scale;
  const totalW = Math.min(W - 20, exitEndX + 30);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {/* Road surface */}
      <rect x={10} y={roadY} width={totalW} height={roadH} fill="#6B7280" rx={3} opacity={0.15} />
      <line x1={10} y1={roadY + laneH} x2={10 + totalW} y2={roadY + laneH} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="8,6" />
      {/* Lane labels */}
      <text x={15} y={roadY + 14} fontSize={8} fill="#6B7280" fontWeight={600}>Lane 1 (nearside)</text>
      <text x={15} y={roadY + laneH + 14} fontSize={8} fill="#6B7280" fontWeight={600}>Lane 2 (offside)</text>

      {/* Direction arrow */}
      <text x={totalW - 20} y={roadY - 6} fontSize={9} fill="#374151" fontWeight={600} textAnchor="end">Traffic flow --&gt;</text>

      {/* Advance sign */}
      {signing.advanceSignM > 0 && <>
        <rect x={signX - 6} y={roadY - 30} width={12} height={16} fill="#EF4444" rx={1} />
        <text x={signX} y={roadY - 18} fontSize={5} fill="white" textAnchor="middle" fontWeight={700}>!</text>
        <line x1={signX} y1={roadY - 14} x2={signX} y2={roadY} stroke="#6B7280" strokeWidth={1} />
        <text x={signX} y={H - 8} fontSize={7} fill="#6B7280" textAnchor="middle">{signing.advanceSignM}m</text>
      </>}

      {/* Lead-in taper */}
      <polygon
        points={`${taperStartX},${roadY} ${taperEndX},${roadY + laneH} ${taperEndX},${roadY} ${taperStartX},${roadY}`}
        fill="#F97316" opacity={0.5} stroke="#F97316" strokeWidth={1}
      />
      {/* Cone dots in taper */}
      {Array.from({ length: Math.min(8, Math.ceil(signing.leadInTaperM / signing.coneSpacingM)) }).map((_, i) => {
        const ratio = i / Math.max(1, Math.ceil(signing.leadInTaperM / signing.coneSpacingM) - 1);
        const cx = taperStartX + ratio * (taperEndX - taperStartX);
        const cy = roadY + ratio * laneH;
        return <circle key={`tc-${i}`} cx={cx} cy={cy} r={2} fill="#F97316" />;
      })}
      <text x={(taperStartX + taperEndX) / 2} y={roadY - 6} fontSize={7} fill="#F97316" textAnchor="middle" fontWeight={600}>Taper {signing.leadInTaperM}m</text>

      {/* Safety zone */}
      {signing.safetyZoneM > 0 && <>
        <rect x={taperEndX} y={roadY} width={safetyEndX - taperEndX} height={laneH} fill="#3B82F6" opacity={0.12} stroke="#3B82F6" strokeWidth={0.5} strokeDasharray="3,2" />
        <text x={(taperEndX + safetyEndX) / 2} y={roadY + laneH / 2 + 3} fontSize={6} fill="#3B82F6" textAnchor="middle" fontWeight={600}>Safety {signing.safetyZoneM}m</text>
      </>}

      {/* Works area */}
      <rect x={safetyEndX} y={roadY} width={worksEndX - safetyEndX} height={laneH} fill="#EF4444" opacity={0.2} stroke="#EF4444" strokeWidth={1} />
      <text x={(safetyEndX + worksEndX) / 2} y={roadY + laneH / 2 + 3} fontSize={8} fill="#EF4444" textAnchor="middle" fontWeight={700}>WORKS AREA</text>
      {/* Works area cones */}
      {[0, 0.33, 0.66, 1].map((r, i) => (
        <circle key={`wc-${i}`} cx={safetyEndX + r * (worksEndX - safetyEndX)} cy={roadY + laneH} r={2} fill="#EF4444" />
      ))}

      {/* Exit taper */}
      <polygon
        points={`${worksEndX},${roadY + laneH} ${exitEndX},${roadY} ${exitEndX},${roadY + laneH}`}
        fill="#22C55E" opacity={0.4} stroke="#22C55E" strokeWidth={1}
      />
      <text x={(worksEndX + exitEndX) / 2} y={roadY - 6} fontSize={7} fill="#22C55E" textAnchor="middle" fontWeight={600}>Exit {signing.exitTaperM}m</text>

      {/* Dimension line */}
      <line x1={signX} y1={H - 20} x2={exitEndX} y2={H - 20} stroke="#374151" strokeWidth={1} markerEnd="url(#arr)" markerStart="url(#arr)" />
      <text x={(signX + exitEndX) / 2} y={H - 24} fontSize={8} fill="#374151" textAnchor="middle" fontWeight={600}>Total: ~{signing.totalLeadInM + 60 + signing.exitTaperM}m</text>

      {/* Layout ref badge */}
      <rect x={W - 120} y={4} width={110} height={22} fill="#1B5745" rx={4} />
      <text x={W - 65} y={18} fontSize={10} fill="white" textAnchor="middle" fontWeight={700}>{layout.ref}</text>

      {/* Speed badge */}
      <rect x={W - 120} y={30} width={110} height={16} fill="#374151" rx={3} />
      <text x={W - 65} y={41} fontSize={8} fill="white" textAnchor="middle" fontWeight={600}>{speedMph} mph | Cones @ {signing.coneSpacingM}m</text>

      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={4} markerHeight={4} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
        </marker>
      </defs>
    </svg>
  );
}

// ─── SVG Radar Chart (Complexity) ───────────────────────────────
function ComplexityRadar({ factorScores }: { factorScores: TMResult["factorScores"] }) {
  const W = 300, H = 300, cx = W / 2, cy = H / 2, r = 110;
  const n = factorScores.length;
  const angleStep = (2 * Math.PI) / n;

  const point = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.sin(i * angleStep),
    y: cy - r * ratio * Math.cos(i * angleStep),
  });

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const dataPoints = factorScores.map((f, i) => {
    const ratio = f.maxScore > 0 ? f.score / f.maxScore : 0;
    return point(i, ratio);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
      {/* Grid */}
      {gridLevels.map(level => {
        const pts = Array.from({ length: n }).map((_, i) => point(i, level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Spokes */}
      {factorScores.map((_, i) => {
        const p = point(i, 1);
        return <line key={`sp-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Data area */}
      <path d={dataPath} fill="rgba(27,87,69,0.15)" stroke="#1B5745" strokeWidth={2} />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={4} fill={factorScores[i].color} stroke="white" strokeWidth={1.5} />
      ))}
      {/* Labels */}
      {factorScores.map((f, i) => {
        const p = point(i, 1.22);
        return (
          <text key={`lb-${i}`} x={p.x} y={p.y} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={600}>
            {f.label.length > 18 ? f.label.slice(0, 16) + ".." : f.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Horizontal Bar Chart ───────────────────────────────────
function ComplexityBars({ factorScores }: { factorScores: TMResult["factorScores"] }) {
  const W = 400, H = factorScores.length * 32 + 20;
  const PAD = { left: 130, right: 20, top: 10, bottom: 10 };
  const cw = W - PAD.left - PAD.right;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      {factorScores.map((f, i) => {
        const y = PAD.top + i * 32;
        const ratio = f.maxScore > 0 ? f.score / f.maxScore : 0;
        const barW = ratio * cw;
        return (
          <g key={f.id}>
            <text x={PAD.left - 6} y={y + 14} textAnchor="end" fontSize={8} fill="#374151" fontWeight={500}>{f.label}</text>
            <rect x={PAD.left} y={y + 4} width={cw} height={18} fill="#F3F4F6" rx={3} />
            <rect x={PAD.left} y={y + 4} width={Math.max(barW, 2)} height={18} fill={f.color} rx={3} opacity={0.8} />
            <text x={PAD.left + barW + 4} y={y + 16} fontSize={8} fill="#374151" fontWeight={600}>
              {f.score.toFixed(1)} / {f.maxScore.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── PDF Export (PAID = dark header, white-label) ───────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  result: TMResult,
  speedMph: number,
  roadType: RoadType,
  nightWorks: boolean,
  pedestrianDiversion: boolean,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `TTM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("TEMPORARY TRAFFIC MANAGEMENT ASSESSMENT", M, 12);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Chapter 8 Traffic Signs Manual | Safety at Street Works CoP 2013 | NRSWA 1991 | TMA 2004", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 25, 1, 1, "FD");
  doc.setFontSize(8);
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
  drawFld("Road:", `${roadType.label} (${speedMph} mph)`, M + halfW, y, 0);
  y += 5;
  drawFld("Night Works:", nightWorks ? "Yes" : "No", M + 3, y, 0);
  drawFld("Ped. Diversion:", pedestrianDiversion ? "Yes" : "No", M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `TTM assessment for ${header.site || "the above site"}. Road: ${roadType.label}, ${speedMph} mph. Layout: ${result.layout.ref} - ${result.layout.name}. ${nightWorks ? "Night works." : "Day works."} ${pedestrianDiversion ? "Pedestrian diversion required." : ""} Complexity score: ${result.complexityScore} / ${result.maxComplexity} (${result.riskBand.label}).`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("TTM ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(header.site ? `${docRef} | ${header.site}` : docRef, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Risk/Complexity Banner
  const bandColorMap: Record<string, number[]> = {
    "Low Complexity": [34, 197, 94],
    "Medium Complexity": [234, 179, 8],
    "High Complexity": [249, 115, 22],
    "Very High Complexity": [239, 68, 68],
  };
  const rgb = bandColorMap[result.riskBand.label] || [100, 100, 100];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(`${result.riskBand.label.toUpperCase()} -- Score: ${result.complexityScore} / ${result.maxComplexity}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Layout: ${result.layout.ref} | Operatives: ${result.operativesRequired} | NHSS: ${result.nhssRequirement.label}`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Assessment Summary
  checkPage(55);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 52, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  const summaryItems = [
    ["Road Type", roadType.label],
    ["Speed Limit", `${speedMph} mph`],
    ["Highway Authority", roadType.highwayAuthority],
    ["Selected Layout", `${result.layout.ref} - ${result.layout.name}`],
    ["NRSWA Notice", result.nrswaNotice.noticePeriod],
    ["NRSWA Reference", result.nrswaNotice.noticeRef],
    ["NHSS Requirement", result.nhssRequirement.label],
    ["Min. Operatives", String(result.operativesRequired)],
    ["Complexity Score", `${result.complexityScore} / ${result.maxComplexity} (${result.riskBand.label})`],
    ["Night Works", nightWorks ? "Yes" : "No"],
    ["Pedestrian Diversion", pedestrianDiversion ? "Yes" : "No"],
  ];
  summaryItems.forEach(([label, value], si) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    if (si === 8) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
    else { doc.setTextColor(17, 24, 39); }
    doc.setFont("helvetica", "normal");
    const valLines = doc.splitTextToSize(value, CW - 68);
    doc.text(valLines[0], M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 6;

  // ── Layout Schematic (drawn in jsPDF)
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Layout Schematic (not to scale)", M, y); y += 4;
  const s = result.signing;
  const schScale = Math.min(1, (CW - 10) / (s.totalLeadInM + 60 + s.exitTaperM));
  const schX0 = M + 5;
  const roadTop = y + 4;
  const rdH = 14, lnH = 7;
  doc.setFillColor(230, 230, 230); doc.rect(M, roadTop, CW, rdH, "F");
  doc.setDrawColor(180, 180, 180); doc.line(M, roadTop + lnH, M + CW, roadTop + lnH);
  // Taper
  const tS = schX0 + s.advanceSignM * schScale;
  const tE = tS + s.leadInTaperM * schScale;
  doc.setFillColor(249, 115, 22); doc.setDrawColor(249, 115, 22);
  doc.triangle(tS, roadTop, tE, roadTop + lnH, tE, roadTop, "F");
  // Safety zone
  if (s.safetyZoneM > 0) {
    const szE = tE + s.safetyZoneM * schScale;
    doc.setFillColor(191, 219, 254); doc.rect(tE, roadTop, szE - tE, lnH, "F");
    doc.setFontSize(4); doc.setTextColor(59, 130, 246);
    doc.text(`Safety ${s.safetyZoneM}m`, (tE + szE) / 2, roadTop + lnH / 2 + 1.5, { align: "center" });
  }
  const szEnd = tE + s.safetyZoneM * schScale;
  const wEnd = szEnd + 30 * schScale;
  doc.setFillColor(254, 202, 202); doc.rect(szEnd, roadTop, wEnd - szEnd, lnH, "F");
  doc.setFontSize(5); doc.setTextColor(239, 68, 68); doc.setFont("helvetica", "bold");
  doc.text("WORKS", (szEnd + wEnd) / 2, roadTop + lnH / 2 + 1.5, { align: "center" });
  const exEnd = wEnd + s.exitTaperM * schScale;
  doc.setFillColor(187, 247, 208); doc.triangle(wEnd, roadTop + lnH, exEnd, roadTop, exEnd, roadTop + lnH, "F");
  doc.setTextColor(0, 0, 0); doc.setFontSize(5); doc.setFont("helvetica", "normal");
  if (s.advanceSignM > 0) doc.text(`Sign ${s.advanceSignM}m`, schX0, roadTop + rdH + 4);
  doc.text(`Taper ${s.leadInTaperM}m`, tS, roadTop + rdH + 4);
  doc.text(`Exit ${s.exitTaperM}m`, wEnd, roadTop + rdH + 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
  doc.text(`Total: ${s.totalLeadInM + 60 + s.exitTaperM}m | Cones: ${s.coneSpacingM}m spacing | ${speedMph >= 50 ? "750mm" : "450mm"} min height`, M, roadTop + rdH + 9);
  doc.setFont("helvetica", "normal"); doc.setDrawColor(200, 200, 200);
  y = roadTop + rdH + 14;

  // ── Signing Dimensions Table
  checkPage(35);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Signing Dimensions (Safety at Street Works CoP Table A1)", M, y); y += 5;

  const dimCols = [48, 28, 28, 28, CW - 132];
  let cx = M;
  ["Dimension", "Dist. (m)", "Cone Gap", "Cone Ht", "Notes"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, dimCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4); cx += dimCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  const coneHt = speedMph >= 50 ? "750mm min" : "450mm min";
  const dimRows = [
    ["Advance signing distance", `${s.advanceSignM}`, `${s.coneSpacingM}m`, coneHt, "Both approaches"],
    ["Lead-in taper length", `${s.leadInTaperM}`, `${s.coneSpacingM}m`, coneHt, "Diagonal taper"],
    ["Longitudinal safety zone", `${s.safetyZoneM}`, "-", "-", "No works in zone"],
    ["Exit taper length", `${s.exitTaperM}`, `${s.coneSpacingM}m`, coneHt, ""],
    ["Total lead-in distance", `${s.totalLeadInM}`, "-", "-", "Sign to works start"],
  ];
  dimRows.forEach((row, ri) => {
    checkPage(6);
    cx = M;
    row.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, dimCols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, dimCols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 3.8); cx += dimCols[i];
    });
    y += 5.5;
  });
  y += 6;

  // ── Complexity Bar Chart (drawn in jsPDF)
  checkPage(65);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Complexity Scoring Breakdown", M, y); y += 5;

  const barX = M + 42, barMaxW = CW - 60;
  result.factorScores.forEach((f) => {
    checkPage(8);
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(f.label, M + 2, y + 3.5);
    doc.setFillColor(243, 244, 246); doc.rect(barX, y, barMaxW, 5, "F");
    const ratio = f.maxScore > 0 ? f.score / f.maxScore : 0;
    const hex = f.color;
    const rr = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), bb = parseInt(hex.slice(5, 7), 16);
    doc.setFillColor(rr, gg, bb); doc.rect(barX, y, Math.max(ratio * barMaxW, 1), 5, "F");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5);
    doc.text(`${f.score.toFixed(1)} / ${f.maxScore.toFixed(1)} (${f.selectedLabel})`, barX + ratio * barMaxW + 2, y + 3.5);
    y += 7;
  });
  // Total bar
  doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
  doc.rect(M, y, CW, 6, "FD");
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text(`TOTAL: ${result.complexityScore} / ${result.maxComplexity} -- ${result.riskBand.label}`, M + 4, y + 4);
  y += 10;

  // ── Signing Schedule
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Signing Schedule", M, y); y += 5;

  const ssCols = [52, 34, 34, CW - 120];
  cx = M;
  ["Sign / Element", "Position", "Distance", "Notes"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, ssCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4); cx += ssCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  result.signingSchedule.forEach((entry, ri) => {
    checkPage(9);
    cx = M;
    [entry.sign, entry.position, entry.distance, entry.notes].forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, ssCols[i], 7, "FD"); }
      else { doc.rect(cx, y, ssCols[i], 7, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5);
      const lines = doc.splitTextToSize(t, ssCols[i] - 3);
      doc.text(lines[0], cx + 1.5, y + 3.5);
      if (lines[1]) doc.text(lines[1], cx + 1.5, y + 6);
      cx += ssCols[i];
    });
    y += 7;
  });
  y += 6;

  // ── NHSS Requirements
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("NHSS Qualification Requirements", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const nhssLines = doc.splitTextToSize(result.nhssRequirement.description, CW - 4);
  doc.text(nhssLines, M + 2, y); y += nhssLines.length * 3.5;
  if (result.nhssRequirement.qualification !== "N/A") {
    doc.setFont("helvetica", "bold"); doc.text("Qualification:", M + 2, y);
    doc.setFont("helvetica", "normal");
    const qualLines = doc.splitTextToSize(result.nhssRequirement.qualification, CW - 40);
    doc.text(qualLines, M + 30, y); y += qualLines.length * 3.5;
    doc.setFont("helvetica", "bold"); doc.text("Provider:", M + 2, y);
    doc.setFont("helvetica", "normal"); doc.text(result.nhssRequirement.trainingProvider, M + 30, y); y += 4;
    doc.setFont("helvetica", "bold"); doc.text("Renewal:", M + 2, y);
    doc.setFont("helvetica", "normal"); doc.text(`Every ${result.nhssRequirement.renewalYears} years`, M + 30, y); y += 4;
  }
  y += 4;

  // ── Warnings
  if (result.warnings.length > 0) {
    checkPage(20);
    doc.setFillColor(254, 242, 242); doc.setDrawColor(252, 165, 165);
    doc.roundedRect(M, y - 2, CW, result.warnings.length * 6 + 8, 1.5, 1.5, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(153, 27, 27);
    doc.text("WARNINGS", M + 4, y + 2); y += 5;
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(127, 29, 29);
    result.warnings.forEach(w => {
      checkPage(6);
      const wLines = doc.splitTextToSize(`- ${w}`, CW - 8);
      doc.text(wLines, M + 4, y); y += wLines.length * 3;
    });
    doc.setTextColor(0, 0, 0); y += 6;
  }

  // ── Deployment Checklist
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("TM Deployment Checklist", M, y); y += 5;

  const categories = [...new Set(DEPLOYMENT_CHECKLIST.map(c => c.category))];
  categories.forEach(cat => {
    checkPage(10);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(cat, M + 2, y); y += 4;
    doc.setTextColor(0, 0, 0);
    DEPLOYMENT_CHECKLIST.filter(c => c.category === cat).forEach((item, ci) => {
      checkPage(6);
      doc.setFontSize(5.5); doc.setFont("helvetica", "normal");
      doc.text(`[ ]  ${item.item}`, M + 4, y);
      doc.setTextColor(130, 130, 130); doc.setFontSize(4.5);
      doc.text(item.regulation, W - M - 2, y, { align: "right" });
      doc.setTextColor(0, 0, 0); y += 3.5;
    });
    y += 2;
  });
  y += 4;

  // ── Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });
  y += 4;

  // ── Comparison Table (selected + neighbours)
  if (result.neighbourLayouts.length > 0) {
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Layout Comparison", M, y); y += 5;

    const compCols = [28, ...Array(1 + result.neighbourLayouts.length).fill(Math.floor((CW - 28) / (1 + result.neighbourLayouts.length)))];
    const allLayouts = [result.layout, ...result.neighbourLayouts];
    cx = M;
    ["", ...allLayouts.map(l => l.ref)].forEach((h, i) => {
      doc.setFillColor(i === 1 ? 27 : 30, i === 1 ? 87 : 30, i === 1 ? 69 : 30);
      doc.rect(cx, y, compCols[i] || compCols[1], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(h, cx + 2, y + 4);
      cx += compCols[i] || compCols[1];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    const compRows = [
      ["Name", ...allLayouts.map(l => l.name.length > 28 ? l.name.slice(0, 26) + ".." : l.name)],
      ["Min Operatives", ...allLayouts.map(l => String(l.operativeMin))],
      ["Speed Range", ...allLayouts.map(l => `${l.minSpeed}-${l.maxSpeed} mph`)],
      ["Key Features", ...allLayouts.map(l => l.keyFeatures.slice(0, 2).join("; "))],
      ["NHSS", ...allLayouts.map(l => { const nh = getNHSSRequirement(roadType, speedMph, l); return nh.level === "none" ? "None" : nh.level === "12a" ? "12D" : "12A/B"; })],
    ];
    compRows.forEach((row, ri) => {
      checkPage(6);
      cx = M;
      row.forEach((t, i) => {
        const colW = compCols[i] || compCols[1];
        if (i === 1) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, colW, 5.5, "FD"); }
        else if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, colW, 5.5, "FD"); }
        else { doc.rect(cx, y, colW, 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
        const maxC = Math.floor(colW / 2);
        const trnc = t.length > maxC ? t.slice(0, maxC - 2) + ".." : t;
        doc.text(trnc, cx + 1.5, y + 3.8);
        cx += colW;
      });
      y += 5.5;
    });
    y += 6;
  }

  // ── Risk Band Key (wide colour blocks)
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Complexity Risk Bands", M, y); y += 5;
  RISK_BANDS.forEach(band => {
    checkPage(10);
    const bRGB = bandColorMap[band.label] || [100, 100, 100];
    doc.setFillColor(bRGB[0], bRGB[1], bRGB[2]);
    doc.roundedRect(M + 2, y - 2, CW - 4, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(`${band.label} (${band.min}-${band.max})`, M + 5, y + 2);
    doc.setFont("helvetica", "normal"); doc.setFontSize(5);
    const descLines = doc.splitTextToSize(band.description, CW - 55);
    doc.text(descLines[0], M + 55, y + 2);
    doc.setTextColor(0, 0, 0); y += 10;
  });
  y += 2;

  // ── Regulatory References
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Regulatory References", M, y); y += 5;
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  REGULATORY_REFERENCES.forEach(r => {
    checkPage(4);
    doc.text(`- ${r}`, M + 2, y); y += 3.2;
  });
  y += 4;

  // ── Sign-off
  checkPage(50);
  y += 2;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;

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

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "TTM assessment per Chapter 8 Traffic Signs Manual and Safety at Street Works CoP 2013. This tool is an aid to planning -- site-specific conditions must be verified by a competent person.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`ttm-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────
export default function TemporaryTrafficManagementSelectorClient() {
  // Settings
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Inputs
  const [roadTypeId, setRoadTypeId] = useState("single-a");
  const [speedMph, setSpeedMph] = useState<number>(30);
  const [worksLocationId, setWorksLocationId] = useState("nearside-lane");
  const [durationId, setDurationId] = useState("minor");
  const [nightWorks, setNightWorks] = useState(false);
  const [pedestrianDiversion, setPedestrianDiversion] = useState(false);

  // Scoring selections (index-based) — initialised from auto-sync
  const [selections, setSelections] = useState<Record<string, number>>(() =>
    autoSyncSelections("single-a", 30, "nearside-lane", "minor", false, false)
  );

  // FIX: Auto-sync scoring factors when inputs change
  useEffect(() => {
    setSelections(autoSyncSelections(roadTypeId, speedMph, worksLocationId, durationId, nightWorks, pedestrianDiversion));
  }, [roadTypeId, speedMph, worksLocationId, durationId, nightWorks, pedestrianDiversion]);

  const roadType = useMemo(() => ROAD_TYPES.find(r => r.id === roadTypeId) || ROAD_TYPES[4], [roadTypeId]);
  const availableSpeeds = roadType.availableSpeeds;

  const signing = useMemo(() => getSigningForSpeed(speedMph), [speedMph]);
  const layout = useMemo(() => selectLayout(roadTypeId, speedMph, worksLocationId, durationId), [roadTypeId, speedMph, worksLocationId, durationId]);
  const neighbours = useMemo(() => getNeighbourLayouts(layout), [layout]);
  const nhss = useMemo(() => getNHSSRequirement(roadType, speedMph, layout), [roadType, speedMph, layout]);
  const nrswa = useMemo(() => WORKS_DURATIONS.find(d => d.id === durationId) || WORKS_DURATIONS[3], [durationId]);
  const nrswaNote = useMemo(() => getNRSWANote(roadType), [roadType]);
  const operatives = useMemo(() => getOperativesRequired(layout, nightWorks, pedestrianDiversion), [layout, nightWorks, pedestrianDiversion]);
  const complexity = useMemo(() => calculateComplexityScore(selections), [selections]);
  const signingSchedule = useMemo(() => getSigningSchedule(speedMph, layout, signing, pedestrianDiversion, nightWorks), [speedMph, layout, signing, pedestrianDiversion, nightWorks]);
  const warnings = useMemo(() => generateWarnings(roadType, speedMph, layout, nightWorks, pedestrianDiversion), [roadType, speedMph, layout, nightWorks, pedestrianDiversion]);
  const recommendations = useMemo(() => generateRecommendations(roadType, speedMph, layout, nhss, complexity.band), [roadType, speedMph, layout, nhss, complexity.band]);
  const crossRefs = useMemo(() => generateCrossReferences(layout, pedestrianDiversion), [layout, pedestrianDiversion]);
  const totalSigningLength = signing.totalLeadInM + 60 + signing.exitTaperM;

  const result: TMResult = useMemo(() => ({
    layout, neighbourLayouts: neighbours, signing, nrswaNotice: nrswa,
    nhssRequirement: nhss, operativesRequired: operatives,
    complexityScore: complexity.score, maxComplexity: complexity.max,
    riskBand: complexity.band, factorScores: complexity.factorScores,
    signingSchedule, warnings, recommendations, crossReferences: crossRefs,
  }), [layout, neighbours, signing, nrswa, nhss, operatives, complexity, signingSchedule, warnings, recommendations, crossRefs]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, result, speedMph, roadType, nightWorks, pedestrianDiversion); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, result, speedMph, roadType, nightWorks, pedestrianDiversion]);

  const clearAll = useCallback(() => {
    setRoadTypeId("single-a"); setSpeedMph(30); setWorksLocationId("nearside-lane");
    setDurationId("minor"); setNightWorks(false); setPedestrianDiversion(false);
    setSelections(autoSyncSelections("single-a", 30, "nearside-lane", "minor", false, false));
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Layout", value: layout.ref, sub: layout.name.length > 35 ? layout.name.slice(0, 33) + ".." : layout.name, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Complexity", value: `${complexity.score}/${complexity.max}`, sub: complexity.band.label, ...complexity.band },
          { label: "NHSS Level", value: nhss.level === "none" ? "N/A" : nhss.level === "12a" ? "12D" : "12A/B", sub: nhss.label, bgClass: nhss.level === "none" ? "bg-emerald-50" : nhss.level === "both" ? "bg-red-50" : "bg-amber-50", textClass: nhss.level === "none" ? "text-emerald-800" : nhss.level === "both" ? "text-red-800" : "text-amber-800", borderClass: nhss.level === "none" ? "border-emerald-200" : nhss.level === "both" ? "border-red-200" : "border-amber-200", dotClass: nhss.level === "none" ? "bg-emerald-500" : nhss.level === "both" ? "bg-red-500" : "bg-amber-500" },
          { label: "Operatives", value: String(operatives), sub: `Min. ${layout.operativeMin} for this layout`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Total Length", value: `${totalSigningLength}m`, sub: "Sign + taper + safety + works + exit", bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
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

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={true}>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>{exporting ? "Exporting..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* ── Settings Panel ────────────────────────────────── */}
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

      {/* ── Input Criteria ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Site & Road Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Road Type</label>
            <select value={roadTypeId} onChange={e => { setRoadTypeId(e.target.value); const rd = ROAD_TYPES.find(r => r.id === e.target.value); if (rd) setSpeedMph(rd.defaultSpeedLimit); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {ROAD_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Speed Limit (mph)</label>
            <select value={speedMph} onChange={e => setSpeedMph(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {availableSpeeds.map(s => <option key={s} value={s}>{s} mph</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Works Location</label>
            <select value={worksLocationId} onChange={e => setWorksLocationId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {WORKS_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Works Duration / NRSWA Category</label>
            <select value={durationId} onChange={e => setDurationId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {WORKS_DURATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={nightWorks} onChange={e => setNightWorks(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
              <span className="text-sm text-gray-700 font-medium">Night Works</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pedestrianDiversion} onChange={e => setPedestrianDiversion(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
              <span className="text-sm text-gray-700 font-medium">Ped. Diversion</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Warnings ──────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
              <span className="text-lg font-bold text-red-600">!</span>
              <div className="text-xs text-red-800">{w}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Selected Layout Card ──────────────────────────── */}
      <div className="bg-white border-2 border-ebrora/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 text-sm font-bold bg-ebrora text-white rounded-lg">{layout.ref}</span>
          <h3 className="text-base font-bold text-gray-900">{layout.name}</h3>
        </div>
        <p className="text-sm text-gray-600">{layout.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 rounded-lg p-2.5"><span className="font-bold text-gray-500 uppercase tracking-wide block text-[10px]">Min Operatives</span><span className="text-base font-bold text-gray-900">{operatives}</span></div>
          <div className="bg-gray-50 rounded-lg p-2.5"><span className="font-bold text-gray-500 uppercase tracking-wide block text-[10px]">Cone Spacing</span><span className="text-base font-bold text-gray-900">{signing.coneSpacingM}m</span></div>
          <div className="bg-gray-50 rounded-lg p-2.5"><span className="font-bold text-gray-500 uppercase tracking-wide block text-[10px]">Taper Length</span><span className="text-base font-bold text-gray-900">{signing.leadInTaperM}m</span></div>
          <div className="bg-gray-50 rounded-lg p-2.5"><span className="font-bold text-gray-500 uppercase tracking-wide block text-[10px]">Safety Zone</span><span className="text-base font-bold text-gray-900">{signing.safetyZoneM}m</span></div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {layout.keyFeatures.map((f, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">{f}</span>
          ))}
        </div>
      </div>

      {/* ── Layout Schematic ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Layout Schematic (not to scale)</h3>
        <LayoutSchematic signing={signing} layout={layout} speedMph={speedMph} />
        <p className="text-[10px] text-gray-400 mt-2 italic">{layout.diagramNotes}</p>
      </div>

      {/* ── Complexity Score & Charts ─────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">TM Complexity Assessment</h3>
        <div className="space-y-3">
          {SCORING_FACTORS.map(factor => (
            <div key={factor.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-gray-700">{factor.label}</span>
                <span className="text-[10px] text-gray-400 font-medium">weight: x{factor.weight}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {factor.options.map((opt, optIndex) => (
                  <button key={`${factor.id}-${optIndex}`}
                    onClick={() => setSelections(prev => ({ ...prev, [factor.id]: optIndex }))}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                      selections[factor.id] === optIndex
                        ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ComplexityRadar factorScores={complexity.factorScores} />
          <ComplexityBars factorScores={complexity.factorScores} />
        </div>
      </div>

      {/* ── Signing Schedule ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Signing Schedule</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-3 py-2 text-left font-bold rounded-tl-lg">Sign / Element</th>
              <th className="px-3 py-2 text-left font-bold">Position</th>
              <th className="px-3 py-2 text-left font-bold">Distance</th>
              <th className="px-3 py-2 text-left font-bold rounded-tr-lg">Notes</th>
            </tr>
          </thead>
          <tbody>
            {signingSchedule.map((entry, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-3 py-2 font-medium text-gray-900">{entry.sign}</td>
                <td className="px-3 py-2 text-gray-600">{entry.position}</td>
                <td className="px-3 py-2 text-gray-600">{entry.distance}</td>
                <td className="px-3 py-2 text-gray-500">{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── NRSWA Notice ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">NRSWA Notice Requirements</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-blue-50 rounded-lg p-3"><span className="font-bold text-blue-700 uppercase tracking-wide block text-[10px]">Category</span><span className="text-sm font-bold text-blue-900">{nrswa.nrswaCategory.toUpperCase()}</span></div>
          <div className="bg-blue-50 rounded-lg p-3"><span className="font-bold text-blue-700 uppercase tracking-wide block text-[10px]">Notice Period</span><span className="text-sm font-bold text-blue-900">{nrswa.noticePeriod}</span></div>
          <div className="bg-blue-50 rounded-lg p-3"><span className="font-bold text-blue-700 uppercase tracking-wide block text-[10px]">Reference</span><span className="text-sm font-bold text-blue-900">{nrswa.noticeRef}</span></div>
          <div className="bg-blue-50 rounded-lg p-3"><span className="font-bold text-blue-700 uppercase tracking-wide block text-[10px]">Max Duration</span><span className="text-sm font-bold text-blue-900">{nrswa.maxDays === 999 ? "No limit" : `${nrswa.maxDays} days`}</span></div>
        </div>
        <p className="text-xs text-gray-600">{nrswa.description}</p>
        {nrswaNote && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">{nrswaNote}</div>}
      </div>

      {/* ── NHSS Requirements ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">NHSS Qualification Requirements</h3>
        <div className={`border-2 rounded-xl p-4 ${nhss.level === "none" ? "border-emerald-300 bg-emerald-50" : nhss.level === "both" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
          <div className="text-sm font-bold mb-1">{nhss.label}</div>
          <div className="text-xs text-gray-700">{nhss.description}</div>
        </div>
        {nhss.level !== "none" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-3"><span className="font-bold text-gray-500 uppercase block text-[10px] mb-1">Qualification</span><span className="text-gray-900">{nhss.qualification}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><span className="font-bold text-gray-500 uppercase block text-[10px] mb-1">Training Provider</span><span className="text-gray-900">{nhss.trainingProvider}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><span className="font-bold text-gray-500 uppercase block text-[10px] mb-1">Renewal</span><span className="text-gray-900">Every {nhss.renewalYears} years</span></div>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
          <div className="font-bold text-gray-700 text-[10px] uppercase">NHSS Scheme Differences</div>
          <div><span className="font-bold">NHSS 12A/B (Motorways &amp; High-Speed Duals):</span> For works on motorways and dual carriageways with speed limits of 50 mph and above. 12A covers the physical installation, maintenance, and removal of TM. 12B covers the planning, design, and management of TM schemes. Both required on these roads.</div>
          <div><span className="font-bold">NHSS 12D (Urban, Rural &amp; Low-Speed Duals):</span> For works on single carriageways, urban/rural roads, and dual carriageways at 40 mph and below. Modules: M1/M2 (operative), M3 (low-speed duals), M5 (multiphase signals), M7 (designers &amp; client officers).</div>
          <div><span className="font-bold">Key threshold:</span> 50 mph on a dual carriageway or any motorway triggers 12A/B. Everything below that on public highway uses 12D. Complex schemes on any road may also require a 12D M7 or 12B qualified designer.</div>
        </div>
      </div>

      {/* ── Comparison Table ──────────────────────────────── */}
      {neighbours.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Layout Comparison</h3>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left bg-gray-100 font-bold rounded-tl-lg"></th>
                <th className="px-3 py-2 text-left bg-ebrora/10 font-bold text-ebrora border-b-2 border-ebrora">{layout.ref} (Selected)</th>
                {neighbours.map(n => <th key={n.id} className="px-3 py-2 text-left bg-gray-100 font-bold text-gray-600">{n.ref}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Name", vals: [layout.name, ...neighbours.map(n => n.name)] },
                { label: "Min Operatives", vals: [String(layout.operativeMin), ...neighbours.map(n => String(n.operativeMin))] },
                { label: "Speed Range", vals: [`${layout.minSpeed}-${layout.maxSpeed} mph`, ...neighbours.map(n => `${n.minSpeed}-${n.maxSpeed} mph`)] },
                { label: "Key Features", vals: [layout.keyFeatures.slice(0, 3).join(", "), ...neighbours.map(n => n.keyFeatures.slice(0, 3).join(", "))] },
              ].map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="px-3 py-2 font-bold text-gray-700">{row.label}</td>
                  <td className="px-3 py-2 text-ebrora font-medium bg-ebrora/5">{row.vals[0]}</td>
                  {row.vals.slice(1).map((v, vi) => <td key={vi} className="px-3 py-2 text-gray-600">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Deployment Checklist (collapsible) ────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">TM Deployment Checklist ({DEPLOYMENT_CHECKLIST.length} items)</h3>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showChecklist ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showChecklist && (
          <div className="px-5 pb-5 space-y-4">
            {[...new Set(DEPLOYMENT_CHECKLIST.map(c => c.category))].map(cat => (
              <div key={cat}>
                <div className="text-xs font-bold text-ebrora uppercase tracking-wide mb-2">{cat}</div>
                <div className="space-y-1.5">
                  {DEPLOYMENT_CHECKLIST.filter(c => c.category === cat).map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-xs">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-ebrora mt-0.5" />
                      <div className="flex-1"><span className="text-gray-800">{item.item}</span><span className="text-gray-400 ml-2 text-[10px]">{item.regulation}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recommendations ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Recommendations</h3>
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-ebrora mt-1.5 shrink-0" />
            <span>{rec}</span>
          </div>
        ))}
      </div>

      {/* ── Cross References ──────────────────────────────── */}
      <div className="bg-ebrora-light/30 border border-ebrora/20 rounded-xl p-4">
        <h3 className="text-xs font-bold text-ebrora uppercase tracking-wide mb-2">Related Ebrora Tools</h3>
        <div className="space-y-1">
          {crossRefs.map((ref, i) => (
            <div key={i} className="text-xs text-ebrora/80">{ref}</div>
          ))}
        </div>
      </div>

      {/* ── Risk Band Key ─────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Complexity Risk Bands</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {RISK_BANDS.map(band => (
            <div key={band.label} className={`rounded-lg p-2.5 border ${band.bgClass} ${band.borderClass}`}>
              <div className={`text-xs font-bold ${band.textClass}`}>{band.label}</div>
              <div className={`text-[10px] mt-0.5 opacity-70 ${band.textClass}`}>{band.min}-{band.max} points</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Regulatory References ─────────────────────────── */}
      <div className="text-[10px] text-gray-400 space-y-0.5 px-1">
        <div>Chapter 8 Traffic Signs Manual (2009) | Safety at Street Works and Road Works Code of Practice (2013)</div>
        <div>NRSWA 1991 | TMA 2004 | TSRGD 2016 | GG 104 | NHSS 12A/B &amp; 12D | MHSWR 1999</div>
      </div>
    </div>
  );
}
