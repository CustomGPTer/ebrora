// src/data/sling-swl-calculator.ts
// Sling / Lifting Gear SWL Calculator — data, types, and calculation logic
// References: LEEA Code of Practice, BS 8437, LOLER 1998, BS EN 13414 (wire rope),
// BS EN 818 (chain), BS EN 1492 (textile slings)

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

// Mode factors per LEEA Code of Practice (conservative)
// 1-leg = 1.0, 2-leg = 2.0, 3-leg = 2.0 (conservative — only 2 guaranteed loaded),
// 4-leg = 3.0 (conservative — assumes 3 of 4 take load)
export const MODE_FACTORS: Record<LegCount, number> = {
  1: 1.0,
  2: 2.0,
  3: 2.0,
  4: 3.0,
};

// Standard angle reduction lookup table
export const ANGLE_TABLE: { angle: number; factor: number }[] = [
  { angle: 0, factor: 1.0 },
  { angle: 15, factor: 0.99 },
  { angle: 30, factor: 0.97 },
  { angle: 45, factor: 0.92 },
  { angle: 60, factor: 0.87 },
  { angle: 75, factor: 0.79 },
  { angle: 90, factor: 0.71 },
  { angle: 105, factor: 0.61 },
  { angle: 120, factor: 0.50 },
];

// ─── Calculation functions ───────────────────────────────────

export function calcAngleFromGeometry(height: number, spread: number): number {
  if (height <= 0) return 0;
  // Included angle between opposite legs
  return 2 * Math.atan(spread / (2 * height)) * (180 / Math.PI);
}

export function calcAngleReductionFactor(angleDeg: number): number {
  if (angleDeg <= 0) return 1.0;
  return Math.cos((angleDeg / 2) * (Math.PI / 180));
}

export function calcEffectiveSWL(singleLegSWL: number, legs: LegCount, angleDeg: number): number {
  const modeFactor = MODE_FACTORS[legs];
  const angleFactor = legs === 1 ? 1.0 : calcAngleReductionFactor(angleDeg);
  return singleLegSWL * modeFactor * angleFactor;
}

export function calcMaxSafeAngle(singleLegSWL: number, legs: LegCount, loadWeight: number): number {
  // Solve: loadWeight = singleLegSWL * modeFactor * cos(theta/2)
  // cos(theta/2) = loadWeight / (singleLegSWL * modeFactor)
  if (legs === 1) return 0;
  const modeFactor = MODE_FACTORS[legs];
  const ratio = loadWeight / (singleLegSWL * modeFactor);
  if (ratio > 1) return 0; // can't lift at any angle
  if (ratio <= 0) return 120;
  const halfAngle = Math.acos(ratio) * (180 / Math.PI);
  return Math.min(halfAngle * 2, 120);
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

  const angleReductionFactor = input.legs === 1 ? 1.0 : calcAngleReductionFactor(effectiveAngle);
  const modeFactor = MODE_FACTORS[input.legs];
  const effectiveSWL = input.singleLegSWL * modeFactor * angleReductionFactor;
  const utilisation = effectiveSWL > 0 ? (input.loadWeight / effectiveSWL) * 100 : 0;

  let riskBand: SlingResult["riskBand"];
  if (effectiveAngle > 120 && input.legs > 1) {
    riskBand = "angle_exceeded";
  } else if (utilisation > 100) {
    riskBand = "overloaded";
  } else if (utilisation > 80 || effectiveAngle > 90) {
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

// Chart data: SWL vs angle for capacity curve
export function generateCapacityCurve(
  singleLegSWL: number,
  legs: LegCount,
): { angle: number; swl: number }[] {
  if (legs === 1) return [{ angle: 0, swl: singleLegSWL }];
  const points: { angle: number; swl: number }[] = [];
  for (let a = 0; a <= 120; a += 2) {
    points.push({ angle: a, swl: calcEffectiveSWL(singleLegSWL, legs, a) });
  }
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
  "BS EN 13414 (Wire Rope Slings)",
  "BS EN 818 (Short Link Chain Slings)",
  "BS EN 1492 (Textile Slings)",
  "BS 8437 (Code of Practice for Selection of Lifting Slings)",
  "LEEA Code of Practice for the Safe Use of Lifting Equipment",
];
