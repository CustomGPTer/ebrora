// =============================================================================
// COSHH Assessment Builder — Multi-Template Engine
// 5 visual templates, all consuming the same COSHH JSON structure.
// Router function picks the right builder based on CoshhTemplateSlug.
//
// Templates:
//   T1 — Ebrora Standard  (green, cover page, 18 sections, ~3pp)
//   T2 — Red Hazard        (red, warning callouts, 18 sections, ~3pp)
//   T3 — SDS Technical     (navy, monospace, spec panels, 18 sections, ~3pp)
//   T4 — Compact Field     (grey, dense, no cover, 14 condensed, ~2pp)
//   T5 — Audit-Ready       (teal, doc control, revision history, 19 sections, ~4pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CoshhTemplateSlug } from '@/lib/coshh/types';

// ── Layout Constants ─────────────────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH;
const BODY = 20;   // 10pt
const SM = 16;     // 8pt
const LG = 24;     // 12pt
const XL = 32;     // 16pt
const TTL = 44;    // 22pt

// ── Shared Colour Palette ────────────────────────────────────────────────────
const EBRORA      = h.EBRORA_GREEN;        // 1B5745
const ACCENT_DARK = '143D2B';
const RED_D       = '991B1B';
const RED         = 'DC2626';
const RED_BG      = 'FEF2F2';
const RED_PILL_BG = 'FEE2E2';
const RED_PILL_BD = 'FECACA';
const AMBER       = 'D97706';
const AMBER_BG    = 'FEF3C7';
const GREEN_RAG   = '059669';
const GREEN_BG    = 'D1FAE5';
const GREY_RAG    = '6B7280';
const GREY_BG     = 'F3F4F6';
const GHS_RED     = 'D32F2F';
const GHS_RED_BG  = 'FFEBEE';
const NAVY        = '1e293b';
const NAVY_MID    = '334155';
const NAVY_BG     = 'f1f5f9';
const NAVY_LIGHT  = 'f8fafc';
const TEAL        = '0f766e';
const TEAL_BG     = 'f0fdfa';
const GREY_COMP   = '374151';
const ZEBRA       = 'F5F5F5';

// ── Cell margins for filled cells (critical requirement) ─────────────────────
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const CM_TIGHT = { top: 60, bottom: 60, left: 80, right: 80 };

// ── Shared Data Interface ────────────────────────────────────────────────────
interface CoshhData {
  documentRef: string;
  assessmentDate: string;
  reviewDate: string;
  assessedBy: string;
  projectName: string;
  siteAddress: string;
  productName: string;
  manufacturer: string;
  emergencyContact: string;
  sdsVersion: string;
  physicalForm: string;
  odour: string;
  pH: string;
  activityDescription: string;
  composition: Array<{
    component: string;
    cas: string;
    concentration: string;
    classification: string;
    hStatements: string;
  }>;
  hazardClassification: string;
  signalWord: string;
  hazardClasses: string;
  hStatements: string;
  pStatements: string;
  supplementalInfo: string;
  exposureRoutes: Array<{
    route: string;
    healthEffect: string;
    symptoms: string;
    onset: string;
    severity: string;
  }>;
  welData: Array<{
    substance: string;
    welTwa: string;
    welStel: string;
    notes: string;
  }>;
  dnelData: string;
  bmgvData: string;
  monitoringRequired: string;
  controlMeasures: Array<{
    level: string;
    measure: string;
    verification: string;
  }>;
  ppeRequirements: Array<{
    type: string;
    specification: string;
    standard: string;
    replacement: string;
    mandatory: string;
  }>;
  riskRating: {
    beforeLikelihood: number;
    beforeSeverity: number;
    beforeScore: number;
    beforeRating: string;
    afterLikelihood: number;
    afterSeverity: number;
    afterScore: number;
    afterRating: string;
  };
  healthSurveillance: {
    required: string;
    type: string;
    frequency: string;
    responsiblePerson: string;
    recordsRetention: string;
  };
  training: Array<{
    type: string;
    content: string;
    audience: string;
    frequency: string;
  }>;
  firstAid: Array<{
    scenario: string;
    immediateAction: string;
    followUp: string;
  }>;
  spillResponse: Array<{
    step: string;
    action: string;
  }>;
  storage: {
    temperature: string;
    container: string;
    ventilation: string;
    incompatibles: string;
    bunding: string;
    signage: string;
    shelfLife: string;
  };
  disposal: {
    ewcCode: string;
    classification: string;
    method: string;
    containers: string;
    drains: string;
  };
  transport: {
    unNumber: string;
    adrClass: string;
    precautions: string;
    marinePollutant: string;
  };
  monitoringReview: {
    reviewDate: string;
    responsiblePerson: string;
    reviewTriggers: string;
    linkedDocuments: string;
    coshhRegister: string;
  };
  regulatoryReferences: Array<{
    reference: string;
    description: string;
  }>;
  additionalNotes: string;
}

