// =============================================================================
// Waste Management Plan — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Site Record      (green #4D7C0F, practical tracking)
// T2 — Corporate        (navy #1E3A5F, client submission, hierarchy strategy)
// T3 — Full Compliance  (teal #0F766E, EPA 1990, duty of care, full forecast)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { WasteTemplateSlug } from '@/lib/waste/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Colours
const LIME = '4D7C0F'; const LIME_DARK = '365314';
const NAVY = '1E3A5F'; const NAVY_DARK = '0f2440';
const TEAL = '0F766E'; const TEAL_DARK = '134e4a'; const TEAL_BG = 'f0fdf4';
const GREEN_RAG = '059669'; const RED_D = '991B1B';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interfaces ──────────────────────────────────────────────────────────
interface WasteStream { stream: string; ewcCode: string; estimatedVolume: string; classification: string; container: string; disposalRoute: string; hierarchyLevel: string; carrier: string; facility: string; costEstimate: string; diversionRate: string; }
interface SkipEntry { skipId: string; type: string; size: string; location: string; delivered: string; collected: string; wtnRef: string; }
interface TransferNote { wtnRef: string; date: string; wasteType: string; ewcCode: string; quantity: string; carrier: string; destination: string; }
interface SegregationItem { item: string; checked: boolean; notes: string; }
interface HierarchyStep { level: number; title: string; description: string; }
interface CarrierFacility { company: string; role: string; registration: string; expiry: string; wasteTypes: string; verified: boolean; }
interface KpiTarget { value: string; label: string; }
interface RegRef { reference: string; description: string; }

interface WmpData {
  documentRef: string; planDate: string; revision: string;
  preparedBy: string; reviewedBy: string; approvedBy: string;
  projectName: string; siteAddress: string; client: string;
  principalContractor: string; contractReference: string;
  estimatedProjectValue: string; estimatedTotalWaste: string; diversionTarget: string;
  projectOverview: string;
  regulatoryContext: string;
  wasteStreams: WasteStream[];
  skipLog: SkipEntry[];
  transferNotes: TransferNote[];
  segregationChecklist: SegregationItem[];
  hierarchySteps: HierarchyStep[];
  carrierFacilities: CarrierFacility[];
  kpiTargets: KpiTarget[];
  kpiNarrative: string;
  dutyCareStatement: string;
  monitoringSchedule: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): WmpData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), planDate: s(c.planDate), revision: s(c.revision, '0'),
    preparedBy: s(c.preparedBy), reviewedBy: s(c.reviewedBy), approvedBy: s(c.approvedBy),
    projectName: s(c.projectName), siteAddress: s(c.siteAddress), client: s(c.client),
    principalContractor: s(c.principalContractor), contractReference: s(c.contractReference),
    estimatedProjectValue: s(c.estimatedProjectValue), estimatedTotalWaste: s(c.estimatedTotalWaste),
    diversionTarget: s(c.diversionTarget, '95%'),
    projectOverview: s(c.projectOverview),
    regulatoryContext: s(c.regulatoryContext),
    wasteStreams: a(c.wasteStreams),
    skipLog: a(c.skipLog),
    transferNotes: a(c.transferNotes),
    segregationChecklist: a(c.segregationChecklist).length > 0 ? a(c.segregationChecklist) : defaultChecklist(),
    hierarchySteps: a(c.hierarchySteps).length > 0 ? a(c.hierarchySteps) : defaultHierarchy(),
    carrierFacilities: a(c.carrierFacilities || c.carrierRegister),
    kpiTargets: a(c.kpiTargets),
    kpiNarrative: s(c.kpiNarrative),
    dutyCareStatement: s(c.dutyCareStatement),
    monitoringSchedule: s(c.monitoringSchedule),
    regulatoryReferences: a(c.regulatoryReferences),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultChecklist(): SegregationItem[] {
  return [
    { item: 'All skips clearly labelled with waste type and EWC code', checked: true, notes: '' },
    { item: 'Segregation signage displayed at skip locations', checked: true, notes: '' },
    { item: 'Concrete washout bay sealed and bunded', checked: true, notes: '' },
    { item: 'Hazardous waste area separate and locked', checked: true, notes: '' },
    { item: 'Toolbox talk on waste segregation delivered', checked: true, notes: '' },
    { item: 'Duty of care transfer notes file maintained', checked: true, notes: '' },
  ];
}
function defaultHierarchy(): HierarchyStep[] {
  return [
    { level: 1, title: 'Prevention', description: 'Accurate material ordering, BIM quantities, just-in-time delivery' },
    { level: 2, title: 'Reuse', description: 'Excavated material reuse, formwork reuse, temporary works materials' },
    { level: 3, title: 'Recycling', description: 'Segregated streams to licensed recycling facilities' },
    { level: 4, title: 'Disposal', description: 'Residual waste to MRF, hazardous to licensed facilities' },
  ];
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: BODY, font: 'Arial', color: opts?.color })] })] });
}
function checkCell(checked: boolean, width: number): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: checked ? '\u2713 YES' : '\u2717 NO', bold: true, size: SM, font: 'Arial', color: checked ? GREEN_RAG : RED_D })] })] });
}

