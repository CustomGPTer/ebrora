// =============================================================================
// Site Waste Management Plan — Multi-Template Engine
// 3 templates: Full Compliance, Corporate, Site Record
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign, Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition } from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WasteTemplateSlug } from '@/lib/waste/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }
const PALETTES: Record<WasteTemplateSlug, Palette> = {
  'full-compliance': { primary: '0F766E', accent: '0F766E', dark: '1A2E2A', mid: '6B7280', rowAlt: 'F0FDFA', font: 'Arial', bodySize: 20 },
  'corporate':       { primary: '1E3A5F', accent: '1E3A5F', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Cambria', bodySize: 19 },
  'site-record':     { primary: '4D7C0F', accent: '4D7C0F', dark: '365314', mid: '6B7280', rowAlt: 'F7FEE7', font: 'Calibri', bodySize: 20 },
};
type DL = 'full' | 'standard' | 'practical';
const DETAIL: Record<WasteTemplateSlug, DL> = { 'full-compliance': 'full', 'corporate': 'standard', 'site-record': 'practical' };
function show(slug: WasteTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['details', 'streams', 'segregation'];
  const standard = [...always, 'hierarchy', 'carriers', 'facilities', 'monitoring'];
  const full = [...standard, 'cover', 'regulatory', 'targets', 'contaminated', 'transfer-log'];
  if (l === 'full') return full.includes(s); if (l === 'standard') return standard.includes(s); return always.includes(s);
}

function hdrCell(p: Palette, t: string, w: number): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] }); }
function dCell(p: Palette, t: string, w: number, o: { bold?: boolean; shade?: string } = {}): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!o.bold, font: p.font, size: p.bodySize, color: p.dark })] })] }); }
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow { const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF'; return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) }); }
function bodyPara(p: Palette, t: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }
function sectionHead(slug: WasteTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'full-compliance') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'corporate') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}
function buildInfoTable(p: Palette, rows: [string, string][]): Table { return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) }); }
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table { const cw = headers.map(([, w]) => w); return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ children: headers.map(([l, w]) => hdrCell(p, l, w)) }), ...data.map((row, i) => altRow(p, row.map((t, ci) => [t, cw[ci]] as [string, number]), i))] }); }

function buildCover(slug: WasteTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'full-compliance') return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 300, bottom: 300, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'SITE WASTE', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }), new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'MANAGEMENT PLAN', bold: true, font: p.font, size: 36, color: '80CBC4' })] }), new Paragraph({ children: [new TextRun({ text: `${d.projectName || ''}  |  ${d.documentRef || ''}`, font: p.font, size: 20, color: 'B2DFDB' })] })] })] })] }), gap(120), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'EPA 1990 s.34 — Duty of Care', bold: true, font: p.font, size: 18, color: p.accent })] }), gap(150)];
  if (slug === 'corporate') return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 300, bottom: 300, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'WASTE MANAGEMENT PLAN', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }), new Paragraph({ children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'BFDBFE' })] })] })] })] }), gap(150)];
  return [];
}

