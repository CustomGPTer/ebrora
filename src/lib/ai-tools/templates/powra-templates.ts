// =============================================================================
// POWRA Builder — Multi-Template Engine (REBUILT)
// 4 templates, all consuming the same POWRA JSON structure.
//
// T1 — Ebrora Standard     (green #059669, comprehensive hazard matrix, RAG)
// T2 — Quick Card           (amber #B45309, STOP→THINK→ACT, lamination-ready)
// T3 — Task Specific        (teal #0f766e, phase-by-phase risk assessment)
// T4 — Supervisor Review    (navy #1e293b, audit layer, competency, close-out)
//
// Rebuilt to match the HTML render library exactly.
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { PowraTemplateSlug } from '@/lib/powra/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const W = h.A4_CONTENT_WIDTH; // 9026 DXA

// Font sizes (half-points)
const SM = 16;   // 8pt
const BODY = 18; // 9pt
const LG = 22;   // 11pt
const XL = 28;   // 14pt

// Cell margins
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Colours shared across templates
const GREEN = '059669';   const GREEN_BG = 'D1FAE5';   const GREEN_DARK = '143D2B';
const AMBER_ACCENT = 'B45309'; const AMBER_DARK = '92400e'; const AMBER_BG = 'FFFBEB';
const TEAL = '0f766e';    const TEAL_BG = 'f0fdfa';    const TEAL_DARK = '134e4a';
const NAVY = '1e293b';    const NAVY_BG = 'f1f5f9';    const NAVY_ACCENT = '334155';
const RED_D = '991B1B';   const RED = 'DC2626';         const RED_BG = 'FEF2F2';
const GREY = '6B7280';    const ZEBRA = 'F5F5F5';

// RAG helpers
function ragFill(rating: string): string {
  const r = (rating || '').toLowerCase();
  if (r === 'high') return RED_BG;
  if (r === 'medium') return AMBER_BG;
  if (r === 'low') return GREEN_BG;
  return 'F3F4F6';
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
  contractReference: string; clientName: string; principalContractor: string;
  taskDescription: string;
  conditions: Condition;
  hazards: Hazard[];
  ppeRequired: string[];
  stopConditions: string[];
  emergencyArrangements: string;
  reassessmentTriggers: string[];
  teamSignOn: TeamMember[];
  hazardChecklist: ChecklistItem[];
  controlsSummary: string;
  taskPhases: TaskPhase[];
  plantRegister: PlantItem[];
  permitsCrossRef: PermitRef[];
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
    contractReference: s(c.contractReference), clientName: s(c.clientName), principalContractor: s(c.principalContractor),
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
    { reference: 'MHSW Regulations 1999', description: 'Regulation 3 \u2014 risk assessment duty' },
    { reference: 'CDM 2015 Regulation 13', description: 'Principal contractor duties \u2014 safe working' },
    { reference: 'HASAWA 1974 Section 2', description: 'General duty of care to employees' },
    { reference: 'PPE at Work Regulations 2022', description: 'Provision and use of PPE' },
    { reference: 'LOLER 1998', description: 'Lifting operations planning and supervision' },
  ];
}

// ── Shared Cell Helpers ──────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })],
    })],
  });
}

function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; color?: string }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || BODY, font: 'Arial', color: opts?.color })],
    })],
  });
}

function ragCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: ragFill(text), type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: ragText(text) })],
    })],
  });
}

function checkCell(checked: boolean, width: number): TableCell {
  const fill = checked ? GREEN_BG : RED_BG;
  const colour = checked ? GREEN : RED_D;
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: checked ? '\u2713 YES' : '\u2717 NO', bold: true, size: SM, font: 'Arial', color: colour })],
    })],
  });
}

// Label/value info table with accent-tinted label cells
function accentInfoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  const vw = W - lw;
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({
      children: [
        new TableCell({
          width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
          shading: { fill: lbg, type: ShadingType.CLEAR },
          children: [new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial', color: lc })],
          })],
        }),
        new TableCell({
          width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
          children: [new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial' })],
          })],
        }),
      ],
    })),
  });
}

