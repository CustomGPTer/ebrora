// =============================================================================
// Daywork Sheet Builder — Multi-Template Engine
// 8 visual templates, all consuming the same Daywork JSON structure.
//   T1 — Ebrora Standard          (green, all-purpose)
//   T2 — CECA Civil Engineering    (amber, CECA schedule)
//   T3 — JCT Prime Cost           (blue, RICS definition)
//   T4 — NEC4 Compensation Event  (dark blue, Defined Cost)
//   T5 — Compact Field            (grey, single-page)
//   T6 — Audit Trail              (navy, evidence-grade)
//   T7 — Subcontractor Valuation  (orange, rate comparison)
//   T8 — Weekly Summary           (teal, Mon–Fri grid)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { DayworkSheetTemplateSlug } from '@/lib/daywork-sheet/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;
const EBRORA = h.EBRORA_GREEN;
const AMBER = '92400E'; const AMBER_BG = 'FFFBEB';
const BLUE = '1e40af'; const BLUE_BG = 'eff6ff';
const DKBLUE = '1e3a5f'; const DKBLUE_BG = 'f0f4f8';
const GREY_COMP = '374151'; const NAVY = '1e293b';
const ORANGE = 'c2410c'; const TEAL = '0f766e';
const ZEBRA = 'F5F5F5';

interface DwData {
  dayworkRef: string; dayworkDate: string; weekCommencing: string;
  projectName: string; contractRef: string; contractForm: string;
  instructedBy: string; instructionRef: string; instructionType: string; instructionDate: string;
  activityDescription: string; location: string;
  labour: Array<{ name: string; trade: string; grade: string; startTime: string; endTime: string; normalHours: string; overtimeHours: string; rate: string; total: string }>;
  plant: Array<{ description: string; hours: string; productiveHours: string; standingTime: string; rate: string; total: string; hireType: string }>;
  materials: Array<{ description: string; quantity: string; unit: string; unitCost: string; total: string; invoiceRef: string }>;
  supervision: Array<{ name: string; role: string; hours: string; rate: string; total: string }>;
  labourTotal: string; plantTotal: string; materialsTotal: string; supervisionTotal: string;
  overheadsPercentage: string; overheadsTotal: string; profitPercentage: string; profitTotal: string;
  grandTotal: string; cumulativeTotal: string;
  percentageAdditions: { labourPct: string; plantPct: string; materialsPct: string; ohpPct: string };
  contractorSignName: string; contractorSignRole: string; contractorSignDate: string;
  clientSignName: string; clientSignRole: string; clientSignDate: string;
  qsSignName: string; qsSignDate: string;
  dailySheetRefs: string[];
  dailySummary: Array<{ day: string; labourHours: string; plantHours: string; materialsCost: string; total: string }>;
  submittedRates: Array<{ item: string; submittedRate: string; agreedRate: string; variance: string; assessedValue: string }>;
  contraCharges: string; paymentAppRef: string;
  photoRefs: string[]; diaryRef: string;
  evidenceLog: Array<{ docType: string; reference: string; date: string }>;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): DwData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  const o = (k: string) => (typeof c?.[k] === 'object' && c[k] !== null && !Array.isArray(c[k]) ? c[k] : {});
  return {
    dayworkRef: s('dayworkRef', 'DW-001'), dayworkDate: s('dayworkDate'), weekCommencing: s('weekCommencing'),
    projectName: s('projectName'), contractRef: s('contractRef'), contractForm: s('contractForm'),
    instructedBy: s('instructedBy'), instructionRef: s('instructionRef'), instructionType: s('instructionType'), instructionDate: s('instructionDate'),
    activityDescription: s('activityDescription'), location: s('location'),
    labour: a('labour'), plant: a('plant'), materials: a('materials'), supervision: a('supervision'),
    labourTotal: s('labourTotal'), plantTotal: s('plantTotal'), materialsTotal: s('materialsTotal'), supervisionTotal: s('supervisionTotal'),
    overheadsPercentage: s('overheadsPercentage'), overheadsTotal: s('overheadsTotal'),
    profitPercentage: s('profitPercentage'), profitTotal: s('profitTotal'),
    grandTotal: s('grandTotal'), cumulativeTotal: s('cumulativeTotal'),
    percentageAdditions: { labourPct: s('labourPct', o('percentageAdditions').labourPct || ''), plantPct: s('plantPct', o('percentageAdditions').plantPct || ''), materialsPct: s('materialsPct', o('percentageAdditions').materialsPct || ''), ohpPct: s('ohpPct', o('percentageAdditions').ohpPct || '') },
    contractorSignName: s('contractorSignName'), contractorSignRole: s('contractorSignRole'), contractorSignDate: s('contractorSignDate'),
    clientSignName: s('clientSignName'), clientSignRole: s('clientSignRole'), clientSignDate: s('clientSignDate'),
    qsSignName: s('qsSignName'), qsSignDate: s('qsSignDate'),
    dailySheetRefs: a('dailySheetRefs'), dailySummary: a('dailySummary'),
    submittedRates: a('submittedRates'), contraCharges: s('contraCharges'), paymentAppRef: s('paymentAppRef'),
    photoRefs: a('photoRefs'), diaryRef: s('diaryRef'), evidenceLog: a('evidenceLog'),
    revisionHistory: a('revisionHistory'), additionalNotes: s('additionalNotes'),
  };
}

