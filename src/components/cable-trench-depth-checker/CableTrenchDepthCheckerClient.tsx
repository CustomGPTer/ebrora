// src/components/cable-trench-depth-checker/CableTrenchDepthCheckerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  SURFACE_TYPES, SERVICE_TYPES, COVER_DEPTHS, REGULATORY_REFS,
  calculateTrenchArrangement, getSeparation,
} from "@/data/cable-trench-depth-checker";
import type {
  SurfaceType, ServiceId, ServiceEntry, TrenchResult, ArrangedService,
} from "@/data/cable-trench-depth-checker";

function todayISO() { return new Date().toISOString().slice(0, 10); }
let _entryId = 0;
function nextId() { return `svc-${++_entryId}-${Date.now()}`; }

// ─── SVG Trench Cross-Section ────────────────────────────────
function TrenchCrossSection({ result, constraintWidth }: { result: TrenchResult; constraintWidth: number | null }) {
  const { arranged, minTrenchWidth, minTrenchDepth } = result;
  if (arranged.length === 0) return <div className="text-center text-gray-400 text-sm py-12">Add services to see the trench cross-section</div>;

  // Scale: we want the diagram ~600px wide, proportional
  const PAD = { top: 50, bottom: 55, left: 60, right: 30 };
  const drawWidth = 520;
  const trenchW = constraintWidth && constraintWidth > minTrenchWidth ? constraintWidth : minTrenchWidth;
  const trenchD = minTrenchDepth;
  const scale = drawWidth / trenchW;
  const drawHeight = trenchD * scale;
  const W = drawWidth + PAD.left + PAD.right;
  const H = drawHeight + PAD.top + PAD.bottom;

  const trenchLeft = PAD.left;
  const trenchTop = PAD.top;
  const trenchRight = PAD.left + drawWidth;
  const trenchBottom = PAD.top + drawHeight;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 500 }}>
      {/* Finished surface level */}
      <rect x={0} y={0} width={W} height={PAD.top - 10} fill="#8B7355" opacity={0.15} />
      <line x1={0} y1={PAD.top - 10} x2={W} y2={PAD.top - 10} stroke="#8B7355" strokeWidth={2} />
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#6B7280">FINISHED SURFACE LEVEL</text>

      {/* Trench walls */}
      <rect x={trenchLeft} y={trenchTop} width={drawWidth} height={drawHeight} fill="#FEF9C3" fillOpacity={0.3} stroke="#A16207" strokeWidth={1.5} strokeDasharray="4,2" />

      {/* Depth scale on left */}
      {[0, 250, 500, 750, 1000, 1250, 1500].filter(d => d <= trenchD + 50).map(d => {
        const yy = trenchTop + d * scale;
        return (
          <g key={`depth-${d}`}>
            <line x1={PAD.left - 5} y1={yy} x2={PAD.left} y2={yy} stroke="#9CA3AF" strokeWidth={0.5} />
            <text x={PAD.left - 8} y={yy + 3} textAnchor="end" fontSize={8} fill="#6B7280">{d}mm</text>
          </g>
        );
      })}
      <text x={12} y={trenchTop + drawHeight / 2} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B7280" transform={`rotate(-90, 12, ${trenchTop + drawHeight / 2})`}>Depth from surface</text>

      {/* Width dimension line at bottom */}
      <line x1={trenchLeft} y1={trenchBottom + 15} x2={trenchRight} y2={trenchBottom + 15} stroke="#374151" strokeWidth={1} markerStart="url(#arrowL)" markerEnd="url(#arrowR)" />
      <text x={trenchLeft + drawWidth / 2} y={trenchBottom + 30} textAnchor="middle" fontSize={10} fontWeight={700} fill="#374151">{Math.round(trenchW)}mm trench width</text>
      <defs>
        <marker id="arrowL" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="#374151" /></marker>
        <marker id="arrowR" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#374151" /></marker>
      </defs>

      {/* Constraint width indicator */}
      {constraintWidth && constraintWidth < minTrenchWidth && (
        <>
          <line x1={trenchLeft + constraintWidth * scale} y1={trenchTop} x2={trenchLeft + constraintWidth * scale} y2={trenchBottom} stroke="#EF4444" strokeWidth={2} strokeDasharray="6,3" />
          <text x={trenchLeft + constraintWidth * scale + 4} y={trenchTop + 14} fontSize={8} fontWeight={600} fill="#EF4444">Constraint: {constraintWidth}mm</text>
        </>
      )}

      {/* Services */}
      {arranged.map((svc, i) => {
        const cx = trenchLeft + svc.xCentre * scale;
        const cy = trenchTop + (svc.topOfService + svc.diameterMm / 2) * scale;
        const r = Math.max((svc.diameterMm / 2) * scale, 6);
        return (
          <g key={`svc-${i}`}>
            {/* Service circle */}
            <circle cx={cx} cy={cy} r={r} fill={svc.colourHex} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={svc.coverPass ? "#22C55E" : "#EF4444"} strokeWidth={1} />
            {/* Label */}
            <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#374151">{svc.label}</text>
            {/* Cover depth dimension */}
            <line x1={cx + r + 3} y1={trenchTop} x2={cx + r + 3} y2={cy - r} stroke="#9CA3AF" strokeWidth={0.5} strokeDasharray="2,1" />
            <text x={cx + r + 6} y={trenchTop + (cy - r - trenchTop) / 2 + 3} fontSize={6.5} fill="#6B7280">{svc.actualCover}mm</text>
            {/* Diameter label inside */}
            {r > 10 && <text x={cx} y={cy + 3} textAnchor="middle" fontSize={6} fontWeight={600} fill="#fff">{svc.diameterMm}</text>}
          </g>
        );
      })}

      {/* Separation arrows between adjacent services */}
      {arranged.length > 1 && arranged.slice(0, -1).map((svc, i) => {
        const next = arranged[i + 1];
        const x1 = trenchLeft + (svc.xCentre + svc.diameterMm / 2) * scale;
        const x2 = trenchLeft + (next.xCentre - next.diameterMm / 2) * scale;
        const sepY = trenchTop + Math.max(svc.topOfService, next.topOfService) * scale + 20;
        const edgeSep = Math.abs(next.xCentre - svc.xCentre) - svc.diameterMm / 2 - next.diameterMm / 2;
        const rule = getSeparation(svc.serviceId, next.serviceId);
        const pass = rule ? edgeSep >= rule.minSeparation - 1 : true;
        if (x2 - x1 > 10) return (
          <g key={`sep-${i}`}>
            <line x1={x1} y1={sepY} x2={x2} y2={sepY} stroke={pass ? "#22C55E" : "#EF4444"} strokeWidth={1} />
            <text x={(x1 + x2) / 2} y={sepY - 4} textAnchor="middle" fontSize={7} fontWeight={600} fill={pass ? "#16A34A" : "#DC2626"}>{Math.round(edgeSep)}mm</text>
          </g>
        );
        return null;
      })}

      {/* Trench depth dimension on right */}
      <line x1={trenchRight + 8} y1={trenchTop} x2={trenchRight + 8} y2={trenchBottom} stroke="#374151" strokeWidth={1} />
      <text x={trenchRight + 12} y={trenchTop + drawHeight / 2 + 3} fontSize={8} fontWeight={600} fill="#374151" transform={`rotate(90, ${trenchRight + 12}, ${trenchTop + drawHeight / 2})`}>{Math.round(trenchD)}mm depth</text>
    </svg>
  );
}

