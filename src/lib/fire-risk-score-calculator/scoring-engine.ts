// src/lib/fire-risk-score-calculator/scoring-engine.ts
// Section scoring, overall risk calculation, action generation

import type {
  SiteMode,
  OverallRisk,
  SectionScore,
  ActionItem,
  FireSection,
} from "@/data/fire-risk-score-calculator";
import {
  getRiskRating,
  getRiskScore,
  FIRE_SECTIONS,
  SECTION_ACTIONS,
  genId,
} from "@/data/fire-risk-score-calculator";

/**
 * Auto-score a section based on question answers.
 * Each "no" answer increases likelihood by 1 (capped at 5).
 * Consequence is estimated based on section type (escape/detection = higher consequence).
 */
export function autoScoreSection(
  section: FireSection,
  answers: Record<string, "yes" | "no" | "na" | null>
): { likelihood: number; consequence: number } {
  const answeredQuestions = section.questions.filter(q => answers[q.id] !== null && answers[q.id] !== "na");
  const noCount = section.questions.filter(q => answers[q.id] === "no").length;
  const totalAnswered = answeredQuestions.length;

  if (totalAnswered === 0) return { likelihood: 1, consequence: 1 };

  const noRatio = noCount / Math.max(totalAnswered, 1);

  // Likelihood: based on proportion of "no" answers
  let likelihood = 1;
  if (noRatio > 0.75) likelihood = 5;
  else if (noRatio > 0.5) likelihood = 4;
  else if (noRatio > 0.25) likelihood = 3;
  else if (noRatio > 0) likelihood = 2;

  // Consequence: higher for escape/detection/alarm sections
  const highConsequenceSections = ["off-escape", "con-escape", "occ-escape", "off-detection", "con-detection", "occ-detection", "occ-interface"];
  const isHighConsequence = highConsequenceSections.includes(section.id);
  let consequence = isHighConsequence ? 4 : 3;

  // If everything is fine, lower consequence
  if (noCount === 0) consequence = 1;
  else if (noRatio <= 0.25) consequence = isHighConsequence ? 3 : 2;

  return { likelihood, consequence };
}

/**
 * Calculate overall risk from all section scores.
 * Uses the highest individual section rating.
 */
export function calculateOverallRisk(sectionScores: SectionScore[]): {
  overallRating: OverallRisk;
  highestScore: number;
  answeredSections: number;
  totalSections: number;
  totalActions: number;
} {
  const riskOrder: OverallRisk[] = ["low", "medium", "high", "intolerable"];
  let highestRating: OverallRisk = "low";
  let highestScore = 0;
  let answeredSections = 0;

  sectionScores.forEach(ss => {
    // Check if any questions answered
    const hasAnswers = Object.values(ss.answers).some(a => a !== null);
    if (hasAnswers) {
      answeredSections++;
      if (riskOrder.indexOf(ss.rating) > riskOrder.indexOf(highestRating)) {
        highestRating = ss.rating;
      }
      if (ss.score > highestScore) highestScore = ss.score;
    }
  });

  // Count total actions needed
  const totalActions = sectionScores.filter(ss => {
    return ss.rating === "medium" || ss.rating === "high" || ss.rating === "intolerable";
  }).length;

  return {
    overallRating: highestRating,
    highestScore,
    answeredSections,
    totalSections: sectionScores.length,
    totalActions,
  };
}

/**
 * Generate action items for sections that scored medium or above.
 */
export function generateActions(
  sectionScores: SectionScore[],
  sections: FireSection[]
): ActionItem[] {
  const actions: ActionItem[] = [];

  sectionScores.forEach(ss => {
    if (ss.rating === "low") return;

    const section = sections.find(s => s.id === ss.sectionId);
    if (!section) return;

    const templateActions = SECTION_ACTIONS[ss.sectionId] || [];
    // Filter to actions related to "no" answers
    const noQuestions = section.questions.filter(q => ss.answers[q.id] === "no");

    // Use template actions up to the number of "no" answers (min 1)
    const count = Math.max(noQuestions.length, 1);
    templateActions.slice(0, count).forEach(desc => {
      actions.push({
        id: genId(),
        sectionId: ss.sectionId,
        sectionTitle: section.title,
        description: desc,
        responsiblePerson: "",
        targetDate: "",
        priority: ss.rating,
      });
    });
  });

  return actions;
}

/**
 * Get completion percentage
 */
export function getCompletion(sectionScores: SectionScore[]): number {
  let total = 0;
  let answered = 0;
  sectionScores.forEach(ss => {
    Object.values(ss.answers).forEach(a => {
      total++;
      if (a !== null) answered++;
    });
  });
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}
