// src/lib/photo-editor/util/use-is-mobile.ts
//
// Editor-wide mobile breakpoint detector. Matches the
// `(max-width: 1023px)` breakpoint defined in PhotoEditorClient's
// full-screen overrides so any "mobile-only" UI tweak shares a single
// source of truth — change the breakpoint here and every consumer
// follows.
//
// SSR-safe: returns `false` during the server render and on the very
// first client paint, then resolves to the real value inside an effect.
// This avoids hydration mismatches; on a real mobile device the
// "wrong" desktop value flashes for at most one frame before snapping.
//
// Subscribes to the MediaQueryList so a viewport resize (orientation
// change, dev-tools docking, foldable opening, etc.) updates every
// consumer in lockstep.

"use client";

import { useEffect, useState } from "react";

/** Editor mobile breakpoint. Mirrors the `@media (max-width: 1023px)`
 *  rule in PhotoEditorClient's `pe-fullscreen-overrides` style block. */
export const MOBILE_BREAKPOINT_QUERY = "(max-width: 1023px)";

/** True when the viewport matches the editor's mobile breakpoint.
 *  Returns `false` during SSR and on the first synchronous render. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;

    const mq = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();

    // Modern API (Safari 14+, all evergreen browsers).
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    // Legacy fallback for old Safari / pre-Chromium Edge — addListener
    // is the deprecated MediaQueryList API still present on those
    // engines. Cast around the deprecation to keep TS strict-mode
    // happy without disabling lint everywhere.
    type LegacyMql = MediaQueryList & {
      addListener: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
    };
    const legacy = mq as LegacyMql;
    legacy.addListener(update);
    return () => legacy.removeListener(update);
  }, []);

  return isMobile;
}
