// src/components/formwork-pressure-calculator/FormworkPressureCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  CONCRETE_TYPES, FORMWORK_FINISHES, calculateFormworkPressure,
} from "@/data/formwork-pressure-calculator";
import type { ConcreteType, FormworkFinish, FormworkResult, PressurePoint } from "@/data/formwork-pressure-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Pressure vs Depth Chart ─────────────────────────────
function PressureProfileChart({ profile, maxCIRIA, maxHydro, maxDIN }: { profile: PressurePoint[]; maxCIRIA: number; maxHydro: number; maxDIN: number }) {
  if (profile.length < 2) return null;
  const W = 600, H = 300, PAD = { top: 20, right: 20, bottom: 35, left: 55 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const maxDepth = profile[profile.length - 1].depth;
  const maxP = Math.max(maxHydro, maxCIRIA, maxDIN) * 1.1;

  // Note: depth goes DOWN (top=0), pressure goes RIGHT
  const xS = (p: number) => PAD.left + (p / maxP) * cw;
  const yS = (d: number) => PAD.top + (d / maxDepth) * ch;

  const hydroLine = profile.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.hydroP).toFixed(1)},${yS(p.depth).toFixed(1)}`).join(" ");
  const ciriaLine = profile.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.ciriaP).toFixed(1)},${yS(p.depth).toFixed(1)}`).join(" ");
  const dinLine = profile.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.dinP).toFixed(1)},${yS(p.depth).toFixed(1)}`).join(" ");

  // Shaded area between hydrostatic and CIRIA (the saving)
  const savingArea = ciriaLine + " " + [...profile].reverse().map((p, i) => `${i === 0 ? "L" : "L"}${xS(p.hydroP).toFixed(1)},${yS(p.depth).toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
      {/* Grid */}
      {[0, 50, 100, 150, 200, 250, 300, 350, 400].filter(v => v <= maxP).map(v => (
        <g key={v}><line x1={xS(v)} y1={PAD.top} x2={xS(v)} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={xS(v)} y={PAD.top - 5} textAnchor="middle" fontSize={8} fill="#9CA3AF">{v}</text></g>
      ))}
      {/* Depth labels */}
      {Array.from({ length: Math.ceil(maxDepth) + 1 }, (_, i) => i).filter(d => d <= maxDepth).map(d => (
        <text key={d} x={PAD.left - 6} y={yS(d) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{d}m</text>
      ))}
      {/* Saving area */}
      <path d={savingArea} fill="rgba(34,197,94,0.1)" />
      {/* Lines */}
      <path d={hydroLine} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="6,3" />
      <path d={ciriaLine} fill="none" stroke="#3B82F6" strokeWidth={2.5} />
      <path d={dinLine} fill="none" stroke="#F97316" strokeWidth={2} strokeDasharray="4,2" />
      {/* Legend */}
      <line x1={W - PAD.right - 160} y1={PAD.top + 5} x2={W - PAD.right - 140} y2={PAD.top + 5} stroke="#3B82F6" strokeWidth={2.5} />
      <text x={W - PAD.right - 136} y={PAD.top + 8} fontSize={9} fill="#6B7280">CIRIA R108</text>
      <line x1={W - PAD.right - 160} y1={PAD.top + 18} x2={W - PAD.right - 140} y2={PAD.top + 18} stroke="#F97316" strokeWidth={2} strokeDasharray="4,2" />
      <text x={W - PAD.right - 136} y={PAD.top + 21} fontSize={9} fill="#6B7280">DIN 18218</text>
      <line x1={W - PAD.right - 160} y1={PAD.top + 31} x2={W - PAD.right - 140} y2={PAD.top + 31} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="6,3" />
      <text x={W - PAD.right - 136} y={PAD.top + 34} fontSize={9} fill="#6B7280">Hydrostatic</text>
      {/* Labels */}
      <text x={W / 2} y={PAD.top - 12} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151">Lateral Pressure (kN/m2)</text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151" transform={`rotate(-90, 12, ${H / 2})`}>Depth (m)</text>
    </svg>
  );
}

