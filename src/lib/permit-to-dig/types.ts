// =============================================================================
// Permit to Dig Builder — Types
// =============================================================================

export type PermitToDigTemplateSlug =
  | 'ebrora-standard'
  | 'daily-permit'
  | 'utility-strike'
  | 'avoidance-plan';

export interface PermitToDigTemplateConfig {
  slug: PermitToDigTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'compact' | 'emergency' | 'strategic';
}

/** Ordered list of template slugs for display in picker */
export const PERMIT_TO_DIG_TEMPLATE_ORDER: PermitToDigTemplateSlug[] = [
  'ebrora-standard',
  'daily-permit',
  'utility-strike',
  'avoidance-plan',
];

/** Free-tier templates — first 2 free */
export const PERMIT_TO_DIG_FREE_TEMPLATES: PermitToDigTemplateSlug[] = [
  'ebrora-standard',
  'daily-permit',
];
