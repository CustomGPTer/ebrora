// =============================================================================
// Emergency Response Plan — Dedicated Template
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'B91C1C';
const ACCENT_LIGHT = 'FEE2E2';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
// prose() now imported from docx-helpers via h.prose()

export async function buildEmergencyResponseDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const es = content.emergencyServices || {};
  const fire = content.fireEmergency || {};
  const fa = content.firstAidArrangements || {};
  const spill = content.environmentalSpillResponse || {};
  const evac = content.evacuation || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'EMERGENCY RESPONSE PLAN', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Issue Date', value: content.issueDate || '' },
            { label: 'Review Date', value: content.reviewDate || '' },
            { label: 'Prepared By', value: content.preparedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
            { label: 'Grid Reference', value: content.gridReference || '' },
          ], W),
          h.spacer(160),

          section('Site Description'),
          ...h.prose(content.siteDescription),
          h.spacer(200),

          section('Emergency Services'),
          h.infoTable([
            { label: 'Nearest A&E', value: es.nearestAE || '' },
            { label: 'Ambulance', value: '999' },
            { label: 'Fire', value: '999' },
            { label: 'Police', value: '999' },
            { label: 'Environment Agency', value: es.environmentAgency || '0800 80 70 60' },
            { label: 'National Gas Emergency', value: es.nationalGasEmergency || '0800 111 999' },
            { label: 'Electricity Emergency', value: es.electricityEmergency || '105' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Key Site Contacts'),
          ...(Array.isArray(content.keyContacts) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.35), Math.round(W * 0.35), W - Math.round(W * 0.7)], rows: [
            new TableRow({ children: [
              h.headerCell('Role', Math.round(W * 0.35), { fontSize: 14 }),
              h.headerCell('Name', Math.round(W * 0.35), { fontSize: 14 }),
              h.headerCell('Phone', W - Math.round(W * 0.7), { fontSize: 14 }),
            ] }),
            ...content.keyContacts.map((c: any, i: number) => new TableRow({ children: [
              h.dataCell(c.role || '', Math.round(W * 0.35), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(c.name || '', Math.round(W * 0.35), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(c.phone || '', W - Math.round(W * 0.7), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Emergency Contact Cascade'),
          ...h.prose(content.contactCascade),
          h.spacer(200),

          section('Fire Emergency Procedure'),
          ...h.prose(fire.procedure),
          h.spacer(80),
          h.infoTable([
            { label: 'Fire Points', value: fire.firePoints || '' },
            { label: 'Extinguisher Locations', value: fire.extinguisherLocations || '' },
            { label: 'Assembly Point', value: fire.assemblyPoint || '' },
            { label: 'Hot Works Controls', value: fire.hotWorksControls || '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('First Aid Arrangements'),
          h.infoTable([
            { label: 'First Aiders', value: fa.firstAiders || '' },
            { label: 'First Aid Kit Locations', value: fa.firstAidKitLocations || '' },
            { label: 'Defibrillator Location', value: fa.defibLocation || '' },
          ], W),
          h.spacer(80),
          ...h.prose(fa.procedure),
          h.spacer(200),

          section('Environmental Spill Response'),
          h.infoTable([
            { label: 'Spill Kit Locations', value: spill.spillKitLocations || '' },
            { label: 'Watercourse Protection', value: spill.watercourseProtection || '' },
            { label: 'Reporting Requirements', value: spill.reportingRequirements || '' },
          ], W),
          h.spacer(80),
          ...h.prose(spill.procedure),
          h.spacer(200),

          section('Structural Collapse / Ground Failure'),
          ...h.prose(content.structuralCollapse),
          h.spacer(160),
          section('Confined Space Rescue'),
          ...h.prose(content.confinedSpaceRescue),
          h.spacer(160),
          section('Utilities Failure'),
          ...h.prose(content.utilitiesFailure),
          h.spacer(160),
          section('Severe Weather'),
          ...h.prose(content.severeWeather),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Evacuation Procedure'),
          ...h.prose(evac.procedure),
          h.spacer(80),
          h.infoTable([
            { label: 'Muster Points', value: evac.musterPoints || '' },
            { label: 'Head Count Procedure', value: evac.headCountProcedure || '' },
            { label: 'All Clear Procedure', value: evac.allClearProcedure || '' },
          ], W),
          h.spacer(200),

          section('Site-Specific Emergencies'),
          ...(Array.isArray(content.siteSpecificEmergencies) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.35), W - Math.round(W * 0.35)], rows: [
            new TableRow({ children: [
              h.headerCell('Scenario', Math.round(W * 0.35), { fontSize: 14 }),
              h.headerCell('Procedure', W - Math.round(W * 0.35), { fontSize: 14 }),
            ] }),
            ...content.siteSpecificEmergencies.map((e: any, i: number) => new TableRow({ children: [
              h.dataCell(e.scenario || '', Math.round(W * 0.35), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(e.procedure || '', W - Math.round(W * 0.35), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Training & Emergency Drills'),
          ...h.prose(content.trainingAndDrills),
          h.spacer(200),

          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),

          h.sectionHeading('Approval'),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy || '' },
            { role: 'Reviewed By', name: '' },
            { role: 'Approved By', name: '' },
          ], W),
          h.spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
        ],
      },
    ],
  });
}
