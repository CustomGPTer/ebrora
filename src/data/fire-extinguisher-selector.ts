// src/data/fire-extinguisher-selector.ts
// Fire Extinguisher Selector -- BS 5306-8:2023, RRFSO 2005, BS EN 3

// ─── Types ──────────────────────────────────────────────────────

export type FireClass = "A" | "B" | "C" | "D" | "F" | "ELECTRICAL";
export type Suitability = "suitable" | "limited" | "danger" | "not-suitable";
export type RiskLevel = "low" | "normal" | "high";

export interface FireRisk {
  id: string;
  label: string;
  description: string;
  fireClasses: FireClass[];
}

export interface ExtinguisherSize {
  capacity: string;
  unit: string;
  fireRatingA: string;
  fireRatingB: string;
  throwRange: string;
  dischargeTime: string;
  weightKg: number;
  coverageM2A: number; // floor area coverage for Class A per BS 5306-8
}

export interface ExtinguisherType {
  id: string;
  type: string;
  agent: string;
  bandColor: string;
  bandHex: string;
  suitability: Record<FireClass, Suitability>;
  sizes: ExtinguisherSize[];
  description: string;
  pros: string[];
  cons: string[];
  maintenanceNotes: string;
  minOperatingTemp: number;
  maxOperatingTemp: number;
  electricalSafeDistance: string;
}

export interface PremisesType {
  id: string;
  label: string;
  defaultRisks: string[];
  riskLevel: RiskLevel;
  notes: string;
}

export interface AssessmentArea {
  id: string;
  name: string;
  floorArea: number;
  risks: string[];
  travelDistance: number;
}

export interface SignageRequirement {
  id: string;
  type: string;
  standard: string;
  description: string;
  placement: string;
  minSize: string;
}

export interface InspectionTask {
  id: string;
  frequency: string;
  task: string;
  standard: string;
  who: string;
  details: string;
}

export interface SitingRule {
  id: string;
  rule: string;
  standard: string;
  details: string;
}

export interface AreaResult {
  areaId: string;
  areaName: string;
  floorArea: number;
  fireClasses: FireClass[];
  requiredTypes: RecommendedExtinguisher[];
  totalExtinguishers: number;
  sitingNotes: string[];
}

export interface RecommendedExtinguisher {
  typeId: string;
  typeName: string;
  size: string;
  fireRating: string;
  quantity: number;
  reason: string;
  coveragePerUnit: number;
  bandHex: string;
}

export interface SelectorResult {
  areas: AreaResult[];
  totalExtinguishers: number;
  uniqueTypes: string[];
  overallFireClasses: FireClass[];
  signageRequired: SignageRequirement[];
  inspectionSchedule: InspectionTask[];
  sitingRules: SitingRule[];
  regulatoryRefs: { ref: string; title: string; relevance: string }[];
}

// ─── Fire Risks ─────────────────────────────────────────────────

export const FIRE_RISKS: FireRisk[] = [
  { id: "combustibles", label: "General Combustibles", description: "Wood, paper, textiles, cardboard, plastics, waste materials", fireClasses: ["A"] },
  { id: "flammable-liquids", label: "Flammable Liquids", description: "Petrol, diesel, oils, solvents, paints, thinners, adhesives", fireClasses: ["B"] },
  { id: "flammable-gases", label: "Flammable / Compressed Gases", description: "LPG, acetylene, propane, natural gas, welding gases", fireClasses: ["C"] },
  { id: "electrical", label: "Electrical Equipment", description: "Switchgear, generators, distribution boards, server rooms, portable tools", fireClasses: ["ELECTRICAL"] },
  { id: "cooking", label: "Cooking Oils / Fats", description: "Deep fat fryers, commercial kitchens, welfare cooking equipment", fireClasses: ["F"] },
  { id: "metals", label: "Combustible Metals", description: "Magnesium, aluminium, titanium, sodium, lithium swarf or powder", fireClasses: ["D"] },
  { id: "vehicles", label: "Vehicles / Plant", description: "Cars, vans, excavators, dumpers, forklifts -- mixed fuel + electrical risk", fireClasses: ["A", "B", "ELECTRICAL"] },
  { id: "welding", label: "Hot Works / Welding", description: "Arc welding, gas cutting, grinding, bitumen heating", fireClasses: ["A", "B"] },
  { id: "chemicals", label: "Chemical Storage", description: "Cleaning agents, solvents, pesticides, laboratory chemicals", fireClasses: ["A", "B"] },
  { id: "waste", label: "Waste / Skips", description: "Mixed waste skips, timber offcuts, packaging, oily rags", fireClasses: ["A", "B"] },
];

// ─── Premises Types ─────────────────────────────────────────────

