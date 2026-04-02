// =============================================================================
// NCR Builder — Multi-Template Engine
// 6 visual templates, all consuming the same NCR JSON structure.
//   T1 — Ebrora Standard       (green, 5-Whys, ~3pp)
//   T2 — ISO 9001 Formal       (navy, CAPA register, 3-tier approval, ~4pp)
//   T3 — Red Alert              (red, severity-first, stop-work, ~2pp)
//   T4 — Compact Close-Out      (grey, condensed, fast resolution, ~2pp)
//   T5 — Supplier NCR           (orange, supply chain, cost recovery, ~3pp)
//   T6 — Audit Trail            (dark navy, evidence-grade, lifecycle, ~4pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { NcrTemplateSlug } from '@/lib/ncr/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;
const EBRORA = h.EBRORA_GREEN;
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const RED = 'DC2626'; const RED_BG = 'FEF2F2'; const RED_DARK = '991B1B';
const ORANGE = '92400E'; const ORANGE_BG = 'FFFBEB';
const TEAL = '0f766e'; const GREY_COMP = '374151';
const ZEBRA = 'F5F5F5';

interface NcrData {
  ncrRef: string; ncrDate: string; ncrCategory: string; severity: string; stopWork: string;
  projectName: string; contractRef: string; discipline: string; raisedBy: string;
  location: string; discoveryDate: string; discoveredBy: string; discoveryMethod: string;
  specRequirement: string; specClause: string; drawingRef: string; standardRef: string; tolerances: string;
  actualCondition: string; measurements: string; photosAvailable: string;
  rootCauseMethod: string; rootCause: string; fiveWhys: Array<{ why: string; answer: string }>;
  containmentActions: Array<{ action: string; by: string; date: string }>;
  correctiveActions: Array<{ action: string; owner: string; targetDate: string; verificationMethod: string; status: string }>;
  preventiveActions: Array<{ action: string; owner: string; targetDate: string }>;
  disposition: string; dispositionJustification: string;
  riskAssessment: string; costImpact: string; programmeImpact: string;
  supplierName: string; supplierContact: string; poRef: string; deliveryNoteRef: string;
  supplierResponseRequired: string; supplierResponseDeadline: string; backChargeAmount: string;
  capaRegister: Array<{ ref: string; description: string; owner: string; targetDate: string; verificationDate: string; status: string }>;
  evidenceLog: Array<{ docType: string; reference: string; revision: string; date: string; author: string }>;
  lifecycle: Array<{ stage: string; date: string; responsible: string }>;
  approvalChain: Array<{ role: string; name: string; qualification: string; date: string }>;
  revisionHistory: Array<{ rev: string; date: string; description: string; author: string }>;
  closeOutDate: string; closeOutBy: string; closeOutEvidence: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): NcrData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    ncrRef: s('ncrRef', 'NCR-001'), ncrDate: s('ncrDate'), ncrCategory: s('ncrCategory'), severity: s('severity'), stopWork: s('stopWork'),
    projectName: s('projectName'), contractRef: s('contractRef'), discipline: s('discipline'), raisedBy: s('raisedBy'),
    location: s('location'), discoveryDate: s('discoveryDate'), discoveredBy: s('discoveredBy'), discoveryMethod: s('discoveryMethod'),
    specRequirement: s('specRequirement'), specClause: s('specClause'), drawingRef: s('drawingRef'), standardRef: s('standardRef'), tolerances: s('tolerances'),
    actualCondition: s('actualCondition'), measurements: s('measurements'), photosAvailable: s('photosAvailable'),
    rootCauseMethod: s('rootCauseMethod', '5-Whys'), rootCause: s('rootCause'), fiveWhys: a('fiveWhys'),
    containmentActions: a('containmentActions'), correctiveActions: a('correctiveActions'), preventiveActions: a('preventiveActions'),
    disposition: s('disposition'), dispositionJustification: s('dispositionJustification'),
    riskAssessment: s('riskAssessment'), costImpact: s('costImpact'), programmeImpact: s('programmeImpact'),
    supplierName: s('supplierName'), supplierContact: s('supplierContact'), poRef: s('poRef'), deliveryNoteRef: s('deliveryNoteRef'),
    supplierResponseRequired: s('supplierResponseRequired'), supplierResponseDeadline: s('supplierResponseDeadline'), backChargeAmount: s('backChargeAmount'),
    capaRegister: a('capaRegister'), evidenceLog: a('evidenceLog'), lifecycle: a('lifecycle'),
    approvalChain: a('approvalChain'), revisionHistory: a('revisionHistory'),
    closeOutDate: s('closeOutDate'), closeOutBy: s('closeOutBy'), closeOutEvidence: s('closeOutEvidence'),
    additionalNotes: s('additionalNotes'),
  };
}

