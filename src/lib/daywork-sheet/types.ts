// =============================================================================
// Daywork Sheet Builder — Types
// =============================================================================

export type DayworkSheetTemplateSlug =
  | 'ebrora-standard'
  | 'ceca-civil'
  | 'jct-prime-cost'
  | 'nec4-record'
  | 'compact-field'
  | 'audit-trail'
  | 'subcontractor-valuation'
  | 'weekly-summary';

export interface DayworkSheetTemplateConfig {
  slug: DayworkSheetTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  /** Layout type — affects which docx builder is used */
  layout: 'standard' | 'ceca' | 'jct' | 'nec4' | 'compact' | 'audit' | 'subcontractor' | 'weekly';
}

/** Ordered list of template slugs for display in picker */
export const DAYWORK_SHEET_TEMPLATE_ORDER: DayworkSheetTemplateSlug[] = [
  'ebrora-standard',
  'ceca-civil',
  'jct-prime-cost',
  'nec4-record',
  'compact-field',
  'audit-trail',
  'subcontractor-valuation',
  'weekly-summary',
];

/** Free-tier templates */
export const DAYWORK_SHEET_FREE_TEMPLATES: DayworkSheetTemplateSlug[] = [
  'ebrora-standard',
  'compact-field',
];
