// src/components/confined-space-calculator/ConfinedSpaceCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  SCORING_SECTIONS,
  CATEGORY_BANDS,
  CATEGORY_REQUIREMENTS,
  REQUIREMENT_LABELS,
  RISK_SPECIFIC_CONTROLS,
  RISK_INDEX_TO_KEY,
  getCategory,
  type NCCategory,
  type CategoryResult,
} from "@/data/confined-space-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }

/* ── PDF export ────────────────────────────────────────────────── */

async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string; csName: string; completedBy: string; completedDate: string; csQualifications: string },
  singleSelections: Record<string, number>,
  multiSelections: Record<string, Set<number>>,
  isEnclosed: boolean,
  hasRisks: boolean,
  totalScore: number,
  cat: CategoryResult | null,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;

  const docRef = `CSC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("CONFINED SPACE CATEGORY ASSESSMENT (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.csName || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }

  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("CONFINED SPACE CATEGORY ASSESSMENT", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | Confined Spaces Regulations 1997 / C&G 6160 | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 29, 1, 1, "FD");
  doc.setFontSize(8);

  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Confined Space:", header.csName, M + 3, y, 60);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
  y += 5;
  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Assessed By:", header.assessedBy, M + CW / 2, y, 40);
  y += 5;
  drawFld("Completed By:", header.completedBy, M + 3, y, 50);
  drawFld("Completion Date:", header.completedDate, M + CW / 2, y, 30);
  y += 5;
  drawFld("CS Qualification(s):", header.csQualifications, M + 3, y, 80);
  y += 10;

  // Gate check
  if (!isEnclosed || !hasRisks) {
    doc.setFillColor(255, 240, 240); doc.setDrawColor(220, 180, 180);
    doc.roundedRect(M, y, CW, 18, 1, 1, "FD");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 30, 30);
    doc.text("NOT A CONFINED SPACE", M + 3, y + 7);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 30, 30);
    const reason = !isEnclosed
      ? "The space is not fully or partially enclosed."
      : "No foreseeable specified risks are present under Regulation 1(2).";
    doc.text(reason, M + 3, y + 13);
    doc.setTextColor(0, 0, 0); y += 24;
  } else {
    // Scoring breakdown — ALL sections with green highlight on selected rows
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Scoring Breakdown", M, y); y += 5;

    for (const section of SCORING_SECTIONS) {
      const selMulti = multiSelections[section.id] || new Set<number>();
      const selSingle = singleSelections[section.id] ?? -1;
      const sectionTotal = section.mode === "multi"
        ? [...selMulti].reduce((s, i) => s + section.options[i].weight, 0)
        : (selSingle >= 0 ? section.options[selSingle].weight : 0);

      checkPage(8 + section.options.length * 4);

      // Section header
      doc.setFillColor(240, 240, 240); doc.rect(M, y - 1, CW, 5, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
      doc.text(section.title.toUpperCase(), M + 2, y + 2);
      doc.text(`Score: ${sectionTotal}`, M + CW - 25, y + 2);
      doc.setTextColor(0, 0, 0);
      y += 6;

      doc.setFontSize(6.5);
      for (let i = 0; i < section.options.length; i++) {
        const opt = section.options[i];
        const isSelected = section.mode === "multi" ? selMulti.has(i) : selSingle === i;

        if (isSelected) {
          doc.setFillColor(235, 250, 240); doc.rect(M, y - 2, CW, 4.5, "F");
          doc.setFont("helvetica", "bold");
          doc.text("[X]", M + 2, y + 0.5);
        } else {
          doc.setFont("helvetica", "normal");
          doc.text("[ ]", M + 2, y + 0.5);
        }
        doc.text(opt.label, M + 10, y + 0.5);
        doc.text(`${opt.weight}`, M + CW - 8, y + 0.5);
        if (isSelected) doc.setFont("helvetica", "normal");
        y += 4;
      }
      y += 3;
    }

    // Total + Category badge
    y += 2;
    doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 5;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(`Total Score: ${totalScore}`, M, y);
    if (cat) {
      const catColours: Record<NCCategory, [number, number, number]> = {
        NC1: [34, 197, 94], NC2: [245, 158, 11], NC3: [239, 68, 68], NC4: [185, 28, 28],
      };
      const [cr, cg, cb] = catColours[cat.category] || [100, 100, 100];
      const catText = `${cat.category} - ${cat.label}`;
      const catW = doc.getTextWidth(catText) + 8;
      doc.setFillColor(cr, cg, cb); doc.roundedRect(M + 55, y - 4, catW, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      doc.text(catText, M + 59, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 10;

    // Requirements table with empty tick boxes for hand completion
    if (cat) {
      checkPage(80);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(`${cat.category} Requirements`, M, y); y += 5;

      const reqs = CATEGORY_REQUIREMENTS[cat.category];
      const colLbl = 55; const colReq = CW - colLbl - 18;

      doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255);
      doc.rect(M, y, colLbl, 6, "F"); doc.rect(M + colLbl, y, colReq, 6, "F"); doc.rect(M + colLbl + colReq, y, 18, 6, "F");
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text("Requirement", M + 2, y + 4);
      doc.text("Detail", M + colLbl + 2, y + 4);
      doc.text("Check", M + colLbl + colReq + 2, y + 4);
      doc.setTextColor(0, 0, 0); y += 6;

      doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
      for (const rl of REQUIREMENT_LABELS) {
        const reqText = reqs[rl.key];
        const lines = doc.splitTextToSize(reqText, colReq - 4);
        const rowH = Math.max(5, lines.length * 3.2 + 1.5);
        checkPage(rowH);
        doc.rect(M, y, colLbl, rowH, "D"); doc.rect(M + colLbl, y, colReq, rowH, "D"); doc.rect(M + colLbl + colReq, y, 18, rowH, "D");
        doc.setFont("helvetica", "bold");
        doc.text(rl.label, M + 2, y + 3.5);
        doc.setFont("helvetica", "normal");
        doc.text(lines, M + colLbl + 2, y + 3.5);
        // Empty tick box
        const bx = M + colLbl + colReq + 6; const by = y + (rowH / 2) - 1.5;
        doc.rect(bx, by, 3, 3, "D");
        y += rowH;
      }
      y += 5;

      // Risk-specific additional controls
      const selectedRiskIndices = [...(multiSelections["foreseeable_risks"] || new Set<number>())];
      if (selectedRiskIndices.length > 0) {
        checkPage(15);
        doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text("Risk-Specific Additional Controls", M, y); y += 5;

        for (const riskIdx of selectedRiskIndices) {
          const key = RISK_INDEX_TO_KEY[riskIdx];
          if (!key || !RISK_SPECIFIC_CONTROLS[key]) continue;
          const rsc = RISK_SPECIFIC_CONTROLS[key];

          checkPage(8 + rsc.controls.length * 4);

          doc.setFillColor(255, 245, 235); doc.rect(M, y - 1, CW, 5, "F");
          doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150, 60, 0);
          doc.text(rsc.riskLabel.toUpperCase(), M + 2, y + 2);
          doc.setTextColor(0, 0, 0); y += 6;

          doc.setFontSize(6); doc.setFont("helvetica", "normal");
          for (const ctrl of rsc.controls) {
            checkPage(5);
            const ctrlLines = doc.splitTextToSize(`- ${ctrl}`, CW - 12);
            // Empty tick box
            doc.rect(M + 2, y - 0.5, 2.5, 2.5, "D");
            doc.text(ctrlLines, M + 7, y + 1);
            y += ctrlLines.length * 3.2 + 1;
          }
          y += 3;
        }
      }
    }
  }

  // Sign-off
  checkPage(55);
  y += 4; doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  doc.setFont("helvetica", "normal");
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Assessment per Confined Spaces Regulations 1997, L101 ACOP, Water UK Guidance, and C&G 6160 framework.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 290);
  }

  const safeName = (header.csName || "confined-space").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  doc.save(`confined-space-assessment-${safeName}-${todayISO()}.pdf`);
}

/* ── Component ─────────────────────────────────────────────────── */

export default function ConfinedSpaceCalculatorClient() {
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [csName, setCsName] = useState("");
  const [completedBy, setCompletedBy] = useState("");
  const [completedDate, setCompletedDate] = useState(todayISO());
  const [csQualifications, setCsQualifications] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [isEnclosed, setIsEnclosed] = useState<boolean | null>(null);
  const [singleSelections, setSingleSelections] = useState<Record<string, number>>({});
  const [multiSelections, setMultiSelections] = useState<Record<string, Set<number>>>({});

  // hasRisks derived from checkboxes — no separate gate button
  const hasRisks = useMemo(() => {
    const riskSet = multiSelections["foreseeable_risks"];
    return !!(riskSet && riskSet.size > 0);
  }, [multiSelections]);

  const sectionScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const section of SCORING_SECTIONS) {
      if (section.mode === "single") {
        const idx = singleSelections[section.id] ?? -1;
        scores[section.id] = idx >= 0 ? section.options[idx].weight : 0;
      } else {
        const sel = multiSelections[section.id] || new Set<number>();
        scores[section.id] = [...sel].reduce((sum, i) => sum + section.options[i].weight, 0);
      }
    }
    return scores;
  }, [singleSelections, multiSelections]);

  const totalScore = useMemo(() => Object.values(sectionScores).reduce((a, b) => a + b, 0), [sectionScores]);
  const maxPossible = useMemo(() => SCORING_SECTIONS.reduce((sum, s) => {
    if (s.mode === "multi") return sum + s.options.reduce((a, o) => a + o.weight, 0);
    return sum + Math.max(...s.options.map(o => o.weight));
  }, 0), []);

  const isConfinedSpace = isEnclosed === true && hasRisks;
  const notConfinedSpace = isEnclosed === false || (isEnclosed === true && multiSelections["foreseeable_risks"] !== undefined && !hasRisks);
  const cat = isConfinedSpace && totalScore > 0 ? getCategory(totalScore) : null;

  const actionsRequired = useMemo(() => {
    if (!cat) return 0;
    let count = REQUIREMENT_LABELS.length;
    const selectedRiskIndices = [...(multiSelections["foreseeable_risks"] || new Set<number>())];
    for (const riskIdx of selectedRiskIndices) {
      const key = RISK_INDEX_TO_KEY[riskIdx];
      if (key && RISK_SPECIFIC_CONTROLS[key]) count += RISK_SPECIFIC_CONTROLS[key].controls.length;
    }
    return count;
  }, [cat, multiSelections]);

  const handleSingleSelect = useCallback((sectionId: string, optionIndex: number) => {
    setSingleSelections(prev => ({ ...prev, [sectionId]: prev[sectionId] === optionIndex ? -1 : optionIndex }));
  }, []);

  const handleMultiToggle = useCallback((sectionId: string, optionIndex: number) => {
    setMultiSelections(prev => {
      const current = new Set(prev[sectionId] || []);
      if (current.has(optionIndex)) current.delete(optionIndex); else current.add(optionIndex);
      return { ...prev, [sectionId]: current };
    });
  }, []);

  const clearAll = useCallback(() => {
    setIsEnclosed(null); setSingleSelections({}); setMultiSelections({});
    setSite(""); setManager(""); setAssessedBy(""); setCsName("");
    setCompletedBy(""); setCsQualifications("");
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPDF(
        { company, site, manager, assessedBy, date: assessDate, csName, completedBy, completedDate, csQualifications },
        singleSelections, multiSelections, isEnclosed === true, hasRisks, totalScore, cat,
      );
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, csName, completedBy, completedDate, csQualifications, singleSelections, multiSelections, isEnclosed, hasRisks, totalScore, cat]);

  const activeRiskControls = useMemo(() => {
    const selectedRiskIndices = [...(multiSelections["foreseeable_risks"] || new Set<number>())];
    return selectedRiskIndices
      .map(i => ({ idx: i, key: RISK_INDEX_TO_KEY[i] }))
      .filter(r => r.key && RISK_SPECIFIC_CONTROLS[r.key])
      .map(r => ({ ...RISK_SPECIFIC_CONTROLS[r.key], riskIndex: r.idx }));
  }, [multiSelections]);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Status", value: notConfinedSpace ? "Not a Confined Space" : isConfinedSpace ? "Confirmed Confined Space" : "Awaiting Assessment", sub: notConfinedSpace ? "Regulation 1(2) not met" : isConfinedSpace ? "Proceed with scoring" : "Answer gate questions", bg: notConfinedSpace ? "bg-gray-50" : isConfinedSpace ? "bg-blue-50" : "bg-slate-50", border: notConfinedSpace ? "border-gray-200" : isConfinedSpace ? "border-blue-200" : "border-slate-200", text: notConfinedSpace ? "text-gray-700" : isConfinedSpace ? "text-blue-800" : "text-slate-700", dot: notConfinedSpace ? "bg-gray-400" : isConfinedSpace ? "bg-blue-500" : "bg-slate-400" },
          { label: "Total Score", value: isConfinedSpace ? `${totalScore}` : "--", sub: isConfinedSpace ? `of ${maxPossible} max` : "N/A", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
          { label: "Category", value: cat ? cat.category : "--", sub: cat ? cat.label : "Pending", bg: cat ? cat.colour : "bg-gray-50", border: cat ? cat.borderColour : "border-gray-200", text: cat ? cat.textColour : "text-gray-500", dot: cat ? (cat.category === "NC1" ? "bg-green-500" : cat.category === "NC2" ? "bg-amber-500" : "bg-red-500") : "bg-gray-400" },
          { label: "Actions Required", value: cat ? `${actionsRequired}` : "--", sub: cat ? `${REQUIREMENT_LABELS.length} requirements + ${actionsRequired - REQUIREMENT_LABELS.length} risk controls` : "N/A", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.text}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {notConfinedSpace && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
          <div className="text-base font-bold text-gray-800 mb-1">This is NOT a Confined Space</div>
          <div className="text-sm text-gray-600">
            {isEnclosed === false
              ? "The space is not fully or partially enclosed. Under the Confined Spaces Regulations 1997, Regulation 1(2), a confined space must be substantially (though not always entirely) enclosed."
              : "No foreseeable specified risks have been selected. Under Regulation 1(2), a confined space must have a reasonably foreseeable specified risk. Standard risk assessment procedures apply but confined space entry controls are not required."}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings</button>
        <div className="flex-1" />
        <PaidDownloadButton hasData={isConfinedSpace}>
        <button onClick={handleExport} disabled={!isConfinedSpace || !cat || exporting} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isConfinedSpace && cat ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}</button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[{ l: "Confined Space Name/Ref", v: csName, s: setCsName }, { l: "Company", v: company, s: setCompany }, { l: "Site Name", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Assessed By", v: assessedBy, s: setAssessedBy }, { l: "Completed By", v: completedBy, s: setCompletedBy }, { l: "CS Qualification(s)", v: csQualifications, s: setCsQualifications }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label><input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Assessment Date</label><input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Completion Date</label><input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Step 1 — Gate + Foreseeable Risks (always visible when enclosed=YES) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-bold text-gray-800">Step 1 — Confined Space Definition</h3>
        <p className="text-xs text-gray-500 -mt-2">Per HSE L101 and Regulation 1(2): a confined space must be substantially enclosed AND have at least one foreseeable specified risk.</p>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Is the space fully enclosed or partially enclosed?</label>
          <div className="flex gap-2">
            {([true, false] as const).map(v => (
              <button key={String(v)} onClick={() => setIsEnclosed(v)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${isEnclosed === v ? (v ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-gray-100 border-gray-300 text-gray-800") : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        {isEnclosed === true && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Foreseeable Specified Risks (select all that apply)</label>
            <p className="text-xs text-gray-400 mb-3">If none of these risks are present or reasonably foreseeable, this is not a confined space under the Regulations.</p>
            <div className="space-y-1.5">
              {SCORING_SECTIONS[0].options.map((opt, idx) => {
                const isSelected = (multiSelections["foreseeable_risks"] || new Set()).has(idx);
                return (
                  <button key={idx} onClick={() => handleMultiToggle("foreseeable_risks", idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${isSelected ? "bg-red-50/60 border-red-200 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-red-600 bg-red-600" : "border-gray-300 bg-white"}`}>
                        {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                      <span className={`text-sm ${isSelected ? "font-medium text-gray-900" : "text-gray-600"}`}>{opt.label}</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${isSelected ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>{opt.weight}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Remaining scoring sections */}
      {isConfinedSpace && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 px-1">Step 2 — Category Scoring</h3>
          {SCORING_SECTIONS.slice(1).map(section => {
            const sectionScore = sectionScores[section.id] || 0;
            return (
              <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700">{section.title}</h3>
                    {section.description && <p className="text-[11px] text-gray-400 mt-0.5">{section.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${sectionScore > 0 ? "text-ebrora-dark" : "text-gray-400"}`}>{sectionScore}</span>
                    <span className="text-[10px] text-gray-400">pts</span>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  {section.options.map((opt, idx) => {
                    const isSelected = singleSelections[section.id] === idx;
                    return (
                      <button key={idx} onClick={() => handleSingleSelect(section.id, idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${isSelected ? "bg-ebrora-light/60 border-ebrora/40 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-ebrora bg-ebrora" : "border-gray-300 bg-white"}`}>
                            {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          <span className={`text-sm ${isSelected ? "font-medium text-gray-900" : "text-gray-600"}`}>{opt.label}</span>
                        </div>
                        <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${isSelected ? "bg-ebrora/10 text-ebrora-dark" : "bg-gray-100 text-gray-400"}`}>{opt.weight}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Score breakdown */}
          {totalScore > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                {SCORING_SECTIONS.map(section => {
                  const score = sectionScores[section.id] || 0;
                  const maxSection = section.mode === "multi" ? section.options.reduce((a, o) => a + o.weight, 0) : Math.max(...section.options.map(o => o.weight));
                  const pct = maxSection > 0 ? (score / maxSection) * 100 : 0;
                  return (
                    <div key={section.id} className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-500 w-28 truncate">{section.title}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${score === 0 ? "bg-green-400" : pct > 60 ? "bg-red-400" : pct > 30 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-gray-600 w-8 text-right">{score}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700 w-28">TOTAL</span>
                  <div className="flex-1" />
                  <span className="text-sm font-bold tabular-nums text-gray-900">{totalScore}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-1">
                {CATEGORY_BANDS.map(band => {
                  const active = cat?.category === band.category;
                  return (
                    <div key={band.category} className={`flex-1 rounded-lg p-2 text-center border transition-all ${active ? `${band.colour} ${band.borderColour} border-2 shadow-sm` : "bg-gray-50 border-gray-100"}`}>
                      <div className={`text-xs font-bold ${active ? band.textColour : "text-gray-400"}`}>{band.category}</div>
                      <div className={`text-[10px] ${active ? band.textColour : "text-gray-300"}`}>{band.minScore}-{band.maxScore > 100 ? "34+" : band.maxScore}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Requirements — READ-ONLY reference list */}
          {cat && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className={`px-4 py-3 ${cat.colour} ${cat.borderColour} border-b`}>
                <h3 className={`text-sm font-bold ${cat.textColour}`}>{cat.category} Requirements — {cat.label}</h3>
                <p className={`text-[11px] mt-0.5 opacity-70 ${cat.textColour}`}>{REQUIREMENT_LABELS.length} requirements to be addressed in the RAMS and confined space permit.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {REQUIREMENT_LABELS.map(rl => {
                  const req = CATEGORY_REQUIREMENTS[cat.category][rl.key];
                  return (
                    <div key={rl.key} className="px-4 py-3 flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded border-2 border-gray-200 bg-gray-50 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{rl.label}</span>
                        <p className="text-sm mt-0.5 text-gray-700">{req}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk-specific additional controls */}
          {cat && activeRiskControls.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                <h3 className="text-sm font-bold text-amber-800">Risk-Specific Additional Controls</h3>
                <p className="text-[11px] mt-0.5 text-amber-700 opacity-70">Per Confined Spaces Regulations 1997, L101 ACOP, and Water UK Guidance. In addition to {cat.category} requirements above.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {activeRiskControls.map(rsc => (
                  <div key={rsc.riskLabel} className="p-4">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">{rsc.riskLabel}</div>
                    <div className="space-y-1.5">
                      {rsc.controls.map((ctrl, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <div className="mt-1 w-3 h-3 rounded border border-gray-200 bg-gray-50 flex-shrink-0" />
                          <span>{ctrl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100"><p className="text-[11px] text-gray-400 leading-relaxed max-w-xl">
        Confined space categorisation per the Confined Spaces Regulations 1997, HSE L101 ACOP, Water UK Occasional Guidance Notes, and City &amp; Guilds 6160 framework. Requirements and risk-specific controls must be addressed in the RAMS and confined space permit before entry. White-label PDF.</p></div>
    </div>
  );
}
