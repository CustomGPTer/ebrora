// src/data/overtime-cost-calculator.ts
// Overtime Cost Calculator — data, types, calculation logic

// ─── Types ───────────────────────────────────────────────────
export interface OvertimeTier {
  id: string;
  label: string;
  multiplier: number; // e.g. 1.5 = time-and-a-half
  hoursPerWeek: number;
}

export interface OperativeGroup {
  id: string;
  label: string;
  baseRate: number; // £/hr
  standardHoursPerWeek: number;
  tiers: OvertimeTier[];
  operativeCount: number;
}

export interface EmployerOnCosts {
  enabled: boolean;
  nicPercent: number;       // Employer NIC — default 13.8%
  pensionPercent: number;   // Employer pension — default 3%
  citbLevyPercent: number;  // CITB levy — default 0.35%
}

export interface OvertimeInputs {
  groups: OperativeGroup[];
  weeks: number;
  onCosts: EmployerOnCosts;
}

export interface TierCostBreakdown {
  label: string;
  multiplier: number;
  hours: number;
  grossCost: number;       // hours x base x multiplier
  baseCost: number;        // hours x base x 1.0
  premium: number;         // grossCost - baseCost
}

export interface GroupResult {
  groupId: string;
  groupLabel: string;
  baseRate: number;
  standardHoursPerWeek: number;
  operativeCount: number;
  weeklyStandardPay: number;        // per operative
  weeklyOvertimeCost: number;       // per operative (all tiers)
  weeklyTotalPay: number;           // per operative
  weeklyOvertimePremium: number;    // per operative
  totalOvertimeHoursPerWeek: number;
  totalHoursPerWeek: number;
  effectiveHourlyRate: number;
  overtimeAsPercentOfTotal: number;
  tiers: TierCostBreakdown[];
  // Scaled by operatives & weeks
  totalLabourCost: number;
  totalOvertimePremium: number;
  totalOvertimeCost: number;
  totalStandardCost: number;
  // On-costs
  totalOnCost: number;
  grandTotal: number;
  // Hire-vs-overtime breakeven
  hireBreakevenWeeks: number | null; // null if never breaks even
  weeklyHireSaving: number;         // positive = hiring saves money
  // Weekly breakdown for charts
  weeklyBreakdown: WeekRow[];
  // Annual projection
  annualCost: number;
  annualPremium: number;
}

export interface WeekRow {
  week: number;
  standardCost: number;
  overtimeCost: number;
  totalCost: number;
  cumulativeTotal: number;
  cumulativeBaseOnly: number;
}

export interface CalculationResult {
  groups: GroupResult[];
  // Aggregated
  totalLabourCost: number;
  totalOvertimePremium: number;
  totalOnCost: number;
  grandTotal: number;
  overallEffectiveRate: number;
  overallOvertimePercent: number;
  annualCost: number;
  annualPremium: number;
  totalOperatives: number;
  totalWeeks: number;
  // Pie chart data
  pieData: { label: string; value: number; colour: string }[];
  // Hire comparison
  totalHireBreakevenWeeks: number | null;
}

// ─── Presets ─────────────────────────────────────────────────
export interface OvertimePreset {
  id: string;
  label: string;
  description: string;
  standardHours: number;
  tiers: Omit<OvertimeTier, "id">[];
}

