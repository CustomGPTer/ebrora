// =============================================================================
// Toolbox Talk — Dedicated Template
// Professional, branded 5-page layout for site safety briefings.
// Pages: Cover, Hazards & PPE, Controls & Do's/Don'ts, Emergency & Discussion,
//        Attendance Record.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

// ── TBT Brand Colours ──
const TBT_TEAL = '0891B2';
const TBT_TEAL_LIGHT = 'E0F7FA';
const TBT_TEAL_DARK = '065F73';
const TBT_RED = 'DC2626';
const TBT_RED_LIGHT = 'FEE2E2';
const TBT_GREEN = '16A34A';
const TBT_GREEN_LIGHT = 'DCFCE7';
const TBT_AMBER = 'D97706';

// ── Helpers ──

function likelihoodColour(likelihood: string): { fill: string; text: string } {
  const l = (likelihood || '').toLowerCase();
  if (l === 'high' || l === 'h') return { fill: TBT_RED, text: h.WHITE };
  if (l === 'medium' || l === 'med' || l === 'm') return { fill: TBT_AMBER, text: h.WHITE };
  return { fill: TBT_GREEN, text: h.WHITE };
}

function section(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: TBT_TEAL } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN }),
    ],
  });
}

function subSection(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 20, font: 'Arial', color: TBT_TEAL_DARK }),
    ],
  });
}

function numberedItem(num: number, text: string, opts?: { bold?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 18, font: 'Arial', color: TBT_TEAL_DARK }),
      new TextRun({ text, size: 18, font: 'Arial', bold: opts?.bold, color: opts?.color }),
    ],
  });
}

function doBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '✓  ', bold: true, size: 20, font: 'Arial', color: TBT_GREEN }),
      new TextRun({ text, size: 18, font: 'Arial' }),
    ],
  });
}

function dontBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '✗  ', bold: true, size: 20, font: 'Arial', color: TBT_RED }),
      new TextRun({ text, size: 18, font: 'Arial' }),
    ],
  });
}

// ── Main Export ──

