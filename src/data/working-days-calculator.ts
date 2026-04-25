// src/data/working-days-calculator.ts
// Working Days Calculator — UK bank holidays 2025-2035, Easter computus

// ─── Types ───────────────────────────────────────────────────
export type WeekendRule = "sat-sun" | "sun-only" | "none";
export type BHRegion = "england-wales" | "scotland" | "northern-ireland";

export interface NonWorkingPeriod {
  id: string;
  label: string;
  startDate: string; // ISO
  endDate: string;   // ISO (same as start for single day)
}

export interface DayInfo {
  date: Date;
  iso: string;
  isWeekend: boolean;
  isBankHoliday: boolean;
  bankHolidayName: string | null;
  isCustomExclusion: boolean;
  customExclusionLabel: string | null;
  isWorkingDay: boolean;
}

export interface MonthSummary {
  year: number;
  month: number; // 0-indexed
  label: string;
  calendarDays: number;
  weekendDays: number;
  bankHolidays: number;
  customExclusions: number;
  workingDays: number;
}

export interface WorkingDaysResult {
  startDate: string;
  endDate: string;
  totalCalendarDays: number;
  weekendDays: number;
  bankHolidays: number;
  customExclusionDays: number;
  netWorkingDays: number;
  workingDaysPct: number;
  programmeWeeks: number;
  days: DayInfo[];
  monthSummaries: MonthSummary[];
  bankHolidayList: { date: string; name: string }[];
  recommendations: string[];
}

// ─── Easter Computus (Anonymous Gregorian) ───────────────────
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Mar, 4=Apr
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─── Date Helpers ────────────────────────────────────────────
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** If date falls on Sat, substitute = next Mon. If Sun, substitute = next Mon (or Tue if Mon already taken). */
function substituteDay(d: Date, occupied: Set<string>): Date {
  const dow = d.getDay();
  if (dow === 0) { // Sunday
    const mon = addDays(d, 1);
    if (occupied.has(toISO(mon))) return addDays(d, 2);
    return mon;
  }
  if (dow === 6) { // Saturday
    const mon = addDays(d, 2);
    if (occupied.has(toISO(mon))) return addDays(d, 3);
    return mon;
  }
  return d;
}

// ─── Bank Holiday Generator ──────────────────────────────────
export interface BankHoliday {
  date: Date;
  iso: string;
  name: string;
}

