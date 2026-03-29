// =============================================================================
// ITP — Excel (.xlsx) Generator
// Builds a professional Inspection & Test Plan workbook with:
//   Sheet 1: Main ITP (landscape A3)
//   Sheet 2: Checksheet — Pre-Works (portrait A4)
//   Sheet 3: Checksheet — During Works (portrait A4)
//   Sheet 4: Checksheet — Closeout / Review (portrait A4)
// =============================================================================
import * as ExcelJS from 'exceljs';

// ─── Types ───
interface ItpItem {
  op: string;
  operation: string;
  controlledBy: string;
  acceptRejectCriteria: string;
  frequency: string;
  specRef: string;
  records: string;
  subcontractor: string;
  contractor: string;
  client: string;
  designer: string;
  notes: string;
}

interface ItpData {
  projectName?: string;
  contractNo?: string;
  itpReference?: string;
  revision?: string;
  date?: string;
  generalTitle?: string;
  workBy?: string;
  drawingRefs?: string;
  preWorks: ItpItem[];
  duringWorks: ItpItem[];
  closeoutReview: ItpItem[];
}

// ─── Colour Palette ───
const DARK_NAVY = '1B2A4A';
const MID_BLUE = '2E5090';
const HEADER_BG = '3B5998';
const LIGHT_BLUE = 'D6E4F0';
const SECTION_BG = 'E8EDF3';
const WHITE = 'FFFFFF';
const LIGHT_GREY = 'F5F5F5';
const VERY_LIGHT = 'FAFBFC';
const MID_GREY = 'D9D9D9';
const LEGEND_BG = 'FFF8E1';
const RED_ACCENT = 'E74C3C';
const AMBER_ACCENT = 'F5A623';
const GREEN_ACCENT = '27AE60';

// ─── Reusable border objects ───
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: '999999' } },
  left: { style: 'thin', color: { argb: '999999' } },
  bottom: { style: 'thin', color: { argb: '999999' } },
  right: { style: 'thin', color: { argb: '999999' } },
};
const mediumBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: '333333' } },
  left: { style: 'medium', color: { argb: '333333' } },
  bottom: { style: 'medium', color: { argb: '333333' } },
  right: { style: 'medium', color: { argb: '333333' } },
};
const hairBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'hair', color: { argb: 'CCCCCC' } },
  left: { style: 'hair', color: { argb: 'CCCCCC' } },
  bottom: { style: 'hair', color: { argb: 'CCCCCC' } },
  right: { style: 'hair', color: { argb: 'CCCCCC' } },
};
const dottedBottom: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: '999999' } },
  left: { style: 'thin', color: { argb: '999999' } },
  bottom: { style: 'dotted', color: { argb: '999999' } },
  right: { style: 'thin', color: { argb: '999999' } },
};

// ─── Font helpers ───
const bodyFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 9, color: { argb: '333333' } };
const bodyBold: Partial<ExcelJS.Font> = { name: 'Arial', size: 9, bold: true, color: { argb: '333333' } };
const headerFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 9, bold: true, color: { argb: WHITE } };
const smallFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 8, color: { argb: '666666' } };

// ─── Fill helpers ───
const fill = (color: string): ExcelJS.Fill => ({
  type: 'pattern', pattern: 'solid', fgColor: { argb: color },
});

// ─── Code colour helper ───
function codeFont(code: string): Partial<ExcelJS.Font> {
  const c = code?.toUpperCase() || '';
  let color = DARK_NAVY;
  if (c === 'H') color = RED_ACCENT;
  else if (c === 'W') color = AMBER_ACCENT;
  else if (c === 'S' || c === 'I') color = GREEN_ACCENT;
  return { name: 'Arial', size: 10, bold: true, color: { argb: color } };
}

// ─── Style a cell ───
function styleCell(
  ws: ExcelJS.Worksheet, row: number, col: number, value: any,
  font: Partial<ExcelJS.Font> = bodyFont,
  fillColor?: string,
  alignment?: Partial<ExcelJS.Alignment>,
  border?: Partial<ExcelJS.Borders>,
) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = font;
  if (fillColor) cell.fill = fill(fillColor);
  cell.alignment = alignment || { horizontal: 'left', vertical: 'top', wrapText: true };
  cell.border = border || thinBorder;
}

