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
        // Split into paragraphs at double newlines
        const paras = value.split(/\n\n+/).filter(Boolean);
        for (const p of paras) {
          elements.push(bodyText(p.trim()));
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
    const { buildCoshhDocument } = await import('./templates/coshh-template');
    const doc = await buildCoshhDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'incident-report') {
    const { buildIncidentReportDocument } = await import('./templates/incident-report-template');
    const doc = await buildIncidentReportDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'lift-plan') {
    const { buildLiftPlanDocument } = await import('./templates/lift-plan-template');
    const doc = await buildLiftPlanDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'emergency-response') {
    const { buildEmergencyResponseDocument } = await import('./templates/emergency-response-template');
    const doc = await buildEmergencyResponseDocument(content as any);
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
    const { buildScopeOfWorksDocument } = await import('./templates/scope-of-works-template');
    const doc = await buildScopeOfWorksDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'permit-to-dig') {
    const { buildPermitToDigDocument } = await import('./templates/permit-to-dig-template');
    const doc = await buildPermitToDigDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'powra') {
    const { buildPowraDocument } = await import('./templates/powra-template');
    const doc = await buildPowraDocument(content as any);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  if (toolSlug === 'early-warning') {
    const { buildEarlyWarningDocument } = await import('./templates/early-warning-template');
    const doc = await buildEarlyWarningDocument(content as any);
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
