// src/data/fatigue-risk-calculator.ts
// Fatigue Risk Calculator — HSE RR446 model, WTR compliance, preset patterns

// ─── Types ──────────────────────────────────────────────────────
export type PatternMode = "weekly" | "rotation";
export type FatigueLevel = "acceptable" | "elevated" | "high" | "very-high";

export interface ShiftEntry {
  id: string;
  dayLabel: string;
  dayIndex: number; // 0-based day in pattern
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM" (next day if end < start)
  breakMinutes: number;
  isRestDay: boolean;
}

export interface ShiftAnalysis {
  dayIndex: number;
  dayLabel: string;
  shiftLength: number; // hours
  isNight: boolean;
  circadianFactor: number;
  consecutiveDays: number;
  restBeforeHours: number;
  quickReturn: boolean;
  sleepOpportunity: number;
  sleepDebt: number; // cumulative
  fatigueIndex: number;
  riskMultiplier: number;
  level: FatigueLevel;
}

export interface WTRCheck {
  rule: string;
  requirement: string;
  actual: string;
  compliant: boolean;
  reference: string;
}

export interface FatigueResult {
  shifts: ShiftAnalysis[];
  worstShift: ShiftAnalysis | null;
  averageFatigue: number;
  maxFatigue: number;
  peakSleepDebt: number;
  totalWorkingHours: number;
  wtrChecks: WTRCheck[];
  wtrCompliant: boolean;
  recommendations: string[];
}

export interface PresetPattern {
  id: string;
  name: string;
  description: string;
  mode: PatternMode;
  shifts: Omit<ShiftEntry, "id">[];
}

