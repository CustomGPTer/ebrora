// =============================================================================
// AI Tools — Post-Generation Content Validator
// Sits between the AI JSON response and the docx generator.
// Catches empty fields, placeholder text, arithmetic errors,
// contradictions, and data that exists in narrative but not in
// structured fields.
// =============================================================================

/**
 * Validation result — warnings are logged, errors block generation.
 */
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  /** The (possibly patched) content — mutations fix recoverable issues */
  content: Record<string, any>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively walk every string value in an object */
function walkStrings(
  obj: Record<string, any>,
  path: string,
  cb: (path: string, value: string, parent: Record<string, any>, key: string) => void,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') {
      cb(fullPath, value, obj, key);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') {
          cb(`${fullPath}[${i}]`, item, value as any, String(i));
        } else if (item && typeof item === 'object') {
          walkStrings(item, `${fullPath}[${i}]`, cb);
        }
      });
    } else if (value && typeof value === 'object') {
      walkStrings(value, fullPath, cb);
    }
  }
}

/** Recursively walk every array in an object */
function walkArrays(
  obj: Record<string, any>,
  path: string,
  cb: (path: string, value: any[], parent: Record<string, any>, key: string) => void,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (Array.isArray(value)) {
      cb(fullPath, value, obj, key);
    } else if (value && typeof value === 'object') {
      walkArrays(value, fullPath, cb);
    }
  }
}

// ── Rule 1: Strip "[No content provided]" placeholders ──────────────────────

function stripNoContentPlaceholders(content: Record<string, any>, warnings: string[]): void {
  walkStrings(content, '', (path, value, parent, key) => {
    if (/\[no content provided\]/i.test(value)) {
      warnings.push(`PLACEHOLDER: "${path}" contains "[No content provided]" — removed`);
      parent[key] = '';
    }
  });
}

// ── Rule 2: Strip duplicate word sequences ("working days working days") ────

function stripDuplicateWords(content: Record<string, any>, warnings: string[]): void {
  const pattern = /\b(\w+(?:\s+\w+)?)\s+\1\b/gi;
  walkStrings(content, '', (path, value, parent, key) => {
    if (pattern.test(value)) {
      const fixed = value.replace(pattern, '$1');
      if (fixed !== value) {
        warnings.push(`DUPLICATE: "${path}" had repeated words — fixed`);
        parent[key] = fixed;
      }
    }
  });
}

// ── Rule 3: Check for empty required fields in known schemas ────────────────

// Fields that MUST be populated if narrative/description contains the data
const RIDDOR_REQUIRED_FIELDS = [
  'incidentDetails.date',
  'incidentDetails.time',
  'incidentDetails.exactLocation',
  'incidentDetails.activityUnderway',
  'injuredPerson.occupation',
  'injuredPerson.natureOfInjury',
  'injuredPerson.bodyPartAffected',
  'riddorClassification',
];

const SAFETY_ALERT_REQUIRED = [
  'dateOfIncident',
  'classification',
  'severity',
  'site',
  'investigationLead',
];

const NCR_REQUIRED = [
  'dateRaised',
  'closeOutDueDate',
  'nonConformanceDescription',
  'rootCauseAnalysis',
];

const DAYWORK_REQUIRED = [
  'date',
  'contractRef',
  'contractor',
];

const CARBON_FOOTPRINT_REQUIRED = [
  'contractRef',
  'principalContractor',
  'contractor',
];

function getNestedValue(obj: Record<string, any>, dotPath: string): any {
  return dotPath.split('.').reduce((o, k) => o?.[k], obj);
}

function checkRequiredFields(
  content: Record<string, any>,
  toolSlug: string,
  warnings: string[],
): void {
  let fields: string[] = [];

  if (toolSlug === 'riddor-report') fields = RIDDOR_REQUIRED_FIELDS;
  else if (toolSlug === 'safety-alert') fields = SAFETY_ALERT_REQUIRED;
  else if (toolSlug === 'ncr') fields = NCR_REQUIRED;
  else if (toolSlug === 'daywork-sheet') fields = DAYWORK_REQUIRED;
  else if (toolSlug === 'carbon-footprint') fields = CARBON_FOOTPRINT_REQUIRED;

  for (const field of fields) {
    const val = getNestedValue(content, field);
    if (val === undefined || val === null || val === '' || val === '—') {
      warnings.push(`EMPTY_REQUIRED: "${field}" is empty or placeholder in ${toolSlug}`);
    }
  }
}

// ── Rule 4: Check arrays of objects have data rows (not just structure) ──────

