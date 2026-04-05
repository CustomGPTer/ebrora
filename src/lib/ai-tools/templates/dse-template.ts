// =============================================================================
// DSE Assessment — Display Screen Equipment Regulations 1992
// Single template, structured layout matching Ebrora standard.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32;
const ACCENT = '1B5745';
const ACCENT_DARK = '143D2B';
const ZEBRA = 'F5F5F5';
const GREEN_BG = 'D1FAE5'; const GREEN_TXT = '059669';
const AMBER_BG = 'FEF3C7'; const AMBER_TXT = 'D97706';
const RED_BG = 'FEE2E2'; const RED_TXT = 'DC2626';
const GREY_BG = 'F3F4F6'; const GREY_TXT = '6B7280';

function secHead(num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: LG, font: 'Arial', color: ACCENT })],
  });
}

function ragColours(risk: string): { bg: string; fg: string } {
  const r = (risk || '').toLowerCase();
  if (r === 'high' || r === 'immediate') return { bg: RED_BG, fg: RED_TXT };
  if (r === 'medium' || r === 'short-term') return { bg: AMBER_BG, fg: AMBER_TXT };
  if (r === 'low' || r === 'medium-term') return { bg: GREEN_BG, fg: GREEN_TXT };
  return { bg: GREY_BG, fg: GREY_TXT };
}

function ragCell(text: string, width: number): TableCell {
  const c = ragColours(text);
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: h.CELL_BORDERS,
    shading: { fill: c.bg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: text || '—', bold: true, size: SM, font: 'Arial', color: c.fg }),
    ] })],
  });
}

function wsRow(label: string, value: string, idx: number): TableRow {
  const bg = idx % 2 === 1 ? ZEBRA : 'FFFFFF';
  const lw = Math.round(W * 0.30); const vw = W - lw;
  return new TableRow({ children: [
    h.dataCell(label, lw, { bold: true, fontSize: SM, fillColor: bg }),
    h.dataCell(value || '—', vw, { fontSize: SM, fillColor: bg }),
  ] });
}

function wsSection(title: string, items: Array<{ label: string; value: string }>, issues: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  elements.push(new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text: title, bold: true, size: BODY, font: 'Arial', color: ACCENT })],
  }));
  if (items.length > 0) {
    const lw = Math.round(W * 0.30); const vw = W - lw;
    elements.push(new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: [lw, vw],
      rows: items.map((r, i) => wsRow(r.label, r.value, i)),
    }));
  }
  if (issues) {
    elements.push(new Paragraph({
      spacing: { before: 80, after: 100 },
      children: [new TextRun({ text: 'Issues: ', bold: true, size: SM, font: 'Arial', color: ACCENT }), new TextRun({ text: issues, size: SM, font: 'Arial' })],
    }));
  }
  return elements;
}

