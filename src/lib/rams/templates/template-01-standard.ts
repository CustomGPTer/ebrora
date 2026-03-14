// =============================================================================
// Template 01 — Standard 5×5 Matrix
// 3 sections: Portrait front page → Landscape RA → Portrait Method Statement
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, PageBreak, WidthType } from 'docx';
import { Template01Content } from '../types';
import * as h from '../docx-helpers';

export async function buildTemplate01(content: Template01Content): Promise<Document> {
  return new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 18 } } },
    },
    sections: [
      // =====================================================================
      // SECTION 1 — Portrait Front Page
      // =====================================================================
      {
        properties: {
          ...h.PORTRAIT_SECTION,
        },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({ text: 'RISK ASSESSMENT &', bold: true, size: 40, font: 'Arial', color: h.EBRORA_GREEN }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'METHOD STATEMENT', bold: true, size: 40, font: 'Arial', color: h.EBRORA_GREEN }),
            ],
          }),

          // Project info table
          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Principal Contractor', value: content.principalContractor },
            { label: 'Subcontractor', value: content.subcontractor || content.contractorName },
            { label: 'Work Location', value: content.workLocation },
          ], h.A4_CONTENT_WIDTH),

          h.spacer(200),

          // Document info table
          h.sectionHeading('Document Details'),
          h.infoTable([
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date of Assessment', value: content.dateOfAssessment },
            { label: 'Review Date', value: content.reviewDate },
            { label: 'Working Hours', value: content.workingHours },
            { label: 'Workforce Size', value: content.workforceSize },
          ], h.A4_CONTENT_WIDTH),

          h.spacer(200),

          // Task description
          h.sectionHeading('Task Description'),
          h.bodyText(content.taskDescription),

          h.spacer(200),

          // Approval table
          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Reviewed By', name: content.reviewedBy || '' },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
        ],
      },

      // =====================================================================
      // SECTION 2 — Landscape Risk Assessment
      // =====================================================================
      {
        properties: {
          ...h.LANDSCAPE_SECTION,
        },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 28),

          // 5×5 Matrix
          h.riskMatrix5x5(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),

          // Hazard table
          buildHazardTable(content),
        ],
      },

      // =====================================================================
      // SECTION 3 — Portrait Method Statement
      // =====================================================================
      {
        properties: {
          ...h.PORTRAIT_SECTION,
        },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Method Statement', 28),

          // Section 1 — Sequence of Works
          h.subHeading('1. Sequence of Works'),
          h.bodyText(content.sequenceOfWorks),

          // Section 2 — PPE Requirements
          h.subHeading('2. Personal Protective Equipment (PPE)'),
          h.bodyText(content.ppeRequirements),

          // Section 3 — Competency Requirements
          h.subHeading('3. Competency & Training Requirements'),
          h.bodyText(content.competencyRequirements),

          // Section 4 — Temporary Works
          h.subHeading('4. Temporary Works'),
          h.bodyText(content.temporaryWorks),

          // Section 5 — Environmental Considerations
          h.subHeading('5. Environmental Considerations'),
          h.bodyText(content.environmentalConsiderations),

          // Section 6 — Waste Management
          h.subHeading('6. Waste Management & Housekeeping'),
          h.bodyText(content.wasteManagement),

          // Section 7 — Emergency Procedures
          h.subHeading('7. Emergency Procedures'),
          h.bodyText(content.emergencyProcedures),

          // Section 8 — Welfare Facilities
          h.subHeading('8. Welfare Facilities'),
          h.bodyText(content.welfareFacilities),

          // Section 9 — Communication Arrangements
          h.subHeading('9. Communication Arrangements'),
          h.bodyText(content.communicationArrangements),

          // Section 10 — Monitoring Arrangements
          h.subHeading('10. Monitoring & Review Arrangements'),
          h.bodyText(content.monitoringArrangements),

          h.spacer(300),

          // Briefing Record
          h.sectionHeading('Toolbox Talk / Briefing Record', 24),
          h.bodyText('All personnel must be briefed on this RAMS before commencing work. Sign below to confirm you have read, understood, and will comply with this document.', 16, { italic: true }),
          h.spacer(100),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Hazard table builder (12 columns for 5×5 template)
// ---------------------------------------------------------------------------
function buildHazardTable(content: Template01Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  // Column widths for 12 columns
  const cols = {
    ref: 500,
    hazard: Math.round(tw * 0.16),
    who: Math.round(tw * 0.08),
    li: 600,
    si: 600,
    rri: 600,
    controls: Math.round(tw * 0.22),
    lr: 600,
    sr: 600,
    rrr: 600,
    addControls: Math.round(tw * 0.12),
  };
  // Last column gets remaining
  const used = Object.values(cols).reduce((a, b) => a + b, 0);
  const colWidths = [...Object.values(cols), tw - used];

  const headerRow = new TableRow({
    children: [
      h.headerCell('Ref', colWidths[0], { fontSize: 12 }),
      h.headerCell('Hazard', colWidths[1], { fontSize: 12 }),
      h.headerCell('Who at Risk', colWidths[2], { fontSize: 12 }),
      h.headerCell('L', colWidths[3], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('S', colWidths[4], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('Risk', colWidths[5], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('Control Measures', colWidths[6], { fontSize: 12 }),
      h.headerCell('rL', colWidths[7], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('rS', colWidths[8], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('rRisk', colWidths[9], { fontSize: 12, alignment: AlignmentType.CENTER }),
      h.headerCell('Additional Controls', colWidths[10], { fontSize: 12 }),
    ],
  });

  const dataRows = content.hazards.map((hz, idx) => {
    const initScore = hz.likelihoodInitial * hz.severityInitial;
    const resScore = hz.likelihoodResidual * hz.severityResidual;
    return new TableRow({
      children: [
        h.dataCell(hz.ref || String(idx + 1), colWidths[0], { fontSize: 12, alignment: AlignmentType.CENTER }),
        h.dataCell(hz.hazard, colWidths[1], { fontSize: 12 }),
        h.dataCell(hz.whoAtRisk, colWidths[2], { fontSize: 12 }),
        h.dataCell(String(hz.likelihoodInitial), colWidths[3], { fontSize: 12, alignment: AlignmentType.CENTER }),
        h.dataCell(String(hz.severityInitial), colWidths[4], { fontSize: 12, alignment: AlignmentType.CENTER }),
        h.dataCell(String(initScore), colWidths[5], { fontSize: 12, alignment: AlignmentType.CENTER, bold: true, fillColor: h.lxsColor(initScore), color: initScore >= 8 ? h.WHITE : h.BLACK }),
        h.dataCell(hz.controlMeasures, colWidths[6], { fontSize: 12 }),
        h.dataCell(String(hz.likelihoodResidual), colWidths[7], { fontSize: 12, alignment: AlignmentType.CENTER }),
        h.dataCell(String(hz.severityResidual), colWidths[8], { fontSize: 12, alignment: AlignmentType.CENTER }),
        h.dataCell(String(resScore), colWidths[9], { fontSize: 12, alignment: AlignmentType.CENTER, bold: true, fillColor: h.lxsColor(resScore), color: resScore >= 8 ? h.WHITE : h.BLACK }),
        h.dataCell(hz.additionalControls || '', colWidths[10], { fontSize: 12 }),
      ],
    });
  });

  return new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}



