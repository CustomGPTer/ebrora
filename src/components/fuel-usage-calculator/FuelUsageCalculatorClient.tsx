// src/components/fuel-usage-calculator/FuelUsageCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  MACHINES,
  EQUIPMENT_TYPES,
  DUTY_CYCLES,
  CARBON_FACTORS,
  DEFAULT_FUEL_COST,
  type Machine,
  type DutyCycleKey,
} from "@/data/fuel-usage-calculator";

// ─── Types ───────────────────────────────────────────────────────
interface PlantRow {
  id: string;
  machineIndex: number | null;
  dutyCycle: DutyCycleKey;
  hours: number | null;
  qty: number;
  fuelTypeOverride: string | null;
  rateOverride: number | null;
}

function genId() { return Math.random().toString(36).slice(2, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

function createRow(): PlantRow {
  return { id: genId(), machineIndex: null, dutyCycle: "fuel75", hours: null, qty: 1, fuelTypeOverride: null, rateOverride: null };
}

// ─── Helpers ─────────────────────────────────────────────────────
function fmtNum(v: number | null, dp = 1): string {
  if (v === null || !Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function fmtCost(v: number | null): string {
  if (v === null || !Number.isFinite(v) || v === 0) return "—";
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Machine Search Combobox ─────────────────────────────────────
function MachineCombobox({
  value,
  onChange,
  typeFilter,
}: {
  value: number | null;
  onChange: (idx: number | null) => void;
  typeFilter: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MACHINES.map((m, i) => ({ m, i })).filter(({ m }) => {
      if (typeFilter && m.type !== typeFilter) return false;
      if (!q) return true;
      return `${m.make} ${m.model} ${m.type} ${m.size}`.toLowerCase().includes(q);
    }).slice(0, 80);
  }, [search, typeFilter]);

  const selected = value !== null ? MACHINES[value] : null;
  const displayText = selected ? `${selected.make} ${selected.model}` : "";

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? search : displayText}
        placeholder="Search make, model, type…"
        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors"
        onFocus={() => { setOpen(true); setSearch(""); }}
        onChange={(e) => setSearch(e.target.value)}
      />
      {open && (
        <div className="absolute z-[200] mt-1 w-80 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">No machines found</div>
          ) : (
            filtered.map(({ m, i }) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light transition-colors ${i === value ? "bg-ebrora-light font-medium text-ebrora-dark" : "text-gray-700"}`}
                onClick={() => { onChange(i); setOpen(false); setSearch(""); }}
              >
                <div className="flex items-center justify-between">
                  <span>{m.isGeneric ? "⚙ " : ""}<strong>{m.make}</strong> {m.model}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{m.size}t · {m.engineKw} kW</span>
                </div>
                <div className="text-[11px] text-gray-400">{m.type} · {m.fuelType} · {m.fuel75} L/h @75%</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────
async function exportPDF(
  header: { project: string; site: string; assessedBy: string; date: string },
  rows: PlantRow[],
  costPerLitre: number,
  shiftHours: number,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("l", "mm", "a4"); // landscape for wide table
  const W = 297;
  const H = 210;
  const M = 12;
  const CW = W - M * 2;
  let y = M;

  // Title
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FUEL USAGE CALCULATION", M, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Plant fuel planning estimate — ebrora.com/tools/fuel-usage-calculator", M, 17);
  doc.setFontSize(7);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, W - M - 45, 17);
  y = 30;
  doc.setTextColor(0, 0, 0);

  // Header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Project:", M, y); doc.setFont("helvetica", "normal"); doc.text(header.project || "—", M + 20, y);
  doc.setFont("helvetica", "bold"); doc.text("Site:", M + CW / 3, y); doc.setFont("helvetica", "normal"); doc.text(header.site || "—", M + CW / 3 + 14, y);
  doc.setFont("helvetica", "bold"); doc.text("Prepared by:", M + CW * 2 / 3, y); doc.setFont("helvetica", "normal"); doc.text(header.assessedBy || "—", M + CW * 2 / 3 + 28, y);
  y += 4;
  doc.setFont("helvetica", "bold"); doc.text("Date:", M, y); doc.setFont("helvetica", "normal"); doc.text(header.date || "—", M + 20, y);
  doc.setFont("helvetica", "bold"); doc.text("Fuel cost:", M + CW / 3, y); doc.setFont("helvetica", "normal"); doc.text(`£${costPerLitre.toFixed(2)}/L`, M + CW / 3 + 22, y);
  y += 6;

  // Table header
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 3;
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y - 2.5, CW, 5.5, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  const cols = [0, 8, 50, 80, 100, 118, 130, 142, 155, 168, 182, 200, 220, 245];
  const headers = ["#", "Machine", "Type", "Size", "kW", "Duty", "Qty", "Hrs", "L/h", "L/day", "L/wk", "Cost/day", "Cost/wk", "kgCO2e/day"];
  headers.forEach((h, i) => doc.text(h, M + cols[i], y + 1));
  y += 5;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  let totalLitresDay = 0, totalLitresWk = 0, totalCostDay = 0, totalCostWk = 0, totalCarbonDay = 0;
  const activeRows = rows.filter(r => r.machineIndex !== null && r.hours);

  activeRows.forEach((r, idx) => {
    if (y > H - 25) { doc.addPage(); y = M; }
    const m = MACHINES[r.machineIndex!];
    const rate = r.rateOverride ?? m[r.dutyCycle];
    const hrs = r.hours!;
    const litresDay = rate * hrs * r.qty;
    const litresWk = litresDay * 5;
    const ft = r.fuelTypeOverride || m.fuelType;
    const cf = CARBON_FACTORS[ft] || 2.68;
    const costDay = litresDay * costPerLitre;
    const costWk = litresWk * costPerLitre;
    const carbonDay = litresDay * cf;

    totalLitresDay += litresDay;
    totalLitresWk += litresWk;
    totalCostDay += costDay;
    totalCostWk += costWk;
    totalCarbonDay += carbonDay;

    const duty = DUTY_CYCLES.find(d => d.key === r.dutyCycle)?.label || "";
    const vals = [
      String(idx + 1), `${m.make} ${m.model}`, m.type, `${m.size}`, `${m.engineKw}`,
      duty, String(r.qty), String(hrs), fmtNum(rate), fmtNum(litresDay),
      fmtNum(litresWk), fmtCost(costDay), fmtCost(costWk), fmtNum(carbonDay, 1),
    ];
    vals.forEach((v, i) => doc.text(v, M + cols[i], y));
    y += 4;
  });

  // Totals
  y += 1;
  doc.setDrawColor(27, 87, 69);
  doc.line(M, y, W - M, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TOTALS", M, y);
  doc.text(fmtNum(totalLitresDay), M + cols[9], y);
  doc.text(fmtNum(totalLitresWk), M + cols[10], y);
  doc.text(fmtCost(totalCostDay), M + cols[11], y);
  doc.text(fmtCost(totalCostWk), M + cols[12], y);
  doc.text(fmtNum(totalCarbonDay, 1), M + cols[13], y);

  // Footer
  y = H - 12;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Fuel rates are planning estimates based on OEM data. Real-world usage varies with load factor, idling, ambient temperature, and operator behaviour.", M, y);
  y += 2.5;
  doc.text("Weekly figures assume 5 working days. Carbon factors: UK Gov GHG Conversion Factors 2024.", M, y);

  doc.save(`fuel-usage-calculation-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function FuelUsageCalculatorClient() {
  const [rows, setRows] = useState<PlantRow[]>([createRow()]);
  const [costPerLitre, setCostPerLitre] = useState(DEFAULT_FUEL_COST);
  const [shiftHours, setShiftHours] = useState(10);
  const [typeFilter, setTypeFilter] = useState("");
  const [project, setProject] = useState("");
  const [site, setSite] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Calculations
  const computed = useMemo(() => {
    return rows.map(r => {
      if (r.machineIndex === null || !r.hours) return null;
      const m = MACHINES[r.machineIndex];
      const rate = r.rateOverride ?? m[r.dutyCycle];
      const hrs = r.hours;
      const litresDay = rate * hrs * r.qty;
      const litresWk = litresDay * 5;
      const ft = r.fuelTypeOverride || m.fuelType;
      const cf = CARBON_FACTORS[ft] || 2.68;
      return {
        machine: m, rate, litresDay, litresWk,
        costDay: litresDay * costPerLitre,
        costWk: litresWk * costPerLitre,
        carbonDay: litresDay * cf,
        carbonWk: litresDay * cf * 5,
        fuelType: ft,
      };
    });
  }, [rows, costPerLitre]);

  const totals = useMemo(() => {
    const active = computed.filter(Boolean) as NonNullable<typeof computed[0]>[];
    return {
      litresDay: active.reduce((s, c) => s + c.litresDay, 0),
      litresWk: active.reduce((s, c) => s + c.litresWk, 0),
      costDay: active.reduce((s, c) => s + c.costDay, 0),
      costWk: active.reduce((s, c) => s + c.costWk, 0),
      carbonDay: active.reduce((s, c) => s + c.carbonDay, 0),
      carbonWk: active.reduce((s, c) => s + c.carbonWk, 0),
      machines: active.length,
    };
  }, [computed]);

  const addRow = useCallback(() => setRows(p => [...p, createRow()]), []);
  const removeRow = useCallback((id: string) => {
    setRows(p => { if (p.length <= 1) return [createRow()]; return p.filter(r => r.id !== id); });
  }, []);
  const updateRow = useCallback((id: string, patch: Partial<PlantRow>) => {
    setRows(p => p.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...patch };
      // Reset manual override when machine or duty cycle changes
      if (('machineIndex' in patch || 'dutyCycle' in patch) && !('rateOverride' in patch)) {
        updated.rateOverride = null;
      }
      return updated;
    }));
  }, []);
  const clearAll = useCallback(() => {
    setRows([createRow()]); setProject(""); setSite(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);
  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ project, site, assessedBy, date: assessDate }, rows, costPerLitre, shiftHours); }
    finally { setExporting(false); }
  }, [project, site, assessedBy, assessDate, rows, costPerLitre, shiftHours]);

  const hasData = totals.machines > 0;

  return (
    <div className="space-y-5">
      {/* ── Dashboard ─────────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { label: "Daily Fuel", value: `${fmtNum(totals.litresDay)} L`, sub: `${fmtNum(totals.litresWk)} L/wk`, color: "bg-orange-50 border-orange-200 text-orange-800", dot: "bg-orange-400" },
            { label: "Daily Cost", value: fmtCost(totals.costDay), sub: `${fmtCost(totals.costWk)}/wk`, color: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-400" },
            { label: "Daily CO₂e", value: `${fmtNum(totals.carbonDay, 0)} kg`, sub: `${fmtNum(totals.carbonWk / 1000, 2)} t/wk`, color: "bg-sky-50 border-sky-200 text-sky-800", dot: "bg-sky-400" },
            { label: "Machines", value: String(totals.machines), sub: `${rows.reduce((s, r) => s + r.qty, 0)} units total`, color: "bg-gray-50 border-gray-200 text-gray-800", dot: "bg-gray-400" },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide">{c.label}</span>
              </div>
              <div className="text-xl font-bold">{c.value}</div>
              <div className="text-xs opacity-70 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Header & Settings ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg border-none outline-none">
          <option value="">All types</option>
          {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!hasData || exporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${hasData ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Project</label>
            <input type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="Project name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site / location"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prepared By</label>
            <input type="text" value={assessedBy} onChange={e => setAssessedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Fuel Cost (£/L)</label>
            <input type="number" step="0.01" value={costPerLitre} onChange={e => setCostPerLitre(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Working Days/Wk</label>
            <input type="number" step="1" value={5} readOnly
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 outline-none" />
          </div>
        </div>
      )}

      {/* ── Desktop Table ──────────────────────────────────── */}
      <div className="hidden lg:block border border-gray-200 rounded-xl overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-64">Machine</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-28">Type</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-16">Duty</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-12">Qty</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-14">Hrs</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">L/h</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">L/day</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">L/wk</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">£/day</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">kgCO₂e</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Fuel</th>
              <th className="px-2 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => {
              const c = computed[idx];
              const m = row.machineIndex !== null ? MACHINES[row.machineIndex] : null;
              return (
                <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-2 py-1.5">
                    <MachineCombobox value={row.machineIndex} onChange={v => updateRow(row.id, { machineIndex: v })} typeFilter={typeFilter} />
                  </td>
                  <td className="px-2 py-1.5 text-center text-xs text-gray-500 truncate">{m?.type || "—"}</td>
                  <td className="px-2 py-1.5">
                    <select value={row.dutyCycle} onChange={e => updateRow(row.id, { dutyCycle: e.target.value as DutyCycleKey })}
                      className="w-full px-1 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none">
                      {DUTY_CYCLES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min={1} max={20} value={row.qty} onChange={e => updateRow(row.id, { qty: parseInt(e.target.value) || 1 })}
                      className="w-full px-1 py-1.5 text-sm text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" step="0.5" min={0} max={24} value={row.hours ?? ""} placeholder="0"
                      onChange={e => updateRow(row.id, { hours: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      className="w-full px-1 py-1.5 text-sm text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none tabular-nums" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" step="0.1" value={row.rateOverride ?? ""}
                      placeholder={m ? String(m[row.dutyCycle]) : ""}
                      onChange={e => updateRow(row.id, { rateOverride: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      className="w-full px-1 py-1.5 text-xs text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums" />
                  </td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-medium text-gray-800">{c ? fmtNum(c.litresDay) : "—"}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{c ? fmtNum(c.litresWk) : "—"}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-medium text-gray-800">{c ? fmtCost(c.costDay) : "—"}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{c ? fmtNum(c.carbonDay, 0) : "—"}</td>
                  <td className="px-2 py-1.5">
                    <select value={row.fuelTypeOverride || m?.fuelType || "Diesel"}
                      onChange={e => updateRow(row.id, { fuelTypeOverride: e.target.value })}
                      className="w-full px-1 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-blue-50/40 focus:border-ebrora outline-none">
                      <option value="Diesel">Diesel</option>
                      <option value="HVO">HVO</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <button onClick={() => removeRow(row.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ───────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, idx) => {
          const c = computed[idx];
          const m = row.machineIndex !== null ? MACHINES[row.machineIndex] : null;
          return (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <MachineCombobox value={row.machineIndex} onChange={v => updateRow(row.id, { machineIndex: v })} typeFilter={typeFilter} />
                </div>
                <button onClick={() => removeRow(row.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {m && <p className="text-[11px] text-gray-400">{m.type} · {m.size}t · {m.engineKw} kW · {m.fuelType}</p>}
              <div className="grid grid-cols-4 gap-2">
                <div><label className="block text-[10px] text-gray-400 mb-0.5">Duty</label>
                  <select value={row.dutyCycle} onChange={e => updateRow(row.id, { dutyCycle: e.target.value as DutyCycleKey })}
                    className="w-full px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40">{DUTY_CYCLES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
                </div>
                <div><label className="block text-[10px] text-gray-400 mb-0.5">L/h</label>
                  <input type="number" step="0.1" value={row.rateOverride ?? ""} placeholder={m ? String(m[row.dutyCycle]) : ""}
                    onChange={e => updateRow(row.id, { rateOverride: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" />
                </div>
                <div><label className="block text-[10px] text-gray-400 mb-0.5">Qty</label>
                  <input type="number" min={1} value={row.qty} onChange={e => updateRow(row.id, { qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" />
                </div>
                <div><label className="block text-[10px] text-gray-400 mb-0.5">Hours</label>
                  <input type="number" step="0.5" value={row.hours ?? ""} placeholder="0"
                    onChange={e => updateRow(row.id, { hours: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums" />
                </div>
              </div>
              {c && (
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 bg-gray-50 rounded-lg p-2.5 text-xs">
                  <div><span className="text-gray-400">L/day</span><div className="font-bold text-gray-800 tabular-nums">{fmtNum(c.litresDay)}</div></div>
                  <div><span className="text-gray-400">£/day</span><div className="font-bold text-gray-800 tabular-nums">{fmtCost(c.costDay)}</div></div>
                  <div><span className="text-gray-400">kgCO₂e</span><div className="font-medium text-gray-700 tabular-nums">{fmtNum(c.carbonDay, 0)}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add Row ────────────────────────────────────────── */}
      <button onClick={addRow}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add Machine
      </button>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Fuel rates are planning estimates based on OEM data. Real-world usage varies with load factor, idling, ambient temperature, and operator behaviour.
          Carbon factors: UK Gov GHG Conversion Factors 2024 (Diesel 2.68, HVO 0.195 kgCO₂e/L). Weekly figures assume 5 working days.
        </p>
        <a href="https://ebrora.gumroad.com/l/fuel-usage-calculator" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">Download the offline Excel version →</a>
      </div>
    </div>
  );
}
