// =============================================================================
// Template 04 — CDM 2015 Compliant
// Blue CDM sections, duty holders, pre-construction info, designer risks
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template04Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate04(content: Template04Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page + CDM Sections
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: '■ CDM 2015 COMPLIANT', bold: true, size: 24, font: 'Arial', color: h.CDM_BLUE })],
          }),

          // Project info
          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Work Location', value: content.workLocation },
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date', value: content.dateOfAssessment },
            { label: 'Review Date', value: content.reviewDate },
            { label: 'Working Hours', value: content.workingHours },
            { label: 'Workforce', value: content.workforceSize },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(150),

          h.sectionHeading('Task Description'),
          h.bodyText(content.taskDescription),
          h.spacer(150),

          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(200),

          // CDM Duty Holders (blue header)
          h.sectionHeading('■ CDM 2015 Duty Holders', 24, h.CDM_BLUE),
          buildDutyHoldersTable(content),
          h.spacer(150),

          // Pre-Construction Information
          h.sectionHeading('■ Pre-Construction Information', 24, h.CDM_BLUE),
          buildPreConTable(content),
          h.spacer(150),

          // CDM Risk Category Flags
          h.sectionHeading('■ CDM Risk Category Flags', 24, h.CDM_BLUE),
          buildRiskFlagsTable(content),
          h.spacer(150),

          // Designer Residual Risk Schedule
          h.sectionHeading('■ Designer Residual Risk Schedule', 24, h.CDM_BLUE),
          buildDesignerRiskTable(content),
          h.spacer(150),

          // CPP References
          h.sectionHeading('■ Construction Phase Plan References', 24, h.CDM_BLUE),
          buildCPPTable(content),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (with CDM columns)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 28),
          h.riskMatrix5x5(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),
          buildHazardTable(content),
        ],
      },

      // SECTION 3 — Portrait Method Statement (14 sections)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),
          h.subHeading('1. Sequence of Works'), h.bodyText(content.sequenceOfWorks),
          h.subHeading('2. Personal Protective Equipment'), h.bodyText(content.ppeRequirements),
          h.subHeading('3. Competency & Training'), h.bodyText(content.competencyRequirements),
          h.subHeading('4. Temporary Works'), h.bodyText(content.temporaryWorks),
          h.subHeading('5. Environmental Considerations'), h.bodyText(content.environmentalConsiderations),
          h.subHeading('6. Waste Management'), h.bodyText(content.wasteManagement),
          h.subHeading('7. Emergency Procedures'), h.bodyText(content.emergencyProcedures),
          h.subHeading('8. Welfare Facilities'), h.bodyText(content.welfareFacilities),
          h.subHeading('9. Communication Arrangements'), h.bodyText(content.communicationArrangements),
          h.subHeading('10. Monitoring & Review'), h.bodyText(content.monitoringArrangements),
          // CDM-specific sections
          h.subHeading('11. ■ Residual Risk Management', 20, h.CDM_BLUE), h.bodyText(content.residualRiskManagement),
          h.subHeading('12. ■ H&S File Contributions', 20, h.CDM_BLUE), h.bodyText(content.hsfContributions),
          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed on this RAMS before commencing work.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH, [{ header: 'CSCS Card No.', width: 1600 }]),
        ],
      },
    ],
  });
}

function buildDutyHoldersTable(c: Template04Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 3500, 0]; cols[2] = tw - cols[0] - cols[1];
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('CDM Role', cols[0], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Organisation', cols[1], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Contact', cols[2], { fillColor: h.CDM_BLUE, fontSize: 14 })] }),
      ...c.dutyHolders.map(d => new TableRow({ children: [h.dataCell(d.role, cols[0], { fontSize: 14, bold: true }), h.dataCell(d.organisation, cols[1], { fontSize: 14 }), h.dataCell(d.contact, cols[2], { fontSize: 14 })] })),
    ],
  });
}

function buildPreConTable(c: Template04Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [3000, 0]; cols[1] = tw - cols[0];
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Item', cols[0], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Details', cols[1], { fillColor: h.CDM_BLUE, fontSize: 14 })] }),
      ...c.preConstructionInfo.map(p => new TableRow({ children: [h.dataCell(p.item, cols[0], { fontSize: 14, bold: true, fillColor: h.CDM_BLUE_LIGHT }), h.dataCell(p.details, cols[1], { fontSize: 14 })] })),
    ],
  });
}

function buildRiskFlagsTable(c: Template04Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [3000, 1200, 0]; cols[2] = tw - cols[0] - cols[1];
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('CDM Risk Category', cols[0], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Applies?', cols[1], { fillColor: h.CDM_BLUE, fontSize: 14, alignment: AlignmentType.CENTER }), h.headerCell('Notes', cols[2], { fillColor: h.CDM_BLUE, fontSize: 14 })] }),
      ...c.cdmRiskFlags.map(f => new TableRow({ children: [h.dataCell(f.category, cols[0], { fontSize: 14 }), h.dataCell(f.applies, cols[1], { fontSize: 14, alignment: AlignmentType.CENTER, bold: true, fillColor: f.applies === 'Yes' ? h.CDM_BLUE_LIGHT : h.WHITE }), h.dataCell(f.notes, cols[2], { fontSize: 14 })] })),
    ],
  });
}

