// =============================================================================
// COSHH Assessment — Single Product Template
// Professional, branded layout — identical design for every assessment.
// One product per document. AI fills in SDS data from its knowledge.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const COSHH_RED = 'C0392B';
const COSHH_AMBER = 'E67E22';
const COSHH_GREEN_BAND = '27AE60';
const COSHH_PURPLE = '6C3483';

function riskColour(risk: string): { fill: string; text: string } {
  const r = (risk || '').toLowerCase();
  if (r === 'high') return { fill: COSHH_RED, text: h.WHITE };
  if (r === 'medium') return { fill: COSHH_AMBER, text: h.WHITE };
  return { fill: COSHH_GREEN_BAND, text: h.WHITE };
}

function riskCell(risk: string, width: number): TableCell {
  const c = riskColour(risk);
  return h.dataCell(risk, width, { fillColor: c.fill, color: c.text, bold: true, alignment: AlignmentType.CENTER });
}

function coshhSection(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COSHH_RED } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN }),
    ],
  });
}

function coshhSub(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 20, font: 'Arial', color: COSHH_PURPLE }),
    ],
  });
}

function prose(text: string): Paragraph[] {
  return (text || 'Not specified.').split(/\n\n+/).filter(Boolean).map(p => h.bodyText(p));
}

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

