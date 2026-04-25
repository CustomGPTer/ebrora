// src/data/formwork-pressure-calculator.ts
// Formwork Lateral Pressure — CIRIA R108 (1985) + DIN 18218:2010, tie spacing
//
// CIRIA R108 envelope (placed from above, internally vibrated):
//   Pmax = D × [C1·√R + C2·K·√(H − C1·√R)]   limited by hydrostatic D·H
//   D    = 25 kN/m³ concrete unit weight
//   C1   = section-shape coefficient (Wall = 1.0, Column = 1.5)
//   C2   = constituent-materials coefficient (0.30 / 0.45 / 0.60 — see CEMENT_CLASSES)
//   K    = (36 / (T + 16))²  temperature factor
//   R    = pour rate (m/h)
//   H    = vertical pour height (m)
//
// DIN 18218:2010 Table 1 (placed from above, internally vibrated):
//   F1: σhk,max = (5v + 21) × K1, ≥ 25
//   F2: σhk,max = (10v + 19) × K1, ≥ 25
//   F3: σhk,max = (14v + 18) × K1, ≥ 25
//   F4: σhk,max = (17v + 17) × K1, ≥ 25
//   F5: σhk,max = (25 + 30v) × K1, ≥ 30
//   F6: σhk,max = (25 + 38v) × K1, ≥ 30
//   SCC: σhk,max = (25 + 33v) × K1, ≥ 30
//   K1 setting-time factor (Table 2) keyed off tE (end of setting, hours)
//   limited by hydrostatic γc · H

// ─── Types ──────────────────────────────────────────────────────
export type SectionType = "wall" | "column";
export type CementClass =
  | "opc-plain"           // OPC/RHPC/SRPC, no admixtures                       → C2 = 0.30
  | "opc-admix"           // OPC/RHPC/SRPC, with admixtures except retarder     → C2 = 0.30
  | "opc-retarder"        // OPC/RHPC/SRPC, with retarder                       → C2 = 0.45
  | "blend-plain"         // PBFC/PPFAC/<70%ggbs/<40%pfa, no admixtures         → C2 = 0.45
  | "blend-admix"         // PBFC/PPFAC/<70%ggbs/<40%pfa, admixtures (no retd)  → C2 = 0.45
  | "blend-retarder"      // PBFC/PPFAC/<70%ggbs/<40%pfa, with retarder         → C2 = 0.60
  | "high-replacement";   // >70% ggbs or >40% pfa                              → C2 = 0.60

export type ConsistencyClass = "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "SCC";

export interface FormworkInputs {
  pourRate: number;        // m/hr (R / v)
  temperature: number;     // °C at placing
  headHeight: number;      // m total pour height (H)
  sectionType: SectionType;
  cementClass: CementClass;
  consistencyClass: ConsistencyClass;
  tieCapacity: number;     // kN per tie (default 90)
}

export interface PressurePoint {
  depth: number;   // m from top
  ciriaP: number;  // kN/m²
  hydroP: number;  // kN/m²
  dinP: number;    // kN/m²
}

export interface TieSpacing {
  hSpacing: number;   // m horizontal centres
  vSpacing: number;   // m vertical centres
  tiesPerM2: number;
  capped: boolean;    // true if cap was applied
}

export interface FormworkResult {
  maxPressureCIRIA: number; // kN/m²
  maxPressureHydro: number;
  maxPressureDIN: number;
  effectiveHead: number;    // m depth at which max occurs
  savingPercent: number;    // CIRIA vs hydrostatic
  pressureProfile: PressurePoint[];
  tieSpacing: TieSpacing;
  pourRateSensitivity: { rate: number; pressure: number }[];
  tempSensitivity: { temp: number; pressure: number }[];
  recommendations: string[];
  // Diagnostic: derived intermediates
  c1: number;
  c2: number;
  k: number;
  tE: number;
  k1: number;
}

// ─── Constants ───────────────────────────────────────────────
const CONCRETE_DENSITY = 25; // kN/m³ (γc)

// Tie spacing cap per common formwork practice (advised maximum reasonable).
export const TIE_SPACING_MAX_M = 0.9;

