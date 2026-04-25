// src/data/sling-swl-calculator.ts
// Sling / Lifting Gear SWL Calculator — data, types, and calculation logic
// References: LEEA Code of Practice, LOLER 1998, BS EN 13414 (wire rope),
// BS EN 818 (chain), BS EN 1492 (textile slings), HSE L113 (LOLER ACOP)

// ─── Types ───────────────────────────────────────────────────
export type SlingType = "chain" | "wire_rope" | "polyester_round" | "polyester_flat";
export type LegCount = 1 | 2 | 3 | 4;

export interface SlingInput {
  slingType: SlingType;
  legs: LegCount;
  singleLegSWL: number; // tonnes
  angleDeg: number | null; // included angle between opposite legs (degrees), null if 1-leg
  angleMode: "direct" | "geometry"; // direct entry or calculated from height/spread
  verticalHeight: number; // m — used if angleMode === "geometry"
  horizontalSpread: number; // m — used if angleMode === "geometry"
  loadWeight: number; // tonnes
}

export interface SlingResult {
  effectiveAngle: number; // degrees (0 for single leg)
  angleReductionFactor: number; // cos(theta/2)
  modeFactor: number;
  effectiveSWL: number; // tonnes
  utilisation: number; // percentage
  riskBand: "safe" | "caution" | "overloaded" | "angle_exceeded";
  maxSafeAngle: number; // degrees — max angle at which the load can be lifted
  maxSafeLoad: number; // tonnes — max load at the entered angle
}

// ─── Constants ───────────────────────────────────────────────
export const SLING_TYPE_LABELS: Record<SlingType, string> = {
  chain: "Chain Sling",
  wire_rope: "Wire Rope Sling",
  polyester_round: "Polyester Round Sling",
  polyester_flat: "Polyester Flat Webbing Sling",
};

export const SLING_TYPE_SHORT: Record<SlingType, string> = {
  chain: "Chain",
  wire_rope: "Wire Rope",
  polyester_round: "Round Sling",
  polyester_flat: "Flat Webbing",
};

export const LEG_OPTIONS: LegCount[] = [1, 2, 3, 4];

// BS EN combined mode factors (no separate angle multiply).
// Source: BS EN 13414-1 Table 6 (wire rope), BS EN 818-4 Table 7 (chain),
// BS EN 1492-1 cl 4.2 + Annex A (textile), all consistent.
//
// Mode factor M is defined per leg-count and angle band. Effective WLL
// for a sling assembly = single-leg WLL × M. The factor includes the
// load-sharing assumption AND the angle-of-loading effect; do NOT
// multiply by cos(theta/2) on top.
//
// Bands:
//   1-leg straight                       : M = 1.0
//   2-leg, 0-45 deg included angle       : M = 1.4
//   2-leg, >45-60 deg                    : M = 1.0
//   3 or 4-leg, 0-45 deg                 : M = 2.1
//   3 or 4-leg, >45-60 deg               : M = 1.5
//   Any multi-leg, >60 deg               : NOT PERMITTED under BS EN
//
// 60 deg is the absolute maximum included angle in BS EN methodology.
// Above 60 deg, the assembly must be re-rigged (longer legs, narrower
// spread) so the included angle is reduced.
export const BS_EN_MODE_FACTOR_BANDS = {
  legs1: { straight: 1.0 },
  legs2: { upTo45: 1.4, upTo60: 1.0 },
  legs3or4: { upTo45: 2.1, upTo60: 1.5 },
};

export const MAX_PERMITTED_ANGLE = 60; // degrees, included angle, BS EN absolute max

// Returns the BS EN combined mode factor for a given leg count and
// included angle. For 1-leg, the angle is ignored (always 1.0).
export function getModeFactor(legs: LegCount, angleDeg: number): number {
  if (legs === 1) return BS_EN_MODE_FACTOR_BANDS.legs1.straight;
  if (angleDeg > MAX_PERMITTED_ANGLE) return 0; // not permitted; caller flags as exceeded
  if (legs === 2) {
    return angleDeg <= 45 ? BS_EN_MODE_FACTOR_BANDS.legs2.upTo45 : BS_EN_MODE_FACTOR_BANDS.legs2.upTo60;
  }
  // 3 or 4 leg
  return angleDeg <= 45 ? BS_EN_MODE_FACTOR_BANDS.legs3or4.upTo45 : BS_EN_MODE_FACTOR_BANDS.legs3or4.upTo60;
}

// Lookup table for UI display: combined mode factor at the band steps.
// Note step transitions at exactly 45 and 60 degrees.
export const ANGLE_TABLE: { angle: number; legs2: number; legs3or4: number }[] = [
  { angle: 0, legs2: 1.4, legs3or4: 2.1 },
  { angle: 30, legs2: 1.4, legs3or4: 2.1 },
  { angle: 45, legs2: 1.4, legs3or4: 2.1 },
  { angle: 46, legs2: 1.0, legs3or4: 1.5 },
  { angle: 60, legs2: 1.0, legs3or4: 1.5 },
];

// ─── Calculation functions ───────────────────────────────────

export function calcAngleFromGeometry(height: number, spread: number): number {
  if (height <= 0) return 0;
  // Included angle between opposite legs
  return 2 * Math.atan(spread / (2 * height)) * (180 / Math.PI);
}

