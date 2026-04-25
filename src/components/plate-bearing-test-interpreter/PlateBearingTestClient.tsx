// src/components/plate-bearing-test-interpreter/PlateBearingTestClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  TARGET_PRESETS, PLATE_DIAMETERS,
  calculateTestResult,
  stressDisplay, stressToKPa, stressFromKPa, stressLabel,
  todayISO, newId, createEmptyTest, createReading,
} from "@/data/plate-bearing-test-interpreter";
import type {
  StressUnit, Reading, TestLocation, EvResult,
} from "@/data/plate-bearing-test-interpreter";

// ─── Helpers ─────────────────────────────────────────────────
function fmtMPa(v: number | null): string { return v !== null ? `${v.toFixed(1)} MPa` : "--"; }
function fmtRatio(v: number | null): string { return v !== null ? v.toFixed(2) : "--"; }

// ─── SVG Load-Settlement Chart ───────────────────────────────
function LoadSettlementChart({
  test, result, unit,
}: { test: TestLocation; result: EvResult; unit: StressUnit }) {
  const all = [...test.firstLoad, ...test.unload, ...test.reload];
  if (all.length < 2) return <div className="text-center text-sm text-gray-400 py-10">Enter at least 2 readings to see the chart</div>;

  const padL = 58, padR = 65, padT = 25, padB = 40;
  const W = 600, H = 360;
  const cW = W - padL - padR, cH = H - padT - padB;

  const maxStress = Math.max(...all.map(r => stressFromKPa(r.stress, unit)), 1);
  const maxSettlement = Math.max(...all.map(r => r.settlement), 0.5);

  const sx = (s: number) => padL + (stressFromKPa(s, unit) / maxStress) * cW;
  const sy = (s: number) => padT + (s / maxSettlement) * cH; // settlement increases downward

  const polyline = (readings: Reading[], colour: string, label: string) => {
    if (readings.length === 0) return null;
    const sorted = [...readings].sort((a, b) => a.stress - b.stress);
    const pts = sorted.map(r => `${sx(r.stress)},${sy(r.settlement)}`).join(" ");
    const lastX = sx(sorted[sorted.length - 1].stress);
    const lastY = sy(sorted[sorted.length - 1].settlement);
    // Position label left of point if it would overflow right edge
    const labelRight = lastX + 5;
    const overflows = labelRight + 50 > W;
    const labelX = overflows ? lastX - 5 : lastX + 5;
    const anchor = overflows ? "end" as const : "start" as const;
    return (
      <g>
        <polyline points={pts} fill="none" stroke={colour} strokeWidth={2.5} strokeLinejoin="round" />
        {sorted.map(r => (
          <circle key={r.id} cx={sx(r.stress)} cy={sy(r.settlement)} r={sorted.length === 1 ? 5 : 3.5} fill={colour} stroke="white" strokeWidth={1.5} />
        ))}
        <text x={labelX} y={lastY + 3} textAnchor={anchor} fontSize={9} fontWeight={600} fill={colour}>{label}</text>
      </g>
    );
  };

  // Ev gradient dashed lines
  const gradientLine = (stressLow: number | null, stressHigh: number | null, readings: Reading[], colour: string) => {
    if (!stressLow || !stressHigh || readings.length < 2) return null;
    const sorted = [...readings].sort((a, b) => a.stress - b.stress);
    // Interpolate settlement at stress values
    const interp = (targetStress: number): number | null => {
      let lower: Reading | null = null; let upper: Reading | null = null;
      for (const r of sorted) { if (r.stress <= targetStress) lower = r; if (r.stress >= targetStress && !upper) upper = r; }
      if (!lower || !upper) return null;
      if (lower.stress === upper.stress) return lower.settlement;
      const f = (targetStress - lower.stress) / (upper.stress - lower.stress);
      return lower.settlement + f * (upper.settlement - lower.settlement);
    };
    const sLow = interp(stressLow);
    const sHigh = interp(stressHigh);
    if (sLow === null || sHigh === null) return null;
    return (
      <line
        x1={sx(stressLow)} y1={sy(sLow)} x2={sx(stressHigh)} y2={sy(sHigh)}
        stroke={colour} strokeWidth={1.5} strokeDasharray="6 3" opacity={0.7}
      />
    );
  };

  // Grid lines
  const xTicks = 6; const yTicks = 6;
  const xStep = maxStress / xTicks;
  const yStep = maxSettlement / yTicks;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid */}
      {Array.from({ length: xTicks + 1 }).map((_, i) => {
        const xv = i * xStep;
        const xp = padL + (xv / maxStress) * cW;
        return (
          <g key={`xg-${i}`}>
            <line x1={xp} y1={padT} x2={xp} y2={padT + cH} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={xp} y={H - 8} textAnchor="middle" fontSize={9} fill="#9CA3AF">{unit === "MPa" ? xv.toFixed(2) : (xv < 1 ? xv.toFixed(2) : xv < 10 ? xv.toFixed(1) : xv.toFixed(0))}</text>
          </g>
        );
      })}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const yv = i * yStep;
        const yp = padT + (yv / maxSettlement) * cH;
        return (
          <g key={`yg-${i}`}>
            <line x1={padL} y1={yp} x2={padL + cW} y2={yp} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={padL - 6} y={yp + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{yv.toFixed(2)}</text>
          </g>
        );
      })}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + cH} stroke="#374151" strokeWidth={1} />
      <line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH} stroke="#374151" strokeWidth={1} />
      {/* Axis labels */}
      <text x={padL + cW / 2} y={H - 0} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151">Applied Stress ({stressLabel(unit)})</text>
      <text x={12} y={padT + cH / 2} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151" transform={`rotate(-90, 12, ${padT + cH / 2})`}>Settlement (mm)</text>
      {/* Gradient lines (behind curves) */}
      {gradientLine(result.ev1StressLow, result.ev1StressHigh, test.firstLoad, "#6366F1")}
      {gradientLine(result.ev2StressLow, result.ev2StressHigh, test.reload, "#F59E0B")}
      {/* Curves */}
      {polyline(test.firstLoad, "#3B82F6", "1st Load")}
      {polyline(test.unload, "#6B7280", "Unload")}
      {polyline(test.reload, "#F59E0B", "Reload")}
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────
function EvBarChart({ result }: { result: EvResult }) {
  if (result.ev1 === null && result.ev2 === null) return null;
  const W = 400, H = 220;
  const padL = 50, padR = 20, padT = 20, padB = 35;
  const cW = W - padL - padR, cH = H - padT - padB;

  const maxVal = Math.max(result.ev1 ?? 0, result.ev2 ?? 0, 10) * 1.2;

  const barW = 50;
  const bars = [
    { label: "Ev1", value: result.ev1, colour: "#3B82F6" },
    { label: "Ev2", value: result.ev2, colour: "#F59E0B" },
  ];
  const gap = (cW - bars.length * barW) / (bars.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {/* Y grid */}
      {Array.from({ length: 5 }).map((_, i) => {
        const v = (maxVal / 4) * i;
        const yp = padT + cH - (v / maxVal) * cH;
        return (
          <g key={i}>
            <line x1={padL} y1={yp} x2={padL + cW} y2={yp} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={padL - 4} y={yp + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v.toFixed(0)}</text>
          </g>
        );
      })}
      <text x={12} y={padT + cH / 2} textAnchor="middle" fontSize={9} fontWeight={600} fill="#374151" transform={`rotate(-90, 12, ${padT + cH / 2})`}>MPa</text>
      {/* Bars */}
      {bars.map((b, i) => {
        if (b.value === null) return null;
        const x = padL + gap + i * (barW + gap);
        const barH = (b.value / maxVal) * cH;
        const yp = padT + cH - barH;
        return (
          <g key={b.label}>
            <rect x={x} y={yp} width={barW} height={barH} fill={b.colour} rx={4} />
            <text x={x + barW / 2} y={yp - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={b.colour}>{b.value.toFixed(1)}</text>
            <text x={x + barW / 2} y={padT + cH + 15} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151">{b.label}</text>
          </g>
        );
      })}
      {/* Ratio annotation */}
      {result.ratio !== null && (
        <g>
          <rect x={padL + cW - 95} y={padT} width={90} height={32} rx={6} fill={result.pass ? "#DCFCE7" : "#FEE2E2"} stroke={result.pass ? "#86EFAC" : "#FCA5A5"} strokeWidth={1} />
          <text x={padL + cW - 50} y={padT + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={result.pass ? "#166534" : "#991B1B"}>
            Ev2/Ev1 = {result.ratio.toFixed(2)}
          </text>
          <text x={padL + cW - 50} y={padT + 26} textAnchor="middle" fontSize={8} fill={result.pass ? "#166534" : "#991B1B"}>
            {result.pass ? "PASS" : "FAIL"} (target {"\u2264"} {result.targetRatio.toFixed(1)})
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Reading Table Component ─────────────────────────────────
function ReadingTable({
  label, colour, readings, unit, onAdd, onRemove, onUpdate,
}: {
  label: string; colour: string; readings: Reading[]; unit: StressUnit;
  onAdd: () => void; onRemove: (id: string) => void;
  onUpdate: (id: string, field: "stress" | "settlement", value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colour }} />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</span>
        <span className="text-[10px] text-gray-400">({readings.length} readings)</span>
      </div>
      {readings.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_36px] bg-gray-50 border-b border-gray-200">
            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase">Stress ({stressLabel(unit)})</div>
            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase">Settlement (mm)</div>
            <div />
          </div>
          {readings.map(r => (
            <div key={r.id} className="grid grid-cols-[1fr_1fr_36px] border-b border-gray-100 last:border-b-0">
              <input type="number" step={unit === "MPa" ? "0.001" : "1"} min={0}
                value={stressFromKPa(r.stress, unit) || ""}
                onChange={e => onUpdate(r.id, "stress", stressToKPa(parseFloat(e.target.value) || 0, unit))}
                className="px-2 py-1.5 text-sm bg-white border-r border-gray-100 outline-none focus:bg-blue-50/30" />
              <input type="number" step="0.01" min={0}
                value={r.settlement || ""}
                onChange={e => onUpdate(r.id, "settlement", parseFloat(e.target.value) || 0)}
                className="px-2 py-1.5 text-sm bg-white outline-none focus:bg-blue-50/30" />
              <button onClick={() => onRemove(r.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">x</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd}
        className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
        + Add reading
      </button>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  tests: TestLocation[],
  results: EvResult[],
  unit: StressUnit,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `PBT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function checkPage(need: number) {
    if (y + need > 278) {
      addFooter();
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("PLATE BEARING TEST INTERPRETATION (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text("ebrora.com", W - M - 18, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  function addFooter() {
    const pc = doc.getNumberOfPages();
    for (let p = 1; p <= pc; p++) {
      doc.setPage(p);
      doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
      doc.text(
        "Plate bearing test interpretation per DIN 18134. CBR correlation: Ev2 (MPa) = 10 x CBR^0.5. This is a calculation tool -- it does not replace professional engineering judgement.",
        M, 290
      );
      doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pc}`, W - M - 65, 290);
    }
  }

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("PLATE BEARING TEST INTERPRETATION", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("DIN 18134 / Ev1 & Ev2 Deformation Modulus -- ebrora.com/tools/plate-bearing-test-interpreter", M, 16);
  doc.setFontSize(6);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 68, 16);
  y = 28;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
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
  drawFld("Prepared By:", header.preparedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Plate bearing test interpretation for ${header.site || "the above site"}. ${tests.length} test location(s) analysed. Deformation modulus (Ev1 and Ev2) calculated per DIN 18134 using the Boussinesq rigid plate formula: Ev = 1.5 x r x (delta-sigma / delta-s). CBR equivalents from the correlation Ev2 (MPa) = 10 x CBR^0.5.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Per-test results
  tests.forEach((test, ti) => {
    const res = results[ti];
    checkPage(70);

    // Test header
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Test Location: ${test.name}`, M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Plate diameter: ${test.plateDiameter} mm | Stress range: ${test.stressRangeLow}%-${test.stressRangeHigh}% of max stress`, M, y);
    y += 5;

    // Status banner
    const pass = res.pass;
    const hasEv1Only = res.ev1 !== null && res.ev2 === null;
    const hasNothing = res.ev1 === null && res.ev2 === null;
    const brgb = pass === true ? [22, 163, 74] : pass === false ? [220, 38, 38] : hasEv1Only ? [59, 130, 246] : [107, 114, 128];
    doc.setFillColor(brgb[0], brgb[1], brgb[2]);
    doc.roundedRect(M, y, CW, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    let statusText: string;
    if (pass === true) statusText = "PASS";
    else if (pass === false) {
      if (res.meetsRatio === false && res.meetsMinEv2 === false) statusText = "FAIL (ratio AND min Ev2)";
      else if (res.meetsRatio === false) statusText = "FAIL (ratio)";
      else if (res.meetsMinEv2 === false) statusText = "FAIL (min Ev2)";
      else statusText = "FAIL";
    } else if (hasEv1Only) statusText = "Ev1 ONLY -- RELOAD DATA REQUIRED";
    else statusText = "INSUFFICIENT DATA";
    doc.text(statusText, M + 5, y + 5.5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    const minEv2Str = res.minEv2Required !== null ? ` | Min Ev2: >= ${res.minEv2Required} MPa` : "";
    const summaryText = res.ratio !== null
      ? `Ev1: ${fmtMPa(res.ev1)} | Ev2: ${fmtMPa(res.ev2)} | Ratio: ${res.ratio.toFixed(2)} | Target: <= ${res.targetRatio.toFixed(1)}${minEv2Str} | CBR: ${res.cbrEquivalent?.toFixed(1) ?? "--"}%`
      : hasEv1Only
        ? `Ev1: ${fmtMPa(res.ev1)} | Ev2: -- (enter reload cycle data to calculate Ev2 and Ev2/Ev1 ratio)`
        : "Insufficient data to calculate Ev values";
    doc.text(summaryText, M + 5, y + 9.5);
    doc.setTextColor(0, 0, 0); y += 17;

    // Summary panel
    if (res.ev1 !== null || res.ev2 !== null) {
      checkPage(45);
      const panelItems: [string, string][] = [
        ["Ev1 (First Load Modulus)", fmtMPa(res.ev1)],
        ["Ev2 (Reload Modulus)", fmtMPa(res.ev2) + (res.minEv2Required !== null && res.meetsMinEv2 !== null ? (res.meetsMinEv2 ? " (meets min)" : " (below min)") : "")],
        ["Ev2/Ev1 Ratio", fmtRatio(res.ratio) + (res.meetsRatio === true ? " (within)" : res.meetsRatio === false ? " (exceeds)" : "")],
        ["Target Ratio", `<= ${res.targetRatio.toFixed(1)}`],
      ];
      if (res.minEv2Required !== null) {
        panelItems.push(["Minimum Ev2", `>= ${res.minEv2Required} MPa`]);
      }
      panelItems.push(
        ["Overall Result", pass === true ? "PASS" : pass === false ? "FAIL" : "--"],
        ["Equivalent CBR (DIN)", res.cbrEquivalent !== null ? `${res.cbrEquivalent.toFixed(1)}%` : "--"],
        ["Equivalent CBR (TRL)", res.cbrTRL !== null ? `${res.cbrTRL.toFixed(1)}%` : "--"],
      );
      const panelH = panelItems.length * 3.8 + 10;
      doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
      doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Test Summary", M + 4, y + 2); y += 6;
      panelItems.forEach(([label, value]) => {
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
        doc.text(label + ":", M + 4, y);
        doc.setTextColor(17, 24, 39); doc.text(value, M + 60, y);
        doc.setTextColor(0, 0, 0); y += 3.8;
      });
      y += 6;
    }

    // ── Load-Settlement Chart (PDF) ──────────────────────
    const allReadings = [...test.firstLoad, ...test.unload, ...test.reload];
    if (allReadings.length >= 2) {
      const chartW = CW, chartH = 70, chartX = M, chartY = y;
      checkPage(chartH + 14);
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text("Load-Settlement Curve", M, y); y += 4;

      const padL2 = 18, padR2 = 8, padT2 = 4, padB2 = 10;
      const cW2 = chartW - padL2 - padR2, cH2 = chartH - padT2 - padB2;
      const ox = M + padL2, oy = y + padT2;

      const maxStress = Math.max(...allReadings.map(r => stressFromKPa(r.stress, unit)), 0.001);
      const maxSettle = Math.max(...allReadings.map(r => r.settlement), 0.5);

      const px = (s: number) => ox + (stressFromKPa(s, unit) / maxStress) * cW2;
      const py = (s: number) => oy + (s / maxSettle) * cH2;

      // Grid + axes
      doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.15);
      for (let i = 0; i <= 5; i++) {
        const xp = ox + (i / 5) * cW2;
        doc.line(xp, oy, xp, oy + cH2);
        const yp = oy + (i / 5) * cH2;
        doc.line(ox, yp, ox + cW2, yp);
      }
      doc.setDrawColor(60, 60, 60); doc.setLineWidth(0.3);
      doc.line(ox, oy, ox, oy + cH2); doc.line(ox, oy + cH2, ox + cW2, oy + cH2);

      // Axis labels
      doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
      for (let i = 0; i <= 5; i++) {
        const xv = (maxStress / 5) * i;
        const xp = ox + (i / 5) * cW2;
        const lbl = xv < 1 ? xv.toFixed(2) : xv < 10 ? xv.toFixed(1) : xv.toFixed(0);
        doc.text(lbl, xp, oy + cH2 + 3, { align: "center" });
        const yv = (maxSettle / 5) * i;
        const yp = oy + (i / 5) * cH2;
        doc.text(yv.toFixed(2), ox - 1, yp + 1, { align: "right" });
      }
      doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 60);
      doc.text(`Stress (${stressLabel(unit)})`, ox + cW2 / 2, oy + cH2 + 7, { align: "center" });
      doc.text("Settlement (mm)", ox - 14, oy + cH2 / 2, { align: "center", angle: 90 });

      // Draw curves
      const drawPdfCurve = (readings: Reading[], r: number, g: number, b: number, label: string) => {
        if (readings.length === 0) return;
        const sorted = [...readings].sort((a, b2) => a.stress - b2.stress);
        doc.setDrawColor(r, g, b); doc.setLineWidth(0.5);
        for (let i2 = 1; i2 < sorted.length; i2++) {
          doc.line(px(sorted[i2 - 1].stress), py(sorted[i2 - 1].settlement), px(sorted[i2].stress), py(sorted[i2].settlement));
        }
        // Points
        sorted.forEach(rd => {
          doc.setFillColor(r, g, b);
          doc.circle(px(rd.stress), py(rd.settlement), 0.7, "F");
        });
        // Label at end
        const last = sorted[sorted.length - 1];
        doc.setFontSize(4.5); doc.setFont("helvetica", "bold"); doc.setTextColor(r, g, b);
        const lx = px(last.stress) + 1.5;
        doc.text(label, Math.min(lx, M + chartW - padR2 - 10), py(last.settlement) + 1);
      };

      drawPdfCurve(test.firstLoad, 59, 130, 246, "1st Load");
      drawPdfCurve(test.unload, 107, 114, 128, "Unload");
      drawPdfCurve(test.reload, 245, 158, 11, "Reload");

      // Ev gradient dashed lines
      const drawGradient = (stressLow: number | null, stressHigh: number | null, readings: Reading[], r: number, g: number, b: number) => {
        if (!stressLow || !stressHigh || readings.length < 2) return;
        const sorted = [...readings].sort((a, b2) => a.stress - b2.stress);
        const interp2 = (ts: number): number | null => {
          let lo: Reading | null = null, hi: Reading | null = null;
          for (const rd of sorted) { if (rd.stress <= ts) lo = rd; if (rd.stress >= ts && !hi) hi = rd; }
          if (!lo || !hi) return null;
          if (lo.stress === hi.stress) return lo.settlement;
          return lo.settlement + ((ts - lo.stress) / (hi.stress - lo.stress)) * (hi.settlement - lo.settlement);
        };
        const sL = interp2(stressLow), sH = interp2(stressHigh);
        if (sL === null || sH === null) return;
        doc.setDrawColor(r, g, b); doc.setLineWidth(0.3);
        doc.setLineDashPattern([1.5, 1], 0);
        doc.line(px(stressLow), py(sL), px(stressHigh), py(sH));
        doc.setLineDashPattern([], 0);
      };
      drawGradient(res.ev1StressLow, res.ev1StressHigh, test.firstLoad, 99, 102, 241);
      drawGradient(res.ev2StressLow, res.ev2StressHigh, test.reload, 245, 158, 11);

      doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.1);
      y += chartH + 4;
    }

    // ── Ev Bar Chart (PDF) ───────────────────────────────
    if (res.ev1 !== null || res.ev2 !== null) {
      const barChartH = 45;
      checkPage(barChartH + 10);
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text("Deformation Modulus Comparison", M, y); y += 4;

      const bcX = M + 20, bcW2 = 60, bcH = barChartH - 12;
      const maxEv = Math.max(res.ev1 ?? 0, res.ev2 ?? 0, 10) * 1.2;
      const barW2 = 16, gap2 = 10;
      const bars2 = [
        { label: "Ev1", value: res.ev1, r: 59, g: 130, b: 246 },
        { label: "Ev2", value: res.ev2, r: 245, g: 158, b: 11 },
      ];

      // Y-axis
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15);
      for (let i = 0; i <= 4; i++) {
        const yp = y + bcH - (i / 4) * bcH;
        doc.line(bcX, yp, bcX + 55, yp);
        doc.setFontSize(4.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
        doc.text(((maxEv / 4) * i).toFixed(0), bcX - 1, yp + 1, { align: "right" });
      }
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 60);
      doc.text("MPa", bcX - 8, y + bcH / 2 + 1);

      bars2.forEach((b, i) => {
        if (b.value === null) return;
        const bx = bcX + 5 + i * (barW2 + gap2);
        const bh = (b.value / maxEv) * bcH;
        const by = y + bcH - bh;
        doc.setFillColor(b.r, b.g, b.b);
        doc.roundedRect(bx, by, barW2, bh, 1, 1, "F");
        doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(b.r, b.g, b.b);
        doc.text(b.value.toFixed(1), bx + barW2 / 2, by - 1.5, { align: "center" });
        doc.setFontSize(5.5); doc.setTextColor(60, 60, 60);
        doc.text(b.label, bx + barW2 / 2, y + bcH + 4, { align: "center" });
      });

      // Ratio annotation
      if (res.ratio !== null) {
        const ax = bcX + 60, ay = y + 2;
        const isP = res.pass === true;
        doc.setFillColor(isP ? 220 : 254, isP ? 252 : 226, isP ? 231 : 226);
        doc.setDrawColor(isP ? 134 : 252, isP ? 239 : 165, isP ? 172 : 165);
        doc.roundedRect(ax, ay, 38, 10, 1.5, 1.5, "FD");
        doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
        doc.setTextColor(isP ? 22 : 153, isP ? 101 : 27, isP ? 52 : 27);
        doc.text(`Ev2/Ev1 = ${res.ratio.toFixed(2)}`, ax + 19, ay + 4, { align: "center" });
        doc.setFontSize(4.5);
        doc.text(`${isP ? "PASS" : "FAIL"} (target <= ${res.targetRatio.toFixed(1)})`, ax + 19, ay + 8, { align: "center" });
      }

      doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.1);
      y += barChartH + 2;
    }

    // Data table
    checkPage(30);
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Load-Settlement Data", M, y); y += 4;

    const dataCols = [40, 50, 50, 42];
    let cx = M;
    ["Phase", `Stress (${stressLabel(unit)})`, "Settlement (mm)", "Notes"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, dataCols[i], 5.5, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text(h, cx + 2, y + 3.8);
      cx += dataCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 5.5;
    doc.setDrawColor(200, 200, 200);

    const phases: { label: string; readings: Reading[] }[] = [
      { label: "1st Load", readings: test.firstLoad },
      { label: "Unload", readings: test.unload },
      { label: "Reload", readings: test.reload },
    ];
    let rowIdx = 0;
    phases.forEach(phase => {
      const sorted = [...phase.readings].sort((a, b) => a.stress - b.stress);
      sorted.forEach((r, ri) => {
        checkPage(6);
        cx = M;
        const cells = [
          ri === 0 ? phase.label : "",
          stressDisplay(r.stress, unit),
          r.settlement.toFixed(2),
          "",
        ];
        cells.forEach((t, i) => {
          if (rowIdx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, dataCols[i], 5, "FD"); }
          else { doc.rect(cx, y, dataCols[i], 5, "D"); }
          doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 && t ? "bold" : "normal"); doc.setFontSize(6);
          doc.text(t, cx + 2, y + 3.5);
          cx += dataCols[i];
        });
        y += 5;
        rowIdx++;
      });
    });
    y += 6;

    // Separator between tests
    if (ti < tests.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(M, y, W - M, y);
      y += 6;
    }
  });

  // ── Multi-test comparison summary
  if (tests.length > 1) {
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Comparison Summary", M, y); y += 5;

    const compCols = [50, 25, 25, 25, 25, 32];
    let cx2 = M;
    ["Location", "Ev1", "Ev2", "Ratio", "Target", "Result"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx2, y, compCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(h, cx2 + 2, y + 4);
      cx2 += compCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    tests.forEach((test, ti) => {
      checkPage(6);
      const res = results[ti];
      cx2 = M;
      const isPass = res.pass;
      let resultText: string;
      if (isPass === true) resultText = "PASS";
      else if (isPass === false) {
        if (res.meetsRatio === false && res.meetsMinEv2 === false) resultText = "FAIL (both)";
        else if (res.meetsRatio === false) resultText = "FAIL (ratio)";
        else if (res.meetsMinEv2 === false) resultText = "FAIL (Ev2)";
        else resultText = "FAIL";
      } else resultText = "--";
      const cells = [
        test.name,
        res.ev1 !== null ? res.ev1.toFixed(1) : "--",
        res.ev2 !== null ? res.ev2.toFixed(1) : "--",
        fmtRatio(res.ratio),
        `<= ${res.targetRatio.toFixed(1)}` + (res.minEv2Required !== null ? `, >= ${res.minEv2Required}` : ""),
        resultText,
      ];
      cells.forEach((t, i) => {
        if (i === 5 && isPass === true) { doc.setFillColor(220, 252, 231); doc.rect(cx2, y, compCols[i], 5.5, "FD"); }
        else if (i === 5 && isPass === false) { doc.setFillColor(254, 226, 226); doc.rect(cx2, y, compCols[i], 5.5, "FD"); }
        else if (ti % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx2, y, compCols[i], 5.5, "FD"); }
        else { doc.rect(cx2, y, compCols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", i === 0 || i === 5 ? "bold" : "normal"); doc.setFontSize(6);
        doc.text(t, cx2 + 2, y + 3.8);
        cx2 += compCols[i];
      });
      y += 5.5;
    });
    y += 6;
  }

  // ── Notes
  checkPage(20);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Notes", M, y); y += 4;
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  const notes = [
    "- Deformation modulus calculated per DIN 18134: Ev = 1.5 x r x (delta-sigma / delta-s)",
    "- Factor 1.5 from Boussinesq theory for rigid circular plate on elastic half-space",
    "- CBR correlation (DIN): Ev2 (MPa) = 10 x CBR^0.5, therefore CBR = (Ev2/10)^2",
    "- CBR correlation (TRL alternative): Ev2 (MPa) = 17.6 x CBR^0.64",
    "- Ev2/Ev1 ratio indicates compaction quality: 1.0 = perfectly elastic, higher = more plastic deformation",
    "- Target ratios: <= 2.0 (road sub-base), <= 2.5 (general fill), <= 3.5 (bulk fill)",
  ];
  notes.forEach(n => {
    const lines = doc.splitTextToSize(n, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3;
  });
  y += 4;

  // ── Sign-off
  checkPage(50);
  y += 2;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
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

  // Footer
  addFooter();

  doc.save(`plate-bearing-test-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function PlateBearingTestClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stressUnit, setStressUnit] = useState<StressUnit>("kPa");

  const [tests, setTests] = useState<TestLocation[]>([createEmptyTest("TP1")]);
  const [activeTab, setActiveTab] = useState(0);

  const results = useMemo(() => tests.map(calculateTestResult), [tests]);
  const activeTest = tests[activeTab] ?? tests[0];
  const activeResult = results[activeTab] ?? results[0];

  // ── Test management
  const addTest = useCallback(() => {
    const name = `TP${tests.length + 1}`;
    setTests(prev => [...prev, createEmptyTest(name)]);
    setActiveTab(tests.length);
  }, [tests.length]);

  const removeTest = useCallback((idx: number) => {
    if (tests.length <= 1) return;
    setTests(prev => prev.filter((_, i) => i !== idx));
    setActiveTab(prev => Math.min(prev, tests.length - 2));
  }, [tests.length]);

  const updateTest = useCallback((idx: number, update: Partial<TestLocation>) => {
    setTests(prev => prev.map((t, i) => i === idx ? { ...t, ...update } : t));
  }, []);

  // ── Reading management
  const addReading = useCallback((phase: "firstLoad" | "unload" | "reload") => {
    updateTest(activeTab, { [phase]: [...activeTest[phase], createReading(0, 0)] });
  }, [activeTab, activeTest, updateTest]);

  const removeReading = useCallback((phase: "firstLoad" | "unload" | "reload", id: string) => {
    updateTest(activeTab, { [phase]: activeTest[phase].filter(r => r.id !== id) });
  }, [activeTab, activeTest, updateTest]);

  const updateReading = useCallback((phase: "firstLoad" | "unload" | "reload", id: string, field: "stress" | "settlement", value: number) => {
    updateTest(activeTab, { [phase]: activeTest[phase].map(r => r.id === id ? { ...r, [field]: value } : r) });
  }, [activeTab, activeTest, updateTest]);

  const preset = TARGET_PRESETS.find(p => p.id === activeTest.targetPreset);
  const targetRatio = activeTest.customTarget ?? preset?.ratio ?? 2.5;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, preparedBy, date: assessDate }, tests, results, stressUnit); }
    finally { setExporting(false); }
  }, [site, manager, preparedBy, assessDate, tests, results, stressUnit]);

  const clearAll = useCallback(() => {
    setTests([createEmptyTest("TP1")]);
    setActiveTab(0);
    setSite(""); setManager(""); setPreparedBy(""); setAssessDate(todayISO());
  }, []);

  const allReadings = [...activeTest.firstLoad, ...activeTest.unload, ...activeTest.reload];
  const hasData = allReadings.length >= 2;
  const passCount = results.filter(r => r.pass === true).length;
  const failCount = results.filter(r => r.pass === false).length;

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Ev1 (1st Load)", value: fmtMPa(activeResult.ev1),
            sub: activeResult.ev1DeltaSigma !== null ? `Delta-s: ${activeResult.ev1DeltaS?.toFixed(2)} mm` : "Enter 1st load data",
            bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500",
          },
          {
            label: "Ev2 (Reload)", value: fmtMPa(activeResult.ev2),
            sub: activeResult.cbrEquivalent !== null ? `CBR ~${activeResult.cbrEquivalent.toFixed(1)}%` : "Enter reload data",
            bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500",
          },
          {
            label: "Ev2/Ev1 Ratio", value: fmtRatio(activeResult.ratio),
            sub: `Target: <= ${targetRatio.toFixed(1)}`,
            bgClass: activeResult.pass === true ? "bg-emerald-50" : activeResult.pass === false ? "bg-red-50" : "bg-gray-50",
            textClass: activeResult.pass === true ? "text-emerald-800" : activeResult.pass === false ? "text-red-800" : "text-gray-800",
            borderClass: activeResult.pass === true ? "border-emerald-200" : activeResult.pass === false ? "border-red-200" : "border-gray-200",
            dotClass: activeResult.pass === true ? "bg-emerald-500" : activeResult.pass === false ? "bg-red-500" : "bg-gray-400",
          },
          {
            label: "Tests", value: `${tests.length}`,
            sub: `${passCount} pass, ${failCount} fail`,
            bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500",
          },
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

      {/* ── Pass/Fail Banner ──────────────────────────────── */}
      {activeResult.pass === false && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">
              {activeResult.meetsRatio === false && activeResult.meetsMinEv2 === false
                ? "Compaction Fails Both Criteria"
                : activeResult.meetsRatio === false
                  ? "Compaction Does Not Meet Ratio Target"
                  : activeResult.meetsMinEv2 === false
                    ? "Compaction Does Not Meet Minimum Ev2"
                    : "Compaction Does Not Meet Target"}
            </div>
            <div className="text-xs text-red-800 mt-1 space-y-1">
              {activeResult.meetsRatio === false && (
                <div>Ev2/Ev1 ratio of {activeResult.ratio?.toFixed(2)} exceeds the target of {targetRatio.toFixed(1)}. High ratios indicate excessive plastic deformation on first loading -- the material was not adequately compacted.</div>
              )}
              {activeResult.meetsMinEv2 === false && activeResult.minEv2Required !== null && (
                <div>Ev2 of {activeResult.ev2?.toFixed(1)} MPa is below the minimum {activeResult.minEv2Required} MPa required for this material class. The layer is too soft for the design loading -- additional compaction or material substitution is required.</div>
              )}
              <div className="pt-1">The layer should be re-rolled and retested, or the material reviewed for suitability.</div>
            </div>
          </div>
        </div>
      )}
      {activeResult.pass === true && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-emerald-600">OK</span>
          <div>
            <div className="text-sm font-bold text-emerald-900">Compaction Meets Target</div>
            <div className="text-xs text-emerald-800 mt-1">
              Ev2/Ev1 ratio of {activeResult.ratio?.toFixed(2)} is within the target of {targetRatio.toFixed(1)}
              {activeResult.minEv2Required !== null && activeResult.ev2 !== null && (
                <> and Ev2 of {activeResult.ev2.toFixed(1)} MPa meets the minimum {activeResult.minEv2Required} MPa</>
              )}
              . Compaction quality is acceptable.
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
          {[
            { l: "Site Name", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Prepared By", v: preparedBy, s: setPreparedBy },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Test Location Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        {tests.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${i === activeTab ? "bg-ebrora text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.name}
            {results[i].pass === true && <span className="ml-1 text-[9px]">[OK]</span>}
            {results[i].pass === false && <span className="ml-1 text-[9px]">[FAIL]</span>}
          </button>
        ))}
        <button onClick={addTest} className="px-2.5 py-1.5 text-xs font-medium text-ebrora bg-ebrora-light/50 rounded-lg hover:bg-ebrora-light transition-colors">+ Add Test</button>
        {tests.length > 1 && (
          <button onClick={() => removeTest(activeTab)} className="px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Remove</button>
        )}
      </div>

      {/* ── Test Configuration ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Test Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Location Name</label>
            <input type="text" value={activeTest.name}
              onChange={e => updateTest(activeTab, { name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Plate Diameter (mm)</label>
            <select value={activeTest.plateDiameter}
              onChange={e => updateTest(activeTab, { plateDiameter: parseInt(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {PLATE_DIAMETERS.map(d => <option key={d} value={d}>{d} mm</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Stress Unit</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button onClick={() => setStressUnit("kPa")}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${stressUnit === "kPa" ? "bg-ebrora text-white" : "bg-white text-gray-500"}`}>kN/m2</button>
              <button onClick={() => setStressUnit("MPa")}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${stressUnit === "MPa" ? "bg-ebrora text-white" : "bg-white text-gray-500"}`}>MN/m2</button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Preset</label>
            <select value={activeTest.customTarget !== null ? "__custom__" : activeTest.targetPreset}
              onChange={e => {
                if (e.target.value === "__custom__") {
                  updateTest(activeTab, { customTarget: 2.5 });
                } else {
                  updateTest(activeTab, { targetPreset: e.target.value, customTarget: null });
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              {TARGET_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label} (Ev2/Ev1 {"\u2264"} {p.ratio})</option>)}
              <option value="__custom__">Custom target...</option>
            </select>
          </div>
        </div>
        {activeTest.customTarget !== null && (
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Custom Ev2/Ev1 Target:</label>
            <input type="number" step="0.1" min={1} max={10}
              value={activeTest.customTarget}
              onChange={e => updateTest(activeTab, { customTarget: parseFloat(e.target.value) || 2.5 })}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
        )}
        {preset && activeTest.customTarget === null && (
          <div className="text-[11px] text-gray-400">{preset.description}{preset.minEv2 ? ` | Min Ev2: ${preset.minEv2} MPa` : ""}</div>
        )}
        {/* Stress range override */}
        <details className="text-xs">
          <summary className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600">Advanced: Stress Range Override</summary>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-[11px] text-gray-500">Low %:</label>
            <input type="number" min={5} max={45} step={5}
              value={activeTest.stressRangeLow}
              onChange={e => updateTest(activeTab, { stressRangeLow: parseInt(e.target.value) || 30 })}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:border-ebrora outline-none" />
            <label className="text-[11px] text-gray-500">High %:</label>
            <input type="number" min={55} max={95} step={5}
              value={activeTest.stressRangeHigh}
              onChange={e => updateTest(activeTab, { stressRangeHigh: parseInt(e.target.value) || 70 })}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:border-ebrora outline-none" />
            <span className="text-[10px] text-gray-400">Default: 30% - 70% of max applied stress (DIN 18134)</span>
          </div>
        </details>
      </div>

      {/* ── Data Entry Tables ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
        <h3 className="text-sm font-bold text-gray-700">Load-Settlement Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReadingTable label="1st Loading Cycle" colour="#3B82F6" readings={activeTest.firstLoad} unit={stressUnit}
            onAdd={() => addReading("firstLoad")}
            onRemove={(id) => removeReading("firstLoad", id)}
            onUpdate={(id, field, value) => updateReading("firstLoad", id, field, value)} />
          <ReadingTable label="Unloading Cycle" colour="#6B7280" readings={activeTest.unload} unit={stressUnit}
            onAdd={() => addReading("unload")}
            onRemove={(id) => removeReading("unload", id)}
            onUpdate={(id, field, value) => updateReading("unload", id, field, value)} />
          <ReadingTable label="Reload (2nd Loading)" colour="#F59E0B" readings={activeTest.reload} unit={stressUnit}
            onAdd={() => addReading("reload")}
            onRemove={(id) => removeReading("reload", id)}
            onUpdate={(id, field, value) => updateReading("reload", id, field, value)} />
        </div>
      </div>

      {/* ── Load-Settlement Chart ──────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Load-Settlement Curve</h3>
        <p className="text-[11px] text-gray-400">Three curves showing first load (blue), unload (grey), and reload (amber). Dashed lines show the gradient used to calculate Ev1 and Ev2 between {activeTest.stressRangeLow}% and {activeTest.stressRangeHigh}% of max stress.</p>
        <LoadSettlementChart test={activeTest} result={activeResult} unit={stressUnit} />
      </div>

      {/* ── Ev Bar Chart ───────────────────────────────────── */}
      {(activeResult.ev1 !== null || activeResult.ev2 !== null) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Deformation Modulus Comparison</h3>
          <p className="text-[11px] text-gray-400">Ev1 (first load) and Ev2 (reload) with pass/fail indicator against the target Ev2/Ev1 ratio.</p>
          <EvBarChart result={activeResult} />
        </div>
      )}

      {/* ── Detailed Results ───────────────────────────────── */}
      {(activeResult.ev1 !== null || activeResult.ev2 !== null) && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Detailed Results - {activeTest.name}</h3>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="text-gray-500">Ev1 (First Load Modulus)</div><div className="font-bold text-gray-800">{fmtMPa(activeResult.ev1)}</div>
              <div className="text-gray-500">Ev2 (Reload Modulus)</div>
              <div className={`font-bold ${activeResult.meetsMinEv2 === true ? "text-emerald-700" : activeResult.meetsMinEv2 === false ? "text-red-700" : "text-gray-800"}`}>
                {fmtMPa(activeResult.ev2)}
                {activeResult.minEv2Required !== null && activeResult.meetsMinEv2 !== null && (
                  <> {activeResult.meetsMinEv2 ? "(meets min)" : "(below min)"}</>
                )}
              </div>
              <div className="text-gray-500">Ev2/Ev1 Ratio</div>
              <div className={`font-bold ${activeResult.meetsRatio === true ? "text-emerald-700" : activeResult.meetsRatio === false ? "text-red-700" : "text-gray-800"}`}>
                {fmtRatio(activeResult.ratio)} {activeResult.meetsRatio === true ? "(within)" : activeResult.meetsRatio === false ? "(exceeds)" : ""}
              </div>
              <div className="text-gray-500">Target Ratio</div><div className="font-bold text-gray-800">{"\u2264"} {targetRatio.toFixed(1)}</div>
              {activeResult.minEv2Required !== null && (
                <>
                  <div className="text-gray-500">Minimum Ev2</div><div className="font-bold text-gray-800">{"\u2265"} {activeResult.minEv2Required} MPa</div>
                </>
              )}
              <div className="text-gray-500">Overall Result</div>
              <div className={`font-bold ${activeResult.pass === true ? "text-emerald-700" : activeResult.pass === false ? "text-red-700" : "text-gray-800"}`}>
                {activeResult.pass === true ? "PASS" : activeResult.pass === false ? "FAIL" : "--"}
              </div>
              <div className="text-gray-500">Equivalent CBR (DIN)</div><div className="font-bold text-gray-800">{activeResult.cbrEquivalent !== null ? `${activeResult.cbrEquivalent.toFixed(1)}%` : "--"}</div>
              <div className="text-gray-500">Equivalent CBR (TRL)</div><div className="font-bold text-gray-800">{activeResult.cbrTRL !== null ? `${activeResult.cbrTRL.toFixed(1)}%` : "--"}</div>
              <div className="text-gray-500">Plate Radius</div><div className="font-bold text-gray-800">{(activeTest.plateDiameter / 2).toFixed(0)} mm</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-2">
              Pass criteria: Ev2/Ev1 ratio {"\u2264"} target {activeResult.minEv2Required !== null ? `AND Ev2 \u2265 ${activeResult.minEv2Required} MPa` : ""}. CBR (DIN): Ev2 (MPa) = 10 x CBR^0.5, so CBR = (Ev2/10)^2. CBR (TRL alternative): Ev2 (MPa) = 17.6 x CBR^0.64. The TRL correlation is shown for reference; the DIN formula is the primary method used in UK earthworks practice.
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Test Comparison ──────────────────────────── */}
      {tests.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Comparison Summary ({tests.length} tests)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Location</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Ev1 (MPa)</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Ev2 (MPa)</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Ratio</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Target</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">CBR %</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Result</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t, i) => {
                  const r = results[i];
                  let resultLabel: string;
                  if (r.pass === true) resultLabel = "Pass";
                  else if (r.pass === false) {
                    if (r.meetsRatio === false && r.meetsMinEv2 === false) resultLabel = "Fail (both)";
                    else if (r.meetsRatio === false) resultLabel = "Fail (ratio)";
                    else if (r.meetsMinEv2 === false) resultLabel = "Fail (Ev2)";
                    else resultLabel = "Fail";
                  } else resultLabel = "--";
                  return (
                    <tr key={t.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab(i)}>
                      <td className="px-3 py-2 font-medium text-gray-800">{t.name}</td>
                      <td className="px-3 py-2 text-gray-600">{r.ev1?.toFixed(1) ?? "--"}</td>
                      <td className="px-3 py-2 text-gray-600">{r.ev2?.toFixed(1) ?? "--"}</td>
                      <td className="px-3 py-2 text-gray-600">{fmtRatio(r.ratio)}</td>
                      <td className="px-3 py-2 text-gray-600">{"\u2264"} {r.targetRatio.toFixed(1)}{r.minEv2Required !== null ? `, \u2265 ${r.minEv2Required} MPa` : ""}</td>
                      <td className="px-3 py-2 text-gray-600">{r.cbrEquivalent?.toFixed(1) ?? "--"}</td>
                      <td className="px-3 py-2">
                        {r.pass === true && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{resultLabel}</span>}
                        {r.pass === false && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-50 text-red-700 border border-red-200">{resultLabel}</span>}
                        {r.pass === null && <span className="text-gray-400">--</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Deformation modulus calculated per DIN 18134 using the Boussinesq rigid plate formula: Ev = 1.5 x r x (delta-sigma / delta-s).
          CBR correlation: Ev2 (MPa) = 10 x CBR^0.5 (DIN). TRL alternative: Ev2 (MPa) = 17.6 x CBR^0.64.
          This is a calculation tool - it does not replace professional engineering judgement or certified laboratory testing.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
