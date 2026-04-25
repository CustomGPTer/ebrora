// src/data/working-at-height-calculator.ts
// Working at Height Risk Score Calculator
// WAHR 2005, CDM 2015 Schedule 3, BS 8437, INDG401, HSE GEIS6, HSE INDG367, LA455

// ─── Task Types ─────────────────────────────────────────────────
export type TaskType =
  | "roof-work" | "ladder-work" | "scaffold-access" | "mewp-work"
  | "edge-work" | "steel-erection" | "tower-scaffold" | "podium-steps"
  | "ceiling-work" | "cladding" | "demolition-at-height" | "tree-work"
  | "confined-overhead" | "fragile-roof" | "inspection-access";

export interface TaskTypeDefinition {
  id: TaskType;
  label: string;
  short: string;
  baseScore: number;
  suggestedEquipment: string[];
  notes: string;
}

export const TASK_TYPES: TaskTypeDefinition[] = [
  { id: "roof-work", label: "Roof Work (flat or pitched)", short: "Roof Work", baseScore: 3, suggestedEquipment: ["scaffold", "edge-protection", "safety-net", "harness"], notes: "Consider fragile surface risk separately. Edge protection mandatory per WAHR 2005 Sched 2." },
  { id: "ladder-work", label: "Ladder Access / Short Duration", short: "Ladder", baseScore: 2, suggestedEquipment: ["ladder", "podium-steps", "tower-scaffold"], notes: "Ladders only for short-duration, light work per WAHR 2005 Sched 6. Max 30 min in one position." },
  { id: "scaffold-access", label: "Scaffold Working Platform", short: "Scaffold", baseScore: 2, suggestedEquipment: ["scaffold", "loading-bay"], notes: "Must comply with NASC SG4:22 and BS EN 12811-1. Scaffold to be erected by CISRS-carded operatives." },
  { id: "mewp-work", label: "MEWP / Cherry Picker", short: "MEWP", baseScore: 2, suggestedEquipment: ["mewp-scissor", "mewp-boom", "harness"], notes: "IPAF trained operators only. Pre-use check per PUWER 1998 Reg 6. Ground conditions assessment required." },
  { id: "edge-work", label: "Work at Unprotected Edge", short: "Edge Work", baseScore: 4, suggestedEquipment: ["edge-protection", "harness", "safety-net"], notes: "Highest priority for collective protection per WAHR 2005. Edge protection per BS EN 13374." },
  { id: "steel-erection", label: "Structural Steel Erection", short: "Steel Erection", baseScore: 4, suggestedEquipment: ["harness", "safety-net", "mewp-boom", "scaffold"], notes: "BCSA guidance. Fall arrest as secondary to collective protection. Consider erection sequence." },
  { id: "tower-scaffold", label: "Mobile Tower Scaffold", short: "Tower Scaffold", baseScore: 2, suggestedEquipment: ["tower-scaffold"], notes: "PASMA trained erectors only. Max height per manufacturer. Outriggers on all 4 legs." },
  { id: "podium-steps", label: "Podium Steps / Low-Level Access", short: "Podium Steps", baseScore: 1, suggestedEquipment: ["podium-steps"], notes: "Suitable for short-duration work below 2m. Guardrail and self-closing gate. Anti-surf castors." },
  { id: "ceiling-work", label: "Overhead / Ceiling Work", short: "Ceiling Work", baseScore: 3, suggestedEquipment: ["tower-scaffold", "podium-steps", "scaffold"], notes: "Prolonged overhead work increases musculoskeletal risk. Consider task rotation." },
  { id: "cladding", label: "Cladding / Curtain Wall Installation", short: "Cladding", baseScore: 3, suggestedEquipment: ["scaffold", "mewp-boom", "harness"], notes: "Material handling at height. Consider wind loading on panels. Mechanical handling aids." },
  { id: "demolition-at-height", label: "Demolition at Height", short: "Demolition", baseScore: 5, suggestedEquipment: ["scaffold", "harness", "safety-net", "exclusion-zone"], notes: "CDM 2015 Part 4 and BS 6187. Risk of structural instability. Exclusion zone mandatory." },
  { id: "tree-work", label: "Tree Work / Arboriculture", short: "Tree Work", baseScore: 3, suggestedEquipment: ["harness", "climbing-line"], notes: "BS 3998. Qualified arborists only. Specific PPE (chainsaw trousers, climbing harness)." },
  { id: "confined-overhead", label: "Work Above Confined Space / Water", short: "Above Confined/Water", baseScore: 4, suggestedEquipment: ["harness", "safety-net", "scaffold"], notes: "Additional drowning/asphyxiation risk. Combined WAH and confined space assessment required." },
  { id: "fragile-roof", label: "Work On/Near Fragile Surface", short: "Fragile Surface", baseScore: 5, suggestedEquipment: ["crawling-board", "safety-net", "harness", "staging"], notes: "HSE ACM/1 Fragile Roofs. Assume fragile unless proven otherwise. Warning notices mandatory." },
  { id: "inspection-access", label: "Inspection / Survey Access", short: "Inspection", baseScore: 2, suggestedEquipment: ["mewp-scissor", "tower-scaffold", "ladder"], notes: "Short duration but may involve unfamiliar structures. Assess structural integrity first." },
];

