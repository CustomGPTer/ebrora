// =============================================================================
// Template 03 — Tier 1 Formal (10 pages)
// Revision history, roles matrix, COSHH, lifting, permits, close-out
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType } from 'docx';
import { Template03Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate03(content: Template03Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page + Supporting Tables
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: 'TIER 1 FORMAL', bold: true, size: 28, font: 'Arial', color: h.GREY_DARK })],
          }),

          // Project info
          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Contract Number', value: content.contractNumber },
            { label: 'Framework', value: content.framework },
            { label: 'Work Package', value: content.workPackage },
            { label: 'Classification', value: content.classification },
            { label: 'Night Works', value: content.nightWorks },
          ], h.A4_CONTENT_WIDTH),

          h.spacer(150),

          // Document details
          h.sectionHeading('Document Details'),
          h.infoTable([
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date of Assessment', value: content.dateOfAssessment },
            { label: 'Review Date', value: content.reviewDate },
          ], h.A4_CONTENT_WIDTH),

          h.spacer(150),

          // Revision history
          h.sectionHeading('Revision History'),
          buildRevisionHistoryTable(content),

          h.spacer(150),

          // Related documents
          h.sectionHeading('Related Documents'),
          buildRelatedDocsTable(content),

          h.spacer(150),

          // 4-tier approval
          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Author', name: content.preparedBy },
            { role: 'Checker', name: content.checkedBy || '' },
            { role: 'Site Manager', name: content.reviewedBy || '' },
            { role: 'H&S Advisor', name: content.hseAdvisor || '' },
          ], h.A4_CONTENT_WIDTH),

          h.spacer(150),

          // Task description
          h.sectionHeading('Task Description'),
          ...h.richBodyText(content.taskDescription),

          h.spacer(200),

          // Roles & Responsibilities
          h.sectionHeading('Roles & Responsibilities'),
          buildRolesTable(content),

          h.spacer(150),

          // Workforce & Competency
          h.sectionHeading('Workforce & Competency'),
          buildWorkforceTable(content),

          h.spacer(150),

          // Permit Requirements
          h.sectionHeading('Permit Requirements'),
          buildPermitTable(content),

          h.spacer(150),

          // COSHH Summary
          h.sectionHeading('COSHH Summary'),
          buildCoshhTable(content),

          h.spacer(150),

          // Lifting Operations
          h.sectionHeading('Lifting Operations'),
          buildLiftingTable(content),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment
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

      // SECTION 3 — Portrait Method Statement (15 sections)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),
          h.subHeading('1. Sequence of Works'),
          ...h.richBodyText(content.sequenceOfWorks),
          h.subHeading('2. Personal Protective Equipment (PPE)'),
          ...h.richBodyText(content.ppeRequirements),
          h.subHeading('3. Competency & Training Requirements'),
          ...h.richBodyText(content.competencyRequirements),
          h.subHeading('4. Temporary Works'),
          ...h.richBodyText(content.temporaryWorks),
          h.subHeading('5. Lifting Operations Method'),
          ...h.richBodyText(content.liftingMethod),
          h.subHeading('6. Traffic Management'),
          ...h.richBodyText(content.trafficManagement),
          h.subHeading('7. Environmental Considerations'),
          ...h.richBodyText(content.environmentalConsiderations),
          h.subHeading('8. Waste Management'),
          ...h.richBodyText(content.wasteManagement),
          h.subHeading('9. Noise & Vibration Controls'),
          ...h.richBodyText(content.noiseVibrationControls),
          h.subHeading('10. Emergency Procedures'),
          ...h.richBodyText(content.emergencyProcedures),
          h.subHeading('11. Welfare Facilities'),
          ...h.richBodyText(content.welfareFacilities),
          h.subHeading('12. Communication Arrangements'),
          ...h.richBodyText(content.communicationArrangements),
          h.subHeading('13. Monitoring & Review Arrangements'),
          ...h.richBodyText(content.monitoringArrangements),
          h.subHeading('14. Review & Close-Out'),
          ...h.richBodyText(content.reviewCloseOut),
          h.subHeading('15. Lessons Learned'),
          ...h.richBodyText(content.lessonsLearned),
          h.spacer(300),
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed on this RAMS before commencing work.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(20, h.A4_CONTENT_WIDTH, [{ header: 'Trade/Role', width: 1400 }]),
        ],
      },
    ],
  });
}

