// =============================================================================
// Scope of Works — Dedicated Template
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = '7C3AED';
const ACCENT_LIGHT = 'F5F3FF';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
// prose() now imported from docx-helpers via h.prose()

export async function buildScopeOfWorksDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const mats = content.materialsAndEquipment || {};
  const prog = content.programmeAndSequencing || {};
  const comm = content.commercialTerms || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader() }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 100 }, children: [
            new TextRun({ text: 'SCOPE OF WORKS', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),
          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Issue Date', value: content.issueDate || '' },
            { label: 'Revision', value: content.revision || '0' },
            { label: 'Prepared By', value: content.preparedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
            { label: 'Client', value: content.clientName || '' },
            { label: 'Principal Contractor', value: content.principalContractor || '' },
            { label: 'Subcontractor', value: content.subcontractorName || '' },
            { label: 'Discipline', value: content.subcontractorDiscipline || '' },
          ], W),
          h.spacer(200),
          h.approvalTable([
            { role: 'Prepared By', name: content.preparedBy || '' },
            { role: 'Reviewed By', name: '' },
            { role: 'Accepted By (Subcontractor)', name: '' },
          ], W),

          section('Scope Overview'),
          ...h.prose(content.scopeOverview),
          h.spacer(200),
          section('Inclusions'),
          ...(Array.isArray(content.inclusions) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.06), Math.round(W * 0.3), W - Math.round(W * 0.36)], rows: [
            new TableRow({ children: [h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }), h.headerCell('Item', Math.round(W * 0.3), { fontSize: 14 }), h.headerCell('Detail', W - Math.round(W * 0.36), { fontSize: 14 })] }),
            ...content.inclusions.map((inc: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.dataCell(inc.item || '', Math.round(W * 0.3), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(inc.detail || '', W - Math.round(W * 0.36), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
          h.spacer(200),
          section('Exclusions'),
          ...(Array.isArray(content.exclusions) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.06), Math.round(W * 0.3), W - Math.round(W * 0.36)], rows: [
            new TableRow({ children: [h.headerCell('No.', Math.round(W * 0.06), { fontSize: 14 }), h.headerCell('Item', Math.round(W * 0.3), { fontSize: 14 }), h.headerCell('Detail', W - Math.round(W * 0.36), { fontSize: 14 })] }),
            ...content.exclusions.map((exc: any, i: number) => new TableRow({ children: [
              h.dataCell(String(i + 1), Math.round(W * 0.06), { fontSize: 14, alignment: AlignmentType.CENTER }),
              h.dataCell(exc.item || '', Math.round(W * 0.3), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(exc.detail || '', W - Math.round(W * 0.36), { fontSize: 14, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),

          section('Design Responsibility'),
          ...h.prose(content.designResponsibility),
          h.spacer(160),
          section('Materials & Equipment'),
          ...h.prose(mats.subcontractorToSupply),
          h.spacer(80),
          h.infoTable([
            { label: 'Free-Issue by Contractor', value: mats.freeIssueByContractor || 'None' },
            { label: 'Material Approval Process', value: mats.materialApprovalProcess || '' },
          ], W),
          h.spacer(200),
          section('Programme & Sequencing'),
          h.infoTable([
            { label: 'Planned Start', value: prog.plannedStartDate || '' },
            { label: 'Planned Completion', value: prog.plannedCompletionDate || '' },
            { label: 'Key Milestones', value: prog.keyMilestones || '' },
            { label: 'Working Hours', value: prog.workingHours || '' },
          ], W),
          h.spacer(80),
          ...h.prose(prog.sequenceConstraints),
          h.spacer(200),
          section('Interface Requirements'),
          ...(Array.isArray(content.interfaceRequirements) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.25), Math.round(W * 0.45), W - Math.round(W * 0.7)], rows: [
            new TableRow({ children: [
              h.headerCell('Interface With', Math.round(W * 0.25), { fontSize: 14 }),
              h.headerCell('Description', Math.round(W * 0.45), { fontSize: 14 }),
              h.headerCell('Responsibility', W - Math.round(W * 0.7), { fontSize: 14 }),
            ] }),
            ...content.interfaceRequirements.map((inf: any, i: number) => new TableRow({ children: [
              h.dataCell(inf.interfaceWith || '', Math.round(W * 0.25), { fontSize: 14, bold: true, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(inf.description || '', Math.round(W * 0.45), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(inf.responsibility || '', W - Math.round(W * 0.7), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),

          section('Testing & Commissioning'),
          ...h.prose(content.testingAndCommissioning),
          h.spacer(200),
          section('Deliverables'),
          ...(Array.isArray(content.deliverables) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.45), Math.round(W * 0.3), W - Math.round(W * 0.75)], rows: [
            new TableRow({ children: [
              h.headerCell('Document', Math.round(W * 0.45), { fontSize: 14 }),
              h.headerCell('Required By', Math.round(W * 0.3), { fontSize: 14 }),
              h.headerCell('Format', W - Math.round(W * 0.75), { fontSize: 14 }),
            ] }),
            ...content.deliverables.map((d: any) => new TableRow({ children: [
              h.dataCell(d.document || '', Math.round(W * 0.45), { fontSize: 14 }),
              h.dataCell(d.requiredBy || '', Math.round(W * 0.3), { fontSize: 14 }),
              h.dataCell(d.format || '', W - Math.round(W * 0.75), { fontSize: 14 }),
            ] })),
          ] })] : []),
          h.spacer(200),
          section('Health, Safety & Environmental'),
          ...h.prose(content.healthSafetyEnvironmental),
          h.spacer(200),
          section('Commercial Terms'),
          h.infoTable([
            { label: 'Payment Basis', value: comm.paymentBasis || '' },
            { label: 'Retention', value: comm.retentionPercentage || '' },
            { label: 'Defects Period', value: comm.defectsPeriod || '' },
            { label: 'Insurance Requirements', value: comm.insuranceRequirements || '' },
          ], W),
          h.spacer(200),
          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),
        ],
      },
    ],
  });
}
