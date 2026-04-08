// src/data/concrete-curing-estimator.ts
// Concrete Curing Time Estimator — BS EN 1992-1-1 / PD 6687 / Nurse-Saul maturity method

// ─── Types ───────────────────────────────────────────────────
export type CementType = "CEM_I_525R" | "CEM_I_425R" | "CEM_I_425N" | "CEM_IIA_L" | "CEM_IIB_V" | "CEM_IIIA" | "CEM_IIIB";
export type StrengthClass = "C8/10" | "C12/15" | "C16/20" | "C20/25" | "C25/30" | "C28/35" | "C30/37" | "C32/40" | "C35/45" | "C40/50" | "C45/55" | "C50/60";
export type CuringMethod = "formwork" | "polythene" | "compound" | "insulation" | "exposed";
export type TargetType = "5mpa" | "10mpa" | "15mpa" | "75pct" | "100pct";

export interface CementInfo {
  type: CementType;
  label: string;
  s: number;        // Eurocode s-coefficient
  datumTemp: number; // Nurse-Saul datum temperature (C)
  description: string;
}

export interface StrengthClassInfo {
  cls: StrengthClass;
  label: string;
  fck: number;  // Characteristic cylinder strength (MPa)
  fcm: number;  // Mean cylinder strength = fck + 8
  fckCube: number; // Characteristic cube strength (MPa)
}

export interface CuringMethodInfo {
  method: CuringMethod;
  label: string;
  description: string;
  moistureFactor: number;   // 1.0 = perfect, lower = worse
  insulationBoostBase: number; // base temp boost (C) — 0 for non-insulated
}

export interface TargetInfo {
  type: TargetType;
  label: string;
  description: string;
}

export interface CuringResult {
  estimatedHours: number;
  estimatedDays: number;
  targetStrengthMPa: number;
  fcm28: number;
  maturityRequired: number;
  equivalentAge20C: number;
  effectiveCuringTemp: number;
  curingMethod: CuringMethod;
  cementType: CementType;
  strengthClass: StrengthClass;
  coldWarning: boolean;
  frostWarning: boolean;
  hotWarning: boolean;
  noGainWarning: boolean;
  strengthCurve: { hours: number; days: number; strengthMPa: number; pct28: number }[];
  strengthCurve20C: { hours: number; days: number; strengthMPa: number; pct28: number }[];
  milestones: { label: string; targetMPa: number; hours: number; days: number; achievable: boolean }[];
  tempSensitivity: { tempC: number; hours: number; days: number }[];
  recommendations: string[];
  insulationBoost: number;
}

// ─── Constants ───────────────────────────────────────────────
export const CEMENT_TYPES: CementInfo[] = [
  { type: "CEM_I_525R",  label: "CEM I 52.5R (Rapid)",        s: 0.20, datumTemp: -10, description: "Rapid hardening Portland cement" },
  { type: "CEM_I_425R",  label: "CEM I 42.5R (Standard Rapid)", s: 0.20, datumTemp: -10, description: "Standard rapid Portland cement" },
  { type: "CEM_I_425N",  label: "CEM I 42.5N (Normal)",        s: 0.25, datumTemp: -10, description: "Normal Portland cement" },
  { type: "CEM_IIA_L",   label: "CEM II/A-L 32.5R (Limestone)", s: 0.25, datumTemp: -10, description: "Portland-limestone cement" },
  { type: "CEM_IIB_V",   label: "CEM II/B-V 32.5R (PFA)",     s: 0.38, datumTemp: -10, description: "Portland-fly ash cement" },
  { type: "CEM_IIIA",    label: "CEM III/A 42.5N (GGBS 36-65%)", s: 0.38, datumTemp: -11, description: "Blast furnace cement (moderate GGBS)" },
  { type: "CEM_IIIB",    label: "CEM III/B 32.5N (GGBS 66-80%)", s: 0.55, datumTemp: -11, description: "Blast furnace cement (high GGBS)" },
];

