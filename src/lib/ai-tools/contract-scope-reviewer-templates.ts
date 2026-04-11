// =============================================================================
// Contract Scope Risk Reviewer — DOCX Template Engine
// T1 — Quick Risk Summary        (purple #7C3AED, 1-2pp)
// T2 — Detailed Risk Review      (indigo #4338CA, ~6pp)
// T3 — Comprehensive Risk & Action Report (slate #1E293B, ~10pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ContractScopeTemplateSlug } from '@/lib/contract-scope-reviewer/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22; const XL = 28;

// Accent palettes per template
const PURPLE = '7C3AED'; const PURPLE_LIGHT = 'F5F3FF'; const PURPLE_MID = 'DDD6FE';
const INDIGO = '4338CA'; const INDIGO_LIGHT = 'EEF2FF'; const INDIGO_MID = 'C7D2FE';
const SLATE = '1E293B'; const SLATE_LIGHT = 'F1F5F9'; const SLATE_MID = 'CBD5E1';

// Severity colours
const HIGH_C = 'DC2626'; const HIGH_BG = 'FEF2F2';
const MED_C = 'D97706'; const MED_BG = 'FFFBEB';
const LOW_C = '059669'; const LOW_BG = 'ECFDF5';
const GREY = '6B7280'; const GREY_BG = 'F3F4F6'; const ZEBRA = 'F9FAFB';

function sevColor(s: string): string {
  const u = (s || '').toUpperCase();
  if (u.includes('HIGH') || u.includes('CRITICAL')) return HIGH_C;
  if (u.includes('MED')) return MED_C;
  if (u.includes('LOW')) return LOW_C;
  return GREY;
}
function sevBg(s: string): string {
  const u = (s || '').toUpperCase();
  if (u.includes('HIGH')) return HIGH_BG;
  if (u.includes('MED')) return MED_BG;
  if (u.includes('LOW')) return LOW_BG;
  return GREY_BG;
}

function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function cols(fracs: number[]): number[] { return fracs.map(f => Math.round(W * f)); }

function prose(text: string): (Paragraph | Table)[] { return h.richBodyText(text || '', BODY); }

function accentBar(text: string, accent: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { fill: accent, type: ShadingType.CLEAR },
        borders: h.NO_BORDERS,
        margins: { top: 60, bottom: 60, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: LG, font: 'Arial', color: 'FFFFFF' })] })],
      }),
    ] })],
  });
}

function severityBadge(sev: string): TextRun {
  return new TextRun({ text: ` [${(sev || 'N/A').toUpperCase()}] `, bold: true, size: SM, font: 'Arial', color: sevColor(sev) });
}

// ── Meta info table (shared across all templates) ─────────────────────────────
function metaTable(d: any, accent: string): Table {
  const c = cols([0.3, 0.7]);
  const rows: Array<[string, string]> = [
    ['Document Ref', d.documentRef || ''],
    ['Review Date', d.reviewDate || ''],
    ['Reviewed By', d.reviewedBy || ''],
    ['Document Title', d.documentTitle || ''],
    ['Contract Type', d.contractType || ''],
    ['Review Context', d.reviewContext || ''],
    ['User Role', d.userRole || ''],
    ['Sector', d.sector || ''],
  ];
  if (d.estimatedValue) rows.push(['Estimated Value', d.estimatedValue]);
  if (d.programmeDuration) rows.push(['Programme Duration', d.programmeDuration]);

  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: c,
    rows: rows.map((r, i) => new TableRow({ children: [
      txtCell(r[0], c[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
      txtCell(r[1], c[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
    ] })),
  });
}

// ── Overall Risk Rating Banner ────────────────────────────────────────────────
function ratingBanner(rating: string): Table {
  const col = sevColor(rating);
  const bg = sevBg(rating);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        borders: h.NO_BORDERS,
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'OVERALL RISK RATING: ', bold: true, size: XL, font: 'Arial', color: GREY }),
            new TextRun({ text: (rating || 'N/A').toUpperCase(), bold: true, size: XL, font: 'Arial', color: col }),
          ],
        })],
      }),
    ] })],
  });
}

