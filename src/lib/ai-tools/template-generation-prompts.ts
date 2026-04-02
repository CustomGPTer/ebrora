// =============================================================================
// Remaining Tools — Template-Specific Generation Prompts
// scope-of-works, quote-generator, riddor-report, traffic-management,
// waste-management, invasive-species, wah-assessment, wbv-assessment
// =============================================================================

import type { ScopeTemplateSlug } from '@/lib/scope/types';
import type { QuoteTemplateSlug } from '@/lib/quote/types';
import type { RiddorTemplateSlug } from '@/lib/riddor/types';
import type { TrafficTemplateSlug } from '@/lib/traffic/types';
import type { WasteTemplateSlug } from '@/lib/waste/types';
import type { InvasiveTemplateSlug } from '@/lib/invasive/types';
import type { WahTemplateSlug } from '@/lib/wah/types';
import type { WbvTemplateSlug } from '@/lib/wbv/types';

function mw(base: number, factor: number): number {
  return Math.round(base * factor);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SCOPE OF WORKS
// ═══════════════════════════════════════════════════════════════════════════════
export function getScopeTemplateGenerationPrompt(templateSlug: ScopeTemplateSlug): string {
  const config: Record<ScopeTemplateSlug, { factor: number; tone: string }> = {
    'corporate-blue': { factor: 0.9, tone: 'Clean corporate style. Professional but efficient. Cover all key commercial protections without excessive legal elaboration.' },
    'formal-contract': { factor: 1.1, tone: 'Full legal contract precision. Maximum detail on clause references, sub-clause structure, legal protections, and back-to-back obligations. Reads like a document drafted by a contracts manager for NEC/JCT execution.' },
    'executive-navy': { factor: 1.0, tone: 'Contemporary executive style. Authoritative and comprehensive. Suitable for high-value packages and executive-level submissions.' },
  };
  const { factor, tone } = config[templateSlug];
  return `Generate a comprehensive Subcontractor Scope of Works JSON with the structure below.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

CRITICAL REQUIREMENTS:
- Technical sections: MINIMUM ${mw(60, factor)} words each.
- Commercial/legal sections: MINIMUM ${mw(40, factor)} words each.
- Inclusions: minimum ${mw(6, factor)} items. Exclusions: minimum ${mw(4, factor)} items. Interfaces: minimum 3 items. Deliverables: minimum ${mw(5, factor)} items.
- Attendance: minimum ${mw(6, factor)} items showing clear PC vs subcontractor split.
- Use precise UK construction terminology — CDM 2015, NEC4, JCT, PUWER, LOLER, COSHH, BS standards.
- Reference specific regulations and standards by name and number.
- All monetary values in GBP. All dates in DD/MM/YYYY format.

CONDITIONAL SECTIONS — include ONLY if relevant to the described works:
- groundConditions: Include for earthworks, piling, foundations, drainage, landscaping, demolition, or any excavation-heavy package. Set to null otherwise.
- priceEscalation: Include for programmes over 6 months or trades with volatile material costs (steel, copper, bituminous, timber). Set to null otherwise.
- contaminationRisk: Include for demolition, earthworks, refurbishment, brownfield sites, or works near watercourses. Set to null otherwise.

JSON STRUCTURE:
{
  "documentRef": "SOW-YYYY-NNN",
  "issueDate": "DD/MM/YYYY",
  "revision": "0",
  "projectName": "string",
  "siteAddress": "string",
  "client": "string",
  "principalContractor": "string",
  "subcontractor": "string (or 'To be confirmed')",
  "discipline": "string",
  "preparedBy": "string",
  "contractForm": "string (e.g. 'NEC4 ECS, Option A')",
  "contractBasisNotes": "string (min ${mw(120, factor)} words)",
  "contractDocuments": ["string array"],
  "scopeOverview": "string (min ${mw(200, factor)} words)",
  "inclusions": [{ "no": "1", "item": "string", "detail": "string (min ${mw(60, factor)} words)" }],
  "exclusions": [{ "no": "1", "item": "string", "detail": "string (min ${mw(60, factor)} words)" }],
  "designResponsibility": "string (min ${mw(120, factor)} words)",
  "materialsEquipment": "string (min ${mw(120, factor)} words)",
  "freeIssueItems": "string",
  "materialApprovalProcess": "string (min ${mw(80, factor)} words)",
  "attendance": [{ "item": "string", "providedBy": "string", "notes": "string" }],
  "programmeStart": "DD/MM/YYYY",
  "programmeCompletion": "DD/MM/YYYY",
  "workingHours": "string",
  "keyMilestones": "string",
  "programmeNotes": "string (min ${mw(100, factor)} words)",
  "interfaces": [{ "interfaceWith": "string", "description": "string", "responsibility": "string" }],
  "testingCommissioning": "string (min ${mw(120, factor)} words)",
  "deliverables": [{ "document": "string", "requiredBy": "string", "format": "string" }],
  "healthSafetyEnvironmental": "string (min ${mw(140, factor)} words)",
  "paymentBasis": "string",
  "paymentCycle": "string",
  "applicationDate": "string",
  "paymentDays": 30,
  "retentionPercent": 5,
  "retentionAtPC": 2.5,
  "defectsPeriod": "string",
  "latentDefectsYears": 6,
  "ladRate": "string",
  "bondPercent": 10,
  "bondDeliveryDays": 14,
  "insurance": [
    { "type": "Public Liability", "minimumCover": "£10,000,000" },
    { "type": "Employer's Liability", "minimumCover": "£10,000,000" },
    { "type": "Contractor's All Risks", "minimumCover": "Full reinstatement value" }
  ],
  "cisStatus": "string",
  "disputeNominatingBody": "string",
  "governingLaw": "string",
  "groundConditions": "string (min ${mw(80, factor)} words) or null",
  "priceEscalation": "string (min ${mw(80, factor)} words) or null",
  "contaminationRisk": "string (min ${mw(80, factor)} words) or null"
}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// QUOTE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
export function getQuoteTemplateGenerationPrompt(templateSlug: QuoteTemplateSlug): string {
  const config: Record<QuoteTemplateSlug, { factor: number; tone: string; minBoq: number; minIncl: number; minExcl: number }> = {
    'full-tender': { factor: 1.0, tone: 'Full Tier 1 tender submission standard. Maximum detail on scope, methodology, programme, HSE, and commercial terms. Reads like a winning tender return.', minBoq: 10, minIncl: 10, minExcl: 8 },
    'formal-contract': { factor: 0.85, tone: 'Formal contract quotation. Comprehensive scope and commercial terms suitable for NEC/JCT subcontract execution.', minBoq: 8, minIncl: 8, minExcl: 6 },
    'standard-quote': { factor: 0.65, tone: 'Professional standard quotation. Covers scope, price, and key commercial terms without excessive elaboration.', minBoq: 6, minIncl: 6, minExcl: 5 },
    'budget-estimate': { factor: 0.4, tone: 'Indicative budget estimate only. Key scope summary, headline price, major exclusions and assumptions. Clearly marked as budget/indicative — not a firm offer.', minBoq: 4, minIncl: 4, minExcl: 4 },
  };
  const { factor, tone, minBoq, minIncl, minExcl } = config[templateSlug];
  return `Generate a professional Subcontractor Quotation formatted to Tier 1 main contractor submission standards.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: QTN-YYYY-NNN)",
  "quotationDate": "DD/MM/YYYY",
  "validityPeriod": "string",
  "fromCompany": "string",
  "toCompany": "string",
  "projectName": "string",
  "projectAddress": "string",
  "tenderReference": "string",
  "contractForm": "string",
  "quotationSummary": "string (min ${mw(200, factor)} words)",
  "scopeOfWorks": "string (min ${mw(300, factor)} words)",
  "inclusions": ["string (minimum ${minIncl} specific inclusions)"],
  "exclusions": ["string (minimum ${minExcl} specific exclusions)"],
  "assumptions": ["string (minimum ${Math.round(minExcl)} key assumptions)"],
  "billOfQuantities": [
    { "item": "string", "description": "string", "unit": "string", "quantity": "number", "rate": "string (£)", "total": "string (£)" }
  ],
  "preliminaries": { "weeks": "number", "weeklyRate": "string (£)", "total": "string (£)", "narrative": "string" },
  "overheadsAndProfit": { "percentage": "string", "total": "string (£)" },
  "totalQuotationValue": "string (£)",
  "programme": { "startDate": "DD/MM/YYYY", "completionDate": "DD/MM/YYYY", "durationWeeks": "number", "programmeNarrative": "string (min ${mw(100, factor)} words)" },
  "paymentTerms": { "basis": "string", "applicationDate": "string", "paymentDays": "number", "retentionPercent": "number" },
  "healthSafetyEnvironmental": "string (min ${mw(200, factor)} words)",
  "qualifications": "string (min ${mw(150, factor)} words)",
  "organisationProfile": "string (min ${mw(100, factor)} words)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum ${minBoq} BoQ line items with realistic quantities. Minimum ${minIncl} inclusions. Minimum ${minExcl} exclusions.`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// RIDDOR REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function getRiddorTemplateGenerationPrompt(templateSlug: RiddorTemplateSlug): string {
  const config: Record<RiddorTemplateSlug, { factor: number; tone: string }> = {
    'formal-investigation': { factor: 1.0, tone: 'Full formal investigation report. HSE tribunal-ready. Maximum detail on root cause analysis, witness evidence, and corrective actions. References RIDDOR 2013 Schedules, HSWA 1974, and relevant ACOPs.' },
    'corporate': { factor: 0.7, tone: 'Corporate incident report. Professional and thorough but focused on key facts, immediate/underlying causes, and corrective actions. Suitable for client and company director review.' },
    'quick-notification': { factor: 0.4, tone: 'Rapid statutory notification. Essential facts for immediate HSE reporting within the required timeframe. Incident description, classification, and immediate actions only. Full investigation report to follow.' },
  };
  const { factor, tone } = config[templateSlug];
  return `Generate a RIDDOR Report compliant with the Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: RIDDOR-YYYY-NNN)",
  "reportDate": "DD/MM/YYYY",
  "reportedBy": "string",
  "reportedByTitle": "string",
  "projectName": "string",
  "siteAddress": "string",
  "principalContractor": "string",
  "client": "string",
  "riddorCategory": "Over-7-day injury | Specified injury | Dangerous occurrence | Occupational disease | Fatal",
  "riddorScheduleRef": "string (specific Schedule and paragraph reference)",
  "hseReferenceNumber": "string (or 'To be assigned')",
  "notificationDeadline": "string",
  "riddorJustification": "string (min ${mw(120, factor)} words)",
  "incidentDate": "DD/MM/YYYY",
  "incidentTime": "string",
  "incidentLocation": "string",
  "injuredPerson": { "name": "string", "employer": "string", "role": "string", "age": "string", "yearsExperience": "string" },
  "injuryDetails": { "injuryType": "string", "bodyPartAffected": "string", "treatmentProvided": "string", "hospitalAttendance": "boolean" },
  "incidentDescription": "string (min ${mw(350, factor)} words)",
  "immediateActions": ["string (minimum ${templateSlug === 'quick-notification' ? 3 : 5})"],
  "investigation": {
    "immediateCauses": ["string (min ${templateSlug === 'quick-notification' ? 2 : 3})"],
    "underlyingCauses": ["string (min ${templateSlug === 'quick-notification' ? 2 : 3})"],
    "rootCause": "string (min ${mw(180, factor)} words)"
  },
  "correctiveActions": [
    { "action": "string", "owner": "string", "dueDate": "DD/MM/YYYY", "status": "Open | In Progress | Complete", "priority": "Immediate | Short-term | Medium-term" }
  ],
  "lessonsLearned": "string (min ${mw(200, factor)} words)",
  "witnessStatementsSummary": "string (min ${mw(120, factor)} words)",
  "distributionList": ["string (minimum ${templateSlug === 'quick-notification' ? 3 : 4})"],
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum ${templateSlug === 'quick-notification' ? 3 : 5} corrective actions. The incident description must be a detailed factual narrative — not bullet points. Root cause analysis must go beyond surface-level causes.`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// TRAFFIC MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export function getTrafficTemplateGenerationPrompt(templateSlug: TrafficTemplateSlug): string {
  const config: Record<TrafficTemplateSlug, { factor: number; tone: string; minSigns: number; minRisks: number }> = {
    'full-chapter8': { factor: 1.0, tone: 'Full Chapter 8 compliant TMP. Maximum detail on sign schedules (TSRGD references), taper calculations, safety zones, and phasing. Suitable for highways authority approval and NRSWA S74 compliance.', minSigns: 8, minRisks: 5 },
    'formal-highways': { factor: 0.85, tone: 'Formal highways TMP. Comprehensive but focused on key Chapter 8 requirements. Suitable for Tier 1 submission and client review.', minSigns: 6, minRisks: 4 },
    'site-plan': { factor: 0.6, tone: 'Site-level traffic management plan. Covers internal site vehicle movements, pedestrian segregation, and delivery management. Less focus on public highway signage.', minSigns: 4, minRisks: 3 },
    'quick-brief': { factor: 0.35, tone: 'Quick traffic management briefing. Key hazards, vehicle routes, pedestrian routes, and emergency access. For daily briefings or minor works where a full TMP is disproportionate.', minSigns: 3, minRisks: 2 },
  };
  const { factor, tone, minSigns, minRisks } = config[templateSlug];
  return `Generate a Site Traffic Management Plan compliant with Chapter 8, HSG144, and the Safety at Street Works Code of Practice.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: TMP-YYYY-NNN)",
  "issueDate": "DD/MM/YYYY",
  "preparedBy": "string",
  "projectName": "string",
  "siteAddress": "string",
  "roadClassification": "string",
  "speedLimit": "string",
  "worksDescription": "string (min ${mw(250, factor)} words — reference Chapter 8 and HSG144)",
  "signSchedule": [
    { "signRef": "string (TSRGD diagram number)", "description": "string", "size": "string", "location": "string", "quantity": "number" }
  ],
  "phasingPlan": "string (min ${mw(200, factor)} words — taper lengths per Chapter 8 Table A1)",
  "vehicleManagement": "string (min ${mw(180, factor)} words — reference HSG144)",
  "pedestrianManagement": "string (min ${mw(150, factor)} words)",
  "emergencyAccess": "string (min ${mw(120, factor)} words)",
  "riskAssessment": [
    { "hazard": "string (min ${mw(60, factor)} words)", "risk": "string", "control": "string", "residualRisk": "string" }
  ],
  "operativeRoles": [{ "role": "string", "responsibilities": "string", "competencyRequired": "string" }],
  "communicationPlan": "string (min ${mw(120, factor)} words)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum ${minSigns} signs in schedule. Minimum ${minRisks} risk assessment entries. Minimum ${templateSlug === 'quick-brief' ? 2 : 4} operative roles.${templateSlug === 'full-chapter8' || templateSlug === 'formal-highways' ? ' Reference Chapter 8 and TSRGD numbers for all signs.' : ''}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// WASTE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export function getWasteTemplateGenerationPrompt(templateSlug: WasteTemplateSlug): string {
  const config: Record<WasteTemplateSlug, { factor: number; tone: string; minStreams: number }> = {
    'full-compliance': { factor: 1.0, tone: 'Full regulatory compliance SWMP. Maximum detail on EPA 1990 s.34, Waste Regs 2011, Hazardous Waste Regs 2005, duty of care chain, EWC codes, and waste hierarchy targets. Audit-ready.', minStreams: 6 },
    'corporate': { factor: 0.7, tone: 'Corporate waste management plan. Covers regulatory obligations, key waste streams, and targets without exhaustive legal detail.', minStreams: 4 },
    'site-record': { factor: 0.4, tone: 'Site-level waste record. Practical waste stream identification, skip arrangements, and transfer note management for site supervisors.', minStreams: 3 },
  };
  const { factor, tone, minStreams } = config[templateSlug];
  return `Generate a Site Waste Management Plan compliant with EPA 1990 s.34, the Waste (England and Wales) Regulations 2011, and the waste hierarchy.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: SWMP-YYYY-NNN)",
  "issueDate": "DD/MM/YYYY",
  "preparedBy": "string",
  "projectName": "string",
  "siteAddress": "string",
  "projectOverview": "string (min ${mw(200, factor)} words)",
  "regulatoryContext": "string (min ${mw(150, factor)} words — EPA 1990, Waste Regs 2011, Duty of Care Regs 1991, Hazardous Waste Regs 2005)",
  "wasteHierarchy": "string (min ${mw(200, factor)} words — prevention, reuse, recycling, recovery, disposal with measurable targets)",
  "wasteStreams": [
    { "stream": "string", "ewcCode": "string (6-digit)", "hazardous": "boolean", "estimatedQuantity": "string", "disposal": "string", "carrier": "string", "facility": "string" }
  ],
  "segregationPlan": "string (min ${mw(150, factor)} words)",
  "dutyOfCareChain": { "producer": "string", "carriers": [{ "name": "string", "licenceNumber": "string" }], "facilities": [{ "name": "string", "permitNumber": "string", "type": "string" }] },
  "transferNoteLog": "string (min ${mw(120, factor)} words)",
  "minimisationTargets": [{ "target": "string", "measure": "string", "deadline": "string" }],
  "monitoringSchedule": "string (min ${mw(120, factor)} words)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum ${minStreams} waste streams with EWC codes. Minimum ${templateSlug === 'site-record' ? 1 : 2} carriers. Minimum ${templateSlug === 'site-record' ? 1 : 2} facilities. Minimum ${templateSlug === 'site-record' ? 2 : 3} minimisation targets.${templateSlug === 'full-compliance' ? ' EWC codes must be realistic 6-digit codes for UK construction waste.' : ''}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// INVASIVE SPECIES
