// =============================================================================
// POWRA Builder — Multi-Template Engine
// 4 templates, all consuming the same POWRA JSON structure.
//
// T1 — Ebrora Standard     (green, comprehensive hazard matrix, RAG rating)
// T2 — Quick Card           (amber, STOP→THINK→ACT, lamination-ready)
// T3 — Task Specific        (teal, phase-by-phase risk assessment)
// T4 — Supervisor Review    (navy, audit layer, competency, close-out)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { PowraTemplateSlug } from '@/lib/powra/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const GREEN = '059669'; const GREEN_BG = 'D1FAE5';
const AMBER = '92400e'; const AMBER_BG = 'FFFBEB'; const AMBER_ACCENT = 'B45309';
const RED_D = '991B1B'; const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa'; const TEAL_DARK = '134e4a';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9'; const NAVY_ACCENT = '334155';
const GREY = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// RAG helpers
function ragFill(rating: string): string {
  const r = (rating || '').toLowerCase();
  if (r === 'high') return RED_BG;
  if (r === 'medium') return AMBER_BG;
  if (r === 'low') return GREEN_BG;
  return GREY_BG;
}
function ragText(rating: string): string {
  const r = (rating || '').toLowerCase();
  if (r === 'high') return RED_D;
  if (r === 'medium') return AMBER_ACCENT;
  if (r === 'low') return GREEN;
  return GREY;
}

// ── Data Interface ───────────────────────────────────────────────────────────
interface Hazard { hazard: string; consequence: string; likelihood: string; severity: string; riskBefore: string; controlMeasure: string; riskAfter: string; }
interface Condition { weather: string; groundConditions: string; lighting: string; accessEgress: string; overhead: string; adjacentWork: string; }
interface TaskPhase { phase: string; description: string; hazards: Hazard[]; plantEquipment: string; permitsRequired: string; stopConditions: string[]; }
interface PlantItem { item: string; checkCompleted: boolean; operator: string; restrictions: string; }
interface PermitRef { type: string; reference: string; issuer: string; validity: string; }
interface CompetencyCheck { item: string; verified: boolean; verifiedBy: string; }
interface MonitoringItem { item: string; frequency: string; responsibility: string; action: string; }
interface LessonLearned { finding: string; action: string; responsible: string; }
interface TeamMember { name: string; role: string; employer: string; briefed: boolean; }
interface ChecklistItem { item: string; checked: boolean; }
interface RegRef { reference: string; description: string; }
interface CloseOutItem { item: string; completed: boolean; signedBy: string; }

