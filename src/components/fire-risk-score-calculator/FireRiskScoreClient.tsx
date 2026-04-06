// src/components/fire-risk-score-calculator/FireRiskScoreClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  SiteMode,
  OverallRisk,
  SectionScore,
  ActionItem,
} from "@/data/fire-risk-score-calculator";
import {
  FIRE_SECTIONS,
  SITE_MODE_LABELS,
  LIKELIHOOD_LEVELS,
  CONSEQUENCE_LEVELS,
  OVERALL_RISK_DEFS,
  RISK_CARD_STYLES,
  getRiskRating,
  getRiskScore,
  createEmptySectionScore,
} from "@/data/fire-risk-score-calculator";
import {
  autoScoreSection,
  calculateOverallRisk,
  generateActions,
  getCompletion,
} from "@/lib/fire-risk-score-calculator/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

const RATING_COLOURS: Record<OverallRisk, { bg: string; text: string }> = {
  low: { bg: "bg-emerald-100", text: "text-emerald-800" },
  medium: { bg: "bg-amber-100", text: "text-amber-800" },
  high: { bg: "bg-red-100", text: "text-red-800" },
  intolerable: { bg: "bg-red-200", text: "text-red-900" },
};

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  siteMode: SiteMode,
  sectionScores: SectionScore[],
  actions: ActionItem[],
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  let y = 0;

  const sections = FIRE_SECTIONS[siteMode];
  const overall = calculateOverallRisk(sectionScores);
  const overallDef = OVERALL_RISK_DEFS.find(d => d.level === overall.overallRating)!;
  const modeLabel = SITE_MODE_LABELS[siteMode];

  // ── Header bar
  const docRef = `FRA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("FIRE RISK SCORE ASSESSMENT", M, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("PAS 79 / Fire Safety Order 2005 — ebrora.com/tools/fire-risk-score-calculator", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 5;
  drawFld("Assessment Type:", modeLabel.label, M + 3, y, 0);
  y += 8;

  // Helper
  function checkPage(need: number) {
    if (y + need > 280) { doc.addPage(); y = M; }
  }

  // ── Overall Risk Rating
  const riskRGB = overall.overallRating === "low" ? [22, 163, 74]
    : overall.overallRating === "medium" ? [217, 119, 6]
    : [220, 38, 38];
  doc.setFillColor(riskRGB[0], riskRGB[1], riskRGB[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`OVERALL RISK: ${overallDef.label.toUpperCase()}`, M + 5, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(overallDef.description, M + 5, y + 11);
  doc.setTextColor(0, 0, 0);
  y += 20;

  // ── 5×5 Risk Matrix Visual
  checkPage(55);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("5×5 Risk Matrix", M, y);
  y += 5;

  const cellSize = 12;
  const matrixX = M + 20;
  const matrixY = y;

  // Column headers (consequence)
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  for (let c = 1; c <= 5; c++) {
    doc.text(String(c), matrixX + (c - 1) * cellSize + cellSize / 2 - 1, matrixY - 1);
  }
  doc.setFontSize(6);
  doc.text("Consequence →", matrixX + 10, matrixY - 5);

  // Row headers (likelihood)
  doc.setFontSize(6);
  doc.text("Likelihood", M - 1, matrixY + 30);
  doc.text("↓", M + 4, matrixY + 33);

  for (let l = 1; l <= 5; l++) {
    doc.setFontSize(5.5);
    doc.text(String(l), matrixX - 5, matrixY + (l - 1) * cellSize + cellSize / 2 + 1);

    for (let c = 1; c <= 5; c++) {
      const rating = getRiskRating(l, c);
      const score = l * c;
      const cx = matrixX + (c - 1) * cellSize;
      const cy = matrixY + (l - 1) * cellSize;

      // Cell colour
      if (rating === "low") doc.setFillColor(187, 247, 208);
      else if (rating === "medium") doc.setFillColor(254, 243, 199);
      else if (rating === "high") doc.setFillColor(254, 202, 202);
      else doc.setFillColor(254, 150, 150);

      doc.rect(cx, cy, cellSize, cellSize, "FD");
      doc.setFontSize(6);
      doc.setTextColor(50, 50, 50);
      doc.text(String(score), cx + cellSize / 2 - 2, cy + cellSize / 2 + 1.5);

      // Mark sections that fall on this cell
      const matchingSections = sectionScores.filter(ss => ss.likelihood === l && ss.consequence === c && ss.rating !== "low" || (ss.likelihood === l && ss.consequence === c));
      if (matchingSections.length > 0) {
        doc.setDrawColor(27, 87, 69);
        doc.setLineWidth(0.5);
        doc.rect(cx + 0.3, cy + 0.3, cellSize - 0.6, cellSize - 0.6);
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
      }
    }
  }
  doc.setTextColor(0, 0, 0);
  y = matrixY + 5 * cellSize + 6;

  // Legend
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  const legendItems = [
    { label: "Low (1–4)", rgb: [187, 247, 208] },
    { label: "Medium (5–9)", rgb: [254, 243, 199] },
    { label: "High (10–16)", rgb: [254, 202, 202] },
    { label: "Intolerable (17–25)", rgb: [254, 150, 150] },
  ];
  legendItems.forEach((item, i) => {
    const lx = M + i * 40;
    doc.setFillColor(item.rgb[0], item.rgb[1], item.rgb[2]);
    doc.rect(lx, y - 1.5, 4, 3, "F");
    doc.text(item.label, lx + 6, y + 0.5);
  });
  y += 8;

  // ── Section Results
  checkPage(15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Section Scores", M, y);
  y += 5;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y - 2, CW, 5, "F");
  doc.setFontSize(6.5);
  const sCols = [0, 50, 110, 130, 148, 163];
  ["Section", "Regulatory Reference", "L", "C", "Score", "Rating"].forEach((h, i) => {
    doc.text(h, M + sCols[i], y + 1);
  });
  y += 5.5;

  doc.setFont("helvetica", "normal");
  sectionScores.forEach((ss, idx) => {
    checkPage(6);
    const section = sections[idx];
    if (!section) return;
    const hasAnswers = Object.values(ss.answers).some(a => a !== null);
    if (!hasAnswers) return;

    doc.setFontSize(6);
    doc.text(section.title, M + sCols[0], y);
    doc.text(section.regulatoryRef, M + sCols[1], y);
    doc.text(String(ss.likelihood), M + sCols[2] + 3, y);
    doc.text(String(ss.consequence), M + sCols[3] + 3, y);
    doc.text(String(ss.score), M + sCols[4] + 3, y);

    const ratingDef = OVERALL_RISK_DEFS.find(d => d.level === ss.rating)!;
    doc.setFont("helvetica", "bold");
    doc.text(ratingDef.label, M + sCols[5], y);
    doc.setFont("helvetica", "normal");
    y += 4.5;
  });
  y += 4;

  // ── Question Detail
  sectionScores.forEach((ss, idx) => {
    const section = sections[idx];
    if (!section) return;
    const hasAnswers = Object.values(ss.answers).some(a => a !== null);
    if (!hasAnswers) return;

    checkPage(15);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${section.title} (${section.regulatoryRef})`, M, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    section.questions.forEach(q => {
      checkPage(5);
      const answer = ss.answers[q.id];
      const answerText = answer === "yes" ? "[YES]" : answer === "no" ? "[NO]" : answer === "na" ? "N/A" : "—";
      doc.text(`${answerText}  ${q.text}`, M + 2, y);
      y += 3.5;
    });
    y += 3;
  });

  // ── Action Plan
  if (actions.length > 0) {
    checkPage(20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Action Plan", M, y);
    y += 5;

    doc.setFillColor(245, 245, 245);
    doc.rect(M, y - 2, CW, 5, "F");
    doc.setFontSize(6.5);
    const aCols = [0, 8, 80, 120, 155];
    ["#", "Action", "Responsible Person", "Target Date", "Priority"].forEach((h, i) => {
      doc.text(h, M + aCols[i], y + 1);
    });
    y += 5.5;

    doc.setFont("helvetica", "normal");
    actions.forEach((action, i) => {
      checkPage(8);
      doc.setFontSize(6.5);
      doc.text(String(i + 1), M + aCols[0], y);
      const descLines = doc.splitTextToSize(action.description, 68);
      doc.text(descLines, M + aCols[1], y);
      doc.text(action.responsiblePerson || "TBC", M + aCols[2], y);
      doc.text(action.targetDate || "TBC", M + aCols[3], y);
      doc.setFont("helvetica", "bold");
      const rDef = OVERALL_RISK_DEFS.find(d => d.level === action.priority);
      doc.text(rDef?.label || "", M + aCols[4], y);
      doc.setFont("helvetica", "normal");
      y += Math.max(descLines.length * 3.5, 5);
    });
  }

  // ── Sign-off
  checkPage(50);
  y += 6;
  doc.setDrawColor(27, 87, 69);
  doc.line(M, y, W - M, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const signFields = [
    "Assessed By:", "Signature:", "Date:",
    "Site Manager:", "Signature:", "Date:",
  ];
  for (let i = 0; i < signFields.length; i++) {
    if (i === 3) y += 4; // extra gap before site manager
    doc.text(signFields[i], M, y);
    doc.setDrawColor(180, 180, 180);
    doc.line(M + 25, y, M + (signFields[i] === "Date:" ? 65 : 95), y);
    y += 7;
  }

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "This fire risk score assessment is a screening tool based on PAS 79 methodology and the Regulatory Reform (Fire Safety) Order 2005. It does not replace a formal fire risk assessment by a competent person.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }

  doc.save(`fire-risk-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function FireRiskScoreClient() {
  const [siteMode, setSiteMode] = useState<SiteMode>("construction");
  const [sectionScores, setSectionScores] = useState<SectionScore[]>(
    () => FIRE_SECTIONS["construction"].map(createEmptySectionScore)
  );
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<SiteMode | null>(null);

  const sections = FIRE_SECTIONS[siteMode];

  // Switch site mode
  const doSwitch = useCallback((mode: SiteMode) => {
    setSiteMode(mode);
    setSectionScores(FIRE_SECTIONS[mode].map(createEmptySectionScore));
    setActions([]);
    setExpandedSection(null);
    setConfirmSwitch(null);
  }, []);

  const handleModeSwitch = useCallback((mode: SiteMode) => {
    if (mode === siteMode) return;
    const hasAnyAnswers = sectionScores.some(ss => Object.values(ss.answers).some(a => a !== null));
    if (hasAnyAnswers) {
      setConfirmSwitch(mode);
    } else {
      doSwitch(mode);
    }
  }, [siteMode, sectionScores, doSwitch]);

  // Update answer
  const updateAnswer = useCallback((sectionIdx: number, questionId: string, answer: "yes" | "no" | "na") => {
    setSectionScores(prev => prev.map((ss, i) => {
      if (i !== sectionIdx) return ss;
      const newAnswers = { ...ss.answers, [questionId]: ss.answers[questionId] === answer ? null : answer };
      const section = sections[i];
      const auto = autoScoreSection(section, newAnswers);
      const score = getRiskScore(auto.likelihood, auto.consequence);
      const rating = getRiskRating(auto.likelihood, auto.consequence);
      return { ...ss, answers: newAnswers, likelihood: auto.likelihood, consequence: auto.consequence, score, rating };
    }));
  }, [sections]);

  // Override L or C for a section
  const updateSectionLC = useCallback((sectionIdx: number, field: "likelihood" | "consequence", value: number) => {
    setSectionScores(prev => prev.map((ss, i) => {
      if (i !== sectionIdx) return ss;
      const updated = { ...ss, [field]: value };
      updated.score = getRiskScore(updated.likelihood, updated.consequence);
      updated.rating = getRiskRating(updated.likelihood, updated.consequence);
      return updated;
    }));
  }, []);

  // Generate actions
  const regenerateActions = useCallback(() => {
    const newActions = generateActions(sectionScores, sections);
    setActions(newActions);
  }, [sectionScores, sections]);

  // Update action field
  const updateAction = useCallback((id: string, field: keyof ActionItem, value: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }, []);

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Computed values
  const overall = useMemo(() => calculateOverallRisk(sectionScores), [sectionScores]);
  const completion = useMemo(() => getCompletion(sectionScores), [sectionScores]);
  const overallDef = OVERALL_RISK_DEFS.find(d => d.level === overall.overallRating)!;
  const hasData = overall.answeredSections > 0;

  const clearAll = useCallback(() => {
    setSectionScores(sections.map(createEmptySectionScore));
    setActions([]);
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, [sections]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, assessedBy, date: assessDate }, siteMode, sectionScores, actions); }
    finally { setExporting(false); }
  }, [site, manager, assessedBy, assessDate, siteMode, sectionScores, actions]);

  return (
    <div className="space-y-5">
      {/* ── Mode Switch Confirmation Modal ─────────────── */}
      {confirmSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Switch Assessment Type?</h3>
            <p className="text-sm text-gray-600">Switching will clear all your current answers and scores. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmSwitch(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => doSwitch(confirmSwitch)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Switch &amp; Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Dashboard ─────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(() => {
            const style = RISK_CARD_STYLES[overall.overallRating];
            return [
              { label: "Overall Risk", value: overallDef.label, sub: `Score: ${overall.highestScore}`, ...style },
              { label: "Actions Required", value: String(actions.length || overall.totalActions), sub: actions.length > 0 ? "See action plan below" : "Generate action plan", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
              { label: "Highest Risk Section", value: (() => {
                const worst = sectionScores.reduce((a, b) => b.score > a.score ? b : a, sectionScores[0]);
                const sec = sections.find(s => s.id === worst.sectionId);
                return sec?.title.slice(0, 20) || "—";
              })(), sub: `L${sectionScores.reduce((a, b) => b.score > a.score ? b : a, sectionScores[0]).likelihood} × C${sectionScores.reduce((a, b) => b.score > a.score ? b : a, sectionScores[0]).consequence}`, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" },
              { label: "Completion", value: `${completion}%`, sub: `${overall.answeredSections}/${overall.totalSections} sections`, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
            ];
          })().map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span>
              </div>
              <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Intolerable Warning ─────────────────────────── */}
      {hasData && overall.overallRating === "intolerable" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-2xl">🚫</span>
          <div>
            <div className="text-sm font-bold text-red-900">INTOLERABLE RISK — Works Must Not Continue</div>
            <div className="text-xs text-red-800 mt-1">
              One or more sections have scored an intolerable risk rating. In accordance with the Regulatory Reform (Fire Safety) Order 2005,
              relevant activities must be prohibited until the risk is reduced to an acceptable level. Implement immediate corrective actions.
            </div>
          </div>
        </div>
      )}

      {/* ── Site Mode Selector ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(SITE_MODE_LABELS) as [SiteMode, typeof SITE_MODE_LABELS[SiteMode]][]).map(([mode, meta]) => (
          <button
            key={mode}
            onClick={() => handleModeSwitch(mode)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${
              siteMode === mode
                ? "border-ebrora bg-ebrora-light/40 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{meta.icon}</span>
              <span className={`text-sm font-bold ${siteMode === mode ? "text-ebrora-dark" : "text-gray-700"}`}>{meta.label}</span>
            </div>
            <p className="text-[11px] text-gray-500">{meta.description}</p>
          </button>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>

        <button onClick={regenerateActions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          Generate Action Plan
        </button>

        <div className="flex-1" />

        <button onClick={handleExport} disabled={!hasData || exporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label>
            <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Assessed By</label>
            <input type="text" value={assessedBy} onChange={e => setAssessedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Section Accordions ─────────────────────────────── */}
      <div className="space-y-3">
        {sections.map((section, sIdx) => {
          const ss = sectionScores[sIdx];
          const isExpanded = expandedSection === section.id;
          const ratingDef = OVERALL_RISK_DEFS.find(d => d.level === ss.rating)!;
          const rStyle = RATING_COLOURS[ss.rating];
          const answeredCount = Object.values(ss.answers).filter(a => a !== null).length;

          return (
            <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Section header — clickable */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{section.title}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${rStyle.bg} ${rStyle.text}`}>
                      {ratingDef.label}
                    </span>
                    {answeredCount > 0 && (
                      <span className="text-[10px] text-gray-400">{answeredCount}/{section.questions.length}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">{section.regulatoryRef}</span>
                </div>
                {answeredCount > 0 && (
                  <span className="text-xs tabular-nums font-medium text-gray-500">
                    L{ss.likelihood} × C{ss.consequence} = {ss.score}
                  </span>
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  {/* Questions */}
                  {section.questions.map(q => {
                    const answer = ss.answers[q.id];
                    return (
                      <div key={q.id} className="flex items-start gap-3">
                        <div className="flex gap-1 shrink-0 mt-0.5">
                          {(["yes", "no", "na"] as const).map(opt => (
                            <button
                              key={opt}
                              onClick={() => updateAnswer(sIdx, q.id, opt)}
                              className={`w-8 h-7 text-[10px] font-bold rounded-md border transition-colors ${
                                answer === opt
                                  ? opt === "yes" ? "bg-emerald-500 text-white border-emerald-500"
                                    : opt === "no" ? "bg-red-500 text-white border-red-500"
                                    : "bg-gray-400 text-white border-gray-400"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {opt === "yes" ? "✓" : opt === "no" ? "✗" : "N/A"}
                            </button>
                          ))}
                        </div>
                        <span className={`text-sm ${answer === "no" ? "text-red-700 font-medium" : "text-gray-700"}`}>
                          {q.text}
                        </span>
                      </div>
                    );
                  })}

                  {/* L × C Override */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Section Score (auto-calculated, override below)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Likelihood</label>
                        <select value={ss.likelihood}
                          onChange={e => updateSectionLC(sIdx, "likelihood", parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                          {LIKELIHOOD_LEVELS.map(l => (
                            <option key={l.value} value={l.value}>{l.value} — {l.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Consequence</label>
                        <select value={ss.consequence}
                          onChange={e => updateSectionLC(sIdx, "consequence", parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                          {CONSEQUENCE_LEVELS.map(c => (
                            <option key={c.value} value={c.value}>{c.value} — {c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400">=</span>
                        <span className={`px-3 py-1.5 text-sm font-bold rounded-lg ${rStyle.bg} ${rStyle.text}`}>
                          {ss.score} ({ratingDef.label})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Action Plan ────────────────────────────────────── */}
      {actions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Action Plan</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{actions.length} actions generated. Edit descriptions, assign responsible persons, and set target dates.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {actions.map((action, i) => {
              const pStyle = RATING_COLOURS[action.priority];
              return (
                <div key={action.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-gray-400 mt-1 w-5">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${pStyle.bg} ${pStyle.text}`}>
                          {OVERALL_RISK_DEFS.find(d => d.level === action.priority)?.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{action.sectionTitle}</span>
                      </div>
                      <textarea
                        value={action.description}
                        onChange={e => updateAction(action.id, "description", e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-0.5">Responsible Person</label>
                          <input type="text" value={action.responsiblePerson}
                            onChange={e => updateAction(action.id, "responsiblePerson", e.target.value)}
                            placeholder="Name / role"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-0.5">Target Date</label>
                          <input type="date" value={action.targetDate}
                            onChange={e => updateAction(action.id, "targetDate", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeAction(action.id)} className="p-1 text-gray-300 hover:text-red-500 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on PAS 79:2020 methodology and the Regulatory Reform (Fire Safety) Order 2005.
          This is a screening/scoring tool — it does not replace a formal fire risk assessment by a competent fire risk assessor.
          Section scores are auto-calculated from answers and can be manually overridden.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools →
        </a>
      </div>
    </div>
  );
}
