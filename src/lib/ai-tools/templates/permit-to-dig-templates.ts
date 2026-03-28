// =============================================================================
// Permit to Dig Builder — Multi-Template Engine
// 4 templates, all consuming the same Permit-to-Dig JSON structure.
//
// T1 — Ebrora Standard    (green, cover, comprehensive HSG47 permit)
// T2 — Daily Permit        (amber, compact shift card, one-shift validity)
// T3 — Utility Strike      (red, emergency strike response by service type)
// T4 — Avoidance Plan      (navy, site-wide strategy & PAS 128)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { PermitToDigTemplateSlug } from '@/lib/permit-to-dig/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const GREEN = '059669'; const GREEN_BG = 'D1FAE5';
const AMBER = '92400e'; const AMBER_BG = 'FFFBEB'; const AMBER_ACCENT = 'B45309';
const RED_D = '991B1B'; const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9'; const NAVY_ACCENT = '334155';
const BLUE = '2563EB'; const BLUE_BG = 'DBEAFE';
const PURPLE = '7C3AED'; const PURPLE_BG = 'F5F3FF';
const GREY = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Service type colour palette
const SVC = {
  gas:     { fill: 'FEF9C3', text: 'A16207', label: 'Gas' },
  electric:{ fill: 'FEE2E2', text: 'DC2626', label: 'Electric' },
  water:   { fill: 'DBEAFE', text: '2563EB', label: 'Water' },
  telecom: { fill: 'F3F4F6', text: '6B7280', label: 'Telecom' },
  sewer:   { fill: 'F5F3FF', text: '7C3AED', label: 'Sewer' },
} as const;

type ServiceType = keyof typeof SVC;

function svcColour(type: string): { fill: string; text: string } {
  const k = (type || '').toLowerCase().replace(/[^a-z]/g, '') as ServiceType;
  return SVC[k] || { fill: GREY_BG, text: GREY };
}

// ── Data Interface ───────────────────────────────────────────────────────────
interface StatSearch { provider: string; completed: boolean; date: string; reference: string; }
interface ServiceEntry { type: string; description: string; depth: string; horizontalDistance: string; verified: boolean; notes: string; }
interface CatGennyResult { location: string; serviceDetected: string; signalType: string; depth: string; action: string; }
interface HandDigZone { zone: string; services: string; radius: string; method: string; restrictions: string; }
interface PlantRestriction { plant: string; minimumDistance: string; condition: string; }
interface BackfillLayer { layer: string; material: string; compaction: string; thickness: string; }
interface StrikeAction { serviceType: string; immediateAction: string; evacuationDistance: string; emergencyNumber: string; doNot: string; }
interface NotificationContact { order: string; role: string; name: string; number: string; when: string; }
interface StrikeStep { step: string; action: string; responsibility: string; }
interface InvestigationItem { question: string; response: string; }
interface LessonLearned { finding: string; action: string; responsible: string; dueDate: string; }
interface ExcavationZone { zone: string; location: string; serviceDensity: string; servicesPresent: string; permitRequired: boolean; specialMeasures: string; }
interface CompetenceEntry { name: string; role: string; catCert: string; certExpiry: string; lastAssessed: string; }
interface AuditItem { item: string; frequency: string; responsibility: string; record: string; }
interface ChecklistItem { item: string; checked: boolean; }
interface PersonnelEntry { name: string; role: string; employer: string; signOn: string; signOff: string; }
interface RegRef { reference: string; description: string; }
interface SignOffEntry { role: string; name: string; }

