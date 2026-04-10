// src/components/ecological-exclusion-zone-checker/EcologicalExclusionZoneCheckerClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ALL_SPECIES, SPECIES_GROUPS, WORKS_TYPES, MONTH_NAMES, MONTH_FULL,
  TRAFFIC_LABELS, TRAFFIC_COLOURS,
  assessConflicts, getCalendarData,
} from "@/data/ecological-exclusion-zone-checker";
import type { Month, TrafficLight, ConflictResult, AssessmentResult } from "@/data/ecological-exclusion-zone-checker";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Species Group Selector ──────────────────────────────────
function SpeciesSelector({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    const next = new Set(expanded);
    if (next.has(group)) next.delete(group); else next.add(group);
    setExpanded(next);
  };

  const toggleSpecies = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  const toggleAllInGroup = (groupSpecies: { id: string }[]) => {
    const next = new Set(selected);
    const allSelected = groupSpecies.every(s => next.has(s.id));
    groupSpecies.forEach(s => { if (allSelected) next.delete(s.id); else next.add(s.id); });
    onChange(next);
  };

  const selectAll = () => onChange(new Set(ALL_SPECIES.map(s => s.id)));
  const clearAll = () => onChange(new Set());

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Species Identified on Site</span>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-[10px] font-medium text-ebrora hover:text-ebrora-dark">Select All</button>
          <button onClick={clearAll} className="text-[10px] font-medium text-red-500 hover:text-red-700">Clear</button>
        </div>
      </div>
      {SPECIES_GROUPS.map(g => {
        const isExpanded = expanded.has(g.group);
        const count = g.species.filter(s => selected.has(s.id)).length;
        const allSel = g.species.every(s => selected.has(s.id));
        return (
          <div key={g.group} className="border border-gray-100 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => g.species.length === 1 ? toggleSpecies(g.species[0].id) : toggleGroup(g.group)}>
              <button onClick={e => { e.stopPropagation(); toggleAllInGroup(g.species); }}
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold transition-colors ${allSel ? "bg-ebrora border-ebrora text-white" : count > 0 ? "bg-ebrora/30 border-ebrora/50 text-white" : "border-gray-300 bg-white"}`}>
                {allSel ? "X" : count > 0 ? "-" : ""}
              </button>
              <span className="text-sm font-medium text-gray-700 flex-1">{g.label}</span>
              {count > 0 && <span className="text-[10px] font-bold text-ebrora bg-ebrora-light px-1.5 py-0.5 rounded-full">{count}</span>}
              {g.species.length > 1 && (
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              )}
            </div>
            {isExpanded && g.species.length > 1 && (
              <div className="px-3 py-1.5 space-y-1 bg-white">
                {g.species.map(sp => (
                  <label key={sp.id} className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1">
                    <input type="checkbox" checked={selected.has(sp.id)} onChange={() => toggleSpecies(sp.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
                    <span className="text-xs text-gray-600">{sp.name}</span>
                    {sp.epsSpecies && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 py-0.5 rounded">EPS</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Works Type Selector ─────────────────────────────────────
function WorksTypeSelector({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };
  return (
    <div>
      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Type of Works</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {WORKS_TYPES.map(w => {
          const sel = selected.has(w.id);
          return (
            <button key={w.id} onClick={() => toggle(w.id)}
              className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${sel ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora font-medium" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
              <div className="font-medium">{w.label}</div>
              <div className={`text-[10px] mt-0.5 ${sel ? "text-ebrora/70" : "text-gray-400"}`}>
                {w.riskLevel === "high" ? "High risk" : w.riskLevel === "medium" ? "Medium risk" : "Low risk"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month Range Selector ────────────────────────────────────
function MonthRangeSelector({ start, end, onStartChange, onEndChange }: { start: Month; end: Month; onStartChange: (m: Month) => void; onEndChange: (m: Month) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Works Start Month</label>
        <select value={start} onChange={e => onStartChange(parseInt(e.target.value) as Month)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
          {([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).map(m => <option key={m} value={m}>{MONTH_FULL[m]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Works End Month</label>
        <select value={end} onChange={e => onEndChange(parseInt(e.target.value) as Month)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
          {([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).map(m => <option key={m} value={m}>{MONTH_FULL[m]}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── SVG Calendar Gantt ──────────────────────────────────────
function CalendarGantt({ result, startMonth, endMonth }: { result: AssessmentResult; startMonth: Month; endMonth: Month }) {
  const species = result.conflicts.map(c => c.species);
  const calData = getCalendarData(species);
  if (calData.length === 0) return null;

  const padL = 180, padR = 10, padT = 30, padB = 10;
  const cellW = 52, rowH = 22;
  const W = padL + 12 * cellW + padR;
  const H = padT + calData.length * rowH + padB;

  // Works months
  const worksMonths: Month[] = [];
  let m = startMonth;
  for (let i = 0; i < 12; i++) { worksMonths.push(m); if (m === endMonth) break; m = ((m % 12) + 1) as Month; }
  const worksSet = new Set(worksMonths);

  // Traffic light colour for each conflict
  const tlMap = new Map(result.conflicts.map(c => [c.species.id, c.trafficLight]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: Math.min(H * 0.6, 600) }}>
      {/* Month headers */}
      {([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).map((mo, ci) => {
        const isWorks = worksSet.has(mo);
        return (
          <g key={mo}>
            <rect x={padL + ci * cellW} y={0} width={cellW} height={padT - 2} fill={isWorks ? "#E8F0EC" : "#F9FAFB"} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={padL + ci * cellW + cellW / 2} y={padT - 10} textAnchor="middle" fontSize={10} fontWeight={isWorks ? 700 : 400} fill={isWorks ? "#1B5745" : "#6B7280"}>
              {MONTH_NAMES[mo]}
            </text>
          </g>
        );
      })}
      {/* Species rows */}
      {calData.map((sp, ri) => {
        const y = padT + ri * rowH;
        const tl = tlMap.get(sp.id) || "green";
        const tlCol = TRAFFIC_COLOURS[tl];
        return (
          <g key={sp.id}>
            {/* Row bg */}
            <rect x={0} y={y} width={padL} height={rowH} fill={ri % 2 === 0 ? "#FFFFFF" : "#F9FAFB"} stroke="#E5E7EB" strokeWidth={0.5} />
            {/* Traffic dot */}
            <circle cx={10} cy={y + rowH / 2} r={4} fill={tlCol.rgb.length ? `rgb(${tlCol.rgb.join(",")})` : "#22C55E"} />
            {/* Name */}
            <text x={22} y={y + rowH / 2 + 3.5} fontSize={9} fill="#374151" fontWeight={500}>
              {sp.name.length > 35 ? sp.name.slice(0, 33) + "..." : sp.name}
            </text>
            {/* Month cells */}
            {([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).map((mo, ci) => {
              const x = padL + ci * cellW;
              const isWorks = worksSet.has(mo);
              const period = sp.periods.find(p => p.months.includes(mo));
              let fill = ri % 2 === 0 ? "#FFFFFF" : "#FAFAFA";
              let textFill = "";
              let label = "";
              if (period) {
                if (period.severity === "high") {
                  fill = isWorks ? "#FEE2E2" : "#FEF2F2";
                  textFill = "#991B1B";
                } else {
                  fill = isWorks ? "#FEF3C7" : "#FFFBEB";
                  textFill = "#92400E";
                }
                label = period.severity === "high" ? "H" : "M";
              }
              // Works overlay stripe
              const showStripe = isWorks && !period;
              return (
                <g key={mo}>
                  <rect x={x} y={y} width={cellW} height={rowH} fill={fill} stroke="#E5E7EB" strokeWidth={0.5} />
                  {showStripe && <rect x={x} y={y} width={cellW} height={rowH} fill="#E8F0EC" opacity={0.4} />}
                  {period && isWorks && (
                    <rect x={x + 2} y={y + 4} width={cellW - 4} height={rowH - 8} rx={3} fill={period.severity === "high" ? "#EF4444" : "#F59E0B"} opacity={0.25} />
                  )}
                  {label && (
                    <text x={x + cellW / 2} y={y + rowH / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={600} fill={textFill}>{label}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {/* Legend */}
      <rect x={padL} y={H - padB + 2} width={8} height={8} fill="#EF4444" opacity={0.3} rx={1} />
      <text x={padL + 11} y={H - padB + 9} fontSize={8} fill="#6B7280">H = High severity</text>
      <rect x={padL + 100} y={H - padB + 2} width={8} height={8} fill="#F59E0B" opacity={0.3} rx={1} />
      <text x={padL + 113} y={H - padB + 9} fontSize={8} fill="#6B7280">M = Moderate severity</text>
      <rect x={padL + 220} y={H - padB + 2} width={8} height={8} fill="#E8F0EC" rx={1} />
      <text x={padL + 231} y={H - padB + 9} fontSize={8} fill="#6B7280">Proposed works period</text>
    </svg>
  );
}

// ─── Traffic Light Badge ─────────────────────────────────────
function TrafficBadge({ level }: { level: TrafficLight }) {
  const c = TRAFFIC_COLOURS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {TRAFFIC_LABELS[level]}
    </span>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  result: AssessmentResult,
  startMonth: Month,
  endMonth: Month,
  worksTypeIds: string[],
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("l", "mm", "a4"); // LANDSCAPE
  const W = 297, H = 210, M = 12, CW = W - M * 2;
  let y = 0;

  // Sanitise text for jsPDF (no em dashes, ellipsis, arrows, bullets, emoji)
  const san = (s: string) => s.replace(/\u2014/g, "--").replace(/\u2013/g, "-").replace(/\u2026/g, "...").replace(/\u2192/g, ">").replace(/\u2022/g, "-").replace(/[^\x00-\x7F\u00B0\u00A3\u00A9]/g, "");

  const docRef = `ECO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const selectedWorks = WORKS_TYPES.filter(w => worksTypeIds.includes(w.id));
  const worksLabel = selectedWorks.map(w => w.label).join(", ");

  // Works months
  const worksMonths: Month[] = [];
  let mm = startMonth;
  for (let i = 0; i < 12; i++) { worksMonths.push(mm); if (mm === endMonth) break; mm = ((mm % 12) + 1) as Month; }

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("ECOLOGICAL EXCLUSION ZONE ASSESSMENT", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Wildlife & Countryside Act 1981 | Conservation of Habitats & Species Regs 2017 | Protection of Badgers Act 1992 | NERC Act 2006 -- ebrora.com/tools/ecological-exclusion-zone-checker", M, 16);
  doc.setFontSize(6);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 65, 16);
  y = 27;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 15, 1, 1, "FD");
  doc.setFontSize(7.5);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Prepared By:", header.preparedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 8;

  // ── Scope
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = san(`Ecological constraints assessment for ${header.site || "the above site"}. Species assessed: ${result.totalSpecies}. Proposed works: ${worksLabel || "not specified"}. Works period: ${MONTH_FULL[startMonth]} to ${MONTH_FULL[endMonth]}. Assessment identifies restricted periods, exclusion zones, and required actions per current UK wildlife legislation and Natural England standing advice.`);
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y);
  y += scopeLines.length * 2.8 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── checkPage helper
  function checkPage(need: number) {
    if (y + need > 198) {
      doc.addPage("a4", "l");
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text("ECOLOGICAL EXCLUSION ZONE ASSESSMENT (continued)", M, 7);
      doc.setFontSize(5.5); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Overall Status Banner
  const overallRgb = TRAFFIC_COLOURS[result.overallTrafficLight].rgb;
  doc.setFillColor(overallRgb[0], overallRgb[1], overallRgb[2]);
  doc.roundedRect(M, y, CW, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(san(`OVERALL STATUS: ${TRAFFIC_LABELS[result.overallTrafficLight].toUpperCase()}`), M + 5, y + 5.5);
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  doc.text(`${result.totalSpecies} species assessed | ${result.conflictCount} with constraints | ${result.licenceCount} licences required | ${result.surveyCount} surveys required`, M + 5, y + 9.5);
  doc.setTextColor(0, 0, 0); y += 17;

  // ── Stat cards
  {
    const cardW = (CW - 6) / 4, cardH = 12;
    const cards: { label: string; value: string; sub: string; rgb: number[] }[] = [
      { label: "Species Assessed", value: String(result.totalSpecies), sub: `${result.conflictCount} with constraints`, rgb: [59, 130, 246] },
      { label: "Licences Required", value: String(result.licenceCount), sub: result.licenceCount > 0 ? "Apply before works" : "None needed", rgb: result.licenceCount > 0 ? [220, 38, 38] : [22, 163, 74] },
      { label: "Surveys Required", value: String(result.surveyCount), sub: result.surveyCount > 0 ? "Commission surveys" : "None needed", rgb: result.surveyCount > 0 ? [245, 158, 11] : [22, 163, 74] },
      { label: "Optimal Months", value: result.optimalWindow ? String(result.optimalWindow.length) : "0", sub: "No high-severity conflicts", rgb: [22, 163, 74] },
    ];
    cards.forEach((c, ci) => {
      const cx = M + ci * (cardW + 2);
      doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4); doc.setFont("helvetica", "bold");
      doc.text(c.label.toUpperCase(), cx + 2, y + 3.5);
      doc.setFontSize(8); doc.text(c.value, cx + 2, y + 8);
      doc.setFontSize(3.5); doc.setFont("helvetica", "normal");
      doc.text(c.sub, cx + 2, y + 10.5);
    });
    doc.setTextColor(0, 0, 0);
    y += cardH + 4;
  }

  // ── Calendar Gantt Chart
  checkPage(result.conflicts.length * 4.5 + 20);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("12-Month Ecological Constraints Calendar", M, y); y += 4;

  const ganttL = M + 55; // left offset for species names
  const ganttCW = (CW - 55) / 12; // cell width per month
  const ganttRH = Math.min(4.5, 80 / Math.max(result.conflicts.length, 1)); // row height

  // Month headers
  let gx = ganttL;
  ([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).forEach((mo) => {
    const isWorks = worksMonths.includes(mo);
    doc.setFillColor(isWorks ? 232 : 249, isWorks ? 240 : 250, isWorks ? 236 : 251);
    doc.rect(gx, y, ganttCW, 5, "FD");
    doc.setTextColor(isWorks ? 27 : 107, isWorks ? 87 : 114, isWorks ? 69 : 128);
    doc.setFontSize(5.5); doc.setFont("helvetica", isWorks ? "bold" : "normal");
    doc.text(MONTH_NAMES[mo], gx + ganttCW / 2 - 3, y + 3.5);
    gx += ganttCW;
  });
  doc.setTextColor(0, 0, 0); y += 5;
  doc.setDrawColor(200, 200, 200);

  // Species rows
  result.conflicts.forEach((c, ri) => {
    checkPage(ganttRH + 1);
    const name = c.species.name.length > 30 ? (c.species.commonName || c.species.name.split("(")[0].trim()).slice(0, 28) : c.species.name.split("(")[0].trim();

    // Name cell
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y, 55, ganttRH, "FD"); }
    else { doc.rect(M, y, 55, ganttRH, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFontSize(4.5); doc.setFont("helvetica", "bold");
    doc.text(san(name), M + 1.5, y + ganttRH / 2 + 1);

    // Month cells
    gx = ganttL;
    ([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).forEach((mo) => {
      const isWorks = worksMonths.includes(mo);
      const period = c.species.restrictedPeriods.find(p => p.months.includes(mo));
      if (period && isWorks) {
        // Conflict!
        if (period.severity === "high") { doc.setFillColor(254, 202, 202); }
        else { doc.setFillColor(254, 243, 199); }
        doc.rect(gx, y, ganttCW, ganttRH, "FD");
        doc.setTextColor(period.severity === "high" ? 153 : 146, period.severity === "high" ? 27 : 64, period.severity === "high" ? 27 : 14);
        doc.setFontSize(4); doc.setFont("helvetica", "bold");
        doc.text(period.severity === "high" ? "H" : "M", gx + ganttCW / 2 - 1.5, y + ganttRH / 2 + 1);
      } else if (period) {
        if (period.severity === "high") { doc.setFillColor(254, 242, 242); }
        else { doc.setFillColor(255, 251, 235); }
        doc.rect(gx, y, ganttCW, ganttRH, "FD");
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(3.5); doc.setFont("helvetica", "normal");
        doc.text(period.severity === "high" ? "h" : "m", gx + ganttCW / 2 - 1, y + ganttRH / 2 + 1);
      } else if (isWorks) {
        doc.setFillColor(200, 230, 210); doc.rect(gx, y, ganttCW, ganttRH, "FD");
      } else {
        if (ri % 2 === 0) { doc.setFillColor(255, 255, 255); } else { doc.setFillColor(250, 250, 250); }
        doc.rect(gx, y, ganttCW, ganttRH, "FD");
      }
      doc.setTextColor(0, 0, 0);
      gx += ganttCW;
    });
    y += ganttRH;
  });

  // Gantt legend
  y += 2;
  doc.setFontSize(5); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
  doc.text("H = High severity restricted period (conflict with works) | M = Moderate severity | h/m = Restricted period (no works overlap) | Green shading = Proposed works period", M, y);
  doc.setTextColor(0, 0, 0); y += 5;

  // ── Species Conflict Table
  checkPage(20);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Species Constraint Summary", M, y); y += 4;

  const tCols = [55, 40, 50, 25, 20, CW - 55 - 40 - 50 - 25 - 20];
  const tHeaders = ["Species", "Legislation", "Restricted Period", "Zone (m)", "Status", "Required Actions"];
  let tcx = M;
  tHeaders.forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(tcx, y, tCols[i], 5, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(5); doc.setFont("helvetica", "bold");
    doc.text(h, tcx + 1.5, y + 3.5);
    tcx += tCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 5;
  doc.setDrawColor(200, 200, 200);

  result.conflicts.forEach((c, ri) => {
    const name = c.species.name.split("(")[0].trim();
    const legShort = c.species.legislation.map(l => {
      if (l.includes("Habitats")) return "Hab Regs 2017";
      if (l.includes("Badgers")) return "Badgers Act 1992";
      if (l.includes("Wildlife")) return "WCA 1981";
      if (l.includes("NERC")) return "NERC 2006";
      if (l.includes("Planning")) return "TCPA 1990";
      if (l.includes("Salmon")) return "SFFA 1975";
      if (l.includes("Environmental Protection")) return "EPA 1990";
      if (l.includes("Health and Safety")) return "HSWA 1974";
      return l.slice(0, 20);
    }).join(", ");
    const periods = c.conflictingPeriods.map(p => `${p.label} (${p.months.map(m2 => MONTH_NAMES[m2]).join("-")})`).join("; ") || "None in works period";
    const zone = c.species.exclusionZoneM > 0 ? `${c.species.exclusionZoneM}m` : "N/A";
    const statusLabel = c.trafficLight === "green" ? "OK" : c.trafficLight === "yellow" ? "AWARE" : c.trafficLight === "amber" ? "MITIGATE" : "LICENCE";
    const actionsText = c.actions.slice(0, 3).join("; ") || "-";

    const rowData = [name, legShort, periods, zone, statusLabel, actionsText].map(san);
    // Calculate dynamic row height based on longest wrapped cell
    const cellLines = rowData.map((t, i) => doc.splitTextToSize(t, tCols[i] - 3));
    const maxLines = Math.max(...cellLines.map(l => l.length));
    const rowH = Math.max(5, maxLines * 3 + 2);
    checkPage(rowH + 1);

    tcx = M;
    rowData.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(tcx, y, tCols[i], rowH, "FD"); }
      else { doc.rect(tcx, y, tCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0);
      if (i === 4) {
        // Status cell — coloured
        const stRgb = TRAFFIC_COLOURS[c.trafficLight].rgb;
        doc.setTextColor(stRgb[0], stRgb[1], stRgb[2]);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      }
      doc.setFontSize(4.2);
      const lines = cellLines[i];
      lines.forEach((line: string, li: number) => {
        doc.text(line || "-", tcx + 1.5, y + 3.5 + li * 3);
      });
      doc.setTextColor(0, 0, 0);
      tcx += tCols[i];
    });
    y += rowH;
  });
  y += 5;

  // ── Optimal Window
  if (result.optimalWindow && result.optimalWindow.length > 0) {
    checkPage(12);
    doc.setFillColor(232, 240, 236); doc.setDrawColor(27, 87, 69);
    doc.roundedRect(M, y, CW, 10, 1.5, 1.5, "FD");
    doc.setTextColor(27, 87, 69); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text("OPTIMAL WORKS WINDOW (no high-severity conflicts):", M + 4, y + 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    doc.text(result.optimalWindow.map(m2 => MONTH_FULL[m2]).join(", "), M + 4, y + 8);
    doc.setTextColor(0, 0, 0); doc.setDrawColor(200, 200, 200); y += 14;
  }

  // ── Sign-off
  checkPage(45);
  y += 2;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 5;

  const soW = CW / 2 - 2, soH = 7;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Ecological constraints assessment based on current UK wildlife legislation and Natural England standing advice. This tool provides guidance only -- it does not replace a full ecological survey by a qualified ecologist.",
      M, 201
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 60, 205);
  }

  doc.save(`ecological-exclusion-zone-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function EcologicalExclusionZoneCheckerClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [startMonth, setStartMonth] = useState<Month>(1);
  const [endMonth, setEndMonth] = useState<Month>(12);
  const [showOptimalWindow, setShowOptimalWindow] = useState(false);

  const hasData = selectedSpecies.size > 0;

  const result = useMemo<AssessmentResult | null>(() => {
    if (!hasData) return null;
    return assessConflicts(
      Array.from(selectedSpecies),
      startMonth,
      endMonth,
      Array.from(selectedWorks),
    );
  }, [selectedSpecies, startMonth, endMonth, selectedWorks, hasData]);

  const handleExport = useCallback(async () => {
    if (!result) return;
    setExporting(true);
    try {
      await exportPDF(
        { site, manager, preparedBy, date: assessDate },
        result, startMonth, endMonth, Array.from(selectedWorks),
      );
    } finally { setExporting(false); }
  }, [site, manager, preparedBy, assessDate, result, startMonth, endMonth, selectedWorks]);

  const clearAll = useCallback(() => {
    setSelectedSpecies(new Set()); setSelectedWorks(new Set());
    setStartMonth(1); setEndMonth(12);
    setSite(""); setManager(""); setPreparedBy(""); setAssessDate(todayISO());
    setShowOptimalWindow(false);
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Overall Status",
            value: result ? TRAFFIC_LABELS[result.overallTrafficLight].split(" ")[0] : "---",
            sub: result ? `${result.totalSpecies} species assessed` : "Select species to begin",
            ...(result ? TRAFFIC_COLOURS[result.overallTrafficLight] : { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200", dot: "bg-gray-400" }),
          },
          {
            label: "Conflicts",
            value: result ? `${result.conflictCount}` : "0",
            sub: result && result.conflictCount > 0 ? `${result.conflictCount} of ${result.totalSpecies} species` : "No conflicts identified",
            bgClass: result && result.conflictCount > 0 ? "bg-red-50" : "bg-emerald-50",
            textClass: result && result.conflictCount > 0 ? "text-red-800" : "text-emerald-800",
            borderClass: result && result.conflictCount > 0 ? "border-red-200" : "border-emerald-200",
            dotClass: result && result.conflictCount > 0 ? "bg-red-500" : "bg-emerald-500",
          },
          {
            label: "Licences Required",
            value: result ? `${result.licenceCount}` : "0",
            sub: result && result.licenceCount > 0 ? "EPS or other licence needed" : "No licences required",
            bgClass: result && result.licenceCount > 0 ? "bg-purple-50" : "bg-blue-50",
            textClass: result && result.licenceCount > 0 ? "text-purple-800" : "text-blue-800",
            borderClass: result && result.licenceCount > 0 ? "border-purple-200" : "border-blue-200",
            dotClass: result && result.licenceCount > 0 ? "bg-purple-500" : "bg-blue-500",
          },
          {
            label: "Surveys Required",
            value: result ? `${result.surveyCount}` : "0",
            sub: result && result.surveyCount > 0 ? "Pre-commencement surveys" : "No surveys required",
            bgClass: result && result.surveyCount > 0 ? "bg-amber-50" : "bg-cyan-50",
            textClass: result && result.surveyCount > 0 ? "text-amber-800" : "text-cyan-800",
            borderClass: result && result.surveyCount > 0 ? "border-amber-200" : "border-cyan-200",
            dotClass: result && result.surveyCount > 0 ? "bg-amber-500" : "bg-cyan-500",
          },
        ].map(c => {
          const bg = ("bgClass" in c) ? c.bgClass : c.bg;
          const tx = ("textClass" in c) ? c.textClass : c.text;
          const bd = ("borderClass" in c) ? c.borderClass : c.border;
          const dt = ("dotClass" in c) ? c.dotClass : c.dot;
          return (
            <div key={c.label} className={`border rounded-xl p-4 ${bg} ${bd}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dt}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${tx}`}>{c.label}</span>
              </div>
              <div className={`text-xl font-bold ${tx}`}>{c.value}</div>
              <div className={`text-xs mt-0.5 opacity-70 ${tx}`}>{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <button onClick={() => setShowOptimalWindow(!showOptimalWindow)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Find Optimal Window
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting || !result}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid disabled:opacity-40">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
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
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label>
            <input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Input Controls ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
        <h3 className="text-sm font-bold text-gray-700">Assessment Parameters</h3>
        <MonthRangeSelector start={startMonth} end={endMonth} onStartChange={setStartMonth} onEndChange={setEndMonth} />
        <WorksTypeSelector selected={selectedWorks} onChange={setSelectedWorks} />
        <SpeciesSelector selected={selectedSpecies} onChange={setSelectedSpecies} />
      </div>

      {/* ── Optimal Window Panel ──────────────────────────── */}
      {showOptimalWindow && result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-emerald-800 mb-2">Optimal Works Window</h3>
          <p className="text-xs text-emerald-700 mb-3">Months with no high-severity restricted periods for any of the selected species:</p>
          {result.optimalWindow && result.optimalWindow.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {([1,2,3,4,5,6,7,8,9,10,11,12] as Month[]).map(mo => {
                const isOptimal = result.optimalWindow!.includes(mo);
                return (
                  <div key={mo} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${isOptimal ? "bg-emerald-600 text-white" : "bg-white/60 text-gray-400 border border-gray-200"}`}>
                    {MONTH_NAMES[mo]}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-red-700 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              No clear window exists -- all months have at least one high-severity restricted period for the selected species. Consider phased works or consult an ecologist.
            </div>
          )}
        </div>
      )}

      {/* ── Calendar Gantt ─────────────────────────────────── */}
      {result && result.conflicts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700">12-Month Ecological Constraints Calendar</h3>
          <p className="text-[11px] text-gray-400">H = High severity restricted period, M = Moderate. Green shading = your proposed works period. Red/amber cells = conflict zones.</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div style={{ minWidth: 800 }}>
              <CalendarGantt result={result} startMonth={startMonth} endMonth={endMonth} />
            </div>
          </div>
        </div>
      )}

      {/* ── Species Conflict Details ──────────────────────── */}
      {result && result.conflicts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Species Constraint Details</h3>
          {result.conflicts.map(c => (
            <div key={c.species.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className={`px-4 py-3 border-b flex flex-wrap items-center gap-2 ${TRAFFIC_COLOURS[c.trafficLight].bg} ${TRAFFIC_COLOURS[c.trafficLight].border}`}>
                <span className={`w-3 h-3 rounded-full ${TRAFFIC_COLOURS[c.trafficLight].dot}`} />
                <span className={`text-sm font-bold ${TRAFFIC_COLOURS[c.trafficLight].text}`}>{c.species.name}</span>
                <TrafficBadge level={c.trafficLight} />
                {c.species.epsSpecies && <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full border border-purple-200">EPS</span>}
              </div>
              <div className="p-4 space-y-3">
                {/* Legislation */}
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Legislation</span>
                  <div className="text-xs text-gray-600 mt-0.5">{c.species.legislation.join(" | ")}</div>
                </div>
                {/* Exclusion Zone */}
                {c.species.exclusionZoneM > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Exclusion Zone</span>
                    <div className="text-xs text-gray-600 mt-0.5"><strong>{c.species.exclusionZoneM}m</strong> -- {c.species.exclusionZoneNote}</div>
                  </div>
                )}
                {/* Conflicting Periods */}
                {c.conflictingPeriods.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Conflicting Periods</span>
                    <div className="mt-1 space-y-1">
                      {c.conflictingPeriods.map(p => (
                        <div key={p.label} className={`text-xs px-2.5 py-1.5 rounded-lg ${p.severity === "high" ? "bg-red-50 text-red-800 border border-red-100" : "bg-yellow-50 text-yellow-800 border border-yellow-100"}`}>
                          <strong>{p.label}</strong> ({p.months.map(m2 => MONTH_NAMES[m2]).join(", ")}) -- {p.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Required Actions */}
                {c.actions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Required Actions</span>
                    <div className="mt-1 space-y-1">
                      {c.actions.map((a, i) => (
                        <div key={i} className="flex gap-2 text-xs text-gray-700">
                          <span className="text-ebrora font-bold mt-0.5 shrink-0">-</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Key flags */}
                <div className="flex flex-wrap gap-2">
                  {c.licenceRequired && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Licence Required</span>}
                  {c.surveyRequired && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Survey Required</span>}
                  {c.eclerkRequired && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">ECoW Required</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Traffic Light Key ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(["green", "yellow", "amber", "red"] as TrafficLight[]).map(tl => {
          const c = TRAFFIC_COLOURS[tl];
          return (
            <div key={tl} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${c.bg} ${c.text} border ${c.border}`}>
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {TRAFFIC_LABELS[tl]}
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Assessment based on Wildlife and Countryside Act 1981, Conservation of Habitats and Species Regulations 2017,
          Protection of Badgers Act 1992, NERC Act 2006, and Natural England standing advice. This is a planning tool --
          it does not replace a full ecological survey by a qualified ecologist. Always consult a licensed ecologist for
          site-specific advice.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
