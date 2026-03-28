// =============================================================================
// Noise Assessment Builder — Multi-Template Engine
// 4 templates, all consuming the same Noise Assessment JSON structure.
//
// T1 — Ebrora Standard          (green, comprehensive BS 5228, 16 sections)
// T2 — Section 61 Application   (red, CoPA 1974 consent format)
// T3 — Monitoring Report        (teal, ongoing measurement results)
// T4 — Resident Communication   (navy, plain English stakeholder summary)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { NoiseAssessmentTemplateSlug } from '@/lib/noise-assessment/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;
const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const RED_D = '991B1B'; const RED_BG = 'FEF2F2'; const RED = 'DC2626';
const AMBER = 'D97706'; const AMBER_BG = 'FEF3C7';
const GREEN_RAG = '059669'; const GREEN_BG = 'D1FAE5';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa'; const TEAL_DARK = '134e4a';
const GREY_RAG = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface PlantItem { plant: string; bs5228Ref: string; lwa: string; quantity: string; onTime: string; usage: string; }
interface Receptor { id: string; type: string; address: string; distance: string; direction: string; existingBackground: string; }
interface PredictedLevel { receptorId: string; receptorName: string; predictedLaeq: string; criterion: string; impact: string; margin: string; }
interface MitigationMeasure { measure: string; type: string; expectedReduction: string; implementedBy: string; status: string; }
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
  section61Declaration: string;
  contactName: string; contactPhone: string; contactEmail: string;
  regulatoryReferences: RegRef[]; additionalNotes: string;
}

