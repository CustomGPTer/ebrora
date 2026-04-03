// =============================================================================
// AI Tools — Template Slug Validation
// Allowlist-based validation for all template slugs received from the client.
// Prevents unvalidated user input from reaching prompt-selection functions.
// =============================================================================
import type { AiToolSlug } from './types';

/**
 * Map of toolSlug → Set of valid template slugs for that tool.
 * Only tools that support multiple templates are listed.
 * If a tool is not in this map, it has no template selection.
 */
const VALID_TEMPLATE_SLUGS: Partial<Record<AiToolSlug, Set<string>>> = {
  'tbt-generator': new Set([
    'ebrora-branded', 'red-safety', 'editorial', 'sidebar',
    'magazine', 'blueprint', 'rag-bands', 'card-based', 'hazard-industrial',
  ]),
  coshh: new Set([
    'ebrora-standard', 'red-hazard', 'sds-technical', 'compact-field', 'audit-ready',
  ]),
  'cdm-checker': new Set([
    'ebrora-standard', 'compliance-matrix', 'audit-trail', 'executive-summary',
  ]),
  'confined-spaces': new Set([
    'ebrora-standard', 'red-danger', 'permit-style', 'rescue-focused',
  ]),
  'emergency-response': new Set([
    'ebrora-standard', 'quick-reference', 'role-based', 'multi-scenario',
  ]),
  'incident-report': new Set([
    'ebrora-standard', 'riddor-focused', 'root-cause', 'near-miss',
  ]),
  'lift-plan': new Set([
    'ebrora-standard', 'operator-brief', 'tandem-lift', 'loler-compliance',
  ]),
  'manual-handling': new Set([
    'ebrora-standard', 'mac-assessment', 'rapp-assessment', 'training-briefing',
  ]),
  'noise-assessment': new Set([
    'ebrora-standard', 'section-61', 'monitoring-report', 'resident-communication',
  ]),
  'permit-to-dig': new Set([
    'ebrora-standard', 'daily-permit', 'utility-strike', 'avoidance-plan',
  ]),
  powra: new Set([
    'ebrora-standard', 'quick-card', 'task-specific', 'supervisor-review',
  ]),
  'scope-of-works': new Set([
    'corporate-blue', 'formal-contract', 'executive-navy',
  ]),
  'early-warning': new Set([
    'nec4-contractor-pm', 'nec4-pm-contractor', 'nec4-sub-to-mc', 'nec4-mc-to-sub',
    'comprehensive-risk', 'health-safety', 'design-technical', 'weather-force-majeure',
  ]),
  'quote-generator': new Set([
    'full-tender', 'formal-contract', 'standard-quote', 'budget-estimate',
  ]),
  'ce-notification': new Set([
    'formal-letter', 'corporate', 'concise',
  ]),
  'delay-notification': new Set([
    'formal-letter', 'corporate', 'concise',
  ]),
  'variation-confirmation': new Set([
    'formal-letter', 'corporate', 'concise',
  ]),
  'rfi-generator': new Set([
    'formal-letter', 'corporate', 'concise',
  ]),
  'carbon-reduction-plan': new Set([
    'ppn-0621-standard', 'sbti-aligned', 'iso-14064-compliant', 'ghg-protocol-corporate',
  ]),
  'carbon-footprint': new Set([
    'ebrora-standard', 'pas-2080-technical', 'compact-summary', 'audit-ready',
  ]),
  'daywork-sheet': new Set([
    'ebrora-standard', 'ceca-civil', 'jct-prime-cost', 'nec4-record',
    'compact-field', 'audit-trail', 'subcontractor-valuation', 'weekly-summary',
  ]),
  ncr: new Set([
    'ebrora-standard', 'iso-9001-formal', 'red-alert', 'compact-closeout',
    'supplier-ncr', 'audit-trail',
  ]),
  'safety-alert': new Set([
    'ebrora-standard', 'red-emergency', 'lessons-learned', 'formal-investigation',
  ]),
  'programme-checker': new Set([
    'scoring', 'email-summary', 'rag-report', 'comprehensive',
  ]),
  'wah-assessment': new Set([
    'full-compliance', 'formal-hse', 'site-ready', 'quick-check',
  ]),
  'wbv-assessment': new Set([
    'professional', 'compliance', 'site-practical',
  ]),
  'riddor-report': new Set([
    'formal-investigation', 'corporate', 'quick-notification',
  ]),
  'traffic-management': new Set([
    'full-chapter8', 'formal-highways', 'site-plan', 'quick-brief',
  ]),
  'waste-management': new Set([
    'full-compliance', 'corporate', 'site-record',
  ]),
  'invasive-species': new Set([
    'ecological-report', 'site-management', 'briefing-note',
  ]),
};

