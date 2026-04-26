// src/lib/photo-editor/rich-text/edit-ops.ts
//
// Editing operations on the GlyphRun array. Sessions 1+2 shipped
// glyph-run.ts with the *styling* primitive (applyStylePatch). This
// file is the *content* primitive: replaceTextRange — a single
// operation that subsumes insertion (start === end), deletion
// (insertText === ""), and replacement.
//
// The styling-inheritance rule for inserted text:
//
//   • If the inserted text is at the very start (start === 0), it
//     inherits the styling of the first run. (Typing at the front of
//     a layer extends the look of what's already there.)
//   • Otherwise, it inherits the styling of whichever run contains
//     the character immediately *before* `start`. (Typing in the
//     middle of "Hello" continues the styling of the H/e/l/l/o
//     glyphs around it.)
//
// This matches what users in word processors expect — typing at a
// boundary "joins" the styling of the previous side.
//
// All offsets are code-point offsets, NOT UTF-16 code-unit offsets.
// Use chars() from measure.ts (which Array.from-iterates) to count.

import type { GlyphRun } from "../types";
import { chars } from "./measure";
import { mergeAdjacent, runAtOffset, totalLength } from "./glyph-run";

/** Replace the code-point range [start, end) with `insertText`.
 *
 *  Special cases:
 *    • start === end  → pure insertion
 *    • insertText === "" → pure deletion
 *    • Both → no-op (returns the input runs unchanged)
 *
 *  Styling for the inserted text follows the rule documented above.
 *
 *  Throws if the runs array is empty AND insertText is non-empty —
 *  there's no run to inherit styling from. TextLayers always have at
 *  least one run (created by createTextLayer with sensible defaults),
 *  so callers shouldn't hit this in practice. */
export function replaceTextRange(
  runs: GlyphRun[],
  start: number,
  end: number,
  insertText: string,
): GlyphRun[] {
  // No-op fast paths.
  const total = totalLength(runs);
  const clampedStart = Math.max(0, Math.min(start, total));
  const clampedEnd = Math.max(clampedStart, Math.min(end, total));
  if (clampedStart === clampedEnd && insertText.length === 0) {
    return runs;
  }

  if (runs.length === 0) {
    if (insertText.length === 0) return runs;
    throw new Error(
      "replaceTextRange: cannot insert into an empty runs array " +
        "(no styling reference). TextLayer should always have ≥1 run.",
    );
  }

  // Pick the styling source for the inserted text.
  // - At start === 0 → first run's styling.
  // - Otherwise → styling of whichever run contains (start - 1).
  let styleSourceIndex = 0;
  if (clampedStart > 0) {
    const at = runAtOffset(runs, clampedStart - 1);
    if (at) styleSourceIndex = at.runIndex;
  }
  const styleSource = runs[styleSourceIndex];

  // Walk runs, building the new array. Track whether we've inserted yet
  // so we don't double-insert when the range spans multiple runs.
  const out: GlyphRun[] = [];
  let cursor = 0;
  let inserted = false;

  function maybeInsert() {
    if (inserted) return;
    if (insertText.length === 0) return;
    out.push({ ...styleSource, text: insertText });
    inserted = true;
  }

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const len = chars(run.text).length;
    const runStart = cursor;
    const runEnd = cursor + len;
    cursor = runEnd;

    if (runEnd <= clampedStart) {
      // Entirely before the range — keep as-is.
      out.push(run);
      // If the range starts exactly at runEnd (i.e., between this run
      // and the next), insert here so the styling-source rule lands
      // immediately after this run.
      if (runEnd === clampedStart && clampedStart === clampedEnd) {
        maybeInsert();
      }
      continue;
    }

    if (runStart >= clampedEnd) {
      // Entirely after the range — first time we hit this branch, the
      // inserted text needs to land before us.
      maybeInsert();
      out.push(run);
      continue;
    }

    // Run intersects the range — split into [before, after] (the
    // middle is being replaced) with the inserted text in the gap.
    const cs = chars(run.text);
    const localStart = Math.max(0, clampedStart - runStart);
    const localEnd = Math.min(len, clampedEnd - runStart);

    const before = cs.slice(0, localStart).join("");
    const after = cs.slice(localEnd).join("");

    if (before) out.push({ ...run, text: before });
    maybeInsert();
    if (after) out.push({ ...run, text: after });
  }

  // If the range was at the very end (clampedStart === clampedEnd ===
  // total) and our maybeInsert() never fired, append it now.
  maybeInsert();

  // The result may have empty-text runs (e.g., before/after slices that
  // came back as ""). filter those out before merging.
  const nonEmpty = out.filter((r) => r.text.length > 0);

  // If filtering removed everything (the user just deleted the entire
  // layer's contents), keep one empty styled run so the TextLayer
  // invariant "at least one run" holds. The canvas will paint nothing,
  // but applyStylePatch / layout / etc. all still have a styling
  // reference.
  if (nonEmpty.length === 0) {
    return [{ ...styleSource, text: "" }];
  }

  return mergeAdjacent(nonEmpty);
}

// ─── Code-point arithmetic for cursor movement ──────────────────
//
// Used by TextEditOverlay's keyboard handler. Pure logic — no DOM,
// no React.

/** Clamp a code-point offset to the range [0, totalLength(runs)]. */
export function clampOffset(runs: GlyphRun[], offset: number): number {
  const total = totalLength(runs);
  if (offset < 0) return 0;
  if (offset > total) return total;
  return offset;
}

/** Move forward by N code points. */
export function offsetForward(
  runs: GlyphRun[],
  offset: number,
  by = 1,
): number {
  return clampOffset(runs, offset + by);
}

/** Move backward by N code points. */
export function offsetBackward(
  runs: GlyphRun[],
  offset: number,
  by = 1,
): number {
  return clampOffset(runs, offset - by);
}

/** Number of code points in a string. Surrogate pairs and multi-char
 *  emoji count as 1 (matches chars() from measure.ts). */
export function codePointLength(text: string): number {
  return chars(text).length;
}
