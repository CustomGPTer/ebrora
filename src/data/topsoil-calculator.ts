// src/data/topsoil-calculator.ts

// ─── BS 3882:2015 Topsoil Grades ─────────────────────────────
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

export const TOPSOIL_GRADES: TopsoilGrade[] = [
  { id: "multipurpose", name: "Multipurpose Grade", standard: "BS 3882:2015 Clause 4.2", densityLow: 1.3, densityHigh: 1.5, densityMid: 1.4, description: "General-purpose topsoil suitable for a wide range of landscape and amenity uses. Must be free from contaminants and deleterious materials.", suitableFor: "General landscaping, garden beds, lawns, amenity areas, shrub planting", phRange: "5.5 - 8.0", organicContent: "3 - 10% (mass)" },
  { id: "general", name: "General Purpose Grade", standard: "BS 3882:2015 Clause 4.3", densityLow: 1.2, densityHigh: 1.4, densityMid: 1.3, description: "Suitable for amenity planting where a lower specification is acceptable. Wider tolerance on stone content and organic matter.", suitableFor: "Amenity grassland, general planting, roadside verges, reinstatement", phRange: "5.5 - 8.5", organicContent: "2 - 10% (mass)" },
  { id: "economy", name: "Economy Grade", standard: "BS 3882:2015 Clause 4.4", densityLow: 1.1, densityHigh: 1.3, densityMid: 1.2, description: "Lower specification topsoil for low-maintenance areas. Higher stone content permitted. May require amelioration for specialist planting.", suitableFor: "Low-maintenance areas, rough grass, ecological areas, capping", phRange: "5.0 - 9.0", organicContent: "1 - 10% (mass)" },
  { id: "premium", name: "Premium Grade", standard: "BS 3882:2015 Clause 4.5", densityLow: 1.4, densityHigh: 1.6, densityMid: 1.5, description: "Highest specification topsoil for specialist planting and high-quality amenity. Strict controls on stone content, texture, and contaminants.", suitableFor: "Specialist planting, sports turf, high-quality gardens, green roofs", phRange: "5.5 - 7.5", organicContent: "5 - 15% (mass)" },
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
