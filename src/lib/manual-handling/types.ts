// =============================================================================
// Manual Handling Assessment Builder — Types
// =============================================================================

export type ManualHandlingTemplateSlug =
  | 'ebrora-standard'
  | 'mac-assessment'
  | 'rapp-assessment'
  | 'training-briefing';

export interface ManualHandlingTemplateConfig {
  slug: ManualHandlingTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'scoring' | 'structured' | 'compact';
}

/** Ordered list of template slugs for display in picker */
export const MANUAL_HANDLING_TEMPLATE_ORDER: ManualHandlingTemplateSlug[] = [
  'ebrora-standard',
  'mac-assessment',
  'rapp-assessment',
  'training-briefing',
];

/** Free-tier templates — Manual Handling is a free tool, first 2 templates free */
export const MANUAL_HANDLING_FREE_TEMPLATES: ManualHandlingTemplateSlug[] = [
  'ebrora-standard',
  'mac-assessment',
];
