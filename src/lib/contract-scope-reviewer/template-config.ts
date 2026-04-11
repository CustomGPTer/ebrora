// =============================================================================
// Contract Scope Risk Reviewer — Template Configuration
// 3 templates. 1 free (quick-risk-summary).
// =============================================================================
import { ContractScopeTemplateConfig, ContractScopeTemplateSlug } from './types';

export const CONTRACT_SCOPE_TEMPLATE_CONFIGS: Record<ContractScopeTemplateSlug, ContractScopeTemplateConfig> = {
  'quick-risk-summary': {
    slug: 'quick-risk-summary',
    displayName: 'Quick Risk Summary',
    description:
      'A concise 1–2 page executive overview highlighting the top risks, missing items, and red flags in your scope of works. Ideal for a fast gut-check before meetings or for flagging showstoppers to senior management without overwhelming detail.',
    pageCount: 3,
    layout: 'quick',
    thumbnailPath: '/product-images/contract-scope-reviewer/thumb-quick-risk-summary.jpg',
    previewPaths: [
      '/product-images/contract-scope-reviewer/preview-quick-risk-summary-p1.jpg',
      '/product-images/contract-scope-reviewer/preview-quick-risk-summary-p2.jpg',
      '/product-images/contract-scope-reviewer/preview-quick-risk-summary-p3.jpg',
    ],
    keySections: [
      'Executive Risk Summary',
      'Top 5 Critical Risks',
      'Missing Scope Items',
      'Key Commercial Flags',
      'Recommended Immediate Actions',
      'Overall Risk Rating',
    ],
  },

  'detailed-risk-review': {
    slug: 'detailed-risk-review',
    displayName: 'Detailed Risk Review',
    description:
      'A thorough clause-by-clause risk review across all major scope areas. Each finding is severity-rated (High / Medium / Low) with specific clause references, detailed explanations, and recommended mitigations. Includes a risk register summary table and suggested clarification RFIs.',
    pageCount: 6,
    layout: 'detailed',
    thumbnailPath: '/product-images/contract-scope-reviewer/thumb-detailed-risk-review.jpg',
    previewPaths: [
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p1.jpg',
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p2.jpg',
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p3.jpg',
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p4.jpg',
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p5.jpg',
      '/product-images/contract-scope-reviewer/preview-detailed-risk-review-p6.jpg',
    ],
    keySections: [
      'Executive Summary',
      'Scope Coverage Assessment',
      'Clause-by-Clause Risk Flags',
      'Risk Register Summary Table',
      'Missing Items Checklist',
      'Ambiguity & Contradiction Log',
      'Commercial Risk Observations',
      'Suggested Clarification RFIs',
      'Overall Severity Assessment',
    ],
  },

  'comprehensive-risk-action': {
    slug: 'comprehensive-risk-action',
    displayName: 'Comprehensive Risk & Action Report',
    description:
      'The full-depth analysis: everything in the Detailed Risk Review plus a complete risk register with likelihood × impact scoring, printable pre-contract checklist, prioritised RFI schedule, interface gap analysis, programme feasibility assessment, payment mechanism review, and a structured action plan with owners and deadlines. The definitive pre-contract review document.',
    pageCount: 13,
    layout: 'comprehensive',
    thumbnailPath: '/product-images/contract-scope-reviewer/thumb-comprehensive-risk-action.jpg',
    previewPaths: [
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p1.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p2.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p3.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p4.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p5.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p6.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p7.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p8.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p9.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p10.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p11.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p12.jpg',
      '/product-images/contract-scope-reviewer/preview-comprehensive-risk-action-p13.jpg',
    ],
    keySections: [
      'Executive Summary (500+ Words)',
      'Scope Coverage Matrix',
      'Clause-by-Clause Risk Flags (Extended)',
      'Full Risk Register (Likelihood × Impact)',
      'Missing Items Checklist',
      'Ambiguity & Contradiction Log',
      'Interface Gap Analysis',
      'Commercial & Payment Mechanism Review',
      'Programme Feasibility Assessment',
      'Preliminary Allowances Check',
      'Termination & Liability Review',
      'Printable Pre-Contract Checklist',
      'Prioritised RFI Schedule',
      'Structured Action Plan',
      'Appendix: Methodology & Definitions',
    ],
  },
};

export function getContractScopeTemplateConfig(slug: ContractScopeTemplateSlug): ContractScopeTemplateConfig {
  return CONTRACT_SCOPE_TEMPLATE_CONFIGS[slug];
}

export function isValidContractScopeTemplateSlug(slug: string): slug is ContractScopeTemplateSlug {
  return slug in CONTRACT_SCOPE_TEMPLATE_CONFIGS;
}
