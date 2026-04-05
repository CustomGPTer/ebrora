// =============================================================================
// Noise Assessment Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard          (green #059669, BS 5228 assessment, ~2pp)
// T2 — Section 61 Application   (dark red #991B1B, CoPA 1974 consent, ~2pp)
// T3 — Monitoring Report        (teal #0f766e, measurement results, ~2pp)
// T4 — Resident Communication   (navy #1E40AF, plain English letter, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { NoiseAssessmentTemplateSlug } from '@/lib/noise-assessment/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

// Accent palettes per template
const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'ECFDF5';
const RED_D = '991B1B'; const RED_SUB = 'FCA5A5'; const RED_BG = 'FEF2F2';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4'; const TEAL_BG = 'F0FDFA';
const NAVY = '1E40AF'; const NAVY_SUB = 'BFDBFE'; const NAVY_BG = 'EFF6FF';

const RED = 'DC2626'; const AMBER = 'D97706'; const GREEN_RAG = '059669';
const GREY = '6B7280'; const ZEBRA = 'F9FAFB';

// ── Data Interface ───────────────────────────────────────────────────────────
interface PlantItem { plant: string; bs5228Ref: string; lwa: string; quantity: string; onTime: string; usage: string; }
interface Receptor { id: string; type: string; address: string; distance: string; direction: string; existingBackground: string; }
interface PredictedLevel { receptorId: string; receptorName: string; predictedLaeq: string; criterion: string; impact: string; margin: string; activity?: string; ambient?: string; exceedance?: string; significance?: string; }
interface MitigationMeasure { measure: string; type: string; expectedReduction: string; implementedBy: string; status: string; detail?: string; bs5228Ref?: string; }
interface MonitoringLocation { id: string; description: string; gridRef: string; receptorType: string; consentLimit: string; }
interface MeasurementResult { locationId: string; date: string; startTime: string; endTime: string; laeq: string; lamax: string; la90: string; dominantSource: string; compliance: string; }
interface Exceedance { locationId: string; date: string; measuredLevel: string; limit: string; exceedanceDb: string; cause: string; correctiveAction: string; }
interface WeatherLog { date: string; time: string; windSpeed: string; windDir: string; temp: string; rain: string; notes: string; }
interface CalibrationRecord { instrument: string; serialNumber: string; lastCal: string; nextCal: string; driftCheck: string; }
interface WorkingHours { period: string; days: string; hours: string; noiseType: string; justification: string; }
interface VibrationScreening { source: string; ppv: string; distance: string; criterion: string; impact: string; }
interface ProposedLimit { location: string; period: string; limitLaeq: string; limitLamax: string; basis: string; }
interface ComplaintStep { step: string; action: string; timeframe: string; responsible: string; }
interface TimelinePhase { phase: string; duration: string; keyPlant: string; expectedNoise: string; peakPeriod: string; }
interface EverydayComparison { source: string; level: string; comparison: string; }
interface RegRef { reference: string; description: string; }

interface NoiseAssessmentData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessedBy: string; projectName: string; siteAddress: string;
  principalContractor: string; client: string; localAuthority: string;
  siteDescription: string; worksDescription: string; programmeDuration: string;
  assessmentBasis: string; methodology: string;
  nearestReceptorSummary: string; keyActivities: string;
  predictedLaeqAtNsr: string; bs5228Significance: string;
  plantItems: PlantItem[]; receptors: Receptor[]; predictedLevels: PredictedLevel[];
  impactSummary: string; bpmStatement: string;
  mitigationMeasures: MitigationMeasure[]; monitoringPlan: string;
  monitoringLocations: MonitoringLocation[]; measurementResults: MeasurementResult[];
  exceedances: Exceedance[]; weatherLogs: WeatherLog[];
  calibrationRecords: CalibrationRecord[];
  complianceSummary: string; trendAnalysis: string;
  workingHours: WorkingHours[]; vibrationScreening: VibrationScreening[];
  proposedLimits: ProposedLimit[]; complaintProcedure: ComplaintStep[];
  timelinePhases: TimelinePhase[]; everydayComparisons: EverydayComparison[];
  whatYouMightNotice: string; whatWeAreDoing: string;
  applicantName: string; applicantAddress: string; applicantContact: string;
  submittedTo: string; keyNoiseSource: string;
  section61Declaration: string;
  contactName: string; contactPhone: string; contactEmail: string;
  clientContact: string;
  monitorLocation: string; equipment: string; complianceStatus: string;
  monitoringPeriod: string;
  ambientLaeq: string; predictedPiling: string; exceedanceDb: string; bs5228CatAThreshold: string;
  significanceCallout: string;
  monitoringNote: string;
  weeklyMeanLaeq: string; weeklyMaxLaeq: string; s61Limit: string; exceedanceCount: string; complaintCount: string;
  regulatoryReferences: RegRef[]; additionalNotes: string;
  noticeSubject: string; noticeDuration: string;
  [key: string]: any;
}

