// src/data/fire-risk-score-calculator.ts
// Fire Risk Score Calculator — PAS 79 / Regulatory Reform (Fire Safety) Order 2005
// All data, types, interfaces, question banks, risk matrix, controls

// ─── Types ───────────────────────────────────────────────────────

export type SiteMode = "offices" | "construction" | "occupied";
export type OverallRisk = "low" | "medium" | "high" | "intolerable";

export interface LikelihoodLevel {
  value: number;
  label: string;
  description: string;
}

export interface ConsequenceLevel {
  value: number;
  label: string;
  description: string;
}

export interface RiskMatrixCell {
  likelihood: number;
  consequence: number;
  score: number;
  rating: OverallRisk;
}

export interface FireQuestion {
  id: string;
  text: string;
}

export interface FireSection {
  id: string;
  title: string;
  regulatoryRef: string;
  questions: FireQuestion[];
}

export interface SectionScore {
  sectionId: string;
  likelihood: number;
  consequence: number;
  score: number;
  rating: OverallRisk;
  answers: Record<string, "yes" | "no" | "na" | null>;
}

export interface ActionItem {
  id: string;
  sectionId: string;
  sectionTitle: string;
  description: string;
  responsiblePerson: string;
  targetDate: string;
  priority: OverallRisk;
}

export interface OverallRiskDef {
  level: OverallRisk;
  label: string;
  colour: string;
  bgColour: string;
  borderColour: string;
  description: string;
}

// ─── Likelihood & Consequence Scales (5×5 matrix) ────────────────

export const LIKELIHOOD_LEVELS: LikelihoodLevel[] = [
  { value: 1, label: "Very Unlikely", description: "No foreseeable ignition sources or fuel present" },
  { value: 2, label: "Unlikely", description: "Few ignition sources, fuel separated, good housekeeping" },
  { value: 3, label: "Possible", description: "Some ignition sources present, moderate fuel load" },
  { value: 4, label: "Likely", description: "Multiple ignition sources, significant combustible materials" },
  { value: 5, label: "Very Likely", description: "Hot works, poor housekeeping, high fuel load, known deficiencies" },
];

export const CONSEQUENCE_LEVELS: ConsequenceLevel[] = [
  { value: 1, label: "Negligible", description: "Minor damage, no injuries expected" },
  { value: 2, label: "Minor", description: "Localised damage, minor first-aid injuries" },
  { value: 3, label: "Moderate", description: "Significant damage, medical treatment needed" },
  { value: 4, label: "Major", description: "Major damage, serious injury, hospitalisation" },
  { value: 5, label: "Catastrophic", description: "Structural collapse, death or multiple serious injuries" },
];

// ─── Risk Matrix ─────────────────────────────────────────────────

export function getRiskRating(likelihood: number, consequence: number): OverallRisk {
  const score = likelihood * consequence;
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "intolerable";
}

export function getRiskScore(likelihood: number, consequence: number): number {
  return likelihood * consequence;
}

// Full 5×5 matrix for PDF rendering
export function getFullMatrix(): RiskMatrixCell[] {
  const cells: RiskMatrixCell[] = [];
  for (let l = 1; l <= 5; l++) {
    for (let c = 1; c <= 5; c++) {
      cells.push({ likelihood: l, consequence: c, score: l * c, rating: getRiskRating(l, c) });
    }
  }
  return cells;
}

// ─── Overall Risk Definitions ────────────────────────────────────

export const OVERALL_RISK_DEFS: OverallRiskDef[] = [
  { level: "low", label: "Low Risk", colour: "#16a34a", bgColour: "rgba(22,163,74,0.08)", borderColour: "rgba(22,163,74,0.3)", description: "Risk is adequately controlled. Maintain current fire safety measures and continue monitoring." },
  { level: "medium", label: "Medium Risk", colour: "#d97706", bgColour: "rgba(217,119,6,0.08)", borderColour: "rgba(217,119,6,0.3)", description: "Some deficiencies identified. Improvements required within a reasonable timeframe to reduce risk." },
  { level: "high", label: "High Risk", colour: "#dc2626", bgColour: "rgba(220,38,38,0.08)", borderColour: "rgba(220,38,38,0.3)", description: "Significant fire risk. Urgent action required. Interim measures must be implemented immediately." },
  { level: "intolerable", label: "Intolerable", colour: "#7f1d1d", bgColour: "rgba(127,29,29,0.08)", borderColour: "rgba(127,29,29,0.3)", description: "Works must not continue until risk is reduced. Immediate prohibition of relevant activities." },
];

