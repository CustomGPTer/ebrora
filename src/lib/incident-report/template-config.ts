// =============================================================================
// Incident Report Builder — Template Configuration
// 4 templates. Paid-only tool (Standard/Professional).
// =============================================================================
import { IncidentReportTemplateConfig, IncidentReportTemplateSlug } from './types';

export const INCIDENT_REPORT_TEMPLATE_CONFIGS: Record<IncidentReportTemplateSlug, IncidentReportTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive green-branded investigation report with cover page. Sequential sections: incident summary, persons involved, chronological timeline, immediate causes, root cause analysis (5 Whys), contributing factors matrix, RIDDOR assessment, evidence log, risk re-rating, corrective actions with priority/status tracking, lessons learned, regulatory references, distribution list, and sign-off.',
    pageCount: 4,
    layout: 'standard',
    thumbnailPath: '/product-images/incident-report-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/incident-report-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/incident-report-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/incident-report-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/incident-report-templates/preview-ebrora-standard-p4.jpg',
    ],
    keySections: [
      'Green Branded Cover Page',
      'Chronological Timeline of Events',
      'Root Cause Analysis — 5 Whys',
      'Contributing Factors Matrix',
      'RIDDOR Reportability Assessment',
      'Corrective Actions with Priority & Status',
      'Evidence Log & Risk Re-Rating',
      'Lessons Learned & Distribution',
    ],
  },

  'riddor-focused': {
    slug: 'riddor-focused',
    displayName: 'RIDDOR Focused',
    description:
      'Red-accented regulatory submission format structured around RIDDOR 2013. F2508 field mapping, incident classification table, statutory reporting timeline, specified injuries checklist (Schedule 1), dangerous occurrences checklist (Schedule 2), HSE accident kind codes, defective plant/equipment log, witness statements summary, medical treatment record, enforcing authority notification details, and statutory notification checklist.',
    pageCount: 4,
    layout: 'banded',
    thumbnailPath: '/product-images/incident-report-templates/thumb-riddor-focused.jpg',
    previewPaths: [
      '/product-images/incident-report-templates/preview-riddor-focused-p1.jpg',
      '/product-images/incident-report-templates/preview-riddor-focused-p2.jpg',
      '/product-images/incident-report-templates/preview-riddor-focused-p3.jpg',
      '/product-images/incident-report-templates/preview-riddor-focused-p4.jpg',
    ],
    keySections: [
      'RIDDOR Incident Classification Table',
      'Statutory Reporting Timeline',
      'Specified Injuries Checklist (Schedule 1)',
      'Dangerous Occurrences Checklist (Schedule 2)',
      'HSE Accident Kind Codes',
      'Defective Plant & Equipment Log',
      'Witness Statements Summary',
      'Medical Treatment Record',
      'Enforcing Authority Notification',
      'Statutory Notification Checklist',
    ],
  },

  'root-cause': {
    slug: 'root-cause',
    displayName: 'Root Cause Analysis',
    description:
      'Navy/blue analytical investigation layout. Deep-dive 5 Whys cascade with visual arrows, contributing factors matrix (People/Plant/Process/Place/Procedure), 9-layer barrier analysis (failed/weakened/absent), causal chain mapping, pre/post/target risk re-rating, systemic vs local recommendations, management system gap analysis with ISO 45001 references, corrective actions with verification KPIs, and 30/60/90/180-day close-out plan.',
    pageCount: 4,
    layout: 'structured',
    thumbnailPath: '/product-images/incident-report-templates/thumb-root-cause.jpg',
    previewPaths: [
      '/product-images/incident-report-templates/preview-root-cause-p1.jpg',
      '/product-images/incident-report-templates/preview-root-cause-p2.jpg',
      '/product-images/incident-report-templates/preview-root-cause-p3.jpg',
      '/product-images/incident-report-templates/preview-root-cause-p4.jpg',
    ],
    keySections: [
      '5 Whys Deep-Dive Cascade',
      'Contributing Factors Matrix (5 Categories)',
      '9-Layer Barrier Analysis',
      'Causal Chain Mapping',
      'Risk Re-Rating (Pre/Post/Target)',
      'Systemic vs Local Recommendations',
      'Management System Gap Analysis (ISO 45001)',
      'Corrective Actions with KPIs',
      '30/60/90/180-Day Close-Out Plan',
    ],
  },

  'near-miss': {
    slug: 'near-miss',
    displayName: 'Near Miss / Observation',
    description:
      'Amber/orange compact format for near misses, unsafe conditions, and unsafe acts. Colour-coded classification tags, potential severity assessment with fatality-potential analysis, hazard identification table, immediate actions taken, underlying causes, prevention measures (immediate fix vs systemic action), similar previous occurrences with trend analysis, communication plan, positive observations, and reporter recognition.',
    pageCount: 3,
    layout: 'compact',
    thumbnailPath: '/product-images/incident-report-templates/thumb-near-miss.jpg',
    previewPaths: [
      '/product-images/incident-report-templates/preview-near-miss-p1.jpg',
      '/product-images/incident-report-templates/preview-near-miss-p2.jpg',
      '/product-images/incident-report-templates/preview-near-miss-p3.jpg',
    ],
    keySections: [
      'Colour-Coded Classification Tags',
      'Potential Severity Assessment',
      'Hazard Identification Table',
      'Immediate Actions Taken',
      'Underlying Causes Analysis',
      'Prevention Measures (Fix vs Systemic)',
      'Similar Previous Occurrences & Trends',
      'Positive Observations & Reporter Recognition',
    ],
  },
};

export function getIncidentReportTemplateConfig(slug: IncidentReportTemplateSlug): IncidentReportTemplateConfig {
  return INCIDENT_REPORT_TEMPLATE_CONFIGS[slug];
}

export function isValidIncidentReportTemplateSlug(slug: string): slug is IncidentReportTemplateSlug {
  return slug in INCIDENT_REPORT_TEMPLATE_CONFIGS;
}
