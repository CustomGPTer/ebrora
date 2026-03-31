// =============================================================================
// Scope of Works Builder — Template Configuration
// =============================================================================
import type { ScopeTemplateSlug, ScopeTemplateConfig } from './types';

export const SCOPE_TEMPLATE_CONFIGS: Record<ScopeTemplateSlug, ScopeTemplateConfig> = {
  'corporate-blue': {
    slug: 'corporate-blue',
    displayName: 'Corporate Blue',
    tagline: 'Clean, modern, professional',
    description:
      'Blue header bands, alternating grey/white table rows, blue underlined section dividers. Arial font. Ideal for corporate clients who value clean, modern documentation.',
    font: 'Arial',
    accentColor: '1F4E79',
    style: 'Modern corporate with banded headers and structured tables',
    pageCount: '8–12',
    thumbnailPath: '/product-images/scope-templates/thumb-corporate-blue.jpg',
    previewPaths: ['/product-images/scope-templates/preview-corporate-blue-p1.jpg'],
    keySections: ['Document Control Table', 'Approval Sign-Off', 'Inclusions & Exclusions Tables', 'Commercial Boilerplate Clauses'],
  },
  'formal-contract': {
    slug: 'formal-contract',
    displayName: 'Formal Contract',
    tagline: 'Legal contract style with clause numbering',
    description:
      'Charcoal headers with deep red clause numbers, Cambria font, numbered sub-clauses (1.1, 1.2). Minimal colour. Reads like a formal legal contract document — ideal for NEC and JCT frameworks.',
    font: 'Cambria',
    accentColor: 'C0392B',
    style: 'Traditional contract format with clause numbering',
    pageCount: '7–10',
    thumbnailPath: '/product-images/scope-templates/thumb-formal-contract.jpg',
    previewPaths: ['/product-images/scope-templates/preview-formal-contract-p1.jpg'],
    keySections: ['Red Clause Numbering', 'Sub-Clause Structure (1.1, 1.2)', 'Formal Approval Table', 'Contract Document Schedule'],
  },
  'executive-navy': {
    slug: 'executive-navy',
    displayName: 'Executive Navy',
    tagline: 'Dark navy with teal accent bars',
    description:
      'Dark navy cover block, full-width teal section bars, Calibri font, contemporary layout. Bold and authoritative — suits high-value packages and executive-level submissions.',
    font: 'Calibri',
    accentColor: '00897B',
    style: 'Contemporary executive with full-width section bars',
    pageCount: '8–11',
    thumbnailPath: '/product-images/scope-templates/thumb-executive-navy.jpg',
    previewPaths: ['/product-images/scope-templates/preview-executive-navy-p1.jpg'],
    keySections: ['Navy Cover Block', 'Full-Width Teal Section Bars', 'Banded Data Tables', 'Insurance & Commercial Summary'],
  },
};

export const SCOPE_TEMPLATE_ORDER: ScopeTemplateSlug[] = [
  'corporate-blue',
  'formal-contract',
  'executive-navy',
];