export async function buildTbtDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const hazards: any[] = Array.isArray(content.keyHazards) ? content.keyHazards : [];
  const controls: any[] = Array.isArray(content.controlMeasures) ? content.controlMeasures : [];
  const dos: string[] = Array.isArray(content.dosAndDonts?.dos) ? content.dosAndDonts.dos : [];
  const donts: string[] = Array.isArray(content.dosAndDonts?.donts) ? content.dosAndDonts.donts : [];
  const discussion: string[] = Array.isArray(content.discussionPoints) ? content.discussionPoints : [];
  const takeaways: string[] = Array.isArray(content.keyTakeaways) ? content.keyTakeaways : [];
  const ppe: string[] = Array.isArray(content.ppeRequired) ? content.ppeRequired : [];
  const standards: string[] = Array.isArray(content.relevantStandards) ? content.relevantStandards : [];

  // Column widths for hazards table
  const hzNumW = 500;
  const hzLikW = 1400;
  const hzRemaining = W - hzNumW - hzLikW;
  const hzHazW = Math.round(hzRemaining * 0.5);
  const hzConW = hzRemaining - hzHazW;

  // Column widths for control measures table
  const ctrlNumW = 500;
  const ctrlMeasureW = Math.round((W - ctrlNumW) * 0.35);
  const ctrlDetailW = W - ctrlNumW - ctrlMeasureW;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      // ═════════════════════════════════════════════════════════════════════
      // PAGE 1: COVER
      // ═════════════════════════════════════════════════════════════════════
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          // Title
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 100 }, children: [
            new TextRun({ text: 'TOOLBOX TALK', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'Site Safety Briefing', size: 22, font: 'Arial', color: TBT_TEAL_DARK }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TBT_TEAL } }, children: [] }),

          // Topic banner
          new Paragraph({ spacing: { before: 100, after: 300 }, shading: { type: ShadingType.CLEAR, fill: TBT_TEAL }, children: [
            new TextRun({ text: `  ${(content.topic || 'SAFETY BRIEFING').toUpperCase()}  `, bold: true, size: 28, font: 'Arial', color: h.WHITE }),
          ] }),

          // Project information
          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
          ], W),
          h.spacer(160),

          // Document control
          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Date of Briefing', value: content.date || '' },
            { label: 'Delivered By', value: content.deliveredBy || '' },
          ], W),
          h.spacer(200),

          // Key takeaways summary box
          h.sectionHeading('Key Messages'),
          ...(takeaways.length > 0 ? [
            new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [
              new TableRow({ children: [
                new TableCell({
                  width: { size: W, type: WidthType.DXA },
                  shading: { type: ShadingType.CLEAR, fill: TBT_TEAL_LIGHT },
                  borders: h.CELL_BORDERS,
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  children: takeaways.map((t, i) =>
                    new Paragraph({
                      spacing: { after: i < takeaways.length - 1 ? 80 : 0 },
                      children: [
                        new TextRun({ text: `${i + 1}. `, bold: true, size: 20, font: 'Arial', color: TBT_TEAL_DARK }),
                        new TextRun({ text: t, bold: true, size: 20, font: 'Arial', color: h.BLACK }),
                      ],
                    })
                  ),
                }),
              ] }),
            ] }),
          ] : [h.bodyText('Key messages will be covered during the briefing.')]),
          h.spacer(200),

          // Approval
          h.sectionHeading('Approval & Sign-Off'),
          h.approvalTable([
            { role: 'Delivered By', name: content.deliveredBy || '' },
            { role: 'Reviewed By', name: '' },
          ], W),

          section('Introduction'),
          ...h.prose(content.introduction),
          h.spacer(200),

          section('Key Hazards'),
          ...(hazards.length > 0 ? [
            new Table({
              width: { size: W, type: WidthType.DXA },
              columnWidths: [hzNumW, hzHazW, hzConW, hzLikW],
              rows: [
                new TableRow({ children: [
                  h.headerCell('#', hzNumW, { fontSize: 14, alignment: AlignmentType.CENTER }),
                  h.headerCell('Hazard', hzHazW, { fontSize: 14 }),
                  h.headerCell('Consequence', hzConW, { fontSize: 14 }),
                  h.headerCell('Likelihood', hzLikW, { fontSize: 14, alignment: AlignmentType.CENTER }),
                ] }),
                ...hazards.map((hz, i) => {
                  const lc = likelihoodColour(hz.likelihood);
                  const stripe = i % 2 === 0 ? h.GREY_LIGHT : undefined;
                  return new TableRow({ children: [
                    h.dataCell(String(i + 1), hzNumW, { fontSize: 16, alignment: AlignmentType.CENTER, fillColor: stripe }),
                    h.dataCell(hz.hazard || '', hzHazW, { fontSize: 16, bold: true, fillColor: stripe }),
                    h.dataCell(hz.consequence || '', hzConW, { fontSize: 16, fillColor: stripe }),
                    h.dataCell(hz.likelihood || '', hzLikW, { fontSize: 16, bold: true, fillColor: lc.fill, color: lc.text, alignment: AlignmentType.CENTER }),
                  ] });
                }),
              ],
            }),
          ] : [h.bodyText('No specific hazards identified.')]),
          h.spacer(200),

          section('PPE Requirements'),
          ...(ppe.length > 0
            ? ppe.map((item, i) => numberedItem(i + 1, item))
            : [h.bodyText('Standard site PPE as per site induction.')]),

          section('Control Measures'),
          ...(controls.length > 0 ? [
            new Table({
              width: { size: W, type: WidthType.DXA },
              columnWidths: [ctrlNumW, ctrlMeasureW, ctrlDetailW],
              rows: [
                new TableRow({ children: [
                  h.headerCell('#', ctrlNumW, { fontSize: 14, alignment: AlignmentType.CENTER }),
                  h.headerCell('Control Measure', ctrlMeasureW, { fontSize: 14 }),
                  h.headerCell('Detail', ctrlDetailW, { fontSize: 14 }),
                ] }),
                ...controls.map((cm, i) => {
                  const stripe = i % 2 === 0 ? h.GREY_LIGHT : undefined;
                  return new TableRow({ children: [
                    h.dataCell(String(i + 1), ctrlNumW, { fontSize: 16, alignment: AlignmentType.CENTER, fillColor: stripe }),
                    h.dataCell(cm.measure || '', ctrlMeasureW, { fontSize: 16, bold: true, fillColor: stripe }),
                    h.dataCell(cm.detail || '', ctrlDetailW, { fontSize: 16, fillColor: stripe }),
                  ] });
                }),
              ],
            }),
          ] : [h.bodyText('No specific control measures listed.')]),
          h.spacer(240),

          // Do's and Don'ts — side by side as two separate sections
          section("Do's and Don'ts"),
          h.spacer(40),

          // Do's
          subSection("DO's"),
          ...(dos.length > 0
            ? dos.map(d => doBullet(d))
            : [h.bodyText('No specific do\'s listed.')]
          ),
          h.spacer(160),

          // Don'ts
          subSection("DON'Ts"),
          ...(donts.length > 0
            ? donts.map(d => dontBullet(d))
            : [h.bodyText('No specific don\'ts listed.')]
          ),

          section('Emergency Procedures'),
          ...h.prose(content.emergencyProcedures),
          h.spacer(200),

          section('Discussion Points'),
          ...(discussion.length > 0
            ? discussion.map((d, i) => numberedItem(i + 1, d))
            : [h.bodyText('No discussion points listed.')]
          ),
          h.spacer(200),

          section('Key Takeaways'),
          ...(takeaways.length > 0
            ? takeaways.map((t, i) => new Paragraph({
                spacing: { after: 80 },
                shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? TBT_TEAL_LIGHT : h.WHITE },
                children: [
                  new TextRun({ text: `  ${i + 1}. `, bold: true, size: 20, font: 'Arial', color: TBT_TEAL_DARK }),
                  new TextRun({ text: t, bold: true, size: 20, font: 'Arial' }),
                ],
              }))
            : [h.bodyText('No key takeaways listed.')]
          ),
          h.spacer(200),

          section('Relevant Standards & Guidance'),
          ...(standards.length > 0
            ? standards.map(s => h.bodyText(`\u2022 ${s}`))
            : [
                h.bodyText('\u2022 Health and Safety at Work etc. Act 1974'),
                h.bodyText('\u2022 Management of Health and Safety at Work Regulations 1999'),
                h.bodyText('\u2022 Construction (Design and Management) Regulations 2015'),
              ]
          ),
          h.spacer(160),

          ...(content.additionalNotes
            ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)]
            : []
          ),

          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
            children: [new TextRun({ text: 'This toolbox talk must be delivered before work commences. All operatives must sign the attendance record overleaf.', size: 16, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),

          section('Attendance Record'),
          new Paragraph({ spacing: { after: 120 }, children: [
            new TextRun({ text: 'I confirm that I have attended this toolbox talk, I understand the hazards discussed, and I will follow the control measures described.', size: 16, font: 'Arial', color: h.GREY_DARK, italics: true }),
          ] }),
          h.spacer(80),

          // Topic and date reminder
          h.infoTable([
            { label: 'Topic', value: content.topic || '' },
            { label: 'Date', value: content.date || '' },
            { label: 'Delivered By', value: content.deliveredBy || '' },
          ], W),
          h.spacer(160),

          // 20-row attendance table
          h.briefingRecordTable(20, W),
          h.spacer(200),

          // Supervisor declaration
          new Paragraph({ spacing: { before: 100, after: 100 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } }, children: [] }),
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: 'Supervisor / Presenter Declaration', bold: true, size: 20, font: 'Arial', color: TBT_TEAL_DARK }),
          ] }),
          new Paragraph({ spacing: { after: 80 }, children: [
            new TextRun({ text: 'I confirm that this toolbox talk was delivered as described above and that all attendees were given the opportunity to ask questions.', size: 16, font: 'Arial', color: h.GREY_DARK }),
          ] }),
          h.spacer(80),
          h.infoTable([
            { label: 'Print Name', value: '' },
            { label: 'Signature', value: '' },
            { label: 'Date', value: '' },
          ], W),
        ],
      },
    ],
  });
}