export const OVERTIME_PRESETS: OvertimePreset[] = [
  {
    id: "cijc-standard",
    label: "CIJC Standard",
    description: "Mon-Fri OT at time-and-a-half, Sat at time-and-a-half, Sun at double time",
    standardHours: 39,
    tiers: [
      { label: "Weekday OT (T+1/2)", multiplier: 1.5, hoursPerWeek: 6 },
      { label: "Saturday (T+1/2)", multiplier: 1.5, hoursPerWeek: 8 },
      { label: "Sunday (x2)", multiplier: 2.0, hoursPerWeek: 0 },
    ],
  },
  {
    id: "naeci-standard",
    label: "NAECI Standard",
    description: "45hr week, weekday OT at time-and-a-half, weekend double time",
    standardHours: 45,
    tiers: [
      { label: "Weekday OT (T+1/2)", multiplier: 1.5, hoursPerWeek: 4 },
      { label: "Saturday (x2)", multiplier: 2.0, hoursPerWeek: 8 },
      { label: "Sunday (x2)", multiplier: 2.0, hoursPerWeek: 0 },
    ],
  },
  {
    id: "six-day-week",
    label: "6-Day Week",
    description: "39hr standard + 6hrs weekday OT + 8hrs Saturday, all at time-and-a-half",
    standardHours: 39,
    tiers: [
      { label: "Weekday OT (T+1/2)", multiplier: 1.5, hoursPerWeek: 6 },
      { label: "Saturday (T+1/2)", multiplier: 1.5, hoursPerWeek: 8 },
    ],
  },
  {
    id: "seven-day-week",
    label: "7-Day Shutdown Pattern",
    description: "Intensive shutdown: weekday OT + Sat T+1/2 + Sun double",
    standardHours: 39,
    tiers: [
      { label: "Weekday OT (T+1/2)", multiplier: 1.5, hoursPerWeek: 6 },
      { label: "Saturday (T+1/2)", multiplier: 1.5, hoursPerWeek: 10 },
      { label: "Sunday (x2)", multiplier: 2.0, hoursPerWeek: 10 },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    description: "Define your own overtime tiers and hours",
    standardHours: 39,
    tiers: [
      { label: "Overtime Tier 1", multiplier: 1.5, hoursPerWeek: 0 },
    ],
  },
];

// ─── Tier Colours ────────────────────────────────────────────
export const TIER_COLOURS = [
  "#F59E0B", // amber — time-and-a-half
  "#EF4444", // red — double time
  "#7C3AED", // purple — Sunday/premium
  "#0EA5E9", // sky — tier 4
  "#EC4899", // pink — tier 5
];

export const TIER_COLOURS_LIGHT = [
  "rgba(245,158,11,0.15)",
  "rgba(239,68,68,0.15)",
  "rgba(124,58,237,0.15)",
  "rgba(14,165,233,0.15)",
  "rgba(236,72,153,0.15)",
];

// ─── Helpers ─────────────────────────────────────────────────
export function fmtGBP(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `£${(v / 1_000).toFixed(1)}k`;
  return `£${v.toFixed(2)}`;
}

export function fmtGBPFull(v: number): string {
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 8);
}

