// src/data/site-induction-duration-calculator.ts
// Site Induction Duration Calculator — FREE tool, PAID layout
// Duration recommendations based on UK construction industry best practice
// Note: No legislation specifies induction duration — CDM 2015, HSWA 1974, and
// MHSWR 1999 require that induction is provided but do not prescribe how long it should be

// ─── Types ───────────────────────────────────────────────────
export type InductionType = "contractor" | "visitor" | "delivery-driver";
export type ProjectType = "new-build" | "refurbishment" | "civils" | "demolition" | "meica";
export type RefresherFrequency = "3-months" | "6-months" | "12-months";
export type RiskLevel = "low" | "medium" | "high";

export interface ProjectTypeData {
  id: ProjectType;
  label: string;
  baseMinutes: number;
  description: string;
}

export interface InductionTypeData {
  id: InductionType;
  label: string;
  durationFactor: number;
  description: string;
}

export interface SiteHazard {
  id: string;
  label: string;
  minutes: number;
  category: string;
  highRisk: boolean;
}

export interface ClientBoltOn {
  id: string;
  name: string;
  minutes: number;
}

export interface AgendaItem {
  section: string;
  minutes: number;
  category: "base" | "hazard" | "cdm" | "client";
  colour: string;
}

export interface RefresherResult {
  frequency: RefresherFrequency;
  label: string;
  months: number;
  reasoning: string;
}

export interface TestRecommendation {
  recommended: boolean;
  reasoning: string;
  suggestedQuestions: number;
}

export interface InductionResult {
  totalMinutes: number;
  formattedDuration: string;
  inductionType: InductionTypeData;
  projectType: ProjectTypeData;
  agenda: AgendaItem[];
  hazardCount: number;
  selectedHazards: SiteHazard[];
  cdmNotifiable: boolean;
  cdmMinutes: number;
  clientBoltOns: ClientBoltOn[];
  clientMinutes: number;
  riskLevel: RiskLevel;
  refresher: RefresherResult;
  testRecommendation: TestRecommendation;
  tradeCount: number;
  recommendations: string[];
  tailoringNote: string;
}

// ─── Constants ───────────────────────────────────────────────
export const PROJECT_TYPES: ProjectTypeData[] = [
  { id: "new-build", label: "New Build", baseMinutes: 30, description: "New construction project on a greenfield or cleared site" },
  { id: "refurbishment", label: "Refurbishment", baseMinutes: 35, description: "Works within or around existing occupied or unoccupied structures" },
  { id: "civils", label: "Civil Engineering", baseMinutes: 25, description: "Infrastructure, highways, utilities, drainage, and earthworks" },
  { id: "demolition", label: "Demolition", baseMinutes: 40, description: "Full or partial demolition including soft strip and enabling works" },
  { id: "meica", label: "MEICA / Process", baseMinutes: 30, description: "Mechanical, electrical, instrumentation, control, and automation" },
];

export const INDUCTION_TYPES: InductionTypeData[] = [
  { id: "contractor", label: "Contractor / Operative", durationFactor: 1.0, description: "Full site induction for contractors, operatives, and subcontractors working on site" },
  { id: "visitor", label: "Visitor", durationFactor: 0.4, description: "Abbreviated induction for accompanied visitors, client reps, and inspectors" },
  { id: "delivery-driver", label: "Delivery Driver", durationFactor: 0.25, description: "Brief safety briefing for delivery drivers entering the site boundary" },
];

export const SITE_HAZARDS: SiteHazard[] = [
  { id: "working-at-height", label: "Working at Height", minutes: 5, category: "Physical", highRisk: true },
  { id: "confined-spaces", label: "Confined Spaces", minutes: 5, category: "Physical", highRisk: true },
  { id: "excavations", label: "Excavations & Trenches", minutes: 4, category: "Physical", highRisk: true },
  { id: "live-services", label: "Live Services / Underground Utilities", minutes: 4, category: "Physical", highRisk: true },
  { id: "asbestos", label: "Asbestos", minutes: 5, category: "Substances", highRisk: true },
  { id: "contaminated-land", label: "Contaminated Land", minutes: 4, category: "Environmental", highRisk: true },
  { id: "lifting-ops", label: "Crane / Lifting Operations", minutes: 4, category: "Plant", highRisk: true },
  { id: "hot-works", label: "Hot Works", minutes: 3, category: "Fire", highRisk: false },
  { id: "mobile-plant", label: "Mobile Plant & Vehicles", minutes: 3, category: "Plant", highRisk: false },
  { id: "temporary-works", label: "Temporary Works", minutes: 2, category: "Structural", highRisk: false },
  { id: "noise-vibration", label: "Noise / Vibration", minutes: 2, category: "Physical", highRisk: false },
  { id: "coshh", label: "Hazardous Substances (COSHH)", minutes: 3, category: "Substances", highRisk: false },
  { id: "manual-handling", label: "Manual Handling", minutes: 2, category: "Physical", highRisk: false },
  { id: "lone-working", label: "Lone Working", minutes: 2, category: "Organisational", highRisk: false },
  { id: "night-shift", label: "Night / Shift Work", minutes: 2, category: "Organisational", highRisk: false },
  { id: "work-near-water", label: "Work Near Water", minutes: 4, category: "Environmental", highRisk: true },
  { id: "work-near-railway", label: "Work Near Railway", minutes: 5, category: "Physical", highRisk: true },
  { id: "work-near-highways", label: "Work Near Highways / Live Traffic", minutes: 3, category: "Physical", highRisk: false },
  { id: "fragile-surfaces", label: "Fragile Surfaces / Roofs", minutes: 4, category: "Physical", highRisk: true },
  { id: "electrical-work", label: "Electrical Work", minutes: 4, category: "Physical", highRisk: true },
];