export const RISK_CARD_STYLES: Record<OverallRisk, { bg: string; border: string; text: string; dot: string }> = {
  low: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  high: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500" },
  intolerable: { bg: "bg-red-100", border: "border-red-400", text: "text-red-900", dot: "bg-red-700" },
};

// ─── Question Banks ──────────────────────────────────────────────

export const FIRE_SECTIONS: Record<SiteMode, FireSection[]> = {
  // ─── Mode A: Site Offices & Welfare ────────────────────
  offices: [
    {
      id: "off-escape", title: "Means of Escape", regulatoryRef: "Article 14 — Emergency routes and exits",
      questions: [
        { id: "off-e1", text: "Are all escape routes clearly signed and unobstructed?" },
        { id: "off-e2", text: "Do all fire doors close fully and are self-closers fitted and operational?" },
        { id: "off-e3", text: "Are emergency exit routes maintained free of storage and combustible materials?" },
        { id: "off-e4", text: "Is emergency lighting installed and tested on escape routes?" },
      ],
    },
    {
      id: "off-detection", title: "Fire Detection & Warning", regulatoryRef: "Article 13 — Fire-fighting and fire detection",
      questions: [
        { id: "off-d1", text: "Is a fire alarm or detection system installed and tested weekly?" },
        { id: "off-d2", text: "Are smoke/heat detectors present in all occupied rooms?" },
        { id: "off-d3", text: "Is the alarm clearly audible throughout all areas?" },
      ],
    },
    {
      id: "off-fighting", title: "Fire-Fighting Equipment", regulatoryRef: "Article 13 — Fire-fighting and fire detection",
      questions: [
        { id: "off-f1", text: "Are fire extinguishers provided, appropriate to the risk, and serviced annually?" },
        { id: "off-f2", text: "Are extinguisher locations clearly signed and accessible?" },
        { id: "off-f3", text: "Have staff been trained on extinguisher use?" },
      ],
    },
    {
      id: "off-housekeeping", title: "Housekeeping & Storage", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "off-h1", text: "Is the general standard of housekeeping good (no excess waste or clutter)?" },
        { id: "off-h2", text: "Are combustible materials stored safely away from ignition sources?" },
        { id: "off-h3", text: "Are bins emptied regularly and waste not allowed to accumulate?" },
      ],
    },
    {
      id: "off-electrical", title: "Electrical Safety", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "off-el1", text: "Is portable electrical equipment PAT tested and in good condition?" },
        { id: "off-el2", text: "Are extension leads not daisy-chained or overloaded?" },
        { id: "off-el3", text: "Is fixed wiring periodically inspected (EICR)?" },
      ],
    },
    {
      id: "off-plan", title: "Emergency Plan & Training", regulatoryRef: "Article 15 — Procedures for serious and imminent danger",
      questions: [
        { id: "off-p1", text: "Is a written emergency/evacuation plan in place and displayed?" },
        { id: "off-p2", text: "Have fire drills been conducted in the last 6 months?" },
        { id: "off-p3", text: "Are all personnel aware of the assembly point and fire procedures?" },
        { id: "off-p4", text: "Are fire wardens appointed and trained?" },
      ],
    },
    {
      id: "off-responsible", title: "Responsible Person Duties", regulatoryRef: "Article 5 — Duties of the responsible person",
      questions: [
        { id: "off-r1", text: "Is a responsible person identified and documented?" },
        { id: "off-r2", text: "Is the fire risk assessment reviewed at least annually?" },
        { id: "off-r3", text: "Are records of fire safety maintenance, testing, and training kept?" },
      ],
    },
  ],

  // ─── Mode B: Live Construction Site ────────────────────
  construction: [
    {
      id: "con-ignition", title: "Ignition Sources", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "con-i1", text: "Are hot works controlled under a permit-to-work system?" },
        { id: "con-i2", text: "Is a fire watch maintained for at least 60 minutes after hot works completion?" },
        { id: "con-i3", text: "Are smoking areas designated and enforced (no smoking except in designated areas)?" },
        { id: "con-i4", text: "Are temporary electrical installations inspected and protected?" },
        { id: "con-i5", text: "Are plant exhausts / generators positioned away from combustible materials?" },
      ],
    },
    {
      id: "con-fuel", title: "Fuel & Combustible Materials", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "con-f1", text: "Are flammable liquids stored in approved containers and bunded areas?" },
        { id: "con-f2", text: "Are gas cylinders stored upright, chained, and in ventilated areas?" },
        { id: "con-f3", text: "Are timber, packaging, and waste materials regularly cleared from work areas?" },
        { id: "con-f4", text: "Is waste separated and removed from the site regularly?" },
        { id: "con-f5", text: "Are COSHH materials stored in accordance with their safety data sheets?" },
      ],
    },
    {
      id: "con-detection", title: "Detection & Warning", regulatoryRef: "Article 13 — Fire-fighting and fire detection",
      questions: [
        { id: "con-d1", text: "Is there an audible fire alarm or alternative warning method covering the whole site?" },
        { id: "con-d2", text: "Are temporary fire detection systems installed where required?" },
        { id: "con-d3", text: "Can the alarm be heard in all areas including those with high background noise?" },
      ],
    },
    {
      id: "con-fighting", title: "Fire-Fighting Equipment", regulatoryRef: "Article 13 — Fire-fighting and fire detection",
      questions: [
        { id: "con-f-e1", text: "Are fire extinguishers provided at hot works locations and key risk areas?" },
        { id: "con-f-e2", text: "Is there adequate water supply or alternative fire-fighting provision?" },
        { id: "con-f-e3", text: "Are fire points signed and accessible (not blocked by materials/plant)?" },
      ],
    },
    {
      id: "con-escape", title: "Means of Escape", regulatoryRef: "Article 14 — Emergency routes and exits",
      questions: [
        { id: "con-es1", text: "Are escape routes maintained and unobstructed at all times?" },
        { id: "con-es2", text: "Are scaffold stairways and access points kept clear?" },
        { id: "con-es3", text: "Is emergency lighting provided in enclosed or below-ground areas?" },
        { id: "con-es4", text: "Are directional signs to assembly points displayed and maintained?" },
      ],
    },
    {
      id: "con-plan", title: "Emergency Plan", regulatoryRef: "Article 15 — Procedures for serious and imminent danger",
      questions: [
        { id: "con-p1", text: "Is a site-specific fire emergency plan in place and communicated at induction?" },
        { id: "con-p2", text: "Are fire drills conducted at regular intervals (at least 6-monthly)?" },
        { id: "con-p3", text: "Is the assembly point location clearly identified and appropriate?" },
        { id: "con-p4", text: "Are roll-call procedures in place to account for all personnel?" },
      ],
    },
    {
      id: "con-security", title: "Site Security & Arson Prevention", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "con-s1", text: "Is the site perimeter secure with anti-climb fencing?" },
        { id: "con-s2", text: "Are combustible materials kept away from site boundaries?" },
        { id: "con-s3", text: "Is there 24-hour security or CCTV monitoring?" },
      ],
    },
    {
      id: "con-responsible", title: "Management & Competence", regulatoryRef: "Article 21 — Training",
      questions: [
        { id: "con-r1", text: "Is a fire safety coordinator identified for the site?" },
        { id: "con-r2", text: "Have all personnel received fire safety induction training?" },
        { id: "con-r3", text: "Is the fire risk assessment reviewed when site conditions change significantly?" },
      ],
    },
  ],

  // ─── Mode C: Occupied Building (refurb/fit-out) ────────
  occupied: [
    {
      id: "occ-interface", title: "Interface with Building Fire Strategy", regulatoryRef: "Article 22 — Co-operation and co-ordination",
      questions: [
        { id: "occ-if1", text: "Has the building's existing fire strategy been reviewed and maintained?" },
        { id: "occ-if2", text: "Are fire compartment walls and floors maintained (no unsealed penetrations)?" },
        { id: "occ-if3", text: "Have works been coordinated with the building's responsible person?" },
        { id: "occ-if4", text: "Are fire-stopping measures in place for all service penetrations?" },
      ],
    },
    {
      id: "occ-escape", title: "Means of Escape", regulatoryRef: "Article 14 — Emergency routes and exits",
      questions: [
        { id: "occ-e1", text: "Are building escape routes maintained and unobstructed by construction works?" },
        { id: "occ-e2", text: "Are alternative escape routes provided where normal routes are affected?" },
        { id: "occ-e3", text: "Is temporary signage installed where permanent signs are obscured?" },
        { id: "occ-e4", text: "Is emergency lighting maintained throughout affected areas?" },
      ],
    },
    {
      id: "occ-detection", title: "Fire Detection & Alarm", regulatoryRef: "Article 13 — Fire-fighting and fire detection",
      questions: [
        { id: "occ-d1", text: "Is the building fire alarm system still operational and maintained?" },
        { id: "occ-d2", text: "Are detectors protected from construction dust/debris (not disabled)?" },
        { id: "occ-d3", text: "Are temporary detector isolations managed under a permit system with compensatory measures?" },
      ],
    },
    {
      id: "occ-hotworks", title: "Hot Works", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "occ-h1", text: "Is a hot works permit system in operation?" },
        { id: "occ-h2", text: "Are fire-resistant blankets/screens used during hot works?" },
        { id: "occ-h3", text: "Is a fire watch maintained for 60 minutes after hot works?" },
        { id: "occ-h4", text: "Are hot works avoided near occupied areas where practicable?" },
      ],
    },
    {
      id: "occ-storage", title: "Material Storage & Housekeeping", regulatoryRef: "Article 9 — Risk assessment",
      questions: [
        { id: "occ-s1", text: "Are construction materials stored safely and not blocking escape routes?" },
        { id: "occ-s2", text: "Are flammable materials stored in appropriate locations away from occupants?" },
        { id: "occ-s3", text: "Is waste removed from the building regularly?" },
        { id: "occ-s4", text: "Is site housekeeping maintained to a high standard?" },
      ],
    },
    {
      id: "occ-occupants", title: "Occupant Safety", regulatoryRef: "Article 15 — Procedures for serious and imminent danger",
      questions: [
        { id: "occ-o1", text: "Are occupants informed of construction activities and any changes to fire procedures?" },
        { id: "occ-o2", text: "Is segregation between construction and occupied areas maintained?" },
        { id: "occ-o3", text: "Are joint emergency procedures agreed between contractor and building management?" },
      ],
    },
    {
      id: "occ-responsible", title: "Management & Co-ordination", regulatoryRef: "Article 22 — Co-operation and co-ordination",
      questions: [
        { id: "occ-r1", text: "Are regular fire safety liaison meetings held with the building responsible person?" },
        { id: "occ-r2", text: "Is the fire risk assessment updated when work phases change?" },
        { id: "occ-r3", text: "Are all workers inducted on building-specific fire procedures?" },
      ],
    },
  ],
};

