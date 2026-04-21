// src/components/f10-notification-checker/F10NotificationCheckerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  F10_CATEGORIES, TERMINAL_RESULTS, HSE_CONTACTS, RESPONSIBLE_PERSON_GUIDANCE,
  F10_FIELDS, CROSS_REFS, DEFAULT_INPUTS,
  getAllNodes, CATEGORY_FIRST_NODE, calculateDeadline, computePersonDays,
  computeF10FieldStatus,
} from "@/data/f10-notification-checker";
import type {
  F10Category, TreeNode, TerminalResult, DecisionPathStep, FlowchartNode,
  ProjectInputs,
} from "@/data/f10-notification-checker";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Live Flowchart SVG ──────────────────────────────────────────
function LiveFlowchart({
  category, path, currentNodeId, terminalResult,
}: {
  category: F10Category | null;
  path: DecisionPathStep[];
  currentNodeId: string | null;
  terminalResult: TerminalResult | null;
}) {
  const nodes: FlowchartNode[] = useMemo(() => {
    const n: FlowchartNode[] = [];
    n.push({ id: "start", label: "F10 Assessment", type: "start", status: category ? "completed" : "active" });
    if (category) {
      // If the tree has crossed from one branch into another (e.g. new-1 -> dom-1
      // when the user realises the client is domestic), reflect the EFFECTIVE
      // branch in the flowchart label, not the original entry category.
      const prefixFromNodes = (() => {
        const probe = (terminalResult?.id || currentNodeId || path[path.length - 1]?.nodeId || "") as string;
        if (probe.startsWith("dom-") || probe.startsWith("domestic-")) return "domestic-check" as F10Category;
        if (probe.startsWith("upd-") || probe.startsWith("update-")) return "existing-update" as F10Category;
        if (probe.startsWith("dis-") || probe.startsWith("display-")) return "display-check" as F10Category;
        if (probe.startsWith("new-")) return "new-project" as F10Category;
        return category;
      })();
      const effective = prefixFromNodes || category;
      const cat = F10_CATEGORIES.find(c => c.id === effective);
      n.push({ id: "category", label: cat?.label || "", type: "category", status: "completed" });
    }
    path.forEach(step => {
      const shortQ = step.question.length > 50 ? step.question.slice(0, 47) + "..." : step.question;
      n.push({ id: step.nodeId, label: shortQ, type: "question", status: "completed" });
    });
    if (currentNodeId && !terminalResult) {
      const allN = getAllNodes();
      const node = allN[currentNodeId];
      if (node) {
        const shortQ = node.question.length > 50 ? node.question.slice(0, 47) + "..." : node.question;
        n.push({ id: currentNodeId, label: shortQ, type: "question", status: "active" });
      }
    }
    if (terminalResult) {
      n.push({
        id: terminalResult.id,
        label: terminalResult.title,
        type: terminalResult.notifiable ? "terminal-yes" : "terminal-no",
        status: "active",
      });
    }
    return n;
  }, [category, path, currentNodeId, terminalResult]);

  if (nodes.length <= 1) return null;

  const nodeW = 200, nodeH = 44, gapY = 24, padX = 20, padY = 20;
  const totalH = nodes.length * (nodeH + gapY) - gapY + padY * 2;
  const totalW = nodeW + padX * 2;
  const cx = padX + nodeW / 2;

  const getNodeFill = (n: FlowchartNode) => {
    if (n.type === "start") return n.status === "completed" ? "#1B5745" : "#E8F0EC";
    if (n.type === "category") return "#1B5745";
    if (n.type === "terminal-yes") return "#DC2626";
    if (n.type === "terminal-no") return "#16A34A";
    if (n.status === "active") return "#2563EB";
    if (n.status === "completed") return "#E8F0EC";
    return "#F9FAFB";
  };
  const getTextFill = (n: FlowchartNode) => {
    if (n.type === "start" && n.status === "completed") return "#FFFFFF";
    if (n.type === "category") return "#FFFFFF";
    if (n.type === "terminal-yes" || n.type === "terminal-no") return "#FFFFFF";
    if (n.status === "active") return "#FFFFFF";
    if (n.status === "completed") return "#1B5745";
    return "#6B7280";
  };
  const getStroke = (n: FlowchartNode) => {
    if (n.status === "active" && n.type === "question") return "#2563EB";
    if (n.type === "terminal-yes") return "#991B1B";
    if (n.type === "terminal-no") return "#15803D";
    if (n.status === "completed") return "#1B5745";
    return "#D1D5DB";
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full h-auto" style={{ maxHeight: Math.min(totalH, 600), minHeight: 120 }}>
        <defs>
          <marker id="f10-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
          </marker>
          <filter id="f10-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>
        {nodes.map((n, i) => {
          const y = padY + i * (nodeH + gapY);
          const fill = getNodeFill(n);
          const textFill = getTextFill(n);
          const stroke = getStroke(n);
          return (
            <g key={`${n.id}-${i}`}>
              {i > 0 && (
                <line
                  x1={cx} y1={y - gapY} x2={cx} y2={y}
                  stroke="#9CA3AF" strokeWidth="1.2"
                  markerEnd="url(#f10-arrow)"
                />
              )}
              <rect
                x={padX} y={y} width={nodeW} height={nodeH} rx={8} ry={8}
                fill={fill} stroke={stroke} strokeWidth="1.5"
                filter="url(#f10-shadow)"
              />
              <foreignObject x={padX + 6} y={y + 4} width={nodeW - 12} height={nodeH - 8}>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "100%", color: textFill, fontSize: "11px", fontWeight: 600,
                    textAlign: "center", lineHeight: "1.25", padding: "0 4px",
                  }}
                >
                  {n.label}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── PDF Export (PAID = dark header) ─────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  inputs: ProjectInputs,
  category: F10Category,
  pathSteps: DecisionPathStep[],
  terminal: TerminalResult,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, H = 297, M = 14, CW = W - M * 2;
  const docRef = `F10-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let y = 0;

  const catLabel = (() => {
    // Derive effective branch from terminal id or last path node so cross-jumps
    // (e.g. new-1 -> dom-1) show the correct category in the printed pathway.
    const probe = (terminal?.id || pathSteps[pathSteps.length - 1]?.nodeId || "") as string;
    let effective: F10Category = category;
    if (probe.startsWith("dom-") || probe.startsWith("domestic-")) effective = "domestic-check";
    else if (probe.startsWith("upd-") || probe.startsWith("update-")) effective = "existing-update";
    else if (probe.startsWith("dis-") || probe.startsWith("display-")) effective = "display-check";
    else if (probe.startsWith("new-")) effective = "new-project";
    return F10_CATEGORIES.find(c => c.id === effective)?.label || category;
  })();
  const personDays = computePersonDays(inputs);
  const deadline = inputs.plannedStartDate
    ? calculateDeadline(inputs.plannedStartDate, terminal.recommendedLeadDays ?? 14)
    : null;
  const fieldStatus = computeF10FieldStatus(inputs);

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("F10 NOTIFICATION CHECKER (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 60, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  function sectionHead(title: string) {
    checkPage(12);
    doc.setFillColor(30, 30, 30); doc.rect(M, y, 3, 6, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
    doc.text(title, M + 6, y + 4.5);
    doc.setTextColor(0, 0, 0); y += 9;
  }

  // ── Dark header (PAID) ─────────────────────────────────────────
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("F10 NOTIFICATION CHECKER", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("CDM 2015 Reg 6 / Reg 7 / Sched 1 -- HSE L153", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // ── Site info panel ───────────────────────────────────────────
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Company:", header.company, M + 3, y + 1, 50);
  drawFld("Site:", header.site, M + CW / 2, y + 1, 50);
  drawFld("Site Manager:", header.manager, M + 3, y + 8, 40);
  drawFld("Assessed By:", header.assessedBy, M + CW / 2, y + 8, 40);
  drawFld("Date:", header.date, M + 3, y + 15, 30);
  drawFld("Project:", inputs.projectName, M + CW / 2, y + 15, 50);
  y += 22;

  // ── Scope paragraph ───────────────────────────────────────────
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `F10 notification assessment for ${inputs.projectName || header.site || "the above project"}. Assessment category: ${catLabel}. Assessment conducted using the CDM 2015 reg 6 decision tree to determine F10 notifiability, update requirements, and site display obligations. Auto-computed person-days based on ${personDays.workingDays} working days x ${inputs.avgDailyWorkforce} avg daily workforce = ${personDays.personDays} person-days.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Urgency panel ─────────────────────────────────────────────
  if (terminal.notifiable && deadline) {
    checkPage(26);
    const isOverdue = deadline.isOverdue;
    const isPastStart = deadline.isPastStart;
    const urgRGB: [number, number, number] =
      isPastStart ? [185, 28, 28] :
      isOverdue ? [194, 65, 12] :
      [161, 98, 7];
    const urgBgRGB: [number, number, number] =
      isPastStart ? [254, 226, 226] :
      isOverdue ? [255, 237, 213] :
      [254, 249, 195];
    const urgLabel =
      isPastStart ? "IMMEDIATE ACTION REQUIRED" :
      isOverdue ? `OVERDUE BY ${Math.abs(deadline.daysUntilRecommendedDeadline)} DAYS (vs 14-day recommendation)` :
      `ACTION WITHIN ${deadline.daysUntilRecommendedDeadline} DAYS (recommended)`;
    const urgDesc =
      isPastStart ? "Construction start date has passed. Submit the F10 IMMEDIATELY -- late notification is a breach of CDM 2015 reg 6(1) and an offence under HSWA 1974 s33."
      : isOverdue ? `HSE recommends notifying at least 14 days before start on site. You are ${Math.abs(deadline.daysUntilRecommendedDeadline)} days past that recommendation. Submit the F10 today.`
      : `HSE recommends notifying at least 14 days before start on site. Start date: ${deadline.startDate}. Recommended submission by: ${deadline.recommendedByDate}.`;
    doc.setFillColor(urgBgRGB[0], urgBgRGB[1], urgBgRGB[2]);
    doc.setDrawColor(urgRGB[0], urgRGB[1], urgRGB[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, 22, 2, 2, "FD");
    doc.setLineWidth(0.2);
    doc.setFillColor(urgRGB[0], urgRGB[1], urgRGB[2]);
    doc.roundedRect(M + 3, y + 3, 16, 16, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("!", M + 9, y + 13);
    doc.setTextColor(urgRGB[0], urgRGB[1], urgRGB[2]); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(urgLabel, M + 23, y + 8);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 40, 20);
    const urgLines = doc.splitTextToSize(urgDesc, CW - 28);
    doc.text(urgLines, M + 23, y + 13);
    doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220);
    y += 27;
  }

  // ── Determination banner ──────────────────────────────────────
  const rgb: [number, number, number] = terminal.notifiable ? [220, 38, 38] : [22, 163, 74];
  checkPage(20);
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(terminal.title, M + 5, y + 7);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(terminal.deadline, M + 5, y + 13);
  doc.setTextColor(0, 0, 0); y += 22;

  // ── Determination summary panel ───────────────────────────────
  const summaryItems: [string, string][] = [
    ["Assessment Category:", catLabel],
    ["Notifiable:", terminal.notifiable ? "YES" : "NO"],
    ["F10 Update Required:", terminal.updateRequired ? "YES" : "NO"],
    ["Site Display Required:", terminal.displayRequired ? "YES (reg 6(4))" : "NO"],
    ["PD/PC Appointment Required:", terminal.pdPcAppointmentRequired ? "YES (reg 5)" : "NO"],
    ["Submitting Party:", terminal.responsiblePerson.split(".")[0] + "."],
    ["Form / Method:", `${terminal.form} -- ${terminal.method.length > 60 ? terminal.method.slice(0, 57) + "..." : terminal.method}`],
  ];
  if (terminal.portalUrl) summaryItems.push(["HSE Portal:", terminal.portalUrl]);
  if (deadline) {
    summaryItems.push(["Planned Start:", deadline.startDate]);
    summaryItems.push(["Recommended By:", deadline.recommendedByDate]);
    summaryItems.push(["Days Until Start:", deadline.isPastStart ? `PAST START by ${Math.abs(deadline.daysUntilStart)} days` : `${deadline.daysUntilStart} days`]);
  }
  const panelH = summaryItems.length * 4 + 8;
  checkPage(panelH + 10);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Determination Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const valLines = doc.splitTextToSize(value, CW - 70);
    doc.text(valLines[0], M + 62, y);
    doc.setTextColor(0, 0, 0); y += 4;
  });
  y += 4;

  // ── Person-day auto-calc panel ────────────────────────────────
  checkPage(40);
  sectionHead("Reg 6(1) Threshold Auto-Calculation");
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  const pdH = 28;
  doc.roundedRect(M, y - 2, CW, pdH, 1.5, 1.5, "FD");
  const pdItems: [string, string, boolean][] = [
    ["Duration:", `${inputs.durationWeeks} weeks (${personDays.workingDays} working days)`, personDays.exceeds30WorkingDays],
    ["Peak simultaneous workers:", `${inputs.peakSimultaneousWorkers}`, personDays.exceeds20Simultaneous],
    ["Avg daily workforce x working days:", `${inputs.avgDailyWorkforce} x ${personDays.workingDays} = ${personDays.personDays} person-days`, personDays.exceeds500PersonDays],
    ["Threshold test (A): >30 days AND >20 simultaneous:", personDays.exceeds30WorkingDays && personDays.exceeds20Simultaneous ? "TRIGGERED" : "not triggered", personDays.exceeds30WorkingDays && personDays.exceeds20Simultaneous],
    ["Threshold test (B): >500 person-days:", personDays.exceeds500PersonDays ? "TRIGGERED" : "not triggered", personDays.exceeds500PersonDays],
    ["Overall notifiability (rule 6(1)):", personDays.notifiableByRule6 ? "NOTIFIABLE" : "not notifiable", personDays.notifiableByRule6],
  ];
  let pdy = y + 1;
  pdItems.forEach(([label, value, flag]) => {
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, pdy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(flag ? 185 : 22, flag ? 28 : 163, flag ? 28 : 74);
    doc.text(value, M + 95, pdy);
    doc.setTextColor(0, 0, 0);
    pdy += 4;
  });
  y += pdH + 2;

  // ── Reporting timeline graphic ────────────────────────────────
  if (deadline && inputs.plannedStartDate) {
    checkPage(35);
    sectionHead("Notification Timeline");
    const tlX = M + 10, tlW = CW - 20, tlY = y;
    const startD = new Date(deadline.startDate);
    const recD = new Date(deadline.recommendedByDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // Span from min(today, rec) to max(today, start) + padding
    const anchorStart = new Date(Math.min(today.getTime(), recD.getTime()));
    anchorStart.setDate(anchorStart.getDate() - 3);
    const anchorEnd = new Date(Math.max(today.getTime(), startD.getTime()));
    anchorEnd.setDate(anchorEnd.getDate() + 3);
    const totalMs = anchorEnd.getTime() - anchorStart.getTime();
    const dayToX = (d: Date) => {
      const ratio = Math.max(0, Math.min(1, (d.getTime() - anchorStart.getTime()) / totalMs));
      return tlX + ratio * tlW;
    };
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.8);
    doc.line(tlX, tlY + 12, tlX + tlW, tlY + 12);
    doc.setLineWidth(0.2);

    const recX = dayToX(recD);
    const todayX = dayToX(today);
    const startX = dayToX(startD);

    // Recommended by marker (amber)
    doc.setFillColor(217, 119, 6); doc.circle(recX, tlY + 12, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(217, 119, 6);
    doc.text("RECOMMENDED", Math.max(tlX, recX - 8), tlY + 5);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(deadline.recommendedByDate, Math.max(tlX, recX - 8), tlY + 18);

    // Today marker (green/red based on status)
    const todayFill: [number, number, number] = deadline.isPastStart ? [185, 28, 28] : deadline.isOverdue ? [217, 119, 6] : [22, 163, 74];
    doc.setFillColor(todayFill[0], todayFill[1], todayFill[2]);
    doc.circle(todayX, tlY + 12, 2.8, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(todayFill[0], todayFill[1], todayFill[2]);
    doc.text("TODAY", Math.max(tlX, Math.min(tlX + tlW - 20, todayX - 4)), tlY + 5);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(todayISO(), Math.max(tlX, Math.min(tlX + tlW - 20, todayX - 4)), tlY + 18);

    // Start marker (red)
    doc.setFillColor(220, 38, 38); doc.circle(startX, tlY + 12, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
    doc.text("START", Math.min(tlX + tlW - 12, startX - 4), tlY + 5);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(deadline.startDate, Math.min(tlX + tlW - 12, startX - 4), tlY + 18);

    // Status line
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    const statusY = tlY + 26;
    if (deadline.isPastStart) {
      doc.setTextColor(185, 28, 28);
      doc.text(`CONSTRUCTION STARTED ${Math.abs(deadline.daysUntilStart)} DAYS AGO -- OVERDUE`, M + CW / 2 - 50, statusY);
    } else if (deadline.isOverdue) {
      doc.setTextColor(217, 119, 6);
      doc.text(`PAST 14-DAY RECOMMENDATION BY ${Math.abs(deadline.daysUntilRecommendedDeadline)} DAYS`, M + CW / 2 - 50, statusY);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text(`${deadline.daysUntilRecommendedDeadline} days to recommended deadline (${deadline.daysUntilStart} days to start)`, M + CW / 2 - 55, statusY);
    }
    doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220);
    y = tlY + 32;
  }

  // ── Decision pathway flowchart ─────────────────────────────────
  checkPage(30);
  sectionHead("Decision Pathway");
  {
    const fcX = M + 10, fcNodeW = 70, fcNodeH = 11, fcGapY = 8;
    const fcCX = fcX + fcNodeW / 2;
    interface FcNode { label: string; type: "start" | "question" | "yes" | "no"; answer?: string }
    const fcNodes: FcNode[] = [];
    fcNodes.push({ label: "F10 Assessment", type: "start" });
    fcNodes.push({ label: `Category: ${catLabel}`, type: "start", answer: catLabel });
    pathSteps.forEach(step => {
      const shortQ = step.question.length > 45 ? step.question.slice(0, 42) + "..." : step.question;
      const shortA = step.selectedOption.length > 40 ? step.selectedOption.slice(0, 37) + "..." : step.selectedOption;
      fcNodes.push({ label: shortQ, type: "question", answer: shortA });
    });
    fcNodes.push({ label: terminal.notifiable ? "NOTIFIABLE / ACTION" : "NOT NOTIFIABLE", type: terminal.notifiable ? "yes" : "no" });

    fcNodes.forEach((node, i) => {
      checkPage(fcNodeH + fcGapY + 4);
      const fcFill: [number, number, number] =
        node.type === "start" ? [30, 30, 30] :
        node.type === "yes" ? [220, 38, 38] :
        node.type === "no" ? [22, 163, 74] :
        [232, 240, 236];
      const fcText: [number, number, number] = node.type === "question" ? [27, 87, 69] : [255, 255, 255];
      doc.setFillColor(fcFill[0], fcFill[1], fcFill[2]);
      doc.setDrawColor(fcFill[0], fcFill[1], fcFill[2]);
      doc.roundedRect(fcX, y, fcNodeW, fcNodeH, 2, 2, "FD");
      doc.setTextColor(fcText[0], fcText[1], fcText[2]);
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      const fcLines = doc.splitTextToSize(node.label, fcNodeW - 4);
      doc.text(fcLines[0], fcCX, y + fcNodeH / 2 + 1, { align: "center" });
      if (node.answer && node.type === "question") {
        doc.setFillColor(255, 255, 255); doc.setDrawColor(200, 200, 200);
        doc.roundedRect(fcX + fcNodeW + 6, y + 2, 70, fcNodeH - 4, 1.5, 1.5, "FD");
        doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
        const ansLines = doc.splitTextToSize("Selected: " + node.answer, 66);
        doc.text(ansLines[0], fcX + fcNodeW + 9, y + fcNodeH / 2 + 1);
      }
      if (i < fcNodes.length - 1) {
        doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.4);
        doc.line(fcCX, y + fcNodeH, fcCX, y + fcNodeH + fcGapY);
        doc.line(fcCX, y + fcNodeH + fcGapY - 1, fcCX - 1.5, y + fcNodeH + fcGapY - 2.5);
        doc.line(fcCX, y + fcNodeH + fcGapY - 1, fcCX + 1.5, y + fcNodeH + fcGapY - 2.5);
        doc.setLineWidth(0.2);
      }
      doc.setTextColor(0, 0, 0);
      y += fcNodeH + fcGapY;
    });
    y += 2;
  }

  // ── F10 Field checklist table ─────────────────────────────────
  checkPage(30);
  sectionHead("F10 Field Checklist (CDM 2015 Schedule 1)");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
  const fieldIntro = `Summary: ${fieldStatus.providedCount} of ${fieldStatus.totalCount} fields captured from the inputs above. Remaining fields must be completed on the F10 portal.`;
  doc.text(fieldIntro, M, y); y += 5;
  doc.setTextColor(0, 0, 0);

  const fieldCols = [90, 30, 55, 15];
  // Header row
  let cx = M;
  ["Field", "Section", "Reg Ref", "Captured"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, fieldCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4);
    cx += fieldCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  fieldStatus.fields.forEach((fs, ri) => {
    checkPage(6);
    cx = M;
    const cells = [fs.field.label, fs.field.section, fs.field.mandatoryReg, fs.provided ? "[YES]" : "[ ]"];
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, fieldCols[i], 5.5, "FD"); }
      else { doc.setDrawColor(200, 200, 200); doc.rect(cx, y, fieldCols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, fieldCols[i] - 3);
      if (i === 3 && fs.provided) doc.setTextColor(22, 163, 74);
      doc.text(lines[0], cx + 2, y + 3.8);
      doc.setTextColor(0, 0, 0);
      cx += fieldCols[i];
    });
    y += 5.5;
  });
  y += 6;

  // ── Responsible person / submitter ────────────────────────────
  checkPage(25);
  sectionHead("Who Submits the F10?");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const respLines = doc.splitTextToSize(terminal.responsiblePerson, CW - 4);
  doc.text(respLines, M + 2, y); y += respLines.length * 3.5 + 4;

  // ── Record keeping ───────────────────────────────────────────
  checkPage(20);
  sectionHead("Record Keeping & Retention");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const rkLines = doc.splitTextToSize(terminal.recordKeeping, CW - 4);
  doc.text(rkLines, M + 2, y); y += rkLines.length * 3.5 + 4;

  // ── Additional notes ─────────────────────────────────────────
  if (terminal.additionalNotes && terminal.additionalNotes.length > 0) {
    checkPage(20);
    sectionHead("Important Notes");
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    terminal.additionalNotes.forEach(note => {
      checkPage(8);
      const nLines = doc.splitTextToSize(`- ${note}`, CW - 6);
      doc.text(nLines, M + 2, y); y += nLines.length * 3.5 + 1;
    });
    y += 3;
  }

  // ── Regulatory references ────────────────────────────────────
  checkPage(20);
  sectionHead("Regulatory References");
  {
    cx = M;
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, CW, 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text("Regulation / Standard", cx + 2, y + 4);
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);
    terminal.regulations.forEach((reg, ri) => {
      checkPage(6);
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y, CW, 5.5, "FD"); }
      else { doc.setDrawColor(200, 200, 200); doc.rect(M, y, CW, 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      doc.text(reg, M + 2, y + 3.8);
      y += 5.5;
    });
    y += 6;
  }

  // ── HSE contacts panel ───────────────────────────────────────
  checkPage(30);
  sectionHead("HSE Contact Details");
  const contactItems: [string, string][] = [
    ["F10 Online Portal:", HSE_CONTACTS.f10Portal],
    ["F10 Guidance:", HSE_CONTACTS.f10Guidance],
    ["HSE L153 Guidance:", HSE_CONTACTS.l153Url],
    ["HSE Info Line:", `${HSE_CONTACTS.hseInfoLine} (${HSE_CONTACTS.hseInfoLineHours})`],
    ["F10 Enquiries:", `Telephone ${HSE_CONTACTS.hseInfoLine} (HSE no longer accepts F10 by email or post)`],
    ["HSE Address:", HSE_CONTACTS.hseAddress],
  ];
  const contactPanelH = contactItems.length * 4.5 + 6;
  checkPage(contactPanelH + 4);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, contactPanelH, 1.5, 1.5, "FD");
  contactItems.forEach(([label, val]) => {
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, y + 1);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const valLines = doc.splitTextToSize(val, CW - 55);
    doc.text(valLines[0], M + 48, y + 1);
    if (valLines.length > 1) { y += 3.5; doc.text(valLines[1], M + 48, y + 1); }
    y += 4.5;
  });
  doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220);
  y += 6;

  // ── Cross-references ─────────────────────────────────────────
  checkPage(25);
  sectionHead("Related Ebrora Tools");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  CROSS_REFS.forEach(cr => {
    checkPage(6);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${cr.name}:`, M + 2, y);
    doc.setFont("helvetica", "normal");
    const crLines = doc.splitTextToSize(cr.relevance, CW - 40);
    doc.text(crLines[0], M + 45, y);
    y += 4;
  });
  y += 4;

  // ── Sign-off ─────────────────────────────────────────────────
  checkPage(55);
  y += 2;
  doc.setDrawColor(30, 30, 30); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); doc.setLineWidth(0.2); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5); doc.text("Client / Submitting Party", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── SITE DISPLAY NOTICE STUB (appended as final page under reg 6(4)) ────
  if (terminal.displayRequired) {
    doc.addPage();
    // Dark top banner
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 20, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("SITE DISPLAY NOTICE", M, 9);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Issued under CDM 2015 regulation 6(4) -- Notification displayed on site", M, 15);
    doc.setTextColor(0, 0, 0);
    let sy = 30;

    // Giant F10 header
    doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69); doc.setLineWidth(1);
    doc.roundedRect(M, sy, CW, 20, 2, 2, "FD");
    doc.setTextColor(27, 87, 69); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("F10 NOTIFICATION", W / 2, sy + 9, { align: "center" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("This project is notifiable to the Health and Safety Executive under CDM 2015 reg 6", W / 2, sy + 15, { align: "center" });
    doc.setLineWidth(0.2); doc.setTextColor(0, 0, 0);
    sy += 26;

    // Project block
    doc.setFillColor(248, 248, 248); doc.setDrawColor(200, 200, 200);
    doc.roundedRect(M, sy, CW, 90, 2, 2, "FD");

    const dispFld = (label: string, value: string, lineY: number, cont: boolean = false) => {
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
      doc.text(label, M + 4, lineY);
      doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); doc.setFontSize(10);
      const vLines = doc.splitTextToSize(value || "(to be completed)", CW - 65);
      doc.text(vLines[0], M + 55, lineY);
      if (vLines.length > 1 && cont) {
        doc.text(vLines[1], M + 55, lineY + 5);
      }
    };

    let dy = sy + 8;
    dispFld("Project:", inputs.projectName, dy); dy += 7;
    dispFld("Site Address:", inputs.projectAddress, dy, true); dy += 12;
    dispFld("Existing Use:", inputs.existingUse, dy); dy += 7;
    dispFld("Local Authority:", inputs.localAuthority, dy); dy += 7;
    dispFld("Planned Start:", inputs.plannedStartDate, dy); dy += 7;
    dispFld("Planned Duration:", `${inputs.durationWeeks} weeks`, dy); dy += 7;
    dispFld("Peak Workforce:", `${inputs.peakSimultaneousWorkers} workers simultaneously`, dy); dy += 7;
    dispFld("Demolition?:", inputs.demolitionInvolved ? "Yes" : "No", dy); dy += 7;
    sy += 96;

    // Duty holders block
    doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69);
    doc.roundedRect(M, sy, CW, 60, 2, 2, "FD");
    doc.setTextColor(27, 87, 69); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("DUTY HOLDERS", M + 4, sy + 8);
    doc.setTextColor(0, 0, 0); dy = sy + 16;
    dispFld("Client:", inputs.clientName, dy); dy += 8;
    dispFld("Principal Designer:", inputs.pdName, dy); dy += 8;
    dispFld("Principal Contractor:", inputs.pcName, dy); dy += 8;
    dispFld("HSE Ref:", inputs.hseRegistrationRef || "(F10 reference from HSE on submission)", dy); dy += 8;
    sy += 66;

    // Reg 6(4) footer block
    doc.setFillColor(254, 249, 195); doc.setDrawColor(161, 98, 7);
    doc.roundedRect(M, sy, CW, 30, 2, 2, "FD");
    doc.setTextColor(120, 53, 15); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("CDM 2015 Regulation 6(4) -- Display of Notification", M + 4, sy + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(80, 40, 20);
    const regText = "A copy of the most recent notification of project must be displayed in the construction site office in a comprehensible form where it can be read by any worker engaged in the construction work. This notice must be updated whenever the particulars of the notification change (reg 6(2)).";
    const regLines = doc.splitTextToSize(regText, CW - 10);
    doc.text(regLines, M + 4, sy + 12);
    doc.setTextColor(0, 0, 0); doc.setLineWidth(0.2);
    sy += 36;

    // Display metadata
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
    doc.text(`Display copy issued: ${header.date || todayISO()} | Ref: ${docRef} | Source: ${HSE_CONTACTS.f10Portal}`, M, sy + 4);
    doc.setTextColor(0, 0, 0);
  }

  // ── Footer on all pages ───────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "F10 notification assessment using CDM 2015 reg 6. This tool provides guidance only -- it does not constitute legal advice. Always verify with HSE guidance L153.",
      M, 288,
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 60, 292);
  }

  doc.save(`f10-notification-checker-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function F10NotificationCheckerClient() {
  // Settings (standard 5-col PAID grid)
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Project inputs (hybrid screen)
  const [inputs, setInputs] = useState<ProjectInputs>({ ...DEFAULT_INPUTS });
  const updateInput = useCallback(<K extends keyof ProjectInputs>(key: K, value: ProjectInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // Decision tree state
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState<F10Category | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [path, setPath] = useState<DecisionPathStep[]>([]);
  const [terminalResult, setTerminalResult] = useState<TerminalResult | null>(null);

  const allNodes = useMemo(() => getAllNodes(), []);
  const currentNode = currentNodeId ? allNodes[currentNodeId] : null;

  const personDays = useMemo(() => computePersonDays(inputs), [inputs]);
  const deadline = useMemo(() => {
    if (!terminalResult || !inputs.plannedStartDate) return null;
    return calculateDeadline(inputs.plannedStartDate, terminalResult.recommendedLeadDays ?? 14);
  }, [terminalResult, inputs.plannedStartDate]);

  const fieldStatus = useMemo(() => computeF10FieldStatus(inputs), [inputs]);

  const handleCategorySelect = useCallback((cat: F10Category) => {
    setCategory(cat);
    setCurrentNodeId(CATEGORY_FIRST_NODE[cat]);
    setPath([]);
    setTerminalResult(null);
  }, []);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (!currentNode) return;
    const option = currentNode.options[optionIndex];
    const step: DecisionPathStep = {
      nodeId: currentNode.id,
      question: currentNode.question,
      selectedOption: option.label,
      regulation: currentNode.regulation,
    };
    const newPath = [...path, step];
    setPath(newPath);
    if (option.terminalId) {
      const t = TERMINAL_RESULTS[option.terminalId];
      if (t) {
        setTerminalResult(t);
        setCurrentNodeId(null);
      }
    } else if (option.nextNodeId) {
      if (allNodes[option.nextNodeId]) {
        setCurrentNodeId(option.nextNodeId);
      }
    }
  }, [currentNode, path, allNodes]);

  const handleBack = useCallback(() => {
    if (terminalResult) {
      setTerminalResult(null);
      if (path.length > 0) {
        const lastStep = path[path.length - 1];
        setCurrentNodeId(lastStep.nodeId);
        setPath(path.slice(0, -1));
      }
    } else if (path.length > 0) {
      const lastStep = path[path.length - 1];
      setCurrentNodeId(lastStep.nodeId);
      setPath(path.slice(0, -1));
    } else if (category) {
      setCategory(null);
      setCurrentNodeId(null);
    } else {
      setStarted(false);
    }
  }, [terminalResult, path, category]);

  const handleExport = useCallback(async () => {
    if (!category || !terminalResult) return;
    setExporting(true);
    try {
      await exportPDF(
        { company, site, manager, assessedBy, date: assessDate },
        inputs, category, path, terminalResult,
      );
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, inputs, category, path, terminalResult]);

  const clearAll = useCallback(() => {
    setStarted(false);
    setCategory(null);
    setCurrentNodeId(null);
    setPath([]);
    setTerminalResult(null);
    setInputs({ ...DEFAULT_INPUTS });
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const restartAssessment = useCallback(() => {
    setCategory(null);
    setCurrentNodeId(null);
    setPath([]);
    setTerminalResult(null);
  }, []);

  const catLabel = category ? F10_CATEGORIES.find(c => c.id === category)?.label || "" : "";

  // ── Intro screen ──────────────────────────────────────────────
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#1B5745] via-[#1B5745] to-[#143F33] px-6 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
              <span className="text-2xl">F10</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">F10 Notification Checker</h2>
            <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
              Determine whether your construction project requires F10 notification to HSE under CDM 2015 reg 6. Covers notifiability thresholds, update triggers on existing projects, domestic client duty transfer under reg 7, and site display obligations under reg 6(4).
            </p>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "1", title: "Enter Project Details", desc: "Programme duration, workforce, contractors, duty holders, and addresses. Person-days auto-computed." },
                { icon: "2", title: "Select Assessment Type", desc: "New project notifiability, existing project update, domestic client check, or site display compliance." },
                { icon: "3", title: "Answer the Tree", desc: "Step through the CDM 2015 reg 6 decision tree. Receive a determination with deadline, F10 field checklist, and PDF export." },
              ].map(s => (
                <div key={s.icon} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ebrora text-white text-sm font-bold mb-2">{s.icon}</div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{s.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="text-xs font-bold text-amber-800 mb-1">Important Notice</div>
              <div className="text-xs text-amber-700 leading-relaxed">
                This tool provides guidance based on CDM 2015 and HSE L153. It does not constitute legal advice. The F10 submission is the CLIENT&apos;s statutory duty under reg 6(1); this tool helps identify whether that duty applies and what fields are required. Always verify with current HSE guidance at hse.gov.uk.
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
              <span>CDM 2015</span>
              <span>HSE L153</span>
              <span>HSWA 1974</span>
              <span>MHSWR 1999</span>
              <span>F10 Sched 1</span>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="w-full py-3 rounded-xl bg-ebrora text-white font-bold text-sm hover:bg-ebrora-dark transition-colors"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main assessment UI ────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Notifiable",
            value: terminalResult ? (terminalResult.notifiable ? "YES" : "NO") : (personDays.notifiableByRule6 ? "YES (provisional)" : "NO (provisional)"),
            sub: terminalResult ? terminalResult.title.split("--")[0].trim() : `Auto: ${personDays.workingDays}d / ${personDays.personDays}pd`,
            bgClass: terminalResult ? (terminalResult.notifiable ? "bg-red-50" : "bg-emerald-50") : (personDays.notifiableByRule6 ? "bg-orange-50" : "bg-emerald-50"),
            textClass: terminalResult ? (terminalResult.notifiable ? "text-red-800" : "text-emerald-800") : (personDays.notifiableByRule6 ? "text-orange-800" : "text-emerald-800"),
            borderClass: terminalResult ? (terminalResult.notifiable ? "border-red-200" : "border-emerald-200") : (personDays.notifiableByRule6 ? "border-orange-200" : "border-emerald-200"),
            dotClass: terminalResult ? (terminalResult.notifiable ? "bg-red-500" : "bg-emerald-500") : (personDays.notifiableByRule6 ? "bg-orange-500" : "bg-emerald-500"),
          },
          {
            label: "Deadline",
            value: deadline ? (deadline.isPastStart ? "OVERDUE" : deadline.isOverdue ? `${Math.abs(deadline.daysUntilRecommendedDeadline)}d late` : `${deadline.daysUntilRecommendedDeadline} days`) : "--",
            sub: deadline ? `Start: ${deadline.startDate}` : (inputs.plannedStartDate ? "Complete assessment" : "Enter planned start date"),
            bgClass: deadline?.isPastStart ? "bg-red-50" : deadline?.isOverdue ? "bg-orange-50" : "bg-blue-50",
            textClass: deadline?.isPastStart ? "text-red-800" : deadline?.isOverdue ? "text-orange-800" : "text-blue-800",
            borderClass: deadline?.isPastStart ? "border-red-200" : deadline?.isOverdue ? "border-orange-200" : "border-blue-200",
            dotClass: deadline?.isPastStart ? "bg-red-500" : deadline?.isOverdue ? "bg-orange-500" : "bg-blue-500",
          },
          {
            label: "F10 Fields",
            value: `${fieldStatus.providedCount} / ${fieldStatus.totalCount}`,
            sub: fieldStatus.providedCount === fieldStatus.totalCount ? "All inputs captured" : `${fieldStatus.totalCount - fieldStatus.providedCount} outstanding`,
            bgClass: "bg-purple-50",
            textClass: "text-purple-800",
            borderClass: "border-purple-200",
            dotClass: "bg-purple-500",
          },
          {
            label: "Update Req.",
            value: terminalResult ? (terminalResult.updateRequired ? "YES" : "NO") : "--",
            sub: terminalResult?.displayRequired ? "Site display: YES (reg 6(4))" : "Complete assessment",
            bgClass: terminalResult?.updateRequired ? "bg-amber-50" : "bg-cyan-50",
            textClass: terminalResult?.updateRequired ? "text-amber-800" : "text-cyan-800",
            borderClass: terminalResult?.updateRequired ? "border-amber-200" : "border-cyan-200",
            dotClass: terminalResult?.updateRequired ? "bg-amber-500" : "bg-cyan-500",
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        {(category || path.length > 0) && (
          <button onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
        )}
        <div className="flex-1" />
        {terminalResult && (
          <PaidDownloadButton hasData={true}>
            <button onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </PaidDownloadButton>
        )}
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel (5-col PAID grid: Company, Site, Site Manager, Assessed By, Date) */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Company", v: company, s: setCompany },
            { l: "Site Name", v: site, s: setSite },
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

      {/* Project inputs panel (hybrid — visible at all stages) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Project Details</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">These inputs drive the CDM 2015 reg 6(1) thresholds and populate the F10 field checklist.</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Project Name</label>
            <input type="text" value={inputs.projectName} onChange={e => updateInput("projectName", e.target.value)}
              placeholder="e.g. Main St Flats -- Fit-out"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Project / Site Address</label>
            <input type="text" value={inputs.projectAddress} onChange={e => updateInput("projectAddress", e.target.value)}
              placeholder="Full address incl. postcode"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Existing Use</label>
            <input type="text" value={inputs.existingUse} onChange={e => updateInput("existingUse", e.target.value)}
              placeholder="e.g. Vacant warehouse"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Local Authority</label>
            <input type="text" value={inputs.localAuthority} onChange={e => updateInput("localAuthority", e.target.value)}
              placeholder="e.g. Salford City Council"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Planned Start Date</label>
            <input type="date" value={inputs.plannedStartDate} onChange={e => updateInput("plannedStartDate", e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration (weeks)</label>
            <input type="number" min={0} value={inputs.durationWeeks || ""} onChange={e => updateInput("durationWeeks", Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Peak Workers (simultaneous)</label>
            <input type="number" min={0} value={inputs.peakSimultaneousWorkers || ""} onChange={e => updateInput("peakSimultaneousWorkers", Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Daily Workforce</label>
            <input type="number" min={0} value={inputs.avgDailyWorkforce || ""} onChange={e => updateInput("avgDailyWorkforce", Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Contractor Organisations</label>
            <input type="number" min={0} value={inputs.contractorOrganisationCount || ""} onChange={e => updateInput("contractorOrganisationCount", Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={inputs.demolitionInvolved} onChange={e => updateInput("demolitionInvolved", e.target.checked)}
                className="w-4 h-4 text-ebrora border-gray-300 rounded focus:ring-ebrora" />
              Demolition Involved
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={inputs.clientIsDomestic} onChange={e => updateInput("clientIsDomestic", e.target.checked)}
                className="w-4 h-4 text-ebrora border-gray-300 rounded focus:ring-ebrora" />
              Domestic Client
            </label>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Client Name</label>
            <input type="text" value={inputs.clientName} onChange={e => updateInput("clientName", e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Principal Designer</label>
            <input type="text" value={inputs.pdName} onChange={e => updateInput("pdName", e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Principal Contractor</label>
            <input type="text" value={inputs.pcName} onChange={e => updateInput("pcName", e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Brief Project Description</label>
            <input type="text" value={inputs.briefDescription} onChange={e => updateInput("briefDescription", e.target.value)}
              placeholder="e.g. Demolition of existing warehouse and erection of 12-storey residential building"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">HSE F10 Reference (if known)</label>
            <input type="text" value={inputs.hseRegistrationRef} onChange={e => updateInput("hseRegistrationRef", e.target.value)}
              placeholder="HSE acknowledgement ref"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
        {/* Auto-calc readout */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div>
            <div className="text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Working Days</div>
            <div className={`font-bold ${personDays.exceeds30WorkingDays ? "text-orange-600" : "text-gray-800"}`}>{personDays.workingDays}{personDays.exceeds30WorkingDays && " (>30)"}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Person-Days</div>
            <div className={`font-bold ${personDays.exceeds500PersonDays ? "text-orange-600" : "text-gray-800"}`}>{personDays.personDays}{personDays.exceeds500PersonDays && " (>500)"}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Peak Workers</div>
            <div className={`font-bold ${personDays.exceeds20Simultaneous ? "text-orange-600" : "text-gray-800"}`}>{inputs.peakSimultaneousWorkers}{personDays.exceeds20Simultaneous && " (>20)"}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Rule 6(1)</div>
            <div className={`font-bold ${personDays.notifiableByRule6 ? "text-red-600" : "text-emerald-600"}`}>{personDays.notifiableByRule6 ? "NOTIFIABLE" : "Not notifiable"}</div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Decision + Flowchart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Decision area (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Category Selection */}
          {!category && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">Step 1: Select Assessment Type</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">What are you assessing?</p>
              </div>
              <div className="p-4 space-y-2">
                {F10_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-ebrora/40 hover:bg-ebrora-light/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-ebrora-light text-sm font-bold text-gray-600 group-hover:text-ebrora shrink-0 mt-0.5">{cat.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-gray-800 group-hover:text-ebrora">{cat.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cat.description}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{cat.regulation}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Question */}
          {currentNode && !terminalResult && (
            <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold">{path.length + 1}</span>
                  <h3 className="text-sm font-bold text-blue-900">Question</h3>
                  {currentNode.regulation && (
                    <span className="ml-auto text-[10px] text-blue-600 font-medium">{currentNode.regulation}</span>
                  )}
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">{currentNode.question}</p>
              </div>
              {currentNode.helpText && (
                <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Guidance:</strong> {currentNode.helpText}
                  </p>
                </div>
              )}
              <div className="p-4 space-y-2">
                {currentNode.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(i)}
                    className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-ebrora/40 hover:bg-ebrora-light/20 transition-all group"
                  >
                    <div className="text-sm font-medium text-gray-800 group-hover:text-ebrora">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Terminal Result */}
          {terminalResult && (
            <div className={`border-2 rounded-xl overflow-hidden ${terminalResult.notifiable ? "border-red-300" : "border-emerald-300"}`}>
              <div className={`px-5 py-4 ${terminalResult.notifiable ? "bg-red-600" : "bg-emerald-600"} text-white`}>
                <div className="text-lg font-bold">{terminalResult.title}</div>
                <div className="text-sm opacity-90 mt-1">{terminalResult.description}</div>
              </div>
              <div className="p-5 space-y-4 bg-white">
                {/* Deadline banner */}
                {deadline && (
                  <div className={`rounded-lg p-3 ${deadline.isPastStart ? "bg-red-50 border border-red-200" : deadline.isOverdue ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"}`}>
                    <div className={`text-xs font-bold ${deadline.isPastStart ? "text-red-800" : deadline.isOverdue ? "text-orange-800" : "text-blue-800"}`}>
                      {deadline.isPastStart
                        ? `CONSTRUCTION START DATE PASSED (${Math.abs(deadline.daysUntilStart)} days ago)`
                        : deadline.isOverdue
                          ? `PAST 14-DAY RECOMMENDATION BY ${Math.abs(deadline.daysUntilRecommendedDeadline)} DAYS`
                          : `${deadline.daysUntilRecommendedDeadline} days to recommended deadline`}
                    </div>
                    <div className={`text-xs mt-1 ${deadline.isPastStart ? "text-red-700" : deadline.isOverdue ? "text-orange-700" : "text-blue-700"}`}>
                      Planned start: {deadline.startDate} | Recommended by: {deadline.recommendedByDate}
                    </div>
                  </div>
                )}

                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Deadline", value: terminalResult.deadline },
                    { label: "Method", value: terminalResult.method },
                    { label: "Form", value: terminalResult.form },
                    { label: "Update Required", value: terminalResult.updateRequired ? "YES (reg 6(2))" : "NO" },
                    { label: "Site Display", value: terminalResult.displayRequired ? "YES (reg 6(4))" : "NO" },
                    { label: "PD/PC Appointment", value: terminalResult.pdPcAppointmentRequired ? "YES (reg 5)" : "NO" },
                    ...(terminalResult.portalUrl ? [{ label: "HSE Portal", value: terminalResult.portalUrl }] : []),
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5 break-all">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Responsible person */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-blue-800 mb-1">Who Submits the F10?</div>
                  <div className="text-xs text-blue-700 leading-relaxed">{terminalResult.responsiblePerson}</div>
                </div>

                {/* Record keeping */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-bold text-gray-700 mb-1">Record Keeping</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{terminalResult.recordKeeping}</div>
                </div>

                {/* Additional notes */}
                {terminalResult.additionalNotes && terminalResult.additionalNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-gray-700">Important Notes</div>
                    {terminalResult.additionalNotes.map((note, i) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-600">
                        <span className="text-ebrora font-bold mt-0.5 shrink-0">-</span>
                        <span className="leading-relaxed">{note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regulations */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-gray-700">Regulatory References</div>
                  {terminalResult.regulations.map((reg, i) => (
                    <div key={i} className="text-xs text-gray-500">{reg}</div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button onClick={restartAssessment}
                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    New Assessment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Flowchart + field checklist */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Decision Pathway</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Live flowchart of your assessment</p>
            </div>
            <div className="p-4">
              {(category || path.length > 0) ? (
                <LiveFlowchart
                  category={category}
                  path={path}
                  currentNodeId={currentNodeId}
                  terminalResult={terminalResult}
                />
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  Select an assessment type to begin
                </div>
              )}
            </div>
          </div>

          {/* F10 field checklist */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">F10 Field Checklist</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">CDM 2015 Sched 1 mandatory fields -- {fieldStatus.providedCount}/{fieldStatus.totalCount} captured</p>
              </div>
              <div className="divide-y divide-gray-100">
                {fieldStatus.fields.map(fs => (
                  <div key={fs.field.id} className="px-4 py-2 flex items-start gap-3">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded shrink-0 text-[10px] font-bold ${fs.provided ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {fs.provided ? "YES" : " "}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-800">{fs.field.label}</div>
                      <div className="text-[10px] text-gray-400">{fs.field.section} · {fs.field.mandatoryReg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HSE Contacts */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">HSE Contact Details</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: "F10 Portal", value: HSE_CONTACTS.f10Portal },
                  { label: "Guidance", value: HSE_CONTACTS.f10Guidance },
                  { label: "HSE Info Line", value: HSE_CONTACTS.hseInfoLine, sub: HSE_CONTACTS.hseInfoLineHours },
                  { label: "Submission", value: "Online only — HSE no longer accepts F10 by email or post" },
                  { label: "L153", value: HSE_CONTACTS.l153Url },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">{c.label}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-800 break-all">{c.value}</div>
                      {"sub" in c && c.sub && <div className="text-[10px] text-gray-400">{c.sub}</div>}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-400 leading-relaxed">{HSE_CONTACTS.hseAddress}</div>
                </div>
              </div>
            </div>
          )}

          {/* Responsible person guidance */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">{RESPONSIBLE_PERSON_GUIDANCE.title}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{RESPONSIBLE_PERSON_GUIDANCE.description}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {RESPONSIBLE_PERSON_GUIDANCE.categories.map(rp => (
                  <div key={rp.scenario} className="px-4 py-2.5 flex items-start gap-3">
                    <div className="text-xs font-medium text-gray-800 w-32 shrink-0">{rp.scenario}</div>
                    <div className="text-xs text-gray-600">{rp.responsible}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-100 space-y-1">
                {RESPONSIBLE_PERSON_GUIDANCE.additionalNotes.map((note, i) => (
                  <div key={i} className="text-[10px] text-gray-500 leading-relaxed">- {note}</div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-references */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">Related Tools</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {CROSS_REFS.map(cr => (
                  <div key={cr.slug} className="px-4 py-2.5">
                    <div className="text-xs font-bold text-gray-800">{cr.name}</div>
                    <div className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{cr.relevance}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Assessment based on the Construction (Design and Management) Regulations 2015, HSE L153 &quot;Managing health and safety in construction&quot;, and the Health and Safety at Work etc. Act 1974. This tool provides guidance only -- it does not constitute legal advice.
        </p>
        <a href="/tools" className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
