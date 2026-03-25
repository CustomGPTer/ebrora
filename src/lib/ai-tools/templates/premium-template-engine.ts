// =============================================================================
// Premium Template Engine — Shared by all 13 new AI tools
// Produces above-industry-standard docx output with:
//   • Full-width colour cover page with document classification band
//   • Running header/footer with Ebrora branding
//   • Consistent section heading style with coloured left border rule
//   • Smart field rendering: info tables, prose, bullet lists, data tables
//   • RAG rating pills (RED / AMBER / GREEN)
//   • Signature / approval block
//   • Document control box
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, WidthType, ShadingType,
  BorderStyle, VerticalAlign, PageNumber,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

// ─── Brand palette for premium templates ────────────────────────────────────
export const P_GREEN       = '1B5745';
export const P_GREEN_LIGHT = 'E8F4F0';
export const P_DARK        = '1A2E2A';
export const P_WHITE       = 'FFFFFF';
export const P_GREY_LIGHT  = 'F7F7F7';
export const P_GREY_MID    = 'E2E8E6';
export const P_GREY_TEXT   = '6B7280';
export const P_BLACK       = '111827';

// RAG pill colours
export const RAG_RED    = 'DC2626';
export const RAG_AMBER  = 'D97706';
export const RAG_GREEN  = '059669';
export const RAG_RED_L  = 'FEE2E2';
export const RAG_AMB_L  = 'FEF3C7';
export const RAG_GRN_L  = 'D1FAE5';

const W = h.A4_CONTENT_WIDTH;  // 9026 DXA

// ─── RAG helpers ─────────────────────────────────────────────────────────────

export function ragColor(rating: string): string {
  const r = (rating || '').toUpperCase();
  if (r.includes('RED')   || r === 'HIGH'   || r.includes('NON-COMPLIANT') || r.includes('NOT APPROVED')) return RAG_RED;
  if (r.includes('AMBER') || r === 'MEDIUM' || r.includes('PARTIAL')       || r.includes('REQUIRES'))     return RAG_AMBER;
  if (r.includes('GREEN') || r === 'LOW'    || r.includes('COMPLIANT')     || r.includes('APPROVED'))      return RAG_GREEN;
  return P_GREY_TEXT;
}

export function ragLightColor(rating: string): string {
  const r = (rating || '').toUpperCase();
  if (r.includes('RED')   || r === 'HIGH')   return RAG_RED_L;
  if (r.includes('AMBER') || r === 'MEDIUM') return RAG_AMB_L;
  if (r.includes('GREEN') || r === 'LOW')    return RAG_GRN_L;
  return 'F3F4F6';
}

/** Inline RAG pill — returns a TableCell suitable for use in a row */
export function ragCell(rating: string, width: number): TableCell {
  const bg = ragLightColor(rating);
  const fg = ragColor(rating);
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    borders: h.CELL_BORDERS,
    margins: h.CELL_MARGINS_TIGHT,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: rating || '—', bold: true, size: 16, font: 'Arial', color: fg })],
    })],
  });
}

// ─── Section heading with coloured left border rule ──────────────────────────

export function sectionBand(text: string, accentHex: string = P_GREEN): Paragraph {
  return new Paragraph({
    spacing: { before: 340, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accentHex, space: 6 } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 22, font: 'Arial', color: P_DARK }),
    ],
  });
}

// ─── Cover page builder ──────────────────────────────────────────────────────

export interface CoverPageOpts {
  documentLabel: string;
  accentHex: string;
  documentRef?: string;
  projectName?: string;
  siteAddress?: string;
  preparedBy?: string;
  date?: string;
  reviewDate?: string;
  /** Extra key-value pairs for the cover page metadata table */
  extraFields?: Array<[string, string]>;
  /** Classification band text (e.g. 'COMMERCIAL IN CONFIDENCE') */
  classification?: string;
}