interface PermitToDigData {
  documentRef: string; issueDate: string; reviewDate: string;
  preparedBy: string; projectName: string; siteAddress: string;
  gridRef: string; what3Words: string;
  principalContractor: string; client: string;
  // Excavation details
  excavationType: string; location: string; maxDepth: string;
  maxLength: string; maxWidth: string; startDate: string; endDate: string;
  groundConditions: string; nearStructures: string; previousExcavations: string;
  // Statutory searches
  statSearches: StatSearch[];
  // Services
  servicesIdentified: ServiceEntry[];
  // CAT & Genny
  catOperator: string; catModel: string; catCalDate: string;
  gennyModel: string; gennyCalDate: string;
  catResults: CatGennyResult[];
  // Hand-dig zones
  handDigZones: HandDigZone[];
  // Method statement
  safeDig: string[];
  plantRestrictions: PlantRestriction[];
  // Backfill
  backfillLayers: BackfillLayer[];
  reinstatementSpec: string;
  // Emergency strike
  strikeActions: StrikeAction[];
  notificationCascade: NotificationContact[];
  strikeSteps: StrikeStep[];
  // Investigation (T3)
  investigationItems: InvestigationItem[];
  riddorAssessment: string;
  lessonsLearned: LessonLearned[];
  scenePreservation: string;
  // Avoidance plan (T4)
  avoidanceStatement: string;
  pas128Classification: string;
  excavationZones: ExcavationZone[];
  safeDigRules: string[];
  competenceRegister: CompetenceEntry[];
  permitProcedure: string[];
  auditItems: AuditItem[];
  // Daily permit (T2)
  shiftDate: string; shiftTime: string; weatherConditions: string;
  groundConditionsToday: string;
  preDigChecklist: ChecklistItem[];
  personnelOnPermit: PersonnelEntry[];
  servicesInAreaToday: string;
  // Supervision
  permitIssuer: string; permitIssuerRole: string;
  permitValidity: string; extensionProcedure: string;
  // Regulatory refs
  regulatoryReferences: RegRef[];
  // Sign-off
  signOffRoles: SignOffEntry[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): PermitToDigData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), issueDate: s(c.issueDate), reviewDate: s(c.reviewDate),
    preparedBy: s(c.preparedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    gridRef: s(c.gridRef), what3Words: s(c.what3Words),
    principalContractor: s(c.principalContractor), client: s(c.client),
    excavationType: s(c.excavationType), location: s(c.location), maxDepth: s(c.maxDepth),
    maxLength: s(c.maxLength), maxWidth: s(c.maxWidth), startDate: s(c.startDate), endDate: s(c.endDate),
    groundConditions: s(c.groundConditions), nearStructures: s(c.nearStructures), previousExcavations: s(c.previousExcavations),
    statSearches: a(c.statSearches).length > 0 ? a(c.statSearches) : defaultSearches(),
    servicesIdentified: a(c.servicesIdentified),
    catOperator: s(c.catOperator), catModel: s(c.catModel), catCalDate: s(c.catCalDate),
    gennyModel: s(c.gennyModel), gennyCalDate: s(c.gennyCalDate),
    catResults: a(c.catResults),
    handDigZones: a(c.handDigZones),
    safeDig: a(c.safeDig).length > 0 ? a(c.safeDig) : defaultSafeDig(),
    plantRestrictions: a(c.plantRestrictions),
    backfillLayers: a(c.backfillLayers),
    reinstatementSpec: s(c.reinstatementSpec),
    strikeActions: a(c.strikeActions).length > 0 ? a(c.strikeActions) : defaultStrikeActions(),
    notificationCascade: a(c.notificationCascade),
    strikeSteps: a(c.strikeSteps).length > 0 ? a(c.strikeSteps) : defaultStrikeSteps(),
    investigationItems: a(c.investigationItems),
    riddorAssessment: s(c.riddorAssessment),
    lessonsLearned: a(c.lessonsLearned),
    scenePreservation: s(c.scenePreservation),
    avoidanceStatement: s(c.avoidanceStatement),
    pas128Classification: s(c.pas128Classification),
    excavationZones: a(c.excavationZones),
    safeDigRules: a(c.safeDigRules).length > 0 ? a(c.safeDigRules) : defaultSafeDig(),
    competenceRegister: a(c.competenceRegister),
    permitProcedure: a(c.permitProcedure),
    auditItems: a(c.auditItems),
    shiftDate: s(c.shiftDate), shiftTime: s(c.shiftTime), weatherConditions: s(c.weatherConditions),
    groundConditionsToday: s(c.groundConditionsToday),
    preDigChecklist: a(c.preDigChecklist).length > 0 ? a(c.preDigChecklist) : defaultChecklist(),
    personnelOnPermit: a(c.personnelOnPermit),
    servicesInAreaToday: s(c.servicesInAreaToday),
    permitIssuer: s(c.permitIssuer), permitIssuerRole: s(c.permitIssuerRole),
    permitValidity: s(c.permitValidity), extensionProcedure: s(c.extensionProcedure),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    signOffRoles: a(c.signOffRoles),
    additionalNotes: s(c.additionalNotes),
  };
}

