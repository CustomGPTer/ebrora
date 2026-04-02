// =============================================================================
// Carbon Footprint Builder — Types
// =============================================================================

export type CarbonFootprintTemplateSlug =
  | 'ebrora-standard'
  | 'pas-2080-technical'
  | 'compact-summary'
  | 'audit-ready';

export interface CarbonFootprintTemplateConfig {
  slug: CarbonFootprintTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'technical' | 'compact' | 'audit';
}

/** Ordered list of template slugs for display in picker */
export const CARBON_FOOTPRINT_TEMPLATE_ORDER: CarbonFootprintTemplateSlug[] = [
  'ebrora-standard',
  'pas-2080-technical',
  'compact-summary',
  'audit-ready',
];

/** Free-tier templates */
export const CARBON_FOOTPRINT_FREE_TEMPLATES: CarbonFootprintTemplateSlug[] = [
  'ebrora-standard',
  'compact-summary',
];