export const CDM_MODULE_MINUTES = 10;
export const MAX_BOLT_ON_MINUTES = 60;

export const AGENDA_COLOURS: Record<string, string> = {
  base: "#3B82F6",
  hazard: "#F97316",
  cdm: "#8B5CF6",
  client: "#06B6D4",
};

// ─── Guidance & Regulatory References ─────────────────────────
// These regulations require that induction is provided — they do NOT specify duration.
// The duration recommendations in this tool are based on UK construction industry best practice.
export const GUIDANCE_REFERENCES = [
  { ref: "CDM 2015 reg 13(4)(a)", title: "Principal contractor duty — site induction", description: "The principal contractor must ensure that a suitable site induction is provided. This is the statutory anchor for site induction in UK construction. Does not prescribe duration or content." },
  { ref: "CDM 2015 reg 8", title: "General duties — competence", description: "Requires that workers have the necessary skills, knowledge, training, and experience for the work, and that information and instruction is comprehensible. Underpins induction content but does not prescribe duration." },
  { ref: "HSWA 1974 s2(2)(c)", title: "General duties of employers", description: "Duty to provide such information, instruction, training, and supervision as is necessary. Duration is a matter of professional judgement." },
  { ref: "MHSWR 1999 reg 13", title: "Capabilities and training", description: "Requires adequate health and safety training on recruitment and when exposed to new or increased risks. No prescribed duration." },
  { ref: "HSE L153", title: "Managing health and safety in construction (CDM 2015 guidance)", description: "HSE guidance on the legal requirements for CDM 2015. Discusses induction content and proportionality but does not specify duration." },
  { ref: "Industry best practice", title: "Duration recommendations", description: "The time allocations in this tool are based on UK construction industry best practice and professional experience. They are not mandated by any regulation. The person delivering the induction should use professional judgement to adjust duration to suit the audience and site conditions." },
];

// ─── Base agenda sections ────────────────────────────────────
const BASE_SECTIONS = [
  { section: "Welcome & project overview", pct: 0.12 },
  { section: "Site layout, access & egress", pct: 0.10 },
  { section: "Emergency procedures & assembly", pct: 0.12 },
  { section: "PPE requirements", pct: 0.08 },
  { section: "Welfare facilities", pct: 0.06 },
  { section: "Reporting accidents & near misses", pct: 0.08 },
  { section: "Environmental controls", pct: 0.08 },
  { section: "Housekeeping & waste management", pct: 0.07 },
  { section: "Permits to work / authorisation", pct: 0.08 },
  { section: "Management structure & contacts", pct: 0.06 },
  { section: "Communication & consultation", pct: 0.05 },
  { section: "Questions & sign-off", pct: 0.10 },
];

