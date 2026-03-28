// =============================================================================
// Confined Spaces Assessment Builder — Multi-Template Engine
// 4 templates, all consuming the same expanded JSON structure.
//
// T1 — Ebrora Standard  (green, cover, 22 sections, comprehensive)
// T2 — Red Danger        (red/black, danger callouts, hazard-first, 17 sections)
// T3 — Permit Style      (orange, checklist, auth chain, entry log, 9 sections)
// T4 — Rescue Focused    (teal, expanded rescue plan, 8 sections)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ConfinedSpacesTemplateSlug } from '@/lib/confined-spaces/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20;
const SM = 16;
const LG = 24;
const XL = 32;
const TTL = 44;

// ── Colours ──────────────────────────────────────────────────────────────────
const EBRORA = h.EBRORA_GREEN;
const ACCENT_DARK = '143D2B';
const RED_D = '991B1B';
const RED = 'DC2626';
const RED_BG = 'FEF2F2';
const AMBER_BG = 'FEF3C7';
const AMBER = 'D97706';
const GREEN_RAG = '059669';
const GREEN_BG = 'D1FAE5';
const GREY_RAG = '6B7280';
const GREY_BG = 'F3F4F6';
const ORANGE = '92400e';
const ORANGE_BG = 'FFFBEB';
const TEAL = '0f766e';
const TEAL_BG = 'f0fdfa';
const TEAL_DARK = '134e4a';
const ZEBRA = 'F5F5F5';

const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface (expanded for all 4 templates) ────────────────────────────
interface AdjacentSpace {
  space: string; connectionType: string; isolationMethod: string;
  gasMigrationRisk: string; status: string;
}
interface HistoricalReading {
  date: string; o2: string; h2s: string; lel: string; co: string;
  conditions: string; recordedBy: string;
}
interface Hazard {
  category: string; hazard: string; causeSource: string;
  severity: string; likelihood: string;
}
interface AtmoParam {
  parameter: string; alarmLevel: string; evacuateLevel: string;
  instrument: string; actionRequired: string;
}
interface Isolation {
  system: string; method: string; isolationPoint: string;
  verifiedBy: string; lockOff: string;
}
interface SimOp {
  activity: string; potentialImpact: string;
  controlMeasure: string; risk: string; acceptable: string;
}
interface EntryStep {
  step: string; action: string; responsibility: string; verification: string;
}
interface PpeItem {
  type: string; specification: string; standard: string;
  replacement: string; mandatory: string;
}
interface RescueStep {
  step: string; action: string; responsibility: string;
  timeTarget: string; equipment: string;
}
interface ExtractionStep {
  step: string; method: string; equipment: string; consideration: string;
}
interface MultiCasualtyScenario {
  scenario: string; action: string; limitation: string;
}
interface RescueEquipmentItem {
  equipment: string; specification: string; standard: string; location: string;
}
interface CommsCascadeItem {
  order: string; contact: string; nameRole: string; number: string; when: string;
}
interface PostIncidentStep {
  step: string; action: string; responsibility: string; notes: string;
}
interface EmergencyScenario {
  scenario: string; immediateAction: string;
  responsibility: string; escalation: string;
}
interface CompetencyRole {
  role: string; requiredTraining: string;
  evidence: string; refresher: string;
}
interface RegRef { reference: string; description: string; }

interface PreEntryCheckItem {
  item: string;
}

interface CSData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessedBy: string; projectName: string; siteAddress: string;
  // Space identification
  spaceName: string; spaceLocation: string; spaceType: string;
  dimensions: string; accessType: string; classification: string;
  reasonForEntry: string; entryAvoidable: string; loneWorking: string;
  // Adjacent spaces
  adjacentSpaces: AdjacentSpace[];
  // Hazards
  hazards: Hazard[];
  // Historical gas
  historicalReadings: HistoricalReading[];
  historicalAnalysis: string;
  // SSOW
  safeSystemOfWork: string;
  // Atmospheric monitoring
  atmosphericParams: AtmoParam[];
  preEntryTesting: string; continuousMonitoring: string; instrumentCalibration: string;
  // Ventilation
  ventilationType: string; ventilationSpec: string; preVentDuration: string;
  ventInletPosition: string; ventFailureAction: string;
  // Isolation
  isolations: Isolation[];
  // SIMOPS
  simops: SimOp[];
  // Entry/exit
  entrySteps: EntryStep[];
  // PPE
  ppeItems: PpeItem[];
  // Duration/heat stress
  maxContinuousWork: string; maxShiftDuration: string;
  hydration: string; heatStressIndicators: string; scbaWeightFactor: string;
  // Comms
  primaryComms: string; backupComms: string;
  checkInFrequency: string; emergencySignal: string;
  // Rescue plan
  rescueSteps: RescueStep[];
  rescueEquipmentLocation: string; nearestAE: string;
  rescueDrillFrequency: string;
  // 600mm extraction (rescue-focused)
  extractionSteps: ExtractionStep[];
  // Multiple casualty (rescue-focused)
  multiCasualtyScenarios: MultiCasualtyScenario[];
  // FRS pre-notification (rescue-focused)
  frsPreNotify: string; frsContact: string;
  frsInfoProvided: string; frsAccess: string;
  // Rescue equipment inventory
  rescueEquipment: RescueEquipmentItem[];
  // Comms cascade
  commsCascade: CommsCascadeItem[];
  // Hospital route
  hospitalName: string; hospitalDistance: string;
  hospitalGridRef: string; hospitalRoute: string;
  // Post-incident
  postIncidentSteps: PostIncidentStep[];
  // Emergency procedures
  emergencyScenarios: EmergencyScenario[];
  // Welfare/decon
  deconStation: string; deconProcedure: string;
  noEatingDrinking: string; leptospirosisAwareness: string;
  hepatitisA: string; welfareFacilities: string;
  // Risk rating
  riskBeforeL: number; riskBeforeS: number; riskBeforeScore: number; riskBeforeRating: string;
  riskAfterL: number; riskAfterS: number; riskAfterScore: number; riskAfterRating: string;
  riskNote: string;
  // Competency
  competencyRoles: CompetencyRole[];
  // Permit
  permitType: string; authorisationChain: string;
  maxOccupancy: string; permitCancellation: string;
  // Pre-entry checklist items (permit-style)
  preEntryChecklist: PreEntryCheckItem[];
  // Monitoring & review
  reviewDate2: string; reviewTriggers: string; linkedDocuments: string;
  // Reg refs
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): CSData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const rr = c.riskRating || {};
  return {
    documentRef: s(c.documentRef), assessmentDate: s(c.assessmentDate),
    reviewDate: s(c.reviewDate), assessedBy: s(c.assessedBy),
    projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    spaceName: s(c.spaceName || c.spaceIdentification?.name),
    spaceLocation: s(c.spaceLocation || c.spaceIdentification?.location),
    spaceType: s(c.spaceType || c.spaceIdentification?.type),
    dimensions: s(c.dimensions || c.spaceIdentification?.dimensions),
    accessType: s(c.accessType || c.spaceIdentification?.accessPoints),
    classification: s(c.classification || c.spaceIdentification?.classification),
    reasonForEntry: s(c.reasonForEntry), entryAvoidable: s(c.entryAvoidable, 'No'),
    loneWorking: s(c.loneWorking, 'Absolutely Prohibited — minimum 3 persons at all times'),
    adjacentSpaces: a(c.adjacentSpaces),
    hazards: a(c.hazards),
    historicalReadings: a(c.historicalReadings),
    historicalAnalysis: s(c.historicalAnalysis),
    safeSystemOfWork: s(c.safeSystemOfWork),
    atmosphericParams: a(c.atmosphericParams),
    preEntryTesting: s(c.preEntryTesting), continuousMonitoring: s(c.continuousMonitoring),
    instrumentCalibration: s(c.instrumentCalibration),
    ventilationType: s(c.ventilationType), ventilationSpec: s(c.ventilationSpec),
    preVentDuration: s(c.preVentDuration), ventInletPosition: s(c.ventInletPosition),
    ventFailureAction: s(c.ventFailureAction),
    isolations: a(c.isolations), simops: a(c.simops), entrySteps: a(c.entrySteps),
    ppeItems: a(c.ppeItems),
    maxContinuousWork: s(c.maxContinuousWork), maxShiftDuration: s(c.maxShiftDuration),
    hydration: s(c.hydration), heatStressIndicators: s(c.heatStressIndicators),
    scbaWeightFactor: s(c.scbaWeightFactor),
    primaryComms: s(c.primaryComms), backupComms: s(c.backupComms),
    checkInFrequency: s(c.checkInFrequency), emergencySignal: s(c.emergencySignal),
    rescueSteps: a(c.rescueSteps), rescueEquipmentLocation: s(c.rescueEquipmentLocation),
    nearestAE: s(c.nearestAE), rescueDrillFrequency: s(c.rescueDrillFrequency),
    extractionSteps: a(c.extractionSteps),
    multiCasualtyScenarios: a(c.multiCasualtyScenarios),
    frsPreNotify: s(c.frsPreNotify), frsContact: s(c.frsContact),
    frsInfoProvided: s(c.frsInfoProvided), frsAccess: s(c.frsAccess),
    rescueEquipment: a(c.rescueEquipment), commsCascade: a(c.commsCascade),
    hospitalName: s(c.hospitalName), hospitalDistance: s(c.hospitalDistance),
    hospitalGridRef: s(c.hospitalGridRef), hospitalRoute: s(c.hospitalRoute),
    postIncidentSteps: a(c.postIncidentSteps),
    emergencyScenarios: a(c.emergencyScenarios),
    deconStation: s(c.deconStation), deconProcedure: s(c.deconProcedure),
    noEatingDrinking: s(c.noEatingDrinking), leptospirosisAwareness: s(c.leptospirosisAwareness),
    hepatitisA: s(c.hepatitisA), welfareFacilities: s(c.welfareFacilities),
    riskBeforeL: rr.beforeLikelihood ?? 4, riskBeforeS: rr.beforeSeverity ?? 5,
    riskBeforeScore: rr.beforeScore ?? 20, riskBeforeRating: s(rr.beforeRating, 'High'),
    riskAfterL: rr.afterLikelihood ?? 2, riskAfterS: rr.afterSeverity ?? 5,
    riskAfterScore: rr.afterScore ?? 10, riskAfterRating: s(rr.afterRating, 'Medium'),
    riskNote: s(c.riskNote, 'Residual severity remains 5 (fatal) — atmospheric hazard consequences cannot be reduced, only likelihood is controlled. Consistent with L101 ACoP.'),
    competencyRoles: a(c.competencyRoles),
    permitType: s(c.permitType), authorisationChain: s(c.authorisationChain),
    maxOccupancy: s(c.maxOccupancy), permitCancellation: s(c.permitCancellation),
    preEntryChecklist: a(c.preEntryChecklist),
    reviewDate2: s(c.reviewDate2) || s(c.reviewDate),
    reviewTriggers: s(c.reviewTriggers), linkedDocuments: s(c.linkedDocuments),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'Confined Spaces Regulations 1997 (SI 1997/1713)', description: 'Primary legislation — identify, assess, control confined space risks' },
    { reference: 'HSE L101 ACoP (3rd Ed. 2014)', description: 'Safe work in confined spaces — Approved Code of Practice and guidance' },
    { reference: 'HSE INDG258 (Rev 3)', description: 'Confined spaces — brief guide to working safely' },
    { reference: 'EI15 (4th Ed. 2018)', description: 'Model code — confined space entry (wastewater sector reference)' },
    { reference: 'EH40/2005 (4th Ed. 2020)', description: 'Workplace Exposure Limits — H₂S, CO' },
    { reference: 'MHSW Regulations 1999', description: 'General risk assessment duty' },
    { reference: 'BS 7671:2018 + A2:2022', description: 'Electrical installations — relevant to isolation' },
    { reference: 'CDM 2015', description: 'Construction-phase health and safety management' },
  ];
}