/**
 * Check whether a template slug is valid for the given tool.
 * Returns true if the tool has no templates (no validation needed)
 * or if the slug is in the tool's allowlist.
 */
export function isValidTemplateSlug(
  toolSlug: AiToolSlug,
  templateSlug: string | null | undefined
): boolean {
  if (!templateSlug) return true; // no slug provided — fine, will use default
  const allowed = VALID_TEMPLATE_SLUGS[toolSlug];
  if (!allowed) return true; // tool has no template variants — slug is ignored
  return allowed.has(templateSlug);
}

/**
 * Validate all template slugs from a request body in one call.
 * Pass the toolSlug and a record of propName → value.
 * Returns the first invalid slug found, or null if all are valid.
 */
export function findInvalidTemplateSlug(
  toolSlug: AiToolSlug,
  templateSlugs: Record<string, string | undefined | null>
): string | null {
  // Map of request body prop → the toolSlug it belongs to
  const PROP_TO_TOOL: Record<string, AiToolSlug> = {
    tbtTemplateSlug: 'tbt-generator',
    coshhTemplateSlug: 'coshh',
    cdmCheckerTemplateSlug: 'cdm-checker',
    confinedSpacesTemplateSlug: 'confined-spaces',
    erpTemplateSlug: 'emergency-response',
    incidentReportTemplateSlug: 'incident-report',
    liftPlanTemplateSlug: 'lift-plan',
    manualHandlingTemplateSlug: 'manual-handling',
    noiseAssessmentTemplateSlug: 'noise-assessment',
    permitToDigTemplateSlug: 'permit-to-dig',
    powraTemplateSlug: 'powra',
    scopeTemplateSlug: 'scope-of-works',
    earlyWarningTemplateSlug: 'early-warning',
    quoteTemplateSlug: 'quote-generator',
    ceTemplateSlug: 'ce-notification',
    delayTemplateSlug: 'delay-notification',
    variationTemplateSlug: 'variation-confirmation',
    rfiTemplateSlug: 'rfi-generator',
    crpTemplateSlug: 'carbon-reduction-plan',
    carbonFootprintTemplateSlug: 'carbon-footprint',
    dayworkSheetTemplateSlug: 'daywork-sheet',
    ncrTemplateSlug: 'ncr',
    safetyAlertTemplateSlug: 'safety-alert',
    programmeCheckerTemplateSlug: 'programme-checker',
    wahTemplateSlug: 'wah-assessment',
    wbvTemplateSlug: 'wbv-assessment',
    riddorTemplateSlug: 'riddor-report',
    trafficTemplateSlug: 'traffic-management',
    wasteTemplateSlug: 'waste-management',
    invasiveTemplateSlug: 'invasive-species',
  };

  for (const [prop, value] of Object.entries(templateSlugs)) {
    if (!value) continue; // not provided — skip
    const targetTool = PROP_TO_TOOL[prop];
    if (!targetTool) continue; // unknown prop — skip
    // Only validate if this slug is for the current tool
    if (targetTool !== toolSlug) continue;
    if (!isValidTemplateSlug(targetTool, value)) {
      return value;
    }
  }

  return null; // all valid
}
