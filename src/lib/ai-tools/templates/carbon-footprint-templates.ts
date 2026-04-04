// =============================================================================
// Carbon Footprint Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, ICE v3.2 tables, KPI dashboard, ~4pp)
// T2 — PAS 2080 Technical  (navy #1E3A5F, life cycle modules A–D, hierarchy, ~5pp)
// T3 — Compact Summary     (charcoal #4B5563, dense dashboard, two-col, ~3pp)
// T4 — Audit-Ready         (teal #0D9488, doc control, verification, ISO 14064, ~5pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CarbonFootprintTemplateSlug } from '@/lib/carbon-footprint/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

const GREEN = '059669'; const GREEN_BG = 'ECFDF5'; const GREEN_SUB = 'A7F3D0';
const NAVY = '1E3A5F'; const NAVY_BG = 'EFF6FF'; const NAVY_SUB = '93C5FD';
const CHARCOAL = '4B5563'; const CHARCOAL_SUB = 'D1D5DB';
const TEAL = '0D9488'; const TEAL_BG = 'F0FDFA'; const TEAL_SUB = '99F6E4';
const RED = 'DC2626'; const AMBER = 'D97706';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ───────────────────────────────────────────────────────────
interface CfData {
  documentRef: string; assessmentDate: string; assessedBy: string;
  projectName: string; siteAddress: string; client: string;
  principalContractor: string; contractor: string; contractRef: string;
  designLife: string; standard: string;
  assessmentScope: string; systemBoundary: string;
  methodology: string; functionalUnit: string;
  materials: Array<{ material: string; quantity: string; unit: string; emissionFactor: string; source: string; tco2e: string; module?: string; qtyDataSource?: string; dataQuality?: string }>;
  plant: Array<{ item: string; fuelType: string; hours: string; consumption: string; emissionFactor: string; tco2e: string; efSource?: string; dataSource?: string; dataQuality?: string }>;
  transport: Array<{ description: string; loads: string; distance: string; vehicleType: string; emissionFactor: string; tco2e: string; efSource?: string; qtySource?: string }>;
  waste: Array<{ wasteType: string; quantity: string; disposalRoute: string; emissionFactor: string; tco2e: string; efSource?: string; dataSource?: string }>;
  carbonSummary: Array<{ category: string; tco2e: string; percentage: string; dataQuality?: string }>;
  totalCo2e: string; carbonIntensity: string;
  hotspots: Array<{ rank: string; source: string; tco2e: string; percentage: string; reductionOpportunity: string }>;
  reductionMeasures: Array<{ measure: string; potentialSaving: string; feasibility: string; recommendation: string }>;
  assumptions: Array<{ assumption: string; justification: string; dataQuality: string; sensitivityImpact: string }>;
  regulatoryReferences: Array<{ reference: string; description: string }>;
  approvalChain: Array<{ role: string; name: string; qualification: string; date: string }>;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  // PAS 2080 T2 fields
  breeamCeequal: string;
  buildNothingAssessment: string; buildLessAssessment: string;
  buildCleverAssessment: string; buildEfficientlyAssessment: string;
  useStageMaintenanceCarbon: string; useStageReplacementCarbon: string;
  endOfLifeCarbon: string; moduleDCarbon: string;
  wholeLifeSummary: Array<{ module: string; stage: string; tco2e: string; percentage: string }>;
  wholeLifeTotal: string; benchmarkingNarrative: string;
  benchmarkKpis: Array<{ value: string; label: string; sublabel?: string }>;
  // Audit T4 fields
  sensitivityAnalysis: Array<{ parameter: string; baseCase: string; minusScenario: string; plusScenario: string; impactOnTotal: string }>;
  sensitivityNarrative: string;
  isoComplianceChecklist: Array<{ clause: string; requirement: string; status: string; evidenceSection: string }>;
  confidentiality: string;
  kpiItems: Array<{ value: string; label: string; sublabel?: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CfData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef', 'CF-001'), assessmentDate: s('assessmentDate'), assessedBy: s('assessedBy'),
    projectName: s('projectName'), siteAddress: s('siteAddress'), client: s('client'),
    principalContractor: s('principalContractor'), contractor: s('contractor'), contractRef: s('contractRef'),
    designLife: s('designLife', '60 years'), standard: s('standard', 'ICE v3.2 / DEFRA GHG 2025'),
    assessmentScope: s('assessmentScope'), systemBoundary: s('systemBoundary'),
    methodology: s('methodology'), functionalUnit: s('functionalUnit'),
    materials: a('materials'), plant: a('plant'), transport: a('transport'),
    waste: a('waste'), carbonSummary: a('carbonSummary'),
    totalCo2e: s('totalCo2e'), carbonIntensity: s('carbonIntensity'),
    hotspots: a('hotspots'), reductionMeasures: a('reductionMeasures'),
    assumptions: a('assumptions'), regulatoryReferences: a('regulatoryReferences'),
    approvalChain: a('approvalChain'), revisionHistory: a('revisionHistory'),
    breeamCeequal: s('breeamCeequal'), buildNothingAssessment: s('buildNothingAssessment'),
    buildLessAssessment: s('buildLessAssessment'), buildCleverAssessment: s('buildCleverAssessment'),
    buildEfficientlyAssessment: s('buildEfficientlyAssessment'),
    useStageMaintenanceCarbon: s('useStageMaintenanceCarbon'), useStageReplacementCarbon: s('useStageReplacementCarbon'),
    endOfLifeCarbon: s('endOfLifeCarbon'), moduleDCarbon: s('moduleDCarbon'),
    wholeLifeSummary: a('wholeLifeSummary'), wholeLifeTotal: s('wholeLifeTotal'),
    benchmarkingNarrative: s('benchmarkingNarrative'), benchmarkKpis: a('benchmarkKpis'),
    sensitivityAnalysis: a('sensitivityAnalysis'), sensitivityNarrative: s('sensitivityNarrative'),
    isoComplianceChecklist: a('isoComplianceChecklist'), confidentiality: s('confidentiality'),
    kpiItems: a('kpiItems'), additionalNotes: s('additionalNotes'),
  };
}

