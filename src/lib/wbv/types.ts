// =============================================================================
// Whole Body Vibration Assessment — Types
// =============================================================================

export type WbvTemplateSlug =
  | 'professional'
  | 'compliance'
  | 'site-practical';

export interface WbvTemplateConfig {
  slug: WbvTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  detailLevel: 'Full' | 'Standard' | 'Practical';
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}
