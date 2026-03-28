// =============================================================================
// Manual Handling Assessment Builder — Multi-Template Engine
// 4 templates, all consuming the same Manual Handling JSON structure.
//
// T1 — Ebrora Standard    (green, cover, comprehensive TILE, 16+ sections)
// T2 — MAC Assessment     (amber, HSE MAC tool scoring)
// T3 — RAPP Assessment    (teal, pushing/pulling operations)
// T4 — Training Briefing  (navy, compact operative card)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ManualHandlingTemplateSlug } from '@/lib/manual-handling/types';

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
interface TaskAnalysis { description: string; frequency: string; duration: string; distanceCarried: string; heightOfLift: string; startPosition: string; endPosition: string; twistingRequired: string; pushingPulling: string; teamLift: string; numberOfPersons: string; restBreaks: string; repetitionRate: string; posturesAdopted: string; gripType: string; movementPattern: string; }
interface IndividualFactors { trainingRequired: string; trainingProvided: string; fitnessRequirements: string; pregnancyConsiderations: string; existingConditions: string; ageConsiderations: string; ppe: string; }
interface LoadCharacteristics { weight: string; shape: string; size: string; grip: string; stability: string; sharpEdges: string; temperature: string; contents: string; labelling: string; }
interface EnvironmentFactors { spaceConstraints: string; floorSurface: string; levels: string; lighting: string; temperature: string; humidity: string; wind: string; noise: string; vibration: string; }
interface ScheduleOneItem { factor: string; present: string; detail: string; }
interface RiskScore { factor: string; score: string; level: string; justification: string; }
interface ControlMeasure { measure: string; type: string; owner: string; targetDate: string; status: string; }
interface MechanicalAid { aid: string; application: string; available: string; location: string; }
interface MacFactor { factor: string; description: string; score: string; colour: string; notes: string; }
interface RappFactor { factor: string; description: string; score: string; colour: string; notes: string; }
interface PushPullDetail { parameter: string; value: string; notes: string; }
interface LiftingStep { step: string; instruction: string; keyPoint: string; }
interface WeightGuideline { zone: string; male: string; female: string; notes: string; }
interface DosDont { type: string; item: string; }
interface CommonInjury { injury: string; cause: string; prevention: string; }
interface MonitoringItem { activity: string; frequency: string; responsibility: string; record: string; }
interface RegRef { reference: string; description: string; }

