// src/data/cold-stress-wind-chill-calculator.ts
// Cold Stress Wind Chill Calculator — North American WCI, frostbite, hypothermia, clothing controls

// ─── Types ──────────────────────────────────────────────────────
export type WindUnit = "kmh" | "ms";
export type RiskCategory = "minimal" | "low" | "moderate" | "high" | "very-high" | "extreme";

export interface FrostbiteRisk {
  category: "none" | "30min" | "10min" | "5min" | "2min";
  label: string;
  timeMinutes: number | null;
  description: string;
}

export interface HypothermiaRisk {
  category: "negligible" | "low" | "moderate" | "high" | "very-high";
  label: string;
  description: string;
  maxContinuousMinutes: number | null;
  warmBreakIntervalMinutes: number | null;
}

export interface ClothingReq {
  item: string;
  required: boolean;
  description: string;
}

export interface WindChillResult {
  airTemp: number;
  windSpeedKmh: number;
  windChillTemp: number;
  frostbiteRisk: FrostbiteRisk;
  hypothermiaRisk: HypothermiaRisk;
  riskCategory: RiskCategory;
  recommendations: string[];
  clothingReqs: ClothingReq[];
  durationSafe: boolean;
  maxSafeDurationMinutes: number | null;
}

export interface MatrixCell {
  temp: number;
  wind: number;
  wci: number;
  risk: RiskCategory;
}

