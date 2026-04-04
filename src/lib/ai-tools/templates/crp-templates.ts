// =============================================================================
// Carbon Reduction Plan Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — PPN 06/21 Standard       (GOV.UK green #00703C, Arial, compliance, ~4pp)
// T2 — SBTi Aligned             (deep navy #1A3C6E, Calibri, science-based, ~4pp)
// T3 — ISO 14064 Compliant      (charcoal #2C3E50 + red #C0392B, Cambria, ~4pp)
// T4 — GHG Protocol Corporate   (teal #00897B / dark #004D40, Calibri, ~4pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CrpTemplateSlug } from '@/lib/carbon-reduction/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

const GOV = '00703C'; const GOV_SUB = 'A7F3D0'; const GOV_BG = 'F0FFF4';
const NAVY = '1A3C6E'; const NAVY_SUB = 'BFDBFE'; const NAVY_BG = 'EFF6FF';
const CHAR = '2C3E50'; const RED_C = 'C0392B'; const RED_BG = 'FDEDEC';
const TEAL_C = '00897B'; const TEAL_D = '004D40'; const TEAL_SUB = '80CBC4'; const TEAL_BG = 'E0F2F1';
const S1_BLUE = '1D4ED8'; const S2_PURP = '7C3AED'; const S3_GREEN = '059669';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ───────────────────────────────────────────────────────────
interface CrpData {
  documentRef: string; publicationDate: string; reviewDate: string;
  organisationName: string; organisationAddress: string; companiesHouseNumber: string;
  organisationDescription: string; currentProject: string; framework: string;
  sicCode: string; baselineYear: string;
  netZeroCommitment: { commitment: string; targetYear: string; interimTarget2030: string; scope3Target2030?: string; alignedWithSBTi: boolean; governanceStatement: string };
  baselineEmissions: { baselineYear: string; baselineScope1: string; baselineScope2: string; baselineScope3: string; totalBaselineUKOperations: string; baselineNarrative: string };
  currentEmissions: {
    reportingYear: string;
    scope1: { total: string; narrative: string; sources: Array<{ source: string; activity?: string; quantity?: string; emissionFactor: string; tCO2e: string }> };
    scope2: { total: string; method: string; narrative: string; sources: Array<{ source: string; kWh: string; tariff: string; tCO2e: string }> };
    scope3: { total: string; narrative: string; materiality?: string; categories: Array<{ categoryNumber: string; categoryName: string; tCO2e: string; dataQuality: string; methodology?: string; relevant?: string }> };
    totalCurrentEmissions: string;
  };
  emissionsReductionInitiatives: {
    completed: Array<{ initiative: string; dateImplemented: string; scope: string; estimatedAnnualReduction: string; description?: string }>;
    planned: Array<{ initiative: string; plannedImplementation: string; scope: string; estimatedAnnualReduction: string; investmentRequired?: string; description?: string }>;
  };
  carbonReductionTargets: {
    target2030: { absoluteReductionTarget: string; targetTCO2e: string; pathway: string };
    targetNetZero: { year: string; scope: string; residualEmissionsStrategy: string };
  };
  decarbonisationPathway: Array<{ year: string; scope12: string; scope3: string; total: string; intensity?: string; interventions?: string }>;
  supplyChainEngagement: string;
  reportingAndMeasurement: string;
  boardSignOff: { signatoryName: string; signatoryTitle: string; signOffDate: string; signOffStatement: string };
  // ISO 14064 T3 fields
  consolidationApproach: string; organisationalBoundary: string;
  ghgSourceIdentification: Array<{ isoCategory: string; ghgSource: string; ghgSpecies: string; classification: string }>;
  quantificationMethodology: string;
  quantificationTable: Array<{ source: string; activityData: string; efSource: string; dataQuality: string; tCO2e: string }>;
  baseYearRecalcPolicy: string; uncertaintyAssessment: string;
  verificationStatement: string;
  // SBTi T2 fields
  sbtiStatus: string; nearTermPathway: string;
  scope12Analysis: string; scope2Analysis: string;
  governanceNarrative: string;
  kpiItems: Array<{ value: string; label: string; sublabel?: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CrpData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const o = (k: string) => (typeof c?.[k] === 'object' && c[k] !== null ? c[k] : {});
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  const so = (obj: any, k: string, fb = '') => (typeof obj?.[k] === 'string' ? obj[k] : fb);
  const ao = (obj: any, k: string) => (Array.isArray(obj?.[k]) ? obj[k] : []);
  const nz = o('netZeroCommitment'); const be = o('baselineEmissions');
  const ce = o('currentEmissions'); const eri = o('emissionsReductionInitiatives');
  const crt = o('carbonReductionTargets');
  return {
    documentRef: s('documentRef', 'CRP-001'), publicationDate: s('publicationDate'), reviewDate: s('reviewDate'),
    organisationName: s('organisationName'), organisationAddress: s('organisationAddress'),
    companiesHouseNumber: s('companiesHouseNumber'), organisationDescription: s('organisationDescription'),
    currentProject: s('currentProject'), framework: s('framework'), sicCode: s('sicCode'),
    baselineYear: s('baselineYear') || so(be, 'baselineYear'),
    netZeroCommitment: { commitment: so(nz, 'commitment'), targetYear: so(nz, 'targetYear', '2050'), interimTarget2030: so(nz, 'interimTarget2030'), scope3Target2030: so(nz, 'scope3Target2030'), alignedWithSBTi: nz?.alignedWithSBTi ?? false, governanceStatement: so(nz, 'governanceStatement') },
    baselineEmissions: { baselineYear: so(be, 'baselineYear'), baselineScope1: so(be, 'baselineScope1'), baselineScope2: so(be, 'baselineScope2'), baselineScope3: so(be, 'baselineScope3'), totalBaselineUKOperations: so(be, 'totalBaselineUKOperations'), baselineNarrative: so(be, 'baselineNarrative') },
    currentEmissions: {
      reportingYear: so(ce, 'reportingYear'), scope1: { total: so(ce?.scope1, 'total'), narrative: so(ce?.scope1, 'narrative'), sources: ao(ce?.scope1, 'sources') },
      scope2: { total: so(ce?.scope2, 'total'), method: so(ce?.scope2, 'method'), narrative: so(ce?.scope2, 'narrative'), sources: ao(ce?.scope2, 'sources') },
      scope3: { total: so(ce?.scope3, 'total'), narrative: so(ce?.scope3, 'narrative'), materiality: so(ce?.scope3, 'materiality'), categories: ao(ce?.scope3, 'categories') },
      totalCurrentEmissions: so(ce, 'totalCurrentEmissions'),
    },
    emissionsReductionInitiatives: { completed: ao(eri, 'completed'), planned: ao(eri, 'planned') },
    carbonReductionTargets: {
      target2030: { absoluteReductionTarget: so(crt?.target2030, 'absoluteReductionTarget'), targetTCO2e: so(crt?.target2030, 'targetTCO2e'), pathway: so(crt?.target2030, 'pathway') },
      targetNetZero: { year: so(crt?.targetNetZero, 'year', '2050'), scope: so(crt?.targetNetZero, 'scope'), residualEmissionsStrategy: so(crt?.targetNetZero, 'residualEmissionsStrategy') },
    },
    decarbonisationPathway: a('decarbonisationPathway'),
    supplyChainEngagement: s('supplyChainEngagement'), reportingAndMeasurement: s('reportingAndMeasurement'),
    boardSignOff: { signatoryName: so(o('boardSignOff'), 'signatoryName'), signatoryTitle: so(o('boardSignOff'), 'signatoryTitle'), signOffDate: so(o('boardSignOff'), 'signOffDate'), signOffStatement: so(o('boardSignOff'), 'signOffStatement') },
    consolidationApproach: s('consolidationApproach'), organisationalBoundary: s('organisationalBoundary'),
    ghgSourceIdentification: a('ghgSourceIdentification'), quantificationMethodology: s('quantificationMethodology'),
    quantificationTable: a('quantificationTable'), baseYearRecalcPolicy: s('baseYearRecalcPolicy'),
    uncertaintyAssessment: s('uncertaintyAssessment'), verificationStatement: s('verificationStatement'),
    sbtiStatus: s('sbtiStatus'), nearTermPathway: s('nearTermPathway'),
    scope12Analysis: s('scope12Analysis'), scope2Analysis: s('scope2Analysis'),
    governanceNarrative: s('governanceNarrative'), kpiItems: a('kpiItems'), additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string; size?: number }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, color: opts?.color, fontSize: opts?.size ?? SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('measured') || low.includes('yes') || low.includes('relevant') || low.includes('on track') || low.includes('compliant')) { bg = 'D1FAE5'; color = '059669'; }
  else if (low.includes('estimated') || low.includes('behind') || low.includes('partial') || low.includes('minor')) { bg = 'FFFBEB'; color = 'D97706'; }
  else if (low.includes('modelled') || low.includes('not') || low.includes('low') || low.includes('long')) { bg = 'FEF2F2'; color = 'DC2626'; }
  else if (low.includes('n/r') || low.includes('n/a') || low.includes('—')) { bg = 'F3F4F6'; color = '6B7280'; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(h2 => h2.width),
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined, bold: (cell || '').toString().toUpperCase().includes('TOTAL') })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const widths = ratios.map(r => Math.round(W * r));
  widths[widths.length - 1] = W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return widths;
}

