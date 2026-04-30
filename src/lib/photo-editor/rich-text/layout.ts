// src/lib/photo-editor/rich-text/layout.ts
//
// Line-breaking and positioning for a TextLayer. Pure logic — given a
// layer (runs + width + alignment), produces an ordered list of lines,
// each containing positioned glyphs.
//
// Algorithm: greedy line-break by character. Walk every code point in
// run order, accumulating advance width plus letter-spacing. Whenever
// adding the next glyph would exceed layer.width, break at the most
// recent whitespace (or, if no whitespace seen on the current line, at
// the current character — overflow word).
//
// Vertical positioning uses each line's max ascent + descent scaled by
// lineHeight. Alignment is applied as a horizontal shift on each line
// once layout is final.

import type { GlyphRun, Rect, TextLayer } from "../types";
import { measureRun, type MeasuredGlyph } from "./measure";

/** A glyph as it sits on the canvas — its measured metrics plus its
 *  layout-time position and a back-pointer to the styling run. */
export interface LaidGlyph extends MeasuredGlyph {
  run: GlyphRun;
  /** Baseline x in layer-local pixels. */
  x: number;
  /** Baseline y in layer-local pixels. */
  y: number;
}

export interface LaidLine {
  glyphs: LaidGlyph[];
  /** Sum of glyph widths plus letter-spacing. */
  width: number;
  /** Max ascent of any glyph in the line. */
  ascent: number;
  /** Max descent of any glyph in the line. */
  descent: number;
  /** ascent + descent. */
  height: number;
  /** y position of this line's baseline (layer-local). */
  baselineY: number;
}

export interface LayoutResult {
  lines: LaidLine[];
  /** Width of the widest line. */
  width: number;
  /** Total height (last line's baseline + its descent). */
  height: number;
  bounds: Rect;
}

/** Internal — a measured glyph carrying its source run + classification. */
interface PreGlyph extends MeasuredGlyph {
  run: GlyphRun;
  isWhitespace: boolean;
  isBreak: boolean;
}