// ── Defaults ─────────────────────────────────────────────────────────────────
function defaultSearches(): StatSearch[] {
  return [
    { provider: 'National Grid (Gas)', completed: false, date: '', reference: '' },
    { provider: 'Electricity DNO', completed: false, date: '', reference: '' },
    { provider: 'Water Authority', completed: false, date: '', reference: '' },
    { provider: 'BT / Openreach', completed: false, date: '', reference: '' },
    { provider: 'Local Authority (Sewers)', completed: false, date: '', reference: '' },
  ];
}
function defaultSafeDig(): string[] {
  return [
    'All services to be located by CAT & Genny scan before excavation commences',
    'Hand dig within 500 mm of any detected or known service (HSG47)',
    'No mechanical excavation within 500 mm of known services without written authorisation',
    'Trial holes by hand to confirm service depth and position before main excavation',
    'All exposed services to be supported and protected from damage',
    'Excavation edges to be kept clear of spoil — minimum 1 m from edge',
  ];
}
function defaultStrikeActions(): StrikeAction[] {
  return [
    { serviceType: 'Gas', immediateAction: 'Evacuate minimum 50 m upwind. No ignition sources. Do NOT attempt to stop leak.', evacuationDistance: '50 m', emergencyNumber: '0800 111 999', doNot: 'Do NOT use phones within 50 m. Do NOT switch electrics on or off.' },
    { serviceType: 'Electric', immediateAction: 'Stand clear minimum 5 m. Assume ALL cables are live. Do NOT touch cable or anything in contact with it.', evacuationDistance: '5 m', emergencyNumber: '105', doNot: 'Do NOT attempt to move the cable. Do NOT touch anyone in contact with the cable.' },
    { serviceType: 'Water', immediateAction: 'Isolate supply if safe to do so. Prevent water entering excavation. Support trench sides.', evacuationDistance: 'As required', emergencyNumber: 'Water authority emergency', doNot: 'Do NOT continue excavation in flooded trench.' },
    { serviceType: 'Telecom', immediateAction: 'Stop work immediately. Report to supervisor. Mark location.', evacuationDistance: 'N/A', emergencyNumber: '0800 023 2023', doNot: 'Do NOT attempt repair. Do NOT disturb fibre optic cables.' },
  ];
}
function defaultStrikeSteps(): StrikeStep[] {
  return [
    { step: '1', action: 'STOP all work immediately in the affected area', responsibility: 'All operatives' },
    { step: '2', action: 'Evacuate to safe distance per service type', responsibility: 'Supervisor' },
    { step: '3', action: 'Call emergency service number for the utility struck', responsibility: 'Supervisor' },
    { step: '4', action: 'Notify Site Manager and Principal Contractor', responsibility: 'Supervisor' },
    { step: '5', action: 'Cordon off area and post warning signage', responsibility: 'Supervisor' },
    { step: '6', action: 'Await utility company arrival — do NOT attempt repair', responsibility: 'All operatives' },
    { step: '7', action: 'Complete utility strike report form', responsibility: 'Site Manager' },
    { step: '8', action: 'Conduct investigation and briefing before work restarts', responsibility: 'Site Manager' },
  ];
}
function defaultChecklist(): ChecklistItem[] {
  return [
    { item: 'Statutory utility searches obtained and reviewed', checked: false },
    { item: 'CAT & Genny scan completed by competent operator', checked: false },
    { item: 'Services marked on ground with paint/markers', checked: false },
    { item: 'Hand-dig zones clearly identified', checked: false },
    { item: 'Trial holes completed to confirm service positions', checked: false },
    { item: 'Exclusion zone established around services', checked: false },
    { item: 'Edge protection / barriers in place', checked: false },
    { item: 'Spoil positioned minimum 1 m from excavation edge', checked: false },
    { item: 'Emergency strike procedure briefed to all operatives', checked: false },
    { item: 'Emergency contact numbers displayed at excavation', checked: false },
  ];
}
function defaultRefs(): RegRef[] {
  return [
    { reference: 'HSG47 — Avoiding Danger from Underground Services', description: 'HSE guidance on safe digging and service avoidance' },
    { reference: 'PAS 128:2022', description: 'Specification for underground utility detection, verification and location' },
    { reference: 'NJUG Volume 4', description: 'Guidelines on the positioning and colour coding of utilities' },
    { reference: 'CDM 2015 Regulation 13', description: 'Duties of the principal contractor — safe excavation planning' },
    { reference: 'NRSWA 1991', description: 'New Roads and Street Works Act — streetworks notification' },
    { reference: 'EAW Regulations 1989', description: 'Electricity at Work Regulations — cable avoidance' },
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
function svcCell(text: string, width: number, type: string): TableCell {
  const c = svcColour(type);
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: c.fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: c.text })] })] });
}
function infoRow(l: string, v: string, lw: number, vw: number, lbg: string, lc: string): TableRow {
  return new TableRow({ children: [
    new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l, bold: true, size: SM + 2, font: 'Arial', color: lc })] })] }),
    new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
  ] });
}
function infoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => infoRow(r.label, r.value, lw, W - lw, lbg, lc)) });
}
function dataTable(headers: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean }>>, headerBg: string, zb = ZEBRA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, headerBg)) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zb : h.WHITE })) })),
  ] });
}
function signOff(roles: string[], bg: string): Table {
  const cols = [{ t: 'Role', w: Math.round(W * 0.22) }, { t: 'Name', w: Math.round(W * 0.28) }, { t: 'Signature', w: Math.round(W * 0.25) }, { t: 'Date', w: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) }];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.t, c.w, bg)) }),
    ...roles.map(role => new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.w)) })),
  ] });
}
function footerLine(text: string): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text, size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] });
}
function densityCell(text: string, width: number): TableCell {
  const dl = (text || '').toLowerCase();
  const fill = dl === 'high' ? RED_BG : dl === 'medium' ? AMBER_BG : dl === 'low' ? GREEN_BG : GREY_BG;
  const colour = dl === 'high' ? RED_D : dl === 'medium' ? AMBER_ACCENT : dl === 'low' ? GREEN : GREY;
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: colour })] })] });
}
function checkCell(checked: boolean, width: number): TableCell {
  const fill = checked ? GREEN_BG : RED_BG;
  const colour = checked ? GREEN : RED_D;
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: checked ? '\u2713 YES' : '\u2717 NO', bold: true, size: SM, font: 'Arial', color: colour })] })] });
}
function warningBanner(text: string, bg: string, colour: string): Paragraph {
  return new Paragraph({ shading: { type: ShadingType.CLEAR, fill: bg }, spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `\u26A0  ${text}  \u26A0`, bold: true, size: XL, font: 'Arial', color: colour })] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green, comprehensive HSG47 permit)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: PermitToDigData): Document {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const searchCols = [Math.round(W * 0.30), Math.round(W * 0.12), Math.round(W * 0.20), W - Math.round(W * 0.30) - Math.round(W * 0.12) - Math.round(W * 0.20)];
  const svcCols = [Math.round(W * 0.12), Math.round(W * 0.24), Math.round(W * 0.12), Math.round(W * 0.14), Math.round(W * 0.10), W - Math.round(W * 0.12) - Math.round(W * 0.24) - Math.round(W * 0.12) - Math.round(W * 0.14) - Math.round(W * 0.10)];
  const catCols = [Math.round(W * 0.18), Math.round(W * 0.22), Math.round(W * 0.16), Math.round(W * 0.14), W - Math.round(W * 0.18) - Math.round(W * 0.22) - Math.round(W * 0.16) - Math.round(W * 0.14)];
  const hdCols = [Math.round(W * 0.14), Math.round(W * 0.22), Math.round(W * 0.14), Math.round(W * 0.22), W - Math.round(W * 0.14) - Math.round(W * 0.22) - Math.round(W * 0.14) - Math.round(W * 0.22)];
  const plantCols = [Math.round(W * 0.28), Math.round(W * 0.28), W - Math.round(W * 0.28) * 2];
  const backCols = [Math.round(W * 0.16), Math.round(W * 0.30), Math.round(W * 0.24), W - Math.round(W * 0.16) - Math.round(W * 0.30) - Math.round(W * 0.24)];
  const strikeCols = [Math.round(W * 0.12), Math.round(W * 0.36), Math.round(W * 0.14), Math.round(W * 0.16), W - Math.round(W * 0.12) - Math.round(W * 0.36) - Math.round(W * 0.14) - Math.round(W * 0.16)];
  const refCols = [Math.round(W * 0.38), W - Math.round(W * 0.38)];

  // Service rows — colour-coded by type
  const serviceRows = d.servicesIdentified.map((sv, ri) => new TableRow({ children: [
    svcCell(sv.type, svcCols[0], sv.type),
    txtCell(sv.description, svcCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    txtCell(sv.depth, svcCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    txtCell(sv.horizontalDistance, svcCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    checkCell(sv.verified, svcCols[4]),
    txtCell(sv.notes, svcCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
  ] }));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Permit to Dig') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'PERMIT TO DIG', bold: true, size: TTL, font: 'Arial', color: A })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'HSG47 \u00B7 PAS 128 \u00B7 NJUG \u00B7 CDM 2015', size: BODY, font: 'Arial', color: h.GREY_DARK })] }),
          h.spacer(100),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          h.spacer(100),
          infoTable([
            { label: 'Document Ref', value: d.documentRef }, { label: 'Issue Date', value: d.issueDate },
            { label: 'Review Date', value: d.reviewDate }, { label: 'Prepared By', value: d.preparedBy },
            { label: 'Client', value: d.client }, { label: 'Site Address', value: d.siteAddress },
            { label: 'Grid Ref', value: d.gridRef }, { label: 'what3words', value: d.what3Words },
          ], LBG, LC),
        ] },
      // Content pages
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Permit to Dig') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Excavation Details', A),
          infoTable([
            { label: 'Excavation Type', value: d.excavationType }, { label: 'Location', value: d.location },
            { label: 'Max Depth', value: d.maxDepth }, { label: 'Max Length', value: d.maxLength },
            { label: 'Max Width', value: d.maxWidth }, { label: 'Start Date', value: d.startDate },
            { label: 'End Date', value: d.endDate }, { label: 'Ground Conditions', value: d.groundConditions },
            { label: 'Near Structures', value: d.nearStructures }, { label: 'Previous Excavations', value: d.previousExcavations },
          ], LBG, LC),

          secHead('2.0', 'Statutory Records Search', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Provider', searchCols[0], A), hdrCell('Done', searchCols[1], A), hdrCell('Date', searchCols[2], A), hdrCell('Reference', searchCols[3], A)] }),
            ...d.statSearches.map((ss, ri) => new TableRow({ children: [
              txtCell(ss.provider, searchCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(ss.completed, searchCols[1]),
              txtCell(ss.date, searchCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(ss.reference, searchCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('3.0', 'Services Identified', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Type', svcCols[0], A), hdrCell('Description', svcCols[1], A), hdrCell('Depth', svcCols[2], A), hdrCell('H. Dist.', svcCols[3], A), hdrCell('Verified', svcCols[4], A), hdrCell('Notes', svcCols[5], A)] }),
            ...serviceRows,
          ] }),

          secHead('4.0', 'CAT & Genny Scan Results', A),
          infoTable([
            { label: 'CAT Operator', value: d.catOperator }, { label: 'CAT Model', value: d.catModel },
            { label: 'CAT Cal. Date', value: d.catCalDate }, { label: 'Genny Model', value: d.gennyModel },
            { label: 'Genny Cal. Date', value: d.gennyCalDate },
          ], LBG, LC),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Location', catCols[0], A), hdrCell('Service Detected', catCols[1], A), hdrCell('Signal', catCols[2], A), hdrCell('Depth', catCols[3], A), hdrCell('Action', catCols[4], A)] }),
            ...d.catResults.map((cr, ri) => new TableRow({ children: [
              txtCell(cr.location, catCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.serviceDetected, catCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.signalType, catCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.depth, catCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.action, catCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('5.0', 'Hand-Dig Zones (500 mm per HSG47)', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Zone', hdCols[0], A), hdrCell('Services', hdCols[1], A), hdrCell('Radius', hdCols[2], A), hdrCell('Method', hdCols[3], A), hdrCell('Restrictions', hdCols[4], A)] }),
            ...d.handDigZones.map((hz, ri) => new TableRow({ children: [
              txtCell(hz.zone, hdCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(hz.services, hdCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(hz.radius, hdCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(hz.method, hdCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(hz.restrictions, hdCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('6.0', 'Safe Digging Method Statement', A),
          ...d.safeDig.map((rule, i) => new Paragraph({ spacing: { after: 60 }, indent: { left: 360 },
            children: [new TextRun({ text: `${i + 1}. ${rule}`, size: SM + 2, font: 'Arial' })] })),

          secHead('7.0', 'Plant Restrictions Near Services', A),
          dataTable(
            [{ text: 'Plant / Equipment', width: plantCols[0] }, { text: 'Min Distance', width: plantCols[1] }, { text: 'Condition', width: plantCols[2] }],
            d.plantRestrictions.map(pr => [{ text: pr.plant }, { text: pr.minimumDistance }, { text: pr.condition }]),
            A),

          secHead('8.0', 'Backfill & Reinstatement', A),
          dataTable(
            [{ text: 'Layer', width: backCols[0] }, { text: 'Material', width: backCols[1] }, { text: 'Compaction', width: backCols[2] }, { text: 'Thickness', width: backCols[3] }],
            d.backfillLayers.map(bl => [{ text: bl.layer }, { text: bl.material }, { text: bl.compaction }, { text: bl.thickness }]),
            A),
          ...(d.reinstatementSpec ? [new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: 360 },
            children: [new TextRun({ text: `Reinstatement Specification: ${d.reinstatementSpec}`, size: SM + 2, font: 'Arial', italics: true })] })] : []),

          secHead('9.0', 'Emergency Strike Procedures', A),
          warningBanner('IF YOU STRIKE A SERVICE \u2014 STOP WORK IMMEDIATELY', RED_BG, RED_D),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Service', strikeCols[0], RED_D), hdrCell('Immediate Action', strikeCols[1], RED_D), hdrCell('Evacuate', strikeCols[2], RED_D), hdrCell('Call', strikeCols[3], RED_D), hdrCell('DO NOT', strikeCols[4], RED_D)] }),
            ...d.strikeActions.map(sa => new TableRow({ children: [
              svcCell(sa.serviceType, strikeCols[0], sa.serviceType),
              txtCell(sa.immediateAction, strikeCols[1]),
              txtCell(sa.evacuationDistance, strikeCols[2], { bold: true, color: RED_D }),
              txtCell(sa.emergencyNumber, strikeCols[3], { bold: true }),
              txtCell(sa.doNot, strikeCols[4], { color: RED_D }),
            ] })),
          ] }),

          secHead('10.0', 'Supervision & Permit Validity', A),
          infoTable([
            { label: 'Permit Issuer', value: `${d.permitIssuer} (${d.permitIssuerRole})` },
            { label: 'Permit Validity', value: d.permitValidity },
            { label: 'Extension Procedure', value: d.extensionProcedure },
          ], LBG, LC),

          secHead('11.0', 'Regulatory References', A),
          dataTable([{ text: 'Reference', width: refCols[0] }, { text: 'Description', width: refCols[1] }],
            d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A),

          secHead('12.0', 'Sign-Off', A),
          signOff(d.signOffRoles.length > 0 ? d.signOffRoles.map(r => r.role) : ['Permit Issuer', 'Site Manager', 'Excavation Supervisor', 'CAT Operator', 'Client Representative'], A),
          footerLine('This permit must be reviewed before each shift and reissued if excavation conditions change. Valid as per permit validity stated above.'),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — DAILY PERMIT (Amber, compact shift card, one-shift validity)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: PermitToDigData): Document {
  const A = AMBER; const LBG = AMBER_BG; const LC = AMBER_ACCENT;
  const checkCols = [Math.round(W * 0.80), W - Math.round(W * 0.80)];
  const persCols = [Math.round(W * 0.24), Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.18), W - Math.round(W * 0.24) - Math.round(W * 0.20) * 2 - Math.round(W * 0.18)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Daily Permit to Dig') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER }, spacing: { after: 0 }, children: [new TextRun({ text: 'DAILY PERMIT TO DIG \u2014 ONE SHIFT ONLY', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'D9D9D9' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_ACCENT }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.shiftDate || d.issueDate}   |   Shift: ${d.shiftTime || 'Day Shift'}   |   Issued by: ${d.permitIssuer || d.preparedBy}`, size: SM, font: 'Arial', color: 'FEF3C7' })] }),

        warningBanner('THIS PERMIT IS VALID FOR ONE SHIFT ONLY', AMBER_BG, AMBER_ACCENT),

        secHead('1.0', 'Site & Excavation', A),
        infoTable([
          { label: 'Location', value: d.location || d.siteAddress },
          { label: 'Excavation Type', value: d.excavationType },
          { label: 'Max Depth', value: d.maxDepth },
          { label: 'Weather', value: d.weatherConditions },
          { label: 'Ground Conditions', value: d.groundConditionsToday || d.groundConditions },
        ], LBG, LC),

        secHead('2.0', 'Pre-Dig Checklist (10 Items)', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Item', checkCols[0], A), hdrCell('Done', checkCols[1], A)] }),
          ...d.preDigChecklist.map((ci, ri) => new TableRow({ children: [
            txtCell(ci.item, checkCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            checkCell(ci.checked, checkCols[1]),
          ] })),
        ] }),

        secHead('3.0', 'Services in Area Today', A),
        new Paragraph({ spacing: { after: 120 }, indent: { left: 360 },
          children: [new TextRun({ text: d.servicesInAreaToday || 'As identified on permit drawings and CAT scan — see marked positions on ground.', size: SM + 2, font: 'Arial' })] }),

        secHead('4.0', 'Personnel on Permit', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Name', persCols[0], A), hdrCell('Role', persCols[1], A), hdrCell('Employer', persCols[2], A), hdrCell('Sign On', persCols[3], A), hdrCell('Sign Off', persCols[4], A)] }),
          ...d.personnelOnPermit.map((pe, ri) => new TableRow({ children: [
            txtCell(pe.name, persCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(pe.role, persCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(pe.employer, persCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(pe.signOn, persCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(pe.signOff, persCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          ] })),
          ...(d.personnelOnPermit.length < 6 ? Array.from({ length: 6 - d.personnelOnPermit.length }, (_, ri) =>
            new TableRow({ height: { value: 500, rule: 'atLeast' as any }, children: persCols.map(pw => txtCell('', pw, { bg: (d.personnelOnPermit.length + ri) % 2 === 0 ? ZEBRA : h.WHITE })) })
          ) : []),
        ] }),

        warningBanner('IF YOU STRIKE A SERVICE \u2014 STOP WORK IMMEDIATELY', RED_BG, RED_D),
        ...d.strikeActions.slice(0, 4).map(sa => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 },
          children: [
            new TextRun({ text: `${sa.serviceType}: `, bold: true, size: SM + 2, font: 'Arial', color: svcColour(sa.serviceType).text }),
            new TextRun({ text: `${sa.immediateAction} Call ${sa.emergencyNumber}`, size: SM + 2, font: 'Arial' }),
          ] })),

        secHead('5.0', 'Sign-On / Sign-Off', A),
        signOff(['Permit Issuer', 'Excavation Supervisor'], A),
        footerLine('This permit expires at the end of the stated shift. A new permit must be issued for each subsequent shift.'),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — UTILITY STRIKE (Red, emergency response document)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: PermitToDigData): Document {
  const A = RED_D; const LBG = RED_BG; const LC = RED_D;
  const strikeCols = [Math.round(W * 0.12), Math.round(W * 0.34), Math.round(W * 0.14), Math.round(W * 0.16), W - Math.round(W * 0.12) - Math.round(W * 0.34) - Math.round(W * 0.14) - Math.round(W * 0.16)];
  const cascCols = [Math.round(W * 0.06), Math.round(W * 0.20), Math.round(W * 0.24), Math.round(W * 0.20), W - Math.round(W * 0.06) - Math.round(W * 0.20) - Math.round(W * 0.24) - Math.round(W * 0.20)];
  const stepCols = [Math.round(W * 0.06), Math.round(W * 0.54), W - Math.round(W * 0.06) - Math.round(W * 0.54)];
  const investCols = [Math.round(W * 0.38), W - Math.round(W * 0.38)];
  const lessonCols = [Math.round(W * 0.30), Math.round(W * 0.30), Math.round(W * 0.20), W - Math.round(W * 0.30) * 2 - Math.round(W * 0.20)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Utility Strike Response') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { after: 0 }, children: [new TextRun({ text: 'UTILITY STRIKE \u2014 EMERGENCY RESPONSE PROCEDURE', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'D9D9D9' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.issueDate}   |   Prepared: ${d.preparedBy}   |   Client: ${d.client}`, size: SM, font: 'Arial', color: 'FEE2E2' })] }),

        warningBanner('IF YOU STRIKE A UTILITY \u2014 STOP ALL WORK IMMEDIATELY', RED_BG, RED_D),

        secHead('1.0', 'Immediate Actions by Service Type', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Service', strikeCols[0], A), hdrCell('Immediate Action', strikeCols[1], A), hdrCell('Evacuate', strikeCols[2], A), hdrCell('Call', strikeCols[3], A), hdrCell('DO NOT', strikeCols[4], A)] }),
          ...d.strikeActions.map(sa => new TableRow({ children: [
            svcCell(sa.serviceType, strikeCols[0], sa.serviceType),
            txtCell(sa.immediateAction, strikeCols[1]),
            txtCell(sa.evacuationDistance, strikeCols[2], { bold: true, color: RED_D }),
            txtCell(sa.emergencyNumber, strikeCols[3], { bold: true }),
            txtCell(sa.doNot, strikeCols[4], { color: RED_D }),
          ] })),
        ] }),

        secHead('2.0', 'Notification Cascade', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('#', cascCols[0], A), hdrCell('Role', cascCols[1], A), hdrCell('Name', cascCols[2], A), hdrCell('Number', cascCols[3], A), hdrCell('When', cascCols[4], A)] }),
          ...d.notificationCascade.map((nc, ri) => new TableRow({ children: [
            txtCell(nc.order, cascCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(nc.role, cascCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(nc.name, cascCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(nc.number, cascCols[3], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(nc.when, cascCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          ] })),
        ] }),

        secHead('3.0', '8-Step Strike Response Procedure', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('#', stepCols[0], A), hdrCell('Action', stepCols[1], A), hdrCell('Responsibility', stepCols[2], A)] }),
          ...d.strikeSteps.map((ss, ri) => new TableRow({ children: [
            txtCell(ss.step, stepCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(ss.action, stepCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(ss.responsibility, stepCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          ] })),
        ] }),

        secHead('4.0', 'Scene Preservation', A),
        ...h.prose(d.scenePreservation || 'Secure the area with barriers and warning tape. Preserve evidence — do not backfill or disturb the damaged service. Photograph the strike location, service depth, and surrounding conditions. Record GPS coordinates and what3words reference.'),

        secHead('5.0', 'Investigation & RIDDOR Assessment', A),
        ...(d.investigationItems.length > 0 ? [
          dataTable([{ text: 'Question', width: investCols[0] }, { text: 'Response', width: investCols[1] }],
            d.investigationItems.map(ii => [{ text: ii.question, bold: true }, { text: ii.response }]), A),
        ] : []),
        ...(d.riddorAssessment ? [new Paragraph({ spacing: { before: 120, after: 80 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: RED, space: 6 } },
          children: [
            new TextRun({ text: 'RIDDOR Assessment: ', bold: true, size: SM + 2, font: 'Arial', color: RED_D }),
            new TextRun({ text: d.riddorAssessment, size: SM + 2, font: 'Arial' }),
          ] })] : []),

        secHead('6.0', 'Lessons Learned', A),
        ...(d.lessonsLearned.length > 0 ? [
          dataTable(
            [{ text: 'Finding', width: lessonCols[0] }, { text: 'Action', width: lessonCols[1] }, { text: 'Responsible', width: lessonCols[2] }, { text: 'Due', width: lessonCols[3] }],
            d.lessonsLearned.map(ll => [{ text: ll.finding }, { text: ll.action }, { text: ll.responsible }, { text: ll.dueDate }]),
            A),
        ] : []),

        secHead('7.0', 'Sign-Off', A),
        signOff(['Site Manager', 'Excavation Supervisor', 'Client Representative', 'Utility Company Rep'], A),
        footerLine('This report must be completed within 24 hours of a utility strike. RIDDOR-reportable strikes must be notified to HSE immediately.'),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — AVOIDANCE PLAN (Navy, site-wide strategy & PAS 128)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: PermitToDigData): Document {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY_ACCENT;
  const zoneCols = [Math.round(W * 0.10), Math.round(W * 0.22), Math.round(W * 0.12), Math.round(W * 0.20), Math.round(W * 0.10), W - Math.round(W * 0.10) - Math.round(W * 0.22) - Math.round(W * 0.12) - Math.round(W * 0.20) - Math.round(W * 0.10)];
  const compCols = [Math.round(W * 0.20), Math.round(W * 0.18), Math.round(W * 0.22), Math.round(W * 0.20), W - Math.round(W * 0.20) - Math.round(W * 0.18) - Math.round(W * 0.22) - Math.round(W * 0.20)];
  const auditCols = [Math.round(W * 0.28), Math.round(W * 0.20), Math.round(W * 0.24), W - Math.round(W * 0.28) - Math.round(W * 0.20) - Math.round(W * 0.24)];
  const refCols = [Math.round(W * 0.38), W - Math.round(W * 0.38)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Underground Service Avoidance Plan') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [new TextRun({ text: 'UNDERGROUND SERVICE AVOIDANCE PLAN', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'D9D9D9' })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY_ACCENT }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.issueDate}   |   Prepared: ${d.preparedBy}   |   Review: ${d.reviewDate}   |   Client: ${d.client}`, size: SM, font: 'Arial', color: 'e2e8f0' })] }),
          h.spacer(100),
          infoTable([
            { label: 'Site Address', value: d.siteAddress }, { label: 'Grid Ref', value: d.gridRef },
            { label: 'what3words', value: d.what3Words },
            { label: 'Principal Contractor', value: d.principalContractor }, { label: 'Client', value: d.client },
          ], LBG, LC),
        ] },
      // Content
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Underground Service Avoidance Plan') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Avoidance Strategy Statement', A),
          ...h.prose(d.avoidanceStatement || 'This document sets out the site-wide strategy for identifying, locating, and avoiding underground services during all excavation activities. All excavation work shall comply with HSG47, PAS 128, and NJUG guidelines.'),

          secHead('2.0', 'Statutory Records Summary', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Provider', Math.round(W * 0.30), A), hdrCell('Done', Math.round(W * 0.12), A), hdrCell('Date', Math.round(W * 0.20), A), hdrCell('Reference', W - Math.round(W * 0.62), A)] }),
            ...d.statSearches.map((ss, ri) => new TableRow({ children: [
              txtCell(ss.provider, Math.round(W * 0.30), { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(ss.completed, Math.round(W * 0.12)),
              txtCell(ss.date, Math.round(W * 0.20), { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(ss.reference, W - Math.round(W * 0.62), { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('3.0', 'PAS 128 Survey Classification', A),
          ...h.prose(d.pas128Classification || 'Survey level and classification to be confirmed. PAS 128:2022 defines four survey types: Type A (desktop), Type B (site reconnaissance), Type C (detection), Type D (verification). Minimum Type C required for all excavation zones.'),

          secHead('4.0', 'Excavation Zones & Service Density', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Zone', zoneCols[0], A), hdrCell('Location', zoneCols[1], A), hdrCell('Density', zoneCols[2], A), hdrCell('Services', zoneCols[3], A), hdrCell('Permit', zoneCols[4], A), hdrCell('Special Measures', zoneCols[5], A)] }),
            ...d.excavationZones.map((ez, ri) => new TableRow({ children: [
              txtCell(ez.zone, zoneCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(ez.location, zoneCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              densityCell(ez.serviceDensity, zoneCols[2]),
              txtCell(ez.servicesPresent, zoneCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(ez.permitRequired, zoneCols[4]),
              txtCell(ez.specialMeasures, zoneCols[5], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('5.0', 'Safe Digging Rules', A),
          ...d.safeDigRules.map((rule, i) => new Paragraph({ spacing: { after: 60 }, indent: { left: 360 },
            children: [new TextRun({ text: `${i + 1}. ${rule}`, size: SM + 2, font: 'Arial' })] })),

          secHead('6.0', 'CAT & Genny Competence Register', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Name', compCols[0], A), hdrCell('Role', compCols[1], A), hdrCell('CAT Cert', compCols[2], A), hdrCell('Expiry', compCols[3], A), hdrCell('Last Assessed', compCols[4], A)] }),
            ...d.competenceRegister.map((cr, ri) => new TableRow({ children: [
              txtCell(cr.name, compCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.role, compCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.catCert, compCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.certExpiry, compCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(cr.lastAssessed, compCols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('7.0', 'Permit Issuing Procedure', A),
          ...d.permitProcedure.map((step, i) => new Paragraph({ spacing: { after: 60 }, indent: { left: 360 },
            children: [new TextRun({ text: `${i + 1}. ${step}`, size: SM + 2, font: 'Arial' })] })),

          secHead('8.0', 'Monitoring & Audit Plan', A),
          dataTable(
            [{ text: 'Item', width: auditCols[0] }, { text: 'Frequency', width: auditCols[1] }, { text: 'Responsibility', width: auditCols[2] }, { text: 'Record', width: auditCols[3] }],
            d.auditItems.map(ai => [{ text: ai.item }, { text: ai.frequency }, { text: ai.responsibility }, { text: ai.record }]),
            A),

          secHead('9.0', 'Regulatory References', A),
          dataTable([{ text: 'Reference', width: refCols[0] }, { text: 'Description', width: refCols[1] }],
            d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A),

          secHead('10.0', 'Sign-Off', A),
          signOff(d.signOffRoles.length > 0 ? d.signOffRoles.map(r => r.role) : ['Document Author', 'Site Manager', 'Client Representative'], A),
          footerLine('This avoidance plan must be reviewed monthly, after any utility strike, and whenever excavation zones change.'),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildPermitToDigTemplateDocument(
  content: any,
  templateSlug: PermitToDigTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard': return buildT1(d);
    case 'daily-permit':    return buildT2(d);
    case 'utility-strike':  return buildT3(d);
    case 'avoidance-plan':  return buildT4(d);
    default:                return buildT1(d);
  }
}
