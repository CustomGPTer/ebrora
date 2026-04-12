// =============================================================================
// Template 05 — Narrative Flow (prose-based report style)
// =============================================================================
import { Document, Table, TableRow, Paragraph, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import { Template05Content } from '../types';
import * as h from '../docx-helpers';

/** Heading with bottom rule (unique to Narrative template) */
function narrativeHeading(text: string, fontSize = 24): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: h.EBRORA_GREEN, space: 4 } },
    children: [new TextRun({ text, bold: true, size: fontSize, font: 'Arial', color: h.EBRORA_GREEN })],
  });
}

function narrativeSubHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 20, font: 'Arial', color: h.BLACK })],
  });
}

function narrativeBody(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    children: [new TextRun({ text, size: 18, font: 'Arial' })],
  });
}

function italicPreamble(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    children: [new TextRun({ text, size: 16, font: 'Arial', italics: true, color: h.GREY_DARK })],
  });
}

export async function buildTemplate05(content: Template05Content): Promise<Document> {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // SECTION 1 — Portrait Front Page (narrative style)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: h.EBRORA_GREEN, space: 8 } },
            children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN })],
          }),

          narrativeHeading('Introduction'),
          italicPreamble('This document sets out the risk assessment and method statement for the works described below. It should be read in conjunction with the project health and safety plan and relevant site rules.'),
          ...h.richBodyText(content.introduction),
          h.spacer(100),

          narrativeHeading('Description of Works'),
          narrativeSubHeading('Overview'),
          ...h.richBodyText(content.worksOverview),
          narrativeSubHeading('Location & Site Conditions'),
          ...h.richBodyText(content.locationSiteConditions),
          narrativeSubHeading('Duration & Working Hours'),
          ...h.richBodyText(content.durationWorkingHours),
          narrativeSubHeading('Workforce & Supervision'),
          ...h.richBodyText(content.workforceSupervision),
          h.spacer(100),

          narrativeHeading('Competency & Training'),
          ...h.richBodyText(content.competencyTrainingNarrative),
          h.spacer(100),

          narrativeHeading('Permits & Consents'),
          ...h.richBodyText(content.permitsConsentsNarrative),
          h.spacer(100),

          // Document info
          narrativeHeading('Document Details'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date', value: content.dateOfAssessment },
            { label: 'Review Date', value: content.reviewDate },
          ], h.A4_CONTENT_WIDTH),
          h.spacer(100),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy },
            { role: 'Approved By', name: content.approvedBy || '' },
          ], h.A4_CONTENT_WIDTH),
        ],
      },

      // SECTION 2 — Landscape Risk Assessment (H/M/L with Review Notes)
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          narrativeHeading('Risk Assessment', 28),
          italicPreamble('The following risk assessment identifies the significant hazards associated with the works, the persons at risk, the initial risk rating, the control measures to be applied, and the residual risk rating after controls are in place.'),
          h.spacer(100),
          h.hmlRiskKey(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),
          buildNarrativeHazardTable(content),
        ],
      },

      // SECTION 3 — Portrait Method Statement (narrative sections)
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          narrativeHeading('Method Statement', 28),
          italicPreamble('The following method statement describes the safe system of work to be followed. All personnel must be briefed on its contents before commencing any work activity.'),

          narrativeHeading('1. Sequence of Works'),
          ...h.richBodyText(content.sequenceOfWorks),

          narrativeHeading('2. Site Preparation'),
          narrativeSubHeading('Access Arrangements'),
          ...h.richBodyText(content.sitePreparationAccess),
          narrativeSubHeading('Site Set-Up'),
          ...h.richBodyText(content.siteSetUp),
          narrativeSubHeading('Exclusion Zones'),
          ...h.richBodyText(content.exclusionZones),

          narrativeHeading('3. Personal Protective Equipment'),
          ...h.richBodyText(content.ppeRequirements),

          narrativeHeading('4. Environmental Management'),
          narrativeSubHeading('Considerations'),
          ...h.richBodyText(content.environmentalNarrative),
          narrativeSubHeading('Waste Management'),
          ...h.richBodyText(content.wasteNarrative),
          narrativeSubHeading('Pollution Prevention'),
          ...h.richBodyText(content.pollutionPrevention),

          narrativeHeading('5. Emergency Response'),
          narrativeSubHeading('Procedures'),
          ...h.richBodyText(content.emergencyNarrative),
          narrativeSubHeading('First Aid'),
          ...h.richBodyText(content.firstAid),
          narrativeSubHeading('Welfare'),
          ...h.richBodyText(content.welfareNarrative),

          narrativeHeading('6. Key Contacts'),
          buildKeyContactsTable(content),
          h.spacer(100),

          narrativeHeading('7. Additional Notes'),
          ...h.richBodyText(content.additionalNotes || 'No additional notes.'),

          h.spacer(300),
          narrativeHeading('Toolbox Talk / Briefing Record'),
          italicPreamble('All personnel must sign below to confirm they have been briefed on and understood this RAMS.'),
          h.spacer(100),
          h.briefingRecordTable(15, h.A4_CONTENT_WIDTH),
        ],
      },
    ],
  });
}

