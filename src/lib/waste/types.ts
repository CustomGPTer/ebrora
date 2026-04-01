// =============================================================================
// Site Waste Management Plan — Types
// =============================================================================

export type WasteTemplateSlug =
  | 'full-compliance'
  | 'corporate'
  | 'site-record';

export interface WasteTemplateConfig {
  slug: WasteTemplateSlug;
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
