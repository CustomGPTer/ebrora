// =============================================================================
// Programme Checker — Multi-Template Engine
// 4 templates: scoring, email-summary, rag-report, comprehensive
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import * as p from './premium-template-engine';
import type { ProgrammeCheckerTemplateSlug } from '@/lib/programme-checker/types';

const W = h.A4_CONTENT_WIDTH;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const BODY = 20;
const SM = 16;
const LG = 24;

// ── Colours ──────────────────────────────────────────────────────────────────
const EBRORA     = h.EBRORA_GREEN;
const TEAL       = '0f766e';
const TEAL_BG    = 'f0fdfa';
const NAVY       = '1e293b';
const NAVY_BG    = 'f1f5f9';
const CHARCOAL   = '2d3748';
const GREEN_RAG  = '059669';
const GREEN_BG   = 'D1FAE5';
const AMBER      = 'D97706';
const AMBER_BG   = 'FEF3C7';
const RED        = 'DC2626';
const RED_BG     = 'FEE2E2';
const GREY       = '6B7280';
const GREY_BG    = 'F3F4F6';
const ZEBRA      = 'F5F5F5';

// ── Shared helpers ───────────────────────────────────────────────────────────
function ragColor(r: string): string {
  const u = (r || '').toUpperCase();
  if (u.includes('RED')) return RED;
  if (u.includes('AMBER')) return AMBER;
  if (u.includes('GREEN')) return GREEN_RAG;
  return GREY;
}

function ragBg(r: string): string {
  const u = (r || '').toUpperCase();
  if (u.includes('RED')) return RED_BG;
  if (u.includes('AMBER')) return AMBER_BG;
  if (u.includes('GREEN')) return GREEN_BG;
  return GREY_BG;
}

function gradeColor(g: string): string {
  if (g === 'A+' || g === 'A') return GREEN_RAG;
  if (g === 'B') return '2563EB';
  if (g === 'C') return AMBER;
  if (g === 'D') return 'EA580C';
  return RED;
}

function cell(text: string, width: number, opts?: { bold?: boolean; bg?: string; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CM,
    shading: opts?.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts?.align || AlignmentType.LEFT,
      children: [new TextRun({ text: text || '', bold: opts?.bold, color: opts?.color || '111827', size: opts?.size || BODY, font: 'Calibri' })],
    })],
  });
}

function noBorders() {
  const n = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: n, bottom: n, left: n, right: n, insideH: n, insideV: n };
}