export function buildCoverPageChildren(opts: CoverPageOpts): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // ── Classification band ──────────────────────────────────────────────────
  if (opts.classification) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      shading: { type: ShadingType.CLEAR, fill: opts.accentHex },
      children: [new TextRun({
        text: `  ${opts.classification}  `,
        bold: true, size: 16, font: 'Arial', color: P_WHITE,
      })],
    }));
  }

  // ── Accent bar ───────────────────────────────────────────────────────────
  elements.push(new Paragraph({
    spacing: { before: 600, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 30, color: opts.accentHex } },
    children: [],
  }));

  // ── Document type label ──────────────────────────────────────────────────
  elements.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 40 },
    children: [new TextRun({
      text: opts.documentLabel.toUpperCase(),
      bold: true, size: 48, font: 'Arial', color: opts.accentHex,
    })],
  }));

  // ── Ebrora sub-label ─────────────────────────────────────────────────────
  elements.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 480 },
    children: [new TextRun({
      text: 'Generated by Ebrora  ·  ebrora.com',
      size: 16, font: 'Arial', color: P_GREY_TEXT,
    })],
  }));

  // ── Metadata info table ──────────────────────────────────────────────────
  const metaRows: Array<{ label: string; value: string }> = [];
  if (opts.documentRef)  metaRows.push({ label: 'Document Reference', value: opts.documentRef });
  if (opts.projectName)  metaRows.push({ label: 'Project Name',        value: opts.projectName });
  if (opts.siteAddress)  metaRows.push({ label: 'Site / Address',      value: opts.siteAddress });
  if (opts.preparedBy)   metaRows.push({ label: 'Prepared By',         value: opts.preparedBy });
  if (opts.date)         metaRows.push({ label: 'Date',                value: opts.date });
  if (opts.reviewDate)   metaRows.push({ label: 'Review Date',         value: opts.reviewDate });
  for (const [label, value] of (opts.extraFields ?? [])) {
    if (value) metaRows.push({ label, value });
  }
  if (metaRows.length > 0) {
    elements.push(h.infoTable(metaRows, W));
  }

  // ── Disclaimer ───────────────────────────────────────────────────────────
  elements.push(h.spacer(200));
  elements.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: P_GREY_MID } },
    children: [],
  }));
  elements.push(new Paragraph({
    spacing: { before: 80, after: 0 },
    children: [new TextRun({
      text: 'This document was generated by Ebrora AI. It is provided for guidance purposes. All content should be reviewed and validated by a competent person before use. Ebrora Limited accepts no liability for errors or omissions.',
      size: 14, font: 'Arial', color: P_GREY_TEXT, italics: true,
    })],
  }));

  return elements;
}

// ─── Document control box ────────────────────────────────────────────────────

export function documentControlTable(
  ref: string,
  revision: string,
  date: string,
  preparedBy: string,
  status: string
): Table {
  const col = Math.floor(W / 5);
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        h.headerCell('Doc Ref',    col, { fontSize: 14 }),
        h.headerCell('Rev',        col, { fontSize: 14 }),
        h.headerCell('Date',       col, { fontSize: 14 }),
        h.headerCell('Prepared By',col, { fontSize: 14 }),
        h.headerCell('Status',     col, { fontSize: 14 }),
      ]}),
      new TableRow({ children: [
        h.dataCell(ref,        col, { fontSize: 14 }),
        h.dataCell(revision,   col, { fontSize: 14 }),
        h.dataCell(date,       col, { fontSize: 14 }),
        h.dataCell(preparedBy, col, { fontSize: 14 }),
        h.dataCell(status,     col, { fontSize: 14 }),
      ]}),
    ],
  });
}

// ─── Generic prose section ───────────────────────────────────────────────────

export function proseSection(heading: string, text: string, accentHex = P_GREEN): Array<Paragraph | Table> {
  if (!text) return [];
  return [sectionBand(heading, accentHex), ...h.prose(text)];
}

// ─── Labelled info rows (2-col table) ────────────────────────────────────────

export function infoSection(
  heading: string,
  rows: Array<{ label: string; value: string }>,
  accentHex = P_GREEN
): Array<Paragraph | Table> {
  const filtered = rows.filter(r => r.value && r.value.trim());
  if (filtered.length === 0) return [];
  return [sectionBand(heading, accentHex), h.infoTable(filtered, W), h.spacer(80)];
}

// ─── Array-of-objects → data table ───────────────────────────────────────────

