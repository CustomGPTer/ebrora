// =============================================================================
// Contract Scope Risk Reviewer — Types
// 3 templates: quick-risk-summary, detailed-risk-review, comprehensive-risk-action
// =============================================================================

export type ContractScopeTemplateSlug =
  | 'quick-risk-summary'
  | 'detailed-risk-review'
  | 'comprehensive-risk-action';

export interface ContractScopeTemplateConfig {
  slug: ContractScopeTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'quick' | 'detailed' | 'comprehensive';
}

/** Ordered list of template slugs for display in picker */
export const CONTRACT_SCOPE_TEMPLATE_ORDER: ContractScopeTemplateSlug[] = [
  'quick-risk-summary',
  'detailed-risk-review',
  'comprehensive-risk-action',
];

/** Free-tier templates — first 1 free */
export const CONTRACT_SCOPE_FREE_TEMPLATES: ContractScopeTemplateSlug[] = [
  'quick-risk-summary',
];

// ── Contract Family ──────────────────────────────────────────────────────────
export type ContractFamily = 'NEC' | 'JCT';

// ── NEC Types ────────────────────────────────────────────────────────────────
export type NecContractType =
  | 'NEC4-ECC'    // Engineering and Construction Contract
  | 'NEC4-ECSC'   // Engineering and Construction Short Contract
  | 'NEC4-ECS'    // Engineering and Construction Subcontract
  | 'NEC4-ECSS'   // Engineering and Construction Short Subcontract
  | 'NEC4-PSC'    // Professional Services Contract
  | 'NEC4-PSSC'   // Professional Services Short Contract
  | 'NEC4-TSC'    // Term Service Contract
  | 'NEC4-TSSC'   // Term Service Short Contract
  | 'NEC4-SC'     // Supply Contract
  | 'NEC4-SSC'    // Supply Short Contract
  | 'NEC4-FC'     // Framework Contract
  | 'NEC3-ECC'    // Legacy NEC3 ECC
  | 'NEC3-ECSC'   // Legacy NEC3 ECSC
  | 'NEC3-ECS';   // Legacy NEC3 ECS

export type NecMainOption =
  | 'A'  // Priced contract with activity schedule
  | 'B'  // Priced contract with bill of quantities
  | 'C'  // Target contract with activity schedule
  | 'D'  // Target contract with bill of quantities
  | 'E'  // Cost reimbursable contract
  | 'F'; // Management contract

// ── JCT Types ────────────────────────────────────────────────────────────────
export type JctContractType =
  | 'JCT-SBC'     // Standard Building Contract
  | 'JCT-SBC-Q'   // Standard Building Contract with Quantities
  | 'JCT-SBC-AQ'  // Standard Building Contract without Quantities
  | 'JCT-SBC-XQ'  // Standard Building Contract with Approximate Quantities
  | 'JCT-IC'      // Intermediate Building Contract
  | 'JCT-ICD'     // Intermediate Building Contract with Contractor's Design
  | 'JCT-MW'      // Minor Works Building Contract
  | 'JCT-MWD'     // Minor Works Building Contract with Contractor's Design
  | 'JCT-DB'      // Design and Build Contract
  | 'JCT-MC'      // Management Building Contract
  | 'JCT-CM'      // Construction Management Agreement
  | 'JCT-MTC'     // Measured Term Contract
  | 'JCT-PCC'     // Pre-Construction Services Agreement
  | 'JCT-HBR'     // Home Owner / Occupier (Repair)
  | 'JCT-HBN';    // Home Owner / Occupier (New Build)

export type JctVariant =
  | 'with-cdp'         // With Contractor's Design Portion
  | 'without-cdp'      // Without Contractor's Design Portion
  | 'local-authorities' // Local Authorities edition
  | 'sub-design'       // Sub-Contract with Design
  | 'sub-no-design'    // Sub-Contract without Design
  | 'standard';        // Standard (no variant)

// ── Review Context ───────────────────────────────────────────────────────────
export type ReviewContext =
  | 'pre-tender'   // Writing your own scope
  | 'pre-submit'   // Reviewing before you bid
  | 'pre-award'    // Reviewing before you accept/sign
  | 'post-award';  // Checking what you've committed to

// ── User Role ────────────────────────────────────────────────────────────────
export type UserRole =
  | 'contractor'
  | 'subcontractor'
  | 'client-employer'
  | 'pm-supervisor';

// ── Sector ───────────────────────────────────────────────────────────────────
export type Sector =
  | 'water'
  | 'highways'
  | 'rail'
  | 'building'
  | 'energy'
  | 'marine'
  | 'defence'
  | 'telecoms'
  | 'other';

// ── Wizard State ─────────────────────────────────────────────────────────────
export interface ContractScopeWizardState {
  // Step 1: Template
  templateSlug: ContractScopeTemplateSlug;

  // Step 2: Contract type
  contractFamily: ContractFamily;
  necContractType?: NecContractType;
  necMainOption?: NecMainOption;
  jctContractType?: JctContractType;
  jctVariant?: JctVariant;

  // Step 3: Context
  reviewContext: ReviewContext;
  userRole: UserRole;
  sector: Sector;
  estimatedValue?: string;      // e.g. "£2.5m" — free text
  programmeDuration?: string;   // e.g. "18 months" — free text
}

// ── Dynamic Questions (returned by AI after reading document) ────────────────
export interface DynamicQuestion {
  id: string;
  question: string;
  options: string[];  // 3-5 dropdown options
}

// ── Phase 1 Response (AI returns questions) ──────────────────────────────────
export interface Phase1Response {
  questions: DynamicQuestion[];
  documentSummary: string; // Brief summary of what was uploaded
}
