// =============================================================================
// CDM Compliance Checker — Multi-Template Engine
// 4 visual templates, all consuming the same CDM JSON structure.
//
// T1 — Ebrora Standard  (green, cover page, duty holder sections)
// T2 — Compliance Matrix (teal, large matrix table)
// T3 — Audit Trail       (navy, evidence refs, NCR register)
// T4 — Executive Summary  (charcoal/green, dashboard, management-focused)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CdmCheckerTemplateSlug } from '@/lib/cdm-checker/types';

// ── Layout Constants ─────────────────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH;
const BODY = 20;
const SM = 16;
const LG = 24;
const XL = 32;
const TTL = 44;

// ── Colours ──────────────────────────────────────────────────────────────────
const EBRORA      = h.EBRORA_GREEN;
const ACCENT_DARK = '143D2B';
const TEAL        = '0f766e';
const TEAL_BG     = 'f0fdfa';
const TEAL_DARK   = '134e4a';
const NAVY        = '1e293b';
const NAVY_MID    = '334155';
const NAVY_BG     = 'f1f5f9';
const CHARCOAL    = '2d3748';
const GREEN_RAG   = '059669';
const GREEN_BG    = 'D1FAE5';
const AMBER       = 'D97706';
const AMBER_BG    = 'FEF3C7';
const RED         = 'DC2626';
const RED_BG      = 'FEE2E2';
const GREY_RAG    = '6B7280';
const GREY_BG     = 'F3F4F6';
const PURPLE      = '7C3AED';
const PURPLE_BG   = 'EDE9FE';
const ZEBRA       = 'F5F5F5';

// ── Cell margins ─────────────────────────────────────────────────────────────
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface DutyCheck {
  duty: string;
  regulation: string;
  status: string;
  finding: string;
  gap: string;
  recommendation: string;
  evidenceRef?: string;
}

interface DutyHolderAssessment {
  dutyHolder: string;
  overallCompliance: string;
  duties: DutyCheck[];
}

interface IdentifiedGap {
  priority: string;
  gap: string;
  regulation: string;
  potentialConsequence: string;
  recommendation: string;
}

interface RoadmapItem {
  action: string;
  responsible: string;
  targetDate: string;
  priority: string;
}

