// =============================================================================
// Carbon Footprint Builder — Template Configuration
// 4 templates. Free: ebrora-standard + compact-summary.
// =============================================================================
import { CarbonFootprintTemplateConfig, CarbonFootprintTemplateSlug } from './types';

export const CARBON_FOOTPRINT_TEMPLATE_CONFIGS: Record<CarbonFootprintTemplateSlug, CarbonFootprintTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded layout with cover page, ICE v3.2 emission factors, category breakdown tables for materials, plant, transport, waste, and temporary works. Includes carbon summary dashboard, hotspot analysis, and reduction opportunities. The comprehensive standard carbon footprint format.',
    pageCount: 4,
    layout: 'standard',
    thumbnailPath: '/product-images/carbon-footprint-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/carbon-footprint-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/carbon-footprint-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/carbon-footprint-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/carbon-footprint-templates/preview-ebrora-standard-p4.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'ICE v3.2 Emission Factor Tables',
      'Materials Carbon Breakdown (A1–A3)',
      'Plant & Equipment Fuel Emissions',
      'Transport & Logistics Quantification',
      'Carbon Summary Dashboard — tCO₂e by Category',
      'Hotspot Analysis & Reduction Opportunities',
      'Sign-Off & Review Block',
    ],
  },

  'pas-2080-technical': {
    slug: 'pas-2080-technical',
    displayName: 'PAS 2080 Technical',
    description:
      'Full life cycle carbon assessment structured to PAS 2080:2023 modules (A1–A5 Product & Construction, B1–B5 Use, C1–C4 End of Life, D Beyond Boundary). Navy technical layout with monospace data panels, BREEAM/CEEQUAL cross-references, and carbon reduction hierarchy (Build Nothing → Build Less → Build Clever → Build Efficiently). For infrastructure clients and sustainability leads.',
    pageCount: 5,
    layout: 'technical',
    thumbnailPath: '/product-images/carbon-footprint-templates/thumb-pas-2080-technical.jpg',
    previewPaths: [
      '/product-images/carbon-footprint-templates/preview-pas-2080-technical-p1.jpg',
      '/product-images/carbon-footprint-templates/preview-pas-2080-technical-p2.jpg',
      '/product-images/carbon-footprint-templates/preview-pas-2080-technical-p3.jpg',
      '/product-images/carbon-footprint-templates/preview-pas-2080-technical-p4.jpg',
      '/product-images/carbon-footprint-templates/preview-pas-2080-technical-p5.jpg',
    ],
    keySections: [
      'PAS 2080:2023 Module Structure (A–D)',
      'Product Stage Carbon (A1–A3)',
      'Construction Process Carbon (A4–A5)',
      'Use Stage & Maintenance Carbon (B1–B5)',
      'End of Life & Disposal Carbon (C1–C4)',
      'Beyond System Boundary Benefits (Module D)',
      'Carbon Reduction Hierarchy Assessment',
      'BREEAM / CEEQUAL Cross-References',
      'Whole-Life Carbon Summary Table',
      'Benchmarking Against Sector Targets',
    ],
  },

  'compact-summary': {
    slug: 'compact-summary',
    displayName: 'Compact Summary',
    description:
      'Dense 2-page carbon summary designed for site notice boards and project reviews. No cover page — straight into a single-page carbon dashboard with category totals, then a second page of reduction measures and benchmarks. Ideal for printing, laminating, and displaying in site offices.',
    pageCount: 2,
    layout: 'compact',
    thumbnailPath: '/product-images/carbon-footprint-templates/thumb-compact-summary.jpg',
    previewPaths: [
      '/product-images/carbon-footprint-templates/preview-compact-summary-p1.jpg',
      '/product-images/carbon-footprint-templates/preview-compact-summary-p2.jpg',
    ],
    keySections: [
      'No Cover Page — Straight to Dashboard',
      'Two-Column Carbon Category Grid',
      'Combined Materials & Transport Totals',
      'Plant Fuel Use Summary',
      'Total tCO₂e with Per-Unit Intensity',
      'Top 5 Reduction Measures',
      'Benchmark Comparison Strip',
    ],
  },

  'audit-ready': {
    slug: 'audit-ready',
    displayName: 'Audit-Ready',
    description:
      'Formal document-controlled carbon assessment with teal accent, revision history table, 3-person approval chain, data source verification columns, and assumption registers. Every emission factor is traceable to its source (ICE v3.2, DEFRA GHG, BEIS). Built to satisfy ISO 14064, client sustainability audits, and BREEAM/CEEQUAL evidence submissions.',
    pageCount: 5,
    layout: 'audit',
    thumbnailPath: '/product-images/carbon-footprint-templates/thumb-audit-ready.jpg',
    previewPaths: [
      '/product-images/carbon-footprint-templates/preview-audit-ready-p1.jpg',
      '/product-images/carbon-footprint-templates/preview-audit-ready-p2.jpg',
      '/product-images/carbon-footprint-templates/preview-audit-ready-p3.jpg',
      '/product-images/carbon-footprint-templates/preview-audit-ready-p4.jpg',
      '/product-images/carbon-footprint-templates/preview-audit-ready-p5.jpg',
    ],
    keySections: [
      'Document Control Block & Revision History',
      '3-Person Approval Chain with Qualifications',
      'Assessment Scope & System Boundary',
      'Data Source Verification (ICE v3.2 / DEFRA / BEIS)',
      'Assumption Register with Confidence Ratings',
      'Emission Factor Traceability Table',
      'Carbon Category Breakdown with Source Refs',
      'Sensitivity Analysis',
      'ISO 14064 Compliance Checklist',
      'Audit Trail & Evidence References',
    ],
  },
};

/** Get config by slug */
export function getCarbonFootprintTemplateConfig(slug: CarbonFootprintTemplateSlug): CarbonFootprintTemplateConfig {
  return CARBON_FOOTPRINT_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidCarbonFootprintTemplateSlug(slug: string): slug is CarbonFootprintTemplateSlug {
  return slug in CARBON_FOOTPRINT_TEMPLATE_CONFIGS;
}
