// src/lib/wbgt-heat-stress-calculator/scoring-engine.ts
// WBGT calculation logic — ISO 7243 + simplified estimation

import type {
  DirectInputs,
  EstimatedInputs,
  RiskLevel,
  WBGTResult,
  WorkRestRatio,
  HeatControl,
} from "@/data/wbgt-heat-stress-calculator";
import {
  WORK_REST_RATIOS,
  RISK_THRESHOLDS,
  HEAT_CONTROLS,
  SUN_EXPOSURE_OPTIONS,
} from "@/data/wbgt-heat-stress-calculator";

// ─── WBGT Calculation ────────────────────────────────────────────

/**
 * Mode A: Direct WBGT from dry bulb, natural wet bulb, and globe temperature
 * Outdoor formula (with solar load): WBGT = 0.7×Tw + 0.2×Tg + 0.1×Td
 */
export function calculateDirectWBGT(inputs: DirectInputs): number | null {
  const { dryBulbC, wetBulbC, globeTempC } = inputs;
  if (dryBulbC === null || wetBulbC === null || globeTempC === null) return null;
  return 0.7 * wetBulbC + 0.2 * globeTempC + 0.1 * dryBulbC;
}

/**
 * Mode B: Simplified estimation from air temp, humidity, wind, sun exposure
 * Uses Lemke & Kjellstrom (2012) simplified outdoor WBGT approximation:
 *   WBGT ≈ 0.567×Ta + 0.393×e + 3.94 + solar adjustment
 * where e = water vapour pressure = (RH/100) × 6.105 × exp(17.27×Ta / (237.7+Ta))
 * Solar and wind adjustments applied as empirical offsets.
 */
export function calculateEstimatedWBGT(inputs: EstimatedInputs): number | null {
  const { airTempC, relativeHumidity, windSpeedKmh, sunExposure } = inputs;
  if (airTempC === null || relativeHumidity === null) return null;

  // Water vapour pressure (hPa)
  const e =
    (relativeHumidity / 100) *
    6.105 *
    Math.exp((17.27 * airTempC) / (237.7 + airTempC));

  // Base WBGT estimate
  let wbgt = 0.567 * airTempC + 0.393 * e + 3.94;

  // Solar load adjustment
  const sunOption = SUN_EXPOSURE_OPTIONS.find((o) => o.value === sunExposure);
  const solarAdj = sunOption ? sunOption.solarLoadC : 0;
  wbgt += solarAdj;

  // Wind cooling adjustment (modest reduction at higher wind speeds)
  const windKmh = windSpeedKmh ?? 0;
  if (windKmh > 5) {
    const windReduction = Math.min((windKmh - 5) * 0.1, 3); // max 3°C reduction
    wbgt -= windReduction;
  }

  return wbgt;
}

// ─── Risk Assessment ─────────────────────────────────────────────

export function getRiskLevel(wbgt: number, activityLevel: string): RiskLevel {
  // Check against continuous work limit (most restrictive)
  const continuousLimit = WORK_REST_RATIOS[0].limits[activityLevel];
  // Check against most relaxed ratio (25/75)
  const maxLimit = WORK_REST_RATIOS[3].limits[activityLevel];

  if (continuousLimit === undefined) return "green";

  if (wbgt <= continuousLimit) return "green";
  if (wbgt <= maxLimit) return "amber";
  return "red";
}

export function getApplicableRatio(
  wbgt: number,
  activityLevel: string
): { ratio: WorkRestRatio; index: number } {
  // Find the least restrictive ratio whose limit the WBGT is within
  for (let i = 0; i < WORK_REST_RATIOS.length; i++) {
    const limit = WORK_REST_RATIOS[i].limits[activityLevel];
    if (limit !== undefined && wbgt <= limit) {
      return { ratio: WORK_REST_RATIOS[i], index: i };
    }
  }
  // Exceeds all limits — return most restrictive and flag red
  return { ratio: WORK_REST_RATIOS[3], index: 3 };
}

export function getMaxContinuousMinutes(wbgt: number, activityLevel: string): number {
  const continuousLimit = WORK_REST_RATIOS[0].limits[activityLevel];
  if (continuousLimit === undefined) return 60;
  if (wbgt <= continuousLimit) return 60;

  // Interpolate between ratios
  for (let i = 0; i < WORK_REST_RATIOS.length; i++) {
    const limit = WORK_REST_RATIOS[i].limits[activityLevel];
    if (limit !== undefined && wbgt <= limit) {
      return WORK_REST_RATIOS[i].workMinutes;
    }
  }
  // Exceeds all — recommend max 15 min
  return 15;
}

export function getApplicableControls(riskLevel: RiskLevel): HeatControl[] {
  const levelOrder: RiskLevel[] = ["green", "amber", "red"];
  const levelIndex = levelOrder.indexOf(riskLevel);
  return HEAT_CONTROLS.filter((c) => {
    const controlIndex = levelOrder.indexOf(c.minRiskLevel);
    return controlIndex <= levelIndex;
  });
}

export function getRiskThreshold(level: RiskLevel) {
  return RISK_THRESHOLDS.find((t) => t.level === level) ?? RISK_THRESHOLDS[0];
}

// ─── Full Assessment ─────────────────────────────────────────────

export function assessWBGT(wbgt: number | null, activityLevel: string): WBGTResult {
  if (wbgt === null) {
    return {
      wbgt: null,
      riskLevel: "green",
      applicableRatio: "—",
      maxContinuousMinutes: 60,
      allRatios: WORK_REST_RATIOS.map((r) => ({
        ratio: r,
        applicable: false,
        wbgtLimit: r.limits[activityLevel] ?? 0,
      })),
      controls: [],
    };
  }

  const riskLevel = getRiskLevel(wbgt, activityLevel);
  const { ratio, index } = getApplicableRatio(wbgt, activityLevel);
  const maxMins = getMaxContinuousMinutes(wbgt, activityLevel);
  const controls = getApplicableControls(riskLevel);

  const allRatios = WORK_REST_RATIOS.map((r, i) => ({
    ratio: r,
    applicable: i === index && riskLevel !== "red",
    wbgtLimit: r.limits[activityLevel] ?? 0,
  }));

  return {
    wbgt,
    riskLevel,
    applicableRatio: riskLevel === "red" ? "Stop or 25/75 max" : ratio.label,
    maxContinuousMinutes: maxMins,
    allRatios,
    controls,
  };
}
