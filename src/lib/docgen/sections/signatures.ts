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

interface SignatureField {
  role: string;
  name: string;
  signature: string;
  date: string;
}

export function createSignaturesTable(
  headerColor?: string,
  documentDate?: Date
): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const rows: TableRow[] = [];

  const signatureFields: SignatureField[] = [
    {
      role: 'Prepared By',
      name: '',
      signature: '',
      date: '',
    },
    {
      role: 'Reviewed By',
      name: '',
      signature: '',
      date: '',
    },
    {
      role: 'Approved By',
      name: '',
      signature: '',
      date: '',
    },
  ];

  rows.push(
    new TableRow({
      height: { value: 500, rule: 'auto' },
      children: [
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
                  text: 'Role',
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
                  text: 'Name (Print)',
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
                  text: 'Signature',
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
                  text: 'Date',
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

  for (const field of signatureFields) {
    rows.push(
      new TableRow({
        height: { value: 800, rule: 'auto' },
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: {
              fill: BRAND_COLORS.lightGray,
              type: 'clear',
            },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: field.role,
                    bold: true,
                    size: 20,
                    font: 'DM Sans',
                    color: BRAND_COLORS.darkGray,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: {
              fill: BRAND_COLORS.white,
              type: 'clear',
            },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                border: {
                  bottom: {
                    color: BRAND_COLORS.darkGray,
                    space: 1,
                    style: 'single',
                    size: 6,
                  },
                },
                children: [
                  new TextRun({
                    text: '',
                    size: 20,
                    font: 'DM Sans',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: {
              fill: BRAND_COLORS.white,
              type: 'clear',
            },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                border: {
                  bottom: {
                    color: BRAND_COLORS.darkGray,
                    space: 1,
                    style: 'single',
                    size: 6,
                  },
                },
                children: [
                  new TextRun({
                    text: '',
                    size: 20,
                    font: 'DM Sans',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: {
              fill: BRAND_COLORS.white,
              type: 'clear',
            },
            margins: TABLE_CELL_PADDING,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                border: {
                  bottom: {
                    color: BRAND_COLORS.darkGray,
                    space: 1,
                    style: 'single',
                    size: 6,
                  },
                },
                children: [
                  new TextRun({
                    text: '',
                    size: 20,
                    font: 'DM Sans',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}

export function createSignaturesParagraphs(): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const roles = ['Prepared By', 'Reviewed By', 'Approved By'];

  for (const role of roles) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 400,
          after: 100,
          line: 360,
        },
        children: [
          new TextRun({
            text: role,
            bold: true,
            size: 22,
            font: 'DM Sans',
            color: BRAND_COLORS.primary,
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 0,
          after: 50,
          line: 240,
        },
        children: [
          new TextRun({
            text: 'Name: ',
            bold: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 0,
          after: 50,
          line: 240,
        },
        border: {
          bottom: {
            color: BRAND_COLORS.darkGray,
            space: 1,
            style: 'single',
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: '',
            size: 20,
            font: 'DM Sans',
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 150,
          after: 50,
          line: 240,
        },
        children: [
          new TextRun({
            text: 'Signature: ',
            bold: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 0,
          after: 50,
          line: 240,
        },
        border: {
          bottom: {
            color: BRAND_COLORS.darkGray,
            space: 1,
            style: 'single',
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: '',
            size: 20,
            font: 'DM Sans',
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 150,
          after: 50,
          line: 240,
        },
        children: [
          new TextRun({
            text: 'Date: ',
            bold: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );

    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 0,
          after: 200,
          line: 240,
        },
        border: {
          bottom: {
            color: BRAND_COLORS.darkGray,
            space: 1,
            style: 'single',
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: '',
            size: 20,
            font: 'DM Sans',
          }),
        ],
      })
    );
  }

  return paragraphs;
}
