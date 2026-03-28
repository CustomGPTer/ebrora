// =============================================================================
// COSHH Assessment — Single Product Template  (v2 — Industry-Leading)
// Professional, branded layout — identical design for every assessment.
// One product per document. AI fills in SDS data from its knowledge.
//
// v2 changes:
//   1. Two sections only (cover + continuous body) — no forced page breaks
//   2. Premium cover page with full-width colour band
//   3. Left-border section headings (matches premium template engine)
//   4. GHS hazard pictogram pill badges in Product Identification table
//   5. 5×5 risk matrix below Risk Rating Summary
//   6. Consistent alternating row shading on all data tables
//   7. Numbered sections (1.0, 2.0 …)
//   8. Regulatory references in a proper table
//   9. Unified green sub-headings (no more purple)
//  10. Body text bumped to 10pt for print legibility
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

// ── Palette ──────────────────────────────────────────────────────────────────
const COSHH_RED       = 'C0392B';
const COSHH_AMBER     = 'E67E22';
const COSHH_GREEN     = '27AE60';
const ACCENT_DARK     = '143D2B';   // dark green for cover band
const GHS_RED         = 'D32F2F';
const GHS_RED_LIGHT   = 'FFEBEE';

// ── Body text size (10pt = 20 half-points) ───────────────────────────────────
const BODY = 20;
const SMALL = 16;

// ── Risk helpers ─────────────────────────────────────────────────────────────
function riskColour(risk: string): { fill: string; text: string } {
  const r = (risk || '').toLowerCase();
  if (r === 'high')   return { fill: COSHH_RED,   text: h.WHITE };
  if (r === 'medium') return { fill: COSHH_AMBER,  text: h.WHITE };
  return { fill: COSHH_GREEN, text: h.WHITE };
}

function riskCell(risk: string, width: number): TableCell {
  const c = riskColour(risk);
  return h.dataCell(risk, width, {
    fillColor: c.fill, color: c.text, bold: true,
    alignment: AlignmentType.CENTER, fontSize: BODY,
  });
}

// ── Section heading with thick left-border rule (numbered) ───────────────────
function coshhSection(num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: h.EBRORA_GREEN, space: 6 } },
    children: [
      new TextRun({
        text: `${num}   ${text.toUpperCase()}`,
        bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN,
      }),
    ],
  });
}

// ── Sub-heading (green, smaller — unified colour) ────────────────────────────
function coshhSub(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: BODY, font: 'Arial', color: h.EBRORA_GREEN }),
    ],
  });
}

// ── GHS pictogram pill badges ────────────────────────────────────────────────
function ghsPills(codes: string, width: number): TableCell {
  const pills = (codes || '').split(/[,;]\s*/).filter(Boolean);
  if (pills.length === 0) {
    return h.dataCell('\u2014', width, { fontSize: SMALL });
  }
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: h.WHITE, type: ShadingType.CLEAR },
    borders: h.CELL_BORDERS,
    margins: h.CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: pills.flatMap((code, i) => {
          const runs: TextRun[] = [];
          if (i > 0) runs.push(new TextRun({ text: '  ', size: SMALL, font: 'Arial' }));
          // red diamond-style pill
          runs.push(new TextRun({
            text: ` ${code.trim().toUpperCase()} `,
            bold: true, size: SMALL, font: 'Arial',
            color: GHS_RED,
            shading: { type: ShadingType.CLEAR, fill: GHS_RED_LIGHT, color: GHS_RED_LIGHT },
          }));
          return runs;
        }),
      }),
    ],
  });
}

// ── GHS pills for odd-row background ─────────────────────────────────────────
function ghsPillsZebra(codes: string, width: number, bg: string): TableCell {
  const pills = (codes || '').split(/[,;]\s*/).filter(Boolean);
  if (pills.length === 0) {
    return h.dataCell('\u2014', width, { fontSize: SMALL, fillColor: bg });
  }
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    borders: h.CELL_BORDERS,
    margins: h.CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: pills.flatMap((code, i) => {
          const runs: TextRun[] = [];
          if (i > 0) runs.push(new TextRun({ text: '  ', size: SMALL, font: 'Arial' }));
          runs.push(new TextRun({
            text: ` ${code.trim().toUpperCase()} `,
            bold: true, size: SMALL, font: 'Arial',
            color: GHS_RED,
            shading: { type: ShadingType.CLEAR, fill: GHS_RED_LIGHT, color: GHS_RED_LIGHT },
          }));
          return runs;
        }),
      }),
    ],
  });
}

