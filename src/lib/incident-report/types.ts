// =============================================================================
// Incident Report Builder — Types
// =============================================================================

export type IncidentReportTemplateSlug =
  | 'ebrora-standard'
  | 'riddor-focused'
  | 'root-cause'
  | 'near-miss';

export interface IncidentReportTemplateConfig {
  slug: IncidentReportTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'banded' | 'structured' | 'compact';
}

/** Ordered list of template slugs for display in picker */
export const INCIDENT_REPORT_TEMPLATE_ORDER: IncidentReportTemplateSlug[] = [
  'ebrora-standard',
  'riddor-focused',
  'root-cause',
  'near-miss',
];

/** Free-tier templates — Incident Report is a paid-only tool so all are gated at tool level */
export const INCIDENT_REPORT_FREE_TEMPLATES: IncidentReportTemplateSlug[] = [
  'ebrora-standard',
  'riddor-focused',
];
