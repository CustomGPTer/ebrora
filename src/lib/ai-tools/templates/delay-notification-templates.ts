// =============================================================================
// DELAY NOTIFICATION — Multi-Template Engine (3 templates: Formal, Corporate, Concise)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { DelayTemplateSlug } from '@/lib/delay/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }
const PALETTES: Record<DelayTemplateSlug, Palette> = {
  'formal-letter': { primary: '991B1B', accent: '991B1B', dark: '1F2937', mid: '6B7280', rowAlt: 'FEF2F2', font: 'Arial', bodySize: 20 },
  'corporate': { primary: '1E3A5F', accent: '1E3A5F', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Cambria', bodySize: 19 },
  'concise': { primary: '475569', accent: '475569', dark: '334155', mid: '94A3B8', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 20 },
};

function hdrCell(p: Palette, t: string, w: number): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] }); }
function dCell(p: Palette, t: string, w: number, o: { bold?: boolean; shade?: string } = {}): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!o.bold, font: p.font, size: p.bodySize, color: p.dark })] })] }); }
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow { const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF'; return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) }); }
function bodyPara(p: Palette, t: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }

function sectionHead(slug: DelayTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'formal-letter') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'corporate') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}

function buildInfoTable(p: Palette, rows: [string, string][]): Table { return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) }); }
function buildBulletList(p: Palette, items: string[]): Paragraph[] { return (items || []).map(item => new Paragraph({ spacing: { after: 60 }, indent: { left: 280 }, children: [new TextRun({ text: '•  ', font: p.font, size: p.bodySize, color: p.accent }), new TextRun({ text: item, font: p.font, size: p.bodySize, color: p.dark })] })); }

function buildCover(slug: DelayTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'formal-letter') return [gap(200), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'DELAY NOTIFICATION', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }), new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d2.projectName || '', font: p.font, size: 22, color: 'D1FAE5' })] }), new Paragraph({ children: [new TextRun({ text: `${d2.documentRef || ''}  |  ${d2.notificationDate || d2.confirmationDate || d2.rfiDate || d2.noticeDate || ''}`, font: p.font, size: 20, color: 'D1FAE5' })] })] })] })] }), gap(300)];
  if (slug === 'corporate') return [gap(400), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 350, bottom: 350, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'DELAY NOTIFICATION', bold: true, font: p.font, size: 40, color: 'FFFFFF' })] }), new Paragraph({ children: [new TextRun({ text: d2.projectName || '', font: p.font, size: 22, color: 'BFDBFE' })] })] })] })] }), gap(300)];
  return [];
}

export async function buildDelayTemplateDocument(content: any, templateSlug: DelayTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug]; const d = content;
  const n: any = { ...d };
  n.addressee = d.toParty || d.addressee || '';
  n.contractRef = d.contractReference || d.contractRef || '';
  n.notificationDate = d.letterDate || d.notificationDate || '';
  n.delayEvent = d.eventDescription || d.delayEvent || '';
  n.contractualBasis = d.contractualEntitlement || d.contractualBasis || '';
  n.programmeImpact = d.programmeImpact || '';
  n.mitigationMeasures = d.mitigationMeasures || '';
  n.costEntitlement = typeof d.costEntitlement === 'object' ? d.costNarrative || '' : d.costEntitlement || d.costNarrative || '';
  n.priorNotices = d.relatedNotices || d.priorNotices || '';
  n.requiredActions = d.requestedResponse || d.requiredActions || '';
  n.preparedBy = d.fromParty || d.preparedBy || '';
  n.siteAddress = d.projectAddress || d.siteAddress || '';
  n.contractForm = d.contractForm || '';
  const d2 = n;

  const children: (Paragraph | Table)[] = [];
  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); children.push(new Paragraph({ children: [new PageBreak()] })); }

  children.push(sectionHead(templateSlug, p, 1, 'Notice Details'));
  children.push(buildInfoTable(p, [['Document Reference', d2.documentRef || ''], ['Date', d2.notificationDate || ''], ['Contract Form', d2.contractForm || ''], ['Contract Reference', d2.contractRef || ''], ['Project', d2.projectName || ''], ['Site Address', d2.siteAddress || ''], ['Addressed To', d2.addressee || '']]));
  children.push(gap());
  if (d2.delayEvent) {
    children.push(sectionHead(templateSlug, p, 2, 'Delay Event'));
    for (const para of (d2.delayEvent as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.contractualBasis) {
    children.push(sectionHead(templateSlug, p, 3, 'Contractual Basis'));
    for (const para of (d2.contractualBasis as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.programmeImpact) {
    children.push(sectionHead(templateSlug, p, 4, 'Programme Impact'));
    for (const para of (d2.programmeImpact as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.mitigationMeasures) {
    children.push(sectionHead(templateSlug, p, 5, 'Mitigation Measures'));
    for (const para of (d2.mitigationMeasures as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.costEntitlement) {
    children.push(sectionHead(templateSlug, p, 6, 'Cost Entitlement'));
    for (const para of (d2.costEntitlement as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.priorNotices) {
    children.push(sectionHead(templateSlug, p, 7, 'Prior Notices & Early Warnings'));
    for (const para of (d2.priorNotices as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }
  if (d2.requiredActions) {
    children.push(sectionHead(templateSlug, p, 8, 'Required Actions'));
    for (const para of (d2.requiredActions as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Signature block
  children.push(gap(200));
  const sigCw = [2200, 3200, 1800, W - 7200];
  children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: sigCw, rows: [
    new TableRow({ children: [hdrCell(p, 'Role', sigCw[0]), hdrCell(p, 'Name', sigCw[1]), hdrCell(p, 'Signature', sigCw[2]), hdrCell(p, 'Date', sigCw[3])] }),
    altRow(p, [['Prepared By', sigCw[0], { bold: true }], [d2.preparedBy || d2.raisedBy || '', sigCw[1]], ['', sigCw[2]], ['', sigCw[3]]], 0),
  ] }));

  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Document —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  const hdr = new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'DELAY NOTIFICATION', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d2.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  const ftr = new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'Contractual Notice', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  return new Document({ styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } }, sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: hdr }, footers: { default: ftr }, children }] });
}
