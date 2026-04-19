// =============================================================================
// Visualise — AI-Driven Clarify Question Generator (Batch CQ)
//
// Replaces the rule-based decide() for actual question CONTENT with an AI
// call that reads the user's text + prior answers + a compressed preset
// catalogue, and returns either:
//   { action: 'generate' }                         — proceed to /generate
//   { action: 'ask', question: { ... } }           — ask this tailored question
//
// The AI's job is to look at what the user actually wrote and ask the single
// most decisive question — not a canned "which family?" when the text
// obviously says "cycle". Questions are chip-based whenever possible (faster
// for mobile users) with a free-text escape for genuinely open-ended data
// extraction.
//
// Fallback: if the AI call fails, times out, or returns invalid JSON, we
// fall back to rule-based decide() so the flow keeps working. The AI is
// an enhancement, not a hard dependency.
//
// Latency note: each call is ~1-2s. We cap total clarify latency by the
// hard CLARIFY_MAX_ROUNDS (3 rounds × 1-2s each = 3-6s max). Acceptable
// trade for tailored questions; users who want speed can hit "Generate
// anyway" at any round.
// =============================================================================

import OpenAI from 'openai';
import type {
  ClarifyAnswer,
  ClarifyQuestion,
  ClarifyTopic,
} from './types';
import { CLARIFY_MAX_ANSWER_WORDS } from './types';
import { getAllPresets, getPresetById } from '../../presets';
import { getCapacity, describeCapacityForAi } from '../../presets/capacity';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AiQuestionResult {
  nextQuestion?: ClarifyQuestion;
  done: boolean;
  round?: number;
}

/**
 * Build a compressed catalogue string for the AI — just preset IDs + one-line
 * descriptions, grouped by family. Full catalogue (with schemas + thumbnails)
 * is far too large for a clarify-round prompt.
 */
function buildCompressedCatalogue(): string {
  const presets = getAllPresets();
  const byFamily = new Map<string, Array<{ id: string; name: string; description: string }>>();
  for (const p of presets) {
    if (!byFamily.has(p.category)) byFamily.set(p.category, []);
    byFamily.get(p.category)!.push({ id: p.id, name: p.name, description: p.description });
  }
  const lines: string[] = [];
  for (const [family, list] of byFamily) {
    lines.push(`\n  ${family.toUpperCase()}:`);
    for (const p of list) {
      lines.push(`    - ${p.id}: ${p.description}`);
    }
  }
  return lines.join('\n');
}

/**
 * Format prior answers as a concise summary for the system prompt. Used so
 * the AI knows what the user has already told us and doesn't ask again.
 */
function summarisePriorAnswers(answers: ClarifyAnswer[]): string {
  if (answers.length === 0) return '(none — this is the first round)';
  return answers
    .map((a) => `  - ${a.topic}: ${a.value === 'unknown' ? '(user said not sure)' : a.value}`)
    .join('\n');
}

/**
 * Call the AI to decide what to ask next. Returns `done: true` if no useful
 * question remains, or a tailored ClarifyQuestion. Throws on hard failure
 * (network, API key, etc.) — caller is expected to fall back to decide().
 *
 * Batch 4b-a — accepts optional forcePresetId. When set, the AI is told the
 * preset is already locked and is instructed to skip family/preset topics,
 * ask item-count for flexible presets, and ask targeted data questions for
 * thin text. The rule-based decide() fallback mirrors this behaviour.
 */
