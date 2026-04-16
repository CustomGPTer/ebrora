// src/components/excavation-batter-angle-calculator/ExcavationBatterAngleCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  SOIL_TYPES, SURCHARGE_OPTIONS, WATER_OPTIONS, DURATION_OPTIONS,
  REGULATIONS, REFERENCE_SOURCES, COMPETENT_PERSON_GUIDANCE, CROSS_REFS,
  DEFAULT_INPUTS, MIN_DEPTH_M, MAX_DEPTH_M,
  computeBatter, getSoil,
} from "@/data/excavation-batter-angle-calculator";
import type {
  SoilCategory, SurchargeType, WaterCondition, DurationBand, ExcavationShape,
  ProjectInputs, BatterResult, RagBand,
} from "@/data/excavation-batter-angle-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Live SVG cross-section ──────────────────────────────────────
// Draws a realistic side-on view of a battered excavation showing
// base, sloped sides, ground line, dimensions, and a plant/person
// silhouette at the declared surcharge standoff (when relevant).
function CrossSectionDiagram({
  inputs, result,
}: {
  inputs: ProjectInputs;
  result: BatterResult;
}) {
  const W = 560, H = 320;
  const PAD = { top: 30, right: 30, bottom: 50, left: 30 };
  const drawW = W - PAD.left - PAD.right;
  const drawH = H - PAD.top - PAD.bottom;

  // Figure out scale. We need to fit:
  //   horizontal: baseWidth + 2 * toeToCrest + ~margin each side
  //   vertical:   depth + a bit of sky
  const baseW = Math.max(0.5, inputs.baseWidth || 1.5); // fallback for display only
  const offset = result.toeToCrestPlanDistance;
  const totalWorld = baseW + 2 * offset + 2; // +1m margin each side
  const depthWorld = Math.max(0.5, inputs.depth || 1);
  const skyWorld = Math.max(0.8, depthWorld * 0.4);

  const scaleX = drawW / totalWorld;
  const scaleY = drawH / (depthWorld + skyWorld);
  const scale = Math.min(scaleX, scaleY); // preserve aspect

  const actualDrawW = totalWorld * scale;
  const actualDrawH = (depthWorld + skyWorld) * scale;
  const originX = PAD.left + (drawW - actualDrawW) / 2;
  const originY = PAD.top + (drawH - actualDrawH) / 2;

  // World -> screen helpers
  const wx = (m: number) => originX + (m + 1) * scale; // +1m left margin
  const wy = (m: number) => originY + (skyWorld + m) * scale; // m measured downwards

  const groundY = wy(0);
  const baseY = wy(depthWorld);

  // Excavation polygon (trapezium, side view)
  const leftCrestX = wx(0);
  const rightCrestX = wx(baseW + 2 * offset);
  const leftToeX = wx(offset);
  const rightToeX = wx(offset + baseW);

  const excavationPath = result.viable
    ? `M ${leftCrestX},${groundY} L ${leftToeX},${baseY} L ${rightToeX},${baseY} L ${rightCrestX},${groundY} Z`
    : // fallback: vertical cut representation (red strikethrough) for non-viable
      `M ${leftCrestX},${groundY} L ${leftCrestX},${baseY} L ${rightCrestX},${baseY} L ${rightCrestX},${groundY} Z`;

  // Ground line extends across full width
  const groundLineL = PAD.left;
  const groundLineR = W - PAD.right;

  // Surcharge marker (person/plant) at declared standoff
  const showSurcharge = inputs.surcharge !== "none";
  const standoff = inputs.standoffMetres > 0 ? inputs.standoffMetres : 1.5;
  const surchargeX = leftCrestX - standoff * scale;

  // Dimension annotations
  const angleLabel = result.viable ? `${result.finalAngleDeg.toFixed(0)}°` : "N/A";
  const ratioLabel = result.viable ? `1 V : ${result.finalRatioH.toFixed(2)} H` : "support";

  // RAG fill colour
  const ragFill =
    result.rag === "green" ? "rgba(22,163,74,0.12)" :
    result.rag === "amber" ? "rgba(217,119,6,0.14)" :
    "rgba(220,38,38,0.14)";
  const ragStroke =
    result.rag === "green" ? "#16A34A" :
    result.rag === "amber" ? "#D97706" :
    "#DC2626";

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 360 }}>
        {/* Sky gradient background */}
        <defs>
          <linearGradient id="bat-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
          <pattern id="bat-soil" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#D4A373" />
            <circle cx="2" cy="2" r="0.6" fill="#A17853" />
            <circle cx="6" cy="5" r="0.5" fill="#A17853" />
            <circle cx="4" cy="7" r="0.4" fill="#A17853" />
          </pattern>
          <pattern id="bat-water" patternUnits="userSpaceOnUse" width="12" height="6">
            <rect width="12" height="6" fill="#93C5FD" opacity="0.35" />
            <path d="M 0 3 Q 3 0 6 3 T 12 3" stroke="#3B82F6" strokeWidth="0.5" fill="none" opacity="0.6" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={groundY} fill="url(#bat-sky)" />

        {/* Soil mass (full rectangle beneath ground line), excavation will "carve" it */}
        <rect
          x={groundLineL} y={groundY}
          width={groundLineR - groundLineL}
          height={H - PAD.bottom - groundY}
          fill="url(#bat-soil)"
        />

        {/* Excavation cut-out (white fill) */}
        <path d={excavationPath} fill="#FFFFFF" stroke={ragStroke} strokeWidth={1.8} />

        {/* RAG-tinted fill over the excavation */}
        <path d={excavationPath} fill={ragFill} />

        {/* Ground line */}
        <line x1={groundLineL} y1={groundY} x2={leftCrestX} y2={groundY} stroke="#57534E" strokeWidth={1.5} />
        <line x1={rightCrestX} y1={groundY} x2={groundLineR} y2={groundY} stroke="#57534E" strokeWidth={1.5} />

        {/* Water level indicator (if damp/active) */}
        {(inputs.water === "damp" || inputs.water === "active") && (
          <g>
            <line
              x1={leftToeX} y1={baseY - (inputs.water === "active" ? depthWorld * 0.4 * scale : depthWorld * 0.15 * scale)}
              x2={rightToeX} y2={baseY - (inputs.water === "active" ? depthWorld * 0.4 * scale : depthWorld * 0.15 * scale)}
              stroke="#3B82F6" strokeWidth={1.2} strokeDasharray="3,2" opacity={0.8}
            />
            <text
              x={rightToeX + 4}
              y={baseY - (inputs.water === "active" ? depthWorld * 0.4 * scale : depthWorld * 0.15 * scale) + 3}
              fontSize={9} fill="#1D4ED8" fontWeight={600}
            >
              WL
            </text>
          </g>
        )}

        {/* Surcharge indicator (simplified plant/person) */}
        {showSurcharge && result.viable && surchargeX > groundLineL + 6 && (
          <g>
            {inputs.surcharge === "heavy-plant" || inputs.surcharge === "traffic" ? (
              // Lorry/plant block
              <g>
                <rect x={surchargeX - 16} y={groundY - 16} width={32} height={11} fill="#F97316" stroke="#C2410C" strokeWidth={0.8} rx={1} />
                <circle cx={surchargeX - 10} cy={groundY - 3} r={2.5} fill="#374151" />
                <circle cx={surchargeX + 10} cy={groundY - 3} r={2.5} fill="#374151" />
              </g>
            ) : inputs.surcharge === "light-plant" ? (
              <g>
                <rect x={surchargeX - 10} y={groundY - 12} width={20} height={8} fill="#FBBF24" stroke="#B45309" strokeWidth={0.8} rx={1} />
                <circle cx={surchargeX - 6} cy={groundY - 3} r={2} fill="#374151" />
                <circle cx={surchargeX + 6} cy={groundY - 3} r={2} fill="#374151" />
              </g>
            ) : inputs.surcharge === "stockpile" ? (
              // Triangle (spoil pile)
              <path
                d={`M ${surchargeX - 14},${groundY} L ${surchargeX},${groundY - 16} L ${surchargeX + 14},${groundY} Z`}
                fill="#A16207" stroke="#78350F" strokeWidth={0.8}
              />
            ) : (
              // Pedestrian stick figure
              <g stroke="#111827" strokeWidth={1.2} fill="none">
                <circle cx={surchargeX} cy={groundY - 16} r={2.5} fill="#111827" />
                <line x1={surchargeX} y1={groundY - 14} x2={surchargeX} y2={groundY - 6} />
                <line x1={surchargeX} y1={groundY - 10} x2={surchargeX - 3} y2={groundY - 7} />
                <line x1={surchargeX} y1={groundY - 10} x2={surchargeX + 3} y2={groundY - 7} />
                <line x1={surchargeX} y1={groundY - 6} x2={surchargeX - 3} y2={groundY - 1} />
                <line x1={surchargeX} y1={groundY - 6} x2={surchargeX + 3} y2={groundY - 1} />
              </g>
            )}
            {/* Standoff dimension */}
            <line x1={surchargeX} y1={groundY + 5} x2={leftCrestX} y2={groundY + 5} stroke="#DC2626" strokeWidth={0.8} />
            <line x1={surchargeX} y1={groundY + 3} x2={surchargeX} y2={groundY + 7} stroke="#DC2626" strokeWidth={0.8} />
            <line x1={leftCrestX} y1={groundY + 3} x2={leftCrestX} y2={groundY + 7} stroke="#DC2626" strokeWidth={0.8} />
            <text x={(surchargeX + leftCrestX) / 2} y={groundY + 14} fontSize={8} fill="#991B1B" fontWeight={600} textAnchor="middle">
              {standoff.toFixed(2)} m
            </text>
          </g>
        )}

        {/* Depth dimension line (right side) */}
        {result.viable && (
          <g>
            <line x1={rightCrestX + 15} y1={groundY} x2={rightCrestX + 15} y2={baseY} stroke="#374151" strokeWidth={0.8} />
            <line x1={rightCrestX + 12} y1={groundY} x2={rightCrestX + 18} y2={groundY} stroke="#374151" strokeWidth={0.8} />
            <line x1={rightCrestX + 12} y1={baseY} x2={rightCrestX + 18} y2={baseY} stroke="#374151" strokeWidth={0.8} />
            <text
              x={rightCrestX + 20} y={(groundY + baseY) / 2 + 3}
              fontSize={9} fill="#111827" fontWeight={600}
            >
              {inputs.depth.toFixed(2)} m
            </text>
          </g>
        )}

        {/* Base width dimension (bottom) */}
        {result.viable && inputs.baseWidth > 0 && (
          <g>
            <line x1={leftToeX} y1={baseY + 10} x2={rightToeX} y2={baseY + 10} stroke="#374151" strokeWidth={0.8} />
            <line x1={leftToeX} y1={baseY + 7} x2={leftToeX} y2={baseY + 13} stroke="#374151" strokeWidth={0.8} />
            <line x1={rightToeX} y1={baseY + 7} x2={rightToeX} y2={baseY + 13} stroke="#374151" strokeWidth={0.8} />
            <text
              x={(leftToeX + rightToeX) / 2} y={baseY + 20}
              fontSize={9} fill="#111827" fontWeight={600} textAnchor="middle"
            >
              Base {inputs.baseWidth.toFixed(2)} m
            </text>
          </g>
        )}

        {/* Top width dimension (above ground) */}
        {result.viable && inputs.baseWidth > 0 && result.topWidth !== null && (
          <g>
            <line x1={leftCrestX} y1={groundY - 12} x2={rightCrestX} y2={groundY - 12} stroke="#059669" strokeWidth={0.8} />
            <line x1={leftCrestX} y1={groundY - 15} x2={leftCrestX} y2={groundY - 9} stroke="#059669" strokeWidth={0.8} />
            <line x1={rightCrestX} y1={groundY - 15} x2={rightCrestX} y2={groundY - 9} stroke="#059669" strokeWidth={0.8} />
            <text
              x={(leftCrestX + rightCrestX) / 2} y={groundY - 15}
              fontSize={9} fill="#065F46" fontWeight={700} textAnchor="middle"
            >
              Top {result.topWidth.toFixed(2)} m
            </text>
          </g>
        )}

        {/* Angle arc at left toe (arc opens up-and-left, matching the slope direction) */}
        {result.viable && (
          <g>
            <path
              d={`M ${leftToeX + 22},${baseY} A 22 22 0 0 0 ${leftToeX - 22 * Math.cos(result.finalAngleDeg * Math.PI / 180)},${baseY - 22 * Math.sin(result.finalAngleDeg * Math.PI / 180)}`}
              fill="none" stroke={ragStroke} strokeWidth={1.5}
              opacity={0.7}
            />
            <text
              x={leftToeX + 4} y={baseY - 6}
              fontSize={11} fill={ragStroke} fontWeight={700}
            >
              {angleLabel}
            </text>
          </g>
        )}

        {/* Ratio label (centre of slope) */}
        {result.viable && (
          <text
            x={(leftCrestX + leftToeX) / 2 - 4}
            y={(groundY + baseY) / 2 - 3}
            fontSize={8} fill="#374151" fontWeight={600}
            transform={`rotate(-${result.finalAngleDeg} ${(leftCrestX + leftToeX) / 2 - 4} ${(groundY + baseY) / 2 - 3})`}
          >
            {ratioLabel}
          </text>
        )}

        {/* Not-viable overlay */}
        {!result.viable && result.supportReason && (
          <g>
            <rect x={leftCrestX} y={groundY} width={rightCrestX - leftCrestX} height={baseY - groundY} fill="rgba(220,38,38,0.2)" />
            <text
              x={(leftCrestX + rightCrestX) / 2} y={(groundY + baseY) / 2}
              fontSize={14} fill="#991B1B" fontWeight={700} textAnchor="middle"
            >
              SUPPORT REQUIRED
            </text>
            <text
              x={(leftCrestX + rightCrestX) / 2} y={(groundY + baseY) / 2 + 14}
              fontSize={9} fill="#7F1D1D" textAnchor="middle"
            >
              Batter not viable for these conditions
            </text>
          </g>
        )}

        {/* Scale legend */}
        <g>
          <line x1={PAD.left} y1={H - 20} x2={PAD.left + scale} y2={H - 20} stroke="#111827" strokeWidth={1.5} />
          <line x1={PAD.left} y1={H - 23} x2={PAD.left} y2={H - 17} stroke="#111827" strokeWidth={1.5} />
          <line x1={PAD.left + scale} y1={H - 23} x2={PAD.left + scale} y2={H - 17} stroke="#111827" strokeWidth={1.5} />
          <text x={PAD.left + scale + 5} y={H - 16} fontSize={9} fill="#111827" fontWeight={600}>
            1.00 m (scale)
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── PDF Export (PAID = dark header) ─────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  inputs: ProjectInputs,
  result: BatterResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  const docRef = `BAT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let y = 0;

  const soil = inputs.soil ? getSoil(inputs.soil) : undefined;
  const surcharge = SURCHARGE_OPTIONS.find(s => s.id === inputs.surcharge);
  const water = WATER_OPTIONS.find(w => w.id === inputs.water);
  const duration = DURATION_OPTIONS.find(d => d.id === inputs.duration);

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("EXCAVATION BATTER ANGLE ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 60, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  function sectionHead(title: string) {
    checkPage(12);
    doc.setFillColor(30, 30, 30); doc.rect(M, y, 3, 6, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
    doc.text(title, M + 6, y + 4.5);
    doc.setTextColor(0, 0, 0); y += 9;
  }

  // ── Dark header ────────────────────────────────────────────────
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("EXCAVATION BATTER ANGLE ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("BS 6031:2009 / BS EN 1997-1 / HSG150 / CDM 2015 reg 22", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel ────────────────────────────────────────────
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y + 1, 50);
  drawFld("Site:", header.site, M + CW / 2, y + 1, 50);
  drawFld("Site Manager:", header.manager, M + 3, y + 8, 40);
  drawFld("Assessed By:", header.assessedBy, M + CW / 2, y + 8, 40);
  drawFld("Date:", header.date, M + 3, y + 15, 30);
  drawFld("Competent Person:", inputs.competentPersonName, M + CW / 2, y + 15, 50);
  y += 22;

  // ── Scope paragraph ────────────────────────────────────────────
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const shapeLabel = inputs.shape === "linear-trench" ? "linear trench" : "rectangular pit";
  const scopeText = `Open-cut batter angle assessment for a ${shapeLabel} on ${header.site || "the above site"}. Excavation depth ${inputs.depth.toFixed(2)} m, soil category "${soil?.label || "not set"}", water condition "${water?.label || ""}", surcharge "${surcharge?.label || ""}", duration "${duration?.label || ""}". Geometry and batter angle derived from BS 6031:2009 and BS EN 1997-1 with modifiers applied per HSE HSG150.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── RAG banner ────────────────────────────────────────────────
  checkPage(20);
  const ragColour: [number, number, number] =
    result.rag === "green" ? [22, 163, 74] :
    result.rag === "amber" ? [217, 119, 6] :
    [220, 38, 38];
  const ragLabel =
    result.rag === "green" ? "VIABLE -- Open-Cut Batter Acceptable" :
    result.rag === "amber" ? "CAUTION -- Designer Review Recommended" :
    "NOT VIABLE -- Support Required";
  doc.setFillColor(ragColour[0], ragColour[1], ragColour[2]);
  doc.roundedRect(M, y, CW, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(ragLabel, M + 5, y + 7);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const bannerSub = result.viable
    ? `Batter ${result.finalAngleDeg.toFixed(1)}° (${result.finalRatio}) -- toe-to-crest offset ${result.toeToCrestPlanDistance.toFixed(2)} m per side`
    : result.supportReason || "Batter not viable -- design an engineered support system.";
  doc.text(bannerSub, M + 5, y + 13);
  doc.setTextColor(0, 0, 0); y += 22;

  // ── Key results summary panel ─────────────────────────────────
  const summaryItems: [string, string][] = [
    ["Soil category:", soil?.label || "(not set)"],
    ["BS 5930 descriptor:", soil?.bs5930 || ""],
    ...(soil?.undrainedShearStrength ? [["Undrained shear strength:", soil.undrainedShearStrength] as [string, string]] : []),
    ["Base batter angle (dry, short-term):", result.baseAngleDeg > 0 ? `${result.baseAngleDeg.toFixed(0)}°` : "N/A"],
    ["Total reduction applied:", `${result.totalReductionDeg.toFixed(0)}° (surcharge ${surcharge?.angleReductionDeg ?? 0}°, water ${water?.angleReductionDeg ?? 0}°, duration ${duration?.angleReductionDeg ?? 0}°)`],
    ["Final batter angle:", result.viable ? `${result.finalAngleDeg.toFixed(1)}°` : "N/A"],
    ["Final H:V ratio:", result.finalRatio],
    ["Toe-to-crest offset:", result.viable ? `${result.toeToCrestPlanDistance.toFixed(2)} m per side` : "N/A"],
    ["Base width:", inputs.baseWidth > 0 ? `${inputs.baseWidth.toFixed(2)} m` : "(not entered)"],
    ...(inputs.shape === "rectangular-pit" ? [["Base length:", inputs.baseLength > 0 ? `${inputs.baseLength.toFixed(2)} m` : "(not entered)"] as [string, string]] : []),
    ["Top width:", result.topWidth !== null ? `${result.topWidth.toFixed(2)} m` : "(enter base width)"],
    ...(inputs.shape === "rectangular-pit" && result.topLength !== null ? [["Top length:", `${result.topLength.toFixed(2)} m`] as [string, string]] : []),
    ["Volume vs vertical cut:", result.volumeFactorVsVertical > 1 ? `${result.volumeFactorVsVertical.toFixed(2)}x (+${result.volumeIncreasePercent.toFixed(1)}%)` : "(enter base width)"],
    ["Support advised?:", result.supportAdvised || !result.viable ? "YES" : "NO"],
    ["Designer review required?:", result.designerReviewRequired ? "YES" : "NO"],
  ];
  const panelH = summaryItems.length * 4 + 8;
  checkPage(panelH + 10);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const valLines = doc.splitTextToSize(value, CW - 90);
    doc.text(valLines[0], M + 78, y);
    doc.setTextColor(0, 0, 0); y += 4;
  });
  y += 4;

  // ── Inputs & modifiers table ──────────────────────────────────
  checkPage(60);
  sectionHead("Inputs & Applied Modifiers");
  const inputRows: [string, string, string][] = [
    ["Excavation shape:", inputs.shape === "linear-trench" ? "Linear trench (2 sloped sides)" : "Rectangular pit (4 sloped sides)", ""],
    ["Excavation depth:", `${inputs.depth.toFixed(2)} m`, ""],
    ["Soil category:", soil?.label || "(not set)", soil?.bs5930 || ""],
    ["Surcharge:", surcharge?.label || "", `-${surcharge?.angleReductionDeg ?? 0}°`],
    ["Water condition:", water?.label || "", water?.angleReductionDeg !== null && water?.angleReductionDeg !== undefined ? `-${water.angleReductionDeg}°` : "dewater first"],
    ["Duration:", duration?.label || "", `-${duration?.angleReductionDeg ?? 0}°`],
    ["Surcharge standoff:", inputs.standoffMetres > 0 ? `${inputs.standoffMetres.toFixed(2)} m` : "(not entered)", ""],
  ];
  // Header
  const cols = [55, 85, 42];
  let cx = M;
  ["Parameter", "Value", "Modifier"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  inputRows.forEach((row, ri) => {
    checkPage(6);
    cx = M;
    row.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.setDrawColor(200, 200, 200); doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.8);
      const lines = doc.splitTextToSize(t, cols[i] - 3);
      doc.text(lines[0], cx + 2, y + 3.8);
      cx += cols[i];
    });
    y += 5.5;
  });
  y += 6;

  // ── Cross-section diagram (simplified in PDF) ─────────────────
  if (result.viable && inputs.depth > 0) {
    checkPage(85);
    sectionHead("Cross-Section (Indicative)");
    const diagW = CW, diagH = 65;
    const diagX = M, diagY = y;
    // Background
    doc.setFillColor(232, 240, 255); doc.rect(diagX, diagY, diagW, diagH * 0.35, "F");
    doc.setFillColor(212, 163, 115); doc.rect(diagX, diagY + diagH * 0.35, diagW, diagH * 0.65, "F");
    // Compute scale
    const baseW = Math.max(0.5, inputs.baseWidth || 1.5);
    const offset = result.toeToCrestPlanDistance;
    const totalWorld = baseW + 2 * offset + 2;
    const depthWorld = Math.max(0.5, inputs.depth);
    const skyRatio = 0.35;
    const scaleX = diagW / totalWorld;
    const scaleY = (diagH * (1 - skyRatio)) / depthWorld;
    const scale = Math.min(scaleX, scaleY);
    const actualDrawW = totalWorld * scale;
    const originX = diagX + (diagW - actualDrawW) / 2;
    const originY = diagY + diagH * skyRatio;
    const wx = (m: number) => originX + (m + 1) * scale;
    const wy = (m: number) => originY + m * scale;
    const leftCrestX = wx(0);
    const rightCrestX = wx(baseW + 2 * offset);
    const leftToeX = wx(offset);
    const rightToeX = wx(offset + baseW);
    const groundY = wy(0);
    const baseY = wy(depthWorld);

    // Draw excavation (white polygon cuts out soil)
    doc.setFillColor(255, 255, 255); doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
    doc.lines(
      [
        [leftToeX - leftCrestX, baseY - groundY],
        [rightToeX - leftToeX, 0],
        [rightCrestX - rightToeX, -(baseY - groundY)],
        [-(rightCrestX - leftCrestX), 0],
      ],
      leftCrestX, groundY, [1, 1], "FD", true,
    );
    doc.setLineWidth(0.2);

    // RAG tint
    const ragRGB: [number, number, number] =
      result.rag === "green" ? [34, 197, 94] :
      result.rag === "amber" ? [217, 119, 6] :
      [220, 38, 38];
    doc.setFillColor(ragRGB[0], ragRGB[1], ragRGB[2]);
    // Approximate via light trapezium (jspdf lacks alpha; use thin outline instead)
    doc.setDrawColor(ragRGB[0], ragRGB[1], ragRGB[2]); doc.setLineWidth(0.8);
    doc.lines(
      [
        [leftToeX - leftCrestX, baseY - groundY],
        [rightToeX - leftToeX, 0],
        [rightCrestX - rightToeX, -(baseY - groundY)],
        [-(rightCrestX - leftCrestX), 0],
      ],
      leftCrestX, groundY, [1, 1], "D", true,
    );
    doc.setLineWidth(0.2); doc.setDrawColor(200, 200, 200);

    // Depth label (right side)
    doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.3);
    doc.line(rightCrestX + 3, groundY, rightCrestX + 3, baseY);
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
    doc.text(`${inputs.depth.toFixed(2)} m`, rightCrestX + 5, (groundY + baseY) / 2 + 1);

    // Top width label
    if (inputs.baseWidth > 0 && result.topWidth !== null) {
      doc.line(leftCrestX, groundY - 3, rightCrestX, groundY - 3);
      doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 101, 52);
      doc.text(`Top ${result.topWidth.toFixed(2)} m`, (leftCrestX + rightCrestX) / 2 - 10, groundY - 4.5);
    }

    // Base width label
    if (inputs.baseWidth > 0) {
      doc.line(leftToeX, baseY + 3, rightToeX, baseY + 3);
      doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
      doc.text(`Base ${inputs.baseWidth.toFixed(2)} m`, (leftToeX + rightToeX) / 2 - 10, baseY + 6);
    }

    // Angle at left toe
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(ragRGB[0], ragRGB[1], ragRGB[2]);
    doc.text(`${result.finalAngleDeg.toFixed(0)}°`, leftToeX + 4, baseY - 2);
    doc.setTextColor(0, 0, 0); doc.setLineWidth(0.2);

    y = diagY + diagH + 4;
  }

  // ── Warnings (if any) ─────────────────────────────────────────
  if (result.warnings.length > 0) {
    checkPage(20 + result.warnings.length * 6);
    sectionHead("Warnings & Observations");
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    result.warnings.forEach(w => {
      checkPage(8);
      const lines = doc.splitTextToSize(`- ${w}`, CW - 6);
      doc.text(lines, M + 2, y); y += lines.length * 3.5 + 1;
    });
    y += 3;
  }

  // ── Soil guidance ─────────────────────────────────────────────
  if (soil) {
    checkPage(20);
    sectionHead(`Soil Guidance -- ${soil.label}`);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    const guidLines = doc.splitTextToSize(soil.guidance, CW - 4);
    doc.text(guidLines, M + 2, y); y += guidLines.length * 3.5 + 3;
  }

  // ── Competent-person guidance ─────────────────────────────────
  checkPage(35);
  sectionHead(COMPETENT_PERSON_GUIDANCE.title);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const cpDesc = doc.splitTextToSize(COMPETENT_PERSON_GUIDANCE.description, CW - 4);
  doc.text(cpDesc, M + 2, y); y += cpDesc.length * 3.5 + 2;
  COMPETENT_PERSON_GUIDANCE.bullets.forEach(b => {
    checkPage(8);
    const lines = doc.splitTextToSize(`- ${b}`, CW - 6);
    doc.text(lines, M + 2, y); y += lines.length * 3.5 + 1;
  });
  y += 3;

  // ── Regulations table ─────────────────────────────────────────
  checkPage(25);
  sectionHead("Regulatory References");
  {
    cx = M;
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, CW, 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text("Standard / Regulation", cx + 2, y + 4);
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);
    REGULATIONS.forEach((reg, ri) => {
      checkPage(6);
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y, CW, 5.5, "FD"); }
      else { doc.setDrawColor(200, 200, 200); doc.rect(M, y, CW, 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      doc.text(reg, M + 2, y + 3.8);
      y += 5.5;
    });
    y += 6;
  }

  // ── Cross-references ──────────────────────────────────────────
  checkPage(25);
  sectionHead("Related Ebrora Tools");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  CROSS_REFS.forEach(cr => {
    checkPage(6);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${cr.name}:`, M + 2, y);
    doc.setFont("helvetica", "normal");
    const crLines = doc.splitTextToSize(cr.relevance, CW - 55);
    doc.text(crLines[0], M + 55, y);
    y += 4;
  });
  y += 4;

  // ── Sign-off ─────────────────────────────────────────────────
  checkPage(55);
  y += 2;
  doc.setDrawColor(30, 30, 30); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); doc.setLineWidth(0.2); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Competent Person", M + 3, y + 5.5); doc.text("Temporary Works Designer (>4.5 m)", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer on all pages ───────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Excavation batter angle assessment per BS 6031:2009 / BS EN 1997-1 / HSE HSG150. Indicative only -- competent person must verify against actual ground conditions on site.",
      M, 288,
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 60, 292);
  }

  doc.save(`excavation-batter-angle-${todayISO()}.pdf`);
}

// ─── Main component ──────────────────────────────────────────────
export default function ExcavationBatterAngleCalculatorClient() {
  // Settings (standard 5-col PAID grid)
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Project inputs
  const [inputs, setInputs] = useState<ProjectInputs>({ ...DEFAULT_INPUTS });
  const updateInput = useCallback(<K extends keyof ProjectInputs>(key: K, value: ProjectInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => computeBatter(inputs), [inputs]);

  const handleExport = useCallback(async () => {
    if (!inputs.soil) return;
    setExporting(true);
    try {
      await exportPDF({ company, site, manager, assessedBy, date: assessDate }, inputs, result);
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, inputs, result]);

  const clearAll = useCallback(() => {
    setInputs({ ...DEFAULT_INPUTS });
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const ragTone = (rag: RagBand) => {
    if (rag === "green") return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" };
    if (rag === "amber") return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" };
    return { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-red-500" };
  };
  const ragLabel = (rag: RagBand) => rag === "green" ? "VIABLE" : rag === "amber" ? "CAUTION" : "NOT VIABLE";

  const soilChosen = inputs.soil ? getSoil(inputs.soil) : undefined;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Batter Angle",
            value: inputs.soil && result.viable ? `${result.finalAngleDeg.toFixed(1)}°` : "--",
            sub: inputs.soil && result.viable ? result.finalRatio : (inputs.soil ? "Support required" : "Select soil"),
            tone: inputs.soil ? ragTone(result.rag) : ragTone("amber"),
          },
          {
            label: "Top Width",
            value: result.topWidth !== null ? `${result.topWidth.toFixed(2)} m` : "--",
            sub: result.topWidth !== null ? `Base ${inputs.baseWidth.toFixed(2)} m + 2 x ${result.toeToCrestPlanDistance.toFixed(2)} m` : "Enter base width",
            tone: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-500" },
          },
          {
            label: "Volume Factor",
            value: inputs.baseWidth > 0 && inputs.depth > 0 ? `${result.volumeFactorVsVertical.toFixed(2)}x` : "--",
            sub: inputs.baseWidth > 0 && inputs.depth > 0 ? `+${result.volumeIncreasePercent.toFixed(1)}% vs vertical` : "Enter base & depth",
            tone: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", dot: "bg-purple-500" },
          },
          {
            label: "Status",
            value: inputs.soil ? ragLabel(result.rag) : "--",
            sub: result.designerReviewRequired ? "Designer review required" : result.supportAdvised ? "Support advised" : inputs.soil ? "Competent person to confirm" : "Enter inputs",
            tone: inputs.soil ? ragTone(result.rag) : ragTone("amber"),
          },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.tone.bg} ${c.tone.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${c.tone.dot}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wide ${c.tone.text}`}>{c.label}</span>
            </div>
            <div className={`text-xl font-bold ${c.tone.text}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.tone.text}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        {inputs.soil && (
          <PaidDownloadButton hasData={true}>
            <button onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </PaidDownloadButton>
        )}
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Company", v: company, s: setCompany },
            { l: "Site Name", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Assessed By", v: assessedBy, s: setAssessedBy },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.l}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* Two-column: Inputs + Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT: Inputs (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Inputs</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">BS 6031 / Eurocode 7 open-cut batter design inputs.</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Shape */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Excavation Shape</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "linear-trench", label: "Linear Trench", desc: "2 sloped sides" },
                    { id: "rectangular-pit", label: "Rectangular Pit", desc: "4 sloped sides" },
                  ] as { id: ExcavationShape; label: string; desc: string }[]).map(s => (
                    <button key={s.id} onClick={() => updateInput("shape", s.id)}
                      className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${inputs.shape === s.id ? "border-ebrora bg-ebrora-light/30" : "border-gray-200 hover:border-ebrora/40"}`}>
                      <div className={`text-sm font-bold ${inputs.shape === s.id ? "text-ebrora" : "text-gray-800"}`}>{s.label}</div>
                      <div className="text-[10px] text-gray-500">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Depth (m)</label>
                  <input type="number" min={0} max={MAX_DEPTH_M} step={0.1} value={inputs.depth || ""}
                    onChange={e => updateInput("depth", Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                  <div className="text-[10px] text-gray-400 mt-0.5">Min {MIN_DEPTH_M} m -- Max {MAX_DEPTH_M} m</div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Base Width (m) <span className="text-gray-300 normal-case">optional</span></label>
                  <input type="number" min={0} step={0.1} value={inputs.baseWidth || ""}
                    onChange={e => updateInput("baseWidth", Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                </div>
                {inputs.shape === "rectangular-pit" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Base Length (m) <span className="text-gray-300 normal-case">optional</span></label>
                    <input type="number" min={0} step={0.1} value={inputs.baseLength || ""}
                      onChange={e => updateInput("baseLength", Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                  </div>
                )}
              </div>

              {/* Soil */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Soil Type (BS 5930 descriptor)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOIL_TYPES.map(s => (
                    <button key={s.id} onClick={() => updateInput("soil", s.id)}
                      className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${inputs.soil === s.id ? "border-ebrora bg-ebrora-light/30" : "border-gray-200 hover:border-ebrora/40"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className={`text-xs font-bold ${inputs.soil === s.id ? "text-ebrora" : "text-gray-800"}`}>{s.label}</div>
                        {s.baseAngleDeg !== null ? (
                          <span className="text-[10px] font-bold text-gray-500 shrink-0">{s.baseAngleDeg}°</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 shrink-0">SUPPORT</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{s.bs5930}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surcharge */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Surcharge Loading</label>
                <select value={inputs.surcharge} onChange={e => updateInput("surcharge", e.target.value as SurchargeType)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  {SURCHARGE_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}{s.angleReductionDeg > 0 ? ` (-${s.angleReductionDeg}°)` : ""}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-gray-400 mt-0.5">{SURCHARGE_OPTIONS.find(s => s.id === inputs.surcharge)?.description}</div>
              </div>

              {/* Standoff (only if surcharge) */}
              {inputs.surcharge !== "none" && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Surcharge Standoff (m) <span className="text-gray-300 normal-case">optional</span></label>
                  <input type="number" min={0} step={0.1} value={inputs.standoffMetres || ""}
                    onChange={e => updateInput("standoffMetres", Number(e.target.value) || 0)}
                    placeholder="Default 1.5 m assumed"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                </div>
              )}

              {/* Water */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Water Condition</label>
                <select value={inputs.water} onChange={e => updateInput("water", e.target.value as WaterCondition)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  {WATER_OPTIONS.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.label}{w.angleReductionDeg !== null && w.angleReductionDeg > 0 ? ` (-${w.angleReductionDeg}°)` : w.angleReductionDeg === null ? " (dewater)" : ""}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-gray-400 mt-0.5">{WATER_OPTIONS.find(w => w.id === inputs.water)?.description}</div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duration</label>
                <select value={inputs.duration} onChange={e => updateInput("duration", e.target.value as DurationBand)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  {DURATION_OPTIONS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}{d.angleReductionDeg > 0 ? ` (-${d.angleReductionDeg}°)` : ""}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-gray-400 mt-0.5">{DURATION_OPTIONS.find(d => d.id === inputs.duration)?.description}</div>
              </div>

              {/* Competent person (optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Competent Person <span className="text-gray-300 normal-case">optional</span></label>
                <input type="text" value={inputs.competentPersonName} onChange={e => updateInput("competentPersonName", e.target.value)}
                  placeholder="Name of competent person signing off"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live diagram + results (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Live Cross-Section</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Updates as you change inputs. Indicative only.</p>
            </div>
            <div className="p-3">
              {inputs.soil ? (
                <CrossSectionDiagram inputs={inputs} result={result} />
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">
                  Select soil type and depth to see the cross-section.
                </div>
              )}
            </div>
          </div>

          {/* Soil guidance */}
          {soilChosen && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">{soilChosen.label}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{soilChosen.bs5930}{soilChosen.undrainedShearStrength ? ` | ${soilChosen.undrainedShearStrength}` : ""}</p>
              </div>
              <div className="p-4 text-xs text-gray-600 leading-relaxed">{soilChosen.guidance}</div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200">
                <h3 className="text-sm font-bold text-amber-800">Warnings</h3>
              </div>
              <div className="p-4 space-y-1.5">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2 text-xs text-amber-900">
                    <span className="font-bold mt-0.5 shrink-0">-</span>
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competent-person guidance */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">{COMPETENT_PERSON_GUIDANCE.title}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{COMPETENT_PERSON_GUIDANCE.description}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {COMPETENT_PERSON_GUIDANCE.bullets.map((b, i) => (
                <div key={i} className="px-4 py-2 text-[11px] text-gray-600 leading-relaxed">- {b}</div>
              ))}
            </div>
          </div>

          {/* Cross-refs */}
          {inputs.soil && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">Related Tools</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {CROSS_REFS.map(cr => (
                  <div key={cr.slug} className="px-4 py-2.5">
                    <div className="text-xs font-bold text-gray-800">{cr.name}</div>
                    <div className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{cr.relevance}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Indicative assessment based on BS 6031:2009, BS EN 1997-1 (Eurocode 7), HSE HSG150, and CDM 2015 reg 22. Final design is always a competent-person judgement against actual ground conditions. This tool does not constitute geotechnical design certification.
        </p>
        <a href="/tools" className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
