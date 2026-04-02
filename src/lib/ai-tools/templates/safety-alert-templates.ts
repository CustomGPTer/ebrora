// =============================================================================
// Safety Alert Builder — Multi-Template Engine
// 4 visual templates, all consuming the same Safety Alert JSON structure.
//   T1 — Ebrora Standard       (green, structured bulletin, ~2pp)
//   T2 — Red Emergency          (red banner, single page, max impact)
//   T3 — Lessons Learned        (teal, narrative, toolbox talk format, ~2pp)
//   T4 — Formal Investigation   (charcoal, HSG245, evidence-grade, ~3pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { SafetyAlertTemplateSlug } from '@/lib/safety-alert/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;
const EBRORA = h.EBRORA_GREEN;
const RED = 'DC2626'; const RED_BG = 'FEF2F2'; const RED_DARK = '991B1B';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa';
const CHARCOAL = '1f2937'; const CHARCOAL_BG = 'f9fafb';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

interface SaData {
  alertRef: string; alertDate: string; classification: string; severity: string;
  projectName: string; siteLocation: string; client: string; principalContractor: string;
  incidentDate: string; incidentTime: string; incidentSummary: string;
  timeline: Array<{ time: string; event: string }>;
  personsInvolved: Array<{ name: string; role: string; employer: string; outcome: string }>;
  immediateCauses: string; underlyingFactors: string; organisationalFactors: string;
  potentialConsequences: string; worstCase: string;
  immediateActionsTaken: Array<{ action: string; by: string; date: string }>;
  lessonsLearned: Array<{ lesson: string; detail: string }>;
  preventiveActions: Array<{ action: string; owner: string; targetDate: string; verificationMethod: string }>;
  discussionPrompts: string[];
  distributionScope: string; briefingMethod: string;
  distributionList: Array<{ name: string; role: string; organisation: string; date: string }>;
  riddorReportable: string; riddorRef: string;
  contributoryFactors: Array<{ category: string; factor: string; assessment: string }>;
  barrierAnalysis: Array<{ barrier: string; status: string; assessment: string }>;
  evidencePreservation: string;
  investigationLead: string; investigationTeam: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): SaData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    alertRef: s('alertRef', 'SA-001'), alertDate: s('alertDate'), classification: s('classification'),
    severity: s('severity'), projectName: s('projectName'), siteLocation: s('siteLocation'),
    client: s('client'), principalContractor: s('principalContractor'),
    incidentDate: s('incidentDate'), incidentTime: s('incidentTime'), incidentSummary: s('incidentSummary'),
    timeline: a('timeline'), personsInvolved: a('personsInvolved'),
    immediateCauses: s('immediateCauses'), underlyingFactors: s('underlyingFactors'),
    organisationalFactors: s('organisationalFactors'), potentialConsequences: s('potentialConsequences'),
    worstCase: s('worstCase'), immediateActionsTaken: a('immediateActionsTaken'),
    lessonsLearned: a('lessonsLearned'), preventiveActions: a('preventiveActions'),
    discussionPrompts: a('discussionPrompts'), distributionScope: s('distributionScope'),
    briefingMethod: s('briefingMethod'), distributionList: a('distributionList'),
    riddorReportable: s('riddorReportable'), riddorRef: s('riddorRef'),
    contributoryFactors: a('contributoryFactors'), barrierAnalysis: a('barrierAnalysis'),
    evidencePreservation: s('evidencePreservation'),
    investigationLead: s('investigationLead'), investigationTeam: s('investigationTeam'),
    additionalNotes: s('additionalNotes'),
  };
}

function hdrCell(text: string, width: number, color = EBRORA) {
  return h.headerCell(text, width, { fillColor: color, color: 'FFFFFF', fontSize: SM });
}
function dCell(text: string, width: number, opts?: { fill?: string }) {
  return h.dataCell(text, width, { fontSize: SM, fillColor: opts?.fill });
}
function dataTable(headers: { text: string; width: number }[], rows: any[][], color = EBRORA): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, color)) }),
      ...rows.map((cells, i) => new TableRow({
        children: cells.map((cell, ci) => dCell(String(cell || ''), headers[ci].width, { fill: i % 2 === 1 ? ZEBRA : undefined })),
      })),
    ],
  });
}
function footerLine() { return h.bodyText('— End of Document —', SM, { italic: true, color: '999999' }); }

