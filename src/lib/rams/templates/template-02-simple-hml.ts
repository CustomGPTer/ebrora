// =============================================================================
// Template 02 — Simple H/M/L Risk Rating
// Streamlined format: compact front page, H/M/L risk table, 8-section MS
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template02Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate02(content: Template02Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page (compact 4-column layout)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 300 },
            children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })],
          }),
          h.sectionHeading('Project & Document Details'),
          buildCompactInfoTable(content),
          h.spacer(200),
          h.sectionHeading('Task Description'),
          h.bodyText(content.taskDescription),
          h.spacer(200),
          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
        ],
      },
      // SECTION 2 — Landscape Risk Assessment (H/M/L)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 28),
          h.hmlRiskKey(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),
          buildHMLHazardTable(content),
        ],
      },
      // SECTION 3 — Portrait Method Statement (8 sections)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),
          h.subHeading('1. Sequence of Works'),
          h.bodyText(content.sequenceOfWorks),
          h.subHeading('2. Site Set-Up & Access'),
          h.bodyText(content.siteSetupAccess),
          h.subHeading('3. Personal Protective Equipment (PPE)'),
          h.bodyText(content.ppeRequirements),
          h.subHeading('4. Competency & Training Requirements'),
          h.bodyText(content.competencyRequirements),
          h.subHeading('5. Environmental Considerations & Waste'),
          h.bodyText(content.environmentalConsiderations),
          h.bodyText(content.wasteManagement),
          h.subHeading('6. Emergency Procedures'),
          h.bodyText(content.emergencyProcedures),
          h.subHeading('7. Welfare Facilities'),
          h.bodyText(content.welfareFacilities),
          h.subHeading('8. Housekeeping'),
          h.bodyText(content.housekeeping),
          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed on this RAMS before commencing work.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(12, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

function buildCompactInfoTable(content: Template02Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const c1 = Math.round(tw * 0.2);
  const c2 = Math.round(tw * 0.3);
  const c3 = Math.round(tw * 0.2);
  const c4 = tw - c1 - c2 - c3;
  const rows = [
    ['Project Name', content.projectName, 'Document Ref', content.documentRef],
    ['Site Address', content.siteAddress, 'Date', content.dateOfAssessment],
    ['Client', content.clientName, 'Review Date', content.reviewDate],
    ['Contractor', content.contractorName, 'Work Area', content.workArea],
    ['Working Hours', content.workingHours, 'Workforce', content.workforceSize],
    ['Training/Tickets', content.trainingTickets, '', ''],
  ];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: [c1, c2, c3, c4],
    rows: rows.map(r => new TableRow({
      children: [
        h.headerCell(r[0], c1, { fontSize: 14 }),
        h.dataCell(r[1], c2, { fontSize: 14 }),
        r[2] ? h.headerCell(r[2], c3, { fontSize: 14 }) : h.emptyCell(c3, { fillColor: h.EBRORA_GREEN }),
        h.dataCell(r[3], c4, { fontSize: 14 }),
      ],
    })),
  });
}

function buildHMLHazardTable(content: Template02Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [500, Math.round(tw * 0.16), Math.round(tw * 0.09), Math.round(tw * 0.08), Math.round(tw * 0.28), Math.round(tw * 0.08), Math.round(tw * 0.11), 0];
  cols[7] = tw - cols.slice(0, 7).reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({
        children: [
          h.headerCell('Ref', cols[0], { fontSize: 12 }),
          h.headerCell('Hazard', cols[1], { fontSize: 12 }),
          h.headerCell('Who at Risk', cols[2], { fontSize: 12 }),
          h.headerCell('Initial Risk', cols[3], { fontSize: 12, alignment: AlignmentType.CENTER }),
          h.headerCell('Control Measures', cols[4], { fontSize: 12 }),
          h.headerCell('Residual', cols[5], { fontSize: 12, alignment: AlignmentType.CENTER }),
          h.headerCell('Responsible', cols[6], { fontSize: 12 }),
          h.headerCell('Monitoring', cols[7], { fontSize: 12 }),
        ],
      }),
      ...content.hazards.map((hz, idx) => new TableRow({
        children: [
          h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 12, alignment: AlignmentType.CENTER }),
          h.dataCell(hz.hazard, cols[1], { fontSize: 12 }),
          h.dataCell(hz.whoAtRisk, cols[2], { fontSize: 12 }),
          h.dataCell(hz.initialRisk, cols[3], { fontSize: 12, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.initialRisk), color: h.WHITE }),
          h.dataCell(hz.controlMeasures, cols[4], { fontSize: 12 }),
          h.dataCell(hz.residualRisk, cols[5], { fontSize: 12, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.residualRisk), color: h.WHITE }),
          h.dataCell(hz.responsiblePerson, cols[6], { fontSize: 12 }),
          h.dataCell(hz.monitoring, cols[7], { fontSize: 12 }),
        ],
      })),
    ],
  });
}