function generateBankHolidays(year: number, region: BHRegion): BankHoliday[] {
  const holidays: BankHoliday[] = [];
  const occupied = new Set<string>();

  const add = (d: Date, name: string, needsSub: boolean) => {
    const actual = needsSub ? substituteDay(d, occupied) : d;
    const iso = toISO(actual);
    occupied.add(iso);
    holidays.push({ date: actual, iso, name });
  };

  // ── New Year's Day (1 Jan — substitute if weekend)
  add(new Date(year, 0, 1), "New Year's Day", true);

  // ── 2nd January (Scotland only — substitute if weekend)
  if (region === "scotland") {
    add(new Date(year, 0, 2), "2nd January", true);
  }

  // ── St Patrick's Day (Northern Ireland only — 17 Mar, substitute if weekend)
  if (region === "northern-ireland") {
    add(new Date(year, 2, 17), "St Patrick's Day", true);
  }

  // ── Good Friday (all regions) & Easter Monday (England & Wales, NI — NOT Scotland)
  const easter = easterSunday(year);
  add(addDays(easter, -2), "Good Friday", false);
  if (region !== "scotland") {
    add(addDays(easter, 1), "Easter Monday", false);
  }

  // ── Early May Bank Holiday (first Monday in May)
  const mayFirst = new Date(year, 4, 1);
  const earlyMayOffset = (8 - mayFirst.getDay()) % 7;
  add(addDays(mayFirst, earlyMayOffset), "Early May Bank Holiday", false);

  // ── Spring Bank Holiday (last Monday in May)
  const mayLast = new Date(year, 4, 31);
  const springOffset = (mayLast.getDay() + 6) % 7; // days back to Monday
  add(addDays(mayLast, -springOffset), "Spring Bank Holiday", false);

  // ── Battle of the Boyne (Northern Ireland only — 12 Jul, substitute if weekend)
  if (region === "northern-ireland") {
    add(new Date(year, 6, 12), "Battle of the Boyne", true);
  }

  // ── Summer Bank Holiday
  if (region === "scotland") {
    // First Monday in August
    const aug1 = new Date(year, 7, 1);
    const augOffset = (8 - aug1.getDay()) % 7;
    add(addDays(aug1, augOffset), "Summer Bank Holiday", false);
  } else {
    // Last Monday in August (England & Wales, NI)
    const aug31 = new Date(year, 7, 31);
    const augLastOffset = (aug31.getDay() + 6) % 7;
    add(addDays(aug31, -augLastOffset), "Summer Bank Holiday", false);
  }

  // ── St Andrew's Day (Scotland only — 30 Nov, substitute if weekend)
  // Established by St Andrew's Day Bank Holiday (Scotland) Act 2007
  if (region === "scotland") {
    add(new Date(year, 10, 30), "St Andrew's Day", true);
  }

  // ── Christmas Day (25 Dec — substitute if weekend)
  add(new Date(year, 11, 25), "Christmas Day", true);

  // ── Boxing Day (26 Dec — substitute if weekend, avoiding Christmas substitute)
  add(new Date(year, 11, 26), "Boxing Day", true);

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Pre-generate all bank holidays 2025-2035 for each region
const BH_CACHE: Record<string, BankHoliday[]> = {};

function getBankHolidays(year: number, region: BHRegion): BankHoliday[] {
  const key = `${year}-${region}`;
  if (!BH_CACHE[key]) {
    BH_CACHE[key] = generateBankHolidays(year, region);
  }
  return BH_CACHE[key];
}

export function getBankHolidaysInRange(start: Date, end: Date, region: BHRegion): BankHoliday[] {
  const result: BankHoliday[] = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const holidays = getBankHolidays(y, region);
    for (const h of holidays) {
      if (h.date >= start && h.date <= end) {
        result.push(h);
      }
    }
  }
  return result;
}

// ─── Region Labels ───────────────────────────────────────────
export const BH_REGIONS: { value: BHRegion; label: string }[] = [
  { value: "england-wales", label: "England & Wales" },
  { value: "scotland", label: "Scotland" },
  { value: "northern-ireland", label: "Northern Ireland" },
];

export const WEEKEND_RULES: { value: WeekendRule; label: string }[] = [
  { value: "sat-sun", label: "Exclude Saturday & Sunday" },
  { value: "sun-only", label: "Exclude Sunday only" },
  { value: "none", label: "No weekend exclusion" },
];