export const PREMISES_TYPES: PremisesType[] = [
  { id: "construction", label: "Construction Site", defaultRisks: ["combustibles", "flammable-liquids", "electrical", "vehicles", "welding"], riskLevel: "high", notes: "CDM 2015 Schedule 2 requires adequate fire precautions. Consider temporary accommodation, fuel stores, hot works areas." },
  { id: "office", label: "Office / Commercial", defaultRisks: ["combustibles", "electrical"], riskLevel: "low", notes: "Predominantly Class A risk with electrical equipment. Consider server rooms and kitchenette areas separately." },
  { id: "warehouse", label: "Warehouse / Storage", defaultRisks: ["combustibles", "vehicles"], riskLevel: "normal", notes: "High fire loading from stored materials. Consider rack heights, flammable goods storage, and forklift charging areas." },
  { id: "workshop", label: "Workshop / Manufacturing", defaultRisks: ["combustibles", "flammable-liquids", "electrical", "welding"], riskLevel: "high", notes: "Mixed risks from machinery, raw materials, and processes. Zone assessment recommended." },
  { id: "retail", label: "Retail Premises", defaultRisks: ["combustibles", "electrical"], riskLevel: "low", notes: "Stock rooms may have higher fire loading than shop floor. Consider staff cooking facilities." },
  { id: "education", label: "School / Education", defaultRisks: ["combustibles", "electrical", "cooking"], riskLevel: "normal", notes: "Consider science laboratories, workshops, and kitchen areas as separate zones." },
  { id: "healthcare", label: "Healthcare / Care Home", defaultRisks: ["combustibles", "electrical", "cooking", "chemicals"], riskLevel: "normal", notes: "Sleeping risk -- vulnerable occupants. Consider oxygen storage, pharmacy, and laundry areas." },
  { id: "restaurant", label: "Restaurant / Kitchen", defaultRisks: ["combustibles", "electrical", "cooking", "flammable-liquids"], riskLevel: "high", notes: "Class F risk from cooking oils. Wet chemical extinguisher mandatory near deep fat fryers." },
  { id: "hotel", label: "Hotel / Residential", defaultRisks: ["combustibles", "electrical", "cooking"], riskLevel: "normal", notes: "Sleeping risk. Consider kitchen, laundry, plant rooms, and car park as separate zones." },
  { id: "industrial", label: "Industrial / Heavy", defaultRisks: ["combustibles", "flammable-liquids", "electrical", "flammable-gases", "vehicles", "welding"], riskLevel: "high", notes: "DSEAR assessment may be required. Consider process-specific risks and ATEX zoning." },
  { id: "laboratory", label: "Laboratory", defaultRisks: ["combustibles", "electrical", "chemicals", "flammable-liquids"], riskLevel: "high", notes: "Specialist extinguishers may be needed. Consider fume cupboards, chemical stores, and gas supplies." },
  { id: "car-park", label: "Car Park", defaultRisks: ["vehicles", "electrical"], riskLevel: "normal", notes: "EV charging introduces additional electrical risk. Consider underground vs open car parks." },
  { id: "custom", label: "Custom / Other", defaultRisks: [], riskLevel: "normal", notes: "Select all applicable fire risks manually." },
];

// ─── Extinguisher Types ─────────────────────────────────────────