interface CdmData {
  documentRef: string;
  assessmentDate: string;
  reviewDate: string;
  assessedBy: string;
  projectName: string;
  siteAddress: string;
  projectOverview: string;
  overallComplianceRating: string;
  notificationStatus: {
    f10Required: string;
    f10Submitted: string;
    f10Reference: string;
    f10Displayed: string;
    notificationAssessment: string;
  };
  dutyHolders: {
    client: { name: string; type: string; formallyAppointed: string; cdmDutiesAcknowledged: string };
    principalDesigner: { name: string; formallyAppointed: string; writtenAppointment: string; scopeDefined: string };
    principalContractor: { name: string; formallyAppointed: string; writtenAppointment: string };
  };
  dutyHolderAssessments: DutyHolderAssessment[];
  keyDocumentsAssessment: {
    preConstructionInformation: { status: string; distributed: string; finding: string; gaps: string[]; recommendations: string[] };
    constructionPhasePlan: { status: string; siteSpecific: string; finding: string; gaps: string[]; recommendations: string[] };
    healthAndSafetyFile: { status: string; responsibleParty: string; finding: string; gaps: string[]; recommendations: string[] };
  };
  identifiedGaps: IdentifiedGap[];
  complianceRoadmap: RoadmapItem[];
  narrativeSummary: string;
  regulatoryReferences: Array<{ reference: string; description: string }>;
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): CdmData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const ns = c.notificationStatus || {};
  const dh = c.dutyHolders || {};
  const kd = c.keyDocumentsAssessment || {};
  const pci = kd.preConstructionInformation || {};
  const cpp = kd.constructionPhasePlan || {};
  const hsf = kd.healthAndSafetyFile || {};

  return {
    documentRef: s(c.documentRef),
    assessmentDate: s(c.assessmentDate),
    reviewDate: s(c.reviewDate),
    assessedBy: s(c.assessedBy),
    projectName: s(c.projectName),
    siteAddress: s(c.siteAddress),
    projectOverview: s(c.projectOverview),
    overallComplianceRating: s(c.overallComplianceRating, 'Requires Improvement'),
    notificationStatus: {
      f10Required: s(ns.f10Required), f10Submitted: s(ns.f10Submitted),
      f10Reference: s(ns.f10Reference), f10Displayed: s(ns.f10Displayed),
      notificationAssessment: s(ns.notificationAssessment),
    },
    dutyHolders: {
      client: { name: s(dh.client?.name), type: s(dh.client?.type), formallyAppointed: s(dh.client?.formallyAppointed), cdmDutiesAcknowledged: s(dh.client?.cdmDutiesAcknowledged) },
      principalDesigner: { name: s(dh.principalDesigner?.name), formallyAppointed: s(dh.principalDesigner?.formallyAppointed), writtenAppointment: s(dh.principalDesigner?.writtenAppointment), scopeDefined: s(dh.principalDesigner?.scopeDefined) },
      principalContractor: { name: s(dh.principalContractor?.name), formallyAppointed: s(dh.principalContractor?.formallyAppointed), writtenAppointment: s(dh.principalContractor?.writtenAppointment) },
    },
    dutyHolderAssessments: a(c.dutyHolderAssessments),
    keyDocumentsAssessment: {
      preConstructionInformation: { status: s(pci.status), distributed: s(pci.distributed), finding: s(pci.finding), gaps: a(pci.gaps), recommendations: a(pci.recommendations) },
      constructionPhasePlan: { status: s(cpp.status), siteSpecific: s(cpp.siteSpecific), finding: s(cpp.finding), gaps: a(cpp.gaps), recommendations: a(cpp.recommendations) },
      healthAndSafetyFile: { status: s(hsf.status), responsibleParty: s(hsf.responsibleParty), finding: s(hsf.finding), gaps: a(hsf.gaps), recommendations: a(hsf.recommendations) },
    },
    identifiedGaps: a(c.identifiedGaps),
    complianceRoadmap: a(c.complianceRoadmap),
    narrativeSummary: s(c.narrativeSummary),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs() {
  return [
    { reference: 'CDM Regulations 2015 (SI 2015/51)', description: 'Construction (Design and Management) Regulations — primary legislation' },
    { reference: 'HSE L153 ACoP (2015)', description: 'Managing health and safety in construction — Approved Code of Practice' },
    { reference: 'PAS 1192-6:2018', description: 'Specification for collaborative sharing of structured H&S information using BIM' },
    { reference: 'HSE INDG411', description: 'CDM 2015 — what you need to know (summary guidance)' },
  ];
}

// ── RAG helpers ──────────────────────────────────────────────────────────────
function ragColours(status: string): { fill: string; text: string } {
  const s = (status || '').toLowerCase();
  if (s.includes('compliant') && !s.includes('non')) return { fill: GREEN_BG, text: GREEN_RAG };
  if (s.includes('partial') || s.includes('improvement')) return { fill: AMBER_BG, text: AMBER };
  if (s.includes('non') || s.includes('unsatisfactory')) return { fill: RED_BG, text: RED };
  if (s.includes('unknown')) return { fill: PURPLE_BG, text: PURPLE };
  if (s === 'high' || s === 'immediate') return { fill: RED_BG, text: RED };
  if (s === 'medium' || s.includes('2 week') || s.includes('within 2')) return { fill: AMBER_BG, text: AMBER };
  if (s === 'low' || s.includes('1 month') || s.includes('ongoing')) return { fill: GREEN_BG, text: GREEN_RAG };
  if (s.includes('n/a') || s.includes('not applicable')) return { fill: GREY_BG, text: GREY_RAG };
  // Approved/Yes/Submitted
  if (s === 'yes' || s.includes('approved') || s.includes('submitted') || s.includes('compiled') || s.includes('live')) return { fill: GREEN_BG, text: GREEN_RAG };
  if (s === 'no' || s.includes('not started')) return { fill: RED_BG, text: RED };
  if (s.includes('draft') || s.includes('partial') || s.includes('in progress') || s.includes('pending')) return { fill: AMBER_BG, text: AMBER };
  return { fill: GREY_BG, text: GREY_RAG };
}

function ragCell(text: string, width: number, fontSize = SM): TableCell {
  const c = ragColours(text);
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: c.fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: true, size: fontSize, font: 'Arial', color: c.text }),
    ] })],
  });
}

// ── Section heading ──────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string, font = 'Arial', fontSize = LG): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: fontSize, font, color: accent })],
  });
}

// ── Generic helpers ──────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string, font = 'Arial'): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE }),
    ] })],
  });
}

function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; font?: string }): TableCell {
  const bg = opts?.bg || h.WHITE;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || SM + 2, font: opts?.font || 'Arial' }),
    ] })],
  });
}

function infoRow(label: string, value: string, labelW: number, valueW: number, labelBg: string, labelColor: string): TableRow {
  return new TableRow({ children: [
    new TableCell({
      width: { size: labelW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      shading: { fill: labelBg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: label, bold: true, size: SM + 2, font: 'Arial', color: labelColor }),
      ] })],
    }),
    new TableCell({
      width: { size: valueW, type: WidthType.DXA },
      margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: value || '\u2014', size: SM + 2, font: 'Arial' }),
      ] })],
    }),
  ] });
}