function hdrCell(text: string, width: number, color = EBRORA) { return h.headerCell(text, width, { fillColor: color, color: 'FFFFFF', fontSize: SM }); }
function dCell(text: string, width: number, opts?: { fill?: string }) { return h.dataCell(text, width, { fontSize: SM, fillColor: opts?.fill }); }
function dataTable(headers: { text: string; width: number }[], rows: any[][], color = EBRORA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, color)) }),
    ...rows.map((cells, i) => new TableRow({ children: cells.map((cell, ci) => dCell(String(cell || ''), headers[ci].width, { fill: i % 2 === 1 ? ZEBRA : undefined })) })),
  ] });
}
function footerLine() { return h.bodyText('— End of Document —', SM, { italic: true, color: '999999' }); }

function dwInfoBlock(d: DwData, extras: { label: string; value: string }[] = []) {
  return h.infoTable(W, [
    { label: 'Daywork Ref', value: d.dayworkRef }, { label: 'Date', value: d.dayworkDate },
    { label: 'Project', value: d.projectName }, { label: 'Contract', value: d.contractRef },
    { label: 'Instructed By', value: d.instructedBy }, { label: 'Instruction Ref', value: d.instructionRef },
    { label: 'Activity', value: d.activityDescription }, { label: 'Location', value: d.location },
    ...extras,
  ]);
}

function labourTable(d: DwData, color = EBRORA) {
  if (d.labour.length === 0) return h.bodyText('No labour recorded.', SM);
  const lw = [Math.round(W*0.18), Math.round(W*0.14), Math.round(W*0.10), Math.round(W*0.09), Math.round(W*0.09), Math.round(W*0.09), Math.round(W*0.09), Math.round(W*0.10), W - Math.round(W*0.18) - Math.round(W*0.14) - Math.round(W*0.10) - Math.round(W*0.09) - Math.round(W*0.09) - Math.round(W*0.09) - Math.round(W*0.09) - Math.round(W*0.10)];
  return dataTable([{ text: 'Name', width: lw[0] }, { text: 'Trade', width: lw[1] }, { text: 'Grade', width: lw[2] }, { text: 'Start', width: lw[3] }, { text: 'End', width: lw[4] }, { text: 'Hrs', width: lw[5] }, { text: 'OT', width: lw[6] }, { text: 'Rate', width: lw[7] }, { text: 'Total', width: lw[8] }],
    d.labour.map(l => [l.name, l.trade, l.grade, l.startTime, l.endTime, l.normalHours, l.overtimeHours, l.rate, l.total]), color);
}

