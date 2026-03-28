// =============================================================================
// TBT Builder — Multi-Template Engine
// 9 visual templates, all consuming the same TBT JSON structure.
// Router function picks the right builder based on TbtTemplateSlug.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { TbtTemplateSlug } from '@/lib/tbt/tbt-types';

const W = h.A4_CONTENT_WIDTH;

// ── Shared Colours ──────────────────────────────────────────────────────────
const EBRORA  = h.EBRORA_GREEN; // 1B5745
const RED     = 'DC2626';
const RED_L   = 'FEF2F2';
const AMBER   = 'D97706';
const AMBER_L = 'FFFBEB';
const GREEN   = '16A34A';
const GREEN_L = 'F0FDF4';
const BLUE    = '2563EB';
const BLUE_L  = 'EFF6FF';
const TEAL    = '0891B2';
const TEAL_D  = '065F73';
const TEAL_L  = 'E0F7FA';
const NAVY    = '1E3A5F';
const NAVY_L  = 'E8EDF2';
const GOLD    = 'D4A44C';
const INDIGO  = '4F46E5';
const INDIGO_L= 'EEF2FF';
const YELLOW  = 'FBBF24';
const YELLOW_L= 'FFFBEB';
const BLK     = '1A1A1A';
const SZ      = 18; // Default body size (half-points)
const SZ_SM   = 16;
const SZ_LG   = 20;
const SZ_XL   = 24;
const SZ_TTL  = 36;

// ── Shared Data Extraction ──────────────────────────────────────────────────
interface TbtData {
  documentRef: string; date: string; deliveredBy: string;
  projectName: string; siteAddress: string; topic: string;
  introduction: string;
  keyHazards: Array<{ hazard: string; consequence: string; likelihood: string }>;
  controlMeasures: Array<{ measure: string; detail: string }>;
  dosAndDonts: { dos: string[]; donts: string[] };
  emergencyProcedures: string;
  discussionPoints: string[];
  keyTakeaways: string[];
  ppeRequired: string[];
  relevantStandards: string[];
  additionalNotes: string;
}

function extract(c: any): TbtData {
  return {
    documentRef: c.documentRef || '',
    date: c.date || '',
    deliveredBy: c.deliveredBy || '',
    projectName: c.projectName || '',
    siteAddress: c.siteAddress || '',
    topic: c.topic || 'Safety Briefing',
    introduction: c.introduction || '',
    keyHazards: Array.isArray(c.keyHazards) ? c.keyHazards : [],
    controlMeasures: Array.isArray(c.controlMeasures) ? c.controlMeasures : [],
    dosAndDonts: {
      dos: Array.isArray(c.dosAndDonts?.dos) ? c.dosAndDonts.dos : [],
      donts: Array.isArray(c.dosAndDonts?.donts) ? c.dosAndDonts.donts : [],
    },
    emergencyProcedures: c.emergencyProcedures || '',
    discussionPoints: Array.isArray(c.discussionPoints) ? c.discussionPoints : [],
    keyTakeaways: Array.isArray(c.keyTakeaways) ? c.keyTakeaways : [],
    ppeRequired: Array.isArray(c.ppeRequired) ? c.ppeRequired : [],
    relevantStandards: Array.isArray(c.relevantStandards) ? c.relevantStandards : [],
    additionalNotes: c.additionalNotes || '',
  };
}

// ── Shared Helpers ──────────────────────────────────────────────────────────
function ragColour(likelihood: string): { fill: string; text: string } {
  const l = (likelihood || '').toLowerCase();
  if (l === 'high' || l === 'h') return { fill: RED, text: 'FFFFFF' };
  if (l === 'medium' || l === 'med' || l === 'm') return { fill: AMBER, text: 'FFFFFF' };
  return { fill: GREEN, text: 'FFFFFF' };
}

function sectionHead(text: string, colour: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: colour } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SZ_XL, font: 'Arial', color: colour })],
  });
}

function numberedSectionHead(num: number, text: string, colour: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: colour } },
    children: [
      new TextRun({ text: `${num}   `, bold: true, size: SZ_XL, font: 'Arial', color: colour }),
      new TextRun({ text: text, bold: true, size: SZ_XL, font: 'Arial', color: colour }),
    ],
  });
}

function leftBorderSection(text: string, colour: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: colour, space: 6 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SZ_XL, font: 'Arial', color: colour })],
  });
}

