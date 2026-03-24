// =============================================================================
// Compensation Event Notification — NEC Contract Template
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const NEC_BLUE = '1E3A5F';
const NEC_BLUE_LIGHT = 'DBEAFE';
const ACCENT = '1D4ED8';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: NEC_BLUE })] });
}
function prose(text: string): Paragraph[] {
  return (text || 'Not specified.').split(/\n\n+/).filter(Boolean).map(p => h.bodyText(p));
}

export async function buildCeNotificationDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const instr = content.relatedInstruction || {};
  const prog = content.programmeImpact || {};
  const cost = content.costImplications || {};
  const quot = content.quotationRequirements || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 80 }, children: [
            new TextRun({ text: 'COMPENSATION EVENT', bold: true, size: 44, font: 'Arial', color: NEC_BLUE }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
            new TextRun({ text: 'NOTIFICATION', bold: true, size: 44, font: 'Arial', color: NEC_BLUE }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: content.contractForm || 'NEC4 ECC', size: 22, font: 'Arial', color: ACCENT, bold: true }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          new Paragraph({ spacing: { before: 100, after: 200 }, shading: { type: ShadingType.CLEAR, fill: NEC_BLUE }, children: [
            new TextRun({ text: `  ${content.compensationEventClause || ''}  `, bold: true, size: 22, font: 'Arial', color: h.WHITE }),
          ] }),

          h.sectionHeading('Notification Details'),
          h.infoTable([
            { label: 'Notification Reference', value: content.documentRef || '' },
            { label: 'Notification Date', value: content.notificationDate || '' },
            { label: 'Notified By', value: content.notifiedBy || '' },
            { label: 'Notified To', value: content.notifiedTo || '' },
            { label: 'Contract Reference', value: content.contractReference || '' },
            { label: 'Event Date', value: content.eventDate || '' },
            { label: 'CE Clause', value: content.compensationEventClause || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
          ], W),
          h.spacer(120),
          ...(instr.instructionRef && instr.instructionRef !== 'N/A' ? [
            h.infoTable([
              { label: 'Related Instruction Ref', value: instr.instructionRef || '' },
              { label: 'Instruction Date', value: instr.instructionDate || '' },
              { label: 'Issued By', value: instr.issuedBy || '' },
            ], W),
          ] : []),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Event Description'),
          ...prose(content.eventDescription),
          h.spacer(200),

          section('Original Scope / Works Information'),
          ...prose(content.originalScope),
          h.spacer(200),

          section('Changed Scope / Revised Requirement'),
          ...prose(content.changedScope),
          h.spacer(200),

          section('Entitlement Basis'),
          ...prose(content.entitlementBasis),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Programme Impact'),
          h.infoTable([
            { label: 'Critical Path Affected', value: prog.criticalPathAffected || '' },
            { label: 'Estimated Delay', value: prog.estimatedDelay || '' },
            { label: 'Planned Completion Impact', value: prog.plannedCompletionImpact || '' },
            { label: 'Key Dates Affected', value: prog.keyDatesAffected || '' },
          ], W),
          h.spacer(80),
          ...prose(prog.programmeNarrative),
          h.spacer(200),

          section('Cost Implications'),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [h.headerCell('Cost Element', Math.round(W * 0.5), { fontSize: 16 }), h.headerCell('Estimated Cost', W - Math.round(W * 0.5), { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Labour', Math.round(W * 0.5), { fontSize: 16 }), h.dataCell(cost.labourCost || 'TBC', W - Math.round(W * 0.5), { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Plant', Math.round(W * 0.5), { fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(cost.plantCost || 'TBC', W - Math.round(W * 0.5), { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
            new TableRow({ children: [h.dataCell('Materials', Math.round(W * 0.5), { fontSize: 16 }), h.dataCell(cost.materialsCost || 'TBC', W - Math.round(W * 0.5), { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Subcontractors', Math.round(W * 0.5), { fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(cost.subcontractorCost || 'TBC', W - Math.round(W * 0.5), { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
            new TableRow({ children: [h.dataCell('Preliminaries Impact', Math.round(W * 0.5), { fontSize: 16 }), h.dataCell(cost.preliminariesImpact || 'TBC', W - Math.round(W * 0.5), { fontSize: 16 })] }),
            new TableRow({ children: [
              h.headerCell('ESTIMATED TOTAL', Math.round(W * 0.5), { fontSize: 16, fillColor: NEC_BLUE }),
              h.headerCell(cost.estimatedAdditionalCost || 'TBC', W - Math.round(W * 0.5), { fontSize: 16, fillColor: NEC_BLUE }),
            ] }),
          ] }),
          h.spacer(80),
          ...prose(cost.costNarrative),
          h.spacer(200),

          section('Quotation Requirements'),
          h.infoTable([
            { label: 'Quotation Due Date', value: quot.quotationDueDate || '' },
            { label: 'Alternative Quotations Required', value: quot.alternativeQuotationsRequired || '' },
            { label: 'Revised Programme Required', value: quot.revisedProgrammeRequired || '' },
          ], W),
          h.spacer(200),

          section('Supporting Evidence'),
          ...(Array.isArray(content.supportingEvidence) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }),
              h.headerCell('Document', Math.round(W * 0.44), { fontSize: 14 }),
              h.headerCell('Reference', Math.round(W * 0.28), { fontSize: 14 }),
              h.headerCell('Status', W - Math.round(W * 0.78), { fontSize: 14 }),
            ] }),
            ...content.supportingEvidence.map((e: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.dataCell(e.document || '', Math.round(W * 0.44), { fontSize: 14 }),
              h.dataCell(e.reference || '', Math.round(W * 0.28), { fontSize: 14 }),
              h.dataCell(e.status || '', W - Math.round(W * 0.78), { fontSize: 14, bold: true }),
            ] })),
          ] })] : []),
          h.spacer(120),
          ...(content.relatedNotices ? [h.infoTable([{ label: 'Related Notices', value: content.relatedNotices }], W)] : []),
          h.spacer(200),

          ...(content.additionalNotes ? [section('Additional Notes'), ...prose(content.additionalNotes), h.spacer(160)] : []),

          h.sectionHeading('Acknowledgement'),
          h.approvalTable([
            { role: 'Notified By (Contractor)', name: content.notifiedBy || '' },
            { role: 'Received By (PM)', name: '' },
          ], W),
          h.spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
        ],
      },
    ],
  });
}
