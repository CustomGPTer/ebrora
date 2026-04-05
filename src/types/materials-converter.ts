// src/types/materials-converter.ts

/** Material category codes matching Excel Library */
export type MaterialCategory = "AGG" | "SOIL" | "CONC" | "TARM";

/** Unit group determines which input units are available per material */
export type UnitGroup = "AGG" | "SOIL" | "CONC" | "TARM" | "LIQUID" | "PRECAST";

/** All possible input/output units */
export type MaterialUnit = "t" | "m³" | "kg" | "L" | "m²" | "Bag" | "Load";

/** Density state */
export type DensityState = "Loose" | "Compacted";

/** A single material definition from the library */
export interface MaterialDefinition {
  name: string;
  category: MaterialCategory;
  densityLoose: number;
  densityCompacted: number;
  carbonFactor: number; // kgCO₂e per tonne
  carbonSource: string;
  carbonScope: string;
  defaultRate: number; // £/t
  notes: string;
  unitGroup: UnitGroup;
}

/** Allowed units per unit group */
export const UNIT_GROUP_UNITS: Record<UnitGroup, MaterialUnit[]> = {
  AGG: ["t", "m³", "kg", "Bag", "Load"],
  SOIL: ["t", "m³", "kg", "Bag", "Load", "m²"],
  CONC: ["t", "m³", "kg", "Load"],
  TARM: ["t", "m³", "kg", "m²", "Load"],
  LIQUID: ["t", "kg", "L"],
  PRECAST: ["t", "kg"],
};

/** User-editable global assumptions */
export interface ConverterAssumptions {
  bulkBagTonnes: number; // tonnes per bulk bag (default 0.85)
  loadTonnes: number; // tonnes per load (default 19)
  defaultThicknessMm: number; // default thickness in mm for m² (default 150)
  currency: string; // display currency symbol (default "£")
}

export const DEFAULT_ASSUMPTIONS: ConverterAssumptions = {
  bulkBagTonnes: 0.85,
  loadTonnes: 19,
  defaultThicknessMm: 150,
  currency: "£",
};

/** A single row in the converter take-off */
export interface ConverterRow {
  id: string;
  materialName: string;
  state: DensityState;
  inputQty: number | null;
  inputUnit: MaterialUnit;
  thicknessMm: number | null; // only used when inputUnit === "m²"
  ratePer: number | null; // £/t override (null = use library default)
}

/** Computed outputs for a single row */
export interface RowOutputs {
  densityUsed: number;
  tonnes: number | null;
  volumeM3: number | null;
  massKg: number | null;
  volumeL: number | null;
  areaM2: number | null;
  bulkBags: number | null;
  loads: number | null;
  cost: number | null;
  carbonKg: number | null;
  carbonT: number | null;
}

/** Category subtotals */
export interface CategoryTotal {
  category: MaterialCategory;
  label: string;
  tonnes: number;
  volumeM3: number;
  cost: number;
  carbonT: number;
}

/** Column visibility toggles */
export interface ColumnVisibility {
  tonnes: boolean;
  volumeM3: boolean;
  massKg: boolean;
  volumeL: boolean;
  areaM2: boolean;
  bulkBags: boolean;
  loads: boolean;
  cost: boolean;
  carbon: boolean;
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  tonnes: true,
  volumeM3: true,
  massKg: false,
  volumeL: false,
  areaM2: false,
  bulkBags: true,
  loads: true,
  cost: true,
  carbon: true,
};

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  AGG: "Aggregates",
  SOIL: "Soils & Muck",
  CONC: "Concrete",
  TARM: "Asphalt & Surfacing",
};
