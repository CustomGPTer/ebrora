// =============================================================================
// Quality Inspection Checklist — Dedicated Template
// Field-ready format with check tables, hold points, and sign-off.
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = '059669';
const ACCENT_LIGHT = 'ECFDF5';
const HOLD_POINT = 'DC2626';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
// prose() now imported from docx-helpers via h.prose()

function checkTable(items: any[], W: number): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [
      h.headerCell('Ref', Math.round(W * 0.06), { fontSize: 12 }),
      h.headerCell('Check Item', Math.round(W * 0.28), { fontSize: 12 }),
      h.headerCell('Acceptance Criteria', Math.round(W * 0.26), { fontSize: 12 }),
      h.headerCell('Standard', Math.round(W * 0.12), { fontSize: 12 }),
      h.headerCell('H/P', Math.round(W * 0.06), { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('Result', Math.round(W * 0.1), { fontSize: 12 }),
      h.headerCell('Comments', W - Math.round(W * 0.88), { fontSize: 12 }),
    ] }),
    ...items.map((item: any, i: number) => {
      const isHold = item.isHoldPoint === true || item.isHoldPoint === 'true';
      const bg = isHold ? 'FEE2E2' : i % 2 === 0 ? ACCENT_LIGHT : h.WHITE;
      return new TableRow({ children: [
        h.dataCell(item.ref || '', Math.round(W * 0.06), { fontSize: 12, alignment: AlignmentType.CENTER, fillColor: bg, bold: true }),
        h.dataCell(item.checkItem || '', Math.round(W * 0.28), { fontSize: 12, fillColor: bg }),
        h.dataCell(item.acceptanceCriteria || '', Math.round(W * 0.26), { fontSize: 12, fillColor: bg }),
        h.dataCell(item.standardRef || '', Math.round(W * 0.12), { fontSize: 11, fillColor: bg }),
        h.dataCell(isHold ? 'H' : '', Math.round(W * 0.06), { fontSize: 12, alignment: AlignmentType.CENTER, fillColor: isHold ? HOLD_POINT : bg, color: isHold ? h.WHITE : h.BLACK, bold: true }),
        h.dataCell('', Math.round(W * 0.1), { fontSize: 12, fillColor: bg }),
        h.dataCell('', W - Math.round(W * 0.88), { fontSize: 12, fillColor: bg }),
      ] });
    }),
  ] });
}

export async function buildQualityChecklistDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const signOff = content.signOff || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'QUALITY INSPECTION CHECKLIST', bold: true, size: 40, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          h.sectionHeading('Document Details'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Date', value: content.date || '' },
            { label: 'Prepared By', value: content.preparedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
            { label: 'Drawing References', value: content.drawingReferences || '' },
            { label: 'Specification References', value: content.specificationReferences || '' },
          ], W),
          h.spacer(160),

          section('Activity Description'),
          ...h.prose(content.activityDescription),
          h.spacer(120),

          new Paragraph({ spacing: { after: 120 }, shading: { type: ShadingType.CLEAR, fill: 'FEE2E2' }, children: [
            new TextRun({ text: '  H = HOLD POINT — Work must STOP until inspected and released  ', bold: true, size: 16, font: 'Arial', color: HOLD_POINT }),
          ] }),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Pre-Activity Checks'),
          ...(Array.isArray(content.preActivityChecks) ? [checkTable(content.preActivityChecks, W)] : []),
          h.spacer(200),

          section('During Activity Checks'),
          ...(Array.isArray(content.duringActivityChecks) ? [checkTable(content.duringActivityChecks, W)] : []),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Post-Activity Checks'),
          ...(Array.isArray(content.postActivityChecks) ? [checkTable(content.postActivityChecks, W)] : []),
          h.spacer(200),

          section('Material Verification'),
          ...(Array.isArray(content.materialVerification) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('Material', Math.round(W * 0.3), { fontSize: 14 }),
              h.headerCell('Specified Grade', Math.round(W * 0.25), { fontSize: 14 }),
              h.headerCell('Certificate Required', Math.round(W * 0.3), { fontSize: 14 }),
              h.headerCell('Verified', W - Math.round(W * 0.85), { fontSize: 14, alignment: AlignmentType.CENTER }),
            ] }),
            ...content.materialVerification.map((m: any, i: number) => new TableRow({ children: [
              h.dataCell(m.material || '', Math.round(W * 0.3), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(m.specifiedGrade || '', Math.round(W * 0.25), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(m.certificateRequired || '', Math.round(W * 0.3), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell('', W - Math.round(W * 0.85), { fontSize: 14, alignment: AlignmentType.CENTER, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Testing Requirements'),
          ...(Array.isArray(content.testingRequirements) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('Test', Math.round(W * 0.25), { fontSize: 14 }),
              h.headerCell('Standard', Math.round(W * 0.18), { fontSize: 14 }),
              h.headerCell('Frequency', Math.round(W * 0.18), { fontSize: 14 }),
              h.headerCell('Acceptance Criteria', Math.round(W * 0.27), { fontSize: 14 }),
              h.headerCell('Result', W - Math.round(W * 0.88), { fontSize: 14 }),
            ] }),
            ...content.testingRequirements.map((t: any, i: number) => new TableRow({ children: [
              h.dataCell(t.test || '', Math.round(W * 0.25), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(t.standard || '', Math.round(W * 0.18), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(t.frequency || '', Math.round(W * 0.18), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(t.acceptanceCriteria || '', Math.round(W * 0.27), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell('', W - Math.round(W * 0.88), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Overall Inspection Result'),
          h.infoTable([
            { label: 'Inspected By', value: signOff.inspectedBy || '' },
            { label: 'Date', value: signOff.date || '' },
            { label: 'Result', value: signOff.result || '' },
            { label: 'Comments', value: signOff.comments || '' },
          ], W),
          h.spacer(200),

          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),

          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 },
            children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
        ],
      },
    ],
  });
}