// ─── Dynamic row height from text content ───
function calcRowHeight(texts: { value: string; colWidth: number }[], fontSize: number = 9, minHeight: number = 30): number {
  const lineHeight = fontSize + 5;
  let maxLines = 1;
  for (const { value, colWidth } of texts) {
    if (!value) continue;
    const charsPerLine = Math.max(Math.floor(colWidth * 1.27), 1);
    const paragraphs = String(value).split(/\n/);
    let lines = 0;
    for (const p of paragraphs) {
      lines += Math.max(Math.ceil(p.length / charsPerLine), 1);
    }
    if (lines > maxLines) maxLines = lines;
  }
  return Math.max(maxLines * lineHeight + 6, minHeight);
}

// ─── Section banner ───
function sectionBanner(ws: ExcelJS.Worksheet, row: number, text: string, colEnd: number = 14) {
  ws.mergeCells(row, 1, row, colEnd);
  for (let c = 1; c <= colEnd; c++) {
    const cell = ws.getCell(row, c);
    cell.fill = fill(MID_BLUE);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = mediumBorder;
  }
  ws.getCell(row, 1).value = text;
  ws.getRow(row).height = 22;
}

// ─── Write inspection items ───
function writeItems(ws: ExcelJS.Worksheet, items: ItpItem[], startRow: number): number {
  let r = startRow;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const altFill = i % 2 === 0 ? LIGHT_GREY : WHITE;
    ws.getRow(r).height = calcRowHeight([
      { value: item.operation, colWidth: 30 },
      { value: item.controlledBy, colWidth: 20 },
      { value: item.acceptRejectCriteria, colWidth: 22 },
      { value: item.specRef, colWidth: 22 },
      { value: item.records, colWidth: 20 },
      { value: item.notes, colWidth: 30 },
    ], 9, 30);

    styleCell(ws, r, 1, item.op, bodyBold, altFill, { horizontal: 'center', vertical: 'middle' });
    styleCell(ws, r, 2, item.operation, bodyFont, altFill);
    styleCell(ws, r, 3, item.controlledBy, bodyFont, altFill);
    styleCell(ws, r, 4, item.acceptRejectCriteria, bodyFont, altFill);
    styleCell(ws, r, 5, item.frequency, bodyFont, altFill);
    styleCell(ws, r, 6, item.specRef, bodyFont, altFill);
    styleCell(ws, r, 7, item.records, bodyFont, altFill);

    // Spacer col H
    ws.getCell(r, 8).border = {};

    // Responsibility codes
    const codes = [
      { col: 9, val: item.subcontractor },
      { col: 10, val: item.contractor },
      { col: 11, val: item.client },
      { col: 12, val: item.designer },
    ];
    for (const { col, val } of codes) {
      styleCell(ws, r, col, val, codeFont(val), altFill, { horizontal: 'center', vertical: 'middle' });
    }

    // Spacer col M
    ws.getCell(r, 13).border = {};

    styleCell(ws, r, 14, item.notes, smallFont, altFill);
    r++;
  }
  return r;
}

