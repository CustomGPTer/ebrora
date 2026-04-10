// src/components/working-at-height-calculator/WorkingAtHeightCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  TASK_TYPES, SCORING_FACTORS, RISK_BANDS, CONTROL_HIERARCHY,
  EQUIPMENT_DATABASE, REGULATORY_REFERENCES,
  METHOD_STATEMENT_CHECKLIST, RESCUE_PLAN_CHECKLIST,
  HSE_COLORS,
  calculateRiskScore, calculateResidualScore,
} from "@/data/working-at-height-calculator";
import type { TaskType, ScoreResult, ControlMeasure } from "@/data/working-at-height-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Radar Chart ────────────────────────────────────────────
function RadarChart({ result }: { result: ScoreResult }) {
  const factors = result.factorScores;
  const cx = 150, cy = 150, r = 110;
  const n = factors.length;
  const angleStep = (2 * Math.PI) / n;

  const polarToCart = (angle: number, dist: number) => ({
    x: cx + dist * Math.cos(angle - Math.PI / 2),
    y: cy + dist * Math.sin(angle - Math.PI / 2),
  });

  // Grid rings at 20%, 40%, 60%, 80%, 100%
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const points = factors.map((f, i) => {
    const ratio = f.maxScore > 0 ? f.score / f.maxScore : 0;
    const p = polarToCart(i * angleStep, ratio * r);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="w-full h-auto" style={{ maxHeight: 280 }}>
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = polarToCart(i * angleStep, ring * r);
          return `${p.x},${p.y}`;
        }).join(" ");
        return <polygon key={ring} points={pts} fill="none" stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Axis lines */}
      {factors.map((_, i) => {
        const p = polarToCart(i * angleStep, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Data polygon */}
      <polygon points={points} fill="rgba(27,87,69,0.15)" stroke="#1B5745" strokeWidth={2} />
      {/* Data points */}
      {factors.map((f, i) => {
        const ratio = f.maxScore > 0 ? f.score / f.maxScore : 0;
        const p = polarToCart(i * angleStep, ratio * r);
        const col = HSE_COLORS[f.color] || HSE_COLORS.green;
        return <circle key={f.id} cx={p.x} cy={p.y} r={4} fill={col.text} stroke="white" strokeWidth={1.5} />;
      })}
      {/* Labels */}
      {factors.map((f, i) => {
        const p = polarToCart(i * angleStep, r + 18);
        const anchor = p.x < cx - 10 ? "end" : p.x > cx + 10 ? "start" : "middle";
        return (
          <text key={`l-${f.id}`} x={p.x} y={p.y} textAnchor={anchor} fontSize={8} fontWeight={600} fill="#374151">
            {f.label.length > 18 ? f.label.slice(0, 16) + "..." : f.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Horizontal Bar Chart ───────────────────────────────────
function FactorBarChart({ result }: { result: ScoreResult }) {
  const factors = result.factorScores;
  const W = 500, barH = 22, gap = 8, padL = 120, padR = 60;
  const H = factors.length * (barH + gap) + 10;
  const maxScore = Math.max(...factors.map(f => f.maxScore), 1);
  const cw = W - padL - padR;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      {factors.map((f, i) => {
        const y = i * (barH + gap) + 5;
        const barW = (f.score / maxScore) * cw;
        const maxW = (f.maxScore / maxScore) * cw;
        const col = HSE_COLORS[f.color] || HSE_COLORS.green;
        return (
          <g key={f.id}>
            <text x={padL - 6} y={y + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#6B7280" fontWeight={500}>
              {f.label.length > 20 ? f.label.slice(0, 18) + "..." : f.label}
            </text>
            {/* Max bar (ghost) */}
            <rect x={padL} y={y} width={maxW} height={barH} fill="#F3F4F6" rx={3} />
            {/* Score bar */}
            <rect x={padL} y={y} width={Math.max(barW, 0)} height={barH} fill={col.text} rx={3} opacity={0.8} />
            {/* Score label */}
            <text x={padL + maxW + 6} y={y + barH / 2 + 3} fontSize={10} fontWeight={700} fill={col.text}>
              {f.score}/{f.maxScore}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── PDF Export (PAID = dark header) ────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  result: ScoreResult,
  selectedControlIds: string[],
  residualScore: number,
  residualBandLabel: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `WAH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("WORKING AT HEIGHT RISK ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("WAHR 2005 / CDM 2015 Sched 3 / BS 8437 / BS EN 361 / INDG401 / GEIS6 / INDG455", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Info panel
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
  drawFld("Site:", header.site, M + halfW, y, 40);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 50);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Task Type:", result.taskType.label, M + halfW, y, 0);
  y += 5;
  drawFld("Height Band:", result.heightBand.label, M + 3, y, 0);
  drawFld("Score:", `${result.totalScore} / ${result.maxPossibleScore}`, M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Working at height risk assessment for ${header.site || "the above site"}. Task type: ${result.taskType.label}. Height band: ${result.heightBand.label}. Total risk score: ${result.totalScore}/${result.maxPossibleScore} (${result.riskBand.label}). Residual score after controls: ${residualScore} (${residualBandLabel}). Assessment per WAHR 2005 hierarchy: avoid > prevent (collective) > prevent (personal) > minimise.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("WORKING AT HEIGHT RISK ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Risk Banner
  const rgb = result.riskBand.rgb;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`RISK SCORE: ${result.totalScore} -- ${result.riskBand.label}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Task: ${result.taskType.short} | Height: ${result.heightBand.label} | Residual: ${residualScore} (${residualBandLabel})`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Factor Scores Table
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Factor Score Breakdown", M, y); y += 5;
  const cols = [65, 55, 30, CW - 150];
  // Header
  let cx = M;
  ["Factor", "Selection", "Score", "Max"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  // Rows
  result.factorScores.forEach((f, ri) => {
    checkPage(6);
    cx = M;
    const cells = [f.label, f.selectedLabel, String(f.score), String(f.maxScore)];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6.5);
      const txt = doc.splitTextToSize(t, cols[i] - 4);
      doc.text(txt[0] || "", cx + 2, y + 3.5);
      cx += cols[i];
    });
    y += 5.5;
  });
  // Total row
  cx = M;
  ["TOTAL", "", String(result.totalScore), String(result.maxPossibleScore)].forEach((t, i) => {
    doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
    doc.rect(cx, y, cols[i], 6, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text(t, cx + 2, y + 4);
    cx += cols[i];
  });
  y += 10;

  // ── Horizontal bar chart in PDF
  checkPage(55);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Factor Score Contribution", M, y); y += 5;
  const barMaxW = CW - 50;
  const maxFactorScore = Math.max(...result.factorScores.map(f => f.maxScore), 1);
  result.factorScores.forEach(f => {
    checkPage(8);
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    const shortLabel = f.label.length > 22 ? f.label.slice(0, 20) + ".." : f.label;
    doc.text(shortLabel, M, y + 3);
    const barX = M + 42;
    const maxW = (f.maxScore / maxFactorScore) * (barMaxW - 42);
    const scoreW = (f.score / maxFactorScore) * (barMaxW - 42);
    doc.setFillColor(240, 240, 240); doc.rect(barX, y, maxW, 4, "F");
    const hse = HSE_COLORS[f.color] || HSE_COLORS.green;
    const hex = hse.text;
    const r2 = parseInt(hex.slice(1, 3), 16), g2 = parseInt(hex.slice(3, 5), 16), b2 = parseInt(hex.slice(5, 7), 16);
    doc.setFillColor(r2, g2, b2); doc.rect(barX, y, Math.max(scoreW, 0), 4, "F");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text(`${f.score}/${f.maxScore}`, barX + maxW + 3, y + 3);
    y += 6;
  });
  y += 5;

  // ── Controls Applied
  if (selectedControlIds.length > 0) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Controls Applied", M, y); y += 5;
    selectedControlIds.forEach(cid => {
      checkPage(6);
      const ctrl = CONTROL_HIERARCHY.find(c => c.id === cid);
      if (!ctrl) return;
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      const line = `- ${ctrl.label} (${ctrl.tierLabel}, -${ctrl.reductionPoints} pts) -- ${ctrl.regulatoryRef}`;
      const lines = doc.splitTextToSize(line, CW - 4);
      doc.text(lines, M + 2, y); y += lines.length * 3.2;
    });
    y += 3;
    // Residual banner
    checkPage(14);
    const resBand = RISK_BANDS.find(b => residualScore >= b.min && residualScore <= b.max) || RISK_BANDS[0];
    const resRgb = resBand.rgb;
    doc.setFillColor(resRgb[0], resRgb[1], resRgb[2]);
    doc.roundedRect(M, y, CW, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`RESIDUAL RISK: ${residualScore} -- ${resBand.label}`, M + 5, y + 7);
    doc.setTextColor(0, 0, 0); y += 16;
  }

  // ── Equipment Recommendations
  if (result.applicableEquipment.length > 0) {
    checkPage(25);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Recommended Equipment", M, y); y += 5;
    const eqCols = [50, 35, CW - 85];
    cx = M;
    ["Equipment", "Category", "Suitability / Notes"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, eqCols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(h, cx + 2, y + 4); cx += eqCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);
    result.applicableEquipment.slice(0, 8).forEach((eq, ri) => {
      checkPage(8);
      cx = M;
      const cells = [eq.name, eq.category, `${eq.suitability}. Max: ${eq.maxHeight}`];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, eqCols[i], 6, "FD"); }
        else { doc.rect(cx, y, eqCols[i], 6, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
        const txt = doc.splitTextToSize(t, eqCols[i] - 3);
        doc.text(txt[0] || "", cx + 1.5, y + 4); cx += eqCols[i];
      });
      y += 6;
    });
    y += 5;
  }

  // ── Recommendations
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });
  y += 3;

  // ── Method Statement Checklist (if required)
  if (result.methodStatementRequired) {
    checkPage(40);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Method Statement Checklist", M, y); y += 5;
    METHOD_STATEMENT_CHECKLIST.forEach(item => {
      checkPage(5);
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text(`[ ] ${item}`, M + 2, y); y += 3.5;
    });
    y += 3;
  }

  // ── Rescue Plan Checklist (if required)
  if (result.rescuePlanRequired) {
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Rescue Plan Checklist", M, y); y += 5;
    RESCUE_PLAN_CHECKLIST.forEach(item => {
      checkPage(5);
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text(`[ ] ${item}`, M + 2, y); y += 3.5;
    });
    y += 3;
  }

  // ── Regulatory References
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Regulatory References", M, y); y += 5;
  REGULATORY_REFERENCES.slice(0, 8).forEach(ref => {
    checkPage(5);
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.text(ref.code, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.text(` -- ${ref.title}`, M + 2 + doc.getTextWidth(ref.code), y);
    y += 3.5;
  });
  y += 3;

  // ── Sign-off
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

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Working at height risk assessment per WAHR 2005, CDM 2015, BS 8437. This is a screening tool -- it does not replace a site-specific risk assessment by a competent person.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }
  doc.save(`working-at-height-risk-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────
export default function WorkingAtHeightCalculatorClient() {
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [taskType, setTaskType] = useState<TaskType>("scaffold-access");
  const [selections, setSelections] = useState<Record<string, number>>({
    height: 1, duration: 2, weather: 0, competence: 0, rescuePlan: 1, fragileSurface: 0, publicBelow: 0,
  });
  const [selectedControls, setSelectedControls] = useState<Set<string>>(new Set());

  const result = useMemo(() => calculateRiskScore(taskType, selections), [taskType, selections]);
  const { residualScore, reductionPoints, residualBand } = useMemo(
    () => calculateResidualScore(result.totalScore, Array.from(selectedControls)),
    [result.totalScore, selectedControls]
  );

  const toggleControl = useCallback((id: string) => {
    setSelectedControls(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPDF(
        { company, site, manager, assessedBy, date: assessDate },
        result, Array.from(selectedControls), residualScore, residualBand.label,
      );
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, result, selectedControls, residualScore, residualBand]);

  const clearAll = useCallback(() => {
    setTaskType("scaffold-access");
    setSelections({ height: 1, duration: 2, weather: 0, competence: 0, rescuePlan: 1, fragileSurface: 0, publicBelow: 0 });
    setSelectedControls(new Set());
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  // Group controls by tier for display
  const controlsByTier = useMemo(() => {
    const tiers: Record<string, ControlMeasure[]> = {};
    result.applicableControls.forEach(c => {
      if (!tiers[c.tierLabel]) tiers[c.tierLabel] = [];
      tiers[c.tierLabel].push(c);
    });
    return Object.entries(tiers).sort(([, a], [, b]) => a[0].tierOrder - b[0].tierOrder);
  }, [result.applicableControls]);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Risk Score", value: `${result.totalScore}/${result.maxPossibleScore}`, sub: result.riskBand.label, ...result.riskBand },
          { label: "Residual Score", value: `${residualScore}`, sub: `${reductionPoints} pts reduced`, ...residualBand },
          { label: "Task Type", value: result.taskType.short, sub: result.heightBand.label, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Requirements", value: result.methodStatementRequired ? "MS + RP" : result.rescuePlanRequired ? "Rescue Plan" : "Standard", sub: result.methodStatementRequired ? "Method statement + rescue plan" : result.rescuePlanRequired ? "Rescue plan required" : "Standard controls", bgClass: result.methodStatementRequired ? "bg-orange-50" : "bg-emerald-50", textClass: result.methodStatementRequired ? "text-orange-800" : "text-emerald-800", borderClass: result.methodStatementRequired ? "border-orange-200" : "border-emerald-200", dotClass: result.methodStatementRequired ? "bg-orange-500" : "bg-emerald-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Warning Banner ─────────────────────────────────── */}
      {result.totalScore >= 20 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div><div className="text-sm font-bold text-red-900">STOP -- UNACCEPTABLE RISK</div>
            <div className="text-xs text-red-800 mt-1">Risk score exceeds 20. Do not proceed until the score is reduced. Eliminate work at height or fundamentally redesign the access method. Senior management sign-off required.</div></div>
        </div>
      )}
      {result.totalScore >= 15 && result.totalScore < 20 && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-orange-600">!</span>
          <div><div className="text-sm font-bold text-orange-900">HIGH RISK -- ACTION REQUIRED</div>
            <div className="text-xs text-orange-800 mt-1">Significant fall risk. Redesign the task, provide collective fall prevention, or eliminate work at height. Do not proceed without senior management review.</div></div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={true}>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* ── Settings Panel ─────────────────────────────────── */}
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

      {/* ── Task & Factor Inputs ───────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Assessment Inputs</h3>

        {/* Task Type */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Type</label>
          <select value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}
            className="w-full border border-ebrora/30 bg-ebrora-light/40 rounded-lg px-3 py-2 text-sm focus:border-ebrora outline-none">
            {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="text-[10px] text-gray-400 mt-1">{result.taskType.notes}</div>
        </div>

        {/* Scoring Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCORING_FACTORS.map(factor => {
            const currentIndex = selections[factor.id] ?? 0;
            return (
              <div key={factor.id}>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {factor.label} {factor.weight > 1 && <span className="text-ebrora">(x{factor.weight})</span>}
                </label>
                <div className="space-y-1">
                  {factor.options.map((opt, optIndex) => {
                    const isSelected = currentIndex === optIndex;
                    const hse = HSE_COLORS[opt.color] || HSE_COLORS.green;
                    return (
                      <button key={`${factor.id}-${optIndex}`} onClick={() => setSelections(prev => ({ ...prev, [factor.id]: optIndex }))}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors border ${isSelected
                          ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora font-semibold"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hse.text }} />
                          {opt.label}
                          <span className="ml-auto text-[10px] opacity-60">({opt.score} pts)</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Risk Profile (Radar)</h3>
          <p className="text-[11px] text-gray-400">Factor scores normalised to maximum. Larger area = higher risk.</p>
          <RadarChart result={result} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Factor Score Breakdown</h3>
          <p className="text-[11px] text-gray-400">Score per factor vs maximum possible. Colour indicates HSE risk band.</p>
          <FactorBarChart result={result} />
        </div>
      </div>

      {/* ── Control Hierarchy Checklist ─────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Control Hierarchy (WAHR 2005)</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Select controls in place. Score reduces from {result.totalScore} to {residualScore} ({residualBand.label}).
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {controlsByTier.map(([tierLabel, controls]) => (
            <div key={tierLabel}>
              <div className="px-4 py-2 bg-gray-50/50">
                <span className="text-[11px] font-bold text-ebrora uppercase tracking-wide">{tierLabel}</span>
              </div>
              {controls.map(ctrl => {
                const isSelected = selectedControls.has(ctrl.id);
                return (
                  <label key={ctrl.id} className={`px-4 py-2.5 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? "bg-ebrora-light/20" : "hover:bg-gray-50"}`}>
                    <button onClick={() => toggleControl(ctrl.id)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${isSelected ? "bg-ebrora text-white" : "bg-gray-200 text-gray-400"}`}>
                      {isSelected ? "Y" : "-"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isSelected ? "text-ebrora-dark" : "text-gray-700"}`}>
                        {ctrl.label} <span className="text-[10px] text-gray-400 ml-1">(-{ctrl.reductionPoints} pts)</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{ctrl.description}</div>
                      <div className="text-[10px] text-gray-300 mt-0.5">{ctrl.regulatoryRef}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Equipment Recommendations ──────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Equipment Recommendations</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Based on task type: {result.taskType.label}. See Access Equipment Selector for detailed comparison.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {result.applicableEquipment.map(eq => (
            <div key={eq.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{eq.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{eq.category}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Max height: {eq.maxHeight} | {eq.suitability}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{eq.advantages}</div>
              {eq.crossRef !== "N/A" && <div className="text-[10px] text-ebrora mt-0.5">{eq.crossRef}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Method Statement Checklist ──────────────────────── */}
      {result.methodStatementRequired && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Method Statement Checklist</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Items to include in the method statement / safe system of work for this task.</p>
          </div>
          <div className="px-4 py-3 space-y-1">
            {METHOD_STATEMENT_CHECKLIST.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{item}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rescue Plan Checklist ───────────────────────────── */}
      {result.rescuePlanRequired && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Rescue Plan Checklist</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Items to include in the rescue plan per WAHR 2005 Reg 4(1) and BS 8437.</p>
          </div>
          <div className="px-4 py-3 space-y-1">
            {RESCUE_PLAN_CHECKLIST.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{item}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendations ────────────────────────────────── */}
      {result.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Recommendations</h3></div>
          <div className="px-4 py-3 space-y-2">
            {result.recommendations.map((rec, i) => <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span></div>)}
          </div>
        </div>
      )}

      {/* ── Risk Band Key ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {RISK_BANDS.map(b => (
          <div key={b.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${b.bgClass} ${b.textClass} border ${b.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${b.dotClass}`} />
            {b.min}-{b.max > 100 ? "25+" : b.max}: {b.label}
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on WAHR 2005, CDM 2015 Schedule 3, BS 8437, and HSE guidance (INDG401, GEIS6, INDG455).
          This is a screening tool - it does not replace a site-specific risk assessment by a competent person.
          Always implement controls per the WAHR 2005 hierarchy: avoid, prevent (collective then personal), minimise.
        </p>
      </div>
    </div>
  );
}
