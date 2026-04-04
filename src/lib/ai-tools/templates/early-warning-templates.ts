// =============================================================================
// EARLY WARNING NOTICE — Multi-Template Engine (REBUILT)
// 8 templates matching HTML render library exactly.
//
// T1 — nec4-contractor-pm    Navy #1E3A5F + Amber #D97706
// T2 — nec4-pm-contractor    Dark Slate #0F172A + Teal #0D9488
// T3 — nec4-sub-to-mc        Forest #1B4332 + Gold #CA8A04
// T4 — nec4-mc-to-sub        Charcoal #1F2937 + Red #DC2626
// T5 — comprehensive-risk    Purple #4C1D95 + Orange #EA580C
// T6 — health-safety         Safety Red #7F1D1D + Red #DC2626
// T7 — design-technical      Blueprint #1E3A8A + Blue #3B82F6
// T8 — weather-force-majeure Storm Grey #374151 + Amber #F59E0B
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { EarlyWarningTemplateSlug } from '@/lib/early-warning/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

// ── Colour Palettes ───────────────────────────────────────────────────────────
interface Pal { primary: string; accent: string; sub: string; bg: string; dark: string; }
const PAL: Record<EarlyWarningTemplateSlug, Pal> = {
  'nec4-contractor-pm':    { primary: '1E3A5F', accent: 'D97706', sub: 'FDE68A', bg: 'FFFBEB', dark: '1E293B' },
  'nec4-pm-contractor':    { primary: '0F172A', accent: '0D9488', sub: '5EEAD4', bg: 'F0FDFA', dark: '1E293B' },
  'nec4-sub-to-mc':        { primary: '1B4332', accent: 'CA8A04', sub: 'FDE68A', bg: 'FEFCE8', dark: '1E293B' },
  'nec4-mc-to-sub':        { primary: '1F2937', accent: 'DC2626', sub: 'FCA5A5', bg: 'FEF2F2', dark: '1F2937' },
  'comprehensive-risk':    { primary: '4C1D95', accent: 'EA580C', sub: 'DDD6FE', bg: 'FAF5FF', dark: '1E293B' },
  'health-safety':         { primary: '7F1D1D', accent: 'DC2626', sub: 'FCA5A5', bg: 'FEF2F2', dark: '111827' },
  'design-technical':      { primary: '1E3A8A', accent: '3B82F6', sub: '93C5FD', bg: 'EFF6FF', dark: '1E293B' },
  'weather-force-majeure': { primary: '374151', accent: 'F59E0B', sub: 'FDE68A', bg: 'FFFBEB', dark: '1F2937' },
};
const RED = 'DC2626'; const AMBER = 'D97706'; const GREEN = '059669';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Shared Helpers ────────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('done') || low.includes('active') || low.includes('place') || low.includes('attached')) { bg = 'D1FAE5'; color = GREEN; }
  else if (low.includes('progress') || low.includes('planned') || low.includes('review') || low.includes('partial')) { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('not') || low.includes('request') || low.includes('overdue') || low.includes('missing')) { bg = 'FEF2F2'; color = RED; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(hh => hh.width),
    rows: [
      new TableRow({ children: headers.map(hh => hdrCell(hh.text, hh.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const w = ratios.map(r => Math.round(W * r));
  w[w.length - 1] = W - w.slice(0, -1).reduce((a, b) => a + b, 0);
  return w;
}
// Direction badge — full-width accent bar with direction text
function directionBadge(text: string, bgColor: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      margins: { top: 60, bottom: 60, left: 140, right: 140 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })],
    })] })],
  });
}
// Dashed-border blank field table for handwritten responses
function blankFieldTable(fields: string[], accent: string): Table {
  const lw = Math.round(W * 0.38); const vw = W - lw;
  const dashed = { style: BorderStyle.DASHED, size: 1, color: 'CCCCCC' };
  const solid = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: fields.map(f => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, borders: { top: solid, bottom: solid, left: solid, right: solid }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: f, bold: true, size: SM, font: 'Arial', color: accent })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, borders: { top: dashed, bottom: dashed, left: dashed, right: dashed }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ spacing: { after: 200 }, children: [] })] }),
    ] })),
  });
}
// Simple extract helper
function s(c: any, k: string, fb = ''): string { return typeof c?.[k] === 'string' ? c[k] : fb; }
function a(c: any, k: string): any[] { return Array.isArray(c?.[k]) ? c[k] : []; }