export const EXTINGUISHER_TYPES: ExtinguisherType[] = [
  {
    id: "water",
    type: "Water",
    agent: "Water spray / jet / mist",
    bandColor: "Red",
    bandHex: "#EF4444",
    suitability: { A: "suitable", B: "not-suitable", C: "not-suitable", D: "not-suitable", F: "not-suitable", ELECTRICAL: "danger" },
    sizes: [
      { capacity: "3L", unit: "L", fireRatingA: "8A", fireRatingB: "-", throwRange: "3-4m", dischargeTime: "15s", weightKg: 5.5, coverageM2A: 100 },
      { capacity: "6L", unit: "L", fireRatingA: "13A", fireRatingB: "-", throwRange: "4-6m", dischargeTime: "40s", weightKg: 9.5, coverageM2A: 150 },
      { capacity: "9L", unit: "L", fireRatingA: "21A", fireRatingB: "-", throwRange: "4-6m", dischargeTime: "55s", weightKg: 14.0, coverageM2A: 200 },
    ],
    description: "Most common extinguisher for Class A fires. Red body with red label band. Cools the fire by removing heat.",
    pros: ["Low cost", "Effective cooling action on Class A", "Environmentally friendly", "Leaves minimal residue", "Safe for most premises"],
    cons: ["Class A only", "Dangerous on electrical fires (conductor)", "Dangerous on burning oils/fats", "Can freeze in unheated areas", "Not suitable for flammable liquids"],
    maintenanceNotes: "Anti-freeze additive required if stored below 5C. Check for freeze damage annually.",
    minOperatingTemp: 5,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Not safe -- do not use on or near electrical equipment",
  },
  {
    id: "foam",
    type: "AFFF Foam",
    agent: "Aqueous Film-Forming Foam",
    bandColor: "Cream",
    bandHex: "#FDE68A",
    suitability: { A: "suitable", B: "suitable", C: "not-suitable", D: "not-suitable", F: "not-suitable", ELECTRICAL: "limited" },
    sizes: [
      { capacity: "2L", unit: "L", fireRatingA: "5A", fireRatingB: "21B", throwRange: "3-4m", dischargeTime: "12s", weightKg: 4.0, coverageM2A: 75 },
      { capacity: "3L", unit: "L", fireRatingA: "8A", fireRatingB: "34B", throwRange: "3-4m", dischargeTime: "16s", weightKg: 5.5, coverageM2A: 100 },
      { capacity: "6L", unit: "L", fireRatingA: "13A", fireRatingB: "89B", throwRange: "4-5m", dischargeTime: "35s", weightKg: 10.0, coverageM2A: 150 },
      { capacity: "9L", unit: "L", fireRatingA: "21A", fireRatingB: "144B", throwRange: "4-6m", dischargeTime: "50s", weightKg: 14.5, coverageM2A: 200 },
    ],
    description: "Dual-purpose extinguisher for Class A and B fires. Red body with cream label band. Forms a film over liquid surfaces to smother flames and prevent re-ignition.",
    pros: ["Dual Class A + B capability", "Good for mixed-risk premises", "Prevents re-ignition on liquid fires", "Cooling effect on Class A", "Most popular general-purpose choice"],
    cons: ["Not for cooking oil fires (Class F)", "Not for metal fires (Class D)", "Limited on electrical (dielectric test required)", "Can freeze below 5C", "AFFF environmental concerns (PFAS)"],
    maintenanceNotes: "Check foam concentrate condition annually. Anti-freeze additive required below 5C. PFAS-free alternatives now available.",
    minOperatingTemp: 5,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Safe at 1m+ if 35kV dielectric tested to BS EN 3-7",
  },
  {
    id: "co2",
    type: "CO2",
    agent: "Carbon Dioxide",
    bandColor: "Black",
    bandHex: "#374151",
    suitability: { A: "limited", B: "suitable", C: "not-suitable", D: "not-suitable", F: "not-suitable", ELECTRICAL: "suitable" },
    sizes: [
      { capacity: "2kg", unit: "kg", fireRatingA: "-", fireRatingB: "34B", throwRange: "1.5-2m", dischargeTime: "8s", weightKg: 6.5, coverageM2A: 0 },
      { capacity: "5kg", unit: "kg", fireRatingA: "-", fireRatingB: "89B", throwRange: "2-3m", dischargeTime: "16s", weightKg: 14.0, coverageM2A: 0 },
    ],
    description: "Ideal for electrical and flammable liquid fires. Red body with black label band. Displaces oxygen and leaves no residue -- ideal for sensitive equipment.",
    pros: ["Safe on electrical equipment", "Leaves no residue", "Ideal for server rooms and switchgear", "No damage to equipment", "Does not contaminate food"],
    cons: ["Short throw range", "Rapid dissipation -- re-ignition risk", "No Class A rating", "Cold burn risk from horn", "Asphyxiation risk in confined spaces", "Heavy for capacity"],
    maintenanceNotes: "Weigh annually -- 10% loss requires recharge. Horn attachment must be free of frost damage. Pressure test every 10 years.",
    minOperatingTemp: -30,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Safe on all voltages -- non-conductive gas",
  },
  {
    id: "powder-abc",
    type: "ABC Dry Powder",
    agent: "Monoammonium phosphate powder",
    bandColor: "Blue",
    bandHex: "#3B82F6",
    suitability: { A: "suitable", B: "suitable", C: "suitable", D: "not-suitable", F: "not-suitable", ELECTRICAL: "suitable" },
    sizes: [
      { capacity: "1kg", unit: "kg", fireRatingA: "8A", fireRatingB: "21B", throwRange: "2-3m", dischargeTime: "6s", weightKg: 2.0, coverageM2A: 100 },
      { capacity: "2kg", unit: "kg", fireRatingA: "13A", fireRatingB: "55B", throwRange: "3-4m", dischargeTime: "8s", weightKg: 3.5, coverageM2A: 150 },
      { capacity: "4kg", unit: "kg", fireRatingA: "21A", fireRatingB: "113B", throwRange: "4-5m", dischargeTime: "12s", weightKg: 6.5, coverageM2A: 200 },
      { capacity: "6kg", unit: "kg", fireRatingA: "27A", fireRatingB: "183B", throwRange: "4-6m", dischargeTime: "15s", weightKg: 9.5, coverageM2A: 250 },
      { capacity: "9kg", unit: "kg", fireRatingA: "34A", fireRatingB: "233B", throwRange: "5-7m", dischargeTime: "18s", weightKg: 14.0, coverageM2A: 300 },
    ],
    description: "Most versatile extinguisher -- covers Classes A, B, C, and electrical fires. Red body with blue label band. Knocks down flames rapidly but does not cool.",
    pros: ["Widest fire class coverage (A/B/C + electrical)", "Effective on gas fires (Class C)", "Works in freezing conditions", "Good throw range", "Fast flame knockdown"],
    cons: ["No cooling effect -- re-ignition risk", "Visibility loss from powder cloud", "Damages sensitive equipment", "Difficult to clean up", "Not for cooking oils (Class F)", "Not recommended for enclosed occupied spaces"],
    maintenanceNotes: "Invert monthly to prevent powder settling (caking). Extended service includes powder replacement every 5 years.",
    minOperatingTemp: -20,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Safe on all voltages -- non-conductive powder",
  },
  {
    id: "wet-chemical",
    type: "Wet Chemical",
    agent: "Potassium acetate/citrate/lactate solution",
    bandColor: "Yellow",
    bandHex: "#EAB308",
    suitability: { A: "suitable", B: "not-suitable", C: "not-suitable", D: "not-suitable", F: "suitable", ELECTRICAL: "not-suitable" },
    sizes: [
      { capacity: "2L", unit: "L", fireRatingA: "5A", fireRatingB: "-", throwRange: "2-3m", dischargeTime: "20s", weightKg: 4.0, coverageM2A: 75 },
      { capacity: "3L", unit: "L", fireRatingA: "8A", fireRatingB: "-", throwRange: "2-3m", dischargeTime: "30s", weightKg: 5.5, coverageM2A: 100 },
      { capacity: "6L", unit: "L", fireRatingA: "13A", fireRatingB: "-", throwRange: "3-4m", dischargeTime: "45s", weightKg: 10.0, coverageM2A: 150 },
    ],
    description: "Specialist extinguisher for cooking oil and fat fires (Class F). Red body with yellow label band. Creates a saponification reaction that forms a soap-like film sealing the surface.",
    pros: ["Only type safe and effective on cooking oil fires", "Also rated for Class A", "Gentle application prevents splash", "Cooling effect prevents re-ignition", "Mandatory near commercial deep fat fryers"],
    cons: ["Class F and A only", "Not for Class B flammable liquids", "Not for electrical, gas, or metal fires", "Higher cost than water/foam", "Can freeze below 5C"],
    maintenanceNotes: "Check solution condition annually. Replace if discoloured. Ensure lance applicator is not blocked.",
    minOperatingTemp: 5,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Not safe on electrical equipment",
  },
  {
    id: "class-d",
    type: "Class D Specialist",
    agent: "L2 / M28 / Lith-Ex powder (varies by metal)",
    bandColor: "Blue (specialist)",
    bandHex: "#6366F1",
    suitability: { A: "not-suitable", B: "not-suitable", C: "not-suitable", D: "suitable", F: "not-suitable", ELECTRICAL: "not-suitable" },
    sizes: [
      { capacity: "9kg", unit: "kg", fireRatingA: "-", fireRatingB: "-", throwRange: "2-3m", dischargeTime: "25s", weightKg: 15.0, coverageM2A: 0 },
      { capacity: "9L", unit: "L", fireRatingA: "-", fireRatingB: "-", throwRange: "2-3m", dischargeTime: "30s", weightKg: 14.0, coverageM2A: 0 },
    ],
    description: "Specialist extinguisher for combustible metal fires. Application method varies by metal type -- typically a low-velocity applicator to avoid disturbing burning metal.",
    pros: ["Only effective method for metal fires", "Specific agents for different metals", "Low-velocity application prevents scattering"],
    cons: ["Very specialist -- one metal type only", "Expensive", "Limited availability", "No other fire class coverage", "Requires specific training"],
    maintenanceNotes: "Annual inspection by specialist. Check agent type matches metals on site. Replace if agent contaminated.",
    minOperatingTemp: -20,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Not rated for electrical use",
  },
  {
    id: "water-mist",
    type: "Water Mist",
    agent: "De-ionised water microdroplets",
    bandColor: "White",
    bandHex: "#F1F5F9",
    suitability: { A: "suitable", B: "limited", C: "not-suitable", D: "not-suitable", F: "suitable", ELECTRICAL: "suitable" },
    sizes: [
      { capacity: "1L", unit: "L", fireRatingA: "5A", fireRatingB: "21B", throwRange: "2-3m", dischargeTime: "20s", weightKg: 2.5, coverageM2A: 75 },
      { capacity: "3L", unit: "L", fireRatingA: "13A", fireRatingB: "21B", throwRange: "2-4m", dischargeTime: "40s", weightKg: 5.0, coverageM2A: 150 },
      { capacity: "6L", unit: "L", fireRatingA: "21A", fireRatingB: "21B", throwRange: "3-4m", dischargeTime: "60s", weightKg: 9.0, coverageM2A: 200 },
    ],
    description: "Modern multi-purpose extinguisher using de-ionised water in ultra-fine mist. Red body with white label band. Safe on electrical fires as mist is non-conductive. Covers A, F, and electrical.",
    pros: ["Multi-class: A, F, and electrical safe", "No residue -- no clean-up", "No chemicals -- environmentally friendly", "Lightweight for capacity", "Safe in occupied spaces"],
    cons: ["Limited Class B effectiveness", "Not for Class C or D", "Higher purchase cost", "Shorter throw range than foam/powder", "Relatively new -- less industry familiarity"],
    maintenanceNotes: "Annual service. Check de-ionisation level of water -- conductivity must remain below threshold.",
    minOperatingTemp: 5,
    maxOperatingTemp: 60,
    electricalSafeDistance: "Safe up to 1000V (35kV dielectric tested)",
  },
];

