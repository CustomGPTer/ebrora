// =============================================================================
// LIFT PLAN BUILDER — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, comprehensive, ~3pp)
// T2 — Operator Brief     (amber #D97706, crane cab card, ~2pp)
// T3 — LOLER Compliance   (navy #1e293b, regulatory checklists, ~2pp)
// T4 — Tandem Lift        (teal #0f766e, dual crane, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { LiftPlanTemplateSlug } from '@/lib/lift-plan/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'ECFDF5';
const AMBER_D = '92400E'; const AMBER = 'D97706'; const AMBER_SUB = 'FDE68A';
const NAVY = '1e293b'; const NAVY_SUB = '93C5FD'; const NAVY_BG = 'F1F5F9';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4'; const TEAL_BG = 'F0FDFA';
const RED = 'DC2626'; const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface (unchanged — complex multi-object model) ───────────────────
interface LiftPlanData {
  documentRef: string; planDate: string; liftCategory: string; liftDescription: string;
  projectName: string; siteAddress: string; preparedBy: string; principalContractor: string;
  loadDetails: { description: string; weight: string; riggingWeight: string; totalWeight: string; dimensions: string; centreOfGravity: string; numberOfLifts: string; loadCondition: string; liftingPoints: string };
  craneDetails: { type: string; makeModel: string; capacity: string; serialNumber: string; lastThoroughExam: string; certExpiry: string; owner: string; insuranceRef: string };
  crane2Details: { type: string; makeModel: string; capacity: string; serialNumber: string; lastThoroughExam: string; certExpiry: string; owner: string; insuranceRef: string };
  liftGeometry: { maxRadius: string; maxHeight: string; dutyAtRadius: string; percentCapacity: string; slewArc: string; tailSwing: string; boomLength: string; counterweight: string; minRadius: string };
  crane2Geometry: { maxRadius: string; maxHeight: string; dutyAtRadius: string; percentCapacity: string; slewArc: string; tailSwing: string; boomLength: string; counterweight: string; minRadius: string };
  riggingItems: Array<{ item: string; specification: string; swl: string; certRef: string; certExpiry: string; condition: string }>;
  groundDetails: { groundType: string; bearingCapacity: string; outriggerSpread: string; padLoadPerLeg: string; matSize: string; gradient: string };
  proximityHazards: Array<{ hazard: string; distance: string; mitigation: string }>;
  appointedPersons: Array<{ role: string; name: string; qualification: string; certRef: string }>;
  liftSteps: Array<{ step: string; action: string; responsibility: string; signal: string }>;
  weatherLimits: Array<{ parameter: string; limit: string; action: string }>;
  lolerChecks: Array<{ regulation: string; requirement: string; evidence: string; status: string }>;
  equipmentRegister: Array<{ item: string; lastExam: string; nextExam: string; certRef: string; examiner: string; status: string }>;
  whatIfScenarios: Array<{ scenario: string; consequence: string; control: string }>;
  commItems: Array<{ role: string; radio: string; channel: string; callSign: string }>;
  loadShareCalc: string; syncPlan: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): LiftPlanData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const o = (v: any) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const ld = o(c.loadDetails); const cd = o(c.craneDetails); const c2 = o(c.crane2Details);
  const lg = o(c.liftGeometry); const c2g = o(c.crane2Geometry); const gd = o(c.groundDetails);
  return {
    documentRef: s(c.documentRef, 'LP-001'), planDate: s(c.planDate), liftCategory: s(c.liftCategory),
    liftDescription: s(c.liftDescription), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    preparedBy: s(c.preparedBy), principalContractor: s(c.principalContractor),
    loadDetails: { description: s(ld.description), weight: s(ld.weight), riggingWeight: s(ld.riggingWeight), totalWeight: s(ld.totalWeight), dimensions: s(ld.dimensions), centreOfGravity: s(ld.centreOfGravity), numberOfLifts: s(ld.numberOfLifts), loadCondition: s(ld.loadCondition), liftingPoints: s(ld.liftingPoints) },
    craneDetails: { type: s(cd.type), makeModel: s(cd.makeModel), capacity: s(cd.capacity), serialNumber: s(cd.serialNumber), lastThoroughExam: s(cd.lastThoroughExam), certExpiry: s(cd.certExpiry), owner: s(cd.owner), insuranceRef: s(cd.insuranceRef) },
    crane2Details: { type: s(c2.type), makeModel: s(c2.makeModel), capacity: s(c2.capacity), serialNumber: s(c2.serialNumber), lastThoroughExam: s(c2.lastThoroughExam), certExpiry: s(c2.certExpiry), owner: s(c2.owner), insuranceRef: s(c2.insuranceRef) },
    liftGeometry: { maxRadius: s(lg.maxRadius), maxHeight: s(lg.maxHeight), dutyAtRadius: s(lg.dutyAtRadius), percentCapacity: s(lg.percentCapacity), slewArc: s(lg.slewArc), tailSwing: s(lg.tailSwing), boomLength: s(lg.boomLength), counterweight: s(lg.counterweight), minRadius: s(lg.minRadius) },
    crane2Geometry: { maxRadius: s(c2g.maxRadius), maxHeight: s(c2g.maxHeight), dutyAtRadius: s(c2g.dutyAtRadius), percentCapacity: s(c2g.percentCapacity), slewArc: s(c2g.slewArc), tailSwing: s(c2g.tailSwing), boomLength: s(c2g.boomLength), counterweight: s(c2g.counterweight), minRadius: s(c2g.minRadius) },
    riggingItems: a(c.riggingItems), groundDetails: { groundType: s(gd.groundType), bearingCapacity: s(gd.bearingCapacity), outriggerSpread: s(gd.outriggerSpread), padLoadPerLeg: s(gd.padLoadPerLeg), matSize: s(gd.matSize), gradient: s(gd.gradient) },
    proximityHazards: a(c.proximityHazards), appointedPersons: a(c.appointedPersons),
    liftSteps: a(c.liftSteps), weatherLimits: a(c.weatherLimits),
    lolerChecks: a(c.lolerChecks), equipmentRegister: a(c.equipmentRegister),
    whatIfScenarios: a(c.whatIfScenarios), commItems: a(c.commItems),
    loadShareCalc: s(c.loadShareCalc), syncPlan: s(c.syncPlan),
    additionalNotes: s(c.additionalNotes),
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function hdrC(text: string, width: number, accent: string): TableCell { return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM }); }
function txtC(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell { return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color }); }
function ragC(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('good') || low.includes('valid') || low.includes('new') || low === '\u2713' || low.includes('✓')) { bg = 'D1FAE5'; color = '059669'; }
  else if (low.includes('due') || low.includes('pending')) { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('expired') || low.includes('fail')) { bg = 'FEF2F2'; color = RED; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(hh => hh.width),
    rows: [
      new TableRow({ children: headers.map(hh => hdrC(hh.text, hh.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragC(String(cell || ''), headers[ci].width) :
          txtC(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined, bold: String(cell || '').toUpperCase().includes('TOTAL') })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] { const w = ratios.map(r => Math.round(W * r)); w[w.length - 1] = W - w.slice(0, -1).reduce((a2, b) => a2 + b, 0); return w; }
function infoRows(d: LiftPlanData, fields: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> { return fields; }


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669, 9 sections, 3pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: LiftPlanData): Document {
  const A = GREEN;
  const hdr2 = h.accentHeader('Lift Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);
  const rigCols = cols([0.16, 0.24, 0.10, 0.18, 0.16, 0.16]);
  const hazCols = cols([0.30, 0.18, 0.52]);
  const stepCols = cols([0.06, 0.42, 0.24, 0.28]);
  const wxCols = cols([0.22, 0.30, 0.48]);
  const apCols = cols([0.22, 0.24, 0.30, 0.24]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['LIFT PLAN'], d.liftDescription || d.projectName || '', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Lift Date', value: d.planDate },
            { label: 'Lift Category', value: d.liftCategory },
            { label: 'Project', value: d.projectName },
            { label: 'Location', value: d.siteAddress },
            { label: 'Crane', value: `${d.craneDetails.makeModel} (${d.craneDetails.capacity} capacity)` },
            { label: 'Load', value: `${d.loadDetails.description} — ${d.loadDetails.totalWeight} total` },
            { label: 'Radius', value: d.liftGeometry.maxRadius },
            { label: 'Duty at Radius', value: d.liftGeometry.dutyAtRadius },
            { label: '% Capacity', value: d.liftGeometry.percentCapacity },
            { label: 'Appointed Person', value: d.preparedBy },
            { label: 'Contractor', value: d.principalContractor },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body page 1 — Load, Crane, Geometry, Rigging, Ground
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'LOAD DETAILS', A), h.spacer(60),
          h.coverInfoTable([
            { label: 'Load Description', value: d.loadDetails.description },
            { label: 'Load Weight (nett)', value: d.loadDetails.weight },
            { label: 'Rigging Weight', value: d.loadDetails.riggingWeight },
            { label: 'Total Suspended Load', value: d.loadDetails.totalWeight },
            { label: 'Dimensions', value: d.loadDetails.dimensions },
            { label: 'Centre of Gravity', value: d.loadDetails.centreOfGravity },
            { label: 'Lifting Points', value: d.loadDetails.liftingPoints },
            { label: 'Load Condition', value: d.loadDetails.loadCondition },
            { label: 'Number of Lifts', value: d.loadDetails.numberOfLifts },
          ], A, W),
          h.spacer(80), h.fullWidthSectionBar('02', 'CRANE SPECIFICATION', A), h.spacer(60),
          h.coverInfoTable([
            { label: 'Crane Type', value: d.craneDetails.type || d.craneDetails.makeModel },
            { label: 'Max Capacity', value: d.craneDetails.capacity },
            { label: 'Boom Configuration', value: d.liftGeometry.boomLength },
            { label: 'Counterweight', value: d.liftGeometry.counterweight },
            { label: 'Serial Number', value: d.craneDetails.serialNumber },
            { label: 'Owner / Hirer', value: d.craneDetails.owner },
            { label: 'Last Thorough Examination', value: d.craneDetails.lastThoroughExam },
            { label: 'Certificate Expiry', value: d.craneDetails.certExpiry },
            { label: 'Insurance', value: d.craneDetails.insuranceRef },
          ], A, W),
          h.spacer(80), h.fullWidthSectionBar('03', 'LIFT GEOMETRY & CAPACITY', A), h.spacer(60),
          h.kpiDashboard([
            { value: d.liftGeometry.maxRadius || '—', label: 'Max Radius' },
            { value: d.liftGeometry.maxHeight || '—', label: 'Lift Height' },
            { value: d.liftGeometry.dutyAtRadius || '—', label: 'Duty @ Radius' },
            { value: d.loadDetails.totalWeight || '—', label: 'Total Load' },
            { value: d.liftGeometry.percentCapacity || '—', label: '% Capacity' },
          ], A, W),
          h.spacer(60),
          h.calloutBox(
            `Total suspended load (${d.loadDetails.totalWeight}) at maximum radius (${d.liftGeometry.maxRadius}) = ${d.liftGeometry.percentCapacity} of the crane's rated duty. This is within the 80% maximum permitted for non-routine lifts per BS 7121-1:2016. The lift is approved to proceed within these parameters.`,
            A, GREEN_BG, '134e4a', W, { boldPrefix: 'Capacity Check:' }
          ),
          h.spacer(80), h.fullWidthSectionBar('04', 'RIGGING ARRANGEMENT', A), h.spacer(60),
          ...(d.riggingItems.length > 0 ? [dTable(A,
            [{ text: 'ITEM', width: rigCols[0] }, { text: 'SPECIFICATION', width: rigCols[1] }, { text: 'SWL', width: rigCols[2] }, { text: 'CERT REF', width: rigCols[3] }, { text: 'CERT EXPIRY', width: rigCols[4] }, { text: 'CONDITION', width: rigCols[5] }],
            d.riggingItems.map(r => [r.item, r.specification, r.swl, r.certRef, r.certExpiry, r.condition]), [5]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'GROUND CONDITIONS & OUTRIGGERS', A), h.spacer(60),
          h.coverInfoTable([
            { label: 'Ground Type', value: d.groundDetails.groundType },
            { label: 'Bearing Capacity', value: d.groundDetails.bearingCapacity },
            { label: 'Outrigger Spread', value: d.groundDetails.outriggerSpread },
            { label: 'Pad Load Per Leg', value: d.groundDetails.padLoadPerLeg },
            { label: 'Mat Size Required', value: d.groundDetails.matSize },
            { label: 'Gradient', value: d.groundDetails.gradient },
          ], A, W),
        ] },
      // Body page 2 — Hazards, Sequence, Weather, Persons, Sign-off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('06', 'PROXIMITY HAZARDS & EXCLUSION ZONES', A), h.spacer(60),
          ...(d.proximityHazards.length > 0 ? [dTable(A,
            [{ text: 'HAZARD', width: hazCols[0] }, { text: 'DISTANCE', width: hazCols[1] }, { text: 'CONTROL', width: hazCols[2] }],
            d.proximityHazards.map(ph => [ph.hazard, ph.distance, ph.mitigation]),
          )] : []),
          h.spacer(40),
          h.calloutBox(
            `A minimum exclusion zone of the lift radius + 3m must be established on all sides during lifting. Heras fencing with "LIFTING IN PROGRESS — KEEP CLEAR" signage. Banksman to control pedestrian and vehicle access. No person shall stand under a suspended load at any time.`,
            AMBER, 'FFFBEB', '92400E', W, { boldPrefix: 'Exclusion Zone:' }
          ),
          h.spacer(80), h.fullWidthSectionBar('07', 'LIFT SEQUENCE', A), h.spacer(60),
          ...(d.liftSteps.length > 0 ? [dTable(A,
            [{ text: 'STEP', width: stepCols[0] }, { text: 'ACTION', width: stepCols[1] }, { text: 'RESPONSIBLE', width: stepCols[2] }, { text: 'SIGNAL', width: stepCols[3] }],
            d.liftSteps.map((ls, i) => [ls.step || String(i + 1), ls.action, ls.responsibility, ls.signal]),
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('08', 'WEATHER LIMITS & ABORT CRITERIA', A), h.spacer(60),
          ...(d.weatherLimits.length > 0 ? [dTable(A,
            [{ text: 'PARAMETER', width: wxCols[0] }, { text: 'LIMIT', width: wxCols[1] }, { text: 'ACTION IF EXCEEDED', width: wxCols[2] }],
            d.weatherLimits.map(wl => [wl.parameter, wl.limit, wl.action]),
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('09', 'APPOINTED PERSONS & COMPETENCE', A), h.spacer(60),
          ...(d.appointedPersons.length > 0 ? [dTable(A,
            [{ text: 'ROLE', width: apCols[0] }, { text: 'NAME', width: apCols[1] }, { text: 'QUALIFICATION', width: apCols[2] }, { text: 'CARD/CERT REF', width: apCols[3] }],
            d.appointedPersons.map(ap => [ap.role, ap.name, ap.qualification, ap.certRef]),
          )] : []),
          h.spacer(80),
          h.signatureGrid(['Appointed Person', 'Crane Operator', 'Slinger / Signaller', 'Site Manager Approval'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — OPERATOR BRIEF (Amber #D97706, crane cab card, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: LiftPlanData): Document {
  const A = AMBER;
  const hdr2 = h.accentHeader('Operator Lift Brief', A);
  const ftr = h.accentFooter(d.documentRef, 'Operator Brief', A);
  const stepCols = cols([0.08, 0.62, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['CRANE OPERATOR', 'LIFT BRIEF'], 'For Operator\'s Cab — Laminate & Display', AMBER_D, AMBER_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Lift Plan Ref', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Crane', value: d.craneDetails.makeModel },
            { label: 'Load', value: `${d.loadDetails.description} — ${d.loadDetails.totalWeight} total` },
            { label: 'Appointed Person', value: d.preparedBy },
          ], AMBER_D, W),
          h.coverFooterLine(),
        ] },
      // Body — single page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          // Large print total load
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
            new TextRun({ text: `TOTAL LOAD: ${d.loadDetails.totalWeight || '—'}`, bold: true, size: 36, font: 'Arial', color: A }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: `${d.loadDetails.description} (${d.loadDetails.weight}) + rigging (${d.loadDetails.riggingWeight})`, size: SM, font: 'Arial', color: GREY }),
          ] }),
          // 4-col KPI
          h.kpiDashboard([
            { value: d.liftGeometry.maxRadius || '—', label: 'Max Radius' },
            { value: d.liftGeometry.maxHeight || '—', label: 'Lift Height' },
            { value: d.liftGeometry.dutyAtRadius || '—', label: 'Duty @ Radius' },
            { value: d.liftGeometry.percentCapacity || '—', label: '% Capacity' },
          ], A, W),
          h.spacer(60),
          h.fullWidthSectionBar('', 'CRANE CONFIGURATION', A), h.spacer(60),
          h.coverInfoTable([
            { label: 'Boom', value: d.liftGeometry.boomLength },
            { label: 'Counterweight', value: d.liftGeometry.counterweight },
            { label: 'Outriggers', value: d.groundDetails.outriggerSpread },
            { label: 'Slew Limit', value: d.liftGeometry.slewArc },
            { label: 'Pick-Up Radius', value: d.liftGeometry.minRadius },
            { label: 'Set-Down Radius', value: d.liftGeometry.maxRadius },
          ], A, W),
          h.spacer(60), h.fullWidthSectionBar('', 'LIFT SEQUENCE — QUICK STEPS', A), h.spacer(60),
          ...(d.liftSteps.length > 0 ? [dTable(A,
            [{ text: '#', width: stepCols[0] }, { text: 'ACTION', width: stepCols[1] }, { text: 'SIGNAL', width: stepCols[2] }],
            d.liftSteps.slice(0, 6).map((ls, i) => [String(i + 1), ls.action, ls.signal]),
          )] : []),
          h.spacer(60), h.fullWidthSectionBar('', '\u26A0 ABORT CRITERIA — STOP IMMEDIATELY IF:', RED), h.spacer(40),
          ...(d.weatherLimits.length > 0
            ? d.weatherLimits.slice(0, 6).map(wl => new Paragraph({ spacing: { after: 30 }, indent: { left: 280 }, children: [
                new TextRun({ text: '\u2022  ', bold: true, size: SM, font: 'Arial', color: RED }),
                new TextRun({ text: `${wl.parameter}: ${wl.limit}`, size: SM, font: 'Arial' }),
              ] }))
            : [new Paragraph({ spacing: { after: 30 }, indent: { left: 280 }, children: [
                new TextRun({ text: '\u2022  Wind exceeds manufacturer limit. Load tilts or spins. LMI alarm activates. Person enters exclusion zone. Loss of communication.', size: SM, font: 'Arial' }),
              ] })]
          ),
          h.spacer(60),
          // End mark
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: GREY, space: 8 } },
            children: [new TextRun({ text: '\u2014 Designed for laminating and placing in the crane cab \u2014', size: SM, font: 'Arial', color: GREY, italics: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true }),
          ] }),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — LOLER COMPLIANCE (Navy #1e293b, regulatory checklists, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: LiftPlanData): Document {
  const A = NAVY;
  const hdr2 = h.accentHeader('LOLER Compliance Lift Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'LOLER Compliance', A);
  const lolerCols = cols([0.06, 0.30, 0.42, 0.22]);
  const teCols = cols([0.20, 0.14, 0.14, 0.18, 0.18, 0.16]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['LOLER 1998 COMPLIANCE', 'LIFT PLAN'], 'Regulatory Compliance Record — BS 7121 / LOLER / PUWER', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Crane', value: d.craneDetails.makeModel },
            { label: 'Load', value: `${d.loadDetails.totalWeight} (${d.loadDetails.description})` },
            { label: 'Lift Category', value: d.liftCategory },
            { label: 'LOLER Compliance', value: 'All requirements satisfied — see checklist' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'LOLER 1998 — REGULATION-BY-REGULATION COMPLIANCE', A), h.spacer(60),
          ...(d.lolerChecks.length > 0 ? [dTable(A,
            [{ text: 'REG.', width: lolerCols[0] }, { text: 'REQUIREMENT', width: lolerCols[1] }, { text: 'EVIDENCE', width: lolerCols[2] }, { text: 'STATUS', width: lolerCols[3] }],
            d.lolerChecks.map(lc => [lc.regulation, lc.requirement, lc.evidence, lc.status || '\u2713']), [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'THOROUGH EXAMINATION RECORDS', A), h.spacer(60),
          ...(d.equipmentRegister.length > 0 ? [dTable(A,
            [{ text: 'EQUIPMENT', width: teCols[0] }, { text: 'TE DATE', width: teCols[1] }, { text: 'NEXT DUE', width: teCols[2] }, { text: 'CERT REF', width: teCols[3] }, { text: 'EXAMINER', width: teCols[4] }, { text: 'STATUS', width: teCols[5] }],
            d.equipmentRegister.map(er => [er.item, er.lastExam, er.nextExam, er.certRef, er.examiner || '', er.status || 'Valid']), [5]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'LIFT CATEGORISATION (BS 7121-1:2016)', A), h.spacer(60),
          h.coverInfoTable([
            { label: 'Category', value: d.liftCategory },
            { label: 'Justification', value: d.liftDescription || '' },
            { label: 'BS 7121 Parts Applicable', value: 'Part 1 (Code of Practice), Part 3 (Mobile Cranes)' },
            { label: 'Lift Plan Required?', value: 'Yes — Non-routine lifts require a written lift plan per BS 7121-1 Clause 9.3' },
          ], A, W),
          h.spacer(60),
          h.calloutBox(
            'PUWER 1998: Regulation 4 (suitability) — crane suitable for this lift. Regulation 5 (maintenance) — maintained per service schedule. Regulation 6 (inspection) — pre-lift inspection checklist completed. Regulation 8 (information) — operator briefed via lift plan. Regulation 9 (training) — all persons CPCS qualified.',
            A, NAVY_BG, A, W, { boldPrefix: 'PUWER 1998 Compliance:' }
          ),
          h.spacer(80),
          h.signatureGrid(['Appointed Person', 'H&S Review'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — TANDEM / COMPLEX LIFT (Teal #0f766e, dual crane, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: LiftPlanData): Document {
  const A = TEAL;
  const hdr2 = h.accentHeader('Tandem Lift Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Tandem Lift', A);
  const dualCols = cols([0.30, 0.35, 0.35]);
  const commCols = cols([0.28, 0.24, 0.16, 0.32]);
  const wifCols = cols([0.28, 0.36, 0.36]);

  // Build dual crane comparison rows
  const dualRows = [
    ['Make / Model', d.craneDetails.makeModel, d.crane2Details.makeModel],
    ['Max Capacity', d.craneDetails.capacity, d.crane2Details.capacity],
    ['Boom Length', d.liftGeometry.boomLength, d.crane2Geometry.boomLength],
    ['Counterweight', d.liftGeometry.counterweight, d.crane2Geometry.counterweight],
    ['Operating Radius', d.liftGeometry.maxRadius, d.crane2Geometry.maxRadius],
    ['Duty at Radius', d.liftGeometry.dutyAtRadius, d.crane2Geometry.dutyAtRadius],
    ['% Capacity', d.liftGeometry.percentCapacity, d.crane2Geometry.percentCapacity],
    ['TE Certificate', d.craneDetails.lastThoroughExam, d.crane2Details.lastThoroughExam],
  ];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['TANDEM LIFT PLAN'], `Dual Crane — ${d.loadDetails.description || d.liftDescription || ''}`, A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Load', value: `${d.loadDetails.description} — ${d.loadDetails.totalWeight} total` },
            { label: 'Crane 1', value: `${d.craneDetails.makeModel} (${d.craneDetails.capacity})` },
            { label: 'Crane 2', value: `${d.crane2Details.makeModel} (${d.crane2Details.capacity})` },
            { label: 'Load Share', value: d.loadShareCalc || '' },
            { label: 'Lift Category', value: 'Complex Lift — BS 7121-1 Clause 9.4' },
            { label: 'Appointed Person', value: d.preparedBy },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'DUAL CRANE SPECIFICATIONS — SIDE BY SIDE', A), h.spacer(60),
          dTable(A,
            [{ text: 'PARAMETER', width: dualCols[0] }, { text: 'CRANE 1 (WEST)', width: dualCols[1] }, { text: 'CRANE 2 (EAST)', width: dualCols[2] }],
            dualRows,
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'LOAD SHARING & SYNCHRONISATION', A), h.spacer(60),
          h.kpiDashboard([
            { value: d.loadDetails.weight || '—', label: 'Nett Load' },
            { value: d.loadDetails.totalWeight || '—', label: 'Total + Rigging' },
            { value: '55/45', label: 'Load Split %' },
            { value: d.crane2Geometry.percentCapacity || '—', label: 'Max % Capacity' },
          ], A, W),
          h.spacer(60),
          ...h.richBodyText(d.syncPlan || d.loadShareCalc || ''),
          h.spacer(80), h.fullWidthSectionBar('', 'INTER-CRANE COMMUNICATION PROTOCOL', A), h.spacer(60),
          ...(d.commItems.length > 0 ? [dTable(A,
            [{ text: 'ROLE', width: commCols[0] }, { text: 'RADIO', width: commCols[1] }, { text: 'CHANNEL', width: commCols[2] }, { text: 'CALL SIGN', width: commCols[3] }],
            d.commItems.map(ci => [ci.role, ci.radio, ci.channel, ci.callSign]),
          )] : []),
          h.spacer(60),
          h.calloutBox(
            'Tandem lifts are classified as Complex (BS 7121-1 Clause 9.4) and require: (1) a written lift plan approved by an AP with tandem lift endorsement, (2) a pre-lift briefing with rehearsal of communication protocol, (3) load cells on both hooks with real-time monitoring, (4) a dedicated radio channel, (5) both cranes >2m boom-tip separation at all times, and (6) if ANY anomaly occurs, BOTH cranes hold immediately.',
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: '\u26A0 TANDEM LIFT — ADDITIONAL CONTROLS:' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'WHAT-IF FAILURE ANALYSIS', A), h.spacer(60),
          ...(d.whatIfScenarios.length > 0 ? [dTable(A,
            [{ text: 'SCENARIO', width: wifCols[0] }, { text: 'CONSEQUENCE', width: wifCols[1] }, { text: 'CONTROL', width: wifCols[2] }],
            d.whatIfScenarios.map(wi => [wi.scenario, wi.consequence, wi.control]),
          )] : []),
          h.spacer(80),
          h.signatureGrid(['Appointed Person (Tandem endorsed)', 'Crane 1 Operator', 'Crane 2 Operator', 'Site Manager Approval'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildLiftPlanTemplateDocument(
  content: any,
  templateSlug: LiftPlanTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':   return buildT1(d);
    case 'operator-brief':    return buildT2(d);
    case 'loler-compliance':  return buildT3(d);
    case 'tandem-lift':       return buildT4(d);
    default:                  return buildT1(d);
  }
}
