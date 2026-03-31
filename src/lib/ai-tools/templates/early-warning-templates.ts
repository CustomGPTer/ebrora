// =============================================================================
// Early Warning Notice — Multi-Template Engine
// 8 templates, all consuming the same EarlyWarningData JSON.
//
// Templates:
//   T1 — nec4-contractor-pm    (Navy + Amber, Contractor → PM)
//   T2 — nec4-pm-contractor    (Slate + Teal, PM → Contractor)
//   T3 — nec4-sub-to-mc        (Forest + Gold, Sub → MC)
//   T4 — nec4-mc-to-sub        (Charcoal + Crimson, MC → Sub)
//   T5 — comprehensive-risk    (Purple + Orange, full risk matrix)
//   T6 — health-safety         (Safety Red + Dark, CDM/H&S)
//   T7 — design-technical      (Blueprint + Silver, design risk)
//   T8 — weather-force-majeure (Storm Grey + Amber, weather/FM)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { EarlyWarningTemplateSlug } from '@/lib/early-warning/types';

// ── Layout Constants ─────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH; // 9026 DXA
const cellPad = { top: 60, bottom: 60, left: 100, right: 100 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// ── Palette per template ─────────────────────────────────────────
interface Palette {
  primary: string;
  primaryLight: string;
  accent: string;
  dark: string;
  mid: string;
  rowAlt: string;
  font: string;
  bodySize: number;
}

const PALETTES: Record<EarlyWarningTemplateSlug, Palette> = {
  'nec4-contractor-pm':    { primary: '1E3A5F', primaryLight: 'F1F5F9', accent: 'D97706', dark: '1E293B', mid: '64748B', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 18 },
  'nec4-pm-contractor':    { primary: '0F172A', primaryLight: 'F0FDFA', accent: '0D9488', dark: '1E293B', mid: '64748B', rowAlt: 'F8FAFC', font: 'Arial', bodySize: 18 },
  'nec4-sub-to-mc':        { primary: '1B4332', primaryLight: 'F0FDF4', accent: 'CA8A04', dark: '1E293B', mid: '6B7280', rowAlt: 'F0FDF4', font: 'Arial', bodySize: 18 },
  'nec4-mc-to-sub':        { primary: '1F2937', primaryLight: 'F9FAFB', accent: 'DC2626', dark: '1F2937', mid: '6B7280', rowAlt: 'F9FAFB', font: 'Arial', bodySize: 18 },
  'comprehensive-risk':    { primary: '4C1D95', primaryLight: 'FAF5FF', accent: 'EA580C', dark: '1E293B', mid: '6B7280', rowAlt: 'FAF5FF', font: 'Arial', bodySize: 18 },
  'health-safety':         { primary: '7F1D1D', primaryLight: 'FEF2F2', accent: 'DC2626', dark: '111827', mid: '6B7280', rowAlt: 'FEF2F2', font: 'Arial', bodySize: 18 },
  'design-technical':      { primary: '1E3A8A', primaryLight: 'EFF6FF', accent: '3B82F6', dark: '1E293B', mid: '6B7280', rowAlt: 'EFF6FF', font: 'Arial', bodySize: 18 },
  'weather-force-majeure': { primary: '374151', primaryLight: 'F9FAFB', accent: 'F59E0B', dark: '1E293B', mid: '6B7280', rowAlt: 'F9FAFB', font: 'Arial', bodySize: 18 },
};

// ── Shared Helpers ───────────────────────────────────────────────
function hdr(p: Palette, text: string, width: number): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: p.primary, type: ShadingType.CLEAR },
    margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: p.font, size: 16 })] })],
  });
}

function dCell(p: Palette, text: string, width: number, opts: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; color?: string } = {}): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: !!opts.bold, font: p.font, size: p.bodySize, color: opts.color || p.dark })] })],
  });
}

function labelValueRow(p: Palette, label: string, value: string): TableRow {
  return new TableRow({
    children: [
      dCell(p, label, Math.round(W * 0.3), { bold: true, shade: p.primaryLight }),
      dCell(p, value, W - Math.round(W * 0.3)),
    ],
  });
}

function infoTableFromPairs(p: Palette, pairs: [string, string][]): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: pairs.map(([l, v]) => labelValueRow(p, l, v)),
  });
}

function sectionHead(p: Palette, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: p.accent } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, font: p.font, color: p.primary })],
  });
}