// =============================================================================
// T1 — SCORING TEMPLATE
// =============================================================================
async function buildScoringDocument(c: any): Promise<Document> {
  const ACCENT = TEAL;

  const cover = {
    documentLabel: 'Programme Scoring Report',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.programmeTitle || 'Programme Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'PROGRAMME SCORING ASSESSMENT',
    extraFields: [
      ['Programme Type', c.programmeType || ''],
      ['Programme Period', `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}`],
      ['Overall Score', `${c.overallWeightedScore || 0}% (${c.overallGrade || 'N/A'})`],
    ] as [string, string][],
  };

  // S1 — Score dashboard + methodology
  const s1: any[] = [
    p.sectionBand('Overall Score Dashboard', ACCENT),
    new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            cell('Overall Weighted Score', Math.floor(W * 0.5), { bold: true, bg: ACCENT, color: 'FFFFFF' }),
            cell(`${c.overallWeightedScore || 0}%`, Math.floor(W * 0.25), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER, size: LG }),
            cell(c.overallGrade || 'N/A', W - Math.floor(W * 0.5) - Math.floor(W * 0.25), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER, size: LG }),
          ],
        }),
      ],
    }),
    h.spacer(120),
    ...p.proseSection('Scoring Methodology', c.scoringMethodology || '', ACCENT),
    ...p.infoSection('Programme Metrics', [
      { label: 'Total Activities', value: c.programmeMetrics?.totalActivities || 'N/A' },
      { label: 'Milestones', value: c.programmeMetrics?.milestones || 'N/A' },
      { label: 'Critical Activities', value: c.programmeMetrics?.criticalActivities || 'N/A' },
      { label: 'Average Float', value: c.programmeMetrics?.averageFloat || 'N/A' },
      { label: 'Open Ends', value: c.programmeMetrics?.openEnds || 'N/A' },
    ], ACCENT),
  ];

  // S2 — Scored areas table + detail
  const s2: any[] = [p.sectionBand('Area-by-Area Scoring', ACCENT)];
  // Summary table
  const headerRow = new TableRow({
    children: [
      cell('Review Area', Math.floor(W * 0.35), { bold: true, bg: ACCENT, color: 'FFFFFF' }),
      cell('Weight', Math.floor(W * 0.10), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER }),
      cell('Score /10', Math.floor(W * 0.12), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER }),
      cell('Weighted', Math.floor(W * 0.13), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER }),
      cell('Grade', W - Math.floor(W * 0.35) - Math.floor(W * 0.10) - Math.floor(W * 0.12) - Math.floor(W * 0.13), { bold: true, bg: ACCENT, color: 'FFFFFF', align: AlignmentType.CENTER }),
    ],
  });
  const dataRows = (c.scoredAreas || []).map((a: any, i: number) => new TableRow({
    children: [
      cell(a.area || '', Math.floor(W * 0.35), { bg: i % 2 ? ZEBRA : undefined }),
      cell(`${a.weight || 0}%`, Math.floor(W * 0.10), { align: AlignmentType.CENTER, bg: i % 2 ? ZEBRA : undefined }),
      cell(`${a.rawScore || 0}`, Math.floor(W * 0.12), { align: AlignmentType.CENTER, bold: true, bg: i % 2 ? ZEBRA : undefined }),
      cell(`${a.weightedScore || 0}`, Math.floor(W * 0.13), { align: AlignmentType.CENTER, bg: i % 2 ? ZEBRA : undefined }),
      cell(a.grade || '', W - Math.floor(W * 0.35) - Math.floor(W * 0.10) - Math.floor(W * 0.12) - Math.floor(W * 0.13), { align: AlignmentType.CENTER, bold: true, color: gradeColor(a.grade), bg: i % 2 ? ZEBRA : undefined }),
    ],
  }));
  s2.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [headerRow, ...dataRows] }));
  s2.push(h.spacer(160));

  // Detail per area
  for (const area of (c.scoredAreas || [])) {
    s2.push(h.infoTable([
      { label: 'Area', value: area.area || '' },
      { label: 'Score', value: `${area.rawScore || 0} / 10 (${area.grade || ''})` },
    ], W));
    s2.push(h.spacer(60));
    if (area.keyStrengths?.length) s2.push(...p.bulletListSection('Strengths', area.keyStrengths, GREEN_RAG));
    if (area.keyDeficiencies?.length) s2.push(...p.bulletListSection('Deficiencies', area.keyDeficiencies, RED));
    if (area.improvementActions?.length) s2.push(...p.bulletListSection('Improvement Actions', area.improvementActions, ACCENT));
    s2.push(h.spacer(160));
  }

  // S3 — Ranked deficiencies + improvement plan
  const s3: any[] = [
    ...p.dataTableSection('Ranked Deficiencies', c.rankedDeficiencies || [], [
      { key: 'rank', label: 'Rank', width: Math.floor(W * 0.07) },
      { key: 'area', label: 'Area', width: Math.floor(W * 0.22) },
      { key: 'deficiency', label: 'Deficiency', width: Math.floor(W * 0.30) },
      { key: 'scoreImpact', label: 'Score Impact', width: Math.floor(W * 0.16) },
      { key: 'recommendedFix', label: 'Recommended Fix', width: W - Math.floor(W * 0.07) - Math.floor(W * 0.22) - Math.floor(W * 0.30) - Math.floor(W * 0.16) },
    ], ACCENT),
    ...p.dataTableSection('Improvement Plan', c.improvementPlan || [], [
      { key: 'action', label: 'Action', width: Math.floor(W * 0.50) },
      { key: 'priority', label: 'Priority', width: Math.floor(W * 0.22) },
      { key: 'expectedScoreGain', label: 'Expected Gain', width: W - Math.floor(W * 0.50) - Math.floor(W * 0.22) },
    ], ACCENT),
    ...p.signatureBlock([{ role: "Reviewed by", name: "" }, { role: "Date", name: "" }], ACCENT),
  ];

  // Prepend metadata to first section
  const t1Meta: any[] = [
    h.infoTable([
      { label: 'Document Reference', value: c.documentRef || '' },
      { label: 'Programme',          value: c.programmeTitle || 'Programme Review' },
      { label: 'Reviewed By',        value: c.reviewedBy || '' },
      { label: 'Date',               value: c.reviewDate || '' },
      { label: 'Programme Type',     value: c.programmeType || '' },
      { label: 'Period',             value: `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}` },
      { label: 'Overall Score',      value: `${c.overallWeightedScore || 0}% (${c.overallGrade || 'N/A'})` },
    ], W),
    h.spacer(100),
  ];
  s1.unshift(...t1Meta);

  return p.buildPremiumDocumentInline({
    documentLabel: 'Programme Scoring Report',
    accentHex: ACCENT,
    classification: 'PROGRAMME SCORING ASSESSMENT',
  }, [s1, s2, s3]);
}

