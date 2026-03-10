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

export function createPPESection(
  ppeRequirements: string[],
  headerColor?: string
): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs: Paragraph[] = [];

  if (ppeRequirements.length === 0) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 200,
          line: 280,
        },
        children: [
          new TextRun({
            text: 'No PPE requirements specified.',
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

  for (let i = 0; i < ppeRequirements.length; i++) {
    const requirement = ppeRequirements[i];
    const checkbox = '☐';

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 280,
        },
        indent: {
          left: 720,
          hanging: 360,
        },
        children: [
          new TextRun({
            text: `${checkbox} ${requirement}`,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

export function createPPETable(
  ppeRequirements: string[],
  headerColor?: string
): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const rows: TableRow[] = [];

  rows.push(
    new TableRow({
      height: { value: 400, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
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
                  text: '☐',
                  bold: true,
                  size: 20,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 90, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Personal Protective Equipment Required',
                  bold: true,
                  size: 20,
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
  for (const requirement of ppeRequirements) {
    const isAlternateRow = rowIndex % 2 === 0;
    const rowBgColor = isAlternateRow ? BRAND_COLORS.white : BRAND_COLORS.lightGray;

    rows.push(
      new TableRow({
        height: { value: 400, rule: 'auto' },
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '☐',
                    size: 20,
                    font: 'DM Sans',
                    color: BRAND_COLORS.darkGray,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 90, type: WidthType.PERCENTAGE },
            shading: { fill: rowBgColor, type: 'clear' },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: requirement,
                    size: 20,
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

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}
