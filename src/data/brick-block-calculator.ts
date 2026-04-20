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
  limeKgPerM3: number; // kg hydrated lime per m³ mortar (0 = cement-only mix)
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
  limeBags: number; // 25kg bags hydrated lime (0 if cement-only mix)
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

// ─── Mortar Types ────────────────────────────────────────────────
// Proportions are BS 5628 cement:lime:sand by VOLUME.
// Material quantities per m³ of mixed mortar follow published references
// (Brick Development Association; Ibstock Technical Note TN03; NHBC).
// Hydrated lime is essential for the stated designations — do NOT substitute
// plasticiser without re-specifying the mix. Lime density assumed ~500 kg/m³ loose.

export const MORTAR_TYPES: MortarType[] = [
  { id: "m2",  name: "M2 (1:1:5½)",   designation: "M2",  cementKgPerM3: 220, limeKgPerM3: 110, sandTonnesPerM3: 1.45, description: "General purpose — most blockwork" },
  { id: "m4",  name: "M4 (1:1:6)",    designation: "M4",  cementKgPerM3: 210, limeKgPerM3: 105, sandTonnesPerM3: 1.50, description: "Internal walls, sheltered locations" },
  { id: "m6",  name: "M6 (1:½:4½)",  designation: "M6",  cementKgPerM3: 290, limeKgPerM3: 75,  sandTonnesPerM3: 1.40, description: "Strong mortar — engineering brickwork" },
  { id: "m12", name: "M12 (1:⅓:3)",  designation: "M12", cementKgPerM3: 395, limeKgPerM3: 65,  sandTonnesPerM3: 1.30, description: "Very strong — retaining walls, below DPC" },
];

// Mortar usage per m² (approximate, includes bed and perp joints, 10mm joint width).
// ── Bricks: ~0.023 m³/m² for standard 215×65×102.5 in stretcher bond.
//     (Theoretical 0.018 m³/m² for solid bricks; 0.023 allows for frog filling
//     and modest wastage. Add a further 5–10% when ordering.)
// ── Blocks: scales with block thickness because bed-joint cross-section
//     (thickness × 10 mm) grows with wall thickness. Derived from joint geometry
//     on a 450×225 mm coursing (10 units/m²):
//         bed joints: 0.010 × t × (1/0.225)       m³/m²  (where t is thickness in m)
//         perp joints: 0.010 × t × 0.215 × 10     m³/m²
//     → mortarPerM2 ≈ 0.066 × t_metres
//     So 100 mm = 0.0066; 140 mm = 0.0092; 190 mm = 0.0125; 215 mm = 0.0142.
export function getMortarPerM2(unit: MasonryUnit): number {
  if (unit.category === "brick") return 0.023;
  const thicknessM = unit.widthMm / 1000;
  return 0.066 * thicknessM;
}

export function createOpening(): Opening {
  return { id: genId(), label: "", width: null, height: null };
}

export function createEmptyWallRow(): WallRow {
  return { id: genId(), label: "", unitId: "standard-metric", mortarId: "m2", wallLength: null, wallHeight: null, openings: [], overrideUnitsPerM2: null };
}

export function calculateWall(row: WallRow): WallResult {
  const empty: WallResult = { grossArea: 0, openingArea: 0, netArea: 0, unitCount: 0, mortarM3: 0, cementBags: 0, limeBags: 0, sandTonnes: 0 };
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
  const limeKg = mortarM3 * mortar.limeKgPerM3;
  const limeBags = limeKg > 0 ? Math.ceil(limeKg / 25) : 0;
  const sandTonnes = mortarM3 * mortar.sandTonnesPerM3;

  return { grossArea, openingArea, netArea, unitCount, mortarM3, cementBags, limeBags, sandTonnes };
}
