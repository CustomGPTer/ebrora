// Delay Notification — Types
export type DelayTemplateSlug = 'formal-letter' | 'corporate' | 'concise';
export interface DelayTemplateConfig {
  slug: DelayTemplateSlug;
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