// ─── Height Bands (industry best practice) ──────────────────────
export interface HeightBand {
  min: number;
  max: number;
  score: number;
  label: string;
  description: string;
}

export const HEIGHT_BANDS: HeightBand[] = [
  { min: 0, max: 2, score: 1, label: "Below 2m", description: "Low-level work. Podium steps or step platforms typically sufficient. Still requires assessment per WAHR 2005." },
  { min: 2, max: 4, score: 2, label: "2m - 4m", description: "Standard working at height. Tower scaffolds, podium steps with guardrails, or short-reach MEWPs." },
  { min: 4, max: 6, score: 3, label: "4m - 6m", description: "Increased fall consequence. Scaffold or MEWP preferred. Fall arrest if collective protection impracticable." },
  { min: 6, max: 10, score: 4, label: "6m - 10m", description: "Significant fall risk. Scaffold with full edge protection or boom MEWP. Rescue plan essential." },
  { min: 10, max: 999, score: 5, label: "Above 10m", description: "High-consequence fall. Full collective protection. Independent rescue plan. Consider structural loading on access equipment." },
];

export function getHeightBand(height: number): HeightBand {
  return HEIGHT_BANDS.find(b => height >= b.min && height < b.max) || HEIGHT_BANDS[HEIGHT_BANDS.length - 1];
}

// ─── Duration Bands ─────────────────────────────────────────────
export interface DurationBand {
  id: string;
  label: string;
  score: number;
  description: string;
}

export const DURATION_BANDS: DurationBand[] = [
  { id: "under-15", label: "Under 15 minutes", score: 1, description: "Very short duration. Ladder may be acceptable per WAHR 2005 Sched 6 criteria." },
  { id: "15-30", label: "15 - 30 minutes", score: 1, description: "Short duration. Ladder acceptable only if low-risk and light work." },
  { id: "30-60", label: "30 minutes - 1 hour", score: 2, description: "Medium duration. Tower scaffold or podium steps preferred over ladder." },
  { id: "1-4h", label: "1 - 4 hours", score: 3, description: "Extended duration. Scaffold, MEWP, or other stable working platform required." },
  { id: "4-8h", label: "4 - 8 hours (full shift)", score: 4, description: "Full shift. Comfortable, stable working platform mandatory. Consider fatigue." },
  { id: "over-8h", label: "Over 8 hours / multi-day", score: 5, description: "Prolonged work at height. Fatigue management plan required. Scaffolding strongly preferred." },
];

// ─── Weather Exposure ───────────────────────────────────────────
export interface WeatherFactor {
  id: string;
  label: string;
  score: number;
  description: string;
}

export const WEATHER_FACTORS: WeatherFactor[] = [
  { id: "none", label: "No adverse weather (indoor / calm conditions)", score: 0, description: "No weather-related risk increase." },
  { id: "light-wind", label: "Light wind (up to 20 mph / Beaufort 4)", score: 1, description: "Minor effect. Monitor for changes. Secure loose materials." },
  { id: "moderate-wind", label: "Moderate wind (20-30 mph / Beaufort 5-6)", score: 2, description: "Significant effect on stability. Secure all materials. Consider postponing MEWP work." },
  { id: "strong-wind", label: "Strong wind (over 30 mph / Beaufort 7+)", score: 4, description: "HSE guidance: cease all work at height in strong winds. Wind speed monitoring required." },
  { id: "rain", label: "Rain / wet conditions", score: 2, description: "Slip risk on platforms, ladders, roofs. Anti-slip measures required. Visibility reduced." },
  { id: "ice-frost", label: "Ice / frost / snow", score: 3, description: "Severe slip risk. Gritting of platforms required. Consider postponing work." },
  { id: "rain-wind", label: "Rain with wind (combined)", score: 3, description: "Combined effect: reduced grip, visibility, and stability. Increased fall risk." },
  { id: "extreme", label: "Extreme conditions (storm, lightning, fog)", score: 5, description: "Cease all work at height immediately. Do not resume until conditions clear." },
];

// ─── Risk Scoring Factors ───────────────────────────────────────
export interface ScoringFactor {
  id: string;
  label: string;
  weight: number;
  options: { label: string; score: number; color: string }[];
}

