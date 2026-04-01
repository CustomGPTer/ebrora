import type { VariationTemplateSlug, VariationTemplateConfig } from './types';

export const VARIATION_TEMPLATE_CONFIGS: Record<VariationTemplateSlug, VariationTemplateConfig> = {
  'formal-letter': {
    slug: 'formal-letter',
    displayName: 'Formal Confirmation',
    tagline: 'Full written record with cost and time impact',
    description: 'Teal accent, Arial font. Full formal variation confirmation letter creating a written record of the verbal instruction, detailing scope change, estimated cost and time impact, and requesting formal written instruction. Maximum contractual protection.',
    font: 'Arial',
    accentColor: '0F766E',
    style: 'Full formal confirmation letter',
    pageCount: '4-6',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/variation-templates/thumb-formal-letter.jpg',
    previewPaths: ['/product-images/variation-templates/preview-formal-letter-p1.jpg'],
    keySections: ['Instruction Record', 'Scope Change Description', 'Cost & Time Impact', 'Contractual Basis', 'Formal Instruction Request'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate Letter',
    tagline: 'Professional confirmation for standard variations',
    description: 'Navy accent, Cambria font. Professional corporate confirmation letter recording the verbal instruction and requesting written confirmation. Clear and balanced format.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate letter format',
    pageCount: '2-4',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/variation-templates/thumb-corporate.jpg',
    previewPaths: ['/product-images/variation-templates/preview-corporate-p1.jpg'],
    keySections: ['Instruction Summary', 'Scope Description', 'Impact Assessment', 'Confirmation Requested'],
  },
  'concise': {
    slug: 'concise',
    displayName: 'Quick Confirmation',
    tagline: 'Rapid written record of verbal instruction',
    description: 'Slate grey, Arial font. Quick confirmation of a verbal instruction with key facts: who said what, when, and the requested action. For issuing same-day while the conversation is fresh.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal quick confirmation',
    pageCount: '1-2',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/variation-templates/thumb-concise.jpg',
    previewPaths: ['/product-images/variation-templates/preview-concise-p1.jpg'],
    keySections: ['Verbal Instruction Record', 'Key Facts', 'Action Required'],
  },
};

export const VARIATION_TEMPLATE_ORDER: VariationTemplateSlug[] = ['formal-letter', 'corporate', 'concise'];
