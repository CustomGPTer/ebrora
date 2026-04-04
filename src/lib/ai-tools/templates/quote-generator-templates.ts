// =============================================================================
// Quotation Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Standard Quote      (#1E40AF, blue bands, Calibri, 01–07 numbered)
// T2 — Formal Contract     (#2D2D2D bars + #7F1D1D accent, Cambria, clause 1.0–7.0)
// T3 — Budget Estimate     (#475569 slate, Arial, 01–05, minimal + callout)
// T4 — Full Tender         (#065F46 green, Arial, 01–07, all sections + HSE)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { QuoteTemplateSlug } from '@/lib/quote/types';

// ── Layout ───────────────────────────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH; // 9026 DXA
const SM = 16; const BODY = 18; const LG = 22; const XL = 24;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const thin = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdr = { top: thin, bottom: thin, left: thin, right: thin };
const ZEBRA = 'F2F2F2';

// ── Palette ──────────────────────────────────────────────────────────────────
interface Pal {
  accent: string;      // primary accent for headers, bands, KPIs
  barBg: string;       // section bar background (same as accent except T2)
  barNumColor: string; // section bar number colour (white except T2 = #FCA5A5)
  coverAccent: string; // cover banner background
  subtitleColor: string;
  labelBg: string;     // info table label cell bg
  labelColor: string;  // info table label text colour
  dark: string;        // body text colour
  mid: string;         // secondary grey
  font: string;
}

const PAL: Record<QuoteTemplateSlug, Pal> = {
  'standard-quote':  { accent: '1E40AF', barBg: '1E40AF', barNumColor: 'FFFFFF', coverAccent: '1E40AF', subtitleColor: '93C5FD', labelBg: 'EFF6FF', labelColor: '1E40AF', dark: '1E293B', mid: '64748B', font: 'Calibri' },
  'formal-contract': { accent: '7F1D1D', barBg: '2D2D2D', barNumColor: 'FCA5A5', coverAccent: '7F1D1D', subtitleColor: 'FCA5A5', labelBg: 'F5F5F5', labelColor: '2D2D2D', dark: '333333', mid: '666666', font: 'Cambria' },
  'budget-estimate': { accent: '475569', barBg: '475569', barNumColor: 'FFFFFF', coverAccent: '475569', subtitleColor: 'CBD5E1', labelBg: 'F8FAFC', labelColor: '475569', dark: '334155', mid: '94A3B8', font: 'Arial' },
  'full-tender':     { accent: '065F46', barBg: '065F46', barNumColor: 'FFFFFF', coverAccent: '065F46', subtitleColor: 'A7F3D0', labelBg: 'E8F4F0', labelColor: '065F46', dark: '1A2E2A', mid: '6B7280', font: 'Arial' },
};

// ── Data extraction ──────────────────────────────────────────────────────────
interface QData {
  documentRef: string; quotationDate: string; validUntil: string;
  preparedBy: string; projectName: string; projectAddress: string;
  client: string; mainContractor: string; tenderReference: string;
  tenderReturnDate: string; contractRef: string;
  quotationSummary: string; scopeOfWorks: string;
  worksDescriptionShort: string; contractForm: string;
  billOfQuantities: Array<{ ref: string; description: string; unit: string; quantity: string; rate: string; amount: string }>;
  provisionalSums: Array<{ description: string; amount: string; basis: string }>;
  dayworkAllowance: { included: boolean; labourRate: string; plantRates: string; materialsMarkup: string; basisOfRates: string };
  priceSummary: { originalContractSum: string; provisionalSums: string; dayworkAllowance: string; totalTenderSum: string };
  inclusions: string[]; exclusions: string[]; assumptions: string[];
  programme: { proposedStartDate: string; duration: string; completionDate: string; keyMilestones: Array<{ milestone: string; targetDate: string; duration?: string }>; programmeNarrative: string };
  commercialTerms: { paymentTerms: string; retentionRate: string; defectsLiabilityPeriod: string; retentionRelease: string; insuranceRequirements: string; contractualBasis: string };
  healthSafetyEnvironmental: string; qualifications: string;
  organisationProfile: string; validityStatement: string;
  budgetEstimateNotice: string; relevantExperience: string;
}

