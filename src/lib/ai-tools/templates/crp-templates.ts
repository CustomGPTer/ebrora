// =============================================================================
// Carbon Reduction Plan Builder — Multi-Template Engine
// 4 visually distinct templates, all consuming the same CRP JSON structure.
//   T1 — PPN 06/21 Standard     (GOV.UK green, Arial, compliance bands)
//   T2 — SBTi Aligned           (corporate navy, Calibri, KPI boxes)
//   T3 — ISO 14064 Compliant    (charcoal + red clauses, Cambria, doc control)
//   T4 — GHG Protocol Corporate (dark teal, Calibri, scope-grouped tables)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CrpTemplateSlug } from '@/lib/carbon-reduction/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const XL = 32; const TTL = 44;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const ZEBRA = 'F5F5F5';
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// ── Data Interface ──────────────────────────────────────────────────────────
interface CrpData {
  documentRef: string; publicationDate: string; reviewDate: string;
  organisationName: string; organisationAddress: string; companiesHouseNumber: string;
  organisationDescription: string;
  netZeroCommitment: { commitment: string; targetYear: string; interimTarget2030: string; alignedWithSBTi: boolean; governanceStatement: string };
  baselineEmissions: { baselineYear: string; baselineScope1: string; baselineScope2: string; baselineScope3: string; totalBaselineUKOperations: string; baselineNarrative: string };
  currentEmissions: {
    reportingYear: string;
    scope1: { total: string; narrative: string; sources: Array<{ source: string; activity: string; emissionFactor: string; tCO2e: string }> };
    scope2: { total: string; method: string; narrative: string; sources: Array<{ source: string; kWh: string; tariff: string; tCO2e: string }> };
    scope3: { total: string; narrative: string; categories: Array<{ categoryNumber: string; categoryName: string; tCO2e: string; dataQuality: string; methodology: string }> };
    totalCurrentEmissions: string;
  };
  emissionsReductionInitiatives: {
    completed: Array<{ initiative: string; dateImplemented: string; scope: string; estimatedAnnualReduction: string; description: string }>;
    planned: Array<{ initiative: string; plannedImplementation: string; scope: string; estimatedAnnualReduction: string; investmentRequired: string; description: string }>;
  };
  carbonReductionTargets: {
    target2030: { absoluteReductionTarget: string; targetTCO2e: string; pathway: string };
    targetNetZero: { year: string; scope: string; residualEmissionsStrategy: string };
  };
  supplyChainEngagement: string;
  reportingAndMeasurement: string;
  boardSignOff: { signatoryName: string; signatoryTitle: string; signOffDate: string; signOffStatement: string };
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CrpData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const o = (k: string) => (typeof c?.[k] === 'object' && c[k] !== null ? c[k] : {});
  const a = (parent: any, k: string) => (Array.isArray(parent?.[k]) ? parent[k] : []);
  const ce = o('currentEmissions');
  const eri = o('emissionsReductionInitiatives');
  const crt = o('carbonReductionTargets');
  return {
    documentRef: s('documentRef', 'CRP-001'), publicationDate: s('publicationDate'), reviewDate: s('reviewDate'),
    organisationName: s('organisationName'), organisationAddress: s('organisationAddress'), companiesHouseNumber: s('companiesHouseNumber'),
    organisationDescription: s('organisationDescription'),
    netZeroCommitment: { commitment: o('netZeroCommitment').commitment || '', targetYear: o('netZeroCommitment').targetYear || '2050', interimTarget2030: o('netZeroCommitment').interimTarget2030 || '', alignedWithSBTi: !!o('netZeroCommitment').alignedWithSBTi, governanceStatement: o('netZeroCommitment').governanceStatement || '' },
    baselineEmissions: { baselineYear: o('baselineEmissions').baselineYear || '', baselineScope1: o('baselineEmissions').baselineScope1 || '', baselineScope2: o('baselineEmissions').baselineScope2 || '', baselineScope3: o('baselineEmissions').baselineScope3 || '', totalBaselineUKOperations: o('baselineEmissions').totalBaselineUKOperations || '', baselineNarrative: o('baselineEmissions').baselineNarrative || '' },
    currentEmissions: {
      reportingYear: ce.reportingYear || '', totalCurrentEmissions: ce.totalCurrentEmissions || '',
      scope1: { total: ce.scope1?.total || '', narrative: ce.scope1?.narrative || '', sources: a(ce.scope1, 'sources') },
      scope2: { total: ce.scope2?.total || '', method: ce.scope2?.method || '', narrative: ce.scope2?.narrative || '', sources: a(ce.scope2, 'sources') },
      scope3: { total: ce.scope3?.total || '', narrative: ce.scope3?.narrative || '', categories: a(ce.scope3, 'categories') },
    },
    emissionsReductionInitiatives: { completed: a(eri, 'completed'), planned: a(eri, 'planned') },
    carbonReductionTargets: { target2030: { absoluteReductionTarget: crt.target2030?.absoluteReductionTarget || '', targetTCO2e: crt.target2030?.targetTCO2e || '', pathway: crt.target2030?.pathway || '' }, targetNetZero: { year: crt.targetNetZero?.year || '2050', scope: crt.targetNetZero?.scope || '', residualEmissionsStrategy: crt.targetNetZero?.residualEmissionsStrategy || '' } },
    supplyChainEngagement: s('supplyChainEngagement'), reportingAndMeasurement: s('reportingAndMeasurement'),
    boardSignOff: { signatoryName: o('boardSignOff').signatoryName || '', signatoryTitle: o('boardSignOff').signatoryTitle || '', signOffDate: o('boardSignOff').signOffDate || '', signOffStatement: o('boardSignOff').signOffStatement || '' },
    additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ──────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, color: string, font = 'Arial') {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: { fill: color, type: ShadingType.CLEAR }, margins: CM, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: SM, font, color: 'FFFFFF' })] })] });
}
function dCell(text: string, width: number, opts?: { fill?: string; font?: string; bold?: boolean; color?: string }) {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: opts?.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined, margins: CM, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: text || '', size: SM, font: opts?.font || 'Arial', bold: opts?.bold, color: opts?.color })] })] });
}
function sectionBand(text: string, color: string, font = 'Arial'): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, shading: { fill: color, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  ${text}`, bold: true, size: 22, font, color: 'FFFFFF' })] });
}
function subHead(text: string, color: string, font = 'Arial'): Paragraph {
  return new Paragraph({ spacing: { before: 200, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color } }, children: [new TextRun({ text, bold: true, size: BODY, font, color })] });
}
function prose(text: string, font = 'Arial'): Paragraph[] {
  if (!text) return [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Not provided.', size: SM, font, italics: true, color: '999999' })] })];
  return text.split(/\n\n+/).filter(Boolean).map(p => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: p.trim(), size: SM, font })] }));
}
function infoRow(label: string, value: string, color: string, font = 'Arial', stripe = false): TableRow {
  const lw = Math.round(W * 0.35); const vw = W - lw;
  return new TableRow({ children: [
    new TableCell({ borders, width: { size: lw, type: WidthType.DXA }, shading: { fill: color, type: ShadingType.CLEAR }, margins: CM, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: SM, font, color: 'FFFFFF' })] })] }),
    new TableCell({ borders, width: { size: vw, type: WidthType.DXA }, shading: stripe ? { fill: ZEBRA, type: ShadingType.CLEAR } : undefined, margins: CM, children: [new Paragraph({ children: [new TextRun({ text: value || '', size: SM, font })] })] }),
  ] });
}
function infoTable(rows: Array<{ label: string; value: string }>, color: string, font = 'Arial'): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map((r, i) => infoRow(r.label, r.value, color, font, i % 2 === 1)) });
}

// ── Emissions summary table (shared, different colors) ────────────────────
function emissionsSummaryTable(d: CrpData, color: string, font = 'Arial'): Table {
  const cw = [Math.round(W * 0.40), Math.round(W * 0.30), W - Math.round(W * 0.40) - Math.round(W * 0.30)];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Scope', cw[0], color, font), hdrCell('Emissions (tCO₂e)', cw[1], color, font), hdrCell('Change vs Baseline', cw[2], color, font)] }),
    new TableRow({ children: [dCell('Scope 1 — Direct', cw[0], { font, bold: true }), dCell(d.currentEmissions.scope1.total, cw[1], { font }), dCell(`Baseline: ${d.baselineEmissions.baselineScope1}`, cw[2], { font, color: '666666' })] }),
    new TableRow({ children: [dCell('Scope 2 — Indirect (Energy)', cw[0], { font, bold: true, fill: ZEBRA }), dCell(d.currentEmissions.scope2.total, cw[1], { font, fill: ZEBRA }), dCell(`Baseline: ${d.baselineEmissions.baselineScope2}`, cw[2], { font, color: '666666', fill: ZEBRA })] }),
    new TableRow({ children: [dCell('Scope 3 — Value Chain', cw[0], { font, bold: true }), dCell(d.currentEmissions.scope3.total, cw[1], { font }), dCell(`Baseline: ${d.baselineEmissions.baselineScope3}`, cw[2], { font, color: '666666' })] }),
    new TableRow({ children: [
      new TableCell({ borders, width: { size: cw[0], type: WidthType.DXA }, shading: { fill: color, type: ShadingType.CLEAR }, margins: CM, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL UK OPERATIONS', bold: true, size: SM, font, color: 'FFFFFF' })] })] }),
      new TableCell({ borders, width: { size: cw[1], type: WidthType.DXA }, shading: { fill: color, type: ShadingType.CLEAR }, margins: CM, children: [new Paragraph({ children: [new TextRun({ text: `${d.currentEmissions.totalCurrentEmissions} tCO₂e`, bold: true, size: SM, font, color: 'FFFFFF' })] })] }),
      new TableCell({ borders, width: { size: cw[2], type: WidthType.DXA }, shading: { fill: color, type: ShadingType.CLEAR }, margins: CM, children: [new Paragraph({ children: [new TextRun({ text: `Baseline: ${d.baselineEmissions.totalBaselineUKOperations}`, size: SM, font, color: 'FFFFFF' })] })] }),
    ] }),
  ] });
}

// ── Initiatives table (shared) ────────────────────────────────────────────
function initiativesTable(items: any[], color: string, font: string, isPlanned = false): (Paragraph | Table)[] {
  if (items.length === 0) return [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'None recorded.', size: SM, font, italics: true, color: '999999' })] })];
  const cw = isPlanned
    ? [Math.round(W * 0.22), Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.12), Math.round(W * 0.12), W - Math.round(W * 0.22) - Math.round(W * 0.10) - Math.round(W * 0.10) - Math.round(W * 0.12) - Math.round(W * 0.12)]
    : [Math.round(W * 0.25), Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.13), W - Math.round(W * 0.25) - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.13)];
  const hdrs = isPlanned
    ? [{ t: 'Initiative', w: cw[0] }, { t: 'By', w: cw[1] }, { t: 'Scope', w: cw[2] }, { t: 'Saving (tCO₂e)', w: cw[3] }, { t: 'Investment', w: cw[4] }, { t: 'Description', w: cw[5] }]
    : [{ t: 'Initiative', w: cw[0] }, { t: 'Implemented', w: cw[1] }, { t: 'Scope', w: cw[2] }, { t: 'Saving (tCO₂e)', w: cw[3] }, { t: 'Description', w: cw[4] }];
  return [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: hdrs.map(hd => hdrCell(hd.t, hd.w, color, font)) }),
    ...items.map((item, i) => {
      const vals = isPlanned
        ? [item.initiative, item.plannedImplementation, item.scope, item.estimatedAnnualReduction, item.investmentRequired || '', item.description]
        : [item.initiative, item.dateImplemented, item.scope, item.estimatedAnnualReduction, item.description];
      return new TableRow({ children: vals.map((v: string, ci: number) => dCell(v || '', hdrs[ci].w, { font, fill: i % 2 === 1 ? ZEBRA : undefined })) });
    }),
  ] })];
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — PPN 06/21 Standard (GOV.UK green, Arial, compliance bands)
// ═════════════════════════════════════════════════════════════════════════════
const GOV = '00703C'; const GOV_LIGHT = 'E6F4EC'; const GOV_DARK = '005A30';
function buildT1(d: CrpData): (Paragraph | Table)[] {
  const F = 'Arial';
  const els: (Paragraph | Table)[] = [];

  // Compact header
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: GOV, type: ShadingType.CLEAR }, children: [new TextRun({ text: '  CARBON REDUCTION PLAN', bold: true, size: 36, font: F, color: 'FFFFFF' })] }));
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: GOV, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  PPN 06/21 Compliant  |  ${d.organisationName}`, size: SM, font: F, color: 'D5E8D4' })] }));
  els.push(new Paragraph({ spacing: { after: 60 }, shading: { fill: GOV_DARK, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  Ref: ${d.documentRef}  |  Published: ${d.publicationDate}  |  Review: ${d.reviewDate}`, size: 14, font: F, color: 'B7D6B0' })] }));
  els.push(h.spacer(80));
  els.push(infoTable([
    { label: 'Organisation', value: d.organisationName }, { label: 'Address', value: d.organisationAddress },
    { label: 'Companies House', value: d.companiesHouseNumber }, { label: 'Publication Date', value: d.publicationDate },
    { label: 'Annual Review Date', value: d.reviewDate },
  ], GOV, F));
  els.push(h.spacer(120));

  // Organisation description
  els.push(sectionBand('1. Organisation Overview', GOV, F));
  els.push(...prose(d.organisationDescription, F));

  // Net Zero Commitment
  els.push(sectionBand('2. Net Zero Commitment (PPN 06/21 Mandatory)', GOV, F));
  els.push(new Paragraph({ spacing: { before: 120, after: 80 }, shading: { fill: GOV_LIGHT, type: ShadingType.CLEAR }, children: [
    new TextRun({ text: `  Net Zero Target: ${d.netZeroCommitment.targetYear}  |  2030 Interim: ${d.netZeroCommitment.interimTarget2030}  |  SBTi Aligned: ${d.netZeroCommitment.alignedWithSBTi ? 'Yes' : 'No'}`, bold: true, size: SM, font: F, color: GOV }),
  ] }));
  els.push(...prose(d.netZeroCommitment.commitment, F));
  els.push(subHead('Governance & Accountability', GOV, F));
  els.push(...prose(d.netZeroCommitment.governanceStatement, F));

  // Baseline
  els.push(sectionBand('3. Baseline Emissions Footprint', GOV, F));
  els.push(infoTable([
    { label: 'Baseline Year', value: d.baselineEmissions.baselineYear },
    { label: 'Scope 1', value: `${d.baselineEmissions.baselineScope1} tCO₂e` },
    { label: 'Scope 2', value: `${d.baselineEmissions.baselineScope2} tCO₂e` },
    { label: 'Scope 3', value: `${d.baselineEmissions.baselineScope3} tCO₂e` },
    { label: 'Total UK Operations', value: `${d.baselineEmissions.totalBaselineUKOperations} tCO₂e` },
  ], GOV, F));
  els.push(h.spacer(80));
  els.push(...prose(d.baselineEmissions.baselineNarrative, F));

  // Current Emissions
  els.push(sectionBand('4. Current Emissions Reporting', GOV, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: `Reporting Year: ${d.currentEmissions.reportingYear}`, bold: true, size: BODY, font: F, color: GOV })] }));
  els.push(emissionsSummaryTable(d, GOV, F));
  els.push(h.spacer(80));
  els.push(subHead('Scope 1 — Direct Emissions', GOV, F));
  els.push(...prose(d.currentEmissions.scope1.narrative, F));
  if (d.currentEmissions.scope1.sources.length > 0) {
    const sw = [Math.round(W * 0.25), Math.round(W * 0.25), Math.round(W * 0.25), W - Math.round(W * 0.75)];
    els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Source', sw[0], GOV, F), hdrCell('Activity Data', sw[1], GOV, F), hdrCell('Emission Factor', sw[2], GOV, F), hdrCell('tCO₂e', sw[3], GOV, F)] }),
      ...d.currentEmissions.scope1.sources.map((src, i) => new TableRow({ children: [dCell(src.source, sw[0], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(src.activity, sw[1], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(src.emissionFactor, sw[2], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(src.tCO2e, sw[3], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined })] })),
    ] }));
  }
  els.push(subHead('Scope 2 — Indirect Energy Emissions', GOV, F));
  els.push(...prose(d.currentEmissions.scope2.narrative, F));
  els.push(subHead('Scope 3 — Value Chain Emissions', GOV, F));
  els.push(...prose(d.currentEmissions.scope3.narrative, F));
  if (d.currentEmissions.scope3.categories.length > 0) {
    const s3w = [Math.round(W * 0.10), Math.round(W * 0.30), Math.round(W * 0.15), Math.round(W * 0.15), W - Math.round(W * 0.70)];
    els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Cat.', s3w[0], GOV, F), hdrCell('Category Name', s3w[1], GOV, F), hdrCell('tCO₂e', s3w[2], GOV, F), hdrCell('Data Quality', s3w[3], GOV, F), hdrCell('Methodology', s3w[4], GOV, F)] }),
      ...d.currentEmissions.scope3.categories.map((cat, i) => new TableRow({ children: [dCell(cat.categoryNumber, s3w[0], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.categoryName, s3w[1], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.tCO2e, s3w[2], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.dataQuality, s3w[3], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.methodology, s3w[4], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined })] })),
    ] }));
  }

  // Reduction Initiatives
  els.push(sectionBand('5. Carbon Reduction Measures', GOV, F));
  els.push(subHead('Completed Initiatives', GOV, F));
  els.push(...initiativesTable(d.emissionsReductionInitiatives.completed, GOV, F));
  els.push(subHead('Planned Initiatives', GOV, F));
  els.push(...initiativesTable(d.emissionsReductionInitiatives.planned, GOV, F, true));

  // Targets
  els.push(sectionBand('6. Carbon Reduction Targets', GOV, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 80 }, shading: { fill: GOV_LIGHT, type: ShadingType.CLEAR }, children: [
    new TextRun({ text: `  2030 Target: ${d.carbonReductionTargets.target2030.absoluteReductionTarget} reduction  |  Net Zero by ${d.carbonReductionTargets.targetNetZero.year}`, bold: true, size: SM, font: F, color: GOV }),
  ] }));
  els.push(...prose(d.carbonReductionTargets.target2030.pathway, F));
  els.push(subHead('Residual Emissions Strategy', GOV, F));
  els.push(...prose(d.carbonReductionTargets.targetNetZero.residualEmissionsStrategy, F));

  // Supply Chain + Reporting
  els.push(sectionBand('7. Supply Chain Engagement', GOV, F));
  els.push(...prose(d.supplyChainEngagement, F));
  els.push(sectionBand('8. Reporting & Measurement', GOV, F));
  els.push(...prose(d.reportingAndMeasurement, F));

  // Board Sign-Off
  els.push(sectionBand('9. Board-Level Sign-Off (PPN 06/21 Mandatory)', GOV, F));
  els.push(infoTable([
    { label: 'Signatory', value: d.boardSignOff.signatoryName },
    { label: 'Title', value: d.boardSignOff.signatoryTitle },
    { label: 'Date', value: d.boardSignOff.signOffDate },
  ], GOV, F));
  els.push(h.spacer(80));
  els.push(...prose(d.boardSignOff.signOffStatement, F));
  els.push(h.spacer(100));
  els.push(h.approvalTable([{ role: d.boardSignOff.signatoryTitle || 'Director', name: d.boardSignOff.signatoryName || '' }], W));

  if (d.additionalNotes) { els.push(sectionBand('10. Additional Notes', GOV, F)); els.push(...prose(d.additionalNotes, F)); }

  return els;
}

// ═════════════════════════════════════════════════════════════════════════════
// T2 — SBTi Aligned (corporate navy, Calibri, KPI boxes)
// ═════════════════════════════════════════════════════════════════════════════
const NAVY = '1A3C6E'; const NAVY_LIGHT = 'E8EDF5'; const NAVY_ACC = '2E86DE';
function buildT2(d: CrpData): (Paragraph | Table)[] {
  const F = 'Calibri';
  const els: (Paragraph | Table)[] = [];

  // Navy header block
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new TextRun({ text: '  CARBON REDUCTION PLAN', bold: true, size: 36, font: F, color: 'FFFFFF' })] }));
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  Science Based Targets initiative (SBTi) Aligned  |  ${d.organisationName}`, size: SM, font: F, color: '93C5FD' })] }));
  els.push(new Paragraph({ spacing: { after: 60 }, shading: { fill: NAVY_ACC, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  ${d.documentRef}  |  ${d.publicationDate}  |  Review: ${d.reviewDate}`, size: 14, font: F, color: 'DBEAFE' })] }));

  // KPI Strip
  const kpiW = Math.round(W / 4);
  els.push(h.spacer(80));
  els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [
      new TableCell({ borders: noBorders, width: { size: kpiW, type: WidthType.DXA }, shading: { fill: NAVY_LIGHT, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 100, right: 100 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.currentEmissions.totalCurrentEmissions || '—', bold: true, size: XL, font: F, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'tCO₂e Current', size: 14, font: F, color: '6B7280' })] }),
      ] }),
      new TableCell({ borders: noBorders, width: { size: kpiW, type: WidthType.DXA }, shading: { fill: NAVY_LIGHT, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 100, right: 100 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.carbonReductionTargets.target2030.absoluteReductionTarget || '—', bold: true, size: XL, font: F, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2030 Target', size: 14, font: F, color: '6B7280' })] }),
      ] }),
      new TableCell({ borders: noBorders, width: { size: kpiW, type: WidthType.DXA }, shading: { fill: NAVY_LIGHT, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 100, right: 100 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.carbonReductionTargets.targetNetZero.year || '2050', bold: true, size: XL, font: F, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Net Zero Year', size: 14, font: F, color: '6B7280' })] }),
      ] }),
      new TableCell({ borders: noBorders, width: { size: W - 3 * kpiW, type: WidthType.DXA }, shading: { fill: NAVY_LIGHT, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 100, right: 100 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.netZeroCommitment.alignedWithSBTi ? '✓ Yes' : '✗ No', bold: true, size: XL, font: F, color: d.netZeroCommitment.alignedWithSBTi ? '059669' : 'DC2626' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SBTi Aligned', size: 14, font: F, color: '6B7280' })] }),
      ] }),
    ] }),
  ] }));
  els.push(h.spacer(120));

  // Sections
  els.push(sectionBand('1. Organisational Boundary', NAVY, F));
  els.push(infoTable([{ label: 'Organisation', value: d.organisationName }, { label: 'Address', value: d.organisationAddress }, { label: 'Companies House', value: d.companiesHouseNumber }], NAVY, F));
  els.push(h.spacer(80));
  els.push(...prose(d.organisationDescription, F));

  els.push(sectionBand('2. SBTi Target Summary', NAVY, F));
  els.push(...prose(d.netZeroCommitment.commitment, F));
  els.push(subHead('Governance & Accountability', NAVY, F));
  els.push(...prose(d.netZeroCommitment.governanceStatement, F));

  els.push(sectionBand('3. Baseline Emissions', NAVY, F));
  els.push(infoTable([{ label: 'Baseline Year', value: d.baselineEmissions.baselineYear }, { label: 'Scope 1', value: `${d.baselineEmissions.baselineScope1} tCO₂e` }, { label: 'Scope 2', value: `${d.baselineEmissions.baselineScope2} tCO₂e` }, { label: 'Scope 3', value: `${d.baselineEmissions.baselineScope3} tCO₂e` }, { label: 'Total', value: `${d.baselineEmissions.totalBaselineUKOperations} tCO₂e` }], NAVY, F));
  els.push(h.spacer(80));
  els.push(...prose(d.baselineEmissions.baselineNarrative, F));

  els.push(sectionBand('4. Current Emissions Analysis', NAVY, F));
  els.push(emissionsSummaryTable(d, NAVY, F));
  els.push(h.spacer(80));
  els.push(subHead('Scope 1 Detail', NAVY, F)); els.push(...prose(d.currentEmissions.scope1.narrative, F));
  els.push(subHead('Scope 2 Detail', NAVY, F)); els.push(...prose(d.currentEmissions.scope2.narrative, F));
  els.push(subHead('Scope 3 Screening', NAVY, F)); els.push(...prose(d.currentEmissions.scope3.narrative, F));
  if (d.currentEmissions.scope3.categories.length > 0) {
    const s3w = [Math.round(W * 0.10), Math.round(W * 0.30), Math.round(W * 0.15), Math.round(W * 0.15), W - Math.round(W * 0.70)];
    els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Cat.', s3w[0], NAVY, F), hdrCell('Category', s3w[1], NAVY, F), hdrCell('tCO₂e', s3w[2], NAVY, F), hdrCell('Quality', s3w[3], NAVY, F), hdrCell('Method', s3w[4], NAVY, F)] }),
      ...d.currentEmissions.scope3.categories.map((cat, i) => new TableRow({ children: [dCell(cat.categoryNumber, s3w[0], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.categoryName, s3w[1], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.tCO2e, s3w[2], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.dataQuality, s3w[3], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.methodology, s3w[4], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined })] })),
    ] }));
  }

  els.push(sectionBand('5. Decarbonisation Pathway', NAVY, F));
  els.push(subHead('2030 Target Pathway', NAVY, F));
  els.push(...prose(d.carbonReductionTargets.target2030.pathway, F));
  els.push(subHead('Net Zero Residual Emissions Strategy', NAVY, F));
  els.push(...prose(d.carbonReductionTargets.targetNetZero.residualEmissionsStrategy, F));

  els.push(sectionBand('6. Reduction Initiatives', NAVY, F));
  els.push(subHead('Completed', NAVY, F)); els.push(...initiativesTable(d.emissionsReductionInitiatives.completed, NAVY, F));
  els.push(subHead('Planned', NAVY, F)); els.push(...initiativesTable(d.emissionsReductionInitiatives.planned, NAVY, F, true));

  els.push(sectionBand('7. Supply Chain & Reporting', NAVY, F));
  els.push(subHead('Supply Chain Engagement', NAVY, F)); els.push(...prose(d.supplyChainEngagement, F));
  els.push(subHead('Reporting & Measurement', NAVY, F)); els.push(...prose(d.reportingAndMeasurement, F));

  els.push(sectionBand('8. Board Governance & Sign-Off', NAVY, F));
  els.push(infoTable([{ label: 'Signatory', value: d.boardSignOff.signatoryName }, { label: 'Title', value: d.boardSignOff.signatoryTitle }, { label: 'Date', value: d.boardSignOff.signOffDate }], NAVY, F));
  els.push(h.spacer(80));
  els.push(...prose(d.boardSignOff.signOffStatement, F));
  els.push(h.spacer(100));
  els.push(h.approvalTable([{ role: d.boardSignOff.signatoryTitle || 'Director', name: d.boardSignOff.signatoryName || '' }], W));

  if (d.additionalNotes) { els.push(sectionBand('9. Additional Notes', NAVY, F)); els.push(...prose(d.additionalNotes, F)); }

  return els;
}

// ═════════════════════════════════════════════════════════════════════════════
// T3 — ISO 14064 Compliant (charcoal + red clauses, Cambria, doc control)
// ═════════════════════════════════════════════════════════════════════════════
const CHAR = '2C3E50'; const RED = 'C0392B'; const CHAR_LIGHT = 'ECF0F1';
function buildT3(d: CrpData): (Paragraph | Table)[] {
  const F = 'Cambria';
  const els: (Paragraph | Table)[] = [];

  // Formal charcoal header
  els.push(new Paragraph({ spacing: { after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: RED } }, children: [] }));
  els.push(new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'CARBON REDUCTION PLAN', bold: true, size: 40, font: F, color: CHAR })] }));
  els.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'ISO 14064-1:2018 Compliant  |  GHG Quantification & Reporting', size: SM, font: F, color: '7F8C8D' })] }));

  // Document control table
  const dcw = [Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.20), W - Math.round(W * 0.80)];
  els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Doc Ref', dcw[0], CHAR, F), hdrCell('Revision', dcw[1], CHAR, F), hdrCell('Date', dcw[2], CHAR, F), hdrCell('Prepared By', dcw[3], CHAR, F), hdrCell('Status', dcw[4], CHAR, F)] }),
    new TableRow({ children: [dCell(d.documentRef, dcw[0], { font: F }), dCell('Rev 01', dcw[1], { font: F }), dCell(d.publicationDate, dcw[2], { font: F }), dCell(d.boardSignOff.signatoryName, dcw[3], { font: F }), dCell('Published', dcw[4], { font: F, bold: true, color: RED })] }),
  ] }));
  els.push(h.spacer(80));
  els.push(infoTable([{ label: 'Organisation', value: d.organisationName }, { label: 'Address', value: d.organisationAddress }, { label: 'Companies House', value: d.companiesHouseNumber }, { label: 'Review Date', value: d.reviewDate }], CHAR, F));
  els.push(h.spacer(120));

  // ISO clause structure with red numbering
  function isoClause(num: string, title: string): Paragraph {
    return new Paragraph({ spacing: { before: 280, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: CHAR } }, children: [
      new TextRun({ text: `${num}  `, bold: true, size: 22, font: F, color: RED }),
      new TextRun({ text: title, bold: true, size: 22, font: F, color: CHAR }),
    ] });
  }

  els.push(isoClause('1.0', 'Organisational Boundary & Consolidation Approach'));
  els.push(...prose(d.organisationDescription, F));

  els.push(isoClause('2.0', 'Net Zero Commitment'));
  els.push(...prose(d.netZeroCommitment.commitment, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `2.1  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Governance Statement', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...prose(d.netZeroCommitment.governanceStatement, F));

  els.push(isoClause('3.0', 'Base Year Emissions & Recalculation Policy (Clause 5.4)'));
  els.push(infoTable([{ label: 'Baseline Year', value: d.baselineEmissions.baselineYear }, { label: 'Scope 1', value: `${d.baselineEmissions.baselineScope1} tCO₂e` }, { label: 'Scope 2', value: `${d.baselineEmissions.baselineScope2} tCO₂e` }, { label: 'Scope 3', value: `${d.baselineEmissions.baselineScope3} tCO₂e` }, { label: 'Total UK Operations', value: `${d.baselineEmissions.totalBaselineUKOperations} tCO₂e` }], CHAR, F));
  els.push(h.spacer(80));
  els.push(...prose(d.baselineEmissions.baselineNarrative, F));

  els.push(isoClause('4.0', 'Current Period GHG Inventory (Clause 5.2–5.3)'));
  els.push(emissionsSummaryTable(d, CHAR, F));
  els.push(h.spacer(80));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `4.1  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Scope 1 — Direct GHG Emissions', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...prose(d.currentEmissions.scope1.narrative, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `4.2  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Scope 2 — Energy Indirect GHG Emissions', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...prose(d.currentEmissions.scope2.narrative, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `4.3  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Scope 3 — Other Indirect GHG Emissions', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...prose(d.currentEmissions.scope3.narrative, F));
  if (d.currentEmissions.scope3.categories.length > 0) {
    const s3w = [Math.round(W * 0.10), Math.round(W * 0.30), Math.round(W * 0.15), Math.round(W * 0.15), W - Math.round(W * 0.70)];
    els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Cat.', s3w[0], CHAR, F), hdrCell('Category', s3w[1], CHAR, F), hdrCell('tCO₂e', s3w[2], CHAR, F), hdrCell('Quality', s3w[3], CHAR, F), hdrCell('Method', s3w[4], CHAR, F)] }),
      ...d.currentEmissions.scope3.categories.map((cat, i) => new TableRow({ children: [dCell(cat.categoryNumber, s3w[0], { font: F, bold: true, color: RED, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.categoryName, s3w[1], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.tCO2e, s3w[2], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.dataQuality, s3w[3], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.methodology, s3w[4], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined })] })),
    ] }));
  }

  els.push(isoClause('5.0', 'Reduction Targets & Planned Actions'));
  els.push(...prose(d.carbonReductionTargets.target2030.pathway, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `5.1  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Completed Initiatives', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...initiativesTable(d.emissionsReductionInitiatives.completed, CHAR, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `5.2  `, bold: true, size: SM, font: F, color: RED }), new TextRun({ text: 'Planned Initiatives', bold: true, size: SM, font: F, color: CHAR })] }));
  els.push(...initiativesTable(d.emissionsReductionInitiatives.planned, CHAR, F, true));

  els.push(isoClause('6.0', 'Supply Chain & Reporting'));
  els.push(...prose(d.supplyChainEngagement, F));
  els.push(...prose(d.reportingAndMeasurement, F));

  els.push(isoClause('7.0', 'Verification Readiness & Board Sign-Off'));
  els.push(infoTable([{ label: 'Signatory', value: d.boardSignOff.signatoryName }, { label: 'Title', value: d.boardSignOff.signatoryTitle }, { label: 'Date', value: d.boardSignOff.signOffDate }], CHAR, F));
  els.push(h.spacer(80));
  els.push(...prose(d.boardSignOff.signOffStatement, F));
  els.push(h.approvalTable([{ role: d.boardSignOff.signatoryTitle || 'Director', name: d.boardSignOff.signatoryName || '' }], W));

  if (d.additionalNotes) { els.push(isoClause('8.0', 'Additional Notes')); els.push(...prose(d.additionalNotes, F)); }

  return els;
}

// ═════════════════════════════════════════════════════════════════════════════
// T4 — GHG Protocol Corporate (dark teal + lighter teal, Calibri)
// ═════════════════════════════════════════════════════════════════════════════
const TEAL_D = '004D40'; const TEAL = '00897B'; const TEAL_LIGHT = 'E0F2F1';
function buildT4(d: CrpData): (Paragraph | Table)[] {
  const F = 'Calibri';
  const els: (Paragraph | Table)[] = [];

  // Teal header block
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: TEAL_D, type: ShadingType.CLEAR }, children: [new TextRun({ text: '  CARBON REDUCTION PLAN', bold: true, size: 36, font: F, color: 'FFFFFF' })] }));
  els.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: TEAL_D, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  GHG Protocol Corporate Standard  |  ${d.organisationName}`, size: SM, font: F, color: '80CBC4' })] }));
  els.push(new Paragraph({ spacing: { after: 60 }, shading: { fill: TEAL, type: ShadingType.CLEAR }, children: [new TextRun({ text: `  ${d.documentRef}  |  ${d.publicationDate}  |  Annual Review: ${d.reviewDate}`, size: 14, font: F, color: 'B2DFDB' })] }));
  els.push(h.spacer(80));
  els.push(infoTable([{ label: 'Organisation', value: d.organisationName }, { label: 'Address', value: d.organisationAddress }, { label: 'Companies House', value: d.companiesHouseNumber }, { label: 'Consolidation Approach', value: 'Operational Control' }], TEAL_D, F));
  els.push(h.spacer(120));

  els.push(sectionBand('1. Company Profile & Inventory Boundaries', TEAL, F));
  els.push(...prose(d.organisationDescription, F));

  els.push(sectionBand('2. Net Zero Commitment', TEAL, F));
  els.push(new Paragraph({ spacing: { before: 80, after: 80 }, shading: { fill: TEAL_LIGHT, type: ShadingType.CLEAR }, children: [
    new TextRun({ text: `  Target Year: ${d.netZeroCommitment.targetYear}  |  2030: ${d.netZeroCommitment.interimTarget2030}  |  SBTi: ${d.netZeroCommitment.alignedWithSBTi ? 'Yes' : 'No'}`, bold: true, size: SM, font: F, color: TEAL_D }),
  ] }));
  els.push(...prose(d.netZeroCommitment.commitment, F));
  els.push(subHead('Governance', TEAL, F));
  els.push(...prose(d.netZeroCommitment.governanceStatement, F));

  els.push(sectionBand('3. Baseline Emissions', TEAL, F));
  els.push(infoTable([{ label: 'Baseline Year', value: d.baselineEmissions.baselineYear }, { label: 'Scope 1', value: `${d.baselineEmissions.baselineScope1} tCO₂e` }, { label: 'Scope 2', value: `${d.baselineEmissions.baselineScope2} tCO₂e` }, { label: 'Scope 3', value: `${d.baselineEmissions.baselineScope3} tCO₂e` }, { label: 'Total', value: `${d.baselineEmissions.totalBaselineUKOperations} tCO₂e` }], TEAL_D, F));
  els.push(h.spacer(80));
  els.push(...prose(d.baselineEmissions.baselineNarrative, F));

  els.push(sectionBand('4. GHG Inventory Summary (All Scopes)', TEAL, F));
  els.push(emissionsSummaryTable(d, TEAL_D, F));
  els.push(h.spacer(80));
  els.push(subHead('Scope 1', TEAL, F)); els.push(...prose(d.currentEmissions.scope1.narrative, F));
  els.push(subHead('Scope 2', TEAL, F)); els.push(...prose(d.currentEmissions.scope2.narrative, F));

  els.push(sectionBand('5. Scope 3 Category Screening (15 Categories)', TEAL, F));
  els.push(...prose(d.currentEmissions.scope3.narrative, F));
  if (d.currentEmissions.scope3.categories.length > 0) {
    const s3w = [Math.round(W * 0.10), Math.round(W * 0.30), Math.round(W * 0.15), Math.round(W * 0.15), W - Math.round(W * 0.70)];
    els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Cat.', s3w[0], TEAL_D, F), hdrCell('Category', s3w[1], TEAL_D, F), hdrCell('tCO₂e', s3w[2], TEAL_D, F), hdrCell('Quality', s3w[3], TEAL_D, F), hdrCell('Method', s3w[4], TEAL_D, F)] }),
      ...d.currentEmissions.scope3.categories.map((cat, i) => new TableRow({ children: [dCell(cat.categoryNumber, s3w[0], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.categoryName, s3w[1], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.tCO2e, s3w[2], { font: F, bold: true, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.dataQuality, s3w[3], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined }), dCell(cat.methodology, s3w[4], { font: F, fill: i % 2 === 1 ? ZEBRA : undefined })] })),
    ] }));
  }

  els.push(sectionBand('6. Reduction Roadmap', TEAL, F));
  els.push(subHead('2030 Target Pathway', TEAL, F));
  els.push(...prose(d.carbonReductionTargets.target2030.pathway, F));
  els.push(subHead('Net Zero Strategy', TEAL, F));
  els.push(...prose(d.carbonReductionTargets.targetNetZero.residualEmissionsStrategy, F));

  els.push(sectionBand('7. Completed & Planned Initiatives', TEAL, F));
  els.push(subHead('Completed', TEAL, F)); els.push(...initiativesTable(d.emissionsReductionInitiatives.completed, TEAL_D, F));
  els.push(subHead('Planned', TEAL, F)); els.push(...initiativesTable(d.emissionsReductionInitiatives.planned, TEAL_D, F, true));

  els.push(sectionBand('8. Supply Chain & Governance', TEAL, F));
  els.push(subHead('Supply Chain Decarbonisation', TEAL, F)); els.push(...prose(d.supplyChainEngagement, F));
  els.push(subHead('Reporting Cycle', TEAL, F)); els.push(...prose(d.reportingAndMeasurement, F));

  els.push(sectionBand('9. Board Sign-Off', TEAL, F));
  els.push(infoTable([{ label: 'Signatory', value: d.boardSignOff.signatoryName }, { label: 'Title', value: d.boardSignOff.signatoryTitle }, { label: 'Date', value: d.boardSignOff.signOffDate }], TEAL_D, F));
  els.push(h.spacer(80));
  els.push(...prose(d.boardSignOff.signOffStatement, F));
  els.push(h.approvalTable([{ role: d.boardSignOff.signatoryTitle || 'Director', name: d.boardSignOff.signatoryName || '' }], W));

  if (d.additionalNotes) { els.push(sectionBand('10. Additional Notes', TEAL, F)); els.push(...prose(d.additionalNotes, F)); }

  return els;
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
const TEMPLATE_LABELS: Record<CrpTemplateSlug, { label: string; font: string }> = {
  'ppn-0621-standard': { label: 'Carbon Reduction Plan — PPN 06/21', font: 'Arial' },
  'sbti-aligned': { label: 'Carbon Reduction Plan — SBTi Aligned', font: 'Calibri' },
  'iso-14064-compliant': { label: 'Carbon Reduction Plan — ISO 14064', font: 'Cambria' },
  'ghg-protocol-corporate': { label: 'Carbon Reduction Plan — GHG Protocol', font: 'Calibri' },
};

export async function buildCrpTemplateDocument(content: any, templateSlug: CrpTemplateSlug): Promise<Document> {
  const d = extract(content);
  const { label, font } = TEMPLATE_LABELS[templateSlug];

  let children: (Paragraph | Table)[];
  switch (templateSlug) {
    case 'ppn-0621-standard': children = buildT1(d); break;
    case 'sbti-aligned': children = buildT2(d); break;
    case 'iso-14064-compliant': children = buildT3(d); break;
    case 'ghg-protocol-corporate': children = buildT4(d); break;
    default: children = buildT1(d);
  }

  return new Document({
    styles: { default: { document: { run: { font, size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader(label) },
      footers: { default: h.ebroraFooter() },
      children,
    }],
  });
}
