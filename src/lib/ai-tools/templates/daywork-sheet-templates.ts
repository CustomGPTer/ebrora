// =============================================================================
// Daywork Sheet Builder — Multi-Template Engine (REBUILT)
// 8 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard          (#059669 green, standard L/P/M/Summary)
// T2 — CECA Civil                (#92400E amber, CIJC grades, CECA schedule rates)
// T3 — NEC4 Record               (#1e3a5f navy, Defined Cost, CE support)
// T4 — Subcontractor Valuation   (#c2410c orange, Submitted vs Agreed)
// T5 — Compact Field             (#374151 grey, single page, two-column)
// T6 — JCT Prime Cost            (#1e40af blue, RICS definition, % additions)
// T7 — Weekly Summary            (#0f766e teal, Mon-Fri grid, cumulative KPI)
// T8 — Audit Trail               (#1e293b navy, evidence refs, verification chain)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { DayworkSheetTemplateSlug } from '@/lib/daywork-sheet/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'ECFDF5';
const AMBER_O = '92400E'; const AMBER_SUB = 'FDE68A'; const AMBER_BG = 'FFFBEB';
const NAVY = '1e293b'; const NAVY_SUB = '93C5FD'; const NAVY_BG = 'f1f5f9';
const DBLUE = '1e3a5f'; const DBLUE_BG = 'f0f4f8';
const ORANGE = 'c2410c'; const ORANGE_SUB = 'FED7AA'; const ORANGE_BG = 'FFF7ED';
const GREY_C = '374151'; const GREY_SUB = 'D1D5DB';
const BLUE = '1e40af'; const BLUE_SUB = 'BFDBFE'; const BLUE_BG = 'eff6ff';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4'; const TEAL_BG = 'f0fdfa';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface (superset for all 8 templates) ────────────────────────────
interface DwData {
  documentRef: string; date: string; projectName: string; contractRef: string;
  contractor: string; instructionRef: string; instructedBy: string; activity: string;
  location: string; relatedCe: string; grandTotal: string;
  labour: Array<{ name: string; trade: string; cscs?: string; start: string; end: string; normalHrs: string; otHrs: string; rate: string; total: string; cijcGrade?: string; niAddition?: string; cecaTotal?: string; category?: string; definedCostRate?: string; definedCost?: string; primeCostRate?: string; percentAddition?: string; submittedRate?: string; agreedRate?: string; variance?: string; assessed?: string; cscsRef?: string; evidence?: string }>;
  plant: Array<{ description: string; hireType?: string; hours: string; productive?: string; standing?: string; rate: string; total: string; cecaCategory?: string; cecaRate?: string; ownership?: string; equipmentRate?: string; definedCost?: string; basis?: string; submittedRate?: string; agreedRate?: string; variance?: string; assessed?: string; hireCo?: string; invoiceRef?: string }>;
  materials: Array<{ description: string; qty: string; unit?: string; unitCost?: string; total: string; invoiceRef?: string; invoiceCost?: string; cecaAddition?: string; cecaTotal?: string; definedCost?: string; source?: string; percentAddition?: string; additionAmount?: string; supplier?: string; deliveryTicket?: string; submittedCost?: string; agreedMarkup?: string; assessed?: string }>;
  supervision: Array<{ name: string; role: string; hours: string; rate: string; total: string }>;
  summary: Array<{ element: string; amount: string; addition?: string; total?: string }>;
  overheadPercent: string; overheadAmount: string; subtotal: string;
  // T3 NEC4
  ceReference: string; quotationRef: string; schedule: string; ceDescription: string;
  feePercent: string; feeAmount: string; definedCostTotal: string;
  // T4 Subcontractor
  subcontractorName: string; subContractRef: string; packageDescription: string;
  mainContractor: string; paymentApp: string; cumulativeCallout: string;
  // T7 Weekly
  weekCommencing: string; dailySheets: Array<{ day: string; dwRef: string; instruction: string; activity: string; dailyTotal: string }>;
  weeklyLabourGrid: Array<{ operative: string; mon: string; tue: string; wed: string; thu: string; fri: string; weekTotal: string }>;
  weeklyKpis: Array<{ value: string; label: string; sublabel?: string }>;
  cumulativeTotal: string;
  // T8 Audit
  instructionRecord: Array<{ label: string; value: string }>;
  photoEvidence: Array<{ ref: string; time: string; description: string; takenBy: string }>;
  verificationChain: Array<{ role: string; name: string; date: string; verification: string }>;
  disputeNote: string; confidentiality: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): DwData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef', 'DW-001'), date: s('date'), projectName: s('projectName'),
    contractRef: s('contractRef'), contractor: s('contractor'), instructionRef: s('instructionRef'),
    instructedBy: s('instructedBy'), activity: s('activity'), location: s('location'),
    relatedCe: s('relatedCe'), grandTotal: s('grandTotal'),
    labour: a('labour'), plant: a('plant'), materials: a('materials'),
    supervision: a('supervision'), summary: a('summary'),
    overheadPercent: s('overheadPercent'), overheadAmount: s('overheadAmount'), subtotal: s('subtotal'),
    ceReference: s('ceReference'), quotationRef: s('quotationRef'), schedule: s('schedule'),
    ceDescription: s('ceDescription'), feePercent: s('feePercent'), feeAmount: s('feeAmount'),
    definedCostTotal: s('definedCostTotal'),
    subcontractorName: s('subcontractorName'), subContractRef: s('subContractRef'),
    packageDescription: s('packageDescription'), mainContractor: s('mainContractor'),
    paymentApp: s('paymentApp'), cumulativeCallout: s('cumulativeCallout'),
    weekCommencing: s('weekCommencing'), dailySheets: a('dailySheets'),
    weeklyLabourGrid: a('weeklyLabourGrid'), weeklyKpis: a('weeklyKpis'),
    cumulativeTotal: s('cumulativeTotal'),
    instructionRecord: a('instructionRecord'), photoEvidence: a('photoEvidence'),
    verificationChain: a('verificationChain'), disputeNote: s('disputeNote'),
    confidentiality: s('confidentiality'), additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(t: string, w: number, a: string) { return h.headerCell(t, w, { fillColor: a, color: 'FFFFFF', fontSize: SM }); }