function extract(c: any): QData {
  const d = c || {};
  const safe = (v: any) => (typeof v === 'string' ? v : '') || '';
  const safeArr = (v: any, fallback: string[] = []) => (Array.isArray(v) ? v : fallback);
  const prog = d.programme || {};
  const ct = d.commercialTerms || {};
  const ps = d.priceSummary || {};
  const dw = d.dayworkAllowance || {};
  return {
    documentRef: safe(d.documentRef), quotationDate: safe(d.quotationDate),
    validUntil: safe(d.validUntil), preparedBy: safe(d.preparedBy),
    projectName: safe(d.projectName), projectAddress: safe(d.projectAddress),
    client: safe(d.client), mainContractor: safe(d.mainContractor),
    tenderReference: safe(d.tenderReference), tenderReturnDate: safe(d.tenderReturnDate),
    contractRef: safe(d.contractRef || d.contractReference),
    quotationSummary: safe(d.quotationSummary), scopeOfWorks: safe(d.scopeOfWorks),
    worksDescriptionShort: safe(d.worksDescriptionShort || d.scopeOfWorks).slice(0, 300),
    contractForm: safe(d.contractForm || d.contractualBasis || ct.contractualBasis),
    billOfQuantities: safeArr(d.billOfQuantities).map((i: any) => ({
      ref: safe(i.ref), description: safe(i.description), unit: safe(i.unit),
      quantity: String(i.quantity ?? ''), rate: safe(i.rate), amount: safe(i.amount),
    })),
    provisionalSums: safeArr(d.provisionalSums).map((i: any) => ({
      description: safe(i.description), amount: safe(i.amount), basis: safe(i.basis),
    })),
    dayworkAllowance: { included: !!dw.included, labourRate: safe(dw.labourRate), plantRates: safe(dw.plantRates), materialsMarkup: safe(dw.materialsMarkup), basisOfRates: safe(dw.basisOfRates) },
    priceSummary: { originalContractSum: safe(ps.originalContractSum), provisionalSums: safe(ps.provisionalSums), dayworkAllowance: safe(ps.dayworkAllowance), totalTenderSum: safe(ps.totalTenderSum) },
    inclusions: safeArr(d.inclusions), exclusions: safeArr(d.exclusions), assumptions: safeArr(d.assumptions),
    programme: { proposedStartDate: safe(prog.proposedStartDate), duration: safe(prog.duration), completionDate: safe(prog.completionDate), keyMilestones: safeArr(prog.keyMilestones).map((m: any) => ({ milestone: safe(m.milestone), targetDate: safe(m.targetDate), duration: safe(m.duration) })), programmeNarrative: safe(prog.programmeNarrative) },
    commercialTerms: { paymentTerms: safe(ct.paymentTerms), retentionRate: safe(ct.retentionRate), defectsLiabilityPeriod: safe(ct.defectsLiabilityPeriod), retentionRelease: safe(ct.retentionRelease), insuranceRequirements: safe(ct.insuranceRequirements), contractualBasis: safe(ct.contractualBasis) },
    healthSafetyEnvironmental: safe(d.healthSafetyEnvironmental), qualifications: safe(d.qualifications),
    organisationProfile: safe(d.organisationProfile), validityStatement: safe(d.validityStatement),
    budgetEstimateNotice: safe(d.budgetEstimateNotice || 'This is an indicative budget price for planning purposes only. It is not a formal tender offer and is subject to revision upon receipt of final drawings, specifications, and ground investigation data. A formal quotation will be issued upon request.'),
    relevantExperience: safe(d.relevantExperience),
  };
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
function gap(size = 200): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function body(p: Pal, text: string, opts?: { bold?: boolean; size?: number }): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [
    new TextRun({ text, font: p.font, size: opts?.size || BODY, color: p.dark, bold: opts?.bold }),
  ] });
}

