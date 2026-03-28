// =============================================================================
// COSHH Assessment Builder — Types
// =============================================================================

export type CoshhTemplateSlug =
  | 'ebrora-standard'
  | 'red-hazard'
  | 'sds-technical'
  | 'compact-field'
  | 'audit-ready';

export interface CoshhTemplateConfig {
  slug: CoshhTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'banded' | 'compact' | 'technical' | 'audit';
}

/** Ordered list of template slugs for display in picker */
export const COSHH_TEMPLATE_ORDER: CoshhTemplateSlug[] = [
  'ebrora-standard',
  'red-hazard',
  'sds-technical',
  'compact-field',
  'audit-ready',
];

/** Free-tier templates (first 2) */
export const COSHH_FREE_TEMPLATES: CoshhTemplateSlug[] = [
  'ebrora-standard',
  'red-hazard',
];
