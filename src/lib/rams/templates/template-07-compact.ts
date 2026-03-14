// =============================================================================
// Template 07 — Compact (4 pages, lightweight for routine tasks)
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType, ShadingType } from 'docx';
import { Template07Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate07(content: Template07Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 16 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page (everything on one page)
      {
        properties: {
          page: {
            size: { width: h.A4_WIDTH, height: h.A4_HEIGHT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 32, font: 'Arial', color: h.EBRORA_GREEN })] }),

          // Compact 5-row 4-column info table
          buildCompactInfoGrid(content),
          h.spacer(100),

          h.sectionHeading('Task Description', 20),
          h.bodyText(content.taskDescription, 16),
          h.spacer(80),

          h.sectionHeading('Resources & PPE', 20),
          h.bodyText(content.resourcesPPE, 16),
          h.spacer(100),

          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH_NARROW),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (H/M/L, 8 cols)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 24),
          // Inline risk key (single line)
          new Paragraph({ spacing: { after: 100 }, children: [
            new TextRun({ text: 'Risk Key:  ', size: 14, font: 'Arial', bold: true }),
            new TextRun({ text: '  HIGH  ', size: 14, font: 'Arial', bold: true, color: h.WHITE, shading: { type: ShadingType.CLEAR, fill: h.HML_HIGH } }),
            new TextRun({ text: '  ', size: 14 }),
            new TextRun({ text: '  MEDIUM  ', size: 14, font: 'Arial', bold: true, color: h.WHITE, shading: { type: ShadingType.CLEAR, fill: h.HML_MEDIUM } }),
            new TextRun({ text: '  ', size: 14 }),
            new TextRun({ text: '  LOW  ', size: 14, font: 'Arial', bold: true, color: h.WHITE, shading: { type: ShadingType.CLEAR, fill: h.HML_LOW } }),
          ] }),
          h.spacer(80),
          buildCompactHazardTable(content),
          h.spacer(200),

          // Key Hazard Summary (unique to compact template)
          h.sectionHeading('Key Hazard Summary', 22),
          h.bodyText('Quick reference for toolbox talk briefing — the 5 critical points.', 14, { italic: true }),
          buildKeyHazardTable(content),
        ],
      },

      // SECTION 3 — Portrait Method Statement (7 combined sections)
      {
        properties: {
          page: {
            size: { width: h.A4_WIDTH, height: h.A4_HEIGHT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 24),
          h.subHeading('1. Sequence of Works', 18), h.bodyText(content.sequenceOfWorks, 16),
          h.subHeading('2. PPE Requirements', 18), h.bodyText(content.ppeRequirements, 16),
          h.subHeading('3. Competency Requirements', 18), h.bodyText(content.competencyRequirements, 16),
          h.subHeading('4. Environmental & Waste', 18), h.bodyText(content.environmentalConsiderations, 16),
          h.subHeading('5. Emergency Procedures', 18), h.bodyText(content.emergencyProcedures, 16),
          h.subHeading('6. Welfare Facilities', 18), h.bodyText(content.welfareFacilities, 16),
          h.subHeading('7. Coordination & Communication', 18), h.bodyText(content.coordinationCommunication, 16),
          h.spacer(200),
          h.sectionHeading('Briefing Record', 20),
          h.briefingRecordTable(10, h.A4_CONTENT_WIDTH_NARROW),
        ],
      },
    ],
  });
}




function buildCompactInfoGrid(c: Template07Content): Table {
  const tw = h.A4_CONTENT_WIDTH_NARROW;
  const c1 = Math.round(tw * 0.18); const c2 = Math.round(tw * 0.32); const c3 = Math.round(tw * 0.18); const c4 = tw - c1 - c2 - c3;
  const rows = [
    ['Project', c.projectName, 'Ref', c.documentRef],
    ['Site', c.siteAddress, 'Date', c.dateOfAssessment],
    ['Client', c.clientName, 'Review', c.reviewDate],
    ['Contractor', c.contractorName, 'Area', c.workArea],
    ['Hours', c.workingHours, 'Workforce', c.workforceSize],
  ];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: [c1, c2, c3, c4], rows: rows.map(r => new TableRow({ children: [
    h.headerCell(r[0], c1, { fontSize: 13 }), h.dataCell(r[1], c2, { fontSize: 13 }),
    h.headerCell(r[2], c3, { fontSize: 13 }), h.dataCell(r[3], c4, { fontSize: 13 }),
  ] })) });
}

function buildCompactHazardTable(c: Template07Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.15), Math.round(tw * 0.08), Math.round(tw * 0.07), Math.round(tw * 0.3), Math.round(tw * 0.07), Math.round(tw * 0.1), 0];
  cols[7] = tw - cols.slice(0, 7).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Ref', cols[0], { fontSize: 11 }), h.headerCell('Hazard', cols[1], { fontSize: 11 }), h.headerCell('Who', cols[2], { fontSize: 11 }), h.headerCell('Risk', cols[3], { fontSize: 11, alignment: AlignmentType.CENTER }), h.headerCell('Control Measures', cols[4], { fontSize: 11 }), h.headerCell('Res.', cols[5], { fontSize: 11, alignment: AlignmentType.CENTER }), h.headerCell('Action By', cols[6], { fontSize: 11 }), h.headerCell('Notes', cols[7], { fontSize: 11 })] }),
    ...c.hazards.map((hz, idx) => new TableRow({ children: [
      h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 11, alignment: AlignmentType.CENTER }),
      h.dataCell(hz.hazard, cols[1], { fontSize: 11 }), h.dataCell(hz.whoAtRisk, cols[2], { fontSize: 11 }),
      h.dataCell(hz.initialRisk, cols[3], { fontSize: 11, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.initialRisk), color: h.WHITE }),
      h.dataCell(hz.controlMeasures, cols[4], { fontSize: 11 }),
      h.dataCell(hz.residualRisk, cols[5], { fontSize: 11, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.residualRisk), color: h.WHITE }),
      h.dataCell(hz.responsiblePerson, cols[6], { fontSize: 11 }), h.dataCell(hz.monitoring, cols[7], { fontSize: 11 }),
    ] })),
  ] });
}

function buildKeyHazardTable(c: Template07Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [Math.round(tw * 0.25), Math.round(tw * 0.35), 0]; cols[2] = tw - cols[0] - cols[1];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Key Hazard', cols[0], { fontSize: 14 }), h.headerCell('Critical Control', cols[1], { fontSize: 14 }), h.headerCell('Stop Work If...', cols[2], { fontSize: 14, fillColor: h.HML_HIGH })] }),
    ...c.keyHazardSummary.map(kh => new TableRow({ children: [h.dataCell(kh.hazard, cols[0], { fontSize: 14, bold: true }), h.dataCell(kh.criticalControl, cols[1], { fontSize: 14 }), h.dataCell(kh.stopWorkIf, cols[2], { fontSize: 14 })] })),
  ] });
}
