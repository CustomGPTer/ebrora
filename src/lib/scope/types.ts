// =============================================================================
// Scope of Works Builder — Types
// =============================================================================

export type ScopeTemplateSlug =
  | 'corporate-blue'
  | 'formal-contract'
  | 'executive-navy';

export interface ScopeTemplateConfig {
  slug: ScopeTemplateSlug;
  displayName: string;
  tagline: string;
  description: string;
  font: string;
  accentColor: string;
  style: string;
  pageCount: string;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
}

// ── JSON structure the AI generates ─────────────────────────────
export interface ScopeInclusionItem {
  no: string;
  item: string;
  detail: string;
}

export interface ScopeExclusionItem {
  no: string;
  item: string;
  detail: string;
}

export interface ScopeAttendanceItem {
  item: string;
  providedBy: string;
  notes: string;
}

export interface ScopeInterfaceItem {
  interfaceWith: string;
  description: string;
  responsibility: string;
}

export interface ScopeDeliverableItem {
  document: string;
  requiredBy: string;
  format: string;
}

export interface ScopeInsuranceItem {
  type: string;
  minimumCover: string;
}

export interface ScopeOfWorksData {
  // Document control
  documentRef: string;
  issueDate: string;
  revision: string;
  projectName: string;
  siteAddress: string;
  client: string;
  principalContractor: string;
  subcontractor: string;
  discipline: string;
  preparedBy: string;

  // Contract basis
  contractForm: string;
  contractBasisNotes: string;
  contractDocuments: string[];

  // Technical sections (AI-generated, min 60 words)
  scopeOverview: string;
  inclusions: ScopeInclusionItem[];
  exclusions: ScopeExclusionItem[];
  designResponsibility: string;
  materialsEquipment: string;
  freeIssueItems: string;
  materialApprovalProcess: string;
  attendance: ScopeAttendanceItem[];
  programmeStart: string;
  programmeCompletion: string;
  workingHours: string;
  keyMilestones: string;
  programmeNotes: string;
  interfaces: ScopeInterfaceItem[];
  testingCommissioning: string;
  deliverables: ScopeDeliverableItem[];
  healthSafetyEnvironmental: string;

  // Commercial variables (AI extracts, boilerplate wraps)
  paymentBasis: string;
  paymentCycle: string;
  applicationDate: string;
  paymentDays: number;
  retentionPercent: number;
  retentionAtPC: number;
  defectsPeriod: string;
  latentDefectsYears: number;
  ladRate: string;
  bondPercent: number;
  bondDeliveryDays: number;
  insurance: ScopeInsuranceItem[];
  cisStatus: string;
  disputeNominatingBody: string;
  governingLaw: string;

  // Conditional sections (null if not applicable)
  groundConditions: string | null;
  priceEscalation: string | null;
  contaminationRisk: string | null;

  // Internal — set by generate route
  _scopeTemplateSlug?: ScopeTemplateSlug;
}
