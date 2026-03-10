import {
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { BRAND_COLORS } from '../styles';

export function createHeaderSection(
  formatName: string,
  documentReference: string,
  revisionNumber: string,
  generationDate: Date,
  companyName?: string,
  headerColor?: string
): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs: Paragraph[] = [];

  const dateString = generationDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 0,
        after: 100,
        line: 240,
      },
      border: {
        bottom: {
          color: bgColor,
          space: 1,
          style: BorderStyle.DOUBLE,
          size: 24,
        },
      },
      children: [],
    })
  );

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 0,
        line: 360,
      },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: companyName || 'Ebrora',
          bold: true,
          size: 28,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 100,
        after: 200,
        line: 360,
      },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: formatName,
          bold: true,
          size: 32,
          font: 'DM Sans',
          color: bgColor,
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
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Reference: ${documentReference}`,
          size: 20,
          font: 'DM Sans',
          color: BRAND_COLORS.mediumGray,
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
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Revision: ${revisionNumber}`,
          size: 20,
          font: 'DM Sans',
          color: BRAND_COLORS.mediumGray,
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 0,
        after: 300,
        line: 240,
      },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Date: ${dateString}`,
          size: 20,
          font: 'DM Sans',
          color: BRAND_COLORS.mediumGray,
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
          color: bgColor,
          space: 1,
          style: BorderStyle.DOUBLE,
          size: 24,
        },
      },
      children: [],
    })
  );

  return paragraphs;
}

export function createSubHeader(title: string, headerColor?: string): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;

  return [
    new Paragraph({
      spacing: {
        before: 300,
        after: 150,
        line: 360,
      },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 26,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    }),
  ];
}

export function createSimpleHeader(
  text: string,
  color?: string
): Paragraph[] {
  return [
    new Paragraph({
      spacing: {
        before: 200,
        after: 150,
        line: 360,
      },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 26,
          font: 'DM Sans',
          color: color || BRAND_COLORS.primary,
        }),
      ],
    }),
  ];
}
