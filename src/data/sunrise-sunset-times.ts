// src/data/sunrise-sunset-times.ts
// Sunrise & Sunset Times — NOAA Solar Calculator for 12 major UK cities
// Civil twilight, golden hour, recommended working hours for construction sites

// ─── Types ──────────────────────────────────────────────────────
export type ViewMode = "day" | "week" | "month";

export interface CityData {
  name: string;
  lat: number;
  lng: number;
  region: string;
}

export interface SolarTimes {
  date: Date;
  civilTwilightStart: Date | null;  // sun 6° below horizon (morning)
  sunrise: Date | null;
  solarNoon: Date;
  sunset: Date | null;
  civilTwilightEnd: Date | null;    // sun 6° below horizon (evening)
  daylightMinutes: number;
  usableWorkMinutes: number;        // civil twilight to civil twilight
  recommendedStart: string;         // HH:MM
  recommendedEnd: string;           // HH:MM
  sunAltitudeNoon: number;          // degrees
  isPolarDay: boolean;
  isPolarNight: boolean;
}

// ─── 12 Major UK Cities ─────────────────────────────────────────
export const UK_CITIES: CityData[] = [
  { name: "London",     lat: 51.5074, lng: -0.1278,  region: "England" },
  { name: "Birmingham", lat: 52.4862, lng: -1.8904,  region: "England" },
  { name: "Manchester", lat: 53.4808, lng: -2.2426,  region: "England" },
  { name: "Glasgow",    lat: 55.8642, lng: -4.2518,  region: "Scotland" },
  { name: "Edinburgh",  lat: 55.9533, lng: -3.1883,  region: "Scotland" },
  { name: "Liverpool",  lat: 53.4084, lng: -2.9916,  region: "England" },
  { name: "Leeds",      lat: 53.8008, lng: -1.5491,  region: "England" },
  { name: "Bristol",    lat: 51.4545, lng: -2.5879,  region: "England" },
  { name: "Cardiff",    lat: 51.4816, lng: -3.1791,  region: "Wales" },
  { name: "Belfast",    lat: 54.5973, lng: -5.9301,  region: "Northern Ireland" },
  { name: "Newcastle",  lat: 54.9783, lng: -1.6178,  region: "England" },
  { name: "Sheffield",  lat: 53.3811, lng: -1.4701,  region: "England" },
];

// ─── NOAA Solar Position Algorithm ──────────────────────────────
// Based on NOAA Solar Calculator spreadsheet (https://gml.noaa.gov/grad/solcalc/)
// Accuracy: ~1 minute for sunrise/sunset

function toRad(deg: number): number { return deg * Math.PI / 180; }
function toDeg(rad: number): number { return rad * 180 / Math.PI; }

/** Julian Day Number from a Date */
function julianDay(d: Date): number {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return day + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

/** Julian Century from Julian Day */
function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/** Geometric Mean Longitude of the Sun (degrees) */
function sunGeomMeanLong(T: number): number {
  let L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
  while (L0 > 360) L0 -= 360;
  while (L0 < 0) L0 += 360;
  return L0;
}

/** Geometric Mean Anomaly of the Sun (degrees) */
function sunGeomMeanAnomaly(T: number): number {
  return 357.52911 + T * (35999.05029 - 0.0001537 * T);
}

/** Eccentricity of Earth's Orbit */
function earthOrbitEccentricity(T: number): number {
  return 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
}

/** Sun's Equation of Center (degrees) */
function sunEqOfCenter(T: number): number {
  const M = toRad(sunGeomMeanAnomaly(T));
  return Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * M) * (0.019993 - 0.000101 * T)
    + Math.sin(3 * M) * 0.000289;
}

/** Sun's True Longitude (degrees) */
function sunTrueLong(T: number): number {
  return sunGeomMeanLong(T) + sunEqOfCenter(T);
}

/** Sun's Apparent Longitude (degrees) */
function sunApparentLong(T: number): number {
  const omega = 125.04 - 1934.136 * T;
  return sunTrueLong(T) - 0.00569 - 0.00478 * Math.sin(toRad(omega));
}

/** Mean Obliquity of the Ecliptic (degrees) */
function meanObliquityOfEcliptic(T: number): number {
  const seconds = 21.448 - T * (46.8150 + T * (0.00059 - T * 0.001813));
  return 23.0 + (26.0 + seconds / 60.0) / 60.0;
}

