import type { RfiTemplateSlug, RfiTemplateConfig } from './types';

export const RFI_TEMPLATE_CONFIGS: Record<RfiTemplateSlug, RfiTemplateConfig> = {
  'formal-letter': {
    slug: 'formal-letter',
    displayName: 'Formal RFI',
    tagline: 'Full RFI with drawing references and impact assessment',
    description: 'Steel blue accent, Arial font. Full formal RFI with numbered questions, drawing/specification references, impact of non-response on programme and cost, and clear response deadline. For design queries and coordination issues requiring a definitive answer.',
    font: 'Arial',
    accentColor: '1E40AF',
    style: 'Full formal RFI',
    pageCount: '3-5',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/rfi-templates/thumb-formal-letter.jpg',
    previewPaths: ['/product-images/rfi-templates/preview-formal-letter-p1.jpg'],
    keySections: ['Drawing & Spec References', 'Numbered Questions', 'Impact of Non-Response', 'Response Deadline', 'Attachments Schedule'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate RFI',
    tagline: 'Professional format for routine queries',
    description: 'Navy accent, Cambria font. Professional corporate RFI format with clear questions and response deadline. Suitable for routine design queries and coordination requests.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate letter format',
    pageCount: '2-3',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/rfi-templates/thumb-corporate.jpg',
    previewPaths: ['/product-images/rfi-templates/preview-corporate-p1.jpg'],
    keySections: ['Query Description', 'Questions', 'Response Required By'],
  },
  'concise': {
    slug: 'concise',
    displayName: 'Quick Query',
    tagline: 'Rapid RFI for urgent clarifications',
    description: 'Slate grey, Arial font. Quick single-question RFI for urgent clarifications. Minimal format — the question, the reference, and the deadline. For time-sensitive queries where a phone call needs formal follow-up.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal quick query',
    pageCount: '1',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/rfi-templates/thumb-concise.jpg',
    previewPaths: ['/product-images/rfi-templates/preview-concise-p1.jpg'],
    keySections: ['Question', 'Reference', 'Deadline'],
  },
};

export const RFI_TEMPLATE_ORDER: RfiTemplateSlug[] = ['formal-letter', 'corporate', 'concise'];
