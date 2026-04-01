// =============================================================================
// Invasive Species Management Plan — Multi-Template Engine
// 3 templates: Ecological Report, Site Management, Briefing Note
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign, Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition } from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { InvasiveTemplateSlug } from '@/lib/invasive/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }
const PALETTES: Record<InvasiveTemplateSlug, Palette> = {
  'ecological-report': { primary: '166534', accent: '166534', dark: '14532D', mid: '6B7280', rowAlt: 'F0FDF4', font: 'Arial', bodySize: 20 },
  'site-management':   { primary: '0D9488', accent: '0D9488', dark: '134E4A', mid: '64748B', rowAlt: 'F0FDFA', font: 'Calibri', bodySize: 20 },
  'briefing-note':     { primary: '475569', accent: '475569', dark: '334155', mid: '94A3B8', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 20 },
};
type DL = 'full' | 'standard' | 'light';
const DETAIL: Record<InvasiveTemplateSlug, DL> = { 'ecological-report': 'full', 'site-management': 'standard', 'briefing-note': 'light' };
function show(slug: InvasiveTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['species', 'extent', 'treatment', 'disposal'];
  const standard = [...always, 'biosecurity', 'exclusion', 'monitoring', 'briefing'];
  const full = [...standard, 'cover', 'legal', 'planning', 'completion', 'ecologist'];
  if (l === 'full') return full.includes(s); if (l === 'standard') return standard.includes(s); return always.includes(s);
}

function hdrCell(p: Palette, t: string, w: number): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] }); }
function dCell(p: Palette, t: string, w: number, o: { bold?: boolean; shade?: string } = {}): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!o.bold, font: p.font, size: p.bodySize, color: p.dark })] })] }); }
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow { const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF'; return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) }); }
function bodyPara(p: Palette, t: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }
function sectionHead(slug: InvasiveTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'ecological-report') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'site-management') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}
function buildInfoTable(p: Palette, rows: [string, string][]): Table { return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) }); }
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table { const cw = headers.map(([, w]) => w); return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ children: headers.map(([l, w]) => hdrCell(p, l, w)) }), ...data.map((row, i) => altRow(p, row.map((t, ci) => [t, cw[ci]] as [string, number]), i))] }); }
function buildBulletList(p: Palette, items: string[]): Paragraph[] { return (items || []).map(item => new Paragraph({ spacing: { after: 60 }, indent: { left: 280 }, children: [new TextRun({ text: '•  ', font: p.font, size: p.bodySize, color: p.accent }), new TextRun({ text: item, font: p.font, size: p.bodySize, color: p.dark })] })); }

