// Variation Confirmation — Types
export type VariationTemplateSlug = 'formal-letter' | 'corporate' | 'concise';
export interface VariationTemplateConfig {
  slug: VariationTemplateSlug;
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
