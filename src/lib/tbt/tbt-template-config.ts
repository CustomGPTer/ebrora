// =============================================================================
// TBT Builder — Template Configuration
// 9 templates (T4 Dark Premium excluded). Free: T1 + T2.
// =============================================================================
import { TbtTemplateConfig, TbtTemplateSlug } from './tbt-types';

export const TBT_TEMPLATE_CONFIGS: Record<TbtTemplateSlug, TbtTemplateConfig> = {
  'ebrora-branded': {
    slug: 'ebrora-branded',
    displayName: 'Ebrora Branded',
    description: 'Professional green-branded layout with numbered sections, tinted icon squares, and a clean attendance grid. The standard Ebrora toolbox talk format.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/tbt-templates/thumb-ebrora-branded.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-ebrora-branded-p1.jpg',
      '/product-images/tbt-templates/preview-ebrora-branded-p2.jpg',
    ],
    keySections: ['Numbered Sections', 'Ebrora Branded Header', 'PPE Icons', 'Attendance Grid'],
  },
  'red-safety': {
    slug: 'red-safety',
    displayName: 'Red Safety',
    description: 'Bold hazard-first design with red header banner, black meta bar, hazard warning callouts, and a strong visual safety identity. Built to grab attention.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/tbt-templates/thumb-red-safety.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-red-safety-p1.jpg',
      '/product-images/tbt-templates/preview-red-safety-p2.jpg',
    ],
    keySections: ['Hazard Warning Bar', 'Red Section Headings', 'Warning Callout Boxes', 'Attendance Grid'],
  },
  'editorial': {
    slug: 'editorial',
    displayName: 'Editorial',
    description: 'Clean, minimal layout with large serif headings, generous whitespace, and pull-quote blocks. Feels like a professional publication — ideal for office-based briefings.',
    pageCount: 1,
    layout: 'standard',
    thumbnailPath: '/product-images/tbt-templates/thumb-editorial.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-editorial-p1.jpg',
    ],
    keySections: ['Serif Title Typography', 'Colour Divider', 'Pull-Quote Block', 'Minimal Footer'],
  },
  'sidebar': {
    slug: 'sidebar',
    displayName: 'Sidebar',
    description: 'Two-column layout with a green sidebar containing title, meta details, and PPE requirements. Main content area on the right. Efficient use of space.',
    pageCount: 1,
    layout: 'sidebar',
    thumbnailPath: '/product-images/tbt-templates/thumb-sidebar.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-sidebar-p1.jpg',
    ],
    keySections: ['Green Info Sidebar', 'PPE Requirement List', 'Numbered Content Sections', 'Discussion Points'],
  },
  'magazine': {
    slug: 'magazine',
    displayName: 'Magazine',
    description: 'Newspaper-style layout with centred masthead, two-column body text, and editorial pull-quotes. Content-dense — fits a lot on one page while staying readable.',
    pageCount: 1,
    layout: 'two-column',
    thumbnailPath: '/product-images/tbt-templates/thumb-magazine.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-magazine-p1.jpg',
    ],
    keySections: ['Centred Masthead', 'Two-Column Body', 'Pull-Quote Highlights', 'Column Rules'],
  },
  'blueprint': {
    slug: 'blueprint',
    displayName: 'Blueprint',
    description: 'Technical spec-style layout with monospace font, navy header, and panelled sections. Looks like a technical document — appeals to engineers and project managers.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/tbt-templates/thumb-blueprint.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-blueprint-p1.jpg',
      '/product-images/tbt-templates/preview-blueprint-p2.jpg',
    ],
    keySections: ['Monospace Typography', 'Navy Header Band', 'Bordered Section Panels', 'Technical Reference Bar'],
  },
  'rag-bands': {
    slug: 'rag-bands',
    displayName: 'RAG Bands',
    description: 'Colour-coded sections using Red (hazards), Amber (controls), Green (safe behaviour), and Blue (emergency). Visually intuitive traffic-light risk escalation.',
    pageCount: 2,
    layout: 'banded',
    thumbnailPath: '/product-images/tbt-templates/thumb-rag-bands.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-rag-bands-p1.jpg',
      '/product-images/tbt-templates/preview-rag-bands-p2.jpg',
    ],
    keySections: ['Red Hazard Band', 'Amber Control Band', 'Green Safe Behaviour Band', 'Blue Emergency Band'],
  },
  'card-based': {
    slug: 'card-based',
    displayName: 'Card-Based',
    description: 'Modern card-based layout with rounded content sections on a light grey background. Each section sits in its own card. Clean, approachable, and easy to scan.',
    pageCount: 2,
    layout: 'card',
    thumbnailPath: '/product-images/tbt-templates/thumb-card-based.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-card-based-p1.jpg',
      '/product-images/tbt-templates/preview-card-based-p2.jpg',
    ],
    keySections: ['Title Card', 'Meta Info Cards', 'Rounded Content Cards', 'Icon Section Headers'],
  },
  'hazard-industrial': {
    slug: 'hazard-industrial',
    displayName: 'Hazard Industrial',
    description: 'Yellow-and-black construction-site design with hazard stripe bars, diamond icon header, and caution callout boxes. Unmistakably a safety document.',
    pageCount: 2,
    layout: 'standard',
    thumbnailPath: '/product-images/tbt-templates/thumb-hazard-industrial.jpg',
    previewPaths: [
      '/product-images/tbt-templates/preview-hazard-industrial-p1.jpg',
      '/product-images/tbt-templates/preview-hazard-industrial-p2.jpg',
    ],
    keySections: ['Hazard Stripe Bar', 'Diamond Warning Icon', 'Yellow Meta Bar', 'Caution Callout Boxes'],
  },
};

/** Get config by slug */
export function getTbtTemplateConfig(slug: TbtTemplateSlug): TbtTemplateConfig {
  return TBT_TEMPLATE_CONFIGS[slug];
}

/** Validate slug */
export function isValidTbtTemplateSlug(slug: string): slug is TbtTemplateSlug {
  return slug in TBT_TEMPLATE_CONFIGS;
}