export const SCORING_FACTORS: ScoringFactor[] = [
  {
    id: "height", label: "Working Height", weight: 1,
    options: [
      { label: "Below 2m", score: 1, color: "green" },
      { label: "2m - 4m", score: 2, color: "green" },
      { label: "4m - 6m", score: 3, color: "amber" },
      { label: "6m - 10m", score: 4, color: "red" },
      { label: "Above 10m", score: 5, color: "purple" },
    ],
  },
  {
    id: "duration", label: "Duration of Work at Height", weight: 1,
    options: [
      { label: "Under 15 min", score: 1, color: "green" },
      { label: "15 - 30 min", score: 1, color: "green" },
      { label: "30 min - 1 hr", score: 2, color: "green" },
      { label: "1 - 4 hours", score: 3, color: "amber" },
      { label: "4 - 8 hours", score: 4, color: "red" },
      { label: "Over 8 hours", score: 5, color: "purple" },
    ],
  },
  {
    id: "weather", label: "Weather Exposure", weight: 1,
    options: [
      { label: "No adverse weather", score: 0, color: "green" },
      { label: "Light wind (<20 mph)", score: 1, color: "green" },
      { label: "Moderate wind (20-30 mph)", score: 2, color: "amber" },
      { label: "Strong wind (>30 mph)", score: 4, color: "red" },
      { label: "Rain / wet", score: 2, color: "amber" },
      { label: "Ice / frost / snow", score: 3, color: "red" },
      { label: "Rain with wind", score: 3, color: "red" },
      { label: "Extreme (storm/lightning)", score: 5, color: "purple" },
    ],
  },
  {
    id: "competence", label: "Competence Level", weight: 1,
    options: [
      { label: "Fully trained & experienced", score: 0, color: "green" },
      { label: "Trained but limited experience", score: 1, color: "green" },
      { label: "Basic training only", score: 2, color: "amber" },
      { label: "No formal WAH training", score: 4, color: "red" },
    ],
  },
  {
    id: "rescuePlan", label: "Rescue Plan in Place", weight: 1,
    options: [
      { label: "Written rescue plan with drills", score: 0, color: "green" },
      { label: "Rescue plan documented", score: 1, color: "green" },
      { label: "Verbal plan only", score: 2, color: "amber" },
      { label: "No rescue plan", score: 4, color: "red" },
    ],
  },
  {
    id: "fragileSurface", label: "Fragile Surface Present", weight: 1,
    options: [
      { label: "No fragile surfaces", score: 0, color: "green" },
      { label: "Fragile surfaces nearby (>2m)", score: 2, color: "amber" },
      { label: "Working on/adjacent to fragile surface", score: 3, color: "red" },
    ],
  },
  {
    id: "publicBelow", label: "Public / Others Below", weight: 1,
    options: [
      { label: "Exclusion zone in place, no public", score: 0, color: "green" },
      { label: "Controlled work area", score: 1, color: "green" },
      { label: "Public or workers may pass below", score: 2, color: "amber" },
      { label: "Public directly below, no exclusion", score: 3, color: "red" },
    ],
  },
];

// ─── Risk Bands ─────────────────────────────────────────────────
export interface RiskBand {
  min: number;
  max: number;
  label: string;
  color: string;
  rgb: number[];
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  action: string;
}

