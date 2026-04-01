// =============================================================================
// Quotation Builder — Types
// =============================================================================

export type QuoteTemplateSlug =
  | 'full-tender'
  | 'formal-contract'
  | 'standard-quote'
  | 'budget-estimate';

export interface QuoteTemplateConfig {
  slug: QuoteTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  detailLevel: 'Full' | 'Detailed' | 'Standard' | 'Light';
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}
