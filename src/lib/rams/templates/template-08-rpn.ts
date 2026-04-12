// =============================================================================
// Template 08 — RPN (Risk Priority Number) — L×S×D scoring out of 125
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template08Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate08(content: Template08Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page + Scoring Methodology
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: '◆ RISK PRIORITY NUMBER (RPN) FORMAT', bold: true, size: 24, font: 'Arial', color: h.RPN_PURPLE })] }),

          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Work Location', value: content.workLocation },
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date', value: content.dateOfAssessment },
            { label: 'Working Hours', value: content.workingHours },
            { label: 'Workforce', value: content.workforceSize },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(100),
          h.sectionHeading('Task Description'), ...h.richBodyText(content.taskDescription),
          h.spacer(100),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(200),

          // Scoring Methodology
          h.sectionHeading('◆ RPN Scoring Methodology', 24, h.RPN_PURPLE),
          h.bodyText('RPN = Likelihood × Severity × Detectability. Score range: 1–125.', 16, { bold: true }),
          h.spacer(100),
          buildScaleTable('Likelihood (L)', [['1 – Rare', 'Conceivable but only in exceptional circumstances'], ['2 – Unlikely', 'Not expected but possible'], ['3 – Possible', 'Could occur at some point'], ['4 – Likely', 'Will probably occur in most circumstances'], ['5 – Almost Certain', 'Expected to occur unless additional controls applied']]),
          h.spacer(80),
          buildScaleTable('Severity (S)', [['1 – Negligible', 'No injury or insignificant impact'], ['2 – Minor', 'First aid treatment only'], ['3 – Moderate', 'Medical treatment, 3-day absence'], ['4 – Major', 'Specified injury, hospitalisation'], ['5 – Catastrophic', 'Death or permanent disability']]),
          h.spacer(80),
          buildScaleTable('Detectability (D)', [['1 – Almost Certain', 'Control failure will be detected immediately'], ['2 – High', 'Good chance of detection before harm'], ['3 – Moderate', 'May be detected with monitoring'], ['4 – Low', 'Unlikely to be detected before harm'], ['5 – Undetectable', 'No reliable method of detection']]),
          h.spacer(100),

          // RPN Action Bands
          h.sectionHeading('◆ RPN Action Bands', 24, h.RPN_PURPLE),
          buildActionBandsTable(),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (15 columns with RPN scoring)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment — RPN Scoring', 28),
          buildRPNHazardTable(content),
        ],
      },

      // SECTION 3 — Portrait Method Statement
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),
          h.subHeading('1. Sequence of Works'), ...h.richBodyText(content.sequenceOfWorks),
          h.subHeading('2. PPE Requirements'), ...h.richBodyText(content.ppeRequirements),
          h.subHeading('3. Competency & Training'), ...h.richBodyText(content.competencyRequirements),
          h.subHeading('4. Temporary Works'), ...h.richBodyText(content.temporaryWorks),
          h.subHeading('5. Environmental Considerations'), ...h.richBodyText(content.environmentalConsiderations),
          h.subHeading('6. Waste Management'), ...h.richBodyText(content.wasteManagement),
          h.subHeading('7. Emergency Procedures'), ...h.richBodyText(content.emergencyProcedures),
          h.subHeading('8. Welfare Facilities'), ...h.richBodyText(content.welfareFacilities),
          h.subHeading('9. Communication Arrangements'), ...h.richBodyText(content.communicationArrangements),
          h.subHeading('10. Monitoring & Review'), ...h.richBodyText(content.monitoringArrangements),

          // Controls Effectiveness Review (unique to RPN)
          h.subHeading('11. ◆ Controls Effectiveness Review', 20, h.RPN_PURPLE),
          h.bodyText('Record target vs actual RPN scores for key controls to verify effectiveness.', 16, { italic: true }),
          buildControlsReviewTable(content),

          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

function buildScaleTable(title: string, rows: string[][]): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 0]; cols[1] = tw - cols[0];
  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell(title, tw, { fillColor: h.RPN_PURPLE, fontSize: 14, columnSpan: 2 })] }),
    ...rows.map(r => new TableRow({ children: [h.dataCell(r[0], cols[0], { fontSize: 14, bold: true, fillColor: h.RPN_PURPLE_LIGHT }), h.dataCell(r[1], cols[1], { fontSize: 14 })] })),
  ] });
}

function buildActionBandsTable(): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [1500, 1500, 0]; cols[2] = tw - cols[0] - cols[1];
  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('RPN Range', cols[0], { fillColor: h.RPN_PURPLE, fontSize: 14 }), h.headerCell('Band', cols[1], { fillColor: h.RPN_PURPLE, fontSize: 14 }), h.headerCell('Required Action', cols[2], { fillColor: h.RPN_PURPLE, fontSize: 14 })] }),
    new TableRow({ children: [h.dataCell('76–125', cols[0], { fontSize: 14, bold: true, fillColor: h.RPN_RED, color: h.WHITE }), h.dataCell('Critical', cols[1], { fontSize: 14, bold: true, fillColor: h.RPN_RED, color: h.WHITE }), h.dataCell('Stop work. Senior management review required before proceeding.', cols[2], { fontSize: 14 })] }),
    new TableRow({ children: [h.dataCell('36–75', cols[0], { fontSize: 14, bold: true, fillColor: h.RPN_AMBER, color: h.WHITE }), h.dataCell('High', cols[1], { fontSize: 14, bold: true, fillColor: h.RPN_AMBER, color: h.WHITE }), h.dataCell('Additional controls required. Supervisor authorisation needed.', cols[2], { fontSize: 14 })] }),
    new TableRow({ children: [h.dataCell('13–35', cols[0], { fontSize: 14, bold: true, fillColor: h.RPN_YELLOW }), h.dataCell('Medium', cols[1], { fontSize: 14, bold: true, fillColor: h.RPN_YELLOW }), h.dataCell('Proceed with monitoring. Review controls periodically.', cols[2], { fontSize: 14 })] }),
    new TableRow({ children: [h.dataCell('1–12', cols[0], { fontSize: 14, bold: true, fillColor: h.RPN_GREEN_BAND, color: h.WHITE }), h.dataCell('Low', cols[1], { fontSize: 14, bold: true, fillColor: h.RPN_GREEN_BAND, color: h.WHITE }), h.dataCell('Adequately controlled. Routine monitoring sufficient.', cols[2], { fontSize: 14 })] }),
  ] });
}

