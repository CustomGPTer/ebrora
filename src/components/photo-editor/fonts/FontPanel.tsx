// src/components/photo-editor/fonts/FontPanel.tsx
//
// Font picker — supports two modes:
//
//   1. Inline mode (`inline` prop) — used by BottomDock's TextEditPanel
//      from Batch I (Apr 2026) onward. Renders just the inner stack
//      (search + tabs + body + footer) inside a flex-col container
//      with bounded height. The component still owns its open-state-
//      independent logic (lazy catalogue load, font selection, etc.);
//      it just doesn't render its own slide-in chrome.
//
//   2. Drawer mode (default) — slide-in right-side overlay matching
//      LayersPanel's chrome, full-bleed sheet on mobile, 360px max
//      on lg+. Used when EditorShell mounted FontPanel via the
//      `activePanel === "fonts"` discriminator. Post-Batch I no UI
//      surface dispatches "fonts" anymore (the text Font tab went
//      inline), so the drawer mode is effectively orphaned in
//      practice — kept for API safety in case Jon re-uses it later
//      and so this batch doesn't have to also delete the drawer
//      mount in a single sweep.
//
// Layout (top → bottom, both modes):
//   • Header (drawer mode only): title + close button
//   • Search input
//   • Category tabs
//   • Body — depends on the active tab:
//       – Google catalogue tabs (All / Sans / Serif / Display /
//         Handwriting / Monospace) → VirtualFontList
//       – Custom → CustomFontUpload (paid-tier-gated)
//       – Glyph → GlyphPicker
//   • Footer: row count
//
// Selecting a font: pick the variant most closely matching the current
// run's weight + style, await its load, then dispatch UPDATE_LAYER with
// runs patched via applyStylePatch. Per the handover, if state.runSelection
// is null we patch the whole layer (start = 0, end = totalLength(runs)).
// When a run selection is active, only the selected range is patched.
//
// Glyph picker (Session 5 / Batch B rewire):
//   • If state.runSelection is set on the active text layer, the glyph
//     is inserted at the caret position (replacing any selected range)
//     via replaceTextRange. The caret advances past the inserted glyph.
//   • Otherwise (no inline-edit mode), the glyph is appended at the end
//     of the runs — same effective behaviour as the Session 4 stub but
//     routed through the same primitive so styling inheritance is
//     consistent.

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, Type as TypeIcon, X } from "lucide-react";
import { FontCategoryTabs } from "./FontCategoryTabs";
import { VirtualFontList } from "./VirtualFontList";
import { CustomFontUpload } from "./CustomFontUpload";
import { GlyphPicker } from "./GlyphPicker";
import { useEditor } from "../context/EditorContext";
import {
  filterByQuery,
  filterByTab,
  loadCatalogue,
  pickVariant,
  type FontPanelTab,
  type GoogleFontFamily,
} from "@/lib/photo-editor/fonts/catalogue";
import { loadGoogleFont } from "@/lib/photo-editor/fonts/load-google-font";
import {
  ensureCustomFontLoaded,
  type CustomFontRecord,
} from "@/lib/photo-editor/fonts/custom-fonts-db";
import { applyStylePatch, totalLength } from "@/lib/photo-editor/rich-text/glyph-run";
import {
  codePointLength,
  replaceTextRange,
} from "@/lib/photo-editor/rich-text/edit-ops";
import { useIsMobile } from "@/lib/photo-editor/util/use-is-mobile";
import type { AnyLayer, TextLayer } from "@/lib/photo-editor/types";

interface FontPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** Render the inner content directly, without slide-in drawer chrome.
   *  Used by BottomDock's TextEditPanel for the Font tab body. */
  inline?: boolean;
}

