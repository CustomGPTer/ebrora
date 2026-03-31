// =============================================================================
// Early Warning Notice Builder — Types
// 8 templates covering all NEC3/NEC4 directions and risk categories.
// =============================================================================

export type EarlyWarningTemplateSlug =
  | 'nec4-contractor-pm'
  | 'nec4-pm-contractor'
  | 'nec4-sub-to-mc'
  | 'nec4-mc-to-sub'
  | 'comprehensive-risk'
  | 'health-safety'
  | 'design-technical'
  | 'weather-force-majeure';

export interface EarlyWarningTemplateConfig {
  slug: EarlyWarningTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'pm-issued' | 'subcontract' | 'contractor-issued' | 'comprehensive' | 'safety' | 'technical' | 'weather';
}

/** Ordered list of template slugs for display in picker */
export const EARLY_WARNING_TEMPLATE_ORDER: EarlyWarningTemplateSlug[] = [
  'nec4-contractor-pm',
  'nec4-pm-contractor',
  'nec4-sub-to-mc',
  'nec4-mc-to-sub',
  'comprehensive-risk',
  'health-safety',
  'design-technical',
  'weather-force-majeure',
];

/** Free-tier templates — first 2 free */
export const EARLY_WARNING_FREE_TEMPLATES: EarlyWarningTemplateSlug[] = [
  'nec4-contractor-pm',
  'nec4-pm-contractor',
];