// ─── Fire Class Details ─────────────────────────────────────────

export const FIRE_CLASS_DETAILS: Record<FireClass, { label: string; description: string; color: string; bgColor: string; examples: string }> = {
  A: { label: "Class A", description: "Solid combustibles", color: "#16A34A", bgColor: "#F0FDF4", examples: "Wood, paper, textiles, rubber, plastics" },
  B: { label: "Class B", description: "Flammable liquids", color: "#DC2626", bgColor: "#FEF2F2", examples: "Petrol, diesel, oils, solvents, paints" },
  C: { label: "Class C", description: "Flammable gases", color: "#2563EB", bgColor: "#EFF6FF", examples: "LPG, propane, acetylene, natural gas" },
  D: { label: "Class D", description: "Combustible metals", color: "#7C3AED", bgColor: "#F5F3FF", examples: "Magnesium, aluminium, titanium, sodium" },
  F: { label: "Class F", description: "Cooking oils and fats", color: "#EA580C", bgColor: "#FFF7ED", examples: "Deep fat fryers, commercial cooking oil" },
  ELECTRICAL: { label: "Electrical", description: "Electrical equipment", color: "#0891B2", bgColor: "#ECFEFF", examples: "Switchgear, generators, server rooms" },
};

// ─── Siting Rules ───────────────────────────────────────────────

export const SITING_RULES: SitingRule[] = [
  { id: "travel-30m", rule: "Travel distance per fire class: 30m Class A/C; 10m Class B, F and electrical", standard: "BS 5306-8:2023 cl.6.2", details: "No person should have to travel more than the class-specific maximum from the site of a fire to reach an appropriate extinguisher. Class A and C: 30m maximum. Class B, F and electrical: 10m maximum. High-risk areas may warrant shorter distances." },
  { id: "visible", rule: "Mounted on wall brackets or stands at visible locations", standard: "BS 5306-8 cl.6.3", details: "Extinguishers should be sited on dedicated stands or wall brackets. Handle height should be approximately 1m from floor level (max 1.5m for lighter units)." },
  { id: "escape-routes", rule: "Position near escape routes and exits", standard: "BS 5306-8 cl.6.2", details: "Place extinguishers near room exits, along escape routes, and at final exit doors. Users should not have to pass the fire to reach an extinguisher." },
  { id: "grouping", rule: "Group extinguishers at fire points where practicable", standard: "BS 5306-8 cl.6.3", details: "Where multiple types are needed, group them together at designated fire points with appropriate signage." },
  { id: "risk-proximity", rule: "Position close to identified risks", standard: "BS 5306-8 cl.6.2", details: "Place specialist extinguishers (Class B, F, D) adjacent to the specific hazard: near fuel stores, deep fat fryers, metal workshops." },
  { id: "access-clear", rule: "Keep 1m clear zone in front of extinguisher", standard: "RRFSO 2005 Art.13", details: "The area around the extinguisher must be kept clear and unobstructed. Do not store materials against or in front of extinguishers." },
  { id: "floor-level", rule: "Each floor must have its own extinguisher provision", standard: "BS 5306-8 cl.6.1", details: "Extinguishers on other floors cannot be counted towards the provision on any given floor. Each storey is assessed independently." },
  { id: "outdoor", rule: "Protect outdoor extinguishers from weather", standard: "BS 5306-8 cl.6.4", details: "External extinguishers require weatherproof cabinets or covers. Anti-freeze additive for water-based types if below 5C." },
  { id: "ev-charging", rule: "Provide extinguisher at EV charging points", standard: "Fire risk assessment", details: "Consider CO2 or water mist extinguishers near EV charging bays. Lithium battery fires require specialist consideration." },
  { id: "height", rule: "Handle no higher than 1.0-1.5m from floor", standard: "BS 5306-8 cl.6.3", details: "Heavier extinguishers (>4kg) should have handles at approximately 1.0m. Lighter units can be mounted with handles at up to 1.5m." },
];

