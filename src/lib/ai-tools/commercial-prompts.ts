// =============================================================================
// Commercial Tools — Template-Specific Generation Prompts
// CE Notification, Delay Notification, Variation Confirmation, RFI Generator
// =============================================================================
// Each tool has 3 templates: formal-letter, corporate, concise
// formal-letter = maximum detail, full legal precision, highest word counts
// corporate = professional balanced, moderate word counts
// concise = key facts only, reduced word counts, still legally sound
// =============================================================================

import type { CeTemplateSlug } from '@/lib/ce/types';
import type { DelayTemplateSlug } from '@/lib/delay/types';
import type { VariationTemplateSlug } from '@/lib/variation/types';
import type { RfiTemplateSlug } from '@/lib/rfi/types';

// ── Helper: word count multiplier per template ──────────────────────────────
function templateMultiplier(slug: string): { label: string; factor: number; tone: string } {
  switch (slug) {
    case 'formal-letter':
      return { label: 'Formal', factor: 1.0, tone: 'Full legal precision. Maximum detail. Every clause referenced. Every entitlement stated explicitly. Reads like a document prepared by a contracts manager for tribunal-ready records.' };
    case 'corporate':
      return { label: 'Corporate', factor: 0.7, tone: 'Professional and direct. Covers all essential points without excessive legal elaboration. Suitable for routine notifications where the commercial relationship is collaborative.' };
    case 'concise':
      return { label: 'Concise', factor: 0.45, tone: 'Brief and factual. Key information only. Still legally sound but written for speed — ideal for urgent notifications or where a full letter will follow separately.' };
    default:
      return { label: 'Standard', factor: 1.0, tone: 'Professional standard format.' };
  }
}

function mw(base: number, factor: number): number {
  return Math.round(base * factor);
}