function bullet(text: string, icon: string = '•'): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${icon}  `, bold: true, size: SZ, font: 'Arial' }),
      new TextRun({ text, size: SZ, font: 'Arial' }),
    ],
  });
}

function doBullet(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: '✓  ', bold: true, size: SZ_LG, font: 'Arial', color: GREEN }),
    new TextRun({ text, size: SZ, font: 'Arial' }),
  ]});
}

function dontBullet(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: '✗  ', bold: true, size: SZ_LG, font: 'Arial', color: RED }),
    new TextRun({ text, size: SZ, font: 'Arial' }),
  ]});
}

function hazardTable(d: TbtData, accent: string): Table {
  const numW = 500; const likW = 1400;
  const rem = W - numW - likW;
  const hazW = Math.round(rem * 0.5); const conW = rem - hazW;
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [numW, hazW, conW, likW],
    rows: [
      new TableRow({ children: [
        h.headerCell('#', numW, { fontSize: 14, alignment: AlignmentType.CENTER, fillColor: accent }),
        h.headerCell('Hazard', hazW, { fontSize: 14, fillColor: accent }),
        h.headerCell('Consequence', conW, { fontSize: 14, fillColor: accent }),
        h.headerCell('Likelihood', likW, { fontSize: 14, alignment: AlignmentType.CENTER, fillColor: accent }),
      ]}),
      ...d.keyHazards.map((hz, i) => {
        const lc = ragColour(hz.likelihood);
        const stripe = i % 2 === 0 ? 'F5F5F5' : undefined;
        return new TableRow({ children: [
          h.dataCell(String(i + 1), numW, { fontSize: SZ_SM, alignment: AlignmentType.CENTER, fillColor: stripe }),
          h.dataCell(hz.hazard, hazW, { fontSize: SZ_SM, bold: true, fillColor: stripe }),
          h.dataCell(hz.consequence, conW, { fontSize: SZ_SM, fillColor: stripe }),
          h.dataCell(hz.likelihood, likW, { fontSize: SZ_SM, bold: true, fillColor: lc.fill, color: lc.text, alignment: AlignmentType.CENTER }),
        ]});
      }),
    ],
  });
}

function controlTable(d: TbtData, accent: string): Table {
  const numW = 500; const mW = Math.round((W - numW) * 0.35); const dW = W - numW - mW;
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [numW, mW, dW],
    rows: [
      new TableRow({ children: [
        h.headerCell('#', numW, { fontSize: 14, alignment: AlignmentType.CENTER, fillColor: accent }),
        h.headerCell('Control Measure', mW, { fontSize: 14, fillColor: accent }),
        h.headerCell('Detail', dW, { fontSize: 14, fillColor: accent }),
      ]}),
      ...d.controlMeasures.map((cm, i) => {
        const stripe = i % 2 === 0 ? 'F5F5F5' : undefined;
        return new TableRow({ children: [
          h.dataCell(String(i + 1), numW, { fontSize: SZ_SM, alignment: AlignmentType.CENTER, fillColor: stripe }),
          h.dataCell(cm.measure, mW, { fontSize: SZ_SM, bold: true, fillColor: stripe }),
          h.dataCell(cm.detail, dW, { fontSize: SZ_SM, fillColor: stripe }),
        ]});
      }),
    ],
  });
}

function discussionList(d: TbtData): Paragraph[] {
  return d.discussionPoints.map((dp, i) => new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${i + 1}. `, bold: true, size: SZ, font: 'Arial' }),
      new TextRun({ text: dp, size: SZ, font: 'Arial' }),
    ],
  }));
}

