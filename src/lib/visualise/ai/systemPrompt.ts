// =============================================================================
// Visualise — AI System Prompt Builder
// Produces the full system prompt with the preset catalogue and palette
// descriptions injected at call time. Presets are described via their
// aiDescription field and a JSON example derived from defaultData, keeping the
// prompt content-agnostic and always in sync with the registry.
//
// Note (Batch 9): the previously-exported `wrapUserText` helper was removed
// because the generate route wraps user text via `wrapDescription` from
// `src/lib/ai-tools/sanitise-input.ts`, which already includes the
// <user_work_description>-tagged anti-injection boilerplate. Double-wrapping
// would have corrupted the prompt.
// =============================================================================

import { getAllPresets, type AnyPreset } from '@/lib/visualise/presets';
import { PALETTE_IDS, PALETTE_AI_HINTS } from '@/lib/visualise/palettes';
import { VISUALISE_MAX_VISUALS_PER_GENERATION } from '@/lib/visualise/constants';

interface BuildSystemPromptOptions {
  /** Force the AI to use only this preset. If set, the catalogue section is trimmed to this preset only. */
  forcePresetId?: string;
  /** Request exactly this many visuals back. If omitted, AI picks 1–3 based on the text. */
  visualCount?: 1 | 2 | 3;
  /**
   * When regenerating a single visual, pass the current preset ID so the
   * prompt tells the AI to prefer a different one. Implies visualCount=1.
   */
  regenerateFrom?: string;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions = {}): string {
  const { forcePresetId, visualCount, regenerateFrom } = options;

  const catalogue = buildPresetCatalogue(forcePresetId);
  const palettes = buildPaletteList();

  const constraints: string[] = [];
  if (forcePresetId) {
    constraints.push(
      `CONSTRAINT: The user has pinned preset "${forcePresetId}". Use ONLY that preset for every returned visual. Do not pick any other preset.`,
    );
  }
  if (visualCount) {
    constraints.push(`CONSTRAINT: Return exactly ${visualCount} visual${visualCount === 1 ? '' : 's'}.`);
  } else {
    constraints.push(
      `CONSTRAINT: Return between 1 and ${VISUALISE_MAX_VISUALS_PER_GENERATION} visuals. Pick the count that best matches the concepts in the text — do not pad or duplicate.`,
    );
  }
  if (regenerateFrom) {
    constraints.push(
      `CONSTRAINT: You are regenerating a single visual. The previous preset was "${regenerateFrom}". Strongly prefer a DIFFERENT preset this time — either a different preset in the same family (if it fits) or a preset from a different family that still captures the concept. Only reuse "${regenerateFrom}" if no alternative is appropriate. Return exactly 1 visual.`,
    );
  }

  const conceptCountPhrase = visualCount
    ? `exactly ${visualCount} distinct concept${visualCount === 1 ? '' : 's'}`
    : regenerateFrom
      ? '1 distinct concept'
      : '1 to 3 distinct concepts';

  return `You are Visualise, an AI that turns short UK-construction-industry text into visual diagrams.

Your job:
1. Read the user text enclosed in <user_work_description> tags.
2. Identify ${conceptCountPhrase} from the text that benefit most from visualisation.
3. For each concept, pick the best preset from the PRESETS catalogue below.
4. Populate that preset's data with concrete labels, numbers, and nodes drawn from the user's text.
5. Pick a palette that suits the content.
6. Return a single JSON object matching the RESPONSE SCHEMA exactly.

RULES:
- Never invent facts, numbers, dates, or names the user did not provide or clearly imply. If the text has no numbers, do not pick a chart preset — pick a diagram.
- Prefer construction-specific presets (IDs starting "con-") when the text mentions CDM, RAMS, NEC, permits, CSCS, site roles, H&S hierarchy, risk matrices, or similar regulated domains.
- Visual titles: 3 to 8 words. Never repeat the document title.
- Node labels: 40 characters maximum.
- Use British spelling (e.g. "colour", "organise", "visualise").
- Output valid JSON only. No markdown, no code fences, no commentary.

${constraints.join('\n')}

RESPONSE SCHEMA:
{
  "document_title": "3 to 10 word title summarising the whole document",
  "visuals": [
    {
      "preset_id": "<exact ID from the PRESETS catalogue>",
      "title": "<3 to 8 words>",
      "palette_id": "<one of: ${PALETTE_IDS.join(' | ')}>",
      "data": { /* preset-specific shape — match the example in the catalogue */ }
    }
  ]
}

PALETTES:
${palettes}

PRESETS:
${catalogue}
`;
}

/**
 * Build the preset catalogue string.
 * If forcePresetId is set, only that preset is included (plus an error fallback if ID is unknown).
 */
function buildPresetCatalogue(forcePresetId?: string): string {
  const all = getAllPresets();
  const presets = forcePresetId
    ? all.filter((p) => p.id === forcePresetId)
    : all;

  if (presets.length === 0) {
    // Forced preset not in catalogue — fall back to full list so AI can still respond.
    return all.map(describePresetForAi).join('\n\n');
  }

  return presets.map(describePresetForAi).join('\n\n');
}

function describePresetForAi(preset: AnyPreset): string {
  const example = JSON.stringify(preset.defaultData);
  return `- id: ${preset.id}
  name: ${preset.name}
  category: ${preset.category}
  when to use: ${preset.aiDescription}
  data example: ${example}`;
}

function buildPaletteList(): string {
  return PALETTE_IDS.map((id) => `- ${id}: ${PALETTE_AI_HINTS[id]}`).join('\n');
}
