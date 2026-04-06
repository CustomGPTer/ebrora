// src/components/plant-pre-use-checksheet/PlantPreUseChecksheetClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { PLANT_TYPES, DAYS, genId, createFleetItem, type PlantType, type FleetItem, type CheckMark } from "@/data/plant-pre-use-checksheet";

// ─── Helpers ─────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

function isExpiryWarning(dateStr: string): "expired" | "soon" | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  if (d < now) return "expired";
  const diff = d.getTime() - now.getTime();
  if (diff < 30 * 24 * 60 * 60 * 1000) return "soon";
  return null;
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; weekCommencing: string },
  fleet: FleetItem[],
  plantTypes: PlantType[],
  allChecks: Record<string, string[]>,
  allMarks: Record<string, CheckMark>,
  blankMode: boolean,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const ML = 8;
  const MR = 8;
  const CW = W - ML - MR;

  // Cover page for fleet mode (>1 item)
  if (fleet.length > 1) {
    // Header bar
    doc.setFillColor(27, 87, 69);
    doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("PLANT PRE-USE INSPECTION CHECK SHEETS", ML, 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Fleet Summary — ebrora.com/tools/plant-pre-use-checksheet", ML, 17);
    doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, W - MR - 40, 17);

    let y = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Site:", ML, y); doc.setFont("helvetica", "normal"); doc.text(header.site || "—", ML + 14, y);
    doc.setFont("helvetica", "bold"); doc.text("Site Manager:", ML + CW / 2, y); doc.setFont("helvetica", "normal"); doc.text(header.manager || "—", ML + CW / 2 + 28, y);
    y += 5;
    doc.setFont("helvetica", "bold"); doc.text("Week Commencing:", ML, y); doc.setFont("helvetica", "normal"); doc.text(header.weekCommencing || "—", ML + 35, y);
    y += 5;
    doc.setFont("helvetica", "bold"); doc.text("Fleet:", ML, y); doc.setFont("helvetica", "normal"); doc.text(`${fleet.length} items`, ML + 14, y);
    y += 8;

    // Fleet summary table
    doc.setFillColor(245, 245, 245);
    doc.rect(ML, y - 2, CW, 5, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    const fCols = [0, 8, 70, 110, 150];
    ["#", "Plant Type", "Plant No.", "Operator", "CPCS/NPORS"].forEach((h, i) => doc.text(h, ML + fCols[i], y + 1));
    y += 5.5;
    doc.setFont("helvetica", "normal");
    fleet.forEach((item, i) => {
      const pt = plantTypes.find(p => p.id === item.plantTypeId);
      doc.text(String(i + 1), ML + fCols[0], y);
      doc.text(pt?.name || "—", ML + fCols[1], y);
      doc.text(item.plantNumber || "—", ML + fCols[2], y);
      doc.text(item.operatorName || "—", ML + fCols[3], y);
      doc.text(item.cpcsNumber || "—", ML + fCols[4], y);
      y += 4;
    });

    doc.addPage();
  }

  // One page per fleet item
  fleet.forEach((item, fleetIdx) => {
    if (fleetIdx > 0) doc.addPage();
    const pt = plantTypes.find(p => p.id === item.plantTypeId);
    if (!pt) return;
    const checks = allChecks[item.id] || pt.checks;
    const marks = allMarks[item.id] || {};

    let y = 0;

    // Header bar
    const docRef = `PCS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    doc.setFillColor(27, 87, 69);
    doc.rect(0, 0, W, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PLANT PRE-USE INSPECTION CHECK SHEET", ML, 8);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Ref: ${docRef} | Rev 0 | HSE / PUWER Compliant — ebrora.com`, ML, 15);
    y = 24;
    doc.setTextColor(0, 0, 0);

    // Info fields with underlines for empty values
    doc.setFontSize(7);
    const drawPF = (label: string, value: string, x: number, fy: number, lineW: number) => {
      doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
      const lw = doc.getTextWidth(label) + 2;
      if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
      else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); }
    };
    drawPF("PLANT TYPE:", pt.name, ML, y, 0);
    drawPF("Plant No:", item.plantNumber, ML + CW / 2, y, 35);
    y += 4;
    drawPF("Operator:", item.operatorName, ML, y, 40);
    // Week commencing + auto-calculated week number
    const wcDate = header.weekCommencing ? new Date(header.weekCommencing) : null;
    const weekNo = wcDate ? Math.ceil((((wcDate.getTime() - new Date(wcDate.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(wcDate.getFullYear(), 0, 1).getDay() + 1) / 7) : 0;
    drawPF("Week Commencing:", header.weekCommencing ? `${header.weekCommencing} (Wk ${weekNo})` : "", ML + CW / 2, y, 30);
    y += 4;
    drawPF("CPCS/NPORS:", item.cpcsNumber, ML, y, 35);
    drawPF("Expiry:", item.cpcsExpiry, ML + CW / 2, y, 30);
    y += 4;
    drawPF("Site:", header.site, ML, y, 40);
    drawPF("Site Manager:", header.manager, ML + CW / 2, y, 35);
    y += 5;

    // Check grid
    const numCol = 8; // # column width
    const checkColW = 80; // check text column width
    const dayColW = (CW - numCol - checkColW) / 7;

    // Header row
    doc.setFillColor(240, 240, 240);
    doc.rect(ML, y - 2, CW, 5, "F");
    doc.setDrawColor(200, 200, 200);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.text("No.", ML + 1, y + 1);
    doc.text("Daily Pre-Use Check Item", ML + numCol + 1, y + 1);
    DAYS.forEach((d, i) => {
      const dx = ML + numCol + checkColW + i * dayColW;
      doc.text(d, dx + dayColW / 2 - 2, y + 1);
    });
    y += 5;

    // Check rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    checks.forEach((check, ci) => {
      if (y > 270) { doc.addPage(); y = ML; }

      // Alternate row bg
      if (ci % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(ML, y - 2, CW, 5.5, "F");
      }

      doc.setTextColor(0, 0, 0);
      doc.text(String(ci + 1), ML + 1, y + 0.5);

      // Truncate check text to fit
      const maxW = checkColW - 2;
      let txt = check;
      while (doc.getTextWidth(txt) > maxW && txt.length > 10) {
        txt = txt.slice(0, -1);
      }
      if (txt !== check) txt += "...";
      doc.text(txt, ML + numCol + 1, y + 0.5);

      // Day cells
      DAYS.forEach((_, di) => {
        const dx = ML + numCol + checkColW + di * dayColW;
        doc.setDrawColor(220, 220, 220);
        doc.rect(dx, y - 2, dayColW, 5.5);

        if (!blankMode) {
          const key = `${ci}-${di}`;
          const mark = marks[key];
          if (mark === "pass") { doc.setTextColor(22, 163, 74); doc.text("Y", dx + dayColW / 2 - 1, y + 0.5); }
          else if (mark === "fail") { doc.setTextColor(220, 38, 38); doc.text("X", dx + dayColW / 2 - 1, y + 0.5); }
          else if (mark === "na") { doc.setTextColor(120, 120, 120); doc.text("N/A", dx + dayColW / 2 - 3, y + 0.5); }
        }
      });
      y += 5.5;
    });

    // Defect section
    y += 3;
    if (y > 255) { doc.addPage(); y = ML; }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("DEFECT DETAILS / COMMENTS — If X is placed in any box above, complete below AND inform Supervisor / Foreman IMMEDIATELY", ML, y);
    y += 4;
    for (let i = 0; i < 4; i++) {
      doc.setDrawColor(200, 200, 200);
      doc.line(ML, y, W - MR, y);
      y += 5;
    }

    // Declaration
    y += 2;
    if (y > 265) { doc.addPage(); y = ML; }
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("OPERATOR DECLARATION", ML, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text("I declare that I have carried out the above checks at the frequency specified and have reported all faults and defects to my Supervisor / Foreman.", ML, y);
    y += 5;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Operator Name:", ML, y); doc.line(ML + 28, y, ML + 80, y);
    doc.text("Signature:", ML + CW / 2, y); doc.line(ML + CW / 2 + 22, y, W - MR, y);
    y += 6;
    doc.text("Date:", ML, y); doc.line(ML + 12, y, ML + 50, y);
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(4.5);
    doc.setTextColor(150, 150, 150);
    doc.text("This check sheet is a daily pre-use inspection record. It does not replace manufacturer-specified maintenance schedules or thorough examinations under PUWER/LOLER.", ML, 293);
    doc.text(`ebrora.com — Page ${p} of ${pageCount}`, W - MR - 28, 293);
  }

  const suffix = blankMode ? "blank" : "completed";
  doc.save(`plant-pre-use-checksheet-${suffix}-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function PlantPreUseChecksheetClient() {
  const [mode, setMode] = useState<"single" | "fleet">("single");
  const [fleet, setFleet] = useState<FleetItem[]>([createFleetItem("tracked-360-excavator")]);
  const [activeItemId, setActiveItemId] = useState(fleet[0].id);
  const [customChecks, setCustomChecks] = useState<Record<string, string[]>>({});
  const [marks, setMarks] = useState<Record<string, CheckMark>>({});
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [weekCommencing, setWeekCommencing] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newCheckText, setNewCheckText] = useState("");

  const activeItem = fleet.find(f => f.id === activeItemId) || fleet[0];
  const activePlantType = PLANT_TYPES.find(p => p.id === activeItem.plantTypeId);

  // Get checks for active item (base + custom, minus deleted)
  const activeChecks = useMemo(() => {
    if (!activePlantType) return [];
    return customChecks[activeItem.id] || [...activePlantType.checks];
  }, [activePlantType, activeItem.id, customChecks]);

  const activeMarks = marks[activeItem.id] || {};

  // Update fleet item
  const updateFleetItem = useCallback((id: string, patch: Partial<FleetItem>) => {
    setFleet(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }, []);

  // Toggle mark
  const toggleMark = useCallback((checkIdx: number, dayIdx: number, val: "pass" | "fail" | "na") => {
    const key = `${checkIdx}-${dayIdx}`;
    setMarks(prev => {
      const itemMarks = { ...(prev[activeItem.id] || {}) };
      itemMarks[key] = itemMarks[key] === val ? null : val;
      return { ...prev, [activeItem.id]: itemMarks };
    });
  }, [activeItem.id]);

  // Add custom check
  const addCustomCheck = useCallback(() => {
    if (!newCheckText.trim()) return;
    setCustomChecks(prev => {
      const current = prev[activeItem.id] || [...(activePlantType?.checks || [])];
      return { ...prev, [activeItem.id]: [...current, newCheckText.trim()] };
    });
    setNewCheckText("");
  }, [activeItem.id, activePlantType, newCheckText]);

  // Remove check item
  const removeCheck = useCallback((idx: number) => {
    setCustomChecks(prev => {
      const current = prev[activeItem.id] || [...(activePlantType?.checks || [])];
      return { ...prev, [activeItem.id]: current.filter((_, i) => i !== idx) };
    });
  }, [activeItem.id, activePlantType]);

  // Fleet operations
  const addFleetItem = useCallback(() => {
    const newItem = createFleetItem("tracked-360-excavator");
    setFleet(prev => [...prev, newItem]);
    setActiveItemId(newItem.id);
  }, []);

  const removeFleetItem = useCallback((id: string) => {
    setFleet(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(f => f.id !== id);
      if (activeItemId === id) setActiveItemId(next[0].id);
      return next;
    });
  }, [activeItemId]);

  // Switch to fleet mode
  const switchMode = useCallback((m: "single" | "fleet") => {
    setMode(m);
    if (m === "single" && fleet.length > 1) {
      // Keep only first
      setFleet([fleet[0]]);
      setActiveItemId(fleet[0].id);
    }
  }, [fleet]);

  const clearAll = useCallback(() => {
    const fresh = [createFleetItem("tracked-360-excavator")];
    setFleet(fresh);
    setActiveItemId(fresh[0].id);
    setMarks({});
    setCustomChecks({});
    setSite(""); setManager(""); setWeekCommencing(todayISO());
  }, []);

  // All checks map for PDF
  const allChecksMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    fleet.forEach(item => {
      const pt = PLANT_TYPES.find(p => p.id === item.plantTypeId);
      map[item.id] = customChecks[item.id] || (pt ? [...pt.checks] : []);
    });
    return map;
  }, [fleet, customChecks]);

  const handleExport = useCallback(async (blank: boolean) => {
    setExporting(true);
    try { await exportPDF({ site, manager, weekCommencing }, fleet, PLANT_TYPES, allChecksMap, blank ? {} : marks, blank); }
    finally { setExporting(false); }
  }, [site, manager, weekCommencing, fleet, allChecksMap, marks]);

  const expiryStatus = isExpiryWarning(activeItem.cpcsExpiry);

  return (
    <div className="space-y-5">
      {/* ── Mode Toggle & Toolbar ──────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => switchMode("single")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "single" ? "bg-ebrora text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            Single
          </button>
          <button onClick={() => switchMode("fleet")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "fleet" ? "bg-ebrora text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            Fleet Mode
          </button>
        </div>

        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>

        <div className="flex-1" />

        <button onClick={() => handleExport(true)} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          Blank PDF
        </button>
        <button onClick={() => handleExport(false)} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ebrora-dark bg-ebrora-light rounded-lg hover:bg-ebrora-mid transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Week Commencing</label>
            <input type="date" value={weekCommencing} onChange={e => setWeekCommencing(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Fleet Tabs (fleet mode) ────────────────────── */}
      {mode === "fleet" && (
        <div className="flex flex-wrap items-center gap-2">
          {fleet.map((item, i) => {
            const pt = PLANT_TYPES.find(p => p.id === item.plantTypeId);
            return (
              <button key={item.id}
                onClick={() => setActiveItemId(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  activeItemId === item.id
                    ? "bg-ebrora-light border-ebrora/30 text-ebrora-dark"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                <span>{i + 1}. {pt?.name.slice(0, 20) || "Select"}</span>
                {item.plantNumber && <span className="text-[10px] text-gray-400">({item.plantNumber})</span>}
                {fleet.length > 1 && (
                  <span onClick={e => { e.stopPropagation(); removeFleetItem(item.id); }}
                    className="ml-1 text-gray-300 hover:text-red-500">×</span>
                )}
              </button>
            );
          })}
          <button onClick={addFleetItem}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 border border-dashed border-gray-300 rounded-lg hover:border-ebrora hover:text-ebrora transition-colors">
            + Add Machine
          </button>
        </div>
      )}

      {/* ── Plant Type & Operator Info ──────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Plant Type</label>
            <select value={activeItem.plantTypeId}
              onChange={e => updateFleetItem(activeItem.id, { plantTypeId: e.target.value })}
              className={`w-full px-2.5 py-2 text-sm border rounded-lg outline-none transition-colors ${
                activeItem.plantTypeId ? "border-ebrora/30 bg-ebrora-light/40" : "border-gray-200 bg-blue-50/40"
              }`}>
              {PLANT_TYPES.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Plant Number</label>
            <input type="text" value={activeItem.plantNumber}
              onChange={e => updateFleetItem(activeItem.id, { plantNumber: e.target.value })}
              placeholder="e.g. EX-001 (optional)"
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Operator Name</label>
            <input type="text" value={activeItem.operatorName}
              onChange={e => updateFleetItem(activeItem.id, { operatorName: e.target.value })}
              placeholder="Optional"
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">CPCS/NPORS Card No.</label>
            <input type="text" value={activeItem.cpcsNumber}
              onChange={e => updateFleetItem(activeItem.id, { cpcsNumber: e.target.value })}
              placeholder="Optional"
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Card Expiry Date</label>
            <input type="date" value={activeItem.cpcsExpiry}
              onChange={e => updateFleetItem(activeItem.id, { cpcsExpiry: e.target.value })}
              className={`w-full px-2.5 py-2 text-sm border rounded-lg outline-none ${
                expiryStatus === "expired" ? "border-red-400 bg-red-50 text-red-800" :
                expiryStatus === "soon" ? "border-amber-400 bg-amber-50 text-amber-800" :
                "border-gray-200 bg-blue-50/40"
              }`} />
            {expiryStatus === "expired" && (
              <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ Card has expired</p>
            )}
            {expiryStatus === "soon" && (
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">⚠️ Card expires within 30 days</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Check Grid ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 w-8">#</th>
              <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 min-w-[200px]">Check Item</th>
              {DAYS.map(d => (
                <th key={d} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 w-12">{d}</th>
              ))}
              <th className="px-1 py-2 w-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeChecks.map((check, ci) => (
              <tr key={ci} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-2 py-1.5 text-gray-400 tabular-nums">{ci + 1}</td>
                <td className="px-2 py-1.5 text-gray-700 text-xs leading-tight">{check}</td>
                {DAYS.map((_, di) => {
                  const key = `${ci}-${di}`;
                  const val = activeMarks[key];
                  return (
                    <td key={di} className="px-1 py-1 text-center">
                      <div className="flex gap-0.5 justify-center">
                        <button onClick={() => toggleMark(ci, di, "pass")}
                          className={`w-5 h-5 text-[9px] font-bold rounded transition-colors ${
                            val === "pass" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-emerald-100"
                          }`}>✓</button>
                        <button onClick={() => toggleMark(ci, di, "fail")}
                          className={`w-5 h-5 text-[9px] font-bold rounded transition-colors ${
                            val === "fail" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-100"
                          }`}>✗</button>
                        <button onClick={() => toggleMark(ci, di, "na")}
                          className={`w-5 h-5 text-[8px] font-medium rounded transition-colors ${
                            val === "na" ? "bg-gray-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}>—</button>
                      </div>
                    </td>
                  );
                })}
                <td className="px-1 py-1">
                  <button onClick={() => removeCheck(ci)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add custom check */}
        <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
          <input type="text" value={newCheckText} onChange={e => setNewCheckText(e.target.value)}
            placeholder="Add custom check item…"
            onKeyDown={e => e.key === "Enter" && addCustomCheck()}
            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          <button onClick={addCustomCheck} disabled={!newCheckText.trim()}
            className="px-3 py-1.5 text-xs font-medium text-ebrora bg-ebrora-light rounded-lg hover:bg-ebrora-mid disabled:opacity-40 transition-colors">
            Add
          </button>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Pre-use inspection check sheets based on PUWER 1998, LOLER 1998, and manufacturer guidance.
          {activePlantType && ` ${activePlantType.name}: ${activeChecks.length} check items.`}
          {mode === "fleet" && ` Fleet: ${fleet.length} machines.`}
          {" "}Download blank PDFs for site printing or complete digitally.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools →
        </a>
      </div>
    </div>
  );
}
