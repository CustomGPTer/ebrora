// src/components/slip-risk-calculator/SlipRiskCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  SURFACE_DATABASE, SURFACE_CATEGORIES,
  CONTAMINATION_TYPES, FOOTWEAR_TYPES,
  ENVIRONMENT_FACTORS, HUMAN_FACTORS,
  CONTROL_MEASURES,
  RISK_COLOURS,
  calculateSlipScore, getApplicableControls,
  calculatePTVResult, ptvBandToRiskLevel, PTV_BAND_CONFIG,
  surfaceTypicalWetPTV, ptvBand,
  type SurfaceType, type RiskLevel, type PTVResult, type PTVBand,
} from "@/data/slip-risk-calculator";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function genId() { return Math.random().toString(36).slice(2, 10); }

// ─── Types ───────────────────────────────────────────────────
interface Zone {
  id: string;
  name: string;
  surfaceId: string | null;
  contaminationId: string;
  footwearId: string;
  envFactors: string[];
  humanFactors: string[];
  additionalNotes: string;
  measuredPTV: number | null; // optional measured PTV from pendulum test
}

function createZone(idx: number): Zone {
  return { id: genId(), name: `Zone ${String.fromCharCode(65 + idx)}`, surfaceId: null, contaminationId: "dry", footwearId: "safety_src", envFactors: [], humanFactors: [], additionalNotes: "", measuredPTV: null };
}

interface ZoneResult {
  id: string;
  name: string;
  surfaceName: string;
  contaminationName: string;
  footwearName: string;
  score: number;
  risk: RiskLevel;
  envNames: string[];
  humanNames: string[];
  ptv: number;
  ptvSource: "measured" | "derived";
  surfacePTV: number;
  contaminationDelta: number;
  ptvBand: PTVBand;
  ptvFinalBand: PTVBand;
  aggravatingCount: number;
  ptvEscalated: boolean;
}

