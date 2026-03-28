// =============================================================================
// Confined Spaces Assessment Builder — Template Configuration
// 4 templates. Free-tier tool: first 2 free.
// =============================================================================
import { ConfinedSpacesTemplateConfig, ConfinedSpacesTemplateSlug } from './types';

export const CONFINED_SPACES_TEMPLATE_CONFIGS: Record<ConfinedSpacesTemplateSlug, ConfinedSpacesTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive 22-section assessment with cover page. Adjacent/connected space mapping, historical gas readings, SIMOPS assessment, atmospheric monitoring, isolation matrix, duration/heat stress limits, welfare and decontamination, full rescue plan, and regulatory references.',
    pageCount: 5,
    layout: 'standard',
    thumbnailPath: '/product-images/confined-spaces-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/confined-spaces-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/confined-spaces-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/confined-spaces-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/confined-spaces-templates/preview-ebrora-standard-p4.jpg',
      '/product-images/confined-spaces-templates/preview-ebrora-standard-p5.jpg',
    ],
    keySections: [
      'Adjacent & Connected Spaces Table',
      'Historical Gas Readings Trend',
      'SIMOPS Assessment',
      'Duration Limits & Heat Stress',
      'Welfare & Decontamination',
      '22 Numbered Sections',
    ],
  },

  'red-danger': {
    slug: 'red-danger',
    displayName: 'Red Danger',
    description:
      'Hazard-first design with prominent IDLH danger callouts, red warning boxes before atmospheric, gas migration, and leptospirosis sections. Historical gas readings highlighted by severity. Includes adjacent spaces, SIMOPS, duration limits, and decontamination.',
    pageCount: 4,
    layout: 'danger',
    thumbnailPath: '/product-images/confined-spaces-templates/thumb-red-danger.jpg',
    previewPaths: [
      '/product-images/confined-spaces-templates/preview-red-danger-p1.jpg',
      '/product-images/confined-spaces-templates/preview-red-danger-p2.jpg',
      '/product-images/confined-spaces-templates/preview-red-danger-p3.jpg',
      '/product-images/confined-spaces-templates/preview-red-danger-p4.jpg',
    ],
    keySections: [
      'IDLH Danger Classification Banner',
      'Historical Gas Readings (Severity-Highlighted)',
      'Gas Migration Warning Callout',
      'Rescuer Fatality Statistic (L101 §129)',
      'Leptospirosis Danger Callout',
      '17 Sections — Hazard-First',
    ],
  },

  'permit-style': {
    slug: 'permit-style',
    displayName: 'Permit Style',
    description:
      'Combined assessment and entry permit format. 19-item pre-entry checklist with tick boxes, blank gas test result tables at 3 depths, periodic 30-minute re-test log, personnel entry/exit log, 5-person authorisation chain, and formal permit cancellation/handback section.',
    pageCount: 4,
    layout: 'permit',
    thumbnailPath: '/product-images/confined-spaces-templates/thumb-permit-style.jpg',
    previewPaths: [
      '/product-images/confined-spaces-templates/preview-permit-style-p1.jpg',
      '/product-images/confined-spaces-templates/preview-permit-style-p2.jpg',
      '/product-images/confined-spaces-templates/preview-permit-style-p3.jpg',
      '/product-images/confined-spaces-templates/preview-permit-style-p4.jpg',
    ],
    keySections: [
      '19-Item Pre-Entry Checklist',
      'Gas Test Results Table (3 Depths)',
      '30-Minute Periodic Re-Test Log',
      'Personnel Entry/Exit Log',
      '5-Person Authorisation Chain',
      'Permit Handback & Close-Out',
    ],
  },

  'rescue-focused': {
    slug: 'rescue-focused',
    displayName: 'Rescue Focused',
    description:
      'Rescue plan given equal visual weight to the assessment. 10-step rescue procedure with time targets, 600mm manhole extraction method, multiple casualty decision tree, FRS pre-notification, 12-item equipment inventory, communication cascade, hospital route, post-incident evidence preservation, and rescue drill log.',
    pageCount: 5,
    layout: 'rescue',
    thumbnailPath: '/product-images/confined-spaces-templates/thumb-rescue-focused.jpg',
    previewPaths: [
      '/product-images/confined-spaces-templates/preview-rescue-focused-p1.jpg',
      '/product-images/confined-spaces-templates/preview-rescue-focused-p2.jpg',
      '/product-images/confined-spaces-templates/preview-rescue-focused-p3.jpg',
      '/product-images/confined-spaces-templates/preview-rescue-focused-p4.jpg',
      '/product-images/confined-spaces-templates/preview-rescue-focused-p5.jpg',
    ],
    keySections: [
      '600mm Manhole Extraction Method',
      'Multiple Casualty Decision Tree',
      'FRS Pre-Notification Details',
      'Post-Incident Evidence Preservation',
      '12-Item Rescue Equipment Inventory',
      'Rescue Drill Log',
    ],
  },
};

/** Get config by slug */
export function getConfinedSpacesTemplateConfig(slug: ConfinedSpacesTemplateSlug): ConfinedSpacesTemplateConfig {
  return CONFINED_SPACES_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidConfinedSpacesTemplateSlug(slug: string): slug is ConfinedSpacesTemplateSlug {
  return slug in CONFINED_SPACES_TEMPLATE_CONFIGS;
}