// ═══════════════════════════════════════════════════════════════════════════════
export function getInvasiveTemplateGenerationPrompt(templateSlug: InvasiveTemplateSlug): string {
  const config: Record<InvasiveTemplateSlug, { factor: number; tone: string }> = {
    'ecological-report': { factor: 1.0, tone: 'Full ecological management report. Maximum detail on legal framework (Wildlife & Countryside Act 1981 s.14, EPA 1990, Anti-social Behaviour Act 2014), species identification, treatment methodology, biosecurity, and completion criteria. Suitable for client submission and regulatory compliance.' },
    'site-management': { factor: 0.7, tone: 'Site management plan. Practical treatment methodology, exclusion zones, and operative instructions. Covers legal obligations without exhaustive ecological detail.' },
    'briefing-note': { factor: 0.4, tone: 'Operative briefing note. Species identification, what to do if found, legal consequences, and who to report to. For toolbox talk or site induction use.' },
  };
  const { factor, tone } = config[templateSlug];
  return `Generate an Invasive Species Management Plan compliant with the Wildlife & Countryside Act 1981 (Section 14) and the Environmental Protection Act 1990.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: ISMP-YYYY-NNN)",
  "issueDate": "DD/MM/YYYY",
  "preparedBy": "string",
  "projectName": "string",
  "siteAddress": "string",
  "speciesIdentified": [{ "species": "string", "commonName": "string", "location": "string", "extentDescription": "string", "identificationFeatures": "string (min ${mw(80, factor)} words)" }],
  "legalFramework": "string (min ${mw(200, factor)} words — Wildlife & Countryside Act 1981 s.14, EPA 1990, penalties)",
  "treatmentPlan": [{ "species": "string", "method": "string", "methodology": "string (min ${mw(150, factor)} words)", "timeline": "string", "contractor": "string" }],
  "biosecurityProtocol": "string (min ${mw(180, factor)} words — tool cleaning, boot wash, vehicle wash, contamination zones)",
  "exclusionZone": "string (min ${mw(60, factor)} words)",
  "monitoringSchedule": [{ "visitNumber": "number", "date": "string", "purpose": "string" }],
  "completionCriteria": "string (min ${mw(150, factor)} words — eradication definition, consecutive negative seasons, ecologist sign-off)",
  "operativeBriefing": "string (min ${mw(120, factor)} words — identification, legal consequences, dos and don'ts)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
${templateSlug === 'ecological-report' ? 'Legal framework must reference specific Acts and Sections. Treatment methodology must be species-appropriate. Monitoring schedule minimum 5 visits. Biosecurity protocol must be practical and enforceable.' : templateSlug === 'site-management' ? 'Monitoring schedule minimum 3 visits. Treatment methodology must be practical and actionable.' : 'Focus on identification and immediate reporting procedures.'}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// WAH ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════
export function getWahTemplateGenerationPrompt(templateSlug: WahTemplateSlug): string {
  const config: Record<WahTemplateSlug, { factor: number; tone: string; minHazards: number }> = {
    'full-compliance': { factor: 1.0, tone: 'Full WAH Regs 2005 compliance assessment. Maximum detail on hierarchy of control (Reg 6), rescue plan (Reg 9), equipment inspection, weather restrictions, and Schedules 1-6 references. HSE inspection-ready.', minHazards: 6 },
    'formal-hse': { factor: 0.85, tone: 'Formal HSE-style assessment. Comprehensive hierarchy of control analysis and rescue planning. Suitable for client HSE review.', minHazards: 5 },
    'site-ready': { factor: 0.6, tone: 'Site-ready assessment. Practical controls, equipment checks, and rescue arrangements for the specific task. Suitable for site supervisor briefing.', minHazards: 4 },
    'quick-check': { factor: 0.35, tone: 'Quick pre-task WAH check. Key hazards, critical controls, rescue method, and weather limits. For low-risk/short-duration WAH tasks where a full assessment is disproportionate.', minHazards: 3 },
  };
  const { factor, tone, minHazards } = config[templateSlug];
  return `Generate a Working at Height Risk Assessment compliant with the Work at Height Regulations 2005.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: WAH-YYYY-NNN)",
  "assessmentDate": "DD/MM/YYYY",
  "assessedBy": "string",
  "projectName": "string",
  "siteAddress": "string",
  "taskDescription": "string (min ${mw(250, factor)} words — reference WAH Regs 2005 Reg 4)",
  "workingHeight": "string",
  "accessMethod": "string",
  "accessJustification": "string (min ${mw(150, factor)} words — hierarchy of control under Reg 6)",
  "hierarchyOfControl": {
    "avoidance": "string (min ${mw(100, factor)} words — Reg 6(2))",
    "prevention": "string (min ${mw(150, factor)} words — Reg 6(3), Schedules 1-6)",
    "mitigation": "string (min ${mw(100, factor)} words — Reg 6(4))"
  },
  "riskMatrix": [
    { "hazard": "string (min ${mw(60, factor)} words)", "severity": "string", "likelihood": "string", "riskLevel": "string", "controlMeasures": "string (min ${mw(40, factor)} words)", "residualRisk": "string" }
  ],
  "equipmentRegister": [{ "item": "string", "inspectionDate": "string", "nextInspection": "string", "inspector": "string" }],
  "competencyRequirements": [{ "role": "string", "qualification": "string", "cardType": "string" }],
  "rescuePlan": "string (min ${mw(200, factor)} words — Reg 9, INDG401)",
  "weatherRestrictions": "string (min ${mw(120, factor)} words — Reg 4(1)(b), Schedule 4)",
  "emergencyProcedures": "string (min ${mw(150, factor)} words)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum ${minHazards} hazards in risk matrix. Minimum ${templateSlug === 'quick-check' ? 2 : 4} equipment items. Minimum ${templateSlug === 'quick-check' ? 2 : 3} competency requirements.${templateSlug === 'full-compliance' || templateSlug === 'formal-hse' ? ' Reference WAH Regs 2005 Schedule numbers where applicable.' : ''}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// WBV ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════
