// src/components/ladder-stepladder-justification-tool/LadderStepladderJustificationToolClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  HIERARCHY_OPTIONS, calculateJustification, getOption,
  durationLabel, recurrenceLabel, locationLabel,
} from "@/data/ladder-stepladder-justification-tool";
import type {
  OptionId, OptionAnswer, PreAssessment, DurationBand, Recurrence, LocationType, JustificationResult,
} from "@/data/ladder-stepladder-justification-tool";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Progress Dots ──────────────────────────────────────────
function ProgressDots({ result, currentFocus }: { result: JustificationResult; currentFocus: OptionId | null }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {HIERARCHY_OPTIONS.map((opt, i) => {
        const audit = result.auditTrail.find(a => a.optionId === opt.id);
        const isSelected = audit?.selected === true;
        const isRejected = audit?.rejected === true;
        const isCurrent = currentFocus === opt.id || (!audit && result.auditTrail.length === i);

        let bg = "bg-gray-200", text = "text-gray-500", ring = "";
        if (isSelected) { bg = "bg-emerald-500"; text = "text-white"; ring = "ring-2 ring-emerald-300"; }
        else if (isRejected) { bg = "bg-red-100"; text = "text-red-700"; }
        else if (isCurrent) { bg = "bg-ebrora"; text = "text-white"; ring = "ring-2 ring-ebrora/30 animate-pulse"; }

        return (
          <div key={opt.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${bg} ${text} ${ring}`} title={opt.name}>
              {opt.rank}
            </div>
            {i < HIERARCHY_OPTIONS.length - 1 && (
              <div className={`w-3 sm:w-6 h-0.5 ${audit?.rejected || audit?.selected ? "bg-red-200" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SVG Audit Trail Flowchart ──────────────────────────────────
function AuditTrailFlowchart({ result }: { result: JustificationResult }) {
  const steps = result.auditTrail;
  if (steps.length === 0) return null;

  const nodeW = 260, nodeH = 44, gapY = 22, padX = 20, padY = 20;
  const totalH = (steps.length + 1) * (nodeH + gapY) - gapY + padY * 2;
  const totalW = nodeW + padX * 2;
  const cx = padX + nodeW / 2;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full h-auto" style={{ maxHeight: Math.min(totalH, 700), minHeight: 200 }}>
        <defs>
          <marker id="lsj-ar-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#1B5745" /></marker>
          <marker id="lsj-ar-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#DC2626" /></marker>
        </defs>

        {/* Start node */}
        <rect x={padX} y={padY} width={nodeW} height={nodeH} rx={12} fill="#1B5745" />
        <text x={cx} y={padY + nodeH / 2 + 3} textAnchor="middle" fontSize={11} fontWeight={700} fill="#FFFFFF">
          Work at Height Justification
        </text>
        <line x1={cx} y1={padY + nodeH} x2={cx} y2={padY + nodeH + gapY} stroke="#1B5745" strokeWidth={2.5} markerEnd="url(#lsj-ar-g)" />

        {steps.map((step, i) => {
          const y2 = padY + (i + 1) * (nodeH + gapY);
          const opt = getOption(step.optionId);
          const isSelected = step.selected;
          const isRejected = step.rejected;

          const fill = isSelected ? "#16A34A" : isRejected ? "#FEE2E2" : "#E5E7EB";
          const textFill = isSelected ? "#FFFFFF" : isRejected ? "#991B1B" : "#6B7280";
          const stroke = isSelected ? "#15803D" : isRejected ? "#DC2626" : "#9CA3AF";

          const lineColour = isSelected ? "#16A34A" : "#DC2626";
          const marker = isSelected ? "url(#lsj-ar-g)" : "url(#lsj-ar-r)";

          const connector = i < steps.length - 1 || result.status === "no-viable-option" ? (
            <line x1={cx} y1={y2 + nodeH} x2={cx} y2={y2 + nodeH + gapY}
              stroke={lineColour} strokeWidth={2} markerEnd={marker} />
          ) : null;

          const label = opt.shortName;
          const statusLabel = isSelected ? "SELECTED" : isRejected ? "REJECTED" : "PENDING";

          return (
            <g key={step.optionId + "-" + i}>
              {connector}
              <rect x={padX} y={y2} width={nodeW} height={nodeH} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
              <text x={padX + 10} y={y2 + 16} fontSize={10} fontWeight={700} fill={textFill}>
                {opt.rank}. {label}
              </text>
              <text x={padX + 10} y={y2 + 30} fontSize={8} fill={textFill}>
                {statusLabel}
              </text>
              {step.reasonText && (
                <text x={padX + 10} y={y2 + 40} fontSize={7} fill={textFill}>
                  {step.reasonText.length > 48 ? step.reasonText.slice(0, 46) + "..." : step.reasonText}
                </text>
              )}
            </g>
          );
        })}

        {/* Terminal — no viable option */}
        {result.status === "no-viable-option" && (
          <g>
            <rect x={padX} y={padY + (steps.length + 1) * (nodeH + gapY)} width={nodeW} height={nodeH} rx={22} fill="#DC2626" />
            <text x={cx} y={padY + (steps.length + 1) * (nodeH + gapY) + nodeH / 2 + 3} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF">
              NO VIABLE OPTION -- RE-DESIGN REQUIRED
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── PDF Export ──────────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  pre: PreAssessment,
  answers: OptionAnswer[],
  result: JustificationResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `LSJ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const statusRgb: Record<JustificationResult["status"], number[]> = {
    "justified-safer": [22, 163, 74],
    "justified-stepladder": [234, 179, 8],
    "justified-leaning-ladder": [249, 115, 22],
    "no-viable-option": [220, 38, 38],
    "incomplete": [100, 116, 139],
  };
  const rgb = statusRgb[result.status];
  const statusLabel: Record<JustificationResult["status"], string> = {
    "justified-safer": "SAFER METHOD JUSTIFIED",
    "justified-stepladder": "STEPLADDER JUSTIFIED",
    "justified-leaning-ladder": "LEANING LADDER JUSTIFIED",
    "no-viable-option": "NO VIABLE OPTION -- RE-DESIGN",
    "incomplete": "ASSESSMENT INCOMPLETE",
  };

  // ── Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("LADDER / STEPLADDER JUSTIFICATION", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Work at Height Regulations 2005 -- Access Hierarchy Assessment", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 15, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y, 45);
  drawFld("Site:", header.site, M + halfW, y, 45);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y, 40);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  y += 8;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("LADDER / STEPLADDER JUSTIFICATION (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Result Banner
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(statusLabel[result.status], M + 5, y + 7);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const resultSubtitle = result.justifiedOption
    ? `Selected access method: ${getOption(result.justifiedOption).name}`
    : result.status === "no-viable-option"
      ? "All 8 hierarchy options rejected -- task must be redesigned or specialist access engaged"
      : "Assessment in progress -- complete all rejected options";
  doc.text(resultSubtitle, M + 5, y + 12);
  doc.setTextColor(0, 0, 0); y += 22;

  // ── Task / Pre-Assessment Panel
  checkPage(40);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  const taskPanelH = 36;
  doc.roundedRect(M, y - 2, CW, taskPanelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Task Parameters", M + 4, y + 2); y += 6;

  const taskItems: [string, string][] = [
    ["Task Description", pre.taskDescription || "Not specified"],
    ["Working Height", `${pre.workingHeightM.toFixed(1)} m`],
    ["Task Duration", durationLabel(pre.durationBand)],
    ["Recurrence", recurrenceLabel(pre.recurrence)],
    ["Tool/Material Weight", `${pre.toolWeightKg} kg`],
    ["Location", locationLabel(pre.location)],
  ];
  taskItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const valueLines = doc.splitTextToSize(value, CW - 70);
    doc.text(valueLines[0], M + 55, y);
    doc.setTextColor(0, 0, 0);
    y += 4;
  });
  y += 4;

  // ── Pre-Assessment Warnings
  if (result.preAssessmentWarnings.length > 0) {
    // Pre-calculate actual height based on wrapped lines
    const wrappedWarnings = result.preAssessmentWarnings.map(w =>
      doc.splitTextToSize(w, CW - 8) as string[]
    );
    const totalLines = wrappedWarnings.reduce((sum, lines) => sum + lines.length, 0);
    const warnH = 6 + totalLines * 3.5 + result.preAssessmentWarnings.length + 4;

    checkPage(warnH + 4);
    doc.setFillColor(254, 243, 199); doc.setDrawColor(245, 158, 11);
    doc.roundedRect(M, y - 2, CW, warnH, 1.5, 1.5, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(146, 64, 14);
    doc.text("! Pre-Assessment Warnings", M + 4, y + 2); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    wrappedWarnings.forEach(lines => {
      lines.forEach((ln: string) => { doc.text(ln, M + 4, y); y += 3.5; });
      y += 1;
    });
    doc.setTextColor(0, 0, 0);
    y += 3;
  }

  // ── Audit Trail Table
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Hierarchy Audit Trail", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Each option considered in safest-first order. First 'Yes' = justified method.", M, y);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 4;

  const cols = [10, 52, 18, 75, 27];
  let cx = M;
  ["#", "Access Method", "Answer", "Reason / Justification", "Status"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4); cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  result.auditTrail.forEach((audit, ri) => {
    const opt = getOption(audit.optionId);
    const answerText = audit.answer === "yes" ? "YES" : audit.answer === "no" ? "NO" : "-";
    const statusText = audit.selected ? "SELECTED" : audit.rejected ? "REJECTED" : "PENDING";
    const statusFill = audit.selected ? [22, 163, 74] : audit.rejected ? [220, 38, 38] : [148, 163, 184];
    const reasonText = audit.reasonText || (audit.selected ? "This option selected as viable" : "Awaiting answer");
    const reasonLines = doc.splitTextToSize(reasonText, cols[3] - 4);
    const rowH = Math.max(7, reasonLines.length * 3 + 3);

    checkPage(rowH + 2);
    cx = M;
    const cells = [`${opt.rank}`, opt.shortName, answerText, "", ""];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], rowH, "FD"); }
      else { doc.rect(cx, y, cols[i], rowH, "D"); }
      if (i === 4) {
        doc.setFillColor(statusFill[0], statusFill[1], statusFill[2]);
        doc.rect(cx, y, cols[i], rowH, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
        doc.text(statusText, cx + 2, y + 4.5);
      } else if (i === 3) {
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
        doc.text(reasonLines, cx + 2, y + 4);
      } else {
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 1 ? "bold" : "normal"); doc.setFontSize(5.5);
        doc.text(t, cx + 2, y + 4.5);
      }
      cx += cols[i];
    });
    y += rowH;
  });
  y += 4;

  // ── Justified Option Details
  if (result.justifiedOption) {
    const opt = getOption(result.justifiedOption);

    // Spec Requirements
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`Requirements for ${opt.name}`, M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text(`Regulation: ${opt.regulation}`, M, y);
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 4;

    opt.specRequirements.forEach(spec => {
      checkPage(6);
      doc.setFontSize(7);
      const lines = doc.splitTextToSize(`- ${spec}`, CW - 4);
      lines.forEach((ln: string) => { doc.text(ln, M + 2, y); y += 3.5; });
    });
    y += 3;

    // Competence
    checkPage(10);
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Competence Requirement:", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    const compLines = doc.splitTextToSize(opt.competence, CW - 50);
    doc.text(compLines[0], M + 42, y);
    if (compLines.length > 1) {
      y += 3.5;
      compLines.slice(1).forEach((ln: string) => { doc.text(ln, M + 42, y); y += 3.5; });
    }
    y += 5;

    // Pre-Use Checklist
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Pre-Use Checklist", M, y); y += 5;

    opt.preUseChecklist.forEach(item => {
      checkPage(6);
      // Checkbox
      doc.setDrawColor(100, 100, 100); doc.setFillColor(255, 255, 255);
      doc.rect(M + 2, y - 3, 3, 3, "FD");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(item, CW - 10);
      doc.text(lines, M + 7, y);
      y += Math.max(3.5, lines.length * 3.5);
    });
    y += 4;

    // Max duration reminder for ladders
    if (result.laddersJustified) {
      checkPage(15);
      doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38);
      doc.roundedRect(M, y - 2, CW, 12, 1.5, 1.5, "FD");
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(153, 27, 27);
      doc.text("! Maximum 30-minute short-duration rule (HSE INDG455)", M + 4, y + 2);
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text("If the task cannot be completed within 30 minutes at one location, a working platform is required instead.", M + 4, y + 6);
      doc.setTextColor(0, 0, 0); y += 16;
    }
  }

  // ── No viable option advice
  if (result.status === "no-viable-option") {
    const advice = [
      "All 8 hierarchy options have been rejected. The task cannot proceed without a re-design.",
      "Options to consider:",
      "- Re-design the task to enable ground-level or pre-assembly working",
      "- Engage a specialist access contractor (e.g. IRATA rope access)",
      "- Modify the structure to provide permanent installed access (walkways, edge protection)",
      "- Re-scope the work to occur before structures are erected (e.g. cladding at ground level)",
    ];
    const adviceH = 8 + advice.length * 3.5 + 4;
    checkPage(adviceH + 4);
    doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38);
    doc.roundedRect(M, y - 2, CW, adviceH, 1.5, 1.5, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(153, 27, 27);
    doc.text("! No Viable Access Method Found", M + 4, y + 2); y += 6;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    advice.forEach(ln => {
      doc.text(ln, M + 4, y); y += 3.5;
    });
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  // ── Cross-references
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Related Ebrora Tools", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  [
    "Working at Height Calculator -- full fall risk scoring and control measures",
    "Access Equipment Selector -- detailed comparison of MEWP/tower/podium options",
    "Scaffold Load Calculator -- scaffold loading and tie check (BS EN 12811)",
  ].forEach(ref => {
    checkPage(4);
    doc.text(`- ${ref}`, M + 2, y); y += 3.5;
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
  doc.text("Assessed By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
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
      "Ladder/Stepladder Justification per Work at Height Regulations 2005. This is a decision-support tool -- it does not replace competent risk assessment.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`ladder-justification-${todayISO()}.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────
export default function LadderStepladderJustificationToolClient() {
  // Settings
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pre-assessment
  const [taskDescription, setTaskDescription] = useState("");
  const [workingHeightM, setWorkingHeightM] = useState<number>(2);
  const [durationBand, setDurationBand] = useState<DurationBand>("15-30");
  const [recurrence, setRecurrence] = useState<Recurrence>("one-off");
  const [toolWeightKg, setToolWeightKg] = useState<number>(2);
  const [location, setLocation] = useState<LocationType>("indoor");

  // Answers for each hierarchy option
  const [answers, setAnswers] = useState<OptionAnswer[]>(
    HIERARCHY_OPTIONS.map(o => ({
      optionId: o.id,
      answer: null,
      reasonId: null,
      customReason: "",
    }))
  );

  const pre: PreAssessment = { workingHeightM, durationBand, recurrence, toolWeightKg, location, taskDescription };

  const result = useMemo(() => calculateJustification(answers, pre),
    [answers, workingHeightM, durationBand, recurrence, toolWeightKg, location, taskDescription]);

  const updateAnswer = useCallback((optionId: OptionId, partial: Partial<OptionAnswer>) => {
    setAnswers(prev => prev.map(a => a.optionId === optionId ? { ...a, ...partial } : a));
  }, []);

  // Determine which option is currently in focus (first unanswered after a 'no', or none if terminated)
  const focusOptionId: OptionId | null = useMemo(() => {
    if (result.status !== "incomplete") return null;
    for (const opt of HIERARCHY_OPTIONS) {
      const ans = answers.find(a => a.optionId === opt.id);
      if (!ans || ans.answer === null) return opt.id;
      if (ans.answer === "yes") return null;
    }
    return null;
  }, [answers, result.status]);

  // Whether a particular option card should be interactive/unlocked
  const isCardUnlocked = useCallback((optionId: OptionId): boolean => {
    const idx = HIERARCHY_OPTIONS.findIndex(o => o.id === optionId);
    if (idx === 0) return true;
    for (let i = 0; i < idx; i++) {
      const ans = answers.find(a => a.optionId === HIERARCHY_OPTIONS[i].id);
      if (!ans || ans.answer === null) return false;
      if (ans.answer === "yes") return false;
    }
    return true;
  }, [answers]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, pre, answers, result); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, pre, answers, result]);

  const clearAll = useCallback(() => {
    setAnswers(HIERARCHY_OPTIONS.map(o => ({ optionId: o.id, answer: null, reasonId: null, customReason: "" })));
    setTaskDescription(""); setWorkingHeightM(2); setDurationBand("15-30");
    setRecurrence("one-off"); setToolWeightKg(2); setLocation("indoor");
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const justifiedOpt = result.justifiedOption ? getOption(result.justifiedOption) : null;
  const totalRejected = result.auditTrail.filter(a => a.rejected).length;

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Status",
            value: result.status === "justified-safer" ? "Safer Method"
              : result.status === "justified-stepladder" ? "Stepladder"
              : result.status === "justified-leaning-ladder" ? "Leaning Ladder"
              : result.status === "no-viable-option" ? "Re-Design"
              : "In Progress",
            sub: result.status === "incomplete" ? "Complete the hierarchy" : "Final determination",
            bgClass: result.status === "justified-safer" ? "bg-emerald-50"
              : result.status === "justified-stepladder" ? "bg-amber-50"
              : result.status === "justified-leaning-ladder" ? "bg-orange-50"
              : result.status === "no-viable-option" ? "bg-red-50"
              : "bg-slate-50",
            textClass: result.status === "justified-safer" ? "text-emerald-800"
              : result.status === "justified-stepladder" ? "text-amber-800"
              : result.status === "justified-leaning-ladder" ? "text-orange-800"
              : result.status === "no-viable-option" ? "text-red-800"
              : "text-slate-800",
            borderClass: result.status === "justified-safer" ? "border-emerald-200"
              : result.status === "justified-stepladder" ? "border-amber-200"
              : result.status === "justified-leaning-ladder" ? "border-orange-200"
              : result.status === "no-viable-option" ? "border-red-200"
              : "border-slate-200",
            dotClass: result.status === "justified-safer" ? "bg-emerald-500"
              : result.status === "justified-stepladder" ? "bg-amber-500"
              : result.status === "justified-leaning-ladder" ? "bg-orange-500"
              : result.status === "no-viable-option" ? "bg-red-500"
              : "bg-slate-500",
          },
          {
            label: "Justified Method",
            value: justifiedOpt ? justifiedOpt.shortName : "-",
            sub: justifiedOpt ? `Rank ${justifiedOpt.rank} of 8` : "Pending selection",
            bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500",
          },
          {
            label: "Options Rejected",
            value: `${totalRejected}`,
            sub: `of 8 in hierarchy`,
            bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500",
          },
          {
            label: "Ladders Justified?",
            value: result.laddersJustified ? "YES" : result.status === "incomplete" ? "-" : "NO",
            sub: result.laddersJustified ? "Strict rules apply -- see PDF" : result.status === "incomplete" ? "Assessment incomplete" : "Safer method required",
            bgClass: result.laddersJustified ? "bg-amber-50" : "bg-emerald-50",
            textClass: result.laddersJustified ? "text-amber-800" : "text-emerald-800",
            borderClass: result.laddersJustified ? "border-amber-200" : "border-emerald-200",
            dotClass: result.laddersJustified ? "bg-amber-500" : "bg-emerald-500",
          },
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

      {/* ── No Viable Option Warning ─────────────────────── */}
      {result.status === "no-viable-option" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">No Viable Access Method Found</div>
            <div className="text-xs text-red-800 mt-1">
              All 8 hierarchy options have been rejected. The task cannot proceed without re-design, specialist access (rope access), or modifying the structure to provide permanent installed access.
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
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting || result.status === "incomplete"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* ── Settings Panel (PAID: 5 columns) ───────────────── */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Company", v: company, s: setCompany },
            { l: "Site", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Assessed By", v: assessedBy, s: setAssessedBy },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.l}
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

      {/* ── Progress Dots ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-700">Hierarchy Progress</h3>
          <span className="text-[11px] text-gray-400">{result.auditTrail.filter(a => a.answer !== null).length} of 8 options considered</span>
        </div>
        <ProgressDots result={result} currentFocus={focusOptionId} />
      </div>

      {/* ── Pre-Assessment ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700">Task Pre-Assessment</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Task parameters used to raise pre-assessment warnings and guide the hierarchy</p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Task Description</label>
          <input type="text" value={taskDescription} onChange={e => setTaskDescription(e.target.value)}
            placeholder="e.g. Installing ceiling-mounted light fittings in office area"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Working Height (m)</label>
            <input type="number" value={workingHeightM} onChange={e => setWorkingHeightM(Math.max(0, parseFloat(e.target.value) || 0))}
              min={0} max={50} step={0.1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Task Duration</label>
            <select value={durationBand} onChange={e => setDurationBand(e.target.value as DurationBand)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              <option value="under-15">Under 15 minutes</option>
              <option value="15-30">15 - 30 minutes</option>
              <option value="30-60">30 - 60 minutes</option>
              <option value="1-4hr">1 - 4 hours</option>
              <option value="over-4hr">Over 4 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recurrence</label>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              <option value="one-off">One-off task</option>
              <option value="weekly">Weekly or less</option>
              <option value="daily">Daily</option>
              <option value="multi-daily">Multiple times per day</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tool/Material Weight (kg)</label>
            <input type="number" value={toolWeightKg} onChange={e => setToolWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
              min={0} max={100} step={0.5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
            <div className="flex gap-1.5">
              {([["indoor", "Indoor"], ["outdoor", "Outdoor"], ["mixed", "Mixed"]] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setLocation(val)}
                  className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    location === val ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Pre-assessment warnings */}
        {result.preAssessmentWarnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
            <div className="text-xs font-bold text-amber-900">! Pre-Assessment Warnings</div>
            {result.preAssessmentWarnings.map((w, i) => (
              <div key={i} className="text-[11px] text-amber-800 flex gap-2">
                <span className="font-bold">-</span><span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Hierarchy Cards (Single Page) ──────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Access Hierarchy Assessment</h3>
          <span className="text-[11px] text-gray-400">Work through in safest-first order. First "Yes" = justified method.</span>
        </div>

        {HIERARCHY_OPTIONS.map(opt => {
          const answer = answers.find(a => a.optionId === opt.id)!;
          const audit = result.auditTrail.find(a => a.optionId === opt.id);
          const unlocked = isCardUnlocked(opt.id);
          const isSelected = audit?.selected === true;
          const isRejected = audit?.rejected === true;
          const isFocus = focusOptionId === opt.id;

          const borderClass = isSelected ? "border-emerald-400 bg-emerald-50/50"
            : isRejected ? "border-red-200 bg-red-50/30"
            : isFocus ? "border-ebrora/40 bg-ebrora-light/20 ring-2 ring-ebrora/10"
            : unlocked ? "border-gray-200 bg-white"
            : "border-gray-100 bg-gray-50/50 opacity-60";

          return (
            <div key={opt.id} className={`border rounded-xl p-4 transition-all ${borderClass}`}>
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isSelected ? "bg-emerald-500 text-white"
                  : isRejected ? "bg-red-100 text-red-700"
                  : isFocus ? "bg-ebrora text-white"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {opt.rank}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-800">{opt.name}</h4>
                        {isSelected && <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">Selected</span>}
                        {isRejected && <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Rejected</span>}
                        {!unlocked && !isSelected && !isRejected && <span className="inline-flex items-center text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Locked</span>}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{opt.regulation}</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{opt.description}</p>

                  {/* Yes/No question and buttons */}
                  {unlocked && !isSelected && (
                    <div className="mt-3 space-y-3">
                      <div className="text-xs font-medium text-gray-700">{opt.question}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateAnswer(opt.id, { answer: "yes", reasonId: null, customReason: "" })}
                          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                            answer.answer === "yes"
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}>YES - This option is viable</button>
                        <button
                          onClick={() => updateAnswer(opt.id, { answer: "no" })}
                          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                            answer.answer === "no"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                          }`}>NO - Not viable</button>
                      </div>
                    </div>
                  )}

                  {/* No reasons dropdown */}
                  {answer.answer === "no" && isRejected && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Reason Not Viable (required)</div>
                      <div className="space-y-1.5">
                        {opt.noReasons.map(r => (
                          <label key={r.id} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name={`reason-${opt.id}`}
                              checked={answer.reasonId === r.id && !answer.customReason}
                              onChange={() => updateAnswer(opt.id, { reasonId: r.id, customReason: "" })}
                              className="mt-0.5 text-ebrora focus:ring-ebrora"
                            />
                            <span className="text-xs text-gray-700">{r.label}</span>
                          </label>
                        ))}
                        <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name={`reason-${opt.id}`}
                            checked={answer.reasonId === "custom"}
                            onChange={() => updateAnswer(opt.id, { reasonId: "custom" })}
                            className="mt-0.5 text-ebrora focus:ring-ebrora"
                          />
                          <span className="text-xs text-gray-700 font-medium">Other (specify below)</span>
                        </label>
                        {answer.reasonId === "custom" && (
                          <input
                            type="text"
                            value={answer.customReason}
                            onChange={e => updateAnswer(opt.id, { customReason: e.target.value })}
                            placeholder="Enter custom reason this option is not viable..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:border-ebrora outline-none"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected result */}
                  {isSelected && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-bold text-emerald-900">This is the justified access method</div>
                      <div className="text-[11px] text-emerald-800">All safer options above have been rejected. Use this method subject to the requirements below.</div>

                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-emerald-900 mb-1">Competence:</div>
                        <div className="text-[11px] text-emerald-800">{opt.competence}</div>
                      </div>

                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-emerald-900 mb-1">Specification & Requirements:</div>
                        <ul className="text-[11px] text-emerald-800 space-y-0.5">
                          {opt.specRequirements.map((s, i) => (
                            <li key={i} className="flex gap-2"><span className="font-bold">-</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-emerald-900 mb-1">Pre-Use Checklist:</div>
                        <ul className="text-[11px] text-emerald-800 space-y-1">
                          {opt.preUseChecklist.map((c, i) => (
                            <li key={i} className="flex gap-2"><span className="shrink-0 w-3 h-3 border border-emerald-400 rounded-sm mt-0.5" /><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>

                      {(opt.id === "stepladder" || opt.id === "leaning-ladder") && (
                        <div className="mt-2 bg-red-50 border border-red-300 rounded-lg p-2.5 text-[11px] text-red-800">
                          <strong>! 30-minute short-duration rule:</strong> If this task cannot be completed within 30 minutes at one location, a working platform is required instead.
                        </div>
                      )}

                      {opt.id === "stepladder" && (
                        <div className="mt-2 bg-blue-50 border border-blue-300 rounded-lg p-2.5 text-[11px] text-blue-800">
                          Note: Stepladder is justified, but a <strong>leaning ladder</strong> has NOT been justified for this task. Stepladders and leaning ladders are separate decisions.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Audit Trail Flowchart ──────────────────────────── */}
      {result.auditTrail.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Decision Audit Trail</h3>
          <p className="text-[11px] text-gray-400">Complete record of every option considered and the outcome of each decision.</p>
          <AuditTrailFlowchart result={result} />
        </div>
      )}

      {/* ── Cross References ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Related Tools</h3>
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ebrora" /> Working at Height Calculator -- full fall risk scoring</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ebrora" /> Access Equipment Selector -- detailed MEWP/tower/podium comparison</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ebrora" /> Scaffold Load Calculator -- scaffold loading and tie check</div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Decision-support tool for Work at Height Regulations 2005 hierarchy (Reg 6). Based on HSE INDG455, Ladder Association, PASMA, IPAF, and CISRS guidance.
          This tool records a justification trail -- it does not replace competent risk assessment or site-specific design.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