function buildNarrativeHazardTable(c: Template05Content): Table {
  const tw = h.A4_LANDSCAPE_CONTENT_WIDTH;
  const cols = [450, Math.round(tw * 0.16), Math.round(tw * 0.08), Math.round(tw * 0.07), Math.round(tw * 0.28), Math.round(tw * 0.07), Math.round(tw * 0.1), 0];
  cols[7] = tw - cols.slice(0, 7).reduce((a, b) => a + b, 0);

  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({
        children: [
          h.headerCell('Ref', cols[0], { fontSize: 18 }),
          h.headerCell('Hazard & Description', cols[1], { fontSize: 18 }),
          h.headerCell('Who at Risk', cols[2], { fontSize: 18 }),
          h.headerCell('Initial Risk', cols[3], { fontSize: 18, alignment: AlignmentType.CENTER }),
          h.headerCell('Control Measures & Arrangements', cols[4], { fontSize: 18 }),
          h.headerCell('Residual Risk', cols[5], { fontSize: 18, alignment: AlignmentType.CENTER }),
          h.headerCell('Action By', cols[6], { fontSize: 18 }),
          h.headerCell('Review / Notes', cols[7], { fontSize: 18 }),
        ],
      }),
      ...c.hazards.map((hz, idx) => new TableRow({
        children: [
          h.dataCell(hz.ref || String(idx + 1), cols[0], { fontSize: 18, alignment: AlignmentType.CENTER }),
          h.dataCell(hz.hazard, cols[1], { fontSize: 18 }),
          h.dataCell(hz.whoAtRisk, cols[2], { fontSize: 18 }),
          h.dataCell(hz.initialRisk, cols[3], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.initialRisk), color: h.WHITE }),
          h.dataCell(hz.controlMeasures, cols[4], { fontSize: 18 }),
          h.dataCell(hz.residualRisk, cols[5], { fontSize: 18, bold: true, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.residualRisk), color: h.WHITE }),
          h.dataCell(hz.responsiblePerson, cols[6], { fontSize: 18 }),
          h.dataCell(hz.reviewNotes, cols[7], { fontSize: 18 }),
        ],
      })),
    ],
  });
}

function buildKeyContactsTable(c: Template05Content): Table {
  const tw = h.A4_CONTENT_WIDTH;
  const cols = [2500, 3500, 0]; cols[2] = tw - cols[0] - cols[1];
  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ children: [h.headerCell('Role', cols[0], { fontSize: 14 }), h.headerCell('Name', cols[1], { fontSize: 14 }), h.headerCell('Phone', cols[2], { fontSize: 14 })] }),
      ...c.keyContacts.map(k => new TableRow({ children: [h.dataCell(k.role, cols[0], { fontSize: 14, bold: true }), h.dataCell(k.name, cols[1], { fontSize: 14 }), h.dataCell(k.phone, cols[2], { fontSize: 14 })] })),
    ],
  });
}
