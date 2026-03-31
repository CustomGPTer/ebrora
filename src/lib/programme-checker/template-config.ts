// =============================================================================
// Programme Checker — Template Configuration
// 4 templates. 1 free (rag-report).
// =============================================================================
import { ProgrammeCheckerTemplateConfig, ProgrammeCheckerTemplateSlug } from './types';

export const PROGRAMME_CHECKER_TEMPLATE_CONFIGS: Record<ProgrammeCheckerTemplateSlug, ProgrammeCheckerTemplateConfig> = {
  'scoring': {
    slug: 'scoring',
    displayName: 'Scoring Report',
    description:
      'Weighted numerical scoring system across 8 review areas. Each area scored 0\u201310 with a weighted overall percentage, score summary dashboard, and ranked deficiency table. Ideal for benchmarking programmes against each other or tracking improvement over time.',
    pageCount: 2,
    layout: 'scoring',
    thumbnailPath: '/product-images/programme-checker-templates/thumb-scoring.jpg',
    previewPaths: [
      '/product-images/programme-checker-templates/preview-scoring-p1.jpg',
      '/product-images/programme-checker-templates/preview-scoring-p2.jpg',
    ],
    keySections: [
      'Overall Weighted Score (%)',
      'Score Dashboard (8 Areas)',
      'Area-by-Area Scoring Breakdown',
      'Weighted Scoring Methodology',
      'Ranked Deficiency Table',
      'Score Trend Recommendations',
      'Priority Improvement Actions',
      'Sign-Off',
    ],
  },

  'email-summary': {
    slug: 'email-summary',
    displayName: 'Email Summary',
    description:
      'Concise professional email-style summary of programme findings. Formatted as a letter addressed to the Project Manager with key issues, headline statistics, and recommended next steps. Perfect for attaching to emails or dropping into project reports without reformatting.',
    pageCount: 1,
    layout: 'email',
    thumbnailPath: '/product-images/programme-checker-templates/thumb-email-summary.jpg',
    previewPaths: [
      '/product-images/programme-checker-templates/preview-email-summary-p1.jpg',
    ],
    keySections: [
      'Addressed To / From / Date / Subject',
      'Opening Summary Paragraph',
      'Key Findings (Bullet Points)',
      'Programme Statistics Box',
      'Critical Issues Flagged',
      'Recommended Next Steps',
      'Formal Sign-Off',
    ],
  },

  'rag-report': {
    slug: 'rag-report',
    displayName: 'RAG Report',
    description:
      'Red-Amber-Green rated programme review across 8 assessment areas. Each area receives a RAG rating with detailed findings, issues, and recommendations. Includes executive summary, programme metrics, critical issues table, and recommended actions \u2014 the standard programme review format.',
    pageCount: 3,
    layout: 'rag',
    thumbnailPath: '/product-images/programme-checker-templates/thumb-rag-report.jpg',
    previewPaths: [
      '/product-images/programme-checker-templates/preview-rag-report-p1.jpg',
      '/product-images/programme-checker-templates/preview-rag-report-p2.jpg',
      '/product-images/programme-checker-templates/preview-rag-report-p3.jpg',
    ],
    keySections: [
      'Executive Summary',
      'Programme Metrics Dashboard',
      'RAG-Rated Review Areas (8)',
      'Detailed Findings per Area',
      'Issues Identified',
      'Recommendations per Area',
      'Critical Issues Table',
      'Recommended Actions Log',
    ],
  },

  'comprehensive': {
    slug: 'comprehensive',
    displayName: 'Comprehensive Report',
    description:
      'Full-detail programme analysis covering every aspect. RAG ratings with numerical scores, extended findings (250+ words per area), risk matrix, float distribution analysis, critical path narrative, resource loading assessment, contractual compliance check, and a structured improvement plan with owners and deadlines.',
    pageCount: 4,
    layout: 'comprehensive',
    thumbnailPath: '/product-images/programme-checker-templates/thumb-comprehensive.jpg',
    previewPaths: [
      '/product-images/programme-checker-templates/preview-comprehensive-p1.jpg',
      '/product-images/programme-checker-templates/preview-comprehensive-p2.jpg',
      '/product-images/programme-checker-templates/preview-comprehensive-p3.jpg',
      '/product-images/programme-checker-templates/preview-comprehensive-p4.jpg',
    ],
    keySections: [
      'Executive Summary (500+ Words)',
      'Programme Metrics Dashboard',
      'RAG + Score per Area (8 Areas)',
      'Extended Findings (250+ Words Each)',
      'Risk Matrix (Likelihood x Impact)',
      'Float Distribution Analysis',
      'Critical Path Narrative',
      'Resource Loading Assessment',
      'Contractual Milestone Compliance',
      'Structured Improvement Plan',
      'Appendix: Methodology & Definitions',
      'Three-Role Sign-Off',
    ],
  },
};

export function getProgrammeCheckerTemplateConfig(slug: ProgrammeCheckerTemplateSlug): ProgrammeCheckerTemplateConfig {
  return PROGRAMME_CHECKER_TEMPLATE_CONFIGS[slug];
}

export function isValidProgrammeCheckerTemplateSlug(slug: string): slug is ProgrammeCheckerTemplateSlug {
  return slug in PROGRAMME_CHECKER_TEMPLATE_CONFIGS;
}
