// src/data/guides/index.ts
import type { GuideSection } from './types';
import rawData from './wwtw-guide-data.json';

export type { GuideSection, GuideSubsystem, GuideSubsection, GuideData } from './types';

export const wwtwGuideSections: GuideSection[] = rawData as GuideSection[];

export const GUIDE_META = {
  slug: 'wwtw-design-safety-quality',
  title: 'Design, Safety & Quality Guide',
  subtitle: 'Practical guidance for design, construction & commissioning of UK wastewater treatment works',
  edition: 'Edition 1 · 2025',
  sectionCount: rawData.length,
} as const;
