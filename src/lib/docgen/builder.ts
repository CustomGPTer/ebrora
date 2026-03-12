import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FORMAT_CONFIGS } from './format-configs';
import { getDocStyles, DOCUMENT_MARGINS } from './styles';
import type { RamsDocumentData } from './types';
import { createHeaderSection, createSimpleHeader } from './sections/header-section';
import { createInfoTable } from './sections/info-table';
import { createRiskAssessmentTable } from './sections/risk-assessment';
import { createMethodStatementSection } from './sections/method-statement';
import { createPPETable } from './sections/ppe-section';
import { createSignaturesTable } from './sections/signatures';
import { createEmergencySection, createEnvironmentalEmergencySection } from './sections/emergency-section';
import { createRiskMatrix5x5Visual, createRiskMatrix3x3Visual, createRiskMatrixLegend } from './sections/risk-matrix-visual';

export async function buildRamsDocument(data: RamsDocumentData): Promise<Buffer> {
  const config = FORMAT_CONFIGS[data.formatSlug];

  if (!config) {
    throw new Error(`Unknown format: ${data.formatSlug}`);
  }

  const children: (Paragraph | any)[] = [];
  const headerColor = config.headerColor;

  for (const section of config.sections) {
    if (!section.required) {
      continue;
    }

    switch (section.type) {
      case 'header':
        children.push(
          ...createHeaderSection(
            config.name,
            `RAMS-${Date.now()}`,
            '1.0',
            data.generationDate,
            data.companyName,
            headerColor
          )
        );
        break;

      case 'info-table':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createInfoTable(data.generatedContent, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'risk-assessment':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createRiskAssessmentTable(data.generatedContent.hazards, config.hasResidualRisk, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'risk-matrix':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (config.riskScale === '5x5') {
          children.push(createRiskMatrix5x5Visual(headerColor));
        } else if (config.riskScale === '3x3') {
          children.push(createRiskMatrix3x3Visual(headerColor));
        }
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [],
          })
        );
        children.push(...createRiskMatrixLegend(headerColor));
        break;

      case 'method-statement':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(...createMethodStatementSection(data.generatedContent.methodStatementSteps, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'ppe':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createPPETable(data.generatedContent.ppeRequirements, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'emergency':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (config.hasEnvironmental) {
          children.push(...createEnvironmentalEmergencySection(data.generatedContent.emergencyProcedures, headerColor));
        } else {
          children.push(...createEmergencySection(data.generatedContent.emergencyProcedures, headerColor));
        }
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'signatures':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createSignaturesTable(headerColor, data.generationDate));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'fire-permit':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (data.generatedContent.fireWorksDetails) {
          const fireDetails = data.generatedContent.fireWorksDetails;
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({
                  text: `Hot Work Type: ${fireDetails.hotWorkType}`,
                  size: 20,
                  font: 'DM Sans',
                }),
              ],
            })
          );
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({
                  text: `Location: ${fireDetails.location}`,
                  size: 20,
                  font: 'DM Sans',
                }),
              ],
            })
          );
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({
                  text: `Duration: ${fireDetails.duration}`,
                  size: 20,
                  font: 'DM Sans',
                }),
              ],
            })
          );
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 200 },
              children: [
                new TextRun({
                  text: `Fire Watch Required: ${fireDetails.fireWatchRequired ? 'Yes' : 'No'}`,
                  size: 20,
                  font: 'DM Sans',
                }),
              ],
            })
          );
        }
        break;

      case 'environmental':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (data.generatedContent.environmentalHazards) {
          for (const envHazard of data.generatedContent.environmentalHazards) {
            children.push(
              new Paragraph({
                spacing: { before: 100, after: 50 },
                children: [
                  new TextRun({
                    text: `Hazard: ${envHazard.hazard}`,
                    bold: true,
                    size: 20,
                    font: 'DM Sans',
                  }),
                ],
              })
            );
            children.push(
              new Paragraph({
                spacing: { before: 50, after: 50 },
                children: [
                  new TextRun({
                    text: `Impact: ${envHazard.impact}`,
                    size: 18,
                    font: 'DM Sans',
                  }),
                ],
              })
            );
            children.push(
              new Paragraph({
                spacing: { before: 50, after: 150 },
                children: [
                  new TextRun({
                    text: `Mitigation: ${envHazard.mitigation}`,
                    size: 18,
                    font: 'DM Sans',
                  }),
                ],
              })
            );
          }
        }
        break;

      case 'notes':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 200 },
            children: [
              new TextRun({
                text: data.generatedContent.additionalNotes || 'No additional notes.',
                size: 20,
                font: 'DM Sans',
              }),
            ],
          })
        );
        break;

      case 'checklist':
      default:
        break;
    }
  }

  const doc = new Document({
    styles: getDocStyles(),
    sections: [
      {
        properties: {
          page: {
            margin: DOCUMENT_MARGINS,
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildRamsDocumentStream(data: RamsDocumentData): Promise<any> {
  const config = FORMAT_CONFIGS[data.formatSlug];

  if (!config) {
    throw new Error(`Unknown format: ${data.formatSlug}`);
  }

  const children: (Paragraph | any)[] = [];
  const headerColor = config.headerColor;

  for (const section of config.sections) {
    if (!section.required) {
      continue;
    }

    switch (section.type) {
      case 'header':
        children.push(
          ...createHeaderSection(
            config.name,
            `RAMS-${Date.now()}`,
            '1.0',
            data.generationDate,
            data.companyName,
            headerColor
          )
        );
        break;

      case 'info-table':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createInfoTable(data.generatedContent, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'risk-assessment':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createRiskAssessmentTable(data.generatedContent.hazards, config.hasResidualRisk, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'risk-matrix':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (config.riskScale === '5x5') {
          children.push(createRiskMatrix5x5Visual(headerColor));
        } else if (config.riskScale === '3x3') {
          children.push(createRiskMatrix3x3Visual(headerColor));
        }
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [],
          })
        );
        children.push(...createRiskMatrixLegend(headerColor));
        break;

      case 'method-statement':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(...createMethodStatementSection(data.generatedContent.methodStatementSteps, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'ppe':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createPPETable(data.generatedContent.ppeRequirements, headerColor));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'emergency':
        children.push(...createSimpleHeader(section.title, headerColor));
        if (config.hasEnvironmental) {
          children.push(...createEnvironmentalEmergencySection(data.generatedContent.emergencyProcedures, headerColor));
        } else {
          children.push(...createEmergencySection(data.generatedContent.emergencyProcedures, headerColor));
        }
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;

      case 'signatures':
        children.push(...createSimpleHeader(section.title, headerColor));
        children.push(createSignaturesTable(headerColor, data.generationDate));
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200 },
            children: [],
          })
        );
        break;
    }
  }

  const doc = new Document({
    styles: getDocStyles(),
    sections: [
      {
        properties: {
          page: {
            margin: DOCUMENT_MARGINS,
          },
        },
        children,
      },
    ],
  });

  return Packer.toStream(doc);
}