// ── Extract helper — normalise content JSON into CoshhData ───────────────────
function extract(c: any): CoshhData {
  const safe = (v: any, fallback = '') => v ?? fallback;
  const safeArr = (v: any) => (Array.isArray(v) ? v : []);
  const risk = c.riskRating || {};
  const hs = c.healthSurveillance || {};
  const stor = c.storage || {};
  const disp = c.disposal || {};
  const trans = c.transport || {};
  const mr = c.monitoringReview || {};

  return {
    documentRef: safe(c.documentRef),
    assessmentDate: safe(c.assessmentDate),
    reviewDate: safe(c.reviewDate),
    assessedBy: safe(c.assessedBy),
    projectName: safe(c.projectName),
    siteAddress: safe(c.siteAddress),
    productName: safe(c.productName),
    manufacturer: safe(c.manufacturer),
    emergencyContact: safe(c.emergencyContact),
    sdsVersion: safe(c.sdsVersion),
    physicalForm: safe(c.physicalForm),
    odour: safe(c.odour, 'Not specified'),
    pH: safe(c.pH, 'Not specified'),
    activityDescription: safe(c.activityDescription),
    composition: safeArr(c.composition),
    hazardClassification: safe(c.hazardClassification),
    signalWord: safe(c.signalWord),
    hazardClasses: safe(c.hazardClasses),
    hStatements: safe(c.hStatements),
    pStatements: safe(c.pStatements),
    supplementalInfo: safe(c.supplementalInfo),
    exposureRoutes: safeArr(c.exposureRoutes),
    welData: safeArr(c.welData),
    dnelData: safe(c.dnelData),
    bmgvData: safe(c.bmgvData),
    monitoringRequired: safe(c.monitoringRequired),
    controlMeasures: safeArr(c.controlMeasures),
    ppeRequirements: safeArr(c.ppeRequirements),
    riskRating: {
      beforeLikelihood: risk.beforeLikelihood ?? 3,
      beforeSeverity: risk.beforeSeverity ?? 3,
      beforeScore: risk.beforeScore ?? 9,
      beforeRating: safe(risk.beforeRating, 'Medium'),
      afterLikelihood: risk.afterLikelihood ?? 1,
      afterSeverity: risk.afterSeverity ?? 2,
      afterScore: risk.afterScore ?? 2,
      afterRating: safe(risk.afterRating, 'Low'),
    },
    healthSurveillance: {
      required: safe(hs.required, 'Yes'),
      type: safe(hs.type),
      frequency: safe(hs.frequency),
      responsiblePerson: safe(hs.responsiblePerson),
      recordsRetention: safe(hs.recordsRetention, '40 years (COSHH Reg 11(4))'),
    },
    training: safeArr(c.training),
    firstAid: safeArr(c.firstAid),
    spillResponse: safeArr(c.spillResponse),
    storage: {
      temperature: safe(stor.temperature),
      container: safe(stor.container),
      ventilation: safe(stor.ventilation),
      incompatibles: safe(stor.incompatibles),
      bunding: safe(stor.bunding),
      signage: safe(stor.signage),
      shelfLife: safe(stor.shelfLife),
    },
    disposal: {
      ewcCode: safe(disp.ewcCode),
      classification: safe(disp.classification),
      method: safe(disp.method),
      containers: safe(disp.containers),
      drains: safe(disp.drains, 'NEVER discharge to drains or watercourses'),
    },
    transport: {
      unNumber: safe(trans.unNumber, 'Not classified as dangerous goods'),
      adrClass: safe(trans.adrClass, 'Not regulated'),
      precautions: safe(trans.precautions),
      marinePollutant: safe(trans.marinePollutant, 'No'),
    },
    monitoringReview: {
      reviewDate: safe(mr.reviewDate) || safe(c.reviewDate),
      responsiblePerson: safe(mr.responsiblePerson),
      reviewTriggers: safe(mr.reviewTriggers),
      linkedDocuments: safe(mr.linkedDocuments),
      coshhRegister: safe(mr.coshhRegister, 'Yes — updated'),
    },
    regulatoryReferences: safeArr(c.regulatoryReferences).length > 0
      ? safeArr(c.regulatoryReferences)
      : defaultRegRefs(),
    additionalNotes: safe(c.additionalNotes),
  };
}

function defaultRegRefs() {
  return [
    { reference: 'COSHH Regulations 2002 (SI 2002/2677)', description: 'Primary duty to assess and control exposure to hazardous substances' },
    { reference: 'EH40/2005 (4th Edition, 2020)', description: 'Workplace Exposure Limits — OELs for listed substances' },
    { reference: 'CLP Regulation (EC) 1272/2008', description: 'GHS classification, labelling, packaging (retained EU law)' },
    { reference: 'HSE HSG97 — COSHH Essentials', description: 'Control banding approach to COSHH assessment' },
    { reference: 'HSE L5 ACoP (3rd Edition, 2005)', description: 'Approved Code of Practice for COSHH Regulations' },
    { reference: 'PPE at Work Regulations 2022', description: 'Updated PPE duties — extended to limb (b) workers' },
    { reference: 'Environmental Permitting Regulations 2016', description: 'Control of discharges to water and land' },
    { reference: 'Hazardous Waste Regulations 2005', description: 'Waste classification, segregation, and consignment' },
  ];
}

// ── RAG colour helper ────────────────────────────────────────────────────────
function ragColours(rating: string): { fill: string; text: string } {
  const r = (rating || '').toLowerCase();
  if (r === 'high')   return { fill: RED_PILL_BG, text: RED };
  if (r === 'medium') return { fill: AMBER_BG,    text: AMBER };
  if (r === 'low')    return { fill: GREEN_BG,     text: GREEN_RAG };
  return { fill: GREY_BG, text: GREY_RAG };
}

function ragCell(rating: string, width: number, fontSize = BODY): TableCell {
  const c = ragColours(rating);
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CM,
    shading: { fill: c.fill, type: ShadingType.CLEAR },
    borders: h.CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: rating, bold: true, size: fontSize, font: 'Arial', color: c.text })],
    })],
  });
}

// ── GHS pill badges ──────────────────────────────────────────────────────────
function ghsPills(codes: string): TextRun[] {
  const pills = (codes || '').split(/[,;]\s*/).filter(Boolean);
  if (pills.length === 0) return [new TextRun({ text: '\u2014', size: SM, font: 'Arial' })];
  return pills.flatMap((code, i) => {
    const runs: TextRun[] = [];
    if (i > 0) runs.push(new TextRun({ text: '  ', size: SM, font: 'Arial' }));
    runs.push(new TextRun({
      text: ` ${code.trim().toUpperCase()} `,
      bold: true, size: SM, font: 'Arial', color: GHS_RED,
      shading: { type: ShadingType.CLEAR, fill: GHS_RED_BG, color: GHS_RED_BG },
    }));
    return runs;
  });
}