// ═════════════════════════════════════════════════════════════════════════════
// T1 — CONTRACTOR → PM (Navy #1E3A5F + Amber #D97706)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('Early Warning Notice — Contractor → PM', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Contractor → PM', A);
  const cost = c.potentialImpactOnCost || {};
  const prog = c.potentialImpactOnProgramme || {};
  const rrm = c.riskReductionMeeting || {};
  const mitCols = cols([0.40, 0.22, 0.16, 0.22]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE'], `NEC4 Clause 15.1 — Contractor to Project Manager`, A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Contract', value: s(c, 'contractReference') },
            { label: 'Project', value: s(c, 'projectName') },
            { label: 'From', value: s(c, 'notifiedBy') },
            { label: 'To', value: s(c, 'notifiedTo') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + (s(c, 'riskDescription').length > 120 ? '...' : '') },
            { label: 'Potential Cost Impact', value: cost.estimatedAdditionalCost || '' },
            { label: 'Potential Programme Impact', value: prog.estimatedDelay || '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          directionBadge('CONTRACTOR → PROJECT MANAGER', p.accent),
          h.spacer(80),
          h.fullWidthSectionBar('01', 'RISK DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(80), h.fullWidthSectionBar('02', 'POTENTIAL IMPACT', A), h.spacer(80),
          h.kpiDashboard([
            { value: cost.estimatedAdditionalCost || '—', label: 'Cost Range' },
            { value: prog.estimatedDelay || '—', label: 'Working Days' },
            { value: prog.keyDatesAffected || '—', label: 'Key Date at Risk' },
          ], p.accent, W),
          h.spacer(80), h.fullWidthSectionBar('03', 'PROPOSED MITIGATION', A), h.spacer(80),
          ...(a(c, 'proposedMitigation').length > 0 ? [dataTable(A,
            [{ text: 'ACTION', width: mitCols[0] }, { text: 'RESPONSIBLE', width: mitCols[1] }, { text: 'TARGET', width: mitCols[2] }, { text: 'STATUS', width: mitCols[3] }],
            a(c, 'proposedMitigation').map((m: any) => [m.action || '', m.responsibleParty || m.owner || '', m.targetDate || '', m.status || '']),
            [3]
          )] : []),
          h.spacer(60),
          h.calloutBox(
            rrm.requested === 'Yes' || rrm.proposedDate
              ? `In accordance with NEC4 Clause 15.2, we request that a risk reduction meeting is convened within 5 working days to discuss this early warning matter, agree actions, and record decisions in the Risk Register.${rrm.proposedDate ? ' Proposed date: ' + rrm.proposedDate + '.' : ''}`
              : 'A risk reduction meeting under NEC4 Clause 15.2 is requested to discuss this matter.',
            p.accent, p.bg, p.dark, W, { boldPrefix: 'Risk Reduction Meeting Request:' }
          ),
          h.spacer(80),
          h.signatureGrid(['Contractor', 'Project Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — PM → CONTRACTOR (Dark Slate #0F172A + Teal #0D9488)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('Early Warning — PM → Contractor', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'PM → Contractor', A);
  const actCols = cols([0.72, 0.28]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE'], `Project Manager to Contractor — NEC4 Clause 15.1`, A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Contract', value: s(c, 'contractReference') },
            { label: 'From', value: s(c, 'issuedBy') || s(c, 'notifiedBy') },
            { label: 'To', value: s(c, 'issuedTo') || s(c, 'notifiedTo') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + '...' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          directionBadge('PROJECT MANAGER → CONTRACTOR', p.accent),
          h.spacer(80),
          h.fullWidthSectionBar('', 'MATTER GIVING RISE TO EARLY WARNING', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(80), h.fullWidthSectionBar('', "PM'S ASSESSMENT OF IMPACT", A), h.spacer(80),
          ...h.richBodyText(s(c, 'impactOnPrices') || s(c, 'evidenceSummary') || ''),
          h.spacer(80), h.fullWidthSectionBar('', 'ACTIONS REQUIRED OF CONTRACTOR', A), h.spacer(80),
          ...(a(c, 'actionsRequired').length > 0 ? [dataTable(p.accent,
            [{ text: 'ACTION', width: actCols[0] }, { text: 'DEADLINE', width: actCols[1] }],
            a(c, 'actionsRequired').map((ar: any) => [ar.action || '', ar.dueBy || ar.deadline || '']),
          )] : []),
          h.spacer(60),
          h.calloutBox(
            c.riskReductionMeeting?.proposedDate
              ? `A risk reduction meeting is convened for ${c.riskReductionMeeting.proposedDate}${c.riskReductionMeeting.location ? ' at ' + c.riskReductionMeeting.location : ''}. The Contractor is required to attend with the site manager and lead engineer.${c.riskReductionMeeting.agenda ? ' Agenda: ' + c.riskReductionMeeting.agenda : ''}`
              : 'A risk reduction meeting under NEC4 Clause 15.2 is convened. The Contractor is required to attend.',
            p.accent, p.bg, p.dark, W, { boldPrefix: 'Risk Reduction Meeting (Clause 15.2):' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'CONTRACTOR RESPONSE', A), h.spacer(80),
          blankFieldTable(['Root Cause', 'Recovery Plan', 'Additional Resources Proposed', 'Revised Completion Date'], A),
          h.spacer(80),
          h.signatureGrid(['Project Manager', 'Contractor'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — SUB → MC (Forest #1B4332 + Gold #CA8A04)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('EWN — Subcontractor → Main Contractor', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Sub → MC', A);
  const prog = c.potentialImpactOnProgramme || {};
  const cost = c.potentialImpactOnCost || {};
  const mitCols = cols([0.50, 0.26, 0.24]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE'], `Subcontractor to Main Contractor — NEC4 ECS Clause 15.1`, A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Subcontract', value: s(c, 'subcontractReference') },
            { label: 'Main Contract', value: s(c, 'contractReference') },
            { label: 'From', value: s(c, 'notifiedBy') },
            { label: 'To', value: s(c, 'notifiedTo') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + '...' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          directionBadge('SUBCONTRACTOR → MAIN CONTRACTOR', p.accent),
          h.spacer(80),
          h.fullWidthSectionBar('', 'RISK DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(60),
          h.kpiDashboard([
            { value: prog.estimatedDelay || '—', label: 'Working Days Delay' },
            { value: cost.estimatedAdditionalCost || '—', label: 'Cost Impact' },
          ], p.accent, W),
          h.spacer(80), h.fullWidthSectionBar('', 'PROPOSED MITIGATION', A), h.spacer(80),
          ...(a(c, 'proposedMitigation').length > 0 ? [dataTable(p.accent,
            [{ text: 'ACTION', width: mitCols[0] }, { text: 'OWNER', width: mitCols[1] }, { text: 'DATE', width: mitCols[2] }],
            a(c, 'proposedMitigation').map((m: any) => [m.action || '', m.responsibleParty || m.owner || '', m.targetDate || '']),
          )] : []),
          h.spacer(60),
          h.calloutBox(
            'This early warning is issued under NEC4 Engineering and Construction Subcontract Clause 15.1. The delay may impact the main contract programme and the Main Contractor should consider whether to notify the Project Manager under the main contract.',
            p.accent, p.bg, p.dark, W, { boldPrefix: 'NEC4 ECS Note:' }
          ),
          h.spacer(80),
          h.signatureGrid(['Subcontractor', 'Main Contractor'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — MC → SUB (Charcoal #1F2937 + Red #DC2626)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('EWN — MC → Subcontractor', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'MC → Sub', A);
  const docCols = cols([0.36, 0.20, 0.22, 0.22]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE'], `Main Contractor to Subcontractor — Contractual Warning`, A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Subcontract', value: s(c, 'subcontractReference') },
            { label: 'From', value: s(c, 'issuedBy') || s(c, 'notifiedBy') },
            { label: 'To', value: s(c, 'issuedTo') || s(c, 'notifiedTo') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + '...' },
            { label: 'Warning Level', value: 'Contractual Warning — Potential Stop Work' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          directionBadge('MC → SUBCONTRACTOR — CONTRACTUAL WARNING', RED),
          h.spacer(80),
          h.calloutBox(
            s(c, 'contractualWarning') || 'The Subcontractor is hereby formally advised that failure to provide the outstanding documentation listed below within the stated deadlines may result in: (a) a stop work instruction under the subcontract, (b) contra-charges for delay and disruption caused to the main contract programme, and (c) an adverse performance assessment.',
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: '\u26A0 CONTRACTUAL WARNING:' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'OUTSTANDING DOCUMENTATION', A), h.spacer(80),
          ...(a(c, 'outstandingItems').length > 0 ? [dataTable(RED,
            [{ text: 'DOCUMENT', width: docCols[0] }, { text: 'REQUIRED BY', width: docCols[1] }, { text: 'STATUS', width: docCols[2] }, { text: 'DAYS OVERDUE', width: docCols[3] }],
            a(c, 'outstandingItems').map((oi: any) => [oi.description || '', oi.dueBy || oi.period || '', oi.status || 'Not Received', oi.daysOverdue || '']),
            [2]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'EXPECTED SUBCONTRACTOR RESPONSE', A), h.spacer(80),
          blankFieldTable(['Root Cause for Non-Submission', 'Commitment Date for All Documents', 'Preventive Measures (to avoid recurrence)', 'Signed Acknowledgement'], A),
          h.spacer(80),
          h.signatureGrid(['Main Contractor', 'Subcontractor Acknowledgement'], RED, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T5 — COMPREHENSIVE RISK (Purple #4C1D95 + Orange #EA580C)
// ═════════════════════════════════════════════════════════════════════════════
function riskMatrixTable(accent: string, likehood: number, impact: number, label: string): Table {
  // Build a 5x5 risk matrix with the score highlighted
  const score = likehood * impact;
  const cellW = Math.round(W * 0.45 / 6);
  const riskColor = (l: number, i: number): string => {
    const s2 = l * i;
    if (s2 >= 15) return '991B1B'; // dark red
    if (s2 >= 9) return 'DC2626'; // red
    if (s2 >= 5) return 'D97706'; // amber
    return '059669'; // green
  };
  const riskBg = (l: number, i: number): string => {
    const s2 = l * i;
    if (s2 >= 15) return 'FEE2E2';
    if (s2 >= 9) return 'FEF2F2';
    if (s2 >= 5) return 'FFFBEB';
    return 'D1FAE5';
  };
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: accent };
  const hdrBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

  const headerRow = new TableRow({ children: [
    new TableCell({ width: { size: cellW, type: WidthType.DXA }, borders: hdrBorders, shading: { fill: accent, type: ShadingType.CLEAR }, margins: { top: 20, bottom: 20, left: 20, right: 20 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [] })] }),
    ...[1,2,3,4,5].map(n => new TableCell({ width: { size: cellW, type: WidthType.DXA }, borders: hdrBorders, shading: { fill: accent, type: ShadingType.CLEAR }, margins: { top: 20, bottom: 20, left: 20, right: 20 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(n), bold: true, size: 14, color: 'FFFFFF', font: 'Arial' })] })] })),
  ] });

  const rows: TableRow[] = [];
  for (let ll = 5; ll >= 1; ll--) {
    rows.push(new TableRow({ children: [
      new TableCell({ width: { size: cellW, type: WidthType.DXA }, borders: hdrBorders, shading: { fill: accent, type: ShadingType.CLEAR }, margins: { top: 20, bottom: 20, left: 20, right: 20 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(ll), bold: true, size: 14, color: 'FFFFFF', font: 'Arial' })] })] }),
      ...[1,2,3,4,5].map(ii => {
        const isTarget = ll === likehood && ii === impact;
        const bdr = isTarget ? { style: BorderStyle.SINGLE, size: 6, color: accent } : border;
        return new TableCell({
          width: { size: cellW, type: WidthType.DXA },
          borders: { top: bdr, bottom: bdr, left: bdr, right: bdr },
          shading: { fill: riskBg(ll, ii), type: ShadingType.CLEAR },
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: isTarget ? `\u2605${ll * ii}` : String(ll * ii), bold: isTarget, size: isTarget ? 14 : 12, color: riskColor(ll, ii), font: 'Arial' }),
          ] })],
        });
      }),
    ] }));
  }

  return new Table({ width: { size: Math.round(W * 0.45), type: WidthType.DXA }, rows: [headerRow, ...rows] });
}

function buildT5(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('Comprehensive Risk EWN', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Comprehensive Risk', A);
  const rs = c.riskScoring || {};
  const preL = Number(rs.preLikelihood) || 4; const preI = Number(rs.preImpact) || 5;
  const postL = Number(rs.postLikelihood) || 2; const postI = Number(rs.postImpact) || 4;
  const mitCols = cols([0.50, 0.24, 0.26]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE', 'COMPREHENSIVE RISK'], s(c, 'riskDescription', '').slice(0, 80) + '...', A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Contract', value: s(c, 'contractReference') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + '...' },
            { label: 'Pre-Mitigation Score', value: `${preL * preI} (${preL * preI >= 15 ? 'Very High' : preL * preI >= 9 ? 'High' : 'Medium'}) — ${preL} × ${preI}` },
            { label: 'Post-Mitigation Score', value: `${postL * postI} (${postL * postI >= 9 ? 'High' : postL * postI >= 5 ? 'Medium' : 'Low'}) — ${postL} × ${postI}` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'RISK DESCRIPTION & SCORING', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(80),
          // Pre/Post risk matrices side by side (each as a paragraph label + table)
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: `PRE-MITIGATION: `, bold: true, size: SM, font: 'Arial', color: A }),
            new TextRun({ text: `${preL * preI} (${preL * preI >= 15 ? 'Very High' : 'High'})`, bold: true, size: SM, font: 'Arial', color: RED }),
          ] }),
          riskMatrixTable(A, preL, preI, 'Pre'),
          new Paragraph({ spacing: { after: 4, before: 40 }, children: [
            new TextRun({ text: `Likelihood: ${preL} × Severity: ${preI}`, size: 14, font: 'Arial', color: GREY }),
          ] }),
          h.spacer(80),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: `POST-MITIGATION: `, bold: true, size: SM, font: 'Arial', color: A }),
            new TextRun({ text: `${postL * postI} (${postL * postI >= 9 ? 'High' : 'Medium'})`, bold: true, size: SM, font: 'Arial', color: AMBER }),
          ] }),
          riskMatrixTable(A, postL, postI, 'Post'),
          new Paragraph({ spacing: { after: 4, before: 40 }, children: [
            new TextRun({ text: `Likelihood: ${postL} × Severity: ${postI}`, size: 14, font: 'Arial', color: GREY }),
          ] }),
          h.spacer(80), h.fullWidthSectionBar('', 'MITIGATION PLAN', A), h.spacer(80),
          ...(a(c, 'proposedMitigation').length > 0 ? [dataTable(p.accent,
            [{ text: 'MEASURE', width: mitCols[0] }, { text: 'OWNER', width: mitCols[1] }, { text: 'STATUS', width: mitCols[2] }],
            a(c, 'proposedMitigation').map((m: any) => [m.action || '', m.responsibleParty || m.owner || '', m.status || '']),
            [2]
          )] : []),
          h.spacer(60),
          h.calloutBox(
            `Added to project Risk Register as ${c.riskRegisterEntry?.riskId || 'RR-XXX'}. To be reviewed at weekly RRM. Risk owner: ${c.riskRegisterEntry?.owner || s(c, 'notifiedBy')}.`,
            A, p.bg, p.dark, W, { boldPrefix: 'Risk Register Entry:' }
          ),
          h.spacer(80),
          h.signatureGrid(['Risk Owner', 'Project Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T6 — HEALTH & SAFETY (Safety Red #7F1D1D + Red #DC2626)
// ═════════════════════════════════════════════════════════════════════════════
function buildT6(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('H&S Early Warning', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Health & Safety', A);
  const actCols = cols([0.40, 0.18, 0.22, 0.20]);
  const hocColors = ['059669', '0D9488', '2563EB', 'D97706', 'DC2626'];
  const hocLevels = ['Eliminate', 'Substitute', 'Engineering', 'Administrative', 'PPE'];
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['\u26A0 HEALTH & SAFETY', 'EARLY WARNING'], s(c, 'hsRiskCategory') || s(c, 'riskDescription', '').slice(0, 80), A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Contract', value: s(c, 'contractReference') },
            { label: 'Risk Category', value: s(c, 'hsRiskCategory') || 'Health & Safety' },
            { label: 'Legislation', value: a(c, 'applicableRegulations').slice(0, 2).join(', ') || '' },
            { label: 'Immediate Action', value: a(c, 'immediateActions').length > 0 ? (a(c, 'immediateActions')[0] as any).action || '' : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          directionBadge('\u26A0 HEALTH & SAFETY RISK', RED),
          h.spacer(80),
          h.fullWidthSectionBar('', 'RISK DESCRIPTION', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(60),
          h.calloutBox(
            a(c, 'applicableRegulations').join('. ') || 'Applicable legislation to be confirmed.',
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: '\u26A0 APPLICABLE LEGISLATION:' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'HIERARCHY OF CONTROL', A), h.spacer(80),
          // Hierarchy of control rows
          ...a(c, 'hierarchyOfControl').map((hoc: any, i: number) => {
            const level = hoc.level || hocLevels[i] || '';
            const color = hocColors[i] || GREY;
            return new Paragraph({
              spacing: { after: 60 }, indent: { left: 120 },
              children: [
                new TextRun({ text: `${i + 1}  `, bold: true, size: BODY, font: 'Arial', color }),
                new TextRun({ text: `${level}: `, bold: true, size: BODY, font: 'Arial', color: p.dark }),
                new TextRun({ text: hoc.measures || '', size: BODY, font: 'Arial', color: p.dark }),
              ],
            });
          }),
          h.spacer(80), h.fullWidthSectionBar('', 'IMMEDIATE ACTIONS TAKEN', A), h.spacer(80),
          ...(a(c, 'immediateActions').length > 0 ? [dataTable(RED,
            [{ text: 'ACTION', width: actCols[0] }, { text: 'BY', width: actCols[1] }, { text: 'DATE/TIME', width: actCols[2] }, { text: 'STATUS', width: actCols[3] }],
            a(c, 'immediateActions').map((ia: any) => [ia.action || '', ia.by || '', ia.date || '', ia.status || 'Done']),
            [3]
          )] : []),
          h.spacer(60),
          h.calloutBox(
            s(c, 'riddorAssessment') || 'RIDDOR assessment to be completed.',
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: 'RIDDOR Assessment:' }
          ),
          h.spacer(80),
          h.signatureGrid(['Site Manager', 'SHE Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T7 — DESIGN & TECHNICAL (Blueprint #1E3A8A + Blue #3B82F6)
// ═════════════════════════════════════════════════════════════════════════════
function buildT7(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('Design & Technical EWN', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Design & Technical', A);
  const dwgCols = cols([0.26, 0.28, 0.08, 0.14, 0.24]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE', 'DESIGN & TECHNICAL'], s(c, 'riskDescription', '').slice(0, 80) + '...', A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Discipline', value: s(c, 'designDiscipline') },
            { label: 'Risk', value: (s(c, 'riskDescription') || '').slice(0, 120) + '...' },
            { label: 'Linked RFI', value: a(c, 'linkedRFIs').join(', ') || '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'DESIGN CONFLICT IDENTIFIED', A), h.spacer(80),
          ...h.richBodyText(s(c, 'riskDescription')),
          h.spacer(80), h.fullWidthSectionBar('', 'AFFECTED DRAWINGS', A), h.spacer(80),
          ...(a(c, 'affectedDrawings').length > 0 ? [dataTable(p.accent,
            [{ text: 'DRAWING NO.', width: dwgCols[0] }, { text: 'TITLE', width: dwgCols[1] }, { text: 'REV', width: dwgCols[2] }, { text: 'DISCIPLINE', width: dwgCols[3] }, { text: 'ISSUE', width: dwgCols[4] }],
            a(c, 'affectedDrawings').map((d: any) => [d.reference || '', d.title || '', d.revision || '', d.discipline || '', d.issue || '']),
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'IMPACT & PROPOSED RESOLUTION', A), h.spacer(80),
          ...h.richBodyText(s(c, 'evidenceSummary') || s(c, 'potentialImpactOnQuality') || ''),
          h.spacer(80),
          h.signatureGrid(['Contractor', 'Designer'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T8 — WEATHER / FORCE MAJEURE (Storm Grey #374151 + Amber #F59E0B)
// ═════════════════════════════════════════════════════════════════════════════
function buildT8(p: Pal, c: any): Document {
  const A = p.primary;
  const hdr2 = h.accentHeader('Weather Early Warning', A);
  const ftr = h.accentFooter(s(c, 'documentRef'), 'Weather', A);
  const wd = c.weatherData || {};
  const wxCols = cols([0.16, 0.18, 0.16, 0.20, 0.30]);
  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EARLY WARNING NOTICE', 'WEATHER EVENT'], `${s(c, 'weatherEventType') || 'Weather Event'} — NEC4 Clause 60.1(13) Consideration`, A, p.sub),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: s(c, 'documentRef') },
            { label: 'Date', value: s(c, 'noticeDate') },
            { label: 'Weather Event', value: s(c, 'weatherEventType') },
            { label: 'Weather Station', value: s(c, 'weatherStation') },
            { label: 'CE Consideration', value: 'Clause 60.1(13) — weather exceeding 10-year return period' },
            { label: 'Affected Works', value: (c.potentialImpactOnProgramme?.programmeNarrative || '').slice(0, 80) || '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'WEATHER DATA SUMMARY', A), h.spacer(80),
          h.kpiDashboard([
            { value: wd.totalMeasurement || '—', label: '7-Day Forecast' },
            { value: wd.peakDaily || '—', label: 'Heaviest Day' },
            { value: wd.tenYearThreshold || '—', label: '10-Year Avg' },
            { value: wd.daysLost || '—', label: 'Days Lost' },
          ], p.accent, W),
          h.spacer(80), h.fullWidthSectionBar('', 'DAILY WEATHER IMPACT LOG', A), h.spacer(80),
          ...(a(c, 'dailyWeatherLog').length > 0 ? [dataTable(p.accent,
            [{ text: 'DAY', width: wxCols[0] }, { text: 'FORECAST', width: wxCols[1] }, { text: 'WIND', width: wxCols[2] }, { text: 'SITE STATUS', width: wxCols[3] }, { text: 'AFFECTED ACTIVITIES', width: wxCols[4] }],
            a(c, 'dailyWeatherLog').map((d: any) => [d.date || '', d.rainfall || '', d.wind || '', d.status || '', d.activitiesAffected || '']),
            [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'CE CONSIDERATION — CLAUSE 60.1(13)', A), h.spacer(80),
          h.calloutBox(
            s(c, 'ceConsideration') || 'CE consideration under Clause 60.1(13) to be assessed at end of weather event.',
            p.accent, p.bg, p.dark, W, { boldPrefix: 'NEC4 Clause 60.1(13):' }
          ),
          h.spacer(80), h.fullWidthSectionBar('', 'PROPOSED MITIGATION & RECOVERY', A), h.spacer(80),
          ...h.richBodyText(c.potentialImpactOnProgramme?.programmeNarrative || s(c, 'evidenceSummary') || ''),
          h.spacer(80),
          h.signatureGrid(['Contractor', 'Project Manager'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildEarlyWarningTemplateDocument(
  content: any,
  slug: EarlyWarningTemplateSlug
): Promise<Document> {
  const p = PAL[slug] || PAL['nec4-contractor-pm'];
  switch (slug) {
    case 'nec4-contractor-pm':    return buildT1(p, content);
    case 'nec4-pm-contractor':    return buildT2(p, content);
    case 'nec4-sub-to-mc':        return buildT3(p, content);
    case 'nec4-mc-to-sub':        return buildT4(p, content);
    case 'comprehensive-risk':    return buildT5(p, content);
    case 'health-safety':         return buildT6(p, content);
    case 'design-technical':      return buildT7(p, content);
    case 'weather-force-majeure': return buildT8(p, content);
    default:                      return buildT1(p, content);
  }
}
