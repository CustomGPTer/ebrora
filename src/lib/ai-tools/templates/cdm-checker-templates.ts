// =============================================================================
// CDM Compliance Checker — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard     (green #059669, gap analysis, 4pp)
// T2 — Compliance Matrix   (teal #0f766e, regulation×duty holder matrix, 3pp)
// T3 — Audit Trail         (navy #1e293b, evidence refs, NCR register, 3pp)
// T4 — Executive Summary   (charcoal #2d3748, dashboard, management brief, 2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { CdmCheckerTemplateSlug } from '@/lib/cdm-checker/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'D1FAE5';
const TEAL = '0f766e'; const TEAL_SUB = '99F6E4'; const TEAL_BG = 'f0fdfa';
const NAVY = '1e293b'; const NAVY_SUB = '93C5FD';
const CHAR = '2d3748'; const CHAR_SUB = '86EFAC';
const AMBER = 'D97706'; const AMBER_BG = 'FFFBEB';
const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const GREY = '6B7280'; const GREY_BG = 'F3F4F6'; const ZEBRA = 'F5F5F5';

// ── Data Types ──────────────────────────────────────────────────────────────
interface DutyCheck { duty: string; regulation: string; status: string; finding: string; evidenceRef?: string }
interface DutyHolderRow { dutyHolder: string; name: string; appointed: string; writtenAppt: string; cdmAcknowledged: string }
interface Gap { priority: string; gap: string; regulation: string; potentialConsequence: string }
interface RoadmapItem { action: string; responsible: string; targetDate: string; priority: string }
interface KeyDoc { document: string; status: string; finding: string }
interface AuditCheck { ref: string; duty: string; regulation: string; status: string; evidenceReviewed: string; finding: string }
interface Ncr { ncrNo: string; category: string; description: string; regulation: string; raisedAgainst: string; priority: string; targetClose: string }
interface Observation { obsNo: string; observation: string; recommendation: string }
interface MatrixRow { regulation: string; duty: string; client: string; pd: string; pc: string; designers: string; contractors: string }

interface CdmData {
  documentRef: string; assessmentDate: string; reviewDate: string; assessedBy: string;
  projectName: string; contractRef: string; client: string; principalDesigner: string;
  principalContractor: string; contractor: string; siteAddress: string;
  overallComplianceRating: string;
  projectOverview: string;
  f10Status: Array<{ item: string; status: string; detail: string }>;
  dutyHolders: DutyHolderRow[];
  clientCompliance: DutyCheck[];
  pcCompliance: DutyCheck[];
  pdCompliance: DutyCheck[];
  keyDocuments: KeyDoc[];
  gaps: Gap[];
  roadmap: RoadmapItem[];
  narrativeSummary: string;
  // T2 Matrix fields
  complianceScores: Array<{ value: string; label: string; sublabel?: string }>;
  complianceMatrix: MatrixRow[];
  // T3 Audit fields
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string; status: string }>;
  auditChecks: AuditCheck[];
  ncrRegister: Ncr[];
  observations: Observation[];
  approvalChain: Array<{ role: string; name: string; qualification: string }>;
  confidentiality: string;
  // T4 Executive fields
  overallPercentage: string;
  highGapCount: string; mediumGapCount: string;
  dutyHolderScores: Array<{ holder: string; percentage: string; detail: string }>;
  keyFindings: Array<{ number: string; finding: string; risk: string; action: string }>;
  kpiItems: Array<{ value: string; label: string; sublabel?: string }>;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): CdmData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef', 'CDM-001'), assessmentDate: s('assessmentDate'), reviewDate: s('reviewDate'),
    assessedBy: s('assessedBy'), projectName: s('projectName'), contractRef: s('contractRef'),
    client: s('client'), principalDesigner: s('principalDesigner'), principalContractor: s('principalContractor'),
    contractor: s('contractor'), siteAddress: s('siteAddress'),
    overallComplianceRating: s('overallComplianceRating', 'Requires Improvement'),
    projectOverview: s('projectOverview'), f10Status: a('f10Status'),
    dutyHolders: a('dutyHolders'), clientCompliance: a('clientCompliance'),
    pcCompliance: a('pcCompliance'), pdCompliance: a('pdCompliance'),
    keyDocuments: a('keyDocuments'), gaps: a('gaps'), roadmap: a('roadmap'),
    narrativeSummary: s('narrativeSummary'),
    complianceScores: a('complianceScores'), complianceMatrix: a('complianceMatrix'),
    revisionHistory: a('revisionHistory'), auditChecks: a('auditChecks'),
    ncrRegister: a('ncrRegister'), observations: a('observations'),
    approvalChain: a('approvalChain'), confidentiality: s('confidentiality'),
    overallPercentage: s('overallPercentage'), highGapCount: s('highGapCount'), mediumGapCount: s('mediumGapCount'),
    dutyHolderScores: a('dutyHolderScores'), keyFindings: a('keyFindings'), kpiItems: a('kpiItems'),
    additionalNotes: s('additionalNotes'),
  };
}

