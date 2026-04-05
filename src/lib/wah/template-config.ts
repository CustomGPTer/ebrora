// =============================================================================
// Working at Height Assessment — Template Configuration
// =============================================================================
import type { WahTemplateSlug, WahTemplateConfig } from './types';

export const WAH_TEMPLATE_CONFIGS: Record<WahTemplateSlug, WahTemplateConfig> = {
  'full-compliance': {
    slug: 'full-compliance',
    displayName: 'Full Compliance',
    tagline: 'Maximum detail with regulation references',
    description:
      'Deep green branded cover, every section rendered including rescue plan, competency matrix, weather restrictions, and emergency procedures. Full WAH Regs 2005 compliance with Schedule references. For high-risk activities and Tier 1 submissions.',
    font: 'Arial',
    accentColor: '065F46',
    style: 'Full branded assessment with cover page and all sections',
    pageCount: '8–12',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/wah-templates/thumb-full-compliance.jpg',
    previewPaths: [
      '/product-images/wah-templates/preview-full-compliance-p1.jpg',
      '/product-images/wah-templates/preview-full-compliance-p2.jpg',
      '/product-images/wah-templates/preview-full-compliance-p3.jpg',
    ],
    keySections: ['Branded Cover Page', 'Hierarchy of Control', 'Risk Matrix', 'Rescue Plan', 'Competency & Emergency'],
  },
  'formal-hse': {
    slug: 'formal-hse',
    displayName: 'Formal HSE',
    tagline: 'Clause-referenced for audits and inspections',
    description:
      'Charcoal headers with amber clause numbering, Cambria serif font. References WAH Regs 2005 Schedule 1–7 throughout. Designed to withstand HSE inspector scrutiny. Detailed hazard identification and control hierarchy.',
    font: 'Cambria',
    accentColor: 'B45309',
    style: 'Formal regulatory format with clause references',
    pageCount: '6–10',
    detailLevel: 'Detailed',
    thumbnailPath: '/product-images/wah-templates/thumb-formal-hse.jpg',
    previewPaths: [
      '/product-images/wah-templates/preview-formal-hse-p1.jpg',
      '/product-images/wah-templates/preview-formal-hse-p2.jpg',
      '/product-images/wah-templates/preview-formal-hse-p3.jpg',
    ],
    keySections: ['Regulation References', 'Clause-Numbered Sections', 'Detailed Hazard Table', 'Control Hierarchy', 'Review Schedule'],
  },
  'site-ready': {
    slug: 'site-ready',
    displayName: 'Site-Ready',
    tagline: 'Practical format for site teams',
    description:
      'Steel blue accent bands, Calibri font. Practical site-level format covering hazards, controls, equipment, and sign-off. Clear enough for operatives, detailed enough for the site file. Core sections only.',
    font: 'Calibri',
    accentColor: '1E40AF',
    style: 'Modern professional with blue accent bands',
    pageCount: '4–7',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/wah-templates/thumb-site-ready.jpg',
    previewPaths: [
      '/product-images/wah-templates/preview-site-ready-p1.jpg',
      '/product-images/wah-templates/preview-site-ready-p2.jpg',
      '/product-images/wah-templates/preview-site-ready-p3.jpg',
    ],
    keySections: ['Task & Location Details', 'Hazard Table with RAG', 'Equipment Checklist', 'Controls & Sign-Off'],
  },
  'quick-check': {
    slug: 'quick-check',
    displayName: 'Quick Check',
    tagline: 'Fast pre-task WAH checklist',
    description:
      'Slate grey minimal styling. Key hazards, controls, equipment check, and team sign-off only. No cover page, no lengthy narrative. For low-risk WAH activities or daily pre-task checks where a full assessment is already in place.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal checklist with essential controls only',
    pageCount: '2–3',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/wah-templates/thumb-quick-check.jpg',
    previewPaths: [
      '/product-images/wah-templates/preview-quick-check-p1.jpg',
      '/product-images/wah-templates/preview-quick-check-p2.jpg',
    ],
    keySections: ['Task Summary', 'Key Hazards & Controls', 'Equipment Check', 'Team Sign-Off'],
  },
};

export const WAH_TEMPLATE_ORDER: WahTemplateSlug[] = [
  'full-compliance',
  'formal-hse',
  'site-ready',
  'quick-check',
];
