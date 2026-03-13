// =============================================================================
// RAMS Builder — Type Definitions
// =============================================================================

/** The 10 template slugs used internally */
export type TemplateSlug =
  | 'standard-5x5'
  | 'simple-hml'
  | 'tier1-formal'
  | 'cdm-compliant'
  | 'narrative'
  | 'principal-contractor'
  | 'compact'
  | 'rpn'
  | 'structured-checklist'
  | 'step-by-step';

/** Risk scoring method used by a template */
export type ScoringMethod = 'L_x_S' | 'HML' | 'L_x_S_x_D' | 'HML_INTEGRATED';

/** Template metadata for the picker UI and builder logic */
export interface TemplateConfig {
  slug: TemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  scoringMethod: ScoringMethod;
  thumbnailPath: string;
  previewPaths: string[];
  /** Unique sections this template contains (shown in picker detail) */
  keySections: string[];
}

/** Shape of the user's initial scope submission */
export interface RamsScopeInput {
  templateSlug: TemplateSlug;
  description: string; // max 100 words
}

/** A single AI-generated question */
export interface GeneratedQuestion {
  number: number;       // 1–20
  question: string;
  context?: string;     // optional helper text shown below the question
}

/** AI Call 1 response shape */
export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
}

/** A single answered question */
export interface AnsweredQuestion {
  number: number;
  question: string;
  answer: string; // max 45 words
}

/** Full input for AI Call 2 (document generation) */
export interface DocumentGenerationInput {
  templateSlug: TemplateSlug;
  description: string;
  answers: AnsweredQuestion[];
}

// =============================================================================
// AI Call 2 — Structured JSON output shapes per template
// =============================================================================

/** Common fields present in all template outputs */
export interface BaseDocumentContent {
  projectName: string;
  siteAddress: string;
  clientName: string;
  contractorName: string;
  documentRef: string;
  dateOfAssessment: string;
  reviewDate: string;
  preparedBy: string;
  taskDescription: string;
  sequenceOfWorks: string;          // min 500 words
  emergencyProcedures: string;
  ppeRequirements: string;
  welfareFacilities: string;
  environmentalConsiderations: string;
  wasteManagement: string;
  additionalNotes?: string;
}

/** Standard hazard row with L×S scoring */
export interface HazardRow_LxS {
  ref: string;
  hazard: string;
  whoAtRisk: string;
  likelihoodInitial: number;   // 1–5
  severityInitial: number;     // 1–5
  riskRatingInitial: number;   // L×S
  controlMeasures: string;
  likelihoodResidual: number;
  severityResidual: number;
  riskRatingResidual: number;
  additionalControls?: string;
}

/** HML hazard row */
export interface HazardRow_HML {
  ref: string;
  hazard: string;
  whoAtRisk: string;
  initialRisk: 'High' | 'Medium' | 'Low';
  controlMeasures: string;
  residualRisk: 'High' | 'Medium' | 'Low';
  responsiblePerson: string;
  monitoring: string;
}

/** RPN hazard row with L×S×D scoring */
export interface HazardRow_RPN {
  ref: string;
  hazard: string;
  whoAtRisk: string;
  likelihoodInitial: number;
  severityInitial: number;
  detectabilityInitial: number;
  rpnInitial: number;
  controlMeasures: string;
  detectionMethod: string;
  likelihoodResidual: number;
  severityResidual: number;
  detectabilityResidual: number;
  rpnResidual: number;
}

/** Integrated step row (Template 10) */
export interface IntegratedStepRow {
  stepNumber: number;
  workInstruction: string;
  hazards: string;
  whoAtRisk: string;
  initialRisk: 'High' | 'Medium' | 'Low';
  controlMeasures: string;
  residualRisk: 'High' | 'Medium' | 'Low';
  responsiblePerson: string;
  ppeForStep: string;
}

// --- Template-specific content interfaces ---

export interface Template01Content extends BaseDocumentContent {
  approvedBy: string;
  reviewedBy: string;
  workLocation: string;
  principalContractor: string;
  subcontractor: string;
  workingHours: string;
  workforceSize: string;
  hazards: HazardRow_LxS[];          // min 20 rows
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
  monitoringArrangements: string;
}

export interface Template02Content extends BaseDocumentContent {
  workArea: string;
  workingHours: string;
  workforceSize: string;
  trainingTickets: string;
  siteSetupAccess: string;
  hazards: HazardRow_HML[];
  housekeeping: string;
  competencyRequirements: string;
}

export interface Template03Content extends BaseDocumentContent {
  contractNumber: string;
  framework: string;
  workPackage: string;
  classification: string;
  nightWorks: string;
  checkedBy: string;
  hseAdvisor: string;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  relatedDocuments: Array<{ ref: string; title: string; status: string }>;
  rolesAndResponsibilities: Array<{ role: string; name: string; responsibility: string }>;
  workforceCompetency: Array<{ role: string; name: string; qualifications: string; inductionReqs: string }>;
  permitRequirements: Array<{ type: string; issuingAuthority: string; conditions: string }>;
  coshhSummary: Array<{ substance: string; hazardClass: string; controls: string; storage: string }>;
  liftingOperations: Array<{ appointedPerson: string; liftPlanRef: string; equipmentType: string; maxLoad: string; exclusionZone: string }>;
  hazards: HazardRow_LxS[];
  liftingMethod: string;
  trafficManagement: string;
  noiseVibrationControls: string;
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
  monitoringArrangements: string;
  reviewCloseOut: string;
  lessonsLearned: string;
}

