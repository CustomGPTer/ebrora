// =============================================================================
// Whole Body Vibration Assessment — Multi-Template Engine
// 3 templates: Professional, Compliance, Site Practical
// Compliant with Control of Vibration at Work Regulations 2005
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WbvTemplateSlug } from '@/lib/wbv/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; primaryLight: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }

const PALETTES: Record<WbvTemplateSlug, Palette> = {
  'professional':   { primary: '0F766E', primaryLight: 'E0F2F1', accent: '0F766E', dark: '1A2E2A', mid: '6B7280', rowAlt: 'F0FDFA', font: 'Arial', bodySize: 20 },
  'compliance':     { primary: '1E3A5F', primaryLight: 'EFF6FF', accent: '1E3A5F', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Cambria', bodySize: 19 },
  'site-practical': { primary: '4D7C0F', primaryLight: 'F7FEE7', accent: '4D7C0F', dark: '365314', mid: '6B7280', rowAlt: 'F7FEE7', font: 'Calibri', bodySize: 20 },
};

type DetailLevel = 'full' | 'standard' | 'practical';
const DETAIL: Record<WbvTemplateSlug, DetailLevel> = { 'professional': 'full', 'compliance': 'standard', 'site-practical': 'practical' };

function show(slug: WbvTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['details', 'equipment', 'exposure', 'controls'];
  const standard = [...always, 'regulatory', 'health-surv', 'action-plan'];
  const full = [...standard, 'cover', 'operatives', 'monitoring', 'narrative'];
  if (l === 'full') return full.includes(s);
  if (l === 'standard') return standard.includes(s);
  return always.includes(s);
}

function hdrCell(p: Palette, text: string, width: number): TableCell {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] });
}
function dCell(p: Palette, text: string, width: number, opts: { bold?: boolean; shade?: string } = {}): TableCell {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.bold, font: p.font, size: p.bodySize, color: p.dark })] })] });
}
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow {
  const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF';
  return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) });
}
function bodyPara(p: Palette, text: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(size = 200): Paragraph { return new Paragraph({ spacing: { after: size }, children: [] }); }

function sectionHead(slug: WbvTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'professional') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'compliance') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}

function buildInfoTable(p: Palette, rows: [string, string][]): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) });
}
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table {
  const cw = headers.map(([, w]) => w);
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ children: headers.map(([l, w]) => hdrCell(p, l, w)) }), ...data.map((row, i) => altRow(p, row.map((t, ci) => [t, cw[ci]] as [string, number]), i))] });
}

function buildCover(slug: WbvTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'professional') return [
    gap(200),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 500, bottom: 500, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'WHOLE BODY VIBRATION', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'ASSESSMENT', bold: true, font: p.font, size: 36, color: '80CBC4' })] }),
      new Paragraph({ children: [new TextRun({ text: `${d.projectName || ''}  |  ${d.documentRef || ''}`, font: p.font, size: 20, color: 'B2DFDB' })] }),
    ] })] })] }),
    gap(120),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Control of Vibration at Work Regulations 2005', bold: true, font: p.font, size: 18, color: p.accent })] }),
    gap(300),
  ];
  if (slug === 'compliance') return [
    gap(400),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'WBV ASSESSMENT', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }),
      new Paragraph({ children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'BFDBFE' })] }),
    ] })] })] }),
    gap(300),
  ];
  return []; // site-practical: no cover
}

function makeHeader(p: Palette, d: any): Header {
  return new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'WBV ASSESSMENT', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}
function makeFooter(p: Palette): Footer {
  return new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'Vibration Regs 2005 Compliant', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}