function extract(c: any): NoiseAssessmentData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef'), assessmentDate: s('assessmentDate'), reviewDate: s('reviewDate'),
    assessedBy: s('assessedBy'), projectName: s('projectName'), siteAddress: s('siteAddress'),
    principalContractor: s('principalContractor'), client: s('client'), localAuthority: s('localAuthority'),
    siteDescription: s('siteDescription'), worksDescription: s('worksDescription'), programmeDuration: s('programmeDuration'),
    assessmentBasis: s('assessmentBasis'), methodology: s('methodology'),
    nearestReceptorSummary: s('nearestReceptorSummary'), keyActivities: s('keyActivities'),
    predictedLaeqAtNsr: s('predictedLaeqAtNsr'), bs5228Significance: s('bs5228Significance'),
    plantItems: a('plantItems'), receptors: a('receptors'), predictedLevels: a('predictedLevels'),
    impactSummary: s('impactSummary'), bpmStatement: s('bpmStatement'),
    mitigationMeasures: a('mitigationMeasures'), monitoringPlan: s('monitoringPlan'),
    monitoringLocations: a('monitoringLocations'), measurementResults: a('measurementResults'),
    exceedances: a('exceedances'), weatherLogs: a('weatherLogs'),
    calibrationRecords: a('calibrationRecords'),
    complianceSummary: s('complianceSummary'), trendAnalysis: s('trendAnalysis'),
    workingHours: a('workingHours'), vibrationScreening: a('vibrationScreening'),
    proposedLimits: a('proposedLimits'), complaintProcedure: a('complaintProcedure'),
    timelinePhases: a('timelinePhases'), everydayComparisons: a('everydayComparisons'),
    whatYouMightNotice: s('whatYouMightNotice'), whatWeAreDoing: s('whatWeAreDoing'),
    applicantName: s('applicantName'), applicantAddress: s('applicantAddress'), applicantContact: s('applicantContact'),
    submittedTo: s('submittedTo'), keyNoiseSource: s('keyNoiseSource'),
    section61Declaration: s('section61Declaration'),
    contactName: s('contactName'), contactPhone: s('contactPhone'), contactEmail: s('contactEmail'),
    clientContact: s('clientContact'),
    monitorLocation: s('monitorLocation'), equipment: s('equipment'), complianceStatus: s('complianceStatus'),
    monitoringPeriod: s('monitoringPeriod'),
    ambientLaeq: s('ambientLaeq'), predictedPiling: s('predictedPiling'),
    exceedanceDb: s('exceedanceDb'), bs5228CatAThreshold: s('bs5228CatAThreshold'),
    significanceCallout: s('significanceCallout'),
    monitoringNote: s('monitoringNote'),
    weeklyMeanLaeq: s('weeklyMeanLaeq'), weeklyMaxLaeq: s('weeklyMaxLaeq'),
    s61Limit: s('s61Limit'), exceedanceCount: s('exceedanceCount'), complaintCount: s('complaintCount'),
    regulatoryReferences: a('regulatoryReferences').length > 0 ? a('regulatoryReferences') : defaultRefs(),
    additionalNotes: s('additionalNotes'),
    noticeSubject: s('noticeSubject'), noticeDuration: s('noticeDuration'),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'BS 5228-1:2009+A1:2014', description: 'Code of practice for noise control on construction and open sites — Noise' },
    { reference: 'BS 5228-2:2009+A1:2014', description: 'Code of practice — Vibration' },
    { reference: 'Control of Pollution Act 1974 — S.61', description: 'Prior consent for construction works' },
    { reference: 'Environmental Protection Act 1990', description: 'Statutory nuisance provisions' },
    { reference: 'Control of Noise at Work Regulations 2005', description: 'Occupational noise exposure limits' },
    { reference: 'BS 7385-2:1993', description: 'Evaluation and measurement for vibration in buildings' },
  ];
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function cols(fracs: number[]): number[] {
  return fracs.map(f => Math.round(W * f));
}
function dataTable(hdrs: Array<{ text: string; w: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, accent: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: hdrs.map(col => col.w),
    rows: [
      new TableRow({ children: hdrs.map(col => hdrCell(col.text, col.w, accent)) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => txtCell(cell.text, hdrs[ci].w, { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, bold: cell.bold, color: cell.color })),
      })),
    ],
  });
}
function ragC(level: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('significant') || l.includes('high') || l.includes('exceed') || l.includes('fail') || l.includes('non-comp') || l.includes('not received')) return RED;
  if (l.includes('moderate') || l.includes('medium') || l.includes('marginal') || l.includes('note') || l.includes('potentially')) return AMBER;
  if (l.includes('low') || l.includes('negligible') || l.includes('comply') || l.includes('pass') || l.includes('compliant') || l.includes('within') || l.includes('not significant')) return GREEN_RAG;
  return GREY;
}
function prose(text: string, spacing = 120): Paragraph[] {
  return h.richBodyText(text || '', BODY);
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669 · BS 5228 assessment)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: NoiseAssessmentData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Construction Noise Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  // Build body children
  const body: (Paragraph | Table)[] = [];

  // 01 — SITE DESCRIPTION & SENSITIVE RECEPTORS
  body.push(h.fullWidthSectionBar('01', 'SITE DESCRIPTION & SENSITIVE RECEPTORS', A));
  body.push(h.spacer(80));
  body.push(...prose(d.siteDescription));

  // 02 — NOISE SOURCE INVENTORY
  body.push(h.fullWidthSectionBar('02', 'NOISE SOURCE INVENTORY (BS 5228-1 TABLE C-SERIES)', A));
  body.push(h.spacer(80));
  if (d.plantItems.length > 0) {
    const c = cols([0.22, 0.20, 0.12, 0.12, 0.12, 0.22]);
    body.push(dataTable(
      [{ text: 'Activity', w: c[0] }, { text: 'Plant / Equipment', w: c[1] }, { text: 'BS 5228 Ref', w: c[2] }, { text: 'LAeq at 10m', w: c[3] }, { text: 'Duration', w: c[4] }, { text: 'Programme Phase', w: c[5] }],
      d.plantItems.map(p => [
        { text: p.usage || p.plant }, { text: p.plant, bold: true }, { text: p.bs5228Ref },
        { text: p.lwa, bold: true }, { text: p.onTime || p.quantity }, { text: (p as any).programmePhase || '' },
      ]), A));
  }

  // 03 — PREDICTED NOISE LEVELS AT NEAREST RECEPTOR
  body.push(h.fullWidthSectionBar('03', 'PREDICTED NOISE LEVELS AT NEAREST RECEPTOR', A));
  body.push(h.spacer(80));
  if (d.predictedLevels.length > 0) {
    const c = cols([0.22, 0.12, 0.12, 0.14, 0.12, 0.12, 0.16]);
    body.push(dataTable(
      [{ text: 'Activity', w: c[0] }, { text: 'LAeq at 10m', w: c[1] }, { text: 'Distance to NSR', w: c[2] },
       { text: 'Predicted LAeq at NSR', w: c[3] }, { text: 'Ambient LAeq', w: c[4] },
       { text: 'Exceedance', w: c[5] }, { text: 'Significance', w: c[6] }],
      d.predictedLevels.map(p => [
        { text: p.activity || p.receptorName }, { text: (p as any).laeqAt10m || p.criterion },
        { text: (p as any).distanceToNsr || '' },
        { text: p.predictedLaeq, bold: true, color: ragC(p.significance || p.impact) },
        { text: p.ambient || '' }, { text: p.exceedance || p.margin, color: ragC(p.exceedance || p.margin) },
        { text: p.significance || p.impact, bold: true, color: ragC(p.significance || p.impact) },
      ]), A));
  }

  // BS 5228 Significance callout
  if (d.significanceCallout || d.impactSummary) {
    body.push(h.spacer(40));
    body.push(h.calloutBox(
      d.significanceCallout || d.impactSummary,
      AMBER, 'FFFBEB', '92400E', W,
      { boldPrefix: 'BS 5228 Significance (ABC Method):' }
    ));
  }

  // 04 — NOISE MITIGATION MEASURES
  body.push(h.fullWidthSectionBar('04', 'NOISE MITIGATION MEASURES', A));
  body.push(h.spacer(80));
  if (d.mitigationMeasures.length > 0) {
    const c = cols([0.24, 0.46, 0.30]);
    body.push(dataTable(
      [{ text: 'Measure', w: c[0] }, { text: 'Detail', w: c[1] }, { text: 'Noise Reduction', w: c[2] }],
      d.mitigationMeasures.map(m => [
        { text: m.measure, bold: true }, { text: m.detail || m.type }, { text: m.expectedReduction },
      ]), A));
  }

  // 05 — REGULATORY REFERENCES
  body.push(h.fullWidthSectionBar('05', 'REGULATORY REFERENCES', A));
  body.push(h.spacer(80));
  body.push(...prose(d.regulatoryReferences.map(r => `${r.reference} — ${r.description}.`).join(' ')));

  // Signature grid
  body.push(h.spacer(200));
  body.push(h.signatureGrid(['Assessed By', 'Reviewed By'], A, W));

  // End mark
  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover page
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['CONSTRUCTION NOISE', 'ASSESSMENT'], `BS 5228-1:2009+A1:2014 — ${d.projectName}`, A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Nearest Sensitive Receptor', value: d.nearestReceptorSummary || d.receptors?.[0]?.address || '' },
            { label: 'Key Activities', value: d.keyActivities || d.plantItems.map(p => p.plant).join(', ') },
            { label: 'Predicted LAeq,T at NSR', value: d.predictedLaeqAtNsr || '' },
            { label: 'BS 5228 Significance', value: d.bs5228Significance || '' },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // Body
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — SECTION 61 APPLICATION (Dark Red #991B1B · CoPA 1974 prior consent)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: NoiseAssessmentData): Document {
  const A = RED_D;
  const hdr = h.accentHeader('Section 61 Prior Consent Application', A);
  const ftr = h.accentFooter(d.documentRef, 'Section 61 Application', A);

  const body: (Paragraph | Table)[] = [];

  // Section 61 legal callout
  body.push(h.calloutBox(
    d.section61Declaration || 'This application is made under Section 61(1) of the Control of Pollution Act 1974, seeking prior consent from the Local Authority for construction works that may generate noise levels which could constitute a statutory nuisance. Approval of this application provides the contractor with a defence under Section 61(9) against prosecution under Section 60, provided the works are carried out in accordance with the consented methods and conditions.',
    RED, RED_BG, '991B1B', W,
    { boldPrefix: 'Control of Pollution Act 1974, Section 61:' }
  ));

  // PROPOSED WORKING HOURS
  body.push(h.fullWidthSectionBar('', 'PROPOSED WORKING HOURS', A));
  body.push(h.spacer(80));
  if (d.workingHours.length > 0) {
    const c = cols([0.22, 0.22, 0.56]);
    body.push(dataTable(
      [{ text: 'Period', w: c[0] }, { text: 'Hours', w: c[1] }, { text: 'Activities Permitted', w: c[2] }],
      d.workingHours.map(w => [
        { text: w.period || w.days, bold: true }, { text: w.hours, bold: true }, { text: w.noiseType || w.justification },
      ]), A));
  }

  // PROPOSED NOISE CONTROL MEASURES — BPM
  body.push(h.fullWidthSectionBar('', 'PROPOSED NOISE CONTROL MEASURES — BEST PRACTICABLE MEANS', A));
  body.push(h.spacer(80));
  if (d.mitigationMeasures.length > 0) {
    const c = cols([0.30, 0.48, 0.22]);
    body.push(dataTable(
      [{ text: 'BPM Measure', w: c[0] }, { text: 'Detail', w: c[1] }, { text: 'BS 5228 Reference', w: c[2] }],
      d.mitigationMeasures.map(m => [
        { text: m.measure, bold: true }, { text: m.detail || m.type }, { text: m.bs5228Ref || m.expectedReduction },
      ]), A));
  }

  // NOISE IMPACT SUMMARY — KPI Dashboard
  body.push(h.fullWidthSectionBar('', 'NOISE IMPACT SUMMARY', A));
  body.push(h.spacer(80));
  body.push(h.kpiDashboard([
    { value: d.ambientLaeq || '—', label: 'Ambient LAeq (dB(A) daytime)' },
    { value: d.predictedPiling || '—', label: 'Predicted Piling (dB(A) at NSR)' },
    { value: d.exceedanceDb || '—', label: 'Exceedance (dB above ambient)' },
    { value: d.bs5228CatAThreshold || '65', label: 'BS 5228 Cat A (dB(A) threshold)' },
  ], A, W));

  // BPM summary prose
  body.push(h.spacer(80));
  if (d.bpmStatement) body.push(...prose(d.bpmStatement));

  // Signature grid
  body.push(h.spacer(200));
  body.push(h.signatureGrid(['Applicant', 'LA Environmental Health'], A, W));

  // End mark
  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover page
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['SECTION 61', 'PRIOR CONSENT', 'APPLICATION'], `Control of Pollution Act 1974 — ${d.projectName}`, A, RED_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.assessmentDate },
            { label: 'Submitted To', value: d.submittedTo || d.localAuthority },
            { label: 'Applicant', value: d.applicantName || d.principalContractor },
            { label: 'Site', value: `${d.projectName}, ${d.siteAddress}` },
            { label: 'Works Duration', value: d.programmeDuration },
            { label: 'Key Noise Source', value: d.keyNoiseSource || '' },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // Body
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — MONITORING REPORT (Teal #0f766e · Measurement results)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: NoiseAssessmentData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('Noise Monitoring Report', A);
  const ftr = h.accentFooter(d.documentRef, 'Monitoring Report', A);

  const body: (Paragraph | Table)[] = [];

  // WEEKLY MONITORING RESULTS
  body.push(h.fullWidthSectionBar('', 'WEEKLY MONITORING RESULTS — LAeq,1hr AT NSR', A));
  body.push(h.spacer(80));
  if (d.measurementResults.length > 0) {
    const c = cols([0.10, 0.13, 0.10, 0.10, 0.10, 0.27, 0.20]);
    body.push(dataTable(
      [{ text: 'Date', w: c[0] }, { text: 'Time Period', w: c[1] }, { text: 'LAeq,1hr (dB)', w: c[2] },
       { text: 'LAmax (dB)', w: c[3] }, { text: 'LA90 (dB)', w: c[4] },
       { text: 'Site Activity', w: c[5] }, { text: 'Compliance', w: c[6] }],
      d.measurementResults.map(m => [
        { text: m.date }, { text: `${m.startTime}–${m.endTime}` },
        { text: m.laeq, bold: true }, { text: m.lamax }, { text: m.la90 },
        { text: m.dominantSource }, { text: m.compliance, bold: true, color: ragC(m.compliance) },
      ]), A));
  }

  // Monitoring note callout (amber)
  if (d.monitoringNote) {
    body.push(h.spacer(40));
    body.push(h.calloutBox(d.monitoringNote, AMBER, 'FFFBEB', '92400E', W));
  }

  // WEEKLY SUMMARY — KPI Dashboard (5 boxes)
  body.push(h.fullWidthSectionBar('', 'WEEKLY SUMMARY', A));
  body.push(h.spacer(80));
  body.push(h.kpiDashboard([
    { value: d.weeklyMeanLaeq || '—', label: 'Mean LAeq (dB(A) weekly avg)' },
    { value: d.weeklyMaxLaeq || '—', label: 'Max LAeq,1hr (dB(A))' },
    { value: d.s61Limit || '65', label: 'S61 Limit (dB(A) LAeq,1hr)' },
    { value: d.exceedanceCount || '0', label: 'Exceedances (of S61 limit)' },
    { value: d.complaintCount || '0', label: 'Complaints (this week)' },
  ], A, W));

  // Compliance callout (teal)
  if (d.complianceSummary) {
    body.push(h.spacer(40));
    body.push(h.calloutBox(d.complianceSummary, TEAL, TEAL_BG, '134E4A', W,
      { boldPrefix: 'Compliance Statement:' }));
  }

  // Signature grid
  body.push(h.spacer(200));
  body.push(h.signatureGrid(['Monitored By', 'Submitted To'], A, W));

  // End mark
  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover page
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['NOISE MONITORING', 'REPORT'], d.monitoringPeriod || `Weekly Monitoring Results — ${d.projectName}`, A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Monitoring Period', value: d.monitoringPeriod || d.assessmentDate },
            { label: 'Monitor Location', value: d.monitorLocation || d.monitoringLocations?.[0]?.description || '' },
            { label: 'Equipment', value: d.equipment || d.calibrationRecords?.[0]?.instrument || '' },
            { label: 'Compliance', value: d.complianceStatus || 'All measurements within consent limits' },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // Body
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — RESIDENT COMMUNICATION (Navy #1E40AF · Plain English letter)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: NoiseAssessmentData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Resident Noise Notification', A);
  const ftr = h.accentFooter(d.documentRef, 'Resident Communication', A);

  const body: (Paragraph | Table)[] = [];

  // IMPORTANT NOTICE heading bar
  body.push(h.fullWidthSectionBar('', d.noticeSubject || `IMPORTANT NOTICE — WORKS STARTING ${d.assessmentDate}`, A));
  body.push(h.spacer(80));

  // Opening letter prose
  body.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Dear Resident,', size: BODY, font: 'Arial' })] }));
  body.push(...prose(d.worksDescription));

  // WHAT TO EXPECT
  if (d.whatYouMightNotice) {
    body.push(h.fullWidthSectionBar('', 'WHAT TO EXPECT', A));
    body.push(h.spacer(80));
    body.push(...prose(d.whatYouMightNotice));
  }

  // WORKING HOURS
  if (d.workingHours.length > 0) {
    body.push(h.fullWidthSectionBar('', 'WORKING HOURS', A));
    body.push(h.spacer(80));
    const c = cols([0.28, 0.28, 0.44]);
    body.push(dataTable(
      [{ text: 'Day', w: c[0] }, { text: 'Hours', w: c[1] }, { text: 'Notes', w: c[2] }],
      d.workingHours.map(w => [
        { text: w.period || w.days, bold: true }, { text: w.hours, bold: true }, { text: w.noiseType || w.justification },
      ]), A));
  }

  // WHAT WE'RE DOING TO MINIMISE DISRUPTION
  if (d.whatWeAreDoing) {
    body.push(h.fullWidthSectionBar('', 'WHAT WE\'RE DOING TO MINIMISE DISRUPTION', A));
    body.push(h.spacer(80));
    body.push(...prose(d.whatWeAreDoing));
  }

  // CONTACT US
  body.push(h.fullWidthSectionBar('', 'CONTACT US', A));
  body.push(h.spacer(80));
  const contactText = [
    d.contactName ? `Community Liaison: ${d.contactName}` : '',
    d.contactPhone ? `Phone: ${d.contactPhone}` : '',
    d.contactEmail ? `Email: ${d.contactEmail}` : '',
    d.clientContact ? `${d.client || 'Client'}: ${d.clientContact}` : '',
  ].filter(Boolean).join('\n');
  if (contactText) {
    body.push(h.calloutBox(
      contactText + '\n\nWe are committed to being a good neighbour and will do everything we can to minimise the impact of these essential works on your daily life. We apologise in advance for any inconvenience caused.',
      '2563EB', NAVY_BG, '1E40AF', W,
      { boldPrefix: 'If you have any questions or concerns about noise from the site, please contact us:' }
    ));
  }

  // Signoff prose
  body.push(h.spacer(80));
  body.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Yours faithfully,', size: BODY, font: 'Arial' })] }));
  body.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: d.contactName || d.assessedBy || '', bold: true, size: BODY, font: 'Arial' })] }));
  body.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${d.principalContractor || ''}${d.client ? `\nOn behalf of ${d.client}` : ''}`, size: BODY, font: 'Arial' })] }));

  // Designed for letterbox distribution (instead of standard endMark)
  body.push(new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 8 } },
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 40 },
    children: [new TextRun({ text: '\u2014 Designed for letterbox distribution to all properties within 300m \u2014', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
  }));
  body.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true })],
  }));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover page
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['CONSTRUCTION NOISE', 'NOTIFICATION'], 'Important Information for Local Residents', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.assessmentDate },
            { label: 'From', value: `${d.principalContractor}${d.client ? ` — on behalf of ${d.client}` : ''}` },
            { label: 'To', value: d.nearestReceptorSummary || 'All residents within 300m of site' },
            { label: 'Subject', value: d.noticeSubject || `Advance notice of works — starting ${d.assessmentDate}` },
            { label: 'Duration', value: d.noticeDuration || d.programmeDuration },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // Body
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildNoiseAssessmentTemplateDocument(
  content: any,
  templateSlug: NoiseAssessmentTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':        return buildT1(d);
    case 'section-61':             return buildT2(d);
    case 'monitoring-report':      return buildT3(d);
    case 'resident-communication': return buildT4(d);
    default:                       return buildT1(d);
  }
}
