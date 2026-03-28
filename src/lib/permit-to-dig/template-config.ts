// =============================================================================
// Permit to Dig Builder — Template Configuration
// 4 templates. FREE tool (first 2 templates free).
// =============================================================================
import { PermitToDigTemplateConfig, PermitToDigTemplateSlug } from './types';

export const PERMIT_TO_DIG_TEMPLATE_CONFIGS: Record<PermitToDigTemplateSlug, PermitToDigTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive HSG47 permit with green-branded cover page. Excavation details, statutory records search, colour-coded service identification, CAT & Genny scan results, hand-dig zone definitions (500 mm per HSG47), safe digging method statement, plant restrictions, backfill & reinstatement, emergency strike procedures, and 5-role sign-off.',
    pageCount: 5,
    layout: 'standard',
    thumbnailPath: '/product-images/permit-to-dig-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/permit-to-dig-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/permit-to-dig-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/permit-to-dig-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/permit-to-dig-templates/preview-ebrora-standard-p4.jpg',
      '/product-images/permit-to-dig-templates/preview-ebrora-standard-p5.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'Excavation Details (8+ Fields)',
      'Statutory Records Search (5 Providers)',
      'Colour-Coded Service Identification',
      'CAT & Genny Scan Results',
      'Hand-Dig Zone Definitions (500 mm)',
      'Safe Digging Method Statement',
      'Emergency Strike Procedures',
      '5-Role Sign-Off',
    ],
  },

  'daily-permit': {
    slug: 'daily-permit',
    displayName: 'Daily Permit',
    description:
      'Compact shift card valid ONE SHIFT ONLY. 10-item pre-dig checklist, services in area today, weather and ground conditions, personnel on permit, prominent "IF YOU STRIKE" emergency warning, sign-on and sign-off. Designed for daily issue to excavation gangs.',
    pageCount: 2,
    layout: 'compact',
    thumbnailPath: '/product-images/permit-to-dig-templates/thumb-daily-permit.jpg',
    previewPaths: [
      '/product-images/permit-to-dig-templates/preview-daily-permit-p1.jpg',
      '/product-images/permit-to-dig-templates/preview-daily-permit-p2.jpg',
    ],
    keySections: [
      'ONE SHIFT ONLY Validity Banner',
      '10-Item Pre-Dig Checklist',
      'Services in Area Today',
      'Weather & Ground Conditions',
      'Personnel on Permit',
      '"IF YOU STRIKE" Emergency Warning',
      'Sign-On / Sign-Off',
    ],
  },

  'utility-strike': {
    slug: 'utility-strike',
    displayName: 'Utility Strike',
    description:
      'Emergency response document for utility strikes. Immediate actions by 4 service types (gas — evacuate 50 m; electric — 5 m clear; water — isolate if safe; telecom — stop and report), notification cascade, 8-step strike response, scene preservation, investigation and RIDDOR assessment, lessons learned.',
    pageCount: 3,
    layout: 'emergency',
    thumbnailPath: '/product-images/permit-to-dig-templates/thumb-utility-strike.jpg',
    previewPaths: [
      '/product-images/permit-to-dig-templates/preview-utility-strike-p1.jpg',
      '/product-images/permit-to-dig-templates/preview-utility-strike-p2.jpg',
      '/product-images/permit-to-dig-templates/preview-utility-strike-p3.jpg',
    ],
    keySections: [
      'Immediate Actions by Service Type',
      'Gas — Evacuate 50 m, No Ignition',
      'Electric — 5 m Clear, Assume Live',
      'Notification Cascade (6+ Contacts)',
      '8-Step Strike Response Procedure',
      'Scene Preservation Protocol',
      'Investigation & RIDDOR Assessment',
      'Lessons Learned Template',
    ],
  },

  'avoidance-plan': {
    slug: 'avoidance-plan',
    displayName: 'Avoidance Plan',
    description:
      'Site-wide strategy document for underground service avoidance. Avoidance strategy statement, statutory records summary, PAS 128 survey classification, excavation zones with service density rating (High/Medium/Low), safe digging rules, CAT & Genny competence register, permit issuing procedure, monitoring and audit plan.',
    pageCount: 4,
    layout: 'strategic',
    thumbnailPath: '/product-images/permit-to-dig-templates/thumb-avoidance-plan.jpg',
    previewPaths: [
      '/product-images/permit-to-dig-templates/preview-avoidance-plan-p1.jpg',
      '/product-images/permit-to-dig-templates/preview-avoidance-plan-p2.jpg',
      '/product-images/permit-to-dig-templates/preview-avoidance-plan-p3.jpg',
      '/product-images/permit-to-dig-templates/preview-avoidance-plan-p4.jpg',
    ],
    keySections: [
      'Avoidance Strategy Statement',
      'Statutory Records Summary',
      'PAS 128 Survey Classification',
      'Excavation Zones & Density Rating',
      'Safe Digging Rules',
      'CAT & Genny Competence Register',
      'Permit Issuing Procedure',
      'Monitoring & Audit Plan',
    ],
  },
};

export function getPermitToDigTemplateConfig(slug: PermitToDigTemplateSlug): PermitToDigTemplateConfig {
  return PERMIT_TO_DIG_TEMPLATE_CONFIGS[slug];
}

export function isValidPermitToDigTemplateSlug(slug: string): slug is PermitToDigTemplateSlug {
  return slug in PERMIT_TO_DIG_TEMPLATE_CONFIGS;
}
