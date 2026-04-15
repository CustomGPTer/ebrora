// src/components/working-time-regulations-calculator/WorkingTimeRegulationsCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateWTRCompliance,
  DAYS_OF_WEEK, DEFAULT_SHIFTS,
  fmtHours, ragColour, ragPdfRgb,
} from "@/data/working-time-regulations-calculator";
import type {
  WorkerAge, ReferencePeriod, AnnualLeaveMode, ShiftEntry, WTRResult, RAGStatus,
} from "@/data/working-time-regulations-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Weekly Hours Trend Line ─────────────────────────────────
function WeeklyHoursTrend({ result }: { result: WTRResult }) {
  const records = result.weeklyRecords;
  if (records.length < 2) return null;

  const W = 600, H = 200, PAD = { top: 25, right: 20, bottom: 35, left: 50 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxHrs = Math.max(55, ...records.map(r => r.totalHours)) * 1.1;
  const limit = result.workerAge === "young" ? 40 : 48;

  const xScale = (w: number) => PAD.left + ((w - 1) / (records.length - 1)) * cw;
  const yScale = (v: number) => PAD.top + ch - (v / maxHrs) * ch;

  const line = records.map((r, i) => `${i === 0 ? "M" : "L"}${xScale(r.weekNumber).toFixed(1)},${yScale(r.totalHours).toFixed(1)}`).join(" ");

  // Average line
  const avgY = yScale(result.averageWeeklyHours);
  const limitY = yScale(limit);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {[0, 10, 20, 30, 40, 50].filter(v => v <= maxHrs).map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}h</text>
        </g>
      ))}
      {/* Limit line */}
      <line x1={PAD.left} y1={limitY} x2={W - PAD.right} y2={limitY} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="6,3" />
      <text x={W - PAD.right - 2} y={limitY - 4} textAnchor="end" fontSize={8} fontWeight={600} fill="#EF4444">{limit}h limit</text>
      {/* Average line */}
      <line x1={PAD.left} y1={avgY} x2={W - PAD.right} y2={avgY} stroke="#3B82F6" strokeWidth={1} strokeDasharray="4,2" />
      <text x={W - PAD.right - 2} y={avgY + 10} textAnchor="end" fontSize={8} fill="#3B82F6">Avg: {result.averageWeeklyHours}h</text>
      {/* Area fill */}
      <path d={`${line} L${xScale(records[records.length - 1].weekNumber).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(1).toFixed(1)},${yScale(0).toFixed(1)} Z`}
        fill="rgba(27,87,69,0.08)" />
      {/* Line */}
      <path d={line} fill="none" stroke="#1B5745" strokeWidth={2} strokeLinejoin="round" />
      {/* Points for breach weeks */}
      {records.filter(r => r.totalHours > limit).map(r => (
        <circle key={r.weekNumber} cx={xScale(r.weekNumber)} cy={yScale(r.totalHours)} r={3.5} fill="#EF4444" stroke="white" strokeWidth={1.5} />
      ))}
      {/* X labels */}
      {records.filter((_, i) => i % Math.ceil(records.length / 10) === 0 || i === records.length - 1).map(r => (
        <text key={r.weekNumber} x={xScale(r.weekNumber)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">Wk {r.weekNumber}</text>
      ))}
      {/* Axis labels */}
      <text x={PAD.left - 10} y={PAD.top - 8} fontSize={10} fontWeight={600} fill="#6B7280">Hours</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="#6B7280">Reference Period (weeks)</text>
    </svg>
  );
}