// ─── Signage Requirements ───────────────────────────────────────

export const SIGNAGE_REQUIREMENTS: SignageRequirement[] = [
  { id: "location-sign", type: "Extinguisher Location Sign", standard: "BS 5499-1 / ISO 7010", description: "White extinguisher silhouette on green background -- identifies the location of the extinguisher", placement: "Above each extinguisher or fire point, visible from the normal approach direction", minSize: "100 x 100mm (up to 200 x 200mm for long viewing distances)" },
  { id: "id-sign", type: "Extinguisher ID Sign", standard: "BS 5306-8 cl.7", description: "Shows extinguisher type, colour band, and suitable fire classes with pictograms", placement: "Adjacent to each extinguisher, at eye level", minSize: "200 x 80mm" },
  { id: "fire-class-sign", type: "Fire Class Suitability Sign", standard: "BS EN 3-7 / ISO 7010", description: "Pictogram signs showing which fire classes the extinguisher can and cannot be used on", placement: "Adjacent to or on the extinguisher body", minSize: "Pictograms per BS EN 3-7 Annex E" },
  { id: "instruction-sign", type: "Operating Instructions Sign", standard: "BS EN 3-7", description: "Step-by-step operating instructions with diagrams", placement: "On extinguisher body (most are factory-fitted) -- wall-mounted instruction plate if shared fire point", minSize: "Per manufacturer label" },
  { id: "missing-sign", type: "Missing Extinguisher Notice", standard: "RRFSO 2005", description: "Temporary notice when extinguisher removed for service or after use", placement: "At the extinguisher location during absence", minSize: "A4 minimum" },
  { id: "do-not-use", type: "DO NOT USE Warning Sign", standard: "BS 5306-8 cl.7", description: "Warning sign where a specific type is dangerous (e.g. water near electrical, CO2 in confined space)", placement: "Adjacent to the specific hazard where the wrong type could be dangerous", minSize: "150 x 200mm" },
  { id: "fire-point", type: "Fire Point Assembly Sign", standard: "BS 5499-1", description: "Sign identifying a grouped fire point with all available equipment listed", placement: "Above the grouped extinguisher location", minSize: "200 x 300mm" },
  { id: "photoluminescent", type: "Photoluminescent Enhancement", standard: "BS 5499-4", description: "Self-glowing (phosphorescent) border or sign visible in low light and power failure", placement: "On location signs and directional signs in poorly lit or windowless areas", minSize: "Match base sign size" },
];

// ─── Inspection Schedule ────────────────────────────────────────

export const INSPECTION_SCHEDULE: InspectionTask[] = [
  { id: "weekly-visual", frequency: "Weekly", task: "Visual check -- extinguisher in correct position and accessible", standard: "RRFSO 2005 Art.17", who: "Responsible Person / Fire Marshal", details: "Confirm extinguisher is in its designated position, not obstructed, no obvious damage, pressure gauge in green zone (where fitted). Record in fire log book." },
  { id: "monthly-visual", frequency: "Monthly", task: "Detailed visual inspection and tamper check", standard: "BS 5306-3 cl.6", who: "Competent Person (trained on-site)", details: "Check safety pin and tamper seal intact, check weight (CO2), check pressure gauge, check hose and horn condition, check wall bracket secure, check signage present and legible. Record on inspection tag and fire log." },
  { id: "annual-basic", frequency: "Annual", task: "Basic service by competent service engineer", standard: "BS 5306-3 cl.7", who: "Third-party service engineer (BAFE SP101 or equivalent)", details: "Full internal and external inspection per manufacturer's instructions. Replace safety pin seal. Update service label. Report defects. Includes functional check of all components." },
  { id: "5yr-extended", frequency: "Every 5 Years", task: "Extended service -- discharge and recharge", standard: "BS 5306-3 cl.8", who: "Third-party service engineer", details: "Water/foam/wet chemical: full discharge, internal inspection, new agent, pressure test if required. Powder: full discharge, sieve powder, refill or replace. CO2: weight test (hydraulic test at 10yr)." },
  { id: "10yr-overhaul", frequency: "Every 10 Years", task: "Major overhaul or replacement", standard: "BS 5306-3 cl.9", who: "Third-party service engineer", details: "CO2 cylinders: hydraulic pressure test to BS EN 1968. Water/foam/powder: assess condition -- most manufacturers recommend replacement at 10-15 years rather than extended overhaul." },
  { id: "post-incident", frequency: "After Any Use", task: "Immediate recharge or replacement", standard: "BS 5306-3 cl.10", who: "Third-party service engineer (urgent)", details: "Any partially or fully discharged extinguisher must be recharged or replaced immediately. A temporary replacement must be provided within 24 hours. Record the incident." },
  { id: "commissioning", frequency: "On Installation", task: "Commissioning inspection and registration", standard: "BS 5306-8 cl.8", who: "Installer / service engineer", details: "Confirm correct type and size for identified risks. Check siting, signage, mounting height. Create asset register with serial numbers, locations, service dates. Issue commissioning certificate." },
];

