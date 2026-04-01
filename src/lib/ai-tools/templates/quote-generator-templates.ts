// =============================================================================
// Quotation Builder — Multi-Template Engine
// 4 templates, all consuming the same QuoteGenerator JSON.
//
// Templates:
//   T1 — Full Tender         (deep green, Arial, all sections, branded cover)
//   T2 — Formal Contract     (charcoal + burgundy, Cambria, clause-numbered)
//   T3 — Standard Quote      (steel blue, Calibri, core sections only)
//   T4 — Budget Estimate     (slate grey, Arial, minimal — BoQ + essentials)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { QuoteTemplateSlug } from '@/lib/quote/types';

// ── Layout ───────────────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH; // 9026 DXA
const cellPad = { top: 60, bottom: 60, left: 100, right: 100 };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// ── Palette ──────────────────────────────────────────────────────
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

const PALETTES: Record<QuoteTemplateSlug, Palette> = {
  'full-tender':      { primary: '065F46', primaryLight: 'E8F4F0', accent: '065F46', dark: '1A2E2A', mid: '6B7280', rowAlt: 'F2F2F2', font: 'Arial',   bodySize: 20 },
  'formal-contract':  { primary: '2D2D2D', primaryLight: 'F5F5F5', accent: '7F1D1D', dark: '333333', mid: '666666', rowAlt: 'F8F8F8', font: 'Cambria', bodySize: 19 },
  'standard-quote':   { primary: '1E40AF', primaryLight: 'EFF6FF', accent: '1E40AF', dark: '1E293B', mid: '64748B', rowAlt: 'F1F5F9', font: 'Calibri', bodySize: 20 },
  'budget-estimate':  { primary: '475569', primaryLight: 'F8FAFC', accent: '475569', dark: '334155', mid: '94A3B8', rowAlt: 'F8FAFC', font: 'Arial',   bodySize: 20 },
};

// ── Detail level controls which sections render ──────────────────
type DetailLevel = 'full' | 'detailed' | 'standard' | 'light';

const DETAIL_LEVELS: Record<QuoteTemplateSlug, DetailLevel> = {
  'full-tender': 'full',
  'formal-contract': 'detailed',
  'standard-quote': 'standard',
  'budget-estimate': 'light',
};

function showSection(slug: QuoteTemplateSlug, section: string): boolean {
  const level = DETAIL_LEVELS[slug];
  const always = ['tender-particulars', 'boq', 'price-summary', 'inclusions', 'exclusions'];
  const standard = [...always, 'scope', 'assumptions', 'programme', 'commercial-terms'];
  const detailed = [...standard, 'milestones', 'daywork', 'provisional-sums'];
  const full = [...detailed, 'hse', 'qualifications', 'company-profile', 'signature', 'quotation-summary'];

  if (level === 'full') return full.includes(section);
  if (level === 'detailed') return detailed.includes(section);
  if (level === 'standard') return standard.includes(section);
  return always.includes(section) || section === 'programme-light' || section === 'assumptions';
}

// ── Shared helpers ───────────────────────────────────────────────
function hdrCell(p: Palette, text: string, width: number): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: p.primary, type: ShadingType.CLEAR },
    margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: p.font, size: p.bodySize })] })],
  });
}

function dCell(p: Palette, text: string, width: number, opts: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: !!opts.bold, font: p.font, size: p.bodySize, color: p.dark })] })],
  });
}

function altRow(p: Palette, cells: [string, number, { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }?][], idx: number): TableRow {
  const shade = idx % 2 === 0 ? p.rowAlt : 'FFFFFF';
  return new TableRow({
    children: cells.map(([text, width, opts]) => dCell(p, text, width, { shade, ...opts })),
  });
}

function bodyPara(p: Palette, text: string): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: p.font, size: p.bodySize, color: p.dark })] });
}

