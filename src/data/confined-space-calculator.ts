// src/data/confined-space-calculator.ts
// Confined Spaces Regulations 1997, BS 7671, C&G 6160 framework

/* ── Types ─────────────────────────────────────────────────────── */

export interface RiskOption {
  /** Stable identifier used by the risk-specific controls lookup. Do not change
   *  these strings without updating RISK_SPECIFIC_CONTROLS keys. */
  id?: string;
  label: string;
  weight: number;
}

export interface ScoringSection {
  id: string;
  title: string;
  description?: string;
  /** "single" = pick one, "multi" = pick many (cumulative) */
  mode: "single" | "multi";
  options: RiskOption[];
}

export type NCCategory = "NC1" | "NC2" | "NC3" | "NC4";

export interface CategoryResult {
  category: NCCategory;
  label: string;
  colour: string;       // tailwind bg class
  textColour: string;    // tailwind text class
  borderColour: string;  // tailwind border class
  minScore: number;
  maxScore: number;
}

export interface CategoryRequirements {
  rams: string;
  qualification: string;
  rescuePlan: string;
  gasMonitoring: string;
  topMan: string;
  healthAssessment: string;
  training: string;
  firstAid: string;
  baEscapeSet: string;
  ventilation: string;
  harness: string;
  access: string;
  lighting: string;
  permit: string;
}

/* ── Gate questions ────────────────────────────────────────────── */

export const GATE_QUESTIONS = {
  enclosed: "Is the space fully enclosed or partially enclosed?",
  risksPresent: "Are any of the foreseeable specified risks below present?",
};

/* ── Scoring sections ─────────────────────────────────────────── */

