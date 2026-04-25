// src/data/plate-bearing-test-interpreter.ts
// Plate Bearing Test Interpreter — DIN 18134, Ev1/Ev2 deformation modulus, CBR correlation

// ─── Types ──────────────────────────────────────────────────────
export type StressUnit = "kPa" | "MPa";

export interface Reading {
  id: string;
  stress: number;   // kPa (always stored internally as kPa)
  settlement: number; // mm
}

export interface TestLocation {
  id: string;
  name: string;
  plateDiameter: number; // mm
  firstLoad: Reading[];
  unload: Reading[];
  reload: Reading[];
  targetPreset: string;
  customTarget: number | null;
  stressRangeLow: number;  // % of max stress for Ev calc (default 30)
  stressRangeHigh: number; // % of max stress for Ev calc (default 70)
}

export interface EvResult {
  ev1: number | null;         // MPa
  ev2: number | null;         // MPa
  ratio: number | null;       // Ev2/Ev1
  targetRatio: number;
  minEv2Required: number | null; // MPa — the absolute Ev2 floor from the preset (if any)
  meetsRatio: boolean | null;     // ratio <= targetRatio (null if can't calculate)
  meetsMinEv2: boolean | null;    // Ev2 >= minEv2Required (null if no minEv2 set or Ev2 unknown)
  pass: boolean | null;       // null if can't calculate; pass = meetsRatio AND meetsMinEv2
  cbrEquivalent: number | null; // from Ev2
  cbrTRL: number | null;       // TRL alternative
  ev1DeltaSigma: number | null; // kPa
  ev1DeltaS: number | null;    // mm
  ev2DeltaSigma: number | null; // kPa
  ev2DeltaS: number | null;    // mm
  ev1StressLow: number | null;  // kPa - actual stress used
  ev1StressHigh: number | null; // kPa
  ev2StressLow: number | null;
  ev2StressHigh: number | null;
}

// ─── Target Presets ─────────────────────────────────────────────
// 20 realistic UK earthworks target presets
export interface TargetPreset {
  id: string;
  label: string;
  ratio: number;
  minEv2: number | null; // MPa — some specs also require min Ev2
  description: string;
}

