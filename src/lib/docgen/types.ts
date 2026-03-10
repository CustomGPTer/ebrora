export interface RamsDocumentData {
  formatSlug: string;
  answers: Record<string, string>;
  generatedContent: GeneratedContent;
  companyName?: string;
  companyLogo?: Buffer;
  generationDate: Date;
}

export interface GeneratedContent {
  projectTitle: string;
  siteAddress: string;
  principalContractor: string;
  supervisor: string;
  activityDescription: string;
  hazards: HazardEntry[];
  controls: string[];
  methodStatementSteps: MethodStep[];
  ppeRequirements: string[];
  emergencyProcedures: string;
  additionalNotes: string;
  riskMatrix?: RiskMatrixEntry[];
  environmentalHazards?: EnvironmentalHazard[];
  fireWorksDetails?: FireWorksDetail;
  demolitionNotes?: string;
}

export interface HazardEntry {
  id: number;
  hazard: string;
  risk: string;
  likelihood: number;
  severity: number;
  riskRating: string;
  controls: string;
  residualLikelihood?: number;
  residualSeverity?: number;
  residualRiskRating?: string;
}

export interface MethodStep {
  stepNumber: number;
  description: string;
  responsiblePerson?: string;
  hazardsAddressed?: string[];
}

export interface EnvironmentalHazard {
  hazard: string;
  impact: string;
  mitigation: string;
}

export interface FireWorksDetail {
  hotWorkType: string;
  location: string;
  duration: string;
  fireWatchRequired: boolean;
  fireWatchDetails?: string;
}

export interface RiskMatrixEntry {
  likelihood: number;
  severity: number;
  rating: string;
  color: string;
}

export interface FormatConfig {
  slug: string;
  name: string;
  description: string;
  scoringType: 'matrix-5x5' | 'matrix-3x3' | 'hml' | 'tiered' | 'cdm' | 'informal';
  sections: SectionConfig[];
  hasRiskMatrix: boolean;
  hasResidualRisk: boolean;
  hasMethodStatement: boolean;
  hasEnvironmental: boolean;
  hasFirePermit: boolean;
  hasClientBranding: boolean;
  hasDemolition: boolean;
  riskScale: '5x5' | '3x3' | 'hml';
  headerColor: string;
  accentColor: string;
  isFree: boolean;
}

export interface SectionConfig {
  id: string;
  title: string;
  type: 'header' | 'info-table' | 'risk-assessment' | 'method-statement' | 'ppe' | 'emergency' | 'signatures' | 'risk-matrix' | 'environmental' | 'fire-permit' | 'checklist' | 'notes';
  required: boolean;
}