// =================================================================
export async function buildWbvTemplateDocument(content: any, templateSlug: WbvTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug];
  const d = content;
  let sec = 0;
  const children: (Paragraph | Table)[] = [];

  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); children.push(new Paragraph({ children: [new PageBreak()] })); }

  // Assessment details
  children.push(sectionHead(templateSlug, p, ++sec, 'Assessment Details'));
  children.push(buildInfoTable(p, [
    ['Document Reference', d.documentRef || ''], ['Assessment Date', d.assessmentDate || ''],
    ['Review Date', d.reviewDate || ''], ['Assessor', d.assessor || ''],
    ['Project Name', d.projectName || ''], ['Site Address', d.siteAddress || ''],
    ['Client', d.client || ''], ['Principal Contractor', d.principalContractor || ''],
  ]));
  children.push(gap());

  // Regulatory context
  if (show(templateSlug, 'regulatory') && d.regulatoryContext) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Regulatory Context'));
    for (const para of (d.regulatoryContext as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Scope
  if (show(templateSlug, 'narrative') && d.assessmentScope) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Assessment Scope'));
    for (const para of (d.assessmentScope as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Operatives
  if (show(templateSlug, 'operatives') && d.operatives?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Operatives Assessed'));
    const opW1 = Math.floor(W * 0.30); const opW2 = Math.floor(W * 0.40); const opW3 = W - opW1 - opW2;
    children.push(buildDataTable(p, [['Name', opW1], ['Role', opW2], ['Experience (yrs)', opW3]], d.operatives.map((op: any) => [op.name || '', op.role || '', String(op.experienceYears ?? '')])));
    children.push(gap());
  }

  // Equipment assessments — the core table
  children.push(sectionHead(templateSlug, p, ++sec, 'Equipment Vibration Assessment'));
  const eqs = d.equipmentAssessments || [];
  if (eqs.length > 0) {
    const w1 = Math.floor(W * 0.14); const w2 = Math.floor(W * 0.16); const w3 = Math.floor(W * 0.10);
    const w4 = Math.floor(W * 0.10); const w5 = Math.floor(W * 0.10); const w6 = Math.floor(W * 0.10);
    const w7 = Math.floor(W * 0.08); const w8 = Math.floor(W * 0.08); const w9 = W - w1 - w2 - w3 - w4 - w5 - w6 - w7 - w8;
    children.push(buildDataTable(p,
      [['Machine', w1], ['Make/Model', w2], ['Seat', w3], ['Mag (m/s²)', w4], ['Hrs/Day', w5], ['A(8)', w6], ['EAV?', w7], ['ELV?', w8], ['Risk', w9]],
      eqs.map((eq: any) => [eq.machineType || '', eq.makeModel || '', eq.seatType || '', String(eq.vibrationMagnitude ?? ''), String(eq.dailyExposureHours ?? ''), String(eq.a8Calculation ?? ''), eq.eavExceeded ? 'YES' : 'No', eq.elvExceeded ? 'YES' : 'No', eq.riskRating || '']),
    ));
  }
  children.push(gap());

  // Exposure summary
  if (d.exposureSummary) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Exposure Summary'));
    children.push(buildInfoTable(p, [['Exposure Action Value (EAV)', '0.5 m/s² A(8)'], ['Exposure Limit Value (ELV)', '1.15 m/s² A(8)']]));
    children.push(gap(80));
    for (const para of (d.exposureSummary as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Control measures
  children.push(sectionHead(templateSlug, p, ++sec, 'Control Measures'));
  if (d.controlMeasures?.length) {
    const cmW1 = Math.floor(W * 0.08); const cmW2 = Math.floor(W * 0.50); const cmW3 = Math.floor(W * 0.22); const cmW4 = W - cmW1 - cmW2 - cmW3;
    children.push(buildDataTable(p, [['Ref', cmW1], ['Measure', cmW2], ['Responsibility', cmW3], ['Target', cmW4]], d.controlMeasures.map((cm: any) => [cm.ref || '', cm.measure || '', cm.responsibility || '', cm.targetDate || ''])));
  }
  if (d.controlNarrative) { children.push(gap(80)); for (const para of (d.controlNarrative as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); }
  children.push(gap());

  // Health surveillance
  if (show(templateSlug, 'health-surv') && d.healthSurveillance) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHead(templateSlug, p, ++sec, 'Health Surveillance'));
    for (const para of (d.healthSurveillance as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Action plan
  if (show(templateSlug, 'action-plan') && d.actionPlan?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Action Plan'));
    const apW1 = Math.floor(W * 0.40); const apW2 = Math.floor(W * 0.12); const apW3 = Math.floor(W * 0.24); const apW4 = W - apW1 - apW2 - apW3;
    children.push(buildDataTable(p, [['Action', apW1], ['Priority', apW2], ['Responsible', apW3], ['Target', apW4]], d.actionPlan.map((a: any) => [a.action || '', a.priority || '', a.responsible || '', a.targetDate || ''])));
    children.push(gap());
  }

  // Monitoring
  if (show(templateSlug, 'monitoring') && d.monitoringArrangements) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Monitoring Arrangements'));
    for (const para of (d.monitoringArrangements as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // End
  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Assessment —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } },
    sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: makeHeader(p, d) }, footers: { default: makeFooter(p) }, children }],
  });
}