// --- Supporting table builders ---

function buildRevisionHistoryTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [800, 1200, Math.round(tw * 0.4), 0];
  cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Rev', cols[0], { fontSize: 14 }), h.headerCell('Date', cols[1], { fontSize: 14 }), h.headerCell('Description', cols[2], { fontSize: 14 }), h.headerCell('Author', cols[3], { fontSize: 14 })] }),
      ...c.revisionHistory.map(r => new TableRow({ children: [h.dataCell(r.rev, cols[0], { fontSize: 14 }), h.dataCell(r.date, cols[1], { fontSize: 14 }), h.dataCell(r.description, cols[2], { fontSize: 14 }), h.dataCell(r.author, cols[3], { fontSize: 14 })] })),
    ],
  });
}

function buildRelatedDocsTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [1500, Math.round(tw * 0.5), 0];
  cols[2] = tw - cols[0] - cols[1];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Ref', cols[0], { fontSize: 14 }), h.headerCell('Title', cols[1], { fontSize: 14 }), h.headerCell('Status', cols[2], { fontSize: 14 })] }),
      ...c.relatedDocuments.map(d => new TableRow({ children: [h.dataCell(d.ref, cols[0], { fontSize: 14 }), h.dataCell(d.title, cols[1], { fontSize: 14 }), h.dataCell(d.status, cols[2], { fontSize: 14 })] })),
    ],
  });
}

function buildRolesTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 2000, 0];
  cols[2] = tw - cols[0] - cols[1];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Role', cols[0], { fontSize: 14 }), h.headerCell('Name', cols[1], { fontSize: 14 }), h.headerCell('Responsibility', cols[2], { fontSize: 14 })] }),
      ...c.rolesAndResponsibilities.map(r => new TableRow({ children: [h.dataCell(r.role, cols[0], { fontSize: 14, bold: true }), h.dataCell(r.name, cols[1], { fontSize: 14 }), h.dataCell(r.responsibility, cols[2], { fontSize: 14 })] })),
    ],
  });
}

function buildWorkforceTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [1500, 1500, 3000, 0];
  cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Role', cols[0], { fontSize: 14 }), h.headerCell('Name', cols[1], { fontSize: 14 }), h.headerCell('Qualifications', cols[2], { fontSize: 14 }), h.headerCell('Induction Reqs', cols[3], { fontSize: 14 })] }),
      ...c.workforceCompetency.map(w => new TableRow({ children: [h.dataCell(w.role, cols[0], { fontSize: 14 }), h.dataCell(w.name, cols[1], { fontSize: 14 }), h.dataCell(w.qualifications, cols[2], { fontSize: 14 }), h.dataCell(w.inductionReqs, cols[3], { fontSize: 14 })] })),
    ],
  });
}

function buildPermitTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 2500, 0];
  cols[2] = tw - cols[0] - cols[1];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Permit Type', cols[0], { fontSize: 14 }), h.headerCell('Issuing Authority', cols[1], { fontSize: 14 }), h.headerCell('Conditions', cols[2], { fontSize: 14 })] }),
      ...c.permitRequirements.map(p => new TableRow({ children: [h.dataCell(p.type, cols[0], { fontSize: 14 }), h.dataCell(p.issuingAuthority, cols[1], { fontSize: 14 }), h.dataCell(p.conditions, cols[2], { fontSize: 14 })] })),
    ],
  });
}

function buildCoshhTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2000, 1800, 2800, 0];
  cols[3] = tw - cols[0] - cols[1] - cols[2];
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Substance', cols[0], { fontSize: 14 }), h.headerCell('Hazard Class', cols[1], { fontSize: 14 }), h.headerCell('Controls', cols[2], { fontSize: 14 }), h.headerCell('Storage', cols[3], { fontSize: 14 })] }),
      ...c.coshhSummary.map(cs => new TableRow({ children: [h.dataCell(cs.substance, cols[0], { fontSize: 14 }), h.dataCell(cs.hazardClass, cols[1], { fontSize: 14 }), h.dataCell(cs.controls, cols[2], { fontSize: 14 }), h.dataCell(cs.storage, cols[3], { fontSize: 14 })] })),
    ],
  });
}