function bodyPara(p: Palette, text: string): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, font: p.font, size: p.bodySize, color: p.dark })] });
}

function gap(size = 200): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function titleBlock(p: Palette, title: string, subtitle?: string, clause?: string): Paragraph[] {
  const result: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 60 }, children: [
      new TextRun({ text: title, bold: true, size: 40, font: p.font, color: p.primary }),
    ] }),
  ];
  if (subtitle) {
    result.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
      new TextRun({ text: subtitle, bold: true, size: 22, font: p.font, color: p.accent }),
    ] }));
  }
  if (clause) {
    result.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
      new TextRun({ text: clause, size: 18, font: p.font, color: p.mid }),
    ] }));
  }
  result.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: p.accent } }, children: [] }));
  return result;
}

function mitigationTable(p: Palette, items: any[]): Table {
  const cols = [0.06, 0.38, 0.2, 0.16, 0.2];
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        hdr(p, 'No.', Math.round(W * cols[0])),
        hdr(p, 'Mitigation Action', Math.round(W * cols[1])),
        hdr(p, 'Responsible', Math.round(W * cols[2])),
        hdr(p, 'Target Date', Math.round(W * cols[3])),
        hdr(p, 'Est. Saving', Math.round(W * cols[4])),
      ] }),
      ...(items || []).map((m: any, i: number) => {
        const shade = i % 2 === 0 ? p.rowAlt : 'FFFFFF';
        return new TableRow({ children: [
          dCell(p, String(i + 1), Math.round(W * cols[0]), { shade, align: AlignmentType.CENTER }),
          dCell(p, m.action || '', Math.round(W * cols[1]), { shade }),
          dCell(p, m.responsibleParty || m.owner || '', Math.round(W * cols[2]), { shade }),
          dCell(p, m.targetDate || '', Math.round(W * cols[3]), { shade }),
          dCell(p, m.estimatedCostSaving || m.saving || '', Math.round(W * cols[4]), { shade }),
        ] });
      }),
    ],
  });
}

function approvalBlock(p: Palette, roles: { role: string; name: string }[]): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: roles.map((r) => new TableRow({
      children: [
        dCell(p, r.role, Math.round(W * 0.35), { bold: true, shade: p.primaryLight }),
        new TableCell({
          borders, width: { size: W - Math.round(W * 0.35), type: WidthType.DXA },
          margins: cellPad,
          children: [
            new Paragraph({ children: [new TextRun({ text: r.name || '', font: p.font, size: p.bodySize, color: p.dark })] }),
            gap(80),
            new Paragraph({ children: [new TextRun({ text: '____________________________', font: p.font, size: 16, color: p.mid })] }),
            new Paragraph({ children: [new TextRun({ text: 'Signature / Date', font: p.font, size: 14, color: p.mid, italics: true })] }),
          ],
        }),
      ],
    })),
  });
}

function ebroraFooterLine(p: Palette): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [
    new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: p.font, color: h.EBRORA_GREEN, bold: true }),
  ] });
}

function proseSection(p: Palette, text: string | undefined): Paragraph[] {
  if (!text) return [];
  return text.split('\n').filter(Boolean).map((line) => bodyPara(p, line));
}

// ── Template-Specific Builders ───────────────────────────────────