// ─── PDF Export (PAID = dark header) ─────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  entries: ServiceEntry[],
  surface: SurfaceType,
  hasCrossings: boolean,
  constraintWidthMm: number | null,
  result: TrenchResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `CTD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const surfaceInfo = SURFACE_TYPES.find(s => s.id === surface)!;

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("CABLE TRENCH DEPTH & SEPARATION CHECK", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("NJUG Vol 1 / NRSWA 1991 / ENA TS 09-1 & 09-2 / IGEM/TD/3 / Water UK / BT SIN 351", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 24, 1, 1, "FD"); doc.setFontSize(8);
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
  drawFld("Surface Type:", surfaceInfo.label, M + halfW, y, 0);
  y += 5;
  drawFld("Crossings:", hasCrossings ? "Yes" : "No", M + 3, y, 0);
  if (constraintWidthMm) drawFld("Width Constraint:", `${constraintWidthMm}mm`, M + halfW, y, 0);
  y += 8;

  // Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Cable trench depth and separation assessment for ${header.site || "the above site"}. Surface: ${surfaceInfo.label}. ${result.arranged.length} service(s) assessed. Standards: NJUG Vol 1, NRSWA 1991 Code of Practice, and utility-specific standards.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("CABLE TRENCH DEPTH & SEPARATION CHECK (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Status banner
  const passRgb = result.allPass ? [22, 163, 74] : [220, 38, 38];
  doc.setFillColor(passRgb[0], passRgb[1], passRgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(result.allPass ? "ALL CHECKS PASS" : "ISSUES DETECTED -- SEE DETAILS", M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Min trench: ${Math.round(result.minTrenchWidth)}mm W x ${Math.round(result.minTrenchDepth)}mm D | ${result.arranged.length} services | ${result.separationChecks.filter(s => s.pass).length}/${result.separationChecks.length} separations OK`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // Summary panel
  checkPage(35);
  const summaryItems = [
    ["Surface Type", surfaceInfo.label],
    ["Services in Trench", String(result.arranged.length)],
    ["Minimum Trench Width", `${Math.round(result.minTrenchWidth)}mm`],
    ["Minimum Trench Depth", `${Math.round(result.minTrenchDepth)}mm`],
    ["Cover Depth Checks", `${result.arranged.filter(a => a.coverPass).length}/${result.arranged.length} PASS`],
    ["Separation Checks", `${result.separationChecks.filter(s => s.pass).length}/${result.separationChecks.length} PASS`],
    ["Width Constraint", constraintWidthMm ? `${constraintWidthMm}mm (${result.widthFits ? "FITS" : "DOES NOT FIT"})` : "None specified"],
    ["Service Crossings", hasCrossings ? "Yes -- additional protection required" : "No"],
  ];
  const panelH = 6 + summaryItems.length * 3.8 + 3;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "normal");
    doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 5;

  // Trench cross-section diagram in PDF
  checkPage(70);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Trench Cross-Section (Not to Scale)", M, y); y += 6;

  // Draw trench outline
  const diagW = CW - 10;
  const diagH = 45;
  const diagX = M + 5;
  const diagY = y;
  // Surface
  doc.setFillColor(200, 185, 150); doc.rect(diagX, diagY, diagW, 4, "F");
  doc.setFontSize(5.5); doc.setTextColor(100, 80, 50); doc.setFont("helvetica", "bold");
  doc.text("FINISHED SURFACE", diagX + diagW / 2 - 12, diagY + 3);
  doc.setTextColor(0, 0, 0);

  // Trench body
  doc.setFillColor(255, 253, 230); doc.setDrawColor(160, 100, 30);
  doc.rect(diagX, diagY + 4, diagW, diagH - 4, "FD");

  // Draw each service as a circle in the diagram
  if (result.arranged.length > 0 && result.minTrenchWidth > 0) {
    const trenchW = constraintWidthMm && constraintWidthMm > result.minTrenchWidth ? constraintWidthMm : result.minTrenchWidth;
    const xScale = diagW / trenchW;
    const yScale = (diagH - 8) / result.minTrenchDepth;

    result.arranged.forEach(svc => {
      const cx = diagX + svc.xCentre * xScale;
      const cy = diagY + 4 + (svc.topOfService + svc.diameterMm / 2) * yScale;
      const r = Math.max(svc.diameterMm / 2 * Math.min(xScale, yScale), 2);

      const hex = svc.colourHex;
      const rr = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), bb = parseInt(hex.slice(5, 7), 16);
      doc.setFillColor(rr, gg, bb);
      doc.circle(cx, cy, r, "F");
      doc.setFontSize(4.5); doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal");
      doc.text(svc.label, cx, cy - r - 1.5, { align: "center" });
      doc.setTextColor(0, 0, 0);
    });
  }

  // Dimensions
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
  doc.text(`${Math.round(result.minTrenchWidth)}mm`, diagX + diagW / 2, diagY + diagH + 4, { align: "center" });
  doc.text(`${Math.round(result.minTrenchDepth)}mm`, diagX - 2, diagY + 4 + (diagH - 4) / 2, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y = diagY + diagH + 8;

  // Colour legend
  checkPage(15);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Service Colour Legend", M, y); y += 4;
  const uniqueServices = Array.from(new Set(result.arranged.map(a => a.serviceId)));
  let legX = M;
  doc.setFontSize(6);
  uniqueServices.forEach(sid => {
    const sType = SERVICE_TYPES.find(s => s.id === sid)!;
    const hex = sType.siteColourHex;
    const rr = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), bb = parseInt(hex.slice(5, 7), 16);
    doc.setFillColor(rr, gg, bb);
    doc.rect(legX, y - 2, 4, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text(`${sType.shortLabel} (${sType.siteColour})`, legX + 6, y);
    legX += 35;
    if (legX > W - M - 30) { legX = M; y += 4; }
  });
  doc.setTextColor(0, 0, 0); y += 6;

  // Cover depth table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Cover Depth Assessment", M, y); y += 5;
  const coverCols = [55, 30, 35, 30, 32];
  let cx = M;
  ["Service", "Diameter", "Min Cover", "Actual", "Status"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, coverCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4); cx += coverCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  result.arranged.forEach((svc, ri) => {
    checkPage(6);
    cx = M;
    const cells = [svc.label, `${svc.diameterMm}mm`, `${svc.coverDepth}mm`, `${svc.actualCover}mm`, svc.coverPass ? "[PASS]" : "[FAIL]"];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, coverCols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, coverCols[i], 5.5, "D"); }
      doc.setTextColor(i === 4 ? (svc.coverPass ? 22 : 220) : 0, i === 4 ? (svc.coverPass ? 163 : 38) : 0, i === 4 ? (svc.coverPass ? 74 : 38) : 0);
      doc.setFont("helvetica", i === 0 || i === 4 ? "bold" : "normal"); doc.setFontSize(6.5);
      doc.text(t, cx + 2, y + 3.8); cx += coverCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 5.5;
  });
  y += 5;

  // Separation table
  if (result.separationChecks.length > 0) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Horizontal Separation Assessment", M, y); y += 5;
    const sepCols = [45, 45, 27, 27, 20, 18];
    cx = M;
    ["Service A", "Service B", "Required", "Actual", "Status", "Std"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, sepCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(h, cx + 2, y + 4); cx += sepCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);
    result.separationChecks.forEach((chk, ri) => {
      checkPage(6);
      cx = M;
      const cells = [chk.serviceA, chk.serviceB, `${chk.required}mm`, `${chk.actual}mm`, chk.pass ? "[PASS]" : "[FAIL]", chk.standard.split("/")[0]];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, sepCols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, sepCols[i], 5.5, "D"); }
        doc.setTextColor(i === 4 ? (chk.pass ? 22 : 220) : 0, i === 4 ? (chk.pass ? 163 : 38) : 0, i === 4 ? (chk.pass ? 74 : 38) : 0);
        doc.setFont("helvetica", i === 0 || i === 1 || i === 4 ? "bold" : "normal"); doc.setFontSize(6);
        const truncated = t.length > 12 ? t.slice(0, 11) + ".." : t;
        doc.text(truncated, cx + 1.5, y + 3.8); cx += sepCols[i];
      });
      doc.setTextColor(0, 0, 0); y += 5.5;
    });
    y += 5;
  }

  // Compliance checklist
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Compliance Checklist", M, y); y += 5;
  const compCols = [50, 18, 114];
  cx = M;
  ["Requirement", "Req?", "Detail"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, compCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4); cx += compCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  result.complianceItems.forEach((item, ri) => {
    const detailLines = doc.splitTextToSize(item.detail, compCols[2] - 4);
    const rowH = Math.max(5.5, detailLines.length * 3 + 1.5);
    checkPage(rowH);
    cx = M;
    // Label
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, compCols[0], rowH, "FD"); }
    else { doc.rect(cx, y, compCols[0], rowH, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
    doc.text(item.label.length > 22 ? item.label.slice(0, 21) + ".." : item.label, cx + 1.5, y + 3.5);
    cx += compCols[0];
    // Required
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, compCols[1], rowH, "FD"); }
    else { doc.rect(cx, y, compCols[1], rowH, "D"); }
    doc.setTextColor(item.required ? 22 : 130, item.required ? 163 : 130, item.required ? 74 : 130);
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(item.required ? "YES" : "Optional", cx + 1.5, y + 3.5);
    cx += compCols[1];
    // Detail
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, compCols[2], rowH, "FD"); }
    else { doc.rect(cx, y, compCols[2], rowH, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
    doc.text(detailLines, cx + 2, y + 3.5);
    y += rowH;
  });
  y += 5;

  // Warnings
  if (result.warnings.length > 0) {
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
    doc.text("Warnings", M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 30, 30);
    result.warnings.forEach(w => {
      checkPage(8);
      const lines = doc.splitTextToSize(`- ${w}`, CW - 4);
      doc.text(lines, M + 2, y); y += lines.length * 3.5;
    });
    doc.setTextColor(0, 0, 0); y += 3;
  }

  // Regulatory references
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Regulatory References", M, y); y += 5;
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  REGULATORY_REFS.forEach(ref => {
    checkPage(5);
    doc.setFont("helvetica", "bold"); doc.text(ref.code, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.text(` -- ${ref.title}`, M + 2 + doc.getTextWidth(ref.code), y);
    y += 3.5;
  });
  y += 5;

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

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Cable trench depth and separation assessment per NJUG Vol 1, NRSWA 1991, and utility-specific standards. This is a screening tool -- always confirm with the relevant utility provider.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`cable-trench-depth-check-${todayISO()}.pdf`);
}