// ── Section heading builder (reusable, accent-configurable) ──────────────────
function secHead(num: string, text: string, accent: string, font = 'Arial', fontSize = LG): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({
      text: `${num}   ${text.toUpperCase()}`,
      bold: true, size: fontSize, font, color: accent,
    })],
  });
}

// ── Info table (label/value pairs) ───────────────────────────────────────────
function infoRow(label: string, value: string, labelW: number, valueW: number, labelBg: string, labelColor: string, idx: number): TableRow {
  return new TableRow({ children: [
    new TableCell({
      width: { size: labelW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      shading: { fill: labelBg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: label, bold: true, size: SM * 1.125 | 0, font: 'Arial', color: labelColor }),
      ] })],
    }),
    new TableCell({
      width: { size: valueW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      shading: { fill: h.WHITE, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: value || '\u2014', size: SM * 1.125 | 0, font: 'Arial' }),
      ] })],
    }),
  ] });
}

function infoRowWithChildren(label: string, children: TextRun[], labelW: number, valueW: number, labelBg: string, labelColor: string): TableRow {
  return new TableRow({ children: [
    new TableCell({
      width: { size: labelW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      shading: { fill: labelBg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: label, bold: true, size: SM * 1.125 | 0, font: 'Arial', color: labelColor }),
      ] })],
    }),
    new TableCell({
      width: { size: valueW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      shading: { fill: h.WHITE, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children })],
    }),
  ] });
}

function infoTable(rows: Array<{ label: string; value: string }>, labelBg: string, labelColor: string): Table {
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: rows.map((r, i) => infoRow(r.label, r.value, labelW, valueW, labelBg, labelColor, i)),
  });
}

// ── Standard data table with header + zebra rows ─────────────────────────────
function dataTable(
  headers: Array<{ text: string; width: number }>,
  rows: Array<Array<{ text: string; bold?: boolean; ragRating?: string }>>,
  headerBg: string,
  zebraColor = ZEBRA,
  fontSize = SM * 1.125 | 0,
  headerFontSize = SM,
): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: headers.map(hdr => new TableCell({
          width: { size: hdr.width, type: WidthType.DXA },
          margins: CM, borders: h.CELL_BORDERS,
          shading: { fill: headerBg, type: ShadingType.CLEAR },
          children: [new Paragraph({ spacing: { after: 0 }, children: [
            new TextRun({ text: hdr.text.toUpperCase(), bold: true, size: headerFontSize, font: 'Arial', color: h.WHITE }),
          ] })],
        })),
      }),
      ...rows.map((row, rIdx) => new TableRow({
        children: row.map((cell, cIdx) => {
          if (cell.ragRating) return ragCell(cell.text, headers[cIdx].width, fontSize);
          const bg = rIdx % 2 === 0 ? zebraColor : h.WHITE;
          return new TableCell({
            width: { size: headers[cIdx].width, type: WidthType.DXA },
            margins: CM, borders: h.CELL_BORDERS,
            shading: { fill: bg, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ spacing: { after: 0 }, children: [
              new TextRun({ text: cell.text || '\u2014', bold: cell.bold, size: fontSize, font: 'Arial' }),
            ] })],
          });
        }),
      })),
    ],
  });
}

// ── Sign-off table ───────────────────────────────────────────────────────────
function signOff(roles: string[], headerBg: string, cols: Array<{ text: string; width: number }>): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: cols.map(c => new TableCell({
          width: { size: c.width, type: WidthType.DXA },
          margins: CM, borders: h.CELL_BORDERS,
          shading: { fill: headerBg, type: ShadingType.CLEAR },
          children: [new Paragraph({ spacing: { after: 0 }, children: [
            new TextRun({ text: c.text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE }),
          ] })],
        })),
      }),
      ...roles.map(role => new TableRow({
        tableHeader: false,
        height: { value: 600, rule: 'atLeast' as any },
        children: cols.map((c, i) => new TableCell({
          width: { size: c.width, type: WidthType.DXA },
          margins: CM, borders: h.CELL_BORDERS,
          children: [new Paragraph({ spacing: { after: 0 }, children: [
            new TextRun({ text: i === 0 ? role : '', size: BODY, font: 'Arial' }),
          ] })],
        })),
      })),
    ],
  });
}

// ── Ebrora footer line ───────────────────────────────────────────────────────
function footerLine(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [
      new TextRun({
        text: 'This assessment must be reviewed when the substance, process, work environment, or personnel change \u2014 or at minimum annually.',
        size: SM, font: 'Arial', color: h.GREY_DARK, italics: true,
      }),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED SECTION BUILDERS — reused across templates
// ═════════════════════════════════════════════════════════════════════════════

function buildProductIdSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  return [
    secHead(num, 'Product Identification', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        infoRow('Product Name', d.productName, labelW, valueW, labelBg, labelColor, 0),
        infoRow('Manufacturer', d.manufacturer, labelW, valueW, labelBg, labelColor, 1),
        infoRow('Emergency Contact', d.emergencyContact, labelW, valueW, labelBg, labelColor, 2),
        infoRow('SDS Date / Version', d.sdsVersion, labelW, valueW, labelBg, labelColor, 3),
        infoRow('Physical Form', d.physicalForm, labelW, valueW, labelBg, labelColor, 4),
        infoRow('Odour', d.odour, labelW, valueW, labelBg, labelColor, 5),
        infoRow('pH', d.pH, labelW, valueW, labelBg, labelColor, 6),
        infoRow('Usage on Site', d.activityDescription, labelW, valueW, labelBg, labelColor, 7),
      ],
    }),
  ];
}

function buildCompositionSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Component', width: Math.round(W * 0.28) },
    { text: 'CAS Number', width: Math.round(W * 0.16) },
    { text: 'Concentration', width: Math.round(W * 0.14) },
    { text: 'Classification', width: Math.round(W * 0.22) },
    { text: 'H-Statements', width: W - Math.round(W * 0.28) - Math.round(W * 0.16) - Math.round(W * 0.14) - Math.round(W * 0.22) },
  ];
  const rows = d.composition.map(c => [
    { text: c.component }, { text: c.cas }, { text: c.concentration },
    { text: c.classification }, { text: c.hStatements },
  ]);
  return [
    secHead(num, 'Composition & Ingredients', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildGhsSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const labelW = Math.round(W * 0.35);
  const valueW = W - labelW;
  return [
    secHead(num, 'GHS Classification & Hazard Statements', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        infoRowWithChildren('GHS Pictograms', ghsPills(d.hazardClassification), labelW, valueW, labelBg, labelColor),
        infoRow('Signal Word', d.signalWord, labelW, valueW, labelBg, labelColor, 1),
        infoRow('Hazard Classes', d.hazardClasses, labelW, valueW, labelBg, labelColor, 2),
        infoRow('H-Statements', d.hStatements, labelW, valueW, labelBg, labelColor, 3),
        infoRow('P-Statements', d.pStatements, labelW, valueW, labelBg, labelColor, 4),
        infoRow('Supplemental', d.supplementalInfo, labelW, valueW, labelBg, labelColor, 5),
      ],
    }),
  ];
}

function buildExposureSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Route', width: Math.round(W * 0.12) },
    { text: 'Health Effects', width: Math.round(W * 0.36) },
    { text: 'Symptoms', width: Math.round(W * 0.22) },
    { text: 'Onset', width: Math.round(W * 0.12) },
    { text: 'Severity', width: W - Math.round(W * 0.12) - Math.round(W * 0.36) - Math.round(W * 0.22) - Math.round(W * 0.12) },
  ];
  const rows = d.exposureRoutes.map(r => [
    { text: r.route }, { text: r.healthEffect }, { text: r.symptoms },
    { text: r.onset }, { text: r.severity, ragRating: true },
  ]);
  return [
    secHead(num, 'Exposure Routes & Health Effects', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildWelSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const welCols = [
    { text: 'Substance', width: Math.round(W * 0.28) },
    { text: 'WEL (8-hr TWA)', width: Math.round(W * 0.22) },
    { text: 'WEL (STEL)', width: Math.round(W * 0.20) },
    { text: 'Notes', width: W - Math.round(W * 0.28) - Math.round(W * 0.22) - Math.round(W * 0.20) },
  ];
  const welRows = d.welData.map(w => [
    { text: w.substance }, { text: w.welTwa }, { text: w.welStel }, { text: w.notes },
  ]);
  const extra: Array<{ label: string; value: string }> = [];
  if (d.dnelData) extra.push({ label: 'DNEL (Workers, Inhalation)', value: d.dnelData });
  if (d.bmgvData) extra.push({ label: 'Biological Monitoring (BMGV)', value: d.bmgvData });
  if (d.monitoringRequired) extra.push({ label: 'Exposure Monitoring Required', value: d.monitoringRequired });

  return [
    secHead(num, 'Workplace Exposure Limits', accent, font),
    dataTable(welCols, welRows, accent),
    ...(extra.length > 0 ? [infoTable(extra, labelBg, labelColor)] : []),
  ];
}

function buildControlsSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Control Level', width: Math.round(W * 0.18) },
    { text: 'Measure', width: Math.round(W * 0.56) },
    { text: 'Verification', width: W - Math.round(W * 0.18) - Math.round(W * 0.56) },
  ];
  const rows = d.controlMeasures.map(c => [
    { text: c.level, bold: true }, { text: c.measure }, { text: c.verification },
  ]);
  return [
    secHead(num, 'Control Measures Hierarchy', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildPpeSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'PPE Type', width: Math.round(W * 0.14) },
    { text: 'Specification', width: Math.round(W * 0.28) },
    { text: 'Standard', width: Math.round(W * 0.18) },
    { text: 'Replacement', width: Math.round(W * 0.22) },
    { text: 'Mandatory?', width: W - Math.round(W * 0.14) - Math.round(W * 0.28) - Math.round(W * 0.18) - Math.round(W * 0.22) },
  ];
  const rows = d.ppeRequirements.map(p => [
    { text: p.type }, { text: p.specification }, { text: p.standard },
    { text: p.replacement }, { text: p.mandatory, ragRating: true },
  ]);
  return [
    secHead(num, 'PPE Requirements', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildRiskSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const rr = d.riskRating;
  const cols = [
    { text: 'Stage', width: Math.round(W * 0.36) },
    { text: 'Likelihood', width: Math.round(W * 0.14) },
    { text: 'Severity', width: Math.round(W * 0.14) },
    { text: 'Score', width: Math.round(W * 0.14) },
    { text: 'Rating', width: W - Math.round(W * 0.36) - Math.round(W * 0.14) * 3 },
  ];
  const rows = [
    [{ text: 'Before Controls' }, { text: String(rr.beforeLikelihood) }, { text: String(rr.beforeSeverity) }, { text: String(rr.beforeScore) }, { text: rr.beforeRating, ragRating: true }],
    [{ text: 'After Controls' }, { text: String(rr.afterLikelihood) }, { text: String(rr.afterSeverity) }, { text: String(rr.afterScore) }, { text: rr.afterRating, ragRating: true }],
  ];
  return [
    secHead(num, 'Risk Rating', accent, font),
    dataTable(cols, rows, accent),
    h.spacer(80),
    h.riskMatrix5x5(W),
  ];
}

function buildHealthSurvSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const hs = d.healthSurveillance;
  return [
    secHead(num, 'Health Surveillance', accent, font),
    infoTable([
      { label: 'Surveillance Required?', value: hs.required },
      { label: 'Type', value: hs.type },
      { label: 'Frequency', value: hs.frequency },
      { label: 'Responsible Person', value: hs.responsiblePerson },
      { label: 'Records Retention', value: hs.recordsRetention },
    ], labelBg, labelColor),
  ];
}

function buildTrainingSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Training Type', width: Math.round(W * 0.22) },
    { text: 'Content', width: Math.round(W * 0.34) },
    { text: 'Audience', width: Math.round(W * 0.20) },
    { text: 'Frequency', width: W - Math.round(W * 0.22) - Math.round(W * 0.34) - Math.round(W * 0.20) },
  ];
  const rows = d.training.map(t => [
    { text: t.type }, { text: t.content }, { text: t.audience }, { text: t.frequency },
  ]);
  return [
    secHead(num, 'Training & Competency', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildFirstAidSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Scenario', width: Math.round(W * 0.14) },
    { text: 'Immediate Action', width: Math.round(W * 0.52) },
    { text: 'Follow-Up', width: W - Math.round(W * 0.14) - Math.round(W * 0.52) },
  ];
  const rows = d.firstAid.map(f => [
    { text: f.scenario, bold: true }, { text: f.immediateAction }, { text: f.followUp },
  ]);
  return [
    secHead(num, 'Emergency & First Aid Procedures', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildSpillSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Step', width: Math.round(W * 0.22) },
    { text: 'Action', width: W - Math.round(W * 0.22) },
  ];
  const rows = d.spillResponse.map(s => [{ text: s.step, bold: true }, { text: s.action }]);
  return [
    secHead(num, 'Spill / Accidental Release', accent, font),
    dataTable(cols, rows, accent),
  ];
}

function buildStorageSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const s = d.storage;
  return [
    secHead(num, 'Storage Requirements', accent, font),
    infoTable([
      { label: 'Storage Temperature', value: s.temperature },
      { label: 'Container', value: s.container },
      { label: 'Ventilation', value: s.ventilation },
      { label: 'Incompatible Materials', value: s.incompatibles },
      { label: 'Containment / Bunding', value: s.bunding },
      { label: 'Signage', value: s.signage },
      { label: 'Shelf Life', value: s.shelfLife },
    ], labelBg, labelColor),
  ];
}

function buildDisposalSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const disp = d.disposal;
  return [
    secHead(num, 'Disposal & Waste Classification', accent, font),
    infoTable([
      { label: 'EWC Code', value: disp.ewcCode },
      { label: 'Waste Classification', value: disp.classification },
      { label: 'Disposal Method', value: disp.method },
      { label: 'Container Disposal', value: disp.containers },
      { label: 'Drain / Watercourse', value: disp.drains },
    ], labelBg, labelColor),
  ];
}

function buildTransportSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const t = d.transport;
  return [
    secHead(num, 'Transport Information', accent, font),
    infoTable([
      { label: 'UN Number / ADR Class', value: `${t.unNumber} / ${t.adrClass}` },
      { label: 'Transport Precautions', value: t.precautions },
      { label: 'Marine Pollutant', value: t.marinePollutant },
    ], labelBg, labelColor),
  ];
}

function buildReviewSection(d: CoshhData, num: string, accent: string, labelBg: string, labelColor: string, font = 'Arial'): Paragraph[] {
  const mr = d.monitoringReview;
  return [
    secHead(num, 'Monitoring & Review', accent, font),
    infoTable([
      { label: 'Review Date', value: mr.reviewDate },
      { label: 'Responsible Person', value: mr.responsiblePerson },
      { label: 'Review Triggers', value: mr.reviewTriggers },
      { label: 'Linked Documents', value: mr.linkedDocuments },
      { label: 'COSHH Register Entry', value: mr.coshhRegister },
    ], labelBg, labelColor),
  ];
}

