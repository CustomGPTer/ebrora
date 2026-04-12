// =============================================================================
// RAMS Builder — Shared docx-js Helpers
// =============================================================================
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageBreak, PageNumber, SectionType,
} from 'docx';

// ---------------------------------------------------------------------------
// Brand Constants
// ---------------------------------------------------------------------------
export const EBRORA_GREEN = '1B5745';
export const EBRORA_GREEN_LIGHT = 'E8F0EC';
export const EBRORA_GREEN_MID = 'C2D9CB';
export const WHITE = 'FFFFFF';
export const BLACK = '000000';
export const GREY_LIGHT = 'F5F5F5';
export const GREY_MID = 'E0E0E0';
export const GREY_DARK = '666666';

// CDM blue accents (Template 04)
export const CDM_BLUE = '1B4F72';
export const CDM_BLUE_LIGHT = 'D6EAF8';

// PC navy accents (Template 06)
export const PC_NAVY = '1B2A4A';
export const PC_NAVY_LIGHT = 'D5DAE5';

// RPN purple accents (Template 08)
export const RPN_PURPLE = '4A1B6D';
export const RPN_PURPLE_LIGHT = 'E8D5F5';

// Checklist teal accents (Template 09)
export const CHECKLIST_TEAL = '0E6655';
export const CHECKLIST_TEAL_LIGHT = 'D1F2EB';

// Step-by-step blue accents (Template 10)
export const STEP_BLUE = '154360';
export const STEP_BLUE_LIGHT = 'D4E6F1';

// RPN risk bands
export const RPN_RED = 'E74C3C';
export const RPN_AMBER = 'F39C12';
export const RPN_YELLOW = 'F7DC6F';
export const RPN_GREEN_BAND = '27AE60';

// HML colours
export const HML_HIGH = 'E74C3C';
export const HML_MEDIUM = 'F39C12';
export const HML_LOW = '27AE60';

// ---------------------------------------------------------------------------
// Page dimensions (A4, DXA units: 1440 = 1 inch, 567 = 1 cm)
// ---------------------------------------------------------------------------
export const A4_WIDTH = 11906;
export const A4_HEIGHT = 16838;
export const MARGIN_NORMAL = 1440;      // 1 inch / 2.54 cm
export const MARGIN_NARROW = 1134;      // ~2 cm
export const MARGIN_LANDSCAPE = 1134;

export const A4_CONTENT_WIDTH = A4_WIDTH - (2 * MARGIN_NORMAL);           // 9026
export const A4_CONTENT_WIDTH_NARROW = A4_WIDTH - (2 * MARGIN_NARROW);    // 9638
export const A4_LANDSCAPE_CONTENT_WIDTH = A4_HEIGHT - (2 * MARGIN_LANDSCAPE); // 14570

// ---------------------------------------------------------------------------
// Standard cell borders
// ---------------------------------------------------------------------------
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: GREY_MID };
export const CELL_BORDERS = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};
export const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left: { style: BorderStyle.NONE, size: 0, color: WHITE },
  right: { style: BorderStyle.NONE, size: 0, color: WHITE },
};

/**
 * Suppress default table-level borders (auto-colored black lines).
 * Cell-level borders from headerCell/dataCell are unaffected.
 */
export const NO_TABLE_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left: { style: BorderStyle.NONE, size: 0, color: WHITE },
  right: { style: BorderStyle.NONE, size: 0, color: WHITE },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: WHITE },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: WHITE },
};

// ---------------------------------------------------------------------------
// Standard cell margins
// ---------------------------------------------------------------------------
export const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };
export const CELL_MARGINS_TIGHT = { top: 40, bottom: 40, left: 80, right: 80 };

// ---------------------------------------------------------------------------
// Paragraph helpers
// ---------------------------------------------------------------------------

/** Blank spacer paragraph */
export function spacer(size = 120): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

/** Bold heading paragraph (not a Word heading level — just styled text) */
export function sectionHeading(text: string, fontSize = 24, color = EBRORA_GREEN): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: fontSize, font: 'Arial', color }),
    ],
  });
}

/** Sub-heading */
export function subHeading(text: string, fontSize = 20, color = BLACK): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: fontSize, font: 'Arial', color }),
    ],
  });
}

