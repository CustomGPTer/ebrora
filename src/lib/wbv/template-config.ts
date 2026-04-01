// =============================================================================
// Whole Body Vibration Assessment — Template Configuration
// =============================================================================
import type { WbvTemplateSlug, WbvTemplateConfig } from './types';

export const WBV_TEMPLATE_CONFIGS: Record<WbvTemplateSlug, WbvTemplateConfig> = {
  'professional': {
    slug: 'professional',
    displayName: 'Professional',
    tagline: 'Full assessment with exposure calculations',
    description:
      'Teal accent, Arial font. Complete WBV assessment with A(8) exposure calculations, EAV/ELV comparisons, health surveillance requirements, and detailed control measures. Full compliance with Control of Vibration at Work Regulations 2005.',
    font: 'Arial',
    accentColor: '0F766E',
    style: 'Full branded assessment with exposure calculations',
    pageCount: '6–9',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/wbv-templates/thumb-professional.jpg',
    previewPaths: ['/product-images/wbv-templates/preview-professional-p1.jpg'],
    keySections: ['Cover Page & Document Control', 'Equipment Register', 'Exposure Calculations (A(8))', 'Health Surveillance', 'Action Plan'],
  },
  'compliance': {
    slug: 'compliance',
    displayName: 'Compliance',
    tagline: 'Regulation-focused with legal references',
    description:
      'Dark navy headers, Cambria font. Formal compliance-focused format referencing Vibration Regs 2005 throughout. EAV (0.5 m/s²) and ELV (1.15 m/s²) thresholds clearly stated. Designed for HSE audit readiness.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Formal regulatory format with threshold references',
    pageCount: '5–8',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/wbv-templates/thumb-compliance.jpg',
    previewPaths: ['/product-images/wbv-templates/preview-compliance-p1.jpg'],
    keySections: ['Regulation References', 'Exposure Threshold Table', 'Risk Assessment Matrix', 'Control Measures', 'Review Schedule'],
  },
  'site-practical': {
    slug: 'site-practical',
    displayName: 'Site Practical',
    tagline: 'Straightforward format for site records',
    description:
      'Grey-green accent, Calibri font. Practical assessment format covering equipment, exposure times, controls, and operative acknowledgement. Clear and concise for the site safety file without unnecessary bulk.',
    font: 'Calibri',
    accentColor: '4D7C0F',
    style: 'Clean practical format for site use',
    pageCount: '3–5',
    detailLevel: 'Practical',
    thumbnailPath: '/product-images/wbv-templates/thumb-site-practical.jpg',
    previewPaths: ['/product-images/wbv-templates/preview-site-practical-p1.jpg'],
    keySections: ['Equipment & Exposure Summary', 'Controls Checklist', 'Operative Acknowledgement', 'Review Date'],
  },
};

export const WBV_TEMPLATE_ORDER: WbvTemplateSlug[] = [
  'professional',
  'compliance',
  'site-practical',
];
