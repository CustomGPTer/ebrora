// src/data/plant-hire-comparator.ts
// Plant Hire Cost Comparator (Hire vs Buy) — data, types, calculations

// ─── Types ──────────────────────────────────────────────────
export interface PlantItem {
  id: string;
  description: string;
  purchasePrice: number;      // £
  residualValue: number;       // £ at end of life/project
  usefulLifeYears: number;     // years (used when lifeMode === "years")
  lifeMode: "years" | "project"; // "project" = depreciate over project duration only
  annualMaintenance: number;   // £/year
  annualInsurance: number;     // £/year
  hireRatePerWeek: number;     // £/week
  projectDurationWeeks: number;
  utilisation: number;         // 0–100 %
  financeRate: number;         // annual % (0 = cash purchase)
  useAmortisation: boolean;    // true = monthly repayment schedule
  mobDemob: number;            // £ mobilisation + demobilisation
}

export interface ItemResult {
  item: PlantItem;
  hireCost: number;
  ownershipCost: number;
  annualDepreciation: number;
  annualFinanceCost: number;
  annualOperatingCost: number;
  totalAnnualOwnership: number;
  projectOwnershipCost: number;
  effectiveHireRatePerHour: number;
  effectiveOwnRatePerHour: number;
  saving: number;              // always positive — absolute difference
  cheaperOption: "hire" | "buy";
  breakevenWeeks: number | null; // null = lines never cross
  cumulativeHire: number[];    // weekly cumulative
  cumulativeOwn: number[];     // weekly cumulative
}

export interface ComparisonSummary {
  totalHireCost: number;
  totalOwnershipCost: number;
  totalSaving: number;
  overallRecommendation: "hire" | "buy" | "mixed";
}

// ─── Defaults ───────────────────────────────────────────────
export const DEFAULTS: PlantItem = {
  id: "1",
  description: "",
  purchasePrice: 0,
  residualValue: 0,
  usefulLifeYears: 5,
  lifeMode: "years",
  annualMaintenance: 0,
  annualInsurance: 0,
  hireRatePerWeek: 0,
  projectDurationWeeks: 26,
  utilisation: 80,
  financeRate: 0,
  useAmortisation: false,
  mobDemob: 0,
};

