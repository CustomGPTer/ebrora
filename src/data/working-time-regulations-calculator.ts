// src/data/working-time-regulations-calculator.ts
// Working Time Regulations 1998 Calculator — WTR compliance, night worker detection, breaks, annual leave

// ─── Types ──────────────────────────────────────────────────────
export type WorkerAge = "adult" | "young";
export type ReferencePeriod = 17 | 26 | 52;
export type RAGStatus = "green" | "amber" | "red";
export type AnnualLeaveMode = "simple" | "pro-rata";

export interface ShiftEntry {
  id: string;
  day: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  breakMinutes: number;
  enabled: boolean;
}

export interface WeeklyRecord {
  weekNumber: number;
  totalHours: number;
}

export interface ComplianceCheck {
  id: string;
  requirement: string;
  regulation: string;
  limit: string;
  actual: string;
  status: RAGStatus;
  breach: boolean;
  correctiveAction: string;
  notes: string;
}

export interface AnnualLeaveResult {
  statutoryEntitlementWeeks: number;
  statutoryEntitlementDays: number;
  actualDaysTaken: number;
  proRataEntitlement: number | null;
  compliant: boolean;
  shortfall: number;
}

export interface NightWorkerAssessment {
  isNightWorker: boolean;
  nightHoursPerShift: number;
  longestNightShift: number;
  specialHazard: boolean;
  maxAllowed: number;
  compliant: boolean;
}

export interface WTRResult {
  workerAge: WorkerAge;
  referencePeriod: ReferencePeriod;
  averageWeeklyHours: number;
  maxWeeklyHoursInPeriod: number;
  longestShiftHours: number;
  longestContinuousWork: number;
  nightWorker: NightWorkerAssessment;
  annualLeave: AnnualLeaveResult;
  optOutSigned: boolean;
  complianceChecks: ComplianceCheck[];
  breachCount: number;
  overallStatus: RAGStatus;
  weeklyRecords: WeeklyRecord[];
  recommendations: string[];
  crossRefs: string[];
}

// ─── Constants ──────────────────────────────────────────────────
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const DEFAULT_SHIFTS: ShiftEntry[] = DAYS_OF_WEEK.map((day, i) => ({
  id: `shift-${i}`,
  day,
  startTime: i < 5 ? "07:00" : "",
  endTime: i < 5 ? "17:00" : "",
  breakMinutes: i < 5 ? 60 : 0,
  enabled: i < 5,
}));

export const NIGHT_PERIOD_START = 23; // 23:00
export const NIGHT_PERIOD_END = 6;    // 06:00
export const YOUNG_NIGHT_START_A = 22; // Option A: 22:00-06:00
export const YOUNG_NIGHT_END_A = 6;
export const YOUNG_NIGHT_START_B = 23; // Option B: 23:00-07:00
export const YOUNG_NIGHT_END_B = 7;

// ─── Time Helpers ───────────────────────────────────────────────
export function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

export function shiftDurationHours(start: string, end: string): number {
  if (!start || !end) return 0;
  let s = parseTime(start);
  let e = parseTime(end);
  if (e <= s) e += 24; // overnight shift
  return e - s;
}

export function netWorkingHours(start: string, end: string, breakMins: number): number {
  const gross = shiftDurationHours(start, end);
  return Math.max(0, gross - breakMins / 60);
}

export function nightHoursInShift(start: string, end: string): number {
  if (!start || !end) return 0;
  let s = parseTime(start);
  let e = parseTime(end);
  if (e <= s) e += 24;

  let nightHrs = 0;
  // Night period 23:00-06:00 (next day)
  // Normalise: we check overlap of [s, e) with [23, 30) (i.e. 23:00 to 06:00 next day = 23 to 30)
  const nightRanges = [
    [NIGHT_PERIOD_START, NIGHT_PERIOD_END + 24], // 23 to 30
    [NIGHT_PERIOD_START - 24, NIGHT_PERIOD_END],  // -1 to 6 (for early morning shifts)
  ];

  for (const [ns, ne] of nightRanges) {
    const overlapStart = Math.max(s, ns);
    const overlapEnd = Math.min(e, ne);
    if (overlapEnd > overlapStart) {
      nightHrs += overlapEnd - overlapStart;
    }
  }
  return Math.min(nightHrs, e - s); // Can't exceed total shift
}