export const STRENGTH_CLASSES: StrengthClassInfo[] = [
  { cls: "C8/10",   label: "C8/10",   fck: 8,  fcm: 16, fckCube: 10 },
  { cls: "C12/15",  label: "C12/15",  fck: 12, fcm: 20, fckCube: 15 },
  { cls: "C16/20",  label: "C16/20",  fck: 16, fcm: 24, fckCube: 20 },
  { cls: "C20/25",  label: "C20/25",  fck: 20, fcm: 28, fckCube: 25 },
  { cls: "C25/30",  label: "C25/30",  fck: 25, fcm: 33, fckCube: 30 },
  { cls: "C28/35",  label: "C28/35",  fck: 28, fcm: 36, fckCube: 35 },
  { cls: "C30/37",  label: "C30/37",  fck: 30, fcm: 38, fckCube: 37 },
  { cls: "C32/40",  label: "C32/40",  fck: 32, fcm: 40, fckCube: 40 },
  { cls: "C35/45",  label: "C35/45",  fck: 35, fcm: 43, fckCube: 45 },
  { cls: "C40/50",  label: "C40/50",  fck: 40, fcm: 48, fckCube: 50 },
  { cls: "C45/55",  label: "C45/55",  fck: 45, fcm: 53, fckCube: 55 },
  { cls: "C50/60",  label: "C50/60",  fck: 50, fcm: 58, fckCube: 60 },
];

export const CURING_METHODS: CuringMethodInfo[] = [
  { method: "formwork",    label: "Formwork left in place",  description: "Steel or timber formwork retained — good moisture retention, moderate insulation", moistureFactor: 1.0,  insulationBoostBase: 3 },
  { method: "polythene",   label: "Polythene sheet",         description: "Polythene draped over surface — good moisture retention, minimal insulation", moistureFactor: 0.95, insulationBoostBase: 1 },
  { method: "compound",    label: "Curing compound sprayed", description: "Spray-on membrane — moderate moisture retention, no insulation", moistureFactor: 0.90, insulationBoostBase: 0 },
  { method: "insulation",  label: "Insulation blankets",     description: "Insulated blankets over formwork/surface — excellent moisture and heat retention", moistureFactor: 1.0,  insulationBoostBase: 8 },
  { method: "exposed",     label: "Exposed / no protection", description: "No curing protection — rapid moisture loss, no insulation", moistureFactor: 0.75, insulationBoostBase: 0 },
];

export const TARGET_TYPES: TargetInfo[] = [
  { type: "5mpa",   label: "5 MPa — safe for foot traffic",   description: "Minimum strength for pedestrian access" },
  { type: "10mpa",  label: "10 MPa — formwork striking",      description: "Typical minimum for soffit formwork striking (consult engineer)" },
  { type: "15mpa",  label: "15 MPa — safe for loading",       description: "Minimum for light construction loading" },
  { type: "75pct",  label: "75% of 28-day — structural load",  description: "Minimum for applying significant structural loads (BS EN 13670)" },
  { type: "100pct", label: "100% of 28-day — full design",    description: "Full characteristic design strength achieved" },
];

// ─── Calculation Engine ──────────────────────────────────────

/** Eurocode strength development: fcm(t) = fcm28 * exp{ s * [1 - (28/t)^0.5] } */
function strengthAtAge(fcm28: number, s: number, tDays: number): number {
  if (tDays <= 0) return 0;
  const beta = Math.exp(s * (1 - Math.sqrt(28 / tDays)));
  return fcm28 * beta;
}

/** Inverse: find equivalent age (days) at 20C to reach target strength */
function ageForStrength(fcm28: number, s: number, targetMPa: number): number {
  if (targetMPa <= 0) return 0;
  if (targetMPa >= fcm28) return 28 / Math.pow(1 - Math.log(targetMPa / fcm28) / s, 2);
  const lnRatio = Math.log(targetMPa / fcm28);
  const bracket = 1 - lnRatio / s;
  if (bracket <= 0) return Infinity;
  return 28 / (bracket * bracket);
}

/** Nurse-Saul: convert real time at curing temp to equivalent age at 20C */
function equivalentAge20C(realHours: number, curingTempC: number, datumTemp: number): number {
  const refTemp = 20;
  if (curingTempC <= datumTemp) return 0;
  const factor = (curingTempC - datumTemp) / (refTemp - datumTemp);
  return realHours * factor;
}

/** Inverse: real hours at curing temp to reach equivalent age at 20C */
function realHoursForEquivAge(equivHours20C: number, curingTempC: number, datumTemp: number): number {
  const refTemp = 20;
  if (curingTempC <= datumTemp) return Infinity;
  const factor = (curingTempC - datumTemp) / (refTemp - datumTemp);
  if (factor <= 0) return Infinity;
  return equivHours20C / factor;
}

/** Calculate insulation temperature boost based on element thickness */
function calcInsulationBoost(method: CuringMethod, thicknessMm: number): number {
  const info = CURING_METHODS.find(m => m.method === method)!;
  const base = info.insulationBoostBase;
  if (base === 0) return 0;
  // Thicker elements retain more heat of hydration
  // Scale: 150mm = 0.6x, 300mm = 1.0x, 500mm = 1.4x, 1000mm = 1.8x
  const thicknessScale = Math.min(2.0, Math.max(0.4, 0.4 + (thicknessMm / 1000) * 1.6));
  // Boost tapers after ~48h but we apply a simplified constant for the critical early period
  return Math.round(base * thicknessScale * 10) / 10;
}

