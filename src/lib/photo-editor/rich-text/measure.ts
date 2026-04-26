// src/lib/photo-editor/rich-text/measure.ts
//
// Per-glyph text measurement using the Canvas 2D TextMetrics API.
// Each character is measured individually so letter-spacing works
// uniformly. (This trades away kerning between adjacent glyphs — fine
// for the uses we care about; revisit later if it becomes visible.)
//
// All measurement happens through a singleton off-screen canvas so we
// don't create per-call DOM elements. A browser environment is required
// at runtime; the singleton is initialised lazily on first use so this
// module is safe to import in a server / test context that doesn't
// actually call any of the measurement functions.

import type { GlyphRun } from "../types";

/** A measured glyph — one character with its advance width and metrics. */
export interface MeasuredGlyph {
  /** The character. Always one code point (we treat surrogate pairs as
   *  one logical glyph during layout). */
  char: string;
  /** Advance width in canvas pixels (no letter-spacing applied). */
  width: number;
  /** Distance above the baseline. */
  ascent: number;
  /** Distance below the baseline. */
  descent: number;
}

let cachedCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (cachedCtx) return cachedCtx;

  // Prefer OffscreenCanvas where available — keeps the measurement
  // canvas off the main element tree entirely.
  if (typeof OffscreenCanvas !== "undefined") {
    const off = new OffscreenCanvas(1, 1);
    const ctx = off.getContext("2d") as unknown as CanvasRenderingContext2D | null;
    if (ctx) {
      cachedCtx = ctx;
      return ctx;
    }
  }

  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext("2d");
    if (ctx) {
      cachedCtx = ctx;
      return ctx;
    }
  }

  throw new Error("rich-text/measure: no canvas context available");
}

/** Build the CSS font shorthand for a run. */
export function fontStringForRun(run: GlyphRun): string {
  // CSS shorthand: <style> <weight> <size>px <family>
  // Family can include spaces — quote it to be safe.
  const fam = run.fontFamily.includes(" ")
    ? `"${run.fontFamily}"`
    : run.fontFamily;
  return `${run.fontStyle} ${run.fontWeight} ${run.fontSize}px ${fam}`;
}

/** Iterate the characters of a string as code points. Surrogate pairs
 *  (emoji, rare CJK) are treated as single glyphs. */
export function chars(text: string): string[] {
  return Array.from(text);
}

/** Measure a single character with the given run's font. */
export function measureChar(char: string, run: GlyphRun): MeasuredGlyph {
  const ctx = getMeasureContext();
  ctx.font = fontStringForRun(run);
  ctx.textBaseline = "alphabetic";

  const m = ctx.measureText(char);
  const ascent =
    typeof m.actualBoundingBoxAscent === "number"
      ? m.actualBoundingBoxAscent
      : run.fontSize * 0.8;
  const descent =
    typeof m.actualBoundingBoxDescent === "number"
      ? m.actualBoundingBoxDescent
      : run.fontSize * 0.2;

  return { char, width: m.width, ascent, descent };
}

/** Measure every code point in a run. */
export function measureRun(run: GlyphRun): MeasuredGlyph[] {
  const ctx = getMeasureContext();
  ctx.font = fontStringForRun(run);
  ctx.textBaseline = "alphabetic";

  const out: MeasuredGlyph[] = [];
  for (const ch of chars(run.text)) {
    const m = ctx.measureText(ch);
    const ascent =
      typeof m.actualBoundingBoxAscent === "number"
        ? m.actualBoundingBoxAscent
        : run.fontSize * 0.8;
    const descent =
      typeof m.actualBoundingBoxDescent === "number"
        ? m.actualBoundingBoxDescent
        : run.fontSize * 0.2;
    out.push({ char: ch, width: m.width, ascent, descent });
  }
  return out;
}

/** Whether the given font family is currently loaded.
 *
 *  measureText returns metrics whether or not the font is loaded — if
 *  the font is unavailable the browser substitutes a fallback and the
 *  metrics reflect that fallback. document.fonts.check is the canonical
 *  way to confirm a font is ready. Used during font loading bring-up. */
export function isFontLoaded(family: string): boolean {
  if (typeof document === "undefined") return true;
  const fonts = (document as unknown as { fonts?: { check: (s: string) => boolean } }).fonts;
  if (!fonts || typeof fonts.check !== "function") return true;
  return fonts.check(`16px "${family}"`);
}
