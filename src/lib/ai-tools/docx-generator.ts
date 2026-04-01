// =============================================================================
// AI Tools — Generic Document Generator
// Takes the AI-generated JSON content and builds a professional .docx file.
// Handles all 7 tools with a single recursive layout engine.
// =============================================================================
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
} from 'docx';
import { getAiToolConfig } from './tool-config';
import type { AiToolSlug } from './types';

// Ebrora brand colours
const EBRORA_GREEN = '1B5B50';
const EBRORA_DARK = '0F3D35';
const LIGHT_GREY = 'F2F2F2';
const MED_GREY = 'D9D9D9';
const WHITE = 'FFFFFF';

/** Human-readable label from a camelCase or snake_case key */
function humanise(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Check if value is a non-empty string */
function isText(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Create a styled heading paragraph */
function heading(text: string, level: 1 | 2 | 3 = 2): Paragraph {
  const headingLevel =
    level === 1 ? HeadingLevel.HEADING_1 :
    level === 2 ? HeadingLevel.HEADING_2 :
    HeadingLevel.HEADING_3;

  return new Paragraph({
    heading: headingLevel,
    spacing: { before: level === 1 ? 400 : 300, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: 'Arial',
        size: level === 1 ? 32 : level === 2 ? 26 : 22,
        color: EBRORA_DARK,
      }),
    ],
  });
}

/** Create a body text paragraph */
function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        font: 'Arial',
        size: 20,
      }),
    ],
  });
}

/** Create a labelled field (bold label + value) */
function labelledField(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: 'Arial', size: 20 }),
      new TextRun({ text: value, font: 'Arial', size: 20 }),
    ],
  });
}

/** Create a table cell */
function cell(
  text: string,
  opts?: { bold?: boolean; shading?: string; width?: number }
): TableCell {
  return new TableCell({
    width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts?.shading
      ? { type: ShadingType.SOLID, color: opts.shading }
      : undefined,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: opts?.bold ?? false,
            font: 'Arial',
            size: 18,
            color: opts?.shading === EBRORA_GREEN ? WHITE : '000000',
          }),
        ],
      }),
    ],
  });
}

/** Build a table from an array of objects */
function buildTable(data: Record<string, any>[]): Table {
  if (data.length === 0) return new Table({ rows: [] });

  const keys = Object.keys(data[0]);

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: keys.map((k) =>
      cell(humanise(k), { bold: true, shading: EBRORA_GREEN })
    ),
  });

  // Data rows
  const dataRows = data.map((item, idx) =>
    new TableRow({
      children: keys.map((k) =>
        cell(
          String(item[k] ?? ''),
          idx % 2 === 0 ? { shading: LIGHT_GREY } : undefined
        )
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

/** Recursively process JSON content into docx elements */
function processContent(
  content: Record<string, any>,
  elements: (Paragraph | Table)[],
  depth: number = 0
): void {
  // Skip keys that are metadata-like (handled separately in the cover page)
  const metaKeys = new Set([
    'documentRef', 'assessmentDate', 'reviewDate', 'assessedBy',
    'preparedBy', 'projectName', 'siteAddress', 'clientName',
    'issueDate', 'revision', 'checkDate', 'checkedBy', 'date',
    'deliveredBy', 'userName', 'jobTitle', 'location',
    'drawingRef', 'drawingTitle', 'drawingRevision', 'designer',
    'discipline', 'scale',
  ]);

  for (const [key, value] of Object.entries(content)) {
    if (metaKeys.has(key) && depth === 0) continue;

    const label = humanise(key);

    if (value === null || value === undefined) continue;

    if (typeof value === 'boolean') {
      elements.push(labelledField(label, value ? 'Yes' : 'No'));
    } else if (typeof value === 'number') {
      elements.push(labelledField(label, String(value)));
    } else if (typeof value === 'string' && value.trim().length > 0) {
      if (value.length > 200) {
        // Long text: section heading + body
        elements.push(heading(label, depth === 0 ? 2 : 3));
        // Split into paragraphs — first on double newlines, then on single newlines
        const blocks = value.split(/\n\n+/).filter(Boolean);
        for (const block of blocks) {
          const lines = block.split(/\n/).filter(Boolean);
          for (const line of lines) {
            elements.push(bodyText(line.trim()));
          }
        }
      } else {
        elements.push(labelledField(label, value));
      }
    } else if (Array.isArray(value)) {
      elements.push(heading(label, depth === 0 ? 2 : 3));

      if (value.length === 0) {
        elements.push(bodyText('None specified.'));
      } else if (typeof value[0] === 'string') {
        // Array of strings — bullet-style list
        for (const item of value) {
          elements.push(
            new Paragraph({
              spacing: { after: 60 },
              bullet: { level: 0 },
              children: [new TextRun({ text: item, font: 'Arial', size: 20 })],
            })
          );
        }
      } else if (typeof value[0] === 'object') {
        // Array of objects — table
        elements.push(buildTable(value));
        elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Nested object — sub-section
      elements.push(heading(label, depth === 0 ? 2 : 3));
      processContent(value, elements, depth + 1);
    }
  }
}

/** Build the cover page section from metadata */
function buildCoverPage(
  toolSlug: AiToolSlug,
  content: Record<string, any>
): Paragraph[] {
  const config = getAiToolConfig(toolSlug);
  const paras: Paragraph[] = [];

  // Title
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
      children: [
        new TextRun({
          text: config.documentLabel.toUpperCase(),
          bold: true,
          font: 'Arial',
          size: 40,
          color: EBRORA_GREEN,
        }),
      ],
    })
  );

  // Separator line
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: EBRORA_GREEN },
      },
      children: [],
    })
  );

  // Metadata fields
  const metaFields: [string, string | undefined][] = [
    ['Document Reference', content.documentRef],
    ['Project Name', content.projectName],
    ['Site Address', content.siteAddress],
    ['Drawing Reference', content.drawingRef],
    ['Drawing Title', content.drawingTitle],
    ['Topic', content.topic],
    ['User / Assessor', content.userName || content.assessedBy || content.preparedBy || content.checkedBy || content.deliveredBy],
    ['Job Title', content.jobTitle],
    ['Location', content.location],
    ['Date', content.assessmentDate || content.issueDate || content.checkDate || content.date],
    ['Review Date', content.reviewDate],
    ['Revision', content.revision],
    ['Designer', content.designer],
    ['Discipline', content.discipline],
  ];

  for (const [label, value] of metaFields) {
    if (isText(value)) {
      paras.push(labelledField(label, value));
    }
  }

  paras.push(new Paragraph({ spacing: { after: 400 }, children: [] }));

  return paras;
}

