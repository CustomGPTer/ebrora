// =============================================================================
// AI Tools — Tool Configuration
// Central config for all 7 AI document generators.
// Each tool has one output template (unlike RAMS which has 10).
// =============================================================================
import { AiToolConfig, AiToolSlug } from './types';

export const AI_TOOL_CONFIGS: Record<AiToolSlug, AiToolConfig> = {
  coshh: {
    slug: 'coshh',
    name: 'COSHH Assessment Generator',
    shortName: 'COSHH Assessment',
    description:
      'Generate a professional COSHH assessment for any hazardous substance. Just name the product — our AI looks up the SDS data and builds a regulation-compliant assessment tailored to your specific work activity.',
    route: '/coshh-builder',
    pageTitle: 'COSHH Assessment Generator | Ebrora',
    metaDescription:
      'AI-powered COSHH assessment generator for UK construction. Name the product, answer 3 questions, get a professional COSHH assessment with real SDS data. Regulation compliant.',
    documentLabel: 'COSHH Assessment',
    descriptionPlaceholder:
      'Briefly describe your project and site. E.g. "Salford WwTW – AMP8 works, painting steelwork in the new chemical dosing kiosk"',
    descriptionExample:
      'Salford WwTW – AMP8 Improvements. Protective coating works to structural steelwork in the new chemical dosing kiosk.',
    keySections: [
      'Product Identification & GHS Classification',
      'Hazard & Precautionary Statements',
      'Exposure Routes & Health Effects',
      'Control Measures (Hierarchy of Control)',
      'PPE Requirements',
      'First Aid Measures',
      'Storage, Spill & Disposal',
      'Monitoring & Health Surveillance',
    ],
    accentColor: 'D4380D',
    iconType: 'shield',
  },

  itp: {
    slug: 'itp',
    name: 'ITP Generator',
    shortName: 'Inspection & Test Plan',
    description:
      'Generate inspection and test plans tailored to your construction works. Hold points, witness points, review points, and sign-off matrices — all mapped to your work activities.',
    route: '/itp-builder',
    pageTitle: 'ITP Generator – Inspection & Test Plans | Ebrora',
    metaDescription:
      'AI-powered inspection and test plan generator for UK construction. Hold points, witness points, sign-off matrices, and quality verification — built for your specific works.',
    documentLabel: 'Inspection & Test Plan',
    descriptionPlaceholder:
      'Describe the works package requiring an ITP. E.g. "Installation of 300mm diameter ductile iron rising main including thrust blocks, valve chambers, and pressure testing..."',
    descriptionExample:
      'Installation of 300mm diameter ductile iron rising main from new pump station to existing connection chamber. Includes thrust blocks, air valves, washout chambers, chlorination, and pressure testing to 1.5x working pressure.',
    keySections: [
      'Work Activity Breakdown',
      'Inspection & Test Matrix',
      'Hold Points',
      'Witness Points',
      'Review Points',
      'Acceptance Criteria',
      'Reference Standards & Specifications',
      'Sign-Off & Approval Record',
    ],
    accentColor: '1D6FB8',
    iconType: 'clipboard',
  },

  'manual-handling': {
    slug: 'manual-handling',
    name: 'Manual Handling Risk Assessment',
    shortName: 'Manual Handling RA',
    description:
      'Generate manual handling risk assessments using the TILE methodology. Covers task analysis, individual capability, load characteristics, and environmental factors.',
    route: '/manual-handling-builder',
    pageTitle: 'Manual Handling Risk Assessment Generator | Ebrora',
    metaDescription:
      'AI-powered manual handling risk assessment generator using TILE methodology. Task, individual, load, and environment analysis for UK construction activities.',
    documentLabel: 'Manual Handling Risk Assessment',
    descriptionPlaceholder:
      'Describe the manual handling activity. E.g. "Lifting and positioning precast concrete kerbs (45kg each) along a 200m length of new footpath..."',
    descriptionExample:
      'Lifting and positioning precast concrete kerbs (45kg each) along a 200m length of new footpath. Two-person lift from delivery pallet at ground level to trench edge. Uneven ground, slight gradient, repeated lifts throughout the day.',
    keySections: [
      'Task Analysis',
      'Individual Capability Assessment',
      'Load Characteristics',
      'Environmental Factors',
      'TILE Risk Scoring',
      'Control Measures',
      'Mechanical Aids & Alternatives',
      'Review & Monitoring',
    ],
    accentColor: '7C3AED',
    iconType: 'alert',
  },

  dse: {
    slug: 'dse',
    name: 'DSE Assessment Generator',
    shortName: 'DSE Assessment',
    description:
      'Generate display screen equipment assessments for office workstations and site welfare facilities. Covers posture, screen setup, lighting, and eye strain considerations.',
    route: '/dse-builder',
    pageTitle: 'DSE Assessment Generator | Ebrora',
    metaDescription:
      'AI-powered DSE workstation assessment generator. Display screen equipment assessments covering posture, screen setup, lighting, and eye strain for UK workplaces.',
    documentLabel: 'DSE Assessment',
    descriptionPlaceholder:
      'Describe the workstation and user. E.g. "Site office portakabin workstation for a project manager using dual monitors, 8 hours per day. Shared desk environment..."',
    descriptionExample:
      'Site office portakabin workstation for a project manager using dual monitors 8 hours per day. Shared desk in an open-plan 10-person portakabin. User wears glasses and reports occasional neck stiffness.',
    keySections: [
      'Workstation Setup',
      'Display Screen & Equipment',
      'Chair & Seating Assessment',
      'Desk & Work Surface',
      'Lighting & Glare',
      'Posture & Comfort',
      'Eye & Eyesight',
      'Software & Task Design',
      'Recommendations & Action Plan',
    ],
    accentColor: '059669',
    iconType: 'eye',
  },

  'drawing-checker': {
    slug: 'drawing-checker',
    name: 'Drawing Checker',
    shortName: 'Drawing Check Report',
    description:
      'AI-powered drawing review tool. Generates a structured check report identifying missing details, annotation gaps, dimension queries, and compliance issues on construction drawings.',
    route: '/drawing-checker',
    pageTitle: 'AI Drawing Checker for Construction | Ebrora',
    metaDescription:
      'AI-powered construction drawing checker. Identifies missing details, annotation gaps, dimension queries, and compliance issues. Generates a formal drawing check report.',
    documentLabel: 'Drawing Check Report',
    descriptionPlaceholder:
      'Describe the drawing(s) to be checked. E.g. "General arrangement drawing for a new 2000m³ storm tank including plan, sections, and reinforcement details..."',
    descriptionExample:
      'General arrangement drawing for a new 2000m³ storm tank at Salford WwTW. Drawing ref SK-001 Rev P2. Includes plan view, two cross-sections, and cover slab reinforcement details. Designer: XYZ Consultants.',
    keySections: [
      'Drawing Identification',
      'General Completeness Check',
      'Dimensions & Setting Out',
      'Annotations & Notes',
      'Cross-Reference Verification',
      'Buildability Review',
      'Compliance & Standards Check',
      'Action Items & Queries',
    ],
    accentColor: 'B45309',
    iconType: 'search',
  },

  'tbt-generator': {
    slug: 'tbt-generator',
    name: 'Toolbox Talk Generator',
    shortName: 'Toolbox Talk',
    description:
      'Generate bespoke toolbox talks for any activity, hazard, or site condition. Site-specific, briefing-ready, with attendance record — tailored to your project.',
    route: '/tbt-builder',
    pageTitle: 'AI Toolbox Talk Generator | Ebrora',
    metaDescription:
      'AI-powered toolbox talk generator for UK construction sites. Generate site-specific safety briefings with attendance records for any activity or hazard.',
    documentLabel: 'Toolbox Talk',
    descriptionPlaceholder:
      'Describe the topic or activity for the toolbox talk. E.g. "Working near live underground services during excavation works on an operational wastewater treatment site..."',
    descriptionExample:
      'Working near live underground services (HV cables, gas mains, water mains) during excavation works for new drainage on an operational wastewater treatment site. CAT & Genny scanning required, hand-dig within 500mm of services.',
    keySections: [
      'Topic & Activity Description',
      'Key Hazards',
      'Control Measures',
      'Do\'s and Don\'ts',
      'Emergency Procedures',
      'Key Discussion Points',
      'Attendance Record',
    ],
    accentColor: '0891B2',
    iconType: 'chat',
  },

  'confined-spaces': {
    slug: 'confined-spaces',
    name: 'Confined Space Assessment',
    shortName: 'Confined Space RA',
    description:
      'Generate confined space risk assessments covering atmospheric hazards, entry/exit, emergency rescue plans, permits, gas monitoring, and communication requirements.',
    route: '/confined-spaces-builder',
    pageTitle: 'Confined Space Risk Assessment Generator | Ebrora',
    metaDescription:
      'AI-powered confined space risk assessment generator. Atmospheric hazards, entry procedures, rescue plans, permits, and monitoring requirements for UK construction.',
    documentLabel: 'Confined Space Risk Assessment',
    descriptionPlaceholder:
      'Describe the confined space and the work to be carried out. E.g. "Entry into a 4m deep wet well at a wastewater pumping station to replace submersible pump and guide rails..."',
    descriptionExample:
      'Entry into a 4m deep wet well at a wastewater pumping station to replace submersible pump and guide rails. Well is 3m × 2m, access via vertical ladder. Known H₂S risk from sewage. Two-person entry team plus top-man. Work duration approximately 6 hours.',
    keySections: [
      'Confined Space Identification',
      'Atmospheric Hazard Assessment',
      'Entry & Exit Procedures',
      'Permit to Work Requirements',
      'Gas Monitoring & Alarm Levels',
      'Ventilation Requirements',
      'Communication Plan',
      'Emergency Rescue Plan',
      'PPE & Equipment Requirements',
    ],
    accentColor: 'DC2626',
    iconType: 'lock',
  },
};

/** Ordered array of tool slugs for display */
export const AI_TOOL_ORDER: AiToolSlug[] = [
  'coshh',
  'itp',
  'manual-handling',
  'dse',
  'drawing-checker',
  'tbt-generator',
  'confined-spaces',
];

/** Helper to get config by slug */
export function getAiToolConfig(slug: AiToolSlug): AiToolConfig {
  return AI_TOOL_CONFIGS[slug];
}

/** Validate a string is a valid AiToolSlug */
export function isValidAiToolSlug(slug: string): slug is AiToolSlug {
  return slug in AI_TOOL_CONFIGS;
}

/** Map route path to tool slug (for middleware / routing) */
export function getToolSlugFromRoute(route: string): AiToolSlug | null {
  const entry = Object.values(AI_TOOL_CONFIGS).find((c) => c.route === route);
  return entry?.slug ?? null;
}