/** Normal body paragraph */
export function bodyText(text: string, fontSize = 18, opts?: { bold?: boolean; italic?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        size: fontSize,
        font: 'Arial',
        bold: opts?.bold,
        italics: opts?.italic,
        color: opts?.color,
      }),
    ],
  });
}

/** Multi-run paragraph */
export function multiRunParagraph(runs: Array<{ text: string; bold?: boolean; italic?: boolean; color?: string; size?: number }>, spacing?: { before?: number; after?: number }): Paragraph {
  return new Paragraph({
    spacing: { before: spacing?.before ?? 0, after: spacing?.after ?? 80 },
    children: runs.map(r => new TextRun({
      text: r.text,
      size: r.size ?? 18,
      font: 'Arial',
      bold: r.bold,
      italics: r.italic,
      color: r.color ?? BLACK,
    })),
  });
}

// ---------------------------------------------------------------------------
// Table cell helpers
// ---------------------------------------------------------------------------

/** Header cell (green background, white bold text) */
export function headerCell(
  text: string,
  width: number,
  opts?: {
    color?: string;
    fillColor?: string;
    fontSize?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    rowSpan?: number;
    columnSpan?: number;
  }
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts?.fillColor ?? EBRORA_GREEN, type: ShadingType.CLEAR },
    borders: CELL_BORDERS,
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    rowSpan: opts?.rowSpan,
    columnSpan: opts?.columnSpan,
    children: [
      new Paragraph({
        alignment: opts?.alignment ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            size: opts?.fontSize ?? 18,
            font: 'Arial',
            color: opts?.color ?? WHITE,
          }),
        ],
      }),
    ],
  });
}

/** Data cell (white/light background, normal text) */
export function dataCell(
  text: string,
  width: number,
  opts?: {
    fillColor?: string;
    fontSize?: number;
    bold?: boolean;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    rowSpan?: number;
    columnSpan?: number;
    color?: string;
  }
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts?.fillColor ?? WHITE, type: ShadingType.CLEAR },
    borders: CELL_BORDERS,
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    rowSpan: opts?.rowSpan,
    columnSpan: opts?.columnSpan,
    children: [
      new Paragraph({
        alignment: opts?.alignment ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: opts?.fontSize ?? 18,
            font: 'Arial',
            bold: opts?.bold,
            color: opts?.color ?? BLACK,
          }),
        ],
      }),
    ],
  });
}

/** Empty data cell (for user to fill in) */
export function emptyCell(width: number, opts?: { fillColor?: string; rowSpan?: number; columnSpan?: number }): TableCell {
  return dataCell('', width, opts);
}

/** Multi-paragraph cell (for long content that needs line breaks) */
export function multiParagraphCell(
  paragraphs: string[],
  width: number,
  opts?: { fillColor?: string; fontSize?: number; bold?: boolean }
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts?.fillColor ?? WHITE, type: ShadingType.CLEAR },
    borders: CELL_BORDERS,
    margins: CELL_MARGINS,
    children: paragraphs.map(p => new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: p, size: opts?.fontSize ?? 18, font: 'Arial', bold: opts?.bold })],
    })),
  });
}

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

/** Build a simple key-value info table (label | value pairs) */
export function infoTable(
  rows: Array<{ label: string; value: string }>,
  totalWidth: number,
  labelWidth?: number
): Table {
  const lw = labelWidth ?? Math.round(totalWidth * 0.35);
  const vw = totalWidth - lw;
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({
      children: [
        headerCell(r.label, lw, { fontSize: 16 }),
        dataCell(r.value, vw, { fontSize: 16 }),
      ],
    })),
  });
}

/** Build a multi-column info table (e.g. 4-column grid) */
export function gridInfoTable(
  rows: Array<Array<{ label?: string; value: string; isHeader?: boolean }>>,
  columnWidths: number[],
  totalWidth: number
): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: rows.map(row => new TableRow({
      children: row.map((cell, i) =>
        cell.isHeader
          ? headerCell(cell.value, columnWidths[i], { fontSize: 16 })
          : dataCell(cell.value, columnWidths[i], { fontSize: 16 })
      ),
    })),
  });
}

