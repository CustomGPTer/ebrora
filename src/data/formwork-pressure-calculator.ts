// src/data/formwork-pressure-calculator.ts
// Formwork Lateral Pressure — CIRIA R108 + DIN 18218, tie spacing

// ─── Types ──────────────────────────────────────────────────────
export type ConcreteType = "opc" | "opc-retarder" | "opc-super" | "ggbs";
export type FormworkFinish = "rough-timber" | "plywood" | "steel";

export interface FormworkInputs {
  pourRate: number; // m/hr
  temperature: number; // degC at placing
  headHeight: number; // m total pour height
  concreteType: ConcreteType;
  formworkFinish: FormworkFinish;
  vibrated: boolean;
  tieCapacity: number; // kN (default 90)
}

export interface PressurePoint {
  depth: number; // m from top
  ciriaP: number; // kN/m2
  hydroP: number; // kN/m2
  dinP: number; // kN/m2
}

export interface TieSpacing {
  hSpacing: number; // m horizontal centres
  vSpacing: number; // m vertical centres
  tiesPerM2: number;
}

export interface FormworkResult {
  maxPressureCIRIA: number; // kN/m2
  maxPressureHydro: number;
  maxPressureDIN: number;
  effectiveHead: number; // m depth at which max occurs
  savingPercent: number; // CIRIA vs hydrostatic
  pressureProfile: PressurePoint[];
  tieSpacing: TieSpacing;
  pourRateSensitivity: { rate: number; pressure: number }[];
  tempSensitivity: { temp: number; pressure: number }[];
  recommendations: string[];
}

// ─── Constants ───────────────────────────────────────────────
const CONCRETE_DENSITY = 25; // kN/m3

export const CONCRETE_TYPES: { type: ConcreteType; label: string; c1: number; c2: number; description: string }[] = [
  { type: "opc", label: "OPC / CEM I (no admixtures)", c1: 1.0, c2: 0.3, description: "Standard Portland cement, no retarder" },
  { type: "opc-retarder", label: "OPC + Retarder", c1: 1.5, c2: 0.45, description: "Portland cement with retarding admixture" },
  { type: "opc-super", label: "OPC + Superplasticiser", c1: 1.2, c2: 0.35, description: "Portland cement with superplasticiser" },
  { type: "ggbs", label: "CEM III (GGBS blend)", c1: 1.4, c2: 0.40, description: "GGBS or fly ash blended cement -- slower set" },
];

export const FORMWORK_FINISHES: { finish: FormworkFinish; label: string; frictionFactor: number }[] = [
  { finish: "rough-timber", label: "Rough sawn timber", frictionFactor: 0.90 },
  { finish: "plywood", label: "Plywood (film-faced)", frictionFactor: 0.95 },
  { finish: "steel", label: "Steel", frictionFactor: 1.00 },
];

// ─── CIRIA R108 Formula ──────────────────────────────────────
// Pmax = D * [C1 * sqrt(R) + C2 * K * sqrt(H) - C1 * sqrt(C2 * K)]
// Where D = density (25 kN/m3), R = pour rate (m/hr), H = head (m)
// K = temperature factor = (36 / (T + 16))^2
// But Pmax cannot exceed hydrostatic: D * H
function ciriaR108(pourRate: number, temp: number, head: number, c1: number, c2: number): number {
  const K = Math.pow(36 / (temp + 16), 2);
  const term1 = c1 * Math.sqrt(pourRate);
  const term2 = c2 * K * Math.sqrt(head);
  const term3 = c1 * Math.sqrt(c2 * K);
  let pmax = CONCRETE_DENSITY * (term1 + term2 - term3);
  // Cannot exceed hydrostatic
  pmax = Math.min(pmax, CONCRETE_DENSITY * head);
  // Cannot be less than minimum (always at least some pressure)
  pmax = Math.max(pmax, CONCRETE_DENSITY * Math.min(head, 1));
  return Math.round(pmax * 10) / 10;
}

// ─── DIN 18218 Formula ───────────────────────────────────────
// Simplified DIN 18218:2010 for comparison
// Pmax = gamma * h_s where h_s = min(H, hs_max)
// hs_max depends on pour rate and setting behaviour
function din18218(pourRate: number, temp: number, head: number, concreteType: ConcreteType): number {
  // DIN uses a different approach: effective head based on stiffening time
  // Stiffening time ts (hours) depends on temperature and cement type
  let ts: number;
  if (concreteType === "opc") ts = 5 * Math.pow(20 / Math.max(5, temp), 0.5);
  else if (concreteType === "opc-retarder") ts = 8 * Math.pow(20 / Math.max(5, temp), 0.5);
  else if (concreteType === "opc-super") ts = 6 * Math.pow(20 / Math.max(5, temp), 0.5);
  else ts = 7 * Math.pow(20 / Math.max(5, temp), 0.5);

  // Effective head = pour rate * stiffening time
  const effectiveHead = Math.min(head, pourRate * ts);
  const pmax = CONCRETE_DENSITY * effectiveHead;
  return Math.round(pmax * 10) / 10;
}

// ─── Hydrostatic ─────────────────────────────────────────────
function hydrostatic(head: number): number {
  return Math.round(CONCRETE_DENSITY * head * 10) / 10;
}