export function FontPanel({
  open = false,
  onClose,
  inline = false,
}: FontPanelProps) {
  const { state, dispatch } = useEditor();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<FontPanelTab>("all");
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<GoogleFontFamily[] | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [loadingFamily, setLoadingFamily] = useState<string | null>(null);

  // In inline mode the panel renders unconditionally inside the dock,
  // so the catalogue should fetch on mount. In drawer mode it should
  // only fetch when the panel is opened (lazy first-open).
  const shouldFetchCatalogue = inline || open;

  // Lazy catalogue fetch — runs the first time the panel opens (or on
  // mount in inline mode), then memoised by loadCatalogue itself for
  // the rest of the session.
  useEffect(() => {
    if (!shouldFetchCatalogue) return;
    if (catalogue !== null) return;
    if (catalogueError !== null) return;
    let cancelled = false;
    loadCatalogue()
      .then((data) => {
        if (!cancelled) setCatalogue(data.items);
      })
      .catch((err) => {
        if (cancelled) return;
        setCatalogueError(
          err instanceof Error ? err.message : "Could not load font catalogue.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [shouldFetchCatalogue, catalogue, catalogueError]);

  // Close on Escape — drawer mode only; inline has no close action.
  useEffect(() => {
    if (inline) return;
    if (!open) return;
    if (!onClose) return;
    const handler = onClose;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inline, open, onClose]);

  // Resolve the selected text layer (if exactly one is selected and is
  // a text layer). Drives the active-row checkmark + whether selection
  // application is enabled.
  const selectedTextLayer = useMemo<TextLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const layer = state.project.layers.find((l) => l.id === id);
    if (!layer || layer.kind !== "text") return null;
    return layer as TextLayer;
  }, [state.selection, state.project.layers]);

  // Active family — the family of the first run if every run shares
  // it, otherwise null (mixed selection → no checkmark).
  const activeFamily = useMemo<string | null>(() => {
    if (!selectedTextLayer) return null;
    const runs = selectedTextLayer.runs;
    if (runs.length === 0) return null;
    const first = runs[0].fontFamily;
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].fontFamily !== first) return null;
    }
    return first;
  }, [selectedTextLayer]);

  // Filtered + searched list for the active Google catalogue tab.
  const visibleItems = useMemo<GoogleFontFamily[]>(() => {
    if (catalogue === null) return [];
    if (activeTab === "custom" || activeTab === "glyph") return [];
    const filtered = filterByTab(catalogue, activeTab);
    return filterByQuery(filtered, query);
  }, [catalogue, activeTab, query]);

  // ─── Apply a Google font to the selected layer ────────────────
  async function applyGoogleFont(family: GoogleFontFamily) {
    if (!selectedTextLayer) return;

    // Pick the variant that best matches the current run's weight +
    // style. Use the first run's descriptors as the reference point.
    const ref = selectedTextLayer.runs[0];
    const weight = ref?.fontWeight ?? 400;
    const style = ref?.fontStyle ?? "normal";
    const variant = pickVariant(family, weight, style) ?? "regular";

    setLoadingFamily(family.family);
    try {
      await loadGoogleFont(family, variant);
    } finally {
      setLoadingFamily(null);
    }

    applyFontFamilyToLayer(selectedTextLayer, family.family);
  }

  // ─── Apply a custom font to the selected layer ────────────────
  async function applyCustomFont(record: CustomFontRecord) {
    if (!selectedTextLayer) return;
    setLoadingFamily(record.family);
    try {
      await ensureCustomFontLoaded(record);
    } finally {
      setLoadingFamily(null);
    }
    applyFontFamilyToLayer(selectedTextLayer, record.family);
  }

  // Shared dispatch path for both Google + custom fonts. Patches via
  // applyStylePatch (the per-letter primitive) — full layer if no run
  // selection is active, otherwise just the selected range.
  function applyFontFamilyToLayer(layer: TextLayer, family: string) {
    const runSel = state.runSelection;
    const start =
      runSel && runSel.layerId === layer.id ? runSel.start : 0;
    const end =
      runSel && runSel.layerId === layer.id
        ? runSel.end
        : totalLength(layer.runs);
    const nextRuns = applyStylePatch(layer.runs, start, end, {
      fontFamily: family,
    });
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { runs: nextRuns } as Partial<AnyLayer>,
    });
  }

  // ─── Insert a glyph into the selected layer ───────────────────
  //
  // Session 5 / Batch B rewire (handover gotcha #28). When the layer is
  // in inline-edit mode (state.runSelection is set on it), insert at
  // the caret — replacing any selected range — and advance the caret
  // past the inserted glyph. Otherwise append at the end.
  function insertGlyph(glyph: string) {
    if (!selectedTextLayer) return;
    if (selectedTextLayer.runs.length === 0) return;

    const runSel = state.runSelection;
    const isEditingThis =
      runSel !== null && runSel.layerId === selectedTextLayer.id;

    const total = totalLength(selectedTextLayer.runs);
    const start = isEditingThis
      ? Math.min(runSel.start, runSel.end)
      : total;
    const end = isEditingThis
      ? Math.max(runSel.start, runSel.end)
      : total;

    const nextRuns = replaceTextRange(
      selectedTextLayer.runs,
      start,
      end,
      glyph,
    );
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedTextLayer.id,
      patch: { runs: nextRuns } as Partial<AnyLayer>,
    });

    // Advance the caret past the inserted glyph if we're in edit mode.
    // Outside edit mode there's no caret to advance — appending at the
    // end was a one-shot insert, the user isn't "typing".
    if (isEditingThis) {
      const newCaret = start + codePointLength(glyph);
      dispatch({
        type: "SET_RUN_SELECTION",
        layerId: selectedTextLayer.id,
        start: newCaret,
        end: newCaret,
      });
    }
  }

  // ─── Body content for the active tab ──────────────────────────
  const isGoogleTab =
    activeTab !== "custom" && activeTab !== "glyph";

  let body: ReactNode;
  if (activeTab === "custom") {
    body = (
      <CustomFontUpload
        activeFamily={activeFamily}
        loadingFamily={loadingFamily}
        canApplyToLayer={selectedTextLayer !== null}
        onApply={(record) => void applyCustomFont(record)}
      />
    );
  } else if (activeTab === "glyph") {
    body = (
      <GlyphPicker
        canInsert={selectedTextLayer !== null}
        onInsert={insertGlyph}
      />
    );
  } else if (catalogueError) {
    body = (
      <div
        className="flex-1 flex items-center justify-center px-6 text-sm text-center"
        style={{ color: "var(--pe-text-muted)" }}
      >
        {catalogueError}
      </div>
    );
  } else if (catalogue === null) {
    body = (
      <div
        className="flex-1 flex items-center justify-center text-sm"
        style={{ color: "var(--pe-text-subtle)" }}
      >
        Loading fonts…
      </div>
    );
  } else {
    body = (
      <VirtualFontList
        items={visibleItems}
        activeFamily={activeFamily}
        loadingFamily={loadingFamily}
        onSelect={(f) => void applyGoogleFont(f)}
      />
    );
  }

  // Footer text differs by tab.
  let footerText: string;
  if (activeTab === "glyph") {
    footerText = "Glyph picker";
  } else if (activeTab === "custom") {
    footerText = "Custom fonts";
  } else if (catalogue === null) {
    footerText = "Loading…";
  } else {
    footerText = `${visibleItems.length.toLocaleString()} font${
      visibleItems.length === 1 ? "" : "s"
    }`;
  }

  // Inner content stack shared by both modes — search input (Google
  // tabs only) + category tabs + selection hint + body + footer.
  const innerStack = (
    <>
      {/* Search — visible on Google catalogue tabs only */}
      {isGoogleTab ? (
        <div
          className="flex-none px-3 py-2"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <div
            className="flex items-center gap-2 px-3 rounded-full"
            style={{
              height: 36,
              background: "var(--pe-surface-2)",
              border: "1px solid var(--pe-border)",
            }}
          >
            <Search
              className="w-4 h-4 flex-none"
              strokeWidth={2}
              style={{ color: "var(--pe-text-subtle)" }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts"
              aria-label="Search fonts"
              className="flex-1 bg-transparent border-0 outline-none text-sm"
              style={{
                color: "var(--pe-text)",
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <FontCategoryTabs
        active={activeTab}
        onChange={setActiveTab}
        catalogue={catalogue}
      />

      {/* Hint when no text layer is selected */}
      {selectedTextLayer === null && isGoogleTab ? (
        <div
          className="flex-none px-4 py-2 text-xs text-center"
          style={{
            background: "var(--pe-surface-2)",
            color: "var(--pe-text-muted)",
            borderBottom: "1px solid var(--pe-border)",
          }}
        >
          Select a text layer to apply a font.
        </div>
      ) : null}

      {/* Body */}
      {body}

      {/* Footer */}
      <div
        className="flex-none px-4 py-3 text-xs"
        style={{
          borderTop: "1px solid var(--pe-border)",
          color: "var(--pe-text-subtle)",
        }}
      >
        {footerText}
      </div>
    </>
  );

  // ─── Inline mode ─────────────────────────────────────────────────
  // Renders the inner stack inside a bounded flex-col container so
  // VirtualFontList's `flex-1 overflow-y-auto` has a height reference.
  //
  // Height is mobile-aware:
  //   • Mobile (≤1023px): 44vh — a 20% reduction from the original
  //     55vh that gives the canvas more breathing room above the dock
  //     while still leaving ~5 font rows visible at the 44px mobile
  //     row height.
  //   • Tablet / desktop: 55vh — original value, ~8 font rows with
  //     comfortable scroll headroom while leaving the canvas visible
  //     above the dock.
  if (inline) {
    return (
      <div
        className="flex flex-col rounded-lg overflow-hidden"
        style={{
          height: isMobile ? "44vh" : "55vh",
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border)",
        }}
      >
        {innerStack}
      </div>
    );
  }

  // ─── Drawer mode ─────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[210] h-full w-[88vw] max-w-[360px] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--pe-surface)",
          borderLeft: "1px solid var(--pe-border)",
          boxShadow: open ? "var(--pe-shadow-lg)" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Fonts"
      >
        {/* Header */}
        <div
          className="flex-none flex items-center justify-between px-4"
          style={{
            height: 52,
            borderBottom: "1px solid var(--pe-border)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{ color: "var(--pe-text)" }}
          >
            <TypeIcon className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-sm font-semibold">Fonts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fonts panel"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-tool-icon)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--pe-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {innerStack}
      </aside>
    </>
  );
}
