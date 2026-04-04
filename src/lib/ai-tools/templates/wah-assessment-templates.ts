// =============================================================================
// Working at Height Assessment — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Site-Ready        (#1E40AF blue, Arial, 4 sections, checklist)
// T2 — Formal HSE        (#B45309 amber + #2D2D2D bars, Cambria, clause-numbered)
// T3 — Quick Check       (#475569 slate, Arial, left-border, pre-task checklist)
// T4 — Full Compliance   (#065F46 green, Arial, 5 sections, rescue plan, competency)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WahTemplateSlug } from '@/lib/wah/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const thin = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdr = { top: thin, bottom: thin, left: thin, right: thin };
const ZEBRA = 'F2F2F2';

interface Pal { accent: string; barBg: string; barNumColor: string; subtitleColor: string; labelBg: string; dark: string; mid: string; font: string; }
const PAL: Record<WahTemplateSlug, Pal> = {
  'site-ready':      { accent: '1E40AF', barBg: '1E40AF', barNumColor: 'FFFFFF', subtitleColor: '93C5FD', labelBg: 'EFF6FF', dark: '1E293B', mid: '64748B', font: 'Arial' },
  'formal-hse':      { accent: 'B45309', barBg: '2D2D2D', barNumColor: 'FDE68A', subtitleColor: 'FDE68A', labelBg: 'FFFBEB', dark: '333333', mid: '666666', font: 'Cambria' },
  'quick-check':     { accent: '475569', barBg: '475569', barNumColor: 'FFFFFF', subtitleColor: 'CBD5E1', labelBg: 'F8FAFC', dark: '334155', mid: '94A3B8', font: 'Arial' },
  'full-compliance': { accent: '065F46', barBg: '065F46', barNumColor: 'FFFFFF', subtitleColor: 'A7F3D0', labelBg: 'F0FDF4', dark: '1A2E2A', mid: '6B7280', font: 'Arial' },
};

// ── Data ─────────────────────────────────────────────────────────────────────
interface WahData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessor: string; reviewedBy: string;
  projectName: string; siteAddress: string; client: string; principalContractor: string;
  taskDescription: string; location: string; workingHeight: string; duration: string;
  accessMethod: string; riskLevel: string; contractReference: string;
  hierarchy: { avoidance: string; prevention: string; mitigation: string };
  hazards: Array<{ ref: string; hazard: string; consequence: string; whoAtRisk: string;
    likelihoodBefore: number; severityBefore: number; riskRatingBefore: string;
    controlMeasures: string; responsible: string;
    likelihoodAfter: number; severityAfter: number; riskRatingAfter: string }>;
  equipment: Array<{ item: string; specification: string; checked: string; notes: string }>;
  rescuePlan: string;
  competency: Array<{ person: string; role: string; qualification: string; expiry: string; verified: string }>;
  weatherRestrictions: Array<{ condition: string; restriction: string }>;
  inspections: Array<{ inspection: string; frequency: string; byWhom: string; record: string }>;
  regulatoryNarrative: string;
}

