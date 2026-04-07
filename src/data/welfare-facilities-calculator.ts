// src/data/welfare-facilities-calculator.ts

/* ──────────────────────────────────────────────────────────────
   Welfare Facilities Calculator — CDM 2015 Schedule 2,
   HSG150, BS 6465-1, Workplace (Health Safety & Welfare) Regs 1992
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────

export type SiteType = "new_build" | "refurbishment" | "highway" | "remote";

export interface SiteTypeInfo {
  id: SiteType;
  label: string;
  notes: string;
}

export const SITE_TYPES: SiteTypeInfo[] = [
  { id: "new_build", label: "New Build", notes: "Standard construction site with permanent welfare facilities or cabins" },
  { id: "refurbishment", label: "Refurbishment", notes: "Working within or adjacent to existing buildings — welfare may be constrained" },
  { id: "highway", label: "Highway / Streetworks", notes: "Linear works where welfare may need to be mobile or at designated layby/depot" },
  { id: "remote", label: "Remote / Rural", notes: "Limited access to mains water and drainage — self-contained units likely required" },
];

export type ComplianceStatus = "compliant" | "borderline" | "non_compliant";

export interface FacilityRequirement {
  id: string;
  label: string;
  category: "sanitary" | "hygiene" | "rest" | "first_aid" | "storage";
  required: number;
  provided: number;
  status: ComplianceStatus;
  regulation: string;
  notes: string;
}

export interface WelfareUnitConfig {
  label: string;
  description: string;
  suitableFor: string;
  provides: string[];
}

// ── Constants & Calculation Logic ──────────────────────────────

/**
 * Calculate toilet requirements per HSG150 Table 2 (construction sites)
 * Male WCs: stepped lookup per HSG150 — 1 per 7 (small sites) to 1 per 15 (large sites)
 * Female: per BS 6465-1:2006 female ratios (more generous than male)
 * Construction site simplified: HSG150 is the primary reference for site welfare
 */

export function calcMaleToilets(count: number): { wcs: number; urinals: number } {
  if (count <= 0) return { wcs: 0, urinals: 0 };
  // HSG150 Table 2 — construction site toilet provision
  let wcs: number;
  if (count <= 7) wcs = 1;
  else if (count <= 20) wcs = 2;
  else if (count <= 35) wcs = 3;
  else if (count <= 50) wcs = 4;
  else if (count <= 65) wcs = 5;
  else if (count <= 80) wcs = 6;
  else wcs = 6 + Math.ceil((count - 80) / 15);
  const urinals = count <= 6 ? 0 : Math.max(1, Math.ceil(count / 25));
  return { wcs, urinals };
}

export function calcFemaleToilets(count: number): number {
  if (count <= 0) return 0;
  // BS 6465: female ratios are more generous
  if (count <= 12) return 1;
  if (count <= 25) return 2;
  if (count <= 40) return 3;
  if (count <= 57) return 4;
  if (count <= 77) return 5;
  if (count <= 100) return 6;
  return 6 + Math.ceil((count - 100) / 25);
}

export function calcWashStations(total: number): number {
  if (total <= 0) return 0;
  // HSG150: 1 wash station per 20 operatives (minimum)
  return Math.max(1, Math.ceil(total / 20));
}

export function calcDrinkingWater(total: number): number {
  if (total <= 0) return 0;
  // 1 point per 50 operatives (min 1)
  return Math.max(1, Math.ceil(total / 50));
}

export function calcChangingCapacity(total: number): number {
  // Changing/drying: seating for at least 40% of peak operatives on site
  if (total <= 0) return 0;
  return Math.max(4, Math.ceil(total * 0.4));
}

export function calcRestSeating(total: number): number {
  // Rest/eating: seating for all operatives not accommodated in staggered breaks
  // Assume 60% concurrent break occupancy
  if (total <= 0) return 0;
  return Math.max(4, Math.ceil(total * 0.6));
}

export function calcFirstAidRooms(total: number, riskAssessmentRequired: boolean): number {
  // HSG150: first aid room required if >250 operatives or risk assessment requires
  if (riskAssessmentRequired) return 1;
  if (total >= 250) return Math.ceil(total / 250);
  return 0;
}

export function calcPPEStorage(total: number): number {
  // Secure ventilated storage — 1 locker/space per operative
  return total;
}

