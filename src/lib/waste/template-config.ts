// =============================================================================
// Site Waste Management Plan — Template Configuration
// =============================================================================
import type { WasteTemplateSlug, WasteTemplateConfig } from './types';

export const WASTE_TEMPLATE_CONFIGS: Record<WasteTemplateSlug, WasteTemplateConfig> = {
  'full-compliance': {
    slug: 'full-compliance',
    displayName: 'Full Compliance',
    tagline: 'Complete SWMP with waste forecasting and KPIs',
    description:
      'Teal accent, Arial font. Full site waste management plan with waste stream forecasting, duty of care chain, carrier/facility register, waste minimisation targets, and KPI tracking. Compliant with EPA 1990 s.34 and mandatory in Wales/Scotland.',
    font: 'Arial',
    accentColor: '0F766E',
    style: 'Full branded plan with waste forecasting',
    pageCount: '8–12',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/waste-templates/thumb-full-compliance.jpg',
    previewPaths: ['/product-images/waste-templates/preview-full-compliance-p1.jpg'],
    keySections: ['Cover Page & Document Control', 'Waste Stream Forecast', 'Duty of Care Chain', 'Carrier & Facility Register', 'KPI Targets'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate',
    tagline: 'Professional format for client submissions',
    description:
      'Navy accent, Cambria font. Structured corporate waste management plan for tender submissions and client reporting. Waste hierarchy compliance, segregation strategy, and monitoring schedule. Suitable for Tier 1 project requirements.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate management format',
    pageCount: '6–9',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/waste-templates/thumb-corporate.jpg',
    previewPaths: ['/product-images/waste-templates/preview-corporate-p1.jpg'],
    keySections: ['Waste Hierarchy Strategy', 'Segregation Plan', 'Carrier Register', 'Monitoring Schedule', 'Reporting'],
  },
  'site-record': {
    slug: 'site-record',
    displayName: 'Site Record',
    tagline: 'Practical tracking for site teams',
    description:
      'Green accent, Calibri font. Practical waste tracking document for daily site use — waste streams, skip locations, transfer note log, and segregation checklist. No cover page. Designed to be printed and kept in the site office.',
    font: 'Calibri',
    accentColor: '4D7C0F',
    style: 'Practical site tracking format',
    pageCount: '3–5',
    detailLevel: 'Practical',
    thumbnailPath: '/product-images/waste-templates/thumb-site-record.jpg',
    previewPaths: ['/product-images/waste-templates/preview-site-record-p1.jpg'],
    keySections: ['Waste Stream Summary', 'Skip / Container Log', 'Transfer Note Register', 'Segregation Checklist'],
  },
};

export const WASTE_TEMPLATE_ORDER: WasteTemplateSlug[] = [
  'full-compliance',
  'corporate',
  'site-record',
];
