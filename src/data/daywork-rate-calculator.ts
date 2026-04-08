// src/data/daywork-rate-calculator.ts
// Daywork Rate Calculator — RICS Definition of Prime Cost of Daywork

// ─── Types ───────────────────────────────────────────────────
export type RICSEdition = "civil" | "building";

export interface LabourGrade {
  id: string;
  label: string;
  baseRate: number; // £/hr — CIJC 2025/26 defaults
}

export interface LabourLine {
  id: string;
  gradeId: string;
  customLabel: string;
  numOperatives: number;
  hours: number;
  baseRate: number; // user-editable
}

export interface PlantLine {
  id: string;
  description: string;
  rateType: "week" | "day" | "hour";
  hireRate: number;
  quantity: number; // weeks/days/hours used
}

export interface MaterialLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface DayworkResult {
  labourBase: number;
  labourAddition: number;
  labourTotal: number;
  labourLines: { label: string; operatives: number; hours: number; rate: number; base: number; addition: number; total: number }[];
  plantBase: number;
  plantAddition: number;
  plantTotal: number;
  plantLines: { description: string; rateType: string; hireRate: number; qty: number; base: number; addition: number; total: number }[];
  materialsBase: number;
  materialsAddition: number;
  materialsTotal: number;
  materialsLines: { description: string; qty: number; unit: string; unitCost: number; base: number; addition: number; total: number }[];
  grandTotal: number;
  labourPct: number;
  plantPct: number;
  materialsPct: number;
  measuredComparison: { measuredCost: number; premium: number; premiumPct: number } | null;
  recommendations: string[];
}

// ─── Constants ───────────────────────────────────────────────

export const LABOUR_GRADES: LabourGrade[] = [
  { id: "general",     label: "General Operative",   baseRate: 15.75 },
  { id: "skilled",     label: "Skilled Operative",    baseRate: 17.50 },
  { id: "craftsman",   label: "Craftsman",            baseRate: 18.75 },
  { id: "chargehand",  label: "Chargehand",           baseRate: 19.85 },
  { id: "foreman",     label: "Foreman",              baseRate: 21.50 },
  { id: "plant-op",    label: "Plant Operator",       baseRate: 18.25 },
  { id: "hgv-driver",  label: "HGV Driver",           baseRate: 17.80 },
  { id: "banksman",    label: "Banksman / Slinger",   baseRate: 17.00 },
  { id: "steel-fixer", label: "Steel Fixer",          baseRate: 19.25 },
  { id: "pipelayer",   label: "Pipelayer",            baseRate: 18.50 },
  { id: "shuttering",  label: "Shuttering Joiner",    baseRate: 19.50 },
  { id: "custom",      label: "Custom / Other",       baseRate: 16.00 },
];

/** RICS default percentage additions — Civil Engineering vs Building */
export const RICS_DEFAULTS: Record<RICSEdition, { labourPct: number; plantPct: number; materialsPct: number; description: string }> = {
  civil: {
    labourPct: 156,
    plantPct: 15,
    materialsPct: 15,
    description: "RICS Definition of Prime Cost of Daywork — Civil Engineering Edition. Labour addition covers employer's NI, CITB levy, holiday pay, pension, travel, supervision, overheads, and profit.",
  },
  building: {
    labourPct: 127,
    plantPct: 15,
    materialsPct: 15,
    description: "RICS Definition of Prime Cost of Daywork — Building Edition. Labour addition covers employer's NI, CITB levy, holiday pay, pension, travel, supervision, overheads, and profit.",
  },
};

export const RICS_EDITIONS: { value: RICSEdition; label: string }[] = [
  { value: "civil", label: "Civil Engineering" },
  { value: "building", label: "Building" },
];

// ─── ID Generator ────────────────────────────────────────────
let _counter = 0;
export function nextLineId(prefix: string): string {
  return `${prefix}-${++_counter}-${Date.now()}`;
}