export const SCORING_SECTIONS: ScoringSection[] = [
  {
    id: "foreseeable_risks",
    title: "Foreseeable Specified Risks",
    description: "Select all specified risks that are present. If none are present, this is not a confined space under the Regulations.",
    mode: "multi",
    options: [
      { id: "fire_explosion",     label: "Serious injury from fire or explosion", weight: 5 },
      { id: "temperature",        label: "Loss of consciousness from increase in body temperature", weight: 5 },
      { id: "gas_fume",           label: "Loss of consciousness or asphyxiation from gas, fume, vapour or lack of oxygen", weight: 5 },
      { id: "drowning",           label: "Drowning from increase in liquid level", weight: 5 },
      { id: "free_flowing_solid", label: "Asphyxiation from free-flowing solid or entrapment", weight: 5 },
    ],
  },
  {
    id: "depth",
    title: "Depth (Metres)",
    mode: "single",
    options: [
      { label: "0m - 1.5m", weight: 0 },
      { label: "1.5m - 3m", weight: 1 },
      { label: "3m - 6m", weight: 3 },
      { label: "6m - 10m", weight: 4 },
      { label: "10m+", weight: 5 },
    ],
  },
  {
    id: "access_egress",
    title: "Access / Egress",
    mode: "single",
    options: [
      { label: "Easy - ground level", weight: 0 },
      { label: "Good - fixed stairs, fall arrestor available", weight: 1 },
      { label: "Fair - inclined temporary ladder or fixed vertical ladder <3m", weight: 2 },
      { label: "Structure - outside influence of fire, access inside at risk of being blocked", weight: 3 },
      { label: "Poor - inclined temporary ladder or fixed vertical ladder >3m", weight: 3 },
      { label: "Fixed step irons or no fixed access possible", weight: 4 },
    ],
  },
  {
    id: "ventilation",
    title: "Ventilation",
    mode: "single",
    options: [
      { label: "Through flow", weight: 0 },
      { label: "Open topped (e.g. excavation)", weight: 1 },
      { label: "Fair", weight: 2 },
      { label: "Poor", weight: 3 },
      { label: "None", weight: 5 },
    ],
  },
  {
    id: "atmosphere",
    title: "Chance of Toxic, Flammable Atmosphere or No Oxygen",
    description: "Consider condition of gas mains (if close/known), introduction of hot works, chlorine gas, hydrogen sulphide.",
    mode: "single",
    options: [
      { label: "Extremely unlikely (may be newly constructed confined space)", weight: 0 },
      { label: "Remote", weight: 1 },
      { label: "Possible", weight: 2 },
      { label: "Probable", weight: 4 },
      { label: "Certain (e.g. welding fumes)", weight: 6 },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    mode: "single",
    options: [
      { label: "Top man can clearly see operatives", weight: 0 },
      { label: "Work away from vision of top man, escape possible within 2 mins", weight: 1 },
      { label: "Work away from vision of top man, escape not possible within 2 mins", weight: 6 },
    ],
  },
  {
    id: "temperature",
    title: "Temperature / Physical Demand",
    mode: "single",
    options: [
      { label: "Work is not arduous", weight: 0 },
      { label: "Work involves repetitive manual handling without continuous BA", weight: 2 },
      { label: "Work involves repetitive manual handling with continuous BA", weight: 4 },
    ],
  },
];

/* ── Category bands ───────────────────────────────────────────── */

export const CATEGORY_BANDS: CategoryResult[] = [
  { category: "NC1", label: "Low Risk", colour: "bg-green-100", textColour: "text-green-800", borderColour: "border-green-300", minScore: 0, maxScore: 9 },
  { category: "NC2", label: "Medium Risk", colour: "bg-amber-100", textColour: "text-amber-800", borderColour: "border-amber-300", minScore: 10, maxScore: 15 },
  { category: "NC3", label: "High Risk", colour: "bg-red-100", textColour: "text-red-800", borderColour: "border-red-300", minScore: 16, maxScore: 20 },
  { category: "NC4", label: "High Risk inc Rescue", colour: "bg-red-200", textColour: "text-red-900", borderColour: "border-red-400", minScore: 21, maxScore: 999 },
];

/* ── Category requirements ────────────────────────────────────── */

export const CATEGORY_REQUIREMENTS: Record<NCCategory, CategoryRequirements> = {
  NC1: {
    rams: "Appropriate RAMS written/reviewed by Appointed Person",
    qualification: "C&G 6160-01",
    rescuePlan: "Suitable emergency rescue plan in place",
    gasMonitoring: "Gas monitor requirements to be assessed and provided if necessary",
    topMan: "HSE ACOP L101 recommends a person stationed outside the space for ALL confined-space entries regardless of risk category. At NC1 this may be reduced where good two-way communication and easy egress exist, but the duty-holder must be satisfied that competent external rescue is still available and that leaving no attendant is justified in the risk assessment.",
    healthAssessment: "Operatives health assessed to safety critical worker standard, where escape BA is to be worn",
    training: "Safety briefing required for those entering - to be delivered on site by a competent person who holds a Low Risk C&G 6160-01 qualification",
    firstAid: "Level 2 Emergency First Aid at Work Training",
    baEscapeSet: "Good access/egress provided",
    ventilation: "Good lighting and communications as required",
    harness: "Not required",
    access: "Good access/egress provided",
    lighting: "Good lighting and communications as required",
    permit: "Confined space permit to be issued",
  },
  NC2: {
    rams: "Appropriate RAMS written/reviewed by Appointed Person",
    qualification: "C&G 6160-02",
    rescuePlan: "Suitable emergency rescue plan in place",
    gasMonitoring: "Minimum gas monitor at point of works",
    topMan: "Top Man present at point of entry / outside of excavation",
    healthAssessment: "Operatives health assessed to safety critical worker standard, where escape BA is to be worn",
    training: "Level 2 Medium Risk C&G 6160-02 training required for those entering, and C&G 6160-04/09 for Entry Controller",
    firstAid: "Level 2 Emergency First Aid at Work Training",
    baEscapeSet: "10-minute escape set required where the atmosphere risk assessment identifies any potential for toxic gases, flammable atmospheres, or oxygen deficiency — regardless of pre-entry test result, because atmospheres can change during work",
    ventilation: "Suitable means of access/egress provided (if not already available)",
    harness: "Not required",
    access: "Suitable means of access/egress provided (if not already available)",
    lighting: "Provision of suitable task lighting and clear sight communications is required",
    permit: "Confined space permit to be issued",
  },
  NC3: {
    rams: "Appropriate RAMS written/reviewed by Appointed Person",
    qualification: "C&G 6160-02/03 & C&G 6160-04",
    rescuePlan: "Suitable emergency rescue plan in place, which may include on-site rescue team",
    gasMonitoring: "Personal cell gas monitor worn (minimum 4-cell)",
    topMan: "Top Person present at point of entry / outside of excavation and must hold C&G 6160-04",
    healthAssessment: "Operatives health assessed to safety critical worker standard",
    training: "Level 3 High Risk training required for both those entering and the Entry Controller must hold C&G 6160-04",
    firstAid: "Level 3 First Aid at Work Training",
    baEscapeSet: "10-minute escape set worn by all within confined space",
    ventilation: "Forced air ventilation as required",
    harness: "Safety harness and line worn by those entering (where practical)",
    access: "Suitable means of access/egress to be provided (if not already available)",
    lighting: "Provision of suitable task lighting and communications as required",
    permit: "Confined space permit to be issued",
  },
  NC4: {
    rams: "Appropriate RAMS written/reviewed by Appointed Person",
    qualification: "C&G 6160-03 & C&G 6160-04",
    rescuePlan: "High level emergency rescue plan in place. Site rescue team must be provided",
    gasMonitoring: "Personal cell gas monitor worn (minimum 4-cell)",
    topMan: "Top Man present at point of entry with tripod and winch (or equivalent). Bottom man is required",
    healthAssessment: "Operatives health assessed to compressed air breathing apparatus standard",
    training: "Level 3 High Risk rescue training required. C&G 6160-08 or/and Emergency Rescue/Recovery of Casualties from Confined Spaces C&G 6160-07",
    firstAid: "Level 3 First Aid at Work Training",
    baEscapeSet: "Full breathing apparatus worn by all within confined space",
    ventilation: "Forced air ventilation",
    harness: "Safety harness and line worn by those entering (where practical)",
    access: "Suitable means of access/egress to be provided (if not already available)",
    lighting: "Provision of suitable task lighting and communications as required",
    permit: "Confined space permit to be issued",
  },
};

/* ── Requirement row labels (for display and PDF) ─────────────── */

export const REQUIREMENT_LABELS: { key: keyof CategoryRequirements; label: string }[] = [
  { key: "rams", label: "RAMS" },
  { key: "qualification", label: "Qualification" },
  { key: "rescuePlan", label: "Rescue Plan" },
  { key: "gasMonitoring", label: "Gas Monitoring" },
  { key: "topMan", label: "Top Man" },
  { key: "healthAssessment", label: "Health Assessment" },
  { key: "training", label: "Training" },
  { key: "firstAid", label: "First Aid" },
  { key: "baEscapeSet", label: "BA / Escape Set" },
  { key: "ventilation", label: "Ventilation" },
  { key: "harness", label: "Harness" },
  { key: "access", label: "Access" },
  { key: "lighting", label: "Lighting" },
  { key: "permit", label: "Permit" },
];

/* ── Scoring helpers ──────────────────────────────────────────── */

export function getCategory(totalScore: number): CategoryResult {
  for (const band of CATEGORY_BANDS) {
    if (totalScore >= band.minScore && totalScore <= band.maxScore) return band;
  }
  return CATEGORY_BANDS[0]; // fallback NC1
}

export function getRequirements(cat: NCCategory): CategoryRequirements {
  return CATEGORY_REQUIREMENTS[cat];
}

/* ── Risk-specific additional controls ────────────────────────── */
/* Per Confined Spaces Regulations 1997, L101 ACOP, Water UK Guidance */

export interface RiskSpecificControl {
  riskLabel: string;
  controls: string[];
}

export const RISK_SPECIFIC_CONTROLS: Record<string, RiskSpecificControl> = {
  fire_explosion: {
    riskLabel: "Fire / Explosion",
    controls: [
      "All electrical equipment brought into the confined space must be intrinsically safe (ATEX rated)",
      "Activities such as cutting or welding must not generate sparks unless conditions to eliminate likelihood of fire or explosion have been met",
      "Hot works permit required in addition to confined space permit",
      "Flammable atmosphere testing must be carried out before and during entry",
      "Fire extinguisher(s) suitable for the environment must be available at point of entry",
      "Sources of ignition must be identified and eliminated or controlled",
    ],
  },
  temperature: {
    riskLabel: "Increased Body Temperature",
    controls: [
      "Work rate and duration must be managed to prevent heat stress",
      "Cool drinking water must be available at point of entry",
      "Rest periods must be planned and enforced",
      "Temperature monitoring of the space and operatives must be carried out",
      "Emergency cooling measures must be available",
    ],
  },
  gas_fume: {
    riskLabel: "Gas / Fume / Vapour / Lack of Oxygen",
    controls: [
      "The confined space must be opened and allowed to vent for a minimum period of 15 minutes before entry",
      "Barriers and warning signage must be positioned to keep people away during venting",
      "Atmosphere must be tested in 3 areas (top, middle, bottom) for a minimum of 5 minutes per location",
      "Gas monitor must have a valid calibration date",
      "Continuous atmosphere monitoring must be carried out whilst personnel are inside",
      "If the gas monitor emits an alarm, all personnel must immediately don escape BA and evacuate",
      "All gas alarm activations must be reported as a Near Miss",
    ],
  },
  drowning: {
    riskLabel: "Drowning",
    controls: [
      "Physically lock off all flow valves or discharge pipes that may affect the confined space",
      "Confirmation of all isolations must be recorded and signed off on the entry permit",
      "Water level monitoring must be in place throughout the entry",
      "Emergency pump or drainage must be available at point of entry",
      "Personnel must wear suitable waterproof PPE",
    ],
  },
  free_flowing_solid: {
    riskLabel: "Free-Flowing Solid / Entrapment",
    controls: [
      "All feed mechanisms and conveyors must be physically isolated and locked off",
      "Confirmation of isolation must be recorded and signed off on the entry permit",
      "Material levels must be monitored throughout the entry",
      "Suitable rescue equipment must be available for entrapment scenarios",
      "Personnel must not stand on or work below stored free-flowing materials",
    ],
  },
};

/**
 * Look up the risk-specific controls for a given foreseeable-risk option.
 * Prefers the option's stable `id`; falls back to label match if `id` is
 * missing (defensive — older data may not have the id field set).
 */
export function getRiskSpecificControls(option: RiskOption): RiskSpecificControl | null {
  if (option.id && RISK_SPECIFIC_CONTROLS[option.id]) {
    return RISK_SPECIFIC_CONTROLS[option.id];
  }
  // Fallback: label-based lookup for legacy callers
  const labelMap: Record<string, string> = {
    "Serious injury from fire or explosion": "fire_explosion",
    "Loss of consciousness from increase in body temperature": "temperature",
    "Loss of consciousness or asphyxiation from gas, fume, vapour or lack of oxygen": "gas_fume",
    "Drowning from increase in liquid level": "drowning",
    "Asphyxiation from free-flowing solid or entrapment": "free_flowing_solid",
  };
  const key = labelMap[option.label];
  return key ? RISK_SPECIFIC_CONTROLS[key] ?? null : null;
}

/**
 * @deprecated Use `getRiskSpecificControls(option)` with the option's `id`
 * field instead. This index-based map silently breaks if the options array
 * is reordered and is retained only for backwards compatibility with any
 * existing callers.
 */
export const RISK_INDEX_TO_KEY: Record<number, string> = {
  0: "fire_explosion",
  1: "temperature",
  2: "gas_fume",
  3: "drowning",
  4: "free_flowing_solid",
};

