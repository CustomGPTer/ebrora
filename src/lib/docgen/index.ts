export { buildRamsDocument, buildRamsDocumentStream } from './builder';
export { FORMAT_CONFIGS, getFormatConfig, getAllFormats, getFreeFormats, getPaidFormats } from './format-configs';
export { getDocStyles, BRAND_COLORS, RISK_COLORS, getRiskRatingColor, DEFAULT_MARGINS, TABLE_CELL_PADDING, DOCUMENT_MARGINS } from './styles';
export {
  calculateRiskScore5x5,
  calculateRiskScore3x3,
  calculateRiskScoreHML,
  getRiskMatrixTable5x5,
  getRiskMatrixTable3x3,
  generateRiskMatrix5x5Visual,
  generateRiskMatrix3x3Visual,
  type RiskScore,
} from './risk-matrix';
export type {
  RamsDocumentData,
  GeneratedContent,
  HazardEntry,
  MethodStep,
  EnvironmentalHazard,
  FireWorksDetail,
  RiskMatrixEntry,
  FormatConfig,
  SectionConfig,
} from './types';

export {
  createHeaderSection,
  createSubHeader,
  createSimpleHeader,
} from './sections/header-section';
export { createInfoTable } from './sections/info-table';
export { createRiskAssessmentTable } from './sections/risk-assessment';
export { createMethodStatementSection, createMethodStatementParagraphs } from './sections/method-statement';
export { createPPESection, createPPETable } from './sections/ppe-section';
export { createSignaturesTable, createSignaturesParagraphs } from './sections/signatures';
export { createEmergencySection, createEnvironmentalEmergencySection } from './sections/emergency-section';
export {
  createRiskMatrix5x5Visual,
  createRiskMatrix3x3Visual,
  createRiskMatrixLegend,
} from './sections/risk-matrix-visual';
