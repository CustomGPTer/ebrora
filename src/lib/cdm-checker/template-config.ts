// =============================================================================
// CDM Compliance Checker — Template Configuration
// 4 templates. Paid-only tool (Standard/Professional).
// =============================================================================
import { CdmCheckerTemplateConfig, CdmCheckerTemplateSlug } from './types';

export const CDM_CHECKER_TEMPLATE_CONFIGS: Record<CdmCheckerTemplateSlug, CdmCheckerTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded CDM gap analysis with cover page, duty holder sections, regulation-by-regulation compliance tables with RAG status, identified gaps ranked by priority, and compliance roadmap.',
    pageCount: 3,
    layout: 'standard',
    thumbnailPath: '/product-images/cdm-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/cdm-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/cdm-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/cdm-templates/preview-ebrora-standard-p3.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'F10 Notification Status',
      'Duty Holder Compliance Tables',
      'Priority-Ranked Gap Register',
      'Compliance Roadmap with Dates',
      'Regulatory References Table',
    ],
  },

  'compliance-matrix': {
    slug: 'compliance-matrix',
    displayName: 'Compliance Matrix',
    description:
      'Teal-accented, matrix-heavy layout. One large table showing every CDM regulation cross-referenced against all 5 duty holders with tick/triangle/cross status cells. Designed for instant visual gap scanning.',
    pageCount: 2,
    layout: 'matrix',
    thumbnailPath: '/product-images/cdm-templates/thumb-compliance-matrix.jpg',
    previewPaths: [
      '/product-images/cdm-templates/preview-compliance-matrix-p1.jpg',
      '/product-images/cdm-templates/preview-compliance-matrix-p2.jpg',
    ],
    keySections: [
      'Duty Holder Summary Table',
      'Full Compliance Matrix (5 Duty Holders)',
      'Tick/Triangle/Cross Visual Status',
      'Condensed Gaps & Roadmap',
      'Minimal Prose — Maximum Data',
    ],
  },

  'audit-trail': {
    slug: 'audit-trail',
    displayName: 'Audit Trail',
    description:
      'Navy formal layout with document control block, evidence reference column on every compliance check, formal non-conformance register with NCR numbers, observations register, revision history, and 3-person approval chain.',
    pageCount: 3,
    layout: 'audit',
    thumbnailPath: '/product-images/cdm-templates/thumb-audit-trail.jpg',
    previewPaths: [
      '/product-images/cdm-templates/preview-audit-trail-p1.jpg',
      '/product-images/cdm-templates/preview-audit-trail-p2.jpg',
      '/product-images/cdm-templates/preview-audit-trail-p3.jpg',
    ],
    keySections: [
      'Document Control Block',
      'Evidence Reference Per Check',
      'Non-Conformance Register (NCR)',
      'Observations Register',
      'Revision History Table',
      '3-Person Approval Chain',
    ],
  },

  'executive-summary': {
    slug: 'executive-summary',
    displayName: 'Executive Summary',
    description:
      'Dark charcoal/green management-focused layout. Opens with a visual compliance dashboard showing percentage scores per duty holder, then priority-ranked findings, narrative recommendations, and compliance roadmap. Designed for client or board audiences.',
    pageCount: 2,
    layout: 'executive',
    thumbnailPath: '/product-images/cdm-templates/thumb-executive-summary.jpg',
    previewPaths: [
      '/product-images/cdm-templates/preview-executive-summary-p1.jpg',
      '/product-images/cdm-templates/preview-executive-summary-p2.jpg',
    ],
    keySections: [
      'Compliance Dashboard with % Scores',
      'Colour-Coded Progress Bars',
      'Priority-Ranked Key Findings',
      'Narrative Recommendations',
      'Compliance Roadmap',
      'Client/Board-Ready Format',
    ],
  },
};

/** Get config by slug */
export function getCdmCheckerTemplateConfig(slug: CdmCheckerTemplateSlug): CdmCheckerTemplateConfig {
  return CDM_CHECKER_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidCdmCheckerTemplateSlug(slug: string): slug is CdmCheckerTemplateSlug {
  return slug in CDM_CHECKER_TEMPLATE_CONFIGS;
}
