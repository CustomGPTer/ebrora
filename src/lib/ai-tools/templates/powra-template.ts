// =============================================================================
// POWRA — Point of Work Risk Assessment Template
// Compact, field-ready format. Designed to print on 1-2 pages.
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'EA580C';
const ACCENT_LIGHT = 'FFF7ED';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 240, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, font: 'Arial', color: h.EBRORA_GREEN })] });
}

export async function buildPowraDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const cond = content.conditions || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.ebroraHeader() },
      footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [
          new TextRun({ text: 'POINT OF WORK RISK ASSESSMENT', bold: true, size: 36, font: 'Arial', color: h.EBRORA_GREEN }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [
          new TextRun({ text: 'POWRA — Complete Before Starting Work', size: 18, font: 'Arial', color: ACCENT, bold: true }),
        ] }),

        h.infoTable([
          { label: 'Reference', value: content.documentRef || '' },
          { label: 'Date', value: content.date || '' },
          { label: 'Time', value: content.time || '' },
          { label: 'Assessed By', value: content.assessedBy || '' },
          { label: 'Project', value: content.projectName || '' },
          { label: 'Location', value: content.location || '' },
          { label: 'RAMS Ref', value: content.ramsReference || '' },
          { label: 'Permits', value: content.permitReferences || '' },
        ], W),
        h.spacer(120),

        section('Task Description'),
        h.bodyText(content.taskDescription || ''),
        h.spacer(80),

        section('Conditions Today'),
        h.infoTable([
          { label: 'Weather', value: cond.weather || '' },
          { label: 'Ground', value: cond.groundConditions || '' },
          { label: 'Lighting', value: cond.lighting || '' },
          { label: 'Access/Egress', value: cond.accessEgress || '' },
        ], W),
        h.spacer(120),

        section('Hazards, Controls & Risk Rating'),
        ...(Array.isArray(content.hazards) ? [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [Math.round(W * 0.22), Math.round(W * 0.18), Math.round(W * 0.1), Math.round(W * 0.38), W - Math.round(W * 0.88)], rows: [
          new TableRow({ children: [
            h.headerCell('Hazard', Math.round(W * 0.22), { fontSize: 13 }),
            h.headerCell('Consequence', Math.round(W * 0.18), { fontSize: 13 }),
            h.headerCell('Before', Math.round(W * 0.1), { fontSize: 13, alignment: AlignmentType.CENTER }),
            h.headerCell('Control Measure', Math.round(W * 0.38), { fontSize: 13 }),
            h.headerCell('After', W - Math.round(W * 0.88), { fontSize: 13, alignment: AlignmentType.CENTER }),
          ] }),
          ...content.hazards.map((hz: any, i: number) => new TableRow({ children: [
            h.dataCell(hz.hazard || '', Math.round(W * 0.22), { fontSize: 13, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            h.dataCell(hz.consequence || '', Math.round(W * 0.18), { fontSize: 13, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            h.dataCell(hz.riskBefore || '', Math.round(W * 0.1), { fontSize: 13, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.riskBefore || 'Low'), color: h.WHITE, bold: true }),
            h.dataCell(hz.controlMeasure || '', Math.round(W * 0.38), { fontSize: 13, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            h.dataCell(hz.riskAfter || '', W - Math.round(W * 0.88), { fontSize: 13, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(hz.riskAfter || 'Low'), color: h.WHITE, bold: true }),
          ] })),
        ] })] : []),
        h.spacer(120),

        section('PPE Required'),
        ...(Array.isArray(content.ppeRequired) ? content.ppeRequired.map((ppe: string) =>
          new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 }, children: [new TextRun({ text: ppe, size: 18, font: 'Arial' })] })
        ) : []),
        h.spacer(120),

        section('⛔ Stop Conditions — Stop Work Immediately If:'),
        ...(Array.isArray(content.stopConditions) ? content.stopConditions.map((sc: string, i: number) =>
          new Paragraph({ spacing: { after: 60 }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'FEE2E2' : h.WHITE },
            children: [new TextRun({ text: `  ✗  ${sc}`, size: 18, font: 'Arial', bold: true, color: 'DC2626' })] })
        ) : []),
        h.spacer(120),

        section('Emergency Arrangements'),
        h.bodyText(content.emergencyArrangements || ''),
        h.spacer(120),

        section('Team Briefing & Sign-On'),
        h.bodyText('I confirm I have been briefed on this POWRA and understand the hazards, controls, and stop conditions.', 16, { italic: true, color: h.GREY_DARK }),
        h.spacer(40),
        h.briefingRecordTable(
          Math.max(Array.isArray(content.teamSignOn) ? content.teamSignOn.length : 6, 6),
          W
        ),
        h.spacer(200),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 },
          children: [new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true })] }),
      ],
    }],
  });
}
