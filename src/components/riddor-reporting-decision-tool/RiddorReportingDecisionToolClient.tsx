// src/components/riddor-reporting-decision-tool/RiddorReportingDecisionToolClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  INCIDENT_CATEGORIES, TERMINAL_RESULTS, HSE_CONTACTS, RESPONSIBLE_PERSON_GUIDANCE,
  getAllNodes, CATEGORY_FIRST_NODE, calculateDeadline,
} from "@/data/riddor-reporting-decision-tool";
import type {
  IncidentCategory, TreeNode, TerminalResult, DecisionPathStep, FlowchartNode,
} from "@/data/riddor-reporting-decision-tool";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Live Flowchart SVG ──────────────────────────────────────────
function LiveFlowchart({
  category,
  path,
  currentNodeId,
  terminalResult,
}: {
  category: IncidentCategory | null;
  path: DecisionPathStep[];
  currentNodeId: string | null;
  terminalResult: TerminalResult | null;
}) {
  // Build flowchart nodes from path + current + terminal
  const nodes: FlowchartNode[] = useMemo(() => {
    const n: FlowchartNode[] = [];
    // Start
    n.push({ id: "start", label: "Incident Reported", type: "start", status: category ? "completed" : "active" });
    // Category
    if (category) {
      const cat = INCIDENT_CATEGORIES.find(c => c.id === category);
      n.push({ id: "category", label: cat?.label || "", type: "category", status: "completed" });
    }
    // Decision path
    path.forEach((step, i) => {
      const shortQ = step.question.length > 50 ? step.question.slice(0, 47) + "..." : step.question;
      n.push({
        id: step.nodeId,
        label: shortQ,
        type: "question",
        status: "completed",
      });
    });
    // Current node
    if (currentNodeId && !terminalResult) {
      const allN = getAllNodes();
      const node = allN[currentNodeId];
      if (node) {
        const shortQ = node.question.length > 50 ? node.question.slice(0, 47) + "..." : node.question;
        n.push({ id: currentNodeId, label: shortQ, type: "question", status: "active" });
      }
    }
    // Terminal
    if (terminalResult) {
      n.push({
        id: terminalResult.id,
        label: terminalResult.title,
        type: terminalResult.reportable ? "terminal-yes" : "terminal-no",
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
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
          </marker>
          <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#1B5745" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2563EB" />
          </marker>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>
        {nodes.map((n, i) => {
          const y = padY + i * (nodeH + gapY);
          const fill = getNodeFill(n);
          const textFill = getTextFill(n);
          const stroke = getStroke(n);
          const isTerminal = n.type === "terminal-yes" || n.type === "terminal-no";
          const rr = isTerminal ? 22 : n.type === "start" || n.type === "category" ? 12 : 8;

          // Connector line to next node
          const connector = i < nodes.length - 1 ? (
            <line
              x1={cx} y1={y + nodeH}
              x2={cx} y2={y + nodeH + gapY}
              stroke={nodes[i].status === "completed" ? "#1B5745" : nodes[i].status === "active" ? "#2563EB" : "#D1D5DB"}
              strokeWidth={nodes[i].status === "completed" ? 2.5 : 1.5}
              strokeDasharray={nodes[i].status === "completed" ? "none" : "4,3"}
              markerEnd={nodes[i].status === "completed" ? "url(#arrowhead-green)" : nodes[i].status === "active" ? "url(#arrowhead-blue)" : "url(#arrowhead)"}
            />
          ) : null;

          // Selected answer label
          const pathStep = path.find(p => p.nodeId === n.id);
          const ansLabel = pathStep?.selectedOption;

          return (
            <g key={n.id}>
              {connector}
              {/* Pulse ring for active node */}
              {n.status === "active" && (
                <rect
                  x={padX - 3} y={y - 3}
                  width={nodeW + 6} height={nodeH + 6}
                  rx={rr + 2} ry={rr + 2}
                  fill="none" stroke={n.type === "terminal-yes" ? "#DC2626" : n.type === "terminal-no" ? "#16A34A" : "#2563EB"}
                  strokeWidth={2} opacity={0.3}
                >
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                </rect>
              )}
              <rect
                x={padX} y={y}
                width={nodeW} height={nodeH}
                rx={rr} ry={rr}
                fill={fill} stroke={stroke}
                strokeWidth={n.status === "active" ? 2.5 : 1.5}
                filter={n.status === "active" ? "url(#shadow)" : undefined}
              />
              {/* Icon for start/category */}
              {n.type === "start" && (
                <circle cx={padX + 16} cy={y + nodeH / 2} r={6} fill="rgba(255,255,255,0.2)" />
              )}
              <text
                x={cx} y={y + (isTerminal ? nodeH / 2 - 3 : nodeH / 2 - 2)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isTerminal ? 9 : n.type === "start" || n.type === "category" ? 10 : 8}
                fontWeight={isTerminal || n.type === "start" || n.type === "category" ? 700 : 600}
                fill={textFill}
              >
                {n.label.length > 30 ? n.label.slice(0, 28) + "..." : n.label}
              </text>
              {isTerminal && (
                <text
                  x={cx} y={y + nodeH / 2 + 10}
                  textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.8)"
                >
                  {n.type === "terminal-yes" ? "REPORTABLE" : "NOT REPORTABLE"}
                </text>
              )}
              {/* Answer badge */}
              {ansLabel && (
                <g>
                  <rect
                    x={padX + nodeW + 6} y={y + nodeH / 2 - 8}
                    width={Math.min(ansLabel.length * 4.5 + 12, 160)} height={16}
                    rx={8} fill="#F0FDF4" stroke="#BBF7D0" strokeWidth={1}
                  />
                  <text
                    x={padX + nodeW + 12} y={y + nodeH / 2 + 1}
                    fontSize={7} fill="#166534" fontWeight={600}
                  >
                    {ansLabel.length > 34 ? ansLabel.slice(0, 32) + "..." : ansLabel}
                  </text>
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
  category: IncidentCategory,
  pathSteps: DecisionPathStep[],
  terminal: TerminalResult,
  incidentDate: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  const docRef = `RID-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let y = 0;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("RIDDOR REPORTING DECISION TOOL (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text("ebrora.com", W - M - 18, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Helper: draw a section heading with accent bar
  function sectionHead(title: string) {
    checkPage(12);
    doc.setFillColor(27, 87, 69); doc.rect(M, y, 3, 6, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(title, M + 6, y + 4.5);
    doc.setTextColor(0, 0, 0); y += 9;
  }

  // ── Header bar (green, free)
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("RIDDOR REPORTING DECISION TOOL", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 15);
  doc.text("ebrora.com", W - M - 18, 15);
  doc.setFontSize(6);
  doc.text("Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013", M, 19);
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
  if (incidentDate) { drawFld("Incident Date:", incidentDate, M + CW / 2, y + 15, 30); }
  y += 22;

  // ── Scope paragraph
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const catLabel = INCIDENT_CATEGORIES.find(c => c.id === category)?.label || category;
  const scopeText = `RIDDOR reporting assessment for ${header.site || "the above site"}. Incident category: ${catLabel}. Assessment conducted using the RIDDOR 2013 decision tree to determine reporting obligations, deadlines, and methods.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── URGENCY PANEL (colour-coded)
  const isReport = terminal.reportable;
  if (isReport) {
    checkPage(26);
    const isImmediate = !!terminal.deadlineImmediate;
    const urgRGB: [number, number, number] = isImmediate ? [185, 28, 28] : terminal.deadlineDays && terminal.deadlineDays <= 10 ? [194, 65, 12] : [161, 98, 7];
    const urgBgRGB: [number, number, number] = isImmediate ? [254, 226, 226] : terminal.deadlineDays && terminal.deadlineDays <= 10 ? [255, 237, 213] : [254, 249, 195];
    const urgLabel = isImmediate ? "IMMEDIATE ACTION REQUIRED" : `ACTION WITHIN ${terminal.deadlineDays} DAYS`;
    const urgDesc = isImmediate
      ? "This incident requires IMMEDIATE telephone notification to HSE followed by an online report within 10 days."
      : `This incident must be reported online within ${terminal.deadlineDays} days of the incident date.`;
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

  // ── Determination banner
  const rgb: [number, number, number] = isReport ? [220, 38, 38] : [22, 163, 74];
  checkPage(20);
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(M, y, CW, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(terminal.title, M + 5, y + 7);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const bannerSub = isReport ? `Deadline: ${terminal.deadline}` : "Record in accident book and investigate";
  doc.text(bannerSub, M + 5, y + 13);
  doc.setTextColor(0, 0, 0); y += 22;

  // ── Summary panel
  checkPage(45);
  const summaryItems: [string, string][] = [
    ["Incident Category:", catLabel],
    ["Reportable:", isReport ? "YES" : "NO"],
    ["Deadline:", terminal.deadline],
    ["Reporting Method:", terminal.method],
    ["Form:", terminal.form],
  ];
  if (terminal.phoneRequired && terminal.phoneNumber) summaryItems.push(["Phone:", terminal.phoneNumber]);
  if (terminal.onlineUrl) summaryItems.push(["Online:", terminal.onlineUrl]);
  const dl = (incidentDate && terminal.deadlineDays) ? calculateDeadline(incidentDate, terminal) : null;
  if (dl) {
    summaryItems.push(["Deadline Date:", dl.deadlineDate]);
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

  // ── TIMELINE GRAPHIC
  if (dl && incidentDate && terminal.deadlineDays) {
    checkPage(30);
    sectionHead("Reporting Timeline");
    const tlX = M + 8, tlW = CW - 16, tlY = y;
    const incDate = new Date(incidentDate);
    const deadDate = new Date(dl.deadlineDate);
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const totalSpanDays = terminal.deadlineDays + 2;
    const dayToX = (d: Date) => {
      const diff = Math.ceil((d.getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24));
      const ratio = Math.max(0, Math.min(1, diff / totalSpanDays));
      return tlX + ratio * tlW;
    };
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.8);
    doc.line(tlX, tlY + 8, tlX + tlW, tlY + 8);
    doc.setLineWidth(0.2);
    const todayX = dayToX(todayDate);
    const deadX = dayToX(deadDate);
    const fillColor: [number, number, number] = dl.isOverdue ? [220, 38, 38] : [22, 163, 74];
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(tlX, tlY + 6.5, Math.min(todayX - tlX, tlW), 3, "F");
    doc.setFillColor(27, 87, 69); doc.circle(tlX, tlY + 8, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text("INCIDENT", tlX, tlY + 2);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(incidentDate, tlX, tlY + 14);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]); doc.circle(deadX, tlY + 8, 2.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("DEADLINE", deadX - 5, tlY + 2);
    doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(dl.deadlineDate, deadX - 5, tlY + 14);
    if (todayX > tlX + 5 && todayX < tlX + tlW - 5) {
      doc.setDrawColor(100, 100, 100); doc.setLineDashPattern([1, 1], 0);
      doc.line(todayX, tlY + 3, todayX, tlY + 13);
      doc.setLineDashPattern([], 0);
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
      doc.text("TODAY", todayX - 4, tlY + 18);
    }
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    if (dl.isOverdue) {
      doc.setTextColor(220, 38, 38);
      doc.text(`OVERDUE by ${Math.abs(dl.daysRemaining)} days`, M + CW / 2 - 15, tlY + 22);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text(`${dl.daysRemaining} days remaining`, M + CW / 2 - 12, tlY + 22);
    }
    doc.setTextColor(0, 0, 0); doc.setDrawColor(220, 220, 220);
    y = tlY + 26;
  }

  // ── DECISION FLOWCHART (visual, drawn in jsPDF)
  checkPage(30);
  sectionHead("Decision Pathway Flowchart");
  {
    const fcX = M + 10, fcNodeW = 70, fcNodeH = 11, fcGapY = 8;
    const fcAnsW = 70;
    const fcCX = fcX + fcNodeW / 2;
    interface FcNode { label: string; type: "start" | "question" | "yes" | "no"; answer?: string }
    const fcNodes: FcNode[] = [];
    fcNodes.push({ label: "Incident Reported", type: "start" });
    fcNodes.push({ label: `Category: ${catLabel}`, type: "start", answer: catLabel });
    pathSteps.forEach(step => {
      const shortQ = step.question.length > 45 ? step.question.slice(0, 42) + "..." : step.question;
      const shortA = step.selectedOption.length > 40 ? step.selectedOption.slice(0, 37) + "..." : step.selectedOption;
      fcNodes.push({ label: shortQ, type: "question", answer: shortA });
    });
    fcNodes.push({ label: terminal.reportable ? "REPORTABLE" : "NOT REPORTABLE", type: terminal.reportable ? "yes" : "no" });

    fcNodes.forEach((node, ni) => {
      const neededH = fcNodeH + (ni < fcNodes.length - 1 ? fcGapY : 0) + 2;
      checkPage(neededH + 4);
      const ny = y;

      let fillR = 248, fillG = 250, fillB = 252;
      let strokeR = 200, strokeG = 200, strokeB = 200;
      let txtR = 55, txtG = 65, txtB = 81;
      let rr = 2;
      if (node.type === "start") { fillR = 27; fillG = 87; fillB = 69; txtR = 255; txtG = 255; txtB = 255; strokeR = 27; strokeG = 87; strokeB = 69; rr = 3; }
      else if (node.type === "yes") { fillR = 220; fillG = 38; fillB = 38; txtR = 255; txtG = 255; txtB = 255; strokeR = 185; strokeG = 28; strokeB = 28; rr = 5; }
      else if (node.type === "no") { fillR = 22; fillG = 163; fillB = 74; txtR = 255; txtG = 255; txtB = 255; strokeR = 21; strokeG = 128; strokeB = 61; rr = 5; }
      else { fillR = 239; fillG = 246; fillB = 255; strokeR = 147; strokeG = 197; strokeB = 253; }

      doc.setFillColor(fillR, fillG, fillB); doc.setDrawColor(strokeR, strokeG, strokeB);
      doc.roundedRect(fcX, ny, fcNodeW, fcNodeH, rr, rr, "FD");
      doc.setTextColor(txtR, txtG, txtB); doc.setFontSize(node.type === "start" || node.type === "yes" || node.type === "no" ? 7 : 5.5);
      doc.setFont("helvetica", node.type === "question" ? "normal" : "bold");
      const nodeLines = doc.splitTextToSize(node.label, fcNodeW - 6);
      const textStartY = ny + (fcNodeH / 2) - ((nodeLines.length - 1) * 2.5 / 2) + 1;
      nodeLines.forEach((line: string, li: number) => {
        doc.text(line, fcCX, textStartY + li * 2.5, { align: "center" });
      });

      if (node.answer && node.type === "question") {
        const badgeX = fcX + fcNodeW + 4;
        const badgeW = Math.min(doc.getTextWidth(node.answer) + 8, fcAnsW);
        doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208);
        doc.roundedRect(badgeX, ny + 1.5, badgeW, fcNodeH - 3, 2, 2, "FD");
        doc.setTextColor(22, 101, 52); doc.setFontSize(5); doc.setFont("helvetica", "bold");
        const ansLines = doc.splitTextToSize(node.answer, badgeW - 4);
        doc.text(ansLines[0], badgeX + 2, ny + fcNodeH / 2 + 0.5);
        doc.setDrawColor(187, 247, 208); doc.setLineWidth(0.4);
        doc.line(fcX + fcNodeW, ny + fcNodeH / 2, badgeX, ny + fcNodeH / 2);
        doc.setLineWidth(0.2);
      }

      y = ny + fcNodeH;

      if (ni < fcNodes.length - 1) {
        const arrowX = fcCX;
        const isCompleted = node.type === "start" || node.type === "question";
        doc.setDrawColor(isCompleted ? 27 : 200, isCompleted ? 87 : 200, isCompleted ? 69 : 200);
        doc.setLineWidth(isCompleted ? 0.6 : 0.3);
        doc.line(arrowX, y, arrowX, y + fcGapY - 2);
        doc.setFillColor(isCompleted ? 27 : 200, isCompleted ? 87 : 200, isCompleted ? 69 : 200);
        const tipY = y + fcGapY - 1;
        doc.triangle(arrowX, tipY, arrowX - 1.5, tipY - 2.5, arrowX + 1.5, tipY - 2.5, "F");
        doc.setLineWidth(0.2);
        y += fcGapY;
      }
      doc.setDrawColor(220, 220, 220);
    });
    y += 6;
  }

  // ── Decision Pathway Table (colour-coded)
  checkPage(20);
  sectionHead("Decision Pathway Detail");
  const cols = [10, CW - 10 - 60, 60];
  let cx = M;
  ["#", "Question", "Answer Selected"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  cx = M;
  ["1", "Incident Category", catLabel].forEach((t, i) => {
    doc.setFillColor(232, 240, 236); doc.setDrawColor(200, 220, 210);
    doc.rect(cx, y, cols[i], 6, "FD");
    doc.setTextColor(27, 87, 69); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
    const tLines = doc.splitTextToSize(t, cols[i] - 4);
    doc.text(tLines[0], cx + 2, y + 4);
    cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); doc.setDrawColor(200, 200, 200);
  y += 6;

  pathSteps.forEach((step, si) => {
    const rowH = 8;
    checkPage(rowH);
    cx = M;
    const shortQ = step.question.length > 75 ? step.question.slice(0, 72) + "..." : step.question;
    const shortA = step.selectedOption.length > 38 ? step.selectedOption.slice(0, 35) + "..." : step.selectedOption;
    const isTerminalStep = si === pathSteps.length - 1;
    const rowBgR = isTerminalStep ? (isReport ? 254 : 240) : (si % 2 === 0 ? 250 : 255);
    const rowBgG = isTerminalStep ? (isReport ? 226 : 253) : (si % 2 === 0 ? 250 : 255);
    const rowBgB = isTerminalStep ? (isReport ? 226 : 244) : (si % 2 === 0 ? 250 : 255);
    const rowBorderR = isTerminalStep ? (isReport ? 252 : 187) : 200;
    const rowBorderG = isTerminalStep ? (isReport ? 165 : 247) : 200;
    const rowBorderB = isTerminalStep ? (isReport ? 165 : 208) : 200;
    if (isTerminalStep) {
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(M, y, 1.5, rowH, "F");
    }
    [`${si + 2}`, shortQ, shortA].forEach((t, i) => {
      doc.setFillColor(rowBgR, rowBgG, rowBgB);
      doc.setDrawColor(rowBorderR, rowBorderG, rowBorderB);
      doc.rect(cx, y, cols[i], rowH, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, cols[i] - 4);
      doc.text(lines[0], cx + 2, y + 3.5);
      if (lines.length > 1) doc.text(lines[1], cx + 2, y + 6.5);
      cx += cols[i];
    });
    doc.setDrawColor(200, 200, 200);
    y += rowH;
  });
  y += 6;

  // ── ACTIONS CHECKLIST
  checkPage(30);
  sectionHead("Actions To Take Now");
  {
    const actions: string[] = [];
    if (isReport) {
      if (terminal.phoneRequired) actions.push(`Telephone HSE immediately on ${terminal.phoneNumber || HSE_CONTACTS.riddorPhone}`);
      actions.push("Preserve the scene -- do not disturb evidence unless necessary for safety");
      actions.push(`Complete online report via ${terminal.onlineUrl || HSE_CONTACTS.riddorOnline}`);
      if (dl) actions.push(`Ensure report submitted by ${dl.deadlineDate}`);
      if (category === "death") actions.push("Notify the police on 999");
      if (category === "gas-incident") actions.push(`Notify Gas Safe Register on ${HSE_CONTACTS.gasSafePhone}`);
      actions.push("Record full details in the accident book (BI 510)");
      actions.push("Identify and preserve any witnesses and their statements");
      actions.push("Notify your company health and safety department");
      actions.push("Initiate an internal investigation to establish root cause");
      actions.push("Review risk assessments and method statements for the activity");
      actions.push("Consider whether work can continue safely or must be suspended");
    } else {
      actions.push("Record the incident in the accident book (BI 510)");
      actions.push("Investigate the root cause and identify corrective actions");
      actions.push("Review risk assessments for the activity");
      actions.push("Monitor the injured person's condition -- reassess if incapacitated >7 days");
      actions.push("Brief affected personnel on lessons learned");
      actions.push("Update site induction to include lessons from this incident");
    }
    const cbSize = 3.5;
    actions.forEach((action, ai) => {
      checkPage(7);
      const rowY = y;
      doc.setDrawColor(180, 180, 180); doc.setFillColor(255, 255, 255);
      doc.rect(M + 2, rowY, cbSize, cbSize, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      const aLines = doc.splitTextToSize(action, CW - 12);
      doc.text(aLines, M + 8, rowY + 2.8);
      y += Math.max(aLines.length * 3.2, 5) + 1;
      if (ai < actions.length - 1) {
        doc.setDrawColor(240, 240, 240);
        doc.line(M + 2, y - 0.5, M + CW - 2, y - 0.5);
        doc.setDrawColor(220, 220, 220);
      }
    });
    y += 4;
  }

  // ── Responsible Person
  checkPage(30);
  sectionHead("Responsible Person");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const rpLines = doc.splitTextToSize(terminal.responsiblePerson, CW - 4);
  doc.text(rpLines, M + 2, y); y += rpLines.length * 3.5 + 3;

  const rpCols = [55, CW - 55];
  cx = M;
  ["Scenario", "Responsible Person"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, rpCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4); cx += rpCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  RESPONSIBLE_PERSON_GUIDANCE.categories.forEach((rp, ri) => {
    checkPage(6);
    cx = M;
    [rp.scenario, rp.responsible].forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, rpCols[i], 5.5, "FD"); }
      else { doc.rect(cx, y, rpCols[i], 5.5, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, rpCols[i] - 4);
      doc.text(lines[0], cx + 2, y + 3.8);
      cx += rpCols[i];
    });
    y += 5.5;
  });
  y += 6;

  // ── Record Keeping
  checkPage(20);
  sectionHead("Record Keeping Requirements");
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  const rkLines = doc.splitTextToSize(terminal.recordKeeping, CW - 4);
  doc.text(rkLines, M + 2, y); y += rkLines.length * 3.5 + 4;

  // ── Additional Notes
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

  // ── Regulatory References
  checkPage(20);
  sectionHead("Regulatory References");
  cx = M;
  ["Regulation / Standard"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, CW, 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text(h, cx + 2, y + 4);
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);
  terminal.regulations.forEach((reg, ri) => {
    checkPage(6);
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y, CW, 5.5, "FD"); }
    else { doc.rect(M, y, CW, 5.5, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text(reg, M + 2, y + 3.8);
    y += 5.5;
  });
  y += 6;

  // ── HSE Contact Details
  checkPage(40);
  sectionHead("HSE Contact Details");
  const contactItems: [string, string][] = [
    ["RIDDOR Reporting Line:", HSE_CONTACTS.riddorPhone],
    ["Hours:", HSE_CONTACTS.riddorPhoneHours],
    ["Out of Hours:", HSE_CONTACTS.riddorOutOfHours],
    ["Online Reporting:", HSE_CONTACTS.riddorOnline],
    ["HSE Info Line:", HSE_CONTACTS.hseInfoLine],
    ["Post:", HSE_CONTACTS.hseAddress],
  ];
  if (category === "gas-incident") {
    contactItems.push(["Gas Safe Register:", HSE_CONTACTS.gasSafePhone]);
    contactItems.push(["Gas Safe Web:", HSE_CONTACTS.gasSafeWeb]);
  }
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

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "RIDDOR reporting assessment using the Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013. This tool provides guidance only -- it does not constitute legal advice.",
      M, 288
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 292);
  }

  doc.save(`riddor-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function RiddorReportingDecisionToolClient() {
  // Settings
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Decision tree state
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [path, setPath] = useState<DecisionPathStep[]>([]);
  const [terminalResult, setTerminalResult] = useState<TerminalResult | null>(null);
  const [incidentDate, setIncidentDate] = useState("");

  const allNodes = useMemo(() => getAllNodes(), []);

  const currentNode = currentNodeId ? allNodes[currentNodeId] : null;

  const handleCategorySelect = useCallback((cat: IncidentCategory) => {
    setCategory(cat);
    if (cat === "death") {
      // Death goes straight to terminal
      setTerminalResult(TERMINAL_RESULTS["death-reportable"]);
      setCurrentNodeId(null);
    } else {
      const firstNode = CATEGORY_FIRST_NODE[cat];
      setCurrentNodeId(firstNode);
    }
  }, []);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (!currentNode) return;
    const option = currentNode.options[optionIndex];
    // Record this step
    const step: DecisionPathStep = {
      nodeId: currentNode.id,
      question: currentNode.question,
      selectedOption: option.label,
      regulation: currentNode.regulation,
    };
    const newPath = [...path, step];
    setPath(newPath);

    if (option.terminalId) {
      setTerminalResult(TERMINAL_RESULTS[option.terminalId]);
      setCurrentNodeId(null);
    } else if (option.nextNodeId) {
      // Check if nextNodeId is a cross-pathway reference (e.g. gas -> DO)
      if (allNodes[option.nextNodeId]) {
        setCurrentNodeId(option.nextNodeId);
      }
    }
  }, [currentNode, path, allNodes]);

  const handleBack = useCallback(() => {
    if (terminalResult) {
      // Go back to last question
      setTerminalResult(null);
      if (path.length > 0) {
        const lastStep = path[path.length - 1];
        setCurrentNodeId(lastStep.nodeId);
        setPath(path.slice(0, -1));
      } else if (category === "death") {
        setCategory(null);
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
        category, path, terminalResult, incidentDate,
      );
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, category, path, terminalResult, incidentDate]);

  const clearAll = useCallback(() => {
    setStarted(false);
    setCategory(null);
    setCurrentNodeId(null);
    setPath([]);
    setTerminalResult(null);
    setIncidentDate("");
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const restartAssessment = useCallback(() => {
    setCategory(null);
    setCurrentNodeId(null);
    setPath([]);
    setTerminalResult(null);
    setIncidentDate("");
  }, []);

  const deadline = useMemo(() => {
    if (!terminalResult || !incidentDate) return null;
    return calculateDeadline(incidentDate, terminalResult);
  }, [terminalResult, incidentDate]);

  const catLabel = category ? INCIDENT_CATEGORIES.find(c => c.id === category)?.label || "" : "";

  // ── Intro screen
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#1B5745] via-[#1B5745] to-[#143F33] px-6 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
              <span className="text-2xl">&#9888;</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">RIDDOR Reporting Decision Tool</h2>
            <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
              Determine whether a workplace incident is reportable under the Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013, and if so, establish the reporting deadline, method, and responsible person.
            </p>
          </div>
          {/* Content */}
          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "1", title: "Select Category", desc: "Choose the type of incident: death, injury, dangerous occurrence, disease, or gas incident." },
                { icon: "2", title: "Answer Questions", desc: "Follow the RIDDOR 2013 decision tree with conditional questions specific to your incident." },
                { icon: "3", title: "Get Determination", desc: "Receive a clear reportable/not-reportable determination with deadlines, methods, and a professional PDF." },
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
                This tool provides guidance based on RIDDOR 2013 and associated regulations. It does not constitute legal advice.
                If you are unsure whether an incident is reportable, contact the HSE on {HSE_CONTACTS.hseInfoLine} or seek legal counsel.
                Always err on the side of reporting -- under-reporting is a criminal offence under HSWA 1974 s33.
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
              <span>RIDDOR 2013</span>
              <span>HSWA 1974</span>
              <span>CDM 2015</span>
              <span>GSIUR 1998</span>
              <span>COSHH 2002</span>
              <span>Management of H&S at Work Regs 1999</span>
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

  // ── Main assessment UI
  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Category",
            value: catLabel || "Select...",
            sub: category ? INCIDENT_CATEGORIES.find(c => c.id === category)?.regulation || "" : "Choose incident type",
            bgClass: category ? "bg-blue-50" : "bg-gray-50",
            textClass: category ? "text-blue-800" : "text-gray-500",
            borderClass: category ? "border-blue-200" : "border-gray-200",
            dotClass: category ? "bg-blue-500" : "bg-gray-300",
          },
          {
            label: "Status",
            value: terminalResult ? (terminalResult.reportable ? "REPORTABLE" : "NOT REPORTABLE") : `Step ${path.length + 1}`,
            sub: terminalResult ? terminalResult.title : "Assessment in progress",
            bgClass: terminalResult ? (terminalResult.reportable ? "bg-red-50" : "bg-emerald-50") : "bg-purple-50",
            textClass: terminalResult ? (terminalResult.reportable ? "text-red-800" : "text-emerald-800") : "text-purple-800",
            borderClass: terminalResult ? (terminalResult.reportable ? "border-red-200" : "border-emerald-200") : "border-purple-200",
            dotClass: terminalResult ? (terminalResult.reportable ? "bg-red-500" : "bg-emerald-500") : "bg-purple-500",
          },
          {
            label: "Deadline",
            value: terminalResult ? (terminalResult.deadlineImmediate ? "IMMEDIATE" : `${terminalResult.deadlineDays || "N/A"} days`) : "--",
            sub: deadline ? (deadline.isOverdue ? `OVERDUE by ${Math.abs(deadline.daysRemaining)} days` : `${deadline.daysRemaining} days remaining`) : (terminalResult?.deadline || "Complete assessment"),
            bgClass: deadline?.isOverdue ? "bg-red-50" : "bg-orange-50",
            textClass: deadline?.isOverdue ? "text-red-800" : "text-orange-800",
            borderClass: deadline?.isOverdue ? "border-red-200" : "border-orange-200",
            dotClass: deadline?.isOverdue ? "bg-red-500" : "bg-orange-500",
          },
          {
            label: "Method",
            value: terminalResult ? (terminalResult.phoneRequired ? "Phone + Online" : "Online") : "--",
            sub: terminalResult?.form || "Complete assessment",
            bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500",
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

      {/* ── Toolbar ────────────────────────────────────────── */}
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
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        )}
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
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

      {/* ── Two-column layout: Decision + Flowchart ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Decision area (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Category Selection */}
          {!category && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">Step 1: Select Incident Category</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">What type of incident are you reporting?</p>
              </div>
              <div className="p-4 space-y-2">
                {INCIDENT_CATEGORIES.map(cat => (
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

          {/* Incident Date Input (shown when terminal reached and reportable) */}
          {terminalResult && terminalResult.reportable && terminalResult.deadlineDays && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Incident Date (for deadline calculation)</h3>
              <div className="flex items-center gap-3">
                <input
                  type="date" value={incidentDate}
                  onChange={e => setIncidentDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none"
                />
                {deadline && (
                  <div className={`text-sm font-bold ${deadline.isOverdue ? "text-red-600" : "text-emerald-600"}`}>
                    {deadline.isOverdue
                      ? `OVERDUE -- report by ${deadline.deadlineDate} (${Math.abs(deadline.daysRemaining)} days overdue)`
                      : `Deadline: ${deadline.deadlineDate} (${deadline.daysRemaining} days remaining)`
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Result */}
          {terminalResult && (
            <div className={`border-2 rounded-xl overflow-hidden ${terminalResult.reportable ? "border-red-300" : "border-emerald-300"}`}>
              {/* Banner */}
              <div className={`px-5 py-4 ${terminalResult.reportable ? "bg-red-600" : "bg-emerald-600"} text-white`}>
                <div className="text-lg font-bold">{terminalResult.title}</div>
                <div className="text-sm opacity-90 mt-1">{terminalResult.description}</div>
              </div>
              {/* Details */}
              <div className="p-5 space-y-4 bg-white">
                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Deadline", value: terminalResult.deadline },
                    { label: "Method", value: terminalResult.method },
                    { label: "Form", value: terminalResult.form },
                    ...(terminalResult.phoneRequired && terminalResult.phoneNumber ? [{ label: "Phone", value: terminalResult.phoneNumber }] : []),
                    ...(terminalResult.onlineUrl ? [{ label: "Online", value: terminalResult.onlineUrl }] : []),
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5 break-all">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Responsible person */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-blue-800 mb-1">Responsible Person</div>
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

        {/* Right: Flowchart (2 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Decision Pathway</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Live flowchart of your assessment progress</p>
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
                  Select an incident category to begin
                </div>
              )}
            </div>
          </div>

          {/* HSE Contacts card */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">HSE Contact Details</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: "RIDDOR Line", value: HSE_CONTACTS.riddorPhone, sub: HSE_CONTACTS.riddorPhoneHours },
                  { label: "Out of Hours", value: HSE_CONTACTS.riddorOutOfHours },
                  { label: "Online Reporting", value: HSE_CONTACTS.riddorOnline },
                  { label: "HSE Info Line", value: HSE_CONTACTS.hseInfoLine },
                  ...(category === "gas-incident" ? [
                    { label: "Gas Safe Register", value: HSE_CONTACTS.gasSafePhone },
                    { label: "Gas Safe Web", value: HSE_CONTACTS.gasSafeWeb },
                  ] : []),
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">{c.label}</span>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{c.value}</div>
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

          {/* Responsible Person Guidance */}
          {terminalResult && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">{RESPONSIBLE_PERSON_GUIDANCE.title}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{RESPONSIBLE_PERSON_GUIDANCE.description}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {RESPONSIBLE_PERSON_GUIDANCE.categories.map(rp => (
                  <div key={rp.scenario} className="px-4 py-2.5 flex items-start gap-3">
                    <div className="text-xs font-medium text-gray-800 w-28 shrink-0">{rp.scenario}</div>
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
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Assessment based on the Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 (as amended),
          Health and Safety at Work etc. Act 1974, Gas Safety (Installation and Use) Regulations 1998,
          and associated Approved Codes of Practice. This tool provides guidance only -- it does not constitute legal advice.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