// ═══════════════════════════════════════════════════
// BUILD MAIN ITP SHEET
// ═══════════════════════════════════════════════════
function buildMainSheet(wb: ExcelJS.Workbook, data: ItpData) {
  const ws = wb.addWorksheet('ITP', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 8 as any, // A3 // A3
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
  });

  // Column widths
  const widths: Record<string, number> = {
    A: 6, B: 30, C: 20, D: 22, E: 16, F: 22, G: 20,
    H: 3, I: 10, J: 10, K: 10, L: 10, M: 3, N: 30,
  };
  Object.entries(widths).forEach(([letter, w]) => {
    ws.getColumn(letter).width = w;
  });

  // ── Row 1-2: Title Bar ──
  ws.mergeCells('A1:N1');
  for (let c = 1; c <= 14; c++) {
    ws.getCell(1, c).fill = fill(DARK_NAVY);
    ws.getCell(1, c).border = { top: { style: 'medium', color: { argb: DARK_NAVY } }, left: { style: 'medium', color: { argb: DARK_NAVY } }, right: { style: 'medium', color: { argb: DARK_NAVY } } };
  }
  ws.getCell('A1').value = 'INSPECTION & TEST PLAN';
  ws.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: WHITE } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 35;

  ws.mergeCells('A2:N2');
  for (let c = 1; c <= 14; c++) {
    ws.getCell(2, c).fill = fill(DARK_NAVY);
    ws.getCell(2, c).border = { bottom: { style: 'medium', color: { argb: DARK_NAVY } }, left: { style: 'medium', color: { argb: DARK_NAVY } }, right: { style: 'medium', color: { argb: DARK_NAVY } } };
  }
  ws.getCell('A2').value = 'Quality Assurance Document';
  ws.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'AABBDD' } };
  ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  // ── Rows 3-5: Project Info (A+B merged) ──
  const infoRows: { row: number; fields: [number, string, number, string][] }[] = [
    { row: 3, fields: [[1, 'Project:', 4, data.projectName || ''], [7, 'ITP Reference:', 9, data.itpReference || ''], [12, 'Revision:', 13, data.revision || '0']] },
    { row: 4, fields: [[1, 'General Title:', 4, data.generalTitle || ''], [7, 'Date:', 9, data.date || ''], [12, 'Page:', 13, '1 of 1']] },
    { row: 5, fields: [[1, 'Work By:', 4, data.workBy || ''], [7, 'Drawing Nos / Doc Refs:', 9, data.drawingRefs || '']] },
  ];

  for (const { row, fields } of infoRows) {
    // Merge A+B for rows 3, 4, 5
    ws.mergeCells(row, 1, row, 2);
    ws.getRow(row).height = 20;
    for (let c = 1; c <= 14; c++) {
      ws.getCell(row, c).fill = fill(VERY_LIGHT);
      ws.getCell(row, c).border = hairBorder;
    }
    for (const [lc, label, vc, val] of fields) {
      ws.getCell(row, lc).value = label;
      ws.getCell(row, lc).font = bodyBold;
      ws.getCell(row, lc).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      if (vc !== lc) {
        ws.getCell(row, vc).value = val;
        ws.getCell(row, vc).font = bodyFont;
        ws.getCell(row, vc).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    }
  }

  // ── Row 6: Legend header ──
  ws.mergeCells(6, 1, 6, 14);
  ws.getRow(6).height = 14;
  for (let c = 1; c <= 14; c++) {
    ws.getCell(6, c).fill = fill(MID_GREY);
    ws.getCell(6, c).border = thinBorder;
  }
  ws.getCell(6, 1).value = 'TEST & INSPECTION CODES';
  ws.getCell(6, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: DARK_NAVY } };
  ws.getCell(6, 1).alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Rows 7-12: Code legend (text only, no formulas) ──
  const codes = [
    ['S', 'Surveillance', 'Record as diary entry — no notification required'],
    ['I', 'Inspection', 'Work continues — signed record required'],
    ['W', 'Witness Point', 'Notification required — signed record if witnessed'],
    ['H', 'Hold Point', 'STOP work until inspected and released — signed record'],
    ['R', 'Records Review', 'Review of documentation/records — signed record per package'],
    ['O', 'Observation', 'Observation point — record sheet filled, no notification required'],
  ];

  for (let i = 0; i < codes.length; i++) {
    const r = 7 + i;
    ws.getRow(r).height = 16;
    for (let c = 1; c <= 14; c++) {
      ws.getCell(r, c).fill = fill(LEGEND_BG);
      ws.getCell(r, c).border = { top: { style: 'hair', color: { argb: 'DDDDDD' } }, left: { style: 'hair', color: { argb: 'DDDDDD' } }, bottom: { style: 'hair', color: { argb: 'DDDDDD' } }, right: { style: 'hair', color: { argb: 'DDDDDD' } } };
    }
    ws.getCell(r, 1).value = codes[i][0];
    ws.getCell(r, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: MID_BLUE } };
    ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(r, 2).value = `= ${codes[i][1]}`;
    ws.getCell(r, 2).font = { name: 'Arial', size: 8, bold: true, color: { argb: '555555' } };
    ws.getCell(r, 2).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(r, 4, r, 7);
    ws.getCell(r, 4).value = codes[i][2];
    ws.getCell(r, 4).font = smallFont;
    ws.getCell(r, 4).alignment = { horizontal: 'left', vertical: 'middle' };
  }

  // ── Spacer row 13 ──
  ws.getRow(13).height = 6;

  // ── Row 14: Column headers ──
  const hdrRow = 14;
  ws.getRow(hdrRow).height = 38;

  const mainHeaders: [number, string][] = [
    [1, 'Op.\nNo.'], [2, 'Operation to be Inspected or Tested'], [3, 'Controlled By\n(Position)'],
    [4, 'Accept / Reject\nCriteria'], [5, 'Frequency of\nInspection or Test'], [6, 'Spec. Ref / Procedure\nor Method Statement'],
    [7, 'Records as\nAccepted'],
  ];
  const respHeaders: [number, string][] = [
    [9, 'Sub-\ncontractor'], [10, 'Contractor'], [11, 'Client'], [12, 'Designer'],
  ];

  const hdrBorder: Partial<ExcelJS.Borders> = {
    left: { style: 'thin', color: { argb: WHITE } },
    right: { style: 'thin', color: { argb: WHITE } },
    top: { style: 'medium', color: { argb: '333333' } },
    bottom: { style: 'medium', color: { argb: '333333' } },
  };

  for (const [col, text] of mainHeaders) {
    styleCell(ws, hdrRow, col, text, headerFont, HEADER_BG, { horizontal: 'center', vertical: 'middle', wrapText: true }, hdrBorder);
  }
  ws.getCell(hdrRow, 8).border = {};
  for (const [col, text] of respHeaders) {
    styleCell(ws, hdrRow, col, text, headerFont, HEADER_BG, { horizontal: 'center', vertical: 'middle', wrapText: true }, hdrBorder);
  }
  ws.getCell(hdrRow, 13).border = {};
  styleCell(ws, hdrRow, 14, 'Notes / Comments', headerFont, HEADER_BG, { horizontal: 'center', vertical: 'middle', wrapText: true }, hdrBorder);

  // ── Data sections ──
  let currentRow = 15;

  // PRE-WORKS
  sectionBanner(ws, currentRow, 'PRE-WORKS');
  currentRow++;
  currentRow = writeItems(ws, data.preWorks, currentRow);

  // DURING WORKS
  sectionBanner(ws, currentRow, 'DURING WORKS');
  currentRow++;
  currentRow = writeItems(ws, data.duringWorks, currentRow);

  // CLOSEOUT / REVIEW
  sectionBanner(ws, currentRow, 'CLOSEOUT / REVIEW');
  currentRow++;
  currentRow = writeItems(ws, data.closeoutReview, currentRow);

  // ── Spacer ──
  currentRow++;

  // ── Sign-off block ──
  ws.mergeCells(currentRow, 1, currentRow, 14);
  for (let c = 1; c <= 14; c++) {
    ws.getCell(currentRow, c).fill = fill(DARK_NAVY);
    ws.getCell(currentRow, c).border = mediumBorder;
  }
  ws.getCell(currentRow, 1).value = 'APPROVAL & SIGN-OFF';
  ws.getCell(currentRow, 1).font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
  ws.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(currentRow).height = 20;
  currentRow++;

  // 3 sign-off labels
  const signoffLabels = ['Prepared By:', 'Checked By:', 'Approved By:'];
  for (let idx = 0; idx < 3; idx++) {
    const colStart = 1 + (idx * 5);
    ws.mergeCells(currentRow, colStart, currentRow, colStart + 4);
    ws.getCell(currentRow, colStart).value = signoffLabels[idx];
    ws.getCell(currentRow, colStart).font = { name: 'Arial', size: 9, bold: true, color: { argb: DARK_NAVY } };
    ws.getCell(currentRow, colStart).fill = fill(LIGHT_BLUE);
    ws.getCell(currentRow, colStart).alignment = { horizontal: 'left', vertical: 'middle' };
    for (let c = colStart; c <= colStart + 4; c++) ws.getCell(currentRow, c).border = thinBorder;
  }
  ws.getRow(currentRow).height = 16;
  currentRow++;

  const signoffFields = ['Signature:', 'Print Name:', 'Position:', 'Date:'];
  for (const field of signoffFields) {
    ws.getRow(currentRow).height = 22;
    for (let idx = 0; idx < 3; idx++) {
      const colStart = 1 + (idx * 5);
      ws.mergeCells(currentRow, colStart, currentRow, colStart + 1);
      ws.getCell(currentRow, colStart).value = field;
      ws.getCell(currentRow, colStart).font = smallFont;
      ws.getCell(currentRow, colStart).fill = fill(WHITE);
      ws.getCell(currentRow, colStart).alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell(currentRow, colStart).border = thinBorder;
      ws.getCell(currentRow, colStart + 1).border = thinBorder;

      ws.mergeCells(currentRow, colStart + 2, currentRow, colStart + 4);
      ws.getCell(currentRow, colStart + 2).value = '';
      ws.getCell(currentRow, colStart + 2).font = bodyFont;
      ws.getCell(currentRow, colStart + 2).fill = fill(WHITE);
      ws.getCell(currentRow, colStart + 2).border = dottedBottom;
      for (let c = colStart + 2; c <= colStart + 4; c++) ws.getCell(currentRow, c).border = dottedBottom;
    }
    currentRow++;
  }

  // ── Footer ──
  currentRow++;
  ws.mergeCells(currentRow, 1, currentRow, 14);
  ws.getCell(currentRow, 1).value = 'S = Surveillance  |  I = Inspection  |  W = Witness Point  |  H = Hold Point  |  R = Records Review  |  O = Observation';
  ws.getCell(currentRow, 1).font = { name: 'Arial', size: 7, italic: true, color: { argb: '888888' } };
  ws.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
}