// ─── PDF Export ──────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  zoneResults: ZoneResult[],
  zones: Zone[],
  overallRisk: RiskLevel,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 12; const CW = W - M * 2; let y = 0;
  const docRef = `SRA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function newPage() {
    doc.addPage();
    doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("SLIP RISK ASSESSMENT (continued)", M, 7);
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | ${header.site || ""}`, W - M - 55, 7);
    doc.setTextColor(0, 0, 0); y = 14;
  }
  function checkPage(n: number) { if (y + n > 275) newPage(); }

  // Dark header
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("SLIP RISK ASSESSMENT", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | HSWA 1974 / Workplace Regs 1992 / HSE GEIS2 | ${new Date().toLocaleDateString("en-GB")}`, M, 17);
  y = 28; doc.setTextColor(0, 0, 0);

  // Info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 19, 1, 1, "FD");
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
  y += 9;

  // Overall banner
  const riskColMap: Record<RiskLevel, [number, number, number]> = {
    low: [34, 197, 94], medium: [245, 158, 11], high: [239, 68, 68], very_high: [153, 27, 27],
  };
  const riskLabels: Record<RiskLevel, string> = {
    low: "LOW RISK", medium: "MEDIUM RISK - CONTROLS RECOMMENDED",
    high: "HIGH RISK - CONTROLS REQUIRED", very_high: "VERY HIGH RISK - IMMEDIATE ACTION REQUIRED",
  };
  const [sr, sg, sb] = riskColMap[overallRisk];
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(M, y, CW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`OVERALL: ${riskLabels[overallRisk]}`, M + 4, y + 5.5);
  doc.setTextColor(0, 0, 0); y += 13;

  // Zone summary table
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Zone Assessment Summary", M, y); y += 5;

  const zCols = [30, 40, 32, 30, 22, 32];
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
  let cx = M;
  ["Zone", "Surface", "Contamination", "Footwear", "PTV", "Slip Potential"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(cx, y, zCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4); cx += zCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;

  doc.setFontSize(5.5); doc.setDrawColor(200, 200, 200);
  for (const zr of zoneResults) {
    const rowH = 5.5; checkPage(rowH); cx = M;
    const ptvCell = `${zr.ptv.toFixed(0)}${zr.ptvSource === "measured" ? " (measured)" : ""}${zr.ptvEscalated ? " ↑" : ""}`;
    const cells = [zr.name, zr.surfaceName, zr.contaminationName, zr.footwearName, ptvCell];
    cells.forEach((t, i) => {
      doc.rect(cx, y, zCols[i], rowH, "D");
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      const lines = doc.splitTextToSize(t, zCols[i] - 4);
      doc.text(lines, cx + 2, y + 3.5);
      cx += zCols[i];
    });
    const [rr, rg, rb] = riskColMap[zr.risk];
    doc.setFillColor(rr, rg, rb); doc.rect(cx, y, zCols[5], rowH, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text(RISK_COLOURS[zr.risk].label, cx + 2, y + 3.5);
    doc.setTextColor(0, 0, 0); y += rowH;
  }
  y += 6;

  // Detailed zone breakdowns
  for (let zi = 0; zi < zoneResults.length; zi++) {
    const zr = zoneResults[zi];
    const zone = zones.find(z => z.id === zr.id);
    checkPage(40);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`${zr.name}: ${zr.surfaceName}`, M, y); y += 5;

    doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
    const ptvLine = zr.ptvSource === "measured"
      ? `PTV (measured): ${zr.ptv.toFixed(0)} - ${PTV_BAND_CONFIG[zr.ptvBand].label} (${PTV_BAND_CONFIG[zr.ptvBand].rangeText})`
      : `PTV (derived): surface ${zr.surfacePTV} ${zr.contaminationDelta < 0 ? zr.contaminationDelta : "+0"} contamination = ${zr.ptv.toFixed(0)} - ${PTV_BAND_CONFIG[zr.ptvBand].label} (${PTV_BAND_CONFIG[zr.ptvBand].rangeText})`;
    const details = [
      `Surface: ${zr.surfaceName}`,
      `Contamination: ${zr.contaminationName}`,
      `Footwear: ${zr.footwearName}`,
      `Environment: ${zr.envNames.length > 0 ? zr.envNames.join(", ") : "None selected"}`,
      `Human factors: ${zr.humanNames.length > 0 ? zr.humanNames.join(", ") : "None selected"}`,
      ptvLine,
      ...(zr.ptvEscalated ? [`Aggravating-factor escalation: ${zr.aggravatingCount} factors -> band escalated from ${PTV_BAND_CONFIG[zr.ptvBand].label} to ${PTV_BAND_CONFIG[zr.ptvFinalBand].label}`] : []),
      `Legacy aggravating-factor index: ${zr.score} / 15 (informational)`,
    ];
    for (const d of details) {
      checkPage(4);
      const lines = doc.splitTextToSize(d, CW - 4);
      doc.text(lines, M + 2, y); y += lines.length * 3;
    }
    if (zone?.additionalNotes) {
      checkPage(4);
      doc.setFont("helvetica", "italic");
      const nLines = doc.splitTextToSize(`Notes: ${zone.additionalNotes}`, CW - 4);
      doc.text(nLines, M + 2, y); y += nLines.length * 3;
      doc.setFont("helvetica", "normal");
    }
    y += 3;

    // Recommended controls for this zone
    const controls = getApplicableControls(zr.risk);
    if (controls.length > 0) {
      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      doc.text("Recommended Controls:", M + 2, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      const grouped: Record<string, string[]> = {};
      for (const c of controls) {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c.name);
      }
      for (const [cat, items] of Object.entries(grouped)) {
        checkPage(4);
        doc.setFont("helvetica", "bold");
        doc.text(`${cat}:`, M + 4, y); y += 3;
        doc.setFont("helvetica", "normal");
        for (const item of items) {
          checkPage(3);
          doc.text(`- ${item}`, M + 8, y); y += 3;
        }
      }
    }
    y += 4;
  }

  // Sign-off
  checkPage(45);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;

  const soW = Math.min(CW / 2 - 2, 85); const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5); doc.text("Site Manager", M + soW + 7, y + 5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(label, M + 3, y + 5); doc.text(label, M + soW + 7, y + 5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
    doc.text(`${docRef} | HSWA 1974 | Workplace (H,S&W) Regs 1992 | HSE GEIS2 | Generated ${new Date().toLocaleDateString("en-GB")}`, M, 290);
    doc.text(`Page ${p} of ${pageCount}`, W - M - 18, 290);
  }

  doc.save(`Slip-Risk-Assessment-${docRef}.pdf`);
}

// ─── Surface Selector ────────────────────────────────────────
function SurfaceSelector({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SURFACE_DATABASE.filter(s => {
      if (catFilter && s.category !== catFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q);
    });
  }, [search, catFilter]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCatFilter("")} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${!catFilter ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>All ({SURFACE_DATABASE.length})</button>
        {SURFACE_CATEGORIES.map(c => {
          const cnt = SURFACE_DATABASE.filter(s => s.category === c.id).length;
          if (cnt === 0) return null;
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${catFilter === c.id ? "bg-ebrora text-white border-ebrora" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-ebrora/30"}`}>{c.label} ({cnt})</button>
          );
        })}
      </div>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search surfaces..." className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">No surfaces found</div>
        ) : (
          filtered.map(s => {
            const wetPTV = surfaceTypicalWetPTV(s);
            const band = ptvBand(wetPTV);
            const rc = PTV_BAND_CONFIG[band];
            return (
              <button key={s.id} onClick={() => onChange(s.id)} className={`w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light transition-colors ${value === s.id ? "bg-ebrora-light/60 font-medium" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rc.bg} ${rc.border} ${rc.text}`}>Wet PTV ~{wetPTV}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.notes}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Toggle Button List ──────────────────────────────────────
function ToggleList({ items, selected, onChange, label }: { items: { id: string; name: string; scoreMod: number }[]; selected: string[]; onChange: (ids: string[]) => void; label: string }) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="mt-1 space-y-1">
        {items.map(item => (
          <button key={item.id} onClick={() => toggle(item.id)} className={`w-full text-left px-3 py-1.5 rounded-lg border text-sm transition-colors ${selected.includes(item.id) ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}>
            <span className="font-medium">{selected.includes(item.id) ? "[X] " : "[ ] "}{item.name}</span>
            <span className="text-[10px] text-gray-400 ml-2">({item.scoreMod >= 0 ? "+" : ""}{item.scoreMod})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function SlipRiskCalculatorClient() {
  const [showSettings, setShowSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [date, setDate] = useState(todayISO());

  const [zones, setZones] = useState<Zone[]>([createZone(0)]);

  const updateZone = useCallback((id: string, patch: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...patch } : z));
  }, []);

  const removeZone = useCallback((id: string) => {
    setZones(prev => prev.length > 1 ? prev.filter(z => z.id !== id) : prev);
  }, []);

  const addZone = useCallback(() => {
    setZones(prev => [...prev, createZone(prev.length)]);
  }, []);

  // Compute results
  const { zoneResults, overallRisk } = useMemo(() => {
    const results: ZoneResult[] = [];
    for (const z of zones) {
      if (!z.surfaceId) continue;
      const surface = SURFACE_DATABASE.find(s => s.id === z.surfaceId);
      if (!surface) continue;
      const contam = CONTAMINATION_TYPES.find(c => c.id === z.contaminationId);
      const fw = FOOTWEAR_TYPES.find(f => f.id === z.footwearId);
      const envMods = z.envFactors.map(eid => ENVIRONMENT_FACTORS.find(e => e.id === eid)?.scoreMod || 0);
      const humanMods = z.humanFactors.map(hid => HUMAN_FACTORS.find(h => h.id === hid)?.scoreMod || 0);
      // Legacy 1-15 score retained as secondary indicator
      const score = calculateSlipScore(surface.baseScore, contam?.scoreMod || 0, fw?.scoreMod || 0, envMods, humanMods);
      // PRIMARY classification: PTV-driven per HSE GEIS2
      const ptvResult: PTVResult = calculatePTVResult(
        surface,
        z.contaminationId,
        fw?.scoreMod || 0,
        envMods,
        humanMods,
        z.measuredPTV ?? undefined,
      );
      const risk = ptvBandToRiskLevel(ptvResult.finalBand);
      results.push({
        id: z.id, name: z.name, surfaceName: surface.name,
        contaminationName: contam?.name || "Dry", footwearName: fw?.name || "Unknown",
        score, risk,
        envNames: z.envFactors.map(eid => ENVIRONMENT_FACTORS.find(e => e.id === eid)?.name || ""),
        humanNames: z.humanFactors.map(hid => HUMAN_FACTORS.find(h => h.id === hid)?.name || ""),
        ptv: ptvResult.ptv,
        ptvSource: ptvResult.source,
        surfacePTV: ptvResult.surfacePTV,
        contaminationDelta: ptvResult.contaminationDelta,
        ptvBand: ptvResult.band,
        ptvFinalBand: ptvResult.finalBand,
        aggravatingCount: ptvResult.aggravatingFactorCount,
        ptvEscalated: ptvResult.escalated,
      });
    }
    const worst: RiskLevel = results.reduce<RiskLevel>((w, r) => {
      const order: RiskLevel[] = ["low", "medium", "high", "very_high"];
      return order.indexOf(r.risk) > order.indexOf(w) ? r.risk : w;
    }, "low");
    return { zoneResults: results, overallRisk: worst };
  }, [zones]);

  const hasData = zoneResults.length > 0;

  const handleExport = useCallback(async () => {
    if (!hasData) return;
    setExporting(true);
    try {
      await exportPDF({ company, site, manager, assessedBy, date }, zoneResults, zones, overallRisk);
    } finally { setExporting(false); }
  }, [hasData, company, site, manager, assessedBy, date, zoneResults, zones, overallRisk]);

  const clearAll = useCallback(() => {
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setDate(todayISO());
    setZones([createZone(0)]);
  }, []);

  const ovSt = RISK_COLOURS[overallRisk];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3.5 ${hasData ? ovSt.bg : "bg-gray-50"} ${hasData ? ovSt.border : "border-gray-200"}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${hasData ? ovSt.text : "text-gray-500"}`}>
            <span className={`w-2 h-2 rounded-full ${hasData ? ovSt.dot : "bg-gray-400"}`} />Overall Risk
          </div>
          <div className={`text-lg font-bold mt-1 ${hasData ? ovSt.text : "text-gray-400"}`}>{hasData ? ovSt.label : "--"}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Zones Assessed</div>
          <div className="text-xl font-bold mt-1 text-gray-800">{zoneResults.length}</div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Lowest PTV</div>
          <div className="text-xl font-bold mt-1 text-gray-800">{hasData ? Math.min(...zoneResults.map(z => z.ptv)).toFixed(0) : "--"}<span className="text-xs font-normal text-gray-400"> per HSE GEIS2</span></div>
        </div>
        <div className="rounded-xl border p-3.5 bg-gray-50 border-gray-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Surfaces</div>
          <div className="text-xl font-bold mt-1 text-gray-800">{SURFACE_DATABASE.length}</div>
          <div className="text-[10px] text-gray-400">in database</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <PaidDownloadButton hasData={hasData}>
            <button onClick={handleExport} disabled={!hasData || exporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </PaidDownloadButton>
        </div>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Company", value: company, set: setCompany },
              { label: "Site", value: site, set: setSite },
              { label: "Site Manager", value: manager, set: setManager },
              { label: "Assessed By", value: assessedBy, set: setAssessedBy },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Zone entries */}
      <div className="space-y-4">
        {zones.map((zone, idx) => {
          const result = zoneResults.find(r => r.id === zone.id);

          return (
            <div key={zone.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <input type="text" value={zone.name} onChange={e => updateZone(zone.id, { name: e.target.value })} className="text-xs font-bold text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-ebrora outline-none w-32" />
                  {result && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PTV_BAND_CONFIG[result.ptvFinalBand].bg} ${PTV_BAND_CONFIG[result.ptvFinalBand].border} ${PTV_BAND_CONFIG[result.ptvFinalBand].text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${PTV_BAND_CONFIG[result.ptvFinalBand].dot}`} />PTV {result.ptv.toFixed(0)} - {PTV_BAND_CONFIG[result.ptvFinalBand].label}
                    </span>
                  )}
                </div>
                {zones.length > 1 && (
                  <button onClick={() => removeZone(zone.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Surface selector */}
                <SurfaceSelector value={zone.surfaceId} onChange={id => updateZone(zone.id, { surfaceId: id })} />

                {/* Contamination + Footwear */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Contamination</label>
                    <select value={zone.contaminationId} onChange={e => updateZone(zone.id, { contaminationId: e.target.value })} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
                      {CONTAMINATION_TYPES.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.scoreMod >= 0 ? "+" : ""}{c.scoreMod})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Footwear</label>
                    <select value={zone.footwearId} onChange={e => updateZone(zone.id, { footwearId: e.target.value })} className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none transition-colors">
                      {FOOTWEAR_TYPES.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.scoreMod >= 0 ? "+" : ""}{f.scoreMod})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Environment + Human factors */}
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 select-none">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Environment &amp; Human Factors ({zone.envFactors.length + zone.humanFactors.length} selected)
                  </summary>
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ToggleList items={ENVIRONMENT_FACTORS} selected={zone.envFactors} onChange={ids => updateZone(zone.id, { envFactors: ids })} label="Environment Factors" />
                    <ToggleList items={HUMAN_FACTORS} selected={zone.humanFactors} onChange={ids => updateZone(zone.id, { humanFactors: ids })} label="Human Factors" />
                  </div>
                </details>

                {/* Measured PTV (optional) — overrides the derived value */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    Measured PTV (optional)
                    <span className="text-[9px] font-normal text-gray-400 normal-case">From pendulum test (BS 7976) — leave blank to use typical wet PTV</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    value={zone.measuredPTV ?? ""}
                    onChange={e => {
                      const v = e.target.value.trim();
                      updateZone(zone.id, { measuredPTV: v === "" ? null : Math.max(0, Math.min(120, parseFloat(v) || 0)) });
                    }}
                    placeholder="e.g. 36"
                    className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors"
                  />
                </div>

                {/* PTV result panel */}
                {result && (
                  <div className={`px-3 py-2.5 rounded-lg border ${PTV_BAND_CONFIG[result.ptvFinalBand].bg} ${PTV_BAND_CONFIG[result.ptvFinalBand].border}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${PTV_BAND_CONFIG[result.ptvFinalBand].dot}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${PTV_BAND_CONFIG[result.ptvFinalBand].text}`}>
                          {PTV_BAND_CONFIG[result.ptvFinalBand].label}
                        </span>
                      </div>
                      <span className={`text-base font-bold tabular-nums ${PTV_BAND_CONFIG[result.ptvFinalBand].text}`}>
                        PTV {result.ptv.toFixed(0)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 leading-snug">
                      {result.ptvSource === "measured"
                        ? <>Measured PTV from pendulum test. Band: {PTV_BAND_CONFIG[result.ptvBand].rangeText}.</>
                        : <>Derived: surface typical wet PTV {result.surfacePTV} {result.contaminationDelta < 0 ? `${result.contaminationDelta}` : "+0"} contamination = {result.ptv}. Band: {PTV_BAND_CONFIG[result.ptvBand].rangeText}.</>
                      }
                      {result.ptvEscalated && (
                        <span className="block mt-1 font-semibold text-amber-700">
                          ⚠ Escalated from {PTV_BAND_CONFIG[result.ptvBand].label.toLowerCase()} to {PTV_BAND_CONFIG[result.ptvFinalBand].label.toLowerCase()} — {result.aggravatingCount} aggravating factors present.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Additional Notes</label>
                  <input type="text" value={zone.additionalNotes} onChange={e => updateZone(zone.id, { additionalNotes: e.target.value })} placeholder="Location details, observations..." className="w-full mt-1 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors" />
                </div>

                {/* Controls recommendation */}
                {result && (
                  <details className="group">
                    <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 select-none">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      Recommended Controls ({getApplicableControls(result.risk).length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {getApplicableControls(result.risk).map(c => (
                        <div key={c.id} className="px-3 py-2 rounded-lg bg-gray-50 text-sm">
                          <div className="font-medium text-gray-800">{c.name}</div>
                          <div className="text-[10px] text-gray-400">{c.category} - {c.notes}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={addZone} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-ebrora/30 hover:text-ebrora transition-colors">
          + Add Another Zone
        </button>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Slip Risk Assessment</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Select a surface type in the zone above to begin your slip risk assessment. Add multiple zones for different areas of your site. Scored per HSE slip assessment methodology (GEIS2).
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-gray-400 leading-relaxed px-1 space-y-1">
        <p>Assessment methodology per Health and Safety at Work etc. Act 1974, Workplace (Health, Safety and Welfare) Regulations 1992, and HSE GEIS2 (Assessment of Slip Resistance). Risk scoring considers surface roughness, contamination, footwear, environmental conditions, and human factors.</p>
        <p>This tool provides a structured risk assessment framework. Actual slip resistance depends on site-specific conditions, maintenance, and usage patterns. A competent person should validate all assessments. Pendulum Test Values (PTV) should be obtained through on-site testing where practicable.</p>
      </div>
    </div>
  );
}
