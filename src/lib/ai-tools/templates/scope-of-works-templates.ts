// =============================================================================
// Scope of Works Builder — Multi-Template Engine
// 3 templates, all consuming the same ScopeOfWorksData JSON.
//
// Templates:
//   T1 — Corporate Blue   (blue headers, Arial, banded tables)
//   T2 — Formal Contract   (charcoal + red clauses, Cambria, clause numbering)
//   T3 — Executive Navy    (navy cover, teal bars, Calibri, contemporary)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  Header, Footer, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ScopeTemplateSlug, ScopeOfWorksData } from '@/lib/scope/types';

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

const PALETTES: Record<ScopeTemplateSlug, Palette> = {
  'corporate-blue': { primary: '1F4E79', primaryLight: 'D6E4F0', accent: '1F4E79', dark: '404040', mid: '808080', rowAlt: 'F2F2F2', font: 'Arial', bodySize: 20 },
  'formal-contract': { primary: '2D2D2D', primaryLight: 'F5F5F5', accent: 'C0392B', dark: '333333', mid: '666666', rowAlt: 'F5F5F5', font: 'Cambria', bodySize: 19 },
  'executive-navy': { primary: '1B2A4A', primaryLight: 'E0F2F1', accent: '00897B', dark: '2C2C2C', mid: '777777', rowAlt: 'F8F7F5', font: 'Calibri', bodySize: 20 },
};

// ── Shared Helpers ───────────────────────────────────────────────
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

// ── Section heading — varies per template ────────────────────────
let clauseCounter = 0;

function sectionHead(slug: ScopeTemplateSlug, p: Palette, num: number, title: string): Paragraph | Table {
  if (slug === 'corporate-blue') {
    return new Paragraph({
      spacing: { before: 360, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.primary, space: 4 } },
      children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, font: p.font, size: 24, color: p.primary })],
    });
  }
  if (slug === 'formal-contract') {
    return new Paragraph({
      spacing: { before: 400, after: 140 },
      children: [
        new TextRun({ text: `${num}.  `, bold: true, font: p.font, size: 24, color: p.accent }),
        new TextRun({ text: title.toUpperCase(), bold: true, font: p.font, size: 24, color: p.primary }),
      ],
    });
  }
  // executive-navy — full-width teal bar
  const numStr = num < 10 ? `0${num}` : `${num}`;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
        width: { size: W, type: WidthType.DXA },
        shading: { fill: p.accent, type: ShadingType.CLEAR },
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

function subPoint(p: Palette, num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 }, indent: { left: 280 },
    children: [
      new TextRun({ text: `${num}  `, bold: true, font: p.font, size: p.bodySize, color: p.mid }),
      new TextRun({ text, font: p.font, size: p.bodySize, color: p.dark }),
    ],
  });
}

// ── Build document control table ─────────────────────────────────
function buildDocControl(p: Palette, d: ScopeOfWorksData): Table {
  const rows = [
    ['Document Reference', d.documentRef],
    ['Revision', d.revision],
    ['Issue Date', d.issueDate],
    ['Project Name', d.projectName],
    ['Site Address', d.siteAddress],
    ['Client', d.client],
    ['Principal Contractor', d.principalContractor],
    ['Subcontractor', d.subcontractor],
    ['Discipline', d.discipline],
    ['Contract Form', d.contractForm],
  ];
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [2800, W - 2800],
    rows: [
      new TableRow({ children: [hdrCell(p, 'Field', 2800), hdrCell(p, 'Detail', W - 2800)] }),
      ...rows.map(([l, v], i) => altRow(p, [[l, 2800, { bold: true }], [v, W - 2800]], i)),
    ],
  });
}

function buildApprovalTable(p: Palette, d: ScopeOfWorksData): Table {
  const colW = [2200, 2600, 2200, W - 7000];
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: colW,
    rows: [
      new TableRow({ children: [hdrCell(p, 'Role', colW[0]), hdrCell(p, 'Name', colW[1]), hdrCell(p, 'Signature', colW[2]), hdrCell(p, 'Date', colW[3])] }),
      altRow(p, [['Prepared By', colW[0], { bold: true }], [d.preparedBy, colW[1]], ['', colW[2]], [d.issueDate, colW[3]]], 0),
      altRow(p, [['Reviewed By', colW[0], { bold: true }], ['', colW[1]], ['', colW[2]], ['', colW[3]]], 1),
      altRow(p, [['Accepted By (Sub)', colW[0], { bold: true }], ['', colW[1]], ['', colW[2]], ['', colW[3]]], 2),
      altRow(p, [['Accepted By (PC)', colW[0], { bold: true }], ['', colW[1]], ['', colW[2]], ['', colW[3]]], 3),
    ],
  });
}

