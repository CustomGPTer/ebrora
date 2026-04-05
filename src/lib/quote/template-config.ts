// =============================================================================
// Quotation Builder — Template Configuration
// =============================================================================
import type { QuoteTemplateSlug, QuoteTemplateConfig } from './types';

export const QUOTE_TEMPLATE_CONFIGS: Record<QuoteTemplateSlug, QuoteTemplateConfig> = {
  'full-tender': {
    slug: 'full-tender',
    displayName: 'Full Tender Submission',
    tagline: 'Maximum detail for high-value packages',
    description:
      'Deep green branded cover page, full BoQ breakdown, detailed commercial terms, HSE commitments, company profile, and qualifications. Every section rendered — ideal for Tier 1 tender submissions over £250k.',
    font: 'Arial',
    accentColor: '065F46',
    style: 'Full branded submission with cover page and all sections',
    pageCount: '10–16',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/quote-templates/thumb-full-tender.jpg',
    previewPaths: [
      '/product-images/quote-templates/preview-full-tender-p1.jpg',
      '/product-images/quote-templates/preview-full-tender-p2.jpg',
      '/product-images/quote-templates/preview-full-tender-p3.jpg',
      '/product-images/quote-templates/preview-full-tender-p4.jpg',
      '/product-images/quote-templates/preview-full-tender-p5.jpg',
    ],
    keySections: [
      'Branded Cover Page',
      'Executive Summary',
      'Full BoQ with Price Summary',
      'Commercial Terms & HSE',
      'Company Profile & Qualifications',
    ],
  },
  'formal-contract': {
    slug: 'formal-contract',
    displayName: 'Formal Contract Quotation',
    tagline: 'Clause-numbered for NEC and JCT frameworks',
    description:
      'Charcoal headers with burgundy clause numbering, Cambria serif font, and a formal contract feel. Detailed commercial protections with sub-clause structure. Suits NEC/JCT procurements where contractual precision matters.',
    font: 'Cambria',
    accentColor: '7F1D1D',
    style: 'Traditional contract format with clause numbering',
    pageCount: '8–14',
    detailLevel: 'Detailed',
    thumbnailPath: '/product-images/quote-templates/thumb-formal-contract.jpg',
    previewPaths: [
      '/product-images/quote-templates/preview-formal-contract-p1.jpg',
      '/product-images/quote-templates/preview-formal-contract-p2.jpg',
      '/product-images/quote-templates/preview-formal-contract-p3.jpg',
      '/product-images/quote-templates/preview-formal-contract-p4.jpg',
      '/product-images/quote-templates/preview-formal-contract-p5.jpg',
    ],
    keySections: [
      'Clause-Numbered Sections',
      'Sub-Clause Commercial Terms',
      'BoQ / Pricing Schedule',
      'Inclusions & Exclusions',
      'Programme & Milestones',
    ],
  },
  'standard-quote': {
    slug: 'standard-quote',
    displayName: 'Standard Quotation',
    tagline: 'Clean and professional — the all-rounder',
    description:
      'Steel blue accent bands, Calibri font, clean modern layout. Core sections: BoQ, inclusions/exclusions, assumptions, programme, and commercial terms. Skips company profile and qualifications — for packages where the work speaks for itself.',
    font: 'Calibri',
    accentColor: '1E40AF',
    style: 'Modern professional with blue accent bands',
    pageCount: '6–10',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/quote-templates/thumb-standard-quote.jpg',
    previewPaths: [
      '/product-images/quote-templates/preview-standard-quote-p1.jpg',
      '/product-images/quote-templates/preview-standard-quote-p2.jpg',
      '/product-images/quote-templates/preview-standard-quote-p3.jpg',
      '/product-images/quote-templates/preview-standard-quote-p4.jpg',
      '/product-images/quote-templates/preview-standard-quote-p5.jpg',
    ],
    keySections: [
      'Tender Particulars Table',
      'BoQ / Pricing Schedule',
      'Inclusions & Exclusions',
      'Programme Summary',
      'Commercial Terms',
    ],
  },
  'budget-estimate': {
    slug: 'budget-estimate',
    displayName: 'Budget Estimate',
    tagline: 'Quick price — stripped back and to the point',
    description:
      'Slate grey minimal styling, Arial font. Just the essentials: pricing breakdown, key inclusions/exclusions, and basic terms. No cover page, no HSE section, no company profile. Ideal for budget prices, smaller packages, or when you need to turn a quote around fast.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal with essential pricing and terms only',
    pageCount: '3–5',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/quote-templates/thumb-budget-estimate.jpg',
    previewPaths: [
      '/product-images/quote-templates/preview-budget-estimate-p1.jpg',
      '/product-images/quote-templates/preview-budget-estimate-p2.jpg',
    ],
    keySections: [
      'Price Summary & BoQ',
      'Inclusions & Exclusions',
      'Key Assumptions',
      'Basic Programme & Terms',
    ],
  },
};

export const QUOTE_TEMPLATE_ORDER: QuoteTemplateSlug[] = [
  'full-tender',
  'formal-contract',
  'standard-quote',
  'budget-estimate',
];
