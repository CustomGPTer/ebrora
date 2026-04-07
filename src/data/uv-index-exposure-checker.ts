// src/data/uv-index-exposure-checker.ts
// UV Index Exposure Checker — data, types, solar engine, and recommendations

// ─── Types ──────────────────────────────────────────────────────
export interface UKCity {
  name: string;
  lat: number;
  region: string;
}

export interface SkinType {
  type: string;
  label: string;
  description: string;
  med: number; // Minimal Erythemal Dose in SED
  burnTimeMultiplier: number; // relative to baseline UV=6
}

export type CloudCover = "clear" | "partial" | "overcast";
export type RiskCategory = "low" | "moderate" | "high" | "very-high" | "extreme";

export interface HourlyUV {
  hour: number;
  minute: number;
  label: string;
  solarElevation: number;
  clearSkyUV: number;
  adjustedUV: number;
  protectedUV: number;
  sed: number;
  protectedSED: number;
  risk: RiskCategory;
}

export interface UVAssessment {
  hourly: HourlyUV[];
  peakUV: number;
  peakTime: string;
  totalSED: number;
  protectedSED: number;
  riskCategory: RiskCategory;
  burnTimeMinutes: number | null;
  recommendations: string[];
  shadeBreaks: string[];
}

export interface PPEControls {
  enabled: boolean;
  sunscreen: boolean; // SPF 30+ ~ 0.5 reduction factor
  hat: boolean; // ~ 0.3 reduction for head/face
  longSleeves: boolean; // ~ 0.85 reduction
  shade: boolean; // ~ 0.25 reduction during breaks
}

// ─── UK Cities (~35) ─────────────────────────────────────────
export const UK_CITIES: UKCity[] = [
  { name: "Aberdeen", lat: 57.15, region: "Scotland" },
  { name: "Belfast", lat: 54.60, region: "Northern Ireland" },
  { name: "Birmingham", lat: 52.48, region: "West Midlands" },
  { name: "Bournemouth", lat: 50.72, region: "South West" },
  { name: "Bradford", lat: 53.79, region: "Yorkshire" },
  { name: "Brighton", lat: 50.82, region: "South East" },
  { name: "Bristol", lat: 51.45, region: "South West" },
  { name: "Cambridge", lat: 52.21, region: "East" },
  { name: "Cardiff", lat: 51.48, region: "Wales" },
  { name: "Coventry", lat: 52.41, region: "West Midlands" },
  { name: "Derby", lat: 52.92, region: "East Midlands" },
  { name: "Dundee", lat: 56.46, region: "Scotland" },
  { name: "Edinburgh", lat: 55.95, region: "Scotland" },
  { name: "Exeter", lat: 50.72, region: "South West" },
  { name: "Glasgow", lat: 55.86, region: "Scotland" },
  { name: "Hull", lat: 53.74, region: "Yorkshire" },
  { name: "Inverness", lat: 57.48, region: "Scotland" },
  { name: "Leeds", lat: 53.80, region: "Yorkshire" },
  { name: "Leicester", lat: 52.63, region: "East Midlands" },
  { name: "Liverpool", lat: 53.41, region: "North West" },
  { name: "London", lat: 51.51, region: "South East" },
  { name: "Manchester", lat: 53.48, region: "North West" },
  { name: "Newcastle", lat: 54.98, region: "North East" },
  { name: "Norwich", lat: 52.63, region: "East" },
  { name: "Nottingham", lat: 52.95, region: "East Midlands" },
  { name: "Oxford", lat: 51.75, region: "South East" },
  { name: "Plymouth", lat: 50.38, region: "South West" },
  { name: "Portsmouth", lat: 50.80, region: "South East" },
  { name: "Sheffield", lat: 53.38, region: "Yorkshire" },
  { name: "Southampton", lat: 50.90, region: "South East" },
  { name: "Stockport", lat: 53.41, region: "North West" },
  { name: "Stoke-on-Trent", lat: 53.00, region: "West Midlands" },
  { name: "Swansea", lat: 51.62, region: "Wales" },
  { name: "Sunderland", lat: 54.91, region: "North East" },
  { name: "York", lat: 53.96, region: "Yorkshire" },
];

