// src/components/first-aid-needs-calculator/FirstAidNeedsCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  RISK_LEVELS, SPECIFIC_HAZARDS, KIT_CONTENTS,
  calculateRequirements, checkCompliance, generateRecommendations,
  getRiskLevelDef, kitSize,
} from "@/data/first-aid-needs-calculator";
import type { SiteInputs, CurrentProvision, RiskLevel, SpecificHazard, FirstAidRequirement, ComplianceCheck } from "@/data/first-aid-needs-calculator";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── SVG Provision Bar Chart ─────────────────────────────────
function ProvisionChart({ checks }: { checks: ComplianceCheck[] }) {
  const assessed = checks.filter(c => c.current !== null);
  if (assessed.length === 0) return null;
  const W = 500, H = 180, PAD = { top: 15, right: 15, bottom: 40, left: 120 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const barH = Math.min(25, ch / assessed.length - 8);
  const maxVal = Math.max(...assessed.map(c => Math.max(c.required, c.current || 0)), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
      {assessed.map((c, i) => {
        const y = PAD.top + i * (barH + 12);
        const reqW = (c.required / maxVal) * cw;
        const curW = ((c.current || 0) / maxVal) * cw;
        const ok = c.status === "compliant";
        return (
          <g key={c.item}>
            <text x={PAD.left - 6} y={y + barH / 2 + 3} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>{c.item}</text>
            {/* Required bar (grey) */}
            <rect x={PAD.left} y={y} width={reqW} height={barH / 2} fill="#E5E7EB" rx={2} />
            <text x={PAD.left + reqW + 4} y={y + barH / 2 - 4} fontSize={8} fill="#9CA3AF">Req: {c.required}</text>
            {/* Current bar */}
            <rect x={PAD.left} y={y + barH / 2 + 2} width={curW} height={barH / 2} fill={ok ? "#22C55E" : "#EF4444"} rx={2} />
            <text x={PAD.left + curW + 4} y={y + barH + 1} fontSize={8} fill={ok ? "#16A34A" : "#DC2626"} fontWeight={600}>Have: {c.current} {ok ? "" : `(need ${c.shortfall} more)`}</text>
          </g>
        );
      })}
      <text x={PAD.left} y={H - 6} fontSize={8} fill="#9CA3AF">Grey = required | Coloured = current provision (green = OK, red = shortfall)</text>
    </svg>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  inputs: SiteInputs, req: FirstAidRequirement, checks: ComplianceCheck[], recs: string[],
  showCurrent: boolean, current: CurrentProvision,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `FAN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("FIRST AID NEEDS ASSESSMENT", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("HSE L74 / SI 1981/917 / First-Aid Regulations 1981 / BS 8599-1:2019 -- ebrora.com/tools/first-aid-needs-calculator", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 25, 1, 1, "FD"); doc.setFontSize(8);
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
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 5;
  const riskDef = getRiskLevelDef(inputs.riskLevel);
  drawFld("Workers:", String(inputs.totalWorkers), M + 3, y, 0);
  drawFld("Risk Level:", riskDef.label, M + 50, y, 0);
  drawFld("Shifts:", String(inputs.numShifts), M + halfW, y, 0);
  y += 5;
  drawFld("Locations:", inputs.multipleLocations ? String(inputs.numLocations) : "1 (single)", M + 3, y, 0);
  drawFld("Distance to A&E:", inputs.distanceToAE === "under10" ? "<10 min" : inputs.distanceToAE === "10to30" ? "10-30 min" : ">30 min", M + halfW, y, 0);
  y += 8;

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("FIRST AID NEEDS ASSESSMENT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // Requirements summary (coloured panel)
  checkPage(40);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, 35, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Minimum First Aid Requirements", M + 4, y + 2); y += 6;

  const summaryItems = [
    ["FAW First Aiders (total)", String(req.fawFirstAiders), [220, 38, 38]],
    ["EFAW Appointed Persons (total)", String(req.efawAppointed), [234, 88, 12]],
    ["First Aid Kits (BS 8599-1)", String(req.firstAidKits), [59, 130, 246]],
    ["AED Units (recommended)", String(req.aedRecommended), [124, 58, 237]],
    ["Per Shift: FAW", String(req.perShiftFAW), [220, 38, 38]],
    ["Per Shift: EFAW", String(req.perShiftEFAW), [234, 88, 12]],
    ["Kit Size", kitSize(Math.ceil(inputs.totalWorkers / Math.max(1, inputs.multipleLocations ? inputs.numLocations : 1))), [100, 116, 139]],
  ];
  summaryItems.forEach(([label, value, colour]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    const c = colour as number[];
    doc.setTextColor(c[0], c[1], c[2]); doc.setFont("helvetica", "bold");
    doc.text(value as string, M + 64, y);
    doc.setTextColor(0, 0, 0);
    y += 3.8;
  });
  y += 5;

  // Compliance (if current provision entered)
  if (showCurrent) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Compliance Check (Current vs Required)", M, y); y += 5;
    const cols2 = [55, 25, 25, 25, 30];
    let cx = M;
    ["Item", "Required", "Current", "Shortfall", "Status"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols2[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(h, cx + 2, y + 4); cx += cols2[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    checks.forEach((c, idx) => {
      cx = M;
      const statusText = c.status === "compliant" ? "PASS" : c.status === "shortfall" ? "FAIL" : "--";
      [c.item, String(c.required), c.current !== null ? String(c.current) : "--", c.current !== null ? String(c.shortfall) : "--", statusText].forEach((t, i) => {
        if (i === 4 && statusText === "PASS") {
          doc.setFillColor(220, 252, 231); doc.rect(cx, y, cols2[i], 5.5, "F");
          doc.setTextColor(22, 101, 52); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
        } else if (i === 4 && statusText === "FAIL") {
          doc.setFillColor(254, 226, 226); doc.rect(cx, y, cols2[i], 5.5, "F");
          doc.setTextColor(153, 27, 27); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
        } else if (i === 3 && c.shortfall !== null && c.shortfall > 0) {
          doc.setFillColor(254, 243, 199); doc.rect(cx, y, cols2[i], 5.5, "F");
          doc.setTextColor(133, 77, 14); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
        } else {
          if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols2[i], 5.5, "FD"); }
          else { doc.rect(cx, y, cols2[i], 5.5, "D"); }
          doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
        }
        doc.text(t, cx + 2, y + 3.8);
        doc.setTextColor(0, 0, 0);
        cx += cols2[i];
      });
      y += 5.5;
    });
    y += 5;
  }

  // Shift coverage
  if (req.shiftCoverage.length > 1) {
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Shift Coverage Matrix", M, y); y += 5;
    req.shiftCoverage.forEach(sc => {
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text(`Shift ${sc.shiftNumber}: ${sc.fawRequired} FAW + ${sc.efawRequired} EFAW + ${sc.kitsRequired} kit(s)`, M + 2, y);
      y += 3.5;
    });
    y += 4;
  }

  // Supplementary equipment
  if (req.supplementaryEquipment.length > 0) {
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Supplementary Equipment for Specific Hazards", M, y); y += 5;
    req.supplementaryEquipment.forEach(item => {
      checkPage(5);
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(`- ${item.item} (x${item.quantity})`, M + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(`  ${item.reason}`, M + 4, y + 3);
      y += 7;
    });
    y += 3;
  }

  // Recommendations
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommendations", M, y); y += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  recs.forEach(rec => {
    checkPage(6);
    const lines = doc.splitTextToSize(`- ${rec}`, CW - 4);
    doc.text(lines, M + 2, y); y += lines.length * 3.5;
  });
  y += 3;

  // Kit contents
  checkPage(15);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("BS 8599-1:2019 First Aid Kit Contents", M, y); y += 5;
  const kSize = kitSize(Math.ceil(inputs.totalWorkers / Math.max(1, inputs.multipleLocations ? inputs.numLocations : 1)));
  const colKey = kSize === "small" ? "smallKit" : kSize === "medium" ? "mediumKit" : "largeKit";
  KIT_CONTENTS.forEach(item => {
    checkPage(4);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`- ${item.item}: ${item[colKey]}`, M + 2, y);
    y += 3.2;
  });
  y += 4;

  // Sign-off
  checkPage(50); y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
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

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("First aid needs assessment per HSE L74, Health and Safety (First-Aid) Regulations 1981, and BS 8599-1:2019. This is a screening tool.", M, 290);
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }
  doc.save(`first-aid-needs-assessment-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function FirstAidNeedsCalculatorClient() {
  const [site, setSite] = useState(""); const [manager2, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState(""); const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false); const [exporting, setExporting] = useState(false);

  const [totalWorkers, setTotalWorkers] = useState<number>(50);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("high");
  const [numShifts, setNumShifts] = useState<number>(1);
  const [multipleLocations, setMultipleLocations] = useState(false);
  const [numLocations, setNumLocations] = useState<number>(1);
  const [distanceToAE, setDistanceToAE] = useState<"under10" | "10to30" | "over30">("10to30");
  const [specificHazards, setSpecificHazards] = useState<SpecificHazard[]>([]);

  const [showCurrent, setShowCurrent] = useState(false);
  const [currentFAW, setCurrentFAW] = useState<number>(0);
  const [currentEFAW, setCurrentEFAW] = useState<number>(0);
  const [currentKits, setCurrentKits] = useState<number>(0);
  const [currentAED, setCurrentAED] = useState<number>(0);

  const inputs: SiteInputs = { totalWorkers, riskLevel, numShifts, multipleLocations, numLocations, distanceToAE, specificHazards };
  const currentProvision: CurrentProvision = { fawFirstAiders: currentFAW, efawAppointed: currentEFAW, firstAidKits: currentKits, aedUnits: currentAED };

  const req = useMemo(() => calculateRequirements(inputs), [totalWorkers, riskLevel, numShifts, multipleLocations, numLocations, distanceToAE, specificHazards]);
  const checks = useMemo(() => checkCompliance(req, showCurrent ? currentProvision : null), [req, showCurrent, currentFAW, currentEFAW, currentKits, currentAED]);
  const recs = useMemo(() => generateRecommendations(inputs, req, checks), [inputs, req, checks]);
  const overallCompliant = checks.every(c => c.status !== "shortfall");
  const kSize = kitSize(Math.ceil(totalWorkers / Math.max(1, multipleLocations ? numLocations : 1)));

  const toggleHazard = useCallback((h: SpecificHazard) => {
    setSpecificHazards(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager: manager2, assessedBy, date: assessDate }, inputs, req, checks, recs, showCurrent, currentProvision); }
    finally { setExporting(false); }
  }, [site, manager2, assessedBy, assessDate, inputs, req, checks, recs, showCurrent, currentProvision]);

  const clearAll = useCallback(() => {
    setTotalWorkers(50); setRiskLevel("high"); setNumShifts(1); setMultipleLocations(false); setNumLocations(1);
    setDistanceToAE("10to30"); setSpecificHazards([]); setShowCurrent(false);
    setCurrentFAW(0); setCurrentEFAW(0); setCurrentKits(0); setCurrentAED(0);
    setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "FAW First Aiders", value: String(req.fawFirstAiders), sub: `${req.perShiftFAW} per shift`, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
          { label: "EFAW Appointed", value: String(req.efawAppointed), sub: `${req.perShiftEFAW} per shift`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "First Aid Kits", value: String(req.firstAidKits), sub: `${kSize} kit (BS 8599-1)`, bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" },
          { label: "AED Units", value: String(req.aedRecommended), sub: req.aedRecommended > 0 ? "Recommended" : "Not specifically required", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
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
        <button onClick={() => setShowCurrent(!showCurrent)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showCurrent ? "text-white bg-ebrora" : "text-blue-700 bg-blue-50 hover:bg-blue-100"}`}>
          {showCurrent ? "Hide" : "Compare"} Current Provision
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager2, s: setManager }, { l: "Assessed By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Site Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Workers (peak)</label>
            <input type="number" value={totalWorkers} onChange={e => setTotalWorkers(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={5000}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Category</label>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              {RISK_LEVELS.map(r => <option key={r.level} value={r.level}>{r.label} -- {r.description}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Number of Shifts</label>
            <select value={numShifts} onChange={e => setNumShifts(parseInt(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none">
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} shift{n > 1 ? "s" : ""}</option>)}
            </select></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Multiple Locations?</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setMultipleLocations(!multipleLocations)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${multipleLocations ? "bg-ebrora" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${multipleLocations ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              {multipleLocations && <input type="number" value={numLocations} onChange={e => setNumLocations(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={20}
                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none" />}
            </div></div>
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Distance to A&E</label>
            <select value={distanceToAE} onChange={e => setDistanceToAE(e.target.value as typeof distanceToAE)}
              className="w-full px-2.5 py-1.5 text-sm border border-ebrora/30 bg-ebrora-light/40 rounded-lg focus:border-ebrora outline-none">
              <option value="under10">Under 10 minutes</option>
              <option value="10to30">10-30 minutes</option>
              <option value="over30">Over 30 minutes</option>
            </select></div>
        </div>
      </div>

      {/* Specific Hazards */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Specific Hazards (select all that apply)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPECIFIC_HAZARDS.map(h => (
            <button key={h.id} onClick={() => toggleHazard(h.id)}
              className={`text-left p-2.5 rounded-xl border-2 transition-all ${specificHazards.includes(h.id) ? "border-ebrora bg-ebrora-light/40" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className={`text-xs font-bold ${specificHazards.includes(h.id) ? "text-ebrora-dark" : "text-gray-700"}`}>{h.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{h.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Provision (optional) */}
      {showCurrent && (
        <div className="bg-blue-50/30 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-blue-800">Current Provision (compare against requirements)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{ l: "FAW First Aiders", v: currentFAW, s: setCurrentFAW }, { l: "EFAW Appointed", v: currentEFAW, s: setCurrentEFAW }, { l: "First Aid Kits", v: currentKits, s: setCurrentKits }, { l: "AED Units", v: currentAED, s: setCurrentAED }].map(f => (
              <div key={f.l}><label className="block text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-1">{f.l}</label>
                <input type="number" value={f.v} onChange={e => f.s(Math.max(0, parseInt(e.target.value) || 0))} min={0}
                  className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
            ))}
          </div>
          {/* Provision Chart */}
          <ProvisionChart checks={checks} />
          {/* Compliance traffic lights */}
          <div className="flex flex-wrap gap-2 mt-2">
            {checks.map(c => (
              <div key={c.item} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${c.status === "compliant" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : c.status === "shortfall" ? "bg-red-50 text-red-800 border border-red-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                <span className={`w-2 h-2 rounded-full ${c.status === "compliant" ? "bg-emerald-500" : c.status === "shortfall" ? "bg-red-500" : "bg-gray-400"}`} />
                {c.item}: {c.status === "compliant" ? "OK" : c.status === "shortfall" ? `-${c.shortfall}` : "--"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Coverage */}
      {numShifts > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Shift Coverage Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["Shift", "FAW First Aiders", "EFAW Appointed", "First Aid Kits"].map(h => <th key={h} className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {req.shiftCoverage.map(sc => (
                  <tr key={sc.shiftNumber}>
                    <td className="px-3 py-1.5 font-medium text-gray-800">Shift {sc.shiftNumber}</td>
                    <td className="px-3 py-1.5 text-gray-600">{sc.fawRequired}</td>
                    <td className="px-3 py-1.5 text-gray-600">{sc.efawRequired}</td>
                    <td className="px-3 py-1.5 text-gray-600">{sc.kitsRequired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplementary Equipment */}
      {req.supplementaryEquipment.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Supplementary Equipment (Specific Hazards)</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {req.supplementaryEquipment.map((item, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                <span className="mt-0.5 w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">x{item.quantity}</span>
                <div><div className="text-sm font-medium text-gray-800">{item.item}</div>
                  <div className="text-[11px] text-gray-400">{item.reason}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kit Contents */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">BS 8599-1:2019 First Aid Kit Contents ({kSize} kit)</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {KIT_CONTENTS.map((item, i) => {
            const qty = kSize === "small" ? item.smallKit : kSize === "medium" ? item.mediumKit : item.largeKit;
            return (
              <div key={i} className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.item}</span>
                <span className="text-sm font-bold text-gray-800 tabular-nums">{qty}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><h3 className="text-sm font-bold text-gray-700">Recommendations</h3></div>
        <div className="px-4 py-3 space-y-2">
          {recs.map((rec, i) => <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-ebrora font-bold mt-0.5">-</span><span>{rec}</span></div>)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Based on HSE L74 (First Aid at Work - The Health and Safety (First-Aid) Regulations 1981, Approved Code of Practice and guidance).
          Kit contents per BS 8599-1:2019. AED recommendations per Resuscitation Council UK guidelines. This is a screening tool.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">Browse all Ebrora tools</a>
      </div>
    </div>
  );
}
