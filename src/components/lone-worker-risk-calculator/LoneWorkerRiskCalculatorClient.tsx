// src/components/lone-worker-risk-calculator/LoneWorkerRiskCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  RISK_FACTORS, RISK_BAND_DEFS,
  calculateScore, whatIfScore, getRiskBandDef, recommendedCheckInMinutes,
} from "@/data/lone-worker-risk-calculator";
import type { RiskBand, LoneWorkerResult } from "@/data/lone-worker-risk-calculator";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Radar / Spider Chart ────────────────────────────────
function RadarChart({ result }: { result: LoneWorkerResult }) {
  const factors = RISK_FACTORS;
  const n = factors.length;
  const cx = 160, cy = 140, R = 110;
  const W = 320, H = 300;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // Start from top

  const getPoint = (i: number, r: number) => {
    const a = startAngle + i * angleStep;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = result.factorScores.map((fs, i) => getPoint(i, fs.normalised * R));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 320 }}>
      {/* Grid rings */}
      {rings.map(r => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, r * R));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={r} d={path} fill="none" stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Data area */}
      <path d={dataPath} fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth={2} />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />
      ))}
      {/* Labels */}
      {factors.map((f, i) => {
        const p = getPoint(i, R + 22);
        const anchor = p.x < cx - 20 ? "end" : p.x > cx + 20 ? "start" : "middle";
        return (
          <text key={f.id} x={p.x} y={p.y} textAnchor={anchor} fontSize={9} fontWeight={600} fill="#374151">
            {f.label.length > 18 ? f.label.slice(0, 16) + "..." : f.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Risk Gauge ──────────────────────────────────────────
function RiskGauge({ score, band }: { score: number; band: RiskBand }) {
  const W = 280, H = 160;
  const cx = W / 2, cy = 130, r = 95;
  // Score range 0-800 mapped to 180deg arc
  const maxVal = 800;
  const clampScore = Math.max(0, Math.min(maxVal, score));
  const ratio = clampScore / maxVal;
  const angle = Math.PI - ratio * Math.PI;

  // 4 segments: low, medium, high, unacceptable
  const segments = [
    { start: 0, end: 50 / maxVal, fill: "#22C55E" },
    { start: 50 / maxVal, end: 200 / maxVal, fill: "#EAB308" },
    { start: 200 / maxVal, end: 600 / maxVal, fill: "#EF4444" },
    { start: 600 / maxVal, end: 1, fill: "#1F2937" },
  ];

  const arcPath = (startR: number, endR: number) => {
    const a1 = Math.PI - startR * Math.PI;
    const a2 = Math.PI - endR * Math.PI;
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2);
    const largeArc = Math.abs(endR - startR) > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleLen = r - 12;
  const nx = cx + needleLen * Math.cos(angle);
  const ny = cy - needleLen * Math.sin(angle);
  const bandDef = getRiskBandDef(band);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
      {segments.map((s, i) => (
        <path key={i} d={arcPath(s.start, s.end)} fill="none" stroke={s.fill} strokeWidth={16} strokeLinecap="butt" />
      ))}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1B5745" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#1B5745" />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill="#1B5745">{score}</text>
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize={10} fill="#6B7280">{bandDef.label} Risk</text>
      <text x={cx - r - 5} y={cy + 5} textAnchor="end" fontSize={7} fill="#9CA3AF">0</text>
      <text x={cx + r + 5} y={cy + 5} textAnchor="start" fontSize={7} fill="#9CA3AF">800</text>
    </svg>
  );
}

// ─── PDF Export (PAID — dark header, no Ebrora branding) ─────
async function exportPDF(
  header: { site: string; company: string; manager: string; assessedBy: string; date: string },
  selections: Record<string, number>,
  result: LoneWorkerResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `LWR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const bandDef = getRiskBandDef(result.riskBand);

  // ── Header bar (PAID = dark, no Ebrora branding)
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("LONE WORKER RISK SCORE ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("HSE INDG73 / BS 8484:2016 Lone Worker Services", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel (PAID includes Company)
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
  const checkIn = recommendedCheckInMinutes(result.riskBand);
  drawFld("Check-in Interval:", checkIn !== null ? (checkIn > 0 ? `Every ${checkIn} min` : "N/A -- do not proceed") : "Standard (no mandatory interval)", M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Lone worker risk assessment for ${header.site || "the above site"} as at ${header.date || new Date().toLocaleDateString("en-GB")}. Scoring methodology based on HSE INDG73 guidance with multiplicative risk model. Lone worker device requirements per BS 8484:2016.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("LONE WORKER RISK ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Risk Banner
  const rgb = bandDef.gaugeRGB;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`RISK SCORE: ${result.compositeScore} -- ${bandDef.label.toUpperCase()}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Highest factor: ${result.maxFactorLabel} | ${bandDef.description.slice(0, 80)}...`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Factor Scores Table
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Risk Factor Scores", M, y); y += 5;

  const cols = [55, 65, 22, 20, 20];
  const headers = ["Factor", "Selection", "Weight", "Score", "Weighted"];
  let cx = M;
  headers.forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  RISK_FACTORS.forEach((factor, idx) => {
    checkPage(6);
    const fs = result.factorScores[idx];
    const option = factor.options.find(o => o.value === fs.selectedValue) || factor.options[0];
    const weighted = (factor.weight * fs.score).toFixed(1);
    cx = M;
    const rowData = [factor.label, option.label.slice(0, 35), factor.weight.toFixed(1), String(fs.score), weighted];
    rowData.forEach((t, i) => {
      if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      doc.text(t, cx + 2, y + 3.8);
      cx += cols[i];
    });
    y += 5.5;
  });
  y += 6;

  // ── Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommended Controls", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3.5;
  });
  y += 4;

  // ── Checklist
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Pre-Start Checklist", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.checklistItems.forEach(item => {
    checkPage(5);
    doc.text(`[ ]  ${item}`, M + 2, y);
    y += 3.5;
  });
  y += 4;

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
  doc.text("Assessed By", M + 3, y + 5.5);
  doc.text("Site Manager", M + soW + 7, y + 5.5);
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
      "Lone worker risk assessment per HSE INDG73 and BS 8484:2016. Multiplicative scoring model. This is a screening tool -- it does not replace a formal risk assessment.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`lone-worker-risk-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function LoneWorkerRiskCalculatorClient() {
  const [site, setSite] = useState("");
  const [company, setCompany] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Factor selections — keyed by factor.id
  const [selections, setSelections] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of RISK_FACTORS) init[f.id] = f.options[0].value;
    return init;
  });

  const result = useMemo(() => calculateScore(selections), [selections]);
  const bandDef = getRiskBandDef(result.riskBand);
  const checkIn = recommendedCheckInMinutes(result.riskBand);
  const hasData = Object.values(selections).some((v, i) => v !== RISK_FACTORS[i].options[0].value);

  const updateFactor = useCallback((factorId: string, value: number) => {
    setSelections(prev => ({ ...prev, [factorId]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, assessedBy, date: assessDate }, selections, result); }
    finally { setExporting(false); }
  }, [site, company, manager, assessedBy, assessDate, selections, result]);

  const clearAll = useCallback(() => {
    const init: Record<string, number> = {};
    for (const f of RISK_FACTORS) init[f.id] = f.options[0].value;
    setSelections(init);
    setSite(""); setCompany(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Risk Score", value: String(result.compositeScore), sub: `${bandDef.label} Risk`, bgClass: bandDef.bgClass, textClass: bandDef.textClass, borderClass: bandDef.borderClass, dotClass: bandDef.dotClass },
          { label: "Highest Factor", value: result.maxFactorLabel, sub: `Driving the overall score`, bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Check-in Interval", value: checkIn !== null ? (checkIn > 0 ? `${checkIn} min` : "N/A") : "Standard", sub: checkIn !== null && checkIn > 0 ? "Mandatory welfare check-ins" : checkIn === 0 ? "Do not proceed alone" : "No mandatory interval", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Checklist Items", value: String(result.checklistItems.length), sub: "Pre-start items to complete", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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

      {/* ── Unacceptable Warning ───────────────────────────── */}
      {result.riskBand === "unacceptable" && (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-400">!</span>
          <div>
            <div className="text-sm font-bold text-white">LONE WORKING MUST NOT PROCEED</div>
            <div className="text-xs text-gray-300 mt-1">
              The combination of risk factors makes lone working unacceptably dangerous. Assign a buddy system, additional operative, or reschedule the work with alternative arrangements.
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
        <button onClick={() => setShowWhatIf(!showWhatIf)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          What-If Comparison
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={hasData}>
          <button onClick={handleExport} disabled={!hasData || exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Company", value: company, setter: setCompany, ph: "Company name" },
            { label: "Site Name", value: site, setter: setSite, ph: "Site name" },
            { label: "Site Manager", value: manager, setter: setManager, ph: "Manager name" },
            { label: "Assessed By", value: assessedBy, setter: setAssessedBy, ph: "Your name" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.ph}
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

      {/* ── Factor Inputs ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Risk Factors (HSE INDG73)</h3>
        <div className="space-y-4">
          {RISK_FACTORS.map(factor => (
            <div key={factor.id}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{factor.label} (weight: {factor.weight}x)</label>
                <span className="text-[10px] text-gray-400">{factor.description}</span>
              </div>
              <select
                value={selections[factor.id]}
                onChange={e => updateFactor(factor.id, parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none"
              >
                {factor.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} (score: {opt.score})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row: Radar + Gauge ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Risk Profile (Radar)</h3>
          <p className="text-[11px] text-gray-400">Shows the normalised score for each risk dimension. Larger area = higher risk.</p>
          <RadarChart result={result} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Composite Risk Gauge</h3>
          <p className="text-[11px] text-gray-400">Green = Low, Yellow = Medium, Red = High, Black = Unacceptable.</p>
          <div className="max-w-xs mx-auto">
            <RiskGauge score={result.compositeScore} band={result.riskBand} />
          </div>
          <div className={`text-center p-3 rounded-lg ${bandDef.bgClass} ${bandDef.borderClass} border`}>
            <div className={`text-sm font-bold ${bandDef.textClass}`}>{bandDef.label} Risk</div>
            <div className={`text-xs mt-1 ${bandDef.textClass} opacity-80`}>{bandDef.description}</div>
          </div>
        </div>
      </div>

      {/* ── What-If Comparison ──────────────────────────────── */}
      {showWhatIf && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">What-If Comparison</h3>
          <p className="text-[11px] text-gray-400">See how changing one factor affects the overall score. Current score: <strong>{result.compositeScore}</strong></p>
          <div className="space-y-2">
            {RISK_FACTORS.map(factor => {
              const currentOption = factor.options.find(o => o.value === selections[factor.id]) || factor.options[0];
              return (
                <div key={factor.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-bold text-gray-700 mb-2">{factor.label} (current: {currentOption.label})</div>
                  <div className="flex flex-wrap gap-2">
                    {factor.options.filter(o => o.value !== selections[factor.id]).map(opt => {
                      const wi = whatIfScore(selections, factor.id, opt.value);
                      const deltaPct = wi.delta;
                      const wiBand = getRiskBandDef(wi.newBand);
                      return (
                        <button key={opt.value}
                          onClick={() => updateFactor(factor.id, opt.value)}
                          className="text-left p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors text-xs">
                          <div className="font-medium text-gray-700">{opt.label}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${wiBand.bgClass} ${wiBand.textClass}`}>{wi.newScore}</span>
                            <span className={`text-[10px] font-bold ${deltaPct < 0 ? "text-emerald-600" : deltaPct > 0 ? "text-red-600" : "text-gray-400"}`}>
                              {deltaPct > 0 ? "+" : ""}{deltaPct}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recommendations ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Recommended Controls</h3>
        </div>
        <div className="px-4 py-3 space-y-2">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-ebrora font-bold mt-0.5">-</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pre-Start Checklist ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Pre-Start Checklist</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{result.checklistItems.length} items to complete before commencing lone working</p>
        </div>
        <div className="divide-y divide-gray-100">
          {result.checklistItems.map((item, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Risk Band Key ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {RISK_BAND_DEFS.map(b => (
          <div key={b.band} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${b.bgClass} ${b.textClass} border ${b.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${b.dotClass}`} />
            {b.label} ({b.minScore}-{b.maxScore > 9000 ? "+" : b.maxScore})
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on HSE INDG73 (Working alone: Health and safety guidance on the risks of lone working) and BS 8484:2016
          (Code of practice for the provision of lone worker services). Multiplicative scoring model reflects the
          compounding nature of risk factors. This is a screening tool - it does not replace a formal risk assessment.
        </p>
      </div>
    </div>
  );
}