// ── Compliance Check ───────────────────────────────────────────

export function getComplianceStatus(required: number, provided: number): ComplianceStatus {
  if (provided >= required) return "compliant";
  if (provided >= required * 0.8) return "borderline";
  return "non_compliant";
}

export const STATUS_COLOURS: Record<ComplianceStatus, { bg: string; text: string; dot: string; label: string }> = {
  compliant: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Compliant" },
  borderline: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Borderline" },
  non_compliant: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Non-Compliant" },
};

// ── Welfare Unit Configurations ────────────────────────────────

export function getRecommendedUnits(
  totalOperatives: number,
  maleCount: number,
  femaleCount: number,
  siteType: SiteType,
  durationWeeks: number,
): WelfareUnitConfig[] {
  const configs: WelfareUnitConfig[] = [];

  if (totalOperatives <= 6) {
    configs.push({
      label: "1x 16ft Anti-Vandal Welfare Unit",
      description: "Compact all-in-one unit suitable for small gangs",
      suitableFor: "Up to 6 operatives",
      provides: ["1 WC", "1 wash basin", "Seating for 6", "Hot water boiler", "Drying area", "Microwave"],
    });
  } else if (totalOperatives <= 15) {
    configs.push({
      label: "1x 24ft Anti-Vandal Welfare Unit",
      description: "Standard welfare cabin with canteen and toilet",
      suitableFor: "Up to 15 operatives",
      provides: ["1 WC", "2 wash basins", "Seating for 12", "Hot water boiler", "Drying area", "Microwave", "Fridge"],
    });
    if (femaleCount > 0) {
      configs.push({
        label: "1x Portable Toilet Unit (Female)",
        description: "Separate female WC provision per CDM 2015",
        suitableFor: "Female operatives",
        provides: ["1 WC (female)", "1 wash basin", "Sanitary disposal"],
      });
    }
  } else if (totalOperatives <= 30) {
    configs.push({
      label: "1x 32ft Anti-Vandal Welfare Unit",
      description: "Large welfare cabin with multiple WCs and full canteen",
      suitableFor: "Up to 30 operatives",
      provides: ["2 WCs", "1 urinal", "3 wash basins", "Seating for 20", "Hot water boiler", "Microwave", "Fridge", "Drying area"],
    });
    if (femaleCount > 0) {
      configs.push({
        label: "1x 16ft Female Welfare Unit",
        description: "Dedicated female facilities per CDM 2015",
        suitableFor: "Female operatives",
        provides: ["1 WC (female)", "1 wash basin", "Changing area", "Sanitary disposal"],
      });
    }
    if (totalOperatives > 20) {
      configs.push({
        label: "1x 16ft Drying Room",
        description: "Additional drying capacity for wet weather or dirty work",
        suitableFor: "All operatives",
        provides: ["Heated drying space", "Boot rack", "Coat hooks"],
      });
    }
  } else if (totalOperatives <= 60) {
    configs.push({
      label: "2x 32ft Anti-Vandal Welfare Units",
      description: "One canteen/rest unit + one WC/wash unit",
      suitableFor: "Up to 60 operatives",
      provides: ["4 WCs (male)", "2 urinals", "6 wash basins", "Seating for 40", "Hot water boiler", "Microwave", "Fridge"],
    });
    if (femaleCount > 0) {
      configs.push({
        label: "1x 24ft Female Welfare Unit",
        description: "Dedicated female changing, WC and rest facilities",
        suitableFor: "Female operatives",
        provides: [`${calcFemaleToilets(femaleCount)} WCs (female)`, "2 wash basins", "Changing area", "Sanitary disposal"],
      });
    }
    configs.push({
      label: "1x 24ft Drying Room",
      description: "Essential for sites with wet or dirty conditions",
      suitableFor: "All operatives",
      provides: ["Heated drying space", "Boot rack", "Coat hooks", "Ventilation"],
    });
  } else if (totalOperatives <= 100) {
    configs.push({
      label: "2x 32ft Welfare Units + 1x 32ft Canteen Unit",
      description: "Staggered break arrangements with dedicated canteen",
      suitableFor: "Up to 100 operatives",
      provides: ["6 WCs (male)", "3 urinals", "8 wash basins", "Seating for 60", "2 microwaves", "2 fridges", "Hot water boilers"],
    });
    if (femaleCount > 0) {
      configs.push({
        label: "1x 32ft Female Welfare Unit",
        description: "Full female welfare with canteen area",
        suitableFor: "Female operatives",
        provides: [`${calcFemaleToilets(femaleCount)} WCs (female)`, "3 wash basins", "Changing area", "Seating for ${femaleCount}", "Sanitary disposal"],
      });
    }
    configs.push({
      label: "1x 32ft Drying Room",
      description: "Large drying room for peak workforce",
      suitableFor: "All operatives",
      provides: ["Heated drying space", "Boot racks", "Coat hooks", "Ventilation"],
    });
  } else {
    // 100+ operatives
    const welfareUnits = Math.ceil(totalOperatives / 50);
    const canteenUnits = Math.ceil(totalOperatives / 60);
    configs.push({
      label: `${welfareUnits}x 32ft Welfare Units + ${canteenUnits}x 32ft Canteen Units`,
      description: "Large site welfare compound — consider separate toilet and canteen blocks",
      suitableFor: `Up to ${totalOperatives} operatives`,
      provides: [
        `${Math.ceil(maleCount / 15)} WCs (male)`,
        `${Math.ceil(maleCount / 25)} urinals`,
        `${calcWashStations(totalOperatives)} wash basins`,
        `Seating for ${calcRestSeating(totalOperatives)}`,
        "Multiple microwaves, fridges, hot water boilers",
      ],
    });
    if (femaleCount > 0) {
      const femaleUnits = Math.max(1, Math.ceil(femaleCount / 25));
      configs.push({
        label: `${femaleUnits}x 24ft Female Welfare Unit(s)`,
        description: "Dedicated female facilities with full welfare provision",
        suitableFor: `${femaleCount} female operatives`,
        provides: [`${calcFemaleToilets(femaleCount)} WCs (female)`, `${Math.ceil(femaleCount / 10)} wash basins`, "Changing areas", "Sanitary disposal"],
      });
    }
    configs.push({
      label: `${Math.ceil(totalOperatives / 60)}x 32ft Drying Rooms`,
      description: "Essential for large workforce — locate near access points",
      suitableFor: "All operatives",
      provides: ["Heated drying space", "Boot racks", "Coat hooks"],
    });
  }

  // Site type adjustments
  if (siteType === "remote") {
    configs.push({
      label: "Self-Contained Water Supply",
      description: "Fresh water tank + grey water tank for sites without mains connection",
      suitableFor: "Remote sites",
      provides: ["Potable water supply", "Grey water storage", "Bowser top-up schedule required"],
    });
  }
  if (siteType === "highway") {
    configs.push({
      label: "Mobile Welfare Vehicle",
      description: "Towable welfare unit for linear highway works — relocatable as works progress",
      suitableFor: "Highway / streetworks",
      provides: ["WC", "Wash basin", "Seating for 4-6", "Hot water", "Heating"],
    });
  }
  if (durationWeeks > 26) {
    configs.push({
      label: "Welfare Compound Fencing & Lighting",
      description: "For long-duration sites — secure compound with adequate lighting and signage",
      suitableFor: `Sites over 6 months (${durationWeeks} weeks)`,
      provides: ["Heras/anti-climb fencing", "LED floodlighting", "Signage", "Hard standing / trackway"],
    });
  }

  return configs;
}