// ── Cover Page ────────────────────────────────────────────────────────────────
function coverPage(d: any, templateTitle: string, accent: string): (Paragraph | Table)[] {
  return [
    h.spacer(600),
    accentBar('CONTRACT SCOPE RISK REVIEWER', accent),
    h.spacer(200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: templateTitle, bold: true, size: 36, font: 'Arial', color: accent })],
    }),
    h.spacer(100),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: d.documentTitle || 'Scope of Works', size: LG, font: 'Arial', color: GREY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: `${d.contractType || ''} — ${d.reviewContext || ''}`, size: BODY, font: 'Arial', color: GREY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: d.reviewDate || '', size: SM, font: 'Arial', color: GREY })],
    }),
    ratingBanner(d.overallRiskRating),
    h.spacer(300),
    metaTable(d, accent),
    h.spacer(200),
    new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }),
  ];
}

// =============================================================================
// T1 — Quick Risk Summary
// =============================================================================
function buildQuickRiskSummary(d: any): (Paragraph | Table)[] {
  const A = PURPLE;
  const children: (Paragraph | Table)[] = [];

  children.push(...coverPage(d, 'Quick Risk Summary', A));

  // Executive Summary
  children.push(accentBar('Executive Risk Summary', A));
  children.push(h.spacer(60));
  children.push(...prose(d.executiveSummary));
  children.push(h.spacer(120));

  // Top Risks
  children.push(accentBar('Top Risks', A));
  children.push(h.spacer(60));
  const riskCols = cols([0.05, 0.25, 0.1, 0.15, 0.45]);
  const topRisks: any[] = Array.isArray(d.topRisks) ? d.topRisks : [];
  children.push(new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: riskCols,
    rows: [
      new TableRow({ children: [
        hdrCell('#', riskCols[0], A), hdrCell('Risk', riskCols[1], A),
        hdrCell('Severity', riskCols[2], A), hdrCell('Clause', riskCols[3], A),
        hdrCell('Description', riskCols[4], A),
      ] }),
      ...topRisks.map((r: any, i: number) => new TableRow({ children: [
        txtCell(String(r.rank || i + 1), riskCols[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell(r.title || '', riskCols[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
        txtCell((r.severity || '').toUpperCase(), riskCols[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(r.severity), bold: true }),
        txtCell(r.clauseRef || '', riskCols[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell(r.description || '', riskCols[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
      ] })),
    ],
  }));
  children.push(h.spacer(120));

  // Missing Items
  children.push(accentBar('Missing Scope Items', A));
  children.push(h.spacer(60));
  const miCols = cols([0.35, 0.45, 0.2]);
  const missing: any[] = Array.isArray(d.missingItems) ? d.missingItems : [];
  children.push(new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: miCols,
    rows: [
      new TableRow({ children: [
        hdrCell('Missing Item', miCols[0], A), hdrCell('Impact', miCols[1], A), hdrCell('Severity', miCols[2], A),
      ] }),
      ...missing.map((m: any, i: number) => new TableRow({ children: [
        txtCell(m.item || '', miCols[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
        txtCell(m.impact || '', miCols[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell((m.severity || '').toUpperCase(), miCols[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(m.severity), bold: true }),
      ] })),
    ],
  }));
  children.push(h.spacer(120));

  // Commercial Flags
  children.push(accentBar('Commercial Flags', A));
  children.push(h.spacer(60));
  const cfCols = cols([0.25, 0.55, 0.2]);
  const cFlags: any[] = Array.isArray(d.commercialFlags) ? d.commercialFlags : [];
  children.push(new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: cfCols,
    rows: [
      new TableRow({ children: [
        hdrCell('Flag', cfCols[0], A), hdrCell('Detail', cfCols[1], A), hdrCell('Severity', cfCols[2], A),
      ] }),
      ...cFlags.map((f: any, i: number) => new TableRow({ children: [
        txtCell(f.flag || '', cfCols[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
        txtCell(f.detail || '', cfCols[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        txtCell((f.severity || '').toUpperCase(), cfCols[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(f.severity), bold: true }),
      ] })),
    ],
  }));
  children.push(h.spacer(120));

  // Immediate Actions
  children.push(accentBar('Recommended Immediate Actions', A));
  children.push(h.spacer(60));
  const actions: string[] = Array.isArray(d.immediateActions) ? d.immediateActions : [];
  actions.forEach((a, i) => {
    children.push(new Paragraph({
      spacing: { after: 40 }, indent: { left: 240 },
      children: [
        new TextRun({ text: `${i + 1}. `, bold: true, size: BODY, font: 'Arial', color: A }),
        new TextRun({ text: a, size: BODY, font: 'Arial' }),
      ],
    }));
  });

  return children;
}

// =============================================================================
// T2 — Detailed Risk Review
// =============================================================================
function buildDetailedRiskReview(d: any): (Paragraph | Table)[] {
  const A = INDIGO;
  const children: (Paragraph | Table)[] = [];

  children.push(...coverPage(d, 'Detailed Risk Review', A));

  // Executive Summary
  children.push(accentBar('Executive Summary', A));
  children.push(h.spacer(60));
  children.push(...prose(d.executiveSummary));
  children.push(h.spacer(120));

  // Scope Coverage
  if (d.scopeCoverage) {
    children.push(accentBar('Scope Coverage Assessment', A));
    children.push(h.spacer(60));
    children.push(...prose(d.scopeCoverage.summary));

    const covered: string[] = Array.isArray(d.scopeCoverage.coveredAreas) ? d.scopeCoverage.coveredAreas : [];
    if (covered.length > 0) {
      children.push(h.subHeading('Areas Adequately Covered', 20, A));
      covered.forEach(c => children.push(new Paragraph({
        spacing: { after: 20 }, indent: { left: 240 },
        children: [new TextRun({ text: '✓  ', size: BODY, font: 'Arial', color: LOW_C }), new TextRun({ text: c, size: SM, font: 'Arial' })],
      })));
    }
    const gaps: string[] = Array.isArray(d.scopeCoverage.gapAreas) ? d.scopeCoverage.gapAreas : [];
    if (gaps.length > 0) {
      children.push(h.subHeading('Gap Areas', 20, HIGH_C));
      gaps.forEach(g => children.push(new Paragraph({
        spacing: { after: 20 }, indent: { left: 240 },
        children: [new TextRun({ text: '✗  ', size: BODY, font: 'Arial', color: HIGH_C }), new TextRun({ text: g, size: SM, font: 'Arial' })],
      })));
    }
    children.push(h.spacer(120));
  }

  // Clause Risk Flags
  const flags: any[] = Array.isArray(d.clauseRiskFlags) ? d.clauseRiskFlags : [];
  if (flags.length > 0) {
    children.push(accentBar('Clause-by-Clause Risk Flags', A));
    children.push(h.spacer(60));
    flags.forEach((f: any) => {
      const sc = sevColor(f.severity);
      // Header bar for each flag
      children.push(new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.65), Math.round(W * 0.15), Math.round(W * 0.2)],
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: Math.round(W * 0.65), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS,
            margins: { top: 40, bottom: 40, left: 120, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: `${f.id || ''} — ${f.riskTitle || ''}`, bold: true, size: BODY, font: 'Arial', color: 'FFFFFF' })] })],
          }),
          new TableCell({ width: { size: Math.round(W * 0.15), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (f.severity || '').toUpperCase(), bold: true, size: SM, font: 'Arial', color: 'FFFFFF' })] })],
          }),
          new TableCell({ width: { size: Math.round(W * 0.2), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS,
            margins: { top: 40, bottom: 40, left: 80, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: f.clauseRef || '', bold: true, size: SM, font: 'Arial', color: 'FFFFFF' })] })],
          }),
        ] })],
      }));
      if (f.category) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [
          new TextRun({ text: 'Category: ', bold: true, size: SM, font: 'Arial', color: GREY }),
          new TextRun({ text: f.category, size: SM, font: 'Arial', color: GREY }),
          ...(f.pageRef ? [new TextRun({ text: `  |  Page: ${f.pageRef}`, size: SM, font: 'Arial', color: GREY })] : []),
        ] }));
      }
      children.push(...prose(f.finding));
      if (f.recommendation) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [new TextRun({ text: 'Recommendation: ', bold: true, size: SM, font: 'Arial', color: A })] }));
        children.push(...prose(f.recommendation));
      }
      children.push(h.spacer(80));
    });
    children.push(h.spacer(80));
  }

  // Risk Register Summary
  const rr: any[] = Array.isArray(d.riskRegister) ? d.riskRegister : [];
  if (rr.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }));
    children.push(accentBar('Risk Register Summary', A));
    children.push(h.spacer(60));
    const rrCols = cols([0.08, 0.22, 0.15, 0.12, 0.12, 0.31]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: rrCols,
      rows: [
        new TableRow({ children: [
          hdrCell('ID', rrCols[0], A), hdrCell('Risk', rrCols[1], A),
          hdrCell('Category', rrCols[2], A), hdrCell('Severity', rrCols[3], A),
          hdrCell('Clause', rrCols[4], A), hdrCell('Mitigation', rrCols[5], A),
        ] }),
        ...rr.map((r: any, i: number) => new TableRow({ children: [
          txtCell(r.id || '', rrCols[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.risk || '', rrCols[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.category || '', rrCols[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((r.severity || '').toUpperCase(), rrCols[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(r.severity), bold: true }),
          txtCell(r.clauseRef || '', rrCols[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.mitigation || '', rrCols[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Missing Items
  const mi: any[] = Array.isArray(d.missingItems) ? d.missingItems : [];
  if (mi.length > 0) {
    children.push(accentBar('Missing Items Checklist', A));
    children.push(h.spacer(60));
    const miC = cols([0.25, 0.3, 0.15, 0.3]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: miC,
      rows: [
        new TableRow({ children: [hdrCell('Item', miC[0], A), hdrCell('Impact', miC[1], A), hdrCell('Severity', miC[2], A), hdrCell('Recommendation', miC[3], A)] }),
        ...mi.map((m: any, i: number) => new TableRow({ children: [
          txtCell(m.item || '', miC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
          txtCell(m.impact || '', miC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((m.severity || '').toUpperCase(), miC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(m.severity), bold: true }),
          txtCell(m.recommendation || '', miC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Ambiguities
  const amb: any[] = Array.isArray(d.ambiguities) ? d.ambiguities : [];
  if (amb.length > 0) {
    children.push(accentBar('Ambiguity & Contradiction Log', A));
    children.push(h.spacer(60));
    const aC = cols([0.15, 0.3, 0.25, 0.3]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: aC,
      rows: [
        new TableRow({ children: [hdrCell('Clause', aC[0], A), hdrCell('Issue', aC[1], A), hdrCell('Risk if Unresolved', aC[2], A), hdrCell('Clarification', aC[3], A)] }),
        ...amb.map((a: any, i: number) => new TableRow({ children: [
          txtCell(a.clauseRef || '', aC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
          txtCell(a.issue || '', aC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(a.riskIfUnresolved || '', aC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(a.suggestedClarification || '', aC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Commercial Observations
  const co: any[] = Array.isArray(d.commercialObservations) ? d.commercialObservations : [];
  if (co.length > 0) {
    children.push(accentBar('Commercial Risk Observations', A));
    children.push(h.spacer(60));
    co.forEach((o: any) => {
      children.push(new Paragraph({ spacing: { after: 20 }, children: [
        new TextRun({ text: o.topic || '', bold: true, size: BODY, font: 'Arial', color: A }),
        severityBadge(o.severity),
      ] }));
      children.push(...prose(o.observation));
      if (o.recommendation) {
        children.push(new Paragraph({ spacing: { before: 20, after: 40 }, indent: { left: 240 }, children: [
          new TextRun({ text: '→ ', size: SM, font: 'Arial', color: A }),
          new TextRun({ text: o.recommendation, size: SM, font: 'Arial', italics: true }),
        ] }));
      }
      children.push(h.spacer(40));
    });
    children.push(h.spacer(80));
  }

  // Suggested RFIs
  const rfis: any[] = Array.isArray(d.suggestedRFIs) ? d.suggestedRFIs : [];
  if (rfis.length > 0) {
    children.push(accentBar('Suggested Clarification RFIs', A));
    children.push(h.spacer(60));
    const rfiC = cols([0.1, 0.2, 0.35, 0.2, 0.15]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: rfiC,
      rows: [
        new TableRow({ children: [hdrCell('RFI #', rfiC[0], A), hdrCell('Subject', rfiC[1], A), hdrCell('Question', rfiC[2], A), hdrCell('Reason', rfiC[3], A), hdrCell('Priority', rfiC[4], A)] }),
        ...rfis.map((r: any, i: number) => new TableRow({ children: [
          txtCell(r.rfiNumber || '', rfiC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
          txtCell(r.subject || '', rfiC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.question || '', rfiC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.reason || '', rfiC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((r.priority || '').toUpperCase(), rfiC[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(r.priority), bold: true }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Overall Assessment
  if (d.overallAssessment) {
    children.push(accentBar('Overall Assessment & Recommendation', A));
    children.push(h.spacer(60));
    children.push(...prose(d.overallAssessment));
  }

  return children;
}

// =============================================================================
// T3 — Comprehensive Risk & Action Report
// =============================================================================
function buildComprehensiveReport(d: any): (Paragraph | Table)[] {
  const A = SLATE;
  const children: (Paragraph | Table)[] = [];

  children.push(...coverPage(d, 'Comprehensive Risk & Action Report', A));

  // Executive Summary
  children.push(accentBar('Executive Summary', A));
  children.push(h.spacer(60));
  children.push(...prose(d.executiveSummary));
  children.push(h.spacer(120));

  // Scope Coverage + Matrix
  if (d.scopeCoverage) {
    children.push(accentBar('Scope Coverage Assessment', A));
    children.push(h.spacer(60));
    children.push(...prose(d.scopeCoverage.summary));

    // Coverage Matrix table
    const matrix: any[] = Array.isArray(d.scopeCoverage.coverageMatrix) ? d.scopeCoverage.coverageMatrix : [];
    if (matrix.length > 0) {
      children.push(h.spacer(60));
      children.push(h.subHeading('Coverage Matrix', 20, A));
      const mxC = cols([0.3, 0.25, 0.45]);
      children.push(new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: mxC,
        rows: [
          new TableRow({ children: [hdrCell('Area', mxC[0], A), hdrCell('Status', mxC[1], A), hdrCell('Notes', mxC[2], A)] }),
          ...matrix.map((m: any, i: number) => {
            const statusCol = (m.status || '').includes('Not') ? HIGH_C : (m.status || '').includes('Partial') ? MED_C : LOW_C;
            return new TableRow({ children: [
              txtCell(m.area || '', mxC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
              txtCell(m.status || '', mxC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: statusCol, bold: true }),
              txtCell(m.notes || '', mxC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            ] });
          }),
        ],
      }));
    }
    children.push(h.spacer(120));
  }

  // Clause Risk Flags (extended)
  const flags: any[] = Array.isArray(d.clauseRiskFlags) ? d.clauseRiskFlags : [];
  if (flags.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }));
    children.push(accentBar('Clause-by-Clause Risk Flags', A));
    children.push(h.spacer(60));
    flags.forEach((f: any) => {
      const sc = sevColor(f.severity);
      children.push(new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.55), Math.round(W * 0.15), Math.round(W * 0.15), Math.round(W * 0.15)],
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: Math.round(W * 0.55), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS, margins: { top: 40, bottom: 40, left: 120, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: `${f.id || ''} — ${f.riskTitle || ''}`, bold: true, size: BODY, font: 'Arial', color: 'FFFFFF' })] })],
          }),
          new TableCell({ width: { size: Math.round(W * 0.15), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS, margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (f.severity || '').toUpperCase(), bold: true, size: SM, font: 'Arial', color: 'FFFFFF' })] })],
          }),
          new TableCell({ width: { size: Math.round(W * 0.15), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS, margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.category || '', size: SM, font: 'Arial', color: 'FFFFFF' })] })],
          }),
          new TableCell({ width: { size: Math.round(W * 0.15), type: WidthType.DXA }, shading: { fill: sc, type: ShadingType.CLEAR }, borders: h.NO_BORDERS, margins: { top: 40, bottom: 40, left: 80, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: f.clauseRef || '', size: SM, font: 'Arial', color: 'FFFFFF' })] })],
          }),
        ] })],
      }));

      children.push(...prose(f.finding));
      if (f.contractualImplication) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [new TextRun({ text: 'Contractual Implication:', bold: true, size: SM, font: 'Arial', color: A })] }));
        children.push(...prose(f.contractualImplication));
      }
      if (f.recommendation) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [new TextRun({ text: 'Recommendation:', bold: true, size: SM, font: 'Arial', color: A })] }));
        children.push(...prose(f.recommendation));
      }
      if (f.financialExposure) {
        children.push(new Paragraph({ spacing: { before: 20, after: 40 }, children: [
          new TextRun({ text: 'Financial Exposure: ', bold: true, size: SM, font: 'Arial', color: GREY }),
          new TextRun({ text: f.financialExposure, size: SM, font: 'Arial', color: HIGH_C }),
        ] }));
      }
      children.push(h.spacer(60));
    });
  }

  // Full Risk Register with L×I scoring
  const rr: any[] = Array.isArray(d.fullRiskRegister) ? d.fullRiskRegister : [];
  if (rr.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }));
    children.push(accentBar('Full Risk Register', A));
    children.push(h.spacer(60));
    const rrC = cols([0.06, 0.18, 0.1, 0.06, 0.06, 0.06, 0.08, 0.08, 0.16, 0.16]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: rrC,
      rows: [
        new TableRow({ children: [
          hdrCell('ID', rrC[0], A), hdrCell('Risk', rrC[1], A), hdrCell('Category', rrC[2], A),
          hdrCell('L', rrC[3], A), hdrCell('I', rrC[4], A), hdrCell('Score', rrC[5], A),
          hdrCell('Severity', rrC[6], A), hdrCell('Owner', rrC[7], A),
          hdrCell('Mitigation', rrC[8], A), hdrCell('Residual', rrC[9], A),
        ] }),
        ...rr.map((r: any, i: number) => {
          const score = r.riskScore || ((r.likelihood || 1) * (r.impact || 1));
          const scoreCol = score >= 15 ? HIGH_C : score >= 8 ? MED_C : LOW_C;
          return new TableRow({ children: [
            txtCell(r.id || '', rrC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(r.risk || '', rrC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(r.category || '', rrC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(String(r.likelihood || ''), rrC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(String(r.impact || ''), rrC[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(String(score), rrC[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: scoreCol, bold: true }),
            txtCell((r.severity || '').toUpperCase(), rrC[6], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(r.severity), bold: true }),
            txtCell(r.owner || '', rrC[7], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(r.mitigation || '', rrC[8], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
            txtCell(r.residualRisk || '', rrC[9], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          ] });
        }),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Interface Analysis
  const ifa: any[] = Array.isArray(d.interfaceAnalysis) ? d.interfaceAnalysis : [];
  if (ifa.length > 0) {
    children.push(accentBar('Interface Gap Analysis', A));
    children.push(h.spacer(60));
    const ifC = cols([0.2, 0.3, 0.25, 0.25]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: ifC,
      rows: [
        new TableRow({ children: [hdrCell('Interface', ifC[0], A), hdrCell('Gap', ifC[1], A), hdrCell('Risk', ifC[2], A), hdrCell('Recommendation', ifC[3], A)] }),
        ...ifa.map((f: any, i: number) => new TableRow({ children: [
          txtCell(f.interface || '', ifC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
          txtCell(f.gap || '', ifC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(f.risk || '', ifC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(f.recommendation || '', ifC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Commercial Review sections
  if (d.commercialReview) {
    children.push(new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }));
    children.push(accentBar('Commercial & Payment Mechanism Review', A));
    children.push(h.spacer(60));

    const crSections: Array<{ key: string; title: string }> = [
      { key: 'paymentMechanism', title: 'Payment Mechanism' },
      { key: 'terminationClauses', title: 'Termination Clauses' },
      { key: 'liabilityAndIndemnity', title: 'Liability & Indemnity' },
      { key: 'insuranceRequirements', title: 'Insurance Requirements' },
    ];
    crSections.forEach(({ key, title }) => {
      const sec = d.commercialReview[key];
      if (!sec) return;
      children.push(h.subHeading(title, 20, A));
      children.push(...prose(sec.summary));
      const risks: string[] = Array.isArray(sec.risks) ? sec.risks : [];
      if (risks.length > 0) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [new TextRun({ text: 'Risks:', bold: true, size: SM, font: 'Arial', color: HIGH_C })] }));
        risks.forEach(r => children.push(new Paragraph({ indent: { left: 240 }, spacing: { after: 20 }, children: [new TextRun({ text: '•  ' + r, size: SM, font: 'Arial' })] })));
      }
      const recs: string[] = Array.isArray(sec.recommendations) ? sec.recommendations : [];
      if (recs.length > 0) {
        children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [new TextRun({ text: 'Recommendations:', bold: true, size: SM, font: 'Arial', color: A })] }));
        recs.forEach(r => children.push(new Paragraph({ indent: { left: 240 }, spacing: { after: 20 }, children: [new TextRun({ text: '→  ' + r, size: SM, font: 'Arial' })] })));
      }
      children.push(h.spacer(80));
    });
  }

  // Programme Feasibility
  if (d.programmeFeasibility) {
    children.push(accentBar('Programme Feasibility Assessment', A));
    children.push(h.spacer(60));
    children.push(...prose(d.programmeFeasibility.assessment));
    const kc: string[] = Array.isArray(d.programmeFeasibility.keyConstraints) ? d.programmeFeasibility.keyConstraints : [];
    if (kc.length > 0) {
      children.push(h.subHeading('Key Constraints', 20, A));
      kc.forEach(c => children.push(new Paragraph({ indent: { left: 240 }, spacing: { after: 20 }, children: [new TextRun({ text: '•  ' + c, size: SM, font: 'Arial' })] })));
    }
    children.push(h.spacer(120));
  }

  // Prelim Allowances
  if (d.prelimAllowances) {
    children.push(accentBar('Preliminary Allowances Check', A));
    children.push(h.spacer(60));
    children.push(...prose(d.prelimAllowances.assessment));
    const mp: string[] = Array.isArray(d.prelimAllowances.missingPrelims) ? d.prelimAllowances.missingPrelims : [];
    if (mp.length > 0) {
      children.push(h.subHeading('Missing Prelims', 20, HIGH_C));
      mp.forEach(p => children.push(new Paragraph({ indent: { left: 240 }, spacing: { after: 20 }, children: [new TextRun({ text: '✗  ' + p, size: SM, font: 'Arial', color: HIGH_C })] })));
    }
    children.push(h.spacer(120));
  }

  // Pre-Contract Checklist
  const pcl: any[] = Array.isArray(d.preContractChecklist) ? d.preContractChecklist : [];
  if (pcl.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ break: 1, text: '' })], pageBreakBefore: true }));
    children.push(accentBar('Pre-Contract Checklist', A));
    children.push(h.spacer(60));
    const clC = cols([0.45, 0.2, 0.15, 0.2]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: clC,
      rows: [
        new TableRow({ children: [hdrCell('Action Item', clC[0], A), hdrCell('Category', clC[1], A), hdrCell('Priority', clC[2], A), hdrCell('Status', clC[3], A)] }),
        ...pcl.map((c: any, i: number) => new TableRow({ children: [
          txtCell(c.item || '', clC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(c.category || '', clC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((c.priority || '').toUpperCase(), clC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(c.priority), bold: true }),
          txtCell(c.status || 'To Do', clC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // RFI Schedule
  const rfis: any[] = Array.isArray(d.rfiSchedule) ? d.rfiSchedule : [];
  if (rfis.length > 0) {
    children.push(accentBar('Prioritised RFI Schedule', A));
    children.push(h.spacer(60));
    const rfiC = cols([0.08, 0.17, 0.3, 0.2, 0.1, 0.15]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: rfiC,
      rows: [
        new TableRow({ children: [hdrCell('#', rfiC[0], A), hdrCell('Subject', rfiC[1], A), hdrCell('Question', rfiC[2], A), hdrCell('Reason', rfiC[3], A), hdrCell('Priority', rfiC[4], A), hdrCell('Deadline', rfiC[5], A)] }),
        ...rfis.map((r: any, i: number) => new TableRow({ children: [
          txtCell(r.rfiNumber || '', rfiC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, bold: true }),
          txtCell(r.subject || '', rfiC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.question || '', rfiC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(r.reason || '', rfiC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((r.priority || '').toUpperCase(), rfiC[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(r.priority), bold: true }),
          txtCell(r.suggestedDeadline || '', rfiC[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Action Plan
  const ap: any[] = Array.isArray(d.actionPlan) ? d.actionPlan : [];
  if (ap.length > 0) {
    children.push(accentBar('Structured Action Plan', A));
    children.push(h.spacer(60));
    const apC = cols([0.08, 0.32, 0.15, 0.12, 0.18, 0.15]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: apC,
      rows: [
        new TableRow({ children: [hdrCell('ID', apC[0], A), hdrCell('Action', apC[1], A), hdrCell('Owner', apC[2], A), hdrCell('Priority', apC[3], A), hdrCell('Deadline', apC[4], A), hdrCell('Status', apC[5], A)] }),
        ...ap.map((a: any, i: number) => new TableRow({ children: [
          txtCell(a.id || '', apC[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(a.action || '', apC[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(a.owner || '', apC[2], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell((a.priority || '').toUpperCase(), apC[3], { bg: i % 2 === 0 ? ZEBRA : h.WHITE, color: sevColor(a.priority), bold: true }),
          txtCell(a.deadline || '', apC[4], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
          txtCell(a.status || 'Open', apC[5], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
        ] })),
      ],
    }));
    children.push(h.spacer(120));
  }

  // Methodology
  if (d.methodology) {
    children.push(accentBar('Methodology & Definitions', A));
    children.push(h.spacer(60));
    children.push(...prose(d.methodology));
    children.push(h.spacer(60));
    // Severity key
    children.push(h.subHeading('Severity Definitions', 20, A));
    const skC = cols([0.15, 0.85]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: skC,
      rows: [
        new TableRow({ children: [txtCell('HIGH', skC[0], { color: HIGH_C, bold: true, bg: HIGH_BG }), txtCell('Material risk — significant financial loss, programme delay, or legal dispute. Immediate attention required.', skC[1], { bg: HIGH_BG })] }),
        new TableRow({ children: [txtCell('MEDIUM', skC[0], { color: MED_C, bold: true, bg: MED_BG }), txtCell('Notable concern — should be clarified or negotiated. Could escalate if unaddressed.', skC[1], { bg: MED_BG })] }),
        new TableRow({ children: [txtCell('LOW', skC[0], { color: LOW_C, bold: true, bg: LOW_BG }), txtCell('Minor observation — best-practice recommendation. Unlikely to cause material harm.', skC[1], { bg: LOW_BG })] }),
      ],
    }));
    children.push(h.spacer(60));
    // L×I key
    children.push(h.subHeading('Likelihood × Impact Scoring', 20, A));
    children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: '1 = Very Low  |  2 = Low  |  3 = Medium  |  4 = High  |  5 = Very High.  Risk Score = Likelihood × Impact (1–25).', size: SM, font: 'Arial', color: GREY })] }));
    children.push(h.spacer(120));
  }

  // Overall Assessment
  if (d.overallAssessment) {
    children.push(accentBar('Overall Assessment & Recommendation', A));
    children.push(h.spacer(60));
    children.push(...prose(d.overallAssessment));
  }

  return children;
}

// =============================================================================
// Router
// =============================================================================
export async function buildContractScopeDocument(
  templateSlug: ContractScopeTemplateSlug,
  content: any,
): Promise<Buffer> {
  let docChildren: (Paragraph | Table)[];

  switch (templateSlug) {
    case 'quick-risk-summary':
      docChildren = buildQuickRiskSummary(content);
      break;
    case 'detailed-risk-review':
      docChildren = buildDetailedRiskReview(content);
      break;
    case 'comprehensive-risk-action':
      docChildren = buildComprehensiveReport(content);
      break;
    default:
      docChildren = buildQuickRiskSummary(content);
  }

  const { Packer } = await import('docx');
  const doc = new Document({
    sections: [{
      properties: h.PORTRAIT_SECTION,
      headers: { default: h.ebroraHeader('Contract Scope Risk Review') },
      footers: { default: h.ebroraFooter() },
      children: docChildren,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
