import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from 'docx';
import { BRAND_COLORS, TABLE_CELL_PADDING } from '../styles';
import type { HazardEntry } from '../types';

export function createRiskAssessmentTable(
  hazards: HazardEntry[],
  includeResidual: boolean = true,
  headerColor?: string
): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const rows: TableRow[] = [];

  const headerCells = [
    { text: 'No.', width: 5 },
    { text: 'Hazard', width: 12 },
    { text: 'Risk', width: 12 },
    { text: 'L', width: 5 },
    { text: 'S', width: 5 },
    { text: 'Rating', width: 10 },
    { text: 'Control Measures', width: 15 },
  ];

  if (includeResidual) {
    headerCells.push(
      { text: 'Residual L', width: 8 },
      { text: 'Residual S', width: 8 },
      { text: 'Residual Rating', width: 12 }
    );
  }

  rows.push(
    new TableRow({
      height: { value: 500, rule: 'auto' },
      children: headerCells.map(
        (cell) =>
          new TableCell({
            width: { size: cell.width, type: WidthType.PERCENTAGE },
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
                    text: cell.text,
                    bold: true,
                    size: 18,
                    font: 'DM Sans',
                    color: BRAND_COLORS.white,
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  let rowIndex = 0;
  for (const hazard of hazards) {
    const isAlternateRow = rowIndex % 2 === 0;
    const rowBgColor = isAlternateRow ? BRAND_COLORS.white : BRAND_COLORS.lightGray;

    const ratingColor = hazard.riskRating
      .toLowerCase()
      .includes('very high')
      ? 'C0392B'
      : hazard.riskRating.toLowerCase().includes('high')
        ? 'E74C3C'
        : hazard.riskRating.toLowerCase().includes('medium')
          ? 'F5A623'
          : hazard.riskRating.toLowerCase().includes('low')
            ? '7ED321'
            : '27AE60';

    const cells = [
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: hazard.id.toString(),
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: hazard.hazard,
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: hazard.risk,
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: hazard.likelihood.toString(),
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: hazard.severity.toString(),
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: {
          fill: ratingColor,
          type: 'clear',
        },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: hazard.riskRating,
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
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: rowBgColor, type: 'clear' },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: hazard.controls,
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
    ];

    if (includeResidual) {
      const residualRatingColor = hazard.residualRiskRating
        ? hazard.residualRiskRating.toLowerCase().includes('very high')
          ? 'C0392B'
          : hazard.residualRiskRating.toLowerCase().includes('high')
            ? 'E74C3C'
            : hazard.residualRiskRating.toLowerCase().includes('medium')
              ? 'F5A623'
              : hazard.residualRiskRating.toLowerCase().includes('low')
                ? '7ED321'
                : '27AE60'
        : 'E0E0E0';

      cells.push(
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
                  text: hazard.residualLikelihood?.toString() || '-',
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.darkGray,
                }),
              ],
            }),
          ],
        }),
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
                  text: hazard.residualSeverity?.toString() || '-',
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.darkGray,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: {
            fill: residualRatingColor,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: hazard.residualRiskRating || '-',
                  bold: true,
                  size: 18,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        })
      );
    }

    rows.push(
      new TableRow({
        height: { value: 600, rule: 'auto' },
        children: cells,
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
