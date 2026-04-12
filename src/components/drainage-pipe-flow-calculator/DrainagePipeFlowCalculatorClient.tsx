// src/components/drainage-pipe-flow-calculator/DrainagePipeFlowCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PIPE_MATERIALS, PIPE_SIZES, PROPORTIONAL_DEPTHS,
  colebrookWhiteVelocity, colebrookWhitePartialVelocity,
  manningVelocity, manningPartialVelocity,
  fullBoreArea, wettedArea, flowRate, runDesignChecks,
  type PipeMaterial, type CalcMethod, type ProportionalResult, type DesignCheck,
} from "@/data/drainage-pipe-flow-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtNum(v: number, dp = 2): string { if (!Number.isFinite(v) || v <= 0) return "--"; return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }

// ─── Pipe Cross-Section SVG ──────────────────────────────────
function PipeCrossSection({ diameterMM, fillRatio }: { diameterMM: number; fillRatio: number }) {
  const W = 260; const H = 260; const cx = W / 2; const cy = H / 2; const r = 100;
  const fill = Math.max(0, Math.min(1, fillRatio));
  const waterY = cy + r - fill * 2 * r;

  // Clip path for water level
  const theta = fill > 0 && fill < 1 ? 2 * Math.acos(1 - 2 * fill) : (fill >= 1 ? 2 * Math.PI : 0);
  const halfChord = fill > 0 && fill < 1 ? r * Math.sin(theta / 2) : (fill >= 1 ? 0 : 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 280 }}>
      <defs>
        <clipPath id="pipeClip"><circle cx={cx} cy={cy} r={r - 1} /></clipPath>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id="pipeWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>

      {/* Pipe wall */}
      <circle cx={cx} cy={cy} r={r + 8} fill="url(#pipeWall)" />
      <circle cx={cx} cy={cy} r={r} fill="#f9fafb" stroke="#d1d5db" strokeWidth={1} />

      {/* Water fill */}
      {fill > 0 && (
        <rect x={cx - r} y={waterY} width={r * 2} height={cy + r - waterY} fill="url(#waterGrad)" clipPath="url(#pipeClip)" />
      )}

      {/* Water surface line */}
      {fill > 0 && fill < 1 && (
        <line x1={cx - halfChord} y1={waterY} x2={cx + halfChord} y2={waterY} stroke="#2563eb" strokeWidth={2} strokeDasharray="4,2" clipPath="url(#pipeClip)" />
      )}

      {/* Diameter line */}
      <line x1={cx - r - 18} y1={cy} x2={cx - r - 18} y2={cy} stroke="#374151" strokeWidth={1} />
      <line x1={cx - r - 22} y1={cy - r} x2={cx - r - 14} y2={cy - r} stroke="#374151" strokeWidth={1} />
      <line x1={cx - r - 22} y1={cy + r} x2={cx - r - 14} y2={cy + r} stroke="#374151" strokeWidth={1} />
      <line x1={cx - r - 18} y1={cy - r} x2={cx - r - 18} y2={cy + r} stroke="#374151" strokeWidth={1} markerStart="url(#arrowUp)" />
      <text x={cx - r - 32} y={cy + 4} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600} fontFamily="system-ui" transform={`rotate(-90, ${cx - r - 32}, ${cy})`}>{diameterMM}mm</text>

      {/* Water depth annotation */}
      {fill > 0 && fill < 1 && (
        <>
          <line x1={cx + r + 14} y1={waterY} x2={cx + r + 14} y2={cy + r} stroke="#2563eb" strokeWidth={1} />
          <line x1={cx + r + 10} y1={waterY} x2={cx + r + 18} y2={waterY} stroke="#2563eb" strokeWidth={1} />
          <line x1={cx + r + 10} y1={cy + r} x2={cx + r + 18} y2={cy + r} stroke="#2563eb" strokeWidth={1} />
          <text x={cx + r + 28} y={(waterY + cy + r) / 2 + 4} textAnchor="start" fontSize={10} fill="#2563eb" fontWeight={600} fontFamily="system-ui">{Math.round(fill * diameterMM)}mm</text>
          <text x={cx + r + 28} y={(waterY + cy + r) / 2 + 16} textAnchor="start" fontSize={9} fill="#6b7280" fontFamily="system-ui">({Math.round(fill * 100)}% full)</text>
        </>
      )}
      {fill >= 1 && (
        <text x={cx + r + 20} y={cy + 4} textAnchor="start" fontSize={11} fill="#2563eb" fontWeight={700} fontFamily="system-ui">FULL BORE</text>
      )}

      {/* Centre mark */}
      <circle cx={cx} cy={cy} r={2} fill="#9ca3af" />
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; designedBy: string; date: string },
  diameterMM: number, material: PipeMaterial, gradientOneInX: number, method: CalcMethod,
  fullV: number, fullQ: number, proportional: ProportionalResult[], checks: DesignCheck[],
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `DPF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const gradient = 1 / gradientOneInX;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("DRAINAGE / PIPE FLOW CALCULATION (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("DRAINAGE / PIPE FLOW CALCULATION", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | BS EN 752 / Bldg Regs Part H / SfA | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 19, 1, 1, "FD"); doc.setFontSize(8);
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
  y += 5;
  drawFld("Designed By:", header.designedBy, M + 3, y, 50);
  y += 9;

  // Pipe spec summary
  doc.setFillColor(232, 245, 255); doc.setDrawColor(59, 130, 246);
  doc.roundedRect(M, y, CW, 18, 1, 1, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 64, 175);
  doc.text("PIPE SPECIFICATION", M + 4, y + 5);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(`Diameter: ${diameterMM}mm | Material: ${material.name} | Gradient: 1:${gradientOneInX} (${(gradient * 100).toFixed(3)}%)`, M + 4, y + 11);
  doc.text(`Roughness (ks): ${material.ks}mm | Manning's n: ${material.manningN} | Method: ${method === "colebrook_white" ? "Colebrook-White" : "Manning's"}`, M + 4, y + 16);
  y += 24; doc.setTextColor(0, 0, 0);

  // Full bore results
  doc.setFillColor(34, 197, 94); doc.roundedRect(M, y, CW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`FULL BORE: V = ${fullV.toFixed(2)} m/s | Q = ${fullQ.toFixed(2)} l/s`, M + 4, y + 5.5);
  doc.setTextColor(0, 0, 0); y += 13;

  // Proportional flow table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Proportional Flow at Varying Depths", M, y); y += 5;

  const pCols = [30, 28, 32, 32, 32, 32];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Depth (d/D)", "Depth (mm)", "Area (m2)", "Velocity (m/s)", "Flow (l/s)", "% Full Bore"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, pCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += pCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const p of proportional) {
    const pctFlow = fullQ > 0 ? (p.flowLPS / fullQ * 100) : 0;
    cx = M;
    [p.depthLabel, `${p.depthMM}`, fmtNum(p.areaM2, 4), fmtNum(p.velocity, 3), fmtNum(p.flowLPS, 2), `${pctFlow.toFixed(1)}%`].forEach((t, i) => {
      doc.rect(cx, y, pCols[i], 5.5, "D");
      doc.setFont("helvetica", "normal");
      doc.text(t, cx + 2, y + 3.5);
      cx += pCols[i];
    });
    y += 5.5;
  }
  y += 6;

  // Design checks
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Design Checks", M, y); y += 5;

  for (const ch of checks) {
    checkPage(8);
    const [cr, cg, cb] = ch.pass ? [34, 197, 94] : [239, 68, 68];
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(M, y, 4, 5, 0.5, 0.5, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(ch.pass ? "PASS" : "FAIL", M + 6, y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(`${ch.label}: ${ch.value} (${ch.threshold})`, M + 18, y + 3.5);
    doc.setFontSize(5.5); doc.setTextColor(120, 120, 120);
    doc.text(ch.regulation, M + 18, y + 7);
    doc.setTextColor(0, 0, 0);
    y += 9;
  }
  y += 5;

  // Sign-off
  checkPage(45);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;
  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7); doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Designed By", M + 3, y + 5); doc.text("Approved By", M + soW + 7, y + 5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | BS EN 752 | Building Regs Part H | Sewers for Adoption | Colebrook-White / Manning | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`Pipe-Flow-Calculation-${docRef}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function DrainagePipeFlowCalculatorClient() {
  const [showSettings, setShowSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [designedBy, setDesignedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  const [diameterMM, setDiameterMM] = useState(150);
  const [materialId, setMaterialId] = useState("upvc");
  const [gradientOneInX, setGradientOneInX] = useState<number | null>(80);
  const [method, setMethod] = useState<CalcMethod>("colebrook_white");
  const [viewDepth, setViewDepth] = useState(0.5); // for cross-section display

  const material = PIPE_MATERIALS.find(m => m.id === materialId) || PIPE_MATERIALS[1];
  const gradient = gradientOneInX && gradientOneInX > 0 ? 1 / gradientOneInX : 0;

  const { fullV, fullQ, proportional, checks } = useMemo(() => {
    if (gradient <= 0) return { fullV: 0, fullQ: 0, proportional: [], checks: [] };

    const fV = method === "colebrook_white"
      ? colebrookWhiteVelocity(diameterMM, gradient, material.ks)
      : manningVelocity(diameterMM, gradient, material.manningN);
    const fA = fullBoreArea(diameterMM);
    const fQ = flowRate(fV, fA);

    const prop: ProportionalResult[] = PROPORTIONAL_DEPTHS.map(dOverD => {
      const v = method === "colebrook_white"
        ? colebrookWhitePartialVelocity(diameterMM, gradient, material.ks, dOverD)
        : manningPartialVelocity(diameterMM, gradient, material.manningN, dOverD);
      const a = wettedArea(diameterMM / 1000, dOverD);
      const q = flowRate(v, a);
      const label = dOverD === 0.333 ? "1/3" : dOverD === 1.0 ? "Full" : `${Math.round(dOverD * 100)}%`;
      return { depthRatio: dOverD, depthLabel: label, depthMM: Math.round(dOverD * diameterMM), velocity: v, flowLPS: q, areaM2: a };
    });

    const v1_3 = method === "colebrook_white"
      ? colebrookWhitePartialVelocity(diameterMM, gradient, material.ks, 0.333)
      : manningPartialVelocity(diameterMM, gradient, material.manningN, 0.333);

    const ch = runDesignChecks(diameterMM, gradient, fV, v1_3);

    return { fullV: fV, fullQ: fQ, proportional: prop, checks: ch };
  }, [diameterMM, gradient, material, method]);

  const hasData = fullV > 0;
  const allPass = checks.every(c => c.pass);

  const handleExport = useCallback(async () => {
    if (!hasData || !gradientOneInX) return;
    setExporting(true);
    try {
      await exportPDF({ company, site, manager, designedBy, date }, diameterMM, material, gradientOneInX, method, fullV, fullQ, proportional, checks);
    } finally { setExporting(false); }
  }, [hasData, company, site, manager, designedBy, date, diameterMM, material, gradientOneInX, method, fullV, fullQ, proportional, checks]);

  const clearAll = useCallback(() => {
    setCompany(""); setSite(""); setManager(""); setDesignedBy(""); setDate(todayISO());
    setDiameterMM(150); setMaterialId("upvc"); setGradientOneInX(80); setMethod("colebrook_white"); setViewDepth(0.5);
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border p-3.5 bg-blue-50 border-blue-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Full Bore Velocity</div>
          <div className="text-xl font-bold mt-1 text-blue-800">{hasData ? `${fmtNum(fullV, 2)} m/s` : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-emerald-50 border-emerald-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Full Bore Flow</div>
          <div className="text-xl font-bold mt-1 text-emerald-800">{hasData ? `${fmtNum(fullQ, 2)} l/s` : "--"}</div>
        </div>
        <div className={`rounded-xl border p-3.5 ${hasData ? (allPass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : "bg-gray-50 border-gray-200"}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-wide ${hasData ? (allPass ? "text-green-700" : "text-red-700") : "text-gray-500"}`}>Design Checks</div>
          <div className={`text-lg font-bold mt-1 ${hasData ? (allPass ? "text-green-800" : "text-red-800") : "text-gray-400"}`}>{hasData ? (allPass ? "ALL PASS" : "FAIL") : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pipe</div>
          <div className="text-lg font-bold mt-1 text-gray-800">{diameterMM}mm</div>
          <div className="text-[10px] text-gray-400">{material.name} | 1:{gradientOneInX || "--"}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <PaidDownloadButton hasData={hasData}>
            <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </PaidDownloadButton>
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
              { label: "Company", value: company, set: setCompany },
              { label: "Site", value: site, set: setSite },
              { label: "Site Manager", value: manager, set: setManager },
              { label: "Designed By", value: designedBy, set: setDesignedBy },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Pipe input */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pipe Diameter (mm)</label>
            <select value={diameterMM} onChange={e => setDiameterMM(Number(e.target.value))} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
              {PIPE_SIZES.map(s => <option key={s} value={s}>{s}mm</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pipe Material</label>
            <select value={materialId} onChange={e => setMaterialId(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
              {PIPE_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name} (ks={m.ks}mm)</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Gradient (1:X)</label>
            <input type="number" step="1" min="1" max="1000" value={gradientOneInX ?? ""} onChange={e => setGradientOneInX(e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 80" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors" />
            {gradient > 0 && <div className="text-[10px] text-gray-400 mt-0.5">{(gradient * 100).toFixed(3)}% | {(gradient * 1000).toFixed(2)} per mille</div>}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Calculation Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as CalcMethod)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
              <option value="colebrook_white">Colebrook-White</option>
              <option value="manning">Manning&apos;s Equation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cross-section + proportional flow */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cross section */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Pipe Cross-Section</h3>
            <div className="mb-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">View Depth: {Math.round(viewDepth * 100)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={viewDepth} onChange={e => setViewDepth(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
            <PipeCrossSection diameterMM={diameterMM} fillRatio={viewDepth} />
          </div>

          {/* Proportional flow table */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Proportional Flow</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Depth</th>
                  <th className="text-right py-1.5 text-[10px] font-semibold text-gray-500 uppercase">V (m/s)</th>
                  <th className="text-right py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Q (l/s)</th>
                  <th className="text-right py-1.5 text-[10px] font-semibold text-gray-500 uppercase">% Full</th>
                </tr>
              </thead>
              <tbody>
                {proportional.map(p => {
                  const pctQ = fullQ > 0 ? (p.flowLPS / fullQ * 100) : 0;
                  return (
                    <tr key={p.depthRatio} className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/50" onClick={() => setViewDepth(p.depthRatio)}>
                      <td className="px-2 py-1.5 font-medium">{p.depthLabel} ({p.depthMM}mm)</td>
                      <td className="px-2 py-1.5 text-right">{fmtNum(p.velocity, 3)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{fmtNum(p.flowLPS, 2)}</td>
                      <td className="px-2 py-1.5 text-right">{pctQ.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[10px] text-gray-400 mt-1">Click a row to view cross-section at that depth.</div>
          </div>
        </div>
      )}

      {/* Design checks */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Design Checks</h3>
          <div className="space-y-2">
            {checks.map(ch => (
              <div key={ch.id} className={`rounded-lg border p-3 ${ch.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className={`text-xs font-bold ${ch.pass ? "text-green-700" : "text-red-700"}`}>{ch.pass ? "PASS" : "FAIL"}</span>
                    <span className="text-xs text-gray-700 ml-2">{ch.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{ch.value}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Threshold: {ch.threshold} | {ch.regulation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Drainage / Pipe Flow Calculator</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Enter a pipe diameter, material, and gradient above to calculate flow velocity and capacity using the Colebrook-White or Manning&apos;s equation.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Calculations per BS EN 752 (Drain and sewer systems), Building Regulations Approved Document H, Sewers for Adoption (Design and Construction Guide), Colebrook-White equation, and Manning&apos;s equation. Kinematic viscosity assumed 1.141 x 10^-6 m2/s (water at 15 degrees C).</p>
        <p>This tool calculates theoretical pipe flow capacity for gravity drainage. Actual capacity depends on joint condition, deposition, structural condition, and upstream/downstream hydraulic conditions. A drainage engineer should verify all designs. Self-cleansing velocity threshold 0.75 m/s at 1/3 proportional depth per Sewers for Adoption.</p>
      </div>
    </div>
  );
}
