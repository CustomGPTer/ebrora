// =============================================================================
// Visualise — Clarify Decide (Batch CQ)
//
// Given user text + prior answers, decide whether to ask another clarifying
// question or proceed to generate. Topic priority per scope doc:
//   family → preset → count → palette → data
//
// The "AI stops early" heuristic:
//   - Skip `family` if the text trivially matches a family keyword regex
//     (reliable, no AI call needed).
//   - Skip `preset` if the user has already given a preset OR no family
//     was resolved (asking for a preset without a family is nonsensical).
//   - Skip `count` if a digit+word pattern (e.g. "4 stages") is present.
//   - Skip `palette` if already answered — never ask proactively; palette
//     is the least load-bearing topic for avoiding the "no valid visuals"
//     error and bumping through it risks question fatigue.
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
 * supply? Only a subset of presets — quadrants, charts with axes, matrices —
 * benefit from a data question. For most presets the AI can extract from prose.
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

  return null;
}

// -----------------------------------------------------------------------------
// Main decision function

export interface DecideResult {
  nextQuestion?: ClarifyQuestion;
  done: boolean;
  round?: number;
}

/**
 * Given the current text + prior answers, decide what to ask next.
 * Pure function — no AI calls, no side effects. The live AI call for
 * free-text data extraction is triggered separately in dataExtract.ts
 * when this function returns a topic='data' question.
 */
export function decide(text: string, priorAnswers: ClarifyAnswer[]): DecideResult {
  const round = priorAnswers.length;

  // Hard cap — scope doc says up to 3 rounds total.
  if (round >= CLARIFY_MAX_ROUNDS) {
    return { done: true };
  }

  // Resolve existing knowledge from answers + text.
  const familyAnswer = findAnswer(priorAnswers, 'family') as FamilyHint | undefined;
  const presetAnswer = findAnswer(priorAnswers, 'preset');
  const countAnswer = findAnswer(priorAnswers, 'count');
  const paletteAnswer = findAnswer(priorAnswers, 'palette');
  const dataAnswer = findAnswer(priorAnswers, 'data');

  const resolvedFamily: FamilyHint | null =
    (familyAnswer && familyAnswer !== 'unknown' ? familyAnswer : null) ??
    detectFamilyFromText(text);

  const resolvedCount: number | null =
    countAnswer && countAnswer !== 'unknown' ? parseInt(countAnswer, 10) : detectCountFromText(text);

  // -------------------------------------------------------------------------
  // Topic selection — in priority order. Pick the first unresolved topic.

  // 1. family — ask if not detected AND not answered
  if (!resolvedFamily && !familyAnswer) {
    return {
      nextQuestion: { ...(questions.family as ClarifyQuestion), round },
      done: false,
      round,
    };
  }

  // 2. preset — ask if family is known but preset isn't, AND a chip set exists
  if (resolvedFamily && !presetAnswer) {
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

  // 3. count — ask if unresolved AND preset is unknown (so we still have choice to make)
  //    Skip count when user has locked a specific preset — the preset's own
  //    schema constrains count and asking is just friction.
  const hasLockedPreset = presetAnswer && presetAnswer !== 'unknown';
  if (!resolvedCount && !countAnswer && !hasLockedPreset) {
    return {
      nextQuestion: { ...(questions.count as ClarifyQuestion), round },
      done: false,
      round,
    };
  }

  // 4. data — ask if preset is locked AND preset requires structured input
  //    the text doesn't obviously supply. Live question, not from JSON.
  if (hasLockedPreset && !dataAnswer) {
    const dataPrompt = presetNeedsDataQuestion(presetAnswer!, text);
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

  // 5. palette — don't ask proactively. Scope says palette is "woven in where
  //    relevant" not prominently asked. We skip unless the user has resolved
  //    everything else and the palette isn't set AND a round is still available
  //    — which in practice means round 3 with everything else resolved, rare.
  //    Even then: don't ask. Palette defaults are fine; better UX to skip.
  void paletteAnswer; // acknowledge the variable exists; see note above

  // Everything resolved — proceed to generate.
  return { done: true };
}
