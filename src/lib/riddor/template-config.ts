// =============================================================================
// RIDDOR Report — Template Configuration
// =============================================================================
import type { RiddorTemplateSlug, RiddorTemplateConfig } from './types';

export const RIDDOR_TEMPLATE_CONFIGS: Record<RiddorTemplateSlug, RiddorTemplateConfig> = {
  'formal-investigation': {
    slug: 'formal-investigation',
    displayName: 'Formal Investigation',
    tagline: 'Full investigation report with root cause analysis',
    description:
      'Red accent, Arial font. Complete RIDDOR investigation report with incident timeline, witness statements summary, root cause analysis (5 Whys / bow-tie), corrective actions, and lessons learned. For specified injuries, dangerous occurrences, and fatalities.',
    font: 'Arial',
    accentColor: 'B91C1C',
    style: 'Full investigation report with root cause analysis',
    pageCount: '7–12',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/riddor-templates/thumb-formal-investigation.jpg',
    previewPaths: ['/product-images/riddor-templates/preview-formal-investigation-p1.jpg'],
    keySections: ['Incident Summary', 'Investigation Timeline', 'Root Cause Analysis', 'Corrective Actions', 'Lessons Learned'],
  },
  'corporate': {
    slug: 'corporate',
    displayName: 'Corporate Report',
    tagline: 'Professional format for management reporting',
    description:
      'Navy accent, Cambria font. Structured corporate incident report for management and client notification. Classification table, injury details, immediate actions, and follow-up schedule. Suitable for board-level reporting.',
    font: 'Cambria',
    accentColor: '1E3A5F',
    style: 'Corporate management reporting format',
    pageCount: '5–8',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/riddor-templates/thumb-corporate.jpg',
    previewPaths: ['/product-images/riddor-templates/preview-corporate-p1.jpg'],
    keySections: ['Classification & Severity', 'Injured Person Details', 'Incident Description', 'Actions Taken', 'Follow-Up Schedule'],
  },
  'quick-notification': {
    slug: 'quick-notification',
    displayName: 'Quick Notification',
    tagline: 'Rapid notification for time-critical reporting',
    description:
      'Orange accent, Calibri font. Streamlined notification format for the initial RIDDOR report within the statutory timeframe. Key facts, classification, and immediate actions. Designed to be completed quickly while details are fresh.',
    font: 'Calibri',
    accentColor: 'C2410C',
    style: 'Streamlined notification format',
    pageCount: '2–4',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/riddor-templates/thumb-quick-notification.jpg',
    previewPaths: ['/product-images/riddor-templates/preview-quick-notification-p1.jpg'],
    keySections: ['RIDDOR Classification', 'Key Facts Summary', 'Immediate Actions', 'HSE Notification Record'],
  },
};

export const RIDDOR_TEMPLATE_ORDER: RiddorTemplateSlug[] = [
  'formal-investigation',
  'corporate',
  'quick-notification',
];
