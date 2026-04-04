// =============================================================================
// Incident Report Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, comprehensive, 5 Whys, corrective actions)
// T2 — RIDDOR Focused     (red #991B1B, regulatory, F2508, checklists, witnesses)
// T3 — Root Cause Analysis (navy #1e293b, analytical, barrier analysis, 30/60/90)
// T4 — Near Miss           (amber #D97706, compact, KPI dashboard, prevention)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { IncidentReportTemplateSlug } from '@/lib/incident-report/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22; const XL = 28;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Colours
const GREEN = '059669'; const GREEN_DARK = '143D2B'; const GREEN_BG = 'D1FAE5';
const RED_D = '991B1B'; const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const AMBER = 'D97706'; const AMBER_DARK = '92400E'; const AMBER_BG = 'FEF3C7';
const NAVY = '1e293b'; const NAVY_ACCENT = '334155'; const NAVY_BG = 'f1f5f9';
const GREEN_RAG = '059669'; const GREY = '6B7280'; const GREY_BG = 'F3F4F6';
const BLUE_BORDER = '3B82F6'; const BLUE_BG = 'EFF6FF'; const BLUE_TEXT = '1E3A5F';
const ZEBRA = 'F5F5F5';

// RAG/status colour helper
function statusColor(level: string): string {
  const l = (level || '').toLowerCase();
  if (['critical','high','immediate','fatal','major','failed','absent','yes'].includes(l)) return RED;
  if (['medium','amber','in progress','planned','weakened','pending','within 1 week'].includes(l)) return AMBER;
  if (['low','green','closed','done','completed','effective','none','good'].includes(l)) return GREEN_RAG;
  return GREY;
}

// ── Data Interfaces ──────────────────────────────────────────────────────────
interface PersonInvolved { name: string; role: string; employer: string; injuryDescription: string; treatmentGiven: string; daysLost: string; returnDate: string; }
interface TimelineEntry { time: string; event: string; source: string; }
interface ImmediateCause { category: string; cause: string; evidence: string; }
interface WhyEntry { why: string; question: string; answer: string; }
interface ContributingFactor { category: string; factor: string; significance: string; systemLink: string; evidence: string; }
interface RiddorCategory { category: string; applicable: string; regulation: string; notes: string; }
interface SpecifiedInjury { injury: string; applicable: string; notes: string; }
interface DangerousOccurrence { occurrence: string; applicable: string; notes: string; paragraph: string; }
interface EvidenceItem { type: string; description: string; collectedBy: string; date: string; }
interface RiskRating { hazard: string; severity: string; likelihood: string; rating: string; ratingLevel: string; }
interface CorrectiveAction { action: string; priority: string; owner: string; dueDate: string; status: string; verifiedBy: string; kpi: string; f2508Linked: string; }
interface LessonLearned { lesson: string; howShared: string; audience: string; }
interface DistributionEntry { recipient: string; organisation: string; method: string; date: string; }
interface ReportingMilestone { milestone: string; dateTime: string; status: string; notes: string; }
interface DefectiveItem { item: string; idRef: string; defect: string; actionTaken: string; status: string; }
interface WitnessEntry { name: string; role: string; keyPoints: string; statementRef: string; }
interface MedicalEntry { date: string; provider: string; treatment: string; outcome: string; }
interface NotificationItem { requirement: string; completed: string; notes: string; }
interface BarrierEntry { defenceLayer: string; expectedBarrier: string; status: string; failureMode: string; barrierType: string; }
interface CausalChainStep { step: string; event: string; category: string; description: string; linkToNext: string; }
interface TargetRating { hazard: string; severity: string; targetLikelihood: string; targetRating: string; controlsRequired: string; }
interface SystemicRec { ref: string; recommendation: string; systemElement: string; owner: string; timeline: string; }
interface LocalRec { ref: string; recommendation: string; owner: string; dueDate: string; status: string; }
interface MgmtGap { gap: string; systemElement: string; description: string; standardRef: string; priority: string; }
interface CloseOutMilestone { milestone: string; targetDate: string; activity: string; owner: string; verification: string; }
interface SeverityAssessment { factor: string; rating: string; rationale: string; }
interface HazardIdent { hazard: string; description: string; riskLevel: string; currentControls: string; }
interface UnderlyingCause { category: string; cause: string; significance: string; link: string; }
interface PreviousOccurrence { date: string; ref: string; description: string; outcome: string; lessonsApplied: string; }
interface PositiveObs { observation: string; significance: string; }
interface RegRef { reference: string; description: string; }