// ═══════════════════════════════════════════════════
// BUILD CHECKSHEET
// ═══════════════════════════════════════════════════
function buildChecksheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  sectionTitle: string,
  items: ItpItem[],
) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: {
      orientation: 'portrait',
      paperSize: 9 as any, // A4 // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const csWidths: Record<string, number> = { A: 6, B: 30, C: 12, D: 12, E: 12, F: 12, G: 22 };
  Object.entries(csWidths).forEach(([letter, w]) => { ws.getColumn(letter).width = w; });

  // Title
  ws.mergeCells('A1:G1');
  for (let c = 1; c <= 7; c++) {
    ws.getCell(1, c).fill = fill(DARK_NAVY);
    ws.getCell(1, c).border = mediumBorder;
  }
  ws.getCell('A1').value = `CHECKSHEET — ${sectionTitle.toUpperCase()}`;
  ws.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: WHITE } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  // Project info rows 2-5 (A+B merged)
  const csInfoLabels: [number, number, string, number, string][] = [
    [2, 1, 'Project:', 5, 'Contract No:'],
    [3, 1, 'ITP Reference:', 5, 'Revision:'],
    [4, 1, 'Location:', 5, 'Area:'],
    [5, 1, 'Drawing Ref & Rev:', 5, 'RAMS (No. & Rev):'],
  ];

  for (const [row, lc1, label1, lc2, label2] of csInfoLabels) {
    ws.mergeCells(row, 1, row, 2);
    ws.getRow(row).height = 18;
    for (let c = 1; c <= 7; c++) {
      ws.getCell(row, c).fill = fill(VERY_LIGHT);
      ws.getCell(row, c).border = hairBorder;
    }
    ws.getCell(row, lc1).value = label1;
    ws.getCell(row, lc1).font = bodyBold;
    ws.getCell(row, lc1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    ws.getCell(row, lc2).value = label2;
    ws.getCell(row, lc2).font = bodyBold;
    ws.getCell(row, lc2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  }

  // Spacer row 6
  ws.getRow(6).height = 6;

  // Column headers row 7
  ws.getRow(7).height = 28;
  const csHeaders: [number, string][] = [
    [1, 'Op.\nNo.'], [2, 'Inspection Item'], [3, 'Sub-\ncontractor'],
    [4, 'Contractor'], [5, 'Client'], [6, 'Designer'], [7, 'Comments / Result'],
  ];
  const csHdrBorder: Partial<ExcelJS.Borders> = {
    left: { style: 'thin', color: { argb: WHITE } },
    right: { style: 'thin', color: { argb: WHITE } },
    top: { style: 'medium', color: { argb: '333333' } },
    bottom: { style: 'medium', color: { argb: '333333' } },
  };
  for (const [col, text] of csHeaders) {
    styleCell(ws, 7, col, text, headerFont, HEADER_BG, { horizontal: 'center', vertical: 'middle', wrapText: true }, csHdrBorder);
  }

  // Operation rows
  let r = 8;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const altFill = i % 2 === 0 ? LIGHT_GREY : WHITE;
    ws.getRow(r).height = calcRowHeight([
      { value: item.operation, colWidth: 30 },
    ], 9, 24);
    styleCell(ws, r, 1, item.op, bodyBold, altFill, { horizontal: 'center', vertical: 'middle' });
    styleCell(ws, r, 2, item.operation, bodyFont, altFill);
    for (let c = 3; c <= 6; c++) {
      styleCell(ws, r, c, '', bodyFont, altFill, { horizontal: 'center', vertical: 'middle' }, dottedBottom);
    }
    styleCell(ws, r, 7, '', bodyFont, altFill);
    r++;
  }

  // NCR section
  r++;
  ws.mergeCells(r, 1, r, 7);
  ws.getRow(r).height = 18;
  ws.getCell(r, 1).value = 'ACTIONS TO CORRECT NONCONFORMANCES:';
  ws.getCell(r, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: DARK_NAVY } };
  ws.getCell(r, 1).fill = fill(SECTION_BG);
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle' };
  for (let c = 1; c <= 7; c++) ws.getCell(r, c).border = thinBorder;
  r++;

  for (let line = 0; line < 3; line++) {
    ws.mergeCells(r, 1, r, 7);
    ws.getRow(r).height = 22;
    ws.getCell(r, 1).value = '';
    ws.getCell(r, 1).font = bodyFont;
    ws.getCell(r, 1).fill = fill(WHITE);
    for (let c = 1; c <= 7; c++) ws.getCell(r, c).border = dottedBottom;
    r++;
  }

  // Acceptance statement
  r++;
  ws.mergeCells(r, 1, r, 7);
  ws.getRow(r).height = 16;
  ws.getCell(r, 1).value = 'ACCEPTANCE FOLLOWING WORK COMPLETION:';
  ws.getCell(r, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: DARK_NAVY } };
  ws.getCell(r, 1).fill = fill(SECTION_BG);
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle' };
  for (let c = 1; c <= 7; c++) ws.getCell(r, c).border = thinBorder;
  r++;

  ws.mergeCells(r, 1, r, 7);
  ws.getCell(r, 1).value = 'All nonconformances have been identified by NCRs and those necessary have been rectified satisfactorily. All snagging items have been resolved or adequately recorded.';
  ws.getCell(r, 1).font = { name: 'Arial', size: 8, italic: true, color: { argb: '555555' } };
  ws.getCell(r, 1).fill = fill(WHITE);
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  for (let c = 1; c <= 7; c++) ws.getCell(r, c).border = thinBorder;
  ws.getRow(r).height = 28;
  r += 2;

  // Sign-off: Contractor / Client
  ws.mergeCells(r, 1, r, 3);
  ws.getCell(r, 1).value = 'Contractor:';
  ws.getCell(r, 1).font = bodyBold;
  ws.getCell(r, 1).fill = fill(LIGHT_BLUE);
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle' };
  for (let c = 1; c <= 3; c++) ws.getCell(r, c).border = thinBorder;

  ws.mergeCells(r, 5, r, 7);
  ws.getCell(r, 5).value = 'Client:';
  ws.getCell(r, 5).font = bodyBold;
  ws.getCell(r, 5).fill = fill(LIGHT_BLUE);
  ws.getCell(r, 5).alignment = { horizontal: 'left', vertical: 'middle' };
  for (let c = 5; c <= 7; c++) ws.getCell(r, c).border = thinBorder;
  ws.getRow(r).height = 16;
  r++;

  for (const fieldLabel of ['Sign:', 'Name:', 'Date:']) {
    ws.getRow(r).height = 20;
    styleCell(ws, r, 1, fieldLabel, smallFont, WHITE, { horizontal: 'left', vertical: 'middle' });
    ws.mergeCells(r, 2, r, 3);
    ws.getCell(r, 2).value = '';
    ws.getCell(r, 2).font = bodyFont;
    ws.getCell(r, 2).fill = fill(WHITE);
    ws.getCell(r, 2).border = dottedBottom;
    ws.getCell(r, 3).border = dottedBottom;

    styleCell(ws, r, 5, fieldLabel, smallFont, WHITE, { horizontal: 'left', vertical: 'middle' });
    ws.mergeCells(r, 6, r, 7);
    ws.getCell(r, 6).value = '';
    ws.getCell(r, 6).font = bodyFont;
    ws.getCell(r, 6).fill = fill(WHITE);
    ws.getCell(r, 6).border = dottedBottom;
    ws.getCell(r, 7).border = dottedBottom;
    r++;
  }

  // Footer legend
  r++;
  ws.mergeCells(r, 1, r, 7);
  ws.getCell(r, 1).value = 'S = Surveillance  |  I = Inspection  |  W = Witness Point  |  H = Hold Point  |  R = Records Review  |  O = Observation';
  ws.getCell(r, 1).font = { name: 'Arial', size: 7, italic: true, color: { argb: '888888' } };
  ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
}