/** Build approval table (Prepared By / Reviewed By / Approved By rows) */
export function approvalTable(
  roles: Array<{ role: string; name: string }>,
  totalWidth: number
): Table {
  const col1 = Math.round(totalWidth * 0.2);
  const col2 = Math.round(totalWidth * 0.3);
  const col3 = Math.round(totalWidth * 0.25);
  const col4 = totalWidth - col1 - col2 - col3;

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [col1, col2, col3, col4],
    rows: [
      new TableRow({
        children: [
          headerCell('Role', col1, { fontSize: 16 }),
          headerCell('Name', col2, { fontSize: 16 }),
          headerCell('Signature', col3, { fontSize: 16 }),
          headerCell('Date', col4, { fontSize: 16 }),
        ],
      }),
      ...roles.map(r => new TableRow({
        children: [
          dataCell(r.role, col1, { fontSize: 16, bold: true }),
          dataCell(r.name, col2, { fontSize: 16 }),
          emptyCell(col3),
          emptyCell(col4),
        ],
      })),
    ],
  });
}

/** Build briefing record table */
export function briefingRecordTable(
  rowCount: number,
  totalWidth: number,
  extraColumns?: Array<{ header: string; width: number }>
): Table {
  const baseColumns = [
    { header: 'No.', width: 500 },
    { header: 'Print Name', width: 0 }, // auto-calculated
    { header: 'Company', width: 1500 },
    { header: 'Signature', width: 1800 },
    { header: 'Date', width: 1200 },
  ];
  const extra = extraColumns ?? [];
  const fixedWidth = baseColumns.reduce((sum, c) => sum + c.width, 0) + extra.reduce((sum, c) => sum + c.width, 0);
  baseColumns[1].width = totalWidth - fixedWidth; // name gets remaining space

  const allColumns = [...baseColumns.slice(0, 3), ...extra, ...baseColumns.slice(3)];
  const widths = allColumns.map(c => c.width);

  const headerRow = new TableRow({
    children: allColumns.map((c, i) => headerCell(c.header, widths[i], { fontSize: 14 })),
  });

  const dataRows = Array.from({ length: rowCount }, (_, idx) =>
    new TableRow({
      children: allColumns.map((c, i) =>
        i === 0
          ? dataCell(String(idx + 1), widths[i], { fontSize: 14, alignment: AlignmentType.CENTER })
          : emptyCell(widths[i])
      ),
    })
  );

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// Risk rating helpers
// ---------------------------------------------------------------------------

/** Get fill colour for H/M/L text rating */
export function hmlColor(rating: string): string {
  const r = rating.toLowerCase();
  if (r === 'high' || r === 'h') return HML_HIGH;
  if (r === 'medium' || r === 'med' || r === 'm') return HML_AMBER;
  return HML_LOW;
}
const HML_AMBER = 'F39C12';

/** Get fill colour for L×S numerical rating */
export function lxsColor(score: number): string {
  if (score >= 15) return HML_HIGH;
  if (score >= 8) return HML_AMBER;
  if (score >= 4) return 'F7DC6F';
  return HML_LOW;
}

/** Get fill colour for RPN score */
export function rpnColor(score: number): string {
  if (score >= 76) return RPN_RED;
  if (score >= 36) return RPN_AMBER;
  if (score >= 13) return RPN_YELLOW;
  return RPN_GREEN_BAND;
}

// ---------------------------------------------------------------------------
// 5×5 Risk Matrix builder (used by templates 1, 3, 4, 6, 8, 9)
// ---------------------------------------------------------------------------
export function riskMatrix5x5(totalWidth: number): Table {
  const cellW = Math.floor(totalWidth / 6);
  const labelW = totalWidth - (5 * cellW);

  const matrixData = [
    [5, 10, 15, 20, 25],
    [4,  8, 12, 16, 20],
    [3,  6,  9, 12, 15],
    [2,  4,  6,  8, 10],
    [1,  2,  3,  4,  5],
  ];
  const likelihoodLabels = ['5 – Almost Certain', '4 – Likely', '3 – Possible', '2 – Unlikely', '1 – Rare'];

  const headerRow = new TableRow({
    children: [
      headerCell('Likelihood ↓ / Severity →', labelW, { fontSize: 16 }),
      ...[1, 2, 3, 4, 5].map(s =>
        headerCell(String(s), cellW, { fontSize: 18, alignment: AlignmentType.CENTER })
      ),
    ],
  });

  const dataRows = matrixData.map((row, rIdx) =>
    new TableRow({
      children: [
        dataCell(likelihoodLabels[rIdx], labelW, { fontSize: 16, bold: true, fillColor: EBRORA_GREEN_LIGHT }),
        ...row.map(val =>
          dataCell(String(val), cellW, {
            fontSize: 18,
            bold: true,
            alignment: AlignmentType.CENTER,
            fillColor: lxsColor(val),
            color: val >= 8 ? WHITE : BLACK,
          })
        ),
      ],
    })
  );

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [labelW, ...Array(5).fill(cellW)],
    rows: [headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// HML Risk Key builder (used by templates 2, 5, 7, 10)
// ---------------------------------------------------------------------------
export function hmlRiskKey(totalWidth: number): Table {
  const col1 = Math.round(totalWidth * 0.2);
  const col2 = totalWidth - col1;

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [col1, col2],
    rows: [
      new TableRow({
        children: [
          headerCell('Rating', col1, { fontSize: 16 }),
          headerCell('Description', col2, { fontSize: 16 }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('High', col1, { bold: true, fillColor: HML_HIGH, color: WHITE, alignment: AlignmentType.CENTER }),
          dataCell('Significant risk — additional controls required before work can proceed. Senior management review may be needed.', col2, { fontSize: 16 }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Medium', col1, { bold: true, fillColor: HML_AMBER, color: WHITE, alignment: AlignmentType.CENTER }),
          dataCell('Moderate risk — proceed with caution, ensure controls are in place and monitored. Supervisor oversight required.', col2, { fontSize: 16 }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Low', col1, { bold: true, fillColor: HML_LOW, color: WHITE, alignment: AlignmentType.CENTER }),
          dataCell('Acceptable risk — standard controls adequate. Routine monitoring sufficient.', col2, { fontSize: 16 }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Section builders (portrait sections used across templates)
// ---------------------------------------------------------------------------

/** Standard Ebrora header for all pages. Pass label to customise, e.g. 'COSHH Assessment'. Defaults to generic branding. */
export function ebroraHeader(label?: string): Header {
  const suffix = label ? `  |  ${label}` : '';
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: EBRORA_GREEN, space: 1 } },
        spacing: { after: 0 },
        children: [
          new TextRun({ text: 'EBRORA', bold: true, size: 16, font: 'Arial', color: EBRORA_GREEN }),
          ...(suffix ? [new TextRun({ text: suffix, size: 16, font: 'Arial', color: GREY_DARK })] : []),
        ],
      }),
    ],
  });
}

/** Standard Ebrora footer with page numbers */
export function ebroraFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREY_MID, space: 1 } },
        spacing: { before: 0 },
        children: [
          new TextRun({ text: 'Generated by Ebrora  |  www.ebrora.com  |  Page ', size: 14, font: 'Arial', color: GREY_DARK }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, font: 'Arial', color: GREY_DARK }),
        ],
      }),
    ],
  });
}