export function longestContinuousWorkHours(start: string, end: string, breakMins: number): number {
  const gross = shiftDurationHours(start, end);
  if (breakMins <= 0) return gross;
  const breakHrs = breakMins / 60;
  const netWork = Math.max(0, gross - breakHrs);
  // Assume break is placed to split the working time.
  // Worst realistic case: break divides shift unevenly (60/40 split).
  // Longest continuous = ~60% of net working hours.
  // This is more conservative than midpoint but avoids the false-breach
  // of treating the entire net working time as continuous.
  return Math.round(netWork * 0.6 * 10) / 10;
}

// ─── Night Worker Detection ─────────────────────────────────────
export function assessNightWorker(
  shifts: ShiftEntry[],
  specialHazard: boolean,
  workerAge: WorkerAge,
): NightWorkerAssessment {
  const enabledShifts = shifts.filter(s => s.enabled && s.startTime && s.endTime);

  let maxNightHrs = 0;
  let longestNightShift = 0;
  let isNightWorker = false;

  for (const shift of enabledShifts) {
    const nightHrs = nightHoursInShift(shift.startTime, shift.endTime);
    const shiftTotal = shiftDurationHours(shift.startTime, shift.endTime);

    if (nightHrs >= 3) isNightWorker = true;
    if (nightHrs > maxNightHrs) maxNightHrs = nightHrs;
    if (nightHrs > 0 && shiftTotal > longestNightShift) longestNightShift = shiftTotal;
  }

  // Young workers: any night work is prohibited
  if (workerAge === "young") {
    const hasAnyNightWork = enabledShifts.some(s => nightHoursInShift(s.startTime, s.endTime) > 0);
    return {
      isNightWorker: hasAnyNightWork,
      nightHoursPerShift: maxNightHrs,
      longestNightShift,
      specialHazard,
      maxAllowed: 0,
      compliant: !hasAnyNightWork,
    };
  }

  const maxAllowed = 8; // 8 hours in any 24hr period (no opt-out)
  const compliant = longestNightShift <= maxAllowed;

  return {
    isNightWorker,
    nightHoursPerShift: maxNightHrs,
    longestNightShift,
    specialHazard,
    maxAllowed,
    compliant: specialHazard ? longestNightShift <= 8 : compliant,
  };
}