// CIRIA 108 — section shape coefficient C1 (Section 2 of R108).
//   Wall  : either width OR breadth > 2.0 m → C1 = 1.0
//   Column: both width AND breadth ≤ 2.0 m → C1 = 1.5
export const SECTION_TYPES: { type: SectionType; label: string; c1: number; description: string }[] = [
  { type: "wall",   label: "Wall (width or breadth > 2 m)", c1: 1.0, description: "Either dimension > 2 m" },
  { type: "column", label: "Column (both dimensions ≤ 2 m)", c1: 1.5, description: "Both dimensions ≤ 2 m" },
];

// CIRIA 108 — constituent-materials coefficient C2 (Table 1 of R108).
// Seven rows mapping to three valid C2 values (0.30 / 0.45 / 0.60).
export const CEMENT_CLASSES: { type: CementClass; label: string; c2: number; description: string }[] = [
  { type: "opc-plain",          label: "OPC / RHPC / SRPC — no admixtures",                                   c2: 0.30, description: "Standard Portland cement, no admixtures" },
  { type: "opc-admix",          label: "OPC / RHPC / SRPC — admixtures (no retarder)",                        c2: 0.30, description: "OPC with plasticiser, accelerator or air-entraining admixture" },
  { type: "opc-retarder",       label: "OPC / RHPC / SRPC — with retarder",                                   c2: 0.45, description: "OPC with retarding admixture" },
  { type: "blend-plain",        label: "Blend (<70% GGBS / <40% PFA) — no admixtures",                        c2: 0.45, description: "LHPBFC / PBFC / PPFAC blend, no admixtures" },
  { type: "blend-admix",        label: "Blend (<70% GGBS / <40% PFA) — admixtures (no retarder)",             c2: 0.45, description: "Blended cement with plasticiser/accelerator" },
  { type: "blend-retarder",     label: "Blend (<70% GGBS / <40% PFA) — with retarder",                        c2: 0.60, description: "Blended cement with retarder" },
  { type: "high-replacement",   label: "High-replacement (>70% GGBS or >40% PFA)",                            c2: 0.60, description: "Heavily blended — slowest stiffening" },
];

// DIN 18218:2010 — consistency classes per DIN EN 12350-5 / DIN EN 206-1.
export const CONSISTENCY_CLASSES: { type: ConsistencyClass; label: string; description: string }[] = [
  { type: "F1",  label: "F1 — Stiff",          description: "Flow ≤ 34 cm — stiff, internally vibrated" },
  { type: "F2",  label: "F2 — Plastic",        description: "Flow 35–41 cm — plastic, vibrated" },
  { type: "F3",  label: "F3 — Soft",           description: "Flow 42–48 cm — soft, vibrated" },
  { type: "F4",  label: "F4 — Very soft",      description: "Flow 49–55 cm — very soft, vibrated" },
  { type: "F5",  label: "F5 — Flowable",       description: "Flow 56–62 cm — flowable, vibrated" },
  { type: "F6",  label: "F6 — Very flowable",  description: "Flow 63–70 cm — very flowable" },
  { type: "SCC", label: "SCC — Self-compacting", description: "Self-compacting concrete (slump-flow ≥ 65 cm)" },
];

// ─── End-of-setting tE estimation ────────────────────────────
// DIN 18218 Table 2 keys K1 off tE (end of setting). Standard reference is tE = 5h
// at concrete temperature 15–20°C for OPC. tE rises in the cold and with retarders/blends,
// falls with heat. The estimate below combines the temperature factor used by CIRIA's K
// with cement-class base setting times reported in DIN 18218 commentary.
function estimateTE(temperature: number, cementClass: CementClass): number {
  // Base tE at reference 20°C (hours).
  const baseAt20: Record<CementClass, number> = {
    "opc-plain":        5,
    "opc-admix":        5,
    "opc-retarder":     8,
    "blend-plain":      6,
    "blend-admix":      6,
    "blend-retarder":   10,
    "high-replacement": 8,
  };
  const base = baseAt20[cementClass];
  // Temperature factor: tE ∝ (20 / T)^0.7 — concrete sets slower in cold.
  const T = Math.max(2, temperature);
  const factor = Math.pow(20 / T, 0.7);
  // Bound to plausible range.
  return Math.max(2, Math.min(20, base * factor));
}