// ─── Regulatory References ──────────────────────────────────────

export const REGULATORY_REFS = [
  { ref: "BS 5306-8:2023", title: "Fire extinguishing installations and equipment on premises -- Selection and positioning of portable fire extinguishers. Code of practice", relevance: "Primary standard for extinguisher type selection, quantity calculation, and siting requirements. Supersedes BS 5306-8:2012 (withdrawn 8 Nov 2023)." },
  { ref: "RRFSO 2005", title: "Regulatory Reform (Fire Safety) Order 2005", relevance: "Legal duty on the Responsible Person to provide appropriate fire-fighting equipment and train staff. Articles 13, 17, 21." },
  { ref: "BS EN 3 series", title: "Portable fire extinguishers -- Ratings, performance, construction", relevance: "Defines fire ratings (e.g. 13A, 89B), test methods, colour coding, and labelling requirements" },
  { ref: "BS 5306-3:2017", title: "Commissioning and maintenance of portable fire extinguishers", relevance: "Defines inspection frequencies, service intervals, and competence requirements for maintenance" },
  { ref: "BS 5499-1:2002", title: "Graphical symbols and signs -- Fire safety signs", relevance: "Specifies design, sizing, and placement of fire safety signs including extinguisher location signs" },
  { ref: "BS 5499-4:2013", title: "Code of practice for escape route signing", relevance: "Photoluminescent sign requirements for escape routes and fire equipment locations" },
  { ref: "CDM 2015 Sched. 2", title: "Construction (Design and Management) Regulations 2015, Schedule 2", relevance: "Welfare and fire precaution requirements for construction sites" },
  { ref: "DSEAR 2002", title: "Dangerous Substances and Explosive Atmospheres Regulations 2002", relevance: "Applies where flammable gases, vapours, mists, or combustible dusts create explosion risk. May require ATEX-rated equipment." },
  { ref: "BS 7937:2000", title: "Specification for portable fire extinguisher stands", relevance: "Requirements for freestanding extinguisher stands where wall mounting is not possible" },
];

// ─── Calculation Logic ──────────────────────────────────────────

// BS 5306-8:2023 maximum travel distance to an appropriate extinguisher, per fire class.
// 30m for Class A and C; 10m for Class B, F and electrical fires.
export const CLASS_MAX_TRAVEL_M: Record<FireClass, number> = {
  A: 30,
  B: 10,
  C: 30,
  D: 10,     // conservative — Class D is case-by-case in BS 5306-8; kept close to hazard
  F: 10,
  ELECTRICAL: 10,
};

// Threshold above which any Class A area requires at least 2 extinguishers.
// BS 5306-8:2023 reduced this from 100m² (2012) to 50m² in its updated
// provision guidance for small premises (FIA 2024 summary).
const CLASS_A_MIN_TWO_AREA_M2 = 50;

function getFireClasses(risks: string[]): FireClass[] {
  const classes = new Set<FireClass>();
  for (const riskId of risks) {
    const risk = FIRE_RISKS.find(r => r.id === riskId);
    if (risk) risk.fireClasses.forEach(c => classes.add(c));
  }
  return Array.from(classes).sort();
}

function selectBestSize(ext: ExtinguisherType, classNeeded: FireClass): ExtinguisherSize | null {
  // For Class A coverage, pick the size with best fire rating
  // For other classes, pick the largest available
  const validSizes = ext.sizes.filter(s => {
    if (classNeeded === "A") return s.fireRatingA !== "-";
    if (classNeeded === "B") return s.fireRatingB !== "-";
    return true;
  });
  if (validSizes.length === 0) return null;
  // Return the 2nd largest (practical balance of size/portability) or largest if only 1-2 sizes
  if (validSizes.length <= 2) return validSizes[validSizes.length - 1];
  return validSizes[validSizes.length - 2];
}

function calculateQuantityForArea(
  floorArea: number,
  travelDistance: number,
  size: ExtinguisherSize,
  riskLevel: RiskLevel,
  classMaxTravelM: number = 30,
): number {
  // BS 5306-8:2023 — quantity is the governing of (a) Class A rating coverage,
  // (b) travel distance coverage, (c) small-premises minimum of 2 when > 50m².
  let qty = 1;

  // Coverage calculation for Class A (main quantity driver)
  if (size.coverageM2A > 0) {
    const riskMultiplier = riskLevel === "high" ? 0.7 : riskLevel === "normal" ? 1.0 : 1.3;
    const effectiveCoverage = size.coverageM2A * riskMultiplier;
    qty = Math.ceil(floorArea / effectiveCoverage);
  }

  // Travel distance check — each unit covers a circle of the shorter of the
  // user's travel distance and the class-specific BS 5306-8 maximum.
  if (floorArea > 0 && travelDistance > 0) {
    const effectiveTravel = Math.min(travelDistance, classMaxTravelM);
    const maxTravelCoverage = Math.PI * Math.pow(effectiveTravel, 2);
    const travelQty = Math.ceil(floorArea / maxTravelCoverage);
    qty = Math.max(qty, travelQty);
  }

  // BS 5306-8:2023 — minimum 2 extinguishers for any Class A area > 50m²
  if (floorArea > CLASS_A_MIN_TWO_AREA_M2 && qty < 2) qty = 2;

  // Minimum 1 per floor always
  return Math.max(qty, 1);
}