// =============================================================================
// T2 — EMAIL SUMMARY TEMPLATE
// =============================================================================
async function buildEmailSummaryDocument(c: any): Promise<Document> {
  const ACCENT = NAVY;

  const cover = {
    documentLabel: 'Programme Review — Email Summary',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.programmeTitle || 'Programme Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'PROGRAMME REVIEW CORRESPONDENCE',
    extraFields: [
      ['Programme Type', c.programmeType || ''],
      ['Addressed To', c.addressedTo || 'Project Manager'],
      ['Assessment', c.programmeStatistics?.overallAssessment || ''],
    ] as [string, string][],
  };

  // S1 — Letter header + body
  const s1: any[] = [
    // Letter header table
    new Table({
      width: { size: W, type: WidthType.DXA },
      borders: noBorders(),
      rows: [
        new TableRow({ children: [cell('To:', Math.floor(W * 0.15), { bold: true, color: ACCENT }), cell(c.addressedTo || 'Project Manager', W - Math.floor(W * 0.15))] }),
        new TableRow({ children: [cell('From:', Math.floor(W * 0.15), { bold: true, color: ACCENT }), cell(c.from || 'Programme Review Team', W - Math.floor(W * 0.15))] }),
        new TableRow({ children: [cell('Date:', Math.floor(W * 0.15), { bold: true, color: ACCENT }), cell(c.reviewDate || '', W - Math.floor(W * 0.15))] }),
        new TableRow({ children: [cell('Subject:', Math.floor(W * 0.15), { bold: true, color: ACCENT }), cell(c.subject || '', W - Math.floor(W * 0.15), { bold: true })] }),
        new TableRow({ children: [cell('Ref:', Math.floor(W * 0.15), { bold: true, color: ACCENT }), cell(c.documentRef || '', W - Math.floor(W * 0.15))] }),
      ],
    }),
    h.spacer(200),
    // Opening paragraph
    ...h.prose(c.openingParagraph || ''),
    h.spacer(120),
    // Key findings
    p.sectionBand('Key Findings', ACCENT),
  ];

  for (const f of (c.keyFindings || [])) {
    const sevColor = (f.severity || '').toLowerCase().includes('critical') ? RED
      : (f.severity || '').toLowerCase().includes('significant') ? AMBER : GREEN_RAG;
    s1.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: `[${f.severity || 'Info'}] `, bold: true, color: sevColor, size: BODY, font: 'Calibri' }),
        new TextRun({ text: f.finding || '', size: BODY, font: 'Calibri', color: '374151' }),
      ],
    }));
  }

  s1.push(h.spacer(120));

  // Programme stats box
  s1.push(...p.infoSection('Programme Statistics', [
    { label: 'Total Activities', value: c.programmeStatistics?.totalActivities || 'N/A' },
    { label: 'Milestones', value: c.programmeStatistics?.milestones || 'N/A' },
    { label: 'Critical Activities', value: c.programmeStatistics?.criticalActivities || 'N/A' },
    { label: 'Average Float', value: c.programmeStatistics?.averageFloat || 'N/A' },
    { label: 'Open Ends', value: c.programmeStatistics?.openEnds || 'N/A' },
    { label: 'Overall Assessment', value: c.programmeStatistics?.overallAssessment || 'N/A' },
  ], ACCENT));

  // S2 — Critical issues + next steps + closing
  const s2: any[] = [
    ...p.dataTableSection('Critical Issues', c.criticalIssues || [], [
      { key: 'issue', label: 'Issue', width: Math.floor(W * 0.35) },
      { key: 'impact', label: 'Impact', width: Math.floor(W * 0.30) },
      { key: 'requiredAction', label: 'Required Action', width: W - Math.floor(W * 0.35) - Math.floor(W * 0.30) },
    ], ACCENT),
    ...p.bulletListSection('Recommended Next Steps', c.recommendedNextSteps || [], ACCENT),
    h.spacer(200),
    ...h.prose(c.closingParagraph || ''),
    h.spacer(200),
    // Sign-off
    new Paragraph({ children: [new TextRun({ text: 'Yours faithfully,', size: BODY, font: 'Calibri', color: '374151' })] }),
    h.spacer(100),
    new Paragraph({ children: [new TextRun({ text: c.signOffName || 'Programme Review Team', bold: true, size: BODY, font: 'Calibri', color: ACCENT })] }),
    new Paragraph({ children: [new TextRun({ text: c.signOffTitle || 'Ebrora AI Programme Checker', size: SM, font: 'Calibri', color: GREY })] }),
  ];

  // Prepend metadata to first section
  const t2Meta: any[] = [
    h.infoTable([
      { label: 'Document Reference', value: c.documentRef || '' },
      { label: 'Programme',          value: c.programmeTitle || 'Programme Review' },
      { label: 'Reviewed By',        value: c.reviewedBy || '' },
      { label: 'Date',               value: c.reviewDate || '' },
      { label: 'Addressed To',       value: c.addressedTo || 'Project Manager' },
      { label: 'Assessment',         value: c.programmeStatistics?.overallAssessment || '' },
    ], W),
    h.spacer(100),
  ];
  s1.unshift(...t2Meta);

  return p.buildPremiumDocumentInline({
    documentLabel: 'Programme Review — Email Summary',
    accentHex: ACCENT,
    classification: 'PROGRAMME REVIEW CORRESPONDENCE',
  }, [s1, s2]);
}