function extract(c: any): WahData {
  const d = c || {};
  const safe = (v: any) => (typeof v === 'string' ? v : '') || '';
  const safeArr = (v: any) => (Array.isArray(v) ? v : []);
  const hoc = d.hierarchyOfControl || {};
  return {
    documentRef: safe(d.documentRef), assessmentDate: safe(d.assessmentDate),
    reviewDate: safe(d.reviewDate), assessor: safe(d.assessor),
    reviewedBy: safe(d.reviewedBy || d.reviewer),
    projectName: safe(d.projectName), siteAddress: safe(d.siteAddress),
    client: safe(d.client), principalContractor: safe(d.principalContractor),
    taskDescription: safe(d.taskDescription), location: safe(d.location),
    workingHeight: safe(d.workingHeight), duration: safe(d.duration),
    accessMethod: safe(d.accessMethod), riskLevel: safe(d.riskLevel),
    contractReference: safe(d.contractReference),
    hierarchy: { avoidance: safe(hoc.avoidance), prevention: safe(hoc.prevention), mitigation: safe(hoc.mitigation) },
    hazards: safeArr(d.hazards).map((hz: any) => ({
      ref: safe(hz.ref), hazard: safe(hz.hazard), consequence: safe(hz.consequence),
      whoAtRisk: safe(hz.whoAtRisk),
      likelihoodBefore: Number(hz.likelihoodBefore) || 0, severityBefore: Number(hz.severityBefore) || 0,
      riskRatingBefore: safe(hz.riskRatingBefore), controlMeasures: safe(hz.controlMeasures),
      responsible: safe(hz.responsible),
      likelihoodAfter: Number(hz.likelihoodAfter) || 0, severityAfter: Number(hz.severityAfter) || 0,
      riskRatingAfter: safe(hz.riskRatingAfter),
    })),
    equipment: safeArr(d.equipmentRequired || d.equipment).map((eq: any) => ({
      item: safe(eq.item), specification: safe(eq.specification),
      checked: safe(eq.checked || eq.inspectionRequired || '\u2713 YES'),
      notes: safe(eq.notes || eq.specification),
    })),
    rescuePlan: safe(d.rescuePlan),
    competency: safeArr(d.competencyRequirements || d.competency).map((cp: any) => ({
      person: safe(cp.person || cp.name), role: safe(cp.role),
      qualification: safe(cp.qualification), expiry: safe(cp.expiry),
      verified: safe(cp.verified || '\u2713'),
    })),
    weatherRestrictions: typeof d.weatherRestrictions === 'string'
      ? (d.weatherRestrictions || '').split(/\n\n?/).filter(Boolean).map((line: string) => {
          const [cond, ...rest] = line.split(':');
          return { condition: (cond || '').trim(), restriction: rest.join(':').trim() };
        })
      : safeArr(d.weatherRestrictions).map((wr: any) => ({
          condition: safe(wr.condition || wr.label), restriction: safe(wr.restriction || wr.value),
        })),
    inspections: safeArr(d.inspections || d.inspectionSchedule).map((ins: any) => ({
      inspection: safe(ins.inspection || ins.item), frequency: safe(ins.frequency),
      byWhom: safe(ins.byWhom || ins.inspector), record: safe(ins.record),
    })),
    regulatoryNarrative: safe(d.regulatoryNarrative || d.accessJustification),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }
function proseParas(p: Pal, text: string): Paragraph[] {
  return (text || '').split(/\n\n?/).filter(Boolean).map(para =>
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: para, font: p.font, size: BODY, color: p.dark })] }));
}
function hdrCell(text: string, w: number, bg: string, font: string): TableCell {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE })] })] });
}
function dCell(text: string, w: number, font: string, dark: string, opts?: { bold?: boolean; shade?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: opts?.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, font, size: BODY, color: opts?.color || dark })] })] });
}
function accentInfoTable(p: Pal, rows: Array<{ label: string; value: string; valueColor?: string; valueBold?: boolean }>): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: bdr,
        shading: { fill: p.labelBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: BODY, font: p.font, color: p.accent })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: bdr,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: p.font, color: r.valueColor || p.dark, bold: r.valueBold })] })] }),
    ] })) });
}

function ragCell(rating: string, w: number, font: string): TableCell {
  const r = (rating || '').toUpperCase();
  let bg = 'F5F5F5'; let color = '333333';
  if (r.includes('HIGH') || r === 'H' || (Number(r) >= 12)) { bg = 'FEF2F2'; color = 'DC2626'; }
  else if (r.includes('MED') || r === 'M' || (Number(r) >= 6 && Number(r) < 12)) { bg = 'FFFBEB'; color = 'D97706'; }
  else if (r.includes('LOW') || r === 'L' || (Number(r) > 0 && Number(r) < 6)) { bg = 'D1FAE5'; color = '059669'; }
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
      new TextRun({ text: rating || '\u2014', bold: true, font, size: SM, color })] })] });
}

