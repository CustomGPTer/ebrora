// =============================================================================
// COSHH Assessment Builder — Template Configuration
// 5 templates. Free: ebrora-standard + red-hazard.
// =============================================================================
import { CoshhTemplateConfig, CoshhTemplateSlug } from './types';

export const COSHH_TEMPLATE_CONFIGS: Record<CoshhTemplateSlug, CoshhTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded layout with cover page, 18 numbered sections, GHS pictogram pills, 5×5 risk matrix, and detailed PPE specification table. The comprehensive standard COSHH assessment format.',
    pageCount: 3,
    layout: 'standard',
    thumbnailPath: '/product-images/coshh-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/coshh-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/coshh-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/coshh-templates/preview-ebrora-standard-p3.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'Composition & Ingredients Table',
      'Detailed PPE Specification Table',
      '5×5 Risk Matrix',
      'Health Surveillance Section',
      '18 Numbered Sections',
    ],
  },

  'red-hazard': {
    slug: 'red-hazard',
    displayName: 'Red Hazard',
    description:
      'Bold hazard-first design with red banner header, black meta bar, prominent warning callout boxes, and severity RAG ratings per exposure route. Built to visually communicate danger.',
    pageCount: 3,
    layout: 'banded',
    thumbnailPath: '/product-images/coshh-templates/thumb-red-hazard.jpg',
    previewPaths: [
      '/product-images/coshh-templates/preview-red-hazard-p1.jpg',
      '/product-images/coshh-templates/preview-red-hazard-p2.jpg',
      '/product-images/coshh-templates/preview-red-hazard-p3.jpg',
    ],
    keySections: [
      'Red Hazard Banner Header',
      'Warning Callout Boxes',
      'Severity RAG Tags Per Route',
      'Skin Absorption Notation Highlighted',
      'Emergency Eye Splash Warning',
      '18 Numbered Sections',
    ],
  },

  'sds-technical': {
    slug: 'sds-technical',
    displayName: 'SDS Technical',
    description:
      'Navy technical layout with monospace typography, bordered specification panels, inline regulation references, and CLP-mirroring structure. Appeals to COSHH coordinators and lab managers.',
    pageCount: 3,
    layout: 'technical',
    thumbnailPath: '/product-images/coshh-templates/thumb-sds-technical.jpg',
    previewPaths: [
      '/product-images/coshh-templates/preview-sds-technical-p1.jpg',
      '/product-images/coshh-templates/preview-sds-technical-p2.jpg',
      '/product-images/coshh-templates/preview-sds-technical-p3.jpg',
    ],
    keySections: [
      'Navy Header with Monospace Typography',
      'Bordered Specification Panels',
      'Inline Regulation References',
      'DNEL & BMGV Exposure Data',
      'SDS Section Cross-References',
      '18 Numbered Sections',
    ],
  },

  'compact-field': {
    slug: 'compact-field',
    displayName: 'Compact Field',
    description:
      'Dense, minimal layout condensed to 1–2 pages. Two-column grids, combined sections, no cover page. Designed to print and laminate next to substance storage on site.',
    pageCount: 2,
    layout: 'compact',
    thumbnailPath: '/product-images/coshh-templates/thumb-compact-field.jpg',
    previewPaths: [
      '/product-images/coshh-templates/preview-compact-field-p1.jpg',
      '/product-images/coshh-templates/preview-compact-field-p2.jpg',
    ],
    keySections: [
      'No Cover Page — Straight to Content',
      'Two-Column Product/PPE Grid',
      'Combined Health Surveillance & Training',
      'Combined Storage & Disposal',
      'Condensed Emergency Procedures',
      '14 Condensed Sections',
    ],
  },

  'audit-ready': {
    slug: 'audit-ready',
    displayName: 'Audit-Ready',
    description:
      'Formal document-control layout with teal accent, revision history table, 3-person approval chain with qualification columns, and biological monitoring guidance. Built to pass HSE inspection or ISO audit.',
    pageCount: 4,
    layout: 'audit',
    thumbnailPath: '/product-images/coshh-templates/thumb-audit-ready.jpg',
    previewPaths: [
      '/product-images/coshh-templates/preview-audit-ready-p1.jpg',
      '/product-images/coshh-templates/preview-audit-ready-p2.jpg',
      '/product-images/coshh-templates/preview-audit-ready-p3.jpg',
      '/product-images/coshh-templates/preview-audit-ready-p4.jpg',
    ],
    keySections: [
      'Document Control Block',
      '3-Person Approval Chain with Qualifications',
      'Revision History Table',
      'Biological Monitoring Guidance',
      'Health Surveillance with Records Retention',
      '19 Numbered Sections',
    ],
  },
};

/** Get config by slug */
export function getCoshhTemplateConfig(slug: CoshhTemplateSlug): CoshhTemplateConfig {
  return COSHH_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidCoshhTemplateSlug(slug: string): slug is CoshhTemplateSlug {
  return slug in COSHH_TEMPLATE_CONFIGS;
}