function checkEmptyTableArrays(content: Record<string, any>, warnings: string[]): void {
  // Keys that commonly hold table data
  const tableKeys = [
    'hazards', 'controls', 'equipmentChecklist', 'equipmentCheck',
    'keyHazardsAndControls', 'equipmentAndExposureSummary',
    'operativeAcknowledgement', 'tmControls', 'tmLayoutControls',
    'operativeRoles', 'wasteStreams', 'skipLog', 'correctiveActions',
  ];

  walkArrays(content, '', (path, value, _parent, key) => {
    if (value.length === 0 && tableKeys.some(tk => key.toLowerCase().includes(tk.toLowerCase()))) {
      warnings.push(`EMPTY_TABLE: "${path}" is an empty array — table will have no data rows`);
    }
    // Check if all objects in array have all-empty/placeholder values
    if (value.length > 0 && typeof value[0] === 'object') {
      const allPlaceholder = value.every((item: any) =>
        Object.values(item).every(
          (v) => v === '' || v === '—' || v === 0 || v === null || v === undefined,
        ),
      );
      if (allPlaceholder) {
        warnings.push(`PLACEHOLDER_TABLE: "${path}" has ${value.length} rows but ALL values are empty/zero/placeholder`);
      }
    }
  });
}

// ── Rule 5: Arithmetic validation for commercial documents ──────────────────

function validateArithmetic(content: Record<string, any>, toolSlug: string, warnings: string[]): void {
  // Payment Application — retention check
  if (toolSlug === 'payment-application') {
    const gross = content.valuationSummary?.grossValuationTotal
      ?? content.grossValuationTotal
      ?? content.grossValuation;
    const retention = content.valuationSummary?.retention
      ?? content.retention;
    const materialsOnSite = content.valuationSummary?.materialsOnSite
      ?? content.materialsOnSite
      ?? 0;

    if (typeof gross === 'number' && typeof retention === 'number') {
      const retentionBase = gross - (typeof materialsOnSite === 'number' ? materialsOnSite : 0);
      const expected = retentionBase * 0.05;
      if (Math.abs(retention - expected) > 1) {
        warnings.push(
          `ARITHMETIC: Retention £${retention} ≠ 5% of £${retentionBase} (expected £${expected.toFixed(0)})`
        );
      }
    }
  }

  // Quotation — check amounts are calculated
  if (toolSlug === 'quote-generator') {
    const items = content.lineItems ?? content.priceSummary ?? [];
    if (Array.isArray(items)) {
      for (const item of items) {
        const qty = item.qty ?? item.quantity;
        const rate = item.rate ?? item.unitRate;
        const amount = item.amount ?? item.total;
        if (typeof qty === 'number' && typeof rate === 'number') {
          if (amount === undefined || amount === null || amount === '' || amount === '—') {
            item.amount = qty * rate;
            warnings.push(`ARITHMETIC: Calculated missing amount for "${item.description?.substring(0, 40)}..."`);
          }
        }
      }
    }
  }
}

// ── Rule 6: Data contradiction detection ────────────────────────────────────

function checkContradictions(content: Record<string, any>, toolSlug: string, warnings: string[]): void {
  // Invasive Species — "0 stands" vs body content about active species
  if (toolSlug === 'invasive-species') {
    const keyMsg = content.keyMessage ?? '';
    const bodyText = JSON.stringify(content).toLowerCase();
    if (/0\s*stands/i.test(keyMsg) && (bodyText.includes('exclusion zone') || bodyText.includes('do not enter'))) {
      warnings.push('CONTRADICTION: Key message says "0 stands" but body describes active exclusion zones');
    }
  }

  // Payment Application — CE status in table vs narrative
  if (toolSlug === 'payment-application') {
    const variations = content.variationsSchedule ?? content.variations ?? [];
    if (Array.isArray(variations)) {
      for (const v of variations) {
        if (v.status?.toLowerCase() === 'agreed' && (v.cumValue === 0 || v.cumAmount === 0 || v.cumAmount === '£0')) {
          warnings.push(`CONTRADICTION: Variation "${v.ref ?? v.voRef}" is "Agreed" but cumulative value = £0`);
        }
      }
    }
  }
}

// ── Rule 7: Populate structured fields from narrative (RIDDOR) ──────────────

