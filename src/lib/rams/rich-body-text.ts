// =============================================================================
// RAMS Builder — Rich Body Text Parser + Content Validator
// Parses AI-generated text into proper docx paragraphs with numbered lists,
// bullet lists, and regular paragraphs — no more wall-of-text output.
// =============================================================================
import {
  Paragraph, TextRun, AlignmentType, LevelFormat,
} from 'docx';

// ---------------------------------------------------------------------------
// richBodyText: Converts AI-generated text into an array of Paragraph objects
// Handles: numbered lists (1. 2. 3.), bullet lists (- item), and plain text
// ---------------------------------------------------------------------------

/**
 * Parse a text block into proper Word paragraphs.
 * Splits on:
 *   - Double newlines (\n\n) → separate paragraphs
 *   - Numbered patterns ("1. ", "2. ") at the start of a line → numbered list items
 *   - Bullet patterns ("- ", "• ") at the start of a line → bullet list items
 *   - Single newlines within a block → separate paragraphs
 *
 * @param text - The raw text from the AI
 * @param fontSize - Font size in half-points (default 18 = 9pt)
 * @param opts - Optional bold/italic/color overrides
 * @returns Array of Paragraph objects ready to spread into a docx section
 */
export function richBodyText(
  text: string,
  fontSize = 18,
  opts?: { bold?: boolean; italic?: boolean; color?: string }
): Paragraph[] {
  if (!text || !text.trim()) {
    return [new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '[No content provided]', size: fontSize, font: 'Arial', italics: true, color: '999999' })],
    })];
  }

  const paragraphs: Paragraph[] = [];

  // First split on double newlines (major paragraph breaks)
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Split the block on single newlines
    const lines = trimmed.split(/\n/);

    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) continue;

      // FIRST: Check for inline numbered items crammed on one line ("1. ... 2. ... 3. ...")
      // Must run BEFORE single numbered match to catch wall-of-text output
      const inlineNumberedPattern = /(?:^|\s)(\d+)\.\s/g;
      const inlineMatches = [...lineTrimmed.matchAll(inlineNumberedPattern)];

      if (inlineMatches.length >= 2) {
        const items = lineTrimmed.split(/(?=(?:^|\s)\d+\.\s)/);
        for (const item of items) {
          const itemTrimmed = item.trim();
          if (!itemTrimmed) continue;

          const itemMatch = itemTrimmed.match(/^(\d+)\.\s+(.+)/);
          if (itemMatch) {
            paragraphs.push(new Paragraph({
              spacing: { before: 80, after: 80 },
              indent: { left: 360, hanging: 360 },
              children: [
                new TextRun({
                  text: `${itemMatch[1]}. `,
                  size: fontSize,
                  font: 'Arial',
                  bold: true,
                  color: opts?.color ?? '000000',
                }),
                new TextRun({
                  text: itemMatch[2],
                  size: fontSize,
                  font: 'Arial',
                  bold: opts?.bold,
                  italics: opts?.italic,
                  color: opts?.color ?? '000000',
                }),
              ],
            }));
          } else {
            paragraphs.push(new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: itemTrimmed,
                  size: fontSize,
                  font: 'Arial',
                  bold: opts?.bold,
                  italics: opts?.italic,
                  color: opts?.color ?? '000000',
                }),
              ],
            }));
          }
        }
        continue;
      }

      // Single numbered item on its own line: "1. ", "2. ", "10. "
      const numberedMatch = lineTrimmed.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        const stepNum = numberedMatch[1];
        const content = numberedMatch[2];

        paragraphs.push(new Paragraph({
          spacing: { before: 80, after: 80 },
          indent: { left: 360, hanging: 360 },
          children: [
            new TextRun({
              text: `${stepNum}. `,
              size: fontSize,
              font: 'Arial',
              bold: true,
              color: opts?.color ?? '000000',
            }),
            new TextRun({
              text: content,
              size: fontSize,
              font: 'Arial',
              bold: opts?.bold,
              italics: opts?.italic,
              color: opts?.color ?? '000000',
            }),
          ],
        }));
        continue;
      }

      // Check if this is a bullet item: "- ", "• ", "* "
      const bulletMatch = lineTrimmed.match(/^[-•*]\s+(.+)/);
      if (bulletMatch) {
        const content = bulletMatch[1];

        paragraphs.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 720, hanging: 360 },
          children: [
            new TextRun({
              text: '•  ',
              size: fontSize,
              font: 'Arial',
              color: opts?.color ?? '000000',
            }),
            new TextRun({
              text: content,
              size: fontSize,
              font: 'Arial',
              bold: opts?.bold,
              italics: opts?.italic,
              color: opts?.color ?? '000000',
            }),
          ],
        }));
        continue;
      }

      // Check for lettered sub-items: "a) ", "b) ", "c) "
      const letteredMatch = lineTrimmed.match(/^([a-z])\)\s+(.+)/);
      if (letteredMatch) {
        const letter = letteredMatch[1];
        const content = letteredMatch[2];

        paragraphs.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 1080, hanging: 360 },
          children: [
            new TextRun({
              text: `${letter})  `,
              size: fontSize,
              font: 'Arial',
              bold: true,
              color: opts?.color ?? '000000',
            }),
            new TextRun({
              text: content,
              size: fontSize,
              font: 'Arial',
              bold: opts?.bold,
              italics: opts?.italic,
              color: opts?.color ?? '000000',
            }),
          ],
        }));
        continue;
      }

      // Regular paragraph
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: lineTrimmed,
            size: fontSize,
            font: 'Arial',
            bold: opts?.bold,
            italics: opts?.italic,
            color: opts?.color ?? '000000',
          }),
        ],
      }));
    }
  }

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: '[No content provided]', size: fontSize, font: 'Arial', italics: true, color: '999999' })],
  })];
}


