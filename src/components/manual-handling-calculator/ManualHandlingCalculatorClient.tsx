// src/components/manual-handling-calculator/ManualHandlingCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  HANDLING_TYPES,
  TASK_LIBRARY,
  TASK_CATEGORIES,
  MAC_FACTORS,
  RAPP_FACTORS,
  RISK_BANDS,
  HSE_COLORS,
  getRiskBand,
  type HandlingType,
  type TaskDefinition,
  type ScoringFactor,
  type ScoringOption,
  type RiskBand,
} from "@/data/manual-handling-calculator";
import {
  calculateScore,
  getFactorsForType,
  getRelevantControls,
  type AssessmentScore,
} from "@/lib/manual-handling-calculator/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Icons ───────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return <svg className={cn("w-4 h-4 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
}
function InfoIcon() {
  return <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
}

// ─── Task Search Combobox ────────────────────────────────────────
function TaskCombobox({ value, onChange }: { value: string; onChange: (name: string, task: TaskDefinition | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const result: Record<string, TaskDefinition[]> = {};
    for (const task of TASK_LIBRARY) {
      if (q && !task.name.toLowerCase().includes(q) && !task.category.toLowerCase().includes(q)) continue;
      if (!result[task.category]) result[task.category] = [];
      result[task.category].push(task);
    }
    return result;
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? search : value}
        placeholder="Search tasks or type custom…"
        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors"
        onFocus={() => { setOpen(true); setSearch(""); }}
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && search.trim()) {
            onChange(search.trim(), null);
            setOpen(false);
            setSearch("");
          }
        }}
      />
      {open && (
        <div className="absolute z-[200] mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
          {search.trim() && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-ebrora font-medium hover:bg-ebrora-light border-b border-gray-100"
              onClick={() => { onChange(search.trim(), null); setOpen(false); setSearch(""); }}
            >
              Use custom: &quot;{search.trim()}&quot;
            </button>
          )}
          {Object.entries(grouped).length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">No tasks found</div>
          ) : (
            Object.entries(grouped).map(([cat, tasks]) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 sticky top-0">{cat}</div>
                {tasks.map((t) => (
                  <button
                    key={t.name}
                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light transition-colors", t.name === value ? "bg-ebrora-light font-medium text-ebrora-dark" : "text-gray-700")}
                    onClick={() => { onChange(t.name, t); setOpen(false); setSearch(""); }}
                  >
                    <div>{t.name}</div>
                    {t.notes && <div className="text-[11px] text-gray-400 mt-0.5">{t.notes}</div>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Factor Dropdown with HSE Colours ────────────────────────────
function FactorSelect({ factor, value, onChange }: { factor: ScoringFactor; value: number | null; onChange: (v: number | null) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const selected = value !== null ? factor.options[value] : null;
  const hseColor = selected ? HSE_COLORS[selected.color] : null;

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{factor.label}</label>
          {factor.tooltip && (
            <div className="relative">
              <button onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} className="p-0.5"><InfoIcon /></button>
              {showTooltip && (
                <div className="absolute z-50 bottom-full left-0 mb-1 w-64 p-2.5 bg-gray-900 text-white text-[11px] rounded-lg shadow-lg leading-relaxed">
                  {factor.tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
          className="w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors"
          style={hseColor ? { borderColor: hseColor.border, backgroundColor: hseColor.bg + "66", color: hseColor.text } : { borderColor: "#e5e7eb", backgroundColor: "#eff6ff66", color: "#9ca3af" }}
        >
          <option value="">Select…</option>
          {factor.options.map((opt, i) => (
            <option key={i} value={i}>{opt.label} ({opt.points} pts)</option>
          ))}
        </select>
      </div>
      {/* HSE colour dot */}
      {selected && (
        <div className="mt-7 flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: hseColor?.text, borderColor: hseColor?.border }} />
          <span className="text-[10px] font-bold tabular-nums" style={{ color: hseColor?.text }}>{selected.points}</span>
        </div>
      )}
    </div>
  );
}

// ─── Score Display ───────────────────────────────────────────────
function ScoreDisplay({ score, label }: { score: AssessmentScore; label?: string }) {
  const band = score.riskBand;
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: band.borderColor }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: band.bgColor }}>
        <div>
          {label && <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{label}</div>}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums" style={{ color: band.color }}>{score.overallScore}</span>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: band.textColor }}>{band.label}</span>
          </div>
          {score.activeMethod === "BOTH" && (
            <div className="text-xs text-gray-500 mt-1">
              MAC: {score.macTotal} · RAPP: {score.rappTotal} · Worst case used
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center" style={{ borderColor: band.color }}>
          <span className="text-lg font-bold" style={{ color: band.color }}>{score.overallScore}</span>
        </div>
      </div>
      <div className="px-4 py-3 bg-white">
        <p className="text-sm text-gray-700 leading-relaxed">{band.action}</p>
      </div>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { project: string; location: string; taskName: string; loadDescription: string; handlingTypes: HandlingType[]; assessedBy: string; date: string; supervisor: string; reviewDate: string },
  score: AssessmentScore,
  controls: string[],
  customControls: string,
  rescoreScore: AssessmentScore | null,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  let y = M;

  // ── Title bar
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("MANUAL HANDLING RISK ASSESSMENT", M, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Combined MAC + RAPP Assessment — Manual Handling Operations Regulations 1992", M, 17);
  doc.setFontSize(7);
  doc.text("ebrora.com/tools/manual-handling-calculator", M, 22);
  y = 32;
  doc.setTextColor(0, 0, 0);

  // ── Header fields
  const htLabels = header.handlingTypes.map(t => HANDLING_TYPES.find(h => h.id === t)?.label || t).join(", ");
  const fields = [
    ["Project / Site:", header.project, "Location:", header.location],
    ["Task:", header.taskName, "Handling type:", htLabels],
    ["Load / item:", header.loadDescription, "", ""],
    ["Assessed by:", header.assessedBy, "Date:", header.date],
    ["Supervisor:", header.supervisor, "Review date:", header.reviewDate],
  ];
  doc.setFontSize(8);
  fields.forEach(([l1, v1, l2, v2]) => {
    doc.setFont("helvetica", "bold");
    doc.text(l1, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(v1 || "—", M + 24, y);
    if (l2) {
      doc.setFont("helvetica", "bold");
      doc.text(l2, M + CW / 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(v2 || "—", M + CW / 2 + 24, y);
    }
    y += 4.5;
  });
  y += 2;

  // ── Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 4;

  // ── Factor scores table
  const renderFactors = (title: string, factors: typeof score.macFactors) => {
    if (factors.length === 0) return;
    if (y > 250) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, M, y);
    y += 5;

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(M, y - 3, CW, 5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("Factor", M + 2, y);
    doc.text("Selection", M + 45, y);
    doc.text("Points", M + CW - 12, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    factors.forEach(f => {
      if (y > 275) { doc.addPage(); y = M; }
      doc.text(f.factorLabel, M + 2, y);
      doc.text(f.selectedLabel || "—", M + 45, y);
      doc.text(f.selectedIndex !== null ? String(f.points) : "—", M + CW - 10, y);
      y += 4;
    });

    // Subtotal
    const total = factors.reduce((s, f) => s + f.points, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal", M + 2, y + 1);
    doc.text(String(total), M + CW - 10, y + 1);
    y += 6;
  };

  if (score.macFactors.length > 0) renderFactors("MAC SCORE (Lift / Carry / Team)", score.macFactors);
  if (score.rappFactors.length > 0) renderFactors("RAPP SCORE (Push / Pull)", score.rappFactors);

  // ── Overall score
  if (y > 250) { doc.addPage(); y = M; }
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 4;

  const band = score.riskBand;
  // Parse hex color
  const r = parseInt(band.color.slice(1, 3), 16);
  const g = parseInt(band.color.slice(3, 5), 16);
  const b = parseInt(band.color.slice(5, 7), 16);
  doc.setFillColor(r, g, b);
  doc.rect(M, y - 3, CW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`OVERALL RISK SCORE: ${score.overallScore}`, M + 3, y + 2);
  doc.setFontSize(9);
  doc.text(band.label, M + CW - 40, y + 2);
  y += 11;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const actionLines = doc.splitTextToSize(band.action, CW - 4);
  doc.text(actionLines, M + 2, y);
  y += actionLines.length * 3.5 + 3;

  if (score.activeMethod === "BOTH") {
    doc.setFontSize(7);
    doc.text(`MAC total: ${score.macTotal} | RAPP total: ${score.rappTotal} | Worst case used`, M + 2, y);
    y += 5;
  }

  // ── Re-score comparison
  if (rescoreScore) {
    if (y > 250) { doc.addPage(); y = M; }
    doc.setDrawColor(200, 200, 200);
    doc.line(M, y, W - M, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RE-SCORE AFTER CONTROLS", M, y);
    y += 5;
    const rb = rescoreScore.riskBand;
    const r2 = parseInt(rb.color.slice(1, 3), 16);
    const g2 = parseInt(rb.color.slice(3, 5), 16);
    const b2 = parseInt(rb.color.slice(5, 7), 16);
    doc.setFillColor(r2, g2, b2);
    doc.rect(M, y - 3, CW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`RE-SCORE: ${rescoreScore.overallScore} — ${rb.label}`, M + 3, y + 1.5);
    y += 9;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7.5);
    doc.text(`Improvement: ${score.overallScore} → ${rescoreScore.overallScore} (${score.overallScore - rescoreScore.overallScore} points reduced)`, M + 2, y);
    y += 6;
  }

  // ── Controls
  if (y > 250) { doc.addPage(); y = M; }
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONTROLS AND NOTES", M, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (controls.length > 0) {
    controls.forEach(c => {
      if (y > 275) { doc.addPage(); y = M; }
      doc.text(`• ${c}`, M + 2, y);
      y += 3.5;
    });
  }
  if (customControls.trim()) {
    if (y > 270) { doc.addPage(); y = M; }
    y += 1;
    const customLines = doc.splitTextToSize(customControls.trim(), CW - 4);
    doc.text(customLines, M + 2, y);
    y += customLines.length * 3.5;
  }
  if (controls.length === 0 && !customControls.trim()) {
    doc.text("No controls recorded.", M + 2, y);
    y += 4;
  }

  // ── Signature lines
  y = Math.max(y + 8, 245);
  if (y > 270) { doc.addPage(); y = 220; }
  doc.setDrawColor(180, 180, 180);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  // Left
  doc.line(M, y, M + 70, y);
  doc.text("Assessor signature", M, y + 4);
  // Right
  doc.line(M + CW - 70, y, M + CW, y);
  doc.text("Supervisor sign-off", M + CW - 70, y + 4);
  y += 10;
  doc.line(M, y, M + 40, y);
  doc.text("Date", M, y + 4);

  // ── Footer
  y = 282;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 3;
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text("This assessment uses simplified MAC and RAPP methodologies. It does not replace a detailed risk assessment under the Manual Handling Operations Regulations 1992.", M, y);
  y += 2.5;
  doc.text("If risk is Medium or High, improve controls and re-score. If High, stop and redesign before proceeding.", M, y);
  y += 2.5;
  doc.text(`Generated by ebrora.com/tools/manual-handling-calculator on ${new Date().toLocaleDateString("en-GB")}`, M, y);

  doc.save(`manual-handling-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function ManualHandlingCalculatorClient() {
  // Header
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [loadDescription, setLoadDescription] = useState("");
  const [handlingTypes, setHandlingTypes] = useState<HandlingType[]>([]);
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [supervisor, setSupervisor] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  // Scoring
  const [macSelections, setMacSelections] = useState<Record<string, number | null>>({});
  const [rappSelections, setRappSelections] = useState<Record<string, number | null>>({});

  // Controls
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [customControls, setCustomControls] = useState("");

  // Re-score
  const [showRescore, setShowRescore] = useState(false);
  const [rescoreMac, setRescoreMac] = useState<Record<string, number | null>>({});
  const [rescoreRapp, setRescoreRapp] = useState<Record<string, number | null>>({});

  // UI
  const [showMethodology, setShowMethodology] = useState(false);
  const [showDisqualified, setShowDisqualified] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { macFactors, rappFactors } = useMemo(() => getFactorsForType(handlingTypes), [handlingTypes]);
  const score = useMemo(() => calculateScore(handlingTypes, macSelections, rappSelections), [handlingTypes, macSelections, rappSelections]);
  const rescoreResult = useMemo(() => showRescore ? calculateScore(handlingTypes, rescoreMac, rescoreRapp) : null, [showRescore, handlingTypes, rescoreMac, rescoreRapp]);
  const relevantControls = useMemo(() => getRelevantControls(handlingTypes, macSelections, rappSelections), [handlingTypes, macSelections, rappSelections]);

  const hasAnySelection = Object.values(macSelections).some(v => v !== null) || Object.values(rappSelections).some(v => v !== null);
  const isComplete = handlingTypes.length > 0 && (score.macComplete || score.rappComplete) && hasAnySelection;

  const handleTaskSelect = useCallback((name: string, task: TaskDefinition | null) => {
    setTaskName(name);
    if (task) {
      setTaskCategory(task.category);
      setTaskNotes(task.notes);
      // Auto-suggest handling type but don't override existing selections
      if (handlingTypes.length === 0) {
        setHandlingTypes([task.suggestedType]);
      }
    } else {
      setTaskCategory("");
      setTaskNotes("");
    }
  }, [handlingTypes.length]);

  const toggleHandlingType = useCallback((ht: HandlingType) => {
    setHandlingTypes(prev => {
      const next = prev.includes(ht) ? prev.filter(t => t !== ht) : [...prev, ht];
      // Clear selections for removed methods
      if (!next.some(t => t === 'lift' || t === 'carry' || t === 'team')) {
        setMacSelections({});
        setRescoreMac({});
      }
      if (!next.includes('push-pull')) {
        setRappSelections({});
        setRescoreRapp({});
      }
      return next;
    });
  }, []);

  const toggleControl = useCallback((label: string) => {
    setSelectedControls(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  }, []);

  const startRescore = useCallback(() => {
    // Copy current selections as starting point
    setRescoreMac({ ...macSelections });
    setRescoreRapp({ ...rappSelections });
    setShowRescore(true);
  }, [macSelections, rappSelections]);

  const resetAll = useCallback(() => {
    setProject(""); setLocation(""); setTaskName(""); setTaskCategory(""); setTaskNotes("");
    setLoadDescription(""); setHandlingTypes([]); setAssessedBy(""); setAssessDate(todayISO());
    setSupervisor(""); setReviewDate(""); setMacSelections({}); setRappSelections({});
    setSelectedControls([]); setCustomControls(""); setShowRescore(false);
    setRescoreMac({}); setRescoreRapp({});
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPDF(
        { project, location, taskName, loadDescription, handlingTypes, assessedBy, date: assessDate, supervisor, reviewDate },
        score,
        selectedControls,
        customControls,
        rescoreResult,
      );
    } finally { setExporting(false); }
  }, [project, location, taskName, loadDescription, handlingTypes, assessedBy, assessDate, supervisor, reviewDate, score, selectedControls, customControls, rescoreResult]);

  // Text input helper
  const TI = ({ label, value, onChange: oc, placeholder, type, span }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; span?: number }) => (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type || "text"} value={value} onChange={e => oc(e.target.value)} placeholder={placeholder}
        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Methodology Banner ────────────────────────────────── */}
      <div className="border border-ebrora/20 rounded-xl overflow-hidden">
        <button onClick={() => setShowMethodology(!showMethodology)}
          className="w-full px-4 py-3 flex items-center justify-between bg-ebrora-light/60 hover:bg-ebrora-light transition-colors">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            <span className="text-sm font-bold text-ebrora-dark">HSE MAC & RAPP Methodology</span>
          </div>
          <Chevron open={showMethodology} />
        </button>
        {showMethodology && (
          <div className="px-4 py-4 bg-white space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              The Manual Handling Operations Regulations 1992 (as amended) require employers to assess manual handling tasks that cannot be avoided.
              This tool uses two HSE methodologies to score risk:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                <div className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">MAC — Manual handling Assessment Charts</div>
                <p className="text-xs text-gray-600">For <strong>lifting, lowering, carrying, and team handling</strong> tasks. Scores load weight, posture, grip, frequency, environment, and carry distance using HSE&apos;s traffic-light risk filter (Green → Amber → Red → Purple).</p>
              </div>
              <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                <div className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-1">RAPP — Risk Assessment of Pushing and Pulling</div>
                <p className="text-xs text-gray-600">For <strong>pushing and pulling</strong> tasks. Scores start force, sustained force, distance, hand height, floor conditions, and obstacles. Developed by HSE as a companion to the MAC tool.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(HSE_COLORS).map(([key, c]) => (
                <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold" style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.text }} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Assessment Header ────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Assessment Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TI label="Project / Site" value={project} onChange={setProject} placeholder="e.g. Salford WwTW" />
          <TI label="Location / Reference" value={location} onChange={setLocation} placeholder="e.g. Inlet works" />
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Name</label>
            <TaskCombobox value={taskName} onChange={handleTaskSelect} />
            {taskNotes && <p className="text-[11px] text-amber-600 mt-1">💡 {taskNotes}</p>}
          </div>

          {/* Handling Type Checkboxes */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Handling Type</label>
            <div className="flex flex-wrap gap-2">
              {HANDLING_TYPES.map(ht => (
                <label key={ht.id} className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                  handlingTypes.includes(ht.id)
                    ? "border-ebrora bg-ebrora-light/60 text-ebrora-dark font-medium"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                )}>
                  <input type="checkbox" checked={handlingTypes.includes(ht.id)} onChange={() => toggleHandlingType(ht.id)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-ebrora focus:ring-ebrora/30" />
                  {ht.label}
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/80 border border-gray-100">{ht.method}</span>
                </label>
              ))}
            </div>
            {taskCategory && (
              <p className="text-[11px] text-gray-400 mt-1.5">Category: {taskCategory} · Suggested: {HANDLING_TYPES.find(h => h.id === TASK_LIBRARY.find(t => t.name === taskName)?.suggestedType)?.label || "—"}</p>
            )}
          </div>

          <TI label="Load / Item Description" value={loadDescription} onChange={setLoadDescription} placeholder="e.g. 25 kg cement bag" span={2} />
          <TI label="Assessed By" value={assessedBy} onChange={setAssessedBy} placeholder="Your name" />
          <TI label="Date" value={assessDate} onChange={setAssessDate} type="date" />
          <TI label="Supervisor Sign-off" value={supervisor} onChange={setSupervisor} placeholder="Supervisor name" />
          <TI label="Review Date" value={reviewDate} onChange={setReviewDate} type="date" />
        </div>
      </div>

      {/* ── No handling type selected ─────────────────────────── */}
      {handlingTypes.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-sm text-gray-400">Select at least one handling type above to begin scoring.</p>
        </div>
      )}

      {/* ── MAC Section ───────────────────────────────────────── */}
      {macFactors.length > 0 && (
        <div className="border border-blue-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-700">
              MAC Score — {handlingTypes.filter(t => t !== 'push-pull').map(t => HANDLING_TYPES.find(h => h.id === t)?.label).join(", ")}
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {macFactors.map(f => (
              <FactorSelect key={f.id} factor={f} value={macSelections[f.id] ?? null}
                onChange={v => setMacSelections(prev => ({ ...prev, [f.id]: v }))} />
            ))}
          </div>
          {score.macFactors.some(f => f.selectedIndex !== null) && (
            <div className="px-4 py-2 border-t border-blue-100 bg-blue-50/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">MAC Subtotal</span>
              <span className="text-lg font-bold tabular-nums text-blue-800">{score.macTotal}</span>
            </div>
          )}
        </div>
      )}

      {/* ── RAPP Section ──────────────────────────────────────── */}
      {rappFactors.length > 0 && (
        <div className="border border-purple-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-purple-50/50 border-b border-purple-100">
            <div className="text-xs font-bold uppercase tracking-wide text-purple-700">RAPP Score — Push or Pull</div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rappFactors.map(f => (
              <FactorSelect key={f.id} factor={f} value={rappSelections[f.id] ?? null}
                onChange={v => setRappSelections(prev => ({ ...prev, [f.id]: v }))} />
            ))}
          </div>
          {score.rappFactors.some(f => f.selectedIndex !== null) && (
            <div className="px-4 py-2 border-t border-purple-100 bg-purple-50/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">RAPP Subtotal</span>
              <span className="text-lg font-bold tabular-nums text-purple-800">{score.rappTotal}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Overall Score ─────────────────────────────────────── */}
      {isComplete && <ScoreDisplay score={score} label="Overall Risk Score" />}

      {/* ── Controls ──────────────────────────────────────────── */}
      {isComplete && (
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Controls & Actions</div>

          {/* Suggested controls grouped by category */}
          {relevantControls.length > 0 && (
            <div className="space-y-3 mb-4">
              {(["engineering", "administrative", "ppe"] as const).map(cat => {
                const items = relevantControls.filter(c => c.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                      {cat === "engineering" ? "🔧 Engineering Controls" : cat === "administrative" ? "📋 Administrative Controls" : "🧤 PPE"}
                    </div>
                    <div className="space-y-1">
                      {items.map(c => (
                        <label key={c.label} className={cn(
                          "flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                          selectedControls.includes(c.label) ? "bg-ebrora-light/60 text-gray-800" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        )}>
                          <input type="checkbox" checked={selectedControls.includes(c.label)} onChange={() => toggleControl(c.label)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-ebrora focus:ring-ebrora/30 mt-0.5" />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Additional Controls / Notes</label>
            <textarea value={customControls} onChange={e => setCustomControls(e.target.value)}
              rows={3} placeholder="Enter any additional controls, notes, or actions…"
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors resize-y" />
          </div>
        </div>
      )}

      {/* ── Re-score ──────────────────────────────────────────── */}
      {isComplete && !showRescore && score.overallScore >= 10 && (
        <button onClick={startRescore}
          className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-sm font-medium text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          Re-score after applying controls
        </button>
      )}

      {showRescore && (
        <div className="border-2 border-amber-200 rounded-xl overflow-hidden bg-amber-50/30">
          <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-800">Re-Score After Controls</span>
            <button onClick={() => setShowRescore(false)} className="text-xs text-amber-600 hover:text-amber-800">Cancel</button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-[12px] text-amber-700/70 italic">Adjust the factors below to reflect conditions after your controls are applied.</p>
            {macFactors.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {macFactors.map(f => (
                  <FactorSelect key={f.id} factor={f} value={rescoreMac[f.id] ?? null}
                    onChange={v => setRescoreMac(prev => ({ ...prev, [f.id]: v }))} />
                ))}
              </div>
            )}
            {rappFactors.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rappFactors.map(f => (
                  <FactorSelect key={f.id} factor={f} value={rescoreRapp[f.id] ?? null}
                    onChange={v => setRescoreRapp(prev => ({ ...prev, [f.id]: v }))} />
                ))}
              </div>
            )}
            {rescoreResult && (
              <div className="grid sm:grid-cols-2 gap-3">
                <ScoreDisplay score={score} label="Before Controls" />
                <ScoreDisplay score={rescoreResult} label="After Controls" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleExport} disabled={!isComplete || exporting}
          className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            isComplete ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <div className="flex-1" />
        <a href="/manual-handling-builder" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ebrora bg-white border border-ebrora/30 rounded-lg hover:bg-ebrora-light transition-colors">
          Need a full assessment document? Try the AI Builder →
        </a>
        <button onClick={resetAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          Reset All
        </button>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on HSE MAC (INDG383) and RAPP (INDG478) methodologies. This is a quick supervisor assessment tool — it does not replace a detailed risk assessment under the Manual Handling Operations Regulations 1992 (as amended).
        </p>
        <a href="https://ebrora.gumroad.com/l/manual-handling-risk-score-calculator" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Download the offline Excel version →
        </a>
      </div>
    </div>
  );
}