function ppeList(d: TbtData): Paragraph[] {
  return d.ppeRequired.map((p, i) => new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${i + 1}. `, bold: true, size: SZ, font: 'Arial' }),
      new TextRun({ text: p, size: SZ, font: 'Arial' }),
    ],
  }));
}

function standardsList(d: TbtData): Paragraph[] {
  const items = d.relevantStandards.length > 0 ? d.relevantStandards : [
    'Health and Safety at Work etc. Act 1974',
    'Management of Health and Safety at Work Regulations 1999',
    'Construction (Design and Management) Regulations 2015',
  ];
  return items.map(s => h.bodyText(`• ${s}`));
}

function attendancePage(d: TbtData, accent: string, rows: number = 20): any {
  return {
    properties: { ...h.PORTRAIT_SECTION },
    headers: { default: h.ebroraHeader() },
    footers: { default: h.ebroraFooter() },
    children: [
      sectionHead('Attendance Record', accent),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: 'I confirm that I have attended this toolbox talk, I understand the hazards discussed, and I will follow the control measures described.', size: SZ_SM, font: 'Arial', color: h.GREY_DARK, italics: true }),
      ]}),
      h.spacer(80),
      h.infoTable([
        { label: 'Topic', value: d.topic },
        { label: 'Date', value: d.date },
        { label: 'Delivered By', value: d.deliveredBy },
      ], W),
      h.spacer(160),
      h.briefingRecordTable(rows, W),
      h.spacer(200),
      new Paragraph({ spacing: { before: 100, after: 100 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } }, children: [] }),
      new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: 'Supervisor / Presenter Declaration', bold: true, size: SZ_LG, font: 'Arial', color: accent }),
      ]}),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: 'I confirm that this toolbox talk was delivered as described above and that all attendees were given the opportunity to ask questions.', size: SZ_SM, font: 'Arial', color: h.GREY_DARK }),
      ]}),
      h.spacer(80),
      h.infoTable([
        { label: 'Print Name', value: '' },
        { label: 'Signature', value: '' },
        { label: 'Date', value: '' },
      ], W),
    ],
  };
}

function ebroraFooterLine(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200 },
    children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: SZ_SM, font: 'Arial', color: EBRORA, bold: true })],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA BRANDED
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: TbtData): Document {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          // Cover
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'TOOLBOX TALK', bold: true, size: 44, font: 'Arial', color: EBRORA }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'Site Safety Briefing', size: 22, font: 'Arial', color: TEAL_D }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL } }, children: [] }),
          new Paragraph({ spacing: { before: 100, after: 300 }, shading: { type: ShadingType.CLEAR, fill: TEAL }, children: [
            new TextRun({ text: `  ${d.topic.toUpperCase()}  `, bold: true, size: 28, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: d.projectName },
            { label: 'Site Address', value: d.siteAddress },
          ], W),
          h.spacer(160),
          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date of Briefing', value: d.date },
            { label: 'Delivered By', value: d.deliveredBy },
          ], W),
          h.spacer(200),
          h.sectionHeading('Key Messages'),
          ...(d.keyTakeaways.length > 0 ? d.keyTakeaways.map((t, i) =>
            new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? TEAL_L : 'FFFFFF' }, children: [
              new TextRun({ text: `  ${i + 1}. `, bold: true, size: SZ_LG, font: 'Arial', color: TEAL_D }),
              new TextRun({ text: t, bold: true, size: SZ_LG, font: 'Arial' }),
            ]})
          ) : [h.bodyText('Key messages will be covered during the briefing.')]),
          h.spacer(200),
          h.sectionHeading('Approval & Sign-Off'),
          h.approvalTable([
            { role: 'Delivered By', name: d.deliveredBy },
            { role: 'Reviewed By', name: '' },
          ], W),
        ],
      },
      // Content pages
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          sectionHead('Introduction', EBRORA),
          ...h.prose(d.introduction),
          h.spacer(200),
          sectionHead('Key Hazards', EBRORA),
          ...(d.keyHazards.length > 0 ? [hazardTable(d, EBRORA)] : [h.bodyText('No specific hazards identified.')]),
          h.spacer(200),
          sectionHead('PPE Requirements', EBRORA),
          ...ppeList(d),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          sectionHead('Control Measures', EBRORA),
          ...(d.controlMeasures.length > 0 ? [controlTable(d, EBRORA)] : []),
          h.spacer(240),
          sectionHead("Do's and Don'ts", EBRORA),
          ...d.dosAndDonts.dos.map(x => doBullet(x)),
          h.spacer(120),
          ...d.dosAndDonts.donts.map(x => dontBullet(x)),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          sectionHead('Emergency Procedures', EBRORA),
          ...h.prose(d.emergencyProcedures),
          h.spacer(200),
          sectionHead('Discussion Points', EBRORA),
          ...discussionList(d),
          h.spacer(200),
          sectionHead('Key Takeaways', EBRORA),
          ...(d.keyTakeaways.map((t, i) => new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? TEAL_L : 'FFFFFF' }, children: [
            new TextRun({ text: `  ${i + 1}. `, bold: true, size: SZ_LG, font: 'Arial', color: TEAL_D }),
            new TextRun({ text: t, bold: true, size: SZ_LG, font: 'Arial' }),
          ]}))),
          h.spacer(200),
          sectionHead('Relevant Standards & Guidance', EBRORA),
          ...standardsList(d),
          h.spacer(160),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, EBRORA),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T2 — RED SAFETY BANNER
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: TbtData): Document {
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          // Red banner header
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED }, spacing: { before: 0, after: 0 }, children: [
            new TextRun({ text: `   ${d.topic.toUpperCase()}`, bold: true, size: 36, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED }, spacing: { after: 0 }, children: [
            new TextRun({ text: '   Critical safety briefing — all operatives must attend', size: SZ, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          h.spacer(40),
          // Meta bar
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: BLK }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   Date: ${d.date}  |  Site: ${d.projectName}  |  Presenter: ${d.deliveredBy}  |  Ref: ${d.documentRef}`, size: SZ_SM, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          h.spacer(120),
          // Warning box
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_L }, spacing: { after: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: RED }, bottom: { style: BorderStyle.SINGLE, size: 2, color: RED }, left: { style: BorderStyle.SINGLE, size: 2, color: RED }, right: { style: BorderStyle.SINGLE, size: 2, color: RED } }, children: [
            new TextRun({ text: '  ⚠️  ', size: SZ_LG, font: 'Arial' }),
            new TextRun({ text: d.keyTakeaways[0] || 'This is a mandatory safety briefing. All personnel must attend.', size: SZ, font: 'Arial', color: '991B1B', bold: true }),
          ]}),
          // Introduction
          leftBorderSection('Introduction', RED),
          ...h.prose(d.introduction),
          h.spacer(160),
          // Hazards
          leftBorderSection('Hazards', RED),
          ...(d.keyHazards.length > 0 ? [hazardTable(d, RED)] : []),
          h.spacer(160),
          // PPE
          leftBorderSection('PPE Requirements', RED),
          ...ppeList(d),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          leftBorderSection('Control Measures', RED),
          ...(d.controlMeasures.length > 0 ? [controlTable(d, RED)] : []),
          h.spacer(200),
          leftBorderSection("Do's and Don'ts", RED),
          ...d.dosAndDonts.dos.map(x => doBullet(x)),
          h.spacer(80),
          ...d.dosAndDonts.donts.map(x => dontBullet(x)),
          h.spacer(200),
          leftBorderSection('Emergency Procedures', RED),
          ...h.prose(d.emergencyProcedures),
          h.spacer(200),
          leftBorderSection('Discussion Points', RED),
          ...discussionList(d),
          h.spacer(200),
          leftBorderSection('Key Takeaways', RED),
          ...d.keyTakeaways.map((t, i) => new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: SZ, font: 'Arial', color: RED }),
            new TextRun({ text: t, bold: true, size: SZ, font: 'Arial' }),
          ]})),
          h.spacer(160),
          leftBorderSection('Standards & Guidance', RED),
          ...standardsList(d),
          h.spacer(120),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, RED),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T3 — EDITORIAL MINIMAL
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: TbtData): Document {
  const secH = (text: string) => new Paragraph({
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: BLK })],
  });
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Eyebrow
          new Paragraph({ spacing: { before: 400, after: 200 }, children: [
            new TextRun({ text: 'TOOLBOX TALK — HEALTH & SAFETY BRIEFING', bold: true, size: 16, font: 'Arial', color: TEAL, allCaps: true }),
          ]}),
          // Large title
          new Paragraph({ spacing: { after: 100 }, children: [
            new TextRun({ text: d.topic, bold: true, size: 48, font: 'Georgia' }),
          ]}),
          // Divider
          new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL } }, children: [
            new TextRun({ text: ' ', size: 10 }),
          ]}),
          // Meta
          new Paragraph({ spacing: { after: 300 }, children: [
            new TextRun({ text: `Date: `, bold: true, size: SZ, font: 'Arial', color: BLK }),
            new TextRun({ text: `${d.date}    `, size: SZ, font: 'Arial', color: '666666' }),
            new TextRun({ text: `Site: `, bold: true, size: SZ, font: 'Arial', color: BLK }),
            new TextRun({ text: `${d.projectName}    `, size: SZ, font: 'Arial', color: '666666' }),
            new TextRun({ text: `Presenter: `, bold: true, size: SZ, font: 'Arial', color: BLK }),
            new TextRun({ text: d.deliveredBy, size: SZ, font: 'Arial', color: '666666' }),
          ]}),
          secH('Introduction'),
          ...h.prose(d.introduction),
          // Pull quote
          ...(d.keyTakeaways.length > 0 ? [new Paragraph({
            spacing: { before: 200, after: 200 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 8 } },
            children: [new TextRun({ text: `"${d.keyTakeaways[0]}"`, italics: true, size: SZ_LG, font: 'Arial', color: '333333' })],
          })] : []),
          secH('Key Hazards'),
          ...d.keyHazards.map(hz => bullet(`${hz.hazard} — ${hz.consequence} (${hz.likelihood})`)),
          secH('Control Measures'),
          ...d.controlMeasures.map(cm => bullet(`${cm.measure}: ${cm.detail}`)),
          secH('Emergency Procedures'),
          ...h.prose(d.emergencyProcedures),
          secH("Do's and Don'ts"),
          ...d.dosAndDonts.dos.map(x => doBullet(x)),
          h.spacer(80),
          ...d.dosAndDonts.donts.map(x => dontBullet(x)),
          secH('Discussion Points'),
          ...discussionList(d),
          secH('PPE Requirements'),
          ...ppeList(d),
          secH('Standards & Guidance'),
          ...standardsList(d),
          h.spacer(200),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, TEAL),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T5 — SIDEBAR LAYOUT
