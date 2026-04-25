// src/data/wbgt-heat-stress-calculator.ts
// WBGT Heat Stress Calculator — ISO 7243 / HSE thermal comfort guidance
// All data, types, interfaces, scoring tables, controls database

// ─── Types ───────────────────────────────────────────────────────

export type InputMode = "direct" | "estimated";
export type OutputMode = "daily" | "weekly";
export type RiskLevel = "green" | "amber" | "red";
export type SunExposure = "full-sun" | "partial-shade" | "full-shade" | "indoor";

export interface ActivityLevel {
  id: string;
  label: string;
  isoLabel: string;
  metabolicRateW: number;
  constructionExamples: string;
}

export interface WorkRestRatio {
  label: string;
  workMinutes: number;
  restMinutes: number;
  /** WBGT limit °C per activity level id */
  limits: Record<string, number>;
}

export interface RiskThreshold {
  level: RiskLevel;
  label: string;
  colour: string;
  bgColour: string;
  borderColour: string;
  description: string;
}

export interface HeatControl {
  id: string;
  title: string;
  description: string;
  category: "engineering" | "administrative" | "ppe" | "welfare";
  minRiskLevel: RiskLevel; // minimum risk level to trigger this control
}

export interface DirectInputs {
  dryBulbC: number | null;
  wetBulbC: number | null;
  globeTempC: number | null;
}

export interface EstimatedInputs {
  airTempC: number | null;
  relativeHumidity: number | null;
  windSpeedKmh: number | null;
  sunExposure: SunExposure;
}

export interface DayEntry {
  label: string;
  mode: InputMode;
  direct: DirectInputs;
  estimated: EstimatedInputs;
  activityLevel: string;
}

export interface WBGTResult {
  wbgt: number | null;
  riskLevel: RiskLevel;
  applicableRatio: string; // work/rest ratio label
  maxContinuousMinutes: number;
  allRatios: { ratio: WorkRestRatio; applicable: boolean; wbgtLimit: number }[];
  controls: HeatControl[];
}

// ─── Activity Levels (ISO 7243 + construction terms) ─────────────

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  {
    id: "light",
    label: "Light",
    isoLabel: "ISO 7243 Class 1 (low metabolic rate)",
    metabolicRateW: 180,
    constructionExamples: "Supervising, driving plant, office work, banksman duties",
  },
  {
    id: "moderate",
    label: "Moderate",
    isoLabel: "ISO 7243 Class 2 (moderate metabolic rate)",
    metabolicRateW: 300,
    constructionExamples: "Walking on site, light tool use, painting, measuring/setting out, operating hand tools",
  },
  {
    id: "heavy",
    label: "Heavy",
    isoLabel: "ISO 7243 Class 3 (high metabolic rate)",
    metabolicRateW: 415,
    constructionExamples: "Shovelling, steel fixing, formwork, pipe laying, manual handling of materials",
  },
  {
    id: "very-heavy",
    label: "Very Heavy",
    isoLabel: "ISO 7243 Class 4 (very high metabolic rate)",
    metabolicRateW: 520,
    constructionExamples: "Sustained heavy digging, carrying heavy loads uphill, breaking out concrete, demolition work",
  },
];

// ─── Work/Rest Ratios (ISO 7243 Table A.1) ──────────────────────
// WBGT reference values (°C) for acclimatised workers

export const WORK_REST_RATIOS: WorkRestRatio[] = [
  {
    label: "Continuous work",
    workMinutes: 60,
    restMinutes: 0,
    limits: { light: 33, moderate: 28, heavy: 25, "very-heavy": 23 },
  },
  {
    label: "75% work / 25% rest",
    workMinutes: 45,
    restMinutes: 15,
    limits: { light: 34, moderate: 29, heavy: 26, "very-heavy": 24 },
  },
  {
    label: "50% work / 50% rest",
    workMinutes: 30,
    restMinutes: 30,
    limits: { light: 35, moderate: 30, heavy: 28, "very-heavy": 25 },
  },
  {
    label: "25% work / 75% rest",
    workMinutes: 15,
    restMinutes: 45,
    limits: { light: 36, moderate: 32, heavy: 30, "very-heavy": 27 },
  },
];

// ─── Risk Thresholds ─────────────────────────────────────────────

export const RISK_THRESHOLDS: RiskThreshold[] = [
  {
    level: "green",
    label: "Low Risk",
    colour: "#16a34a",
    bgColour: "rgba(22,163,74,0.08)",
    borderColour: "rgba(22,163,74,0.3)",
    description: "WBGT within continuous work limits. Standard precautions apply.",
  },
  {
    level: "amber",
    label: "Moderate Risk",
    colour: "#d97706",
    bgColour: "rgba(217,119,6,0.08)",
    borderColour: "rgba(217,119,6,0.3)",
    description: "WBGT exceeds continuous work limits. Work/rest cycles required.",
  },
  {
    level: "red",
    label: "High Risk",
    colour: "#dc2626",
    bgColour: "rgba(220,38,38,0.08)",
    borderColour: "rgba(220,38,38,0.3)",
    description: "WBGT exceeds all standard work/rest limits. Stop work or implement emergency controls.",
  },
];

// ─── Sun Exposure Options ────────────────────────────────────────

