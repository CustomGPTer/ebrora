// =============================================================================
// NCR Builder — Types
// =============================================================================

export type NcrTemplateSlug =
  | 'ebrora-standard'
  | 'iso-9001-formal'
  | 'red-alert'
  | 'compact-closeout'
  | 'supplier-ncr'
  | 'audit-trail';

export interface NcrTemplateConfig {
  slug: NcrTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'iso' | 'alert' | 'compact' | 'supplier' | 'audit';
}

/** Ordered list of template slugs for display in picker */
export const NCR_TEMPLATE_ORDER: NcrTemplateSlug[] = [
  'ebrora-standard',
  'iso-9001-formal',
  'red-alert',
  'compact-closeout',
  'supplier-ncr',
  'audit-trail',
];

/** Free-tier templates */
export const NCR_FREE_TEMPLATES: NcrTemplateSlug[] = [
  'ebrora-standard',
  'compact-closeout',
];
