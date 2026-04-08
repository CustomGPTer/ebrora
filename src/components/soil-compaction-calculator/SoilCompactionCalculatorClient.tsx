// src/components/soil-compaction-calculator/SoilCompactionCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  MATERIALS, EQUIPMENT,
  getMaterial, getEquipment, getSpec, getSuitableEquipment,
  calculateZone, generateEquipmentComparison, getTestingRequirements,
  getSuitabilityColour, REGULATIONS,
  type MaterialType, type EquipmentCategory, type CompactionStandard,
  type ZoneInput, type ZoneResult, type EquipmentComparison,
} from "@/data/soil-compaction-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v < 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function uid() { return Math.random().toString(36).slice(2, 8); }

const DEFAULT_ZONE: () => ZoneInput = () => ({
  id: uid(), name: "Zone 1", totalDepthM: 1.0, lengthM: 20, widthM: 10,
  material: "well_graded_granular" as MaterialType,
  equipment: "vibratory_roller_1300_2300" as EquipmentCategory,
  compactionStandard: "method" as CompactionStandard, targetMDD: 95,
});

// ─── Layer Diagram SVG ──────────────────────────────────────
function LayerDiagram({ numLifts, layerMm, totalMm }: { numLifts: number; layerMm: number; totalMm: number }) {
  if (numLifts <= 0) return null;
  const maxShow = Math.min(numLifts, 12);
  const W = 240; const H = Math.min(300, 40 + maxShow * 22);
  const padTop = 15; const padL = 50; const padR = 10;
  const barW = W - padL - padR;
  const barH = Math.max(14, (H - padTop - 10) / maxShow);
  const colours = ["#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399", "#10B981", "#059669", "#047857", "#065F46"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 320 }}>
      <text x={W / 2} y={10} textAnchor="middle" fontSize={9} fill="#374151" fontWeight={600} fontFamily="system-ui">{numLifts} lift{numLifts > 1 ? "s" : ""} x {layerMm}mm = {totalMm}mm</text>
      {Array.from({ length: maxShow }).map((_, i) => {
        const y = padTop + i * barH;
        return (<g key={i}><rect x={padL} y={y} width={barW} height={barH - 2} rx={3} fill={colours[i % colours.length]} stroke="#059669" strokeWidth={0.5} />
          <text x={padL + barW / 2} y={y + barH / 2 + 1} textAnchor="middle" fontSize={8} fill="#065F46" fontWeight={600} fontFamily="system-ui">Lift {i + 1}</text>
          <text x={padL - 4} y={y + barH / 2 + 1} textAnchor="end" fontSize={7} fill="#6B7280" fontFamily="system-ui">{layerMm}mm</text></g>);
      })}
      {numLifts > maxShow && <text x={W / 2} y={padTop + maxShow * barH + 5} textAnchor="middle" fontSize={8} fill="#9CA3AF" fontFamily="system-ui">... +{numLifts - maxShow} more lifts</text>}
    </svg>
  );
}