function buildLiftingTable(c: Template03Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [1500, 1500, 2000, 1200, 0];
  cols[4] = tw - cols.slice(0, 4).reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Appointed Person', cols[0], { fontSize: 14 }), h.headerCell('Lift Plan Ref', cols[1], { fontSize: 14 }), h.headerCell('Equipment Type', cols[2], { fontSize: 14 }), h.headerCell('Max Load', cols[3], { fontSize: 14 }), h.headerCell('Exclusion Zone', cols[4], { fontSize: 14 })] }),
      ...c.liftingOperations.map(l => new TableRow({ children: [h.dataCell(l.appointedPerson, cols[0], { fontSize: 14 }), h.dataCell(l.liftPlanRef, cols[1], { fontSize: 14 }), h.dataCell(l.equipmentType, cols[2], { fontSize: 14 }), h.dataCell(l.maxLoad, cols[3], { fontSize: 14 }), h.dataCell(l.exclusionZone, cols[4], { fontSize: 14 })] })),
    ],
  });
}

function buildHazardTable(c: Template03Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  // 14 columns: Ref, Activity, Hazard, Who, Consequence, L, S, Risk, Controls, Res L, Res S, Res R, Owner, Verified
  const cols = [400, Math.round(tw * 0.1), Math.round(tw * 0.1), Math.round(tw * 0.06), Math.round(tw * 0.08), 450, 450, 500, Math.round(tw * 0.2), 450, 450, 500, Math.round(tw * 0.07), 0];
  cols[13] = tw - cols.slice(0, 13).reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({
        children: [
          h.headerCell('Ref', cols[0], { fontSize: 10 }),
          h.headerCell('Activity', cols[1], { fontSize: 10 }),
          h.headerCell('Hazard', cols[2], { fontSize: 10 }),
          h.headerCell('Who', cols[3], { fontSize: 10 }),
          h.headerCell('Consequence', cols[4], { fontSize: 10 }),
          h.headerCell('L', cols[5], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('S', cols[6], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('Risk', cols[7], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('Control Measures', cols[8], { fontSize: 10 }),
          h.headerCell('Res L', cols[9], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('Res S', cols[10], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('Res R', cols[11], { fontSize: 10, alignment: AlignmentType.CENTER }),
          h.headerCell('Owner', cols[12], { fontSize: 10 }),
          h.headerCell('Verified', cols[13], { fontSize: 10 }),
        ],
      }),
      ...c.hazards.map((hz, idx) => {
        const initScore = hz.likelihoodInitial * hz.severityInitial;
        const resScore = hz.likelihoodResidual * hz.severityResidual;
        return new TableRow({
          children: [
            h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 10, alignment: AlignmentType.CENTER }),
            h.dataCell(hz.activity || '', cols[1], { fontSize: 10 }),
            h.dataCell(hz.hazard, cols[2], { fontSize: 10 }),
            h.dataCell(hz.whoAtRisk, cols[3], { fontSize: 10 }),
            h.dataCell(hz.consequence || '', cols[4], { fontSize: 10 }),
            h.dataCell(String(hz.likelihoodInitial), cols[5], { fontSize: 10, alignment: AlignmentType.CENTER }),
            h.dataCell(String(hz.severityInitial), cols[6], { fontSize: 10, alignment: AlignmentType.CENTER }),
            h.dataCell(String(initScore), cols[7], { fontSize: 10, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(initScore), color: initScore >= 8 ? h.WHITE : h.BLACK }),
            h.dataCell(hz.controlMeasures, cols[8], { fontSize: 10 }),
            h.dataCell(String(hz.likelihoodResidual), cols[9], { fontSize: 10, alignment: AlignmentType.CENTER }),
            h.dataCell(String(hz.severityResidual), cols[10], { fontSize: 10, alignment: AlignmentType.CENTER }),
            h.dataCell(String(resScore), cols[11], { fontSize: 10, bold: true, alignment: AlignmentType.CENTER, fillColor: h.lxsColor(resScore), color: resScore >= 8 ? h.WHITE : h.BLACK }),
            h.dataCell(hz.owner || '', cols[12], { fontSize: 10 }),
            h.dataCell(hz.verified || 'Pending', cols[13], { fontSize: 10 }),
          ],
        });
      }),
    ],
  });
}
