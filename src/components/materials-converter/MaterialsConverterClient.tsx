// src/components/materials-converter/MaterialsConverterClient.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type {
  ConverterRow,
  ConverterAssumptions,
  RowOutputs,
  ColumnVisibility,
  MaterialUnit,
  DensityState,
  MaterialCategory,
  MaterialDefinition,
} from "@/types/materials-converter";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COLUMN_VISIBILITY,
  UNIT_GROUP_UNITS,
  CATEGORY_LABELS,
} from "@/types/materials-converter";
import {
  getMaterial,
  getGroupedMaterials,
} from "@/data/materials-library";
import {
  computeRowOutputs,
  computeCategoryTotals,
  generateRowId,
  exportToCSV,
} from "@/lib/materials-converter/conversion-engine";

// ─── Helpers ─────────────────────────────────────────────────────
function fmtNum(v: number | null, dp = 2): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) < 0.0001) return "—";
  return v.toLocaleString("en-GB", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtCurrency(v: number | null, symbol = "£"): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${symbol}${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CATEGORY_COLORS: Record<MaterialCategory, { bg: string; text: string; border: string; dot: string }> = {
  AGG: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-400" },
  SOIL: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-400" },
  CONC: { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200", dot: "bg-slate-400" },
  TARM: { bg: "bg-zinc-100", text: "text-zinc-800", border: "border-zinc-300", dot: "bg-zinc-500" },
};

function createEmptyRow(): ConverterRow {
  return {
    id: generateRowId(),
    materialName: "",
    state: "Compacted",
    inputQty: null,
    inputUnit: "t",
    thicknessMm: null,
    ratePer: null,
  };
}

// ─── Material Search Combobox ────────────────────────────────────
function MaterialCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grouped = useMemo(() => getGroupedMaterials(), []);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result: Record<string, MaterialDefinition[]> = {};
    for (const [cat, mats] of Object.entries(grouped)) {
      const matches = mats.filter((m) => m.name.toLowerCase().includes(q));
      if (matches.length > 0) result[cat] = matches;
    }
    return result;
  }, [search, grouped]);

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? search : value}
        placeholder="Search materials…"
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none transition-colors truncate"
        onFocus={() => {
          setOpen(true);
          setSearch("");
        }}
        onChange={(e) => setSearch(e.target.value)}
      />
      {open && (
        <div className="absolute z-[200] mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
          {Object.entries(filtered).length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">
              No materials found
            </div>
          ) : (
            Object.entries(filtered).map(([cat, mats]) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 sticky top-0">
                  {CATEGORY_LABELS[cat as MaterialCategory]}
                </div>
                {mats.map((m) => (
                  <button
                    key={m.name}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light transition-colors ${
                      m.name === value ? "bg-ebrora-light font-medium text-ebrora-dark" : "text-gray-700"
                    }`}
                    onClick={() => {
                      onChange(m.name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function MaterialsConverterClient() {
  const [rows, setRows] = useState<ConverterRow[]>([createEmptyRow()]);
  const [assumptions, setAssumptions] = useState<ConverterAssumptions>(DEFAULT_ASSUMPTIONS);
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);
  const [showSettings, setShowSettings] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  // Compute outputs for all rows
  const outputs: RowOutputs[] = useMemo(
    () => rows.map((r) => computeRowOutputs(r, assumptions)),
    [rows, assumptions]
  );

  // Compute totals
  const { categories, grandTotal } = useMemo(
    () => computeCategoryTotals(rows, outputs),
    [rows, outputs]
  );

  // Row operations
  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return [createEmptyRow()];
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<ConverterRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // When material changes, reset unit to first allowed unit
        if (patch.materialName && patch.materialName !== r.materialName) {
          const mat = getMaterial(patch.materialName);
          if (mat) {
            const allowed = UNIT_GROUP_UNITS[mat.unitGroup];
            if (!allowed.includes(updated.inputUnit)) {
              updated.inputUnit = allowed[0];
            }
            updated.ratePer = null; // reset rate to library default
          }
        }
        return updated;
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setRows([createEmptyRow()]);
  }, []);

  // CSV export
  const handleExport = useCallback(() => {
    const csv = exportToCSV(rows, outputs, assumptions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materials-takeoff-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, outputs, assumptions]);

  // Active output column count for table layout
  const colKeys: (keyof ColumnVisibility)[] = [
    "tonnes", "volumeM3", "massKg", "volumeL", "areaM2", "bulkBags", "loads", "cost", "carbon",
  ];
  const visibleCols = colKeys.filter((k) => columns[k]);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {categories
          .filter((c) => c.tonnes > 0)
          .map((c) => {
            const colors = CATEGORY_COLORS[c.category];
            return (
              <div
                key={c.category}
                className={`${colors.bg} ${colors.border} border rounded-xl p-5 transition-all`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className={`text-[13px] font-bold uppercase tracking-wide ${colors.text}`}>
                    {c.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900">
                    {fmtNum(c.tonnes, 1)}<span className="text-sm font-normal text-gray-500 ml-1">t</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {fmtNum(c.volumeM3, 1)} m³ · {fmtCurrency(c.cost, assumptions.currency)} · {fmtNum(c.carbonT, 3)} tCO₂e
                  </div>
                </div>
              </div>
            );
          })}
        {/* Grand Total */}
        {grandTotal.tonnes > 0 && (
          <div className="col-span-2 lg:col-span-1 bg-ebrora-light border border-ebrora-mid rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ebrora" />
              <span className="text-[13px] font-bold uppercase tracking-wide text-ebrora-dark">
                Grand Total
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {fmtNum(grandTotal.tonnes, 1)}<span className="text-sm font-normal text-gray-500 ml-1">t</span>
            </div>
            <div className="text-sm text-gray-500">
              {fmtNum(grandTotal.volumeM3, 1)} m³ · {fmtCurrency(grandTotal.cost, assumptions.currency)} · {fmtNum(grandTotal.carbonT, 3)} tCO₂e
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <button
          onClick={() => setShowColumns(!showColumns)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          Columns
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ebrora-dark bg-ebrora-light rounded-lg hover:bg-ebrora-mid transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* ── Settings Panel ─────────────────────────────────── */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Bulk Bag (t/bag)
            </label>
            <input
              type="number"
              step="0.01"
              value={assumptions.bulkBagTonnes}
              onChange={(e) =>
                setAssumptions({ ...assumptions, bulkBagTonnes: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Load (t/load)
            </label>
            <input
              type="number"
              step="0.5"
              value={assumptions.loadTonnes}
              onChange={(e) =>
                setAssumptions({ ...assumptions, loadTonnes: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Default Thickness (mm)
            </label>
            <input
              type="number"
              step="5"
              value={assumptions.defaultThicknessMm}
              onChange={(e) =>
                setAssumptions({ ...assumptions, defaultThicknessMm: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              maxLength={3}
              value={assumptions.currency}
              onChange={(e) => setAssumptions({ ...assumptions, currency: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora focus:ring-1 focus:ring-ebrora/20 outline-none"
            />
          </div>
        </div>
      )}

      {/* ── Column Toggles ─────────────────────────────────── */}
      {showColumns && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
          {([
            ["tonnes", "Tonnes"],
            ["volumeM3", "m³"],
            ["massKg", "kg"],
            ["volumeL", "Litres"],
            ["areaM2", "m²"],
            ["bulkBags", "Bags"],
            ["loads", "Loads"],
            ["cost", "Cost"],
            ["carbon", "Carbon"],
          ] as [keyof ColumnVisibility, string][]).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={columns[key]}
                onChange={() => setColumns({ ...columns, [key]: !columns[key] })}
                className="w-3.5 h-3.5 rounded border-gray-300 text-ebrora focus:ring-ebrora/30"
              />
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      )}

      {/* ── Desktop Table ──────────────────────────────────── */}
      <div className="hidden lg:block border border-gray-200 rounded-xl overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-56">Material</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-24">State</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-20">Qty</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-16">Unit</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-16">mm</th>
              {columns.tonnes && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Tonnes</th>}
              {columns.volumeM3 && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">m³</th>}
              {columns.massKg && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">kg</th>}
              {columns.volumeL && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Litres</th>}
              {columns.areaM2 && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">m²</th>}
              {columns.bulkBags && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Bags</th>}
              {columns.loads && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Loads</th>}
              {columns.cost && (
                <th className="px-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 w-16">
                  {assumptions.currency}/t
                </th>
              )}
              {columns.cost && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Cost</th>}
              {columns.carbon && <th className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">tCO₂e</th>}
              <th className="px-2 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => {
              const material = getMaterial(row.materialName);
              const out = outputs[idx];
              const allowedUnits = material ? UNIT_GROUP_UNITS[material.unitGroup] : (["t", "m³", "kg"] as MaterialUnit[]);
              const catColor = material ? CATEGORY_COLORS[material.category] : null;
              const showThickness = row.inputUnit === "m²";
              const effectiveRate = row.ratePer ?? material?.defaultRate ?? null;

              return (
                <tr
                  key={row.id}
                  className="group hover:bg-blue-50/30 transition-colors"
                >
                  {/* Material */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {catColor && <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot} shrink-0`} />}
                      <MaterialCombobox
                        value={row.materialName}
                        onChange={(name) => updateRow(row.id, { materialName: name })}
                      />
                    </div>
                  </td>
                  {/* State */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.state}
                      onChange={(e) => updateRow(row.id, { state: e.target.value as DensityState })}
                      className="w-full px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none"
                    >
                      <option value="Loose">Loose</option>
                      <option value="Compacted">Compacted</option>
                    </select>
                  </td>
                  {/* Qty */}
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="any"
                      value={row.inputQty ?? ""}
                      placeholder="0"
                      onChange={(e) =>
                        updateRow(row.id, {
                          inputQty: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums"
                    />
                  </td>
                  {/* Unit */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.inputUnit}
                      onChange={(e) => updateRow(row.id, { inputUnit: e.target.value as MaterialUnit })}
                      className="w-full px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none"
                    >
                      {allowedUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  {/* Thickness */}
                  <td className="px-2 py-1.5">
                    {showThickness ? (
                      <input
                        type="number"
                        step="5"
                        value={row.thicknessMm ?? ""}
                        placeholder={`${assumptions.defaultThicknessMm}`}
                        onChange={(e) =>
                          updateRow(row.id, {
                            thicknessMm: e.target.value === "" ? null : parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs block text-center">—</span>
                    )}
                  </td>
                  {/* Output columns */}
                  {columns.tonnes && <td className="px-2 py-1.5 text-center tabular-nums font-medium text-gray-800">{fmtNum(out.tonnes)}</td>}
                  {columns.volumeM3 && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.volumeM3)}</td>}
                  {columns.massKg && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.massKg, 0)}</td>}
                  {columns.volumeL && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.volumeL, 0)}</td>}
                  {columns.areaM2 && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.areaM2)}</td>}
                  {columns.bulkBags && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.bulkBags)}</td>}
                  {columns.loads && <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{fmtNum(out.loads)}</td>}
                  {/* Rate */}
                  {columns.cost && (
                    <td className="px-1 py-1.5 w-16">
                      <input
                        type="number"
                        step="0.5"
                        value={row.ratePer ?? ""}
                        placeholder={material?.defaultRate?.toString() ?? ""}
                        onChange={(e) =>
                          updateRow(row.id, {
                            ratePer: e.target.value === "" ? null : parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-1 py-1.5 text-xs text-center border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none tabular-nums"
                      />
                    </td>
                  )}
                  {/* Cost */}
                  {columns.cost && (
                    <td className="px-2 py-1.5 text-center tabular-nums font-medium text-gray-800">
                      {fmtCurrency(out.cost, assumptions.currency)}
                    </td>
                  )}
                  {/* Carbon */}
                  {columns.carbon && (
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-600 relative group/carbon">
                      {fmtNum(out.carbonT, 4)}
                      {material && material.carbonSource && out.carbonT !== null && (
                        <div className="absolute hidden group-hover/carbon:block bottom-full right-0 mb-1 w-56 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg z-[200] leading-relaxed">
                          <div className="font-bold mb-0.5">{material.carbonSource}</div>
                          {material.carbonScope && <div className="text-gray-400">Scope: {material.carbonScope}</div>}
                          <div className="text-gray-400">Factor: {material.carbonFactor} kgCO₂e/t</div>
                        </div>
                      )}
                    </td>
                  )}
                  {/* Delete */}
                  <td className="px-1 py-1.5">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove row"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
          const material = getMaterial(row.materialName);
          const out = outputs[idx];
          const allowedUnits = material ? UNIT_GROUP_UNITS[material.unitGroup] : (["t", "m³", "kg"] as MaterialUnit[]);
          const catColor = material ? CATEGORY_COLORS[material.category] : null;
          const showThickness = row.inputUnit === "m²";

          return (
            <div
              key={row.id}
              className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <MaterialCombobox
                    value={row.materialName}
                    onChange={(name) => updateRow(row.id, { materialName: name })}
                  />
                </div>
                <button
                  onClick={() => removeRow(row.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Inputs row */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">State</label>
                  <select
                    value={row.state}
                    onChange={(e) => updateRow(row.id, { state: e.target.value as DensityState })}
                    className="w-full px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40"
                  >
                    <option value="Loose">Loose</option>
                    <option value="Compacted">Comp.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Qty</label>
                  <input
                    type="number"
                    step="any"
                    value={row.inputQty ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateRow(row.id, {
                        inputQty: e.target.value === "" ? null : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Unit</label>
                  <select
                    value={row.inputUnit}
                    onChange={(e) => updateRow(row.id, { inputUnit: e.target.value as MaterialUnit })}
                    className="w-full px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-blue-50/40"
                  >
                    {allowedUnits.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">
                    {showThickness ? "mm" : `${assumptions.currency}/t`}
                  </label>
                  {showThickness ? (
                    <input
                      type="number"
                      step="5"
                      value={row.thicknessMm ?? ""}
                      placeholder={`${assumptions.defaultThicknessMm}`}
                      onChange={(e) =>
                        updateRow(row.id, {
                          thicknessMm: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.5"
                      value={row.ratePer ?? ""}
                      placeholder={material?.defaultRate?.toString() ?? ""}
                      onChange={(e) =>
                        updateRow(row.id, {
                          ratePer: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-blue-50/40 tabular-nums"
                    />
                  )}
                </div>
              </div>

              {/* Outputs */}
              {out.tonnes !== null && (
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 bg-gray-50 rounded-lg p-2.5 text-xs">
                  {columns.tonnes && (
                    <div>
                      <span className="text-gray-400">Tonnes</span>
                      <div className="font-bold text-gray-800 tabular-nums">{fmtNum(out.tonnes)}</div>
                    </div>
                  )}
                  {columns.volumeM3 && (
                    <div>
                      <span className="text-gray-400">m³</span>
                      <div className="font-medium text-gray-700 tabular-nums">{fmtNum(out.volumeM3)}</div>
                    </div>
                  )}
                  {columns.loads && (
                    <div>
                      <span className="text-gray-400">Loads</span>
                      <div className="font-medium text-gray-700 tabular-nums">{fmtNum(out.loads)}</div>
                    </div>
                  )}
                  {columns.bulkBags && (
                    <div>
                      <span className="text-gray-400">Bags</span>
                      <div className="font-medium text-gray-700 tabular-nums">{fmtNum(out.bulkBags)}</div>
                    </div>
                  )}
                  {columns.cost && (
                    <div>
                      <span className="text-gray-400">Cost</span>
                      <div className="font-bold text-gray-800 tabular-nums">{fmtCurrency(out.cost, assumptions.currency)}</div>
                    </div>
                  )}
                  {columns.carbon && (
                    <div>
                      <span className="text-gray-400">tCO₂e</span>
                      <div className="font-medium text-gray-700 tabular-nums">{fmtNum(out.carbonT, 4)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add Row Button ─────────────────────────────────── */}
      <button
        onClick={addRow}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-ebrora hover:text-ebrora transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Material Row
      </button>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Carbon factors: ICE v3/v4 (Circular Ecology) via Climatiq + UK Gov GHG CF 2024. All values are decision-support guidance — verify quantities, densities, costs and carbon factors before use.
        </p>
        <a
          href="https://ebrora.gumroad.com/l/civil-engineering-materials-converter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors"
        >
          Download the offline Excel version →
        </a>
      </div>
    </div>
  );
}
