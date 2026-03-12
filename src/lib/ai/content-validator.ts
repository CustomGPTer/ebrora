import type {
  GeneratedContent,
  HazardEntry,
  MethodStep,
  RiskMatrixEntry,
  EnvironmentalHazard,
  FireWorksDetail,
} from '@/lib/docgen/types';

/**
 * Default/fallback values for GeneratedContent
 */
const defaultContent: GeneratedContent = {
  projectTitle: 'Construction Project',
  siteAddress: 'Site Address',
  principalContractor: 'Principal Contractor',
  supervisor: 'Project Supervisor',
  activityDescription: 'Construction activity',
  hazards: [],
  controls: [],
  methodStatementSteps: [],
  ppeRequirements: [],
  emergencyProcedures: 'Emergency procedures to be determined',
  additionalNotes: '',
};

/**
 * Validates and sanitizes a hazard entry.
 * Ensures numeric fields are within valid ranges.
 */
function validateHazard(hazard: unknown, index: number): HazardEntry {
  if (!hazard || typeof hazard !== 'object') {
    return {
      id: index,
      hazard: `Hazard ${index}`,
      risk: 'Unknown',
      likelihood: 3,
      severity: 3,
      riskRating: 'MEDIUM',
      controls: 'Standard controls',
    };
  }

  const h = hazard as Record<string, unknown>;

  // Validate and cap numeric values to 1-5 range
  const likelihood = Math.max(
    1,
    Math.min(5, Math.floor(Number(h.likelihood) || 3))
  );
  const severity = Math.max(1, Math.min(5, Math.floor(Number(h.severity) || 3)));
  const residualLikelihood = h.residualLikelihood
    ? Math.max(1, Math.min(5, Math.floor(Number(h.residualLikelihood))))
    : undefined;
  const residualSeverity = h.residualSeverity
    ? Math.max(1, Math.min(5, Math.floor(Number(h.residualSeverity))))
    : undefined;

  // Calculate risk rating based on likelihood × severity
  const riskScore = likelihood * severity;
  let riskRating: string;

  if (riskScore <= 6) {
    riskRating = 'LOW';
  } else if (riskScore <= 15) {
    riskRating = 'MEDIUM';
  } else {
    riskRating = 'HIGH';
  }

  // Calculate residual risk rating if residual values provided
  let residualRiskRating: string | undefined;
  if (residualLikelihood && residualSeverity) {
    const residualScore = residualLikelihood * residualSeverity;
    if (residualScore <= 6) {
      residualRiskRating = 'LOW';
    } else if (residualScore <= 15) {
      residualRiskRating = 'MEDIUM';
    } else {
      residualRiskRating = 'HIGH';
    }
  }

  return {
    id: Math.max(0, Math.floor(Number(h.id) || index)),
    hazard: String(h.hazard || `Hazard ${index}`).substring(0, 500),
    risk: String(h.risk || 'Unknown risk').substring(0, 500),
    likelihood,
    severity,
    riskRating: h.riskRating ? String(h.riskRating) : riskRating,
    controls: String(h.controls || 'Standard controls').substring(0, 1000),
    residualLikelihood,
    residualSeverity,
    residualRiskRating,
  };
}

/**
 * Validates and sanitizes a method statement step.
 */
function validateMethodStep(step: unknown, stepNumber: number): MethodStep {
  if (!step || typeof step !== 'object') {
    return {
      stepNumber,
      description: `Step ${stepNumber}`,
      responsiblePerson: 'Site Supervisor',
      hazardsAddressed: [],
    };
  }

  const s = step as Record<string, unknown>;

  const hazardsAddressed = Array.isArray(s.hazardsAddressed)
    ? s.hazardsAddressed
        .map((h) => String(h).substring(0, 200))
        .filter((h) => h.length > 0)
    : [];

  return {
    stepNumber: Math.max(1, Math.floor(Number(s.stepNumber) || stepNumber)),
    description: String(
      s.description || `Step ${stepNumber}`
    ).substring(0, 1000),
    responsiblePerson: s.responsiblePerson
      ? String(s.responsiblePerson).substring(0, 200)
      : undefined,
    hazardsAddressed:
      hazardsAddressed.length > 0 ? hazardsAddressed : undefined,
  };
}