// ─── Service Row Component ───────────────────────────────────
function ServiceRow({
  entry, onChange, onRemove,
}: {
  entry: ServiceEntry;
  onChange: (updated: ServiceEntry) => void;
  onRemove: () => void;
}) {
  const sType = SERVICE_TYPES.find(s => s.id === entry.serviceId)!;
  return (
    <div className="flex flex-wrap items-end gap-2 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Service Type</label>
        <select
          value={entry.serviceId}
          onChange={e => {
            const newId = e.target.value as ServiceId;
            const newType = SERVICE_TYPES.find(s => s.id === newId)!;
            onChange({ ...entry, serviceId: newId, diameterMm: newType.defaultDiameter });
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none"
        >
          {SERVICE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="w-20">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Qty</label>
        <input type="number" value={entry.quantity} min={1} max={10}
          onChange={e => onChange({ ...entry, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
      </div>
      <div className="w-28">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Dia (mm)</label>
        <input type="number" value={entry.diameterMm} min={sType.minDiameterMm} max={sType.maxDiameterMm}
          onChange={e => onChange({ ...entry, diameterMm: Math.max(sType.minDiameterMm, parseInt(e.target.value) || sType.defaultDiameter) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
      </div>
      <div className="flex items-center gap-1.5 pb-0.5">
        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: sType.siteColourHex }} title={sType.siteColour} />
        <span className="text-[10px] text-gray-400">{sType.siteColour}</span>
      </div>
      <button onClick={onRemove} className="px-2 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function CableTrenchDepthCheckerClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [surface, setSurface] = useState<SurfaceType>("footway");
  const [hasCrossings, setHasCrossings] = useState(false);
  const [constraintWidth, setConstraintWidth] = useState<string>("");
  const constraintWidthMm = constraintWidth ? parseInt(constraintWidth) || null : null;

  const [entries, setEntries] = useState<ServiceEntry[]>([]);

  const addService = useCallback(() => {
    setEntries(prev => [...prev, { id: nextId(), serviceId: "lv-electricity", quantity: 1, diameterMm: 50 }]);
  }, []);

  const updateEntry = useCallback((id: string, updated: ServiceEntry) => {
    setEntries(prev => prev.map(e => e.id === id ? updated : e));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const result = useMemo(() =>
    calculateTrenchArrangement(entries, surface, hasCrossings, constraintWidthMm),
    [entries, surface, hasCrossings, constraintWidthMm]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, entries, surface, hasCrossings, constraintWidthMm, result); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, entries, surface, hasCrossings, constraintWidthMm, result]);

  const clearAll = useCallback(() => {
    setEntries([]); setSurface("footway"); setHasCrossings(false); setConstraintWidth("");
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const hasData = entries.length > 0;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Status", value: !hasData ? "--" : result.allPass ? "ALL PASS" : "ISSUES",
            sub: !hasData ? "Add services" : result.allPass ? "All checks compliant" : "See details below",
            bgClass: !hasData ? "bg-gray-50" : result.allPass ? "bg-emerald-50" : "bg-red-50",
            textClass: !hasData ? "text-gray-600" : result.allPass ? "text-emerald-800" : "text-red-800",
            borderClass: !hasData ? "border-gray-200" : result.allPass ? "border-emerald-200" : "border-red-200",
            dotClass: !hasData ? "bg-gray-400" : result.allPass ? "bg-emerald-500" : "bg-red-500",
          },
          {
            label: "Trench Width", value: hasData ? `${Math.round(result.minTrenchWidth)}mm` : "--",
            sub: constraintWidthMm ? (result.widthFits ? `Fits in ${constraintWidthMm}mm` : `Exceeds ${constraintWidthMm}mm`) : "Minimum required",
            bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500",
          },
          {
            label: "Trench Depth", value: hasData ? `${Math.round(result.minTrenchDepth)}mm` : "--",
            sub: hasData ? `${result.arranged.length} services` : "No services",
            bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500",
          },
          {
            label: "Separations", value: hasData ? `${result.separationChecks.filter(s => s.pass).length}/${result.separationChecks.length}` : "--",
            sub: hasData && result.separationChecks.length > 0 ? `${result.separationChecks.filter(s => !s.pass).length} fail(s)` : "No pairs to check",
            bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500",
          },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {result.warnings.map((w, i) => (
        <div key={i} className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div className="text-xs text-red-800">{w}</div>
        </div>
      ))}

      {/* Width constraint fail */}
      {!result.widthFits && constraintWidthMm && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-amber-600">!</span>
          <div><div className="text-sm font-bold text-amber-900">Width Constraint Exceeded</div>
            <div className="text-xs text-amber-800 mt-1">Required width: {Math.round(result.minTrenchWidth)}mm. Available: {constraintWidthMm}mm. Consider a wider trench or separate trenches.</div></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
          <button onClick={handleExport} disabled={exporting || !hasData} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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

      {/* Trench Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Trench Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Surface Type</label>
            <select value={surface} onChange={e => setSurface(e.target.value as SurfaceType)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              <optgroup label="Footway">
                {SURFACE_TYPES.filter(s => s.group === "footway").map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </optgroup>
              <optgroup label="Other">
                {SURFACE_TYPES.filter(s => s.group === "other").map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </optgroup>
              <optgroup label="Carriageway">
                {SURFACE_TYPES.filter(s => s.group === "carriageway").map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Width Constraint (mm)</label>
            <input type="number" value={constraintWidth} placeholder="Optional"
              onChange={e => setConstraintWidth(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">Leave blank for auto-calculation</div>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <button onClick={() => setHasCrossings(!hasCrossings)} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${hasCrossings ? "bg-ebrora" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasCrossings ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              Services Cross (not all parallel)
            </label>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Services in Trench</h3>
          <button onClick={addService} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ebrora bg-ebrora-light rounded-lg hover:bg-ebrora-mid transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Service
          </button>
        </div>
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Click &quot;Add Service&quot; to add utilities to the trench</div>
        )}
        <div className="space-y-2">
          {entries.map(entry => (
            <ServiceRow key={entry.id} entry={entry} onChange={updated => updateEntry(entry.id, updated)} onRemove={() => removeEntry(entry.id)} />
          ))}
        </div>
      </div>

      {/* Trench Cross-Section Diagram */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Trench Cross-Section Diagram</h3>
          <p className="text-[11px] text-gray-400">Approximate scale. Deepest services at bottom, all separations and cover depths shown.</p>
          <TrenchCrossSection result={result} constraintWidth={constraintWidthMm} />
          {/* Colour Legend */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            {Array.from(new Set(result.arranged.map(a => a.serviceId))).map(sid => {
              const sType = SERVICE_TYPES.find(s => s.id === sid)!;
              return (
                <div key={sid} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: sType.siteColourHex }} />
                  <span className="text-[11px] text-gray-600">{sType.shortLabel} ({sType.siteColour})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cover Depth Table */}
      {hasData && result.arranged.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Cover Depth Assessment</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-800 text-white text-xs">
                <th className="px-3 py-2 text-left font-semibold">Service</th>
                <th className="px-3 py-2 text-left font-semibold">Diameter</th>
                <th className="px-3 py-2 text-left font-semibold">Min Cover</th>
                <th className="px-3 py-2 text-left font-semibold">Actual</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {result.arranged.map((svc, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-3 py-2 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: svc.colourHex }} />
                      {svc.label}
                    </td>
                    <td className="px-3 py-2">{svc.diameterMm}mm</td>
                    <td className="px-3 py-2">{svc.coverDepth}mm</td>
                    <td className="px-3 py-2">{svc.actualCover}mm</td>
                    <td className={`px-3 py-2 font-bold ${svc.coverPass ? "text-emerald-600" : "text-red-600"}`}>{svc.coverPass ? "PASS" : "FAIL"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Separation Table */}
      {result.separationChecks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Horizontal Separation Assessment</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-800 text-white text-xs">
                <th className="px-3 py-2 text-left font-semibold">Service A</th>
                <th className="px-3 py-2 text-left font-semibold">Service B</th>
                <th className="px-3 py-2 text-left font-semibold">Required</th>
                <th className="px-3 py-2 text-left font-semibold">Actual</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Standard</th>
              </tr></thead>
              <tbody>
                {result.separationChecks.map((chk, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-3 py-2 font-semibold">{chk.serviceA}</td>
                    <td className="px-3 py-2 font-semibold">{chk.serviceB}</td>
                    <td className="px-3 py-2">{chk.required}mm</td>
                    <td className="px-3 py-2">{chk.actual}mm</td>
                    <td className={`px-3 py-2 font-bold ${chk.pass ? "text-emerald-600" : "text-red-600"}`}>{chk.pass ? "PASS" : "FAIL"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{chk.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Checklist */}
      {result.complianceItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Compliance Checklist</h3></div>
          <div className="divide-y divide-gray-100">
            {(["marker-tape", "tile-protection", "backfill", "special"] as const).map(cat => {
              const items = result.complianceItems.filter(c => c.category === cat);
              if (items.length === 0) return null;
              const catLabels = { "marker-tape": "Marker Tape", "tile-protection": "Tile / Slab Protection", backfill: "Backfill Specification", special: "Special Requirements" };
              return (
                <div key={cat} className="px-4 py-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{catLabels[cat]}</h4>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className={`mt-0.5 font-bold ${item.required ? "text-emerald-600" : "text-gray-400"}`}>{item.required ? "[YES]" : "[OPT]"}</span>
                        <span className="text-gray-700"><span className="font-semibold">{item.label}:</span> {item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regulatory References */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Regulatory References</h3></div>
        <div className="px-4 py-3 space-y-1.5">
          {REGULATORY_REFS.map(ref => (
            <div key={ref.code} className="text-xs text-gray-600"><span className="font-bold text-gray-800">{ref.code}</span> — {ref.title}</div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on NJUG Guidelines Volume 1, NRSWA 1991 Code of Practice, ENA TS 09-1/09-2, IGEM/TD/3, Water UK, and
          BT/Openreach specifications. This is a screening tool — always confirm requirements with the relevant statutory
          undertaker. Cover depths and separations are minimum values; local conditions may require deeper installation.
        </p>
      </div>
    </div>
  );
}
