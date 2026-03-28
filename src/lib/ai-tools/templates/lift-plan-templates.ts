// =============================================================================
// Lift Plan Builder — Multi-Template Engine
// 4 templates, all consuming the same Lift Plan JSON structure.
//
// T1 — Ebrora Standard    (green, cover, 22 sections, ultra-comprehensive)
// T2 — Operator Brief     (amber, compact crane-cab card, 3 pages)
// T3 — Tandem / Complex   (teal, dual-crane, multi-phase)
// T4 — LOLER Compliance   (navy, regulatory checklists)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { LiftPlanTemplateSlug } from '@/lib/lift-plan/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const AMBER = 'D97706'; const AMBER_BG = 'FEF3C7'; const AMBER_D = '92400e';
const RED = 'DC2626'; const RED_BG = 'FEE2E2';
const GREEN_RAG = '059669'; const GREEN_BG = 'D1FAE5';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa'; const TEAL_DARK = '134e4a';
const GREY_RAG = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface LoadDetails { description: string; weight: string; riggingWeight: string; totalWeight: string; dimensions: string; centreOfGravity: string; numberOfLifts: string; loadCondition: string; liftingPoints: string; specialConsiderations: string; }
interface CraneDetails { type: string; makeModel: string; capacity: string; serialNumber: string; lastThoroughExam: string; certExpiry: string; owner: string; insuranceRef: string; }
interface LiftGeometry { maxRadius: string; minRadius: string; maxHeight: string; dutyAtRadius: string; percentCapacity: string; slewArc: string; tailSwing: string; boomLength: string; jibLength: string; counterweight: string; }
interface RiggingItem { item: string; specification: string; swl: string; certRef: string; certExpiry: string; condition: string; }
interface GroundDetails { bearingCapacity: string; groundType: string; matType: string; matSize: string; outriggerSpread: string; padLoadPerLeg: string; gradient: string; groundSurvey: string; groundPrep: string; }
interface ProximityHazard { hazard: string; distance: string; mitigation: string; riskLevel: string; }
interface OverheadService { service: string; height: string; owner: string; clearance: string; mitigation: string; }
interface ExclusionZone { zone: string; dimensions: string; barrierType: string; signage: string; banksman: string; }
interface AppointedPerson { role: string; name: string; qualification: string; certRef: string; certExpiry: string; employer: string; }
interface CommItem { method: string; channel: string; users: string; backup: string; }
interface WeatherLimit { parameter: string; limit: string; action: string; monitoredBy: string; }
interface EnvConsideration { consideration: string; restriction: string; mitigation: string; }
interface PreLiftCheck { checkItem: string; requirement: string; verified: string; notes: string; }
interface LiftStep { step: string; action: string; responsibility: string; signal: string; notes: string; }
interface ContingencyItem { scenario: string; action: string; responsibility: string; equipment: string; }
interface RiskEntry { hazard: string; severity: string; likelihood: string; riskRating: string; ratingLevel: string; controlMeasures: string; residualRating: string; residualLevel: string; }
interface LiftPhase { phase: string; description: string; crane1Action: string; crane2Action: string; loadShare1: string; loadShare2: string; signalMethod: string; abortCriteria: string; }
interface CraneInteraction { zone: string; hazard: string; separation: string; control: string; }
interface WhatIf { scenario: string; consequence: string; response: string; prevention: string; }
interface LolerCheck { regulation: string; requirement: string; compliance: string; evidence: string; }
interface EquipmentReg { item: string; id: string; swl: string; lastExam: string; nextExam: string; status: string; }
interface PreviousLift { date: string; description: string; crane: string; weight: string; outcome: string; }
interface PostLiftCheck { checkItem: string; requirement: string; result: string; }
interface RegRef { reference: string; description: string; }