interface ManualHandlingData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessedBy: string; projectName: string; siteAddress: string;
  principalContractor: string; client: string;
  activityDescription: string; canTaskBeAvoided: string; legalBasis: string;
  taskAnalysis: TaskAnalysis;
  individualFactors: IndividualFactors;
  loadCharacteristics: LoadCharacteristics;
  environmentFactors: EnvironmentFactors;
  scheduleOneItems: ScheduleOneItem[];
  riskScores: RiskScore[];
  overallRiskRating: string; overallRiskLevel: string;
  controlMeasures: ControlMeasure[];
  mechanicalAids: MechanicalAid[];
  residualRiskRating: string; residualRiskLevel: string;
  monitoringItems: MonitoringItem[];
  macFactors: MacFactor[];
  macTotalScore: string; macPriorityLevel: string; macOverallColour: string;
  rappFactors: RappFactor[];
  rappTotalScore: string; rappPriorityLevel: string;
  pushPullDetails: PushPullDetail[];
  liftingSteps: LiftingStep[];
  weightGuidelines: WeightGuideline[];
  dosDonts: DosDont[];
  commonInjuries: CommonInjury[];
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): ManualHandlingData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const o = (v: any) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const ta = o(c.taskAnalysis); const ind = o(c.individualFactors);
  const ld = o(c.loadCharacteristics); const env = o(c.environmentFactors);
  return {
    documentRef: s(c.documentRef), assessmentDate: s(c.assessmentDate), reviewDate: s(c.reviewDate),
    assessedBy: s(c.assessedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    principalContractor: s(c.principalContractor), client: s(c.client),
    activityDescription: s(c.activityDescription), canTaskBeAvoided: s(c.canTaskBeAvoided), legalBasis: s(c.legalBasis),
    taskAnalysis: { description: s(ta.description), frequency: s(ta.frequency), duration: s(ta.duration), distanceCarried: s(ta.distanceCarried), heightOfLift: s(ta.heightOfLift), startPosition: s(ta.startPosition), endPosition: s(ta.endPosition), twistingRequired: s(ta.twistingRequired), pushingPulling: s(ta.pushingPulling), teamLift: s(ta.teamLift), numberOfPersons: s(ta.numberOfPersons), restBreaks: s(ta.restBreaks), repetitionRate: s(ta.repetitionRate), posturesAdopted: s(ta.posturesAdopted), gripType: s(ta.gripType), movementPattern: s(ta.movementPattern) },
    individualFactors: { trainingRequired: s(ind.trainingRequired), trainingProvided: s(ind.trainingProvided), fitnessRequirements: s(ind.fitnessRequirements), pregnancyConsiderations: s(ind.pregnancyConsiderations), existingConditions: s(ind.existingConditions), ageConsiderations: s(ind.ageConsiderations), ppe: s(ind.ppe) },
    loadCharacteristics: { weight: s(ld.weight), shape: s(ld.shape), size: s(ld.size), grip: s(ld.grip), stability: s(ld.stability), sharpEdges: s(ld.sharpEdges), temperature: s(ld.temperature), contents: s(ld.contents), labelling: s(ld.labelling) },
    environmentFactors: { spaceConstraints: s(env.spaceConstraints), floorSurface: s(env.floorSurface), levels: s(env.levels), lighting: s(env.lighting), temperature: s(env.temperature), humidity: s(env.humidity), wind: s(env.wind), noise: s(env.noise), vibration: s(env.vibration) },
    scheduleOneItems: a(c.scheduleOneItems), riskScores: a(c.riskScores),
    overallRiskRating: s(c.overallRiskRating), overallRiskLevel: s(c.overallRiskLevel),
    controlMeasures: a(c.controlMeasures), mechanicalAids: a(c.mechanicalAids),
    residualRiskRating: s(c.residualRiskRating), residualRiskLevel: s(c.residualRiskLevel),
    monitoringItems: a(c.monitoringItems),
    macFactors: a(c.macFactors), macTotalScore: s(c.macTotalScore), macPriorityLevel: s(c.macPriorityLevel), macOverallColour: s(c.macOverallColour),
    rappFactors: a(c.rappFactors), rappTotalScore: s(c.rappTotalScore), rappPriorityLevel: s(c.rappPriorityLevel),
    pushPullDetails: a(c.pushPullDetails),
    liftingSteps: a(c.liftingSteps), weightGuidelines: a(c.weightGuidelines),
    dosDonts: a(c.dosDonts), commonInjuries: a(c.commonInjuries),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'Manual Handling Operations Regulations 1992 (as amended 2002)', description: 'Primary UK legislation for manual handling at work' },
    { reference: 'HSE L23 (4th edition)', description: 'Manual handling — guidance on the regulations' },
    { reference: 'HSE INDG143', description: 'Getting to grips with manual handling — short guide' },
    { reference: 'HSE MAC Tool', description: 'Manual Handling Assessment Charts — numerical scoring methodology' },
    { reference: 'HSE RAPP Tool', description: 'Risk Assessment of Pushing and Pulling — specific guidance' },
    { reference: 'MHSW 1999 — Reg 3', description: 'Duty to carry out suitable and sufficient risk assessment' },
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
  if (l === 'high' || l === 'red' || l === 'r' || l === 'purple' || l === 'p') return RED;
  if (l === 'medium' || l === 'amber' || l === 'a' || l === 'orange') return AMBER;
  if (l === 'low' || l === 'green' || l === 'g') return GREEN_RAG;
  return GREY_RAG;
}
function macColour(c: string): string {
  const l = (c || '').toLowerCase();
  if (l === 'green' || l === 'g') return GREEN_RAG;
  if (l === 'amber' || l === 'a') return AMBER;
  if (l === 'red' || l === 'r') return RED;
  if (l === 'purple' || l === 'p') return '7C3AED';
  return GREY_RAG;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, comprehensive TILE, 16 sections)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT1(d: ManualHandlingData): (Paragraph | Table)[] {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const els: (Paragraph | Table)[] = [];
  let sn = 1;

  // Cover
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'MANUAL HANDLING RISK ASSESSMENT', bold: true, size: TTL, font: 'Arial', color: A })] }));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'MHOR 1992 \u00B7 TILE Methodology \u00B7 HSE L23 \u00B7 MAC/RAPP', size: BODY, font: 'Arial', color: h.GREY_DARK })] }));
  els.push(h.spacer(100));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(h.spacer(100));
  els.push(infoTable([
    { label: 'Document Ref', value: d.documentRef }, { label: 'Assessment Date', value: d.assessmentDate },
    { label: 'Review Date', value: d.reviewDate }, { label: 'Assessed By', value: d.assessedBy },
    { label: 'Principal Contractor', value: d.principalContractor }, { label: 'Client', value: d.client },
    { label: 'Site Address', value: d.siteAddress },
  ], LBG, LC));

  // 1 Activity Description
  els.push(secHead(`${sn}.0`, 'Activity Description', A)); sn++;
  if (d.activityDescription) els.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: d.activityDescription, size: BODY, font: 'Arial' })] }));

  // 2 Can Task Be Avoided?
  els.push(secHead(`${sn}.0`, 'Can the Manual Handling Be Avoided?', A)); sn++;
  if (d.canTaskBeAvoided) els.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: d.canTaskBeAvoided, size: BODY, font: 'Arial' })] }));

  // 3 Task Analysis (T)
  els.push(secHead(`${sn}.0`, 'Task Analysis (TILE — T)', A)); sn++;
  els.push(infoTable([
    { label: 'Task Description', value: d.taskAnalysis.description },
    { label: 'Frequency', value: d.taskAnalysis.frequency }, { label: 'Duration', value: d.taskAnalysis.duration },
    { label: 'Distance Carried', value: d.taskAnalysis.distanceCarried }, { label: 'Height of Lift', value: d.taskAnalysis.heightOfLift },
    { label: 'Start Position', value: d.taskAnalysis.startPosition }, { label: 'End Position', value: d.taskAnalysis.endPosition },
    { label: 'Twisting Required?', value: d.taskAnalysis.twistingRequired }, { label: 'Pushing/Pulling?', value: d.taskAnalysis.pushingPulling },
    { label: 'Team Lift?', value: d.taskAnalysis.teamLift }, { label: 'Number of Persons', value: d.taskAnalysis.numberOfPersons },
    { label: 'Rest Breaks', value: d.taskAnalysis.restBreaks }, { label: 'Repetition Rate', value: d.taskAnalysis.repetitionRate },
    { label: 'Postures Adopted', value: d.taskAnalysis.posturesAdopted }, { label: 'Grip Type', value: d.taskAnalysis.gripType },
    { label: 'Movement Pattern', value: d.taskAnalysis.movementPattern },
  ], LBG, LC));

  // 4 Individual (I)
  els.push(secHead(`${sn}.0`, 'Individual Capability (TILE — I)', A)); sn++;
  els.push(infoTable([
    { label: 'Training Required', value: d.individualFactors.trainingRequired },
    { label: 'Training Provided', value: d.individualFactors.trainingProvided },
    { label: 'Fitness Requirements', value: d.individualFactors.fitnessRequirements },
    { label: 'Pregnancy Considerations', value: d.individualFactors.pregnancyConsiderations },
    { label: 'Existing Health Conditions', value: d.individualFactors.existingConditions },
    { label: 'Age Considerations', value: d.individualFactors.ageConsiderations },
    { label: 'PPE Required', value: d.individualFactors.ppe },
  ], LBG, LC));

  // 5 Load (L)
  els.push(secHead(`${sn}.0`, 'Load Characteristics (TILE — L)', A)); sn++;
  els.push(infoTable([
    { label: 'Weight', value: d.loadCharacteristics.weight }, { label: 'Shape', value: d.loadCharacteristics.shape },
    { label: 'Size', value: d.loadCharacteristics.size }, { label: 'Grip', value: d.loadCharacteristics.grip },
    { label: 'Stability', value: d.loadCharacteristics.stability }, { label: 'Sharp Edges?', value: d.loadCharacteristics.sharpEdges },
    { label: 'Temperature', value: d.loadCharacteristics.temperature }, { label: 'Contents', value: d.loadCharacteristics.contents },
    { label: 'Labelling', value: d.loadCharacteristics.labelling },
  ], LBG, LC));

  // 6 Environment (E)
  els.push(secHead(`${sn}.0`, 'Environmental Factors (TILE — E)', A)); sn++;
  els.push(infoTable([
    { label: 'Space Constraints', value: d.environmentFactors.spaceConstraints },
    { label: 'Floor Surface', value: d.environmentFactors.floorSurface },
    { label: 'Levels / Steps / Slopes', value: d.environmentFactors.levels },
    { label: 'Lighting', value: d.environmentFactors.lighting },
    { label: 'Temperature', value: d.environmentFactors.temperature },
    { label: 'Humidity', value: d.environmentFactors.humidity },
    { label: 'Wind (outdoor)', value: d.environmentFactors.wind },
    { label: 'Noise', value: d.environmentFactors.noise },
    { label: 'Vibration', value: d.environmentFactors.vibration },
  ], LBG, LC));

  // 7 Schedule 1 Risk Factors
  if (d.scheduleOneItems.length > 0) {
    const sc = [Math.round(W * 0.34), Math.round(W * 0.12), W - Math.round(W * 0.34) - Math.round(W * 0.12)];
    els.push(secHead(`${sn}.0`, 'Schedule 1 Risk Factor Checklist', A)); sn++;
    els.push(dataTable(
      [{ text: 'Risk Factor (Schedule 1)', width: sc[0] }, { text: 'Present?', width: sc[1] }, { text: 'Detail', width: sc[2] }],
      d.scheduleOneItems.map(s2 => [{ text: s2.factor }, { text: s2.present, bold: true, color: s2.present.toLowerCase().includes('yes') ? RED : GREEN_RAG }, { text: s2.detail }]),
      A));
  } else { sn++; }

  // 8 Risk Scoring
  if (d.riskScores.length > 0) {
    const rs = [Math.round(W * 0.24), Math.round(W * 0.08), Math.round(W * 0.10), W - Math.round(W * 0.24) - Math.round(W * 0.08) - Math.round(W * 0.10)];
    els.push(secHead(`${sn}.0`, 'Risk Scoring Matrix', A)); sn++;
    els.push(dataTable(
      [{ text: 'Factor', width: rs[0] }, { text: 'Score', width: rs[1] }, { text: 'Level', width: rs[2] }, { text: 'Justification', width: rs[3] }],
      d.riskScores.map(r => [{ text: r.factor }, { text: r.score, bold: true }, { text: r.level, bold: true, color: ragColor(r.level) }, { text: r.justification }]),
      A));
    if (d.overallRiskRating) els.push(infoTable([{ label: 'Overall Risk Rating', value: `${d.overallRiskRating} — ${d.overallRiskLevel}` }], LBG, LC));
  } else { sn++; }

  // 9 Control Measures
  if (d.controlMeasures.length > 0) {
    const cm2 = [Math.round(W * 0.32), Math.round(W * 0.16), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.32) - Math.round(W * 0.16) - Math.round(W * 0.16) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Control Measures (Hierarchy of Controls)', A)); sn++;
    els.push(dataTable(
      [{ text: 'Measure', width: cm2[0] }, { text: 'Control Type', width: cm2[1] }, { text: 'Owner', width: cm2[2] }, { text: 'Target Date', width: cm2[3] }, { text: 'Status', width: cm2[4] }],
      d.controlMeasures.map(c2 => [{ text: c2.measure }, { text: c2.type, bold: true }, { text: c2.owner }, { text: c2.targetDate }, { text: c2.status, bold: true, color: ragColor(c2.status) }]),
      A));
  } else { sn++; }

  // 10 Mechanical Aids
  if (d.mechanicalAids.length > 0) {
    const ma = [Math.round(W * 0.22), Math.round(W * 0.32), Math.round(W * 0.14), W - Math.round(W * 0.22) - Math.round(W * 0.32) - Math.round(W * 0.14)];
    els.push(secHead(`${sn}.0`, 'Mechanical Aids & Alternatives', A)); sn++;
    els.push(dataTable(
      [{ text: 'Aid', width: ma[0] }, { text: 'Application', width: ma[1] }, { text: 'Available?', width: ma[2] }, { text: 'Location', width: ma[3] }],
      d.mechanicalAids.map(m => [{ text: m.aid, bold: true }, { text: m.application }, { text: m.available, bold: true, color: m.available.toLowerCase().includes('yes') ? GREEN_RAG : RED }, { text: m.location }]),
      A));
  } else { sn++; }

  // 11 Residual Risk
  if (d.residualRiskRating) {
    els.push(secHead(`${sn}.0`, 'Residual Risk Rating', A)); sn++;
    els.push(infoTable([
      { label: 'Residual Risk Rating', value: d.residualRiskRating },
      { label: 'Residual Risk Level', value: d.residualRiskLevel },
    ], LBG, LC));
  } else { sn++; }

  // 12 Monitoring
  if (d.monitoringItems.length > 0) {
    const mo = [Math.round(W * 0.26), Math.round(W * 0.20), Math.round(W * 0.22), W - Math.round(W * 0.26) - Math.round(W * 0.20) - Math.round(W * 0.22)];
    els.push(secHead(`${sn}.0`, 'Review & Monitoring Plan', A)); sn++;
    els.push(dataTable(
      [{ text: 'Activity', width: mo[0] }, { text: 'Frequency', width: mo[1] }, { text: 'Responsibility', width: mo[2] }, { text: 'Record', width: mo[3] }],
      d.monitoringItems.map(m => [{ text: m.activity }, { text: m.frequency }, { text: m.responsibility }, { text: m.record }]),
      A));
  } else { sn++; }

  // 13 Legal Basis
  if (d.legalBasis) {
    els.push(secHead(`${sn}.0`, 'Legal Basis', A)); sn++;
    els.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: d.legalBasis, size: BODY, font: 'Arial' })] }));
  } else { sn++; }

  // 14 Regulatory References
  els.push(secHead(`${sn}.0`, 'Regulatory References', A)); sn++;
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A));

  // 15 Sign-Off
  els.push(secHead(`${sn}.0`, 'Sign-Off', A)); sn++;
  els.push(signOff(['Assessed By', 'Supervisor / Manager', 'H&S Advisor', 'Operative Representative'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This manual handling assessment must be reviewed whenever the task, load, environment, or workforce changes, and at least annually. Records retained per MHSW 1999.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T2 — MAC ASSESSMENT (amber, HSE MAC scoring)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT2(d: ManualHandlingData): (Paragraph | Table)[] {
  const A = AMBER_D; const LBG = 'FFFBEB'; const LC = AMBER_D;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_D }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'MAC MANUAL HANDLING ASSESSMENT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_D }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'HSE Manual Handling Assessment Charts \u00B7 Colour-Coded Factor Scoring', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '78350f' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.assessedBy} | ${d.assessmentDate}`, size: SM, font: 'Arial', color: 'fcd34d' })] }));

  // Task summary
  els.push(secHead('1.0', 'Task Summary', A));
  els.push(infoTable([
    { label: 'Activity', value: d.activityDescription },
    { label: 'Load Weight', value: d.loadCharacteristics.weight },
    { label: 'Frequency', value: d.taskAnalysis.frequency },
    { label: 'Duration', value: d.taskAnalysis.duration },
  ], LBG, LC));

  // MAC Factor Scoring
  if (d.macFactors.length > 0) {
    const mf = [Math.round(W * 0.22), Math.round(W * 0.30), Math.round(W * 0.08), Math.round(W * 0.10), W - Math.round(W * 0.22) - Math.round(W * 0.30) - Math.round(W * 0.08) - Math.round(W * 0.10)];
    els.push(secHead('2.0', 'MAC Factor Scoring', A));
    els.push(dataTable(
      [{ text: 'Factor', width: mf[0] }, { text: 'Description', width: mf[1] }, { text: 'Score', width: mf[2] }, { text: 'Colour', width: mf[3] }, { text: 'Notes', width: mf[4] }],
      d.macFactors.map(f => [{ text: f.factor, bold: true }, { text: f.description }, { text: f.score, bold: true }, { text: f.colour, bold: true, color: macColour(f.colour) }, { text: f.notes }]),
      A));
  }

  // Overall MAC Score
  els.push(secHead('3.0', 'Overall MAC Score & Priority Level', A));
  els.push(infoTable([
    { label: 'Total MAC Score', value: d.macTotalScore },
    { label: 'Priority Level', value: d.macPriorityLevel },
    { label: 'Overall Colour', value: d.macOverallColour },
  ], LBG, LC));

  // Control measures linked to factors
  if (d.controlMeasures.length > 0) {
    const cm2 = [Math.round(W * 0.34), Math.round(W * 0.18), Math.round(W * 0.16), W - Math.round(W * 0.34) - Math.round(W * 0.18) - Math.round(W * 0.16)];
    els.push(secHead('4.0', 'Factor-Linked Control Measures', A));
    els.push(dataTable(
      [{ text: 'Control Measure', width: cm2[0] }, { text: 'Control Type', width: cm2[1] }, { text: 'Owner', width: cm2[2] }, { text: 'Status', width: cm2[3] }],
      d.controlMeasures.map(c2 => [{ text: c2.measure }, { text: c2.type, bold: true }, { text: c2.owner }, { text: c2.status, bold: true, color: ragColor(c2.status) }]),
      A));
  }

  // Mechanical aids
  if (d.mechanicalAids.length > 0) {
    els.push(secHead('5.0', 'Mechanical Aids', A));
    els.push(dataTable(
      [{ text: 'Aid', width: Math.round(W * 0.24) }, { text: 'Application', width: Math.round(W * 0.36) }, { text: 'Available?', width: Math.round(W * 0.14) }, { text: 'Location', width: W - Math.round(W * 0.24) - Math.round(W * 0.36) - Math.round(W * 0.14) }],
      d.mechanicalAids.map(m => [{ text: m.aid, bold: true }, { text: m.application }, { text: m.available }, { text: m.location }]),
      A));
  }

  // Refs & sign-off
  els.push(secHead('6.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A));

  els.push(secHead('7.0', 'Sign-Off', A));
  els.push(signOff(['Assessed By', 'Supervisor', 'H&S Advisor'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'MAC assessment must be reviewed whenever the task changes or at least annually. HSE MAC tool guidance: www.hse.gov.uk/msd/mac', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T3 — RAPP ASSESSMENT (teal, pushing/pulling)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT3(d: ManualHandlingData): (Paragraph | Table)[] {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL;
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'RAPP — PUSHING & PULLING ASSESSMENT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: 'HSE Risk Assessment of Pushing and Pulling \u00B7 MHOR 1992', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.assessedBy} | ${d.assessmentDate}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }));

  // 1 Operation description
  els.push(secHead('1.0', 'Push/Pull Operation Description', A));
  els.push(infoTable([
    { label: 'Activity', value: d.activityDescription },
    { label: 'Load Weight', value: d.loadCharacteristics.weight },
    { label: 'Load Description', value: d.loadCharacteristics.contents },
  ], LBG, LC));

  // 2 Push/Pull Details
  if (d.pushPullDetails.length > 0) {
    els.push(secHead('2.0', 'Push/Pull Parameters', A));
    els.push(dataTable(
      [{ text: 'Parameter', width: Math.round(W * 0.30) }, { text: 'Value', width: Math.round(W * 0.26) }, { text: 'Notes', width: W - Math.round(W * 0.30) - Math.round(W * 0.26) }],
      d.pushPullDetails.map(p => [{ text: p.parameter, bold: true }, { text: p.value }, { text: p.notes }]),
      A, TEAL_BG));
  }

  // 3 RAPP Factor Scoring
  if (d.rappFactors.length > 0) {
    const rf = [Math.round(W * 0.22), Math.round(W * 0.30), Math.round(W * 0.08), Math.round(W * 0.10), W - Math.round(W * 0.22) - Math.round(W * 0.30) - Math.round(W * 0.08) - Math.round(W * 0.10)];
    els.push(secHead('3.0', 'RAPP Factor Scoring', A));
    els.push(dataTable(
      [{ text: 'Factor', width: rf[0] }, { text: 'Description', width: rf[1] }, { text: 'Score', width: rf[2] }, { text: 'Colour', width: rf[3] }, { text: 'Notes', width: rf[4] }],
      d.rappFactors.map(f => [{ text: f.factor, bold: true }, { text: f.description }, { text: f.score, bold: true }, { text: f.colour, bold: true, color: macColour(f.colour) }, { text: f.notes }]),
      A, TEAL_BG));
    els.push(infoTable([
      { label: 'RAPP Total Score', value: d.rappTotalScore },
      { label: 'Priority Level', value: d.rappPriorityLevel },
    ], LBG, LC));
  }

  // 4 Controls
  if (d.controlMeasures.length > 0) {
    els.push(secHead('4.0', 'Push/Pull-Specific Control Measures', A));
    els.push(dataTable(
      [{ text: 'Measure', width: Math.round(W * 0.34) }, { text: 'Type', width: Math.round(W * 0.18) }, { text: 'Owner', width: Math.round(W * 0.16) }, { text: 'Status', width: W - Math.round(W * 0.34) - Math.round(W * 0.18) - Math.round(W * 0.16) }],
      d.controlMeasures.map(c2 => [{ text: c2.measure }, { text: c2.type, bold: true }, { text: c2.owner }, { text: c2.status, bold: true, color: ragColor(c2.status) }]),
      A, TEAL_BG));
  }

  // 5 Mechanical alternatives
  if (d.mechanicalAids.length > 0) {
    els.push(secHead('5.0', 'Mechanical Alternatives', A));
    els.push(dataTable(
      [{ text: 'Aid', width: Math.round(W * 0.24) }, { text: 'Application', width: Math.round(W * 0.36) }, { text: 'Available?', width: Math.round(W * 0.14) }, { text: 'Location', width: W - Math.round(W * 0.24) - Math.round(W * 0.36) - Math.round(W * 0.14) }],
      d.mechanicalAids.map(m => [{ text: m.aid, bold: true }, { text: m.application }, { text: m.available }, { text: m.location }]),
      A, TEAL_BG));
  }

  // 6 Refs & sign-off
  els.push(secHead('6.0', 'Regulatory References', A));
  els.push(dataTable(
    [{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
    d.regulatoryReferences.map(r => [{ text: r.reference, bold: true }, { text: r.description }]),
    A, TEAL_BG));

  els.push(secHead('7.0', 'Sign-Off', A));
  els.push(signOff(['Assessed By', 'Supervisor', 'H&S Advisor'], A));
  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'RAPP assessment must be reviewed whenever the pushing/pulling operation changes. HSE RAPP guidance: www.hse.gov.uk/msd/pushpull', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// T4 — TRAINING BRIEFING (navy, compact operative card)
// ═══════════════════════════════════════════════════════════════════════════════
function buildT4(d: ManualHandlingData): (Paragraph | Table)[] {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY; const ZB = 'f8fafc';
  const els: (Paragraph | Table)[] = [];

  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'MANUAL HANDLING — TRAINING & BRIEFING CARD', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Safe Lifting Techniques \u00B7 Weight Guidelines \u00B7 Injury Prevention', size: SM, font: 'Arial', color: 'FFFFFFB0' })] }));
  els.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '334155' }, spacing: { after: 60 }, children: [new TextRun({ text: `${d.documentRef} | ${d.projectName} | ${d.assessmentDate}`, size: SM, font: 'Arial', color: 'cbd5e1' })] }));

  // Task-specific info
  els.push(secHead('', 'This Task', A));
  els.push(infoTable([
    { label: 'Activity', value: d.activityDescription },
    { label: 'Load Weight', value: d.loadCharacteristics.weight },
    { label: 'Team Lift?', value: d.taskAnalysis.teamLift },
    { label: 'Key Hazards', value: d.loadCharacteristics.sharpEdges ? `Sharp edges: ${d.loadCharacteristics.sharpEdges}. Grip: ${d.loadCharacteristics.grip}` : d.loadCharacteristics.grip },
  ], LBG, LC));

  // Safe lifting steps
  if (d.liftingSteps.length > 0) {
    els.push(secHead('', 'Safe Lifting Technique', A));
    els.push(dataTable(
      [{ text: '#', width: Math.round(W * 0.06) }, { text: 'Instruction', width: Math.round(W * 0.50) }, { text: 'Key Point', width: W - Math.round(W * 0.06) - Math.round(W * 0.50) }],
      d.liftingSteps.map(l => [{ text: l.step, bold: true }, { text: l.instruction }, { text: l.keyPoint }]),
      A, ZB));
  }

  // Weight guidelines
  if (d.weightGuidelines.length > 0) {
    els.push(secHead('', 'HSE Weight Guideline Figures', A));
    els.push(dataTable(
      [{ text: 'Lifting Zone', width: Math.round(W * 0.28) }, { text: 'Male (kg)', width: Math.round(W * 0.18) }, { text: 'Female (kg)', width: Math.round(W * 0.18) }, { text: 'Notes', width: W - Math.round(W * 0.28) - Math.round(W * 0.18) * 2 }],
      d.weightGuidelines.map(w => [{ text: w.zone, bold: true }, { text: w.male }, { text: w.female }, { text: w.notes }]),
      A, ZB));
  }

  // Do's and Don'ts
  if (d.dosDonts.length > 0) {
    const dos = d.dosDonts.filter(d2 => d2.type.toLowerCase() === 'do');
    const donts = d.dosDonts.filter(d2 => d2.type.toLowerCase() === "don't" || d2.type.toLowerCase() === 'dont');
    els.push(secHead('', "Do's and Don'ts", A));
    els.push(dataTable(
      [{ text: "DO ✓", width: Math.round(W * 0.50) }, { text: "DON'T ✗", width: W - Math.round(W * 0.50) }],
      Array.from({ length: Math.max(dos.length, donts.length) }, (_, i) => [
        { text: dos[i]?.item || '', color: GREEN_RAG },
        { text: donts[i]?.item || '', color: RED },
      ]),
      A, ZB));
  }

  // Common injuries
  if (d.commonInjuries.length > 0) {
    els.push(secHead('', 'Common Injuries & Prevention', A));
    els.push(dataTable(
      [{ text: 'Injury', width: Math.round(W * 0.22) }, { text: 'Cause', width: Math.round(W * 0.34) }, { text: 'Prevention', width: W - Math.round(W * 0.22) - Math.round(W * 0.34) }],
      d.commonInjuries.map(c2 => [{ text: c2.injury, bold: true }, { text: c2.cause }, { text: c2.prevention }]),
      A, ZB));
  }

  // Mechanical aids available
  if (d.mechanicalAids.length > 0) {
    els.push(secHead('', 'Mechanical Aids Available on Site', A));
    els.push(dataTable(
      [{ text: 'Aid', width: Math.round(W * 0.26) }, { text: 'Use For', width: Math.round(W * 0.38) }, { text: 'Location', width: W - Math.round(W * 0.26) - Math.round(W * 0.38) }],
      d.mechanicalAids.map(m => [{ text: m.aid, bold: true }, { text: m.application }, { text: m.location }]),
      A, ZB));
  }

  // Reporting
  els.push(secHead('', 'When to Report', A));
  els.push(new Paragraph({ spacing: { before: 60, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 } },
    shading: { type: ShadingType.CLEAR, fill: RED_BG },
    children: [new TextRun({ text: 'REPORT IMMEDIATELY if you feel pain, discomfort, or tingling during or after manual handling. Early reporting prevents serious injury. Tell your supervisor — you will NOT be penalised for reporting.', bold: true, size: SM + 2, font: 'Arial', color: RED })] }));

  // Attendance
  els.push(secHead('', 'Attendance Register', A));
  els.push(signOff(['Briefing Delivered By', 'Operative 1', 'Operative 2', 'Operative 3', 'Operative 4', 'Operative 5', 'Operative 6'], A));

  els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This training card is specific to the task described above. Review before starting work. Keep in welfare cabin.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] }));

  return els;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export async function buildManualHandlingTemplateDocument(
  content: any,
  templateSlug: ManualHandlingTemplateSlug
): Promise<Document> {
  const d = extract(content);
  let children: (Paragraph | Table)[];

  switch (templateSlug) {
    case 'ebrora-standard': children = buildT1(d); break;
    case 'mac-assessment':  children = buildT2(d); break;
    case 'rapp-assessment': children = buildT3(d); break;
    case 'training-briefing': children = buildT4(d); break;
    default:                children = buildT1(d); break;
  }

  const headerLabel = templateSlug === 'mac-assessment' ? 'MAC Manual Handling Assessment'
    : templateSlug === 'rapp-assessment' ? 'RAPP Pushing & Pulling Assessment'
    : templateSlug === 'training-briefing' ? 'Manual Handling Training Card'
    : 'Manual Handling Risk Assessment';

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