/** Split long text into separate paragraphs. Splits on double newlines first, then single newlines. */
export function prose(text: string, fontSize = 18): Paragraph[] {
  if (!text || !text.trim()) return [bodyText('Not specified.', fontSize)];
  // First split on double newlines (intentional paragraph breaks)
  const blocks = text.split(/\n\n+/).filter(Boolean);
  const result: Paragraph[] = [];
  for (const block of blocks) {
    // Within each block, also split on single newlines
    const lines = block.split(/\n/).filter(Boolean);
    for (const line of lines) {
      result.push(bodyText(line.trim(), fontSize));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Section property presets
// ---------------------------------------------------------------------------

/** Portrait A4 with normal margins */
export const PORTRAIT_SECTION = {
  page: {
    size: { width: A4_WIDTH, height: A4_HEIGHT },
    margin: { top: MARGIN_NORMAL, right: MARGIN_NORMAL, bottom: MARGIN_NORMAL, left: MARGIN_NORMAL },
  },
};

/** Landscape A4 with narrow margins */
export const LANDSCAPE_SECTION = {
  page: {
    size: {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      orientation: PageOrientation.LANDSCAPE,
    },
    margin: { top: MARGIN_LANDSCAPE, right: MARGIN_LANDSCAPE, bottom: MARGIN_LANDSCAPE, left: MARGIN_LANDSCAPE },
  },
};

// ---------------------------------------------------------------------------
// Document packer
// ---------------------------------------------------------------------------
export async function packDocument(doc: Document): Promise<Buffer> {
  return await Packer.toBuffer(doc);
}

// ---------------------------------------------------------------------------
// richBodyText: Smart text parser for method statement sections
// Converts AI-generated text into proper paragraphs, numbered lists, bullets
// Use: ...h.richBodyText(content.sequenceOfWorks)  (spread into children[])
// ---------------------------------------------------------------------------

/**
 * Parse a text block into proper Word paragraphs.
 * Splits on double newlines, numbered patterns (1. 2. 3.), and bullets (- / •).
 * Returns an array — spread it into the section children.
 */
export function richBodyText(
  text: string,
  fontSize = 18,
  opts?: { bold?: boolean; italic?: boolean; color?: string }
): Paragraph[] {
  if (!text || !text.trim()) {
    return [new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '[No content provided]', size: fontSize, font: 'Arial', italics: true, color: '999999' })],
    })];
  }

  const paragraphs: Paragraph[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split(/\n/);

    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) continue;

      // FIRST: Check for inline numbered items crammed into one line ("1. ... 2. ... 3. ...")
      // This must run BEFORE the single numbered match, otherwise "1. A 2. B 3. C" gets
      // treated as a single item "1. A 2. B 3. C"
      const inlineMatches = [...lineTrimmed.matchAll(/(?:^|\s)(\d+)\.\s/g)];
      if (inlineMatches.length >= 2) {
        const items = lineTrimmed.split(/(?=(?:^|\s)\d+\.\s)/);
        for (const item of items) {
          const t = item.trim();
          if (!t) continue;
          const m = t.match(/^(\d+)\.\s+(.+)/);
          if (m) {
            paragraphs.push(new Paragraph({
              spacing: { before: 80, after: 80 },
              indent: { left: 360, hanging: 360 },
              children: [
                new TextRun({ text: `${m[1]}. `, size: fontSize, font: 'Arial', bold: true, color: opts?.color ?? BLACK }),
                new TextRun({ text: m[2], size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK }),
              ],
            }));
          } else {
            paragraphs.push(new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: t, size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK })],
            }));
          }
        }
        continue;
      }

      // Single numbered item on its own line: "1. ", "2. ", "10. "
      const numberedMatch = lineTrimmed.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        paragraphs.push(new Paragraph({
          spacing: { before: 80, after: 80 },
          indent: { left: 360, hanging: 360 },
          children: [
            new TextRun({ text: `${numberedMatch[1]}. `, size: fontSize, font: 'Arial', bold: true, color: opts?.color ?? BLACK }),
            new TextRun({ text: numberedMatch[2], size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK }),
          ],
        }));
        continue;
      }

      // Bullet item: "- ", "• ", "* "
      const bulletMatch = lineTrimmed.match(/^[-•*]\s+(.+)/);
      if (bulletMatch) {
        paragraphs.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 720, hanging: 360 },
          children: [
            new TextRun({ text: '•  ', size: fontSize, font: 'Arial', color: opts?.color ?? BLACK }),
            new TextRun({ text: bulletMatch[1], size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK }),
          ],
        }));
        continue;
      }

      // Lettered sub-item: "a) ", "b) "
      const letteredMatch = lineTrimmed.match(/^([a-z])\)\s+(.+)/);
      if (letteredMatch) {
        paragraphs.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 1080, hanging: 360 },
          children: [
            new TextRun({ text: `${letteredMatch[1]})  `, size: fontSize, font: 'Arial', bold: true, color: opts?.color ?? BLACK }),
            new TextRun({ text: letteredMatch[2], size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK }),
          ],
        }));
        continue;
      }

      // Plain paragraph
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: lineTrimmed, size: fontSize, font: 'Arial', bold: opts?.bold, italics: opts?.italic, color: opts?.color ?? BLACK })],
      }));
    }
  }

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: '[No content provided]', size: fontSize, font: 'Arial', italics: true, color: '999999' })],
  })];
}