function getSuitableTypes(fireClasses: FireClass[]): ExtinguisherType[] {
  return EXTINGUISHER_TYPES.filter(ext => {
    // Must be suitable or limited for at least one of the fire classes needed
    return fireClasses.some(fc => ext.suitability[fc] === "suitable");
  });
}

export function calculateAreaResult(
  area: AssessmentArea,
  premisesRiskLevel: RiskLevel
): AreaResult {
  const fireClasses = getFireClasses(area.risks);
  const suitableTypes = getSuitableTypes(fireClasses);
  const requiredTypes: RecommendedExtinguisher[] = [];
  const sitingNotes: string[] = [];

  // For each fire class needed, select the best extinguisher type
  const classesHandled = new Set<FireClass>();

  // Track floor area already credited to Class A by "supplementary" types
  // (wet-chem, ABC powder etc. BS 5306-8 rates them for Class A but they are
  // sited adjacent to their primary hazard, not distributed across the floor.)
  let classACreditedM2 = 0;

  // Priority 1: Handle Class F first (only wet chemical or water mist)
  if (fireClasses.includes("F")) {
    const wetChem = EXTINGUISHER_TYPES.find(e => e.id === "wet-chemical")!;
    const bestSize = selectBestSize(wetChem, "F");
    if (bestSize) {
      requiredTypes.push({
        typeId: wetChem.id,
        typeName: wetChem.type,
        size: bestSize.capacity,
        fireRating: bestSize.fireRatingA !== "-" ? `${bestSize.fireRatingA}` : "F-rated",
        quantity: Math.max(1, Math.ceil(area.risks.filter(r => r === "cooking").length || 1)),
        reason: "BS 5306-8:2023 -- mandatory for Class F cooking oil/fat fires",
        coveragePerUnit: bestSize.coverageM2A,
        bandHex: wetChem.bandHex,
      });
      classesHandled.add("F");
      // Wet-chem has a Class A rating so it credits Class A cover in the
      // fryer's immediate area only (its coverage rating), NOT the whole floor.
      if (wetChem.suitability.A === "suitable") {
        classACreditedM2 += bestSize.coverageM2A;
      }
    }
  }

  // Priority 2: Handle Class D (specialist only)
  if (fireClasses.includes("D")) {
    const classD = EXTINGUISHER_TYPES.find(e => e.id === "class-d")!;
    requiredTypes.push({
      typeId: classD.id,
      typeName: classD.type,
      size: "9kg",
      fireRating: "Class D specialist",
      quantity: 1,
      reason: "Specialist extinguisher for combustible metal fires -- agent must match metal type",
      coveragePerUnit: 0,
      bandHex: classD.bandHex,
    });
    classesHandled.add("D");
    sitingNotes.push("Class D extinguisher must be sited directly adjacent to the metal working area");
  }

  // Priority 3: Handle Electrical + Class B (CO2)
  if (fireClasses.includes("ELECTRICAL") || (fireClasses.includes("B") && !classesHandled.has("B"))) {
    const co2 = EXTINGUISHER_TYPES.find(e => e.id === "co2")!;
    const bestSize = selectBestSize(co2, "B");
    if (bestSize) {
      // CO2 for switchgear and electrical -- at least one per distribution board area
      const electricalQty = fireClasses.includes("ELECTRICAL")
        ? Math.max(1, Math.ceil(area.floorArea / 400))
        : 0;
      const liquidQty = fireClasses.includes("B") && !classesHandled.has("B")
        ? Math.max(1, Math.ceil(area.floorArea / 300))
        : 0;
      requiredTypes.push({
        typeId: co2.id,
        typeName: co2.type,
        size: bestSize.capacity,
        fireRating: bestSize.fireRatingB !== "-" ? bestSize.fireRatingB : "Electrical safe",
        quantity: Math.max(electricalQty, liquidQty),
        reason: "CO2 -- safe on electrical equipment, effective on Class B flammable liquids, no residue",
        coveragePerUnit: 0,
        bandHex: co2.bandHex,
      });
      classesHandled.add("ELECTRICAL");
      if (co2.suitability.B === "suitable") classesHandled.add("B");
    }
  }

  // Priority 4: Handle Class C (powder only)
  if (fireClasses.includes("C") && !classesHandled.has("C")) {
    const powder = EXTINGUISHER_TYPES.find(e => e.id === "powder-abc")!;
    const bestSize = selectBestSize(powder, "C");
    if (bestSize) {
      const powderQty = Math.max(1, Math.ceil(area.floorArea / 400));
      requiredTypes.push({
        typeId: powder.id,
        typeName: powder.type,
        size: bestSize.capacity,
        fireRating: `${bestSize.fireRatingA} / ${bestSize.fireRatingB}`,
        quantity: powderQty,
        reason: "ABC powder -- only portable type effective on gas fires (Class C)",
        coveragePerUnit: bestSize.coverageM2A,
        bandHex: powder.bandHex,
      });
      classesHandled.add("C");
      // ABC powder has A+B ratings; credit only its own coverage per unit × qty
      // towards the remaining Class A/B sizing, not the whole floor.
      if (powder.suitability.A === "suitable") {
        classACreditedM2 += bestSize.coverageM2A * powderQty;
      }
      if (powder.suitability.B === "suitable") classesHandled.add("B");
    }
    sitingNotes.push("Powder extinguishers reduce visibility -- avoid in confined areas where escape routes could be obscured");
  }

  // Priority 5: Handle Class A (foam preferred, or water)
  // Size for the floor area NOT already credited to supplementary types.
  const remainingClassAArea = Math.max(0, area.floorArea - classACreditedM2);
  if (fireClasses.includes("A") && !classesHandled.has("A") && remainingClassAArea > 0) {
    const foam = EXTINGUISHER_TYPES.find(e => e.id === "foam")!;
    const water = EXTINGUISHER_TYPES.find(e => e.id === "water")!;
    // Prefer foam if Class B also needed (dual-purpose); otherwise water is
    // the traditional Class A choice and cheaper per-unit.
    const hasClassB = fireClasses.includes("B") && !classesHandled.has("B");
    const type = hasClassB ? foam : water;
    const bestSize = selectBestSize(type, "A");
    if (bestSize) {
      const qty = calculateQuantityForArea(remainingClassAArea, area.travelDistance, bestSize, premisesRiskLevel, CLASS_MAX_TRAVEL_M.A);
      const areaNote = remainingClassAArea < area.floorArea
        ? `${qty} units for remaining ${remainingClassAArea}m2 Class A area (after ${classACreditedM2}m2 covered by supplementary types) at ${premisesRiskLevel} risk`
        : `${qty} units for ${area.floorArea}m2 floor area at ${premisesRiskLevel} risk`;
      requiredTypes.push({
        typeId: type.id,
        typeName: type.type,
        size: bestSize.capacity,
        fireRating: bestSize.fireRatingA !== "-" ? `${bestSize.fireRatingA} / ${bestSize.fireRatingB}` : bestSize.fireRatingB,
        quantity: qty,
        reason: `Primary Class A protection -- ${areaNote}`,
        coveragePerUnit: bestSize.coverageM2A,
        bandHex: type.bandHex,
      });
      classesHandled.add("A");
      if (type.suitability.B === "suitable") classesHandled.add("B");
    }
  } else if (fireClasses.includes("A") && !classesHandled.has("A")) {
    // Supplementary types already cover the full floor; still mark handled.
    classesHandled.add("A");
  }

  // Handle remaining Class B if not yet covered
  if (fireClasses.includes("B") && !classesHandled.has("B")) {
    const foam = EXTINGUISHER_TYPES.find(e => e.id === "foam")!;
    const bestSize = selectBestSize(foam, "B");
    if (bestSize) {
      requiredTypes.push({
        typeId: foam.id,
        typeName: foam.type,
        size: bestSize.capacity,
        fireRating: `${bestSize.fireRatingA} / ${bestSize.fireRatingB}`,
        quantity: Math.max(1, Math.ceil(area.floorArea / 300)),
        reason: "AFFF foam for Class B flammable liquid coverage",
        coveragePerUnit: bestSize.coverageM2A,
        bandHex: foam.bandHex,
      });
      classesHandled.add("B");
    }
  }

  // Siting notes — per-class BS 5306-8:2023 travel distance warnings
  const hasShortTravelClass = fireClasses.some(c => c === "B" || c === "F" || c === "ELECTRICAL");
  if (hasShortTravelClass && area.travelDistance > 10) {
    const presentShortClasses = fireClasses.filter(c => c === "B" || c === "F" || c === "ELECTRICAL").join(", ");
    sitingNotes.push(`Travel distance ${area.travelDistance}m exceeds BS 5306-8:2023 maximum of 10m for Class ${presentShortClasses} fires -- plan additional fire points adjacent to these specific hazards (extinguisher quantities above have been sized assuming 10m coverage circles for those classes)`);
  }
  if (fireClasses.includes("A") && area.travelDistance > 30) {
    sitingNotes.push(`Travel distance ${area.travelDistance}m exceeds BS 5306-8:2023 maximum of 30m for Class A fires -- additional extinguisher stations required`);
  }
  if (area.floorArea > 400 && premisesRiskLevel === "high") {
    sitingNotes.push("High-risk area >400m2 -- consider reducing travel distance further and increasing provision");
  }
  if (area.risks.includes("cooking")) {
    sitingNotes.push("Wet chemical extinguisher must be within 2m of deep fat fryers per BS 5306-8:2023");
  }

  const totalExtinguishers = requiredTypes.reduce((sum, r) => sum + r.quantity, 0);

  return {
    areaId: area.id,
    areaName: area.name,
    floorArea: area.floorArea,
    fireClasses,
    requiredTypes,
    totalExtinguishers,
    sitingNotes,
  };
}