// Hazard matrix table used by T1 and T4
function hazardMatrix(hazards: Hazard[], accent: string): Table {
  const cols = [Math.round(W * 0.18), Math.round(W * 0.16), Math.round(W * 0.08), Math.round(W * 0.38)];
  cols.push(W - cols[0] - cols[1] - cols[2] - cols[3]); // residual column
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [hdrCell('Hazard', cols[0], accent), hdrCell('Consequence', cols[1], accent), hdrCell('Risk', cols[2], accent), hdrCell('Control Measure', cols[3], accent), hdrCell('Residual', cols[4], accent)] }),
      ...hazards.map((hz, ri) => new TableRow({ children: [
        txtCell(hz.hazard, cols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell(hz.consequence, cols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
        ragCell(hz.riskBefore, cols[2]),
        txtCell(hz.controlMeasure, cols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
        ragCell(hz.riskAfter, cols[4]),
      ] })),
    ],
  });
}

// Team sign-on table
function teamTable(members: TeamMember[], accent: string, minRows = 6): Table {
  const cols = [Math.round(W * 0.22), Math.round(W * 0.18), Math.round(W * 0.18), Math.round(W * 0.12)];
  cols.push(W - cols[0] - cols[1] - cols[2] - cols[3]); // signature column
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
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ children: [hdrCell('Name', cols[0], accent), hdrCell('Role', cols[1], accent), hdrCell('Employer', cols[2], accent), hdrCell('Briefed', cols[3], accent), hdrCell('Signature', cols[4], accent)] }),
      ...dataRows, ...blankRows,
    ],
  });
}

// Bullet point paragraph
function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 }, indent: { left: 360 },
    children: [new TextRun({ text: `\u2022  ${text}`, size: BODY, font: 'Arial' })],
  });
}