// ─── Equipment Comparison Bar Chart SVG ─────────────────────
function ComparisonChart({ comparisons, currentEquipId }: { comparisons: EquipmentComparison[]; currentEquipId: EquipmentCategory }) {
  if (comparisons.length === 0) return null;
  const maxTime = Math.max(...comparisons.map(c => c.estTimeHours), 0.1);
  const W = 560; const H = Math.max(160, comparisons.length * 28 + 50);
  const padL = 130; const padR = 60; const padTop = 20; const padBot = 30;
  const barH = Math.min(20, (H - padTop - padBot) / comparisons.length - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 400 }}>
      <text x={W / 2} y={12} textAnchor="middle" fontSize={10} fill="#374151" fontWeight={600} fontFamily="system-ui">Estimated Compaction Time by Equipment</text>
      {comparisons.map((c, i) => {
        const y = padTop + i * (barH + 4);
        const bW = maxTime > 0 ? ((c.estTimeHours / maxTime) * (W - padL - padR)) : 0;
        const isCurrent = c.equipment.id === currentEquipId;
        return (<g key={c.equipment.id}>
          <text x={padL - 4} y={y + barH / 2 + 3} textAnchor="end" fontSize={7} fill={isCurrent ? "#1B5745" : "#6B7280"} fontWeight={isCurrent ? 700 : 400} fontFamily="system-ui">{c.equipment.shortLabel}</text>
          <rect x={padL} y={y} width={Math.max(2, bW)} height={barH} rx={3} fill={isCurrent ? "#1B5745" : "#94A3B8"} opacity={isCurrent ? 1 : 0.6} />
          <text x={padL + bW + 4} y={y + barH / 2 + 3} fontSize={8} fill="#374151" fontWeight={isCurrent ? 700 : 400} fontFamily="system-ui">{fmtNum(c.estTimeHours, 1)}h ({c.numLifts} lifts, {c.totalPasses} passes)</text>
        </g>);
      })}
      <line x1={padL} y1={padTop - 4} x2={padL} y2={H - padBot + 4} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function SoilCompactionCalculatorClient() {
  const [zones, setZones] = useState<ZoneInput[]>([DEFAULT_ZONE()]);
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [header, setHeader] = useState({ company: "", site: "", manager: "", assessedBy: "", date: todayISO() });

  const results: ZoneResult[] = useMemo(() => zones.map(z => calculateZone(z)), [zones]);
  const hasData = zones.length > 0 && zones[0].totalDepthM > 0;

  const totals = useMemo(() => {
    const totalLifts = results.reduce((s, r) => s + r.numLifts, 0);
    const totalPasses = results.reduce((s, r) => s + r.totalPasses, 0);
    const totalArea = results.reduce((s, r) => s + r.areaM2, 0);
    const totalTime = results.reduce((s, r) => s + r.estTimeHours, 0);
    const allSuitable = results.every(r => r.suitable);
    return { totalLifts, totalPasses, totalArea, totalTime, allSuitable };
  }, [results]);

  const comparison = useMemo(() => {
    if (zones.length === 0) return [];
    const z = zones[0];
    return generateEquipmentComparison(z.material, z.totalDepthM, z.lengthM, z.widthM);
  }, [zones]);

  const updateZone = useCallback((id: string, patch: Partial<ZoneInput>) => {
    setZones(zs => zs.map(z => z.id === id ? { ...z, ...patch } : z));
  }, []);
  const addZone = useCallback(() => {
    setZones(zs => [...zs, { ...DEFAULT_ZONE(), id: uid(), name: `Zone ${zs.length + 1}` }]);
  }, []);
  const removeZone = useCallback((id: string) => {
    setZones(zs => zs.length > 1 ? zs.filter(z => z.id !== id) : zs);
  }, []);
  const clearAll = useCallback(() => {
    setZones([DEFAULT_ZONE()]);
    setHeader({ company: "", site: "", manager: "", assessedBy: "", date: todayISO() });
  }, []);

  // ─── PDF Export (PAID = dark header) ────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
      const docRef = `SCC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      function checkPage(need: number) {
        if (y + need > 278) {
          doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
          doc.text("SOIL COMPACTION ASSESSMENT (continued)", M, 7);
          doc.setFontSize(6); doc.setFont("helvetica", "normal");
          doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
          doc.setTextColor(0, 0, 0); y = 14;
        }
      }

      // Dark header (PAID)
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
      doc.text("SOIL COMPACTION ASSESSMENT", M, 12);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text("SHW Series 600 / Table 6/1 Method Specification", M, 19);
      doc.setFontSize(7);
      doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
      y = 34; doc.setTextColor(0, 0, 0);

      // Info panel
      doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
      doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD"); doc.setFontSize(8);
      const halfW = CW / 2;
      const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
        doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
        const lw = doc.getTextWidth(label) + 2;
        if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
        else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
      };
      drawFld("Company:", header.company, M + 3, y, 50); drawFld("Site:", header.site, M + halfW, y, 40); y += 5;
      drawFld("Site Manager:", header.manager, M + 3, y, 50); drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40); y += 5;
      drawFld("Date:", header.date ? new Date(header.date + "T00:00:00").toLocaleDateString("en-GB") : "", M + 3, y, 30); y += 8;

      // Scope
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
      const scopeLines = doc.splitTextToSize(`Soil compaction assessment for ${header.site || "the above site"}. ${zones.length} zone${zones.length > 1 ? "s" : ""} assessed per SHW Series 600 Table 6/1 method specification.`, CW);
      doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

      // Summary banner
      const bannerRGB = totals.allSuitable ? [22, 163, 74] : [220, 38, 38];
      doc.setFillColor(bannerRGB[0], bannerRGB[1], bannerRGB[2]);
      doc.roundedRect(M, y, CW, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(totals.allSuitable ? "ALL EQUIPMENT/MATERIAL COMBINATIONS SUITABLE" : "WARNING: UNSUITABLE COMBINATION(S) DETECTED", M + 5, y + 6);
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text(`${zones.length} zone${zones.length > 1 ? "s" : ""} | Lifts: ${totals.totalLifts} | Passes: ${totals.totalPasses} | Time: ${fmtNum(totals.totalTime, 1)} hrs | Area: ${fmtNum(totals.totalArea, 0)} m2`, M + 5, y + 11);
      doc.setTextColor(0, 0, 0); y += 20;

      // Summary panel
      checkPage(45);
      doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
      const pItems = [["Total Zones", `${zones.length}`], ["Total Fill Area", `${fmtNum(totals.totalArea, 0)} m2`], ["Total Lifts", `${totals.totalLifts}`], ["Total Passes", `${totals.totalPasses}`], ["Est. Time", `${fmtNum(totals.totalTime, 1)} hours`], ["All Suitable", totals.allSuitable ? "YES" : "NO"]];
      doc.roundedRect(M, y - 2, CW, pItems.length * 4 + 10, 1.5, 1.5, "FD");
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Assessment Summary", M + 4, y + 2); y += 6;
      pItems.forEach(([l, v]) => {
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81); doc.text(l + ":", M + 4, y);
        if (l === "All Suitable" && !totals.allSuitable) doc.setTextColor(220, 38, 38);
        else if (l === "All Suitable") doc.setTextColor(22, 163, 74);
        else doc.setTextColor(17, 24, 39);
        doc.text(v, M + 60, y); doc.setTextColor(0, 0, 0); y += 3.8;
      }); y += 6;

      // Zone details
      for (let zi = 0; zi < zones.length; zi++) {
        const zone = zones[zi]; const res = results[zi]; checkPage(55);
        const sRGB = res.suitable ? [22, 163, 74] : [220, 38, 38];
        doc.setFillColor(sRGB[0], sRGB[1], sRGB[2]); doc.roundedRect(M, y, CW, 8, 1.5, 1.5, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text(`${zone.name} -- ${res.suitable ? "SUITABLE" : "NOT SUITABLE"}`, M + 4, y + 5.5);
        doc.setTextColor(0, 0, 0); y += 12;

        const zcCols = [60, CW - 60];
        const zcRows = [
          ["Material", `${res.material.label} (SHW Class ${res.material.shwClass})`], ["Equipment", res.equipment.label],
          ["Total Fill Depth", `${fmtNum(zone.totalDepthM * 1000, 0)} mm`], ["Compaction Area", `${fmtNum(zone.lengthM, 1)} x ${fmtNum(zone.widthM, 1)} m = ${fmtNum(res.areaM2, 0)} m2`],
          ["Standard", zone.compactionStandard === "method" ? "Method (Table 6/1)" : `End-product (${zone.targetMDD}% MDD)`],
          ["Max Layer", res.suitable ? `${res.spec.maxLayerMm} mm` : "N/A"], ["Min Passes/Layer", res.suitable ? `${res.spec.minPasses}` : "N/A"],
          ["Lifts", res.suitable ? `${res.numLifts}` : "N/A"], ["Actual Layer", res.suitable ? `${res.actualLayerMm} mm` : "N/A"],
          ["Total Passes", res.suitable ? `${res.totalPasses}` : "N/A"], ["Est. Time", res.suitable ? `${fmtNum(res.estTimeHours, 1)} hours` : "N/A"],
        ];
        let cx = M;
        ["Parameter", "Value"].forEach((h, i) => {
          doc.setFillColor(30, 30, 30); doc.rect(cx, y, zcCols[i], 6, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
          doc.text(h, cx + 2, y + 4); cx += zcCols[i];
        });
        doc.setTextColor(0, 0, 0); y += 6; doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
        zcRows.forEach(([label, value], ri) => {
          checkPage(6); cx = M;
          [label, value].forEach((t, i) => {
            if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, zcCols[i], 5.5, "FD"); }
            else { doc.rect(cx, y, zcCols[i], 5.5, "D"); }
            doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.text(t, cx + 2, y + 3.5); cx += zcCols[i];
          }); y += 5.5;
        });
        if (res.spec.notes) {
          checkPage(10); doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
          const nl = doc.splitTextToSize(`Note: ${res.spec.notes}`, CW - 4); doc.text(nl, M + 2, y + 3); y += nl.length * 2.8 + 2; doc.setTextColor(0, 0, 0);
        }
        y += 6;
      }

      // Equipment comparison table
      if (comparison.length > 0) {
        checkPage(30); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Equipment Comparison (Zone 1)", M, y); y += 7;
        const ecCols = [58, 20, 18, 20, 24, 46]; let cx = M;
        ["Equipment", "Layer", "Passes", "Lifts", "Total", "Est. Time"].forEach((h, i) => {
          doc.setFillColor(30, 30, 30); doc.rect(cx, y, ecCols[i], 6, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.text(h, cx + 2, y + 4); cx += ecCols[i];
        });
        doc.setTextColor(0, 0, 0); y += 6; doc.setDrawColor(200, 200, 200);
        comparison.forEach((c, ri) => {
          checkPage(6); const isCurrent = c.equipment.id === zones[0].equipment; cx = M;
          [c.equipment.shortLabel, `${c.spec.maxLayerMm}`, `${c.spec.minPasses}`, `${c.numLifts}`, `${c.totalPasses}`, `${fmtNum(c.estTimeHours, 1)}h`].forEach((t, i) => {
            if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, ecCols[i], 5.5, "FD"); }
            else if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, ecCols[i], 5.5, "FD"); }
            else { doc.rect(cx, y, ecCols[i], 5.5, "D"); }
            doc.setTextColor(0, 0, 0); doc.setFont("helvetica", isCurrent || i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
            doc.text(t, cx + 2, y + 3.5); cx += ecCols[i];
          }); y += 5.5;
        }); y += 6;
      }

      // Equipment comparison bar chart
      if (comparison.length > 1) {
        const chartH = Math.min(60, comparison.length * 8 + 10); checkPage(chartH + 15);
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Compaction Time Comparison", M, y); y += 5;
        const chartX = M + 45; const chartW = CW - 55;
        const maxTime = Math.max(...comparison.map(c => c.estTimeHours), 0.1);
        const bH = Math.min(5, (chartH - 4) / comparison.length);
        comparison.forEach((c, i) => {
          const bY = y + i * (bH + 1.5); const bW = Math.max(1, (c.estTimeHours / maxTime) * chartW);
          const isCurrent = c.equipment.id === zones[0].equipment;
          doc.setFontSize(5); doc.setFont("helvetica", isCurrent ? "bold" : "normal"); doc.setTextColor(100, 100, 100);
          doc.text(c.equipment.shortLabel, chartX - 2, bY + bH / 2 + 1.5, { align: "right" });
          if (isCurrent) { doc.setFillColor(27, 87, 69); } else { doc.setFillColor(148, 163, 184); }
          doc.roundedRect(chartX, bY, bW, bH, 1, 1, "F");
          doc.setTextColor(0, 0, 0); doc.setFontSize(5); doc.text(`${fmtNum(c.estTimeHours, 1)}h`, chartX + bW + 2, bY + bH / 2 + 1.5);
        }); y += chartH + 4;
      }

      // Testing requirements
      const epZones = zones.filter(z => z.compactionStandard === "end_product");
      if (epZones.length > 0) {
        checkPage(40); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Field Testing Requirements", M, y); y += 5;
        const testReqs = getTestingRequirements(epZones[0].targetMDD);
        const trCols = [36, 36, 60, 54]; let cx = M;
        ["Method", "Standard", "Description", "Frequency"].forEach((h, i) => {
          doc.setFillColor(30, 30, 30); doc.rect(cx, y, trCols[i], 6, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.text(h, cx + 2, y + 4); cx += trCols[i];
        }); doc.setTextColor(0, 0, 0); y += 6; doc.setDrawColor(200, 200, 200);
        testReqs.forEach((tr, ri) => {
          checkPage(12); const dL = doc.splitTextToSize(tr.description, trCols[2] - 4); const fL = doc.splitTextToSize(tr.frequency, trCols[3] - 4);
          const rowH = Math.max(5.5, Math.max(dL.length, fL.length) * 2.5 + 2); cx = M;
          [tr.method, tr.standard].forEach((t, i) => {
            if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, trCols[i], rowH, "FD"); } else { doc.rect(cx, y, trCols[i], rowH, "D"); }
            doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
            doc.text(doc.splitTextToSize(t, trCols[i] - 4), cx + 2, y + 3.5); cx += trCols[i];
          });
          if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, trCols[2], rowH, "FD"); } else { doc.rect(cx, y, trCols[2], rowH, "D"); }
          doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.text(dL, cx + 2, y + 3.5); cx += trCols[2];
          if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, trCols[3], rowH, "FD"); } else { doc.rect(cx, y, trCols[3], rowH, "D"); }
          doc.text(fL, cx + 2, y + 3.5); y += rowH;
        }); y += 6;
      }

      // Regulations
      checkPage(25); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("Applicable References", M, y); y += 4;
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      REGULATIONS.forEach(reg => { doc.text(`- ${reg}`, M + 2, y); y += 3.5; }); y += 4;

      // Sign-off
      checkPage(50); y += 2; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
      const soW = CW / 2 - 2; const soH = 8;
      doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5); doc.setFillColor(245, 245, 245);
      doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
      doc.setFont("helvetica", "bold"); doc.text("Assessed By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5); y += soH;
      (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
        doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
        doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
        doc.setFont("helvetica", "normal"); y += soH;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130); doc.setFont("helvetica", "normal");
        doc.text("Compaction per SHW Series 600 Table 6/1. Times are indicative. Verify field density per BS 1377.", M, 290);
        doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 45, 290);
      }
      doc.save(`soil-compaction-assessment-${docRef}.pdf`);
    } catch (e) { console.error("PDF error:", e); }
    finally { setExporting(false); }
  }, [zones, results, totals, comparison, header]);

  // ─── Render ────────────────────────────────────────────────
  const statusCard = totals.allSuitable
    ? { bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" }
    : { bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Lifts", value: `${totals.totalLifts}`, sub: `${zones.length} zone${zones.length > 1 ? "s" : ""}`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Total Passes", value: `${totals.totalPasses}`, sub: "All zones combined", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Total Area", value: `${fmtNum(totals.totalArea, 0)} m2`, sub: `${zones.length} zone${zones.length > 1 ? "s" : ""}`, bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
          { label: "Est. Time", value: `${fmtNum(totals.totalTime, 1)} hrs`, sub: "Compaction only", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Status", value: totals.allSuitable ? "ALL OK" : "WARNING", sub: totals.allSuitable ? "All combinations suitable" : "Unsuitable detected", ...statusCard },
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
        <PaidDownloadButton hasData={hasData}>
          <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Company", v: header.company, s: (v: string) => setHeader(h => ({ ...h, company: v })) },
            { l: "Site", v: header.site, s: (v: string) => setHeader(h => ({ ...h, site: v })) },
            { l: "Site Manager", v: header.manager, s: (v: string) => setHeader(h => ({ ...h, manager: v })) },
            { l: "Assessed By", v: header.assessedBy, s: (v: string) => setHeader(h => ({ ...h, assessedBy: v })) },
          ].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={header.date} onChange={e => setHeader(h => ({ ...h, date: e.target.value }))} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Zone inputs */}
      {zones.map((zone, zi) => {
        const res = results[zi]; const suitColour = getSuitabilityColour(res.suitable); const suitEquip = getSuitableEquipment(zone.material);
        return (
          <div key={zone.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="text" value={zone.name} onChange={e => updateZone(zone.id, { name: e.target.value })} className="text-sm font-bold text-gray-900 border-none bg-transparent outline-none w-28 focus:bg-gray-50 rounded px-1" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${suitColour.bg} ${suitColour.text} border ${suitColour.border}`}>{suitColour.label}</span>
              </div>
              {zones.length > 1 && <button onClick={() => removeZone(zone.id)} className="text-gray-400 hover:text-red-500 transition-colors text-xs">Remove</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Material Type</label>
                <select value={zone.material} onChange={e => updateZone(zone.id, { material: e.target.value as MaterialType })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">{MATERIALS.map(m => <option key={m.id} value={m.id}>{m.label} ({m.shwClass})</option>)}</select></div>
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Equipment</label>
                <select value={zone.equipment} onChange={e => updateZone(zone.id, { equipment: e.target.value as EquipmentCategory })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${suitEquip.includes(zone.equipment) ? "border-gray-200 bg-white focus:border-ebrora" : "border-red-300 bg-red-50 text-red-700"}`}>{EQUIPMENT.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
                {!suitEquip.includes(zone.equipment) && <p className="text-[10px] text-red-600 mt-1">Not suitable for this material</p>}</div>
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Fill Depth (m)</label>
                <input type="number" min={0} step={0.1} value={zone.totalDepthM} onChange={e => updateZone(zone.id, { totalDepthM: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Compaction Standard</label>
                <select value={zone.compactionStandard} onChange={e => updateZone(zone.id, { compactionStandard: e.target.value as CompactionStandard })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
                  <option value="method">Method (SHW Table 6/1)</option><option value="end_product">End-Product (% MDD)</option></select></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Length (m)</label>
                <input type="number" min={0} step={0.5} value={zone.lengthM} onChange={e => updateZone(zone.id, { lengthM: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Width (m)</label>
                <input type="number" min={0} step={0.5} value={zone.widthM} onChange={e => updateZone(zone.id, { widthM: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>
              {zone.compactionStandard === "end_product" && (
                <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Target % MDD</label>
                  <input type="number" min={85} max={105} step={1} value={zone.targetMDD} onChange={e => updateZone(zone.id, { targetMDD: parseFloat(e.target.value) || 95 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" /></div>)}
            </div>
            {res.suitable && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-gray-100">
                {[{ l: "Layer", v: `${res.actualLayerMm}mm` }, { l: "Max Layer", v: `${res.spec.maxLayerMm}mm` }, { l: "Lifts", v: `${res.numLifts}` }, { l: "Passes/Lift", v: `${res.passesPerLift}` }, { l: "Total Passes", v: `${res.totalPasses}` }, { l: "Est. Time", v: `${fmtNum(res.estTimeHours, 1)}h` }].map(r => (
                  <div key={r.l} className="text-center"><div className="text-[10px] text-gray-400 uppercase font-semibold">{r.l}</div><div className="text-sm font-bold text-gray-900">{r.v}</div></div>
                ))}
              </div>
            )}
            {zone.compactionStandard === "end_product" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700"><span className="font-bold">End-product compaction:</span> Pass counts are indicative. Field density testing per BS 1377-9 required to verify {zone.targetMDD}% MDD.</div>
            )}
            {!res.suitable && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700"><span className="font-bold">Not suitable:</span> {res.spec.notes}</div>
            )}
          </div>
        );
      })}

      <button onClick={addZone} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">+ Add Zone</button>

      {/* Visuals */}
      {results[0]?.suitable && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Layer Build-Up (Zone 1)</h3>
            <LayerDiagram numLifts={results[0].numLifts} layerMm={results[0].actualLayerMm} totalMm={Math.round(zones[0].totalDepthM * 1000)} />
          </div>
          {comparison.length > 1 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipment Comparison</h3>
              <ComparisonChart comparisons={comparison} currentEquipId={zones[0].equipment} />
            </div>
          )}
        </div>
      )}

      {/* Equipment comparison table */}
      {comparison.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">All Suitable Equipment for {getMaterial(zones[0].material).label}</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50">
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Equipment</th>
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Mass Range</th>
            <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Max Layer</th>
            <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Passes</th>
            <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Lifts</th>
            <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Total</th>
            <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Est. Time</th>
          </tr></thead><tbody>{comparison.map(c => {
            const isCurrent = c.equipment.id === zones[0].equipment;
            return (<tr key={c.equipment.id} className={isCurrent ? "bg-ebrora-light/40 font-bold" : "hover:bg-gray-50"}>
              <td className="px-3 py-1.5 border-t border-gray-100 font-semibold">{c.equipment.shortLabel}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-gray-500 text-xs">{c.equipment.massRange}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-center">{c.spec.maxLayerMm}mm</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-center">{c.spec.minPasses}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-center">{c.numLifts}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-center">{c.totalPasses}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-center">{fmtNum(c.estTimeHours, 1)}h</td>
            </tr>);
          })}</tbody></table></div>
        </div>
      )}

      {/* Testing requirements */}
      {zones.some(z => z.compactionStandard === "end_product") && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Field Testing Requirements</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50">
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Method</th>
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Standard</th>
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Description</th>
            <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Frequency</th>
          </tr></thead><tbody>{getTestingRequirements(zones.find(z => z.compactionStandard === "end_product")?.targetMDD ?? 95).map(tr => (
            <tr key={tr.method} className="hover:bg-gray-50">
              <td className="px-3 py-1.5 border-t border-gray-100 font-semibold">{tr.method}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-500">{tr.standard}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-xs">{tr.description}</td>
              <td className="px-3 py-1.5 border-t border-gray-100 text-xs">{tr.frequency}</td>
            </tr>))}</tbody></table></div>
        </div>
      )}

      <div className="text-[10px] text-gray-400 leading-relaxed space-y-1 px-1">
        <p>Compaction specifications per SHW Series 600 Table 6/1. Pass counts and layer thicknesses are minimum requirements. For end-product compaction, field density testing per BS 1377 is mandatory.</p>
        <p>References: {REGULATIONS.join("; ")}.</p>
      </div>
    </div>
  );
}
