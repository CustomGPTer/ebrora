// src/components/photo-editor/stickers/StickerPanel.tsx
//
// Full Twemoji sticker picker. Replaces StickerPanelStub from Session 5.
//
// Layout (top → bottom inside the PanelDrawer body):
//   • Search input — case-insensitive match against every entry's label
//     and keywords. While searching, the category tabs collapse and the
//     grid shows search results across all categories.
//   • Recents strip — visible only when at least one recent sticker has
//     been used. Lives above the category tabs so it's always one tap
//     away regardless of which category the user landed on.
//   • Category tabs — 8 horizontal-scrolling tabs (Smileys, Animals,
//     Food, Travel, Activities, Objects, Symbols, Flags). Tab labels
//     render the category's first emoji as a tiny preview icon plus the
//     short label.
//   • Grid — current category's stickers, or the recents list when the
//     "Recents" pseudo-tab is active, or the search-result list when
//     the search input has content.
//
// Tap behaviour: any sticker tap creates a StickerLayer via the existing
// factory, centres it, dispatches ADD_LAYER + SET_SELECTION, and closes
// the panel. The panel also pushes the codepoint to the recents store so
// next session it surfaces in the recents strip.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Smile, Search } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { StickerGrid } from "./StickerGrid";
import { createStickerLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { twemojiUrl } from "@/lib/photo-editor/stickers/cdn-url";
import { loadRecents, pushRecent } from "@/lib/photo-editor/stickers/recents";
import {
  ALL_STICKERS,
  STICKER_CATEGORIES,
  STICKERS_BY_CATEGORY,
  findStickerByCodepoint,
  searchStickers,
  type StickerCategoryId,
  type StickerEntry,
} from "@/lib/photo-editor/stickers/catalogue";

interface StickerPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Default insertion size for a sticker layer — Twemoji at 200px reads
 *  comfortably on 1080-square Instagram canvases without dominating. */
const DEFAULT_STICKER_SIZE = 200;

export function StickerPanel({ open, onClose }: StickerPanelProps) {
  const { state, dispatch } = useEditor();

  // ─── Local state ─────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<StickerCategoryId>("smileys");
  const [recents, setRecents] = useState<string[]>(() => loadRecents());

  // Recents are loaded from localStorage on mount; refresh whenever the
  // panel re-opens so changes from another tab appear without reload.
  useEffect(() => {
    if (!open) return;
    setRecents(loadRecents());
  }, [open]);

  // ─── Tap handler ─────────────────────────────────────────────
  function handlePick(entry: StickerEntry) {
    const project = state.project;
    const baseLayer = createStickerLayer({
      stickerId: entry.codepoint,
      src: twemojiUrl(entry.codepoint),
      width: DEFAULT_STICKER_SIZE,
      height: DEFAULT_STICKER_SIZE,
      name: entry.label,
    });
    const positioned = centreLayerOnCanvas(
      baseLayer,
      project.width,
      project.height,
    );
    dispatch({ type: "ADD_LAYER", layer: positioned });
    dispatch({ type: "SET_SELECTION", ids: [positioned.id] });
    setRecents(pushRecent(entry.codepoint));
    onClose();
  }

  // ─── Resolved grid contents ──────────────────────────────────
  // Search wins over category. Otherwise the active category drives the
  // grid (or the recents pseudo-tab when activeCategory === "recents").
  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(
    () => (isSearching ? searchStickers(query) : []),
    [isSearching, query],
  );

  const recentEntries = useMemo<readonly StickerEntry[]>(() => {
    return recents
      .map((cp) => findStickerByCodepoint(cp))
      .filter((e): e is StickerEntry => e !== null);
  }, [recents]);

  const categoryEntries: readonly StickerEntry[] = useMemo(() => {
    if (isSearching) return searchResults;
    if (activeCategory === "recents") return recentEntries;
    return STICKERS_BY_CATEGORY[activeCategory];
  }, [isSearching, searchResults, activeCategory, recentEntries]);

  // ─── Footer ──────────────────────────────────────────────────
  const totalCount = ALL_STICKERS.length;
  const footer = isSearching ? (
    <span>
      {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for
      &ldquo;{query.trim()}&rdquo;
    </span>
  ) : (
    <span>
      {totalCount} stickers · Twemoji by Twitter, Inc., licensed under{" "}
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noreferrer noopener"
        style={{ color: "var(--pe-text-muted)", textDecoration: "underline" }}
      >
        CC&nbsp;BY&nbsp;4.0
      </a>
    </span>
  );

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Smile className="w-5 h-5" strokeWidth={1.75} />}
      title="Stickers"
      footer={footer}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div
          className="flex-none px-4 pt-3 pb-2"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.75}
              style={{ color: "var(--pe-text-subtle)" }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stickers"
              aria-label="Search stickers"
              className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none"
              style={{
                background: "var(--pe-surface-2)",
                color: "var(--pe-text)",
                border: "1px solid var(--pe-border)",
              }}
            />
          </div>
        </div>

        {/* Recents strip — only when the user has any recents */}
        {!isSearching && recents.length > 0 ? (
          <RecentsStrip
            entries={recentEntries}
            active={activeCategory === "recents"}
            onActivate={() => setActiveCategory("recents")}
          />
        ) : null}

        {/* Category tabs — hidden during search */}
        {!isSearching ? (
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
          />
        ) : null}

        {/* Grid — fills remaining space */}
        <div className="flex-1 overflow-y-auto p-3">
          <StickerGrid entries={categoryEntries} onPick={handlePick} />
        </div>
      </div>
    </PanelDrawer>
  );
}

