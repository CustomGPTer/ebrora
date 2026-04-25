// src/components/welfare-facilities-calculator/WelfareFacilitiesCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  SITE_TYPES,
  STATUS_COLOURS,
  CDM_CHECKLIST,
  calculateRequirements,
  getRecommendedUnits,
  getComplianceStatus,
  calcFemaleToilets,
  type SiteType,
  type ComplianceStatus,
  type FullRequirements,
  type WelfareUnitConfig,
} from "@/data/welfare-facilities-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ── Helpers ─────────────────────────────────────────────────────

interface FacilityRow {
  id: string;
  label: string;
  category: string;
  required: number;
  provided: number;
  status: ComplianceStatus;
  regulation: string;
  unit: string;
}

function buildFacilityRows(req: FullRequirements, provided: Record<string, number>): FacilityRow[] {
  const rows: FacilityRow[] = [
    { id: "male_wc", label: "Male WCs", category: "Sanitary", required: req.maleWCs, provided: provided.male_wc ?? 0, status: "compliant", regulation: "BS 6465 / HSG150", unit: "nr" },
    { id: "male_urinal", label: "Male Urinals", category: "Sanitary", required: req.maleUrinals, provided: provided.male_urinal ?? 0, status: "compliant", regulation: "BS 6465", unit: "nr" },
    { id: "female_wc", label: "Female WCs", category: "Sanitary", required: req.femaleWCs, provided: provided.female_wc ?? 0, status: "compliant", regulation: "BS 6465 / CDM Sch.2", unit: "nr" },
    { id: "wash", label: "Wash Stations", category: "Hygiene", required: req.washStations, provided: provided.wash ?? 0, status: "compliant", regulation: "CDM 2015 Sch.2 Para.2", unit: "nr" },
    { id: "drinking", label: "Drinking Water Points", category: "Hygiene", required: req.drinkingWaterPoints, provided: provided.drinking ?? 0, status: "compliant", regulation: "CDM 2015 Sch.2 Para.3", unit: "nr" },
    { id: "changing", label: "Changing/Drying Seats", category: "Changing", required: req.changingSeats, provided: provided.changing ?? 0, status: "compliant", regulation: "CDM 2015 Sch.2 Para.4", unit: "seats" },
    { id: "rest", label: "Rest/Eating Seats", category: "Rest", required: req.restSeats, provided: provided.rest ?? 0, status: "compliant", regulation: "CDM 2015 Sch.2 Para.5", unit: "seats" },
    { id: "first_aid", label: "First Aid Rooms", category: "First Aid", required: req.firstAidRooms, provided: provided.first_aid ?? 0, status: "compliant", regulation: "H&S (First Aid) Regs 1981", unit: "nr" },
    { id: "ppe", label: "PPE Lockers/Storage", category: "Storage", required: req.ppeLockers, provided: provided.ppe ?? 0, status: "compliant", regulation: "CDM 2015 Sch.2 Para.4(4)", unit: "nr" },
  ];
  for (const r of rows) {
    r.status = getComplianceStatus(r.required, r.provided);
  }
  return rows;
}

function overallStatus(rows: FacilityRow[]): ComplianceStatus {
  if (rows.some(r => r.status === "non_compliant")) return "non_compliant";
  if (rows.some(r => r.status === "borderline")) return "borderline";
  return "compliant";
}

// ── PDF Export ──────────────────────────────────────────────────