// ─── Core Calculation ────────────────────────────────────────
export function calculateOvertime(inputs: OvertimeInputs): CalculationResult {
  const { groups, weeks, onCosts } = inputs;

  const groupResults: GroupResult[] = groups.map((g) => {
    const tierBreakdowns: TierCostBreakdown[] = g.tiers.map((t) => {
      const grossCost = t.hoursPerWeek * g.baseRate * t.multiplier;
      const baseCost = t.hoursPerWeek * g.baseRate;
      return {
        label: t.label,
        multiplier: t.multiplier,
        hours: t.hoursPerWeek,
        grossCost,
        baseCost,
        premium: grossCost - baseCost,
      };
    });

    const weeklyStandardPay = g.standardHoursPerWeek * g.baseRate;
    const weeklyOvertimeCost = tierBreakdowns.reduce((s, t) => s + t.grossCost, 0);
    const weeklyTotalPay = weeklyStandardPay + weeklyOvertimeCost;
    const weeklyOvertimePremium = tierBreakdowns.reduce((s, t) => s + t.premium, 0);
    const totalOvertimeHoursPerWeek = tierBreakdowns.reduce((s, t) => s + t.hours, 0);
    const totalHoursPerWeek = g.standardHoursPerWeek + totalOvertimeHoursPerWeek;
    const effectiveHourlyRate = totalHoursPerWeek > 0 ? weeklyTotalPay / totalHoursPerWeek : g.baseRate;
    const overtimeAsPercentOfTotal = weeklyTotalPay > 0 ? (weeklyOvertimeCost / weeklyTotalPay) * 100 : 0;

    // Scale
    const totalLabourCost = weeklyTotalPay * g.operativeCount * weeks;
    const totalOvertimePremium = weeklyOvertimePremium * g.operativeCount * weeks;
    const totalOvertimeCost = weeklyOvertimeCost * g.operativeCount * weeks;
    const totalStandardCost = weeklyStandardPay * g.operativeCount * weeks;

    // On-costs
    const onCostRate = onCosts.enabled
      ? (onCosts.nicPercent + onCosts.pensionPercent + onCosts.citbLevyPercent) / 100
      : 0;
    const totalOnCost = totalLabourCost * onCostRate;
    const grandTotal = totalLabourCost + totalOnCost;

    // Weekly breakdown for charts
    const weeklyBreakdown: WeekRow[] = [];
    let cumTotal = 0;
    let cumBase = 0;
    for (let w = 1; w <= weeks; w++) {
      const wStd = weeklyStandardPay * g.operativeCount;
      const wOT = weeklyOvertimeCost * g.operativeCount;
      cumTotal += wStd + wOT;
      cumBase += (g.standardHoursPerWeek + totalOvertimeHoursPerWeek) * g.baseRate * g.operativeCount;
      weeklyBreakdown.push({
        week: w,
        standardCost: wStd,
        overtimeCost: wOT,
        totalCost: wStd + wOT,
        cumulativeTotal: cumTotal,
        cumulativeBaseOnly: cumBase,
      });
    }

    // Hire-vs-overtime comparison
    // Model: if you hire +1 person, total work hours are redistributed across N+1 people
    // Total team hours needed per week = totalHoursPerWeek * operativeCount
    const totalTeamHoursNeeded = totalHoursPerWeek * g.operativeCount;
    const hrsPerPersonIfHire = totalTeamHoursNeeded / (g.operativeCount + 1);
    const remainingOTPerPerson = Math.max(0, hrsPerPersonIfHire - g.standardHoursPerWeek);
    // Use weighted average multiplier for remaining OT hours
    const avgMultiplier = totalOvertimeHoursPerWeek > 0
      ? weeklyOvertimeCost / (totalOvertimeHoursPerWeek * g.baseRate)
      : 1.5;
    const scenarioAWeekly = weeklyTotalPay * g.operativeCount;
    let scenarioBWeekly: number;
    if (remainingOTPerPerson <= 0) {
      // No OT needed — everyone works only the hours needed at base rate
      scenarioBWeekly = hrsPerPersonIfHire * g.baseRate * (g.operativeCount + 1);
    } else {
      // Still some OT even with +1 person
      scenarioBWeekly = (g.standardHoursPerWeek * g.baseRate + remainingOTPerPerson * g.baseRate * avgMultiplier) * (g.operativeCount + 1);
    }
    let hireBreakeven: number | null = null;
    if (scenarioBWeekly < scenarioAWeekly) {
      hireBreakeven = 1; // immediately cheaper to hire
    } else {
      hireBreakeven = null; // overtime is cheaper than hiring
    }

    // Annual
    const annualCost = weeklyTotalPay * g.operativeCount * 52;
    const annualPremium = weeklyOvertimePremium * g.operativeCount * 52;

    return {
      groupId: g.id,
      groupLabel: g.label,
      baseRate: g.baseRate,
      standardHoursPerWeek: g.standardHoursPerWeek,
      operativeCount: g.operativeCount,
      weeklyStandardPay,
      weeklyOvertimeCost,
      weeklyTotalPay,
      weeklyOvertimePremium,
      totalOvertimeHoursPerWeek,
      totalHoursPerWeek,
      effectiveHourlyRate,
      overtimeAsPercentOfTotal,
      tiers: tierBreakdowns,
      totalLabourCost,
      totalOvertimePremium,
      totalOvertimeCost,
      totalStandardCost,
      totalOnCost,
      grandTotal,
      hireBreakevenWeeks: hireBreakeven,
      weeklyHireSaving: scenarioAWeekly - scenarioBWeekly,
      weeklyBreakdown,
      annualCost,
      annualPremium,
    };
  });

  // Aggregated
  const totalLabourCost = groupResults.reduce((s, g) => s + g.totalLabourCost, 0);
  const totalOvertimePremium = groupResults.reduce((s, g) => s + g.totalOvertimePremium, 0);
  const totalOnCost = groupResults.reduce((s, g) => s + g.totalOnCost, 0);
  const grandTotal = totalLabourCost + totalOnCost;
  const totalHours = groupResults.reduce((s, g) => s + g.totalHoursPerWeek * g.operativeCount * weeks, 0);
  const overallEffectiveRate = totalHours > 0 ? totalLabourCost / totalHours : 0;
  const overallOvertimePercent = totalLabourCost > 0
    ? (groupResults.reduce((s, g) => s + g.totalOvertimeCost, 0) / totalLabourCost) * 100
    : 0;
  const totalOperatives = groupResults.reduce((s, g) => s + g.operativeCount, 0);
  const annualCost = groupResults.reduce((s, g) => s + g.annualCost, 0);
  const annualPremium = groupResults.reduce((s, g) => s + g.annualPremium, 0);

  // Pie data
  const pieData: { label: string; value: number; colour: string }[] = [
    { label: "Standard Pay", value: groupResults.reduce((s, g) => s + g.totalStandardCost, 0), colour: "#3B82F6" },
  ];
  // Aggregate tiers across all groups
  const tierTotals = new Map<string, number>();
  groupResults.forEach((g) => {
    g.tiers.forEach((t) => {
      const key = t.label;
      tierTotals.set(key, (tierTotals.get(key) || 0) + t.grossCost * g.operativeCount * weeks);
    });
  });
  let ci = 0;
  tierTotals.forEach((val, key) => {
    pieData.push({ label: key, value: val, colour: TIER_COLOURS[ci % TIER_COLOURS.length] });
    ci++;
  });
  if (totalOnCost > 0) {
    pieData.push({ label: "Employer On-Costs", value: totalOnCost, colour: "#6B7280" });
  }

  // Hire breakeven (aggregated)
  const totalWeeklyWithOT = groupResults.reduce((s, g) => s + g.weeklyTotalPay * g.operativeCount, 0);
  const totalWeeklyHire = groupResults.reduce((s, g) => {
    const teamHrs = g.totalHoursPerWeek * g.operativeCount;
    const hrsEach = teamHrs / (g.operativeCount + 1);
    const remOT = Math.max(0, hrsEach - g.standardHoursPerWeek);
    const avgMult = g.totalOvertimeHoursPerWeek > 0
      ? g.weeklyOvertimeCost / (g.totalOvertimeHoursPerWeek * g.baseRate)
      : 1.5;
    if (remOT <= 0) return s + hrsEach * g.baseRate * (g.operativeCount + 1);
    return s + (g.standardHoursPerWeek * g.baseRate + remOT * g.baseRate * avgMult) * (g.operativeCount + 1);
  }, 0);
  const totalHireBreakevenWeeks = totalWeeklyHire < totalWeeklyWithOT ? 1 : null;

  return {
    groups: groupResults,
    totalLabourCost,
    totalOvertimePremium,
    totalOnCost,
    grandTotal,
    overallEffectiveRate,
    overallOvertimePercent,
    annualCost,
    annualPremium,
    totalOperatives,
    totalWeeks: weeks,
    pieData,
    totalHireBreakevenWeeks,
  };
}

