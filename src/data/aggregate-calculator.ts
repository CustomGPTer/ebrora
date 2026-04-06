// src/data/aggregate-calculator.ts
// Aggregate / MOT Type 1 Calculator — PAID tier, white-label PDF

export interface AggregateMaterial {
  id: string;
  name: string;
  category: "sub-base" | "aggregate" | "sand" | "gravel" | "recycled" | "specialist";
  compactedDensity: number; // t/m³
  looseDensity: number; // t/m³
  bulkingFactor: number; // loose/compacted ratio
}

export interface AggregateRow {
  id: string;
  materialId: string;
  label: string;
  area: number | null; // m²
  depth: number | null; // m (entered as mm, stored as m)
  overrideDensity: number | null;
  overrideBulking: number | null;
}

export const DEFAULT_WAGON_TONNES = 20;
export const DEFAULT_BULK_BAG_TONNES = 0.85;

export function genId() { return Math.random().toString(36).slice(2, 10); }

export function createEmptyRow(materialId = "mot-type-1"): AggregateRow {
  return { id: genId(), materialId, label: "", area: null, depth: null, overrideDensity: null, overrideBulking: null };
}

// ─── Material Library ────────────────────────────────────────────

export const MATERIALS: AggregateMaterial[] = [
  // Sub-base materials
  { id: "mot-type-1", name: "MOT Type 1", category: "sub-base", compactedDensity: 2.1, looseDensity: 1.68, bulkingFactor: 1.25 },
  { id: "mot-type-2", name: "MOT Type 2", category: "sub-base", compactedDensity: 1.9, looseDensity: 1.52, bulkingFactor: 1.25 },
  { id: "6f2", name: "6F2 (Capping)", category: "sub-base", compactedDensity: 1.9, looseDensity: 1.52, bulkingFactor: 1.25 },
  { id: "6f5", name: "6F5 (Capping)", category: "sub-base", compactedDensity: 2.0, looseDensity: 1.6, bulkingFactor: 1.25 },
  { id: "gsb-type-1", name: "GSB Type 1", category: "sub-base", compactedDensity: 2.1, looseDensity: 1.68, bulkingFactor: 1.25 },
  { id: "capping-layer", name: "Capping Layer (General)", category: "sub-base", compactedDensity: 1.85, looseDensity: 1.48, bulkingFactor: 1.25 },
  { id: "crusher-run", name: "Crusher Run", category: "sub-base", compactedDensity: 2.1, looseDensity: 1.68, bulkingFactor: 1.25 },
  { id: "hoggin", name: "Hoggin", category: "sub-base", compactedDensity: 1.9, looseDensity: 1.52, bulkingFactor: 1.25 },

  // Aggregates
  { id: "20mm-gravel", name: "20mm Gravel", category: "gravel", compactedDensity: 1.75, looseDensity: 1.52, bulkingFactor: 1.15 },
  { id: "40mm-gravel", name: "40mm Gravel", category: "gravel", compactedDensity: 1.75, looseDensity: 1.52, bulkingFactor: 1.15 },
  { id: "10mm-pea-gravel", name: "10mm Pea Gravel", category: "gravel", compactedDensity: 1.65, looseDensity: 1.50, bulkingFactor: 1.10 },
  { id: "pipe-bedding-pea-gravel", name: "Pipe Bedding Pea Gravel", category: "gravel", compactedDensity: 1.65, looseDensity: 1.50, bulkingFactor: 1.10 },
  { id: "ballast", name: "Ballast (All-in)", category: "aggregate", compactedDensity: 1.85, looseDensity: 1.57, bulkingFactor: 1.18 },
  { id: "limestone-dust", name: "Limestone Dust", category: "aggregate", compactedDensity: 1.50, looseDensity: 1.20, bulkingFactor: 1.25 },

  // Sands
  { id: "sharp-sand", name: "Sharp Sand", category: "sand", compactedDensity: 1.75, looseDensity: 1.44, bulkingFactor: 1.22 },
  { id: "building-sand", name: "Building Sand (Soft)", category: "sand", compactedDensity: 1.60, looseDensity: 1.28, bulkingFactor: 1.25 },
  { id: "grit-sand", name: "Grit Sand", category: "sand", compactedDensity: 1.70, looseDensity: 1.36, bulkingFactor: 1.25 },

  // Recycled
  { id: "recycled-6f2", name: "Recycled Aggregate (6F2 equiv.)", category: "recycled", compactedDensity: 1.80, looseDensity: 1.44, bulkingFactor: 1.25 },
  { id: "recycled-type-1", name: "Recycled Type 1", category: "recycled", compactedDensity: 1.95, looseDensity: 1.56, bulkingFactor: 1.25 },
  { id: "as-dug", name: "As-Dug (General Fill)", category: "recycled", compactedDensity: 1.65, looseDensity: 1.32, bulkingFactor: 1.25 },

  // Specialist
  { id: "gabion-stone", name: "Gabion Stone (100–200mm)", category: "specialist", compactedDensity: 1.80, looseDensity: 1.62, bulkingFactor: 1.11 },
  { id: "rip-rap", name: "Rip-Rap / Armourstone", category: "specialist", compactedDensity: 1.85, looseDensity: 1.67, bulkingFactor: 1.11 },
  { id: "filter-media", name: "Filter Media", category: "specialist", compactedDensity: 1.50, looseDensity: 1.35, bulkingFactor: 1.11 },
  { id: "drainage-stone", name: "Drainage Stone (20–40mm)", category: "specialist", compactedDensity: 1.60, looseDensity: 1.44, bulkingFactor: 1.11 },
  { id: "topsoil", name: "Topsoil", category: "specialist", compactedDensity: 1.30, looseDensity: 1.04, bulkingFactor: 1.25 },
  { id: "clean-stone", name: "Clean Stone (40mm Single Size)", category: "aggregate", compactedDensity: 1.60, looseDensity: 1.44, bulkingFactor: 1.11 },
];

export const MATERIAL_CATEGORIES: Record<string, string> = {
  "sub-base": "Sub-base Materials",
  aggregate: "Aggregates",
  sand: "Sands",
  gravel: "Gravels",
  recycled: "Recycled Materials",
  specialist: "Specialist Materials",
};

// ─── Calculations ────────────────────────────────────────────────

export interface AggregateResult {
  compactedM3: number;
  looseM3: number;
  tonnes: number;
  wagonLoads: number;
  bulkBags: number;
}

export function calculateRow(
  row: AggregateRow,
  wagonTonnes: number,
  bulkBagTonnes: number,
): AggregateResult {
  const mat = MATERIALS.find(m => m.id === row.materialId);
  if (!mat || !row.area || !row.depth) return { compactedM3: 0, looseM3: 0, tonnes: 0, wagonLoads: 0, bulkBags: 0 };

  const density = row.overrideDensity ?? mat.compactedDensity;
  const bulking = row.overrideBulking ?? mat.bulkingFactor;
  const depthM = row.depth; // already in metres

  const compactedM3 = row.area * depthM;
  const looseM3 = compactedM3 * bulking;
  const tonnes = compactedM3 * density;
  const wagonLoads = wagonTonnes > 0 ? tonnes / wagonTonnes : 0;
  const bulkBags = bulkBagTonnes > 0 ? tonnes / bulkBagTonnes : 0;

  return { compactedM3, looseM3, tonnes, wagonLoads, bulkBags };
}
