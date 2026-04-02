// =============================================================================
// Safety Alert Builder — Types
// =============================================================================

export type SafetyAlertTemplateSlug =
  | 'ebrora-standard'
  | 'red-emergency'
  | 'lessons-learned'
  | 'formal-investigation';

export interface SafetyAlertTemplateConfig {
  slug: SafetyAlertTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'emergency' | 'lessons' | 'investigation';
}

/** Ordered list of template slugs for display in picker */
export const SAFETY_ALERT_TEMPLATE_ORDER: SafetyAlertTemplateSlug[] = [
  'ebrora-standard',
  'red-emergency',
  'lessons-learned',
  'formal-investigation',
];

/** Free-tier templates */
export const SAFETY_ALERT_FREE_TEMPLATES: SafetyAlertTemplateSlug[] = [
  'ebrora-standard',
  'lessons-learned',
];