function backPopulateFromNarrative(content: Record<string, any>, toolSlug: string, warnings: string[]): void {
  if (toolSlug !== 'riddor-report') return;

  const narrative = (content.incidentDescription ?? '').toLowerCase();
  if (!narrative || narrative.length < 50) return;

  // Extract date from narrative (e.g. "8 April 2026")
  if (!content.incidentDetails?.date || content.incidentDetails.date === '') {
    const dateMatch = narrative.match(
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
    );
    if (dateMatch && content.incidentDetails) {
      const months: Record<string, string> = {
        january: '01', february: '02', march: '03', april: '04',
        may: '05', june: '06', july: '07', august: '08',
        september: '09', october: '10', november: '11', december: '12',
      };
      const d = dateMatch[1].padStart(2, '0');
      const m = months[dateMatch[2].toLowerCase()] ?? '01';
      const y = dateMatch[3];
      content.incidentDetails.date = `${d}/${m}/${y}`;
      warnings.push(`BACKFILL: Extracted incidentDetails.date "${content.incidentDetails.date}" from narrative`);
    }
  }

  // Extract time from narrative (e.g. "14:15" or "approximately 14:15")
  if (!content.incidentDetails?.time || content.incidentDetails.time === '') {
    const timeMatch = narrative.match(/(\d{1,2}:\d{2})/);
    if (timeMatch && content.incidentDetails) {
      content.incidentDetails.time = timeMatch[1];
      warnings.push(`BACKFILL: Extracted incidentDetails.time "${content.incidentDetails.time}" from narrative`);
    }
  }

  // Extract injury type (e.g. "fractured wrist")
  if (content.injuredPerson && (!content.injuredPerson.natureOfInjury || content.injuredPerson.natureOfInjury === '')) {
    const injuryMatch = narrative.match(
      /(fractured|broken|lacerat|dislocat|burn|sprain|strain|crush|amputat)\w*\s+(wrist|arm|leg|hand|finger|ankle|foot|knee|shoulder|back|head|rib|collarbone)/i,
    );
    if (injuryMatch) {
      content.injuredPerson.natureOfInjury = `${injuryMatch[1]} ${injuryMatch[2]}`.replace(/^\w/, c => c.toUpperCase());
      content.injuredPerson.bodyPartAffected = injuryMatch[2].replace(/^\w/, c => c.toUpperCase());
      warnings.push(`BACKFILL: Extracted injury "${content.injuredPerson.natureOfInjury}" from narrative`);
    }
  }

  // Extract occupation (e.g. "Pipe Layer")
  if (content.injuredPerson && (!content.injuredPerson.occupation || content.injuredPerson.occupation === '')) {
    const occMatch = narrative.match(
      /a\s+(pipe\s*layer|banksman|scaffolder|labourer|electrician|fitter|welder|joiner|bricklayer|groundworker|operative|engineer|supervisor|foreman|crane\s*operator|driver)/i,
    );
    if (occMatch && content.injuredPerson) {
      content.injuredPerson.occupation = occMatch[1].replace(/^\w/, c => c.toUpperCase());
      warnings.push(`BACKFILL: Extracted occupation "${content.injuredPerson.occupation}" from narrative`);
    }
  }
}

// ── Rule 8: Auto-fill dates and replace placeholder dashes ─────────────────

function autoFillMetadata(content: Record<string, any>, toolSlug: string, warnings: string[]): void {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = `${dd}/${mm}/${yyyy}`;

  // Auto-fill date fields that are empty or '—'
  const dateFields = ['date', 'dateRaised', 'assessmentDate', 'planDate', 'reportDate', 'alertDate'];
  for (const field of dateFields) {
    if (content[field] === '—' || content[field] === '' || content[field] === undefined) {
      if (content[field] !== undefined || ['daywork-sheet', 'ncr', 'carbon-footprint'].includes(toolSlug)) {
        content[field] = todayStr;
        warnings.push(`AUTOFILL: Set "${field}" to today's date ${todayStr}`);
      }
    }
  }

  // Replace '—' with 'To be confirmed' for key metadata fields
  const tbcFields = ['contractRef', 'contract', 'contractor', 'principalContractor', 'instructionRef'];
  for (const field of tbcFields) {
    if (content[field] === '—' || content[field] === '') {
      content[field] = 'To be confirmed';
      warnings.push(`AUTOFILL: Set "${field}" to "To be confirmed"`);
    }
  }
}

// ── Main Validator ──────────────────────────────────────────────────────────

export function validateDocumentContent(
  toolSlug: string,
  content: Record<string, any>,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Deep clone to allow mutations
  const patched = JSON.parse(JSON.stringify(content));

  // Run all validation rules
  stripNoContentPlaceholders(patched, warnings);
  stripDuplicateWords(patched, warnings);
  checkRequiredFields(patched, toolSlug, warnings);
  checkEmptyTableArrays(patched, warnings);
  validateArithmetic(patched, toolSlug, warnings);
  checkContradictions(patched, toolSlug, warnings);
  backPopulateFromNarrative(patched, toolSlug, warnings);
  autoFillMetadata(patched, toolSlug, warnings);

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    content: patched,
  };
}
