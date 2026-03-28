// =============================================================================
// TBT Builder — Types
// =============================================================================

export type TbtTemplateSlug =
  | 'ebrora-branded'
  | 'red-safety'
  | 'editorial'
  | 'sidebar'
  | 'magazine'
  | 'blueprint'
  | 'rag-bands'
  | 'card-based'
  | 'hazard-industrial';

export interface TbtTemplateConfig {
  slug: TbtTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'sidebar' | 'two-column' | 'banded' | 'card';
}

/** Ordered list of template slugs for display in picker */
export const TBT_TEMPLATE_ORDER: TbtTemplateSlug[] = [
  'ebrora-branded',
  'red-safety',
  'editorial',
  'sidebar',
  'magazine',
  'blueprint',
  'rag-bands',
  'card-based',
  'hazard-industrial',
];

/** Free-tier templates (first 2) */
export const TBT_FREE_TEMPLATES: TbtTemplateSlug[] = [
  'ebrora-branded',
  'red-safety',
];
