// src/data/dust-silica-calculator.ts

// ─── Workplace Exposure Limits (WEL) ──────────────────────────
export const WEL = {
  rcs: 0.1,          // mg/m3 8-hr TWA — respirable crystalline silica
  inhalable: 10.0,   // mg/m3 8-hr TWA
  respirable: 4.0,   // mg/m3 8-hr TWA
} as const;

export const SHIFT_HOURS = 8; // standard 8-hr reference period

// ─── Activity Database ────────────────────────────────────────
export interface DustActivity {
  id: string;
  name: string;
  category: "cutting" | "drilling" | "grinding" | "breaking" | "general" | "earthworks" | "finishing" | "tunnelling";
  silicaRisk: "very_high" | "high" | "medium" | "low" | "negligible";
  /** Uncontrolled dust generation rate mg/m3 (respirable) */
  uncontrolledRespirable: number;
  /** Uncontrolled RCS generation rate mg/m3 */
  uncontrolledRCS: number;
  /** Uncontrolled inhalable dust mg/m3 */
  uncontrolledInhalable: number;
  /** Silica content % of parent material */
  silicaContentPercent: number;
  notes: string;
}

export const ACTIVITY_DATABASE: DustActivity[] = [
  // Cutting
  { id: "concrete_disc_cut", name: "Concrete cutting (disc cutter)", category: "cutting", silicaRisk: "very_high", uncontrolledRespirable: 12.0, uncontrolledRCS: 3.0, uncontrolledInhalable: 40.0, silicaContentPercent: 25, notes: "Dry cutting generates very high RCS. Always use water suppression or LEV." },
  { id: "block_cutting", name: "Block cutting (masonry saw)", category: "cutting", silicaRisk: "high", uncontrolledRespirable: 8.0, uncontrolledRCS: 1.5, uncontrolledInhalable: 25.0, silicaContentPercent: 20, notes: "Dense blocks contain significant silica. Wet cutting preferred." },
  { id: "brick_cutting", name: "Brick cutting", category: "cutting", silicaRisk: "high", uncontrolledRespirable: 6.0, uncontrolledRCS: 1.2, uncontrolledInhalable: 20.0, silicaContentPercent: 18, notes: "Engineering bricks have higher silica than commons." },
  { id: "kerb_flag_cutting", name: "Kerb / flag cutting", category: "cutting", silicaRisk: "very_high", uncontrolledRespirable: 14.0, uncontrolledRCS: 4.0, uncontrolledInhalable: 45.0, silicaContentPercent: 30, notes: "Concrete kerbs and flags are very high silica. Mandatory water suppression." },
  { id: "stone_cutting", name: "Natural stone cutting / grinding", category: "cutting", silicaRisk: "very_high", uncontrolledRespirable: 15.0, uncontrolledRCS: 5.0, uncontrolledInhalable: 50.0, silicaContentPercent: 35, notes: "Sandstone, granite can exceed 70% silica. Highest risk category." },
  { id: "road_planing", name: "Road planing / milling", category: "cutting", silicaRisk: "high", uncontrolledRespirable: 5.0, uncontrolledRCS: 1.0, uncontrolledInhalable: 18.0, silicaContentPercent: 20, notes: "Operator cab provides some protection. Ground workers at higher risk." },
  { id: "pipe_cutting_concrete", name: "Concrete pipe cutting", category: "cutting", silicaRisk: "high", uncontrolledRespirable: 10.0, uncontrolledRCS: 2.5, uncontrolledInhalable: 35.0, silicaContentPercent: 25, notes: "Confined trench environment may increase exposure. Use water suppression." },

  // Drilling
  { id: "concrete_drilling", name: "Concrete drilling / coring", category: "drilling", silicaRisk: "high", uncontrolledRespirable: 8.0, uncontrolledRCS: 2.0, uncontrolledInhalable: 28.0, silicaContentPercent: 25, notes: "Diamond core drills with water suppression significantly reduce exposure." },
  { id: "hammer_drilling", name: "Hammer drilling (SDS)", category: "drilling", silicaRisk: "high", uncontrolledRespirable: 6.0, uncontrolledRCS: 1.5, uncontrolledInhalable: 22.0, silicaContentPercent: 25, notes: "Dust extraction attachment recommended. Short-duration high peak exposure." },
  { id: "rock_drilling", name: "Rock drilling / bolting", category: "drilling", silicaRisk: "very_high", uncontrolledRespirable: 10.0, uncontrolledRCS: 3.5, uncontrolledInhalable: 35.0, silicaContentPercent: 35, notes: "Depends on geology. Sandstone/quartzite highest risk." },

  // Grinding
  { id: "angle_grinding_concrete", name: "Angle grinding concrete", category: "grinding", silicaRisk: "very_high", uncontrolledRespirable: 14.0, uncontrolledRCS: 3.5, uncontrolledInhalable: 42.0, silicaContentPercent: 25, notes: "Grinding generates very fine respirable dust. LEV shroud essential." },
  { id: "angle_grinding_mortar", name: "Angle grinding mortar joints", category: "grinding", silicaRisk: "high", uncontrolledRespirable: 10.0, uncontrolledRCS: 2.0, uncontrolledInhalable: 30.0, silicaContentPercent: 20, notes: "Repointing work in confined areas is high risk." },
  { id: "floor_grinding", name: "Floor grinding / polishing", category: "grinding", silicaRisk: "very_high", uncontrolledRespirable: 12.0, uncontrolledRCS: 3.0, uncontrolledInhalable: 38.0, silicaContentPercent: 25, notes: "Machine-mounted LEV and vacuum extraction recommended." },
  { id: "scabbling", name: "Concrete scabbling", category: "grinding", silicaRisk: "very_high", uncontrolledRespirable: 16.0, uncontrolledRCS: 4.0, uncontrolledInhalable: 48.0, silicaContentPercent: 25, notes: "Among the highest dust-generating activities. Full controls required." },

  // Breaking / demolition
  { id: "concrete_breaking", name: "Concrete breaking / demolition", category: "breaking", silicaRisk: "high", uncontrolledRespirable: 6.0, uncontrolledRCS: 1.5, uncontrolledInhalable: 22.0, silicaContentPercent: 25, notes: "Hydraulic breakers generate less airborne dust than hand tools. Water damping recommended." },
  { id: "chasing", name: "Wall chasing", category: "breaking", silicaRisk: "very_high", uncontrolledRespirable: 12.0, uncontrolledRCS: 3.0, uncontrolledInhalable: 38.0, silicaContentPercent: 25, notes: "Enclosed environment with high dust. Integrated extraction essential." },

  // General / housekeeping
  { id: "sweeping", name: "Sweeping / dry cleaning", category: "general", silicaRisk: "medium", uncontrolledRespirable: 4.0, uncontrolledRCS: 0.6, uncontrolledInhalable: 15.0, silicaContentPercent: 15, notes: "Dry sweeping resuspends settled dust. Damp sweep or vacuum preferred." },
  { id: "bagging_rubble", name: "Bagging rubble / debris", category: "general", silicaRisk: "medium", uncontrolledRespirable: 3.5, uncontrolledRCS: 0.5, uncontrolledInhalable: 12.0, silicaContentPercent: 15, notes: "Dusty conditions when filling bags. Dampen material first." },
  { id: "mortar_mixing", name: "Mortar / cement mixing", category: "general", silicaRisk: "medium", uncontrolledRespirable: 3.0, uncontrolledRCS: 0.4, uncontrolledInhalable: 12.0, silicaContentPercent: 12, notes: "Portland cement contains silica. Pre-mixed products reduce exposure." },
  { id: "plaster_sanding", name: "Plaster / filler sanding", category: "finishing", silicaRisk: "low", uncontrolledRespirable: 5.0, uncontrolledRCS: 0.15, uncontrolledInhalable: 18.0, silicaContentPercent: 3, notes: "Low silica but high general dust. Good ventilation and RPE recommended." },

  // Earthworks
  { id: "excavation_sandy", name: "Excavation in sandy / silty soils", category: "earthworks", silicaRisk: "medium", uncontrolledRespirable: 2.5, uncontrolledRCS: 0.4, uncontrolledInhalable: 10.0, silicaContentPercent: 15, notes: "Dry conditions increase risk. Water spray plant/haul roads." },
  { id: "excavation_rock", name: "Excavation in rock / sandstone", category: "earthworks", silicaRisk: "high", uncontrolledRespirable: 4.0, uncontrolledRCS: 1.2, uncontrolledInhalable: 16.0, silicaContentPercent: 30, notes: "Hydraulic breaker on rock produces significant airborne silica." },
  { id: "site_clearance", name: "Site clearance / stripping", category: "earthworks", silicaRisk: "low", uncontrolledRespirable: 2.0, uncontrolledRCS: 0.2, uncontrolledInhalable: 8.0, silicaContentPercent: 10, notes: "Typically lower risk unless dry and windy conditions." },
  { id: "bulk_earthmoving", name: "Bulk earthmoving (dry conditions)", category: "earthworks", silicaRisk: "medium", uncontrolledRespirable: 3.0, uncontrolledRCS: 0.5, uncontrolledInhalable: 12.0, silicaContentPercent: 15, notes: "Cab protection for operators. Ground workers at higher risk." },
  { id: "tipping_crushing", name: "Tipping / crushing operations", category: "earthworks", silicaRisk: "high", uncontrolledRespirable: 5.0, uncontrolledRCS: 1.0, uncontrolledInhalable: 18.0, silicaContentPercent: 20, notes: "Mobile crushers generate sustained dust. Water suppression systems required." },

  // Tunnelling
  { id: "tunnel_boring", name: "Tunnel / shaft boring", category: "tunnelling", silicaRisk: "very_high", uncontrolledRespirable: 12.0, uncontrolledRCS: 4.0, uncontrolledInhalable: 40.0, silicaContentPercent: 35, notes: "Confined space with poor natural ventilation. Forced ventilation and RPE mandatory." },
  { id: "shotcreting", name: "Shotcreting / sprayed concrete", category: "tunnelling", silicaRisk: "high", uncontrolledRespirable: 6.0, uncontrolledRCS: 1.5, uncontrolledInhalable: 22.0, silicaContentPercent: 25, notes: "Wet-mix process reduces dust vs dry-mix. RPE still required." },
];

