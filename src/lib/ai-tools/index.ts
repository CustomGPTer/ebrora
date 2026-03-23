// =============================================================================
// AI Tools — Public API
// =============================================================================
export type {
  AiToolSlug,
  AiToolConfig,
  AiToolQuestion,
  AiToolAnswer,
  AiToolConversationRound,
  AiToolChatRequest,
  AiToolChatResponse,
  AiToolGenerateRequest,
  AiToolBuilderStep,
  AiToolConversationState,
} from './types';

export {
  AI_TOOL_CONFIGS,
  AI_TOOL_ORDER,
  getAiToolConfig,
  isValidAiToolSlug,
  getToolSlugFromRoute,
} from './tool-config';

export {
  AI_TOOL_LIMITS,
  getAiToolLimitByTier,
  MAX_TOTAL_QUESTIONS,
  MAX_ROUNDS,
  MAX_ANSWER_WORDS,
  MAX_ANSWERS_PER_ROUND,
  COOLDOWN_MS,
  EXPIRY_THRESHOLD_MS,
  MAX_DESCRIPTION_WORDS,
  MIN_DESCRIPTION_WORDS,
} from './constants';

export {
  getAiToolUsage,
  incrementAiToolUsage,
  checkAiToolUsageLimit,
  getAllAiToolUsage,
} from './usage-tracker';