// Note: docx doesn't support true sidebars, so we simulate with a 2-column
// table where column 1 is the "sidebar" with accent background.
// ═════════════════════════════════════════════════════════════════════════════
function buildT5(d: TbtData): Document {
  const sideW = Math.round(W * 0.32);
  const mainW = W - sideW;

  const sidebarCell = new TableCell({
    width: { size: sideW, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: EBRORA },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    children: [
      new Paragraph({ spacing: { after: 300 }, children: [
        new TextRun({ text: 'EBRORA', bold: true, size: 16, font: 'Arial', color: 'FFFFFF', allCaps: true }),
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: d.topic, bold: true, size: 28, font: 'Arial', color: 'FFFFFF' }),
      ]}),
      ...([
        ['Date', d.date], ['Site', d.projectName], ['Presenter', d.deliveredBy], ['Ref', d.documentRef],
      ] as [string, string][]).map(([label, val]) => new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: label.toUpperCase(), bold: true, size: 12, font: 'Arial', color: 'FFFFFF' }),
        new TextRun({ text: '\n' + val, size: SZ, font: 'Arial', color: 'FFFFFF', break: 1 }),
      ]})),
      new Paragraph({ spacing: { before: 200, after: 100 }, children: [
        new TextRun({ text: 'PPE REQUIRED', bold: true, size: 14, font: 'Arial', color: 'FFFFFF' }),
      ]}),
      ...d.ppeRequired.map(p => new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: `• ${p}`, size: SZ_SM, font: 'Arial', color: 'FFFFFF' }),
      ]})),
    ],
  });

  const mainCell = new TableCell({
    width: { size: mainW, type: WidthType.DXA },
    margins: { top: 200, bottom: 200, left: 300, right: 200 },
    children: [
      numberedSectionHead(1, 'Introduction', EBRORA),
      ...h.prose(d.introduction),
      numberedSectionHead(2, 'Key Hazards', EBRORA),
      ...d.keyHazards.map(hz => bullet(`${hz.hazard} — ${hz.consequence}`)),
      numberedSectionHead(3, 'Control Measures', EBRORA),
      ...d.controlMeasures.map(cm => bullet(`${cm.measure}: ${cm.detail}`)),
      numberedSectionHead(4, 'Emergency Procedures', EBRORA),
      ...h.prose(d.emergencyProcedures),
      numberedSectionHead(5, "Do's and Don'ts", EBRORA),
      ...d.dosAndDonts.dos.map(x => doBullet(x)),
      h.spacer(60),
      ...d.dosAndDonts.donts.map(x => dontBullet(x)),
      numberedSectionHead(6, 'Discussion Points', EBRORA),
      ...discussionList(d),
    ],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [sideW, mainW],
            rows: [new TableRow({ children: [sidebarCell, mainCell] })],
          }),
          h.spacer(120),
          sectionHead('Standards & Guidance', EBRORA),
          ...standardsList(d),
          h.spacer(80),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, EBRORA),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T6 — MAGAZINE (two-column body via table)
