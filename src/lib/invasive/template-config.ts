// =============================================================================
// Invasive Species Management Plan — Template Configuration
// =============================================================================
import type { InvasiveTemplateSlug, InvasiveTemplateConfig } from './types';

export const INVASIVE_TEMPLATE_CONFIGS: Record<InvasiveTemplateSlug, InvasiveTemplateConfig> = {
  'ecological-report': {
    slug: 'ecological-report',
    displayName: 'Ecological Report',
    tagline: 'Full ecological assessment with legal references',
    description:
      'Forest green accent, Arial font. Comprehensive management plan with species identification, legal framework (Wildlife & Countryside Act 1981, Environmental Protection Act 1990), treatment methodology, biosecurity protocols, disposal routes, and monitoring schedule. For planning conditions and EA submissions.',
    font: 'Arial',
    accentColor: '166534',
    style: 'Full ecological report with legal framework',
    pageCount: '8–14',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/invasive-templates/thumb-ecological-report.jpg',
    previewPaths: [
      '/product-images/invasive-templates/preview-ecological-report-p1.jpg',
      '/product-images/invasive-templates/preview-ecological-report-p2.jpg',
      '/product-images/invasive-templates/preview-ecological-report-p3.jpg',
    ],
    keySections: ['Cover Page & Document Control', 'Species Identification', 'Legal Framework', 'Treatment Methodology', 'Biosecurity & Monitoring'],
  },
  'site-management': {
    slug: 'site-management',
    displayName: 'Site Management',
    tagline: 'Practical plan for construction site teams',
    description:
      'Teal accent bands, Calibri font. Practical site management plan covering exclusion zones, toolbox talk content, handling procedures, disposal routes, and operative responsibilities. Core sections for the site safety file.',
    font: 'Calibri',
    accentColor: '0D9488',
    style: 'Modern professional for site operations',
    pageCount: '5–8',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/invasive-templates/thumb-site-management.jpg',
    previewPaths: [
      '/product-images/invasive-templates/preview-site-management-p1.jpg',
      '/product-images/invasive-templates/preview-site-management-p2.jpg',
      '/product-images/invasive-templates/preview-site-management-p3.jpg',
    ],
    keySections: ['Species & Location', 'Exclusion Zones', 'Handling Procedures', 'Disposal Route', 'Operative Briefing'],
  },
  'briefing-note': {
    slug: 'briefing-note',
    displayName: 'Briefing Note',
    tagline: 'Quick awareness brief for operatives',
    description:
      'Slate grey minimal styling. Species identification, key dos and don\'ts, and what to do if invasive species are encountered. No cover page. For toolbox talk material or site induction packs.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal briefing format',
    pageCount: '2–3',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/invasive-templates/thumb-briefing-note.jpg',
    previewPaths: [
      '/product-images/invasive-templates/preview-briefing-note-p1.jpg',
      '/product-images/invasive-templates/preview-briefing-note-p2.jpg',
      '/product-images/invasive-templates/preview-briefing-note-p3.jpg',
    ],
    keySections: ['Species ID & Photos', 'Key Rules', 'What To Do If Found', 'Contact Details'],
  },
};

export const INVASIVE_TEMPLATE_ORDER: InvasiveTemplateSlug[] = [
  'ecological-report',
  'site-management',
  'briefing-note',
];