// ═══════════════════════════════════════════════════════════════════════════════
// CE NOTIFICATION — Template-Specific Generation Prompts
// ═══════════════════════════════════════════════════════════════════════════════
export function getCeTemplateGenerationPrompt(templateSlug: CeTemplateSlug): string {
  const { label, factor, tone } = templateMultiplier(templateSlug);
  return `Generate a Compensation Event Notification JSON for an NEC Engineering and Construction Contract.

TEMPLATE STYLE: ${label}
TONE: ${tone}

{
  "documentRef": "string (format: CEN-YYYY-NNN)",
  "notificationDate": "DD/MM/YYYY",
  "notifiedBy": "string (Contractor's Project Manager)",
  "projectName": "string",
  "siteAddress": "string",
  "contractReference": "string",
  "contractForm": "NEC3 ECC | NEC4 ECC",
  "notifiedTo": "string (Client's Project Manager)",
  "eventDate": "DD/MM/YYYY (date the event occurred or the instruction was received)",
  "compensationEventClause": "string (e.g. '60.1(1) — The Project Manager gives an instruction changing the Works Information')",
  "relatedInstruction": {
    "instructionRef": "string (PMI reference number, or 'N/A')",
    "instructionDate": "string",
    "issuedBy": "string"
  },
  "eventDescription": "string (min ${mw(300, factor)} words — detailed factual description of the compensation event. What happened, what changed, what instruction was given, and how it differs from the original Works Information / Scope)",
  "originalScope": "string (min ${mw(100, factor)} words — describe what was originally required under the contract)",
  "changedScope": "string (min ${mw(100, factor)} words — describe what is now required as a result of the event)",
  "entitlementBasis": "string (min ${mw(150, factor)} words — explain why this constitutes a compensation event under the cited clause. Reference the contract conditions and explain how the event meets the criteria)",
  "programmeImpact": {
    "criticalPathAffected": "Yes | No",
    "estimatedDelay": "string (working days)",
    "plannedCompletionImpact": "string",
    "keyDatesAffected": "string",
    "programmeNarrative": "string (min ${mw(100, factor)} words — explain the cause-and-effect on the programme)"
  },
  "costImplications": {
    "estimatedAdditionalCost": "string (£)",
    "labourCost": "string",
    "plantCost": "string",
    "materialsCost": "string",
    "subcontractorCost": "string",
    "preliminariesImpact": "string",
    "costNarrative": "string (min ${mw(100, factor)} words — explain the cost build-up)"
  },
  "quotationRequirements": {
    "quotationDueDate": "string (3 weeks from notification under NEC4)",
    "alternativeQuotationsRequired": "Yes | No",
    "revisedProgrammeRequired": "Yes | No"
  },
  "supportingEvidence": [
    { "document": "string", "reference": "string", "status": "Attached | To Follow" }
  ],
  "relatedNotices": "string (related early warnings, previous CEs, or other notifications)",
  "additionalNotes": "string (min ${mw(100, factor)} words — additional context, legislation references, or links to site RAMS)"
}
Minimum ${templateSlug === 'concise' ? 2 : 4} supporting evidence items. The entitlement basis must correctly cite NEC clause numbers and demonstrate understanding of the contract mechanism.`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// DELAY NOTIFICATION — Template-Specific Generation Prompts
// ═══════════════════════════════════════════════════════════════════════════════
export function getDelayTemplateGenerationPrompt(templateSlug: DelayTemplateSlug): string {
  const { label, factor, tone } = templateMultiplier(templateSlug);
  return `Generate a formal Delay Notification Letter. Professionally formatted, legally precise, protecting contractual entitlement.

TEMPLATE STYLE: ${label}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: DNL-YYYY-NNN)",
  "letterDate": "DD/MM/YYYY",
  "fromParty": "string",
  "toParty": "string",
  "projectName": "string",
  "projectAddress": "string",
  "contractReference": "string",
  "contractForm": "NEC3 ECC | NEC4 ECC | JCT SBC/Q 2016 | JCT D&B 2016 | JCT Minor Works 2016 | Other",
  "notificationClause": "string (e.g. 'NEC4 Clause 61.3' or 'JCT SBC/Q 2016 Clause 2.27.1')",
  "letterSubject": "string (formal subject line)",
  "openingParagraph": "string (min ${mw(100, factor)} words — formal opening notifying the delay event. Reference contract, clause, and event date)",
  "eventDescription": "string (min ${mw(300, factor)} words — detailed factual description: what instruction/condition/event; when; who issued/identified it; contractual reference; how it differs from original contract scope)",
  "affectedActivities": [
    {
      "activityRef": "string",
      "originalDate": "string",
      "revisedDate": "string",
      "delayDays": "number",
      "criticalPath": "Yes | No",
      "notes": "string"
    }
  ],
  "programmeImpact": "string (min ${mw(200, factor)} words — cause-and-effect on programme, critical path impact, key dates affected, estimated extension of time sought)",
  "estimatedExtensionOfTime": "string (calendar/working days)",
  "mitigationMeasures": "string (min ${mw(150, factor)} words — measures taken/to be taken to mitigate delay, and why they cannot fully recover programme)",
  "costEntitlement": {
    "claimed": "Yes | No | Reserved",
    "estimatedAdditionalCost": "string (£ or 'To be assessed separately')",
    "costNarrative": "string (min ${mw(100, factor)} words — entitlement basis, cost categories, relevant clauses)"
  },
  "contractualEntitlement": "string (min ${mw(200, factor)} words — why the Contractor is entitled to extension of time. Correct clause numbers for stated contract form. For NEC: which CE clause. For JCT: which Relevant Event)",
  "requestedResponse": "string (min ${mw(80, factor)} words — what response is required, by when, consequences of non-response)",
  "withoutPrejudice": "boolean",
  "supportingDocuments": [
    { "document": "string", "reference": "string", "status": "Attached | To Follow" }
  ],
  "closingParagraph": "string",
  "additionalNotes": "string (min ${mw(100, factor)} words — additional context, legislation references, or links to site RAMS)"
}
Minimum ${templateSlug === 'concise' ? 2 : 3} affected activities. Minimum ${templateSlug === 'concise' ? 2 : 4} supporting documents. Clause numbers must be correct for the stated contract form.`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// VARIATION CONFIRMATION — Template-Specific Generation Prompts
// ═══════════════════════════════════════════════════════════════════════════════
export function getVariationTemplateGenerationPrompt(templateSlug: VariationTemplateSlug): string {
  const { label, factor, tone } = templateMultiplier(templateSlug);
  return `Generate a formal Variation Confirmation Letter creating a written record of a verbal instruction and requesting formal written instruction.

TEMPLATE STYLE: ${label}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: VCL-YYYY-NNN)",
  "letterDate": "DD/MM/YYYY",
  "fromParty": "string",
  "toParty": "string",
  "projectName": "string",
  "projectAddress": "string",
  "contractReference": "string",
  "contractForm": "NEC3 ECC | NEC4 ECC | JCT SBC/Q 2016 | JCT D&B 2016 | Bespoke Subcontract | Letter of Intent | No Formal Contract",
  "letterSubject": "string",
  "openingParagraph": "string (min ${mw(100, factor)} words — formal opening confirming this constitutes written notice and reserves all contractual rights)",
  "verbalInstructionDetails": {
    "instructedBy": "string",
    "instructingParty": "string",
    "dateOfInstruction": "DD/MM/YYYY",
    "timeOfInstruction": "string",
    "locationOfInstruction": "string",
    "witnessesPresent": "string"
  },
  "descriptionOfVariation": "string (min ${mw(300, factor)} words — precise description of varied/additional works. What exactly were you told to do? What is different from original scope? Quantities, dimensions, materials, method, location)",
  "worksStatus": {
    "worksStarted": "boolean",
    "workComplete": "boolean",
    "progressDescription": "string",
    "materialsOrdered": "boolean",
    "materialsDetail": "string"
  },
  "estimatedCostImpact": {
    "estimatedTotalCost": "string (£)",
    "labourCost": "string (£)",
    "plantCost": "string (£)",
    "materialsCost": "string (£)",
    "overheadsAndProfit": "string",
    "costBreakdownNarrative": "string (min ${mw(100, factor)} words)"
  },
  "estimatedTimeImpact": {
    "timeImpactClaimed": "Yes | No | To Be Assessed",
    "affectedActivities": "string",
    "estimatedDelayDays": "string",
    "timeImpactNarrative": "string (min ${mw(80, factor)} words)"
  },
  "contractualEntitlement": "string (min ${mw(150, factor)} words — basis for additional payment. Relevant clauses for variations/CEs. Carrying out verbal instruction does not constitute acceptance of original contract price for such works)",
  "requestForWrittenInstruction": "string (min ${mw(100, factor)} words — formal request for written instruction: PMI (NEC) or AI/CAI (JCT))",
  "withoutPrejudiceStatement": "string",
  "responseDeadline": "string",
  "supportingDocuments": [
    { "document": "string", "reference": "string", "status": "Attached | To Follow" }
  ],
  "closingParagraph": "string",
  "additionalNotes": "string (min ${mw(100, factor)} words — additional context, legislation references, or links to site RAMS)"
}
Minimum ${templateSlug === 'concise' ? 2 : 3} supporting documents. Clause numbers must be correct for stated contract form.`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// RFI GENERATOR — Template-Specific Generation Prompts
// ═══════════════════════════════════════════════════════════════════════════════
export function getRfiTemplateGenerationPrompt(templateSlug: RfiTemplateSlug): string {
  const { label, factor, tone } = templateMultiplier(templateSlug);
  return `Generate a formal Request for Information. Concise, technically precise, structured to compel a prompt response.

TEMPLATE STYLE: ${label}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: RFI-YYYY-NNN)",
  "rfiDate": "DD/MM/YYYY",
  "requiredResponseDate": "DD/MM/YYYY",
  "raisedBy": "string",
  "directedTo": "string",
  "projectName": "string",
  "projectAddress": "string",
  "contractReference": "string",
  "rfiSubject": "string (clear specific subject line)",
  "querySummary": "string (min ${mw(150, factor)} words — clear, precise summary. Technical, factual, no ambiguity)",
  "relevantDocuments": [
    {
      "documentType": "Drawing | Specification | Schedule | Standard | Other",
      "reference": "string",
      "revision": "string",
      "title": "string",
      "relevance": "string"
    }
  ],
  "detailedQuestion": "string (min ${mw(200, factor)} words — specific questions numbered if multiple. Precise about what decision is needed and in what format)",
  "background": "string (min ${mw(250, factor)} words — context: what work, why needed, what has been considered, any partial information)",
  "proposedSolution": {
    "proposed": "boolean",
    "description": "string"
  },
  "programmeImplication": {
    "activitiesAtRisk": ["string"],
    "latestResponseDateForNoImpact": "DD/MM/YYYY",
    "programmeNarrative": "string (min ${mw(100, factor)} words — specific activities, held/delayed if response not received, working days impact)"
  },
  "impactOfNonResponse": "string (min ${mw(100, factor)} words — what happens if response not received: cost, programme, procurement lead times)",
  "contractualReference": "string (clause for information provision, e.g. NEC4 Cl 27.1 or JCT SBC Cl 2.12)",
  "distribution": ["string"],
  "responseFormat": "string",
  "additionalNotes": "string (min ${mw(100, factor)} words — additional context, legislation references, or links to site RAMS)"
}
Minimum ${templateSlug === 'concise' ? 2 : 3} relevant documents. Minimum ${templateSlug === 'concise' ? 1 : 2} activities at risk. Programme implication must include specific activity names and dates.`;
}
