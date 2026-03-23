// =============================================================================
// AI Tools — Shared Type Definitions
// All 7 AI tools (COSHH, ITP, Manual Handling, DSE, Drawing Checker,
// TBT Generator, Confined Spaces) share these types.
// RAMS Builder remains untouched — its own types stay in /lib/rams/types.ts
// =============================================================================

/** The 7 AI tool slugs (excludes RAMS which has its own system) */
export type AiToolSlug =
  | 'coshh'
  | 'itp'
  | 'manual-handling'
  | 'dse'
  | 'drawing-checker'
  | 'tbt-generator'
  | 'confined-spaces';

/** Metadata for each AI tool */
export interface AiToolConfig {
  slug: AiToolSlug;
  name: string;
  shortName: string;
  description: string;
  route: string;
  pageTitle: string;
  metaDescription: string;
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
  iconType: 'shield' | 'clipboard' | 'search' | 'chat' | 'alert' | 'eye' | 'lock';
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