export function dataTableSection(
  heading: string,
  items: Record<string, any>[],
  columns: Array<{ key: string; label: string; width?: number }>,
  accentHex = P_GREEN
): Array<Paragraph | Table> {
  if (!items || items.length === 0) return [];

  const totalCols = columns.length;
  const defaultW = Math.floor(W / totalCols);
  const colWidths = columns.map(c => c.width ?? defaultW);
  // Adjust last column to fill any rounding gap
  const usedW = colWidths.reduce((s, w) => s + w, 0);
  if (usedW !== W) colWidths[colWidths.length - 1] += (W - usedW);

  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map((c, i) => h.headerCell(c.label, colWidths[i], { fontSize: 15 })),
  });

  const dataRows = items.map((item, rowIdx) =>
    new TableRow({
      children: columns.map((c, i) => {
        const val = item[c.key];
        const text = val === null || val === undefined ? '—' :
          typeof val === 'boolean' ? (val ? 'Yes' : 'No') :
          Array.isArray(val) ? val.join(', ') :
          String(val);
        // Apply RAG colouring on "rag", "rating", "status", "ragRating" keys
        const isRag = /rag|rating|status|compliance|impact/i.test(c.key);
        const fill = isRag ? ragLightColor(text) : (rowIdx % 2 === 0 ? P_GREY_LIGHT : P_WHITE);
        const textColor = isRag ? ragColor(text) : P_BLACK;
        return h.dataCell(text, colWidths[i], { fontSize: 14, fillColor: fill, color: textColor, bold: isRag });
      }),
    })
  );

  return [
    sectionBand(heading, accentHex),
    new Table({ width: { size: W, type: WidthType.DXA }, rows: [headerRow, ...dataRows] }),
    h.spacer(80),
  ];
}

// ─── Array-of-strings → bulleted list ────────────────────────────────────────

export function bulletListSection(
  heading: string,
  items: string[],
  accentHex = P_GREEN
): Array<Paragraph | Table> {
  if (!items || items.length === 0) return [];
  return [
    sectionBand(heading, accentHex),
    ...items.map(item => new Paragraph({
      spacing: { after: 60 },
      bullet: { level: 0 },
      children: [new TextRun({ text: item, size: 18, font: 'Arial' })],
    })),
    h.spacer(80),
  ];
}

// ─── Priority item with coloured label ───────────────────────────────────────

export function priorityItem(
  priority: string | number,
  heading: string,
  body: string,
  accentHex: string = P_GREEN
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  elements.push(new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({ text: `${priority}.  `, bold: true, size: 18, font: 'Arial', color: accentHex }),
      new TextRun({ text: heading, bold: true, size: 18, font: 'Arial', color: P_DARK }),
    ],
  }));
  if (body) {
    for (const para of h.prose(body)) elements.push(para);
  }
  return elements;
}

// ─── Signature block ─────────────────────────────────────────────────────────

export function signatureBlock(
  roles: Array<{ role: string; name: string }>,
  accentHex = P_GREEN
): Array<Paragraph | Table> {
  return [
    sectionBand('Document Sign-Off', accentHex),
    h.approvalTable(roles, W),
    h.spacer(120),
  ];
}

// ─── Master document builder ─────────────────────────────────────────────────

/**
 * Build a complete premium Document with cover page + sections.
 * Each section is an array of Paragraph | Table elements.
 * The first section is the cover page — subsequent sections are body pages.
 */
export function buildPremiumDocument(
  coverOpts: CoverPageOpts,
  bodySections: Array<Array<Paragraph | Table>>
): Document {
  const coverChildren = buildCoverPageChildren(coverOpts);

  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 18 } },
        heading1: { run: { font: 'Arial', size: 32, bold: true, color: P_DARK } },
        heading2: { run: { font: 'Arial', size: 26, bold: true, color: P_DARK } },
        heading3: { run: { font: 'Arial', size: 22, bold: true, color: P_DARK } },
      },
    },
    sections: [
      // Cover page
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader(coverOpts.documentLabel) },
        footers: { default: h.ebroraFooter() },
        children: coverChildren,
      },
      // Body sections — each gets its own section for clean page breaks
      ...bodySections.map(children => ({
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader(coverOpts.documentLabel) },
        footers: { default: h.ebroraFooter() },
        children,
      })),
    ],
  });
}