// ── Build standard 3-col data table ──────────────────────────────
function build3ColTable(p: Palette, headers: [string, number][], data: string[][]): Table {
  const colWidths = headers.map(([, w]) => w);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map(([label, w]) => hdrCell(p, label, w)) }),
      ...data.map((row, i) => altRow(p, row.map((text, ci) => [text, colWidths[ci], ci === 0 ? { align: AlignmentType.CENTER } : ci === 1 ? { bold: true } : {}] as [string, number, { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }?]), i)),
    ],
  });
}

function build2ColTable(p: Palette, headers: [string, number][], data: [string, string][]): Table {
  const colWidths = headers.map(([, w]) => w);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map(([label, w]) => hdrCell(p, label, w)) }),
      ...data.map(([l, v], i) => altRow(p, [[l, colWidths[0], { bold: true }], [v, colWidths[1]]], i)),
    ],
  });
}

// ── Commercial Boilerplate Builders ──────────────────────────────
function buildPaymentSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Payment Mechanism'),
    bodyPara(p, `Payment shall be made on a ${d.paymentCycle.toLowerCase()} cycle in accordance with the subcontract payment provisions. ${d.subcontractor} shall submit an application for payment by the ${d.applicationDate}, detailing the value of work completed against the ${d.paymentBasis.toLowerCase().includes('activity') ? 'activity schedule' : 'agreed valuation basis'}.`),
    bodyPara(p, `The principal contractor shall issue a payment certificate within 7 days of the assessment date. Payment shall be made within ${d.paymentDays} days of the assessment date. A pay-less notice, if applicable, shall be issued no later than 7 days before the final date for payment, in accordance with the Housing Grants, Construction and Regeneration Act 1996 (as amended by the Local Democracy, Economic Development and Construction Act 2009).`),
    bodyPara(p, `Retention shall be held at ${d.retentionPercent}% of the gross valuation, reduced to ${d.retentionAtPC}% at practical completion. The remaining retention shall be released at the expiry of the defects correction period, subject to satisfactory completion of all defects.`),
  ];
}

function buildDayworkSection(p: Palette, slug: ScopeTemplateSlug, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Daywork & Provisional Sums'),
    bodyPara(p, 'Any works instructed outside the defined scope shall be valued in accordance with the agreed schedule of daywork rates, appended to the subcontract. Daywork rates shall include for all overheads, profit, supervision, and small tools.'),
    bodyPara(p, 'No daywork shall be undertaken without a written daywork instruction from the principal contractor. Daywork sheets must be submitted for signature within 48 hours of the work being carried out. Failure to obtain signature within 7 days shall result in the daywork being deemed unverified.'),
    bodyPara(p, 'Provisional sums, where included, shall be expended only on the written instruction of the principal contractor and valued at the actual cost of the works plus the agreed percentage for overheads and profit.'),
  ];
}

function buildVariationSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  const isNEC = d.contractForm.toLowerCase().includes('nec');
  return [
    sectionHead(slug, p, secNum, 'Variation Procedure'),
    bodyPara(p, `All variations shall be managed in accordance with the ${isNEC ? 'NEC4 ECS compensation event procedure' : 'contract variation provisions'}. ${d.subcontractor} shall not carry out any varied work without a written instruction from the principal contractor.`),
    bodyPara(p, `Upon receipt of a variation instruction, ${d.subcontractor} shall submit a quotation within 3 weeks, including the effect on the prices and any impact on the programme. Quotations must be supported by a detailed breakdown of labour, materials, plant, and subcontractor costs.`),
  ];
}

function buildDelaySection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Delay & Liquidated Damages'),
    bodyPara(p, `${d.subcontractor} shall complete the works by the completion date stated in the accepted programme. Time is of the essence.`),
    bodyPara(p, `Liquidated damages for delay shall apply at the rate of ${d.ladRate.toLowerCase()}. The principal contractor reserves the right to recover liquidated damages from the subcontractor where delay is attributable to the subcontractor's default, including failure to adequately resource the works.`),
  ];
}

function buildTerminationSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Termination'),
    bodyPara(p, `Either party may terminate the subcontract in accordance with the termination provisions of the contract. Grounds for termination by the principal contractor include insolvency, persistent breach, failure to comply with health and safety obligations, and substantial failure to meet programme milestones.`),
    bodyPara(p, `Upon termination, ${d.subcontractor} shall secure the works, remove all plant and temporary works, and provide a full account of work completed and materials on site. The principal contractor shall be entitled to recover any additional costs incurred in completing the works.`),
  ];
}

function buildDisputeSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Dispute Resolution'),
    bodyPara(p, `Any dispute arising out of or in connection with this subcontract shall be referred to adjudication in accordance with the Housing Grants, Construction and Regeneration Act 1996, with the nominating body being the ${d.disputeNominatingBody}.`),
    bodyPara(p, `The parties shall endeavour to resolve disputes by negotiation and, where appropriate, mediation prior to referral to adjudication. The subcontract shall be governed by the laws of ${d.governingLaw}, and the courts of ${d.governingLaw} shall have exclusive jurisdiction.`),
  ];
}

function buildContraChargeSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Contra-Charges & Set-Off'),
    bodyPara(p, `The principal contractor reserves the right to contra-charge ${d.subcontractor} for costs arising from defective work, non-compliance with site rules, failure to maintain adequate welfare or safety standards, or failure to adequately resource the works.`),
    bodyPara(p, `Written notice of the intention to contra-charge shall be given no less than 7 days prior to any deduction, detailing the nature of the default and the costs incurred. ${d.subcontractor} shall have the right to respond in writing within 5 working days of receipt of notice.`),
  ];
}

function buildWarrantiesBondsSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Collateral Warranties & Bonds'),
    bodyPara(p, `${d.subcontractor} shall, if required by the principal contractor, execute collateral warranties in favour of the client, any funder, and any future tenant or purchaser, in the form appended to the subcontract.`),
    bodyPara(p, `A performance bond of ${d.bondPercent}% of the subcontract value shall be provided by ${d.subcontractor} from a surety approved by the principal contractor, to be delivered within ${d.bondDeliveryDays} days of subcontract award. A parent company guarantee may be accepted at the principal contractor's discretion.`),
  ];
}

function buildCISSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'CIS & Tax'),
    bodyPara(p, `${d.subcontractor} confirms that it is registered under the Construction Industry Scheme (CIS) and holds ${d.cisStatus}. Evidence of CIS registration must be provided prior to the first payment application. All payments shall be subject to CIS deductions where applicable.`),
    bodyPara(p, `${d.subcontractor} is solely responsible for the tax affairs of its employees and any self-employed operatives engaged on the works, including PAYE, National Insurance, and VAT. VAT shall be applied at the prevailing rate on all invoices.`),
  ];
}

function buildInsuranceSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Insurance'),
    build2ColTable(p,
      [['Insurance Type', 4500], ['Minimum Cover', W - 4500]],
      d.insurance.map((ins) => [ins.type, ins.minimumCover] as [string, string]),
    ),
    bodyPara(p, `Insurance certificates must be provided to the principal contractor prior to commencement and renewed annually. ${d.subcontractor} shall notify the principal contractor immediately of any material change to its insurance arrangements.`),
  ];
}

function buildBackToBackSection(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Back-to-Back Obligations'),
    bodyPara(p, `${d.subcontractor} acknowledges that the obligations under this subcontract flow down from the main contract between the principal contractor and the client. The subcontractor's obligations, including programme, quality, safety, and defects liability, shall be back-to-back with the main contract to the extent applicable.`),
    bodyPara(p, `The defects correction period of ${d.defectsPeriod} is aligned with the main contract. ${d.subcontractor} shall remain liable for latent defects for a period of ${d.latentDefectsYears} years (or ${d.latentDefectsYears * 2} years where the subcontract is executed as a deed) from practical completion.`),
  ];
}

function buildCommercialSummary(p: Palette, slug: ScopeTemplateSlug, d: ScopeOfWorksData, secNum: number): (Paragraph | Table)[] {
  return [
    sectionHead(slug, p, secNum, 'Commercial Terms Summary'),
    build2ColTable(p,
      [['Item', 3500], ['Detail', W - 3500]],
      [
        ['Payment Basis', d.paymentBasis],
        ['Retention', `${d.retentionPercent}% reducing to ${d.retentionAtPC}% at practical completion`],
        ['Defects Correction Period', d.defectsPeriod],
        ['Liquidated Damages', d.ladRate],
        ['Performance Bond', `${d.bondPercent}% of subcontract value`],
        ['Governing Law', `Laws of ${d.governingLaw}`],
      ],
    ),
  ];
}

