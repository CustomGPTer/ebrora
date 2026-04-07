// src/data/scaffold-load-calculator.ts
// Scaffold Load Calculator — BS EN 12811-1, BS 5975, SG4:10

// ─── Types ──────────────────────────────────────────────────────
export type ScaffoldType = "tube-fitting" | "system";
export type DutyClass = 1 | 2 | 3 | 4 | 5 | 6;
export type WindZone = "sheltered" | "normal" | "exposed";
export type UtilisationLevel = "safe" | "marginal" | "overloaded";

export interface ScaffoldInputs {
  scaffoldType: ScaffoldType;
  numLifts: number;
  bayWidth: number; // m
  bayLength: number; // m
  dutyClass: DutyClass;
  loadedBays: number;
  sheeted: boolean;
  debrisNet: boolean;
  windZone: WindZone;
  freestanding: boolean;
  scaffoldHeight: number; // m (derived from lifts * liftHeight)
}

export interface LoadBreakdown {
  deadLoadPerStandard: number; // kN
  imposedLoadPerStandard: number; // kN
  windLoadPerStandard: number; // kN
  totalLoadPerStandard: number; // kN
  allowableCapacity: number; // kN
  utilisationPercent: number;
  utilisationLevel: UtilisationLevel;
}

export interface TieCalc {
  windForcePerBay: number; // kN
  tieCapacity: number; // kN (through-tie)
  maxTieSpacingH: number; // m
  maxTieSpacingV: number; // m
  tiesRequired: number;
}

export interface ScaffoldResult {
  loads: LoadBreakdown;
  loadsUnsheeted: LoadBreakdown | null; // for comparison when sheeted
  tieCalc: TieCalc;
  dutyClassComparison: { dutyClass: DutyClass; label: string; total: number; utilisation: number }[];
  recommendations: string[];
  needsDesignCheck: boolean;
}

// ─── Constants ───────────────────────────────────────────────
export const LIFT_HEIGHT = 2.0; // m standard lift height

export const DUTY_CLASSES: { cls: DutyClass; label: string; loadKpa: number; description: string }[] = [
  { cls: 1, label: "Class 1 - Inspection", loadKpa: 0.75, description: "Inspection and access only" },
  { cls: 2, label: "Class 2 - Light Duty", loadKpa: 1.50, description: "Light duty - painting, cleaning" },
  { cls: 3, label: "Class 3 - General Purpose", loadKpa: 2.00, description: "General purpose - bricklaying, rendering" },
  { cls: 4, label: "Class 4 - Heavy Duty", loadKpa: 3.00, description: "Heavy duty - blockwork, stone" },
  { cls: 5, label: "Class 5 - Masonry", loadKpa: 4.50, description: "Masonry / heavy storage" },
  { cls: 6, label: "Class 6 - Heavy Masonry", loadKpa: 6.00, description: "Special heavy duty" },
];

export const SCAFFOLD_TYPES: { type: ScaffoldType; label: string; deadLoadPerLiftPerM2: number; description: string }[] = [
  { type: "tube-fitting", label: "Tube & Fitting", deadLoadPerLiftPerM2: 0.18, description: "48.3mm x 4.0mm steel tube with couplers" },
  { type: "system", label: "System Scaffold", deadLoadPerLiftPerM2: 0.22, description: "Proprietary system (Layher, HAKI, Cuplok etc)" },
];

export const WIND_ZONES: { zone: WindZone; label: string; basicVelocity: number; description: string }[] = [
  { zone: "sheltered", label: "Sheltered", basicVelocity: 20, description: "Urban, surrounded by buildings" },
  { zone: "normal", label: "Normal", basicVelocity: 25, description: "Suburban, some shelter" },
  { zone: "exposed", label: "Exposed", basicVelocity: 30, description: "Open country, coastal, elevated" },
];

// ─── Standard tube capacity (48.3 x 4.0mm) ──────────────────
// Allowable compressive load depends on effective length (lift height)
// From BS 5975 Table 5 / Perry-Robertson
function tubeCapacity(effectiveLength: number): number {
  // Simplified from BS 5975 capacity tables for Grade S275 tube
  if (effectiveLength <= 1.5) return 62.0;
  if (effectiveLength <= 2.0) return 51.0;
  if (effectiveLength <= 2.5) return 40.0;
  if (effectiveLength <= 3.0) return 31.5;
  return 25.0;
}

