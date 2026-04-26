// src/components/photo-editor/stickers/StickerGrid.tsx
//
// Reusable grid of sticker thumbnails. Used by StickerPanel both for
// category browsing and for search results.
//
// Virtualisation: per HANDOVER §7.5 Q1, v1 ships without explicit
// virtualisation. We rely on `<img loading="lazy">` to defer off-screen
// CDN fetches — Chromium / Firefox / Safari all support it natively, and
// it gets us most of the perceived performance benefit on mobile without
// adding a windowing dependency. If profiling shows scroll lag on low-
// end devices we can revisit (react-window slot already noted in the
// handover).

"use client";

import type { StickerEntry } from "@/lib/photo-editor/stickers/catalogue";
import { twemojiUrl } from "@/lib/photo-editor/stickers/cdn-url";

interface StickerGridProps {
  entries: readonly StickerEntry[];
  onPick: (entry: StickerEntry) => void;
  /** Pixel size of each thumbnail. Defaults to 56 (fits a 4-col grid in
   *  the 360-px-max-width PanelDrawer). */
  thumbSize?: number;
  /** Number of columns. Defaults to 4. */
  columns?: number;
}

export function StickerGrid({
  entries,
  onPick,
  thumbSize = 56,
  columns = 4,
}: StickerGridProps) {
  if (entries.length === 0) {
    return (
      <div
        className="px-2 py-6 text-center text-xs"
        style={{ color: "var(--pe-text-subtle)" }}
      >
        No matches.
      </div>
    );
  }

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {entries.map((entry) => (
        <button
          key={entry.codepoint}
          type="button"
          onClick={() => onPick(entry)}
          aria-label={`Add ${entry.label} sticker`}
          title={entry.label}
          className="aspect-square rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: "var(--pe-surface-2)",
            border: "1px solid var(--pe-border)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--pe-tool-icon-active-bg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--pe-surface-2)";
          }}
        >
          <img
            src={twemojiUrl(entry.codepoint)}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{
              width: thumbSize * 0.7,
              height: thumbSize * 0.7,
              maxWidth: "70%",
              maxHeight: "70%",
            }}
          />
        </button>
      ))}
    </div>
  );
}