function buildT1ContractorPM(p: Palette, c: any): Paragraph[] {
  const cost = c.potentialImpactOnCost || {};
  const prog = c.potentialImpactOnProgramme || {};
  const rrm = c.riskReductionMeeting || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', undefined, `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'}`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By (Contractor)', c.notifiedBy || ''], ['Notified To (PM)', c.notifiedTo || ''],
      ['Contract Reference', c.contractReference || ''], ['Contract Form', c.contractForm || ''],
      ['Project Name', c.projectName || ''], ['Site Address', c.siteAddress || ''],
      ['Date First Identified', c.dateFirstIdentified || ''],
    ]), gap(),
    sectionHead(p, 'Risk Description'), ...proseSection(p, c.riskDescription), gap(),
    sectionHead(p, 'Evidence Summary'), ...proseSection(p, c.evidenceSummary), gap(),
    sectionHead(p, 'Potential Impact on Cost'),
    infoTableFromPairs(p, [
      ['Estimated Additional Cost', cost.estimatedAdditionalCost || ''],
      ['Assumptions', cost.assumptions || ''],
    ]), ...proseSection(p, cost.costBreakdown), gap(),
    sectionHead(p, 'Potential Impact on Programme'),
    infoTableFromPairs(p, [
      ['Estimated Delay', prog.estimatedDelay || ''],
      ['Critical Path Affected', prog.criticalPathAffected || ''],
      ['Key Dates Affected', prog.keyDatesAffected || ''],
    ]), ...proseSection(p, prog.programmeNarrative), gap(),
    sectionHead(p, 'Potential Impact on Quality / Performance'),
    ...proseSection(p, c.potentialImpactOnQuality), gap(),
    sectionHead(p, 'Proposed Mitigation Measures'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''],
      ['Proposed Date', rrm.proposedDate || ''],
      ['Proposed Attendees', rrm.proposedAttendees || ''],
    ]), gap(),
    ...(c.relatedNotices ? [sectionHead(p, 'Related Notices'), bodyPara(p, c.relatedNotices), gap()] : []),
    ...(c.additionalNotes ? [sectionHead(p, 'Additional Notes'), ...proseSection(p, c.additionalNotes), gap()] : []),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By (Contractor)', name: c.notifiedBy || '' },
      { role: 'Received By (PM)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT2PMContractor(p: Palette, c: any): Paragraph[] {
  const rrm = c.riskReductionMeeting || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Issued by Project Manager', `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'}`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Issued By (PM)', c.issuedBy || c.notifiedBy || ''],
      ['Issued To (Contractor)', c.issuedTo || c.notifiedTo || ''],
      ['Contract Reference', c.contractReference || ''],
      ['Project Name', c.projectName || ''],
    ]), gap(),
    sectionHead(p, 'Matter Giving Rise to Early Warning'),
    ...proseSection(p, c.riskDescription), gap(),
    sectionHead(p, "PM's Assessment of Potential Impact"),
    infoTableFromPairs(p, [
      ['Impact on Prices', c.impactOnPrices || ''],
      ['Impact on Completion Date', c.impactOnCompletionDate || ''],
      ['Impact on Quality / Performance', c.impactOnQuality || c.potentialImpactOnQuality || ''],
    ]), gap(),
    sectionHead(p, 'Actions Required of the Contractor'),
    ...(Array.isArray(c.actionsRequired) ? [new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          hdr(p, 'No.', Math.round(W * 0.06)),
          hdr(p, 'Required Action', Math.round(W * 0.64)),
          hdr(p, 'Due By', Math.round(W * 0.3)),
        ] }),
        ...c.actionsRequired.map((a: any, i: number) => new TableRow({ children: [
          dCell(p, String(i + 1), Math.round(W * 0.06), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', align: AlignmentType.CENTER }),
          dCell(p, a.action || '', Math.round(W * 0.64), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          dCell(p, a.dueBy || '', Math.round(W * 0.3), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
        ] })),
      ],
    })] : []), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''],
      ['Proposed Date', rrm.proposedDate || ''],
      ['Location', rrm.location || ''],
      ['Required Attendees', rrm.proposedAttendees || ''],
    ]), gap(),
    sectionHead(p, "Contractor's Response"),
    infoTableFromPairs(p, [
      ['Response Date', ''], ['Initial Assessment', ''],
      ['Meeting Attendance Confirmed', ''], ['Additional Information Required', ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Issued By (PM)', name: c.issuedBy || c.notifiedBy || '' },
      { role: 'Received By (Contractor)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT3SubToMC(p: Palette, c: any): Paragraph[] {
  const cost = c.potentialImpactOnCost || {};
  const prog = c.potentialImpactOnProgramme || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Subcontractor Notification', `${c.contractForm || 'NEC4 ECS'} — ${c.clauseReference || 'Clause 15.1'}`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By (Subcontractor)', c.notifiedBy || ''],
      ['Subcontractor Contact', c.subcontractorContact || ''],
      ['Notified To (Contractor)', c.notifiedTo || ''],
      ['Subcontract Reference', c.subcontractReference || ''],
      ['Main Contract Reference', c.contractReference || ''],
      ['Project / Site', c.projectName || ''],
    ]), gap(),
    sectionHead(p, 'Risk Description'), ...proseSection(p, c.riskDescription), gap(),
    sectionHead(p, 'Potential Impact'),
    infoTableFromPairs(p, [
      ['Cost Impact', cost.estimatedAdditionalCost || ''],
      ['Cost Detail', cost.assumptions || cost.costBreakdown || ''],
      ['Programme Impact', prog.estimatedDelay || ''],
      ['Programme Detail', prog.programmeNarrative || ''],
    ]), gap(),
    sectionHead(p, 'Proposed Mitigation'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By (Subcontractor)', name: c.notifiedBy || '' },
      { role: 'Received By (Contractor)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT4MCToSub(p: Palette, c: any): Paragraph[] {
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Issued to Subcontractor', `${c.contractForm || 'NEC4 ECS'} — ${c.clauseReference || 'Clause 15.1'}`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Issued By (Main Contractor)', c.issuedBy || c.notifiedBy || ''],
      ['Issued To (Subcontractor)', c.issuedTo || c.notifiedTo || ''],
      ['Subcontract Reference', c.subcontractReference || ''],
      ['Main Contract Reference', c.contractReference || ''],
      ['Project / Site', c.projectName || ''],
    ]), gap(),
    sectionHead(p, 'Matter Giving Rise to Early Warning'),
    ...proseSection(p, c.riskDescription), gap(),
    ...(c.contractualWarning ? [
      new Paragraph({
        spacing: { before: 120, after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: p.accent } },
        shading: { fill: p.primaryLight, type: ShadingType.CLEAR },
        indent: { left: 200 },
        children: [
          new TextRun({ text: 'CONTRACTUAL WARNING: ', bold: true, size: 18, font: p.font, color: p.accent }),
          new TextRun({ text: c.contractualWarning, size: 18, font: p.font, color: p.dark }),
        ],
      }), gap(),
    ] : []),
    ...(Array.isArray(c.outstandingItems) ? [
      sectionHead(p, 'Outstanding Documentation / Items'),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            hdr(p, 'No.', Math.round(W * 0.06)),
            hdr(p, 'Document / Item Required', Math.round(W * 0.44)),
            hdr(p, 'Period Covered', Math.round(W * 0.25)),
            hdr(p, 'Due By', Math.round(W * 0.25)),
          ] }),
          ...c.outstandingItems.map((item: any, i: number) => new TableRow({ children: [
            dCell(p, String(i + 1), Math.round(W * 0.06), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', align: AlignmentType.CENTER }),
            dCell(p, item.description || '', Math.round(W * 0.44), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, item.period || '', Math.round(W * 0.25), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, item.dueBy || '', Math.round(W * 0.25), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          ] })),
        ],
      }), gap(),
    ] : []),
    sectionHead(p, 'Expected Subcontractor Response'),
    infoTableFromPairs(p, [
      ['Response Required By', c.responseDeadline || ''],
      ['Acknowledgement of Notice', ''],
      ['Proposed Rectification Plan', ''],
      ['Root Cause of Non-Compliance', ''],
      ['Preventive Measures', ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Issued By (Main Contractor)', name: c.issuedBy || c.notifiedBy || '' },
      { role: 'Received By (Subcontractor)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT5ComprehensiveRisk(p: Palette, c: any): Paragraph[] {
  const cost = c.potentialImpactOnCost || {};
  const prog = c.potentialImpactOnProgramme || {};
  const risk = c.riskScoring || {};
  const rrm = c.riskReductionMeeting || {};
  const reg = c.riskRegisterEntry || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Comprehensive Risk Assessment', `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'} | Full Risk Matrix & Mitigation Plan`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By', c.notifiedBy || ''], ['Notified To', c.notifiedTo || ''],
      ['Contract / Project', `${c.contractReference || ''} | ${c.projectName || ''}`],
      ['Risk Category', c.riskCategory || ''],
      ['Priority', c.priority || ''],
    ]), gap(),
    sectionHead(p, 'Risk Description'), ...proseSection(p, c.riskDescription), gap(),
    sectionHead(p, 'Risk Scoring'),
    infoTableFromPairs(p, [
      ['Pre-Mitigation: Likelihood', String(risk.preLikelihood || '')],
      ['Pre-Mitigation: Impact', String(risk.preImpact || '')],
      ['Pre-Mitigation: Score', String((risk.preLikelihood || 0) * (risk.preImpact || 0))],
      ['Post-Mitigation: Likelihood', String(risk.postLikelihood || '')],
      ['Post-Mitigation: Impact', String(risk.postImpact || '')],
      ['Post-Mitigation: Score', String((risk.postLikelihood || 0) * (risk.postImpact || 0))],
    ]),
    gap(), h.riskMatrix5x5(W), gap(),
    sectionHead(p, 'Cost Impact Breakdown'),
    ...(Array.isArray(c.costBreakdownItems) ? [new Table({
      width: { size: W, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdr(p, 'Item', Math.round(W * 0.7)), hdr(p, 'Estimated Cost', W - Math.round(W * 0.7))] }),
        ...c.costBreakdownItems.map((item: any, i: number) => new TableRow({ children: [
          dCell(p, item.description || '', Math.round(W * 0.7), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          dCell(p, item.amount || '', W - Math.round(W * 0.7), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', bold: true }),
        ] })),
        ...(c.costBreakdownTotal ? [new TableRow({ children: [
          dCell(p, 'Estimated Total Impact', Math.round(W * 0.7), { bold: true, shade: p.primaryLight }),
          dCell(p, c.costBreakdownTotal, W - Math.round(W * 0.7), { bold: true, shade: p.primaryLight }),
        ] })] : []),
      ],
    })] : [...proseSection(p, cost.costBreakdown)]), gap(),
    sectionHead(p, 'Programme Impact'),
    infoTableFromPairs(p, [
      ['Estimated Delay', prog.estimatedDelay || ''],
      ['Critical Path Affected', prog.criticalPathAffected || ''],
      ['Key Dates Affected', prog.keyDatesAffected || ''],
    ]), ...proseSection(p, prog.programmeNarrative), gap(),
    sectionHead(p, 'Mitigation Plan'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Risk Register Entry'),
    infoTableFromPairs(p, [
      ['Risk Register ID', reg.riskId || ''], ['Risk Category', reg.category || c.riskCategory || ''],
      ['Risk Owner', reg.owner || ''], ['Date Entered', reg.dateEntered || c.noticeDate || ''],
      ['Review Frequency', reg.reviewFrequency || ''], ['Linked EWN', c.documentRef || ''],
      ['Linked CEs', reg.linkedCEs || c.relatedNotices || ''],
    ]), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''], ['Proposed Date', rrm.proposedDate || ''],
      ['Proposed Attendees', rrm.proposedAttendees || ''],
      ['Agenda Items', rrm.agenda || ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By', name: c.notifiedBy || '' },
      { role: 'Received By (PM)', name: '' },
      { role: 'Risk Register Updated By', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT6HealthSafety(p: Palette, c: any): Paragraph[] {
  const rrm = c.riskReductionMeeting || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Health & Safety Risk', `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'} | CDM Regulations 2015`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By', c.notifiedBy || ''], ['Notified To', c.notifiedTo || ''],
      ['Contract / Project', `${c.contractReference || ''} | ${c.projectName || ''}`],
      ['H&S Risk Category', c.hsRiskCategory || ''],
      ['CDM Duty Holder', c.cdmDutyHolder || ''],
    ]), gap(),
    sectionHead(p, 'H&S Risk Description'), ...proseSection(p, c.riskDescription), gap(),
    ...(Array.isArray(c.applicableRegulations) ? [
      sectionHead(p, 'Applicable Regulations & Standards'),
      ...c.applicableRegulations.map((r: string) => bodyPara(p, `■ ${r}`)), gap(),
    ] : []),
    ...(Array.isArray(c.hierarchyOfControl) ? [
      sectionHead(p, 'Hierarchy of Control'),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: c.hierarchyOfControl.map((ctrl: any) => new TableRow({ children: [
          dCell(p, ctrl.level || '', Math.round(W * 0.15), { bold: true, shade: p.primaryLight }),
          dCell(p, ctrl.measures || '', W - Math.round(W * 0.15)),
        ] })),
      }), gap(),
    ] : []),
    sectionHead(p, 'Potential Impact'),
    infoTableFromPairs(p, [
      ['Programme Delay', c.programmeDelay || (c.potentialImpactOnProgramme || {}).estimatedDelay || ''],
      ['Cost Impact', c.costImpact || (c.potentialImpactOnCost || {}).estimatedAdditionalCost || ''],
      ['RIDDOR Reportable?', c.riddorAssessment || ''],
      ['Pre-Construction Information', c.pciReference || ''],
    ]), gap(),
    ...(Array.isArray(c.immediateActions) ? [
      sectionHead(p, 'Immediate Actions Taken'),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            hdr(p, 'No.', Math.round(W * 0.06)), hdr(p, 'Action', Math.round(W * 0.54)),
            hdr(p, 'By', Math.round(W * 0.2)), hdr(p, 'Date', Math.round(W * 0.2)),
          ] }),
          ...c.immediateActions.map((a: any, i: number) => new TableRow({ children: [
            dCell(p, String(i + 1), Math.round(W * 0.06), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', align: AlignmentType.CENTER }),
            dCell(p, a.action || '', Math.round(W * 0.54), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, a.by || '', Math.round(W * 0.2), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, a.date || '', Math.round(W * 0.2), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          ] })),
        ],
      }), gap(),
    ] : []),
    sectionHead(p, 'Proposed Mitigation & Next Steps'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''], ['Proposed Date', rrm.proposedDate || ''],
      ['Required Attendees', rrm.proposedAttendees || ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By', name: c.notifiedBy || '' },
      { role: 'Received By (PM)', name: '' },
      { role: 'SHE Manager Notified', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT7DesignTechnical(p: Palette, c: any): Paragraph[] {
  const rrm = c.riskReductionMeeting || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Design & Technical Risk', `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'} | Design Discrepancy`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By', c.notifiedBy || ''], ['Notified To', c.notifiedTo || ''],
      ['Contract / Project', `${c.contractReference || ''} | ${c.projectName || ''}`],
      ['Design Discipline', c.designDiscipline || ''],
      ['Design Stage', c.designStage || ''],
    ]), gap(),
    sectionHead(p, 'Design Risk Description'), ...proseSection(p, c.riskDescription), gap(),
    ...(Array.isArray(c.affectedDrawings) ? [
      sectionHead(p, 'Affected Drawings & References'),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            hdr(p, 'Drawing Ref', Math.round(W * 0.2)), hdr(p, 'Title', Math.round(W * 0.35)),
            hdr(p, 'Rev', Math.round(W * 0.08)), hdr(p, 'Issue', Math.round(W * 0.37)),
          ] }),
          ...c.affectedDrawings.map((d: any, i: number) => new TableRow({ children: [
            dCell(p, d.reference || '', Math.round(W * 0.2), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, d.title || '', Math.round(W * 0.35), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, d.revision || '', Math.round(W * 0.08), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', align: AlignmentType.CENTER }),
            dCell(p, d.issue || '', Math.round(W * 0.37), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          ] })),
        ],
      }), gap(),
    ] : []),
    ...(Array.isArray(c.designConflicts) ? [
      sectionHead(p, 'Design Conflicts Identified'),
      ...c.designConflicts.map((conflict: string) => bodyPara(p, `⚠ ${conflict}`)), gap(),
    ] : []),
    ...(Array.isArray(c.linkedRFIs) ? [
      sectionHead(p, 'Related RFIs & TQs'),
      bodyPara(p, c.linkedRFIs.join(' | ')), gap(),
    ] : []),
    sectionHead(p, 'Potential Impact'),
    infoTableFromPairs(p, [
      ['Cost Impact', (c.potentialImpactOnCost || {}).estimatedAdditionalCost || c.costImpact || ''],
      ['Programme Impact', (c.potentialImpactOnProgramme || {}).estimatedDelay || c.programmeImpact || ''],
      ['Quality / Performance', c.potentialImpactOnQuality || c.qualityImpact || ''],
    ]), gap(),
    sectionHead(p, 'Proposed Resolution Actions'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''], ['Proposed Date', rrm.proposedDate || ''],
      ['Required Attendees', rrm.proposedAttendees || ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By', name: c.notifiedBy || '' },
      { role: 'Received By (PM)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

function buildT8WeatherForceMajeure(p: Palette, c: any): Paragraph[] {
  const rrm = c.riskReductionMeeting || {};
  const weather = c.weatherData || {};
  return [
    ...titleBlock(p, 'EARLY WARNING NOTICE', 'Weather Event / Force Majeure', `${c.contractForm || 'NEC4 ECC'} — ${c.clauseReference || 'Clause 15.1'} | Weather Measurement — Clause 60.1(13)`),
    sectionHead(p, 'Notice Details'),
    infoTableFromPairs(p, [
      ['Notice Reference', c.documentRef || ''], ['Notice Date', c.noticeDate || ''],
      ['Notified By', c.notifiedBy || ''], ['Notified To', c.notifiedTo || ''],
      ['Contract / Project', `${c.contractReference || ''} | ${c.projectName || ''}`],
      ['Weather Event Type', c.weatherEventType || ''],
      ['Event Period', c.eventPeriod || ''],
      ['Weather Station', c.weatherStation || ''],
    ]), gap(),
    sectionHead(p, 'Weather Event Description'), ...proseSection(p, c.riskDescription), gap(),
    sectionHead(p, 'Weather Data Summary'),
    infoTableFromPairs(p, [
      ['Total Measurement', weather.totalMeasurement || ''],
      ['10-Year Return Threshold', weather.tenYearThreshold || ''],
      ['Peak Daily', weather.peakDaily || ''],
      ['Days Lost', weather.daysLost || ''],
      ['Met Office Source', weather.metOfficeSource || c.weatherStation || ''],
    ]), gap(),
    ...(Array.isArray(c.dailyWeatherLog) ? [
      sectionHead(p, 'Daily Weather Impact Log'),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            hdr(p, 'Date', Math.round(W * 0.12)), hdr(p, 'Rainfall', Math.round(W * 0.12)),
            hdr(p, 'Wind', Math.round(W * 0.12)), hdr(p, 'Status', Math.round(W * 0.14)),
            hdr(p, 'Activities Affected', Math.round(W * 0.5)),
          ] }),
          ...c.dailyWeatherLog.map((d: any, i: number) => new TableRow({ children: [
            dCell(p, d.date || '', Math.round(W * 0.12), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, d.rainfall || '', Math.round(W * 0.12), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, d.wind || '', Math.round(W * 0.12), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
            dCell(p, d.status || '', Math.round(W * 0.14), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF', bold: true }),
            dCell(p, d.activitiesAffected || '', Math.round(W * 0.5), { shade: i % 2 === 0 ? p.rowAlt : 'FFFFFF' }),
          ] })),
        ],
      }), gap(),
    ] : []),
    ...(c.ceConsideration ? [
      sectionHead(p, 'Compensation Event Consideration'),
      new Paragraph({
        spacing: { before: 80, after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: p.accent } },
        shading: { fill: p.primaryLight, type: ShadingType.CLEAR },
        indent: { left: 200 },
        children: [new TextRun({ text: c.ceConsideration, size: 18, font: p.font, color: p.dark })],
      }), gap(),
    ] : []),
    sectionHead(p, 'Potential Impact'),
    infoTableFromPairs(p, [
      ['Programme Delay', (c.potentialImpactOnProgramme || {}).estimatedDelay || ''],
      ['Cost Impact', (c.potentialImpactOnCost || {}).estimatedAdditionalCost || ''],
      ['Critical Path', (c.potentialImpactOnProgramme || {}).criticalPathAffected || ''],
    ]), gap(),
    sectionHead(p, 'Proposed Mitigation'),
    ...(Array.isArray(c.proposedMitigation) ? [mitigationTable(p, c.proposedMitigation)] : []), gap(),
    sectionHead(p, 'Risk Reduction Meeting'),
    infoTableFromPairs(p, [
      ['Meeting Requested', rrm.requested || ''], ['Proposed Date', rrm.proposedDate || ''],
      ['Required Attendees', rrm.proposedAttendees || ''],
    ]), gap(),
    sectionHead(p, 'Acknowledgement'),
    approvalBlock(p, [
      { role: 'Notified By', name: c.notifiedBy || '' },
      { role: 'Received By (PM)', name: '' },
    ]), gap(),
    ebroraFooterLine(p),
  ];
}

// ── Router ───────────────────────────────────────────────────────
const BUILDERS: Record<EarlyWarningTemplateSlug, (p: Palette, c: any) => Paragraph[]> = {
  'nec4-contractor-pm':    buildT1ContractorPM,
  'nec4-pm-contractor':    buildT2PMContractor,
  'nec4-sub-to-mc':        buildT3SubToMC,
  'nec4-mc-to-sub':        buildT4MCToSub,
  'comprehensive-risk':    buildT5ComprehensiveRisk,
  'health-safety':         buildT6HealthSafety,
  'design-technical':      buildT7DesignTechnical,
  'weather-force-majeure': buildT8WeatherForceMajeure,
};

export async function buildEarlyWarningTemplateDocument(content: any, slug: EarlyWarningTemplateSlug): Promise<Document> {
  const p = PALETTES[slug] || PALETTES['nec4-contractor-pm'];
  const builder = BUILDERS[slug] || BUILDERS['nec4-contractor-pm'];
  const children = builder(p, content);

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader() },
      footers: { default: h.ebroraFooter() },
      children,
    }],
  });
}
