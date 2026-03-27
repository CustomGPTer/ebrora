// =============================================================================
// AI Tools — Tool Configuration
// Central config for all 29 AI document generators.
// Each tool has one output template (unlike RAMS which has 10).
// New 13 tools use premiumTemplate: true for enhanced docx output.
// =============================================================================
import { AiToolConfig, AiToolSlug } from './types';

export const AI_TOOL_CONFIGS: Record<AiToolSlug, AiToolConfig> = {

  // ============================================================
  // EXISTING 16 TOOLS — unchanged configs, category added
  // ============================================================

  coshh: {
    slug: 'coshh',
    name: 'COSHH Assessment Builder',
    shortName: 'COSHH Assessment',
    category: 'Health & Safety',
    description:
      'Create a professional COSHH assessment for any hazardous substance in minutes. Simply name the product and our AI looks up the Safety Data Sheet, then builds a fully compliant assessment aligned to the Control of Substances Hazardous to Health Regulations 2002 (COSHH) — tailored to your specific work activity with proper GHS classification, exposure routes, control measures, and PPE requirements.',
    route: '/coshh-builder',
    pageTitle: 'COSHH Assessment Builder | Ebrora',
    metaDescription:
      'AI-powered COSHH assessment builder for UK construction. Name the product, answer 3 questions, get a professional COSHH assessment with real SDS data. COSHH Regulations 2002 compliant.',
    documentLabel: 'COSHH Assessment',
    descriptionPlaceholder: 'E.g. "Jotun Jotamastic 87 – Jotun Paints" or "Sika MonoTop 610 – Sika UK"',
    descriptionHeading: 'What is the Product?',
    descriptionHint: 'Enter the exact product name and manufacturer. Our AI will look up the Safety Data Sheet and build a professional COSHH assessment based on the real chemical data for this product.',
    descriptionExample: 'Jotun Jotamastic 87 – Jotun Paints',
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
    maxWords: 20,
    minWords: 2,
    textareaRows: 2,
    warningText: 'Please provide at least {min} words for the product name.',
  },

  itp: {
    slug: 'itp',
    name: 'ITP Builder',
    shortName: 'Inspection & Test Plan',
    category: 'Quality',
    description:
      'Build comprehensive Inspection and Test Plans tailored to your construction works in minutes. Generates hold points, witness points, review points, and sign-off matrices — all mapped to your specific work activities and aligned with ISO 9001 quality management principles and CESWI inspection requirements.',
    route: '/itp-builder',
    pageTitle: 'ITP Builder – Inspection & Test Plans | Ebrora',
    metaDescription:
      'AI-powered ITP builder for UK construction. Hold points, witness points, sign-off matrices, and quality verification — built for your specific works. ISO 9001 and CESWI aligned.',
    documentLabel: 'Inspection & Test Plan',
    descriptionPlaceholder:
      'E.g. "Installation of 300mm diameter ductile iron rising main from new pump station to existing connection chamber. Includes thrust blocks, air valves, washout chambers, chlorination, and pressure testing to 1.5x working pressure."',
    descriptionHeading: 'Describe the Works Being Carried Out',
    descriptionHint: 'Explain the works package in as much detail as possible — type of work, materials, specifications, testing requirements, and any critical quality hold points.',
    descriptionExample:
      'Installation of 300mm diameter ductile iron rising main from new pump station to existing connection chamber. Includes thrust blocks, air valves, washout chambers, chlorination, and pressure testing to 1.5x working pressure.',
    keySections: [
      'Pre-Works Inspections',
      'During Works Inspections',
      'Closeout / Review',
      'Responsibility Matrix (S/I/W/H/R/O)',
      'Checksheets per Section',
      'Sign-Off & Approval Record',
    ],
    accentColor: '1D6FB8',
    iconType: 'clipboard',
    outputFormat: 'xlsx',
    maxWords: 100,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the works.',
  },

  'manual-handling': {
    slug: 'manual-handling',
    name: 'Manual Handling Assessment Builder',
    shortName: 'Manual Handling Assessment',
    category: 'Health & Safety',
    description:
      'Create detailed manual handling risk assessments using the TILE methodology in minutes. Produces comprehensive task analysis, individual capability assessment, load characteristics, and environmental factors — fully aligned with the Manual Handling Operations Regulations 1992 and HSE MAC (Manual Handling Assessment Charts) and RAPP (Risk Assessment of Pushing and Pulling) guidance.',
    route: '/manual-handling-builder',
    pageTitle: 'Manual Handling Assessment Builder | Ebrora',
    metaDescription:
      'AI-powered manual handling assessment builder using TILE methodology. Task, individual, load, and environment analysis aligned with Manual Handling Operations Regulations 1992 and HSE MAC/RAPP.',
    documentLabel: 'Manual Handling Risk Assessment',
    descriptionPlaceholder:
      'Describe the manual handling activity. E.g. "Lifting and positioning precast concrete kerbs (45kg each) along a 200m length of new footpath..."',
    descriptionHeading: 'Describe the Manual Handling Task',
    descriptionHint: 'Explain what is being lifted, carried, pushed or pulled. Include the weight, how often, and the working conditions.',
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
    maxWords: 100,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the task.',
  },

  dse: {
    slug: 'dse',
    name: 'DSE Assessment Builder',
    shortName: 'DSE Assessment',
    category: 'Health & Safety',
    description:
      'Create professional display screen equipment assessments for office workstations and site welfare facilities. Generates comprehensive assessments covering posture, screen setup, lighting, chair and seating, desk layout, and eye strain considerations — fully compliant with the Health and Safety (Display Screen Equipment) Regulations 1992.',
    route: '/dse-builder',
    pageTitle: 'DSE Assessment Builder | Ebrora',
    metaDescription:
      'AI-powered DSE workstation assessment builder. Display screen equipment assessments covering posture, screen setup, lighting, and eye strain. Compliant with DSE Regulations 1992.',
    documentLabel: 'DSE Assessment',
    descriptionPlaceholder:
      'Describe the workstation and user. E.g. "Site office portakabin workstation for a project manager using dual monitors, 8 hours per day. Shared desk environment..."',
    descriptionHeading: 'Describe the Workstation',
    descriptionHint: 'Explain where the workstation is, what equipment is used, and who uses it. Include any existing comfort issues or concerns.',
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
    maxWords: 80,
    minWords: 5,
    textareaRows: 4,
    warningText: 'Please provide at least {min} words to describe the workstation.',
  },

  'tbt-generator': {
    slug: 'tbt-generator',
    name: 'Toolbox Talk Builder',
    shortName: 'Toolbox Talk',
    category: 'Health & Safety',
    description:
      'Create bespoke, site-specific toolbox talks for any activity, hazard, or site condition in minutes. Generates briefing-ready documents with key hazards, control measures, do\'s and don\'ts, and attendance records — aligned with CDM 2015 requirements for worker engagement and HSE guidance on effective safety briefings.',
    route: '/tbt-builder',
    pageTitle: 'AI Toolbox Talk Builder | Ebrora',
    metaDescription:
      'AI-powered toolbox talk builder for UK construction sites. Generate site-specific safety briefings with attendance records for any activity or hazard. CDM 2015 aligned.',
    documentLabel: 'Toolbox Talk',
    descriptionPlaceholder:
      'Describe the topic or activity for the toolbox talk. E.g. "Working near live underground services during excavation works on an operational wastewater treatment site..."',
    descriptionHeading: 'What is the Toolbox Talk Topic?',
    descriptionHint: 'Describe the specific activity, hazard, or topic you want to brief your team on. Be as specific to your site as possible.',
    descriptionExample:
      'Working near live underground services (HV cables, gas mains, water mains) during excavation works for new drainage on an operational wastewater treatment site. CAT & Genny scanning required, hand-dig within 500mm of services.',
    keySections: [
      'Topic & Activity Description',
      'Key Hazards',
      'Control Measures',
      "Do's and Don'ts",
      'Emergency Procedures',
      'Key Discussion Points',
      'Attendance Record',
    ],
    accentColor: '0891B2',
    iconType: 'chat',
    maxWords: 80,
    minWords: 3,
    textareaRows: 4,
    warningText: 'Please provide at least {min} words to describe the topic.',
  },

  'confined-spaces': {
    slug: 'confined-spaces',
    name: 'Confined Space Assessment Builder',
    shortName: 'Confined Space Assessment',
    category: 'Health & Safety',
    description:
      'Create comprehensive confined space risk assessments covering atmospheric hazards, entry/exit procedures, emergency rescue plans, permits, gas monitoring, and communication requirements. Fully aligned with the Confined Spaces Regulations 1997 and HSE Approved Code of Practice L101 — with proper hazard identification and control measures for safe systems of work.',
    route: '/confined-spaces-builder',
    pageTitle: 'Confined Space Assessment Builder | Ebrora',
    metaDescription:
      'AI-powered confined space assessment builder. Atmospheric hazards, entry procedures, rescue plans, permits, and monitoring requirements. Confined Spaces Regulations 1997 and HSE L101 compliant.',
    documentLabel: 'Confined Space Risk Assessment',
    descriptionPlaceholder:
      'Describe the confined space and the work to be carried out. E.g. "Entry into a 4m deep wet well at a wastewater pumping station to replace submersible pump and guide rails..."',
    descriptionHeading: 'Describe the Confined Space Entry',
    descriptionHint: 'Explain what the confined space is, why entry is needed, and what work will be carried out inside. Include dimensions, access points, and any known hazards.',
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
    maxWords: 120,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the confined space entry.',
  },

  'incident-report': {
    slug: 'incident-report',
    name: 'Incident Report Builder',
    shortName: 'Incident Report',
    category: 'Health & Safety',
    description:
      'Create professional incident investigation reports with root cause analysis, 5 Whys methodology, RIDDOR reportability assessment, corrective actions, and lessons learned. Generates comprehensive reports aligned with RIDDOR 2013 (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations) and HSE investigation guidance — ready for management review and regulatory submission.',
    route: '/incident-report-builder',
    pageTitle: 'AI Incident Report Builder for Construction | Ebrora',
    metaDescription:
      'AI-powered incident report builder for UK construction sites. Root cause analysis, 5 Whys, RIDDOR 2013 assessment, corrective actions, and lessons learned — in minutes.',
    documentLabel: 'Incident Investigation Report',
    descriptionPlaceholder:
      'Describe what happened. E.g. "Operative struck by falling scaffold tube during dismantling of tower scaffold on the north elevation..."',
    descriptionHeading: 'What Happened?',
    descriptionHint: 'Describe the incident in your own words — what happened, where, when, who was involved, and what the outcome was.',
    descriptionExample:
      'Operative struck by falling scaffold tube during dismantling of tower scaffold on the north elevation of the storm tank at Salford WwTW. Tube fell approximately 4m, striking the operative on the shoulder. First aid administered on site, operative sent to A&E as precaution.',
    keySections: [
      'Incident Summary',
      'Persons Involved',
      'Immediate Causes',
      'Root Cause Analysis (5 Whys)',
      'RIDDOR Reportability Assessment',
      'Immediate Actions Taken',
      'Corrective Actions',
      'Preventive Actions',
      'Lessons Learned',
    ],
    accentColor: 'DC2626',
    iconType: 'warning',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the incident.',
  },

  'lift-plan': {
    slug: 'lift-plan',
    name: 'Lift Plan Builder',
    shortName: 'Lift Plan',
    category: 'Health & Safety',
    description:
      'Create structured lift plans covering load details, crane specification, radius charts, ground conditions, exclusion zones, appointed persons, and communication arrangements. Generates comprehensive documentation aligned with BS 7121 (Code of Practice for Safe Use of Cranes) and LOLER 1998 (Lifting Operations and Lifting Equipment Regulations) — ready for lifting supervisor sign-off.',
    route: '/lift-plan-builder',
    pageTitle: 'AI Lift Plan Builder for Construction | Ebrora',
    metaDescription:
      'AI-powered lift plan builder for UK construction. Load details, crane selection, exclusion zones, appointed persons, and communication plans. BS 7121 and LOLER 1998 compliant.',
    documentLabel: 'Lift Plan',
    descriptionPlaceholder:
      'Describe the lift. E.g. "Installation of precast concrete beams (8 tonnes each) using a 50T mobile crane. 12m radius, lifting from delivery vehicle to permanent position at 6m height..."',
    descriptionHeading: 'Describe the Lifting Operation',
    descriptionHint: 'Explain what is being lifted, the weight, crane type (if known), radius, height, and any proximity hazards.',
    descriptionExample:
      'Installation of precast concrete beams (8 tonnes each) using a 50T mobile crane at Salford WwTW. 12m radius, lifting from delivery vehicle to permanent position at 6m height. Adjacent to operational storm tank. Overhead 11kV power line 30m to the east.',
    keySections: [
      'Lift Description & Load Details',
      'Crane / Lifting Equipment Specification',
      'Ground Conditions & Outrigger Setup',
      'Radius, Height & Duty Chart Check',
      'Exclusion Zones',
      'Proximity Hazards',
      'Appointed Persons',
      'Communication Arrangements',
      'Risk Assessment',
      'Contingency & Emergency Procedures',
    ],
    accentColor: 'D97706',
    iconType: 'crane',
    maxWords: 100,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the lifting operation.',
  },

  'emergency-response': {
    slug: 'emergency-response',
    name: 'Emergency Response Plan Builder',
    shortName: 'Emergency Response Plan',
    category: 'Health & Safety',
    description:
      'Create site-specific emergency response plans covering fire, first aid, environmental spills, structural collapse, utilities failure, and evacuation procedures. Generates comprehensive plans aligned with CDM 2015 requirements and HSE guidance — with emergency contact cascades, muster points, and role-specific responsibilities ready for site induction.',
    route: '/emergency-response-builder',
    pageTitle: 'AI Emergency Response Plan Builder | Ebrora',
    metaDescription:
      'AI-powered emergency response plan builder for UK construction sites. Fire plans, first aid, environmental spills, evacuation, muster points — site-specific and CDM 2015 compliant.',
    documentLabel: 'Emergency Response Plan',
    descriptionPlaceholder:
      'Describe the site and its key hazards. E.g. "Operational wastewater treatment works with active construction of new storm tank. Site has deep excavations, confined spaces, H₂S risk, heavy plant, and is adjacent to the Manchester Ship Canal..."',
    descriptionHeading: 'Describe the Site',
    descriptionHint: 'Explain what the site is, what construction works are underway, the principal hazards, and the nearest hospital.',
    descriptionExample:
      'Operational wastewater treatment works at Salford WwTW with active construction of new storm tank. Deep excavations (up to 8m), confined space entries, H₂S risk from live sewage, 50T mobile crane operations, and HV electrical work. Nearest A&E is Salford Royal Hospital (2 miles). Site access via Frederick Road.',
    keySections: [
      'Site Information & Key Contacts',
      'Emergency Contact Cascade',
      'Fire Emergency Procedure',
      'First Aid Arrangements',
      'Environmental Spill Response',
      'Structural Collapse Procedure',
      'Confined Space Rescue',
      'Utilities Failure',
      'Severe Weather',
      'Evacuation & Muster Points',
    ],
    accentColor: 'B91C1C',
    iconType: 'siren',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the site.',
  },

  'quality-checklist': {
    slug: 'quality-checklist',
    name: 'Quality Checklist Builder',
    shortName: 'Quality Checklist',
    category: 'Quality',
    description:
      'Create activity-specific quality inspection checklists with hold points, acceptance criteria, reference standards, and sign-off fields for construction works. Generates comprehensive checklists aligned with ISO 9001 quality management principles and relevant BS EN standards — ready for site inspection and quality record keeping.',
    route: '/quality-checklist-builder',
    pageTitle: 'AI Quality Checklist Builder | Ebrora',
    metaDescription:
      'AI-powered quality checklist builder for UK construction. Activity-specific checklists with hold points, acceptance criteria, and BS/EN standards references. ISO 9001 aligned.',
    documentLabel: 'Quality Inspection Checklist',
    descriptionPlaceholder:
      'Describe the activity to be inspected. E.g. "Concrete pour for 300mm thick reinforced concrete base slab, 15m x 8m, C35/45 concrete with steel fibre reinforcement..."',
    descriptionHeading: 'What Activity Needs Inspecting?',
    descriptionHint: 'Describe the specific construction activity. Include materials, dimensions, specifications, and any critical quality requirements.',
    descriptionExample:
      'Concrete pour for 300mm thick reinforced concrete base slab, 15m x 8m, C35/45 concrete with steel fibre reinforcement. Pump pour from south side. Rebar to BS 4449 Grade B500B. Power-floated finish. Curing compound application.',
    keySections: [
      'Pre-Pour Checks',
      'During Pour Checks',
      'Post-Pour Checks',
      'Material Verification',
      'Dimensional Checks',
      'Testing Requirements',
      'Hold Points',
      'Sign-Off Record',
    ],
    accentColor: '059669',
    iconType: 'check',
    maxWords: 100,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the activity.',
  },

  'scope-of-works': {
    slug: 'scope-of-works',
    name: 'Scope of Works Builder',
    shortName: 'Scope of Works',
    category: 'Commercial',
    description:
      'Create formal subcontractor scope of works documents with comprehensive inclusions, exclusions, design responsibilities, interface requirements, programme constraints, deliverables, and commercial terms. Generates professionally structured documents aligned with NEC and JCT subcontract frameworks — clearly defining the boundary of works to minimise disputes and ensure all parties understand their obligations. Includes materials and equipment specifications, testing and commissioning requirements, health safety and environmental responsibilities, and documentation deliverables.',
    route: '/scope-of-works-builder',
    pageTitle: 'AI Scope of Works Builder for Construction | Ebrora',
    metaDescription:
      'AI-powered scope of works builder for UK construction subcontracts. Inclusions, exclusions, interfaces, deliverables, programme constraints, and commercial terms — professionally structured for NEC and JCT frameworks.',
    documentLabel: 'Scope of Works',
    descriptionPlaceholder:
      'Describe what the subcontractor needs to do. E.g. "Supply and install MEICA equipment for a new storm water pumping station — 3 No. submersible pumps, MCC panel, level instrumentation, and all associated pipework..."',
    descriptionHeading: 'What Does the Subcontractor Need to Do?',
    descriptionHint: 'Describe the works package in detail — what is included, what materials/equipment, approximate quantities, and any known constraints.',
    descriptionExample:
      'Supply and install MEICA equipment for a new storm water pumping station at Salford WwTW. 3 No. submersible pumps (Xylem Flygt NP 3202), MCC panel, ultrasonic level instrumentation, 200mm DI pipework, penstocks, and all associated cabling. Subcontractor to provide commissioning and 12-month defects support.',
    keySections: [
      'Scope Overview',
      'Inclusions',
      'Exclusions',
      'Design Responsibility',
      'Materials & Equipment',
      'Programme & Sequencing',
      'Interface Requirements',
      'Testing & Commissioning',
      'Deliverables & Documentation',
      'Health, Safety & Environmental',
    ],
    accentColor: '7C3AED',
    iconType: 'file',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the works package.',
  },

  'permit-to-dig': {
    slug: 'permit-to-dig',
    name: 'Permit to Dig Builder',
    shortName: 'Permit to Dig',
    category: 'Health & Safety',
    description:
      'Create permit to dig documents covering utility searches, CAT & Genny scanning requirements, hand-dig zones, safe digging methods, and supervision requirements. Generates comprehensive permits aligned with HSG47 (Avoiding Danger from Underground Services) and PAS 128 utility survey standards — ready for excavation works sign-off.',
    route: '/permit-to-dig-builder',
    pageTitle: 'AI Permit to Dig Builder | Ebrora',
    metaDescription:
      'AI-powered permit to dig builder for UK construction. Utility searches, CAT & Genny requirements, hand-dig zones, safe digging methods, and HSG47 compliance.',
    documentLabel: 'Permit to Dig',
    descriptionPlaceholder:
      'Describe the excavation. E.g. "Trench excavation for 225mm diameter foul sewer, 2.5m deep, along the eastern boundary of the site adjacent to the existing substation..."',
    descriptionHeading: 'Describe the Excavation',
    descriptionHint: 'Explain where you are digging, the depth, the purpose, and any known services in the area.',
    descriptionExample:
      'Trench excavation for 225mm diameter foul sewer connection, 2.5m deep x 35m long, along the eastern boundary at Salford WwTW. Adjacent to existing 11kV substation. StatMap search shows 6" cast iron water main crossing at chainage 15m. Gas main runs parallel 3m to the east.',
    keySections: [
      'Excavation Details',
      'Utility Search Records',
      'Services Identified',
      'CAT & Genny Scan Requirements',
      'Hand-Dig Zones',
      'Safe Digging Method',
      'Supervision Arrangements',
      'Emergency Procedures',
      'Permit Conditions & Sign-Off',
    ],
    accentColor: '92400E',
    iconType: 'shovel',
    maxWords: 100,
    minWords: 5,
    textareaRows: 5,
    warningText: 'Please provide at least {min} words to describe the excavation.',
  },

  powra: {
    slug: 'powra',
    name: 'POWRA Builder',
    shortName: 'POWRA',
    category: 'Health & Safety',
    description:
      'Create point of work risk assessments — quick, field-level assessments done before each task covering today\'s hazards, controls, stop conditions, and team sign-on. Generates practical, site-ready documents aligned with CDM 2015 requirements for dynamic risk assessment and safe systems of work.',
    route: '/powra-builder',
    pageTitle: 'AI POWRA Builder — Point of Work Risk Assessment | Ebrora',
    metaDescription:
      'AI-powered POWRA builder for UK construction. Quick point of work risk assessments with hazards, controls, stop conditions, and team sign-on. CDM 2015 aligned, field-ready format.',
    documentLabel: 'Point of Work Risk Assessment (POWRA)',
    descriptionPlaceholder:
      "Describe today's task. E.g. \"Excavation of trial holes to locate existing 300mm water main using 3T mini excavator and hand digging within 500mm of services...\"",
    descriptionHeading: 'What Task Are You About to Start?',
    descriptionHint: "Briefly describe the specific task being carried out today — location, method, plant involved, and any particular concerns.",
    descriptionExample:
      'Excavation of trial holes to locate existing 300mm water main using 3T mini excavator and hand digging within 500mm of services. Working adjacent to the live process area at Salford WwTW. 2-man team plus banksman for plant movements.',
    keySections: [
      'Task Description',
      'Location & Conditions',
      'Hazards Identified',
      'Risk Rating (Before Controls)',
      'Control Measures',
      'Risk Rating (After Controls)',
      'Stop Conditions',
      'Team Sign-On',
    ],
    accentColor: 'EA580C',
    iconType: 'hardhat',
    maxWords: 80,
    minWords: 5,
    textareaRows: 4,
    warningText: 'Please provide at least {min} words to describe the task.',
  },

  'early-warning': {
    slug: 'early-warning',
    name: 'Early Warning Notice Builder',
    shortName: 'Early Warning Notice',
    category: 'Commercial',
    description:
      'Create NEC-compliant early warning notices with risk description, potential impact on cost, time, and quality, and proposed mitigation measures. Generates formal notices aligned with NEC3/NEC4 Clause 15 requirements — protecting your contractual position and triggering risk reduction meetings.',
    route: '/early-warning-builder',
    pageTitle: 'AI Early Warning Notice Builder | Ebrora',
    metaDescription:
      'AI-powered NEC early warning notice builder for UK construction contracts. Risk description, impact assessment, and mitigation proposals — NEC3/NEC4 Clause 15 compliant format.',
    documentLabel: 'Early Warning Notice',
    descriptionPlaceholder:
      'Describe the risk or issue. E.g. "Unforeseen ground conditions encountered during piling — soft alluvial deposits extending 3m deeper than the GI report indicated..."',
    descriptionHeading: 'Describe the Risk or Issue',
    descriptionHint: 'Explain the matter that could increase cost, delay completion, or impair performance. Include what you know so far and any evidence.',
    descriptionExample:
      'Unforeseen ground conditions encountered during piling for the new storm tank at Salford WwTW. Soft alluvial deposits extending 3m deeper than indicated in the Ground Investigation report. Piling contractor reports current pile design may be insufficient.',
    keySections: [
      'Notice Details',
      'Contract Reference',
      'Risk Description',
      'Potential Impact on Cost',
      'Potential Impact on Programme',
      'Potential Impact on Quality / Performance',
      'Proposed Mitigation',
      'Risk Reduction Meeting Request',
    ],
    accentColor: 'D97706',
    iconType: 'bell',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the risk or issue.',
  },

  ncr: {
    slug: 'ncr',
    name: 'NCR Builder',
    shortName: 'Non-Conformance Report',
    category: 'Quality',
    description:
      'Create non-conformance reports with defect description, root cause analysis, corrective and preventive actions, disposition, and close-out requirements. Generates comprehensive NCRs aligned with ISO 9001 quality management principles — ready for quality system integration and audit trail documentation.',
    route: '/ncr-builder',
    pageTitle: 'AI NCR Builder — Non-Conformance Report | Ebrora',
    metaDescription:
      'AI-powered NCR builder for UK construction. Defect description, root cause analysis, corrective actions, disposition, and close-out verification — ISO 9001 aligned.',
    documentLabel: 'Non-Conformance Report',
    descriptionPlaceholder:
      'Describe the non-conformance. E.g. "Concrete test cubes from base slab pour on 15/03/2026 failed to reach specified 28-day strength — results show 31 N/mm² against specified C35/45..."',
    descriptionHeading: 'Describe the Non-Conformance',
    descriptionHint: 'Explain what has gone wrong — what was specified vs what was delivered/built, where, and when it was discovered.',
    descriptionExample:
      'Concrete test cubes from base slab pour on 15/03/2026 at Salford WwTW failed to reach specified 28-day strength. Results: 31 N/mm² average against specified C35/45 (minimum 35 N/mm²). Pour ref: CP-045. Batch tickets show correct mix ordered. 3 of 6 cubes failed.',
    keySections: [
      'NCR Details & Reference',
      'Non-Conformance Description',
      'Specification / Requirement',
      'Actual Condition Found',
      'Root Cause Analysis',
      'Immediate Containment Actions',
      'Corrective Actions',
      'Preventive Actions',
      'Disposition',
      'Close-Out Verification',
    ],
    accentColor: 'BE123C',
    iconType: 'x-circle',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the non-conformance.',
  },

  'ce-notification': {
    slug: 'ce-notification',
    name: 'CE Notification Builder',
    shortName: 'CE Notification',
    category: 'Commercial',
    description:
      'Create NEC-compliant compensation event notifications with clause references, event description, programme impact, cost implications, and supporting evidence checklist. Generates formal notifications aligned with NEC3/NEC4 Clause 60-65 requirements — protecting your entitlement to time and cost.',
    route: '/ce-notification-builder',
    pageTitle: 'AI CE Notification Builder — Compensation Event | Ebrora',
    metaDescription:
      'AI-powered NEC compensation event notification builder for UK construction. Clause references, impact assessment, and entitlement — NEC3/NEC4 Clause 60-65 compliant format.',
    documentLabel: 'Compensation Event Notification',
    descriptionPlaceholder:
      'Describe the compensation event. E.g. "Client instruction to change storm tank overflow weir level from 42.150m AOD to 42.350m AOD — requires redesign of weir wall, new formwork, and additional concrete..."',
    descriptionHeading: 'Describe the Compensation Event',
    descriptionHint: 'Explain what happened that you believe constitutes a compensation event under the contract.',
    descriptionExample:
      'Client instruction received 10/03/2026 to change storm tank overflow weir level from 42.150m AOD to 42.350m AOD at Salford WwTW. Requires redesign of weir wall reinforcement, new formwork (existing formwork already fabricated to original level), additional concrete, and re-sequencing of the pour programme.',
    keySections: [
      'Notification Details',
      'Contract & Clause Reference',
      'Event Description',
      'Entitlement Basis',
      'Programme Impact',
      'Cost Implications',
      'Quotation Requirements',
      'Supporting Evidence Checklist',
    ],
    accentColor: '1D4ED8',
    iconType: 'pound',
    maxWords: 150,
    minWords: 10,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the compensation event.',
  },

  // ============================================================
  // NEW 13 TOOLS — premium templates, all restricted to Standard+
  // ============================================================

  'programme-checker': {
    slug: 'programme-checker',
    name: 'Programme Checker',
    shortName: 'Programme Checker',
    category: 'Programme',
    description:
      'Upload your construction programme (PDF, Excel, or P6/MSP XER/XML) and receive an AI-powered RAG-rated review. Analyses logic errors, sequencing issues, missing activities, WBS gaps, duration anomalies, and contractual milestone compliance — aligned with NEC and JCT programme requirements. Generates a comprehensive review report with prioritised recommendations.',
    route: '/programme-checker-builder',
    pageTitle: 'AI Construction Programme Checker | Ebrora',
    metaDescription:
      'Upload your construction programme for an AI-powered review. Logic errors, sequencing, WBS structure, duration anomalies, and NEC/JCT contractual compliance — RAG-scored report.',
    documentLabel: 'Programme Review Report',
    descriptionPlaceholder: 'Upload your programme file below (PDF, XLSX, or XER/XML)',
    descriptionHeading: 'Upload Your Programme',
    descriptionHint:
      'Upload your construction programme in PDF, Excel (XLSX), or P6/MSP export format (XER or XML). The AI will review logic, sequencing, durations, WBS structure, resource loading, and contractual milestone compliance.',
    descriptionExample: '',
    keySections: [
      'Executive Summary & Overall RAG Rating',
      'Programme Logic & Dependency Review',
      'Duration Analysis & Benchmark Comparison',
      'WBS Structure & Activity Hierarchy',
      'Critical Path Integrity',
      'Float Analysis & Risk Areas',
      'Resource Loading & Constraints',
      'Contractual Milestone Compliance',
      'Missing Activities & Gaps',
      'Recommendations & Actions Required',
    ],
    accentColor: '0F766E',
    iconType: 'calendar',
    requiresUpload: true,
    uploadFormats: ['PDF', 'XLSX', 'XER / XML'],
    uploadInstructions:
      'Upload your programme file. Accepted formats: PDF (exported from P6, MSP, or Asta), Excel workbook (.xlsx), or native P6 XER / MSP XML export. Maximum file size: 10 MB.',
    premiumTemplate: true,
    maxWords: 50,
    minWords: 0,
    textareaRows: 3,
    warningText: '',
  },

  'cdm-checker': {
    slug: 'cdm-checker',
    name: 'CDM Compliance Checker',
    shortName: 'CDM Compliance Checker',
    category: 'Health & Safety',
    description:
      'Describe your project or upload key documents and receive a comprehensive CDM 2015 compliance gap analysis. Assesses all duty holder responsibilities against the Construction (Design and Management) Regulations 2015 and HSE L153 Approved Code of Practice — identifying gaps and producing a prioritised improvement roadmap.',
    route: '/cdm-checker-builder',
    pageTitle: 'AI CDM 2015 Compliance Checker | Ebrora',
    metaDescription:
      'AI-powered CDM 2015 compliance checker for UK construction. Gap analysis across Client, Principal Designer, Principal Contractor, Designer, and Contractor duties. HSE L153 aligned.',
    documentLabel: 'CDM Compliance Gap Analysis',
    descriptionPlaceholder:
      'E.g. "New build wastewater treatment plant extension. £4.2M contract, 18-month programme. Client is United Utilities (commercial client). Principal Contractor is C2V+. PD appointed. Design phase complete, construction phase beginning. 3 subcontractors engaged — groundworks, MEICA, and M&E. Pre-construction information has been issued..."',
    descriptionHeading: 'Describe Your Project',
    descriptionHint:
      'Provide as much project context as possible — project type, contract value, programme duration, client type (commercial/domestic), duty holders appointed, current phase, and any known compliance concerns. The AI will identify gaps against CDM 2015 duty holder requirements.',
    descriptionExample:
      'New build wastewater treatment plant extension at Salford WwTW. £4.2M NEC4 ECC contract, 18-month programme. Commercial client (United Utilities). Principal Contractor is C2V+. PD has been appointed. Design is 90% complete. Construction phase beginning next month. Three subcontractors engaged. F10 notification submitted. Pre-construction information pack issued to PC but not yet distributed to subcontractors.',
    keySections: [
      'Project Overview & Notification Requirements (F10)',
      'Client Duties Assessment (Regulation 4)',
      'Principal Designer Duties Assessment (Regulation 11–12)',
      'Principal Contractor Duties Assessment (Regulation 13–14)',
      'Designer Duties Assessment (Regulation 9)',
      'Contractor Duties Assessment (Regulation 15)',
      'Pre-Construction Information Review',
      'Construction Phase Plan Assessment',
      'Health & Safety File Requirements',
      'Identified Gaps & Non-Compliances',
      'Priority Recommendations & Actions',
      'Compliance Improvement Roadmap',
    ],
    accentColor: '7C3AED',
    iconType: 'hardhat',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 20,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe your project.',
  },

  'noise-assessment': {
    slug: 'noise-assessment',
    name: 'Noise Assessment Builder',
    shortName: 'Noise Assessment',
    category: 'Health & Safety',
    description:
      'Create BS 5228-aligned construction noise assessments in minutes. Predicts noise levels at sensitive receptors from plant and activities, assesses impact against BS 5228 criteria, and produces a formal assessment with monitoring requirements and mitigation measures — fully compliant with BS 5228-1:2009+A1:2014 (Code of Practice for Noise and Vibration Control on Construction and Open Sites).',
    route: '/noise-assessment-builder',
    pageTitle: 'AI Construction Noise Assessment Builder | Ebrora',
    metaDescription:
      'AI-powered construction noise assessment builder. BS 5228-1:2009+A1:2014 compliant. Plant noise levels, receptor predictions, impact assessment, and mitigation measures for UK construction.',
    documentLabel: 'Construction Noise Assessment',
    descriptionPlaceholder:
      'E.g. "Earthworks and piling for new road bridge abutments, 6 months duration. Working hours 07:30–18:00 Mon–Fri, 07:30–13:00 Sat. Nearest sensitive receptor is a residential terrace at 85m to the north. Plant includes 20T excavator, 360° piling rig (CFA), dumpers, and compactor..."',
    descriptionHeading: 'Describe the Works and Site Conditions',
    descriptionHint:
      'Describe the construction activities, plant to be used, working hours, and the location and type of nearest sensitive receptors (residential, schools, hospitals). Include approximate distances to receptors. The AI will assess predicted noise levels using BS 5228-1 methodology.',
    descriptionExample:
      'Earthworks and piling for new road bridge abutments, 6-month programme. Day works 07:30–18:00 Mon–Fri, 07:30–13:00 Sat. Nearest sensitive receptor is residential housing (terraced) at 85m to the north. Beyond that, a primary school at 150m to the east. Plant: 20T excavator, CFA piling rig, twin-drum roller, 3 No. 6T dumpers. Site is in semi-urban area with moderate background noise.',
    keySections: [
      'Assessment Basis & Standards (BS 5228-1:2009+A1:2014)',
      'Site Description & Location Plan',
      'Construction Activities & Programme',
      'Plant Inventory & Source Noise Levels',
      'Sensitive Receptors Identification',
      'Noise Prediction Methodology',
      'Predicted Noise Levels at Each Receptor',
      'BS 5228 Impact Assessment Criteria',
      'Impact Assessment Results',
      'Vibration Assessment (BS 5228-2)',
      'Mitigation Measures',
      'Noise Monitoring Requirements',
      'Complaints Management Procedure',
    ],
    accentColor: '0369A1',
    iconType: 'noise',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the works and site.',
  },

  'quote-generator': {
    slug: 'quote-generator',
    name: 'Quotation Builder',
    shortName: 'Quotation',
    category: 'Commercial',
    description:
      'Create professional subcontractor quotations for submission to main contractors in minutes. Generates priced BoQ breakdowns, inclusions, exclusions, assumptions, programme, and commercial and contractual terms — formatted to Tier 1 standards and ready for tender submission.',
    route: '/quote-generator-builder',
    pageTitle: 'AI Quotation Builder for Subcontractors | Ebrora',
    metaDescription:
      'AI-powered subcontractor quotation builder for UK construction. Professional tender submissions with BoQ, inclusions, exclusions, programme, and commercial terms. Tier 1 ready.',
    documentLabel: 'Subcontractor Quotation',
    descriptionPlaceholder:
      'E.g. "Quotation for supply and installation of 450mm diameter HDPE rising main, approximately 380m length, from new pumping station to existing connection chamber. Includes directional drilling under the A57, thrust blocks, air valves, and pressure testing. Client: United Utilities. Main contractor: C2V+. Tender return date: 15/04/2026."',
    descriptionHeading: 'Describe the Works You Are Pricing',
    descriptionHint:
      'Describe the scope of works you are quoting for — what you are supplying and/or installing, approximate quantities, key inclusions you want to flag, and any significant exclusions or assumptions. Include client, main contractor, and tender return date if known.',
    descriptionExample:
      'Quotation for supply and installation of 450mm diameter HDPE rising main, 380m length, from new pumping station to existing chamber at Salford WwTW. Includes directional drilling under the A57 (2 No. drives, 45m each), thrust blocks, air valves at high points, washout at low point, and hydraulic pressure testing to 1.5x working pressure. Excludes connection to existing chamber (PC work). Main contractor C2V+. Tender return 15 April 2026.',
    keySections: [
      'Quotation Summary & Tender Particulars',
      'Scope of Works',
      'Bill of Quantities / Pricing Schedule',
      'Inclusions',
      'Exclusions',
      'Assumptions & Qualifications',
      'Programme',
      'Pricing Basis & Rates',
      'Provisional Sums & Daywork Allowances',
      'Commercial Terms',
      'Contractual Basis',
      'Health, Safety & Environmental Commitments',
      'Validity Period',
    ],
    accentColor: '065F46',
    iconType: 'invoice',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the works being priced.',
  },

  'safety-alert': {
    slug: 'safety-alert',
    name: 'Safety Alert Builder',
    shortName: 'Safety Alert',
    category: 'Health & Safety',
    description:
      'Create professional safety alert bulletins from incident descriptions, near misses, or emerging hazard intelligence in minutes. Generates structured alerts with clear lessons learned and preventive actions — aligned with CDM 2015 requirements for sharing safety intelligence and ready for immediate distribution across site teams.',
    route: '/safety-alert-builder',
    pageTitle: 'AI Safety Alert Builder for Construction | Ebrora',
    metaDescription:
      'AI-powered safety alert builder for UK construction. Turn incident descriptions and near misses into professional safety bulletins — structured, clear, and ready to distribute. CDM 2015 aligned.',
    documentLabel: 'Safety Alert Bulletin',
    descriptionPlaceholder:
      'E.g. "Near miss — banksman stepped into the swing radius of a 20T excavator during lifting operations on the east compound. Operator did not see the banksman as he was in a blind spot. No injury but banksman was struck by the counterweight. Site stopped, investigation underway."',
    descriptionHeading: 'Describe the Incident or Hazard',
    descriptionHint:
      'Describe what happened (or what near-miss/hazard was identified), where, when, and what the immediate outcome was. Include enough detail for the AI to build a meaningful alert with genuine lessons learned.',
    descriptionExample:
      'Near miss on 18/03/2026 — banksman stepped into the swing radius of a 20T 360° excavator during an assisted lift operation in the east compound at Salford WwTW. Excavator operator did not see the banksman due to a blind spot on the left-hand side. Banksman was struck by the counterweight housing, causing him to fall. No injury sustained but medical check carried out. All plant operations stopped pending investigation.',
    keySections: [
      'Alert Reference & Classification',
      'Incident Summary',
      'What Happened — Timeline',
      'Immediate Causes',
      'Underlying Factors',
      'Potential Consequences',
      'Immediate Actions Taken',
      'Lessons Learned',
      'Preventive Actions — What You Must Do',
      'Distribution & Briefing Confirmation',
    ],
    accentColor: 'DC2626',
    iconType: 'siren',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 20,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the incident or hazard.',
  },

  'carbon-footprint': {
    slug: 'carbon-footprint',
    name: 'Carbon Footprint Builder',
    shortName: 'Carbon Footprint',
    category: 'Programme',
    description:
      'Create activity-based carbon footprint assessments for construction works in minutes. Quantifies materials, plant, transport, waste, and temporary works using ICE v3.2 emission factors — with reduction opportunities identified. Aligned with PAS 2080:2023 (Carbon Management in Infrastructure) for comprehensive whole-life carbon assessment.',
    route: '/carbon-footprint-builder',
    pageTitle: 'AI Construction Carbon Footprint Builder | Ebrora',
    metaDescription:
      'AI-powered construction carbon footprint builder. ICE v3.2 emission factors, materials, plant, transport, waste, and reduction opportunities. PAS 2080:2023 aligned.',
    documentLabel: 'Construction Carbon Footprint Assessment',
    descriptionPlaceholder:
      'E.g. "New reinforced concrete storm tank, 30m × 20m × 5m deep. 1,800m³ C35/45 concrete, 180T rebar, 2,500m² formwork, 500T imported fill. Plant includes 2 No. 20T excavators (10 weeks), 50T crane (4 weeks). 120km average material haulage. 8,000m³ muck away to licensed tip 15km."',
    descriptionHeading: 'Describe the Construction Works',
    descriptionHint:
      'Provide as much detail as possible about materials, quantities, plant, haulage distances, and waste. The more specific you are, the more accurate the carbon assessment. Include concrete mixes, steel grades, earthworks volumes, and key plant types.',
    descriptionExample:
      'New reinforced concrete storm tank at Salford WwTW. 30m × 20m × 5m deep, 1,800m³ C35/45 concrete (CEM I), 180T B500B rebar, 2,500m² plywood formwork. 12,000m³ excavation — 4,000m³ reuse on site, 8,000m³ muck away to MRE Aggregates Port Salford (15km). Import 500T 6F2 fill, 200T Type 1 sub-base. Plant: 2 No. 20T excavators (10 weeks), 1 No. 50T crane (4 weeks), concrete pumping. Average material haulage 120km.',
    keySections: [
      'Assessment Basis & Methodology (ICE v3.2)',
      'Project Overview & Scope Boundary',
      'Materials Carbon (A1–A5)',
      'Structural Concrete & Reinforcement',
      'Earthworks & Ground Materials',
      'Temporary Works & Formwork',
      'Plant & Equipment Emissions (Fuel Use)',
      'Transport & Logistics (Haulage & Delivery)',
      'Waste & Disposal',
      'Carbon Summary — Tonnes CO₂e by Category',
      'Hotspot Analysis',
      'Carbon Reduction Opportunities',
      'Residual Carbon & Offset Considerations',
    ],
    accentColor: '166534',
    iconType: 'leaf',
    premiumTemplate: true,
    maxWords: 250,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the construction works.',
  },

  'rams-review': {
    slug: 'rams-review',
    name: 'RAMS Review Tool',
    shortName: 'RAMS Review',
    category: 'Health & Safety',
    description:
      'Upload a RAMS document (PDF, Word, or Excel) and receive a thorough AI review against HSE guidance, CDM 2015, and industry best practice. Identifies gaps and improvements against HSG65 (Successful Health and Safety Management), PUWER, LOLER, and relevant Approved Codes of Practice — producing a formal review report with prioritised recommendations.',
    route: '/rams-review-builder',
    pageTitle: 'AI RAMS Review Tool | Ebrora',
    metaDescription:
      'Upload your RAMS document for an AI-powered review. Gaps, improvements, and compliance issues identified against HSE guidance, CDM 2015, HSG65, PUWER, and LOLER. PDF, DOCX, and XLSX accepted.',
    documentLabel: 'RAMS Review Report',
    descriptionPlaceholder: 'Upload your RAMS document below (PDF, DOCX, or XLSX)',
    descriptionHeading: 'Upload Your RAMS Document',
    descriptionHint:
      'Upload your risk assessment and method statement for AI review. Accepted formats: PDF, Word document (.docx), or Excel workbook (.xlsx). The AI will review against HSE guidance (HSG65, GS6), CDM 2015, and construction industry best practice.',
    descriptionExample: '',
    keySections: [
      'Document Overview & Summary',
      'Scope & Works Description Assessment',
      'Risk Assessment Adequacy',
      'Hazard Identification Completeness',
      'Control Measures — Hierarchy of Control',
      'Method Statement Clarity & Sequencing',
      'Regulatory Compliance (CDM 2015, PUWER, LOLER)',
      'HSE Guidance Alignment (HSG65)',
      'PPE & Emergency Arrangements',
      'Competency & Supervision Requirements',
      'Environmental Considerations',
      'Identified Gaps & Deficiencies',
      'Priority Recommendations',
      'Overall Assessment Rating',
    ],
    accentColor: 'B91C1C',
    iconType: 'search',
    requiresUpload: true,
    uploadFormats: ['PDF', 'DOCX', 'XLSX'],
    uploadInstructions:
      'Upload your RAMS document. Accepted formats: PDF, Word document (.docx), or Excel workbook (.xlsx). Maximum file size: 10 MB.',
    premiumTemplate: true,
    maxWords: 50,
    minWords: 0,
    textareaRows: 3,
    warningText: '',
  },

  'delay-notification': {
    slug: 'delay-notification',
    name: 'Delay Notification Builder',
    shortName: 'Delay Notification',
    category: 'Commercial',
    description:
      'Create contract-compliant delay notification letters for NEC3, NEC4, JCT SBC, and JCT D&B contracts in minutes. Generates formal letters with clause references, event description, programme effect, mitigation, and entitlement argument — protecting your time and cost position under the contract.',
    route: '/delay-notification-builder',
    pageTitle: 'AI Delay Notification Builder | Ebrora',
    metaDescription:
      'AI-powered delay notification builder for NEC and JCT contracts. Clause references, programme impact, mitigation, and entitlement — contract-compliant formal letters for UK construction.',
    documentLabel: 'Delay Notification Letter',
    descriptionPlaceholder:
      'E.g. "Client-instructed design change to storm tank base slab thickness from 300mm to 450mm received 12/03/2026. Impacts 3 concrete pours already scheduled. Expected delay 3 weeks to Milestone 4 (storm tank base slab completion, contractual date 02/04/2026)."',
    descriptionHeading: 'Describe the Delay Event',
    descriptionHint:
      'Describe what happened that has caused or will cause delay. Include the triggering event, when it occurred, which activities are affected, and your estimate of the programme impact. The AI will ask about your contract type and structure the notification accordingly.',
    descriptionExample:
      'Client-instructed design change to storm tank base slab reinforcement — bar spacing changed from 200mm to 150mm centres, increasing rebar quantities by approximately 25%. Instruction received 12/03/2026 (RFI response). Rebar already cut and bent to original design. New material on 3-week lead time. Base slab pours (3 No.) scheduled from 24/03/2026 to 12/04/2026 — all three now delayed. Milestone 4 (base slab completion) contractual date 16/04/2026 at risk.',
    keySections: [
      'Letter Header & Contract Particulars',
      'Delay Notification Clause Reference',
      'Event Description',
      'Cause & Responsibility',
      'Programme Effect — Impacted Activities',
      'Critical Path Impact',
      'Estimated Duration of Delay',
      'Mitigation Measures Taken / Proposed',
      'Entitlement to Extension of Time',
      'Entitlement to Additional Cost',
      'Supporting Documentation List',
      'Required Response / Next Steps',
    ],
    accentColor: '1E40AF',
    iconType: 'clock',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the delay event.',
  },

  'variation-confirmation': {
    slug: 'variation-confirmation',
    name: 'Variation Confirmation Builder',
    shortName: 'Variation Confirmation',
    category: 'Commercial',
    description:
      'Create formal written confirmation of verbal or informally instructed variation instructions in minutes. Generates letters with contract references, description of change, cost and time impact, and request for written instruction — protecting subcontractor entitlement under NEC and JCT contracts.',
    route: '/variation-confirmation-builder',
    pageTitle: 'AI Variation Confirmation Builder | Ebrora',
    metaDescription:
      'AI-powered variation confirmation builder for UK construction. Confirm verbal instructions in writing with contract references, cost and time impact, and entitlement protection. NEC and JCT aligned.',
    documentLabel: 'Variation Confirmation Letter',
    descriptionPlaceholder:
      'E.g. "Site instruction from main contractor\'s site manager on 14/03/2026 to extend the gabion retaining wall by an additional 15m. Verbal instruction only — no written order issued. Works will require additional 45T gabion baskets, 15T stone fill, and an estimated 3 additional working days."',
    descriptionHeading: 'Describe the Instructed Variation',
    descriptionHint:
      'Describe what you were instructed to do, by whom, when, and whether it was verbal or informal. Include what additional materials, labour, or time are required. The AI will structure a formal confirmation letter seeking written instruction.',
    descriptionExample:
      'Verbal instruction from C2V+ site manager John Smith on 14/03/2026 to extend the eastern gabion retaining wall by an additional 15 linear metres to address an unforeseen bank stability issue. Instruction given on site, no written order. Additional works require 45T gabion baskets (2m × 1m × 1m), 15T Class A stone fill, geotextile liner, and excavation of 120m³ existing ground. Estimated 3 additional working days. Works have commenced on instruction.',
    keySections: [
      'Letter Header & Reference',
      'Contract Particulars & Clause Reference',
      'Verbal Instruction Details',
      'Description of Change / Additional Works',
      'Works Already Commenced / Completed',
      'Estimated Cost Impact',
      'Estimated Programme Impact',
      'Entitlement Basis',
      'Request for Written Instruction',
      'Without Prejudice Reservation',
      'Required Response Deadline',
    ],
    accentColor: '0F766E',
    iconType: 'letter',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the variation instruction.',
  },

  'rfi-generator': {
    slug: 'rfi-generator',
    name: 'RFI Builder',
    shortName: 'RFI',
    category: 'Commercial',
    description:
      'Create formal Requests for Information with drawing and specification references, a clear question, impact of non-response, required response deadline, and contractual implications — structured for Tier 1 acceptance and proper documentation trail.',
    route: '/rfi-generator-builder',
    pageTitle: 'AI RFI Builder — Request for Information | Ebrora',
    metaDescription:
      'AI-powered RFI builder for UK construction. Formal requests for information with drawing references, clear questions, non-response impact, and response deadlines. Tier 1 ready.',
    documentLabel: 'Request for Information (RFI)',
    descriptionPlaceholder:
      'E.g. "Conflict between drawing C-101 Rev C and Specification Section 5.4.2 regarding pipe bedding material for the 300mm HDPE gravity sewer — drawing shows Type B granular bedding but specification requires Class S selected granular. Clarification needed before pipe laying begins on 28/03/2026."',
    descriptionHeading: 'Describe the Information Required',
    descriptionHint:
      'Describe the question or conflict that requires a formal response. Include drawing numbers, specification references, and any programme implications if the response is not received in time.',
    descriptionExample:
      'Conflict between drawing C-101 Rev C and Specification Section 5.4.2 regarding pipe bedding material for the 300mm HDPE gravity sewer. Drawing shows Type B granular bedding (BS EN 1610) but specification requires Class S selected granular to BD 70/03. Pipe laying for this section is programmed from 28/03/2026. Decision required no later than 24/03/2026 to allow material procurement. Incorrect bedding material could affect drain performance certification.',
    keySections: [
      'RFI Reference & Contract Details',
      'Query Summary',
      'Relevant Drawings & Revisions',
      'Relevant Specification Clauses',
      'Detailed Question / Clarification Required',
      'Background & Context',
      'Impact of Non-Response',
      'Programme Implication',
      'Proposed Solution (if applicable)',
      'Required Response Date',
      'Distribution List',
    ],
    accentColor: '1D4ED8',
    iconType: 'question-circle',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 20,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the information required.',
  },

  'payment-application': {
    slug: 'payment-application',
    name: 'Payment Application Builder',
    shortName: 'Payment Application',
    category: 'Commercial',
    description:
      'Create structured interim payment applications with BoQ breakdown, cumulative values, variations, retention, CIS deductions, and supporting narrative — formatted to main contractor Tier 1 standards and compliant with the Housing Grants, Construction and Regeneration Act 1996 (HGCRA) payment provisions.',
    route: '/payment-application-builder',
    pageTitle: 'AI Payment Application Builder | Ebrora',
    metaDescription:
      'AI-powered payment application builder for UK construction subcontractors. Structured interim valuations with BoQ, variations, retention, and CIS. HGCRA compliant, Tier 1 submission standard.',
    documentLabel: 'Payment Application',
    descriptionPlaceholder:
      'E.g. "Interim Application No. 4 for the month ending 31/03/2026. Contract value £385,000. Works to date: 450m of 300mm HDPE rising main laid and tested (75% of 600m total), 1 No. thrust block complete, 2 No. air valve chambers complete. Approved variation for additional directional drilling £18,500. Retention 3%. CIS 20%."',
    descriptionHeading: 'Describe the Application',
    descriptionHint:
      'Describe the payment application period, works completed to date with percentages, any approved variations, retention rate, and CIS status. Include contract value and application number. The AI will structure a formal application narrative with supporting schedules.',
    descriptionExample:
      'Interim Application No. 4, valuation date 31/03/2026. Original contract value £385,000 (supply and install 600m 300mm HDPE rising main). Works complete to date: 450m pipe installed and pressure tested (75%), 1 No. concrete thrust block (100%), 2 No. air valve chambers (100%), 0 No. washout chambers (0% — materials on site). Approved variation VO-003: additional DD drive at A57 crossing, agreed value £18,500. Retention 3%. CIS deduction 20%. Previous certified: £186,450. Seeking £89,200 this application.',
    keySections: [
      'Application Summary Sheet',
      'Contract Particulars',
      'Gross Valuation — Original Contract',
      'Bill of Quantities Schedule',
      'Materials On Site',
      'Approved Variations Schedule',
      'Preliminary Items',
      'Gross Valuation Total',
      'Less: Retention',
      'Less: CIS Deduction',
      'Less: Previous Certified Amount',
      'Amount Due This Application',
      'Supporting Narrative',
      'Supporting Documents Checklist',
    ],
    accentColor: '064E3B',
    iconType: 'invoice',
    premiumTemplate: true,
    maxWords: 250,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe the payment application.',
  },

  'daywork-sheet': {
    slug: 'daywork-sheet',
    name: 'Daywork Sheet Builder',
    shortName: 'Daywork Sheet',
    category: 'Commercial',
    description:
      'Create properly formatted daywork record sheets covering labour, plant, materials, supervision, and overheads — structured for Tier 1 acceptance and compliant with the CECA Schedule of Dayworks 2011 (Civil Engineering Contractors Association).',
    route: '/daywork-sheet-builder',
    pageTitle: 'AI Daywork Sheet Builder | Ebrora',
    metaDescription:
      'AI-powered daywork sheet builder for UK construction. Labour, plant, materials, supervision, and overheads formatted to CECA Schedule of Dayworks 2011 for Tier 1 acceptance.',
    documentLabel: 'Daywork Sheet',
    descriptionPlaceholder:
      'E.g. "Daywork for removal of unforeseen buried brick culvert discovered at chainage 45m during foul sewer excavation on 19/03/2026. 2 No. labourers (8 hours each), 1 No. 3T mini excavator (6 hours), 1 No. 360° concrete breaker attachment (4 hours), waste disposal (2T skip). Works instructed verbally by C2V+ site manager."',
    descriptionHeading: 'Describe the Daywork Activity',
    descriptionHint:
      'Describe the activity, who carried it out, what plant was used, what materials were consumed, and who instructed the work. Include date, hours, and any relevant site reference numbers.',
    descriptionExample:
      'Daywork for removal of unforeseen buried brick culvert discovered at chainage 45m during foul sewer trench excavation on 19/03/2026. Works instructed verbally by C2V+ site manager at 09:15. Labour: 2 No. CSCS operatives, 8 hours each. Plant: 1 No. 3T Kubota mini excavator (6 hours), 1 No. hydraulic breaker attachment (4 hours). Materials: 2T skip waste disposal, 5T Type 1 reinstatement fill. Supervision: gang foreman 8 hours. Works complete by 17:30. Daywork reference: DW-047.',
    keySections: [
      'Daywork Sheet Header',
      'Contract & Instruction Details',
      'Labour Record',
      'Plant & Equipment Record',
      'Materials & Consumables Record',
      'Supervision & Management',
      'Overheads & Profit',
      'CECA Schedule Rates Applied',
      'Daywork Totals',
      'Supporting Evidence Checklist',
      'Signature & Countersignature Block',
    ],
    accentColor: '92400E',
    iconType: 'timesheet',
    premiumTemplate: true,
    maxWords: 200,
    minWords: 20,
    textareaRows: 6,
    warningText: 'Please provide at least {min} words to describe the daywork activity.',
  },

  'carbon-reduction-plan': {
    slug: 'carbon-reduction-plan',
    name: 'Carbon Reduction Plan Builder',
    shortName: 'Carbon Reduction Plan',
    category: 'Programme',
    description:
      'Create PPN 06/21-compliant Carbon Reduction Plans for public sector and Tier 1 framework bids in minutes. Generates baseline emissions, net zero target, reduction measures, reporting commitments, and board-level sign-off — meeting mandatory UK Government procurement requirements under Procurement Policy Note 06/21.',
    route: '/carbon-reduction-plan-builder',
    pageTitle: 'AI Carbon Reduction Plan Builder | Ebrora',
    metaDescription:
      'AI-powered Carbon Reduction Plan builder for UK construction. PPN 06/21 compliant — baseline emissions, net zero target, reduction measures, and reporting. Required for public sector frameworks.',
    documentLabel: 'Carbon Reduction Plan',
    descriptionPlaceholder:
      'E.g. "Carbon Reduction Plan for Apex Civil Engineering Ltd, a groundworks and civil engineering subcontractor with 45 employees and annual turnover of £8.2M. Works primarily on water/wastewater infrastructure projects in the North West. Scope 1: company vehicles (5 vans, 2 pick-ups) and site plant. Scope 2: office and welfare electricity. Scope 3: supply chain materials and subcontracted works."',
    descriptionHeading: 'Describe Your Organisation',
    descriptionHint:
      'Describe your company — size, turnover, sector, types of work, and current carbon position (if known). Include your Scope 1, 2, and 3 emission sources. The AI will structure a PPN 06/21-compliant Carbon Reduction Plan with baseline, targets, and measures.',
    descriptionExample:
      'Carbon Reduction Plan for Apex Civil Engineering Ltd. Civil engineering subcontractor, 45 employees, £8.2M annual turnover. Groundworks, drainage, and concrete structures on water infrastructure projects in the North West. Scope 1: 7 company vehicles (HVO-capable), 3 No. site generators, fuel-powered plant (hired). Scope 2: main office (2,400 sq ft, leased) on green electricity tariff. Scope 3: concrete, rebar, aggregates, and HDPE pipe procurement; subcontracted M&E works. Target: net zero by 2045 with 50% reduction by 2030. Currently no formal carbon measurement in place.',
    keySections: [
      'Organisational Overview',
      'Commitment to Achieving Net Zero',
      'Baseline Emissions Footprint',
      'Scope 1 Emissions (Direct)',
      'Scope 2 Emissions (Electricity)',
      'Scope 3 Emissions (Supply Chain & Value Chain)',
      'Current Emissions Reduction Initiatives',
      'Reduction Targets — 2030 and 2045',
      'Carbon Reduction Measures & Commitments',
      'Reporting & Measurement Framework',
      'Supply Chain Engagement',
      'Progress Declaration',
      'Board-Level Sign-Off Statement',
    ],
    accentColor: '166534',
    iconType: 'carbon',
    premiumTemplate: true,
    maxWords: 250,
    minWords: 30,
    textareaRows: 7,
    warningText: 'Please provide at least {min} words to describe your organisation.',
  },
};

