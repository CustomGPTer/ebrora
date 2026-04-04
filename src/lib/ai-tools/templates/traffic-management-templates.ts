// =============================================================================
// Traffic Management Plan — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Quick Brief       (slate #475569, compact daily briefing)
// T2 — Formal Highways   (charcoal #2D2D2D + amber #B45309, authority submission)
// T3 — Full Chapter 8    (deep green #065F46, comprehensive compliance)
// T4 — Site Plan          (steel blue #1E40AF, internal site operations)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { TrafficTemplateSlug } from '@/lib/traffic/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22; const XL = 28;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Colours
const SLATE = '475569'; const SLATE_DARK = '334155';
const CHARCOAL = '2D2D2D'; const AMBER = 'B45309'; const AMBER_DARK = '92400e';
const DEEP_GREEN = '065F46'; const GREEN_DARK = '064e3b'; const GREEN_BG = 'f0fdf4';
const BLUE = '1E40AF'; const BLUE_DARK = '1e3a8a'; const BLUE_BG = 'eff6ff';
const RED_D = '991B1B'; const RED_BG = 'FEF2F2';
const GREEN_RAG = '059669'; const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interfaces ──────────────────────────────────────────────────────────
interface SignItem { ref: string; tsrgdRef: string; sign: string; size: string; quantity: number | string; location: string; }
interface RiskItem { hazard: string; risk: string; likelihood: string; severity: string; control: string; residualRisk: string; }
interface OperativeRole { name: string; role: string; responsibility: string; qualification: string; }
interface TmControl { control: string; detail: string; }
interface WorksPhase { phase: string; duration: string; works: string; tmArrangement: string; }
interface SiteRoute { route: string; users: string; description: string; speedLimit: string; }
interface SegregationItem { location: string; barrierType: string; detail: string; }
interface BanksmanPosition { position: string; banksman: string; duties: string; }
interface RegRef { reference: string; description: string; }