// ── RAG ──────────────────────────────────────────────────────────────────────
function ragColours(status: string): { fill: string; text: string } {
  const r = (status || '').toLowerCase();
  if (r === 'high' || r === 'fatal' || r === 'no') return { fill: 'FEE2E2', text: RED };
  if (r === 'medium' || r === 'moderate' || r === 'partial' || r === 'serious') return { fill: AMBER_BG, text: AMBER };
  if (r === 'low' || r === 'yes' || r.includes('isolated') || r.includes('controlled') || r.includes('loto')) return { fill: GREEN_BG, text: GREEN_RAG };
  return { fill: GREY_BG, text: GREY_RAG };
}

function ragCell(text: string, width: number, fontSize = SM): TableCell {
  const c = ragColours(text);
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: c.fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: true, size: fontSize, font: 'Arial', color: c.text }),
    ] })],
  });
}

// ── Heading ──────────────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string, font = 'Arial', fontSize = LG): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: fontSize, font, color: accent })],
  });
}

function subHead(num: string, text: string, accent: string, font = 'Arial'): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: BODY, font, color: accent })],
  });
}

// ── Generic table helpers ────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string, font = 'Arial'): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE }),
    ] })],
  });
}

function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; font?: string; color?: string }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || SM + 2, font: opts?.font || 'Arial', color: opts?.color }),
    ] })],
  });
}

function infoRow(label: string, value: string, labelW: number, valueW: number, labelBg: string, labelColor: string): TableRow {
  return new TableRow({ children: [
    new TableCell({ width: { size: labelW, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: labelBg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: label, bold: true, size: SM + 2, font: 'Arial', color: labelColor })] })] }),
    new TableCell({ width: { size: valueW, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: value || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
  ] });
}

function infoTable(rows: Array<{ label: string; value: string }>, labelBg: string, labelColor: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => infoRow(r.label, r.value, lw, W - lw, labelBg, labelColor)) });
}

function dataTable(
  headers: Array<{ text: string; width: number }>,
  rows: Array<Array<{ text: string; bold?: boolean; rag?: boolean }>>,
  headerBg: string, zebraColor = ZEBRA, font = 'Arial',
): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, headerBg, font)) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => {
          if (cell.rag) return ragCell(cell.text, headers[ci].width);
          return txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zebraColor : h.WHITE, font });
        }),
      })),
    ],
  });
}

function signOff(roles: string[], bg: string, cols: Array<{ text: string; width: number }>): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.text, c.width, bg)) }),
    ...roles.map(role => new TableRow({
      height: { value: 600, rule: 'atLeast' as any },
      children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.width)),
    })),
  ] });
}

function dangerCallout(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 } },
    shading: { type: ShadingType.CLEAR, fill: RED_BG },
    children: [new TextRun({ text, bold: true, size: BODY, font: 'Arial', color: RED_D })],
  });
}

function rescueCallout(title: string, body: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 },
        top: { style: BorderStyle.SINGLE, size: 1, color: TEAL }, bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL },
        right: { style: BorderStyle.SINGLE, size: 1, color: TEAL } },
      shading: { type: ShadingType.CLEAR, fill: TEAL_BG },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: SM + 2, font: 'Arial', color: TEAL })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL },
        right: { style: BorderStyle.SINGLE, size: 1, color: TEAL } },
      shading: { type: ShadingType.CLEAR, fill: TEAL_BG },
      children: [new TextRun({ text: body, size: SM + 2, font: 'Arial', color: TEAL_DARK })],
    }),
  ];
}

