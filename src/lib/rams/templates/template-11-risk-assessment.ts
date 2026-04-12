// =============================================================================
// Template 11 — Risk Assessment Only (Standalone)
// 3 sections: Portrait cover → Landscape RA → Portrait supporting info
// =============================================================================
import {
  Document, Table, TableRow, TableCell, Paragraph, TextRun,
  AlignmentType, WidthType, ShadingType, VerticalAlign,
} from 'docx';
import { Template11Content, HazardRow_RA } from '../types';
import * as h from '../docx-helpers';

// ---------------------------------------------------------------------------
// Accent colours — Ebrora green palette with risk band colours
// ---------------------------------------------------------------------------
const ACCENT = h.EBRORA_GREEN;
const ACCENT_LIGHT = h.EBRORA_GREEN_LIGHT;
const ACCENT_MID = h.EBRORA_GREEN_MID;

// Risk band colours (consistent with existing helpers)
const BAND_CRITICAL = 'C0392B';    // Deep red
const BAND_CRITICAL_BG = 'FADBD8'; // Light red bg
const BAND_HIGH = 'E67E22';        // Orange
const BAND_HIGH_BG = 'FDEBD0';     // Light orange bg
const BAND_MEDIUM = 'F1C40F';      // Yellow
const BAND_MEDIUM_BG = 'FEF9E7';   // Light yellow bg
const BAND_LOW = '27AE60';         // Green
const BAND_LOW_BG = 'D5F5E3';      // Light green bg

// Matrix cell colours
const MATRIX_GREEN = '27AE60';
const MATRIX_YELLOW = 'F7DC6F';
const MATRIX_AMBER = 'F39C12';
const MATRIX_RED = 'E74C3C';
const MATRIX_DARK_RED = 'C0392B';