function buildRefSection(d: CoshhData, num: string, accent: string, font = 'Arial'): Paragraph[] {
  const cols = [
    { text: 'Reference', width: Math.round(W * 0.38) },
    { text: 'Description', width: W - Math.round(W * 0.38) },
  ];
  const rows = d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]);
  return [
    secHead(num, 'Regulatory References', accent, font),
    dataTable(cols, rows, accent),
  ];
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, cover page, 18 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CoshhData): Document {
  const LBG = 'f0fdf4';
  const LC = EBRORA;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── Cover Page ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK },
            spacing: { before: 0, after: 0 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 40 },
            children: [new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: TTL, font: 'Arial', color: EBRORA })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: 'Control of Substances Hazardous to Health Regulations 2002', size: BODY, font: 'Arial', color: h.GREY_DARK })],
          }),
          h.spacer(100),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: EBRORA },
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 200 },
            children: [new TextRun({ text: `  ${(d.productName || 'PRODUCT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })],
          }),
          h.spacer(100),
          infoTable([
            { label: 'Document Ref', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Assessor', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Location', value: d.siteAddress },
          ], LBG, LC),
        ],
      },
      // ── Body (continuous — all 18 sections) ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          ...buildProductIdSection(d, '1.0', EBRORA, LBG, LC),
          ...buildCompositionSection(d, '2.0', EBRORA),
          ...buildGhsSection(d, '3.0', EBRORA, LBG, LC),
          ...buildExposureSection(d, '4.0', EBRORA),
          ...buildWelSection(d, '5.0', EBRORA, LBG, LC),
          ...buildControlsSection(d, '6.0', EBRORA),
          ...buildPpeSection(d, '7.0', EBRORA),
          ...buildRiskSection(d, '8.0', EBRORA),
          ...buildHealthSurvSection(d, '9.0', EBRORA, LBG, LC),
          ...buildTrainingSection(d, '10.0', EBRORA),
          ...buildFirstAidSection(d, '11.0', EBRORA),
          ...buildSpillSection(d, '12.0', EBRORA),
          ...buildStorageSection(d, '13.0', EBRORA, LBG, LC),
          ...buildDisposalSection(d, '14.0', EBRORA, LBG, LC),
          ...buildTransportSection(d, '15.0', EBRORA, LBG, LC),
          ...buildReviewSection(d, '16.0', EBRORA, LBG, LC),
          ...buildRefSection(d, '17.0', EBRORA),
          secHead('18.0', 'Assessor Sign-Off', EBRORA),
          signOff(['Assessor', 'Reviewer'], EBRORA, [
            { text: 'Role', width: Math.round(W * 0.22) },
            { text: 'Name', width: Math.round(W * 0.28) },
            { text: 'Signature', width: Math.round(W * 0.25) },
            { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — RED HAZARD (red, warning callouts, 18 sections)
// ═════════════════════════════════════════════════════════════════════════════

function warningCallout(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 } },
    shading: { type: ShadingType.CLEAR, fill: RED_BG },
    children: [new TextRun({ text, bold: true, size: BODY, font: 'Arial', color: RED_D })],
  });
}

function buildT2(d: CoshhData): Document {
  const LBG = RED_BG;
  const LC = RED_D;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Red banner
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: RED_D },
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: '\u26A0 COSHH ASSESSMENT \u2014 HAZARDOUS SUBSTANCE', bold: true, size: SM, font: 'Arial', color: 'FFFFFF80' })],
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: RED_D },
            spacing: { after: 0 },
            children: [new TextRun({ text: d.productName || 'Product', bold: true, size: XL + 2, font: 'Arial', color: h.WHITE })],
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: RED_D },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Control of Substances Hazardous to Health Regulations 2002', size: BODY, font: 'Arial', color: 'FFFFFFC0' })],
          }),
          // Black meta bar
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: '1a1a1a' },
            spacing: { after: 0 },
            children: [new TextRun({
              text: `Ref: ${d.documentRef}   |   Assessed: ${d.assessmentDate}   |   Assessor: ${d.assessedBy}   |   Review: ${d.reviewDate}`,
              size: SM, font: 'Arial', color: 'e5e5e5',
            })],
          }),
          h.spacer(60),
          warningCallout(`\u26A0 HAZARD CLASSIFICATION: This substance is classified with ${d.hazardClassification || 'hazard pictograms'}. ${d.signalWord ? 'Signal word: ' + d.signalWord + '.' : ''} Always read the SDS before handling.`),
          ...buildProductIdSection(d, '1.0', RED_D, LBG, LC),
          ...buildCompositionSection(d, '2.0', RED_D),
          ...buildGhsSection(d, '3.0', RED_D, LBG, LC),
          warningCallout(`\u26A0 PRIMARY HAZARD: ${d.exposureRoutes[0]?.healthEffect || 'See exposure routes below for full details.'}`),
          ...buildExposureSection(d, '4.0', RED_D),
          ...buildWelSection(d, '5.0', RED_D, LBG, LC),
          ...buildControlsSection(d, '6.0', RED_D),
          ...buildPpeSection(d, '7.0', RED_D),
          ...buildRiskSection(d, '8.0', RED_D),
          ...buildHealthSurvSection(d, '9.0', RED_D, LBG, LC),
          ...buildTrainingSection(d, '10.0', RED_D),
          warningCallout(`\u26A0 EYE SPLASH: ${d.firstAid.find(f => f.scenario.toLowerCase().includes('eye'))?.immediateAction || 'Flush immediately with water for 15 minutes.'}`),
          ...buildFirstAidSection(d, '11.0', RED_D),
          ...buildSpillSection(d, '12.0', RED_D),
          ...buildStorageSection(d, '13.0', RED_D, LBG, LC),
          ...buildDisposalSection(d, '14.0', RED_D, LBG, LC),
          ...buildTransportSection(d, '15.0', RED_D, LBG, LC),
          ...buildReviewSection(d, '16.0', RED_D, LBG, LC),
          ...buildRefSection(d, '17.0', RED_D),
          secHead('18.0', 'Sign-Off', RED_D),
          signOff(['Assessor', 'Reviewer'], RED_D, [
            { text: 'Role', width: Math.round(W * 0.22) },
            { text: 'Name', width: Math.round(W * 0.28) },
            { text: 'Signature', width: Math.round(W * 0.25) },
            { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — SDS TECHNICAL (navy, monospace, spec panels, 18 sections)
// ═════════════════════════════════════════════════════════════════════════════

function specPanel(lines: string[]): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 },
      top: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
    },
    shading: { type: ShadingType.CLEAR, fill: NAVY_LIGHT },
    children: lines.flatMap((line, i) => {
      const runs: TextRun[] = [];
      if (i > 0) runs.push(new TextRun({ text: '\n', size: SM, font: 'Courier New' }));
      // Bold the part before the first colon
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        runs.push(new TextRun({ text: line.substring(0, colonIdx + 1), bold: true, size: SM, font: 'Courier New' }));
        runs.push(new TextRun({ text: line.substring(colonIdx + 1), size: SM, font: 'Courier New' }));
      } else {
        runs.push(new TextRun({ text: line, size: SM, font: 'Courier New' }));
      }
      return runs;
    }),
  });
}

function buildT3(d: CoshhData): Document {
  const LBG = NAVY_BG;
  const LC = NAVY;
  const FNT = 'Courier New';

  return new Document({
    styles: { default: { document: { run: { font: 'Courier New', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Navy header
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: NAVY },
            spacing: { after: 0 },
            children: [
              new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: LG + 2, font: FNT, color: h.WHITE }),
              new TextRun({ text: `     ${d.documentRef} | Rev 1.0`, size: SM, font: FNT, color: '94a3b8' }),
            ],
          }),
          // Navy sub-bar
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: NAVY_MID },
            spacing: { after: 60 },
            children: [new TextRun({
              text: `PRODUCT: ${d.productName}    DATE: ${d.assessmentDate}    ASSESSOR: ${d.assessedBy}    REVIEW: ${d.reviewDate}`,
              size: SM - 1, font: FNT, color: 'cbd5e1',
            })],
          }),
          ...buildProductIdSection(d, '1.0', NAVY, LBG, LC, FNT),
          ...buildCompositionSection(d, '2.0', NAVY, FNT),
          secHead('3.0', 'GHS Classification', NAVY, FNT),
          specPanel([
            `Classification: ${d.hazardClasses}`,
            `Pictograms: ${d.hazardClassification}    Signal: ${d.signalWord}`,
            `H-Statements: ${d.hStatements}`,
            `P-Statements: ${d.pStatements}`,
            ...(d.supplementalInfo ? [`Supplemental: ${d.supplementalInfo}`] : []),
          ]),
          ...buildExposureSection(d, '4.0', NAVY, FNT),
          secHead('5.0', 'Workplace Exposure Limits', NAVY, FNT),
          specPanel([
            ...d.welData.map(w => `${w.substance}: TWA=${w.welTwa} STEL=${w.welStel} ${w.notes}`),
            ...(d.dnelData ? [`DNEL: ${d.dnelData}`] : []),
            ...(d.bmgvData ? [`BMGV: ${d.bmgvData}`] : []),
            ...(d.monitoringRequired ? [`Monitoring: ${d.monitoringRequired}`] : []),
          ]),
          ...buildControlsSection(d, '6.0', NAVY, FNT),
          ...buildPpeSection(d, '7.0', NAVY, FNT),
          ...buildRiskSection(d, '8.0', NAVY, FNT),
          secHead('9.0', 'Health Surveillance', NAVY, FNT),
          specPanel([
            `Required: ${d.healthSurveillance.required}`,
            `Type: ${d.healthSurveillance.type}`,
            `Frequency: ${d.healthSurveillance.frequency}`,
            `Records: ${d.healthSurveillance.recordsRetention}`,
          ]),
          ...buildTrainingSection(d, '10.0', NAVY, FNT),
          ...buildFirstAidSection(d, '11.0', NAVY, FNT),
          secHead('12.0', 'Spill / Accidental Release', NAVY, FNT),
          specPanel(d.spillResponse.map(s => `${s.step}: ${s.action}`)),
          secHead('13.0', 'Storage Requirements', NAVY, FNT),
          specPanel([
            `Temp: ${d.storage.temperature}`,
            `Container: ${d.storage.container}`,
            `Bunding: ${d.storage.bunding}`,
            `Incompatibles: ${d.storage.incompatibles}`,
            `Shelf Life: ${d.storage.shelfLife}`,
          ]),
          secHead('14.0', 'Disposal & Waste', NAVY, FNT),
          specPanel([
            `EWC: ${d.disposal.ewcCode}    Classification: ${d.disposal.classification}`,
            `Method: ${d.disposal.method}`,
            `Containers: ${d.disposal.containers}`,
            `Drains: ${d.disposal.drains}`,
          ]),
          secHead('15.0', 'Transport Information', NAVY, FNT),
          specPanel([
            `UN/ADR: ${d.transport.unNumber} / ${d.transport.adrClass}`,
            `Marine pollutant: ${d.transport.marinePollutant}`,
            `Precautions: ${d.transport.precautions}`,
          ]),
          secHead('16.0', 'Monitoring & Review', NAVY, FNT),
          specPanel([
            `Review: ${d.monitoringReview.reviewDate}`,
            `Triggers: ${d.monitoringReview.reviewTriggers}`,
            `Linked: ${d.monitoringReview.linkedDocuments}`,
            `Register: ${d.monitoringReview.coshhRegister}`,
          ]),
          ...buildRefSection(d, '17.0', NAVY, FNT),
          secHead('18.0', 'Sign-Off', NAVY, FNT),
          signOff(['Assessor', 'Reviewer'], NAVY, [
            { text: 'Role', width: Math.round(W * 0.22) },
            { text: 'Name', width: Math.round(W * 0.28) },
            { text: 'Signature', width: Math.round(W * 0.25) },
            { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — COMPACT FIELD (grey, dense, no cover, 14 condensed sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CoshhData): Document {
  const LBG = GREY_BG;
  const LC = GREY_COMP;
  const SZ_C = SM; // Compact font size

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Compact grey header bar
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: GREY_COMP },
            spacing: { after: 0 },
            children: [
              new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: LG - 2, font: 'Arial', color: h.WHITE }),
              new TextRun({ text: `     ${d.documentRef} | ${d.assessmentDate} | Review: ${d.reviewDate} | ${d.assessedBy}`, size: SM - 1, font: 'Arial', color: 'e5e5e5' }),
            ],
          }),
          // 1.0 Product — condensed
          ...buildProductIdSection(d, '1.0', GREY_COMP, LBG, LC),
          // 2.0 Composition — condensed
          ...buildCompositionSection(d, '2.0', GREY_COMP),
          // 3.0 Hazards & Exposure — merged GHS + exposure
          secHead('3.0', 'Hazards & Exposure', GREY_COMP),
          infoTable([
            { label: 'GHS Pictograms', value: d.hazardClassification },
            { label: 'Signal Word', value: d.signalWord },
            { label: 'H-Statements', value: d.hStatements },
          ], LBG, LC),
          ...buildExposureSection(d, '', GREY_COMP).slice(1), // skip the heading (already set)
          // 4.0 WEL Data
          ...buildWelSection(d, '4.0', GREY_COMP, LBG, LC),
          // 5.0 Controls & PPE — side by side tables
          ...buildControlsSection(d, '5.0', GREY_COMP),
          ...buildPpeSection(d, '', GREY_COMP).slice(1),
          // 6.0 Risk Rating
          ...buildRiskSection(d, '6.0', GREY_COMP),
          // 7.0 Health Surveillance & Training — combined
          secHead('7.0', 'Health Surveillance & Training', GREY_COMP),
          infoTable([
            { label: 'Surveillance', value: `${d.healthSurveillance.type} — ${d.healthSurveillance.frequency}` },
            { label: 'Records', value: d.healthSurveillance.recordsRetention },
          ], LBG, LC),
          ...buildTrainingSection(d, '', GREY_COMP).slice(1),
          // 8.0 Emergency / First Aid
          ...buildFirstAidSection(d, '8.0', GREY_COMP),
          // 9.0 Spill Response
          ...buildSpillSection(d, '9.0', GREY_COMP),
          // 10.0 Storage & Disposal — combined
          secHead('10.0', 'Storage & Disposal', GREY_COMP),
          infoTable([
            { label: 'Storage', value: `${d.storage.temperature}. ${d.storage.container}. Bunded: ${d.storage.bunding}` },
            { label: 'Incompatibles', value: d.storage.incompatibles },
            { label: 'Shelf Life', value: d.storage.shelfLife },
            { label: 'EWC Code', value: d.disposal.ewcCode },
            { label: 'Disposal', value: d.disposal.method },
            { label: 'Drains', value: d.disposal.drains },
          ], LBG, LC),
          // 11.0 Transport
          ...buildTransportSection(d, '11.0', GREY_COMP, LBG, LC),
          // 12.0 Monitoring & Review
          ...buildReviewSection(d, '12.0', GREY_COMP, LBG, LC),
          // 13.0 References
          ...buildRefSection(d, '13.0', GREY_COMP),
          // 14.0 Sign-Off
          secHead('14.0', 'Sign-Off', GREY_COMP),
          signOff(['Assessor', 'Reviewer'], GREY_COMP, [
            { text: 'Role', width: Math.round(W * 0.18) },
            { text: 'Name', width: Math.round(W * 0.30) },
            { text: 'Signature', width: Math.round(W * 0.28) },
            { text: 'Date', width: W - Math.round(W * 0.18) - Math.round(W * 0.30) - Math.round(W * 0.28) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T5 — AUDIT-READY (teal, doc control, revision history, 19 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT5(d: CoshhData): Document {
  const LBG = TEAL_BG;
  const LC = TEAL;

  // Document control block
  const dcCols = [
    { text: 'Document Ref', width: Math.round(W * 0.18) },
    { text: 'Revision', width: Math.round(W * 0.12) },
    { text: 'Date Issued', width: Math.round(W * 0.16) },
    { text: 'Review Date', width: Math.round(W * 0.16) },
    { text: 'Classification', width: Math.round(W * 0.18) },
    { text: 'Status', width: W - Math.round(W * 0.18) - Math.round(W * 0.12) - Math.round(W * 0.16) - Math.round(W * 0.16) - Math.round(W * 0.18) },
  ];
  const dcRow = [
    { text: d.documentRef }, { text: '1.0' }, { text: d.assessmentDate },
    { text: d.reviewDate }, { text: 'H&S \u2014 COSHH' }, { text: 'Live', ragRating: true },
  ];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('COSHH Assessment') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Teal header
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: TEAL },
            spacing: { after: 0 },
            children: [new TextRun({ text: 'COSHH ASSESSMENT', bold: true, size: LG + 4, font: 'Arial', color: h.WHITE })],
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: TEAL },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Control of Substances Hazardous to Health Regulations 2002', size: BODY, font: 'Arial', color: 'FFFFFFB0' })],
          }),
          h.spacer(60),
          // Document Control Block
          dataTable(dcCols, [dcRow], TEAL, TEAL_BG),
          // All 18 sections
          ...buildProductIdSection(d, '1.0', TEAL, LBG, LC),
          ...buildCompositionSection(d, '2.0', TEAL),
          ...buildGhsSection(d, '3.0', TEAL, LBG, LC),
          ...buildExposureSection(d, '4.0', TEAL),
          ...buildWelSection(d, '5.0', TEAL, LBG, LC),
          ...buildControlsSection(d, '6.0', TEAL),
          ...buildPpeSection(d, '7.0', TEAL),
          ...buildRiskSection(d, '8.0', TEAL),
          ...buildHealthSurvSection(d, '9.0', TEAL, LBG, LC),
          ...buildTrainingSection(d, '10.0', TEAL),
          ...buildFirstAidSection(d, '11.0', TEAL),
          ...buildSpillSection(d, '12.0', TEAL),
          ...buildStorageSection(d, '13.0', TEAL, LBG, LC),
          ...buildDisposalSection(d, '14.0', TEAL, LBG, LC),
          ...buildTransportSection(d, '15.0', TEAL, LBG, LC),
          ...buildReviewSection(d, '16.0', TEAL, LBG, LC),
          ...buildRefSection(d, '17.0', TEAL),
          // 18.0 Revision History
          secHead('18.0', 'Revision History', TEAL),
          dataTable(
            [
              { text: 'Rev', width: Math.round(W * 0.10) },
              { text: 'Date', width: Math.round(W * 0.16) },
              { text: 'Author', width: Math.round(W * 0.22) },
              { text: 'Description of Change', width: W - Math.round(W * 0.10) - Math.round(W * 0.16) - Math.round(W * 0.22) },
            ],
            [
              [{ text: '1.0' }, { text: d.assessmentDate }, { text: d.assessedBy }, { text: 'Initial assessment' }],
              [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
              [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
            ],
            TEAL, TEAL_BG,
          ),
          // 19.0 Approval Sign-Off (extended — with qualification + organisation)
          secHead('19.0', 'Approval Sign-Off', TEAL),
          signOff(['Prepared By', 'Reviewed By', 'Approved By'], TEAL, [
            { text: 'Role', width: Math.round(W * 0.14) },
            { text: 'Name', width: Math.round(W * 0.18) },
            { text: 'Signature', width: Math.round(W * 0.16) },
            { text: 'Date', width: Math.round(W * 0.14) },
            { text: 'Qualification', width: Math.round(W * 0.20) },
            { text: 'Organisation', width: W - Math.round(W * 0.14) - Math.round(W * 0.18) - Math.round(W * 0.16) - Math.round(W * 0.14) - Math.round(W * 0.20) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER — picks the right builder based on template slug
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCoshhTemplateDocument(
  content: any,
  templateSlug: CoshhTemplateSlug
): Promise<Document> {
  const d = extract(content);

  switch (templateSlug) {
    case 'ebrora-standard':  return buildT1(d);
    case 'red-hazard':       return buildT2(d);
    case 'sds-technical':    return buildT3(d);
    case 'compact-field':    return buildT4(d);
    case 'audit-ready':      return buildT5(d);
    default:                 return buildT1(d);
  }
}