// ─── SVG Sensitivity Chart (generic) ─────────────────────────
function SensitivityChart({ data, xLabel, yLabel, colour }: { data: { x: number; y: number }[]; xLabel: string; yLabel: string; colour: string }) {
  if (data.length < 2) return null;
  const W = 400, H = 160, PAD = { top: 15, right: 15, bottom: 30, left: 50 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const minX = data[0].x, maxX = data[data.length - 1].x;
  const maxY = Math.max(...data.map(d => d.y)) * 1.1;
  const xS = (v: number) => PAD.left + ((v - minX) / (maxX - minX)) * cw;
  const yS = (v: number) => PAD.top + ch - (v / maxY) * ch;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(d.x).toFixed(1)},${yS(d.y).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
      {data.filter((_, i) => i % 2 === 0).map(d => (
        <text key={d.x} x={xS(d.x)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{d.x}</text>
      ))}
      <path d={line} fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
      {data.filter((_, i) => i % 3 === 0).map((d, idx) => (
        <circle key={idx} cx={xS(d.x)} cy={yS(d.y)} r={3} fill={colour} />
      ))}
      <text x={PAD.left - 8} y={PAD.top - 3} fontSize={9} fontWeight={600} fill="#6B7280">{yLabel}</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#6B7280">{xLabel}</text>
    </svg>
  );
}

// ─── PDF Export (PAID) ───────────────────────────────────────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  inputs: { pourRate: number; temperature: number; headHeight: number; concreteType: ConcreteType; formworkFinish: FormworkFinish; vibrated: boolean; tieCapacity: number },
  result: FormworkResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `FLP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("FORMWORK LATERAL PRESSURE ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("CIRIA Report 108 / DIN 18218:2010 / BS 5975:2019 / BS EN 13670", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 30, 1, 1, "FD"); doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Site:", header.site, M + halfW, y, 40); y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 50);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40); y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Pour Rate:", `${inputs.pourRate} m/hr`, M + halfW, y, 0); y += 5;
  drawFld("Temperature:", `${inputs.temperature}C`, M + 3, y, 0);
  drawFld("Head Height:", `${inputs.headHeight}m`, M + halfW, y, 0); y += 5;
  const ctData = CONCRETE_TYPES.find(c => c.type === inputs.concreteType)!;
  drawFld("Concrete:", ctData.label, M + 3, y, 0);
  drawFld("Vibrated:", inputs.vibrated ? "Yes" : "No", M + halfW, y, 0);
  y += 8;

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("FORMWORK LATERAL PRESSURE (continued)", M, 7);
      doc.text(`${docRef}`, W - M - 40, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Results (coloured panel)
  checkPage(45);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 38, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Pressure Results", M + 4, y + 2); y += 6;
  const resultItems: [string, string, number[]][] = [
    ["CIRIA R108 Max Pressure", `${result.maxPressureCIRIA} kN/m2`, [59, 130, 246]],
    ["DIN 18218 Max Pressure", `${result.maxPressureDIN} kN/m2`, [100, 116, 139]],
    ["Full Hydrostatic Pressure", `${result.maxPressureHydro} kN/m2`, [234, 88, 12]],
    ["Effective Head (CIRIA)", `${result.effectiveHead}m`, [17, 24, 39]],
    ["Saving vs Hydrostatic", `${result.savingPercent}%`, [22, 163, 74]],
    ["Tie Spacing (H x V)", `${result.tieSpacing.hSpacing}m x ${result.tieSpacing.vSpacing}m`, [17, 24, 39]],
    ["Ties per m2", `${result.tieSpacing.tiesPerM2}`, [17, 24, 39]],
    ["Tie Capacity Used", `${inputs.tieCapacity} kN`, [17, 24, 39]],
  ];
  resultItems.forEach(([l, v, c]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(l + ":", M + 4, y);
    doc.setTextColor(c[0], c[1], c[2]); doc.setFont("helvetica", "bold");
    doc.text(v, M + 64, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 5;

  // Pressure vs Depth Chart
  checkPage(70);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Lateral Pressure vs Depth", M, y);
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("CIRIA R108 bilinear envelope (blue) vs full hydrostatic (orange). Difference shows formwork design saving.", M, y + 4);
  doc.setTextColor(0, 0, 0); y += 8;

  {
    const chartX = M + 15, chartY3 = y, chartW3 = 70, chartH3 = 50;
    const maxP = result.maxPressureHydro * 1.1;
    const maxD = inputs.headHeight;

    // Background
    doc.setFillColor(252, 252, 253); doc.rect(chartX, chartY3, chartW3, chartH3, "F");

    // Grid
    doc.setDrawColor(220, 220, 220); doc.setFontSize(4.5); doc.setTextColor(130, 130, 130);
    for (let p = 0; p <= maxP; p += Math.ceil(maxP / 5)) {
      const xp = chartX + (p / maxP) * chartW3;
      doc.line(xp, chartY3, xp, chartY3 + chartH3);
      doc.text(`${Math.round(p)}`, xp - 2, chartY3 + chartH3 + 3.5);
    }
    for (let d = 0; d <= maxD; d += Math.max(0.5, Math.ceil(maxD / 5))) {
      const yp = chartY3 + (d / maxD) * chartH3;
      doc.line(chartX, yp, chartX + chartW3, yp);
      doc.text(`${d.toFixed(1)}m`, chartX - 10, yp + 1.5);
    }

    // Hydrostatic line (orange)
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.5);
    doc.line(chartX, chartY3, chartX + (result.maxPressureHydro / maxP) * chartW3, chartY3 + chartH3);

    // CIRIA line (blue bilinear)
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.6);
    const effDepth = Math.min(result.effectiveHead, maxD);
    const ciriaX = chartX + (result.maxPressureCIRIA / maxP) * chartW3;
    const effY = chartY3 + (effDepth / maxD) * chartH3;
    doc.line(chartX, chartY3, ciriaX, effY); // hydrostatic portion
    doc.line(ciriaX, effY, ciriaX, chartY3 + chartH3); // constant portion

    // Saving area fill (simplified)
    doc.setFillColor(220, 252, 231);
    // Triangle approximation of saving area
    const hydroEndX = chartX + (result.maxPressureHydro / maxP) * chartW3;
    const botY = chartY3 + chartH3;
    // small green indicator at bottom right
    doc.setFontSize(6); doc.setTextColor(22, 163, 74); doc.setFont("helvetica", "bold");
    doc.text(`${result.savingPercent}% saving`, ciriaX + 3, botY - 3);

    // Labels
    doc.setTextColor(80, 80, 80); doc.setFontSize(5);
    doc.text("Pressure (kN/m2)", chartX + chartW3 / 2 - 10, chartY3 + chartH3 + 7);
    doc.text("Depth", chartX - 12, chartY3 - 2);

    // Legend
    const legX = chartX + chartW3 + 10, legY2 = chartY3 + 5;
    doc.setFillColor(59, 130, 246); doc.rect(legX, legY2, 5, 2, "F");
    doc.setFontSize(5); doc.setTextColor(80, 80, 80); doc.text("CIRIA R108", legX + 7, legY2 + 1.8);
    doc.setFillColor(234, 88, 12); doc.rect(legX, legY2 + 5, 5, 2, "F");
    doc.text("Hydrostatic", legX + 7, legY2 + 6.8);

    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = chartY3 + chartH3 + 12;
  }

  // Recommendations
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => { checkPage(6); const lines = doc.splitTextToSize(`- ${rec}`, CW - 4); doc.text(lines, M + 2, y); y += lines.length * 3.5; });

  // Sign-off
  checkPage(50); y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5); y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Formwork pressure per CIRIA Report 108 and DIN 18218:2010. This is a screening tool -- it does not replace a structural design by a competent temporary works engineer.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`formwork-pressure-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function FormworkPressureCalculatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [pourRate, setPourRate] = useState<number>(2);
  const [temperature, setTemperature] = useState<number>(15);
  const [headHeight, setHeadHeight] = useState<number>(4);
  const [concreteType, setConcreteType] = useState<ConcreteType>("opc");
  const [formworkFinish, setFormworkFinish] = useState<FormworkFinish>("plywood");
  const [vibrated, setVibrated] = useState(true);
  const [tieCapacity, setTieCapacity] = useState<number>(90);

  const inputs = { pourRate, temperature, headHeight, concreteType, formworkFinish, vibrated, tieCapacity };
  const result = useMemo(() => calculateFormworkPressure(inputs), [pourRate, temperature, headHeight, concreteType, formworkFinish, vibrated, tieCapacity]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, inputs, result); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, inputs, result]);

  const clearAll = useCallback(() => {
    setPourRate(2); setTemperature(15); setHeadHeight(4); setConcreteType("opc");
    setFormworkFinish("plywood"); setVibrated(true); setTieCapacity(90);
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "CIRIA R108 Max", value: `${result.maxPressureCIRIA} kN/m2`, sub: `Effective head: ${result.effectiveHead}m`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "DIN 18218 Max", value: `${result.maxPressureDIN} kN/m2`, sub: "For comparison", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Saving vs Hydrostatic", value: `${result.savingPercent}%`, sub: `Hydrostatic: ${result.maxPressureHydro} kN/m2`, bgClass: result.savingPercent > 10 ? "bg-emerald-50" : "bg-amber-50", textClass: result.savingPercent > 10 ? "text-emerald-800" : "text-amber-800", borderClass: result.savingPercent > 10 ? "border-emerald-200" : "border-amber-200", dotClass: result.savingPercent > 10 ? "bg-emerald-500" : "bg-amber-500" },
          { label: "Tie Spacing", value: `${result.tieSpacing.hSpacing}m`, sub: `${result.tieSpacing.tiesPerM2} ties/m2 @ ${tieCapacity} kN`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={true}>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40">
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
        <h3 className="text-sm font-bold text-gray-700">Pour Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pour Rate (m/hr)</label>
            <input type="number" value={pourRate} onChange={e => setPourRate(Math.max(0.1, parseFloat(e.target.value) || 1))} step={0.5} min={0.1} max={10}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Concrete Temperature (C)</label>
            <input type="number" value={temperature} onChange={e => setTemperature(Math.max(0, parseInt(e.target.value) || 15))} min={0} max={40}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Pour Height (m)</label>
            <input type="number" value={headHeight} onChange={e => setHeadHeight(Math.max(0.5, parseFloat(e.target.value) || 3))} step={0.5} min={0.5} max={20}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Concrete Type</label>
            <select value={concreteType} onChange={e => setConcreteType(e.target.value as ConcreteType)}
              className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {CONCRETE_TYPES.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Formwork Finish</label>
            <select value={formworkFinish} onChange={e => setFormworkFinish(e.target.value as FormworkFinish)}
              className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {FORMWORK_FINISHES.map(f => <option key={f.finish} value={f.finish}>{f.label}</option>)}
            </select></div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Options</label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <button onClick={() => setVibrated(!vibrated)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${vibrated ? "bg-ebrora" : "bg-gray-300"}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${vibrated ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>Vibrated
            </label>
            <div><label className="block text-[10px] text-gray-400 mb-1">Tie Capacity (kN)</label>
              <input type="number" value={tieCapacity} onChange={e => setTieCapacity(Math.max(10, parseInt(e.target.value) || 90))} min={10} max={200}
                className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" /></div>
          </div>
        </div>
      </div>

      {/* Pressure Profile Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Lateral Pressure vs Depth</h3>
        <p className="text-[11px] text-gray-400">Blue = CIRIA R108 bilinear envelope. Orange dashed = DIN 18218. Grey dashed = full hydrostatic. Green shaded area = saving.</p>
        <PressureProfileChart profile={result.pressureProfile} maxCIRIA={result.maxPressureCIRIA} maxHydro={result.maxPressureHydro} maxDIN={result.maxPressureDIN} />
      </div>

      {/* Sensitivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Pour Rate Sensitivity</h3>
          <p className="text-[11px] text-gray-400">How max pressure changes with pour rate at {temperature}C</p>
          <SensitivityChart data={result.pourRateSensitivity.map(d => ({ x: d.rate, y: d.pressure }))} xLabel="Pour Rate (m/hr)" yLabel="kN/m2" colour="#3B82F6" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Temperature Sensitivity</h3>
          <p className="text-[11px] text-gray-400">How max pressure changes with temperature at {pourRate} m/hr</p>
          <SensitivityChart data={result.tempSensitivity.map(d => ({ x: d.temp, y: d.pressure }))} xLabel="Temperature (C)" yLabel="kN/m2" colour="#F97316" />
        </div>
      </div>

      {/* Tie Spacing */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Tie Spacing at Zone of Maximum Pressure</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3"><div className="text-[11px] font-semibold text-gray-500 uppercase">Horizontal</div><div className="text-lg font-bold text-gray-800">{result.tieSpacing.hSpacing}m</div></div>
          <div className="bg-gray-50 rounded-lg p-3"><div className="text-[11px] font-semibold text-gray-500 uppercase">Vertical</div><div className="text-lg font-bold text-gray-800">{result.tieSpacing.vSpacing}m</div></div>
          <div className="bg-gray-50 rounded-lg p-3"><div className="text-[11px] font-semibold text-gray-500 uppercase">Ties/m2</div><div className="text-lg font-bold text-gray-800">{result.tieSpacing.tiesPerM2}</div></div>
        </div>
        <p className="text-[11px] text-gray-400">Based on {tieCapacity} kN tie capacity against {result.maxPressureCIRIA} kN/m2 max pressure (CIRIA R108).</p>
      </div>

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
          Based on CIRIA Report 108 (Concrete pressure on formwork) and DIN 18218:2010 for comparison.
          This is a screening tool - it does not replace a structural design calculation by a competent temporary works engineer.
        </p>
      </div>
    </div>
  );
}