// ═════════════════════════════════════════════════════════════════════════════
function buildT6(d: TbtData): Document {
  // docx two-column via section properties
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Masthead
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
            new TextRun({ text: 'SAFETY BRIEFING', bold: true, size: 16, font: 'Arial', color: RED, allCaps: true }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
            new TextRun({ text: d.topic, bold: true, size: 40, font: 'Georgia' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, border: { bottom: { style: BorderStyle.DOUBLE, size: 3, color: BLK } }, children: [
            new TextRun({ text: `${d.date} • ${d.projectName} • ${d.deliveredBy}`, size: SZ_SM, font: 'Arial', color: '666666' }),
          ]}),
          // Content sections
          sectionHead('Introduction', BLK),
          ...h.prose(d.introduction),
          // Pull quote
          ...(d.keyTakeaways.length > 0 ? [new Paragraph({
            spacing: { before: 200, after: 200 },
            shading: { type: ShadingType.CLEAR, fill: 'F9F9F9' },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: RED, space: 6 } },
            children: [new TextRun({ text: `"${d.keyTakeaways[0]}"`, italics: true, size: SZ_LG, font: 'Arial', color: '333333' })],
          })] : []),
          sectionHead('Key Hazards', BLK),
          ...d.keyHazards.map(hz => bullet(`${hz.hazard} — ${hz.consequence} (${hz.likelihood})`)),
          sectionHead('Control Measures', BLK),
          ...d.controlMeasures.map(cm => bullet(`${cm.measure}: ${cm.detail}`)),
          sectionHead('Emergency Procedures', BLK),
          ...h.prose(d.emergencyProcedures),
          sectionHead("Do's and Don'ts", BLK),
          ...d.dosAndDonts.dos.map(x => doBullet(x)),
          h.spacer(60),
          ...d.dosAndDonts.donts.map(x => dontBullet(x)),
          sectionHead('Discussion Points', BLK),
          ...discussionList(d),
          sectionHead('PPE Requirements', BLK),
          ...ppeList(d),
          sectionHead('Standards', BLK),
          ...standardsList(d),
          h.spacer(120),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, BLK),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T7 — BLUEPRINT TECHNICAL