/** Main export: generate a docx Buffer from tool slug + AI JSON content */
export async function generateAiToolDocument(
  toolSlug: AiToolSlug,
  content: Record<string, any>
): Promise<Buffer> {
  // Use dedicated template if available
  if (toolSlug === 'coshh') {
    const coshhSlug = (content as any)._coshhTemplateSlug;
    let doc;
    if (coshhSlug) {
      const { buildCoshhTemplateDocument } = await import('./templates/coshh-templates');
      doc = await buildCoshhTemplateDocument(content as any, coshhSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildCoshhDocument } = await import('./templates/coshh-template');
      doc = await buildCoshhDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'incident-report') {
    const irSlug = (content as any)._incidentReportTemplateSlug;
    let doc;
    if (irSlug) {
      const { buildIncidentReportTemplateDocument } = await import('./templates/incident-report-templates');
      doc = await buildIncidentReportTemplateDocument(content as any, irSlug);
    } else {
      const { buildIncidentReportDocument } = await import('./templates/incident-report-template');
      doc = await buildIncidentReportDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'lift-plan') {
    const lpSlug = (content as any)._liftPlanTemplateSlug;
    let doc;
    if (lpSlug) {
      const { buildLiftPlanTemplateDocument } = await import('./templates/lift-plan-templates');
      doc = await buildLiftPlanTemplateDocument(content as any, lpSlug);
    } else {
      const { buildLiftPlanDocument } = await import('./templates/lift-plan-template');
      doc = await buildLiftPlanDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'emergency-response') {
    const erpSlug = (content as any)._erpTemplateSlug;
    let doc;
    if (erpSlug) {
      const { buildErpTemplateDocument } = await import('./templates/erp-templates');
      doc = await buildErpTemplateDocument(content as any, erpSlug);
    } else {
      const { buildEmergencyResponseDocument } = await import('./templates/emergency-response-template');
      doc = await buildEmergencyResponseDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'quality-checklist') {
    const { buildQualityChecklistDocument } = await import('./templates/quality-checklist-template');
    const doc = await buildQualityChecklistDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'scope-of-works') {
    const scopeSlug = (content as any)._scopeTemplateSlug;
    let doc;
    if (scopeSlug) {
      const { buildScopeTemplateDocument } = await import('./templates/scope-of-works-templates');
      doc = await buildScopeTemplateDocument(content as any, scopeSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildScopeOfWorksDocument } = await import('./templates/scope-of-works-template');
      doc = await buildScopeOfWorksDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'permit-to-dig') {
    const ptdSlug = (content as any)._permitToDigTemplateSlug;
    let doc;
    if (ptdSlug) {
      const { buildPermitToDigTemplateDocument } = await import('./templates/permit-to-dig-templates');
      doc = await buildPermitToDigTemplateDocument(content as any, ptdSlug);
    } else {
      const { buildPermitToDigDocument } = await import('./templates/permit-to-dig-template');
      doc = await buildPermitToDigDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'powra') {
    const powraSlug = (content as any)._powraTemplateSlug;
    let doc;
    if (powraSlug) {
      const { buildPowraTemplateDocument } = await import('./templates/powra-templates');
      doc = await buildPowraTemplateDocument(content as any, powraSlug);
    } else {
      const { buildPowraDocument } = await import('./templates/powra-template');
      doc = await buildPowraDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'early-warning') {
    const ewSlug = (content as any)._earlyWarningTemplateSlug;
    let doc;
    if (ewSlug) {
      const { buildEarlyWarningTemplateDocument } = await import('./templates/early-warning-templates');
      doc = await buildEarlyWarningTemplateDocument(content as any, ewSlug);
    } else {
      const { buildEarlyWarningDocument } = await import('./templates/early-warning-template');
      doc = await buildEarlyWarningDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'ncr') {
    const { buildNcrDocument } = await import('./templates/ncr-template');
    const doc = await buildNcrDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'ce-notification') {
    const { buildCeNotificationDocument } = await import('./templates/ce-notification-template');
    const doc = await buildCeNotificationDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'tbt-generator') {
    const tbtSlug = (content as any)._tbtTemplateSlug;
    let doc;
    if (tbtSlug) {
      const { buildTbtTemplateDocument } = await import('./templates/tbt-templates');
      doc = await buildTbtTemplateDocument(content as any, tbtSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildTbtDocument } = await import('./templates/tbt-template');
      doc = await buildTbtDocument(content as any);
    }
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  // ── New 13 tools — premium templates ──────────────────────────────────────

  if (toolSlug === 'programme-checker') {
    const pcSlug = (content as any)._programmeCheckerTemplateSlug;
    let doc;
    if (pcSlug) {
      const { buildProgrammeCheckerTemplateDocument } = await import('./templates/programme-checker-templates');
      doc = await buildProgrammeCheckerTemplateDocument(content as any, pcSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildProgrammeCheckerDocument } = await import('./templates/new-tools-templates');
      doc = await buildProgrammeCheckerDocument(content as any);
    }
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'cdm-checker') {
    const cdmSlug = (content as any)._cdmCheckerTemplateSlug;
    let doc;
    if (cdmSlug) {
      const { buildCdmCheckerTemplateDocument } = await import('./templates/cdm-checker-templates');
      doc = await buildCdmCheckerTemplateDocument(content as any, cdmSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildCdmCheckerDocument } = await import('./templates/cdm-checker-template');
      doc = await buildCdmCheckerDocument(content as any);
    }
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'noise-assessment') {
    const naSlug = (content as any)._noiseAssessmentTemplateSlug;
    let doc;
    if (naSlug) {
      const { buildNoiseAssessmentTemplateDocument } = await import('./templates/noise-assessment-templates');
      doc = await buildNoiseAssessmentTemplateDocument(content as any, naSlug);
    } else {
      const { buildNoiseAssessmentDocument } = await import('./templates/new-tools-templates');
      doc = await buildNoiseAssessmentDocument(content as any);
    }
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'quote-generator') {
    const slug = (content as any)._quoteTemplateSlug;
    if (slug) {
      const { buildQuoteTemplateDocument } = await import('./templates/quote-generator-templates');
      const doc = await buildQuoteTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
    // Fallback: legacy single-template
    const { buildQuoteGeneratorDocument } = await import('./templates/new-tools-templates');
    const doc = await buildQuoteGeneratorDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'wah-assessment') {
    const slug = (content as any)._wahTemplateSlug;
    if (slug) {
      const { buildWahTemplateDocument } = await import('./templates/wah-assessment-templates');
      const doc = await buildWahTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'wbv-assessment') {
    const slug = (content as any)._wbvTemplateSlug;
    if (slug) {
      const { buildWbvTemplateDocument } = await import('./templates/wbv-assessment-templates');
      const doc = await buildWbvTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'riddor-report') {
    const slug = (content as any)._riddorTemplateSlug;
    if (slug) {
      const { buildRiddorTemplateDocument } = await import('./templates/riddor-report-templates');
      const doc = await buildRiddorTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'traffic-management') {
    const slug = (content as any)._trafficTemplateSlug;
    if (slug) {
      const { buildTrafficTemplateDocument } = await import('./templates/traffic-management-templates');
      const doc = await buildTrafficTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'waste-management') {
    const slug = (content as any)._wasteTemplateSlug;
    if (slug) {
      const { buildWasteTemplateDocument } = await import('./templates/waste-management-templates');
      const doc = await buildWasteTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'invasive-species') {
    const slug = (content as any)._invasiveTemplateSlug;
    if (slug) {
      const { buildInvasiveTemplateDocument } = await import('./templates/invasive-species-templates');
      const doc = await buildInvasiveTemplateDocument(content as any, slug);
      const { Packer } = await import('docx');
      return Buffer.from(await Packer.toBuffer(doc));
    }
  }

  if (toolSlug === 'safety-alert') {
    const { buildSafetyAlertDocument } = await import('./templates/new-tools-templates');
    const doc = await buildSafetyAlertDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'carbon-footprint') {
    const { buildCarbonFootprintDocument } = await import('./templates/new-tools-templates');
    const doc = await buildCarbonFootprintDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'rams-review') {
    const { buildRamsReviewDocument } = await import('./templates/new-tools-templates');
    const doc = await buildRamsReviewDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'delay-notification') {
    const { buildDelayNotificationDocument } = await import('./templates/new-tools-templates');
    const doc = await buildDelayNotificationDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'variation-confirmation') {
    const { buildVariationConfirmationDocument } = await import('./templates/new-tools-templates');
    const doc = await buildVariationConfirmationDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'rfi-generator') {
    const { buildRfiGeneratorDocument } = await import('./templates/new-tools-templates');
    const doc = await buildRfiGeneratorDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'payment-application') {
    const { buildPaymentApplicationDocument } = await import('./templates/new-tools-templates');
    const doc = await buildPaymentApplicationDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'daywork-sheet') {
    const { buildDayworkSheetDocument } = await import('./templates/new-tools-templates');
    const doc = await buildDayworkSheetDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'carbon-reduction-plan') {
    const { buildCarbonReductionPlanDocument } = await import('./templates/new-tools-templates');
    const doc = await buildCarbonReductionPlanDocument(content as any);
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'manual-handling') {
    const mhSlug = (content as any)._manualHandlingTemplateSlug;
    let doc;
    if (mhSlug) {
      const { buildManualHandlingTemplateDocument } = await import('./templates/manual-handling-templates');
      doc = await buildManualHandlingTemplateDocument(content as any, mhSlug);
    } else {
      const { buildManualHandlingDocument } = await import('./templates/new-tools-templates');
      doc = await buildManualHandlingDocument(content as any);
    }
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  if (toolSlug === 'confined-spaces') {
    const csSlug = (content as any)._confinedSpacesTemplateSlug;
    let doc;
    if (csSlug) {
      const { buildConfinedSpacesTemplateDocument } = await import('./templates/confined-spaces-templates');
      doc = await buildConfinedSpacesTemplateDocument(content as any, csSlug);
    } else {
      // Fallback to original single template (backwards compatible)
      const { buildConfinedSpacesDocument } = await import('./templates/new-tools-templates');
      doc = await buildConfinedSpacesDocument(content as any);
    }
    const { Packer } = await import('docx');
    return Buffer.from(await Packer.toBuffer(doc));
  }

  // Generic fallback for tools without a dedicated template
  const config = getAiToolConfig(toolSlug);

  const coverPage = buildCoverPage(toolSlug, content);
  const bodyElements: (Paragraph | Table)[] = [];
  processContent(content, bodyElements, 0);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 20 },
        },
        heading1: {
          run: { font: 'Arial', size: 32, bold: true, color: EBRORA_DARK },
        },
        heading2: {
          run: { font: 'Arial', size: 26, bold: true, color: EBRORA_DARK },
        },
        heading3: {
          run: { font: 'Arial', size: 22, bold: true, color: EBRORA_DARK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(0.8),
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${config.documentLabel} | `,
                    font: 'Arial',
                    size: 16,
                    color: '999999',
                  }),
                  new TextRun({
                    text: 'Generated by Ebrora',
                    font: 'Arial',
                    size: 16,
                    color: EBRORA_GREEN,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Page ',
                    font: 'Arial',
                    size: 16,
                    color: '999999',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 16,
                    color: '999999',
                  }),
                  new TextRun({
                    text: ' | ebrora.com',
                    font: 'Arial',
                    size: 16,
                    color: EBRORA_GREEN,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...coverPage, ...bodyElements],
      },
    ],
  });

  const { Packer } = await import('docx');
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