// ─── Calculation ─────────────────────────────────────────────
export function calculateInduction(
  projectTypeId: ProjectType,
  inductionTypeId: InductionType,
  selectedHazardIds: string[],
  cdmNotifiable: boolean,
  clientBoltOns: ClientBoltOn[],
  tradeCount: number,
): InductionResult {
  const projectType = PROJECT_TYPES.find(p => p.id === projectTypeId)!;
  const inductionType = INDUCTION_TYPES.find(t => t.id === inductionTypeId)!;
  const selectedHazards = SITE_HAZARDS.filter(h => selectedHazardIds.includes(h.id));
  const factor = inductionType.durationFactor;

  // Base time (scaled by induction type)
  const scaledBase = Math.round(projectType.baseMinutes * factor);

  // Hazard time (scaled by induction type)
  const rawHazardMinutes = selectedHazards.reduce((sum, h) => sum + h.minutes, 0);
  const scaledHazardMinutes = Math.round(rawHazardMinutes * factor);

  // CDM module (scaled)
  const cdmMinutes = cdmNotifiable ? Math.round(CDM_MODULE_MINUTES * factor) : 0;

  // Client bolt-ons (scaled)
  const rawClientMinutes = clientBoltOns.reduce((sum, b) => sum + b.minutes, 0);
  const scaledClientMinutes = Math.round(rawClientMinutes * factor);

  // Build agenda
  const agenda: AgendaItem[] = [];

  // Base sections — largest-remainder method to avoid rounding mismatch
  {
    const raw = BASE_SECTIONS.map(s => ({ ...s, exact: scaledBase * s.pct }));
    const floored = raw.map(r => Math.max(1, Math.floor(r.exact)));
    let remainder = scaledBase - floored.reduce((a, b) => a + b, 0);
    // Sort by fractional part descending, distribute remainder
    const indices = raw.map((_, i) => i).sort((a, b) => (raw[b].exact - Math.floor(raw[b].exact)) - (raw[a].exact - Math.floor(raw[a].exact)));
    for (const idx of indices) {
      if (remainder <= 0) break;
      floored[idx]++;
      remainder--;
    }
    BASE_SECTIONS.forEach((s, i) => {
      agenda.push({ section: s.section, minutes: floored[i], category: "base", colour: AGENDA_COLOURS.base });
    });
  }

  // Hazard sections — same approach
  if (selectedHazards.length > 0) {
    const rawH = selectedHazards.map(h => ({ ...h, exact: h.minutes * factor }));
    const flooredH = rawH.map(r => Math.max(1, Math.floor(r.exact)));
    let remainderH = scaledHazardMinutes - flooredH.reduce((a, b) => a + b, 0);
    const indicesH = rawH.map((_, i) => i).sort((a, b) => (rawH[b].exact - Math.floor(rawH[b].exact)) - (rawH[a].exact - Math.floor(rawH[a].exact)));
    for (const idx of indicesH) {
      if (remainderH <= 0) break;
      flooredH[idx]++;
      remainderH--;
    }
    selectedHazards.forEach((h, i) => {
      agenda.push({ section: h.label, minutes: flooredH[i], category: "hazard", colour: AGENDA_COLOURS.hazard });
    });
  }

  // CDM module
  if (cdmNotifiable) {
    agenda.push({ section: "CDM 2015 site rules & notification", minutes: cdmMinutes, category: "cdm", colour: AGENDA_COLOURS.cdm });
  }

  // Client bolt-ons — same largest-remainder approach
  if (clientBoltOns.length > 0) {
    const rawC = clientBoltOns.map(b => ({ ...b, exact: b.minutes * factor }));
    const flooredC = rawC.map(r => Math.max(1, Math.floor(r.exact)));
    let remainderC = scaledClientMinutes - flooredC.reduce((a, b) => a + b, 0);
    const indicesC = rawC.map((_, i) => i).sort((a, b) => (rawC[b].exact - Math.floor(rawC[b].exact)) - (rawC[a].exact - Math.floor(rawC[a].exact)));
    for (const idx of indicesC) {
      if (remainderC <= 0) break;
      flooredC[idx]++;
      remainderC--;
    }
    clientBoltOns.forEach((b, i) => {
      agenda.push({ section: b.name, minutes: flooredC[i], category: "client", colour: AGENDA_COLOURS.client });
    });
  }

  // Total = actual agenda sum (avoids rounding mismatch)
  const totalMinutes = agenda.reduce((sum, a) => sum + a.minutes, 0);

  // Risk level
  const highRiskCount = selectedHazards.filter(h => h.highRisk).length;
  const riskLevel: RiskLevel =
    highRiskCount >= 5 || selectedHazards.length >= 12 || projectTypeId === "demolition"
      ? "high"
      : highRiskCount >= 2 || selectedHazards.length >= 6
        ? "medium"
        : "low";

  // Refresher frequency
  const refresher = calculateRefresher(riskLevel, projectTypeId);

  // Test recommendation
  const testRecommendation = calculateTestRecommendation(cdmNotifiable, selectedHazards.length, projectTypeId, highRiskCount);

  // Recommendations
  const recommendations = buildRecommendations(inductionType, projectType, selectedHazards, cdmNotifiable, riskLevel, tradeCount);

  // Tailoring note
  const tailoringNote = "This induction duration is the recommended maximum. The briefer should tailor content to suit the audience -- not all attendees will need every section. For example, a returning operative who has previously completed the full induction may only require a refresher covering changes since their last attendance. The person delivering the induction should use professional judgement to adjust the agenda, skip sections not relevant to the attendees' role, and focus on the hazards that apply to their specific scope of work.";

  return {
    totalMinutes,
    formattedDuration: formatDuration(totalMinutes),
    inductionType,
    projectType,
    agenda,
    hazardCount: selectedHazards.length,
    selectedHazards,
    cdmNotifiable,
    cdmMinutes,
    clientBoltOns,
    clientMinutes: agenda.filter(a => a.category === "client").reduce((s, a) => s + a.minutes, 0),
    riskLevel,
    refresher,
    testRecommendation,
    tradeCount,
    recommendations,
    tailoringNote,
  };
}