export async function buildTemplate11(content: Template11Content): Promise<Document> {
  return new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 18 } } },
    },
    sections: [
      // =====================================================================
      // SECTION 1 — Portrait Cover Page
      // =====================================================================
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('Risk Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Cover banner
          h.coverBlock(
            ['RISK ASSESSMENT'],
            content.projectName || 'Project Risk Assessment',
            ACCENT,
            ACCENT_MID,
          ),
          h.spacer(300),

          // Project info table
          h.coverInfoTable([
            { label: 'Project Name', value: content.projectName },
            { label: 'Site Address', value: content.siteAddress },
            { label: 'Client', value: content.clientName },
            { label: 'Principal Contractor', value: content.principalContractor || content.contractorName },
            { label: 'Contractor', value: content.contractorName },
            { label: 'Work Location', value: content.workLocation },
          ], ACCENT, h.A4_CONTENT_WIDTH),

          h.spacer(200),

          // Document details
          h.coverInfoTable([
            { label: 'Document Ref', value: content.documentRef },
            { label: 'Date of Assessment', value: content.dateOfAssessment },
            { label: 'Review Date', value: content.reviewDate },
          ], ACCENT, h.A4_CONTENT_WIDTH),

          h.spacer(300),

          // Scope of Assessment
          h.fullWidthSectionBar('1', 'Scope of Assessment', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.scopeOfAssessment),

          h.spacer(200),

          // Task Description
          h.fullWidthSectionBar('2', 'Task Description', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.taskDescription),

          h.spacer(200),

          // Assessment Methodology
          h.fullWidthSectionBar('3', 'Assessment Methodology', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.assessmentMethodology),

          h.spacer(200),

          // Legislative References
          h.fullWidthSectionBar('4', 'Legislative References', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.legislativeReferences),

          h.spacer(300),

          // Approval
          h.fullWidthSectionBar('5', 'Approval & Sign-Off', ACCENT),
          h.spacer(80),
          h.signatureGrid(
            ['Prepared By', 'Reviewed By', 'Approved By', 'H&S Advisor'],
            ACCENT,
            h.A4_CONTENT_WIDTH,
          ),

          h.spacer(200),
          h.coverFooterLine(),
        ],
      },

      // =====================================================================
      // SECTION 2 — Landscape Risk Assessment
      // =====================================================================
      {
        properties: { ...h.LANDSCAPE_SECTION },
        headers: { default: h.ebroraHeader('Risk Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          h.sectionHeading('Risk Assessment', 28),
          h.spacer(80),

          // Enhanced 5×5 risk matrix with full descriptors
          buildEnhancedRiskMatrix(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(100),

          // Action bands legend
          buildActionBandsLegend(h.A4_LANDSCAPE_CONTENT_WIDTH),
          h.spacer(200),

          // 15-column hazard table
          h.sectionHeading('Hazard Register', 24),
          h.spacer(80),
          buildHazardTable(content, h.A4_LANDSCAPE_CONTENT_WIDTH),

          h.spacer(300),

          // Risk Action Summary
          h.sectionHeading('Risk Action Summary', 24),
          h.spacer(80),
          buildRiskActionSummary(content, h.A4_LANDSCAPE_CONTENT_WIDTH),
        ],
      },

      // =====================================================================
      // SECTION 3 — Portrait Supporting Information
      // =====================================================================
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('Risk Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          h.fullWidthSectionBar('6', 'Monitoring & Review Arrangements', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.monitoringArrangements),

          h.spacer(200),

          h.fullWidthSectionBar('7', 'Competency & Training Requirements', ACCENT),
          h.spacer(80),
          ...h.richBodyText(content.competencyRequirements),

          h.spacer(300),

          // End mark
          ...h.endMark(ACCENT),
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Enhanced 5×5 Risk Matrix with full descriptors
// ---------------------------------------------------------------------------
function buildEnhancedRiskMatrix(totalWidth: number): Table {
  const likelihoodDescriptors = [
    { score: '5', label: 'Almost Certain', desc: 'Expected to occur in most circumstances' },
    { score: '4', label: 'Likely', desc: 'Will probably occur frequently' },
    { score: '3', label: 'Possible', desc: 'Could occur at some time' },
    { score: '2', label: 'Unlikely', desc: 'Not expected but possible' },
    { score: '1', label: 'Rare', desc: 'May occur in exceptional circumstances' },
  ];

  const severityHeaders = [
    { score: '1', label: 'Negligible', desc: 'Minor injury, first aid' },
    { score: '2', label: 'Minor', desc: 'Lost time < 7 days' },
    { score: '3', label: 'Moderate', desc: 'RIDDOR reportable, > 7 days' },
    { score: '4', label: 'Major', desc: 'Permanent disability, major injury' },
    { score: '5', label: 'Catastrophic', desc: 'Fatality or multiple casualties' },
  ];

  const matrixData = [
    [5, 10, 15, 20, 25],
    [4,  8, 12, 16, 20],
    [3,  6,  9, 12, 15],
    [2,  4,  6,  8, 10],
    [1,  2,  3,  4,  5],
  ];

  // Column widths: likelihood label column + 5 severity columns
  const labelColW = Math.round(totalWidth * 0.25);
  const cellW = Math.floor((totalWidth - labelColW) / 5);
  const lastCellW = totalWidth - labelColW - (4 * cellW);
  const severityCols = [cellW, cellW, cellW, cellW, lastCellW];

  // Title row
  const titleRow = new TableRow({
    children: [
      h.headerCell('LIKELIHOOD ↓ / SEVERITY →', labelColW, {
        fontSize: 16, fillColor: ACCENT,
      }),
      ...severityHeaders.map((s, i) =>
        new TableCell({
          width: { size: severityCols[i], type: WidthType.DXA },
          shading: { fill: ACCENT, type: ShadingType.CLEAR },
          borders: h.CELL_BORDERS,
          margins: h.CELL_MARGINS_TIGHT,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: `${s.score} — ${s.label}`, bold: true, size: 20, font: 'Arial', color: h.WHITE }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: s.desc, size: 16, font: 'Arial', color: ACCENT_MID, italics: true }),
              ],
            }),
          ],
        })
      ),
    ],
  });

  // Matrix rows
  const matrixRows = matrixData.map((row, rIdx) => {
    const ld = likelihoodDescriptors[rIdx];
    return new TableRow({
      children: [
        // Likelihood label cell
        new TableCell({
          width: { size: labelColW, type: WidthType.DXA },
          shading: { fill: ACCENT_LIGHT, type: ShadingType.CLEAR },
          borders: h.CELL_BORDERS,
          margins: h.CELL_MARGINS_TIGHT,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: `${ld.score} — ${ld.label}`, bold: true, size: 20, font: 'Arial', color: ACCENT }),
              ],
            }),
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: ld.desc, size: 16, font: 'Arial', color: h.GREY_DARK, italics: true }),
              ],
            }),
          ],
        }),
        // Score cells
        ...row.map((val, cIdx) => {
          const fill = getMatrixCellColor(val);
          const textColor = val >= 8 ? h.WHITE : h.BLACK;
          return new TableCell({
            width: { size: severityCols[cIdx], type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR },
            borders: h.CELL_BORDERS,
            margins: h.CELL_MARGINS_TIGHT,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: String(val), bold: true, size: 28, font: 'Arial', color: textColor }),
                ],
              }),
            ],
          });
        }),
      ],
    });
  });

  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: [labelColW, ...severityCols],
    rows: [titleRow, ...matrixRows],
  });
}