function hdrCell(text: string, width: number, color = EBRORA) { return h.headerCell(text, width, { fillColor: color, color: 'FFFFFF', fontSize: SM }); }
function dCell(text: string, width: number, opts?: { fill?: string }) { return h.dataCell(text, width, { fontSize: SM, fillColor: opts?.fill }); }
function dataTable(headers: { text: string; width: number }[], rows: any[][], color = EBRORA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, color)) }),
    ...rows.map((cells, i) => new TableRow({ children: cells.map((cell, ci) => dCell(String(cell || ''), headers[ci].width, { fill: i % 2 === 1 ? ZEBRA : undefined })) })),
  ] });
}
function footerLine() { return h.bodyText('— End of Document —', SM, { italic: true, color: '999999' }); }

function ncrInfoBlock(d: NcrData) {
  return h.infoTable([
    { label: 'NCR Ref', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
    { label: 'Category', value: d.ncrCategory }, { label: 'Severity', value: d.severity },
    { label: 'Project', value: d.projectName }, { label: 'Contract', value: d.contractRef },
    { label: 'Discipline', value: d.discipline }, { label: 'Raised By', value: d.raisedBy },
    { label: 'Location', value: d.location },
  ], W);
}

function correctiveActionsTable(d: NcrData, color = EBRORA) {
  if (d.correctiveActions.length === 0) return h.bodyText('No corrective actions recorded.', SM);
  const cw = [Math.round(W*0.30), Math.round(W*0.18), Math.round(W*0.16), Math.round(W*0.20), W - Math.round(W*0.30) - Math.round(W*0.18) - Math.round(W*0.16) - Math.round(W*0.20)];
  return dataTable([{ text: 'Action', width: cw[0] }, { text: 'Owner', width: cw[1] }, { text: 'Target', width: cw[2] }, { text: 'Verification', width: cw[3] }, { text: 'Status', width: cw[4] }],
    d.correctiveActions.map(ca => [ca.action, ca.owner, ca.targetDate, ca.verificationMethod, ca.status]), color);
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — Ebrora Standard
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(ncrInfoBlock(d) as any);
  sec.push(h.sectionHeading('1. Non-Conformance Description'));
  sec.push(...h.prose(d.actualCondition));
  sec.push(h.sectionHeading('2. Specification & Requirement'));
  sec.push(h.bodyText(`Drawing: ${d.drawingRef} | Clause: ${d.specClause} | Standard: ${d.standardRef}`, SM));
  sec.push(...h.prose(d.specRequirement));
  if (d.tolerances) sec.push(h.bodyText(`Tolerances: ${d.tolerances}`, SM));
  sec.push(h.sectionHeading('3. Root Cause Analysis (5-Whys)'));
  d.fiveWhys.forEach((w, i) => { sec.push(h.bodyText(`Why ${i+1}: ${w.why}`, BODY, { bold: true })); sec.push(h.bodyText(`→ ${w.answer}`, SM)); });
  if (d.rootCause) sec.push(h.bodyText(`Root Cause: ${d.rootCause}`, BODY, { bold: true, color: EBRORA }));
  sec.push(h.sectionHeading('4. Containment Actions'));
  d.containmentActions.forEach(ca => { sec.push(h.bodyText(`• ${ca.action} (${ca.by}, ${ca.date})`, SM)); });
  sec.push(h.sectionHeading('5. Corrective Actions'));
  sec.push(correctiveActionsTable(d) as any);
  sec.push(h.sectionHeading('6. Preventive Actions'));
  d.preventiveActions.forEach(pa => { sec.push(h.bodyText(`• ${pa.action} — ${pa.owner} by ${pa.targetDate}`, SM)); });
  sec.push(h.sectionHeading('7. Disposition'));
  sec.push(h.bodyText(`Decision: ${d.disposition}`, BODY, { bold: true }));
  sec.push(...h.prose(d.dispositionJustification));
  sec.push(h.sectionHeading('8. Close-Out Verification'));
  sec.push(h.bodyText(`Close-Out Date: ${d.closeOutDate || '________'} | Verified By: ${d.closeOutBy || '________'}`, SM));
  if (d.closeOutEvidence) sec.push(h.bodyText(`Evidence: ${d.closeOutEvidence}`, SM));
  sec.push(h.sectionHeading('9. Sign-Off'));
  sec.push(h.approvalTable(d.approvalChain.map((a: any) => ({ role: a.role, name: a.name, date: a.date })), W));
  if (d.additionalNotes) { sec.push(h.sectionHeading('10. Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [
    { properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Non-Conformance Report') }, footers: { default: h.ebroraFooter() }, children: sec },
  ] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T2 — ISO 9001 Formal
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(h.sectionHeading('Document Control', LG, NAVY));
  if (d.revisionHistory.length > 0) {
    const rw = [Math.round(W*0.10), Math.round(W*0.18), Math.round(W*0.50), W - Math.round(W*0.10) - Math.round(W*0.18) - Math.round(W*0.50)];
    sec.push(dataTable([{ text: 'Rev', width: rw[0] }, { text: 'Date', width: rw[1] }, { text: 'Description', width: rw[2] }, { text: 'Author', width: rw[3] }], d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author]), NAVY) as any);
  }
  sec.push(ncrInfoBlock(d) as any);
  sec.push(h.sectionHeading('1. NCR Classification (ISO 9001:2015 cl.10.2)', LG, NAVY));
  sec.push(h.bodyText(`Category: ${d.ncrCategory} | Severity: ${d.severity} | Stop Work: ${d.stopWork || 'No'}`, BODY, { bold: true, color: NAVY }));
  sec.push(h.sectionHeading('2. Non-Conformance Description', LG, NAVY));
  sec.push(...h.prose(d.actualCondition));
  sec.push(h.sectionHeading('3. Specified Requirement', LG, NAVY));
  sec.push(...h.prose(d.specRequirement));
  sec.push(h.bodyText(`Drawing: ${d.drawingRef} | Clause: ${d.specClause} | Standard: ${d.standardRef}`, SM));
  sec.push(h.sectionHeading('4. Root Cause Analysis', LG, NAVY));
  sec.push(h.bodyText(`Method: ${d.rootCauseMethod}`, SM));
  d.fiveWhys.forEach((w, i) => { sec.push(h.bodyText(`Why ${i+1}: ${w.why} → ${w.answer}`, SM)); });
  if (d.rootCause) sec.push(h.bodyText(`Root Cause: ${d.rootCause}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('5. Risk Assessment', LG, NAVY));
  sec.push(...h.prose(d.riskAssessment || 'Risk assessment of non-conformance impact pending.'));
  if (d.costImpact) sec.push(h.bodyText(`Cost Impact: ${d.costImpact}`, SM));
  if (d.programmeImpact) sec.push(h.bodyText(`Programme Impact: ${d.programmeImpact}`, SM));
  sec.push(h.sectionHeading('6. CAPA Register', LG, NAVY));
  if (d.capaRegister.length > 0) {
    const cw = [Math.round(W*0.08), Math.round(W*0.25), Math.round(W*0.15), Math.round(W*0.14), Math.round(W*0.14), W - Math.round(W*0.08) - Math.round(W*0.25) - Math.round(W*0.15) - Math.round(W*0.14) - Math.round(W*0.14)];
    sec.push(dataTable([{ text: 'Ref', width: cw[0] }, { text: 'Action', width: cw[1] }, { text: 'Owner', width: cw[2] }, { text: 'Target', width: cw[3] }, { text: 'Verify', width: cw[4] }, { text: 'Status', width: cw[5] }],
      d.capaRegister.map(c => [c.ref, c.description, c.owner, c.targetDate, c.verificationDate, c.status]), NAVY) as any);
  } else {
    sec.push(correctiveActionsTable(d, NAVY) as any);
  }
  sec.push(h.sectionHeading('7. Disposition', LG, NAVY));
  sec.push(h.bodyText(`Decision: ${d.disposition}`, BODY, { bold: true }));
  sec.push(...h.prose(d.dispositionJustification));
  sec.push(h.sectionHeading('8. Approval Chain', LG, NAVY));
  if (d.approvalChain.length > 0) {
    const aw = [Math.round(W*0.20), Math.round(W*0.25), Math.round(W*0.30), W - Math.round(W*0.20) - Math.round(W*0.25) - Math.round(W*0.30)];
    sec.push(dataTable([{ text: 'Role', width: aw[0] }, { text: 'Name', width: aw[1] }, { text: 'Qualification', width: aw[2] }, { text: 'Date', width: aw[3] }], d.approvalChain.map(a => [a.role, a.name, a.qualification, a.date]), NAVY) as any);
  }
  if (d.additionalNotes) { sec.push(h.sectionHeading('9. Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('NCR — ISO 9001') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T3 — Red Alert (severity-first, stop-work, urgent)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: RED }, children: [new TextRun({ text: `NON-CONFORMANCE — ${d.severity || 'CRITICAL'}`, bold: true, size: TTL, color: 'FFFFFF' })] }));
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, shading: { type: ShadingType.CLEAR, fill: RED_DARK }, children: [new TextRun({ text: `STOP WORK: ${d.stopWork || 'YES'}`, bold: true, size: XL, color: 'FFFFFF' })] }));
  sec.push(ncrInfoBlock(d) as any);
  sec.push(h.sectionHeading('Defect Description', LG, RED));
  sec.push(...h.prose(d.actualCondition));
  sec.push(h.sectionHeading('Required vs Actual', LG, RED));
  sec.push(h.bodyText(`Required: ${d.specRequirement}`, SM)); sec.push(h.bodyText(`Actual: ${d.measurements}`, SM));
  sec.push(h.sectionHeading('Impact Assessment', LG, RED));
  sec.push(...h.prose(d.riskAssessment || d.potentialConsequences || ''));
  sec.push(new Paragraph({ spacing: { before: 100, after: 100 }, shading: { type: ShadingType.CLEAR, fill: RED_BG }, children: [new TextRun({ text: '  IMMEDIATE ACTIONS REQUIRED:', bold: true, size: LG, color: RED })] }));
  d.correctiveActions.forEach((ca, i) => { sec.push(h.bodyText(`${i+1}. ${ca.action} — ${ca.owner} by ${ca.targetDate}`, BODY, { bold: true, color: RED_DARK })); });
  sec.push(h.sectionHeading('Disposition', LG, RED));
  sec.push(h.bodyText(`${d.disposition}: ${d.dispositionJustification}`, BODY, { bold: true }));
  sec.push(h.spacer(200));
  sec.push(h.bodyText('Authorised: ________________________________  Date: ____________', SM));
  sec.push(h.spacer(100)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NARROW, bottom: h.MARGIN_NARROW, left: h.MARGIN_NARROW, right: h.MARGIN_NARROW } } }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T4 — Compact Close-Out (condensed, fast resolution)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'NCR — COMPACT CLOSE-OUT', bold: true, size: XL, color: GREY_COMP })] }));
  sec.push(h.infoTable([
    { label: 'NCR Ref', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
    { label: 'Severity', value: d.severity || 'Minor' }, { label: 'Project', value: d.projectName },
    { label: 'Location', value: d.location }, { label: 'Raised By', value: d.raisedBy },
  ], W));
  sec.push(h.sectionHeading('Defect', LG, GREY_COMP));
  sec.push(...h.prose(d.actualCondition));
  sec.push(h.bodyText(`Spec: ${d.specClause || d.drawingRef || 'N/A'}`, SM));
  sec.push(h.sectionHeading('Corrective Action', LG, GREY_COMP));
  d.correctiveActions.forEach(ca => { sec.push(h.bodyText(`• ${ca.action} — ${ca.owner} by ${ca.targetDate}`, SM)); });
  sec.push(h.sectionHeading('Disposition', LG, GREY_COMP));
  sec.push(h.bodyText(`${d.disposition}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('Close-Out', LG, GREY_COMP));
  sec.push(h.bodyText(`Verified By: ${d.closeOutBy || '________'}  Date: ${d.closeOutDate || '________'}`, SM));
  sec.push(h.bodyText(`Evidence: ${d.closeOutEvidence || '________'}`, SM));
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NARROW, bottom: h.MARGIN_NARROW, left: h.MARGIN_NARROW, right: h.MARGIN_NARROW } } }, headers: { default: h.ebroraHeader('NCR Close-Out') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T5 — Supplier NCR (supply chain, cost recovery)
// ═════════════════════════════════════════════════════════════════════════════
function buildT5(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'SUPPLIER / SUBCONTRACTOR NCR', bold: true, size: TTL, color: ORANGE })] }));
  sec.push(h.infoTable([
    { label: 'NCR Ref', value: d.ncrRef }, { label: 'Date', value: d.ncrDate },
    { label: 'Supplier', value: d.supplierName }, { label: 'Contact', value: d.supplierContact },
    { label: 'PO Ref', value: d.poRef }, { label: 'Delivery Note', value: d.deliveryNoteRef },
    { label: 'Project', value: d.projectName }, { label: 'Severity', value: d.severity },
  ], W));
  sec.push(h.sectionHeading('1. Non-Conformance Against Specification', LG, ORANGE));
  sec.push(h.bodyText(`Required: ${d.specRequirement}`, SM));
  sec.push(h.bodyText(`Actual: ${d.actualCondition}`, SM));
  sec.push(h.bodyText(`Standard: ${d.standardRef} | Drawing: ${d.drawingRef}`, SM));
  sec.push(h.sectionHeading('2. Goods Inspection Record', LG, ORANGE));
  sec.push(h.bodyText(`Inspected By: ${d.discoveredBy} | Date: ${d.discoveryDate} | Method: ${d.discoveryMethod}`, SM));
  sec.push(h.bodyText(`Photos: ${d.photosAvailable || 'N/A'}`, SM));
  sec.push(h.sectionHeading('3. Disposition Decision', LG, ORANGE));
  sec.push(h.bodyText(`${d.disposition}: ${d.dispositionJustification}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('4. Cost Recovery & Back-Charge', LG, ORANGE));
  sec.push(h.bodyText(`Cost Impact: ${d.costImpact || 'To be assessed'}`, SM));
  sec.push(h.bodyText(`Back-Charge Amount: ${d.backChargeAmount || 'TBC'}`, SM, { bold: true }));
  sec.push(h.sectionHeading('5. Supplier Response Required', LG, ORANGE));
  sec.push(h.bodyText(`Response Deadline: ${d.supplierResponseDeadline || '5 working days'}`, BODY, { bold: true, color: ORANGE }));
  sec.push(h.bodyText('The supplier must provide: root cause analysis, corrective action plan, evidence of implementation, and preventive measures.', SM));
  sec.push(h.sectionHeading('6. Corrective Actions', LG, ORANGE));
  sec.push(correctiveActionsTable(d, ORANGE) as any);
  sec.push(h.sectionHeading('7. Sign-Off'));
  sec.push(h.approvalTable(d.approvalChain.map((a: any) => ({ role: a.role, name: a.name, date: a.date })), W));
  if (d.additionalNotes) { sec.push(h.sectionHeading('8. Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Supplier NCR') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T6 — Audit Trail (evidence-grade, lifecycle)
// ═════════════════════════════════════════════════════════════════════════════
function buildT6(d: NcrData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'NCR — AUDIT TRAIL', bold: true, size: TTL, color: NAVY })] }));
  if (d.revisionHistory.length > 0) {
    sec.push(h.sectionHeading('Document Control', LG, NAVY));
    const rw = [Math.round(W*0.10), Math.round(W*0.18), Math.round(W*0.50), W - Math.round(W*0.10) - Math.round(W*0.18) - Math.round(W*0.50)];
    sec.push(dataTable([{ text: 'Rev', width: rw[0] }, { text: 'Date', width: rw[1] }, { text: 'Description', width: rw[2] }, { text: 'Author', width: rw[3] }], d.revisionHistory.map(r => [r.rev, r.date, r.description, r.author]), NAVY) as any);
  }
  sec.push(ncrInfoBlock(d) as any);
  sec.push(h.sectionHeading('1. NCR Lifecycle Timeline', LG, NAVY));
  if (d.lifecycle.length > 0) {
    const lw = [Math.round(W*0.30), Math.round(W*0.25), W - Math.round(W*0.30) - Math.round(W*0.25)];
    sec.push(dataTable([{ text: 'Stage', width: lw[0] }, { text: 'Date', width: lw[1] }, { text: 'Responsible', width: lw[2] }], d.lifecycle.map(l => [l.stage, l.date, l.responsible]), NAVY) as any);
  }
  sec.push(h.sectionHeading('2. Evidence Log', LG, NAVY));
  if (d.evidenceLog.length > 0) {
    const ew = [Math.round(W*0.18), Math.round(W*0.22), Math.round(W*0.10), Math.round(W*0.16), W - Math.round(W*0.18) - Math.round(W*0.22) - Math.round(W*0.10) - Math.round(W*0.16)];
    sec.push(dataTable([{ text: 'Doc Type', width: ew[0] }, { text: 'Reference', width: ew[1] }, { text: 'Rev', width: ew[2] }, { text: 'Date', width: ew[3] }, { text: 'Author', width: ew[4] }], d.evidenceLog.map(e => [e.docType, e.reference, e.revision, e.date, e.author]), NAVY) as any);
  }
  sec.push(h.sectionHeading('3. Non-Conformance Description', LG, NAVY));
  sec.push(...h.prose(d.actualCondition));
  sec.push(h.sectionHeading('4. Specification Traceability', LG, NAVY));
  sec.push(h.bodyText(`Drawing: ${d.drawingRef} | Spec: ${d.specClause} | Standard: ${d.standardRef}`, SM));
  sec.push(...h.prose(d.specRequirement));
  sec.push(h.sectionHeading('5. Root Cause Investigation', LG, NAVY));
  sec.push(h.bodyText(`Method: ${d.rootCauseMethod}`, SM));
  d.fiveWhys.forEach((w, i) => { sec.push(h.bodyText(`Why ${i+1}: ${w.why} → ${w.answer}`, SM)); });
  if (d.rootCause) sec.push(h.bodyText(`Root Cause: ${d.rootCause}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('6. Cost & Programme Impact', LG, NAVY));
  sec.push(h.bodyText(`Cost: ${d.costImpact || 'TBC'} | Programme: ${d.programmeImpact || 'TBC'}`, SM));
  sec.push(h.sectionHeading('7. Corrective & Preventive Actions', LG, NAVY));
  sec.push(correctiveActionsTable(d, NAVY) as any);
  sec.push(h.subHeading('Preventive Actions', BODY, NAVY));
  d.preventiveActions.forEach(pa => { sec.push(h.bodyText(`• ${pa.action} — ${pa.owner} by ${pa.targetDate}`, SM)); });
  sec.push(h.sectionHeading('8. Disposition', LG, NAVY));
  sec.push(h.bodyText(`${d.disposition}: ${d.dispositionJustification}`, BODY, { bold: true }));
  sec.push(h.sectionHeading('9. Close-Out & Approval', LG, NAVY));
  if (d.approvalChain.length > 0) {
    const aw = [Math.round(W*0.20), Math.round(W*0.25), Math.round(W*0.30), W - Math.round(W*0.20) - Math.round(W*0.25) - Math.round(W*0.30)];
    sec.push(dataTable([{ text: 'Role', width: aw[0] }, { text: 'Name', width: aw[1] }, { text: 'Qualification', width: aw[2] }, { text: 'Date', width: aw[3] }], d.approvalChain.map(a => [a.role, a.name, a.qualification, a.date]), NAVY) as any);
  }
  if (d.additionalNotes) { sec.push(h.sectionHeading('10. Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('NCR — Audit Trail') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildNcrTemplateDocument(content: any, templateSlug: NcrTemplateSlug): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':  return buildT1(d);
    case 'iso-9001-formal':  return buildT2(d);
    case 'red-alert':        return buildT3(d);
    case 'compact-closeout': return buildT4(d);
    case 'supplier-ncr':     return buildT5(d);
    case 'audit-trail':      return buildT6(d);
    default:                 return buildT1(d);
  }
}
