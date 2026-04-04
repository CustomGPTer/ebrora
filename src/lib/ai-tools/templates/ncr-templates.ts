// =============================================================================
// NCR Builder — Multi-Template Engine (REBUILT)
// 6 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, comprehensive, root cause, corrective)
// T2 — ISO 9001 Formal    (navy #1e293b, ISO clause structure, disposition)
// T3 — Red Alert           (red #DC2626, urgent, KPI dashboard, stop-work)
// T4 — Compact Close-Out   (grey #374151, status tracker, close-out verification)
// T5 — Supplier NCR        (orange #92400E, contra-charge, supplier response)
// T6 — Audit Trail         (teal #0f766e, document control, evidence refs)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { NcrTemplateSlug } from '@/lib/ncr/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

const GREEN = '059669'; const GREEN_DARK = '143D2B';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const RED = 'DC2626'; const RED_D = '991B1B'; const RED_BG = 'FEF2F2';
const ORANGE = '92400E'; const ORANGE_BG = 'FFFBEB';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa';
const GREY_C = '374151';
const AMBER = 'D97706';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ───────────────────────────────────────────────────────────
interface NcrData {
  ncrRef: string; ncrDate: string; ncrCategory: string; severity: string; stopWork: string;
  projectName: string; contractRef: string; discipline: string; raisedBy: string;
  location: string; element: string; closeOutDue: string; status: string;
  specRequirement: string; specClause: string; drawingRef: string; standardRef: string; tolerances: string;
  actualCondition: string; measurements: string; photosAvailable: string;
  rootCauseMethod: string; rootCause: string; fiveWhys: Array<{ why: string; answer: string }>;
  containmentActions: Array<{ action: string; by: string; date: string }>;
  correctiveActions: Array<{ action: string; owner: string; targetDate: string; verificationMethod: string; status: string; closedDate: string }>;
  preventiveActions: Array<{ action: string; owner: string; targetDate: string }>;
  disposition: string; dispositionJustification: string;
  riskAssessment: string; costImpact: string; programmeImpact: string;
  supplierName: string; supplierContact: string; poRef: string; deliveryNoteRef: string;
  supplierResponseRequired: string; supplierResponseDeadline: string; backChargeAmount: string;
  costItems: Array<{ element: string; estimate: string; status: string }>;
  evidenceLog: Array<{ item: string; detail: string; evidenceRef: string }>;
  verificationChain: Array<{ role: string; name: string; action: string; date: string }>;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  closeOutDate: string; closeOutBy: string; closeOutEvidence: string;
  isoClassification: Array<{ field: string; value: string }>;
  isoCorrectiveActions: Array<{ clause: string; requirement: string; action: string; owner: string; due: string }>;
  dispositionOptions: Array<{ option: string; detail: string }>;
  kpiItems: Array<{ value: string; label: string; sublabel?: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): NcrData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    ncrRef: s('ncrRef', 'NCR-001'), ncrDate: s('ncrDate'), ncrCategory: s('ncrCategory'), severity: s('severity'), stopWork: s('stopWork'),
    projectName: s('projectName'), contractRef: s('contractRef'), discipline: s('discipline'), raisedBy: s('raisedBy'),
    location: s('location'), element: s('element'), closeOutDue: s('closeOutDue'), status: s('status', 'Open'),
    specRequirement: s('specRequirement'), specClause: s('specClause'), drawingRef: s('drawingRef'), standardRef: s('standardRef'), tolerances: s('tolerances'),
    actualCondition: s('actualCondition'), measurements: s('measurements'), photosAvailable: s('photosAvailable'),
    rootCauseMethod: s('rootCauseMethod', '5-Whys'), rootCause: s('rootCause'), fiveWhys: a('fiveWhys'),
    containmentActions: a('containmentActions'), correctiveActions: a('correctiveActions'), preventiveActions: a('preventiveActions'),
    disposition: s('disposition'), dispositionJustification: s('dispositionJustification'),
    riskAssessment: s('riskAssessment'), costImpact: s('costImpact'), programmeImpact: s('programmeImpact'),
    supplierName: s('supplierName'), supplierContact: s('supplierContact'), poRef: s('poRef'), deliveryNoteRef: s('deliveryNoteRef'),
    supplierResponseRequired: s('supplierResponseRequired'), supplierResponseDeadline: s('supplierResponseDeadline'), backChargeAmount: s('backChargeAmount'),
    costItems: a('costItems'), evidenceLog: a('evidenceLog'), verificationChain: a('verificationChain'),
    revisionHistory: a('revisionHistory'),
    closeOutDate: s('closeOutDate'), closeOutBy: s('closeOutBy'), closeOutEvidence: s('closeOutEvidence'),
    isoClassification: a('isoClassification'), isoCorrectiveActions: a('isoCorrectiveActions'), dispositionOptions: a('dispositionOptions'),
    kpiItems: a('kpiItems'),
    additionalNotes: s('additionalNotes'),
  };
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; color?: string; fontSize?: number }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || BODY, font: 'Arial', color: opts?.color })] })] });
}
function pillCell(text: string, width: number): TableCell {
  const c = (text || '').toLowerCase();
  const color = c.includes('done') || c.includes('closed') || c.includes('active') ? '059669' : c.includes('progress') || c.includes('planned') || c.includes('requested') ? AMBER : c.includes('pending') || c.includes('contingency') ? GREY : RED;
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color })] })] });
}
function accentInfoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.32); const vw = W - lw;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial', color: lc })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial', color: r.value?.includes('FAIL') || r.value?.includes('Major') ? RED : undefined, bold: r.value?.includes('FAIL') || r.value?.includes('Major') })] })] }),
    ] })) });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: NcrData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Non-Conformance Report', A);
  const ftr = h.accentFooter(d.ncrRef, 'Ebrora Standard', A);
  const caCols = [Math.round(W * 0.38), Math.round(W * 0.18), Math.round(W * 0.16)]; caCols.push(W - caCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['NON-CONFORMANCE', 'REPORT'], d.actualCondition?.substring(0, 80) || d.ncrCategory || '', GREEN_DARK, 'A7F3D0'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR Reference', value: d.ncrRef }, { label: 'Date Raised', value: d.ncrDate },
            { label: 'Close-Out Due', value: d.closeOutDue }, { label: 'Project', value: d.projectName },
            { label: 'Raised By', value: d.raisedBy }, { label: 'Category', value: d.ncrCategory },
            { label: 'Element', value: d.element }, { label: 'Non-Conformance', value: d.actualCondition?.substring(0, 120) },
            { label: 'Status', value: d.status },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'Non-Conformance Description', A), h.spacer(80),
          ...h.richBodyText(d.actualCondition || ''),

          h.spacer(120), h.fullWidthSectionBar('02', 'Specification Requirement', A), h.spacer(80),
          accentInfoTable([
            { label: 'Specified Mix / Requirement', value: d.specRequirement },
            { label: 'Specification Reference', value: `${d.specClause} ${d.standardRef}` },
            { label: 'Required Value', value: d.tolerances },
            { label: 'Actual Result', value: d.measurements },
            { label: 'Location', value: d.location },
            { label: 'Structural Drawings', value: d.drawingRef },
          ], 'f0fdf4', A),

          h.spacer(120), h.fullWidthSectionBar('03', 'Root Cause Analysis', A), h.spacer(80),
          ...h.richBodyText(d.rootCause || ''),

          h.spacer(120), h.fullWidthSectionBar('04', 'Corrective Actions', A), h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: caCols,
            rows: [
              new TableRow({ children: [hdrCell('Action', caCols[0], A), hdrCell('Owner', caCols[1], A), hdrCell('Target', caCols[2], A), hdrCell('Status', caCols[3], A)] }),
              ...d.correctiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(ca.action, caCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, caCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.targetDate, caCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(ca.status, caCols[3]),
              ] })),
            ] }),

          ...(d.programmeImpact || d.costImpact ? [h.spacer(80), h.calloutBox(
            `${d.programmeImpact || ''} ${d.costImpact || ''}`,
            AMBER, ORANGE_BG, '78350F', W,
            { boldPrefix: 'Interim Measure:' }
          )] : []),

          h.spacer(120), h.signatureGrid(['Raised By', 'Site Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — ISO 9001 FORMAL (Navy #1e293b)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: NcrData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('ISO 9001 NCR', A);
  const ftr = h.accentFooter(d.ncrRef, 'ISO 9001 Formal', A);
  const isoCols = [Math.round(W * 0.10), Math.round(W * 0.20), Math.round(W * 0.34), Math.round(W * 0.16)]; isoCols.push(W - isoCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['ISO 9001:2015', 'NON-CONFORMANCE REPORT'], 'Quality Management System \u2014 Clause 10.2', A, '93C5FD'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR No.', value: d.ncrRef }, { label: 'ISO Clause', value: '10.2 \u2014 Nonconformity and Corrective Action' },
            { label: 'Classification', value: d.ncrCategory }, { label: 'Element', value: d.element || d.actualCondition?.substring(0, 60) },
            { label: 'QMS Procedure Ref', value: d.contractRef || 'BAR-QP-012' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('1.0', 'NCR Classification (ISO 9001:2015 Cl.10.2)', A), h.spacer(80),
          ...(d.isoClassification.length > 0 ? [accentInfoTable(
            d.isoClassification.map(ic => ({ label: ic.field, value: ic.value })), NAVY_BG, A
          )] : [accentInfoTable([
            { label: 'Classification', value: d.ncrCategory },
            { label: 'NC Type', value: d.discipline || 'Product Non-Conformance' },
            { label: 'ISO 9001 Clause', value: '10.2.1(a) \u2014 React to the nonconformity' },
            { label: 'Affected Process', value: d.contractRef || '' },
            { label: 'NC Identified By', value: d.raisedBy },
          ], NAVY_BG, A)]),

          h.spacer(120), h.fullWidthSectionBar('2.0', 'Non-Conformance Detail', A), h.spacer(80),
          ...h.richBodyText(d.actualCondition || ''),

          h.spacer(120), h.fullWidthSectionBar('3.0', 'Corrective Action (ISO 9001 Cl.10.2.1)', A), h.spacer(80),
          ...(d.isoCorrectiveActions.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: isoCols,
            rows: [
              new TableRow({ children: [hdrCell('Cl.', isoCols[0], A), hdrCell('Requirement', isoCols[1], A), hdrCell('Action', isoCols[2], A), hdrCell('Owner', isoCols[3], A), hdrCell('Due', isoCols[4], A)] }),
              ...d.isoCorrectiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(ca.clause, isoCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.requirement, isoCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.action, isoCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, isoCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.due, isoCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          h.spacer(120), h.fullWidthSectionBar('4.0', 'Disposition of Non-Conforming Product (Cl.8.7)', A), h.spacer(80),
          ...(d.dispositionOptions.length > 0 ? [accentInfoTable(
            d.dispositionOptions.map(o => ({ label: o.option, value: o.detail })), NAVY_BG, A
          )] : [accentInfoTable([
            { label: 'Current Status', value: d.disposition || 'HOLD' },
            { label: 'Justification', value: d.dispositionJustification || '' },
          ], NAVY_BG, A)]),

          h.spacer(120), h.signatureGrid(['Quality Manager', 'Management Rep (Cl.5.3)'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — RED ALERT (Red #DC2626 / dark #991B1B)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: NcrData): Document {
  const A = RED;
  const hdr = h.accentHeader('\u26A0 RED ALERT NCR', A);
  const ftr = h.accentFooter(d.ncrRef, 'Red Alert', A);
  const actCols = [Math.round(W * 0.06), Math.round(W * 0.46), Math.round(W * 0.20)]; actCols.push(W - actCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['\u26A0 RED ALERT NCR'], d.actualCondition?.substring(0, 80)?.toUpperCase() || 'IMMEDIATE ACTION REQUIRED', RED_D, 'FCA5A5'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
            { label: 'Alert Level', value: d.severity || 'RED \u2014 Safety Implication' },
            { label: 'Element', value: d.element },
            { label: 'Immediate Action', value: d.stopWork || 'NO CONSTRUCTION ON AFFECTED ELEMENT until cleared' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // Danger banner
          h.warningBanner('STOP \u2014 ' + (d.stopWork || 'DO NOT PROCEED UNTIL ENGINEER CLEARS'), RED_BG, RED_D, W),
          h.spacer(80),

          // Safety callout
          h.calloutBox(
            d.riskAssessment || d.actualCondition || '',
            RED, RED_BG, RED_D, W,
            { boldPrefix: 'SAFETY IMPLICATION:' }
          ),
          h.spacer(80),

          // NC Summary with KPI dashboard
          h.fullWidthSectionBar('', 'Non-Conformance Summary', A), h.spacer(80),
          ...(d.kpiItems.length > 0 ? [h.kpiDashboard(d.kpiItems, A, W)] : []),

          // Immediate Actions
          h.spacer(120), h.fullWidthSectionBar('', 'Immediate Actions Required', A), h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: actCols,
            rows: [
              new TableRow({ children: [hdrCell('#', actCols[0], A), hdrCell('Action', actCols[1], A), hdrCell('Owner', actCols[2], A), hdrCell('Deadline', actCols[3], A)] }),
              ...d.correctiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(String(ri + 1), actCols[0], { bold: true, color: RED, fontSize: 28 }),
                txtCell(ca.action, actCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, actCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.targetDate, actCols[3], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // Programme impact callout
          ...(d.programmeImpact ? [h.spacer(80), h.calloutBox(d.programmeImpact, RED, RED_BG, RED_D, W, { boldPrefix: 'Programme Impact:' })] : []),

          h.spacer(120), h.signatureGrid(['Raised By', 'Acknowledged By'], RED, W),
          h.spacer(80), ...h.endMark(RED),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — COMPACT CLOSE-OUT (Grey #374151)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: NcrData): Document {
  const A = GREY_C;
  const hdr = h.accentHeader('NCR Close-Out', A);
  const ftr = h.accentFooter(d.ncrRef, 'Compact Close-Out', A);
  const trkCols = [Math.round(W * 0.06), Math.round(W * 0.36), Math.round(W * 0.14), Math.round(W * 0.10), Math.round(W * 0.14)]; trkCols.push(W - trkCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['NCR CLOSE-OUT', 'RECORD'], 'Compact Status Tracking \u2014 For QA Register', A, 'D1D5DB'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR', value: d.ncrRef }, { label: 'Raised', value: d.ncrDate },
            { label: 'Close-Out Due', value: d.closeOutDue }, { label: 'Status', value: d.status },
            { label: 'Element', value: d.element },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'NCR Summary', A), h.spacer(80),
          accentInfoTable([
            { label: 'NCR Ref', value: d.ncrRef }, { label: 'Category', value: d.ncrCategory },
            { label: 'Element', value: d.element }, { label: 'Non-Conformance', value: d.actualCondition?.substring(0, 120) },
            { label: 'Root Cause', value: d.rootCause?.substring(0, 120) },
            { label: 'Disposition', value: d.disposition },
          ], 'F9FAFB', A),

          h.spacer(120), h.fullWidthSectionBar('', 'Corrective Actions \u2014 Status Tracker', A), h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: trkCols,
            rows: [
              new TableRow({ children: [hdrCell('#', trkCols[0], A), hdrCell('Action', trkCols[1], A), hdrCell('Owner', trkCols[2], A), hdrCell('Due', trkCols[3], A), hdrCell('Status', trkCols[4], A), hdrCell('Closed', trkCols[5], A)] }),
              ...d.correctiveActions.map((ca, ri) => new TableRow({ children: [
                txtCell(String(ri + 1), trkCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.action, trkCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.owner, trkCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ca.targetDate, trkCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                pillCell(ca.status, trkCols[4]),
                txtCell(ca.closedDate || '\u2014', trkCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          h.spacer(120), h.fullWidthSectionBar('', 'Close-Out Verification', A), h.spacer(80),
          accentInfoTable([
            { label: 'Core Test Results', value: d.closeOutEvidence || '' },
            { label: 'Engineer\u2019s Decision', value: d.dispositionJustification || '' },
            { label: 'Root Cause Confirmed?', value: d.rootCause ? 'See root cause above' : '' },
            { label: 'Recurrence Prevention Verified?', value: '' },
            { label: 'NCR Closed By', value: d.closeOutBy || '' },
          ], 'F9FAFB', A),

          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T5 — SUPPLIER NCR (Orange #92400E)
// ═════════════════════════════════════════════════════════════════════════════
function buildT5(d: NcrData): Document {
  const A = ORANGE;
  const hdr = h.accentHeader('Supplier NCR', A);
  const ftr = h.accentFooter(d.ncrRef, 'Supplier NCR', A);
  const costCols = [Math.round(W * 0.50), Math.round(W * 0.22)]; costCols.push(W - costCols[0] - costCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SUPPLIER NCR'], `Non-Conformance Against Supplier \u2014 ${d.supplierName || ''}`, A, 'FDE68A'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR Ref', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
            { label: 'Supplier', value: d.supplierName },
            { label: 'Supply Contract', value: d.poRef },
            { label: 'Non-Conformance', value: d.actualCondition?.substring(0, 100) },
            { label: 'Cost Impact', value: d.backChargeAmount || d.costImpact },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'Supplier Non-Conformance Detail', A), h.spacer(80),
          accentInfoTable([
            { label: 'Supplier', value: `${d.supplierName} \u2014 ${d.supplierContact || ''}` },
            { label: 'Delivery Date', value: d.ncrDate },
            { label: 'Delivery Notes', value: d.deliveryNoteRef },
            { label: 'Ordered', value: d.specRequirement },
            { label: 'Non-Conformance', value: d.actualCondition },
          ], ORANGE_BG, A),

          h.spacer(120), h.fullWidthSectionBar('', 'Cost Impact \u2014 Contra-Charge Notification', A), h.spacer(80),
          ...(d.costItems.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: costCols,
            rows: [
              new TableRow({ children: [hdrCell('Cost Element', costCols[0], A), hdrCell('Estimate (\u00A3)', costCols[1], A), hdrCell('Status', costCols[2], A)] }),
              ...d.costItems.map((ci, ri) => new TableRow({ children: [
                txtCell(ci.element, costCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, bold: ci.element?.includes('TOTAL') }),
                txtCell(ci.estimate, costCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, bold: ci.element?.includes('TOTAL') }),
                pillCell(ci.status, costCols[2]),
              ] })),
            ] })] : h.richBodyText(d.costImpact || '')),

          h.spacer(80),
          h.calloutBox(
            d.supplierResponseRequired || `${d.supplierName} is required to provide a root cause analysis, corrective actions, and response to the contra-charge notification within ${d.supplierResponseDeadline || '5 working days'}.`,
            AMBER, ORANGE_BG, '78350F', W,
            { boldPrefix: 'Supplier Response Required:' }
          ),

          h.spacer(120), h.fullWidthSectionBar('', 'Supplier Response', A), h.spacer(80),
          accentInfoTable([
            { label: 'Root Cause Explanation', value: '' },
            { label: 'Corrective Actions Taken', value: '' },
            { label: 'Contra-Charge Accepted?', value: '\u2610 Accepted   \u2610 Disputed (attach response)' },
            { label: 'Supplier Signature', value: 'Name: ________  Date: ________' },
          ], ORANGE_BG, A),

          h.spacer(120), h.signatureGrid(['Commercial Manager', 'Supplier'], AMBER, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T6 — AUDIT TRAIL (Teal #0f766e)
// ═════════════════════════════════════════════════════════════════════════════
function buildT6(d: NcrData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('NCR Audit Trail', A);
  const ftr = h.accentFooter(d.ncrRef, 'Audit Trail', A);
  const revCols = [Math.round(W * 0.08), Math.round(W * 0.14), Math.round(W * 0.52)]; revCols.push(W - revCols.reduce((a, b) => a + b, 0));
  const evCols = [Math.round(W * 0.16), Math.round(W * 0.42)]; evCols.push(W - evCols[0] - evCols[1]);
  const vcCols = [Math.round(W * 0.18), Math.round(W * 0.18), Math.round(W * 0.34), Math.round(W * 0.14)]; vcCols.push(W - vcCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['NCR \u2014 AUDIT TRAIL'], 'Document-Controlled Non-Conformance Record', A, '99F6E4'),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'NCR Ref', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
            { label: 'Classification', value: d.ncrCategory },
            { label: 'Revision', value: d.revisionHistory?.[0]?.rev || 'Rev A' },
            { label: 'Confidentiality', value: 'Commercial in Confidence' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // Document Control
          h.fullWidthSectionBar('', 'Document Control', A), h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: revCols,
            rows: [
              new TableRow({ children: [hdrCell('Rev', revCols[0], A), hdrCell('Date', revCols[1], A), hdrCell('Description', revCols[2], A), hdrCell('Author', revCols[3], A)] }),
              ...d.revisionHistory.map((r, ri) => new TableRow({ children: [
                txtCell(r.rev, revCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.date, revCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.description, revCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.author, revCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // NCR Detail with Evidence
          h.spacer(120), h.fullWidthSectionBar('', 'NCR Detail \u2014 With Evidence References', A), h.spacer(80),
          ...(d.evidenceLog.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: evCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', evCols[0], A), hdrCell('Detail', evCols[1], A), hdrCell('Evidence Reference', evCols[2], A)] }),
              ...d.evidenceLog.map((ev, ri) => new TableRow({ children: [
                txtCell(ev.item, evCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ev.detail, evCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ev.evidenceRef, evCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : h.richBodyText(d.actualCondition || '')),

          // Verification Chain
          h.spacer(120), h.fullWidthSectionBar('', 'Verification Chain', A), h.spacer(80),
          ...(d.verificationChain.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: vcCols,
            rows: [
              new TableRow({ children: [hdrCell('Role', vcCols[0], A), hdrCell('Name', vcCols[1], A), hdrCell('Action', vcCols[2], A), hdrCell('Signature', vcCols[3], A), hdrCell('Date', vcCols[4], A)] }),
              ...d.verificationChain.map((vc, ri) => new TableRow({ children: [
                txtCell(vc.role, vcCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(vc.name, vcCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(vc.action, vcCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell('', vcCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(vc.date, vcCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // Audit trail note
          h.spacer(80),
          h.calloutBox(
            d.additionalNotes || 'All evidence documents referenced above are held in the project quality file. This NCR record is maintained as a controlled document.',
            A, TEAL_BG, '134e4a', W,
            { boldPrefix: 'Audit Trail Note:' }
          ),

          h.spacer(120), h.signatureGrid(['Quality Manager', 'H&S / Quality Director'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildNcrTemplateDocument(
  content: any,
  templateSlug: NcrTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':  return buildT1(d);
    case 'iso-9001-formal':  return buildT2(d);
    case 'red-alert':        return buildT3(d);
    case 'compact-closeout': return buildT4(d);
    case 'supplier-ncr':     return buildT5(d);
    case 'audit-trail':      return buildT6(d);
    default:                 return buildT1(d);
  }
}