// ═══════════════════════════════════════════════════
// Enforcement: pad sections to minimum row counts
// ═══════════════════════════════════════════════════
const MIN_PRE_WORKS = 6;
const MIN_DURING_WORKS = 10;
const MIN_CLOSEOUT = 6;

function padToMinimum(items: ItpItem[], minimum: number, prefix: string): ItpItem[] {
  if (items.length >= minimum) return items;
  const padded = [...items];
  const startIdx = items.length;
  for (let i = startIdx; i < minimum; i++) {
    const opNum = `${prefix}.${i}`;
    padded.push({
      op: opNum,
      operation: '',
      controlledBy: '',
      acceptRejectCriteria: '',
      frequency: '',
      specRef: '',
      records: '',
      subcontractor: '',
      contractor: '',
      client: '',
      designer: '',
      notes: '',
    });
  }
  return padded;
}

// ═══════════════════════════════════════════════════
// PUBLIC: Generate ITP Excel Buffer
// ═══════════════════════════════════════════════════
export async function generateItpXlsx(content: ItpData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ebrora';
  wb.created = new Date();

  // Ensure arrays exist and enforce minimums
  const data: ItpData = {
    ...content,
    preWorks: padToMinimum(content.preWorks || [], MIN_PRE_WORKS, '1'),
    duringWorks: padToMinimum(content.duringWorks || [], MIN_DURING_WORKS, '2'),
    closeoutReview: padToMinimum(content.closeoutReview || [], MIN_CLOSEOUT, '3'),
  };

  // Build sheets
  buildMainSheet(wb, data);
  buildChecksheet(wb, 'CS — Pre-Works', 'Pre-Works', data.preWorks);
  buildChecksheet(wb, 'CS — During Works', 'During Works', data.duringWorks);
  buildChecksheet(wb, 'CS — Closeout', 'Closeout / Review', data.closeoutReview);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
