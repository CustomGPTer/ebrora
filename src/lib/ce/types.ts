// Compensation Event Notification — Types
export type CeTemplateSlug = 'formal-letter' | 'corporate' | 'concise';
export interface CeTemplateConfig {
  slug: CeTemplateSlug;
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