function gap(size = 200): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ── Section headings — vary per template ─────────────────────────
function sectionHead(slug: QuoteTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'full-tender') {
    // Green underline rule
    return new Paragraph({
      spacing: { before: 360, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } },
      children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })],
    });
  }
  if (slug === 'formal-contract') {
    // Burgundy clause number + charcoal title
    return new Paragraph({
      spacing: { before: 400, after: 140 },
      children: [
        new TextRun({ text: `${num}.  `, bold: true, font: p.font, size: 24, color: p.accent }),
        new TextRun({ text: title.toUpperCase(), bold: true, font: p.font, size: 24, color: p.primary }),
      ],
    });
  }
  if (slug === 'standard-quote') {
    // Full-width blue band
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [W],
      rows: [new TableRow({
        children: [new TableCell({
          borders: noBorders,
          width: { size: W, type: WidthType.DXA },
          shading: { fill: p.primary, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({
            children: [
              new TextRun({ text: `${numStr}   `, bold: true, font: p.font, size: 22, color: 'FFFFFF' }),
              new TextRun({ text: title.toUpperCase(), bold: true, font: p.font, size: 22, color: 'FFFFFF' }),
            ],
          })],
        })],
      })],
    });
  }
  // budget-estimate — minimal left-border
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: p.primary, space: 6 } },
    indent: { left: 80 },
    children: [new TextRun({ text: `${title}`, bold: true, font: p.font, size: 22, color: p.dark })],
  });
}

// ── Info table (key-value pairs) ─────────────────────────────────
function buildInfoTable(p: Palette, rows: [string, string][]): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800],
    rows: rows.map(([label, value], i) =>
      altRow(p, [[label, 2800, { bold: true }], [value, W - 2800]], i),
    ),
  });
}

// ── Data table with headers ──────────────────────────────────────
function buildDataTable(p: Palette, headers: [string, number][], data: string[][]): Table {
  const colWidths = headers.map(([, w]) => w);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map(([label, w]) => hdrCell(p, label, w)) }),
      ...data.map((row, i) =>
        altRow(p, row.map((text, ci) => [text, colWidths[ci]] as [string, number]), i),
      ),
    ],
  });
}

// ── Bullet list ──────────────────────────────────────────────────
function buildBulletList(p: Palette, items: string[]): Paragraph[] {
  return (items || []).map((item) =>
    new Paragraph({
      spacing: { after: 60 }, indent: { left: 280 },
      children: [
        new TextRun({ text: '•  ', font: p.font, size: p.bodySize, color: p.accent }),
        new TextRun({ text: item, font: p.font, size: p.bodySize, color: p.dark }),
      ],
    }),
  );
}

// ── Cover pages ──────────────────────────────────────────────────
function buildCover(slug: QuoteTemplateSlug, p: Palette, d: any): (Paragraph | Table)[] {
  if (slug === 'full-tender') {
    return [
      gap(200),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W],
        rows: [new TableRow({
          children: [new TableCell({
            borders: noBorders,
            width: { size: W, type: WidthType.DXA },
            shading: { fill: p.primary, type: ShadingType.CLEAR },
            margins: { top: 500, bottom: 500, left: 300, right: 300 },
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'SUBCONTRACTOR QUOTATION', bold: true, font: p.font, size: 52, color: 'FFFFFF' })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: d.projectName || '', font: p.font, size: 28, color: 'A7F3D0' })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d.projectAddress || '', font: p.font, size: 22, color: 'D1FAE5' })] }),
              new Paragraph({ children: [new TextRun({ text: `Ref: ${d.documentRef || ''}  |  ${d.quotationDate || ''}`, font: p.font, size: 20, color: 'D1FAE5' })] }),
            ],
          })],
        })],
      }),
      gap(120),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: 'COMMERCIAL IN CONFIDENCE', bold: true, font: p.font, size: 18, color: p.accent })],
      }),
      gap(300),
    ];
  }

  if (slug === 'formal-contract') {
    return [
      gap(600),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: 'SUBCONTRACTOR QUOTATION', bold: true, font: p.font, size: 56, color: p.primary })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 8 } },
        children: [new TextRun({ text: d.projectName || '', font: p.font, size: 28, color: p.dark })],
      }),
      gap(80),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: `Reference: ${d.documentRef || ''}`, font: p.font, size: 20, color: p.mid })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: `Date: ${d.quotationDate || ''}  |  Valid Until: ${d.validUntil || ''}`, font: p.font, size: 20, color: p.mid })],
      }),
      gap(300),
    ];
  }

  if (slug === 'standard-quote') {
    return [
      gap(400),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W],
        rows: [new TableRow({
          children: [new TableCell({
            borders: noBorders,
            width: { size: W, type: WidthType.DXA },
            shading: { fill: p.primary, type: ShadingType.CLEAR },
            margins: { top: 400, bottom: 400, left: 300, right: 300 },
            children: [
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'QUOTATION', bold: true, font: p.font, size: 48, color: 'FFFFFF' })] }),
              new Paragraph({ children: [new TextRun({ text: `${d.projectName || ''} — ${d.mainContractor || ''}`, font: p.font, size: 22, color: 'BFDBFE' })] }),
            ],
          })],
        })],
      }),
      gap(300),
    ];
  }

  // budget-estimate — no cover page, just a header
  return [];
}