export const ACTIVITY_CATEGORIES = [
  { id: "cutting", label: "Cutting" },
  { id: "drilling", label: "Drilling" },
  { id: "grinding", label: "Grinding" },
  { id: "breaking", label: "Breaking / Demolition" },
  { id: "general", label: "General / Housekeeping" },
  { id: "earthworks", label: "Earthworks" },
  { id: "finishing", label: "Finishing" },
  { id: "tunnelling", label: "Tunnelling" },
] as const;

// ─── Control Measures ─────────────────────────────────────────
export interface ControlMeasure {
  id: string;
  name: string;
  hierarchy: 1 | 2 | 3 | 4 | 5; // COSHH hierarchy: 1=eliminate, 2=substitute, 3=engineering, 4=admin, 5=PPE
  hierarchyLabel: string;
  reductionFactor: number; // multiplier 0-1: controlled = uncontrolled × factor
  practicality: "high" | "medium" | "low";
  costRating: 1 | 2 | 3; // 1=low cost, 3=high cost
  notes: string;
}

export const CONTROL_MEASURES: ControlMeasure[] = [
  { id: "eliminate", name: "Eliminate task (alternative method)", hierarchy: 1, hierarchyLabel: "Elimination", reductionFactor: 0, practicality: "low", costRating: 2, notes: "Consider whether the task is necessary or if a dust-free method exists." },
  { id: "substitute_material", name: "Substitute lower-silica material", hierarchy: 2, hierarchyLabel: "Substitution", reductionFactor: 0.3, practicality: "medium", costRating: 2, notes: "E.g. pre-cut blocks, pre-formed concrete, fibre cement instead of concrete." },
  { id: "substitute_method", name: "Substitute method (crush not cut)", hierarchy: 2, hierarchyLabel: "Substitution", reductionFactor: 0.5, practicality: "medium", costRating: 1, notes: "E.g. block splitter instead of disc cutter, nibbler instead of grinder." },
  { id: "water_suppression", name: "Water suppression (tool-mounted)", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.15, practicality: "high", costRating: 1, notes: "Integrated water feed on disc cutters, core drills. Reduces airborne dust ~85%. Per HSE INDG463." },
  { id: "water_spray_area", name: "Water spray (area damping)", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.4, practicality: "high", costRating: 1, notes: "Spraying haul roads, stockpiles, work areas. Reduces airborne dust ~60%." },
  { id: "lev_tool", name: "Local exhaust ventilation (on-tool)", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.1, practicality: "high", costRating: 2, notes: "Vacuum extraction attached to tool. Reduces exposure ~90%. Requires M-class or H-class extractor." },
  { id: "lev_booth", name: "LEV / extraction booth", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.05, practicality: "low", costRating: 3, notes: "Enclosed extraction booth for workshop cutting. Reduces exposure ~95%." },
  { id: "enclosure", name: "Full enclosure of process", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.05, practicality: "low", costRating: 3, notes: "Total enclosure with extraction. Highest engineering control." },
  { id: "ventilation", name: "General forced ventilation", hierarchy: 3, hierarchyLabel: "Engineering", reductionFactor: 0.5, practicality: "medium", costRating: 2, notes: "Fans and ducting to dilute and remove airborne dust. Less effective than LEV." },
  { id: "reduce_duration", name: "Reduce exposure duration (rotation)", hierarchy: 4, hierarchyLabel: "Administrative", reductionFactor: 1.0, practicality: "high", costRating: 1, notes: "NOTE: This is a TIME control, not a concentration control. Model its effect by REDUCING THE TASK DURATION in the task schedule above (e.g. from 240 min to 120 min). Selecting this alone does not reduce calculated concentration." },
  { id: "segregation", name: "Segregation (exclusion zone)", hierarchy: 4, hierarchyLabel: "Administrative", reductionFactor: 1.0, practicality: "high", costRating: 1, notes: "NOTE: This is a SCOPE / BYSTANDER control — it protects non-essential workers, not the operator doing the task. It does not reduce the operator's exposure concentration. Record on the risk assessment separately." },
  { id: "damp_sweep", name: "Damp sweeping / vacuum (not dry sweep)", hierarchy: 4, hierarchyLabel: "Administrative", reductionFactor: 0.7, practicality: "high", costRating: 1, notes: "Avoid dry sweeping which resuspends settled dust." },
];