// ─── Main Calculation ────────────────────────────────────────
export function calculateWorkingDays(
  startISO: string,
  endISO: string,
  weekendRule: WeekendRule,
  region: BHRegion,
  customPeriods: NonWorkingPeriod[],
): WorkingDaysResult {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return emptyResult(startISO, endISO);
  }

  // Get bank holidays in range
  const bankHols = getBankHolidaysInRange(start, end, region);
  const bhSet = new Map<string, string>();
  for (const h of bankHols) bhSet.set(h.iso, h.name);

  // Build custom exclusion set
  const customSet = new Map<string, string>();
  for (const p of customPeriods) {
    const ps = new Date(p.startDate + "T00:00:00");
    const pe = new Date(p.endDate + "T00:00:00");
    if (isNaN(ps.getTime()) || isNaN(pe.getTime())) continue;
    let cur = new Date(ps);
    while (cur <= pe) {
      customSet.set(toISO(cur), p.label);
      cur = addDays(cur, 1);
    }
  }

  // Iterate each day
  const days: DayInfo[] = [];
  let weekendCount = 0, bhCount = 0, customCount = 0, workingCount = 0;

  let cur = new Date(start);
  while (cur <= end) {
    const iso = toISO(cur);
    const dow = cur.getDay();

    const isWeekend =
      weekendRule === "sat-sun" ? (dow === 0 || dow === 6) :
      weekendRule === "sun-only" ? (dow === 0) :
      false;

    const isBH = bhSet.has(iso);
    const bhName = bhSet.get(iso) || null;

    const isCustom = customSet.has(iso);
    const customLabel = customSet.get(iso) || null;

    // A day is non-working if it's a weekend, bank holiday, OR custom exclusion
    // But don't double-count: bank holidays on weekends are already excluded
    const isWorking = !isWeekend && !isBH && !isCustom;

    if (isWeekend) weekendCount++;
    else if (isBH) bhCount++;
    else if (isCustom) customCount++;

    if (isWorking) workingCount++;

    days.push({
      date: new Date(cur),
      iso,
      isWeekend,
      isBankHoliday: isBH,
      bankHolidayName: bhName,
      isCustomExclusion: isCustom,
      customExclusionLabel: customLabel,
      isWorkingDay: isWorking,
    });

    cur = addDays(cur, 1);
  }

  const totalCalendar = days.length;

  // Monthly summaries
  const monthMap = new Map<string, MonthSummary>();
  for (const d of days) {
    const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year: d.date.getFullYear(),
        month: d.date.getMonth(),
        label: d.date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        calendarDays: 0, weekendDays: 0, bankHolidays: 0, customExclusions: 0, workingDays: 0,
      });
    }
    const m = monthMap.get(key)!;
    m.calendarDays++;
    if (d.isWeekend) m.weekendDays++;
    else if (d.isBankHoliday) m.bankHolidays++;
    else if (d.isCustomExclusion) m.customExclusions++;
    if (d.isWorkingDay) m.workingDays++;
  }
  const monthSummaries = Array.from(monthMap.values());

  // Recommendations
  const recommendations: string[] = [];
  const pct = totalCalendar > 0 ? Math.round((workingCount / totalCalendar) * 100) : 0;
  if (pct < 60) {
    recommendations.push(`Only ${pct}% of calendar days are working days. This is below the typical ~71% for a standard 5-day week. Check for shutdown periods or excessive exclusions.`);
  }
  if (bhCount > 0) {
    recommendations.push(`${bhCount} bank holiday${bhCount > 1 ? "s" : ""} fall within this period (${region === "scotland" ? "Scottish" : region === "northern-ireland" ? "Northern Ireland" : "England & Wales"} calendar).`);
  }
  if (customCount > 0) {
    recommendations.push(`${customCount} additional non-working day${customCount > 1 ? "s" : ""} from custom exclusions (shutdowns, client-mandated closures, etc.).`);
  }
  const progWeeks = Math.round((workingCount / 5) * 10) / 10;
  if (progWeeks > 0) {
    recommendations.push(`${progWeeks} programme weeks (working days / 5). Use this for NEC4 programme planning and activity durations.`);
  }
  recommendations.push("Bank holidays are based on published UK government dates. Verify any exceptional bank holidays (e.g. coronations, state funerals) which may not be included.");

  return {
    startDate: startISO,
    endDate: endISO,
    totalCalendarDays: totalCalendar,
    weekendDays: weekendCount,
    bankHolidays: bhCount,
    customExclusionDays: customCount,
    netWorkingDays: workingCount,
    workingDaysPct: pct,
    programmeWeeks: progWeeks,
    days,
    monthSummaries,
    bankHolidayList: bankHols.map(h => ({ date: h.iso, name: h.name })),
    recommendations,
  };
}

function emptyResult(startISO: string, endISO: string): WorkingDaysResult {
  return {
    startDate: startISO, endDate: endISO,
    totalCalendarDays: 0, weekendDays: 0, bankHolidays: 0, customExclusionDays: 0,
    netWorkingDays: 0, workingDaysPct: 0, programmeWeeks: 0,
    days: [], monthSummaries: [], bankHolidayList: [], recommendations: ["Enter a valid date range to begin."],
  };
}

// ─── Formatting ──────────────────────────────────────────────
export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
