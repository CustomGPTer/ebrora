// =============================================================================
// AI Tools — Shared Type Definitions
// All 35 AI tools share these types.
// RAMS Builder remains untouched — its own types stay in /lib/rams/types.ts
// =============================================================================

/** Tool category — drives homepage grid tabs and account dashboard grouping */
export type AiToolCategory =
  | 'Health & Safety'
  | 'Quality'
  | 'Commercial'
  | 'Programme';

/** All 35 AI tool slugs (excludes RAMS which has its own system) */
export type AiToolSlug =
  // ── Existing 16 ──────────────────────────────────────────────────────────
  | 'coshh'
  | 'itp'
  | 'manual-handling'
  | 'dse'
  | 'tbt-generator'
  | 'confined-spaces'
  | 'incident-report'
  | 'lift-plan'
  | 'emergency-response'
  | 'quality-checklist'
  | 'scope-of-works'
  | 'permit-to-dig'
  | 'powra'
  | 'early-warning'
  | 'ncr'
  | 'ce-notification'
  // ── New 13 ───────────────────────────────────────────────────────────────
  | 'programme-checker'
  | 'cdm-checker'
  | 'noise-assessment'
  | 'quote-generator'
  | 'safety-alert'
  | 'carbon-footprint'
  | 'rams-review'
  | 'delay-notification'
  | 'variation-confirmation'
  | 'rfi-generator'
  | 'payment-application'
  | 'daywork-sheet'
  | 'carbon-reduction-plan'
  // ── Batch 1 — Mandated tools ─────────────────────────────────────────────
  | 'wah-assessment'
  | 'wbv-assessment'
  | 'riddor-report'
  // ── Batch 2 — Environmental & Transport ──────────────────────────────────
  | 'traffic-management'
  | 'waste-management'
  | 'invasive-species';

/** Metadata for each AI tool */
export interface AiToolConfig {
  slug: AiToolSlug;
  name: string;
  shortName: string;
  description: string;
  route: string;
  pageTitle: string;
  metaDescription: string;
  /** Category for grid filtering and dashboard grouping */
  category: AiToolCategory;
  /** What the generated document is called, e.g. "COSHH Assessment" */
  documentLabel: string;
  /** Placeholder text for the work description textarea */
  descriptionPlaceholder: string;
  /** Heading shown above the description field */
  descriptionHeading: string;
  /** Hint text shown below the heading */
  descriptionHint: string;
  /** Example description shown as helper text */
  descriptionExample: string;
  /** Key sections that appear in the generated document */
  keySections: string[];
  /** Colour accent for UI (hex without #) */
  accentColor: string;
  /** Icon name for consistent iconography */
  iconType:
    | 'shield' | 'clipboard' | 'search' | 'chat' | 'alert' | 'eye'
    | 'lock' | 'warning' | 'crane' | 'siren' | 'check' | 'file'
    | 'shovel' | 'hardhat' | 'bell' | 'x-circle' | 'pound'
    // New icons for the 13 new tools
    | 'calendar' | 'leaf' | 'noise' | 'letter' | 'clock'
    | 'question-circle' | 'invoice' | 'timesheet' | 'carbon';
  /** Output file format — defaults to 'docx' if not set */
  outputFormat?: 'docx' | 'xlsx';
  /**
   * Whether this tool requires a file upload instead of a text description.
   * Upload tools (programme-checker, rams-review) use AiUploadToolClient
   * instead of AiToolBuilderClient.
   */
  requiresUpload?: boolean;
  /**
   * Accepted upload file formats for upload tools.
   * E.g. ['pdf', 'xlsx', 'xer'] or ['pdf', 'docx', 'xlsx']
   */
  uploadFormats?: string[];
  /**
   * Upload instructions shown on the upload tool page.
   */
  uploadInstructions?: string;
  /**
   * Whether this tool uses the new premium docx template (true for all 13 new tools).
   * Existing 16 tools use the original template style.
   */
  premiumTemplate?: boolean;
  /** Maximum words allowed in the description textarea */
  maxWords?: number;
  /** Minimum words required in the description textarea */
  minWords?: number;
  /** Number of rows for the description textarea */
  textareaRows?: number;
  /** Warning text shown when description is below minimum words. Use {min} as placeholder. */
  warningText?: string;
}

/** A single AI-generated question (same shape as RAMS) */
export interface AiToolQuestion {
  id: string;
  question: string;
  context?: string;
}

/** A single answered question */
export interface AiToolAnswer {
  id: string;
  question: string;
  answer: string;
}

/** A single conversation round */
export interface AiToolConversationRound {
  roundNumber: number;
  questions: AiToolQuestion[];
  answers: AiToolAnswer[];
}

/** Request body for /api/ai-tools/chat */
export interface AiToolChatRequest {
  toolSlug: AiToolSlug;
  description: string;
  rounds: AiToolConversationRound[];
  crpTemplateSlug?: string;
  carbonFootprintTemplateSlug?: string;
  dayworkSheetTemplateSlug?: string;
  ncrTemplateSlug?: string;
  safetyAlertTemplateSlug?: string;
}

/** Response from /api/ai-tools/chat */
export interface AiToolChatResponse {
  status: 'more_questions' | 'ready';
  questions?: AiToolQuestion[];
  roundNumber: number;
  totalQuestionsAsked: number;
  generationId?: string;
  message?: string;
}

/** Request body for /api/ai-tools/generate */
export interface AiToolGenerateRequest {
  generationId: string;
  answers: { number: number; question: string; answer: string }[];
  description: string;
}

/** Builder step for the shared UI flow */
export type AiToolBuilderStep = 'describe-work' | 'conversation' | 'generating' | 'download';

/** Full conversation state for client */
export interface AiToolConversationState {
  toolSlug: AiToolSlug;
  description: string;
  rounds: AiToolConversationRound[];
  isComplete: boolean;
  totalQuestionsAsked: number;
}

/** Upload tool state (for programme-checker and rams-review) */
export interface AiUploadToolState {
  toolSlug: AiToolSlug;
  fileName: string;
  fileType: string;
  parsedContent: string;
  analysisComplete: boolean;
}