function infoTable(rows: Array<{ label: string; value: string }>, labelBg: string, labelColor: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => infoRow(r.label, r.value, lw, W - lw, labelBg, labelColor)) });
}

function signOff(roles: string[], bg: string, cols: Array<{ text: string; width: number }>): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: cols.map(c => hdrCell(c.text, c.width, bg)) }),
      ...roles.map(role => new TableRow({
        height: { value: 600, rule: 'atLeast' as any },
        children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.width)),
      })),
    ],
  });
}

function footerLine(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This CDM compliance assessment must be reviewed at least every 6 months and whenever project circumstances change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
  });
}

// ── Shared section builders (return (Paragraph | Table)[]) ───────────────────

function buildDutyHolderSection(d: CdmData, dha: DutyHolderAssessment, num: string, accent: string, font = 'Arial'): (Paragraph | Table)[] {
  const cw = [
    Math.round(W * 0.26), Math.round(W * 0.10), Math.round(W * 0.12),
    Math.round(W * 0.28), W - Math.round(W * 0.26) - Math.round(W * 0.10) - Math.round(W * 0.12) - Math.round(W * 0.28),
  ];
  return [
    secHead(num, dha.dutyHolder, accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          hdrCell('Duty', cw[0], accent, font), hdrCell('Reg', cw[1], accent, font),
          hdrCell('Status', cw[2], accent, font), hdrCell('Finding', cw[3], accent, font),
          hdrCell('Recommendation', cw[4], accent, font),
        ] }),
        ...dha.duties.map((duty, i) => new TableRow({ children: [
          txtCell(duty.duty, cw[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(duty.regulation, cw[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(duty.status, cw[2]),
          txtCell(duty.finding, cw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(duty.recommendation, cw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }),
  ];
}

function buildGapsSection(d: CdmData, num: string, accent: string, font = 'Arial'): (Paragraph | Table)[] {
  const cw = [
    Math.round(W * 0.10), Math.round(W * 0.28), Math.round(W * 0.12),
    Math.round(W * 0.26), W - Math.round(W * 0.10) - Math.round(W * 0.28) - Math.round(W * 0.12) - Math.round(W * 0.26),
  ];
  return [
    secHead(num, 'Identified Gaps \u2014 Priority Ranked', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          hdrCell('Priority', cw[0], accent, font), hdrCell('Gap', cw[1], accent, font),
          hdrCell('Regulation', cw[2], accent, font), hdrCell('Consequence', cw[3], accent, font),
          hdrCell('Recommendation', cw[4], accent, font),
        ] }),
        ...d.identifiedGaps.map((g, i) => new TableRow({ children: [
          ragCell(g.priority, cw[0]),
          txtCell(g.gap, cw[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(g.regulation, cw[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(g.potentialConsequence, cw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(g.recommendation, cw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }),
  ];
}

function buildRoadmapSection(d: CdmData, num: string, accent: string, font = 'Arial'): (Paragraph | Table)[] {
  const cw = [
    Math.round(W * 0.34), Math.round(W * 0.20), Math.round(W * 0.18),
    Math.round(W * 0.14), W - Math.round(W * 0.34) - Math.round(W * 0.20) - Math.round(W * 0.18) - Math.round(W * 0.14),
  ];
  return [
    secHead(num, 'Compliance Roadmap', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          hdrCell('Action', cw[0], accent, font), hdrCell('Responsible', cw[1], accent, font),
          hdrCell('Target Date', cw[2], accent, font), hdrCell('Priority', cw[3], accent, font),
          hdrCell('Status', cw[4], accent, font),
        ] }),
        ...d.complianceRoadmap.map((r, i) => new TableRow({ children: [
          txtCell(r.action, cw[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.responsible, cw[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.targetDate, cw[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(r.priority, cw[3]),
          txtCell('', cw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }),
  ];
}

function buildRefsSection(d: CdmData, num: string, accent: string, font = 'Arial'): (Paragraph | Table)[] {
  const cw = [Math.round(W * 0.38), W - Math.round(W * 0.38)];
  return [
    secHead(num, 'Regulatory References', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('Reference', cw[0], accent, font), hdrCell('Description', cw[1], accent, font)] }),
        ...d.regulatoryReferences.map((r, i) => new TableRow({ children: [
          txtCell(r.reference, cw[0], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.description, cw[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }),
  ];
}

function buildKeyDocsSection(d: CdmData, num: string, accent: string, font = 'Arial'): (Paragraph | Table)[] {
  const kd = d.keyDocumentsAssessment;
  const cw = [
    Math.round(W * 0.22), Math.round(W * 0.12), Math.round(W * 0.12),
    Math.round(W * 0.28), W - Math.round(W * 0.22) - Math.round(W * 0.12) - Math.round(W * 0.12) - Math.round(W * 0.28),
  ];
  const docs = [
    { name: 'Pre-Construction Information', status: kd.preConstructionInformation.status, dist: kd.preConstructionInformation.distributed, gaps: kd.preConstructionInformation.gaps.join('; '), recs: kd.preConstructionInformation.recommendations.join('; ') },
    { name: 'Construction Phase Plan', status: kd.constructionPhasePlan.status, dist: kd.constructionPhasePlan.siteSpecific || '', gaps: kd.constructionPhasePlan.gaps.join('; '), recs: kd.constructionPhasePlan.recommendations.join('; ') },
    { name: 'Health & Safety File', status: kd.healthAndSafetyFile.status, dist: kd.healthAndSafetyFile.responsibleParty || '', gaps: kd.healthAndSafetyFile.gaps.join('; '), recs: kd.healthAndSafetyFile.recommendations.join('; ') },
  ];
  return [
    secHead(num, 'Key Documents Assessment', accent, font),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          hdrCell('Document', cw[0], accent, font), hdrCell('Status', cw[1], accent, font),
          hdrCell('Distributed', cw[2], accent, font), hdrCell('Gaps', cw[3], accent, font),
          hdrCell('Recommendation', cw[4], accent, font),
        ] }),
        ...docs.map((doc, i) => new TableRow({ children: [
          txtCell(doc.name, cw[0], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(doc.status, cw[1]),
          ragCell(doc.dist, cw[2]),
          txtCell(doc.gaps, cw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(doc.recs, cw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }),
  ];
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CdmData): Document {
  const LBG = 'f0fdf4';
  const LC = EBRORA;

  // Number duty holder sections starting from 4
  let secNum = 4;
  const dhSections: (Paragraph | Table)[] = [];
  for (const dha of d.dutyHolderAssessments) {
    dhSections.push(...buildDutyHolderSection(d, dha, `${secNum}.0`, EBRORA));
    secNum++;
  }
  const gapNum = secNum;
  const roadNum = secNum + 1;
  const refNum = secNum + 2;
  const signNum = secNum + 3;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('CDM 2015 Compliance Gap Analysis') },
        footers: { default: h.ebroraFooter() },
        children: [
          // Cover
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'CDM 2015 COMPLIANCE GAP ANALYSIS', bold: true, size: TTL, font: 'Arial', color: EBRORA })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Construction (Design and Management) Regulations 2015', size: BODY, font: 'Arial', color: h.GREY_DARK })] }),
          h.spacer(100),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: EBRORA }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          h.spacer(100),
          infoTable([
            { label: 'Document Ref', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Assessor', value: d.assessedBy },
            { label: 'Overall Rating', value: d.overallComplianceRating },
            { label: 'Client', value: d.dutyHolders.client.name },
          ], LBG, LC),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader('CDM 2015 Compliance Gap Analysis') },
        footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Project Overview', EBRORA),
          ...h.prose(d.projectOverview, BODY),

          secHead('2.0', 'F10 Notification Status', EBRORA),
          infoTable([
            { label: 'F10 Required', value: d.notificationStatus.f10Required },
            { label: 'F10 Submitted', value: d.notificationStatus.f10Submitted },
            { label: 'F10 Reference', value: d.notificationStatus.f10Reference },
            { label: 'F10 Displayed', value: d.notificationStatus.f10Displayed },
          ], LBG, LC),
          ...h.prose(d.notificationStatus.notificationAssessment, BODY),

          secHead('3.0', 'Duty Holder Appointments', EBRORA),
          infoTable([
            { label: 'Client', value: `${d.dutyHolders.client.name} (${d.dutyHolders.client.type})` },
            { label: 'Principal Designer', value: `${d.dutyHolders.principalDesigner.name} \u2014 Written: ${d.dutyHolders.principalDesigner.writtenAppointment}, Scope: ${d.dutyHolders.principalDesigner.scopeDefined}` },
            { label: 'Principal Contractor', value: `${d.dutyHolders.principalContractor.name} \u2014 Written: ${d.dutyHolders.principalContractor.writtenAppointment}` },
          ], LBG, LC),

          ...dhSections,
          ...buildKeyDocsSection(d, `${gapNum}.0`, EBRORA),
          ...buildGapsSection(d, `${gapNum + 1}.0`, EBRORA),
          ...buildRoadmapSection(d, `${roadNum + 1}.0`, EBRORA),
          ...buildRefsSection(d, `${refNum + 1}.0`, EBRORA),

          secHead(`${signNum + 1}.0`, 'Assessor Sign-Off', EBRORA),
          signOff(['CDM Assessor', 'Reviewed By'], EBRORA, [
            { text: 'Role', width: Math.round(W * 0.22) }, { text: 'Name', width: Math.round(W * 0.28) },
            { text: 'Signature', width: Math.round(W * 0.25) }, { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
          ]),
          footerLine(),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — COMPLIANCE MATRIX
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CdmData): Document {
  // Build the matrix: one row per regulation, columns for each duty holder
  const dutyHolderNames = d.dutyHolderAssessments.map(dh => dh.dutyHolder.replace(/\s*\(.*\)/, ''));
  const matrixRows: TableRow[] = [];

  // Flatten all duties across all duty holders into a regulation-keyed map
  const regMap = new Map<string, Map<string, string>>();
  for (const dha of d.dutyHolderAssessments) {
    for (const duty of dha.duties) {
      if (!regMap.has(duty.regulation)) regMap.set(duty.regulation, new Map());
      regMap.get(duty.regulation)!.set(dha.dutyHolder, duty.status);
    }
  }

  const regW = Math.round(W * 0.08);
  const reqW = Math.round(W * 0.26);
  const dhW = Math.round((W - regW - reqW - Math.round(W * 0.12)) / Math.max(dutyHolderNames.length, 1));
  const overallW = W - regW - reqW - (dhW * dutyHolderNames.length);

  // Get requirement text from first duty that has this regulation
  function getReqText(reg: string): string {
    for (const dha of d.dutyHolderAssessments) {
      for (const duty of dha.duties) {
        if (duty.regulation === reg) return duty.duty;
      }
    }
    return reg;
  }

  let rowIdx = 0;
  for (const [reg, statuses] of regMap) {
    const bg = rowIdx % 2 === 0 ? ZEBRA : h.WHITE;
    const cells: TableCell[] = [
      txtCell(reg, regW, { bg, fontSize: SM }),
      txtCell(getReqText(reg), reqW, { bg, fontSize: SM }),
    ];
    for (const dhName of d.dutyHolderAssessments.map(dh => dh.dutyHolder)) {
      const status = statuses.get(dhName) || 'N/A';
      cells.push(ragCell(status === 'Compliant' ? '\u2713' : status === 'Partial' ? '\u25B3' : status.includes('Non') ? '\u2717' : '\u2014', dhW, SM - 2));
    }
    // Overall
    const allStatuses = Array.from(statuses.values());
    const overall = allStatuses.some(s => s.includes('Non')) ? '\u2717' : allStatuses.some(s => s === 'Partial') ? '\u25B3' : '\u2713';
    cells.push(ragCell(overall, overallW, SM - 2));
    matrixRows.push(new TableRow({ children: cells }));
    rowIdx++;
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader('CDM 2015 Compliance Matrix') },
      footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'CDM 2015 COMPLIANCE MATRIX', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: 'Construction (Design and Management) Regulations 2015', size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `Ref: ${d.documentRef}    Project: ${d.projectName}    Date: ${d.assessmentDate}    Overall: ${d.overallComplianceRating}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }),

        // Duty holder summary
        secHead('1.0', 'Duty Holder Summary', TEAL),
        infoTable([
          { label: 'Client', value: `${d.dutyHolders.client.name} \u2014 ${d.dutyHolders.client.cdmDutiesAcknowledged}` },
          { label: 'Principal Designer', value: `${d.dutyHolders.principalDesigner.name} \u2014 Written: ${d.dutyHolders.principalDesigner.writtenAppointment}, Scope: ${d.dutyHolders.principalDesigner.scopeDefined}` },
          { label: 'Principal Contractor', value: `${d.dutyHolders.principalContractor.name} \u2014 Written: ${d.dutyHolders.principalContractor.writtenAppointment}` },
        ], TEAL_BG, TEAL),

        // Matrix
        secHead('2.0', 'Full Compliance Matrix', TEAL),
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              hdrCell('Reg', regW, TEAL), hdrCell('Requirement', reqW, TEAL),
              ...dutyHolderNames.map(name => hdrCell(name.length > 12 ? name.substring(0, 12) : name, dhW, TEAL)),
              hdrCell('Overall', overallW, TEAL),
            ] }),
            ...matrixRows,
          ],
        }),

        ...buildGapsSection(d, '3.0', TEAL),
        ...buildRoadmapSection(d, '4.0', TEAL),
        ...buildRefsSection(d, '5.0', TEAL),

        secHead('6.0', 'Sign-Off', TEAL),
        signOff(['CDM Assessor', 'Reviewed By'], TEAL, [
          { text: 'Role', width: Math.round(W * 0.22) }, { text: 'Name', width: Math.round(W * 0.28) },
          { text: 'Signature', width: Math.round(W * 0.25) }, { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
        ]),
        footerLine(),
      ],
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — AUDIT TRAIL
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CdmData): Document {
  const FNT = 'Courier New';
  const LBG = NAVY_BG;
  const LC = NAVY;

  // Audit table with evidence column
  const auditRows: (Paragraph | Table)[] = [];
  const auditCw = [
    Math.round(W * 0.08), Math.round(W * 0.20), Math.round(W * 0.10),
    Math.round(W * 0.24), Math.round(W * 0.22),
    W - Math.round(W * 0.08) - Math.round(W * 0.20) - Math.round(W * 0.10) - Math.round(W * 0.24) - Math.round(W * 0.22),
  ];

  const allDuties: (DutyCheck & { dutyHolder: string })[] = [];
  for (const dha of d.dutyHolderAssessments) {
    for (const duty of dha.duties) {
      allDuties.push({ ...duty, dutyHolder: dha.dutyHolder });
    }
  }

  const auditTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        hdrCell('Reg', auditCw[0], NAVY, FNT), hdrCell('Requirement', auditCw[1], NAVY, FNT),
        hdrCell('Status', auditCw[2], NAVY, FNT), hdrCell('Finding', auditCw[3], NAVY, FNT),
        hdrCell('Evidence Ref', auditCw[4], NAVY, FNT), hdrCell('Action', auditCw[5], NAVY, FNT),
      ] }),
      ...allDuties.map((duty, i) => new TableRow({ children: [
        txtCell(duty.regulation, auditCw[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, fontSize: SM, font: FNT }),
        txtCell(duty.duty, auditCw[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, fontSize: SM, font: FNT }),
        ragCell(duty.status, auditCw[2], SM - 2),
        txtCell(duty.finding, auditCw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, fontSize: SM, font: FNT }),
        txtCell(duty.evidenceRef || 'Refer to site records', auditCw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, fontSize: SM, font: FNT }),
        txtCell(duty.status.includes('Non') || duty.status === 'Partial' ? 'See NCR' : '\u2014', auditCw[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, fontSize: SM, font: FNT }),
      ] })),
    ],
  });

  // NCR register
  const ncrItems = d.identifiedGaps.filter(g => g.priority === 'High' || g.priority === 'Medium');
  const ncrCw = [
    Math.round(W * 0.10), Math.round(W * 0.08), Math.round(W * 0.26), Math.round(W * 0.10),
    Math.round(W * 0.24), Math.round(W * 0.10),
    W - Math.round(W * 0.10) - Math.round(W * 0.08) - Math.round(W * 0.26) - Math.round(W * 0.10) - Math.round(W * 0.24) - Math.round(W * 0.10),
  ];
  const ncrTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        hdrCell('NCR Ref', ncrCw[0], NAVY, FNT), hdrCell('Priority', ncrCw[1], NAVY, FNT),
        hdrCell('Non-Conformance', ncrCw[2], NAVY, FNT), hdrCell('Regulation', ncrCw[3], NAVY, FNT),
        hdrCell('Corrective Action', ncrCw[4], NAVY, FNT), hdrCell('Owner', ncrCw[5], NAVY, FNT),
        hdrCell('Due', ncrCw[6], NAVY, FNT),
      ] }),
      ...ncrItems.map((g, i) => new TableRow({ children: [
        txtCell(`NCR-${String(i + 1).padStart(3, '0')}`, ncrCw[0], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        ragCell(g.priority, ncrCw[1], SM - 2),
        txtCell(g.gap, ncrCw[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        txtCell(g.regulation, ncrCw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        txtCell(g.recommendation, ncrCw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        txtCell('', ncrCw[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell('', ncrCw[6], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
      ] })),
    ],
  });

  // Observations
  const obsItems = d.identifiedGaps.filter(g => g.priority === 'Low');
  const obsCw = [Math.round(W * 0.10), Math.round(W * 0.08), Math.round(W * 0.34), Math.round(W * 0.28), W - Math.round(W * 0.10) - Math.round(W * 0.08) - Math.round(W * 0.34) - Math.round(W * 0.28)];
  const obsTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        hdrCell('Obs Ref', obsCw[0], NAVY, FNT), hdrCell('Priority', obsCw[1], NAVY, FNT),
        hdrCell('Observation', obsCw[2], NAVY, FNT), hdrCell('Recommended Action', obsCw[3], NAVY, FNT),
        hdrCell('Owner', obsCw[4], NAVY, FNT),
      ] }),
      ...obsItems.map((g, i) => new TableRow({ children: [
        txtCell(`OBS-${String(i + 1).padStart(3, '0')}`, obsCw[0], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        ragCell(g.priority, obsCw[1], SM - 2),
        txtCell(g.gap, obsCw[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        txtCell(g.recommendation, obsCw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, font: FNT, fontSize: SM }),
        txtCell('', obsCw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
      ] })),
    ],
  });

  // Revision history
  const revCw = [Math.round(W * 0.10), Math.round(W * 0.16), Math.round(W * 0.22), W - Math.round(W * 0.10) - Math.round(W * 0.16) - Math.round(W * 0.22)];
  const revTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [hdrCell('Rev', revCw[0], NAVY, FNT), hdrCell('Date', revCw[1], NAVY, FNT), hdrCell('Author', revCw[2], NAVY, FNT), hdrCell('Description', revCw[3], NAVY, FNT)] }),
      new TableRow({ children: [txtCell('1.0', revCw[0], { font: FNT, fontSize: SM }), txtCell(d.assessmentDate, revCw[1], { font: FNT, fontSize: SM }), txtCell(d.assessedBy, revCw[2], { font: FNT, fontSize: SM }), txtCell('Initial CDM compliance audit', revCw[3], { font: FNT, fontSize: SM })] }),
      new TableRow({ children: revCw.map(w => txtCell('', w)) }),
    ],
  });

  // Doc control table
  const dcCw = [Math.round(W * 0.18), Math.round(W * 0.12), Math.round(W * 0.16), Math.round(W * 0.16), Math.round(W * 0.18), W - Math.round(W * 0.18) - Math.round(W * 0.12) - Math.round(W * 0.16) - Math.round(W * 0.16) - Math.round(W * 0.18)];
  const dcTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [hdrCell('Document Ref', dcCw[0], NAVY, FNT), hdrCell('Revision', dcCw[1], NAVY, FNT), hdrCell('Date Issued', dcCw[2], NAVY, FNT), hdrCell('Review Date', dcCw[3], NAVY, FNT), hdrCell('Classification', dcCw[4], NAVY, FNT), hdrCell('Status', dcCw[5], NAVY, FNT)] }),
      new TableRow({ children: [
        txtCell(d.documentRef, dcCw[0], { font: FNT, fontSize: SM }), txtCell('1.0', dcCw[1], { font: FNT, fontSize: SM }),
        txtCell(d.assessmentDate, dcCw[2], { font: FNT, fontSize: SM }), txtCell(d.reviewDate, dcCw[3], { font: FNT, fontSize: SM }),
        txtCell('CDM Compliance', dcCw[4], { font: FNT, fontSize: SM }), ragCell(d.overallComplianceRating, dcCw[5], SM),
      ] }),
    ],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Courier New', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader('CDM 2015 Compliance Audit') },
      footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [
          new TextRun({ text: 'CDM 2015 COMPLIANCE AUDIT', bold: true, size: LG + 2, font: FNT, color: h.WHITE }),
          new TextRun({ text: `     ${d.documentRef} | Rev 1.0`, size: SM, font: FNT, color: '94a3b8' }),
        ] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY_MID }, spacing: { after: 60 }, children: [
          new TextRun({ text: `PROJECT: ${d.projectName}    DATE: ${d.assessmentDate}    AUDITOR: ${d.assessedBy}    REVIEW: ${d.reviewDate}`, size: SM - 1, font: FNT, color: 'cbd5e1' }),
        ] }),
        h.spacer(60),
        dcTable,

        secHead('1.0', 'Duty Holder Audit \u2014 with Evidence Trail', NAVY, FNT),
        auditTable,

        secHead('2.0', 'Non-Conformance Register', NAVY, FNT),
        ncrTable,

        secHead('3.0', 'Observations Register', NAVY, FNT),
        obsTable,

        ...buildRefsSection(d, '4.0', NAVY, FNT),

        secHead('5.0', 'Revision History', NAVY, FNT),
        revTable,

        secHead('6.0', 'Approval', NAVY, FNT),
        signOff(['Auditor', 'Reviewed By', 'Approved By'], NAVY, [
          { text: 'Role', width: Math.round(W * 0.14) }, { text: 'Name', width: Math.round(W * 0.18) },
          { text: 'Signature', width: Math.round(W * 0.16) }, { text: 'Date', width: Math.round(W * 0.14) },
          { text: 'Qualification', width: Math.round(W * 0.20) },
          { text: 'Organisation', width: W - Math.round(W * 0.14) - Math.round(W * 0.18) - Math.round(W * 0.16) - Math.round(W * 0.14) - Math.round(W * 0.20) },
        ]),
        footerLine(),
      ],
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — EXECUTIVE SUMMARY
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CdmData): Document {
  const LBG = 'f0fdf4';
  const LC = ACCENT_DARK;

  // Build dashboard data — compliance % per duty holder
  const dashItems: Array<{ label: string; pct: number }> = [];
  for (const dha of d.dutyHolderAssessments) {
    const total = dha.duties.length || 1;
    const compliant = dha.duties.filter(du => du.status.includes('Compliant') && !du.status.includes('Non')).length;
    const partial = dha.duties.filter(du => du.status === 'Partial').length;
    const pct = Math.round(((compliant + partial * 0.5) / total) * 100);
    dashItems.push({ label: dha.dutyHolder.replace(/\s*\(.*\)/, ''), pct });
  }

  // Dashboard as info table (docx can't do progress bars, so we show percentages)
  const dashCw = [Math.round(W * 0.40), Math.round(W * 0.15), W - Math.round(W * 0.40) - Math.round(W * 0.15)];
  const dashTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [hdrCell('Duty Holder', dashCw[0], ACCENT_DARK), hdrCell('Score', dashCw[1], ACCENT_DARK), hdrCell('Rating', dashCw[2], ACCENT_DARK)] }),
      ...dashItems.map((item, i) => {
        const rating = item.pct >= 80 ? 'Compliant' : item.pct >= 50 ? 'Partial' : 'Non-Compliant';
        return new TableRow({ children: [
          txtCell(item.label, dashCw[0], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(`${item.pct}%`, dashCw[1], { bold: true, bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(rating, dashCw[2]),
        ] });
      }),
    ],
  });

  // Key findings (top priority gaps)
  const topGaps = d.identifiedGaps.slice(0, 6);
  const findCw = [
    Math.round(W * 0.06), Math.round(W * 0.10), Math.round(W * 0.36),
    Math.round(W * 0.24), W - Math.round(W * 0.06) - Math.round(W * 0.10) - Math.round(W * 0.36) - Math.round(W * 0.24),
  ];
  const findingsTable = new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        hdrCell('#', findCw[0], ACCENT_DARK), hdrCell('Priority', findCw[1], ACCENT_DARK),
        hdrCell('Finding', findCw[2], ACCENT_DARK), hdrCell('Impact', findCw[3], ACCENT_DARK),
        hdrCell('Action', findCw[4], ACCENT_DARK),
      ] }),
      ...topGaps.map((g, i) => new TableRow({ children: [
        txtCell(String(i + 1), findCw[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ragCell(g.priority, findCw[1]),
        txtCell(g.gap, findCw[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell(g.potentialConsequence, findCw[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell(g.recommendation, findCw[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
      ] })),
    ],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader('CDM 2015 Compliance Gap Analysis') },
      footers: { default: h.ebroraFooter() },
      children: [
        // Charcoal header
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: CHARCOAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'CDM 2015 COMPLIANCE GAP ANALYSIS', size: SM, font: 'Arial', color: '9ca3af' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: CHARCOAL }, spacing: { after: 0 }, children: [new TextRun({ text: d.projectName || 'Project', bold: true, size: XL + 4, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: CHARCOAL }, spacing: { after: 80 }, children: [new TextRun({ text: `Prepared for ${d.dutyHolders.client.name || 'Client'} \u2014 ${d.assessmentDate}`, size: BODY, font: 'Arial', color: '9ca3af' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `Ref: ${d.documentRef}    Assessor: ${d.assessedBy}    Review: ${d.reviewDate}`, size: SM, font: 'Arial', color: 'bbf7d0' })] }),

        secHead('1.0', 'Compliance Dashboard', ACCENT_DARK),
        infoTable([
          { label: 'Overall Rating', value: d.overallComplianceRating },
          { label: 'Regulations Assessed', value: String(d.dutyHolderAssessments.reduce((t, dh) => t + dh.duties.length, 0)) },
          { label: 'Non-Conformances', value: String(d.identifiedGaps.filter(g => g.priority === 'High' || g.priority === 'Medium').length) },
        ], LBG, LC),
        h.spacer(80),
        dashTable,

        secHead('2.0', 'Key Findings \u2014 Priority Ranked', ACCENT_DARK),
        findingsTable,

        secHead('3.0', 'Recommendations', ACCENT_DARK),
        ...h.prose(d.narrativeSummary, BODY),

        ...buildRoadmapSection(d, '4.0', ACCENT_DARK),
        ...buildRefsSection(d, '5.0', ACCENT_DARK),

        secHead('6.0', 'Sign-Off', ACCENT_DARK),
        signOff(['CDM Assessor', 'Reviewed By'], ACCENT_DARK, [
          { text: 'Role', width: Math.round(W * 0.22) }, { text: 'Name', width: Math.round(W * 0.28) },
          { text: 'Signature', width: Math.round(W * 0.25) }, { text: 'Date', width: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) },
        ]),
        footerLine(),
      ],
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCdmCheckerTemplateDocument(
  content: any,
  templateSlug: CdmCheckerTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':   return buildT1(d);
    case 'compliance-matrix': return buildT2(d);
    case 'audit-trail':       return buildT3(d);
    case 'executive-summary': return buildT4(d);
    default:                  return buildT1(d);
  }
}