function buildDesignerRiskTable(c: Template04Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 2500, 2500, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Residual Design Risk', cols[0], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Designer Recommendation', cols[1], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Contractor Response', cols[2], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Status', cols[3], { fillColor: h.CDM_BLUE, fontSize: 14 })] }),
      ...c.designerResidualRisks.map(d => new TableRow({ children: [h.dataCell(d.risk, cols[0], { fontSize: 14 }), h.dataCell(d.recommendation, cols[1], { fontSize: 14 }), h.dataCell(d.contractorResponse, cols[2], { fontSize: 14 }), h.dataCell(d.status, cols[3], { fontSize: 14 })] })),
    ],
  });
}

function buildCPPTable(c: Template04Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [3500, 0]; cols[1] = tw - cols[0];
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Document', cols[0], { fillColor: h.CDM_BLUE, fontSize: 14 }), h.headerCell('Reference', cols[1], { fillColor: h.CDM_BLUE, fontSize: 14 })] }),
      ...c.cppReferences.map(cp => new TableRow({ children: [h.dataCell(cp.document, cols[0], { fontSize: 14 }), h.dataCell(cp.reference, cols[1], { fontSize: 14 })] })),
    ],
  });
}

function buildHazardTable(c: Template04Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.12), Math.round(tw * 0.06), 450, 450, 500, Math.round(tw * 0.19), 450, 450, 500, Math.round(tw * 0.08), Math.round(tw * 0.07), Math.round(tw * 0.06), 0];
  cols[13] = tw - cols.slice(0, 13).reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({
        children: [
          h.headerCell('Ref', cols[0], { fontSize: 9 }),
          h.headerCell('Hazard', cols[1], { fontSize: 9 }),
          h.headerCell('Who', cols[2], { fontSize: 9 }),
          h.headerCell('L', cols[3], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('S', cols[4], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('Risk', cols[5], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('Controls', cols[6], { fontSize: 9 }),
          h.headerCell('rL', cols[7], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('rS', cols[8], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('rRisk', cols[9], { fontSize: 9, alignment: AlignmentType.CENTER }),
          h.headerCell('Add. Controls', cols[10], { fontSize: 9 }),
          h.headerCell('■ CDM Cat', cols[11], { fontSize: 9, fillColor: h.CDM_BLUE }),
          h.headerCell('■ CDM Ref', cols[12], { fontSize: 9, fillColor: h.CDM_BLUE }),
          h.headerCell('■ Notes', cols[13], { fontSize: 9, fillColor: h.CDM_BLUE }),
        ],
      }),
      ...c.hazards.map((hz, idx) => {
        const initScore = hz.likelihoodInitial * hz.severityInitial;
        const resScore = hz.likelihoodResidual * hz.severityResidual;
        return new TableRow({
          children: [
            h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 9, alignment: AlignmentType.CENTER }),
            h.dataCell(hz.hazard, cols[1], { fontSize: 9 }),
            h.dataCell(hz.whoAtRisk, cols[2], { fontSize: 9 }),
            h.dataCell(String(hz.likelihoodInitial), cols[3], { fontSize: 9, alignment: AlignmentType.CENTER }),
            h.dataCell(String(hz.severityInitial), cols[4], { fontSize: 9, alignment: AlignmentType.CENTER }),
            h.dataCell(String(initScore), cols[5], { fontSize: 9, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(initScore), color: initScore >= 8 ? h.WHITE : h.BLACK }),
            h.dataCell(hz.controlMeasures, cols[6], { fontSize: 9 }),
            h.dataCell(String(hz.likelihoodResidual), cols[7], { fontSize: 9, alignment: AlignmentType.CENTER }),
            h.dataCell(String(hz.severityResidual), cols[8], { fontSize: 9, alignment: AlignmentType.CENTER }),
            h.dataCell(String(resScore), cols[9], { fontSize: 9, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(resScore), color: resScore >= 8 ? h.WHITE : h.BLACK }),
            h.dataCell(hz.additionalControls || '', cols[10], { fontSize: 9 }),
            h.dataCell(hz.cdmCategory, cols[11], { fontSize: 9, fillColor: h.CDM_BLUE_LIGHT }),
            h.dataCell(hz.cdmRef, cols[12], { fontSize: 9, fillColor: h.CDM_BLUE_LIGHT }),
            h.dataCell('', cols[13], { fontSize: 9, fillColor: h.CDM_BLUE_LIGHT }),
          ],
        });
      }),
    ],
  });
}