export const TARGET_PRESETS: TargetPreset[] = [
  { id: "road-sub-base-cat1", label: "Road Sub-base (Cat 1) - SHW Cl. 803", ratio: 2.0, minEv2: 120, description: "Type 1 sub-base to SHW Clause 803, high-quality crushed rock" },
  { id: "road-sub-base-cat2", label: "Road Sub-base (Cat 2) - SHW Cl. 804", ratio: 2.2, minEv2: 100, description: "Type 2 sub-base to SHW Clause 804" },
  { id: "road-capping-6f1", label: "Capping Layer (Class 6F1)", ratio: 2.5, minEv2: 80, description: "Selected granular capping material, SHW Table 6/1 Class 6F1" },
  { id: "road-capping-6f2", label: "Capping Layer (Class 6F2)", ratio: 2.5, minEv2: 60, description: "Selected cohesive/granular capping, SHW Table 6/1 Class 6F2" },
  { id: "road-capping-6f5", label: "Capping Layer (Class 6F5)", ratio: 2.8, minEv2: 50, description: "Stabilised capping material, SHW Table 6/1 Class 6F5" },
  { id: "road-subgrade-improved", label: "Improved Subgrade", ratio: 2.5, minEv2: 45, description: "Treated or stabilised subgrade layer" },
  { id: "general-fill-1", label: "General Fill (Class 1 - Well-graded)", ratio: 2.5, minEv2: null, description: "Well-graded granular fill, SHW Class 1" },
  { id: "general-fill-2", label: "General Fill (Class 2 - Dry Cohesive)", ratio: 2.5, minEv2: null, description: "Dry cohesive fill, SHW Class 2" },
  { id: "selected-fill-6n", label: "Selected Fill (Class 6N)", ratio: 2.3, minEv2: null, description: "Selected well-graded granular, SHW Class 6N" },
  { id: "structural-fill", label: "Structural Fill (below foundations)", ratio: 2.0, minEv2: 80, description: "Engineered fill beneath structural foundations" },
  { id: "pipe-surround", label: "Pipe Surround / Bedding", ratio: 2.5, minEv2: 40, description: "Pipe bedding and surround material to WRc standards" },
  { id: "bulk-fill", label: "Bulk Fill (general earthworks)", ratio: 3.5, minEv2: null, description: "Acceptable bulk fill for general earthworks, non-structural" },
  { id: "landscape-fill", label: "Landscape Fill / Reinstatement", ratio: 3.5, minEv2: null, description: "Landscape areas, non-structural reinstatement" },
  { id: "car-park-sub-base", label: "Car Park Sub-base", ratio: 2.2, minEv2: 80, description: "Sub-base for car park construction" },
  { id: "footpath-sub-base", label: "Footpath / Cycleway Sub-base", ratio: 2.5, minEv2: 60, description: "Sub-base for footpaths and cycleways" },
  { id: "rail-trackbed", label: "Rail Trackbed Formation", ratio: 2.0, minEv2: 100, description: "Railway trackbed formation layer per NR standards" },
  { id: "airfield-sub-base", label: "Airfield Sub-base / Formation", ratio: 2.0, minEv2: 120, description: "Airfield pavement sub-base to MOD/CAA specifications" },
  { id: "dam-core-fill", label: "Dam / Embankment Core Fill", ratio: 2.0, minEv2: null, description: "Compacted clay core fill for dams and flood embankments" },
  { id: "slab-on-grade", label: "Slab-on-Grade Sub-base", ratio: 2.5, minEv2: 60, description: "Sub-base beneath ground-bearing floor slabs" },
  { id: "haul-road", label: "Temporary Haul Road / Platform", ratio: 3.0, minEv2: 40, description: "Temporary haul road or working platform" },
];

// ─── Plate Diameters ────────────────────────────────────────────
export const PLATE_DIAMETERS = [300, 600, 762]; // mm — 300 and 600 are standard DIN 18134

// ─── Calculation Functions ──────────────────────────────────────

/**
 * Calculate deformation modulus from a loading curve.
 * DIN 18134 formula: Ev = 1.5 × r × (delta_sigma / delta_s)
 *   r = plate radius (m)
 *   delta_sigma = stress increment between low% and high% of max stress (kPa)
 *   delta_s = corresponding settlement increment (mm)
 * Result in MPa.
 *
 * The 1.5 factor comes from Boussinesq theory for a rigid circular plate
 * on an elastic half-space (shape factor for uniform stress distribution
 * under a rigid plate = pi/4 * 2 = 1.5).
 */