// ---------------------------------------------------------------------------
// Content Validator: Check word counts and retry if below minimums
// ---------------------------------------------------------------------------

export interface WordCountCheck {
  field: string;
  value: string;
  minimum: number;
}

export interface ValidationResult {
  isValid: boolean;
  failures: Array<{ field: string; actual: number; minimum: number }>;
}

/**
 * Validate that all text sections meet their minimum word counts.
 */
export function validateWordCounts(checks: WordCountCheck[]): ValidationResult {
  const failures: Array<{ field: string; actual: number; minimum: number }> = [];

  for (const check of checks) {
    const wordCount = check.value
      ? check.value.trim().split(/\s+/).filter(w => w.length > 0).length
      : 0;

    if (wordCount < check.minimum) {
      failures.push({
        field: check.field,
        actual: wordCount,
        minimum: check.minimum,
      });
    }
  }

  return {
    isValid: failures.length === 0,
    failures,
  };
}

/**
 * Build a retry prompt that tells the AI which sections were too short.
 */
export function buildRetryPrompt(failures: ValidationResult['failures']): string {
  const failureList = failures
    .map(f => `- "${f.field}": you wrote ${f.actual} words but the minimum is ${f.minimum} words`)
    .join('\n');

  return `YOUR PREVIOUS RESPONSE WAS REJECTED because the following sections did not meet the minimum word count requirements:

${failureList}

You MUST rewrite these sections with MORE detail. Do not just pad with filler — add genuine, professional content that a site supervisor would expect to see.

Regenerate the COMPLETE JSON response with ALL sections, ensuring every section meets its minimum word count.`;
}

/**
 * Get the standard word count checks for a given template.
 * Used by the generate route to validate AI output.
 */
export function getWordCountChecks(templateSlug: string, content: any): WordCountCheck[] {
  const checks: WordCountCheck[] = [];

  // Universal checks
  if (content.sequenceOfWorks) {
    checks.push({ field: 'Sequence of Works', value: content.sequenceOfWorks, minimum: 500 });
  }
  if (content.taskDescription) {
    checks.push({ field: 'Task Description', value: content.taskDescription, minimum: 80 });
  }

  // 100-word minimum sections (present in most templates)
  const hundredWordFields = [
    'ppeRequirements', 'competencyRequirements', 'temporaryWorks',
    'environmentalConsiderations', 'wasteManagement', 'emergencyProcedures',
    'welfareFacilities', 'communicationArrangements', 'monitoringArrangements',
    'trafficManagement', 'noiseVibrationControls', 'reviewCloseOut',
    'lessonsLearned', 'liftingMethod', 'siteSetupAccess', 'housekeeping',
    'coordinationCommunication', 'pcSiteRulesCompliance',
    'introduction', 'worksOverview', 'locationSiteConditions',
    'workforceSupervision', 'competencyTrainingNarrative', 'permitsConsentsNarrative',
    'sitePreparationAccess', 'siteSetUp', 'exclusionZones',
    'environmentalNarrative', 'wasteNarrative', 'pollutionPrevention',
    'emergencyNarrative', 'firstAid', 'welfareNarrative',
    'residualRiskManagement', 'hsfContributions', 'interfaces',
  ];

  for (const field of hundredWordFields) {
    if (content[field] && typeof content[field] === 'string') {
      checks.push({ field, value: content[field], minimum: 100 });
    }
  }

  return checks;
}
