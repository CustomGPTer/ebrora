// =============================================================================
// Visualise — Custom Construction Icons
// Hand-built SVG icons specific to UK construction work.
// 24×24 viewBox, stroke-width 2, style-matched to Lucide.
//
// Batch 1 ships 5 icons as the initial stub. The full 30-icon set expands
// in a later batch:
//   hardhat, excavator, crane, scaffold, cone, barrier, permit, rams,
//   hazard-triangle, high-vis-vest, safety-boots, harness, gloves,
//   ear-defenders, respirator, fire-extinguisher, first-aid, confined-space,
//   lifting-hook, spoil-heap, manhole, pipe, concrete-mixer, dumper-truck,
//   traffic-light, sign-diversion, tape-measure, spirit-level,
//   clipboard-tick, clipboard-cross
// =============================================================================

import type { ReactElement } from 'react';

export interface ConstructionIconDef {
  /** Kebab-case identifier used by AI prompts and preset data. */
  name: string;
  /** SVG viewBox — always 0 0 24 24 for this set. */
  viewBox: string;
  /** SVG inner markup. Uses currentColor for strokes/fills so it inherits CSS color. */
  inner: string;
  /** Human label for icon pickers. */
  label: string;
}

export const CONSTRUCTION_ICONS: Record<string, ConstructionIconDef> = {
  hardhat: {
    name: 'hardhat',
    viewBox: '0 0 24 24',
    label: 'Hard hat',
    inner: `
      <path d="M3 18 H21 V20 H3 Z" fill="currentColor" stroke="none"/>
      <path d="M4 18 C4 12 7.5 8 12 8 C16.5 8 20 12 20 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M10 8 V5 H14 V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },

  excavator: {
    name: 'excavator',
    viewBox: '0 0 24 24',
    label: 'Excavator',
    inner: `
      <rect x="3" y="16" width="14" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="6" cy="20" r="1" fill="currentColor"/>
      <circle cx="14" cy="20" r="1" fill="currentColor"/>
      <path d="M8 16 V11 H14 V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14 11 L20 6 L22 8 L18 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M17 13 L20 16 L16 16 Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    `,
  },

  cone: {
    name: 'cone',
    viewBox: '0 0 24 24',
    label: 'Traffic cone',
    inner: `
      <path d="M12 3 L7 20 H17 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <line x1="9.5" y1="11" x2="14.5" y2="11" stroke="currentColor" stroke-width="2"/>
      <line x1="8.5" y1="15" x2="15.5" y2="15" stroke="currentColor" stroke-width="2"/>
      <line x1="5" y1="21" x2="19" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },

  'hazard-triangle': {
    name: 'hazard-triangle',
    viewBox: '0 0 24 24',
    label: 'Hazard triangle',
    inner: `
      <path d="M12 3 L22 20 H2 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="17" r="1" fill="currentColor"/>
    `,
  },

  'clipboard-tick': {
    name: 'clipboard-tick',
    viewBox: '0 0 24 24',
    label: 'Clipboard — approved',
    inner: `
      <rect x="5" y="4" width="14" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="9" y="2" width="6" height="3" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M8.5 13 L11 15.5 L15.5 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
};

/** List of all registered construction icon names. */
export function getConstructionIconNames(): readonly string[] {
  return Object.keys(CONSTRUCTION_ICONS);
}

/** Look up a construction icon by name. */
export function getConstructionIcon(name: string): ConstructionIconDef | undefined {
  return CONSTRUCTION_ICONS[name];
}

/**
 * Render a construction icon as an SVG element.
 * Inherits color from currentColor so it can be styled with CSS or inline fill/stroke.
 */
export function ConstructionIcon({
  name,
  size = 20,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}): ReactElement | null {
  const icon = CONSTRUCTION_ICONS[name];
  if (!icon) return null;
  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={icon.label}
      role="img"
      dangerouslySetInnerHTML={{ __html: icon.inner }}
    />
  );
}