function plantTable(d: DwData, color = EBRORA) {
  if (d.plant.length === 0) return h.bodyText('No plant recorded.', SM);
  const pw = [Math.round(W*0.28), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.14), Math.round(W*0.14), W - Math.round(W*0.28) - Math.round(W*0.10) - Math.round(W*0.10) - Math.round(W*0.10) - Math.round(W*0.14) - Math.round(W*0.14)];
  return dataTable([{ text: 'Description', width: pw[0] }, { text: 'Hrs', width: pw[1] }, { text: 'Prod', width: pw[2] }, { text: 'Stand', width: pw[3] }, { text: 'Rate', width: pw[4] }, { text: 'Hire', width: pw[5] }, { text: 'Total', width: pw[6] }],
    d.plant.map(p => [p.description, p.hours, p.productiveHours, p.standingTime, p.rate, p.hireType, p.total]), color);
}

function materialsTable(d: DwData, color = EBRORA) {
  if (d.materials.length === 0) return h.bodyText('No materials recorded.', SM);
  const mw = [Math.round(W*0.28), Math.round(W*0.10), Math.round(W*0.08), Math.round(W*0.14), Math.round(W*0.20), W - Math.round(W*0.28) - Math.round(W*0.10) - Math.round(W*0.08) - Math.round(W*0.14) - Math.round(W*0.20)];
  return dataTable([{ text: 'Description', width: mw[0] }, { text: 'Qty', width: mw[1] }, { text: 'Unit', width: mw[2] }, { text: 'Rate', width: mw[3] }, { text: 'Invoice', width: mw[4] }, { text: 'Total', width: mw[5] }],
    d.materials.map(m => [m.description, m.quantity, m.unit, m.unitCost, m.invoiceRef, m.total]), color);
}

function totalsBlock(d: DwData) {
  return h.infoTable(W, [
    { label: 'Labour', value: `£${d.labourTotal}` }, { label: 'Plant', value: `£${d.plantTotal}` },
    { label: 'Materials', value: `£${d.materialsTotal}` }, { label: 'Supervision', value: `£${d.supervisionTotal || '0.00'}` },
    { label: 'OH&P', value: `£${d.overheadsTotal || '0.00'} (${d.overheadsPercentage || '0'}%)` },
    { label: 'GRAND TOTAL', value: `£${d.grandTotal}` },
  ]);
}

function signOffBlock(d: DwData) {
  return h.approvalTable(W, [
    { role: 'Contractor', name: d.contractorSignName || '________', date: d.contractorSignDate || '________' },
    { role: 'Client/RE', name: d.clientSignName || '________', date: d.clientSignDate || '________' },
  ]);
}

