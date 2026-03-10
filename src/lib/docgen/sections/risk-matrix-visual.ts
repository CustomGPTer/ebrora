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
import {
  generateRiskMatrix5x5Visual,
  generateRiskMatrix3x3Visual,
} from '../risk-matrix';
import { BRAND_COLORS, TABLE_CELL_PADDING } from '../styles';

export function createRiskMatrix5x5Visual(headerColor?: string): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const matrix = generateRiskMatrix5x5Visual();
  const rows: TableRow[] = [];

  const headerRow: TableCell[] = [
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
              text: 'S / L',
              bold: true,
              size: 18,
              font: 'DM Sans',
              color: BRAND_COLORS.white,
            }),
          ],
        }),
      ],
    }),
  ];

  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    headerRow.push(
      new TableCell({
        width: { size: 18.4, type: WidthType.PERCENTAGE },
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
                text: `L${likelihood}`,
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

  rows.push(new TableRow({ height: { value: 400, rule: 'auto' }, children: headerRow }));

  const severityLevels = [5, 4, 3, 2, 1];

  for (const severity of severityLevels) {
    const rowCells: TableCell[] = [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: {
          fill: BRAND_COLORS.lightGray,
          type: 'clear',
        },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `S${severity}`,
                bold: true,
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
    ];

    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const cell = matrix[severity][likelihood];
      rowCells.push(
        new TableCell({
          width: { size: 18.4, type: WidthType.PERCENTAGE },
          shading: {
            fill: cell.color,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: cell.rating,
                  bold: true,
                  size: 16,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        })
      );
    }

    rows.push(new TableRow({ height: { value: 400, rule: 'auto' }, children: rowCells }));
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}

export function createRiskMatrix3x3Visual(headerColor?: string): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const matrix = generateRiskMatrix3x3Visual();
  const rows: TableRow[] = [];

  const headerRow: TableCell[] = [
    new TableCell({
      width: { size: 12, type: WidthType.PERCENTAGE },
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
              text: 'S / L',
              bold: true,
              size: 18,
              font: 'DM Sans',
              color: BRAND_COLORS.white,
            }),
          ],
        }),
      ],
    }),
  ];

  for (let likelihood = 1; likelihood <= 3; likelihood++) {
    headerRow.push(
      new TableCell({
        width: { size: 29.3, type: WidthType.PERCENTAGE },
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
                text: `L${likelihood}`,
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

  rows.push(new TableRow({ height: { value: 400, rule: 'auto' }, children: headerRow }));

  const severityLevels = [3, 2, 1];

  for (const severity of severityLevels) {
    const rowCells: TableCell[] = [
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: {
          fill: BRAND_COLORS.lightGray,
          type: 'clear',
        },
        margins: TABLE_CELL_PADDING,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `S${severity}`,
                bold: true,
                size: 18,
                font: 'DM Sans',
                color: BRAND_COLORS.darkGray,
              }),
            ],
          }),
        ],
      }),
    ];

    for (let likelihood = 1; likelihood <= 3; likelihood++) {
      const cell = matrix[severity][likelihood];
      rowCells.push(
        new TableCell({
          width: { size: 29.3, type: WidthType.PERCENTAGE },
          shading: {
            fill: cell.color,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: cell.rating,
                  bold: true,
                  size: 16,
                  font: 'DM Sans',
                  color: BRAND_COLORS.white,
                }),
              ],
            }),
          ],
        })
      );
    }

    rows.push(new TableRow({ height: { value: 400, rule: 'auto' }, children: rowCells }));
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}

export function createRiskMatrixLegend(headerColor?: string): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 150,
        line: 360,
      },
      children: [
        new TextRun({
          text: 'Risk Rating Legend',
          bold: true,
          size: 22,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  const ratings = [
    { label: 'Very Low', color: '27AE60' },
    { label: 'Low', color: '7ED321' },
    { label: 'Medium', color: 'F5A623' },
    { label: 'High', color: 'E74C3C' },
    { label: 'Very High', color: 'C0392B' },
  ];

  for (const rating of ratings) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 240,
        },
        children: [
          new TextRun({
            text: '█ ',
            color: rating.color,
            size: 22,
            font: 'DM Sans',
          }),
          new TextRun({
            text: rating.label,
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
