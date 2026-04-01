// =============================================================================
// Invasive Species Management Plan — Types
// =============================================================================

export type InvasiveTemplateSlug =
  | 'ecological-report'
  | 'site-management'
  | 'briefing-note';

export interface InvasiveTemplateConfig {
  slug: InvasiveTemplateSlug;
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