// =============================================================================
// PARAMETERISED ACCENT-COLOUR HELPERS
// Used by multi-template rebuilds. Existing functions above are untouched.
// =============================================================================

// ---------------------------------------------------------------------------
// Accent Header — page header using the template's accent colour
// ---------------------------------------------------------------------------
export function accentHeader(title: string, accent: string): Header {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 1 } },
        spacing: { after: 0 },
        children: [
          new TextRun({ text: title, bold: true, size: 16, font: 'Arial', color: accent }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Accent Footer — doc ref left, page number right, accent top border
// ---------------------------------------------------------------------------
export function accentFooter(docRef: string, templateName: string, accent: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: accent, space: 1 } },
        spacing: { before: 0 },
        tabStops: [{ type: 'right' as any, position: A4_CONTENT_WIDTH }],
        children: [
          new TextRun({ text: `${docRef} · ${templateName}`, size: 14, font: 'Arial', color: GREY_DARK }),
          new TextRun({ text: '\t', size: 14, font: 'Arial' }),
          new TextRun({ text: 'Page ', size: 14, font: 'Arial', color: GREY_DARK }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, font: 'Arial', color: GREY_DARK }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Full-Width Section Bar — coloured background spanning margin to margin
// Uses a single-cell borderless table with shading for reliable full-width fill
// ---------------------------------------------------------------------------
export function fullWidthSectionBar(num: string, title: string, accent: string): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [A4_CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: accent, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 60, bottom: 60, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `${num}   ${title.toUpperCase()}`,
                    bold: true,
                    size: 22,
                    font: 'Arial',
                    color: WHITE,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Cover Block — full-width accent banner for cover page
// Simulates the HTML gradient cover block as a solid accent band
// ---------------------------------------------------------------------------
export function coverBlock(
  titleLines: string[],
  subtitle: string,
  accent: string,
  subtitleColor: string
): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [A4_CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: accent, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 600, bottom: 400, left: 300, right: 300 },
            children: [
              ...titleLines.map(line =>
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: line.toUpperCase(),
                      bold: true,
                      size: 52,
                      font: 'Arial',
                      color: WHITE,
                    }),
                  ],
                })
              ),
              new Paragraph({
                spacing: { before: 120, after: 0 },
                children: [
                  new TextRun({
                    text: subtitle,
                    size: 22,
                    font: 'Arial',
                    color: subtitleColor,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Project Name Bar — centred accent band with project name
// ---------------------------------------------------------------------------
export function projectNameBar(text: string, accent: string): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [A4_CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: accent, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: text.toUpperCase(),
                    bold: true,
                    size: 26,
                    font: 'Arial',
                    color: WHITE,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Cover Info Table — label/value pairs with accent-coloured labels
// ---------------------------------------------------------------------------
export function coverInfoTable(
  rows: Array<{ label: string; value: string }>,
  accent: string,
  totalWidth: number
): Table {
  const lw = Math.round(totalWidth * 0.32);
  const vw = totalWidth - lw;
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [lw, vw],
    rows: rows.map(r =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: lw, type: WidthType.DXA },
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            borders,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: r.label, bold: true, size: 18, font: 'Arial', color: accent }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: vw, type: WidthType.DXA },
            borders,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: r.value || '\u2014', size: 18, font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      })
    ),
  });
}