interface PowraData {
  documentRef: string; date: string; time: string;
  assessedBy: string; projectName: string; siteAddress: string;
  location: string; ramsReference: string; permitReferences: string;
  taskDescription: string;
  conditions: Condition;
  hazards: Hazard[];
  ppeRequired: string[];
  stopConditions: string[];
  emergencyArrangements: string;
  reassessmentTriggers: string[];
  teamSignOn: TeamMember[];
  // T2 — Quick Card
  hazardChecklist: ChecklistItem[];
  controlsSummary: string;
  // T3 — Task Specific
  taskPhases: TaskPhase[];
  plantRegister: PlantItem[];
  permitsCrossRef: PermitRef[];
  // T4 — Supervisor Review
  competencyChecks: CompetencyCheck[];
  environmentalConsiderations: string;
  monitoringItems: MonitoringItem[];
  closeOutItems: CloseOutItem[];
  lessonsLearned: LessonLearned[];
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): PowraData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  const cond = c.conditions || {};
  return {
    documentRef: s(c.documentRef), date: s(c.date), time: s(c.time),
    assessedBy: s(c.assessedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    location: s(c.location), ramsReference: s(c.ramsReference), permitReferences: s(c.permitReferences),
    taskDescription: s(c.taskDescription),
    conditions: { weather: s(cond.weather), groundConditions: s(cond.groundConditions), lighting: s(cond.lighting), accessEgress: s(cond.accessEgress), overhead: s(cond.overhead), adjacentWork: s(cond.adjacentWork) },
    hazards: a(c.hazards),
    ppeRequired: a(c.ppeRequired),
    stopConditions: a(c.stopConditions).length > 0 ? a(c.stopConditions) : defaultStops(),
    emergencyArrangements: s(c.emergencyArrangements),
    reassessmentTriggers: a(c.reassessmentTriggers).length > 0 ? a(c.reassessmentTriggers) : defaultTriggers(),
    teamSignOn: a(c.teamSignOn),
    hazardChecklist: a(c.hazardChecklist).length > 0 ? a(c.hazardChecklist) : defaultChecklist(),
    controlsSummary: s(c.controlsSummary),
    taskPhases: a(c.taskPhases),
    plantRegister: a(c.plantRegister),
    permitsCrossRef: a(c.permitsCrossRef),
    competencyChecks: a(c.competencyChecks).length > 0 ? a(c.competencyChecks) : defaultCompetency(),
    environmentalConsiderations: s(c.environmentalConsiderations),
    monitoringItems: a(c.monitoringItems),
    closeOutItems: a(c.closeOutItems).length > 0 ? a(c.closeOutItems) : defaultCloseOut(),
    lessonsLearned: a(c.lessonsLearned),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

// ── Defaults ─────────────────────────────────────────────────────────────────
function defaultStops(): string[] {
  return [
    'Conditions change from those assessed (weather, ground, lighting)',
    'Unexpected services or hazards discovered',
    'Anyone feels unsafe or unsure about the task',
    'Plant or equipment develops a fault',
    'An incident, near miss, or dangerous occurrence happens nearby',
  ];
}
function defaultTriggers(): string[] {
  return [
    'Weather conditions deteriorate significantly',
    'Change in scope, method, or personnel',
    'New hazard identified during work',
    'Permit conditions change or expire',
    'After any break exceeding 30 minutes',
  ];
}
function defaultChecklist(): ChecklistItem[] {
  return [
    { item: 'Working at height risks assessed', checked: false },
    { item: 'Underground/overhead services checked', checked: false },
    { item: 'Manual handling risks considered', checked: false },
    { item: 'Moving plant/vehicles in area', checked: false },
    { item: 'Confined space entry risks', checked: false },
    { item: 'Electrical hazards assessed', checked: false },
    { item: 'Slip/trip hazards controlled', checked: false },
    { item: 'Noise/vibration exposure considered', checked: false },
  ];
}
function defaultCompetency(): CompetencyCheck[] {
  return [
    { item: 'All operatives hold valid CSCS cards', verified: false, verifiedBy: '' },
    { item: 'Task-specific training completed (e.g. PASMA, IPAF, abrasive wheels)', verified: false, verifiedBy: '' },
    { item: 'RAMS briefing delivered and signed', verified: false, verifiedBy: '' },
    { item: 'PPE condition checked and adequate', verified: false, verifiedBy: '' },
    { item: 'Plant operators hold valid tickets', verified: false, verifiedBy: '' },
  ];
}
function defaultCloseOut(): CloseOutItem[] {
  return [
    { item: 'Work area left safe and tidy', completed: false, signedBy: '' },
    { item: 'All permits closed out', completed: false, signedBy: '' },
    { item: 'Plant secured and isolated', completed: false, signedBy: '' },
    { item: 'Barriers/signage reinstated', completed: false, signedBy: '' },
    { item: 'Any incidents/near misses reported', completed: false, signedBy: '' },
  ];
}
function defaultRefs(): RegRef[] {
  return [
    { reference: 'MHSW Regulations 1999', description: 'Regulation 3 — risk assessment duty' },
    { reference: 'CDM 2015 Regulation 13', description: 'Principal contractor duties — safe working' },
    { reference: 'HASAWA 1974 Section 2', description: 'General duty of care to employees' },
    { reference: 'PPE at Work Regulations 2022', description: 'Provision and use of PPE' },
    { reference: 'LOLER 1998', description: 'Lifting operations planning and supervision' },
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
function ragCell(text: string, width: number): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: ragFill(text), type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: ragText(text) })] })] });
}
function checkCell(checked: boolean, width: number): TableCell {
  const fill = checked ? GREEN_BG : RED_BG;
  const colour = checked ? GREEN : RED_D;
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: checked ? '\u2713 YES' : '\u2717 NO', bold: true, size: SM, font: 'Arial', color: colour })] })] });
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
function warningBanner(text: string, bg: string, colour: string): Paragraph {
  return new Paragraph({ shading: { type: ShadingType.CLEAR, fill: bg }, spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `\u26A0  ${text}  \u26A0`, bold: true, size: XL, font: 'Arial', color: colour })] });
}
function stopLine(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: RED_BG }, indent: { left: 240 },
    children: [new TextRun({ text: `\u2717  ${text}`, bold: true, size: SM + 2, font: 'Arial', color: RED_D })] });
}
function footerLine(text: string): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text, size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] });
}
function phaseBand(text: string, bg: string): Paragraph {
  return new Paragraph({ spacing: { before: 280, after: 100 }, shading: { type: ShadingType.CLEAR, fill: bg },
    children: [new TextRun({ text: `  ${text.toUpperCase()}`, bold: true, size: BODY, font: 'Arial', color: h.WHITE })] });
}