// ─── Annual Leave Calculation ────────────────────────────────────
export function calculateAnnualLeave(
  workerAge: WorkerAge,
  mode: AnnualLeaveMode,
  actualDaysTaken: number,
  yearStartDate?: string,
  currentDate?: string,
): AnnualLeaveResult {
  const statutoryWeeks = 5.6;
  const statutoryDays = 28;

  let proRataEntitlement: number | null = null;
  let comparisonDays = statutoryDays;

  if (mode === "pro-rata" && yearStartDate && currentDate) {
    const start = new Date(yearStartDate);
    const now = new Date(currentDate);
    const yearEnd = new Date(start);
    yearEnd.setFullYear(yearEnd.getFullYear() + 1);

    const totalDaysInYear = (yearEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const fraction = Math.min(1, elapsedDays / totalDaysInYear);

    proRataEntitlement = Math.round(statutoryDays * fraction * 10) / 10;
    comparisonDays = proRataEntitlement;
  }

  const shortfall = Math.max(0, Math.round((comparisonDays - actualDaysTaken) * 10) / 10);
  const compliant = actualDaysTaken >= comparisonDays;

  return {
    statutoryEntitlementWeeks: statutoryWeeks,
    statutoryEntitlementDays: statutoryDays,
    actualDaysTaken,
    proRataEntitlement,
    compliant,
    shortfall,
  };
}

// ─── Weekly Hours Simulation ─────────────────────────────────────
// Simulates weekly records from the shift pattern across the reference period
export function generateWeeklyRecords(
  shifts: ShiftEntry[],
  referencePeriod: ReferencePeriod,
  variancePercent: number = 10,
): WeeklyRecord[] {
  const enabledShifts = shifts.filter(s => s.enabled && s.startTime && s.endTime);
  const baseWeeklyHours = enabledShifts.reduce((sum, s) =>
    sum + netWorkingHours(s.startTime, s.endTime, s.breakMinutes), 0);

  const records: WeeklyRecord[] = [];
  for (let w = 1; w <= referencePeriod; w++) {
    // Simulate some variance using a deterministic pattern
    const varianceFactor = 1 + (Math.sin(w * 0.7) * variancePercent) / 100;
    const hours = Math.round(baseWeeklyHours * varianceFactor * 10) / 10;
    records.push({ weekNumber: w, totalHours: hours });
  }
  return records;
}

// ─── Break Compliance ────────────────────────────────────────────
function checkBreakCompliance(
  shifts: ShiftEntry[],
  workerAge: WorkerAge,
): { compliant: boolean; longestWithoutBreak: number; required: number } {
  const enabled = shifts.filter(s => s.enabled && s.startTime && s.endTime);

  let longestWithoutBreak = 0;
  for (const s of enabled) {
    const cont = longestContinuousWorkHours(s.startTime, s.endTime, s.breakMinutes);
    if (cont > longestWithoutBreak) longestWithoutBreak = cont;
  }

  const required = workerAge === "young" ? 4.5 : 6;
  const compliant = longestWithoutBreak <= required;

  return { compliant, longestWithoutBreak: Math.round(longestWithoutBreak * 10) / 10, required };
}

// ─── Daily Rest Compliance ───────────────────────────────────────
function checkDailyRest(
  shifts: ShiftEntry[],
  workerAge: WorkerAge,
): { compliant: boolean; shortestRest: number; required: number } {
  const enabled = shifts.filter(s => s.enabled && s.startTime && s.endTime);
  const required = workerAge === "young" ? 12 : 11;

  if (enabled.length < 2) return { compliant: true, shortestRest: 24, required };

  let shortestRest = 24;
  for (let i = 0; i < enabled.length - 1; i++) {
    const endCurrent = parseTime(enabled[i].endTime);
    let startNext = parseTime(enabled[i + 1].startTime);
    if (startNext <= endCurrent) startNext += 24;
    const rest = startNext - endCurrent;
    if (rest < shortestRest) shortestRest = rest;
  }

  return {
    compliant: shortestRest >= required,
    shortestRest: Math.round(shortestRest * 10) / 10,
    required,
  };
}

// ─── Weekly Rest Compliance ──────────────────────────────────────
function checkWeeklyRest(
  shifts: ShiftEntry[],
  workerAge: WorkerAge,
): { compliant: boolean; longestRest: number; required: number } {
  const enabled = shifts.filter(s => s.enabled && s.startTime && s.endTime);
  const required = workerAge === "young" ? 48 : 24;

  // Check for consecutive non-working days
  const dayHasShift = DAYS_OF_WEEK.map((_, i) => {
    const shift = shifts[i];
    return shift && shift.enabled && shift.startTime && shift.endTime;
  });

  // Find longest gap (consecutive off days)
  let maxRest = 0;
  let currentRest = 0;
  // Double the week to handle wrap-around
  const doubled = [...dayHasShift, ...dayHasShift];
  for (let i = 0; i < doubled.length; i++) {
    if (!doubled[i]) {
      currentRest += 24;
    } else {
      if (currentRest > maxRest) maxRest = currentRest;
      currentRest = 0;
    }
  }
  if (currentRest > maxRest) maxRest = currentRest;

  // Also check rest between last shift of week and first of next
  if (enabled.length > 0 && enabled.length < 7) {
    // At least one day off
    maxRest = Math.max(maxRest, 24); // Minimum one day
  }

  // Cap at 168 (full week)
  maxRest = Math.min(maxRest, 168);

  return {
    compliant: maxRest >= required,
    longestRest: maxRest,
    required,
  };
}

// ─── Corrective Action Generator ─────────────────────────────────
function generateCorrectiveAction(
  checkId: string,
  actual: string,
  limit: string,
  workerAge: WorkerAge,
  optOut: boolean,
): string {
  switch (checkId) {
    case "max-weekly":
      if (workerAge === "young") {
        return `Young worker exceeds 40hr/wk limit. Immediately reduce working hours to 40 or below. Under-18 workers cannot opt out. Review shift pattern and redistribute tasks across additional workers.`;
      }
      if (optOut) {
        return `Average weekly hours exceed 48hr but a valid opt-out is in place. ADVISORY: Monitor worker wellbeing and fatigue. Opt-out must be genuinely voluntary and worker can withdraw with 7 days notice (or longer if agreed, max 3 months).`;
      }
      return `Average weekly hours exceed the 48hr limit over the reference period. Options: (1) Obtain a valid individual opt-out under Reg 5 (must be voluntary, in writing, signed), (2) Reduce hours by adjusting shift pattern or redistributing workload, (3) Extend reference period to 26 or 52 weeks via workforce agreement if hours are seasonal.`;

    case "max-daily-young":
      return `Young worker exceeds 8hr/day limit. Reduce shift length immediately. Under-18 workers are limited to 8 hours per day (Reg 5A). No opt-out available.`;

    case "night-worker-hours":
      return `Night worker shift exceeds 8 hours in a 24hr period. Night worker limits cannot be opted out of. Reduce night shift length to 8 hours max. If special hazards apply, this limit is absolute with no averaging.`;

    case "night-work-young":
      return `Young workers are prohibited from night work (Reg 6A) between 22:00-06:00 or 23:00-07:00. Reassign to daytime shifts immediately. Limited exceptions exist for specific industries -- seek legal advice if applicable.`;

    case "break-compliance":
      if (workerAge === "young") {
        return `Young worker continuous work exceeds 4.5 hours without a break. Provide a minimum 30-minute uninterrupted rest break after no more than 4.5 hours of work.`;
      }
      return `Continuous work exceeds 6 hours without a rest break. Provide a minimum 20-minute uninterrupted rest break. Break should be taken away from the workstation, not at the start or end of the working day.`;

    case "daily-rest":
      if (workerAge === "young") {
        return `Young worker daily rest period is below 12 hours. Adjust shift times to provide a minimum 12 consecutive hours rest in each 24hr period.`;
      }
      return `Daily rest period is below 11 hours. Adjust shift start/end times to provide minimum 11 consecutive hours rest in each 24hr period. Consider staggering start times or reducing shift overlap.`;

    case "weekly-rest":
      if (workerAge === "young") {
        return `Young worker weekly rest is below 48 hours. Provide a minimum of 2 consecutive days off per week. Under-18 workers require 48hr uninterrupted weekly rest.`;
      }
      return `Weekly rest period is below 24 hours uninterrupted in each 7-day period. Alternatively, provide 48 hours uninterrupted rest in each 14-day period. Schedule at least one full day off per week.`;

    case "annual-leave":
      return `Statutory annual leave entitlement is not being met. All workers are entitled to 5.6 weeks (28 days) paid leave per year (pro-rata for part-time). Arrange remaining leave to be taken before year end. Employer cannot substitute payment in lieu except on termination.`;

    default:
      return "Review and correct the identified non-compliance.";
  }
}

// ─── Main Calculation ────────────────────────────────────────────
export function calculateWTRCompliance(
  workerAge: WorkerAge,
  roleType: string,
  shifts: ShiftEntry[],
  referencePeriod: ReferencePeriod,
  optOutSigned: boolean,
  specialHazard: boolean,
  annualLeaveMode: AnnualLeaveMode,
  actualLeaveDays: number,
  leaveYearStart: string,
  currentDate: string,
): WTRResult {
  const enabledShifts = shifts.filter(s => s.enabled && s.startTime && s.endTime);

  // Weekly hours from shift pattern
  const weeklyHours = enabledShifts.reduce((sum, s) =>
    sum + netWorkingHours(s.startTime, s.endTime, s.breakMinutes), 0);

  // Generate weekly records across reference period
  const weeklyRecords = generateWeeklyRecords(shifts, referencePeriod);
  const avgWeeklyHours = weeklyRecords.length > 0
    ? Math.round((weeklyRecords.reduce((s, r) => s + r.totalHours, 0) / weeklyRecords.length) * 10) / 10
    : weeklyHours;
  const maxWeekly = weeklyRecords.length > 0
    ? Math.max(...weeklyRecords.map(r => r.totalHours))
    : weeklyHours;

  // Longest shift
  const longestShift = enabledShifts.reduce((max, s) => {
    const dur = shiftDurationHours(s.startTime, s.endTime);
    return dur > max ? dur : max;
  }, 0);

  // Longest continuous work without break
  const breakCheck = checkBreakCompliance(shifts, workerAge);
  const dailyRest = checkDailyRest(shifts, workerAge);
  const weeklyRest = checkWeeklyRest(shifts, workerAge);
  const nightWorker = assessNightWorker(shifts, specialHazard, workerAge);
  const annualLeave = calculateAnnualLeave(workerAge, annualLeaveMode, actualLeaveDays, leaveYearStart, currentDate);

  // ── Build compliance checks
  const checks: ComplianceCheck[] = [];

  // 1. Maximum weekly hours
  const weeklyLimit = workerAge === "young" ? 40 : 48;
  const weeklyExceeded = avgWeeklyHours > weeklyLimit;
  const weeklyOptedOut = workerAge === "adult" && optOutSigned && weeklyExceeded;

  checks.push({
    id: "max-weekly",
    requirement: workerAge === "young"
      ? "Maximum weekly working time (young worker)"
      : "Maximum average weekly working time",
    regulation: workerAge === "young" ? "Reg 5A WTR 1998" : "Reg 4(1) WTR 1998",
    limit: workerAge === "young"
      ? "40 hours per week"
      : `48 hours averaged over ${referencePeriod}-week reference period`,
    actual: `${avgWeeklyHours} hours/week average`,
    status: weeklyOptedOut ? "amber" : weeklyExceeded ? "red" : "green",
    breach: workerAge === "young" ? weeklyExceeded : (weeklyExceeded && !optOutSigned),
    correctiveAction: weeklyExceeded
      ? generateCorrectiveAction("max-weekly", `${avgWeeklyHours}`, `${weeklyLimit}`, workerAge, optOutSigned)
      : "",
    notes: weeklyOptedOut
      ? "Opt-out in place -- hours exceed 48hr but worker has signed a valid opt-out agreement. Monitor wellbeing."
      : "",
  });

  // 2. Maximum daily hours (young workers only)
  if (workerAge === "young") {
    const dailyExceeded = longestShift > 8;
    checks.push({
      id: "max-daily-young",
      requirement: "Maximum daily working time (young worker)",
      regulation: "Reg 5A WTR 1998",
      limit: "8 hours per day",
      actual: `${Math.round(longestShift * 10) / 10} hours longest shift`,
      status: dailyExceeded ? "red" : "green",
      breach: dailyExceeded,
      correctiveAction: dailyExceeded
        ? generateCorrectiveAction("max-daily-young", `${longestShift}`, "8", workerAge, false)
        : "",
      notes: "",
    });
  }

  // 3. Night worker limits
  if (nightWorker.isNightWorker) {
    if (workerAge === "young") {
      checks.push({
        id: "night-work-young",
        requirement: "Night work prohibition (young worker)",
        regulation: "Reg 6A WTR 1998",
        limit: "No night work permitted (22:00-06:00 or 23:00-07:00)",
        actual: `${Math.round(nightWorker.nightHoursPerShift * 10) / 10} hours in night period`,
        status: "red",
        breach: true,
        correctiveAction: generateCorrectiveAction("night-work-young", "", "", workerAge, false),
        notes: "",
      });
    } else {
      const nightBreached = nightWorker.longestNightShift > 8;
      checks.push({
        id: "night-worker-hours",
        requirement: specialHazard
          ? "Night worker limit -- special hazards (absolute)"
          : "Night worker average limit",
        regulation: specialHazard ? "Reg 6(7) WTR 1998" : "Reg 6(1) WTR 1998",
        limit: "8 hours in any 24-hour period",
        actual: `${Math.round(nightWorker.longestNightShift * 10) / 10} hours longest night shift`,
        status: nightBreached ? "red" : "green",
        breach: nightBreached,
        correctiveAction: nightBreached
          ? generateCorrectiveAction("night-worker-hours", `${nightWorker.longestNightShift}`, "8", workerAge, false)
          : "",
        notes: specialHazard
          ? "Special hazard work -- 8hr limit is absolute, no averaging permitted (Reg 6(7))"
          : "Night worker limit -- cannot be opted out of",
      });
    }
  }

  // 4. Rest breaks
  const breakThreshold = workerAge === "young" ? 4.5 : 6;
  checks.push({
    id: "break-compliance",
    requirement: workerAge === "young"
      ? "Rest break (young worker: 30 min per 4.5 hours)"
      : "Rest break (20 min per 6 hours)",
    regulation: workerAge === "young" ? "Reg 12(4) WTR 1998" : "Reg 12(1) WTR 1998",
    limit: workerAge === "young"
      ? "30 min uninterrupted break after 4.5 hours work"
      : "20 min uninterrupted break when working 6+ hours",
    actual: `Longest continuous work: ${breakCheck.longestWithoutBreak} hours`,
    status: breakCheck.compliant ? "green" : "red",
    breach: !breakCheck.compliant,
    correctiveAction: !breakCheck.compliant
      ? generateCorrectiveAction("break-compliance", `${breakCheck.longestWithoutBreak}`, `${breakThreshold}`, workerAge, false)
      : "",
    notes: "",
  });

  // 5. Daily rest
  checks.push({
    id: "daily-rest",
    requirement: workerAge === "young"
      ? "Daily rest period (young worker: 12 hours)"
      : "Daily rest period (11 hours)",
    regulation: workerAge === "young" ? "Reg 10(2) WTR 1998" : "Reg 10(1) WTR 1998",
    limit: `${dailyRest.required} consecutive hours in each 24hr period`,
    actual: `${dailyRest.shortestRest} hours shortest rest`,
    status: dailyRest.compliant ? "green" : "red",
    breach: !dailyRest.compliant,
    correctiveAction: !dailyRest.compliant
      ? generateCorrectiveAction("daily-rest", `${dailyRest.shortestRest}`, `${dailyRest.required}`, workerAge, false)
      : "",
    notes: "",
  });

  // 6. Weekly rest
  checks.push({
    id: "weekly-rest",
    requirement: workerAge === "young"
      ? "Weekly rest period (young worker: 48 hours)"
      : "Weekly rest period (24 hours per 7 days)",
    regulation: workerAge === "young" ? "Reg 10(2) WTR 1998" : "Reg 11 WTR 1998",
    limit: workerAge === "young"
      ? "48 hours uninterrupted in each 7-day period"
      : "24 hours uninterrupted in each 7-day period (or 48 hours in 14 days)",
    actual: `${weeklyRest.longestRest} hours longest uninterrupted rest`,
    status: weeklyRest.compliant ? "green" : "red",
    breach: !weeklyRest.compliant,
    correctiveAction: !weeklyRest.compliant
      ? generateCorrectiveAction("weekly-rest", `${weeklyRest.longestRest}`, `${weeklyRest.required}`, workerAge, false)
      : "",
    notes: "",
  });

  // 7. Annual leave
  checks.push({
    id: "annual-leave",
    requirement: "Statutory annual leave entitlement",
    regulation: "Reg 13-13A WTR 1998",
    limit: annualLeave.proRataEntitlement !== null
      ? `${annualLeave.proRataEntitlement} days (pro-rata of 28 days)`
      : "28 days (5.6 weeks) per leave year",
    actual: `${actualLeaveDays} days taken`,
    status: annualLeave.compliant ? "green" : annualLeave.shortfall <= 5 ? "amber" : "red",
    breach: !annualLeave.compliant,
    correctiveAction: !annualLeave.compliant
      ? generateCorrectiveAction("annual-leave", `${actualLeaveDays}`, `${annualLeave.proRataEntitlement ?? 28}`, workerAge, false)
      : "",
    notes: annualLeave.shortfall > 0
      ? `Shortfall of ${annualLeave.shortfall} days to be taken before leave year end`
      : "",
  });

  // ── Overall status
  const breachCount = checks.filter(c => c.breach).length;
  const hasAmber = checks.some(c => c.status === "amber");
  const overallStatus: RAGStatus = breachCount > 0 ? "red" : hasAmber ? "amber" : "green";

  // ── Recommendations
  const recommendations: string[] = [];

  if (breachCount === 0 && !hasAmber) {
    recommendations.push("All Working Time Regulations requirements are currently met. Continue monitoring compliance, especially after any changes to shift patterns.");
  }

  if (avgWeeklyHours > 44 && avgWeeklyHours <= 48) {
    recommendations.push(`Average weekly hours (${avgWeeklyHours}h) are approaching the 48hr limit. Monitor closely and consider obtaining opt-out agreements as a precaution.`);
  }

  if (optOutSigned && avgWeeklyHours > 48) {
    recommendations.push("Maintain a register of all opt-out agreements. Workers can withdraw opt-out with 7 days notice (or up to 3 months if agreed in writing). Employer must keep records for 2 years.");
  }

  if (nightWorker.isNightWorker) {
    recommendations.push("Night workers must be offered a free health assessment before starting night work and at regular intervals thereafter (Reg 7 WTR 1998). Maintain health assessment records.");
  }

  if (breachCount > 0) {
    recommendations.push("Address identified breaches immediately. Failure to comply with WTR can result in enforcement action by HSE and employment tribunal claims by affected workers.");
  }

  recommendations.push("Maintain working time records for at least 2 years (Reg 9 WTR 1998). Records must show actual hours worked, not just contracted hours.");
  recommendations.push("Use the Fatigue Risk Calculator to assess fatigue levels associated with the current shift pattern.");
  recommendations.push("Use the Lone Worker Risk Calculator if any shifts involve lone working arrangements.");

  const crossRefs = [
    "Fatigue Risk Calculator -- assess fatigue from current shift pattern",
    "Lone Worker Risk Calculator -- assess lone working risks on shifts",
  ];

  return {
    workerAge,
    referencePeriod,
    averageWeeklyHours: avgWeeklyHours,
    maxWeeklyHoursInPeriod: Math.round(maxWeekly * 10) / 10,
    longestShiftHours: Math.round(longestShift * 10) / 10,
    longestContinuousWork: breakCheck.longestWithoutBreak,
    nightWorker,
    annualLeave,
    optOutSigned,
    complianceChecks: checks,
    breachCount,
    overallStatus,
    weeklyRecords,
    recommendations,
    crossRefs,
  };
}

// ─── Formatters ──────────────────────────────────────────────────
export function fmtHours(h: number): string {
  if (h === 0) return "0h";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function ragColour(status: RAGStatus): { bg: string; text: string; border: string; dot: string; label: string } {
  switch (status) {
    case "green": return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500", label: "Compliant" };
    case "amber": return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500", label: "Advisory" };
    case "red": return { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-red-500", label: "Non-Compliant" };
  }
}

export function ragPdfRgb(status: RAGStatus): number[] {
  switch (status) {
    case "green": return [22, 163, 74];
    case "amber": return [234, 179, 8];
    case "red": return [220, 38, 38];
  }
}