// ─── Fatigue Level Styling ───────────────────────────────────
export const FATIGUE_LEVELS: { level: FatigueLevel; label: string; min: number; max: number; colour: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }[] = [
  { level: "acceptable", label: "Acceptable", min: 0, max: 35, colour: "#22C55E", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
  { level: "elevated", label: "Elevated", min: 36, max: 55, colour: "#EAB308", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" },
  { level: "high", label: "High", min: 56, max: 75, colour: "#F97316", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
  { level: "very-high", label: "Very High", min: 76, max: 100, colour: "#EF4444", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
];

export function getFatigueLevel(index: number): FatigueLevel {
  if (index <= 35) return "acceptable";
  if (index <= 55) return "elevated";
  if (index <= 75) return "high";
  return "very-high";
}

export function getFatigueLevelDef(level: FatigueLevel) {
  return FATIGUE_LEVELS.find(l => l.level === level)!;
}

// ─── Day Labels ──────────────────────────────────────────────
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function dayLabel(mode: PatternMode, dayIndex: number): string {
  if (mode === "weekly") return WEEKDAYS[dayIndex % 7];
  return `Day ${dayIndex + 1}`;
}

// ─── Time Helpers ────────────────────────────────────────────
export function timeToHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

export function shiftDuration(start: string, end: string): number {
  let s = timeToHours(start);
  let e = timeToHours(end);
  if (e <= s) e += 24; // crosses midnight
  return e - s;
}

// Calculates hours of overlap between a shift and the statutory night period
// (23:00-06:00). Shift may cross midnight (end < start).
export function nightPeriodOverlap(start: string, end: string): number {
  const s = timeToHours(start);
  let e = timeToHours(end);
  if (e <= s) e += 24; // crosses midnight

  // Night period is 23:00-06:00 (i.e. 23-30 on the extended timeline).
  // Compute overlap across two wrapped windows: [23,30] and also [-1,6] for
  // early-morning-only shifts (e.g. 04:00-08:00) where s is 4, e is 8.
  const windows: [number, number][] = [
    [23, 30], // today's night into tomorrow morning
    [-1, 6],  // yesterday's night tail into today's early morning (s ≈ 4, e ≈ 8)
  ];

  let overlap = 0;
  for (const [ws, we] of windows) {
    overlap = Math.max(overlap, Math.max(0, Math.min(e, we) - Math.max(s, ws)));
  }
  return overlap;
}

// WTR 1998 Reg 2: a night worker is someone who normally works ≥3 hours during
// the night period (23:00-06:00) as a normal course. Used for both the
// circadian factor and the WTR night-work check.
export function isNightShift(start: string, end: string): boolean {
  return nightPeriodOverlap(start, end) >= 3;
}

// ─── Circadian Factor ────────────────────────────────────────
// Informed by shift-work research (HSE RR446 etc). Risk peaks at 02:00-06:00
// (circadian low); elevated for early starts that curtail sleep.
function circadianFactor(start: string, end: string): number {
  const s = timeToHours(start);
  // Qualifying night shift per WTR Reg 2 (≥3h overlap with 23:00-06:00)
  if (isNightShift(start, end)) {
    // Deep night (start 22:00-02:00) = worst, spans circadian nadir
    if (s >= 22 || s <= 2) return 1.8;
    // Late night
    return 1.5;
  }
  // Early morning start (before 06:00) — short sleep, pre-dawn start
  if (s < 6) return 1.4;
  // Early start (06:00-07:00) — curtails sleep
  if (s < 7) return 1.15;
  // Standard day shift
  return 1.0;
}

// ─── Shift Length Factor (HSE RR446) ─────────────────────────
// Risk increases progressively above 8h, sharply above 12h
function shiftLengthFactor(hours: number): number {
  if (hours <= 8) return 1.0;
  if (hours <= 10) return 1.0 + (hours - 8) * 0.1; // 1.0-1.2
  if (hours <= 12) return 1.2 + (hours - 10) * 0.2; // 1.2-1.6
  return 1.6 + (hours - 12) * 0.4; // Sharp increase above 12h
}

// ─── Consecutive Days Factor ─────────────────────────────────
// Fatigue compounds with each consecutive day, especially >5 days
function consecutiveFactor(days: number): number {
  if (days <= 3) return 1.0;
  if (days <= 5) return 1.0 + (days - 3) * 0.1; // 1.0-1.2
  if (days <= 7) return 1.2 + (days - 5) * 0.15; // 1.2-1.5
  return 1.5 + (days - 7) * 0.2; // Steep above 7
}

// ─── Sleep Opportunity Model ─────────────────────────────────
// Estimates hours of sleep possible given shift times and commute
function estimateSleepOpportunity(
  shiftEnd: string, nextShiftStart: string | null, commuteMinutes: number, isNight: boolean
): number {
  if (!nextShiftStart) return 8; // Rest day after — assume full sleep

  const endH = timeToHours(shiftEnd);
  let startH = timeToHours(nextShiftStart);

  // Time between shifts
  let gap = startH - endH;
  if (gap <= 0) gap += 24;

  // Subtract commute both ways + wind-down (1h) + wake-up (0.5h)
  const commuteH = (commuteMinutes * 2) / 60;
  const available = gap - commuteH - 1.5;

  // Night workers typically get less than the available window
  const sleepEfficiency = isNight ? 0.75 : 0.9;
  return Math.max(0, Math.min(9, available * sleepEfficiency));
}

// ─── Preset Patterns ─────────────────────────────────────────
function makeId() { return Math.random().toString(36).slice(2, 8); }

export const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: "standard-5day", name: "Standard 5-Day (Mon-Fri 07:00-17:00)", description: "Typical construction site hours",
    mode: "weekly",
    shifts: [
      { dayLabel: "Monday", dayIndex: 0, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Tuesday", dayIndex: 1, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Wednesday", dayIndex: 2, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Thursday", dayIndex: 3, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Friday", dayIndex: 4, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Saturday", dayIndex: 5, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Sunday", dayIndex: 6, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
    ],
  },
  {
    id: "6day-overtime", name: "6-Day with Saturday OT (07:00-17:00 + Sat 07:00-13:00)", description: "Common construction overtime pattern",
    mode: "weekly",
    shifts: [
      { dayLabel: "Monday", dayIndex: 0, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Tuesday", dayIndex: 1, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Wednesday", dayIndex: 2, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Thursday", dayIndex: 3, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Friday", dayIndex: 4, startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Saturday", dayIndex: 5, startTime: "07:00", endTime: "13:00", breakMinutes: 0, isRestDay: false },
      { dayLabel: "Sunday", dayIndex: 6, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
    ],
  },
  {
    id: "4on4off-nights", name: "4 on 4 off Nights (19:00-07:00)", description: "Common WwTW / process plant night pattern",
    mode: "rotation",
    shifts: [
      { dayLabel: "Day 1", dayIndex: 0, startTime: "19:00", endTime: "07:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 2", dayIndex: 1, startTime: "19:00", endTime: "07:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 3", dayIndex: 2, startTime: "19:00", endTime: "07:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 4", dayIndex: 3, startTime: "19:00", endTime: "07:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 5", dayIndex: 4, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 6", dayIndex: 5, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 7", dayIndex: 6, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 8", dayIndex: 7, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
    ],
  },
  {
    id: "continental-12h", name: "Continental 12h (2D 2N 4off)", description: "2 days, 2 nights, 4 rest days",
    mode: "rotation",
    shifts: [
      { dayLabel: "Day 1", dayIndex: 0, startTime: "06:00", endTime: "18:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 2", dayIndex: 1, startTime: "06:00", endTime: "18:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 3", dayIndex: 2, startTime: "18:00", endTime: "06:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 4", dayIndex: 3, startTime: "18:00", endTime: "06:00", breakMinutes: 60, isRestDay: false },
      { dayLabel: "Day 5", dayIndex: 4, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 6", dayIndex: 5, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 7", dayIndex: 6, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
      { dayLabel: "Day 8", dayIndex: 7, startTime: "00:00", endTime: "00:00", breakMinutes: 0, isRestDay: true },
    ],
  },
  {
    id: "7day-shutdown", name: "7-Day Shutdown (12h days, no rest)", description: "Intensive shutdown / outage pattern",
    mode: "weekly",
    shifts: WEEKDAYS.map((d, i) => ({ dayLabel: d, dayIndex: i, startTime: "06:00", endTime: "18:00", breakMinutes: 60, isRestDay: false })),
  },
];

// ─── Full Fatigue Assessment ─────────────────────────────────
export function calculateFatigue(
  shifts: ShiftEntry[],
  commuteMinutes: number,
  mode: PatternMode,
): FatigueResult {
  const analyses: ShiftAnalysis[] = [];
  let cumulativeSleepDebt = 0;
  let consecutiveWorking = 0;

  for (let i = 0; i < shifts.length; i++) {
    const s = shifts[i];

    if (s.isRestDay) {
      // Rest day recovers sleep debt
      cumulativeSleepDebt = Math.max(0, cumulativeSleepDebt - 4); // Recover ~4h per rest day
      consecutiveWorking = 0;
      analyses.push({
        dayIndex: s.dayIndex, dayLabel: s.dayLabel,
        shiftLength: 0, isNight: false, circadianFactor: 1.0,
        consecutiveDays: 0, restBeforeHours: 24, quickReturn: false,
        sleepOpportunity: 8, sleepDebt: cumulativeSleepDebt,
        fatigueIndex: Math.max(0, cumulativeSleepDebt * 3), // Low baseline from residual debt
        riskMultiplier: 1.0, level: "acceptable",
      });
      continue;
    }

    consecutiveWorking++;
    const dur = shiftDuration(s.startTime, s.endTime) - s.breakMinutes / 60;
    const night = isNightShift(s.startTime, s.endTime);
    const cf = circadianFactor(s.startTime, s.endTime);
    const slf = shiftLengthFactor(dur);
    const consF = consecutiveFactor(consecutiveWorking);

    // Rest before this shift
    let restBefore = 24;
    if (i > 0 && !shifts[i - 1].isRestDay) {
      const prevEnd = timeToHours(shifts[i - 1].endTime);
      let thisStart = timeToHours(s.startTime);
      let gap = thisStart - prevEnd;
      if (gap <= 0) gap += 24;
      restBefore = gap;
    }
    const quickReturn = restBefore < 11;
    const quickReturnFactor = quickReturn ? 1.2 : 1.0;

    // Sleep
    const nextShift = i + 1 < shifts.length && !shifts[i + 1].isRestDay ? shifts[i + 1].startTime : null;
    const sleepOpp = estimateSleepOpportunity(s.endTime, nextShift, commuteMinutes, night);
    const sleepDeficit = Math.max(0, 7.5 - sleepOpp); // 7.5h is target
    cumulativeSleepDebt += sleepDeficit;

    // Fatigue index (0-100 scale)
    const rawIndex = (cf * slf * consF * quickReturnFactor - 1) * 40 + cumulativeSleepDebt * 5;
    const fatigueIndex = Math.min(100, Math.max(0, Math.round(rawIndex)));

    // Risk multiplier (relative to baseline day shift)
    const riskMultiplier = Math.round(cf * slf * consF * quickReturnFactor * 10) / 10;

    const level = getFatigueLevel(fatigueIndex);

    analyses.push({
      dayIndex: s.dayIndex, dayLabel: s.dayLabel,
      shiftLength: Math.round(dur * 10) / 10, isNight: night, circadianFactor: cf,
      consecutiveDays: consecutiveWorking, restBeforeHours: Math.round(restBefore * 10) / 10,
      quickReturn, sleepOpportunity: Math.round(sleepOpp * 10) / 10,
      sleepDebt: Math.round(cumulativeSleepDebt * 10) / 10,
      fatigueIndex, riskMultiplier, level,
    });
  }

  const workingShifts = analyses.filter(a => a.shiftLength > 0);
  const worstShift = workingShifts.length > 0
    ? workingShifts.reduce((a, b) => b.fatigueIndex > a.fatigueIndex ? b : a)
    : null;
  const averageFatigue = workingShifts.length > 0
    ? Math.round(workingShifts.reduce((sum, a) => sum + a.fatigueIndex, 0) / workingShifts.length)
    : 0;
  const maxFatigue = worstShift?.fatigueIndex ?? 0;
  const peakSleepDebt = Math.max(...analyses.map(a => a.sleepDebt), 0);
  const totalWorkingHours = Math.round(workingShifts.reduce((sum, a) => sum + a.shiftLength, 0) * 10) / 10;

  // WTR checks
  const wtrChecks = checkWTR(shifts, analyses, mode);
  const wtrCompliant = wtrChecks.every(c => c.compliant);

  const recommendations = generateRecommendations(analyses, wtrChecks, maxFatigue, peakSleepDebt);

  return { shifts: analyses, worstShift, averageFatigue, maxFatigue, peakSleepDebt, totalWorkingHours, wtrChecks, wtrCompliant, recommendations };
}

// ─── Working Time Regulations Checks ─────────────────────────
function checkWTR(shifts: ShiftEntry[], analyses: ShiftAnalysis[], mode: PatternMode): WTRCheck[] {
  const checks: WTRCheck[] = [];
  const workingAnalyses = analyses.filter(a => a.shiftLength > 0);

  // 1. Daily rest: minimum 11 consecutive hours in each 24h period
  const minDailyRest = workingAnalyses.length > 0
    ? Math.min(...workingAnalyses.map(a => a.restBeforeHours))
    : 24;
  checks.push({
    rule: "Daily Rest Period",
    requirement: "Minimum 11 consecutive hours in each 24-hour period",
    actual: `${minDailyRest.toFixed(1)} hours (minimum observed)`,
    compliant: minDailyRest >= 11,
    reference: "WTR 1998 Reg 10",
  });

  // 2. Weekly rest: minimum 24 consecutive hours in each 7-day period
  // Check if there's at least one rest day per 7 consecutive days
  let hasWeeklyRest = false;
  const len = shifts.length;
  if (len <= 7) {
    hasWeeklyRest = shifts.some(s => s.isRestDay);
  } else {
    // Check each 7-day window
    hasWeeklyRest = true;
    for (let start = 0; start <= len - 7; start++) {
      const window = shifts.slice(start, start + 7);
      if (!window.some(s => s.isRestDay)) { hasWeeklyRest = false; break; }
    }
  }
  checks.push({
    rule: "Weekly Rest Period",
    requirement: "Minimum 24 consecutive hours uninterrupted rest per 7-day period",
    actual: hasWeeklyRest ? "Rest day present in each 7-day window" : "No rest day found in a 7-day window",
    compliant: hasWeeklyRest,
    reference: "WTR 1998 Reg 11",
  });

  // 3. Maximum weekly working hours: 48-hour average (over 17-week reference)
  const daysInPattern = shifts.length;
  const weeklyAvg = daysInPattern > 0
    ? (workingAnalyses.reduce((s, a) => s + a.shiftLength, 0) / daysInPattern) * 7
    : 0;
  checks.push({
    rule: "Maximum Weekly Hours",
    requirement: "48-hour average weekly limit (17-week reference period)",
    actual: `${weeklyAvg.toFixed(1)} hours/week (pattern average)`,
    compliant: weeklyAvg <= 48,
    reference: "WTR 1998 Reg 4",
  });

  // 4. Night work: per-shift length (stricter than WTR's 17-week average)
  const nightShifts = workingAnalyses.filter(a => a.isNight);
  const maxNightLength = nightShifts.length > 0 ? Math.max(...nightShifts.map(a => a.shiftLength)) : 0;
  if (nightShifts.length > 0) {
    checks.push({
      rule: "Night Work Limit",
      requirement: "Night workers: normal hours should not exceed 8 hours per 24-hour period (WTR: 17-week average; this check applies 8h to each night shift)",
      actual: `${maxNightLength.toFixed(1)} hours (longest night shift)`,
      compliant: maxNightLength <= 8,
      reference: "WTR 1998 Reg 6",
    });
  }

  return checks;
}

// ─── Recommendations ─────────────────────────────────────────
function generateRecommendations(analyses: ShiftAnalysis[], wtrChecks: WTRCheck[], maxFatigue: number, peakDebt: number): string[] {
  const recs: string[] = [];

  if (maxFatigue <= 35) {
    recs.push("Fatigue risk is within acceptable limits for this shift pattern");
    recs.push("Maintain standard welfare and rest provisions");
  }

  if (maxFatigue > 35 && maxFatigue <= 55) {
    recs.push("Elevated fatigue risk detected -- ensure adequate rest facilities and break compliance");
    recs.push("Monitor operatives for signs of fatigue (loss of concentration, slower reaction times)");
    recs.push("Avoid safety-critical tasks during the highest-risk shift");
  }

  if (maxFatigue > 55) {
    recs.push("HIGH FATIGUE RISK -- review shift pattern and consider reducing consecutive working days or shift length");
    recs.push("Implement fatigue management briefings at shift handover");
    recs.push("Restrict safety-critical and driving tasks for operatives on the highest-fatigue shifts");
    recs.push("Provide quiet rest area for power naps during breaks (20 minutes max)");
  }

  if (peakDebt > 10) {
    recs.push(`Cumulative sleep debt reaches ${peakDebt.toFixed(1)} hours -- consider adding a rest day to the pattern`);
  }

  const quickReturns = analyses.filter(a => a.quickReturn);
  if (quickReturns.length > 0) {
    recs.push(`${quickReturns.length} quick return(s) detected (less than 11 hours between shifts) -- these severely limit sleep opportunity`);
  }

  const nonCompliant = wtrChecks.filter(c => !c.compliant);
  if (nonCompliant.length > 0) {
    recs.push("WARNING: Working Time Regulations non-compliance detected -- see WTR checks below");
    nonCompliant.forEach(nc => {
      recs.push(`WTR breach: ${nc.rule} -- ${nc.requirement} (${nc.reference})`);
    });
  }

  return recs;
}

// ─── Create blank pattern ────────────────────────────────────
export function createBlankWeek(): ShiftEntry[] {
  return WEEKDAYS.map((d, i) => ({
    id: makeId(), dayLabel: d, dayIndex: i,
    startTime: i < 5 ? "07:00" : "00:00",
    endTime: i < 5 ? "17:00" : "00:00",
    breakMinutes: i < 5 ? 60 : 0,
    isRestDay: i >= 5,
  }));
}

export function createBlankRotation(days: number): ShiftEntry[] {
  return Array.from({ length: days }, (_, i) => ({
    id: makeId(), dayLabel: `Day ${i + 1}`, dayIndex: i,
    startTime: "07:00", endTime: "17:00", breakMinutes: 60, isRestDay: false,
  }));
}

export function applyPreset(preset: PresetPattern): ShiftEntry[] {
  return preset.shifts.map(s => ({ ...s, id: makeId() }));
}