export interface Template04Content extends BaseDocumentContent {
  dutyHolders: Array<{ role: string; organisation: string; contact: string }>;
  preConstructionInfo: Array<{ item: string; details: string }>;
  cdmRiskFlags: Array<{ category: string; applies: 'Yes' | 'No'; notes: string }>;
  designerResidualRisks: Array<{ risk: string; recommendation: string; contractorResponse: string; status: string }>;
  cppReferences: Array<{ document: string; reference: string }>;
  hazards: (HazardRow_LxS & { cdmCategory: string; cdmRef: string })[];
  residualRiskManagement: string;
  hsfContributions: string;
  workLocation: string;
  workingHours: string;
  workforceSize: string;
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
  monitoringArrangements: string;
}

export interface Template05Content extends BaseDocumentContent {
  introduction: string;
  worksOverview: string;
  locationSiteConditions: string;
  durationWorkingHours: string;
  workforceSupervision: string;
  competencyTrainingNarrative: string;
  permitsConsentsNarrative: string;
  hazards: (HazardRow_HML & { reviewNotes: string })[];
  sitePreparationAccess: string;
  siteSetUp: string;
  exclusionZones: string;
  environmentalNarrative: string;
  wasteNarrative: string;
  pollutionPrevention: string;
  emergencyNarrative: string;
  firstAid: string;
  welfareNarrative: string;
  keyContacts: Array<{ role: string; name: string; phone: string }>;
}

export interface Template06Content extends BaseDocumentContent {
  pcOrganisation: Array<{ role: string; name: string; contact: string; responsibility: string }>;
  subcontractorDetails: {
    name: string;
    address: string;
    supervisor: string;
    contact: string;
    scopeOfWorks: string;
    numberOfOperatives: string;
  };
  competencyVerification: Array<{ item: string; reference: string; verifiedBy: string; status: string }>;
  insuranceAccreditation: Array<{ type: string; policyNo: string; expiry: string; coverLevel: string }>;
  approvalChain: Array<{ stage: string; name: string; date: string; accepted: string }>;
  pcAmendments: Array<{ amendment: string; raisedBy: string; date: string; status: string }>;
  hazards: (HazardRow_LxS & { pcComment: string })[];
  pcSiteRulesCompliance: string;
  monitoringInspectionRegime: Array<{ check: string; frequency: string; carriedOutBy: string; recordLocation: string; escalation: string }>;
  workLocation: string;
  workingHours: string;
  workforceSize: string;
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
}

export interface Template07Content extends BaseDocumentContent {
  workArea: string;
  workingHours: string;
  workforceSize: string;
  resourcesPPE: string;
  hazards: HazardRow_HML[];
  keyHazardSummary: Array<{ hazard: string; criticalControl: string; stopWorkIf: string }>;
  coordinationCommunication: string;
  competencyRequirements: string;
}

export interface Template08Content extends BaseDocumentContent {
  workLocation: string;
  workingHours: string;
  workforceSize: string;
  hazards: HazardRow_RPN[];
  controlsEffectivenessReview: Array<{ control: string; targetRPN: number; actualRPN: number; reviewedBy: string; actionNotes: string }>;
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
  monitoringArrangements: string;
}

export interface Template09Content extends BaseDocumentContent {
  workLocation: string;
  workingHours: string;
  workforceSize: string;
  preStartChecklist: Array<{ item: string; checkedBy: string }>;
  hazards: (HazardRow_LxS & { checkRequired: string })[];
  holdPoints: Array<{ stageActivity: string; inspectionRequired: string; inspectedBy: string }>;
  taskSafetyChecklist: Array<{ item: string }>;
  closeDownChecklist: Array<{ item: string }>;
  temporaryWorks: string;
  communicationArrangements: string;
  competencyRequirements: string;
  monitoringArrangements: string;
}

export interface Template10Content extends BaseDocumentContent {
  workArea: string;
  workingHours: string;
  workforceSize: string;
  steps: IntegratedStepRow[];         // min 20 rows
  toolboxTalkSummary: Array<{ step: number; whatWeAreDoing: string; keyHazard: string; criticalControl: string }>;
  permitIsolationLog: Array<{ step: number; permitType: string; issuedBy: string; validityPeriod: string }>;
  interfaces: string;
  temporaryWorks: string;
  competencyRequirements: string;
}

/** Union of all template content types */
export type TemplateContent =
  | Template01Content
  | Template02Content
  | Template03Content
  | Template04Content
  | Template05Content
  | Template06Content
  | Template07Content
  | Template08Content
  | Template09Content
  | Template10Content;

// =============================================================================
// Generation record (maps to Prisma model)
// =============================================================================

export interface GenerationRecord {
  id: string;
  userId: string;
  templateSlug: TemplateSlug;
  description: string;
  questions: GeneratedQuestion[];
  answers: AnsweredQuestion[];
  blobUrl: string | null;
  status: 'QUESTIONS_GENERATED' | 'GENERATING_DOCUMENT' | 'COMPLETE' | 'FAILED';
  expiresAt: Date | null;
  createdAt: Date;
}