// ── Zebra-striped data table row helper ──────────────────────────────────────
function zebraRow(
  label: string, value: string, labelW: number, valueW: number, idx: number,
  opts?: { valueCell?: TableCell }
): TableRow {
  const bg = idx % 2 === 1 ? h.GREY_LIGHT : h.WHITE;
  return new TableRow({
    children: [
      h.dataCell(label, labelW, { bold: true, fontSize: SMALL, fillColor: bg }),
      opts?.valueCell
        ?? h.dataCell(value, valueW, { fontSize: SMALL, fillColor: bg }),
    ],
  });
}

// ── Interface ────────────────────────────────────────────────────────────────
interface CoshhContent {
  documentRef: string;
  assessmentDate: string;
  reviewDate: string;
  assessedBy: string;
  projectName: string;
  siteAddress: string;
  productName: string;
  manufacturer: string;
  productDescription: string;
  activityDescription: string;
  hazardClassification: string;
  signalWord: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
  exposureRoutes: string;
  healthEffects: string;
  workplaceExposureLimit: string;
  controlMeasures: string;
  ppeRequired: {
    respiratory: string;
    hands: string;
    eyes: string;
    body: string;
    feet: string;
  };
  storageRequirements: string;
  spillProcedure: string;
  firstAid: {
    inhalation: string;
    skinContact: string;
    eyeContact: string;
    ingestion: string;
  };
  disposalMethod: string;
  monitoringRequired: string;
  healthSurveillance: string;
  riskRating: {
    initial: string;
    residual: string;
  };
  emergencyProcedures: string;
  trainingRequirements: string;
  additionalNotes: string;
}

