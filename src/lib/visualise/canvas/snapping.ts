// =============================================================================
// Canvas snapping — grid snap + alignment-guide detection.
//
// Grid snap: round to nearest multiple of `gridSize` (default 8 in SVG user
// units).
//
// Alignment: during a drag, compare the active node's six key axes (left,
// center-x, right, top, center-y, bottom) to every other node's same six
// axes. Return any pairs within `threshold` (default 4 user units) as
// alignment guides, plus a snap-offset the caller can apply to bring the
// active node into alignment.
//
// The first matching guide on each axis "wins" for snap. Priority order
// within an axis is determined by which check is hit first in the scan;
// callers should consider this an implementation detail.
// =============================================================================

import type { NodeBBox } from './selection';

export interface AlignmentGuide {
  /** Orientation of the guide line. */
  axis: 'vertical' | 'horizontal';
  /** Position along the perpendicular axis, in SVG user units. */
  position: number;
  /** Length of the guide line — extends from min(active, other) to max. */
  from: number;
  to: number;
}

export interface AlignmentResult {
  guides: AlignmentGuide[];
  /** Snap delta to apply to the active node's x. */
  snapDx: number;
  /** Snap delta to apply to the active node's y. */
  snapDy: number;
}

/** Snap a single scalar to the nearest grid multiple. */
export function snapToGrid(value: number, gridSize = 8): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Find alignment guides between `active` and each of `others`.
 * Returns guides to render + a snap delta the caller applies to the active.
 */
export function findAlignmentGuides(
  active: NodeBBox,
  others: Array<{ id: string; bbox: NodeBBox }>,
  threshold = 4,
): AlignmentResult {
  const guides: AlignmentGuide[] = [];
  let snapDx = 0;
  let snapDy = 0;
  let dxSet = false;
  let dySet = false;

  const aKeys = keysForAxis(active);

  for (const { bbox: o } of others) {
    const oKeys = keysForAxis(o);

    // Vertical guides (lines run top-to-bottom; align X axes).
    for (const aKey of aKeys.x) {
      for (const oKey of oKeys.x) {
        const diff = oKey - aKey;
        if (Math.abs(diff) <= threshold) {
          if (!dxSet) {
            snapDx = diff;
            dxSet = true;
          }
          guides.push({
            axis: 'vertical',
            position: oKey,
            from: Math.min(active.y, o.y) - 4,
            to: Math.max(active.y + active.h, o.y + o.h) + 4,
          });
        }
      }
    }

    // Horizontal guides (lines run left-to-right; align Y axes).
    for (const aKey of aKeys.y) {
      for (const oKey of oKeys.y) {
        const diff = oKey - aKey;
        if (Math.abs(diff) <= threshold) {
          if (!dySet) {
            snapDy = diff;
            dySet = true;
          }
          guides.push({
            axis: 'horizontal',
            position: oKey,
            from: Math.min(active.x, o.x) - 4,
            to: Math.max(active.x + active.w, o.x + o.w) + 4,
          });
        }
      }
    }
  }

  return { guides: dedupeGuides(guides), snapDx, snapDy };
}

function keysForAxis(b: NodeBBox): { x: number[]; y: number[] } {
  return {
    x: [b.x, b.x + b.w / 2, b.x + b.w],
    y: [b.y, b.y + b.h / 2, b.y + b.h],
  };
}

function dedupeGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  const seen = new Set<string>();
  const out: AlignmentGuide[] = [];
  for (const g of guides) {
    const key = `${g.axis}:${Math.round(g.position * 100)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}
