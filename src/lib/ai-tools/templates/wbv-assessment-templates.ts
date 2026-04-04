// =============================================================================
// Whole Body Vibration Assessment — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Site Practical   (#4D7C0F lime, Arial, 3 sections, exposure summary)
// T2 — Compliance       (#1E3A5F navy, Arial, 5 sections, regulatory, clause-numbered)
// T3 — Professional     (#0F766E teal, Arial, 4 sections, A(8) calcs, KPI, action plan)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WbvTemplateSlug } from '@/lib/wbv/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const thin = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdr = { top: thin, bottom: thin, left: thin, right: thin };
const ZEBRA = 'F2F2F2';

interface Pal { accent: string; subtitleColor: string; labelBg: string; dark: string; mid: string; font: string; }
const PAL: Record<WbvTemplateSlug, Pal> = {
  'site-practical': { accent: '4D7C0F', subtitleColor: 'D9F99D', labelBg: 'F7FEE7', dark: '365314', mid: '6B7280', font: 'Arial' },
  'compliance':     { accent: '1E3A5F', subtitleColor: '93C5FD', labelBg: 'F1F5F9', dark: '1E293B', mid: '64748B', font: 'Arial' },
  'professional':   { accent: '0F766E', subtitleColor: '99F6E4', labelBg: 'F0FDFA', dark: '134E4A', mid: '6B7280', font: 'Arial' },
};

// ── Data ─────────────────────────────────────────────────────────────────────
interface WbvData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessor: string; reviewedBy: string;
  projectName: string; siteAddress: string; contractReference: string;
  operatorsSummary: string; equipmentSummary: string; overallStatus: string;
  assessmentScope: string; regulatoryContext: string;
  equipmentAssessments: Array<{
    ref: string; machineType: string; makeModel: string; age: string;
    seatType: string; seatCondition: string;
    vibrationMagnitude: number; dailyExposure: number; a8Result: number;
    vsEav: string; vsElv: string; action: string; source: string;
  }>;
  operatives: Array<{ name: string; role: string; equipment: string; maxHours: string; briefed: string }>;
  hazards: Array<{ hazard: string; likelihood: number; severity: number; risk: number; control: string; residual: string }>;
  controlMeasures: Array<{ ref: string; regulation: string; measure: string; owner: string; frequency: string }>;
  healthSurveillance: Array<{ operator: string; status: string; lastAssessment: string; nextDue: string; notes: string }>;
  actionPlan: Array<{ num: string; action: string; owner: string; priority: string; target: string; benefit: string }>;
  controls: string[];
  healthSurveillanceNarrative: string; reviewSchedule: string;
}

