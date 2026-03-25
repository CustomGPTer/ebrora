// =============================================================================
// Premium Templates — Remaining 12 new tools
// Each exported async function builds a Document for its tool.
// =============================================================================
import { Document, Paragraph, Table, TextRun, ShadingType } from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import * as p from './premium-template-engine';

const W = h.A4_CONTENT_WIDTH;

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMME CHECKER
// ─────────────────────────────────────────────────────────────────────────────
export async function buildProgrammeCheckerDocument(c: any): Promise<Document> {
  const ACCENT = '0F766E';

  const cover = {
    documentLabel: 'Programme Review Report',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.programmeTitle || 'Programme Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'PROGRAMME MANAGEMENT DOCUMENT',
    extraFields: [
      ['Programme Type',     c.programmeType                      || ''],
      ['Programme Period',   `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}`],
      ['Total Duration',     c.programmePeriod?.totalDuration      || ''],
      ['Overall RAG Rating', c.overallRagRating                   || ''],
    ] as [string, string][],
  };

  // Section 1 — Executive summary + metrics
  const s1: any[] = [
    ...p.proseSection('Executive Summary', c.overallSummary, ACCENT),
    ...p.infoSection('Programme Metrics', [
      { label: 'Total Activities',    value: c.programmeMetrics?.totalActivities    || 'Not available' },
      { label: 'Milestones',          value: c.programmeMetrics?.milestones          || 'Not available' },
      { label: 'Critical Activities', value: c.programmeMetrics?.criticalActivities || 'Not available' },
      { label: 'Average Float',       value: c.programmeMetrics?.averageFloat        || 'Not available' },
      { label: 'Open Ends',           value: c.programmeMetrics?.openEnds            || 'Not available' },
    ], ACCENT),
  ];

  // Section 2 — RAG review areas
  const s2: any[] = [p.sectionBand('Detailed Review by Area', ACCENT)];
  for (const area of (c.reviewAreas || [])) {
    s2.push(h.infoTable([
      { label: 'Review Area', value: area.area       || '' },
      { label: 'RAG Rating',  value: area.ragRating  || '' },
      { label: 'Score',       value: `${area.score || ''} / 10` },
    ], W));
    s2.push(h.spacer(60));
    s2.push(...h.prose(area.findings || ''));
    if (area.issues?.length) {
      s2.push(...p.bulletListSection('Issues Identified', area.issues, ACCENT));
    }
    if (area.recommendations?.length) {
      s2.push(...p.bulletListSection('Recommendations', area.recommendations, ACCENT));
    }
    s2.push(h.spacer(160));
  }

  // Section 3 — Critical issues & actions
  const s3: any[] = [
    ...p.dataTableSection('Critical Issues', c.criticalIssues || [], [
      { key: 'priority',       label: 'Priority',       width: Math.floor(W * 0.08) },
      { key: 'ragRating',      label: 'RAG',            width: Math.floor(W * 0.10) },
      { key: 'issue',          label: 'Issue',          width: Math.floor(W * 0.30) },
      { key: 'impact',         label: 'Impact',         width: Math.floor(W * 0.26) },
      { key: 'recommendation', label: 'Recommendation', width: W - Math.floor(W * 0.08) - Math.floor(W * 0.10) - Math.floor(W * 0.30) - Math.floor(W * 0.26) },
    ], ACCENT),
    ...p.dataTableSection('Recommended Actions', c.recommendedActions || [], [
      { key: 'action',      label: 'Action',      width: Math.floor(W * 0.55) },
      { key: 'priority',    label: 'Priority',    width: Math.floor(W * 0.25) },
      { key: 'responsible', label: 'Responsible', width: W - Math.floor(W * 0.55) - Math.floor(W * 0.25) },
    ], ACCENT),
  ];

  return p.buildPremiumDocument(cover, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOISE ASSESSMENT
// ─────────────────────────────────────────────────────────────────────────────
export async function buildNoiseAssessmentDocument(c: any): Promise<Document> {
  const ACCENT = '0369A1';

  const s1: any[] = [
    ...p.proseSection('Project Description', c.projectDescription, ACCENT),
    ...p.infoSection('Working Hours', [
      { label: 'Weekday (Mon–Fri)',   value: `${c.workingHours?.weekdayStart || ''} – ${c.workingHours?.weekdayFinish || ''}` },
      { label: 'Saturday',           value: `${c.workingHours?.saturdayStart || ''} – ${c.workingHours?.saturdayFinish || ''}` },
      { label: 'Sunday / Bank Hols', value: c.workingHours?.sundayBankHoliday || 'No works planned' },
      { label: 'BS 5228 Reference',  value: 'BS 5228-1:2009+A1:2014 Section 8' },
    ], ACCENT),
    ...p.dataTableSection('Plant Inventory & Source Noise Levels', c.plantInventory || [], [
      { key: 'plantItem',              label: 'Plant Item',          width: Math.floor(W * 0.32) },
      { key: 'bs5228AnnexCRef',        label: 'BS 5228 Annex C Ref', width: Math.floor(W * 0.18) },
      { key: 'swlDb',                  label: 'SWL dB(A)',           width: Math.floor(W * 0.12) },
      { key: 'typicalOperatingHours',  label: 'Operating Hrs/Day',   width: Math.floor(W * 0.18) },
      { key: 'notes',                  label: 'Notes',               width: W - Math.floor(W * 0.32) - Math.floor(W * 0.18) - Math.floor(W * 0.12) - Math.floor(W * 0.18) },
    ], ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Sensitive Receptors', c.sensitiveReceptors || [], [
      { key: 'receptorId',         label: 'Ref',          width: Math.floor(W * 0.08) },
      { key: 'description',        label: 'Description',  width: Math.floor(W * 0.28) },
      { key: 'type',               label: 'Type',         width: Math.floor(W * 0.16) },
      { key: 'approximateDistance',label: 'Distance (m)', width: Math.floor(W * 0.14) },
      { key: 'direction',          label: 'Direction',    width: Math.floor(W * 0.12) },
      { key: 'screeningFeatures',  label: 'Screening',    width: W - Math.floor(W * 0.08) - Math.floor(W * 0.28) - Math.floor(W * 0.16) - Math.floor(W * 0.14) - Math.floor(W * 0.12) },
    ], ACCENT),
    ...p.dataTableSection('Noise Predictions', c.noisePredictions || [], [
      { key: 'receptorId',          label: 'Receptor',    width: Math.floor(W * 0.08) },
      { key: 'activity',            label: 'Activity',    width: Math.floor(W * 0.22) },
      { key: 'predictionFormula',   label: 'Working',     width: Math.floor(W * 0.28) },
      { key: 'predictedLevel',      label: 'Predicted dB(A)', width: Math.floor(W * 0.14) },
      { key: 'backgroundNoiseLevel',label: 'Background',  width: Math.floor(W * 0.14) },
      { key: 'excessAboveBackground',label: 'Excess dB(A)',width: W - Math.floor(W * 0.08) - Math.floor(W * 0.22) - Math.floor(W * 0.28) - Math.floor(W * 0.14) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.dataTableSection('Impact Assessment', c.impactAssessment?.receptorAssessments || [], [
      { key: 'receptorId',    label: 'Receptor',         width: Math.floor(W * 0.10) },
      { key: 'predictedLevel',label: 'Predicted dB(A)',  width: Math.floor(W * 0.16) },
      { key: 'bs5228Category',label: 'BS 5228 Category', width: Math.floor(W * 0.28) },
      { key: 'impactRating',  label: 'Impact Rating',    width: Math.floor(W * 0.16) },
      { key: 'justification', label: 'Justification',    width: W - Math.floor(W * 0.10) - Math.floor(W * 0.16) - Math.floor(W * 0.28) - Math.floor(W * 0.16) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.dataTableSection('Mitigation Measures', c.mitigationMeasures || [], [
      { key: 'measure',            label: 'Measure',          width: Math.floor(W * 0.28) },
      { key: 'type',               label: 'Type',             width: Math.floor(W * 0.14) },
      { key: 'estimatedReduction', label: 'Est. Reduction',   width: Math.floor(W * 0.14) },
      { key: 'implementation',     label: 'Implementation',   width: W - Math.floor(W * 0.28) - Math.floor(W * 0.14) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.proseSection('Vibration Assessment', c.vibrationAssessment?.assessmentNarrative, ACCENT),
    ...p.proseSection('Monitoring Requirements', `Monitoring recommended: ${c.monitoringRequirements?.monitoringRecommended ? 'Yes' : 'No'}\nFrequency: ${c.monitoringRequirements?.frequency || ''}\nTrigger Level: ${c.monitoringRequirements?.triggerLevel || ''} dB(A)\nEquipment: ${c.monitoringRequirements?.equipment || ''}`, ACCENT),
    ...p.proseSection('Complaints Management', c.complaintsManagement, ACCENT),
    ...p.proseSection('Conclusions', c.conclusions, ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Construction Noise Assessment',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.siteAddress,
    preparedBy: c.assessedBy,
    date: c.assessmentDate,
    classification: 'ENVIRONMENTAL ASSESSMENT',
    extraFields: [['Standard', 'BS 5228-1:2009+A1:2014'], ['Overall Impact', c.impactAssessment?.overallImpact || '']],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function buildQuoteGeneratorDocument(c: any): Promise<Document> {
  const ACCENT = '065F46';

  const s1: any[] = [
    ...p.infoSection('Tender Particulars', [
      { label: 'Quotation Reference',  value: c.documentRef          || '' },
      { label: 'Date',                 value: c.quotationDate         || '' },
      { label: 'Valid Until',          value: c.validUntil            || '' },
      { label: 'Project Name',         value: c.projectName           || '' },
      { label: 'Project Address',      value: c.projectAddress        || '' },
      { label: 'Client',               value: c.client                || '' },
      { label: 'Main Contractor',      value: c.mainContractor        || '' },
      { label: 'Tender Reference',     value: c.tenderReference       || '' },
      { label: 'Tender Return Date',   value: c.tenderReturnDate      || '' },
      { label: 'Prepared By',          value: c.preparedBy            || '' },
    ], ACCENT),
    ...p.proseSection('Quotation Summary', c.quotationSummary, ACCENT),
    ...p.proseSection('Scope of Works', c.scopeOfWorks, ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Bill of Quantities', c.billOfQuantities || [], [
      { key: 'ref',         label: 'Ref',         width: Math.floor(W * 0.07) },
      { key: 'description', label: 'Description', width: Math.floor(W * 0.40) },
      { key: 'unit',        label: 'Unit',        width: Math.floor(W * 0.08) },
      { key: 'quantity',    label: 'Qty',         width: Math.floor(W * 0.10) },
      { key: 'rate',        label: 'Rate (£)',    width: Math.floor(W * 0.16) },
      { key: 'amount',      label: 'Amount (£)',  width: W - Math.floor(W * 0.07) - Math.floor(W * 0.40) - Math.floor(W * 0.08) - Math.floor(W * 0.10) - Math.floor(W * 0.16) },
    ], ACCENT),
    ...p.infoSection('Price Summary', [
      { label: 'Original Contract Sum', value: c.priceSummary?.originalContractSum || '' },
      { label: 'Provisional Sums',      value: c.priceSummary?.provisionalSums      || '' },
      { label: 'Daywork Allowance',     value: c.priceSummary?.dayworkAllowance     || '' },
      { label: 'TOTAL TENDER SUM',      value: c.priceSummary?.totalTenderSum       || '' },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.bulletListSection('Inclusions', c.inclusions || [], ACCENT),
    ...p.bulletListSection('Exclusions', c.exclusions || [], ACCENT),
    ...p.bulletListSection('Assumptions & Qualifications', c.assumptions || [], ACCENT),
  ];

  const s4: any[] = [
    p.sectionBand('Programme', ACCENT),
    h.infoTable([
      { label: 'Proposed Start Date', value: c.programme?.proposedStartDate || '' },
      { label: 'Duration',            value: c.programme?.duration           || '' },
      { label: 'Completion Date',     value: c.programme?.completionDate     || '' },
    ], W),
    h.spacer(80),
    ...h.prose(c.programme?.programmeNarrative || ''),
    ...p.dataTableSection('Key Milestones', c.programme?.keyMilestones || [], [
      { key: 'milestone',   label: 'Milestone',   width: Math.floor(W * 0.70) },
      { key: 'targetDate',  label: 'Target Date', width: W - Math.floor(W * 0.70) },
    ], ACCENT),
    ...p.infoSection('Commercial Terms', [
      { label: 'Payment Terms',         value: c.commercialTerms?.paymentTerms           || '' },
      { label: 'Retention Rate',        value: c.commercialTerms?.retentionRate           || '' },
      { label: 'Defects Period',        value: c.commercialTerms?.defectsLiabilityPeriod || '' },
      { label: 'Retention Release',     value: c.commercialTerms?.retentionRelease        || '' },
      { label: 'Insurance',             value: c.commercialTerms?.insuranceRequirements   || '' },
      { label: 'Contract Basis',        value: c.commercialTerms?.contractualBasis        || '' },
    ], ACCENT),
    ...p.proseSection('Health, Safety & Environmental', c.healthSafetyEnvironmental, ACCENT),
    ...p.proseSection('Qualifications', c.qualifications, ACCENT),
    ...p.proseSection('Company Profile', c.organisationProfile, ACCENT),
    ...p.signatureBlock([{ role: 'Authorised Signatory', name: c.preparedBy || '' }], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Subcontractor Quotation',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.projectAddress,
    preparedBy: c.preparedBy,
    date: c.quotationDate,
    classification: 'COMMERCIAL IN CONFIDENCE',
    extraFields: [['Main Contractor', c.mainContractor || ''], ['Total Tender Sum', c.priceSummary?.totalTenderSum || '']],
  }, [s1, s2, s3, s4]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY ALERT — Inline title, no separate cover page
// ─────────────────────────────────────────────────────────────────────────────
export async function buildSafetyAlertDocument(c: any): Promise<Document> {
  const ACCENT = 'DC2626';

  const s1: any[] = [
    // Prominent alert headline banner
    new Paragraph({
      spacing: { before: 0, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: ACCENT },
      children: [
        new TextRun({
          text: `  ${c.alertHeadline || 'SAFETY ALERT'}  `,
          bold: true,
          size: 26,
          font: 'Arial',
          color: p.P_WHITE,
        }),
      ],
    }),
    ...p.infoSection('Alert Details', [
      { label: 'Alert Reference',    value: c.documentRef         || '' },
      { label: 'Date',               value: c.alertDate            || '' },
      { label: 'Classification',     value: c.alertClassification  || '' },
      { label: 'Category',           value: c.alertCategory        || '' },
      { label: 'Project / Site',     value: `${c.projectName || ''}${c.siteAddress ? ' — ' + c.siteAddress : ''}` },
      { label: 'Prepared By',        value: c.preparedBy           || '' },
      { label: 'Approved By',        value: c.approvedBy           || '' },
    ], ACCENT),
    ...p.proseSection('Incident Summary', c.incidentSummary, ACCENT),
    ...p.infoSection('What Happened', [
      { label: 'Location',         value: c.whatHappened?.location          || '' },
      { label: 'Date',             value: c.whatHappened?.date              || '' },
      { label: 'Time',             value: c.whatHappened?.time              || '' },
      { label: 'Weather',          value: c.whatHappened?.weather           || '' },
      { label: 'Activity',         value: c.whatHappened?.activityUnderway  || '' },
      { label: 'Persons Involved', value: c.whatHappened?.personsInvolved   || '' },
      { label: 'Outcome',          value: c.whatHappened?.outcome           || '' },
    ], ACCENT),
  ];

  const s2: any[] = [
    ...p.proseSection('Potential Consequences', c.potentialConsequences, ACCENT),
    p.sectionBand('Immediate Causes', ACCENT),
    ...((c.immediateCauses || []) as any[]).flatMap((item: any) =>
      [...p.priorityItem('●', item.cause || '', item.detail || '', ACCENT), h.spacer(60)]
    ),
    p.sectionBand('Underlying Factors', ACCENT),
    ...((c.underlyingFactors || []) as any[]).flatMap((item: any) =>
      [...p.priorityItem('●', item.factor || '', item.detail || '', ACCENT), h.spacer(60)]
    ),
    ...p.bulletListSection('Immediate Actions Taken', c.immediateActionsTaken || [], ACCENT),
  ];

  const s3: any[] = [
    p.sectionBand('Lessons Learned', ACCENT),
    ...((c.lessonsLearned || []) as any[]).flatMap((item: any) =>
      [...p.priorityItem('●', item.lesson || '', item.detail || '', ACCENT), h.spacer(60)]
    ),
    ...p.dataTableSection('Preventive Actions — What You Must Do', c.preventiveActions || [], [
      { key: 'action',       label: 'Action',           width: Math.floor(W * 0.38) },
      { key: 'who',          label: 'Responsible',      width: Math.floor(W * 0.18) },
      { key: 'when',         label: 'When',             width: Math.floor(W * 0.18) },
      { key: 'howToVerify',  label: 'How to Verify',    width: W - Math.floor(W * 0.38) - Math.floor(W * 0.18) - Math.floor(W * 0.18) },
    ], ACCENT),
    ...p.proseSection('Regulatory Context', c.regulatoryContext, ACCENT),
    ...p.proseSection('Distribution Instructions', c.distributionInstructions, ACCENT),
    p.sectionBand('Briefing Record', ACCENT),
    h.briefingRecordTable(15, W),
  ];

  return p.buildPremiumDocumentInline({
    documentLabel: 'Safety Alert Bulletin',
    accentHex: ACCENT,
    classification: `${c.alertClassification || 'HIGH RISK'} — DISTRIBUTE IMMEDIATELY`,
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARBON FOOTPRINT
// ─────────────────────────────────────────────────────────────────────────────
export async function buildCarbonFootprintDocument(c: any): Promise<Document> {
  const ACCENT = '166534';

  const s1: any[] = [
    ...p.infoSection('Assessment Basis', [
      { label: 'Methodology',      value: c.methodology     || 'ICE v3.2' },
      { label: 'Scope Boundary',   value: c.scopeBoundary   || 'A1–A5 per PAS 2080:2023' },
      { label: 'Assessed By',      value: c.assessedBy      || '' },
      { label: 'Assessment Date',  value: c.assessmentDate  || '' },
    ], ACCENT),
    ...p.proseSection('Project Description', c.projectDescription, ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Materials Carbon (A1–A3)', c.materialsCarbonA1A3 || [], [
      { key: 'material',          label: 'Material',          width: Math.floor(W * 0.26) },
      { key: 'quantity',          label: 'Quantity',          width: Math.floor(W * 0.12) },
      { key: 'iceV32Factor',      label: 'ICE v3.2 Factor',   width: Math.floor(W * 0.16) },
      { key: 'totalCarbonTCO2e',  label: 'tCO₂e',             width: Math.floor(W * 0.12) },
      { key: 'notes',             label: 'Notes',             width: W - Math.floor(W * 0.26) - Math.floor(W * 0.12) - Math.floor(W * 0.16) - Math.floor(W * 0.12) },
    ], ACCENT),
    ...p.dataTableSection('Transport (A4)', c.transportA4 || [], [
      { key: 'material',         label: 'Material',   width: Math.floor(W * 0.24) },
      { key: 'mass',             label: 'Mass (t)',   width: Math.floor(W * 0.12) },
      { key: 'distance',         label: 'Dist (km)',  width: Math.floor(W * 0.12) },
      { key: 'vehicleType',      label: 'Vehicle',    width: Math.floor(W * 0.20) },
      { key: 'totalCarbonTCO2e', label: 'tCO₂e',      width: W - Math.floor(W * 0.24) - Math.floor(W * 0.12) - Math.floor(W * 0.12) - Math.floor(W * 0.20) },
    ], ACCENT),
    ...p.dataTableSection('Construction Process — Plant Fuel (A5)', c.constructionProcessA5?.plantFuelUse || [], [
      { key: 'plantItem',          label: 'Plant Item',         width: Math.floor(W * 0.28) },
      { key: 'operatingHours',     label: 'Hours',              width: Math.floor(W * 0.12) },
      { key: 'estimatedFuelLitres',label: 'Fuel (litres)',      width: Math.floor(W * 0.16) },
      { key: 'totalCarbonTCO2e',   label: 'tCO₂e',              width: W - Math.floor(W * 0.28) - Math.floor(W * 0.12) - Math.floor(W * 0.16) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.infoSection('Carbon Summary', [
      { label: 'Materials (A1–A3)',           value: `${c.carbonSummary?.materialsCarbonTCO2e         || '—'} tCO₂e` },
      { label: 'Transport (A4)',              value: `${c.carbonSummary?.transportCarbonTCO2e          || '—'} tCO₂e` },
      { label: 'Construction Process (A5)',   value: `${c.carbonSummary?.constructionProcessCarbonTCO2e || '—'} tCO₂e` },
      { label: 'Waste',                       value: `${c.carbonSummary?.wasteCarbonTCO2e              || '—'} tCO₂e` },
      { label: 'TOTAL GROSS CARBON',          value: `${c.carbonSummary?.totalGrossCarbonTCO2e         || '—'} tCO₂e` },
    ], ACCENT),
    ...p.proseSection('Hotspot Analysis', c.hotspotAnalysis, ACCENT),
    ...p.dataTableSection('Carbon Reduction Opportunities', c.carbonReductionOpportunities || [], [
      { key: 'opportunity',            label: 'Opportunity',    width: Math.floor(W * 0.28) },
      { key: 'category',               label: 'Category',       width: Math.floor(W * 0.14) },
      { key: 'estimatedSaving',        label: 'Est. Saving',    width: Math.floor(W * 0.14) },
      { key: 'implementationDifficulty',label: 'Difficulty',    width: Math.floor(W * 0.12) },
      { key: 'detail',                 label: 'Detail',         width: W - Math.floor(W * 0.28) - Math.floor(W * 0.14) - Math.floor(W * 0.14) - Math.floor(W * 0.12) },
    ], ACCENT),
    ...p.proseSection('Limitations & Assumptions', c.assessmentLimitations, ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Construction Carbon Footprint Assessment',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.siteAddress,
    preparedBy: c.assessedBy,
    date: c.assessmentDate,
    classification: 'ENVIRONMENTAL ASSESSMENT — ICE v3.2',
    extraFields: [['Total Gross Carbon', `${c.carbonSummary?.totalGrossCarbonTCO2e || '—'} tCO₂e`]],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// RAMS REVIEW
// ─────────────────────────────────────────────────────────────────────────────
export async function buildRamsReviewDocument(c: any): Promise<Document> {
  const ACCENT = 'B91C1C';

  const s1: any[] = [
    ...p.infoSection('Document Details', [
      { label: 'Original Document Title',    value: c.originalDocumentTitle    || '' },
      { label: 'Original Document Ref',      value: c.originalDocumentRef      || '' },
      { label: 'Original Revision',          value: c.originalDocumentRevision || '' },
      { label: 'Original Document Date',     value: c.originalDocumentDate     || '' },
      { label: 'Review Date',                value: c.reviewDate               || '' },
      { label: 'Reviewed By',               value: c.reviewedBy               || '' },
    ], ACCENT),
    ...p.proseSection('Document Overview', c.documentOverview, ACCENT),
    ...p.infoSection('Scope Assessment', [
      { label: 'Works Described', value: c.scopeAssessment?.worksDescribed || '' },
      { label: 'Adequacy',        value: c.scopeAssessment?.adequacy        || '' },
    ], ACCENT),
    ...h.prose(c.scopeAssessment?.findings || ''),
    ...p.bulletListSection('Scope Gaps', c.scopeAssessment?.gaps || [], ACCENT),
  ];

  const s2: any[] = [
    ...p.infoSection('Risk Assessment', [
      { label: 'Overall Adequacy',              value: c.riskAssessmentReview?.overallAdequacy                || '' },
      { label: 'Hierarchy of Control Applied',  value: c.riskAssessmentReview?.hierarchyOfControlApplied     || '' },
      { label: 'Risk Rating Methodology',       value: c.riskAssessmentReview?.riskRatingMethodology          || '' },
    ], ACCENT),
    ...h.prose(c.riskAssessmentReview?.findings || ''),
    ...p.dataTableSection('Risk Assessment Gaps', c.riskAssessmentReview?.specificGaps || [], [
      { key: 'hazardArea',    label: 'Hazard Area',    width: Math.floor(W * 0.28) },
      { key: 'gap',           label: 'Gap Identified', width: Math.floor(W * 0.36) },
      { key: 'recommendation',label: 'Recommendation', width: W - Math.floor(W * 0.28) - Math.floor(W * 0.36) },
    ], ACCENT),
    ...p.infoSection('Method Statement', [
      { label: 'Overall Adequacy',         value: c.methodStatementReview?.overallAdequacy        || '' },
      { label: 'Sequencing Clarity',       value: c.methodStatementReview?.sequencingClarity      || '' },
      { label: 'Plant & Equipment Covered',value: c.methodStatementReview?.plantAndEquipmentCovered|| '' },
    ], ACCENT),
    ...h.prose(c.methodStatementReview?.findings || ''),
    ...p.dataTableSection('Method Statement Gaps', c.methodStatementReview?.specificGaps || [], [
      { key: 'section',       label: 'Section',        width: Math.floor(W * 0.24) },
      { key: 'gap',           label: 'Gap',            width: Math.floor(W * 0.38) },
      { key: 'recommendation',label: 'Recommendation', width: W - Math.floor(W * 0.24) - Math.floor(W * 0.38) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.dataTableSection('Regulatory Compliance', c.regulatoryComplianceReview || [], [
      { key: 'legislation',    label: 'Legislation',    width: Math.floor(W * 0.30) },
      { key: 'status',         label: 'Status',         width: Math.floor(W * 0.16) },
      { key: 'finding',        label: 'Finding',        width: Math.floor(W * 0.28) },
      { key: 'recommendation', label: 'Recommendation', width: W - Math.floor(W * 0.30) - Math.floor(W * 0.16) - Math.floor(W * 0.28) },
    ], ACCENT),
    ...p.dataTableSection('Priority Recommendations', c.priorityRecommendations || [], [
      { key: 'priority',        label: '#',             width: Math.floor(W * 0.06) },
      { key: 'criticality',     label: 'Criticality',   width: Math.floor(W * 0.28) },
      { key: 'finding',         label: 'Finding',       width: Math.floor(W * 0.28) },
      { key: 'recommendation',  label: 'Recommendation',width: W - Math.floor(W * 0.06) - Math.floor(W * 0.28) - Math.floor(W * 0.28) },
    ], ACCENT),
    p.sectionBand('Overall Review Rating', ACCENT),
    h.infoTable([{ label: 'Rating', value: c.overallRating?.rating || '' }], W),
    h.spacer(80),
    ...h.prose(c.overallRating?.summary || ''),
    ...p.signatureBlock([
      { role: 'Reviewer',    name: c.reviewedBy || '' },
      { role: 'Approved By', name: '' },
    ], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'RAMS Review Report',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.originalDocumentTitle || 'RAMS Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'HEALTH & SAFETY DOCUMENT REVIEW',
    extraFields: [['Overall Rating', c.overallRating?.rating || '']],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DELAY NOTIFICATION LETTER
// ─────────────────────────────────────────────────────────────────────────────
export async function buildDelayNotificationDocument(c: any): Promise<Document> {
  const ACCENT = '1E40AF';

  const s1: any[] = [
    ...p.infoSection('Letter Particulars', [
      { label: 'Reference',             value: c.documentRef          || '' },
      { label: 'Date',                  value: c.letterDate            || '' },
      { label: 'From',                  value: c.fromParty             || '' },
      { label: 'To',                    value: c.toParty               || '' },
      { label: 'Project',               value: c.projectName           || '' },
      { label: 'Contract Reference',    value: c.contractReference     || '' },
      { label: 'Contract Form',         value: c.contractForm          || '' },
      { label: 'Notification Clause',   value: c.notificationClause    || '' },
    ], ACCENT),
    p.sectionBand('Subject', ACCENT),
    ...h.prose(c.letterSubject || ''),
    ...p.proseSection('Opening', c.openingParagraph, ACCENT),
    ...p.proseSection('Event Description', c.eventDescription, ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Affected Programme Activities', c.affectedActivities || [], [
      { key: 'activityRef',   label: 'Activity',        width: Math.floor(W * 0.28) },
      { key: 'originalDate',  label: 'Original Date',   width: Math.floor(W * 0.16) },
      { key: 'revisedDate',   label: 'Revised Date',    width: Math.floor(W * 0.16) },
      { key: 'delayDays',     label: 'Delay (days)',    width: Math.floor(W * 0.12) },
      { key: 'criticalPath',  label: 'Critical Path',   width: Math.floor(W * 0.12) },
      { key: 'notes',         label: 'Notes',           width: W - Math.floor(W * 0.28) - Math.floor(W * 0.16) - Math.floor(W * 0.16) - Math.floor(W * 0.12) - Math.floor(W * 0.12) },
    ], ACCENT),
    ...p.infoSection('Extension of Time', [
      { label: 'Estimated Extension', value: c.estimatedExtensionOfTime || '' },
    ], ACCENT),
    ...p.proseSection('Programme Impact', c.programmeImpact, ACCENT),
    ...p.proseSection('Mitigation Measures', c.mitigationMeasures, ACCENT),
    ...p.proseSection('Contractual Entitlement', c.contractualEntitlement, ACCENT),
    ...p.infoSection('Cost Entitlement', [
      { label: 'Claimed',                  value: c.costEntitlement?.claimed                  || '' },
      { label: 'Estimated Additional Cost',value: c.costEntitlement?.estimatedAdditionalCost  || '' },
    ], ACCENT),
    ...h.prose(c.costEntitlement?.costNarrative || ''),
    ...p.proseSection('Required Response', c.requestedResponse, ACCENT),
    ...p.dataTableSection('Supporting Documents', c.supportingDocuments || [], [
      { key: 'document',  label: 'Document',  width: Math.floor(W * 0.45) },
      { key: 'reference', label: 'Reference', width: Math.floor(W * 0.30) },
      { key: 'status',    label: 'Status',    width: W - Math.floor(W * 0.45) - Math.floor(W * 0.30) },
    ], ACCENT),
    ...p.proseSection('Closing', c.closingParagraph, ACCENT),
    ...p.signatureBlock([{ role: 'Signed', name: c.fromParty || '' }], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Delay Notification Letter',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.projectAddress,
    preparedBy: c.fromParty,
    date: c.letterDate,
    classification: 'COMMERCIAL — CONTRACTUAL NOTICE',
    extraFields: [['Contract Form', c.contractForm || ''], ['Notification Clause', c.notificationClause || '']],
  }, [s1, s2]);
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIATION CONFIRMATION LETTER
// ─────────────────────────────────────────────────────────────────────────────
export async function buildVariationConfirmationDocument(c: any): Promise<Document> {
  const ACCENT = '0F766E';

  const s1: any[] = [
    ...p.infoSection('Letter Particulars', [
      { label: 'Reference',          value: c.documentRef       || '' },
      { label: 'Date',               value: c.letterDate         || '' },
      { label: 'From',               value: c.fromParty          || '' },
      { label: 'To',                 value: c.toParty            || '' },
      { label: 'Project',            value: c.projectName        || '' },
      { label: 'Contract Reference', value: c.contractReference  || '' },
      { label: 'Contract Form',      value: c.contractForm       || '' },
    ], ACCENT),
    p.sectionBand('Subject', ACCENT),
    ...h.prose(c.letterSubject || ''),
    ...p.proseSection('Opening', c.openingParagraph, ACCENT),
    ...p.infoSection('Verbal Instruction Details', [
      { label: 'Instructed By',      value: c.verbalInstructionDetails?.instructedBy      || '' },
      { label: 'Instructing Party',  value: c.verbalInstructionDetails?.instructingParty  || '' },
      { label: 'Date of Instruction',value: c.verbalInstructionDetails?.dateOfInstruction || '' },
      { label: 'Time',               value: c.verbalInstructionDetails?.timeOfInstruction || '' },
      { label: 'Location',           value: c.verbalInstructionDetails?.locationOfInstruction || '' },
      { label: 'Witnesses',          value: c.verbalInstructionDetails?.witnessesPresent  || '' },
    ], ACCENT),
    ...p.proseSection('Description of Variation', c.descriptionOfVariation, ACCENT),
  ];

  const s2: any[] = [
    ...p.infoSection('Works Status', [
      { label: 'Works Started',        value: c.worksStatus?.worksStarted    ? 'Yes' : 'No' },
      { label: 'Work Complete',        value: c.worksStatus?.workComplete    ? 'Yes' : 'No' },
      { label: 'Progress',             value: c.worksStatus?.progressDescription || '' },
      { label: 'Materials Ordered',    value: c.worksStatus?.materialsOrdered? 'Yes' : 'No' },
      { label: 'Materials Detail',     value: c.worksStatus?.materialsDetail  || '' },
    ], ACCENT),
    ...p.infoSection('Estimated Cost Impact', [
      { label: 'Estimated Total Cost',     value: c.estimatedCostImpact?.estimatedTotalCost     || '' },
      { label: 'Labour Cost',              value: c.estimatedCostImpact?.labourCost              || '' },
      { label: 'Plant Cost',               value: c.estimatedCostImpact?.plantCost               || '' },
      { label: 'Materials Cost',           value: c.estimatedCostImpact?.materialsCost           || '' },
      { label: 'Overheads & Profit',       value: c.estimatedCostImpact?.overheadsAndProfit      || '' },
    ], ACCENT),
    ...h.prose(c.estimatedCostImpact?.costBreakdownNarrative || ''),
    ...p.infoSection('Estimated Time Impact', [
      { label: 'Time Impact Claimed',   value: c.estimatedTimeImpact?.timeImpactClaimed   || '' },
      { label: 'Estimated Delay (days)',value: c.estimatedTimeImpact?.estimatedDelayDays  || '' },
    ], ACCENT),
    ...h.prose(c.estimatedTimeImpact?.timeImpactNarrative || ''),
    ...p.proseSection('Contractual Entitlement', c.contractualEntitlement, ACCENT),
    ...p.proseSection('Request for Written Instruction', c.requestForWrittenInstruction, ACCENT),
    ...p.dataTableSection('Supporting Documents', c.supportingDocuments || [], [
      { key: 'document',  label: 'Document',  width: Math.floor(W * 0.45) },
      { key: 'reference', label: 'Reference', width: Math.floor(W * 0.30) },
      { key: 'status',    label: 'Status',    width: W - Math.floor(W * 0.45) - Math.floor(W * 0.30) },
    ], ACCENT),
    ...p.proseSection('Closing', c.closingParagraph, ACCENT),
    ...p.signatureBlock([{ role: 'Signed', name: c.fromParty || '' }], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Variation Confirmation Letter',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    preparedBy: c.fromParty,
    date: c.letterDate,
    classification: 'COMMERCIAL — CONTRACTUAL NOTICE',
    extraFields: [['Contract Form', c.contractForm || '']],
  }, [s1, s2]);
}

// ─────────────────────────────────────────────────────────────────────────────
// RFI GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function buildRfiGeneratorDocument(c: any): Promise<Document> {
  const ACCENT = '1D4ED8';

  const s1: any[] = [
    ...p.infoSection('RFI Particulars', [
      { label: 'RFI Reference',        value: c.documentRef            || '' },
      { label: 'Date',                 value: c.rfiDate                 || '' },
      { label: 'Required Response Date',value: c.requiredResponseDate   || '' },
      { label: 'Raised By',            value: c.raisedBy               || '' },
      { label: 'Directed To',          value: c.directedTo             || '' },
      { label: 'Project',              value: c.projectName            || '' },
      { label: 'Contract Reference',   value: c.contractReference      || '' },
      { label: 'Contractual Reference',value: c.contractualReference   || '' },
    ], ACCENT),
    p.sectionBand('Subject', ACCENT),
    ...h.prose(c.rfiSubject || ''),
    ...p.proseSection('Query Summary', c.querySummary, ACCENT),
    ...p.dataTableSection('Relevant Documents', c.relevantDocuments || [], [
      { key: 'documentType', label: 'Type',      width: Math.floor(W * 0.14) },
      { key: 'reference',    label: 'Reference', width: Math.floor(W * 0.20) },
      { key: 'revision',     label: 'Rev',       width: Math.floor(W * 0.08) },
      { key: 'title',        label: 'Title',     width: Math.floor(W * 0.30) },
      { key: 'relevance',    label: 'Relevance', width: W - Math.floor(W * 0.14) - Math.floor(W * 0.20) - Math.floor(W * 0.08) - Math.floor(W * 0.30) },
    ], ACCENT),
  ];

  const s2: any[] = [
    ...p.proseSection('Detailed Question', c.detailedQuestion, ACCENT),
    ...p.proseSection('Background & Context', c.background, ACCENT),
    ...(c.proposedSolution?.proposed ? p.proseSection('Proposed Solution', c.proposedSolution.description, ACCENT) : []),
    p.sectionBand('Programme Implication', ACCENT),
    h.infoTable([
      { label: 'Latest Response Date for No Impact', value: c.programmeImplication?.latestResponseDateForNoImpact || '' },
    ], W),
    h.spacer(80),
    ...p.bulletListSection('Activities at Risk', c.programmeImplication?.activitiesAtRisk || [], ACCENT),
    ...h.prose(c.programmeImplication?.programmeNarrative || ''),
    ...p.proseSection('Impact of Non-Response', c.impactOfNonResponse, ACCENT),
    ...p.proseSection('Response Format Required', c.responseFormat, ACCENT),
    ...p.bulletListSection('Distribution', c.distribution || [], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Request for Information (RFI)',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.projectAddress,
    preparedBy: c.raisedBy,
    date: c.rfiDate,
    classification: 'TECHNICAL INFORMATION REQUEST',
    extraFields: [['Required Response Date', c.requiredResponseDate || ''], ['Directed To', c.directedTo || '']],
  }, [s1, s2]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT APPLICATION
// ─────────────────────────────────────────────────────────────────────────────
export async function buildPaymentApplicationDocument(c: any): Promise<Document> {
  const ACCENT = '064E3B';

  const s1: any[] = [
    ...p.infoSection('Application Particulars', [
      { label: 'Application Number',       value: c.applicationNumber       || '' },
      { label: 'Valuation Date',           value: c.valuationDate            || '' },
      { label: 'Submitted By',             value: c.submittedBy              || '' },
      { label: 'Submitted To',             value: c.submittedTo              || '' },
      { label: 'Project',                  value: c.projectName              || '' },
      { label: 'Contract Reference',       value: c.contractReference        || '' },
      { label: 'Original Contract Sum',    value: c.originalContractSum      || '' },
    ], ACCENT),
    ...p.infoSection('HGCRA Payment Dates', [
      { label: 'Due Date for Payment',     value: c.paymentDates?.dueDateForPayment     || '' },
      { label: 'Final Date for Payment',   value: c.paymentDates?.finalDateForPayment   || '' },
      { label: 'Pay Less Notice Deadline', value: c.paymentDates?.payLessNoticeDeadline || '' },
    ], ACCENT),
    ...h.prose(c.paymentDates?.hgcraBasis || ''),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Bill of Quantities Schedule', c.boqSchedule || [], [
      { key: 'ref',                    label: 'Ref',        width: Math.floor(W * 0.06) },
      { key: 'description',            label: 'Description',width: Math.floor(W * 0.26) },
      { key: 'unit',                   label: 'Unit',       width: Math.floor(W * 0.06) },
      { key: 'contractSum',            label: 'Contract £', width: Math.floor(W * 0.12) },
      { key: 'cumulativeQuantity',     label: 'Cum Qty',    width: Math.floor(W * 0.10) },
      { key: 'cumulativeValue',        label: 'Cum £',      width: Math.floor(W * 0.12) },
      { key: 'percentComplete',        label: '% Complete', width: W - Math.floor(W * 0.06) - Math.floor(W * 0.26) - Math.floor(W * 0.06) - Math.floor(W * 0.12) - Math.floor(W * 0.10) - Math.floor(W * 0.12) },
    ], ACCENT),
    ...p.dataTableSection('Materials on Site', c.materialsOnSite || [], [
      { key: 'description', label: 'Description', width: Math.floor(W * 0.36) },
      { key: 'quantity',    label: 'Quantity',    width: Math.floor(W * 0.16) },
      { key: 'value',       label: 'Value (£)',   width: Math.floor(W * 0.16) },
      { key: 'evidenceRef', label: 'Evidence',    width: W - Math.floor(W * 0.36) - Math.floor(W * 0.16) - Math.floor(W * 0.16) },
    ], ACCENT),
    ...p.dataTableSection('Variations Schedule', c.variationsSchedule || [], [
      { key: 'voRef',             label: 'VO Ref',    width: Math.floor(W * 0.12) },
      { key: 'description',       label: 'Description',width: Math.floor(W * 0.30) },
      { key: 'status',            label: 'Status',    width: Math.floor(W * 0.14) },
      { key: 'agreedValue',       label: 'Value (£)', width: Math.floor(W * 0.14) },
      { key: 'thisApplication',   label: 'This App £',width: Math.floor(W * 0.14) },
      { key: 'cumulative',        label: 'Cum £',     width: W - Math.floor(W * 0.12) - Math.floor(W * 0.30) - Math.floor(W * 0.14) - Math.floor(W * 0.14) - Math.floor(W * 0.14) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.infoSection('Valuation Summary', [
      { label: 'Gross Valuation — Original Contract', value: c.valuationSummary?.grossValuationOriginalContract || '' },
      { label: 'Materials on Site',                   value: c.valuationSummary?.materialsOnSite               || '' },
      { label: 'Approved Variations',                 value: c.valuationSummary?.approvedVariations            || '' },
      { label: 'Preliminaries',                       value: c.valuationSummary?.preliminaries                 || '' },
      { label: 'GROSS VALUATION TOTAL',               value: c.valuationSummary?.grossValuationTotal           || '' },
      { label: 'Less: Retention',                     value: c.valuationSummary?.lessRetention                 || '' },
      { label: 'Net Valuation',                       value: c.valuationSummary?.netValuation                  || '' },
      { label: 'Less: CIS Deduction',                 value: c.valuationSummary?.lessCISDeduction              || '' },
      { label: 'Less: Previous Certified',            value: c.valuationSummary?.lessPreviousCertified         || '' },
      { label: 'AMOUNT DUE THIS APPLICATION',         value: c.valuationSummary?.amountDueThisApplication      || '' },
      { label: 'In Words',                            value: c.valuationSummary?.amountDueInWords              || '' },
    ], ACCENT),
    ...p.proseSection('Supporting Narrative', c.supportingNarrative, ACCENT),
    ...p.bulletListSection('Supporting Documents Enclosed', c.supportingDocumentsList || [], ACCENT),
    ...p.signatureBlock([
      { role: 'Submitted By', name: c.submittedBy || '' },
      { role: 'Received By',  name: '' },
    ], ACCENT),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Interim Payment Application',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.projectAddress,
    preparedBy: c.submittedBy,
    date: c.valuationDate,
    classification: 'COMMERCIAL IN CONFIDENCE',
    extraFields: [
      ['Application Number', c.applicationNumber || ''],
      ['Amount Due This Application', c.valuationSummary?.amountDueThisApplication || ''],
    ],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DAYWORK SHEET
// ─────────────────────────────────────────────────────────────────────────────
export async function buildDayworkSheetDocument(c: any): Promise<Document> {
  const ACCENT = '92400E';

  const s1: any[] = [
    ...p.infoSection('Daywork Details', [
      { label: 'Daywork Reference',     value: c.documentRef                 || '' },
      { label: 'Date of Works',         value: c.dayworkDate                  || '' },
      { label: 'Submission Date',       value: c.submissionDate               || '' },
      { label: 'Project',               value: c.projectName                  || '' },
      { label: 'Main Contractor',       value: c.mainContractor               || '' },
      { label: 'Subcontractor',         value: c.subcontractor                || '' },
      { label: 'Instructed By',         value: c.instructionDetails?.instructedBy     || '' },
      { label: 'Instruction Method',    value: c.instructionDetails?.instructionMethod || '' },
      { label: 'Instruction Reference', value: c.instructionDetails?.instructionRef   || '' },
      { label: 'Instruction Date',      value: c.instructionDetails?.instructionDate  || '' },
    ], ACCENT),
    ...p.proseSection('Activity Description', c.activityDescription, ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Labour Record', c.labourRecord || [], [
      { key: 'name',           label: 'Name / Trade',   width: Math.floor(W * 0.20) },
      { key: 'grade',          label: 'Grade',          width: Math.floor(W * 0.14) },
      { key: 'startTime',      label: 'Start',          width: Math.floor(W * 0.10) },
      { key: 'finishTime',     label: 'Finish',         width: Math.floor(W * 0.10) },
      { key: 'hoursWorked',    label: 'Hrs',            width: Math.floor(W * 0.08) },
      { key: 'overtimeHours',  label: 'OT Hrs',         width: Math.floor(W * 0.08) },
      { key: 'standardRate',   label: 'Rate (£/hr)',    width: Math.floor(W * 0.14) },
      { key: 'grossLabourCost',label: 'Gross Cost (£)', width: W - Math.floor(W * 0.20) - Math.floor(W * 0.14) - Math.floor(W * 0.10) - Math.floor(W * 0.10) - Math.floor(W * 0.08) - Math.floor(W * 0.08) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.dataTableSection('Plant Record', c.plantRecord || [], [
      { key: 'plantItem',        label: 'Plant Item',       width: Math.floor(W * 0.26) },
      { key: 'owned',            label: 'Owned / Hired',    width: Math.floor(W * 0.14) },
      { key: 'hoursOnSite',      label: 'On Site',          width: Math.floor(W * 0.10) },
      { key: 'hoursProductive',  label: 'Productive',       width: Math.floor(W * 0.10) },
      { key: 'cecaScheduleRate', label: 'CECA Rate (£/hr)', width: Math.floor(W * 0.16) },
      { key: 'grossPlantCost',   label: 'Gross Cost (£)',   width: W - Math.floor(W * 0.26) - Math.floor(W * 0.14) - Math.floor(W * 0.10) - Math.floor(W * 0.10) - Math.floor(W * 0.16) },
    ], ACCENT),
    ...p.dataTableSection('Materials & Consumables', c.materialsRecord || [], [
      { key: 'description',      label: 'Description',     width: Math.floor(W * 0.28) },
      { key: 'unit',             label: 'Unit',            width: Math.floor(W * 0.08) },
      { key: 'quantity',         label: 'Qty',             width: Math.floor(W * 0.08) },
      { key: 'invoiceCost',      label: 'Invoice Cost',    width: Math.floor(W * 0.14) },
      { key: 'markup',           label: 'Markup %',        width: Math.floor(W * 0.10) },
      { key: 'totalMaterialsCost',label: 'Total (£)',      width: W - Math.floor(W * 0.28) - Math.floor(W * 0.08) - Math.floor(W * 0.08) - Math.floor(W * 0.14) - Math.floor(W * 0.10) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.infoSection('Daywork Summary', [
      { label: 'Gross Labour',                       value: c.dayworkSummary?.grossLabour               || '' },
      { label: 'Labour Increases & Additions (CECA)',value: c.dayworkSummary?.labourIncreasesAndAdditions || '' },
      { label: 'Gross Plant',                        value: c.dayworkSummary?.grossPlant                || '' },
      { label: 'Gross Materials',                    value: c.dayworkSummary?.grossMaterials            || '' },
      { label: 'Supervision',                        value: c.dayworkSummary?.supervision               || '' },
      { label: 'Sub-Total',                          value: c.dayworkSummary?.subtotal                  || '' },
      { label: 'Overheads & Profit',                 value: c.dayworkSummary?.overheadsAndProfit        || '' },
      { label: 'TOTAL DAYWORK VALUE',                value: c.dayworkSummary?.totalDayworkValue         || '' },
      { label: 'Total in Words',                     value: c.dayworkSummary?.totalDayworkInWords       || '' },
    ], ACCENT),
    ...p.proseSection('CECA Schedule Notes', c.cecaScheduleNotes, ACCENT),
    p.sectionBand('Signature & Countersignature', ACCENT),
    h.approvalTable([
      { role: 'Submitted By (Subcontractor)',  name: c.signatureBlock?.submittedBy?.name || '' },
      { role: 'Received By (Main Contractor)', name: '' },
    ], W),
    h.spacer(80),
    ...h.prose(c.signatureBlock?.notes || ''),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Daywork Sheet',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.projectAddress,
    preparedBy: c.subcontractor,
    date: c.dayworkDate,
    classification: 'CECA SCHEDULE OF DAYWORKS 2011',
    extraFields: [
      ['Main Contractor', c.mainContractor || ''],
      ['Total Daywork Value', c.dayworkSummary?.totalDayworkValue || ''],
    ],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARBON REDUCTION PLAN
// ─────────────────────────────────────────────────────────────────────────────
export async function buildCarbonReductionPlanDocument(c: any): Promise<Document> {
  const ACCENT = '166534';

  const s1: any[] = [
    ...p.infoSection('Organisation', [
      { label: 'Organisation Name',        value: c.organisationName         || '' },
      { label: 'Address',                  value: c.organisationAddress      || '' },
      { label: 'Companies House Number',   value: c.companiesHouseNumber     || '' },
      { label: 'Publication Date',         value: c.publicationDate          || '' },
      { label: 'Review Date',              value: c.reviewDate               || '' },
    ], ACCENT),
    ...p.proseSection('Organisation Description', c.organisationDescription, ACCENT),
    p.sectionBand('Net Zero Commitment (PPN 06/21 Mandatory)', ACCENT),
    ...h.prose(c.netZeroCommitment?.commitment || ''),
    h.spacer(80),
    h.infoTable([
      { label: 'Net Zero Target Year',  value: c.netZeroCommitment?.targetYear      || '' },
      { label: '2030 Interim Target',   value: c.netZeroCommitment?.interimTarget2030 || '' },
      { label: 'SBTi Aligned',          value: c.netZeroCommitment?.alignedWithSBTi ? 'Yes' : 'No' },
    ], W),
    h.spacer(80),
    ...h.prose(c.netZeroCommitment?.governanceStatement || ''),
  ];

  const s2: any[] = [
    p.sectionBand('Baseline Emissions', ACCENT),
    h.infoTable([
      { label: 'Baseline Year',            value: c.baselineEmissions?.baselineYear            || '' },
      { label: 'Scope 1 Baseline',         value: `${c.baselineEmissions?.baselineScope1        || '—'} tCO₂e` },
      { label: 'Scope 2 Baseline',         value: `${c.baselineEmissions?.baselineScope2        || '—'} tCO₂e` },
      { label: 'Scope 3 Baseline',         value: `${c.baselineEmissions?.baselineScope3        || '—'} tCO₂e` },
      { label: 'Total Baseline UK Ops',    value: `${c.baselineEmissions?.totalBaselineUKOperations || '—'} tCO₂e` },
    ], W),
    h.spacer(80),
    ...h.prose(c.baselineEmissions?.baselineNarrative || ''),
    p.sectionBand('Current Emissions', ACCENT),
    h.infoTable([
      { label: 'Reporting Year',      value: c.currentEmissions?.reportingYear           || '' },
      { label: 'Scope 1 Total',       value: `${c.currentEmissions?.scope1?.total         || '—'} tCO₂e` },
      { label: 'Scope 2 Total',       value: `${c.currentEmissions?.scope2?.total         || '—'} tCO₂e (${c.currentEmissions?.scope2?.method || ''})` },
      { label: 'Scope 3 Total',       value: `${c.currentEmissions?.scope3?.total         || '—'} tCO₂e` },
      { label: 'TOTAL CURRENT',       value: `${c.currentEmissions?.totalCurrentEmissions || '—'} tCO₂e` },
    ], W),
    h.spacer(80),
    ...p.dataTableSection('Scope 1 Sources', c.currentEmissions?.scope1?.sources || [], [
      { key: 'source',         label: 'Source',          width: Math.floor(W * 0.34) },
      { key: 'quantity',       label: 'Quantity',         width: Math.floor(W * 0.20) },
      { key: 'emissionFactor', label: 'Emission Factor',  width: Math.floor(W * 0.22) },
      { key: 'tCO2e',          label: 'tCO₂e',            width: W - Math.floor(W * 0.34) - Math.floor(W * 0.20) - Math.floor(W * 0.22) },
    ], ACCENT),
    ...p.dataTableSection('Scope 3 Categories', c.currentEmissions?.scope3?.categories || [], [
      { key: 'categoryNumber', label: 'Category',    width: Math.floor(W * 0.12) },
      { key: 'categoryName',   label: 'Description', width: Math.floor(W * 0.40) },
      { key: 'tCO2e',          label: 'tCO₂e',       width: Math.floor(W * 0.18) },
      { key: 'dataQuality',    label: 'Data Quality', width: W - Math.floor(W * 0.12) - Math.floor(W * 0.40) - Math.floor(W * 0.18) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.dataTableSection('Completed Reduction Initiatives', c.emissionsReductionInitiatives?.completed || [], [
      { key: 'initiative',             label: 'Initiative',         width: Math.floor(W * 0.28) },
      { key: 'dateImplemented',        label: 'Implemented',        width: Math.floor(W * 0.14) },
      { key: 'scope',                  label: 'Scope',              width: Math.floor(W * 0.12) },
      { key: 'estimatedAnnualReduction',label: 'Annual Saving',     width: Math.floor(W * 0.14) },
      { key: 'description',            label: 'Description',        width: W - Math.floor(W * 0.28) - Math.floor(W * 0.14) - Math.floor(W * 0.12) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.dataTableSection('Planned Reduction Initiatives', c.emissionsReductionInitiatives?.planned || [], [
      { key: 'initiative',              label: 'Initiative',         width: Math.floor(W * 0.26) },
      { key: 'plannedImplementation',   label: 'By',                 width: Math.floor(W * 0.12) },
      { key: 'scope',                   label: 'Scope',              width: Math.floor(W * 0.12) },
      { key: 'estimatedAnnualReduction',label: 'Annual Saving',      width: Math.floor(W * 0.14) },
      { key: 'description',             label: 'Description',        width: W - Math.floor(W * 0.26) - Math.floor(W * 0.12) - Math.floor(W * 0.12) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.proseSection('Supply Chain Engagement', c.supplyChainEngagement, ACCENT),
    ...p.proseSection('Reporting & Measurement', c.reportingAndMeasurement, ACCENT),
    p.sectionBand('Board-Level Sign-Off (PPN 06/21 Mandatory)', ACCENT),
    h.infoTable([
      { label: 'Signatory Name',  value: c.boardSignOff?.signatoryName  || '' },
      { label: 'Title',           value: c.boardSignOff?.signatoryTitle || '' },
      { label: 'Sign-Off Date',   value: c.boardSignOff?.signOffDate    || '' },
    ], W),
    h.spacer(80),
    ...h.prose(c.boardSignOff?.signOffStatement || ''),
    h.spacer(120),
    h.approvalTable([{ role: c.boardSignOff?.signatoryTitle || 'Director', name: c.boardSignOff?.signatoryName || '' }], W),
  ];

  return p.buildPremiumDocument({
    documentLabel: 'Carbon Reduction Plan',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.organisationName,
    siteAddress: c.organisationAddress,
    preparedBy: c.boardSignOff?.signatoryName,
    date: c.publicationDate,
    reviewDate: c.reviewDate,
    classification: 'PPN 06/21 COMPLIANT CARBON REDUCTION PLAN',
    extraFields: [
      ['Net Zero Target',    `${c.netZeroCommitment?.targetYear || ''}`],
      ['Total Current Emissions', `${c.currentEmissions?.totalCurrentEmissions || '—'} tCO₂e`],
    ],
  }, [s1, s2, s3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL HANDLING RISK ASSESSMENT — Premium, inline title, no cover page
// ─────────────────────────────────────────────────────────────────────────────
export async function buildManualHandlingDocument(c: any): Promise<Document> {
  const ACCENT = '7C3AED';

  const s1: any[] = [
    ...p.infoSection('Assessment Details', [
      { label: 'Document Reference',  value: c.documentRef       || '' },
      { label: 'Assessment Date',     value: c.assessmentDate    || '' },
      { label: 'Review Date',         value: c.reviewDate        || '' },
      { label: 'Assessed By',         value: c.assessedBy        || '' },
      { label: 'Project Name',        value: c.projectName       || '' },
      { label: 'Site / Address',      value: c.siteAddress       || '' },
    ], ACCENT),
    ...p.proseSection('Legal Basis', c.legalBasis, ACCENT),
    ...p.proseSection('Activity Description', c.activityDescription, ACCENT),
    ...p.proseSection('Can the Manual Handling Be Avoided?', c.canTaskBeAvoided, ACCENT),
  ];

  const s2: any[] = [
    p.sectionBand('TILE Analysis', ACCENT),
    ...p.infoSection('Task Analysis', [
      { label: 'Description',        value: c.taskAnalysis?.description      || '' },
      { label: 'Frequency',          value: c.taskAnalysis?.frequency        || '' },
      { label: 'Duration',           value: c.taskAnalysis?.duration         || '' },
      { label: 'Distance Carried',   value: c.taskAnalysis?.distanceCarried  || '' },
      { label: 'Height of Lift',     value: c.taskAnalysis?.heightOfLift     || '' },
      { label: 'Start Position',     value: c.taskAnalysis?.startPosition    || '' },
      { label: 'End Position',       value: c.taskAnalysis?.endPosition      || '' },
      { label: 'Twisting Required',  value: c.taskAnalysis?.twistingRequired ? 'Yes' : 'No' },
      { label: 'Pushing / Pulling',  value: c.taskAnalysis?.pushingPulling   || '' },
      { label: 'Team Lift',          value: c.taskAnalysis?.teamLift ? 'Yes — ' + (c.taskAnalysis?.numberOfPersons || '') + ' persons' : 'No' },
      { label: 'Rest Breaks',        value: c.taskAnalysis?.restBreaks       || '' },
      { label: 'Repetition Rate',    value: c.taskAnalysis?.repetitionRate   || '' },
    ], ACCENT),
    ...p.infoSection('Individual Factors', [
      { label: 'Training Required',        value: c.individualFactors?.trainingRequired     || '' },
      { label: 'Fitness Requirements',      value: c.individualFactors?.fitnessRequirements  || '' },
      { label: 'Known Limitations',         value: c.individualFactors?.knownLimitations     || '' },
      { label: 'Pregnancy Considerations',  value: c.individualFactors?.pregnancyConsiderations || '' },
      { label: 'Young Persons',             value: c.individualFactors?.youngPersons         || '' },
      { label: 'Aging Workforce',           value: c.individualFactors?.agingWorkforce       || '' },
      { label: 'Previous Injuries',         value: c.individualFactors?.previousInjuries     || '' },
    ], ACCENT),
    ...p.infoSection('Load Characteristics', [
      { label: 'Weight',                   value: c.loadCharacteristics?.weight               || '' },
      { label: 'Dimensions',               value: c.loadCharacteristics?.dimensions           || '' },
      { label: 'Shape',                    value: c.loadCharacteristics?.shape                || '' },
      { label: 'Grip Availability',        value: c.loadCharacteristics?.gripAvailability     || '' },
      { label: 'Stability',                value: c.loadCharacteristics?.stability            || '' },
      { label: 'Sharp Edges',              value: c.loadCharacteristics?.sharpEdges ? 'Yes' : 'No' },
      { label: 'Temperature Issues',       value: c.loadCharacteristics?.temperatureIssues    || '' },
      { label: 'Contents Predictability',  value: c.loadCharacteristics?.contentsPredictability || '' },
      { label: 'Centre of Gravity',        value: c.loadCharacteristics?.centreOfGravity      || '' },
    ], ACCENT),
    ...p.infoSection('Environmental Factors', [
      { label: 'Floor Surface',       value: c.environmentalFactors?.floorSurface     || '' },
      { label: 'Space Constraints',   value: c.environmentalFactors?.spaceConstraints || '' },
      { label: 'Lighting',            value: c.environmentalFactors?.lighting         || '' },
      { label: 'Temperature',         value: c.environmentalFactors?.temperature      || '' },
      { label: 'Weather Exposure',    value: c.environmentalFactors?.weatherExposure  || '' },
      { label: 'Slopes / Gradients',  value: c.environmentalFactors?.slopes           || '' },
      { label: 'Obstructions',        value: c.environmentalFactors?.obstructions     || '' },
      { label: 'Housekeeping',        value: c.environmentalFactors?.housekeeping     || '' },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.dataTableSection('TILE Risk Scoring', [
      { factor: 'Task',        score: c.tileScoring?.taskScore || '', justification: c.tileScoring?.taskJustification || '' },
      { factor: 'Individual',  score: c.tileScoring?.individualScore || '', justification: c.tileScoring?.individualJustification || '' },
      { factor: 'Load',        score: c.tileScoring?.loadScore || '', justification: c.tileScoring?.loadJustification || '' },
      { factor: 'Environment', score: c.tileScoring?.environmentScore || '', justification: c.tileScoring?.environmentJustification || '' },
      { factor: 'OVERALL',     score: c.tileScoring?.overallRisk || '', justification: c.tileScoring?.overallJustification || '' },
    ], [
      { key: 'factor',        label: 'TILE Factor',    width: Math.floor(W * 0.16) },
      { key: 'score',         label: 'Risk Rating',    width: Math.floor(W * 0.14) },
      { key: 'justification', label: 'Justification',  width: W - Math.floor(W * 0.16) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.infoSection('MAC Assessment (HSE Manual Handling Assessment Chart)', [
      { label: 'Lift / Lower Score',        value: c.macAssessment?.liftLowerScore       || '' },
      { label: 'Carry Score',               value: c.macAssessment?.carryScore            || '' },
      { label: 'Team Handling Score',        value: c.macAssessment?.teamHandlingScore     || '' },
      { label: 'Overall MAC Category',       value: c.macAssessment?.overallMacCategory    || '' },
    ], ACCENT),
    ...p.proseSection('MAC Assessment Narrative', c.macAssessment?.macNarrative, ACCENT),
  ];

  const s4: any[] = [
    ...p.dataTableSection('Control Measures', c.controlMeasures || [], [
      { key: 'measure',        label: 'Measure',          width: Math.floor(W * 0.24) },
      { key: 'hierarchyLevel', label: 'Hierarchy Level',  width: Math.floor(W * 0.14) },
      { key: 'detail',         label: 'Detail',           width: W - Math.floor(W * 0.24) - Math.floor(W * 0.14) },
    ], ACCENT),
    ...p.dataTableSection('Mechanical Aids & Alternatives', c.mechanicalAids || [], [
      { key: 'aid',          label: 'Aid / Equipment',  width: Math.floor(W * 0.22) },
      { key: 'application',  label: 'Application',      width: Math.floor(W * 0.26) },
      { key: 'benefit',      label: 'Benefit',          width: Math.floor(W * 0.26) },
      { key: 'suitability',  label: 'Suitability',      width: W - Math.floor(W * 0.22) - Math.floor(W * 0.26) - Math.floor(W * 0.26) },
    ], ACCENT),
    ...p.infoSection('Residual Risk', [
      { label: 'Residual Risk Rating', value: c.residualRisk || '' },
    ], ACCENT),
    ...p.proseSection('Residual Risk Justification', c.residualRiskJustification, ACCENT),
    ...p.dataTableSection('Training Requirements', c.trainingRequirements || [], [
      { key: 'trainingItem', label: 'Training Item',  width: Math.floor(W * 0.30) },
      { key: 'who',          label: 'Who',             width: Math.floor(W * 0.22) },
      { key: 'frequency',    label: 'Frequency',       width: Math.floor(W * 0.22) },
      { key: 'provider',     label: 'Provider',        width: W - Math.floor(W * 0.30) - Math.floor(W * 0.22) - Math.floor(W * 0.22) },
    ], ACCENT),
    ...p.proseSection('Monitoring Arrangements', c.monitoringArrangements, ACCENT),
    ...p.bulletListSection('Review Triggers', c.reviewTriggers || [], ACCENT),
    ...p.proseSection('Additional Notes', c.additionalNotes, ACCENT),
    ...p.signatureBlock([
      { role: 'Assessed By',  name: c.assessedBy || '' },
      { role: 'Reviewed By',  name: '' },
      { role: 'Approved By',  name: '' },
    ], ACCENT),
  ];

  return p.buildPremiumDocumentInline({
    documentLabel: 'Manual Handling Risk Assessment',
    accentHex: ACCENT,
    classification: 'HEALTH & SAFETY DOCUMENT',
  }, [s1, s2, s3, s4]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFINED SPACE RISK ASSESSMENT — Premium, inline title, no cover page
// ─────────────────────────────────────────────────────────────────────────────
export async function buildConfinedSpacesDocument(c: any): Promise<Document> {
  const ACCENT = 'DC2626';

  const s1: any[] = [
    ...p.infoSection('Assessment Details', [
      { label: 'Document Reference',  value: c.documentRef       || '' },
      { label: 'Assessment Date',     value: c.assessmentDate    || '' },
      { label: 'Review Date',         value: c.reviewDate        || '' },
      { label: 'Assessed By',         value: c.assessedBy        || '' },
      { label: 'Project Name',        value: c.projectName       || '' },
      { label: 'Site / Address',      value: c.siteAddress       || '' },
    ], ACCENT),
    ...p.proseSection('Legal Basis', c.legalBasis, ACCENT),
    ...p.infoSection('Confined Space Identification', [
      { label: 'Space Name',           value: c.spaceIdentification?.name            || '' },
      { label: 'Type',                 value: c.spaceIdentification?.type            || '' },
      { label: 'Classification',       value: c.spaceIdentification?.classification  || '' },
      { label: 'Location',             value: c.spaceIdentification?.location        || '' },
      { label: 'Dimensions',           value: c.spaceIdentification?.dimensions      || '' },
      { label: 'Volume',               value: c.spaceIdentification?.volume          || '' },
      { label: 'Access Points',        value: c.spaceIdentification?.accessPoints    || '' },
      { label: 'Egress Points',        value: c.spaceIdentification?.egressPoints    || '' },
      { label: 'Normal Contents',      value: c.spaceIdentification?.normalContents  || '' },
      { label: 'Previous Use',         value: c.spaceIdentification?.previousUse     || '' },
      { label: 'Adjacent Hazards',     value: c.spaceIdentification?.adjacentHazards || '' },
    ], ACCENT),
    ...p.proseSection('Reason for Entry', c.reasonForEntry, ACCENT),
    ...p.proseSection('Can Entry Be Avoided? (Regulation 4(1))', c.canWorkBeAvoidedWithoutEntry, ACCENT),
    ...p.dataTableSection('Alternative Methods Considered', c.alternativeMethodsConsidered || [], [
      { key: 'method',          label: 'Alternative Method',  width: Math.floor(W * 0.40) },
      { key: 'reasonRejected',  label: 'Reason Rejected',     width: W - Math.floor(W * 0.40) },
    ], ACCENT),
  ];

  const s2: any[] = [
    ...p.dataTableSection('Atmospheric Hazards', c.atmosphericHazards || [], [
      { key: 'hazard',           label: 'Hazard',           width: Math.floor(W * 0.16) },
      { key: 'source',           label: 'Source',           width: Math.floor(W * 0.18) },
      { key: 'oel',              label: 'OEL',              width: Math.floor(W * 0.10) },
      { key: 'alarmLevel',       label: 'Alarm Level',      width: Math.floor(W * 0.12) },
      { key: 'actionRequired',   label: 'Action Required',  width: Math.floor(W * 0.22) },
      { key: 'monitoringMethod', label: 'Monitoring',       width: W - Math.floor(W * 0.16) - Math.floor(W * 0.18) - Math.floor(W * 0.10) - Math.floor(W * 0.12) - Math.floor(W * 0.22) },
    ], ACCENT),
    ...p.dataTableSection('Physical Hazards', c.physicalHazards || [], [
      { key: 'hazard',         label: 'Hazard',          width: Math.floor(W * 0.22) },
      { key: 'risk',           label: 'Risk Rating',     width: Math.floor(W * 0.12) },
      { key: 'controlMeasure', label: 'Control Measure', width: Math.floor(W * 0.40) },
      { key: 'residualRisk',   label: 'Residual Risk',   width: W - Math.floor(W * 0.22) - Math.floor(W * 0.12) - Math.floor(W * 0.40) },
    ], ACCENT),
    ...p.dataTableSection('Biological Hazards', c.biologicalHazards || [], [
      { key: 'hazard',         label: 'Hazard',          width: Math.floor(W * 0.22) },
      { key: 'source',         label: 'Source',          width: Math.floor(W * 0.34) },
      { key: 'controlMeasure', label: 'Control Measure', width: W - Math.floor(W * 0.22) - Math.floor(W * 0.34) },
    ], ACCENT),
  ];

  const s3: any[] = [
    ...p.proseSection('Safe System of Work', c.safeSystemOfWork, ACCENT),
    ...p.dataTableSection('Entry Sequence', c.entrySequence || [], [
      { key: 'step',           label: 'Step',           width: Math.floor(W * 0.06) },
      { key: 'action',         label: 'Action',         width: Math.floor(W * 0.38) },
      { key: 'responsibility', label: 'Responsibility', width: Math.floor(W * 0.24) },
      { key: 'checkpoint',     label: 'Checkpoint',     width: W - Math.floor(W * 0.06) - Math.floor(W * 0.38) - Math.floor(W * 0.24) },
    ], ACCENT),
    ...p.infoSection('Permit to Work Requirements', [
      { label: 'Permit Type',               value: c.permitRequirements?.permitType            || '' },
      { label: 'Issued By',                 value: c.permitRequirements?.issuedBy              || '' },
      { label: 'Authorised By',             value: c.permitRequirements?.authorisedBy          || '' },
      { label: 'Validity Period',            value: c.permitRequirements?.validityPeriod        || '' },
      { label: 'Conditions',                value: c.permitRequirements?.conditions            || '' },
      { label: 'Cancellation Procedure',    value: c.permitRequirements?.cancellationProcedure || '' },
    ], ACCENT),
    ...p.infoSection('Gas Monitoring', [
      { label: 'Equipment',                  value: c.gasMonitoring?.equipment              || '' },
      { label: 'Calibration Date',           value: c.gasMonitoring?.calibrationDate        || '' },
      { label: 'Pre-Entry Readings',         value: c.gasMonitoring?.preEntryReadings       || '' },
      { label: 'Continuous Monitoring',       value: c.gasMonitoring?.continuousMonitoring ? 'Yes' : 'No' },
      { label: 'Bump Test Required',          value: c.gasMonitoring?.bumpTestRequired ? 'Yes' : 'No' },
      { label: 'O₂ Low Alarm',               value: c.gasMonitoring?.alarmSetPoints?.o2Low  || '' },
      { label: 'O₂ High Alarm',              value: c.gasMonitoring?.alarmSetPoints?.o2High || '' },
      { label: 'LEL Alarm',                  value: c.gasMonitoring?.alarmSetPoints?.lel    || '' },
      { label: 'H₂S Alarm',                  value: c.gasMonitoring?.alarmSetPoints?.h2s    || '' },
      { label: 'CO Alarm',                   value: c.gasMonitoring?.alarmSetPoints?.co     || '' },
      { label: 'Calibration Requirements',   value: c.gasMonitoring?.calibrationRequirements || '' },
    ], ACCENT),
    ...p.infoSection('Ventilation', [
      { label: 'Type',                   value: c.ventilation?.type                || '' },
      { label: 'Equipment',              value: c.ventilation?.equipment           || '' },
      { label: 'Air Changes Required',   value: c.ventilation?.airChangesRequired  || '' },
      { label: 'Pre-Entry Purging Time', value: c.ventilation?.preEntryPurgingTime || '' },
      { label: 'Ducting Arrangement',    value: c.ventilation?.ductingArrangement  || '' },
    ], ACCENT),
  ];

  const s4: any[] = [
    ...p.proseSection('Communication Plan', c.communicationPlan, ACCENT),
    ...p.dataTableSection('Communication Methods', c.communicationMethods || [], [
      { key: 'method',        label: 'Method',          width: Math.floor(W * 0.30) },
      { key: 'betweenWhom',   label: 'Between Whom',    width: Math.floor(W * 0.38) },
      { key: 'checkInterval', label: 'Check Interval',  width: W - Math.floor(W * 0.30) - Math.floor(W * 0.38) },
    ], ACCENT),
    p.sectionBand('Emergency Rescue Plan', ACCENT),
    ...p.infoSection('Rescue Arrangements', [
      { label: 'Rescue Method',             value: c.emergencyRescuePlan?.rescueMethod         || '' },
      { label: 'Rescue Equipment',          value: c.emergencyRescuePlan?.rescueEquipment      || '' },
      { label: 'Rescue Team Details',       value: c.emergencyRescuePlan?.rescueTeamDetails    || '' },
      { label: 'Rescue Team Training',      value: c.emergencyRescuePlan?.rescueTeamTraining   || '' },
      { label: 'Emergency Services',        value: c.emergencyRescuePlan?.emergencyServices    || '' },
      { label: 'Nearest A&E',              value: c.emergencyRescuePlan?.nearestA_E           || '' },
      { label: 'Rescue Drill Frequency',    value: c.emergencyRescuePlan?.rescueDrillFrequency || '' },
    ], ACCENT),
    ...p.proseSection('Emergency Rescue Procedure', c.emergencyRescuePlan?.procedureDescription, ACCENT),
    ...p.dataTableSection('Personnel & Roles', c.personnelRoles || [], [
      { key: 'role',          label: 'Role',           width: Math.floor(W * 0.18) },
      { key: 'name',          label: 'Name',           width: Math.floor(W * 0.18) },
      { key: 'competencies',  label: 'Competencies',   width: Math.floor(W * 0.38) },
      { key: 'trainingDate',  label: 'Training Date',  width: W - Math.floor(W * 0.18) - Math.floor(W * 0.18) - Math.floor(W * 0.38) },
    ], ACCENT),
  ];

  const s5: any[] = [
    ...p.dataTableSection('PPE Requirements', c.ppeRequirements || [], [
      { key: 'item',           label: 'PPE Item',        width: Math.floor(W * 0.30) },
      { key: 'standard',       label: 'Standard',        width: Math.floor(W * 0.34) },
      { key: 'checkRequired',  label: 'Check Required',  width: W - Math.floor(W * 0.30) - Math.floor(W * 0.34) },
    ], ACCENT),
    ...p.dataTableSection('Equipment Required', c.equipmentRequired || [], [
      { key: 'item',               label: 'Equipment',          width: Math.floor(W * 0.26) },
      { key: 'purpose',            label: 'Purpose',            width: Math.floor(W * 0.38) },
      { key: 'inspectionRequired', label: 'Inspection Required', width: W - Math.floor(W * 0.26) - Math.floor(W * 0.38) },
    ], ACCENT),
    ...p.dataTableSection('Isolation Requirements', c.isolationRequirements || [], [
      { key: 'service',          label: 'Service / Energy',   width: Math.floor(W * 0.26) },
      { key: 'isolationMethod',  label: 'Isolation Method',   width: Math.floor(W * 0.40) },
      { key: 'verifiedBy',       label: 'Verified By',        width: W - Math.floor(W * 0.26) - Math.floor(W * 0.40) },
    ], ACCENT),
    ...p.proseSection('Competency Requirements', c.competencyRequirements, ACCENT),
    ...p.infoSection('Overall Risk Assessment', [
      { label: 'Overall Risk Rating', value: c.overallRiskRating || '' },
    ], ACCENT),
    ...p.proseSection('Risk Rating Justification', c.riskRatingJustification, ACCENT),
    ...p.bulletListSection('Review Triggers', c.reviewTriggers || [], ACCENT),
    ...p.proseSection('Additional Notes', c.additionalNotes, ACCENT),
    ...p.signatureBlock([
      { role: 'Assessed By',           name: c.assessedBy || '' },
      { role: 'Permit Issuer',         name: '' },
      { role: 'Entrant Acknowledgement', name: '' },
      { role: 'Approved By',           name: '' },
    ], ACCENT),
    p.sectionBand('Briefing & Acknowledgement Record', ACCENT),
    h.briefingRecordTable(15, W),
  ];

  return p.buildPremiumDocumentInline({
    documentLabel: 'Confined Space Risk Assessment',
    accentHex: ACCENT,
    classification: 'CONFINED SPACES REGULATIONS 1997 — HIGH RISK ACTIVITY',
  }, [s1, s2, s3, s4, s5]);
}