export async function buildDseDocument(content: any): Promise<Document> {
  const c = content;
  const ws = c.workstation || {};
  const d = ws.display || {}; const kb = ws.keyboard || {}; const ms = ws.mouse || {};
  const ch = ws.chair || {}; const dk = ws.desk || {}; const lt = ws.lighting || {};
  const env = ws.environment || {};
  const wp = c.workPattern || {};
  const uh = c.userHealth || {};
  const findings = Array.isArray(c.assessmentFindings) ? c.assessmentFindings : [];

  const children: (Paragraph | Table)[] = [];

  // Compact header
  children.push(new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: ACCENT } }, children: [] }));
  children.push(new Paragraph({ spacing: { before: 80, after: 200 }, children: [new TextRun({ text: 'DSE ASSESSMENT', bold: true, size: XL + 8, font: 'Arial', color: ACCENT })] }));
  children.push(h.infoTable([
    { label: 'Document Reference', value: c.documentRef || '' },
    { label: 'User / Assessor', value: c.assessedBy || '' },
    { label: 'Job Title', value: c.jobTitle || '' },
    { label: 'Location', value: c.location || '' },
    { label: 'Date', value: c.assessmentDate || '' },
    { label: 'Review Date', value: c.reviewDate || '' },
  ], W));
  children.push(h.spacer(150));

  // 1.0 Workstation Assessment
  children.push(secHead('1.0', 'Workstation Assessment'));
  children.push(...wsSection('Display', [
    { label: 'Type', value: d.type }, { label: 'Size', value: d.size },
    { label: 'Position', value: d.position }, { label: 'Brightness', value: d.brightness },
  ], d.issues));
  children.push(...wsSection('Keyboard', [
    { label: 'Type', value: kb.type }, { label: 'Position', value: kb.position },
  ], kb.issues));
  children.push(...wsSection('Mouse', [
    { label: 'Type', value: ms.type }, { label: 'Position', value: ms.position },
  ], ms.issues));
  children.push(...wsSection('Chair', [
    { label: 'Type', value: ch.type }, { label: 'Adjustable', value: typeof ch.adjustable === 'boolean' ? (ch.adjustable ? 'Yes' : 'No') : (ch.adjustable || '') },
    { label: 'Armrests', value: ch.armrests }, { label: 'Lumbar Support', value: ch.lumbarSupport },
  ], ch.issues));
  children.push(...wsSection('Desk', [
    { label: 'Type', value: dk.type }, { label: 'Height', value: dk.height },
    { label: 'Surface', value: dk.surface }, { label: 'Leg Room', value: dk.legRoom },
  ], dk.issues));
  children.push(...wsSection('Lighting', [
    { label: 'Type', value: lt.type }, { label: 'Glare', value: lt.glare },
    { label: 'Reflections', value: lt.reflections },
  ], lt.issues));
  children.push(...wsSection('Environment', [
    { label: 'Temperature', value: env.temperature }, { label: 'Noise', value: env.noise },
    { label: 'Space', value: env.space },
  ], env.issues));

  // 2.0 Work Pattern
  children.push(secHead('2.0', 'Work Pattern'));
  children.push(h.infoTable([
    { label: 'Hours At Screen', value: wp.hoursAtScreen || '' },
    { label: 'Break Frequency', value: wp.breakFrequency || '' },
    { label: 'Task Variety', value: wp.taskVariety || '' },
  ], W));

  // 3.0 User Health
  children.push(secHead('3.0', 'User Health'));
  children.push(h.infoTable([
    { label: 'Eye Issues', value: uh.eyeIssues || '' },
    { label: 'Musculoskeletal Issues', value: uh.musculoskeletalIssues || '' },
    { label: 'Other Concerns', value: uh.otherConcerns || '' },
  ], W));

  // 4.0 Assessment Findings
  children.push(secHead('4.0', 'Assessment Findings'));
  if (findings.length > 0) {
    const cw = [Math.round(W*0.14), Math.round(W*0.30), Math.round(W*0.08), Math.round(W*0.30), Math.round(W*0.09), W - Math.round(W*0.14) - Math.round(W*0.30) - Math.round(W*0.08) - Math.round(W*0.30) - Math.round(W*0.09)];
    children.push(new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: [cw[0], cw[1], cw[2], cw[3], cw[4], cw[5]],
      rows: [
        new TableRow({ children: [
          h.headerCell('Area', cw[0]), h.headerCell('Finding', cw[1]),
          h.headerCell('Risk', cw[2]), h.headerCell('Recommendation', cw[3]),
          h.headerCell('Priority', cw[4]), h.headerCell('Owner', cw[5]),
        ] }),
        ...findings.map((f: any, i: number) => new TableRow({ children: [
          h.dataCell(f.area || '', cw[0], { fontSize: SM, fillColor: i % 2 === 0 ? ZEBRA : undefined }),
          h.dataCell(f.finding || '', cw[1], { fontSize: SM, fillColor: i % 2 === 0 ? ZEBRA : undefined }),
          ragCell(f.risk || '', cw[2]),
          h.dataCell(f.recommendation || '', cw[3], { fontSize: SM, fillColor: i % 2 === 0 ? ZEBRA : undefined }),
          ragCell(f.priority || '', cw[4]),
          h.dataCell(f.responsible || '', cw[5], { fontSize: SM, fillColor: i % 2 === 0 ? ZEBRA : undefined }),
        ] })),
      ],
    }));
  } else {
    children.push(h.bodyText('No assessment findings recorded.', SM, { italic: true, color: '999999' }));
  }

  // 5.0 Overall Risk & Action Plan
  children.push(secHead('5.0', 'Overall Risk & Action Plan'));
  children.push(h.bodyText(`Overall Risk Rating: ${c.overallRisk || '—'}`, LG, { bold: true, color: ragColours(c.overallRisk).fg }));
  children.push(h.spacer(80));
  if (c.actionPlan) {
    for (const para of String(c.actionPlan).split(/\n\n?/).filter(Boolean)) {
      children.push(h.bodyText(para, BODY));
    }
  }

  // 6.0 Additional Notes
  if (c.additionalNotes) {
    children.push(secHead('6.0', 'Additional Notes'));
    children.push(...h.prose(c.additionalNotes));
  }

  // Sign-off
  children.push(secHead('7.0', 'Assessment Sign-Off'));
  children.push(h.approvalTable([
    { role: 'Assessor', name: c.assessedBy || '' },
    { role: 'User', name: c.userName || '' },
  ], W));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader('DSE Assessment') },
      footers: { default: h.ebroraFooter() },
      children,
    }],
  });
}
