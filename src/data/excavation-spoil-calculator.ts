// src/data/excavation-spoil-calculator.ts
// Excavation & Spoil Calculator — PAID tier, white-label PDF

export interface SoilType {
  id: string;
  name: string;
  bulkingFactor: number;
  densityTPerM3: number; // bank density
}

export interface ExcavationRow {
  id: string;
  label: string;
  length: number | null;
  width: number | null;
  depth: number | null;
  soilTypeId: string;
  overrideDensity: number | null;
  overrideBulking: number | null;
}

export interface ExcavationResult {
  bankM3: number;
  bulkedM3: number;
  tonnes: number;
  wagonLoads: number;
}

export const DEFAULT_WAGON_TONNES = 20;

export function genId() { return Math.random().toString(36).slice(2, 10); }

export const SOIL_TYPES: SoilType[] = [
  { id: "clay", name: "Clay", bulkingFactor: 1.3, densityTPerM3: 1.9 },
  { id: "sand", name: "Sand", bulkingFactor: 1.1, densityTPerM3: 1.8 },
  { id: "gravel", name: "Gravel", bulkingFactor: 1.12, densityTPerM3: 1.85 },
  { id: "topsoil", name: "Topsoil", bulkingFactor: 1.25, densityTPerM3: 1.3 },
  { id: "chalk", name: "Chalk", bulkingFactor: 1.4, densityTPerM3: 1.6 },
  { id: "rock", name: "Rock", bulkingFactor: 1.5, densityTPerM3: 2.5 },
  { id: "made-ground", name: "Made Ground", bulkingFactor: 1.3, densityTPerM3: 1.6 },
  { id: "peat", name: "Peat", bulkingFactor: 1.5, densityTPerM3: 0.8 },
];

export function createEmptyRow(): ExcavationRow {
  return { id: genId(), label: "", length: null, width: null, depth: null, soilTypeId: "clay", overrideDensity: null, overrideBulking: null };
}

export function calculateExcavation(row: ExcavationRow, wagonTonnes: number): ExcavationResult {
  if (!row.length || !row.width || !row.depth) return { bankM3: 0, bulkedM3: 0, tonnes: 0, wagonLoads: 0 };
  const soil = SOIL_TYPES.find(s => s.id === row.soilTypeId);
  if (!soil) return { bankM3: 0, bulkedM3: 0, tonnes: 0, wagonLoads: 0 };

  const density = row.overrideDensity ?? soil.densityTPerM3;
  const bulking = row.overrideBulking ?? soil.bulkingFactor;

  const bankM3 = row.length * row.width * row.depth;
  const bulkedM3 = bankM3 * bulking;
  const tonnes = bankM3 * density;
  const wagonLoads = wagonTonnes > 0 ? tonnes / wagonTonnes : 0;

  return { bankM3, bulkedM3, tonnes, wagonLoads };
}