// ---------------------------------------------------------------------------
// Signature Grid — 2×2 box layout with role, Name, Signature, Date lines
// ---------------------------------------------------------------------------
export function signatureGrid(roles: string[], accent: string, totalWidth: number): Table {
  const cellW = Math.floor(totalWidth / 2);
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const sigLine = (label: string) => new Paragraph({
    spacing: { after: 20 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 4 } },
    children: [new TextRun({ text: `${label}:`, size: 16, font: 'Arial', color: GREY_DARK })],
  });

  const buildCell = (role: string): TableCell =>
    new TableCell({
      width: { size: cellW, type: WidthType.DXA },
      borders,
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: role.toUpperCase(), bold: true, size: 18, font: 'Arial', color: accent }),
          ],
        }),
        sigLine('Name'),
        sigLine('Signature'),
        sigLine('Date'),
      ],
    });

  // Pad to even number
  const padded = [...roles];
  if (padded.length % 2 !== 0) padded.push('');

  const rows: TableRow[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    rows.push(
      new TableRow({
        children: [
          buildCell(padded[i]),
          padded[i + 1] ? buildCell(padded[i + 1]) : new TableCell({
            width: { size: cellW, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ children: [] })],
          }),
        ],
      })
    );
  }

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [cellW, cellW],
    rows,
  });
}