function extract(c: any): NoiseAssessmentData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), assessmentDate: s(c.assessmentDate), reviewDate: s(c.reviewDate),
    assessedBy: s(c.assessedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    principalContractor: s(c.principalContractor), client: s(c.client), localAuthority: s(c.localAuthority),
    siteDescription: s(c.siteDescription), worksDescription: s(c.worksDescription), programmeDuration: s(c.programmeDuration),
    assessmentBasis: s(c.assessmentBasis), methodology: s(c.methodology),
    plantItems: a(c.plantItems), receptors: a(c.receptors), predictedLevels: a(c.predictedLevels),
    impactSummary: s(c.impactSummary), bpmStatement: s(c.bpmStatement),
    mitigationMeasures: a(c.mitigationMeasures), monitoringPlan: s(c.monitoringPlan),
    monitoringLocations: a(c.monitoringLocations), measurementResults: a(c.measurementResults),
    exceedances: a(c.exceedances), weatherLogs: a(c.weatherLogs),
    calibrationRecords: a(c.calibrationRecords),
    complianceSummary: s(c.complianceSummary), trendAnalysis: s(c.trendAnalysis),
    workingHours: a(c.workingHours), vibrationScreening: a(c.vibrationScreening),
    proposedLimits: a(c.proposedLimits), complaintProcedure: a(c.complaintProcedure),
    timelinePhases: a(c.timelinePhases), everydayComparisons: a(c.everydayComparisons),
    whatYouMightNotice: s(c.whatYouMightNotice), whatWeAreDoing: s(c.whatWeAreDoing),
    applicantName: s(c.applicantName), applicantAddress: s(c.applicantAddress), applicantContact: s(c.applicantContact),
    section61Declaration: s(c.section61Declaration),
    contactName: s(c.contactName), contactPhone: s(c.contactPhone), contactEmail: s(c.contactEmail),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'BS 5228-1:2009+A1:2014', description: 'Code of practice for noise control on construction and open sites — Noise' },
    { reference: 'BS 5228-2:2009+A1:2014', description: 'Code of practice — Vibration' },
    { reference: 'Control of Pollution Act 1974 — S.61', description: 'Prior consent for construction works' },
    { reference: 'Environmental Protection Act 1990', description: 'Statutory nuisance provisions' },
    { reference: 'Control of Noise at Work Regulations 2005', description: 'Occupational noise exposure limits' },
  ];
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string): Paragraph {
  return new Paragraph({ spacing: { before: 360, after: 140 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: num ? `${num}   ${text.toUpperCase()}` : text.toUpperCase(), bold: true, size: LG, font: 'Arial', color: accent })] });
}
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: SM + 2, font: 'Arial', color: opts?.color })] })] });
}
function infoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => new TableRow({ children: [
    new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: SM + 2, font: 'Arial', color: lc })] })] }),
    new TableCell({ width: { size: W - lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
  ] })) });
}
function dataTable(hdrs: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, hbg: string, zb = ZEBRA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: hdrs.map(h2 => hdrCell(h2.text, h2.width, hbg)) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => txtCell(cell.text, hdrs[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zb : h.WHITE, color: cell.color })) })),
  ] });
}
function signOff(roles: string[], bg: string): Table {
  const cols = [{ t: 'Role', w: Math.round(W * 0.22) }, { t: 'Name', w: Math.round(W * 0.28) }, { t: 'Signature', w: Math.round(W * 0.25) }, { t: 'Date', w: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) }];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.t, c.w, bg)) }),
    ...roles.map(role => new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.w)) })),
  ] });
}
function ragC(level: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('significant') || l.includes('high') || l.includes('exceed') || l.includes('fail') || l.includes('non-comp')) return RED;
  if (l.includes('moderate') || l.includes('medium') || l.includes('marginal')) return AMBER;
  if (l.includes('low') || l.includes('negligible') || l.includes('comply') || l.includes('pass') || l.includes('compliant') || l.includes('within')) return GREEN_RAG;
  return GREY_RAG;
}
function prose(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: BODY, font: 'Arial' })] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, comprehensive BS 5228)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT1(d: NoiseAssessmentData): (Paragraph | Table)[] {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const els: (Paragraph | Table)[] = [];
  let sn = 1;

  // Cover
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'CONSTRUCTION NOISE ASSESSMENT', bold: true, size: TTL, font: 'Arial', color: A })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'BS 5228-1:2009+A1:2014 \u00B7 Control of Pollution Act 1974 \u00B7 EPA 1990', size: BODY, font: 'Arial', color: h.GREY_DARK })] }));
  els.push(h.spacer(100));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(h.spacer(100));
  els.push(infoTable([
    { label: 'Document Ref', value: d.documentRef }, { label: 'Assessment Date', value: d.assessmentDate },
    { label: 'Review Date', value: d.reviewDate }, { label: 'Assessed By', value: d.assessedBy },
    { label: 'Principal Contractor', value: d.principalContractor }, { label: 'Client', value: d.client },
    { label: 'Local Authority', value: d.localAuthority }, { label: 'Programme Duration', value: d.programmeDuration },
  ], LBG, LC));

  // 1 Site & Works
  els.push(secHead(`${sn}.0`, 'Site Description & Works', A)); sn++;
  if (d.siteDescription) els.push(prose(d.siteDescription));
  if (d.worksDescription) els.push(prose(d.worksDescription));

  // 2 Assessment Basis
  els.push(secHead(`${sn}.0`, 'Assessment Basis & Methodology', A)); sn++;
  if (d.assessmentBasis) els.push(prose(d.assessmentBasis));
  if (d.methodology) els.push(prose(d.methodology));

  // 3 Working Hours
  if (d.workingHours.length > 0) {
    const wc = [Math.round(W * 0.16), Math.round(W * 0.16), Math.round(W * 0.18), Math.round(W * 0.20), W - Math.round(W * 0.16) * 2 - Math.round(W * 0.18) - Math.round(W * 0.20)];
    els.push(secHead(`${sn}.0`, 'Working Hours', A)); sn++;
    els.push(dataTable([{ text: 'Period', width: wc[0] }, { text: 'Days', width: wc[1] }, { text: 'Hours', width: wc[2] }, { text: 'Activity', width: wc[3] }, { text: 'Justification', width: wc[4] }],
      d.workingHours.map(w => [{ text: w.period }, { text: w.days }, { text: w.hours, bold: true }, { text: w.noiseType }, { text: w.justification }]), A));
  } else { sn++; }

  // 4 Plant Inventory
  if (d.plantItems.length > 0) {
    const pc = [Math.round(W * 0.22), Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.08), Math.round(W * 0.12), W - Math.round(W * 0.22) - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.08) - Math.round(W * 0.12)];
    els.push(secHead(`${sn}.0`, 'Plant Inventory & BS 5228 Source Levels', A)); sn++;
    els.push(dataTable([{ text: 'Plant', width: pc[0] }, { text: 'BS 5228 Ref', width: pc[1] }, { text: 'LWA dB', width: pc[2] }, { text: 'Qty', width: pc[3] }, { text: 'On-Time %', width: pc[4] }, { text: 'Usage', width: pc[5] }],
      d.plantItems.map(p => [{ text: p.plant, bold: true }, { text: p.bs5228Ref }, { text: p.lwa, bold: true }, { text: p.quantity }, { text: p.onTime }, { text: p.usage }]), A));
  } else { sn++; }

  // 5 Sensitive Receptors
  if (d.receptors.length > 0) {
    const rc = [Math.round(W * 0.06), Math.round(W * 0.12), Math.round(W * 0.24), Math.round(W * 0.10), Math.round(W * 0.10), W - Math.round(W * 0.06) - Math.round(W * 0.12) - Math.round(W * 0.24) - Math.round(W * 0.10) * 2];
    els.push(secHead(`${sn}.0`, 'Sensitive Receptors', A)); sn++;
    els.push(dataTable([{ text: 'ID', width: rc[0] }, { text: 'Type', width: rc[1] }, { text: 'Address', width: rc[2] }, { text: 'Distance', width: rc[3] }, { text: 'Direction', width: rc[4] }, { text: 'Background', width: rc[5] }],
      d.receptors.map(r => [{ text: r.id, bold: true }, { text: r.type }, { text: r.address }, { text: r.distance }, { text: r.direction }, { text: r.existingBackground }]), A));
  } else { sn++; }

  // 6 Predicted Levels
  if (d.predictedLevels.length > 0) {
    const pl = [Math.round(W * 0.06), Math.round(W * 0.20), Math.round(W * 0.14), Math.round(W * 0.14), Math.round(W * 0.18), W - Math.round(W * 0.06) - Math.round(W * 0.20) - Math.round(W * 0.14) * 2 - Math.round(W * 0.18)];
    els.push(secHead(`${sn}.0`, 'Predicted Noise Levels at Receptors', A)); sn++;
    els.push(dataTable([{ text: 'ID', width: pl[0] }, { text: 'Receptor', width: pl[1] }, { text: 'Predicted LAeq', width: pl[2] }, { text: 'Criterion', width: pl[3] }, { text: 'Impact', width: pl[4] }, { text: 'Margin', width: pl[5] }],
      d.predictedLevels.map(p => [{ text: p.receptorId, bold: true }, { text: p.receptorName }, { text: p.predictedLaeq, bold: true }, { text: p.criterion }, { text: p.impact, bold: true, color: ragC(p.impact) }, { text: p.margin }]), A));
  } else { sn++; }

  // 7 Impact Summary
  if (d.impactSummary) { els.push(secHead(`${sn}.0`, 'Impact Assessment Summary', A)); sn++; els.push(prose(d.impactSummary)); } else { sn++; }

  // 8 BPM
  if (d.bpmStatement) { els.push(secHead(`${sn}.0`, 'Best Practicable Means (BPM)', A)); sn++; els.push(prose(d.bpmStatement)); } else { sn++; }

  // 9 Mitigation
  if (d.mitigationMeasures.length > 0) {
    const mc = [Math.round(W * 0.30), Math.round(W * 0.16), Math.round(W * 0.14), Math.round(W * 0.16), W - Math.round(W * 0.30) - Math.round(W * 0.16) - Math.round(W * 0.14) - Math.round(W * 0.16)];
    els.push(secHead(`${sn}.0`, 'Mitigation Measures', A)); sn++;
    els.push(dataTable([{ text: 'Measure', width: mc[0] }, { text: 'Type', width: mc[1] }, { text: 'Reduction', width: mc[2] }, { text: 'Implemented By', width: mc[3] }, { text: 'Status', width: mc[4] }],
      d.mitigationMeasures.map(m => [{ text: m.measure }, { text: m.type, bold: true }, { text: m.expectedReduction }, { text: m.implementedBy }, { text: m.status, bold: true, color: ragC(m.status) }]), A));
  } else { sn++; }

  // 10 Monitoring Plan
  if (d.monitoringPlan || d.monitoringLocations.length > 0) {
    els.push(secHead(`${sn}.0`, 'Noise Monitoring Plan', A)); sn++;
    if (d.monitoringPlan) els.push(prose(d.monitoringPlan));
    if (d.monitoringLocations.length > 0) {
      els.push(dataTable([{ text: 'ID', width: Math.round(W * 0.06) }, { text: 'Description', width: Math.round(W * 0.28) }, { text: 'Grid Ref', width: Math.round(W * 0.18) }, { text: 'Type', width: Math.round(W * 0.16) }, { text: 'Consent Limit', width: W - Math.round(W * 0.06) - Math.round(W * 0.28) - Math.round(W * 0.18) - Math.round(W * 0.16) }],
        d.monitoringLocations.map(m => [{ text: m.id, bold: true }, { text: m.description }, { text: m.gridRef }, { text: m.receptorType }, { text: m.consentLimit }]), A));
    }
  } else { sn++; }

  // 11 Vibration
  if (d.vibrationScreening.length > 0) {
    const vc = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.14), Math.round(W * 0.22), W - Math.round(W * 0.22) - Math.round(W * 0.14) * 2 - Math.round(W * 0.22)];
    els.push(secHead(`${sn}.0`, 'Vibration Screening (BS 5228-2)', A)); sn++;
    els.push(dataTable([{ text: 'Source', width: vc[0] }, { text: 'PPV mm/s', width: vc[1] }, { text: 'Distance', width: vc[2] }, { text: 'Criterion', width: vc[3] }, { text: 'Impact', width: vc[4] }],
      d.vibrationScreening.map(v => [{ text: v.source, bold: true }, { text: v.ppv }, { text: v.distance }, { text: v.criterion }, { text: v.impact, bold: true, color: ragC(v.impact) }]), A));
  } else { sn++; }

  // 12 Refs
  els.push(secHead(`${sn}.0`, 'Regulatory References', A)); sn++;
  els.push(dataTable([{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]), A));

  // 13 Sign-Off
  els.push(secHead(`${sn}.0`, 'Sign-Off', A));
  els.push(signOff(['Assessed By', 'Environmental Manager', 'Project Manager', 'Client Representative'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This noise assessment must be reviewed when activities, plant, or site conditions change. Assessment methodology aligned with BS 5228-1:2009+A1:2014.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T2 — SECTION 61 APPLICATION (red, CoPA 1974 consent)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT2(d: NoiseAssessmentData): (Paragraph | Table)[] {
  const A = RED_D; const LBG = RED_BG; const LC = RED_D;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'SECTION 61 PRIOR CONSENT APPLICATION', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Control of Pollution Act 1974 \u00B7 Prior Consent for Construction Works', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '7f1d1d' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | To: ${d.localAuthority}`, size: SM, font: 'Arial', color: 'fca5a5' })] }));

  // 1 Applicant Details
  els.push(secHead('1.0', 'Applicant & Site Details', A));
  els.push(infoTable([
    { label: 'Applicant', value: d.applicantName || d.principalContractor }, { label: 'Address', value: d.applicantAddress || d.siteAddress },
    { label: 'Contact', value: d.applicantContact || d.assessedBy },
    { label: 'Site Address', value: d.siteAddress }, { label: 'Local Authority', value: d.localAuthority },
    { label: 'Client', value: d.client }, { label: 'Document Ref', value: d.documentRef },
  ], LBG, LC));

  // 2 Proposed Works
  els.push(secHead('2.0', 'Proposed Works & Programme', A));
  if (d.worksDescription) els.push(prose(d.worksDescription));
  els.push(infoTable([{ label: 'Programme Duration', value: d.programmeDuration }], LBG, LC));

  // 3 Working Hours
  if (d.workingHours.length > 0) {
    els.push(secHead('3.0', 'Proposed Working Hours', A));
    els.push(dataTable([{ text: 'Period', width: Math.round(W * 0.14) }, { text: 'Days', width: Math.round(W * 0.16) }, { text: 'Hours', width: Math.round(W * 0.16) }, { text: 'Activity', width: Math.round(W * 0.22) }, { text: 'Justification', width: W - Math.round(W * 0.14) - Math.round(W * 0.16) * 2 - Math.round(W * 0.22) }],
      d.workingHours.map(w => [{ text: w.period }, { text: w.days }, { text: w.hours, bold: true }, { text: w.noiseType }, { text: w.justification }]), A));
  }

  // 4 Plant & Predicted Levels
  if (d.plantItems.length > 0) {
    els.push(secHead('4.0', 'Plant List with Predicted Noise Levels', A));
    els.push(dataTable([{ text: 'Plant', width: Math.round(W * 0.24) }, { text: 'BS 5228 Ref', width: Math.round(W * 0.14) }, { text: 'LWA dB', width: Math.round(W * 0.10) }, { text: 'Qty', width: Math.round(W * 0.08) }, { text: 'On-Time', width: Math.round(W * 0.10) }, { text: 'Usage', width: W - Math.round(W * 0.24) - Math.round(W * 0.14) - Math.round(W * 0.10) - Math.round(W * 0.08) - Math.round(W * 0.10) }],
      d.plantItems.map(p => [{ text: p.plant, bold: true }, { text: p.bs5228Ref }, { text: p.lwa, bold: true }, { text: p.quantity }, { text: p.onTime }, { text: p.usage }]), A));
  }

  // 5 BPM
  els.push(secHead('5.0', 'Best Practicable Means (BPM) Statement', A));
  if (d.bpmStatement) els.push(prose(d.bpmStatement));
  if (d.mitigationMeasures.length > 0) {
    els.push(dataTable([{ text: 'Measure', width: Math.round(W * 0.34) }, { text: 'Type', width: Math.round(W * 0.18) }, { text: 'Expected Reduction', width: Math.round(W * 0.16) }, { text: 'Status', width: W - Math.round(W * 0.34) - Math.round(W * 0.18) - Math.round(W * 0.16) }],
      d.mitigationMeasures.map(m => [{ text: m.measure }, { text: m.type, bold: true }, { text: m.expectedReduction }, { text: m.status }]), A));
  }

  // 6 Proposed Limits
  if (d.proposedLimits.length > 0) {
    els.push(secHead('6.0', 'Proposed Noise Limits', A));
    els.push(dataTable([{ text: 'Location', width: Math.round(W * 0.24) }, { text: 'Period', width: Math.round(W * 0.16) }, { text: 'LAeq Limit', width: Math.round(W * 0.14) }, { text: 'LAmax Limit', width: Math.round(W * 0.14) }, { text: 'Basis', width: W - Math.round(W * 0.24) - Math.round(W * 0.16) - Math.round(W * 0.14) * 2 }],
      d.proposedLimits.map(l => [{ text: l.location, bold: true }, { text: l.period }, { text: l.limitLaeq, bold: true }, { text: l.limitLamax }, { text: l.basis }]), A));
  }

  // 7 Monitoring
  els.push(secHead('7.0', 'Monitoring Methodology', A));
  if (d.monitoringPlan) els.push(prose(d.monitoringPlan));
  if (d.monitoringLocations.length > 0) {
    els.push(dataTable([{ text: 'ID', width: Math.round(W * 0.06) }, { text: 'Location', width: Math.round(W * 0.30) }, { text: 'Grid Ref', width: Math.round(W * 0.18) }, { text: 'Type', width: Math.round(W * 0.16) }, { text: 'Limit', width: W - Math.round(W * 0.06) - Math.round(W * 0.30) - Math.round(W * 0.18) - Math.round(W * 0.16) }],
      d.monitoringLocations.map(m => [{ text: m.id, bold: true }, { text: m.description }, { text: m.gridRef }, { text: m.receptorType }, { text: m.consentLimit }]), A));
  }

  // 8 Complaint Procedure
  if (d.complaintProcedure.length > 0) {
    els.push(secHead('8.0', 'Complaint Handling Procedure', A));
    els.push(dataTable([{ text: '#', width: Math.round(W * 0.06) }, { text: 'Action', width: Math.round(W * 0.38) }, { text: 'Timeframe', width: Math.round(W * 0.18) }, { text: 'Responsible', width: W - Math.round(W * 0.06) - Math.round(W * 0.38) - Math.round(W * 0.18) }],
      d.complaintProcedure.map(c => [{ text: c.step, bold: true }, { text: c.action }, { text: c.timeframe }, { text: c.responsible }]), A));
  }

  // 9 References
  els.push(secHead('9.0', 'Regulatory References', A));
  els.push(dataTable([{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]), A));

  // 10 Declaration & Sign-Off
  els.push(secHead('10.0', 'Section 61 Declaration & Sign-Off', A));
  if (d.section61Declaration) els.push(prose(d.section61Declaration));
  els.push(signOff(['Applicant', 'Environmental Manager', 'Project Manager'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This application is submitted under Section 61 of the Control of Pollution Act 1974. Works shall not commence until consent is granted by the local authority.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T3 — MONITORING REPORT (teal, measurement results)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT3(d: NoiseAssessmentData): (Paragraph | Table)[] {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'CONSTRUCTION NOISE MONITORING REPORT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: 'BS 5228-1 \u00B7 Section 61 Compliance \u00B7 Measurement Results', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.assessmentDate}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }));

  // 1 Summary
  els.push(secHead('1.0', 'Monitoring Summary', A));
  els.push(infoTable([
    { label: 'Project', value: d.projectName }, { label: 'Report Period', value: d.assessmentDate },
    { label: 'Monitored By', value: d.assessedBy }, { label: 'Consent Ref', value: d.documentRef },
  ], LBG, LC));

  // 2 Monitoring Locations
  if (d.monitoringLocations.length > 0) {
    els.push(secHead('2.0', 'Monitoring Locations', A));
    els.push(dataTable([{ text: 'ID', width: Math.round(W * 0.06) }, { text: 'Description', width: Math.round(W * 0.28) }, { text: 'Grid Ref', width: Math.round(W * 0.18) }, { text: 'Type', width: Math.round(W * 0.16) }, { text: 'Consent Limit', width: W - Math.round(W * 0.06) - Math.round(W * 0.28) - Math.round(W * 0.18) - Math.round(W * 0.16) }],
      d.monitoringLocations.map(m => [{ text: m.id, bold: true }, { text: m.description }, { text: m.gridRef }, { text: m.receptorType }, { text: m.consentLimit, bold: true }]), A, TEAL_BG));
  }

  // 3 Equipment & Calibration
  if (d.calibrationRecords.length > 0) {
    els.push(secHead('3.0', 'Equipment & Calibration', A));
    els.push(dataTable([{ text: 'Instrument', width: Math.round(W * 0.22) }, { text: 'Serial No.', width: Math.round(W * 0.16) }, { text: 'Last Cal', width: Math.round(W * 0.16) }, { text: 'Next Cal', width: Math.round(W * 0.16) }, { text: 'Drift Check', width: W - Math.round(W * 0.22) - Math.round(W * 0.16) * 3 }],
      d.calibrationRecords.map(c => [{ text: c.instrument, bold: true }, { text: c.serialNumber }, { text: c.lastCal }, { text: c.nextCal }, { text: c.driftCheck }]), A, TEAL_BG));
  }

  // 4 Measurement Results
  if (d.measurementResults.length > 0) {
    const mr = [Math.round(W * 0.06), Math.round(W * 0.10), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.18), W - Math.round(W * 0.06) - Math.round(W * 0.10) - Math.round(W * 0.08) * 5 - Math.round(W * 0.18)];
    els.push(secHead('4.0', 'Measurement Results', A));
    els.push(dataTable([{ text: 'Loc', width: mr[0] }, { text: 'Date', width: mr[1] }, { text: 'Start', width: mr[2] }, { text: 'End', width: mr[3] }, { text: 'LAeq', width: mr[4] }, { text: 'LAmax', width: mr[5] }, { text: 'LA90', width: mr[6] }, { text: 'Dominant Source', width: mr[7] }, { text: 'Comply?', width: mr[8] }],
      d.measurementResults.map(m => [{ text: m.locationId, bold: true }, { text: m.date }, { text: m.startTime }, { text: m.endTime }, { text: m.laeq, bold: true }, { text: m.lamax }, { text: m.la90 }, { text: m.dominantSource }, { text: m.compliance, bold: true, color: ragC(m.compliance) }]), A, TEAL_BG));
  }

  // 5 Exceedances
  if (d.exceedances.length > 0) {
    els.push(secHead('5.0', 'Exceedance Analysis', A));
    els.push(dataTable([{ text: 'Location', width: Math.round(W * 0.08) }, { text: 'Date', width: Math.round(W * 0.10) }, { text: 'Measured', width: Math.round(W * 0.10) }, { text: 'Limit', width: Math.round(W * 0.10) }, { text: 'Exceed', width: Math.round(W * 0.08) }, { text: 'Cause', width: Math.round(W * 0.24) }, { text: 'Corrective Action', width: W - Math.round(W * 0.08) - Math.round(W * 0.10) * 3 - Math.round(W * 0.08) - Math.round(W * 0.24) }],
      d.exceedances.map(e => [{ text: e.locationId, bold: true }, { text: e.date }, { text: e.measuredLevel, bold: true, color: RED }, { text: e.limit }, { text: e.exceedanceDb, bold: true, color: RED }, { text: e.cause }, { text: e.correctiveAction }]), A, TEAL_BG));
  }

  // 6 Weather
  if (d.weatherLogs.length > 0) {
    els.push(secHead('6.0', 'Weather Conditions', A));
    els.push(dataTable([{ text: 'Date', width: Math.round(W * 0.10) }, { text: 'Time', width: Math.round(W * 0.08) }, { text: 'Wind', width: Math.round(W * 0.10) }, { text: 'Dir', width: Math.round(W * 0.08) }, { text: 'Temp', width: Math.round(W * 0.08) }, { text: 'Rain', width: Math.round(W * 0.10) }, { text: 'Notes', width: W - Math.round(W * 0.10) - Math.round(W * 0.08) * 3 - Math.round(W * 0.10) * 2 }],
      d.weatherLogs.map(w => [{ text: w.date }, { text: w.time }, { text: w.windSpeed }, { text: w.windDir }, { text: w.temp }, { text: w.rain }, { text: w.notes }]), A, TEAL_BG));
  }

  // 7 Trend & Compliance
  if (d.trendAnalysis) { els.push(secHead('7.0', 'Trend Analysis', A)); els.push(prose(d.trendAnalysis)); }
  if (d.complianceSummary) { els.push(secHead('8.0', 'Compliance Summary', A)); els.push(prose(d.complianceSummary)); }

  // 9 Sign-Off
  els.push(secHead('9.0', 'Sign-Off', A));
  els.push(signOff(['Monitored By', 'Environmental Manager', 'Project Manager'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'Monitoring conducted in accordance with BS 5228-1:2009+A1:2014 and Section 61 consent conditions.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T4 — RESIDENT COMMUNICATION (navy, plain English)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT4(d: NoiseAssessmentData): (Paragraph | Table)[] {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY; const ZB = 'f8fafc';
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'CONSTRUCTION NOISE — RESIDENT INFORMATION', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'What to Expect \u00B7 What We\'re Doing \u00B7 How to Contact Us', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '334155' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.projectName} | ${d.principalContractor} | ${d.assessmentDate}`, size: SM, font: 'Arial', color: 'cbd5e1' })] }));

  // 1 About the Works
  els.push(secHead('', 'About the Works', A));
  if (d.worksDescription) els.push(prose(d.worksDescription));
  els.push(infoTable([{ label: 'Project Duration', value: d.programmeDuration }, { label: 'Location', value: d.siteAddress }], LBG, LC));

  // 2 Working Hours
  if (d.workingHours.length > 0) {
    els.push(secHead('', 'Our Committed Working Hours', A));
    els.push(dataTable([{ text: 'Period', width: Math.round(W * 0.20) }, { text: 'Days', width: Math.round(W * 0.20) }, { text: 'Hours', width: Math.round(W * 0.20) }, { text: 'What\'s Happening', width: W - Math.round(W * 0.20) * 3 }],
      d.workingHours.map(w => [{ text: w.period }, { text: w.days }, { text: w.hours, bold: true }, { text: w.noiseType }]), A, ZB));
  }

  // 3 Everyday Comparisons
  if (d.everydayComparisons.length > 0) {
    els.push(secHead('', 'Expected Noise in Everyday Terms', A));
    els.push(dataTable([{ text: 'Sound Source', width: Math.round(W * 0.28) }, { text: 'Noise Level', width: Math.round(W * 0.16) }, { text: 'How It Compares', width: W - Math.round(W * 0.28) - Math.round(W * 0.16) }],
      d.everydayComparisons.map(e => [{ text: e.source, bold: true }, { text: e.level }, { text: e.comparison }]), A, ZB));
  }

  // 4 What You Might Notice
  if (d.whatYouMightNotice) { els.push(secHead('', 'What You Might Notice', A)); els.push(prose(d.whatYouMightNotice)); }

  // 5 What We're Doing
  if (d.whatWeAreDoing) { els.push(secHead('', 'What We\'re Doing to Reduce Noise', A)); els.push(prose(d.whatWeAreDoing)); }
  if (d.mitigationMeasures.length > 0) {
    els.push(dataTable([{ text: 'Measure', width: Math.round(W * 0.50) }, { text: 'What It Does', width: W - Math.round(W * 0.50) }],
      d.mitigationMeasures.map(m => [{ text: m.measure }, { text: m.expectedReduction }]), A, ZB));
  }

  // 6 Timeline
  if (d.timelinePhases.length > 0) {
    els.push(secHead('', 'Project Timeline — Key Noisy Phases', A));
    els.push(dataTable([{ text: 'Phase', width: Math.round(W * 0.18) }, { text: 'Duration', width: Math.round(W * 0.14) }, { text: 'Key Plant', width: Math.round(W * 0.22) }, { text: 'Expected Noise', width: Math.round(W * 0.16) }, { text: 'Peak Period', width: W - Math.round(W * 0.18) - Math.round(W * 0.14) - Math.round(W * 0.22) - Math.round(W * 0.16) }],
      d.timelinePhases.map(t => [{ text: t.phase, bold: true }, { text: t.duration }, { text: t.keyPlant }, { text: t.expectedNoise }, { text: t.peakPeriod }]), A, ZB));
  }

  // 7 Complaint
  if (d.complaintProcedure.length > 0) {
    els.push(secHead('', 'How to Make a Complaint', A));
    els.push(dataTable([{ text: '#', width: Math.round(W * 0.06) }, { text: 'What to Do', width: Math.round(W * 0.40) }, { text: 'Response Time', width: Math.round(W * 0.18) }, { text: 'Contact', width: W - Math.round(W * 0.06) - Math.round(W * 0.40) - Math.round(W * 0.18) }],
      d.complaintProcedure.map(c => [{ text: c.step, bold: true }, { text: c.action }, { text: c.timeframe }, { text: c.responsible }]), A, ZB));
  }

  // 8 Contact
  els.push(secHead('', 'Contact Us', A));
  els.push(infoTable([
    { label: 'Community Liaison', value: d.contactName }, { label: 'Phone', value: d.contactPhone },
    { label: 'Email', value: d.contactEmail }, { label: 'Project Website', value: d.additionalNotes || '' },
  ], LBG, LC));

  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'We are committed to being good neighbours. If you have any concerns about noise from our works, please contact us using the details above. We will respond within 24 hours.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export async function buildNoiseAssessmentTemplateDocument(
  content: any,
  templateSlug: NoiseAssessmentTemplateSlug
): Promise<Document> {
  const d = extract(content);
  let children: (Paragraph | Table)[];
  switch (templateSlug) {
    case 'ebrora-standard': children = buildT1(d); break;
    case 'section-61':      children = buildT2(d); break;
    case 'monitoring-report': children = buildT3(d); break;
    case 'resident-communication': children = buildT4(d); break;
    default:                children = buildT1(d); break;
  }
  const headerLabel = templateSlug === 'section-61' ? 'Section 61 Consent Application'
    : templateSlug === 'monitoring-report' ? 'Noise Monitoring Report'
    : templateSlug === 'resident-communication' ? 'Construction Noise — Resident Information'
    : 'Construction Noise Assessment';
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader(headerLabel) }, footers: { default: h.ebroraFooter() }, children }],
  });
}
