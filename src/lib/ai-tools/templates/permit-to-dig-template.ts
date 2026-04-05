// =============================================================================
// Permit to Dig — Dedicated Template (HSG47 compliant)
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = '92400E';
const ACCENT_LIGHT = 'FEF2F2';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
// prose() now imported from docx-helpers via h.prose()

export async function buildPermitToDigDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const exc = content.excavationDetails || {};
  const utils = content.utilitySearchRecords || {};
  const cat = content.catAndGenny || {};
  const sup = content.supervisionArrangements || {};
  const emerg = content.emergencyProcedures || {};
  const so = content.signOff || {};

  function searchRow(label: string, data: any) {
    return new TableRow({ children: [
      h.dataCell(label, Math.round(W * 0.3), { fontSize: 14, bold: true }),
      h.dataCell(data?.completed ? 'Yes' : 'No', Math.round(W * 0.12), { fontSize: 14, alignment: AlignmentType.CENTER, fillColor: data?.completed ? '27AE60' : 'E74C3C', color: h.WHITE, bold: true }),
      h.dataCell(data?.date || '', Math.round(W * 0.2), { fontSize: 14 }),
      h.dataCell(data?.reference || '', W - Math.round(W * 0.62), { fontSize: 14 }),
    ] });
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'PERMIT TO DIG', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'HSG47 — Avoiding Danger from Underground Services', size: 20, font: 'Arial', color: ACCENT }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          h.sectionHeading('Permit Details'),
          h.infoTable([
            { label: 'Permit Reference', value: content.documentRef || '' },
            { label: 'Permit Date', value: content.permitDate || '' },
            { label: 'Permit Expiry', value: content.permitExpiry || '' },
            { label: 'Issued By', value: content.issuedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
          ], W),
          h.spacer(160),

          section('Excavation Details'),
          h.infoTable([
            { label: 'Location', value: exc.location || '' },
            { label: 'Grid Reference', value: exc.gridReference || '' },
            { label: 'Purpose', value: exc.purpose || '' },
            { label: 'Method', value: exc.method || '' },
            { label: 'Depth', value: exc.depth || '' },
            { label: 'Length', value: exc.length || '' },
            { label: 'Width', value: exc.width || '' },
            { label: 'Plant to Be Used', value: exc.plantToBeUsed || '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Utility Search Records'),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.3), Math.round(W * 0.12), Math.round(W * 0.2), W - Math.round(W * 0.62)], rows: [
            new TableRow({ children: [
              h.headerCell('Search Type', Math.round(W * 0.3), { fontSize: 14 }),
              h.headerCell('Done', Math.round(W * 0.12), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.headerCell('Date', Math.round(W * 0.2), { fontSize: 14 }),
              h.headerCell('Reference', W - Math.round(W * 0.62), { fontSize: 14 }),
            ] }),
            searchRow('StatMap / Desktop Search', utils.statMapDesktopSearch),
            searchRow('Site Plan Review', utils.sitePlanReview),
            searchRow('GPR Survey', utils.gprSurvey),
            searchRow('Trial Holes', utils.trialHoles),
          ] }),
          h.spacer(200),

          section('Services Identified'),
          ...(Array.isArray(content.servicesIdentified) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.16), Math.round(W * 0.1), Math.round(W * 0.1), Math.round(W * 0.12), Math.round(W * 0.12), Math.round(W * 0.12), W - Math.round(W * 0.72)], rows: [
            new TableRow({ children: [
              h.headerCell('Service', Math.round(W * 0.16), { fontSize: 12 }),
              h.headerCell('Size', Math.round(W * 0.1), { fontSize: 12 }),
              h.headerCell('Depth', Math.round(W * 0.1), { fontSize: 12 }),
              h.headerCell('Material', Math.round(W * 0.12), { fontSize: 12 }),
              h.headerCell('Status', Math.round(W * 0.12), { fontSize: 12 }),
              h.headerCell('Distance', Math.round(W * 0.12), { fontSize: 12 }),
              h.headerCell('Owner', W - Math.round(W * 0.72), { fontSize: 12 }),
            ] }),
            ...content.servicesIdentified.map((s: any, i: number) => {
              const isLive = (s.status || '').toLowerCase() === 'live';
              const bg = isLive ? ACCENT_LIGHT : i % 2 === 0 ? h.GREY_LIGHT : h.WHITE;
              return new TableRow({ children: [
                h.dataCell(s.serviceType || '', Math.round(W * 0.16), { fontSize: 12, bold: true, fillColor: bg }),
                h.dataCell(s.size || '', Math.round(W * 0.1), { fontSize: 12, fillColor: bg }),
                h.dataCell(s.depth || '', Math.round(W * 0.1), { fontSize: 12, fillColor: bg }),
                h.dataCell(s.material || '', Math.round(W * 0.12), { fontSize: 12, fillColor: bg }),
                h.dataCell(s.status || '', Math.round(W * 0.12), { fontSize: 12, fillColor: isLive ? 'E74C3C' : bg, color: isLive ? h.WHITE : h.BLACK, bold: isLive }),
                h.dataCell(s.horizontalDistance || '', Math.round(W * 0.12), { fontSize: 12, fillColor: bg }),
                h.dataCell(s.owner || '', W - Math.round(W * 0.72), { fontSize: 12, fillColor: bg }),
              ] });
            }),
          ] })] : []),
          h.spacer(200),

          section('CAT & Genny Scan'),
          h.infoTable([
            { label: 'Operator Name', value: cat.operatorName || '' },
            { label: 'Competence Card', value: cat.competenceCard || '' },
            { label: 'Equipment Serial', value: cat.equipmentSerial || '' },
            { label: 'Last Calibration', value: cat.lastCalibration || '' },
            { label: 'Scan Completed', value: cat.scanCompleted ? 'Yes' : 'No' },
            { label: 'Scan Date', value: cat.scanDate || '' },
          ], W),
          h.spacer(80),
          ...h.prose(cat.scanFindings),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          section('Hand-Dig Zones'),
          ...h.prose(content.handDigZones),
          h.spacer(200),

          section('Safe Digging Method'),
          ...h.prose(content.safeDIggingMethod || content.safeDiggingMethod),
          h.spacer(200),

          section('Supervision Arrangements'),
          h.infoTable([
            { label: 'Excavation Supervisor', value: sup.excavationSupervisor || '' },
            { label: 'Competence', value: sup.competence || '' },
            { label: 'Inspection Frequency', value: sup.inspectionFrequency || '' },
          ], W),
          h.spacer(200),

          section('Emergency Procedures — Service Strike'),
          ...h.prose(emerg.serviceStrike),
          h.spacer(80),
          ...(Array.isArray(emerg.emergencyContacts) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.5), W - Math.round(W * 0.5)], rows: [
            new TableRow({ children: [h.headerCell('Service', Math.round(W * 0.5), { fontSize: 14 }), h.headerCell('Emergency Number', W - Math.round(W * 0.5), { fontSize: 14 })] }),
            ...emerg.emergencyContacts.map((c: any) => new TableRow({ children: [
              h.dataCell(c.service || '', Math.round(W * 0.5), { fontSize: 14 }),
              h.dataCell(c.number || '', W - Math.round(W * 0.5), { fontSize: 14, bold: true }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Permit Conditions'),
          ...(Array.isArray(content.permitConditions) ? content.permitConditions.map((c: string, i: number) =>
            new Paragraph({ spacing: { after: 60 }, children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: 18, font: 'Arial' }),
              new TextRun({ text: c, size: 18, font: 'Arial' }),
            ] })
          ) : []),
          h.spacer(200),

          section('Permit Sign-Off'),
          h.approvalTable([
            { role: 'Permit Issued By', name: so.issuedBy || content.issuedBy || '' },
            { role: 'Permit Received By', name: so.receivedBy || '' },
          ], W),
          h.spacer(200),

          section('Regulatory References'),
          h.bodyText('• HSG47 — Avoiding Danger from Underground Services (HSE)'),
          h.bodyText('• PAS 128 — Specification for Underground Utility Detection, Verification and Location'),
          h.bodyText('• New Roads and Street Works Act 1991 (NRSWA)'),
          h.bodyText('• Construction (Design and Management) Regulations 2015'),
          h.spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
        ],
      },
    ],
  });
}
