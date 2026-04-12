// src/components/cbr-modulus-converter/CBRModulusConverterClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  powellCBRtoModulus, powellModulusToCBR,
  aashtoCBRtoModulus, aashtoModulusToCBR,
  southAfricanCBRtoModulus, southAfricanModulusToCBR,
  getSubgradeClass, SUBGRADE_CLASSES, SOIL_REFERENCES,
  generateChartData,
  type SubgradeClass,
} from "@/data/cbr-modulus-converter";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtNum(v: number, dp = 1): string { if (!Number.isFinite(v) || v <= 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }

type Direction = "cbr_to_modulus" | "modulus_to_cbr";
type Method = "powell" | "aashto" | "south_african";

const METHOD_LABELS: Record<Method, string> = {
  powell: "Powell et al (1984) - TRL/DMRB",
  aashto: "AASHTO (1993)",
  south_african: "South African Method",
};

// ─── SVG Chart Component ─────────────────────────────────────
function CBRChart({ highlightCBR }: { highlightCBR: number | null }) {
  const data = useMemo(() => generateChartData(), []);
  const W = 600; const H = 320; const pad = { top: 20, right: 30, bottom: 50, left: 65 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const maxCBR = 100; const maxMod = 800;
  const xScale = (cbr: number) => pad.left + (Math.log10(Math.max(cbr, 0.5)) / Math.log10(maxCBR)) * cW;
  const yScale = (mod: number) => pad.top + cH - (mod / maxMod) * cH;

  const makePath = (key: "powell" | "aashto" | "sa") => {
    return data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.cbr).toFixed(1)},${yScale(d[key]).toFixed(1)}`).join(" ");
  };

  const xTicks = [0.5, 1, 2, 5, 10, 20, 50, 100];
  const yTicks = [0, 100, 200, 300, 400, 500, 600, 700, 800];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 360 }}>
      <defs>
        <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f9fafb" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
      </defs>
      <rect x={pad.left} y={pad.top} width={cW} height={cH} fill="url(#gridGrad)" stroke="#e5e7eb" strokeWidth={1} rx={4} />

      {/* Subgrade class bands */}
      {SUBGRADE_CLASSES.map((sc, i) => {
        const x1 = xScale(Math.max(sc.cbrMin || 0.5, 0.5));
        const x2 = xScale(Math.min(sc.cbrMax, maxCBR));
        const colours = ["rgba(239,68,68,0.06)", "rgba(249,115,22,0.06)", "rgba(245,158,11,0.06)", "rgba(34,197,94,0.06)", "rgba(16,185,129,0.06)"];
        return <rect key={sc.id} x={x1} y={pad.top} width={Math.max(0, x2 - x1)} height={cH} fill={colours[i]} />;
      })}

      {/* Grid lines */}
      {xTicks.map(t => (<line key={`xg${t}`} x1={xScale(t)} y1={pad.top} x2={xScale(t)} y2={pad.top + cH} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3,3" />))}
      {yTicks.map(t => (<line key={`yg${t}`} x1={pad.left} y1={yScale(t)} x2={pad.left + cW} y2={yScale(t)} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3,3" />))}

      {/* Curves */}
      <path d={makePath("powell")} fill="none" stroke="#1B5745" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath("aashto")} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />
      <path d={makePath("sa")} fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2,3" />

      {/* Highlight point */}
      {highlightCBR !== null && highlightCBR > 0 && highlightCBR <= maxCBR && (
        <>
          <line x1={xScale(highlightCBR)} y1={pad.top} x2={xScale(highlightCBR)} y2={pad.top + cH} stroke="#1B5745" strokeWidth={1.5} strokeDasharray="4,2" opacity={0.6} />
          <circle cx={xScale(highlightCBR)} cy={yScale(powellCBRtoModulus(highlightCBR))} r={5} fill="#1B5745" stroke="#fff" strokeWidth={2} />
          <circle cx={xScale(highlightCBR)} cy={yScale(aashtoCBRtoModulus(highlightCBR))} r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />
          <circle cx={xScale(highlightCBR)} cy={yScale(southAfricanCBRtoModulus(highlightCBR))} r={4} fill="#dc2626" stroke="#fff" strokeWidth={2} />
        </>
      )}

      {/* Axes */}
      <line x1={pad.left} y1={pad.top + cH} x2={pad.left + cW} y2={pad.top + cH} stroke="#374151" strokeWidth={1.5} />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + cH} stroke="#374151" strokeWidth={1.5} />

      {/* X axis labels */}
      {xTicks.map(t => (
        <text key={`xl${t}`} x={xScale(t)} y={pad.top + cH + 16} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="system-ui">{t}</text>
      ))}
      <text x={pad.left + cW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui">CBR (%)</text>

      {/* Y axis labels */}
      {yTicks.map(t => (
        <text key={`yl${t}`} x={pad.left - 8} y={yScale(t) + 3} textAnchor="end" fontSize={10} fill="#6b7280" fontFamily="system-ui">{t}</text>
      ))}
      <text x={14} y={pad.top + cH / 2} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui" transform={`rotate(-90, 14, ${pad.top + cH / 2})`}>Stiffness Modulus (MPa)</text>

      {/* Legend */}
      <rect x={pad.left + 12} y={pad.top + 8} width={180} height={52} rx={6} fill="rgba(255,255,255,0.92)" stroke="#e5e7eb" strokeWidth={1} />
      {[
        { colour: "#1B5745", label: "Powell et al (1984)", dash: "" },
        { colour: "#2563eb", label: "AASHTO (1993)", dash: "6,3" },
        { colour: "#dc2626", label: "South African", dash: "2,3" },
      ].map((l, i) => (
        <g key={l.label}>
          <line x1={pad.left + 20} y1={pad.top + 22 + i * 15} x2={pad.left + 42} y2={pad.top + 22 + i * 15} stroke={l.colour} strokeWidth={2} strokeDasharray={l.dash} />
          <text x={pad.left + 48} y={pad.top + 25 + i * 15} fontSize={10} fill="#374151" fontFamily="system-ui">{l.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  inputValue: number, direction: Direction, method: Method,
  cbr: number, modulus: number, subgrade: SubgradeClass,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `CBR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Green header (FREE)
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("CBR TO STIFFNESS MODULUS CONVERSION", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | HD 26 (DMRB) / TRL Report 615 / BS EN 13286 | ${new Date().toLocaleDateString("en-GB")}`, M, 15);
  doc.text("ebrora.com", W - M - 18, 15);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
  doc.setFontSize(8);
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 40);
  drawFld("Prepared By:", header.preparedBy, M + CW / 2, y, 40);
  y += 9;

  // Conversion result box
  doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69);
  doc.roundedRect(M, y, CW, 22, 1, 1, "FD");
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
  doc.text("CONVERSION RESULT", M + 4, y + 6);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(`Input: ${direction === "cbr_to_modulus" ? `CBR = ${fmtNum(inputValue, 1)}%` : `Modulus = ${fmtNum(inputValue, 1)} MPa`}`, M + 4, y + 12);
  doc.text(`Method: ${METHOD_LABELS[method]}`, M + 4, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text(`CBR: ${fmtNum(cbr, 1)}%    |    Stiffness Modulus: ${fmtNum(modulus, 1)} MPa    |    Subgrade: ${subgrade.className} (${subgrade.label})`, M + 4, y + 22);
  y += 28; doc.setFont("helvetica", "normal");

  // All methods comparison
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Comparison Across Methods", M, y); y += 5;

  const mCols = [60, 40, 40, 46];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Method", "CBR (%)", "Modulus (MPa)", "Subgrade Class"].forEach((h, i) => {
    doc.setFillColor(27, 87, 69); doc.rect(cx, y, mCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += mCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  const methods: { label: string; cbrVal: number; modVal: number }[] = [
    { label: "Powell et al (1984)", cbrVal: direction === "cbr_to_modulus" ? cbr : powellModulusToCBR(inputValue), modVal: direction === "modulus_to_cbr" ? inputValue : powellCBRtoModulus(cbr) },
    { label: "AASHTO (1993)", cbrVal: direction === "cbr_to_modulus" ? cbr : aashtoModulusToCBR(inputValue), modVal: direction === "modulus_to_cbr" ? inputValue : aashtoCBRtoModulus(cbr) },
    { label: "South African", cbrVal: direction === "cbr_to_modulus" ? cbr : southAfricanModulusToCBR(inputValue), modVal: direction === "modulus_to_cbr" ? inputValue : southAfricanCBRtoModulus(cbr) },
  ];
  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const m of methods) {
    const sc = getSubgradeClass(m.cbrVal);
    cx = M;
    [m.label, fmtNum(m.cbrVal, 1), fmtNum(m.modVal, 1), `${sc.className} (${sc.label})`].forEach((t, i) => {
      doc.rect(cx, y, mCols[i], 5.5, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.text(t, cx + 2, y + 3.5);
      cx += mCols[i];
    });
    y += 5.5;
  }
  y += 6;

  // Subgrade classification table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("DMRB Subgrade Classification (HD 26)", M, y); y += 5;

  const sCols = [25, 20, 25, 116];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Class", "CBR (%)", "Rating", "Design Guidance"].forEach((h, i) => {
    doc.setFillColor(27, 87, 69); doc.rect(cx, y, sCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += sCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const sc of SUBGRADE_CLASSES) {
    const isCurrent = sc.id === subgrade.id;
    const guidanceLines = doc.splitTextToSize(sc.designGuidance, sCols[3] - 4);
    const rowH = Math.max(5.5, guidanceLines.length * 2.5 + 2);
    cx = M;
    [sc.className, `${sc.cbrMin}-${sc.cbrMax}`, sc.label].forEach((t, i) => {
      if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, sCols[i], rowH, "FD"); }
      else { doc.setFillColor(255, 255, 255); doc.rect(cx, y, sCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", i === 0 || isCurrent ? "bold" : "normal");
      doc.text(t, cx + 2, y + 3.5);
      cx += sCols[i];
    });
    if (isCurrent) { doc.setFillColor(232, 240, 236); doc.rect(cx, y, sCols[3], rowH, "FD"); }
    else { doc.rect(cx, y, sCols[3], rowH, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    doc.text(guidanceLines, cx + 2, y + 3.5);
    y += rowH;
  }
  y += 6;

  // Soil reference table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Common Soil Types - Typical CBR Ranges", M, y); y += 5;

  const rCols = [46, 22, 22, 22, 22, 52];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Soil Type", "CBR Low", "CBR Mid", "CBR High", "Class", "Notes"].forEach((h, i) => {
    doc.setFillColor(27, 87, 69); doc.rect(cx, y, rCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += rCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5); doc.setDrawColor(200, 200, 200);
  for (const sr of SOIL_REFERENCES) {
    if (y + 5 > 275) { newPageGreen(); }
    const sc = getSubgradeClass(sr.typicalCBRMid);
    cx = M;
    const noteLines = doc.splitTextToSize(sr.notes, rCols[5] - 4);
    const rowH = Math.max(4.5, noteLines.length * 2.2 + 1.5);
    [sr.name, `${sr.typicalCBRLow}`, `${sr.typicalCBRMid}`, `${sr.typicalCBRHigh}`, sc.className].forEach((t, i) => {
      doc.rect(cx, y, rCols[i], rowH, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.text(t, cx + 2, y + 3);
      cx += rCols[i];
    });
    doc.rect(cx, y, rCols[5], rowH, "D");
    doc.setFont("helvetica", "normal");
    doc.text(noteLines, cx + 2, y + 3);
    y += rowH;
  }
  y += 5;

  function newPageGreen() {
    doc.addPage();
    doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("CBR TO STIFFNESS MODULUS CONVERSION (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text("ebrora.com", W - M - 18, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }

  // Sign-off
  if (y + 40 > 275) newPageGreen();
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;

  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | HD 26 (DMRB) | TRL Report 615 | BS EN 13286 | IAN 73/06 | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`CBR-Modulus-Conversion-${docRef}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function CBRModulusConverterClient() {
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  const [direction, setDirection] = useState<Direction>("cbr_to_modulus");
  const [method, setMethod] = useState<Method>("powell");
  const [inputValue, setInputValue] = useState<number | null>(null);

  const result = useMemo(() => {
    if (!inputValue || inputValue <= 0) return null;
    let cbr = 0, modulus = 0;
    if (direction === "cbr_to_modulus") {
      cbr = inputValue;
      if (method === "powell") modulus = powellCBRtoModulus(cbr);
      else if (method === "aashto") modulus = aashtoCBRtoModulus(cbr);
      else modulus = southAfricanCBRtoModulus(cbr);
    } else {
      modulus = inputValue;
      if (method === "powell") cbr = powellModulusToCBR(modulus);
      else if (method === "aashto") cbr = aashtoModulusToCBR(modulus);
      else cbr = southAfricanModulusToCBR(modulus);
    }
    const subgrade = getSubgradeClass(cbr);
    const allMethods = {
      powell: direction === "cbr_to_modulus" ? powellCBRtoModulus(inputValue) : powellModulusToCBR(inputValue),
      aashto: direction === "cbr_to_modulus" ? aashtoCBRtoModulus(inputValue) : aashtoModulusToCBR(inputValue),
      south_african: direction === "cbr_to_modulus" ? southAfricanCBRtoModulus(inputValue) : southAfricanModulusToCBR(inputValue),
    };
    return { cbr, modulus, subgrade, allMethods };
  }, [inputValue, direction, method]);

  const hasData = result !== null;
  const sc = result?.subgrade;
  const scColour = sc ? SUBGRADE_CLASSES.find(s => s.id === sc.id) : null;

  const handleExport = useCallback(async () => {
    if (!result || !inputValue) return;
    setExporting(true);
    try {
      await exportPDF({ site, manager, preparedBy, date }, inputValue, direction, method, result.cbr, result.modulus, result.subgrade);
    } finally { setExporting(false); }
  }, [result, inputValue, site, manager, preparedBy, date, direction, method]);

  const clearAll = useCallback(() => {
    setSite(""); setManager(""); setPreparedBy(""); setDate(todayISO());
    setInputValue(null); setDirection("cbr_to_modulus"); setMethod("powell");
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3.5 ${scColour ? scColour.colour : "bg-gray-50 border-gray-200 text-gray-500"}`}>
          <div className="text-[11px] font-semibold uppercase tracking-wide">Subgrade Class</div>
          <div className="text-lg font-bold mt-1">{sc ? `${sc.className} - ${sc.label}` : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-emerald-50 border-emerald-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">CBR</div>
          <div className="text-xl font-bold mt-1 text-emerald-800">{result ? `${fmtNum(result.cbr, 1)}%` : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-blue-50 border-blue-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Stiffness Modulus</div>
          <div className="text-xl font-bold mt-1 text-blue-800">{result ? `${fmtNum(result.modulus, 1)} MPa` : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Method</div>
          <div className="text-sm font-bold mt-1 text-gray-800 leading-tight">{METHOD_LABELS[method]}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </div>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Site", value: site, set: setSite },
              { label: "Site Manager", value: manager, set: setManager },
              { label: "Prepared By", value: preparedBy, set: setPreparedBy },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Input section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setDirection("cbr_to_modulus")} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${direction === "cbr_to_modulus" ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>CBR → Modulus</button>
          <button onClick={() => setDirection("modulus_to_cbr")} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${direction === "modulus_to_cbr" ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>Modulus → CBR</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {direction === "cbr_to_modulus" ? "CBR Value (%)" : "Stiffness Modulus (MPa)"}
            </label>
            <input type="number" step="0.1" min="0.1" max={direction === "cbr_to_modulus" ? 100 : 1000} value={inputValue ?? ""} onChange={e => setInputValue(e.target.value ? Number(e.target.value) : null)} placeholder={direction === "cbr_to_modulus" ? "e.g. 5" : "e.g. 50"} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Conversion Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as Method)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
              <option value="powell">Powell et al (1984) - TRL/DMRB</option>
              <option value="aashto">AASHTO (1993)</option>
              <option value="south_african">South African Method</option>
            </select>
          </div>
        </div>

        {/* All methods comparison */}
        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">All Methods Comparison</div>
            <div className="grid grid-cols-3 gap-2">
              {(["powell", "aashto", "south_african"] as Method[]).map(m => {
                const val = result.allMethods[m];
                const isActive = m === method;
                return (
                  <div key={m} className={`rounded-lg border p-2 text-center ${isActive ? "bg-ebrora-light border-ebrora/30" : "bg-white border-gray-200"}`}>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase">{m === "powell" ? "Powell" : m === "aashto" ? "AASHTO" : "SA"}</div>
                    <div className="text-base font-bold text-gray-800">{fmtNum(val, 1)}</div>
                    <div className="text-[10px] text-gray-400">{direction === "cbr_to_modulus" ? "MPa" : "%"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">CBR vs Stiffness Modulus Curve</h3>
        <CBRChart highlightCBR={result?.cbr ?? null} />
      </div>

      {/* Subgrade class + design guidance */}
      {result && (
        <div className={`rounded-xl border p-4 ${scColour?.colour || "bg-gray-50 border-gray-200"}`}>
          <h3 className="text-sm font-bold mb-2">{result.subgrade.className}: {result.subgrade.label} (CBR {result.subgrade.cbrMin}-{result.subgrade.cbrMax}%)</h3>
          <p className="text-sm leading-relaxed">{result.subgrade.designGuidance}</p>
        </div>
      )}

      {/* DMRB classification reference */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">DMRB Subgrade Classification (HD 26)</h3>
        <div className="space-y-1.5">
          {SUBGRADE_CLASSES.map(sc2 => (
            <div key={sc2.id} className={`rounded-lg border p-2.5 ${result?.subgrade.id === sc2.id ? sc2.colour + " ring-2 ring-offset-1 ring-ebrora/30" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{sc2.className}: {sc2.label}</span>
                <span className="text-xs text-gray-500">CBR {sc2.cbrMin}-{sc2.cbrMax}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{sc2.designGuidance}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Soil reference table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Common Soil Types - Typical CBR Ranges</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-[10px] font-semibold text-gray-500 uppercase">Soil Type</th>
                <th className="text-center py-2 text-[10px] font-semibold text-gray-500 uppercase">CBR Range</th>
                <th className="text-center py-2 text-[10px] font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-left py-2 text-[10px] font-semibold text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SOIL_REFERENCES.map((sr, i) => {
                const srClass = getSubgradeClass(sr.typicalCBRMid);
                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-2 py-1.5 font-medium text-gray-800">{sr.name}</td>
                    <td className="px-2 py-1.5 text-center">{sr.typicalCBRLow}-{sr.typicalCBRHigh}%</td>
                    <td className="px-2 py-1.5 text-center font-semibold">{srClass.className}</td>
                    <td className="px-2 py-1.5 text-gray-500">{sr.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Conversion methods: Powell et al (1984) E = 17.6 x CBR^0.64 (MPa) per TRL Report 615 / DMRB HD 26; AASHTO (1993) MR = 1500 x CBR (psi); South African method E = 10 x CBR for CBR less than 5, E = 17.6 x CBR^0.64 for CBR 5 or greater. Subgrade classification per HD 26 (DMRB Volume 7, Section 2, Part 2).</p>
        <p>This tool provides indicative conversions based on published empirical relationships. Actual stiffness modulus depends on soil type, moisture content, stress state, and in-situ conditions. Laboratory testing (CBR per BS 1377, FWD testing, or plate bearing tests) should be used for design purposes.</p>
      </div>
    </div>
  );
}
