import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from 'docx';
import { BRAND_COLORS, TABLE_CELL_PADDING } from '../styles';
import type { GeneratedContent } from '../types';

export function createInfoTable(content: GeneratedContent, headerColor?: string): Table {
  const bgColor = headerColor || BRAND_COLORS.primary;

  const rows: TableRow[] = [];

  rows.push(
    new TableRow({
      height: { value: 400, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: {
            fill: bgColor,
            type: 'clear',
          },
          verticalAlign: VerticalAlign.CENTER,
          margins: TABLE_CELL_PADDING,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Project Title',
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
          width: { size: 70, type: WidthType.PERCENTAGE },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content.projectTitle,
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

  rows.push(
    new TableRow({
      height: { value: 400, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
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
                  text: 'Site Address',
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
          width: { size: 70, type: WidthType.PERCENTAGE },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content.siteAddress,
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

  rows.push(
    new TableRow({
      height: { value: 400, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: {
            fill: BRAND_COLORS.white,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Principal Contractor',
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
          width: { size: 70, type: WidthType.PERCENTAGE },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content.principalContractor,
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

  rows.push(
    new TableRow({
      height: { value: 400, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
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
                  text: 'Responsible Supervisor',
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
          width: { size: 70, type: WidthType.PERCENTAGE },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content.supervisor,
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

  rows.push(
    new TableRow({
      height: { value: 500, rule: 'auto' },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: {
            fill: BRAND_COLORS.white,
            type: 'clear',
          },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Activity Description',
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
          width: { size: 70, type: WidthType.PERCENTAGE },
          margins: TABLE_CELL_PADDING,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content.activityDescription,
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

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}