// ── Header / Footer per template ─────────────────────────────────
function makeHeader(p: Palette, d: ScopeOfWorksData): Header {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } },
      children: [
        new TextRun({ text: 'SCOPE OF WORKS', bold: true, font: p.font, size: 17, color: p.primary }),
        new TextRun({ text: `\t${d.documentRef}  |  Rev ${d.revision}`, font: p.font, size: 16, color: p.mid }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })],
  });
}

function makeFooter(p: Palette, d: ScopeOfWorksData): Footer {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.accent, space: 4 } },
      children: [
        new TextRun({ text: `Confidential — ${d.subcontractor}`, font: p.font, size: 16, color: p.mid }),
        new TextRun({ text: '\tPage ', font: p.font, size: 16, color: p.mid }),
        new TextRun({ children: [PageNumber.CURRENT], font: p.font, size: 16, color: p.mid }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })],
  });
}

// ── Cover page — varies per template ─────────────────────────────
function buildCover(slug: ScopeTemplateSlug, p: Palette, d: ScopeOfWorksData): (Paragraph | Table)[] {
  if (slug === 'executive-navy') {
    return [
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W],
        rows: [new TableRow({
          children: [new TableCell({
            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
            width: { size: W, type: WidthType.DXA },
            shading: { fill: p.primary, type: ShadingType.CLEAR },
            margins: { top: 250, bottom: 250, left: 300, right: 300 },
            children: [
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'SCOPE OF WORKS', bold: true, font: p.font, size: 52, color: 'FFFFFF' })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: d.discipline, font: p.font, size: 28, color: '80CBC4' })] }),
              new Paragraph({ children: [new TextRun({ text: `${d.projectName} — ${d.siteAddress}`, font: p.font, size: 22, color: 'B0BEC5' })] }),
            ],
          })],
        })],
      }),
      gap(150),
    ];
  }

  const titleSize = slug === 'formal-contract' ? 56 : 52;
  return [
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'SCOPE OF WORKS', bold: true, font: p.font, size: titleSize, color: p.primary })],
    }),
    new Paragraph({
      spacing: { after: 150 },
      border: { bottom: { style: BorderStyle.SINGLE, size: slug === 'formal-contract' ? 4 : 8, color: p.accent, space: 8 } },
      children: [new TextRun({ text: `${d.discipline} — ${d.projectName}`, font: p.font, size: 28, color: p.dark })],
    }),
    gap(80),
  ];
}