interface LiftPlanData {
  documentRef: string; planDate: string; reviewDate: string;
  preparedBy: string; projectName: string; siteAddress: string;
  principalContractor: string; client: string; contractRef: string;
  liftCategory: string; liftDescription: string;
  loadDetails: LoadDetails;
  craneDetails: CraneDetails;
  crane2Details: CraneDetails;
  liftGeometry: LiftGeometry;
  crane2Geometry: LiftGeometry;
  riggingItems: RiggingItem[];
  groundDetails: GroundDetails;
  crane2GroundDetails: GroundDetails;
  proximityHazards: ProximityHazard[];
  overheadServices: OverheadService[];
  exclusionZones: ExclusionZone[];
  appointedPersons: AppointedPerson[];
  commItems: CommItem[];
  weatherLimits: WeatherLimit[];
  envConsiderations: EnvConsideration[];
  preLiftChecks: PreLiftCheck[];
  liftSteps: LiftStep[];
  contingencyItems: ContingencyItem[];
  riskEntries: RiskEntry[];
  liftPhases: LiftPhase[];
  craneInteractions: CraneInteraction[];
  whatIfScenarios: WhatIf[];
  lolerChecks: LolerCheck[];
  equipmentRegister: EquipmentReg[];
  previousLifts: PreviousLift[];
  postLiftChecks: PostLiftCheck[];
  loadShareCalc: string; syncPlan: string; interCraneComms: string;
  engineeringCalcSummary: string; defectReporting: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): LiftPlanData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const o = (v: any) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const ld = o(c.loadDetails); const cd = o(c.craneDetails); const c2 = o(c.crane2Details);
  const lg = o(c.liftGeometry); const c2g = o(c.crane2Geometry);
  const gd = o(c.groundDetails); const c2gd = o(c.crane2GroundDetails);
  return {
    documentRef: s(c.documentRef), planDate: s(c.planDate), reviewDate: s(c.reviewDate),
    preparedBy: s(c.preparedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    principalContractor: s(c.principalContractor), client: s(c.client), contractRef: s(c.contractRef),
    liftCategory: s(c.liftCategory), liftDescription: s(c.liftDescription),
    loadDetails: { description: s(ld.description), weight: s(ld.weight), riggingWeight: s(ld.riggingWeight), totalWeight: s(ld.totalWeight), dimensions: s(ld.dimensions), centreOfGravity: s(ld.centreOfGravity), numberOfLifts: s(ld.numberOfLifts), loadCondition: s(ld.loadCondition), liftingPoints: s(ld.liftingPoints), specialConsiderations: s(ld.specialConsiderations) },
    craneDetails: { type: s(cd.type), makeModel: s(cd.makeModel), capacity: s(cd.capacity), serialNumber: s(cd.serialNumber), lastThoroughExam: s(cd.lastThoroughExam), certExpiry: s(cd.certExpiry), owner: s(cd.owner), insuranceRef: s(cd.insuranceRef) },
    crane2Details: { type: s(c2.type), makeModel: s(c2.makeModel), capacity: s(c2.capacity), serialNumber: s(c2.serialNumber), lastThoroughExam: s(c2.lastThoroughExam), certExpiry: s(c2.certExpiry), owner: s(c2.owner), insuranceRef: s(c2.insuranceRef) },
    liftGeometry: { maxRadius: s(lg.maxRadius), minRadius: s(lg.minRadius), maxHeight: s(lg.maxHeight), dutyAtRadius: s(lg.dutyAtRadius), percentCapacity: s(lg.percentCapacity), slewArc: s(lg.slewArc), tailSwing: s(lg.tailSwing), boomLength: s(lg.boomLength), jibLength: s(lg.jibLength), counterweight: s(lg.counterweight) },
    crane2Geometry: { maxRadius: s(c2g.maxRadius), minRadius: s(c2g.minRadius), maxHeight: s(c2g.maxHeight), dutyAtRadius: s(c2g.dutyAtRadius), percentCapacity: s(c2g.percentCapacity), slewArc: s(c2g.slewArc), tailSwing: s(c2g.tailSwing), boomLength: s(c2g.boomLength), jibLength: s(c2g.jibLength), counterweight: s(c2g.counterweight) },
    riggingItems: a(c.riggingItems), groundDetails: { bearingCapacity: s(gd.bearingCapacity), groundType: s(gd.groundType), matType: s(gd.matType), matSize: s(gd.matSize), outriggerSpread: s(gd.outriggerSpread), padLoadPerLeg: s(gd.padLoadPerLeg), gradient: s(gd.gradient), groundSurvey: s(gd.groundSurvey), groundPrep: s(gd.groundPrep) },
    crane2GroundDetails: { bearingCapacity: s(c2gd.bearingCapacity), groundType: s(c2gd.groundType), matType: s(c2gd.matType), matSize: s(c2gd.matSize), outriggerSpread: s(c2gd.outriggerSpread), padLoadPerLeg: s(c2gd.padLoadPerLeg), gradient: s(c2gd.gradient), groundSurvey: s(c2gd.groundSurvey), groundPrep: s(c2gd.groundPrep) },
    proximityHazards: a(c.proximityHazards), overheadServices: a(c.overheadServices),
    exclusionZones: a(c.exclusionZones), appointedPersons: a(c.appointedPersons),
    commItems: a(c.commItems), weatherLimits: a(c.weatherLimits),
    envConsiderations: a(c.envConsiderations), preLiftChecks: a(c.preLiftChecks),
    liftSteps: a(c.liftSteps), contingencyItems: a(c.contingencyItems),
    riskEntries: a(c.riskEntries), liftPhases: a(c.liftPhases),
    craneInteractions: a(c.craneInteractions), whatIfScenarios: a(c.whatIfScenarios),
    lolerChecks: a(c.lolerChecks), equipmentRegister: a(c.equipmentRegister),
    previousLifts: a(c.previousLifts), postLiftChecks: a(c.postLiftChecks),
    loadShareCalc: s(c.loadShareCalc), syncPlan: s(c.syncPlan), interCraneComms: s(c.interCraneComms),
    engineeringCalcSummary: s(c.engineeringCalcSummary), defectReporting: s(c.defectReporting),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'BS 7121-1:2016', description: 'Code of practice for safe use of cranes — General' },
    { reference: 'BS 7121-3:2017', description: 'Code of practice — Mobile cranes' },
    { reference: 'LOLER 1998', description: 'Lifting Operations and Lifting Equipment Regulations' },
    { reference: 'PUWER 1998', description: 'Provision and Use of Work Equipment Regulations' },
    { reference: 'CDM 2015 — Reg 13', description: 'Principal Contractor duties — planning and managing' },
    { reference: 'MHSW 1999 — Reg 3', description: 'Duty to carry out suitable and sufficient risk assessment' },
    { reference: 'HSE INDG290', description: 'Guidance on lifting operations in construction' },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string): Paragraph {
  return new Paragraph({ spacing: { before: 360, after: 140 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: LG, font: 'Arial', color: accent })] });
}
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || SM + 2, font: 'Arial', color: opts?.color })] })] });
}
function infoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r =>
    new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: SM + 2, font: 'Arial', color: lc })] })] }),
      new TableCell({ width: { size: W - lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
    ] })) });
}
function dataTable(headers: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, headerBg: string, zb = ZEBRA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, headerBg)) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zb : h.WHITE, color: cell.color })) })),
  ] });
}
function signOff(roles: string[], bg: string): Table {
  const cols = [{ t: 'Role', w: Math.round(W * 0.22) }, { t: 'Name', w: Math.round(W * 0.28) }, { t: 'Signature', w: Math.round(W * 0.25) }, { t: 'Date', w: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) }];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.t, c.w, bg)) }),
    ...roles.map(role => new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.w)) })),
  ] });
}
function ragColor(level: string): string {
  const l = (level || '').toLowerCase();
  if (l === 'high' || l === 'critical' || l === 'failed') return RED;
  if (l === 'medium' || l === 'amber') return AMBER;
  if (l === 'low' || l === 'green' || l === 'compliant' || l === 'current' || l === 'pass') return GREEN_RAG;
  return GREY_RAG;
}
function calloutPara(text: string, accent: string, bg: string): Paragraph {
  return new Paragraph({ spacing: { before: 120, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    shading: { type: ShadingType.CLEAR, fill: bg },
    children: [new TextRun({ text, size: SM + 2, font: 'Arial' })] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, 22 sections, ultra-comprehensive)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT1(d: LiftPlanData): (Paragraph | Table)[] {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const els: (Paragraph | Table)[] = [];
  let sn = 1;

  // Cover
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'LIFT PLAN', bold: true, size: TTL, font: 'Arial', color: A })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'BS 7121 \u00B7 LOLER 1998 \u00B7 PUWER 1998 \u00B7 CDM 2015', size: BODY, font: 'Arial', color: h.GREY_DARK })] }));
  els.push(h.spacer(100));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(h.spacer(100));
  els.push(infoTable([
    { label: 'Document Ref', value: d.documentRef }, { label: 'Plan Date', value: d.planDate },
    { label: 'Review Date', value: d.reviewDate }, { label: 'Prepared By', value: d.preparedBy },
    { label: 'Principal Contractor', value: d.principalContractor }, { label: 'Client', value: d.client },
    { label: 'Contract Ref', value: d.contractRef }, { label: 'Lift Category', value: d.liftCategory },
  ], LBG, LC));

  // 1 Lift Description
  els.push(secHead(`${sn}.0`, 'Lift Description', A)); sn++;
  if (d.liftDescription) els.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: d.liftDescription, size: BODY, font: 'Arial' })] }));

  // 2 Load Details
  els.push(secHead(`${sn}.0`, 'Load Details & Lifting Point Assessment', A)); sn++;
  els.push(infoTable([
    { label: 'Load Description', value: d.loadDetails.description }, { label: 'Net Load Weight', value: d.loadDetails.weight },
    { label: 'Rigging Weight', value: d.loadDetails.riggingWeight }, { label: 'Total Lifted Weight', value: d.loadDetails.totalWeight },
    { label: 'Dimensions (L×W×H)', value: d.loadDetails.dimensions }, { label: 'Centre of Gravity', value: d.loadDetails.centreOfGravity },
    { label: 'Number of Lifts', value: d.loadDetails.numberOfLifts }, { label: 'Load Condition', value: d.loadDetails.loadCondition },
    { label: 'Lifting Points', value: d.loadDetails.liftingPoints }, { label: 'Special Considerations', value: d.loadDetails.specialConsiderations },
  ], LBG, LC));

  // 3 Crane Specification
  els.push(secHead(`${sn}.0`, 'Crane / Lifting Equipment Specification', A)); sn++;
  els.push(infoTable([
    { label: 'Crane Type', value: d.craneDetails.type }, { label: 'Make / Model', value: d.craneDetails.makeModel },
    { label: 'Maximum SWL', value: d.craneDetails.capacity }, { label: 'Serial Number', value: d.craneDetails.serialNumber },
    { label: 'Last Thorough Exam', value: d.craneDetails.lastThoroughExam }, { label: 'Certificate Expiry', value: d.craneDetails.certExpiry },
    { label: 'Owner / Hirer', value: d.craneDetails.owner }, { label: 'Insurance Ref', value: d.craneDetails.insuranceRef },
  ], LBG, LC));

  // 4 Lift Geometry
  els.push(secHead(`${sn}.0`, 'Lift Geometry & Capacity Calculation', A)); sn++;
  els.push(infoTable([
    { label: 'Maximum Radius', value: d.liftGeometry.maxRadius }, { label: 'Minimum Radius', value: d.liftGeometry.minRadius },
    { label: 'Maximum Height', value: d.liftGeometry.maxHeight }, { label: 'Duty at Max Radius', value: d.liftGeometry.dutyAtRadius },
    { label: '% of Capacity', value: d.liftGeometry.percentCapacity }, { label: 'Slew Arc', value: d.liftGeometry.slewArc },
    { label: 'Tail Swing', value: d.liftGeometry.tailSwing }, { label: 'Boom Length', value: d.liftGeometry.boomLength },
    { label: 'Jib Length', value: d.liftGeometry.jibLength }, { label: 'Counterweight Config', value: d.liftGeometry.counterweight },
  ], LBG, LC));

  // 5 Rigging
  if (d.riggingItems.length > 0) {
    const rc = [Math.round(W * 0.16), Math.round(W * 0.22), Math.round(W * 0.10), Math.round(W * 0.14), Math.round(W * 0.14), W - Math.round(W * 0.16) - Math.round(W * 0.22) - Math.round(W * 0.10) - Math.round(W * 0.14) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Rigging Arrangement & Certification', A)); sn++;
    els.push(dataTable(
      [{ text: 'Item', width: rc[0] }, { text: 'Specification', width: rc[1] }, { text: 'SWL', width: rc[2] }, { text: 'Cert Ref', width: rc[3] }, { text: 'Cert Expiry', width: rc[4] }, { text: 'Condition', width: rc[5] }],
      d.riggingItems.map(r => [{ text: r.item, bold: true }, { text: r.specification }, { text: r.swl }, { text: r.certRef }, { text: r.certExpiry }, { text: r.condition, color: ragColor(r.condition) }]),
      A));
  } else { sn++; }

  // 6 Ground Conditions
  els.push(secHead(`${sn}.0`, 'Ground Conditions & Outrigger Setup', A)); sn++;
  els.push(infoTable([
    { label: 'Bearing Capacity', value: d.groundDetails.bearingCapacity }, { label: 'Ground Type', value: d.groundDetails.groundType },
    { label: 'Mat Type', value: d.groundDetails.matType }, { label: 'Mat Size', value: d.groundDetails.matSize },
    { label: 'Outrigger Spread', value: d.groundDetails.outriggerSpread }, { label: 'Pad Load per Leg', value: d.groundDetails.padLoadPerLeg },
    { label: 'Gradient', value: d.groundDetails.gradient }, { label: 'Ground Survey', value: d.groundDetails.groundSurvey },
    { label: 'Ground Preparation', value: d.groundDetails.groundPrep },
  ], LBG, LC));

  // 7 Proximity Hazards
  if (d.proximityHazards.length > 0) {
    const pc = [Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.38), W - Math.round(W * 0.22) - Math.round(W * 0.14) - Math.round(W * 0.38)];
    els.push(secHead(`${sn}.0`, 'Proximity Hazards', A)); sn++;
    els.push(dataTable(
      [{ text: 'Hazard', width: pc[0] }, { text: 'Distance', width: pc[1] }, { text: 'Mitigation', width: pc[2] }, { text: 'Risk', width: pc[3] }],
      d.proximityHazards.map(p => [{ text: p.hazard, bold: true }, { text: p.distance }, { text: p.mitigation }, { text: p.riskLevel, bold: true, color: ragColor(p.riskLevel) }]),
      A));
  } else { sn++; }

  // 8 Overhead Services
  if (d.overheadServices.length > 0) {
    const oc = [Math.round(W * 0.18), Math.round(W * 0.12), Math.round(W * 0.14), Math.round(W * 0.14), W - Math.round(W * 0.18) - Math.round(W * 0.12) - Math.round(W * 0.14) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Overhead Services Assessment', A)); sn++;
    els.push(dataTable(
      [{ text: 'Service', width: oc[0] }, { text: 'Height', width: oc[1] }, { text: 'Owner', width: oc[2] }, { text: 'Clearance', width: oc[3] }, { text: 'Mitigation', width: oc[4] }],
      d.overheadServices.map(o => [{ text: o.service, bold: true }, { text: o.height }, { text: o.owner }, { text: o.clearance }, { text: o.mitigation }]),
      A));
  } else { sn++; }

  // 9 Exclusion Zones
  if (d.exclusionZones.length > 0) {
    const ez = [Math.round(W * 0.18), Math.round(W * 0.20), Math.round(W * 0.18), Math.round(W * 0.18), W - Math.round(W * 0.18) - Math.round(W * 0.20) - Math.round(W * 0.18) - Math.round(W * 0.18)];
    els.push(secHead(`${sn}.0`, 'Exclusion Zones', A)); sn++;
    els.push(dataTable(
      [{ text: 'Zone', width: ez[0] }, { text: 'Dimensions', width: ez[1] }, { text: 'Barrier', width: ez[2] }, { text: 'Signage', width: ez[3] }, { text: 'Banksman', width: ez[4] }],
      d.exclusionZones.map(z => [{ text: z.zone, bold: true }, { text: z.dimensions }, { text: z.barrierType }, { text: z.signage }, { text: z.banksman }]),
      A));
  } else { sn++; }

  // 10 Appointed Persons
  if (d.appointedPersons.length > 0) {
    const ap = [Math.round(W * 0.16), Math.round(W * 0.16), Math.round(W * 0.20), Math.round(W * 0.14), Math.round(W * 0.14), W - Math.round(W * 0.16) - Math.round(W * 0.16) - Math.round(W * 0.20) - Math.round(W * 0.14) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Appointed Persons & Competence Records', A)); sn++;
    els.push(dataTable(
      [{ text: 'Role', width: ap[0] }, { text: 'Name', width: ap[1] }, { text: 'Qualification', width: ap[2] }, { text: 'Cert Ref', width: ap[3] }, { text: 'Expiry', width: ap[4] }, { text: 'Employer', width: ap[5] }],
      d.appointedPersons.map(p => [{ text: p.role, bold: true }, { text: p.name }, { text: p.qualification }, { text: p.certRef }, { text: p.certExpiry }, { text: p.employer }]),
      A));
  } else { sn++; }

  // 11 Communication
  if (d.commItems.length > 0) {
    const cc = [Math.round(W * 0.20), Math.round(W * 0.18), Math.round(W * 0.32), W - Math.round(W * 0.20) - Math.round(W * 0.18) - Math.round(W * 0.32)];
    els.push(secHead(`${sn}.0`, 'Communication Arrangements', A)); sn++;
    els.push(dataTable(
      [{ text: 'Method', width: cc[0] }, { text: 'Channel / Freq', width: cc[1] }, { text: 'Users', width: cc[2] }, { text: 'Backup', width: cc[3] }],
      d.commItems.map(c2 => [{ text: c2.method, bold: true }, { text: c2.channel }, { text: c2.users }, { text: c2.backup }]),
      A));
  } else { sn++; }

  // 12 Weather Limits
  if (d.weatherLimits.length > 0) {
    const wl = [Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.36), W - Math.round(W * 0.20) - Math.round(W * 0.20) - Math.round(W * 0.36)];
    els.push(secHead(`${sn}.0`, 'Weather Limits', A)); sn++;
    els.push(dataTable(
      [{ text: 'Parameter', width: wl[0] }, { text: 'Limit', width: wl[1] }, { text: 'Action', width: wl[2] }, { text: 'Monitored By', width: wl[3] }],
      d.weatherLimits.map(w => [{ text: w.parameter, bold: true }, { text: w.limit }, { text: w.action }, { text: w.monitoredBy }]),
      A));
  } else { sn++; }

  // 13 Environmental
  if (d.envConsiderations.length > 0) {
    const ev = [Math.round(W * 0.24), Math.round(W * 0.34), W - Math.round(W * 0.24) - Math.round(W * 0.34)];
    els.push(secHead(`${sn}.0`, 'Environmental Considerations', A)); sn++;
    els.push(dataTable(
      [{ text: 'Consideration', width: ev[0] }, { text: 'Restriction', width: ev[1] }, { text: 'Mitigation', width: ev[2] }],
      d.envConsiderations.map(e => [{ text: e.consideration, bold: true }, { text: e.restriction }, { text: e.mitigation }]),
      A));
  } else { sn++; }

  // 14 Pre-Lift Checks
  if (d.preLiftChecks.length > 0) {
    const pl = [Math.round(W * 0.26), Math.round(W * 0.32), Math.round(W * 0.14), W - Math.round(W * 0.26) - Math.round(W * 0.32) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Pre-Lift Inspection Checklist', A)); sn++;
    els.push(dataTable(
      [{ text: 'Check Item', width: pl[0] }, { text: 'Requirement', width: pl[1] }, { text: 'Verified', width: pl[2] }, { text: 'Notes', width: pl[3] }],
      d.preLiftChecks.map(p => [{ text: p.checkItem, bold: true }, { text: p.requirement }, { text: p.verified, bold: true, color: ragColor(p.verified) }, { text: p.notes }]),
      A));
  } else { sn++; }

  // 15 Lift Sequence
  if (d.liftSteps.length > 0) {
    const ls = [Math.round(W * 0.06), Math.round(W * 0.34), Math.round(W * 0.18), Math.round(W * 0.14), W - Math.round(W * 0.06) - Math.round(W * 0.34) - Math.round(W * 0.18) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Lift Sequence — Step by Step', A)); sn++;
    els.push(dataTable(
      [{ text: '#', width: ls[0] }, { text: 'Action', width: ls[1] }, { text: 'Responsibility', width: ls[2] }, { text: 'Signal', width: ls[3] }, { text: 'Notes', width: ls[4] }],
      d.liftSteps.map(l => [{ text: l.step, bold: true }, { text: l.action }, { text: l.responsibility }, { text: l.signal }, { text: l.notes }]),
      A));
  } else { sn++; }

  // 16 Contingency
  if (d.contingencyItems.length > 0) {
    const ci = [Math.round(W * 0.20), Math.round(W * 0.34), Math.round(W * 0.18), W - Math.round(W * 0.20) - Math.round(W * 0.34) - Math.round(W * 0.18)];
    els.push(secHead(`${sn}.0`, 'Contingency & Emergency Procedures', A)); sn++;
    els.push(dataTable(
      [{ text: 'Scenario', width: ci[0] }, { text: 'Action', width: ci[1] }, { text: 'Responsibility', width: ci[2] }, { text: 'Equipment', width: ci[3] }],
      d.contingencyItems.map(c2 => [{ text: c2.scenario, bold: true }, { text: c2.action }, { text: c2.responsibility }, { text: c2.equipment }]),
      A));
  } else { sn++; }

  // 17 Risk Assessment
  if (d.riskEntries.length > 0) {
    const ra = [Math.round(W * 0.18), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.30), Math.round(W * 0.08), W - Math.round(W * 0.18) - Math.round(W * 0.08) * 3 - Math.round(W * 0.30) - Math.round(W * 0.08)];
    els.push(secHead(`${sn}.0`, 'Risk Assessment', A)); sn++;
    els.push(dataTable(
      [{ text: 'Hazard', width: ra[0] }, { text: 'Sev.', width: ra[1] }, { text: 'Lik.', width: ra[2] }, { text: 'Risk', width: ra[3] }, { text: 'Control Measures', width: ra[4] }, { text: 'Res.', width: ra[5] }, { text: 'Res. Lvl', width: ra[6] }],
      d.riskEntries.map(r => [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.riskRating, bold: true, color: ragColor(r.ratingLevel) }, { text: r.controlMeasures }, { text: r.residualRating }, { text: r.residualLevel, bold: true, color: ragColor(r.residualLevel) }]),
      A));
  } else { sn++; }

  // 18 Regulatory References
  els.push(secHead(`${sn}.0`, 'Regulatory References', A)); sn++;
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Description', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A));

  // 19 Approval & Sign-Off
  els.push(secHead(`${sn}.0`, 'Approval & Sign-Off', A)); sn++;
  els.push(signOff(['Lift Planner / AP', 'Crane Supervisor', 'Slinger / Signaller', 'Crane Operator', 'Project Manager'], A));

  // 20 Lift Completion Record
  els.push(secHead(`${sn}.0`, 'Lift Completion Record', A)); sn++;
  els.push(infoTable([
    { label: 'Lift Completed', value: '' }, { label: 'Date / Time', value: '' },
    { label: 'Lift Successful?', value: '' }, { label: 'Any Issues?', value: '' },
    { label: 'Signed — Crane Supervisor', value: '' }, { label: 'Signed — AP', value: '' },
  ], LBG, LC));

  // Post-lift checks
  if (d.postLiftChecks.length > 0) {
    const plc = [Math.round(W * 0.30), Math.round(W * 0.36), W - Math.round(W * 0.30) - Math.round(W * 0.36)];
    els.push(secHead(`${sn}.0`, 'Post-Lift Inspection', A)); sn++;
    els.push(dataTable(
      [{ text: 'Check Item', width: plc[0] }, { text: 'Requirement', width: plc[1] }, { text: 'Result', width: plc[2] }],
      d.postLiftChecks.map(p => [{ text: p.checkItem, bold: true }, { text: p.requirement }, { text: p.result, bold: true, color: ragColor(p.result) }]),
      A));
  }

  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This lift plan must be reviewed before each lift and whenever conditions change. All lifting equipment must hold current thorough examination certificates under LOLER 1998.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T2 — OPERATOR BRIEF (amber, compact crane-cab card)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT2(d: LiftPlanData): (Paragraph | Table)[] {
  const A = AMBER_D; const LBG = 'FFFBEB'; const LC = AMBER_D;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_D }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'CRANE OPERATOR BRIEF', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_D }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Cab Reference Card \u00B7 Keep With You During Lift', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '78350f' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.planDate}`, size: SM, font: 'Arial', color: 'fcd34d' })] }));

  // Key data — large print
  els.push(secHead('', 'Load & Duty — Key Data', A));
  els.push(infoTable([
    { label: 'TOTAL LOAD WEIGHT', value: d.loadDetails.totalWeight || d.loadDetails.weight },
    { label: 'DUTY AT RADIUS', value: d.liftGeometry.dutyAtRadius },
    { label: '% OF CAPACITY', value: d.liftGeometry.percentCapacity },
    { label: 'MAX RADIUS', value: d.liftGeometry.maxRadius },
    { label: 'MAX HEIGHT', value: d.liftGeometry.maxHeight },
    { label: 'SLEW ARC', value: d.liftGeometry.slewArc },
    { label: 'BOOM / JIB', value: `${d.liftGeometry.boomLength} / ${d.liftGeometry.jibLength}` },
    { label: 'TAIL SWING', value: d.liftGeometry.tailSwing },
  ], LBG, LC));

  // Rigging summary
  if (d.riggingItems.length > 0) {
    const rc = [Math.round(W * 0.24), Math.round(W * 0.36), Math.round(W * 0.16), W - Math.round(W * 0.24) - Math.round(W * 0.36) - Math.round(W * 0.16)];
    els.push(secHead('', 'Rigging', A));
    els.push(dataTable(
      [{ text: 'Item', width: rc[0] }, { text: 'Spec', width: rc[1] }, { text: 'SWL', width: rc[2] }, { text: 'Condition', width: rc[3] }],
      d.riggingItems.map(r => [{ text: r.item, bold: true }, { text: r.specification }, { text: r.swl }, { text: r.condition }]),
      A));
  }

  // Lift Sequence
  if (d.liftSteps.length > 0) {
    const ls = [Math.round(W * 0.06), Math.round(W * 0.42), Math.round(W * 0.20), W - Math.round(W * 0.06) - Math.round(W * 0.42) - Math.round(W * 0.20)];
    els.push(secHead('', 'Lift Sequence', A));
    els.push(dataTable(
      [{ text: '#', width: ls[0] }, { text: 'Action', width: ls[1] }, { text: 'Signal', width: ls[2] }, { text: 'Notes', width: ls[3] }],
      d.liftSteps.map(l => [{ text: l.step, bold: true }, { text: l.action }, { text: l.signal }, { text: l.notes }]),
      A));
  }

  // Exclusion zones
  if (d.exclusionZones.length > 0) {
    els.push(secHead('', 'Exclusion Zones', A));
    els.push(dataTable(
      [{ text: 'Zone', width: Math.round(W * 0.24) }, { text: 'Dimensions', width: Math.round(W * 0.30) }, { text: 'Barrier', width: W - Math.round(W * 0.24) - Math.round(W * 0.30) }],
      d.exclusionZones.map(z => [{ text: z.zone, bold: true }, { text: z.dimensions }, { text: z.barrierType }]),
      A));
  }

  // Abort Criteria & Emergency
  if (d.contingencyItems.length > 0) {
    els.push(secHead('', 'Abort Criteria & Emergency', A));
    els.push(dataTable(
      [{ text: 'Scenario', width: Math.round(W * 0.24) }, { text: 'Action', width: W - Math.round(W * 0.24) }],
      d.contingencyItems.map(c2 => [{ text: c2.scenario, bold: true }, { text: c2.action }]),
      A, 'FFF5EB'));
  }

  // Weather limits
  if (d.weatherLimits.length > 0) {
    els.push(secHead('', 'Weather Limits', A));
    els.push(dataTable(
      [{ text: 'Parameter', width: Math.round(W * 0.28) }, { text: 'Limit', width: Math.round(W * 0.28) }, { text: 'Action', width: W - Math.round(W * 0.28) * 2 }],
      d.weatherLimits.map(w => [{ text: w.parameter, bold: true }, { text: w.limit }, { text: w.action }]),
      A));
  }

  // Comms & key contacts
  els.push(secHead('', 'Communications & Key Contacts', A));
  const contactRows: Array<{ label: string; value: string }> = [];
  for (const ap of d.appointedPersons.slice(0, 5)) contactRows.push({ label: ap.role, value: ap.name });
  for (const cm of d.commItems.slice(0, 3)) contactRows.push({ label: cm.method, value: `${cm.channel} — ${cm.users}` });
  if (contactRows.length > 0) els.push(infoTable(contactRows, LBG, LC));

  els.push(signOff(['Crane Operator', 'Crane Supervisor'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'This brief is a summary only. Full lift plan must be available on site. Review before each lift.', size: SM, font: 'Arial', color: GREY_RAG, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T3 — TANDEM / COMPLEX LIFT (teal, dual-crane, multi-phase)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT3(d: LiftPlanData): (Paragraph | Table)[] {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'TANDEM / COMPLEX LIFT PLAN', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: 'Multi-Crane \u00B7 Load Sharing \u00B7 Synchronised Operations \u00B7 BS 7121-1 Annex C', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.principalContractor} | ${d.planDate}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }));

  // 1 Lift Description & Category
  els.push(secHead('1.0', 'Lift Description & Category', A));
  els.push(infoTable([
    { label: 'Lift Category', value: d.liftCategory }, { label: 'Lift Description', value: d.liftDescription },
    { label: 'Load Description', value: d.loadDetails.description }, { label: 'Total Load Weight', value: d.loadDetails.totalWeight || d.loadDetails.weight },
  ], LBG, LC));

  // 2 Crane 1 vs Crane 2 side-by-side
  els.push(secHead('2.0', 'Dual Crane Specifications', A));
  const hw = Math.round(W * 0.30); const c1w = Math.round(W * 0.35); const c2w = W - hw - c1w;
  const craneRows = [
    ['Type', d.craneDetails.type, d.crane2Details.type],
    ['Make / Model', d.craneDetails.makeModel, d.crane2Details.makeModel],
    ['Max SWL', d.craneDetails.capacity, d.crane2Details.capacity],
    ['Serial Number', d.craneDetails.serialNumber, d.crane2Details.serialNumber],
    ['Last Thorough Exam', d.craneDetails.lastThoroughExam, d.crane2Details.lastThoroughExam],
    ['Cert Expiry', d.craneDetails.certExpiry, d.crane2Details.certExpiry],
    ['Max Radius', d.liftGeometry.maxRadius, d.crane2Geometry.maxRadius],
    ['Duty at Radius', d.liftGeometry.dutyAtRadius, d.crane2Geometry.dutyAtRadius],
    ['% Capacity', d.liftGeometry.percentCapacity, d.crane2Geometry.percentCapacity],
    ['Boom Length', d.liftGeometry.boomLength, d.crane2Geometry.boomLength],
    ['Slew Arc', d.liftGeometry.slewArc, d.crane2Geometry.slewArc],
    ['Tail Swing', d.liftGeometry.tailSwing, d.crane2Geometry.tailSwing],
  ];
  els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Parameter', hw, A), hdrCell('Crane 1 (Lead)', c1w, A), hdrCell('Crane 2 (Tail)', c2w, A)] }),
    ...craneRows.map((r, i) => new TableRow({ children: [
      txtCell(r[0], hw, { bold: true, bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
      txtCell(r[1] || '\u2014', c1w, { bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
      txtCell(r[2] || '\u2014', c2w, { bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
    ] })),
  ] }));

  // 3 Load Sharing
  els.push(secHead('3.0', 'Load Sharing Calculations', A));
  if (d.loadShareCalc) els.push(calloutPara(d.loadShareCalc, A, LBG));
  els.push(infoTable([
    { label: 'Total Load Weight', value: d.loadDetails.totalWeight || d.loadDetails.weight },
    { label: 'Load Description', value: d.loadDetails.description },
    { label: 'Centre of Gravity', value: d.loadDetails.centreOfGravity },
    { label: 'Rigging Weight', value: d.loadDetails.riggingWeight },
  ], LBG, LC));

  // 4 Synchronisation Plan
  if (d.liftPhases.length > 0) {
    const lp = [Math.round(W * 0.06), Math.round(W * 0.16), Math.round(W * 0.18), Math.round(W * 0.18), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.12), W - Math.round(W * 0.06) - Math.round(W * 0.16) - Math.round(W * 0.18) * 2 - Math.round(W * 0.08) * 2 - Math.round(W * 0.12)];
    els.push(secHead('4.0', 'Synchronisation Plan — Lift Phases', A));
    els.push(dataTable(
      [{ text: 'Phase', width: lp[0] }, { text: 'Description', width: lp[1] }, { text: 'Crane 1', width: lp[2] }, { text: 'Crane 2', width: lp[3] }, { text: 'Share 1', width: lp[4] }, { text: 'Share 2', width: lp[5] }, { text: 'Signal', width: lp[6] }, { text: 'Abort', width: lp[7] }],
      d.liftPhases.map(p => [{ text: p.phase, bold: true }, { text: p.description }, { text: p.crane1Action }, { text: p.crane2Action }, { text: p.loadShare1 }, { text: p.loadShare2 }, { text: p.signalMethod }, { text: p.abortCriteria }]),
      A, TEAL_BG));
  }

  // 5 Inter-Crane Communication
  els.push(secHead('5.0', 'Inter-Crane Communication Protocol', A));
  if (d.interCraneComms) els.push(calloutPara(d.interCraneComms, A, LBG));
  if (d.commItems.length > 0) {
    els.push(dataTable(
      [{ text: 'Method', width: Math.round(W * 0.20) }, { text: 'Channel', width: Math.round(W * 0.20) }, { text: 'Users', width: Math.round(W * 0.32) }, { text: 'Backup', width: W - Math.round(W * 0.20) * 2 - Math.round(W * 0.32) }],
      d.commItems.map(c2 => [{ text: c2.method, bold: true }, { text: c2.channel }, { text: c2.users }, { text: c2.backup }]),
      A, TEAL_BG));
  }

  // 6 Crane Interaction Zones
  if (d.craneInteractions.length > 0) {
    els.push(secHead('6.0', 'Crane Interaction Zones', A));
    els.push(dataTable(
      [{ text: 'Zone', width: Math.round(W * 0.18) }, { text: 'Hazard', width: Math.round(W * 0.28) }, { text: 'Min Separation', width: Math.round(W * 0.18) }, { text: 'Control', width: W - Math.round(W * 0.18) - Math.round(W * 0.28) - Math.round(W * 0.18) }],
      d.craneInteractions.map(c2 => [{ text: c2.zone, bold: true }, { text: c2.hazard }, { text: c2.separation }, { text: c2.control }]),
      A, TEAL_BG));
  }

  // 7 What-If Analysis
  if (d.whatIfScenarios.length > 0) {
    els.push(secHead('7.0', 'What-If Failure Analysis', A));
    els.push(dataTable(
      [{ text: 'Scenario', width: Math.round(W * 0.20) }, { text: 'Consequence', width: Math.round(W * 0.26) }, { text: 'Response', width: Math.round(W * 0.28) }, { text: 'Prevention', width: W - Math.round(W * 0.20) - Math.round(W * 0.26) - Math.round(W * 0.28) }],
      d.whatIfScenarios.map(w => [{ text: w.scenario, bold: true }, { text: w.consequence }, { text: w.response }, { text: w.prevention }]),
      A, TEAL_BG));
  }

  // 8 Ground bearing per crane
  els.push(secHead('8.0', 'Ground Conditions — Per Crane Position', A));
  const g1 = d.groundDetails; const g2 = d.crane2GroundDetails;
  const ghw = Math.round(W * 0.30); const g1w = Math.round(W * 0.35); const g2w2 = W - ghw - g1w;
  const gRows = [
    ['Bearing Capacity', g1.bearingCapacity, g2.bearingCapacity],
    ['Ground Type', g1.groundType, g2.groundType],
    ['Mat Type / Size', `${g1.matType} ${g1.matSize}`, `${g2.matType} ${g2.matSize}`],
    ['Outrigger Spread', g1.outriggerSpread, g2.outriggerSpread],
    ['Pad Load per Leg', g1.padLoadPerLeg, g2.padLoadPerLeg],
    ['Gradient', g1.gradient, g2.gradient],
  ];
  els.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Parameter', ghw, A), hdrCell('Crane 1 Position', g1w, A), hdrCell('Crane 2 Position', g2w2, A)] }),
    ...gRows.map((r, i) => new TableRow({ children: [
      txtCell(r[0], ghw, { bold: true, bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
      txtCell(r[1] || '\u2014', g1w, { bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
      txtCell(r[2] || '\u2014', g2w2, { bg: i % 2 === 0 ? TEAL_BG : h.WHITE }),
    ] })),
  ] }));

  // 9 Risk Assessment
  if (d.riskEntries.length > 0) {
    const ra = [Math.round(W * 0.18), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.30), Math.round(W * 0.08), W - Math.round(W * 0.18) - Math.round(W * 0.08) * 3 - Math.round(W * 0.30) - Math.round(W * 0.08)];
    els.push(secHead('9.0', 'Risk Assessment', A));
    els.push(dataTable(
      [{ text: 'Hazard', width: ra[0] }, { text: 'Sev.', width: ra[1] }, { text: 'Lik.', width: ra[2] }, { text: 'Risk', width: ra[3] }, { text: 'Controls', width: ra[4] }, { text: 'Res.', width: ra[5] }, { text: 'Level', width: ra[6] }],
      d.riskEntries.map(r => [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.riskRating, bold: true, color: ragColor(r.ratingLevel) }, { text: r.controlMeasures }, { text: r.residualRating }, { text: r.residualLevel, bold: true, color: ragColor(r.residualLevel) }]),
      A, TEAL_BG));
  }

  // 10 Engineering Calcs Summary
  if (d.engineeringCalcSummary) {
    els.push(secHead('10.0', 'Engineering Calculations Summary', A));
    els.push(calloutPara(d.engineeringCalcSummary, A, LBG));
  }

  // 11 References & Sign-Off
  els.push(secHead('11.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Description', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A, TEAL_BG));

  els.push(secHead('12.0', 'Approval & Sign-Off', A));
  els.push(signOff(['Appointed Person', 'Crane 1 Supervisor', 'Crane 2 Supervisor', 'Crane 1 Operator', 'Crane 2 Operator', 'Slinger / Signaller', 'Project Manager'], A));

  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'Tandem lifts require enhanced planning under BS 7121-1 Annex C. Both crane supervisors must agree the lift plan before operations commence. Any deviation requires a stop-lift and re-plan.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T4 — LOLER COMPLIANCE (navy, regulatory checklists)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT4(d: LiftPlanData): (Paragraph | Table)[] {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY; const ZB = 'f8fafc';
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [new TextRun({ text: 'LOLER COMPLIANCE LIFT PLAN', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 80 }, children: [new TextRun({ text: 'LOLER 1998 \u00B7 PUWER 1998 \u00B7 BS 7121 \u00B7 Regulatory Compliance Evidence', size: SM, font: 'Arial', color: 'D9D9D9' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '334155' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.principalContractor} | ${d.planDate}`, size: SM, font: 'Arial', color: 'cbd5e1' })] }));

  // 1 Lift Summary
  els.push(secHead('1.0', 'Lift Summary & Categorisation', A));
  els.push(infoTable([
    { label: 'Document Ref', value: d.documentRef }, { label: 'Plan Date', value: d.planDate },
    { label: 'Lift Category', value: d.liftCategory },
    { label: 'Load', value: `${d.loadDetails.description} — ${d.loadDetails.totalWeight || d.loadDetails.weight}` },
    { label: 'Crane', value: `${d.craneDetails.makeModel} (${d.craneDetails.capacity})` },
    { label: 'Lift Description', value: d.liftDescription },
  ], LBG, LC));

  // 2 LOLER Regulation Checklist
  if (d.lolerChecks.length > 0) {
    const lc2 = [Math.round(W * 0.16), Math.round(W * 0.30), Math.round(W * 0.14), W - Math.round(W * 0.16) - Math.round(W * 0.30) - Math.round(W * 0.14)];
    els.push(secHead('2.0', 'LOLER 1998 — Regulation-by-Regulation Compliance', A));
    els.push(dataTable(
      [{ text: 'Regulation', width: lc2[0] }, { text: 'Requirement', width: lc2[1] }, { text: 'Compliance', width: lc2[2] }, { text: 'Evidence', width: lc2[3] }],
      d.lolerChecks.map(l => [{ text: l.regulation, bold: true }, { text: l.requirement }, { text: l.compliance, bold: true, color: ragColor(l.compliance) }, { text: l.evidence }]),
      A, ZB));
  }

  // 3 Equipment Register
  if (d.equipmentRegister.length > 0) {
    const er = [Math.round(W * 0.18), Math.round(W * 0.12), Math.round(W * 0.10), Math.round(W * 0.16), Math.round(W * 0.16), W - Math.round(W * 0.18) - Math.round(W * 0.12) - Math.round(W * 0.10) - Math.round(W * 0.16) - Math.round(W * 0.16)];
    els.push(secHead('3.0', 'Equipment Register & Thorough Examination', A));
    els.push(dataTable(
      [{ text: 'Item', width: er[0] }, { text: 'ID', width: er[1] }, { text: 'SWL', width: er[2] }, { text: 'Last Exam', width: er[3] }, { text: 'Next Exam', width: er[4] }, { text: 'Status', width: er[5] }],
      d.equipmentRegister.map(e => [{ text: e.item, bold: true }, { text: e.id }, { text: e.swl }, { text: e.lastExam }, { text: e.nextExam }, { text: e.status, bold: true, color: ragColor(e.status) }]),
      A, ZB));
  }

  // 4 Rigging certification
  if (d.riggingItems.length > 0) {
    const ri = [Math.round(W * 0.16), Math.round(W * 0.22), Math.round(W * 0.10), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.16) - Math.round(W * 0.22) - Math.round(W * 0.10) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(secHead('4.0', 'Sling & Shackle Certification', A));
    els.push(dataTable(
      [{ text: 'Item', width: ri[0] }, { text: 'Specification', width: ri[1] }, { text: 'SWL', width: ri[2] }, { text: 'Cert Ref', width: ri[3] }, { text: 'Expiry', width: ri[4] }, { text: 'Condition', width: ri[5] }],
      d.riggingItems.map(r => [{ text: r.item, bold: true }, { text: r.specification }, { text: r.swl }, { text: r.certRef }, { text: r.certExpiry }, { text: r.condition, bold: true, color: ragColor(r.condition) }]),
      A, ZB));
  }

  // 5 Appointed persons — competence
  if (d.appointedPersons.length > 0) {
    const ap = [Math.round(W * 0.16), Math.round(W * 0.16), Math.round(W * 0.22), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.16) - Math.round(W * 0.16) - Math.round(W * 0.22) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(secHead('5.0', 'Competent Persons (LOLER Reg 8)', A));
    els.push(dataTable(
      [{ text: 'Role', width: ap[0] }, { text: 'Name', width: ap[1] }, { text: 'Qualification', width: ap[2] }, { text: 'Cert Ref', width: ap[3] }, { text: 'Expiry', width: ap[4] }, { text: 'Employer', width: ap[5] }],
      d.appointedPersons.map(p => [{ text: p.role, bold: true }, { text: p.name }, { text: p.qualification }, { text: p.certRef }, { text: p.certExpiry }, { text: p.employer }]),
      A, ZB));
  }

  // 6 Previous similar lifts
  if (d.previousLifts.length > 0) {
    const pl = [Math.round(W * 0.12), Math.round(W * 0.28), Math.round(W * 0.18), Math.round(W * 0.14), W - Math.round(W * 0.12) - Math.round(W * 0.28) - Math.round(W * 0.18) - Math.round(W * 0.14)];
    els.push(secHead('6.0', 'Previous Similar Lifts', A));
    els.push(dataTable(
      [{ text: 'Date', width: pl[0] }, { text: 'Description', width: pl[1] }, { text: 'Crane', width: pl[2] }, { text: 'Weight', width: pl[3] }, { text: 'Outcome', width: pl[4] }],
      d.previousLifts.map(p => [{ text: p.date }, { text: p.description }, { text: p.crane }, { text: p.weight }, { text: p.outcome, bold: true, color: ragColor(p.outcome) }]),
      A, ZB));
  }

  // 7 Risk Assessment
  if (d.riskEntries.length > 0) {
    const ra = [Math.round(W * 0.18), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.08), Math.round(W * 0.30), Math.round(W * 0.08), W - Math.round(W * 0.18) - Math.round(W * 0.08) * 3 - Math.round(W * 0.30) - Math.round(W * 0.08)];
    els.push(secHead('7.0', 'Risk Assessment (MHSW 1999 Reg 3)', A));
    els.push(dataTable(
      [{ text: 'Hazard', width: ra[0] }, { text: 'Sev.', width: ra[1] }, { text: 'Lik.', width: ra[2] }, { text: 'Risk', width: ra[3] }, { text: 'Controls', width: ra[4] }, { text: 'Res.', width: ra[5] }, { text: 'Level', width: ra[6] }],
      d.riskEntries.map(r => [{ text: r.hazard }, { text: r.severity }, { text: r.likelihood }, { text: r.riskRating, bold: true, color: ragColor(r.ratingLevel) }, { text: r.controlMeasures }, { text: r.residualRating }, { text: r.residualLevel, bold: true, color: ragColor(r.residualLevel) }]),
      A, ZB));
  }

  // 8 Pre-lift checks
  if (d.preLiftChecks.length > 0) {
    const plc = [Math.round(W * 0.26), Math.round(W * 0.34), Math.round(W * 0.14), W - Math.round(W * 0.26) - Math.round(W * 0.34) - Math.round(W * 0.14)];
    els.push(secHead('8.0', 'Pre-Lift Inspection Checklist', A));
    els.push(dataTable(
      [{ text: 'Check', width: plc[0] }, { text: 'Requirement', width: plc[1] }, { text: 'Verified', width: plc[2] }, { text: 'Notes', width: plc[3] }],
      d.preLiftChecks.map(p => [{ text: p.checkItem, bold: true }, { text: p.requirement }, { text: p.verified, bold: true, color: ragColor(p.verified) }, { text: p.notes }]),
      A, ZB));
  }

  // 9 Post-lift inspection
  if (d.postLiftChecks.length > 0) {
    const po = [Math.round(W * 0.28), Math.round(W * 0.38), W - Math.round(W * 0.28) - Math.round(W * 0.38)];
    els.push(secHead('9.0', 'Post-Lift Inspection Checklist', A));
    els.push(dataTable(
      [{ text: 'Check', width: po[0] }, { text: 'Requirement', width: po[1] }, { text: 'Result', width: po[2] }],
      d.postLiftChecks.map(p => [{ text: p.checkItem, bold: true }, { text: p.requirement }, { text: p.result, bold: true, color: ragColor(p.result) }]),
      A, ZB));
  }

  // 10 Defect reporting
  if (d.defectReporting) {
    els.push(secHead('10.0', 'Defect Reporting Procedure', A));
    els.push(calloutPara(d.defectReporting, A, LBG));
  }

  // 11 References
  els.push(secHead('11.0', 'Regulatory Cross-Reference', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.35) }, { text: 'Description', width: W - Math.round(W * 0.35) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A, ZB));

  // 12 Sign-Off
  els.push(secHead('12.0', 'Sign-Off & Compliance Declaration', A));
  els.push(signOff(['Appointed Person', 'Crane Supervisor', 'Crane Operator', 'Slinger / Signaller', 'Project Manager', 'H&S Advisor'], A));

  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'All lifting equipment must hold current thorough examination certificates under LOLER 1998 Regs 9-10. Records must be retained for the life of the equipment. Defects must be reported immediately under LOLER Reg 11.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export async function buildLiftPlanTemplateDocument(
  content: any,
  templateSlug: LiftPlanTemplateSlug
): Promise<Document> {
  const d = extract(content);
  let children: (Paragraph | Table)[];

  switch (templateSlug) {
    case 'ebrora-standard': children = buildT1(d); break;
    case 'operator-brief':  children = buildT2(d); break;
    case 'tandem-lift':     children = buildT3(d); break;
    case 'loler-compliance': children = buildT4(d); break;
    default:                children = buildT1(d); break;
  }

  const headerLabel = templateSlug === 'operator-brief' ? 'Crane Operator Brief'
    : templateSlug === 'tandem-lift' ? 'Tandem / Complex Lift Plan'
    : templateSlug === 'loler-compliance' ? 'LOLER Compliance Lift Plan'
    : 'Lift Plan';

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader(headerLabel) },
      footers: { default: h.ebroraFooter() },
      children,
    }],
  });
}