// =============================================================================
// Build the document
// =============================================================================
export async function buildCoshhDocument(content: CoshhContent): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  const ppe = content.ppeRequired || {} as any;
  const firstAid = content.firstAid || {} as any;
  const risk = content.riskRating || {} as any;

  // ── Regulatory references data ──
  const regRefs = [
    { ref: 'COSHH 2002',     desc: 'Control of Substances Hazardous to Health Regulations 2002 (as amended)' },
    { ref: 'EH40/2005',      desc: 'Workplace Exposure Limits (4th Edition, 2020)' },
    { ref: 'CLP Regulation', desc: 'Classification, Labelling and Packaging (EC) No 1272/2008' },
    { ref: 'HSG97',          desc: 'HSE COSHH Essentials' },
    { ref: 'L5 ACoP',        desc: 'General COSHH Approved Code of Practice' },
    { ref: 'SDS',            desc: 'Manufacturer Safety Data Sheet' },
  ];
  const refColW = Math.round(W * 0.22);
  const descColW = W - refColW;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 1 — COVER PAGE
      // ═══════════════════════════════════════════════════════════════════════
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Full-width dark green accent band
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK },
            spacing: { before: 0, after: 0 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 40 },
            children: [
              new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: 48, font: 'Arial', color: h.EBRORA_GREEN }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'Control of Substances Hazardous to Health Regulations 2002',
                size: BODY, font: 'Arial', color: h.GREY_DARK,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COSHH_RED } },
            children: [],
          }),

          // Product name — full-width green banner
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: h.EBRORA_GREEN },
            spacing: { before: 40, after: 140 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `  ${(content.productName || 'PRODUCT').toUpperCase()}  `,
                bold: true, size: 32, font: 'Arial', color: h.WHITE,
              }),
            ],
          }),

          // ── Project Information ──
          h.sectionHeading('Project Information', 24),
          h.infoTable([
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address',  value: content.siteAddress || '' },
          ], W),
          h.spacer(60),

          // ── Document Control ──
          h.sectionHeading('Document Control', 24),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Assessment Date',    value: content.assessmentDate || '' },
            { label: 'Review Date',        value: content.reviewDate || '' },
            { label: 'Assessed By',        value: content.assessedBy || '' },
          ], W),
          h.spacer(60),

          // ── Product Identification (with GHS pills) ──
          h.sectionHeading('Product Identification', 24),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [labelW, valueW],
            rows: [
              zebraRow('Product Name',            content.productName || '',        labelW, valueW, 0),
              zebraRow('Manufacturer / Supplier',  content.manufacturer || '',       labelW, valueW, 1),
              zebraRow('Product Description',      content.productDescription || '', labelW, valueW, 2),
              zebraRow('Hazard Classification',    '',                               labelW, valueW, 3,
                { valueCell: ghsPillsZebra(content.hazardClassification, valueW, h.GREY_LIGHT) }),
              zebraRow('Signal Word',              content.signalWord || '',         labelW, valueW, 4),
            ],
          }),
          h.spacer(60),

          // ── Risk Rating Summary ──
          h.sectionHeading('Risk Rating Summary', 24),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [Math.round(W * 0.5), Math.round(W * 0.5)],
            rows: [
              new TableRow({ children: [
                h.headerCell('Initial Risk (before controls)', Math.round(W * 0.5), { fontSize: SMALL, alignment: AlignmentType.CENTER }),
                h.headerCell('Residual Risk (after controls)',  Math.round(W * 0.5), { fontSize: SMALL, alignment: AlignmentType.CENTER }),
              ] }),
              new TableRow({ children: [
                riskCell(risk.initial || 'High',   Math.round(W * 0.5)),
                riskCell(risk.residual || 'Low',   Math.round(W * 0.5)),
              ] }),
            ],
          }),
          h.spacer(20),

          // ── 5×5 Risk Matrix ──
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [new TextRun({ text: 'Risk Assessment Matrix', bold: true, size: BODY, font: 'Arial', color: h.EBRORA_GREEN })],
          }),
          h.riskMatrix5x5(W),
          h.spacer(20),

          // ── Approval & Sign-Off ──
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: 'Approval & Sign-Off', bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })],
          }),
          h.approvalTable([
            { role: 'Assessed By',  name: content.assessedBy || '' },
            { role: 'Reviewed By',  name: '' },
            { role: 'Approved By',  name: '' },
          ], W),
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 2 — CONTINUOUS BODY (all remaining content — no page breaks)
      // ═══════════════════════════════════════════════════════════════════════
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // 1.0 Activity Description
          coshhSection('1.0', 'Activity Description'),
          ...h.prose(content.activityDescription, BODY),

          // 2.0 Hazard Statements
          coshhSection('2.0', 'Hazard Statements'),
          ...(content.hazardStatements || []).map(s =>
            new Paragraph({
              spacing: { after: 50 },
              bullet: { level: 0 },
              children: [new TextRun({ text: s, size: BODY, font: 'Arial' })],
            })
          ),
          h.spacer(100),
          coshhSub('Precautionary Statements'),
          ...(content.precautionaryStatements || []).map(s =>
            new Paragraph({
              spacing: { after: 50 },
              bullet: { level: 0 },
              children: [new TextRun({ text: s, size: BODY, font: 'Arial' })],
            })
          ),

          // 3.0 Exposure Routes
          coshhSection('3.0', 'Exposure Routes'),
          ...h.prose(content.exposureRoutes, BODY),

          // 4.0 Health Effects
          coshhSection('4.0', 'Health Effects'),
          ...h.prose(content.healthEffects, BODY),
          h.spacer(80),
          h.infoTable([
            { label: 'Workplace Exposure Limit (WEL)', value: content.workplaceExposureLimit || 'Refer to manufacturer SDS' },
          ], W),

          // 5.0 Control Measures
          coshhSection('5.0', 'Control Measures'),
          ...h.prose(content.controlMeasures, BODY),

          // 6.0 PPE
          coshhSection('6.0', 'Personal Protective Equipment (PPE)'),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [labelW, valueW],
            rows: [
              new TableRow({ children: [
                h.headerCell('PPE Category', labelW, { fontSize: SMALL }),
                h.headerCell('Requirement',  valueW, { fontSize: SMALL }),
              ] }),
              zebraRow('Respiratory Protection', ppe.respiratory || '', labelW, valueW, 0),
              zebraRow('Hand Protection',        ppe.hands || '',       labelW, valueW, 1),
              zebraRow('Eye Protection',         ppe.eyes || '',        labelW, valueW, 2),
              zebraRow('Body Protection',        ppe.body || '',        labelW, valueW, 3),
              zebraRow('Foot Protection',        ppe.feet || '',        labelW, valueW, 4),
            ],
          }),

          // 7.0 Storage Requirements
          coshhSection('7.0', 'Storage Requirements'),
          ...h.prose(content.storageRequirements, BODY),

          // 8.0 First Aid Measures
          coshhSection('8.0', 'First Aid Measures'),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [labelW, valueW],
            rows: [
              new TableRow({ children: [
                h.headerCell('Exposure Type',   labelW, { fontSize: SMALL }),
                h.headerCell('First Aid Action', valueW, { fontSize: SMALL }),
              ] }),
              zebraRow('Inhalation',    firstAid.inhalation   || '', labelW, valueW, 0),
              zebraRow('Skin Contact',  firstAid.skinContact  || '', labelW, valueW, 1),
              zebraRow('Eye Contact',   firstAid.eyeContact   || '', labelW, valueW, 2),
              zebraRow('Ingestion',     firstAid.ingestion    || '', labelW, valueW, 3),
            ],
          }),

          // 9.0 Spill / Leak Procedure
          coshhSection('9.0', 'Spill / Leak Procedure'),
          ...h.prose(content.spillProcedure, BODY),

          // 10.0 Disposal
          coshhSection('10.0', 'Disposal'),
          ...h.prose(content.disposalMethod, BODY),

          // 11.0 Emergency Procedures
          coshhSection('11.0', 'Emergency Procedures'),
          ...h.prose(content.emergencyProcedures, BODY),

          // 12.0 Monitoring Requirements
          coshhSection('12.0', 'Monitoring Requirements'),
          ...h.prose(content.monitoringRequired, BODY),

          // 13.0 Health Surveillance
          coshhSection('13.0', 'Health Surveillance'),
          ...h.prose(content.healthSurveillance, BODY),

          // 14.0 Training Requirements
          coshhSection('14.0', 'Training Requirements'),
          ...h.prose(content.trainingRequirements, BODY),

          // 15.0 Additional Notes (conditional)
          ...(content.additionalNotes
            ? [
                coshhSection('15.0', 'Additional Notes'),
                ...h.prose(content.additionalNotes, BODY),
              ]
            : []),

          // 16.0 (or 15.0) Regulatory References — proper table
          coshhSection(content.additionalNotes ? '16.0' : '15.0', 'Regulatory References'),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: [refColW, descColW],
            rows: [
              new TableRow({ children: [
                h.headerCell('Reference', refColW, { fontSize: SMALL }),
                h.headerCell('Description', descColW, { fontSize: SMALL }),
              ] }),
              ...regRefs.map((r, i) =>
                new TableRow({ children: [
                  h.dataCell(r.ref,  refColW,  { bold: true, fontSize: SMALL, fillColor: i % 2 === 1 ? h.GREY_LIGHT : h.WHITE }),
                  h.dataCell(r.desc, descColW, { fontSize: SMALL, fillColor: i % 2 === 1 ? h.GREY_LIGHT : h.WHITE }),
                ] })
              ),
            ],
          }),

          h.spacer(300),

          // ── Closing statement ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
            children: [
              new TextRun({
                text: 'This assessment must be reviewed when the substance, process, work environment, or personnel change \u2014 or at minimum annually.',
                size: SMALL, font: 'Arial', color: h.GREY_DARK, italics: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: 'Generated by Ebrora \u2014 ebrora.com',
                size: SMALL, font: 'Arial', color: h.EBRORA_GREEN, bold: true,
              }),
            ],
          }),
        ],
      },
    ],
  });
}