// Hazard matrix table used by T1 and T4
function hazardMatrix(hazards: Hazard[], accent: string): Table {
  const cols = [Math.round(W * 0.18), Math.round(W * 0.16), Math.round(W * 0.09), Math.round(W * 0.36), W - Math.round(W * 0.18) - Math.round(W * 0.16) - Math.round(W * 0.09) - Math.round(W * 0.36)];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Hazard', cols[0], accent), hdrCell('Consequence', cols[1], accent), hdrCell('Risk', cols[2], accent), hdrCell('Control Measure', cols[3], accent), hdrCell('Residual', cols[4], accent)] }),
    ...hazards.map((hz, ri) => new TableRow({ children: [
      txtCell(hz.hazard, cols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
      txtCell(hz.consequence, cols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
      ragCell(hz.riskBefore, cols[2]),
      txtCell(hz.controlMeasure, cols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
      ragCell(hz.riskAfter, cols[4]),
    ] })),
  ] });
}

// Team sign-on table
function teamTable(members: TeamMember[], accent: string, minRows = 6): Table {
  const cols = [Math.round(W * 0.24), Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.18), W - Math.round(W * 0.24) - Math.round(W * 0.20) * 2 - Math.round(W * 0.18)];
  const dataRows = members.map((m, ri) => new TableRow({ children: [
    txtCell(m.name, cols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    txtCell(m.role, cols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    txtCell(m.employer, cols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
    checkCell(m.briefed, cols[3]),
    txtCell('', cols[4], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
  ] }));
  const blanks = Math.max(0, minRows - members.length);
  const blankRows = Array.from({ length: blanks }, (_, ri) =>
    new TableRow({ height: { value: 500, rule: 'atLeast' as any }, children: cols.map(cw => txtCell('', cw, { bg: (members.length + ri) % 2 === 0 ? ZEBRA : h.WHITE })) }));
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: [hdrCell('Name', cols[0], accent), hdrCell('Role', cols[1], accent), hdrCell('Employer', cols[2], accent), hdrCell('Briefed', cols[3], accent), hdrCell('Signature', cols[4], accent)] }),
    ...dataRows, ...blankRows,
  ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green, comprehensive POWRA)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: PowraData): Document {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Point of Work Risk Assessment') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'POINT OF WORK RISK ASSESSMENT', bold: true, size: TTL, font: 'Arial', color: A })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'POWRA \u2014 MHSW 1999 \u00B7 CDM 2015', size: BODY, font: 'Arial', color: h.GREY_DARK })] }),
          h.spacer(100),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          h.spacer(100),
          infoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date / Time', value: `${d.date} at ${d.time}` },
            { label: 'Assessed By', value: d.assessedBy }, { label: 'Location', value: d.location },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'RAMS Ref', value: d.ramsReference }, { label: 'Permits', value: d.permitReferences },
          ], LBG, LC),
        ] },
      // Content
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Point of Work Risk Assessment') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Task Description', A),
          ...h.prose(d.taskDescription || 'Task description to be confirmed.'),

          secHead('2.0', 'Conditions Today', A),
          infoTable([
            { label: 'Weather', value: d.conditions.weather }, { label: 'Ground', value: d.conditions.groundConditions },
            { label: 'Lighting', value: d.conditions.lighting }, { label: 'Access/Egress', value: d.conditions.accessEgress },
            { label: 'Overhead', value: d.conditions.overhead }, { label: 'Adjacent Work', value: d.conditions.adjacentWork },
          ], LBG, LC),

          secHead('3.0', 'Hazard Identification & Risk Rating', A),
          hazardMatrix(d.hazards, A),

          secHead('4.0', 'PPE Required', A),
          ...d.ppeRequired.map((ppe, i) => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 },
            children: [new TextRun({ text: `\u2022 ${ppe}`, size: SM + 2, font: 'Arial' })] })),

          secHead('5.0', 'Stop Conditions', A),
          warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D),
          ...d.stopConditions.map(sc => stopLine(sc)),

          secHead('6.0', 'Dynamic Reassessment Triggers', A),
          ...d.reassessmentTriggers.map((tr, i) => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 },
            children: [new TextRun({ text: `${i + 1}. ${tr}`, size: SM + 2, font: 'Arial' })] })),

          secHead('7.0', 'Emergency Arrangements', A),
          ...h.prose(d.emergencyArrangements || 'Emergency arrangements to be confirmed.'),

          secHead('8.0', 'Team Briefing & Sign-On', A),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: 'I confirm I have been briefed on this POWRA and understand the hazards, controls, and stop conditions.', size: SM + 2, font: 'Arial', italics: true, color: h.GREY_DARK })] }),
          teamTable(d.teamSignOn, A),

          secHead('9.0', 'Sign-Off', A),
          signOff(['Assessor', 'Supervisor', 'Site Manager', 'Operative Representative'], A),
          footerLine('This POWRA must be reassessed if conditions change, scope changes, or after any incident. Valid for one shift only unless stated otherwise.'),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — QUICK CARD (Amber, STOP→THINK→ACT, lamination-ready)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: PowraData): Document {
  const A = AMBER; const LBG = AMBER_BG; const LC = AMBER_ACCENT;
  const checkCols = [Math.round(W * 0.82), W - Math.round(W * 0.82)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('POWRA Quick Card') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER }, spacing: { after: 0 }, children: [new TextRun({ text: 'POWRA \u2014 POINT OF WORK RISK ASSESSMENT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef} | ${d.date}`, size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),

        // STOP → THINK → ACT
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, spacing: { before: 120, after: 0 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'STOP', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Look at the task. What could go wrong?', size: SM + 2, font: 'Arial', color: RED_D, bold: true })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: AMBER_ACCENT }, spacing: { after: 0 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'THINK', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'What hazards are present? What controls do you need?', size: SM + 2, font: 'Arial', color: AMBER_ACCENT, bold: true })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: GREEN }, spacing: { after: 0 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'ACT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Put controls in place. Brief the team. Start work safely.', size: SM + 2, font: 'Arial', color: GREEN, bold: true })] }),

        secHead('1', 'Task & Location', A),
        infoTable([
          { label: 'Task', value: d.taskDescription },
          { label: 'Location', value: d.location }, { label: 'Assessed By', value: d.assessedBy },
        ], LBG, LC),

        secHead('2', 'Conditions Check', A),
        infoTable([
          { label: 'Weather', value: d.conditions.weather }, { label: 'Ground', value: d.conditions.groundConditions },
          { label: 'Overhead', value: d.conditions.overhead }, { label: 'Access', value: d.conditions.accessEgress },
        ], LBG, LC),

        secHead('3', 'Hazard Checklist', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          new TableRow({ children: [hdrCell('Hazard', checkCols[0], A), hdrCell('Check', checkCols[1], A)] }),
          ...d.hazardChecklist.map((ci, ri) => new TableRow({ children: [
            txtCell(ci.item, checkCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            checkCell(ci.checked, checkCols[1]),
          ] })),
        ] }),

        secHead('4', 'Controls Summary', A),
        ...h.prose(d.controlsSummary || d.hazards.map(hz => hz.controlMeasure).filter(Boolean).join('. ') || 'Controls to be confirmed.'),

        warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D),
        ...d.stopConditions.slice(0, 4).map(sc => stopLine(sc)),

        secHead('5', 'Sign-Off', A),
        signOff(['Operative', 'Supervisor'], A),
        footerLine('Valid for one shift only. Reassess if conditions change.'),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — TASK SPECIFIC (Teal, phase-by-phase risk assessment)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: PowraData): Document {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL;
  const plantCols = [Math.round(W * 0.24), Math.round(W * 0.12), Math.round(W * 0.24), W - Math.round(W * 0.24) - Math.round(W * 0.12) - Math.round(W * 0.24)];
  const permitCols = [Math.round(W * 0.20), Math.round(W * 0.24), Math.round(W * 0.24), W - Math.round(W * 0.20) - Math.round(W * 0.24) * 2];

  // Phase sections
  const phaseSections: (Paragraph | Table)[] = [];
  for (const phase of d.taskPhases) {
    phaseSections.push(phaseBand(`Phase: ${phase.phase}`, TEAL));
    phaseSections.push(new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: phase.description, size: SM + 2, font: 'Arial' })] }));
    if (phase.hazards.length > 0) {
      const phCols = [Math.round(W * 0.18), Math.round(W * 0.14), Math.round(W * 0.09), Math.round(W * 0.38), W - Math.round(W * 0.18) - Math.round(W * 0.14) - Math.round(W * 0.09) - Math.round(W * 0.38)];
      phaseSections.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
        new TableRow({ children: [hdrCell('Hazard', phCols[0], A), hdrCell('Consequence', phCols[1], A), hdrCell('Risk', phCols[2], A), hdrCell('Control', phCols[3], A), hdrCell('Residual', phCols[4], A)] }),
        ...phase.hazards.map((hz, ri) => new TableRow({ children: [
          txtCell(hz.hazard, phCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(hz.consequence, phCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(hz.riskBefore, phCols[2]),
          txtCell(hz.controlMeasure, phCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
          ragCell(hz.riskAfter, phCols[4]),
        ] })),
      ] }));
    }
    if (phase.plantEquipment) {
      phaseSections.push(new Paragraph({ spacing: { before: 60, after: 40 }, indent: { left: 360 }, children: [
        new TextRun({ text: 'Plant/Equipment: ', bold: true, size: SM + 2, font: 'Arial', color: TEAL }),
        new TextRun({ text: phase.plantEquipment, size: SM + 2, font: 'Arial' }),
      ] }));
    }
    if (phase.permitsRequired) {
      phaseSections.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [
        new TextRun({ text: 'Permits: ', bold: true, size: SM + 2, font: 'Arial', color: TEAL }),
        new TextRun({ text: phase.permitsRequired, size: SM + 2, font: 'Arial' }),
      ] }));
    }
    if (phase.stopConditions && phase.stopConditions.length > 0) {
      phaseSections.push(...phase.stopConditions.map(sc => stopLine(sc)));
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('POWRA \u2014 Task Specific') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'POWRA \u2014 TASK-SPECIFIC RISK ASSESSMENT', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.date} ${d.time}   |   Assessed: ${d.assessedBy}   |   Location: ${d.location}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }),

          secHead('1.0', 'Task Overview', A),
          ...h.prose(d.taskDescription || 'Task description to be confirmed.'),
          infoTable([
            { label: 'RAMS Ref', value: d.ramsReference }, { label: 'Permits', value: d.permitReferences },
            { label: 'Weather', value: d.conditions.weather }, { label: 'Ground', value: d.conditions.groundConditions },
          ], LBG, LC),

          secHead('2.0', 'Phase-by-Phase Risk Assessment', A),
          ...phaseSections,

          secHead('3.0', 'Plant & Equipment Register', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Item', plantCols[0], A), hdrCell('Checked', plantCols[1], A), hdrCell('Operator', plantCols[2], A), hdrCell('Restrictions', plantCols[3], A)] }),
            ...d.plantRegister.map((pi, ri) => new TableRow({ children: [
              txtCell(pi.item, plantCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(pi.checkCompleted, plantCols[1]),
              txtCell(pi.operator, plantCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              txtCell(pi.restrictions, plantCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('4.0', 'Permits Cross-Reference', A),
          ...(d.permitsCrossRef.length > 0 ? [dataTable(
            [{ text: 'Permit Type', width: permitCols[0] }, { text: 'Reference', width: permitCols[1] }, { text: 'Issuer', width: permitCols[2] }, { text: 'Validity', width: permitCols[3] }],
            d.permitsCrossRef.map(pr => [{ text: pr.type }, { text: pr.reference }, { text: pr.issuer }, { text: pr.validity }]),
            A)] : [new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: 'No additional permits required.', size: SM + 2, font: 'Arial', italics: true, color: h.GREY_DARK })] })]),

          secHead('5.0', 'Team Briefing & Sign-On', A),
          teamTable(d.teamSignOn, A),
          footerLine('This task-specific POWRA must be reassessed at each phase transition and if conditions change.'),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — SUPERVISOR REVIEW (Navy, audit layer, competency, close-out)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: PowraData): Document {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY_ACCENT;
  const compCols = [Math.round(W * 0.46), Math.round(W * 0.14), W - Math.round(W * 0.46) - Math.round(W * 0.14)];
  const monCols = [Math.round(W * 0.26), Math.round(W * 0.18), Math.round(W * 0.24), W - Math.round(W * 0.26) - Math.round(W * 0.18) - Math.round(W * 0.24)];
  const closeCols = [Math.round(W * 0.44), Math.round(W * 0.14), W - Math.round(W * 0.44) - Math.round(W * 0.14)];
  const lessonCols = [Math.round(W * 0.36), Math.round(W * 0.36), W - Math.round(W * 0.36) * 2];
  const refCols = [Math.round(W * 0.38), W - Math.round(W * 0.38)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('POWRA \u2014 Supervisor Review') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [new TextRun({ text: 'POWRA \u2014 SUPERVISOR REVIEW', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY_ACCENT }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.date} ${d.time}   |   Assessed: ${d.assessedBy}   |   Location: ${d.location}`, size: SM, font: 'Arial', color: 'e2e8f0' })] }),
          h.spacer(80),
          infoTable([
            { label: 'Site Address', value: d.siteAddress }, { label: 'RAMS Ref', value: d.ramsReference },
            { label: 'Permits', value: d.permitReferences },
          ], LBG, LC),
        ] },
      // Content
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('POWRA \u2014 Supervisor Review') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Task Description', A),
          ...h.prose(d.taskDescription || 'Task description to be confirmed.'),

          secHead('2.0', 'Conditions Assessment', A),
          infoTable([
            { label: 'Weather', value: d.conditions.weather }, { label: 'Ground', value: d.conditions.groundConditions },
            { label: 'Lighting', value: d.conditions.lighting }, { label: 'Access/Egress', value: d.conditions.accessEgress },
            { label: 'Overhead', value: d.conditions.overhead }, { label: 'Adjacent Work', value: d.conditions.adjacentWork },
          ], LBG, LC),

          secHead('3.0', 'Hazard Identification & Risk Rating', A),
          hazardMatrix(d.hazards, A),

          secHead('4.0', 'Competency Verification', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Item', compCols[0], A), hdrCell('Verified', compCols[1], A), hdrCell('Verified By', compCols[2], A)] }),
            ...d.competencyChecks.map((cc, ri) => new TableRow({ children: [
              txtCell(cc.item, compCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(cc.verified, compCols[1]),
              txtCell(cc.verifiedBy, compCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('5.0', 'PPE & Stop Conditions', A),
          ...d.ppeRequired.map(ppe => new Paragraph({ spacing: { after: 40 }, indent: { left: 360 },
            children: [new TextRun({ text: `\u2022 ${ppe}`, size: SM + 2, font: 'Arial' })] })),
          warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D),
          ...d.stopConditions.map(sc => stopLine(sc)),

          secHead('6.0', 'Environmental Considerations', A),
          ...h.prose(d.environmentalConsiderations || 'No specific environmental considerations identified.'),

          secHead('7.0', 'Monitoring Requirements', A),
          ...(d.monitoringItems.length > 0 ? [dataTable(
            [{ text: 'Item', width: monCols[0] }, { text: 'Frequency', width: monCols[1] }, { text: 'Responsibility', width: monCols[2] }, { text: 'Action if Exceeded', width: monCols[3] }],
            d.monitoringItems.map(mi => [{ text: mi.item }, { text: mi.frequency }, { text: mi.responsibility }, { text: mi.action }]),
            A)] : []),

          secHead('8.0', 'Team Briefing & Sign-On', A),
          teamTable(d.teamSignOn, A),

          secHead('9.0', 'Close-Out Verification', A),
          new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [hdrCell('Item', closeCols[0], A), hdrCell('Done', closeCols[1], A), hdrCell('Signed By', closeCols[2], A)] }),
            ...d.closeOutItems.map((ci, ri) => new TableRow({ children: [
              txtCell(ci.item, closeCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              checkCell(ci.completed, closeCols[1]),
              txtCell(ci.signedBy, closeCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ] })),
          ] }),

          secHead('10.0', 'Lessons Learned', A),
          ...(d.lessonsLearned.length > 0 ? [dataTable(
            [{ text: 'Finding', width: lessonCols[0] }, { text: 'Action', width: lessonCols[1] }, { text: 'Responsible', width: lessonCols[2] }],
            d.lessonsLearned.map(ll => [{ text: ll.finding }, { text: ll.action }, { text: ll.responsible }]),
            A)] : []),

          secHead('11.0', 'Regulatory References', A),
          dataTable([{ text: 'Reference', width: refCols[0] }, { text: 'Description', width: refCols[1] }],
            d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A),

          secHead('12.0', 'Sign-Off', A),
          signOff(['Assessor', 'Supervisor', 'Site Manager', 'Client Representative'], A),
          footerLine('This POWRA must be retained on file for a minimum of 3 years. Review monthly or after any incident.'),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildPowraTemplateDocument(
  content: any,
  templateSlug: PowraTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':   return buildT1(d);
    case 'quick-card':        return buildT2(d);
    case 'task-specific':     return buildT3(d);
    case 'supervisor-review': return buildT4(d);
    default:                  return buildT1(d);
  }
}