// ── CDM Compliance Checklist ───────────────────────────────────

export interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  regulation: string;
}

export const CDM_CHECKLIST: ChecklistItem[] = [
  { id: "wc_provision", category: "Sanitary", requirement: "Suitable and sufficient sanitary conveniences at readily accessible places", regulation: "CDM 2015 Sch.2 Para.2" },
  { id: "wc_separate", category: "Sanitary", requirement: "Separate rooms for men and women (or lockable rooms used by one person at a time)", regulation: "CDM 2015 Sch.2 Para.2(3)" },
  { id: "wc_ventilated", category: "Sanitary", requirement: "Conveniences adequately ventilated and lit", regulation: "CDM 2015 Sch.2 Para.2(2)" },
  { id: "wc_clean", category: "Sanitary", requirement: "Kept in a clean and orderly condition", regulation: "CDM 2015 Sch.2 Para.2(2)" },
  { id: "wash_hot_cold", category: "Hygiene", requirement: "Wash facilities with hot and cold (or warm) running water, soap, and towels/dryers", regulation: "CDM 2015 Sch.2 Para.3" },
  { id: "wash_adjacent", category: "Hygiene", requirement: "Washing facilities in the immediate vicinity of sanitary conveniences", regulation: "CDM 2015 Sch.2 Para.3(3)" },
  { id: "wash_separate", category: "Hygiene", requirement: "Separate facilities for men and women where necessary for privacy", regulation: "CDM 2015 Sch.2 Para.3(5)" },
  { id: "wash_showers", category: "Hygiene", requirement: "Showers provided where required by the nature of the work or health reasons", regulation: "CDM 2015 Sch.2 Para.3(6)" },
  { id: "water_drinking", category: "Hygiene", requirement: "Wholesome drinking water readily accessible and conspicuously marked", regulation: "CDM 2015 Sch.2 Para.4" },
  { id: "water_cups", category: "Hygiene", requirement: "Cups or drinking vessels provided (unless water supplied via drinking fountain)", regulation: "CDM 2015 Sch.2 Para.4(2)" },
  { id: "changing_room", category: "Changing", requirement: "Changing rooms provided where operatives wear special clothing and cannot be expected to change elsewhere", regulation: "CDM 2015 Sch.2 Para.5" },
  { id: "changing_secure", category: "Changing", requirement: "Secure storage for personal clothing not worn at work and for special/protective clothing", regulation: "CDM 2015 Sch.2 Para.5(2)" },
  { id: "changing_drying", category: "Changing", requirement: "Facilities for drying clothing that has become wet", regulation: "CDM 2015 Sch.2 Para.5(3)" },
  { id: "rest_seating", category: "Rest", requirement: "Rest facilities with adequate seating and tables", regulation: "CDM 2015 Sch.2 Para.6" },
  { id: "rest_heated", category: "Rest", requirement: "Rest facilities include arrangements for preparing and eating meals (heating food, boiling water)", regulation: "CDM 2015 Sch.2 Para.6(2)" },
  { id: "rest_shelter", category: "Rest", requirement: "Suitable and sufficient facilities for shelter from adverse weather where work is outdoors", regulation: "CDM 2015 Sch.2 Para.6(3)" },
  { id: "first_aid", category: "First Aid", requirement: "Adequate first aid provision (first aid box as minimum; first aid room if >250 or risk assessment requires)", regulation: "H&S (First Aid) Regs 1981" },
  { id: "first_aid_personnel", category: "First Aid", requirement: "Appointed person or trained first aider available at all times during working hours", regulation: "H&S (First Aid) Regs 1981 Reg.3" },
];

