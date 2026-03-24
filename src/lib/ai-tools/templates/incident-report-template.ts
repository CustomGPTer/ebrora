// =============================================================================
// Incident Investigation Report — Dedicated Template
// Professional multi-page layout with root cause analysis, RIDDOR assessment,
// corrective/preventive actions, and lessons learned.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'C0392B';
const ACCENT_LIGHT = 'FADBD8';
const ACCENT_DARK = '922B21';

function section(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })],
  });
}

// prose() now imported from docx-helpers via h.prose()

function severityColour(sev: string): { fill: string; text: string } {
  const s = (sev || '').toLowerCase();
  if (s.includes('fatal') || s.includes('major')) return { fill: ACCENT, text: h.WHITE };
  if (s.includes('over-7') || s.includes('riddor')) return { fill: 'E67E22', text: h.WHITE };
  if (s.includes('minor')) return { fill: '27AE60', text: h.WHITE };
  return { fill: 'F39C12', text: h.WHITE };
}

export async function buildIncidentReportDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  const rootCause = content.rootCauseAnalysis || {};
  const riddor = content.riddorAssessment || {};
  const sevC = severityColour(content.severity);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // ─── PAGE 1: COVER ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'INCIDENT INVESTIGATION REPORT', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          new Paragraph({ spacing: { before: 100, after: 200 }, shading: { type: ShadingType.CLEAR, fill: ACCENT }, children: [
            new TextRun({ text: `  ${(content.incidentType || 'INCIDENT').toUpperCase()} — ${(content.severity || '').toUpperCase()}  `, bold: true, size: 28, font: 'Arial', color: h.WHITE }),
          ] }),

          h.sectionHeading('Incident Details'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Incident Date', value: content.incidentDate || '' },
            { label: 'Incident Time', value: content.incidentTime || '' },
            { label: 'Report Date', value: content.reportDate || '' },
            { label: 'Investigated By', value: content.investigatedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
            { label: 'Exact Location', value: content.exactLocation || '' },
          ], W),
          h.spacer(160),

          h.sectionHeading('Severity & RIDDOR Classification'),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.33), Math.round(W * 0.33), W - Math.round(W * 0.33) * 2], rows: [
            new TableRow({ children: [
              h.headerCell('Incident Type', Math.round(W * 0.33), { fontSize: 16, alignment: AlignmentType.CENTER }),
              h.headerCell('Severity', Math.round(W * 0.33), { fontSize: 16, alignment: AlignmentType.CENTER }),
              h.headerCell('RIDDOR Reportable', W - Math.round(W * 0.33) * 2, { fontSize: 16, alignment: AlignmentType.CENTER }),
            ] }),
            new TableRow({ children: [
              h.dataCell(content.incidentType || '', Math.round(W * 0.33), { fontSize: 16, alignment: AlignmentType.CENTER, bold: true }),
              h.dataCell(content.severity || '', Math.round(W * 0.33), { fontSize: 16, alignment: AlignmentType.CENTER, bold: true, fillColor: sevC.fill, color: sevC.text }),
              h.dataCell(riddor.isRiddorReportable || '', W - Math.round(W * 0.33) * 2, { fontSize: 16, alignment: AlignmentType.CENTER, bold: true }),
            ] }),
          ] }),
          h.spacer(200),

          h.sectionHeading('Approval & Sign-Off'),
          h.approvalTable([
            { role: 'Investigated By', name: content.investigatedBy || '' },
            { role: 'Reviewed By', name: '' },
            { role: 'Approved By', name: '' },
          ], W),
        ],
      },

      // ─── PAGE 2: INCIDENT DETAILS ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Incident Summary'),
          ...h.prose(content.incidentSummary),
          h.spacer(160),

          section('Activity at Time of Incident'),
          ...h.prose(content.activityAtTimeOfIncident),
          h.spacer(120),
          h.infoTable([
            { label: 'RAMS / Permits in Place', value: content.ramsInPlace || '' },
            { label: 'Environmental Conditions', value: content.environmentalConditions || '' },
          ], W),
          h.spacer(160),

          section('Persons Involved'),
          ...(Array.isArray(content.personsInvolved) && content.personsInvolved.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('Name', Math.round(W * 0.18), { fontSize: 14 }),
                  h.headerCell('Role', Math.round(W * 0.15), { fontSize: 14 }),
                  h.headerCell('Employer', Math.round(W * 0.15), { fontSize: 14 }),
                  h.headerCell('Injury', Math.round(W * 0.22), { fontSize: 14 }),
                  h.headerCell('Treatment', Math.round(W * 0.18), { fontSize: 14 }),
                  h.headerCell('Time Off', W - Math.round(W * 0.88), { fontSize: 14 }),
                ] }),
                ...content.personsInvolved.map((p: any, i: number) => new TableRow({ children: [
                  h.dataCell(p.name || '', Math.round(W * 0.18), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(p.role || '', Math.round(W * 0.15), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(p.employer || '', Math.round(W * 0.15), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(p.injuryDescription || '', Math.round(W * 0.22), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(p.treatmentGiven || '', Math.round(W * 0.18), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(p.timeOffWork || '', W - Math.round(W * 0.88), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
                ] })),
              ] })]
            : [h.bodyText('No persons directly involved.')]
          ),
          h.spacer(160),

          section('Witnesses'),
          ...(Array.isArray(content.witnesses) && content.witnesses.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('Name', Math.round(W * 0.4), { fontSize: 14 }),
                  h.headerCell('Role', Math.round(W * 0.3), { fontSize: 14 }),
                  h.headerCell('Employer', W - Math.round(W * 0.7), { fontSize: 14 }),
                ] }),
                ...content.witnesses.map((w: any) => new TableRow({ children: [
                  h.dataCell(w.name || '', Math.round(W * 0.4), { fontSize: 14 }),
                  h.dataCell(w.role || '', Math.round(W * 0.3), { fontSize: 14 }),
                  h.dataCell(w.employer || '', W - Math.round(W * 0.7), { fontSize: 14 }),
                ] })),
              ] })]
            : [h.bodyText('No witnesses recorded.')]
          ),
        ],
      },

      // ─── PAGE 3: ROOT CAUSE & RIDDOR ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Immediate Causes'),
          ...(Array.isArray(content.immediateCauses) && content.immediateCauses.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('Cause', Math.round(W * 0.35), { fontSize: 14 }),
                  h.headerCell('Detail', W - Math.round(W * 0.35), { fontSize: 14 }),
                ] }),
                ...content.immediateCauses.map((c: any, i: number) => new TableRow({ children: [
                  h.dataCell(c.cause || '', Math.round(W * 0.35), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
                  h.dataCell(c.detail || '', W - Math.round(W * 0.35), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
                ] })),
              ] })]
            : [h.bodyText('None identified.')]
          ),
          h.spacer(200),

          section('Root Cause Analysis — 5 Whys'),
          h.infoTable([
            { label: 'Why 1', value: rootCause.why1 || '' },
            { label: 'Why 2', value: rootCause.why2 || '' },
            { label: 'Why 3', value: rootCause.why3 || '' },
            { label: 'Why 4', value: rootCause.why4 || '' },
            { label: 'Why 5', value: rootCause.why5 || '' },
          ], W),
          h.spacer(120),
          new Paragraph({ spacing: { before: 100, after: 120 }, shading: { type: ShadingType.CLEAR, fill: ACCENT_LIGHT }, children: [
            new TextRun({ text: '  ROOT CAUSE: ', bold: true, size: 20, font: 'Arial', color: ACCENT }),
            new TextRun({ text: rootCause.rootCause || '', size: 18, font: 'Arial' }),
          ] }),
          h.spacer(200),

          section('RIDDOR Reportability Assessment'),
          h.infoTable([
            { label: 'RIDDOR Reportable', value: riddor.isRiddorReportable || '' },
            { label: 'RIDDOR Category', value: riddor.riddorCategory || '' },
          ], W),
          h.spacer(80),
          ...h.prose(riddor.riddorJustification),
        ],
      },

      // ─── PAGE 4: ACTIONS & LESSONS LEARNED ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Immediate Actions Taken'),
          ...(Array.isArray(content.immediateActionsTaken) && content.immediateActionsTaken.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('Action', Math.round(W * 0.5), { fontSize: 14 }),
                  h.headerCell('Taken By', Math.round(W * 0.3), { fontSize: 14 }),
                  h.headerCell('Date', W - Math.round(W * 0.8), { fontSize: 14 }),
                ] }),
                ...content.immediateActionsTaken.map((a: any) => new TableRow({ children: [
                  h.dataCell(a.action || '', Math.round(W * 0.5), { fontSize: 14 }),
                  h.dataCell(a.takenBy || '', Math.round(W * 0.3), { fontSize: 14 }),
                  h.dataCell(a.date || '', W - Math.round(W * 0.8), { fontSize: 14 }),
                ] })),
              ] })]
            : []
          ),
          h.spacer(200),

          section('Corrective Actions'),
          ...(Array.isArray(content.correctiveActions) && content.correctiveActions.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }),
                  h.headerCell('Corrective Action', Math.round(W * 0.44), { fontSize: 14 }),
                  h.headerCell('Responsible', Math.round(W * 0.22), { fontSize: 14 }),
                  h.headerCell('Target Date', Math.round(W * 0.16), { fontSize: 14 }),
                  h.headerCell('Status', W - Math.round(W * 0.88), { fontSize: 14 }),
                ] }),
                ...content.correctiveActions.map((a: any, i: number) => new TableRow({ children: [
                  h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
                  h.dataCell(a.action || '', Math.round(W * 0.44), { fontSize: 14 }),
                  h.dataCell(a.responsiblePerson || '', Math.round(W * 0.22), { fontSize: 14 }),
                  h.dataCell(a.targetDate || '', Math.round(W * 0.16), { fontSize: 14 }),
                  h.dataCell(a.status || 'Open', W - Math.round(W * 0.88), { fontSize: 14, bold: true }),
                ] })),
              ] })]
            : []
          ),
          h.spacer(200),

          section('Preventive Actions'),
          ...(Array.isArray(content.preventiveActions) && content.preventiveActions.length > 0
            ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
                new TableRow({ children: [
                  h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }),
                  h.headerCell('Preventive Action', Math.round(W * 0.44), { fontSize: 14 }),
                  h.headerCell('Responsible', Math.round(W * 0.22), { fontSize: 14 }),
                  h.headerCell('Target Date', Math.round(W * 0.16), { fontSize: 14 }),
                  h.headerCell('Status', W - Math.round(W * 0.88), { fontSize: 14 }),
                ] }),
                ...content.preventiveActions.map((a: any, i: number) => new TableRow({ children: [
                  h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
                  h.dataCell(a.action || '', Math.round(W * 0.44), { fontSize: 14 }),
                  h.dataCell(a.responsiblePerson || '', Math.round(W * 0.22), { fontSize: 14 }),
                  h.dataCell(a.targetDate || '', Math.round(W * 0.16), { fontSize: 14 }),
                  h.dataCell(a.status || 'Open', W - Math.round(W * 0.88), { fontSize: 14, bold: true }),
                ] })),
              ] })]
            : []
          ),
          h.spacer(200),

          section('Lessons Learned'),
          ...h.prose(content.lessonsLearned),
          h.spacer(160),

          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),

          section('Regulatory References'),
          h.bodyText('• Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 (RIDDOR)'),
          h.bodyText('• Management of Health and Safety at Work Regulations 1999'),
          h.bodyText('• Construction (Design and Management) Regulations 2015'),
          h.bodyText('• HSE Guidance — Investigating accidents and incidents (HSG245)'),
          h.bodyText('• Health and Safety at Work etc. Act 1974'),
          h.spacer(300),

          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
            children: [new TextRun({ text: 'This report must be treated as confidential and shared only with relevant parties.', size: 16, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 80 },
            children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })],
          }),
        ],
      },
    ],
  });
}
