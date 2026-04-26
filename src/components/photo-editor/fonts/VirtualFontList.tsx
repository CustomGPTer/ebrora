// src/components/photo-editor/fonts/VirtualFontList.tsx
//
// Hand-rolled virtualised list with a fixed row height. Mounting 1,806
// FontRows would each subscribe an IntersectionObserver and a font-store
// listener — too much. Windowing keeps the mounted set in the low tens.
//
// Implementation: an outer scroll container whose total inner height
// equals `items.length * ROW_HEIGHT`. We track scrollTop, compute the
// first / last visible index, and render an absolutely-positioned slice
// (plus a small buffer above / below). FontRow itself is told its `top`
// in pixels and renders at that offset.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontRow } from "./FontRow";
import type { GoogleFontFamily } from "@/lib/photo-editor/fonts/catalogue";

/** Single source of truth for row height. The panel's footer count math
 *  and the scroll-into-view computation both reference this. */
export const ROW_HEIGHT = 56;

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

  // Track the scroll viewport height so the visible-range calculation
  // shrinks gracefully on short panels.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const measure = () => setViewportHeight(node.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
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

  const totalHeight = items.length * ROW_HEIGHT;

  const { firstIndex, lastIndex } = useMemo(() => {
    if (viewportHeight <= 0 || items.length === 0) {
      return { firstIndex: 0, lastIndex: -1 };
    }
    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const last = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER,
    );
    return { firstIndex: first, lastIndex: last };
  }, [scrollTop, viewportHeight, items.length]);

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
                    top={idx * ROW_HEIGHT}
                    height={ROW_HEIGHT}
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