/** Main calculation */
export function calculateCuring(
  strengthClass: StrengthClass,
  cementType: CementType,
  curingTempC: number,
  targetType: TargetType,
  curingMethod: CuringMethod,
  thicknessMm: number,
): CuringResult {
  const scInfo = STRENGTH_CLASSES.find(c => c.cls === strengthClass)!;
  const cemInfo = CEMENT_TYPES.find(c => c.type === cementType)!;
  const fcm28 = scInfo.fcm;
  const s = cemInfo.s;
  const datumTemp = cemInfo.datumTemp;

  // Insulation boost
  const insulationBoost = calcInsulationBoost(curingMethod, thicknessMm);
  const effectiveTemp = curingTempC + insulationBoost;

  // Target strength
  let targetMPa: number;
  switch (targetType) {
    case "5mpa":   targetMPa = 5; break;
    case "10mpa":  targetMPa = 10; break;
    case "15mpa":  targetMPa = 15; break;
    case "75pct":  targetMPa = fcm28 * 0.75; break;
    case "100pct": targetMPa = fcm28; break;
  }

  // Moisture factor reduces effective strength gain rate
  const moistureFactor = CURING_METHODS.find(m => m.method === curingMethod)!.moistureFactor;
  const effectiveFcm28 = fcm28 * moistureFactor;
  const effectiveTargetMPa = Math.min(targetMPa, effectiveFcm28);

  // Check achievability
  const noGain = effectiveTemp <= datumTemp;

  // Equivalent age at 20C to reach target
  const equivDays20C = noGain ? Infinity : ageForStrength(effectiveFcm28, s, effectiveTargetMPa);
  const equivHours20C = equivDays20C * 24;

  // Real hours at effective curing temperature
  const realHours = noGain ? Infinity : realHoursForEquivAge(equivHours20C, effectiveTemp, datumTemp);
  const realDays = realHours / 24;

  // Maturity required (C-hours)
  const maturityRequired = equivHours20C * (20 - datumTemp);

  // Warnings
  const coldWarning = curingTempC < 10 && curingTempC > 0;
  const frostWarning = curingTempC <= 0;
  const hotWarning = curingTempC > 35;
  const noGainWarning = noGain;

  // ── Strength curve at user's temperature (0 to 672 hours = 28 days)
  const strengthCurve: CuringResult["strengthCurve"] = [];
  const maxHours = 672; // 28 days
  for (let h = 0; h <= maxHours; h += (h < 48 ? 2 : h < 168 ? 6 : 24)) {
    if (noGain) {
      strengthCurve.push({ hours: h, days: h / 24, strengthMPa: 0, pct28: 0 });
    } else {
      const eqH = equivalentAge20C(h, effectiveTemp, datumTemp);
      const eqDays = eqH / 24;
      const str = Math.max(0, strengthAtAge(effectiveFcm28, s, eqDays));
      strengthCurve.push({ hours: h, days: h / 24, strengthMPa: Math.round(str * 10) / 10, pct28: Math.round((str / fcm28) * 100) });
    }
  }

  // ── Strength curve at 20C reference
  const strengthCurve20C: CuringResult["strengthCurve20C"] = [];
  for (let h = 0; h <= maxHours; h += (h < 48 ? 2 : h < 168 ? 6 : 24)) {
    const d = h / 24;
    const str = d > 0 ? Math.max(0, strengthAtAge(fcm28, s, d)) : 0;
    strengthCurve20C.push({ hours: h, days: d, strengthMPa: Math.round(str * 10) / 10, pct28: Math.round((str / fcm28) * 100) });
  }

  // ── Milestones
  const milestoneTargets = [
    { label: "5 MPa (foot traffic)", targetMPa: 5 },
    { label: "10 MPa (formwork strike)", targetMPa: 10 },
    { label: "15 MPa (light loading)", targetMPa: 15 },
    { label: "75% of 28-day", targetMPa: fcm28 * 0.75 },
    { label: "100% of 28-day", targetMPa: fcm28 },
  ];
  const milestones: CuringResult["milestones"] = milestoneTargets.map(m => {
    if (noGain || m.targetMPa > effectiveFcm28) {
      return { label: m.label, targetMPa: Math.round(m.targetMPa * 10) / 10, hours: Infinity, days: Infinity, achievable: false };
    }
    const eqD = ageForStrength(effectiveFcm28, s, m.targetMPa);
    const eqH = eqD * 24;
    const rH = realHoursForEquivAge(eqH, effectiveTemp, datumTemp);
    return {
      label: m.label,
      targetMPa: Math.round(m.targetMPa * 10) / 10,
      hours: Math.round(rH),
      days: Math.round(rH / 24 * 10) / 10,
      achievable: isFinite(rH) && rH < 8760, // < 365 days
    };
  });

  // ── Temperature sensitivity (how curing time changes at different temps)
  const sensTemps = [0, 5, 10, 15, 20, 25, 30, 35];
  const tempSensitivity: CuringResult["tempSensitivity"] = sensTemps.map(t => {
    const eTemp = t + insulationBoost;
    if (eTemp <= datumTemp) return { tempC: t, hours: Infinity, days: Infinity };
    const eqD = ageForStrength(effectiveFcm28, s, effectiveTargetMPa);
    const eqH = eqD * 24;
    const rH = realHoursForEquivAge(eqH, eTemp, datumTemp);
    return { tempC: t, hours: Math.round(rH), days: Math.round(rH / 24 * 10) / 10 };
  });

  // ── Recommendations
  const recommendations: string[] = [];
  if (frostWarning) {
    recommendations.push("CRITICAL: Curing temperature is at or below freezing. Concrete will suffer frost damage if it freezes before reaching 5 MPa. Use heated enclosures, insulation blankets, or delay the pour.");
    recommendations.push("Do not allow fresh concrete to freeze within the first 24 hours. Consider using accelerators or hot water in the mix.");
  }
  if (noGainWarning) {
    recommendations.push("At this temperature, concrete is below the datum temperature and will not gain meaningful strength. Heating is essential.");
  }
  if (coldWarning) {
    recommendations.push("Cold weather curing (below 10C): strength development will be significantly slower. Consider insulation blankets or heated enclosures.");
    recommendations.push("Monitor concrete temperature with embedded thermocouples. Maintain minimum 5C during curing per BS EN 13670.");
  }
  if (hotWarning) {
    recommendations.push("Hot weather curing (above 35C): risk of thermal cracking and reduced long-term strength. Use chilled water in the mix, avoid direct sunlight, and begin curing immediately after finishing.");
    recommendations.push("Consider night pours or early morning pours to avoid peak temperatures.");
  }
  if (curingMethod === "exposed") {
    recommendations.push("Exposed/unprotected curing will result in moisture loss and reduced strength gain. Apply curing compound, polythene, or wet hessian as soon as possible after finishing.");
  }
  if (cemInfo.s >= 0.38) {
    recommendations.push(`${cemInfo.label} has slower early strength gain (s=${cemInfo.s}). Extended curing periods are required compared to CEM I cements. Do not strike formwork based on CEM I timings.`);
  }
  if (realDays > 7) {
    recommendations.push(`Estimated curing time of ${realDays.toFixed(1)} days exceeds 7 days. Consider using a faster cement type (e.g. CEM I 42.5R or 52.5R) or reducing the target strength threshold to reduce programme impact.`);
  }
  recommendations.push("This is an estimate based on the Eurocode maturity method. Actual strength should be verified by cube testing per BS EN 12390-3 before striking formwork or applying loads.");
  recommendations.push("Ensure curing protection is maintained continuously. Interruptions in curing can permanently reduce final strength.");

  return {
    estimatedHours: Math.round(realHours),
    estimatedDays: Math.round(realDays * 10) / 10,
    targetStrengthMPa: Math.round(effectiveTargetMPa * 10) / 10,
    fcm28,
    maturityRequired: Math.round(maturityRequired),
    equivalentAge20C: Math.round(equivDays20C * 10) / 10,
    effectiveCuringTemp: Math.round(effectiveTemp * 10) / 10,
    curingMethod,
    cementType,
    strengthClass,
    coldWarning,
    frostWarning,
    hotWarning,
    noGainWarning,
    strengthCurve,
    strengthCurve20C,
    milestones,
    tempSensitivity,
    recommendations,
    insulationBoost,
  };
}

// ─── Utilities ───────────────────────────────────────────────
export function fmtHours(h: number): string {
  if (!isFinite(h)) return "N/A";
  if (h < 24) return `${Math.round(h)}h`;
  const days = h / 24;
  if (days < 2) return `${Math.round(h)}h (${days.toFixed(1)} days)`;
  return `${days.toFixed(1)} days`;
}

export function fmtDays(d: number): string {
  if (!isFinite(d)) return "N/A";
  if (d < 1) return `${Math.round(d * 24)}h`;
  return `${d.toFixed(1)} days`;
}
