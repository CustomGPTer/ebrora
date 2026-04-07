// src/data/first-aid-needs-calculator.ts
// First Aid Needs Assessment — HSE L74, BS 8599-1, supplementary equipment

// ─── Types ──────────────────────────────────────────────────────
export type RiskLevel = "low" | "medium" | "high";
export type ComplianceStatus = "compliant" | "shortfall" | "not-assessed";
export type SpecificHazard = "chemical-burns" | "electrocution" | "drowning" | "crush-injury" | "fall-from-height" | "thermal-burns" | "eye-injury" | "amputation";

export interface SiteInputs {
  totalWorkers: number;
  riskLevel: RiskLevel;
  numShifts: number;
  multipleLocations: boolean;
  numLocations: number;
  distanceToAE: "under10" | "10to30" | "over30";
  specificHazards: SpecificHazard[];
}

export interface CurrentProvision {
  fawFirstAiders: number;
  efawAppointed: number;
  firstAidKits: number;
  aedUnits: number;
}

export interface FirstAidRequirement {
  fawFirstAiders: number;
  efawAppointed: number;
  firstAidKits: number;
  aedRecommended: number;
  perShiftFAW: number;
  perShiftEFAW: number;
  perLocationKits: number;
  supplementaryEquipment: SupplementaryItem[];
  shiftCoverage: ShiftCoverage[];
}

export interface ShiftCoverage {
  shiftNumber: number;
  fawRequired: number;
  efawRequired: number;
  kitsRequired: number;
}

export interface SupplementaryItem {
  item: string;
  reason: string;
  hazard: SpecificHazard;
  quantity: number;
}

export interface ComplianceCheck {
  item: string;
  required: number;
  current: number | null;
  status: ComplianceStatus;
  shortfall: number;
}

export interface FirstAidResult {
  requirements: FirstAidRequirement;
  complianceChecks: ComplianceCheck[];
  overallCompliant: boolean;
  recommendations: string[];
  kitContents: KitItem[];
}

export interface KitItem {
  item: string;
  smallKit: string; // 1-10 persons
  mediumKit: string; // 11-50 persons
  largeKit: string; // 50+ persons
  travelKit: string;
}

