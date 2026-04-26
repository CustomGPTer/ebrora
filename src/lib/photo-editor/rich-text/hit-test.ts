// src/lib/photo-editor/rich-text/hit-test.ts
//
// Caret hit-testing on a laid-out text layer. Pure logic — given a
// LayoutResult and a point in layer-local coordinates (i.e. the same
// coordinate space layout.ts paints in, with (0, 0) at the top-left of
// the laid-out text bounding box), return the code-point offset that
// the caret should land at.
//
// Lands in Batch A but is consumed by Batch B's TextEditOverlay to map
// pointerdown / pointermove events into caret + range positions in
// state.runSelection.
//
// Algorithm:
//   1. Pick the line whose vertical band [baselineY - ascent, baselineY
//      + descent] contains the point. Tap above the first line clamps to
//      that line; tap below the last line clamps to the last line. This
//      keeps caret placement well-defined for any in-bitmap tap.
//   2. Within the line, walk glyphs left-to-right. The caret offset on
//      each glyph is "before" or "after" depending on whether the tap x
//      falls in the glyph's left or right half. Tap left of the first
//      glyph → before the first glyph (offset = 0 on that line). Tap
//      right of the last glyph → after the last glyph.
//   3. Convert (line index + intra-line offset) into a global code-point
//      offset by walking glyphs in document order and accumulating until
//      the target glyph is reached.
//
// Selection range:
//   • caretOffsetFromPoint(point)            → single offset
//   • selectionRangeFromPoints(start, end)   → ordered { start, end } pair
//   • lineRangeForLineIndex(layout, idx)     → triple-click select line
//   • wordRangeAtOffset(layout, offset)      → double-click select word
//
// All functions are code-point aware via Array.from / chars from
// measure.ts (used implicitly via the layout — every LaidGlyph already
// represents one code point).

import type { LaidGlyph, LaidLine, LayoutResult } from "./layout";

/** A point in layer-local coordinates. */
export interface LayerLocalPoint {
  x: number;
  y: number;
}

/** Find the closest line index for a given y. Clamps to the first / last
 *  line for points above / below the laid-out text. Returns -1 only when
 *  the layout has no lines at all. */
export function lineIndexForY(layout: LayoutResult, y: number): number {
  if (layout.lines.length === 0) return -1;

  // Above the first line — clamp.
  const first = layout.lines[0];
  if (y < first.baselineY - first.ascent) return 0;

  // Walk lines and find the band that contains y.
  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const top = line.baselineY - line.ascent;
    const bottom = line.baselineY + line.descent;
    if (y >= top && y <= bottom) return i;
    // Between lines: assign to the closer line.
    if (i < layout.lines.length - 1) {
      const next = layout.lines[i + 1];
      const nextTop = next.baselineY - next.ascent;
      if (y > bottom && y < nextTop) {
        const distToThis = y - bottom;
        const distToNext = nextTop - y;
        return distToThis <= distToNext ? i : i + 1;
      }
    }
  }

  // Below the last line — clamp.
  return layout.lines.length - 1;
}

/** Find the intra-line caret offset for a tap at x within `line`. The
 *  returned value is in [0, line.glyphs.length], where 0 = caret before
 *  the first glyph and line.glyphs.length = caret after the last glyph. */
export function caretOffsetWithinLine(line: LaidLine, x: number): number {
  if (line.glyphs.length === 0) return 0;

  // Tap left of the first glyph — caret at the start of the line.
  const first = line.glyphs[0];
  if (x <= first.x) return 0;

  // Walk glyphs left-to-right; if the tap falls in the left half of a
  // glyph, the caret sits at its start; if in the right half, at its end.
  for (let i = 0; i < line.glyphs.length; i++) {
    const g = line.glyphs[i];
    const mid = g.x + g.width / 2;
    if (x <= mid) return i;
    if (x <= g.x + g.width) return i + 1;
  }

  // Tap right of the last glyph — caret at the end of the line.
  return line.glyphs.length;
}

/** Convert (lineIndex, intra-line offset) into a global code-point
 *  offset by counting glyphs in document order. Each LaidGlyph is one
 *  code point, so the count is the offset. */
export function globalOffsetForLineCaret(
  layout: LayoutResult,
  lineIndex: number,
  intraLineOffset: number,
): number {
  let offset = 0;
  for (let i = 0; i < lineIndex && i < layout.lines.length; i++) {
    offset += layout.lines[i].glyphs.length;
  }
  const line = layout.lines[lineIndex];
  if (line) {
    offset += Math.min(intraLineOffset, line.glyphs.length);
  }
  return offset;
}

/** End-to-end: tap point → caret code-point offset. */
export function caretOffsetFromPoint(
  layout: LayoutResult,
  point: LayerLocalPoint,
): number {
  if (layout.lines.length === 0) return 0;
  const lineIndex = lineIndexForY(layout, point.y);
  if (lineIndex < 0) return 0;
  const intra = caretOffsetWithinLine(layout.lines[lineIndex], point.x);
  return globalOffsetForLineCaret(layout, lineIndex, intra);
}

/** Two points → an ordered selection range. The component never has to
 *  worry about which point came first — both pointerdown→pointermove
 *  and shift+arrow extension can call this. */