// ─── Skin Types (Fitzpatrick Scale) ─────────────────────────
export const SKIN_TYPES: SkinType[] = [
  { type: "I", label: "Type I - Very fair", description: "Always burns, never tans. Very fair skin, red/blonde hair, blue eyes.", med: 2.0, burnTimeMultiplier: 0.67 },
  { type: "II", label: "Type II - Fair", description: "Usually burns, tans minimally. Fair skin, light hair.", med: 2.5, burnTimeMultiplier: 0.83 },
  { type: "III", label: "Type III - Medium", description: "Sometimes burns, tans gradually. Medium skin.", med: 3.0, burnTimeMultiplier: 1.0 },
  { type: "IV", label: "Type IV - Olive", description: "Rarely burns, tans easily. Olive/light brown skin.", med: 4.5, burnTimeMultiplier: 1.5 },
  { type: "V", label: "Type V - Brown", description: "Very rarely burns, tans darkly. Brown skin.", med: 6.0, burnTimeMultiplier: 2.0 },
  { type: "VI", label: "Type VI - Dark", description: "Never burns. Very dark brown/black skin.", med: 9.0, burnTimeMultiplier: 3.0 },
];

// ─── Cloud Cover Multipliers ─────────────────────────────────
export const CLOUD_MULTIPLIERS: Record<CloudCover, { label: string; factor: number; description: string }> = {
  clear: { label: "Clear sky", factor: 1.0, description: "No significant cloud cover" },
  partial: { label: "Partial cloud", factor: 0.7, description: "Scattered/broken cloud (3-6 oktas)" },
  overcast: { label: "Overcast", factor: 0.3, description: "Full cloud cover (7-8 oktas)" },
};