// Formal HSE section bar (charcoal + amber clause number)
function formalBar(num: string, title: string, barBg: string, numColor: string, font: string): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: barBg, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 140, right: 140 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: num, bold: true, size: LG, font, color: numColor }),
        new TextRun({ text: `   ${title.toUpperCase()}`, bold: true, size: LG, font, color: h.WHITE }),
      ] })],
    })] })],
  });
}

function leftBorderHead(title: string, accent: string, font: string): Paragraph {
  return new Paragraph({ spacing: { before: 280, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: accent, space: 6 } },
    indent: { left: 80 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, font, size: LG, color: accent })] });
}

// Hierarchy step (coloured number + content)
function hierarchyStep(num: number, title: string, text: string, numBg: string, font: string, dark: string): Table {
  const numW = 400; const contentW = W - numW;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [numW, contentW],
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: numW, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, borders: h.NO_BORDERS,
        shading: { fill: numBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
          new TextRun({ text: String(num), bold: true, size: 28, font: 'Arial', color: h.WHITE })] })] }),
      new TableCell({ width: { size: contentW, type: WidthType.DXA }, margins: CM, borders: h.NO_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: `${title} `, bold: true, font, size: BODY, color: dark }),
          new TextRun({ text, font, size: BODY, color: dark }),
        ] })] }),
    ] })] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — SITE-READY (#1E40AF, 01-numbered, hazard table + equipment checklist)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: WahData): Document {
  const p = PAL['site-ready'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WORKING AT HEIGHT', 'ASSESSMENT'], `Site-Ready Format \u2014 ${d.taskDescription?.split('.')[0] || d.projectName}`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
    { label: 'Assessed By', value: d.assessor },
    { label: 'Task', value: d.taskDescription?.slice(0, 200) || '' },
    { label: 'Location', value: d.location }, { label: 'Maximum Height', value: d.workingHeight },
    { label: 'Duration', value: d.duration },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 TASK & LOCATION
  children.push(h.fullWidthSectionBar('01', 'TASK & LOCATION', p.accent)); children.push(gap(80));
  children.push(...proseParas(p, d.taskDescription)); children.push(gap(200));

  // 02 HAZARD IDENTIFICATION
  children.push(h.fullWidthSectionBar('02', 'HAZARD IDENTIFICATION', p.accent)); children.push(gap(80));
  const cw = [Math.round(W*0.22), Math.round(W*0.20), Math.round(W*0.10), Math.round(W*0.36)];
  cw.push(W - cw[0]-cw[1]-cw[2]-cw[3]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw,
    rows: [
      new TableRow({ children: [hdrCell('Hazard',cw[0],p.accent,p.font), hdrCell('Consequence',cw[1],p.accent,p.font), hdrCell('Risk',cw[2],p.accent,p.font), hdrCell('Control Measure',cw[3],p.accent,p.font), hdrCell('Residual',cw[4],p.accent,p.font)] }),
      ...d.hazards.map((hz,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(hz.hazard, cw[0], p.font, p.dark, { shade, bold: true }),
          dCell(hz.consequence || hz.whoAtRisk, cw[1], p.font, p.dark, { shade }),
          ragCell(hz.riskRatingBefore, cw[2], p.font),
          dCell(hz.controlMeasures, cw[3], p.font, p.dark, { shade }),
          ragCell(hz.riskRatingAfter, cw[4], p.font),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 03 EQUIPMENT CHECKLIST
  children.push(h.fullWidthSectionBar('03', 'EQUIPMENT CHECKLIST', p.accent)); children.push(gap(80));
  const ecw = [Math.round(W*0.35), Math.round(W*0.12)]; ecw.push(W-ecw[0]-ecw[1]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ecw,
    rows: [
      new TableRow({ children: [hdrCell('Item',ecw[0],p.accent,p.font), hdrCell('Checked',ecw[1],p.accent,p.font), hdrCell('Notes',ecw[2],p.accent,p.font)] }),
      ...d.equipment.map((eq,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(eq.item, ecw[0], p.font, p.dark, { shade, bold: true }),
          dCell(eq.checked, ecw[1], p.font, '059669', { shade }),
          dCell(eq.notes, ecw[2], p.font, p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 04 SIGN-OFF
  children.push(h.fullWidthSectionBar('04', 'SIGN-OFF', p.accent)); children.push(gap(100));
  children.push(h.signatureGrid(['Assessor', 'Scaffold Supervisor'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Working at Height Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Site-Ready', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — FORMAL HSE (#B45309 amber + #2D2D2D bars, clause-numbered 1.0–4.0)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: WahData): Document {
  const p = PAL['formal-hse'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WORKING AT HEIGHT', 'ASSESSMENT'], 'Formal HSE Format \u2014 WAH Regulations 2005 Compliance', p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.barBg));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
    { label: 'Task', value: d.taskDescription?.slice(0, 120) || '' },
    { label: 'Maximum Height', value: d.workingHeight },
    { label: 'Contract', value: d.contractReference },
    { label: 'Assessed By', value: d.assessor }, { label: 'Reviewed By', value: d.reviewedBy },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 1.0 REGULATORY FRAMEWORK
  children.push(formalBar('1.0', 'REGULATORY FRAMEWORK', p.barBg, p.barNumColor, p.font)); children.push(gap(80));
  const regParas = (d.regulatoryNarrative || d.hierarchy.avoidance || '').split(/\n\n?/).filter(Boolean);
  regParas.forEach((para, i) => {
    children.push(new Paragraph({ spacing: { after: 120 }, children: [
      new TextRun({ text: `1.${i+1} `, bold: true, font: p.font, size: BODY, color: p.accent }),
      new TextRun({ text: para, font: p.font, size: BODY, color: p.dark }),
    ] }));
  }); children.push(gap(200));

  // 2.0 HIERARCHY OF CONTROL
  children.push(formalBar('2.0', 'HIERARCHY OF CONTROL', p.barBg, p.barNumColor, p.font)); children.push(gap(80));
  const stepColors = ['DC2626', 'D97706', '059669', '2563EB'];
  const stepTitles = ['Avoid work at height?', 'Prevent falls \u2014 collective protection?', 'Prevent falls \u2014 personal protection?', 'Mitigate falls \u2014 minimise distance and consequence?'];
  const stepTexts = [d.hierarchy.avoidance, d.hierarchy.prevention, d.hierarchy.mitigation, d.hierarchy.mitigation ? '' : ''];
  [0,1,2,3].forEach(i => {
    const txt = i===0 ? d.hierarchy.avoidance : i===1 ? d.hierarchy.prevention : d.hierarchy.mitigation;
    if (txt) { children.push(hierarchyStep(i+1, stepTitles[i], txt, stepColors[i], p.font, p.dark)); children.push(gap(60)); }
  }); children.push(gap(140));

  // 3.0 HAZARD REGISTER
  children.push(formalBar('3.0', 'HAZARD REGISTER', p.barBg, p.barNumColor, p.font)); children.push(gap(80));
  const hcw = [Math.round(W*0.08), Math.round(W*0.20), Math.round(W*0.10), Math.round(W*0.32), Math.round(W*0.12)];
  hcw.push(W - hcw[0]-hcw[1]-hcw[2]-hcw[3]-hcw[4]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: hcw,
    rows: [
      new TableRow({ children: [hdrCell('#',hcw[0],p.accent,p.font), hdrCell('Hazard',hcw[1],p.accent,p.font), hdrCell('Risk',hcw[2],p.accent,p.font), hdrCell('Control (Reg. Ref.)',hcw[3],p.accent,p.font), hdrCell('Residual',hcw[4],p.accent,p.font), hdrCell('Responsible',hcw[5],p.accent,p.font)] }),
      ...d.hazards.map((hz,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(hz.ref || `H${i+1}`, hcw[0], p.font, p.dark, { shade }),
          dCell(hz.hazard, hcw[1], p.font, p.dark, { shade }),
          ragCell(hz.riskRatingBefore, hcw[2], p.font),
          dCell(hz.controlMeasures, hcw[3], p.font, p.dark, { shade }),
          ragCell(hz.riskRatingAfter, hcw[4], p.font),
          dCell(hz.responsible, hcw[5], p.font, p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 4.0 INSPECTION & REVIEW SCHEDULE
  children.push(formalBar('4.0', 'INSPECTION & REVIEW SCHEDULE', p.barBg, p.barNumColor, p.font)); children.push(gap(80));
  const icw = [Math.round(W*0.30), Math.round(W*0.20), Math.round(W*0.25)]; icw.push(W-icw[0]-icw[1]-icw[2]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: icw,
    rows: [
      new TableRow({ children: [hdrCell('Inspection',icw[0],p.accent,p.font), hdrCell('Frequency',icw[1],p.accent,p.font), hdrCell('By Whom',icw[2],p.accent,p.font), hdrCell('Record',icw[3],p.accent,p.font)] }),
      ...d.inspections.map((ins,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(ins.inspection, icw[0], p.font, p.dark, { shade }), dCell(ins.frequency, icw[1], p.font, p.dark, { shade }),
          dCell(ins.byWhom, icw[2], p.font, p.dark, { shade }), dCell(ins.record, icw[3], p.font, p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  children.push(h.signatureGrid(['Assessed By', 'Reviewed By (H&S)'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Working at Height Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Formal HSE', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — QUICK CHECK (#475569 slate, left-border, pre-task checklist)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: WahData): Document {
  const p = PAL['quick-check'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WAH', 'QUICK CHECK'], `Pre-Task Checklist \u2014 ${d.taskDescription?.split('.')[0] || ''}`, p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
    { label: 'Checked By', value: d.assessor },
    { label: 'Task', value: d.taskDescription?.slice(0, 120) || '' },
    { label: 'Height', value: d.workingHeight },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Header bar
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({ width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: p.accent, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: `WAH QUICK CHECK  |  ${d.documentRef}  |  ${d.assessmentDate}`, bold: true, size: BODY, font: p.font, color: h.WHITE }),
      ] })] })] })] }));
  children.push(gap(120));

  // TASK SUMMARY
  children.push(leftBorderHead('TASK SUMMARY', p.accent, p.font));
  children.push(accentInfoTable(p, [
    { label: 'Task', value: d.taskDescription?.slice(0, 200) || '' },
    { label: 'Height', value: d.workingHeight },
    { label: 'Equipment', value: d.accessMethod },
  ])); children.push(gap(200));

  // KEY HAZARDS & CONTROLS
  children.push(leftBorderHead('KEY HAZARDS & CONTROLS', p.accent, p.font));
  const kcw = [Math.round(W*0.35), Math.round(W*0.55)]; kcw.push(W-kcw[0]-kcw[1]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: kcw,
    rows: [
      new TableRow({ children: [hdrCell('Hazard',kcw[0],p.accent,p.font), hdrCell('Control',kcw[1],p.accent,p.font), hdrCell('OK?',kcw[2],p.accent,p.font)] }),
      ...d.hazards.map((hz,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(hz.hazard, kcw[0], p.font, p.dark, { shade }),
          dCell(hz.controlMeasures, kcw[1], p.font, p.dark, { shade }),
          dCell('\u2713', kcw[2], p.font, '059669', { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // EQUIPMENT CHECK
  children.push(leftBorderHead('EQUIPMENT CHECK', p.accent, p.font));
  const eqcw = [Math.round(W*0.50), Math.round(W*0.15)]; eqcw.push(W-eqcw[0]-eqcw[1]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: eqcw,
    rows: [
      new TableRow({ children: [hdrCell('Item',eqcw[0],p.accent,p.font), hdrCell('Checked',eqcw[1],p.accent,p.font), hdrCell('Notes',eqcw[2],p.accent,p.font)] }),
      ...d.equipment.map((eq,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(eq.item, eqcw[0], p.font, p.dark, { shade }),
          dCell(eq.checked, eqcw[1], p.font, '059669', { shade }),
          dCell(eq.notes, eqcw[2], p.font, p.dark, { shade }),
        ] });
      }),
    ],
  })); children.push(gap(120));

  // Warning banner
  children.push(h.warningBanner('\u26A0 DO NOT ACCESS IF ANY CHECK FAILS \u26A0', 'FEF2F2', '991B1B', W));
  children.push(gap(200));

  children.push(h.signatureGrid(['Checked By', 'Operatives Briefed'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('WAH Quick Check', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Quick Check', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — FULL COMPLIANCE (#065F46 green, 5 sections, rescue plan, competency)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: WahData): Document {
  const p = PAL['full-compliance'];
  const children: (Paragraph | Table)[] = [];
  children.push(h.coverBlock(['WORKING AT HEIGHT', 'FULL COMPLIANCE', 'ASSESSMENT'], 'WAH Regs 2005 \u00B7 Rescue Plan \u00B7 Competency Matrix \u00B7 Emergency Procedures', p.accent, p.subtitleColor));
  children.push(gap(300)); children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
    { label: 'Assessed By', value: d.assessor }, { label: 'Reviewed By', value: d.reviewedBy },
    { label: 'Task', value: d.taskDescription?.slice(0, 120) || '' },
    { label: 'Location', value: d.location }, { label: 'Max Height', value: d.workingHeight },
    { label: 'Risk Level', value: d.riskLevel || 'HIGH' },
  ], p.accent, W));
  children.push(gap(200)); children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 HIERARCHY OF CONTROL
  children.push(h.fullWidthSectionBar('01', 'HIERARCHY OF CONTROL (Regulation 6)', p.accent)); children.push(gap(80));
  const stepColors = ['DC2626', 'D97706', '059669', '2563EB'];
  const stepTitles = ['Avoid (Reg 6(2)):', 'Prevent \u2014 Collective (Reg 6(3)(a), Sched 2):', 'Prevent \u2014 Personal (Reg 6(3)(c)):', 'Mitigate (Reg 6(4)):'];
  const stepTexts = [d.hierarchy.avoidance, d.hierarchy.prevention, d.hierarchy.mitigation, d.hierarchy.mitigation ? 'Exclusion zone, first aid, rescue plan.' : ''];
  stepTexts.forEach((txt, i) => {
    if (txt) { children.push(hierarchyStep(i+1, stepTitles[i], txt, stepColors[i], p.font, p.dark)); children.push(gap(60)); }
  }); children.push(gap(140));

  // 02 RISK MATRIX
  children.push(h.fullWidthSectionBar('02', 'RISK MATRIX', p.accent)); children.push(gap(80));
  const rcw = [Math.round(W*0.20), Math.round(W*0.06), Math.round(W*0.06), Math.round(W*0.08), Math.round(W*0.30), Math.round(W*0.06), Math.round(W*0.06)];
  rcw.push(W - rcw.reduce((a,b)=>a+b,0));
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: rcw,
    rows: [
      new TableRow({ children: [hdrCell('Hazard',rcw[0],p.accent,p.font), hdrCell('L',rcw[1],p.accent,p.font), hdrCell('S',rcw[2],p.accent,p.font), hdrCell('Risk',rcw[3],p.accent,p.font), hdrCell('Control',rcw[4],p.accent,p.font), hdrCell('L',rcw[5],p.accent,p.font), hdrCell('S',rcw[6],p.accent,p.font), hdrCell('Res.',rcw[7],p.accent,p.font)] }),
      ...d.hazards.map((hz,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        const risk = hz.likelihoodBefore * hz.severityBefore;
        const res = hz.likelihoodAfter * hz.severityAfter;
        return new TableRow({ children: [
          dCell(hz.hazard, rcw[0], p.font, p.dark, { shade, bold: true }),
          dCell(String(hz.likelihoodBefore), rcw[1], p.font, p.dark, { shade }),
          dCell(String(hz.severityBefore), rcw[2], p.font, p.dark, { shade }),
          ragCell(String(risk), rcw[3], p.font),
          dCell(hz.controlMeasures, rcw[4], p.font, p.dark, { shade }),
          dCell(String(hz.likelihoodAfter), rcw[5], p.font, p.dark, { shade }),
          dCell(String(hz.severityAfter), rcw[6], p.font, p.dark, { shade }),
          ragCell(String(res), rcw[7], p.font),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 03 RESCUE PLAN
  children.push(h.fullWidthSectionBar('03', 'RESCUE PLAN (Regulation 9)', p.accent)); children.push(gap(80));
  children.push(h.calloutBox('Rescue Scenario: ' + (d.rescuePlan?.split('.')[0] || 'Worker suspended in harness or fallen to lower level.'), 'DC2626', 'FEF2F2', '991B1B', W));
  children.push(gap(80));
  children.push(...proseParas(p, d.rescuePlan)); children.push(gap(200));

  // 04 COMPETENCY MATRIX
  children.push(h.fullWidthSectionBar('04', 'COMPETENCY MATRIX', p.accent)); children.push(gap(80));
  const ccw = [Math.round(W*0.22), Math.round(W*0.18), Math.round(W*0.30), Math.round(W*0.15)]; ccw.push(W-ccw[0]-ccw[1]-ccw[2]-ccw[3]);
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ccw,
    rows: [
      new TableRow({ children: [hdrCell('Person',ccw[0],p.accent,p.font), hdrCell('Role',ccw[1],p.accent,p.font), hdrCell('Qualification',ccw[2],p.accent,p.font), hdrCell('Expiry',ccw[3],p.accent,p.font), hdrCell('Verified',ccw[4],p.accent,p.font)] }),
      ...d.competency.map((cp,i) => {
        const shade = i%2===0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: [
          dCell(cp.person, ccw[0], p.font, p.dark, { shade, bold: true }),
          dCell(cp.role, ccw[1], p.font, p.dark, { shade }),
          dCell(cp.qualification, ccw[2], p.font, p.dark, { shade }),
          dCell(cp.expiry, ccw[3], p.font, p.dark, { shade }),
          dCell(cp.verified, ccw[4], p.font, '059669', { shade }),
        ] });
      }),
    ],
  })); children.push(gap(200));

  // 05 WEATHER RESTRICTIONS
  children.push(h.fullWidthSectionBar('05', 'WEATHER RESTRICTIONS', p.accent)); children.push(gap(80));
  children.push(accentInfoTable(p, d.weatherRestrictions.map(wr => ({ label: wr.condition, value: wr.restriction }))));
  children.push(gap(200));

  // 4-box sig grid
  children.push(h.signatureGrid(['Assessed By', 'H&S Review', 'Scaffold Co. Acceptance', 'Client / PC'], p.accent, W));
  children.push(gap(200)); children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Working at Height Assessment', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Full Compliance', p.accent) }, children }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildWahTemplateDocument(
  content: any,
  templateSlug: WahTemplateSlug,
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'site-ready':      return buildT1(d);
    case 'formal-hse':      return buildT2(d);
    case 'quick-check':     return buildT3(d);
    case 'full-compliance': return buildT4(d);
    default:                return buildT1(d);
  }
}
