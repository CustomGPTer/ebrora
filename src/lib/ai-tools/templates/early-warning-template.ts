// =============================================================================
// Early Warning Notice — NEC Contract Template
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'D97706';
const ACCENT_LIGHT = 'FEF9C3';
const NEC_BLUE = '1E3A5F';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: NEC_BLUE })] });
}
// prose() now imported from docx-helpers via h.prose()

export async function buildEarlyWarningDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const cost = content.potentialImpactOnCost || {};
  const prog = content.potentialImpactOnProgramme || {};
  const rrm = content.riskReductionMeeting || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 80 }, children: [
            new TextRun({ text: 'EARLY WARNING NOTICE', bold: true, size: 44, font: 'Arial', color: NEC_BLUE }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: `${content.contractForm || 'NEC4 ECC'} — ${content.clauseReference || 'Clause 15.1'}`, size: 22, font: 'Arial', color: ACCENT, bold: true }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          h.sectionHeading('Notice Details'),
          h.infoTable([
            { label: 'Notice Reference', value: content.documentRef || '' },
            { label: 'Notice Date', value: content.noticeDate || '' },
            { label: 'Notified By', value: content.notifiedBy || '' },
            { label: 'Notified To', value: content.notifiedTo || '' },
            { label: 'Contract Reference', value: content.contractReference || '' },
            { label: 'Contract Form', value: content.contractForm || '' },
            { label: 'Clause Reference', value: content.clauseReference || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
            { label: 'Date First Identified', value: content.dateFirstIdentified || '' },
            { label: 'Identified By', value: content.identifiedBy || '' },
          ], W),
          h.spacer(200),

          section('Risk Description'),
          ...h.prose(content.riskDescription),
          h.spacer(160),

          section('Evidence Summary'),
          ...h.prose(content.evidenceSummary),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Potential Impact on Cost'),
          h.infoTable([
            { label: 'Estimated Additional Cost', value: cost.estimatedAdditionalCost || '' },
            { label: 'Assumptions', value: cost.assumptions || '' },
          ], W),
          h.spacer(80),
          ...h.prose(cost.costBreakdown),
          h.spacer(200),

          section('Potential Impact on Programme'),
          h.infoTable([
            { label: 'Estimated Delay', value: prog.estimatedDelay || '' },
            { label: 'Critical Path Affected', value: prog.criticalPathAffected || '' },
            { label: 'Key Dates Affected', value: prog.keyDatesAffected || '' },
          ], W),
          h.spacer(80),
          ...h.prose(prog.programmeNarrative),
          h.spacer(200),

          section('Potential Impact on Quality / Performance'),
          ...h.prose(content.potentialImpactOnQuality),
          h.spacer(200),

          section('Proposed Mitigation Measures'),
          ...(Array.isArray(content.proposedMitigation) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.06), Math.round(W * 0.38), Math.round(W * 0.2), Math.round(W * 0.18), W - Math.round(W * 0.82)], rows: [
            new TableRow({ children: [
              h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }),
              h.headerCell('Mitigation Action', Math.round(W * 0.38), { fontSize: 14 }),
              h.headerCell('Responsible', Math.round(W * 0.2), { fontSize: 14 }),
              h.headerCell('Target Date', Math.round(W * 0.18), { fontSize: 14 }),
              h.headerCell('Est. Saving', W - Math.round(W * 0.82), { fontSize: 14 }),
            ] }),
            ...content.proposedMitigation.map((m: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.dataCell(m.action || '', Math.round(W * 0.38), { fontSize: 14 }),
              h.dataCell(m.responsibleParty || '', Math.round(W * 0.2), { fontSize: 14 }),
              h.dataCell(m.targetDate || '', Math.round(W * 0.18), { fontSize: 14 }),
              h.dataCell(m.estimatedCostSaving || '', W - Math.round(W * 0.82), { fontSize: 14 }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Risk Reduction Meeting'),
          h.infoTable([
            { label: 'Meeting Requested', value: rrm.requested || '' },
            { label: 'Proposed Date', value: rrm.proposedDate || '' },
            { label: 'Proposed Attendees', value: rrm.proposedAttendees || '' },
          ], W),
          h.spacer(120),
          ...(content.relatedNotices ? [h.infoTable([{ label: 'Related Notices', value: content.relatedNotices }], W)] : []),
          h.spacer(200),

          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),

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
