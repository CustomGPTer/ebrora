// =============================================================================
// DELAY NOTIFICATION BUILDER — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Formal Letter  (dark red #991B1B, Arial, underline headings, ~3pp)
// T2 — Corporate      (navy #1E3A5F, Cambria, full-width bar headings, ~2pp)
// T3 — Concise        (slate #475569, Arial, left-border headings, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { DelayTemplateSlug } from '@/lib/delay/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const DK_RED = '991B1B'; const DK_RED_SUB = 'FCA5A5'; const DK_RED_REF = 'FECACA'; const DK_RED_BG = 'FEF2F2';
const NAVY = '1E3A5F'; const NAVY_SUB = '93C5FD'; const NAVY_BG = 'EFF6FF';
const SLATE = '475569'; const SLATE_SUB = 'CBD5E1'; const SLATE_DK = '334155';
const RED = 'DC2626'; const AMBER = 'D97706'; const GREEN = '059669';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ────────────────────────────────────────────────────────────
interface DelayData {
  documentRef: string; letterDate: string; contractRef: string; contractForm: string;
  projectName: string; projectAddress: string;
  fromParty: string; toParty: string;
  notificationClause: string; letterSubject: string;
  extensionSought: string; estimatedCost: string;
  openingParagraph: string; eventDescription: string;
  affectedActivities: Array<{ activity: string; originalDate: string; revisedDate: string; delayDays: string; criticalPath: string; notes: string }>;
  programmeImpact: string;
  mitigationMeasures: string;
  contractualEntitlement: string;
  costItems: Array<{ element: string; amount: string }>;
  totalCost: string;
  costNarrative: string;
  requestedResponse: string;
  supportingDocuments: Array<{ document: string; reference: string; status: string }>;
  closingParagraph: string;
  additionalNotes: string;
  programmeKpis: Array<{ value: string; label: string; sublabel?: string }>;
  [key: string]: any;
}

function extract(c: any): DelayData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);

  // Normalise affected activities
  let activities = a('affectedActivities');
  if (activities.length === 0 && a('delayActivities').length > 0) activities = a('delayActivities');
  activities = activities.map((act: any) => ({
    activity: act.activityRef || act.activity || act.name || '',
    originalDate: act.originalDate || act.planned || '',
    revisedDate: act.revisedDate || act.revised || '',
    delayDays: String(act.delayDays || act.delay || ''),
    criticalPath: act.criticalPath || act.critical || '',
    notes: act.notes || '',
  }));

  // Normalise cost items from nested or flat
  let costItems = a('costItems');
  const ce = c?.costEntitlement || {};
  if (costItems.length === 0 && typeof ce === 'object' && !Array.isArray(ce)) {
    // try to build from costEntitlement sub-fields
    if (ce.costBreakdown && Array.isArray(ce.costBreakdown)) {
      costItems = ce.costBreakdown.map((cb: any) => ({ element: cb.element || cb.item || '', amount: cb.amount || cb.cost || '' }));
    }
  }
  const totalCost = ce?.estimatedAdditionalCost || s('totalCost') || s('estimatedCost');
  const costNarrative = ce?.costNarrative || s('costNarrative');

  // Build KPI dashboard values
  let kpis = a('programmeKpis');
  if (kpis.length === 0) {
    const eot = s('estimatedExtensionOfTime') || s('extensionSought');
    kpis = [
      { value: totalCost ? `£${totalCost.replace(/[£,]/g, '').replace(/(\d+)(\d{3})/, '$1,$2')}` : '—', label: 'Estimated Additional Cost', sublabel: 'Reserved — quotation to follow' },
      { value: eot || '—', label: 'Working Days EOT', sublabel: 'Critical Path Delay' },
      { value: '—', label: 'Revised Completion', sublabel: '' },
    ];
  }

  return {
    documentRef: s('documentRef', 'DNL-001'), letterDate: s('letterDate') || s('notificationDate'),
    contractRef: s('contractReference') || s('contractRef'),
    contractForm: s('contractForm'), projectName: s('projectName'), projectAddress: s('projectAddress') || s('siteAddress'),
    fromParty: s('fromParty'), toParty: s('toParty'),
    notificationClause: s('notificationClause'), letterSubject: s('letterSubject'),
    extensionSought: s('estimatedExtensionOfTime') || s('extensionSought'),
    estimatedCost: totalCost,
    openingParagraph: s('openingParagraph'),
    eventDescription: s('eventDescription') || s('delayEvent'),
    affectedActivities: activities,
    programmeImpact: s('programmeImpact'),
    mitigationMeasures: s('mitigationMeasures'),
    contractualEntitlement: s('contractualEntitlement') || s('contractualBasis'),
    costItems, totalCost, costNarrative,
    requestedResponse: s('requestedResponse') || s('requiredActions'),
    supportingDocuments: a('supportingDocuments').length > 0 ? a('supportingDocuments') : a('evidence'),
    closingParagraph: s('closingParagraph'),
    additionalNotes: s('additionalNotes'),
    programmeKpis: kpis,
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('attached') || low.includes('done') || low.includes('yes')) { bg = 'D1FAE5'; color = GREEN; }
  else if (low.includes('follow') || low.includes('pending') || low.includes('progress')) { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('missing') || low.includes('no') || low === 'yes' || low.includes('critical')) { bg = 'FEF2F2'; color = RED; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function criticalCell(text: string, width: number, idx: number): TableCell {
  const low = (text || '').toLowerCase();
  if (low === 'yes') return h.dataCell('Yes', width, { fillColor: 'FEF2F2', color: RED, fontSize: SM, bold: true });
  if (low === 'no') return h.dataCell('No', width, { fillColor: 'D1FAE5', color: GREEN, fontSize: SM, bold: true });
  return h.dataCell(text, width, { fillColor: idx % 2 === 1 ? ZEBRA : undefined, fontSize: SM });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(hh => hh.width),
    rows: [
      new TableRow({ children: headers.map(hh => hdrCell(hh.text, hh.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? criticalCell(String(cell || ''), headers[ci].width, ri) :
          txtCell(String(cell || ''), headers[ci].width, {
            bg: ri % 2 === 1 ? ZEBRA : undefined,
            bold: (cell || '').toString().toUpperCase().includes('TOTAL'),
          })
        ),
      })),
    ],
  });
}
function costTable(accent: string, items: Array<{ element: string; amount: string }>, total: string): Table {
  const cw = cols([0.70, 0.30]);
  const rows = [
    ...items.map(c => [c.element, c.amount]),
    ['ESTIMATED TOTAL (reserved)', total || ''],
  ];
  return dataTable(accent, [{ text: 'COST ELEMENT', width: cw[0] }, { text: 'ESTIMATE (£)', width: cw[1] }], rows);
}

