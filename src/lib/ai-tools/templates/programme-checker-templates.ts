// =============================================================================
// Programme Checker — Multi-Template Engine (REBUILT)
// 3 rendered templates + 1 scoring fallback, matching HTML render library.
//
// T1 — RAG Report          (dark forest green #1B5745, 8-area RAG review, ~3pp)
// T2 — Email Summary       (navy #1e293b, professional letter, ~2pp)
// T3 — Comprehensive Report (charcoal #2d3748, full-depth analysis, ~4pp)
// T4 — Scoring Report      (teal #0f766e, numerical scores — falls back to RAG structure)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ProgrammeCheckerTemplateSlug } from '@/lib/programme-checker/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const EBRORA_G = '1B5745'; const EBRORA_SUB = 'a7f3d0';
const NAVY = '1e293b'; const NAVY_SUB = '94a3b8';
const CHARCOAL = '2d3748'; const CHAR_SUB = 'a0aec0';
const TEAL = '0f766e';
const RED = 'DC2626'; const RED_BG = 'FEF2F2'; const RED_D = '991B1B';
const AMBER = 'D97706'; const AMBER_BG = 'FFFBEB'; const AMBER_D = '92400E';
const GREEN = '059669'; const GREEN_BG = 'D1FAE5'; const GREEN_D = '065F46';
const BLUE = '2563EB'; const BLUE_BG = 'EFF6FF';
const GREY = '6B7280'; const GREY_BG = 'F3F4F6'; const ZEBRA = 'F9FAFB';

// ── Helpers ──────────────────────────────────────────────────────────────────
function ragColor(r: string): string {
  const u = (r || '').toUpperCase();
  if (u.includes('RED') || u.includes('CRITICAL')) return RED;
  if (u.includes('AMBER') || u.includes('SIGNIFICANT')) return AMBER;
  if (u.includes('GREEN') || u.includes('MINOR')) return GREEN;
  return GREY;
}
function ragBg(r: string): string {
  const u = (r || '').toUpperCase();
  if (u.includes('RED') || u.includes('CRITICAL')) return RED_BG;
  if (u.includes('AMBER') || u.includes('SIGNIFICANT')) return AMBER_BG;
  if (u.includes('GREEN') || u.includes('MINOR')) return GREEN_BG;
  return GREY_BG;
}
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function cols(fracs: number[]): number[] { return fracs.map(f => Math.round(W * f)); }
function dataTable(hdrs: Array<{ text: string; w: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, accent: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: hdrs.map(col => hdrCell(col.text, col.w, accent)) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => txtCell(cell.text, hdrs[ci].w, { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, bold: cell.bold, color: cell.color })),
      })),
    ],
  });
}
function prose(text: string): (Paragraph | Table)[] { return h.richBodyText(text || '', BODY); }

// RAG area block — coloured header bar with area name + score, then body
function ragAreaBlock(area: any, accent: string): (Paragraph | Table)[] {
  const ragCol = ragColor(area.ragRating);
  const scoreText = area.score ? `${area.score}/10 — ${area.ragRating}` : area.ragRating;
  const result: (Paragraph | Table)[] = [];

  // Coloured header bar
  result.push(new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.7), W - Math.round(W * 0.7)],
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: Math.round(W * 0.7), type: WidthType.DXA }, shading: { fill: ragCol, type: ShadingType.CLEAR }, borders: h.NO_BORDERS,
        margins: { top: 50, bottom: 50, left: 140, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: area.area || '', bold: true, size: BODY, font: 'Arial', color: 'FFFFFF' })] })] }),
      new TableCell({ width: { size: W - Math.round(W * 0.7), type: WidthType.DXA }, shading: { fill: ragCol, type: ShadingType.CLEAR }, borders: h.NO_BORDERS,
        margins: { top: 50, bottom: 50, left: 80, right: 140 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: scoreText, bold: true, size: BODY, font: 'Arial', color: 'FFFFFF' })] })] }),
    ] })],
  }));

  // Findings
  if (area.findings || area.extendedFindings) {
    result.push(h.spacer(40));
    result.push(...prose(area.extendedFindings || area.findings));
  }

  // Issues
  const issues: string[] = Array.isArray(area.issues) ? area.issues : [];
  if (issues.length > 0) {
    result.push(new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'Issues', bold: true, size: BODY, font: 'Arial', color: accent })] }));
    issues.forEach(iss => result.push(new Paragraph({ spacing: { after: 30 }, indent: { left: 240 },
      children: [new TextRun({ text: '\u2022  ', size: BODY, font: 'Arial', color: accent }), new TextRun({ text: iss, size: SM, font: 'Arial' })] })));
  }

  // Recommendations
  const recs: string[] = Array.isArray(area.recommendations) ? area.recommendations : [];
  if (recs.length > 0) {
    result.push(new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'Recommendations', bold: true, size: BODY, font: 'Arial', color: accent })] }));
    recs.forEach(rec => result.push(new Paragraph({ spacing: { after: 30 }, indent: { left: 240 },
      children: [new TextRun({ text: '\u2022  ', size: BODY, font: 'Arial', color: accent }), new TextRun({ text: rec, size: SM, font: 'Arial' })] })));
  }

  result.push(h.spacer(100));
  return result;
}