// =============================================================================
// T3 — RAG REPORT TEMPLATE (same as existing buildProgrammeCheckerDocument)
// =============================================================================
async function buildRagReportDocument(c: any): Promise<Document> {
  const ACCENT = EBRORA;

  const cover = {
    documentLabel: 'Programme Review Report',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.programmeTitle || 'Programme Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'PROGRAMME MANAGEMENT DOCUMENT',
    extraFields: [
      ['Programme Type', c.programmeType || ''],
      ['Programme Period', `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}`],
      ['Total Duration', c.programmePeriod?.totalDuration || ''],
      ['Overall RAG Rating', c.overallRagRating || ''],
    ] as [string, string][],
  };

  const s1: any[] = [
    ...p.proseSection('Executive Summary', c.overallSummary, ACCENT),
    ...p.infoSection('Programme Metrics', [
      { label: 'Total Activities', value: c.programmeMetrics?.totalActivities || 'N/A' },
      { label: 'Milestones', value: c.programmeMetrics?.milestones || 'N/A' },
      { label: 'Critical Activities', value: c.programmeMetrics?.criticalActivities || 'N/A' },
      { label: 'Average Float', value: c.programmeMetrics?.averageFloat || 'N/A' },
      { label: 'Open Ends', value: c.programmeMetrics?.openEnds || 'N/A' },
    ], ACCENT),
  ];

  const s2: any[] = [p.sectionBand('Detailed Review by Area', ACCENT)];
  for (const area of (c.reviewAreas || [])) {
    s2.push(h.infoTable([
      { label: 'Review Area', value: area.area || '' },
      { label: 'RAG Rating', value: area.ragRating || '' },
      { label: 'Score', value: `${area.score || ''} / 10` },
    ], W));
    s2.push(h.spacer(60));
    s2.push(...h.prose(area.findings || ''));
    if (area.issues?.length) s2.push(...p.bulletListSection('Issues Identified', area.issues, ACCENT));
    if (area.recommendations?.length) s2.push(...p.bulletListSection('Recommendations', area.recommendations, ACCENT));
    s2.push(h.spacer(160));
  }

  const s3: any[] = [
    ...p.dataTableSection('Critical Issues', c.criticalIssues || [], [
      { key: 'priority', label: 'Priority', width: Math.floor(W * 0.08) },
      { key: 'ragRating', label: 'RAG', width: Math.floor(W * 0.10) },
      { key: 'issue', label: 'Issue', width: Math.floor(W * 0.30) },
      { key: 'impact', label: 'Impact', width: Math.floor(W * 0.26) },
      { key: 'recommendation', label: 'Recommendation', width: W - Math.floor(W * 0.08) - Math.floor(W * 0.10) - Math.floor(W * 0.30) - Math.floor(W * 0.26) },
    ], ACCENT),
    ...p.dataTableSection('Recommended Actions', c.recommendedActions || [], [
      { key: 'action', label: 'Action', width: Math.floor(W * 0.55) },
      { key: 'priority', label: 'Priority', width: Math.floor(W * 0.25) },
      { key: 'responsible', label: 'Responsible', width: W - Math.floor(W * 0.55) - Math.floor(W * 0.25) },
    ], ACCENT),
    ...p.signatureBlock([{ role: "Reviewed by", name: "" }, { role: "Date", name: "" }], ACCENT),
  ];

  // Prepend metadata to first section
  const t3Meta: any[] = [
    h.infoTable([
      { label: 'Document Reference', value: c.documentRef || '' },
      { label: 'Programme',          value: c.programmeTitle || 'Programme Review' },
      { label: 'Reviewed By',        value: c.reviewedBy || '' },
      { label: 'Date',               value: c.reviewDate || '' },
      { label: 'Programme Type',     value: c.programmeType || '' },
      { label: 'Period',             value: `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}` },
      { label: 'Overall RAG',        value: c.overallRagRating || '' },
    ], W),
    h.spacer(100),
  ];
  s1.unshift(...t3Meta);

  return p.buildPremiumDocumentInline({
    documentLabel: 'Programme Review Report',
    accentHex: ACCENT,
    classification: 'PROGRAMME MANAGEMENT DOCUMENT',
  }, [s1, s2, s3]);
}