// ═════════════════════════════════════════════════════════════════════════════
function buildT7(d: TbtData): Document {
  const secH = (text: string) => new Paragraph({
    spacing: { before: 300, after: 120 },
    shading: { type: ShadingType.CLEAR, fill: NAVY_L },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D8E0' } },
    children: [new TextRun({ text: `// ${text.toUpperCase()}`, bold: true, size: SZ_SM, font: 'Courier New', color: NAVY })],
  });
  return new Document({
    styles: { default: { document: { run: { font: 'Courier New', size: SZ_SM } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Navy header
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   TBT: ${d.topic.toUpperCase()}`, bold: true, size: 24, font: 'Courier New', color: 'FFFFFF' }),
          ]}),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   REF: ${d.documentRef}`, size: SZ_SM, font: 'Courier New', color: '8899AA' }),
          ]}),
          h.spacer(20),
          // Meta bar
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY_L }, spacing: { after: 0 }, children: [
            new TextRun({ text: `  DATE: ${d.date}  |  SITE: ${d.projectName}  |  BY: ${d.deliveredBy}`, size: 14, font: 'Courier New', color: NAVY }),
          ]}),
          h.spacer(80),
          // Sections
          secH('Introduction'),
          ...h.prose(d.introduction),
          secH('Hazard Identification'),
          ...d.keyHazards.map((hz, i) => new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: `[${String(i+1).padStart(2,'0')}] `, bold: true, size: SZ_SM, font: 'Courier New', color: NAVY }),
            new TextRun({ text: `${hz.hazard} → ${hz.consequence} (${hz.likelihood})`, size: SZ_SM, font: 'Courier New' }),
          ]})),
          secH('Control Measures'),
          ...d.controlMeasures.map((cm, i) => new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: `[${String(i+1).padStart(2,'0')}] `, bold: true, size: SZ_SM, font: 'Courier New', color: NAVY }),
            new TextRun({ text: `${cm.measure}: ${cm.detail}`, size: SZ_SM, font: 'Courier New' }),
          ]})),
          secH('Emergency Protocol'),
          ...h.prose(d.emergencyProcedures),
          secH("Do's and Don'ts"),
          ...d.dosAndDonts.dos.map(x => new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: '[DO]  ', bold: true, size: SZ_SM, font: 'Courier New', color: GREEN }),
            new TextRun({ text: x, size: SZ_SM, font: 'Courier New' }),
          ]})),
          ...d.dosAndDonts.donts.map(x => new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: '[NO]  ', bold: true, size: SZ_SM, font: 'Courier New', color: RED }),
            new TextRun({ text: x, size: SZ_SM, font: 'Courier New' }),
          ]})),
          secH('Discussion Points'),
          ...discussionList(d),
          secH('PPE Requirements'),
          ...ppeList(d),
          secH('References'),
          ...standardsList(d),
          h.spacer(80),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, NAVY),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T8 — RAG TRAFFIC LIGHT BANDS
