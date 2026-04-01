// =============================================================================
// Site Traffic Management Plan — Types
// =============================================================================

export type TrafficTemplateSlug =
  | 'full-chapter8'
  | 'formal-highways'
  | 'site-plan'
  | 'quick-brief';

export interface TrafficTemplateConfig {
  slug: TrafficTemplateSlug;
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
