// =============================================================================
// AI Tools — Tool Configuration
// Central config for all 17 AI document generators.
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
      'E.g. "Jotun Jotamastic 87 – Jotun Paints" or "Sika MonoTop 610 – Sika UK"',
    descriptionHeading: 'What is the Product?',
    descriptionHint: 'Enter the exact product name and manufacturer. Our AI will look up the Safety Data Sheet and build a professional COSHH assessment based on the real chemical data for this product.',
    descriptionExample:
      'Jotun Jotamastic 87 – Jotun Paints',
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
      'E.g. "Installation of 300mm diameter ductile iron rising main from new pump station to existing connection chamber. Includes thrust blocks, air valves, washout chambers, chlorination, and pressure testing to 1.5x working pressure."',
    descriptionHeading: 'Describe the Works Being Carried Out',
    descriptionHint: 'Explain the works package in as much detail as possible — type of work, materials, specifications, testing requirements, and any critical quality hold points. The AI will ask 3 follow-up questions based on your description.',
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
    descriptionHeading: 'Describe the Manual Handling Task',
    descriptionHint: 'Explain what is being lifted, carried, pushed or pulled. Include the weight, how often, and the working conditions. The more detail you provide, the better your assessment will be.',
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
    descriptionHeading: 'What is the Toolbox Talk Topic?',
    descriptionHint: 'Describe the specific activity, hazard, or topic you want to brief your team on. Be as specific to your site as possible — generic talks are less effective.',
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
    maxWords: 80,
    minWords: 3,
    textareaRows: 4,
    warningText: 'Please provide at least {min} words to describe the topic.',
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
    name: 'Incident Report Generator',
    shortName: 'Incident Report',
    description:
      'Generate professional incident investigation reports with root cause analysis, 5 Whys methodology, RIDDOR reportability assessment, corrective actions, and lessons learned.',
    route: '/incident-report-builder',
    pageTitle: 'AI Incident Report Generator for Construction | Ebrora',
    metaDescription:
      'AI-powered incident report generator for UK construction sites. Root cause analysis, 5 Whys, RIDDOR assessment, corrective actions, and lessons learned — in minutes.',
    documentLabel: 'Incident Investigation Report',
    descriptionPlaceholder:
      'Describe what happened. E.g. "Operative struck by falling scaffold tube during dismantling of tower scaffold on the north elevation..."',
    descriptionHeading: 'What Happened?',
    descriptionHint: 'Describe the incident in your own words — what happened, where, when, who was involved, and what the outcome was. The AI will ask follow-up questions to build a formal investigation report.',
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
    name: 'Lift Plan Generator',
    shortName: 'Lift Plan',
    description:
      'Generate structured lift plans covering load details, crane specification, radius charts, ground conditions, exclusion zones, appointed persons, and communication arrangements.',
    route: '/lift-plan-builder',
    pageTitle: 'AI Lift Plan Generator for Construction | Ebrora',
    metaDescription:
      'AI-powered lift plan generator for UK construction. Load details, crane selection, exclusion zones, appointed persons, and communication plans. BS 7121 compliant.',
    documentLabel: 'Lift Plan',
    descriptionPlaceholder:
      'Describe the lift. E.g. "Installation of precast concrete beams (8 tonnes each) using a 50T mobile crane. 12m radius, lifting from delivery vehicle to permanent position at 6m height..."',
    descriptionHeading: 'Describe the Lifting Operation',
    descriptionHint: 'Explain what is being lifted, the weight, crane type (if known), radius, height, and any proximity hazards. Include site constraints like overhead lines, adjacent structures, or public areas.',
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
    name: 'Emergency Response Plan Generator',
    shortName: 'Emergency Response Plan',
    description:
      'Generate site-specific emergency response plans covering fire, first aid, environmental spills, structural collapse, utilities failure, and evacuation procedures.',
    route: '/emergency-response-builder',
    pageTitle: 'AI Emergency Response Plan Generator | Ebrora',
    metaDescription:
      'AI-powered emergency response plan generator for UK construction sites. Fire plans, first aid, environmental spills, evacuation, muster points — site-specific and CDM compliant.',
    documentLabel: 'Emergency Response Plan',
    descriptionPlaceholder:
      'Describe the site and its key hazards. E.g. "Operational wastewater treatment works with active construction of new storm tank. Site has deep excavations, confined spaces, H₂S risk, heavy plant, and is adjacent to the Manchester Ship Canal..."',
    descriptionHeading: 'Describe the Site',
    descriptionHint: 'Explain what the site is, what construction works are underway, the principal hazards, and the nearest hospital. The AI will build a comprehensive emergency plan tailored to your site.',
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
    name: 'Quality Inspection Checklist Generator',
    shortName: 'Quality Checklist',
    description:
      'Generate activity-specific quality inspection checklists with hold points, acceptance criteria, reference standards, and sign-off fields for construction works.',
    route: '/quality-checklist-builder',
    pageTitle: 'AI Quality Inspection Checklist Generator | Ebrora',
    metaDescription:
      'AI-powered quality inspection checklist generator for UK construction. Activity-specific checklists with hold points, acceptance criteria, and BS/EN standards references.',
    documentLabel: 'Quality Inspection Checklist',
    descriptionPlaceholder:
      'Describe the activity to be inspected. E.g. "Concrete pour for 300mm thick reinforced concrete base slab, 15m x 8m, C35/45 concrete with steel fibre reinforcement..."',
    descriptionHeading: 'What Activity Needs Inspecting?',
    descriptionHint: 'Describe the specific construction activity. Include materials, dimensions, specifications, and any critical quality requirements. The AI will generate a field-ready inspection checklist.',
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
    name: 'Scope of Works Writer',
    shortName: 'Scope of Works',
    description:
      'Generate formal subcontractor scope of works documents with inclusions, exclusions, interfaces, programme constraints, deliverables, and commercial terms.',
    route: '/scope-of-works-builder',
    pageTitle: 'AI Scope of Works Writer for Construction | Ebrora',
    metaDescription:
      'AI-powered scope of works generator for UK construction subcontracts. Inclusions, exclusions, interfaces, deliverables, and programme constraints — professionally structured.',
    documentLabel: 'Scope of Works',
    descriptionPlaceholder:
      'Describe what the subcontractor needs to do. E.g. "Supply and install MEICA equipment for a new storm water pumping station — 3 No. submersible pumps, MCC panel, level instrumentation, and all associated pipework..."',
    descriptionHeading: 'What Does the Subcontractor Need to Do?',
    descriptionHint: 'Describe the works package in detail — what is included, what materials/equipment, approximate quantities, and any known constraints. The AI will structure it into a formal scope document.',
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
    name: 'Permit to Dig Generator',
    shortName: 'Permit to Dig',
    description:
      'Generate permit to dig documents covering utility searches, CAT & Genny scanning, hand-dig zones, safe digging methods, and supervision requirements.',
    route: '/permit-to-dig-builder',
    pageTitle: 'AI Permit to Dig Generator | Ebrora',
    metaDescription:
      'AI-powered permit to dig generator for UK construction. Utility searches, CAT & Genny requirements, hand-dig zones, safe digging methods, and HSG47 compliance.',
    documentLabel: 'Permit to Dig',
    descriptionPlaceholder:
      'Describe the excavation. E.g. "Trench excavation for 225mm diameter foul sewer, 2.5m deep, along the eastern boundary of the site adjacent to the existing substation..."',
    descriptionHeading: 'Describe the Excavation',
    descriptionHint: 'Explain where you are digging, the depth, the purpose, and any known services in the area. Include the results of any utility searches if available.',
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
    name: 'POWRA Generator',
    shortName: 'POWRA',
    description:
      'Generate point of work risk assessments — quick, field-level assessments done before each task covering today\'s hazards, controls, stop conditions, and team sign-on.',
    route: '/powra-builder',
    pageTitle: 'AI POWRA Generator — Point of Work Risk Assessment | Ebrora',
    metaDescription:
      'AI-powered POWRA generator for UK construction. Quick point of work risk assessments with hazards, controls, stop conditions, and team sign-on. Field-ready format.',
    documentLabel: 'Point of Work Risk Assessment (POWRA)',
    descriptionPlaceholder:
      'Describe today\'s task. E.g. "Excavation of trial holes to locate existing 300mm water main using 3T mini excavator and hand digging within 500mm of services..."',
    descriptionHeading: 'What Task Are You About to Start?',
    descriptionHint: 'Briefly describe the specific task being carried out today — location, method, plant involved, and any particular concerns. The AI will generate a field-ready POWRA.',
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
    name: 'Early Warning Notice Drafter',
    shortName: 'Early Warning Notice',
    description:
      'Generate NEC-compliant early warning notices with risk description, potential impact on cost, time, and quality, and proposed mitigation measures.',
    route: '/early-warning-builder',
    pageTitle: 'AI Early Warning Notice Generator | Ebrora',
    metaDescription:
      'AI-powered NEC early warning notice generator for UK construction contracts. Risk description, impact assessment, and mitigation proposals — contract-compliant format.',
    documentLabel: 'Early Warning Notice',
    descriptionPlaceholder:
      'Describe the risk or issue. E.g. "Unforeseen ground conditions encountered during piling — soft alluvial deposits extending 3m deeper than the GI report indicated..."',
    descriptionHeading: 'Describe the Risk or Issue',
    descriptionHint: 'Explain the matter that could increase cost, delay completion, or impair performance. Include what you know so far and any evidence. The AI will structure it into a formal NEC early warning notice.',
    descriptionExample:
      'Unforeseen ground conditions encountered during piling for the new storm tank at Salford WwTW. Soft alluvial deposits extending 3m deeper than indicated in the Ground Investigation report. Piling contractor reports current pile design may be insufficient — longer piles or alternative foundation solution may be required.',
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
    name: 'NCR Generator',
    shortName: 'Non-Conformance Report',
    description:
      'Generate non-conformance reports with defect description, root cause analysis, corrective and preventive actions, disposition, and close-out requirements.',
    route: '/ncr-builder',
    pageTitle: 'AI Non-Conformance Report Generator | Ebrora',
    metaDescription:
      'AI-powered NCR generator for UK construction. Defect description, root cause analysis, corrective actions, disposition, and close-out verification — ISO 9001 aligned.',
    documentLabel: 'Non-Conformance Report',
    descriptionPlaceholder:
      'Describe the non-conformance. E.g. "Concrete test cubes from base slab pour on 15/03/2026 failed to reach specified 28-day strength — results show 31 N/mm² against specified C35/45..."',
    descriptionHeading: 'Describe the Non-Conformance',
    descriptionHint: 'Explain what has gone wrong — what was specified vs what was delivered/built, where, and when it was discovered. Include any test results or measurements.',
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
    name: 'Compensation Event Notification Drafter',
    shortName: 'CE Notification',
    description:
      'Generate NEC-compliant compensation event notifications with clause references, event description, programme impact, cost implications, and supporting evidence checklist.',
    route: '/ce-notification-builder',
    pageTitle: 'AI Compensation Event Notification Generator | Ebrora',
    metaDescription:
      'AI-powered NEC compensation event notification generator for UK construction. Clause references, impact assessment, and entitlement — contract-compliant format.',
    documentLabel: 'Compensation Event Notification',
    descriptionPlaceholder:
      'Describe the compensation event. E.g. "Client instruction to change storm tank overflow weir level from 42.150m AOD to 42.350m AOD — requires redesign of weir wall, new formwork, and additional concrete..."',
    descriptionHeading: 'Describe the Compensation Event',
    descriptionHint: 'Explain what happened that you believe constitutes a compensation event under the contract. Include the relevant client instruction, changed condition, or event. The AI will structure it into a formal CE notification.',
    descriptionExample:
      'Client instruction received 10/03/2026 to change storm tank overflow weir level from 42.150m AOD to 42.350m AOD at Salford WwTW. Requires redesign of weir wall reinforcement, new formwork (existing formwork already fabricated to original level), additional concrete, and re-sequencing of the pour programme. Original weir wall pour was programmed for 25/03/2026.',
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
};

/** Ordered array of tool slugs for display */
export const AI_TOOL_ORDER: AiToolSlug[] = [
  'coshh',
  'itp',
  'manual-handling',
  'dse',
  'tbt-generator',
  'confined-spaces',
  'incident-report',
  'lift-plan',
  'emergency-response',
  'quality-checklist',
  'scope-of-works',
  'permit-to-dig',
  'powra',
  'early-warning',
  'ncr',
  'ce-notification',
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