// ─── Risk Bands ──────────────────────────────────────────────
export const RISK_BANDS: { category: RiskCategory; min: number; max: number; label: string; colour: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }[] = [
  { category: "low", min: 0, max: 2, label: "Low", colour: "#22C55E", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
  { category: "moderate", min: 3, max: 5, label: "Moderate", colour: "#EAB308", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" },
  { category: "high", min: 6, max: 7, label: "High", colour: "#F97316", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
  { category: "very-high", min: 8, max: 10, label: "Very High", colour: "#EF4444", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
  { category: "extreme", min: 11, max: 99, label: "Extreme", colour: "#7C3AED", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
];

export function getRiskCategory(uv: number): RiskCategory {
  if (uv <= 2) return "low";
  if (uv <= 5) return "moderate";
  if (uv <= 7) return "high";
  if (uv <= 10) return "very-high";
  return "extreme";
}

export function getRiskBand(category: RiskCategory) {
  return RISK_BANDS.find(b => b.category === category)!;
}

// ─── Solar Position Engine ───────────────────────────────────
// Deterministic solar position formulas per spec

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Day of year (1-366) */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/** Solar declination in degrees */
function solarDeclination(doy: number): number {
  return -23.45 * Math.cos((360 / 365) * (doy + 10) * DEG);
}

/** Equation of time in minutes */
function equationOfTime(doy: number): number {
  const B = ((doy - 81) * 360 / 365) * DEG;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** Solar elevation angle in degrees for given lat, doy, hour (UTC solar time) */
export function solarElevation(lat: number, doy: number, hourUTC: number): number {
  const decl = solarDeclination(doy) * DEG;
  const latRad = lat * DEG;
  // Hour angle: 0 at solar noon (approx 12:00 UTC for UK ~0deg longitude)
  const eot = equationOfTime(doy);
  const solarTime = hourUTC + eot / 60;
  const hourAngle = (solarTime - 12) * 15 * DEG;
  const sinElev = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sinElev))) * RAD;
}

/** Sunrise/sunset hour (UTC) for a given lat and doy. Returns [sunrise, sunset] */
export function sunriseSunset(lat: number, doy: number): [number, number] {
  const decl = solarDeclination(doy) * DEG;
  const latRad = lat * DEG;
  const cosOmega = -Math.tan(latRad) * Math.tan(decl);
  // Handle polar day/night
  if (cosOmega < -1) return [0, 24]; // Midnight sun
  if (cosOmega > 1) return [12, 12]; // Polar night
  const omega = Math.acos(cosOmega) * RAD;
  const eot = equationOfTime(doy);
  const noon = 12 - eot / 60;
  return [noon - omega / 15, noon + omega / 15];
}

/** Clear-sky UV index from solar elevation angle (WHO/WMO mid-latitude lookup) */
export function clearSkyUVFromElevation(elevDeg: number): number {
  if (elevDeg <= 0) return 0;
  // Approximation based on WHO data for mid-latitudes, clear sky, sea level
  // UV ~ 0.4 * elev^0.7 for elevations < 70 deg (fitted to published data)
  // Peaks around 9-10 in UK summer at highest solar elevation (~60 deg at lat 51)
  const uv = 0.4 * Math.pow(elevDeg, 0.7);
  return Math.max(0, Math.min(15, uv));
}

/** Altitude UV multiplier: +6% per 1000m */
export function altitudeMultiplier(altitudeM: number): number {
  return 1 + 0.06 * (altitudeM / 1000);
}

/** PPE protection factor (combined) */
export function ppeReductionFactor(ppe: PPEControls): number {
  if (!ppe.enabled) return 1.0;
  let factor = 1.0;
  if (ppe.sunscreen) factor *= 0.5; // SPF 30+ halves effective dose
  if (ppe.hat) factor *= 0.7; // Broad-brim hat reduces face/neck by ~30%
  if (ppe.longSleeves) factor *= 0.85; // Long sleeves reduce body exposure
  if (ppe.shade) factor *= 0.75; // Shade breaks reduce cumulative
  return factor;
}

/** Is BST active? Last Sunday in March to last Sunday in October */
export function isBST(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  if (month < 2 || month > 9) return false; // Jan/Feb or Nov/Dec
  if (month > 2 && month < 9) return true; // Apr-Sep
  // March: BST starts last Sunday
  if (month === 2) {
    const lastSun = new Date(year, 2, 31);
    lastSun.setDate(lastSun.getDate() - lastSun.getDay());
    return date >= lastSun;
  }
  // October: BST ends last Sunday
  const lastSun = new Date(year, 9, 31);
  lastSun.setDate(lastSun.getDate() - lastSun.getDay());
  return date < lastSun;
}

/** Estimate burn time in minutes for given UV index and skin type */
export function estimateBurnTime(uv: number, skinType: SkinType): number | null {
  if (uv <= 0) return null;
  // Burn time (minutes) ~ (MED in J/m2) / (UV * 0.025 J/m2/min)
  // Using SED: 1 SED = 100 J/m2, and at UV index X, the erythemal irradiance ~ X * 25 mW/m2
  // So time to 1 MED = MED * 100 / (X * 25 / 1000 * 60) = MED * 100 * 1000 / (X * 25 * 60)
  // Simplified: burnTime = (MED * 100 / (uv * 0.025)) / 60
  // More practically: burn time in minutes ~ (200 * skinType.med) / (3 * uv)
  const burnMinutes = (200 * skinType.med) / (3 * uv);
  return Math.round(burnMinutes);
}

// ─── Full Assessment Calculation ─────────────────────────────
export function calculateAssessment(
  lat: number,
  date: Date,
  startHour: number,
  endHour: number,
  cloudCover: CloudCover,
  altitudeM: number,
  skinType: SkinType | null,
  ppe: PPEControls
): UVAssessment {
  const doy = dayOfYear(date);
  const bst = isBST(date);
  const bstOffset = bst ? 1 : 0;
  const cloudFactor = CLOUD_MULTIPLIERS[cloudCover].factor;
  const altFactor = altitudeMultiplier(altitudeM);
  const ppeFactor = ppeReductionFactor(ppe);

  const hourly: HourlyUV[] = [];
  let peakUV = 0;
  let peakTime = "";
  let totalSED = 0;
  let protectedSED = 0;

  // Calculate for every 30 minutes in the working window
  for (let localH = startHour; localH < endHour; localH += 0.5) {
    const utcH = localH - bstOffset;
    const elev = solarElevation(lat, doy, utcH);
    const clearUV = clearSkyUVFromElevation(elev);
    const adjustedUV = Math.max(0, clearUV * cloudFactor * altFactor);
    const protUV = adjustedUV * ppeFactor;

    const h = Math.floor(localH);
    const m = (localH % 1) * 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const risk = getRiskCategory(adjustedUV);

    // SED per 30 min: UV index * 0.5 hours * 0.09 (conversion: 1 UV hour ~ 0.09 SED)
    const sedIncrement = adjustedUV * 0.5 * 0.09;
    const protSedIncrement = protUV * 0.5 * 0.09;
    totalSED += sedIncrement;
    protectedSED += protSedIncrement;

    if (adjustedUV > peakUV) {
      peakUV = adjustedUV;
      peakTime = label;
    }

    hourly.push({
      hour: h, minute: m, label,
      solarElevation: elev,
      clearSkyUV: clearUV,
      adjustedUV: Math.round(adjustedUV * 10) / 10,
      protectedUV: Math.round(protUV * 10) / 10,
      sed: Math.round(totalSED * 100) / 100,
      protectedSED: Math.round(protectedSED * 100) / 100,
      risk,
    });
  }

  peakUV = Math.round(peakUV * 10) / 10;
  totalSED = Math.round(totalSED * 100) / 100;
  protectedSED = Math.round(protectedSED * 100) / 100;
  const riskCategory = getRiskCategory(peakUV);

  // Burn time estimate
  const burnTimeMinutes = skinType ? estimateBurnTime(peakUV, skinType) : null;

  // Recommendations
  const recommendations = generateRecommendations(peakUV, totalSED, riskCategory, ppe);
  const shadeBreaks = generateShadeBreaks(hourly);

  return {
    hourly, peakUV, peakTime, totalSED, protectedSED,
    riskCategory, burnTimeMinutes, recommendations, shadeBreaks,
  };
}

// ─── Recommendation Engine ───────────────────────────────────
function generateRecommendations(peakUV: number, totalSED: number, risk: RiskCategory, ppe: PPEControls): string[] {
  const recs: string[] = [];

  if (risk === "low") {
    recs.push("UV risk is low - standard site PPE is sufficient");
    recs.push("No specific UV controls required beyond normal measures");
  }

  if (risk === "moderate") {
    recs.push("Apply SPF 30+ broad-spectrum sunscreen to exposed skin, reapply every 2 hours");
    recs.push("Wear a hard hat with a neck flap or broad-brimmed attachment where helmet not required");
    recs.push("Seek shade during breaks");
  }

  if (risk === "high" || risk === "very-high") {
    recs.push("SPF 30+ sunscreen mandatory for all exposed skin - reapply every 2 hours and after sweating");
    recs.push("Schedule outdoor tasks for early morning or late afternoon where possible");
    recs.push("Provide shade structures at fixed work locations");
    recs.push("Mandatory shade breaks - see schedule below");
    recs.push("Wear UV-protective safety eyewear (EN 172)");
    recs.push("Long-sleeved, loose-fitting, light-coloured clothing where practicable");
  }

  if (risk === "extreme") {
    recs.push("EXTREME UV - reschedule outdoor work to early morning/late afternoon if possible");
    recs.push("If work cannot be rescheduled, implement all high-risk controls plus:");
    recs.push("Maximum 30 minutes continuous exposure, followed by 15 minutes shade rest");
    recs.push("Provide cool drinking water - minimum 250ml per 15 minutes of exposure");
    recs.push("Monitor operatives for signs of heat illness and sunburn");
  }

  if (totalSED > 2.0 && !ppe.enabled) {
    recs.push("Daily SED exceeds HSE guidance threshold of 2 SED for unprotected skin - implement UV controls");
  }

  if (totalSED > 2.0 && ppe.enabled && ppe.sunscreen) {
    recs.push("With current PPE controls, cumulative dose is reduced but re-application discipline is essential");
  }

  return recs;
}

function generateShadeBreaks(hourly: HourlyUV[]): string[] {
  const breaks: string[] = [];
  let inHighPeriod = false;
  let highStart = "";

  for (const h of hourly) {
    if (h.adjustedUV >= 6 && !inHighPeriod) {
      inHighPeriod = true;
      highStart = h.label;
    }
    if ((h.adjustedUV < 6 || h === hourly[hourly.length - 1]) && inHighPeriod) {
      breaks.push(`Shade breaks required ${highStart} -- ${h.label} (UV 6+)`);
      inHighPeriod = false;
    }
  }

  if (breaks.length === 0 && hourly.some(h => h.adjustedUV >= 3)) {
    const modStart = hourly.find(h => h.adjustedUV >= 3);
    const modEnd = [...hourly].reverse().find(h => h.adjustedUV >= 3);
    if (modStart && modEnd) {
      breaks.push(`Shade breaks recommended ${modStart.label} -- ${modEnd.label} (UV 3+)`);
    }
  }

  return breaks;
}

// ─── Formatters ──────────────────────────────────────────────
export function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatUV(uv: number): string {
  return uv.toFixed(1);
}

export function formatSED(sed: number): string {
  return sed.toFixed(2);
}
