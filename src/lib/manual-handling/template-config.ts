// =============================================================================
// Manual Handling Assessment Builder — Template Configuration
// 4 templates. Free tool (first 2 templates free on free tier).
// =============================================================================
import { ManualHandlingTemplateConfig, ManualHandlingTemplateSlug } from './types';

export const MANUAL_HANDLING_TEMPLATE_CONFIGS: Record<ManualHandlingTemplateSlug, ManualHandlingTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive green-branded TILE methodology assessment with cover page. Full Task analysis (postures, grip, frequency, duration, distance, height, twisting), Individual capability factors (age, fitness, pregnancy, training), Load characteristics (weight, shape, grip, stability, sharp edges), Environment assessment (space, floors, lighting, temperature, wind), Schedule 1 risk factor checklist, RAG-rated risk scoring matrix, hierarchy of control measures, mechanical aid alternatives, residual risk rating, monitoring plan, regulatory references, and sign-off.',
    pageCount: 5,
    layout: 'standard',
    thumbnailPath: '/product-images/manual-handling-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/manual-handling-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/manual-handling-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/manual-handling-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/manual-handling-templates/preview-ebrora-standard-p4.jpg',
      '/product-images/manual-handling-templates/preview-ebrora-standard-p5.jpg'
    ],
    keySections: [
      'Green Branded Cover Page',
      'Task Analysis (TILE — T)',
      'Individual Capability Assessment (TILE — I)',
      'Load Characteristics (TILE — L)',
      'Environmental Factors (TILE — E)',
      'Schedule 1 Risk Factor Checklist',
      'RAG-Rated Risk Scoring Matrix',
      'Hierarchy of Control Measures',
      'Mechanical Aid Alternatives',
      'Residual Risk Rating & Monitoring'
    ],
  },

  'mac-assessment': {
    slug: 'mac-assessment',
    displayName: 'MAC Assessment',
    description:
      'Amber-accented template structured around the HSE Manual Handling Assessment Charts (MAC) tool. Colour-coded scoring for each MAC factor: load weight/frequency, hand distance from body, vertical lift zone, torso twisting, postural constraints, grip quality, floor surface, environmental factors, and carrying distance. Overall MAC score with RAG rating, priority action level, and targeted control measures linked to each scored factor.',
    pageCount: 4,
    layout: 'scoring',
    thumbnailPath: '/product-images/manual-handling-templates/thumb-mac-assessment.jpg',
    previewPaths: [
      '/product-images/manual-handling-templates/preview-mac-assessment-p1.jpg',
      '/product-images/manual-handling-templates/preview-mac-assessment-p2.jpg',
      '/product-images/manual-handling-templates/preview-mac-assessment-p3.jpg',
    ],
    keySections: [
      'MAC Factor Scoring Table',
      'Load Weight & Frequency Score',
      'Hand Distance & Vertical Zone',
      'Torso Twisting & Postural Constraints',
      'Grip Quality & Floor Surface',
      'Carrying Distance Score',
      'Overall MAC Score & Priority Level',
      'Factor-Linked Control Measures'
    ],
  },

  'rapp-assessment': {
    slug: 'rapp-assessment',
    displayName: 'RAPP Assessment',
    description:
      'Teal-accented template specifically for pushing and pulling operations using the HSE Risk Assessment of Pushing and Pulling (RAPP) tool. Force requirements assessment, handle height and position, distance pushed/pulled, floor surface and gradient analysis, frequency and duration, wheel/castor condition (for wheeled loads), one-handed vs two-handed forces, initial vs sustained force, control measures specific to push/pull operations, and mechanical alternatives.',
    pageCount: 4,
    layout: 'structured',
    thumbnailPath: '/product-images/manual-handling-templates/thumb-rapp-assessment.jpg',
    previewPaths: [
      '/product-images/manual-handling-templates/preview-rapp-assessment-p1.jpg',
      '/product-images/manual-handling-templates/preview-rapp-assessment-p2.jpg',
      '/product-images/manual-handling-templates/preview-rapp-assessment-p3.jpg',
    ],
    keySections: [
      'Push/Pull Operation Description',
      'Force Requirements Assessment',
      'Handle Height & Position Analysis',
      'Distance, Surface & Gradient',
      'Frequency, Duration & Wheel Condition',
      'Initial vs Sustained Force',
      'RAPP Factor Scoring',
      'Push/Pull-Specific Controls',
      'Mechanical Alternatives'
    ],
  },

  'training-briefing': {
    slug: 'training-briefing',
    displayName: 'Training & Briefing',
    description:
      'Navy compact format designed as an operative training card and toolbox talk handout. Safe lifting technique steps with body posture guidance, weight limits table (HSE guideline figures by zone and gender), key do\'s and don\'ts, common injuries and how to avoid them, when to ask for help, mechanical aids available on site, reporting procedure for discomfort, and sign-off attendance register. Lamination-ready for posting in welfare cabins.',
    pageCount: 3,
    layout: 'compact',
    thumbnailPath: '/product-images/manual-handling-templates/thumb-training-briefing.jpg',
    previewPaths: [
      '/product-images/manual-handling-templates/preview-training-briefing-p1.jpg',
      '/product-images/manual-handling-templates/preview-training-briefing-p2.jpg'
    ],
    keySections: [
      'Safe Lifting Technique Steps',
      'HSE Weight Guideline Figures',
      'Key Do\'s and Don\'ts',
      'Common Injuries & Prevention',
      'When to Ask for Help',
      'Mechanical Aids Available',
      'Reporting Procedure',
      'Attendance Register'
    ],
  },
};

export function getManualHandlingTemplateConfig(slug: ManualHandlingTemplateSlug): ManualHandlingTemplateConfig {
  return MANUAL_HANDLING_TEMPLATE_CONFIGS[slug];
}

export function isValidManualHandlingTemplateSlug(slug: string): slug is ManualHandlingTemplateSlug {
  return slug in MANUAL_HANDLING_TEMPLATE_CONFIGS;
}
