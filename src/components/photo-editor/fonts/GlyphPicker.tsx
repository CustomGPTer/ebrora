// src/components/photo-editor/fonts/GlyphPicker.tsx
//
// Glyph picker grid. Five groups (Punctuation, Currency, Math, Arrows,
// Symbols) drawn from glyph-picker-data.ts. Tap a cell to insert that
// glyph into the active text layer.
//
// Session 4 affordance: insert appends to the last run's text. Inline
// editing with a cursor lands in Session 5 — at that point this picker
// will switch to "insert at caret" instead of append, but the visual
// component stays the same.

"use client";

import { GLYPH_GROUPS } from "@/lib/photo-editor/fonts/glyph-picker-data";

interface GlyphPickerProps {
  /** Whether a text layer is currently selected. Drives whether tapping
   *  a glyph dispatches anything. */
  canInsert: boolean;
  onInsert: (glyph: string) => void;
}

export function GlyphPicker({ canInsert, onInsert }: GlyphPickerProps) {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-3"
      style={{ background: "var(--pe-surface)" }}
    >
      {!canInsert ? (
        <div
          className="text-sm text-center mb-4 px-3 py-3 rounded-lg"
          style={{
            background: "var(--pe-surface-2)",
            color: "var(--pe-text-muted)",
            border: "1px solid var(--pe-border)",
          }}
        >
          Select a text layer to insert glyphs.
        </div>
      ) : null}

      {GLYPH_GROUPS.map((group) => (
        <section key={group.id} className="mb-5">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "var(--pe-text-muted)" }}
          >
            {group.label}
          </h3>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
            }}
          >
            {group.glyphs.map((glyph, i) => (
              <button
                key={`${group.id}-${i}-${glyph}`}
                type="button"
                onClick={() => onInsert(glyph)}
                disabled={!canInsert}
                aria-label={`Insert glyph ${glyph}`}
                className="inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  height: 40,
                  fontSize: 22,
                  lineHeight: 1,
                  color: "var(--pe-text)",
                  background: "transparent",
                  border: "1px solid var(--pe-border)",
                }}
                onMouseEnter={(e) => {
                  if (!canInsert) return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--pe-surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!canInsert) return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                {glyph}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