// ─── CIRIA R108 Formula ──────────────────────────────────────
// Pmax = D × [C1·√R + C2·K·√(H − C1·√R)]   limited by D·H
// Verified against worked example in CIRIA R108 (walls, OPC, H=5 m, R=5 m/h, T=10 °C → 80 kN/m²).
function ciriaR108(pourRate: number, temp: number, head: number, c1: number, c2: number): number {
  const K = Math.pow(36 / (temp + 16), 2);
  const stiffened = c1 * Math.sqrt(pourRate);
  // CIRIA 108 §4: when C1·√R ≥ H the concrete has not yet stiffened across the pour,
  // and full hydrostatic governs design.
  if (stiffened >= head) return Math.round(CONCRETE_DENSITY * head * 10) / 10;
  const inner = Math.max(0, head - stiffened);
  const pmax = CONCRETE_DENSITY * (stiffened + c2 * K * Math.sqrt(inner));
  // Cap at hydrostatic.
  const capped = Math.min(pmax, CONCRETE_DENSITY * head);
  return Math.round(capped * 10) / 10;
}

// ─── DIN 18218:2010 Formula ──────────────────────────────────
// Linear formula per consistency class × K1 setting factor, ≥ floor, ≤ hydrostatic.
function din18218(pourRate: number, head: number, klass: ConsistencyClass, tE: number): number {
  const v = pourRate;
  let raw: number;
  let floor: number;
  switch (klass) {
    case "F1":  raw = 5 * v + 21;  floor = 25; break;
    case "F2":  raw = 10 * v + 19; floor = 25; break;
    case "F3":  raw = 14 * v + 18; floor = 25; break;
    case "F4":  raw = 17 * v + 17; floor = 25; break;
    case "F5":  raw = 25 + 30 * v; floor = 30; break;
    case "F6":  raw = 25 + 38 * v; floor = 30; break;
    case "SCC": raw = 25 + 33 * v; floor = 30; break;
  }
  // K1 from Table 2: setting-time correction.
  let K1: number;
  switch (klass) {
    case "F1":  K1 = 1 + 0.030 * Math.max(0, tE - 5); break;
    case "F2":  K1 = 1 + 0.053 * Math.max(0, tE - 5); break;
    case "F3":  K1 = 1 + 0.077 * Math.max(0, tE - 5); break;
    case "F4":  K1 = 1 + 0.140 * Math.max(0, tE - 5); break;
    case "F5":
    case "F6":
    case "SCC": K1 = tE / 5; break;
  }
  const withK1 = Math.max(floor, raw * K1);
  // Limited by hydrostatic.
  const capped = Math.min(withK1, CONCRETE_DENSITY * head);
  return Math.round(capped * 10) / 10;
}

// Exposed for the client/sensitivity charts.
export function dinK1(klass: ConsistencyClass, tE: number): number {
  switch (klass) {
    case "F1":  return 1 + 0.030 * Math.max(0, tE - 5);
    case "F2":  return 1 + 0.053 * Math.max(0, tE - 5);
    case "F3":  return 1 + 0.077 * Math.max(0, tE - 5);
    case "F4":  return 1 + 0.140 * Math.max(0, tE - 5);
    case "F5":
    case "F6":
    case "SCC": return tE / 5;
  }
}

// ─── Hydrostatic ─────────────────────────────────────────────
function hydrostatic(head: number): number {
  return Math.round(CONCRETE_DENSITY * head * 10) / 10;
}