async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  totalOps: number,
  femalePercent: number,
  siteType: SiteType,
  durationWeeks: number,
  firstAidRA: boolean,
  rows: FacilityRow[],
  units: WelfareUnitConfig[],
  overall: ComplianceStatus,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `WFC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const maleCount = totalOps - Math.round(totalOps * femalePercent / 100);
  const femaleCount = Math.round(totalOps * femalePercent / 100);
  const siteLabel = SITE_TYPES.find(s => s.id === siteType)?.label || siteType;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("WELFARE FACILITIES ASSESSMENT (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header (PAID)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("WELFARE FACILITIES ASSESSMENT", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | CDM 2015 Schedule 2 / HSG150 / BS 6465 | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 24, 1, 1, "FD");
  doc.setFontSize(8);

  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };

  drawFld("Company:", header.company, M + 3, y, 50);
  drawFld("Date:", header.date, M + CW / 2, y, 30);
  y += 5;
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + CW / 2, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Site Type:", siteLabel, M + CW / 2, y, 30);
  y += 5;
  drawFld("Peak Operatives:", `${totalOps} (${maleCount} male, ${femaleCount} female)`, M + 3, y, 50);
  drawFld("Duration:", `${durationWeeks} weeks`, M + CW / 2, y, 30);
  y += 9;

  // Overall status banner
  const statusColMap: Record<ComplianceStatus, [number, number, number]> = {
    compliant: [34, 197, 94],
    borderline: [245, 158, 11],
    non_compliant: [239, 68, 68],
  };
  const statusLabels: Record<ComplianceStatus, string> = {
    compliant: "COMPLIANT",
    borderline: "BORDERLINE - ACTION REQUIRED",
    non_compliant: "NON-COMPLIANT - IMMEDIATE ACTION REQUIRED",
  };
  const [sr, sg, sb] = statusColMap[overall];
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(M, y, CW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`OVERALL: ${statusLabels[overall]}`, M + 4, y + 5.5);
  doc.setTextColor(0, 0, 0); y += 13;

  // Facility requirements table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Facility Requirements Breakdown", M, y); y += 5;

  // Table header
  const cols = [55, 25, 25, 35, 46];
  doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Facility", "Required", "Provided", "Status", "Regulation"].forEach((h, i) => {
    doc.rect(cx, y, cols[i], 6, "F"); doc.text(h, cx + 2, y + 4); cx += cols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  // Table rows
  doc.setFontSize(6); doc.setDrawColor(200, 200, 200);
  for (const row of rows) {
    checkPage(6);
    const rowH = 5.5;
    cx = M;
    // Status background
    if (row.status === "non_compliant") { doc.setFillColor(255, 240, 240); doc.rect(M, y, CW, rowH, "F"); }
    else if (row.status === "borderline") { doc.setFillColor(255, 251, 235); doc.rect(M, y, CW, rowH, "F"); }

    cols.forEach((w) => { doc.rect(cx, y, w, rowH, "D"); cx += w; });
    cx = M;
    doc.setFont("helvetica", "bold"); doc.text(row.label, cx + 2, y + 3.8); cx += cols[0];
    doc.setFont("helvetica", "normal");
    doc.text(`${row.required} ${row.unit}`, cx + 2, y + 3.8); cx += cols[1];
    doc.text(`${row.provided} ${row.unit}`, cx + 2, y + 3.8); cx += cols[2];

    const stl = STATUS_COLOURS[row.status];
    const [scr, scg, scb] = row.status === "compliant" ? [34, 197, 94] : row.status === "borderline" ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scr, scg, scb);
    doc.roundedRect(cx + 2, y + 1, doc.getTextWidth(stl.label) + 4, 3.5, 0.5, 0.5, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(5.5);
    doc.text(stl.label, cx + 4, y + 3.5);
    doc.setTextColor(0, 0, 0); doc.setFontSize(6);
    cx += cols[3];

    doc.text(row.regulation, cx + 2, y + 3.8);
    y += rowH;
  }
  y += 6;

  // Recommended unit configurations
  checkPage(15 + units.length * 20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Recommended Welfare Unit Configuration", M, y); y += 5;

  for (const unit of units) {
    checkPage(20);
    doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
    const provLines = unit.provides.map(p => `- ${p}`);
    const boxH = 10 + provLines.length * 3;
    doc.roundedRect(M, y, CW, boxH, 1, 1, "FD");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
    doc.text(unit.label, M + 3, y + 4);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(`${unit.suitableFor} -- ${unit.description}`, M + 3, y + 8);
    doc.setTextColor(0, 0, 0);
    let py = y + 12;
    for (const line of provLines) {
      doc.text(line, M + 5, py); py += 3;
    }
    y += boxH + 2;
  }
  y += 4;

  // CDM Compliance Checklist
  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("CDM 2015 Schedule 2 Compliance Checklist", M, y); y += 5;

  const chkColW = [80, 75, 31];
  doc.setFillColor(30, 30, 30); doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  cx = M;
  ["Requirement", "Regulation", "Check"].forEach((h, i) => {
    doc.rect(cx, y, chkColW[i], 5.5, "F"); doc.text(h, cx + 2, y + 3.8); cx += chkColW[i];
  });
  doc.setTextColor(0, 0, 0); y += 5.5;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const item of CDM_CHECKLIST) {
    const lines = doc.splitTextToSize(item.requirement, chkColW[0] - 4);
    const rowH = Math.max(5, lines.length * 2.8 + 1.5);
    checkPage(rowH);
    cx = M;
    chkColW.forEach(w => { doc.rect(cx, y, w, rowH, "D"); cx += w; });
    doc.setFont("helvetica", "normal");
    doc.text(lines, M + 2, y + 3);
    doc.text(item.regulation, M + chkColW[0] + 2, y + 3);
    // Empty tick box
    doc.rect(M + chkColW[0] + chkColW[1] + 12, y + (rowH / 2) - 1.5, 3, 3, "D");
    y += rowH;
  }
  y += 8;

  // Sign-off
  checkPage(55);
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SIGN-OFF", M, y); y += 6;
  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  doc.setFont("helvetica", "normal");
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer on every page
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Assessment per CDM Regulations 2015 Schedule 2, HSG150, BS 6465-1:2006, Workplace (H,S&W) Regulations 1992.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`, W - M - 50, 290);
  }

  const safeSite = (header.site || "welfare").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  doc.save(`welfare-facilities-assessment-${safeSite}-${todayISO()}.pdf`);
}

