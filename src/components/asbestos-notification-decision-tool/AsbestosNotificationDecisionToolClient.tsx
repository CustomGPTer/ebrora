// src/components/asbestos-notification-decision-tool/AsbestosNotificationDecisionToolClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  TERMINAL_RESULTS, CONTACTS, ASB5_FIELDS,
  getAllNodes, calculateDeadline,
} from "@/data/asbestos-notification-decision-tool";
import type {
  TreeNode, TerminalResult, DecisionPathStep,
} from "@/data/asbestos-notification-decision-tool";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Live Flowchart SVG ──────────────────────────────────────────
function LiveFlowchart({
  path,
  currentNodeId,
  terminalResult,
}: {
  path: DecisionPathStep[];
  currentNodeId: string | null;
  terminalResult: TerminalResult | null;
}) {
  interface FcNode { id: string; label: string; type: "start" | "question" | "terminal-yes" | "terminal-no"; answer?: string }
  const nodes = useMemo(() => {
    const n: FcNode[] = [];
    n.push({ id: "start", label: "Asbestos Assessment", type: "start" });
    path.forEach(step => {
      const shortQ = step.question.length > 50 ? step.question.slice(0, 47) + "..." : step.question;
      n.push({ id: step.nodeId, label: shortQ, type: "question", answer: step.selectedOption.length > 34 ? step.selectedOption.slice(0, 32) + "..." : step.selectedOption });
    });
    if (currentNodeId && !terminalResult) {
      const allN = getAllNodes();
      const node = allN[currentNodeId];
      if (node) n.push({ id: currentNodeId, label: node.question.length > 50 ? node.question.slice(0, 47) + "..." : node.question, type: "question" });
    }
    if (terminalResult) {
      const isReport = terminalResult.category === "licensed" || terminalResult.category === "nnlw";
      n.push({ id: terminalResult.id, label: terminalResult.title.length > 30 ? terminalResult.title.slice(0, 28) + "..." : terminalResult.title, type: isReport ? "terminal-yes" : "terminal-no" });
    }
    return n;
  }, [path, currentNodeId, terminalResult]);

  if (nodes.length <= 1 && !currentNodeId) return null;

  const nodeW = 200, nodeH = 44, gapY = 24, padX = 20, padY = 20;
  const totalH = nodes.length * (nodeH + gapY) - gapY + padY * 2;
  const totalW = nodeW + padX * 2;
  const cx = padX + nodeW / 2;

  const getNodeFill = (n: FcNode) => {
    if (n.type === "start") return "#1B5745";
    if (n.type === "terminal-yes") return "#DC2626";
    if (n.type === "terminal-no") return "#16A34A";
    if (!n.answer) return "#2563EB";
    return "#E8F0EC";
  };
  const getTextFill = (n: FcNode) => {
    if (n.type === "start" || n.type === "terminal-yes" || n.type === "terminal-no") return "#FFFFFF";
    if (!n.answer) return "#FFFFFF";
    return "#1B5745";
  };
  const getStroke = (n: FcNode) => {
    if (n.type === "terminal-yes") return "#991B1B";
    if (n.type === "terminal-no") return "#15803D";
    if (!n.answer) return "#2563EB";
    return "#1B5745";
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full h-auto" style={{ maxHeight: Math.min(totalH, 600), minHeight: 120 }}>
        <defs>
          <marker id="ah-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#1B5745" /></marker>
          <marker id="ah-b" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#2563EB" /></marker>
          <filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" /></filter>
        </defs>
        {nodes.map((n, i) => {
          const y2 = padY + i * (nodeH + gapY);
          const fill = getNodeFill(n);
          const textFill = getTextFill(n);
          const stroke = getStroke(n);
          const isActive = !n.answer && n.type === "question";
          const isTerminal = n.type === "terminal-yes" || n.type === "terminal-no";
          const rr = isTerminal ? 22 : n.type === "start" ? 12 : 8;
          const connector = i < nodes.length - 1 ? (
            <line x1={cx} y1={y2 + nodeH} x2={cx} y2={y2 + nodeH + gapY}
              stroke={n.answer || n.type === "start" ? "#1B5745" : "#2563EB"}
              strokeWidth={n.answer || n.type === "start" ? 2.5 : 1.5}
              strokeDasharray={n.answer || n.type === "start" ? "none" : "4,3"}
              markerEnd={n.answer || n.type === "start" ? "url(#ah-g)" : "url(#ah-b)"} />
          ) : null;

          return (
            <g key={n.id + "-" + i}>
              {connector}
              {isActive && <rect x={padX - 3} y={y2 - 3} width={nodeW + 6} height={nodeH + 6} rx={rr + 2} fill="none" stroke="#2563EB" strokeWidth={2} opacity={0.3}><animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" /></rect>}
              <rect x={padX} y={y2} width={nodeW} height={nodeH} rx={rr} fill={fill} stroke={stroke} strokeWidth={isActive ? 2.5 : 1.5} filter={isActive ? "url(#sh)" : undefined} />
              <text x={cx} y={y2 + (isTerminal ? nodeH / 2 - 3 : nodeH / 2)} textAnchor="middle" dominantBaseline="middle" fontSize={isTerminal || n.type === "start" ? 9 : 8} fontWeight={n.type !== "question" || isActive ? 700 : 600} fill={textFill}>
                {n.label.length > 30 ? n.label.slice(0, 28) + "..." : n.label}
              </text>
              {isTerminal && <text x={cx} y={y2 + nodeH / 2 + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.8)">{n.type === "terminal-yes" ? "NOTIFICATION REQUIRED" : "NO NOTIFICATION"}</text>}
              {n.answer && (
                <g>
                  <rect x={padX + nodeW + 6} y={y2 + nodeH / 2 - 8} width={Math.min(n.answer.length * 4.5 + 12, 160)} height={16} rx={8} fill="#F0FDF4" stroke="#BBF7D0" strokeWidth={1} />
                  <text x={padX + nodeW + 12} y={y2 + nodeH / 2 + 1} fontSize={7} fill="#166534" fontWeight={600}>{n.answer}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  pathSteps: DecisionPathStep[],
  terminal: TerminalResult,
  plannedStartDate: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  const docRef = `ASB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let y = 0;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("ASBESTOS NOTIFICATION DECISION TOOL (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text("ebrora.com", W - M - 18, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  function sectionHead(title: string) {
    checkPage(12);
    doc.setFillColor(27, 87, 69); doc.rect(M, y, 3, 6, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(title, M + 6, y + 4.5);
    doc.setTextColor(0, 0, 0); y += 9;
  }

  // ── Header
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("ASBESTOS NOTIFICATION DECISION TOOL", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 15);
  doc.text("ebrora.com", W - M - 18, 15);
  doc.setFontSize(6);
  doc.text("Control of Asbestos Regulations 2012 | HSG264 | HSG247 | HSG210", M, 19);
  doc.setTextColor(0, 0, 0); y = 26;

  // ── Site info panel
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  drawFld("Company:", header.company, M + 3, y + 1, 50);
  drawFld("Site:", header.site, M + CW / 2, y + 1, 50);
  drawFld("Site Manager:", header.manager, M + 3, y + 8, 40);
  drawFld("Assessed By:", header.assessedBy, M + CW / 2, y + 8, 40);
  drawFld("Date:", header.date, M + 3, y + 15, 30);
  if (plannedStartDate) { drawFld("Planned Start:", plannedStartDate, M + CW / 2, y + 15, 30); }
  y += 22;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Asbestos notification assessment for ${header.site || "the above site"}. Assessment conducted using the CAR 2012 decision tree to determine work category (licensed/NNLW/non-licensed), notification requirements, and duty holder responsibilities.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Urgency panel
  const isNotifiable = terminal.notificationRequired;
  if (isNotifiable) {
    checkPage(26);
    const isLicensed = terminal.category === "licensed";
    const urgRGB: [number, number, number] = isLicensed ? [185, 28, 28] : [194, 65, 12];
    const urgBgRGB: [number, number, number] = isLicensed ? [254, 226, 226] : [255, 237, 213];
    const urgLabel = isLicensed ? "LICENSED WORK -- 14-DAY NOTIFICATION REQUIRED" : "NNLW -- NOTIFICATION BEFORE START";
    const urgDesc = isLicensed
      ? "ASB5 notification must be submitted to the enforcing authority at least 14 days before work begins."
      : "ASB5 notification must be submitted before work begins (no 14-day wait).";
    doc.setFillColor(urgBgRGB[0], urgBgRGB[1], urgBgRGB[2]);
    doc.setDrawColor(urgRGB[0], urgRGB[1], urgRGB[2]); doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, 22, 2, 2, "FD"); doc.setLineWidth(0.2);
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

  // ── Determination banner
  const bannerRgb: [number, number, number] = terminal.category === "licensed" ? [185, 28, 28] : terminal.category === "nnlw" ? [194, 65, 12] : terminal.category === "survey-required" ? [161, 98, 7] : [22, 163, 74];
  checkPage(20);
  doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
  doc.roundedRect(M, y, CW, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  const titleShort = terminal.title.length > 55 ? terminal.title.slice(0, 52) + "..." : terminal.title;
  doc.text(titleShort, M + 5, y + 7);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(isNotifiable ? "ASB5 notification required" : "No notification required", M + 5, y + 13);
  doc.setTextColor(0, 0, 0); y += 22;

  // ── Summary panel
  checkPage(45);
  const summaryItems: [string, string][] = [
    ["Work Category:", terminal.category === "licensed" ? "Licensed" : terminal.category === "nnlw" ? "NNLW" : terminal.category === "non-licensed" ? "Non-licensed" : terminal.category],
    ["Notification Required:", isNotifiable ? "YES -- ASB5" : "NO"],
    ["Analyst Required:", terminal.analystRequired ? "YES -- UKAS accredited" : "NO"],
    ["4-Stage Clearance:", terminal.fourStageClearance ? "YES" : "NO"],
  ];
  if (isNotifiable && terminal.notificationBody) summaryItems.push(["Notify:", terminal.notificationBody]);
  if (isNotifiable && terminal.notificationDeadlineDays !== undefined) summaryItems.push(["Deadline:", terminal.notificationDeadlineDays === 14 ? "14 days before work starts" : "Before work starts"]);
  const dl = (plannedStartDate && terminal.notificationDeadlineDays) ? calculateDeadline(plannedStartDate, terminal.notificationDeadlineDays) : null;
  if (dl) {
    summaryItems.push(["Notification By:", dl.deadlineDate]);
    summaryItems.push(["Days Remaining:", dl.isOverdue ? `OVERDUE by ${Math.abs(dl.daysRemaining)} days` : `${dl.daysRemaining} days`]);
  }
  const panelH = summaryItems.length * 4 + 8;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Determination Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const valLines = doc.splitTextToSize(value, CW - 70);
    doc.text(valLines[0], M + 55, y);
    doc.setTextColor(0, 0, 0); y += 4;
  });
  y += 4;

  // ── Timeline graphic
  if (dl && plannedStartDate && terminal.notificationDeadlineDays && terminal.notificationDeadlineDays > 0) {
    checkPage(30);
    sectionHead("Notification Timeline");
    const tlX = M + 8, tlW = CW - 16, tlY = y;
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const notifDate = new Date(dl.deadlineDate);
    const startDate = new Date(plannedStartDate);
    const totalSpanDays = terminal.notificationDeadlineDays + 4;
    const dayToX = (d: Date) => {
      const refDate = new Date(dl.deadlineDate);
      refDate.setDate(refDate.getDate() - 2);
      const diff = Math.ceil((d.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      const ratio = Math.max(0, Math.min(1, diff / totalSpanDays));
      return tlX + ratio * tlW;
    };
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.8);
    doc.line(tlX, tlY + 8, tlX + tlW, tlY + 8); doc.setLineWidth(0.2);
    const todayX = dayToX(todayDate);
    const notifX = dayToX(notifDate);
    const startX = dayToX(startDate);
    const fillColor: [number, number, number] = dl.isOverdue ? [220, 38, 38] : [22, 163, 74];
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(tlX, tlY + 6.5, Math.min(Math.max(todayX - tlX, 0), tlW), 3, "F");
    // Notification deadline marker
    doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]); doc.circle(notifX, tlY + 8, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
    doc.text("ASB5 BY", notifX - 5, tlY + 2);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(dl.deadlineDate, notifX - 5, tlY + 14);
    // Work start marker
    doc.setFillColor(27, 87, 69); doc.circle(startX, tlY + 8, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text("WORK START", startX - 6, tlY + 2);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(plannedStartDate, startX - 5, tlY + 14);
    // Today
    if (todayX > tlX + 5 && todayX < tlX + tlW - 5) {
      doc.setDrawColor(100, 100, 100); doc.setLineDashPattern([1, 1], 0);
      doc.line(todayX, tlY + 3, todayX, tlY + 13); doc.setLineDashPattern([], 0);
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
      doc.text("TODAY", todayX - 4, tlY + 18);
    }
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    if (dl.isOverdue) { doc.setTextColor(220, 38, 38); doc.text(`OVERDUE by ${Math.abs(dl.daysRemaining)} days`, M + CW / 2 - 15, tlY + 22); }
    else { doc.setTextColor(22, 163, 74); doc.text(`${dl.daysRemaining} days remaining`, M + CW / 2 - 12, tlY + 22); }
    doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220);
    y = tlY + 26;
  }

  // ── Decision Flowchart
  checkPage(30);
  sectionHead("Decision Pathway Flowchart");
  {
    const fcX = M + 10, fcNodeW = 70, fcNodeH = 11, fcGapY = 8;
    const fcCX = fcX + fcNodeW / 2;
    interface FcN { label: string; type: "start" | "question" | "yes" | "no"; answer?: string }
    const fcNodes: FcN[] = [];
    fcNodes.push({ label: "Asbestos Assessment", type: "start" });
    pathSteps.forEach(step => {
      fcNodes.push({ label: step.question.length > 45 ? step.question.slice(0, 42) + "..." : step.question, type: "question", answer: step.selectedOption.length > 40 ? step.selectedOption.slice(0, 37) + "..." : step.selectedOption });
    });
    const isTermYes = terminal.category === "licensed" || terminal.category === "nnlw" || terminal.category === "survey-required";
    fcNodes.push({ label: terminal.category === "licensed" ? "LICENSED" : terminal.category === "nnlw" ? "NNLW" : terminal.category === "non-licensed" ? "NON-LICENSED" : terminal.category === "survey-required" ? "SURVEY REQUIRED" : "LOW RISK", type: isTermYes ? "yes" : "no" });

    fcNodes.forEach((node, ni) => {
      checkPage(fcNodeH + fcGapY + 4);
      const ny = y;
      let fillR = 248, fillG = 250, fillB = 252, strokeR = 200, strokeG = 200, strokeB = 200, txtR = 55, txtG = 65, txtB = 81;
      let rr2 = 2;
      if (node.type === "start") { fillR = 27; fillG = 87; fillB = 69; txtR = txtG = txtB = 255; strokeR = 27; strokeG = 87; strokeB = 69; rr2 = 3; }
      else if (node.type === "yes") { fillR = 220; fillG = 38; fillB = 38; txtR = txtG = txtB = 255; strokeR = 185; strokeG = 28; strokeB = 28; rr2 = 5; }
      else if (node.type === "no") { fillR = 22; fillG = 163; fillB = 74; txtR = txtG = txtB = 255; strokeR = 21; strokeG = 128; strokeB = 61; rr2 = 5; }
      else { fillR = 239; fillG = 246; fillB = 255; strokeR = 147; strokeG = 197; strokeB = 253; }

      doc.setFillColor(fillR, fillG, fillB); doc.setDrawColor(strokeR, strokeG, strokeB);
      doc.roundedRect(fcX, ny, fcNodeW, fcNodeH, rr2, rr2, "FD");
      doc.setTextColor(txtR, txtG, txtB); doc.setFontSize(node.type === "start" || node.type === "yes" || node.type === "no" ? 7 : 5.5);
      doc.setFont("helvetica", node.type === "question" ? "normal" : "bold");
      const nl = doc.splitTextToSize(node.label, fcNodeW - 6);
      const tsy = ny + (fcNodeH / 2) - ((nl.length - 1) * 2.5 / 2) + 1;
      nl.forEach((line: string, li: number) => { doc.text(line, fcCX, tsy + li * 2.5, { align: "center" }); });

      if (node.answer) {
        const bx = fcX + fcNodeW + 4;
        const bw = Math.min(doc.getTextWidth(node.answer) + 8, 70);
        doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208);
        doc.roundedRect(bx, ny + 1.5, bw, fcNodeH - 3, 2, 2, "FD");
        doc.setTextColor(22, 101, 52); doc.setFontSize(5); doc.setFont("helvetica", "bold");
        doc.text(doc.splitTextToSize(node.answer, bw - 4)[0], bx + 2, ny + fcNodeH / 2 + 0.5);
        doc.setDrawColor(187, 247, 208); doc.setLineWidth(0.4);
        doc.line(fcX + fcNodeW, ny + fcNodeH / 2, bx, ny + fcNodeH / 2); doc.setLineWidth(0.2);
      }
      y = ny + fcNodeH;
      if (ni < fcNodes.length - 1) {
        const completed = node.type === "start" || !!node.answer;
        doc.setDrawColor(completed ? 27 : 200, completed ? 87 : 200, completed ? 69 : 200);
        doc.setLineWidth(completed ? 0.6 : 0.3);
        doc.line(fcCX, y, fcCX, y + fcGapY - 2);
        doc.setFillColor(completed ? 27 : 200, completed ? 87 : 200, completed ? 69 : 200);
        const tipY2 = y + fcGapY - 1;
        doc.triangle(fcCX, tipY2, fcCX - 1.5, tipY2 - 2.5, fcCX + 1.5, tipY2 - 2.5, "F");
        doc.setLineWidth(0.2); y += fcGapY;
      }
      doc.setDrawColor(220, 220, 220);
    });
    y += 6;
  }

  // ── Decision Pathway Table
  checkPage(20);
  sectionHead("Decision Pathway Detail");
  const cols = [10, CW - 10 - 60, 60];
  let cx = M;
  ["#", "Question", "Answer Selected"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4); cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6; doc.setDrawColor(200, 200, 200);
  pathSteps.forEach((step, si) => {
    const rowH = 8; checkPage(rowH); cx = M;
    const shortQ = step.question.length > 75 ? step.question.slice(0, 72) + "..." : step.question;
    const shortA = step.selectedOption.length > 38 ? step.selectedOption.slice(0, 35) + "..." : step.selectedOption;
    const isLast = si === pathSteps.length - 1;
    const rowBg: [number, number, number] = isLast ? (terminal.notificationRequired ? [254, 226, 226] : [240, 253, 244]) : (si % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
    if (isLast) { doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]); doc.rect(M, y, 1.5, rowH, "F"); }
    [`${si + 1}`, shortQ, shortA].forEach((t, i) => {
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]); doc.setDrawColor(200, 200, 200);
      doc.rect(cx, y, cols[i], rowH, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, cols[i] - 4);
      doc.text(lines[0], cx + 2, y + 3.5);
      if (lines.length > 1) doc.text(lines[1], cx + 2, y + 6.5);
      cx += cols[i];
    });
    doc.setDrawColor(200, 200, 200); y += rowH;
  });
  y += 6;

  // ── Actions Checklist
  checkPage(30);
  sectionHead("Actions To Take Now");
  const cbSize = 3.5;
  terminal.actions.forEach((action, ai) => {
    checkPage(7);
    doc.setDrawColor(180, 180, 180); doc.setFillColor(255, 255, 255);
    doc.rect(M + 2, y, cbSize, cbSize, "FD");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    const aLines = doc.splitTextToSize(action, CW - 12);
    doc.text(aLines, M + 8, y + 2.8);
    y += Math.max(aLines.length * 3.2, 5) + 1;
    if (ai < terminal.actions.length - 1) { doc.setDrawColor(240, 240, 240); doc.line(M + 2, y - 0.5, M + CW - 2, y - 0.5); doc.setDrawColor(220, 220, 220); }
  });
  y += 4;

  // ── 4-Stage Clearance
  if (terminal.fourStageClearance && terminal.clearanceStages) {
    checkPage(25);
    sectionHead("4-Stage Clearance Procedure");
    terminal.clearanceStages.forEach((stage, si) => {
      checkPage(8);
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      const sLines = doc.splitTextToSize(stage, CW - 6);
      doc.text(sLines, M + 2, y); y += sLines.length * 3.2 + 2;
    });
    y += 3;
  }

  // ── ASB5 Fields
  if (isNotifiable) {
    checkPage(30);
    sectionHead("ASB5 Notification -- Required Fields");
    ASB5_FIELDS.forEach((field, fi) => {
      checkPage(6);
      doc.setDrawColor(180, 180, 180); doc.setFillColor(255, 255, 255);
      doc.rect(M + 2, y, cbSize, cbSize, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      doc.text(field, M + 8, y + 2.8);
      y += 5;
    });
    y += 4;
  }

  // ── Duty Holders
  checkPage(20);
  sectionHead("Duty Holder Responsibilities");
  terminal.dutyHolders.forEach(dh => {
    checkPage(10);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(dh.role, M + 2, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    dh.duties.forEach(duty => {
      checkPage(5);
      const dLines = doc.splitTextToSize(`- ${duty}`, CW - 8);
      doc.text(dLines, M + 4, y); y += dLines.length * 3 + 0.5;
    });
    y += 3;
  });
  y += 3;

  // ── Record Keeping
  checkPage(15);
  sectionHead("Record Keeping");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const rkLines = doc.splitTextToSize(terminal.recordKeeping, CW - 4);
  doc.text(rkLines, M + 2, y); y += rkLines.length * 3.5 + 4;

  // ── Additional Notes
  if (terminal.additionalNotes && terminal.additionalNotes.length > 0) {
    checkPage(15);
    sectionHead("Important Notes");
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    terminal.additionalNotes.forEach(note => {
      checkPage(8);
      const nLines = doc.splitTextToSize(`- ${note}`, CW - 6);
      doc.text(nLines, M + 2, y); y += nLines.length * 3.5 + 1;
    });
    y += 3;
  }

  // ── Regulations
  checkPage(20);
  sectionHead("Regulatory References");
  cx = M;
  doc.setFillColor(30, 30, 30); doc.rect(cx, y, CW, 6, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  doc.text("Regulation / Standard", cx + 2, y + 4);
  doc.setTextColor(0, 0, 0); y += 6; doc.setDrawColor(200, 200, 200);
  terminal.regulations.forEach((reg, ri) => {
    checkPage(6);
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y, CW, 5.5, "FD"); }
    else { doc.rect(M, y, CW, 5.5, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text(reg, M + 2, y + 3.8); y += 5.5;
  });
  y += 6;

  // ── Contacts
  checkPage(30);
  sectionHead("HSE Contact Details");
  const contactItems: [string, string][] = [
    ["HSE Asbestos Line:", CONTACTS.hseAsbestos],
    ["HSE Info Line:", CONTACTS.hseInfoLine],
    ["ASB5 Online:", CONTACTS.asb5Online],
    ["Asbestos Guidance:", CONTACTS.hseOnline],
    ["Find UKAS Lab:", CONTACTS.ukasLab],
    ["Post:", CONTACTS.hseAddress],
  ];
  const cpH = contactItems.length * 4.5 + 6;
  checkPage(cpH + 4);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, cpH, 1.5, 1.5, "FD");
  contactItems.forEach(([label, val]) => {
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label, M + 4, y + 1);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    const vl = doc.splitTextToSize(val, CW - 55);
    doc.text(vl[0], M + 48, y + 1);
    if (vl.length > 1) { y += 3.5; doc.text(vl[1], M + 48, y + 1); }
    y += 4.5;
  });
  doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220); y += 6;

  // ── Sign-off
  checkPage(50);
  y += 2;
  doc.setDrawColor(27, 87, 69); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); doc.setLineWidth(0.2); y += 6;
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

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Asbestos notification assessment using the Control of Asbestos Regulations 2012. This tool provides guidance only -- it does not constitute legal advice.", M, 288);
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 292);
  }
  doc.save(`asbestos-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function AsbestosNotificationDecisionToolClient() {
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [started, setStarted] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [path, setPath] = useState<DecisionPathStep[]>([]);
  const [terminalResult, setTerminalResult] = useState<TerminalResult | null>(null);
  const [plannedStartDate, setPlannedStartDate] = useState("");

  const allNodes = useMemo(() => getAllNodes(), []);
  const currentNode = currentNodeId ? allNodes[currentNodeId] : null;

  const handleStart = useCallback(() => {
    setStarted(true);
    setCurrentNodeId("age-1");
  }, []);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (!currentNode) return;
    const option = currentNode.options[optionIndex];
    const step: DecisionPathStep = { nodeId: currentNode.id, question: currentNode.question, selectedOption: option.label, regulation: currentNode.regulation };
    const newPath = [...path, step];
    setPath(newPath);
    if (option.terminalId) { setTerminalResult(TERMINAL_RESULTS[option.terminalId]); setCurrentNodeId(null); }
    else if (option.nextNodeId && allNodes[option.nextNodeId]) { setCurrentNodeId(option.nextNodeId); }
  }, [currentNode, path, allNodes]);

  const handleBack = useCallback(() => {
    if (terminalResult) {
      setTerminalResult(null);
      if (path.length > 0) { setCurrentNodeId(path[path.length - 1].nodeId); setPath(path.slice(0, -1)); }
    } else if (path.length > 0) {
      setCurrentNodeId(path[path.length - 1].nodeId);
      setPath(path.slice(0, -1));
    } else { setStarted(false); setCurrentNodeId(null); }
  }, [terminalResult, path]);

  const handleExport = useCallback(async () => {
    if (!terminalResult) return;
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, path, terminalResult, plannedStartDate); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, path, terminalResult, plannedStartDate]);

  const clearAll = useCallback(() => {
    setStarted(false); setCurrentNodeId(null); setPath([]); setTerminalResult(null); setPlannedStartDate("");
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const restartAssessment = useCallback(() => {
    setCurrentNodeId("age-1"); setPath([]); setTerminalResult(null); setPlannedStartDate("");
  }, []);

  const deadline = useMemo(() => {
    if (!terminalResult || !plannedStartDate || !terminalResult.notificationDeadlineDays) return null;
    return calculateDeadline(plannedStartDate, terminalResult.notificationDeadlineDays);
  }, [terminalResult, plannedStartDate]);

  // Intro screen
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#1B5745] via-[#1B5745] to-[#143F33] px-6 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
              <span className="text-2xl">&#9888;</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Asbestos Notification Decision Tool</h2>
            <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
              Determine whether planned work requires an HSE-licensed contractor, ASB5 notification, or 4-stage clearance under the Control of Asbestos Regulations 2012. Covers all ACM types, survey requirements, work categories, and duty holder responsibilities.
            </p>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "1", title: "Building & Survey", desc: "Confirm building age, survey status, and ACM identification." },
                { icon: "2", title: "Work Classification", desc: "Follow the CAR 2012 decision tree to classify the work category." },
                { icon: "3", title: "Get Determination", desc: "Receive licensed/NNLW/non-licensed determination with ASB5 requirements and professional PDF." },
              ].map(s => (
                <div key={s.icon} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ebrora text-white text-sm font-bold mb-2">{s.icon}</div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{s.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-xs font-bold text-red-800 mb-1">Critical Safety Notice</div>
              <div className="text-xs text-red-700 leading-relaxed">
                Asbestos kills approximately 5,000 workers per year in the UK. If you suspect asbestos is present, STOP work immediately and arrange for professional sampling. Never assume a material is safe -- if in doubt, treat it as asbestos until proven otherwise (CAR 2012 Reg 5).
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
              <span>CAR 2012</span><span>HSG264</span><span>HSG247</span><span>HSG210</span><span>CDM 2015</span><span>Hazardous Waste Regs 2005</span>
            </div>
            <button onClick={handleStart} className="w-full py-3 rounded-xl bg-ebrora text-white font-bold text-sm hover:bg-ebrora-dark transition-colors">Begin Assessment</button>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Category", value: terminalResult ? (terminalResult.category === "licensed" ? "Licensed" : terminalResult.category === "nnlw" ? "NNLW" : terminalResult.category === "non-licensed" ? "Non-Licensed" : terminalResult.category === "survey-required" ? "Survey Req." : "Low Risk") : `Step ${path.length + 1}`, sub: terminalResult ? terminalResult.title : "Assessment in progress",
            bgClass: terminalResult ? (terminalResult.category === "licensed" ? "bg-red-50" : terminalResult.category === "nnlw" ? "bg-orange-50" : "bg-emerald-50") : "bg-blue-50",
            textClass: terminalResult ? (terminalResult.category === "licensed" ? "text-red-800" : terminalResult.category === "nnlw" ? "text-orange-800" : "text-emerald-800") : "text-blue-800",
            borderClass: terminalResult ? (terminalResult.category === "licensed" ? "border-red-200" : terminalResult.category === "nnlw" ? "border-orange-200" : "border-emerald-200") : "border-blue-200",
            dotClass: terminalResult ? (terminalResult.category === "licensed" ? "bg-red-500" : terminalResult.category === "nnlw" ? "bg-orange-500" : "bg-emerald-500") : "bg-blue-500" },
          { label: "Notification", value: terminalResult ? (terminalResult.notificationRequired ? "ASB5 REQUIRED" : "NOT REQUIRED") : "--", sub: terminalResult?.notificationType || "Complete assessment",
            bgClass: terminalResult?.notificationRequired ? "bg-red-50" : "bg-emerald-50", textClass: terminalResult?.notificationRequired ? "text-red-800" : "text-emerald-800", borderClass: terminalResult?.notificationRequired ? "border-red-200" : "border-emerald-200", dotClass: terminalResult?.notificationRequired ? "bg-red-500" : "bg-emerald-500" },
          { label: "Analyst", value: terminalResult ? (terminalResult.analystRequired ? "REQUIRED" : "Not Required") : "--", sub: terminalResult?.fourStageClearance ? "4-stage clearance" : "Visual inspection only",
            bgClass: terminalResult?.analystRequired ? "bg-purple-50" : "bg-gray-50", textClass: terminalResult?.analystRequired ? "text-purple-800" : "text-gray-600", borderClass: terminalResult?.analystRequired ? "border-purple-200" : "border-gray-200", dotClass: terminalResult?.analystRequired ? "bg-purple-500" : "bg-gray-400" },
          { label: "Deadline", value: terminalResult?.notificationDeadlineDays === 14 ? "14 Days" : terminalResult?.notificationRequired ? "Before Start" : "--", sub: deadline ? (deadline.isOverdue ? `OVERDUE by ${Math.abs(deadline.daysRemaining)} days` : `${deadline.daysRemaining} days remaining`) : (terminalResult?.notificationRequired ? "Enter planned start date" : "N/A"),
            bgClass: deadline?.isOverdue ? "bg-red-50" : "bg-orange-50", textClass: deadline?.isOverdue ? "text-red-800" : "text-orange-800", borderClass: deadline?.isOverdue ? "border-red-200" : "border-orange-200", dotClass: deadline?.isOverdue ? "bg-red-500" : "bg-orange-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        {path.length > 0 && <button onClick={handleBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Back</button>}
        <div className="flex-1" />
        {terminalResult && <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>{exporting ? "Generating..." : "Download PDF"}</button>}
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site Name", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Assessed By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.l} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          {/* Current Question */}
          {currentNode && !terminalResult && (
            <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold">{path.length + 1}</span>
                  <h3 className="text-sm font-bold text-blue-900">Question</h3>
                  {currentNode.regulation && <span className="ml-auto text-[10px] text-blue-600 font-medium">{currentNode.regulation}</span>}
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">{currentNode.question}</p>
              </div>
              {currentNode.helpText && (
                <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100">
                  <p className="text-[11px] text-amber-800 leading-relaxed"><strong>Guidance:</strong> {currentNode.helpText}</p>
                </div>
              )}
              <div className="p-4 space-y-2">
                {currentNode.options.map((opt, i) => (
                  <button key={i} onClick={() => handleOptionSelect(i)} className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-ebrora/40 hover:bg-ebrora-light/20 transition-all group">
                    <div className="text-sm font-medium text-gray-800 group-hover:text-ebrora">{opt.label}</div>
                    {opt.description && <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Planned start date */}
          {terminalResult && terminalResult.notificationRequired && terminalResult.notificationDeadlineDays && terminalResult.notificationDeadlineDays > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Planned Work Start Date (for deadline calculation)</h3>
              <div className="flex items-center gap-3">
                <input type="date" value={plannedStartDate} onChange={e => setPlannedStartDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                {deadline && (
                  <div className={`text-sm font-bold ${deadline.isOverdue ? "text-red-600" : "text-emerald-600"}`}>
                    {deadline.isOverdue ? `OVERDUE -- ASB5 due by ${deadline.deadlineDate}` : `ASB5 due by ${deadline.deadlineDate} (${deadline.daysRemaining} days)`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Result */}
          {terminalResult && (
            <div className={`border-2 rounded-xl overflow-hidden ${terminalResult.category === "licensed" ? "border-red-300" : terminalResult.category === "nnlw" ? "border-orange-300" : terminalResult.category === "survey-required" ? "border-amber-300" : "border-emerald-300"}`}>
              <div className={`px-5 py-4 text-white ${terminalResult.category === "licensed" ? "bg-red-600" : terminalResult.category === "nnlw" ? "bg-orange-600" : terminalResult.category === "survey-required" ? "bg-amber-600" : "bg-emerald-600"}`}>
                <div className="text-lg font-bold">{terminalResult.title}</div>
                <div className="text-sm opacity-90 mt-1">{terminalResult.description}</div>
              </div>
              <div className="p-5 space-y-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Notification", value: terminalResult.notificationRequired ? `YES -- ${terminalResult.notificationType}` : "Not required" },
                    { label: "Analyst", value: terminalResult.analystRequired ? "UKAS-accredited analyst required" : "Not required" },
                    { label: "4-Stage Clearance", value: terminalResult.fourStageClearance ? "Required" : "Not required" },
                    ...(terminalResult.notificationBody ? [{ label: "Notify", value: terminalResult.notificationBody }] : []),
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</div>
                    </div>
                  ))}
                </div>

                {terminalResult.fourStageClearance && terminalResult.clearanceStages && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-purple-800 mb-2">4-Stage Clearance Procedure</div>
                    {terminalResult.clearanceStages.map((stage, i) => (
                      <div key={i} className="text-xs text-purple-700 leading-relaxed mb-1">{stage}</div>
                    ))}
                  </div>
                )}

                {terminalResult.dutyHolders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700">Duty Holder Responsibilities</div>
                    {terminalResult.dutyHolders.map(dh => (
                      <div key={dh.role} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-bold text-gray-800 mb-1">{dh.role}</div>
                        {dh.duties.map((d, i) => <div key={i} className="text-[11px] text-gray-600 leading-relaxed">- {d}</div>)}
                      </div>
                    ))}
                  </div>
                )}

                {terminalResult.additionalNotes && terminalResult.additionalNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-gray-700">Important Notes</div>
                    {terminalResult.additionalNotes.map((note, i) => <div key={i} className="flex gap-2 text-xs text-gray-600"><span className="text-ebrora font-bold shrink-0">-</span><span className="leading-relaxed">{note}</span></div>)}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-gray-700">Regulatory References</div>
                  {terminalResult.regulations.map((reg, i) => <div key={i} className="text-xs text-gray-500">{reg}</div>)}
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={restartAssessment} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">New Assessment</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Flowchart + contacts */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Decision Pathway</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Live flowchart of your assessment progress</p>
            </div>
            <div className="p-4">
              {path.length > 0 || currentNodeId ? (
                <LiveFlowchart path={path} currentNodeId={currentNodeId} terminalResult={terminalResult} />
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">Assessment will appear here</div>
              )}
            </div>
          </div>

          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">HSE Contact Details</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: "Asbestos Line", value: CONTACTS.hseAsbestos },
                  { label: "ASB5 Online", value: CONTACTS.asb5Online },
                  { label: "HSE Info", value: CONTACTS.hseInfoLine },
                  { label: "UKAS Labs", value: CONTACTS.ukasLab },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">{c.label}</span>
                    <div className="text-xs font-medium text-gray-800 break-all">{c.value}</div>
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
          Assessment based on the Control of Asbestos Regulations 2012, HSG264 (The Survey Guide), HSG247 (Licensed Contractors Guide), and HSG210 (Asbestos Essentials). This tool provides guidance only -- it does not constitute legal advice.
        </p>
        <a href="/coshh-builder" className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Create a COSHH Assessment
        </a>
      </div>
    </div>
  );
}
