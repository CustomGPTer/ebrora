import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from 'docx';
import { BRAND_COLORS, TABLE_CELL_PADDING } from '../styles';
import type { MethodStep } from '../types';

export function createMethodStatementSection(
  steps: MethodStep[],
  headerColor?: string
): (Paragraph | Table)[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const elements: (Paragraph | Table)[] = [];

  if (steps.length === 0) {
    elements.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 200,
          line: 280,
        },
        children: [
          new TextRun({
            text: 'No method statement steps defined.',
            italics: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.mediumGray,
          }),
        ],
      })
    );
    return elements;
  }

  const rows: TableRow[] = [];

  rows.push(
    new TableRow({
      height: { value: 500, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Step',
                  bold: true,
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Description',
                  bold: true,
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Responsible Person',
                  bold: true,
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 27, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Hazards Addressed',
                  bold: true,
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  let rowIndex = 0;
  for (const step of steps) {
    const isAlternateRow = rowIndex % 2 === 0;
    const rowBgColor = isAlternateRow ? BRAND_COLORS.white : BRAND_COLORS.lightGray;

    rows.push(
      new TableRow({
        height: { value: 600, rule: 'auto' },
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: step.stepNumber.toString(),
                    bold: true,
                    size: 20,
                    font: 'DM Sans',
                    color: bgColor,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: step.description,
                    size: 18,
                    font: 'DM Sans',
                    color: BRAND_COLORS.darkGray,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: step.responsiblePerson || 'TBD',
                    size: 18,
                    font: 'DM Sans',
                    color: BRAND_COLORS.darkGray,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 27, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: step.hazardsAddressed?.join(', ') || 'See Risk Assessment',
                    size: 18,
                    font: 'DM Sans',
                    color: BRAND_COLORS.darkGray,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    rowIndex++;
  }

  elements.push(
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    })
  );

  return elements;
}

export function createMethodStatementParagraphs(
  steps: MethodStep[],
  headerColor?: string
): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs: Paragraph[] = [];

  if (steps.length === 0) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 200,
          line: 280,
        },
        children: [
          new TextRun({
            text: 'No method statement steps defined.',
            italics: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.mediumGray,
          }),
        ],
      })
    );
    return paragraphs;
  }

  for (const step of steps) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 100,
          line: 280,
        },
        children: [
          new TextRun({
            text: `Step ${step.stepNumber}: `,
            bold: true,
            size: 22,
            font: 'DM Sans',
            color: bgColor,
          }),
          new TextRun({
            text: step.description,
            size: 22,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );

    if (step.responsiblePerson) {
      paragraphs.push(
        new Paragraph({
          spacing: {
            before: 0,
            after: 100,
            line: 240,
          },
          indent: {
            left: 720,
          },
          children: [
            new TextRun({
              text: `Responsible: ${step.responsiblePerson}`,
              italics: true,
              size: 18,
              font: 'DM Sans',
              color: BRAND_COLORS.mediumGray,
            }),
          ],
        })
      );
    }

    if (step.hazardsAddressed && step.hazardsAddressed.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: {
            before: 0,
            after: 150,
            line: 240,
          },
          indent: {
            left: 720,
          },
          children: [
            new TextRun({
              text: `Hazards addressed: ${step.hazardsAddressed.join(', ')}`,
              italics: true,
              size: 18,
              font: 'DM Sans',
              color: BRAND_COLORS.mediumGray,
            }),
          ],
        })
      );
    }
  }

  return paragraphs;
}