/** Run layout for a TextLayer. */
export function layoutTextLayer(layer: TextLayer): LayoutResult {
  // 1. Flatten runs into a per-character array carrying measured
  //    metrics and a back-pointer to its run.
  const allGlyphs: PreGlyph[] = [];
  for (const run of layer.runs) {
    const measured = measureRun(run);
    for (const m of measured) {
      allGlyphs.push({
        ...m,
        run,
        isWhitespace: /\s/.test(m.char) && m.char !== "\n",
        isBreak: m.char === "\n",
      });
    }
  }

  // 2. Greedy line-break.
  const linesRaw: PreGlyph[][] = [];
  let current: PreGlyph[] = [];
  let widthSoFar = 0;
  const ls = layer.styling.letterSpacing;
  const maxWidth = Math.max(0, layer.width);

  function flushLine() {
    linesRaw.push(current);
    current = [];
    widthSoFar = 0;
  }

  for (let i = 0; i < allGlyphs.length; i++) {
    const g = allGlyphs[i];

    if (g.isBreak) {
      flushLine();
      continue;
    }

    const advance = g.width + ls;

    if (
      maxWidth > 0 &&
      current.length > 0 &&
      widthSoFar + advance > maxWidth
    ) {
      // Look backwards for a whitespace to break at.
      let breakAt = -1;
      for (let j = current.length - 1; j >= 0; j--) {
        if (current[j].isWhitespace) {
          breakAt = j;
          break;
        }
      }
      if (breakAt >= 0) {
        const tail = current.slice(breakAt + 1);
        // Drop the whitespace itself (don't render trailing spaces).
        current = current.slice(0, breakAt);
        flushLine();
        for (const t of tail) {
          current.push(t);
          widthSoFar += t.width + ls;
        }
      } else {
        // No whitespace — overflow word; break before this glyph.
        flushLine();
      }
    }

    current.push(g);
    widthSoFar += advance;
  }
  if (current.length > 0) flushLine();

  // 3. Compute per-line metrics.
  const lh = layer.styling.lineHeight;
  const lines: LaidLine[] = [];
  let maxLineWidth = 0;

  for (const lineGlyphs of linesRaw) {
    let lineWidth = 0;
    let ascent = 0;
    let descent = 0;
    for (const g of lineGlyphs) {
      lineWidth += g.width + ls;
      if (g.ascent > ascent) ascent = g.ascent;
      if (g.descent > descent) descent = g.descent;
    }
    // Strip the last letter-spacing — no spacing past the final glyph.
    if (lineGlyphs.length > 0) lineWidth -= ls;
    if (lineWidth < 0) lineWidth = 0;

    // Empty line — synthesise ascent / descent from the layer's first run
    // so blank lines still take vertical space.
    if (lineGlyphs.length === 0 && layer.runs.length > 0) {
      ascent = layer.runs[0].fontSize * 0.8;
      descent = layer.runs[0].fontSize * 0.2;
    }

    lines.push({
      glyphs: [],
      width: lineWidth,
      ascent,
      descent,
      height: ascent + descent,
      baselineY: 0,
    });
    if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
  }

  // 4. Vertical positioning.
  let y = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    line.baselineY = y + line.ascent;
    y += line.height * lh;
  }

  // 5. Place glyphs along each line with alignment.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const raw = linesRaw[i];

    let x = alignmentOffset(maxWidth, line.width, layer.styling.align);

    // Justify: distribute extra width across whitespace. The last line
    // stays left-aligned (standard typographic convention).
    let extraPerSpace = 0;
    if (
      layer.styling.align === "justify" &&
      i < lines.length - 1 &&
      maxWidth > line.width
    ) {
      const spaceCount = raw.filter((g) => g.isWhitespace).length;
      if (spaceCount > 0) {
        extraPerSpace = (maxWidth - line.width) / spaceCount;
      }
    }

    for (const g of raw) {
      const lg: LaidGlyph = {
        char: g.char,
        width: g.width,
        ascent: g.ascent,
        descent: g.descent,
        run: g.run,
        x,
        y: line.baselineY,
      };
      line.glyphs.push(lg);
      x += g.width + ls;
      if (g.isWhitespace) x += extraPerSpace;
    }
  }

  const totalHeight =
    lines.length === 0
      ? 0
      : (() => {
          const last = lines[lines.length - 1];
          return last.baselineY + last.descent;
        })();

  // Compute the rendered glyph extent on the X axis. `width` above is the
  // max ink-line width (sum of advances), with no idea that the alignment
  // offset shifts glyphs to the right under center / right, or that
  // justify stretches non-last lines out to maxWidth. Without `bounds`
  // reflecting that, callers (RichTextNode, TextEditOverlay, export
  // renderer) that size off-screen bitmaps from `width` end up clipping
  // every centred / right-aligned / justify-multi-line glyph that lands
  // past the bitmap right edge. Keep `width` unchanged for back-compat
  // with PerspectivePanel + the engine-debug overlay; new code should
  // prefer `bounds`.
  let alignedMinX = 0;
  let alignedMaxX = 0;
  if (lines.length > 0) {
    const align = layer.styling.align;
    const isMultilineJustify = align === "justify" && lines.length > 1;
    let minOffset = Infinity;
    let maxRight = -Infinity;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const offset = alignmentOffset(maxWidth, line.width, align);
      const isLastLine = i === lines.length - 1;
      // Justify pads non-last lines out to maxWidth (last line stays
      // at its natural width per the layout pass above).
      const lineRight =
        isMultilineJustify && !isLastLine ? maxWidth : offset + line.width;
      if (offset < minOffset) minOffset = offset;
      if (lineRight > maxRight) maxRight = lineRight;
    }
    if (Number.isFinite(minOffset)) alignedMinX = minOffset;
    if (Number.isFinite(maxRight)) alignedMaxX = maxRight;
  }

  return {
    lines,
    width: maxLineWidth,
    height: totalHeight,
    bounds: {
      x: alignedMinX,
      y: 0,
      width: Math.max(0, alignedMaxX - alignedMinX),
      height: totalHeight,
    },
  };
}

function alignmentOffset(
  maxWidth: number,
  lineWidth: number,
  align: TextLayer["styling"]["align"]
): number {
  if (maxWidth <= 0) return 0;
  switch (align) {
    case "left":
    case "justify":
      return 0;
    case "center":
      return Math.max(0, (maxWidth - lineWidth) / 2);
    case "right":
      return Math.max(0, maxWidth - lineWidth);
  }
}
