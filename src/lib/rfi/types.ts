// Request for Information — Types
export type RfiTemplateSlug = 'formal-letter' | 'corporate' | 'concise';
export interface RfiTemplateConfig {
  slug: RfiTemplateSlug;
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