// ─── Category tabs ──────────────────────────────────────────────
//
// Horizontal-scrolling row of tab buttons. The "Recents" pseudo-tab is
// surfaced separately by RecentsStrip above, so this row is only the
// real categories.

function CategoryTabs({
  active,
  onChange,
}: {
  active: StickerCategoryId;
  onChange: (id: StickerCategoryId) => void;
}) {
  return (
    <div
      className="flex-none flex gap-1 overflow-x-auto px-2 py-2"
      style={{
        borderBottom: "1px solid var(--pe-border)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {STICKER_CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            aria-label={cat.label}
            aria-pressed={isActive}
            title={cat.label}
            className="flex-none inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
            style={{
              background: isActive
                ? "var(--pe-tool-icon-active-bg)"
                : "transparent",
              color: isActive
                ? "var(--pe-tool-icon-active)"
                : "var(--pe-text-muted)",
              border: "1px solid var(--pe-border)",
            }}
          >
            <img
              src={twemojiUrl(cat.iconCodepoint)}
              alt=""
              aria-hidden
              loading="eager"
              decoding="async"
              style={{ width: 16, height: 16 }}
            />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Recents strip ──────────────────────────────────────────────
//
// One-row strip at the top showing up to ~8 recents in a horizontal
// scroll. Tapping a tile in the strip calls `onActivate` to switch the
// main grid to the Recents pseudo-tab; tapping a single sticker inside
// the strip is delegated to whatever surrounded it (the panel re-uses
// StickerGrid for the recents tab grid). The strip itself is just a
// "switch to recents" affordance.

function RecentsStrip({
  entries,
  active,
  onActivate,
}: {
  entries: readonly StickerEntry[];
  active: boolean;
  onActivate: () => void;
}) {
  if (entries.length === 0) return null;
  // Show up to 8 in the strip; the full list is one tap away via the
  // Recents tab.
  const preview = entries.slice(0, 8);

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label="Show recent stickers"
      aria-pressed={active}
      className="flex-none flex items-center gap-2 px-3 py-2 transition-colors text-left"
      style={{
        borderBottom: "1px solid var(--pe-border)",
        background: active
          ? "var(--pe-tool-icon-active-bg)"
          : "var(--pe-surface)",
        color: "var(--pe-text-muted)",
      }}
    >
      <span className="text-[11px] uppercase tracking-wide font-medium flex-none">
        Recent
      </span>
      <span className="flex items-center gap-1 overflow-hidden">
        {preview.map((entry) => (
          <img
            key={entry.codepoint}
            src={twemojiUrl(entry.codepoint)}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            draggable={false}
            style={{ width: 22, height: 22, flex: "0 0 auto" }}
          />
        ))}
      </span>
    </button>
  );
}