function txtCell(t: string, w: number, opts?: { bg?: string; bold?: boolean; color?: string }) { return h.dataCell(t, w, { fillColor: opts?.bg, bold: opts?.bold, color: opts?.color, fontSize: SM }); }
function dt(accent: string, hdrs: { text: string; width: number }[], rows: any[][]): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: hdrs.map(h2 => h2.width),
    rows: [new TableRow({ children: hdrs.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({ children: cells.map((cell, ci) =>
        txtCell(String(cell || ''), hdrs[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined, bold: (cell || '').toString().includes('TOTAL') || (cell || '').toString().includes('Total') })) }))] });
}
function cols(ratios: number[]): number[] {
  const w = ratios.map(r => Math.round(W * r));
  w[w.length - 1] = W - w.slice(0, -1).reduce((a, b) => a + b, 0);
  return w;
}
function labourTotal(d: DwData): string { return d.labour.reduce((s, l) => s + (parseFloat(l.total) || 0), 0).toFixed(2); }
function plantTotal(d: DwData): string { return d.plant.reduce((s, p) => s + (parseFloat(p.total) || 0), 0).toFixed(2); }
function matTotal(d: DwData): string { return d.materials.reduce((s, m) => s + (parseFloat(m.total) || 0), 0).toFixed(2); }
function supTotal(d: DwData): string { return d.supervision.reduce((s, sv) => s + (parseFloat(sv.total) || 0), 0).toFixed(2); }


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (#059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: DwData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Daywork Sheet', A); const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);
  const lCols = cols([0.16, 0.18, 0.08, 0.07, 0.07, 0.08, 0.06, 0.12, 0.18]);
  const pCols = cols([0.30, 0.10, 0.08, 0.10, 0.10, 0.14, 0.18]);
  const mCols = cols([0.30, 0.06, 0.06, 0.14, 0.14, 0.30]);
  const sCols = cols([0.16, 0.24, 0.14, 0.16, 0.30]);
  const sumCols = cols([0.60, 0.40]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['DAYWORK SHEET'], d.projectName || '', A, GREEN_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Daywork Reference', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'Project', value: d.projectName }, { label: 'Contract', value: d.contractRef },
            { label: 'Contractor', value: d.contractor }, { label: 'Instruction', value: `${d.instructionRef} \u2014 ${d.activity}` },
            { label: 'Instructed By', value: d.instructedBy }, { label: 'Grand Total', value: d.grandTotal },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'INSTRUCTION & ACTIVITY DETAILS', A), h.spacer(80),
          h.coverInfoTable([
            { label: 'Instruction Ref', value: d.instructionRef }, { label: 'Activity', value: d.activity },
            { label: 'Location', value: d.location }, { label: 'Related CE', value: d.relatedCe },
          ], A, W),
          h.spacer(80), h.fullWidthSectionBar('02', 'LABOUR RECORD', A), h.spacer(80),
          dt(A, [{ text: 'NAME', width: lCols[0] }, { text: 'TRADE / GRADE', width: lCols[1] }, { text: 'CSCS', width: lCols[2] }, { text: 'START', width: lCols[3] }, { text: 'END', width: lCols[4] }, { text: 'NORMAL', width: lCols[5] }, { text: 'O/T', width: lCols[6] }, { text: 'RATE (\u00A3/hr)', width: lCols[7] }, { text: 'TOTAL (\u00A3)', width: lCols[8] }],
            [...d.labour.map(l => [l.name, l.trade, l.cscs || '', l.start, l.end, l.normalHrs, l.otHrs, l.rate, l.total]),
             ['LABOUR TOTAL', '', '', '', '', '', '', '', `\u00A3${labourTotal(d)}`]]),
          h.spacer(80), h.fullWidthSectionBar('03', 'PLANT & EQUIPMENT', A), h.spacer(80),
          dt(A, [{ text: 'DESCRIPTION', width: pCols[0] }, { text: 'HIRE TYPE', width: pCols[1] }, { text: 'HOURS', width: pCols[2] }, { text: 'PRODUCTIVE', width: pCols[3] }, { text: 'STANDING', width: pCols[4] }, { text: 'RATE (\u00A3/hr)', width: pCols[5] }, { text: 'TOTAL (\u00A3)', width: pCols[6] }],
            [...d.plant.map(p => [p.description, p.hireType || '', p.hours, p.productive || '', p.standing || '', p.rate, p.total]),
             ['PLANT TOTAL', '', '', '', '', '', `\u00A3${plantTotal(d)}`]]),
          h.spacer(80), h.fullWidthSectionBar('04', 'MATERIALS & CONSUMABLES', A), h.spacer(80),
          dt(A, [{ text: 'DESCRIPTION', width: mCols[0] }, { text: 'QTY', width: mCols[1] }, { text: 'UNIT', width: mCols[2] }, { text: 'UNIT COST (\u00A3)', width: mCols[3] }, { text: 'TOTAL (\u00A3)', width: mCols[4] }, { text: 'INVOICE', width: mCols[5] }],
            [...d.materials.map(m => [m.description, m.qty, m.unit || '', m.unitCost || '', m.total, m.invoiceRef || '']),
             ['MATERIALS TOTAL', '', '', '', `\u00A3${matTotal(d)}`, '']]),
          h.spacer(80), h.fullWidthSectionBar('05', 'SUPERVISION & SUMMARY', A), h.spacer(80),
          ...(d.supervision.length > 0 ? [dt(A, [{ text: 'NAME', width: sCols[0] }, { text: 'ROLE', width: sCols[1] }, { text: 'HOURS', width: sCols[2] }, { text: 'RATE (\u00A3/hr)', width: sCols[3] }, { text: 'TOTAL (\u00A3)', width: sCols[4] }],
            [...d.supervision.map(s => [s.name, s.role, s.hours, s.rate, s.total]),
             ['SUPERVISION TOTAL', '', '', '', `\u00A3${supTotal(d)}`]])] : []),
          h.spacer(40),
          dt(A, [{ text: 'SUMMARY ELEMENT', width: sumCols[0] }, { text: 'AMOUNT (\u00A3)', width: sumCols[1] }],
            d.summary.length > 0 ? d.summary.map(s => [s.element, s.amount]) : [
              ['Labour', `\u00A3${labourTotal(d)}`], ['Plant & Equipment', `\u00A3${plantTotal(d)}`],
              ['Materials & Consumables', `\u00A3${matTotal(d)}`], ['Supervision', `\u00A3${supTotal(d)}`],
              ['Sub-Total (Nett)', d.subtotal || ''], [`Overheads & Profit (${d.overheadPercent || ''}%)`, d.overheadAmount || ''],
              ['GRAND TOTAL', d.grandTotal || '']]),
          h.spacer(80), h.signatureGrid(['Contractor', 'Client / PM'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CECA CIVIL (#92400E)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: DwData): Document {
  const A = AMBER_O;
  const hdr = h.accentHeader('CECA Daywork Sheet', A); const ftr = h.accentFooter(d.documentRef, 'CECA Civil', A);
  const lCols = cols([0.14, 0.22, 0.08, 0.08, 0.12, 0.12, 0.24]);
  const pCols = cols([0.28, 0.22, 0.10, 0.18, 0.22]);
  const mCols = cols([0.30, 0.10, 0.20, 0.18, 0.22]);
  const sCols = cols([0.30, 0.22, 0.24, 0.24]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CECA DAYWORK SHEET'], 'Schedule of Dayworks Carried Out Incidental to Contract Work', A, AMBER_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Daywork Reference', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'Contract', value: d.contractRef }, { label: 'Contractor', value: d.contractor },
            { label: 'CECA Schedule', value: 'Schedule of Dayworks (Civil Engineering) \u2014 Current Edition' },
            { label: 'Activity', value: d.activity },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'LABOUR \u2014 CIJC WORKING RULE AGREEMENT GRADES', A), h.spacer(80),
          dt(A, [{ text: 'NAME', width: lCols[0] }, { text: 'CIJC GRADE', width: lCols[1] }, { text: 'NORMAL', width: lCols[2] }, { text: 'O/T', width: lCols[3] }, { text: 'BASIC RATE', width: lCols[4] }, { text: 'NI+HOL', width: lCols[5] }, { text: 'CECA LABOUR TOTAL', width: lCols[6] }],
            [...d.labour.map(l => [l.name, l.cijcGrade || l.trade, l.normalHrs, l.otHrs, l.rate, l.niAddition || '+47.2%', l.cecaTotal || l.total]),
             ['LABOUR SUB-TOTAL (incl. CECA additions)', '', '', '', '', '', `\u00A3${labourTotal(d)}`]]),
          h.spacer(80), h.fullWidthSectionBar('', 'PLANT \u2014 CECA SCHEDULE RATES', A), h.spacer(80),
          dt(A, [{ text: 'PLANT ITEM', width: pCols[0] }, { text: 'CECA CATEGORY', width: pCols[1] }, { text: 'HOURS', width: pCols[2] }, { text: 'CECA RATE (\u00A3/hr)', width: pCols[3] }, { text: 'TOTAL (\u00A3)', width: pCols[4] }],
            [...d.plant.map(p => [p.description, p.cecaCategory || '', p.hours, p.cecaRate || p.rate, p.total]),
             ['PLANT TOTAL', '', '', '', `\u00A3${plantTotal(d)}`]]),
          h.spacer(80), h.fullWidthSectionBar('', 'MATERIALS \u2014 INVOICE COST + PERCENTAGE', A), h.spacer(80),
          dt(A, [{ text: 'MATERIAL', width: mCols[0] }, { text: 'QTY', width: mCols[1] }, { text: 'INVOICE COST (\u00A3)', width: mCols[2] }, { text: 'CECA ADDITION (15%)', width: mCols[3] }, { text: 'TOTAL (\u00A3)', width: mCols[4] }],
            [...d.materials.map(m => [m.description, m.qty, m.invoiceCost || m.total, m.cecaAddition || '', m.cecaTotal || m.total]),
             ['MATERIALS TOTAL (incl. 15%)', '', '', '', `\u00A3${matTotal(d)}`]]),
          h.spacer(80), h.fullWidthSectionBar('', 'CECA SUMMARY', A), h.spacer(80),
          dt(A, [{ text: 'ELEMENT', width: sCols[0] }, { text: 'NETT (\u00A3)', width: sCols[1] }, { text: 'CECA ADDITION', width: sCols[2] }, { text: 'TOTAL (\u00A3)', width: sCols[3] }],
            d.summary.length > 0 ? d.summary.map(s => [s.element, s.amount, s.addition || '', s.total || s.amount]) :
            [['Labour', '', '+47.2%', ''], ['Plant', '', 'At CECA rates', ''], ['Materials', '', '+15%', ''], ['Supervision', '', '\u2014', ''], ['DAYWORK TOTAL', '', '', d.grandTotal || '']]),
          h.spacer(80), h.signatureGrid(['Site Agent', 'Resident Engineer / PM'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — NEC4 RECORD (#1e3a5f, Defined Cost)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: DwData): Document {
  const A = DBLUE;
  const hdr = h.accentHeader('NEC4 Daywork Record \u2014 Defined Cost', A); const ftr = h.accentFooter(d.documentRef, 'NEC4 Record', A);
  const pCols = cols([0.18, 0.24, 0.10, 0.22, 0.26]);
  const eCols = cols([0.28, 0.18, 0.10, 0.22, 0.22]);
  const mCols = cols([0.30, 0.10, 0.28, 0.32]);
  const fCols = cols([0.60, 0.40]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['NEC4 DAYWORK RECORD'], 'Defined Cost \u2014 Compensation Event Support', A, '93C5FD'), h.spacer(200),
          h.coverInfoTable([
            { label: 'Daywork Ref', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'Contract', value: d.contractRef }, { label: 'CE Reference', value: d.ceReference || d.relatedCe },
            { label: 'Contractor', value: d.contractor }, { label: 'Quotation Ref', value: d.quotationRef || '' },
            { label: 'Schedule', value: d.schedule || 'Short Schedule of Cost Components' },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'COMPENSATION EVENT DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(d.ceDescription || d.activity || ''),
          h.spacer(80), h.fullWidthSectionBar('', 'PEOPLE \u2014 DEFINED COST (SHORT SCHEDULE)', A), h.spacer(80),
          dt(A, [{ text: 'PERSON', width: pCols[0] }, { text: 'CATEGORY (CONTRACT DATA)', width: pCols[1] }, { text: 'HOURS', width: pCols[2] }, { text: 'PEOPLE RATE (\u00A3/hr)', width: pCols[3] }, { text: 'DEFINED COST (\u00A3)', width: pCols[4] }],
            [...d.labour.map(l => [l.name, l.category || l.trade, l.normalHrs || l.start, l.definedCostRate || l.rate, l.definedCost || l.total]),
             ['PEOPLE DEFINED COST', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'EQUIPMENT \u2014 DEFINED COST', A), h.spacer(80),
          dt(A, [{ text: 'EQUIPMENT', width: eCols[0] }, { text: 'OWNERSHIP', width: eCols[1] }, { text: 'HOURS', width: eCols[2] }, { text: 'EQUIPMENT RATE (\u00A3/hr)', width: eCols[3] }, { text: 'DEFINED COST (\u00A3)', width: eCols[4] }],
            [...d.plant.map(p => [p.description, p.ownership || p.hireType || '', p.hours, p.equipmentRate || p.rate, p.definedCost || p.total]),
             ['EQUIPMENT DEFINED COST', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'MATERIALS \u2014 DEFINED COST', A), h.spacer(80),
          dt(A, [{ text: 'MATERIAL', width: mCols[0] }, { text: 'QTY', width: mCols[1] }, { text: 'DEFINED COST (\u00A3)', width: mCols[2] }, { text: 'SOURCE', width: mCols[3] }],
            [...d.materials.map(m => [m.description, m.qty, m.definedCost || m.total, m.source || m.invoiceRef || '']),
             ['MATERIALS DEFINED COST', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'FEE & TOTAL', A), h.spacer(80),
          dt(A, [{ text: 'ELEMENT', width: fCols[0] }, { text: 'AMOUNT (\u00A3)', width: fCols[1] }],
            [['Defined Cost Sub-Total', d.definedCostTotal || d.subtotal || ''],
             [`Fee (per Contract Data Part 2): ${d.feePercent || ''}`, d.feeAmount || ''],
             ['TOTAL DEFINED COST + FEE', d.grandTotal || '']]),
          h.spacer(40),
          h.calloutBox('The change to the Prices is assessed as the effect of the compensation event on the Defined Cost plus the Fee. This daywork record provides the actual Defined Cost data to support the CE quotation under Clause 62.', A, DBLUE_BG, DBLUE, W, { boldPrefix: 'NEC4 Clause 63.1:' }),
          h.spacer(80), h.signatureGrid(['Contractor PM', 'Project Manager Assessment'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — SUBCONTRACTOR VALUATION (#c2410c)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: DwData): Document {
  const A = ORANGE;
  const hdr = h.accentHeader('Subcontractor Daywork Valuation', A); const ftr = h.accentFooter(d.documentRef, 'Subcontractor Valuation', A);
  const vCols = cols([0.22, 0.08, 0.16, 0.16, 0.16, 0.22]);
  const sCols4 = cols([0.30, 0.22, 0.22, 0.26]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SUBCONTRACTOR', 'DAYWORK VALUATION'], d.subcontractorName || d.contractor, A, ORANGE_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Daywork Ref', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'Subcontractor', value: d.subcontractorName || '' }, { label: 'Sub-Contract Ref', value: d.subContractRef || '' },
            { label: 'Package', value: d.packageDescription || '' }, { label: 'Main Contractor', value: d.mainContractor || d.contractor },
            { label: 'Payment App', value: d.paymentApp || '' },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'SUBMITTED vs AGREED RATES \u2014 LABOUR', A), h.spacer(80),
          dt(A, [{ text: 'ITEM', width: vCols[0] }, { text: 'HOURS', width: vCols[1] }, { text: 'SUBMITTED (\u00A3/hr)', width: vCols[2] }, { text: 'AGREED (\u00A3/hr)', width: vCols[3] }, { text: 'VARIANCE', width: vCols[4] }, { text: 'ASSESSED (\u00A3)', width: vCols[5] }],
            [...d.labour.map(l => [l.name || l.trade, l.normalHrs || '', l.submittedRate || '', l.agreedRate || l.rate, l.variance || '', l.assessed || l.total]),
             ['LABOUR \u2014 ASSESSED VALUE', '', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'SUBMITTED vs AGREED \u2014 PLANT', A), h.spacer(80),
          dt(A, [{ text: 'ITEM', width: vCols[0] }, { text: 'HOURS', width: vCols[1] }, { text: 'SUBMITTED (\u00A3/hr)', width: vCols[2] }, { text: 'AGREED (\u00A3/hr)', width: vCols[3] }, { text: 'VARIANCE', width: vCols[4] }, { text: 'ASSESSED (\u00A3)', width: vCols[5] }],
            [...d.plant.map(p => [p.description, p.hours, p.submittedRate || '', p.agreedRate || p.rate, p.variance || '', p.assessed || p.total]),
             ['PLANT \u2014 ASSESSED VALUE', '', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'MATERIALS & SUMMARY', A), h.spacer(80),
          dt(A, [{ text: 'MATERIAL', width: cols([0.30, 0.16, 0.16, 0.16, 0.22])[0] }, { text: 'SUBMITTED (\u00A3)', width: cols([0.30, 0.16, 0.16, 0.16, 0.22])[1] }, { text: 'INVOICE (\u00A3)', width: cols([0.30, 0.16, 0.16, 0.16, 0.22])[2] }, { text: 'AGREED MARKUP', width: cols([0.30, 0.16, 0.16, 0.16, 0.22])[3] }, { text: 'ASSESSED (\u00A3)', width: cols([0.30, 0.16, 0.16, 0.16, 0.22])[4] }],
            [...d.materials.map(m => [m.description, m.submittedCost || '', m.invoiceCost || m.total, m.agreedMarkup || '', m.assessed || m.total]),
             ['MATERIALS \u2014 ASSESSED', '', '', '', '']]),
          h.spacer(40),
          dt(A, [{ text: 'SUMMARY', width: sCols4[0] }, { text: 'SUBMITTED (\u00A3)', width: sCols4[1] }, { text: 'ASSESSED (\u00A3)', width: sCols4[2] }, { text: 'VARIANCE (\u00A3)', width: sCols4[3] }],
            d.summary.length > 0 ? d.summary.map(s => [s.element, s.amount, s.total || '', s.addition || '']) :
            [['Labour', '', '', ''], ['Plant', '', '', ''], ['Materials', '', '', ''], ['TOTAL', '', d.grandTotal || '', '']]),
          ...(d.cumulativeCallout ? [h.spacer(40), h.calloutBox(d.cumulativeCallout, 'D97706', AMBER_BG, '92400E', W, { boldPrefix: 'Cumulative Daywork Total:' })] : []),
          h.spacer(80), h.signatureGrid(['Commercial Manager', 'Subcontractor'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T5 — COMPACT FIELD (#374151) — single content page
// ═════════════════════════════════════════════════════════════════════════════
function buildT5(d: DwData): Document {
  const A = GREY_C;
  const hdr = h.accentHeader('Compact Daywork', A); const ftr = h.accentFooter(d.documentRef, 'Compact Field', A);
  const lCols = cols([0.22, 0.18, 0.12, 0.16, 0.32]);
  const pCols = cols([0.40, 0.14, 0.18, 0.28]);
  const mCols = cols([0.50, 0.18, 0.32]);
  const sumCols = cols([0.60, 0.40]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['COMPACT DAYWORK SHEET'], `Field Capture \u2014 ${d.projectName || ''}`, A, GREY_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Ref', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'Contract', value: d.contractRef }, { label: 'Contractor', value: d.contractor },
            { label: 'Instruction', value: d.instructionRef }, { label: 'Total', value: d.grandTotal },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.bodyText(`Instruction: ${d.instructionRef} \u00A0|\u00A0 Activity: ${d.activity} \u00A0|\u00A0 By: ${d.instructedBy}`, SM, { bold: true }),
          h.spacer(40), h.fullWidthSectionBar('', 'LABOUR', A), h.spacer(40),
          dt(A, [{ text: 'NAME', width: lCols[0] }, { text: 'TRADE', width: lCols[1] }, { text: 'HRS', width: lCols[2] }, { text: '\u00A3/hr', width: lCols[3] }, { text: '\u00A3', width: lCols[4] }],
            [...d.labour.map(l => [l.name, l.trade, `${l.normalHrs}${l.otHrs && l.otHrs !== '0' ? `+${l.otHrs}OT` : ''}`, l.rate, l.total]),
             ['Total', '', '', '', labourTotal(d)]]),
          h.spacer(40), h.fullWidthSectionBar('', 'PLANT', A), h.spacer(40),
          dt(A, [{ text: 'ITEM', width: pCols[0] }, { text: 'HRS', width: pCols[1] }, { text: '\u00A3/hr', width: pCols[2] }, { text: '\u00A3', width: pCols[3] }],
            [...d.plant.map(p => [p.description, p.hours, p.rate, p.total]),
             ['Total', '', '', plantTotal(d)]]),
          h.spacer(40), h.fullWidthSectionBar('', 'MATERIALS', A), h.spacer(40),
          dt(A, [{ text: 'ITEM', width: mCols[0] }, { text: 'QTY', width: mCols[1] }, { text: '\u00A3', width: mCols[2] }],
            [...d.materials.map(m => [m.description, m.qty, m.total]),
             ['Total', '', matTotal(d)]]),
          h.spacer(40), h.fullWidthSectionBar('', 'SUMMARY', A), h.spacer(40),
          dt(A, [{ text: '', width: sumCols[0] }, { text: '\u00A3', width: sumCols[1] }],
            d.summary.length > 0 ? d.summary.map(s => [s.element, s.amount]) :
            [['Labour', labourTotal(d)], ['Plant', plantTotal(d)], ['Materials', matTotal(d)], ['Supervision', supTotal(d)],
             [`O&P (${d.overheadPercent || ''}%)`, d.overheadAmount || ''], ['TOTAL', d.grandTotal || '']]),
          h.spacer(80), h.signatureGrid(['Contractor', 'Client / PM'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T6 — JCT PRIME COST (#1e40af)
// ═════════════════════════════════════════════════════════════════════════════
function buildT6(d: DwData): Document {
  const A = BLUE;
  const hdr = h.accentHeader('JCT Daywork Sheet \u2014 Prime Cost', A); const ftr = h.accentFooter(d.documentRef, 'JCT Prime Cost', A);
  const lCols = cols([0.18, 0.14, 0.08, 0.18, 0.16, 0.26]);
  const pCols = cols([0.30, 0.20, 0.10, 0.18, 0.22]);
  const mCols = cols([0.34, 0.22, 0.20, 0.24]);
  const sumCols = cols([0.60, 0.40]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['JCT DAYWORK SHEET'], `RICS Definition of Prime Cost \u2014 ${d.projectName || ''}`, A, BLUE_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Daywork Ref', value: d.documentRef }, { label: 'Date', value: d.date },
            { label: 'AI / Instruction', value: d.instructionRef }, { label: 'Contract Form', value: 'JCT SBC 2016' },
            { label: 'Contractor', value: d.contractor }, { label: 'RICS Schedule', value: '3rd Edition \u2014 Prime Cost of Daywork' },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'LABOUR \u2014 PRIME COST + PERCENTAGE ADDITION', A), h.spacer(80),
          dt(A, [{ text: 'OPERATIVE', width: lCols[0] }, { text: 'GRADE', width: lCols[1] }, { text: 'HRS', width: lCols[2] }, { text: 'PRIME COST (\u00A3/hr)', width: lCols[3] }, { text: '% ADDITION', width: lCols[4] }, { text: 'TOTAL (\u00A3)', width: lCols[5] }],
            [...d.labour.map(l => [l.name, l.trade, l.normalHrs || '', l.primeCostRate || l.rate, l.percentAddition || '142%', l.total]),
             [`LABOUR (incl. % addition)`, '', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'PLANT \u2014 HIRE RATES / RICS SCHEDULE', A), h.spacer(80),
          dt(A, [{ text: 'PLANT', width: pCols[0] }, { text: 'BASIS', width: pCols[1] }, { text: 'HRS', width: pCols[2] }, { text: 'RATE (\u00A3/hr)', width: pCols[3] }, { text: 'TOTAL (\u00A3)', width: pCols[4] }],
            [...d.plant.map(p => [p.description, p.basis || p.hireType || '', p.hours, p.rate, p.total]),
             ['PLANT TOTAL', '', '', '', '']]),
          h.spacer(80), h.fullWidthSectionBar('', 'MATERIALS \u2014 NET INVOICE + PERCENTAGE', A), h.spacer(80),
          dt(A, [{ text: 'MATERIAL', width: mCols[0] }, { text: 'INVOICE COST (\u00A3)', width: mCols[1] }, { text: '% ADDITION (15%)', width: mCols[2] }, { text: 'TOTAL (\u00A3)', width: mCols[3] }],
            [...d.materials.map(m => [m.description, m.invoiceCost || m.total, m.additionAmount || '', m.cecaTotal || m.total]),
             ['MATERIALS (incl. 15%)', '', '', '']]),
          h.spacer(40),
          dt(A, [{ text: 'JCT SUMMARY', width: sumCols[0] }, { text: '\u00A3', width: sumCols[1] }],
            d.summary.length > 0 ? d.summary.map(s => [s.element, s.amount]) :
            [['Labour (prime cost + %)', ''], ['Plant (hire rates)', ''], ['Materials (invoice + 15%)', ''], ['JCT DAYWORK TOTAL', d.grandTotal || '']]),
          h.spacer(80), h.signatureGrid(['Contractor', 'Architect / CA / QS'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T7 — WEEKLY SUMMARY (#0f766e)
// ═════════════════════════════════════════════════════════════════════════════
function buildT7(d: DwData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('Weekly Daywork Summary', A); const ftr = h.accentFooter(d.documentRef || `W/C ${d.weekCommencing}`, 'Weekly Summary', A);
  const dayCols = cols([0.12, 0.14, 0.14, 0.34, 0.26]);
  const gridCols = cols([0.28, 0.10, 0.10, 0.10, 0.10, 0.10, 0.22]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['WEEKLY DAYWORK', 'SUMMARY'], `Week Commencing ${d.weekCommencing || ''} \u2014 ${d.projectName || ''}`, A, TEAL_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Week Commencing', value: d.weekCommencing }, { label: 'Contract', value: d.contractRef },
            { label: 'Contractor', value: d.contractor },
            { label: 'Daily Sheets This Week', value: d.dailySheets.map(ds => ds.dwRef).filter(r => r && r !== '\u2014').join(', ') },
            { label: 'Weekly Total', value: d.grandTotal }, { label: 'Cumulative Project Total', value: d.cumulativeTotal },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'DAILY DAYWORK SHEET REFERENCES', A), h.spacer(80),
          ...(d.dailySheets.length > 0 ? [dt(A,
            [{ text: 'DAY', width: dayCols[0] }, { text: 'DW REF', width: dayCols[1] }, { text: 'INSTRUCTION', width: dayCols[2] }, { text: 'ACTIVITY', width: dayCols[3] }, { text: 'DAILY TOTAL (\u00A3)', width: dayCols[4] }],
            [...d.dailySheets.map(ds => [ds.day, ds.dwRef, ds.instruction, ds.activity, ds.dailyTotal]),
             ['WEEKLY TOTAL', '', '', '', d.grandTotal || '']])] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'WEEKLY LABOUR HOURS GRID', A), h.spacer(80),
          ...(d.weeklyLabourGrid.length > 0 ? [dt(A,
            [{ text: 'OPERATIVE', width: gridCols[0] }, { text: 'MON', width: gridCols[1] }, { text: 'TUE', width: gridCols[2] }, { text: 'WED', width: gridCols[3] }, { text: 'THU', width: gridCols[4] }, { text: 'FRI', width: gridCols[5] }, { text: 'WEEK TOTAL', width: gridCols[6] }],
            d.weeklyLabourGrid.map(g => [g.operative, g.mon, g.tue, g.wed, g.thu, g.fri, g.weekTotal]))] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'CUMULATIVE PROJECT DAYWORK TOTAL', A), h.spacer(80),
          ...(d.weeklyKpis.length > 0
            ? [h.kpiDashboard(d.weeklyKpis.map(k => ({ value: k.value, label: k.label })), A, W)]
            : [h.kpiDashboard([
                { value: d.grandTotal || '0', label: 'This Week' },
                { value: d.cumulativeTotal || '0', label: 'Cumulative To Date' },
              ], A, W)]),
          h.spacer(80), h.signatureGrid(['Submitted By', 'Certified By'], A, W),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T8 — AUDIT TRAIL (#1e293b)
// ═════════════════════════════════════════════════════════════════════════════
function buildT8(d: DwData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Daywork Record \u2014 Audit Trail', A); const ftr = h.accentFooter(d.documentRef, 'Audit Trail', A);
  const photoCols = cols([0.18, 0.10, 0.50, 0.22]);
  const laCols = cols([0.12, 0.12, 0.12, 0.07, 0.07, 0.06, 0.06, 0.08, 0.10, 0.20]);
  const paCols = cols([0.24, 0.16, 0.08, 0.10, 0.12, 0.30]);
  const maCols = cols([0.22, 0.16, 0.08, 0.10, 0.44]);
  const vcCols = cols([0.24, 0.18, 0.10, 0.10, 0.38]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['DAYWORK RECORD', 'AUDIT TRAIL'], 'Evidence-Grade \u2014 Adjudication Ready', A, NAVY_SUB), h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef + ' Rev A' }, { label: 'Daywork Date', value: d.date },
            { label: 'Contract', value: d.contractRef }, { label: 'Contractor', value: d.contractor },
            { label: 'Instruction Type', value: '' }, { label: 'Instruction Ref', value: d.instructionRef },
            { label: 'Confidentiality', value: d.confidentiality || 'Commercial in Confidence' },
          ], A, W), h.coverFooterLine()] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'INSTRUCTION RECORD', A), h.spacer(80),
          ...(d.instructionRecord.length > 0 ? [h.coverInfoTable(d.instructionRecord, A, W)] : [
            h.coverInfoTable([
              { label: 'Instruction Type', value: '' }, { label: 'Written Ref', value: d.instructionRef },
              { label: 'Issued By', value: d.instructedBy }, { label: 'Witnessed By', value: '' },
              { label: 'Diary Entry', value: '' },
            ], A, W)
          ]),
          h.spacer(80), h.fullWidthSectionBar('02', 'PHOTOGRAPHIC EVIDENCE REGISTER', A), h.spacer(80),
          ...(d.photoEvidence.length > 0 ? [dt(A,
            [{ text: 'PHOTO REF', width: photoCols[0] }, { text: 'TIME', width: photoCols[1] }, { text: 'DESCRIPTION', width: photoCols[2] }, { text: 'TAKEN BY', width: photoCols[3] }],
            d.photoEvidence.map(p => [p.ref, p.time, p.description, p.takenBy]))] : []),
          h.spacer(80), h.fullWidthSectionBar('03', 'LABOUR \u2014 WITH EVIDENCE REFERENCES', A), h.spacer(80),
          dt(A, [{ text: 'NAME', width: laCols[0] }, { text: 'TRADE', width: laCols[1] }, { text: 'CSCS REF', width: laCols[2] }, { text: 'START', width: laCols[3] }, { text: 'END', width: laCols[4] }, { text: 'HRS', width: laCols[5] }, { text: 'RATE', width: laCols[6] }, { text: 'TOTAL', width: laCols[7] }, { text: '', width: laCols[8] }, { text: 'EVIDENCE', width: laCols[9] }],
            d.labour.map(l => [l.name, l.trade, l.cscsRef || '', l.start, l.end, l.normalHrs, l.rate, l.total, '', l.evidence || 'Sign-in sheet'])),
          h.spacer(80), h.fullWidthSectionBar('04', 'PLANT \u2014 WITH HIRE INVOICES', A), h.spacer(80),
          dt(A, [{ text: 'PLANT', width: paCols[0] }, { text: 'HIRE CO', width: paCols[1] }, { text: 'HRS', width: paCols[2] }, { text: 'RATE', width: paCols[3] }, { text: 'TOTAL', width: paCols[4] }, { text: 'INVOICE / HIRE REF', width: paCols[5] }],
            d.plant.map(p => [p.description, p.hireCo || '', p.hours, p.rate, p.total, p.invoiceRef || ''])),
          h.spacer(80), h.fullWidthSectionBar('05', 'MATERIALS \u2014 WITH DELIVERY TICKETS', A), h.spacer(80),
          dt(A, [{ text: 'MATERIAL', width: maCols[0] }, { text: 'SUPPLIER', width: maCols[1] }, { text: 'QTY', width: maCols[2] }, { text: 'COST', width: maCols[3] }, { text: 'INVOICE / DELIVERY TICKET', width: maCols[4] }],
            d.materials.map(m => [m.description, m.supplier || '', m.qty, m.total, m.deliveryTicket || m.invoiceRef || ''])),
          h.spacer(80), h.fullWidthSectionBar('06', 'VERIFICATION CHAIN', A), h.spacer(80),
          ...(d.verificationChain.length > 0 ? [dt(A,
            [{ text: 'ROLE', width: vcCols[0] }, { text: 'NAME', width: vcCols[1] }, { text: 'SIGNATURE', width: vcCols[2] }, { text: 'DATE', width: vcCols[3] }, { text: 'VERIFICATION', width: vcCols[4] }],
            d.verificationChain.map((v, i) => [`${i + 1}. ${v.role}`, v.name, '', v.date, v.verification]))] : []),
          h.spacer(40),
          h.calloutBox(
            d.disputeNote || 'This daywork record has been prepared as a contemporaneous record at the time of the work. All quantities are supported by photographic evidence, supplier invoices, hire records, and site sign-in sheets.',
            A, NAVY_BG, NAVY, W, { boldPrefix: 'Dispute / Adjudication Note:' }
          ),
          h.spacer(80), ...h.endMark(A)] },
    ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildDayworkSheetTemplateDocument(
  content: any,
  templateSlug: DayworkSheetTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':          return buildT1(d);
    case 'ceca-civil':               return buildT2(d);
    case 'nec4-record':              return buildT3(d);
    case 'subcontractor-valuation':  return buildT4(d);
    case 'compact-field':            return buildT5(d);
    case 'jct-prime-cost':           return buildT6(d);
    case 'weekly-summary':           return buildT7(d);
    case 'audit-trail':              return buildT8(d);
    default:                         return buildT1(d);
  }
}