// ---------------------------------------------------------------------------
// Callout Box — left-bordered box with shaded background
// ---------------------------------------------------------------------------
export function calloutBox(
  text: string,
  borderColor: string,
  bgColor: string,
  textColor: string,
  totalWidth: number,
  opts?: { boldPrefix?: string }
): Table {
  const border = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const leftBorder = { style: BorderStyle.SINGLE, size: 24, color: borderColor };
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [totalWidth],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: totalWidth, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            borders: { top: border, bottom: border, right: border, left: leftBorder },
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  ...(opts?.boldPrefix
                    ? [new TextRun({ text: `${opts.boldPrefix} `, bold: true, size: 18, font: 'Arial', color: textColor })]
                    : []),
                  new TextRun({ text: text, size: 18, font: 'Arial', color: textColor }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// KPI Dashboard — row of KPI metric boxes (for tools that need them)
// ---------------------------------------------------------------------------
export function kpiDashboard(
  items: Array<{ value: string; label: string }>,
  accent: string,
  totalWidth: number
): Table {
  const cellW = Math.floor(totalWidth / items.length);
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const borders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: items.map(() => cellW),
    rows: [
      new TableRow({
        children: items.map(item =>
          new TableCell({
            width: { size: cellW, type: WidthType.DXA },
            borders,
            margins: { top: 120, bottom: 120, left: 80, right: 80 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: item.value, bold: true, size: 44, font: 'Arial', color: accent }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: item.label.toUpperCase(),
                    size: 14,
                    font: 'Arial',
                    color: GREY_DARK,
                    bold: true,
                  }),
                ],
              }),
            ],
          })
        ),
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Warning Banner — full-width accent warning bar
// ---------------------------------------------------------------------------
export function warningBanner(text: string, bg: string, colour: string, totalWidth: number): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [totalWidth],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: totalWidth, type: WidthType.DXA },
            shading: { fill: bg, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: `\u26A0  ${text}  \u26A0`, bold: true, size: 28, font: 'Arial', color: colour }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Stop Condition Line — red X with shaded background
// ---------------------------------------------------------------------------
export function stopConditionLine(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    shading: { type: ShadingType.CLEAR, fill: 'FEF2F2' },
    indent: { left: 240 },
    children: [
      new TextRun({ text: `\u2717  ${text}`, bold: true, size: 18, font: 'Arial', color: '991B1B' }),
    ],
  });
}

// ---------------------------------------------------------------------------
// End Mark — "— End of Document —" + Ebrora branding
// ---------------------------------------------------------------------------
export function endMark(accent: string): Paragraph[] {
  return [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: GREY_MID, space: 8 } },
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 40 },
      children: [
        new TextRun({ text: '\u2014 End of Document \u2014', size: 18, font: 'Arial', color: GREY_DARK, italics: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: 16, font: 'Arial', color: accent, bold: true }),
      ],
    }),
  ];
}

// ---------------------------------------------------------------------------
// Cover Footer — small italic grey "Generated by Ebrora" at bottom of cover
// ---------------------------------------------------------------------------
export function coverFooterLine(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 0 },
    children: [
      new TextRun({ text: 'Generated by Ebrora \u2014 www.ebrora.com', size: 16, font: 'Arial', color: '9CA3AF', italics: true }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Phase Band — full-width tinted bar for phase headings (task-specific templates)
// ---------------------------------------------------------------------------
export function phaseBand(text: string, accent: string): Table {
  return new Table({
    borders: NO_TABLE_BORDERS,
    width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [A4_CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: A4_CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: accent, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 60, bottom: 60, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: text.toUpperCase(), bold: true, size: 20, font: 'Arial', color: WHITE }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
