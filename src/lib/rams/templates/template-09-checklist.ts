// =============================================================================
// Template 09 — Structured Checklist (operational document with embedded checks)
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template09Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate09(content: Template09Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page + Pre-Start Checklist
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: '☑ INTEGRATED CHECKLISTS FORMAT', bold: true, size: 24, font: 'Arial', color: h.CHECKLIST_TEAL })] }),

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
          h.sectionHeading('Task Description'), h.bodyText(content.taskDescription),
          h.spacer(100),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(200),

          // Pre-Start Verification Checklist (unique)
          h.sectionHeading('☑ Pre-Start Verification Checklist', 24, h.CHECKLIST_TEAL),
          h.bodyText('Complete before commencing work each day. All items must be confirmed.', 16, { italic: true }),
          buildPreStartTable(content),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (with Check Required column)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 28),
          h.riskMatrix5x5(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),
          buildChecklistHazardTable(content),
        ],
      },

      // SECTION 3 — Portrait Method Statement (with hold points & checklists)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),
          h.subHeading('1. Sequence of Works'), h.bodyText(content.sequenceOfWorks),
          h.subHeading('2. PPE Requirements'), h.bodyText(content.ppeRequirements),

          // Hold Points (unique — between sequence and other sections)
          h.subHeading('3. ☑ Hold Points & Inspection Schedule', 20, h.CHECKLIST_TEAL),
          h.bodyText('Work must physically stop at each hold point until inspection is completed and accepted.', 16, { italic: true }),
          buildHoldPointsTable(content),
          h.spacer(100),

          h.subHeading('4. Competency & Training'), h.bodyText(content.competencyRequirements),
          h.subHeading('5. Temporary Works'), h.bodyText(content.temporaryWorks),
          h.subHeading('6. Environmental Considerations'), h.bodyText(content.environmentalConsiderations),
          h.subHeading('7. Waste Management'), h.bodyText(content.wasteManagement),
          h.subHeading('8. Emergency Procedures'), h.bodyText(content.emergencyProcedures),
          h.subHeading('9. Welfare Facilities'), h.bodyText(content.welfareFacilities),
          h.subHeading('10. Communication Arrangements'), h.bodyText(content.communicationArrangements),

          // Task-Specific Safety Checklist (unique)
          h.subHeading('11. ☑ Task-Specific Safety Checklist', 20, h.CHECKLIST_TEAL),
          h.bodyText('Supervisor to complete before each shift.', 16, { italic: true }),
          buildTaskChecklistTable(content),
          h.spacer(100),

          // End-of-Shift Close-Down Checklist (unique)
          h.subHeading('12. ☑ End-of-Shift Close-Down Checklist', 20, h.CHECKLIST_TEAL),
          h.bodyText('Complete at the end of every shift before leaving site.', 16, { italic: true }),
          buildCloseDownTable(content),

          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

function buildPreStartTable(c: Template09Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.5), 800, 800, 1500, 0]; cols[5] = tw - cols.slice(0, 5).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('No.', cols[0], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Pre-Start Check Item', cols[1], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Y', cols[2], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('N', cols[3], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('Checked By', cols[4], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Date', cols[5], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 })] }),
    ...c.preStartChecklist.map((item, idx) => new TableRow({ children: [h.dataCell(String(idx + 1), cols[0], { fontSize: 13, alignment: AlignmentType.CENTER }), h.dataCell(item.item, cols[1], { fontSize: 13 }), h.emptyCell(cols[2]), h.emptyCell(cols[3]), h.dataCell(item.checkedBy, cols[4], { fontSize: 13 }), h.emptyCell(cols[5])] })),
  ] });
}

