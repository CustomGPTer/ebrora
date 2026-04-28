// src/components/photo-editor/fonts/FontRow.tsx
//
// One row in the virtualised font list. Renders the family name in its
// own font once the regular variant has loaded (and in the system
// fallback before then).
//
// Lazy-loading: each row mounts an IntersectionObserver against itself.
// On entering the panel's scroll viewport (with a generous root margin
// so loads start *before* the row is visible), we kick off the regular
// variant load via loadGoogleFont — the same path the category tabs
// use for their representative fonts. The font-store fires a re-render
// once the load resolves, and the row's preview text re-paints in the
// new font.
//
// We deliberately use the full regular variant rather than Google's
// "menu" subset (a tiny .ttf containing just the family-name glyphs).
// The menu URLs proved unreliable in production — silently failing to
// register the FontFace in some environments and leaving every row in
// the system fallback. Full variants are larger (~50–200KB each vs
// ~4KB) but the browser caches them for a year (gstatic ships a
// 31536000s max-age) so it's a one-time cost per font, and applying
// the font to a layer becomes free because it's already loaded.
//
// On click: the row dispatches the user's selection upward; the panel
// is responsible for actually loading the full variant (idempotent —
// shares the same promise if the row already triggered it) and patching
// the active text layer's runs.

"use client";

import { useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { loadGoogleFont } from "@/lib/photo-editor/fonts/load-google-font";
import { useIsVariantLoaded } from "@/lib/photo-editor/fonts/font-store";
import { pickVariant } from "@/lib/photo-editor/fonts/catalogue";
import type { GoogleFontFamily } from "@/lib/photo-editor/fonts/catalogue";

interface FontRowProps {
  family: GoogleFontFamily;
  /** Pixel offset from the top of the virtualised list. */
  top: number;
  /** Row height — matches VirtualFontList's ROW_HEIGHT. */
  height: number;
  /** Currently active for the selected layer. Drives the checkmark. */
  active: boolean;
  /** True while a click is awaiting the full-variant load. */
  loading: boolean;
  /** Variant we'll attempt to apply. Used so the in-progress UI knows
   *  what's loading. Optional — caller may not have decided yet. */
  pendingVariant?: string;
  onSelect: (family: GoogleFontFamily) => void;
}

export function FontRow({
  family,
  top,
  height,
  active,
  loading,
  pendingVariant,
  onSelect,
}: FontRowProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  // Resolve the variant we'll preview with. Use the same picker the
  // panel does on click so both the row's preview and the user's
  // eventual selection share a single load — no duplicate fetch when
  // the user actually applies the font.
  const previewVariant = pickVariant(family, 400, "normal") ?? "regular";
  const previewLoaded = useIsVariantLoaded(family.family, previewVariant);

  // Trigger the variant load once the row is anywhere near the viewport.
  useEffect(() => {
    if (previewLoaded) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support — fall back to loading immediately.
      void loadGoogleFont(family, previewVariant);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadGoogleFont(family, previewVariant);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [family, previewLoaded, previewVariant]);

  // CSS font-family: prefer the real family name once the variant is
  // loaded, falling back to the system sans-serif until then. We quote
  // the family name to handle multi-word family names that contain
  // spaces (e.g. "Aguafina Script"). The pendingVariant prop is a
  // legacy hook for the panel's "applying…" UI; the variant flag here
  // is read just so React subscribes to its load event for any
  // pending-variant case the panel hasn't already covered.
  void useIsVariantLoaded(family.family, pendingVariant ?? previewVariant);
  const previewFamily = previewLoaded
    ? `"${family.family}", sans-serif`
    : "var(--pe-fallback-font, system-ui, sans-serif)";

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(family)}
      aria-pressed={active}
      className="absolute left-0 right-0 flex items-center justify-between px-4 transition-colors text-left"
      style={{
        top,
        height,
        background: active ? "var(--pe-tool-icon-active-bg)" : "transparent",
        color: active ? "var(--pe-text)" : "var(--pe-text)",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span
        className="truncate"
        style={{
          fontFamily: previewFamily,
          fontSize: 22,
          lineHeight: 1.2,
          // Keep the visual height stable while the menu font is still
          // loading so the row doesn't reflow when the alias resolves.
          minHeight: 28,
        }}
      >
        {family.family}
      </span>
      <span
        className="flex-none ml-3 inline-flex items-center justify-center"
        style={{ width: 24, height: 24 }}
      >
        {loading ? (
          <Loader2
            className="w-4 h-4 animate-spin"
            strokeWidth={2}
            style={{ color: "var(--pe-text-muted)" }}
          />
        ) : active ? (
          <Check
            className="w-4 h-4"
            strokeWidth={2.5}
            style={{ color: "var(--pe-accent)" }}
          />
        ) : null}
      </span>
    </button>
  );
}
