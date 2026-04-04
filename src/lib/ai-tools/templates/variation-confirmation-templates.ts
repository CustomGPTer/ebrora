// =============================================================================
// Variation Confirmation — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Formal Confirmation (#0F766E teal, Arial, 6 sections, cost table)
// T2 — Corporate Letter    (#1E3A5F navy, Cambria, 4 sections, letter format)
// T3 — Quick Confirmation  (#475569 slate, Arial, left-border, minimal)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { VariationTemplateSlug } from '@/lib/variation/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const thin = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdr = { top: thin, bottom: thin, left: thin, right: thin };
const ZEBRA = 'F2F2F2';

interface Pal { accent: string; subtitleColor: string; labelBg: string; dark: string; mid: string; font: string; }
const PAL: Record<VariationTemplateSlug, Pal> = {
  'formal-letter': { accent: '0F766E', subtitleColor: '99F6E4', labelBg: 'F0FDFA', dark: '134E4A', mid: '6B7280', font: 'Arial' },
  'corporate':     { accent: '1E3A5F', subtitleColor: '93C5FD', labelBg: 'F1F5F9', dark: '1E293B', mid: '64748B', font: 'Cambria' },
  'concise':       { accent: '475569', subtitleColor: 'CBD5E1', labelBg: 'F8FAFC', dark: '334155', mid: '94A3B8', font: 'Arial' },
};

// ── Data ─────────────────────────────────────────────────────────────────────
interface VarData {
  documentRef: string; letterDate: string; instructionDate: string; instructionTime: string;
  instructionLocation: string; instructedBy: string; receivedBy: string; witnesses: string;
  fromParty: string; toParty: string; projectName: string; projectAddress: string;
  contractReference: string; contractForm: string; letterSubject: string;
  instructionSummary: string; descriptionOfVariation: string;
  costItems: Array<{ ref: string; item: string; unit: string; qty: string; rate: string; amount: string }>;
  costSummary: Array<{ label: string; value: string; bold?: boolean }>;
  totalCost: string; totalTime: string;
  timeImpact: { duration: string; programmeImpact: string; activitiesAffected: string; latestDesignDate: string; narrative: string };
  contractualEntitlement: string; ceClause: string;
  requestForInstruction: string; closingParagraph: string;
}

function extract(c: any): VarData {
  const d = c || {};
  const safe = (v: any) => (typeof v === 'string' ? v : '') || '';
  const vi = d.verbalInstructionDetails || {};
  const ci = d.estimatedCostImpact || {};
  const ti = d.estimatedTimeImpact || {};

  // Build cost items from costBreakdown array or individual fields
  let costItems: VarData['costItems'] = [];
  if (Array.isArray(d.costBreakdown)) {
    costItems = d.costBreakdown.map((i: any, idx: number) => ({
      ref: safe(i.ref) || `V${idx + 1}`, item: safe(i.item || i.description), unit: safe(i.unit),
      qty: String(i.qty ?? i.quantity ?? ''), rate: safe(i.rate), amount: safe(i.amount),
    }));
  }

  // Build cost summary
  const costSummary: VarData['costSummary'] = [];
  if (ci.labourCost || ci.plantCost || ci.materialsCost) {
    costSummary.push({ label: 'Direct Costs', value: safe(ci.estimatedTotalCost || ci.directCosts), bold: true });
    if (ci.overheadsAndProfit) costSummary.push({ label: "Contractor's Fee", value: safe(ci.overheadsAndProfit) });
    if (ci.designFee) costSummary.push({ label: 'Design Fee', value: safe(ci.designFee) });
  }

  return {
    documentRef: safe(d.documentRef), letterDate: safe(d.letterDate),
    instructionDate: safe(vi.dateOfInstruction || d.instructionDate),
    instructionTime: safe(vi.timeOfInstruction || d.instructionTime),
    instructionLocation: safe(vi.locationOfInstruction || d.instructionLocation),
    instructedBy: safe(vi.instructedBy || d.instructedBy),
    receivedBy: safe(vi.receivedBy || d.receivedBy || d.fromParty),
    witnesses: safe(vi.witnessesPresent || d.witnesses),
    fromParty: safe(d.fromParty), toParty: safe(d.toParty),
    projectName: safe(d.projectName), projectAddress: safe(d.projectAddress),
    contractReference: safe(d.contractReference), contractForm: safe(d.contractForm),
    letterSubject: safe(d.letterSubject),
    instructionSummary: safe(d.instructionSummary || d.openingParagraph),
    descriptionOfVariation: safe(d.descriptionOfVariation),
    costItems, costSummary,
    totalCost: safe(ci.estimatedTotalCost || d.totalCost),
    totalTime: safe(ti.estimatedDelayDays || d.totalTime),
    timeImpact: {
      duration: safe(ti.estimatedDelayDays || ti.duration),
      programmeImpact: safe(ti.timeImpactNarrative || ti.programmeImpact),
      activitiesAffected: safe(ti.affectedActivities),
      latestDesignDate: safe(ti.latestDesignDate || d.latestDesignDate),
      narrative: safe(ti.timeImpactNarrative),
    },
    contractualEntitlement: safe(d.contractualEntitlement),
    ceClause: safe(d.ceClause || d.compensationEventClause),
    requestForInstruction: safe(d.requestForWrittenInstruction || d.requestForInstruction),
    closingParagraph: safe(d.closingParagraph),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function gap(size = 200): Paragraph { return new Paragraph({ spacing: { after: size }, children: [] }); }

function proseParas(p: Pal, text: string): Paragraph[] {
  return (text || '').split(/\n\n?/).filter(Boolean).map(para =>
    new Paragraph({ spacing: { after: 120 }, children: [
      new TextRun({ text: para, font: p.font, size: BODY, color: p.dark }),
    ] })
  );
}

function accentInfoTable(p: Pal, rows: Array<{ label: string; value: string; valueBold?: boolean; valueColor?: string }>): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: bdr,
        shading: { fill: p.labelBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.label, bold: true, size: BODY, font: p.font, color: p.accent }),
        ] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: bdr,
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.value || '\u2014', size: BODY, font: p.font, color: r.valueColor || p.dark, bold: r.valueBold }),
        ] })] }),
    ] })),
  });
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