interface IncidentReportData {
  documentRef: string; incidentDate: string; incidentTime: string;
  reportDate: string; investigationLead: string; reportedBy: string;
  projectName: string; siteAddress: string; exactLocation: string;
  principalContractor: string; client: string; contractRef: string;
  incidentCategory: string; riddorReportable: string;
  actualSeverity: string; potentialSeverity: string;
  activityAtTime: string; weatherConditions: string;
  briefDescription: string; immediateOutcome: string;
  personsInvolved: PersonInvolved[];
  timelineEntries: TimelineEntry[];
  immediateCauses: ImmediateCause[];
  whyEntries: WhyEntry[];
  rootCauseStatement: string;
  contributingFactors: ContributingFactor[];
  riddorCategories: RiddorCategory[];
  specifiedInjuries: SpecifiedInjury[];
  dangerousOccurrences: DangerousOccurrence[];
  f2508Ref: string; enforcingAuthority: string; hseRegionalOffice: string;
  hseAccidentKindCode: string; workProcessCode: string; agentCode: string;
  reportingMilestones: ReportingMilestone[];
  defectiveItems: DefectiveItem[];
  witnessEntries: WitnessEntry[];
  medicalEntries: MedicalEntry[];
  notificationItems: NotificationItem[];
  evidenceItems: EvidenceItem[];
  preRiskRatings: RiskRating[];
  postRiskRatings: RiskRating[];
  targetRatings: TargetRating[];
  riskJustification: string;
  correctiveActions: CorrectiveAction[];
  lessonsLearned: LessonLearned[];
  distributionEntries: DistributionEntry[];
  barrierEntries: BarrierEntry[];
  barrierSummary: string;
  systemicRecs: SystemicRec[];
  localRecs: LocalRec[];
  mgmtGaps: MgmtGap[];
  closeOutMilestones: CloseOutMilestone[];
  // Near miss
  observerName: string; observerRole: string;
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
  positiveObservations: PositiveObs[];
  reporterRecognition: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): IncidentReportData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), incidentDate: s(c.incidentDate), incidentTime: s(c.incidentTime),
    reportDate: s(c.reportDate), investigationLead: s(c.investigationLead), reportedBy: s(c.reportedBy),
    projectName: s(c.projectName), siteAddress: s(c.siteAddress), exactLocation: s(c.exactLocation),
    principalContractor: s(c.principalContractor), client: s(c.client), contractRef: s(c.contractRef),
    incidentCategory: s(c.incidentCategory), riddorReportable: s(c.riddorReportable),
    actualSeverity: s(c.actualSeverity, 'None'), potentialSeverity: s(c.potentialSeverity, 'High'),
    activityAtTime: s(c.activityAtTime), weatherConditions: s(c.weatherConditions),
    briefDescription: s(c.briefDescription), immediateOutcome: s(c.immediateOutcome),
    personsInvolved: a(c.personsInvolved), timelineEntries: a(c.timelineEntries),
    immediateCauses: a(c.immediateCauses), whyEntries: a(c.whyEntries),
    rootCauseStatement: s(c.rootCauseStatement), contributingFactors: a(c.contributingFactors),
    riddorCategories: a(c.riddorCategories), specifiedInjuries: a(c.specifiedInjuries),
    dangerousOccurrences: a(c.dangerousOccurrences),
    f2508Ref: s(c.f2508Ref), enforcingAuthority: s(c.enforcingAuthority, 'HSE'),
    hseRegionalOffice: s(c.hseRegionalOffice), hseAccidentKindCode: s(c.hseAccidentKindCode),
    workProcessCode: s(c.workProcessCode), agentCode: s(c.agentCode),
    reportingMilestones: a(c.reportingMilestones), defectiveItems: a(c.defectiveItems),
    witnessEntries: a(c.witnessEntries), medicalEntries: a(c.medicalEntries),
    notificationItems: a(c.notificationItems), evidenceItems: a(c.evidenceItems),
    preRiskRatings: a(c.preRiskRatings), postRiskRatings: a(c.postRiskRatings),
    targetRatings: a(c.targetRatings), riskJustification: s(c.riskJustification),
    correctiveActions: a(c.correctiveActions), lessonsLearned: a(c.lessonsLearned),
    distributionEntries: a(c.distributionEntries),
    barrierEntries: a(c.barrierEntries), barrierSummary: s(c.barrierSummary),
    systemicRecs: a(c.systemicRecs), localRecs: a(c.localRecs),
    mgmtGaps: a(c.mgmtGaps), closeOutMilestones: a(c.closeOutMilestones),
    observerName: s(c.observerName), observerRole: s(c.observerRole),
    primaryClassification: s(c.primaryClassification), nmDescription: s(c.nmDescription),
    severityAssessments: a(c.severityAssessments),
    potentialOutcomeStatement: s(c.potentialOutcomeStatement),
    hazardIdents: a(c.hazardIdents),
    immediateActionsTaken: a(c.immediateActionsTaken),
    underlyingCauses: a(c.underlyingCauses),
    immediateFixes: a(c.immediateFixes), systemicActions: a(c.systemicActions),
    previousOccurrences: a(c.previousOccurrences), trendStatement: s(c.trendStatement),
    positiveObservations: a(c.positiveObservations), reporterRecognition: s(c.reporterRecognition),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'HSWA 1974 \u2014 Section 2', description: 'General duty to ensure health, safety and welfare of employees' },
    { reference: 'MHSW Regulations 1999 \u2014 Reg 3', description: 'Duty to carry out suitable and sufficient risk assessment' },
    { reference: 'CDM 2015 \u2014 Reg 13(1)', description: 'Principal Contractor duty to plan, manage and monitor construction work' },
    { reference: 'RIDDOR 2013', description: 'Reporting of injuries, diseases and dangerous occurrences' },
    { reference: 'HSE HSG245', description: 'Investigating accidents and incidents \u2014 structured methodology' },
  ];
}