/** Corrected Obliquity (degrees) */
function obliquityCorrection(T: number): number {
  const omega = 125.04 - 1934.136 * T;
  return meanObliquityOfEcliptic(T) + 0.00256 * Math.cos(toRad(omega));
}

/** Sun's Declination (degrees) */
function sunDeclination(T: number): number {
  const e = toRad(obliquityCorrection(T));
  const lambda = toRad(sunApparentLong(T));
  return toDeg(Math.asin(Math.sin(e) * Math.sin(lambda)));
}

/** Equation of Time (minutes) */
function equationOfTime(T: number): number {
  const epsilon = toRad(obliquityCorrection(T));
  const L0 = toRad(sunGeomMeanLong(T));
  const e = earthOrbitEccentricity(T);
  const M = toRad(sunGeomMeanAnomaly(T));
  let y = Math.tan(epsilon / 2);
  y *= y;
  const Etime = y * Math.sin(2 * L0)
    - 2 * e * Math.sin(M)
    + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
    - 0.5 * y * y * Math.sin(4 * L0)
    - 1.25 * e * e * Math.sin(2 * M);
  return toDeg(Etime) * 4; // convert to minutes
}

/** Hour angle for a given solar depression angle (degrees) */
function hourAngle(lat: number, decl: number, depressionDeg: number): number | null {
  const latRad = toRad(lat);
  const declRad = toRad(decl);
  const zenith = toRad(90 + depressionDeg); // 90.833 for sunrise/sunset (accounting for refraction + solar disc)
  const cosHA = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(declRad))) - Math.tan(latRad) * Math.tan(declRad);
  if (cosHA > 1 || cosHA < -1) return null; // sun never rises/sets
  return toDeg(Math.acos(cosHA));
}

/** Convert minutes from midnight to a Date on the given base date */
function minutesToDate(baseDate: Date, minutes: number): Date {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(Math.round(minutes));
  return d;
}

/** Calculate solar noon altitude */
function solarNoonAltitude(lat: number, decl: number): number {
  return 90 - Math.abs(lat - decl);
}

// ─── Main Calculation ───────────────────────────────────────────
export function calculateSolarTimes(city: CityData, date: Date): SolarTimes {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);

  const jd = julianDay(d);
  const T = julianCentury(jd);
  const eqTime = equationOfTime(T);
  const decl = sunDeclination(T);

  // Solar noon in minutes from midnight (local clock time)
  // UK timezone offset: 0 for GMT, +60 for BST
  const tzOffset = getUKOffset(d);
  const solarNoonMin = 720 - 4 * city.lng - eqTime + tzOffset;

  // Sunrise/sunset (depression = 0.833° for atmospheric refraction + solar disc)
  const ha = hourAngle(city.lat, decl, 0.833);
  // Civil twilight (depression = 6°)
  const haCivil = hourAngle(city.lat, decl, 6);

  const altNoon = solarNoonAltitude(city.lat, decl);

  const isPolarDay = ha === null && decl > 0 && city.lat > 0;
  const isPolarNight = ha === null && decl < 0 && city.lat > 0;

  let sunriseMin: number | null = null;
  let sunsetMin: number | null = null;
  let civilStartMin: number | null = null;
  let civilEndMin: number | null = null;

  if (ha !== null) {
    sunriseMin = solarNoonMin - ha * 4;
    sunsetMin = solarNoonMin + ha * 4;
  }
  if (haCivil !== null) {
    civilStartMin = solarNoonMin - haCivil * 4;
    civilEndMin = solarNoonMin + haCivil * 4;
  }

  const daylightMinutes = (sunriseMin !== null && sunsetMin !== null) ? sunsetMin - sunriseMin : (isPolarDay ? 1440 : 0);
  const usableWorkMinutes = (civilStartMin !== null && civilEndMin !== null) ? civilEndMin - civilStartMin : (isPolarDay ? 1440 : 0);

  // Recommended construction working hours: round civil twilight start up to nearest 15min, end down
  let recStart = "—";
  let recEnd = "—";
  if (civilStartMin !== null && civilEndMin !== null) {
    const startRounded = Math.ceil(civilStartMin / 15) * 15;
    const endRounded = Math.floor(civilEndMin / 15) * 15;
    recStart = fmtMinutes(startRounded);
    recEnd = fmtMinutes(endRounded);
  }

  const baseDate = new Date(d);
  baseDate.setHours(0, 0, 0, 0);

  return {
    date: baseDate,
    civilTwilightStart: civilStartMin !== null ? minutesToDate(baseDate, civilStartMin) : null,
    sunrise: sunriseMin !== null ? minutesToDate(baseDate, sunriseMin) : null,
    solarNoon: minutesToDate(baseDate, solarNoonMin),
    sunset: sunsetMin !== null ? minutesToDate(baseDate, sunsetMin) : null,
    civilTwilightEnd: civilEndMin !== null ? minutesToDate(baseDate, civilEndMin) : null,
    daylightMinutes,
    usableWorkMinutes,
    recommendedStart: recStart,
    recommendedEnd: recEnd,
    sunAltitudeNoon: altNoon,
    isPolarDay,
    isPolarNight,
  };
}

