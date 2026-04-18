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
//
// AMENDMENT (Batch 10 — "Variants & Sub-text"):
//   New `variantMode` option switches the response schema instructions and
//   adds a "pick structurally different presets for the same concept" rule.
//   Also adds:
//     - per-concept caption (1–3 sentences, ~200 chars)
//     - per-node descriptions list (~120 chars each)
//     - sequence-first rule (if the text is an ordered list, all variants
//       must handle sequential data — filters PDCA/RACI out automatically)
//     - 1 unconventional alternate rule (variant #3 may be a less-obvious
//       but still valid structural fit, for variety)
// =============================================================================

import { getAllPresets, type AnyPreset } from '@/lib/visualise/presets';
import { PALETTE_IDS, PALETTE_AI_HINTS } from '@/lib/visualise/palettes';
import { VISUALISE_MAX_VISUALS_PER_GENERATION } from '@/lib/visualise/constants';
import {
  VISUALISE_CAPTION_MAX_CHARS,
  VISUALISE_NODE_DESC_MAX_CHARS,
  VISUALISE_NODE_DESC_MAX_COUNT,
} from './validateResponse';

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
  /**
   * Batch 10: when true, each returned concept must include 3 preset variants
   * picked to show the same concept in structurally different ways.
   * Mutually exclusive with regenerateFrom (regenerate is always legacy shape).
   */
  variantMode?: boolean;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions = {}): string {
  const { forcePresetId, visualCount, regenerateFrom, variantMode } = options;

  const catalogue = buildPresetCatalogue(forcePresetId);
  const palettes = buildPaletteList();

  // Variant mode gets a totally different schema + rule set. Handle it first
  // so the legacy branch below stays unchanged for regenerate-path callers.
  if (variantMode) {
    return buildVariantModePrompt(catalogue, palettes, visualCount, forcePresetId);
  }

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
5. Write a concise caption (1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars) summarising what the visual shows.
6. Write a description for each primary node (max ${VISUALISE_NODE_DESC_MAX_CHARS} chars per description, up to ${VISUALISE_NODE_DESC_MAX_COUNT} descriptions). Descriptions should expand on each node label with context from the user's text.
7. Pick a palette that suits the content.
8. Return a single JSON object matching the RESPONSE SCHEMA exactly.

RULES:
- Never invent facts, numbers, dates, or names the user did not provide or clearly imply. If the text has no numbers, do not pick a chart preset — pick a diagram.
- Prefer construction-specific presets (IDs starting "con-") when the text mentions CDM, RAMS, NEC, permits, CSCS, site roles, H&S hierarchy, risk matrices, or similar regulated domains.
- Respect each preset's "Do NOT use for" guidance strictly. If the text doesn't match a preset's intended use, pick a different preset.
- Visual titles: 3 to 8 words. Never repeat the document title.
- Node labels: 40 characters maximum.
- Captions: 1–3 sentences, up to ${VISUALISE_CAPTION_MAX_CHARS} characters. Neutral, descriptive — not promotional.
- Node descriptions: one per primary node, order matches the node order in data, up to ${VISUALISE_NODE_DESC_MAX_CHARS} chars each.
- Avoid duplication: when you populate \`node_descriptions\`, LEAVE INTERNAL description fields inside \`data\` EMPTY. If a preset's schema has per-node fields called \`detail\`, \`description\`, \`subtext\`, \`sublabel\`, \`caption\`, or similar, omit them or set them to empty strings. The top-level \`node_descriptions\` is the single source of truth.
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
      "data": { /* preset-specific shape — match the example in the catalogue */ },
      "caption": "<1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars — optional but recommended>",
      "node_descriptions": ["<max ${VISUALISE_NODE_DESC_MAX_CHARS} chars>", "..."]
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
 * Variant-mode prompt. Each concept must return UP TO 3 preset variants
 * that visualise the same concept in structurally different ways. The
 * response shape differs from legacy mode — it omits `preset_id` at the
 * concept level and instead has a `variants` array.
 */
function buildVariantModePrompt(
  catalogue: string,
  palettes: string,
  visualCount: 1 | 2 | 3 | undefined,
  forcePresetId: string | undefined,
): string {
  const conceptCountPhrase = visualCount
    ? `exactly ${visualCount} distinct concept${visualCount === 1 ? '' : 's'}`
    : '1 to 3 distinct concepts';

  const constraints: string[] = [];
  if (forcePresetId) {
    // In variant mode, a forced preset would collapse all 3 variants into the
    // same preset, defeating the feature. We allow it but warn the model.
    constraints.push(
      `CONSTRAINT: The user has pinned preset "${forcePresetId}" as the FIRST variant. The 2nd and 3rd variants should still be different, structurally-complementary presets from the catalogue.`,
    );
  }

  return `You are Visualise, an AI that turns short UK-construction-industry text into visual diagrams.

You are operating in VARIANT MODE. For each concept identified in the user text, you must return UP TO 3 preset variants — different presets that visualise the same concept in structurally different ways. The user will see the first variant as the active preview and can instantly swap to the other two.

Your job:
1. Read the user text enclosed in <user_work_description> tags.
2. Identify ${conceptCountPhrase} from the text that benefit most from visualisation.
3. For EACH concept, pick up to 3 structurally different presets that all fit the concept's data shape.
4. Populate each variant's data with concrete labels, numbers, and nodes drawn from the user's text. The SAME semantic data should appear in every variant — only the visual style changes.
5. Write ONE caption per concept (1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars) summarising what the visual shows. Captions are concept-level, not variant-level — they apply equally regardless of which preset the user picks.
6. Write ONE list of node descriptions per concept (max ${VISUALISE_NODE_DESC_MAX_CHARS} chars each, up to ${VISUALISE_NODE_DESC_MAX_COUNT} items). Descriptions are concept-level too — they survive variant swaps.
7. Pick ONE palette per concept.
8. Return a single JSON object matching the RESPONSE SCHEMA exactly.

VARIANT SELECTION RULES:
- The 3 variants MUST be structurally different families (do NOT return 3 flow presets; return e.g. flow + timeline + process-stages).
- Variants 1 and 2: pick the two most obvious structural fits for the concept.
- Variant 3: pick ONE unconventional but still valid fit (a preset from a different family that still captures the concept). This gives the user a creative alternative they might not have considered. If no unconventional fit exists, return only 2 variants.
- If fewer than 3 presets genuinely fit, return 2 or even 1 variant. Never pad with poor fits.
- Every variant's data MUST validate against its preset's own schema. If a preset requires exactly N items, make sure your data has exactly N items.

SEQUENCE-FIRST RULE:
- If the user text is an ORDERED LIST or SEQUENCE of steps (e.g. "1. do X, 2. do Y, 3. do Z" or prose describing a chronological process), EVERY variant MUST be a preset that handles sequential data. Valid families for sequences: flow-linear-*, process-numbered-*, process-stages-*, timeline-horizontal-*, timeline-vertical-*, process-circular-* (when the steps genuinely repeat).
- For sequences, NEVER pick PDCA unless the text is explicitly about Plan-Do-Check-Act continuous improvement. NEVER pick RACI unless the text explicitly assigns roles. NEVER pick DMAIC unless the text is explicitly about Six Sigma. NEVER pick SWOT / BCG / fishbone for a sequence.

CAPTION AND DESCRIPTION RULES:
- Captions: 1–3 sentences, up to ${VISUALISE_CAPTION_MAX_CHARS} characters. Neutral, descriptive — not promotional. Written in plain British English, present tense. State what the visual shows and why it matters to the user's work.
- Node descriptions: ONE per primary node, in the same order the data lists them. Each up to ${VISUALISE_NODE_DESC_MAX_CHARS} chars. Expand on the node label with context from the user's text — don't just restate the label. The number of descriptions should match the number of primary nodes (steps / events / rows / wedges) in variant 1; the same list is reused across variants so it must be variant-agnostic.
- Avoid duplication: when you populate \`node_descriptions\` at the concept level, LEAVE INTERNAL description fields inside each variant's \`data\` EMPTY. Specifically, if a preset's schema has per-node fields called \`detail\`, \`description\`, \`subtext\`, \`sublabel\`, \`caption\`, or similar, omit them or set them to empty strings. The concept-level \`node_descriptions\` is the single source of truth — the UI renders it below the visual. Keeping internal fields empty avoids showing the same text twice. (Labels, titles, headers, and any field that is NOT a per-node description should still be populated normally.)

GENERAL RULES:
- Never invent facts, numbers, dates, or names the user did not provide or clearly imply. If the text has no numbers, do not pick a chart preset — pick a diagram.
- Prefer construction-specific presets (IDs starting "con-") when the text mentions CDM, RAMS, NEC, permits, CSCS, site roles, H&S hierarchy, risk matrices, or similar regulated domains.
- Respect each preset's "Do NOT use for" guidance strictly. If the text doesn't match a preset's intended use, pick a different preset.
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
      "title": "<3 to 8 words — concept-level title>",
      "palette_id": "<one of: ${PALETTE_IDS.join(' | ')}>",
      "caption": "<1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars>",
      "node_descriptions": ["<max ${VISUALISE_NODE_DESC_MAX_CHARS} chars>", "..."],
      "variants": [
        {
          "preset_id": "<exact ID from the PRESETS catalogue>",
          "data": { /* preset-specific shape — match the example in the catalogue */ },
          "title": "<optional per-variant title override; omit to reuse the concept title>"
        },
        { "preset_id": "...", "data": { ... } },
        { "preset_id": "...", "data": { ... } }
      ]
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