// ── Data extraction ──────────────────────────────────────────────────────────
function sv(c: any, k: string, fb = ''): string { return typeof c?.[k] === 'string' ? c[k] : fb; }
function nv(c: any, k: string, fb = 0): number { return typeof c?.[k] === 'number' ? c[k] : fb; }
function av(c: any, k: string): any[] { return Array.isArray(c?.[k]) ? c[k] : []; }


// ═════════════════════════════════════════════════════════════════════════════
// T1 — RAG REPORT (Dark Forest Green #1B5745)
// ═════════════════════════════════════════════════════════════════════════════
function buildRagReport(c: any): Document {
  const A = EBRORA_G;
  const hdr = h.accentHeader('Programme RAG Report', A);
  const ftr = h.accentFooter(sv(c, 'documentRef', 'PCR-001'), 'RAG Report', A);
  const pp = c.programmePeriod || {};
  const pm = c.programmeMetrics || {};

  const body: (Paragraph | Table)[] = [];

  // 01 EXECUTIVE SUMMARY
  body.push(h.fullWidthSectionBar('01', 'EXECUTIVE SUMMARY', A));
  body.push(h.spacer(80));
  body.push(...prose(sv(c, 'overallSummary')));

  // 02 PROGRAMME METRICS
  body.push(h.fullWidthSectionBar('02', 'PROGRAMME METRICS', A));
  body.push(h.spacer(80));
  body.push(h.kpiDashboard([
    { value: sv(pm, 'totalActivities', '—'), label: 'Total Activities' },
    { value: sv(pm, 'milestones', '—'), label: 'Milestones' },
    { value: sv(pm, 'criticalActivities', '—'), label: 'Critical Activities' },
    { value: sv(pm, 'openEnds', '—'), label: 'Open Ends' },
  ], A, W));
  body.push(h.spacer(80));
  body.push(h.coverInfoTable([
    { label: 'Average Float', value: sv(pm, 'averageFloat') },
    { label: 'Critical Path Length', value: sv(pm, 'criticalPathLength', sv(pp, 'totalDuration')) },
    { label: 'Near-Critical (<5d float)', value: sv(pm, 'nearCriticalActivities', '') },
  ], A, W));

  // 03 RAG-RATED REVIEW AREAS
  body.push(h.fullWidthSectionBar('03', 'RAG-RATED REVIEW AREAS', A));
  body.push(h.spacer(80));
  const areas = av(c, 'reviewAreas');
  areas.forEach((area: any, i: number) => {
    body.push(...ragAreaBlock({ ...area, area: `${i + 1}. ${area.area || ''}` }, A));
  });

  // 04 CRITICAL ISSUES
  const issues = av(c, 'criticalIssues');
  if (issues.length > 0) {
    body.push(h.fullWidthSectionBar('04', 'CRITICAL ISSUES', A));
    body.push(h.spacer(80));
    const ic = cols([0.05, 0.25, 0.25, 0.30, 0.15]);
    ic[4] = W - ic[0] - ic[1] - ic[2] - ic[3];
    body.push(dataTable(
      [{ text: '#', w: ic[0] }, { text: 'Issue', w: ic[1] }, { text: 'Impact', w: ic[2] }, { text: 'Recommendation', w: ic[3] }, { text: 'RAG', w: ic[4] }],
      issues.map((iss: any, i: number) => [
        { text: `${i + 1}` }, { text: iss.issue || '', bold: true },
        { text: iss.impact || '' }, { text: iss.recommendation || '' },
        { text: iss.ragRating || '', bold: true, color: ragColor(iss.ragRating) },
      ]), A));
  }

  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['PROGRAMME', 'RAG REPORT'], 'Construction Programme Review — Red / Amber / Green Assessment', A, EBRORA_SUB),
          h.spacer(100),
          h.projectNameBar(sv(c, 'programmeTitle', 'Programme Review'), A),
          h.spacer(100),
          h.coverInfoTable([
            { label: 'Document Reference', value: sv(c, 'documentRef') },
            { label: 'Review Date', value: sv(c, 'reviewDate') },
            { label: 'Reviewed By', value: sv(c, 'reviewedBy', 'Ebrora AI Programme Checker') },
            { label: 'Programme Title', value: sv(c, 'programmeTitle') },
            { label: 'Programme Type', value: sv(c, 'programmeType') },
            { label: 'Programme Period', value: `${sv(pp, 'startDate')} – ${sv(pp, 'completionDate')} (${sv(pp, 'totalDuration')})` },
            { label: 'Overall RAG Rating', value: sv(c, 'overallRagRating', 'AMBER') },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr }, children: body },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — EMAIL SUMMARY (Navy #1e293b)
// ═════════════════════════════════════════════════════════════════════════════
function buildEmailSummary(c: any): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Programme Review — Email Summary', A);
  const ftr = h.accentFooter(sv(c, 'documentRef', 'PCE-001'), 'Email Summary', A);
  const pp = c.programmePeriod || {};
  const ps = c.programmeStatistics || c.programmeMetrics || {};

  const body: (Paragraph | Table)[] = [];

  // Email header block
  const emailBorder = { style: BorderStyle.SINGLE, size: 4, color: A };
  const emailFields = [
    { label: 'To:', value: sv(c, 'addressedTo', 'Project Manager') },
    { label: 'From:', value: sv(c, 'from', 'Programme Review Team') },
    { label: 'Date:', value: sv(c, 'reviewDate') },
    { label: 'Ref:', value: sv(c, 'documentRef') },
  ];
  emailFields.forEach(f => {
    body.push(new Paragraph({ spacing: { after: 20 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
      children: [
        new TextRun({ text: f.label + ' ', bold: true, size: SM, font: 'Arial', color: A }),
        new TextRun({ text: f.value, size: SM, font: 'Arial' }),
      ] }));
  });
  // Subject line
  body.push(new Paragraph({ spacing: { before: 40, after: 120 }, border: { bottom: emailBorder },
    children: [new TextRun({ text: sv(c, 'subject', `Programme Review Summary — ${sv(c, 'programmeTitle')}`), bold: true, size: LG, font: 'Arial', color: A })] }));

  // Opening
  body.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Dear ${sv(c, 'addressedTo', 'Project Manager').split(' — ')[0]},`, size: BODY, font: 'Arial' })] }));
  body.push(...prose(sv(c, 'openingParagraph')));

  // KEY FINDINGS
  const findings = av(c, 'keyFindings');
  if (findings.length > 0) {
    body.push(h.fullWidthSectionBar('', 'KEY FINDINGS', A));
    body.push(h.spacer(80));
    const fc = cols([0.75, 0.25]);
    body.push(dataTable(
      [{ text: 'Finding', w: fc[0] }, { text: 'Severity', w: fc[1] }],
      findings.map((f: any) => [
        { text: f.finding || '', bold: true },
        { text: f.severity || '', bold: true, color: ragColor(f.severity) },
      ]), A));
  }

  // KPI boxes (3)
  body.push(h.spacer(80));
  body.push(h.kpiDashboard([
    { value: sv(ps, 'totalActivities', '—'), label: 'Activities' },
    { value: sv(ps, 'overallAssessment', sv(c, 'overallRagRating', 'AMBER')), label: 'Overall Assessment' },
    { value: sv(ps, 'nearCriticalPct', sv(ps, 'openEnds', '—')), label: '<5d Float / Open Ends' },
  ], A, W));

  // CRITICAL ISSUES REQUIRING ACTION
  const crit = av(c, 'criticalIssues');
  if (crit.length > 0) {
    body.push(h.fullWidthSectionBar('', 'CRITICAL ISSUES REQUIRING ACTION', A));
    body.push(h.spacer(80));
    crit.forEach((iss: any, i: number) => {
      const col = ragColor(iss.ragRating || (i < 2 ? 'RED' : 'AMBER'));
      const bg = ragBg(iss.ragRating || (i < 2 ? 'RED' : 'AMBER'));
      const tc = col === RED ? RED_D : AMBER_D;
      body.push(h.calloutBox(
        `${iss.requiredAction || iss.recommendation || iss.impact || ''}`,
        col, bg, tc, W,
        { boldPrefix: `${i + 1}. ${iss.issue || ''}:` }
      ));
      body.push(h.spacer(40));
    });
  }

  // RECOMMENDED NEXT STEPS
  const steps = av(c, 'recommendedNextSteps');
  if (steps.length > 0) {
    body.push(h.fullWidthSectionBar('', 'RECOMMENDED NEXT STEPS', A));
    body.push(h.spacer(80));
    steps.forEach((step: string, i: number) => {
      body.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 240 },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: BODY, font: 'Arial', color: A }),
          new TextRun({ text: step, size: BODY, font: 'Arial' }),
        ] }));
    });
  }

  // Closing
  body.push(h.spacer(80));
  body.push(...prose(sv(c, 'closingParagraph', 'We would welcome the opportunity to discuss these findings at your earliest convenience.')));
  body.push(h.spacer(40));
  body.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Kind regards,', size: BODY, font: 'Arial' })] }));
  body.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: sv(c, 'signOffName', 'Programme Review Team'), bold: true, size: BODY, font: 'Arial' })] }));
  body.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: sv(c, 'signOffTitle', 'Ebrora AI Programme Checker'), size: SM, font: 'Arial', color: GREY, italics: true })] }));

  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['PROGRAMME REVIEW', 'EMAIL SUMMARY'], 'Professional Correspondence Format — Key Findings & Recommendations', A, NAVY_SUB),
          h.spacer(100),
          h.projectNameBar(sv(c, 'programmeTitle', 'Programme Review'), A),
          h.spacer(100),
          h.coverInfoTable([
            { label: 'Document Reference', value: sv(c, 'documentRef') },
            { label: 'Review Date', value: sv(c, 'reviewDate') },
            { label: 'Reviewed By', value: sv(c, 'reviewedBy', 'Ebrora AI Programme Checker') },
            { label: 'Programme Title', value: sv(c, 'programmeTitle') },
            { label: 'Addressed To', value: sv(c, 'addressedTo', 'Project Manager') },
            { label: 'From', value: sv(c, 'from', 'Programme Review Team') },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr }, children: body },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — COMPREHENSIVE REPORT (Charcoal #2d3748)
// ═════════════════════════════════════════════════════════════════════════════
function buildComprehensive(c: any): Document {
  const A = CHARCOAL;
  const hdr = h.accentHeader('Comprehensive Programme Analysis', A);
  const ftr = h.accentFooter(sv(c, 'documentRef', 'PCC-001'), 'Comprehensive Report', A);
  const pp = c.programmePeriod || {};
  const pm = c.programmeMetrics || {};
  const cc = c.contractualCompliance || {};
  const fd = c.floatDistribution || {};

  const body: (Paragraph | Table)[] = [];

  // 01 EXECUTIVE SUMMARY
  body.push(h.fullWidthSectionBar('01', 'EXECUTIVE SUMMARY', A));
  body.push(h.spacer(80));
  body.push(...prose(sv(c, 'executiveSummary', sv(c, 'overallSummary'))));

  // 02 PROGRAMME METRICS DASHBOARD
  body.push(h.fullWidthSectionBar('02', 'PROGRAMME METRICS DASHBOARD', A));
  body.push(h.spacer(80));
  body.push(h.kpiDashboard([
    { value: sv(pm, 'totalActivities', '—'), label: 'Total Activities' },
    { value: sv(pm, 'milestones', '—'), label: 'Milestones' },
    { value: sv(pm, 'criticalActivities', '—'), label: 'Critical Activities' },
    { value: sv(pm, 'openEnds', '—'), label: 'Open Ends' },
  ], A, W));
  body.push(h.spacer(80));
  body.push(h.coverInfoTable([
    { label: 'Average Float', value: sv(pm, 'averageFloat') },
    { label: 'Logic Density', value: sv(pm, 'logicDensity', '') },
    { label: 'Critical Path Length', value: sv(pm, 'criticalPathLength', '') },
    { label: 'Near-Critical (<5d)', value: sv(pm, 'nearCriticalActivities', '') },
    { label: 'CP %', value: sv(pm, 'cpPercentage', '') },
  ], A, W));

  // 03 WEIGHTED SCORING SUMMARY
  const areas = av(c, 'reviewAreas');
  if (areas.length > 0) {
    body.push(h.fullWidthSectionBar('03', 'WEIGHTED SCORING SUMMARY', A));
    body.push(h.spacer(80));
    const sc = cols([0.24, 0.08, 0.08, 0.10, 0.08, 0.42]);
    sc[5] = W - sc[0] - sc[1] - sc[2] - sc[3] - sc[4];
    body.push(dataTable(
      [{ text: 'Review Area', w: sc[0] }, { text: 'Weight', w: sc[1] }, { text: 'Score', w: sc[2] }, { text: 'Weighted', w: sc[3] }, { text: 'RAG', w: sc[4] }, { text: 'Best Practice', w: sc[5] }],
      areas.map((a: any) => [
        { text: a.area || '', bold: true },
        { text: `${a.weight || ''}%` },
        { text: `${a.score || ''}/10` },
        { text: `${((a.score || 0) * (a.weight || 0) / 10).toFixed(1)}` },
        { text: a.ragRating || '', bold: true, color: ragColor(a.ragRating) },
        { text: a.bestPracticeComparison || '' },
      ]), A));

    // Overall row as separate callout
    const ws = nv(c, 'overallWeightedScore');
    if (ws > 0) {
      body.push(h.spacer(40));
      body.push(h.calloutBox(
        `Overall Weighted Score: ${ws}% — Grade ${sv(c, 'overallGrade', 'D')} — ${sv(c, 'overallRagRating', 'AMBER')}`,
        A, 'F7FAFC', A, W
      ));
    }
  }

  // 04 RISK MATRIX
  const risks = av(c, 'riskMatrix');
  if (risks.length > 0) {
    body.push(h.fullWidthSectionBar('04', 'RISK MATRIX', A));
    body.push(h.spacer(80));
    const rc = cols([0.28, 0.06, 0.06, 0.08, 0.30, 0.22]);
    rc[5] = W - rc[0] - rc[1] - rc[2] - rc[3] - rc[4];
    body.push(dataTable(
      [{ text: 'Risk', w: rc[0] }, { text: 'L', w: rc[1] }, { text: 'I', w: rc[2] }, { text: 'Score', w: rc[3] }, { text: 'Mitigation', w: rc[4] }, { text: 'Owner', w: rc[5] }],
      risks.map((r: any) => {
        const score = (r.likelihood || 0) * (r.impact || 0);
        return [
          { text: r.risk || '', bold: true }, { text: `${r.likelihood || ''}` },
          { text: `${r.impact || ''}` }, { text: `${score || r.riskScore || ''}`, bold: true, color: score >= 15 ? RED : score >= 8 ? AMBER : GREEN },
          { text: r.mitigation || '' }, { text: r.owner || '' },
        ];
      }), A));
  }

  // 05 FLOAT DISTRIBUTION ANALYSIS
  if (fd.analysis || fd.zero) {
    body.push(h.fullWidthSectionBar('05', 'FLOAT DISTRIBUTION ANALYSIS', A));
    body.push(h.spacer(80));
    const fc = cols([0.30, 0.15, 0.15, 0.40]);
    body.push(dataTable(
      [{ text: 'Float Range', w: fc[0] }, { text: 'Count', w: fc[1] }, { text: 'Percentage', w: fc[2] }, { text: 'Assessment', w: fc[3] }],
      [
        [{ text: 'Negative float', bold: true }, { text: sv(fd, 'negative', '0') }, { text: '' }, { text: '' }],
        [{ text: 'Zero (critical)', bold: true }, { text: sv(fd, 'zero', '') }, { text: '' }, { text: '', color: RED }],
        [{ text: '<5 days (near-critical)', bold: true }, { text: sv(fd, 'lessThan5', '') }, { text: '' }, { text: '', color: AMBER }],
        [{ text: '5–20 days', bold: true }, { text: sv(fd, 'fiveTo20', '') }, { text: '' }, { text: '', color: GREEN }],
        [{ text: '>20 days', bold: true }, { text: sv(fd, 'moreThan20', '') }, { text: '' }, { text: '', color: BLUE }],
      ], A));
    if (fd.analysis) {
      body.push(h.spacer(40));
      body.push(h.calloutBox(fd.analysis, RED, RED_BG, RED_D, W, { boldPrefix: 'Critical Finding:' }));
    }
  }

  // 06 CRITICAL PATH NARRATIVE
  if (sv(c, 'criticalPathNarrative')) {
    body.push(h.fullWidthSectionBar('06', 'CRITICAL PATH NARRATIVE', A));
    body.push(h.spacer(80));
    body.push(...prose(sv(c, 'criticalPathNarrative')));
  }

  // 07 RESOURCE LOADING ASSESSMENT
  if (sv(c, 'resourceLoadingAssessment')) {
    body.push(h.fullWidthSectionBar('07', 'RESOURCE LOADING ASSESSMENT', A));
    body.push(h.spacer(80));
    body.push(...prose(sv(c, 'resourceLoadingAssessment')));
  }

  // 08 CONTRACTUAL MILESTONE COMPLIANCE
  const kds = av(cc, 'keyDatesAssessed');
  if (kds.length > 0 || sv(cc, 'contractType')) {
    body.push(h.fullWidthSectionBar('08', 'CONTRACTUAL MILESTONE COMPLIANCE', A));
    body.push(h.spacer(80));
    if (sv(cc, 'contractType')) {
      body.push(h.coverInfoTable([
        { label: 'Contract Type', value: sv(cc, 'contractType') },
        { label: 'Completion Date', value: sv(cc, 'completionDateAssessment', '') },
        { label: 'Float Ownership', value: sv(cc, 'floatOwnership', '') },
      ], A, W));
      body.push(h.spacer(80));
    }
    if (kds.length > 0) {
      const kc = cols([0.35, 0.18, 0.18, 0.14, 0.15]);
      kc[4] = W - kc[0] - kc[1] - kc[2] - kc[3];
      body.push(dataTable(
        [{ text: 'Key Date', w: kc[0] }, { text: 'Contractual', w: kc[1] }, { text: 'Forecast', w: kc[2] }, { text: 'Status', w: kc[3] }, { text: 'Notes', w: kc[4] }],
        kds.map((kd: any) => [
          { text: kd.keyDate || '', bold: true }, { text: kd.contractualDate || '' },
          { text: kd.forecastDate || '' },
          { text: kd.status || '', bold: true, color: ragColor(kd.status?.includes('Risk') ? 'AMBER' : kd.status?.includes('Breach') ? 'RED' : 'GREEN') },
          { text: kd.notes || '' },
        ]), A));
    }
  }

  // 09 CRITICAL ISSUES & ACTIONS
  const issues = av(c, 'criticalIssues');
  if (issues.length > 0) {
    body.push(h.fullWidthSectionBar('09', 'CRITICAL ISSUES & ACTIONS', A));
    body.push(h.spacer(80));
    const ic = cols([0.04, 0.18, 0.16, 0.22, 0.10, 0.12, 0.06]);
    ic[6] = W - ic[0] - ic[1] - ic[2] - ic[3] - ic[4] - ic[5];
    body.push(dataTable(
      [{ text: '#', w: ic[0] }, { text: 'Issue', w: ic[1] }, { text: 'Impact', w: ic[2] }, { text: 'Action', w: ic[3] }, { text: 'Owner', w: ic[4] }, { text: 'Target', w: ic[5] }, { text: 'RAG', w: ic[6] }],
      issues.map((iss: any, i: number) => [
        { text: `${iss.priority || i + 1}` }, { text: iss.issue || '' },
        { text: iss.impact || '' }, { text: iss.recommendation || '' },
        { text: iss.owner || '' }, { text: iss.targetDate || '' },
        { text: iss.ragRating || '', bold: true, color: ragColor(iss.ragRating) },
      ]), A));
  }

  // 10 STRUCTURED IMPROVEMENT PLAN
  const plan = av(c, 'improvementPlan');
  if (plan.length > 0) {
    body.push(h.fullWidthSectionBar('10', 'STRUCTURED IMPROVEMENT PLAN', A));
    body.push(h.spacer(80));
    const pc2 = cols([0.28, 0.12, 0.12, 0.12, 0.36]);
    pc2[4] = W - pc2[0] - pc2[1] - pc2[2] - pc2[3];
    body.push(dataTable(
      [{ text: 'Action', w: pc2[0] }, { text: 'Priority', w: pc2[1] }, { text: 'Owner', w: pc2[2] }, { text: 'Target', w: pc2[3] }, { text: 'Expected Benefit', w: pc2[4] }],
      plan.map((p2: any) => [
        { text: p2.action || '' }, { text: p2.priority || '' },
        { text: p2.responsible || '' }, { text: p2.targetDate || '' },
        { text: p2.expectedBenefit || '' },
      ]), A));
  }

  // 11 METHODOLOGY & DEFINITIONS
  if (sv(c, 'methodology')) {
    body.push(h.fullWidthSectionBar('11', 'METHODOLOGY & DEFINITIONS', A));
    body.push(h.spacer(80));
    body.push(...prose(sv(c, 'methodology')));
  }

  // 12 SIGN-OFF
  body.push(h.fullWidthSectionBar('12', 'SIGN-OFF', A));
  body.push(h.spacer(80));
  body.push(h.signatureGrid(['Reviewed By', 'Project Manager', 'Planning Manager', 'Client Representative'], A, W));

  // Document retention callout
  body.push(h.spacer(80));
  body.push(h.calloutBox(
    'This programme review should be retained alongside the programme submission for audit and contractual purposes. Review findings should be tracked through the project risk register and discussed at monthly progress meetings.',
    BLUE, BLUE_BG, '1E40AF', W,
    { boldPrefix: 'Document Retention:' }
  ));

  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['COMPREHENSIVE', 'PROGRAMME ANALYSIS'], 'Full-Depth Review \u00B7 Risk Matrix \u00B7 Float Distribution \u00B7 Critical Path Narrative', A, CHAR_SUB),
          h.spacer(100),
          h.projectNameBar(sv(c, 'programmeTitle', 'Programme Review'), A),
          h.spacer(100),
          h.coverInfoTable([
            { label: 'Document Reference', value: sv(c, 'documentRef') },
            { label: 'Review Date', value: sv(c, 'reviewDate') },
            { label: 'Reviewed By', value: sv(c, 'reviewedBy', 'Ebrora AI Programme Checker') },
            { label: 'Programme Title', value: sv(c, 'programmeTitle') },
            { label: 'Programme Type', value: sv(c, 'programmeType') },
            { label: 'Programme Period', value: `${sv(pp, 'startDate')} – ${sv(pp, 'completionDate')} (${sv(pp, 'totalDuration')})` },
            { label: 'Contractor', value: sv(c, 'contractor', '') },
            { label: 'Client', value: sv(c, 'client', '') },
            { label: 'Overall Assessment', value: `${sv(c, 'overallRagRating', 'AMBER')} — Weighted Score: ${nv(c, 'overallWeightedScore')}%` },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr }, children: body },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildProgrammeCheckerTemplateDocument(
  content: any,
  templateSlug: ProgrammeCheckerTemplateSlug
): Promise<Document> {
  switch (templateSlug) {
    case 'rag-report':      return buildRagReport(content);
    case 'email-summary':   return buildEmailSummary(content);
    case 'comprehensive':   return buildComprehensive(content);
    case 'scoring':         return buildRagReport(content); // Scoring falls back to RAG report structure
    default:                return buildRagReport(content);
  }
}