// ─── Pressure Profile Generation ─────────────────────────────
function generateProfile(pourRate: number, temp: number, head: number, c1: number, c2: number, concreteType: ConcreteType): PressurePoint[] {
  const points: PressurePoint[] = [];
  const step = Math.max(0.1, head / 40);

  for (let d = 0; d <= head; d += step) {
    const hydroP = CONCRETE_DENSITY * d;
    // CIRIA pressure at depth d: min of hydrostatic at d and the max pressure
    const maxCiria = ciriaR108(pourRate, temp, head, c1, c2);
    const ciriaP = Math.min(hydroP, maxCiria);
    // DIN at depth d
    const maxDin = din18218(pourRate, temp, head, concreteType);
    const dinP = Math.min(hydroP, maxDin);

    points.push({
      depth: Math.round(d * 100) / 100,
      ciriaP: Math.round(ciriaP * 10) / 10,
      hydroP: Math.round(hydroP * 10) / 10,
      dinP: Math.round(dinP * 10) / 10,
    });
  }
  // Ensure final point at exact head
  if (points[points.length - 1].depth < head) {
    points.push({
      depth: head,
      ciriaP: Math.round(Math.min(CONCRETE_DENSITY * head, ciriaR108(pourRate, temp, head, c1, c2)) * 10) / 10,
      hydroP: Math.round(CONCRETE_DENSITY * head * 10) / 10,
      dinP: Math.round(Math.min(CONCRETE_DENSITY * head, din18218(pourRate, temp, head, concreteType)) * 10) / 10,
    });
  }
  return points;
}

// ─── Tie Spacing Calculation ─────────────────────────────────
function calculateTieSpacing(maxPressure: number, tieCapacity: number): TieSpacing {
  // Area per tie = tieCapacity / maxPressure
  const areaPerTie = tieCapacity / maxPressure;
  // Assume square grid initially
  const spacing = Math.sqrt(areaPerTie);
  // Round down to nearest 50mm
  const hSpacing = Math.floor(spacing * 20) / 20;
  const vSpacing = hSpacing;
  const tiesPerM2 = 1 / (hSpacing * vSpacing);

  return {
    hSpacing: Math.round(hSpacing * 100) / 100,
    vSpacing: Math.round(vSpacing * 100) / 100,
    tiesPerM2: Math.round(tiesPerM2 * 10) / 10,
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
  const { pourRate, temperature, headHeight, concreteType, formworkFinish, vibrated, tieCapacity } = inputs;
  const ctData = CONCRETE_TYPES.find(c => c.type === concreteType)!;
  const finishData = FORMWORK_FINISHES.find(f => f.finish === formworkFinish)!;

  // Adjust C1 for vibration (vibrated = standard, not vibrated = reduce slightly)
  const c1Adj = vibrated ? ctData.c1 : ctData.c1 * 0.85;
  // Adjust for formwork friction
  const c2Adj = ctData.c2 * finishData.frictionFactor;

  const maxCIRIA = ciriaR108(pourRate, temperature, headHeight, c1Adj, c2Adj);
  const maxHydro = hydrostatic(headHeight);
  const maxDIN = din18218(pourRate, temperature, headHeight, concreteType);

  // Effective head (depth at which max pressure occurs for CIRIA)
  const effectiveHead = maxCIRIA / CONCRETE_DENSITY;
  const savingPercent = maxHydro > 0 ? Math.round((1 - maxCIRIA / maxHydro) * 100) : 0;

  const pressureProfile = generateProfile(pourRate, temperature, headHeight, c1Adj, c2Adj, concreteType);
  const tieSpacing = calculateTieSpacing(maxCIRIA, tieCapacity);
  const prSensitivity = pourRateSensitivity(temperature, headHeight, c1Adj, c2Adj);
  const tSensitivity = tempSensitivity(pourRate, headHeight, c1Adj, c2Adj);

  const recommendations = generateRecommendations(inputs, maxCIRIA, maxHydro, maxDIN, effectiveHead, savingPercent, tieSpacing);

  return {
    maxPressureCIRIA: maxCIRIA, maxPressureHydro: maxHydro, maxPressureDIN: maxDIN,
    effectiveHead: Math.round(effectiveHead * 100) / 100, savingPercent,
    pressureProfile, tieSpacing,
    pourRateSensitivity: prSensitivity, tempSensitivity: tSensitivity,
    recommendations,
  };
}

function generateRecommendations(inputs: FormworkInputs, ciria: number, hydro: number, din: number, effHead: number, saving: number, ties: TieSpacing): string[] {
  const recs: string[] = [];

  recs.push(`CIRIA R108 max lateral pressure: ${ciria} kN/m2 at ${effHead.toFixed(1)}m effective head`);
  recs.push(`DIN 18218 max lateral pressure: ${din} kN/m2 for comparison`);
  recs.push(`Full hydrostatic pressure would be ${hydro} kN/m2 -- CIRIA method saves ${saving}% on formwork design`);

  if (saving < 5) {
    recs.push("Minimal saving over hydrostatic -- pour rate is high relative to setting time. Consider slowing the pour rate.");
  }

  recs.push(`Tie spacing at zone of max pressure: ${ties.hSpacing}m H x ${ties.vSpacing}m V centres (${ties.tiesPerM2} ties/m2) for ${inputs.tieCapacity} kN ties`);

  if (inputs.temperature < 10) {
    recs.push("COLD WEATHER WARNING: Concrete temperature below 10C significantly increases lateral pressure due to slower stiffening. Consider heated formwork or insulation.");
  }
  if (inputs.temperature > 30) {
    recs.push("Hot weather: rapid stiffening reduces lateral pressure but increases risk of cold joints. Maintain adequate pour rate.");
  }
  if (inputs.pourRate > 5) {
    recs.push("High pour rate (>5 m/hr) -- formwork pressures approach hydrostatic. Ensure formwork and ties are designed for these loads.");
  }

  const ctData = CONCRETE_TYPES.find(c => c.type === inputs.concreteType)!;
  if (inputs.concreteType === "opc-retarder") {
    recs.push("Retarded concrete: stiffening is delayed -- lateral pressures are higher than standard OPC. Formwork must be designed accordingly.");
  }

  return recs;
}