// ─── Auto-generated Action Recommendations ───────────────────────

export const SECTION_ACTIONS: Record<string, string[]> = {
  // Offices
  "off-escape": [
    "Clear all obstructions from escape routes immediately",
    "Inspect and repair all fire door self-closers",
    "Test and repair emergency lighting on escape routes",
  ],
  "off-detection": [
    "Install smoke/heat detectors in rooms lacking coverage",
    "Establish weekly fire alarm testing regime and maintain records",
    "Replace any non-functioning detector heads",
  ],
  "off-fighting": [
    "Provide appropriate fire extinguishers (min. 1 per 200m² floor area)",
    "Arrange annual extinguisher servicing",
    "Deliver fire extinguisher training to all staff",
  ],
  "off-housekeeping": [
    "Implement daily housekeeping checks and waste clearance",
    "Separate combustible storage from ignition sources",
    "Establish regular waste collection schedule",
  ],
  "off-electrical": [
    "Arrange PAT testing of all portable electrical equipment",
    "Remove daisy-chained extension leads and provide adequate socket outlets",
    "Commission EICR (Electrical Installation Condition Report)",
  ],
  "off-plan": [
    "Prepare and display a written evacuation plan with assembly point details",
    "Conduct a fire drill within the next 2 weeks",
    "Appoint and train fire wardens",
  ],
  "off-responsible": [
    "Formally appoint and document the responsible person",
    "Schedule annual fire risk assessment review",
    "Establish fire safety record keeping system",
  ],
  // Construction
  "con-ignition": [
    "Implement hot works permit-to-work system immediately",
    "Enforce 60-minute fire watch post hot works completion",
    "Enforce designated smoking areas; no exceptions",
    "Inspect all temporary electrical installations",
  ],
  "con-fuel": [
    "Provide bunded storage for flammable liquids",
    "Secure and ventilate gas cylinder storage areas",
    "Clear combustible waste from work areas daily",
  ],
  "con-detection": [
    "Install temporary fire alarm covering all work areas",
    "Test alarm audibility in high-noise areas; install supplementary sounders if needed",
  ],
  "con-fighting": [
    "Provide fire extinguishers at all hot works locations and fire points",
    "Establish adequate water supply or fire-fighting provision",
    "Clear obstructions from fire point locations",
  ],
  "con-escape": [
    "Clear all escape routes and scaffold stairways immediately",
    "Install emergency lighting in enclosed/below-ground areas",
    "Install and maintain directional signs to assembly points",
  ],
  "con-plan": [
    "Prepare site-specific fire emergency plan and include in induction",
    "Conduct fire drill within next 2 weeks",
    "Establish roll-call procedure and test it",
  ],
  "con-security": [
    "Repair perimeter fencing gaps and ensure anti-climb measures",
    "Move combustible materials away from site boundaries",
    "Consider 24-hour security provision or CCTV",
  ],
  "con-responsible": [
    "Formally appoint a fire safety coordinator for the site",
    "Deliver fire safety training to all site personnel",
    "Schedule fire risk assessment review for next phase change",
  ],
  // Occupied
  "occ-interface": [
    "Review and document the building's existing fire strategy",
    "Inspect and maintain all fire compartment integrity",
    "Hold coordination meeting with building responsible person",
    "Install fire stopping for all new service penetrations",
  ],
  "occ-escape": [
    "Clear construction obstructions from building escape routes",
    "Provide and sign alternative escape routes",
    "Install temporary emergency lighting and signage",
  ],
  "occ-detection": [
    "Restore full fire alarm system operability",
    "Protect detectors from construction dust or manage isolations under permit",
    "Install compensatory measures for any isolated detection zones",
  ],
  "occ-hotworks": [
    "Implement hot works permit system",
    "Provide fire-resistant blankets/screens for all hot works",
    "Enforce 60-minute fire watch regime",
  ],
  "occ-storage": [
    "Relocate materials blocking escape routes",
    "Designate approved flammable material storage location",
    "Implement daily waste removal from occupied building",
  ],
  "occ-occupants": [
    "Issue notice to occupants on current construction activities and fire procedure changes",
    "Maintain segregation between construction and occupied areas",
    "Agree joint emergency procedures with building management",
  ],
  "occ-responsible": [
    "Schedule regular fire safety liaison meetings",
    "Update fire risk assessment for current work phase",
    "Deliver building-specific fire induction to all workers",
  ],
};

// ─── Site Mode Labels ────────────────────────────────────────────

export const SITE_MODE_LABELS: Record<SiteMode, { label: string; description: string; icon: string }> = {
  offices: { label: "Site Offices & Welfare", description: "Portacabins, drying rooms, canteens, toilet blocks", icon: "🏢" },
  construction: { label: "Live Construction Site", description: "Active construction areas, compounds, laydown areas", icon: "🏗️" },
  occupied: { label: "Occupied Building (Refurb/Fit-out)", description: "Refurbishment or fit-out works in occupied premises", icon: "🏠" },
};

// ─── Helpers ─────────────────────────────────────────────────────

export function createEmptySectionScore(section: FireSection): SectionScore {
  const answers: Record<string, "yes" | "no" | "na" | null> = {};
  section.questions.forEach(q => { answers[q.id] = null; });
  return {
    sectionId: section.id,
    likelihood: 1,
    consequence: 1,
    score: 1,
    rating: "low",
    answers,
  };
}

export function genId() { return Math.random().toString(36).slice(2, 10); }