// ─── SVG Compliance Bar Chart ────────────────────────────────────
function ComplianceBarChart({ result }: { result: WTRResult }) {
  const checks = result.complianceChecks;
  const W = 600, PAD = { top: 10, right: 20, bottom: 10, left: 200 };
  const barH = 24, gap = 6;
  const H = PAD.top + checks.length * (barH + gap) + PAD.bottom;
  const cw = W - PAD.left - PAD.right;

  const ragFill: Record<RAGStatus, string> = { green: "#22C55E", amber: "#EAB308", red: "#EF4444" };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: Math.max(200, checks.length * 35) }}>
      {checks.map((c, i) => {
        const y = PAD.top + i * (barH + gap);
        const fill = ragFill[c.status];
        return (
          <g key={c.id}>
            <text x={PAD.left - 6} y={y + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={500}>
              {c.requirement.length > 35 ? c.requirement.slice(0, 35) + "..." : c.requirement}
            </text>
            <rect x={PAD.left} y={y} width={cw} height={barH} fill="#F3F4F6" rx={4} />
            <rect x={PAD.left} y={y} width={cw} height={barH} fill={fill} rx={4} opacity={0.2} />
            <rect x={PAD.left} y={y} width={cw * (c.breach ? 0.3 : 1)} height={barH} fill={fill} rx={4} opacity={0.7} />
            <text x={PAD.left + 8} y={y + barH / 2 + 3} fontSize={9} fontWeight={700} fill="white">
              {c.breach ? "BREACH" : c.status === "amber" ? "ADVISORY" : "COMPLIANT"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  result: WTRResult,
  roleType: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `WTR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const overallRgb = ragPdfRgb(result.overallStatus);
  const statusLabel = result.overallStatus === "green" ? "COMPLIANT" : result.overallStatus === "amber" ? "ADVISORY" : "NON-COMPLIANT";

  // ── Dark header (PAID layout)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("WORKING TIME REGULATIONS ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Working Time Regulations 1998 (SI 1998/1833) as amended", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
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
  drawFld("Worker Role:", roleType || "", M + halfW, y, 30);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Working Time Regulations compliance assessment for ${header.site || "the above site"}. Worker type: ${result.workerAge === "young" ? "Young Worker (under 18)" : "Adult Worker"}. Role: ${roleType || "Not specified"}. Reference period: ${result.referencePeriod} weeks. Average weekly hours: ${result.averageWeeklyHours}h. Night worker: ${result.nightWorker.isNightWorker ? "Yes" : "No"}. Opt-out: ${result.optOutSigned ? "Signed" : "Not signed"}.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("WORKING TIME REGULATIONS ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Status Banner
  doc.setFillColor(overallRgb[0], overallRgb[1], overallRgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`WTR STATUS: ${statusLabel}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`${result.breachCount} breach${result.breachCount !== 1 ? "es" : ""} identified | Avg ${result.averageWeeklyHours}h/wk | ${result.referencePeriod}-week ref period`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Summary Panel
  checkPage(55);
  const summaryItems = [
    ["Worker Type", result.workerAge === "young" ? "Young Worker (under 18)" : "Adult Worker"],
    ["Role", roleType || "Not specified"],
    ["Reference Period", `${result.referencePeriod} weeks`],
    ["Average Weekly Hours", `${result.averageWeeklyHours}h`],
    ["Max Weekly Hours in Period", `${result.maxWeeklyHoursInPeriod}h`],
    ["Longest Shift", fmtHours(result.longestShiftHours)],
    ["Night Worker", result.nightWorker.isNightWorker ? "Yes" : "No"],
    ["Opt-Out Signed", result.optOutSigned ? "Yes" : "No"],
    ["Annual Leave Taken", `${result.annualLeave.actualDaysTaken} of ${result.annualLeave.proRataEntitlement ?? 28} days`],
    ["Breaches Found", `${result.breachCount}`],
    ["Overall Status", statusLabel],
  ];
  const panelH = 6 + summaryItems.length * 3.8 + 4;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value], si) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    if (si === summaryItems.length - 1) { doc.setTextColor(overallRgb[0], overallRgb[1], overallRgb[2]); }
    else if (si === summaryItems.length - 2 && result.breachCount > 0) { doc.setTextColor(220, 38, 38); }
    else { doc.setTextColor(17, 24, 39); }
    doc.setFont("helvetica", "bold"); doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 6;

  // ── Compliance Table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Compliance Assessment", M, y); y += 5;

  const cols = [55, 30, 35, 35, 27];
  let cx = M;
  ["Requirement", "Regulation", "Limit", "Actual", "Status"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(h, cx + 2, y + 4); cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  result.complianceChecks.forEach((check, ri) => {
    checkPage(8);
    cx = M;
    const statusText = check.breach ? "BREACH" : check.status === "amber" ? "ADVISORY" : "COMPLIANT";
    const statusRgb = ragPdfRgb(check.status);
    const cells = [
      check.requirement.length > 40 ? check.requirement.slice(0, 40) + "..." : check.requirement,
      check.regulation,
      check.limit.length > 25 ? check.limit.slice(0, 25) + "..." : check.limit,
      check.actual.length > 25 ? check.actual.slice(0, 25) + "..." : check.actual,
      statusText,
    ];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 7, "FD"); }
      else { doc.rect(cx, y, cols[i], 7, "D"); }
      if (i === 4) {
        // Status cell with colour
        doc.setFillColor(statusRgb[0], statusRgb[1], statusRgb[2]);
        doc.rect(cx, y, cols[i], 7, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
        doc.text(t, cx + 2, y + 4.5);
      } else {
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
        const lines = doc.splitTextToSize(t, cols[i] - 3);
        doc.text(lines[0], cx + 2, y + 4.5);
      }
      cx += cols[i];
    });
    y += 7;
  });
  y += 4;

  // ── Corrective Actions (only for breaches)
  const breaches = result.complianceChecks.filter(c => c.breach || c.status === "amber");
  if (breaches.length > 0) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Corrective Actions", M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    breaches.forEach(b => {
      checkPage(12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
      doc.text(`${b.requirement}:`, M + 2, y); y += 3.5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      const lines = doc.splitTextToSize(b.correctiveAction, CW - 6);
      lines.forEach((line: string) => {
        checkPage(4);
        doc.text(line, M + 4, y); y += 3;
      });
      y += 2;
    });
    y += 2;
  }

  // ── Weekly Hours Chart in PDF
  checkPage(65);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(`Weekly Hours Trend (${result.referencePeriod}-week reference period)`, M, y);
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Shows actual weekly hours across the reference period. Red dots indicate weeks exceeding the limit.", M, y + 4);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 8;

  {
    const records = result.weeklyRecords;
    const chartX = M + 12, chartW2 = CW - 24, chartH2 = 40;
    const chartY2 = y;
    const limit = result.workerAge === "young" ? 40 : 48;
    const maxHrs = Math.max(55, ...records.map(r => r.totalHours)) * 1.1;

    doc.setFillColor(248, 250, 252); doc.rect(chartX, chartY2, chartW2, chartH2, "F");
    doc.setDrawColor(220, 220, 220); doc.setFontSize(5); doc.setTextColor(130, 130, 130);

    // Y grid
    for (let v = 0; v <= maxHrs; v += 10) {
      const yp = chartY2 + chartH2 - (v / maxHrs) * chartH2;
      doc.line(chartX, yp, chartX + chartW2, yp);
      doc.text(`${v}h`, chartX - 7, yp + 1.5);
    }

    // Limit line
    const limitYp = chartY2 + chartH2 - (limit / maxHrs) * chartH2;
    doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.4);
    doc.line(chartX, limitYp, chartX + chartW2, limitYp);
    doc.setFontSize(5); doc.setTextColor(220, 38, 38);
    doc.text(`${limit}h limit`, chartX + chartW2 - 12, limitYp - 1.5);

    // Line
    doc.setDrawColor(27, 87, 69); doc.setLineWidth(0.5);
    for (let i = 1; i < records.length; i++) {
      const x1 = chartX + ((records[i - 1].weekNumber - 1) / (records.length - 1)) * chartW2;
      const y1 = chartY2 + chartH2 - (records[i - 1].totalHours / maxHrs) * chartH2;
      const x2 = chartX + ((records[i].weekNumber - 1) / (records.length - 1)) * chartW2;
      const y2v = chartY2 + chartH2 - (records[i].totalHours / maxHrs) * chartH2;
      doc.line(x1, y1, x2, y2v);
    }

    // Breach dots
    records.filter(r => r.totalHours > limit).forEach(r => {
      const px = chartX + ((r.weekNumber - 1) / (records.length - 1)) * chartW2;
      const py = chartY2 + chartH2 - (r.totalHours / maxHrs) * chartH2;
      doc.setFillColor(220, 38, 38); doc.circle(px, py, 1, "F");
    });

    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = chartY2 + chartH2 + 8;
  }

  // ── Recommendations
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    lines.forEach((line: string) => { doc.text(line, M + 2, y); y += 3.5; });
  });
  y += 4;

  // ── Record Keeping Obligations
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Record-Keeping Obligations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const recordKeeping = [
    "Maintain records of actual hours worked by each worker (Reg 9 WTR 1998)",
    "Records must be kept for a minimum of 2 years from the date they relate to",
    "If opt-out agreements are in place, maintain a register of all workers who have opted out",
    "Night worker health assessment records must be maintained",
    "Annual leave records showing entitlement and days taken per leave year",
    "Records must be available for inspection by enforcement officers (HSE/local authority)",
  ];
  recordKeeping.forEach(item => {
    checkPage(5);
    const lines = doc.splitTextToSize(`- ${item}`, CW - 4);
    lines.forEach((line: string) => { doc.text(line, M + 2, y); y += 3.5; });
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
      "Working Time Regulations 1998 compliance assessment. This is a screening tool -- it does not constitute legal advice. Seek specialist guidance for complex cases.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`wtr-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function WorkingTimeRegulationsCalculatorClient() {
  // Settings (PAID layout: 5 columns)
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Inputs
  const [workerAge, setWorkerAge] = useState<WorkerAge>("adult");
  const [roleType, setRoleType] = useState("General Operative");
  const [referencePeriod, setReferencePeriod] = useState<ReferencePeriod>(17);
  const [optOutSigned, setOptOutSigned] = useState(false);
  const [specialHazard, setSpecialHazard] = useState(false);
  const [shifts, setShifts] = useState<ShiftEntry[]>(DEFAULT_SHIFTS.map(s => ({ ...s })));
  const [annualLeaveMode, setAnnualLeaveMode] = useState<AnnualLeaveMode>("simple");
  const [actualLeaveDays, setActualLeaveDays] = useState(20);
  const [leaveYearStart, setLeaveYearStart] = useState(`${new Date().getFullYear()}-01-01`);

  // Custom shifts
  const addShift = useCallback(() => {
    setShifts(prev => [...prev, {
      id: `shift-${Date.now()}`,
      day: "Custom",
      startTime: "08:00",
      endTime: "18:00",
      breakMinutes: 60,
      enabled: true,
    }]);
  }, []);

  const removeShift = useCallback((id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateShift = useCallback((id: string, field: keyof ShiftEntry, value: string | number | boolean) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  // Calculate
  const result = useMemo(() =>
    calculateWTRCompliance(
      workerAge, roleType, shifts, referencePeriod,
      optOutSigned, specialHazard,
      annualLeaveMode, actualLeaveDays, leaveYearStart, assessDate,
    ),
    [workerAge, roleType, shifts, referencePeriod, optOutSigned, specialHazard, annualLeaveMode, actualLeaveDays, leaveYearStart, assessDate]
  );

  const overall = ragColour(result.overallStatus);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, result, roleType); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, result, roleType]);

  const clearAll = useCallback(() => {
    setWorkerAge("adult"); setRoleType("General Operative"); setReferencePeriod(17);
    setOptOutSigned(false); setSpecialHazard(false);
    setShifts(DEFAULT_SHIFTS.map(s => ({ ...s })));
    setAnnualLeaveMode("simple"); setActualLeaveDays(20);
    setLeaveYearStart(`${new Date().getFullYear()}-01-01`);
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Avg Weekly Hours", value: `${result.averageWeeklyHours}h`, sub: `${result.referencePeriod}-week reference period`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Compliance", value: overall.label, sub: `${result.complianceChecks.length} requirements checked`, bgClass: overall.bg, textClass: overall.text, borderClass: overall.border, dotClass: overall.dot },
          { label: "Breaches", value: `${result.breachCount}`, sub: result.breachCount === 0 ? "No action required" : "Corrective action needed", bgClass: result.breachCount > 0 ? "bg-red-50" : "bg-emerald-50", textClass: result.breachCount > 0 ? "text-red-800" : "text-emerald-800", borderClass: result.breachCount > 0 ? "border-red-200" : "border-emerald-200", dotClass: result.breachCount > 0 ? "bg-red-500" : "bg-emerald-500" },
          { label: "Worker Type", value: workerAge === "young" ? "Under 18" : "Adult", sub: roleType, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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

      {/* ── Breach Warning ─────────────────────────────────── */}
      {result.breachCount > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">{result.breachCount} WTR Breach{result.breachCount > 1 ? "es" : ""} Identified</div>
            <div className="text-xs text-red-800 mt-1">
              {result.complianceChecks.filter(c => c.breach).map(c => c.requirement).join("; ")}. See corrective actions below.
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
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
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

      {/* ── Worker & Reference Input ───────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
        <h3 className="text-sm font-bold text-gray-700">Worker Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Worker Age */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Worker Age</label>
            <div className="flex gap-2">
              {([["adult", "Adult (18+)"], ["young", "Under 18"]] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setWorkerAge(val)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    workerAge === val ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Role Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Role / Job Title</label>
            <input type="text" value={roleType} onChange={e => setRoleType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>

          {/* Reference Period */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reference Period</label>
            <div className="flex gap-1.5">
              {([17, 26, 52] as ReferencePeriod[]).map(p => (
                <button key={p} onClick={() => setReferencePeriod(p)}
                  className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    referencePeriod === p ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}>{p}wk</button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Options</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={optOutSigned} onChange={e => setOptOutSigned(e.target.checked)}
                className="rounded border-gray-300 text-ebrora focus:ring-ebrora" />
              <span className="text-xs text-gray-700">48hr opt-out signed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={specialHazard} onChange={e => setSpecialHazard(e.target.checked)}
                className="rounded border-gray-300 text-ebrora focus:ring-ebrora" />
              <span className="text-xs text-gray-700">Special hazard night work</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Shift Pattern ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-700">Shift Pattern</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Enter shift times. Night worker status is calculated automatically from shift hours falling between 23:00-06:00.</p>
          </div>
          <button onClick={addShift}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-ebrora bg-ebrora-light/40 rounded-lg hover:bg-ebrora-light transition-colors">
            + Add Shift
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 pr-2 w-8"></th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Day</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Start</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">End</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Break (min)</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Net Hours</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2 pl-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => {
                const grossHrs = s.enabled && s.startTime && s.endTime
                  ? (() => {
                      const startParts = s.startTime.split(":");
                      const endParts = s.endTime.split(":");
                      let startH = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
                      let endH = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
                      if (endH <= startH) endH += 24;
                      return Math.max(0, endH - startH - s.breakMinutes / 60);
                    })()
                  : 0;

                return (
                  <tr key={s.id} className={`border-b border-gray-50 ${!s.enabled ? "opacity-40" : ""}`}>
                    <td className="py-1.5 pr-2">
                      <input type="checkbox" checked={s.enabled} onChange={e => updateShift(s.id, "enabled", e.target.checked)}
                        className="rounded border-gray-300 text-ebrora focus:ring-ebrora" />
                    </td>
                    <td className="py-1.5 px-2">
                      {DAYS_OF_WEEK.includes(s.day as typeof DAYS_OF_WEEK[number]) ? (
                        <span className="text-sm font-medium text-gray-700">{s.day}</span>
                      ) : (
                        <input type="text" value={s.day} onChange={e => updateShift(s.id, "day", e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:border-ebrora outline-none" />
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="time" value={s.startTime} onChange={e => updateShift(s.id, "startTime", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:border-ebrora outline-none" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="time" value={s.endTime} onChange={e => updateShift(s.id, "endTime", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:border-ebrora outline-none" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" value={s.breakMinutes} onChange={e => updateShift(s.id, "breakMinutes", parseInt(e.target.value) || 0)}
                        min={0} max={240} step={5}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:border-ebrora outline-none" />
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="text-xs font-bold text-gray-700">{fmtHours(grossHrs)}</span>
                    </td>
                    <td className="py-1.5 pl-2 text-right">
                      {!DAYS_OF_WEEK.includes(s.day as typeof DAYS_OF_WEEK[number]) && (
                        <button onClick={() => removeShift(s.id)}
                          className="text-red-400 hover:text-red-600 text-xs">x</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Weekly total */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weekly Total (from pattern)</span>
          <span className="text-sm font-bold text-gray-800">
            {fmtHours(shifts.filter(s => s.enabled && s.startTime && s.endTime).reduce((sum, s) => {
              let start = parseInt(s.startTime.split(":")[0]) + parseInt(s.startTime.split(":")[1]) / 60;
              let end = parseInt(s.endTime.split(":")[0]) + parseInt(s.endTime.split(":")[1]) / 60;
              if (end <= start) end += 24;
              return sum + Math.max(0, end - start - s.breakMinutes / 60);
            }, 0))}
          </span>
        </div>

        {/* Night worker detection */}
        {result.nightWorker.isNightWorker && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>Night Worker Detected:</strong> Shift pattern includes 3+ hours in the 23:00-06:00 night period.
            {specialHazard && " Special hazard designation active -- absolute 8hr limit applies (no averaging)."}
          </div>
        )}
      </div>

      {/* ── Annual Leave ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Annual Leave</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Calculation Mode</label>
            <div className="flex gap-2">
              {([["simple", "Full Year"], ["pro-rata", "Pro-Rata"]] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setAnnualLeaveMode(val)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    annualLeaveMode === val ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}>{lbl}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Days Taken</label>
            <input type="number" value={actualLeaveDays} onChange={e => setActualLeaveDays(Math.max(0, parseInt(e.target.value) || 0))}
              min={0} max={50} step={0.5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>

          {annualLeaveMode === "pro-rata" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Leave Year Start</label>
              <input type="date" value={leaveYearStart} onChange={e => setLeaveYearStart(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
            </div>
          )}

          <div className="flex items-end">
            <div className={`rounded-lg px-3 py-2 border w-full ${result.annualLeave.compliant ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Entitlement</div>
              <div className={`text-sm font-bold ${result.annualLeave.compliant ? "text-emerald-800" : "text-red-800"}`}>
                {result.annualLeave.proRataEntitlement ?? 28} days
                {!result.annualLeave.compliant && ` (${result.annualLeave.shortfall} day shortfall)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compliance Results ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Compliance Assessment</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Working Time Regulations 1998 requirements checked against the entered shift pattern</p>
        </div>
        <div className="divide-y divide-gray-100">
          {result.complianceChecks.map(check => {
            const rag = ragColour(check.status);
            return (
              <div key={check.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rag.dot}`} />
                      <span className="text-sm font-medium text-gray-800">{check.requirement}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{check.regulation}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${rag.bg} ${rag.text} border ${rag.border}`}>
                    {check.breach ? "Breach" : check.status === "amber" ? "Advisory" : "Compliant"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Limit:</span> <span className="text-gray-700">{check.limit}</span></div>
                  <div><span className="text-gray-400">Actual:</span> <span className="text-gray-700 font-medium">{check.actual}</span></div>
                </div>
                {check.correctiveAction && (
                  <div className={`text-xs p-2.5 rounded-lg ${check.status === "red" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
                    <strong>Action:</strong> {check.correctiveAction}
                  </div>
                )}
                {check.notes && !check.correctiveAction && (
                  <div className="text-[11px] text-gray-500 italic">{check.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Weekly Hours Trend ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Weekly Hours Trend ({result.referencePeriod}-week reference period)</h3>
        <p className="text-[11px] text-gray-400">Projected weekly hours across the reference period based on the current shift pattern. Red dots indicate weeks exceeding the {workerAge === "young" ? "40" : "48"}hr limit.</p>
        <WeeklyHoursTrend result={result} />
      </div>

      {/* ── Compliance Bar Chart ───────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Compliance Overview</h3>
        <p className="text-[11px] text-gray-400">Status of each WTR requirement. Green = compliant, amber = advisory, red = breach identified.</p>
        <ComplianceBarChart result={result} />
      </div>

      {/* ── Recommendations ────────────────────────────────── */}
      {result.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Recommendations</h3>
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
      )}

      {/* ── Cross References ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Related Tools</h3>
        <div className="space-y-1.5">
          {result.crossRefs.map((ref, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-ebrora" />
              {ref}
            </div>
          ))}
        </div>
      </div>

      {/* ── Opt-Out Validity Info ───────────────────────────── */}
      {optOutSigned && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-blue-800">Opt-Out Agreement Requirements (Reg 5 WTR 1998)</h3>
          <div className="space-y-1 text-xs text-blue-700">
            <div>- Must be in writing and signed voluntarily by the individual worker</div>
            <div>- Worker can cancel the opt-out by giving 7 days written notice (or up to 3 months if agreed)</div>
            <div>- Employer cannot dismiss or subject a worker to detriment for refusing to sign an opt-out</div>
            <div>- Employer must maintain a register of workers who have opted out</div>
            <div>- Records must be kept for 2 years from the date they relate to</div>
            <div>- Opt-out does NOT apply to night worker limits (Reg 6) -- these cannot be opted out of</div>
          </div>
        </div>
      )}

      {/* ── RAG Key ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(["green", "amber", "red"] as RAGStatus[]).map(s => {
          const r = ragColour(s);
          return (
            <div key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${r.bg} ${r.text} border ${r.border}`}>
              <span className={`w-2 h-2 rounded-full ${r.dot}`} />
              {r.label}
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Compliance assessment based on the Working Time Regulations 1998 (SI 1998/1833) as amended.
          This is a screening tool -- it does not constitute legal advice. Consult an employment law specialist for complex cases
          or where workforce agreements, special regulations, or sector exemptions may apply.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