interface TmpData {
  documentRef: string; planDate: string; reviewDate: string; revision: string;
  preparedBy: string; approvedBy: string;
  projectName: string; siteAddress: string; client: string; principalContractor: string;
  worksDescription: string; tmType: string; duration: string; workingHours: string;
  // Road
  roadName: string; roadClassification: string; speedLimit: string;
  carriageway: string; trafficVolume: string; hgvPercentage: string;
  peakHours: string; sensitiveReceptors: string; publicTransportAffected: string;
  workingLength: string;
  // Submissions
  submittedTo: string; nrswaReference: string; ttroReference: string;
  // Content
  introductoryText: string;
  tmControls: TmControl[];
  signSchedule: SignItem[];
  worksPhases: WorksPhase[];
  temporarySignals: string;
  temporarySpeedLimit: string;
  chapter8Geometry: Array<{ parameter: string; value: string }>;
  signalsSpecification: Array<{ field: string; value: string }>;
  trafficDataTable: Array<{ field: string; value: string }>;
  phasingPlan: string;
  vehicleManagement: string;
  pedestrianManagement: string;
  emergencyAccess: string;
  publicTransport: string;
  riskAssessment: RiskItem[];
  operativeRoles: OperativeRole[];
  siteRoutes: SiteRoute[];
  segregationItems: SegregationItem[];
  banksmanPositions: BanksmanPosition[];
  deliveryManagement: Array<{ field: string; value: string }>;
  speedLimitSite: string; speedLimitExcavation: string;
  minBanksmen: string; reversingPolicy: string;
  monitoringArrangements: string;
  communicationPlan: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): TmpData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const rd = c.roadDetails || {};
  return {
    documentRef: s(c.documentRef), planDate: s(c.planDate), reviewDate: s(c.reviewDate), revision: s(c.revision, '0'),
    preparedBy: s(c.preparedBy), approvedBy: s(c.approvedBy),
    projectName: s(c.projectName), siteAddress: s(c.siteAddress), client: s(c.client), principalContractor: s(c.principalContractor),
    worksDescription: s(c.worksDescription), tmType: s(c.tmType), duration: s(c.duration), workingHours: s(c.workingHours),
    roadName: s(rd.roadName || c.roadName), roadClassification: s(rd.classification || c.roadClassification),
    speedLimit: s(rd.speedLimit || c.speedLimit), carriageway: s(rd.carriageway || c.carriageway),
    trafficVolume: s(rd.trafficVolume || c.trafficVolume), hgvPercentage: s(c.hgvPercentage),
    peakHours: s(c.peakHours), sensitiveReceptors: s(c.sensitiveReceptors), publicTransportAffected: s(c.publicTransportAffected),
    workingLength: s(rd.workingLength || c.workingLength),
    submittedTo: s(c.submittedTo), nrswaReference: s(c.nrswaReference), ttroReference: s(c.ttroReference),
    introductoryText: s(c.introductoryText),
    tmControls: a(c.tmControls),
    signSchedule: a(c.signSchedule),
    worksPhases: a(c.worksPhases),
    temporarySignals: s(c.temporarySignals),
    temporarySpeedLimit: s(c.temporarySpeedLimit),
    chapter8Geometry: a(c.chapter8Geometry),
    signalsSpecification: a(c.signalsSpecification),
    trafficDataTable: a(c.trafficDataTable),
    phasingPlan: s(c.phasingPlan),
    vehicleManagement: s(c.vehicleManagement),
    pedestrianManagement: s(c.pedestrianManagement),
    emergencyAccess: s(c.emergencyAccess),
    publicTransport: s(c.publicTransport),
    riskAssessment: a(c.riskAssessment),
    operativeRoles: a(c.operativeRoles),
    siteRoutes: a(c.siteRoutes),
    segregationItems: a(c.segregationItems),
    banksmanPositions: a(c.banksmanPositions),
    deliveryManagement: a(c.deliveryManagement),
    speedLimitSite: s(c.speedLimitSite, '5'), speedLimitExcavation: s(c.speedLimitExcavation, '3'),
    minBanksmen: s(c.minBanksmen, '2'), reversingPolicy: s(c.reversingPolicy, '0 Reversing Unassisted'),
    monitoringArrangements: s(c.monitoringArrangements),
    communicationPlan: s(c.communicationPlan),
    regulatoryReferences: a(c.regulatoryReferences),
    additionalNotes: s(c.additionalNotes),
  };
}

