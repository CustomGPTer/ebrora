// =============================================================================
// Lift Plan Builder — Template Configuration
// 4 templates. Paid-only tool (Standard/Professional).
// =============================================================================
import { LiftPlanTemplateConfig, LiftPlanTemplateSlug } from './types';

export const LIFT_PLAN_TEMPLATE_CONFIGS: Record<LiftPlanTemplateSlug, LiftPlanTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'The most comprehensive lift plan template available. Green-branded cover page with 22 structured sections covering every aspect of BS 7121 and LOLER 1998 compliance. Includes load details with lifting point assessment, crane specification with thorough examination records, lift geometry with percentage-of-capacity calculation, rigging arrangement with sling angle analysis, ground conditions and outrigger pad sizing, proximity hazard survey, overhead services assessment, exclusion zone dimensions, appointed persons register with competence records, communication arrangements, weather limits, environmental considerations, pre-lift inspection checklist, step-by-step lift sequence, contingency and emergency procedures, risk assessment matrix, regulatory references, approval sign-off, and lift completion record.',
    pageCount: 6,
    layout: 'standard',
    thumbnailPath: '/product-images/lift-plan-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/lift-plan-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/lift-plan-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/lift-plan-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/lift-plan-templates/preview-ebrora-standard-p4.jpg',
      '/product-images/lift-plan-templates/preview-ebrora-standard-p5.jpg',
      '/product-images/lift-plan-templates/preview-ebrora-standard-p6.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'Load Details with Lifting Point Assessment',
      'Crane Specification & Thorough Examination',
      'Lift Geometry & % Capacity Calculation',
      'Rigging Arrangement & Sling Angle Analysis',
      'Ground Conditions & Outrigger Pad Sizing',
      'Proximity Hazard Survey & Overhead Services',
      'Exclusion Zone Dimensions & Barriers',
      'Appointed Persons & Competence Records',
      'Communication Arrangements',
      'Weather Limits & Environmental Considerations',
      'Pre-Lift Inspection Checklist',
      'Step-by-Step Lift Sequence',
      'Contingency & Emergency Procedures',
      'Risk Assessment Matrix',
      'Lift Completion Record',
    ],
  },

  'operator-brief': {
    slug: 'operator-brief',
    displayName: 'Crane Operator Brief',
    description:
      'Compact, lamination-ready format designed for the crane operator to have in the cab. Large-print load weight and duty at radius, slew limits, rigging details at a glance, numbered lift sequence steps, hand signals reference, exclusion zone layout, abort criteria, and emergency contacts. Maximum 3 pages — quick reference, not a full engineering document.',
    pageCount: 3,
    layout: 'compact',
    thumbnailPath: '/product-images/lift-plan-templates/thumb-operator-brief.jpg',
    previewPaths: [
      '/product-images/lift-plan-templates/preview-operator-brief-p1.jpg',
      '/product-images/lift-plan-templates/preview-operator-brief-p2.jpg',
      '/product-images/lift-plan-templates/preview-operator-brief-p3.jpg',
    ],
    keySections: [
      'Large-Print Load Weight & Duty',
      'Radius, Height & Slew Limits',
      'Rigging Details at a Glance',
      'Numbered Lift Sequence Steps',
      'Hand Signals Reference',
      'Exclusion Zone Layout',
      'Abort Criteria & Emergency Contacts',
      'Lamination-Ready Format',
    ],
  },

  'tandem-lift': {
    slug: 'tandem-lift',
    displayName: 'Tandem / Complex Lift',
    description:
      'Teal-accented template specifically designed for tandem lifts (two or more cranes), complex multi-phase lifts, and awkward load operations. Dual crane specifications side-by-side, load sharing percentage calculations, synchronisation plan with timing, inter-crane communication protocol, enhanced ground bearing requirements per crane position, crane interaction zones, what-if failure analysis, multiple lift phase sequencing, and engineering calculations summary.',
    pageCount: 5,
    layout: 'structured',
    thumbnailPath: '/product-images/lift-plan-templates/thumb-tandem-lift.jpg',
    previewPaths: [
      '/product-images/lift-plan-templates/preview-tandem-lift-p1.jpg',
      '/product-images/lift-plan-templates/preview-tandem-lift-p2.jpg',
      '/product-images/lift-plan-templates/preview-tandem-lift-p3.jpg',
      '/product-images/lift-plan-templates/preview-tandem-lift-p4.jpg',
      '/product-images/lift-plan-templates/preview-tandem-lift-p5.jpg',
    ],
    keySections: [
      'Dual Crane Specifications Side-by-Side',
      'Load Sharing Percentage Calculations',
      'Synchronisation Plan with Timing',
      'Inter-Crane Communication Protocol',
      'Enhanced Ground Bearing per Position',
      'Crane Interaction Zones',
      'What-If Failure Analysis',
      'Multi-Phase Lift Sequencing',
      'Engineering Calculations Summary',
    ],
  },

  'loler-compliance': {
    slug: 'loler-compliance',
    displayName: 'LOLER Compliance',
    description:
      'Navy-accented regulatory compliance template structured around demonstrating full LOLER 1998 and PUWER 1998 compliance. Regulation-by-regulation compliance checklist, thorough examination records (Reg 9/10), competent person declarations (Reg 8), equipment register with certification status, sling and shackle certification table, lift categorisation (routine/non-routine/complex per BS 7121), previous similar lifts log, defect reporting procedure, post-lift inspection checklist, and regulatory references with cross-referencing.',
    pageCount: 4,
    layout: 'banded',
    thumbnailPath: '/product-images/lift-plan-templates/thumb-loler-compliance.jpg',
    previewPaths: [
      '/product-images/lift-plan-templates/preview-loler-compliance-p1.jpg',
      '/product-images/lift-plan-templates/preview-loler-compliance-p2.jpg',
      '/product-images/lift-plan-templates/preview-loler-compliance-p3.jpg',
      '/product-images/lift-plan-templates/preview-loler-compliance-p4.jpg',
    ],
    keySections: [
      'LOLER Regulation-by-Regulation Checklist',
      'Thorough Examination Records (Reg 9/10)',
      'Competent Person Declarations (Reg 8)',
      'Equipment Register & Certification',
      'Sling & Shackle Certification Table',
      'Lift Categorisation (BS 7121)',
      'Previous Similar Lifts Log',
      'Post-Lift Inspection Checklist',
      'PUWER 1998 Requirements',
      'Regulatory Cross-Reference Table',
    ],
  },
};

export function getLiftPlanTemplateConfig(slug: LiftPlanTemplateSlug): LiftPlanTemplateConfig {
  return LIFT_PLAN_TEMPLATE_CONFIGS[slug];
}

export function isValidLiftPlanTemplateSlug(slug: string): slug is LiftPlanTemplateSlug {
  return slug in LIFT_PLAN_TEMPLATE_CONFIGS;
}
