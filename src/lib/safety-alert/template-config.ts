// =============================================================================
// Safety Alert Builder — Template Configuration
// 4 templates. Free: ebrora-standard + lessons-learned.
// =============================================================================
import { SafetyAlertTemplateConfig, SafetyAlertTemplateSlug } from './types';

export const SAFETY_ALERT_TEMPLATE_CONFIGS: Record<SafetyAlertTemplateSlug, SafetyAlertTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Professional green-branded safety alert bulletin with structured incident summary, timeline of events, immediate and underlying causes, potential consequences assessment, lessons learned, and mandatory preventive actions. Includes distribution list and briefing confirmation section. The comprehensive standard safety alert format aligned with CDM 2015 duty to share safety intelligence.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/safety-alert-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/safety-alert-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/safety-alert-templates/preview-ebrora-standard-p2.jpg',
    ],
    keySections: [
      'Green Branded Header & Alert Reference',
      'Alert Classification (Near Miss / Incident / Hazard)',
      'Incident Summary with Location & Date',
      'What Happened — Timeline of Events',
      'Immediate & Underlying Causes',
      'Potential Consequences Assessment',
      'Lessons Learned',
      'Preventive Actions — What You Must Do',
      'Distribution List & Briefing Confirmation',
    ],
  },

  'red-emergency': {
    slug: 'red-emergency',
    displayName: 'Red Emergency',
    description:
      'Bold single-page emergency safety bulletin with full red banner, high-visibility hazard classification, large-format key message callout, and mandatory immediate actions in numbered priority order. Designed for critical alerts that need instant site-wide distribution — RIDDOR reportable incidents, imminent danger notifications, or stop-work safety bulletins. Built to pin on every notice board and brief at every toolbox talk.',
    pageCount: 1,
    layout: 'emergency',
    thumbnailPath: '/product-images/safety-alert-templates/thumb-red-emergency.jpg',
    previewPaths: [
      '/product-images/safety-alert-templates/preview-red-emergency-p1.jpg',
    ],
    keySections: [
      'Full Red Banner — SAFETY ALERT Header',
      'Hazard Classification (High/Medium/Low)',
      'Large-Format Key Message Callout',
      'What Happened — 3 Sentence Summary',
      'Immediate Actions — Numbered Priority',
      'Who Must Be Briefed',
      'Site Manager Authorisation Strip',
    ],
  },

  'lessons-learned': {
    slug: 'lessons-learned',
    displayName: 'Lessons Learned',
    description:
      'Narrative-focused safety alert designed for toolbox talk briefings and safety stand-downs. Tells the story of what happened in accessible, non-technical language with a clear "what went wrong → what we learned → what changes" structure. Includes discussion prompts for supervisors, operative acknowledgement section, and connection to site-specific RAMS. Ideal for frontline workforce engagement and behavioural safety culture.',
    pageCount: 2,
    layout: 'lessons',
    thumbnailPath: '/product-images/safety-alert-templates/thumb-lessons-learned.jpg',
    previewPaths: [
      '/product-images/safety-alert-templates/preview-lessons-learned-p1.jpg',
      '/product-images/safety-alert-templates/preview-lessons-learned-p2.jpg',
    ],
    keySections: [
      'Accessible Header with Alert Type',
      'The Story — What Happened (Narrative)',
      'What Went Wrong — Plain Language',
      'What We Learned — Key Takeaways',
      'What Changes Now — Specific Actions',
      'Discussion Prompts for Supervisors',
      'Connection to Site RAMS & Safe Systems',
      'Operative Acknowledgement Section',
    ],
  },

  'formal-investigation': {
    slug: 'formal-investigation',
    displayName: 'Formal Investigation',
    description:
      'Detailed investigation-grade safety alert with comprehensive timeline reconstruction, witness statement summaries, contributory factor analysis using HSG245 methodology, barrier analysis (what defences failed), RIDDOR reportability assessment, and formal action plan with named owners, target dates, and effectiveness review dates. Includes regulatory notification record and evidence preservation guidance. For serious incidents requiring thorough investigation per HSE guidance HSG245.',
    pageCount: 3,
    layout: 'investigation',
    thumbnailPath: '/product-images/safety-alert-templates/thumb-formal-investigation.jpg',
    previewPaths: [
      '/product-images/safety-alert-templates/preview-formal-investigation-p1.jpg',
      '/product-images/safety-alert-templates/preview-formal-investigation-p2.jpg',
      '/product-images/safety-alert-templates/preview-formal-investigation-p3.jpg',
    ],
    keySections: [
      'Investigation Reference & Classification',
      'Detailed Timeline Reconstruction',
      'Witness Statement Summaries',
      'Contributory Factor Analysis (HSG245)',
      'Barrier Analysis — What Defences Failed',
      'RIDDOR Reportability Assessment',
      'Formal Action Plan (Owners & Dates)',
      'Effectiveness Review Schedule',
      'Regulatory Notification Record',
      'Evidence Preservation Guidance',
    ],
  },
};

/** Get config by slug */
export function getSafetyAlertTemplateConfig(slug: SafetyAlertTemplateSlug): SafetyAlertTemplateConfig {
  return SAFETY_ALERT_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidSafetyAlertTemplateSlug(slug: string): slug is SafetyAlertTemplateSlug {
  return slug in SAFETY_ALERT_TEMPLATE_CONFIGS;
}