// ---------------------------------------------------------------------------
// Action Bands Legend (horizontal strip below matrix)
// ---------------------------------------------------------------------------
function buildActionBandsLegend(totalWidth: number): Table {
  const bands = [
    { range: '15–25', label: 'CRITICAL', color: BAND_CRITICAL, bg: BAND_CRITICAL_BG, text: 'Stop work. Immediate senior management review. Do not proceed until risk is reduced.' },
    { range: '8–14', label: 'HIGH', color: BAND_HIGH, bg: BAND_HIGH_BG, text: 'Additional controls required before work starts. Supervisor sign-off mandatory.' },
    { range: '4–7', label: 'MEDIUM', color: BAND_MEDIUM, bg: BAND_MEDIUM_BG, text: 'Proceed with caution. Ensure controls in place and monitored. Review periodically.' },
    { range: '1–3', label: 'LOW', color: BAND_LOW, bg: BAND_LOW_BG, text: 'Acceptable. Standard controls adequate. Routine monitoring sufficient.' },
  ];

  const colW = Math.floor(totalWidth / 4);
  const lastColW = totalWidth - (3 * colW);
  const widths = [colW, colW, colW, lastColW];

  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: bands.map((band, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.DXA },
            shading: { fill: band.bg, type: ShadingType.CLEAR },
            borders: h.CELL_BORDERS,
            margins: h.CELL_MARGINS_TIGHT,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: `${band.label} (${band.range})`, bold: true, size: 18, font: 'Arial', color: band.color }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: band.text, size: 16, font: 'Arial', color: h.BLACK }),
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
// 15-Column Hazard Table
// ---------------------------------------------------------------------------
function buildHazardTable(content: Template11Content, totalWidth: number): Table {
  // Column width ratios for 15 columns on landscape A4
  const cols = {
    ref:           400,
    activity:      Math.round(totalWidth * 0.080),
    hazard:        Math.round(totalWidth * 0.105),
    consequence:   Math.round(totalWidth * 0.090),
    who:           Math.round(totalWidth * 0.065),
    existing:      Math.round(totalWidth * 0.135),
    li:            380,
    si:            380,
    rri:           420,
    additional:    Math.round(totalWidth * 0.145),
    lr:            380,
    sr:            380,
    rrr:           420,
    owner:         Math.round(totalWidth * 0.060),
    review:        0, // gets remainder
  };
  const used = Object.values(cols).reduce((a, b) => a + b, 0);
  cols.review = totalWidth - used;
  const colWidths = Object.values(cols);

  const fs = 18; // Font size in half-points (18 = 9pt)

  // Header row 1 — main headers
  const headerRow = new TableRow({
    children: [
      h.headerCell('Ref', colWidths[0], { fontSize: fs }),
      h.headerCell('Activity / Task', colWidths[1], { fontSize: fs }),
      h.headerCell('Hazard', colWidths[2], { fontSize: fs }),
      h.headerCell('Consequence', colWidths[3], { fontSize: fs }),
      h.headerCell('Who at Risk', colWidths[4], { fontSize: fs }),
      h.headerCell('Existing Controls', colWidths[5], { fontSize: fs }),
      h.headerCell('L', colWidths[6], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('S', colWidths[7], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('Initial Risk', colWidths[8], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('Additional Control Measures', colWidths[9], { fontSize: fs }),
      h.headerCell('L', colWidths[10], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('S', colWidths[11], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('Residual Risk', colWidths[12], { fontSize: fs, alignment: AlignmentType.CENTER }),
      h.headerCell('Risk Owner', colWidths[13], { fontSize: fs }),
      h.headerCell('Review', colWidths[14], { fontSize: fs, alignment: AlignmentType.CENTER }),
    ],
  });

  // Sub-header row — Initial / Residual grouping labels
  const subHeaderRow = new TableRow({
    children: [
      h.headerCell('', colWidths[0], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[1], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[2], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[3], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[4], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[5], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('INITIAL RISK', colWidths[6] + colWidths[7] + colWidths[8], { fillColor: BAND_HIGH_BG, color: BAND_HIGH, fontSize: fs, alignment: AlignmentType.CENTER, columnSpan: 3 }),
      h.headerCell('', colWidths[9], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('RESIDUAL RISK', colWidths[10] + colWidths[11] + colWidths[12], { fillColor: BAND_LOW_BG, color: BAND_LOW, fontSize: fs, alignment: AlignmentType.CENTER, columnSpan: 3 }),
      h.headerCell('', colWidths[13], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
      h.headerCell('', colWidths[14], { fillColor: ACCENT_MID, color: ACCENT, fontSize: fs }),
    ],
  });

  // Data rows
  const dataRows = (content.hazards || []).map((hz: HazardRow_RA, idx: number) => {
    const initScore = hz.likelihoodInitial * hz.severityInitial;
    const resScore = hz.likelihoodResidual * hz.severityResidual;
    const stripe = idx % 2 === 1 ? 'F9FAFB' : h.WHITE;

    return new TableRow({
      children: [
        h.dataCell(hz.ref || String(idx + 1), colWidths[0], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe, bold: true }),
        h.dataCell(hz.activity || '', colWidths[1], { fontSize: fs, fillColor: stripe }),
        h.dataCell(hz.hazard, colWidths[2], { fontSize: fs, fillColor: stripe }),
        h.dataCell(hz.consequence || '', colWidths[3], { fontSize: fs, fillColor: stripe }),
        h.dataCell(hz.whoAtRisk, colWidths[4], { fontSize: fs, fillColor: stripe }),
        h.dataCell(hz.existingControls || '', colWidths[5], { fontSize: fs, fillColor: stripe }),
        h.dataCell(String(hz.likelihoodInitial), colWidths[6], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe, bold: true }),
        h.dataCell(String(hz.severityInitial), colWidths[7], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe, bold: true }),
        h.dataCell(String(initScore), colWidths[8], {
          fontSize: fs,
          alignment: AlignmentType.CENTER,
          bold: true,
          fillColor: getMatrixCellColor(initScore),
          color: initScore >= 8 ? h.WHITE : h.BLACK,
        }),
        h.dataCell(hz.additionalControlMeasures || '', colWidths[9], { fontSize: fs, fillColor: stripe }),
        h.dataCell(String(hz.likelihoodResidual), colWidths[10], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe, bold: true }),
        h.dataCell(String(hz.severityResidual), colWidths[11], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe, bold: true }),
        h.dataCell(String(resScore), colWidths[12], {
          fontSize: fs,
          alignment: AlignmentType.CENTER,
          bold: true,
          fillColor: getMatrixCellColor(resScore),
          color: resScore >= 8 ? h.WHITE : h.BLACK,
        }),
        h.dataCell(hz.riskOwner || '', colWidths[13], { fontSize: fs, fillColor: stripe }),
        h.dataCell(hz.reviewStatus || 'Pending', colWidths[14], { fontSize: fs, alignment: AlignmentType.CENTER, fillColor: stripe }),
      ],
    });
  });

  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [subHeaderRow, headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// Risk Action Summary table
// ---------------------------------------------------------------------------
function buildRiskActionSummary(content: Template11Content, totalWidth: number): Table {
  const bandColors: Record<string, { fill: string; text: string; bg: string }> = {
    'Critical (15-25)': { fill: BAND_CRITICAL, text: h.WHITE, bg: BAND_CRITICAL_BG },
    'High (8-14)': { fill: BAND_HIGH, text: h.WHITE, bg: BAND_HIGH_BG },
    'Medium (4-7)': { fill: BAND_MEDIUM, text: h.BLACK, bg: BAND_MEDIUM_BG },
    'Low (1-3)': { fill: BAND_LOW, text: h.WHITE, bg: BAND_LOW_BG },
  };

  const col1 = Math.round(totalWidth * 0.18);
  const col2 = Math.round(totalWidth * 0.10);
  const col3 = totalWidth - col1 - col2;
  const colWidths = [col1, col2, col3];

  const headerRow = new TableRow({
    children: [
      h.headerCell('Risk Band', col1, { fontSize: 18 }),
      h.headerCell('Count', col2, { fontSize: 18, alignment: AlignmentType.CENTER }),
      h.headerCell('Required Action', col3, { fontSize: 18 }),
    ],
  });

  const actionRows = (content.riskActionSummary || []).map((item) => {
    const bc = bandColors[item.band] || { fill: h.GREY_LIGHT, text: h.BLACK, bg: h.GREY_LIGHT };
    return new TableRow({
      children: [
        h.dataCell(item.band, col1, { fontSize: 18, bold: true, fillColor: bc.fill, color: bc.text }),
        h.dataCell(String(item.count ?? 0), col2, { fontSize: 20, bold: true, alignment: AlignmentType.CENTER, fillColor: bc.bg }),
        h.dataCell(item.action || '', col3, { fontSize: 18, fillColor: bc.bg }),
      ],
    });
  });

  return new Table({
    borders: h.NO_TABLE_BORDERS,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...actionRows],
  });
}

// ---------------------------------------------------------------------------
// Utility: get matrix cell fill colour for a given L×S score
// ---------------------------------------------------------------------------
function getMatrixCellColor(score: number): string {
  if (score >= 15) return MATRIX_DARK_RED;
  if (score >= 8) return MATRIX_AMBER;
  if (score >= 4) return MATRIX_YELLOW;
  return MATRIX_GREEN;
}
