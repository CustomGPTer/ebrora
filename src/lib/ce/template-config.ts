import type { CeTemplateSlug, CeTemplateConfig } from './types';

export const CE_TEMPLATE_CONFIGS: Record<CeTemplateSlug, CeTemplateConfig> = {
  'formal-letter': {
    slug: 'formal-letter',
    displayName: 'Formal NEC Letter',
    tagline: 'Full legal precision with NEC4 clause references',
    description: 'Deep green accent, Arial font. Full formal CE notification with NEC4 Clause 61 references, detailed event description, programme and cost impact assessment, and entitlement argument. For contested or high-value CEs requiring maximum contractual protection.',
    font: 'Arial',
    accentColor: '065F46',
    style: 'Full formal NEC notification',
    pageCount: '4-7',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/ce-templates/thumb-formal-letter.jpg',
    previewPaths: ['/product-images/ce-templates/preview-formal-letter-p1.jpg'],
    keySections: ['NEC4 Clause References', 'Event Description & Evidence', 'Programme Impact Assessment', 'Cost Entitlement Argument', 'Required Actions'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate Letter',
    tagline: 'Professional corporate format for routine notifications',
    description: 'Navy accent, Cambria font. Professional corporate letter format suitable for standard CE notifications. Clear event identification, impact summary, and response deadline. Balanced formality.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate letter format',
    pageCount: '3-5',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/ce-templates/thumb-corporate.jpg',
    previewPaths: ['/product-images/ce-templates/preview-corporate-p1.jpg'],
    keySections: ['Event Identification', 'Impact Summary', 'Entitlement Statement', 'Response Required'],
  },
  'concise': {
    slug: 'concise',
    displayName: 'Concise Notice',
    tagline: 'Quick notification with key facts only',
    description: 'Slate grey, Arial font. Stripped-back notification covering the essential facts: what happened, which clause, and what you want. For time-critical notifications where speed of issue matters more than detailed argument.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal quick notification',
    pageCount: '1-2',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/ce-templates/thumb-concise.jpg',
    previewPaths: ['/product-images/ce-templates/preview-concise-p1.jpg'],
    keySections: ['Event & Clause Reference', 'Brief Description', 'Action Required'],
  },
};

export const CE_TEMPLATE_ORDER: CeTemplateSlug[] = ['formal-letter', 'corporate', 'concise'];
