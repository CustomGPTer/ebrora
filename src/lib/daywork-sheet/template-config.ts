// =============================================================================
// Daywork Sheet Builder — Template Configuration
// 8 templates. Free: ebrora-standard + compact-field.
// Covers CECA, JCT, NEC4, and general-purpose formats.
// =============================================================================
import { DayworkSheetTemplateConfig, DayworkSheetTemplateSlug } from './types';

export const DAYWORK_SHEET_TEMPLATE_CONFIGS: Record<DayworkSheetTemplateSlug, DayworkSheetTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded daywork sheet with structured tables for labour, plant, materials, supervision, and overheads. Includes instruction details, CSCS card references, hourly rate columns, running totals, and dual sign-off blocks. The all-purpose daywork format suitable for any UK construction contract.',
    pageCount: 3,
    layout: 'standard',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-ebrora-standard-p3.jpg',
    ],
    keySections: [
      'Green Branded Header & Daywork Reference',
      'Contract & Instruction Details',
      'Labour Record with CSCS & Hourly Rates',
      'Plant & Equipment Record with Hire Rates',
      'Materials & Consumables with Unit Costs',
      'Supervision & Management Allocation',
      'Overheads & Profit Calculation',
      'Running Totals & Daywork Summary',
      'Dual Sign-Off Block (Contractor & Client)',
    ],
  },

  'ceca-civil': {
    slug: 'ceca-civil',
    displayName: 'CECA Civil Engineering',
    description:
      'Daywork sheet formatted to the CECA Schedules of Dayworks Carried Out Incidental to Contract Work (Civil Engineering). Labour categorised by CIJC Working Rule Agreement grades, plant priced per CECA percentage additions, materials at invoice cost plus contractual percentage. Structured for Tier 1 civil engineering acceptance on NEC and ICE contracts.',
    pageCount: 3,
    layout: 'ceca',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-ceca-civil.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-ceca-civil-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-ceca-civil-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-ceca-civil-p3.jpg',
    ],
    keySections: [
      'CECA Daywork Schedule Header',
      'Labour by CIJC Grade & Classification',
      'CECA Percentage Additions for Labour',
      'Plant at CECA Schedule Rates',
      'Materials at Invoice Cost + Percentage',
      'Incidental Costs & Consumables',
      'CECA Summary with Contractual Percentages',
      'Site Agent & RE Countersignature Block',
    ],
  },

  'jct-prime-cost': {
    slug: 'jct-prime-cost',
    displayName: 'JCT Prime Cost',
    description:
      'Daywork sheet structured to the RICS Definition of Prime Cost of Daywork Carried Out Under a Building Contract (3rd Edition). Labour priced at prime cost plus percentage, plant at hire rates or RICS schedule, materials at net invoice cost. Formatted for JCT Standard Building Contract, Intermediate, and Design & Build contract daywork provisions.',
    pageCount: 3,
    layout: 'jct',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-jct-prime-cost.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-jct-prime-cost-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-jct-prime-cost-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-jct-prime-cost-p3.jpg',
    ],
    keySections: [
      'JCT Contract Reference & AI Number',
      'RICS Prime Cost Definition Header',
      'Labour at Prime Cost + Percentage Addition',
      'Plant at Hire Rates / RICS Schedule',
      'Materials at Net Invoice Cost + Percentage',
      'Sub-Contract Work Included in Daywork',
      'Overheads & Profit per JCT Contract %',
      'Architect/CA Instruction Cross-Reference',
      'Quantity Surveyor Verification Block',
    ],
  },

  'nec4-record': {
    slug: 'nec4-record',
    displayName: 'NEC4 Compensation Event',
    description:
      'Daywork record structured for NEC4 Engineering & Construction Contract compensation events. Defined Cost approach using Schedule of Cost Components or Short Schedule, with people rates, Equipment rates, and Subcontractor costs. Includes quotation cross-reference, Project Manager assessment fields, and fee percentage application per contract data. Aligned with clauses 52, 62, and 63.',
    pageCount: 3,
    layout: 'nec4',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-nec4-record.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-nec4-record-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-nec4-record-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-nec4-record-p3.jpg',
    ],
    keySections: [
      'NEC4 ECC Contract & CE Reference',
      'Compensation Event Description',
      'People — Defined Cost Rates',
      'Equipment — Defined Cost or Percentages',
      'Subcontractor Defined Cost',
      'Materials at Defined Cost',
      'Fee Percentage Application',
      'Quotation Cross-Reference (Clause 62)',
      'PM Assessment & Acceptance Block',
    ],
  },

  'compact-field': {
    slug: 'compact-field',
    displayName: 'Compact Field',
    description:
      'Single-page daywork capture sheet designed for site use. Dense two-column layout with pre-printed tick boxes for common labour grades, plant types, and material categories. Designed to fold into a clipboard or pocket — fill in on site, photograph, and submit. No cover page, no frills.',
    pageCount: 1,
    layout: 'compact',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-compact-field.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-compact-field-p1.jpg',
    ],
    keySections: [
      'No Cover Page — Single Sheet Layout',
      'Two-Column Dense Grid',
      'Pre-Printed Labour Grade Tick Boxes',
      'Quick Plant & Hours Capture',
      'Materials Checklist with Quantities',
      'Instruction Reference & Time On/Off',
      'Single Sign-Off Strip',
    ],
  },

  'audit-trail': {
    slug: 'audit-trail',
    displayName: 'Audit Trail',
    description:
      'Formal evidence-grade daywork record with document control block, revision tracking, photographic evidence register, contemporaneous diary extract fields, and a 4-person verification chain (Foreman → Site Agent → QS → Client Rep). Every line item cross-references a supporting document. Built to withstand adjudication, dispute resolution, and final account negotiations.',
    pageCount: 4,
    layout: 'audit',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-audit-trail.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-audit-trail-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-audit-trail-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-audit-trail-p3.jpg',
      '/product-images/daywork-sheet-templates/preview-audit-trail-p4.jpg',
    ],
    keySections: [
      'Document Control & Revision History',
      'Instruction Record (Written/Verbal/Implied)',
      'Photographic Evidence Register',
      'Contemporaneous Diary Extract',
      'Labour Record with Evidence Refs',
      'Plant Record with Hire Invoices',
      'Materials with Delivery Tickets',
      '4-Person Verification Chain',
      'Dispute / Adjudication Readiness Notes',
    ],
  },

  'subcontractor-valuation': {
    slug: 'subcontractor-valuation',
    displayName: 'Subcontractor Valuation',
    description:
      'Daywork valuation sheet for agreeing and pricing subcontractor daywork claims. Side-by-side layout showing subcontractor submitted rates versus agreed/negotiated rates, with variance column and running cumulative total. Includes subcontract reference, payment application number, and contra-charge fields. Designed for commercial teams managing multiple subcontract packages.',
    pageCount: 2,
    layout: 'subcontractor',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-subcontractor-valuation.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-subcontractor-valuation-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-subcontractor-valuation-p2.jpg',
    ],
    keySections: [
      'Subcontract Reference & Package Details',
      'Submitted vs Agreed Rate Comparison',
      'Labour Valuation with Variance Column',
      'Plant Valuation with Variance Column',
      'Materials at Invoice + Agreed Markup',
      'Cumulative Daywork Running Total',
      'Contra-Charge Deductions',
      'Payment Application Cross-Reference',
      'Commercial Manager Sign-Off',
    ],
  },

  'weekly-summary': {
    slug: 'weekly-summary',
    displayName: 'Weekly Summary',
    description:
      'Consolidated weekly daywork register aggregating multiple daily daywork sheets into a single weekly submission. Tabular layout showing daily breakdowns with weekly labour hours, plant hours, and material cost totals. Includes week commencing header, daily instruction references, and weekly certification block. Ideal for projects running regular daywork activities.',
    pageCount: 3,
    layout: 'weekly',
    thumbnailPath: '/product-images/daywork-sheet-templates/thumb-weekly-summary.jpg',
    previewPaths: [
      '/product-images/daywork-sheet-templates/preview-weekly-summary-p1.jpg',
      '/product-images/daywork-sheet-templates/preview-weekly-summary-p2.jpg',
      '/product-images/daywork-sheet-templates/preview-weekly-summary-p3.jpg',
    ],
    keySections: [
      'Week Commencing Header & Contract Ref',
      'Daily Daywork Sheet Cross-References',
      'Monday–Friday Labour Hours Grid',
      'Monday–Friday Plant Hours Grid',
      'Daily Material Cost Breakdown',
      'Weekly Totals — Labour, Plant, Materials',
      'Cumulative Project Daywork Running Total',
      'Weekly Certification & Sign-Off',
    ],
  },
};

/** Get config by slug */
export function getDayworkSheetTemplateConfig(slug: DayworkSheetTemplateSlug): DayworkSheetTemplateConfig {
  return DAYWORK_SHEET_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidDayworkSheetTemplateSlug(slug: string): slug is DayworkSheetTemplateSlug {
  return slug in DAYWORK_SHEET_TEMPLATE_CONFIGS;
}