// ── Full Requirements Calculation ──────────────────────────────

export interface FullRequirements {
  maleWCs: number;
  maleUrinals: number;
  femaleWCs: number;
  washStations: number;
  drinkingWaterPoints: number;
  changingSeats: number;
  restSeats: number;
  firstAidRooms: number;
  ppeLockers: number;
  dryingRequired: boolean;
  showerRequired: boolean;
}

export function calculateRequirements(
  totalOperatives: number,
  femalePercent: number,
  siteType: SiteType,
  durationWeeks: number,
  firstAidRARequired: boolean,
): FullRequirements {
  const femaleCount = Math.round(totalOperatives * femalePercent / 100);
  const maleCount = totalOperatives - femaleCount;

  const male = calcMaleToilets(maleCount);
  const femaleWCs = calcFemaleToilets(femaleCount);

  return {
    maleWCs: male.wcs,
    maleUrinals: male.urinals,
    femaleWCs,
    washStations: calcWashStations(totalOperatives),
    drinkingWaterPoints: calcDrinkingWater(totalOperatives),
    changingSeats: calcChangingCapacity(totalOperatives),
    restSeats: calcRestSeating(totalOperatives),
    firstAidRooms: calcFirstAidRooms(totalOperatives, firstAidRARequired),
    ppeLockers: calcPPEStorage(totalOperatives),
    dryingRequired: siteType !== "refurbishment" || true, // Always required on construction sites
    showerRequired: siteType === "remote" || durationWeeks > 13,
  };
}
