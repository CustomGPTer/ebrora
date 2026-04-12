// =============================================================================
// Template 10 — Step-by-Step Integrated (combined RA + MS in one table)
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template10Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate10(content: Template10Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: '▶ STEP-BY-STEP INTEGRATED FORMAT', bold: true, size: 24, font: 'Arial', color: h.STEP_BLUE })] }),

          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Work Area', value: content.workArea },
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
        ],
      },

      // SECTION 2 — Landscape Integrated Step-by-Step Table (replaces separate RA + MS)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('▶ Integrated Step-by-Step Method & Risk Assessment', 24, h.STEP_BLUE),
          h.bodyText('Each work step includes its hazards, risk rating, controls, and PPE requirements alongside the instruction.', 16, { italic: true }),
          h.spacer(100),
          h.hmlRiskKey(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(150),
          buildIntegratedTable(content),
          h.spacer(300),

          // Toolbox Talk Step Summary (unique)
          h.sectionHeading('▶ Toolbox Talk Step Summary', 22, h.STEP_BLUE),
          h.bodyText('Condensed briefing points for the supervisor to read out.', 14, { italic: true }),
          buildToolboxSummaryTable(content),
          h.spacer(200),

          // Permit & Isolation Log (unique)
          h.sectionHeading('▶ Permit & Isolation Log', 22, h.STEP_BLUE),
          buildPermitLogTable(content),
        ],
      },

      // SECTION 3 — Portrait Supporting Information (not a full MS — method is in the table)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Supporting Information', 28),
          h.bodyText('The method statement for this work is contained within the integrated step-by-step table above. The following sections provide additional supporting information.', 16, { italic: true }),
          h.spacer(100),

          h.subHeading('1. Interfaces & Coordination'), ...h.richBodyText(content.interfaces),
          h.subHeading('2. Temporary Works'), ...h.richBodyText(content.temporaryWorks),
          h.subHeading('3. PPE Summary'), ...h.richBodyText(content.ppeRequirements),
          h.subHeading('4. Environmental Considerations'), ...h.richBodyText(content.environmentalConsiderations),
          h.subHeading('5. Waste Management'), ...h.richBodyText(content.wasteManagement),
          h.subHeading('6. Emergency Procedures'), ...h.richBodyText(content.emergencyProcedures),
          h.subHeading('7. Welfare Facilities'), ...h.richBodyText(content.welfareFacilities),
          h.subHeading('8. Competency Requirements'), ...h.richBodyText(content.competencyRequirements),

          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed on this RAMS before commencing work.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

function buildIntegratedTable(c: Template10Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [
    450,                          // Step
    Math.round(tw * 0.18),       // Work Instruction (blue)
    Math.round(tw * 0.14),       // Hazards
    Math.round(tw * 0.06),       // Who
    Math.round(tw * 0.05),       // Risk
    Math.round(tw * 0.22),       // Controls
    Math.round(tw * 0.05),       // Residual
    Math.round(tw * 0.08),       // Responsible
    0,                            // PPE (blue)
  ];
  cols[8] = tw - cols.slice(0, 8).reduce((a, b) => a + b, 0);

  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [
      h.headerCell('Step', cols[0], { fontSize: 18 }),
      h.headerCell('▶ Work Instruction', cols[1], { fontSize: 18, fillColor: h.STEP_BLUE }),
      h.headerCell('Hazards at this Step', cols[2], { fontSize: 18 }),
      h.headerCell('Who at Risk', cols[3], { fontSize: 18 }),
      h.headerCell('Risk', cols[4], { fontSize: 18, alignment: AlignmentType.CENTER }),
      h.headerCell('Control Measures & Precautions', cols[5], { fontSize: 18 }),
      h.headerCell('Residual', cols[6], { fontSize: 18, alignment: AlignmentType.CENTER }),
      h.headerCell('Responsible', cols[7], { fontSize: 18 }),
      h.headerCell('▶ PPE for Step', cols[8], { fontSize: 18, fillColor: h.STEP_BLUE }),
    ] }),
    ...c.steps.map(step => new TableRow({ children: [
      h.dataCell(String(step.stepNumber), cols[0], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER }),
      h.dataCell(step.workInstruction, cols[1], { fontSize: 18, fillColor: h.STEP_BLUE_LIGHT }),
      h.dataCell(step.hazards, cols[2], { fontSize: 18 }),
      h.dataCell(step.whoAtRisk, cols[3], { fontSize: 18 }),
      h.dataCell(step.initialRisk, cols[4], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(step.initialRisk), color: h.WHITE }),
      h.dataCell(step.controlMeasures, cols[5], { fontSize: 18 }),
      h.dataCell(step.residualRisk, cols[6], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(step.residualRisk), color: h.WHITE }),
      h.dataCell(step.responsiblePerson, cols[7], { fontSize: 18 }),
      h.dataCell(step.ppeForStep, cols[8], { fontSize: 18, fillColor: h.STEP_BLUE_LIGHT }),
    ] })),
  ] });
}

function buildToolboxSummaryTable(c: Template10Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [600, Math.round(tw * 0.25), Math.round(tw * 0.3), 0]; cols[3] = tw - cols.slice(0, 3).reduce((a, b) => a + b, 0);
  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Step', cols[0], { fillColor: h.STEP_BLUE, fontSize: 12, alignment: AlignmentType.CENTER }), h.headerCell('What We Are Doing', cols[1], { fillColor: h.STEP_BLUE, fontSize: 12 }), h.headerCell('Key Hazard', cols[2], { fillColor: h.STEP_BLUE, fontSize: 12 }), h.headerCell('Critical Control / Watch Point', cols[3], { fillColor: h.STEP_BLUE, fontSize: 12 })] }),
    ...c.toolboxTalkSummary.map(t => new TableRow({ children: [h.dataCell(String(t.step), cols[0], { fontSize: 12, bold: true, alignment: AlignmentType.CENTER }), h.dataCell(t.whatWeAreDoing, cols[1], { fontSize: 12 }), h.dataCell(t.keyHazard, cols[2], { fontSize: 12, bold: true }), h.dataCell(t.criticalControl, cols[3], { fontSize: 12 })] })),
  ] });
}

function buildPermitLogTable(c: Template10Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [600, 2500, 2500, 0]; cols[3] = tw - cols.slice(0, 3).reduce((a, b) => a + b, 0);
  return new Table({ borders: h.NO_TABLE_BORDERS, width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Step', cols[0], { fillColor: h.STEP_BLUE, fontSize: 14, alignment: AlignmentType.CENTER }), h.headerCell('Permit Type', cols[1], { fillColor: h.STEP_BLUE, fontSize: 14 }), h.headerCell('Issued By', cols[2], { fillColor: h.STEP_BLUE, fontSize: 14 }), h.headerCell('Validity Period', cols[3], { fillColor: h.STEP_BLUE, fontSize: 14 })] }),
    ...c.permitIsolationLog.map(p => new TableRow({ children: [h.dataCell(String(p.step), cols[0], { fontSize: 14, bold: true, alignment: AlignmentType.CENTER }), h.dataCell(p.permitType, cols[1], { fontSize: 14 }), h.dataCell(p.issuedBy, cols[2], { fontSize: 14 }), h.dataCell(p.validityPeriod, cols[3], { fontSize: 14 })] })),
  ] });
}
