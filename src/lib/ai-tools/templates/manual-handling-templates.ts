// =============================================================================
// MANUAL HANDLING ASSESSMENT — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, TILE methodology, ~3pp)
// T2 — MAC Assessment     (amber #D97706, HSE MAC scoring, ~2pp)
// T3 — RAPP Assessment    (teal #0f766e, pushing/pulling, ~2pp)
// T4 — Training Briefing  (navy #1e293b, compact training doc, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ManualHandlingTemplateSlug } from '@/lib/manual-handling/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0';
const AMBER_D = '92400E'; const AMBER = 'D97706'; const AMBER_SUB = 'FDE68A';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4';
const NAVY = '1e293b'; const NAVY_SUB = '93C5FD';
const BLUE = '2563EB'; const PURPLE = '7C3AED';
const RED = 'DC2626'; const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ────────────────────────────────────────────────────────────
interface MhData {
  documentRef: string; assessmentDate: string; reviewDate: string;
  assessedBy: string; projectName: string; siteAddress: string;
  taskDescription: string; methodology: string; residualRisk: string;
  tileTask: Array<{ factor: string; assessment: string; risk: string }>;
  tileIndividual: Array<{ factor: string; assessment: string; risk: string }>;
  tileLoad: Array<{ factor: string; assessment: string; risk: string }>;
  tileEnvironment: Array<{ factor: string; assessment: string; risk: string }>;
  controls: Array<{ level: string; control: string; implementation: string }>;
  residualKpis: Array<{ value: string; label: string; sublabel?: string }>;
  macFactors: Array<{ factor: string; assessment: string; band: string; score: string }>;
  macTotal: string; macRedCount: string; macAmberCount: string; macGreenCount: string;
  macInterpretation: string;
  improvements: Array<{ factor: string; improvement: string; scoreChange: string }>;
  revisedMacScore: string;
  rappFactors: Array<{ factor: string; assessment: string; band: string; score: string }>;
  rappTotal: string; rappRedCount: string; rappAmberCount: string;
  rappOutcome: string;
  trainingRules: Array<{ rule: string; detail: string }>;
  liftingTechnique: string;
  regulatoryRefs: string; additionalNotes: string;
  monitoringNote: string;
  [key: string]: any;
}

function extract(c: any): MhData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  const tile = c?.tileAssessment || {};
  const mac = c?.macScoring || {};
  const rapp = c?.rappScoring || {};
  return {
    documentRef: s('documentRef', 'MH-001'), assessmentDate: s('assessmentDate') || s('planDate'),
    reviewDate: s('reviewDate'), assessedBy: s('assessedBy') || s('preparedBy'),
    projectName: s('projectName'), siteAddress: s('siteAddress'),
    taskDescription: s('taskDescription'), methodology: s('methodology') || 'TILE',
    residualRisk: s('residualRisk'),
    tileTask: a('tileTask').length > 0 ? a('tileTask') : (tile.task || []),
    tileIndividual: a('tileIndividual').length > 0 ? a('tileIndividual') : (tile.individual || []),
    tileLoad: a('tileLoad').length > 0 ? a('tileLoad') : (tile.load || []),
    tileEnvironment: a('tileEnvironment').length > 0 ? a('tileEnvironment') : (tile.environment || []),
    controls: a('controls').length > 0 ? a('controls') : a('hierarchyOfControl'),
    residualKpis: a('residualKpis'),
    macFactors: a('macFactors').length > 0 ? a('macFactors') : (mac.factors || []),
    macTotal: s('macTotal') || mac.total || '', macRedCount: s('macRedCount') || mac.redCount || '',
    macAmberCount: s('macAmberCount') || mac.amberCount || '', macGreenCount: s('macGreenCount') || mac.greenCount || '',
    macInterpretation: s('macInterpretation') || mac.interpretation || '',
    improvements: a('improvements').length > 0 ? a('improvements') : a('priorityImprovements'),
    revisedMacScore: s('revisedMacScore') || mac.revisedScore || '',
    rappFactors: a('rappFactors').length > 0 ? a('rappFactors') : (rapp.factors || []),
    rappTotal: s('rappTotal') || rapp.total || '', rappRedCount: s('rappRedCount') || rapp.redCount || '',
    rappAmberCount: s('rappAmberCount') || rapp.amberCount || '',
    rappOutcome: s('rappOutcome') || rapp.outcome || '',
    trainingRules: a('trainingRules').length > 0 ? a('trainingRules') : a('keyRules'),
    liftingTechnique: s('liftingTechnique') || s('correctTechnique'),
    regulatoryRefs: s('regulatoryReferences') || (a('regulatoryReferences').map((r: any) => `${r.reference} — ${r.description}`).join('. ')),
    additionalNotes: s('additionalNotes'), monitoringNote: s('monitoringNote'),
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function hdrC(text: string, width: number, accent: string): TableCell { return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM }); }
function txtC(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell { return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color }); }
function ragC(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('high') || low.includes('red') || low === 'r') { bg = 'FEF2F2'; color = RED; }
  else if (low.includes('medium') || low.includes('amber') || low === 'a') { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('low') || low.includes('green') || low === 'g') { bg = 'D1FAE5'; color = '059669'; }
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
          txtC(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined, bold: String(cell||'').includes('REVISED') })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] { const w = ratios.map(r => Math.round(W * r)); w[w.length - 1] = W - w.slice(0, -1).reduce((a2, b) => a2 + b, 0); return w; }

