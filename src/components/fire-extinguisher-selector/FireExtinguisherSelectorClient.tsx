// src/components/fire-extinguisher-selector/FireExtinguisherSelectorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FIRE_RISKS, PREMISES_TYPES, EXTINGUISHER_TYPES, FIRE_CLASS_DETAILS,
  SITING_RULES, SIGNAGE_REQUIREMENTS, INSPECTION_SCHEDULE, REGULATORY_REFS,
  calculateFullResult,
  type AssessmentArea, type RiskLevel, type FireClass, type Suitability, type SelectorResult,
} from "@/data/fire-extinguisher-selector";

// ─── Helpers ─────────────────────────────────────────────────────
function cn(...c: (string | false | undefined | null)[]) { return c.filter(Boolean).join(" "); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 8); }

const SUITABILITY_DISPLAY: Record<Suitability, { label: string; bg: string; text: string; border: string }> = {
  suitable: { label: "YES", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  limited: { label: "LIMITED", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  danger: { label: "DANGER", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  "not-suitable": { label: "NO", bg: "bg-gray-50", text: "text-gray-400", border: "border-gray-200" },
};

const FIRE_CLASSES: FireClass[] = ["A", "B", "C", "D", "F", "ELECTRICAL"];

// ─── SVG: Extinguisher Band Diagram ──────────────────────────────
function ExtinguisherBandDiagram() {
  const types = EXTINGUISHER_TYPES.filter(t => t.id !== "class-d"); // 6 main types
  const W = 700, H = 280, padL = 120, padT = 50, padR = 10, padB = 20;
  const colW = (W - padL - padR) / FIRE_CLASSES.length;
  const rowH = (H - padT - padB) / types.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 320 }}>
      {/* Title */}
      <text x={W / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1F2937">Fire Extinguisher Suitability Matrix</text>
      <text x={W / 2} y={30} textAnchor="middle" fontSize={8} fill="#6B7280">Per BS 5306-8:2012 and BS EN 3 series</text>

      {/* Column headers (fire classes) */}
      {FIRE_CLASSES.map((fc, ci) => {
        const d = FIRE_CLASS_DETAILS[fc];
        const x = padL + ci * colW + colW / 2;
        return (
          <g key={fc}>
            <rect x={padL + ci * colW + 2} y={padT - 16} width={colW - 4} height={14} rx={3} fill={d.color} opacity={0.15} />
            <text x={x} y={padT - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={d.color}>{d.label}</text>
          </g>
        );
      })}

      {/* Row headers (extinguisher types) + cells */}
      {types.map((ext, ri) => {
        const y = padT + ri * rowH;
        return (
          <g key={ext.id}>
            {/* Band colour swatch */}
            <rect x={4} y={y + 4} width={12} height={rowH - 8} rx={2} fill={ext.bandHex} stroke="#D1D5DB" strokeWidth={0.5} />
            {/* Type name */}
            <text x={22} y={y + rowH / 2 + 3} fontSize={9} fontWeight={600} fill="#374151">{ext.type}</text>

            {/* Suitability cells */}
            {FIRE_CLASSES.map((fc, ci) => {
              const suit = ext.suitability[fc];
              const cx = padL + ci * colW;
              const cellPad = 3;
              const bg = suit === "suitable" ? "#DCFCE7" : suit === "limited" ? "#FEF9C3" : suit === "danger" ? "#FEE2E2" : "#F9FAFB";
              const fg = suit === "suitable" ? "#16A34A" : suit === "limited" ? "#CA8A04" : suit === "danger" ? "#DC2626" : "#D1D5DB";
              const label = suit === "suitable" ? "YES" : suit === "limited" ? "LTD" : suit === "danger" ? "!!!" : "--";
              return (
                <g key={`${ext.id}-${fc}`}>
                  <rect x={cx + cellPad} y={y + 2} width={colW - cellPad * 2} height={rowH - 4} rx={4} fill={bg} stroke={fg} strokeWidth={0.8} opacity={0.9} />
                  <text x={cx + colW / 2} y={y + rowH / 2 + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill={fg}>{label}</text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Legend */}
      {[
        { label: "YES = Suitable", color: "#16A34A", bg: "#DCFCE7" },
        { label: "LTD = Limited use", color: "#CA8A04", bg: "#FEF9C3" },
        { label: "!!! = DANGER", color: "#DC2626", bg: "#FEE2E2" },
        { label: "-- = Not suitable", color: "#D1D5DB", bg: "#F9FAFB" },
      ].map((item, i) => (
        <g key={i}>
          <rect x={padL + i * 140} y={H - 14} width={10} height={10} rx={2} fill={item.bg} stroke={item.color} strokeWidth={0.8} />
          <text x={padL + i * 140 + 14} y={H - 5} fontSize={8} fill="#6B7280">{item.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Siting Coverage Diagram ────────────────────────────────
function SitingCoverageDiagram({ floorArea, extinguisherCount, travelDistance }: { floorArea: number; extinguisherCount: number; travelDistance: number }) {
  const W = 600, H = 300;
  // Represent floor as a rectangle
  const aspect = Math.min(2, Math.max(0.5, Math.sqrt(floorArea) / 10));
  const floorW = Math.min(400, Math.sqrt(floorArea * aspect));
  const floorH = floorW / aspect;
  const scale = Math.min(1, 380 / floorW, 220 / floorH);
  const sw = floorW * scale, sh = floorH * scale;
  const ox = (W - sw) / 2, oy = (H - sh) / 2 + 15;

  // Place extinguishers evenly
  const positions: { x: number; y: number }[] = [];
  const cols = Math.ceil(Math.sqrt(extinguisherCount * aspect));
  const rows = Math.ceil(extinguisherCount / cols);
  let idx = 0;
  for (let r = 0; r < rows && idx < extinguisherCount; r++) {
    for (let c = 0; c < cols && idx < extinguisherCount; c++) {
      positions.push({
        x: ox + (sw / (cols + 1)) * (c + 1),
        y: oy + (sh / (rows + 1)) * (r + 1),
      });
      idx++;
    }
  }

  const maxR = Math.min(travelDistance, 30) * scale * (sw / floorW);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
      <text x={W / 2} y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1F2937">Extinguisher Siting Coverage</text>
      <text x={W / 2} y={28} textAnchor="middle" fontSize={8} fill="#6B7280">{Math.round(floorArea)}m2 floor area -- max {travelDistance}m travel distance</text>

      {/* Floor outline */}
      <rect x={ox} y={oy} width={sw} height={sh} rx={4} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={1.5} />

      {/* Coverage circles */}
      {positions.map((p, i) => (
        <circle key={`c-${i}`} cx={p.x} cy={p.y} r={maxR} fill="#1B5745" opacity={0.06} stroke="#1B5745" strokeWidth={0.5} strokeDasharray="3,2" />
      ))}

      {/* Extinguisher icons */}
      {positions.map((p, i) => (
        <g key={`e-${i}`}>
          <rect x={p.x - 5} y={p.y - 10} width={10} height={16} rx={2} fill="#EF4444" stroke="#B91C1C" strokeWidth={0.8} />
          <rect x={p.x - 3} y={p.y - 12} width={6} height={3} rx={1} fill="#374151" />
          <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize={7} fontWeight={600} fill="#374151">#{i + 1}</text>
        </g>
      ))}

      {/* Dimensions */}
      <text x={ox + sw / 2} y={oy + sh + 16} textAnchor="middle" fontSize={8} fill="#6B7280">{Math.round(Math.sqrt(floorArea * aspect))}m</text>
      <text x={ox - 12} y={oy + sh / 2} textAnchor="middle" fontSize={8} fill="#6B7280" transform={`rotate(-90, ${ox - 12}, ${oy + sh / 2})`}>{Math.round(Math.sqrt(floorArea / aspect))}m</text>

      {/* Legend */}
      <g>
        <rect x={ox} y={H - 20} width={8} height={8} rx={1} fill="#EF4444" stroke="#B91C1C" strokeWidth={0.5} />
        <text x={ox + 12} y={H - 13} fontSize={8} fill="#6B7280">Extinguisher position</text>
        <circle cx={ox + 140} cy={H - 16} r={6} fill="#1B5745" opacity={0.1} stroke="#1B5745" strokeWidth={0.5} strokeDasharray="2,1" />
        <text x={ox + 150} y={H - 13} fontSize={8} fill="#6B7280">{travelDistance}m coverage radius</text>
      </g>
    </svg>
  );
}

// ─── SVG: Extinguisher Type Distribution Donut ───────────────────
function TypeDistributionChart({ result }: { result: SelectorResult }) {
  const counts: { type: string; qty: number; hex: string }[] = [];
  for (const area of result.areas) {
    for (const rec of area.requiredTypes) {
      const existing = counts.find(c => c.type === rec.typeName);
      if (existing) existing.qty += rec.quantity;
      else counts.push({ type: rec.typeName, qty: rec.quantity, hex: rec.bandHex });
    }
  }
  if (counts.length === 0) return null;

  const total = counts.reduce((s, c) => s + c.qty, 0);
  const W = 300, H = 240, cx = 120, cy = 120, r = 80, ir = 45;
  let startAngle = -Math.PI / 2;

  const COLORS = ["#EF4444", "#FDE68A", "#374151", "#3B82F6", "#EAB308", "#6366F1", "#F1F5F9"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      {counts.map((c, i) => {
        const angle = (c.qty / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const largeArc = angle > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + ir * Math.cos(startAngle), iy1 = cy + ir * Math.sin(startAngle);
        const ix2 = cx + ir * Math.cos(endAngle), iy2 = cy + ir * Math.sin(endAngle);
        const color = COLORS[i % COLORS.length];
        const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        startAngle = endAngle;
        return <path key={i} d={path} fill={color} stroke="#fff" strokeWidth={2} opacity={0.85} />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={700} fill="#1F2937">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#6B7280">Total Units</text>

      {/* Legend */}
      {counts.map((c, i) => (
        <g key={i}>
          <rect x={W - 140} y={30 + i * 22} width={12} height={12} rx={2} fill={COLORS[i % COLORS.length]} opacity={0.85} />
          <text x={W - 124} y={40 + i * 22} fontSize={9} fill="#374151" fontWeight={600}>{c.type}</text>
          <text x={W - 124} y={50 + i * 22} fontSize={8} fill="#6B7280">{c.qty} unit{c.qty > 1 ? "s" : ""} ({Math.round(c.qty / total * 100)}%)</text>
        </g>
      ))}
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  premisesType: string,
  areas: AssessmentArea[],
  result: SelectorResult
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 12, CW = W - M * 2;
  let y = 0;

  const docRef = `FES-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const premises = PREMISES_TYPES.find(p => p.id === premisesType);

  // checkPage helper
  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("FIRE EXTINGUISHER SELECTOR (continued)", M, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // drawFld helper
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };

  // ── Dark Header Bar ──
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("Fire Extinguisher Selector", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Premises: ${premises?.label || "Custom"} | Areas: ${areas.length} | Total: ${result.totalExtinguishers} extinguisher${result.totalExtinguishers !== 1 ? "s" : ""}`, M, 18);
  doc.setFontSize(7);
  doc.text(`BS 5306-8:2012 | RRFSO 2005 | BS EN 3 | Ref: ${docRef}`, M, 23);
  doc.setTextColor(0, 0, 0); y = 34;

  // ── Site Info Panel ──
  const halfW = CW / 2;
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  doc.setFontSize(8);
  drawFld("Company:", header.company, M + 3, y + 1, 50);
  drawFld("Site:", header.site, M + halfW, y + 1, 50);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y + 1, 40);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y + 1, 40);
  y += 5;
  drawFld("Date:", header.date || todayISO(), M + 3, y + 1, 30);
  drawFld("Fire Classes:", result.overallFireClasses.join(", "), M + halfW, y + 1, 0);
  y += 10;

  // ── Scope ──
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Fire extinguisher selection and siting assessment for ${header.site || "the above site"}. Premises type: ${premises?.label || "Custom"}. ${areas.length} area(s) assessed covering ${areas.reduce((s, a) => s + a.floorArea, 0)}m2 total floor area. Fire classes identified: ${result.overallFireClasses.join(", ")}. Assessment per BS 5306-8:2012 and RRFSO 2005.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Result Banner ──
  checkPage(22);
  const totalQty = result.totalExtinguishers;
  doc.setFillColor(27, 87, 69);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`${totalQty} Extinguisher${totalQty !== 1 ? "s" : ""} Required`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`${result.uniqueTypes.join(", ")} | ${areas.length} area${areas.length !== 1 ? "s" : ""} | ${premises?.riskLevel?.toUpperCase() || "NORMAL"} risk`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Per-Area Schedule ──
  for (const areaResult of result.areas) {
    checkPage(35);
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(areaResult.areaName, M, y); y += 2;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(`${areaResult.floorArea}m2 | Fire classes: ${areaResult.fireClasses.join(", ")} | ${areaResult.totalExtinguishers} extinguisher${areaResult.totalExtinguishers !== 1 ? "s" : ""}`, M, y + 3);
    doc.setTextColor(0, 0, 0); y += 7;

    // Table header
    const cols = [50, 22, 30, 16, CW - 50 - 22 - 30 - 16];
    let cx = M;
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    ["Type", "Size", "Fire Rating", "Qty", "Reason"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    // Data rows
    areaResult.requiredTypes.forEach((rec, ri) => {
      checkPage(6);
      cx = M;
      const cells = [rec.typeName, rec.size, rec.fireRating, String(rec.quantity), rec.reason];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
        const maxW = cols[i] - 4;
        const lines = doc.splitTextToSize(t, maxW);
        doc.text(lines[0] || "", cx + 2, y + 3.5);
        cx += cols[i];
      });
      y += 5.5;
    });

    // Siting notes
    if (areaResult.sitingNotes.length > 0) {
      checkPage(10);
      doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
      for (const note of areaResult.sitingNotes) {
        const lines = doc.splitTextToSize(`- ${note}`, CW);
        doc.text(lines, M + 2, y + 2); y += lines.length * 2.5;
      }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    }
    y += 4;
  }

  // ── Suitability Matrix Table ──
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Extinguisher Suitability Matrix", M, y); y += 5;

  const matCols = [40, ...FIRE_CLASSES.map(() => (CW - 40) / FIRE_CLASSES.length)];
  let mcx = M;
  doc.setFontSize(6); doc.setFont("helvetica", "bold");
  ["Type", ...FIRE_CLASSES.map(fc => FIRE_CLASS_DETAILS[fc].label)].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, matCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, mcx + 2, y + 4);
    mcx += matCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  EXTINGUISHER_TYPES.forEach((ext, ri) => {
    checkPage(6);
    mcx = M;
    // Type name cell
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, matCols[0], 5.5, "FD"); }
    else { doc.rect(mcx, y, matCols[0], 5.5, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(ext.type, mcx + 2, y + 3.5);
    mcx += matCols[0];

    // Suitability cells
    FIRE_CLASSES.forEach((fc, ci) => {
      const suit = ext.suitability[fc];
      if (suit === "suitable") doc.setFillColor(220, 252, 231);
      else if (suit === "limited") doc.setFillColor(254, 249, 195);
      else if (suit === "danger") doc.setFillColor(254, 226, 226);
      else doc.setFillColor(249, 250, 251);
      doc.rect(mcx, y, matCols[ci + 1], 5.5, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
      const label = suit === "suitable" ? "[YES]" : suit === "limited" ? "[LTD]" : suit === "danger" ? "[!!!]" : "[NO]";
      doc.text(label, mcx + matCols[ci + 1] / 2, y + 3.5, { align: "center" });
      mcx += matCols[ci + 1];
    });
    y += 5.5;
  });
  y += 4;

  // ── Siting Rules ──
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Siting Requirements (BS 5306-8)", M, y); y += 5;
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  for (const rule of SITING_RULES.slice(0, 8)) {
    checkPage(8);
    doc.setFont("helvetica", "bold"); doc.text(`- ${rule.rule}`, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    const detLines = doc.splitTextToSize(rule.details, CW - 6);
    doc.text(detLines, M + 4, y + 3);
    doc.setTextColor(0, 0, 0);
    y += 3 + detLines.length * 2.5 + 1;
  }
  y += 2;

  // ── Signage Requirements ──
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Signage Requirements (BS 5499-1 / BS 5306-8)", M, y); y += 5;

  const sigCols = [45, 35, CW - 45 - 35 - 35, 35];
  mcx = M;
  ["Sign Type", "Standard", "Description", "Min Size"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, sigCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(h, mcx + 2, y + 4);
    mcx += sigCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  SIGNAGE_REQUIREMENTS.forEach((sig, ri) => {
    checkPage(8);
    mcx = M;
    const cells = [sig.type, sig.standard, sig.description, sig.minSize];
    const rowH = 7;
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, sigCols[i], rowH, "FD"); }
      else { doc.rect(mcx, y, sigCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, sigCols[i] - 3);
      doc.text(lines[0] || "", mcx + 1.5, y + 3);
      if (lines[1]) doc.text(lines[1], mcx + 1.5, y + 5.5);
      mcx += sigCols[i];
    });
    y += rowH;
  });
  y += 4;

  // ── Inspection Schedule ──
  checkPage(40);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Inspection & Maintenance Schedule (BS 5306-3)", M, y); y += 5;

  const insCols = [28, 55, 28, CW - 28 - 55 - 28];
  mcx = M;
  ["Frequency", "Task", "By Whom", "Details"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, insCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(h, mcx + 2, y + 4);
    mcx += insCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  INSPECTION_SCHEDULE.forEach((ins, ri) => {
    checkPage(10);
    mcx = M;
    const cells = [ins.frequency, ins.task, ins.who, ins.details];
    const rowH = 9;
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, insCols[i], rowH, "FD"); }
      else { doc.rect(mcx, y, insCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
      const lines = doc.splitTextToSize(t, insCols[i] - 3);
      lines.slice(0, 3).forEach((line: string, li: number) => {
        doc.text(line, mcx + 1.5, y + 3 + li * 2.2);
      });
      mcx += insCols[i];
    });
    y += rowH;
  });
  y += 4;

  // ── Regulatory References ──
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Regulatory References", M, y); y += 5;
  doc.setFontSize(6);
  for (const reg of REGULATORY_REFS) {
    checkPage(7);
    doc.setFont("helvetica", "bold"); doc.text(reg.ref, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(`${reg.title} -- ${reg.relevance}`, CW - 6);
    doc.text(lines, M + 4, y + 3);
    doc.setTextColor(0, 0, 0);
    y += 3 + lines.length * 2.5 + 1;
  }
  y += 4;

  // ── Cross References ──
  checkPage(12);
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(27, 87, 69);
  doc.text("Related Ebrora Tools:", M, y);
  doc.setFont("helvetica", "normal");
  doc.text("- Fire Risk Score Calculator -- use alongside this tool to assess overall fire risk for site areas", M + 2, y + 4);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // ── Sign-Off Section ──
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;

  const soW = CW / 2 - 2; const soH = 8;
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

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130); doc.setFont("helvetica", "normal");
    doc.text("This assessment is decision-support guidance per BS 5306-8:2012. It does not replace a site-specific fire risk assessment by a competent person.", M, 290);
    doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 293);
    doc.text(`Page ${i} of ${totalPages}`, W - M, 293, { align: "right" });
  }

  doc.save(`Fire-Extinguisher-Selector-${docRef}.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────
export default function FireExtinguisherSelectorClient() {
  // Settings state (paid layout: 5 cols)
  const [showSettings, setShowSettings] = useState(false);
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [exporting, setExporting] = useState(false);

  // Premises
  const [premisesType, setPremisesType] = useState("construction");
  const premises = PREMISES_TYPES.find(p => p.id === premisesType)!;

  // Areas/floors
  const [areas, setAreas] = useState<AssessmentArea[]>([
    { id: uid(), name: "Ground Floor", floorArea: 200, risks: [...(PREMISES_TYPES.find(p => p.id === "construction")?.defaultRisks || [])], travelDistance: 30 },
  ]);

  // Expanded sections
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({ [areas[0]?.id]: true });
  const [showComparison, setShowComparison] = useState(true);
  const [showSiting, setShowSiting] = useState(true);
  const [showSignage, setShowSignage] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showRegs, setShowRegs] = useState(false);

  // Calculate result
  const result = useMemo(() => {
    const validAreas = areas.filter(a => a.floorArea > 0 && a.risks.length > 0);
    if (validAreas.length === 0) return null;
    return calculateFullResult(validAreas, premises.riskLevel);
  }, [areas, premises.riskLevel]);

  // Handle premises change
  const handlePremisesChange = useCallback((newType: string) => {
    setPremisesType(newType);
    const newPremises = PREMISES_TYPES.find(p => p.id === newType);
    if (newPremises) {
      setAreas(prev => prev.map(a => ({ ...a, risks: [...newPremises.defaultRisks] })));
    }
  }, []);

  // Area management
  const addArea = useCallback(() => {
    const newId = uid();
    const num = areas.length + 1;
    const defaultName = num === 1 ? "Ground Floor" : num === 2 ? "First Floor" : num === 3 ? "Second Floor" : `Floor ${num - 1}`;
    setAreas(prev => [...prev, { id: newId, name: defaultName, floorArea: 100, risks: [...premises.defaultRisks], travelDistance: 30 }]);
    setExpandedAreas(prev => ({ ...prev, [newId]: true }));
  }, [areas.length, premises.defaultRisks]);

  const removeArea = useCallback((id: string) => {
    setAreas(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateArea = useCallback((id: string, field: keyof AssessmentArea, value: unknown) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }, []);

  const toggleRisk = useCallback((areaId: string, riskId: string) => {
    setAreas(prev => prev.map(a => {
      if (a.id !== areaId) return a;
      const risks = a.risks.includes(riskId) ? a.risks.filter(r => r !== riskId) : [...a.risks, riskId];
      return { ...a, risks };
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!result) return;
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, premisesType, areas, result); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, premisesType, areas, result]);

  const clearAll = useCallback(() => {
    setPremisesType("construction");
    const defaults = PREMISES_TYPES.find(p => p.id === "construction")!;
    const newId = uid();
    setAreas([{ id: newId, name: "Ground Floor", floorArea: 200, risks: [...defaults.defaultRisks], travelDistance: 30 }]);
    setExpandedAreas({ [newId]: true });
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const totalArea = areas.reduce((s, a) => s + a.floorArea, 0);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Extinguishers", value: result ? String(result.totalExtinguishers) : "0", sub: result ? `${result.uniqueTypes.length} type${result.uniqueTypes.length !== 1 ? "s" : ""}` : "Configure areas below", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
          { label: "Fire Classes", value: result ? result.overallFireClasses.join(", ") : "--", sub: result ? `${result.overallFireClasses.length} class${result.overallFireClasses.length !== 1 ? "es" : ""} identified` : "No risks selected", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Areas Assessed", value: String(areas.length), sub: `${totalArea}m2 total floor area`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Risk Level", value: premises.riskLevel.toUpperCase(), sub: premises.label, bgClass: premises.riskLevel === "high" ? "bg-red-50" : premises.riskLevel === "normal" ? "bg-amber-50" : "bg-emerald-50", textClass: premises.riskLevel === "high" ? "text-red-800" : premises.riskLevel === "normal" ? "text-amber-800" : "text-emerald-800", borderClass: premises.riskLevel === "high" ? "border-red-200" : premises.riskLevel === "normal" ? "border-amber-200" : "border-emerald-200", dotClass: premises.riskLevel === "high" ? "bg-red-500" : premises.riskLevel === "normal" ? "bg-amber-500" : "bg-emerald-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!result || exporting} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", result ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* ── Settings Panel (5-col paid layout) ────────────────── */}
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

      {/* ── Premises Type ─────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Premises Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {PREMISES_TYPES.map(p => (
            <button key={p.id} onClick={() => handlePremisesChange(p.id)}
              className={cn(
                "text-left px-3 py-2.5 rounded-lg text-sm border transition-all",
                premisesType === p.id
                  ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora font-medium"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              )}>
              <div className="font-medium text-xs">{p.label}</div>
              <div className={cn("text-[10px] mt-0.5", premisesType === p.id ? "text-ebrora/70" : "text-gray-400")}>
                {p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1)} risk
              </div>
            </button>
          ))}
        </div>
        {premises.notes && (
          <div className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {premises.notes}
          </div>
        )}
      </div>

      {/* ── Areas / Floors ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Areas / Floors</div>
          <button onClick={addArea} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-ebrora bg-ebrora-light/60 rounded-lg hover:bg-ebrora-light transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Area
          </button>
        </div>

        {areas.map((area, ai) => {
          const expanded = !!expandedAreas[area.id];
          return (
            <div key={area.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Area header */}
              <button onClick={() => setExpandedAreas(prev => ({ ...prev, [area.id]: !prev[area.id] }))}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <svg className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <span className="text-sm font-medium text-gray-800 flex-1">{area.name}</span>
                <span className="text-[10px] text-gray-400">{area.floorArea}m2 | {area.risks.length} risk{area.risks.length !== 1 ? "s" : ""}</span>
                {areas.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeArea(area.id); }}
                    className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </button>

              {expanded && (
                <div className="p-4 space-y-4">
                  {/* Area details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Area Name</label>
                      <input type="text" value={area.name} onChange={e => updateArea(area.id, "name", e.target.value)}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Floor Area (m2)</label>
                      <input type="number" min={1} value={area.floorArea} onChange={e => updateArea(area.id, "floorArea", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Travel Distance (m)</label>
                      <input type="number" min={5} max={60} value={area.travelDistance} onChange={e => updateArea(area.id, "travelDistance", Math.max(5, Math.min(60, parseInt(e.target.value) || 30)))}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                      {area.travelDistance > 30 && (
                        <p className="text-[10px] text-red-500 mt-0.5">Exceeds BS 5306-8 max 30m</p>
                      )}
                    </div>
                  </div>

                  {/* Fire risks */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Fire Risks Present</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {FIRE_RISKS.map(risk => {
                        const active = area.risks.includes(risk.id);
                        return (
                          <button key={risk.id} onClick={() => toggleRisk(area.id, risk.id)}
                            className={cn(
                              "flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all border",
                              active
                                ? "border-ebrora/30 bg-ebrora-light/30"
                                : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                            )}>
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                              active ? "border-ebrora bg-ebrora" : "border-gray-300 bg-white"
                            )}>
                              {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-xs font-medium", active ? "text-ebrora-dark" : "text-gray-700")}>{risk.label}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{risk.description}</div>
                              <div className="flex gap-1 mt-1">
                                {risk.fireClasses.map(fc => (
                                  <span key={fc} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: FIRE_CLASS_DETAILS[fc].bgColor, color: FIRE_CLASS_DETAILS[fc].color }}>
                                    {FIRE_CLASS_DETAILS[fc].label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      {!result && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-sm text-gray-400">Select fire risks above to see extinguisher recommendations.</p>
        </div>
      )}

      {result && (
        <>
          {/* Per-area recommendations */}
          <div className="space-y-4">
            {result.areas.map(areaResult => (
              <div key={areaResult.areaId} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800">{areaResult.areaName}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{areaResult.floorArea}m2 | Classes: {areaResult.fireClasses.join(", ")} | {areaResult.totalExtinguishers} extinguisher{areaResult.totalExtinguishers !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{areaResult.totalExtinguishers}</div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {areaResult.requiredTypes.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      {/* Colour band */}
                      <div className="w-8 h-12 rounded flex-shrink-0 border border-gray-200 overflow-hidden">
                        <div className="w-full h-3 bg-red-600" />
                        <div className="w-full flex-1" style={{ backgroundColor: rec.bandHex, height: 24 }} />
                        <div className="w-full h-3 bg-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-gray-800">{rec.typeName}</span>
                          <span className="text-xs text-gray-500">{rec.size}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">x{rec.quantity}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Fire rating: {rec.fireRating}</div>
                        <div className="text-xs text-gray-600 mt-1">{rec.reason}</div>
                      </div>
                    </div>
                  ))}

                  {/* Siting notes */}
                  {areaResult.sitingNotes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Siting Notes</div>
                      {areaResult.sitingNotes.map((note, i) => (
                        <div key={i} className="text-xs text-amber-700 mt-1">- {note}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Chart + Siting Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Type Distribution</div>
              <TypeDistributionChart result={result} />
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Siting Coverage</div>
              <SitingCoverageDiagram
                floorArea={totalArea}
                extinguisherCount={result.totalExtinguishers}
                travelDistance={areas[0]?.travelDistance || 30}
              />
            </div>
          </div>

          {/* Suitability Matrix SVG */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowComparison(!showComparison)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showComparison && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Suitability Comparison Matrix</span>
            </button>
            {showComparison && (
              <div className="mt-3">
                <ExtinguisherBandDiagram />
                {/* Detailed table below SVG */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-2 py-2 text-left font-bold rounded-tl-lg">Type</th>
                        {FIRE_CLASSES.map(fc => (
                          <th key={fc} className="px-2 py-2 text-center font-bold" style={{ color: FIRE_CLASS_DETAILS[fc].color === "#16A34A" ? "#A7F3D0" : FIRE_CLASS_DETAILS[fc].color === "#DC2626" ? "#FCA5A5" : "#E0E7FF" }}>
                            {FIRE_CLASS_DETAILS[fc].label}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-left font-bold rounded-tr-lg">Sizes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EXTINGUISHER_TYPES.map((ext, i) => (
                        <tr key={ext.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-2 py-2 font-bold text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: ext.bandHex }} />
                              {ext.type}
                            </div>
                          </td>
                          {FIRE_CLASSES.map(fc => {
                            const s = SUITABILITY_DISPLAY[ext.suitability[fc]];
                            return (
                              <td key={fc} className="px-1 py-2 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                  {s.label}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-gray-500">{ext.sizes.map(s => s.capacity).join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Siting Rules */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowSiting(!showSiting)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showSiting && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Siting Requirements (BS 5306-8)</span>
            </button>
            {showSiting && (
              <div className="mt-3 space-y-2">
                {SITING_RULES.map(rule => (
                  <div key={rule.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-ebrora mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{rule.rule}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{rule.details}</div>
                        <div className="text-[9px] text-ebrora/70 mt-1">{rule.standard}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signage Requirements */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowSignage(!showSignage)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showSignage && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Signage Requirements (BS 5499-1 / BS 5306-8)</span>
            </button>
            {showSignage && (
              <div className="mt-3 space-y-2">
                {SIGNAGE_REQUIREMENTS.map(sig => (
                  <div key={sig.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs font-bold text-gray-800">{sig.type}</div>
                    <div className="text-[10px] text-gray-600 mt-1">{sig.description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Standard</span><div className="text-[10px] text-gray-600">{sig.standard}</div></div>
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Placement</span><div className="text-[10px] text-gray-600">{sig.placement}</div></div>
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Min Size</span><div className="text-[10px] text-gray-600">{sig.minSize}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspection Schedule */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowInspection(!showInspection)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showInspection && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Inspection & Maintenance Schedule (BS 5306-3)</span>
            </button>
            {showInspection && (
              <div className="mt-3 space-y-2">
                {INSPECTION_SCHEDULE.map(ins => (
                  <div key={ins.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5",
                        ins.frequency === "Weekly" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        ins.frequency === "Monthly" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        ins.frequency === "Annual" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-purple-50 text-purple-700 border border-purple-200"
                      )}>{ins.frequency}</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-800">{ins.task}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{ins.details}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-gray-400"><span className="font-bold">Who:</span> {ins.who}</span>
                          <span className="text-[9px] text-ebrora/70">{ins.standard}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regulatory References */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowRegs(!showRegs)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showRegs && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Regulatory References</span>
            </button>
            {showRegs && (
              <div className="mt-3 space-y-2">
                {REGULATORY_REFS.map(reg => (
                  <div key={reg.ref} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs font-bold text-ebrora whitespace-nowrap">{reg.ref}</div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{reg.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{reg.relevance}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-reference */}
          <div className="bg-ebrora-light/30 border border-ebrora/20 rounded-xl p-4">
            <div className="text-[11px] font-bold text-ebrora uppercase tracking-wide mb-1">Related Ebrora Tools</div>
            <div className="text-xs text-ebrora-dark">
              Use the <span className="font-bold">Fire Risk Score Calculator</span> alongside this tool to assess the overall fire risk level for each site area and determine the adequacy of your fire precautions under RRFSO 2005.
            </div>
          </div>
        </>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          This tool provides decision-support guidance per BS 5306-8:2012, RRFSO 2005, and BS EN 3. It does not replace a site-specific fire risk assessment by a competent fire safety professional. Always verify recommendations with your Responsible Person or fire safety advisor.
        </p>
      </div>
    </div>
  );
}