function buildChecklistHazardTable(c: Template09Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.12), Math.round(tw * 0.05), 450, 450, 500, Math.round(tw * 0.18), 450, 450, 500, Math.round(tw * 0.07), Math.round(tw * 0.12), 0];
  cols[12] = tw - cols.slice(0, 12).reduce((a, b) => a + b, 0);

  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [
      h.headerCell('Ref', cols[0], { fontSize: 9 }), h.headerCell('Hazard', cols[1], { fontSize: 9 }), h.headerCell('Who', cols[2], { fontSize: 9 }),
      h.headerCell('L', cols[3], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('S', cols[4], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('Risk', cols[5], { fontSize: 9, alignment: AlignmentType.CENTER }),
      h.headerCell('Controls', cols[6], { fontSize: 9 }),
      h.headerCell('rL', cols[7], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('rS', cols[8], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('rRisk', cols[9], { fontSize: 9, alignment: AlignmentType.CENTER }),
      h.headerCell('Add. Controls', cols[10], { fontSize: 9 }),
      h.headerCell('☑ Check Required', cols[11], { fontSize: 9, fillColor: h.CHECKLIST_TEAL }),
      h.headerCell('☑ Verified', cols[12], { fontSize: 9, fillColor: h.CHECKLIST_TEAL }),
    ] }),
    ...c.hazards.map((hz, idx) => {
      const is = hz.likelihoodInitial * hz.severityInitial;
      const rs = hz.likelihoodResidual * hz.severityResidual;
      return new TableRow({ children: [
        h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 9, alignment: AlignmentType.CENTER }),
        h.dataCell(hz.hazard, cols[1], { fontSize: 9 }), h.dataCell(hz.whoAtRisk, cols[2], { fontSize: 9 }),
        h.dataCell(String(hz.likelihoodInitial), cols[3], { fontSize: 9, alignment: AlignmentType.CENTER }),
        h.dataCell(String(hz.severityInitial), cols[4], { fontSize: 9, alignment: AlignmentType.CENTER }),
        h.dataCell(String(is), cols[5], { fontSize: 9, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(is), color: is >= 8 ? h.WHITE : h.BLACK }),
        h.dataCell(hz.controlMeasures, cols[6], { fontSize: 9 }),
        h.dataCell(String(hz.likelihoodResidual), cols[7], { fontSize: 9, alignment: AlignmentType.CENTER }),
        h.dataCell(String(hz.severityResidual), cols[8], { fontSize: 9, alignment: AlignmentType.CENTER }),
        h.dataCell(String(rs), cols[9], { fontSize: 9, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(rs), color: rs >= 8 ? h.WHITE : h.BLACK }),
        h.dataCell(hz.additionalControls || '', cols[10], { fontSize: 9 }),
        h.dataCell(hz.checkRequired, cols[11], { fontSize: 9, fillColor: h.CHECKLIST_TEAL_LIGHT }),
        h.emptyCell(cols[12], { fillColor: h.CHECKLIST_TEAL_LIGHT }),
      ] });
    }),
  ] });
}

function buildHoldPointsTable(c: Template09Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 2500, 1500, 1000, 0]; cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Stage/Activity', cols[0], { fillColor: h.CHECKLIST_TEAL, fontSize: 14 }), h.headerCell('Inspection Required', cols[1], { fillColor: h.CHECKLIST_TEAL, fontSize: 14 }), h.headerCell('Inspected By', cols[2], { fillColor: h.CHECKLIST_TEAL, fontSize: 14 }), h.headerCell('Accepted?', cols[3], { fillColor: h.CHECKLIST_TEAL, fontSize: 14 }), h.headerCell('Date/Time', cols[4], { fillColor: h.CHECKLIST_TEAL, fontSize: 14 })] }),
    ...c.holdPoints.map(hp => new TableRow({ children: [h.dataCell(hp.stageActivity, cols[0], { fontSize: 14, bold: true }), h.dataCell(hp.inspectionRequired, cols[1], { fontSize: 14 }), h.dataCell(hp.inspectedBy, cols[2], { fontSize: 14 }), h.emptyCell(cols[3]), h.emptyCell(cols[4])] })),
  ] });
}

function buildTaskChecklistTable(c: Template09Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.55), 800, 800, 0]; cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('No.', cols[0], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Daily Safety Check', cols[1], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Y', cols[2], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('N', cols[3], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('Notes', cols[4], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 })] }),
    ...c.taskSafetyChecklist.map((item, idx) => new TableRow({ children: [h.dataCell(String(idx + 1), cols[0], { fontSize: 13, alignment: AlignmentType.CENTER }), h.dataCell(item.item, cols[1], { fontSize: 13 }), h.emptyCell(cols[2]), h.emptyCell(cols[3]), h.emptyCell(cols[4])] })),
  ] });
}

function buildCloseDownTable(c: Template09Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.55), 800, 800, 0]; cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('No.', cols[0], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Close-Down Check', cols[1], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 }), h.headerCell('Y', cols[2], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('N', cols[3], { fillColor: h.CHECKLIST_TEAL, fontSize: 13, alignment: AlignmentType.CENTER }), h.headerCell('Notes', cols[4], { fillColor: h.CHECKLIST_TEAL, fontSize: 13 })] }),
    ...c.closeDownChecklist.map((item, idx) => new TableRow({ children: [h.dataCell(String(idx + 1), cols[0], { fontSize: 13, alignment: AlignmentType.CENTER }), h.dataCell(item.item, cols[1], { fontSize: 13 }), h.emptyCell(cols[2]), h.emptyCell(cols[3]), h.emptyCell(cols[4])] })),
  ] });
}