// =================================================================
// MAIN BUILD FUNCTION
// =================================================================
export async function buildScopeTemplateDocument(
  content: ScopeOfWorksData,
  templateSlug: ScopeTemplateSlug,
): Promise<Document> {
  const p = PALETTES[templateSlug];
  const d = content;
  let sec = 0; // section counter

  // ── Build all content children ──────────────────────────────
  const children: (Paragraph | Table)[] = [];

  // Cover + doc control
  children.push(...buildCover(templateSlug, p, d));
  children.push(buildDocControl(p, d));
  children.push(gap());
  children.push(buildApprovalTable(p, d));
  children.push(gap());

  // 1. Scope Overview
  children.push(sectionHead(templateSlug, p, ++sec, 'Scope Overview'));
  children.push(bodyPara(p, d.scopeOverview));

  // 2. Contract Basis
  children.push(sectionHead(templateSlug, p, ++sec, 'Contract Basis'));
  children.push(bodyPara(p, d.contractBasisNotes));
  if (d.contractDocuments?.length) {
    children.push(bodyPara(p, `This scope is to be read in conjunction with: ${d.contractDocuments.join('; ')}.`));
  }

  // 3. Inclusions
  children.push(sectionHead(templateSlug, p, ++sec, 'Inclusions'));
  children.push(build3ColTable(p,
    [['No.', 600], ['Item', 2000], ['Detail', W - 2600]],
    d.inclusions.map((inc) => [inc.no, inc.item, inc.detail]),
  ));

  // 4. Exclusions
  children.push(sectionHead(templateSlug, p, ++sec, 'Exclusions'));
  children.push(build3ColTable(p,
    [['No.', 600], ['Item', 2200], ['Detail', W - 2800]],
    d.exclusions.map((exc) => [exc.no, exc.item, exc.detail]),
  ));

  // 5. Design Responsibility
  children.push(sectionHead(templateSlug, p, ++sec, 'Design Responsibility'));
  children.push(bodyPara(p, d.designResponsibility));

  // 6. Materials & Equipment
  children.push(sectionHead(templateSlug, p, ++sec, 'Materials & Equipment'));
  children.push(bodyPara(p, d.materialsEquipment));
  children.push(build2ColTable(p,
    [['Item', 3000], ['Detail', W - 3000]],
    [['Free-Issue Items', d.freeIssueItems], ['Material Approval Process', d.materialApprovalProcess]],
  ));

  // 7. Attendance & Facilities
  children.push(sectionHead(templateSlug, p, ++sec, 'Attendance & Facilities'));
  children.push(build3ColTable(p,
    [['Item', 2800], ['Provided By', 2513], ['Notes', W - 5313]],
    d.attendance.map((a) => [a.item, a.providedBy, a.notes]),
  ));

  // 8. Programme & Sequencing
  children.push(sectionHead(templateSlug, p, ++sec, 'Programme & Sequencing'));
  children.push(build2ColTable(p,
    [['Item', 3000], ['Detail', W - 3000]],
    [['Planned Start', d.programmeStart], ['Planned Completion', d.programmeCompletion], ['Working Hours', d.workingHours], ['Key Milestones', d.keyMilestones]],
  ));
  children.push(bodyPara(p, d.programmeNotes));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 9. Interface Requirements
  children.push(sectionHead(templateSlug, p, ++sec, 'Interface Requirements'));
  children.push(build3ColTable(p,
    [['Interface With', 2200], ['Description', Math.floor((W - 2200) / 2)], ['Responsibility', W - 2200 - Math.floor((W - 2200) / 2)]],
    d.interfaces.map((iface) => [iface.interfaceWith, iface.description, iface.responsibility]),
  ));

  // 10. Testing & Commissioning
  children.push(sectionHead(templateSlug, p, ++sec, 'Testing & Commissioning'));
  children.push(bodyPara(p, d.testingCommissioning));

  // 11. Deliverables
  children.push(sectionHead(templateSlug, p, ++sec, 'Deliverables'));
  children.push(build3ColTable(p,
    [['Document', 3400], ['Required By', 3313], ['Format', W - 6713]],
    d.deliverables.map((del) => [del.document, del.requiredBy, del.format]),
  ));

  // 12. H&S&E
  children.push(sectionHead(templateSlug, p, ++sec, 'Health, Safety & Environmental'));
  children.push(bodyPara(p, d.healthSafetyEnvironmental));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Conditional sections ───────────────────────────────────
  if (d.groundConditions) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Ground Conditions & Site Information'));
    children.push(bodyPara(p, d.groundConditions));
  }

  if (d.priceEscalation) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Price Escalation / Inflation'));
    children.push(bodyPara(p, d.priceEscalation));
  }

  if (d.contaminationRisk) {
    children.push(sectionHead(templateSlug, p, ++sec, 'Contamination & Environmental Risk'));
    children.push(bodyPara(p, d.contaminationRisk));
  }

  // ── Commercial boilerplate sections ────────────────────────
  children.push(...buildPaymentSection(p, templateSlug, d, ++sec));
  children.push(...buildDayworkSection(p, templateSlug, ++sec));
  children.push(...buildVariationSection(p, templateSlug, d, ++sec));
  children.push(...buildDelaySection(p, templateSlug, d, ++sec));
  children.push(...buildTerminationSection(p, templateSlug, d, ++sec));
  children.push(...buildDisputeSection(p, templateSlug, d, ++sec));
  children.push(...buildContraChargeSection(p, templateSlug, d, ++sec));
  children.push(...buildWarrantiesBondsSection(p, templateSlug, d, ++sec));
  children.push(...buildCISSection(p, templateSlug, d, ++sec));
  children.push(...buildInsuranceSection(p, templateSlug, d, ++sec));
  children.push(...buildBackToBackSection(p, templateSlug, d, ++sec));
  children.push(...buildCommercialSummary(p, templateSlug, d, ++sec));

  // ── Footer ─────────────────────────────────────────────────
  children.push(gap(300));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '— End of Scope of Works —', italics: true, font: p.font, size: p.bodySize, color: p.mid })],
  }));

  // ── Assemble document ──────────────────────────────────────
  return new Document({
    styles: { default: { document: { run: { font: p.font, size: p.bodySize, color: p.dark } } } },
    sections: [{
      properties: {
        page: {
          size: { width: h.A4_WIDTH, height: h.A4_HEIGHT },
          margin: { top: h.MARGIN_NORMAL, right: h.MARGIN_NORMAL, bottom: h.MARGIN_NORMAL, left: h.MARGIN_NORMAL },
        },
      },
      headers: { default: makeHeader(p, d) },
      footers: { default: makeFooter(p, d) },
      children,
    }],
  });
}
