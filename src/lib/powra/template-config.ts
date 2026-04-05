// =============================================================================
// POWRA Builder — Template Configuration
// 4 templates. FREE tool (first 2 templates free).
// =============================================================================
import { PowraTemplateConfig, PowraTemplateSlug } from './types';

export const POWRA_TEMPLATE_CONFIGS: Record<PowraTemplateSlug, PowraTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive POWRA with green-branded cover. Task description, hazard identification matrix with L\u00D7S risk rating and RAG colours, control measures per hazard, residual risk re-rating, PPE requirements, emergency arrangements, dynamic reassessment triggers, stop conditions, and 4-role sign-off.',
    pageCount: 5,
    layout: 'standard',
    thumbnailPath: '/product-images/powra-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/powra-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/powra-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/powra-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/powra-templates/preview-ebrora-standard-p4.jpg',
      '/product-images/powra-templates/preview-ebrora-standard-p5.jpg',
    ],
    keySections: [
      'Green Branded Cover',
      'Task Description & Conditions',
      'Hazard Matrix with RAG Rating',
      'Control Measures per Hazard',
      'Residual Risk Re-Rating',
      'PPE Requirements',
      'Stop Conditions',
      'Emergency Arrangements',
      '4-Role Sign-Off',
    ],
  },

  'quick-card': {
    slug: 'quick-card',
    displayName: 'Quick Card',
    description:
      'Pocket-sized lamination-ready POWRA card. STOP \u2192 THINK \u2192 ACT format, 8-item hazard checklist with tick/cross, conditions check (weather, ground, overhead, access), controls summary, prominent "IF IN DOUBT \u2014 STOP WORK" banner, operative and supervisor sign-off.',
    pageCount: 3,
    layout: 'compact',
    thumbnailPath: '/product-images/powra-templates/thumb-quick-card.jpg',
    previewPaths: [
      '/product-images/powra-templates/preview-quick-card-p1.jpg',
      '/product-images/powra-templates/preview-quick-card-p2.jpg',
      '/product-images/powra-templates/preview-quick-card-p3.jpg',
    ],
    keySections: [
      'STOP \u2192 THINK \u2192 ACT Format',
      '8-Item Hazard Checklist',
      'Conditions Check',
      'Controls Summary',
      '"IF IN DOUBT \u2014 STOP WORK" Banner',
      'Operative & Supervisor Sign-Off',
    ],
  },

  'task-specific': {
    slug: 'task-specific',
    displayName: 'Task Specific',
    description:
      'Phase-by-phase POWRA organised by task step. Each phase gets its own hazard and control table with risk progression. Method statement integration, plant and equipment register, permits cross-reference (hot work, confined space, permit to dig), sequential phase risk assessment.',
    pageCount: 6,
    layout: 'phased',
    thumbnailPath: '/product-images/powra-templates/thumb-task-specific.jpg',
    previewPaths: [
      '/product-images/powra-templates/preview-task-specific-p1.jpg',
      '/product-images/powra-templates/preview-task-specific-p2.jpg',
      '/product-images/powra-templates/preview-task-specific-p3.jpg',
      '/product-images/powra-templates/preview-task-specific-p4.jpg',
      '/product-images/powra-templates/preview-task-specific-p5.jpg',
      '/product-images/powra-templates/preview-task-specific-p6.jpg',
    ],
    keySections: [
      'Phase-by-Phase Risk Assessment',
      'Hazard & Control Table per Phase',
      'Risk Progression Through Phases',
      'Method Statement Integration',
      'Plant & Equipment Register',
      'Permits Cross-Reference',
      'Stop Conditions per Phase',
    ],
  },

  'supervisor-review': {
    slug: 'supervisor-review',
    displayName: 'Supervisor Review',
    description:
      'Full POWRA with supervisor audit layer. Competency verification checklist, permit cross-references, environmental considerations, monitoring requirements, close-out verification, lessons learned, and regulatory references (MHSW 1999, CDM 2015). Designed for supervisor sign-off and file retention.',
    pageCount: 8,
    layout: 'audit',
    thumbnailPath: '/product-images/powra-templates/thumb-supervisor-review.jpg',
    previewPaths: [
      '/product-images/powra-templates/preview-supervisor-review-p1.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p2.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p3.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p4.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p5.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p6.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p7.jpg',
      '/product-images/powra-templates/preview-supervisor-review-p8.jpg',
    ],
    keySections: [
      'Full Hazard Matrix with RAG',
      'Competency Verification Checklist',
      'Permit Cross-References',
      'Environmental Considerations',
      'Monitoring Requirements',
      'Close-Out Verification',
      'Lessons Learned',
      'Regulatory References',
    ],
  },
};

export function getPowraTemplateConfig(slug: PowraTemplateSlug): PowraTemplateConfig {
  return POWRA_TEMPLATE_CONFIGS[slug];
}

export function isValidPowraTemplateSlug(slug: string): slug is PowraTemplateSlug {
  return slug in POWRA_TEMPLATE_CONFIGS;
}
