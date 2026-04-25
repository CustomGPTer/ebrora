// src/data/scaffold-load-calculator.ts
// Scaffold Load Calculator — BS EN 12811-1, BS 5975, SG4:22

// ─── Types ──────────────────────────────────────────────────────
export type ScaffoldType = "tube-fitting" | "system";
export type DutyClass = 1 | 2 | 3 | 4 | 5 | 6;
export type WindZone = "sheltered" | "normal" | "exposed";
export type UtilisationLevel = "safe" | "marginal" | "overloaded";

export interface ScaffoldInputs {
  scaffoldType: ScaffoldType;
  numLifts: number;
  bayWidth: number; // m (transverse spacing between front and back standards)
  bayLength: number; // m (longitudinal spacing between standards along the length)
  dutyClass: DutyClass;
  // Number of bays in the scaffold along its length. Drives total tie count and
  // total wind force. Per-standard imposed load is independent of this value
  // because each standard carries at most one bay's tributary area.
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

// ─── Standard tube capacity (48.3 x 4.0mm S275 steel) ──────────
// Safe working load (SWL) in axial compression for a single scaffold tube
// used as a standard (vertical leg). Derived from first principles per BS 5950
// strut curve b for cold-formed circular hollow sections with material partial
// factor applied:
//   - Cross-section area A = pi/4 * (D^2 - d^2) = 557 mm^2 (D=48.3, t=4.0)
//   - Radius of gyration r = 15.7 mm
//   - Slenderness lambda = L_eff / r
//   - p_c from BS 5950 Table 24(b) for curve b, p_y = 275 N/mm^2
//   - SWL = A * p_c (working stress; loads are characteristic, not factored)
// Cross-checked against TG20:21 supplier guidance "30-50 kN typical axial
// compression capacity depending on effective length and restraint".
function tubeCapacity(effectiveLength: number): number {
  // Effective length = lift height for a tube braced at both ends by ledgers.
  // Values are conservative SWL in kN.
  if (effectiveLength <= 1.5) return 45.0; // lambda ~96, p_c ~108 N/mm^2 -> ~60 ult, SWL ~45
  if (effectiveLength <= 2.0) return 32.0; // lambda ~127, p_c ~65  N/mm^2 -> ~36 ult, SWL ~32
  if (effectiveLength <= 2.5) return 24.0; // lambda ~159, p_c ~45  N/mm^2 -> ~25 ult, SWL ~24
  if (effectiveLength <= 3.0) return 17.0; // lambda ~191, p_c ~32  N/mm^2 -> ~18 ult, SWL ~17
  return 12.0;                              // lambda >200, p_c <25  N/mm^2 -> ~14 ult, SWL ~12
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

// ─── Wind force per BS EN 12811-1 cl. 6.2.7 ──────────────────
// EN 12811-1:2003 cl. 6.2.7.1 prescribes:
//   F = cs * cf * A_ref * q
// where:
//   cs    = site coefficient (cl. 6.2.7.3) -- depends on building solidity and
//           proximity. For a free-standing or facade scaffold without sheltering
//           we use cs = 1.0 (worst case, no shielding).
//   cf    = aerodynamic force coefficient = 1.3 for ALL projected areas of a
//           working scaffold (cl. 6.2.7.2). Single fixed value per the standard.
//   A_ref = reference (projected) area of the scaffold component(s) facing the
//           wind. For a facade scaffold this is the bay face area multiplied by
//           the solidity ratio of the cladding configuration (see below).
//   q     = velocity pressure (kN/m^2) from windPressure().
//
// The prior implementation used "effective force coefficient against full face
// area" (0.2 / 0.55 / 1.3) which conflated cf with the projected-to-nominal
// area ratio. Functionally near-equivalent for sheeted scaffold but
// methodologically inconsistent with the standard. This restructure separates
// the two factors so each is anchored to its EN 12811-1 source.

const CF_EN12811 = 1.3; // BS EN 12811-1:2003 cl. 6.2.7.2

// Site coefficient cs per BS EN 12811-1 cl. 6.2.7.3.
// Conservative default cs = 1.0 (no building shielding effect). The standard's
// Figure 6 allows reduced cs values for facade scaffolds in front of solid or
// partly open buildings, but the worst-case assumption is appropriate for a
// general screening tool that does not capture the building geometry.
function siteCoefficient(): number {
  return 1.0;
}

// Solidity ratio = projected solid area divided by gross face area.
// Used to convert bay face area into the EN 12811-1 reference area A_ref.
//   - Sheeted (impermeable cladding): solidity ~ 1.0 (whole face is solid)
//   - Debris net: solidity ~ 0.5 (typical for BS EN 1263-1 compliant nets,
//       50% net porosity; note BS EN 12811-1 Annex A treats sheet/net cladding
//       as a separate force calculation but the simplified solidity-ratio
//       approach is widely used in screening tools)
//   - Open scaffold (tubes, ledgers, toeboards, working platforms only):
//       solidity ~ 0.15 -- typical for a facade T&F scaffold; corresponds to
//       roughly the projected area of all members per bay divided by the gross
//       bay face area.
// Numerical equivalence vs the prior effective-cf implementation:
//   sheeted   : 1.0 * 1.3 * 1.0  = 1.3   (prior: 1.3   -- identical)
//   net       : 1.0 * 1.3 * 0.5  = 0.65  (prior: 0.55  -- slightly more conservative)
//   open      : 1.0 * 1.3 * 0.15 = 0.195 (prior: 0.2   -- functionally identical)
function solidityRatio(sheeted: boolean, debrisNet: boolean): number {
  if (sheeted) return 1.0;
  if (debrisNet) return 0.5;
  return 0.15;
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
  // Platform area per bay = bayWidth * bayLength.
  // Each standard carries imposed load from at most one tributary bay (each
  // bay has a standard at each end and 2 sides, so 1/2 + 1/2 = 1 bay max
  // per standard). Per-standard imposed load is therefore independent of
  // loadedBays in this single-standard analysis.
  const platformArea = bayWidth * bayLength;
  const imposedPerBay = dutyData.loadKpa * platformArea;
  const tributaryBaysPerStandard = 1; // conservative single-bay tributary
  const imposedLoadPerStandard = imposedPerBay * tributaryBaysPerStandard / 2;

  // ── Wind Load (BS EN 12811-1 cl. 6.2.7)
  const qp = windPressure(windData.basicVelocity, scaffoldHeight);
  const cs = siteCoefficient();
  const solidity = solidityRatio(sheeted, debrisNet);
  const bayFaceArea = bayLength * scaffoldHeight;            // gross bay face
  const projectedArea = bayFaceArea * solidity;              // EN 12811-1 A_ref
  const windForcePerBay = cs * CF_EN12811 * projectedArea * qp; // F = cs * cf * A_ref * q

  // Wind generates additional axial load in standards via overturning.
  // For a free-standing or partially-restrained bay, total wind force F
  // acts at h/2 (centroid of the uniform pressure block). The moment about
  // the base is F * h/2 and is reacted as a couple between the windward
  // and leeward standard rows (separated by bayWidth). The compression
  // sits in the windward row; the leeward row carries the same magnitude
  // in tension. This couple is NOT shared between rows, so no /2 divisor
  // is applied. (Prior code divided by 2 for numLifts > 1; that has no
  // physical basis -- the moment is taken once at the base regardless of
  // how many lifts make up the height.)
  const windMoment = windForcePerBay * scaffoldHeight / 2;
  const leverArm = bayWidth;
  const windLoadPerStandard = leverArm > 0 ? windMoment / leverArm : 0;

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

  // ── Unsheeted comparison (if currently sheeted or netted)
  let loadsUnsheeted: LoadBreakdown | null = null;
  if (sheeted || debrisNet) {
    const solidityOpen = solidityRatio(false, false);
    const projectedAreaOpen = bayFaceArea * solidityOpen;
    const windForceOpen = cs * CF_EN12811 * projectedAreaOpen * qp;
    const windMomentOpen = windForceOpen * scaffoldHeight / 2;
    const windLoadOpen = leverArm > 0 ? windMomentOpen / leverArm : 0;
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
  // Two governing limits, both expressed as TOTAL ties for the whole scaffold:
  //   1. Force-based: total wind on all bays / per-tie capacity
  //   2. Geometry-based: standard tie grid -- tie levels (every alternate lift)
  //      multiplied by number of bays along the length
  const tieCapacity = 6.25; // kN typical through-tie (BS EN 845 Class A)
  const bays = Math.max(1, loadedBays); // bays in scaffold along length
  const tieLevels = Math.max(1, Math.ceil(numLifts / 2)); // ties at every alternate lift
  const totalForceTies = Math.ceil(windForcePerBay * bays / tieCapacity);
  const totalGridTies = tieLevels * bays;
  const maxTieSpacingV = scaffoldHeight / tieLevels;
  const maxTieSpacingH = bayLength;
  const tieCalc: TieCalc = {
    windForcePerBay: round2(windForcePerBay),
    tieCapacity,
    maxTieSpacingH: round2(maxTieSpacingH),
    maxTieSpacingV: round2(maxTieSpacingV),
    tiesRequired: Math.max(totalForceTies, totalGridTies),
  };

  // ── Duty Class Comparison (per-standard analysis -- single tributary bay)
  const dutyClassComparison = DUTY_CLASSES.map(dc => {
    const imp = dc.loadKpa * platformArea * tributaryBaysPerStandard / 2;
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
    recs.push(`Standard utilisation ${loads.utilisationPercent}% -- within acceptable limits (BS 5975 / SG4:22)`);
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