/**
 * Validates and sanitizes generated content from the AI.
 * Ensures all required fields exist with proper types and reasonable values.
 * @param raw - Raw parsed JSON from OpenAI
 * @returns Validated GeneratedContent
 */
export function validateGeneratedContent(raw: unknown): GeneratedContent {
  if (!raw || typeof raw !== 'object') {
    return defaultContent;
  }

  const r = raw as Record<string, unknown>;

  // Validate hazards array
  const hazards: HazardEntry[] = [];
  if (Array.isArray(r.hazards)) {
    r.hazards.forEach((h, index) => {
      hazards.push(validateHazard(h, index + 1));
    });
  }

  // Ensure at least one hazard exists
  if (hazards.length === 0) {
    hazards.push({
      id: 1,
      hazard: 'General construction hazards',
      risk: 'Injury or harm to personnel',
      likelihood: 3,
      severity: 3,
      riskRating: 'MEDIUM',
      controls: 'Standard construction safety controls and procedures',
    });
  }

  // Validate method statement steps
  const methodStatementSteps: MethodStep[] = [];
  if (Array.isArray(r.methodStatementSteps)) {
    r.methodStatementSteps.forEach((step, index) => {
      methodStatementSteps.push(validateMethodStep(step, index + 1));
    });
  }

  // Ensure steps are numbered sequentially
  methodStatementSteps.forEach((step, index) => {
    step.stepNumber = index + 1;
  });

  // Ensure at least one step exists
  if (methodStatementSteps.length === 0) {
    methodStatementSteps.push({
      stepNumber: 1,
      description: 'Conduct site induction and toolbox talk',
      responsiblePerson: 'Site Supervisor',
      hazardsAddressed: ['All'],
    });
  }

  // Validate controls array
  const controls: string[] = [];
  if (Array.isArray(r.controls)) {
    r.controls.forEach((c) => {
      const control = String(c).trim().substring(0, 300);
      if (control.length > 0) {
        controls.push(control);
      }
    });
  }

  // Validate PPE requirements
  const ppeRequirements: string[] = [];
  if (Array.isArray(r.ppeRequirements)) {
    r.ppeRequirements.forEach((p) => {
      const ppe = String(p).trim().substring(0, 200);
      if (ppe.length > 0) {
        ppeRequirements.push(ppe);
      }
    });
  }

  // Ensure at least basic PPE is specified
  if (ppeRequirements.length === 0) {
    ppeRequirements.push('Hard hat', 'Safety footwear', 'High-visibility vest');
  }

  return {
    projectTitle: String(r.projectTitle || defaultContent.projectTitle)
      .trim()
      .substring(0, 300),
    siteAddress: String(r.siteAddress || defaultContent.siteAddress)
      .trim()
      .substring(0, 500),
    principalContractor: String(
      r.principalContractor || defaultContent.principalContractor
    )
      .trim()
      .substring(0, 300),
    supervisor: String(r.supervisor || defaultContent.supervisor)
      .trim()
      .substring(0, 300),
    activityDescription: String(
      r.activityDescription || defaultContent.activityDescription
    )
      .trim()
      .substring(0, 1000),
    hazards,
    controls,
    methodStatementSteps,
    ppeRequirements,
    emergencyProcedures: String(
      r.emergencyProcedures || defaultContent.emergencyProcedures
    )
      .trim()
      .substring(0, 2000),
    additionalNotes: r.additionalNotes
      ? String(r.additionalNotes).trim().substring(0, 2000)
      : '',
    riskMatrix: Array.isArray(r.riskMatrix)
      ? (r.riskMatrix as unknown[]).slice(0, 100) as RiskMatrixEntry[]
      : undefined,
    environmentalHazards: Array.isArray(r.environmentalHazards)
      ? (r.environmentalHazards as unknown[]).slice(0, 50) as EnvironmentalHazard[]
      : undefined,
    fireWorksDetails: r.fireWorksDetails
      ? (r.fireWorksDetails as unknown) as FireWorksDetail
      : undefined,
    demolitionNotes: r.demolitionNotes
      ? String(r.demolitionNotes).trim().substring(0, 2000)
      : undefined,
  };
}
