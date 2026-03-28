// =============================================================================
// CDM Compliance Checker — Types
// =============================================================================

export type CdmCheckerTemplateSlug =
  | 'ebrora-standard'
  | 'compliance-matrix'
  | 'audit-trail'
  | 'executive-summary';

export interface CdmCheckerTemplateConfig {
  slug: CdmCheckerTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'matrix' | 'audit' | 'executive';
}

/** Ordered list of template slugs for display in picker */
export const CDM_CHECKER_TEMPLATE_ORDER: CdmCheckerTemplateSlug[] = [
  'ebrora-standard',
  'compliance-matrix',
  'audit-trail',
  'executive-summary',
];

/** Free-tier templates — CDM Checker is a paid-only tool so all are gated at the tool level */
export const CDM_CHECKER_FREE_TEMPLATES: CdmCheckerTemplateSlug[] = [
  'ebrora-standard',
  'compliance-matrix',
];
