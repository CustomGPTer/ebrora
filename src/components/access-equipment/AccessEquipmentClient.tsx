// src/components/access-equipment/AccessEquipmentClient.tsx
"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  HEIGHT_BANDS,
  DURATION_BANDS,
  FREQUENCY_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUND_CONDITIONS,
  SPACE_CONSTRAINTS,
  CARRY_MATERIALS,
  SIDE_REACH,
  YES_NO,
  WIND_EXPOSURE,
  HIERARCHY_LABELS,
  type DropdownOption,
} from "@/data/access-equipment";
import {
  rankEquipment,
  isInputComplete,
  type SelectorInputs,
  type RankedEquipment,
} from "@/lib/access-equipment/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Icons ───────────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

// ─── Dropdown Component ──────────────────────────────────────────
function SelectorDropdown({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: DropdownOption[];
  value: number | null;
  onChange: (code: number | null) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
        className={cn(
          "w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors",
          value !== null
            ? "border-ebrora/30 bg-ebrora-light/40 text-gray-900 focus:border-ebrora focus:ring-1 focus:ring-ebrora/20"
            : "border-gray-200 bg-blue-50/40 text-gray-500 focus:border-ebrora focus:ring-1 focus:ring-ebrora/20"
        )}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Text Input Component ────────────────────────────────────────
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors"
      />
    </div>
  );
}