// ═════════════════════════════════════════════════════════════════════════════
function buildT8(d: TbtData): Document {
  function band(title: string, colour: string, bgLight: string, items: Paragraph[]): Paragraph[] {
    return [
      new Paragraph({ spacing: { before: 240, after: 0 }, shading: { type: ShadingType.CLEAR, fill: colour }, children: [
        new TextRun({ text: `   ${title}`, bold: true, size: SZ_LG, font: 'Arial', color: 'FFFFFF' }),
      ]}),
      ...items.map(p => {
        // Re-wrap with light background
        const runs = (p as any).root?.[1]?.children || [];
        return new Paragraph({
          spacing: { after: 60 },
          shading: { type: ShadingType.CLEAR, fill: bgLight },
          children: runs.length > 0 ? runs : [new TextRun({ text: '  •  Item', size: SZ, font: 'Arial' })],
        });
      }),
    ];
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Gradient header (solid green in docx)
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: EBRORA }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   ${d.topic}`, bold: true, size: 38, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: EBRORA }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   ${d.date} — ${d.projectName} — ${d.deliveredBy}`, size: SZ_SM, font: 'Arial', color: 'AACCBB' }),
          ]}),
          h.spacer(60),
          ...h.prose(d.introduction),
          h.spacer(80),
          // RED band — Hazards
          new Paragraph({ spacing: { before: 200, after: 0 }, shading: { type: ShadingType.CLEAR, fill: RED }, children: [
            new TextRun({ text: '   🔴  HAZARDS — WHAT CAN HURT YOU', bold: true, size: SZ_LG, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          ...d.keyHazards.map(hz => new Paragraph({
            spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: RED_L },
            children: [
              new TextRun({ text: `   •  ${hz.hazard}`, bold: true, size: SZ, font: 'Arial' }),
              new TextRun({ text: ` — ${hz.consequence}`, size: SZ, font: 'Arial', color: '666666' }),
            ],
          })),
          h.spacer(40),
          // AMBER band — Controls
          new Paragraph({ spacing: { before: 160, after: 0 }, shading: { type: ShadingType.CLEAR, fill: AMBER }, children: [
            new TextRun({ text: '   🟡  CONTROLS — WHAT WE MUST DO', bold: true, size: SZ_LG, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          ...d.controlMeasures.map(cm => new Paragraph({
            spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: AMBER_L },
            children: [
              new TextRun({ text: `   •  ${cm.measure}`, bold: true, size: SZ, font: 'Arial' }),
              new TextRun({ text: ` — ${cm.detail}`, size: SZ, font: 'Arial', color: '666666' }),
            ],
          })),
          h.spacer(40),
          // GREEN band — Safe behaviour
          new Paragraph({ spacing: { before: 160, after: 0 }, shading: { type: ShadingType.CLEAR, fill: GREEN }, children: [
            new TextRun({ text: "   🟢  SAFE BEHAVIOUR — WHAT GOOD LOOKS LIKE", bold: true, size: SZ_LG, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          ...d.dosAndDonts.dos.map(x => new Paragraph({
            spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: GREEN_L },
            children: [new TextRun({ text: `   ✓  ${x}`, size: SZ, font: 'Arial', color: '166534' })],
          })),
          h.spacer(40),
          // BLUE band — Emergency
          new Paragraph({ spacing: { before: 160, after: 0 }, shading: { type: ShadingType.CLEAR, fill: BLUE }, children: [
            new TextRun({ text: '   🔵  EMERGENCY — IF SOMETHING GOES WRONG', bold: true, size: SZ_LG, font: 'Arial', color: 'FFFFFF' }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: BLUE_L }, children: [
            new TextRun({ text: `   ${d.emergencyProcedures}`, size: SZ, font: 'Arial' }),
          ]}),
          h.spacer(200),
          sectionHead('Discussion Points', EBRORA),
          ...discussionList(d),
          h.spacer(120),
          sectionHead('PPE Requirements', EBRORA),
          ...ppeList(d),
          h.spacer(80),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, EBRORA),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T9 — CARD-BASED (simulated with bordered tables)
// ═════════════════════════════════════════════════════════════════════════════
function buildT9(d: TbtData): Document {
  function card(title: string, icon: string, items: Paragraph[]): Table {
    return new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: [W],
      rows: [new TableRow({ children: [
        new TableCell({
          width: { size: W, type: WidthType.DXA },
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
          margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children: [
            new Paragraph({ spacing: { after: 100 }, children: [
              new TextRun({ text: `${icon}  ${title}`, bold: true, size: SZ_XL, font: 'Arial', color: INDIGO }),
            ]}),
            ...items,
          ],
        }),
      ] })],
    });
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Title card
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [
            new TextRun({ text: 'TOOLBOX TALK', bold: true, size: 16, font: 'Arial', color: INDIGO }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
            new TextRun({ text: d.topic, bold: true, size: 36, font: 'Arial', color: BLK }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
            new TextRun({ text: `${d.date} • ${d.projectName} • ${d.deliveredBy}`, size: SZ_SM, font: 'Arial', color: '666666' }),
          ]}),
          h.spacer(40),
          // Introduction card
          card('Introduction', '📋', h.prose(d.introduction)),
          h.spacer(120),
          // Hazards card
          card('Key Hazards', '⚡', d.keyHazards.map(hz => bullet(`${hz.hazard} — ${hz.consequence} (${hz.likelihood})`))),
          h.spacer(120),
          // Controls card
          card('Control Measures', '🛡️', d.controlMeasures.map(cm => bullet(`${cm.measure}: ${cm.detail}`))),
          h.spacer(120),
          // Emergency card
          card('Emergency Procedure', '🚨', h.prose(d.emergencyProcedures)),
          h.spacer(120),
          // Do's and Don'ts card
          card("Do's and Don'ts", '✅', [
            ...d.dosAndDonts.dos.map(x => doBullet(x)),
            h.spacer(60),
            ...d.dosAndDonts.donts.map(x => dontBullet(x)),
          ]),
          h.spacer(120),
          // Discussion card
          card('Discussion Points', '💬', discussionList(d)),
          h.spacer(120),
          // PPE card
          card('PPE Requirements', '👷', ppeList(d)),
          h.spacer(120),
          // Standards card
          card('Standards & Guidance', '📖', standardsList(d)),
          h.spacer(80),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, INDIGO),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T10 — HAZARD INDUSTRIAL (yellow/black)
// ═════════════════════════════════════════════════════════════════════════════
function buildT10(d: TbtData): Document {
  const secH = (text: string) => new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: YELLOW } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SZ_XL, font: 'Arial', color: BLK })],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: SZ } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        footers: { default: h.ebroraFooter() },
        children: [
          // Hazard stripe (simulated)
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: YELLOW }, spacing: { after: 0 }, children: [
            new TextRun({ text: '   ⚠   SAFETY BRIEFING   ⚠', bold: true, size: SZ_SM, font: 'Arial', color: BLK }),
          ]}),
          // Dark header
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: BLK }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   ${d.topic.toUpperCase()}`, bold: true, size: 32, font: 'Arial', color: YELLOW }),
          ]}),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: BLK }, spacing: { after: 0 }, children: [
            new TextRun({ text: '   Mandatory safety briefing for all site personnel', size: SZ_SM, font: 'Arial', color: '888888' }),
          ]}),
          h.spacer(20),
          // Yellow meta bar
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: YELLOW }, spacing: { after: 0 }, children: [
            new TextRun({ text: `   Date: ${d.date}  |  Site: ${d.projectName}  |  Presenter: ${d.deliveredBy}  |  Ref: ${d.documentRef}`, bold: true, size: SZ_SM, font: 'Arial', color: BLK }),
          ]}),
          h.spacer(80),
          // Caution box
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: YELLOW_L }, spacing: { after: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: YELLOW }, bottom: { style: BorderStyle.SINGLE, size: 4, color: YELLOW }, left: { style: BorderStyle.SINGLE, size: 4, color: YELLOW }, right: { style: BorderStyle.SINGLE, size: 4, color: YELLOW } }, children: [
            new TextRun({ text: '  ⚠️  ', size: SZ_LG, font: 'Arial' }),
            new TextRun({ text: d.keyTakeaways[0] || 'This is a mandatory safety briefing.', bold: true, size: SZ, font: 'Arial' }),
          ]}),
          // Introduction
          secH('Introduction'),
          ...h.prose(d.introduction),
          // Hazards
          secH('Hazards'),
          ...(d.keyHazards.length > 0 ? [hazardTable(d, BLK)] : []),
          // Controls
          secH('Control Measures'),
          ...(d.controlMeasures.length > 0 ? [controlTable(d, BLK)] : []),
          // Emergency
          secH('Emergency Procedure'),
          ...h.prose(d.emergencyProcedures),
          // Do's/Don'ts
          secH("Do's and Don'ts"),
          ...d.dosAndDonts.dos.map(x => doBullet(x)),
          h.spacer(80),
          ...d.dosAndDonts.donts.map(x => dontBullet(x)),
          // Discussion
          secH('Discussion Points'),
          ...discussionList(d),
          // PPE
          secH('PPE Requirements'),
          ...ppeList(d),
          // Standards
          secH('Standards & Guidance'),
          ...standardsList(d),
          h.spacer(80),
          // Bottom stripe
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: YELLOW }, spacing: { after: 0 }, children: [
            new TextRun({ text: '   ⚠   END OF BRIEFING   ⚠', bold: true, size: SZ_SM, font: 'Arial', color: BLK }),
          ]}),
          h.spacer(40),
          ebroraFooterLine(),
        ],
      },
      attendancePage(d, BLK),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTER — picks the right builder based on template slug
// ═════════════════════════════════════════════════════════════════════════════
export async function buildTbtTemplateDocument(
  content: any,
  templateSlug: TbtTemplateSlug
): Promise<Document> {
  const d = extract(content);

  switch (templateSlug) {
    case 'ebrora-branded':     return buildT1(d);
    case 'red-safety':         return buildT2(d);
    case 'editorial':          return buildT3(d);
    case 'sidebar':            return buildT5(d);
    case 'magazine':           return buildT6(d);
    case 'blueprint':          return buildT7(d);
    case 'rag-bands':          return buildT8(d);
    case 'card-based':         return buildT9(d);
    case 'hazard-industrial':  return buildT10(d);
    default:                   return buildT1(d); // fallback
  }
}