export function calculateFullResult(
  areas: AssessmentArea[],
  premisesRiskLevel: RiskLevel
): SelectorResult {
  const areaResults = areas.map(a => calculateAreaResult(a, premisesRiskLevel));
  const totalExtinguishers = areaResults.reduce((sum, a) => sum + a.totalExtinguishers, 0);
  const uniqueTypes = [...new Set(areaResults.flatMap(a => a.requiredTypes.map(r => r.typeName)))];
  const overallFireClasses = [...new Set(areaResults.flatMap(a => a.fireClasses))] as FireClass[];

  // Determine which signage is required
  const signageRequired = SIGNAGE_REQUIREMENTS.filter(s => {
    if (s.id === "do-not-use") {
      // Only if we have types dangerous on certain classes present
      return overallFireClasses.includes("ELECTRICAL") || overallFireClasses.includes("F");
    }
    if (s.id === "photoluminescent") {
      // Recommended for all but mandatory for windowless/enclosed areas
      return true;
    }
    return true; // Most signage is always required
  });

  return {
    areas: areaResults,
    totalExtinguishers,
    uniqueTypes,
    overallFireClasses,
    signageRequired,
    inspectionSchedule: INSPECTION_SCHEDULE,
    sitingRules: SITING_RULES,
    regulatoryRefs: REGULATORY_REFS,
  };
}