export function getWbvTemplateGenerationPrompt(templateSlug: WbvTemplateSlug): string {
  const config: Record<WbvTemplateSlug, { factor: number; tone: string }> = {
    'professional': { factor: 1.0, tone: 'Professional vibration assessment report. Full Control of Vibration at Work Regulations 2005 compliance. Detailed A(8) calculations, health surveillance programme (Reg 7), and control strategy. Suitable for HSE inspection and occupational health review.' },
    'compliance': { factor: 0.7, tone: 'Compliance-focused assessment. Covers regulatory requirements, exposure calculations, and key controls. Suitable for site safety file and client review.' },
    'site-practical': { factor: 0.45, tone: 'Site-practical assessment. Focus on which machines exceed EAV/ELV, maximum daily exposure times, and rotation schedules. For site supervisors managing daily plant operations.' },
  };
  const { factor, tone } = config[templateSlug];
  return `Generate a Whole Body Vibration Assessment compliant with the Control of Vibration at Work Regulations 2005.

TEMPLATE STYLE: ${templateSlug}
TONE: ${tone}

JSON structure:
{
  "documentRef": "string (format: WBV-YYYY-NNN)",
  "assessmentDate": "DD/MM/YYYY",
  "assessedBy": "string",
  "projectName": "string",
  "siteAddress": "string",
  "assessmentScope": "string (min ${mw(180, factor)} words — reference Control of Vibration at Work Regs 2005)",
  "regulatoryContext": "string (min ${mw(150, factor)} words — Regs 2005, HSE L140, EAV 0.5 m/s², ELV 1.15 m/s²)",
  "equipmentAssessments": [
    { "equipment": "string", "manufacturer": "string", "vibrationMagnitude": "string (m/s²)", "typicalDailyExposure": "string (hours)", "a8Calculation": "string (m/s²)", "exceedsEAV": "boolean", "exceedsELV": "boolean", "notes": "string" }
  ],
  "exposureSummary": "string (min ${mw(180, factor)} words — compare A(8) against EAV and ELV)",
  "controlMeasures": [{ "measure": "string", "detail": "string", "responsibility": "string" }],
  "controlNarrative": "string (min ${mw(200, factor)} words — rotation, speed restrictions, machine selection, seat maintenance)",
  "healthSurveillance": "string (min ${mw(180, factor)} words — Reg 7, Tier 1-3 assessments)",
  "actionPlan": [{ "action": "string", "owner": "string", "dueDate": "string", "priority": "string" }],
  "monitoringArrangements": "string (min ${mw(120, factor)} words)",
  "additionalNotes": "string (min ${mw(100, factor)} words)"
}
Minimum 2 equipment assessments. Minimum 4 control measures. Minimum 3 action plan items. A(8) calculations must be mathematically correct. Always state EAV (0.5 m/s²) and ELV (1.15 m/s²) explicitly.`;
}