export function calculateEv(
  readings: Reading[],
  plateDiameterMm: number,
  stressRangeLow: number,  // % e.g. 30
  stressRangeHigh: number, // % e.g. 70
): { ev: number | null; deltaSigma: number | null; deltaS: number | null; stressLow: number | null; stressHigh: number | null } {
  if (readings.length < 2) return { ev: null, deltaSigma: null, deltaS: null, stressLow: null, stressHigh: null };

  const sorted = [...readings].sort((a, b) => a.stress - b.stress);
  const maxStress = Math.max(...sorted.map(r => r.stress));
  if (maxStress <= 0) return { ev: null, deltaSigma: null, deltaS: null, stressLow: null, stressHigh: null };

  const targetLow = maxStress * (stressRangeLow / 100);
  const targetHigh = maxStress * (stressRangeHigh / 100);

  // Find closest readings to the target stress values by linear interpolation
  const interpSettlement = (targetStress: number): number | null => {
    // Find bracketing readings
    let lower: Reading | null = null;
    let upper: Reading | null = null;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].stress <= targetStress) lower = sorted[i];
      if (sorted[i].stress >= targetStress && upper === null) upper = sorted[i];
    }
    // If target is below all readings, extrapolate from first two points
    if (lower === null && upper !== null && sorted.length >= 2) {
      const a = sorted[0], b = sorted[1];
      if (b.stress === a.stress) return a.settlement;
      const fraction = (targetStress - a.stress) / (b.stress - a.stress);
      return a.settlement + fraction * (b.settlement - a.settlement);
    }
    // If target is above all readings, extrapolate from last two points
    if (upper === null && lower !== null && sorted.length >= 2) {
      const a = sorted[sorted.length - 2], b = sorted[sorted.length - 1];
      if (b.stress === a.stress) return b.settlement;
      const fraction = (targetStress - a.stress) / (b.stress - a.stress);
      return a.settlement + fraction * (b.settlement - a.settlement);
    }
    if (lower === null || upper === null) return null;
    if (lower.stress === upper.stress) return lower.settlement;
    // Linear interpolation
    const fraction = (targetStress - lower.stress) / (upper.stress - lower.stress);
    return lower.settlement + fraction * (upper.settlement - lower.settlement);
  };

  const sLow = interpSettlement(targetLow);
  const sHigh = interpSettlement(targetHigh);
  if (sLow === null || sHigh === null) return { ev: null, deltaSigma: null, deltaS: null, stressLow: null, stressHigh: null };

  const deltaSigma = targetHigh - targetLow; // kPa
  const deltaS = sHigh - sLow; // mm

  if (deltaS <= 0) return { ev: null, deltaSigma, deltaS, stressLow: targetLow, stressHigh: targetHigh };

  const radiusM = (plateDiameterMm / 2) / 1000; // convert mm to m
  // Ev = 1.5 × r × (Δσ / Δs)
  // Δσ in kPa, Δs in mm → need to convert Δs to m for consistent units
  // Ev (kPa) = 1.5 × r(m) × (Δσ(kPa) / Δs(m))
  // Ev (MPa) = Ev(kPa) / 1000
  const deltaS_m = deltaS / 1000;
  const evKPa = 1.5 * radiusM * (deltaSigma / deltaS_m);
  const evMPa = evKPa / 1000;

  return { ev: Math.round(evMPa * 10) / 10, deltaSigma, deltaS, stressLow: targetLow, stressHigh: targetHigh };
}

/**
 * CBR correlation from Ev2 (DIN formula).
 * Ev2 (MPa) = 10 × CBR^0.5
 * Therefore: CBR = (Ev2 / 10)^2
 */
export function ev2ToCBR_DIN(ev2MPa: number): number {
  return Math.round(Math.pow(ev2MPa / 10, 2) * 10) / 10;
}

/**
 * CBR correlation from Ev2 (TRL alternative — Transport Research Laboratory).
 * Ev2 (MPa) = 17.6 × CBR^0.64
 * Therefore: CBR = (Ev2 / 17.6)^(1/0.64)
 */
export function ev2ToCBR_TRL(ev2MPa: number): number {
  return Math.round(Math.pow(ev2MPa / 17.6, 1 / 0.64) * 10) / 10;
}

/**
 * Full result for one test location.
 *
 * Pass logic combines TWO criteria:
 *   1. Ev2/Ev1 ratio <= targetRatio (compaction quality)
 *   2. Ev2 >= minEv2Required (absolute stiffness floor, if the preset specifies one)
 * Both must be satisfied for an overall PASS. Where the preset has no minEv2 floor,
 * only the ratio criterion applies.
 *
 * A custom target (test.customTarget) is treated as a ratio-only override and does
 * not carry a minEv2 — users selecting "Custom target..." are deemed to be testing
 * to a contract-specific spec they will check separately.
 */
