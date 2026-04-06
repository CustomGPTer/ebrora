// src/data/brick-block-calculator.ts
// Brick & Block Quantity Calculator — PAID, white-label

export interface MasonryUnit {
  id: string;
  name: string;
  category: "brick" | "block";
  lengthMm: number;
  heightMm: number;
  widthMm: number; // thickness
  unitsPerM2: number; // including 10mm mortar joints
  description: string;
}

export interface MortarType {
  id: string;
  name: string;
  designation: string;
  cementKgPerM3: number; // kg cement per m³ mortar
  sandTonnesPerM3: number; // tonnes sand per m³ mortar
  description: string;
}

export interface WallRow {
  id: string;
  label: string;
  unitId: string;
  mortarId: string;
  wallLength: number | null; // m
  wallHeight: number | null; // m
  openings: Opening[];
  overrideUnitsPerM2: number | null;
}

export interface Opening {
  id: string;
  label: string;
  width: number | null; // m
  height: number | null; // m
}

export interface WallResult {
  grossArea: number;
  openingArea: number;
  netArea: number;
  unitCount: number;
  mortarM3: number;
  cementBags: number; // 25kg bags
  sandTonnes: number;
}

export function genId() { return Math.random().toString(36).slice(2, 10); }

// ─── Masonry Unit Database ───────────────────────────────────────

export const MASONRY_UNITS: MasonryUnit[] = [
  // Bricks
  { id: "standard-metric", name: "Standard Metric Brick", category: "brick", lengthMm: 215, heightMm: 65, widthMm: 102.5, unitsPerM2: 60, description: "Standard UK facing/common brick" },
  { id: "modular-brick", name: "Modular Brick", category: "brick", lengthMm: 190, heightMm: 90, widthMm: 90, unitsPerM2: 50, description: "Modular format brick" },
  { id: "engineering-a", name: "Engineering Brick Class A", category: "brick", lengthMm: 215, heightMm: 65, widthMm: 102.5, unitsPerM2: 60, description: "High strength, low absorption (Staffordshire Blue)" },
  { id: "engineering-b", name: "Engineering Brick Class B", category: "brick", lengthMm: 215, heightMm: 65, widthMm: 102.5, unitsPerM2: 60, description: "Medium strength engineering brick (Accrington)" },

  // Concrete common blocks
  { id: "block-100", name: "Concrete Block 100mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 100, unitsPerM2: 10, description: "Standard 100mm concrete common block" },
  { id: "block-140", name: "Concrete Block 140mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 140, unitsPerM2: 10, description: "Standard 140mm concrete common block" },
  { id: "block-190", name: "Concrete Block 190mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 190, unitsPerM2: 10, description: "Standard 190mm concrete common block" },
  { id: "block-215", name: "Concrete Block 215mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 215, unitsPerM2: 10, description: "Standard 215mm concrete common block" },

  // Dense blocks
  { id: "dense-100", name: "Dense Block 100mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 100, unitsPerM2: 10, description: "Dense concrete block 100mm (7.3N/mm²)" },
  { id: "dense-140", name: "Dense Block 140mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 140, unitsPerM2: 10, description: "Dense concrete block 140mm (7.3N/mm²)" },
  { id: "dense-190", name: "Dense Block 190mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 190, unitsPerM2: 10, description: "Dense concrete block 190mm (7.3N/mm²)" },

  // Lightweight blocks
  { id: "lightweight-100", name: "Lightweight Block 100mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 100, unitsPerM2: 10, description: "Thermalite/aircrete 100mm (3.6N/mm²)" },
  { id: "lightweight-140", name: "Lightweight Block 140mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 140, unitsPerM2: 10, description: "Thermalite/aircrete 140mm (3.6N/mm²)" },
  { id: "lightweight-190", name: "Lightweight Block 190mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 190, unitsPerM2: 10, description: "Thermalite/aircrete 190mm (3.6N/mm²)" },
  { id: "lightweight-215", name: "Lightweight Block 215mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 215, unitsPerM2: 10, description: "Thermalite/aircrete 215mm (3.6N/mm²)" },

  // Fair-face
  { id: "fairface-100", name: "Fair-Face Block 100mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 100, unitsPerM2: 10, description: "Smooth or textured fair-face 100mm" },
  { id: "fairface-140", name: "Fair-Face Block 140mm", category: "block", lengthMm: 440, heightMm: 215, widthMm: 140, unitsPerM2: 10, description: "Smooth or textured fair-face 140mm" },
];

// ─── Mortar Types ────────────────────────────────────────────────

export const MORTAR_TYPES: MortarType[] = [
  { id: "m2", name: "M2 (1:1:5½)", designation: "M2", cementKgPerM3: 200, sandTonnesPerM3: 1.45, description: "General purpose — most blockwork" },
  { id: "m4", name: "M4 (1:1:6)", designation: "M4", cementKgPerM3: 170, sandTonnesPerM3: 1.50, description: "Internal walls, sheltered locations" },
  { id: "m6", name: "M6 (1:½:4½)", designation: "M6", cementKgPerM3: 250, sandTonnesPerM3: 1.40, description: "Strong mortar — engineering brickwork" },
  { id: "m12", name: "M12 (1:⅓:3)", designation: "M12", cementKgPerM3: 330, sandTonnesPerM3: 1.30, description: "Very strong — retaining walls, below DPC" },
];

// Mortar usage per m² (approximate, includes bed and perp joints)
// Bricks: ~0.023 m³ mortar per m² stretcher bond
// Blocks: ~0.007 m³ mortar per m² (440×215 blocks, 10mm joints)
export function getMortarPerM2(unit: MasonryUnit): number {
  return unit.category === "brick" ? 0.023 : 0.007;
}

export function createOpening(): Opening {
  return { id: genId(), label: "", width: null, height: null };
}

export function createEmptyWallRow(): WallRow {
  return { id: genId(), label: "", unitId: "standard-metric", mortarId: "m2", wallLength: null, wallHeight: null, openings: [], overrideUnitsPerM2: null };
}

export function calculateWall(row: WallRow): WallResult {
  const empty: WallResult = { grossArea: 0, openingArea: 0, netArea: 0, unitCount: 0, mortarM3: 0, cementBags: 0, sandTonnes: 0 };
  if (!row.wallLength || !row.wallHeight) return empty;

  const unit = MASONRY_UNITS.find(u => u.id === row.unitId);
  const mortar = MORTAR_TYPES.find(m => m.id === row.mortarId);
  if (!unit || !mortar) return empty;

  const grossArea = row.wallLength * row.wallHeight;
  const openingArea = row.openings.reduce((sum, o) => sum + ((o.width ?? 0) * (o.height ?? 0)), 0);
  const netArea = Math.max(grossArea - openingArea, 0);

  const unitsPerM2 = row.overrideUnitsPerM2 ?? unit.unitsPerM2;
  const unitCount = Math.ceil(netArea * unitsPerM2);

  const mortarPerM2 = getMortarPerM2(unit);
  const mortarM3 = netArea * mortarPerM2;
  const cementKg = mortarM3 * mortar.cementKgPerM3;
  const cementBags = Math.ceil(cementKg / 25);
  const sandTonnes = mortarM3 * mortar.sandTonnesPerM3;

  return { grossArea, openingArea, netArea, unitCount, mortarM3, cementBags, sandTonnes };
}