function buildRPNHazardTable(c: Template08Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  // 15 columns: Ref, Activity, Hazard, Who, L, S, D, RPN, Controls, rL, rS, rD, rRPN, Detection Method, Review
  const numW = 360; const refW = 350;
  const actW = Math.round(tw * 0.08);
  const hazW = Math.round(tw * 0.09);
  const whoW = Math.round(tw * 0.05);
  const ctrlW = Math.round(tw * 0.15);
  const detW = Math.round(tw * 0.09);
  const fixed = refW + actW + hazW + whoW + (numW * 8) + ctrlW + detW;
  const remainW = tw - fixed;
  const cols = [refW, actW, hazW, whoW, numW, numW, numW, numW, ctrlW, numW, numW, numW, numW, detW, remainW];

  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [
      h.headerCell('Ref', cols[0], { fontSize: 18 }),
      h.headerCell('Activity', cols[1], { fontSize: 18 }),
      h.headerCell('Hazard', cols[2], { fontSize: 18 }),
      h.headerCell('Who', cols[3], { fontSize: 18 }),
      h.headerCell('◆L', cols[4], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆S', cols[5], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆D', cols[6], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆RPN', cols[7], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('Control Measures', cols[8], { fontSize: 18 }),
      h.headerCell('◆rL', cols[9], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆rS', cols[10], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆rD', cols[11], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆rRPN', cols[12], { fontSize: 18, fillColor: h.RPN_PURPLE, alignment: AlignmentType.CENTER }),
      h.headerCell('◆Detection Method', cols[13], { fontSize: 18, fillColor: h.RPN_PURPLE }),
      h.headerCell('Review', cols[14], { fontSize: 18 }),
    ] }),
    ...c.hazards.map((hz, idx) => new TableRow({ children: [
      h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 18, alignment: AlignmentType.CENTER }),
      h.dataCell(hz.activity || '', cols[1], { fontSize: 18 }),
      h.dataCell(hz.hazard, cols[2], { fontSize: 18 }),
      h.dataCell(hz.whoAtRisk, cols[3], { fontSize: 18 }),
      h.dataCell(String(hz.likelihoodInitial), cols[4], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.severityInitial), cols[5], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.detectabilityInitial), cols[6], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.rpnInitial), cols[7], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.rpnColor(hz.rpnInitial), color: hz.rpnInitial >= 36 ? h.WHITE : h.BLACK }),
      h.dataCell(hz.controlMeasures, cols[8], { fontSize: 18 }),
      h.dataCell(String(hz.likelihoodResidual), cols[9], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.severityResidual), cols[10], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.detectabilityResidual), cols[11], { fontSize: 18, alignment: AlignmentType.CENTER, fillColor: h.RPN_PURPLE_LIGHT }),
      h.dataCell(String(hz.rpnResidual), cols[12], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.rpnColor(hz.rpnResidual), color: hz.rpnResidual >= 36 ? h.WHITE : h.BLACK }),
      h.dataCell(hz.detectionMethod, cols[13], { fontSize: 18, fillColor: h.RPN_PURPLE_LIGHT }),
      h.emptyCell(cols[14]),
    ] })),
  ] });
}

function buildControlsReviewTable(c: Template08Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 1000, 1000, 1800, 0]; cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Control Measure', cols[0], { fillColor: h.RPN_PURPLE, fontSize: 14 }), h.headerCell('Target RPN', cols[1], { fillColor: h.RPN_PURPLE, fontSize: 14, alignment: AlignmentType.CENTER }), h.headerCell('Actual RPN', cols[2], { fillColor: h.RPN_PURPLE, fontSize: 14, alignment: AlignmentType.CENTER }), h.headerCell('Reviewed By', cols[3], { fillColor: h.RPN_PURPLE, fontSize: 14 }), h.headerCell('Action/Notes', cols[4], { fillColor: h.RPN_PURPLE, fontSize: 14 })] }),
    ...c.controlsEffectivenessReview.map(ce => new TableRow({ children: [h.dataCell(ce.control, cols[0], { fontSize: 14 }), h.dataCell(String(ce.targetRPN), cols[1], { fontSize: 14, alignment: AlignmentType.CENTER }), h.dataCell(String(ce.actualRPN), cols[2], { fontSize: 14, alignment: AlignmentType.CENTER }), h.dataCell(ce.reviewedBy, cols[3], { fontSize: 14 }), h.dataCell(ce.actionNotes, cols[4], { fontSize: 14 })] })),
  ] });
}