// ── Shared table builders ────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string; size?: number }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, color: opts?.color, fontSize: opts?.size ?? SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('high') || low.includes('✓') || low === 'green') { bg = 'D1FAE5'; color = '059669'; }
  else if (low.includes('med') || low === 'amber') { bg = 'FFFBEB'; color = 'D97706'; }
  else if (low.includes('low') || low === 'red') { bg = 'FEF2F2'; color = 'DC2626'; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: headers.map(h2 => h2.width),
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, {
            bg: ri % 2 === 1 ? ZEBRA : undefined,
            bold: (cell || '').toString().toUpperCase() === 'TOTAL',
          })
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
function monoPanel(title: string, body: string, accent: string): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders,
      shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: BODY, font: 'Arial', color: accent })] }),
        ...h.richBodyText(body),
      ],
    })] })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CfData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Carbon Footprint Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  const matCols = cols([0.28, 0.08, 0.07, 0.14, 0.22, 0.21]);
  const plantCols = cols([0.28, 0.10, 0.10, 0.14, 0.14, 0.24]);
  const transCols = cols([0.28, 0.08, 0.10, 0.14, 0.14, 0.26]);
  const wasteCols = cols([0.24, 0.12, 0.24, 0.18, 0.22]);
  const sumCols = cols([0.50, 0.24, 0.26]);
  const hotCols = cols([0.06, 0.22, 0.12, 0.08, 0.52]);
  const redCols = cols([0.30, 0.16, 0.14, 0.40]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CONSTRUCTION CARBON', 'FOOTPRINT ASSESSMENT'], d.projectName || 'Carbon Footprint Assessment', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractRef },
            { label: 'Client', value: d.client },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Contractor', value: d.contractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Design Life', value: d.designLife },
            { label: 'Standard', value: d.standard },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 Methodology
          h.fullWidthSectionBar('01', 'ASSESSMENT BASIS & METHODOLOGY', A), h.spacer(80),
          ...h.richBodyText(d.methodology || ''),
          // 02 Project Overview
          h.spacer(80), h.fullWidthSectionBar('02', 'PROJECT OVERVIEW & SCOPE BOUNDARY', A), h.spacer(80),
          ...h.richBodyText(d.assessmentScope || ''),
          // 03 Materials
          h.spacer(80), h.fullWidthSectionBar('03', 'MATERIALS CARBON (A1\u2013A3)', A), h.spacer(80),
          ...h.richBodyText(d.systemBoundary || 'Materials represent the largest single source of embodied carbon.'),
          ...(d.materials.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'MATERIAL', width: matCols[0] }, { text: 'QTY', width: matCols[1] }, { text: 'UNIT', width: matCols[2] }, { text: 'EF (kgCO\u2082e)', width: matCols[3] }, { text: 'SOURCE', width: matCols[4] }, { text: 'tCO\u2082e', width: matCols[5] }],
            d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.tco2e])
          )] : []),
          // 04 Plant
          h.spacer(80), h.fullWidthSectionBar('04', 'PLANT & EQUIPMENT EMISSIONS', A), h.spacer(80),
          ...h.richBodyText(d.additionalNotes ? '' : 'Plant and equipment fuel consumption represents a significant proportion of construction process emissions (module A5).'),
          ...(d.plant.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'PLANT ITEM', width: plantCols[0] }, { text: 'FUEL', width: plantCols[1] }, { text: 'HOURS', width: plantCols[2] }, { text: 'LITRES', width: plantCols[3] }, { text: 'EF', width: plantCols[4] }, { text: 'tCO\u2082e', width: plantCols[5] }],
            d.plant.map(p => [p.item, p.fuelType, p.hours, p.consumption, p.emissionFactor, p.tco2e])
          )] : []),
          // 05 Transport
          h.spacer(80), h.fullWidthSectionBar('05', 'TRANSPORT & LOGISTICS (A4)', A), h.spacer(80),
          ...(d.transport.length > 0 ? [dataTable(A,
            [{ text: 'DESCRIPTION', width: transCols[0] }, { text: 'LOADS', width: transCols[1] }, { text: 'DIST (KM)', width: transCols[2] }, { text: 'VEHICLE', width: transCols[3] }, { text: 'EF', width: transCols[4] }, { text: 'tCO\u2082e', width: transCols[5] }],
            d.transport.map(t => [t.description, t.loads, t.distance, t.vehicleType, t.emissionFactor, t.tco2e])
          )] : []),
          // 06 Waste
          h.spacer(80), h.fullWidthSectionBar('06', 'WASTE & DISPOSAL (C1\u2013C4)', A), h.spacer(80),
          ...(d.waste.length > 0 ? [dataTable(A,
            [{ text: 'WASTE TYPE', width: wasteCols[0] }, { text: 'QTY (T)', width: wasteCols[1] }, { text: 'DISPOSAL ROUTE', width: wasteCols[2] }, { text: 'EF (kgCO\u2082e/T)', width: wasteCols[3] }, { text: 'tCO\u2082e', width: wasteCols[4] }],
            d.waste.map(w => [w.wasteType, w.quantity, w.disposalRoute, w.emissionFactor, w.tco2e])
          )] : []),
          // 07 Summary Dashboard
          h.spacer(80), h.fullWidthSectionBar('07', 'CARBON SUMMARY DASHBOARD', A), h.spacer(80),
          ...(d.kpiItems.length > 0
            ? [h.kpiDashboard(d.kpiItems.slice(0, 4).map(k => ({ value: k.value, label: k.label })), A, W)]
            : [h.kpiDashboard([
                { value: d.totalCo2e || '0', label: 'Total tCO\u2082e' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('material'))?.tco2e || '0', label: 'Materials (A1\u2013A3)' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('plant'))?.tco2e || '0', label: 'Plant & Equipment' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('transport') || s.category.toLowerCase().includes('waste'))?.tco2e || '0', label: 'Transport + Waste' },
              ], A, W)]
          ),
          h.spacer(60),
          ...(d.carbonSummary.length > 0 ? [dataTable(A,
            [{ text: 'CATEGORY', width: sumCols[0] }, { text: 'tCO\u2082e', width: sumCols[1] }, { text: '% OF TOTAL', width: sumCols[2] }],
            d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage])
          )] : []),
          // 08 Hotspots
          h.spacer(80), h.fullWidthSectionBar('08', 'HOTSPOT ANALYSIS & REDUCTION OPPORTUNITIES', A), h.spacer(80),
          ...(d.hotspots.length > 0 ? [dataTable(A,
            [{ text: '#', width: hotCols[0] }, { text: 'CARBON SOURCE', width: hotCols[1] }, { text: 'tCO\u2082e', width: hotCols[2] }, { text: '%', width: hotCols[3] }, { text: 'REDUCTION OPPORTUNITY', width: hotCols[4] }],
            d.hotspots.map(hs => [hs.rank, hs.source, hs.tco2e, hs.percentage, hs.reductionOpportunity])
          )] : []),
          ...(d.carbonIntensity ? [h.spacer(60), h.calloutBox(
            `Current carbon intensity is ${d.carbonIntensity}. ` + (d.additionalNotes || ''),
            A, GREEN_BG, '134e4a', W, { boldPrefix: 'Carbon Intensity:' }
          )] : []),
          // 09 Reduction
          h.spacer(80), h.fullWidthSectionBar('09', 'REDUCTION MEASURES', A), h.spacer(80),
          ...(d.reductionMeasures.length > 0 ? [dataTable(A,
            [{ text: 'MEASURE', width: redCols[0] }, { text: 'POTENTIAL SAVING', width: redCols[1] }, { text: 'FEASIBILITY', width: redCols[2] }, { text: 'RECOMMENDATION', width: redCols[3] }],
            d.reductionMeasures.map(r => [r.measure, r.potentialSaving, r.feasibility, r.recommendation]),
            [2]
          )] : []),
          // 10 Sign-Off
          h.spacer(80), h.fullWidthSectionBar('10', 'SIGN-OFF & REVIEW', A), h.spacer(80),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — PAS 2080 TECHNICAL (Navy #1E3A5F)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CfData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('PAS 2080 Whole Life Carbon Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'PAS 2080 Technical', A);

  const matCols7 = cols([0.22, 0.06, 0.06, 0.12, 0.22, 0.10, 0.22]);
  const sumCols4 = cols([0.18, 0.34, 0.24, 0.24]);
  const refCols = cols([0.30, 0.70]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['PAS 2080:2023', 'WHOLE LIFE CARBON', 'ASSESSMENT'], d.projectName || '', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractRef },
            { label: 'Client', value: d.client },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Contractor', value: d.contractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Design Life', value: d.designLife },
            { label: 'Assessment Standard', value: d.standard || 'PAS 2080:2023 / EN 15978 / ICE v3.2' },
            { label: 'BREEAM / CEEQUAL', value: d.breeamCeequal || '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Methodology, Hierarchy
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'PAS 2080:2023 METHODOLOGY & SYSTEM BOUNDARY', A), h.spacer(80),
          ...h.richBodyText(d.methodology || ''),
          ...h.richBodyText(d.assessmentScope || ''),
          h.spacer(80), h.fullWidthSectionBar('02', 'CARBON REDUCTION HIERARCHY', A), h.spacer(80),
          ...h.richBodyText('PAS 2080:2023 establishes a carbon reduction hierarchy that should be applied sequentially during the design and delivery of infrastructure assets.'),
          h.spacer(60),
          monoPanel('Build Nothing Assessment', d.buildNothingAssessment || 'The requirement was established through regulatory compliance. A do-nothing option was assessed but rejected.', A),
          h.spacer(60),
          monoPanel('Build Less Assessment', d.buildLessAssessment || 'Design optimisation and value engineering measures have been applied to reduce material quantities.', A),
          h.spacer(60),
          monoPanel('Build Clever Assessment', d.buildCleverAssessment || 'Low-carbon material substitutions have been adopted where technically feasible.', A),
          h.spacer(60),
          monoPanel('Build Efficiently Assessment', d.buildEfficientlyAssessment || 'Construction process efficiency measures are in place to reduce fuel consumption and waste.', A),
        ] },
      // Body — Modules A1–A5
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('03', 'PRODUCT STAGE CARBON (A1\u2013A3)', A), h.spacer(80),
          ...h.richBodyText(d.systemBoundary || 'Product stage carbon covers raw material supply, transport to manufacturer, and manufacturing.'),
          ...(d.materials.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'MATERIAL', width: matCols7[0] }, { text: 'QTY', width: matCols7[1] }, { text: 'UNIT', width: matCols7[2] }, { text: 'EF (kgCO\u2082e)', width: matCols7[3] }, { text: 'DATA SOURCE', width: matCols7[4] }, { text: 'MODULE', width: matCols7[5] }, { text: 'tCO\u2082e', width: matCols7[6] }],
            d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.module || 'A1\u2013A3', m.tco2e])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'CONSTRUCTION PROCESS STAGE (A4\u2013A5)', A), h.spacer(80),
          ...h.richBodyText('The construction process stage covers transport of materials to site (A4) and all on-site construction activities (A5).'),
          h.spacer(40),
          h.kpiDashboard([
            { value: d.transport.reduce((sum, t) => sum + (parseFloat(t.tco2e) || 0), 0).toFixed(1), label: 'Module A4 (tCO\u2082e)' },
            { value: d.plant.reduce((sum, p) => sum + (parseFloat(p.tco2e) || 0), 0).toFixed(1), label: 'Module A5 (tCO\u2082e)' },
            { value: d.materials.reduce((sum, m) => sum + (parseFloat(m.tco2e) || 0), 0).toFixed(1), label: 'Modules A1\u2013A3 (tCO\u2082e)' },
          ], A, W),
          // 05 Use Stage
          h.spacer(80), h.fullWidthSectionBar('05', 'USE STAGE (B1\u2013B5)', A), h.spacer(80),
          ...h.richBodyText(d.useStageMaintenanceCarbon ? '' : 'Use stage carbon covers the in-service life of the asset over the reference study period.'),
          ...(d.useStageMaintenanceCarbon ? [h.spacer(40), monoPanel('Module B2 \u2014 Maintenance', d.useStageMaintenanceCarbon, A)] : []),
          ...(d.useStageReplacementCarbon ? [h.spacer(60), monoPanel('Module B4 \u2014 Replacement', d.useStageReplacementCarbon, A)] : []),
        ] },
      // Body — End of Life, Module D, Summary, Benchmarking, Refs, Sign-off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('06', 'END OF LIFE (C1\u2013C4)', A), h.spacer(80),
          ...h.richBodyText(d.endOfLifeCarbon || 'End of life carbon covers deconstruction, transport to waste processing, waste processing, and final disposal.'),
          h.spacer(80), h.fullWidthSectionBar('07', 'BEYOND SYSTEM BOUNDARY (MODULE D)', A), h.spacer(80),
          ...h.richBodyText(d.moduleDCarbon || 'Module D reports the potential net benefits from reuse, recovery, or recycling of materials beyond the system boundary.'),
          h.spacer(40),
          h.calloutBox(
            'Module D values are reported separately in accordance with PAS 2080:2023 Clause 8.4 and are not included in the whole life carbon total.',
            '2563EB', 'EFF6FF', '1e3a5f', W, { boldPrefix: 'Module D Reporting Note:' }
          ),
          // 08 WLC Summary
          h.spacer(80), h.fullWidthSectionBar('08', 'WHOLE LIFE CARBON SUMMARY', A), h.spacer(80),
          ...(d.wholeLifeSummary.length > 0 ? [dataTable(A,
            [{ text: 'LIFE CYCLE MODULE', width: sumCols4[0] }, { text: 'STAGE', width: sumCols4[1] }, { text: 'tCO\u2082e', width: sumCols4[2] }, { text: '% OF WLC', width: sumCols4[3] }],
            d.wholeLifeSummary.map(w => [w.module, w.stage, w.tco2e, w.percentage])
          )] : (d.carbonSummary.length > 0 ? [dataTable(A,
            [{ text: 'CATEGORY', width: cols([0.50, 0.24, 0.26])[0] }, { text: 'tCO\u2082e', width: cols([0.50, 0.24, 0.26])[1] }, { text: '%', width: cols([0.50, 0.24, 0.26])[2] }],
            d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage])
          )] : [])),
          // 09 Benchmarking
          h.spacer(80), h.fullWidthSectionBar('09', 'BENCHMARKING & SECTOR TARGETS', A), h.spacer(80),
          ...h.richBodyText(d.benchmarkingNarrative || ''),
          ...(d.benchmarkKpis.length > 0 ? [h.spacer(40), h.kpiDashboard(d.benchmarkKpis.map(k => ({ value: k.value, label: k.label })), A, W)] : []),
          h.spacer(40),
          h.calloutBox(
            'The whole life carbon assessment demonstrates carbon reduction through material substitution and construction process efficiency measures.',
            AMBER, 'FFFBEB', '92400E', W, { boldPrefix: 'CEEQUAL Mat 01:' }
          ),
          // 10 References
          h.spacer(80), h.fullWidthSectionBar('10', 'REFERENCES & STANDARDS', A), h.spacer(80),
          ...(d.regulatoryReferences.length > 0 ? [dataTable(A,
            [{ text: 'REFERENCE', width: refCols[0] }, { text: 'DESCRIPTION', width: refCols[1] }],
            d.regulatoryReferences.map(r => [r.reference, r.description])
          )] : []),
          // 11 Sign-Off
          h.spacer(80), h.fullWidthSectionBar('11', 'SIGN-OFF & APPROVAL', A), h.spacer(80),
          h.signatureGrid(['Assessed By', 'Sustainability Lead', 'Principal Designer Review', 'Client Approval'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — COMPACT SUMMARY (Charcoal #4B5563)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CfData): Document {
  const A = CHARCOAL;
  const hdr = h.accentHeader('Carbon Footprint \u2014 Compact Summary', A);
  const ftr = h.accentFooter(d.documentRef, 'Compact Summary', A);

  const matCols3 = cols([0.60, 0.20, 0.20]);
  const plantCols3 = cols([0.50, 0.24, 0.26]);
  const redCols4 = cols([0.06, 0.54, 0.20, 0.20]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CARBON FOOTPRINT', 'COMPACT SUMMARY'], d.projectName || '', A, CHARCOAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractRef },
            { label: 'Client', value: d.client },
            { label: 'Contractor', value: d.contractor },
            { label: 'Site Address', value: d.siteAddress },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Dashboard page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'CARBON DASHBOARD \u2014 CATEGORY TOTALS', A), h.spacer(80),
          // KPI dashboard — up to 5 items
          ...(d.kpiItems.length > 0
            ? [h.kpiDashboard(d.kpiItems.slice(0, 5).map(k => ({ value: k.value, label: k.label })), A, W)]
            : [h.kpiDashboard([
                { value: d.totalCo2e || '0', label: 'Total tCO\u2082e' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('material'))?.tco2e || '0', label: 'Materials' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('plant'))?.tco2e || '0', label: 'Plant & Fuel' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('transport'))?.tco2e || '0', label: 'Transport' },
                { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('waste'))?.tco2e || '0', label: 'Waste' },
              ], A, W)]
          ),
          h.spacer(80),
          // Materials breakdown
          h.bodyText('MATERIALS BREAKDOWN (A1\u2013A3)', SM, { bold: true, color: '1F2937' }),
          ...(d.materials.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'MATERIAL', width: matCols3[0] }, { text: 'tCO\u2082e', width: matCols3[1] }, { text: '%', width: matCols3[2] }],
            d.materials.map(m => [m.material + (m.quantity ? ` (${m.quantity}${m.unit || ''})` : ''), m.tco2e, ''])
          )] : []),
          h.spacer(60),
          // Plant breakdown
          h.bodyText('PLANT & EQUIPMENT (A5)', SM, { bold: true, color: '1F2937' }),
          ...(d.plant.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'PLANT ITEM', width: plantCols3[0] }, { text: 'LITRES', width: plantCols3[1] }, { text: 'tCO\u2082e', width: plantCols3[2] }],
            d.plant.map(p => [p.item, p.consumption, p.tco2e])
          )] : []),
          // Transport & Waste prose
          h.spacer(80), h.fullWidthSectionBar('', 'TRANSPORT & WASTE SUMMARY', A), h.spacer(80),
          ...h.richBodyText(`Transport (A4): Total haulage emissions ${d.transport.reduce((sum, t) => sum + (parseFloat(t.tco2e) || 0), 0).toFixed(1)} tCO\u2082e across all material deliveries and muck-away movements.`),
          ...h.richBodyText(`Waste (C1\u2013C4): Total waste emissions ${d.waste.reduce((sum, w) => sum + (parseFloat(w.tco2e) || 0), 0).toFixed(1)} tCO\u2082e.`),
        ] },
      // Reduction & Benchmark page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'TOP 5 REDUCTION MEASURES', A), h.spacer(80),
          ...(d.reductionMeasures.length > 0 ? [dataTable(A,
            [{ text: '#', width: redCols4[0] }, { text: 'MEASURE', width: redCols4[1] }, { text: 'SAVING (tCO\u2082e)', width: redCols4[2] }, { text: 'FEASIBILITY', width: redCols4[3] }],
            d.reductionMeasures.slice(0, 5).map((r, i) => [String(i + 1), r.measure, r.potentialSaving, r.feasibility]),
            [3]
          )] : []),
          h.spacer(60),
          h.calloutBox(
            `Implementation of all measures could achieve significant carbon reduction, exceeding framework targets.`,
            '2563EB', 'EFF6FF', '1e3a5f', W, { boldPrefix: 'Total Potential Saving:' }
          ),
          // Benchmark KPI
          h.spacer(80), h.fullWidthSectionBar('', 'CARBON INTENSITY & BENCHMARK', A), h.spacer(80),
          ...(d.benchmarkKpis.length > 0
            ? [h.kpiDashboard(d.benchmarkKpis.slice(0, 3).map(k => ({ value: k.value, label: k.label })), A, W)]
            : (d.carbonIntensity ? [h.kpiDashboard([
                { value: d.carbonIntensity.split(' ')[0] || '0', label: 'Current tCO\u2082e / \u00A3M' },
                { value: '\u2014', label: 'Achievable tCO\u2082e / \u00A3M' },
                { value: '150', label: 'Framework Target' },
              ], A, W)] : [])
          ),
          h.spacer(60),
          ...h.richBodyText(d.additionalNotes || ''),
          // Sign-off
          h.spacer(80),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — AUDIT-READY (Teal #0D9488)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CfData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('Audit-Ready Carbon Footprint Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Audit-Ready', A);

  const revCols = cols([0.08, 0.12, 0.60, 0.20]);
  const appCols = cols([0.18, 0.18, 0.34, 0.14, 0.16]);
  const matCols8 = cols([0.17, 0.06, 0.05, 0.10, 0.18, 0.18, 0.10, 0.16]);
  const plantCols8 = cols([0.18, 0.06, 0.07, 0.08, 0.16, 0.18, 0.10, 0.17]);
  const transCols7 = cols([0.24, 0.06, 0.08, 0.12, 0.16, 0.16, 0.18]);
  const wasteCols7 = cols([0.18, 0.08, 0.14, 0.12, 0.18, 0.16, 0.14]);
  const assumCols = cols([0.26, 0.34, 0.18, 0.22]);
  const sumCols4q = cols([0.36, 0.20, 0.20, 0.24]);
  const sensCols = cols([0.26, 0.18, 0.18, 0.18, 0.20]);
  const isoCols = cols([0.14, 0.34, 0.26, 0.26]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['AUDIT-READY CARBON', 'FOOTPRINT ASSESSMENT'], d.projectName || '', A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Revision', value: d.revisionHistory?.[0]?.rev ? `${d.revisionHistory[0].rev} \u2014 ${d.revisionHistory[0].description}` : 'Rev A \u2014 First Issue' },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Technical Reviewer', value: d.approvalChain?.find(a => a.role?.toLowerCase().includes('review'))?.name || '' },
            { label: 'Approver', value: d.approvalChain?.find(a => a.role?.toLowerCase().includes('approv') || a.role?.toLowerCase().includes('client'))?.name || '' },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractRef },
            { label: 'Client', value: d.client },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Design Life', value: d.designLife },
            { label: 'Confidentiality', value: d.confidentiality || 'Commercial in Confidence' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Doc Control & Approval
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'DOCUMENT CONTROL & REVISION HISTORY', A), h.spacer(80),
          ...(d.revisionHistory.length > 0 ? [dataTable(A,
            [{ text: 'REV', width: revCols[0] }, { text: 'DATE', width: revCols[1] }, { text: 'DESCRIPTION', width: revCols[2] }, { text: 'AUTHOR', width: revCols[3] }],
            d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('02', 'APPROVAL CHAIN', A), h.spacer(80),
          ...(d.approvalChain.length > 0 ? [dataTable(A,
            [{ text: 'ROLE', width: appCols[0] }, { text: 'NAME', width: appCols[1] }, { text: 'QUALIFICATION / POSITION', width: appCols[2] }, { text: 'DATE', width: appCols[3] }, { text: 'SIGNATURE', width: appCols[4] }],
            d.approvalChain.map(a => [a.role, a.name, a.qualification, a.date, ''])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('03', 'ASSESSMENT SCOPE & SYSTEM BOUNDARY', A), h.spacer(80),
          ...h.richBodyText(d.assessmentScope || ''),
          ...h.richBodyText(d.methodology || ''),
        ] },
      // Materials & Plant verification
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('04', 'MATERIALS CARBON \u2014 DATA SOURCE VERIFICATION (A1\u2013A3)', A), h.spacer(80),
          ...h.richBodyText('Each material entry includes the emission factor source reference, data source for quantity, and a data quality rating.'),
          ...(d.materials.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'MATERIAL', width: matCols8[0] }, { text: 'QTY', width: matCols8[1] }, { text: 'UNIT', width: matCols8[2] }, { text: 'EF', width: matCols8[3] }, { text: 'EF SOURCE REF', width: matCols8[4] }, { text: 'QTY DATA SOURCE', width: matCols8[5] }, { text: 'QUALITY', width: matCols8[6] }, { text: 'tCO\u2082e', width: matCols8[7] }],
            d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.qtyDataSource || '', m.dataQuality || '', m.tco2e]),
            [6]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'PLANT & EQUIPMENT \u2014 FUEL RECORD VERIFICATION', A), h.spacer(80),
          ...(d.plant.length > 0 ? [dataTable(A,
            [{ text: 'PLANT ITEM', width: plantCols8[0] }, { text: 'FUEL', width: plantCols8[1] }, { text: 'HOURS', width: plantCols8[2] }, { text: 'LITRES', width: plantCols8[3] }, { text: 'EF SOURCE', width: plantCols8[4] }, { text: 'DATA SOURCE', width: plantCols8[5] }, { text: 'QUALITY', width: plantCols8[6] }, { text: 'tCO\u2082e', width: plantCols8[7] }],
            d.plant.map(p => [p.item, p.fuelType, p.hours, p.consumption, p.efSource || p.emissionFactor, p.dataSource || '', p.dataQuality || '', p.tco2e]),
            [6]
          )] : []),
        ] },
      // Transport, Waste, Assumptions
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('06', 'TRANSPORT & LOGISTICS \u2014 VERIFIED DATA', A), h.spacer(80),
          ...(d.transport.length > 0 ? [dataTable(A,
            [{ text: 'ROUTE', width: transCols7[0] }, { text: 'LOADS', width: transCols7[1] }, { text: 'DIST', width: transCols7[2] }, { text: 'VEHICLE', width: transCols7[3] }, { text: 'EF SOURCE', width: transCols7[4] }, { text: 'QTY SOURCE', width: transCols7[5] }, { text: 'tCO\u2082e', width: transCols7[6] }],
            d.transport.map(t => [t.description, t.loads, t.distance, t.vehicleType, t.efSource || t.emissionFactor, t.qtySource || '', t.tco2e])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('07', 'WASTE & DISPOSAL \u2014 SWMP VERIFIED', A), h.spacer(80),
          ...(d.waste.length > 0 ? [dataTable(A,
            [{ text: 'WASTE TYPE', width: wasteCols7[0] }, { text: 'QTY (T)', width: wasteCols7[1] }, { text: 'ROUTE', width: wasteCols7[2] }, { text: 'EF', width: wasteCols7[3] }, { text: 'EF SOURCE', width: wasteCols7[4] }, { text: 'DATA SOURCE', width: wasteCols7[5] }, { text: 'tCO\u2082e', width: wasteCols7[6] }],
            d.waste.map(w => [w.wasteType, w.quantity, w.disposalRoute, w.emissionFactor, w.efSource || '', w.dataSource || '', w.tco2e])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('08', 'ASSUMPTION REGISTER', A), h.spacer(80),
          ...h.richBodyText(d.sensitivityNarrative || 'The following assumption register documents every significant assumption made in this assessment.'),
          ...(d.assumptions.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'ASSUMPTION', width: assumCols[0] }, { text: 'JUSTIFICATION', width: assumCols[1] }, { text: 'DATA QUALITY', width: assumCols[2] }, { text: 'SENSITIVITY', width: assumCols[3] }],
            d.assumptions.map(a => [a.assumption, a.justification, a.dataQuality, a.sensitivityImpact]),
            [2, 3]
          )] : []),
        ] },
      // Summary, Sensitivity, ISO, Refs, Sign-off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('09', 'CARBON SUMMARY \u2014 AUDITABLE TOTALS', A), h.spacer(80),
          h.kpiDashboard(
            d.kpiItems.length > 0
              ? d.kpiItems.slice(0, 4).map(k => ({ value: k.value, label: k.label }))
              : [
                  { value: d.totalCo2e || '0', label: 'Total tCO\u2082e' },
                  { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('material'))?.tco2e || '0', label: 'Materials' },
                  { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('construction') || s.category.toLowerCase().includes('plant'))?.tco2e || '0', label: 'Construction' },
                  { value: d.carbonSummary.find(s => s.category.toLowerCase().includes('waste'))?.tco2e || '0', label: 'Waste' },
                ],
            A, W
          ),
          h.spacer(60),
          ...(d.carbonSummary.length > 0 ? [dataTable(A,
            [{ text: 'CATEGORY', width: sumCols4q[0] }, { text: 'tCO\u2082e', width: sumCols4q[1] }, { text: '% OF TOTAL', width: sumCols4q[2] }, { text: 'DATA QUALITY', width: sumCols4q[3] }],
            d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage, s.dataQuality || '']),
            [3]
          )] : []),
          // 10 Sensitivity
          h.spacer(80), h.fullWidthSectionBar('10', 'SENSITIVITY ANALYSIS', A), h.spacer(80),
          ...h.richBodyText(d.sensitivityNarrative || 'A sensitivity analysis has been performed on the assumptions with the highest potential impact.'),
          ...(d.sensitivityAnalysis.length > 0 ? [h.spacer(40), dataTable(A,
            [{ text: 'PARAMETER TESTED', width: sensCols[0] }, { text: 'BASE CASE', width: sensCols[1] }, { text: '\u201320% SCENARIO', width: sensCols[2] }, { text: '+20% SCENARIO', width: sensCols[3] }, { text: 'IMPACT ON TOTAL', width: sensCols[4] }],
            d.sensitivityAnalysis.map(s => [s.parameter, s.baseCase, s.minusScenario, s.plusScenario, s.impactOnTotal])
          )] : []),
          // 11 ISO 14064
          h.spacer(80), h.fullWidthSectionBar('11', 'ISO 14064 COMPLIANCE CHECKLIST', A), h.spacer(80),
          ...(d.isoComplianceChecklist.length > 0 ? [dataTable(A,
            [{ text: 'ISO 14064-1 CLAUSE', width: isoCols[0] }, { text: 'REQUIREMENT', width: isoCols[1] }, { text: 'STATUS', width: isoCols[2] }, { text: 'EVIDENCE SECTION', width: isoCols[3] }],
            d.isoComplianceChecklist.map(i => [i.clause, i.requirement, i.status, i.evidenceSection]),
            [2]
          )] : []),
          // 12 References
          h.spacer(80), h.fullWidthSectionBar('12', 'REFERENCES & AUDIT TRAIL', A), h.spacer(80),
          ...h.richBodyText(d.regulatoryReferences.map(r => `${r.reference} \u2014 ${r.description}`).join('. ') || ''),
          // Sign-off
          h.spacer(80),
          h.signatureGrid(['Assessment Author', 'Technical Reviewer', 'Client Approver', 'Distribution'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCarbonFootprintTemplateDocument(
  content: any,
  templateSlug: CarbonFootprintTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':    return buildT1(d);
    case 'pas-2080-technical': return buildT2(d);
    case 'compact-summary':    return buildT3(d);
    case 'audit-ready':        return buildT4(d);
    default:                   return buildT1(d);
  }
}