function dCell(text: string, width: number, font: string, dark: string, opts?: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: opts?.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: opts?.align, spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: opts?.bold, font, size: BODY, color: dark }),
    ] })],
  });
}

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

function leftBorderHead(title: string, accent: string, font: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: accent, space: 6 } },
    indent: { left: 80 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, font, size: LG, color: accent })],
  });
}

function headerBar(p: Pal, d: VarData): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: p.accent, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { after: 20 }, children: [
          new TextRun({ text: `VARIATION CONFIRMATION  |  ${d.documentRef}  |  ${d.letterDate}`, bold: true, size: BODY, font: p.font, color: h.WHITE }),
        ] }),
        new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: `${d.projectName} \u00B7 ${d.contractReference} \u00B7 ${d.contractForm}`, size: SM - 2, font: p.font, color: p.subtitleColor }),
        ] }),
      ],
    })] })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — FORMAL CONFIRMATION (#0F766E teal, 6 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: VarData): Document {
  const p = PAL['formal-letter'];
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(h.coverBlock(['VARIATION', 'CONFIRMATION'], `Formal Written Record \u2014 ${d.contractForm || 'NEC4'} Compensation Event Notification`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date of Letter', value: d.letterDate },
    { label: 'Date of Instruction', value: `${d.instructionDate}${d.instructionTime ? ' at ' + d.instructionTime : ''}` },
    { label: 'Instructed By', value: d.instructedBy }, { label: 'Received By', value: d.receivedBy },
    { label: 'Project', value: d.projectName }, { label: 'Contract', value: d.contractReference },
    { label: 'Subject', value: d.letterSubject },
    { label: 'Estimated Cost Impact', value: d.totalCost },
    { label: 'Estimated Time Impact', value: d.totalTime },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 RECORD OF VERBAL INSTRUCTION
  children.push(h.fullWidthSectionBar('01', 'RECORD OF VERBAL INSTRUCTION', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Date & Time', value: `${d.instructionDate}${d.instructionTime ? ' at ' + d.instructionTime : ''}` },
    { label: 'Location', value: d.instructionLocation },
    { label: 'Instruction Given By', value: d.instructedBy },
    { label: 'Instruction Received By', value: d.receivedBy },
    { label: 'Witnesses Present', value: d.witnesses },
    { label: 'Instruction Summary', value: d.instructionSummary },
  ]));
  children.push(gap(200));

  // 02 SCOPE CHANGE DESCRIPTION
  children.push(h.fullWidthSectionBar('02', 'SCOPE CHANGE DESCRIPTION', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.descriptionOfVariation));
  children.push(gap(200));

  // 03 COST IMPACT ASSESSMENT
  children.push(h.fullWidthSectionBar('03', 'COST IMPACT ASSESSMENT', p.accent));
  children.push(gap(80));
  if (d.costItems.length > 0) {
    const cw = [Math.round(W * 0.06), Math.round(W * 0.40), Math.round(W * 0.08), Math.round(W * 0.10), Math.round(W * 0.14)];
    cw.push(W - cw[0] - cw[1] - cw[2] - cw[3] - cw[4]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: cw,
      rows: [
        new TableRow({ children: [
          hdrCell('Ref', cw[0], p.accent, p.font), hdrCell('Item', cw[1], p.accent, p.font),
          hdrCell('Unit', cw[2], p.accent, p.font), hdrCell('Qty', cw[3], p.accent, p.font),
          hdrCell('Rate (\u00A3)', cw[4], p.accent, p.font), hdrCell('Amount (\u00A3)', cw[5], p.accent, p.font),
        ] }),
        ...d.costItems.map((i, idx) => {
          const shade = idx % 2 === 0 ? ZEBRA : h.WHITE;
          return new TableRow({ children: [
            dCell(i.ref, cw[0], p.font, p.dark, { shade }),
            dCell(i.item, cw[1], p.font, p.dark, { shade }),
            dCell(i.unit, cw[2], p.font, p.dark, { shade }),
            dCell(i.qty, cw[3], p.font, p.dark, { shade, align: AlignmentType.RIGHT }),
            dCell(i.rate, cw[4], p.font, p.dark, { shade, align: AlignmentType.RIGHT }),
            dCell(i.amount, cw[5], p.font, p.dark, { shade, align: AlignmentType.RIGHT }),
          ] });
        }),
      ],
    }));
    children.push(gap(120));
  }
  children.push(priceSummaryBox(p, d.costSummary, 'ESTIMATED COST IMPACT', d.totalCost));
  children.push(gap(200));

  // 04 TIME IMPACT ASSESSMENT
  children.push(h.fullWidthSectionBar('04', 'TIME IMPACT ASSESSMENT', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Estimated Duration', value: d.timeImpact.duration },
    { label: 'Programme Impact', value: d.timeImpact.programmeImpact },
    { label: 'Activities Affected', value: d.timeImpact.activitiesAffected },
    ...(d.timeImpact.latestDesignDate ? [{ label: 'Latest Design Date', value: d.timeImpact.latestDesignDate }] : []),
  ]));
  children.push(gap(200));

  // 05 CONTRACTUAL BASIS
  children.push(h.fullWidthSectionBar('05', 'CONTRACTUAL BASIS', p.accent));
  children.push(gap(80));
  children.push(h.calloutBox(
    `${d.contractForm || 'NEC4'} Compensation Event: ${d.contractualEntitlement || 'This verbal instruction constitutes a change to the Works Information.'}`,
    'D97706', 'FFFBEB', '92400E', W,
  ));
  children.push(gap(80));
  children.push(...proseParas(p, d.requestForInstruction));
  children.push(gap(200));

  // 06 SIGN-OFF
  children.push(h.fullWidthSectionBar('06', 'SIGN-OFF', p.accent));
  children.push(gap(100));
  children.push(h.signatureGrid(['Contractor', 'Project Manager (Acknowledgement)'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Variation Confirmation', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Formal Confirmation', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CORPORATE LETTER (#1E3A5F navy, Cambria, letter format, 4 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: VarData): Document {
  const p = PAL['corporate'];
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(h.coverBlock(['VARIATION', 'CONFIRMATION'], `Corporate Letter \u2014 ${d.letterSubject}`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.letterDate },
    { label: 'Instruction Date', value: `${d.instructionDate}${d.instructionTime ? ' at ' + d.instructionTime : ''}` },
    { label: 'From', value: d.fromParty || d.receivedBy }, { label: 'To', value: d.toParty || d.instructedBy },
    { label: 'Contract', value: d.contractReference },
    { label: 'Subject', value: d.letterSubject },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Salutation
  const toName = (d.toParty || d.instructedBy || '').split(' ')[0] || '';
  children.push(new Paragraph({ spacing: { after: 120 }, children: [
    new TextRun({ text: `Dear ${toName},`, font: p.font, size: BODY, color: p.dark }),
  ] }));

  // 01 INSTRUCTION SUMMARY
  children.push(h.fullWidthSectionBar('01', 'INSTRUCTION SUMMARY', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.instructionSummary));
  children.push(gap(200));

  // 02 SCOPE DESCRIPTION
  children.push(h.fullWidthSectionBar('02', 'SCOPE DESCRIPTION', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.descriptionOfVariation));
  children.push(gap(200));

  // 03 IMPACT ASSESSMENT
  children.push(h.fullWidthSectionBar('03', 'IMPACT ASSESSMENT', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Estimated Cost', value: d.totalCost, valueBold: true },
    { label: 'Estimated Duration', value: d.timeImpact.duration },
    { label: 'Programme Impact', value: d.timeImpact.programmeImpact },
    { label: 'CE Classification', value: d.ceClause || d.contractualEntitlement?.split('.')[0] || '' },
  ]));
  children.push(gap(200));

  // 04 CONFIRMATION REQUESTED
  children.push(h.fullWidthSectionBar('04', 'CONFIRMATION REQUESTED', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.requestForInstruction));
  children.push(gap(200));

  // Kind regards + signoff
  children.push(new Paragraph({ spacing: { before: 160, after: 60 }, children: [
    new TextRun({ text: 'Kind regards,', font: p.font, size: BODY, color: p.dark }),
  ] }));
  children.push(new Paragraph({ spacing: { after: 40 }, children: [
    new TextRun({ text: (d.receivedBy || d.fromParty || '').split(' \u2014')[0], bold: true, font: p.font, size: BODY, color: p.dark }),
  ] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [
    new TextRun({ text: d.fromParty || '', font: p.font, size: SM, color: p.mid }),
  ] }));

  children.push(h.signatureGrid(['Sent By', 'Acknowledged By'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Variation Confirmation', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Corporate', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — QUICK CONFIRMATION (#475569 slate, minimal, left-border)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: VarData): Document {
  const p = PAL['concise'];
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(h.coverBlock(['QUICK', 'CONFIRMATION'], `Written Record of Verbal Instruction \u2014 Same Day Issue`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.letterDate },
    { label: 'Instruction Date', value: `${d.instructionDate}${d.instructionTime ? ' at ' + d.instructionTime : ''}` },
    { label: 'From', value: d.fromParty || d.receivedBy }, { label: 'To', value: d.toParty || d.instructedBy },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Header bar
  children.push(headerBar(p, d));
  children.push(gap(120));

  // VERBAL INSTRUCTION RECORD
  children.push(leftBorderHead('VERBAL INSTRUCTION RECORD', p.accent, p.font));
  children.push(accentInfoTable(p, [
    { label: 'Who', value: `${d.instructedBy} \u2192 ${d.receivedBy}` },
    { label: 'When', value: `${d.instructionDate}${d.instructionTime ? ', ' + d.instructionTime : ''}${d.instructionLocation ? ', ' + d.instructionLocation : ''}` },
    { label: 'Witnesses', value: d.witnesses },
    { label: 'What', value: d.instructionSummary || d.letterSubject },
    { label: 'Why', value: d.descriptionOfVariation?.split('\n')[0] || '' },
  ]));
  children.push(gap(200));

  // KEY FACTS
  children.push(leftBorderHead('KEY FACTS', p.accent, p.font));
  children.push(accentInfoTable(p, [
    { label: 'Estimated Cost', value: d.totalCost, valueBold: true },
    { label: 'Estimated Time', value: d.totalTime, valueBold: true },
    { label: 'CE Clause', value: d.ceClause || d.contractualEntitlement?.split('.')[0] || '' },
    ...(d.timeImpact.latestDesignDate ? [{ label: 'Design Needed By', value: d.timeImpact.latestDesignDate }] : []),
  ]));
  children.push(gap(200));

  // ACTION REQUIRED
  children.push(leftBorderHead('ACTION REQUIRED', p.accent, p.font));
  children.push(h.calloutBox(
    `Please issue a formal written PMI (${d.contractForm || 'NEC4'} clause 27.3) to authorise this work. ${d.requestForInstruction || 'This letter is the Contractor\'s CE notification. Formal quotation will follow within 3 weeks of receiving the PMI and design information. Contractor reserves its contractual position until formal instruction is received.'}`,
    'D97706', 'FFFBEB', '92400E', W,
  ));
  children.push(gap(200));

  children.push(h.signatureGrid(['Sent By', 'Acknowledged'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Quick Confirmation', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Quick Confirmation', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildVariationTemplateDocument(
  content: any,
  templateSlug: VariationTemplateSlug,
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'formal-letter': return buildT1(d);
    case 'corporate':     return buildT2(d);
    case 'concise':       return buildT3(d);
    default:              return buildT1(d);
  }
}