// ── Component ──────────────────────────────────────────────────

export default function WelfareFacilitiesCalculatorClient() {
  // Header fields
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  // Inputs
  const [totalOps, setTotalOps] = useState<number | null>(null);
  const [femalePercent, setFemalePercent] = useState<number>(5);
  const [siteType, setSiteType] = useState<SiteType>("new_build");
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null);
  const [firstAidRA, setFirstAidRA] = useState(false);

  // Provided quantities (user editable)
  const [provided, setProvided] = useState<Record<string, number>>({
    male_wc: 0, male_urinal: 0, female_wc: 0, wash: 0, drinking: 0,
    changing: 0, rest: 0, first_aid: 0, ppe: 0,
  });

  // Settings panel
  const [showSettings, setShowSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  const hasData = (totalOps ?? 0) > 0;
  const totalOperatives = totalOps ?? 0;
  const maleCount = totalOperatives - Math.round(totalOperatives * femalePercent / 100);
  const femaleCount = Math.round(totalOperatives * femalePercent / 100);

  const requirements = useMemo(() => {
    if (!hasData) return null;
    return calculateRequirements(totalOperatives, femalePercent, siteType, durationWeeks ?? 0, firstAidRA);
  }, [totalOperatives, femalePercent, siteType, durationWeeks, firstAidRA, hasData]);

  const facilityRows = useMemo(() => {
    if (!requirements) return [];
    return buildFacilityRows(requirements, provided);
  }, [requirements, provided]);

  const overall = useMemo(() => overallStatus(facilityRows), [facilityRows]);

  const units = useMemo(() => {
    if (!hasData) return [];
    return getRecommendedUnits(totalOperatives, maleCount, femaleCount, siteType, durationWeeks ?? 0);
  }, [totalOperatives, maleCount, femaleCount, siteType, durationWeeks, hasData]);

  // Auto-fill provided = required on input change
  const autoFillProvided = useCallback(() => {
    if (!requirements) return;
    setProvided({
      male_wc: requirements.maleWCs,
      male_urinal: requirements.maleUrinals,
      female_wc: requirements.femaleWCs,
      wash: requirements.washStations,
      drinking: requirements.drinkingWaterPoints,
      changing: requirements.changingSeats,
      rest: requirements.restSeats,
      first_aid: requirements.firstAidRooms,
      ppe: requirements.ppeLockers,
    });
  }, [requirements]);

  const handleExport = useCallback(async () => {
    if (!hasData || !requirements) return;
    setExporting(true);
    try {
      await exportPDF(
        { company, site, manager, assessedBy, date },
        totalOperatives, femalePercent, siteType, durationWeeks ?? 0, firstAidRA,
        facilityRows, units, overall,
      );
    } finally { setExporting(false); }
  }, [company, site, manager, assessedBy, date, totalOperatives, femalePercent, siteType, durationWeeks, firstAidRA, facilityRows, units, overall, hasData, requirements]);

  const handleClear = useCallback(() => {
    setTotalOps(null); setFemalePercent(5); setSiteType("new_build"); setDurationWeeks(null);
    setFirstAidRA(false); setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setDate(todayISO());
    setProvided({ male_wc: 0, male_urinal: 0, female_wc: 0, wash: 0, drinking: 0, changing: 0, rest: 0, first_aid: 0, ppe: 0 });
  }, []);

  const updateProvided = useCallback((key: string, val: number) => {
    setProvided(prev => ({ ...prev, [key]: Math.max(0, val) }));
  }, []);

  // ── Status Cards ──────────────────────────────────────────────

  const statusCards = useMemo(() => {
    if (!hasData || !requirements) return [];
    const compliant = facilityRows.filter(r => r.status === "compliant").length;
    const borderline = facilityRows.filter(r => r.status === "borderline").length;
    const nonComp = facilityRows.filter(r => r.status === "non_compliant").length;
    return [
      { label: "Peak Operatives", value: `${totalOperatives}`, sub: `${maleCount}M / ${femaleCount}F`, colour: "border-blue-200 bg-blue-50/50" },
      { label: "Overall Status", value: STATUS_COLOURS[overall].label, sub: `${compliant} pass, ${borderline} borderline, ${nonComp} fail`, colour: overall === "compliant" ? "border-emerald-200 bg-emerald-50/50" : overall === "borderline" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50" },
      { label: "Welfare Units", value: `${units.length}`, sub: "recommended configs", colour: "border-purple-200 bg-purple-50/50" },
      { label: "CDM Checks", value: `${CDM_CHECKLIST.length}`, sub: "checklist items", colour: "border-gray-200 bg-gray-50/50" },
    ];
  }, [hasData, requirements, facilityRows, totalOperatives, maleCount, femaleCount, overall, units]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      {hasData && requirements && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statusCards.map(c => (
            <div key={c.label} className={`rounded-xl border p-3.5 ${c.colour}`}>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{c.value}</p>
              <p className="text-[11px] text-gray-500">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowSettings(v => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          Settings
        </button>
        <PaidDownloadButton hasData={hasData}>
          <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1E1E1E] rounded-lg hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {exporting ? "Generating..." : "Download PDF"}
          </button>
        </PaidDownloadButton>
        {hasData && requirements && (
          <button onClick={autoFillProvided} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ebrora bg-ebrora-light border border-ebrora/20 rounded-lg hover:bg-ebrora-mid/30 transition-colors">
            Auto-fill Provided = Required
          </button>
        )}
        <button onClick={handleClear} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ml-auto">
          Clear All
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Site Details & Assessment Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Site</label>
              <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site name" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Site Manager</label>
              <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Site manager" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Assessed By</label>
              <input type="text" value={assessedBy} onChange={e => setAssessedBy(e.target.value)} placeholder="Assessor name" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Site Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Peak Operatives</label>
                <input type="number" min={1} max={5000} value={totalOps ?? ""} onChange={e => setTotalOps(e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 45" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Female %</label>
                <input type="number" min={0} max={100} step={1} value={femalePercent} onChange={e => setFemalePercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                <p className="text-[10px] text-gray-400 mt-0.5">{maleCount} male, {femaleCount} female</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Site Type</label>
                <select value={siteType} onChange={e => setSiteType(e.target.value as SiteType)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors">
                  {SITE_TYPES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Duration (weeks)</label>
                <input type="number" min={1} max={520} value={durationWeeks ?? ""} onChange={e => setDurationWeeks(e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 26" className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            </div>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={firstAidRA} onChange={e => setFirstAidRA(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
                <span className="text-sm text-gray-700">Risk assessment requires dedicated first aid room (regardless of operative count)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Table — Desktop */}
      {hasData && requirements && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Facility Requirements vs Provision</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Edit the &quot;Provided&quot; column to match your actual site facilities</p>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Facility</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-center px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Required</th>
                  <th className="text-center px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Provided</th>
                  <th className="text-center px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Regulation</th>
                </tr>
              </thead>
              <tbody>
                {facilityRows.map(row => {
                  const sc = STATUS_COLOURS[row.status];
                  return (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{row.category}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-900">{row.required}</td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number" min={0} max={9999}
                          value={provided[row.id] ?? 0}
                          onChange={e => updateProvided(row.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center px-1.5 py-1 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-400">{row.regulation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {facilityRows.map(row => {
              const sc = STATUS_COLOURS[row.status];
              return (
                <div key={row.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">{row.label}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} /> {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Required: <strong className="text-gray-900">{row.required}</strong></span>
                    <span className="flex items-center gap-1">
                      Provided:
                      <input type="number" min={0} value={provided[row.id] ?? 0} onChange={e => updateProvided(row.id, parseInt(e.target.value) || 0)} className="w-14 text-center px-1 py-0.5 text-xs border border-gray-200 rounded bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{row.regulation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Welfare Unit Configurations */}
      {hasData && units.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Recommended Welfare Unit Configuration</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Based on {totalOperatives} peak operatives, {SITE_TYPES.find(s => s.id === siteType)?.label} site, {durationWeeks ?? 0} weeks</p>
          </div>
          <div className="divide-y divide-gray-100">
            {units.map((unit, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{unit.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{unit.description} -- {unit.suitableFor}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {unit.provides.map((p, j) => (
                        <span key={j} className="inline-block px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CDM Compliance Checklist */}
      {hasData && requirements && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">CDM 2015 Schedule 2 Compliance Checklist</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{CDM_CHECKLIST.length} items -- tick boxes appear on the PDF for hand-completion on site</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {CDM_CHECKLIST.map(item => (
              <div key={item.id} className="px-4 py-2.5 flex items-start gap-3">
                <div className="w-5 h-5 rounded border border-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{item.requirement}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.regulation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Welfare Facilities Calculator</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Enter the peak number of operatives in Settings above to calculate minimum welfare facility requirements per CDM 2015 Schedule 2, HSG150 and BS 6465.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Calculations per CDM Regulations 2015 (Schedule 2), HSG150 (Health and Safety in Construction), BS 6465-1:2006 (Sanitary installations), Workplace (Health, Safety and Welfare) Regulations 1992, and Health and Safety (First-Aid) Regulations 1981.</p>
        <p>This tool provides guidance on minimum welfare facility requirements. The principal contractor retains legal responsibility for ensuring adequate welfare provision under CDM 2015 Regulation 13. A site-specific risk assessment should be used to determine actual requirements.</p>
      </div>
    </div>
  );
}
