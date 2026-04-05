// src/lib/materials-converter/conversion-engine.ts
// Replicates the Excel's conversion logic: input → tonnes → all other units

import type {
  MaterialDefinition,
  MaterialUnit,
  DensityState,
  ConverterAssumptions,
  ConverterRow,
  RowOutputs,
  CategoryTotal,
  MaterialCategory,
} from "@/types/materials-converter";
import { CATEGORY_LABELS } from "@/types/materials-converter";
import { getMaterial } from "@/data/materials-library";

/**
 * Get the effective density for a material given its state.
 */
export function getEffectiveDensity(
  material: MaterialDefinition,
  state: DensityState
): number {
  return state === "Loose" ? material.densityLoose : material.densityCompacted;
}

/**
 * Convert an input quantity + unit into tonnes, using the material's density
 * and the global assumptions for bags/loads.
 *
 * For m² inputs, thickness (mm) is required — the engine computes volume
 * as area × (thickness / 1000) then multiplies by density.
 */
export function convertToTonnes(
  qty: number,
  unit: MaterialUnit,
  density: number,
  assumptions: ConverterAssumptions,
  thicknessMm: number | null
): number {
  switch (unit) {
    case "t":
      return qty;
    case "kg":
      return qty / 1000;
    case "m³":
      return qty * density;
    case "L":
      return (qty / 1000) * density;
    case "Bag":
      return qty * assumptions.bulkBagTonnes;
    case "Load":
      return qty * assumptions.loadTonnes;
    case "m²": {
      const t = thicknessMm ?? assumptions.defaultThicknessMm;
      const volumeM3 = qty * (t / 1000);
      return volumeM3 * density;
    }
    default:
      return 0;
  }
}

/**
 * From tonnes, derive all other output units.
 */
export function tonnesToAllUnits(
  tonnes: number,
  density: number,
  assumptions: ConverterAssumptions,
  thicknessMm: number | null
): Omit<RowOutputs, "cost" | "carbonKg" | "carbonT" | "densityUsed"> {
  const volumeM3 = density > 0 ? tonnes / density : null;
  const massKg = tonnes * 1000;
  const volumeL = volumeM3 !== null ? volumeM3 * 1000 : null;

  const t = thicknessMm ?? assumptions.defaultThicknessMm;
  const areaM2 = density > 0 && t > 0 ? tonnes / (density * (t / 1000)) : null;

  const bulkBags =
    assumptions.bulkBagTonnes > 0 ? tonnes / assumptions.bulkBagTonnes : null;
  const loads =
    assumptions.loadTonnes > 0 ? tonnes / assumptions.loadTonnes : null;

  return { tonnes, volumeM3, massKg, volumeL, areaM2, bulkBags, loads };
}

/**
 * Compute the full outputs for a single converter row.
 */
export function computeRowOutputs(
  row: ConverterRow,
  assumptions: ConverterAssumptions
): RowOutputs {
  const material = getMaterial(row.materialName);

  // No material selected or no quantity entered
  if (!material || row.inputQty === null || row.inputQty === 0) {
    return {
      densityUsed: material
        ? getEffectiveDensity(material, row.state)
        : 0,
      tonnes: null,
      volumeM3: null,
      massKg: null,
      volumeL: null,
      areaM2: null,
      bulkBags: null,
      loads: null,
      cost: null,
      carbonKg: null,
      carbonT: null,
    };
  }

  const density = getEffectiveDensity(material, row.state);
  const tonnes = convertToTonnes(
    row.inputQty,
    row.inputUnit,
    density,
    assumptions,
    row.thicknessMm
  );

  const units = tonnesToAllUnits(tonnes, density, assumptions, row.thicknessMm);

  // Cost: use row override if set, otherwise library default
  const rate = row.ratePer ?? material.defaultRate;
  const cost = rate > 0 ? tonnes * rate : null;

  // Carbon
  const carbonKg = tonnes * material.carbonFactor;
  const carbonT = carbonKg / 1000;

  return {
    densityUsed: density,
    ...units,
    cost,
    carbonKg,
    carbonT,
  };
}

/**
 * Compute category subtotals and grand total from an array of rows + outputs.
 */
export function computeCategoryTotals(
  rows: ConverterRow[],
  outputs: RowOutputs[]
): { categories: CategoryTotal[]; grandTotal: CategoryTotal } {
  const cats: Record<MaterialCategory, CategoryTotal> = {
    AGG: { category: "AGG", label: CATEGORY_LABELS.AGG, tonnes: 0, volumeM3: 0, cost: 0, carbonT: 0 },
    SOIL: { category: "SOIL", label: CATEGORY_LABELS.SOIL, tonnes: 0, volumeM3: 0, cost: 0, carbonT: 0 },
    CONC: { category: "CONC", label: CATEGORY_LABELS.CONC, tonnes: 0, volumeM3: 0, cost: 0, carbonT: 0 },
    TARM: { category: "TARM", label: CATEGORY_LABELS.TARM, tonnes: 0, volumeM3: 0, cost: 0, carbonT: 0 },
  };

  for (let i = 0; i < rows.length; i++) {
    const material = getMaterial(rows[i].materialName);
    const out = outputs[i];
    if (!material || out.tonnes === null) continue;

    const cat = cats[material.category];
    cat.tonnes += out.tonnes ?? 0;
    cat.volumeM3 += out.volumeM3 ?? 0;
    cat.cost += out.cost ?? 0;
    cat.carbonT += out.carbonT ?? 0;
  }

  const grandTotal: CategoryTotal = {
    category: "AGG", // placeholder
    label: "Grand Total",
    tonnes: 0,
    volumeM3: 0,
    cost: 0,
    carbonT: 0,
  };

  const categories = Object.values(cats);
  for (const c of categories) {
    grandTotal.tonnes += c.tonnes;
    grandTotal.volumeM3 += c.volumeM3;
    grandTotal.cost += c.cost;
    grandTotal.carbonT += c.carbonT;
  }

  return { categories, grandTotal };
}

/**
 * Export rows + outputs as CSV string.
 */
export function exportToCSV(
  rows: ConverterRow[],
  outputs: RowOutputs[],
  assumptions: ConverterAssumptions
): string {
  const header = [
    "Material",
    "Category",
    "State",
    "Input Qty",
    "Input Unit",
    "Thickness (mm)",
    "Density Used (t/m³)",
    "Tonnes (t)",
    "Volume (m³)",
    "Mass (kg)",
    "Volume (L)",
    "Area (m²)",
    "Bulk Bags (#)",
    "Loads (#)",
    `Rate (${assumptions.currency}/t)`,
    `Cost (${assumptions.currency})`,
    "Carbon (kgCO₂e)",
    "Carbon (tCO₂e)",
  ].join(",");

  const lines = rows.map((row, i) => {
    const out = outputs[i];
    const material = getMaterial(row.materialName);
    return [
      `"${row.materialName}"`,
      material?.category ?? "",
      row.state,
      row.inputQty ?? "",
      row.inputUnit,
      row.thicknessMm ?? "",
      out.densityUsed,
      fmt(out.tonnes),
      fmt(out.volumeM3),
      fmt(out.massKg),
      fmt(out.volumeL),
      fmt(out.areaM2),
      fmt(out.bulkBags),
      fmt(out.loads),
      row.ratePer ?? material?.defaultRate ?? "",
      fmt(out.cost),
      fmt(out.carbonKg),
      fmt(out.carbonT),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

function fmt(v: number | null): string {
  if (v === null) return "";
  return Number.isFinite(v) ? v.toFixed(4) : "";
}

/**
 * Generate a unique row ID.
 */
export function generateRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
