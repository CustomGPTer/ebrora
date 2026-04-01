// =============================================================================
// Traffic Management Plan — Multi-Template Engine
// 4 templates: Full Chapter 8, Formal Highways, Site Plan, Quick Brief
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { TrafficTemplateSlug } from '@/lib/traffic/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }
const PALETTES: Record<TrafficTemplateSlug, Palette> = {
  'full-chapter8':    { primary: '065F46', accent: '065F46', dark: '1A2E2A', mid: '6B7280', rowAlt: 'F2F2F2', font: 'Arial', bodySize: 20 },
  'formal-highways':  { primary: '2D2D2D', accent: 'B45309', dark: '333333', mid: '666666', rowAlt: 'FFFBEB', font: 'Cambria', bodySize: 19 },
  'site-plan':        { primary: '1E40AF', accent: '1E40AF', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Calibri', bodySize: 20 },
  'quick-brief':      { primary: '475569', accent: '475569', dark: '334155', mid: '94A3B8', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 20 },
};
type DL = 'full' | 'detailed' | 'standard' | 'light';
const DETAIL: Record<TrafficTemplateSlug, DL> = { 'full-chapter8': 'full', 'formal-highways': 'detailed', 'site-plan': 'standard', 'quick-brief': 'light' };
function show(slug: TrafficTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['details', 'tm-layout', 'signs', 'risk'];
  const standard = [...always, 'vehicle', 'pedestrian', 'emergency', 'roles'];
  const detailed = [...standard, 'phasing', 'public-transport', 'comms'];
  const full = [...detailed, 'cover', 'road-details', 'monitoring'];
  if (l === 'full') return full.includes(s); if (l === 'detailed') return detailed.includes(s);
  if (l === 'standard') return standard.includes(s); return always.includes(s);
}

function hdrCell(p: Palette, t: string, w: number): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: hdrPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })] }); }
function dCell(p: Palette, t: string, w: number, o: { bold?: boolean; shade?: string } = {}): TableCell { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR } : undefined, margins: cellPad, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!o.bold, font: p.font, size: p.bodySize, color: p.dark })] })] }); }
function altRow(p: Palette, cells: [string, number, { bold?: boolean }?][], idx: number): TableRow { const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF'; return new TableRow({ children: cells.map(([t, w, o]) => dCell(p, t, w, { shade, ...o })) }); }
function bodyPara(p: Palette, t: string): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: p.font, size: p.bodySize, color: p.dark })] }); }
function gap(s = 200): Paragraph { return new Paragraph({ spacing: { after: s }, children: [] }); }
function sectionHead(slug: TrafficTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'full-chapter8') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'formal-highways') return new Paragraph({ spacing: { before: 400, after: 140 }, children: [new TextRun({ text: `${num}.  `, bold: true, font: p.font, size: 24, color: p.accent }), new TextRun({ text: title.toUpperCase(), bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'site-plan') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
  return new Paragraph({ spacing: { before: 280, after: 100 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } }, indent: { left: 80 }, children: [new TextRun({ text: title, bold: true, font: p.font, size: 22, color: p.dark })] });
}
function buildInfoTable(p: Palette, rows: [string, string][]): Table { return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800], rows: rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)) }); }
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table { const cw = headers.map(([, w]) => w); return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ children: headers.map(([l, w]) => hdrCell(p, l, w)) }), ...data.map((row, i) => altRow(p, row.map((t, ci) => [t, cw[ci]] as [string, number]), i))] }); }

function buildCover(slug: TrafficTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'full-chapter8') return [gap(200), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 500, bottom: 500, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'TRAFFIC MANAGEMENT', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }), new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'PLAN', bold: true, font: p.font, size: 36, color: 'A7F3D0' })] }), new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'D1FAE5' })] }), new Paragraph({ children: [new TextRun({ text: `${d.documentRef || ''}  |  ${d.planDate || ''}`, font: p.font, size: 20, color: 'D1FAE5' })] })] })] })] }), gap(120), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chapter 8 / HSG144 Compliant', bold: true, font: p.font, size: 18, color: p.accent })] }), gap(300)];
  if (slug === 'formal-highways') return [gap(600), new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'TRAFFIC MANAGEMENT PLAN', bold: true, font: p.font, size: 48, color: p.primary })] }), new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 8 } }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 28, color: p.dark })] }), new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `${d.documentRef || ''}  |  ${d.planDate || ''}`, font: p.font, size: 20, color: p.mid })] }), gap(300)];
  if (slug === 'site-plan') return [gap(400), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'TM PLAN', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }), new Paragraph({ children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'BFDBFE' })] })] })] })] }), gap(300)];
  return [];
}

