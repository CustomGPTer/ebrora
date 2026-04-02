// =============================================================================
// Carbon Reduction Plan Builder — Types
// =============================================================================

export type CrpTemplateSlug =
  | 'ppn-0621-standard'
  | 'sbti-aligned'
  | 'iso-14064-compliant'
  | 'ghg-protocol-corporate';

export interface CrpTemplateConfig {
  slug: CrpTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}
