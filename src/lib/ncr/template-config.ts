// =============================================================================
// NCR Builder — Template Configuration
// 6 templates. Free: ebrora-standard + compact-closeout.
// =============================================================================
import { NcrTemplateConfig, NcrTemplateSlug } from './types';

export const NCR_TEMPLATE_CONFIGS: Record<NcrTemplateSlug, NcrTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded NCR with structured defect description, specification reference, root cause analysis using 5-Whys methodology, corrective and preventive actions with named owners and target dates, disposition decision, and close-out verification. The comprehensive standard non-conformance format for UK construction quality management.',
    pageCount: 3,
    layout: 'standard',
    thumbnailPath: '/product-images/ncr-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/ncr-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/ncr-templates/preview-ebrora-standard-p3.jpg',
    ],
    keySections: [
      'Green Branded Header & NCR Reference',
      'Non-Conformance Description with Location',
      'Specification & Drawing Reference',
      'Root Cause Analysis (5-Whys)',
      'Immediate Containment Actions',
      'Corrective Actions with Owners & Dates',
      'Preventive Actions (Recurrence Prevention)',
      'Disposition Decision',
      'Close-Out Verification & Sign-Off',
    ],
  },

  'iso-9001-formal': {
    slug: 'iso-9001-formal',
    displayName: 'ISO 9001 Formal',
    description:
      'Formal audit-grade NCR structured to ISO 9001:2015 clause 10.2 (Nonconformity and Corrective Action). Includes NCR classification matrix (Critical/Major/Minor), CAPA tracking register with effectiveness verification, management review escalation criteria, and records retention guidance. Document-controlled with revision history and 3-tier approval. Built to survive ISO 9001 surveillance and certification audits.',
    pageCount: 4,
    layout: 'iso',
    thumbnailPath: '/product-images/ncr-templates/thumb-iso-9001-formal.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-iso-9001-formal-p1.jpg',
      '/product-images/ncr-templates/preview-iso-9001-formal-p2.jpg',
      '/product-images/ncr-templates/preview-iso-9001-formal-p3.jpg',
      '/product-images/ncr-templates/preview-iso-9001-formal-p4.jpg',
    ],
    keySections: [
      'Document Control & Revision History',
      'NCR Classification Matrix (Critical/Major/Minor)',
      'ISO 9001:2015 Clause 10.2 Structure',
      'Non-Conformance Evidence & Photographs',
      'Root Cause Analysis (Ishikawa / 5-Whys)',
      'CAPA Register with Effectiveness Verification',
      'Risk Assessment of Non-Conformance Impact',
      'Management Review Escalation Criteria',
      '3-Tier Approval Chain',
      'Records Retention & Audit Trail',
    ],
  },

  'red-alert': {
    slug: 'red-alert',
    displayName: 'Red Alert',
    description:
      'Bold severity-first NCR with red banner header, prominent severity rating (Critical/Major/Minor), stop-work indicator, and high-visibility callout boxes for immediate actions required. Designed for critical non-conformances that demand urgent attention — structural defects, safety-critical failures, or specification deviations that could compromise asset integrity. Built to visually communicate urgency.',
    pageCount: 2,
    layout: 'alert',
    thumbnailPath: '/product-images/ncr-templates/thumb-red-alert.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-red-alert-p1.jpg',
      '/product-images/ncr-templates/preview-red-alert-p2.jpg',
    ],
    keySections: [
      'Red Banner Header with Severity Rating',
      'Stop-Work Indicator (Yes/No)',
      'Defect Description with Photo Evidence',
      'Immediate Actions Required — Callout Box',
      'Impact Assessment (Safety/Quality/Programme)',
      'Corrective Actions with Urgency Tags',
      'Escalation & Notification Record',
      'Emergency Close-Out Verification',
    ],
  },

  'compact-closeout': {
    slug: 'compact-closeout',
    displayName: 'Compact Close-Out',
    description:
      'Condensed 2-page NCR designed for minor non-conformances and snagging items that need formal recording but not full root cause investigation. Combined description and corrective action on page one, close-out verification on page two. Fast to complete, quick to close. Ideal for finishing works, snagging lists, and minor quality deviations.',
    pageCount: 2,
    layout: 'compact',
    thumbnailPath: '/product-images/ncr-templates/thumb-compact-closeout.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-compact-closeout-p1.jpg',
      '/product-images/ncr-templates/preview-compact-closeout-p2.jpg',
    ],
    keySections: [
      'No Cover Page — Straight to NCR',
      'Combined Defect & Location Description',
      'Specification Reference (Single Line)',
      'Corrective Action with Owner & Date',
      'Before/After Photo Placeholders',
      'Simplified Disposition (Accept/Reject/Rework)',
      'Close-Out Sign-Off Strip',
    ],
  },

  'supplier-ncr': {
    slug: 'supplier-ncr',
    displayName: 'Supplier / Subcontractor NCR',
    description:
      'NCR format specifically designed for issuing to suppliers, manufacturers, or subcontractors. Includes purchase order and delivery reference fields, goods inspection record, rejection/concession decision, cost recovery and back-charge provisions, supplier response section with required response timeframe, and supply chain corrective action requirements. Structured for formal supply chain quality management.',
    pageCount: 3,
    layout: 'supplier',
    thumbnailPath: '/product-images/ncr-templates/thumb-supplier-ncr.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-supplier-ncr-p1.jpg',
      '/product-images/ncr-templates/preview-supplier-ncr-p2.jpg',
      '/product-images/ncr-templates/preview-supplier-ncr-p3.jpg',
    ],
    keySections: [
      'Supplier / Subcontractor Details',
      'Purchase Order & Delivery References',
      'Goods Inspection Record',
      'Non-Conformance Against Specification',
      'Rejection / Concession / Return Decision',
      'Cost Recovery & Back-Charge Provisions',
      'Supplier Response Section (Required Timeframe)',
      'Supply Chain Corrective Action Requirements',
      'Supplier Quality Score Impact',
    ],
  },

  'audit-trail': {
    slug: 'audit-trail',
    displayName: 'Audit Trail',
    description:
      'Evidence-grade NCR with full document traceability — every finding cross-references inspection reports, test certificates, drawings, and specifications by document number and revision. Includes formal evidence log, witness statements section, photographic evidence register with GPS metadata fields, and a complete NCR lifecycle timeline from identification through investigation to close-out. Built for contractual disputes, adjudication evidence, and regulatory investigations.',
    pageCount: 4,
    layout: 'audit',
    thumbnailPath: '/product-images/ncr-templates/thumb-audit-trail.jpg',
    previewPaths: [
      '/product-images/ncr-templates/preview-audit-trail-p1.jpg',
      '/product-images/ncr-templates/preview-audit-trail-p2.jpg',
      '/product-images/ncr-templates/preview-audit-trail-p3.jpg',
      '/product-images/ncr-templates/preview-audit-trail-p4.jpg',
    ],
    keySections: [
      'Document Control & Revision History',
      'NCR Lifecycle Timeline',
      'Evidence Log with Document References',
      'Photographic Evidence Register (GPS Metadata)',
      'Witness Statements Section',
      'Root Cause Investigation Record',
      'Corrective Action Evidence & Verification',
      'Cost Impact Assessment',
      '4-Person Approval & Close-Out Chain',
      'Regulatory Notification Record',
    ],
  },
};

/** Get config by slug */
export function getNcrTemplateConfig(slug: NcrTemplateSlug): NcrTemplateConfig {
  return NCR_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidNcrTemplateSlug(slug: string): slug is NcrTemplateSlug {
  return slug in NCR_TEMPLATE_CONFIGS;
}
