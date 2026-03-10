export interface RamsFormatInfo {
  id: number;
  name: string;
  slug: string;
  scoringType: string;
  description: string;
  isFree: boolean;
}

export const RAMS_FORMATS: RamsFormatInfo[] = [
  {
    id: 1,
    name: 'Standard 5×5',
    slug: 'standard-5x5',
    scoringType: '5×5 L×S',
    description: 'Classic 5×5 likelihood × severity matrix. Industry standard risk scoring.',
    isFree: true,
  },
  {
    id: 2,
    name: 'H/M/L Simple',
    slug: 'hml-simple',
    scoringType: 'H/M/L',
    description: 'High/Medium/Low ratings with 3×3 matrix. Quick and simple.',
    isFree: true,
  },
  {
    id: 3,
    name: 'Tier 1 Formal',
    slug: 'tier-1-formal',
    scoringType: '5×5 + Legend',
    description: 'Full formal layout with 5×5 scoring, risk matrix legend, approval chain.',
    isFree: false,
  },
  {
    id: 4,
    name: 'CDM Compliant',
    slug: 'cdm-compliant',
    scoringType: '5×5 L×S + CDM',
    description: '5×5 scoring with CDM 2015 duty holder fields and resources section.',
    isFree: false,
  },
  {
    id: 5,
    name: 'Civils & Infrastructure',
    slug: 'civils-infrastructure',
    scoringType: '5×5 Banded',
    description: '5×5 banded scoring with HSG47, Temporary Works, environmental section.',
    isFree: false,
  },
  {
    id: 6,
    name: 'Narrative',
    slug: 'narrative',
    scoringType: 'Descriptive',
    description: 'Descriptive risk ratings. Paragraph-style method statement for client submission.',
    isFree: false,
  },
  {
    id: 7,
    name: 'Compact',
    slug: 'compact',
    scoringType: '3×3 + Legend',
    description: '3×3 scoring with legend. Two-page layout for lower-risk activities.',
    isFree: false,
  },
  {
    id: 8,
    name: 'M&E Works',
    slug: 'me-works',
    scoringType: '5×5 L×S',
    description: '5×5 scoring with isolation/LOTO sections, per-hazard PPE assignment.',
    isFree: false,
  },
  {
    id: 9,
    name: 'RPN',
    slug: 'rpn',
    scoringType: 'L×S×D',
    description: 'Likelihood × Severity × Detectability. Risk Priority Number with action bands.',
    isFree: false,
  },
  {
    id: 10,
    name: 'Principal Contractor',
    slug: 'principal-contractor',
    scoringType: '5×5 Colour',
    description: '5×5 colour-coded. Full PC submission format with approval sections.',
    isFree: false,
  },
];