export async function buildTrafficTemplateDocument(content: any, templateSlug: TrafficTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug]; const d = content; let sec = 0;
  const children: (Paragraph | Table)[] = [];
  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); children.push(new Paragraph({ children: [new PageBreak()] })); }

  children.push(sectionHead(templateSlug, p, ++sec, 'Plan Details'));
  children.push(buildInfoTable(p, [['Document Reference', d.documentRef || ''], ['Date', d.planDate || ''], ['Review Date', d.reviewDate || ''], ['Prepared By', d.preparedBy || ''], ['Project', d.projectName || ''], ['Site Address', d.siteAddress || ''], ['Client', d.client || ''], ['TM Type', d.tmType || ''], ['Duration', d.duration || ''], ['Working Hours', d.workingHours || '']]));
  children.push(gap());

  if (show(templateSlug, 'road-details') && d.roadDetails) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Road Details'));
    const rd = d.roadDetails;
    children.push(buildInfoTable(p, [['Road', rd.roadName || ''], ['Classification', rd.classification || ''], ['Speed Limit', rd.speedLimit || ''], ['Carriageway', rd.carriageway || ''], ['Traffic Volume', rd.trafficVolume || ''], ['Working Length', rd.workingLength || '']]));
    children.push(gap());
  }

  children.push(sectionHead(templateSlug, p, ++sec, 'Works Description'));
  for (const para of (d.worksDescription || '').split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
  children.push(gap());

  if (d.signSchedule?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Sign Schedule'));
    const sw = [Math.floor(W*0.08), Math.floor(W*0.30), Math.floor(W*0.18), Math.floor(W*0.30), W - Math.floor(W*0.08) - Math.floor(W*0.30) - Math.floor(W*0.18) - Math.floor(W*0.30)];
    children.push(buildDataTable(p, [['Ref', sw[0]], ['Sign', sw[1]], ['TSRGD', sw[2]], ['Location', sw[3]], ['Qty', sw[4]]], d.signSchedule.map((s: any) => [s.ref || '', s.sign || '', s.tsrgdRef || '', s.location || '', String(s.quantity ?? '')])));
    children.push(gap());
  }

  if (show(templateSlug, 'phasing') && d.phasingPlan) { children.push(sectionHead(templateSlug, p, ++sec, 'Phasing & Sequencing')); for (const para of (d.phasingPlan as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'vehicle') && d.vehicleManagement) { children.push(sectionHead(templateSlug, p, ++sec, 'Vehicle Management')); for (const para of (d.vehicleManagement as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'pedestrian') && d.pedestrianManagement) { children.push(sectionHead(templateSlug, p, ++sec, 'Pedestrian Management')); for (const para of (d.pedestrianManagement as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'emergency') && d.emergencyAccess) { children.push(sectionHead(templateSlug, p, ++sec, 'Emergency Access')); for (const para of (d.emergencyAccess as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }
  if (show(templateSlug, 'public-transport') && d.publicTransport) { children.push(sectionHead(templateSlug, p, ++sec, 'Public Transport')); children.push(bodyPara(p, d.publicTransport)); children.push(gap()); }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  if (d.riskAssessment?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Risk Assessment'));
    const rw = [Math.floor(W*0.25), Math.floor(W*0.15), Math.floor(W*0.40), W - Math.floor(W*0.25) - Math.floor(W*0.15) - Math.floor(W*0.40)];
    children.push(buildDataTable(p, [['Hazard', rw[0]], ['Risk', rw[1]], ['Control', rw[2]], ['Residual', rw[3]]], d.riskAssessment.map((r: any) => [r.hazard || '', r.risk || '', r.control || '', r.residualRisk || ''])));
    children.push(gap());
  }

  if (show(templateSlug, 'roles') && d.operativeRoles?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Operative Roles'));
    const ow = [Math.floor(W*0.22), Math.floor(W*0.48), W - Math.floor(W*0.22) - Math.floor(W*0.48)];
    children.push(buildDataTable(p, [['Role', ow[0]], ['Responsibility', ow[1]], ['Qualification', ow[2]]], d.operativeRoles.map((r: any) => [r.role || '', r.responsibility || '', r.qualification || ''])));
    children.push(gap());
  }

  if (show(templateSlug, 'comms') && d.communicationPlan) { children.push(sectionHead(templateSlug, p, ++sec, 'Communication Plan')); for (const para of (d.communicationPlan as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); children.push(gap()); }

  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of Traffic Management Plan —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  const hdr = new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'TRAFFIC MANAGEMENT PLAN', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
  const ftr = new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'Chapter 8 / HSG144', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });

  return new Document({ styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } }, sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: hdr }, footers: { default: ftr }, children }] });
}