// Numbered item paragraph
function numberedItem(idx: number, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 }, indent: { left: 360 },
    children: [new TextRun({ text: `${idx}. ${text}`, size: BODY, font: 'Arial' })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// Cover page + content pages. Section numbering: 01, 02, 03...
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: PowraData): Document {
  const A = GREEN;
  const LBG = 'f0fdf4';
  const LC = GREEN;
  const hdr = h.accentHeader('Point of Work Risk Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER PAGE ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          h.coverBlock(['POINT OF WORK', 'RISK ASSESSMENT'], 'POWRA \u2014 MHSW 1999 \u00B7 CDM 2015 \u00B7 Ebrora Standard Format', GREEN_DARK, 'A7F3D0'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date / Time', value: `${d.date} at ${d.time}` },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractReference },
            { label: 'Client', value: d.clientName },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Location on Site', value: d.location },
            { label: 'RAMS Reference', value: d.ramsReference },
            { label: 'Permit References', value: d.permitReferences },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // ── CONTENT PAGES ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          // 01 TASK DESCRIPTION
          h.fullWidthSectionBar('01', 'Task Description', A),
          h.spacer(80),
          ...h.richBodyText(d.taskDescription || 'Task description to be confirmed.'),

          // 02 CONDITIONS TODAY
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Conditions Today', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Weather', value: d.conditions.weather },
            { label: 'Ground Conditions', value: d.conditions.groundConditions },
            { label: 'Lighting', value: d.conditions.lighting },
            { label: 'Access / Egress', value: d.conditions.accessEgress },
            { label: 'Overhead', value: d.conditions.overhead },
            { label: 'Adjacent Work', value: d.conditions.adjacentWork },
          ], LBG, LC),

          // 03 HAZARD IDENTIFICATION & RISK RATING
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Hazard Identification & Risk Rating', A),
          h.spacer(80),
          hazardMatrix(d.hazards, A),

          // 04 PPE REQUIRED
          h.spacer(120),
          h.fullWidthSectionBar('04', 'PPE Required', A),
          h.spacer(80),
          ...d.ppeRequired.map(ppe => bullet(ppe)),

          // 05 STOP CONDITIONS
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Stop Conditions', A),
          h.spacer(80),
          h.warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D, W),
          h.spacer(40),
          ...d.stopConditions.map(sc => h.stopConditionLine(sc)),

          // 06 DYNAMIC REASSESSMENT TRIGGERS
          h.spacer(120),
          h.fullWidthSectionBar('06', 'Dynamic Reassessment Triggers', A),
          h.spacer(80),
          ...d.reassessmentTriggers.map((tr, i) => numberedItem(i + 1, tr)),

          // 07 EMERGENCY ARRANGEMENTS
          h.spacer(120),
          h.fullWidthSectionBar('07', 'Emergency Arrangements', A),
          h.spacer(80),
          ...h.richBodyText(d.emergencyArrangements || 'Emergency arrangements to be confirmed.'),

          // 08 TEAM BRIEFING & SIGN-ON
          h.spacer(120),
          h.fullWidthSectionBar('08', 'Team Briefing & Sign-On', A),
          h.spacer(80),
          h.calloutBox(
            'I confirm I have been briefed on this POWRA and understand the hazards, controls, and stop conditions. I will stop work and report to my supervisor if conditions change.',
            A, LBG, GREEN_DARK, W,
            { boldPrefix: 'Declaration:' }
          ),
          h.spacer(80),
          teamTable(d.teamSignOn, A),

          // 09 SIGN-OFF
          h.spacer(120),
          h.fullWidthSectionBar('09', 'Sign-Off', A),
          h.spacer(80),
          h.signatureGrid(['Assessor', 'Supervisor', 'Site Manager', 'Operative Representative'], A, W),

          // Footer validity note
          h.spacer(120),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 4 } },
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Valid for one shift only. Reassess if conditions change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),

          // End mark
          ...h.endMark(A),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — QUICK CARD (Amber #B45309 / dark #92400e)
// Cover page + single content page. Section numbering: 1, 2, 3...
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: PowraData): Document {
  const A = AMBER_DARK;
  const LBG = AMBER_BG;
  const LC = AMBER_ACCENT;
  const hdr = h.accentHeader('POWRA Quick Card', AMBER_ACCENT);
  const ftr = h.accentFooter(d.documentRef, 'Quick Card', AMBER_ACCENT);
  const checkCols = [Math.round(W * 0.82), W - Math.round(W * 0.82)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER PAGE ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          h.coverBlock(['POWRA', 'QUICK CARD'], 'STOP \u2192 THINK \u2192 ACT \u2014 Lamination-Ready Field Assessment', AMBER_DARK, 'FDE68A'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', AMBER_ACCENT),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date / Time', value: `${d.date} at ${d.time}` },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractReference },
            { label: 'Location', value: d.location },
          ], AMBER_ACCENT, W),
          h.coverFooterLine(),
        ],
      },
      // ── CONTENT PAGE ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          // STOP → THINK → ACT bands
          h.phaseBand('STOP', RED_D),
          new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Look at the task. What could go wrong?', size: BODY, font: 'Arial', color: RED_D, bold: true })] }),
          h.phaseBand('THINK', AMBER_ACCENT),
          new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'What hazards are present? What controls do you need?', size: BODY, font: 'Arial', color: AMBER_ACCENT, bold: true })] }),
          h.phaseBand('ACT', GREEN),
          new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Put controls in place. Brief the team. Start work safely.', size: BODY, font: 'Arial', color: GREEN, bold: true })] }),

          // 1 TASK & LOCATION
          h.fullWidthSectionBar('1', 'Task & Location', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Task', value: d.taskDescription },
            { label: 'Location', value: d.location },
            { label: 'Assessed By', value: d.assessedBy },
          ], LBG, LC),

          // 2 CONDITIONS CHECK
          h.spacer(120),
          h.fullWidthSectionBar('2', 'Conditions Check', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Weather', value: d.conditions.weather },
            { label: 'Ground', value: d.conditions.groundConditions },
            { label: 'Overhead', value: d.conditions.overhead },
            { label: 'Access', value: d.conditions.accessEgress },
          ], LBG, LC),

          // 3 HAZARD CHECKLIST
          h.spacer(120),
          h.fullWidthSectionBar('3', 'Hazard Checklist', A),
          h.spacer(80),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: checkCols,
            rows: [
              new TableRow({ children: [hdrCell('Hazard', checkCols[0], A), hdrCell('Check', checkCols[1], A)] }),
              ...d.hazardChecklist.map((ci, ri) => new TableRow({ children: [
                txtCell(ci.item, checkCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(ci.checked, checkCols[1]),
              ] })),
            ],
          }),

          // 4 CONTROLS SUMMARY
          h.spacer(120),
          h.fullWidthSectionBar('4', 'Controls Summary', A),
          h.spacer(80),
          ...h.richBodyText(d.controlsSummary || d.hazards.map(hz => hz.controlMeasure).filter(Boolean).join('. ') || 'Controls to be confirmed.'),

          // Warning banner + stop conditions
          h.spacer(120),
          h.warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D, W),
          h.spacer(40),
          ...d.stopConditions.slice(0, 4).map(sc => h.stopConditionLine(sc)),

          // 5 SIGN-OFF
          h.spacer(120),
          h.fullWidthSectionBar('5', 'Sign-Off', A),
          h.spacer(80),
          h.signatureGrid(['Operative', 'Supervisor'], AMBER_ACCENT, W),

          // Footer + end mark
          h.spacer(120),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 4 } },
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Valid for one shift only. Reassess if conditions change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),
          ...h.endMark(AMBER_ACCENT),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — TASK SPECIFIC (Teal #0f766e / dark #134e4a)
// Cover page + content pages. Section numbering: 1.0, 2.0...
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: PowraData): Document {
  const A = TEAL;
  const LBG = TEAL_BG;
  const LC = TEAL;
  const hdr = h.accentHeader('POWRA \u2014 Task Specific', A);
  const ftr = h.accentFooter(d.documentRef, 'Task Specific', A);
  const plantCols = [Math.round(W * 0.24), Math.round(W * 0.12), Math.round(W * 0.24)];
  plantCols.push(W - plantCols[0] - plantCols[1] - plantCols[2]);
  const permitCols = [Math.round(W * 0.20), Math.round(W * 0.24), Math.round(W * 0.24)];
  permitCols.push(W - permitCols[0] - permitCols[1] - permitCols[2]);

  // Build phase sections
  const phaseSections: (Paragraph | Table)[] = [];
  for (const phase of d.taskPhases) {
    phaseSections.push(h.spacer(120));
    phaseSections.push(h.phaseBand(`Phase: ${phase.phase}`, TEAL));
    phaseSections.push(h.spacer(40));
    h.richBodyText(phase.description).forEach(p => phaseSections.push(p));

    if (phase.hazards.length > 0) {
      phaseSections.push(h.spacer(40));
      const phCols = [Math.round(W * 0.18), Math.round(W * 0.14), Math.round(W * 0.09), Math.round(W * 0.38)];
      phCols.push(W - phCols[0] - phCols[1] - phCols[2] - phCols[3]);
      phaseSections.push(new Table({
        width: { size: W, type: WidthType.DXA },
        columnWidths: phCols,
        rows: [
          new TableRow({ children: [hdrCell('Hazard', phCols[0], A), hdrCell('Consequence', phCols[1], A), hdrCell('Risk', phCols[2], A), hdrCell('Control', phCols[3], A), hdrCell('Residual', phCols[4], A)] }),
          ...phase.hazards.map((hz, ri) => new TableRow({ children: [
            txtCell(hz.hazard, phCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(hz.consequence, phCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ragCell(hz.riskBefore, phCols[2]),
            txtCell(hz.controlMeasure, phCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
            ragCell(hz.riskAfter, phCols[4]),
          ] })),
        ],
      }));
    }

    if (phase.plantEquipment) {
      phaseSections.push(new Paragraph({
        spacing: { before: 60, after: 40 }, indent: { left: 0 },
        children: [
          new TextRun({ text: 'Plant/Equipment: ', bold: true, size: BODY, font: 'Arial', color: TEAL }),
          new TextRun({ text: phase.plantEquipment, size: BODY, font: 'Arial' }),
        ],
      }));
    }
    if (phase.permitsRequired) {
      phaseSections.push(new Paragraph({
        spacing: { after: 40 }, indent: { left: 0 },
        children: [
          new TextRun({ text: 'Permits: ', bold: true, size: BODY, font: 'Arial', color: TEAL }),
          new TextRun({ text: phase.permitsRequired, size: BODY, font: 'Arial' }),
        ],
      }));
    }
    if (phase.stopConditions && phase.stopConditions.length > 0) {
      phase.stopConditions.forEach(sc => phaseSections.push(h.stopConditionLine(sc)));
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER PAGE ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          h.coverBlock(['TASK-SPECIFIC', 'RISK ASSESSMENT'], 'POWRA \u2014 Phase-by-Phase Method \u00B7 CDM 2015 \u00B7 MHSW 1999', TEAL_DARK, '99F6E4'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date / Time', value: `${d.date} at ${d.time}` },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractReference },
            { label: 'Client', value: d.clientName },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Location', value: d.location },
            { label: 'RAMS Reference', value: d.ramsReference },
            { label: 'Permits', value: d.permitReferences },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // ── CONTENT PAGES ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          // 1.0 TASK OVERVIEW
          h.fullWidthSectionBar('1.0', 'Task Overview', A),
          h.spacer(80),
          ...h.richBodyText(d.taskDescription || 'Task description to be confirmed.'),
          h.spacer(40),
          accentInfoTable([
            { label: 'RAMS Ref', value: d.ramsReference },
            { label: 'Permits', value: d.permitReferences },
            { label: 'Weather', value: d.conditions.weather },
            { label: 'Ground', value: d.conditions.groundConditions },
          ], LBG, LC),

          // 2.0 PHASE-BY-PHASE RISK ASSESSMENT
          h.spacer(120),
          h.fullWidthSectionBar('2.0', 'Phase-by-Phase Risk Assessment', A),
          ...phaseSections,

          // 3.0 PLANT & EQUIPMENT REGISTER
          h.spacer(120),
          h.fullWidthSectionBar('3.0', 'Plant & Equipment Register', A),
          h.spacer(80),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: plantCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', plantCols[0], A), hdrCell('Checked', plantCols[1], A), hdrCell('Operator', plantCols[2], A), hdrCell('Restrictions', plantCols[3], A)] }),
              ...d.plantRegister.map((pi, ri) => new TableRow({ children: [
                txtCell(pi.item, plantCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(pi.checkCompleted, plantCols[1]),
                txtCell(pi.operator, plantCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(pi.restrictions, plantCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          }),

          // 4.0 PERMITS CROSS-REFERENCE
          h.spacer(120),
          h.fullWidthSectionBar('4.0', 'Permits Cross-Reference', A),
          h.spacer(80),
          ...(d.permitsCrossRef.length > 0 ? [new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: permitCols,
            rows: [
              new TableRow({ children: [hdrCell('Permit Type', permitCols[0], A), hdrCell('Reference', permitCols[1], A), hdrCell('Issuer', permitCols[2], A), hdrCell('Validity', permitCols[3], A)] }),
              ...d.permitsCrossRef.map((pr, ri) => new TableRow({ children: [
                txtCell(pr.type, permitCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(pr.reference, permitCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(pr.issuer, permitCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(pr.validity, permitCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          })] : [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'No additional permits required.', size: BODY, font: 'Arial', italics: true, color: h.GREY_DARK })] })]),

          // 5.0 TEAM BRIEFING & SIGN-ON
          h.spacer(120),
          h.fullWidthSectionBar('5.0', 'Team Briefing & Sign-On', A),
          h.spacer(80),
          teamTable(d.teamSignOn, A),

          // Footer + end mark
          h.spacer(120),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 4 } },
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Reassess at each phase transition and if conditions change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),
          ...h.endMark(A),
        ],
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — SUPERVISOR REVIEW (Navy #1e293b / accent #334155)
// Cover page + content pages. Section numbering: 1.0 through 12.0
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: PowraData): Document {
  const A = NAVY;
  const LBG = NAVY_BG;
  const LC = NAVY_ACCENT;
  const hdr = h.accentHeader('POWRA \u2014 Supervisor Review', A);
  const ftr = h.accentFooter(d.documentRef, 'Supervisor Review', A);

  const compCols = [Math.round(W * 0.46), Math.round(W * 0.14)];
  compCols.push(W - compCols[0] - compCols[1]);
  const monCols = [Math.round(W * 0.26), Math.round(W * 0.18), Math.round(W * 0.24)];
  monCols.push(W - monCols[0] - monCols[1] - monCols[2]);
  const closeCols = [Math.round(W * 0.44), Math.round(W * 0.14)];
  closeCols.push(W - closeCols[0] - closeCols[1]);
  const lessonCols = [Math.round(W * 0.36), Math.round(W * 0.36)];
  lessonCols.push(W - lessonCols[0] - lessonCols[1]);
  const refCols = [Math.round(W * 0.38)];
  refCols.push(W - refCols[0]);

  // Blue callout colours for supervisor notes
  const BLUE_BORDER = '3B82F6';
  const BLUE_BG_LIGHT = 'EFF6FF';
  const BLUE_TEXT = '1E3A5F';
  // Amber callout colours for close-out
  const AMBER_BORDER = 'F59E0B';
  const AMBER_BG_LIGHT = 'FFFBEB';
  const AMBER_TEXT_D = '78350F';

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER PAGE ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          h.coverBlock(['SUPERVISOR REVIEW', 'RISK ASSESSMENT'], 'POWRA \u2014 Audit Layer \u00B7 Competency Verification \u00B7 Close-Out', NAVY, '94A3B8'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Date / Time', value: `${d.date} at ${d.time}` },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractReference },
            { label: 'Client', value: d.clientName },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Location', value: d.location },
            { label: 'RAMS Reference', value: d.ramsReference },
            { label: 'Permits', value: d.permitReferences },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      // ── CONTENT PAGES ──
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr },
        footers: { default: ftr },
        children: [
          // 1.0 TASK DESCRIPTION
          h.fullWidthSectionBar('1.0', 'Task Description', A),
          h.spacer(80),
          ...h.richBodyText(d.taskDescription || 'Task description to be confirmed.'),

          // 2.0 CONDITIONS ASSESSMENT
          h.spacer(120),
          h.fullWidthSectionBar('2.0', 'Conditions Assessment', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Weather', value: d.conditions.weather },
            { label: 'Ground Conditions', value: d.conditions.groundConditions },
            { label: 'Lighting', value: d.conditions.lighting },
            { label: 'Access / Egress', value: d.conditions.accessEgress },
            { label: 'Overhead', value: d.conditions.overhead },
            { label: 'Adjacent Work', value: d.conditions.adjacentWork },
          ], LBG, LC),

          // 3.0 HAZARD IDENTIFICATION & RISK RATING
          h.spacer(120),
          h.fullWidthSectionBar('3.0', 'Hazard Identification & Risk Rating', A),
          h.spacer(80),
          hazardMatrix(d.hazards, A),

          // 4.0 COMPETENCY VERIFICATION
          h.spacer(120),
          h.fullWidthSectionBar('4.0', 'Competency Verification', A),
          h.spacer(80),
          h.calloutBox(
            'All competency checks must be completed and verified before work commences. Any gaps must be resolved \u2014 do not permit work to start until all items are confirmed.',
            BLUE_BORDER, BLUE_BG_LIGHT, BLUE_TEXT, W,
            { boldPrefix: 'Supervisor Duty:' }
          ),
          h.spacer(80),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: compCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', compCols[0], A), hdrCell('Verified', compCols[1], A), hdrCell('Verified By', compCols[2], A)] }),
              ...d.competencyChecks.map((cc, ri) => new TableRow({ children: [
                txtCell(cc.item, compCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(cc.verified, compCols[1]),
                txtCell(cc.verifiedBy, compCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          }),

          // 5.0 PPE & STOP CONDITIONS
          h.spacer(120),
          h.fullWidthSectionBar('5.0', 'PPE & Stop Conditions', A),
          h.spacer(80),
          ...d.ppeRequired.map(ppe => bullet(ppe)),
          h.spacer(80),
          h.warningBanner('IF IN DOUBT \u2014 STOP WORK', RED_BG, RED_D, W),
          h.spacer(40),
          ...d.stopConditions.map(sc => h.stopConditionLine(sc)),

          // 6.0 ENVIRONMENTAL CONSIDERATIONS
          h.spacer(120),
          h.fullWidthSectionBar('6.0', 'Environmental Considerations', A),
          h.spacer(80),
          ...h.richBodyText(d.environmentalConsiderations || 'No specific environmental considerations identified.'),

          // 7.0 MONITORING REQUIREMENTS
          h.spacer(120),
          h.fullWidthSectionBar('7.0', 'Monitoring Requirements', A),
          h.spacer(80),
          ...(d.monitoringItems.length > 0 ? [new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: monCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', monCols[0], A), hdrCell('Frequency', monCols[1], A), hdrCell('Responsibility', monCols[2], A), hdrCell('Action if Exceeded', monCols[3], A)] }),
              ...d.monitoringItems.map((mi, ri) => new TableRow({ children: [
                txtCell(mi.item, monCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(mi.frequency, monCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(mi.responsibility, monCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(mi.action, monCols[3], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          })] : []),

          // 8.0 TEAM BRIEFING & SIGN-ON
          h.spacer(120),
          h.fullWidthSectionBar('8.0', 'Team Briefing & Sign-On', A),
          h.spacer(80),
          h.calloutBox(
            'I confirm I have been briefed on this POWRA, understand the hazards, controls, stop conditions, and emergency procedures. I will report any changes, concerns, or near misses immediately to my supervisor.',
            BLUE_BORDER, BLUE_BG_LIGHT, BLUE_TEXT, W,
            { boldPrefix: 'Declaration:' }
          ),
          h.spacer(80),
          teamTable(d.teamSignOn, A),

          // 9.0 CLOSE-OUT VERIFICATION
          h.spacer(120),
          h.fullWidthSectionBar('9.0', 'Close-Out Verification', A),
          h.spacer(80),
          h.calloutBox(
            'All close-out items must be completed and signed before the workforce leaves site. Any incomplete items must be recorded and handed over to the incoming shift supervisor.',
            AMBER_BORDER, AMBER_BG_LIGHT, AMBER_TEXT_D, W,
            { boldPrefix: 'Supervisor Note:' }
          ),
          h.spacer(80),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: closeCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', closeCols[0], A), hdrCell('Done', closeCols[1], A), hdrCell('Signed By', closeCols[2], A)] }),
              ...d.closeOutItems.map((ci, ri) => new TableRow({ children: [
                txtCell(ci.item, closeCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                checkCell(ci.completed, closeCols[1]),
                txtCell(ci.signedBy, closeCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          }),

          // 10.0 LESSONS LEARNED
          h.spacer(120),
          h.fullWidthSectionBar('10.0', 'Lessons Learned', A),
          h.spacer(80),
          ...(d.lessonsLearned.length > 0 ? [new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: lessonCols,
            rows: [
              new TableRow({ children: [hdrCell('Finding', lessonCols[0], A), hdrCell('Action', lessonCols[1], A), hdrCell('Responsible', lessonCols[2], A)] }),
              ...d.lessonsLearned.map((ll, ri) => new TableRow({ children: [
                txtCell(ll.finding, lessonCols[0], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ll.action, lessonCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(ll.responsible, lessonCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          })] : []),

          // 11.0 REGULATORY REFERENCES
          h.spacer(120),
          h.fullWidthSectionBar('11.0', 'Regulatory References', A),
          h.spacer(80),
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: refCols,
            rows: [
              new TableRow({ children: [hdrCell('Reference', refCols[0], A), hdrCell('Description', refCols[1], A)] }),
              ...d.regulatoryReferences.map((rr, ri) => new TableRow({ children: [
                txtCell(rr.reference, refCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(rr.description, refCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ],
          }),

          // 12.0 SIGN-OFF
          h.spacer(120),
          h.fullWidthSectionBar('12.0', 'Sign-Off', A),
          h.spacer(80),
          h.signatureGrid(['Assessor', 'Supervisor', 'Site Manager', 'Client Representative'], A, W),

          // File retention callout
          h.spacer(120),
          h.calloutBox(
            'This POWRA must be retained on file for a minimum of 3 years in accordance with CDM 2015 Regulation 12(5) and the site document control procedure DCP-001. Monthly review by H&S Manager. Immediate review after any incident, near miss, or change in scope.',
            BLUE_BORDER, BLUE_BG_LIGHT, BLUE_TEXT, W,
            { boldPrefix: 'File Retention:' }
          ),

          // Footer + end mark
          h.spacer(120),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 4 } },
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Retain on file for minimum 3 years. Review monthly or after incident.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
          }),
          ...h.endMark(A),
        ],
      },
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