export async function buildCoshhDocument(content: CoshhContent): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  const ppe = content.ppeRequired || {} as any;
  const firstAid = content.firstAid || {} as any;
  const risk = content.riskRating || {} as any;

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
            new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'Control of Substances Hazardous to Health Regulations 2002', size: 20, font: 'Arial', color: COSHH_PURPLE }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: COSHH_RED } }, children: [] }),

          new Paragraph({ spacing: { before: 100, after: 200 }, shading: { type: ShadingType.CLEAR, fill: COSHH_PURPLE }, children: [
            new TextRun({ text: `  ${(content.productName || 'PRODUCT').toUpperCase()}  `, bold: true, size: 28, font: 'Arial', color: h.WHITE }),
          ] }),

          h.sectionHeading('Project Information'),
          h.infoTable([
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
          ], W),
          h.spacer(160),

          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Assessment Date', value: content.assessmentDate || '' },
            { label: 'Review Date', value: content.reviewDate || '' },
            { label: 'Assessed By', value: content.assessedBy || '' },
          ], W),
          h.spacer(160),

          h.sectionHeading('Product Identification'),
          h.infoTable([
            { label: 'Product Name', value: content.productName || '' },
            { label: 'Manufacturer / Supplier', value: content.manufacturer || '' },
            { label: 'Product Description', value: content.productDescription || '' },
            { label: 'Hazard Classification', value: content.hazardClassification || '' },
            { label: 'Signal Word', value: content.signalWord || '' },
          ], W),
          h.spacer(160),

          h.sectionHeading('Risk Rating Summary'),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.5), Math.round(W * 0.5)], rows: [
            new TableRow({ children: [
              h.headerCell('Initial Risk (before controls)', Math.round(W * 0.5), { fontSize: 16, alignment: AlignmentType.CENTER }),
              h.headerCell('Residual Risk (after controls)', Math.round(W * 0.5), { fontSize: 16, alignment: AlignmentType.CENTER }),
            ] }),
            new TableRow({ children: [
              riskCell(risk.initial || 'High', Math.round(W * 0.5)),
              riskCell(risk.residual || 'Low', Math.round(W * 0.5)),
            ] }),
          ] }),
          h.spacer(200),

          h.sectionHeading('Approval & Sign-Off'),
          h.approvalTable([
            { role: 'Assessed By', name: content.assessedBy || '' },
            { role: 'Reviewed By', name: '' },
            { role: 'Approved By', name: '' },
          ], W),
        ],
      },

      // ─── PAGE 2: HAZARD INFORMATION ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          coshhSection('Activity Description'),
          ...prose(content.activityDescription),
          h.spacer(160),

          coshhSection('Hazard Statements'),
          ...(content.hazardStatements || []).map(s =>
            new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 }, children: [new TextRun({ text: s, size: 18, font: 'Arial' })] })
          ),
          h.spacer(120),

          coshhSub('Precautionary Statements'),
          ...(content.precautionaryStatements || []).map(s =>
            new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 }, children: [new TextRun({ text: s, size: 18, font: 'Arial' })] })
          ),
          h.spacer(160),

          coshhSection('Exposure Routes'),
          ...prose(content.exposureRoutes),
          h.spacer(160),

          coshhSection('Health Effects'),
          ...prose(content.healthEffects),
          h.spacer(120),

          h.infoTable([
            { label: 'Workplace Exposure Limit (WEL)', value: content.workplaceExposureLimit || 'Refer to manufacturer SDS' },
          ], W),
        ],
      },

      // ─── PAGE 3: CONTROLS & PPE ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          coshhSection('Control Measures'),
          ...prose(content.controlMeasures),
          h.spacer(200),

          coshhSection('Personal Protective Equipment (PPE)'),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [labelW, valueW], rows: [
            new TableRow({ children: [h.headerCell('PPE Category', labelW, { fontSize: 16 }), h.headerCell('Requirement', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Respiratory Protection', labelW, { bold: true, fontSize: 16 }), h.dataCell(ppe.respiratory || '', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Hand Protection', labelW, { bold: true, fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(ppe.hands || '', valueW, { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
            new TableRow({ children: [h.dataCell('Eye Protection', labelW, { bold: true, fontSize: 16 }), h.dataCell(ppe.eyes || '', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Body Protection', labelW, { bold: true, fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(ppe.body || '', valueW, { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
            new TableRow({ children: [h.dataCell('Foot Protection', labelW, { bold: true, fontSize: 16 }), h.dataCell(ppe.feet || '', valueW, { fontSize: 16 })] }),
          ] }),
          h.spacer(200),

          coshhSection('Storage Requirements'),
          ...prose(content.storageRequirements),
        ],
      },

      // ─── PAGE 4: EMERGENCY & FIRST AID ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          coshhSection('First Aid Measures'),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [labelW, valueW], rows: [
            new TableRow({ children: [h.headerCell('Exposure Type', labelW, { fontSize: 16 }), h.headerCell('First Aid Action', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Inhalation', labelW, { bold: true, fontSize: 16 }), h.dataCell(firstAid.inhalation || '', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Skin Contact', labelW, { bold: true, fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(firstAid.skinContact || '', valueW, { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
            new TableRow({ children: [h.dataCell('Eye Contact', labelW, { bold: true, fontSize: 16 }), h.dataCell(firstAid.eyeContact || '', valueW, { fontSize: 16 })] }),
            new TableRow({ children: [h.dataCell('Ingestion', labelW, { bold: true, fontSize: 16, fillColor: h.GREY_LIGHT }), h.dataCell(firstAid.ingestion || '', valueW, { fontSize: 16, fillColor: h.GREY_LIGHT })] }),
          ] }),
          h.spacer(200),

          coshhSection('Spill / Leak Procedure'),
          ...prose(content.spillProcedure),
          h.spacer(160),

          coshhSection('Disposal'),
          ...prose(content.disposalMethod),
          h.spacer(200),

          coshhSection('Emergency Procedures'),
          ...prose(content.emergencyProcedures),
        ],
      },

      // ─── PAGE 5: MONITORING, TRAINING, REFERENCES ───
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          coshhSection('Monitoring Requirements'),
          ...prose(content.monitoringRequired),
          h.spacer(160),

          coshhSection('Health Surveillance'),
          ...prose(content.healthSurveillance),
          h.spacer(160),

          coshhSection('Training Requirements'),
          ...prose(content.trainingRequirements),
          h.spacer(160),

          ...(content.additionalNotes
            ? [coshhSection('Additional Notes'), ...prose(content.additionalNotes), h.spacer(160)]
            : []),

          coshhSection('Regulatory References'),
          h.bodyText('• Control of Substances Hazardous to Health Regulations 2002 (as amended)'),
          h.bodyText('• EH40/2005 Workplace Exposure Limits (4th Edition, 2020)'),
          h.bodyText('• Classification, Labelling and Packaging (CLP) Regulation (EC) No 1272/2008'),
          h.bodyText('• HSE COSHH Essentials (HSG97)'),
          h.bodyText('• L5 — General COSHH ACoP'),
          h.bodyText('• Manufacturer Safety Data Sheet (SDS)'),
          h.spacer(300),

          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
            children: [new TextRun({ text: 'This assessment must be reviewed when the substance, process, work environment, or personnel change — or at minimum annually.', size: 16, font: 'Arial', color: h.GREY_DARK, italics: true })],
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
