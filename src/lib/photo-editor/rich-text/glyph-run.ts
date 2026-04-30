// src/lib/photo-editor/rich-text/glyph-run.ts
//
// Helpers for working with the GlyphRun array on a TextLayer. The
// GlyphRun shape itself lives in types.ts — this file is the
// operations: lookup, split, merge, normalise, and the per-letter
// styling patch primitive.

import type { GlyphRun } from "../types";
import { chars } from "./measure";

/** Total length (in code points) of an array of runs. */
export function totalLength(runs: GlyphRun[]): number {
  let n = 0;
  for (const r of runs) n += chars(r.text).length;
  return n;
}

/** Concatenated plain text of an array of runs. */
export function plainText(runs: GlyphRun[]): string {
  return runs.map((r) => r.text).join("");
}

/** Find which run contains the character at the given (code-point)
 *  offset. Returns the run index plus the local offset within that run.
 *  Returns null if offset is out of range. */
export function runAtOffset(
  runs: GlyphRun[],
  offset: number
): { runIndex: number; localOffset: number } | null {
  if (offset < 0) return null;
  let cursor = 0;
  for (let i = 0; i < runs.length; i++) {
    const len = chars(runs[i].text).length;
    if (offset <= cursor + len) {
      return { runIndex: i, localOffset: offset - cursor };
    }
    cursor += len;
  }
  return null;
}

/** Split a single run at a code-point offset. Returns 1 or 2 runs. */
export function splitRunAt(run: GlyphRun, offset: number): GlyphRun[] {
  const cs = chars(run.text);
  if (offset <= 0) return [run];
  if (offset >= cs.length) return [run];
  return [
    { ...run, text: cs.slice(0, offset).join("") },
    { ...run, text: cs.slice(offset).join("") },
  ];
}

/** Merge consecutive runs that have identical styling. Reduces noise
 *  from edit operations. */
export function mergeAdjacent(runs: GlyphRun[]): GlyphRun[] {
  if (runs.length < 2) return runs;
  const out: GlyphRun[] = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && stylesEqual(last, r)) {
      out[out.length - 1] = { ...last, text: last.text + r.text };
    } else {
      out.push(r);
    }
  }
  return out;
}

/** True if two runs have identical styling (text content ignored). */
export function stylesEqual(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.fontFamily === b.fontFamily &&
    a.fontWeight === b.fontWeight &&
    a.fontStyle === b.fontStyle &&
    a.fontSize === b.fontSize &&
    a.decoration === b.decoration &&
    a.fill === b.fill &&
    a.opacity === b.opacity &&
    fillsEqual(a, b) &&
    strokesEqual(a, b) &&
    shadowsEqual(a, b) &&
    highlightsEqual(a, b)
  );
}

function fillsEqual(a: GlyphRun, b: GlyphRun): boolean {
  if (a.gradient.enabled !== b.gradient.enabled) return false;
  if (a.gradient.enabled && JSON.stringify(a.gradient) !== JSON.stringify(b.gradient)) {
    return false;
  }
  if (a.texture.enabled !== b.texture.enabled) return false;
  if (a.texture.enabled && JSON.stringify(a.texture) !== JSON.stringify(b.texture)) {
    return false;
  }
  return true;
}

function strokesEqual(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.stroke.color === b.stroke.color &&
    a.stroke.width === b.stroke.width &&
    a.stroke.opacity === b.stroke.opacity
  );
}

function shadowsEqual(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.shadow.color === b.shadow.color &&
    a.shadow.opacity === b.shadow.opacity &&
    a.shadow.blur === b.shadow.blur &&
    a.shadow.offsetX === b.shadow.offsetX &&
    a.shadow.offsetY === b.shadow.offsetY
  );
}

function highlightsEqual(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.highlight.color === b.highlight.color &&
    a.highlight.opacity === b.highlight.opacity
  );
}

/** Apply a styling patch to a range of code-point offsets. Splits runs
 *  as needed and re-merges adjacent equal-style runs after.
 *
 *  This is the per-letter / per-word styling primitive (Q1). Every
 *  per-letter tool (Color, Stroke, Shadow, Highlight, Gradient,
 *  Decoration) lands user actions through this function. */
export function applyStylePatch(
  runs: GlyphRun[],
  start: number,
  end: number,
  patch: Partial<Omit<GlyphRun, "text">>
): GlyphRun[] {
  if (end <= start) return runs;

  let cursor = 0;
  const split: GlyphRun[] = [];
  for (const run of runs) {
    const len = chars(run.text).length;
    const runStart = cursor;
    const runEnd = cursor + len;
    cursor = runEnd;

    if (runEnd <= start || runStart >= end) {
      split.push(run);
      continue;
    }

    // Split into up to three pieces: before (unpatched), middle (patched),
    // after (unpatched).
    const localStart = Math.max(0, start - runStart);
    const localEnd = Math.min(len, end - runStart);

    const cs = chars(run.text);
    const before = cs.slice(0, localStart).join("");
    const middle = cs.slice(localStart, localEnd).join("");
    const after = cs.slice(localEnd).join("");

    if (before) split.push({ ...run, text: before });
    split.push({ ...run, ...patch, text: middle });
    if (after) split.push({ ...run, text: after });
  }

  return mergeAdjacent(split);
}
