// src/components/photo-editor/fonts/VirtualFontList.tsx
//
// Hand-rolled virtualised list with a fixed row height. Mounting 1,806
// FontRows would each subscribe an IntersectionObserver and a font-store
// listener — too much. Windowing keeps the mounted set in the low tens.
//
// Implementation: an outer scroll container whose total inner height
// equals `items.length * rowHeight`. We track scrollTop, compute the
// first / last visible index, and render an absolutely-positioned slice
// (plus a small buffer above / below). FontRow itself is told its `top`
// in pixels and renders at that offset.
//
// Row height is mobile-aware: 44px on the editor's mobile breakpoint
// (the iOS Human Interface Guidelines / WCAG 2.5.5 tap-target floor),
// 56px on tablet/desktop. Switching is driven by `useIsMobile`, which
// updates on viewport resize so a phone rotated to landscape past the
// breakpoint snaps to the desktop height in a single render — totalHeight,
// scroll-window math, and per-row positioning all recompute together
// because every consumer reads the same `rowHeight` value.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontRow } from "./FontRow";
import type { GoogleFontFamily } from "@/lib/photo-editor/fonts/catalogue";
import { useIsMobile } from "@/lib/photo-editor/util/use-is-mobile";

/** Desktop / drawer-mode row height. Footer count math and scroll-into-
 *  view computation reference this when the viewport is wider than the
 *  editor's mobile breakpoint. Exported for any downstream caller that
 *  wants the canonical desktop value (e.g. for a scroll-restoration
 *  calculation). */
export const ROW_HEIGHT = 56;

/** Mobile row height — 44px sits at the iOS Human Interface Guidelines
 *  / WCAG 2.5.5 (Level AA) tap-target floor. Picked over a literal halve
 *  of the desktop value (28px) to preserve thumb accuracy on the inline
 *  font picker, where a single mis-tap re-applies the wrong font and
 *  forces the user to scroll-and-correct. */
export const ROW_HEIGHT_MOBILE = 44;

/** Extra rows rendered above / below the visible range so a fast flick
 *  doesn't show blanks before our scroll handler catches up. */
const BUFFER = 6;

interface VirtualFontListProps {
  items: GoogleFontFamily[];
  activeFamily: string | null;
  loadingFamily: string | null;
  onSelect: (family: GoogleFontFamily) => void;
}

export function VirtualFontList({
  items,
  activeFamily,
  loadingFamily,
  onSelect,
}: VirtualFontListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Pick the row height for the current viewport. `useIsMobile` returns
  // false during SSR / first paint, so the very first frame on a real
  // phone uses the desktop height (56px) — it then snaps to 44px once
  // the matchMedia effect runs. Acceptable for a single frame; avoids
  // hydration mismatches.
  const isMobile = useIsMobile();
  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;

  // Track the scroll viewport height so the visible-range calculation
  // shrinks gracefully on short panels.
  //
  // We measure on mount, then again on the next animation frame, and
  // also subscribe to a ResizeObserver. The next-frame remeasure
  // matters in practice: the panel slides in from off-screen via a
  // CSS transform, and on first mount inside a flex column some
  // browsers (notably iOS Safari) report clientHeight of 0 until
  // layout has fully settled — without the rAF retry the list would
  // start empty and only fix itself on the first scroll/resize.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const measure = () => setViewportHeight(node.clientHeight);
    measure();

    let raf: number | null = null;
    if (typeof requestAnimationFrame !== "undefined") {
      raf = requestAnimationFrame(() => {
        raf = null;
        measure();
      });
    }

    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (raf !== null) cancelAnimationFrame(raf);
      };
    }
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  const onScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setScrollTop(node.scrollTop);
  }, []);

  // Reset scroll when the items array reference changes — usually means
  // the user switched tabs or typed in the search box. Without this, a
  // narrow tab inherits the previous tab's scroll position which can
  // leave it scrolled past its end.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = 0;
    setScrollTop(0);
  }, [items]);

  const totalHeight = items.length * rowHeight;

  const { firstIndex, lastIndex } = useMemo(() => {
    if (items.length === 0) {
      return { firstIndex: 0, lastIndex: -1 };
    }
    // Fallback visible window when measurement hasn't landed yet
    // (clientHeight can read as 0 inside a still-laying-out flex
    // column on first paint). 1024px covers any phone screen with
    // headroom, so we render a generous initial slice rather than
    // showing a blank list until the next frame.
    const effectiveHeight = viewportHeight > 0 ? viewportHeight : 1024;
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER);
    const last = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + effectiveHeight) / rowHeight) + BUFFER,
    );
    return { firstIndex: first, lastIndex: last };
  }, [scrollTop, viewportHeight, items.length, rowHeight]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto relative"
      onScroll={onScroll}
      style={{
        background: "var(--pe-surface)",
      }}
    >
      {items.length === 0 ? (
        <div
          className="px-4 py-8 text-sm text-center"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          No fonts match this filter.
        </div>
      ) : (
        <div style={{ height: totalHeight, position: "relative" }}>
          {firstIndex <= lastIndex
            ? items.slice(firstIndex, lastIndex + 1).map((family, i) => {
                const idx = firstIndex + i;
                return (
                  <FontRow
                    key={family.family}
                    family={family}
                    top={idx * rowHeight}
                    height={rowHeight}
                    active={family.family === activeFamily}
                    loading={family.family === loadingFamily}
                    onSelect={onSelect}
                  />
                );
              })
            : null}
        </div>
      )}
    </div>
  );
}