function calculateRefresher(riskLevel: RiskLevel, projectTypeId: ProjectType): RefresherResult {
  if (riskLevel === "high" || projectTypeId === "demolition") {
    return {
      frequency: "3-months",
      label: "Every 3 months",
      months: 3,
      reasoning: "High-risk hazard profile or demolition project. Frequent refresher inductions ensure operatives remain aware of evolving site conditions and control measures.",
    };
  }
  if (riskLevel === "medium") {
    return {
      frequency: "6-months",
      label: "Every 6 months",
      months: 6,
      reasoning: "Moderate hazard profile. Six-monthly refreshers maintain awareness without excessive disruption to programme.",
    };
  }
  return {
    frequency: "12-months",
    label: "Every 12 months",
    months: 12,
    reasoning: "Low-risk hazard profile. Annual refresher inductions are sufficient, but should be supplemented with toolbox talks on specific topics as needed.",
  };
}

function calculateTestRecommendation(cdmNotifiable: boolean, hazardCount: number, projectTypeId: ProjectType, highRiskCount: number): TestRecommendation {
  if (projectTypeId === "demolition" || highRiskCount >= 5) {
    return {
      recommended: true,
      reasoning: "High-risk project type or significant number of high-risk hazards. A short comprehension test helps confirm operatives have understood the key safety messages.",
      suggestedQuestions: 10,
    };
  }
  if (cdmNotifiable || hazardCount >= 5) {
    return {
      recommended: true,
      reasoning: "CDM notifiable project or 5+ hazards present. A short comprehension test is recommended to verify understanding of site-specific risks.",
      suggestedQuestions: 5,
    };
  }
  return {
    recommended: false,
    reasoning: "Lower risk profile. A formal test is not essential, but verbal confirmation of understanding at the end of the induction is still recommended.",
    suggestedQuestions: 0,
  };
}

function buildRecommendations(
  inductionType: InductionTypeData,
  projectType: ProjectTypeData,
  selectedHazards: SiteHazard[],
  cdmNotifiable: boolean,
  riskLevel: RiskLevel,
  tradeCount: number,
): string[] {
  const recs: string[] = [];

  if (inductionType.id === "contractor") {
    recs.push("Ensure all operatives sign the site induction register and receive a site induction card or sticker before commencing work.");
  }
  if (inductionType.id === "visitor") {
    recs.push("Visitors must be accompanied by a competent person at all times while on site. Issue visitor passes and collect on departure.");
  }
  if (inductionType.id === "delivery-driver") {
    recs.push("Delivery drivers must remain in designated areas unless escorted. Issue a brief safety information card covering reversing, PPE, and emergency procedures.");
  }

  if (cdmNotifiable) {
    recs.push("As a CDM 2015 notifiable project, the Principal Contractor must ensure the F10 is displayed on site and that all workers receive induction before starting work (CDM 2015 reg 13(4)(a)).");
  }

  if (riskLevel === "high") {
    recs.push("High-risk hazard profile -- consider requiring operatives to pass a short comprehension test before receiving induction sign-off.");
  }

  if (tradeCount > 5) {
    recs.push(`With ${tradeCount} trades on site, consider including an interface management section covering work coordination, segregation, and communication between trades.`);
  }

  if (selectedHazards.some(h => h.id === "asbestos")) {
    recs.push("Asbestos awareness training (CAR 2012 reg 10) must be provided before any work that may disturb ACMs. Site induction does not replace formal asbestos awareness training.");
  }

  if (selectedHazards.some(h => h.id === "confined-spaces")) {
    recs.push("Confined space entry requires separate task-specific training and a permit to work. Use the Working at Height Risk Score Calculator for related height access assessments.");
  }

  if (selectedHazards.some(h => h.id === "working-at-height")) {
    recs.push("Use the Working at Height Risk Score Calculator for detailed height-related risk scoring and control recommendations.");
  }

  recs.push("Deliver the induction in a language and format understood by all attendees. Consider translated materials, visual aids, or interpreter support where necessary.");
  recs.push("Retain signed induction records for the duration of the project plus 6 years (per MHSWR 1999 reg 13 and Limitation Act 1980).");

  return recs;
}

// ─── Helpers ─────────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export const RISK_LEVEL_STYLES: Record<RiskLevel, { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; rgb: number[] }> = {
  low: { label: "Low Risk", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", rgb: [22, 163, 74] },
  medium: { label: "Medium Risk", bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500", rgb: [234, 179, 8] },
  high: { label: "High Risk", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", rgb: [220, 38, 38] },
};