// Returns the band label for UI display.
// "<=45" / "45-60" / ">60" / "n/a" (single leg)
export function angleBandLabel(legs: LegCount, angleDeg: number): string {
  if (legs === 1) return "n/a (single leg)";
  if (angleDeg > MAX_PERMITTED_ANGLE) return ">60° (NOT PERMITTED)";
  if (angleDeg > 45) return "45-60°";
  return "≤45°";
}

export function calcEffectiveSWL(singleLegSWL: number, legs: LegCount, angleDeg: number): number {
  return singleLegSWL * getModeFactor(legs, angleDeg);
}

// Max safe included angle: under BS EN methodology this is a discrete value.
// If the load can be lifted within the 0-45 band: max = 45 deg.
// Else if it can be lifted within the 45-60 band: max = 60 deg.
// Else: 0 (cannot be lifted at any permitted angle for that leg count).
export function calcMaxSafeAngle(singleLegSWL: number, legs: LegCount, loadWeight: number): number {
  if (legs === 1) return 0;
  // Try 0-45 band first (highest mode factor)
  if (calcEffectiveSWL(singleLegSWL, legs, 0) >= loadWeight) return 45;
  // Then 45-60 band
  if (calcEffectiveSWL(singleLegSWL, legs, 50) >= loadWeight) return 60;
  return 0;
}

export function calcMaxSafeLoad(singleLegSWL: number, legs: LegCount, angleDeg: number): number {
  return calcEffectiveSWL(singleLegSWL, legs, angleDeg);
}

export function calculateSling(input: SlingInput): SlingResult {
  const effectiveAngle =
    input.legs === 1
      ? 0
      : input.angleMode === "geometry"
        ? calcAngleFromGeometry(input.verticalHeight, input.horizontalSpread)
        : input.angleDeg ?? 0;

  const modeFactor = getModeFactor(input.legs, effectiveAngle);
  // angleReductionFactor retained for backwards-compatible result shape;
  // under BS EN methodology this is implicit in the mode factor band, so
  // it equals 1.0 (no further multiply beyond the mode factor).
  const angleReductionFactor = 1.0;
  const effectiveSWL = input.singleLegSWL * modeFactor;
  const utilisation = effectiveSWL > 0 ? (input.loadWeight / effectiveSWL) * 100 : 999;

  let riskBand: SlingResult["riskBand"];
  if (effectiveAngle > MAX_PERMITTED_ANGLE && input.legs > 1) {
    riskBand = "angle_exceeded";
  } else if (utilisation > 100) {
    riskBand = "overloaded";
  } else if (utilisation > 80 || effectiveAngle > 45) {
    riskBand = "caution";
  } else {
    riskBand = "safe";
  }

  const maxSafeAngle = calcMaxSafeAngle(input.singleLegSWL, input.legs, input.loadWeight);
  const maxSafeLoad = calcMaxSafeLoad(input.singleLegSWL, input.legs, effectiveAngle);

  return {
    effectiveAngle,
    angleReductionFactor,
    modeFactor,
    effectiveSWL,
    utilisation,
    riskBand,
    maxSafeAngle,
    maxSafeLoad,
  };
}

// Capacity curve for chart display. Under BS EN methodology this is a
// step function with discontinuities at 45 and 60 degrees, plus a hard
// cut-off (zero) above 60.
export function generateCapacityCurve(
  singleLegSWL: number,
  legs: LegCount,
): { angle: number; swl: number }[] {
  if (legs === 1) return [{ angle: 0, swl: singleLegSWL }];
  const points: { angle: number; swl: number }[] = [];
  // 0-45 band (sample every degree for smooth chart rendering across the band)
  for (let a = 0; a <= 45; a += 1) {
    points.push({ angle: a, swl: calcEffectiveSWL(singleLegSWL, legs, a) });
  }
  // Step down at 45 -> 46 (45-60 band)
  for (let a = 46; a <= 60; a += 1) {
    points.push({ angle: a, swl: calcEffectiveSWL(singleLegSWL, legs, a) });
  }
  // Step to zero above 60 (not permitted band)
  points.push({ angle: 61, swl: 0 });
  points.push({ angle: 90, swl: 0 });
  return points;
}

// Risk band colours and labels
export const RISK_BAND_CONFIG: Record<
  SlingResult["riskBand"],
  { label: string; colour: string; bgClass: string; textClass: string; borderClass: string }
> = {
  safe: {
    label: "SAFE",
    colour: "#16A34A",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-300",
  },
  caution: {
    label: "CAUTION",
    colour: "#D97706",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
  },
  overloaded: {
    label: "OVERLOADED",
    colour: "#DC2626",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-300",
  },
  angle_exceeded: {
    label: "ANGLE EXCEEDED",
    colour: "#DC2626",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-300",
  },
};

// Regulatory footnotes
export const REGULATIONS = [
  "Lifting Operations and Lifting Equipment Regulations 1998 (LOLER)",
  "HSE L113 — Safe use of lifting equipment (LOLER ACOP)",
  "BS EN 13414 (Wire Rope Slings)",
  "BS EN 818 (Short Link Chain Slings)",
  "BS EN 1492 (Textile Slings — flat-woven webbing and round slings)",
  "LEEA Code of Practice for the Safe Use of Lifting Equipment (CoPSULE)",
];
