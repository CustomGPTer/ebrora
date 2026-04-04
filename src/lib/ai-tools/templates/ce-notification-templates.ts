// =============================================================================
// CE Notification Builder — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Formal Letter  (dark green #065F46, Arial, underline headings, ~3pp)
// T2 — Corporate      (navy #1E3A5F, Cambria, full-width bar headings, ~2pp)
// T3 — Concise        (slate #475569, Arial, left-border headings, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CeTemplateSlug } from '@/lib/ce/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const DK_GREEN = '065F46'; const DK_GREEN_SUB = 'A7F3D0'; const DK_GREEN_BG = 'ECFDF5';
const NAVY = '1E3A5F'; const NAVY_SUB = 'BFDBFE'; const NAVY_BG = 'EFF6FF';
const SLATE = '475569'; const SLATE_SUB = 'CBD5E1'; const SLATE_DK = '334155';
const RED = 'DC2626'; const AMBER = 'D97706';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ───────────────────────────────────────────────────────────
interface CeData {
  documentRef: string; notificationDate: string; contractRef: string;
  projectName: string; siteAddress: string; contractor: string;
  notifiedBy: string; notifiedTo: string;
  ceClause: string; eventDate: string; relatedInstruction: string;
  estimatedCost: string; estimatedProgrammeImpact: string;
  eventDescription: string;
  entitlementBasis: string;
  programmeImpact: string;
  programmeKpis: Array<{ value: string; label: string; sublabel?: string }>;
  costItems: Array<{ element: string; description: string; amount: string }>;
  totalCost: string;
  evidence: Array<{ document: string; reference: string; status: string }>;
  relatedNotices: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CeData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  const pi = c?.programmeImpact || {};
  const ci = c?.costImplications || {};
  // Build costItems from nested or flat
  let costItems = a('costItems');
  if (costItems.length === 0 && ci) {
    const pairs: Array<{ element: string; description: string; amount: string }> = [];
    if (ci.labourCost) pairs.push({ element: 'Labour', description: '', amount: ci.labourCost });
    if (ci.plantCost) pairs.push({ element: 'Plant', description: '', amount: ci.plantCost });
    if (ci.materialsCost) pairs.push({ element: 'Materials', description: '', amount: ci.materialsCost });
    if (ci.subcontractorCost) pairs.push({ element: 'Subcontractor', description: '', amount: ci.subcontractorCost });
    if (ci.preliminariesImpact) pairs.push({ element: 'Preliminaries', description: '', amount: ci.preliminariesImpact });
    costItems = pairs;
  }
  // Build programmeKpis from nested or flat
  let kpis = a('programmeKpis');
  if (kpis.length === 0 && pi.estimatedDelay) {
    kpis = [
      { value: pi.estimatedDelay, label: 'Working Days Delay', sublabel: 'To Planned Completion' },
      { value: pi.criticalPathAffected || 'Yes', label: 'Critical Path Affected', sublabel: '' },
      { value: pi.plannedCompletionImpact || '', label: 'Revised Completion', sublabel: '' },
    ];
  }
  return {
    documentRef: s('documentRef', 'CEN-001'), notificationDate: s('notificationDate'), contractRef: s('contractReference') || s('contractRef'),
    projectName: s('projectName'), siteAddress: s('siteAddress'), contractor: s('contractor'),
    notifiedBy: s('notifiedBy'), notifiedTo: s('notifiedTo'),
    ceClause: s('compensationEventClause') || s('ceClause'),
    eventDate: s('eventDate'), relatedInstruction: typeof c?.relatedInstruction === 'object' ? c.relatedInstruction?.instructionRef || '' : s('relatedInstruction'),
    estimatedCost: ci?.estimatedAdditionalCost || s('estimatedCost'),
    estimatedProgrammeImpact: pi?.estimatedDelay ? `${pi.estimatedDelay} working days` : s('estimatedProgrammeImpact'),
    eventDescription: s('eventDescription'), entitlementBasis: s('entitlementBasis'),
    programmeImpact: typeof pi === 'string' ? pi : (pi?.programmeNarrative || s('programmeImpact')),
    programmeKpis: kpis, costItems, totalCost: ci?.estimatedAdditionalCost || s('totalCost'),
    evidence: a('supportingEvidence').length > 0 ? a('supportingEvidence') : a('evidence'),
    relatedNotices: s('relatedNotices'), additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('attached') || low.includes('yes')) { bg = 'D1FAE5'; color = '059669'; }
  else if (low.includes('follow') || low.includes('pending')) { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('missing') || low.includes('no')) { bg = 'FEF2F2'; color = RED; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(h2 => h2.width),
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, {
            bg: ri % 2 === 1 ? ZEBRA : undefined,
            bold: (cell || '').toString().toUpperCase().includes('TOTAL'),
          })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const widths = ratios.map(r => Math.round(W * r));
  widths[widths.length - 1] = W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return widths;
}

