// =============================================================================
// Working at Height Assessment — Multi-Template Engine
// 4 templates: Full Compliance, Formal HSE, Site-Ready, Quick Check
// Compliant with Work at Height Regulations 2005
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WahTemplateSlug } from '@/lib/wah/types';

const W = h.A4_CONTENT_WIDTH;
// Generous padding for premium feel
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; primaryLight: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }

const PALETTES: Record<WahTemplateSlug, Palette> = {
  'full-compliance': { primary: '065F46', primaryLight: 'E8F4F0', accent: '065F46', dark: '1A2E2A', mid: '6B7280', rowAlt: 'F2F2F2', font: 'Arial', bodySize: 20 },
  'formal-hse':      { primary: '2D2D2D', primaryLight: 'FEF3C7', accent: 'B45309', dark: '333333', mid: '666666', rowAlt: 'FFFBEB', font: 'Cambria', bodySize: 19 },
  'site-ready':      { primary: '1E40AF', primaryLight: 'EFF6FF', accent: '1E40AF', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Calibri', bodySize: 20 },
  'quick-check':     { primary: '475569', primaryLight: 'F8FAFC', accent: '475569', dark: '334155', mid: '94A3B8', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 20 },
};

type DetailLevel = 'full' | 'detailed' | 'standard' | 'light';
const DETAIL: Record<WahTemplateSlug, DetailLevel> = { 'full-compliance': 'full', 'formal-hse': 'detailed', 'site-ready': 'standard', 'quick-check': 'light' };

function show(slug: WahTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['task', 'hazards', 'controls', 'sign-off'];
  const standard = [...always, 'equipment', 'hierarchy', 'weather'];
  const detailed = [...standard, 'competency', 'emergency'];
  const full = [...detailed, 'rescue', 'cover', 'summary'];
  if (l === 'full') return full.includes(s);
  if (l === 'detailed') return detailed.includes(s);
  if (l === 'standard') return standard.includes(s);
  return always.includes(s);
}

// ── Shared helpers ───────────────────────────────────────────
function hdrCell(p: Palette, text: string, width: number): TableCell {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] });
}
function dCell(p: Palette, text: string, width: number, opts: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: !!opts.bold, font: p.font, size: p.bodySize, color: p.dark })] })] });
}
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow {
  const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF';
  return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) });
}
function bodyPara(p: Palette, text: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(size = 200): Paragraph { return new Paragraph({ spacing: { after: size }, children: [] }); }

function sectionHead(slug: WahTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'full-compliance') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'formal-hse') return new Paragraph({ spacing: { before: 400, after: 140 }, children: [new TextRun({ text: `${num}.  `, bold: true, font: p.font, size: 24, color: p.accent }), new TextRun({ text: title.toUpperCase(), bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'site-ready') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}

function buildInfoTable(p: Palette, rows: [string, string][]): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) });
}
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table {
  const cw = headers.map(([, w]) => w);
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ children: headers.map(([l, w]) => hdrCell(p, l, w)) }), ...data.map((row, i) => altRow(p, row.map((t, ci) => [t, cw[ci]] as [string, number]), i))] });
}
function buildBulletList(p: Palette, items: string[]): Paragraph[] {
  return (items || []).map(item => new Paragraph({ spacing: { after: 60 }, indent: { left: 280 }, children: [new TextRun({ text: '•  ', font: p.font, size: p.bodySize, color: p.accent }), new TextRun({ text: item, font: p.font, size: p.bodySize, color: p.dark })] }));
}

// ── Cover ─────────────────────────────────────────────────────
function buildCover(slug: WahTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'full-compliance') return [
    gap(200),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 500, bottom: 500, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'WORKING AT HEIGHT', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'RISK ASSESSMENT', bold: true, font: p.font, size: 36, color: 'A7F3D0' })] }),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'D1FAE5' })] }),
      new Paragraph({ children: [new TextRun({ text: `Ref: ${d.documentRef || ''}  |  ${d.assessmentDate || ''}`, font: p.font, size: 20, color: 'D1FAE5' })] }),
    ] })] })] }),
    gap(120),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Work at Height Regulations 2005', bold: true, font: p.font, size: 18, color: p.accent })] }),
    gap(300),
  ];
  if (slug === 'formal-hse') return [
    gap(600),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'WORKING AT HEIGHT ASSESSMENT', bold: true, font: p.font, size: 48, color: p.primary })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 8 } }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 28, color: p.dark })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `${d.documentRef || ''}  |  ${d.assessmentDate || ''}`, font: p.font, size: 20, color: p.mid })] }),
    gap(300),
  ];
  if (slug === 'site-ready') return [
    gap(400),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'WAH ASSESSMENT', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }),
      new Paragraph({ children: [new TextRun({ text: `${d.projectName || ''}`, font: p.font, size: 22, color: 'BFDBFE' })] }),
    ] })] })] }),
    gap(300),
  ];
  return []; // quick-check: no cover
}

function makeHeader(slug: WahTemplateSlug, p: Palette, d: any): Header {
  return new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'WORKING AT HEIGHT ASSESSMENT', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}
function makeFooter(p: Palette): Footer {
  return new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'WAH Regs 2005 Compliant', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}

