// =============================================================================
// Canvas selection — pure logic helpers.
// Selection state is a `Set<string>` of data-ids. The canvas editor owns
// the Set in React state; these helpers compute new Sets without mutating
// the input.
//
// Also contains marquee hit-testing and bounding-box union helpers.
// =============================================================================

export interface NodeBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Replace the current selection with a single id. */
export function selectOnly(_current: Set<string>, id: string): Set<string> {
  return new Set([id]);
}

/** Toggle an id into/out of the current selection (Ctrl/Cmd+click). */
export function toggleSelection(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Add an id to the current selection (Shift+click). No-op if already in. */
export function addToSelection(current: Set<string>, id: string): Set<string> {
  if (current.has(id)) return current;
  const next = new Set(current);
  next.add(id);
  return next;
}

/** Clear the selection entirely. */
export function clearSelection(): Set<string> {
  return new Set();
}

/**
 * Return the ids whose bbox intersects the marquee rect.
 * Marquee uses AABB overlap — a node is "selected" if any part touches.
 */
export function hitTestMarquee(
  marquee: MarqueeRect,
  bboxes: Record<string, NodeBBox>,
): string[] {
  const mRight = marquee.x + marquee.w;
  const mBottom = marquee.y + marquee.h;
  const hits: string[] = [];
  for (const id of Object.keys(bboxes)) {
    const b = bboxes[id];
    if (b.x + b.w < marquee.x) continue;
    if (b.x > mRight) continue;
    if (b.y + b.h < marquee.y) continue;
    if (b.y > mBottom) continue;
    hits.push(id);
  }
  return hits;
}

/**
 * Union bbox across the given ids. Returns null if the selection is empty
 * or no matching bboxes are found.
 */
export function getSelectionBBox(
  ids: Iterable<string>,
  bboxes: Record<string, NodeBBox>,
): NodeBBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const id of ids) {
    const b = bboxes[id];
    if (!b) continue;
    any = true;
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  if (!any) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Apply the canvas.nodes override (translation only) on top of a natural bbox.
 * This is what downstream code uses to compute the "current" position of a
 * node for alignment detection and selection-bbox display.
 */
export function currentNodeBBox(
  natural: NodeBBox,
  override?: { x: number; y: number; w?: number; h?: number },
): NodeBBox {
  if (!override) return natural;
  const sx = override.w && override.w > 0 ? override.w : 1;
  const sy = override.h && override.h > 0 ? override.h : 1;
  return {
    x: natural.x + override.x,
    y: natural.y + override.y,
    w: natural.w * sx,
    h: natural.h * sy,
  };
}