export async function generateQuestion(
  text: string,
  priorAnswers: ClarifyAnswer[],
  forcePresetId?: string,
): Promise<AiQuestionResult> {
  const round = priorAnswers.length;
  const catalogue = buildCompressedCatalogue();
  const priorSummary = summarisePriorAnswers(priorAnswers);

  // Batch 4b-a — when a preset is locked, compute its context block for the
  // system prompt. Gives the AI enough detail to ask preset-specific
  // item-count or data questions instead of generic family/preset ones.
  let lockedPresetBlock = '';
  if (forcePresetId) {
    const preset = getPresetById(forcePresetId);
    const cap = getCapacity(forcePresetId);
    if (preset && cap) {
      const flexible = cap.primary.min < cap.primary.max;
      lockedPresetBlock = `\n\nLOCKED PRESET (user has already picked this):
  id: ${preset.id}
  name: ${preset.name}
  capacity: ${describeCapacityForAi(preset.id)}
  flexible-count: ${flexible ? 'yes — you MAY ask item-count if the source text is ambiguous about count' : 'no — do NOT ask about count'}
  description: ${preset.description}
When a preset is locked:
  - DO NOT ask "family" or "preset" — that decision is made.
  - If flexible-count is yes AND the text doesn't make the count obvious, emit { action: "ask", question: { topic: "item-count", prompt: "...", chips: [{"value": "3", "label": "3"}, ...] } } with chips covering the preset's capacity range (and a "Not sure" chip with value "unknown").
  - If the preset has named slots the text doesn't fill (e.g. swimlane lane names, SIPOC process name, venn set names, quadrant axes), emit { action: "ask", question: { topic: "data", prompt: "...", placeholder: "..." } }.
  - Otherwise return { action: "generate" } immediately.`;
    }
  }

  const systemPrompt = `You are Visualise's clarifying-question generator for a UK construction industry SaaS.

Your job: read the user's pasted text + any prior answers, and decide what ONE question (if any) would most help Visualise pick the right preset for their content.

You must return a single JSON object matching this schema exactly:
  { "action": "generate" }
OR
  { "action": "ask", "question": { "prompt": string, "topic": string, "chips": [{"value": string, "label": string}] } }
OR
  { "action": "ask", "question": { "prompt": string, "topic": string, "placeholder": string } }

Rules:
1. Only ask if the answer would genuinely change which preset is picked OR how many items it holds. If the text is already clear, return { "action": "generate" } immediately. Signs of clarity: explicit family name (e.g. "PDCA cycle"), explicit count (e.g. "5 steps"), a known framework name (SWOT, BCG, RACI, fishbone).
2. The question topic must be one of: "family", "preset", "count", "item-count", "palette", "data".
3. Prefer chip-based questions (4-11 chips). Include a "Not sure" chip with value "unknown". Only use free-text (placeholder instead of chips) for the "data" topic when a preset has already been picked AND needs specific structured input (e.g. axis labels for a quadrant, lane names for a swimlane, set names for a venn).
4. Make questions SPECIFIC to the user's text — reference their actual domain ("your RAMS approval process" not "your process"). Generic questions waste the user's time.
5. If the user has already answered family/preset/count/item-count, do NOT ask those again. Check the prior answers below.
6. For data topic free-text answers, the user is capped at ${CLARIFY_MAX_ANSWER_WORDS} words. Keep the question tight.
7. Hard cap: max 3 rounds total. Current round: ${round + 1} of 3. If this is round 3 and you'd still want to ask, return generate instead — the user has done enough.

Available preset catalogue (grouped by family):
${catalogue}${lockedPresetBlock}

The user's pasted text, prior answers, and the current round are in the user message.`;

  const userMessage = `USER TEXT:
"""
${text.slice(0, 4000)}
"""

PRIOR ANSWERS:
${priorSummary}

Return one of the two schemas above. JSON only — no markdown, no code fences.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('AI returned empty response');

  const parsed = JSON.parse(raw);

  if (parsed.action === 'generate') {
    return { done: true, round };
  }

  if (parsed.action !== 'ask' || !parsed.question || typeof parsed.question !== 'object') {
    throw new Error(`AI returned invalid action: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  const q = parsed.question;
  const validTopics: ClarifyTopic[] = ['family', 'preset', 'count', 'item-count', 'palette', 'data'];
  if (typeof q.topic !== 'string' || !validTopics.includes(q.topic as ClarifyTopic)) {
    throw new Error(`AI returned invalid topic: ${q.topic}`);
  }
  if (typeof q.prompt !== 'string' || q.prompt.length === 0 || q.prompt.length > 400) {
    throw new Error('AI returned invalid question prompt');
  }

  // Chip-based question
  if (Array.isArray(q.chips)) {
    if (q.chips.length < 2 || q.chips.length > 13) {
      throw new Error(`AI returned invalid chip count: ${q.chips.length}`);
    }
    const chips = q.chips
      .filter(
        (c: unknown): c is { value: string; label: string } =>
          !!c &&
          typeof c === 'object' &&
          typeof (c as { value?: unknown }).value === 'string' &&
          typeof (c as { label?: unknown }).label === 'string',
      )
      .map((c) => ({ value: c.value.slice(0, 60), label: c.label.slice(0, 50) }));
    if (chips.length < 2) throw new Error('AI returned too few valid chips');

    const question: ClarifyQuestion = {
      topic: q.topic as ClarifyTopic,
      prompt: q.prompt,
      chips,
      round,
    };
    return { nextQuestion: question, done: false, round };
  }

  // Free-text question (only valid for data topic)
  if (q.topic === 'data' && typeof q.placeholder === 'string') {
    const question: ClarifyQuestion = {
      topic: 'data',
      prompt: q.prompt,
      placeholder: q.placeholder.slice(0, 120),
      round,
    };
    return { nextQuestion: question, done: false, round };
  }

  throw new Error('AI returned question without chips and not a valid data topic');
}