export const RISK_BANDS: RiskBand[] = [
  { min: 0, max: 4, label: "LOW", color: "#16a34a", rgb: [22, 163, 74], bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", action: "Acceptable risk. Maintain existing controls and good practice. Monitor conditions for change." },
  { min: 5, max: 9, label: "LOW-MODERATE", color: "#65a30d", rgb: [101, 163, 13], bgClass: "bg-lime-50", textClass: "text-lime-800", borderClass: "border-lime-200", dotClass: "bg-lime-500", action: "Tolerable risk with existing controls. Review whether simple improvements could reduce score further. Ensure competence and rescue arrangements are in place." },
  { min: 10, max: 14, label: "MEDIUM", color: "#d97706", rgb: [217, 119, 6], bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500", action: "Action needed. Improve controls before proceeding. Consider upgrading access equipment, improving edge protection, or reducing exposure duration. Method statement required. Re-score after improvements." },
  { min: 15, max: 19, label: "HIGH", color: "#ea580c", rgb: [234, 88, 12], bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500", action: "Prompt action required. Significant fall risk. Redesign the task approach, provide collective fall prevention, or eliminate the need to work at height. Do not proceed without senior management review. Re-score after changes." },
  { min: 20, max: 999, label: "VERY HIGH", color: "#dc2626", rgb: [220, 38, 38], bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", action: "STOP. Unacceptable risk. Do not proceed until the score is reduced below 20. Eliminate the need to work at height entirely, or fundamentally redesign the method of access and protection. Written rescue plan mandatory. Senior management sign-off required." },
];

export function getRiskBand(score: number): RiskBand {
  return RISK_BANDS.find(b => score >= b.min && score <= b.max) || RISK_BANDS[RISK_BANDS.length - 1];
}

// ─── Control Hierarchy (WAHR 2005 Schedule 1) ───────────────────
export type ControlTier = "avoid" | "prevent" | "minimise";

export interface ControlMeasure {
  id: string;
  label: string;
  tier: ControlTier;
  tierLabel: string;
  tierOrder: number;
  description: string;
  reductionPoints: number;
  applicableTaskTypes: TaskType[] | "all";
  regulatoryRef: string;
}

export const CONTROL_HIERARCHY: ControlMeasure[] = [
  // Tier 1: Avoid (WAHR 2005 Reg 6(2))
  { id: "avoid-wah", label: "Eliminate work at height entirely", tier: "avoid", tierLabel: "1. Avoid Work at Height", tierOrder: 1, description: "Redesign the task to be done from ground level. Use extendable tools, prefabrication at ground level, or remote inspection (drones, cameras).", reductionPoints: 5, applicableTaskTypes: "all", regulatoryRef: "WAHR 2005 Reg 6(2)" },
  { id: "prefabricate", label: "Prefabricate at ground level", tier: "avoid", tierLabel: "1. Avoid Work at Height", tierOrder: 1, description: "Assemble components at ground level and lift into position mechanically, reducing time working at height.", reductionPoints: 3, applicableTaskTypes: ["steel-erection", "cladding", "roof-work", "ceiling-work"], regulatoryRef: "WAHR 2005 Reg 6(2)" },
  { id: "extend-tools", label: "Use extendable tools from ground", tier: "avoid", tierLabel: "1. Avoid Work at Height", tierOrder: 1, description: "Use telescopic tools, long-reach equipment, or drones for inspection rather than accessing height.", reductionPoints: 3, applicableTaskTypes: ["inspection-access", "ceiling-work", "tree-work"], regulatoryRef: "WAHR 2005 Reg 6(2)" },

  // Tier 2: Prevent falls (WAHR 2005 Reg 6(3) — collective protection first)
  { id: "scaffold-ep", label: "Scaffold with full edge protection", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "BS EN 12811-1 compliant scaffold with guardrails, toe boards, and brick guards. CISRS-carded erectors. Inspection per WAHR Sched 7.", reductionPoints: 4, applicableTaskTypes: ["roof-work", "edge-work", "cladding", "ceiling-work", "scaffold-access", "demolition-at-height"], regulatoryRef: "WAHR 2005 Reg 6(3), Sched 2" },
  { id: "edge-protection", label: "Permanent or temporary edge protection", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "BS EN 13374 compliant edge protection. Class A (static loads), B (low dynamic), or C (high dynamic) as required.", reductionPoints: 4, applicableTaskTypes: ["roof-work", "edge-work", "cladding", "demolition-at-height"], regulatoryRef: "WAHR 2005 Sched 2, BS EN 13374" },
  { id: "mewp-use", label: "Use MEWP with guardrails", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "Scissor lift or boom lift with platform guardrails. IPAF-trained operator. Ground conditions check. Harness as secondary for boom lifts.", reductionPoints: 3, applicableTaskTypes: ["mewp-work", "inspection-access", "cladding", "ceiling-work"], regulatoryRef: "WAHR 2005 Reg 6(3), PUWER 1998" },
  { id: "tower-scaffold-use", label: "PASMA tower scaffold", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "Mobile aluminium tower scaffold. PASMA-trained erector. Outriggers on all 4 legs. Max height per manufacturer instruction.", reductionPoints: 3, applicableTaskTypes: ["tower-scaffold", "ceiling-work", "inspection-access", "ladder-work"], regulatoryRef: "WAHR 2005 Sched 2" },
  { id: "safety-net", label: "Safety nets (BS EN 1263-1)", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "Installed below working area. Max 6m fall distance. Weekly inspection. Debris clearance schedule.", reductionPoints: 3, applicableTaskTypes: ["roof-work", "steel-erection", "fragile-roof", "demolition-at-height"], regulatoryRef: "WAHR 2005 Sched 4" },
  { id: "covers", label: "Fragile surface covers / crawling boards", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "Secured covers clearly marked 'FRAGILE SURFACE - DO NOT REMOVE'. Crawling boards per BS 8437.", reductionPoints: 3, applicableTaskTypes: ["fragile-roof", "roof-work"], regulatoryRef: "WAHR 2005 Sched 5, HSE ACM/1" },
  { id: "podium-use", label: "Podium steps (below 2m)", tier: "prevent", tierLabel: "2. Prevent Falls (Collective)", tierOrder: 2, description: "Self-supporting podium with guardrails, self-closing gate, and anti-surf castors. Suitable for low-level work.", reductionPoints: 2, applicableTaskTypes: ["podium-steps", "ladder-work", "ceiling-work"], regulatoryRef: "WAHR 2005 Reg 6(3)" },

  // Tier 2b: Prevent falls (personal protection — only if collective impracticable)
  { id: "harness-restraint", label: "Work restraint harness (prevents reaching edge)", tier: "prevent", tierLabel: "2. Prevent Falls (Personal)", tierOrder: 3, description: "Lanyard length prevents reaching fall edge. Preferred over fall arrest. Anchorage per BS EN 795.", reductionPoints: 2, applicableTaskTypes: ["roof-work", "edge-work", "mewp-work", "steel-erection", "cladding"], regulatoryRef: "WAHR 2005 Reg 6(4), BS EN 358" },
  { id: "harness-arrest", label: "Fall arrest harness with energy absorber", tier: "prevent", tierLabel: "2. Prevent Falls (Personal)", tierOrder: 3, description: "BS EN 361 harness with BS EN 355 energy absorber. Max 6m total fall distance. Anchorage must withstand 12 kN. Rescue plan mandatory.", reductionPoints: 2, applicableTaskTypes: ["steel-erection", "mewp-work", "roof-work", "tree-work", "confined-overhead"], regulatoryRef: "WAHR 2005 Reg 6(4), BS 8437, BS EN 361/355" },

  // Tier 3: Minimise distance and consequence of fall
  { id: "airbag", label: "Inflatable fall arrest (air bags)", tier: "minimise", tierLabel: "3. Minimise Fall Consequence", tierOrder: 4, description: "Inflatable landing systems for specific applications. Regular inflation checks. Clearance zone required.", reductionPoints: 2, applicableTaskTypes: ["roof-work", "fragile-roof", "steel-erection"], regulatoryRef: "WAHR 2005 Reg 6(5)" },
  { id: "exclusion-zone", label: "Exclusion zone below work area", tier: "minimise", tierLabel: "3. Minimise Fall Consequence", tierOrder: 4, description: "Barrier fencing or banksman-controlled zone preventing access below work at height. Signage per HSG15.", reductionPoints: 1, applicableTaskTypes: "all", regulatoryRef: "WAHR 2005 Reg 10" },
  { id: "rescue-plan", label: "Written rescue plan with equipment", tier: "minimise", tierLabel: "3. Minimise Fall Consequence", tierOrder: 4, description: "Documented plan covering: method, equipment, personnel, communication, emergency services contact. Drills conducted.", reductionPoints: 2, applicableTaskTypes: "all", regulatoryRef: "WAHR 2005 Reg 4(1)" },
  { id: "soft-landing", label: "Soft landing system / bund protection", tier: "minimise", tierLabel: "3. Minimise Fall Consequence", tierOrder: 4, description: "Reduce impact severity at lower levels. Protective bunding around hazards below.", reductionPoints: 1, applicableTaskTypes: ["confined-overhead", "edge-work", "roof-work"], regulatoryRef: "WAHR 2005 Reg 6(5)" },
];

// ─── Equipment Recommendations ──────────────────────────────────
export interface EquipmentRecommendation {
  id: string;
  name: string;
  category: string;
  maxHeight: string;
  suitability: string;
  advantages: string;
  limitations: string;
  crossRef: string;
  applicableTaskTypes: TaskType[];
}

export const EQUIPMENT_DATABASE: EquipmentRecommendation[] = [
  { id: "scaffold", name: "Tube & Fitting Scaffold", category: "Collective Protection", maxHeight: "Unlimited (design dependent)", suitability: "Long-duration, multi-level access", advantages: "Stable platform, can accommodate complex shapes, multi-user access", limitations: "Erection time, cost, requires CISRS operatives", crossRef: "Use Scaffold Load Calculator for loading check", applicableTaskTypes: ["roof-work", "edge-work", "cladding", "scaffold-access", "demolition-at-height", "ceiling-work", "confined-overhead"] },
  { id: "system-scaffold", name: "System Scaffold (e.g. HAKI, Layher)", category: "Collective Protection", maxHeight: "Unlimited (design dependent)", suitability: "Standard configurations, faster erection", advantages: "Faster build, fewer loose fittings, reduced dropped objects risk", limitations: "Less adaptable to complex shapes, module availability", crossRef: "Use Scaffold Load Calculator for loading check", applicableTaskTypes: ["roof-work", "edge-work", "cladding", "scaffold-access", "ceiling-work"] },
  { id: "mewp-scissor", name: "Scissor Lift MEWP", category: "Collective Protection", maxHeight: "Typically up to 18m", suitability: "Vertical access, flat ground, indoor work", advantages: "Large stable platform, multi-user, no harness required (guardrails)", limitations: "Vertical reach only, requires firm level ground, wind speed limits (typically 12.5 m/s)", crossRef: "See Access Equipment Selector for model comparison", applicableTaskTypes: ["mewp-work", "ceiling-work", "inspection-access", "cladding"] },
  { id: "mewp-boom", name: "Boom Lift MEWP (articulating or telescopic)", category: "Collective Protection", maxHeight: "Up to 40m+", suitability: "Overhead reach, working over obstacles", advantages: "Horizontal and vertical reach, access over obstacles", limitations: "Single operator, harness required, higher wind sensitivity, outrigger setup", crossRef: "See Access Equipment Selector for model comparison", applicableTaskTypes: ["mewp-work", "inspection-access", "cladding", "steel-erection", "tree-work"] },
  { id: "tower-scaffold", name: "Mobile Tower Scaffold (aluminium)", category: "Collective Protection", maxHeight: "Up to 12m (manufacturer dependent)", suitability: "Relocatable access, moderate duration", advantages: "Quick to erect, relocatable, platform with guardrails", limitations: "PASMA trained erectors, outriggers needed, max height limits", crossRef: "N/A", applicableTaskTypes: ["tower-scaffold", "ceiling-work", "inspection-access", "ladder-work"] },
  { id: "podium-steps", name: "Podium Steps", category: "Collective Protection", maxHeight: "Up to 2m platform height", suitability: "Low-level access, short duration tasks", advantages: "Very quick setup, guardrails, lightweight, indoor/outdoor", limitations: "Low height only, single user, must lock castors", crossRef: "N/A", applicableTaskTypes: ["podium-steps", "ladder-work", "ceiling-work"] },
  { id: "edge-protection", name: "Temporary Edge Protection (BS EN 13374)", category: "Collective Protection", maxHeight: "N/A (perimeter protection)", suitability: "Open edges, flat roofs, floor slab edges", advantages: "Passive protection, no user input required, protects all workers", limitations: "Design for load class (A/B/C), fixing requirements, weight", crossRef: "N/A", applicableTaskTypes: ["roof-work", "edge-work", "cladding", "demolition-at-height"] },
  { id: "safety-net", name: "Safety Nets (BS EN 1263-1)", category: "Collective Protection", maxHeight: "Max 6m below working level", suitability: "Structural steel, roof construction", advantages: "Passive protection, catches multiple users, reduces psychological fear", limitations: "Max 6m fall distance, needs fixing points, weekly inspection, debris clearance", crossRef: "N/A", applicableTaskTypes: ["roof-work", "steel-erection", "fragile-roof", "demolition-at-height"] },
  { id: "harness", name: "Full Body Harness (BS EN 361)", category: "Personal Protection", maxHeight: "N/A (secondary to collective)", suitability: "When collective protection impracticable", advantages: "Worker mobility, works in restricted areas", limitations: "Training required, suspension trauma risk, rescue plan mandatory, max 6m total arrest distance", crossRef: "N/A", applicableTaskTypes: ["steel-erection", "mewp-work", "roof-work", "tree-work", "confined-overhead", "edge-work", "cladding"] },
  { id: "crawling-board", name: "Crawling Boards / Staging", category: "Specialist Protection", maxHeight: "N/A (roof surface)", suitability: "Fragile roof surfaces", advantages: "Distributes load, prevents falling through", limitations: "Must span supports, secured against movement, marked", crossRef: "N/A", applicableTaskTypes: ["fragile-roof", "roof-work"] },
  { id: "ladder", name: "Leaning Ladder / Stepladder", category: "Access Only", maxHeight: "Stepladder: 3m, Leaning: project dependent", suitability: "Short duration (<30 min), light work, access only", advantages: "Quick, portable, low cost", limitations: "WAHR Sched 6 conditions must be met, 3-point contact, no heavy tools, unstable for work", crossRef: "See Access Equipment Selector", applicableTaskTypes: ["ladder-work", "inspection-access"] },
  { id: "climbing-line", name: "Climbing Line & Harness (arborist)", category: "Specialist Protection", maxHeight: "Tree height dependent", suitability: "Tree work only", advantages: "Access and positioning in tree canopy", limitations: "Specialist training, arborist PPE, work positioning only", crossRef: "N/A", applicableTaskTypes: ["tree-work"] },
];

// ─── Method Statement Checklist ─────────────────────────────────
export const METHOD_STATEMENT_CHECKLIST = [
  "Description of work and location",
  "Access equipment type and specification",
  "Edge protection arrangements",
  "Sequence of work activities",
  "Roles and responsibilities (competent person, supervisor)",
  "Training and competence requirements",
  "Tool tethering and material storage at height",
  "Weather monitoring and stop-work criteria",
  "Communication arrangements",
  "First aid arrangements",
  "Emergency procedures and rescue plan reference",
  "Permit to work requirements (if applicable)",
  "Pre-use inspection and check schedule",
  "Exclusion zone below work area",
  "Supervision arrangements",
];

// ─── Rescue Plan Checklist ──────────────────────────────────────
export const RESCUE_PLAN_CHECKLIST = [
  "Identity of rescue team members and alternates",
  "Rescue equipment available on site (location specified)",
  "Rescue method for each access type in use (scaffold, MEWP, harness, etc.)",
  "Maximum target rescue time (typically 5-15 minutes)",
  "Suspension trauma awareness and first aid",
  "Communication method between casualty and rescuer",
  "Emergency services contact numbers and access route",
  "Nearest hospital (A&E) with route",
  "Practice drills conducted and recorded (date and personnel)",
  "Equipment inspection schedule",
];

// ─── Regulatory References ──────────────────────────────────────
export interface RegulatoryReference {
  code: string;
  title: string;
  relevance: string;
}

export const REGULATORY_REFERENCES: RegulatoryReference[] = [
  { code: "WAHR 2005", title: "Work at Height Regulations 2005 (as amended)", relevance: "Primary legislation. Hierarchy: avoid > prevent (collective) > prevent (personal) > minimise." },
  { code: "CDM 2015", title: "Construction (Design and Management) Regulations 2015", relevance: "Schedule 3 Part 4: specific requirements for work at height in construction." },
  { code: "BS 8437", title: "BS 8437:2005+A1:2012 Code of practice for selection, use and maintenance of PPE for WAH", relevance: "Harness selection, inspection, and rescue planning." },
  { code: "BS EN 361", title: "BS EN 361: Full body harnesses", relevance: "Specification for harnesses used as part of a fall arrest system." },
  { code: "BS EN 355", title: "BS EN 355: Energy absorbers", relevance: "Energy absorbers to limit arrest force to 6 kN max." },
  { code: "BS EN 795", title: "BS EN 795: Personal fall protection equipment -- Anchor devices", relevance: "Anchor device types, strength requirements (min 12 kN or 10 kN with energy absorber)." },
  { code: "BS EN 13374", title: "BS EN 13374: Temporary edge protection systems", relevance: "Classes A, B, C for static, low dynamic, and high dynamic loads." },
  { code: "BS EN 12811-1", title: "BS EN 12811-1: Scaffolding -- Performance requirements", relevance: "Scaffold loading classes, platform dimensions, guardrail heights." },
  { code: "BS EN 1263-1", title: "BS EN 1263-1: Safety nets", relevance: "Net mesh, energy absorption, border rope, test loads." },
  { code: "INDG401", title: "HSE INDG401: The Work at Height Regulations -- A brief guide", relevance: "Simplified guidance on WAHR 2005 duties." },
  { code: "GEIS6", title: "HSE GEIS6: The selection of suitable access equipment", relevance: "Decision matrix for equipment selection." },
  { code: "INDG367", title: "HSE INDG367: Safe use of ladders and stepladders", relevance: "Conditions for acceptable ladder use." },
  { code: "INDG455", title: "HSE INDG455: Health and safety in roof work", relevance: "Specific guidance for roof work, fragile surfaces, edge protection." },
  { code: "HSE ACM/1", title: "HSE ACM/1: Working on fragile roofs", relevance: "Assume fragile unless confirmed otherwise. Protection measures." },
  { code: "SG4:22", title: "NASC SG4:22 -- Preventing Falls in Scaffolding Operations", relevance: "Advance guardrail and scaffold erection sequence safety." },
];

// ─── Scoring Calculation ────────────────────────────────────────
export interface ScoreResult {
  factorScores: { id: string; label: string; score: number; maxScore: number; color: string; selectedLabel: string }[];
  totalScore: number;
  maxPossibleScore: number;
  riskBand: RiskBand;
  taskType: TaskTypeDefinition;
  heightBand: HeightBand;
  methodStatementRequired: boolean;
  rescuePlanRequired: boolean;
  recommendations: string[];
  applicableEquipment: EquipmentRecommendation[];
  applicableControls: ControlMeasure[];
}

export function calculateRiskScore(
  taskTypeId: TaskType,
  selections: Record<string, number>,
): ScoreResult {
  const taskType = TASK_TYPES.find(t => t.id === taskTypeId) || TASK_TYPES[0];

  const factorScores = SCORING_FACTORS.map(f => {
    const selectedIndex = selections[f.id] ?? 0;
    const option = f.options[selectedIndex] || f.options[0];
    const maxScore = Math.max(...f.options.map(o => o.score));
    return { id: f.id, label: f.label, score: option.score * f.weight, maxScore: maxScore * f.weight, color: option.color, selectedLabel: option.label };
  });

  const heightOption = SCORING_FACTORS.find(f => f.id === "height")?.options[selections.height ?? 0];
  const heightScore = heightOption?.score ?? 1;
  const heightBand = HEIGHT_BANDS.find(b => b.score === heightScore) || HEIGHT_BANDS[0];

  const fragileSurfaceOption = SCORING_FACTORS.find(f => f.id === "fragileSurface")?.options[selections.fragileSurface ?? 0];
  const fragileSurfaceScore = fragileSurfaceOption?.score ?? 0;

  const weatherOption = SCORING_FACTORS.find(f => f.id === "weather")?.options[selections.weather ?? 0];
  const weatherScore = weatherOption?.score ?? 0;

  const competenceOption = SCORING_FACTORS.find(f => f.id === "competence")?.options[selections.competence ?? 0];
  const competenceScore = competenceOption?.score ?? 0;

  const rescuePlanOption = SCORING_FACTORS.find(f => f.id === "rescuePlan")?.options[selections.rescuePlan ?? 0];
  const rescuePlanScore = rescuePlanOption?.score ?? 0;

  const publicBelowOption = SCORING_FACTORS.find(f => f.id === "publicBelow")?.options[selections.publicBelow ?? 0];
  const publicBelowScore = publicBelowOption?.score ?? 0;

  const totalScore = factorScores.reduce((sum, f) => sum + f.score, 0);
  const maxPossibleScore = factorScores.reduce((sum, f) => sum + f.maxScore, 0);
  const riskBand = getRiskBand(totalScore);

  // Method statement required if score >= 10 or height >= 4m or fragile surface
  const methodStatementRequired = totalScore >= 10 || heightScore >= 3 || fragileSurfaceScore > 0;
  // Rescue plan always required if using personal PPE or height >= 4m or score >= 10
  const rescuePlanRequired = totalScore >= 10 || heightScore >= 3;

  // Filter applicable equipment
  const applicableEquipment = EQUIPMENT_DATABASE.filter(eq =>
    eq.applicableTaskTypes.includes(taskTypeId)
  );

  // Filter applicable controls
  const applicableControls = CONTROL_HIERARCHY.filter(c =>
    c.applicableTaskTypes === "all" || c.applicableTaskTypes.includes(taskTypeId)
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (heightScore >= 4) recommendations.push("Height exceeds 6m -- prioritise collective protection (scaffold, MEWP, edge protection).");
  if (weatherScore >= 3) recommendations.push("Adverse weather conditions -- implement wind speed monitoring and establish stop-work criteria.");
  if (competenceScore >= 2) recommendations.push("Competence gap identified -- provide WAHR 2005 awareness training and task-specific instruction before work commences.");
  if (rescuePlanScore >= 2) recommendations.push("Rescue plan inadequate -- prepare a written rescue plan with equipment, personnel, and practice drills.");
  if (fragileSurfaceScore > 0) recommendations.push("Fragile surface risk -- assume fragile unless confirmed otherwise (HSE ACM/1). Provide crawling boards, safety nets, and warning notices.");
  if (publicBelowScore >= 2) recommendations.push("Risk to others below -- establish exclusion zone with physical barriers and signage.");
  if (totalScore >= 15) recommendations.push("Score exceeds 15 -- senior management review required before work commences.");
  if (totalScore >= 20) recommendations.push("Score exceeds 20 -- STOP. Eliminate work at height or fundamentally redesign the method.");
  if (methodStatementRequired) recommendations.push("Method statement / safe system of work required for this task.");
  if (rescuePlanRequired) recommendations.push("Written rescue plan required before work commences.");
  if (taskType.baseScore >= 4) recommendations.push(`Task type '${taskType.short}' is inherently high-risk. Ensure all controls are implemented before proceeding.`);

  return {
    factorScores,
    totalScore,
    maxPossibleScore,
    riskBand,
    taskType,
    heightBand,
    methodStatementRequired,
    rescuePlanRequired,
    recommendations,
    applicableEquipment,
    applicableControls,
  };
}

// ─── Residual Risk Calculation ──────────────────────────────────
export function calculateResidualScore(
  totalScore: number,
  selectedControlIds: string[],
): { residualScore: number; reductionPoints: number; residualBand: RiskBand } {
  const reductionPoints = selectedControlIds.reduce((sum, id) => {
    const control = CONTROL_HIERARCHY.find(c => c.id === id);
    return sum + (control?.reductionPoints ?? 0);
  }, 0);
  const residualScore = Math.max(0, totalScore - reductionPoints);
  return { residualScore, reductionPoints, residualBand: getRiskBand(residualScore) };
}

// ─── HSE Colour Mapping ────────────────────────────────────────
export const HSE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  green: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", label: "Low risk" },
  amber: { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "Moderate risk" },
  red: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca", label: "High risk" },
  purple: { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff", label: "Very high risk" },
};
