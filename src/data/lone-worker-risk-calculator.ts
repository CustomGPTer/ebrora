// src/data/lone-worker-risk-calculator.ts
// Lone Worker Risk Score Calculator — INDG73 + BS 8484, multiplicative scoring

// ─── Types ──────────────────────────────────────────────────────
export type RiskBand = "low" | "medium" | "high" | "unacceptable";

export interface FactorOption {
  value: number;
  label: string;
  score: number;
}

export interface RiskFactor {
  id: string;
  label: string;
  weight: number; // multiplier weight
  description: string;
  options: FactorOption[];
}

export interface FactorScore {
  factorId: string;
  selectedValue: number;
  score: number;
  normalised: number; // 0-1 for radar chart
}

export interface LoneWorkerResult {
  factorScores: FactorScore[];
  compositeScore: number;
  riskBand: RiskBand;
  recommendations: string[];
  checklistItems: string[];
  maxFactorId: string;
  maxFactorLabel: string;
}

// ─── Risk Band Definitions ───────────────────────────────────
export const RISK_BAND_DEFS: { band: RiskBand; label: string; description: string; minScore: number; maxScore: number; bgClass: string; textClass: string; borderClass: string; dotClass: string; colour: string; gaugeRGB: number[] }[] = [
  { band: "low", label: "Low", description: "Lone working acceptable with standard precautions. Ensure operative has a charged mobile phone and someone knows their location and expected return time.", minScore: 0, maxScore: 100, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", colour: "#22C55E", gaugeRGB: [22, 163, 74] },
  { band: "medium", label: "Medium", description: "Lone working acceptable with enhanced precautions. Regular check-ins required at defined intervals. Supervisor to be informed of lone working activity.", minScore: 101, maxScore: 300, bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500", colour: "#EAB308", gaugeRGB: [234, 179, 8] },
  { band: "high", label: "High", description: "Lone working acceptable ONLY with specific controls in place. GPS tracking, automatic welfare alerts, reduced check-in intervals, site-specific emergency procedure, and informed site manager required.", minScore: 301, maxScore: 700, bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", colour: "#EF4444", gaugeRGB: [239, 68, 68] },
  { band: "unacceptable", label: "Unacceptable", description: "Lone working MUST NOT proceed. Implement a buddy system, additional operative, or alternative working arrangements. The combination of risk factors makes lone working unacceptably dangerous.", minScore: 701, maxScore: 99999, bgClass: "bg-gray-900 bg-opacity-90", textClass: "text-white", borderClass: "border-gray-700", dotClass: "bg-gray-900", colour: "#1F2937", gaugeRGB: [31, 41, 55] },
];

export function getRiskBandDef(band: RiskBand) {
  return RISK_BAND_DEFS.find(b => b.band === band)!;
}

export function scoreToRiskBand(score: number): RiskBand {
  if (score <= 100) return "low";
  if (score <= 300) return "medium";
  if (score <= 700) return "high";
  return "unacceptable";
}

// ─── Risk Factors (8 inputs per spec) ────────────────────────
// Weights reflect multiplicative importance per HSE INDG73 guidance
export const RISK_FACTORS: RiskFactor[] = [
  {
    id: "activity",
    label: "Activity Type",
    weight: 3.0,
    description: "Type of work being carried out. Higher-consequence activities score higher because self-rescue is more difficult.",
    options: [
      { value: 1, label: "General inspection / walkover", score: 1 },
      { value: 2, label: "Surveying / monitoring", score: 2 },
      { value: 3, label: "Plant operation (cab-based)", score: 3 },
      { value: 4, label: "Manual work (ground level)", score: 4 },
      { value: 5, label: "Night security / watchman", score: 5 },
      { value: 6, label: "Work at height", score: 7 },
      { value: 7, label: "Confined space entry", score: 9 },
    ],
  },
  {
    id: "remoteness",
    label: "Location Remoteness",
    weight: 2.5,
    description: "How remote or isolated the work location is. Affects time to receive assistance.",
    options: [
      { value: 1, label: "Urban site with others nearby", score: 1 },
      { value: 2, label: "Site compound (within shouting distance)", score: 2 },
      { value: 3, label: "Rural site with limited access", score: 4 },
      { value: 4, label: "Remote / isolated location", score: 7 },
    ],
  },
  {
    id: "communication",
    label: "Communication Availability",
    weight: 2.5,
    description: "Ability to call for help. Communication is critical for lone worker safety.",
    options: [
      { value: 1, label: "Full mobile signal + site radio", score: 1 },
      { value: 2, label: "Full mobile signal only", score: 2 },
      { value: 3, label: "Intermittent mobile signal", score: 4 },
      { value: 4, label: "No signal / radio only (line of sight)", score: 6 },
      { value: 5, label: "No communication available", score: 9 },
    ],
  },
  {
    id: "duration",
    label: "Duration of Lone Working",
    weight: 1.5,
    description: "Length of time the operative will be working alone. Longer durations increase cumulative risk.",
    options: [
      { value: 1, label: "Under 1 hour", score: 1 },
      { value: 2, label: "1-2 hours", score: 2 },
      { value: 3, label: "2-4 hours", score: 3 },
      { value: 4, label: "4-8 hours (half to full shift)", score: 5 },
      { value: 5, label: "Over 8 hours / overnight", score: 7 },
    ],
  },
  {
    id: "timeOfDay",
    label: "Time of Day",
    weight: 1.5,
    description: "Visibility and fatigue risk vary with time of day.",
    options: [
      { value: 1, label: "Daylight hours (full visibility)", score: 1 },
      { value: 2, label: "Twilight / dawn / dusk", score: 3 },
      { value: 3, label: "Night time", score: 5 },
    ],
  },
  {
    id: "nearestPerson",
    label: "Nearest Person Distance",
    weight: 1.5,
    description: "Distance to the nearest other person who could render assistance.",
    options: [
      { value: 1, label: "Less than 100m", score: 1 },
      { value: 2, label: "100m - 500m", score: 2 },
      { value: 3, label: "500m - 1km", score: 4 },
      { value: 4, label: "Over 1km", score: 6 },
    ],
  },
  {
    id: "healthConditions",
    label: "Pre-existing Health Conditions",
    weight: 1.0,
    description: "Any health conditions that could be exacerbated by lone working or affect self-rescue capability.",
    options: [
      { value: 0, label: "No relevant health conditions", score: 1 },
      { value: 1, label: "Yes - relevant conditions present", score: 4 },
    ],
  },
  {
    id: "firstAid",
    label: "First Aid Trained",
    weight: 1.0,
    description: "Whether the lone worker holds a current first aid certificate.",
    options: [
      { value: 1, label: "Yes - current EFAW or FAW certificate", score: 1 },
      { value: 0, label: "No first aid training", score: 2 },
    ],
  },
];

// ─── Scoring Engine (Multiplicative) ─────────────────────────
// Composite = product of (weight * score) for all factors, normalised
export function calculateScore(selections: Record<string, number>): LoneWorkerResult {
  const factorScores: FactorScore[] = [];
  let product = 1;
  let maxScore = 0;
  let maxFactorId = "";
  let maxFactorLabel = "";

  for (const factor of RISK_FACTORS) {
    const selectedValue = selections[factor.id] ?? factor.options[0].value;
    const option = factor.options.find(o => o.value === selectedValue) || factor.options[0];
    const weighted = factor.weight * option.score;
    product *= (1 + weighted / 25); // Multiplicative compound (calibrated to real-world scenarios)

    const maxOptionScore = Math.max(...factor.options.map(o => o.score));
    const normalised = option.score / maxOptionScore;

    factorScores.push({
      factorId: factor.id,
      selectedValue,
      score: option.score,
      normalised,
    });

    if (weighted > maxScore) {
      maxScore = weighted;
      maxFactorId = factor.id;
      maxFactorLabel = factor.label;
    }
  }

  // Scale product to 0-1000 range for meaningful bands
  const compositeScore = Math.round((product - 1) * 100);
  const riskBand = scoreToRiskBand(compositeScore);
  const recommendations = getRecommendations(riskBand, selections, compositeScore);
  const checklistItems = getChecklist(riskBand, selections);

  return {
    factorScores,
    compositeScore,
    riskBand,
    recommendations,
    checklistItems,
    maxFactorId,
    maxFactorLabel,
  };
}

// ─── What-If: recalculate with one factor changed ────────────
export function whatIfScore(
  currentSelections: Record<string, number>,
  factorId: string,
  newValue: number,
): { newScore: number; newBand: RiskBand; delta: number } {
  const modified = { ...currentSelections, [factorId]: newValue };
  const result = calculateScore(modified);
  const current = calculateScore(currentSelections);
  return {
    newScore: result.compositeScore,
    newBand: result.riskBand,
    delta: result.compositeScore - current.compositeScore,
  };
}

// ─── Recommendations (INDG73 + BS 8484) ─────────────────────
function getRecommendations(band: RiskBand, selections: Record<string, number>, score: number): string[] {
  const recs: string[] = [];

  // Universal
  recs.push("Inform a named person of: exact location, task being carried out, and expected return time (INDG73 para 12)");

  if (band === "low") {
    recs.push("Carry a fully charged mobile phone with emergency contacts saved");
    recs.push("Confirm check-in arrangements before commencing lone working");
  }

  if (band === "medium") {
    recs.push("Implement regular check-in calls -- every 2 hours minimum");
    recs.push("Carry a charged mobile phone and a portable power bank");
    recs.push("Supervisor to be briefed on the lone working activity before it starts");
    recs.push("Consider a BS 8484 compliant lone worker monitoring device for enhanced protection");
    if (selections.communication >= 3) {
      recs.push("Communication is limited -- carry a satellite communicator or PLB (Personal Locator Beacon) as backup");
    }
  }

  if (band === "high") {
    recs.push("15-minute welfare check-in intervals with a named supervisor");
    recs.push("GPS tracking device mandatory -- consider a BS 8484:2016 compliant lone worker device with automatic man-down detection");
    recs.push("Site-specific emergency procedure documented and briefed to the operative");
    recs.push("Site manager to be informed of exact location and task before starting");
    recs.push("Dynamic risk assessment to be completed by the operative on arrival");
    recs.push("Rescue plan in place with identified rescuers briefed and on standby");
    if (selections.activity >= 6) {
      recs.push("CRITICAL: Work at height or confined space entry while lone working is extremely high risk -- consider whether the task can be rescheduled with a second person");
    }
    if (selections.timeOfDay >= 2) {
      recs.push("Reduced visibility increases risk -- ensure adequate task lighting and hi-vis PPE");
    }
  }

  if (band === "unacceptable") {
    recs.push("LONE WORKING MUST NOT PROCEED with the current risk factors");
    recs.push("Assign a buddy / second operative or reschedule the work");
    recs.push("If the work is genuinely critical and cannot wait, escalate to site manager for authorisation and implement ALL high-risk controls plus continuous communication");
    recs.push("Document the decision and controls in a permit to work");
  }

  return recs;
}

function getChecklist(band: RiskBand, selections: Record<string, number>): string[] {
  const items: string[] = [
    "Operative briefed on lone working risks and controls",
    "Named contact informed of location, task, and expected return time",
    "Mobile phone charged and tested for signal at work location",
    "Emergency contact numbers saved in phone",
    "Operative medically fit for the task (no uncontrolled conditions)",
  ];

  if (band === "medium" || band === "high" || band === "unacceptable") {
    items.push("Check-in schedule agreed and documented");
    items.push("Supervisor contact details confirmed");
    items.push("First aid kit carried");
  }

  if (band === "high" || band === "unacceptable") {
    items.push("GPS / lone worker device issued, charged, and tested");
    items.push("Site-specific emergency procedure briefed");
    items.push("Rescue plan in place with identified rescuers");
    items.push("Dynamic risk assessment completed on arrival");
    items.push("Permit to work issued (if applicable)");
  }

  if (selections.activity >= 6) {
    items.push("Work at height rescue plan in place");
    items.push("Fall arrest / restraint equipment inspected");
  }
  if (selections.activity >= 7) {
    items.push("Confined space entry permit issued");
    items.push("Atmospheric monitoring equipment available");
    items.push("Rescue team on standby");
  }

  return items;
}

// ─── Check-in interval recommendation ────────────────────────
export function recommendedCheckInMinutes(band: RiskBand): number | null {
  if (band === "low") return null; // Standard -- no mandatory check-in
  if (band === "medium") return 120;
  if (band === "high") return 15;
  return 0; // Unacceptable -- should not proceed
}
