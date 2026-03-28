// =============================================================================
// POWRA Builder — Types
// =============================================================================

export type PowraTemplateSlug =
  | 'ebrora-standard'
  | 'quick-card'
  | 'task-specific'
  | 'supervisor-review';

export interface PowraTemplateConfig {
  slug: PowraTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'compact' | 'phased' | 'audit';
}

/** Ordered list of template slugs for display in picker */
export const POWRA_TEMPLATE_ORDER: PowraTemplateSlug[] = [
  'ebrora-standard',
  'quick-card',
  'task-specific',
  'supervisor-review',
];

/** Free-tier templates — first 2 free */
export const POWRA_FREE_TEMPLATES: PowraTemplateSlug[] = [
  'ebrora-standard',
  'quick-card',
];
