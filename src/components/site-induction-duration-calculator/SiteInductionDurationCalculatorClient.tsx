// src/components/site-induction-duration-calculator/SiteInductionDurationCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PROJECT_TYPES, INDUCTION_TYPES, SITE_HAZARDS, GUIDANCE_REFERENCES,
  AGENDA_COLOURS, RISK_LEVEL_STYLES, MAX_BOLT_ON_MINUTES,
  calculateInduction, formatDuration,
} from "@/data/site-induction-duration-calculator";
import type {
  ProjectType, InductionType, ClientBoltOn, InductionResult,
} from "@/data/site-induction-duration-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Stacked Bar — Agenda Breakdown ──────────────────────
function AgendaStackedBar({ result }: { result: InductionResult }) {
  const { agenda } = result;
  if (agenda.length === 0) return null;
  const W = 600, H = 80, PAD = { left: 10, right: 10, top: 10, bottom: 30 };
  const cw = W - PAD.left - PAD.right;
  const total = agenda.reduce((s, a) => s + a.minutes, 0);
  const barH = 28;
  let cx = PAD.left;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
      {agenda.map((item, i) => {
        const w = Math.max(2, (item.minutes / total) * cw);
        const x = cx;
        cx += w;
        return (
          <g key={i}>
            <rect x={x} y={PAD.top} width={w} height={barH} fill={item.colour}
              rx={i === 0 ? 3 : i === agenda.length - 1 ? 3 : 0} opacity={0.85} />
            {w > 20 && (
              <text x={x + w / 2} y={PAD.top + barH / 2 + 3} textAnchor="middle"
                fontSize={7} fontWeight={600} fill="#fff">
                {item.minutes}m
              </text>
            )}
          </g>
        );
      })}
      {/* Legend */}
      {[
        { c: AGENDA_COLOURS.base, l: "Base" },
        { c: AGENDA_COLOURS.hazard, l: "Hazards" },
        { c: AGENDA_COLOURS.cdm, l: "CDM" },
        { c: AGENDA_COLOURS.client, l: "Client" },
      ].map((item, i) => (
        <g key={i}>
          <rect x={PAD.left + i * 100} y={H - 16} width={10} height={10} fill={item.c} rx={2} opacity={0.85} />
          <text x={PAD.left + i * 100 + 14} y={H - 8} fontSize={9} fill="#6B7280">{item.l}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG Donut Chart — Category Proportions ──────────────────
function CategoryDonut({ result }: { result: InductionResult }) {
  const { agenda } = result;
  const cats = ["base", "hazard", "cdm", "client"] as const;
  const totals = cats.map(cat => ({
    cat,
    label: cat === "base" ? "Base" : cat === "hazard" ? "Hazards" : cat === "cdm" ? "CDM" : "Client",
    minutes: agenda.filter(a => a.category === cat).reduce((s, a) => s + a.minutes, 0),
    colour: AGENDA_COLOURS[cat],
  })).filter(c => c.minutes > 0);

  const total = totals.reduce((s, c) => s + c.minutes, 0);
  if (total === 0) return null;

  const W = 260, H = 200;
  const cx = 100, cy = 100, r = 75, innerR = 45;

  let startAngle = -Math.PI / 2;
  const arcs = totals.map(seg => {
    const angle = (seg.minutes / total) * 2 * Math.PI;
    const a = { ...seg, start: startAngle, end: startAngle + angle };
    startAngle += angle;
    return a;
  });

  const arcPath = (start: number, end: number, outerR: number, ir: number) => {
    const x1 = cx + outerR * Math.cos(start), y1 = cy + outerR * Math.sin(start);
    const x2 = cx + outerR * Math.cos(end), y2 = cy + outerR * Math.sin(end);
    const x3 = cx + ir * Math.cos(end), y3 = cy + ir * Math.sin(end);
    const x4 = cx + ir * Math.cos(start), y4 = cy + ir * Math.sin(start);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {arcs.map((a, i) => (
        <path key={i} d={arcPath(a.start, a.end, r, innerR)} fill={a.colour} opacity={0.85} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={700} fill="#1B5745">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#6B7280">minutes</text>
      {/* Legend */}
      {totals.map((seg, i) => (
        <g key={i}>
          <rect x={195} y={40 + i * 22} width={10} height={10} fill={seg.colour} rx={2} opacity={0.85} />
          <text x={210} y={48 + i * 22} fontSize={9} fontWeight={600} fill="#374151">{seg.label}</text>
          <text x={210} y={57 + i * 22} fontSize={8} fill="#9CA3AF">{seg.minutes}m ({Math.round(seg.minutes / total * 100)}%)</text>
        </g>
      ))}
    </svg>
  );
}

// ─── PDF Export (PAID layout — dark header, no ebrora.com) ───
async function exportPDF(
  header: { site: string; company: string; manager: string; preparedBy: string; date: string },
  result: InductionResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `SID-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Dark header (PAID layout)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("SITE INDUCTION DURATION ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Industry best practice | CDM 2015 / HSWA 1974 / MHSWR 1999 / CIS 36 (guidance only -- no legislation specifies duration)", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 25, 1, 1, "FD"); doc.setFontSize(8);
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
  drawFld("Prepared By:", header.preparedBy, M + halfW, y, 40);
  y += 5;
  drawFld("Date:", header.date, M + 3, y, 30);
  drawFld("Induction Type:", result.inductionType.label, M + halfW, y, 0);
  y += 5;
  drawFld("Project Type:", result.projectType.label, M + 3, y, 0);
  drawFld("Trades:", String(result.tradeCount || "N/A"), M + halfW, y, 0);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Site induction duration assessment for ${header.site || "the above site"}. Project type: ${result.projectType.label}. Induction type: ${result.inductionType.label}. ${result.hazardCount} site hazards identified. ${result.cdmNotifiable ? "CDM 2015 notifiable project." : ""} ${result.clientBoltOns.length > 0 ? result.clientBoltOns.length + " client-specific bolt-on(s) included." : ""} Recommended duration: ${result.formattedDuration}. Refresher: ${result.refresher.label}.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("SITE INDUCTION DURATION ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Duration Banner
  const rlStyle = RISK_LEVEL_STYLES[result.riskLevel];
  const rgb = rlStyle.rgb;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`RECOMMENDED DURATION: ${result.formattedDuration} -- ${rlStyle.label.toUpperCase()}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`${result.hazardCount} hazards | Refresher: ${result.refresher.label} | Test: ${result.testRecommendation.recommended ? "Recommended" : "Optional"}`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Summary Panel
  checkPage(45);
  const summaryItems = [
    ["Project Type", result.projectType.label],
    ["Induction Type", result.inductionType.label],
    ["Base Duration", formatDuration(Math.round(result.projectType.baseMinutes * result.inductionType.durationFactor))],
    ["Hazards Selected", `${result.hazardCount} of ${SITE_HAZARDS.length}`],
    ["Hazard Time Added", formatDuration(result.agenda.filter(a => a.category === "hazard").reduce((s, a) => s + a.minutes, 0))],
    ["CDM Notifiable", result.cdmNotifiable ? "Yes (+10 min module)" : "No"],
    ["Client Bolt-Ons", result.clientBoltOns.length > 0 ? `${result.clientBoltOns.length} item(s) -- ${formatDuration(result.clientMinutes)}` : "None"],
    ["Total Duration", result.formattedDuration],
    ["Trades on Site", String(result.tradeCount || "N/A")],
    ["Risk Level", rlStyle.label],
    ["Refresher Frequency", result.refresher.label],
    ["Test Recommended", result.testRecommendation.recommended ? `Yes (${result.testRecommendation.suggestedQuestions} questions)` : "No"],
  ];
  const panelH = summaryItems.length * 3.8 + 10;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Assessment Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value], si) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    if (si === 7) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
    else if (si === 9) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
    else { doc.setTextColor(17, 24, 39); }
    doc.setFont("helvetica", "bold");
    doc.text(value, M + 60, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 6;

  // ── Tailoring Note
  checkPage(20);
  doc.setFillColor(254, 252, 232); doc.setDrawColor(234, 179, 8);
  doc.roundedRect(M, y, CW, 14, 1.5, 1.5, "FD");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(120, 80, 0);
  doc.text("IMPORTANT -- TAILORING NOTE", M + 4, y + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(80, 60, 0);
  const tailLines = doc.splitTextToSize("The duration above is the recommended maximum. The briefer should tailor content to suit the audience. Not all attendees need every section. Returning operatives may only need a refresher covering changes since last attendance.", CW - 8);
  doc.text(tailLines, M + 4, y + 8);
  doc.setTextColor(0, 0, 0); y += 18;

  // ── Stacked bar chart in PDF
  checkPage(40);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Induction Agenda Breakdown", M, y);
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Horizontal bar showing time allocation per section. Colours indicate category.", M, y + 4);
  doc.setTextColor(0, 0, 0); y += 8;
  {
    const barX = M, barW = CW, barH = 10;
    const total = result.agenda.reduce((s, a) => s + a.minutes, 0);
    let bx = barX;
    const catColours: Record<string, number[]> = {
      base: [59, 130, 246], hazard: [249, 115, 22], cdm: [139, 92, 246], client: [6, 182, 212],
    };
    result.agenda.forEach(item => {
      const w = Math.max(0.5, (item.minutes / total) * barW);
      const c = catColours[item.category] || [100, 100, 100];
      doc.setFillColor(c[0], c[1], c[2]); doc.rect(bx, y, w, barH, "F");
      bx += w;
    });
    y += barH + 2;
    // Legend
    doc.setFontSize(5); doc.setTextColor(80, 80, 80);
    let lx = M;
    (["base", "hazard", "cdm", "client"] as const).forEach(cat => {
      const c = catColours[cat];
      const label = cat === "base" ? "Base" : cat === "hazard" ? "Hazards" : cat === "cdm" ? "CDM" : "Client";
      doc.setFillColor(c[0], c[1], c[2]); doc.rect(lx, y, 3, 2.5, "F");
      doc.text(label, lx + 5, y + 2); lx += 30;
    });
    doc.setTextColor(0, 0, 0); y += 8;
  }

  // ── Agenda Table
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Induction Agenda", M, y); y += 5;

  const cols = [14, CW - 14 - 25 - 25, 25, 25];
  let cx = M;
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  ["#", "Section", "Category", "Duration"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  result.agenda.forEach((item, idx) => {
    checkPage(6);
    cx = M;
    const cells = [String(idx + 1), item.section, item.category === "base" ? "Base" : item.category === "hazard" ? "Hazard" : item.category === "cdm" ? "CDM" : "Client", `${item.minutes} min`];
    cells.forEach((t, i) => {
      if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, cols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 1 ? "bold" : "normal"); doc.setFontSize(5.5);
      const txt = doc.splitTextToSize(t, cols[i] - 4);
      doc.text(txt[0], cx + 2, y + 3.5);
      cx += cols[i];
    });
    y += 5.5;
  });

  // Total row
  cx = M;
  ["", "TOTAL", "", result.formattedDuration].forEach((t, i) => {
    doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
    doc.rect(cx, y, cols[i], 6, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(t, cx + 2, y + 4);
    cx += cols[i];
  });
  y += 10;

  // ── Refresher Schedule
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Refresher Schedule", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Frequency: ${result.refresher.label}`, M + 2, y); y += 4;
  const refLines = doc.splitTextToSize(result.refresher.reasoning, CW - 4);
  doc.text(refLines, M + 2, y); y += refLines.length * 3.5 + 4;

  // ── Test Recommendation
  if (result.testRecommendation.recommended) {
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Comprehension Test", M, y); y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Recommended: Yes (${result.testRecommendation.suggestedQuestions} questions)`, M + 2, y); y += 4;
    const testLines = doc.splitTextToSize(result.testRecommendation.reasoning, CW - 4);
    doc.text(testLines, M + 2, y); y += testLines.length * 3.5 + 4;
  }

  // ── Recommendations
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  result.recommendations.forEach(rec => {
    checkPage(8);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });
  y += 4;

  // ── Regulatory References
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Guidance & Regulatory References", M, y); y += 5;
  GUIDANCE_REFERENCES.forEach(leg => {
    checkPage(8);
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(leg.ref, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
    doc.text(` -- ${leg.title}`, M + 2 + doc.getTextWidth(leg.ref) + 1, y);
    y += 3.5;
    doc.setFontSize(6); doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(leg.description, CW - 6);
    doc.text(descLines, M + 2, y); y += descLines.length * 3 + 2;
    doc.setTextColor(0, 0, 0);
  });
  y += 4;

  // ── Sign-off
  checkPage(50); y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
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
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Site induction duration based on UK construction industry best practice. No legislation specifies induction duration. Actual content and duration should be determined by a competent person.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`site-induction-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function SiteInductionDurationCalculatorClient() {
  const [site, setSite] = useState(""); const [company, setCompany] = useState("");
  const [manager, setManager] = useState(""); const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [projectType, setProjectType] = useState<ProjectType>("civils");
  const [inductionType, setInductionType] = useState<InductionType>("contractor");
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [cdmNotifiable, setCdmNotifiable] = useState(false);
  const [clientBoltOns, setClientBoltOns] = useState<ClientBoltOn[]>([]);
  const [tradeCount, setTradeCount] = useState<number>(0);

  // Bolt-on input state
  const [boltOnName, setBoltOnName] = useState("");
  const [boltOnMinutes, setBoltOnMinutes] = useState<number>(10);

  const toggleHazard = useCallback((id: string) => {
    setSelectedHazards(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  }, []);

  const currentBoltOnTotal = clientBoltOns.reduce((s, b) => s + b.minutes, 0);
  const boltOnRemaining = MAX_BOLT_ON_MINUTES - currentBoltOnTotal;

  const addBoltOn = useCallback(() => {
    if (!boltOnName.trim() || boltOnMinutes <= 0) return;
    const currentTotal = clientBoltOns.reduce((s, b) => s + b.minutes, 0);
    const clampedMinutes = Math.min(boltOnMinutes, MAX_BOLT_ON_MINUTES - currentTotal);
    if (clampedMinutes <= 0) return;
    setClientBoltOns(prev => [...prev, { id: `bolt-${Date.now()}`, name: boltOnName.trim(), minutes: clampedMinutes }]);
    setBoltOnName(""); setBoltOnMinutes(10);
  }, [boltOnName, boltOnMinutes, clientBoltOns]);

  const removeBoltOn = useCallback((id: string) => {
    setClientBoltOns(prev => prev.filter(b => b.id !== id));
  }, []);

  const result = useMemo(() =>
    calculateInduction(projectType, inductionType, selectedHazards, cdmNotifiable, clientBoltOns, tradeCount),
    [projectType, inductionType, selectedHazards, cdmNotifiable, clientBoltOns, tradeCount]
  );

  const rlStyle = RISK_LEVEL_STYLES[result.riskLevel];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, company, manager, preparedBy, date: assessDate }, result); }
    finally { setExporting(false); }
  }, [site, company, manager, preparedBy, assessDate, result]);

  const clearAll = useCallback(() => {
    setProjectType("civils"); setInductionType("contractor");
    setSelectedHazards([]); setCdmNotifiable(false);
    setClientBoltOns([]); setTradeCount(0);
    setSite(""); setCompany(""); setManager(""); setPreparedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Duration", value: result.formattedDuration,
            sub: `${result.projectType.label} | ${result.inductionType.label}`,
            bgClass: result.totalMinutes > 120 ? "bg-orange-50" : result.totalMinutes > 60 ? "bg-blue-50" : "bg-emerald-50",
            textClass: result.totalMinutes > 120 ? "text-orange-800" : result.totalMinutes > 60 ? "text-blue-800" : "text-emerald-800",
            borderClass: result.totalMinutes > 120 ? "border-orange-200" : result.totalMinutes > 60 ? "border-blue-200" : "border-emerald-200",
            dotClass: result.totalMinutes > 120 ? "bg-orange-500" : result.totalMinutes > 60 ? "bg-blue-500" : "bg-emerald-500",
          },
          { label: "Hazards", value: `${result.hazardCount}`, sub: `of ${SITE_HAZARDS.length} identified`, bgClass: rlStyle.bgClass, textClass: rlStyle.textClass, borderClass: rlStyle.borderClass, dotClass: rlStyle.dotClass },
          { label: "Refresher", value: result.refresher.label, sub: rlStyle.label, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          {
            label: "Test", value: result.testRecommendation.recommended ? "Recommended" : "Optional",
            sub: result.testRecommendation.recommended ? `${result.testRecommendation.suggestedQuestions} questions` : "Verbal confirmation",
            bgClass: result.testRecommendation.recommended ? "bg-cyan-50" : "bg-gray-50",
            textClass: result.testRecommendation.recommended ? "text-cyan-800" : "text-gray-600",
            borderClass: result.testRecommendation.recommended ? "border-cyan-200" : "border-gray-200",
            dotClass: result.testRecommendation.recommended ? "bg-cyan-500" : "bg-gray-400",
          },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

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

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Prepared By", v: preparedBy, s: setPreparedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* ── Induction Type Selector ────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Induction Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {INDUCTION_TYPES.map(t => (
            <button key={t.id} onClick={() => setInductionType(t.id)}
              className={`text-left border rounded-lg p-3 transition-all ${
                inductionType === t.id
                  ? "border-ebrora/50 bg-ebrora-light/40 ring-1 ring-ebrora/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}>
              <div className={`text-sm font-semibold ${inductionType === t.id ? "text-ebrora-dark" : "text-gray-800"}`}>{t.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{t.description}</div>
              <div className="text-[10px] text-gray-300 mt-1">
                {t.durationFactor === 1 ? "Full duration" : `${Math.round(t.durationFactor * 100)}% of full duration`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Project Type ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Project Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PROJECT_TYPES.map(p => (
            <button key={p.id} onClick={() => setProjectType(p.id)}
              className={`text-left border rounded-lg p-3 transition-all ${
                projectType === p.id
                  ? "border-ebrora/50 bg-ebrora-light/40 ring-1 ring-ebrora/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}>
              <div className={`text-sm font-semibold ${projectType === p.id ? "text-ebrora-dark" : "text-gray-800"}`}>{p.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Base: {p.baseMinutes} min</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Site Hazards Checklist ──────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Site Hazards</h3>
          <span className="text-[11px] text-gray-400">{selectedHazards.length} selected</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SITE_HAZARDS.map(h => {
            const selected = selectedHazards.includes(h.id);
            return (
              <button key={h.id} onClick={() => toggleHazard(h.id)}
                className={`flex items-center gap-2.5 text-left border rounded-lg px-3 py-2 transition-all ${
                  selected
                    ? "border-ebrora/40 bg-ebrora-light/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                  selected ? "bg-ebrora text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {selected ? "X" : ""}
                </span>
                <div className="min-w-0">
                  <div className={`text-xs font-medium truncate ${selected ? "text-ebrora-dark" : "text-gray-700"}`}>{h.label}</div>
                  <div className="text-[10px] text-gray-400">+{h.minutes} min {h.highRisk && <span className="text-red-400 font-semibold">HIGH RISK</span>}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CDM & Trade Count ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">CDM 2015 Notifiable Project?</label>
            <div className="flex gap-2 mt-2">
              {(["Yes", "No"] as const).map(opt => (
                <button key={opt} onClick={() => setCdmNotifiable(opt === "Yes")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    (opt === "Yes" ? cdmNotifiable : !cdmNotifiable)
                      ? "border-ebrora/50 bg-ebrora-light/40 text-ebrora-dark"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>{opt}</button>
              ))}
            </div>
            {cdmNotifiable && (
              <div className="text-[10px] text-purple-600 mt-1">Adds site rules module (+10 min for contractor)</div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Subcontractor Trades</label>
            <input type="number" value={tradeCount || ""} onChange={e => setTradeCount(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={50} placeholder="0"
              className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            <div className="text-[10px] text-gray-400 mt-1">Recorded for PDF -- does not affect duration</div>
          </div>
        </div>
      </div>

      {/* ── Client Bolt-Ons ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Client-Specific Bolt-Ons <span className="font-normal text-gray-400">(optional — max {MAX_BOLT_ON_MINUTES} min total)</span></h3>
        {boltOnRemaining > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Topic Name</label>
              <input type="text" value={boltOnName} onChange={e => setBoltOnName(e.target.value)} placeholder="e.g. UU Golden Rules"
                className="w-48 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Duration (min)</label>
              <input type="number" value={boltOnMinutes} onChange={e => setBoltOnMinutes(Math.max(1, Math.min(boltOnRemaining, parseInt(e.target.value) || 1)))} min={1} max={boltOnRemaining}
                className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
            <button onClick={addBoltOn} disabled={!boltOnName.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid transition-colors disabled:opacity-40">
              Add
            </button>
            <span className="text-[10px] text-gray-400">{boltOnRemaining} min remaining</span>
          </div>
        ) : (
          <div className="text-[11px] text-amber-600">Maximum bolt-on allowance reached ({MAX_BOLT_ON_MINUTES} min). Remove an item to add more.</div>
        )}
        {clientBoltOns.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {clientBoltOns.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-cyan-800 flex-1">{b.name}</span>
                <span className="text-[10px] text-cyan-600">{b.minutes} min</span>
                <button onClick={() => removeBoltOn(b.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Agenda Breakdown</h3>
          <p className="text-[11px] text-gray-400">Horizontal bar showing time allocation per section. Colours indicate category.</p>
          <AgendaStackedBar result={result} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">Category Proportions</h3>
          <p className="text-[11px] text-gray-400">Donut chart showing how induction time is distributed by category.</p>
          <div className="max-w-xs mx-auto">
            <CategoryDonut result={result} />
          </div>
        </div>
      </div>

      {/* ── Agenda Table ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Induction Agenda</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Recommended content breakdown with time per section. Total: {result.formattedDuration}.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-20">Category</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-16">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.agenda.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-1.5 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-1.5 text-gray-800 font-medium">{item.section}</td>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: item.colour }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.colour }} />
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold text-gray-700">{item.minutes}m</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-gray-900">TOTAL</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right text-ebrora-dark">{result.formattedDuration}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tailoring Note ─────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3 items-start">
          <span className="text-amber-500 font-bold text-sm mt-0.5">!</span>
          <div>
            <div className="text-sm font-bold text-amber-900">Tailoring Note</div>
            <div className="text-xs text-amber-800 mt-1 leading-relaxed">{result.tailoringNote}</div>
          </div>
        </div>
      </div>

      {/* ── Refresher & Test ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Refresher Schedule</h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${rlStyle.bgClass} ${rlStyle.textClass} border ${rlStyle.borderClass}`}>
            <span className={`w-2 h-2 rounded-full ${rlStyle.dotClass}`} />{result.refresher.label}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{result.refresher.reasoning}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Comprehension Test</h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            result.testRecommendation.recommended
              ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}>
            {result.testRecommendation.recommended ? `Recommended -- ${result.testRecommendation.suggestedQuestions} questions` : "Optional"}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{result.testRecommendation.reasoning}</p>
        </div>
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

      {/* ── Guidance & Regulatory References ──────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Guidance & Regulatory References</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">These regulations require that induction is provided. No legislation specifies duration — time recommendations are based on industry best practice.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {GUIDANCE_REFERENCES.map(leg => (
            <div key={leg.ref} className="px-4 py-2.5">
              <div className="text-xs"><span className="font-bold text-ebrora-dark">{leg.ref}</span> <span className="font-medium text-gray-700">-- {leg.title}</span></div>
              <div className="text-[11px] text-gray-400 mt-0.5">{leg.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Duration recommendations based on UK construction industry best practice. No legislation specifies induction duration —
          CDM 2015, HSWA 1974, and MHSWR 1999 require that induction is provided but do not prescribe how long it should be.
          Actual content and duration should be determined by a competent person with knowledge of the site-specific risks.
        </p>
      </div>
    </div>
  );
}