// Underline section heading (T1 Formal Letter style)
function underlineHead(num: number, title: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 4 } },
    children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: 'Arial', size: 24, color: accent })],
  });
}
// Left-border section heading (T3 Concise style)
function leftBorderHead(title: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: accent, space: 6 } },
    indent: { left: 80 },
    children: [new TextRun({ text: title, bold: true, font: 'Arial', size: LG, color: SLATE_DK })],
  });
}

// Standard cover info rows
function coverInfoRows(d: CeData): Array<{ label: string; value: string }> {
  return [
    { label: 'Document Reference', value: d.documentRef },
    { label: 'Notification Date', value: d.notificationDate },
    { label: 'Contract Reference', value: d.contractRef },
    { label: 'Project', value: d.projectName },
    { label: 'Site Address', value: d.siteAddress },
    { label: 'Contractor', value: d.contractor },
    { label: 'Notified By', value: d.notifiedBy },
    { label: 'Addressed To', value: d.notifiedTo },
    { label: 'CE Clause Reference', value: d.ceClause },
    { label: 'Event Date', value: d.eventDate },
    { label: 'Related Instruction', value: d.relatedInstruction },
  ];
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — FORMAL LETTER (Dark Green #065F46, Arial, underline headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CeData): Document {
  const A = DK_GREEN;
  const hdr = h.accentHeader('Compensation Event Notification', A);
  const ftr = h.accentFooter(d.documentRef, 'Formal Letter', A);
  const costCols = cols([0.22, 0.54, 0.24]);
  const evCols = cols([0.36, 0.38, 0.26]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['COMPENSATION EVENT', 'NOTIFICATION'], d.projectName || '', A, DK_GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Notification Date', value: d.notificationDate },
            { label: 'Contract Reference', value: d.contractRef },
            { label: 'Project', value: d.projectName },
            { label: 'Notified By', value: d.notifiedBy },
            { label: 'Notified To', value: d.notifiedTo },
            { label: 'CE Clause', value: d.ceClause },
            { label: 'Event Date', value: d.eventDate },
            { label: 'Estimated Cost Impact', value: d.estimatedCost },
            { label: 'Estimated Programme Impact', value: d.estimatedProgrammeImpact },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Notification, Event, Entitlement
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          underlineHead(1, 'NOTIFICATION DETAILS', A), h.spacer(40),
          h.coverInfoTable(coverInfoRows(d), A, W),
          underlineHead(2, 'EVENT DESCRIPTION', A), h.spacer(40),
          ...h.richBodyText(d.eventDescription || ''),
          underlineHead(3, 'CONTRACTUAL BASIS \u2014 ENTITLEMENT', A), h.spacer(40),
          ...h.richBodyText(d.entitlementBasis || ''),
        ] },
      // Body — Programme, Cost, Evidence, Related Notices, Sig
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          underlineHead(4, 'PROGRAMME IMPACT', A), h.spacer(40),
          ...(d.programmeKpis.length > 0 ? [h.kpiDashboard(d.programmeKpis.map(k => ({ value: k.value, label: k.label })), A, W), h.spacer(60)] : []),
          ...h.richBodyText(d.programmeImpact || ''),
          underlineHead(5, 'COST IMPLICATIONS', A), h.spacer(40),
          ...(d.costItems.length > 0 ? [dataTable(A,
            [{ text: 'COST ELEMENT', width: costCols[0] }, { text: 'DESCRIPTION', width: costCols[1] }, { text: 'AMOUNT (\u00A3)', width: costCols[2] }],
            [...d.costItems.map(c => [c.element, c.description, c.amount]),
             ['ESTIMATED TOTAL ADDITIONAL COST', '', d.totalCost || '']]
          )] : []),
          h.spacer(40),
          h.calloutBox(
            'This is a preliminary cost indication. A formal quotation will be submitted under Clause 62.3 within three weeks of the PM\'s instruction to submit quotations, including a revised programme per Clause 62.2.',
            A, DK_GREEN_BG, '134e4a', W, { boldPrefix: 'Quotation Note:' }
          ),
          underlineHead(6, 'SUPPORTING EVIDENCE', A), h.spacer(40),
          ...(d.evidence.length > 0 ? [dataTable(A,
            [{ text: 'DOCUMENT', width: evCols[0] }, { text: 'REFERENCE', width: evCols[1] }, { text: 'STATUS', width: evCols[2] }],
            d.evidence.map(e => [e.document, e.reference, e.status]), [2]
          )] : []),
          ...(d.relatedNotices ? [underlineHead(7, 'RELATED NOTICES', A), h.spacer(40), ...h.richBodyText(d.relatedNotices)] : []),
          h.spacer(80),
          h.signatureGrid(['Notified By', 'Received By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CORPORATE (Navy #1E3A5F, Cambria, full-width bar headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CeData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Compensation Event Notification', A);
  const ftr = h.accentFooter(d.documentRef, 'Corporate', A);
  const costCols = cols([0.22, 0.54, 0.24]);
  const evCols = cols([0.36, 0.38, 0.26]);

  return new Document({
    styles: { default: { document: { run: { font: 'Cambria', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['COMPENSATION EVENT', 'NOTIFICATION'], d.projectName || '', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Notification Date', value: d.notificationDate },
            { label: 'Contract', value: d.contractRef },
            { label: 'Project', value: d.projectName },
            { label: 'Notified By', value: d.notifiedBy },
            { label: 'Notified To', value: d.notifiedTo },
            { label: 'CE Clause', value: d.ceClause },
            { label: 'Estimated Cost', value: d.estimatedCost },
            { label: 'Estimated Delay', value: d.estimatedProgrammeImpact },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'NOTIFICATION DETAILS', A), h.spacer(80),
          h.coverInfoTable(coverInfoRows(d), A, W),
          h.spacer(80), h.fullWidthSectionBar('02', 'EVENT DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(d.eventDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('03', 'ENTITLEMENT BASIS', A), h.spacer(80),
          ...h.richBodyText(d.entitlementBasis || ''),
          h.spacer(80), h.fullWidthSectionBar('04', 'PROGRAMME & COST IMPACT', A), h.spacer(80),
          ...(d.programmeKpis.length > 0 ? [h.kpiDashboard(d.programmeKpis.map(k => ({ value: k.value, label: k.label })), A, W), h.spacer(60)] : []),
          ...(d.costItems.length > 0 ? [dataTable(A,
            [{ text: 'COST ELEMENT', width: costCols[0] }, { text: 'DESCRIPTION', width: costCols[1] }, { text: '\u00A3', width: costCols[2] }],
            [...d.costItems.map(c => [c.element, c.description, c.amount]),
             ['TOTAL', '', d.totalCost || '']]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'SUPPORTING EVIDENCE', A), h.spacer(80),
          ...(d.evidence.length > 0 ? [dataTable(A,
            [{ text: 'DOCUMENT', width: evCols[0] }, { text: 'REFERENCE', width: evCols[1] }, { text: 'STATUS', width: evCols[2] }],
            d.evidence.map(e => [e.document, e.reference, e.status]), [2]
          )] : []),
          h.spacer(80),
          h.signatureGrid(['Notified By', 'Received By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — CONCISE (Slate #475569, Arial, left-border headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CeData): Document {
  const A = SLATE;
  const hdr = h.accentHeader('CE Notification \u2014 Concise', A);
  const ftr = h.accentFooter(d.documentRef, 'Concise', A);
  const costCols2 = cols([0.70, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CE NOTIFICATION'], `${d.projectName || ''} \u00B7 ${d.documentRef}`, A, SLATE_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.notificationDate },
            { label: 'Contract', value: d.contractRef },
            { label: 'Contractor', value: d.contractor },
            { label: 'CE Clause', value: d.ceClause },
            { label: 'Cost Impact', value: d.estimatedCost },
            { label: 'Programme Impact', value: d.estimatedProgrammeImpact },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — compact single page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          leftBorderHead('Notification Details', A),
          h.coverInfoTable([
            { label: 'Ref', value: d.documentRef }, { label: 'Date', value: d.notificationDate },
            { label: 'Contract', value: d.contractRef },
            { label: 'From', value: d.notifiedBy }, { label: 'To', value: d.notifiedTo },
            { label: 'CE Clause', value: d.ceClause },
            { label: 'Event Date', value: d.eventDate },
            { label: 'Instruction', value: d.relatedInstruction },
          ], A, W),
          leftBorderHead('Event Summary', A),
          ...h.richBodyText(d.eventDescription || ''),
          leftBorderHead('Programme Impact', A),
          ...h.richBodyText(d.programmeImpact || ''),
          leftBorderHead(`Cost Impact \u2014 ${d.totalCost || d.estimatedCost || ''}`, A),
          ...(d.costItems.length > 0 ? [dataTable(A,
            [{ text: 'ELEMENT', width: costCols2[0] }, { text: '\u00A3', width: costCols2[1] }],
            [...d.costItems.map(c => [c.element + (c.description ? ` (${c.description})` : ''), c.amount]),
             ['TOTAL', d.totalCost || '']]
          )] : []),
          leftBorderHead('Evidence', A),
          h.bodyText(
            d.evidence.map(e => `${e.reference} (${e.status.toLowerCase()})`).join(' \u00B7 ') +
            (d.relatedNotices ? `. ${d.relatedNotices}` : ''),
            SM
          ),
          h.spacer(80),
          h.signatureGrid(['Notified By', 'Received By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCeTemplateDocument(
  content: any,
  templateSlug: CeTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'formal-letter': return buildT1(d);
    case 'corporate':     return buildT2(d);
    case 'concise':       return buildT3(d);
    default:              return buildT1(d);
  }
}