// Build combined Scope 1+2+3 source rows for T1
function allSourceRows(d: CrpData): string[][] {
  const rows: string[][] = [];
  for (const s of d.currentEmissions.scope1.sources) { rows.push(['S1', s.source, s.activity || s.quantity || '', s.emissionFactor, s.tCO2e]); }
  for (const s of d.currentEmissions.scope2.sources) { rows.push(['S2', s.source, s.kWh + ' kWh', s.tariff || '', s.tCO2e]); }
  for (const c of d.currentEmissions.scope3.categories) { rows.push(['S3', `Cat ${c.categoryNumber}: ${c.categoryName}`, c.methodology || c.dataQuality, '', c.tCO2e]); }
  return rows;
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — PPN 06/21 STANDARD (GOV.UK green #00703C, Arial)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CrpData): Document {
  const A = GOV;
  const hdr = h.accentHeader('Carbon Reduction Plan \u2014 PPN 06/21', A);
  const ftr = h.accentFooter(d.documentRef, 'PPN 06/21 Standard', A);

  const baseCols = cols([0.30, 0.34, 0.18, 0.18]);
  const srcCols = cols([0.08, 0.30, 0.22, 0.20, 0.20]);
  const compCols = cols([0.36, 0.12, 0.10, 0.42]);
  const planCols = cols([0.30, 0.12, 0.10, 0.18, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CARBON REDUCTION PLAN'], `PPN 06/21 Compliant \u2014 ${d.organisationName || 'Organisation'}`, A, GOV_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Publication Date', value: d.publicationDate },
            { label: 'Annual Review Date', value: d.reviewDate },
            { label: 'Organisation', value: d.organisationName },
            { label: 'Companies House No.', value: d.companiesHouseNumber },
            { label: 'Registered Address', value: d.organisationAddress },
            { label: 'Current Project', value: d.currentProject },
            { label: 'Framework', value: d.framework },
            { label: 'Standard', value: 'PPN 06/21 (Cabinet Office, 30 Sept 2021)' },
            { label: 'Board Signatory', value: `${d.boardSignOff.signatoryName}, ${d.boardSignOff.signatoryTitle}` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Compliance, Org, Net Zero, Baseline
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'PPN 06/21 COMPLIANCE DECLARATION', A), h.spacer(80),
          h.calloutBox(d.netZeroCommitment.commitment || d.boardSignOff.signOffStatement || 'This Carbon Reduction Plan has been completed in accordance with PPN 06/21.', A, GOV_BG, '134e4a', W, { boldPrefix: 'Compliance Statement:' }),
          h.spacer(80), h.fullWidthSectionBar('02', 'ORGANISATION OVERVIEW', A), h.spacer(80),
          ...h.richBodyText(d.organisationDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('03', 'NET ZERO COMMITMENT', A), h.spacer(80),
          ...h.richBodyText(d.netZeroCommitment.governanceStatement || ''),
          h.spacer(80), h.fullWidthSectionBar('04', 'BASELINE EMISSIONS FOOTPRINT', A), h.spacer(80),
          ...h.richBodyText(d.baselineEmissions.baselineNarrative || ''),
          h.spacer(40),
          dataTable(A,
            [{ text: 'EMISSION SCOPE', width: baseCols[0] }, { text: 'SOURCE CATEGORY', width: baseCols[1] }, { text: 'tCO\u2082e', width: baseCols[2] }, { text: '% OF TOTAL', width: baseCols[3] }],
            [
              [`Scope 1 \u2014 Direct`, 'Company fleet, site generators, gas heating', d.baselineEmissions.baselineScope1, ''],
              [`Scope 2 \u2014 Indirect Energy`, 'Purchased electricity', d.baselineEmissions.baselineScope2, ''],
              [`Scope 3 \u2014 Value Chain`, 'Purchased materials, hired plant, travel, waste', d.baselineEmissions.baselineScope3, ''],
              ['TOTAL UK OPERATIONS (BASELINE)', '', d.baselineEmissions.totalBaselineUKOperations, '100%'],
            ]
          ),
          h.spacer(40),
          h.calloutBox(d.baselineEmissions.baselineNarrative || 'Scope 3 emissions dominate the total footprint, typical for civil engineering contractors.', A, GOV_BG, '134e4a', W, { boldPrefix: 'Baseline Narrative:' }),
        ] },
      // Body — Current Emissions, Completed/Planned Initiatives
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('05', `CURRENT EMISSIONS \u2014 ${d.currentEmissions.reportingYear || 'FY2025/26'}`, A), h.spacer(80),
          h.kpiDashboard([
            { value: d.currentEmissions.totalCurrentEmissions || '0', label: 'Total tCO\u2082e' },
            { value: d.currentEmissions.scope1.total || '0', label: 'Scope 1' },
            { value: d.currentEmissions.scope2.total || '0', label: 'Scope 2' },
            { value: d.currentEmissions.scope3.total || '0', label: 'Scope 3' },
          ], A, W),
          h.spacer(60),
          ...(allSourceRows(d).length > 0 ? [dataTable(A,
            [{ text: 'SCOPE', width: srcCols[0] }, { text: 'SOURCE', width: srcCols[1] }, { text: 'ACTIVITY DATA', width: srcCols[2] }, { text: 'EF SOURCE', width: srcCols[3] }, { text: 'tCO\u2082e', width: srcCols[4] }],
            allSourceRows(d)
          )] : []),
          // 06 Completed
          h.spacer(80), h.fullWidthSectionBar('06', 'EMISSIONS REDUCTION INITIATIVES \u2014 COMPLETED', A), h.spacer(80),
          ...(d.emissionsReductionInitiatives.completed.length > 0 ? [dataTable(A,
            [{ text: 'INITIATIVE', width: compCols[0] }, { text: 'DATE', width: compCols[1] }, { text: 'SCOPE', width: compCols[2] }, { text: 'ANNUAL SAVING', width: compCols[3] }],
            d.emissionsReductionInitiatives.completed.map(i => [i.initiative, i.dateImplemented, i.scope, i.estimatedAnnualReduction])
          )] : []),
          // 07 Planned
          h.spacer(80), h.fullWidthSectionBar('07', 'EMISSIONS REDUCTION INITIATIVES \u2014 PLANNED', A), h.spacer(80),
          ...(d.emissionsReductionInitiatives.planned.length > 0 ? [dataTable(A,
            [{ text: 'INITIATIVE', width: planCols[0] }, { text: 'TARGET DATE', width: planCols[1] }, { text: 'SCOPE', width: planCols[2] }, { text: 'SAVING', width: planCols[3] }, { text: 'INVESTMENT', width: planCols[4] }],
            d.emissionsReductionInitiatives.planned.map(i => [i.initiative, i.plannedImplementation, i.scope, i.estimatedAnnualReduction, i.investmentRequired || ''])
          )] : []),
        ] },
      // Body — Targets, Supply Chain, Reporting, Board Sign-Off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('08', 'CARBON REDUCTION TARGETS', A), h.spacer(80),
          h.kpiDashboard([
            { value: d.netZeroCommitment.interimTarget2030 || '-50%', label: '2030 Interim Target' },
            { value: d.netZeroCommitment.scope3Target2030 || '-30%', label: '2030 Scope 3 Target' },
            { value: d.netZeroCommitment.targetYear || '2050', label: 'Net Zero Year' },
          ], A, W),
          h.spacer(60),
          ...h.richBodyText(d.carbonReductionTargets.target2030.pathway || ''),
          // 09 Supply Chain
          h.spacer(80), h.fullWidthSectionBar('09', 'SUPPLY CHAIN ENGAGEMENT', A), h.spacer(80),
          ...h.richBodyText(d.supplyChainEngagement || ''),
          // 10 Reporting
          h.spacer(80), h.fullWidthSectionBar('10', 'REPORTING & MEASUREMENT FRAMEWORK', A), h.spacer(80),
          ...h.richBodyText(d.reportingAndMeasurement || ''),
          // 11 Board Sign-Off
          h.spacer(80), h.fullWidthSectionBar('11', 'BOARD-LEVEL SIGN-OFF', A), h.spacer(80),
          h.calloutBox(d.boardSignOff.signOffStatement || '', A, GOV_BG, '134e4a', W, { boldPrefix: 'Board Sign-Off Statement:' }),
          h.spacer(60),
          h.signatureGrid(['Board Signatory', 'Environmental Lead'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — SBTi ALIGNED (Deep navy #1A3C6E)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CrpData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('SBTi Carbon Reduction Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'SBTi Aligned', A);

  const tgtCols = cols([0.22, 0.16, 0.18, 0.18, 0.14, 0.12]);
  const s3Cols = cols([0.06, 0.34, 0.10, 0.10, 0.16, 0.24]);
  const pathCols = cols([0.20, 0.14, 0.14, 0.14, 0.38]);

  return new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SCIENCE-BASED', 'CARBON REDUCTION PLAN'], `SBTi Aligned \u2014 ${d.organisationName || 'Organisation'}`, A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Publication Date', value: d.publicationDate },
            { label: 'Organisation', value: d.organisationName },
            { label: 'SIC Code', value: d.sicCode || '' },
            { label: 'Baseline Year', value: d.baselineEmissions.baselineYear || d.baselineYear },
            { label: 'Near-Term Target', value: `${d.netZeroCommitment.interimTarget2030 || '42%'} Scope 1&2 reduction by 2030` },
            { label: 'Long-Term Target', value: `90% all-scope reduction by ${d.netZeroCommitment.targetYear || '2045'}` },
            { label: 'SBTi Status', value: d.sbtiStatus || 'Commitment Letter Submitted' },
            { label: 'Current Project', value: d.currentProject },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Org Boundary, SBTi Targets, Scope 1&2
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'ORGANISATIONAL BOUNDARY & SCOPE', A), h.spacer(80),
          ...h.richBodyText(d.organisationalBoundary || d.organisationDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('02', 'SBTi TARGET SUMMARY', A), h.spacer(80),
          h.kpiDashboard([
            { value: d.nearTermPathway || '1.5\u00B0C', label: 'Near-Term Pathway' },
            { value: d.netZeroCommitment.interimTarget2030 || '-42%', label: 'Scope 1&2 by 2030' },
            { value: d.netZeroCommitment.scope3Target2030 || '-25%', label: 'Scope 3 by 2030' },
            { value: d.netZeroCommitment.targetYear || '2045', label: 'Net Zero' },
          ], A, W),
          h.spacer(60),
          dataTable(A, tgtCols.map((w, i) => ({ text: ['TARGET', 'SCOPE', 'BASELINE (tCO\u2082e)', 'TARGET (tCO\u2082e)', 'REDUCTION %', 'PATHWAY'][i], width: w })), [
            ['Near-Term (2030)', 'Scope 1 & 2', d.baselineEmissions.baselineScope1 && d.baselineEmissions.baselineScope2 ? String(parseFloat(d.baselineEmissions.baselineScope1) + parseFloat(d.baselineEmissions.baselineScope2)) : '', d.carbonReductionTargets.target2030.targetTCO2e || '', d.netZeroCommitment.interimTarget2030 || '', '1.5\u00B0C Absolute'],
            ['Near-Term (2030)', 'Scope 3', d.baselineEmissions.baselineScope3 || '', '', d.netZeroCommitment.scope3Target2030 || '-25%', 'Well-below 2\u00B0C'],
            ['Long-Term', 'All Scopes', d.baselineEmissions.totalBaselineUKOperations || '', '', '-90%', 'Net Zero Standard'],
          ]),
          h.spacer(40),
          h.calloutBox(d.sbtiStatus || 'SBTi commitment letter submitted. Target validation in progress.', A, NAVY_BG, A, W, { boldPrefix: 'SBTi Validation Status:' }),
          h.spacer(80), h.fullWidthSectionBar('03', 'SCOPE 1 & 2 EMISSIONS ANALYSIS', A), h.spacer(80),
          ...h.richBodyText(d.scope12Analysis || d.currentEmissions.scope1.narrative || ''),
          ...h.richBodyText(d.scope2Analysis || d.currentEmissions.scope2.narrative || ''),
        ] },
      // Body — Scope 3 Screening, Pathway, Governance, Sign-Off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('04', 'SCOPE 3 SCREENING & MATERIAL CATEGORIES', A), h.spacer(80),
          ...h.richBodyText(d.currentEmissions.scope3.narrative || ''),
          ...(d.currentEmissions.scope3.categories.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'CAT', width: s3Cols[0] }, { text: 'CATEGORY NAME', width: s3Cols[1] }, { text: 'tCO\u2082e', width: s3Cols[2] }, { text: '% OF S3', width: s3Cols[3] }, { text: 'MATERIAL?', width: s3Cols[4] }, { text: 'METHODOLOGY', width: s3Cols[5] }],
            d.currentEmissions.scope3.categories.map(c => [c.categoryNumber, c.categoryName, c.tCO2e, '', c.relevant || c.dataQuality, c.methodology || '']),
            [4]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'DECARBONISATION PATHWAY & KPIs', A), h.spacer(80),
          ...h.richBodyText(d.carbonReductionTargets.target2030.pathway || ''),
          ...(d.decarbonisationPathway.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'YEAR', width: pathCols[0] }, { text: 'S1&2 TARGET', width: pathCols[1] }, { text: 'S3 TARGET', width: pathCols[2] }, { text: 'TOTAL TARGET', width: pathCols[3] }, { text: 'KEY INTERVENTIONS', width: pathCols[4] }],
            d.decarbonisationPathway.map(p => [p.year, p.scope12, p.scope3, p.total, p.interventions || ''])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('06', 'GOVERNANCE & ACCOUNTABILITY', A), h.spacer(80),
          ...h.richBodyText(d.governanceNarrative || d.reportingAndMeasurement || ''),
          h.spacer(60),
          h.signatureGrid(['Managing Director', 'Head of Sustainability'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — ISO 14064 COMPLIANT (Charcoal #2C3E50 + Red #C0392B)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CrpData): Document {
  const A = CHAR;
  const hdr = h.accentHeader('ISO 14064-1:2018 Carbon Reduction Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'ISO 14064 Compliant', A);

  const ghgCols = cols([0.16, 0.34, 0.22, 0.28]);
  const quantCols = cols([0.24, 0.20, 0.22, 0.16, 0.18]);
  const tgtCols3 = cols([0.32, 0.16, 0.30, 0.22]);
  const revCols = cols([0.08, 0.12, 0.52, 0.14, 0.14]);

  return new Document({
    styles: { default: { document: { run: { font: 'Cambria', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['ISO 14064-1:2018', 'CARBON REDUCTION PLAN'], `GHG Inventory & Reduction Programme \u2014 ${d.organisationName || 'Organisation'}`, A, RED_C),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Revision', value: 'Rev A \u2014 First Issue' },
            { label: 'Date of Issue', value: d.publicationDate },
            { label: 'Organisation', value: d.organisationName },
            { label: 'Consolidation Approach', value: d.consolidationApproach || 'Operational Control (ISO 14064-1 Cl. 5.1)' },
            { label: 'Reporting Period', value: d.currentEmissions.reportingYear || '' },
            { label: 'Base Year', value: d.baselineEmissions.baselineYear || d.baselineYear },
            { label: 'Prepared By', value: d.boardSignOff.signatoryName || '' },
            { label: 'Verification Status', value: 'Unverified \u2014 Third-party verification planned' },
            { label: 'Current Project', value: d.currentProject },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Doc Control, Org Boundary, GHG Sources
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('1.0', 'DOCUMENT CONTROL', A), h.spacer(80),
          dataTable(A, revCols.map((w, i) => ({ text: ['REV', 'DATE', 'DESCRIPTION', 'AUTHOR', 'STATUS'][i], width: w })), [
            ['A', d.publicationDate || '', 'First issue \u2014 GHG inventory and reduction programme', d.boardSignOff.signatoryName || '', 'Issued'],
            ['\u2014', '\u2014', 'Planned Rev B \u2014 Post third-party verification update', '\u2014', 'Pending'],
          ]),
          h.spacer(80), h.fullWidthSectionBar('2.0', 'ORGANISATIONAL BOUNDARY (ISO 14064-1 CLAUSE 5.1)', A), h.spacer(80),
          ...h.richBodyText(d.organisationalBoundary || d.organisationDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('3.0', 'GHG SOURCE IDENTIFICATION (CLAUSE 5.2)', A), h.spacer(80),
          ...h.richBodyText(d.currentEmissions.scope3.narrative || ''),
          ...(d.ghgSourceIdentification.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'ISO CATEGORY', width: ghgCols[0] }, { text: 'GHG SOURCE', width: ghgCols[1] }, { text: 'GHG SPECIES', width: ghgCols[2] }, { text: 'CLASSIFICATION', width: ghgCols[3] }],
            d.ghgSourceIdentification.map(g => [g.isoCategory, g.ghgSource, g.ghgSpecies, g.classification])
          )] : []),
          h.spacer(40),
          h.calloutBox('No significant GHG sinks or reservoirs have been identified within the organisational boundary.', A, 'F3F4F6', '1F2937', W, { boldPrefix: 'GHG Sinks & Reservoirs:' }),
        ] },
      // Body — Quantification, Base Year, Uncertainty
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('4.0', 'QUANTIFICATION METHODOLOGY (CLAUSE 5.3)', A), h.spacer(80),
          ...h.richBodyText(d.quantificationMethodology || ''),
          ...(d.quantificationTable.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'SOURCE', width: quantCols[0] }, { text: 'ACTIVITY DATA', width: quantCols[1] }, { text: 'EF SOURCE', width: quantCols[2] }, { text: 'DATA QUALITY', width: quantCols[3] }, { text: 'tCO\u2082e', width: quantCols[4] }],
            d.quantificationTable.map(q => [q.source, q.activityData, q.efSource, q.dataQuality, q.tCO2e]),
            [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('5.0', 'BASE YEAR & RECALCULATION POLICY (CLAUSE 5.4)', A), h.spacer(80),
          ...h.richBodyText(d.baseYearRecalcPolicy || d.baselineEmissions.baselineNarrative || ''),
          h.spacer(80), h.fullWidthSectionBar('6.0', 'UNCERTAINTY ASSESSMENT', A), h.spacer(80),
          ...h.richBodyText(d.uncertaintyAssessment || ''),
        ] },
      // Body — Targets, Verification, Sign-Off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('7.0', 'REDUCTION TARGETS & PLANNED ACTIONS', A), h.spacer(80),
          dataTable(A,
            [{ text: 'TARGET', width: tgtCols3[0] }, { text: 'SCOPE', width: tgtCols3[1] }, { text: 'METRIC', width: tgtCols3[2] }, { text: 'STATUS', width: tgtCols3[3] }],
            [
              [`${d.netZeroCommitment.interimTarget2030 || '50%'} reduction by 2030`, 'Scope 1 & 2', `From ${d.baselineEmissions.baselineScope1 && d.baselineEmissions.baselineScope2 ? String(parseFloat(d.baselineEmissions.baselineScope1) + parseFloat(d.baselineEmissions.baselineScope2)) : ''} to \u2264${d.carbonReductionTargets.target2030.targetTCO2e || ''} tCO\u2082e`, 'On Track'],
              [`${d.netZeroCommitment.scope3Target2030 || '30%'} reduction by 2030`, 'Scope 3', `From ${d.baselineEmissions.baselineScope3 || ''} to target`, 'Behind'],
              [`Net Zero by ${d.netZeroCommitment.targetYear || '2045'}`, 'All Scopes', '90%+ absolute reduction + verified removal', 'Long-Term'],
            ],
            [3]
          ),
          h.spacer(80), h.fullWidthSectionBar('8.0', 'VERIFICATION READINESS STATEMENT (ISO 14064-3)', A), h.spacer(80),
          h.calloutBox(d.verificationStatement || 'This GHG inventory has not yet been subject to third-party verification. Verification is planned and will be conducted by a UKAS-accredited verification body.', RED_C, RED_BG, '7F1D1D', W, { boldPrefix: 'Verification Status:' }),
          h.spacer(40),
          ...h.richBodyText(d.reportingAndMeasurement || ''),
          h.spacer(80), h.fullWidthSectionBar('9.0', 'SIGN-OFF & APPROVAL', A), h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By'], RED_C, W),
          h.spacer(80), ...h.endMark(RED_C),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — GHG PROTOCOL CORPORATE (Teal #00897B / Dark #004D40)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CrpData): Document {
  const A = TEAL_C;
  const hdr = h.accentHeader('GHG Protocol Carbon Reduction Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'GHG Protocol Corporate', A);

  const invCols = cols([0.16, 0.28, 0.16, 0.18, 0.22]);
  const s3Cols4 = cols([0.06, 0.38, 0.14, 0.14, 0.28]);
  const pathCols4 = cols([0.22, 0.16, 0.16, 0.16, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['GHG PROTOCOL', 'CORPORATE CARBON', 'REDUCTION PLAN'], `${d.organisationName || 'Organisation'} \u2014 ${d.currentEmissions.reportingYear || 'FY2025/26'}`, TEAL_D, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Reporting Period', value: d.currentEmissions.reportingYear || '' },
            { label: 'Organisation', value: d.organisationName },
            { label: 'Consolidation Approach', value: d.consolidationApproach || 'Operational Control' },
            { label: 'Reporting Standard', value: 'GHG Protocol Corporate Standard (Rev. 2015)' },
            { label: 'Base Year', value: d.baselineEmissions.baselineYear || d.baselineYear },
            { label: 'Net Zero Target', value: d.netZeroCommitment.targetYear || '2045' },
            { label: 'Current Project', value: d.currentProject },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Company Profile, Inventory Summary
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'COMPANY PROFILE & INVENTORY BOUNDARIES', A), h.spacer(80),
          ...h.richBodyText(d.organisationDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('02', 'GHG INVENTORY SUMMARY (ALL SCOPES)', A), h.spacer(80),
          h.kpiDashboard(
            d.kpiItems.length > 0 ? d.kpiItems.slice(0, 5).map(k => ({ value: k.value, label: k.label })) : [
              { value: d.currentEmissions.totalCurrentEmissions || '0', label: 'Total tCO\u2082e' },
              { value: d.currentEmissions.scope1.total || '0', label: 'Scope 1' },
              { value: d.currentEmissions.scope2.total || '0', label: 'Scope 2 (Loc)' },
              { value: d.currentEmissions.scope3.total || '0', label: 'Scope 3' },
            ], TEAL_D, W
          ),
          h.spacer(60),
          dataTable(A,
            [{ text: 'SCOPE', width: invCols[0] }, { text: 'SOURCE', width: invCols[1] }, { text: `${d.currentEmissions.reportingYear || 'CURRENT'} (tCO\u2082e)`, width: invCols[2] }, { text: 'BASELINE (tCO\u2082e)', width: invCols[3] }, { text: 'CHANGE', width: invCols[4] }],
            [
              ['SCOPE 1', 'Direct Emissions', d.currentEmissions.scope1.total || '', d.baselineEmissions.baselineScope1 || '', ''],
              ...d.currentEmissions.scope1.sources.map(s => ['', s.source, s.tCO2e, '', '']),
              ['SCOPE 2', 'Indirect Energy (Location-Based)', d.currentEmissions.scope2.total || '', d.baselineEmissions.baselineScope2 || '', ''],
              ['SCOPE 3', 'Value Chain', d.currentEmissions.scope3.total || '', d.baselineEmissions.baselineScope3 || '', ''],
              ['GRAND TOTAL', '', d.currentEmissions.totalCurrentEmissions || '', d.baselineEmissions.totalBaselineUKOperations || '', ''],
            ]
          ),
        ] },
      // Body — Scope 3 Screening, Roadmap, Supply Chain, Governance, Sign-Off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('03', 'SCOPE 3 CATEGORY SCREENING (15 CATEGORIES)', A), h.spacer(80),
          ...(d.currentEmissions.scope3.categories.length > 0 ? [dataTable(A,
            [{ text: '#', width: s3Cols4[0] }, { text: 'CATEGORY', width: s3Cols4[1] }, { text: 'RELEVANT?', width: s3Cols4[2] }, { text: 'tCO\u2082e', width: s3Cols4[3] }, { text: 'METHOD', width: s3Cols4[4] }],
            d.currentEmissions.scope3.categories.map(c => [c.categoryNumber, c.categoryName, c.relevant || c.dataQuality, c.tCO2e, c.methodology || '']),
            [2]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'REDUCTION ROADMAP \u2014 BASELINE TO NET ZERO', A), h.spacer(80),
          ...(d.decarbonisationPathway.length > 0 ? [dataTable(TEAL_D,
            [{ text: 'MILESTONE', width: pathCols4[0] }, { text: 'SCOPE 1&2', width: pathCols4[1] }, { text: 'SCOPE 3', width: pathCols4[2] }, { text: 'TOTAL', width: pathCols4[3] }, { text: 'INTENSITY (tCO\u2082e/\u00A3M)', width: pathCols4[4] }],
            d.decarbonisationPathway.map(p => [p.year, p.scope12, p.scope3, p.total, p.intensity || ''])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'SUPPLY CHAIN DECARBONISATION STRATEGY', A), h.spacer(80),
          ...h.richBodyText(d.supplyChainEngagement || ''),
          h.spacer(80), h.fullWidthSectionBar('06', 'GOVERNANCE & REPORTING CYCLE', A), h.spacer(80),
          ...h.richBodyText(d.governanceNarrative || d.reportingAndMeasurement || ''),
          h.spacer(60),
          h.signatureGrid(['Managing Director', 'Head of Sustainability'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCrpTemplateDocument(
  content: any,
  templateSlug: CrpTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ppn-0621-standard':      return buildT1(d);
    case 'sbti-aligned':           return buildT2(d);
    case 'iso-14064-compliant':    return buildT3(d);
    case 'ghg-protocol-corporate': return buildT4(d);
    default:                       return buildT1(d);
  }
}
