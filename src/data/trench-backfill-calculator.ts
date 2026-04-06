// src/data/trench-backfill-calculator.ts
// Trench Backfill & Pipe Bedding Calculator — PAID, white-label
// Zone calculations per HAUC/SROH specification

export interface BackfillMaterial {
  id: string;
  name: string;
  densityTPerM3: number;
}

export interface TrenchRow {
  id: string;
  label: string;
  trenchLength: number | null; // m
  trenchWidth: number | null; // m
  trenchDepth: number | null; // m
  pipeOD: number | null; // mm (outside diameter)
  beddingMaterialId: string;
  sideFillMaterialId: string;
  backfillMaterialId: string;
  backfillReuse: boolean; // re-use excavated material for backfill
  overrideBeddingDepth: number | null; // mm
  overrideSideFillHeight: number | null; // mm above pipe crown
}

export interface TrenchZoneResult {
  beddingM3: number;
  sideFillM3: number;
  backfillM3: number;
  totalTrenchM3: number;
  pipeVolumeM3: number;
  beddingTonnes: number;
  sideFillTonnes: number;
  backfillTonnes: number;
  importTonnes: number; // total imported material
  exportTonnes: number; // excavated material not re-used
}

export const BACKFILL_MATERIALS: BackfillMaterial[] = [
  { id: "pea-gravel", name: "Pea Gravel (10mm)", densityTPerM3: 1.65 },
  { id: "sharp-sand", name: "Sharp Sand", densityTPerM3: 1.75 },
  { id: "granular-surround", name: "Granular Surround (Class S)", densityTPerM3: 1.70 },
  { id: "mot-type-1", name: "MOT Type 1", densityTPerM3: 2.10 },
  { id: "6f2", name: "6F2 Capping", densityTPerM3: 1.90 },
  { id: "as-dug", name: "As-Dug / Excavated Material", densityTPerM3: 1.65 },
  { id: "imported-fill", name: "Imported General Fill", densityTPerM3: 1.80 },
  { id: "foamed-concrete", name: "Foamed Concrete", densityTPerM3: 1.20 },
];

// HAUC/SROH default zone depths
export const DEFAULT_BEDDING_DEPTH_MM = 100; // below pipe invert
export const DEFAULT_SIDEFILL_ABOVE_CROWN_MM = 100; // above pipe crown

export function genId() { return Math.random().toString(36).slice(2, 10); }

export function createEmptyTrenchRow(): TrenchRow {
  return {
    id: genId(), label: "", trenchLength: null, trenchWidth: null, trenchDepth: null,
    pipeOD: null, beddingMaterialId: "pea-gravel", sideFillMaterialId: "pea-gravel",
    backfillMaterialId: "as-dug", backfillReuse: true,
    overrideBeddingDepth: null, overrideSideFillHeight: null,
  };
}

export function calculateTrenchZones(row: TrenchRow): TrenchZoneResult {
  const empty: TrenchZoneResult = { beddingM3: 0, sideFillM3: 0, backfillM3: 0, totalTrenchM3: 0, pipeVolumeM3: 0, beddingTonnes: 0, sideFillTonnes: 0, backfillTonnes: 0, importTonnes: 0, exportTonnes: 0 };

  if (!row.trenchLength || !row.trenchWidth || !row.trenchDepth || !row.pipeOD) return empty;

  const L = row.trenchLength;
  const W = row.trenchWidth;
  const D = row.trenchDepth;
  const pipeODm = row.pipeOD / 1000;

  const beddingDepthM = (row.overrideBeddingDepth ?? DEFAULT_BEDDING_DEPTH_MM) / 1000;
  const sideFillAboveCrownM = (row.overrideSideFillHeight ?? DEFAULT_SIDEFILL_ABOVE_CROWN_MM) / 1000;

  // Total trench volume
  const totalTrenchM3 = L * W * D;

  // Pipe volume (cylinder)
  const pipeRadius = pipeODm / 2;
  const pipeVolumeM3 = Math.PI * pipeRadius * pipeRadius * L;

  // Zone 1: Bedding (below pipe invert)
  const beddingM3 = L * W * beddingDepthM;

  // Zone 2: Side fill (from pipe invert to sideFillAboveCrown above pipe crown)
  // Height = pipeOD + sideFillAboveCrown
  const sideFillHeight = pipeODm + sideFillAboveCrownM;
  const sideFillTotalM3 = L * W * sideFillHeight;
  // Subtract the pipe volume from side fill zone
  const sideFillM3 = Math.max(sideFillTotalM3 - pipeVolumeM3, 0);

  // Zone 3: Backfill (above side fill zone to surface)
  const backfillHeight = D - beddingDepthM - sideFillHeight;
  const backfillM3 = Math.max(L * W * backfillHeight, 0);

  // Material lookups
  const beddingMat = BACKFILL_MATERIALS.find(m => m.id === row.beddingMaterialId);
  const sideFillMat = BACKFILL_MATERIALS.find(m => m.id === row.sideFillMaterialId);
  const backfillMat = BACKFILL_MATERIALS.find(m => m.id === row.backfillMaterialId);

  const beddingTonnes = beddingM3 * (beddingMat?.densityTPerM3 ?? 1.65);
  const sideFillTonnes = sideFillM3 * (sideFillMat?.densityTPerM3 ?? 1.65);
  const backfillTonnes = backfillM3 * (backfillMat?.densityTPerM3 ?? 1.65);

  // Import/export: if backfill re-uses excavated material, only bedding + side fill are imported
  const importTonnes = row.backfillReuse
    ? beddingTonnes + sideFillTonnes
    : beddingTonnes + sideFillTonnes + backfillTonnes;

  // Export: total excavated minus what's re-used as backfill
  const totalExcavatedTonnes = totalTrenchM3 * 1.65; // assume average excavated density
  const exportTonnes = row.backfillReuse
    ? totalExcavatedTonnes - backfillM3 * 1.65 // rough: exported = total minus backfill volume at excavated density
    : totalExcavatedTonnes;

  return { beddingM3, sideFillM3, backfillM3, totalTrenchM3, pipeVolumeM3, beddingTonnes, sideFillTonnes, backfillTonnes, importTonnes, exportTonnes: Math.max(exportTonnes, 0) };
}
