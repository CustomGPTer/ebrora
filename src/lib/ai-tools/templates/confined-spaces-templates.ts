// =============================================================================
// Confined Spaces Assessment Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard  (green #059669, 13 sections, comprehensive, ~4pp)
// T2 — Red Danger        (red #DC2626/#991B1B, hazard-first, IDLH callouts, ~3pp)
// T3 — Permit Style      (amber #92400E, checklist + blank entry logs, ~3pp)
// T4 — Rescue Focused    (teal #0f766e, expanded rescue plan + equipment, ~3pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ConfinedSpacesTemplateSlug } from '@/lib/confined-spaces/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'ECFDF5';
const RED = 'DC2626'; const RED_DK = '991B1B'; const RED_SUB = 'FCA5A5'; const RED_BG = 'FEF2F2';
const AMBER_O = '92400E'; const AMBER_SUB = 'FDE68A'; const AMBER_BG = 'FFFBEB';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4'; const TEAL_BG = 'f0fdfa';
const AMBER = 'D97706'; const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ───────────────────────────────────────────────────────────
interface CsData {
  documentRef: string; assessmentDate: string; reviewDate: string; assessedBy: string;
  projectName: string; siteAddress: string; contractor: string;
  spaceName: string; classification: string; accessType: string; task: string; maxDuration: string;
  spaceIdentification: Array<{ label: string; value: string }>;
  hazards: Array<{ category: string; hazard: string; source: string; severity: string; likelihood: string }>;
  adjacentSpaces: Array<{ space: string; connection: string; isolationMethod: string; gasMigrationRisk: string; status: string }>;
  gasReadings: Array<{ date: string; o2: string; h2s: string; lel: string; co: string; conditions: string; recordedBy: string }>;
  atmosphericParams: Array<{ parameter: string; alarmLevel: string; evacuateLevel: string; instrument: string; action: string }>;
  isolationMatrix: Array<{ system: string; method: string; isolationPoint: string; verifiedBy: string; lockOff: string }>;
  simops: Array<{ activity: string; impact: string; control: string; risk: string; acceptable: string }>;
  entryProcedure: Array<{ step: string; action: string; responsibility: string; verification: string }>;
  durationLimits: string;
  rescuePlan: string;
  ppeEquipment: Array<{ item: string; specification: string; standard: string; mandatory: string }>;
  competencyRequirements: Array<{ role: string; training: string; evidence: string; refresher: string }>;
  regulatoryReferences: string;
  // T2 Red Danger fields
  dangerBoxes: Array<{ title: string; body: string }>;
  controlsSummary: string;
  rescuerFatalityWarning: string;
  // T3 Permit fields
  preEntryChecklist: string[];
  authorisationChain: Array<{ role: string; name: string }>;
  permitCancellation: Array<{ label: string; value: string }>;
  // T4 Rescue fields
  rescueSteps: Array<{ step: string; action: string; responsibility: string; timeTarget: string; equipment: string }>;
  extractionMethod: string;
  multiCasualtyDecisions: Array<{ scenario: string; action: string; limitation: string }>;
  frsDetails: Array<{ label: string; value: string }>;
  hospitalDetails: Array<{ label: string; value: string }>;
  rescueEquipment: Array<{ equipment: string; specification: string; standard: string; location: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CsData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef', 'CS-001'), assessmentDate: s('assessmentDate'), reviewDate: s('reviewDate'),
    assessedBy: s('assessedBy'), projectName: s('projectName'), siteAddress: s('siteAddress'),
    contractor: s('contractor'), spaceName: s('spaceName'), classification: s('classification'),
    accessType: s('accessType'), task: s('task'), maxDuration: s('maxDuration'),
    spaceIdentification: a('spaceIdentification'), hazards: a('hazards'),
    adjacentSpaces: a('adjacentSpaces'), gasReadings: a('gasReadings'),
    atmosphericParams: a('atmosphericParams'), isolationMatrix: a('isolationMatrix'),
    simops: a('simops'), entryProcedure: a('entryProcedure'),
    durationLimits: s('durationLimits'), rescuePlan: s('rescuePlan'),
    ppeEquipment: a('ppeEquipment'), competencyRequirements: a('competencyRequirements'),
    regulatoryReferences: s('regulatoryReferences'),
    dangerBoxes: a('dangerBoxes'), controlsSummary: s('controlsSummary'),
    rescuerFatalityWarning: s('rescuerFatalityWarning'),
    preEntryChecklist: a('preEntryChecklist'), authorisationChain: a('authorisationChain'),
    permitCancellation: a('permitCancellation'),
    rescueSteps: a('rescueSteps'), extractionMethod: s('extractionMethod'),
    multiCasualtyDecisions: a('multiCasualtyDecisions'),
    frsDetails: a('frsDetails'), hospitalDetails: a('hospitalDetails'),
    rescueEquipment: a('rescueEquipment'), additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, color: opts?.color, fontSize: SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('high') || low.includes('non') || low.includes('exceeds')) { bg = RED_BG; color = RED; }
  else if (low.includes('medium') || low.includes('partial') || low.includes('near')) { bg = AMBER_BG; color = AMBER; }
  else if (low.includes('low') || low.includes('yes') || low.includes('within') || low.includes('compliant')) { bg = 'D1FAE5'; color = GREEN; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function blankCell(width: number): TableCell {
  const dashed = { style: BorderStyle.DASHED, size: 1, color: 'CCCCCC' };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: dashed, bottom: dashed, left: dashed, right: dashed },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '', size: SM })] })],
  });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(h2 => h2.width),
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined })
        ),
      })),
    ],
  });
}
function blankTable(accent: string, headers: { text: string; width: number }[], rowCount: number): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(h2 => h2.width),
    rows: [
      new TableRow({ children: headers.map(h2 => hdrCell(h2.text, h2.width, accent)) }),
      ...Array.from({ length: rowCount }, () => new TableRow({ children: headers.map(h2 => blankCell(h2.width)) })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const widths = ratios.map(r => Math.round(W * r));
  widths[widths.length - 1] = W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return widths;
}
function dangerBox(title: string, body: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { fill: RED_BG, type: ShadingType.CLEAR },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: RED }, bottom: { style: BorderStyle.SINGLE, size: 4, color: RED }, left: { style: BorderStyle.SINGLE, size: 4, color: RED }, right: { style: BorderStyle.SINGLE, size: 4, color: RED } },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `\u26A0 ${title}`, bold: true, size: LG, font: 'Arial', color: RED_DK })] }),
        ...h.richBodyText(body),
      ],
    })] })],
  });
}
function checklistItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 }, indent: { left: 200 },
    children: [new TextRun({ text: `\u2610  ${text}`, size: SM, font: 'Arial' })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CsData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Confined Space Risk Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  const hazCols = cols([0.16, 0.18, 0.28, 0.16, 0.22]);
  const adjCols = cols([0.18, 0.18, 0.26, 0.18, 0.20]);
  const gasCols = cols([0.12, 0.08, 0.10, 0.08, 0.08, 0.34, 0.20]);
  const atmCols = cols([0.16, 0.18, 0.16, 0.22, 0.28]);
  const isoCols = cols([0.18, 0.26, 0.20, 0.20, 0.16]);
  const simCols = cols([0.20, 0.24, 0.26, 0.12, 0.18]);
  const entCols = cols([0.06, 0.38, 0.20, 0.36]);
  const ppeCols = cols([0.28, 0.30, 0.16, 0.26]);
  const compCols = cols([0.20, 0.30, 0.26, 0.24]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CONFINED SPACE', 'RISK ASSESSMENT'], d.spaceName ? `${d.spaceName} \u2014 ${d.projectName}` : d.projectName || '', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef }, { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate }, { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName }, { label: 'Site Address', value: d.siteAddress },
            { label: 'Space Name', value: d.spaceName }, { label: 'Classification', value: d.classification },
            { label: 'Access Type', value: d.accessType }, { label: 'Task', value: d.task },
            { label: 'Maximum Entry Duration', value: d.maxDuration },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Space ID, Hazards, Adjacent, Gas Readings
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'SPACE IDENTIFICATION & CLASSIFICATION', A), h.spacer(80),
          ...(d.spaceIdentification.length > 0 ? [h.coverInfoTable(d.spaceIdentification, A, W)] : []),
          h.spacer(80), h.fullWidthSectionBar('02', 'HAZARD IDENTIFICATION', A), h.spacer(80),
          ...(d.hazards.length > 0 ? [dataTable(A,
            [{ text: 'CATEGORY', width: hazCols[0] }, { text: 'HAZARD', width: hazCols[1] }, { text: 'SOURCE', width: hazCols[2] }, { text: 'SEVERITY', width: hazCols[3] }, { text: 'LIKELIHOOD', width: hazCols[4] }],
            d.hazards.map(hz => [hz.category, hz.hazard, hz.source, hz.severity, hz.likelihood]), [3, 4]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('03', 'ADJACENT & CONNECTED SPACES', A), h.spacer(80),
          ...(d.adjacentSpaces.length > 0 ? [dataTable(A,
            [{ text: 'SPACE', width: adjCols[0] }, { text: 'CONNECTION', width: adjCols[1] }, { text: 'ISOLATION METHOD', width: adjCols[2] }, { text: 'GAS MIGRATION', width: adjCols[3] }, { text: 'STATUS', width: adjCols[4] }],
            d.adjacentSpaces.map(a => [a.space, a.connection, a.isolationMethod, a.gasMigrationRisk, a.status]), [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'HISTORICAL GAS READINGS', A), h.spacer(80),
          ...(d.gasReadings.length > 0 ? [dataTable(A,
            [{ text: 'DATE', width: gasCols[0] }, { text: 'O\u2082 (%)', width: gasCols[1] }, { text: 'H\u2082S (ppm)', width: gasCols[2] }, { text: 'LEL (%)', width: gasCols[3] }, { text: 'CO (ppm)', width: gasCols[4] }, { text: 'CONDITIONS', width: gasCols[5] }, { text: 'RECORDED BY', width: gasCols[6] }],
            d.gasReadings.map(g => [g.date, g.o2, g.h2s, g.lel, g.co, g.conditions, g.recordedBy])
          )] : []),
          h.spacer(40),
          h.calloutBox('H\u2082S readings have exceeded the 10 ppm WEL on multiple occasions. Continuous atmospheric monitoring with audible alarm is mandatory for all entries.', AMBER, AMBER_BG, '92400E', W, { boldPrefix: 'Historical Reading Note:' }),
        ] },
      // Body — Atmospheric, Isolation, SIMOPS, Entry Procedure
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('05', 'ATMOSPHERIC MONITORING PARAMETERS', A), h.spacer(80),
          ...(d.atmosphericParams.length > 0 ? [dataTable(A,
            [{ text: 'PARAMETER', width: atmCols[0] }, { text: 'ALARM LEVEL', width: atmCols[1] }, { text: 'EVACUATE LEVEL', width: atmCols[2] }, { text: 'INSTRUMENT', width: atmCols[3] }, { text: 'ACTION', width: atmCols[4] }],
            d.atmosphericParams.map(a => [a.parameter, a.alarmLevel, a.evacuateLevel, a.instrument, a.action])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('06', 'ISOLATION MATRIX', A), h.spacer(80),
          ...(d.isolationMatrix.length > 0 ? [dataTable(A,
            [{ text: 'SYSTEM', width: isoCols[0] }, { text: 'METHOD', width: isoCols[1] }, { text: 'ISOLATION POINT', width: isoCols[2] }, { text: 'VERIFIED BY', width: isoCols[3] }, { text: 'LOCK-OFF', width: isoCols[4] }],
            d.isolationMatrix.map(i => [i.system, i.method, i.isolationPoint, i.verifiedBy, i.lockOff])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('07', 'SIMOPS ASSESSMENT', A), h.spacer(80),
          ...(d.simops.length > 0 ? [dataTable(A,
            [{ text: 'ADJACENT ACTIVITY', width: simCols[0] }, { text: 'POTENTIAL IMPACT', width: simCols[1] }, { text: 'CONTROL', width: simCols[2] }, { text: 'RISK', width: simCols[3] }, { text: 'ACCEPTABLE?', width: simCols[4] }],
            d.simops.map(s => [s.activity, s.impact, s.control, s.risk, s.acceptable]), [3, 4]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('08', 'ENTRY PROCEDURE & CONTROLS', A), h.spacer(80),
          ...(d.entryProcedure.length > 0 ? [dataTable(A,
            [{ text: 'STEP', width: entCols[0] }, { text: 'ACTION', width: entCols[1] }, { text: 'RESPONSIBILITY', width: entCols[2] }, { text: 'VERIFICATION', width: entCols[3] }],
            d.entryProcedure.map(e => [e.step, e.action, e.responsibility, e.verification])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('09', 'DURATION LIMITS & HEAT STRESS', A), h.spacer(80),
          ...h.richBodyText(d.durationLimits || ''),
        ] },
      // Body — Rescue, PPE, Competency, Refs, Sign-off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('10', 'RESCUE PLAN SUMMARY', A), h.spacer(80),
          ...h.richBodyText(d.rescuePlan || ''),
          h.spacer(80), h.fullWidthSectionBar('11', 'PPE & EQUIPMENT REQUIREMENTS', A), h.spacer(80),
          ...(d.ppeEquipment.length > 0 ? [dataTable(A,
            [{ text: 'ITEM', width: ppeCols[0] }, { text: 'SPECIFICATION', width: ppeCols[1] }, { text: 'STANDARD', width: ppeCols[2] }, { text: 'MANDATORY', width: ppeCols[3] }],
            d.ppeEquipment.map(p => [p.item, p.specification, p.standard, p.mandatory]), [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('12', 'COMPETENCY REQUIREMENTS', A), h.spacer(80),
          ...(d.competencyRequirements.length > 0 ? [dataTable(A,
            [{ text: 'ROLE', width: compCols[0] }, { text: 'REQUIRED TRAINING', width: compCols[1] }, { text: 'EVIDENCE', width: compCols[2] }, { text: 'REFRESHER', width: compCols[3] }],
            d.competencyRequirements.map(c => [c.role, c.training, c.evidence, c.refresher])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('13', 'REGULATORY REFERENCES', A), h.spacer(80),
          ...h.richBodyText(d.regulatoryReferences || 'Confined Spaces Regulations 1997. HSE ACOP L101. EH40/2005. COSHH 2002. WAH Regs 2005. PUWER 1998.'),
          h.spacer(80),
          h.signatureGrid(['Assessed By', 'Approved By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — RED DANGER (#DC2626 / #991B1B)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CsData): Document {
  const A = RED;
  const hdr = h.accentHeader('Confined Space Risk Assessment \u2014 RED DANGER', A);
  const ftr = h.accentFooter(d.documentRef, 'Red Danger', A);
  const gasCols6 = cols([0.14, 0.10, 0.14, 0.10, 0.10, 0.42]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['\u26A0 CONFINED SPACE', 'RISK ASSESSMENT'], d.classification ? d.classification.toUpperCase() : 'MEDIUM RISK \u2014 SPECIFIED RISK SPACE', RED_DK, RED_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Space', value: d.spaceName }, { label: 'Classification', value: d.classification },
            { label: 'Primary Hazards', value: d.hazards.map(hz => hz.hazard).join(' \u00B7 ') },
            { label: 'Contractor', value: d.contractor }, { label: 'CS Supervisor', value: d.assessedBy },
            { label: 'Max Entry Duration', value: d.maxDuration },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Danger banner, danger boxes, gas readings, controls
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.warningBanner('DANGER \u2014 IMMEDIATELY DANGEROUS TO LIFE OR HEALTH (IDLH) ATMOSPHERE POSSIBLE', RED_DK, 'FFFFFF', W),
          h.spacer(80),
          ...(d.dangerBoxes.length > 0
            ? d.dangerBoxes.flatMap(db => [dangerBox(db.title, db.body), h.spacer(60)])
            : d.hazards.slice(0, 4).flatMap(hz => [dangerBox(`${hz.hazard} \u2014 ${hz.category}`, hz.source), h.spacer(60)])),
          h.spacer(40),
          h.calloutBox(
            d.rescuerFatalityWarning || '"Over half of those who die in confined spaces are people who try to rescue without proper equipment and training." NEVER enter to attempt rescue without SCBA and a trained rescue team.',
            RED, RED_BG, RED_DK, W, { boldPrefix: 'Rescuer Fatality Warning (ACOP L101, \u00A7129):' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'HISTORICAL GAS READINGS \u2014 SEVERITY HIGHLIGHTED', RED_DK), h.spacer(80),
          ...(d.gasReadings.length > 0 ? [dataTable(RED_DK,
            [{ text: 'DATE', width: gasCols6[0] }, { text: 'O\u2082', width: gasCols6[1] }, { text: 'H\u2082S', width: gasCols6[2] }, { text: 'LEL', width: gasCols6[3] }, { text: 'CO', width: gasCols6[4] }, { text: 'SEVERITY', width: gasCols6[5] }],
            d.gasReadings.map(g => [g.date, g.o2, g.h2s, g.lel, g.co, g.conditions]),
            [5]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'CONTROL MEASURES SUMMARY', RED_DK), h.spacer(80),
          ...h.richBodyText(d.controlsSummary || ''),
          h.spacer(80),
          h.signatureGrid(['CS Supervisor', 'H&S Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — PERMIT STYLE (Amber #92400E)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CsData): Document {
  const A = AMBER_O;
  const hdr = h.accentHeader('Confined Space Entry Permit', A);
  const ftr = h.accentFooter(d.documentRef, 'Permit Style', A);

  const gasBlankCols = cols([0.22, 0.18, 0.15, 0.15, 0.15, 0.15]);
  const retestCols = cols([0.12, 0.12, 0.14, 0.12, 0.12, 0.22, 0.16]);
  const entryCols = cols([0.20, 0.16, 0.14, 0.14, 0.16, 0.20]);
  const authCols = cols([0.34, 0.26, 0.22, 0.18]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CONFINED SPACE', 'ENTRY PERMIT &', 'RISK ASSESSMENT'], d.spaceName ? `${d.spaceName} \u2014 ${d.projectName}` : d.projectName || '', A, AMBER_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Permit Number', value: d.documentRef },
            { label: 'Date of Issue', value: d.assessmentDate },
            { label: 'Valid Until', value: `${d.assessmentDate}, 17:00 hrs (single shift)` },
            { label: 'Space', value: d.spaceName }, { label: 'Task', value: d.task },
            { label: 'Classification', value: d.classification },
            { label: 'Contractor', value: d.contractor }, { label: 'CS Supervisor', value: d.assessedBy },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Checklist, gas tests, entry log, authorisation, cancellation
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'PRE-ENTRY CHECKLIST \u2014 ALL ITEMS MUST BE CONFIRMED BEFORE ENTRY', A), h.spacer(60),
          ...(d.preEntryChecklist.length > 0
            ? d.preEntryChecklist.map(item => checklistItem(item))
            : [checklistItem('Risk assessment reviewed and briefed to all entry team'),
               checklistItem('All isolations verified and LOTO confirmed'),
               checklistItem('Weather check completed'),
               checklistItem('Forced ventilation running \u226515 minutes'),
               checklistItem('Pre-entry gas test at 3 depths \u2014 all within limits'),
               checklistItem('Tripod and rescue winch erected and tested'),
               checklistItem('Rescue team briefed, equipped with SCBA, on standby'),
               checklistItem('First aider identified and kit at entry point'),
               checklistItem('Fire service pre-notified'),
               checklistItem('Communications tested'),
               checklistItem('All entrants in full PPE \u2014 harness, RPE, hard hat, gloves'),
               checklistItem('Personal 4-gas monitors calibrated and bump-tested'),
               checklistItem('LEV positioned at work point'),
               checklistItem('Decontamination station set up'),
               checklistItem('Entry duration timer set'),
              ]),
          h.spacer(80), h.fullWidthSectionBar('', 'GAS TEST RESULTS \u2014 PRE-ENTRY (3 DEPTHS)', A), h.spacer(80),
          blankTable(A,
            [{ text: 'PARAMETER', width: gasBlankCols[0] }, { text: 'ACCEPTABLE', width: gasBlankCols[1] }, { text: 'TOP (0.5m)', width: gasBlankCols[2] }, { text: 'MIDDLE', width: gasBlankCols[3] }, { text: 'FLOOR', width: gasBlankCols[4] }, { text: 'RESULT', width: gasBlankCols[5] }],
            4
          ),
          h.bodyText('Tested by: __________ \u00A0 Monitor S/N: __________ \u00A0 Last calibration: __________ \u00A0 Time: __________', SM),
          h.spacer(80), h.fullWidthSectionBar('', '30-MINUTE PERIODIC RE-TEST LOG', A), h.spacer(80),
          blankTable(A,
            [{ text: 'TIME', width: retestCols[0] }, { text: 'O\u2082 (%)', width: retestCols[1] }, { text: 'H\u2082S (ppm)', width: retestCols[2] }, { text: 'LEL (%)', width: retestCols[3] }, { text: 'CO (ppm)', width: retestCols[4] }, { text: 'ACTION', width: retestCols[5] }, { text: 'INITIALS', width: retestCols[6] }],
            4
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'PERSONNEL ENTRY / EXIT LOG', A), h.spacer(80),
          blankTable(A,
            [{ text: 'NAME', width: entryCols[0] }, { text: 'ROLE', width: entryCols[1] }, { text: 'TIME IN', width: entryCols[2] }, { text: 'TIME OUT', width: entryCols[3] }, { text: 'DURATION', width: entryCols[4] }, { text: 'SIGNATURE', width: entryCols[5] }],
            4
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'AUTHORISATION CHAIN', A), h.spacer(80),
          ...(d.authorisationChain.length > 0 ? [dataTable(A,
            [{ text: 'ROLE', width: authCols[0] }, { text: 'NAME', width: authCols[1] }, { text: 'SIGNATURE', width: authCols[2] }, { text: 'DATE / TIME', width: authCols[3] }],
            d.authorisationChain.map((a, i) => [`${i + 1}. ${a.role}`, a.name, '', ''])
          )] : [blankTable(A,
            [{ text: 'ROLE', width: authCols[0] }, { text: 'NAME', width: authCols[1] }, { text: 'SIGNATURE', width: authCols[2] }, { text: 'DATE / TIME', width: authCols[3] }],
            5
          )]),
          h.spacer(80), h.fullWidthSectionBar('', 'PERMIT CANCELLATION / HANDBACK', A), h.spacer(80),
          h.coverInfoTable([
            { label: 'Work Completed?', value: '\u2610 Yes \u00A0\u00A0 \u2610 No \u2014 Resumed under new permit: __________' },
            { label: 'All Personnel Evacuated?', value: '\u2610 Yes \u00A0\u00A0 Headcount confirmed by: __________' },
            { label: 'Equipment Removed?', value: '\u2610 Yes \u00A0\u00A0 \u2610 N/A' },
            { label: 'Manhole Cover Secured?', value: '\u2610 Yes' },
            { label: 'Isolations Removed?', value: '\u2610 Yes \u00A0\u00A0 \u2610 No \u2014 Reason: __________' },
            { label: 'Permit Cancelled By', value: 'Name: __________ \u00A0 Signature: __________ \u00A0 Time: __________' },
          ], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — RESCUE FOCUSED (Teal #0f766e)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CsData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('Confined Space \u2014 Rescue Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Rescue Focused', A);

  const resCols = cols([0.06, 0.28, 0.16, 0.12, 0.38]);
  const mcCols = cols([0.24, 0.42, 0.34]);
  const eqCols = cols([0.22, 0.30, 0.16, 0.32]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CONFINED SPACE', 'ASSESSMENT &', 'RESCUE PLAN'], d.spaceName ? `${d.spaceName} \u2014 ${d.projectName}` : d.projectName || '', A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Space', value: `${d.spaceName} \u2014 ${d.accessType}, ${d.maxDuration ? d.maxDuration + ' max' : ''}` },
            { label: 'Classification', value: d.classification }, { label: 'Contractor', value: d.contractor },
            ...(d.hospitalDetails.length > 0 ? [{ label: 'Nearest A&E', value: d.hospitalDetails[0]?.value || '' }] : []),
            ...(d.frsDetails.length > 0 ? [{ label: 'FRS Response', value: d.frsDetails[0]?.value || '' }] : []),
            { label: 'Rescue Method', value: d.rescueSteps.length > 0 ? 'Winch extraction' : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Rescue Steps, Extraction, Multi-Casualty, FRS/Hospital, Equipment
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'RESCUE PROCEDURE \u2014 STEP SEQUENCE', A), h.spacer(80),
          ...(d.rescueSteps.length > 0 ? [dataTable(A,
            [{ text: 'STEP', width: resCols[0] }, { text: 'ACTION', width: resCols[1] }, { text: 'RESPONSIBILITY', width: resCols[2] }, { text: 'TIME', width: resCols[3] }, { text: 'EQUIPMENT', width: resCols[4] }],
            d.rescueSteps.map(r => [r.step, r.action, r.responsibility, r.timeTarget, r.equipment])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'EXTRACTION METHOD \u2014 SPECIFIC PROCEDURE', A), h.spacer(80),
          ...h.richBodyText(d.extractionMethod || d.rescuePlan || ''),
          h.spacer(80), h.fullWidthSectionBar('', 'MULTIPLE CASUALTY DECISION TREE', A), h.spacer(80),
          ...(d.multiCasualtyDecisions.length > 0 ? [dataTable(A,
            [{ text: 'SCENARIO', width: mcCols[0] }, { text: 'ACTION', width: mcCols[1] }, { text: 'LIMITATION', width: mcCols[2] }],
            d.multiCasualtyDecisions.map(m => [m.scenario, m.action, m.limitation])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'FRS PRE-NOTIFICATION & HOSPITAL ROUTE', A), h.spacer(80),
          ...(d.frsDetails.length > 0 ? [h.coverInfoTable(d.frsDetails, A, W), h.spacer(40)] : []),
          ...(d.hospitalDetails.length > 0 ? [h.coverInfoTable(d.hospitalDetails, A, W)] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'RESCUE EQUIPMENT INVENTORY', A), h.spacer(80),
          ...(d.rescueEquipment.length > 0 ? [dataTable(A,
            [{ text: 'EQUIPMENT', width: eqCols[0] }, { text: 'SPECIFICATION', width: eqCols[1] }, { text: 'STANDARD', width: eqCols[2] }, { text: 'LOCATION', width: eqCols[3] }],
            d.rescueEquipment.map(e => [e.equipment, e.specification, e.standard, e.location])
          )] : []),
          h.spacer(40),
          h.calloutBox(
            'A rescue drill must be conducted at the start of the first entry day before any live entry commences. The drill must include tripod/winch deployment, SCBA donning, simulated casualty extraction, and communication cascade test.',
            A, TEAL_BG, '134e4a', W, { boldPrefix: 'Rescue Drill Requirement:' }
          ),
          h.spacer(80),
          h.signatureGrid(['CS Supervisor', 'Rescue Team Leader'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
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
