// src/data/cbr-modulus-converter.ts

// ─── Conversion Methods ──────────────────────────────────────

/** Powell et al (1984) — TRL/DMRB standard method */
export function powellCBRtoModulus(cbr: number): number {
  if (cbr <= 0) return 0;
  return 17.6 * Math.pow(cbr, 0.64);
}

/** Inverse Powell: modulus back to CBR */
export function powellModulusToCBR(modulus: number): number {
  if (modulus <= 0) return 0;
  return Math.pow(modulus / 17.6, 1 / 0.64);
}

/** AASHTO (1993): MR (psi) = 1500 x CBR, converted to MPa */
export function aashtoCBRtoModulus(cbr: number): number {
  if (cbr <= 0) return 0;
  return (1500 * cbr) / 145.038; // psi to MPa
}

export function aashtoModulusToCBR(modulus: number): number {
  if (modulus <= 0) return 0;
  return (modulus * 145.038) / 1500;
}

/** South African method: E = 10 x CBR for CBR < 5, E = 17.6 x CBR^0.64 for CBR >= 5 */
export function southAfricanCBRtoModulus(cbr: number): number {
  if (cbr <= 0) return 0;
  if (cbr < 5) return 10 * cbr;
  return 17.6 * Math.pow(cbr, 0.64);
}

export function southAfricanModulusToCBR(modulus: number): number {
  if (modulus <= 0) return 0;
  if (modulus < 50) return modulus / 10; // below 50 MPa = linear range
  return Math.pow(modulus / 17.6, 1 / 0.64);
}

// ─── Subgrade Classification (DMRB HD 26) ────────────────────
export interface SubgradeClass {
  id: string;
  className: string;
  cbrMin: number;
  cbrMax: number;
  label: string;
  colour: string;
  designGuidance: string;
}

export const SUBGRADE_CLASSES: SubgradeClass[] = [
  { id: "class1", className: "Class 1", cbrMin: 0, cbrMax: 2, label: "Very Poor", colour: "text-red-700 bg-red-50 border-red-200", designGuidance: "Requires capping layer (min 600mm). Consider ground improvement, lime/cement stabilisation, or geotextile separation. Not suitable for direct pavement construction." },
  { id: "class2", className: "Class 2", cbrMin: 2, cbrMax: 5, label: "Poor", colour: "text-orange-700 bg-orange-50 border-orange-200", designGuidance: "Requires capping layer (min 350mm) or improved subgrade. Consider lime stabilisation. Subgrade protection essential during construction." },
  { id: "class3", className: "Class 3", cbrMin: 5, cbrMax: 15, label: "Fair", colour: "text-amber-700 bg-amber-50 border-amber-200", designGuidance: "Standard subformation. Sub-base can be placed directly on formation if protected. Design thickness per DMRB HD 26 Figure 2.4." },
  { id: "class4", className: "Class 4", cbrMin: 15, cbrMax: 30, label: "Good", colour: "text-green-700 bg-green-50 border-green-200", designGuidance: "Good subgrade. Reduced pavement thickness may be applicable. Direct placement of sub-base is normally acceptable." },
  { id: "class5", className: "Class 5", cbrMin: 30, cbrMax: 100, label: "Excellent", colour: "text-emerald-700 bg-emerald-50 border-emerald-200", designGuidance: "Excellent subgrade. Minimum pavement thickness applies. Well-graded granular materials and rock fills." },
];

export function getSubgradeClass(cbr: number): SubgradeClass {
  if (cbr < 2) return SUBGRADE_CLASSES[0];
  if (cbr < 5) return SUBGRADE_CLASSES[1];
  if (cbr < 15) return SUBGRADE_CLASSES[2];
  if (cbr < 30) return SUBGRADE_CLASSES[3];
  return SUBGRADE_CLASSES[4];
}

// ─── Common Soil Types Reference ─────────────────────────────
export interface SoilReference {
  name: string;
  typicalCBRLow: number;
  typicalCBRHigh: number;
  typicalCBRMid: number;
  notes: string;
}