// ── Shared table helpers ─────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string; size?: number }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, color: opts?.color, fontSize: opts?.size ?? SM });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = GREY_BG; let color = GREY;
  if (low.includes('compliant') && !low.includes('non')) { bg = GREEN_BG; color = GREEN; }
  else if (low.includes('yes') || low === 'c' || low === '✓') { bg = GREEN_BG; color = GREEN; }
  else if (low.includes('partial') || low === 'p' || low === '△' || low.includes('draft')) { bg = AMBER_BG; color = AMBER; }
  else if (low.includes('non') || low.includes('no') || low === 'nc' || low === '✗' || low.includes('not started')) { bg = RED_BG; color = RED; }
  else if (low.includes('high') || low.includes('immediate')) { bg = RED_BG; color = RED; }
  else if (low.includes('med') || low.includes('within')) { bg = AMBER_BG; color = AMBER; }
  else if (low.includes('ongoing') || low.includes('low')) { bg = GREY_BG; color = GREY; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
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
function cols(ratios: number[]): number[] {
  const widths = ratios.map(r => Math.round(W * r));
  widths[widths.length - 1] = W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return widths;
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: CdmData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('CDM 2015 Compliance Gap Analysis', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  const f10Cols = cols([0.24, 0.14, 0.62]);
  const dhCols = cols([0.20, 0.24, 0.14, 0.14, 0.28]);
  const dutyCols = cols([0.30, 0.10, 0.12, 0.48]);
  const docCols = cols([0.28, 0.12, 0.60]);
  const gapCols = cols([0.12, 0.36, 0.14, 0.38]);
  const roadCols = cols([0.36, 0.22, 0.18, 0.24]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CDM 2015 COMPLIANCE', 'GAP ANALYSIS'], d.projectName || '', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Contract', value: d.contractRef },
            { label: 'Client', value: d.client },
            { label: 'Principal Designer', value: d.principalDesigner },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Contractor', value: d.contractor },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Overall Compliance', value: d.overallComplianceRating },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Overview, F10, Duty Holders, Client Compliance
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'PROJECT OVERVIEW', A), h.spacer(80),
          ...h.richBodyText(d.projectOverview || ''),
          h.spacer(80), h.fullWidthSectionBar('02', 'F10 NOTIFICATION STATUS', A), h.spacer(80),
          ...(d.f10Status.length > 0 ? [dataTable(A,
            [{ text: 'ITEM', width: f10Cols[0] }, { text: 'STATUS', width: f10Cols[1] }, { text: 'DETAIL', width: f10Cols[2] }],
            d.f10Status.map(f => [f.item, f.status, f.detail]), [1]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('03', 'DUTY HOLDER APPOINTMENTS', A), h.spacer(80),
          ...(d.dutyHolders.length > 0 ? [dataTable(A,
            [{ text: 'DUTY HOLDER', width: dhCols[0] }, { text: 'NAME', width: dhCols[1] }, { text: 'APPOINTED?', width: dhCols[2] }, { text: 'WRITTEN APPT?', width: dhCols[3] }, { text: 'CDM DUTIES ACKNOWLEDGED?', width: dhCols[4] }],
            d.dutyHolders.map(dh => [dh.dutyHolder, dh.name, dh.appointed, dh.writtenAppt, dh.cdmAcknowledged]),
            [2, 3, 4]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'CLIENT COMPLIANCE (REGULATION 4)', A), h.spacer(80),
          ...(d.clientCompliance.length > 0 ? [dataTable(A,
            [{ text: 'DUTY (CDM 2015)', width: dutyCols[0] }, { text: 'REG.', width: dutyCols[1] }, { text: 'STATUS', width: dutyCols[2] }, { text: 'FINDING', width: dutyCols[3] }],
            d.clientCompliance.map(c => [c.duty, c.regulation, c.status, c.finding]), [2]
          )] : []),
        ] },
      // Body — PC, PD Compliance, Key Documents
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('05', 'PRINCIPAL CONTRACTOR COMPLIANCE (REGULATIONS 13\u201314)', A), h.spacer(80),
          ...(d.pcCompliance.length > 0 ? [dataTable(A,
            [{ text: 'DUTY', width: dutyCols[0] }, { text: 'REG.', width: dutyCols[1] }, { text: 'STATUS', width: dutyCols[2] }, { text: 'FINDING', width: dutyCols[3] }],
            d.pcCompliance.map(c => [c.duty, c.regulation, c.status, c.finding]), [2]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('06', 'PRINCIPAL DESIGNER COMPLIANCE (REGULATIONS 11\u201312)', A), h.spacer(80),
          ...(d.pdCompliance.length > 0 ? [dataTable(A,
            [{ text: 'DUTY', width: dutyCols[0] }, { text: 'REG.', width: dutyCols[1] }, { text: 'STATUS', width: dutyCols[2] }, { text: 'FINDING', width: dutyCols[3] }],
            d.pdCompliance.map(c => [c.duty, c.regulation, c.status, c.finding]), [2]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('07', 'KEY DOCUMENTS ASSESSMENT', A), h.spacer(80),
          ...(d.keyDocuments.length > 0 ? [dataTable(A,
            [{ text: 'DOCUMENT', width: docCols[0] }, { text: 'STATUS', width: docCols[1] }, { text: 'FINDING', width: docCols[2] }],
            d.keyDocuments.map(doc => [doc.document, doc.status, doc.finding]), [1]
          )] : []),
        ] },
      // Body — Gaps, Roadmap, Sign-Off
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('08', 'PRIORITY-RANKED GAP REGISTER', A), h.spacer(80),
          ...(d.gaps.length > 0 ? [dataTable(A,
            [{ text: 'PRIORITY', width: gapCols[0] }, { text: 'GAP', width: gapCols[1] }, { text: 'REGULATION', width: gapCols[2] }, { text: 'POTENTIAL CONSEQUENCE', width: gapCols[3] }],
            d.gaps.map(g => [g.priority, g.gap, g.regulation, g.potentialConsequence]), [0]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('09', 'COMPLIANCE ROADMAP', A), h.spacer(80),
          ...(d.roadmap.length > 0 ? [dataTable(A,
            [{ text: 'ACTION', width: roadCols[0] }, { text: 'RESPONSIBLE', width: roadCols[1] }, { text: 'TARGET DATE', width: roadCols[2] }, { text: 'PRIORITY', width: roadCols[3] }],
            d.roadmap.map(r => [r.action, r.responsible, r.targetDate, r.priority]), [3]
          )] : []),
          h.spacer(60),
          h.calloutBox(d.narrativeSummary || `Overall Compliance Rating: ${d.overallComplianceRating}.`, AMBER, AMBER_BG, '92400E', W, { boldPrefix: `Overall Compliance Rating: ${d.overallComplianceRating}.` }),
          h.spacer(60),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — COMPLIANCE MATRIX (Teal #0f766e)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: CdmData): Document {
  const A = TEAL;
  const hdr = h.accentHeader('CDM 2015 Compliance Matrix', A);
  const ftr = h.accentFooter(d.documentRef, 'Compliance Matrix', A);

  const matrixCols = cols([0.08, 0.32, 0.12, 0.12, 0.12, 0.12, 0.12]);
  const gapCols5 = cols([0.10, 0.28, 0.26, 0.18, 0.18]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CDM 2015', 'COMPLIANCE MATRIX'], d.projectName || '', A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Project', value: d.projectName + (d.contractRef ? ` (${d.contractRef})` : '') },
            { label: 'Client', value: d.client },
            { label: 'Contractor', value: d.contractor },
            { label: 'Site', value: d.siteAddress },
            { label: 'Overall Status', value: d.overallComplianceRating },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Matrix page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'DUTY HOLDER COMPLIANCE SCORES', A), h.spacer(80),
          ...(d.complianceScores.length > 0
            ? [h.kpiDashboard(d.complianceScores.map(k => ({ value: k.value, label: k.label })), A, W)]
            : []),
          h.spacer(60),
          h.fullWidthSectionBar('', 'FULL COMPLIANCE MATRIX \u2014 ALL REGULATIONS \u00D7 ALL DUTY HOLDERS', A), h.spacer(80),
          ...(d.complianceMatrix.length > 0 ? [dataTable(A,
            [{ text: 'REG.', width: matrixCols[0] }, { text: 'DUTY DESCRIPTION', width: matrixCols[1] }, { text: 'CLIENT', width: matrixCols[2] }, { text: 'PD', width: matrixCols[3] }, { text: 'PC', width: matrixCols[4] }, { text: 'DESIGNERS', width: matrixCols[5] }, { text: 'CONTRACTORS', width: matrixCols[6] }],
            d.complianceMatrix.map(m => [m.regulation, m.duty, m.client, m.pd, m.pc, m.designers, m.contractors]),
            [2, 3, 4, 5, 6]
          )] : []),
          // Condensed Gaps
          h.spacer(60), h.fullWidthSectionBar('', 'CONDENSED GAPS & IMMEDIATE ACTIONS', A), h.spacer(80),
          ...(d.gaps.length > 0 ? [dataTable(A,
            [{ text: 'PRIORITY', width: gapCols5[0] }, { text: 'GAP', width: gapCols5[1] }, { text: 'ACTION', width: gapCols5[2] }, { text: 'OWNER', width: gapCols5[3] }, { text: 'BY', width: gapCols5[4] }],
            d.gaps.slice(0, 7).map(g => [g.priority, g.gap, g.potentialConsequence, g.regulation, '']),
            [0]
          )] : []),
          h.spacer(60),
          h.signatureGrid(['Assessed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — AUDIT TRAIL (Navy #1e293b)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: CdmData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('CDM 2015 Compliance Audit', A);
  const ftr = h.accentFooter(d.documentRef, 'Audit Trail', A);

  const revCols = cols([0.08, 0.12, 0.48, 0.16, 0.16]);
  const chkCols = cols([0.08, 0.18, 0.06, 0.08, 0.28, 0.32]);
  const ncrCols = cols([0.12, 0.08, 0.24, 0.10, 0.16, 0.10, 0.20]);
  const obsCols = cols([0.10, 0.44, 0.46]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CDM 2015 COMPLIANCE', 'AUDIT & NCR REGISTER'], d.projectName || '', A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef + ' Rev A' },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Assessed By', value: d.assessedBy },
            { label: 'Reviewed By', value: d.principalDesigner || '' },
            { label: 'Approved By', value: '' },
            { label: 'Project', value: d.projectName + (d.contractRef ? ` (${d.contractRef})` : '') },
            { label: 'Contractor', value: d.contractor },
            { label: 'Confidentiality', value: d.confidentiality || 'Restricted \u2014 Project Team Only' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — Doc Control, Checks, NCRs, Observations, Approval
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'DOCUMENT CONTROL & REVISION HISTORY', A), h.spacer(80),
          ...(d.revisionHistory.length > 0 ? [dataTable(A,
            [{ text: 'REV', width: revCols[0] }, { text: 'DATE', width: revCols[1] }, { text: 'DESCRIPTION', width: revCols[2] }, { text: 'AUTHOR', width: revCols[3] }, { text: 'STATUS', width: revCols[4] }],
            d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author, r.status])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('02', 'COMPLIANCE CHECKS \u2014 WITH EVIDENCE REFERENCES', A), h.spacer(80),
          ...(d.auditChecks.length > 0 ? [dataTable(A,
            [{ text: 'REF', width: chkCols[0] }, { text: 'CDM DUTY', width: chkCols[1] }, { text: 'REG.', width: chkCols[2] }, { text: 'STATUS', width: chkCols[3] }, { text: 'EVIDENCE REVIEWED', width: chkCols[4] }, { text: 'FINDING', width: chkCols[5] }],
            d.auditChecks.map(c => [c.ref, c.duty, c.regulation, c.status, c.evidenceReviewed, c.finding]),
            [3]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('03', 'NON-CONFORMANCE REGISTER', A), h.spacer(80),
          ...(d.ncrRegister.length > 0 ? [dataTable(A,
            [{ text: 'NCR NO.', width: ncrCols[0] }, { text: 'CAT', width: ncrCols[1] }, { text: 'DESCRIPTION', width: ncrCols[2] }, { text: 'REG.', width: ncrCols[3] }, { text: 'RAISED AGAINST', width: ncrCols[4] }, { text: 'PRIORITY', width: ncrCols[5] }, { text: 'TARGET CLOSE', width: ncrCols[6] }],
            d.ncrRegister.map(n => [n.ncrNo, n.category, n.description, n.regulation, n.raisedAgainst, n.priority, n.targetClose]),
            [5]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('04', 'OBSERVATIONS REGISTER', A), h.spacer(80),
          ...(d.observations.length > 0 ? [dataTable(A,
            [{ text: 'OBS NO.', width: obsCols[0] }, { text: 'OBSERVATION', width: obsCols[1] }, { text: 'RECOMMENDATION', width: obsCols[2] }],
            d.observations.map(o => [o.obsNo, o.observation, o.recommendation])
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('05', 'APPROVAL CHAIN', A), h.spacer(80),
          h.signatureGrid(
            d.approvalChain.length > 0 ? d.approvalChain.map(a => a.role) : ['Audit Author', 'Technical Reviewer', 'Client Approver', 'Distribution'],
            A, W
          ),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — EXECUTIVE SUMMARY (Charcoal #2d3748)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: CdmData): Document {
  const A = CHAR;
  const hdr = h.accentHeader('CDM 2015 \u2014 Executive Summary', A);
  const ftr = h.accentFooter(d.documentRef, 'Executive Summary', A);

  const findCols = cols([0.06, 0.34, 0.28, 0.32]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['CDM 2015 COMPLIANCE', 'EXECUTIVE SUMMARY'], d.projectName || '', A, CHAR_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Assessment Date', value: d.assessmentDate },
            { label: 'Project', value: d.projectName + (d.contractRef ? ` (${d.contractRef})` : '') },
            { label: 'Client', value: d.client },
            { label: 'Contractor', value: d.contractor },
            { label: 'Overall Rating', value: d.overallComplianceRating },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Dashboard page
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'COMPLIANCE DASHBOARD', A), h.spacer(80),
          h.kpiDashboard(
            d.kpiItems.length > 0 ? d.kpiItems.slice(0, 3).map(k => ({ value: k.value, label: k.label })) : [
              { value: d.overallPercentage || '59%', label: 'Overall Compliance' },
              { value: d.highGapCount || '3', label: 'High-Priority Gaps' },
              { value: d.mediumGapCount || '4', label: 'Medium Gaps' },
            ], A, W
          ),
          h.spacer(60),
          // Duty holder score summary
          ...(d.dutyHolderScores.length > 0 ? d.dutyHolderScores.map(dhs =>
            h.bodyText(`${dhs.holder}: ${dhs.percentage} \u2014 ${dhs.detail}`, SM, { bold: true })
          ) : []),
          h.spacer(80), h.fullWidthSectionBar('', 'KEY FINDINGS \u2014 PRIORITY RANKED', A), h.spacer(80),
          ...(d.keyFindings.length > 0 ? [dataTable(A,
            [{ text: '#', width: findCols[0] }, { text: 'FINDING', width: findCols[1] }, { text: 'RISK', width: findCols[2] }, { text: 'ACTION REQUIRED', width: findCols[3] }],
            d.keyFindings.map(f => [f.number, f.finding, f.risk, f.action]),
            [0]
          )] : []),
          h.spacer(80), h.fullWidthSectionBar('', 'NARRATIVE RECOMMENDATIONS', A), h.spacer(80),
          ...h.richBodyText(d.narrativeSummary || ''),
          h.spacer(60),
          h.signatureGrid(['Assessed By', 'For Client Review'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildCdmCheckerTemplateDocument(
  content: any,
  templateSlug: CdmCheckerTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':   return buildT1(d);
    case 'compliance-matrix': return buildT2(d);
    case 'audit-trail':       return buildT3(d);
    case 'executive-summary': return buildT4(d);
    default:                  return buildT1(d);
  }
}
