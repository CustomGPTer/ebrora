// =============================================================================
// Programme Checker — Template Types
// 4 templates: scoring, email-summary, rag-report, comprehensive
// =============================================================================

export type ProgrammeCheckerTemplateSlug =
  | 'scoring'
  | 'email-summary'
  | 'rag-report'
  | 'comprehensive';

export interface ProgrammeCheckerTemplateConfig {
  slug: ProgrammeCheckerTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'scoring' | 'email' | 'rag' | 'comprehensive';
}

/** Ordered list of template slugs for display in picker */
export const PROGRAMME_CHECKER_TEMPLATE_ORDER: ProgrammeCheckerTemplateSlug[] = [
  'scoring',
  'email-summary',
  'rag-report',
  'comprehensive',
];

/** Free-tier templates — first 1 free */
export const PROGRAMME_CHECKER_FREE_TEMPLATES: ProgrammeCheckerTemplateSlug[] = [
  'rag-report',
];