// ─── Pressure Profile Generation ─────────────────────────────
function generateProfile(
  pourRate: number, temp: number, head: number,
  c1: number, c2: number,
  klass: ConsistencyClass, tE: number,
): PressurePoint[] {
  const points: PressurePoint[] = [];
  const step = Math.max(0.1, head / 40);
  const maxCiria = ciriaR108(pourRate, temp, head, c1, c2);
  const maxDin   = din18218(pourRate, head, klass, tE);

  for (let d = 0; d <= head; d += step) {
    const hydroP = CONCRETE_DENSITY * d;
    // Trapezoidal envelope: hydrostatic to peak depth, constant thereafter.
    const ciriaP = Math.min(hydroP, maxCiria);
    const dinP   = Math.min(hydroP, maxDin);
    points.push({
      depth: Math.round(d * 100) / 100,
      ciriaP: Math.round(ciriaP * 10) / 10,
      hydroP: Math.round(hydroP * 10) / 10,
      dinP:   Math.round(dinP * 10) / 10,
    });
  }
  // Ensure final point at exact head.
  const last = points[points.length - 1];
  if (!last || last.depth < head) {
    points.push({
      depth: head,
      ciriaP: Math.round(Math.min(CONCRETE_DENSITY * head, maxCiria) * 10) / 10,
      hydroP: Math.round(CONCRETE_DENSITY * head * 10) / 10,
      dinP:   Math.round(Math.min(CONCRETE_DENSITY * head, maxDin) * 10) / 10,
    });
  }
  return points;
}

// ─── Tie Spacing Calculation ─────────────────────────────────
// Square grid back-calculated from area-per-tie = capacity / pressure.
// Capped at TIE_SPACING_MAX_M (default 0.9 m) per common practice — wide tie
// spacings are impractical for formwork stability regardless of pressure.
function calculateTieSpacing(maxPressure: number, tieCapacity: number): TieSpacing {
  if (maxPressure <= 0) {
    return { hSpacing: TIE_SPACING_MAX_M, vSpacing: TIE_SPACING_MAX_M, tiesPerM2: Math.round((1 / (TIE_SPACING_MAX_M * TIE_SPACING_MAX_M)) * 10) / 10, capped: true };
  }
  const areaPerTie = tieCapacity / maxPressure;
  const raw = Math.sqrt(areaPerTie);
  // Round down to nearest 50 mm for conservatism.
  let spacing = Math.floor(raw * 20) / 20;
  let capped = false;
  if (spacing > TIE_SPACING_MAX_M) {
    spacing = TIE_SPACING_MAX_M;
    capped = true;
  }
  const tiesPerM2 = 1 / (spacing * spacing);
  return {
    hSpacing: Math.round(spacing * 100) / 100,
    vSpacing: Math.round(spacing * 100) / 100,
    tiesPerM2: Math.round(tiesPerM2 * 10) / 10,
    capped,
  };
}

// ─── Sensitivity Data ────────────────────────────────────────
function pourRateSensitivity(temp: number, head: number, c1: number, c2: number): { rate: number; pressure: number }[] {
  const points: { rate: number; pressure: number }[] = [];
  for (let r = 0.5; r <= 8; r += 0.5) {
    points.push({ rate: r, pressure: ciriaR108(r, temp, head, c1, c2) });
  }
  return points;
}

function tempSensitivity(pourRate: number, head: number, c1: number, c2: number): { temp: number; pressure: number }[] {
  const points: { temp: number; pressure: number }[] = [];
  for (let t = 5; t <= 35; t += 2.5) {
    points.push({ temp: t, pressure: ciriaR108(pourRate, t, head, c1, c2) });
  }
  return points;
}

