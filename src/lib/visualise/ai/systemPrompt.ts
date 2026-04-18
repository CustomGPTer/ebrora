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
//
// AMENDMENT (Batch 1 bug fix — "Slot overflow + reasoning"):
//   - Each preset entry in the catalogue now includes a `capacity:` line
//     describing its primary slot count and structural archetype (from
//     PRESET_CAPACITY manifest). Tells the AI at selection time whether the
//     preset can physically hold the number of concepts it identified.
//   - Response schema adds a REQUIRED top-level `reasoning` field and an
//     OPTIONAL `concept_counts` array. The AI must describe (1) how many
//     concepts it identified, (2) how many primary items each concept
//     contains, (3) why it picked each preset.
//   - New COUNT-FIRST RULE: model must count concepts + items BEFORE picking
//     presets, and must pick only presets whose capacity accommodates those
//     counts. If no preset fits, the model is instructed to split the concept
//     or pick the nearest compatible stretchier preset — never silently
//     truncate content to fit a too-small preset.
// =============================================================================

import { getAllPresets, type AnyPreset } from '@/lib/visualise/presets';
import { describeCapacityForAi } from '@/lib/visualise/presets/capacity';
import { PALETTE_IDS, PALETTE_AI_HINTS } from '@/lib/visualise/palettes';
import { VISUALISE_MAX_VISUALS_PER_GENERATION } from '@/lib/visualise/constants';
import {
  VISUALISE_CAPTION_MAX_CHARS,
  VISUALISE_NODE_DESC_MAX_CHARS,
  VISUALISE_NODE_DESC_MAX_COUNT,
  VISUALISE_REASONING_MAX_CHARS,
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
  /**
   * Batch CQ: clarification answers from the pre-generate question flow.
   * When present, these become authoritative hints appended to the prompt
   * (the AI must honour them over text-inferred guesses). Each answer is
   * {topic, value} where topic ∈ {family,preset,count,palette,data}.
   */
  clarifyAnswers?: Array<{ topic: string; value: string }>;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions = {}): string {
  const { forcePresetId, visualCount, regenerateFrom, variantMode, clarifyAnswers } = options;

  const catalogue = buildPresetCatalogue(forcePresetId);
  const palettes = buildPaletteList();

  // Variant mode gets a totally different schema + rule set. Handle it first
  // so the legacy branch below stays unchanged for regenerate-path callers.
  if (variantMode) {
    return buildVariantModePrompt(catalogue, palettes, visualCount, forcePresetId, clarifyAnswers);
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

  // Batch CQ: clarify answers become authoritative hints. The AI must honour
  // these even if its own reading of the text would prefer something else.
  const clarifyBlock = buildClarifyConstraintsBlock(clarifyAnswers);
  if (clarifyBlock) constraints.push(clarifyBlock);

  const conceptCountPhrase = visualCount
    ? `exactly ${visualCount} distinct concept${visualCount === 1 ? '' : 's'}`
    : regenerateFrom
      ? '1 distinct concept'
      : '1 to 3 distinct concepts';

  return `You are Visualise, an AI that turns short UK-construction-industry text into visual diagrams.

Your job:
1. Read the user text enclosed in <user_work_description> tags.
2. COUNT the distinct concepts in the text that benefit from visualisation. For each concept, COUNT the number of primary items (steps, events, roles, tiers, branches, etc.) it contains. Write these counts down in your reasoning BEFORE picking presets.
3. Identify ${conceptCountPhrase} from the text.
4. For each concept, pick the best preset from the PRESETS catalogue below whose capacity ACCOMMODATES that concept's item count. The preset's capacity is stated on its "capacity:" line.
5. Populate that preset's data with concrete labels, numbers, and nodes drawn from the user's text.
6. Write a concise caption (1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars) summarising what the visual shows.
7. Write a description for each primary node (max ${VISUALISE_NODE_DESC_MAX_CHARS} chars per description, up to ${VISUALISE_NODE_DESC_MAX_COUNT} descriptions). Descriptions should expand on each node label with context from the user's text.
8. Pick a palette that suits the content.
9. Write top-level \`reasoning\` (max ${VISUALISE_REASONING_MAX_CHARS} chars) explaining: how many concepts you identified, how many primary items each concept has, and why you chose each preset.
10. Return a single JSON object matching the RESPONSE SCHEMA exactly.

CAPACITY RULE (CRITICAL — prevents silent content truncation):
- Every preset in the catalogue below has a "capacity:" line (e.g. "exactly 6 steps", "3–7 tasks", "up to 8 bars").
- You MUST only pick a preset whose capacity can hold ALL the primary items of the concept. If the user's text has 8 sequential steps, you MUST NOT pick a preset with "exactly 6 steps" capacity — you would be forced to drop 2 steps.
- If NO preset accommodates the count, choose the nearest option in this priority order:
    (a) Pick a preset with a flexible range that holds the count (e.g. for 8 sequential items, prefer timeline-horizontal-8event, or chart-bar-vertical, over process-numbered-6step).
    (b) If the user's text genuinely covers two separate ideas, split it into two concepts and return two visuals.
    (c) Only as a last resort, and ONLY after stating this clearly in your \`reasoning\`, may you summarise the concept to fit a smaller preset. Prefer (a) and (b) over (c).
- NEVER silently drop items to fit a preset's schema. If the count exceeds the preset's max, your visual will fail post-generation validation and be discarded.

RULES:
- Never invent facts, numbers, dates, or names the user did not provide or clearly imply. If the text has no numbers, do not pick a chart preset — pick a diagram.
- Prefer construction-specific presets (IDs starting "con-") when the text mentions CDM, RAMS, NEC, permits, CSCS, site roles, H&S hierarchy, risk matrices, or similar regulated domains.
- Respect each preset's "when to use" guidance strictly. If the text doesn't match a preset's intended use, pick a different preset.
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
  "reasoning": "<1–4 sentences explaining: concepts identified, primary item count for each, preset choice rationale. Max ${VISUALISE_REASONING_MAX_CHARS} chars.>",
  "concept_counts": [<integer count of primary items for each concept, in order>],
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
  clarifyAnswers: Array<{ topic: string; value: string }> | undefined,
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

  // Batch CQ: variant mode honours clarify answers the same way as the
  // single-shot branch. Authoritative over AI inference.
  const clarifyBlock = buildClarifyConstraintsBlock(clarifyAnswers);
  if (clarifyBlock) constraints.push(clarifyBlock);

  return `You are Visualise, an AI that turns short UK-construction-industry text into visual diagrams.

You are operating in VARIANT MODE. For each concept identified in the user text, you must return UP TO 3 preset variants — different presets that visualise the same concept in structurally different ways. The user will see the first variant as the active preview and can instantly swap to the other two.

Your job:
1. Read the user text enclosed in <user_work_description> tags.
2. COUNT the distinct concepts in the text that benefit from visualisation. For each concept, COUNT the number of primary items (steps, events, roles, tiers, branches, etc.). Write these counts down in your reasoning BEFORE picking presets.
3. Identify ${conceptCountPhrase} from the text.
4. For EACH concept, pick up to 3 structurally different presets whose capacity ACCOMMODATES that concept's item count. The preset's capacity is stated on its "capacity:" line.
5. Populate each variant's data with concrete labels, numbers, and nodes drawn from the user's text. The SAME semantic data should appear in every variant — only the visual style changes.
6. Write ONE caption per concept (1–3 sentences, max ${VISUALISE_CAPTION_MAX_CHARS} chars) summarising what the visual shows. Captions are concept-level, not variant-level — they apply equally regardless of which preset the user picks.
7. Write ONE list of node descriptions per concept (max ${VISUALISE_NODE_DESC_MAX_CHARS} chars each, up to ${VISUALISE_NODE_DESC_MAX_COUNT} items). Descriptions are concept-level too — they survive variant swaps.
8. Pick ONE palette per concept.
9. Write top-level \`reasoning\` (max ${VISUALISE_REASONING_MAX_CHARS} chars) explaining: how many concepts you identified, how many primary items each concept has, and why you picked each variant set.
10. Return a single JSON object matching the RESPONSE SCHEMA exactly.

CAPACITY RULE (CRITICAL — prevents silent content truncation):
- Every preset in the catalogue below has a "capacity:" line (e.g. "exactly 6 steps", "3–7 tasks", "up to 8 bars").
- EVERY variant you return MUST have a capacity that accommodates the concept's primary item count. If the user's text has 8 sequential steps, you MUST NOT pick a preset with "exactly 6 steps" capacity as any of the 3 variants — you would be forced to drop 2 steps.
- If NO preset accommodates the count for a given structural family, pick from a different structural family that does. Example: for 8 sequential items, timeline-horizontal-8event fits exactly, chart-bar-vertical fits up to 8, hierarchy-mindmap-centre fits 4–8.
- If the user's text genuinely covers two separate ideas, split it into two concepts and return two visuals rather than cramming one long list into a too-small preset.
- Returning fewer variants (2 or even 1) is ACCEPTABLE when capacity-compatible options are limited. Returning 3 capacity-incompatible variants is NOT acceptable — the incompatible ones will be dropped by validation and the user will see an error.
- NEVER silently drop items from the data to fit a preset's schema.

VARIANT SELECTION RULES:
- The variants MUST be structurally different families where possible (do NOT return 3 flow presets; return e.g. flow + timeline + process-stages). But capacity compatibility takes precedence: a capacity-matching variant from the same family beats a capacity-mismatching variant from a different family.
- Variant 1: the most obvious structural + capacity fit for the concept.
- Variant 2: a structurally different but still capacity-compatible preset.
- Variant 3: an unconventional but still valid (and capacity-compatible) fit — a preset from another family that still captures the concept. Gives the user a creative alternative. If no capacity-compatible unconventional fit exists, return only 2 variants.
- If fewer than 3 presets are capacity-compatible AND structurally fit, return 2 or even 1 variant. Never pad with poor or capacity-incompatible fits.
- Every variant's data MUST validate against its preset's own schema. If a preset requires exactly N items, make sure your data has exactly N items.

SEQUENCE-FIRST RULE:
- If the user text is an ORDERED LIST or SEQUENCE of steps (e.g. "1. do X, 2. do Y, 3. do Z" or prose describing a chronological process), EVERY variant MUST be a preset that handles sequential data. Valid families for sequences: flow-linear-*, process-numbered-*, process-stages-*, timeline-horizontal-*, timeline-vertical-*, timeline-gantt-*, timeline-milestones, process-circular-* (when the steps genuinely repeat).
- For sequences, NEVER pick PDCA unless the text is explicitly about Plan-Do-Check-Act continuous improvement. NEVER pick RACI unless the text explicitly assigns roles. NEVER pick DMAIC unless the text is explicitly about Six Sigma. NEVER pick SWOT / BCG / fishbone for a sequence.

CAPTION AND DESCRIPTION RULES:
- Captions: 1–3 sentences, up to ${VISUALISE_CAPTION_MAX_CHARS} characters. Neutral, descriptive — not promotional. Written in plain British English, present tense. State what the visual shows and why it matters to the user's work.
- Node descriptions: ONE per primary node, in the same order the data lists them. Each up to ${VISUALISE_NODE_DESC_MAX_CHARS} chars. Expand on the node label with context from the user's text — don't just restate the label. The number of descriptions should match the number of primary nodes (steps / events / rows / wedges) in variant 1; the same list is reused across variants so it must be variant-agnostic.
- Avoid duplication: when you populate \`node_descriptions\` at the concept level, LEAVE INTERNAL description fields inside each variant's \`data\` EMPTY. Specifically, if a preset's schema has per-node fields called \`detail\`, \`description\`, \`subtext\`, \`sublabel\`, \`caption\`, or similar, omit them or set them to empty strings. The concept-level \`node_descriptions\` is the single source of truth — the UI renders it below the visual. Keeping internal fields empty avoids showing the same text twice. (Labels, titles, headers, and any field that is NOT a per-node description should still be populated normally.)

GENERAL RULES:
- Never invent facts, numbers, dates, or names the user did not provide or clearly imply. If the text has no numbers, do not pick a chart preset — pick a diagram.
- Prefer construction-specific presets (IDs starting "con-") when the text mentions CDM, RAMS, NEC, permits, CSCS, site roles, H&S hierarchy, risk matrices, or similar regulated domains.
- Respect each preset's "when to use" guidance strictly. If the text doesn't match a preset's intended use, pick a different preset.
- Visual titles: 3 to 8 words. Never repeat the document title.
- Node labels: 40 characters maximum.
- Use British spelling (e.g. "colour", "organise", "visualise").
- Output valid JSON only. No markdown, no code fences, no commentary.

${constraints.join('\n')}

RESPONSE SCHEMA:
{
  "document_title": "3 to 10 word title summarising the whole document",
  "reasoning": "<1–4 sentences: concept count, primary-item count per concept, preset choice rationale. Max ${VISUALISE_REASONING_MAX_CHARS} chars.>",
  "concept_counts": [<integer count of primary items for each concept, in order>],
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
  const capacity = describeCapacityForAi(preset.id);
  return `- id: ${preset.id}
  name: ${preset.name}
  category: ${preset.category}
  capacity: ${capacity}
  when to use: ${preset.aiDescription}
  data example: ${example}`;
}

function buildPaletteList(): string {
  return PALETTE_IDS.map((id) => `- ${id}: ${PALETTE_AI_HINTS[id]}`).join('\n');
}

/**
 * Batch CQ: format clarify answers as a CONSTRAINT block. Each topic maps
 * to a specific instruction so the AI knows what to do with each hint.
 * Returns empty string if no useful answers are present; the caller can
 * skip appending it in that case.
 */
function buildClarifyConstraintsBlock(
  clarifyAnswers: Array<{ topic: string; value: string }> | undefined,
): string {
  if (!clarifyAnswers || clarifyAnswers.length === 0) return '';

  // Drop answers where the user picked "unknown" — those mean "I don't know
  // either, AI please decide" and shouldn't be hardcoded into the prompt.
  const useful = clarifyAnswers.filter((a) => a.value && a.value !== 'unknown');
  if (useful.length === 0) return '';

  const lines: string[] = [];
  for (const a of useful) {
    switch (a.topic) {
      case 'family':
        lines.push(
          `- The user says their content fits the "${a.value}" family. Strongly prefer presets in that family. Only pick a different family if the text genuinely does not fit.`,
        );
        break;
      case 'preset':
        lines.push(
          `- The user has picked preset "${a.value}" as their preferred shape. Use this preset as the FIRST choice for the primary concept. Only deviate if the preset is structurally impossible for the content (e.g. the text has 8 steps but the preset capacity is 4) — in which case, pick the closest structurally-compatible preset and explain in reasoning.`,
        );
        break;
      case 'count':
        lines.push(
          `- The user says there are ~${a.value} main items in their content. Count primary items accordingly; prefer presets whose capacity exactly matches this number.`,
        );
        break;
      case 'palette':
        lines.push(`- The user picked palette "${a.value}". Use this palette for all visuals in the response.`);
        break;
      case 'data':
        lines.push(`- The user provided missing data: "${a.value}". Use this when populating the preset's data fields.`);
        break;
      default:
        // Unknown topic — ignore silently. Future topics will land here until
        // this switch is updated.
        break;
    }
  }

  return `CLARIFICATION ANSWERS (AUTHORITATIVE — honour these over your own inference):
${lines.join('\n')}`;
}

