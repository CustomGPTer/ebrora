// =============================================================================
// Emergency Response Plan Builder — Template Configuration
// 4 templates. Paid-only tool (Standard/Professional).
// =============================================================================
import { ErpTemplateConfig, ErpTemplateSlug } from './types';

export const ERP_TEMPLATE_CONFIGS: Record<ErpTemplateSlug, ErpTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive green-branded ERP with cover page. Sequential sections for each emergency scenario with numbered action steps, communication cascade, emergency roles, muster points, equipment inventory, training schedule, and emergency services liaison.',
    pageCount: 4,
    layout: 'standard',
    thumbnailPath: '/product-images/erp-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/erp-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/erp-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/erp-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/erp-templates/preview-ebrora-standard-p4.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'Emergency Roles & Key Contacts',
      '7-Tier Communication Cascade',
      'Per-Scenario Action Step Tables',
      'Emergency Equipment Inventory',
      'Training & Drill Schedule',
    ],
  },

  'quick-reference': {
    slug: 'quick-reference',
    displayName: 'Quick Reference',
    description:
      'Lamination-ready 2-page format. Large-print emergency numbers, "IF IN DOUBT — EVACUATE" header, colour-coded action cards per scenario (one-line numbered steps), muster point details, and equipment locations. Designed for posting at muster points and welfare cabins.',
    pageCount: 2,
    layout: 'compact',
    thumbnailPath: '/product-images/erp-templates/thumb-quick-reference.jpg',
    previewPaths: [
      '/product-images/erp-templates/preview-quick-reference-p1.jpg',
      '/product-images/erp-templates/preview-quick-reference-p2.jpg',
    ],
    keySections: [
      '"IF IN DOUBT — EVACUATE" Banner',
      'Large-Print Emergency Numbers',
      'Colour-Coded Action Cards',
      'Muster Point Details',
      'Equipment Locations',
      'Lamination-Ready Format',
    ],
  },

  'role-based': {
    slug: 'role-based',
    displayName: 'Role-Based',
    description:
      'Navy-banded layout organised by emergency ROLE — not by scenario. Each role (Emergency Controller, Fire Marshal, First Aider, Environmental Officer, All Personnel) gets a standalone section showing exactly what THAT person does in every scenario. Designed to be separated into individual role cards.',
    pageCount: 3,
    layout: 'banded',
    thumbnailPath: '/product-images/erp-templates/thumb-role-based.jpg',
    previewPaths: [
      '/product-images/erp-templates/preview-role-based-p1.jpg',
      '/product-images/erp-templates/preview-role-based-p2.jpg',
      '/product-images/erp-templates/preview-role-based-p3.jpg',
    ],
    keySections: [
      'Standalone Role Card Sections',
      'Scenario-by-Scenario per Role',
      'Emergency Controller Card',
      'Fire Marshal / First Aider Cards',
      'All Personnel Responsibilities',
      'Separable for Individual Issue',
    ],
  },

  'multi-scenario': {
    slug: 'multi-scenario',
    displayName: 'Multi-Scenario',
    description:
      'Teal-accented scenario matrix. Each scenario gets a 4-phase flowchart: Trigger → Immediate → Escalate → Recover. Colour-coded severity tags per scenario. Equipment and drill schedule condensed. Best for sites with multiple high-risk scenarios requiring structured response.',
    pageCount: 3,
    layout: 'flowchart',
    thumbnailPath: '/product-images/erp-templates/thumb-multi-scenario.jpg',
    previewPaths: [
      '/product-images/erp-templates/preview-multi-scenario-p1.jpg',
      '/product-images/erp-templates/preview-multi-scenario-p2.jpg',
      '/product-images/erp-templates/preview-multi-scenario-p3.jpg',
    ],
    keySections: [
      'Trigger → Immediate → Escalate → Recover',
      'Severity Tags per Scenario',
      'Phase-Based Flowchart Tables',
      'Scenario-Specific Equipment',
      'Condensed Drill Schedule',
      'Multi-Hazard Matrix Format',
    ],
  },
};

export function getErpTemplateConfig(slug: ErpTemplateSlug): ErpTemplateConfig {
  return ERP_TEMPLATE_CONFIGS[slug];
}

export function isValidErpTemplateSlug(slug: string): slug is ErpTemplateSlug {
  return slug in ERP_TEMPLATE_CONFIGS;
}
