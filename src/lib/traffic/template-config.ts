// =============================================================================
// Site Traffic Management Plan — Template Configuration
// =============================================================================
import type { TrafficTemplateSlug, TrafficTemplateConfig } from './types';

export const TRAFFIC_TEMPLATE_CONFIGS: Record<TrafficTemplateSlug, TrafficTemplateConfig> = {
  'full-chapter8': {
    slug: 'full-chapter8',
    displayName: 'Full Chapter 8',
    tagline: 'Maximum detail with TSRGD and Chapter 8 references',
    description:
      'Deep green branded cover, full Chapter 8 compliance, TSRGD sign schedules, vehicle swept path considerations, phasing plans, and risk assessments. For highway works, Section 278 schemes, and National Highways submissions.',
    font: 'Arial',
    accentColor: '065F46',
    style: 'Full branded plan with cover page and all sections',
    pageCount: '10–16',
    detailLevel: 'Full',
    thumbnailPath: '/product-images/traffic-templates/thumb-full-chapter8.jpg',
    previewPaths: [
      '/product-images/traffic-templates/preview-full-chapter8-p1.jpg',
      '/product-images/traffic-templates/preview-full-chapter8-p2.jpg',
      '/product-images/traffic-templates/preview-full-chapter8-p3.jpg',
      '/product-images/traffic-templates/preview-full-chapter8-p4.jpg',
      '/product-images/traffic-templates/preview-full-chapter8-p5.jpg',
    ],
    keySections: ['Branded Cover Page', 'Chapter 8 Compliance', 'Sign Schedule (TSRGD)', 'Phasing & Sequencing', 'Risk Assessment'],
  },
  'formal-highways': {
    slug: 'formal-highways',
    displayName: 'Formal Highways',
    tagline: 'For local authority and National Highways approval',
    description:
      'Charcoal with amber accents, Cambria font. Clause-referenced format designed for highway authority approval. References Safety at Street Works Code of Practice, NRSWA 1991, and DMRB standards throughout.',
    font: 'Cambria',
    accentColor: 'B45309',
    style: 'Formal regulatory format for authority submissions',
    pageCount: '8–12',
    detailLevel: 'Detailed',
    thumbnailPath: '/product-images/traffic-templates/thumb-formal-highways.jpg',
    previewPaths: [
      '/product-images/traffic-templates/preview-formal-highways-p1.jpg',
      '/product-images/traffic-templates/preview-formal-highways-p2.jpg',
      '/product-images/traffic-templates/preview-formal-highways-p3.jpg',
    ],
    keySections: ['Authority Submission Header', 'Regulatory References', 'Sign & Guard Schedule', 'Temporary Speed Limits', 'Review & Approval'],
  },
  'site-plan': {
    slug: 'site-plan',
    displayName: 'Site Plan',
    tagline: 'Practical site-level TM plan',
    description:
      'Steel blue accent bands, Calibri font. Practical traffic management plan for site operations — vehicle routes, pedestrian segregation, banksman positions, speed limits, and delivery booking. For internal site TM rather than highway works.',
    font: 'Calibri',
    accentColor: '1E40AF',
    style: 'Modern professional for site operations',
    pageCount: '5–8',
    detailLevel: 'Standard',
    thumbnailPath: '/product-images/traffic-templates/thumb-site-plan.jpg',
    previewPaths: [
      '/product-images/traffic-templates/preview-site-plan-p1.jpg',
      '/product-images/traffic-templates/preview-site-plan-p2.jpg',
      '/product-images/traffic-templates/preview-site-plan-p3.jpg',
    ],
    keySections: ['Site Layout & Routes', 'Vehicle / Pedestrian Segregation', 'Speed Limits & Banksmen', 'Delivery Management', 'Emergency Access'],
  },
  'quick-brief': {
    slug: 'quick-brief',
    displayName: 'Quick Brief',
    tagline: 'Rapid TM briefing for short-duration works',
    description:
      'Slate grey minimal styling. Key traffic controls, sign positions, and operative roles only. No cover page. For short-duration works, minor road closures, or daily TM briefings where a full plan already exists.',
    font: 'Arial',
    accentColor: '475569',
    style: 'Minimal briefing format',
    pageCount: '2–4',
    detailLevel: 'Light',
    thumbnailPath: '/product-images/traffic-templates/thumb-quick-brief.jpg',
    previewPaths: [
      '/product-images/traffic-templates/preview-quick-brief-p1.jpg',
      '/product-images/traffic-templates/preview-quick-brief-p2.jpg',
    ],
    keySections: ['Works Summary', 'TM Layout & Signs', 'Operative Roles', 'Emergency Procedure'],
  },
};

export const TRAFFIC_TEMPLATE_ORDER: TrafficTemplateSlug[] = [
  'full-chapter8',
  'formal-highways',
  'site-plan',
  'quick-brief',
];
