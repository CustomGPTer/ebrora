// src/data/topsoil-calculator.ts

// ─── BS 3882:2015 Topsoil Classification ─────────────────────
// Per BS 3882:2015 Clause 4.1, topsoil shall be classified as either:
//   (a) multipurpose topsoil; or
//   (b) specific purpose topsoil (further classified as: acidic; calcareous;
//       low fertility; low fertility acidic; low fertility calcareous).
// The standard does NOT define density per type — density depends on soil
// texture and moisture. Typical loose-tipped values for UK topsoils are
// 1.1–1.5 t/m³; this is applied as the default range for all types.
export interface TopsoilGrade {
  id: string;
  name: string;
  standard: string;
  densityLow: number;  // t/m3 loose
  densityHigh: number;
  densityMid: number;
  description: string;
  suitableFor: string;
  phRange: string;
  organicContent: string;
}

// Default density range applied to all BS 3882:2015 types (texture-driven, not type-driven)
const TS_DENSITY_LOW = 1.1;
const TS_DENSITY_MID = 1.3;
const TS_DENSITY_HIGH = 1.5;

export const TOPSOIL_GRADES: TopsoilGrade[] = [
  { id: "multipurpose", name: "Multipurpose Topsoil", standard: "BS 3882:2015 Clause 4.1(a)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "The grade suited to most situations where topsoil is required. Meets defined criteria for general landscape and amenity use, with controls on texture, pH, organic matter, soluble salts, and contaminants.", suitableFor: "General landscaping, garden beds, lawns, amenity grass, shrub planting, sports turf, reinstatement, highway verges", phRange: "5.5 - 8.5", organicContent: "3 - 20% (mass loss on ignition)" },
  { id: "sp-acidic", name: "Specific Purpose — Acidic", standard: "BS 3882:2015 Clause 4.1(b)(1)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "Specific purpose topsoil with acidic soil profile. Suitable for ericaceous and calcifuge plants requiring low pH conditions.", suitableFor: "Ericaceous beds, heathland reinstatement, rhododendrons, azaleas, blueberries, conifer planting", phRange: "3.5 - 5.5", organicContent: "5 - 30% (mass loss on ignition)" },
  { id: "sp-calcareous", name: "Specific Purpose — Calcareous", standard: "BS 3882:2015 Clause 4.1(b)(2)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "Specific purpose topsoil with high pH and free carbonate. Suitable for calcicole plants and chalk grassland habitat creation.", suitableFor: "Calcareous grassland, chalk habitat creation, calcicole planting, lime-loving species", phRange: "7.5 - 9.0", organicContent: "5 - 20% (mass loss on ignition)" },
  { id: "sp-low-fert", name: "Specific Purpose — Low Fertility", standard: "BS 3882:2015 Clause 4.1(b)(3)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "Specific purpose topsoil of low fertility (low extractable phosphate). Used to support biodiverse habitats such as species-rich grassland and wildflower meadows.", suitableFor: "Wildflower meadows, species-rich grassland, biodiversity habitats, ecological reinstatement", phRange: "3.5 - 9.0", organicContent: "2 - 20% (mass loss on ignition)" },
  { id: "sp-lf-acidic", name: "Specific Purpose — Low Fertility Acidic", standard: "BS 3882:2015 Clause 4.1(b)(4)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "Specific purpose topsoil combining low fertility and acidic profile. Supports acid heathland and acid grassland habitats.", suitableFor: "Acid heathland, acid grassland, lowland heath habitat creation", phRange: "3.5 - 5.5", organicContent: "2 - 30% (mass loss on ignition)" },
  { id: "sp-lf-calcareous", name: "Specific Purpose — Low Fertility Calcareous", standard: "BS 3882:2015 Clause 4.1(b)(5)", densityLow: TS_DENSITY_LOW, densityHigh: TS_DENSITY_HIGH, densityMid: TS_DENSITY_MID, description: "Specific purpose topsoil combining low fertility and calcareous profile. Supports chalk grassland and calcareous wildflower habitats.", suitableFor: "Chalk wildflower grassland, calcareous biodiversity habitats, downland reinstatement", phRange: "7.5 - 9.0", organicContent: "2 - 20% (mass loss on ignition)" },
];

// ─── Depth Guidance ──────────────────────────────────────────
export interface DepthGuidance {
  application: string;
  depthMM: number;
  notes: string;
}

export const DEPTH_GUIDANCE: DepthGuidance[] = [
  { application: "Wildflower meadow", depthMM: 100, notes: "Thin layer encourages wildflower establishment over grasses." },
  { application: "Lawns / amenity grass", depthMM: 150, notes: "Standard depth for domestic and amenity lawns." },
  { application: "Sports turf (general)", depthMM: 200, notes: "Deeper rootzone for wear resistance." },
  { application: "Shrub beds / border planting", depthMM: 300, notes: "Allows root development for shrubs." },
  { application: "Hedge planting", depthMM: 450, notes: "Deep preparation for hedge establishment." },
  { application: "Tree pits (individual)", depthMM: 600, notes: "Minimum for pit-planted trees. Larger pits preferred." },
  { application: "Tree pit (structural soil)", depthMM: 900, notes: "Structural tree pit systems for urban planting." },
  { application: "Green roof substrate", depthMM: 150, notes: "Extensive green roof. Specialist lightweight substrate." },
  { application: "Raised bed / planter", depthMM: 400, notes: "Minimum for productive raised beds." },
  { application: "Reinstatement (highway verge)", depthMM: 150, notes: "Minimum per DMRB for highway verge reinstatement." },
  { application: "Agricultural restoration", depthMM: 300, notes: "Minimum for return to agricultural use." },
];

// ─── Default Settings ────────────────────────────────────────
export const DEFAULTS = {
  costPerTonne: 35,      // GBP per tonne delivered
  wagonCapacity: 20,     // tonnes per wagon
  bulkBagWeight: 0.85,   // tonnes per bulk bag (850kg)
  settlementPercent: 15,  // % settlement factor
} as const;

// ─── Calculations ────────────────────────────────────────────
export interface AreaEntry {
  id: string;
  name: string;
  areaSqM: number | null;
  depthMM: number | null;
}

export interface AreaResult {
  id: string;
  name: string;
  areaSqM: number;
  depthMM: number;
  volumeM3: number;
  volumeWithSettlement: number;
  tonnageLow: number;
  tonnageMid: number;
  tonnageHigh: number;
}

export function calculateArea(
  entry: AreaEntry,
  density: { low: number; mid: number; high: number },
  settlementPercent: number,
): AreaResult | null {
  if (!entry.areaSqM || !entry.depthMM || entry.areaSqM <= 0 || entry.depthMM <= 0) return null;
  const depthM = entry.depthMM / 1000;
  const vol = entry.areaSqM * depthM;
  const volSettlement = vol * (1 + settlementPercent / 100);
  return {
    id: entry.id,
    name: entry.name || "Unnamed area",
    areaSqM: entry.areaSqM,
    depthMM: entry.depthMM,
    volumeM3: vol,
    volumeWithSettlement: volSettlement,
    tonnageLow: volSettlement * density.low,
    tonnageMid: volSettlement * density.mid,
    tonnageHigh: volSettlement * density.high,
  };
}
