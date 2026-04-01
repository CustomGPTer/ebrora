// =============================================================================
// RIDDOR Report — Multi-Template Engine
// 3 templates: Formal Investigation, Corporate, Quick Notification
// Compliant with RIDDOR 2013
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { RiddorTemplateSlug } from '@/lib/riddor/types';

const W = h.A4_CONTENT_WIDTH;
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const hdrPad = { top: 100, bottom: 100, left: 140, right: 140 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

interface Palette { primary: string; primaryLight: string; accent: string; dark: string; mid: string; rowAlt: string; font: string; bodySize: number; }

const PALETTES: Record<RiddorTemplateSlug, Palette> = {
  'formal-investigation': { primary: 'B91C1C', primaryLight: 'FEE2E2', accent: 'B91C1C', dark: '1F2937', mid: '6B7280', rowAlt: 'FEF2F2', font: 'Arial', bodySize: 20 },
  'corporate':            { primary: '1E3A5F', primaryLight: 'EFF6FF', accent: '1E3A5F', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Cambria', bodySize: 19 },
  'quick-notification':   { primary: 'C2410C', primaryLight: 'FFF7ED', accent: 'C2410C', dark: '431407', mid: '78716C', rowAlt: 'FFF7ED', font: 'Calibri', bodySize: 20 },
};

type DetailLevel = 'full' | 'standard' | 'light';
const DETAIL: Record<RiddorTemplateSlug, DetailLevel> = { 'formal-investigation': 'full', 'corporate': 'standard', 'quick-notification': 'light' };

function show(slug: RiddorTemplateSlug, s: string): boolean {
  const l = DETAIL[slug];
  const always = ['classification', 'incident', 'injured', 'description', 'immediate', 'notification'];
  const standard = [...always, 'corrective', 'lessons', 'distribution'];
  const full = [...standard, 'cover', 'root-cause', 'witness', 'scene'];
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

function sectionHead(slug: RiddorTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'formal-investigation') return new Paragraph({ spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } }, children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })] });
  if (slug === 'corporate') { const ns = num < 10 ? `0${num}` : `${num}`; return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: `${ns}   ${title.toUpperCase()}`, bold: true, font: p.font, size: 22, color: 'FFFFFF' })] })] })] })] }); }
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