// ── Header / Footer ──────────────────────────────────────────────
function makeHeader(slug: QuoteTemplateSlug, p: Palette, d: any): Header {
  const label = slug === 'budget-estimate' ? 'BUDGET ESTIMATE' : 'QUOTATION';
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } },
      children: [
        new TextRun({ text: label, bold: true, font: p.font, size: 17, color: p.primary }),
        new TextRun({ text: `\t${d.documentRef || ''}  |  ${d.quotationDate || ''}`, font: p.font, size: 16, color: p.mid }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })],
  });
}

function makeFooter(p: Palette, d: any): Footer {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } },
      children: [
        new TextRun({ text: `Commercial in Confidence`, font: p.font, size: 16, color: p.mid }),
        new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }),
        new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })],
  });
}

// =================================================================
// MAIN BUILD FUNCTION
// =================================================================
export async function buildQuoteTemplateDocument(
  content: any,
  templateSlug: QuoteTemplateSlug,
): Promise<Document> {
  const p = PALETTES[templateSlug];
  const d = content;
  let sec = 0;
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──────────────────────────────────────────────────
  const cover = buildCover(templateSlug, p, d);
  if (cover.length > 0) {
    children.push(...cover);
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ── Tender Particulars ─────────────────────────────────────
  children.push(sectionHead(templateSlug, p, ++sec, 'Tender Particulars'));
  children.push(buildInfoTable(p, [
    ['Quotation Reference', d.documentRef || ''],
    ['Date', d.quotationDate || ''],
    ['Valid Until', d.validUntil || ''],
    ['Project Name', d.projectName || ''],
    ['Project Address', d.projectAddress || ''],
    ['Client', d.client || ''],
    ['Main Contractor', d.mainContractor || ''],
    ['Tender Reference', d.tenderReference || ''],
    ['Tender Return Date', d.tenderReturnDate || ''],
    ['Prepared By', d.preparedBy || ''],
  ]));
  children.push(gap());

  // ── Quotation Summary (full + detailed only) ───────────────
  if (showSection(templateSlug, 'quotation-summary') && d.quotationSummary) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Quotation Summary'));
    // Split into paragraphs
    const paras = (d.quotationSummary as string).split(/\n\n?/).filter(Boolean);
    for (const para of paras) {
      children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // ── Scope of Works (full + detailed + standard) ────────────
  if (showSection(templateSlug, 'scope') && d.scopeOfWorks) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Scope of Works'));
    const paras = (d.scopeOfWorks as string).split(/\n\n?/).filter(Boolean);
    for (const para of paras) {
      children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // ── Bill of Quantities ─────────────────────────────────────
  children.push(sectionHead(templateSlug, p, ++sec, 'Bill of Quantities'));
  const boqItems = d.billOfQuantities || [];
  if (boqItems.length > 0) {
    const refW = Math.floor(W * 0.07);
    const descW = Math.floor(W * 0.38);
    const unitW = Math.floor(W * 0.08);
    const qtyW = Math.floor(W * 0.10);
    const rateW = Math.floor(W * 0.16);
    const amtW = W - refW - descW - unitW - qtyW - rateW;

    children.push(buildDataTable(p,
      [['Ref', refW], ['Description', descW], ['Unit', unitW], ['Qty', qtyW], ['Rate (£)', rateW], ['Amount (£)', amtW]],
      boqItems.map((item: any) => [
        item.ref || '',
        item.description || '',
        item.unit || '',
        String(item.quantity ?? ''),
        item.rate || '',
        item.amount || '',
      ]),
    ));
  }
  children.push(gap());

  // ── Price Summary ──────────────────────────────────────────
  children.push(sectionHead(templateSlug, p, ++sec, 'Price Summary'));
  const ps = d.priceSummary || {};
  children.push(buildInfoTable(p, [
    ['Original Contract Sum', ps.originalContractSum || ''],
    ['Provisional Sums', ps.provisionalSums || ''],
    ['Daywork Allowance', ps.dayworkAllowance || ''],
    ['TOTAL TENDER SUM', ps.totalTenderSum || ''],
  ]));
  children.push(gap());

  // ── Provisional Sums (full + detailed) ─────────────────────
  if (showSection(templateSlug, 'provisional-sums') && d.provisionalSums?.length) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Provisional Sums'));
    const psDescW = Math.floor(W * 0.50);
    const psAmtW = Math.floor(W * 0.22);
    const psBasisW = W - psDescW - psAmtW;
    children.push(buildDataTable(p,
      [['Description', psDescW], ['Amount (£)', psAmtW], ['Basis', psBasisW]],
      d.provisionalSums.map((item: any) => [item.description || '', item.amount || '', item.basis || '']),
    ));
    children.push(gap());
  }

  // ── Daywork Allowance (full + detailed) ────────────────────
  if (showSection(templateSlug, 'daywork') && d.dayworkAllowance?.included) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Daywork Allowance'));
    children.push(buildInfoTable(p, [
      ['Labour Rate', d.dayworkAllowance.labourRate || ''],
      ['Plant Rates', d.dayworkAllowance.plantRates || ''],
      ['Materials Markup', d.dayworkAllowance.materialsMarkup || ''],
      ['Basis of Rates', d.dayworkAllowance.basisOfRates || ''],
    ]));
    children.push(gap());
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Inclusions ─────────────────────────────────────────────
  children.push(sectionHead(templateSlug, p, ++sec, 'Inclusions'));
  children.push(...buildBulletList(p, d.inclusions || []));
  children.push(gap());

  // ── Exclusions ─────────────────────────────────────────────
  children.push(sectionHead(templateSlug, p, ++sec, 'Exclusions'));
  children.push(...buildBulletList(p, d.exclusions || []));
  children.push(gap());

  // ── Assumptions ────────────────────────────────────────────
  if (showSection(templateSlug, 'assumptions')) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Assumptions & Qualifications'));
    children.push(...buildBulletList(p, d.assumptions || []));
    children.push(gap());
  }

  // ── Programme (standard+) ──────────────────────────────────
  if (showSection(templateSlug, 'programme') && d.programme) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Programme'));
    children.push(buildInfoTable(p, [
      ['Proposed Start Date', d.programme.proposedStartDate || ''],
      ['Duration', d.programme.duration || ''],
      ['Completion Date', d.programme.completionDate || ''],
    ]));
    children.push(gap(80));
    if (d.programme.programmeNarrative) {
      const paras = (d.programme.programmeNarrative as string).split(/\n\n?/).filter(Boolean);
      for (const para of paras) {
        children.push(bodyPara(p, para));
      }
    }
    // Milestones (full + detailed)
    if (showSection(templateSlug, 'milestones') && d.programme.keyMilestones?.length) {
      children.push(gap(80));
      const msW1 = Math.floor(W * 0.70);
      const msW2 = W - msW1;
      children.push(buildDataTable(p,
        [['Milestone', msW1], ['Target Date', msW2]],
        d.programme.keyMilestones.map((m: any) => [m.milestone || '', m.targetDate || '']),
      ));
    }
    children.push(gap());
  }

  // Budget estimate gets a lightweight programme
  if (showSection(templateSlug, 'programme-light') && d.programme) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Programme'));
    children.push(buildInfoTable(p, [
      ['Proposed Start', d.programme.proposedStartDate || ''],
      ['Duration', d.programme.duration || ''],
      ['Completion', d.programme.completionDate || ''],
    ]));
    children.push(gap());
  }

  // ── Commercial Terms (standard+) ──────────────────────────
  if (showSection(templateSlug, 'commercial-terms') && d.commercialTerms) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Commercial Terms'));
    children.push(buildInfoTable(p, [
      ['Payment Terms', d.commercialTerms.paymentTerms || ''],
      ['Retention Rate', d.commercialTerms.retentionRate || ''],
      ['Defects Liability Period', d.commercialTerms.defectsLiabilityPeriod || ''],
      ['Retention Release', d.commercialTerms.retentionRelease || ''],
      ['Insurance Requirements', d.commercialTerms.insuranceRequirements || ''],
      ['Contractual Basis', d.commercialTerms.contractualBasis || ''],
    ]));
    children.push(gap());
  }

  // ── HSE (full only) ────────────────────────────────────────
  if (showSection(templateSlug, 'hse') && d.healthSafetyEnvironmental) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHead(templateSlug, p, ++sec, 'Health, Safety & Environmental'));
    const paras = (d.healthSafetyEnvironmental as string).split(/\n\n?/).filter(Boolean);
    for (const para of paras) {
      children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // ── Qualifications (full only) ─────────────────────────────
  if (showSection(templateSlug, 'qualifications') && d.qualifications) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Qualifications & Alternative Proposals'));
    const paras = (d.qualifications as string).split(/\n\n?/).filter(Boolean);
    for (const para of paras) {
      children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // ── Company Profile (full only) ────────────────────────────
  if (showSection(templateSlug, 'company-profile') && d.organisationProfile) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Company Profile'));
    const paras = (d.organisationProfile as string).split(/\n\n?/).filter(Boolean);
    for (const para of paras) {
      children.push(bodyPara(p, para));
    }
    children.push(gap());
  }

  // ── Signature (full + detailed) ────────────────────────────
  if (showSection(templateSlug, 'signature')) {
    children.push(gap(200));
    const sigColW = [2200, 3200, 1800, W - 7200];
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: sigColW,
      rows: [
        new TableRow({ children: [hdrCell(p, 'Role', sigColW[0]), hdrCell(p, 'Name', sigColW[1]), hdrCell(p, 'Signature', sigColW[2]), hdrCell(p, 'Date', sigColW[3])] }),
        altRow(p, [['Authorised Signatory', sigColW[0], { bold: true }], [d.preparedBy || '', sigColW[1]], ['', sigColW[2]], ['', sigColW[3]]], 0),
        altRow(p, [['Accepted By', sigColW[0], { bold: true }], ['', sigColW[1]], ['', sigColW[2]], ['', sigColW[3]]], 1),
      ],
    }));
  }

  // ── End of document ────────────────────────────────────────
  children.push(gap(300));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '— End of Quotation —', italics: true, font: p.font, size: p.bodySize, color: p.mid })],
  }));
  children.push(gap(80));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', font: p.font, size: 18, color: p.accent })],
  }));

  // ── Assemble ───────────────────────────────────────────────
  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } },
    sections: [{
      properties: {
        page: {
          size: { width: h.A4_WIDTH, height: h.A4_HEIGHT },
          margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL },
        },
      },
      headers: { default: makeHeader(templateSlug, p, d) },
      footers: { default: makeFooter(p, d) },
      children,
    }],
  });
}
