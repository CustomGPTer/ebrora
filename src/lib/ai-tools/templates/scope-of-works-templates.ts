// =============================================================================
// Scope of Works — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Corporate Blue     (#1F4E79, comprehensive 9-section, numbered items)
// T2 — Formal Contract    (#2D2D2D + #C0392B, clause-numbered, NEC4 focus)
// T3 — Executive Navy     (#1B2A4A + #00897B, condensed, comparison tables)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ScopeTemplateSlug, ScopeOfWorksData } from '@/lib/scope/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Colours
const CORP_BLUE = '1F4E79'; const CORP_DARK = '163b5c'; const CORP_BG = 'D6E4F0';
const CHARCOAL = '2D2D2D'; const DEEP_RED = 'C0392B'; const RED_DARK = '922b21';
const EXEC_NAVY = '1B2A4A'; const NAVY_DARK = '0d1a33';
const TEAL = '00897B'; const TEAL_BG = 'E0F2F1';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Shared Helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, bg: string): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font: 'Arial', color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: BODY, font: 'Arial', color: opts?.color })] })] });
}
function accentInfoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        shading: { fill: lbg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial', color: lc })] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial' })] })] }),
    ] })) });
}

// Inclusion/exclusion item block (numbered title + detail paragraph)
function scopeItemBlock(no: string, title: string, detail: string, accent: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 120, after: 40 }, children: [
      new TextRun({ text: `${no}. ${title}`, bold: true, size: BODY, font: 'Arial', color: accent }),
    ] }),
    new Paragraph({ spacing: { after: 80 }, indent: { left: 200 }, children: [
      new TextRun({ text: detail, size: BODY, font: 'Arial' }),
    ] }),
  ];
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — CORPORATE BLUE (#1F4E79)
// Cover + content. Section numbering: 01–09
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: ScopeOfWorksData): Document {
  const A = CORP_BLUE;
  const hdr = h.accentHeader('Subcontractor Scope of Works', A);
  const ftr = h.accentFooter(d.documentRef, 'Corporate Blue', A);
  const revCols = [Math.round(W * 0.08), Math.round(W * 0.14), Math.round(W * 0.38), Math.round(W * 0.20)];
  revCols.push(W - revCols.reduce((a, b) => a + b, 0));
  const attCols = [Math.round(W * 0.28), Math.round(W * 0.20)];
  attCols.push(W - attCols[0] - attCols[1]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SUBCONTRACTOR', 'SCOPE OF WORKS'], d.discipline || d.scopeOverview?.substring(0, 60) || '', CORP_DARK, '93C5FD'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Ref', value: d.documentRef },
            { label: 'Issue Date', value: d.issueDate },
            { label: 'Revision', value: d.revision },
            { label: 'Project', value: d.projectName },
            { label: 'Client', value: d.client },
            { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Subcontractor', value: d.subcontractor },
            { label: 'Discipline', value: d.discipline },
            { label: 'Contract Form', value: d.contractForm },
            { label: 'Prepared By', value: d.preparedBy },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 DOCUMENT CONTROL
          h.fullWidthSectionBar('01', 'Document Control', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: revCols,
            rows: [
              new TableRow({ children: [hdrCell('Rev', revCols[0], A), hdrCell('Date', revCols[1], A), hdrCell('Description', revCols[2], A), hdrCell('Issued By', revCols[3], A), hdrCell('Approved By', revCols[4], A)] }),
              new TableRow({ children: [
                txtCell(d.revision || '0', revCols[0]),
                txtCell(d.issueDate, revCols[1]),
                txtCell('First Issue \u2014 For Tender', revCols[2]),
                txtCell(d.preparedBy, revCols[3]),
                txtCell('', revCols[4]),
              ] }),
            ] }),

          // 02 SCOPE OVERVIEW
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Scope Overview', A),
          h.spacer(80),
          ...h.richBodyText(d.scopeOverview || 'Scope overview to be confirmed.'),

          // 03 INCLUSIONS
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Inclusions', A),
          h.spacer(80),
          ...d.inclusions.flatMap(inc => scopeItemBlock(inc.no, inc.item, inc.detail, A)),

          // 04 EXCLUSIONS
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Exclusions', A),
          h.spacer(80),
          ...d.exclusions.flatMap(exc => scopeItemBlock(exc.no, exc.item, exc.detail, A)),

          // 05 ATTENDANCE & INTERFACE
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Attendance & Interface', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: attCols,
            rows: [
              new TableRow({ children: [hdrCell('Item', attCols[0], A), hdrCell('Provided By', attCols[1], A), hdrCell('Notes', attCols[2], A)] }),
              ...d.attendance.map((att, ri) => new TableRow({ children: [
                txtCell(att.item, attCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(att.providedBy, attCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(att.notes, attCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] }),

          // 06 PROGRAMME
          h.spacer(120),
          h.fullWidthSectionBar('06', 'Programme', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Start Date', value: d.programmeStart },
            { label: 'Completion Date', value: d.programmeCompletion },
            { label: 'Duration', value: d.keyMilestones?.split('\u00B7')[0]?.trim() || '' },
            { label: 'Working Hours', value: d.workingHours },
            { label: 'Key Milestones', value: d.keyMilestones },
          ], CORP_BG, A),
          h.spacer(40),
          ...h.richBodyText(d.programmeNotes || ''),

          // 07 HEALTH, SAFETY & ENVIRONMENT
          h.spacer(120),
          h.fullWidthSectionBar('07', 'Health, Safety & Environment', A),
          h.spacer(80),
          ...h.richBodyText(d.healthSafetyEnvironmental || ''),

          // 08 COMMERCIAL TERMS
          h.spacer(120),
          h.fullWidthSectionBar('08', 'Commercial Terms', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Payment Basis', value: d.paymentBasis },
            { label: 'Application Date', value: d.applicationDate },
            { label: 'Payment Terms', value: `${d.paymentDays} days from date of application` },
            { label: 'Retention', value: `${d.retentionPercent}% (${d.retentionAtPC}% at Completion, ${d.retentionPercent - d.retentionAtPC}% at Defects Date)` },
            { label: 'Defects Period', value: d.defectsPeriod },
            { label: 'Latent Defects', value: `${d.latentDefectsYears} years (Limitation Act 1980)` },
            { label: 'Insurance', value: d.insurance?.map(i => `${i.type}: ${i.minimumCover}`).join(' \u00B7 ') || '' },
            { label: 'Performance Bond', value: `${d.bondPercent}% of subcontract value, delivered within ${d.bondDeliveryDays} days of award` },
            { label: 'Governing Law', value: d.governingLaw },
            { label: 'Dispute Resolution', value: `Adjudication per NEC4 W1, nominating body ${d.disputeNominatingBody}` },
          ], CORP_BG, A),

          // 09 APPROVAL
          h.spacer(120),
          h.fullWidthSectionBar('09', 'Approval', A),
          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By (PC)'], A, W),
          h.spacer(80),
          ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — FORMAL CONTRACT (Charcoal #2D2D2D + Red #C0392B)
// Cover + content. Section numbering: 1.0–6.0 with clause sub-numbering
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: ScopeOfWorksData): Document {
  const A = CHARCOAL;
  const AC = DEEP_RED;
  const hdr = h.accentHeader('Scope of Works', AC);
  const ftr = h.accentFooter(d.documentRef, 'Formal Contract', AC);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SCOPE OF WORKS'], 'Formal Contract Document \u00B7 NEC4 ECS Option A', RED_DARK, 'F5B7B1'),
          h.spacer(200),
          h.projectNameBar(`${d.projectName || 'PROJECT'} \u2014 ${d.discipline || ''}`, A),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Ref', value: d.documentRef },
            { label: 'Issue Date / Rev', value: `${d.issueDate} \u00B7 Revision ${d.revision}` },
            { label: 'Contract', value: d.contractForm },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Subcontractor', value: d.subcontractor },
            { label: 'Discipline', value: d.discipline },
          ], AC, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 1.0 CONTRACT BASIS
          h.fullWidthSectionBar('1.0', 'Contract Basis', A),
          h.spacer(80),
          ...h.richBodyText(d.contractBasisNotes || ''),
          ...(d.contractDocuments?.length > 0 ? [new Paragraph({ spacing: { before: 80, after: 80 }, children: [
            new TextRun({ text: 'Contract Documents Schedule: ', bold: true, size: BODY, font: 'Arial', color: AC }),
            new TextRun({ text: d.contractDocuments.join('; '), size: BODY, font: 'Arial' }),
          ] })] : []),

          // 2.0 SCOPE OF THE WORKS
          h.spacer(120),
          h.fullWidthSectionBar('2.0', 'Scope of the Works', A),
          h.spacer(80),
          ...h.richBodyText(d.scopeOverview || ''),
          ...(d.exclusions.length > 0 ? [h.spacer(40), new Paragraph({ spacing: { after: 80 }, children: [
            new TextRun({ text: 'Exclusions: ', bold: true, size: BODY, font: 'Arial', color: AC }),
            new TextRun({ text: d.exclusions.map(e => e.item).join('; ') + '.', size: BODY, font: 'Arial' }),
          ] })] : []),

          // 3.0 DESIGN RESPONSIBILITY
          h.spacer(120),
          h.fullWidthSectionBar('3.0', 'Design Responsibility', A),
          h.spacer(80),
          ...h.richBodyText(d.designResponsibility || ''),

          // 4.0 PROGRAMME & MILESTONES
          h.spacer(120),
          h.fullWidthSectionBar('4.0', 'Programme & Milestones', A),
          h.spacer(80),
          ...h.richBodyText(d.programmeNotes || `The Subcontractor shall commence the Works on ${d.programmeStart} and complete by ${d.programmeCompletion}. Key milestones: ${d.keyMilestones || 'To be agreed.'}`),

          // 5.0 COMMERCIAL TERMS
          h.spacer(120),
          h.fullWidthSectionBar('5.0', 'Commercial Terms', A),
          h.spacer(80),
          ...h.richBodyText([
            `Payment: ${d.paymentBasis}. Monthly valuations submitted on the ${d.applicationDate}. Payment within ${d.paymentDays} days per NEC4 clause 51.`,
            `Retention: ${d.retentionPercent}% of assessed amounts. ${d.retentionAtPC}% released at Completion; ${d.retentionPercent - d.retentionAtPC}% released at expiry of the Defects Date (${d.defectsPeriod}).`,
            `Insurance: ${d.insurance?.map(i => `${i.type} ${i.minimumCover}`).join('; ') || 'Per contract requirements.'}`,
            `Performance Bond: ${d.bondPercent}% of the subcontract value, delivered within ${d.bondDeliveryDays} days of award.`,
          ].join('\n\n')),

          // 6.0 APPROVAL
          h.spacer(120),
          h.fullWidthSectionBar('6.0', 'Approval', A),
          h.spacer(80),
          h.signatureGrid(['For the Contractor', 'For the Subcontractor'], AC, W),
          h.spacer(80),
          ...h.endMark(AC),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — EXECUTIVE NAVY (#1B2A4A + Teal #00897B)
// Cover + content. Section numbering: 01–06. Dual-colour accent.
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: ScopeOfWorksData): Document {
  const A = TEAL; // Section bars use teal
  const hdr = h.accentHeader('Scope of Works', TEAL);
  const ftr = h.accentFooter(d.documentRef, 'Executive Navy', TEAL);

  const incExcCols = [Math.round(W * 0.50)]; incExcCols.push(W - incExcCols[0]);
  const delCols = [Math.round(W * 0.35), Math.round(W * 0.25)]; delCols.push(W - delCols[0] - delCols[1]);
  const mileCols = [Math.round(W * 0.40), Math.round(W * 0.20)]; mileCols.push(W - mileCols[0] - mileCols[1]);

  // Build inc/exc comparison rows — match items by index
  const maxRows = Math.max(d.inclusions.length, d.exclusions.length);
  const compRows: TableRow[] = [];
  for (let i = 0; i < maxRows; i++) {
    const inc = d.inclusions[i];
    const exc = d.exclusions[i];
    compRows.push(new TableRow({ children: [
      txtCell(inc ? `${inc.item}` : '', incExcCols[0], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
      txtCell(exc ? `${exc.item}` : '', incExcCols[1], { bg: i % 2 === 0 ? ZEBRA : h.WHITE }),
    ] }));
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // ── COVER ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          h.coverBlock(['SCOPE OF WORKS'], `${d.discipline} \u00B7 ${d.subcontractor || 'Subcontractor Package'}`, NAVY_DARK, '80CBC4'),
          h.spacer(200),
          h.projectNameBar(d.projectName || 'PROJECT', TEAL),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Ref', value: d.documentRef },
            { label: 'Issue Date / Rev', value: `${d.issueDate} \u00B7 Revision ${d.revision}` },
            { label: 'Project', value: d.projectName },
            { label: 'Client', value: d.client },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Subcontractor', value: d.subcontractor },
            { label: 'Contract', value: d.contractForm },
            { label: 'Discipline', value: d.discipline },
            { label: 'Programme', value: `${d.programmeStart} \u2013 ${d.programmeCompletion}` },
          ], TEAL, W),
          h.coverFooterLine(),
        ] },
      // ── CONTENT ──
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr }, footers: { default: ftr },
        children: [
          // 01 SCOPE OVERVIEW
          h.fullWidthSectionBar('01', 'Scope Overview', A),
          h.spacer(80),
          ...h.richBodyText(d.scopeOverview || ''),

          // 02 INCLUSIONS & EXCLUSIONS (comparison table)
          h.spacer(120),
          h.fullWidthSectionBar('02', 'Inclusions & Exclusions', A),
          h.spacer(80),
          new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: incExcCols,
            rows: [
              new TableRow({ children: [hdrCell('Included (Subcontractor)', incExcCols[0], EXEC_NAVY), hdrCell('Excluded (by Contractor)', incExcCols[1], EXEC_NAVY)] }),
              ...compRows,
            ] }),

          // 03 DESIGN & MATERIALS
          h.spacer(120),
          h.fullWidthSectionBar('03', 'Design & Materials', A),
          h.spacer(80),
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: 'Design: ', bold: true, size: BODY, font: 'Arial' }),
            new TextRun({ text: d.designResponsibility || '', size: BODY, font: 'Arial' }),
          ] }),
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: 'Materials: ', bold: true, size: BODY, font: 'Arial' }),
            new TextRun({ text: d.materialsEquipment || '', size: BODY, font: 'Arial' }),
          ] }),

          // 04 TESTING & DELIVERABLES
          h.spacer(120),
          h.fullWidthSectionBar('04', 'Testing & Deliverables', A),
          h.spacer(80),
          ...(d.deliverables.length > 0 ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: delCols,
            rows: [
              new TableRow({ children: [hdrCell('Deliverable', delCols[0], EXEC_NAVY), hdrCell('Required By', delCols[1], EXEC_NAVY), hdrCell('Format', delCols[2], EXEC_NAVY)] }),
              ...d.deliverables.map((del, ri) => new TableRow({ children: [
                txtCell(del.document, delCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(del.requiredBy, delCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(del.format, delCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })),
            ] })] : []),

          // 05 PROGRAMME & MILESTONES
          h.spacer(120),
          h.fullWidthSectionBar('05', 'Programme & Milestones', A),
          h.spacer(80),
          ...(d.interfaces?.length > 0 || d.keyMilestones ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: mileCols,
            rows: [
              new TableRow({ children: [hdrCell('Milestone', mileCols[0], EXEC_NAVY), hdrCell('Target Date', mileCols[1], EXEC_NAVY), hdrCell('Dependencies', mileCols[2], EXEC_NAVY)] }),
              // Derive milestones from interfaces or keyMilestones text
              ...(d.interfaces?.length > 0 ? d.interfaces.map((iface, ri) => new TableRow({ children: [
                txtCell(iface.interfaceWith, mileCols[0], { bold: true, bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(iface.description, mileCols[1], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
                txtCell(iface.responsibility, mileCols[2], { bg: ri % 2 === 0 ? ZEBRA : h.WHITE }),
              ] })) : []),
            ] })] : []),
          h.spacer(40),
          ...h.richBodyText(d.programmeNotes || ''),

          // 06 COMMERCIAL SUMMARY
          h.spacer(120),
          h.fullWidthSectionBar('06', 'Commercial Summary', A),
          h.spacer(80),
          accentInfoTable([
            { label: 'Payment', value: `${d.paymentBasis}, ${d.paymentDays} days net, NEC4 cl. 51 \u00B7 Application ${d.applicationDate}` },
            { label: 'Retention', value: `${d.retentionPercent}% (${d.retentionAtPC}% at Completion, ${d.retentionPercent - d.retentionAtPC}% at Defects Date \u2014 ${d.defectsPeriod})` },
            { label: 'Insurance', value: d.insurance?.map(i => `${i.type} ${i.minimumCover}`).join(' \u00B7 ') || '' },
            { label: 'Bond', value: `${d.bondPercent}%, ${d.bondDeliveryDays} days from award` },
            { label: 'Latent Defects', value: `${d.latentDefectsYears} years \u00B7 Governing law: ${d.governingLaw} \u00B7 Disputes: ${d.disputeNominatingBody} adjudication` },
          ], TEAL_BG, TEAL),

          // Sign-off + end mark
          h.spacer(120),
          h.signatureGrid(['Contractor', 'Subcontractor'], TEAL, W),
          h.spacer(80),
          ...h.endMark(TEAL),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildScopeTemplateDocument(
  content: ScopeOfWorksData,
  templateSlug: ScopeTemplateSlug,
): Promise<Document> {
  switch (templateSlug) {
    case 'corporate-blue':    return buildT1(content);
    case 'formal-contract':   return buildT2(content);
    case 'executive-navy':    return buildT3(content);
    default:                  return buildT1(content);
  }
}
