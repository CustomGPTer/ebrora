import {
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import { BRAND_COLORS } from '../styles';

export function createEmergencySection(
  emergencyProcedures: string,
  headerColor?: string
): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 100,
        line: 360,
      },
      children: [
        new TextRun({
          text: emergencyProcedures,
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
        before: 300,
        after: 100,
        line: 360,
      },
      children: [
        new TextRun({
          text: 'Emergency Contact Numbers',
          bold: true,
          size: 24,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  const contacts = [
    { label: 'Emergency Services', value: '999' },
    { label: 'Site Manager', value: '___________________________' },
    { label: 'First Aider', value: '___________________________' },
    { label: 'Nearest Hospital', value: '___________________________' },
  ];

  for (const contact of contacts) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 240,
        },
        children: [
          new TextRun({
            text: `${contact.label}: `,
            bold: true,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
          new TextRun({
            text: contact.value,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 300,
        after: 100,
        line: 360,
      },
      children: [
        new TextRun({
          text: 'First Aid Arrangements',
          bold: true,
          size: 24,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  const firstAidPoints = [
    'First aider on site at all times during work activities',
    'First aid box location: _________________________________',
    'Accident report procedures to be followed immediately',
    'All injuries must be recorded in the site accident book',
  ];

  for (const point of firstAidPoints) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 240,
        },
        indent: {
          left: 720,
          hanging: 360,
        },
        children: [
          new TextRun({
            text: `• ${point}`,
            size: 20,
            font: 'DM Sans',
            color: BRAND_COLORS.darkGray,
          }),
        ],
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 300,
        after: 100,
        line: 360,
      },
      children: [
        new TextRun({
          text: 'Emergency Evacuation Procedures',
          bold: true,
          size: 24,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  const evacuationPoints = [
    'Assembly point location: _________________________________',
    'Site supervisor responsible for headcount and roll call',
    'No re-entry until clearance received from emergency services',
    'All personnel must be fully briefed on evacuation procedures',
  ];

  for (const point of evacuationPoints) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 240,
        },
        indent: {
          left: 720,
          hanging: 360,
        },
        children: [
          new TextRun({
            text: `• ${point}`,
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

export function createEnvironmentalEmergencySection(
  emergencyProcedures: string,
  headerColor?: string
): Paragraph[] {
  const bgColor = headerColor || BRAND_COLORS.primary;
  const paragraphs = createEmergencySection(emergencyProcedures, headerColor);

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 300,
        after: 100,
        line: 360,
      },
      children: [
        new TextRun({
          text: 'Environmental Emergency Procedures',
          bold: true,
          size: 24,
          font: 'DM Sans',
          color: bgColor,
        }),
      ],
    })
  );

  const envPoints = [
    'Spill containment kits readily available and accessible',
    'Spill location: _________________________________',
    'Chemical storage location: _________________________________',
    'Environmental emergency contact: _________________________________',
    'Pollution control measures in place before work commences',
  ];

  for (const point of envPoints) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
          line: 240,
        },
        indent: {
          left: 720,
          hanging: 360,
        },
        children: [
          new TextRun({
            text: `• ${point}`,
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
