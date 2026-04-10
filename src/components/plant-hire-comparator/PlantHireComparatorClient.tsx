// src/components/plant-hire-comparator/PlantHireComparatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  calculateItem, calcSummary, calcDurationSensitivity,
  fmtGBP, fmtWeeks,
  DEFAULTS,
} from "@/data/plant-hire-comparator";
import type { PlantItem, ItemResult, DurationSensitivityPoint } from "@/data/plant-hire-comparator";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 8); }

// ─── SVG: Cumulative Cost Crossover Chart ────────────────────
function CrossoverChart({ result }: { result: ItemResult }) {
  const W = 600, H = 220, PAD = { top: 24, right: 20, bottom: 40, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxWeeks = result.cumulativeHire.length - 1;
  const maxCost = Math.max(...result.cumulativeHire, ...result.cumulativeOwn);
  if (maxWeeks === 0 || maxCost === 0) return null;

  const xS = (w: number) => PAD.left + (w / maxWeeks) * cw;
  const yS = (v: number) => PAD.top + ch - (v / maxCost) * ch;

  const hireLine = result.cumulativeHire.map((v, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");
  const ownLine = result.cumulativeOwn.map((v, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");

  // Project duration marker
  const pdX = xS(Math.min(result.item.projectDurationWeeks, maxWeeks));

  // Breakeven marker
  const beX = result.breakevenWeeks != null && result.breakevenWeeks <= maxWeeks
    ? xS(result.breakevenWeeks) : null;
  const beY = result.breakevenWeeks != null && result.breakevenWeeks <= maxWeeks
    ? yS(result.item.hireRatePerWeek * result.breakevenWeeks) : null;

  // Y-axis ticks
  const yTicks: number[] = [];
  const yStep = Math.pow(10, Math.floor(Math.log10(maxCost / 4)));
  const niceStep = maxCost / 4 > yStep * 5 ? yStep * 5 : maxCost / 4 > yStep * 2 ? yStep * 2 : yStep;
  for (let v = 0; v <= maxCost; v += niceStep) yTicks.push(v);

  // X-axis ticks
  const xStep = Math.max(1, Math.round(maxWeeks / 8));
  const xTicks: number[] = [];
  for (let w = 0; w <= maxWeeks; w += xStep) xTicks.push(w);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 280 }}>
      {/* Grid */}
      {yTicks.map(v => (
        <g key={`yg-${v}`}>
          <line x1={PAD.left} y1={yS(v)} x2={W - PAD.right} y2={yS(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yS(v) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{fmtGBP(v)}</text>
        </g>
      ))}
      {xTicks.map(w => (
        <g key={`xg-${w}`}>
          <line x1={xS(w)} y1={PAD.top} x2={xS(w)} y2={PAD.top + ch} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={xS(w)} y={PAD.top + ch + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{w}w</text>
        </g>
      ))}

      {/* Project duration line */}
      <line x1={pdX} y1={PAD.top} x2={pdX} y2={PAD.top + ch} stroke="#7C3AED" strokeWidth={1} strokeDasharray="4 3" />
      <text x={pdX + 3} y={PAD.top + 10} fontSize={7} fill="#7C3AED" fontWeight={600}>Project: {result.item.projectDurationWeeks}w</text>

      {/* Breakeven marker */}
      {beX != null && beY != null && (
        <>
          <line x1={beX} y1={PAD.top} x2={beX} y2={PAD.top + ch} stroke="#1B5745" strokeWidth={1} strokeDasharray="3 2" />
          <circle cx={beX} cy={beY} r={4} fill="#1B5745" />
          <text x={beX + 5} y={beY - 5} fontSize={7} fill="#1B5745" fontWeight={700}>Breakeven: {fmtWeeks(result.breakevenWeeks!)}</text>
        </>
      )}

      {/* Hire line */}
      <path d={hireLine} fill="none" stroke="#EF4444" strokeWidth={2} />
      <text x={W - PAD.right - 2} y={yS(result.cumulativeHire[maxWeeks]) - 4} textAnchor="end" fontSize={8} fontWeight={600} fill="#EF4444">Hire</text>

      {/* Own line */}
      <path d={ownLine} fill="none" stroke="#3B82F6" strokeWidth={2} />
      <text x={W - PAD.right - 2} y={yS(result.cumulativeOwn[maxWeeks]) + 10} textAnchor="end" fontSize={8} fontWeight={600} fill="#3B82F6">Buy</text>

      {/* Axes labels */}
      <text x={PAD.left + cw / 2} y={H - 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="#374151">Duration (weeks)</text>
      <text x={12} y={PAD.top + ch / 2} textAnchor="middle" fontSize={9} fontWeight={600} fill="#374151" transform={`rotate(-90, 12, ${PAD.top + ch / 2})`}>Cumulative Cost</text>
    </svg>
  );
}

// ─── SVG: Cost Comparison Bar Chart ──────────────────────────
function ComparisonBars({ result }: { result: ItemResult }) {
  const W = 400, H = 120, PAD = { top: 20, right: 20, bottom: 20, left: 60 };
  const bw = W - PAD.left - PAD.right;
  const bh = 28;
  const maxVal = Math.max(result.hireCost, result.ownershipCost);
  if (maxVal === 0) return null;

  const hW = (result.hireCost / maxVal) * bw;
  const oW = (result.ownershipCost / maxVal) * bw;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 140 }}>
      {/* Hire bar */}
      <text x={PAD.left - 4} y={PAD.top + bh / 2 + 4} textAnchor="end" fontSize={10} fontWeight={600} fill="#374151">Hire</text>
      <rect x={PAD.left} y={PAD.top} width={hW} height={bh} rx={4} fill={result.cheaperOption === "hire" ? "#22C55E" : "#EF4444"} opacity={0.85} />
      <text x={PAD.left + hW + 4} y={PAD.top + bh / 2 + 4} fontSize={10} fontWeight={700} fill="#374151">{fmtGBP(result.hireCost)}</text>

      {/* Buy bar */}
      <text x={PAD.left - 4} y={PAD.top + bh + 12 + bh / 2 + 4} textAnchor="end" fontSize={10} fontWeight={600} fill="#374151">Buy</text>
      <rect x={PAD.left} y={PAD.top + bh + 12} width={oW} height={bh} rx={4} fill={result.cheaperOption === "buy" ? "#22C55E" : "#3B82F6"} opacity={0.85} />
      <text x={PAD.left + oW + 4} y={PAD.top + bh + 12 + bh / 2 + 4} fontSize={10} fontWeight={700} fill="#374151">{fmtGBP(result.ownershipCost)}</text>
    </svg>
  );
}

// ─── SVG: Sensitivity Chart (cost at different durations) ────
function SensitivityChart({ data }: { data: DurationSensitivityPoint[] }) {
  const W = 600, H = 200, PAD = { top: 24, right: 20, bottom: 36, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  if (data.length < 2) return null;
  const maxWeeks = data[data.length - 1].weeks;
  const maxCost = Math.max(...data.map(d => Math.max(d.hireCost, d.ownCost)));
  if (maxCost === 0) return null;

  const xS = (w: number) => PAD.left + (w / maxWeeks) * cw;
  const yS = (v: number) => PAD.top + ch - (v / maxCost) * ch;

  const hireLine = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(d.weeks).toFixed(1)},${yS(d.hireCost).toFixed(1)}`).join(" ");
  const ownLine = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(d.weeks).toFixed(1)},${yS(d.ownCost).toFixed(1)}`).join(" ");

  // Find crossover point
  let crossX: number | null = null, crossY: number | null = null;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1], cur = data[i];
    if ((prev.hireCost <= prev.ownCost && cur.hireCost >= cur.ownCost) ||
        (prev.hireCost >= prev.ownCost && cur.hireCost <= cur.ownCost)) {
      // Linear interpolation
      const t = (prev.ownCost - prev.hireCost) / ((cur.hireCost - prev.hireCost) - (cur.ownCost - prev.ownCost));
      const crossW = prev.weeks + t * (cur.weeks - prev.weeks);
      const crossC = prev.hireCost + t * (cur.hireCost - prev.hireCost);
      crossX = xS(crossW);
      crossY = yS(crossC);
      break;
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const v = maxCost * f;
        return (
          <g key={`sg-${f}`}>
            <line x1={PAD.left} y1={yS(v)} x2={W - PAD.right} y2={yS(v)} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={PAD.left - 6} y={yS(v) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{fmtGBP(v)}</text>
          </g>
        );
      })}

      {/* Hire line */}
      <path d={hireLine} fill="none" stroke="#EF4444" strokeWidth={2} />
      {/* Own line */}
      <path d={ownLine} fill="none" stroke="#3B82F6" strokeWidth={2} />

      {/* Crossover */}
      {crossX != null && crossY != null && (
        <circle cx={crossX} cy={crossY} r={4} fill="#1B5745" />
      )}

      {/* Legend */}
      <rect x={PAD.left + 8} y={PAD.top} width={8} height={3} rx={1} fill="#EF4444" />
      <text x={PAD.left + 20} y={PAD.top + 3} fontSize={8} fill="#EF4444" fontWeight={600}>Hire</text>
      <rect x={PAD.left + 52} y={PAD.top} width={8} height={3} rx={1} fill="#3B82F6" />
      <text x={PAD.left + 64} y={PAD.top + 3} fontSize={8} fill="#3B82F6" fontWeight={600}>Buy</text>

      {/* Axis labels */}
      <text x={PAD.left + cw / 2} y={H - 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="#374151">Project Duration (weeks)</text>
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  results: ItemResult[],
  summary: ReturnType<typeof calcSummary>,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `PHC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Header bar (PAID = dark)
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("PLANT HIRE COST COMPARATOR", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Hire vs Buy Analysis -- RICS Schedule of Basic Plant Charges methodology", M, 19);
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
  drawFld("Company:", header.company, M + 3, y, 45);
  drawFld("Site:", header.site, M + halfW, y, 50);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 40);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Items Assessed:", `${results.length}`, M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Plant hire vs buy cost comparison for ${header.site || "the above site"}. ${results.length} plant item(s) assessed. Analysis based on RICS Schedule of Basic Plant Charges methodology. Depreciation, finance, maintenance, insurance, and mobilisation costs compared against weekly hire rates over the stated project duration.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("PLANT HIRE COST COMPARATOR (continued)", M, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Overall recommendation banner
  const recLabel = summary.overallRecommendation === "hire" ? "RECOMMENDATION: HIRE"
    : summary.overallRecommendation === "buy" ? "RECOMMENDATION: BUY"
    : "MIXED -- SEE INDIVIDUAL ITEMS";
  const recRGB = summary.overallRecommendation === "hire" ? [234, 88, 12]
    : summary.overallRecommendation === "buy" ? [22, 163, 74]
    : [124, 58, 237];
  doc.setFillColor(recRGB[0], recRGB[1], recRGB[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(recLabel, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Total Hire: ${fmtGBP(summary.totalHireCost)} | Total Own: ${fmtGBP(summary.totalOwnershipCost)} | Saving: ${fmtGBP(summary.totalSaving)}`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Stat cards (coloured KPI row)
  {
    const cardW = (CW - 6) / 4;
    const cardH = 14;
    const cards: { label: string; value: string; sub: string; rgb: number[] }[] = [
      { label: "Recommendation", value: summary.overallRecommendation === "hire" ? "HIRE" : summary.overallRecommendation === "buy" ? "BUY" : "MIXED", sub: results[0]?.breakevenWeeks != null ? `Breakeven ${fmtWeeks(results[0].breakevenWeeks)}` : "", rgb: summary.overallRecommendation === "buy" ? [22, 163, 74] : [234, 88, 12] },
      { label: "Total Hire Cost", value: fmtGBP(summary.totalHireCost), sub: `${results.length} item(s)`, rgb: [59, 130, 246] },
      { label: "Total Own Cost", value: fmtGBP(summary.totalOwnershipCost), sub: "All-in ownership", rgb: [124, 58, 237] },
      { label: "Saving", value: fmtGBP(summary.totalSaving), sub: `by ${summary.overallRecommendation === "hire" ? "hiring" : "buying"}`, rgb: [234, 179, 8] },
    ];
    cards.forEach((c, ci) => {
      const cx = M + ci * (cardW + 2);
      doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5); doc.setFont("helvetica", "bold");
      doc.text(c.label.toUpperCase(), cx + 3, y + 4);
      doc.setFontSize(9); doc.text(c.value, cx + 3, y + 9);
      doc.setFontSize(4.5); doc.setFont("helvetica", "normal");
      doc.text(c.sub, cx + 3, y + 12.5);
    });
    doc.setTextColor(0, 0, 0);
    y += cardH + 6;
  }

  // ── Per-item detail
  results.forEach((r, idx) => {
    checkPage(85);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Item ${idx + 1}: ${r.item.description || "Unnamed Plant Item"}`, M, y);
    y += 6;

    // Comparison bar chart (hire vs buy)
    {
      const barH = 6, barMaxW = CW - 40;
      const maxVal = Math.max(r.hireCost, r.ownershipCost) || 1;
      const hW = (r.hireCost / maxVal) * barMaxW;
      const oW = (r.ownershipCost / maxVal) * barMaxW;
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text("Hire", M, y + 4);
      if (r.cheaperOption === "hire") { doc.setFillColor(22, 163, 74); } else { doc.setFillColor(239, 68, 68); }
      doc.roundedRect(M + 18, y, hW, barH, 1, 1, "F");
      doc.setTextColor(55, 65, 81); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text(fmtGBP(r.hireCost), M + 20 + hW, y + 4);
      y += barH + 2;
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text("Buy", M, y + 4);
      if (r.cheaperOption === "buy") { doc.setFillColor(22, 163, 74); } else { doc.setFillColor(59, 130, 246); }
      doc.roundedRect(M + 18, y, oW, barH, 1, 1, "F");
      doc.setTextColor(55, 65, 81); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text(fmtGBP(r.ownershipCost), M + 20 + oW, y + 4);
      doc.setTextColor(0, 0, 0);
      y += barH + 6;
    }

    // Summary panel
    doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
    doc.roundedRect(M, y - 2, CW, 52, 1.5, 1.5, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Cost Comparison Summary", M + 4, y + 2); y += 6;

    const items = [
      ["Purchase Price", fmtGBP(r.item.purchasePrice)],
      ["Residual Value", fmtGBP(r.item.residualValue)],
      ["Depreciation Life", r.item.lifeMode === "project" ? `Project duration (${fmtWeeks(r.item.projectDurationWeeks)})` : `${r.item.usefulLifeYears} years`],
      ["Hire Rate", `${fmtGBP(r.item.hireRatePerWeek)}/week`],
      ["Project Duration", fmtWeeks(r.item.projectDurationWeeks)],
      ["Utilisation", `${r.item.utilisation}%`],
      ["Total Hire Cost", fmtGBP(r.hireCost)],
      ["Total Ownership Cost", fmtGBP(r.ownershipCost)],
      ["Saving", `${fmtGBP(r.saving)} by ${r.cheaperOption === "hire" ? "hiring" : "buying"}`],
      ["Breakeven Duration", r.breakevenWeeks != null ? fmtWeeks(r.breakevenWeeks) : "N/A -- lines do not cross"],
      ["Recommendation", r.cheaperOption === "hire" ? "HIRE for this project" : "BUY for this project"],
    ];
    items.forEach(([label, value], si) => {
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text(label + ":", M + 4, y);
      if (si === 10 && r.cheaperOption === "hire") { doc.setTextColor(234, 88, 12); }
      else if (si === 10 && r.cheaperOption === "buy") { doc.setTextColor(22, 163, 74); }
      else { doc.setTextColor(17, 24, 39); }
      doc.text(value, M + 60, y);
      doc.setTextColor(0, 0, 0);
      y += 3.8;
    });
    y += 6;

    // ── Ownership cost breakdown table
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Ownership Cost Breakdown (Annual)", M, y); y += 5;

    const cols = [70, 55, 57];
    let cx = M;
    ["Cost Component", "Annual (GBP)", "Project Pro-Rata (GBP)"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
      doc.text(h, cx + 2, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    const durationYears = r.item.projectDurationWeeks / 52;
    const breakdownRows = [
      ["Depreciation", fmtGBP(r.annualDepreciation), fmtGBP(r.annualDepreciation * durationYears)],
      ["Finance Cost", fmtGBP(r.annualFinanceCost), fmtGBP(r.annualFinanceCost * durationYears)],
      ["Maintenance", fmtGBP(r.item.annualMaintenance), fmtGBP(r.item.annualMaintenance * durationYears)],
      ["Insurance", fmtGBP(r.item.annualInsurance), fmtGBP(r.item.annualInsurance * durationYears)],
      ["Mob/Demob", "-", fmtGBP(r.item.mobDemob)],
    ];
    breakdownRows.forEach((row, ri) => {
      checkPage(6);
      cx = M;
      row.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
        doc.text(t, cx + 2, y + 3.8);
        cx += cols[i];
      });
      y += 5.5;
    });
    // Total row
    cx = M;
    ["TOTAL", fmtGBP(r.totalAnnualOwnership), fmtGBP(r.ownershipCost)].forEach((t, i) => {
      doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
      doc.rect(cx, y, cols[i], 6, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
      doc.text(t, cx + 2, y + 4);
      cx += cols[i];
    });
    y += 10;

    // ── Cumulative cost chart in PDF
    checkPage(65);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Cumulative Cost: Hire vs Buy", M, y);
    doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Red = hire cost, blue = buy cost. Dashed line = project duration. Dot = breakeven.", M, y + 4);
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    y += 8;

    {
      const chartX = M + 12, chartY2 = y, chartW2 = CW - 24, chartH2 = 45;
      const maxW2 = r.cumulativeHire.length - 1;
      const maxC = Math.max(...r.cumulativeHire, ...r.cumulativeOwn);
      if (maxW2 > 0 && maxC > 0) {
        doc.setFillColor(248, 250, 252); doc.rect(chartX, chartY2, chartW2, chartH2, "F");

        // Y grid
        doc.setDrawColor(220, 220, 220); doc.setFontSize(5); doc.setTextColor(130, 130, 130);
        for (let f = 0; f <= 1; f += 0.25) {
          const v = maxC * f;
          const yp = chartY2 + chartH2 - f * chartH2;
          doc.line(chartX, yp, chartX + chartW2, yp);
          doc.text(fmtGBP(v), chartX - 7, yp + 1.5);
        }
        // X grid
        const xStep2 = Math.max(1, Math.round(maxW2 / 8));
        for (let w = 0; w <= maxW2; w += xStep2) {
          const xp = chartX + (w / maxW2) * chartW2;
          doc.line(xp, chartY2, xp, chartY2 + chartH2);
          doc.text(`${w}w`, xp - 2, chartY2 + chartH2 + 4);
        }

        // Hire line (red)
        doc.setDrawColor(239, 68, 68); doc.setLineWidth(0.5);
        for (let i = 1; i <= maxW2; i++) {
          const x1 = chartX + ((i - 1) / maxW2) * chartW2;
          const y1 = chartY2 + chartH2 - (r.cumulativeHire[i - 1] / maxC) * chartH2;
          const x2 = chartX + (i / maxW2) * chartW2;
          const y2v = chartY2 + chartH2 - (r.cumulativeHire[i] / maxC) * chartH2;
          doc.line(x1, y1, x2, y2v);
        }

        // Own line (blue)
        doc.setDrawColor(59, 130, 246);
        for (let i = 1; i <= maxW2; i++) {
          const x1 = chartX + ((i - 1) / maxW2) * chartW2;
          const y1 = chartY2 + chartH2 - (r.cumulativeOwn[i - 1] / maxC) * chartH2;
          const x2 = chartX + (i / maxW2) * chartW2;
          const y2v = chartY2 + chartH2 - (r.cumulativeOwn[i] / maxC) * chartH2;
          doc.line(x1, y1, x2, y2v);
        }

        // Project duration line (purple, dashed via short segments)
        const pdXp = chartX + Math.min(r.item.projectDurationWeeks / maxW2, 1) * chartW2;
        doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.4);
        for (let dy = chartY2; dy < chartY2 + chartH2; dy += 3) {
          doc.line(pdXp, dy, pdXp, Math.min(dy + 1.5, chartY2 + chartH2));
        }

        // Breakeven dot
        if (r.breakevenWeeks != null && r.breakevenWeeks <= maxW2) {
          const bx = chartX + (r.breakevenWeeks / maxW2) * chartW2;
          const by2 = chartY2 + chartH2 - ((r.item.hireRatePerWeek * r.breakevenWeeks) / maxC) * chartH2;
          doc.setFillColor(27, 87, 69); doc.circle(bx, by2, 1.5, "F");
        }

        // Labels
        doc.setTextColor(80, 80, 80); doc.setFontSize(5.5);
        doc.text("Cumulative Cost (GBP)", chartX - 10, chartY2 - 2);
        doc.text("Weeks", chartX + chartW2 / 2 - 5, chartY2 + chartH2 + 8);
        doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
      }
      y = chartY2 + chartH2 + 12;
    }
  });

  // ── Effective hourly rate comparison (if multiple items)
  if (results.length > 1) {
    checkPage(35);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Multi-Item Summary", M, y); y += 5;

    const sCols = [60, 40, 40, 42];
    let scx = M;
    ["Item", "Hire Cost", "Own Cost", "Recommendation"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(scx, y, sCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
      doc.text(h, scx + 2, y + 4);
      scx += sCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    results.forEach((r2, ri) => {
      checkPage(6);
      scx = M;
      const cells = [
        r2.item.description || `Item ${ri + 1}`,
        fmtGBP(r2.hireCost),
        fmtGBP(r2.ownershipCost),
        r2.cheaperOption === "hire" ? "HIRE" : "BUY",
      ];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(scx, y, sCols[i], 5.5, "FD"); }
        else { doc.rect(scx, y, sCols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
        const lines = doc.splitTextToSize(t, sCols[i] - 4);
        doc.text(lines[0], scx + 2, y + 3.8);
        scx += sCols[i];
      });
      y += 5.5;
    });
    y += 6;
  }

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;

  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
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
      "Plant hire vs buy comparison. Analysis based on RICS Schedule of Basic Plant Charges methodology. This is a cost modelling tool -- actual costs may vary.",
      M, 287
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 291);
  }

  doc.save(`plant-hire-comparator-${docRef}.pdf`);
}

// ─── Item Input Panel (defined OUTSIDE main component) ──────
function ItemPanel({
  item, onChange, onRemove, index, canRemove,
}: {
  item: PlantItem;
  onChange: (updated: PlantItem) => void;
  onRemove: () => void;
  index: number;
  canRemove: boolean;
}) {
  const set = <K extends keyof PlantItem>(k: K, v: PlantItem[K]) => onChange({ ...item, [k]: v });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">
          {item.description ? `Item ${index + 1}: ${item.description}` : `Plant Item ${index + 1}`}
        </h3>
        {canRemove && (
          <button onClick={onRemove} className="text-[10px] font-medium text-red-500 hover:text-red-700 transition-colors">Remove</button>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Plant Description</label>
        <input type="text" value={item.description} onChange={e => set("description", e.target.value)}
          placeholder="e.g. 13t Excavator, 3t Telehandler"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
      </div>

      {/* Purchase / Residual / Life */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Purchase Price (GBP)</label>
          <input type="number" min={0} step={100} value={item.purchasePrice || ""}
            onChange={e => set("purchasePrice", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Residual / Resale (GBP)</label>
          <input type="number" min={0} step={100} value={item.residualValue || ""}
            onChange={e => set("residualValue", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Depreciation Life</label>
          <div className="flex rounded-md overflow-hidden border border-gray-200 mt-1">
            <button onClick={() => set("lifeMode", "years")}
              className={`flex-1 px-2 py-2 text-[10px] font-bold ${item.lifeMode === "years" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>
              Useful Life
            </button>
            <button onClick={() => set("lifeMode", "project")}
              className={`flex-1 px-2 py-2 text-[10px] font-bold ${item.lifeMode === "project" ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>
              Project Only
            </button>
          </div>
        </div>
        {item.lifeMode === "years" && (
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Useful Life (years)</label>
            <input type="number" min={1} max={30} step={1} value={item.usefulLifeYears}
              onChange={e => set("usefulLifeYears", Math.max(1, parseInt(e.target.value) || 5))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
          </div>
        )}
        {item.lifeMode === "project" && (
          <div className="flex items-end">
            <span className="text-xs text-gray-400 pb-2">Depreciated over project duration ({fmtWeeks(item.projectDurationWeeks)})</span>
          </div>
        )}
      </div>

      {/* Hire rate + Duration + Utilisation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Hire Rate (GBP/week)</label>
          <input type="number" min={0} step={10} value={item.hireRatePerWeek || ""}
            onChange={e => set("hireRatePerWeek", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Project Duration (weeks)</label>
          <input type="number" min={1} max={520} step={1} value={item.projectDurationWeeks}
            onChange={e => set("projectDurationWeeks", Math.max(1, parseInt(e.target.value) || 26))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Utilisation (%)</label>
          <input type="number" min={10} max={100} step={5} value={item.utilisation}
            onChange={e => set("utilisation", Math.max(10, Math.min(100, parseInt(e.target.value) || 80)))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
      </div>

      {/* Maintenance / Insurance / Mob-Demob */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Annual Maintenance (GBP)</label>
          <input type="number" min={0} step={100} value={item.annualMaintenance || ""}
            onChange={e => set("annualMaintenance", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Annual Insurance (GBP)</label>
          <input type="number" min={0} step={100} value={item.annualInsurance || ""}
            onChange={e => set("annualInsurance", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mob/Demob Cost (GBP)</label>
          <input type="number" min={0} step={50} value={item.mobDemob || ""}
            onChange={e => set("mobDemob", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
      </div>

      {/* Finance (optional) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Finance Rate (% p.a.)</label>
          <input type="number" min={0} max={30} step={0.5} value={item.financeRate || ""}
            onChange={e => set("financeRate", Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0 = cash purchase"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none mt-1" />
        </div>
        {item.financeRate > 0 && (
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Finance Method</label>
            <div className="flex rounded-md overflow-hidden border border-gray-200 mt-1">
              <button onClick={() => set("useAmortisation", false)}
                className={`flex-1 px-2 py-2 text-[10px] font-bold ${!item.useAmortisation ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>
                Simple
              </button>
              <button onClick={() => set("useAmortisation", true)}
                className={`flex-1 px-2 py-2 text-[10px] font-bold ${item.useAmortisation ? "bg-ebrora text-white" : "bg-gray-50 text-gray-500"}`}>
                Amortised
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function PlantHireComparatorClient() {
  // Settings (PAID = 5 columns)
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Items
  const [items, setItems] = useState<PlantItem[]>([{ ...DEFAULTS, id: uid() }]);

  const updateItem = useCallback((idx: number, updated: PlantItem) => {
    setItems(prev => prev.map((it, i) => i === idx ? updated : it));
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { ...DEFAULTS, id: uid() }]);
  }, []);

  // Calculate
  const results = useMemo(() => items.map(calculateItem), [items]);
  const summary = useMemo(() => calcSummary(results), [results]);
  const sensitivityData = useMemo(() =>
    items.length === 1 ? calcDurationSensitivity(items[0]) : [],
    [items]
  );

  const hasData = items.some(it => it.purchasePrice > 0 || it.hireRatePerWeek > 0);
  const activeResult = results[0]; // primary item for summary cards

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, results, summary); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, results, summary]);

  const clearAll = useCallback(() => {
    setItems([{ ...DEFAULTS, id: uid() }]);
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  // Summary card colours based on recommendation
  const recBg = summary.overallRecommendation === "hire" ? "bg-orange-50" : summary.overallRecommendation === "buy" ? "bg-emerald-50" : "bg-purple-50";
  const recText = summary.overallRecommendation === "hire" ? "text-orange-800" : summary.overallRecommendation === "buy" ? "text-emerald-800" : "text-purple-800";
  const recBorder = summary.overallRecommendation === "hire" ? "border-orange-200" : summary.overallRecommendation === "buy" ? "border-emerald-200" : "border-purple-200";
  const recDot = summary.overallRecommendation === "hire" ? "bg-orange-500" : summary.overallRecommendation === "buy" ? "bg-emerald-500" : "bg-purple-500";

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Hire Cost", value: fmtGBP(summary.totalHireCost), sub: `${items.length} item(s) over project duration`, bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
          { label: "Total Own Cost", value: fmtGBP(summary.totalOwnershipCost), sub: "Purchase + operate + finance", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Saving", value: fmtGBP(summary.totalSaving), sub: `By ${summary.overallRecommendation === "mixed" ? "mixed strategy" : summary.overallRecommendation === "hire" ? "hiring" : "buying"}`, bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
          { label: "Recommendation", value: summary.overallRecommendation === "hire" ? "HIRE" : summary.overallRecommendation === "buy" ? "BUY" : "MIXED", sub: activeResult?.breakevenWeeks != null ? `Breakeven at ${fmtWeeks(activeResult.breakevenWeeks)}` : "No crossover point", bgClass: recBg, textClass: recText, borderClass: recBorder, dotClass: recDot },
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

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel (PAID = 5 cols) */}
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

      {/* ── Item Panels ────────────────────────────────────── */}
      {items.map((item, idx) => (
        <ItemPanel
          key={item.id}
          item={item}
          index={idx}
          canRemove={items.length > 1}
          onChange={updated => updateItem(idx, updated)}
          onRemove={() => removeItem(idx)}
        />
      ))}

      {/* Add item button */}
      <button onClick={addItem}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-400 hover:text-ebrora hover:border-ebrora/30 transition-colors">
        + Add Another Plant Item
      </button>

      {/* ── Results per item ──────────────────────────────── */}
      {results.map((r, idx) => (
        <div key={r.item.id} className="space-y-4">
          {items.length > 1 && (
            <h3 className="text-sm font-bold text-gray-700 pt-2 border-t border-gray-100">
              Results: {r.item.description || `Item ${idx + 1}`}
            </h3>
          )}

          {/* Cost comparison bar chart */}
          {(r.hireCost > 0 || r.ownershipCost > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-700">Cost Comparison</h3>
              <p className="text-[11px] text-gray-400">Green bar = cheaper option for this project duration.</p>
              <ComparisonBars result={r} />
            </div>
          )}

          {/* Cumulative cost crossover chart */}
          {(r.hireCost > 0 || r.ownershipCost > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-700">Cumulative Cost: Hire vs Buy</h3>
              <p className="text-[11px] text-gray-400">
                Red = hire, blue = buy. Purple dashed = your project duration.
                {r.breakevenWeeks != null ? ` Green dot = breakeven at ${fmtWeeks(r.breakevenWeeks)}.` : " Lines do not cross within the range shown."}
              </p>
              <CrossoverChart result={r} />
            </div>
          )}

          {/* Ownership cost breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Ownership Cost Breakdown</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Annual costs pro-rated to project duration of {fmtWeeks(r.item.projectDurationWeeks)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-2">Component</th>
                    <th className="px-4 py-2 text-right">Annual</th>
                    <th className="px-4 py-2 text-right">Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Depreciation", r.annualDepreciation, r.annualDepreciation * (r.item.projectDurationWeeks / 52)],
                    ["Finance Cost", r.annualFinanceCost, r.annualFinanceCost * (r.item.projectDurationWeeks / 52)],
                    ["Maintenance", r.item.annualMaintenance, r.item.annualMaintenance * (r.item.projectDurationWeeks / 52)],
                    ["Insurance", r.item.annualInsurance, r.item.annualInsurance * (r.item.projectDurationWeeks / 52)],
                    ["Mob/Demob", null, r.item.mobDemob],
                  ].map(([label, annual, project]) => (
                    <tr key={label as string}>
                      <td className="px-4 py-2 font-medium text-gray-700">{label as string}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{annual != null ? fmtGBP(annual as number) : "-"}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{fmtGBP(project as number)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-2 text-gray-800">Total Ownership</td>
                    <td className="px-4 py-2 text-right text-gray-800">{fmtGBP(r.totalAnnualOwnership)}</td>
                    <td className="px-4 py-2 text-right text-gray-800">{fmtGBP(r.ownershipCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Effective hourly rates */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Effective Cost per Productive Hour</h3>
            <p className="text-[11px] text-gray-400">Based on {r.item.utilisation}% utilisation over {fmtWeeks(r.item.projectDurationWeeks)} (45hr working week)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 ${r.cheaperOption === "hire" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Hire</div>
                <div className="text-lg font-bold text-gray-800">{fmtGBP(r.effectiveHireRatePerHour)}/hr</div>
              </div>
              <div className={`rounded-lg p-3 ${r.cheaperOption === "buy" ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"}`}>
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Buy</div>
                <div className="text-lg font-bold text-gray-800">{fmtGBP(r.effectiveOwnRatePerHour)}/hr</div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Sensitivity chart (single item only) ──────────── */}
      {sensitivityData.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Duration Sensitivity: When Does Buying Become Cheaper?</h3>
          <p className="text-[11px] text-gray-400">Shows how total cost changes at different project durations. Where the lines cross is the breakeven point.</p>
          <SensitivityChart data={sensitivityData} />
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Cost comparison based on RICS Schedule of Basic Plant Charges methodology.
          Depreciation, finance, maintenance, insurance, and mobilisation costs compared against weekly hire rates.
          This is a cost modelling tool - actual costs, residual values, and hire rates will vary by supplier and market conditions.
        </p>
      </div>
    </div>
  );
}