export async function buildWasteTemplateDocument(content: any, templateSlug: WasteTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug]; const d = content; let sec = 0;
  const children: (Paragraph | Table)[] = [];
  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); }

  children.push(sectionHead(templateSlug, p, ++sec, 'Plan Details'));
  children.push(buildInfoTable(p, [['Document Reference', d.documentRef || ''], ['Date', d.planDate || ''], ['Review Date', d.reviewDate || ''], ['Prepared By', d.preparedBy || ''], ['Project', d.projectName || ''], ['Site Address', d.siteAddress || ''], ['Client', d.client || ''], ['Principal Contractor', d.principalContractor || '']]));
  children.push(gap());

  if (show(templateSlug, 'regulatory') && d.regulatoryContext) { children.push(sectionHead(templateSlug, p, ++sec, 'Regulatory Context')); for (const para of (d.regulatoryContext as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  children.push(sectionHead(templateSlug, p, ++sec, 'Project Overview'));
  for (const para of (d.projectOverview || '').split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
  children.push(gap());

  children.push(sectionHead(templateSlug, p, ++sec, 'Waste Streams'));
  if (d.wasteStreams?.length) {
    const ws = [Math.floor(W*0.16), Math.floor(W*0.10), Math.floor(W*0.12), Math.floor(W*0.12), Math.floor(W*0.16), Math.floor(W*0.16), W - Math.floor(W*0.16) - Math.floor(W*0.10) - Math.floor(W*0.12) - Math.floor(W*0.12) - Math.floor(W*0.16) - Math.floor(W*0.16)];
    children.push(buildDataTable(p, [['Stream', ws[0]], ['EWC', ws[1]], ['Class', ws[2]], ['Volume', ws[3]], ['Source', ws[4]], ['Segregation', ws[5]], ['Route', ws[6]]], d.wasteStreams.map((s: any) => [s.stream || '', s.ewcCode || '', s.classification || '', s.estimatedVolume || '', s.source || '', s.segregationMethod || '', s.disposalRoute || ''])));
  }
  children.push(gap());

  if (show(templateSlug, 'hierarchy') && d.wasteHierarchy) { children.push(sectionHead(templateSlug, p, ++sec, 'Waste Hierarchy')); for (const para of (d.wasteHierarchy as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  children.push(sectionHead(templateSlug, p, ++sec, 'Segregation Plan'));
  for (const para of (d.segregationPlan || '').split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
  children.push(gap());

  children.push(new Paragraph({ children: [new PageBreak()] }));

  if (show(templateSlug, 'carriers') && d.carrierRegister?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Carrier Register'));
    const cw = [Math.floor(W*0.28), Math.floor(W*0.24), Math.floor(W*0.28), W - Math.floor(W*0.28) - Math.floor(W*0.24) - Math.floor(W*0.28)];
    children.push(buildDataTable(p, [['Carrier', cw[0]], ['Licence No.', cw[1]], ['Waste Types', cw[2]], ['Expiry', cw[3]]], d.carrierRegister.map((c: any) => [c.carrier || '', c.licenceNumber || '', c.wasteTypes || '', c.expiryDate || ''])));
    children.push(gap());
  }

  if (show(templateSlug, 'facilities') && d.facilityRegister?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Facility Register'));
    const fw = [Math.floor(W*0.26), Math.floor(W*0.22), Math.floor(W*0.26), W - Math.floor(W*0.26) - Math.floor(W*0.22) - Math.floor(W*0.26)];
    children.push(buildDataTable(p, [['Facility', fw[0]], ['Permit No.', fw[1]], ['Waste Types', fw[2]], ['Location', fw[3]]], d.facilityRegister.map((f: any) => [f.facility || '', f.permitNumber || '', f.wasteTypes || '', f.location || ''])));
    children.push(gap());
  }

  if (show(templateSlug, 'transfer-log') && d.transferNoteLog) { children.push(sectionHead(templateSlug, p, ++sec, 'Transfer Note Log')); for (const para of (d.transferNoteLog as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'targets') && d.minimisationTargets?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Waste Minimisation Targets'));
    const tw = [Math.floor(W*0.35), Math.floor(W*0.40), W - Math.floor(W*0.35) - Math.floor(W*0.40)];
    children.push(buildDataTable(p, [['Target', tw[0]], ['Measure', tw[1]], ['KPI', tw[2]]], d.minimisationTargets.map((t: any) => [t.target || '', t.measure || '', t.kpi || ''])));
    children.push(gap());
  }
  if (show(templateSlug, 'contaminated') && d.contaminatedLand) { children.push(sectionHead(templateSlug, p, ++sec, 'Contaminated Land')); children.push(bodyPara(p, d.contaminatedLand)); children.push(gap()); }
  if (show(templateSlug, 'monitoring') && d.monitoringSchedule) { children.push(sectionHead(templateSlug, p, ++sec, 'Monitoring & Reporting')); for (const para of (d.monitoringSchedule as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Waste Management Plan —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));

  const hdr = new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'SITE WASTE MANAGEMENT PLAN', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  const ftr = new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'EPA 1990 s.34 Compliant', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  return new Document({ styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } }, sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: hdr }, footers: { default: ftr }, children }] });
}