// ─── Result Card ─────────────────────────────────────────────────
function ResultCard({
  result,
  rank,
  showBreakdown,
  onToggleBreakdown,
}: {
  result: RankedEquipment;
  rank: number;
  showBreakdown: boolean;
  onToggleBreakdown: () => void;
}) {
  const eq = result.equipment;
  const hlevel = HIERARCHY_LABELS[eq.hierarchyLevel];
  const rankLabels = ["Best Choice", "Next Best", "Alternative"];
  const rankColors = [
    "border-emerald-300 bg-emerald-50/50",
    "border-blue-200 bg-blue-50/50",
    "border-gray-200 bg-gray-50/50",
  ];

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const sections = [
    { key: "training", label: "Training & Inspection", content: eq.training },
    { key: "justification", label: "Why This Option", content: eq.justification },
    { key: "notSuitable", label: "Not Suitable When", content: eq.notSuitableWhen },
    { key: "rescue", label: "Rescue Plan", content: eq.rescuePlan },
    { key: "tempWorks", label: "Temporary Works & Permits", content: eq.tempWorks },
  ];

  return (
    <div className={cn("border rounded-xl overflow-hidden transition-all", rankColors[rank])}>
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700">
              {rank + 1}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {rankLabels[rank]}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{eq.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                hlevel.bgColor, hlevel.color, hlevel.borderColor, "border"
              )}
            >
              <ShieldIcon />
              {hlevel.label}
            </span>
          </div>
        </div>
        <button
          onClick={onToggleBreakdown}
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors whitespace-nowrap"
        >
          {showBreakdown ? "Hide scoring" : "Show scoring"}
        </button>
      </div>

      {/* Scoring Breakdown */}
      {showBreakdown && (
        <div className="px-4 pb-3">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Scoring Breakdown
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1.5 text-xs mb-3">
              {([
                ["Height range", result.breakdown.heightMatch],
                ["Duration", result.breakdown.durationMatch],
                ["Frequency", result.breakdown.frequencyMatch],
                ["Environment", result.breakdown.environmentMatch],
                ["Ground", result.breakdown.groundMatch],
                ["Space", result.breakdown.spaceMatch],
                ["Materials", result.breakdown.carryMatch],
                ["Side reach", result.breakdown.reachMatch],
                ["Overhead", result.breakdown.overheadMatch],
                ["Wind", result.breakdown.windMatch],
              ] as [string, boolean][]).map(([label, pass]) => (
                <div key={label} className="flex items-center gap-1.5">
                  {pass ? <CheckIcon /> : <XIcon />}
                  <span className={pass ? "text-gray-700" : "text-red-500 font-medium"}>{label}</span>
                </div>
              ))}
            </div>
            {result.breakdown.penalties.length > 0 && (
              <div className="border-t border-gray-100 pt-2 space-y-1">
                {result.breakdown.penalties.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{p.reason}</span>
                    <span
                      className={cn(
                        "font-mono font-bold tabular-nums",
                        p.points > 0 ? "text-red-500" : "text-emerald-600"
                      )}
                    >
                      {p.points > 0 ? `+${p.points}` : p.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Hierarchy rank + adjustments</span>
              <span className="font-mono font-bold text-gray-900 tabular-nums">
                {result.breakdown.totalScore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detail Sections */}
      <div className="border-t border-gray-200/60">
        {sections.map((s) => (
          <div key={s.key} className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => toggleSection(s.key)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/60 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-600">{s.label}</span>
              <ChevronIcon open={!!expandedSections[s.key]} />
            </button>
            {expandedSections[s.key] && (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 leading-relaxed">{s.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Disqualified Equipment Row ──────────────────────────────────
function DisqualifiedRow({ result }: { result: RankedEquipment }) {
  const eq = result.equipment;
  const hlevel = HIERARCHY_LABELS[eq.hierarchyLevel];
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0" />
        <span className="text-sm font-medium text-gray-500 truncate">{eq.name}</span>
        <span className={cn("text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded", hlevel.bgColor, hlevel.color)}>
          {hlevel.label}
        </span>
      </div>
      <span className="text-[11px] text-red-500 shrink-0 text-right max-w-[200px] truncate" title={result.disqualifyReasons.join("; ")}>
        {result.disqualifyReasons[0]}
      </span>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  inputs: SelectorInputs,
  header: { project: string; location: string; task: string; assessedBy: string; date: string; supervisor: string; reviewDate: string },
  topResults: RankedEquipment[]
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const margin = 15;
  const cw = W - margin * 2;
  let y = margin;

  const addText = (text: string, x: number, maxW: number, fontSize: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
    y += lines.length * (fontSize * 0.45) + 1;
  };

  // Title
  doc.setFillColor(27, 87, 69); // ebrora green
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("WORKING AT HEIGHT", margin, 11);
  doc.setFontSize(11);
  doc.text("Access Equipment Selector — HSE Hierarchy Compliant", margin, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ebrora.com/tools/access-equipment-selector", margin, 24);
  y = 35;

  // Header fields
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const headerFields = [
    ["Project:", header.project, "Location:", header.location],
    ["Task:", header.task, "", ""],
    ["Assessed by:", header.assessedBy, "Date:", header.date],
    ["Supervisor:", header.supervisor, "Review date:", header.reviewDate],
  ];
  headerFields.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.text(row[0], margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(row[1] || "—", margin + 25, y);
    if (row[2]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[2], margin + cw / 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(row[3] || "—", margin + cw / 2 + 25, y);
    }
    y += 5;
  });
  y += 3;

  // Input summary
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SITE CONDITIONS", margin, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");

  const inputLabels: [string, DropdownOption[], number | null][] = [
    ["Working height", HEIGHT_BANDS, inputs.heightCode],
    ["Duration", DURATION_BANDS, inputs.durationCode],
    ["Frequency", FREQUENCY_OPTIONS, inputs.frequencyCode],
    ["Environment", ENVIRONMENT_OPTIONS, inputs.environmentCode],
    ["Ground", GROUND_CONDITIONS, inputs.groundCode],
    ["Space", SPACE_CONSTRAINTS, inputs.spaceCode],
    ["Materials", CARRY_MATERIALS, inputs.carryCode],
    ["Side reach", SIDE_REACH, inputs.reachCode],
    ["Overhead services", YES_NO, inputs.overheadCode],
    ["Wind exposure", WIND_EXPOSURE, inputs.windCode],
  ];

  // Two columns of inputs
  const colW = cw / 2;
  for (let i = 0; i < inputLabels.length; i += 2) {
    const [l1, opts1, v1] = inputLabels[i];
    const val1 = opts1.find((o) => o.code === v1)?.label || "—";
    doc.setFont("helvetica", "bold");
    doc.text(`${l1}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(val1, margin + 30, y);
    if (i + 1 < inputLabels.length) {
      const [l2, opts2, v2] = inputLabels[i + 1];
      const val2 = opts2.find((o) => o.code === v2)?.label || "—";
      doc.setFont("helvetica", "bold");
      doc.text(`${l2}:`, margin + colW, y);
      doc.setFont("helvetica", "normal");
      doc.text(val2, margin + colW + 30, y);
    }
    y += 4.5;
  }
  y += 3;

  // Results
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RECOMMENDED ACCESS EQUIPMENT (RANKED)", margin, y);
  y += 6;

  const rankLabels = ["OPTION 1 — BEST CHOICE", "OPTION 2 — NEXT BEST", "OPTION 3 — ALTERNATIVE"];

  topResults.slice(0, 3).forEach((r, idx) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const eq = r.equipment;
    doc.setFillColor(idx === 0 ? 232 : 245, idx === 0 ? 240 : 245, idx === 0 ? 236 : 245);
    doc.rect(margin, y - 3, cw, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(rankLabels[idx], margin + 2, y + 1);
    doc.text(eq.name.toUpperCase(), margin + cw / 2, y + 1);
    y += 8;

    const sections = [
      ["Training & inspection:", eq.training],
      ["Why this option:", eq.justification],
      ["Not suitable when:", eq.notSuitableWhen],
      ["Rescue plan:", eq.rescuePlan],
      ["Temporary works:", eq.tempWorks],
    ];

    sections.forEach(([label, content]) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(label, margin + 2, y);
      y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      addText(content, margin + 2, cw - 4, 7);
      y += 1.5;
    });
    y += 4;
  });

  // Footer
  if (y > 270) {
    doc.addPage();
    y = margin;
  }
  y = Math.max(y, 270);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 4;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("This assessment is decision-support guidance only. It does not replace a site-specific risk assessment, method statement, or competent person review.", margin, y);
  y += 3;
  doc.text(`Generated by ebrora.com/tools/access-equipment-selector on ${new Date().toLocaleDateString("en-GB")}`, margin, y);

  doc.save(`access-equipment-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function AccessEquipmentClient() {
  // Assessment header
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [task, setTask] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [supervisor, setSupervisor] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  // Selector inputs
  const [inputs, setInputs] = useState<SelectorInputs>({
    heightCode: null, durationCode: null, frequencyCode: null,
    environmentCode: null, groundCode: null, spaceCode: null,
    carryCode: null, reachCode: null, overheadCode: null,
    publicCode: null, trafficCode: null, windCode: null,
  });

  // UI state
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [showDisqualified, setShowDisqualified] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const complete = isInputComplete(inputs);
  const results = useMemo(() => rankEquipment(inputs), [inputs]);
  const eligible = results.filter((r) => r.eligible);
  const disqualified = results.filter((r) => !r.eligible);
  const top3 = eligible.slice(0, 3);

  const filledCount = Object.values(inputs).filter((v) => v !== null).length;
  const totalFields = 12;

  const updateInput = useCallback(
    (key: keyof SelectorInputs) => (code: number | null) => {
      setInputs((prev) => ({ ...prev, [key]: code }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setInputs({
      heightCode: null, durationCode: null, frequencyCode: null,
      environmentCode: null, groundCode: null, spaceCode: null,
      carryCode: null, reachCode: null, overheadCode: null,
      publicCode: null, trafficCode: null, windCode: null,
    });
    setProject("");
    setLocation("");
    setTask("");
    setAssessedBy("");
    setAssessDate(todayISO());
    setSupervisor("");
    setReviewDate("");
    setShowDisqualified(false);
    setBreakdownOpen({});
  }, []);

  const handleExport = useCallback(async () => {
    if (!complete || top3.length === 0) return;
    setExporting(true);
    try {
      await exportPDF(
        inputs,
        { project, location, task, assessedBy, date: assessDate, supervisor, reviewDate },
        top3
      );
    } finally {
      setExporting(false);
    }
  }, [inputs, project, location, task, assessedBy, assessDate, supervisor, reviewDate, top3, complete]);

  return (
    <div className="space-y-5">
      {/* ── HSE Hierarchy Banner ─────────────────────────────── */}
      <div className="border border-ebrora/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHierarchy(!showHierarchy)}
          className="w-full px-4 py-3 flex items-center justify-between bg-ebrora-light/60 hover:bg-ebrora-light transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldIcon />
            <span className="text-sm font-bold text-ebrora-dark">HSE Working at Height Hierarchy</span>
          </div>
          <ChevronIcon open={showHierarchy} />
        </button>
        {showHierarchy && (
          <div className="px-4 py-4 bg-white space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              The Work at Height Regulations 2005 require duty holders to follow a strict hierarchy when planning work at height.
              This tool ranks equipment in compliance with that hierarchy — collective protection always ranks above personal protection, and ladders are always the last resort.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {(["prevent", "minimise", "last-resort"] as const).map((level, i) => {
                const h = HIERARCHY_LABELS[level];
                return (
                  <div key={level} className={cn("border rounded-lg p-3", h.borderColor, h.bgColor)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                        level === "prevent" ? "bg-emerald-600" :
                        level === "minimise" ? "bg-amber-500" : "bg-red-500"
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn("text-xs font-bold uppercase tracking-wide", h.color)}>
                        {h.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{h.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Assessment Header ────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          Assessment Details
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TextInput label="Project" value={project} onChange={setProject} placeholder="e.g. Salford WwTW" />
          <TextInput label="Location" value={location} onChange={setLocation} placeholder="e.g. Near inlet works" />
          <div className="sm:col-span-2">
            <TextInput label="Task Description" value={task} onChange={setTask} placeholder="e.g. Accessing gutter on outbuilding for inspection" />
          </div>
          <TextInput label="Assessed By" value={assessedBy} onChange={setAssessedBy} placeholder="Your name" />
          <TextInput label="Date" value={assessDate} onChange={setAssessDate} type="date" />
          <TextInput label="Supervisor Sign-off" value={supervisor} onChange={setSupervisor} placeholder="Supervisor name" />
          <TextInput label="Review Date" value={reviewDate} onChange={setReviewDate} type="date" />
        </div>
      </div>

      {/* ── Progress Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-ebrora rounded-full transition-all duration-300"
            style={{ width: `${(filledCount / totalFields) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-gray-500 tabular-nums whitespace-nowrap">
          {filledCount}/{totalFields} conditions set
        </span>
      </div>

      {/* ── Site Conditions Inputs ─────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          Site Conditions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <SelectorDropdown label="Working Height" options={HEIGHT_BANDS} value={inputs.heightCode} onChange={updateInput("heightCode")} hint="Platform height or highest reach" />
          <SelectorDropdown label="Task Duration" options={DURATION_BANDS} value={inputs.durationCode} onChange={updateInput("durationCode")} hint="Total time at height per shift" />
          <SelectorDropdown label="Frequency of Access" options={FREQUENCY_OPTIONS} value={inputs.frequencyCode} onChange={updateInput("frequencyCode")} />
          <SelectorDropdown label="Environment" options={ENVIRONMENT_OPTIONS} value={inputs.environmentCode} onChange={updateInput("environmentCode")} />
          <SelectorDropdown label="Ground Condition" options={GROUND_CONDITIONS} value={inputs.groundCode} onChange={updateInput("groundCode")} />
          <SelectorDropdown label="Space Constraint" options={SPACE_CONSTRAINTS} value={inputs.spaceCode} onChange={updateInput("spaceCode")} />
          <SelectorDropdown label="Carry Materials" options={CARRY_MATERIALS} value={inputs.carryCode} onChange={updateInput("carryCode")} hint="Tools or materials to work position" />
          <SelectorDropdown label="Side Reach Needed" options={SIDE_REACH} value={inputs.reachCode} onChange={updateInput("reachCode")} />
          <SelectorDropdown label="Overhead Services" options={YES_NO} value={inputs.overheadCode} onChange={updateInput("overheadCode")} hint="Pipes, cables, ducts above" />
          <SelectorDropdown label="Public Interface" options={YES_NO} value={inputs.publicCode} onChange={updateInput("publicCode")} />
          <SelectorDropdown label="Traffic Interface" options={YES_NO} value={inputs.trafficCode} onChange={updateInput("trafficCode")} />
          <SelectorDropdown label="Wind Exposure" options={WIND_EXPOSURE} value={inputs.windCode} onChange={updateInput("windCode")} />
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleExport}
          disabled={!complete || top3.length === 0 || exporting}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            complete && top3.length > 0
              ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid"
              : "text-gray-400 bg-gray-100 cursor-not-allowed"
          )}
        >
          <DownloadIcon />
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <div className="flex-1" />
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <ResetIcon />
          Reset All
        </button>
      </div>

      {/* ── Results ────────────────────────────────────────────── */}
      {!complete && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-sm text-gray-400">
            Complete all site conditions above to see ranked equipment recommendations.
          </p>
        </div>
      )}

      {complete && top3.length === 0 && (
        <div className="border-2 border-dashed border-red-200 rounded-xl py-10 text-center bg-red-50/50">
          <p className="text-sm text-red-600 font-medium">
            No equipment meets all the selected conditions. Consider revising the most restrictive inputs.
          </p>
        </div>
      )}

      {complete && top3.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((r, i) => {
              const hlevel = HIERARCHY_LABELS[r.equipment.hierarchyLevel];
              return (
                <div
                  key={r.equipment.id}
                  className={cn(
                    "border rounded-xl p-4 transition-all",
                    i === 0 ? "border-emerald-200 bg-emerald-50/50" :
                    i === 1 ? "border-blue-200 bg-blue-50/50" :
                    "border-gray-200 bg-gray-50/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-200 text-[10px] font-bold text-gray-700">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      {["Best", "Next", "Alt."][i]}
                    </span>
                  </div>
                  <div className="text-base font-bold text-gray-900 mb-1">{r.equipment.name}</div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide", hlevel.color)}>
                    {hlevel.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detail Cards */}
          <div className="space-y-4">
            {top3.map((r, i) => (
              <ResultCard
                key={r.equipment.id}
                result={r}
                rank={i}
                showBreakdown={!!breakdownOpen[i]}
                onToggleBreakdown={() => setBreakdownOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
              />
            ))}
          </div>

          {/* Disqualified Equipment */}
          {disqualified.length > 0 && (
            <div>
              <button
                onClick={() => setShowDisqualified(!showDisqualified)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronIcon open={showDisqualified} />
                {disqualified.length} equipment type{disqualified.length > 1 ? "s" : ""} not suitable
              </button>
              {showDisqualified && (
                <div className="mt-2 space-y-1.5">
                  {disqualified.map((r) => (
                    <DisqualifiedRow key={r.equipment.id} result={r} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          This tool is decision-support guidance aligned to the Work at Height Regulations 2005 hierarchy. It does not replace a site-specific risk assessment, method statement, or competent person review. Always verify equipment suitability with your site team.
        </p>
        <a
          href="https://ebrora.gumroad.com/l/access-equipment-selector"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors"
        >
          Download the offline Excel version →
        </a>
      </div>
    </div>
  );
}
