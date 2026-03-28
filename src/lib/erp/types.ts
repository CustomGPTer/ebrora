// =============================================================================
// Emergency Response Plan Builder — Types
// =============================================================================

export type ErpTemplateSlug =
  | 'ebrora-standard'
  | 'quick-reference'
  | 'role-based'
  | 'multi-scenario';

export interface ErpTemplateConfig {
  slug: ErpTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'compact' | 'banded' | 'flowchart';
}

/** Ordered list of template slugs for display in picker */
export const ERP_TEMPLATE_ORDER: ErpTemplateSlug[] = [
  'ebrora-standard',
  'quick-reference',
  'role-based',
  'multi-scenario',
];

/** Free-tier templates — ERP is a paid-only tool so all are gated at tool level */
export const ERP_FREE_TEMPLATES: ErpTemplateSlug[] = [
  'ebrora-standard',
  'quick-reference',
];