function buildCover(slug: RiddorTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'formal-investigation') return [
    gap(200),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 500, bottom: 500, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'RIDDOR REPORT', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Classification: ${d.riddorClassification || ''}`, bold: true, font: p.font, size: 28, color: 'FCA5A5' })] }),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'FECACA' })] }),
      new Paragraph({ children: [new TextRun({ text: `${d.documentRef || ''}  |  Incident: ${d.incidentDetails?.date || ''}`, font: p.font, size: 20, color: 'FECACA' })] }),
    ] })] })] }),
    gap(120),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RIDDOR 2013 — CONFIDENTIAL', bold: true, font: p.font, size: 18, color: p.accent })] }),
    gap(300),
  ];
  if (slug === 'corporate') return [
    gap(400),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: W, type: WidthType.DXA }, shading: { fill: p.primary, type: ShadingType.CLEAR }, margins: { top: 400, bottom: 400, left: 300, right: 300 }, children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'INCIDENT REPORT', bold: true, font: p.font, size: 44, color: 'FFFFFF' })] }),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `RIDDOR Reportable — ${d.riddorClassification || ''}`, font: p.font, size: 20, color: 'BFDBFE' })] }),
      new Paragraph({ children: [new TextRun({ text: d.projectName || '', font: p.font, size: 22, color: 'BFDBFE' })] }),
    ] })] })] }),
    gap(300),
  ];
  return [];
}

function makeHeader(p: Palette, d: any): Header {
  return new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'RIDDOR REPORT — CONFIDENTIAL', bold: true, font: p.font, size: 17, color: p.primary }), new TextRun({ text: `\t${d.documentRef || ''}`, font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}
function makeFooter(p: Palette): Footer {
  return new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } }, children: [new TextRun({ text: 'RIDDOR 2013 Compliant — Confidential', font: p.font, size: 16, color: p.mid }), new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }), new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] })] });
}

// =================================================================
export async function buildRiddorTemplateDocument(content: any, templateSlug: RiddorTemplateSlug): Promise<Document> {
  const p = PALETTES[templateSlug];
  const d = content;
  let sec = 0;
  const children: (Paragraph | Table)[] = [];

  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) { children.push(...cover); children.push(new Paragraph({ children: [new PageBreak()] })); }

  // Classification
  children.push(sectionHead(templateSlug, p, ++sec, 'RIDDOR Classification'));
  children.push(buildInfoTable(p, [
    ['Classification', d.riddorClassification || ''],
    ['Document Reference', d.documentRef || ''],
    ['Report Date', d.reportDate || ''],
    ['Reporter', `${d.reporter || ''} — ${d.reporterRole || ''}`],
    ['Project', d.projectName || ''],
    ['Site Address', d.siteAddress || ''],
    ['Client', d.client || ''],
    ['Principal Contractor', d.principalContractor || ''],
  ]));
  if (d.riddorJustification) { children.push(gap(80)); for (const para of (d.riddorJustification as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para)); }
  children.push(gap());

  // HSE notification
  if (d.hseNotification) {
    children.push(sectionHead(templateSlug, p, ++sec, 'HSE Notification'));
    const hsn = d.hseNotification;
    children.push(buildInfoTable(p, [
      ['Reported to HSE', hsn.reported ? 'YES' : 'Not yet reported'],
      ['HSE Reference', hsn.referenceNumber || 'Pending'],
      ['Date Notified', hsn.dateNotified || ''],
      ['Method', hsn.method || ''],
    ]));
    children.push(gap());
  }

  // Incident details
  children.push(sectionHead(templateSlug, p, ++sec, 'Incident Details'));
  const inc = d.incidentDetails || {};
  children.push(buildInfoTable(p, [
    ['Date', inc.date || ''], ['Time', inc.time || ''],
    ['Location', inc.exactLocation || ''], ['Activity Underway', inc.activityUnderway || ''],
    ['Weather', inc.weatherConditions || ''], ['Lighting', inc.lightingConditions || ''],
  ]));
  children.push(gap());

  // Injured person
  children.push(sectionHead(templateSlug, p, ++sec, 'Injured Person'));
  const ip = d.injuredPerson || {};
  children.push(buildInfoTable(p, [
    ['Name', ip.name || ''], ['Age', String(ip.age ?? '')], ['Gender', ip.gender || ''],
    ['Occupation', ip.occupation || ''], ['Employer', ip.employer || ''],
    ['Length of Service', ip.lengthOfService || ''], ['Nature of Injury', ip.natureOfInjury || ''],
    ['Body Part', ip.bodyPartAffected || ''], ['Hospitalised', ip.hospitalised ? 'Yes' : 'No'],
    ['Hospital', ip.hospitalName || ''], ['Returned to Work', ip.returnedToWork ? 'Yes' : 'Not yet'],
    ['Days Absent', String(ip.daysAbsent ?? '')],
  ]));
  children.push(gap());

  // Incident description
  children.push(sectionHead(templateSlug, p, ++sec, 'Incident Description'));
  for (const para of (d.incidentDescription || '').split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
  children.push(gap());

  // Immediate actions
  children.push(sectionHead(templateSlug, p, ++sec, 'Immediate Actions Taken'));
  children.push(...buildBulletList(p, d.immediateActions || []));
  children.push(gap());

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Root cause analysis (full only)
  if (show(templateSlug, 'root-cause') && d.rootCauseAnalysis) {
    const rca = d.rootCauseAnalysis;
    children.push(sectionHead(templateSlug, p, ++sec, 'Root Cause Analysis'));
    if (rca.immediateCauses?.length) {
      children.push(bodyPara(p, 'IMMEDIATE CAUSES:'));
      children.push(...buildBulletList(p, rca.immediateCauses));
    }
    if (rca.underlyingCauses?.length) {
      children.push(gap(80));
      children.push(bodyPara(p, 'UNDERLYING CAUSES:'));
      children.push(...buildBulletList(p, rca.underlyingCauses));
    }
    if (rca.rootCause) {
      children.push(gap(80));
      children.push(bodyPara(p, 'ROOT CAUSE:'));
      for (const para of (rca.rootCause as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // Corrective actions
  if (show(templateSlug, 'corrective') && d.correctiveActions?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Corrective Actions'));
    const caW1 = Math.floor(W * 0.06); const caW2 = Math.floor(W * 0.34); const caW3 = Math.floor(W * 0.14);
    const caW4 = Math.floor(W * 0.16); const caW5 = Math.floor(W * 0.14); const caW6 = W - caW1 - caW2 - caW3 - caW4 - caW5;
    children.push(buildDataTable(p,
      [['Ref', caW1], ['Action', caW2], ['Type', caW3], ['Responsible', caW4], ['Target', caW5], ['Status', caW6]],
      d.correctiveActions.map((ca: any) => [ca.ref || '', ca.action || '', ca.type || '', ca.responsible || '', ca.targetDate || '', ca.status || '']),
    ));
    children.push(gap());
  }

  // Lessons learned
  if (show(templateSlug, 'lessons') && d.lessonsLearned) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Lessons Learned'));
    for (const para of (d.lessonsLearned as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Witness summary (full only)
  if (show(templateSlug, 'witness') && d.witnessStatementsSummary) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Witness Statements Summary'));
    for (const para of (d.witnessStatementsSummary as string).split(/\n\n?/).filter(Boolean)) children.push(bodyPara(p, para));
    children.push(gap());
  }

  // Scene preservation (full only)
  if (show(templateSlug, 'scene') && d.scenePreservation) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Scene Preservation'));
    children.push(bodyPara(p, d.scenePreservation));
    children.push(gap());
  }

  // Distribution
  if (show(templateSlug, 'distribution') && d.distributionList?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Distribution'));
    children.push(...buildBulletList(p, d.distributionList));
    children.push(gap());
  }

  // End
  children.push(gap(300));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— End of RIDDOR Report —', italics: true, font: p.font, size: p.bodySize, color: p.mid })] }));
  children.push(gap(80));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })] }));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } },
    sections: [{ properties: { page: { size: { width: h.A4_WIDTH, height: h.A4_HEIGHT }, margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL } } }, headers: { default: makeHeader(p, d) }, footers: { default: makeFooter(p) }, children }],
  });
}