// ── Shared Cell Helpers ──────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || BODY, font: 'Arial', color: opts?.color })] })] });
}
function pillCell(text: string, width: number, bg?: string): TableCell {
  const c = statusColor(text);
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: c })] })] });
}
function dataTable(headers: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, accent: string): Table {
  return new Table({ width: { size: W, type: WidthType.DXA },
    columnWidths: headers.map(h => h.width),
    rows: [
      new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, accent)) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) =>
        txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: cell.color })
      ) })),
    ] });
}
function accentInfoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35); const vw = W - lw;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        shading: { fill: lbg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial', color: lc })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial' })] })] }),
    ] })) });
}

// 5 Whys cascade builder
function whysCascade(whys: WhyEntry[], accent: string): (Paragraph | Table)[] {
  const els: (Paragraph | Table)[] = [];
  const numW = 500; const contentW = W - numW;
  const noBorder = { style: BorderStyle.NONE, size: 0, color: h.WHITE };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  // Gradient shades for numbered boxes (darken progressively, last one red)
  const shades = [accent, accent, accent, accent, 'DC2626'];

  for (let i = 0; i < whys.length; i++) {
    const w = whys[i];
    const shade = i < shades.length ? shades[i] : accent;

    els.push(new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: [numW, contentW],
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: numW, type: WidthType.DXA },
          shading: { fill: shade, type: ShadingType.CLEAR }, borders: noBorders,
          margins: { top: 80, bottom: 80, left: 60, right: 60 }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
            children: [new TextRun({ text: String(i + 1), bold: true, size: 28, font: 'Arial', color: h.WHITE })] })] }),
        new TableCell({ width: { size: contentW, type: WidthType.DXA },
          borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [
            new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: w.question, bold: true, size: BODY, font: 'Arial', color: '374151' })] }),
            new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: w.answer, size: BODY, font: 'Arial' })] }),
          ] }),
      ] })] }));

    if (i < whys.length - 1) {
      els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20, after: 20 },
        children: [new TextRun({ text: '\u2193', size: 24, font: 'Arial', color: GREY })] }));
    }
  }
  return els;
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// Cover + content. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: IncidentReportData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Incident Investigation Report', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  const personCols = [Math.round(W * 0.20), Math.round(W * 0.24), Math.round(W * 0.36)];
  personCols.push(W - personCols[0] - personCols[1] - personCols[2]);
  const tlCols = [Math.round(W * 0.12), Math.round(W * 0.60)];
  tlCols.push(W - tlCols[0] - tlCols[1]);
  const causeCols = [Math.round(W * 0.20), Math.round(W * 0.45)];
  causeCols.push(W - causeCols[0] - causeCols[1]);
  const actionCols = [Math.round(W * 0.34), Math.round(W * 0.16), Math.round(W * 0.14), Math.round(W * 0.16)];
  actionCols.push(W - actionCols[0] - actionCols[1] - actionCols[2] - actionCols[3]);

  // Risk re-rating table
  const riskCols = [Math.round(W * 0.40), Math.round(W * 0.12), Math.round(W * 0.12)];
  riskCols.push(W - riskCols[0] - riskCols[1] - riskCols[2]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER PAGE ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['INCIDENT', 'INVESTIGATION REPORT'], `${d.briefDescription || d.incidentCategory || 'Incident Investigation'}`, GREEN_DARK, 'A7F3D0'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Incident Date / Time', value: `${d.incidentDate}, ${d.incidentTime}` },
            { label: 'Reported By', value: d.reportedBy },
            { label: 'Investigated By', value: d.investigationLead },
            { label: 'Project', value: d.projectName },
            { label: 'Location', value: d.exactLocation },
            { label: 'Classification', value: d.incidentCategory },
            { label: 'RIDDOR Reportable?', value: d.riddorReportable },
            { label: 'Severity (Actual)', value: d.actualSeverity },
            { label: 'Severity (Potential)', value: d.potentialSeverity },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT PAGES ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 INCIDENT SUMMARY
          h.fullWidthSectionBar('01', 'Incident Summary', A),
          h.spacer(80),
          ...h.richBodyText(d.briefDescription || 'Incident description to be confirmed.'),

          // 02 PERSONS INVOLVED
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Persons Involved', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: personCols,
            rows: [
              new TableRow({ children: [hdrCell('Name', personCols[0], A), hdrCell('Role / Employer', personCols[1], A), hdrCell('Involvement', personCols[2], A), hdrCell('Injury', personCols[3], A)] }),
              ...d.personsInvolved.map((p, ri) => new TableRow({ children: [
                txtCell(p.name, personCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(`${p.role}, ${p.employer}`, personCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.injuryDescription || 'Present at time of incident', personCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(p.treatmentGiven || 'None', personCols[3]),
              ] })),
            ] }),

          // 03 CHRONOLOGICAL TIMELINE
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Chronological Timeline', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: tlCols,
            rows: [
              new TableRow({ children: [hdrCell('Time', tlCols[0], A), hdrCell('Event', tlCols[1], A), hdrCell('Source', tlCols[2], A)] }),
              ...d.timelineEntries.map((t, ri) => new TableRow({ children: [
                txtCell(t.time, tlCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(t.event, tlCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(t.source, tlCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 04 IMMEDIATE CAUSES
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Immediate Causes', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: causeCols,
            rows: [
              new TableRow({ children: [hdrCell('Category', causeCols[0], A), hdrCell('Cause', causeCols[1], A), hdrCell('Evidence', causeCols[2], A)] }),
              ...d.immediateCauses.map((ic, ri) => new TableRow({ children: [
                txtCell(ic.category, causeCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ic.cause, causeCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ic.evidence, causeCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 05 ROOT CAUSE ANALYSIS — 5 WHYS
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Root Cause Analysis \u2014 5 Whys', A),
          h.spacer(80),
          ...whysCascade(d.whyEntries, A),

          // 06 CORRECTIVE ACTIONS
          h.spacer(120),
          h.fullWidthSectionBar('06', 'Corrective Actions', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: actionCols,
            rows: [
              new TableRow({ children: [hdrCell('Action', actionCols[0], A), hdrCell('Owner', actionCols[1], A), hdrCell('Priority', actionCols[2], A), hdrCell('Target', actionCols[3], A), hdrCell('Status', actionCols[4], A)] }),
              ...d.correctiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(ca.action, actionCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, actionCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(ca.priority, actionCols[2]),
                txtCell(ca.dueDate, actionCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(ca.status, actionCols[4]),
              ] })),
            ] }),

          // 07 RIDDOR ASSESSMENT & RISK RE-RATING
          h.spacer(120),
          h.fullWidthSectionBar('07', 'RIDDOR Assessment & Risk Re-Rating', A),
          h.spacer(80),
          ...(d.riddorReportable ? [h.calloutBox(
            `This incident is ${d.riddorReportable.toLowerCase().includes('yes') || d.riddorReportable.toLowerCase().includes('under') ? 'potentially reportable' : 'not reportable'} under RIDDOR 2013. ${d.riskJustification || ''}`,
            AMBER, 'FFFBEB', '78350F', W,
            { boldPrefix: 'RIDDOR Assessment:' }
          )] : []),
          h.spacer(80),
          ...(d.preRiskRatings.length > 0 || d.postRiskRatings.length > 0 ? [new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: riskCols,
            rows: [
              new TableRow({ children: [hdrCell('', riskCols[0], A), hdrCell('L', riskCols[1], A), hdrCell('S', riskCols[2], A), hdrCell('Score', riskCols[3], A)] }),
              ...d.preRiskRatings.map((r, ri) => new TableRow({ children: [
                txtCell(`Pre-Incident`, riskCols[0], { bold: true, bg: ZEBRA }),
                txtCell(r.likelihood, riskCols[1], { bg: ZEBRA }),
                txtCell(r.severity, riskCols[2], { bg: ZEBRA }),
                pillCell(`${r.rating} (${r.ratingLevel})`, riskCols[3]),
              ] })),
              ...d.postRiskRatings.map(r => new TableRow({ children: [
                txtCell(`Post-Corrective`, riskCols[0], { bold: true }),
                txtCell(r.likelihood, riskCols[1]),
                txtCell(r.severity, riskCols[2]),
                pillCell(`${r.rating} (${r.ratingLevel})`, riskCols[3]),
              ] })),
              ...d.targetRatings.map(r => new TableRow({ children: [
                txtCell(`Target`, riskCols[0], { bold: true, bg: ZEBRA }),
                txtCell(r.targetLikelihood, riskCols[1], { bg: ZEBRA }),
                txtCell(r.severity, riskCols[2], { bg: ZEBRA }),
                pillCell(`${r.targetRating}`, riskCols[3]),
              ] })),
            ] })] : []),

          // 08 LESSONS LEARNED
          h.spacer(120),
          h.fullWidthSectionBar('08', 'Lessons Learned', A),
          h.spacer(80),
          ...d.lessonsLearned.map(ll => {
            const parts: Paragraph[] = [];
            parts.push(new Paragraph({ spacing: { after: 60 }, children: [
              new TextRun({ text: 'Key Lesson: ', bold: true, size: BODY, font: 'Arial', color: A }),
              new TextRun({ text: ll.lesson, size: BODY, font: 'Arial' }),
            ] }));
            return parts;
          }).flat(),
          ...(d.lessonsLearned.length === 0 ? h.richBodyText(d.rootCauseStatement || 'Lessons to be documented following investigation completion.') : []),

          // Sign-off
          h.spacer(120),
          h.signatureGrid(['Investigated By', 'Reviewed By'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — RIDDOR FOCUSED (Red #991B1B)
// Cover + content. No numbered sections — RIDDOR-specific headings.
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: IncidentReportData): Document {
  const A = RED_D;
  const hdr = h.accentHeader('RIDDOR Incident Report', A);
  const ftr = h.accentFooter(d.documentRef, 'RIDDOR Focused', A);

  const classCols = [Math.round(W * 0.35)]; classCols.push(W - classCols[0]);
  const tlCols = [Math.round(W * 0.35), Math.round(W * 0.25)]; tlCols.push(W - tlCols[0] - tlCols[1]);
  const doCols = [Math.round(W * 0.08), Math.round(W * 0.60)]; doCols.push(W - doCols[0] - doCols[1]);
  const witCols = [Math.round(W * 0.16), Math.round(W * 0.14)]; witCols.push(W - witCols[0] - witCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['RIDDOR INCIDENT', 'REPORT'], `RIDDOR 2013 \u2014 ${d.incidentCategory || 'Incident Classification'}`, A, 'FCA5A5'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Incident Date', value: `${d.incidentDate}, ${d.incidentTime}` },
            { label: 'Classification', value: d.incidentCategory },
            { label: 'RIDDOR Schedule', value: d.riddorCategories[0]?.regulation || 'Under assessment' },
            { label: 'Injuries', value: d.immediateOutcome || `${d.actualSeverity} (potential ${d.potentialSeverity})` },
            { label: 'HSE Notification', value: d.f2508Ref || 'Pending' },
            { label: 'Enforcing Authority', value: `${d.enforcingAuthority} \u2014 ${d.hseRegionalOffice}` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // RIDDOR INCIDENT CLASSIFICATION
          h.fullWidthSectionBar('', 'RIDDOR Incident Classification', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: classCols,
            rows: [
              new TableRow({ children: [hdrCell('Field', classCols[0], A), hdrCell('F2508 Entry', classCols[1], A)] }),
              ...([
                { f: 'Type of Incident', v: d.incidentCategory },
                { f: 'RIDDOR Regulation', v: d.riddorCategories[0]?.regulation || 'Under assessment' },
                { f: 'Schedule / Paragraph', v: d.riddorCategories[0]?.notes || 'Under assessment' },
                { f: 'HSE Accident Kind Code', v: d.hseAccidentKindCode },
                { f: 'Work Process Code', v: d.workProcessCode },
                { f: 'Agent Code', v: d.agentCode },
              ].map((r, ri) => new TableRow({ children: [
                txtCell(r.f, classCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.v, classCols[1], { bold: r.f === 'Type of Incident', bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: r.f === 'Type of Incident' ? RED : undefined }),
              ] }))),
            ] }),

          // STATUTORY REPORTING TIMELINE
          h.spacer(120),
          h.fullWidthSectionBar('', 'Statutory Reporting Timeline', RED),
          h.spacer(80),
          ...(d.reportingMilestones.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: tlCols,
            rows: [
              new TableRow({ children: [hdrCell('Requirement', tlCols[0], RED), hdrCell('Deadline', tlCols[1], RED), hdrCell('Status', tlCols[2], RED)] }),
              ...d.reportingMilestones.map((rm, ri) => new TableRow({ children: [
                txtCell(rm.milestone, tlCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(rm.dateTime, tlCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(rm.status, tlCols[2]),
              ] })),
            ] })] : []),

          // DANGEROUS OCCURRENCES CHECKLIST
          h.spacer(120),
          h.fullWidthSectionBar('', 'Dangerous Occurrences Checklist (Schedule 2)', A),
          h.spacer(80),
          ...(d.dangerousOccurrences.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: doCols,
            rows: [
              new TableRow({ children: [hdrCell('Para', doCols[0], A), hdrCell('Description', doCols[1], A), hdrCell('Applicable?', doCols[2], A)] }),
              ...d.dangerousOccurrences.map((o, ri) => new TableRow({ children: [
                txtCell(o.paragraph || '', doCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: o.applicable?.toLowerCase() === 'yes' ? RED : undefined }),
                txtCell(o.occurrence, doCols[1], { bold: o.applicable?.toLowerCase() === 'yes', bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(o.applicable, doCols[2]),
              ] })),
            ] })] : []),

          // INCIDENT DESCRIPTION (F2508 FORMAT)
          h.spacer(120),
          h.fullWidthSectionBar('', 'Incident Description (F2508 Format)', A),
          h.spacer(80),
          ...h.richBodyText(d.briefDescription || 'Incident description to be confirmed.'),

          // WITNESS STATEMENTS SUMMARY
          h.spacer(120),
          h.fullWidthSectionBar('', 'Witness Statements Summary', A),
          h.spacer(80),
          ...(d.witnessEntries.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: witCols,
            rows: [
              new TableRow({ children: [hdrCell('Witness', witCols[0], A), hdrCell('Role', witCols[1], A), hdrCell('Key Statement', witCols[2], A)] }),
              ...d.witnessEntries.map((w, ri) => new TableRow({ children: [
                txtCell(w.name, witCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(w.role, witCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(w.keyPoints, witCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // Enforcing authority callout
          h.spacer(120),
          h.calloutBox(
            `${d.enforcingAuthority || 'HSE'} ${d.hseRegionalOffice || ''} will be notified via the online F2508 form. The scene has been preserved and cordoned off. The responsible person for RIDDOR notification is ${d.investigationLead || 'the H&S Manager'}.`,
            RED, RED_BG, RED_D, W,
            { boldPrefix: 'Enforcing Authority Notification:' }
          ),

          // Sign-off
          h.spacer(120),
          h.signatureGrid(['Prepared By', 'Authorised By'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — ROOT CAUSE ANALYSIS (Navy #1e293b)
// Cover + content. Analytical deep-dive.
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: IncidentReportData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Root Cause Investigation', A);
  const ftr = h.accentFooter(d.documentRef, 'Root Cause Analysis', A);

  const factorCols = [Math.round(W * 0.16), Math.round(W * 0.54)]; factorCols.push(W - factorCols[0] - factorCols[1]);
  const barrierCols = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.14)]; barrierCols.push(W - barrierCols[0] - barrierCols[1] - barrierCols[2]);
  const actionCols = [Math.round(W * 0.36), Math.round(W * 0.16), Math.round(W * 0.20)]; actionCols.push(W - actionCols[0] - actionCols[1] - actionCols[2]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['ROOT CAUSE', 'INVESTIGATION'], `${d.briefDescription || 'Analytical Deep-Dive'}`, NAVY, '93C5FD'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Incident', value: `${d.briefDescription || d.incidentCategory}, ${d.incidentDate}` },
            { label: 'Root Cause', value: d.rootCauseStatement || 'Under investigation' },
            { label: 'Pre-Incident Risk', value: d.preRiskRatings[0] ? `${d.preRiskRatings[0].rating} (${d.preRiskRatings[0].ratingLevel})` : 'TBC' },
            { label: 'Post-Corrective Risk', value: d.postRiskRatings[0] ? `${d.postRiskRatings[0].rating} (${d.postRiskRatings[0].ratingLevel})` : 'TBC' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 5 WHYS CASCADE
          h.fullWidthSectionBar('', '5 Whys Cascade', A),
          h.spacer(80),
          ...whysCascade(d.whyEntries, A),

          // CONTRIBUTING FACTORS MATRIX (5P ANALYSIS)
          h.spacer(120),
          h.fullWidthSectionBar('', 'Contributing Factors Matrix (5P Analysis)', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: factorCols,
            rows: [
              new TableRow({ children: [hdrCell('Category', factorCols[0], A), hdrCell('Factor', factorCols[1], A), hdrCell('Significance', factorCols[2], A)] }),
              ...d.contributingFactors.map((cf, ri) => new TableRow({ children: [
                txtCell(cf.category, factorCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.factor, factorCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(cf.significance, factorCols[2]),
              ] })),
            ] }),

          // BARRIER ANALYSIS
          h.spacer(120),
          h.fullWidthSectionBar('', 'Barrier Analysis \u2014 What Failed?', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: barrierCols,
            rows: [
              new TableRow({ children: [hdrCell('Barrier', barrierCols[0], A), hdrCell('Type', barrierCols[1], A), hdrCell('Status', barrierCols[2], A), hdrCell('Assessment', barrierCols[3], A)] }),
              ...d.barrierEntries.map((b, ri) => new TableRow({ children: [
                txtCell(b.expectedBarrier, barrierCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(b.barrierType || b.defenceLayer, barrierCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(b.status, barrierCols[2]),
                txtCell(b.failureMode, barrierCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // CORRECTIVE ACTIONS — 30/60/90-DAY CLOSE-OUT
          h.spacer(120),
          h.fullWidthSectionBar('', 'Corrective Actions \u2014 30/60/90-Day Close-Out', A),
          h.spacer(80),
          ...(d.correctiveActions.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: actionCols,
            rows: [
              new TableRow({ children: [hdrCell('Action', actionCols[0], A), hdrCell('Type', actionCols[1], A), hdrCell('Owner', actionCols[2], A), hdrCell('Close-Out', actionCols[3], A)] }),
              ...d.correctiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(ca.action, actionCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.priority, actionCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, actionCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(ca.status, actionCols[3]),
              ] })),
            ] })] : []),

          // ISO 45001 / Management system gap callout
          h.spacer(120),
          ...(d.mgmtGaps.length > 0 ? [h.calloutBox(
            `${d.mgmtGaps[0].description || ''} This is a management system gap that requires a procedure revision to close.`,
            NAVY_ACCENT, NAVY_BG, NAVY, W,
            { boldPrefix: `ISO 45001 Gap: ${d.mgmtGaps[0].standardRef || 'Clause 8.1.2'}` }
          )] : []),

          // Sign-off
          h.spacer(120),
          h.signatureGrid(['Lead Investigator', 'Reviewed By'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — NEAR MISS (Amber #D97706)
// Cover + content. KPI dashboard, prevention measures, reporter recognition.
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: IncidentReportData): Document {
  const A = AMBER;
  const hdr = h.accentHeader('Near Miss Report', A);
  const ftr = h.accentFooter(d.documentRef, 'Near Miss', A);

  const actionCols = [Math.round(W * 0.50), Math.round(W * 0.24)]; actionCols.push(W - actionCols[0] - actionCols[1]);
  const prevCols = [Math.round(W * 0.12), Math.round(W * 0.18), Math.round(W * 0.44)]; prevCols.push(W - prevCols[0] - prevCols[1] - prevCols[2]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['NEAR MISS REPORT'], 'Prevention-Focused Observation & Learning', AMBER_DARK, 'FDE68A'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date / Time', value: `${d.incidentDate}, ${d.incidentTime}` },
            { label: 'Classification', value: d.primaryClassification || d.incidentCategory || 'Near Miss' },
            { label: 'Reported By', value: `${d.observerName || d.reportedBy} (${d.observerRole || ''})` },
            { label: 'Actual Severity', value: d.actualSeverity },
            { label: 'Potential Severity', value: d.potentialSeverity },
            { label: 'Project', value: d.projectName },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // Classification tag
          h.phaseBand(`\u26A0 ${d.primaryClassification || 'NEAR MISS'} \u2014 ${d.potentialSeverity?.toUpperCase() || 'HIGH'} POTENTIAL SEVERITY`, A),
          h.spacer(80),

          // WHAT HAPPENED?
          h.fullWidthSectionBar('', 'What Happened?', A),
          h.spacer(80),
          ...h.richBodyText(d.nmDescription || d.briefDescription || 'Near miss description to be confirmed.'),

          // POTENTIAL SEVERITY ASSESSMENT — KPI Dashboard
          h.spacer(120),
          h.fullWidthSectionBar('', 'Potential Severity Assessment', A),
          h.spacer(80),
          h.kpiDashboard([
            { value: d.actualSeverity || 'None', label: 'Actual Injury' },
            { value: d.potentialSeverity || 'Fatal', label: 'Potential Injury' },
            { value: d.severityAssessments?.[0]?.rationale || '\u2014', label: 'Margin' },
            { value: d.positiveObservations?.[0]?.significance || 'Good', label: 'Catch Quality' },
          ], A, W),

          // IMMEDIATE ACTIONS TAKEN
          h.spacer(120),
          h.fullWidthSectionBar('', 'Immediate Actions Taken', A),
          h.spacer(80),
          ...(d.immediateActionsTaken.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: actionCols,
            rows: [
              new TableRow({ children: [hdrCell('Action', actionCols[0], A), hdrCell('By', actionCols[1], A), hdrCell('When', actionCols[2], A)] }),
              ...d.immediateActionsTaken.map((a, ri) => new TableRow({ children: [
                txtCell(a.action, actionCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(a.owner, actionCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(a.dueDate, actionCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // PREVENTION MEASURES — Immediate Fix + Systemic Action
          h.spacer(120),
          h.fullWidthSectionBar('', 'Prevention Measures', A),
          h.spacer(80),
          ...(d.immediateFixes.length > 0 ? [
            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'IMMEDIATE FIX', bold: true, size: BODY, font: 'Arial', color: A })] }),
            ...d.immediateFixes.map(f => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: `\u2022  ${f.action}`, size: BODY, font: 'Arial' })] })),
          ] : []),
          ...(d.systemicActions.length > 0 ? [
            h.spacer(80),
            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'SYSTEMIC ACTION', bold: true, size: BODY, font: 'Arial', color: A })] }),
            ...d.systemicActions.map(s => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: `\u2022  ${s.action}`, size: BODY, font: 'Arial' })] })),
          ] : []),

          // SIMILAR PREVIOUS OCCURRENCES
          h.spacer(120),
          h.fullWidthSectionBar('', 'Similar Previous Occurrences', A),
          h.spacer(80),
          ...(d.previousOccurrences.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: prevCols,
            rows: [
              new TableRow({ children: [hdrCell('Date', prevCols[0], A), hdrCell('Site', prevCols[1], A), hdrCell('Description', prevCols[2], A), hdrCell('Outcome', prevCols[3], A)] }),
              ...d.previousOccurrences.map((p, ri) => new TableRow({ children: [
                txtCell(p.date, prevCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.ref, prevCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.description, prevCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.outcome, prevCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // Reporter recognition callout
          h.spacer(120),
          ...(d.reporterRecognition ? [h.calloutBox(
            d.reporterRecognition,
            AMBER, AMBER_BG, AMBER_DARK, W,
            { boldPrefix: '\u2B50 Reporter Recognition:' }
          )] : []),

          // Sign-off
          h.spacer(120),
          h.signatureGrid(['Reported By', 'Investigated By'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildIncidentReportTemplateDocument(
  content: any,
  templateSlug: IncidentReportTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard': return buildT1(d);
    case 'riddor-focused':  return buildT2(d);
    case 'root-cause':      return buildT3(d);
    case 'near-miss':       return buildT4(d);
    default:                return buildT1(d);
  }
}
