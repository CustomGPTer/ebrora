// src/components/photo-editor/fonts/FontRow.tsx
//
// One row in the virtualised font list. Renders the family name in its
// own font once the menu subset has loaded (and in the system fallback
// before then).
//
// Lazy-loading: each row mounts an IntersectionObserver against itself.
// On entering the panel's scroll viewport (with a generous root margin
// so loads start *before* the row is visible), we kick off the menu
// font load. The font-store fires a re-render once the load resolves,
// and the row's preview text re-paints in the new font.
//
// On click: the row dispatches the user's selection upward; the panel
// is responsible for actually loading the full variant and patching the
// active text layer's runs.

"use client";

import { useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  loadMenuFont,
  menuFamilyName,
} from "@/lib/photo-editor/fonts/load-google-font";
import {
  useIsMenuLoaded,
  useIsVariantLoaded,
} from "@/lib/photo-editor/fonts/font-store";
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
  const menuReady = useIsMenuLoaded(family.family);
  // Even if our pendingVariant load completes we still show the checkmark
  // based on `active`. The variant flag here is only useful for debug.
  void useIsVariantLoaded(family.family, pendingVariant ?? "regular");

  // Trigger the menu-font load once the row is anywhere near the viewport.
  useEffect(() => {
    if (menuReady) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support — fall back to loading immediately.
      void loadMenuFont(family);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMenuFont(family);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [family, menuReady]);

  // CSS font-family: prefer the menu alias (so the family name is
  // rendered in its own font) once it's loaded; fall back to the system
  // sans-serif until then. The alias is registered at weight 400, style
  // normal — we use the same descriptors here.
  const previewFamily = menuReady
    ? `"${menuFamilyName(family.family)}", sans-serif`
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