// =============================================================================
// T4 — COMPREHENSIVE TEMPLATE
// =============================================================================
async function buildComprehensiveDocument(c: any): Promise<Document> {
  const ACCENT = CHARCOAL;

  const cover = {
    documentLabel: 'Comprehensive Programme Analysis',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.programmeTitle || 'Programme Review',
    preparedBy: c.reviewedBy,
    date: c.reviewDate,
    classification: 'PROGRAMME AUDIT DOCUMENT',
    extraFields: [
      ['Programme Type', c.programmeType || ''],
      ['Programme Period', `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}`],
      ['Overall RAG', c.overallRagRating || ''],
      ['Overall Score', `${c.overallWeightedScore || 'N/A'}%`],
    ] as [string, string][],
  };

  // S1 — Executive summary + extended metrics
  const s1: any[] = [
    ...p.proseSection('Executive Summary', c.executiveSummary || c.overallSummary || '', ACCENT),
    ...p.infoSection('Programme Metrics', [
      { label: 'Total Activities', value: c.programmeMetrics?.totalActivities || 'N/A' },
      { label: 'Milestones', value: c.programmeMetrics?.milestones || 'N/A' },
      { label: 'Critical Activities', value: c.programmeMetrics?.criticalActivities || 'N/A' },
      { label: 'Average Float', value: c.programmeMetrics?.averageFloat || 'N/A' },
      { label: 'Open Ends', value: c.programmeMetrics?.openEnds || 'N/A' },
      { label: 'Logic Density', value: c.programmeMetrics?.logicDensity || 'N/A' },
      { label: 'Critical Path Length', value: c.programmeMetrics?.criticalPathLength || 'N/A' },
      { label: 'Near-Critical (<5d Float)', value: c.programmeMetrics?.nearCriticalActivities || 'N/A' },
    ], ACCENT),
  ];

  // S2 — Detailed review areas with extended findings
  const s2: any[] = [p.sectionBand('Detailed Review by Area', ACCENT)];
  for (const area of (c.reviewAreas || [])) {
    const rc = ragColor(area.ragRating);
    s2.push(h.infoTable([
      { label: 'Review Area', value: area.area || '' },
      { label: 'RAG Rating', value: area.ragRating || '' },
      { label: 'Score', value: `${area.score || ''} / 10 (Weight: ${area.weight || ''}%)` },
      { label: 'Risk Level', value: area.riskLevel || '' },
    ], W));
    s2.push(h.spacer(60));
    s2.push(...h.prose(area.extendedFindings || area.findings || ''));
    if (area.bestPracticeComparison) {
      s2.push(h.spacer(60));
      s2.push(new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text: 'Best Practice Comparison: ', bold: true, size: BODY, font: 'Calibri', color: ACCENT }),
          new TextRun({ text: area.bestPracticeComparison, size: BODY, font: 'Calibri', color: '374151' }),
        ],
      }));
    }
    if (area.issues?.length) s2.push(...p.bulletListSection('Issues Identified', area.issues, ACCENT));
    if (area.recommendations?.length) s2.push(...p.bulletListSection('Recommendations', area.recommendations, ACCENT));
    s2.push(h.spacer(160));
  }

  // S3 — Risk matrix + float + critical path
  const s3: any[] = [
    ...p.dataTableSection('Risk Matrix', c.riskMatrix || [], [
      { key: 'risk', label: 'Risk', width: Math.floor(W * 0.28) },
      { key: 'likelihood', label: 'L (1-5)', width: Math.floor(W * 0.08) },
      { key: 'impact', label: 'I (1-5)', width: Math.floor(W * 0.08) },
      { key: 'riskScore', label: 'Score', width: Math.floor(W * 0.08) },
      { key: 'mitigation', label: 'Mitigation', width: Math.floor(W * 0.30) },
      { key: 'owner', label: 'Owner', width: W - Math.floor(W * 0.28) - Math.floor(W * 0.08) - Math.floor(W * 0.08) - Math.floor(W * 0.08) - Math.floor(W * 0.30) },
    ], ACCENT),
  ];

  // Float distribution
  if (c.floatDistribution) {
    s3.push(...p.infoSection('Float Distribution', [
      { label: 'Negative Float', value: c.floatDistribution.negative || 'N/A' },
      { label: 'Zero Float', value: c.floatDistribution.zero || 'N/A' },
      { label: 'Less Than 5 Days', value: c.floatDistribution.lessThan5 || 'N/A' },
      { label: '5 – 20 Days', value: c.floatDistribution.fiveTo20 || 'N/A' },
      { label: 'More Than 20 Days', value: c.floatDistribution.moreThan20 || 'N/A' },
    ], ACCENT));
    if (c.floatDistribution.analysis) {
      s3.push(...h.prose(c.floatDistribution.analysis));
    }
  }

  // Critical path narrative
  if (c.criticalPathNarrative) {
    s3.push(...p.proseSection('Critical Path Narrative', c.criticalPathNarrative, ACCENT));
  }

  // Resource loading
  if (c.resourceLoadingAssessment) {
    s3.push(...p.proseSection('Resource Loading Assessment', c.resourceLoadingAssessment, ACCENT));
  }

  // S4 — Contractual compliance + issues + improvement plan + methodology
  const s4: any[] = [];

  // Contractual compliance
  if (c.contractualCompliance) {
    s4.push(p.sectionBand('Contractual Compliance', ACCENT));
    s4.push(...p.infoSection('Contract Details', [
      { label: 'Contract Type', value: c.contractualCompliance.contractType || 'Not stated' },
      { label: 'Completion Date', value: c.contractualCompliance.completionDateAssessment || 'N/A' },
      { label: 'Float Ownership', value: c.contractualCompliance.floatOwnership || 'N/A' },
    ], ACCENT));
    if (c.contractualCompliance.keyDatesAssessed?.length) {
      s4.push(...p.dataTableSection('Key Dates Assessment', c.contractualCompliance.keyDatesAssessed, [
        { key: 'keyDate', label: 'Key Date', width: Math.floor(W * 0.30) },
        { key: 'status', label: 'Status', width: Math.floor(W * 0.20) },
        { key: 'notes', label: 'Notes', width: W - Math.floor(W * 0.30) - Math.floor(W * 0.20) },
      ], ACCENT));
    }
  }

  // Critical issues with extended fields
  s4.push(...p.dataTableSection('Critical Issues', c.criticalIssues || [], [
    { key: 'priority', label: '#', width: Math.floor(W * 0.05) },
    { key: 'ragRating', label: 'RAG', width: Math.floor(W * 0.08) },
    { key: 'issue', label: 'Issue', width: Math.floor(W * 0.25) },
    { key: 'impact', label: 'Impact', width: Math.floor(W * 0.20) },
    { key: 'recommendation', label: 'Recommendation', width: Math.floor(W * 0.22) },
    { key: 'owner', label: 'Owner', width: W - Math.floor(W * 0.05) - Math.floor(W * 0.08) - Math.floor(W * 0.25) - Math.floor(W * 0.20) - Math.floor(W * 0.22) },
  ], ACCENT));

  // Improvement plan
  s4.push(...p.dataTableSection('Structured Improvement Plan', c.improvementPlan || [], [
    { key: 'action', label: 'Action', width: Math.floor(W * 0.30) },
    { key: 'priority', label: 'Priority', width: Math.floor(W * 0.12) },
    { key: 'responsible', label: 'Responsible', width: Math.floor(W * 0.15) },
    { key: 'targetDate', label: 'Target Date', width: Math.floor(W * 0.15) },
    { key: 'expectedBenefit', label: 'Expected Benefit', width: W - Math.floor(W * 0.30) - Math.floor(W * 0.12) - Math.floor(W * 0.15) - Math.floor(W * 0.15) },
  ], ACCENT));

  // Methodology appendix
  if (c.methodology) {
    s4.push(...p.proseSection('Appendix: Methodology & Definitions', c.methodology, ACCENT));
  }

  s4.push(...p.signatureBlock([{ role: "Programme Manager", name: "" }, { role: "Project Manager", name: "" }, { role: "Planner", name: "" }], ACCENT));

  // Prepend metadata to first section
  const t4Meta: any[] = [
    h.infoTable([
      { label: 'Document Reference', value: c.documentRef || '' },
      { label: 'Programme',          value: c.programmeTitle || 'Programme Review' },
      { label: 'Reviewed By',        value: c.reviewedBy || '' },
      { label: 'Date',               value: c.reviewDate || '' },
      { label: 'Programme Type',     value: c.programmeType || '' },
      { label: 'Period',             value: `${c.programmePeriod?.startDate || ''} – ${c.programmePeriod?.completionDate || ''}` },
      { label: 'Overall RAG',        value: c.overallRagRating || '' },
      { label: 'Overall Score',      value: `${c.overallWeightedScore || 'N/A'}%` },
    ], W),
    h.spacer(100),
  ];
  s1.unshift(...t4Meta);

  return p.buildPremiumDocumentInline({
    documentLabel: 'Comprehensive Programme Audit',
    accentHex: ACCENT,
    classification: 'PROGRAMME AUDIT DOCUMENT',
  }, [s1, s2, s3, s4]);
}

// =============================================================================
// ROUTER — Select template builder by slug
// =============================================================================
export async function buildProgrammeCheckerTemplateDocument(content: any, templateSlug: ProgrammeCheckerTemplateSlug): Promise<Document> {
  switch (templateSlug) {
    case 'scoring':
      return buildScoringDocument(content);
    case 'email-summary':
      return buildEmailSummaryDocument(content);
    case 'rag-report':
      return buildRagReportDocument(content);
    case 'comprehensive':
      return buildComprehensiveDocument(content);
    default:
      return buildRagReportDocument(content);
  }
}