// ─── Risk Level Definitions ──────────────────────────────────
export const RISK_LEVELS: { level: RiskLevel; label: string; description: string; examples: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }[] = [
  { level: "low", label: "Low Risk", description: "Offices, shops, libraries, light clerical work", examples: "Site office, design office, stores", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
  { level: "medium", label: "Medium Risk", description: "Light manufacturing, assembly, food processing, warehousing", examples: "Prefab workshop, laydown area, logistics yard", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" },
  { level: "high", label: "High Risk", description: "Construction, heavy manufacturing, chemicals, confined spaces", examples: "Live construction site, WwTW, demolition, tunnelling", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
];

export function getRiskLevelDef(level: RiskLevel) {
  return RISK_LEVELS.find(r => r.level === level)!;
}

// ─── Specific Hazards ────────────────────────────────────────
export const SPECIFIC_HAZARDS: { id: SpecificHazard; label: string; description: string }[] = [
  { id: "chemical-burns", label: "Chemical burns", description: "Acids, alkalis, solvents, cement" },
  { id: "electrocution", label: "Electrocution risk", description: "HV/LV work, temporary electrics" },
  { id: "drowning", label: "Drowning / near water", description: "Rivers, tanks, deep excavations with water" },
  { id: "crush-injury", label: "Crush / entrapment", description: "Heavy plant, excavations, structural collapse" },
  { id: "fall-from-height", label: "Falls from height", description: "Scaffolding, roofwork, steelwork" },
  { id: "thermal-burns", label: "Thermal burns", description: "Hot works, welding, asphalt, molten materials" },
  { id: "eye-injury", label: "Eye injury risk", description: "Grinding, cutting, chemical splash, dust" },
  { id: "amputation", label: "Amputation risk", description: "Unguarded machinery, power tools, chainsaws" },
];

// ─── Supplementary Equipment by Hazard ───────────────────────
function getSupplementaryEquipment(hazards: SpecificHazard[], numLocations: number): SupplementaryItem[] {
  const items: SupplementaryItem[] = [];
  const perLoc = Math.max(1, numLocations);

  if (hazards.includes("chemical-burns")) {
    items.push({ item: "Chemical burns kit (Diphoterine or water gel)", reason: "Required for acid/alkali splash first aid", hazard: "chemical-burns", quantity: perLoc });
    items.push({ item: "Emergency eye wash station (500ml min)", reason: "Required within 10 seconds of chemical splash risk", hazard: "chemical-burns", quantity: perLoc });
  }
  if (hazards.includes("electrocution")) {
    items.push({ item: "Automated External Defibrillator (AED)", reason: "Cardiac arrest risk from electrocution -- AED significantly improves survival", hazard: "electrocution", quantity: perLoc });
    items.push({ item: "Insulated rescue hook", reason: "For safe rescue of electrocution casualties", hazard: "electrocution", quantity: perLoc });
  }
  if (hazards.includes("drowning")) {
    items.push({ item: "Throw line / rescue buoy", reason: "Required near open water or deep excavations", hazard: "drowning", quantity: Math.ceil(perLoc * 1.5) });
    items.push({ item: "Automated External Defibrillator (AED)", reason: "Drowning casualties frequently require defibrillation", hazard: "drowning", quantity: perLoc });
  }
  if (hazards.includes("crush-injury")) {
    items.push({ item: "Crush injury / blast injury kit", reason: "Tourniquet and haemostatic dressing for severe crush injuries", hazard: "crush-injury", quantity: perLoc });
  }
  if (hazards.includes("fall-from-height")) {
    items.push({ item: "Spinal board / scoop stretcher", reason: "For suspected spinal injury from falls", hazard: "fall-from-height", quantity: 1 });
    items.push({ item: "Cervical collar set (adjustable)", reason: "Spinal immobilisation for fall casualties", hazard: "fall-from-height", quantity: 1 });
  }
  if (hazards.includes("thermal-burns")) {
    items.push({ item: "Burns kit (burn gel + cling film)", reason: "Immediate cooling and covering of thermal burns", hazard: "thermal-burns", quantity: perLoc });
  }
  if (hazards.includes("eye-injury")) {
    items.push({ item: "Sterile eye wash pods (20ml, pack of 25)", reason: "For dust and debris eye irrigation", hazard: "eye-injury", quantity: perLoc * 2 });
    items.push({ item: "Eye bath / irrigation bottle (500ml)", reason: "Extended irrigation for chemical or severe dust exposure", hazard: "eye-injury", quantity: perLoc });
  }
  if (hazards.includes("amputation")) {
    items.push({ item: "Tourniquet (CAT or similar)", reason: "Catastrophic haemorrhage control", hazard: "amputation", quantity: perLoc * 2 });
    items.push({ item: "Amputation re-implantation kit (bag + ice)", reason: "Preservation of severed digit/limb for surgical re-attachment", hazard: "amputation", quantity: perLoc });
  }

  return items;
}

// ─── BS 8599-1:2019 First Aid Kit Contents ───────────────────
export const KIT_CONTENTS: KitItem[] = [
  { item: "First aid guidance leaflet", smallKit: "1", mediumKit: "1", largeKit: "1", travelKit: "1" },
  { item: "Individually wrapped sterile plasters (assorted)", smallKit: "20", mediumKit: "40", largeKit: "60", travelKit: "20" },
  { item: "Sterile eye pads", smallKit: "2", mediumKit: "4", largeKit: "6", travelKit: "2" },
  { item: "Individually wrapped triangular bandages", smallKit: "2", mediumKit: "6", largeKit: "8", travelKit: "2" },
  { item: "Safety pins", smallKit: "6", mediumKit: "12", largeKit: "24", travelKit: "6" },
  { item: "Medium sterile unmedicated wound dressings (12x12cm)", smallKit: "6", mediumKit: "8", largeKit: "12", travelKit: "2" },
  { item: "Large sterile unmedicated wound dressings (18x18cm)", smallKit: "2", mediumKit: "4", largeKit: "6", travelKit: "1" },
  { item: "Sterile wound cleansing wipes", smallKit: "20", mediumKit: "40", largeKit: "60", travelKit: "10" },
  { item: "Microporous tape (2.5cm x 5m)", smallKit: "1", mediumKit: "2", largeKit: "3", travelKit: "1" },
  { item: "Nitrile gloves (pairs)", smallKit: "6", mediumKit: "12", largeKit: "12", travelKit: "3" },
  { item: "Face shield (for CPR)", smallKit: "1", mediumKit: "2", largeKit: "3", travelKit: "1" },
  { item: "Foil blanket", smallKit: "1", mediumKit: "2", largeKit: "3", travelKit: "1" },
  { item: "Burns dressing (10x10cm)", smallKit: "1", mediumKit: "2", largeKit: "2", travelKit: "1" },
  { item: "Clothing shears", smallKit: "1", mediumKit: "1", largeKit: "1", travelKit: "0" },
  { item: "Conforming bandage", smallKit: "1", mediumKit: "2", largeKit: "3", travelKit: "1" },
  { item: "Finger dressing", smallKit: "2", mediumKit: "4", largeKit: "6", travelKit: "2" },
];

// ─── Calculation Engine (HSE L74) ────────────────────────────
export function calculateRequirements(inputs: SiteInputs): FirstAidRequirement {
  const { totalWorkers, riskLevel, numShifts, multipleLocations, numLocations, distanceToAE, specificHazards } = inputs;
  const locations = multipleLocations ? Math.max(1, numLocations) : 1;

  let fawPerWorkers: number;
  let efawPerWorkers: number;

  // HSE L74 recommended ratios
  if (riskLevel === "low") {
    // Low risk: 1 FAW per 50, or appointed person for <50
    fawPerWorkers = 50;
    efawPerWorkers = 25;
  } else if (riskLevel === "medium") {
    // Medium: 1 FAW per 50, EFAW for smaller groups
    fawPerWorkers = 50;
    efawPerWorkers = 20;
  } else {
    // High risk (construction): 1 FAW per 25
    fawPerWorkers = 25;
    efawPerWorkers = 10;
  }

  // Workers per shift (assume equal distribution)
  const workersPerShift = Math.ceil(totalWorkers / Math.max(1, numShifts));

  // FAW first aiders per shift
  let perShiftFAW: number;
  if (workersPerShift < 5) {
    perShiftFAW = 0; // Appointed person sufficient
  } else {
    perShiftFAW = Math.max(1, Math.ceil(workersPerShift / fawPerWorkers));
  }

  // EFAW appointed persons per shift
  let perShiftEFAW: number;
  if (workersPerShift < 5) {
    perShiftEFAW = 1; // At least one appointed person
  } else if (workersPerShift < 25 && riskLevel === "low") {
    perShiftEFAW = 1;
  } else {
    perShiftEFAW = Math.max(1, Math.ceil(workersPerShift / efawPerWorkers));
  }

  // Remote site enhancement (>30 min from A&E)
  if (distanceToAE === "over30") {
    perShiftFAW = Math.max(perShiftFAW, Math.ceil(perShiftFAW * 1.5));
    perShiftEFAW = Math.max(perShiftEFAW + 1, perShiftEFAW);
  }

  // Total across all shifts
  const fawFirstAiders = perShiftFAW * numShifts;
  const efawAppointed = perShiftEFAW * numShifts;

  // Kits: 1 per first aider + 1 per additional location
  const perLocationKits = Math.max(1, Math.ceil(workersPerShift / 50));
  const firstAidKits = Math.max(fawFirstAiders, perLocationKits * locations);

  // AED recommendation
  let aedRecommended = 0;
  if (riskLevel === "high") aedRecommended = Math.max(1, locations);
  if (distanceToAE === "over30") aedRecommended = Math.max(aedRecommended, locations);
  if (specificHazards.includes("electrocution") || specificHazards.includes("drowning")) {
    aedRecommended = Math.max(aedRecommended, locations);
  }
  if (totalWorkers > 100) aedRecommended = Math.max(aedRecommended, Math.ceil(locations * 1.5));

  // Supplementary equipment
  const supplementaryEquipment = getSupplementaryEquipment(specificHazards, locations);

  // Shift coverage
  const shiftCoverage: ShiftCoverage[] = [];
  for (let s = 1; s <= numShifts; s++) {
    shiftCoverage.push({
      shiftNumber: s,
      fawRequired: perShiftFAW,
      efawRequired: perShiftEFAW,
      kitsRequired: perLocationKits * locations,
    });
  }

  return {
    fawFirstAiders, efawAppointed, firstAidKits, aedRecommended,
    perShiftFAW, perShiftEFAW, perLocationKits,
    supplementaryEquipment, shiftCoverage,
  };
}

// ─── Compliance Check ────────────────────────────────────────
export function checkCompliance(req: FirstAidRequirement, current: CurrentProvision | null): ComplianceCheck[] {
  if (!current) {
    return [
      { item: "FAW First Aiders", required: req.fawFirstAiders, current: null, status: "not-assessed", shortfall: 0 },
      { item: "EFAW Appointed Persons", required: req.efawAppointed, current: null, status: "not-assessed", shortfall: 0 },
      { item: "First Aid Kits", required: req.firstAidKits, current: null, status: "not-assessed", shortfall: 0 },
      { item: "AED Units", required: req.aedRecommended, current: null, status: "not-assessed", shortfall: 0 },
    ];
  }
  return [
    { item: "FAW First Aiders", required: req.fawFirstAiders, current: current.fawFirstAiders, status: current.fawFirstAiders >= req.fawFirstAiders ? "compliant" : "shortfall", shortfall: Math.max(0, req.fawFirstAiders - current.fawFirstAiders) },
    { item: "EFAW Appointed Persons", required: req.efawAppointed, current: current.efawAppointed, status: current.efawAppointed >= req.efawAppointed ? "compliant" : "shortfall", shortfall: Math.max(0, req.efawAppointed - current.efawAppointed) },
    { item: "First Aid Kits", required: req.firstAidKits, current: current.firstAidKits, status: current.firstAidKits >= req.firstAidKits ? "compliant" : "shortfall", shortfall: Math.max(0, req.firstAidKits - current.firstAidKits) },
    { item: "AED Units", required: req.aedRecommended, current: current.aedUnits, status: current.aedUnits >= req.aedRecommended ? "compliant" : "shortfall", shortfall: Math.max(0, req.aedRecommended - current.aedUnits) },
  ];
}

// ─── Recommendations ─────────────────────────────────────────
export function generateRecommendations(inputs: SiteInputs, req: FirstAidRequirement, checks: ComplianceCheck[]): string[] {
  const recs: string[] = [];

  recs.push(`Minimum ${req.fawFirstAiders} FAW first aider(s) and ${req.efawAppointed} EFAW appointed person(s) required across ${inputs.numShifts} shift(s) (HSE L74)`);
  recs.push(`${req.firstAidKits} first aid kit(s) required (BS 8599-1:2019 compliant)`);

  if (req.aedRecommended > 0) {
    recs.push(`${req.aedRecommended} AED unit(s) recommended -- ensure staff trained in AED use (Resuscitation Council UK guidelines)`);
  }

  if (inputs.distanceToAE === "over30") {
    recs.push("Site is >30 minutes from A&E -- enhanced first aid provision required including additional FAW first aiders and consideration of an on-site emergency response plan");
  }

  if (inputs.multipleLocations && inputs.numLocations > 1) {
    recs.push(`Site has ${inputs.numLocations} separate locations -- each location requires its own first aid kit and access to a trained first aider`);
  }

  if (inputs.numShifts > 1) {
    recs.push(`${inputs.numShifts} shifts -- each shift must have its own first aid coverage. Handover of first aid responsibilities must be documented at shift change.`);
  }

  const shortfalls = checks.filter(c => c.status === "shortfall");
  if (shortfalls.length > 0) {
    recs.push("SHORTFALLS DETECTED -- see compliance checks below for items requiring action");
    shortfalls.forEach(s => {
      recs.push(`Shortfall: ${s.item} -- need ${s.shortfall} additional (have ${s.current}, need ${s.required})`);
    });
  }

  if (req.supplementaryEquipment.length > 0) {
    recs.push(`${req.supplementaryEquipment.length} supplementary equipment item(s) recommended for specific hazards -- see below`);
  }

  return recs;
}

// ─── Kit Size Selector ───────────────────────────────────────
export function kitSize(workersPerLocation: number): "small" | "medium" | "large" {
  if (workersPerLocation <= 10) return "small";
  if (workersPerLocation <= 50) return "medium";
  return "large";
}