// ═════════════════════════════════════════════════════════════════════════════
// T1 — Ebrora Standard (green branded, structured bulletin)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: SaData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: '⚠ SAFETY ALERT', bold: true, size: TTL, color: EBRORA })] }));
  sec.push(h.infoTable([
    { label: 'Alert Ref', value: d.alertRef }, { label: 'Date', value: d.alertDate },
    { label: 'Classification', value: d.classification }, { label: 'Project', value: d.projectName },
    { label: 'Site', value: d.siteLocation }, { label: 'Client', value: d.client },
  ], W));
  sec.push(h.sectionHeading('Incident Summary'));
  sec.push(...h.prose(d.incidentSummary));
  sec.push(h.sectionHeading('What Happened — Timeline'));
  d.timeline.forEach(t => { sec.push(h.bodyText(`${t.time} — ${t.event}`, SM)); });
  sec.push(h.sectionHeading('Immediate Causes'));
  sec.push(...h.prose(d.immediateCauses));
  sec.push(h.sectionHeading('Underlying Factors'));
  sec.push(...h.prose(d.underlyingFactors));
  sec.push(h.sectionHeading('Potential Consequences'));
  sec.push(...h.prose(d.potentialConsequences));
  if (d.worstCase) sec.push(h.bodyText(`Worst Case: ${d.worstCase}`, BODY, { bold: true, color: RED }));
  sec.push(h.sectionHeading('Immediate Actions Taken'));
  d.immediateActionsTaken.forEach(a => { sec.push(h.bodyText(`• ${a.action} (${a.by}, ${a.date})`, SM)); });
  sec.push(h.sectionHeading('Lessons Learned'));
  d.lessonsLearned.forEach(l => { sec.push(h.bodyText(`${l.lesson}`, BODY, { bold: true })); sec.push(...h.prose(l.detail)); });
  sec.push(h.sectionHeading('Preventive Actions — What You Must Do'));
  if (d.preventiveActions.length > 0) {
    const pw = [Math.round(W*0.35), Math.round(W*0.20), Math.round(W*0.18), W - Math.round(W*0.35) - Math.round(W*0.20) - Math.round(W*0.18)];
    sec.push(dataTable(
      [{ text: 'Action', width: pw[0] }, { text: 'Owner', width: pw[1] }, { text: 'Target Date', width: pw[2] }, { text: 'Verification', width: pw[3] }],
      d.preventiveActions.map(p => [p.action, p.owner, p.targetDate, p.verificationMethod])
    ) as any);
  }
  sec.push(h.sectionHeading('Distribution & Briefing Confirmation'));
  sec.push(h.bodyText(`Scope: ${d.distributionScope} | Method: ${d.briefingMethod}`, SM));
  if (d.distributionList.length > 0) {
    sec.push(h.briefingRecordTable(Math.max(d.distributionList.length, 5), W));
  }
  if (d.additionalNotes) { sec.push(h.sectionHeading('Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Safety Alert') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T2 — Red Emergency (single page, maximum impact)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: SaData): Document {
  const sec: Paragraph[] = [];
  // Red banner
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, shading: { type: ShadingType.CLEAR, fill: RED }, children: [new TextRun({ text: '⚠  SAFETY ALERT  ⚠', bold: true, size: TTL + 8, color: 'FFFFFF' })] }));
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, shading: { type: ShadingType.CLEAR, fill: RED_DARK }, children: [new TextRun({ text: `${d.classification || 'NEAR MISS'} — ${d.severity || 'HIGH'}`, bold: true, size: XL, color: 'FFFFFF' })] }));
  // Key message
  sec.push(h.spacer(100));
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, shading: { type: ShadingType.CLEAR, fill: RED_BG }, children: [new TextRun({ text: d.incidentSummary || 'INCIDENT DETAILS', bold: true, size: LG, color: RED_DARK })] }));
  // Info bar
  sec.push(h.infoTable([
    { label: 'Ref', value: d.alertRef }, { label: 'Date', value: d.incidentDate },
    { label: 'Site', value: d.siteLocation || d.projectName },
  ], W));
  sec.push(h.spacer(100));
  // Immediate actions
  sec.push(new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: RED_BG }, children: [new TextRun({ text: '  IMMEDIATE ACTIONS REQUIRED:', bold: true, size: LG, color: RED })] }));
  d.preventiveActions.forEach((p, i) => {
    sec.push(h.bodyText(`${i + 1}. ${p.action}`, LG, { bold: true, color: RED_DARK }));
  });
  sec.push(h.spacer(100));
  // Who must be briefed
  sec.push(h.sectionHeading('Who Must Be Briefed', LG, RED));
  sec.push(h.bodyText(d.distributionScope || 'All site personnel', BODY, { bold: true }));
  sec.push(h.bodyText(d.briefingMethod || 'Toolbox talk before restart of works', SM));
  // Authorisation
  sec.push(h.spacer(200));
  sec.push(h.bodyText('Authorised by: ________________________________     Date: ____________', SM));
  sec.push(h.bodyText('Name & Role: ________________________________', SM));
  sec.push(h.spacer(100)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NARROW, bottom: h.MARGIN_NARROW, left: h.MARGIN_NARROW, right: h.MARGIN_NARROW } } }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T3 — Lessons Learned (narrative, toolbox talk format)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: SaData): Document {
  const sec: Paragraph[] = [];
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: 'SAFETY LESSONS LEARNED', bold: true, size: TTL, color: TEAL })] }));
  sec.push(h.infoTable([
    { label: 'Alert Ref', value: d.alertRef }, { label: 'Date', value: d.alertDate },
    { label: 'Type', value: d.classification }, { label: 'Site', value: d.siteLocation || d.projectName },
  ], W));
  sec.push(h.spacer(100));
  // The Story
  sec.push(h.sectionHeading('The Story — What Happened', LG, TEAL));
  sec.push(...h.prose(d.incidentSummary));
  if (d.timeline.length > 0) {
    d.timeline.forEach(t => { sec.push(h.bodyText(`${t.time} — ${t.event}`, SM)); });
  }
  // What Went Wrong
  sec.push(h.sectionHeading('What Went Wrong', LG, TEAL));
  sec.push(...h.prose(d.immediateCauses));
  if (d.underlyingFactors) sec.push(...h.prose(d.underlyingFactors));
  // What We Learned
  sec.push(h.sectionHeading('What We Learned', LG, TEAL));
  d.lessonsLearned.forEach(l => {
    sec.push(h.bodyText(l.lesson, BODY, { bold: true, color: TEAL }));
    sec.push(...h.prose(l.detail));
  });
  // What Changes Now
  sec.push(h.sectionHeading('What Changes Now', LG, TEAL));
  d.preventiveActions.forEach(p => { sec.push(h.bodyText(`• ${p.action} — ${p.owner} by ${p.targetDate}`, SM)); });
  // Discussion Prompts
  if (d.discussionPrompts.length > 0) {
    sec.push(h.sectionHeading('Discussion Prompts for Supervisors', LG, TEAL));
    d.discussionPrompts.forEach((q, i) => { sec.push(h.bodyText(`${i + 1}. ${q}`, BODY)); });
  }
  // Acknowledgement
  sec.push(h.sectionHeading('Operative Acknowledgement', LG, TEAL));
  sec.push(h.bodyText('I confirm I have been briefed on this safety alert and understand the lessons and actions.', SM));
  sec.push(h.spacer(80));
  sec.push(h.briefingRecordTable(5, W));
  if (d.additionalNotes) { sec.push(h.sectionHeading('Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Lessons Learned') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// T4 — Formal Investigation (HSG245, evidence-grade)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: SaData): Document {
  const sec: Paragraph[] = [];
  // Cover info
  sec.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'FORMAL INVESTIGATION REPORT', bold: true, size: TTL, color: CHARCOAL })] }));
  sec.push(h.infoTable([
    { label: 'Alert/Incident Ref', value: d.alertRef }, { label: 'Date of Incident', value: d.incidentDate },
    { label: 'Classification', value: d.classification }, { label: 'Severity', value: d.severity },
    { label: 'Project', value: d.projectName }, { label: 'Site', value: d.siteLocation },
    { label: 'Investigation Lead', value: d.investigationLead }, { label: 'RIDDOR Reportable', value: d.riddorReportable },
  ], W));
  sec.push(h.spacer(100));
  // Timeline
  sec.push(h.sectionHeading('1. Detailed Timeline Reconstruction', LG, CHARCOAL));
  if (d.timeline.length > 0) {
    const tw = [Math.round(W*0.15), W - Math.round(W*0.15)];
    sec.push(dataTable([{ text: 'Time', width: tw[0] }, { text: 'Event', width: tw[1] }], d.timeline.map(t => [t.time, t.event]), CHARCOAL) as any);
  }
  // Persons involved
  sec.push(h.sectionHeading('2. Persons Involved', LG, CHARCOAL));
  if (d.personsInvolved.length > 0) {
    const piw = [Math.round(W*0.22), Math.round(W*0.22), Math.round(W*0.28), W - Math.round(W*0.22) - Math.round(W*0.22) - Math.round(W*0.28)];
    sec.push(dataTable([{ text: 'Name', width: piw[0] }, { text: 'Role', width: piw[1] }, { text: 'Employer', width: piw[2] }, { text: 'Outcome', width: piw[3] }], d.personsInvolved.map(p => [p.name, p.role, p.employer, p.outcome]), CHARCOAL) as any);
  }
  // Causes
  sec.push(h.sectionHeading('3. Immediate Causes', LG, CHARCOAL));
  sec.push(...h.prose(d.immediateCauses));
  sec.push(h.sectionHeading('4. Underlying Factors', LG, CHARCOAL));
  sec.push(...h.prose(d.underlyingFactors));
  if (d.organisationalFactors) { sec.push(h.sectionHeading('5. Organisational Factors', LG, CHARCOAL)); sec.push(...h.prose(d.organisationalFactors)); }
  // Contributory Factor Analysis (HSG245)
  sec.push(h.sectionHeading('6. Contributory Factor Analysis (HSG245)', LG, CHARCOAL));
  if (d.contributoryFactors.length > 0) {
    const cfw = [Math.round(W*0.20), Math.round(W*0.40), W - Math.round(W*0.20) - Math.round(W*0.40)];
    sec.push(dataTable([{ text: 'Category', width: cfw[0] }, { text: 'Factor', width: cfw[1] }, { text: 'Assessment', width: cfw[2] }], d.contributoryFactors.map(cf => [cf.category, cf.factor, cf.assessment]), CHARCOAL) as any);
  }
  // Barrier Analysis
  sec.push(h.sectionHeading('7. Barrier Analysis', LG, CHARCOAL));
  if (d.barrierAnalysis.length > 0) {
    const bw = [Math.round(W*0.30), Math.round(W*0.22), W - Math.round(W*0.30) - Math.round(W*0.22)];
    sec.push(dataTable([{ text: 'Barrier / Defence', width: bw[0] }, { text: 'Status', width: bw[1] }, { text: 'Assessment', width: bw[2] }], d.barrierAnalysis.map(b => [b.barrier, b.status, b.assessment]), CHARCOAL) as any);
  }
  // RIDDOR
  sec.push(h.sectionHeading('8. RIDDOR Reportability Assessment', LG, CHARCOAL));
  sec.push(h.bodyText(`Reportable: ${d.riddorReportable || 'Under assessment'}`, BODY, { bold: true }));
  if (d.riddorRef) sec.push(h.bodyText(`RIDDOR Reference: ${d.riddorRef}`, SM));
  // Action Plan
  sec.push(h.sectionHeading('9. Formal Action Plan', LG, CHARCOAL));
  if (d.preventiveActions.length > 0) {
    const apw = [Math.round(W*0.30), Math.round(W*0.20), Math.round(W*0.16), W - Math.round(W*0.30) - Math.round(W*0.20) - Math.round(W*0.16)];
    sec.push(dataTable([{ text: 'Action', width: apw[0] }, { text: 'Owner', width: apw[1] }, { text: 'Target Date', width: apw[2] }, { text: 'Verification', width: apw[3] }], d.preventiveActions.map(p => [p.action, p.owner, p.targetDate, p.verificationMethod]), CHARCOAL) as any);
  }
  // Evidence
  sec.push(h.sectionHeading('10. Evidence Preservation', LG, CHARCOAL));
  sec.push(...h.prose(d.evidencePreservation || 'Evidence preservation measures documented separately.'));
  if (d.additionalNotes) { sec.push(h.sectionHeading('11. Additional Notes')); sec.push(...h.prose(d.additionalNotes)); }
  sec.push(h.spacer(200)); sec.push(footerLine());

  return new Document({ sections: [{ properties: { page: { margin: { top: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL } } }, headers: { default: h.ebroraHeader('Formal Investigation') }, footers: { default: h.ebroraFooter() }, children: sec }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildSafetyAlertTemplateDocument(
  content: any,
  templateSlug: SafetyAlertTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':       return buildT1(d);
    case 'red-emergency':         return buildT2(d);
    case 'lessons-learned':       return buildT3(d);
    case 'formal-investigation':  return buildT4(d);
    default:                      return buildT1(d);
  }
}
