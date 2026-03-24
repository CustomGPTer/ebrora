// =============================================================================
// Non-Conformance Report — Dedicated Template (ISO 9001 aligned)
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'BE123C';
const ACCENT_LIGHT = 'FDE8EC';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
function prose(text: string): Paragraph[] {
  return (text || 'Not specified.').split(/\n\n+/).filter(Boolean).map(p => h.bodyText(p));
}

export async function buildNcrDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const spec = content.specifiedRequirement || {};
  const actual = content.actualCondition || {};
  const rca = content.rootCauseAnalysis || {};
  const disp = content.disposition || {};
  const close = content.closeOutVerification || {};

  const catColour = (content.ncrCategory || '').toLowerCase().includes('major') ? ACCENT : (content.ncrCategory || '').toLowerCase().includes('minor') ? 'F39C12' : '3B82F6';

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'NON-CONFORMANCE REPORT', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          new Paragraph({ spacing: { before: 100, after: 200 }, shading: { type: ShadingType.CLEAR, fill: catColour }, children: [
            new TextRun({ text: `  NCR CATEGORY: ${(content.ncrCategory || 'MINOR').toUpperCase()}  `, bold: true, size: 28, font: 'Arial', color: h.WHITE }),
          ] }),

          h.sectionHeading('NCR Details'),
          h.infoTable([
            { label: 'NCR Reference', value: content.documentRef || '' },
            { label: 'Date Raised', value: content.raisedDate || '' },
            { label: 'Raised By', value: content.raisedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Contract Reference', value: content.contractReference || '' },
            { label: 'Discipline', value: content.discipline || '' },
            { label: 'Location', value: content.location || '' },
            { label: 'Discovered During', value: content.discoveredDuring || '' },
          ], W),
          h.spacer(200),

          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Raised By', name: content.raisedBy || '' },
            { role: 'Reviewed By', name: '' },
            { role: 'Closed Out By', name: '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Non-Conformance Description'),
          ...prose(content.nonConformanceDescription),
          h.spacer(200),

          section('Specified Requirement'),
          ...prose(spec.description),
          h.spacer(80),
          h.infoTable([
            { label: 'Drawing Reference', value: spec.drawingRef || '' },
            { label: 'Specification Clause', value: spec.specClause || '' },
            { label: 'Standard Reference', value: spec.standardRef || '' },
          ], W),
          h.spacer(200),

          section('Actual Condition Found'),
          ...prose(actual.description),
          h.spacer(80),
          h.infoTable([
            { label: 'Measurements', value: actual.measurements || '' },
            { label: 'Photographic Evidence', value: actual.photographicEvidence || '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Root Cause Analysis'),
          h.infoTable([{ label: 'Method', value: rca.method || '5 Whys' }], W),
          h.spacer(80),
          ...prose(rca.analysis),
          h.spacer(80),
          new Paragraph({ spacing: { before: 100, after: 120 }, shading: { type: ShadingType.CLEAR, fill: ACCENT_LIGHT }, children: [
            new TextRun({ text: '  ROOT CAUSE: ', bold: true, size: 20, font: 'Arial', color: ACCENT }),
            new TextRun({ text: rca.rootCause || '', size: 18, font: 'Arial' }),
          ] }),
          h.spacer(80),
          ...(Array.isArray(rca.contributingFactors) ? [
            h.subHeading('Contributing Factors'),
            ...rca.contributingFactors.map((f: string) => new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 },
              children: [new TextRun({ text: f, size: 18, font: 'Arial' })] })),
          ] : []),
          h.spacer(200),

          section('Immediate Containment Actions'),
          ...(Array.isArray(content.immediateContainmentActions) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('Action', Math.round(W * 0.45), { fontSize: 14 }),
              h.headerCell('Taken By', Math.round(W * 0.2), { fontSize: 14 }),
              h.headerCell('Date', Math.round(W * 0.18), { fontSize: 14 }),
              h.headerCell('Status', W - Math.round(W * 0.83), { fontSize: 14 }),
            ] }),
            ...content.immediateContainmentActions.map((a: any) => new TableRow({ children: [
              h.dataCell(a.action || '', Math.round(W * 0.45), { fontSize: 14 }),
              h.dataCell(a.takenBy || '', Math.round(W * 0.2), { fontSize: 14 }),
              h.dataCell(a.date || '', Math.round(W * 0.18), { fontSize: 14 }),
              h.dataCell(a.status || '', W - Math.round(W * 0.83), { fontSize: 14, bold: true }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Corrective Actions'),
          ...(Array.isArray(content.correctiveActions) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('No.', Math.round(W * 0.06), { fontSize: 13 }),
              h.headerCell('Corrective Action', Math.round(W * 0.34), { fontSize: 13 }),
              h.headerCell('Responsible', Math.round(W * 0.18), { fontSize: 13 }),
              h.headerCell('Target', Math.round(W * 0.14), { fontSize: 13 }),
              h.headerCell('Status', Math.round(W * 0.12), { fontSize: 13 }),
              h.headerCell('Verification', W - Math.round(W * 0.84), { fontSize: 13 }),
            ] }),
            ...content.correctiveActions.map((a: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 13, alignment: AlignmentType.CENTER }),
              h.dataCell(a.action || '', Math.round(W * 0.34), { fontSize: 13 }),
              h.dataCell(a.responsiblePerson || '', Math.round(W * 0.18), { fontSize: 13 }),
              h.dataCell(a.targetDate || '', Math.round(W * 0.14), { fontSize: 13 }),
              h.dataCell(a.status || 'Open', Math.round(W * 0.12), { fontSize: 13, bold: true }),
              h.dataCell(a.verificationMethod || '', W - Math.round(W * 0.84), { fontSize: 13 }),
            ] })),
          ] })] : []),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Preventive Actions'),
          ...(Array.isArray(content.preventiveActions) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }),
              h.headerCell('Preventive Action', Math.round(W * 0.44), { fontSize: 14 }),
              h.headerCell('Responsible', Math.round(W * 0.22), { fontSize: 14 }),
              h.headerCell('Target Date', Math.round(W * 0.16), { fontSize: 14 }),
              h.headerCell('Status', W - Math.round(W * 0.88), { fontSize: 14 }),
            ] }),
            ...content.preventiveActions.map((a: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.dataCell(a.action || '', Math.round(W * 0.44), { fontSize: 14 }),
              h.dataCell(a.responsiblePerson || '', Math.round(W * 0.22), { fontSize: 14 }),
              h.dataCell(a.targetDate || '', Math.round(W * 0.16), { fontSize: 14 }),
              h.dataCell(a.status || 'Open', W - Math.round(W * 0.88), { fontSize: 14, bold: true }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Disposition'),
          new Paragraph({ spacing: { before: 100, after: 120 }, shading: { type: ShadingType.CLEAR, fill: ACCENT_LIGHT }, children: [
            new TextRun({ text: `  DISPOSITION: ${(disp.decision || '').toUpperCase()}  `, bold: true, size: 22, font: 'Arial', color: ACCENT }),
          ] }),
          ...prose(disp.justification),
          h.spacer(80),
          h.infoTable([
            { label: 'Designer Approval Required', value: disp.designerApprovalRequired || '' },
            { label: 'Client Approval Required', value: disp.clientApprovalRequired || '' },
          ], W),
          h.spacer(200),

          section('Close-Out Verification'),
          h.infoTable([
            { label: 'Verified By', value: close.verifiedBy || '' },
            { label: 'Verification Date', value: close.verificationDate || '' },
            { label: 'Verification Method', value: close.verificationMethod || '' },
            { label: 'Result', value: close.result || '' },
            { label: 'Evidence', value: close.evidence || '' },
          ], W),
          h.spacer(200),

          ...(content.additionalNotes ? [section('Additional Notes'), ...prose(content.additionalNotes), h.spacer(160)] : []),

          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
            children: [new TextRun({ text: 'This NCR must remain open until all corrective actions are verified and closed out.', size: 16, font: 'Arial', color: h.GREY_DARK, italics: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 },
            children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
        ],
      },
    ],
  });
}