function cols(ratios: number[]): number[] {
  const widths = ratios.map(r => Math.round(W * r));
  widths[widths.length - 1] = W - widths.slice(0, -1).reduce((a2, b) => a2 + b, 0);
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


// ═════════════════════════════════════════════════════════════════════════════
// T1 — FORMAL LETTER (Dark Red #991B1B, Arial, underline headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: DelayData): Document {
  const A = DK_RED;
  const hdr = h.accentHeader('Delay Notification', A);
  const ftr = h.accentFooter(d.documentRef, 'Formal Letter', A);
  const actCols = cols([0.30, 0.15, 0.15, 0.14, 0.13, 0.13]);
  const evCols = cols([0.40, 0.36, 0.24]);
  const cstCols = cols([0.70, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── Cover ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['DELAY NOTIFICATION'], d.projectName || '', A, DK_RED_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date', value: d.letterDate },
            { label: 'Contract', value: `${d.contractRef}${d.contractForm ? ' — ' + d.contractForm : ''}` },
            { label: 'From', value: d.fromParty },
            { label: 'To', value: d.toParty },
            { label: 'Clause', value: d.notificationClause },
            { label: 'Subject', value: d.letterSubject },
            { label: 'Extension Sought', value: d.extensionSought },
            { label: 'Estimated Additional Cost', value: d.estimatedCost ? `£${d.estimatedCost.replace(/^£/, '')}` : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },

      // ── Body page 1: Notice, Event, Activities, Programme ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          underlineHead(1, 'FORMAL NOTICE OF DELAY', A), h.spacer(40),
          ...h.richBodyText(d.openingParagraph || ''),

          underlineHead(2, 'EVENT DESCRIPTION', A), h.spacer(40),
          ...h.richBodyText(d.eventDescription || ''),

          underlineHead(3, 'AFFECTED ACTIVITIES', A), h.spacer(40),
          ...(d.affectedActivities.length > 0 ? [dataTable(A,
            [
              { text: 'ACTIVITY', width: actCols[0] },
              { text: 'ORIGINAL DATE', width: actCols[1] },
              { text: 'REVISED DATE', width: actCols[2] },
              { text: 'DELAY (WD)', width: actCols[3] },
              { text: 'CRITICAL?', width: actCols[4] },
              { text: 'NOTES', width: actCols[5] },
            ],
            d.affectedActivities.map(aa => [aa.activity, aa.originalDate, aa.revisedDate, aa.delayDays, aa.criticalPath, aa.notes]),
            [4]
          )] : []),

          underlineHead(4, 'PROGRAMME IMPACT', A), h.spacer(40),
          ...h.richBodyText(d.programmeImpact || ''),
        ] },

      // ── Body page 2: Mitigation, Entitlement, Cost, Response ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          underlineHead(5, 'MITIGATION MEASURES', A), h.spacer(40),
          ...h.richBodyText(d.mitigationMeasures || ''),

          underlineHead(6, 'CONTRACTUAL ENTITLEMENT', A), h.spacer(40),
          ...h.richBodyText(d.contractualEntitlement || ''),

          underlineHead(7, 'COST ENTITLEMENT', A), h.spacer(40),
          // KPI dashboard
          ...(d.programmeKpis.length > 0 ? [h.kpiDashboard(
            d.programmeKpis.slice(0, 3).map(k => ({ value: k.value, label: k.label })), A, W
          ), h.spacer(60)] : []),
          ...h.richBodyText(d.costNarrative || ''),
          h.spacer(40),
          // Cost breakdown table
          ...(d.costItems.length > 0 ? [costTable(A, d.costItems, d.totalCost)] : []),

          underlineHead(8, 'REQUIRED RESPONSE & SUPPORTING EVIDENCE', A), h.spacer(40),
          ...h.richBodyText(d.requestedResponse || ''),
          h.spacer(40),
          // Evidence table
          ...(d.supportingDocuments.length > 0 ? [dataTable(A,
            [{ text: 'DOCUMENT', width: evCols[0] }, { text: 'REFERENCE', width: evCols[1] }, { text: 'STATUS', width: evCols[2] }],
            d.supportingDocuments.map(e => [e.document, e.reference, e.status]), [2]
          )] : []),
          h.spacer(60),
          // "Yours faithfully" closing
          ...(d.closingParagraph ? h.richBodyText(d.closingParagraph) : [h.bodyText('Yours faithfully,')]),
          h.spacer(80),
          h.signatureGrid(['For and on behalf of — Contractor', 'Received By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CORPORATE (Navy #1E3A5F, Cambria, full-width bar headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: DelayData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Delay Notification', A);
  const ftr = h.accentFooter(d.documentRef, 'Corporate', A);
  const actCols = cols([0.32, 0.14, 0.14, 0.14, 0.13, 0.13]);
  const cstCols = cols([0.70, 0.30]);
  const evCols = cols([0.40, 0.36, 0.24]);

  return new Document({
    styles: { default: { document: { run: { font: 'Cambria', size: BODY } } } },
    sections: [
      // ── Cover ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['DELAY NOTIFICATION'], d.projectName || '', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.letterDate },
            { label: 'Contract', value: `${d.contractRef}${d.contractForm ? ' — ' + d.contractForm : ''}` },
            { label: 'From', value: d.fromParty },
            { label: 'To', value: d.toParty },
            { label: 'Clause', value: d.notificationClause },
            { label: 'Extension Sought', value: d.extensionSought },
            { label: 'Cost Estimate', value: d.estimatedCost ? `£${d.estimatedCost.replace(/^£/, '')}` : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },

      // ── Body ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'NOTICE DETAILS', A), h.spacer(80),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.letterDate },
            { label: 'Contract', value: `${d.contractRef}${d.contractForm ? ' — ' + d.contractForm : ''}` },
            { label: 'From', value: d.fromParty },
            { label: 'To', value: d.toParty },
            { label: 'Clause', value: d.notificationClause },
            { label: 'Event Date', value: d.letterDate },
            { label: 'Related EWN', value: '' },
          ], A, W),

          h.spacer(80), h.fullWidthSectionBar('02', 'EVENT DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(d.eventDescription || ''),

          h.spacer(80), h.fullWidthSectionBar('03', 'PROGRAMME IMPACT', A), h.spacer(80),
          // 4-col KPI dashboard
          ...(d.programmeKpis.length > 0 ? [h.kpiDashboard(
            [
              { value: d.extensionSought || '—', label: 'Working Days EOT' },
              { value: 'Yes', label: 'Critical Path' },
              { value: d.programmeKpis.find(k => k.label.toLowerCase().includes('completion'))?.value || '—', label: 'Revised Completion' },
              { value: '—', label: 'Key Date Affected' },
            ], A, W
          ), h.spacer(60)] : []),
          // Activities table
          ...(d.affectedActivities.length > 0 ? [dataTable(A,
            [
              { text: 'ACTIVITY', width: actCols[0] },
              { text: 'ORIGINAL', width: actCols[1] },
              { text: 'REVISED', width: actCols[2] },
              { text: 'DELAY (WD)', width: actCols[3] },
              { text: 'CRITICAL?', width: actCols[4] },
              { text: 'NOTES', width: actCols[5] },
            ],
            d.affectedActivities.map(aa => [aa.activity, aa.originalDate, aa.revisedDate, aa.delayDays, aa.criticalPath, aa.notes]),
            [4]
          )] : []),

          h.spacer(80), h.fullWidthSectionBar('04', 'MITIGATION & ENTITLEMENT', A), h.spacer(80),
          ...h.richBodyText(d.mitigationMeasures || ''),
          h.spacer(40),
          ...h.richBodyText(d.contractualEntitlement || ''),

          h.spacer(80), h.fullWidthSectionBar('05', 'COST IMPACT & EVIDENCE', A), h.spacer(80),
          ...(d.costItems.length > 0 ? [costTable(A, d.costItems, d.totalCost)] : []),
          h.spacer(40),
          // Evidence paragraph (compact like HTML)
          h.bodyText(
            `Evidence: ${d.supportingDocuments.map(e => `${e.reference} (${(e.status || '').toLowerCase()})`).join(' · ')}${d.requestedResponse ? `. PM response required within 1 week per Clause 61.4.` : ''}`,
            SM
          ),

          h.spacer(80),
          h.signatureGrid([d.fromParty?.split(' — ')[0] || 'Contractor', d.toParty?.split(' — ')[0] || 'Project Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — CONCISE (Slate #475569, Arial, left-border headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: DelayData): Document {
  const A = SLATE;
  const hdr = h.accentHeader('Delay Notification \u2014 Concise', A);
  const ftr = h.accentFooter(d.documentRef, 'Concise', A);

  // Build cost summary inline string
  const costInline = d.costItems.length > 0
    ? d.costItems.map(c => `${c.element} £${(c.amount || '').replace(/^£/, '')}`).join(' · ') +
      `. Formal quotation to follow under Cl. 62.3 with revised programme per Cl. 62.2.`
    : d.costNarrative || '';

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── Cover ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['DELAY NOTIFICATION'], `${d.projectName || ''} \u00B7 ${d.documentRef} \u00B7 ${d.letterDate || ''}`, A, SLATE_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.letterDate },
            { label: 'Contract', value: `${d.contractRef}${d.contractForm ? ' — ' + d.contractForm : ''}` },
            { label: 'From', value: d.fromParty },
            { label: 'Clause', value: d.notificationClause },
            { label: 'EOT Sought', value: d.extensionSought },
            { label: 'Cost', value: d.estimatedCost ? `£${d.estimatedCost.replace(/^£/, '')} (reserved)` : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },

      // ── Body — compact single page ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          leftBorderHead('Notice Details', A),
          h.coverInfoTable([
            { label: 'Ref', value: d.documentRef },
            { label: 'Date', value: d.letterDate },
            { label: 'Contract', value: `${d.contractRef}${d.contractForm ? ' — ' + d.contractForm : ''}` },
            { label: 'From / To', value: `${d.fromParty} \u2192 ${d.toParty}` },
            { label: 'Clause', value: d.notificationClause },
            { label: 'Event Date', value: d.letterDate },
          ], A, W),

          leftBorderHead('Event Summary', A),
          ...h.richBodyText(d.eventDescription || ''),

          leftBorderHead('Programme Impact', A),
          ...h.richBodyText(d.programmeImpact || ''),

          leftBorderHead(`Cost Impact \u2014 ${d.estimatedCost ? '£' + d.estimatedCost.replace(/^£/, '') : ''} (reserved)`, A),
          h.bodyText(costInline, SM),

          leftBorderHead('Required Response', A),
          h.bodyText(
            d.requestedResponse ||
            'PM response required within 1 week per Cl. 61.4. Non-response = deemed acceptance. Without prejudice to other rights.',
            SM
          ),

          h.spacer(80),
          h.signatureGrid([d.fromParty?.split(' — ')[0] || 'Contractor', d.toParty?.split(' — ')[0] || 'Project Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildDelayTemplateDocument(
  content: any,
  templateSlug: DelayTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'formal-letter': return buildT1(d);
    case 'corporate':     return buildT2(d);
    case 'concise':       return buildT3(d);
    default:              return buildT1(d);
  }
}