// ─── Calculation ─────────────────────────────────────────────
export function calculateDaywork(
  labourLines: LabourLine[],
  plantLines: PlantLine[],
  materialLines: MaterialLine[],
  labourAdditionPct: number,
  plantAdditionPct: number,
  materialsAdditionPct: number,
  measuredCost: number | null,
): DayworkResult {
  // Labour
  const labourCalc = labourLines.map(l => {
    const grade = LABOUR_GRADES.find(g => g.id === l.gradeId);
    const label = l.gradeId === "custom" && l.customLabel ? l.customLabel : (grade?.label || "Unknown");
    const base = l.numOperatives * l.hours * l.baseRate;
    const addition = base * (labourAdditionPct / 100);
    return { label, operatives: l.numOperatives, hours: l.hours, rate: l.baseRate, base: r2(base), addition: r2(addition), total: r2(base + addition) };
  });
  const labourBase = labourCalc.reduce((s, l) => s + l.base, 0);
  const labourAddition = labourCalc.reduce((s, l) => s + l.addition, 0);
  const labourTotal = r2(labourBase + labourAddition);

  // Plant
  const plantCalc = plantLines.map(p => {
    const base = p.hireRate * p.quantity;
    const addition = base * (plantAdditionPct / 100);
    return { description: p.description || "Plant item", rateType: p.rateType, hireRate: p.hireRate, qty: p.quantity, base: r2(base), addition: r2(addition), total: r2(base + addition) };
  });
  const plantBase = plantCalc.reduce((s, p) => s + p.base, 0);
  const plantAddition = plantCalc.reduce((s, p) => s + p.addition, 0);
  const plantTotal = r2(plantBase + plantAddition);

  // Materials
  const matCalc = materialLines.map(m => {
    const base = m.quantity * m.unitCost;
    const addition = base * (materialsAdditionPct / 100);
    return { description: m.description || "Material", qty: m.quantity, unit: m.unit || "nr", unitCost: m.unitCost, base: r2(base), addition: r2(addition), total: r2(base + addition) };
  });
  const materialsBase = matCalc.reduce((s, m) => s + m.base, 0);
  const materialsAddition = matCalc.reduce((s, m) => s + m.addition, 0);
  const materialsTotal = r2(materialsBase + materialsAddition);

  const grandTotal = r2(labourTotal + plantTotal + materialsTotal);

  // Percentages of grand total
  const labourPct = grandTotal > 0 ? Math.round((labourTotal / grandTotal) * 100) : 0;
  const plantPct = grandTotal > 0 ? Math.round((plantTotal / grandTotal) * 100) : 0;
  const materialsPct = grandTotal > 0 ? 100 - labourPct - plantPct : 0;

  // Measured comparison
  let measuredComparison: DayworkResult["measuredComparison"] = null;
  if (measuredCost !== null && measuredCost > 0 && grandTotal > 0) {
    const premium = r2(grandTotal - measuredCost);
    const premiumPct = Math.round((premium / measuredCost) * 100);
    measuredComparison = { measuredCost, premium, premiumPct };
  }

  // Recommendations
  const recommendations: string[] = [];
  if (labourPct > 80) {
    recommendations.push("Labour accounts for over 80% of total daywork cost. This is typical for labour-intensive remedial or finishing works.");
  }
  if (grandTotal > 5000) {
    recommendations.push("Daywork total exceeds GBP 5,000. Consider whether a variation order with measured rates would be more cost-effective.");
  }
  if (measuredComparison && measuredComparison.premium > 0) {
    recommendations.push(`Daywork costs GBP ${measuredComparison.premium.toFixed(2)} more than measured rates (${measuredComparison.premiumPct}% premium). Document the justification for daywork valuation.`);
  }
  if (measuredComparison && measuredComparison.premium < 0) {
    recommendations.push(`Daywork is GBP ${Math.abs(measuredComparison.premium).toFixed(2)} cheaper than measured rates. Daywork valuation is favourable on this occasion.`);
  }
  recommendations.push("Daywork must be authorised by the PM/Engineer before execution under most standard forms (NEC4 cl. 62, JCT cl. 5.7, ICE cl. 56). Ensure daywork sheets are signed daily.");
  recommendations.push("Percentage additions are based on the RICS Definition of Prime Cost of Daywork. Verify the applicable edition and any contract-specific amendments.");

  return {
    labourBase: r2(labourBase), labourAddition: r2(labourAddition), labourTotal,
    labourLines: labourCalc,
    plantBase: r2(plantBase), plantAddition: r2(plantAddition), plantTotal,
    plantLines: plantCalc,
    materialsBase: r2(materialsBase), materialsAddition: r2(materialsAddition), materialsTotal,
    materialsLines: matCalc,
    grandTotal, labourPct, plantPct, materialsPct,
    measuredComparison,
    recommendations,
  };
}

function r2(n: number): number { return Math.round(n * 100) / 100; }

// ─── Formatting ──────────────────────────────────────────────
export function fmtGBP(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