export function selectionRangeFromPoints(
  layout: LayoutResult,
  start: LayerLocalPoint,
  end: LayerLocalPoint,
): { start: number; end: number } {
  const a = caretOffsetFromPoint(layout, start);
  const b = caretOffsetFromPoint(layout, end);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

// ─── Caret position (for rendering the visible blinking line) ───
//
// The inverse of caretOffsetFromPoint: given a code-point offset, where
// in layer-local coordinates does the caret sit? Used by TextEditOverlay
// to draw the blinking caret.

export interface CaretPosition {
  /** x position of the caret line in layer-local pixels. */
  x: number;
  /** y position of the caret line's TOP in layer-local pixels. */
  y: number;
  /** Caret line height. */
  height: number;
  /** Index of the line the caret sits on. */
  lineIndex: number;
}

/** Caret position for a given global code-point offset. Falls back to a
 *  zero-rect at the layout origin if the layout has no lines (empty
 *  layer). Offsets past the end of the layout clamp to the end. */
export function caretPositionForOffset(
  layout: LayoutResult,
  offset: number,
): CaretPosition {
  if (layout.lines.length === 0) {
    return { x: 0, y: 0, height: 0, lineIndex: -1 };
  }

  // Walk lines, finding which one contains this offset.
  let remaining = Math.max(0, offset);
  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const len = line.glyphs.length;

    // The caret sits ON this line if remaining < len, OR if this is the
    // last line AND remaining <= len (so end-of-text is well-defined).
    const isLastLine = i === layout.lines.length - 1;
    if (remaining < len || (isLastLine && remaining <= len)) {
      const x = caretXForLineOffset(line, remaining);
      return {
        x,
        y: line.baselineY - line.ascent,
        height: line.height,
        lineIndex: i,
      };
    }

    remaining -= len;
  }

  // Defensive — shouldn't reach here given the isLastLine check.
  const last = layout.lines[layout.lines.length - 1];
  return {
    x: caretXForLineOffset(last, last.glyphs.length),
    y: last.baselineY - last.ascent,
    height: last.height,
    lineIndex: layout.lines.length - 1,
  };
}

/** Caret x for an intra-line offset on a specific line. Offset 0 sits at
 *  the start of the first glyph (or at the line's left edge for an empty
 *  line); offset N sits at the right edge of glyph N-1. */
function caretXForLineOffset(line: LaidLine, intraOffset: number): number {
  if (line.glyphs.length === 0) return 0;
  if (intraOffset <= 0) return line.glyphs[0].x;
  const clamped = Math.min(intraOffset, line.glyphs.length);
  if (clamped === line.glyphs.length) {
    const last = line.glyphs[line.glyphs.length - 1];
    return last.x + last.width;
  }
  return line.glyphs[clamped].x;
}

// ─── Word and line ranges (double / triple click) ───────────────

/** Code-point offset range covering the line at lineIndex. Returns null
 *  if the index is out of range. */
export function lineRangeForLineIndex(
  layout: LayoutResult,
  lineIndex: number,
): { start: number; end: number } | null {
  if (lineIndex < 0 || lineIndex >= layout.lines.length) return null;
  let start = 0;
  for (let i = 0; i < lineIndex; i++) {
    start += layout.lines[i].glyphs.length;
  }
  const end = start + layout.lines[lineIndex].glyphs.length;
  return { start, end };
}

/** Code-point offset range covering the "word" containing the given
 *  global offset. Word boundaries are runs of non-whitespace, non-newline
 *  glyphs. Whitespace at boundaries is excluded. Useful for double-click
 *  to select a word in Batch B's TextEditOverlay. */
export function wordRangeAtOffset(
  layout: LayoutResult,
  offset: number,
): { start: number; end: number } | null {
  // Walk glyphs in document order, building a flat array we can index.
  const flat: LaidGlyph[] = [];
  for (const line of layout.lines) {
    for (const g of line.glyphs) flat.push(g);
  }
  if (flat.length === 0) return null;

  // The caret sits between glyphs flat[offset-1] and flat[offset]. For
  // word selection, treat the glyph at `offset` as the "click target" if
  // it's non-whitespace; otherwise the one before.
  let target = Math.min(offset, flat.length - 1);
  if (isWordBoundary(flat[target]) && target > 0 && !isWordBoundary(flat[target - 1])) {
    target = target - 1;
  }
  if (isWordBoundary(flat[target])) {
    // Caret is inside whitespace — select the whitespace run.
    let start = target;
    while (start > 0 && isWordBoundary(flat[start - 1])) start--;
    let end = target + 1;
    while (end < flat.length && isWordBoundary(flat[end])) end++;
    return { start, end };
  }

  let start = target;
  while (start > 0 && !isWordBoundary(flat[start - 1])) start--;
  let end = target + 1;
  while (end < flat.length && !isWordBoundary(flat[end])) end++;
  return { start, end };
}

/** A glyph counts as a word boundary if it's whitespace or a newline.
 *  Punctuation could be added to the boundary set later if it improves
 *  the feel of double-click. */
function isWordBoundary(glyph: LaidGlyph): boolean {
  return /\s/.test(glyph.char);
}