export const SUN_EXPOSURE_OPTIONS: { value: SunExposure; label: string; solarLoadC: number }[] = [
  { value: "full-sun", label: "Full Sun (no shade)", solarLoadC: 7 },
  { value: "partial-shade", label: "Partial Shade", solarLoadC: 4 },
  { value: "full-shade", label: "Full Shade", solarLoadC: 1 },
  { value: "indoor", label: "Indoor (no solar load)", solarLoadC: 0 },
];

// ─── Controls Database ───────────────────────────────────────────

export const HEAT_CONTROLS: HeatControl[] = [
  // Green — standard precautions
  { id: "c01", title: "Drinking water readily available", description: "Ensure clean drinking water is available within easy reach of all work areas. Workers should drink at least 250 ml every 15–20 minutes.", category: "welfare", minRiskLevel: "green" },
  { id: "c02", title: "Encourage regular hydration", description: "Brief workers on the importance of drinking water regularly, even if not thirsty. Avoid caffeinated and sugary drinks.", category: "administrative", minRiskLevel: "green" },
  { id: "c03", title: "Monitor workers for heat symptoms", description: "Supervisors should be trained to recognise early signs of heat illness: heavy sweating, weakness, dizziness, nausea, headache.", category: "administrative", minRiskLevel: "green" },

  // Amber — additional controls
  { id: "c04", title: "Implement work/rest cycles", description: "Rotate workers between heavy tasks and lighter duties or rest. Follow the ISO 7243 work/rest ratio for the assessed WBGT and activity level.", category: "administrative", minRiskLevel: "amber" },
  { id: "c05", title: "Provide shade structures", description: "Erect temporary shade canopies, gazebos, or use scaffold sheeting to create shaded rest areas near work zones.", category: "engineering", minRiskLevel: "amber" },
  { id: "c06", title: "Schedule heavy work for cooler periods", description: "Reschedule physically demanding tasks (steel fixing, concreting, digging) to early morning or late afternoon when temperatures are lower.", category: "administrative", minRiskLevel: "amber" },
  { id: "c07", title: "Set up hydration stations", description: "Place marked hydration stations with cool water, electrolyte sachets, and cups at key locations around the site.", category: "welfare", minRiskLevel: "amber" },
  { id: "c08", title: "Review PPE requirements", description: "Assess whether full PPE can be temporarily adjusted. Consider lighter hi-vis, vented hard hats, or breathable alternatives where risk assessment allows.", category: "ppe", minRiskLevel: "amber" },
  { id: "c09", title: "Provide cool rest areas", description: "Designate air-conditioned or well-ventilated welfare units as cool-down areas. Ensure enough seating for rotating crews.", category: "welfare", minRiskLevel: "amber" },
  { id: "c10", title: "Buddy system for lone workers", description: "Ensure no one works alone in heat. Implement a buddy system so colleagues can monitor each other for heat illness signs.", category: "administrative", minRiskLevel: "amber" },
  { id: "c11", title: "Increase workforce / reduce individual exposure", description: "Bring in additional labour to share the workload and reduce individual heat exposure duration.", category: "administrative", minRiskLevel: "amber" },
  { id: "c12", title: "Use mechanical aids", description: "Where possible, substitute manual tasks with mechanical handling (telehandlers, excavators, conveyors) to reduce metabolic heat generation.", category: "engineering", minRiskLevel: "amber" },
  { id: "c13", title: "Provide cooling PPE", description: "Issue cooling vests, neck wraps, or wetting towels to workers engaged in heavy physical tasks.", category: "ppe", minRiskLevel: "amber" },

  // Red — emergency controls
  { id: "c14", title: "Consider stopping work", description: "If WBGT exceeds all work/rest limits, consider suspending outdoor work until conditions improve. Document the decision.", category: "administrative", minRiskLevel: "red" },
  { id: "c15", title: "Emergency first aid readiness", description: "Ensure trained first aiders are on site, ice packs and cooling equipment are available, and the emergency procedure for heat stroke is briefed.", category: "welfare", minRiskLevel: "red" },
  { id: "c16", title: "Mandatory rest periods", description: "Enforce mandatory 45-minute rest in cool shade for every 15 minutes of work. No exceptions regardless of programme pressure.", category: "administrative", minRiskLevel: "red" },
  { id: "c17", title: "Modified shift pattern", description: "Switch to early start (05:00–11:00) and evening shift (16:00–20:00) pattern, avoiding peak heat hours entirely.", category: "administrative", minRiskLevel: "red" },
  { id: "c18", title: "Continuous health monitoring", description: "Supervisors to conduct face-to-face welfare checks with every worker at least every 30 minutes. Record checks.", category: "administrative", minRiskLevel: "red" },
  { id: "c19", title: "Misting / evaporative cooling", description: "Deploy misting fans or evaporative coolers in rest areas and, where practical, near active work zones.", category: "engineering", minRiskLevel: "red" },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function createEmptyDirectInputs(): DirectInputs {
  return { dryBulbC: null, wetBulbC: null, globeTempC: null };
}

export function createEmptyEstimatedInputs(): EstimatedInputs {
  return { airTempC: null, relativeHumidity: null, windSpeedKmh: null, sunExposure: "full-sun" };
}

export function createEmptyDayEntry(label: string): DayEntry {
  return {
    label,
    mode: "estimated",
    direct: createEmptyDirectInputs(),
    estimated: createEmptyEstimatedInputs(),
    activityLevel: "moderate",
  };
}

export const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