// TILE block letter + label
function tileLabel(letter: string, label: string, color: string): Paragraph {
  return new Paragraph({ spacing: { before: 200, after: 60 }, children: [
    new TextRun({ text: ` ${letter} `, bold: true, size: 24, font: 'Arial', color: 'FFFFFF', shading: { type: ShadingType.CLEAR, fill: color } }),
    new TextRun({ text: `  ${label}`, bold: true, size: 20, font: 'Arial', color }),
  ] });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669, TILE, ~3pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: MhData): Document {
  const A = GREEN;
  const hdr2 = h.accentHeader('Manual Handling Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);
  const tileCols = cols([0.26, 0.52, 0.22]);
  const ctrlCols = cols([0.18, 0.38, 0.44]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['MANUAL HANDLING', 'RISK ASSESSMENT'], d.taskDescription?.slice(0, 80) || d.projectName || '', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate }, { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Task', value: d.taskDescription?.slice(0, 100) || '' },
            { label: 'Methodology', value: d.methodology },
            { label: 'Residual Risk', value: d.residualRisk },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body page 1 — Task Description + TILE
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'TASK DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(d.taskDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('02', 'TILE ASSESSMENT', A), h.spacer(40),
          // T — Task
          tileLabel('T', 'TASK', A),
          ...(d.tileTask.length > 0 ? [dTable(A, [{ text: 'FACTOR', width: tileCols[0] }, { text: 'ASSESSMENT', width: tileCols[1] }, { text: 'RISK', width: tileCols[2] }], d.tileTask.map(t => [t.factor, t.assessment, t.risk]), [2])] : []),
          // I — Individual
          tileLabel('I', 'INDIVIDUAL', BLUE),
          ...(d.tileIndividual.length > 0 ? [dTable(BLUE, [{ text: 'FACTOR', width: tileCols[0] }, { text: 'ASSESSMENT', width: tileCols[1] }, { text: 'RISK', width: tileCols[2] }], d.tileIndividual.map(t => [t.factor, t.assessment, t.risk]), [2])] : []),
          // L — Load
          tileLabel('L', 'LOAD', AMBER),
          ...(d.tileLoad.length > 0 ? [dTable(AMBER, [{ text: 'FACTOR', width: tileCols[0] }, { text: 'ASSESSMENT', width: tileCols[1] }, { text: 'RISK', width: tileCols[2] }], d.tileLoad.map(t => [t.factor, t.assessment, t.risk]), [2])] : []),
          // E — Environment
          tileLabel('E', 'ENVIRONMENT', PURPLE),
          ...(d.tileEnvironment.length > 0 ? [dTable(PURPLE, [{ text: 'FACTOR', width: tileCols[0] }, { text: 'ASSESSMENT', width: tileCols[1] }, { text: 'RISK', width: tileCols[2] }], d.tileEnvironment.map(t => [t.factor, t.assessment, t.risk]), [2])] : []),
        ] },
      // Body page 2 — Controls, Residual, Refs, Sig
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('03', 'HIERARCHY OF CONTROL MEASURES', A), h.spacer(60),
          ...(d.controls.length > 0 ? [dTable(A, [{ text: 'LEVEL', width: ctrlCols[0] }, { text: 'CONTROL', width: ctrlCols[1] }, { text: 'IMPLEMENTATION', width: ctrlCols[2] }], d.controls.map(c2 => [c2.level, c2.control, c2.implementation]))] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'RESIDUAL RISK RATING', A), h.spacer(60),
          ...(d.residualKpis.length > 0 ? [h.kpiDashboard(d.residualKpis.map(k => ({ value: k.value, label: k.label })), A, W)] : [
            h.kpiDashboard([{ value: d.residualRisk || 'Medium', label: 'Residual Risk' }, { value: '—', label: 'Per Person' }, { value: '—', label: 'Max Carries' }], A, W),
          ]),
          h.spacer(40),
          h.calloutBox(d.monitoringNote || 'Supervisor to observe handling technique weekly. Any operative reporting pain to be referred to occupational health. Review if task frequency or load changes.', AMBER, 'FFFBEB', AMBER_D, W, { boldPrefix: 'Monitoring:' }),
          h.spacer(80), h.fullWidthSectionBar('05', 'REGULATORY REFERENCES', A), h.spacer(60),
          h.bodyText(d.regulatoryRefs || 'Manual Handling Operations Regulations 1992 (as amended). HSE L23 — Manual Handling Guidance. HSE INDG143. HSE MAC Tool.', SM),
          h.spacer(80),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — MAC ASSESSMENT (Amber #D97706, cover #92400E, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: MhData): Document {
  const A = AMBER;
  const hdr2 = h.accentHeader('MAC Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'MAC Assessment', A);
  const macCols = cols([0.24, 0.42, 0.16, 0.18]);
  const impCols = cols([0.22, 0.52, 0.26]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['MAC ASSESSMENT'], 'HSE Manual Assessment Charts — ' + (d.taskDescription?.slice(0, 60) || ''), AMBER_D, AMBER_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Task', value: d.taskDescription?.slice(0, 100) || '' },
            { label: 'MAC Type', value: 'Team Handling Operation' },
            { label: 'Overall MAC Score', value: `${d.macTotal} — ${Number(d.macTotal) >= 21 ? 'RED' : Number(d.macTotal) >= 7 ? 'AMBER' : 'GREEN'}` },
          ], AMBER_D, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'MAC SCORING — TEAM HANDLING OPERATION', A), h.spacer(60),
          ...(d.macFactors.length > 0 ? [dTable(A,
            [{ text: 'MAC FACTOR', width: macCols[0] }, { text: 'ASSESSMENT', width: macCols[1] }, { text: 'COLOUR BAND', width: macCols[2] }, { text: 'SCORE', width: macCols[3] }],
            d.macFactors.map(f => [f.factor, f.assessment, f.band, f.score]), [2]
          )] : []),
          h.spacer(60),
          h.kpiDashboard([
            { value: d.macTotal || '—', label: 'Total MAC Score' },
            { value: d.macRedCount || '0', label: 'Red Factors' },
            { value: d.macAmberCount || '0', label: 'Amber Factors' },
            { value: d.macGreenCount || '0', label: 'Green Factors' },
          ], A, W),
          h.spacer(60),
          h.calloutBox(d.macInterpretation || 'MAC assessment completed — see scoring table above.', A, 'FFFBEB', AMBER_D, W, { boldPrefix: 'MAC Interpretation:' }),
          h.spacer(80), h.fullWidthSectionBar('', 'PRIORITY IMPROVEMENTS — TARGETING RED FACTORS', A), h.spacer(60),
          ...(d.improvements.length > 0 ? [dTable(A,
            [{ text: 'RED FACTOR', width: impCols[0] }, { text: 'IMPROVEMENT', width: impCols[1] }, { text: 'EXPECTED SCORE CHANGE', width: impCols[2] }],
            [...d.improvements.map(i => [i.factor, i.improvement, i.scoreChange]),
             ...(d.revisedMacScore ? [['REVISED MAC SCORE AFTER IMPROVEMENTS', '', d.revisedMacScore]] : [])],
          )] : []),
          h.spacer(80),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — RAPP ASSESSMENT (Teal #0f766e, pushing/pulling, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: MhData): Document {
  const A = TEAL;
  const hdr2 = h.accentHeader('RAPP Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'RAPP Assessment', A);
  const rappCols = cols([0.22, 0.42, 0.18, 0.18]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['RAPP ASSESSMENT'], 'Risk Assessment of Pushing and Pulling Operations', A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Task', value: d.taskDescription?.slice(0, 100) || '' },
            { label: 'Equipment', value: '' },
            { label: 'RAPP Score', value: `${d.rappTotal} — ${Number(d.rappTotal) > 20 ? 'RED' : Number(d.rappTotal) > 12 ? 'AMBER' : 'GREEN'}` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'TASK DESCRIPTION', A), h.spacer(60),
          ...h.richBodyText(d.taskDescription || ''),
          h.spacer(80), h.fullWidthSectionBar('', 'RAPP SCORING', A), h.spacer(60),
          ...(d.rappFactors.length > 0 ? [dTable(A,
            [{ text: 'RAPP FACTOR', width: rappCols[0] }, { text: 'ASSESSMENT', width: rappCols[1] }, { text: 'BAND', width: rappCols[2] }, { text: 'SCORE', width: rappCols[3] }],
            d.rappFactors.map(f => [f.factor, f.assessment, f.band, f.score]), [2]
          )] : []),
          h.spacer(60),
          h.kpiDashboard([
            { value: d.rappTotal || '—', label: 'RAPP Score' },
            { value: d.rappRedCount || '0', label: 'Red Factors' },
            { value: d.rappAmberCount || '0', label: 'Amber Factors' },
          ], A, W),
          h.spacer(60),
          h.calloutBox(d.rappOutcome || 'RAPP assessment completed — see scoring above.', A, 'F0FDFA', '134E4A', W, { boldPrefix: 'RAPP Outcome:' }),
          h.spacer(80),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — TRAINING BRIEFING (Navy #1e293b, compact, ~2pp)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: MhData): Document {
  const A = NAVY;
  const hdr2 = h.accentHeader('Manual Handling Training Brief', A);
  const ftr = h.accentFooter(d.documentRef, 'Training Brief', A);
  const ruleCols = cols([0.08, 0.92]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['MANUAL HANDLING', 'TRAINING BRIEF'], d.taskDescription?.slice(0, 60) || 'Safe Technique & Key Rules', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef }, { label: 'Date', value: d.assessmentDate },
            { label: 'Task', value: d.taskDescription?.slice(0, 100) || '' },
            { label: 'Audience', value: 'All operatives involved in this task' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'KEY RULES', A), h.spacer(60),
          ...(d.trainingRules.length > 0 ? [dTable(A,
            [{ text: 'RULE', width: ruleCols[0] }, { text: 'DETAIL', width: ruleCols[1] }],
            d.trainingRules.map((r, i) => [r.rule || String(i + 1), r.detail]),
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'CORRECT LIFTING TECHNIQUE', A), h.spacer(60),
          ...h.richBodyText(d.liftingTechnique || ''),
          h.spacer(60),
          h.calloutBox(
            'Every operative has the right and responsibility to stop work if they feel a manual handling task is unsafe. No disciplinary action for stopping work on safety grounds — ever.',
            A, NAVY_SUB.replace('93C5FD', 'F1F5F9'), A, W, { boldPrefix: 'Stop Work Authority:' }
          ),
          h.spacer(60),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'Briefing delivered by: __________________ ', bold: true, size: SM, font: 'Arial' }),
            new TextRun({ text: 'Date: ___/___/______ ', bold: true, size: SM, font: 'Arial' }),
            new TextRun({ text: 'Attendees: See sign-in sheet', bold: true, size: SM, font: 'Arial' }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: GREY, space: 8 } },
            children: [new TextRun({ text: '\u2014 Designed for printing and issuing at task briefing \u2014', size: SM, font: 'Arial', color: GREY, italics: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true }),
          ] }),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildManualHandlingTemplateDocument(
  content: any,
  templateSlug: ManualHandlingTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':   return buildT1(d);
    case 'mac-assessment':    return buildT2(d);
    case 'rapp-assessment':   return buildT3(d);
    case 'training-briefing': return buildT4(d);
    default:                  return buildT1(d);
  }
}