// ─── UK BST/GMT Detection ───────────────────────────────────────
// BST: last Sunday of March 01:00 UTC → last Sunday of October 01:00 UTC
export function getUKOffset(d: Date): number {
  const year = d.getFullYear();
  // Last Sunday of March
  const marchLast = new Date(year, 2, 31);
  while (marchLast.getDay() !== 0) marchLast.setDate(marchLast.getDate() - 1);
  const bstStart = new Date(Date.UTC(year, 2, marchLast.getDate(), 1, 0, 0));
  // Last Sunday of October
  const octLast = new Date(year, 9, 31);
  while (octLast.getDay() !== 0) octLast.setDate(octLast.getDate() - 1);
  const bstEnd = new Date(Date.UTC(year, 9, octLast.getDate(), 1, 0, 0));

  const utcMs = d.getTime();
  if (utcMs >= bstStart.getTime() && utcMs < bstEnd.getTime()) return 60; // BST
  return 0; // GMT
}

// ─── Batch Calculations ─────────────────────────────────────────
export function calculateWeek(city: CityData, startDate: Date): SolarTimes[] {
  // Get Monday of the week containing startDate
  const d = new Date(startDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);

  const results: SolarTimes[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(d);
    current.setDate(d.getDate() + i);
    results.push(calculateSolarTimes(city, current));
  }
  return results;
}

export function calculateMonth(city: CityData, year: number, month: number): SolarTimes[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const results: SolarTimes[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    results.push(calculateSolarTimes(city, new Date(year, month, day)));
  }
  return results;
}

// ─── Formatting Helpers ─────────────────────────────────────────
export function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtTime12(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function fmtMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function fmtDuration(minutes: number): string {
  let h = Math.floor(minutes / 60);
  let m = Math.round(minutes % 60);
  if (m === 60) { h += 1; m = 0; }
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function fmtDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function fmtDateFull(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function fmtMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ─── Day-of-week labels ─────────────────────────────────────────
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Regulatory References ──────────────────────────────────────
export const REGULATORY_REFS = [
  { code: "CDM 2015 Reg 35", title: "Lighting", description: "Every workplace and approach must have suitable and sufficient lighting, which shall be by natural light so far as is reasonably practicable." },
  { code: "HSG65", title: "Successful Health & Safety Management", description: "Risk assessments should consider environmental factors including daylight availability for outdoor work activities." },
  { code: "BS 5489-1:2020", title: "Design of Road Lighting", description: "Provides guidance on lighting levels for highways and construction work zones during hours of darkness." },
  { code: "BS EN 12464-2:2014", title: "Lighting of Outdoor Work Places", description: "Specifies lighting requirements for outdoor work areas, relevant when natural light is insufficient." },
  { code: "Safety at Street Works and Road Works CoP (2013)", title: "Signing, lighting and guarding of road works", description: "DfT Code of Practice for road works on highways up to 40 mph (and dual carriageways below 50 mph). Sets requirements for warning lights during darkness or poor visibility on roads with speed limits of 40 mph or more, and informs site planning around hours of daylight." },
];

export const WHY_IT_MATTERS = "Knowing exact sunrise, sunset, and civil twilight times is critical for construction site planning. CDM 2015 Regulation 35 requires workplaces to have suitable lighting — natural light where reasonably practicable. Civil twilight (when the sun is within 6° below the horizon) provides enough ambient light for outdoor work without artificial lighting. Planning shift patterns, task sequencing, and temporary lighting deployment around daylight hours improves safety, reduces energy costs, and ensures regulatory compliance. During winter months, UK construction sites may have as little as 7 hours of usable daylight, making accurate planning essential.";
