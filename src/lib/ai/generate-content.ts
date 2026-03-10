import { getOpenAIClient } from './openai-client';
import { getSystemPrompt } from './system-prompts';
import { validateGeneratedContent } from './content-validator';
import type { GeneratedContent } from '@/lib/docgen/types';

/**
 * Constructs a user prompt from the user's answers to the 20 questions.
 */
function constructUserPrompt(answers: Record<string, string>): string {
  const {
    q1,
    q2,
    q3,
    q4,
    q5,
    q6,
    q7,
    q8,
    q9,
    q10,
    q11,
    q12,
    q13,
    q14,
    q15,
    q16,
    q17,
    q18,
    q19,
    q20,
  } = answers;

  return `Please generate a comprehensive RAMS document for the following construction activity:

ACTIVITY DETAILS:
- Activity/Task: ${q1 || 'Not specified'}
- Activity Category: ${q2 || 'Not specified'}
- Site Name & Address: ${q3 || 'Not specified'}
- Principal Contractor: ${q4 || 'Not specified'}
- Supervisor/Foreman: ${q5 || 'Not specified'}
- Risk Level: ${q6 || 'Medium'}

PROJECT ENVIRONMENT:
- Location and Environment: ${q7 || 'Not specified'}
- Plant and Equipment: ${q8 || 'Not specified'}
- Materials/Substances: ${q9 || 'Not specified'}
- Sequence of Works: ${q10 || 'Not specified'}

REGULATORY AND PRACTICAL:
- Permits Required: ${q11 || 'Not Sure'}
- Existing Controls: ${q12 || 'Not specified'}
- Interfaces with Others: ${q13 || 'Not specified'}
- PPE Requirements: ${q14 || 'Not specified'}
- Training/Competency: ${q15 || 'Not specified'}
- Constraints/Access: ${q16 || 'Not specified'}
- Emergency Procedures: ${q17 || 'Not specified'}
- Duration: ${q18 || 'Not specified'}
- Maximum Operatives: ${q19 || 'Not specified'}
- Additional Information: ${q20 || 'Not specified'}

Please generate a detailed, professional RAMS document that addresses all aspects of this activity, with realistic hazards, controls, and method statement steps appropriate for UK construction practice.`;
}

/**
 * Calls the OpenAI API to generate RAMS content.
 * Uses JSON mode to ensure valid JSON output.
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  retryCount: number = 0
): Promise<GeneratedContent> {
  const maxRetries = 2;

  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    return validateGeneratedContent(parsed);
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(
        `Retry attempt ${retryCount + 1}/${maxRetries} for RAMS generation`
      );
      // Wait a moment before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callOpenAI(systemPrompt, userPrompt, retryCount + 1);
    }

    throw new Error(
      `Failed to generate RAMS content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Main function to generate RAMS content using OpenAI.
 * @param formatSlug - The RAMS format (e.g., 'standard-5x5', 'hml-simple')
 * @param answers - User's answers to the 20 questions
 * @returns Generated RAMS content matching the GeneratedContent interface
 */
export async function generateRamsContent(
  formatSlug: string,
  answers: Record<string, string>
): Promise<GeneratedContent> {
  // Validate inputs
  if (!formatSlug || typeof formatSlug !== 'string') {
    throw new Error('Invalid format slug');
  }

  if (!answers || typeof answers !== 'object') {
    throw new Error('Invalid answers object');
  }

  // Get the system prompt for this format
  const systemPrompt = getSystemPrompt(formatSlug);

  // Construct the user prompt from answers
  const userPrompt = constructUserPrompt(answers);

  // Call OpenAI with timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('RAMS generation timeout (120 seconds)')),
      120000
    )
  );

  const generationPromise = callOpenAI(systemPrompt, userPrompt);

  return Promise.race([generationPromise, timeoutPromise]);
}