// ─── Full Calculation ────────────────────────────────────────
export function calculateFormworkPressure(inputs: FormworkInputs): FormworkResult {
  const { pourRate, temperature, headHeight, sectionType, cementClass, consistencyClass, tieCapacity } = inputs;
  const sectionData = SECTION_TYPES.find(s => s.type === sectionType)!;
  const cementData  = CEMENT_CLASSES.find(c => c.type === cementClass)!;
  const c1 = sectionData.c1;
  const c2 = cementData.c2;
  const K  = Math.pow(36 / (temperature + 16), 2);
  const tE = estimateTE(temperature, cementClass);
  const K1 = dinK1(consistencyClass, tE);

  const maxCIRIA = ciriaR108(pourRate, temperature, headHeight, c1, c2);
  const maxHydro = hydrostatic(headHeight);
  const maxDIN   = din18218(pourRate, headHeight, consistencyClass, tE);

  // Effective head — depth at which max CIRIA pressure first occurs (where hydrostatic intersects Pmax).
  const effectiveHead = maxCIRIA / CONCRETE_DENSITY;
  const savingPercent = maxHydro > 0 ? Math.round((1 - maxCIRIA / maxHydro) * 100) : 0;

  const pressureProfile = generateProfile(pourRate, temperature, headHeight, c1, c2, consistencyClass, tE);
  const tieSpacing = calculateTieSpacing(maxCIRIA, tieCapacity);
  const prSens = pourRateSensitivity(temperature, headHeight, c1, c2);
  const tSens  = tempSensitivity(pourRate, headHeight, c1, c2);

  const recommendations = generateRecommendations(
    inputs, maxCIRIA, maxHydro, maxDIN, effectiveHead, savingPercent, tieSpacing, c1, c2, K, tE, K1,
  );

  return {
    maxPressureCIRIA: maxCIRIA,
    maxPressureHydro: maxHydro,
    maxPressureDIN:   maxDIN,
    effectiveHead:    Math.round(effectiveHead * 100) / 100,
    savingPercent,
    pressureProfile,
    tieSpacing,
    pourRateSensitivity: prSens,
    tempSensitivity:     tSens,
    recommendations,
    c1, c2,
    k: Math.round(K * 100) / 100,
    tE: Math.round(tE * 10) / 10,
    k1: Math.round(K1 * 100) / 100,
  };
}

function generateRecommendations(
  inputs: FormworkInputs, ciria: number, hydro: number, din: number,
  effHead: number, saving: number, ties: TieSpacing,
  c1: number, c2: number, K: number, tE: number, K1: number,
): string[] {
  const recs: string[] = [];

  recs.push(`CIRIA R108 max lateral pressure: ${ciria} kN/m² at ${effHead.toFixed(1)} m effective head (C1 = ${c1}, C2 = ${c2.toFixed(2)}, K = ${K.toFixed(2)}).`);
  recs.push(`DIN 18218:2010 max lateral pressure: ${din} kN/m² (class ${inputs.consistencyClass}, tE ≈ ${tE.toFixed(1)} h, K1 = ${K1.toFixed(2)}).`);
  recs.push(`Full hydrostatic pressure would be ${hydro} kN/m² — CIRIA method saves ${saving}% on formwork design.`);

  if (saving < 5) {
    recs.push("Minimal saving over hydrostatic — pour rate is high relative to setting time. Consider slowing the pour rate.");
  }

  recs.push(`Tie spacing at zone of max pressure: ${ties.hSpacing} m H × ${ties.vSpacing} m V centres (${ties.tiesPerM2} ties/m²) for ${inputs.tieCapacity} kN ties.${ties.capped ? " — capped at " + TIE_SPACING_MAX_M + " m max practical spacing." : ""}`);

  if (inputs.temperature < 10) {
    recs.push("COLD WEATHER WARNING: concrete temperature below 10 °C significantly increases lateral pressure due to slower stiffening. Consider heated formwork or insulation.");
  }
  if (inputs.temperature > 30) {
    recs.push("Hot weather: rapid stiffening reduces lateral pressure but increases risk of cold joints. Maintain adequate pour rate.");
  }
  if (inputs.pourRate > 5) {
    recs.push("High pour rate (> 5 m/h) — formwork pressures approach hydrostatic. Ensure formwork and ties are designed for these loads.");
  }
  if (inputs.cementClass === "opc-retarder" || inputs.cementClass === "blend-retarder") {
    recs.push("Retarded concrete: stiffening is delayed — lateral pressures are higher than the equivalent non-retarded mix. Formwork must be designed accordingly.");
  }
  if (inputs.consistencyClass === "F5" || inputs.consistencyClass === "F6" || inputs.consistencyClass === "SCC") {
    recs.push("Highly flowable / SCC: DIN 18218 requires K1 = tE/5 and a 30 kN/m² floor. Bottom-pumped placement should be designed for full hydrostatic with γF = 1.5 per DIN 18218 §5.");
  }
  if (inputs.sectionType === "column") {
    recs.push("Column geometry: both width and breadth ≤ 2 m, so C1 = 1.5. Vibration energy mobilises more concrete in narrow sections, increasing pressure relative to walls.");
  }

  return recs;
}