// ─── Wind Pressure Calculation (simplified BS EN 1991-1-4) ───
function windPressure(basicVelocity: number, height: number): number {
  // Terrain roughness factor (simplified)
  const roughness = Math.min(1.3, 0.6 + 0.1 * Math.log(Math.max(1, height)));
  const v = basicVelocity * roughness;
  // Dynamic pressure q = 0.5 * rho * v^2
  const rho = 1.225; // kg/m3
  return 0.5 * rho * v * v / 1000; // kN/m2
}

// ─── Force Coefficient ───────────────────────────────────────
function forceCoefficient(sheeted: boolean, debrisNet: boolean): number {
  if (sheeted) return 1.3; // Solid face
  if (debrisNet) return 0.55; // Debris netting ~55% solidity
  return 0.2; // Open scaffold (per frame)
}

// ─── Main Calculation ────────────────────────────────────────
export function calculateScaffoldLoads(inputs: ScaffoldInputs): ScaffoldResult {
  const {
    scaffoldType, numLifts, bayWidth, bayLength, dutyClass,
    loadedBays, sheeted, debrisNet, windZone, freestanding,
  } = inputs;
  const scaffoldHeight = numLifts * LIFT_HEIGHT;

  const typeData = SCAFFOLD_TYPES.find(t => t.type === scaffoldType)!;
  const dutyData = DUTY_CLASSES.find(d => d.cls === dutyClass)!;
  const windData = WIND_ZONES.find(w => w.zone === windZone)!;

  // ── Dead Load
  // Self-weight per lift per m2 of elevation
  const elevationArea = bayLength * LIFT_HEIGHT;
  const deadPerLiftPerStandard = typeData.deadLoadPerLiftPerM2 * elevationArea / 2; // 2 standards per bay
  const deadLoadPerStandard = deadPerLiftPerStandard * numLifts;

  // ── Imposed Load
  // Platform area per bay = bayWidth * bayLength
  const platformArea = bayWidth * bayLength;
  const imposedPerBay = dutyData.loadKpa * platformArea;
  // Each standard carries load from adjacent loaded bays (tributary area)
  // For end standard: 1/2 bay, for internal: 1/2 + 1/2 = 1 bay
  const tributaryBays = Math.min(loadedBays, 1); // Conservative: max 1 bay per standard
  const imposedLoadPerStandard = imposedPerBay * tributaryBays / 2;

  // ── Wind Load
  const qp = windPressure(windData.basicVelocity, scaffoldHeight);
  const cf = forceCoefficient(sheeted, debrisNet);
  const windAreaPerBay = bayLength * scaffoldHeight; // face area
  const windForcePerBay = qp * cf * windAreaPerBay;
  // Wind generates additional axial load in standards (overturning moment)
  // Simplified: wind axial = M / lever arm, where M = wind * h/2
  const windMoment = windForcePerBay * scaffoldHeight / 2;
  const leverArm = bayWidth; // distance between front/back standards
  const windLoadPerStandard = leverArm > 0 ? windMoment / leverArm / (numLifts > 1 ? 2 : 1) : 0;

  // ── Total & Capacity
  const totalLoadPerStandard = deadLoadPerStandard + imposedLoadPerStandard + windLoadPerStandard;
  const allowableCapacity = tubeCapacity(LIFT_HEIGHT);
  const utilisationPercent = Math.round((totalLoadPerStandard / allowableCapacity) * 100);
  const utilisationLevel: UtilisationLevel = utilisationPercent <= 80 ? "safe" : utilisationPercent <= 100 ? "marginal" : "overloaded";

  const loads: LoadBreakdown = {
    deadLoadPerStandard: round2(deadLoadPerStandard),
    imposedLoadPerStandard: round2(imposedLoadPerStandard),
    windLoadPerStandard: round2(windLoadPerStandard),
    totalLoadPerStandard: round2(totalLoadPerStandard),
    allowableCapacity: round2(allowableCapacity),
    utilisationPercent,
    utilisationLevel,
  };

  // ── Unsheeted comparison (if currently sheeted)
  let loadsUnsheeted: LoadBreakdown | null = null;
  if (sheeted || debrisNet) {
    const cfOpen = forceCoefficient(false, false);
    const windForceOpen = qp * cfOpen * windAreaPerBay;
    const windMomentOpen = windForceOpen * scaffoldHeight / 2;
    const windLoadOpen = leverArm > 0 ? windMomentOpen / leverArm / (numLifts > 1 ? 2 : 1) : 0;
    const totalOpen = deadLoadPerStandard + imposedLoadPerStandard + windLoadOpen;
    const utilOpen = Math.round((totalOpen / allowableCapacity) * 100);
    loadsUnsheeted = {
      deadLoadPerStandard: round2(deadLoadPerStandard),
      imposedLoadPerStandard: round2(imposedLoadPerStandard),
      windLoadPerStandard: round2(windLoadOpen),
      totalLoadPerStandard: round2(totalOpen),
      allowableCapacity: round2(allowableCapacity),
      utilisationPercent: utilOpen,
      utilisationLevel: utilOpen <= 80 ? "safe" : utilOpen <= 100 ? "marginal" : "overloaded",
    };
  }

  // ── Tie Calculation
  const tieCapacity = 6.25; // kN typical through-tie
  const tiesPerBay = Math.ceil(windForcePerBay / tieCapacity);
  const maxTieSpacingV = scaffoldHeight / Math.max(1, Math.ceil(numLifts / 2));
  const maxTieSpacingH = bayLength;
  const totalFace = Math.ceil(scaffoldHeight / maxTieSpacingV) * Math.max(1, loadedBays);
  const tieCalc: TieCalc = {
    windForcePerBay: round2(windForcePerBay),
    tieCapacity,
    maxTieSpacingH: round2(maxTieSpacingH),
    maxTieSpacingV: round2(maxTieSpacingV),
    tiesRequired: Math.max(tiesPerBay, totalFace),
  };

  // ── Duty Class Comparison
  const dutyClassComparison = DUTY_CLASSES.map(dc => {
    const imp = dc.loadKpa * platformArea * tributaryBays / 2;
    const total = deadLoadPerStandard + imp + windLoadPerStandard;
    return { dutyClass: dc.cls, label: dc.label, total: round2(total), utilisation: Math.round((total / allowableCapacity) * 100) };
  });

  // ── Design Check Required?
  const needsDesignCheck = scaffoldHeight > 20 || dutyClass >= 5 || sheeted || freestanding || utilisationPercent > 80;

  // ── Recommendations
  const recommendations = generateRecommendations(inputs, loads, tieCalc, needsDesignCheck, scaffoldHeight);

  return { loads, loadsUnsheeted, tieCalc, dutyClassComparison, recommendations, needsDesignCheck };
}