// ─── Helpers ────────────────────────────────────────────────
export function fmtGBP(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (Math.abs(v) >= 10_000) return `£${(v / 1_000).toFixed(1)}k`;
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtWeeks(w: number): string {
  if (w >= 52) {
    const yrs = Math.floor(w / 52);
    const rem = Math.round(w % 52);
    return rem > 0 ? `${yrs}y ${rem}w` : `${yrs}y`;
  }
  return `${Math.round(w)}w`;
}

// ─── Finance helpers ────────────────────────────────────────
function calcAnnualFinanceCost(
  purchasePrice: number, residualValue: number,
  financeRate: number, useAmortisation: boolean,
  depreciationLifeYears: number,
): number {
  if (financeRate <= 0 || depreciationLifeYears <= 0) return 0;
  if (useAmortisation) {
    const monthlyRate = financeRate / 100 / 12;
    const months = depreciationLifeYears * 12;
    if (monthlyRate > 0 && months > 0) {
      const monthlyPayment = purchasePrice * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      const totalRepaid = monthlyPayment * months;
      const totalInterest = totalRepaid - purchasePrice;
      return totalInterest / depreciationLifeYears;
    }
    return 0;
  }
  // Simple average capital method
  const avgCapital = (purchasePrice + residualValue) / 2;
  return avgCapital * (financeRate / 100);
}

// ─── Core Calculations ──────────────────────────────────────
export function calculateItem(item: PlantItem): ItemResult {
  const durationYears = item.projectDurationWeeks / 52;
  const hoursPerWeek = 45; // standard construction working week
  const totalProjectHours = item.projectDurationWeeks * hoursPerWeek;
  const productiveHours = totalProjectHours * (item.utilisation / 100);

  // ── Hire cost
  const hireCost = item.hireRatePerWeek * item.projectDurationWeeks;

  // ── Ownership cost
  // Clamp: residual cannot exceed purchase price (prevents negative depreciation)
  const effectiveResidual = Math.min(item.residualValue, item.purchasePrice);
  const depreciationAmount = item.purchasePrice - effectiveResidual; // always >= 0

  // Depreciation life depends on mode
  const depreciationLife = item.lifeMode === "project"
    ? durationYears
    : item.usefulLifeYears;

  const annualDepreciation = depreciationLife > 0
    ? depreciationAmount / depreciationLife
    : 0;

  // Finance cost
  const annualFinanceCost = calcAnnualFinanceCost(
    item.purchasePrice, effectiveResidual, item.financeRate,
    item.useAmortisation, depreciationLife
  );

  const annualOperatingCost = item.annualMaintenance + item.annualInsurance;
  const totalAnnualOwnership = annualDepreciation + annualFinanceCost + annualOperatingCost;

  // Pro-rate to project duration + mob/demob
  // Note: for project mode this algebraically simplifies to:
  //   depAmount + totalFinanceInterest + ops*durationYears + mob
  const projectOwnershipCost = (totalAnnualOwnership * durationYears) + item.mobDemob;
  const ownershipCost = projectOwnershipCost;

  // Effective hourly rates
  const effectiveHireRatePerHour = productiveHours > 0 ? hireCost / productiveHours : 0;
  const effectiveOwnRatePerHour = productiveHours > 0 ? ownershipCost / productiveHours : 0;

  // Saving — default to "hire" when equal (no capital risk with hire)
  const costDiff = ownershipCost - hireCost;
  const cheaperOption: "hire" | "buy" = costDiff >= 0 ? "hire" : "buy";
  const saving = Math.abs(costDiff);

  // ── Breakeven & cumulative cost curves
  //
  // The cumulative cost model differs by lifeMode:
  //
  // YEARS MODE (machine has ongoing life beyond this project):
  //   Annual costs (dep + finance + ops) are fixed and evenly distributed.
  //   Own(w) = (totalAnnualOwnership / 52) * w + mobDemob
  //   → straight line, y-intercept = mobDemob, slope = totalAnnualOwnership/52
  //
  // PROJECT MODE (buy for this one job, sell at residual value):
  //   Depreciation (P-R) and finance interest are LUMP SUMS paid upfront
  //   regardless of how many weeks the machine is used. Only operating
  //   costs (maintenance + insurance) scale with time.
  //   Own(w) = (P-R) + totalFinanceInterest + (annualOps/52)*w + mobDemob
  //   → straight line, y-intercept = depAmount + finInterest + mob, slope = annualOps/52

  let fixedCost: number;     // cost at week 0 (upfront investment)
  let weeklyVariable: number; // cost per additional week

  if (item.lifeMode === "project") {
    const totalFinanceInterest = annualFinanceCost * depreciationLife;
    fixedCost = depreciationAmount + totalFinanceInterest + item.mobDemob;
    weeklyVariable = annualOperatingCost / 52;
  } else {
    fixedCost = item.mobDemob;
    weeklyVariable = totalAnnualOwnership / 52;
  }

  // Breakeven: hireRate * w = fixedCost + weeklyVariable * w
  //            w = fixedCost / (hireRate - weeklyVariable)
  const weeklyDiff = item.hireRatePerWeek - weeklyVariable;
  let breakevenWeeks: number | null = null;
  if (weeklyDiff > 0.01) {
    const be = fixedCost / weeklyDiff;
    // If fixedCost is 0, breakeven is 0 — buy is cheaper from week 1
    breakevenWeeks = be >= 0 ? be : null;
  } else if (weeklyDiff < -0.01) {
    // Weekly ownership exceeds hire rate AND there's an upfront cost — buy never wins
    breakevenWeeks = null;
  } else {
    // Parallel lines — only meet if fixedCost ≈ 0
    breakevenWeeks = fixedCost <= 0.01 ? 0 : null;
  }

  // Cumulative cost curves (weekly)
  const maxWeeks = Math.max(item.projectDurationWeeks + Math.round(item.projectDurationWeeks * 0.3), 52);
  const cumulativeHire: number[] = [];
  const cumulativeOwn: number[] = [];
  for (let w = 0; w <= maxWeeks; w++) {
    cumulativeHire.push(item.hireRatePerWeek * w);
    cumulativeOwn.push(fixedCost + weeklyVariable * w);
  }

  return {
    item,
    hireCost,
    ownershipCost,
    annualDepreciation,
    annualFinanceCost,
    annualOperatingCost,
    totalAnnualOwnership,
    projectOwnershipCost,
    effectiveHireRatePerHour,
    effectiveOwnRatePerHour,
    saving,
    cheaperOption,
    breakevenWeeks,
    cumulativeHire,
    cumulativeOwn,
  };
}

// ── Duration sensitivity — shows hire vs own cost at different project lengths
export interface DurationSensitivityPoint {
  weeks: number;
  hireCost: number;
  ownCost: number;
  cheaperOption: "hire" | "buy";
}

export function calcDurationSensitivity(item: PlantItem): DurationSensitivityPoint[] {
  const effectiveResidual = Math.min(item.residualValue, item.purchasePrice);
  const depAmount = item.purchasePrice - effectiveResidual;
  const annualOps = item.annualMaintenance + item.annualInsurance;

  const points: DurationSensitivityPoint[] = [];
  const maxW = Math.min(Math.max(item.projectDurationWeeks * 3, 104), 520);
  const step = Math.max(1, Math.round(maxW / 40));

  for (let w = step; w <= maxW; w += step) {
    const hc = item.hireRatePerWeek * w;
    const dY = w / 52;

    let oc: number;
    if (item.lifeMode === "project") {
      // Project mode: depreciation is always the fixed lump (P-R).
      // Finance interest must be recalculated for each test duration.
      const annFin = calcAnnualFinanceCost(
        item.purchasePrice, effectiveResidual, item.financeRate,
        item.useAmortisation, dY
      );
      const totalFinInt = annFin * dY;
      const opsCost = annualOps * dY;
      oc = depAmount + totalFinInt + opsCost + item.mobDemob;
    } else {
      // Years mode: fixed annual rate, pro-rated to duration
      const depLife = item.usefulLifeYears;
      const annDep = depLife > 0 ? depAmount / depLife : 0;
      const annFin = calcAnnualFinanceCost(
        item.purchasePrice, effectiveResidual, item.financeRate,
        item.useAmortisation, depLife
      );
      const totalAnn = annDep + annFin + annualOps;
      oc = (totalAnn / 52) * w + item.mobDemob;
    }

    points.push({ weeks: w, hireCost: hc, ownCost: oc, cheaperOption: hc <= oc ? "hire" : "buy" });
  }
  return points;
}

export function calcSummary(results: ItemResult[]): ComparisonSummary {
  const totalHireCost = results.reduce((s, r) => s + r.hireCost, 0);
  const totalOwnershipCost = results.reduce((s, r) => s + r.ownershipCost, 0);
  const totalSaving = Math.abs(totalHireCost - totalOwnershipCost);
  const hireCount = results.filter(r => r.cheaperOption === "hire").length;
  const buyCount = results.filter(r => r.cheaperOption === "buy").length;
  const overallRecommendation: "hire" | "buy" | "mixed" =
    hireCount === results.length ? "hire" :
    buyCount === results.length ? "buy" : "mixed";
  return { totalHireCost, totalOwnershipCost, totalSaving, overallRecommendation };
}