function extract(c: any): WbvData {
  const d = c || {};
  const safe = (v: any) => (typeof v === 'string' ? v : '') || '';
  const safeArr = (v: any) => (Array.isArray(v) ? v : []);
  return {
    documentRef: safe(d.documentRef), assessmentDate: safe(d.assessmentDate),
    reviewDate: safe(d.reviewDate), assessor: safe(d.assessor),
    reviewedBy: safe(d.reviewedBy || d.reviewer),
    projectName: safe(d.projectName), siteAddress: safe(d.siteAddress),
    contractReference: safe(d.contractReference),
    operatorsSummary: safe(d.operatorsSummary), equipmentSummary: safe(d.equipmentSummary),
    overallStatus: safe(d.overallStatus),
    assessmentScope: safe(d.assessmentScope), regulatoryContext: safe(d.regulatoryContext),
    equipmentAssessments: safeArr(d.equipmentAssessments).map((eq: any) => ({
      ref: safe(eq.ref), machineType: safe(eq.machineType), makeModel: safe(eq.makeModel),
      age: safe(eq.age), seatType: safe(eq.seatType), seatCondition: safe(eq.seatCondition),
      vibrationMagnitude: Number(eq.vibrationMagnitude) || 0,
      dailyExposure: Number(eq.dailyExposure) || 0,
      a8Result: Number(eq.a8Result) || 0,
      vsEav: safe(eq.vsEav || eq.eavStatus), vsElv: safe(eq.vsElv || eq.elvStatus),
      action: safe(eq.action || eq.requiredAction), source: safe(eq.source || eq.vibrationSource),
    })),
    operatives: safeArr(d.operatives).map((op: any) => ({
      name: safe(op.name), role: safe(op.role), equipment: safe(op.equipment || op.machineType),
      maxHours: safe(op.maxHours || op.maxDailyHours), briefed: safe(op.briefed || '\u2713 YES'),
    })),
    hazards: safeArr(d.hazards || d.riskAssessment).map((hz: any) => ({
      hazard: safe(hz.hazard), likelihood: Number(hz.likelihood || hz.likelihoodBefore) || 0,
      severity: Number(hz.severity || hz.severityBefore) || 0,
      risk: Number(hz.risk || hz.riskRating) || 0,
      control: safe(hz.control || hz.controlMeasures), residual: safe(hz.residual || hz.residualRisk),
    })),
    controlMeasures: safeArr(d.controlMeasures).map((cm: any) => ({
      ref: safe(cm.ref || cm.regulationRef), regulation: safe(cm.regulation || cm.regulationTitle),
      measure: safe(cm.measure || cm.controlMeasure), owner: safe(cm.owner), frequency: safe(cm.frequency),
    })),
    healthSurveillance: safeArr(d.healthSurveillance || d.healthSurveillanceProgramme).map((hs: any) => ({
      operator: safe(hs.operator || hs.name), status: safe(hs.status),
      lastAssessment: safe(hs.lastAssessment), nextDue: safe(hs.nextDue), notes: safe(hs.notes),
    })),
    actionPlan: safeArr(d.actionPlan).map((ap: any, i: number) => ({
      num: safe(ap.num) || String(i + 1), action: safe(ap.action), owner: safe(ap.owner),
      priority: safe(ap.priority), target: safe(ap.target), benefit: safe(ap.benefit || ap.expectedBenefit),
    })),
    controls: safeArr(d.controls || d.controlsList).map((s: any) => safe(s)),
    healthSurveillanceNarrative: safe(d.healthSurveillanceNarrative),
    reviewSchedule: safe(d.reviewSchedule),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }
function hdrCell(text: string, w: number, bg: string): TableCell {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function dCell(text: string, w: number, dark: string, opts?: { bold?: boolean; shade?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: opts?.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, font: 'Arial', size: BODY, color: opts?.color || dark })] })] });
}
function ragCell(rating: string, w: number): TableCell {
  const r = (rating || '').toUpperCase();
  let bg = 'F5F5F5'; let color = '333333';
  if (r.includes('ABOVE') || r.includes('HIGH') || r.includes('>') || r === '= EAV' || (Number(r) >= 12)) { bg = 'FFFBEB'; color = 'D97706'; }
  if (r.includes('BELOW') || r.includes('LOW') || r.includes('<') || (Number(r) > 0 && Number(r) < 6)) { bg = 'D1FAE5'; color = '059669'; }
  if (r.includes('EXCEED') || (Number(r) >= 15)) { bg = 'FEF2F2'; color = 'DC2626'; }
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
      new TextRun({ text: rating || '\u2014', bold: true, font: 'Arial', size: SM, color })] })] });
}
function priorityColor(p: string): string {
  const lc = (p || '').toLowerCase();
  if (lc.includes('immediate')) return 'DC2626';
  if (lc.includes('short')) return 'D97706';
  return '6B7280';
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — SITE PRACTICAL (#4D7C0F, 3 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: WbvData): Document {
  const p = PAL['site-practical'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WHOLE BODY VIBRATION', 'ASSESSMENT'], `Site Practical \u2014 ${d.equipmentSummary || d.projectName}`, p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
    { label: 'Assessed By', value: d.assessor },
    { label: 'Operators', value: d.operatorsSummary || d.operatives.map(o => o.name).join(', ') },
    { label: 'Equipment', value: d.equipmentSummary || d.equipmentAssessments.map(e => e.makeModel).join(', ') },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 EQUIPMENT & EXPOSURE SUMMARY
  children.push(h.fullWidthSectionBar('01', 'EQUIPMENT & EXPOSURE SUMMARY', p.accent)); children.push(gap(80));
  const ecw = [Math.round(W*0.20), Math.round(W*0.12), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.12), Math.round(W*0.12)];
  ecw.push(W - ecw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ecw,
    rows: [
      new TableRow({ children: [hdrCell('Equipment',ecw[0],p.accent), hdrCell('Vibration',ecw[1],p.accent), hdrCell('Daily Use',ecw[2],p.accent), hdrCell('A(8)',ecw[3],p.accent), hdrCell('vs EAV',ecw[4],p.accent), hdrCell('vs ELV',ecw[5],p.accent), hdrCell('Action',ecw[6],p.accent)] }),
      ...d.equipmentAssessments.map((eq,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(eq.machineType || eq.makeModel, ecw[0], p.dark, { shade, bold: true }),
          dCell(`${eq.vibrationMagnitude} m/s\u00B2`, ecw[1], p.dark, { shade }),
          dCell(`${eq.dailyExposure} hrs`, ecw[2], p.dark, { shade }),
          dCell(eq.a8Result.toFixed(2), ecw[3], p.dark, { shade, bold: true }),
          ragCell(eq.vsEav, ecw[4]), ragCell(eq.vsElv, ecw[5]),
          dCell(eq.action, ecw[6], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(80));
  children.push(h.calloutBox('EAV (0.5 m/s\u00B2): Exposure Action Value \u2014 employer must take action to reduce exposure. ELV (1.15 m/s\u00B2): Exposure Limit Value \u2014 must not be exceeded.', 'D97706', 'FFFBEB', '92400E', W));
  children.push(gap(200));

  // 02 CONTROLS
  children.push(h.fullWidthSectionBar('02', 'CONTROLS', p.accent)); children.push(gap(80));
  d.controls.forEach(ctrl => {
    children.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 280 }, children: [
      new TextRun({ text: '\u2022  ', font: 'Arial', size: BODY, color: p.accent }),
      new TextRun({ text: ctrl, font: 'Arial', size: BODY, color: p.dark }),
    ] }));
  }); children.push(gap(200));

  // 03 OPERATIVE ACKNOWLEDGEMENT
  children.push(h.fullWidthSectionBar('03', 'OPERATIVE ACKNOWLEDGEMENT', p.accent)); children.push(gap(80));
  const ocw = [Math.round(W*0.22), Math.round(W*0.20), Math.round(W*0.15), Math.round(W*0.13)];
  ocw.push(W - ocw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ocw,
    rows: [
      new TableRow({ children: [hdrCell('Name',ocw[0],p.accent), hdrCell('Equipment',ocw[1],p.accent), hdrCell('Max Daily Hrs',ocw[2],p.accent), hdrCell('Briefed',ocw[3],p.accent), hdrCell('Signature',ocw[4],p.accent)] }),
      ...d.operatives.map((op,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(op.name, ocw[0], p.dark, { shade, bold: true }),
          dCell(op.equipment, ocw[1], p.dark, { shade }),
          dCell(op.maxHours, ocw[2], p.dark, { shade }),
          dCell(op.briefed, ocw[3], '059669', { shade }),
          dCell('', ocw[4], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(80));
  if (d.reviewSchedule) children.push(h.calloutBox(`Review Date: ${d.reviewSchedule}`, '2563EB', 'EFF6FF', '1E40AF', W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Whole Body Vibration Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Site Practical', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — COMPLIANCE (#1E3A5F navy, 5 sections, regulatory)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: WbvData): Document {
  const p = PAL['compliance'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WHOLE BODY VIBRATION', 'COMPLIANCE ASSESSMENT'], 'Control of Vibration at Work Regulations 2005 \u2014 Formal Compliance', p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date / Rev', value: d.assessmentDate },
    { label: 'Assessed By', value: d.assessor }, { label: 'Reviewed By', value: d.reviewedBy },
    { label: 'Regulation', value: 'Control of Vibration at Work Regulations 2005 (SI 2005/1093)' },
    { label: 'Guidance', value: 'HSE L140; HSE Whole body vibration guidance' },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 REGULATORY THRESHOLDS
  children.push(h.fullWidthSectionBar('01', 'REGULATORY THRESHOLDS', p.accent)); children.push(gap(80));
  const tcw = [Math.round(W*0.25), Math.round(W*0.15)]; tcw.push(W-tcw[0]-tcw[1]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: tcw,
    rows: [
      new TableRow({ children: [hdrCell('Threshold',tcw[0],p.accent), hdrCell('Value',tcw[1],p.accent), hdrCell('Legal Requirement',tcw[2],p.accent)] }),
      new TableRow({ children: [
        dCell('Exposure Action Value (EAV)', tcw[0], p.dark, { bold: true }),
        dCell('0.5 m/s\u00B2 A(8)', tcw[1], p.dark, { bold: true, color: 'D97706' }),
        dCell('Regulation 6(1)(a) \u2014 employer must introduce measures to reduce exposure. Regulation 7 \u2014 health surveillance required.', tcw[2], p.dark),
      ] }),
      new TableRow({ children: [
        dCell('Exposure Limit Value (ELV)', tcw[0], p.dark, { bold: true, shade: ZEBRA }),
        dCell('1.15 m/s\u00B2 A(8)', tcw[1], p.dark, { bold: true, color: '991B1B', shade: ZEBRA }),
        dCell('Regulation 6(1)(b) \u2014 exposure must NOT be exceeded. Regulation 8 \u2014 record and investigate.', tcw[2], p.dark, { shade: ZEBRA }),
      ] }),
    ],
  })); children.push(gap(200));

  // 02 EXPOSURE ASSESSMENT
  children.push(h.fullWidthSectionBar('02', 'EXPOSURE ASSESSMENT (Regulation 5)', p.accent)); children.push(gap(80));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [
    new TextRun({ text: '2.1 ', bold: true, font: 'Arial', size: BODY, color: p.accent }),
    new TextRun({ text: 'Daily vibration exposure A(8) is calculated using the formula: A(8) = a\u2095\u1D65 \u00D7 \u221A(T/8), where a\u2095\u1D65 is the vibration magnitude (m/s\u00B2) and T is the daily exposure duration (hours).', font: 'Arial', size: BODY, color: p.dark }),
  ] }));
  const excw = [Math.round(W*0.20), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.12), Math.round(W*0.12)];
  excw.push(W - excw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: excw,
    rows: [
      new TableRow({ children: [hdrCell('Equipment',excw[0],p.accent), hdrCell('a\u2095\u1D65',excw[1],p.accent), hdrCell('T (hrs)',excw[2],p.accent), hdrCell('A(8)',excw[3],p.accent), hdrCell('vs EAV',excw[4],p.accent), hdrCell('vs ELV',excw[5],p.accent), hdrCell('Source',excw[6],p.accent)] }),
      ...d.equipmentAssessments.map((eq,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(eq.makeModel || eq.machineType, excw[0], p.dark, { shade, bold: true }),
          dCell(`${eq.vibrationMagnitude}`, excw[1], p.dark, { shade }),
          dCell(`${eq.dailyExposure}`, excw[2], p.dark, { shade }),
          dCell(eq.a8Result.toFixed(2), excw[3], p.dark, { shade, bold: true }),
          ragCell(eq.vsEav, excw[4]), ragCell(eq.vsElv, excw[5]),
          dCell(eq.source, excw[6], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(80));
  children.push(h.calloutBox('Regulation 6 Triggered: Equipment at or above the EAV. Employer must take action under Regulation 6(1)(a) to reduce exposure so far as reasonably practicable.', 'D97706', 'FFFBEB', '92400E', W));
  children.push(gap(200));

  // 03 RISK ASSESSMENT MATRIX
  children.push(h.fullWidthSectionBar('03', 'RISK ASSESSMENT MATRIX', p.accent)); children.push(gap(80));
  const rcw = [Math.round(W*0.20), Math.round(W*0.08), Math.round(W*0.08), Math.round(W*0.08), Math.round(W*0.38)];
  rcw.push(W - rcw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: rcw,
    rows: [
      new TableRow({ children: [hdrCell('Hazard',rcw[0],p.accent), hdrCell('L',rcw[1],p.accent), hdrCell('S',rcw[2],p.accent), hdrCell('Risk',rcw[3],p.accent), hdrCell('Control (Reg. Ref.)',rcw[4],p.accent), hdrCell('Residual',rcw[5],p.accent)] }),
      ...d.hazards.map((hz,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(hz.hazard, rcw[0], p.dark, { shade, bold: true }),
          dCell(String(hz.likelihood), rcw[1], p.dark, { shade }),
          dCell(String(hz.severity), rcw[2], p.dark, { shade }),
          ragCell(String(hz.risk || hz.likelihood * hz.severity), rcw[3]),
          dCell(hz.control, rcw[4], p.dark, { shade }),
          ragCell(hz.residual, rcw[5]),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 04 CONTROL MEASURES
  children.push(h.fullWidthSectionBar('04', 'CONTROL MEASURES (Regulation 6(2))', p.accent)); children.push(gap(80));
  const ccw = [Math.round(W*0.08), Math.round(W*0.20), Math.round(W*0.38), Math.round(W*0.16)];
  ccw.push(W - ccw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ccw,
    rows: [
      new TableRow({ children: [hdrCell('Ref',ccw[0],p.accent), hdrCell('Regulation',ccw[1],p.accent), hdrCell('Control Measure',ccw[2],p.accent), hdrCell('Owner',ccw[3],p.accent), hdrCell('Frequency',ccw[4],p.accent)] }),
      ...d.controlMeasures.map((cm,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(cm.ref, ccw[0], p.dark, { shade }), dCell(cm.regulation, ccw[1], p.dark, { shade }),
          dCell(cm.measure, ccw[2], p.dark, { shade }), dCell(cm.owner, ccw[3], p.dark, { shade }),
          dCell(cm.frequency, ccw[4], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 05 HEALTH SURVEILLANCE
  children.push(h.fullWidthSectionBar('05', 'HEALTH SURVEILLANCE (Regulation 7)', p.accent)); children.push(gap(80));
  if (d.healthSurveillanceNarrative) {
    children.push(new Paragraph({ spacing: { after: 120 }, children: [
      new TextRun({ text: '5.1 ', bold: true, font: 'Arial', size: BODY, color: p.accent }),
      new TextRun({ text: d.healthSurveillanceNarrative, font: 'Arial', size: BODY, color: p.dark }),
    ] }));
  }
  children.push(gap(200));

  children.push(h.signatureGrid(['Assessed By', 'Reviewed By'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('WBV Compliance Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Compliance', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — PROFESSIONAL (#0F766E teal, 4 sections, A(8) calcs, KPI, action plan)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: WbvData): Document {
  const p = PAL['professional'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WHOLE BODY VIBRATION', 'PROFESSIONAL', 'ASSESSMENT'], 'Full A(8) Calculations \u00B7 Health Surveillance \u00B7 Action Plan', p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date / Rev', value: d.assessmentDate },
    { label: 'Project', value: d.projectName }, { label: 'Contract', value: d.contractReference },
    { label: 'Assessed By', value: d.assessor }, { label: 'Reviewed By', value: d.reviewedBy },
    { label: 'Operators Assessed', value: d.operatorsSummary || String(d.operatives.length) },
    { label: 'Overall Status', value: d.overallStatus || 'EAV REACHED \u2014 CONTROLS REQUIRED' },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 EQUIPMENT REGISTER
  children.push(h.fullWidthSectionBar('01', 'EQUIPMENT REGISTER', p.accent)); children.push(gap(80));
  const ercw = [Math.round(W*0.18), Math.round(W*0.12), Math.round(W*0.08), Math.round(W*0.10), Math.round(W*0.12), Math.round(W*0.14)];
  ercw.push(W - ercw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ercw,
    rows: [
      new TableRow({ children: [hdrCell('Equipment',ercw[0],p.accent), hdrCell('Model',ercw[1],p.accent), hdrCell('Year',ercw[2],p.accent), hdrCell('WBV (m/s\u00B2)',ercw[3],p.accent), hdrCell('Source',ercw[4],p.accent), hdrCell('Seat Type',ercw[5],p.accent), hdrCell('Condition',ercw[6],p.accent)] }),
      ...d.equipmentAssessments.map((eq,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(eq.machineType, ercw[0], p.dark, { shade, bold: true }),
          dCell(eq.makeModel, ercw[1], p.dark, { shade }),
          dCell(eq.age, ercw[2], p.dark, { shade }),
          dCell(String(eq.vibrationMagnitude), ercw[3], p.dark, { shade }),
          dCell(eq.source, ercw[4], p.dark, { shade }),
          dCell(eq.seatType, ercw[5], p.dark, { shade }),
          dCell(eq.seatCondition, ercw[6], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 02 A(8) EXPOSURE CALCULATIONS
  children.push(h.fullWidthSectionBar('02', 'A(8) EXPOSURE CALCULATIONS', p.accent)); children.push(gap(80));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [
    new TextRun({ text: 'Formula: ', bold: true, font: 'Arial', size: BODY, color: p.dark }),
    new TextRun({ text: 'A(8) = a\u2095\u1D65 \u00D7 \u221A(T/T\u2080), where a\u2095\u1D65 = vibration magnitude (m/s\u00B2), T = daily exposure (hrs), T\u2080 = 8 hrs reference.', font: 'Arial', size: BODY, color: p.dark }),
  ] }));
  const a8cw = [Math.round(W*0.20), Math.round(W*0.16), Math.round(W*0.08), Math.round(W*0.08), Math.round(W*0.10), Math.round(W*0.10)];
  a8cw.push(W - a8cw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: a8cw,
    rows: [
      new TableRow({ children: [hdrCell('Operator',a8cw[0],p.accent), hdrCell('Equipment',a8cw[1],p.accent), hdrCell('a\u2095\u1D65',a8cw[2],p.accent), hdrCell('T (hrs)',a8cw[3],p.accent), hdrCell('\u221A(T/8)',a8cw[4],p.accent), hdrCell('A(8)',a8cw[5],p.accent), hdrCell('Status',a8cw[6],p.accent)] }),
      ...d.operatives.map((op,i) => {
        const eq = d.equipmentAssessments.find(e => e.makeModel === op.equipment || e.machineType === op.equipment) || d.equipmentAssessments[i] || { vibrationMagnitude: 0, dailyExposure: 0, a8Result: 0, vsEav: '' };
        const sqrtT8 = eq.dailyExposure > 0 ? Math.sqrt(eq.dailyExposure / 8) : 0;
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(op.name, a8cw[0], p.dark, { shade, bold: true }),
          dCell(op.equipment, a8cw[1], p.dark, { shade }),
          dCell(String(eq.vibrationMagnitude), a8cw[2], p.dark, { shade }),
          dCell(String(eq.dailyExposure), a8cw[3], p.dark, { shade }),
          dCell(sqrtT8.toFixed(3), a8cw[4], p.dark, { shade }),
          dCell(eq.a8Result.toFixed(2), a8cw[5], p.dark, { shade, bold: true }),
          ragCell(eq.vsEav, a8cw[6]),
        ] });
      }),
    ],
  })); children.push(gap(80));

  // KPI Dashboard
  const maxA8 = d.equipmentAssessments.reduce((max, eq) => Math.max(max, eq.a8Result), 0);
  children.push(h.kpiDashboard([
    { value: maxA8.toFixed(2), label: 'Highest A(8)' },
    { value: '0.50', label: 'EAV Threshold' },
    { value: '1.15', label: 'ELV Limit' },
  ], p.accent, W));
  children.push(gap(200));

  // 03 HEALTH SURVEILLANCE PROGRAMME
  children.push(h.fullWidthSectionBar('03', 'HEALTH SURVEILLANCE PROGRAMME', p.accent)); children.push(gap(80));
  const hscw = [Math.round(W*0.22), Math.round(W*0.15), Math.round(W*0.16), Math.round(W*0.16)];
  hscw.push(W - hscw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: hscw,
    rows: [
      new TableRow({ children: [hdrCell('Operator',hscw[0],p.accent), hdrCell('Status',hscw[1],p.accent), hdrCell('Last Assessment',hscw[2],p.accent), hdrCell('Next Due',hscw[3],p.accent), hdrCell('Notes',hscw[4],p.accent)] }),
      ...d.healthSurveillance.map((hs,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(hs.operator, hscw[0], p.dark, { shade, bold: true }),
          dCell(hs.status, hscw[1], p.dark, { shade }),
          dCell(hs.lastAssessment, hscw[2], p.dark, { shade }),
          dCell(hs.nextDue, hscw[3], p.dark, { shade }),
          dCell(hs.notes, hscw[4], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 04 ACTION PLAN
  children.push(h.fullWidthSectionBar('04', 'ACTION PLAN', p.accent)); children.push(gap(80));
  const apcw = [Math.round(W*0.05), Math.round(W*0.33), Math.round(W*0.12), Math.round(W*0.12), Math.round(W*0.13)];
  apcw.push(W - apcw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: apcw,
    rows: [
      new TableRow({ children: [hdrCell('#',apcw[0],p.accent), hdrCell('Action',apcw[1],p.accent), hdrCell('Owner',apcw[2],p.accent), hdrCell('Priority',apcw[3],p.accent), hdrCell('Target',apcw[4],p.accent), hdrCell('Expected Benefit',apcw[5],p.accent)] }),
      ...d.actionPlan.map((ap,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(ap.num, apcw[0], p.dark, { shade }),
          dCell(ap.action, apcw[1], p.dark, { shade }),
          dCell(ap.owner, apcw[2], p.dark, { shade }),
          dCell(ap.priority, apcw[3], p.dark, { shade, bold: true, color: priorityColor(ap.priority) }),
          dCell(ap.target, apcw[4], p.dark, { shade }),
          dCell(ap.benefit, apcw[5], p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(80));
  if (d.reviewSchedule) children.push(h.calloutBox(`Review Schedule: ${d.reviewSchedule}`, '2563EB', 'EFF6FF', '1E40AF', W));
  children.push(gap(200));

  children.push(h.signatureGrid(['Assessed By', 'H&S Manager'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('WBV Professional Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Professional', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildWbvTemplateDocument(
  content: any,
  templateSlug: WbvTemplateSlug,
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'site-practical': return buildT1(d);
    case 'compliance':     return buildT2(d);
    case 'professional':   return buildT3(d);
    default:               return buildT1(d);
  }
}