// ── Shared Cell Helpers ──────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || BODY, font: 'Arial', color: opts?.color })] })] });
}
function accentInfoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        shading: { fill: lbg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial', color: lc })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial' })] })] }),
    ] })) });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — QUICK BRIEF (Slate #475569)
// Cover + compact content page. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: TmpData): Document {
  const A = SLATE;
  const hdr = h.accentHeader('Traffic Management Quick Brief', A);
  const ftr = h.accentFooter(d.documentRef, 'Quick Brief', A);
  const ctrlCols = [Math.round(W * 0.30)]; ctrlCols.push(W - ctrlCols[0]);
  const roleCols = [Math.round(W * 0.22), Math.round(W * 0.20)]; roleCols.push(W - roleCols[0] - roleCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['TRAFFIC MANAGEMENT', 'QUICK BRIEF'], d.worksDescription?.substring(0, 80) || 'Daily TM Briefing', SLATE_DARK, 'CBD5E1'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Prepared By', value: d.preparedBy },
            { label: 'Works', value: d.tmType || d.worksDescription?.substring(0, 100) },
            { label: 'Duration', value: d.duration },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 WORKS SUMMARY
          h.fullWidthSectionBar('01', 'Works Summary', A),
          h.spacer(80),
          ...h.richBodyText(d.worksDescription || 'Works description to be confirmed.'),

          // 02 TM LAYOUT & CONTROLS
          h.spacer(120),
          h.fullWidthSectionBar('02', 'TM Layout & Controls', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ctrlCols,
            rows: [
              new TableRow({ children: [hdrCell('Control', ctrlCols[0], A), hdrCell('Detail', ctrlCols[1], A)] }),
              ...d.tmControls.map((c, ri) => new TableRow({ children: [
                txtCell(c.control, ctrlCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(c.detail, ctrlCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 03 OPERATIVE ROLES
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Operative Roles', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: roleCols,
            rows: [
              new TableRow({ children: [hdrCell('Name', roleCols[0], A), hdrCell('Role', roleCols[1], A), hdrCell('Responsibilities', roleCols[2], A)] }),
              ...d.operativeRoles.map((r, ri) => new TableRow({ children: [
                txtCell(r.name, roleCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.role, roleCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.responsibility, roleCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 04 EMERGENCY PROCEDURE
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Emergency Procedure', A),
          h.spacer(80),
          h.calloutBox(
            d.emergencyAccess || 'Emergency procedure to be confirmed.',
            'DC2626', RED_BG, RED_D, W,
            { boldPrefix: 'In the event of a vehicle incident, breakdown, or collision:' }
          ),

          h.spacer(120),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — FORMAL HIGHWAYS (Charcoal #2D2D2D + Amber #B45309)
// Cover + content. Section numbering: 1.0, 2.0... with amber number, charcoal title
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: TmpData): Document {
  const A = CHARCOAL;
  const hdr = h.accentHeader('Temporary Traffic Management Plan', AMBER);
  const ftr = h.accentFooter(d.documentRef, 'Formal Highways', AMBER);
  const signCols = [Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.28), Math.round(W * 0.10), Math.round(W * 0.08)];
  signCols.push(W - signCols[0] - signCols[1] - signCols[2] - signCols[3] - signCols[4]);
  const riskCols = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.42)];
  riskCols.push(W - riskCols[0] - riskCols[1] - riskCols[2]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['TEMPORARY TRAFFIC', 'MANAGEMENT PLAN'], `For Highway Authority Approval \u2014 ${d.roadName || d.siteAddress}`, AMBER_DARK, 'FDE68A'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'TMP Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Revision', value: d.revision },
            { label: 'Submitted To', value: d.submittedTo },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'NRSWA Reference', value: d.nrswaReference },
            { label: 'Works Location', value: `${d.roadName}, ${d.siteAddress}` },
            { label: 'Works Duration', value: d.duration },
            { label: 'Road Classification', value: `${d.roadClassification}, ${d.speedLimit}, ${d.trafficVolume}` },
          ], AMBER, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 1.0 INTRODUCTION & REGULATORY BASIS
          h.fullWidthSectionBar('1.0', 'Introduction & Regulatory Basis', A),
          h.spacer(80),
          ...h.richBodyText(d.introductoryText || d.worksDescription || 'Introduction to be confirmed.'),

          // 2.0 SIGN SCHEDULE (TSRGD)
          h.spacer(120),
          h.fullWidthSectionBar('2.0', 'Sign Schedule (TSRGD)', A),
          h.spacer(80),
          ...(d.signSchedule.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: signCols,
            rows: [
              new TableRow({ children: [hdrCell('Ref', signCols[0], AMBER), hdrCell('TSRGD', signCols[1], AMBER), hdrCell('Description', signCols[2], AMBER), hdrCell('Size', signCols[3], AMBER), hdrCell('Qty', signCols[4], AMBER), hdrCell('Position', signCols[5], AMBER)] }),
              ...d.signSchedule.map((s, ri) => new TableRow({ children: [
                txtCell(s.ref, signCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.tsrgdRef, signCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.sign, signCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.size || '', signCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(String(s.quantity ?? ''), signCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.location, signCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 3.0 TEMPORARY TRAFFIC SIGNALS
          h.spacer(120),
          h.fullWidthSectionBar('3.0', 'Temporary Traffic Signals', A),
          h.spacer(80),
          ...h.richBodyText(d.temporarySignals || ''),

          // 4.0 TEMPORARY SPEED LIMIT
          h.spacer(120),
          h.fullWidthSectionBar('4.0', 'Temporary Speed Limit', A),
          h.spacer(80),
          ...h.richBodyText(d.temporarySpeedLimit || ''),

          // 5.0 RISK ASSESSMENT
          h.spacer(120),
          h.fullWidthSectionBar('5.0', 'Risk Assessment', A),
          h.spacer(80),
          ...(d.riskAssessment.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: riskCols,
            rows: [
              new TableRow({ children: [hdrCell('Hazard', riskCols[0], AMBER), hdrCell('Risk', riskCols[1], AMBER), hdrCell('Control', riskCols[2], AMBER), hdrCell('Residual', riskCols[3], AMBER)] }),
              ...d.riskAssessment.map((r, ri) => new TableRow({ children: [
                txtCell(r.hazard, riskCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.risk, riskCols[1], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: r.risk?.toLowerCase() === 'high' ? RED_D : AMBER }),
                txtCell(r.control, riskCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.residualRisk, riskCols[3], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: GREEN_RAG }),
              ] })),
            ] })] : []),

          // 6.0 APPROVAL
          h.spacer(120),
          h.fullWidthSectionBar('6.0', 'Approval', A),
          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By (HA)'], AMBER, W),
          h.spacer(80),
          ...h.endMark(AMBER),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — FULL CHAPTER 8 (Deep Green #065F46)
// Cover + content pages. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: TmpData): Document {
  const A = DEEP_GREEN;
  const LBG = GREEN_BG; const LC = DEEP_GREEN;
  const hdr = h.accentHeader('Chapter 8 Traffic Management Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Full Chapter 8', A);
  const signCols = [Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.24), Math.round(W * 0.08), Math.round(W * 0.06)];
  signCols.push(W - signCols[0] - signCols[1] - signCols[2] - signCols[3] - signCols[4]);
  const phaseCols = [Math.round(W * 0.10), Math.round(W * 0.14), Math.round(W * 0.38)];
  phaseCols.push(W - phaseCols[0] - phaseCols[1] - phaseCols[2]);
  const riskCols = [Math.round(W * 0.20), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.40)];
  riskCols.push(W - riskCols[0] - riskCols[1] - riskCols[2] - riskCols[3]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CHAPTER 8 TRAFFIC', 'MANAGEMENT PLAN'], 'Full Compliance \u00B7 TSRGD \u00B7 Safety at Street Works \u00B7 DMRB', GREEN_DARK, 'A7F3D0'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'TMP Reference', value: d.documentRef },
            { label: 'Date / Rev', value: `${d.planDate} \u00B7 Revision ${d.revision}` },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Project', value: d.projectName },
            { label: 'Highway Authority', value: d.submittedTo },
            { label: 'NRSWA Ref', value: d.nrswaReference },
            { label: 'Road', value: `${d.roadName}, ${d.speedLimit}, ${d.trafficVolume}` },
            { label: 'Works Duration', value: d.duration },
            { label: 'TM Type', value: d.tmType },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 INTRODUCTION & COMPLIANCE
          h.fullWidthSectionBar('01', 'Introduction & Compliance', A),
          h.spacer(80),
          ...h.richBodyText(d.introductoryText || d.worksDescription || 'Introduction to be confirmed.'),

          // 02 SITE DESCRIPTION & TRAFFIC DATA
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Site Description & Traffic Data', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Road', value: `${d.roadName} \u2014 ${d.carriageway}, ${d.workingLength || ''}` },
            { label: 'Speed Limit', value: d.speedLimit },
            { label: 'AADT', value: d.trafficVolume },
            { label: 'HGV %', value: d.hgvPercentage },
            { label: 'Peak Hours', value: d.peakHours },
            { label: 'Sensitive Receptors', value: d.sensitiveReceptors },
            { label: 'Public Transport', value: d.publicTransportAffected || d.publicTransport },
          ], LBG, LC),

          // 03 WORKS DESCRIPTION & PHASING
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Works Description & Phasing', A),
          h.spacer(80),
          ...h.richBodyText(d.phasingPlan || d.worksDescription || ''),
          ...(d.worksPhases.length > 0 ? [h.spacer(80), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: phaseCols,
            rows: [
              new TableRow({ children: [hdrCell('Phase', phaseCols[0], A), hdrCell('Duration', phaseCols[1], A), hdrCell('Works', phaseCols[2], A), hdrCell('TM Arrangement', phaseCols[3], A)] }),
              ...d.worksPhases.map((p, ri) => new TableRow({ children: [
                txtCell(p.phase, phaseCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.duration, phaseCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.works, phaseCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(p.tmArrangement, phaseCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 04 SIGN SCHEDULE (TSRGD 2016)
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Sign Schedule (TSRGD 2016)', A),
          h.spacer(80),
          ...(d.signSchedule.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: signCols,
            rows: [
              new TableRow({ children: [hdrCell('Ref', signCols[0], A), hdrCell('TSRGD', signCols[1], A), hdrCell('Description', signCols[2], A), hdrCell('Size', signCols[3], A), hdrCell('Qty', signCols[4], A), hdrCell('Position / Notes', signCols[5], A)] }),
              ...d.signSchedule.map((s, ri) => new TableRow({ children: [
                txtCell(s.ref, signCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.tsrgdRef, signCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.sign, signCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.size || '', signCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(String(s.quantity ?? ''), signCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.location, signCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 05 TEMPORARY SIGNALS SPECIFICATION
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Temporary Signals Specification', A),
          h.spacer(80),
          ...(d.signalsSpecification.length > 0 ? [accentInfoTable(
            d.signalsSpecification.map(s => ({ label: s.field, value: s.value })), LBG, LC
          )] : h.richBodyText(d.temporarySignals || '')),

          // 06 CHAPTER 8 GEOMETRY
          h.spacer(120),
          h.fullWidthSectionBar('06', 'Chapter 8 Geometry', A),
          h.spacer(80),
          ...(d.chapter8Geometry.length > 0 ? [accentInfoTable(
            d.chapter8Geometry.map(g => ({ label: g.parameter, value: g.value })), LBG, LC
          )] : []),

          // 07 RISK ASSESSMENT
          h.spacer(120),
          h.fullWidthSectionBar('07', 'Risk Assessment', A),
          h.spacer(80),
          ...(d.riskAssessment.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: riskCols,
            rows: [
              new TableRow({ children: [hdrCell('Hazard', riskCols[0], A), hdrCell('L', riskCols[1], A), hdrCell('S', riskCols[2], A), hdrCell('Control Measure', riskCols[3], A), hdrCell('Residual', riskCols[4], A)] }),
              ...d.riskAssessment.map((r, ri) => new TableRow({ children: [
                txtCell(r.hazard, riskCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.likelihood, riskCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.severity, riskCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.control, riskCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.residualRisk, riskCols[4], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE, color: GREEN_RAG }),
              ] })),
            ] })] : []),

          // 08 MONITORING & REVIEW
          h.spacer(120),
          h.fullWidthSectionBar('08', 'Monitoring & Review', A),
          h.spacer(80),
          ...h.richBodyText(d.monitoringArrangements || 'Monitoring arrangements to be confirmed.'),

          // Sign-off + end mark
          h.spacer(120),
          h.signatureGrid(['TM Designer', 'Highway Authority'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — SITE PLAN (Steel Blue #1E40AF)
// Cover + content. Section numbering: 01, 02...
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: TmpData): Document {
  const A = BLUE;
  const LBG = BLUE_BG; const LC = BLUE;
  const hdr = h.accentHeader('Site Traffic Management Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Site Plan', A);
  const routeCols = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.46)];
  routeCols.push(W - routeCols[0] - routeCols[1] - routeCols[2]);
  const segCols = [Math.round(W * 0.22), Math.round(W * 0.20)];
  segCols.push(W - segCols[0] - segCols[1]);
  const bankCols = [Math.round(W * 0.22), Math.round(W * 0.20)];
  bankCols.push(W - bankCols[0] - bankCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SITE TRAFFIC', 'MANAGEMENT PLAN'], 'Internal Site Operations \u2014 Vehicle & Pedestrian Segregation', BLUE_DARK, '93C5FD'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'TMP Reference', value: d.documentRef },
            { label: 'Date / Rev', value: `${d.planDate} \u00B7 Revision ${d.revision}` },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Prepared By', value: d.preparedBy },
            { label: 'Approved By', value: d.approvedBy },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 SITE LAYOUT & ROUTES
          h.fullWidthSectionBar('01', 'Site Layout & Routes', A),
          h.spacer(80),
          ...h.richBodyText(d.vehicleManagement || d.worksDescription || ''),
          ...(d.siteRoutes.length > 0 ? [h.spacer(80), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: routeCols,
            rows: [
              new TableRow({ children: [hdrCell('Route', routeCols[0], A), hdrCell('Users', routeCols[1], A), hdrCell('Description', routeCols[2], A), hdrCell('Speed Limit', routeCols[3], A)] }),
              ...d.siteRoutes.map((r, ri) => new TableRow({ children: [
                txtCell(r.route, routeCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.users, routeCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.description, routeCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(r.speedLimit, routeCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 02 VEHICLE / PEDESTRIAN SEGREGATION
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Vehicle / Pedestrian Segregation', A),
          h.spacer(80),
          ...(d.segregationItems.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: segCols,
            rows: [
              new TableRow({ children: [hdrCell('Location', segCols[0], A), hdrCell('Barrier Type', segCols[1], A), hdrCell('Detail', segCols[2], A)] }),
              ...d.segregationItems.map((s, ri) => new TableRow({ children: [
                txtCell(s.location, segCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.barrierType, segCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(s.detail, segCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : h.richBodyText(d.pedestrianManagement || '')),

          // 03 SPEED LIMITS & BANKSMEN — KPI dashboard + banksmen table
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Speed Limits & Banksmen', A),
          h.spacer(80),
          h.kpiDashboard([
            { value: d.speedLimitSite, label: 'mph \u2014 Haul Road' },
            { value: d.speedLimitExcavation, label: 'mph \u2014 Near Excavation' },
            { value: d.minBanksmen, label: 'Banksmen Min.' },
            { value: '0', label: 'Reversing Unassisted' },
          ], A, W),
          ...(d.banksmanPositions.length > 0 ? [h.spacer(80), new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: bankCols,
            rows: [
              new TableRow({ children: [hdrCell('Position', bankCols[0], A), hdrCell('Banksman', bankCols[1], A), hdrCell('Duties', bankCols[2], A)] }),
              ...d.banksmanPositions.map((b, ri) => new TableRow({ children: [
                txtCell(b.position, bankCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(b.banksman, bankCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(b.duties, bankCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 04 DELIVERY MANAGEMENT
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Delivery Management', A),
          h.spacer(80),
          ...(d.deliveryManagement.length > 0 ? [accentInfoTable(
            d.deliveryManagement.map(dm => ({ label: dm.field, value: dm.value })), LBG, LC
          )] : h.richBodyText(d.communicationPlan || '')),

          // 05 EMERGENCY ACCESS
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Emergency Access', A),
          h.spacer(80),
          h.calloutBox(
            d.emergencyAccess || 'Emergency access arrangements to be confirmed.',
            'DC2626', RED_BG, RED_D, W,
            { boldPrefix: 'Emergency Vehicle Access:' }
          ),

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
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildTrafficTemplateDocument(
  content: any,
  templateSlug: TrafficTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'quick-brief':       return buildT1(d);
    case 'formal-highways':   return buildT2(d);
    case 'full-chapter8':     return buildT3(d);
    case 'site-plan':         return buildT4(d);
    default:                  return buildT3(d);
  }
}