// ─────────────────────────────────────────────────────────────
// Ordered arrays — existing 16 first, then new 13
// ─────────────────────────────────────────────────────────────

/** Ordered array of all 29 tool slugs for display */
export const AI_TOOL_ORDER: AiToolSlug[] = [
  // Existing 16
  'coshh', 'itp', 'manual-handling', 'dse', 'tbt-generator',
  'confined-spaces', 'incident-report', 'lift-plan', 'emergency-response',
  'quality-checklist', 'scope-of-works', 'permit-to-dig', 'powra',
  'early-warning', 'ncr', 'ce-notification',
  // New 13
  'programme-checker', 'cdm-checker', 'noise-assessment', 'quote-generator',
  'safety-alert', 'carbon-footprint', 'rams-review', 'delay-notification',
  'variation-confirmation', 'rfi-generator', 'payment-application',
  'daywork-sheet', 'carbon-reduction-plan',
];

/** Tools grouped by category — for homepage grid and account dashboard */
export const AI_TOOLS_BY_CATEGORY: Record<string, AiToolSlug[]> = {
  'Health & Safety': [
    'coshh', 'manual-handling', 'dse', 'tbt-generator', 'confined-spaces',
    'incident-report', 'lift-plan', 'emergency-response', 'permit-to-dig',
    'powra', 'cdm-checker', 'noise-assessment', 'safety-alert', 'rams-review',
  ],
  'Quality': [
    'itp', 'quality-checklist', 'ncr',
  ],
  'Commercial': [
    'scope-of-works', 'early-warning', 'ce-notification', 'quote-generator',
    'delay-notification', 'variation-confirmation', 'rfi-generator',
    'payment-application', 'daywork-sheet',
  ],
  'Programme': [
    'programme-checker', 'carbon-footprint', 'carbon-reduction-plan',
  ],
};

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