// ─── Risk Band Styling ───────────────────────────────────────
export const RISK_BANDS: { category: RiskCategory; label: string; colour: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; matrixFill: string }[] = [
  { category: "minimal", label: "Minimal", colour: "#22C55E", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", matrixFill: "#BBF7D0" },
  { category: "low", label: "Low", colour: "#3B82F6", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500", matrixFill: "#BFDBFE" },
  { category: "moderate", label: "Moderate", colour: "#EAB308", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500", matrixFill: "#FEF3C7" },
  { category: "high", label: "High", colour: "#F97316", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500", matrixFill: "#FED7AA" },
  { category: "very-high", label: "Very High", colour: "#EF4444", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", matrixFill: "#FECACA" },
  { category: "extreme", label: "Extreme", colour: "#7C3AED", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500", matrixFill: "#DDD6FE" },
];

export function getRiskBand(category: RiskCategory) {
  return RISK_BANDS.find(b => b.category === category)!;
}

// ─── Unit Conversion ─────────────────────────────────────────
export function msToKmh(ms: number): number { return ms * 3.6; }
export function kmhToMs(kmh: number): number { return kmh / 3.6; }

// ─── North American Wind Chill Index (Environment Canada / US NWS) ───
// WCI = 13.12 + 0.6215*T - 11.37*V^0.16 + 0.3965*T*V^0.16
// T in degC, V in km/h. Valid for V >= 4.8 km/h and T <= 10 degC.
export function windChillIndex(tempC: number, windKmh: number): number {
  if (windKmh < 4.8) return tempC; // Below threshold, wind chill = air temp
  if (tempC > 10) return tempC; // Formula not valid above 10C
  const vp = Math.pow(windKmh, 0.16);
  const wci = 13.12 + 0.6215 * tempC - 11.37 * vp + 0.3965 * tempC * vp;
  return Math.round(wci * 10) / 10;
}

// ─── Risk Category from Wind Chill Temperature ──────────────
export function getRiskCategory(wci: number): RiskCategory {
  if (wci > 0) return "minimal";
  if (wci > -10) return "low";
  if (wci > -27) return "moderate";
  if (wci > -35) return "high";
  if (wci > -48) return "very-high";
  return "extreme";
}

// ─── Frostbite Risk Assessment ───────────────────────────────
// Based on Environment Canada / US NWS frostbite charts.
// Published band boundaries (WCI in °C, exposed skin):
//     > −27       No significant risk
//   −27 to −39    Frostbite possible in ~30 minutes
//   −40 to −47    Frostbite in ~10 minutes
//   −48 to −54    Frostbite in 5–10 minutes (severe)
//    ≤ −55        Frostbite in under 2 minutes (extreme)
export function assessFrostbiteRisk(wci: number): FrostbiteRisk {
  if (wci > -27) {
    return { category: "none", label: "Low risk", timeMinutes: null, description: "Frostbite unlikely at this wind chill for normal exposure durations" };
  }
  if (wci > -40) {
    return { category: "30min", label: "30 minutes", timeMinutes: 30, description: "Exposed skin can develop frostbite in approximately 30 minutes" };
  }
  if (wci > -47) {
    return { category: "10min", label: "10 minutes", timeMinutes: 10, description: "Exposed skin can develop frostbite in approximately 10 minutes" };
  }
  if (wci > -55) {
    return { category: "5min", label: "5 minutes", timeMinutes: 5, description: "Exposed skin can develop frostbite in approximately 5 minutes -- DANGER" };
  }
  return { category: "2min", label: "Under 2 minutes", timeMinutes: 2, description: "Exposed skin can develop frostbite in under 2 minutes -- EXTREME DANGER" };
}

// ─── Hypothermia Risk Assessment ─────────────────────────────
// Based on HSE cold stress guidance, Canadian Centre for Occupational Health
export function assessHypothermiaRisk(wci: number, durationMinutes: number): HypothermiaRisk {
  if (wci > 0) {
    return { category: "negligible", label: "Negligible", description: "Hypothermia risk negligible at this wind chill with appropriate clothing", maxContinuousMinutes: null, warmBreakIntervalMinutes: null };
  }
  if (wci > -10) {
    return { category: "low", label: "Low", description: "Low hypothermia risk -- ensure adequate clothing and monitor for early symptoms (shivering, confusion)", maxContinuousMinutes: 240, warmBreakIntervalMinutes: 120 };
  }
  if (wci > -27) {
    const safe = durationMinutes <= 120;
    return { category: "moderate", label: "Moderate", description: "Moderate hypothermia risk -- regular warm-up breaks required. Core body temperature may drop with prolonged exposure in inadequate clothing.", maxContinuousMinutes: 120, warmBreakIntervalMinutes: 60 };
  }
  if (wci > -40) {
    return { category: "high", label: "High", description: "High hypothermia risk -- short work periods with mandatory warm-up breaks. Buddy system required. Monitor for shivering cessation (indicates severe hypothermia).", maxContinuousMinutes: 40, warmBreakIntervalMinutes: 20 };
  }
  return { category: "very-high", label: "Very High", description: "Very high hypothermia risk -- outdoor work should be suspended if possible. If work must continue, maximum 15 minute exposure periods with heated shelter breaks.", maxContinuousMinutes: 15, warmBreakIntervalMinutes: 10 };
}

// ─── Clothing Requirements ───────────────────────────────────
// Based on Canadian CSA Z1004-12 and HSE cold work guidance
export function getClothingRequirements(wci: number): ClothingReq[] {
  const reqs: ClothingReq[] = [
    { item: "Base layer (moisture-wicking)", required: wci <= 5, description: "Polyester or merino wool base layer to wick moisture away from skin" },
    { item: "Insulating mid-layer (fleece/wool)", required: wci <= 0, description: "Fleece jacket or wool jumper for thermal insulation" },
    { item: "Windproof outer layer", required: wci <= -5, description: "Windproof and water-resistant jacket to block wind penetration" },
    { item: "Insulated hi-vis jacket", required: wci <= -15, description: "Insulated hi-vis outer jacket rated for the temperature range" },
    { item: "Thermal hat / balaclava under hard hat", required: wci <= -5, description: "Thermal skull cap or balaclava worn under hard hat -- 40% of heat loss is from the head" },
    { item: "Insulated safety gloves", required: wci <= 0, description: "Insulated gloves maintaining dexterity for the task. Consider liner gloves plus outer shell." },
    { item: "Thermal inner gloves", required: wci <= -15, description: "Thermal liner gloves worn under insulated outer gloves for extreme cold" },
    { item: "Insulated safety boots", required: wci <= -5, description: "Insulated safety boots with thermal rating. Add insoles for ground contact insulation." },
    { item: "Thermal socks (wool/synthetic)", required: wci <= 0, description: "Wool or synthetic thermal socks -- avoid cotton which retains moisture" },
    { item: "Neck gaiter / snood", required: wci <= -10, description: "Neck gaiter or snood to protect neck and lower face from wind" },
    { item: "Thermal trousers / salopettes", required: wci <= -15, description: "Insulated over-trousers or thermal salopettes for lower body protection" },
    { item: "Chemical hand warmers", required: wci <= -20, description: "Disposable chemical hand warmers in gloves and boots for additional warmth" },
    { item: "Face protection / goggles", required: wci <= -30, description: "Full face protection and insulated goggles -- all exposed skin at frostbite risk" },
  ];
  return reqs;
}

// ─── Control Recommendations ─────────────────────────────────
export function getRecommendations(wci: number, durationMinutes: number, hypothermia: HypothermiaRisk): string[] {
  const recs: string[] = [];

  if (wci > 0) {
    recs.push("Wind chill is above freezing -- standard site PPE is sufficient");
    recs.push("Monitor conditions if temperature is expected to drop");
    return recs;
  }

  if (wci > -10) {
    recs.push("Dress in layers with a windproof outer shell");
    recs.push("Provide access to a heated rest area for break periods");
    recs.push("Ensure hot drinks are available");
    recs.push("Monitor operatives for early signs of cold stress (persistent shivering, numbness in extremities)");
  }

  if (wci <= -10 && wci > -27) {
    recs.push("Implement a work/warm-up schedule -- maximum 60 minutes continuous outdoor work");
    recs.push("Provide a heated shelter within reasonable walking distance of the work area");
    recs.push("Ensure all operatives have full cold weather PPE including insulated gloves and thermal hat");
    recs.push("Buddy system -- operatives must work in pairs and monitor each other for symptoms");
    recs.push("Reduce workload intensity to prevent sweating which accelerates heat loss when stopping");
    recs.push("Hot drinks and warm food available at each break");
  }

  if (wci <= -27 && wci > -40) {
    recs.push("HIGH RISK -- consider postponing non-essential outdoor work");
    recs.push("Maximum 20-minute warm-up breaks after every 40 minutes of exposure");
    recs.push("Mandatory buddy system with active monitoring every 10 minutes");
    recs.push("Full cold weather PPE kit required -- see clothing list below");
    recs.push("Pre-warm PPE in heated shelter before starting work");
    recs.push("No metal tool contact with bare skin -- risk of instant frostbite on metal surfaces");
    recs.push("Emergency thermal blankets and warm shelter immediately accessible");
    recs.push("Brief toolbox talk on cold stress symptoms before shift");
  }

  if (wci <= -40) {
    recs.push("EXTREME DANGER -- suspend all non-emergency outdoor work");
    recs.push("If emergency work is unavoidable: maximum 15 minutes exposure, 10 minutes heated shelter");
    recs.push("Full extreme cold PPE including face protection and insulated goggles");
    recs.push("Constant radio contact with supervisor in heated shelter");
    recs.push("Emergency rescue plan and warm transport vehicle on standby");
    recs.push("No lone working under any circumstances");
  }

  // Duration check
  if (hypothermia.maxContinuousMinutes !== null && durationMinutes > hypothermia.maxContinuousMinutes) {
    recs.push(`WARNING: Planned exposure of ${durationMinutes} minutes exceeds maximum safe continuous duration of ${hypothermia.maxContinuousMinutes} minutes at this wind chill`);
  }

  return recs;
}

// ─── Full Assessment ─────────────────────────────────────────
export function calculateWindChill(
  airTemp: number,
  windSpeed: number,
  windUnit: WindUnit,
  durationMinutes: number,
): WindChillResult {
  const windKmh = windUnit === "ms" ? msToKmh(windSpeed) : windSpeed;
  const wci = windChillIndex(airTemp, windKmh);
  const riskCategory = getRiskCategory(wci);
  const frostbiteRisk = assessFrostbiteRisk(wci);
  const hypothermiaRisk = assessHypothermiaRisk(wci, durationMinutes);
  const clothingReqs = getClothingRequirements(wci);
  const recommendations = getRecommendations(wci, durationMinutes, hypothermiaRisk);

  const maxSafe = hypothermiaRisk.maxContinuousMinutes;
  const durationSafe = maxSafe === null || durationMinutes <= maxSafe;

  return {
    airTemp, windSpeedKmh: windKmh, windChillTemp: wci,
    frostbiteRisk, hypothermiaRisk, riskCategory,
    recommendations, clothingReqs,
    durationSafe, maxSafeDurationMinutes: maxSafe,
  };
}

// ─── Wind Chill Matrix Generation ────────────────────────────
// Generates a grid of wind chill values for the heatmap
export function generateMatrix(
  temps: number[],
  winds: number[],
): MatrixCell[][] {
  return winds.map(w =>
    temps.map(t => {
      const wci = windChillIndex(t, w);
      return { temp: t, wind: w, wci, risk: getRiskCategory(wci) };
    })
  );
}

// ─── Wind Chill vs Wind Speed curve ──────────────────────────
// For a fixed temperature, shows how WCI drops as wind increases
export function generateWindCurve(tempC: number, maxWindKmh: number = 80, step: number = 5): { wind: number; wci: number }[] {
  const points: { wind: number; wci: number }[] = [];
  for (let w = 0; w <= maxWindKmh; w += step) {
    points.push({ wind: w, wci: windChillIndex(tempC, w) });
  }
  return points;
}

// ─── Default matrix ranges ───────────────────────────────────
export const MATRIX_TEMPS = [10, 5, 0, -5, -10, -15, -20, -25, -30];
export const MATRIX_WINDS = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80];

// ─── Formatters ──────────────────────────────────────────────
export function fmtTemp(t: number): string {
  return `${t > 0 ? "+" : ""}${t.toFixed(1)}`;
}

export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
