import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

/**
 * Gets or creates a singleton OpenAI client instance.
 * Uses the OPENAI_API_KEY environment variable.
 * @returns Initialized OpenAI client
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}
