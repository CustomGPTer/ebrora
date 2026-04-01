// =============================================================================
// Noise Assessment Builder — Template Configuration
// 4 templates. Paid-only tool (Standard/Professional).
// =============================================================================
import { NoiseAssessmentTemplateConfig, NoiseAssessmentTemplateSlug } from './types';

export const NOISE_ASSESSMENT_TEMPLATE_CONFIGS: Record<NoiseAssessmentTemplateSlug, NoiseAssessmentTemplateConfig> = {
  'ebrora-standard': {
    slug: 'ebrora-standard',
    displayName: 'Ebrora Standard',
    description:
      'Comprehensive green-branded BS 5228-1:2009+A1:2014 construction noise assessment with cover page. Full plant inventory with BS 5228 Table C source noise levels, sensitive receptor identification with distances and types, noise prediction methodology with distance attenuation calculations, predicted LAeq levels at each receptor, impact assessment against ABC method criteria, Best Practicable Means (BPM) justification, mitigation measures hierarchy, noise monitoring plan, vibration screening assessment (BS 5228-2), working hours analysis, regulatory references, and sign-off.',
    pageCount: 5,
    layout: 'standard',
    thumbnailPath: '/product-images/noise-assessment-templates/thumb-ebrora-standard.jpg',
    previewPaths: [
      '/product-images/noise-assessment-templates/preview-ebrora-standard-p1.jpg',
      '/product-images/noise-assessment-templates/preview-ebrora-standard-p2.jpg',
      '/product-images/noise-assessment-templates/preview-ebrora-standard-p3.jpg',
      '/product-images/noise-assessment-templates/preview-ebrora-standard-p4.jpg'
    ],
    keySections: [
      'Green Branded Cover Page',
      'Plant Inventory with BS 5228 Source Levels',
      'Sensitive Receptor Identification',
      'Noise Prediction Methodology',
      'Predicted LAeq Levels at Receptors',
      'Impact Assessment (ABC Method)',
      'Best Practicable Means (BPM)',
      'Mitigation Measures Hierarchy',
      'Noise Monitoring Plan',
      'Vibration Screening (BS 5228-2)',
      'Working Hours Analysis'
    ],
  },

  'section-61': {
    slug: 'section-61',
    displayName: 'Section 61 Application',
    description:
      'Red-accented template structured specifically for Section 61 prior consent application under the Control of Pollution Act 1974. Applicant and site details formatted for local authority submission, proposed works description with programme, plant list with predicted noise levels, proposed working hours including out-of-hours justification, BPM statement, proposed noise limits at site boundary, monitoring methodology and locations, complaint handling procedure, and declaration for local authority approval.',
    pageCount: 4,
    layout: 'application',
    thumbnailPath: '/product-images/noise-assessment-templates/thumb-section-61.jpg',
    previewPaths: [
      '/product-images/noise-assessment-templates/preview-section-61-p1.jpg',
      '/product-images/noise-assessment-templates/preview-section-61-p2.jpg'
    ],
    keySections: [
      'Applicant & Site Details (LA Format)',
      'Proposed Works & Programme',
      'Plant List with Predicted Levels',
      'Proposed Working Hours',
      'BPM Statement & Justification',
      'Proposed Noise Limits at Boundary',
      'Monitoring Methodology & Locations',
      'Complaint Handling Procedure',
      'Section 61 Declaration'
    ],
  },

  'monitoring-report': {
    slug: 'monitoring-report',
    displayName: 'Monitoring Report',
    description:
      'Teal-accented template for ongoing construction noise monitoring results reporting. Monitoring locations with grid references, equipment details and calibration records, measurement results table with LAeq, LAmax, and LA90 values per period, comparison against Section 61 consent limits or BS 5228 criteria, exceedance analysis with root cause identification, weather conditions log, time-history narrative, corrective actions for any exceedances, trend analysis across monitoring periods, and compliance summary.',
    pageCount: 4,
    layout: 'monitoring',
    thumbnailPath: '/product-images/noise-assessment-templates/thumb-monitoring-report.jpg',
    previewPaths: [
      '/product-images/noise-assessment-templates/preview-monitoring-report-p1.jpg',
      '/product-images/noise-assessment-templates/preview-monitoring-report-p2.jpg'
    ],
    keySections: [
      'Monitoring Locations & Grid References',
      'Equipment & Calibration Records',
      'Measurement Results Table (LAeq/LAmax/LA90)',
      'Comparison Against Consent Limits',
      'Exceedance Analysis',
      'Weather Conditions Log',
      'Corrective Actions for Exceedances',
      'Trend Analysis',
      'Compliance Summary'
    ],
  },

  'resident-communication': {
    slug: 'resident-communication',
    displayName: 'Resident Communication',
    description:
      'Navy compact format for communicating noise impacts to affected residents and stakeholders in plain English. Non-technical summary of planned works, expected noise levels explained in everyday terms (comparisons to common sounds), committed working hours, what residents might notice, what the project is doing to reduce noise, project timeline with key noisy phases highlighted, how to make a complaint, dedicated contact details, and a commitment to community liaison.',
    pageCount: 3,
    layout: 'compact',
    thumbnailPath: '/product-images/noise-assessment-templates/thumb-resident-communication.jpg',
    previewPaths: [
      '/product-images/noise-assessment-templates/preview-resident-communication-p1.jpg',
      '/product-images/noise-assessment-templates/preview-resident-communication-p2.jpg'
    ],
    keySections: [
      'Plain English Works Summary',
      'Expected Noise in Everyday Terms',
      'Committed Working Hours',
      'What You Might Notice',
      'What We\'re Doing to Reduce Noise',
      'Project Timeline (Noisy Phases)',
      'How to Make a Complaint',
      'Dedicated Contact Details'
    ],
  },
};

export function getNoiseAssessmentTemplateConfig(slug: NoiseAssessmentTemplateSlug): NoiseAssessmentTemplateConfig {
  return NOISE_ASSESSMENT_TEMPLATE_CONFIGS[slug];
}

export function isValidNoiseAssessmentTemplateSlug(slug: string): slug is NoiseAssessmentTemplateSlug {
  return slug in NOISE_ASSESSMENT_TEMPLATE_CONFIGS;
}
