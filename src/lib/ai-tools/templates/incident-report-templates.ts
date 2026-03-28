// =============================================================================
// Incident Report Builder — Multi-Template Engine
// 4 templates, all consuming the same Incident Report JSON structure.
//
// T1 — Ebrora Standard    (green, cover, comprehensive 14-section investigation)
// T2 — RIDDOR Focused     (red, regulatory submission, F2508 format, checklists)
// T3 — Root Cause Analysis (navy, analytical, barrier analysis, causal chain)
// T4 — Near Miss           (amber, compact, observation, prevention-focused)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { IncidentReportTemplateSlug } from '@/lib/incident-report/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const RED_D = '991B1B'; const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const AMBER = 'D97706'; const AMBER_BG = 'FEF3C7';
const GREEN_RAG = '059669'; const GREEN_BG = 'D1FAE5';
const BLUE = '2563EB'; const BLUE_BG = 'DBEAFE';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const ORANGE = '92400e'; const ORANGE_BG = 'FFFBEB';
const GREY_RAG = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface PersonInvolved {
  name: string; role: string; employer: string;
  injuryDescription: string; treatmentGiven: string; daysLost: string; returnDate: string;
}
interface TimelineEntry { time: string; event: string; source: string; }
interface ImmediateCause { category: string; cause: string; evidence: string; }
interface WhyEntry { why: string; question: string; answer: string; }
interface ContributingFactor {
  category: string; factor: string; significance: string;
  systemLink: string; evidence: string;
}
interface RiddorCategory { category: string; applicable: string; regulation: string; notes: string; }
interface SpecifiedInjury { injury: string; applicable: string; notes: string; }
interface DangerousOccurrence { occurrence: string; applicable: string; notes: string; }
interface EvidenceItem { type: string; description: string; collectedBy: string; date: string; }
interface RiskRating { hazard: string; severity: string; likelihood: string; rating: string; ratingLevel: string; }
interface CorrectiveAction {
  action: string; priority: string; owner: string;
  dueDate: string; status: string; verifiedBy: string; kpi: string; f2508Linked: string;
}
interface LessonLearned { lesson: string; howShared: string; audience: string; }
interface DistributionEntry { recipient: string; organisation: string; method: string; date: string; }
interface ReportingMilestone { milestone: string; dateTime: string; status: string; notes: string; }
interface DefectiveItem { item: string; idRef: string; defect: string; actionTaken: string; status: string; }
interface WitnessEntry { name: string; role: string; keyPoints: string; statementRef: string; }
interface MedicalEntry { date: string; provider: string; treatment: string; outcome: string; }
interface NotificationItem { requirement: string; completed: string; notes: string; }
interface BarrierEntry { defenceLayer: string; expectedBarrier: string; status: string; failureMode: string; }
interface CausalChainStep { step: string; event: string; category: string; description: string; linkToNext: string; }
interface TargetRating { hazard: string; severity: string; targetLikelihood: string; targetRating: string; controlsRequired: string; }
interface SystemicRec { ref: string; recommendation: string; systemElement: string; owner: string; timeline: string; }
interface LocalRec { ref: string; recommendation: string; owner: string; dueDate: string; status: string; }
interface MgmtGap { gap: string; systemElement: string; description: string; standardRef: string; priority: string; }
interface CloseOutMilestone { milestone: string; targetDate: string; activity: string; owner: string; verification: string; }
interface ClassificationItem { type: string; applicable: string; notes: string; }
interface SeverityAssessment { factor: string; rating: string; rationale: string; }
interface HazardIdent { hazard: string; description: string; riskLevel: string; currentControls: string; }
interface UnderlyingCause { category: string; cause: string; significance: string; link: string; }
interface PreviousOccurrence { date: string; ref: string; description: string; outcome: string; lessonsApplied: string; }
interface CommEntry { audience: string; method: string; date: string; status: string; }
interface PositiveObs { observation: string; significance: string; }
interface RegRef { reference: string; description: string; }