// ═══ T1 — Ebrora Standard ═══
function buildT1(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(dwInfoBlock(d) as any);
  sec.push(h.sectionHeading('Labour Record')); sec.push(labourTable(d) as any);
  sec.push(h.bodyText(`Labour Total: £${d.labourTotal}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('Plant & Equipment Record')); sec.push(plantTable(d) as any);
  sec.push(h.bodyText(`Plant Total: £${d.plantTotal}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('Materials & Consumables')); sec.push(materialsTable(d) as any);
  sec.push(h.bodyText(`Materials Total: £${d.materialsTotal}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('Daywork Summary')); sec.push(totalsBlock(d) as any);
  sec.push(h.sectionHeading('Sign-Off')); sec.push(signOffBlock(d) as any);
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Daywork Sheet') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T2 — CECA Civil Engineering ═══
function buildT2(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'CECA SCHEDULE OF DAYWORKS', bold: true, size: TTL, color: AMBER })] }));
  sec.push(dwInfoBlock(d, [{ label: 'Contract Form', value: d.contractForm || 'NEC/ICE' }]) as any);
  sec.push(h.sectionHeading('Labour — CIJC Classification', LG, AMBER)); sec.push(labourTable(d, AMBER) as any);
  sec.push(h.bodyText(`Labour Sub-Total: £${d.labourTotal} + ${d.percentageAdditions.labourPct || 'CECA'}% additions`, SM));
  sec.push(h.sectionHeading('Plant — CECA Schedule Rates', LG, AMBER)); sec.push(plantTable(d, AMBER) as any);
  sec.push(h.bodyText(`Plant Sub-Total: £${d.plantTotal} + ${d.percentageAdditions.plantPct || 'CECA'}% additions`, SM));
  sec.push(h.sectionHeading('Materials — Invoice Cost + %', LG, AMBER)); sec.push(materialsTable(d, AMBER) as any);
  sec.push(h.bodyText(`Materials Sub-Total: £${d.materialsTotal} + ${d.percentageAdditions.materialsPct || ''}%`, SM));
  sec.push(h.sectionHeading('CECA Summary', LG, AMBER)); sec.push(totalsBlock(d) as any);
  sec.push(h.sectionHeading('Countersignature', LG, AMBER)); sec.push(signOffBlock(d) as any);
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('CECA Daywork') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T3 — JCT Prime Cost ═══
function buildT3(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'JCT DAYWORK — PRIME COST', bold: true, size: TTL, color: BLUE })] }));
  sec.push(dwInfoBlock(d, [{ label: 'Contract Form', value: d.contractForm || 'JCT SBC/Q 2016' }, { label: 'AI Ref', value: d.instructionRef }]) as any);
  sec.push(h.sectionHeading('Labour at Prime Cost', LG, BLUE)); sec.push(labourTable(d, BLUE) as any);
  sec.push(h.bodyText(`Prime Cost: £${d.labourTotal} + ${d.percentageAdditions.labourPct || 'contract'}% = Total`, SM));
  sec.push(h.sectionHeading('Plant at Hire Rates', LG, BLUE)); sec.push(plantTable(d, BLUE) as any);
  sec.push(h.sectionHeading('Materials at Invoice Cost', LG, BLUE)); sec.push(materialsTable(d, BLUE) as any);
  sec.push(h.sectionHeading('JCT Summary', LG, BLUE)); sec.push(totalsBlock(d) as any);
  sec.push(h.sectionHeading('QS Verification', LG, BLUE));
  sec.push(h.bodyText(`QS: ${d.qsSignName || '________'}  Date: ${d.qsSignDate || '________'}`, SM));
  sec.push(h.sectionHeading('Sign-Off')); sec.push(signOffBlock(d) as any);
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('JCT Daywork') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T4 — NEC4 Compensation Event ═══
function buildT4(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'NEC4 — DEFINED COST RECORD', bold: true, size: TTL, color: DKBLUE })] }));
  sec.push(dwInfoBlock(d, [{ label: 'Contract Form', value: d.contractForm || 'NEC4 ECC' }]) as any);
  sec.push(h.sectionHeading('People — Defined Cost', LG, DKBLUE)); sec.push(labourTable(d, DKBLUE) as any);
  sec.push(h.sectionHeading('Equipment — Defined Cost', LG, DKBLUE)); sec.push(plantTable(d, DKBLUE) as any);
  sec.push(h.sectionHeading('Materials — Defined Cost', LG, DKBLUE)); sec.push(materialsTable(d, DKBLUE) as any);
  sec.push(h.sectionHeading('Fee Application', LG, DKBLUE));
  sec.push(h.bodyText(`Fee %: ${d.percentageAdditions.ohpPct || 'per Contract Data'} | Fee Total: £${d.overheadsTotal || 'TBC'}`, SM));
  sec.push(h.sectionHeading('Defined Cost Summary', LG, DKBLUE)); sec.push(totalsBlock(d) as any);
  sec.push(h.sectionHeading('PM Assessment', LG, DKBLUE));
  sec.push(h.bodyText(`CE Ref: ${d.instructionRef} | Quotation Ref: ${d.contractRef}`, SM));
  sec.push(signOffBlock(d) as any);
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('NEC4 Defined Cost') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T5 — Compact Field (single page) ═══
function buildT5(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'DAYWORK — SITE RECORD', bold: true, size: XL, color: GREY_COMP })] }));
  sec.push(h.infoTable(W, [
    { label: 'Ref', value: d.dayworkRef }, { label: 'Date', value: d.dayworkDate },
    { label: 'Project', value: d.projectName }, { label: 'Instructed By', value: d.instructedBy },
  ]));
  sec.push(h.bodyText(d.activityDescription, SM));
  sec.push(h.sectionHeading('Labour', BODY, GREY_COMP)); sec.push(labourTable(d, GREY_COMP) as any);
  sec.push(h.sectionHeading('Plant', BODY, GREY_COMP)); sec.push(plantTable(d, GREY_COMP) as any);
  sec.push(h.sectionHeading('Materials', BODY, GREY_COMP)); sec.push(materialsTable(d, GREY_COMP) as any);
  sec.push(h.spacer(80));
  sec.push(h.bodyText(`Contractor: ________________  Date: ________  |  Client: ________________  Date: ________`, SM));
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NARROW, bottom: h.MARGIN_NARROW, left: h.MARGIN_NARROW, right: h.MARGIN_NARROW } } }, children: sec }] });
}

// ═══ T6 — Audit Trail ═══
function buildT6(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'DAYWORK — AUDIT TRAIL', bold: true, size: TTL, color: NAVY })] }));
  if (d.revisionHistory.length > 0) {
    sec.push(h.sectionHeading('Document Control', LG, NAVY));
    const rw = [Math.round(W*0.10), Math.round(W*0.18), Math.round(W*0.50), W - Math.round(W*0.10) - Math.round(W*0.18) - Math.round(W*0.50)];
    sec.push(dataTable([{ text: 'Rev', width: rw[0] }, { text: 'Date', width: rw[1] }, { text: 'Description', width: rw[2] }, { text: 'Author', width: rw[3] }], d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author]), NAVY) as any);
  }
  sec.push(dwInfoBlock(d, [{ label: 'Instruction Type', value: d.instructionType }, { label: 'Diary Ref', value: d.diaryRef }]) as any);
  sec.push(h.sectionHeading('Labour (with Evidence)', LG, NAVY)); sec.push(labourTable(d, NAVY) as any);
  sec.push(h.sectionHeading('Plant (with Evidence)', LG, NAVY)); sec.push(plantTable(d, NAVY) as any);
  sec.push(h.sectionHeading('Materials (with Evidence)', LG, NAVY)); sec.push(materialsTable(d, NAVY) as any);
  if (d.evidenceLog.length > 0) {
    sec.push(h.sectionHeading('Evidence Log', LG, NAVY));
    const ew = [Math.round(W*0.25), Math.round(W*0.40), W - Math.round(W*0.25) - Math.round(W*0.40)];
    sec.push(dataTable([{ text: 'Doc Type', width: ew[0] }, { text: 'Reference', width: ew[1] }, { text: 'Date', width: ew[2] }], d.evidenceLog.map(e => [e.docType, e.reference, e.date]), NAVY) as any);
  }
  if (d.photoRefs.length > 0) {
    sec.push(h.sectionHeading('Photo Evidence', LG, NAVY));
    d.photoRefs.forEach(p => sec.push(h.bodyText(`• ${p}`, SM)));
  }
  sec.push(h.sectionHeading('Totals', LG, NAVY)); sec.push(totalsBlock(d) as any);
  sec.push(h.sectionHeading('4-Person Verification', LG, NAVY));
  sec.push(h.approvalTable(W, [
    { role: 'Foreman', name: d.contractorSignName || '________', date: d.contractorSignDate || '________' },
    { role: 'Site Agent', name: '________', date: '________' },
    { role: 'QS', name: d.qsSignName || '________', date: d.qsSignDate || '________' },
    { role: 'Client Rep', name: d.clientSignName || '________', date: d.clientSignDate || '________' },
  ]));
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Daywork Audit Trail') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T7 — Subcontractor Valuation ═══
function buildT7(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'SUBCONTRACTOR DAYWORK VALUATION', bold: true, size: TTL, color: ORANGE })] }));
  sec.push(dwInfoBlock(d, [{ label: 'Payment App', value: d.paymentAppRef }]) as any);
  if (d.submittedRates.length > 0) {
    sec.push(h.sectionHeading('Rate Comparison', LG, ORANGE));
    const sw = [Math.round(W*0.25), Math.round(W*0.18), Math.round(W*0.18), Math.round(W*0.15), W - Math.round(W*0.25) - Math.round(W*0.18) - Math.round(W*0.18) - Math.round(W*0.15)];
    sec.push(dataTable([{ text: 'Item', width: sw[0] }, { text: 'Submitted', width: sw[1] }, { text: 'Agreed', width: sw[2] }, { text: 'Variance', width: sw[3] }, { text: 'Assessed', width: sw[4] }],
      d.submittedRates.map(r => [r.item, r.submittedRate, r.agreedRate, r.variance, r.assessedValue]), ORANGE) as any);
  } else {
    sec.push(h.sectionHeading('Labour Valuation', LG, ORANGE)); sec.push(labourTable(d, ORANGE) as any);
    sec.push(h.sectionHeading('Plant Valuation', LG, ORANGE)); sec.push(plantTable(d, ORANGE) as any);
    sec.push(h.sectionHeading('Materials Valuation', LG, ORANGE)); sec.push(materialsTable(d, ORANGE) as any);
  }
  sec.push(h.sectionHeading('Contra-Charges', LG, ORANGE));
  sec.push(h.bodyText(d.contraCharges || 'None', SM));
  sec.push(h.sectionHeading('Totals', LG, ORANGE)); sec.push(totalsBlock(d) as any);
  if (d.cumulativeTotal) sec.push(h.bodyText(`Cumulative Daywork Total: £${d.cumulativeTotal}`, BODY, { bold: true, color: ORANGE }));
  sec.push(h.sectionHeading('Commercial Manager Sign-Off'));
  sec.push(h.approvalTable(W, [{ role: 'Commercial Manager', name: d.contractorSignName || '________', date: d.contractorSignDate || '________' }]));
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Subcontractor Valuation') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═══ T8 — Weekly Summary ═══
function buildT8(d: DwData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'WEEKLY DAYWORK SUMMARY', bold: true, size: TTL, color: TEAL })] }));
  sec.push(h.infoTable(W, [
    { label: 'Week Commencing', value: d.weekCommencing || d.dayworkDate }, { label: 'Project', value: d.projectName },
    { label: 'Contract Ref', value: d.contractRef }, { label: 'Daywork Sheets', value: d.dailySheetRefs.join(', ') || d.dayworkRef },
  ]));
  if (d.dailySummary.length > 0) {
    sec.push(h.sectionHeading('Daily Breakdown', LG, TEAL));
    const dw = [Math.round(W*0.18), Math.round(W*0.20), Math.round(W*0.20), Math.round(W*0.20), W - Math.round(W*0.18) - Math.round(W*0.20) - Math.round(W*0.20) - Math.round(W*0.20)];
    sec.push(dataTable([{ text: 'Day', width: dw[0] }, { text: 'Labour Hrs', width: dw[1] }, { text: 'Plant Hrs', width: dw[2] }, { text: 'Materials £', width: dw[3] }, { text: 'Day Total', width: dw[4] }],
      d.dailySummary.map(ds => [ds.day, ds.labourHours, ds.plantHours, ds.materialsCost, ds.total]), TEAL) as any);
  } else {
    sec.push(h.sectionHeading('Labour', LG, TEAL)); sec.push(labourTable(d, TEAL) as any);
    sec.push(h.sectionHeading('Plant', LG, TEAL)); sec.push(plantTable(d, TEAL) as any);
    sec.push(h.sectionHeading('Materials', LG, TEAL)); sec.push(materialsTable(d, TEAL) as any);
  }
  sec.push(h.sectionHeading('Weekly Totals', LG, TEAL)); sec.push(totalsBlock(d) as any);
  if (d.cumulativeTotal) sec.push(h.bodyText(`Cumulative Project Daywork: £${d.cumulativeTotal}`, BODY, { bold: true, color: TEAL }));
  sec.push(h.sectionHeading('Weekly Certification'));
  sec.push(signOffBlock(d) as any);
  if (d.additionalNotes) { sec.push(h.sectionHeading('Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());
  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Weekly Daywork Summary') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildDayworkSheetTemplateDocument(content: any, templateSlug: DayworkSheetTemplateSlug): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':          return buildT1(d);
    case 'ceca-civil':               return buildT2(d);
    case 'jct-prime-cost':           return buildT3(d);
    case 'nec4-record':              return buildT4(d);
    case 'compact-field':            return buildT5(d);
    case 'audit-trail':              return buildT6(d);
    case 'subcontractor-valuation':  return buildT7(d);
    case 'weekly-summary':           return buildT8(d);
    default:                         return buildT1(d);
  }
}
