// =============================================================================
// Early Warning Notice Builder — Template Configuration
// 8 templates. First 2 free.
// =============================================================================
import { EarlyWarningTemplateConfig, EarlyWarningTemplateSlug } from './types';

export const EARLY_WARNING_TEMPLATE_CONFIGS: Record<EarlyWarningTemplateSlug, EarlyWarningTemplateConfig> = {
  'nec4-contractor-pm': {
    slug: 'nec4-contractor-pm',
    displayName: 'Contractor → PM',
    description:
      'Standard NEC4 Clause 15.1 early warning notice from Contractor to Project Manager. Risk description, evidence summary, cost and programme impact tables, mitigation measures with responsible parties and target dates, risk reduction meeting request, and dual sign-off.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/early-warning-templates/thumb-nec4-contractor-pm.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-nec4-contractor-pm-p1.jpg',
    ],
    keySections: [
      'Notice Details (Ref, Date, Parties)',
      'NEC4 Clause 15.1 Reference',
      'Risk Description & Evidence',
      'Potential Impact on Cost (£ Range)',
      'Potential Impact on Programme',
      'Key Dates at Risk',
      'Proposed Mitigation Measures',
      'Risk Reduction Meeting Request',
      'Dual Sign-Off (Contractor / PM)',
    ],
  },

  'nec4-pm-contractor': {
    slug: 'nec4-pm-contractor',
    displayName: 'PM → Contractor',
    description:
      'Project Manager\u2013issued early warning to the Contractor under NEC4 Clause 15.1. Includes the PM\'s assessment of impact on Prices, Completion Date and performance, actions required of the Contractor with deadlines, risk reduction meeting convened under Clause 15.2, and a structured Contractor response section.',
    pageCount: 2,
    layout: 'pm-issued',
    thumbnailPath: '/product-images/early-warning-templates/thumb-nec4-pm-contractor.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-nec4-pm-contractor-p1.jpg',
    ],
    keySections: [
      'PM \u2192 Contractor Direction Badge',
      'Matter Giving Rise to Early Warning',
      'PM\'s Assessment of Impact',
      'Actions Required of Contractor',
      'Risk Reduction Meeting (Clause 15.2)',
      'Contractor\'s Response Section',
      'Dual Sign-Off (PM / Contractor)',
    ],
  },

  'nec4-sub-to-mc': {
    slug: 'nec4-sub-to-mc',
    displayName: 'Subcontractor → MC',
    description:
      'Subcontractor notification to Main Contractor under NEC4 Engineering & Construction Subcontract Clause 15.1. Compact format with impact cards showing cost and programme estimates, mitigation table, clause reference note, and subcontractor/contractor sign-off.',
    pageCount: 1,
    layout: 'subcontract',
    thumbnailPath: '/product-images/early-warning-templates/thumb-nec4-sub-to-mc.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-nec4-sub-to-mc-p1.jpg',
    ],
    keySections: [
      'Sub \u2192 MC Direction Badge',
      'Subcontract & Main Contract Refs',
      'Risk Description',
      'NEC4 ECS Clause Note',
      'Impact Cards (Cost / Programme)',
      'Proposed Mitigation Table',
      'Subcontractor / Contractor Sign-Off',
    ],
  },

  'nec4-mc-to-sub': {
    slug: 'nec4-mc-to-sub',
    displayName: 'MC → Subcontractor',
    description:
      'Main Contractor\u2013issued early warning to a Subcontractor. Includes a contractual warning box highlighting potential consequences (stop work instruction, performance assessment), outstanding documentation table with deadlines, structured subcontractor response section with root cause and preventive measures.',
    pageCount: 2,
    layout: 'contractor-issued',
    thumbnailPath: '/product-images/early-warning-templates/thumb-nec4-mc-to-sub.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-nec4-mc-to-sub-p1.jpg',
    ],
    keySections: [
      'MC \u2192 Sub Direction Badge',
      'Contractual Warning Box',
      'Outstanding Documentation Table',
      'Deadlines & Due Dates',
      'Expected Subcontractor Response',
      'Root Cause & Preventive Measures',
      'MC / Subcontractor Sign-Off',
    ],
  },

  'comprehensive-risk': {
    slug: 'comprehensive-risk',
    displayName: 'Comprehensive Risk',
    description:
      'Full risk assessment early warning with 5\u00d75 risk matrix, pre/post-mitigation scoring, itemised cost breakdown table, programme impact visualisation, detailed mitigation plan with status tracking, risk register entry, and risk reduction meeting with structured agenda.',
    pageCount: 3,
    layout: 'comprehensive',
    thumbnailPath: '/product-images/early-warning-templates/thumb-comprehensive-risk.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-comprehensive-risk-p1.jpg',
      '/product-images/early-warning-templates/preview-comprehensive-risk-p2.jpg',
    ],
    keySections: [
      '5\u00d75 Risk Matrix (Colour-Coded)',
      'Pre & Post Mitigation Scores',
      'Itemised Cost Breakdown (\u00a3)',
      'Programme Impact Assessment',
      'Critical Path Analysis',
      'Detailed Mitigation Plan + Status',
      'Risk Register Entry',
      'RRM Agenda Items',
      'Three-Role Sign-Off',
    ],
  },

  'health-safety': {
    slug: 'health-safety',
    displayName: 'Health & Safety Risk',
    description:
      'H&S-specific early warning with CDM 2015 regulation references, applicable legislation box (Confined Spaces Regs, COSHH, EH40, LOLER), hierarchy of control table (eliminate \u2192 PPE), immediate actions log, RIDDOR consideration, and SHE Manager notification sign-off.',
    pageCount: 3,
    layout: 'safety',
    thumbnailPath: '/product-images/early-warning-templates/thumb-health-safety.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-health-safety-p1.jpg',
      '/product-images/early-warning-templates/preview-health-safety-p2.jpg',
    ],
    keySections: [
      'H&S Risk Category Badge',
      'CDM 2015 Duty Holder Reference',
      'Applicable Regulations Box',
      'Hierarchy of Control (5 Levels)',
      'Immediate Actions Taken',
      'RIDDOR Assessment',
      'Proposed Mitigation & Next Steps',
      'SHE Manager Notification',
      'Three-Role Sign-Off',
    ],
  },

  'design-technical': {
    slug: 'design-technical',
    displayName: 'Design & Technical',
    description:
      'Design discrepancy and technical risk early warning. Affected drawings reference table (number, title, revision, issue), specific design conflicts identified box, linked RFIs and TQs, proposed resolution actions with designer ownership, and design coordination meeting request.',
    pageCount: 2,
    layout: 'technical',
    thumbnailPath: '/product-images/early-warning-templates/thumb-design-technical.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-design-technical-p1.jpg',
    ],
    keySections: [
      'Design Discipline & Stage',
      'Affected Drawings Table',
      'Design Conflicts Identified',
      'Linked RFIs & TQs',
      'Impact on Cost / Programme / Quality',
      'Proposed Resolution Actions',
      'Design Coordination Meeting',
      'Dual Sign-Off',
    ],
  },

  'weather-force-majeure': {
    slug: 'weather-force-majeure',
    displayName: 'Weather / Force Majeure',
    description:
      'Weather event or force majeure early warning aligned with NEC4 Clause 60.1(13). Weather data summary cards, Met Office source reference, daily weather impact log with site status, compensation event consideration box, 10-year return period comparison, and programme recovery plan.',
    pageCount: 2,
    layout: 'weather',
    thumbnailPath: '/product-images/early-warning-templates/thumb-weather-force-majeure.jpg',
    previewPaths: [
      '/product-images/early-warning-templates/preview-weather-force-majeure-p1.jpg',
    ],
    keySections: [
      'Weather Event Type & Period',
      'Weather Station Reference',
      'Weather Data Summary Cards',
      'Met Office Source Reference',
      'Daily Weather Impact Log',
      'CE Consideration (Clause 60.1(13))',
      '10-Year Return Period Comparison',
      'Proposed Mitigation & Recovery',
      'Dual Sign-Off',
    ],
  },
};

export function getEarlyWarningTemplateConfig(slug: EarlyWarningTemplateSlug): EarlyWarningTemplateConfig {
  return EARLY_WARNING_TEMPLATE_CONFIGS[slug];
}

export function isValidEarlyWarningTemplateSlug(slug: string): slug is EarlyWarningTemplateSlug {
  return slug in EARLY_WARNING_TEMPLATE_CONFIGS;
}
