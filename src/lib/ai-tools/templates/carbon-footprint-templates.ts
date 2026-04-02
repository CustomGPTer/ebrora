// =============================================================================
// Carbon Footprint Assessment Builder — Multi-Template Engine
// 4 visual templates, all consuming the same Carbon Footprint JSON structure.
//   T1 — Ebrora Standard  (green, cover page, ICE v3.2 tables, ~4pp)
//   T2 — PAS 2080 Technical (navy, life cycle modules A–D, ~5pp)
//   T3 — Compact Summary   (grey, dense 2-page dashboard)
//   T4 — Audit-Ready       (teal, doc control, traceability, ~5pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CarbonFootprintTemplateSlug } from '@/lib/carbon-footprint/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN;
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa';
const GREY_BG = 'F3F4F6'; const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface CfData {
  documentRef: string; assessmentDate: string; assessedBy: string;
  projectName: string; siteAddress: string; client: string;
  principalContractor: string; designLife: string;
  assessmentScope: string; systemBoundary: string;
  methodology: string; functionalUnit: string;
  materials: Array<{ material: string; quantity: string; unit: string; emissionFactor: string; source: string; tco2e: string }>;
  plant: Array<{ item: string; fuelType: string; hours: string; consumption: string; emissionFactor: string; tco2e: string }>;
  transport: Array<{ description: string; loads: string; distance: string; vehicleType: string; emissionFactor: string; tco2e: string }>;
  waste: Array<{ wasteType: string; quantity: string; disposalRoute: string; emissionFactor: string; tco2e: string }>;
  temporaryWorks: Array<{ item: string; quantity: string; unit: string; emissionFactor: string; tco2e: string }>;
  carbonSummary: Array<{ category: string; tco2e: string; percentage: string }>;
  totalCo2e: string; carbonIntensity: string;
  hotspots: Array<{ rank: string; source: string; tco2e: string; percentage: string; reductionOpportunity: string }>;
  reductionMeasures: Array<{ measure: string; potentialSaving: string; feasibility: string; recommendation: string }>;
  assumptions: Array<{ assumption: string; justification: string; dataQuality: string; sensitivityImpact: string }>;
  regulatoryReferences: Array<{ reference: string; description: string }>;
  approvalChain: Array<{ role: string; name: string; qualification: string; date: string }>;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CfData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef', 'CF-001'), assessmentDate: s('assessmentDate'), assessedBy: s('assessedBy'),
    projectName: s('projectName'), siteAddress: s('siteAddress'), client: s('client'),
    principalContractor: s('principalContractor'), designLife: s('designLife', '60 years'),
    assessmentScope: s('assessmentScope'), systemBoundary: s('systemBoundary'),
    methodology: s('methodology'), functionalUnit: s('functionalUnit'),
    materials: a('materials'), plant: a('plant'), transport: a('transport'),
    waste: a('waste'), temporaryWorks: a('temporaryWorks'),
    carbonSummary: a('carbonSummary'), totalCo2e: s('totalCo2e'),
    carbonIntensity: s('carbonIntensity'),
    hotspots: a('hotspots'), reductionMeasures: a('reductionMeasures'),
    assumptions: a('assumptions'), regulatoryReferences: a('regulatoryReferences'),
    approvalChain: a('approvalChain'), revisionHistory: a('revisionHistory'),
    additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, color = EBRORA) {
  return h.headerCell(text, width, { fillColor: color, color: 'FFFFFF', fontSize: SM });
}
function dCell(text: string, width: number, opts?: { fill?: string }) {
  return h.dataCell(text, width, { fontSize: SM, fillColor: opts?.fill });
}
function footerLine() {
  return h.bodyText('— End of Document —', SM, { italic: true, color: '999999' });
}
function coverPage(d: CfData, accentColor: string, label: string) {
  return [
    h.spacer(600),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: label, bold: true, size: TTL, color: accentColor })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: d.projectName || 'Construction Carbon Footprint Assessment', size: XL, color: accentColor })] }),
    h.spacer(200),
    h.infoTable([
      { label: 'Document Ref', value: d.documentRef },
      { label: 'Assessment Date', value: d.assessmentDate },
      { label: 'Assessed By', value: d.assessedBy },
      { label: 'Project', value: d.projectName },
      { label: 'Site Address', value: d.siteAddress },
      { label: 'Client', value: d.client },
      { label: 'Principal Contractor', value: d.principalContractor },
    ], W),
    h.spacer(200),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generated by Ebrora — www.ebrora.com', size: SM, color: '999999', italics: true })] }),
  ];
}
function dataTable(headers: { text: string; width: number }[], rows: any[][], color = EBRORA): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, color)) }),
      ...rows.map((cells, i) => new TableRow({
        children: cells.map((cell, ci) => dCell(String(cell || ''), headers[ci].width, { fill: i % 2 === 1 ? ZEBRA : undefined })),
      })),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — Ebrora Standard (green branded, cover page, ICE v3.2 tables)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CfData): Document {
  const sections: Paragraph[] = [];
  // Assessment Scope
  sections.push(h.sectionHeading('1. Assessment Basis & Methodology'));
  sections.push(...h.prose(d.methodology || 'This carbon footprint assessment uses ICE v3.2 emission factors.'));
  sections.push(h.sectionHeading('2. Project Overview & Scope Boundary'));
  sections.push(...h.prose(d.assessmentScope || d.systemBoundary || ''));
  // Materials
  sections.push(h.sectionHeading('3. Materials Carbon (A1–A3)'));
  if (d.materials.length > 0) {
    const mw = [Math.round(W*0.22), Math.round(W*0.12), Math.round(W*0.08), Math.round(W*0.20), Math.round(W*0.20), W - Math.round(W*0.22) - Math.round(W*0.12) - Math.round(W*0.08) - Math.round(W*0.20) - Math.round(W*0.20)];
    sections.push(dataTable(
      [{ text: 'Material', width: mw[0] }, { text: 'Qty', width: mw[1] }, { text: 'Unit', width: mw[2] }, { text: 'EF (kgCO₂e)', width: mw[3] }, { text: 'Source', width: mw[4] }, { text: 'tCO₂e', width: mw[5] }],
      d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.tco2e])
    ) as any);
  }
  // Plant
  sections.push(h.sectionHeading('4. Plant & Equipment Emissions'));
  if (d.plant.length > 0) {
    const pw = [Math.round(W*0.25), Math.round(W*0.12), Math.round(W*0.12), Math.round(W*0.15), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.12) - Math.round(W*0.12) - Math.round(W*0.15) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Plant Item', width: pw[0] }, { text: 'Fuel', width: pw[1] }, { text: 'Hours', width: pw[2] }, { text: 'Litres', width: pw[3] }, { text: 'EF', width: pw[4] }, { text: 'tCO₂e', width: pw[5] }],
      d.plant.map(p => [p.item, p.fuelType, p.hours, p.consumption, p.emissionFactor, p.tco2e])
    ) as any);
  }
  // Transport
  sections.push(h.sectionHeading('5. Transport & Logistics'));
  if (d.transport.length > 0) {
    const tw = [Math.round(W*0.25), Math.round(W*0.08), Math.round(W*0.12), Math.round(W*0.18), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.08) - Math.round(W*0.12) - Math.round(W*0.18) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Description', width: tw[0] }, { text: 'Loads', width: tw[1] }, { text: 'Dist (km)', width: tw[2] }, { text: 'Vehicle', width: tw[3] }, { text: 'EF', width: tw[4] }, { text: 'tCO₂e', width: tw[5] }],
      d.transport.map(t => [t.description, t.loads, t.distance, t.vehicleType, t.emissionFactor, t.tco2e])
    ) as any);
  }
  // Waste
  sections.push(h.sectionHeading('6. Waste & Disposal'));
  if (d.waste.length > 0) {
    const ww = [Math.round(W*0.25), Math.round(W*0.15), Math.round(W*0.22), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.15) - Math.round(W*0.22) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Waste Type', width: ww[0] }, { text: 'Qty', width: ww[1] }, { text: 'Disposal', width: ww[2] }, { text: 'EF', width: ww[3] }, { text: 'tCO₂e', width: ww[4] }],
      d.waste.map(w => [w.wasteType, w.quantity, w.disposalRoute, w.emissionFactor, w.tco2e])
    ) as any);
  }
  // Summary
  sections.push(h.sectionHeading('7. Carbon Summary Dashboard'));
  if (d.carbonSummary.length > 0) {
    const sw = [Math.round(W*0.45), Math.round(W*0.25), W - Math.round(W*0.45) - Math.round(W*0.25)];
    sections.push(dataTable(
      [{ text: 'Category', width: sw[0] }, { text: 'tCO₂e', width: sw[1] }, { text: '% of Total', width: sw[2] }],
      d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage])
    ) as any);
  }
  sections.push(h.bodyText(`Total Project Carbon: ${d.totalCo2e} tCO₂e`, LG, { bold: true, color: EBRORA }));
  if (d.carbonIntensity) sections.push(h.bodyText(`Carbon Intensity: ${d.carbonIntensity}`, BODY));
  // Hotspots
  sections.push(h.sectionHeading('8. Hotspot Analysis'));
  if (d.hotspots.length > 0) {
    const hw = [Math.round(W*0.06), Math.round(W*0.22), Math.round(W*0.12), Math.round(W*0.12), W - Math.round(W*0.06) - Math.round(W*0.22) - Math.round(W*0.12) - Math.round(W*0.12)];
    sections.push(dataTable(
      [{ text: '#', width: hw[0] }, { text: 'Source', width: hw[1] }, { text: 'tCO₂e', width: hw[2] }, { text: '%', width: hw[3] }, { text: 'Reduction Opportunity', width: hw[4] }],
      d.hotspots.map(hs => [hs.rank, hs.source, hs.tco2e, hs.percentage, hs.reductionOpportunity])
    ) as any);
  }
  // Reduction
  sections.push(h.sectionHeading('9. Carbon Reduction Opportunities'));
  if (d.reductionMeasures.length > 0) {
    const rw = [Math.round(W*0.30), Math.round(W*0.20), Math.round(W*0.18), W - Math.round(W*0.30) - Math.round(W*0.20) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Measure', width: rw[0] }, { text: 'Potential Saving', width: rw[1] }, { text: 'Feasibility', width: rw[2] }, { text: 'Recommendation', width: rw[3] }],
      d.reductionMeasures.map(r => [r.measure, r.potentialSaving, r.feasibility, r.recommendation])
    ) as any);
  }
  // Refs and notes
  sections.push(h.sectionHeading('10. Regulatory References'));
  d.regulatoryReferences.forEach(r => { sections.push(h.bodyText(`${r.reference} — ${r.description}`, SM)); });
  if (d.additionalNotes) { sections.push(h.sectionHeading('11. Additional Notes')); sections.push(...h.prose(d.additionalNotes)); }
  // Sign-off
  sections.push(h.sectionHeading('12. Sign-Off & Review'));
  sections.push(h.approvalTable((d.approvalChain || []).map((a: any) => ({ role: a.role, name: a.name, date: a.date })), W) as any);
  sections.push(h.spacer(200));
  sections.push(footerLine());

  return new Document({
    sections: [
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, children: coverPage(d, EBRORA, 'CARBON FOOTPRINT ASSESSMENT') },
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Carbon Footprint Assessment') }, footers: { default: h.ebroraFooter() }, children: sections },
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T2 — PAS 2080 Technical (navy, life cycle modules)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CfData): Document {
  const sections: Paragraph[] = [];
  sections.push(h.sectionHeading('1. PAS 2080:2023 Assessment Scope', LG, NAVY));
  sections.push(...h.prose(d.assessmentScope || ''));
  sections.push(h.bodyText(`System Boundary: ${d.systemBoundary || 'A1–A5, C1–C4'}`, BODY));
  sections.push(h.bodyText(`Functional Unit: ${d.functionalUnit || 'Project total'}`, BODY));
  sections.push(h.bodyText(`Design Life: ${d.designLife}`, BODY));

  sections.push(h.sectionHeading('2. Product Stage — Modules A1–A3', LG, NAVY));
  sections.push(...h.prose(d.methodology || 'Materials embodied carbon assessed using ICE v3.2 emission factors.'));
  if (d.materials.length > 0) {
    const mw = [Math.round(W*0.22), Math.round(W*0.12), Math.round(W*0.08), Math.round(W*0.20), Math.round(W*0.20), W - Math.round(W*0.22) - Math.round(W*0.12) - Math.round(W*0.08) - Math.round(W*0.20) - Math.round(W*0.20)];
    sections.push(dataTable(
      [{ text: 'Material', width: mw[0] }, { text: 'Qty', width: mw[1] }, { text: 'Unit', width: mw[2] }, { text: 'EF', width: mw[3] }, { text: 'Source', width: mw[4] }, { text: 'tCO₂e', width: mw[5] }],
      d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.tco2e]), NAVY
    ) as any);
  }

  sections.push(h.sectionHeading('3. Transport Stage — Module A4', LG, NAVY));
  if (d.transport.length > 0) {
    const tw = [Math.round(W*0.25), Math.round(W*0.08), Math.round(W*0.12), Math.round(W*0.18), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.08) - Math.round(W*0.12) - Math.round(W*0.18) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Description', width: tw[0] }, { text: 'Loads', width: tw[1] }, { text: 'Dist', width: tw[2] }, { text: 'Vehicle', width: tw[3] }, { text: 'EF', width: tw[4] }, { text: 'tCO₂e', width: tw[5] }],
      d.transport.map(t => [t.description, t.loads, t.distance, t.vehicleType, t.emissionFactor, t.tco2e]), NAVY
    ) as any);
  }

  sections.push(h.sectionHeading('4. Construction Process — Module A5', LG, NAVY));
  if (d.plant.length > 0) {
    const pw = [Math.round(W*0.25), Math.round(W*0.12), Math.round(W*0.12), Math.round(W*0.15), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.12) - Math.round(W*0.12) - Math.round(W*0.15) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Plant Item', width: pw[0] }, { text: 'Fuel', width: pw[1] }, { text: 'Hours', width: pw[2] }, { text: 'Litres', width: pw[3] }, { text: 'EF', width: pw[4] }, { text: 'tCO₂e', width: pw[5] }],
      d.plant.map(p => [p.item, p.fuelType, p.hours, p.consumption, p.emissionFactor, p.tco2e]), NAVY
    ) as any);
  }
  if (d.waste.length > 0) {
    sections.push(h.subHeading('Construction Waste (A5w)', BODY, NAVY));
    const ww = [Math.round(W*0.25), Math.round(W*0.15), Math.round(W*0.22), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.15) - Math.round(W*0.22) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Waste', width: ww[0] }, { text: 'Qty', width: ww[1] }, { text: 'Disposal', width: ww[2] }, { text: 'EF', width: ww[3] }, { text: 'tCO₂e', width: ww[4] }],
      d.waste.map(w => [w.wasteType, w.quantity, w.disposalRoute, w.emissionFactor, w.tco2e]), NAVY
    ) as any);
  }

  sections.push(h.sectionHeading('5. End of Life — Modules C1–C4', LG, NAVY));
  sections.push(...h.prose('End of life carbon assessment based on anticipated decommissioning and disposal routes at the end of the assessed design life.'));

  sections.push(h.sectionHeading('6. Beyond System Boundary — Module D', LG, NAVY));
  sections.push(...h.prose('Module D benefits from recyclable materials, energy recovery, and biogenic carbon assessed where data is available.'));

  sections.push(h.sectionHeading('7. Carbon Reduction Hierarchy', LG, NAVY));
  sections.push(h.bodyText('Build Nothing → Build Less → Build Clever → Build Efficiently', LG, { bold: true, color: NAVY }));
  d.reductionMeasures.forEach(r => { sections.push(h.bodyText(`• ${r.measure}: ${r.recommendation} (${r.potentialSaving})`, SM)); });

  sections.push(h.sectionHeading('8. Whole-Life Carbon Summary', LG, NAVY));
  if (d.carbonSummary.length > 0) {
    const sw = [Math.round(W*0.45), Math.round(W*0.25), W - Math.round(W*0.45) - Math.round(W*0.25)];
    sections.push(dataTable(
      [{ text: 'Module / Category', width: sw[0] }, { text: 'tCO₂e', width: sw[1] }, { text: '% of Total', width: sw[2] }],
      d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage]), NAVY
    ) as any);
  }
  sections.push(h.bodyText(`Total: ${d.totalCo2e} tCO₂e | Intensity: ${d.carbonIntensity || 'N/A'}`, LG, { bold: true, color: NAVY }));

  sections.push(h.sectionHeading('9. Benchmarking', LG, NAVY));
  sections.push(...h.prose('Carbon performance benchmarked against sector targets where applicable (RIBA 2030 Climate Challenge, IStructE, LETI).'));

  sections.push(h.sectionHeading('10. References'));
  d.regulatoryReferences.forEach(r => { sections.push(h.bodyText(`${r.reference} — ${r.description}`, SM)); });
  if (d.additionalNotes) { sections.push(h.sectionHeading('11. Additional Notes')); sections.push(...h.prose(d.additionalNotes)); }
  sections.push(h.spacer(200));
  sections.push(footerLine());

  return new Document({
    sections: [
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, children: coverPage(d, NAVY, 'PAS 2080:2023 CARBON ASSESSMENT') },
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('PAS 2080 Carbon Assessment') }, footers: { default: h.ebroraFooter() }, children: sections },
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T3 — Compact Summary (dense 2-page dashboard, no cover page)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CfData): Document {
  const sections: Paragraph[] = [];
  // Header info bar
  sections.push(h.infoTable([
    { label: 'Project', value: d.projectName }, { label: 'Ref', value: d.documentRef },
    { label: 'Date', value: d.assessmentDate }, { label: 'Assessor', value: d.assessedBy },
  ], W) as any);
  sections.push(h.spacer(100));
  sections.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'CARBON FOOTPRINT SUMMARY', bold: true, size: XL, color: '374151' })] }));

  // Summary table
  sections.push(h.sectionHeading('Carbon by Category', LG, '374151'));
  if (d.carbonSummary.length > 0) {
    const sw = [Math.round(W*0.50), Math.round(W*0.25), W - Math.round(W*0.50) - Math.round(W*0.25)];
    sections.push(dataTable(
      [{ text: 'Category', width: sw[0] }, { text: 'tCO₂e', width: sw[1] }, { text: '%', width: sw[2] }],
      d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage]), '374151'
    ) as any);
  }
  sections.push(h.bodyText(`TOTAL: ${d.totalCo2e} tCO₂e`, LG, { bold: true, color: '374151' }));
  if (d.carbonIntensity) sections.push(h.bodyText(`Intensity: ${d.carbonIntensity}`, BODY));

  // Top hotspots
  sections.push(h.sectionHeading('Top Carbon Hotspots', LG, '374151'));
  d.hotspots.slice(0, 5).forEach(hs => {
    sections.push(h.bodyText(`${hs.rank}. ${hs.source} — ${hs.tco2e} tCO₂e (${hs.percentage}) → ${hs.reductionOpportunity}`, SM));
  });

  // Top reduction measures
  sections.push(h.sectionHeading('Top Reduction Measures', LG, '374151'));
  d.reductionMeasures.slice(0, 5).forEach(r => {
    sections.push(h.bodyText(`• ${r.measure}: ${r.potentialSaving} — ${r.recommendation}`, SM));
  });

  if (d.additionalNotes) { sections.push(h.spacer(100)); sections.push(...h.prose(d.additionalNotes)); }
  sections.push(h.spacer(100));
  sections.push(footerLine());

  return new Document({
    sections: [{
      properties: { page: { margin: { top: h.MARGIN_NARROW, bottom: h.MARGIN_NARROW, left: h.MARGIN_NARROW, right: h.MARGIN_NARROW } } },
      headers: { default: h.ebroraHeader('Carbon Footprint Summary') }, footers: { default: h.ebroraFooter() },
      children: sections,
    }],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// T4 — Audit-Ready (teal, doc control, full traceability)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CfData): Document {
  const sections: Paragraph[] = [];
  // Doc control
  sections.push(h.sectionHeading('Document Control', LG, TEAL));
  if (d.revisionHistory.length > 0) {
    const rw = [Math.round(W*0.10), Math.round(W*0.18), Math.round(W*0.50), W - Math.round(W*0.10) - Math.round(W*0.18) - Math.round(W*0.50)];
    sections.push(dataTable(
      [{ text: 'Rev', width: rw[0] }, { text: 'Date', width: rw[1] }, { text: 'Description', width: rw[2] }, { text: 'Author', width: rw[3] }],
      d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author]), TEAL
    ) as any);
  }
  // Approval chain
  sections.push(h.sectionHeading('Approval Chain', LG, TEAL));
  if (d.approvalChain.length > 0) {
    const aw = [Math.round(W*0.20), Math.round(W*0.25), Math.round(W*0.30), W - Math.round(W*0.20) - Math.round(W*0.25) - Math.round(W*0.30)];
    sections.push(dataTable(
      [{ text: 'Role', width: aw[0] }, { text: 'Name', width: aw[1] }, { text: 'Qualification', width: aw[2] }, { text: 'Date', width: aw[3] }],
      d.approvalChain.map(a => [a.role, a.name, a.qualification, a.date]), TEAL
    ) as any);
  }
  // Scope
  sections.push(h.sectionHeading('1. Assessment Scope & System Boundary', LG, TEAL));
  sections.push(...h.prose(d.assessmentScope || ''));
  sections.push(h.bodyText(`Methodology: ${d.methodology || 'ICE v3.2'}`, BODY));
  sections.push(h.bodyText(`System Boundary: ${d.systemBoundary || 'A1–A5, C1–C4'}`, BODY));
  // Materials with source refs
  sections.push(h.sectionHeading('2. Materials Carbon — Data Source Verification', LG, TEAL));
  if (d.materials.length > 0) {
    const mw = [Math.round(W*0.20), Math.round(W*0.10), Math.round(W*0.08), Math.round(W*0.18), Math.round(W*0.26), W - Math.round(W*0.20) - Math.round(W*0.10) - Math.round(W*0.08) - Math.round(W*0.18) - Math.round(W*0.26)];
    sections.push(dataTable(
      [{ text: 'Material', width: mw[0] }, { text: 'Qty', width: mw[1] }, { text: 'Unit', width: mw[2] }, { text: 'EF', width: mw[3] }, { text: 'Data Source / Ref', width: mw[4] }, { text: 'tCO₂e', width: mw[5] }],
      d.materials.map(m => [m.material, m.quantity, m.unit, m.emissionFactor, m.source, m.tco2e]), TEAL
    ) as any);
  }
  // Plant, Transport, Waste (same structure as T1 but with teal accent)
  sections.push(h.sectionHeading('3. Plant & Equipment Emissions', LG, TEAL));
  if (d.plant.length > 0) {
    const pw = [Math.round(W*0.25), Math.round(W*0.12), Math.round(W*0.12), Math.round(W*0.15), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.12) - Math.round(W*0.12) - Math.round(W*0.15) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Plant', width: pw[0] }, { text: 'Fuel', width: pw[1] }, { text: 'Hrs', width: pw[2] }, { text: 'Litres', width: pw[3] }, { text: 'EF', width: pw[4] }, { text: 'tCO₂e', width: pw[5] }],
      d.plant.map(p => [p.item, p.fuelType, p.hours, p.consumption, p.emissionFactor, p.tco2e]), TEAL
    ) as any);
  }
  sections.push(h.sectionHeading('4. Transport & Logistics', LG, TEAL));
  if (d.transport.length > 0) {
    const tw = [Math.round(W*0.25), Math.round(W*0.08), Math.round(W*0.12), Math.round(W*0.18), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.08) - Math.round(W*0.12) - Math.round(W*0.18) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Description', width: tw[0] }, { text: 'Loads', width: tw[1] }, { text: 'Dist', width: tw[2] }, { text: 'Vehicle', width: tw[3] }, { text: 'EF', width: tw[4] }, { text: 'tCO₂e', width: tw[5] }],
      d.transport.map(t => [t.description, t.loads, t.distance, t.vehicleType, t.emissionFactor, t.tco2e]), TEAL
    ) as any);
  }
  sections.push(h.sectionHeading('5. Waste & Disposal', LG, TEAL));
  if (d.waste.length > 0) {
    const ww = [Math.round(W*0.25), Math.round(W*0.15), Math.round(W*0.22), Math.round(W*0.18), W - Math.round(W*0.25) - Math.round(W*0.15) - Math.round(W*0.22) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Waste', width: ww[0] }, { text: 'Qty', width: ww[1] }, { text: 'Disposal', width: ww[2] }, { text: 'EF', width: ww[3] }, { text: 'tCO₂e', width: ww[4] }],
      d.waste.map(w => [w.wasteType, w.quantity, w.disposalRoute, w.emissionFactor, w.tco2e]), TEAL
    ) as any);
  }
  // Assumption Register
  sections.push(h.sectionHeading('6. Assumption Register', LG, TEAL));
  if (d.assumptions.length > 0) {
    const asw = [Math.round(W*0.30), Math.round(W*0.30), Math.round(W*0.18), W - Math.round(W*0.30) - Math.round(W*0.30) - Math.round(W*0.18)];
    sections.push(dataTable(
      [{ text: 'Assumption', width: asw[0] }, { text: 'Justification', width: asw[1] }, { text: 'Data Quality', width: asw[2] }, { text: 'Sensitivity', width: asw[3] }],
      d.assumptions.map(a => [a.assumption, a.justification, a.dataQuality, a.sensitivityImpact]), TEAL
    ) as any);
  }
  // Summary
  sections.push(h.sectionHeading('7. Carbon Summary', LG, TEAL));
  if (d.carbonSummary.length > 0) {
    const sw = [Math.round(W*0.45), Math.round(W*0.25), W - Math.round(W*0.45) - Math.round(W*0.25)];
    sections.push(dataTable(
      [{ text: 'Category', width: sw[0] }, { text: 'tCO₂e', width: sw[1] }, { text: '%', width: sw[2] }],
      d.carbonSummary.map(s => [s.category, s.tco2e, s.percentage]), TEAL
    ) as any);
  }
  sections.push(h.bodyText(`Total: ${d.totalCo2e} tCO₂e`, LG, { bold: true, color: TEAL }));
  // ISO 14064 checklist note
  sections.push(h.sectionHeading('8. ISO 14064 Compliance Checklist', LG, TEAL));
  sections.push(h.bodyText('Assessment boundaries defined per ISO 14064-1 ✓', SM));
  sections.push(h.bodyText('Emission factors traceable to named sources ✓', SM));
  sections.push(h.bodyText('Assumptions documented with confidence ratings ✓', SM));
  sections.push(h.bodyText('Verification and approval chain documented ✓', SM));
  // Refs
  sections.push(h.sectionHeading('9. References'));
  d.regulatoryReferences.forEach(r => { sections.push(h.bodyText(`${r.reference} — ${r.description}`, SM)); });
  if (d.additionalNotes) { sections.push(h.sectionHeading('10. Additional Notes')); sections.push(...h.prose(d.additionalNotes)); }
  sections.push(h.spacer(200));
  sections.push(footerLine());

  return new Document({
    sections: [
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, children: coverPage(d, TEAL, 'AUDIT-READY CARBON ASSESSMENT') },
      { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Audit-Ready Carbon Assessment') }, footers: { default: h.ebroraFooter() }, children: sections },
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