export const SOIL_REFERENCES: SoilReference[] = [
  { name: "Heavy / stiff clay (high PI)", typicalCBRLow: 1, typicalCBRHigh: 3, typicalCBRMid: 2, notes: "London Clay, Oxford Clay. Very moisture-sensitive." },
  { name: "Silty clay", typicalCBRLow: 1, typicalCBRHigh: 5, typicalCBRMid: 3, notes: "Common alluvial deposits. Variable with moisture." },
  { name: "Clay (medium PI)", typicalCBRLow: 2, typicalCBRHigh: 8, typicalCBRMid: 4, notes: "Boulder clay, glacial till. Moderate performance." },
  { name: "Sandy clay", typicalCBRLow: 3, typicalCBRHigh: 10, typicalCBRMid: 6, notes: "Better drainage than pure clay." },
  { name: "Silt", typicalCBRLow: 1, typicalCBRHigh: 8, typicalCBRMid: 3, notes: "Frost-susceptible. Poor when saturated." },
  { name: "Sandy silt", typicalCBRLow: 3, typicalCBRHigh: 15, typicalCBRMid: 8, notes: "Moderate bearing capacity. Frost-susceptible." },
  { name: "Fine sand", typicalCBRLow: 5, typicalCBRHigh: 15, typicalCBRMid: 10, notes: "Free-draining. Susceptible to erosion." },
  { name: "Coarse sand", typicalCBRLow: 8, typicalCBRHigh: 25, typicalCBRMid: 15, notes: "Good drainage. Moderate bearing." },
  { name: "Sand and gravel mix", typicalCBRLow: 15, typicalCBRHigh: 40, typicalCBRMid: 25, notes: "Good subgrade material." },
  { name: "Gravel (well-graded)", typicalCBRLow: 20, typicalCBRHigh: 60, typicalCBRMid: 35, notes: "Good to excellent subgrade." },
  { name: "Chalk (intact)", typicalCBRLow: 3, typicalCBRHigh: 15, typicalCBRMid: 8, notes: "Weakens dramatically when wet or remoulded." },
  { name: "Chalk (remoulded / putty)", typicalCBRLow: 1, typicalCBRHigh: 3, typicalCBRMid: 2, notes: "Putty chalk has very low CBR. Stabilisation required." },
  { name: "Peat / organic soil", typicalCBRLow: 0.5, typicalCBRHigh: 2, typicalCBRMid: 1, notes: "Not suitable as subgrade. Must be removed or improved." },
  { name: "Made ground (general fill)", typicalCBRLow: 2, typicalCBRHigh: 15, typicalCBRMid: 5, notes: "Highly variable. Test in-situ." },
  { name: "Pulverised fuel ash (PFA)", typicalCBRLow: 5, typicalCBRHigh: 20, typicalCBRMid: 10, notes: "Stabilised PFA can achieve higher values." },
  { name: "Lime-stabilised clay", typicalCBRLow: 10, typicalCBRHigh: 30, typicalCBRMid: 15, notes: "CBR improves with curing time." },
  { name: "Cement-stabilised soil", typicalCBRLow: 15, typicalCBRHigh: 50, typicalCBRMid: 30, notes: "Depends on cement content and soil type." },
  { name: "Type 1 sub-base (well-graded)", typicalCBRLow: 30, typicalCBRHigh: 80, typicalCBRMid: 50, notes: "Crushed rock or concrete. Specified material." },
  { name: "Type 2 sub-base", typicalCBRLow: 20, typicalCBRHigh: 60, typicalCBRMid: 35, notes: "Lower specification than Type 1." },
  { name: "Capping (6F2 / 6F5)", typicalCBRLow: 5, typicalCBRHigh: 15, typicalCBRMid: 8, notes: "Selected granular fill for capping layer." },
  { name: "Rock fill (crushed)", typicalCBRLow: 40, typicalCBRHigh: 100, typicalCBRMid: 60, notes: "Excellent bearing capacity." },
  { name: "Weathered mudstone", typicalCBRLow: 3, typicalCBRHigh: 15, typicalCBRMid: 8, notes: "Degrades when exposed to weather." },
  { name: "Sandstone (weathered)", typicalCBRLow: 10, typicalCBRHigh: 40, typicalCBRMid: 20, notes: "Variable with weathering grade." },
];

// ─── Chart data generation ───────────────────────────────────
export function generateChartData(): { cbr: number; powell: number; aashto: number; sa: number }[] {
  const points: { cbr: number; powell: number; aashto: number; sa: number }[] = [];
  const cbrValues = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100];
  for (const cbr of cbrValues) {
    points.push({
      cbr,
      powell: powellCBRtoModulus(cbr),
      aashto: aashtoCBRtoModulus(cbr),
      sa: southAfricanCBRtoModulus(cbr),
    });
  }
  return points;
}
