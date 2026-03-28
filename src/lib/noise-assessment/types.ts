// =============================================================================
// Noise Assessment Builder — Types
// =============================================================================

export type NoiseAssessmentTemplateSlug =
  | 'ebrora-standard'
  | 'section-61'
  | 'monitoring-report'
  | 'resident-communication';

export interface NoiseAssessmentTemplateConfig {
  slug: NoiseAssessmentTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'application' | 'monitoring' | 'compact';
}

/** Ordered list of template slugs for display in picker */
export const NOISE_ASSESSMENT_TEMPLATE_ORDER: NoiseAssessmentTemplateSlug[] = [
  'ebrora-standard',
  'section-61',
  'monitoring-report',
  'resident-communication',
];

/** Free-tier templates — Noise Assessment is a paid-only tool */
export const NOISE_ASSESSMENT_FREE_TEMPLATES: NoiseAssessmentTemplateSlug[] = [
  'ebrora-standard',
  'section-61',
];