// ─── Regulation References ───────────────────────────────────
export const REGULATIONS = [
  { ref: "Working Time Regulations 1998", detail: "Maximum 48-hour average working week (opt-out available). Night workers max 8 hours average. 11 consecutive hours rest per 24-hour period. 24 hours uninterrupted rest per 7-day period (or 48 hours per 14 days)." },
  { ref: "HMRC Employer NIC", detail: "Employer National Insurance Contributions at 13.8% on earnings above the secondary threshold (currently £175/week). Applies to all overtime payments." },
  { ref: "Auto-Enrolment Pensions", detail: "Employer minimum contribution of 3% of qualifying earnings (currently £6,240 to £50,270 per year). Overtime pay counts as qualifying earnings." },
  { ref: "CITB Levy", detail: "Construction Industry Training Board levy of 0.35% of gross wages for employers with PAYE wage bills over £120,000." },
  { ref: "CIJC Working Rule Agreement", detail: "Standard working week of 39 hours (Mon-Fri). Overtime rates: time-and-a-half for weekday overtime and Saturdays, double time for Sundays and bank holidays." },
  { ref: "NAECI Agreement", detail: "National Agreement for the Engineering Construction Industry. Standard 45-hour week. Enhanced overtime rates apply." },
  { ref: "CDM 2015 Reg 4(5)", detail: "Duty to ensure sufficient time and resources are allocated. Excessive overtime can indicate insufficient resources and is a leading indicator of fatigue-related incidents." },
  { ref: "HSE Fatigue Guidance (HSG256)", detail: "Excessive hours increase accident risk. Risk doubles at 12+ hours/day. Consider fatigue risk assessment if regular overtime exceeds 48 hours/week." },
];