function proseParas(p: Pal, text: string): Paragraph[] {
  return (text || '').split(/\n\n?/).filter(Boolean).map(para => body(p, para));
}

function hdrCell(text: string, width: number, bg: string, font: string): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE }),
    ] })],
  });
}

function dCell(text: string, width: number, font: string, dark: string, opts?: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; color?: string }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: opts?.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: opts?.align, spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: opts?.bold, font, size: BODY, color: opts?.color || dark }),
    ] })],
  });
}

function accentInfoTable(p: Pal, rows: Array<{ label: string; value: string; valueBold?: boolean; valueColor?: string }>): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: bdr,
        shading: { fill: p.labelBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.label, bold: true, size: BODY, font: p.font, color: p.labelColor }),
        ] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: bdr,
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.value || '\u2014', size: BODY, font: p.font, color: r.valueColor || p.dark, bold: r.valueBold }),
        ] })] }),
    ] })),
  });
}

function dataTable(p: Pal, headers: Array<{ text: string; width: number }>, data: string[][]): Table {
  const colWidths = headers.map(h => h.width);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map(h => hdrCell(h.text, h.width, p.barBg, p.font)) }),
      ...data.map((row, i) => {
        const shade = i % 2 === 0 ? ZEBRA : h.WHITE;
        return new TableRow({ children: row.map((text, ci) =>
          dCell(text, colWidths[ci], p.font, p.dark, { shade, align: ci >= 3 ? AlignmentType.RIGHT : undefined }),
        ) });
      }),
    ],
  });
}

function bulletList(p: Pal, items: string[]): Paragraph[] {
  return (items || []).map(item => new Paragraph({
    spacing: { after: 60 }, indent: { left: 280 },
    children: [
      new TextRun({ text: '\u2022  ', font: p.font, size: BODY, color: p.accent }),
      new TextRun({ text: item, font: p.font, size: BODY, color: p.dark }),
    ],
  }));
}

// Section bar for T2 — charcoal bg with coloured clause number
function formalSectionBar(num: string, title: string, barBg: string, numColor: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: barBg, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 140, right: 140 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: num, bold: true, size: LG, font: 'Cambria', color: numColor }),
        new TextRun({ text: `   ${title.toUpperCase()}`, bold: true, size: LG, font: 'Cambria', color: h.WHITE }),
      ] })],
    })] })],
  });
}

// Clause-numbered paragraph for T2
function clausePara(p: Pal, clauseNum: string, text: string, opts?: { boldPrefix?: string }): Paragraph {
  const runs: TextRun[] = [
    new TextRun({ text: `${clauseNum} `, bold: true, font: p.font, size: BODY, color: p.accent }),
  ];
  if (opts?.boldPrefix) {
    runs.push(new TextRun({ text: opts.boldPrefix + ' ', bold: true, font: p.font, size: BODY, color: p.dark }));
  }
  runs.push(new TextRun({ text, font: p.font, size: BODY, color: p.dark }));
  return new Paragraph({ spacing: { after: 120 }, children: runs });
}

