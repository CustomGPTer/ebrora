// =============================================================================
// Working at Height Assessment — Types
// =============================================================================

export type WahTemplateSlug =
  | 'full-compliance'
  | 'formal-hse'
  | 'site-ready'
  | 'quick-check';

export interface WahTemplateConfig {
  slug: WahTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  detailLevel: 'Full' | 'Detailed' | 'Standard' | 'Light';
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}
