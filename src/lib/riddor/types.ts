// =============================================================================
// RIDDOR Report — Types
// =============================================================================

export type RiddorTemplateSlug =
  | 'formal-investigation'
  | 'corporate'
  | 'quick-notification';

export interface RiddorTemplateConfig {
  slug: RiddorTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  detailLevel: 'Full' | 'Standard' | 'Light';
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}
