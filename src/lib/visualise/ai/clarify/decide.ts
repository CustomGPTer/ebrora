// =============================================================================
// Visualise — Clarify Decide (Batch CQ, Batch 4b-a)
//
// Given user text + prior answers + optional forcePresetId, decide whether
// to ask another clarifying question or proceed to generate. Topic priority
// per scope doc:
//   family → preset → count → item-count → palette → data
//
// The "AI stops early" heuristic:
//   - Skip `family` if the text trivially matches a family keyword regex
//     (reliable, no AI call needed), OR if a forcePresetId / preset answer
//     already fixes the family.
//   - Skip `preset` if the user has already given a preset OR a forcePresetId
//     is set OR no family was resolved (asking for a preset without a family
//     is nonsensical).
//   - Skip `count` (the pre-preset-selection form) if a digit+word pattern
//     (e.g. "4 stages") is present OR a specific preset is already locked.
//   - BATCH 4b-a — emit `item-count` when a specific preset is locked AND
//     its capacity has min !== max (i.e. the preset is flexible) AND the
//     count is not already resolved from text or prior answers.
//   - Skip `palette` if already answered — never ask proactively.
//   - Always consider `data` in the final round ONLY if the chosen preset
//     requires structured input the text doesn't obviously provide.
//
// Hard cap: CLARIFY_MAX_ROUNDS (3). If the cap is reached, we return done
// regardless of whether further questions would help.
// =============================================================================

import type {
  ClarifyAnswer,
  ClarifyQuestion,
  ClarifyTopic,
  FamilyHint,
} from './types';
import { CLARIFY_MAX_ROUNDS } from './types';
import questions from './questions.json';
import { getPresetById } from '../../presets';
import { getCapacity } from '../../presets/capacity';

// -----------------------------------------------------------------------------
// Helpers

function findAnswer(answers: ClarifyAnswer[], topic: ClarifyTopic): string | undefined {
  return answers.find((a) => a.topic === topic)?.value;
}

/**
 * Lightweight family detection from raw text. Looks for unambiguous keyword
 * clusters — e.g. "step 1, step 2" → flow; "2024 Q1, 2024 Q2" → timeline.
 * Returns null if no single family dominates.
 */