function generateRecommendations(inputs: ScaffoldInputs, loads: LoadBreakdown, ties: TieCalc, needsDesign: boolean, height: number): string[] {
  const recs: string[] = [];

  if (loads.utilisationLevel === "safe") {
    recs.push(`Standard utilisation ${loads.utilisationPercent}% -- within acceptable limits (BS 5975 / SG4:10)`);
  } else if (loads.utilisationLevel === "marginal") {
    recs.push(`WARNING: Standard utilisation ${loads.utilisationPercent}% -- approaching capacity. Review loading assumptions and consider increasing standard spacing or reducing duty class.`);
  } else {
    recs.push(`OVERLOADED: Standard utilisation ${loads.utilisationPercent}% exceeds capacity. Scaffold MUST be redesigned -- reduce loading, add standards, or reduce lift height.`);
  }

  if (needsDesign) {
    recs.push("This scaffold configuration REQUIRES a design check by a competent scaffolding engineer (BS 5975 cl. 6)");
    if (height > 20) recs.push(`Height ${height.toFixed(1)}m exceeds 20m -- full structural design calculation required`);
    if (inputs.sheeted) recs.push("Sheeted scaffold -- wind loads are significantly higher. Full wind analysis per BS EN 1991-1-4 required.");
    if (inputs.freestanding) recs.push("Freestanding scaffold -- stability check required. Consider kentledge or base plate design.");
  }

  recs.push(`Tie pattern: maximum ${ties.maxTieSpacingH.toFixed(1)}m horizontal x ${ties.maxTieSpacingV.toFixed(1)}m vertical centres`);
  recs.push(`Minimum ${ties.tiesRequired} ties required for this configuration (through-tie capacity: ${ties.tieCapacity} kN)`);

  if (inputs.sheeted && inputs.windZone === "exposed") {
    recs.push("CRITICAL: Sheeted scaffold in exposed location -- consider removing sheeting during severe weather or install windbreak measures");
  }

  return recs;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── Styling ─────────────────────────────────────────────────
export const UTIL_STYLES: Record<UtilisationLevel, { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; colour: string }> = {
  safe: { label: "Safe", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", colour: "#22C55E" },
  marginal: { label: "Marginal", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500", colour: "#EAB308" },
  overloaded: { label: "Overloaded", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", colour: "#EF4444" },
};