interface IncidentReportData {
  documentRef: string; incidentDate: string; incidentTime: string;
  reportDate: string; investigationLead: string;
  projectName: string; siteAddress: string;
  principalContractor: string; client: string; contractRef: string;
  incidentCategory: string; riddorReportable: string;
  // Summary
  exactLocation: string; activityAtTime: string; weatherConditions: string;
  briefDescription: string; immediateOutcome: string;
  // Persons
  personsInvolved: PersonInvolved[];
  // Timeline
  timelineEntries: TimelineEntry[];
  // Causes
  immediateCauses: ImmediateCause[];
  whyEntries: WhyEntry[];
  rootCauseStatement: string;
  contributingFactors: ContributingFactor[];
  // RIDDOR
  riddorCategories: RiddorCategory[];
  specifiedInjuries: SpecifiedInjury[];
  dangerousOccurrences: DangerousOccurrence[];
  f2508Ref: string; dateReported: string; reportedBy: string;
  enforcingAuthority: string; hseRegionalOffice: string;
  hseInspectorNotified: string; scenePreserved: string;
  improvementNotice: string; prohibitionNotice: string;
  riddorCategory: string; reportingCategory: string;
  // Reporting milestones
  reportingMilestones: ReportingMilestone[];
  // Injured person F2508 fields
  ipFullName: string; ipDob: string; ipNiNumber: string; ipGender: string;
  ipAddress: string; ipOccupation: string; ipEmployer: string;
  ipEmploymentStatus: string; ipLengthOfService: string;
  ipCscsCard: string; ipTrainingCurrent: string;
  // Injury F2508 fields
  natureOfInjury: string; bodyPartAffected: string; mechanismOfInjury: string;
  firstAidOnSite: string; hospitalTreatment: string; admittedOvernight: string;
  daysAbsent: string; returnToWorkDate: string; permanentDisability: string;
  // HSE classification
  hseAccidentKindCode: string; agentInvolved: string;
  activityAtTimeHse: string; processHse: string; sicCode: string;
  // Defective plant
  defectiveItems: DefectiveItem[];
  // Witnesses
  witnessEntries: WitnessEntry[];
  // Medical
  medicalEntries: MedicalEntry[];
  // Notification checklist
  notificationItems: NotificationItem[];
  // Evidence
  evidenceItems: EvidenceItem[];
  // Risk ratings
  preRiskRatings: RiskRating[];
  postRiskRatings: RiskRating[];
  riskJustification: string;
  targetRatings: TargetRating[];
  // Actions
  correctiveActions: CorrectiveAction[];
  // Lessons
  lessonsLearned: LessonLearned[];
  // Distribution
  distributionEntries: DistributionEntry[];
  // Barrier analysis
  barrierEntries: BarrierEntry[];
  barrierSummary: string;
  // Causal chain
  causalChainSteps: CausalChainStep[];
  // Systemic / Local recs
  systemicRecs: SystemicRec[];
  localRecs: LocalRec[];
  // Mgmt gaps
  mgmtGaps: MgmtGap[];
  // Close-out
  closeOutMilestones: CloseOutMilestone[];
  // Near miss fields
  observerName: string; observerRole: string; dateObserved: string; timeObserved: string;
  dateReportedNm: string; personsInArea: string;
  classificationItems: ClassificationItem[];
  primaryClassification: string; nmDescription: string;
  severityAssessments: SeverityAssessment[];
  potentialOutcomeStatement: string;
  hazardIdents: HazardIdent[];
  immediateActionsTaken: CorrectiveAction[];
  underlyingCauses: UnderlyingCause[];
  immediateFixes: CorrectiveAction[];
  systemicActions: CorrectiveAction[];
  previousOccurrences: PreviousOccurrence[];
  trendStatement: string;
  commEntries: CommEntry[];
  positiveObservations: PositiveObs[];
  reporterRecognition: string;
  followUpActions: CloseOutMilestone[];
  // Shared
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): IncidentReportData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), incidentDate: s(c.incidentDate), incidentTime: s(c.incidentTime),
    reportDate: s(c.reportDate), investigationLead: s(c.investigationLead),
    projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    principalContractor: s(c.principalContractor), client: s(c.client), contractRef: s(c.contractRef),
    incidentCategory: s(c.incidentCategory), riddorReportable: s(c.riddorReportable),
    exactLocation: s(c.exactLocation), activityAtTime: s(c.activityAtTime),
    weatherConditions: s(c.weatherConditions), briefDescription: s(c.briefDescription),
    immediateOutcome: s(c.immediateOutcome),
    personsInvolved: a(c.personsInvolved), timelineEntries: a(c.timelineEntries),
    immediateCauses: a(c.immediateCauses), whyEntries: a(c.whyEntries),
    rootCauseStatement: s(c.rootCauseStatement), contributingFactors: a(c.contributingFactors),
    riddorCategories: a(c.riddorCategories), specifiedInjuries: a(c.specifiedInjuries),
    dangerousOccurrences: a(c.dangerousOccurrences),
    f2508Ref: s(c.f2508Ref), dateReported: s(c.dateReported), reportedBy: s(c.reportedBy),
    enforcingAuthority: s(c.enforcingAuthority), hseRegionalOffice: s(c.hseRegionalOffice),
    hseInspectorNotified: s(c.hseInspectorNotified), scenePreserved: s(c.scenePreserved),
    improvementNotice: s(c.improvementNotice), prohibitionNotice: s(c.prohibitionNotice),
    riddorCategory: s(c.riddorCategory), reportingCategory: s(c.reportingCategory),
    reportingMilestones: a(c.reportingMilestones),
    ipFullName: s(c.ipFullName), ipDob: s(c.ipDob), ipNiNumber: s(c.ipNiNumber), ipGender: s(c.ipGender),
    ipAddress: s(c.ipAddress), ipOccupation: s(c.ipOccupation), ipEmployer: s(c.ipEmployer),
    ipEmploymentStatus: s(c.ipEmploymentStatus), ipLengthOfService: s(c.ipLengthOfService),
    ipCscsCard: s(c.ipCscsCard), ipTrainingCurrent: s(c.ipTrainingCurrent),
    natureOfInjury: s(c.natureOfInjury), bodyPartAffected: s(c.bodyPartAffected),
    mechanismOfInjury: s(c.mechanismOfInjury), firstAidOnSite: s(c.firstAidOnSite),
    hospitalTreatment: s(c.hospitalTreatment), admittedOvernight: s(c.admittedOvernight),
    daysAbsent: s(c.daysAbsent), returnToWorkDate: s(c.returnToWorkDate),
    permanentDisability: s(c.permanentDisability),
    hseAccidentKindCode: s(c.hseAccidentKindCode), agentInvolved: s(c.agentInvolved),
    activityAtTimeHse: s(c.activityAtTimeHse), processHse: s(c.processHse), sicCode: s(c.sicCode),
    defectiveItems: a(c.defectiveItems), witnessEntries: a(c.witnessEntries),
    medicalEntries: a(c.medicalEntries), notificationItems: a(c.notificationItems),
    evidenceItems: a(c.evidenceItems),
    preRiskRatings: a(c.preRiskRatings), postRiskRatings: a(c.postRiskRatings),
    riskJustification: s(c.riskJustification), targetRatings: a(c.targetRatings),
    correctiveActions: a(c.correctiveActions), lessonsLearned: a(c.lessonsLearned),
    distributionEntries: a(c.distributionEntries),
    barrierEntries: a(c.barrierEntries), barrierSummary: s(c.barrierSummary),
    causalChainSteps: a(c.causalChainSteps),
    systemicRecs: a(c.systemicRecs), localRecs: a(c.localRecs),
    mgmtGaps: a(c.mgmtGaps), closeOutMilestones: a(c.closeOutMilestones),
    observerName: s(c.observerName), observerRole: s(c.observerRole),
    dateObserved: s(c.dateObserved), timeObserved: s(c.timeObserved),
    dateReportedNm: s(c.dateReportedNm), personsInArea: s(c.personsInArea),
    classificationItems: a(c.classificationItems),
    primaryClassification: s(c.primaryClassification), nmDescription: s(c.nmDescription),
    severityAssessments: a(c.severityAssessments),
    potentialOutcomeStatement: s(c.potentialOutcomeStatement),
    hazardIdents: a(c.hazardIdents),
    immediateActionsTaken: a(c.immediateActionsTaken),
    underlyingCauses: a(c.underlyingCauses),
    immediateFixes: a(c.immediateFixes), systemicActions: a(c.systemicActions),
    previousOccurrences: a(c.previousOccurrences), trendStatement: s(c.trendStatement),
    commEntries: a(c.commEntries), positiveObservations: a(c.positiveObservations),
    reporterRecognition: s(c.reporterRecognition),
    followUpActions: a(c.followUpActions),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'HSWA 1974 — Section 2', description: 'General duty to ensure health, safety and welfare of employees' },
    { reference: 'MHSW Regulations 1999 — Reg 3', description: 'Duty to carry out suitable and sufficient risk assessment' },
    { reference: 'CDM 2015 — Reg 13(1)', description: 'Principal Contractor duty to plan, manage and monitor construction work' },
    { reference: 'WAHR 2005 — Reg 10', description: 'Duty to prevent falling objects' },
    { reference: 'RIDDOR 2013', description: 'Reporting of injuries, diseases and dangerous occurrences' },
    { reference: 'HSE HSG245', description: 'Investigating accidents and incidents — structured methodology' },
    { reference: 'HSE L153 ACoP', description: 'Managing health and safety in construction' },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string): Paragraph {
  return new Paragraph({ spacing: { before: 360, after: 140 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: LG, font: 'Arial', color: accent })] });
}
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || SM + 2, font: 'Arial', color: opts?.color })] })] });
}
function infoRow(l: string, v: string, lw: number, vw: number, lbg: string, lc: string): TableRow {
  return new TableRow({ children: [
    new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l, bold: true, size: SM + 2, font: 'Arial', color: lc })] })] }),
    new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
  ] });
}
function infoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => infoRow(r.label, r.value, lw, W - lw, lbg, lc)) });
}
function dataTable(headers: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, headerBg: string, zb = ZEBRA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, headerBg)) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zb : h.WHITE, color: cell.color })) })),
  ] });
}
function signOff(roles: string[], bg: string): Table {
  const cols = [{ t: 'Role', w: Math.round(W * 0.22) }, { t: 'Name', w: Math.round(W * 0.28) }, { t: 'Signature', w: Math.round(W * 0.25) }, { t: 'Date', w: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) }];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.t, c.w, bg)) }),
    ...roles.map(role => new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.w)) })),
  ] });
}
function ragText(level: string): { color: string } {
  const l = (level || '').toLowerCase();
  if (l === 'critical' || l === 'high' || l === 'immediate' || l === 'imm.' || l === 'fatal' || l === 'major' || l === 'failed') return { color: RED };
  if (l === 'medium' || l === 'amber' || l === 'short-term' || l === 's/t' || l === 'in progress' || l === 'in prog.' || l === 'weakened' || l === 'partial') return { color: AMBER };
  if (l === 'low' || l === 'green' || l === 'closed' || l === 'completed' || l === 'done' || l === 'met' || l === 'yes' || l === 'serviceable') return { color: GREEN_RAG };
  return { color: GREY_RAG };
}
function calloutPara(text: string, accent: string, bg: string): Paragraph {
  return new Paragraph({ spacing: { before: 120, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    shading: { type: ShadingType.CLEAR, fill: bg },
    children: [new TextRun({ text, size: SM + 2, font: 'Arial' })] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, cover, comprehensive)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: IncidentReportData): (Paragraph | Table)[] {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const els: (Paragraph | Table)[] = [];

  // Cover
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'INCIDENT INVESTIGATION REPORT', bold: true, size: TTL, font: 'Arial', color: A })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'RIDDOR 2013 \u00B7 MHSW 1999 \u00B7 CDM 2015 \u00B7 HSWA 1974', size: BODY, font: 'Arial', color: h.GREY_DARK })] }));
  els.push(h.spacer(100));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(h.spacer(100));
  els.push(infoTable([
    { label: 'Document Ref', value: d.documentRef }, { label: 'Incident Date', value: `${d.incidentDate} — ${d.incidentTime}` },
    { label: 'Report Date', value: d.reportDate }, { label: 'Investigation Lead', value: d.investigationLead },
    { label: 'Principal Contractor', value: d.principalContractor }, { label: 'Client', value: d.client },
    { label: 'Incident Category', value: d.incidentCategory }, { label: 'RIDDOR Reportable', value: d.riddorReportable },
  ], LBG, LC));

  // 1.0 Incident Summary
  els.push(secHead('1.0', 'Incident Summary', A));
  els.push(infoTable([
    { label: 'Date & Time', value: `${d.incidentDate} — ${d.incidentTime}` },
    { label: 'Exact Location', value: d.exactLocation },
    { label: 'Activity at Time', value: d.activityAtTime },
    { label: 'Weather Conditions', value: d.weatherConditions },
    { label: 'Brief Description', value: d.briefDescription },
    { label: 'Immediate Outcome', value: d.immediateOutcome },
  ], LBG, LC));

  // 2.0 Persons Involved
  if (d.personsInvolved.length > 0) {
    const pc = [Math.round(W * 0.14), Math.round(W * 0.14), Math.round(W * 0.12), Math.round(W * 0.20), Math.round(W * 0.18), Math.round(W * 0.10), W - Math.round(W * 0.14) - Math.round(W * 0.14) - Math.round(W * 0.12) - Math.round(W * 0.20) - Math.round(W * 0.18) - Math.round(W * 0.10)];
    els.push(secHead('2.0', 'Persons Involved', A));
    els.push(dataTable(
      [{ text: 'Name', width: pc[0] }, { text: 'Role', width: pc[1] }, { text: 'Employer', width: pc[2] }, { text: 'Injury / Involvement', width: pc[3] }, { text: 'Treatment', width: pc[4] }, { text: 'Days Lost', width: pc[5] }, { text: 'Return', width: pc[6] }],
      d.personsInvolved.map(p => [{ text: p.name, bold: true }, { text: p.role }, { text: p.employer }, { text: p.injuryDescription }, { text: p.treatmentGiven }, { text: p.daysLost }, { text: p.returnDate }]),
      A));
  }

  // 3.0 Timeline
  if (d.timelineEntries.length > 0) {
    const tc = [Math.round(W * 0.12), Math.round(W * 0.60), W - Math.round(W * 0.12) - Math.round(W * 0.60)];
    els.push(secHead('3.0', 'Timeline of Events', A));
    els.push(dataTable(
      [{ text: 'Time', width: tc[0] }, { text: 'Event', width: tc[1] }, { text: 'Source', width: tc[2] }],
      d.timelineEntries.map(t => [{ text: t.time, bold: true }, { text: t.event }, { text: t.source }]),
      A));
  }

  // 4.0 Immediate Causes
  if (d.immediateCauses.length > 0) {
    const ic = [Math.round(W * 0.22), Math.round(W * 0.38), W - Math.round(W * 0.22) - Math.round(W * 0.38)];
    els.push(secHead('4.0', 'Immediate Causes', A));
    els.push(dataTable(
      [{ text: 'Category', width: ic[0] }, { text: 'Immediate Cause', width: ic[1] }, { text: 'Evidence', width: ic[2] }],
      d.immediateCauses.map(c => [{ text: c.category, bold: true }, { text: c.cause }, { text: c.evidence }]),
      A));
  }

  // 5.0 Root Cause — 5 Whys
  if (d.whyEntries.length > 0) {
    const wc = [Math.round(W * 0.08), Math.round(W * 0.38), W - Math.round(W * 0.08) - Math.round(W * 0.38)];
    els.push(secHead('5.0', 'Root Cause Analysis — 5 Whys', A));
    els.push(dataTable(
      [{ text: 'Why', width: wc[0] }, { text: 'Question', width: wc[1] }, { text: 'Answer', width: wc[2] }],
      d.whyEntries.map(w => [{ text: w.why, bold: true }, { text: w.question }, { text: w.answer }]),
      A));
  }

  // 6.0 Contributing Factors
  if (d.contributingFactors.length > 0) {
    const fc = [Math.round(W * 0.12), Math.round(W * 0.34), Math.round(W * 0.12), W - Math.round(W * 0.12) - Math.round(W * 0.34) - Math.round(W * 0.12)];
    els.push(secHead('6.0', 'Contributing Factors Matrix', A));
    els.push(dataTable(
      [{ text: 'Category', width: fc[0] }, { text: 'Contributing Factor', width: fc[1] }, { text: 'Significance', width: fc[2] }, { text: 'Management System Link', width: fc[3] }],
      d.contributingFactors.map(f => [{ text: f.category, bold: true }, { text: f.factor }, { text: f.significance, bold: true, color: ragText(f.significance).color }, { text: f.systemLink }]),
      A));
  }

  // 7.0 RIDDOR Assessment
  els.push(secHead('7.0', 'RIDDOR Reportability Assessment', A));
  els.push(infoTable([
    { label: 'RIDDOR Reportable?', value: d.riddorReportable },
    { label: 'Reporting Category', value: d.reportingCategory },
    { label: 'F2508 Ref', value: d.f2508Ref },
    { label: 'Date Reported', value: d.dateReported },
    { label: 'Reported By', value: d.reportedBy },
    { label: 'Enforcing Authority', value: d.enforcingAuthority },
    { label: 'Scene Preserved?', value: d.scenePreserved },
  ], LBG, LC));

  // 8.0 Evidence
  if (d.evidenceItems.length > 0) {
    const ec = [Math.round(W * 0.06), Math.round(W * 0.18), Math.round(W * 0.36), Math.round(W * 0.18), W - Math.round(W * 0.06) - Math.round(W * 0.18) - Math.round(W * 0.36) - Math.round(W * 0.18)];
    els.push(secHead('8.0', 'Evidence Collected', A));
    els.push(dataTable(
      [{ text: '#', width: ec[0] }, { text: 'Type', width: ec[1] }, { text: 'Description', width: ec[2] }, { text: 'Collected By', width: ec[3] }, { text: 'Date', width: ec[4] }],
      d.evidenceItems.map((e, i) => [{ text: String(i + 1) }, { text: e.type }, { text: e.description }, { text: e.collectedBy }, { text: e.date }]),
      A));
  }

  // 9.0 Risk Assessment Review
  if (d.preRiskRatings.length > 0 || d.postRiskRatings.length > 0) {
    const rc = [Math.round(W * 0.30), Math.round(W * 0.18), Math.round(W * 0.18), W - Math.round(W * 0.30) - Math.round(W * 0.18) - Math.round(W * 0.18)];
    els.push(secHead('9.0', 'Risk Assessment Review', A));
    if (d.preRiskRatings.length > 0) {
      els.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: 'PRE-INCIDENT RISK RATING', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
      els.push(dataTable(
        [{ text: 'Hazard', width: rc[0] }, { text: 'Severity', width: rc[1] }, { text: 'Likelihood', width: rc[2] }, { text: 'Rating', width: rc[3] }],
        d.preRiskRatings.map(r => [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.rating, bold: true, color: ragText(r.ratingLevel).color }]),
        A));
    }
    if (d.postRiskRatings.length > 0) {
      els.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'POST-INCIDENT RISK RATING (REASSESSED)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
      els.push(dataTable(
        [{ text: 'Hazard', width: rc[0] }, { text: 'Severity', width: rc[1] }, { text: 'Likelihood', width: rc[2] }, { text: 'Rating', width: rc[3] }],
        d.postRiskRatings.map(r => [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.rating, bold: true, color: ragText(r.ratingLevel).color }]),
        A));
    }
    if (d.riskJustification) els.push(calloutPara(d.riskJustification, A, LBG));
  }

  // 10.0 Corrective Actions
  if (d.correctiveActions.length > 0) {
    const ac = [Math.round(W * 0.05), Math.round(W * 0.09), Math.round(W * 0.30), Math.round(W * 0.14), Math.round(W * 0.11), Math.round(W * 0.10), W - Math.round(W * 0.05) - Math.round(W * 0.09) - Math.round(W * 0.30) - Math.round(W * 0.14) - Math.round(W * 0.11) - Math.round(W * 0.10)];
    els.push(secHead('10.0', 'Corrective Actions', A));
    els.push(dataTable(
      [{ text: '#', width: ac[0] }, { text: 'Priority', width: ac[1] }, { text: 'Action', width: ac[2] }, { text: 'Owner', width: ac[3] }, { text: 'Due', width: ac[4] }, { text: 'Status', width: ac[5] }, { text: 'Verified', width: ac[6] }],
      d.correctiveActions.map((a, i) => [{ text: String(i + 1) }, { text: a.priority, bold: true, color: ragText(a.priority).color }, { text: a.action }, { text: a.owner }, { text: a.dueDate }, { text: a.status, bold: true, color: ragText(a.status).color }, { text: a.verifiedBy }]),
      A));
  }

  // 11.0 Lessons Learned
  if (d.lessonsLearned.length > 0) {
    const lc2 = [Math.round(W * 0.06), Math.round(W * 0.44), Math.round(W * 0.26), W - Math.round(W * 0.06) - Math.round(W * 0.44) - Math.round(W * 0.26)];
    els.push(secHead('11.0', 'Lessons Learned', A));
    els.push(dataTable(
      [{ text: '#', width: lc2[0] }, { text: 'Lesson', width: lc2[1] }, { text: 'How Shared', width: lc2[2] }, { text: 'Audience', width: lc2[3] }],
      d.lessonsLearned.map((l, i) => [{ text: String(i + 1) }, { text: l.lesson }, { text: l.howShared }, { text: l.audience }]),
      A));
  }

  // 12.0 Regulatory References
  els.push(secHead('12.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Description', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A));

  // 13.0 Distribution
  if (d.distributionEntries.length > 0) {
    const dc = [Math.round(W * 0.24), Math.round(W * 0.26), Math.round(W * 0.22), W - Math.round(W * 0.24) - Math.round(W * 0.26) - Math.round(W * 0.22)];
    els.push(secHead('13.0', 'Distribution', A));
    els.push(dataTable(
      [{ text: 'Recipient', width: dc[0] }, { text: 'Organisation', width: dc[1] }, { text: 'Method', width: dc[2] }, { text: 'Date', width: dc[3] }],
      d.distributionEntries.map(e => [{ text: e.recipient }, { text: e.organisation }, { text: e.method }, { text: e.date }]),
      A));
  }

  // 14.0 Sign-Off
  els.push(secHead('14.0', 'Sign-Off', A));
  els.push(signOff(['Investigation Lead', 'H&S Manager', 'Project Manager', 'Client Representative'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This incident investigation report must be reviewed with all involved parties. Corrective actions must be tracked to close-out. Records retained for minimum 40 years.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — RIDDOR FOCUSED (red, regulatory submission)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: IncidentReportData): (Paragraph | Table)[] {
  const A = RED_D; const LBG = RED_BG; const LC = RED_D;
  const els: (Paragraph | Table)[] = [];

  // Header band
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'RIDDOR INCIDENT INVESTIGATION REPORT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 \u00B7 F2508 Format', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '7f1d1d' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.principalContractor} | ${d.incidentDate}`, size: SM, font: 'Arial', color: 'fca5a5' })] }));

  // 1.0 Incident Classification
  els.push(secHead('1.0', 'Incident Classification', A));
  if (d.riddorCategories.length > 0) {
    const rc = [Math.round(W * 0.48), Math.round(W * 0.14), W - Math.round(W * 0.48) - Math.round(W * 0.14)];
    els.push(dataTable(
      [{ text: 'RIDDOR Category', width: rc[0] }, { text: 'Applicable?', width: rc[1] }, { text: 'Regulation', width: rc[2] }],
      d.riddorCategories.map(r => [{ text: r.category }, { text: r.applicable, bold: true, color: r.applicable.toLowerCase().includes('yes') ? GREEN_RAG : RED }, { text: r.regulation }]),
      A));
  }

  // 2.0 Statutory Reporting Timeline
  if (d.reportingMilestones.length > 0) {
    const mc = [Math.round(W * 0.28), Math.round(W * 0.18), Math.round(W * 0.14), W - Math.round(W * 0.28) - Math.round(W * 0.18) - Math.round(W * 0.14)];
    els.push(secHead('2.0', 'Statutory Reporting Timeline', A));
    els.push(dataTable(
      [{ text: 'Milestone', width: mc[0] }, { text: 'Date / Time', width: mc[1] }, { text: 'Status', width: mc[2] }, { text: 'Notes', width: mc[3] }],
      d.reportingMilestones.map(m => [{ text: m.milestone }, { text: m.dateTime }, { text: m.status, bold: true, color: ragText(m.status).color }, { text: m.notes }]),
      A));
  }

  // 3.0 Injured Person Details
  els.push(secHead('3.0', 'Injured Person Details (F2508 Part B)', A));
  els.push(infoTable([
    { label: 'Full Name', value: d.ipFullName }, { label: 'Date of Birth', value: d.ipDob },
    { label: 'NI Number', value: d.ipNiNumber }, { label: 'Gender', value: d.ipGender },
    { label: 'Occupation / Trade', value: d.ipOccupation }, { label: 'Employer', value: d.ipEmployer },
    { label: 'Employment Status', value: d.ipEmploymentStatus }, { label: 'Length of Service', value: d.ipLengthOfService },
    { label: 'CSCS Card', value: d.ipCscsCard }, { label: 'Training Current?', value: d.ipTrainingCurrent },
  ], LBG, LC));

  // 4.0 Injury Details
  els.push(secHead('4.0', 'Injury Details (F2508 Part C)', A));
  els.push(infoTable([
    { label: 'Nature of Injury', value: d.natureOfInjury }, { label: 'Body Part Affected', value: d.bodyPartAffected },
    { label: 'Mechanism of Injury', value: d.mechanismOfInjury }, { label: 'First Aid on Site?', value: d.firstAidOnSite },
    { label: 'Hospital Treatment?', value: d.hospitalTreatment }, { label: 'Admitted Overnight?', value: d.admittedOvernight },
    { label: 'Days Absent', value: d.daysAbsent }, { label: 'Return to Work Date', value: d.returnToWorkDate },
    { label: 'Permanent Disability?', value: d.permanentDisability },
  ], LBG, LC));

  // 5.0 Specified Injuries Checklist
  if (d.specifiedInjuries.length > 0) {
    const sc = [Math.round(W * 0.52), Math.round(W * 0.14), W - Math.round(W * 0.52) - Math.round(W * 0.14)];
    els.push(secHead('5.0', 'Specified Injuries Checklist (Schedule 1)', A));
    els.push(dataTable(
      [{ text: 'Specified Injury', width: sc[0] }, { text: 'Applicable?', width: sc[1] }, { text: 'Notes', width: sc[2] }],
      d.specifiedInjuries.map(s => [{ text: s.injury }, { text: s.applicable, bold: true, color: s.applicable.toLowerCase().includes('yes') ? GREEN_RAG : RED }, { text: s.notes }]),
      A));
  }

  // 6.0 Dangerous Occurrences
  if (d.dangerousOccurrences.length > 0) {
    const dc = [Math.round(W * 0.52), Math.round(W * 0.14), W - Math.round(W * 0.52) - Math.round(W * 0.14)];
    els.push(secHead('6.0', 'Dangerous Occurrences Checklist (Schedule 2)', A));
    els.push(dataTable(
      [{ text: 'Dangerous Occurrence', width: dc[0] }, { text: 'Applicable?', width: dc[1] }, { text: 'Notes', width: dc[2] }],
      d.dangerousOccurrences.map(o => [{ text: o.occurrence }, { text: o.applicable, bold: true, color: o.applicable.toLowerCase().includes('yes') ? GREEN_RAG : RED }, { text: o.notes }]),
      A));
  }

  // 7.0 Kind of Accident
  els.push(secHead('7.0', 'Kind of Accident (HSE Classification)', A));
  els.push(infoTable([
    { label: 'HSE Accident Kind Code', value: d.hseAccidentKindCode },
    { label: 'Agent Involved', value: d.agentInvolved },
    { label: 'Activity at Time', value: d.activityAtTimeHse },
    { label: 'Process', value: d.processHse },
    { label: 'SIC Code', value: d.sicCode },
  ], LBG, LC));

  // 8.0 Incident Particulars
  els.push(secHead('8.0', 'Incident Particulars', A));
  els.push(infoTable([
    { label: 'Date & Time', value: `${d.incidentDate} — ${d.incidentTime}` },
    { label: 'Location', value: d.exactLocation },
    { label: 'What was the IP doing?', value: d.activityAtTime },
    { label: 'How did the incident happen?', value: d.briefDescription },
    { label: 'What went wrong?', value: d.rootCauseStatement },
  ], LBG, LC));

  // 9.0 Defective Plant
  if (d.defectiveItems.length > 0) {
    const di = [Math.round(W * 0.16), Math.round(W * 0.12), Math.round(W * 0.30), Math.round(W * 0.22), W - Math.round(W * 0.16) - Math.round(W * 0.12) - Math.round(W * 0.30) - Math.round(W * 0.22)];
    els.push(secHead('9.0', 'Defective Plant, Substance & Equipment', A));
    els.push(dataTable(
      [{ text: 'Item', width: di[0] }, { text: 'ID/Ref', width: di[1] }, { text: 'Defect', width: di[2] }, { text: 'Action Taken', width: di[3] }, { text: 'Status', width: di[4] }],
      d.defectiveItems.map(i => [{ text: i.item }, { text: i.idRef }, { text: i.defect }, { text: i.actionTaken }, { text: i.status, bold: true, color: ragText(i.status).color }]),
      A));
  }

  // 10.0 Witness Statements
  if (d.witnessEntries.length > 0) {
    const wc = [Math.round(W * 0.14), Math.round(W * 0.12), Math.round(W * 0.48), W - Math.round(W * 0.14) - Math.round(W * 0.12) - Math.round(W * 0.48)];
    els.push(secHead('10.0', 'Witness Statements Summary', A));
    els.push(dataTable(
      [{ text: 'Witness', width: wc[0] }, { text: 'Role', width: wc[1] }, { text: 'Key Points', width: wc[2] }, { text: 'Ref', width: wc[3] }],
      d.witnessEntries.map(w => [{ text: w.name, bold: true }, { text: w.role }, { text: w.keyPoints }, { text: w.statementRef }]),
      A));
  }

  // 11.0 Medical Treatment
  if (d.medicalEntries.length > 0) {
    const me = [Math.round(W * 0.16), Math.round(W * 0.18), Math.round(W * 0.38), W - Math.round(W * 0.16) - Math.round(W * 0.18) - Math.round(W * 0.38)];
    els.push(secHead('11.0', 'Medical Treatment Record', A));
    els.push(dataTable(
      [{ text: 'Date', width: me[0] }, { text: 'Provider', width: me[1] }, { text: 'Treatment', width: me[2] }, { text: 'Outcome', width: me[3] }],
      d.medicalEntries.map(m => [{ text: m.date }, { text: m.provider }, { text: m.treatment }, { text: m.outcome }]),
      A));
  }

  // 12.0 Immediate Causes & Root Cause
  els.push(secHead('12.0', 'Immediate Causes & Root Cause Summary', A));
  if (d.immediateCauses.length > 0) {
    const ic = [Math.round(W * 0.14), Math.round(W * 0.42), W - Math.round(W * 0.14) - Math.round(W * 0.42)];
    els.push(dataTable(
      [{ text: 'Type', width: ic[0] }, { text: 'Cause', width: ic[1] }, { text: 'Significance', width: ic[2] }],
      d.immediateCauses.map(c => [{ text: c.category, bold: true }, { text: c.cause }, { text: c.evidence, bold: true, color: ragText(c.evidence).color }]),
      A));
  }

  // 13.0 Corrective Actions
  if (d.correctiveActions.length > 0) {
    const ac = [Math.round(W * 0.05), Math.round(W * 0.08), Math.round(W * 0.28), Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.10), W - Math.round(W * 0.05) - Math.round(W * 0.08) - Math.round(W * 0.28) - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.10)];
    els.push(secHead('13.0', 'Corrective Actions', A));
    els.push(dataTable(
      [{ text: '#', width: ac[0] }, { text: 'Priority', width: ac[1] }, { text: 'Action', width: ac[2] }, { text: 'Owner', width: ac[3] }, { text: 'Due', width: ac[4] }, { text: 'Status', width: ac[5] }, { text: 'F2508?', width: ac[6] }],
      d.correctiveActions.map((a, i) => [{ text: String(i + 1) }, { text: a.priority, bold: true, color: ragText(a.priority).color }, { text: a.action }, { text: a.owner }, { text: a.dueDate }, { text: a.status, bold: true, color: ragText(a.status).color }, { text: a.f2508Linked }]),
      A));
  }

  // 14.0 Enforcing Authority
  els.push(secHead('14.0', 'Enforcing Authority Notification', A));
  els.push(infoTable([
    { label: 'Enforcing Authority', value: d.enforcingAuthority },
    { label: 'Regional Office', value: d.hseRegionalOffice },
    { label: 'F2508 Ref Number', value: d.f2508Ref },
    { label: 'Date Submitted', value: d.dateReported },
    { label: 'HSE Inspector Notified?', value: d.hseInspectorNotified },
    { label: 'Scene Preserved?', value: d.scenePreserved },
    { label: 'Improvement Notice?', value: d.improvementNotice },
    { label: 'Prohibition Notice?', value: d.prohibitionNotice },
  ], LBG, LC));

  // 15.0 Notification Checklist
  if (d.notificationItems.length > 0) {
    const nc = [Math.round(W * 0.48), Math.round(W * 0.14), W - Math.round(W * 0.48) - Math.round(W * 0.14)];
    els.push(secHead('15.0', 'Statutory Notification Checklist', A));
    els.push(dataTable(
      [{ text: 'Requirement', width: nc[0] }, { text: 'Completed?', width: nc[1] }, { text: 'Notes', width: nc[2] }],
      d.notificationItems.map(n => [{ text: n.requirement }, { text: n.completed, bold: true, color: n.completed.toLowerCase().includes('yes') || n.completed.toLowerCase().includes('confirmed') ? GREEN_RAG : AMBER }, { text: n.notes }]),
      A));
  }

  // 16.0 Regulatory References
  els.push(secHead('16.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Description', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A));

  // 17.0 Sign-Off
  els.push(secHead('17.0', 'Sign-Off & Authorisation', A));
  els.push(signOff(['Investigation Lead', 'H&S Manager', 'Project Manager', 'Client H&S Representative', 'Enforcing Authority Liaison'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This RIDDOR investigation report is a controlled document. Personal and medical data must be handled in accordance with GDPR and Data Protection Act 2018. Records retained for minimum 40 years.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — ROOT CAUSE ANALYSIS (navy, analytical)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: IncidentReportData): (Paragraph | Table)[] {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY;
  const els: (Paragraph | Table)[] = [];

  // Header
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [new TextRun({ text: 'INCIDENT ROOT CAUSE ANALYSIS', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 80 }, children: [new TextRun({ text: 'Structured Investigation \u00B7 5 Whys \u00B7 Contributing Factors \u00B7 Barrier Analysis \u00B7 Systemic Recommendations', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '334155' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.principalContractor} | Investigation: ${d.reportDate}`, size: SM, font: 'Arial', color: 'cbd5e1' })] }));

  // 1.0 Investigation Summary
  els.push(secHead('1.0', 'Investigation Summary', A));
  els.push(infoTable([
    { label: 'Investigation Ref', value: d.documentRef }, { label: 'Investigation Lead', value: d.investigationLead },
    { label: 'Investigation Method', value: '5 Whys, Contributing Factors Matrix, Barrier Analysis, Causal Chain' },
    { label: 'HSE Guidance Ref', value: 'HSG245 — Investigating Accidents and Incidents' },
  ], LBG, LC));

  // 2.0 Incident Facts
  els.push(secHead('2.0', 'Incident Facts', A));
  els.push(infoTable([
    { label: 'Date / Time', value: `${d.incidentDate} — ${d.incidentTime}` },
    { label: 'Location', value: d.exactLocation },
    { label: 'Activity', value: d.activityAtTime },
    { label: 'Injured Person', value: d.personsInvolved.length > 0 ? `${d.personsInvolved[0].name} — ${d.personsInvolved[0].role}. ${d.personsInvolved[0].injuryDescription}` : d.briefDescription },
    { label: 'RIDDOR Category', value: `${d.reportingCategory}. F2508 ref: ${d.f2508Ref}` },
  ], LBG, LC));

  // 3.0 5 Whys Deep-Dive
  if (d.whyEntries.length > 0) {
    const wc = [Math.round(W * 0.08), Math.round(W * 0.38), W - Math.round(W * 0.08) - Math.round(W * 0.38)];
    els.push(secHead('3.0', '5 Whys Analysis — Deep Dive', A));
    els.push(dataTable(
      [{ text: 'Why', width: wc[0] }, { text: 'Question', width: wc[1] }, { text: 'Answer', width: wc[2] }],
      d.whyEntries.map(w => [{ text: w.why, bold: true }, { text: w.question }, { text: w.answer }]),
      A, 'f8fafc'));
    if (d.rootCauseStatement) {
      els.push(new Paragraph({ spacing: { before: 120, after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 }, top: { style: BorderStyle.SINGLE, size: 2, color: RED }, bottom: { style: BorderStyle.SINGLE, size: 2, color: RED }, right: { style: BorderStyle.SINGLE, size: 2, color: RED } },
        shading: { type: ShadingType.CLEAR, fill: RED_BG },
        children: [new TextRun({ text: `ROOT CAUSE: ${d.rootCauseStatement}`, bold: true, size: SM + 2, font: 'Arial', color: RED_D })] }));
    }
  }

  // 4.0 Contributing Factors
  if (d.contributingFactors.length > 0) {
    const fc = [Math.round(W * 0.10), Math.round(W * 0.30), Math.round(W * 0.10), Math.round(W * 0.22), W - Math.round(W * 0.10) - Math.round(W * 0.30) - Math.round(W * 0.10) - Math.round(W * 0.22)];
    els.push(secHead('4.0', 'Contributing Factors Matrix', A));
    els.push(dataTable(
      [{ text: 'Category', width: fc[0] }, { text: 'Factor', width: fc[1] }, { text: 'Rating', width: fc[2] }, { text: 'Systemic Link', width: fc[3] }, { text: 'Evidence', width: fc[4] }],
      d.contributingFactors.map(f => [{ text: f.category, bold: true }, { text: f.factor }, { text: f.significance, bold: true, color: ragText(f.significance).color }, { text: f.systemLink }, { text: f.evidence }]),
      A, 'f8fafc'));
  }

  // 5.0 Barrier Analysis
  if (d.barrierEntries.length > 0) {
    const bc = [Math.round(W * 0.06), Math.round(W * 0.20), Math.round(W * 0.28), Math.round(W * 0.10), W - Math.round(W * 0.06) - Math.round(W * 0.20) - Math.round(W * 0.28) - Math.round(W * 0.10)];
    els.push(secHead('5.0', 'Barrier Analysis', A));
    els.push(dataTable(
      [{ text: '#', width: bc[0] }, { text: 'Defence Layer', width: bc[1] }, { text: 'Expected Barrier', width: bc[2] }, { text: 'Status', width: bc[3] }, { text: 'Failure Mode', width: bc[4] }],
      d.barrierEntries.map((b, i) => [{ text: String(i + 1) }, { text: b.defenceLayer, bold: true }, { text: b.expectedBarrier }, { text: b.status, bold: true, color: ragText(b.status).color }, { text: b.failureMode }]),
      A, 'f8fafc'));
    if (d.barrierSummary) els.push(calloutPara(d.barrierSummary, BLUE, BLUE_BG));
  }

  // 6.0 Causal Chain
  if (d.causalChainSteps.length > 0) {
    const cc = [Math.round(W * 0.06), Math.round(W * 0.18), Math.round(W * 0.14), Math.round(W * 0.34), W - Math.round(W * 0.06) - Math.round(W * 0.18) - Math.round(W * 0.14) - Math.round(W * 0.34)];
    els.push(secHead('6.0', 'Causal Chain', A));
    els.push(dataTable(
      [{ text: 'Step', width: cc[0] }, { text: 'Event', width: cc[1] }, { text: 'Category', width: cc[2] }, { text: 'Description', width: cc[3] }, { text: 'Link', width: cc[4] }],
      d.causalChainSteps.map(c => [{ text: c.step, bold: true }, { text: c.event }, { text: c.category }, { text: c.description }, { text: c.linkToNext }]),
      A, 'f8fafc'));
  }

  // 7.0 Risk Re-Rating
  if (d.preRiskRatings.length > 0 || d.postRiskRatings.length > 0) {
    const rc = [Math.round(W * 0.22), Math.round(W * 0.12), Math.round(W * 0.14), Math.round(W * 0.12), Math.round(W * 0.14), Math.round(W * 0.12), W - Math.round(W * 0.22) - Math.round(W * 0.12) - Math.round(W * 0.14) - Math.round(W * 0.12) - Math.round(W * 0.14) - Math.round(W * 0.12)];
    els.push(secHead('7.0', 'Risk Re-Rating', A));
    els.push(dataTable(
      [{ text: 'Hazard', width: rc[0] }, { text: 'Severity', width: rc[1] }, { text: 'Pre-Likelihood', width: rc[2] }, { text: 'Pre-Rating', width: rc[3] }, { text: 'Post-Likelihood', width: rc[4] }, { text: 'Post-Rating', width: rc[5] }, { text: 'Justification', width: rc[6] }],
      d.preRiskRatings.map((r, i) => {
        const post = d.postRiskRatings[i] || { likelihood: '', rating: '', ratingLevel: '' };
        return [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.rating, bold: true, color: ragText(r.ratingLevel).color }, { text: post.likelihood }, { text: post.rating, bold: true, color: ragText(post.ratingLevel).color }, { text: d.riskJustification || '' }];
      }),
      A, 'f8fafc'));
    if (d.targetRatings.length > 0) {
      const tr = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.22) - Math.round(W * 0.14) - Math.round(W * 0.16) - Math.round(W * 0.14)];
      els.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'TARGET RISK RATINGS (AFTER CORRECTIVE ACTIONS)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
      els.push(dataTable(
        [{ text: 'Hazard', width: tr[0] }, { text: 'Severity', width: tr[1] }, { text: 'Target Likelihood', width: tr[2] }, { text: 'Target Rating', width: tr[3] }, { text: 'Controls Required', width: tr[4] }],
        d.targetRatings.map(t => [{ text: t.hazard }, { text: t.severity }, { text: t.targetLikelihood }, { text: t.targetRating, bold: true, color: ragText(t.targetRating).color }, { text: t.controlsRequired }]),
        A, 'f8fafc'));
    }
  }

  // 8.0 Systemic vs Local
  if (d.systemicRecs.length > 0) {
    const sr = [Math.round(W * 0.05), Math.round(W * 0.34), Math.round(W * 0.22), Math.round(W * 0.16), W - Math.round(W * 0.05) - Math.round(W * 0.34) - Math.round(W * 0.22) - Math.round(W * 0.16)];
    els.push(secHead('8.0', 'Systemic vs Local Recommendations', A));
    els.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: 'SYSTEMIC RECOMMENDATIONS (ORGANISATION-WIDE)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
    els.push(dataTable(
      [{ text: '#', width: sr[0] }, { text: 'Recommendation', width: sr[1] }, { text: 'System Element', width: sr[2] }, { text: 'Owner', width: sr[3] }, { text: 'Timeline', width: sr[4] }],
      d.systemicRecs.map(r => [{ text: r.ref }, { text: r.recommendation }, { text: r.systemElement }, { text: r.owner }, { text: r.timeline }]),
      A, 'f8fafc'));
  }
  if (d.localRecs.length > 0) {
    const lr = [Math.round(W * 0.05), Math.round(W * 0.38), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.05) - Math.round(W * 0.38) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'LOCAL RECOMMENDATIONS (SITE-SPECIFIC)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
    els.push(dataTable(
      [{ text: '#', width: lr[0] }, { text: 'Recommendation', width: lr[1] }, { text: 'Owner', width: lr[2] }, { text: 'Due', width: lr[3] }, { text: 'Status', width: lr[4] }],
      d.localRecs.map(r => [{ text: r.ref }, { text: r.recommendation }, { text: r.owner }, { text: r.dueDate }, { text: r.status, bold: true, color: ragText(r.status).color }]),
      A, 'f8fafc'));
  }

  // 9.0 Management System Gaps
  if (d.mgmtGaps.length > 0) {
    const mg = [Math.round(W * 0.06), Math.round(W * 0.18), Math.round(W * 0.32), Math.round(W * 0.16), W - Math.round(W * 0.06) - Math.round(W * 0.18) - Math.round(W * 0.32) - Math.round(W * 0.16)];
    els.push(secHead('9.0', 'Management System Gaps Identified', A));
    els.push(dataTable(
      [{ text: 'Gap', width: mg[0] }, { text: 'System Element', width: mg[1] }, { text: 'Gap Description', width: mg[2] }, { text: 'Standard Ref', width: mg[3] }, { text: 'Priority', width: mg[4] }],
      d.mgmtGaps.map(g => [{ text: g.gap }, { text: g.systemElement, bold: true }, { text: g.description }, { text: g.standardRef }, { text: g.priority, bold: true, color: ragText(g.priority).color }]),
      A, 'f8fafc'));
  }

  // 10.0 Corrective Actions with KPIs
  if (d.correctiveActions.length > 0) {
    const ac = [Math.round(W * 0.04), Math.round(W * 0.26), Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.20), W - Math.round(W * 0.04) - Math.round(W * 0.26) - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.10) - Math.round(W * 0.20)];
    els.push(secHead('10.0', 'Corrective Actions with Verification KPIs', A));
    els.push(dataTable(
      [{ text: '#', width: ac[0] }, { text: 'Action', width: ac[1] }, { text: 'Owner', width: ac[2] }, { text: 'Due', width: ac[3] }, { text: 'Status', width: ac[4] }, { text: 'Verification KPI', width: ac[5] }, { text: 'Close-Out', width: ac[6] }],
      d.correctiveActions.map((a, i) => [{ text: String(i + 1) }, { text: a.action }, { text: a.owner }, { text: a.dueDate }, { text: a.status, bold: true, color: ragText(a.status).color }, { text: a.kpi }, { text: a.verifiedBy }]),
      A, 'f8fafc'));
  }

  // 11.0 Close-Out Plan
  if (d.closeOutMilestones.length > 0) {
    const co = [Math.round(W * 0.14), Math.round(W * 0.14), Math.round(W * 0.34), Math.round(W * 0.14), W - Math.round(W * 0.14) - Math.round(W * 0.14) - Math.round(W * 0.34) - Math.round(W * 0.14)];
    els.push(secHead('11.0', 'Verification & Close-Out Plan', A));
    els.push(dataTable(
      [{ text: 'Milestone', width: co[0] }, { text: 'Target Date', width: co[1] }, { text: 'Activity', width: co[2] }, { text: 'Owner', width: co[3] }, { text: 'Verification', width: co[4] }],
      d.closeOutMilestones.map(c => [{ text: c.milestone }, { text: c.targetDate }, { text: c.activity }, { text: c.owner }, { text: c.verification }]),
      A, 'f8fafc'));
  }

  // 12.0 Regulatory References
  els.push(secHead('12.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Relevance', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A, 'f8fafc'));

  // 13.0 Sign-Off
  els.push(secHead('13.0', 'Sign-Off & Close-Out Authorisation', A));
  els.push(signOff(['Investigation Lead', 'H&S Manager', 'Project Manager', 'Client Representative', 'Close-Out Authoriser'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'Root cause analysis conducted in accordance with HSE HSG245 and ISO 45001:2018 Clause 10.2. Corrective actions must be tracked to verified close-out. Records retained for minimum 40 years.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — NEAR MISS / OBSERVATION (amber, compact)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: IncidentReportData): (Paragraph | Table)[] {
  const A = ORANGE; const LBG = ORANGE_BG; const LC = ORANGE;
  const els: (Paragraph | Table)[] = [];

  // Header
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ORANGE }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'NEAR MISS / OBSERVATION REPORT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ORANGE }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Early Warning System \u00B7 Proactive Hazard Identification \u00B7 Prevention Before Harm', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '78350f' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.principalContractor} | ${d.dateObserved || d.incidentDate}`, size: SM, font: 'Arial', color: 'fcd34d' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_BG }, alignment: AlignmentType.CENTER, spacing: { after: 120 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: AMBER }, bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER } },
    children: [new TextRun({ text: '\u26A0 NO INJURY OCCURRED \u2014 THIS REPORT RECORDS A NEAR MISS FOR PREVENTION PURPOSES \u26A0', bold: true, size: BODY, font: 'Arial', color: ORANGE })] }));

  // 1.0 Observation Details
  els.push(secHead('1.0', 'Observation Details', A));
  els.push(infoTable([
    { label: 'Report Ref', value: d.documentRef },
    { label: 'Date / Time Observed', value: `${d.dateObserved || d.incidentDate} — ${d.timeObserved || d.incidentTime}` },
    { label: 'Reported By', value: `${d.observerName || d.investigationLead} — ${d.observerRole || ''}` },
    { label: 'Location', value: d.exactLocation },
    { label: 'Activity at Time', value: d.activityAtTime },
    { label: 'Persons in Area', value: d.personsInArea },
  ], LBG, LC));

  // 2.0 Classification
  if (d.classificationItems.length > 0) {
    const cl = [Math.round(W * 0.42), Math.round(W * 0.14), W - Math.round(W * 0.42) - Math.round(W * 0.14)];
    els.push(secHead('2.0', 'Observation Classification', A));
    els.push(dataTable(
      [{ text: 'Classification Type', width: cl[0] }, { text: 'Applicable?', width: cl[1] }, { text: 'Notes', width: cl[2] }],
      d.classificationItems.map(c => [{ text: c.type }, { text: c.applicable, bold: true, color: c.applicable.toLowerCase().includes('yes') ? GREEN_RAG : GREY_RAG }, { text: c.notes }]),
      A));
    els.push(infoTable([
      { label: 'Primary Classification', value: d.primaryClassification },
      { label: 'Description', value: d.nmDescription || d.briefDescription },
    ], LBG, LC));
  }

  // 3.0 Potential Severity
  if (d.potentialOutcomeStatement) {
    els.push(secHead('3.0', 'Potential Severity Assessment', A));
    els.push(new Paragraph({ spacing: { before: 60, after: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 }, top: { style: BorderStyle.SINGLE, size: 2, color: RED }, bottom: { style: BorderStyle.SINGLE, size: 2, color: RED }, right: { style: BorderStyle.SINGLE, size: 2, color: RED } },
      shading: { type: ShadingType.CLEAR, fill: RED_BG },
      children: [new TextRun({ text: `POTENTIAL OUTCOME: ${d.potentialOutcomeStatement}`, bold: true, size: SM + 2, font: 'Arial', color: RED_D })] }));
  }
  if (d.severityAssessments.length > 0) {
    const sa = [Math.round(W * 0.26), Math.round(W * 0.14), W - Math.round(W * 0.26) - Math.round(W * 0.14)];
    els.push(dataTable(
      [{ text: 'Assessment Factor', width: sa[0] }, { text: 'Rating', width: sa[1] }, { text: 'Rationale', width: sa[2] }],
      d.severityAssessments.map(s => [{ text: s.factor }, { text: s.rating, bold: true, color: ragText(s.rating).color }, { text: s.rationale }]),
      A));
  }

  // 4.0 Hazard Identification
  if (d.hazardIdents.length > 0) {
    const hi = [Math.round(W * 0.20), Math.round(W * 0.30), Math.round(W * 0.12), W - Math.round(W * 0.20) - Math.round(W * 0.30) - Math.round(W * 0.12)];
    els.push(secHead('4.0', 'Hazard Identification', A));
    els.push(dataTable(
      [{ text: 'Hazard', width: hi[0] }, { text: 'Description', width: hi[1] }, { text: 'Risk Level', width: hi[2] }, { text: 'Current Controls', width: hi[3] }],
      d.hazardIdents.map(h2 => [{ text: h2.hazard, bold: true }, { text: h2.description }, { text: h2.riskLevel, bold: true, color: ragText(h2.riskLevel).color }, { text: h2.currentControls }]),
      A));
  }

  // 5.0 Immediate Action Taken
  if (d.immediateActionsTaken.length > 0) {
    const ia = [Math.round(W * 0.06), Math.round(W * 0.36), Math.round(W * 0.18), Math.round(W * 0.14), W - Math.round(W * 0.06) - Math.round(W * 0.36) - Math.round(W * 0.18) - Math.round(W * 0.14)];
    els.push(secHead('5.0', 'Immediate Action Taken', A));
    els.push(dataTable(
      [{ text: '#', width: ia[0] }, { text: 'Action', width: ia[1] }, { text: 'Taken By', width: ia[2] }, { text: 'Time', width: ia[3] }, { text: 'Outcome', width: ia[4] }],
      d.immediateActionsTaken.map((a, i) => [{ text: String(i + 1) }, { text: a.action }, { text: a.owner }, { text: a.dueDate }, { text: a.status }]),
      A));
  }

  // 6.0 Underlying Causes
  if (d.underlyingCauses.length > 0) {
    const uc = [Math.round(W * 0.14), Math.round(W * 0.36), Math.round(W * 0.14), W - Math.round(W * 0.14) - Math.round(W * 0.36) - Math.round(W * 0.14)];
    els.push(secHead('6.0', 'Underlying Causes', A));
    els.push(dataTable(
      [{ text: 'Category', width: uc[0] }, { text: 'Underlying Cause', width: uc[1] }, { text: 'Significance', width: uc[2] }, { text: 'Link to Prevention', width: uc[3] }],
      d.underlyingCauses.map(u => [{ text: u.category, bold: true }, { text: u.cause }, { text: u.significance, bold: true, color: ragText(u.significance).color }, { text: u.link }]),
      A));
  }

  // 7.0 Prevention Measures
  els.push(secHead('7.0', 'Prevention Measures', A));
  if (d.immediateFixes.length > 0) {
    els.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: 'IMMEDIATE FIX (SITE-SPECIFIC)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
    const fi = [Math.round(W * 0.06), Math.round(W * 0.36), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.06) - Math.round(W * 0.36) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(dataTable(
      [{ text: '#', width: fi[0] }, { text: 'Action', width: fi[1] }, { text: 'Owner', width: fi[2] }, { text: 'Due', width: fi[3] }, { text: 'Status', width: fi[4] }],
      d.immediateFixes.map((f, i) => [{ text: String(i + 1) }, { text: f.action }, { text: f.owner }, { text: f.dueDate }, { text: f.status, bold: true, color: ragText(f.status).color }]),
      A));
  }
  if (d.systemicActions.length > 0) {
    els.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'SYSTEMIC ACTION (PREVENT RECURRENCE)', bold: true, size: SM + 2, font: 'Arial', color: A })] }));
    const si = [Math.round(W * 0.06), Math.round(W * 0.36), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.06) - Math.round(W * 0.36) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(dataTable(
      [{ text: '#', width: si[0] }, { text: 'Action', width: si[1] }, { text: 'Owner', width: si[2] }, { text: 'Due', width: si[3] }, { text: 'Status', width: si[4] }],
      d.systemicActions.map((s, i) => [{ text: String(i + 1) }, { text: s.action }, { text: s.owner }, { text: s.dueDate }, { text: s.status, bold: true, color: ragText(s.status).color }]),
      A));
  }

  // 8.0 Previous Occurrences
  if (d.previousOccurrences.length > 0) {
    const po = [Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.32), Math.round(W * 0.14), W - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.32) - Math.round(W * 0.14)];
    els.push(secHead('8.0', 'Similar Previous Occurrences', A));
    els.push(dataTable(
      [{ text: 'Date', width: po[0] }, { text: 'Ref', width: po[1] }, { text: 'Description', width: po[2] }, { text: 'Outcome', width: po[3] }, { text: 'Lessons Applied?', width: po[4] }],
      d.previousOccurrences.map(p => [{ text: p.date }, { text: p.ref }, { text: p.description }, { text: p.outcome, bold: true, color: ragText(p.outcome).color }, { text: p.lessonsApplied }]),
      A));
    if (d.trendStatement) els.push(calloutPara(d.trendStatement, AMBER, AMBER_BG));
  }

  // 9.0 Communication
  if (d.commEntries.length > 0) {
    const ce = [Math.round(W * 0.24), Math.round(W * 0.28), Math.round(W * 0.16), W - Math.round(W * 0.24) - Math.round(W * 0.28) - Math.round(W * 0.16)];
    els.push(secHead('9.0', 'Communication & Sharing', A));
    els.push(dataTable(
      [{ text: 'Audience', width: ce[0] }, { text: 'Method', width: ce[1] }, { text: 'Date', width: ce[2] }, { text: 'Status', width: ce[3] }],
      d.commEntries.map(c => [{ text: c.audience }, { text: c.method }, { text: c.date }, { text: c.status, bold: true, color: ragText(c.status).color }]),
      A));
  }

  // 10.0 Positive Observations
  if (d.positiveObservations.length > 0) {
    const pov = [Math.round(W * 0.06), Math.round(W * 0.50), W - Math.round(W * 0.06) - Math.round(W * 0.50)];
    els.push(secHead('10.0', 'Positive Observations', A));
    els.push(dataTable(
      [{ text: '#', width: pov[0] }, { text: 'Positive Behaviour / Outcome', width: pov[1] }, { text: 'Significance', width: pov[2] }],
      d.positiveObservations.map((p, i) => [{ text: String(i + 1) }, { text: p.observation }, { text: p.significance }]),
      A));
  }

  // 11.0 Follow-Up
  if (d.followUpActions.length > 0) {
    const fu = [Math.round(W * 0.14), Math.round(W * 0.14), Math.round(W * 0.34), Math.round(W * 0.14), W - Math.round(W * 0.14) - Math.round(W * 0.14) - Math.round(W * 0.34) - Math.round(W * 0.14)];
    els.push(secHead('11.0', 'Follow-Up Actions & Close-Out', A));
    els.push(dataTable(
      [{ text: 'Follow-Up', width: fu[0] }, { text: 'Date', width: fu[1] }, { text: 'Activity', width: fu[2] }, { text: 'Owner', width: fu[3] }, { text: 'Status', width: fu[4] }],
      d.followUpActions.map(f => [{ text: f.milestone }, { text: f.targetDate }, { text: f.activity }, { text: f.owner }, { text: f.verification }]),
      A));
  }

  // 12.0 Reporter Recognition
  if (d.reporterRecognition) {
    els.push(secHead('12.0', 'Reporter Recognition', A));
    els.push(calloutPara(d.reporterRecognition, GREEN_RAG, GREEN_BG));
  }

  // 13.0 Sign-Off
  els.push(secHead('13.0', 'Sign-Off', A));
  els.push(signOff(['Reported By', 'Site Supervisor', 'H&S Advisor', 'Project Manager'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'Near miss reporting is essential for proactive safety management. All near misses must be investigated within 48 hours and corrective actions tracked to close-out.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildIncidentReportTemplateDocument(
  content: any,
  templateSlug: IncidentReportTemplateSlug
): Promise<Document> {
  const d = extract(content);
  let children: (Paragraph | Table)[];

  switch (templateSlug) {
    case 'ebrora-standard': children = buildT1(d); break;
    case 'riddor-focused':  children = buildT2(d); break;
    case 'root-cause':      children = buildT3(d); break;
    case 'near-miss':       children = buildT4(d); break;
    default:                children = buildT1(d); break;
  }

  const headerLabel = templateSlug === 'near-miss' ? 'Near Miss / Observation Report'
    : templateSlug === 'riddor-focused' ? 'RIDDOR Incident Report'
    : templateSlug === 'root-cause' ? 'Incident Root Cause Analysis'
    : 'Incident Investigation Report';

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader(headerLabel) },
      footers: { default: h.ebroraFooter() },
      children,
    }],
  });
}