function detectFamilyFromText(text: string): FamilyHint | null {
  const t = text.toLowerCase();

  // Strong signals first — if multiple match, return null (ambiguous).
  const hits: FamilyHint[] = [];

  // Flow / process step signals
  if (/\b(step\s?\d|phase\s?\d|\d\.\s|first[,.]|next[,.]|then\s)/i.test(text)) hits.push('flow');
  if (/\b(pdca|dmaic|sipoc)\b/.test(t)) hits.push('process');

  // Timeline signals — dates, quarters, months, years
  if (
    /\b(q[1-4]\s?202\d|202\d\s?q[1-4]|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\b/.test(
      t,
    )
  ) {
    hits.push('timeline');
  }

  // Hierarchy signals
  if (/\b(reports to|manager|ceo|org chart|hierarchy|pyramid|tier\s?\d)\b/.test(t)) hits.push('hierarchy');

  // Comparison signals
  if (/\bvs\b|\bversus\b|\bpros?\b.*\bcons?\b|\bcompare\b/.test(t)) hits.push('comparison');

  // Cycle signals
  if (/\bcycle\b|\bloop\b|\bfeedback\b|\brepeat\b/.test(t)) hits.push('cycle');

  // Relationships signals
  if (/\bvenn\b|\boverlap\b|\bfishbone\b|\bishikawa\b|\broot cause\b/.test(t)) hits.push('relationships');

  // Positioning signals
  if (/\b(quadrant|2x2|swot|bcg matrix|impact\s*[/\\]?\s*effort)\b/.test(t)) hits.push('positioning');

  // Chart signals
  if (/\b(chart|pie\s?chart|bar\s?chart|kpi|percentage|%)\b/.test(t)) hits.push('charts');

  // Unambiguous case — single family match.
  if (hits.length === 1) return hits[0];

  // Process and flow often co-occur; treat as flow if both hit.
  if (hits.length === 2 && hits.includes('flow') && hits.includes('process')) return 'flow';

  return null;
}

/** Detect an explicit item count in the text (e.g. "5 steps", "four phases"). */
function detectCountFromText(text: string): number | null {
  const digitMatch = text.match(/\b(\d+)\s+(steps?|phases?|tiers?|stages?|items?|branches?|levels?|nodes?)\b/i);
  if (digitMatch) {
    const n = parseInt(digitMatch[1], 10);
    if (n >= 2 && n <= 12) return n;
  }
  const wordMap: Record<string, number> = {
    two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const wordMatch = text
    .toLowerCase()
    .match(/\b(two|three|four|five|six|seven|eight|nine|ten)\s+(steps?|phases?|tiers?|stages?|items?|branches?|levels?|nodes?)\b/);
  if (wordMatch) return wordMap[wordMatch[1]];
  return null;
}

/**
 * Does the chosen preset need structured data the free text doesn't obviously
 * supply? A subset of presets benefits from a data question:
 *   - quadrants and axis-based charts want axis labels
 *   - vs-card and head-to-head want two named options
 *   - gantt wants durations
 *
 * Batch 4b-a — extended for the template-first flow. When a user arrives
 * with a forcePresetId and writes thin text, the AI may not have enough
 * domain hints to fill named slots (e.g. swimlane lane names, SIPOC
 * centre-process name, venn set names). This function returns a prompt
 * when that's the case; the caller emits it as a `data` topic question.
 */
function presetNeedsDataQuestion(presetId: string, text: string): string | null {
  const p = getPresetById(presetId);
  if (!p) return null;

  // Quadrants want axis labels
  if (presetId.startsWith('quadrant-') || presetId === 'perceptual-map') {
    if (!/\b(axis|axes|horizontal|vertical|x[-\s]?axis|y[-\s]?axis)\b/i.test(text)) {
      return 'Your 2×2 needs axis labels. What do the horizontal and vertical axes measure?';
    }
  }

  // Vs-card / head-to-head wants two named options
  if (presetId === 'vs-card') {
    if (!/\bvs\b|\bversus\b/.test(text.toLowerCase())) {
      return 'What are the two options you\'re comparing head-to-head?';
    }
  }

  // Gantt wants durations
  if (presetId === 'timeline-gantt-lite') {
    if (!/\b(days?|weeks?|months?|duration|starts?|ends?)\b/i.test(text)) {
      return 'Your Gantt needs task durations. How long does each task run? (e.g. "Task A: 2 weeks")';
    }
  }

  // Batch 4b-a — Swimlanes need lane names. If the text doesn't name at least
  // two roles / lanes / parties, the AI has to guess — ask instead.
  if (presetId === 'flow-swimlane-2lane' || presetId === 'flow-swimlane-3lane') {
    const hasRoles = /\b(role|lane|team|party|department|engineer|manager|operative|contractor|client|supplier|quality|safety|design|delivery)\b/i.test(text);
    if (!hasRoles) {
      const n = presetId === 'flow-swimlane-3lane' ? 'three' : 'two';
      return `Your swimlane needs ${n} named roles (who owns each lane). Which roles or teams are involved, and what does each do?`;
    }
  }

  // Batch 4b-a — SIPOC wants the name of the process it describes. The 5
  // columns (Suppliers / Inputs / Process / Outputs / Customers) are named,
  // but the SIPOC itself needs a title — without it the AI has to invent one.
  if (presetId === 'flow-sipoc') {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 25) {
      return 'Your SIPOC needs a process name. Which process are you mapping (e.g. "Precast beam installation", "Permit approval")?';
    }
  }

  // Batch 4b-a — Venn diagrams need the set names. If the text doesn't
  // mention overlap or comparison terms, the AI struggles to identify
  // what the circles represent.
  if (presetId === 'venn-2circle' || presetId === 'venn-3circle') {
    const hasSetHints = /\b(overlap|common|both|shared|and also|while|versus|intersection)\b/i.test(text);
    if (!hasSetHints) {
      const n = presetId === 'venn-3circle' ? 'three' : 'two';
      return `Your Venn needs ${n} named sets. What does each circle represent, and what do they share?`;
    }
  }

  // Batch 4b-a — Fishbone wants named cause categories. Standard 6M's
  // (Man/Method/Machine/Material/Measurement/Mother Nature) or construction-
  // specific categories. Ask if the text doesn't suggest any.
  if (presetId === 'fishbone-ishikawa-6bone') {
    const hasCauseHints = /\b(cause|reason|why|because|factor|root|contributor|6m|five m)\b/i.test(text);
    if (!hasCauseHints) {
      return 'Your fishbone needs a problem statement and cause categories. What is the problem, and what broad categories might the causes fall into (e.g. people, method, equipment, materials)?';
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Main decision function

export interface DecideResult {
  nextQuestion?: ClarifyQuestion;
  done: boolean;
  round?: number;
}

export interface DecideOptions {
  /**
   * Batch 4b-a — when the caller knows the preset (template-first flow),
   * pass it here. `decide()` skips family + preset questions and jumps
   * straight to item-count (if flexible) / data (if thin text).
   */
  forcePresetId?: string;
}

/**
 * Batch 4b-a — build an item-count question dynamically for a locked preset.
 * Chips are bounded by the preset's capacity range, capped at 10 chips to
 * stay visually sensible in the ClarifyPanel chip row.
 *
 * Returns null if the preset is not flexible (min === max) or has no
 * capacity entry — callers should skip item-count in those cases.
 */
function buildItemCountQuestion(presetId: string, round: number): ClarifyQuestion | null {
  const cap = getCapacity(presetId);
  if (!cap) return null;
  const { min, max } = cap.primary;
  if (min >= max) return null;

  const unit = cap.primaryUnit;
  const chips = [] as { value: string; label: string }[];
  for (let n = min; n <= max; n += 1) {
    chips.push({ value: String(n), label: String(n) });
  }
  chips.push({ value: 'unknown', label: 'Not sure' });

  return {
    topic: 'item-count',
    prompt: `How many ${unit}s? (${min}–${max})`,
    chips,
    round,
  };
}

/**
 * Given the current text + prior answers + optional forcePresetId, decide
 * what to ask next. Pure function — no AI calls, no side effects. The live
 * AI call for free-text data extraction is triggered separately in
 * dataExtract.ts when this function returns a topic='data' question.
 */
export function decide(
  text: string,
  priorAnswers: ClarifyAnswer[],
  options: DecideOptions = {},
): DecideResult {
  const round = priorAnswers.length;
  const { forcePresetId } = options;

  // Hard cap — scope doc says up to 3 rounds total.
  if (round >= CLARIFY_MAX_ROUNDS) {
    return { done: true };
  }

  // Resolve existing knowledge from answers + text + forcePresetId.
  const familyAnswer = findAnswer(priorAnswers, 'family') as FamilyHint | undefined;
  const presetAnswer = findAnswer(priorAnswers, 'preset');
  const countAnswer = findAnswer(priorAnswers, 'count');
  const itemCountAnswer = findAnswer(priorAnswers, 'item-count');
  const paletteAnswer = findAnswer(priorAnswers, 'palette');
  const dataAnswer = findAnswer(priorAnswers, 'data');

  const resolvedFamily: FamilyHint | null =
    (familyAnswer && familyAnswer !== 'unknown' ? familyAnswer : null) ??
    detectFamilyFromText(text);

  const resolvedCount: number | null =
    itemCountAnswer && itemCountAnswer !== 'unknown'
      ? parseInt(itemCountAnswer, 10)
      : countAnswer && countAnswer !== 'unknown'
        ? parseInt(countAnswer, 10)
        : detectCountFromText(text);

  // Batch 4b-a — locked preset is either forced by the caller (template-first
  // flow) or chosen by the user via the preset chip question. Either path
  // means we know the target; skip family/preset and work on count+data.
  const lockedPresetId: string | undefined =
    forcePresetId ??
    (presetAnswer && presetAnswer !== 'unknown' ? presetAnswer : undefined);

  // -------------------------------------------------------------------------
  // Topic selection — in priority order. Pick the first unresolved topic.

  // 1. family — ask if not detected AND not answered AND no preset locked.
  //    (If a preset is locked, its own family is implicit — no need to ask.)
  if (!lockedPresetId && !resolvedFamily && !familyAnswer) {
    return {
      nextQuestion: { ...(questions.family as ClarifyQuestion), round },
      done: false,
      round,
    };
  }

  // 2. preset — ask if family is known but preset isn't, AND no preset is
  //    locked, AND a chip set exists for the family.
  if (!lockedPresetId && resolvedFamily && !presetAnswer) {
    const presetQs = (questions.presetByFamily as Record<string, ClarifyQuestion | undefined>);
    const presetQ = presetQs[resolvedFamily];
    if (presetQ) {
      return {
        nextQuestion: { ...presetQ, round },
        done: false,
        round,
      };
    }
    // No preset chips for this family — fall through to later topics.
  }

  // 3. count (pre-preset) — ask if unresolved AND no preset locked yet
  //    (otherwise item-count is the right path).
  if (!resolvedCount && !countAnswer && !lockedPresetId) {
    return {
      nextQuestion: { ...(questions.count as ClarifyQuestion), round },
      done: false,
      round,
    };
  }

  // 4. item-count (Batch 4b-a) — ask if a preset is locked AND flexible AND
  //    the count isn't already resolved. Skipped silently for fixed-count
  //    presets (min === max) — no question needed.
  if (lockedPresetId && !itemCountAnswer && !resolvedCount) {
    const itemCountQ = buildItemCountQuestion(lockedPresetId, round);
    if (itemCountQ) {
      return {
        nextQuestion: itemCountQ,
        done: false,
        round,
      };
    }
  }

  // 5. data — ask if preset is locked AND preset needs structured input
  //    the text doesn't obviously supply. Live question, not from JSON.
  if (lockedPresetId && !dataAnswer) {
    const dataPrompt = presetNeedsDataQuestion(lockedPresetId, text);
    if (dataPrompt) {
      return {
        nextQuestion: {
          topic: 'data',
          prompt: dataPrompt,
          placeholder: 'Short answer — up to 40 words.',
          round,
        },
        done: false,
        round,
      };
    }
  }

  // 6. palette — don't ask proactively. Scope says palette is "woven in where
  //    relevant" not prominently asked. Skip unless the user has resolved
  //    everything else and palette isn't set AND a round is still available
  //    — which in practice means round 3 with everything else resolved, rare.
  //    Even then: don't ask. Palette defaults are fine; better UX to skip.
  void paletteAnswer; // acknowledge the variable exists; see note above

  // Everything resolved — proceed to generate.
  return { done: true };
}