// Waste hierarchy step block (numbered box + text)
function hierarchyBlock(step: HierarchyStep, accent: string): Table {
  const numW = 500; const contentW = W - numW;
  const colours = ['059669', '2563EB', 'D97706', 'DC2626'];
  const fill = colours[Math.min(step.level - 1, colours.length - 1)] || accent;
  const noBorder = { style: BorderStyle.NONE, size: 0, color: h.WHITE };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [numW, contentW],
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: numW, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR }, borders: noBorders,
        margins: { top: 80, bottom: 80, left: 60, right: 60 }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: String(step.level), bold: true, size: 28, font: 'Arial', color: h.WHITE })] })] }),
      new TableCell({ width: { size: contentW, type: WidthType.DXA }, borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: `${step.title}: `, bold: true, size: BODY, font: 'Arial' }),
          new TextRun({ text: step.description, size: BODY, font: 'Arial' }),
        ] })] }),
    ] })] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — SITE RECORD (Green #4D7C0F)
// Cover + content. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: WmpData): Document {
  const A = LIME;
  const hdr = h.accentHeader('Site Waste Record', A);
  const ftr = h.accentFooter(d.documentRef, 'Site Record', A);

  const streamCols = [Math.round(W * 0.18), Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.12), Math.round(W * 0.18)];
  streamCols.push(W - streamCols.reduce((a, b) => a + b, 0));
  const skipCols = [Math.round(W * 0.08), Math.round(W * 0.14), Math.round(W * 0.10), Math.round(W * 0.20), Math.round(W * 0.14), Math.round(W * 0.14)];
  skipCols.push(W - skipCols.reduce((a, b) => a + b, 0));
  const wtnCols = [Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.16), Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.18)];
  wtnCols.push(W - wtnCols.reduce((a, b) => a + b, 0));
  const segCols = [Math.round(W * 0.50), Math.round(W * 0.15)];
  segCols.push(W - segCols[0] - segCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SITE WASTE', 'RECORD'], 'Practical Tracking \u2014 Skips, Transfer Notes & Segregation', LIME_DARK, 'D9F99D'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Site Manager', value: d.preparedBy },
            { label: 'Project', value: d.projectName },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 WASTE STREAM SUMMARY
          h.fullWidthSectionBar('01', 'Waste Stream Summary', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: streamCols,
            rows: [
              new TableRow({ children: [hdrCell('Waste Stream', streamCols[0], A), hdrCell('EWC Code', streamCols[1], A), hdrCell('Est. Qty', streamCols[2], A), hdrCell('Classification', streamCols[3], A), hdrCell('Container', streamCols[4], A), hdrCell('Disposal Route', streamCols[5], A)] }),
              ...d.wasteStreams.map((ws, ri) => new TableRow({ children: [
                txtCell(ws.stream, streamCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.ewcCode, streamCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.estimatedVolume, streamCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.classification, streamCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: ws.classification?.toLowerCase() === 'hazardous' ? RED_D : undefined, bold: ws.classification?.toLowerCase() === 'hazardous' }),
                txtCell(ws.container, streamCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.disposalRoute, streamCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 02 SKIP / CONTAINER LOG
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Skip / Container Log', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: skipCols,
            rows: [
              new TableRow({ children: [hdrCell('Skip ID', skipCols[0], A), hdrCell('Type', skipCols[1], A), hdrCell('Size', skipCols[2], A), hdrCell('Location', skipCols[3], A), hdrCell('Delivered', skipCols[4], A), hdrCell('Collected', skipCols[5], A), hdrCell('WTN Ref', skipCols[6], A)] }),
              ...d.skipLog.map((sk, ri) => new TableRow({ children: [
                txtCell(sk.skipId, skipCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.type, skipCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.size, skipCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.location, skipCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.delivered, skipCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.collected, skipCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(sk.wtnRef, skipCols[6], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 03 TRANSFER NOTE REGISTER
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Transfer Note Register', A),
          h.spacer(80),
          ...(d.transferNotes.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: wtnCols,
            rows: [
              new TableRow({ children: [hdrCell('WTN Ref', wtnCols[0], A), hdrCell('Date', wtnCols[1], A), hdrCell('Waste Type', wtnCols[2], A), hdrCell('EWC', wtnCols[3], A), hdrCell('Qty', wtnCols[4], A), hdrCell('Carrier', wtnCols[5], A), hdrCell('Destination', wtnCols[6], A)] }),
              ...d.transferNotes.map((tn, ri) => new TableRow({ children: [
                txtCell(tn.wtnRef, wtnCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.date, wtnCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.wasteType, wtnCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.ewcCode, wtnCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.quantity, wtnCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.carrier, wtnCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(tn.destination, wtnCols[6], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
              children: [new TextRun({ text: 'No waste transfers to date', size: BODY, font: 'Arial', italics: true, color: GREY })] })]),

          // 04 SEGREGATION CHECKLIST
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Segregation Checklist', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: segCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', segCols[0], A), hdrCell('Check', segCols[1], A), hdrCell('Notes', segCols[2], A)] }),
              ...d.segregationChecklist.map((sc, ri) => new TableRow({ children: [
                txtCell(sc.item, segCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(sc.checked, segCols[1]),
                txtCell(sc.notes, segCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          h.spacer(120),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CORPORATE (Navy #1E3A5F)
// Cover + content. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: WmpData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Site Waste Management Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Corporate', A);

  const forecastCols = [Math.round(W * 0.16), Math.round(W * 0.08), Math.round(W * 0.10), Math.round(W * 0.10), Math.round(W * 0.16), Math.round(W * 0.12)];
  forecastCols.push(W - forecastCols.reduce((a, b) => a + b, 0));
  const carrierCols = [Math.round(W * 0.20), Math.round(W * 0.12), Math.round(W * 0.18), Math.round(W * 0.14)];
  carrierCols.push(W - carrierCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SITE WASTE', 'MANAGEMENT PLAN'], 'Corporate Format \u2014 Client Submission & Tender Document', NAVY_DARK, '93C5FD'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date / Rev', value: `${d.planDate} \u00B7 Revision ${d.revision}` },
            { label: 'Prepared By', value: d.preparedBy },
            { label: 'Reviewed By', value: d.reviewedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractReference },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Client', value: d.client },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 WASTE HIERARCHY STRATEGY
          h.fullWidthSectionBar('01', 'Waste Hierarchy Strategy', A),
          h.spacer(80),
          ...d.hierarchySteps.map(step => {
            const els: (Paragraph | Table)[] = [hierarchyBlock(step, A), h.spacer(40)];
            return els;
          }).flat(),

          // 02 WASTE FORECAST
          h.spacer(80),
          h.fullWidthSectionBar('02', 'Waste Forecast', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: forecastCols,
            rows: [
              new TableRow({ children: [hdrCell('Waste Stream', forecastCols[0], A), hdrCell('EWC', forecastCols[1], A), hdrCell('Forecast', forecastCols[2], A), hdrCell('Class', forecastCols[3], A), hdrCell('Route', forecastCols[4], A), hdrCell('Diversion', forecastCols[5], A), hdrCell('Cost Est.', forecastCols[6], A)] }),
              ...d.wasteStreams.map((ws, ri) => new TableRow({ children: [
                txtCell(ws.stream, forecastCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.ewcCode, forecastCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.estimatedVolume, forecastCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.classification, forecastCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: ws.classification?.toLowerCase() === 'hazardous' ? RED_D : undefined, bold: ws.classification?.toLowerCase() === 'hazardous' }),
                txtCell(ws.disposalRoute, forecastCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.diversionRate || '', forecastCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.costEstimate || '', forecastCols[6], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 03 CARRIER & FACILITY REGISTER
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Carrier & Facility Register', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: carrierCols,
            rows: [
              new TableRow({ children: [hdrCell('Company', carrierCols[0], A), hdrCell('Role', carrierCols[1], A), hdrCell('EA Licence', carrierCols[2], A), hdrCell('Expiry', carrierCols[3], A), hdrCell('Waste Types', carrierCols[4], A)] }),
              ...d.carrierFacilities.map((cf, ri) => new TableRow({ children: [
                txtCell(cf.company, carrierCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.role, carrierCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.registration, carrierCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.expiry, carrierCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.wasteTypes, carrierCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 04 KPI TARGETS & MONITORING
          h.spacer(120),
          h.fullWidthSectionBar('04', 'KPI Targets & Monitoring', A),
          h.spacer(80),
          ...(d.kpiTargets.length > 0 ? [h.kpiDashboard(d.kpiTargets, A, W)] : [h.kpiDashboard([
            { value: d.diversionTarget || '95%', label: 'Landfill Diversion Target' },
            { value: '0', label: 'Duty of Care Breaches' },
            { value: '100%', label: 'Soil Reuse On Site' },
            { value: 'Monthly', label: 'Review Frequency' },
          ], A, W)]),

          // Sign-off + end mark
          h.spacer(120),
          h.signatureGrid(['Prepared By', 'Approved By'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — FULL COMPLIANCE (Teal #0F766E)
// Cover + content. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: WmpData): Document {
  const A = TEAL;
  const LBG = TEAL_BG; const LC = TEAL;
  const hdr = h.accentHeader('Site Waste Management Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Full Compliance', A);

  const fullCols = [Math.round(W * 0.14), Math.round(W * 0.07), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.13), Math.round(W * 0.14), Math.round(W * 0.14)];
  fullCols.push(W - fullCols.reduce((a, b) => a + b, 0));
  const docCols = [Math.round(W * 0.18), Math.round(W * 0.10), Math.round(W * 0.15), Math.round(W * 0.10), Math.round(W * 0.12)];
  docCols.push(W - docCols.reduce((a, b) => a + b, 0));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SITE WASTE', 'MANAGEMENT PLAN'], 'Full Compliance \u00B7 EPA 1990 \u00B7 Duty of Care \u00B7 Waste Forecasting', TEAL_DARK, '99F6E4'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date / Rev', value: `${d.planDate} \u00B7 Revision ${d.revision}` },
            { label: 'Project', value: d.projectName },
            { label: 'Client', value: d.client },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Contract', value: d.contractReference },
            { label: 'Estimated Project Value', value: d.estimatedProjectValue },
            { label: 'Estimated Total Waste', value: d.estimatedTotalWaste },
            { label: 'Diversion Target', value: d.diversionTarget },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 LEGISLATIVE FRAMEWORK
          h.fullWidthSectionBar('01', 'Legislative Framework', A),
          h.spacer(80),
          ...h.richBodyText(d.regulatoryContext || 'This SWMP is prepared in accordance with the Environmental Protection Act 1990 Section 34 (duty of care), the Waste (England and Wales) Regulations 2011, and the Hazardous Waste (England and Wales) Regulations 2005.'),

          // 02 WASTE STREAM FORECAST & MANAGEMENT
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Waste Stream Forecast & Management', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: fullCols,
            rows: [
              new TableRow({ children: [hdrCell('Stream', fullCols[0], A), hdrCell('EWC', fullCols[1], A), hdrCell('Qty', fullCols[2], A), hdrCell('Class', fullCols[3], A), hdrCell('Hierarchy', fullCols[4], A), hdrCell('Carrier', fullCols[5], A), hdrCell('Facility', fullCols[6], A), hdrCell('Cost', fullCols[7], A)] }),
              ...d.wasteStreams.map((ws, ri) => new TableRow({ children: [
                txtCell(ws.stream, fullCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.ewcCode, fullCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.estimatedVolume, fullCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.classification, fullCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: ws.classification?.toLowerCase() === 'hazardous' ? RED_D : undefined, bold: ws.classification?.toLowerCase() === 'hazardous' }),
                txtCell(ws.hierarchyLevel || ws.disposalRoute, fullCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.carrier || '', fullCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.facility || '', fullCols[6], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ws.costEstimate || '', fullCols[7], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 03 DUTY OF CARE CHAIN
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Duty of Care Chain', A),
          h.spacer(80),
          h.calloutBox(
            d.dutyCareStatement || 'The waste producer must ensure all waste is transferred only to authorised persons and received at permitted facilities. Waste transfer notes must be completed for each transfer and retained for 2 years (3 years for hazardous waste).',
            A, LBG, TEAL_DARK, W,
            { boldPrefix: 'Duty of Care (EPA 1990 s.34):' }
          ),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: docCols,
            rows: [
              new TableRow({ children: [hdrCell('Company', docCols[0], A), hdrCell('Role', docCols[1], A), hdrCell('Registration', docCols[2], A), hdrCell('Expiry', docCols[3], A), hdrCell('Verified', docCols[4], A), hdrCell('Waste Types', docCols[5], A)] }),
              ...d.carrierFacilities.map((cf, ri) => new TableRow({ children: [
                txtCell(cf.company, docCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.role, docCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.registration, docCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(cf.expiry, docCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(cf.verified !== false, docCols[4]),
                txtCell(cf.wasteTypes, docCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 04 KPI TARGETS
          h.spacer(120),
          h.fullWidthSectionBar('04', 'KPI Targets', A),
          h.spacer(80),
          ...(d.kpiTargets.length > 0 ? [h.kpiDashboard(d.kpiTargets, A, W)] : [h.kpiDashboard([
            { value: '95%', label: 'Landfill Diversion' },
            { value: '100%', label: 'Soil Reuse' },
            { value: '0', label: 'Duty of Care Breaches' },
            { value: '<\u00A31k', label: 'Net Disposal Cost' },
          ], A, W)]),
          h.spacer(80),
          ...h.richBodyText(d.kpiNarrative || d.monitoringSchedule || 'KPIs reported monthly. Waste data tracked via carrier portal. Quarterly review against targets.'),

          // Sign-off + end mark
          h.spacer(120),
          h.signatureGrid(['Prepared By', 'Environmental Advisor'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildWasteTemplateDocument(
  content: any,
  templateSlug: WasteTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'site-record':      return buildT1(d);
    case 'corporate':        return buildT2(d);
    case 'full-compliance':  return buildT3(d);
    default:                 return buildT3(d);
  }
}
