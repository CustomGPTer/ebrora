// =============================================================================
// Lift Plan — Dedicated Template (BS 7121 / LOLER 1998)
// =============================================================================
import { Document, Paragraph, TextRun, Table, TableRow, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import * as h from '@/lib/rams/docx-helpers';

const ACCENT = 'B45309';
const ACCENT_LIGHT = 'FEF3C7';

function section(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: 'Arial', color: h.EBRORA_GREEN })] });
}
// prose() now imported from docx-helpers via h.prose()

export async function buildLiftPlanDocument(content: any): Promise<Document> {
  const W = h.A4_CONTENT_WIDTH;
  const load = content.loadDetails || {};
  const crane = content.craneDetails || {};
  const geom = content.liftGeometry || {};
  const rig = content.riggingArrangement || {};
  const ground = content.groundConditions || {};
  const persons = content.appointedPersons || {};
  const weather = content.weatherLimits || {};

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: 'LIFT PLAN', bold: true, size: 44, font: 'Arial', color: h.EBRORA_GREEN }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'BS 7121 — Code of Practice for Safe Use of Cranes', size: 20, font: 'Arial', color: ACCENT }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } }, children: [] }),

          h.sectionHeading('Document Control'),
          h.infoTable([
            { label: 'Document Reference', value: content.documentRef || '' },
            { label: 'Plan Date', value: content.planDate || '' },
            { label: 'Review Date', value: content.reviewDate || '' },
            { label: 'Prepared By', value: content.preparedBy || '' },
            { label: 'Project Name', value: content.projectName || '' },
            { label: 'Site Address', value: content.siteAddress || '' },
          ], W),
          h.spacer(200),

          h.sectionHeading('Approval & Sign-Off'),
          h.approvalTable([
            { role: 'Lift Planner', name: persons.liftPlanner || '' },
            { role: 'Crane Supervisor', name: persons.craneSupervisor || '' },
            { role: 'Approved By', name: '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Lift Description'),
          ...h.prose(content.liftDescription),
          h.spacer(160),

          section('Load Details'),
          h.infoTable([
            { label: 'Load Description', value: load.description || '' },
            { label: 'Weight (incl. rigging)', value: load.weight || '' },
            { label: 'Dimensions (L×W×H)', value: load.dimensions || '' },
            { label: 'Centre of Gravity', value: load.centreOfGravity || '' },
            { label: 'Number of Lifts', value: load.numberOfLifts || '' },
            { label: 'Load Condition', value: load.loadCondition || '' },
          ], W),
          h.spacer(160),

          section('Crane / Lifting Equipment'),
          h.infoTable([
            { label: 'Type', value: crane.type || '' },
            { label: 'Make / Model', value: crane.makeModel || '' },
            { label: 'Maximum SWL', value: crane.capacity || '' },
            { label: 'Serial Number', value: crane.serialNumber || '' },
            { label: 'Last Thorough Examination', value: crane.lastThoroughExamination || '' },
            { label: 'Certificate Expiry', value: crane.currentCertificateExpiry || '' },
          ], W),
          h.spacer(160),

          section('Lift Geometry'),
          h.infoTable([
            { label: 'Maximum Radius', value: geom.maxRadius || '' },
            { label: 'Minimum Radius', value: geom.minRadius || '' },
            { label: 'Maximum Height', value: geom.maxHeight || '' },
            { label: 'Duty at Max Radius', value: geom.dutyAtRadius || '' },
            { label: '% of Capacity', value: geom.percentageOfCapacity || '' },
            { label: 'Slew Arc', value: geom.slewArc || '' },
          ], W),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Rigging Arrangement'),
          h.infoTable([
            { label: 'Sling Type', value: rig.slingType || '' },
            { label: 'Sling Capacity', value: rig.slingCapacity || '' },
            { label: 'Sling Angle', value: rig.slingAngle || '' },
            { label: 'Shackles & Connectors', value: rig.shacklesAndConnectors || '' },
            { label: 'Deduction for Rigging', value: rig.deductionForRigging || '' },
          ], W),
          h.spacer(160),

          section('Ground Conditions & Setup'),
          h.infoTable([
            { label: 'Bearing Capacity', value: ground.bearingCapacity || '' },
            { label: 'Outrigger Setup', value: ground.outriggerSetup || '' },
            { label: 'Mats / Pads Required', value: ground.matsPadsRequired || '' },
          ], W),
          h.spacer(80),
          ...h.prose(ground.groundAssessment),
          h.spacer(160),

          section('Exclusion Zones'),
          ...h.prose(content.exclusionZones),
          h.spacer(160),

          section('Proximity Hazards'),
          ...(Array.isArray(content.proximityHazards) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('Hazard', Math.round(W * 0.35), { fontSize: 14 }),
              h.headerCell('Distance', Math.round(W * 0.2), { fontSize: 14 }),
              h.headerCell('Control Measure', W - Math.round(W * 0.55), { fontSize: 14 }),
            ] }),
            ...content.proximityHazards.map((p: any, i: number) => new TableRow({ children: [
              h.dataCell(p.hazard || '', Math.round(W * 0.35), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(p.distance || '', Math.round(W * 0.2), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
              h.dataCell(p.controlMeasure || '', W - Math.round(W * 0.55), { fontSize: 14, fillColor: i % 2 === 0 ? ACCENT_LIGHT : h.WHITE }),
            ] })),
          ] })] : []),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: h.ebroraHeader() },
        footers: { default: h.ebroraFooter() },
        children: [
          section('Appointed Persons'),
          h.infoTable([
            { label: 'Lift Planner', value: persons.liftPlanner || '' },
            { label: 'Crane Supervisor', value: persons.craneSupervisor || '' },
            { label: 'Slinger / Signaller', value: persons.slingerSignaller || '' },
            { label: 'Crane Operator', value: persons.craneOperator || '' },
            { label: 'Banksmen', value: persons.banksmen || '' },
          ], W),
          h.spacer(160),

          section('Communication Plan'),
          ...h.prose(content.communicationPlan),
          h.spacer(160),

          section('Weather Limits'),
          h.infoTable([
            { label: 'Max Wind Speed', value: weather.maxWindSpeed || '' },
            { label: 'Visibility Minimum', value: weather.visibilityMinimum || '' },
            { label: 'Other Restrictions', value: weather.otherRestrictions || '' },
          ], W),
          h.spacer(160),

          section('Risk Assessment'),
          ...(Array.isArray(content.riskAssessment) ? [new Table({ width: { size: W, type: WidthType.DXA }, rows: [
            new TableRow({ children: [
              h.headerCell('Hazard', Math.round(W * 0.22), { fontSize: 12 }),
              h.headerCell('Risk', Math.round(W * 0.18), { fontSize: 12 }),
              h.headerCell('L', Math.round(W * 0.08), { fontSize: 12, alignment: AlignmentType.CENTER }),
              h.headerCell('S', Math.round(W * 0.08), { fontSize: 12, alignment: AlignmentType.CENTER }),
              h.headerCell('Control Measure', Math.round(W * 0.32), { fontSize: 12 }),
              h.headerCell('Res.', W - Math.round(W * 0.88), { fontSize: 12, alignment: AlignmentType.CENTER }),
            ] }),
            ...content.riskAssessment.map((r: any, i: number) => new TableRow({ children: [
              h.dataCell(r.hazard || '', Math.round(W * 0.22), { fontSize: 12, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(r.risk || '', Math.round(W * 0.18), { fontSize: 12, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(r.likelihood || '', Math.round(W * 0.08), { fontSize: 12, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(r.likelihood || 'Low'), color: h.WHITE, bold: true }),
              h.dataCell(r.severity || '', Math.round(W * 0.08), { fontSize: 12, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(r.severity || 'Low'), color: h.WHITE, bold: true }),
              h.dataCell(r.controlMeasure || '', Math.round(W * 0.32), { fontSize: 12, fillColor: i % 2 === 0 ? h.GREY_LIGHT : h.WHITE }),
              h.dataCell(r.residualRisk || '', W - Math.round(W * 0.88), { fontSize: 12, alignment: AlignmentType.CENTER, fillColor: h.hmlColor(r.residualRisk || 'Low'), color: h.WHITE, bold: true }),
            ] })),
          ] })] : []),
          h.spacer(200),

          section('Contingency Procedures'),
          ...h.prose(content.contingencyProcedures),
          h.spacer(160),
          section('Emergency Procedures'),
          ...h.prose(content.emergencyProcedures),
          h.spacer(160),

          ...(content.additionalNotes ? [section('Additional Notes'), ...h.prose(content.additionalNotes), h.spacer(160)] : []),

          section('Regulatory References'),
          h.bodyText('• BS 7121 — Code of Practice for Safe Use of Cranes'),
          h.bodyText('• Lifting Operations and Lifting Equipment Regulations 1998 (LOLER)'),
          h.bodyText('• Provision and Use of Work Equipment Regulations 1998 (PUWER)'),
          h.bodyText('• HSE Guidance — Safe Use of Lifting Equipment (L113)'),
          h.bodyText('• Construction (Design and Management) Regulations 2015'),
          h.spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora — ebrora.com', size: 16, font: 'Arial', color: h.EBRORA_GREEN, bold: true }),
          ] }),
        ],
      },
    ],
  });
}