function buildCover(slug: InvasiveTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'ecological-report') return [gap(200), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 500, bottom: 500, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'INVASIVE SPECIES', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }), new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'MANAGEMENT PLAN', bold: true, font: p.font, size: 36, color: '86EFAC' })] }), new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${d.speciesIdentification?.commonName || ''} (${d.speciesIdentification?.latinName || ''})`, font: p.font, size: 22, color: 'BBF7D0' })] }), new Paragraph({ children: [new TextRun({ text: `${d.projectName || ''}  |  ${d.documentRef || ''}`, font: p.font, size: 20, color: 'BBF7D0' })] })] })] })] }), gap(120), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Wildlife & Countryside Act 1981', bold: true, font: p.font, size: 18, color: p.accent })] }), gap(300)];
  if (slug === 'site-management') return [gap(400), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'INVASIVE SPECIES PLAN', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }), new Paragraph({ children: [new TextRun({ text: `${d.speciesIdentification?.commonName || ''} — ${d.projectName || ''}`, font: p.font, size: 22, color: 'A7F3D0' })] })] })] })] }), gap(300)];
  return [];
}

export async function buildInvasiveTemplateDocument(content: any, templateSlug: InvasiveTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug]; const d = content; let sec = 0;
  const children: (Paragraph | Table)[] = [];
  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); children.push(new Paragraph({ children: [new PageBreak()] })); }

  children.push(sectionHead(templateSlug, p, ++sec, 'Document Details'));
  children.push(buildInfoTable(p, [['Document Reference', d.documentRef || ''], ['Date', d.planDate || ''], ['Review Date', d.reviewDate || ''], ['Prepared By', d.preparedBy || ''], ...(show(templateSlug, 'ecologist') ? [['Ecologist', d.ecologist || ''] as [string, string]] : []), ['Project', d.projectName || ''], ['Site Address', d.siteAddress || ''], ['Client', d.client || '']]));
  children.push(gap());

  // Species identification
  children.push(sectionHead(templateSlug, p, ++sec, 'Species Identification'));
  const sp = d.speciesIdentification || {};
  children.push(buildInfoTable(p, [['Common Name', sp.commonName || ''], ['Latin Name', sp.latinName || ''], ['Schedule', sp.schedule || ''], ['Photographic Record', sp.photographicRecord || '']]));
  if (sp.identificationFeatures) { children.push(gap(80)); for (const para of (sp.identificationFeatures as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); }
  children.push(gap());

  // Extent
  children.push(sectionHead(templateSlug, p, ++sec, 'Infestation Extent'));
  const ext = d.infestationExtent || {};
  children.push(buildInfoTable(p, [['Area', ext.area || ''], ['Density', ext.density || ''], ['Maturity', ext.maturity || ''], ['Rhizome Spread', ext.rhizomeSpread || ''], ['Location on Site', ext.locationOnSite || ''], ['Nearest Watercourse', ext.proximityToWatercourse || ''], ['Nearest Boundary', ext.proximityToBoundary || '']]));
  children.push(gap());

  // Legal framework (full only)
  if (show(templateSlug, 'legal') && d.legalFramework) { children.push(sectionHead(templateSlug, p, ++sec, 'Legal Framework')); for (const para of (d.legalFramework as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'planning') && d.planningConditions) { children.push(sectionHead(templateSlug, p, ++sec, 'Planning Conditions')); children.push(bodyPara(p, d.planningConditions)); children.push(gap()); }

  // Treatment
  children.push(sectionHead(templateSlug, p, ++sec, 'Treatment Methodology'));
  const tr = d.treatmentMethodology || {};
  children.push(buildInfoTable(p, [['Method', tr.method || ''], ['Programme', tr.programme || ''], ['Contractor', tr.contractor || '']]));
  if (tr.methodology) { children.push(gap(80)); for (const para of (tr.methodology as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); }
  children.push(gap());

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Biosecurity
  if (show(templateSlug, 'biosecurity') && d.biosecurityProtocol) { children.push(sectionHead(templateSlug, p, ++sec, 'Biosecurity Protocol')); for (const para of (d.biosecurityProtocol as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  // Disposal
  children.push(sectionHead(templateSlug, p, ++sec, 'Disposal Route'));
  const disp = d.disposalRoute || {};
  children.push(buildInfoTable(p, [['Method', disp.method || ''], ['Facility', disp.facility || ''], ['Waste Classification', disp.wasteClassification || ''], ['Transfer Notes', disp.transferNotes || '']]));
  children.push(gap());

  // Exclusion zone
  if (show(templateSlug, 'exclusion') && d.exclusionZone) { children.push(sectionHead(templateSlug, p, ++sec, 'Exclusion Zone')); for (const para of (d.exclusionZone as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  // Monitoring
  if (show(templateSlug, 'monitoring') && d.monitoringSchedule?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Monitoring Schedule'));
    const mw = [Math.floor(W*0.20), Math.floor(W*0.30), W - Math.floor(W*0.20) - Math.floor(W*0.30)];
    children.push(buildDataTable(p, [['Visit', mw[0]], ['Date', mw[1]], ['Purpose', mw[2]]], d.monitoringSchedule.map((m: any) => [m.visit || '', m.date || '', m.purpose || ''])));
    children.push(gap());
  }

  // Completion criteria
  if (show(templateSlug, 'completion') && d.completionCriteria) { children.push(sectionHead(templateSlug, p, ++sec, 'Completion Criteria')); for (const para of (d.completionCriteria as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  // Operative briefing
  if (show(templateSlug, 'briefing') && d.operativeBriefing) { children.push(sectionHead(templateSlug, p, ++sec, 'Operative Briefing')); for (const para of (d.operativeBriefing as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Invasive Species Management Plan —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  const hdr = new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'INVASIVE SPECIES MANAGEMENT PLAN', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  const ftr = new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'Wildlife & Countryside Act 1981', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  return new Document({ styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } }, sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: hdr }, footers: { default: ftr }, children }] });
}
