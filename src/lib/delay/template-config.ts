import type { DelayTemplateSlug, DelayTemplateConfig } from './types';

export const DELAY_TEMPLATE_CONFIGS: Record<DelayTemplateSlug, DelayTemplateConfig> = {
  'formal-letter': {
    slug: 'formal-letter',
    displayName: 'Formal Delay Notice',
    tagline: 'Detailed delay analysis with programme impact',
    description: 'Dark red accent, Arial font. Full formal delay notification with critical path analysis, float consumption, mitigation measures attempted, and detailed entitlement argument. References NEC4/JCT clauses throughout. For delays with significant time and cost implications.',
    font: 'Arial',
    accentColor: '991B1B',
    style: 'Full formal delay notification',
    pageCount: '5-8',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/delay-templates/thumb-formal-letter.jpg',
    previewPaths: [
      '/product-images/delay-templates/preview-formal-letter-p1.jpg',
      '/product-images/delay-templates/preview-formal-letter-p2.jpg',
      '/product-images/delay-templates/preview-formal-letter-p3.jpg',
      '/product-images/delay-templates/preview-formal-letter-p4.jpg',
    ],
    keySections: ['Contract Clause References', 'Delay Event Analysis', 'Critical Path Impact', 'Mitigation Measures', 'Time & Cost Entitlement'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate Letter',
    tagline: 'Professional delay notification for standard events',
    description: 'Navy accent, Cambria font. Professional corporate delay notification with clear event description, programme impact summary, and entitlement reservation. Suitable for routine delay events.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate letter format',
    pageCount: '3-5',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/delay-templates/thumb-corporate.jpg',
    previewPaths: [
      '/product-images/delay-templates/preview-corporate-p1.jpg',
      '/product-images/delay-templates/preview-corporate-p2.jpg',
      '/product-images/delay-templates/preview-corporate-p3.jpg',
    ],
    keySections: ['Event Description', 'Programme Impact', 'Mitigation Summary', 'Entitlement Reserved'],
  },
  'concise': {
    slug: 'concise',
    displayName: 'Quick Notice',
    tagline: 'Rapid delay notification with essential facts',
    description: 'Slate grey, Arial font. Quick delay notice covering the triggering event, affected activities, and estimated impact. For issuing within contractual time limits when a detailed analysis will follow.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal quick notice',
    pageCount: '1-2',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/delay-templates/thumb-concise.jpg',
    previewPaths: [
      '/product-images/delay-templates/preview-concise-p1.jpg',
      '/product-images/delay-templates/preview-concise-p2.jpg',
    ],
    keySections: ['Triggering Event', 'Affected Activities', 'Estimated Impact'],
  },
};

export const DELAY_TEMPLATE_ORDER: DelayTemplateSlug[] = ['formal-letter', 'corporate', 'concise'];