// =================================================================
// MAIN BUILD
// =================================================================
export async function buildWahTemplateDocument(content: any, templateSlug: WahTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug];
  const d = content;
  let sec = 0;
  const children: (Paragraph | Table)[] = [];

  // Cover
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

  // Task description
  children.push(sectionHead(templateSlug, p, ++sec, 'Task Description'));
  children.push(buildInfoTable(p, [
    ['Working Height', d.workingHeight || ''], ['Access Method', d.accessMethod || ''],
    ['Location', d.location || ''], ['Duration', d.duration || ''], ['Frequency', d.frequency || ''],
  ]));
  children.push(gap(80));
  for (const para of (d.taskDescription || '').split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
  children.push(gap());

  // Hierarchy of control
  if (show(templateSlug, 'hierarchy') && d.hierarchyOfControl) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Hierarchy of Control (WAH Regs 2005 Reg 6)'));
    children.push(buildInfoTable(p, [['Access Justification', d.accessJustification || '']]));
    children.push(gap(80));
    const hoc = d.hierarchyOfControl;
    if (hoc.avoidance) { children.push(bodyPara(p, `AVOID — ${hoc.avoidance}`)); }
    if (hoc.prevention) { children.push(bodyPara(p, `PREVENT — ${hoc.prevention}`)); }
    if (hoc.mitigation) { children.push(bodyPara(p, `MITIGATE — ${hoc.mitigation}`)); }
    children.push(gap());
  }

  // Hazard identification & risk matrix
  children.push(sectionHead(templateSlug, p, ++sec, 'Hazard Identification & Risk Assessment'));
  const hazards = d.hazards || [];
  if (hazards.length > 0) {
    const rW = Math.floor(W * 0.05); const hW = Math.floor(W * 0.18); const wW = Math.floor(W * 0.10);
    const lW = Math.floor(W * 0.06); const sW = Math.floor(W * 0.06); const rrW = Math.floor(W * 0.06);
    const cW = Math.floor(W * 0.25); const laW = Math.floor(W * 0.06); const saW = Math.floor(W * 0.06);
    const raW = W - rW - hW - wW - lW - sW - rrW - cW - laW - saW;
    children.push(buildDataTable(p,
      [['#', rW], ['Hazard', hW], ['Who', wW], ['L', lW], ['S', sW], ['R', rrW], ['Controls', cW], ['L', laW], ['S', saW], ['R', raW]],
      hazards.map((hz: any) => [hz.ref || '', hz.hazard || '', hz.whoAtRisk || '', String(hz.likelihoodBefore ?? ''), String(hz.severityBefore ?? ''), hz.riskRatingBefore || '', hz.controlMeasures || '', String(hz.likelihoodAfter ?? ''), String(hz.severityAfter ?? ''), hz.riskRatingAfter || '']),
    ));
  }
  children.push(gap());

  // Equipment
  if (show(templateSlug, 'equipment') && d.equipmentRequired?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Equipment Required'));
    const eqW1 = Math.floor(W * 0.30); const eqW2 = Math.floor(W * 0.40); const eqW3 = W - eqW1 - eqW2;
    children.push(buildDataTable(p, [['Item', eqW1], ['Specification', eqW2], ['Inspection', eqW3]], d.equipmentRequired.map((eq: any) => [eq.item || '', eq.specification || '', eq.inspectionRequired || ''])));
    children.push(gap());
  }

  // Rescue plan
  if (show(templateSlug, 'rescue') && d.rescuePlan) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHead(templateSlug, p, ++sec, 'Rescue Plan (WAH Regs 2005 Reg 9)'));
    for (const para of (d.rescuePlan as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Competency
  if (show(templateSlug, 'competency') && d.competencyRequirements?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Competency Requirements'));
    const cpW1 = Math.floor(W * 0.25); const cpW2 = Math.floor(W * 0.45); const cpW3 = W - cpW1 - cpW2;
    children.push(buildDataTable(p, [['Role', cpW1], ['Qualification', cpW2], ['Verified', cpW3]], d.competencyRequirements.map((c: any) => [c.role || '', c.qualification || '', c.verified || ''])));
    children.push(gap());
  }

  // Weather
  if (show(templateSlug, 'weather') && d.weatherRestrictions) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Weather Restrictions'));
    for (const para of (d.weatherRestrictions as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Emergency
  if (show(templateSlug, 'emergency') && d.emergencyProcedures) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Emergency Procedures'));
    for (const para of (d.emergencyProcedures as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Sign-off
  children.push(sectionHead(templateSlug, p, ++sec, 'Assessment Sign-Off'));
  const sigCw = [2200, 3200, 1800, W - 7200];
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: sigCw, rows: [
    new TableRow({ children: [hdrCell(p, 'Role', sigCw[0]), hdrCell(p, 'Name', sigCw[1]), hdrCell(p, 'Signature', sigCw[2]), hdrCell(p, 'Date', sigCw[3])] }),
    ...(d.signOff || [{ role: 'Assessor', name: d.assessor || '' }]).map((s: any, i: number) => altRow(p, [[s.role || '', sigCw[0], { bold: true }], [s.name || '', sigCw[1]], ['', sigCw[2]], ['', sigCw[3]]], i)),
  ] }));

  // Footer
  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Assessment —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } },
    sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: makeHeader(templateSlug, p, d) }, footers: { default: makeFooter(p) }, children }],
  });
}