export function calculateTestResult(test: TestLocation): EvResult {
  const preset = TARGET_PRESETS.find(p => p.id === test.targetPreset);
  const targetRatio = test.customTarget ?? preset?.ratio ?? 2.5;
  // Custom target overrides the preset entirely (incl. its minEv2). Otherwise inherit from preset.
  const minEv2Required = test.customTarget !== null ? null : (preset?.minEv2 ?? null);

  const ev1Res = calculateEv(test.firstLoad, test.plateDiameter, test.stressRangeLow, test.stressRangeHigh);
  const ev2Res = calculateEv(test.reload, test.plateDiameter, test.stressRangeLow, test.stressRangeHigh);

  const ev1 = ev1Res.ev;
  const ev2 = ev2Res.ev;
  const ratio = (ev1 !== null && ev2 !== null && ev1 > 0) ? Math.round((ev2 / ev1) * 100) / 100 : null;

  const meetsRatio: boolean | null = ratio !== null ? ratio <= targetRatio : null;
  const meetsMinEv2: boolean | null = (minEv2Required === null)
    ? null // no Ev2 floor specified for this preset — criterion does not apply
    : (ev2 !== null ? ev2 >= minEv2Required : null);

  // Overall pass: both criteria must hold (where applicable).
  // - If ratio is null we can't decide → null
  // - If minEv2 applies and we don't have Ev2 yet we can't decide → null
  // - If minEv2 doesn't apply, pass = meetsRatio
  let pass: boolean | null = null;
  if (meetsRatio === null) {
    pass = null;
  } else if (minEv2Required === null) {
    pass = meetsRatio;
  } else if (meetsMinEv2 === null) {
    pass = null;
  } else {
    pass = meetsRatio && meetsMinEv2;
  }

  const cbrEquivalent = ev2 !== null ? ev2ToCBR_DIN(ev2) : null;
  const cbrTRL = ev2 !== null ? ev2ToCBR_TRL(ev2) : null;

  return {
    ev1, ev2, ratio, targetRatio, minEv2Required,
    meetsRatio, meetsMinEv2, pass,
    cbrEquivalent, cbrTRL,
    ev1DeltaSigma: ev1Res.deltaSigma, ev1DeltaS: ev1Res.deltaS,
    ev2DeltaSigma: ev2Res.deltaSigma, ev2DeltaS: ev2Res.deltaS,
    ev1StressLow: ev1Res.stressLow, ev1StressHigh: ev1Res.stressHigh,
    ev2StressLow: ev2Res.stressLow, ev2StressHigh: ev2Res.stressHigh,
  };
}

// ─── Helpers ────────────────────────────────────────────────────
export function kPaToMPa(kPa: number): number { return kPa / 1000; }
export function mPaToKPa(mPa: number): number { return mPa * 1000; }

export function stressDisplay(kPa: number, unit: StressUnit): string {
  if (unit === "MPa") return (kPa / 1000).toFixed(3);
  // Smart decimal display: show up to 2dp, strip trailing zeros
  if (kPa === 0) return "0";
  const s = kPa.toFixed(2);
  return s.replace(/\.?0+$/, "");
}

export function stressToKPa(value: number, unit: StressUnit): number {
  if (unit === "MPa") return value * 1000;
  return value;
}

export function stressFromKPa(kPa: number, unit: StressUnit): number {
  if (unit === "MPa") return kPa / 1000;
  return kPa;
}

export function stressLabel(unit: StressUnit): string {
  return unit === "MPa" ? "MN/m2" : "kN/m2";
}

export function todayISO(): string { return new Date().toISOString().slice(0, 10); }

export function newId(): string { return Math.random().toString(36).slice(2, 8); }

export function createEmptyTest(name: string): TestLocation {
  return {
    id: newId(),
    name,
    plateDiameter: 300,
    firstLoad: [],
    unload: [],
    reload: [],
    targetPreset: "general-fill-1",
    customTarget: null,
    stressRangeLow: 30,
    stressRangeHigh: 70,
  };
}

export function createReading(stress: number, settlement: number): Reading {
  return { id: newId(), stress, settlement };
}
