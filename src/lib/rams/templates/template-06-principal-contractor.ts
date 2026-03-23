// =============================================================================
// Template 06 — Principal Contractor (PC governance, sub oversight)
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template06Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate06(content: Template06Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page + PC Governance
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: '■ PRINCIPAL CONTRACTOR FORMAT', bold: true, size: 24, font: 'Arial', color: h.PC_NAVY })] }),

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
          h.sectionHeading('Task Description'),
          ...h.richBodyText(content.taskDescription),
          h.spacer(150),

          // PC Organisation
          h.sectionHeading('■ PC Organisation', 24, h.PC_NAVY),
          buildPCOrgTable(content),
          h.spacer(150),

          // Subcontractor Details
          h.sectionHeading('■ Subcontractor Details', 24, h.PC_NAVY),
          h.infoTable([
            { label: 'Company Name', value: content.subcontractorDetails.name },
            { label: 'Address', value: content.subcontractorDetails.address },
            { label: 'Supervisor', value: content.subcontractorDetails.supervisor },
            { label: 'Contact', value: content.subcontractorDetails.contact },
            { label: 'Scope of Works', value: content.subcontractorDetails.scopeOfWorks },
            { label: 'No. of Operatives', value: content.subcontractorDetails.numberOfOperatives },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(150),

          // Competency Verification
          h.sectionHeading('■ Contractor Competency Verification', 24, h.PC_NAVY),
          buildCompetencyTable(content),
          h.spacer(150),

          // Insurance & Accreditation
          h.sectionHeading('■ Insurance & Accreditation Register', 24, h.PC_NAVY),
          buildInsuranceTable(content),
          h.spacer(150),

          // 4-Stage Approval
          h.sectionHeading('■ Approval & Acceptance', 24, h.PC_NAVY),
          buildApprovalChainTable(content),
          h.spacer(150),

          // PC Amendments
          h.sectionHeading('■ PC Amendments & Conditions', 24, h.PC_NAVY),
          buildAmendmentsTable(content),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (with PC Comment column)
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
          h.subHeading('1. Sequence of Works'), ...h.richBodyText(content.sequenceOfWorks),
          h.subHeading('2. PPE Requirements'), ...h.richBodyText(content.ppeRequirements),
          h.subHeading('3. Competency & Training'), ...h.richBodyText(content.competencyRequirements),
          h.subHeading('4. Temporary Works'), ...h.richBodyText(content.temporaryWorks),
          h.subHeading('5. Environmental Considerations'), ...h.richBodyText(content.environmentalConsiderations),
          h.subHeading('6. Waste Management'), ...h.richBodyText(content.wasteManagement),
          h.subHeading('7. Emergency Procedures'), ...h.richBodyText(content.emergencyProcedures),
          h.subHeading('8. Welfare Facilities'), ...h.richBodyText(content.welfareFacilities),
          h.subHeading('9. Communication Arrangements'), ...h.richBodyText(content.communicationArrangements),
          // PC-specific sections
          h.subHeading('10. ■ PC Site Rules Compliance', 20, h.PC_NAVY),
          ...h.richBodyText(content.pcSiteRulesCompliance),
          h.subHeading('11. ■ Monitoring & Inspection Regime', 20, h.PC_NAVY),
          buildMonitoringTable(content),
          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed. PC representative to witness.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH, [
            { header: 'CSCS No.', width: 1200 },
            { header: '■ PC Witness', width: 1200 },
          ]),
        ],
      },
    ],
  });
}

function buildPCOrgTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [1800, 1800, 1500, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('PC Role', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Name', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Contact', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Responsibility', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.pcOrganisation.map(p => new TableRow({ children: [h.dataCell(p.role, cols[0], { fontSize: 14, bold: true }), h.dataCell(p.name, cols[1], { fontSize: 14 }), h.dataCell(p.contact, cols[2], { fontSize: 14 }), h.dataCell(p.responsibility, cols[3], { fontSize: 14 })] })),
  ] });
}

function buildCompetencyTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 2500, 2000, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Competency Item', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Reference/Expiry', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Verified By', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Status', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.competencyVerification.map(cv => new TableRow({ children: [h.dataCell(cv.item, cols[0], { fontSize: 14 }), h.dataCell(cv.reference, cols[1], { fontSize: 14 }), h.dataCell(cv.verifiedBy, cols[2], { fontSize: 14 }), h.dataCell(cv.status, cols[3], { fontSize: 14 })] })),
  ] });
}

function buildInsuranceTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 2000, 1500, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Type', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Policy No.', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Expiry', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Cover Level', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.insuranceAccreditation.map(ia => new TableRow({ children: [h.dataCell(ia.type, cols[0], { fontSize: 14 }), h.dataCell(ia.policyNo, cols[1], { fontSize: 14 }), h.dataCell(ia.expiry, cols[2], { fontSize: 14 }), h.dataCell(ia.coverLevel, cols[3], { fontSize: 14 })] })),
  ] });
}

function buildApprovalChainTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 2000, 1500, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Stage', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Name', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Date', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Accepted?', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.approvalChain.map(a => new TableRow({ children: [h.dataCell(a.stage, cols[0], { fontSize: 14, bold: true }), h.dataCell(a.name, cols[1], { fontSize: 14 }), h.dataCell(a.date, cols[2], { fontSize: 14 }), h.dataCell(a.accepted, cols[3], { fontSize: 14 })] })),
  ] });
}

function buildAmendmentsTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [3500, 1500, 1200, 0]; cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Amendment/Condition', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Raised By', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Date', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Status', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.pcAmendments.map(am => new TableRow({ children: [h.dataCell(am.amendment, cols[0], { fontSize: 14 }), h.dataCell(am.raisedBy, cols[1], { fontSize: 14 }), h.dataCell(am.date, cols[2], { fontSize: 14 }), h.dataCell(am.status, cols[3], { fontSize: 14 })] })),
  ] });
}

function buildMonitoringTable(c: Template06Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 1200, 1500, 1800, 0]; cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [h.headerCell('Check', cols[0], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Frequency', cols[1], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Carried Out By', cols[2], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Record Location', cols[3], { fillColor: h.PC_NAVY, fontSize: 14 }), h.headerCell('Escalation', cols[4], { fillColor: h.PC_NAVY, fontSize: 14 })] }),
    ...c.monitoringInspectionRegime.map(m => new TableRow({ children: [h.dataCell(m.check, cols[0], { fontSize: 14 }), h.dataCell(m.frequency, cols[1], { fontSize: 14 }), h.dataCell(m.carriedOutBy, cols[2], { fontSize: 14 }), h.dataCell(m.recordLocation, cols[3], { fontSize: 14 }), h.dataCell(m.escalation, cols[4], { fontSize: 14 })] })),
  ] });
}

function buildHazardTable(c: Template06Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [400, Math.round(tw * 0.13), Math.round(tw * 0.06), 450, 450, 500, Math.round(tw * 0.2), 450, 450, 500, Math.round(tw * 0.08), Math.round(tw * 0.06), 0];
  cols[12] = tw - cols.slice(0, 12).reduce((a, b) => a + b, 0);

  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: cols, rows: [
    new TableRow({ children: [
      h.headerCell('Ref', cols[0], { fontSize: 9 }), h.headerCell('Hazard', cols[1], { fontSize: 9 }), h.headerCell('Who', cols[2], { fontSize: 9 }),
      h.headerCell('L', cols[3], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('S', cols[4], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('Risk', cols[5], { fontSize: 9, alignment: AlignmentType.CENTER }),
      h.headerCell('Controls', cols[6], { fontSize: 9 }),
      h.headerCell('rL', cols[7], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('rS', cols[8], { fontSize: 9, alignment: AlignmentType.CENTER }), h.headerCell('rRisk', cols[9], { fontSize: 9, alignment: AlignmentType.CENTER }),
      h.headerCell('Add. Controls', cols[10], { fontSize: 9 }),
      h.headerCell('Action By', cols[11], { fontSize: 9 }),
      h.headerCell('■ PC Comment', cols[12], { fontSize: 9, fillColor: h.PC_NAVY }),
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
        h.dataCell('', cols[11], { fontSize: 9 }),
        h.dataCell(hz.pcComment, cols[12], { fontSize: 9, fillColor: h.PC_NAVY_LIGHT }),
      ] });
    }),
  ] });
}