// Price summary box (bordered box with rows + total)
function priceSummaryBox(p: Pal, rows: Array<{ label: string; value: string; bold?: boolean }>, totalLabel: string, totalValue: string): Table {
  const lw = Math.round(W * 0.68); const vw = W - lw;
  const rowBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const outerBorder = { style: BorderStyle.SINGLE, size: 3, color: p.accent };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: [
      ...rows.map(r => new TableRow({ children: [
        new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM,
          borders: { top: rowBorder, bottom: rowBorder, left: outerBorder, right: rowBorder },
          children: [new Paragraph({ spacing: { after: 0 }, children: [
            new TextRun({ text: r.label, font: p.font, size: BODY, color: p.dark, bold: r.bold }),
          ] })] }),
        new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM,
          borders: { top: rowBorder, bottom: rowBorder, left: rowBorder, right: outerBorder },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [
            new TextRun({ text: r.value, font: p.font, size: BODY, color: p.dark, bold: r.bold }),
          ] })] }),
      ] })),
      // Total row
      new TableRow({ children: [
        new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM,
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent }, bottom: outerBorder, left: outerBorder, right: rowBorder },
          children: [new Paragraph({ spacing: { after: 0 }, children: [
            new TextRun({ text: totalLabel, bold: true, font: p.font, size: BODY, color: p.accent }),
          ] })] }),
        new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM,
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent }, bottom: outerBorder, left: rowBorder, right: outerBorder },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [
            new TextRun({ text: totalValue, bold: true, font: p.font, size: BODY, color: p.accent }),
          ] })] }),
      ] }),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — STANDARD QUOTE (#1E40AF)
// Cover + 7 sections (01-numbered, blue bands)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: QData): Document {
  const p = PAL['standard-quote'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['SUBCONTRACTOR', 'QUOTATION'], `Standard Quotation \u2014 ${d.worksDescriptionShort || d.projectName}`, p.coverAccent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Quotation Ref', value: d.documentRef },
    { label: 'Date', value: d.quotationDate },
    { label: 'Valid Until', value: d.validUntil },
    { label: 'Prepared By', value: d.preparedBy },
    { label: 'Project', value: d.projectName },
    { label: 'Client', value: d.client },
    { label: 'Main Contractor', value: d.mainContractor },
    { label: 'Tender Reference', value: d.tenderReference },
    { label: 'Site Address', value: d.projectAddress },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 TENDER PARTICULARS
  children.push(h.fullWidthSectionBar('01', 'TENDER PARTICULARS', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Subcontractor', value: d.preparedBy },
    { label: 'Works Description', value: d.worksDescriptionShort },
    { label: 'Contract Form', value: d.contractForm },
    { label: 'Total Tender Sum', value: d.priceSummary.totalTenderSum, valueBold: true, valueColor: p.accent },
  ]));
  children.push(gap(200));

  // 02 BILL OF QUANTITIES
  children.push(h.fullWidthSectionBar('02', 'BILL OF QUANTITIES', p.accent));
  children.push(gap(80));
  const refW = Math.round(W * 0.06); const descW = Math.round(W * 0.34);
  const unitW = Math.round(W * 0.08); const qtyW = Math.round(W * 0.10);
  const rateW = Math.round(W * 0.14); const amtW = W - refW - descW - unitW - qtyW - rateW;
  children.push(dataTable(p,
    [{ text: 'Ref', width: refW }, { text: 'Description', width: descW }, { text: 'Unit', width: unitW }, { text: 'Qty', width: qtyW }, { text: 'Rate (\u00A3)', width: rateW }, { text: 'Amount (\u00A3)', width: amtW }],
    d.billOfQuantities.map(i => [i.ref, i.description, i.unit, i.quantity, i.rate, i.amount]),
  ));
  children.push(gap(120));

  // Price Summary
  children.push(priceSummaryBox(p,
    [
      { label: 'Original Contract Sum', value: d.priceSummary.originalContractSum, bold: true },
      { label: `Provisional Sums${d.provisionalSums.length ? ` (${d.provisionalSums[0]?.description || ''})` : ''}`, value: d.priceSummary.provisionalSums },
      { label: 'Daywork Allowance', value: d.priceSummary.dayworkAllowance },
    ],
    'TOTAL TENDER SUM (excl. VAT)', d.priceSummary.totalTenderSum,
  ));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 03 INCLUSIONS
  children.push(h.fullWidthSectionBar('03', 'INCLUSIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.inclusions));
  children.push(gap(200));

  // 04 EXCLUSIONS
  children.push(h.fullWidthSectionBar('04', 'EXCLUSIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.exclusions));
  children.push(gap(200));

  // 05 ASSUMPTIONS & QUALIFICATIONS
  children.push(h.fullWidthSectionBar('05', 'ASSUMPTIONS & QUALIFICATIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.assumptions));
  children.push(gap(200));

  // 06 PROGRAMME
  children.push(h.fullWidthSectionBar('06', 'PROGRAMME', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Start Date', value: d.programme.proposedStartDate },
    { label: 'Duration', value: d.programme.duration },
    { label: 'Completion Date', value: d.programme.completionDate },
  ]));
  if (d.programme.keyMilestones.length > 0) {
    children.push(gap(100));
    const msW1 = Math.round(W * 0.50); const msW2 = Math.round(W * 0.25); const msW3 = W - msW1 - msW2;
    children.push(dataTable(p,
      [{ text: 'Milestone', width: msW1 }, { text: 'Target Date', width: msW2 }, { text: 'Duration', width: msW3 }],
      d.programme.keyMilestones.map(m => [m.milestone, m.targetDate, m.duration || '']),
    ));
  }
  children.push(gap(200));

  // 07 COMMERCIAL TERMS
  children.push(h.fullWidthSectionBar('07', 'COMMERCIAL TERMS', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Payment Terms', value: d.commercialTerms.paymentTerms },
    { label: 'Retention', value: d.commercialTerms.retentionRate },
    { label: 'Defects Period', value: d.commercialTerms.defectsLiabilityPeriod },
    { label: 'Insurance', value: d.commercialTerms.insuranceRequirements },
    { label: 'Contractual Basis', value: d.commercialTerms.contractualBasis },
  ]));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Quotation', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Standard Quote', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — FORMAL CONTRACT (#2D2D2D bars, #7F1D1D accent, Cambria, clause 1.0–7.0)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: QData): Document {
  const p = PAL['formal-contract'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['FORMAL CONTRACT', 'QUOTATION'], `Clause-Numbered Submission \u2014 ${d.contractForm || 'NEC4 ECS'}`, p.coverAccent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(`${d.projectName}${d.worksDescriptionShort ? ' \u00B7 ' + d.worksDescriptionShort.split(' ').slice(0, 6).join(' ') : ''}`, p.barBg));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Quotation Ref', value: d.documentRef },
    { label: 'Date', value: d.quotationDate },
    { label: 'Valid Until', value: d.validUntil },
    { label: 'Subcontractor', value: d.preparedBy },
    { label: 'Main Contractor', value: d.mainContractor },
    { label: 'Tender Reference', value: d.tenderReference },
    { label: 'Contract', value: d.contractForm },
    { label: 'Total Tender Sum', value: d.priceSummary.totalTenderSum },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 1.0 SCOPE OF WORKS — clause-numbered prose
  children.push(formalSectionBar('1.0', 'SCOPE OF WORKS', p.barBg, p.barNumColor));
  children.push(gap(80));
  const scopeParas = (d.scopeOfWorks || '').split(/\n\n/).filter(Boolean);
  scopeParas.forEach((para, i) => {
    children.push(clausePara(p, `1.${i + 1}`, para));
  });
  children.push(gap(200));

  // 2.0 PRICING SCHEDULE
  children.push(formalSectionBar('2.0', 'PRICING SCHEDULE', p.barBg, p.barNumColor));
  children.push(gap(80));
  const refW2 = Math.round(W * 0.06); const descW2 = Math.round(W * 0.38);
  const unitW2 = Math.round(W * 0.07); const qtyW2 = Math.round(W * 0.09);
  const rateW2 = Math.round(W * 0.14); const amtW2 = W - refW2 - descW2 - unitW2 - qtyW2 - rateW2;
  children.push(dataTable(p,
    [{ text: 'Ref', width: refW2 }, { text: 'Description', width: descW2 }, { text: 'Unit', width: unitW2 }, { text: 'Qty', width: qtyW2 }, { text: 'Rate (\u00A3)', width: rateW2 }, { text: 'Amount (\u00A3)', width: amtW2 }],
    d.billOfQuantities.map(i => [i.ref, i.description, i.unit, i.quantity, i.rate, i.amount]),
  ));
  children.push(gap(200));

  // 3.0 PROVISIONAL SUMS & DAYWORKS
  children.push(formalSectionBar('3.0', 'PROVISIONAL SUMS & DAYWORKS', p.barBg, p.barNumColor));
  children.push(gap(80));
  let clauseN = 1;
  d.provisionalSums.forEach(ps => {
    children.push(clausePara(p, `3.${clauseN}`, `${ps.description}: ${ps.amount}. ${ps.basis}`, { boldPrefix: 'Provisional Sum \u2014' }));
    clauseN++;
  });
  if (d.dayworkAllowance.included) {
    children.push(clausePara(p, `3.${clauseN}`, `${d.priceSummary.dayworkAllowance}. Labour at ${d.dayworkAllowance.labourRate}. Plant at ${d.dayworkAllowance.basisOfRates} rates. Materials at cost ${d.dayworkAllowance.materialsMarkup}.`, { boldPrefix: 'Daywork Allowance:' }));
  }
  children.push(gap(120));

  // Price Summary
  children.push(priceSummaryBox(p,
    [
      { label: 'Original Contract Sum', value: d.priceSummary.originalContractSum, bold: true },
      { label: 'Provisional Sums', value: d.priceSummary.provisionalSums },
      { label: 'Daywork Allowance', value: d.priceSummary.dayworkAllowance },
    ],
    'TOTAL TENDER SUM (excl. VAT)', d.priceSummary.totalTenderSum,
  ));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 4.0 INCLUSIONS & EXCLUSIONS
  children.push(formalSectionBar('4.0', 'INCLUSIONS & EXCLUSIONS', p.barBg, p.barNumColor));
  children.push(gap(80));
  children.push(clausePara(p, '4.1', d.inclusions.join('; ') + '.', { boldPrefix: 'Inclusions:' }));
  children.push(clausePara(p, '4.2', d.exclusions.join('; ') + '.', { boldPrefix: 'Exclusions:' }));
  children.push(gap(200));

  // 5.0 PROGRAMME & MILESTONES
  children.push(formalSectionBar('5.0', 'PROGRAMME & MILESTONES', p.barBg, p.barNumColor));
  children.push(gap(80));
  children.push(clausePara(p, '5.1', `The Works shall commence on ${d.programme.proposedStartDate} subject to notice and platform readiness confirmation. Total duration is ${d.programme.duration} with a completion date of ${d.programme.completionDate}.`));
  const progParas = (d.programme.programmeNarrative || '').split(/\n\n/).filter(Boolean);
  progParas.forEach((para, i) => {
    children.push(clausePara(p, `5.${i + 2}`, para));
  });
  if (d.programme.keyMilestones.length > 0) {
    children.push(gap(100));
    const msColW1 = Math.round(W * 0.75); const msColW2 = W - msColW1;
    children.push(dataTable(p,
      [{ text: 'Milestone', width: msColW1 }, { text: 'Target', width: msColW2 }],
      d.programme.keyMilestones.map(m => [m.milestone, m.targetDate]),
    ));
  }
  children.push(gap(200));

  // 6.0 COMMERCIAL TERMS
  children.push(formalSectionBar('6.0', 'COMMERCIAL TERMS', p.barBg, p.barNumColor));
  children.push(gap(80));
  children.push(clausePara(p, '6.1', d.commercialTerms.paymentTerms, { boldPrefix: 'Payment:' }));
  children.push(clausePara(p, '6.2', `${d.commercialTerms.retentionRate}. ${d.commercialTerms.retentionRelease}`, { boldPrefix: 'Retention:' }));
  children.push(clausePara(p, '6.3', d.commercialTerms.insuranceRequirements, { boldPrefix: 'Insurance:' }));
  children.push(clausePara(p, '6.4', d.commercialTerms.contractualBasis, { boldPrefix: 'Contractual Basis:' }));
  children.push(gap(200));

  // 7.0 SIGN-OFF
  children.push(formalSectionBar('7.0', 'SIGN-OFF', p.barBg, p.barNumColor));
  children.push(gap(100));
  children.push(h.signatureGrid([`For and on behalf of ${d.preparedBy || 'Subcontractor'}`, `Accepted by ${d.mainContractor || 'Contractor'}`], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Formal Contract Quotation', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Formal Contract', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — BUDGET ESTIMATE (#475569 slate, minimal, 01–05)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: QData): Document {
  const p = PAL['budget-estimate'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['BUDGET', 'ESTIMATE'], `Indicative Pricing \u2014 ${d.worksDescriptionShort || d.projectName}`, p.coverAccent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef },
    { label: 'Date', value: d.quotationDate },
    { label: 'Valid Until', value: d.validUntil },
    { label: 'From', value: d.preparedBy },
    { label: 'To', value: d.mainContractor },
    { label: 'Project', value: d.projectName },
    { label: 'Budget Price', value: d.priceSummary.totalTenderSum },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Budget Estimate Notice callout
  children.push(h.calloutBox(
    `Budget Estimate Notice: ${d.budgetEstimateNotice}`,
    'D97706', 'FFFBEB', '92400E', W,
  ));
  children.push(gap(200));

  // 01 PRICE SUMMARY — simplified BoQ (5 cols: Ref/Description/Qty/Rate/Amount)
  children.push(h.fullWidthSectionBar('01', 'PRICE SUMMARY', p.accent));
  children.push(gap(80));
  const refW3 = Math.round(W * 0.06); const descW3 = Math.round(W * 0.44);
  const qtyW3 = Math.round(W * 0.08); const rateW3 = Math.round(W * 0.14);
  const amtW3 = W - refW3 - descW3 - qtyW3 - rateW3;
  children.push(dataTable(p,
    [{ text: 'Ref', width: refW3 }, { text: 'Description', width: descW3 }, { text: 'Qty', width: qtyW3 }, { text: 'Rate', width: rateW3 }, { text: 'Amount', width: amtW3 }],
    d.billOfQuantities.map(i => [i.ref, i.description, i.quantity, i.rate, i.amount]),
  ));
  children.push(gap(120));
  children.push(priceSummaryBox(p, [],
    'BUDGET ESTIMATE TOTAL (excl. VAT)', d.priceSummary.totalTenderSum,
  ));
  children.push(gap(200));

  // 02 KEY INCLUSIONS
  children.push(h.fullWidthSectionBar('02', 'KEY INCLUSIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.inclusions));
  children.push(gap(200));

  // 03 KEY EXCLUSIONS
  children.push(h.fullWidthSectionBar('03', 'KEY EXCLUSIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.exclusions));
  children.push(gap(200));

  // 04 KEY ASSUMPTIONS
  children.push(h.fullWidthSectionBar('04', 'KEY ASSUMPTIONS', p.accent));
  children.push(gap(80));
  children.push(...bulletList(p, d.assumptions));
  children.push(gap(200));

  // 05 PROGRAMME & TERMS
  children.push(h.fullWidthSectionBar('05', 'PROGRAMME & TERMS', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Estimated Duration', value: d.programme.duration },
    { label: 'Payment', value: d.commercialTerms.paymentTerms },
    { label: 'Retention', value: d.commercialTerms.retentionRate },
    { label: 'Validity', value: `${d.validUntil ? d.validUntil + ' from date of issue' : '30 days from date of issue'}` },
  ]));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Budget Estimate', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Budget Estimate', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — FULL TENDER (#065F46 green, 01–07, all sections + HSE + Profile)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: QData): Document {
  const p = PAL['full-tender'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['FULL TENDER', 'SUBMISSION'], `${d.worksDescriptionShort || d.projectName}`, p.coverAccent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.preparedBy || 'SUBCONTRACTOR', p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Quotation Ref', value: d.documentRef },
    { label: 'Date', value: d.quotationDate },
    { label: 'Valid Until', value: d.validUntil },
    { label: 'Subcontractor', value: d.preparedBy },
    { label: 'Project', value: d.projectName },
    { label: 'Client', value: d.client },
    { label: 'Main Contractor', value: d.mainContractor },
    { label: 'Tender Ref', value: d.tenderReference },
    { label: 'Contract', value: d.contractForm },
    { label: 'Site Address', value: d.projectAddress },
    { label: 'Total Tender Sum', value: d.priceSummary.totalTenderSum },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 EXECUTIVE SUMMARY
  children.push(h.fullWidthSectionBar('01', 'EXECUTIVE SUMMARY', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.quotationSummary));
  children.push(gap(200));

  // 02 SCOPE OF WORKS
  children.push(h.fullWidthSectionBar('02', 'SCOPE OF WORKS', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.scopeOfWorks));
  children.push(gap(200));

  // 03 BILL OF QUANTITIES
  children.push(h.fullWidthSectionBar('03', 'BILL OF QUANTITIES', p.accent));
  children.push(gap(80));
  const refW4 = Math.round(W * 0.06); const descW4 = Math.round(W * 0.34);
  const unitW4 = Math.round(W * 0.07); const qtyW4 = Math.round(W * 0.09);
  const rateW4 = Math.round(W * 0.14); const amtW4 = W - refW4 - descW4 - unitW4 - qtyW4 - rateW4;
  children.push(dataTable(p,
    [{ text: 'Ref', width: refW4 }, { text: 'Description', width: descW4 }, { text: 'Unit', width: unitW4 }, { text: 'Qty', width: qtyW4 }, { text: 'Rate (\u00A3)', width: rateW4 }, { text: 'Amount (\u00A3)', width: amtW4 }],
    d.billOfQuantities.map(i => [i.ref, i.description, i.unit, i.quantity, i.rate, i.amount]),
  ));
  children.push(gap(120));
  children.push(priceSummaryBox(p,
    [
      { label: 'Original Contract Sum', value: d.priceSummary.originalContractSum, bold: true },
      { label: 'Provisional Sums', value: d.priceSummary.provisionalSums },
      { label: 'Daywork Allowance', value: d.priceSummary.dayworkAllowance },
    ],
    'TOTAL TENDER SUM (excl. VAT)', d.priceSummary.totalTenderSum,
  ));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 04 HEALTH, SAFETY & ENVIRONMENT
  children.push(h.fullWidthSectionBar('04', 'HEALTH, SAFETY & ENVIRONMENT', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.healthSafetyEnvironmental));
  children.push(gap(200));

  // 05 COMPANY PROFILE & QUALIFICATIONS
  children.push(h.fullWidthSectionBar('05', 'COMPANY PROFILE & QUALIFICATIONS', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.organisationProfile));
  if (d.relevantExperience) {
    children.push(gap(80));
    children.push(h.calloutBox(
      `Relevant Experience: ${d.relevantExperience}`,
      '059669', 'D1FAE5', '065F46', W,
    ));
  }
  children.push(gap(200));

  // 06 QUALIFICATIONS & ALTERNATIVE PROPOSALS
  children.push(h.fullWidthSectionBar('06', 'QUALIFICATIONS & ALTERNATIVE PROPOSALS', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.qualifications));
  children.push(gap(200));

  // 07 SIGN-OFF
  children.push(h.fullWidthSectionBar('07', 'SIGN-OFF', p.accent));
  children.push(gap(100));
  children.push(h.signatureGrid([`For ${d.preparedBy || 'Subcontractor'}`, `Accepted by ${d.mainContractor || 'Contractor'}`], p.accent, W));
  if (d.validityStatement) {
    children.push(gap(100));
    children.push(h.calloutBox(
      `Validity Statement: ${d.validityStatement}`,
      '2563EB', 'EFF6FF', '1E40AF', W,
    ));
  }
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Full Tender Submission', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Full Tender', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildQuoteTemplateDocument(
  content: any,
  templateSlug: QuoteTemplateSlug,
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'standard-quote':   return buildT1(d);
    case 'formal-contract':  return buildT2(d);
    case 'budget-estimate':  return buildT3(d);
    case 'full-tender':      return buildT4(d);
    default:                 return buildT1(d);
  }
}