// ─── RPE (Respiratory Protective Equipment) ───────────────────
export interface RPEType {
  id: string;
  name: string;
  apf: number; // Assigned Protection Factor
  suitableFor: string;
  fitTestRequired: boolean;
  maxUseHours: number;
  notes: string;
}

export const RPE_TYPES: RPEType[] = [
  { id: "ffp2", name: "FFP2 Disposable Mask", apf: 10, suitableFor: "Low to medium dust exposure below WEL x 10", fitTestRequired: true, maxUseHours: 4, notes: "Must be face-fit tested. Single use. Not suitable for beards." },
  { id: "ffp3", name: "FFP3 Disposable Mask", apf: 20, suitableFor: "Medium to high dust/silica exposure below WEL x 20", fitTestRequired: true, maxUseHours: 4, notes: "Highest protection disposable. Must be face-fit tested." },
  { id: "half_p3", name: "Half-Mask Respirator + P3 Filters", apf: 20, suitableFor: "Regular silica exposure below WEL x 20", fitTestRequired: true, maxUseHours: 8, notes: "Reusable. More comfortable for extended use. Filters must be replaced regularly." },
  { id: "full_p3", name: "Full-Face Respirator + P3 Filters", apf: 40, suitableFor: "High silica exposure below WEL x 40", fitTestRequired: true, maxUseHours: 8, notes: "Eye protection included. Required for very high dust levels." },
  { id: "papr", name: "Powered Air-Purifying Respirator (PAPR)", apf: 40, suitableFor: "Extended high exposure, beard wearers, comfort", fitTestRequired: false, maxUseHours: 8, notes: "Does not require face fit. Suitable for facial hair. Battery powered." },
];

