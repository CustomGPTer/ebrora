import {
  AlignmentType,
  HeadingLevel,
  IStylesOptions,
  convertInchesToTwip,
  UnderlineType,
  TabStopType,
  TabStopPosition,
} from 'docx';

export const BRAND_COLORS = {
  primary: '1B5B50',
  primaryDark: '144840',
  gold: 'D4A44C',
  white: 'FFFFFF',
  lightGray: 'F5F5F5',
  mediumGray: 'E0E0E0',
  darkGray: '333333',
  red: 'C93C3C',
  amber: 'F5A623',
  green: '27AE60',
  black: '000000',
};

export const RISK_COLORS: Record<string, string> = {
  'Very Low': '27AE60',
  Low: '7ED321',
  Medium: 'F5A623',
  High: 'E74C3C',
  'Very High': 'C0392B',
  'Low (1-3)': '7ED321',
  'Medium (4-6)': 'F5A623',
  'High (7-9)': 'E74C3C',
};

export function getDocStyles(): IStylesOptions {
  return {
    default: {
      document: {
        style: 'Normal',
        size: {
          value: 22,
          unit: 'halfPoints',
        },
        font: 'DM Sans',
        color: BRAND_COLORS.darkGray,
        lineSpacing: {
          line: 360,
          lineRule: 'auto',
        },
      },
    },
    paragraphs: [
      {
        id: 'Normal',
        name: 'Normal',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 0,
          after: 200,
          line: 360,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 22,
          unit: 'halfPoints',
        },
        color: BRAND_COLORS.darkGray,
      },
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 400,
          after: 200,
          line: 360,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 32,
          unit: 'halfPoints',
        },
        bold: true,
        color: BRAND_COLORS.primary,
        outlineLevel: HeadingLevel.HEADING_1,
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 300,
          after: 150,
          line: 360,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 26,
          unit: 'halfPoints',
        },
        bold: true,
        color: BRAND_COLORS.primary,
        outlineLevel: HeadingLevel.HEADING_2,
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 200,
          after: 100,
          line: 360,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 24,
          unit: 'halfPoints',
        },
        bold: true,
        color: BRAND_COLORS.primaryDark,
        outlineLevel: HeadingLevel.HEADING_3,
      },
      {
        id: 'TableHeader',
        name: 'Table Header',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 0,
          after: 0,
          line: 240,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 20,
          unit: 'halfPoints',
        },
        bold: true,
        color: BRAND_COLORS.white,
      },
      {
        id: 'TableCell',
        name: 'Table Cell',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 50,
          after: 50,
          line: 240,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 20,
          unit: 'halfPoints',
        },
        color: BRAND_COLORS.darkGray,
      },
      {
        id: 'BulletPoint',
        name: 'Bullet Point',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 0,
          after: 100,
          line: 240,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 20,
          unit: 'halfPoints',
        },
        color: BRAND_COLORS.darkGray,
      },
      {
        id: 'DocumentTitle',
        name: 'Document Title',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 0,
          after: 200,
          line: 360,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 36,
          unit: 'halfPoints',
        },
        bold: true,
        color: BRAND_COLORS.primary,
        alignment: AlignmentType.CENTER,
      },
      {
        id: 'DocumentReference',
        name: 'Document Reference',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 0,
          after: 100,
          line: 240,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 18,
          unit: 'halfPoints',
        },
        color: BRAND_COLORS.mediumGray,
        alignment: AlignmentType.CENTER,
      },
      {
        id: 'Signature',
        name: 'Signature Line',
        basedOn: 'Normal',
        next: 'Normal',
        spacing: {
          before: 400,
          after: 0,
          line: 240,
          lineRule: 'auto',
        },
        font: 'DM Sans',
        size: {
          value: 20,
          unit: 'halfPoints',
        },
        color: BRAND_COLORS.darkGray,
        border: {
          bottom: {
            color: BRAND_COLORS.darkGray,
            space: 1,
            style: 'single',
            size: 6,
          },
        },
      },
    ],
  };
}

export function getRiskRatingColor(rating: string): string {
  for (const [key, value] of Object.entries(RISK_COLORS)) {
    if (rating.includes(key) || key.includes(rating)) {
      return value;
    }
  }
  return BRAND_COLORS.mediumGray;
}

export const DEFAULT_MARGINS = {
  top: convertInchesToTwip(0.75),
  bottom: convertInchesToTwip(0.75),
  left: convertInchesToTwip(0.75),
  right: convertInchesToTwip(0.75),
};

export const TABLE_CELL_PADDING = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
};

export const DOCUMENT_MARGINS = {
  top: convertInchesToTwip(0.75),
  bottom: convertInchesToTwip(0.75),
  left: convertInchesToTwip(0.75),
  right: convertInchesToTwip(0.75),
};