function permitBox(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: ORANGE, space: 6 },
      top: { style: BorderStyle.SINGLE, size: 2, color: ORANGE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: ORANGE },
      right: { style: BorderStyle.SINGLE, size: 2, color: ORANGE } },
    shading: { type: ShadingType.CLEAR, fill: ORANGE_BG },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: SM + 2, font: 'Arial', color: ORANGE })],
  });
}

function checkboxRow(num: string, text: string, cw: number[]): TableRow {
  return new TableRow({ children: [
    txtCell(num, cw[0], { fontSize: SM }),
    txtCell(text, cw[1], { fontSize: SM }),
    new TableCell({ width: { size: cw[2], type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
        new TextRun({ text: '\u2610', size: BODY + 4, font: 'Arial' }),
      ] })] }),
    txtCell('', cw[3], { fontSize: SM }),
    txtCell('', cw[4], { fontSize: SM }),
  ] });
}

function emptyRow(cols: number[], count: number): TableRow[] {
  return Array.from({ length: count }, () => new TableRow({
    height: { value: 400, rule: 'atLeast' as any },
    children: cols.map(w => txtCell('', w)),
  }));
}

function footerLine(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This assessment must be reviewed at least every 6 months, before each entry campaign, and whenever space conditions or work methods change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (green, 22 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CSData): Document {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const adjCols = [Math.round(W*0.20), Math.round(W*0.20), Math.round(W*0.22), Math.round(W*0.20), W - Math.round(W*0.20)*2 - Math.round(W*0.22) - Math.round(W*0.20)];
  const hazCols = [Math.round(W*0.12), Math.round(W*0.24), Math.round(W*0.28), Math.round(W*0.16), W - Math.round(W*0.12) - Math.round(W*0.24) - Math.round(W*0.28) - Math.round(W*0.16)];
  const histCols = [Math.round(W*0.14), Math.round(W*0.10), Math.round(W*0.12), Math.round(W*0.10), Math.round(W*0.10), Math.round(W*0.28), W - Math.round(W*0.14) - Math.round(W*0.10) - Math.round(W*0.12) - Math.round(W*0.10) - Math.round(W*0.10) - Math.round(W*0.28)];
  const atmoCols = [Math.round(W*0.18), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.22), W - Math.round(W*0.18) - Math.round(W*0.14)*2 - Math.round(W*0.22)];
  const isoCols = [Math.round(W*0.18), Math.round(W*0.18), Math.round(W*0.26), Math.round(W*0.18), W - Math.round(W*0.18)*2 - Math.round(W*0.26) - Math.round(W*0.18)];
  const simCols = [Math.round(W*0.20), Math.round(W*0.22), Math.round(W*0.26), Math.round(W*0.14), W - Math.round(W*0.20) - Math.round(W*0.22) - Math.round(W*0.26) - Math.round(W*0.14)];
  const entryCols = [Math.round(W*0.06), Math.round(W*0.34), Math.round(W*0.28), W - Math.round(W*0.06) - Math.round(W*0.34) - Math.round(W*0.28)];
  const ppeCols = [Math.round(W*0.16), Math.round(W*0.28), Math.round(W*0.16), Math.round(W*0.20), W - Math.round(W*0.16) - Math.round(W*0.28) - Math.round(W*0.16) - Math.round(W*0.20)];
  const rescCols = [Math.round(W*0.06), Math.round(W*0.36), Math.round(W*0.22), W - Math.round(W*0.06) - Math.round(W*0.36) - Math.round(W*0.22)];
  const emerCols = [Math.round(W*0.20), Math.round(W*0.38), Math.round(W*0.18), W - Math.round(W*0.20) - Math.round(W*0.38) - Math.round(W*0.18)];
  const compCols = [Math.round(W*0.18), Math.round(W*0.30), Math.round(W*0.24), W - Math.round(W*0.18) - Math.round(W*0.30) - Math.round(W*0.24)];
  const refCols = [Math.round(W*0.38), W - Math.round(W*0.38)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Confined Space Assessment') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'CONFINED SPACE ASSESSMENT', bold: true, size: TTL, font: 'Arial', color: A })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Confined Spaces Regulations 1997 \u00B7 HSE L101 ACoP', size: BODY, font: 'Arial', color: h.GREY_DARK })] }),
          h.spacer(100),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.spaceName || 'CONFINED SPACE').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          h.spacer(100),
          infoTable([
            { label: 'Document Ref', value: d.documentRef }, { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate }, { label: 'Assessor', value: d.assessedBy },
            { label: 'Project', value: d.projectName }, { label: 'Location', value: d.siteAddress },
          ], LBG, LC),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Confined Space Assessment') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Space Identification & Classification', A),
          infoTable([
            { label: 'Space Name / ID', value: d.spaceName }, { label: 'Location', value: d.spaceLocation },
            { label: 'Space Type', value: d.spaceType }, { label: 'Dimensions', value: d.dimensions },
            { label: 'Access', value: d.accessType }, { label: 'Classification', value: d.classification },
            { label: 'Reason for Entry', value: d.reasonForEntry }, { label: 'Entry Avoidable?', value: d.entryAvoidable },
            { label: 'Lone Working', value: d.loneWorking },
          ], LBG, LC),

          secHead('2.0', 'Adjacent & Connected Spaces', A),
          dataTable(
            [{ text: 'Connected Space', width: adjCols[0] }, { text: 'Connection Type', width: adjCols[1] }, { text: 'Isolation Method', width: adjCols[2] }, { text: 'Gas Migration Risk', width: adjCols[3] }, { text: 'Status', width: adjCols[4] }],
            d.adjacentSpaces.map(as => [{ text: as.space }, { text: as.connectionType }, { text: as.isolationMethod }, { text: as.gasMigrationRisk, rag: true }, { text: as.status, rag: true }]),
            A),

          secHead('3.0', 'Hazard Identification', A),
          dataTable(
            [{ text: 'Category', width: hazCols[0] }, { text: 'Hazard', width: hazCols[1] }, { text: 'Cause / Source', width: hazCols[2] }, { text: 'Severity', width: hazCols[3] }, { text: 'Likelihood', width: hazCols[4] }],
            d.hazards.map(hz => [{ text: hz.category, bold: true }, { text: hz.hazard }, { text: hz.causeSource }, { text: hz.severity, rag: true }, { text: hz.likelihood, rag: true }]),
            A),

          secHead('4.0', 'Historical Gas Readings', A),
          dataTable(
            [{ text: 'Date', width: histCols[0] }, { text: 'O₂ (%)', width: histCols[1] }, { text: 'H₂S (ppm)', width: histCols[2] }, { text: 'LEL (%)', width: histCols[3] }, { text: 'CO (ppm)', width: histCols[4] }, { text: 'Conditions', width: histCols[5] }, { text: 'By', width: histCols[6] }],
            d.historicalReadings.map(hr => [{ text: hr.date }, { text: hr.o2 }, { text: hr.h2s }, { text: hr.lel }, { text: hr.co }, { text: hr.conditions }, { text: hr.recordedBy }]),
            A),
          ...(d.historicalAnalysis ? h.prose(d.historicalAnalysis, BODY) : []),

          secHead('5.0', 'Safe System of Work (Regulation 4)', A),
          ...h.prose(d.safeSystemOfWork, BODY),

          secHead('6.0', 'Atmospheric Monitoring', A),
          dataTable(
            [{ text: 'Parameter', width: atmoCols[0] }, { text: 'Alarm', width: atmoCols[1] }, { text: 'Evacuate', width: atmoCols[2] }, { text: 'Instrument', width: atmoCols[3] }, { text: 'Action Required', width: atmoCols[4] }],
            d.atmosphericParams.map(ap => [{ text: ap.parameter }, { text: ap.alarmLevel }, { text: ap.evacuateLevel }, { text: ap.instrument }, { text: ap.actionRequired }]),
            A),
          infoTable([
            { label: 'Pre-Entry Testing', value: d.preEntryTesting },
            { label: 'Continuous Monitoring', value: d.continuousMonitoring },
            { label: 'Instrument Calibration', value: d.instrumentCalibration },
          ], LBG, LC),

          secHead('7.0', 'Ventilation', A),
          infoTable([
            { label: 'Type', value: d.ventilationType }, { label: 'Specification', value: d.ventilationSpec },
            { label: 'Pre-Ventilation', value: d.preVentDuration }, { label: 'Inlet Position', value: d.ventInletPosition },
            { label: 'Failure Action', value: d.ventFailureAction },
          ], LBG, LC),

          secHead('8.0', 'Isolation Requirements', A),
          dataTable(
            [{ text: 'System', width: isoCols[0] }, { text: 'Method', width: isoCols[1] }, { text: 'Isolation Point', width: isoCols[2] }, { text: 'Verified By', width: isoCols[3] }, { text: 'Lock-Off?', width: isoCols[4] }],
            d.isolations.map(iso => [{ text: iso.system }, { text: iso.method }, { text: iso.isolationPoint }, { text: iso.verifiedBy }, { text: iso.lockOff, rag: true }]),
            A),

          secHead('9.0', 'SIMOPS — Simultaneous Operations', A),
          dataTable(
            [{ text: 'Activity', width: simCols[0] }, { text: 'Impact', width: simCols[1] }, { text: 'Control', width: simCols[2] }, { text: 'Risk', width: simCols[3] }, { text: 'Acceptable?', width: simCols[4] }],
            d.simops.map(si => [{ text: si.activity }, { text: si.potentialImpact }, { text: si.controlMeasure }, { text: si.risk, rag: true }, { text: si.acceptable, rag: true }]),
            A),

          secHead('10.0', 'Entry & Exit Procedures', A),
          dataTable(
            [{ text: '#', width: entryCols[0] }, { text: 'Step', width: entryCols[1] }, { text: 'Responsibility', width: entryCols[2] }, { text: 'Verification', width: entryCols[3] }],
            d.entrySteps.map((es, i) => [{ text: String(i + 1) }, { text: es.action }, { text: es.responsibility }, { text: es.verification }]),
            A),

          secHead('11.0', 'PPE & RPE Requirements', A),
          dataTable(
            [{ text: 'PPE Type', width: ppeCols[0] }, { text: 'Specification', width: ppeCols[1] }, { text: 'Standard', width: ppeCols[2] }, { text: 'Replacement', width: ppeCols[3] }, { text: 'Mandatory?', width: ppeCols[4] }],
            d.ppeItems.map(pp => [{ text: pp.type }, { text: pp.specification }, { text: pp.standard }, { text: pp.replacement }, { text: pp.mandatory, rag: true }]),
            A),

          secHead('12.0', 'Duration Limits & Heat Stress', A),
          infoTable([
            { label: 'Max Continuous Work', value: d.maxContinuousWork },
            { label: 'Max Shift Duration', value: d.maxShiftDuration },
            { label: 'Hydration', value: d.hydration },
            { label: 'Heat Stress Indicators', value: d.heatStressIndicators },
            { label: 'SCBA Weight Factor', value: d.scbaWeightFactor },
          ], LBG, LC),

          secHead('13.0', 'Communication Protocols', A),
          infoTable([
            { label: 'Primary', value: d.primaryComms }, { label: 'Backup', value: d.backupComms },
            { label: 'Check-In Frequency', value: d.checkInFrequency }, { label: 'Emergency Signal', value: d.emergencySignal },
          ], LBG, LC),

          secHead('14.0', 'Rescue Plan (Regulation 5)', A),
          dataTable(
            [{ text: '#', width: rescCols[0] }, { text: 'Rescue Action', width: rescCols[1] }, { text: 'Responsibility', width: rescCols[2] }, { text: 'Equipment / Notes', width: rescCols[3] }],
            d.rescueSteps.map((rs, i) => [{ text: String(i + 1) }, { text: rs.action }, { text: rs.responsibility }, { text: rs.equipment }]),
            A),
          infoTable([
            { label: 'Rescue Equipment Location', value: d.rescueEquipmentLocation },
            { label: 'Nearest A&E', value: d.nearestAE },
            { label: 'Rescue Drill Frequency', value: d.rescueDrillFrequency },
          ], LBG, LC),

          secHead('15.0', 'Emergency Procedures', A),
          dataTable(
            [{ text: 'Scenario', width: emerCols[0] }, { text: 'Immediate Action', width: emerCols[1] }, { text: 'Responsibility', width: emerCols[2] }, { text: 'Escalation', width: emerCols[3] }],
            d.emergencyScenarios.map(es => [{ text: es.scenario }, { text: es.immediateAction }, { text: es.responsibility }, { text: es.escalation }]),
            A),

          secHead('16.0', 'Welfare, Hygiene & Decontamination', A),
          infoTable([
            { label: 'Decon Station', value: d.deconStation }, { label: 'Procedure', value: d.deconProcedure },
            { label: 'No Eating/Drinking/Smoking', value: d.noEatingDrinking },
            { label: 'Leptospirosis Awareness', value: d.leptospirosisAwareness },
            { label: 'Hepatitis A', value: d.hepatitisA },
            { label: 'Welfare Facilities', value: d.welfareFacilities },
          ], LBG, LC),

          secHead('17.0', 'Risk Rating', A),
          dataTable(
            [{ text: 'Stage', width: Math.round(W*0.34) }, { text: 'L', width: Math.round(W*0.12) }, { text: 'S', width: Math.round(W*0.12) }, { text: 'Score', width: Math.round(W*0.12) }, { text: 'Rating', width: W - Math.round(W*0.34) - Math.round(W*0.12)*3 }],
            [
              [{ text: 'Before Controls' }, { text: String(d.riskBeforeL) }, { text: String(d.riskBeforeS) }, { text: String(d.riskBeforeScore) }, { text: d.riskBeforeRating, rag: true }],
              [{ text: 'After Controls (with full SSOW)' }, { text: String(d.riskAfterL) }, { text: String(d.riskAfterS) }, { text: String(d.riskAfterScore) }, { text: d.riskAfterRating, rag: true }],
            ], A),
          ...(d.riskNote ? h.prose(d.riskNote, SM + 2) : []),

          secHead('18.0', 'Competency & Training', A),
          dataTable(
            [{ text: 'Role', width: compCols[0] }, { text: 'Required Training', width: compCols[1] }, { text: 'Evidence', width: compCols[2] }, { text: 'Refresher', width: compCols[3] }],
            d.competencyRoles.map(cr => [{ text: cr.role }, { text: cr.requiredTraining }, { text: cr.evidence }, { text: cr.refresher }]),
            A),

          secHead('19.0', 'Permit / Authorisation', A),
          infoTable([
            { label: 'Permit Type', value: d.permitType }, { label: 'Authorisation', value: d.authorisationChain },
            { label: 'Max Occupancy', value: d.maxOccupancy }, { label: 'Cancellation', value: d.permitCancellation },
          ], LBG, LC),

          secHead('20.0', 'Monitoring & Review', A),
          infoTable([
            { label: 'Review Date', value: d.reviewDate2 }, { label: 'Review Triggers', value: d.reviewTriggers },
            { label: 'Linked Documents', value: d.linkedDocuments },
          ], LBG, LC),

          secHead('21.0', 'Regulatory References', A),
          dataTable(
            [{ text: 'Reference', width: refCols[0] }, { text: 'Description', width: refCols[1] }],
            d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]),
            A),

          secHead('22.0', 'Assessor Sign-Off', A),
          signOff(['Assessor', 'Responsible Person', 'Reviewed By'], A, [
            { text: 'Role', width: Math.round(W*0.22) }, { text: 'Name', width: Math.round(W*0.28) },
            { text: 'Signature', width: Math.round(W*0.25) }, { text: 'Date', width: W - Math.round(W*0.22) - Math.round(W*0.28) - Math.round(W*0.25) },
          ]),
          footerLine(),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — RED DANGER (17 sections, danger callouts)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CSData): Document {
  const A = RED_D; const LBG = RED_BG; const LC = RED_D; const ZB = 'FFF5F5';
  const hazCols = [Math.round(W*0.12), Math.round(W*0.22), Math.round(W*0.28), Math.round(W*0.16), W - Math.round(W*0.12) - Math.round(W*0.22) - Math.round(W*0.28) - Math.round(W*0.16)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Confined Space Assessment') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { after: 0 }, children: [new TextRun({ text: '\u26A0 CONFINED SPACE ASSESSMENT \u2014 IMMEDIATELY DANGEROUS TO LIFE', bold: true, size: SM, font: 'Arial', color: 'D0D0D0' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { after: 0 }, children: [new TextRun({ text: d.spaceName || 'Confined Space', bold: true, size: XL + 2, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { after: 80 }, children: [new TextRun({ text: 'Confined Spaces Regulations 1997 \u00B7 HSE L101 ACoP', size: BODY, font: 'Arial', color: 'E6E6E6' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '1a1a1a' }, spacing: { after: 60 }, children: [new TextRun({ text: `Ref: ${d.documentRef}   |   Assessed: ${d.assessmentDate}   |   Assessor: ${d.assessedBy}   |   Review: ${d.reviewDate}`, size: SM, font: 'Arial', color: 'e5e5e5' })] }),

        dangerCallout(`\u26A0 DANGER \u2014 THIS SPACE CAN KILL: ${d.hazards.find(hz => hz.category === 'Atmospheric')?.causeSource || 'Atmospheric hazards identified'}. Entry ONLY with valid permit, continuous monitoring, forced ventilation, and rescue standby. MINIMUM 3 PERSONS AT ALL TIMES. LONE WORKING IS ABSOLUTELY PROHIBITED.`),

        secHead('1.0', 'Space Classification', A),
        infoTable([
          { label: 'Space', value: `${d.spaceName} \u2014 ${d.dimensions} \u2014 ${d.accessType}` },
          { label: 'Classification', value: d.classification }, { label: 'Entry Avoidable?', value: d.entryAvoidable },
          { label: 'Lone Working', value: d.loneWorking },
        ], LBG, LC),

        secHead('2.0', 'What Can Kill You', A),
        dangerCallout(`\u26A0 ATMOSPHERIC HAZARDS \u2014 THE PRIMARY KILLER: ${d.hazards.filter(hz => hz.category === 'Atmospheric').map(hz => hz.hazard).join('. ')}. ${d.historicalAnalysis || ''}`),
        dataTable(
          [{ text: 'Category', width: hazCols[0] }, { text: 'Hazard', width: hazCols[1] }, { text: 'How It Kills', width: hazCols[2] }, { text: 'Severity', width: hazCols[3] }, { text: 'Likelihood', width: hazCols[4] }],
          d.hazards.map(hz => [{ text: hz.category, bold: true }, { text: hz.hazard }, { text: hz.causeSource }, { text: hz.severity, rag: true }, { text: hz.likelihood, rag: true }]),
          A, ZB),

        secHead('3.0', 'Historical Gas Readings', A),
        dataTable(
          [{ text: 'Date', width: Math.round(W*0.16) }, { text: 'O₂', width: Math.round(W*0.12) }, { text: 'H₂S', width: Math.round(W*0.12) }, { text: 'LEL', width: Math.round(W*0.12) }, { text: 'CO', width: Math.round(W*0.12) }, { text: 'Conditions', width: W - Math.round(W*0.16) - Math.round(W*0.12)*4 }],
          d.historicalReadings.map(hr => [{ text: hr.date }, { text: hr.o2 }, { text: hr.h2s }, { text: hr.lel }, { text: hr.co }, { text: hr.conditions }]),
          A, ZB),

        secHead('4.0', 'Adjacent Spaces & Gas Migration', A),
        dangerCallout(`\u26A0 GAS MIGRATION: This space shares pipework with connected spaces. H\u2082S can migrate through connected pipework even when valves are closed. ALL connected spaces must be isolated and locked before entry.`),
        dataTable(
          [{ text: 'Space', width: Math.round(W*0.22) }, { text: 'Connection', width: Math.round(W*0.22) }, { text: 'Isolation', width: Math.round(W*0.28) }, { text: 'Risk', width: W - Math.round(W*0.22)*2 - Math.round(W*0.28) }],
          d.adjacentSpaces.map(as => [{ text: as.space }, { text: as.connectionType }, { text: as.isolationMethod }, { text: as.gasMigrationRisk, rag: true }]),
          A, ZB),

        secHead('5.0', 'SIMOPS', A),
        dataTable(
          [{ text: 'Activity', width: Math.round(W*0.22) }, { text: 'Impact', width: Math.round(W*0.30) }, { text: 'Control', width: W - Math.round(W*0.22) - Math.round(W*0.30) }],
          d.simops.map(si => [{ text: si.activity }, { text: si.potentialImpact }, { text: si.controlMeasure }]),
          A, ZB),

        secHead('6.0', 'Monitoring & Controls', A),
        dataTable(
          [{ text: 'Parameter', width: Math.round(W*0.20) }, { text: 'Alarm', width: Math.round(W*0.20) }, { text: 'Evacuate', width: Math.round(W*0.20) }, { text: 'Instrument', width: W - Math.round(W*0.20)*3 }],
          d.atmosphericParams.map(ap => [{ text: ap.parameter }, { text: ap.alarmLevel }, { text: ap.evacuateLevel }, { text: ap.instrument }]),
          A, ZB),
        infoTable([
          { label: 'Ventilation', value: `${d.ventilationType}. ${d.ventilationSpec}. ${d.preVentDuration}.` },
          { label: 'Isolations', value: `${d.isolations.length} isolation points \u2014 all LOTO` },
          { label: 'Duration Limits', value: `${d.maxContinuousWork}. ${d.maxShiftDuration}.` },
        ], LBG, LC),

        secHead('7.0', 'PPE', A),
        dataTable(
          [{ text: 'PPE', width: Math.round(W*0.18) }, { text: 'Spec', width: Math.round(W*0.34) }, { text: 'Standard', width: Math.round(W*0.22) }, { text: 'Required?', width: W - Math.round(W*0.18) - Math.round(W*0.34) - Math.round(W*0.22) }],
          d.ppeItems.map(pp => [{ text: pp.type }, { text: pp.specification }, { text: pp.standard }, { text: pp.mandatory, rag: true }]),
          A, ZB),

        secHead('8.0', 'Rescue Plan', A),
        dangerCallout(`\u26A0 CRITICAL: Over 60% of UK confined space fatalities are would-be rescuers who entered without BA (L101 \u00A7129). Under NO circumstances shall anyone enter to attempt unaided rescue. Winch from surface first. Only trained rescue entrants with full SCBA may enter.`),
        dataTable(
          [{ text: '#', width: Math.round(W*0.06) }, { text: 'Action', width: Math.round(W*0.38) }, { text: 'Responsibility', width: Math.round(W*0.24) }, { text: 'Equipment', width: W - Math.round(W*0.06) - Math.round(W*0.38) - Math.round(W*0.24) }],
          d.rescueSteps.map((rs, i) => [{ text: String(i + 1) }, { text: rs.action }, { text: rs.responsibility }, { text: rs.equipment }]),
          A, ZB),
        infoTable([{ label: 'Nearest A&E', value: d.nearestAE }], LBG, LC),

        secHead('9.0', 'Welfare & Decontamination', A),
        dangerCallout(`\u26A0 LEPTOSPIROSIS: Weil's disease can be fatal. ALL entrants must decon on exit. No eating/drinking/smoking until decontaminated. Cuts must be cleaned, dressed, and recorded. Weil's card issued. Hep A vaccination recommended.`),
        infoTable([
          { label: 'Decon Station', value: d.deconStation }, { label: 'Procedure', value: d.deconProcedure },
          { label: 'Hydration', value: d.hydration },
        ], LBG, LC),

        secHead('10.0', 'Risk Rating', A),
        dataTable(
          [{ text: 'Stage', width: Math.round(W*0.34) }, { text: 'L', width: Math.round(W*0.12) }, { text: 'S', width: Math.round(W*0.12) }, { text: 'Score', width: Math.round(W*0.12) }, { text: 'Rating', width: W - Math.round(W*0.34) - Math.round(W*0.12)*3 }],
          [
            [{ text: 'Before Controls' }, { text: String(d.riskBeforeL) }, { text: String(d.riskBeforeS) }, { text: String(d.riskBeforeScore) }, { text: d.riskBeforeRating, rag: true }],
            [{ text: 'After Controls' }, { text: String(d.riskAfterL) }, { text: String(d.riskAfterS) }, { text: String(d.riskAfterScore) }, { text: d.riskAfterRating, rag: true }],
          ], A, ZB),

        secHead('11.0', 'Emergency Procedures', A),
        dataTable(
          [{ text: 'Scenario', width: Math.round(W*0.20) }, { text: 'Action', width: W - Math.round(W*0.20) }],
          d.emergencyScenarios.map(es => [{ text: es.scenario }, { text: es.immediateAction }]),
          A, ZB),

        secHead('12.0', 'Competency', A),
        dataTable(
          [{ text: 'Role', width: Math.round(W*0.20) }, { text: 'Training', width: Math.round(W*0.50) }, { text: 'Refresher', width: W - Math.round(W*0.20) - Math.round(W*0.50) }],
          d.competencyRoles.map(cr => [{ text: cr.role }, { text: cr.requiredTraining }, { text: cr.refresher }]),
          A, ZB),

        secHead('13.0', 'Comms & Permit', A),
        infoTable([
          { label: 'Primary Comms', value: `${d.primaryComms}. Check-in: ${d.checkInFrequency}. Missed = emergency.` },
          { label: 'Permit', value: `${d.permitType}. ${d.authorisationChain}. Max ${d.maxOccupancy} entrants.` },
        ], LBG, LC),

        secHead('14.0', 'Monitoring & Review', A),
        infoTable([
          { label: 'Review', value: `${d.reviewDate2}. Triggers: ${d.reviewTriggers}` },
          { label: 'Linked', value: d.linkedDocuments },
        ], LBG, LC),

        secHead('15.0', 'References', A),
        dataTable(
          [{ text: 'Reference', width: Math.round(W*0.38) }, { text: 'Description', width: W - Math.round(W*0.38) }],
          d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]),
          A, ZB),

        secHead('16.0', 'Sign-Off', A),
        signOff(['Assessor', 'Responsible Person'], A, [
          { text: 'Role', width: Math.round(W*0.22) }, { text: 'Name', width: Math.round(W*0.28) },
          { text: 'Signature', width: Math.round(W*0.25) }, { text: 'Date', width: W - Math.round(W*0.22) - Math.round(W*0.28) - Math.round(W*0.25) },
        ]),
        footerLine(),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — PERMIT STYLE (orange, checklist, auth chain, entry log)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CSData): Document {
  const A = ORANGE; const LBG = ORANGE_BG; const LC = ORANGE; const ZB = ORANGE_BG;
  const checkCols = [Math.round(W*0.06), Math.round(W*0.50), Math.round(W*0.12), Math.round(W*0.14), W - Math.round(W*0.06) - Math.round(W*0.50) - Math.round(W*0.12) - Math.round(W*0.14)];
  const gasCols = [Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), W - Math.round(W*0.14)*6];
  const reTestCols = [Math.round(W*0.12), Math.round(W*0.13), Math.round(W*0.13), Math.round(W*0.13), Math.round(W*0.13), Math.round(W*0.22), W - Math.round(W*0.12) - Math.round(W*0.13)*4 - Math.round(W*0.22)];
  const entryLogCols = [Math.round(W*0.22), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), Math.round(W*0.14), W - Math.round(W*0.22) - Math.round(W*0.14)*4];
  const authCols = [Math.round(W*0.18), Math.round(W*0.20), Math.round(W*0.18), Math.round(W*0.14), Math.round(W*0.12), W - Math.round(W*0.18) - Math.round(W*0.20) - Math.round(W*0.18) - Math.round(W*0.14) - Math.round(W*0.12)];
  const hbCols = [Math.round(W*0.22), Math.round(W*0.36), Math.round(W*0.20), W - Math.round(W*0.22) - Math.round(W*0.36) - Math.round(W*0.20)];

  const checklistItems = d.preEntryChecklist.length > 0 ? d.preEntryChecklist : [
    { item: 'All electrical isolations confirmed and LOTO applied' },
    { item: 'All mechanical/hydraulic isolations confirmed and locked' },
    { item: 'Adjacent space isolations confirmed' },
    { item: 'SIMOPS check — no conflicting adjacent operations' },
    { item: 'Tank/space drained — no standing liquid >150mm' },
    { item: 'Ventilation running minimum pre-vent duration' },
    { item: 'Gas test — O₂ within 19.5–23.5% at all depths' },
    { item: 'Gas test — H₂S <5ppm at all depths' },
    { item: 'Gas test — LEL <10% at all depths' },
    { item: 'Gas test — CO <20ppm at all depths' },
    { item: 'Rescue tripod erected and winch tested' },
    { item: 'Rescue SCBA available, cylinder pressure checked' },
    { item: 'Radio communication check (entrant ↔ standby)' },
    { item: 'FA kit + AED + O₂ set at surface' },
    { item: 'Decontamination station set up' },
    { item: 'All entrants in full PPE (harness, helmet, SCBA escape, gloves, coveralls, boots, goggles)' },
    { item: 'Standby person briefed and in position' },
    { item: 'Weather check — no adverse weather warning' },
    { item: 'Emergency services route confirmed' },
  ];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Confined Space Entry Permit & Assessment') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ORANGE }, spacing: { after: 0 }, children: [new TextRun({ text: 'CONFINED SPACE ENTRY PERMIT & ASSESSMENT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ORANGE }, spacing: { after: 80 }, children: [new TextRun({ text: 'Confined Spaces Regulations 1997 \u00B7 HSE L101 ACoP', size: BODY, font: 'Arial', color: 'D9D9D9' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '78350f' }, spacing: { after: 60 }, children: [new TextRun({ text: `Ref: ${d.documentRef}   Space: ${d.spaceName}   Date: ${d.assessmentDate}   Valid: 12 hours max   Min 3 persons`, size: SM, font: 'Arial', color: 'fef3c7' })] }),

        secHead('1.0', 'Space & Hazard Summary', A),
        infoTable([
          { label: 'Space', value: `${d.spaceName} \u2014 ${d.dimensions} \u2014 ${d.accessType}` },
          { label: 'Classification', value: d.classification },
          { label: 'Key Hazards', value: d.hazards.map(hz => hz.hazard).join(', ') },
          { label: 'Adjacent Spaces', value: d.adjacentSpaces.map(as => `${as.space} (${as.status})`).join(', ') || 'See assessment' },
          { label: 'SIMOPS', value: d.simops.map(si => `${si.activity}: ${si.controlMeasure}`).join('. ') || 'Assessed — no conflicts' },
          { label: 'Max Occupancy', value: d.maxOccupancy },
          { label: 'Duration Limits', value: d.maxContinuousWork },
        ], LBG, LC),

        secHead('2.0', 'Pre-Entry Checklist', A),
        permitBox('All items must be confirmed \u2611 before entry is authorised'),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('#', checkCols[0], A), hdrCell('Check Item', checkCols[1], A), hdrCell('\u2611', checkCols[2], A), hdrCell('By Whom', checkCols[3], A), hdrCell('Time', checkCols[4], A)] }),
          ...checklistItems.map((ci, i) => checkboxRow(String(i + 1), ci.item, checkCols)),
        ] }),

        secHead('3.0', 'Pre-Entry Gas Test Results', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Depth', gasCols[0], A), hdrCell('O₂ (%)', gasCols[1], A), hdrCell('H₂S (ppm)', gasCols[2], A), hdrCell('LEL (%)', gasCols[3], A), hdrCell('CO (ppm)', gasCols[4], A), hdrCell('Time', gasCols[5], A), hdrCell('Initials', gasCols[6], A)] }),
          ...['Top', 'Middle', 'Bottom'].map(depth => new TableRow({ children: [txtCell(depth, gasCols[0], { fontSize: SM }), ...gasCols.slice(1).map(w => txtCell('', w))] })),
        ] }),
        infoTable([
          { label: 'Instrument Serial No.', value: '' }, { label: 'Last Calibration', value: '' },
          { label: 'Bump Tested?', value: '\u2610 Yes   \u2610 No' },
        ], LBG, LC),

        secHead('4.0', 'Periodic Re-Test Log (Every 30 Minutes)', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Time', reTestCols[0], A), hdrCell('O₂ (%)', reTestCols[1], A), hdrCell('H₂S', reTestCols[2], A), hdrCell('LEL (%)', reTestCols[3], A), hdrCell('CO', reTestCols[4], A), hdrCell('Action', reTestCols[5], A), hdrCell('Initials', reTestCols[6], A)] }),
          ...emptyRow(reTestCols, 8),
        ] }),

        secHead('5.0', 'Personnel Entry / Exit Log', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Name', entryLogCols[0], A), hdrCell('Role', entryLogCols[1], A), hdrCell('Time In', entryLogCols[2], A), hdrCell('Time Out', entryLogCols[3], A), hdrCell('Duration', entryLogCols[4], A), hdrCell('Notes', entryLogCols[5], A)] }),
          ...emptyRow(entryLogCols, 6),
        ] }),

        secHead('6.0', 'Authorisation Chain', A),
        permitBox('Entry Authorisation — ALL roles must sign before entry proceeds'),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Role', authCols[0], A), hdrCell('Name', authCols[1], A), hdrCell('Signature', authCols[2], A), hdrCell('Date', authCols[3], A), hdrCell('Time', authCols[4], A), hdrCell('CSCS/ID', authCols[5], A)] }),
          ...['Responsible Person', 'Entrant 1', 'Entrant 2', 'Standby Person', 'Rescue Standby'].map(role =>
            new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: authCols.map((w, i) => txtCell(i === 0 ? role : '', w, { bold: i === 0 })) })),
        ] }),

        secHead('7.0', 'Rescue Plan Summary', A),
        dataTable(
          [{ text: '#', width: Math.round(W*0.06) }, { text: 'Action', width: W - Math.round(W*0.06) }],
          d.rescueSteps.map((rs, i) => [{ text: String(i + 1), bold: true }, { text: rs.action }]),
          A, ZB),
        infoTable([{ label: 'Nearest A&E', value: d.nearestAE }], LBG, LC),

        secHead('8.0', 'Permit Cancellation / Handback', A),
        permitBox('Complete this section when ALL entries are finished and space is cleared'),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Item', hbCols[0], A), hdrCell('Detail', hbCols[1], A), hdrCell('Confirmed By', hbCols[2], A), hdrCell('Time', hbCols[3], A)] }),
          ...['All personnel out — head count confirmed', 'Equipment recovered from space', 'Space secured — cover replaced, signage maintained', 'Isolations: \u2610 Maintained  \u2610 Removed', 'Decon completed — contaminated PPE disposed'].map((item, i) =>
            new TableRow({ children: [txtCell(item, hbCols[0] + hbCols[1], { fontSize: SM }), txtCell('', hbCols[2]), txtCell('', hbCols[3])] })),
        ] }),
        h.spacer(80),
        signOff(['Cancelled By'], A, [
          { text: 'Reason', width: Math.round(W*0.24) }, { text: 'Name', width: Math.round(W*0.22) },
          { text: 'Signature', width: Math.round(W*0.18) }, { text: 'Date', width: Math.round(W*0.16) },
          { text: 'Time', width: W - Math.round(W*0.24) - Math.round(W*0.22) - Math.round(W*0.18) - Math.round(W*0.16) },
        ]),

        secHead('9.0', 'References', A),
        dataTable(
          [{ text: 'Reference', width: Math.round(W*0.38) }, { text: 'Description', width: W - Math.round(W*0.38) }],
          d.regulatoryReferences.slice(0, 5).map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]),
          A, ZB),
        footerLine(),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — RESCUE FOCUSED (teal, expanded rescue plan)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CSData): Document {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL; const ZB = TEAL_BG;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Confined Space Assessment & Rescue Plan') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'CONFINED SPACE ASSESSMENT & RESCUE PLAN', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: 'Confined Spaces Regulations 1997 \u00B7 Regulation 5 \u2014 Rescue Arrangements', size: BODY, font: 'Arial', color: 'D9D9D9' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `Ref: ${d.documentRef}   Space: ${d.spaceName}   Date: ${d.assessmentDate}   Assessor: ${d.assessedBy}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }),

        // 1.0 Summary
        secHead('1.0', 'Space & Hazard Summary', A),
        infoTable([
          { label: 'Space', value: `${d.spaceName} \u2014 ${d.dimensions}, ${d.accessType}` },
          { label: 'Classification', value: d.classification },
          { label: 'Key Hazards', value: d.hazards.map(hz => hz.hazard).join(', ') },
          { label: 'Adjacent Spaces', value: d.adjacentSpaces.map(as => `${as.space} (${as.status})`).join(', ') || 'Assessed' },
          { label: 'Risk Rating', value: `Before: ${d.riskBeforeScore} (${d.riskBeforeRating}) \u2192 After SSOW: ${d.riskAfterScore} (${d.riskAfterRating})` },
          { label: 'Duration Limits', value: d.maxContinuousWork },
        ], LBG, LC),

        // 2.0 Controls summary
        secHead('2.0', 'Controls Summary', A),
        dataTable(
          [{ text: 'Parameter', width: Math.round(W*0.20) }, { text: 'Alarm', width: Math.round(W*0.20) }, { text: 'Evacuate', width: Math.round(W*0.20) }, { text: 'Action', width: W - Math.round(W*0.60) }],
          d.atmosphericParams.map(ap => [{ text: ap.parameter }, { text: ap.alarmLevel }, { text: ap.evacuateLevel }, { text: ap.actionRequired }]),
          A, ZB),
        infoTable([
          { label: 'Ventilation', value: `${d.ventilationType}. ${d.ventilationSpec}. ${d.preVentDuration}.` },
          { label: 'Isolations', value: `${d.isolations.length} LOTO points (electrical + mechanical + connected spaces)` },
          { label: 'PPE', value: d.ppeItems.map(pp => `${pp.type} (${pp.standard})`).join(', ') },
          { label: 'Comms', value: `${d.primaryComms}. ${d.checkInFrequency}.` },
        ], LBG, LC),

        // 3.0 RESCUE PLAN — the main event
        secHead('3.0', 'Rescue Plan (Regulation 5)', A),
        ...rescueCallout('This Section is the Primary Reference in an Emergency — Read Before Entry',
          'A copy of this rescue plan must be available at the access point at all times during entry. All personnel must read and understand it before entering or acting as standby.'),

        subHead('3.1', 'Rescue Procedure — Step by Step', A),
        dataTable(
          [{ text: '#', width: Math.round(W*0.05) }, { text: 'Action', width: Math.round(W*0.34) }, { text: 'Responsibility', width: Math.round(W*0.18) }, { text: 'Time', width: Math.round(W*0.13) }, { text: 'Equipment', width: W - Math.round(W*0.05) - Math.round(W*0.34) - Math.round(W*0.18) - Math.round(W*0.13) }],
          d.rescueSteps.map((rs, i) => [{ text: String(i + 1), bold: true }, { text: rs.action }, { text: rs.responsibility }, { text: rs.timeTarget }, { text: rs.equipment }]),
          A, ZB),

        subHead('3.2', 'Manhole Extraction Method', A),
        ...rescueCallout('Critical: Extracting an unconscious casualty through a restricted opening',
          'Vertical extraction required. Casualty must be positioned with arms above head. Spinal precaution assumed until cleared.'),
        dataTable(
          [{ text: '#', width: Math.round(W*0.06) }, { text: 'Method', width: Math.round(W*0.38) }, { text: 'Equipment', width: Math.round(W*0.28) }, { text: 'Consideration', width: W - Math.round(W*0.06) - Math.round(W*0.38) - Math.round(W*0.28) }],
          d.extractionSteps.map((es, i) => [{ text: String(i + 1) }, { text: es.method }, { text: es.equipment }, { text: es.consideration }]),
          A, ZB),

        subHead('3.3', 'Multiple Casualty Scenario', A),
        ...rescueCallout('Decision Tree: What if multiple entrants are incapacitated?', 'Sequential extraction only — single winch line. BA time limits critical.'),
        dataTable(
          [{ text: 'Scenario', width: Math.round(W*0.24) }, { text: 'Action', width: Math.round(W*0.38) }, { text: 'Limitation', width: W - Math.round(W*0.24) - Math.round(W*0.38) }],
          d.multiCasualtyScenarios.map(mc => [{ text: mc.scenario }, { text: mc.action }, { text: mc.limitation }]),
          A, ZB),

        subHead('3.4', 'Fire & Rescue Service Pre-Notification', A),
        infoTable([
          { label: 'Pre-Notify FRS?', value: d.frsPreNotify },
          { label: 'FRS Contact', value: d.frsContact },
          { label: 'Info Provided', value: d.frsInfoProvided },
          { label: 'FRS Access', value: d.frsAccess },
        ], LBG, LC),

        subHead('3.5', 'Rescue Equipment Inventory', A),
        dataTable(
          [{ text: 'Equipment', width: Math.round(W*0.24) }, { text: 'Specification', width: Math.round(W*0.22) }, { text: 'Standard', width: Math.round(W*0.16) }, { text: 'Location', width: Math.round(W*0.20) }, { text: 'Checked?', width: W - Math.round(W*0.24) - Math.round(W*0.22) - Math.round(W*0.16) - Math.round(W*0.20) }],
          d.rescueEquipment.map(re => [{ text: re.equipment }, { text: re.specification }, { text: re.standard }, { text: re.location }, { text: '\u2610' }]),
          A, ZB),

        subHead('3.6', 'Emergency Communication Cascade', A),
        dataTable(
          [{ text: 'Order', width: Math.round(W*0.08) }, { text: 'Contact', width: Math.round(W*0.22) }, { text: 'Name / Role', width: Math.round(W*0.24) }, { text: 'Number', width: Math.round(W*0.22) }, { text: 'When', width: W - Math.round(W*0.08) - Math.round(W*0.22) - Math.round(W*0.24) - Math.round(W*0.22) }],
          d.commsCascade.map(cc => [{ text: cc.order }, { text: cc.contact }, { text: cc.nameRole }, { text: cc.number, bold: true }, { text: cc.when }]),
          A, ZB),

        subHead('3.7', 'Hospital Route', A),
        infoTable([
          { label: 'Nearest A&E', value: d.hospitalName }, { label: 'Distance / Time', value: d.hospitalDistance },
          { label: 'Grid Reference', value: d.hospitalGridRef }, { label: 'Route', value: d.hospitalRoute },
        ], LBG, LC),

        subHead('3.8', 'Post-Incident Preservation', A),
        dataTable(
          [{ text: '#', width: Math.round(W*0.06) }, { text: 'Action', width: Math.round(W*0.40) }, { text: 'Responsibility', width: Math.round(W*0.24) }, { text: 'Notes', width: W - Math.round(W*0.06) - Math.round(W*0.40) - Math.round(W*0.24) }],
          d.postIncidentSteps.map((pi, i) => [{ text: String(i + 1) }, { text: pi.action }, { text: pi.responsibility }, { text: pi.notes }]),
          A, ZB),

        // 4.0 Rescue drill log
        secHead('4.0', 'Rescue Drill Log', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [
            hdrCell('Date', Math.round(W*0.16), A), hdrCell('Drill Type', Math.round(W*0.18), A),
            hdrCell('Led By', Math.round(W*0.18), A), hdrCell('Duration', Math.round(W*0.12), A),
            hdrCell('Issues / Lessons Learned', W - Math.round(W*0.16) - Math.round(W*0.18)*2 - Math.round(W*0.12), A),
          ] }),
          ...emptyRow([Math.round(W*0.16), Math.round(W*0.18), Math.round(W*0.18), Math.round(W*0.12), W - Math.round(W*0.16) - Math.round(W*0.18)*2 - Math.round(W*0.12)], 4),
        ] }),

        // 5.0 Welfare
        secHead('5.0', 'Welfare & Decontamination', A),
        infoTable([
          { label: 'Decon Station', value: d.deconStation }, { label: 'Procedure', value: d.deconProcedure },
          { label: 'Leptospirosis', value: d.leptospirosisAwareness },
          { label: 'No Eating/Drinking', value: d.noEatingDrinking },
        ], LBG, LC),

        // 6.0 Competency
        secHead('6.0', 'Competency', A),
        dataTable(
          [{ text: 'Role', width: Math.round(W*0.20) }, { text: 'Training', width: Math.round(W*0.50) }, { text: 'Refresher', width: W - Math.round(W*0.20) - Math.round(W*0.50) }],
          d.competencyRoles.map(cr => [{ text: cr.role }, { text: cr.requiredTraining }, { text: cr.refresher }]),
          A, ZB),

        // 7.0 References
        secHead('7.0', 'References', A),
        dataTable(
          [{ text: 'Reference', width: Math.round(W*0.38) }, { text: 'Description', width: W - Math.round(W*0.38) }],
          d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]),
          A, ZB),

        // 8.0 Sign-off
        secHead('8.0', 'Sign-Off', A),
        signOff(['Assessor', 'Responsible Person', 'Reviewed By'], A, [
          { text: 'Role', width: Math.round(W*0.22) }, { text: 'Name', width: Math.round(W*0.28) },
          { text: 'Signature', width: Math.round(W*0.25) }, { text: 'Date', width: W - Math.round(W*0.22) - Math.round(W*0.28) - Math.round(W*0.25) },
        ]),
        footerLine(),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildConfinedSpacesTemplateDocument(
  content: any,
  templateSlug: ConfinedSpacesTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard': return buildT1(d);
    case 'red-danger':      return buildT2(d);
    case 'permit-style':    return buildT3(d);
    case 'rescue-focused':  return buildT4(d);
    default:                return buildT1(d);
  }
}