// ─── Silica risk labels ───────────────────────────────────────
export const SILICA_RISK_LABELS: Record<string, { label: string; colour: string; dotColour: string }> = {
  very_high: { label: "Very High", colour: "text-red-700 bg-red-50 border-red-200", dotColour: "bg-red-500" },
  high: { label: "High", colour: "text-orange-700 bg-orange-50 border-orange-200", dotColour: "bg-orange-500" },
  medium: { label: "Medium", colour: "text-amber-700 bg-amber-50 border-amber-200", dotColour: "bg-amber-500" },
  low: { label: "Low", colour: "text-yellow-700 bg-yellow-50 border-yellow-200", dotColour: "bg-yellow-500" },
  negligible: { label: "Negligible", colour: "text-green-700 bg-green-50 border-green-200", dotColour: "bg-green-500" },
};

// ─── Exposure Status ──────────────────────────────────────────
export type ExposureStatus = "green" | "amber" | "red";

export function getExposureStatus(twa: number, wel: number): ExposureStatus {
  const ratio = twa / wel;
  if (ratio < 0.5) return "green";
  if (ratio <= 1.0) return "amber";
  return "red";
}

export const STATUS_COLOURS: Record<ExposureStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  green: { label: "Below 50% WEL", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" },
  amber: { label: "50-100% WEL", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  red: { label: "Above WEL", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
};

// ─── Calculation functions ────────────────────────────────────

/** Calculate 8-hour TWA exposure for a set of task durations and concentrations */
export function calculate8hrTWA(
  tasks: { durationMinutes: number; concentration: number }[]
): number {
  if (tasks.length === 0) return 0;
  const totalExposure = tasks.reduce((sum, t) => sum + (t.concentration * t.durationMinutes), 0);
  return totalExposure / (SHIFT_HOURS * 60); // divide by 480 minutes
}

/** Calculate controlled concentration after applying control measures */
export function applyControls(
  uncontrolled: number,
  controlIds: string[]
): number {
  if (controlIds.length === 0) return uncontrolled;
  // Apply controls multiplicatively, BUT cap the cumulative reduction at
  // 95 % (floor factor 0.05). Stacking water suppression + LEV + general
  // ventilation naively multiplies to 0.0075 (99.25 % reduction) which
  // overstates what real-world control combinations achieve — published
  // studies (HSE INDG463, HSE RR1071 on tool-mounted LEV) typically find
  // 85–95 % reduction even when multiple engineering controls are in
  // place. The floor reflects that no combination of engineering /
  // administrative controls alone (i.e. short of elimination) will
  // reliably eliminate exposure — PPE is always required as a backstop.
  // Elimination (reductionFactor = 0) is NOT capped — zero exposure is
  // achievable when the task is entirely avoided.
  const MIN_CUMULATIVE_FACTOR = 0.05;
  let cumulativeFactor = 1;
  let hasElimination = false;
  for (const cid of controlIds) {
    const ctrl = CONTROL_MEASURES.find(c => c.id === cid);
    if (!ctrl) continue;
    if (ctrl.reductionFactor === 0) { hasElimination = true; break; }
    cumulativeFactor *= ctrl.reductionFactor;
  }
  if (hasElimination) return 0;
  if (cumulativeFactor < MIN_CUMULATIVE_FACTOR) cumulativeFactor = MIN_CUMULATIVE_FACTOR;
  return uncontrolled * cumulativeFactor;
}

/** Calculate time (minutes) to reach a given WEL at a given concentration */
export function timeToReachWEL(concentration: number, wel: number): number | null {
  if (concentration <= 0) return null;
  // TWA = (C × T) / 480 = WEL → T = WEL × 480 / C
  const minutes = (wel * SHIFT_HOURS * 60) / concentration;
  return minutes;
}

/** Recommend minimum RPE based on controlled exposure vs WEL */
export function recommendRPE(controlledConcentration: number, wel: number): RPEType | null {
  if (controlledConcentration <= 0) return null;
  const requiredAPF = controlledConcentration / wel;
  if (requiredAPF <= 1) return null; // No RPE needed
  // Find lowest APF RPE that provides sufficient protection
  const sorted = [...RPE_TYPES].sort((a, b) => a.apf - b.apf);
  return sorted.find(r => r.apf >= requiredAPF) || sorted[sorted.length - 1];
}

/** Get worst status across all exposure types */
export function getOverallStatus(
  rcsTWA: number,
  respirableTWA: number,
  inhalableTWA: number,
): ExposureStatus {
  const statuses = [
    getExposureStatus(rcsTWA, WEL.rcs),
    getExposureStatus(respirableTWA, WEL.respirable),
    getExposureStatus(inhalableTWA, WEL.inhalable),
  ];
  if (statuses.includes("red")) return "red";
  if (statuses.includes("amber")) return "amber";
  return "green";
}
