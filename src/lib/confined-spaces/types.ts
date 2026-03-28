// =============================================================================
// Confined Spaces Assessment Builder — Types
// =============================================================================

export type ConfinedSpacesTemplateSlug =
  | 'ebrora-standard'
  | 'red-danger'
  | 'permit-style'
  | 'rescue-focused';

export interface ConfinedSpacesTemplateConfig {
  slug: ConfinedSpacesTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'danger' | 'permit' | 'rescue';
}

/** Ordered list of template slugs for display in picker */
export const CONFINED_SPACES_TEMPLATE_ORDER: ConfinedSpacesTemplateSlug[] = [
  'ebrora-standard',
  'red-danger',
  'permit-style',
  'rescue-focused',
];

/** Free-tier templates (first 2) — confined-spaces is a free-tier tool */
export const CONFINED_SPACES_FREE_TEMPLATES: ConfinedSpacesTemplateSlug[] = [
  'ebrora-standard',
  'red-danger',
];
