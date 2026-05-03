// src/lib/photo-editor/pwa/install-prompt.ts
//
// PWA install-prompt detection (Session 8).
//
// Modern Chromium-based browsers fire a `beforeinstallprompt` event
// when an installable PWA is loaded; the spec lets us call
// `prompt()` later in response to a user gesture (e.g. tapping a menu
// item) so the install dialog can fire on demand rather than landing
// the moment the page loads.
//
// Safari (desktop and iOS) doesn't fire the event — installation
// happens via the browser's Share → Add to Home Screen flow. We
// surface the menu item only when `canInstall` is true, so Safari
// users see no menu item rather than a broken one.
//
// Usage:
//   const { canInstall, install } = useInstallPrompt();
//   if (canInstall) <button onClick={install}>Install</button>
//
// The hook subscribes to a singleton listener so multiple consumers
// (HamburgerCorner, the EditorShell, and any future banner) share one
// captured prompt.

"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
type Subscriber = (canInstall: boolean) => void;
const subscribers = new Set<Subscriber>();
let listenersAttached = false;

function notify() {
  for (const sub of subscribers) {
    try {
      sub(deferredPrompt !== null);
    } catch {
      // ignore subscriber errors
    }
  }
}

function ensureListeners() {
  if (listenersAttached) return;
  if (typeof window === "undefined") return;
  listenersAttached = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

/** React hook — returns the current install state and a callback to
 *  trigger the browser install prompt. The callback resolves to true
 *  if the user accepted, false if they dismissed or the prompt isn't
 *  available. */
export function useInstallPrompt(): {
  canInstall: boolean;
  install: () => Promise<boolean>;
} {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    ensureListeners();
    setCanInstall(deferredPrompt !== null);
    const sub: Subscriber = (next) => setCanInstall(next);
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  async function install(): Promise<boolean> {
    if (!deferredPrompt) return false;
    const evt = deferredPrompt;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      // The spec says the deferred prompt cannot be reused; null it out
      // either way.
      deferredPrompt = null;
      notify();
      return choice.outcome === "accepted";
    } catch {
      deferredPrompt = null;
      notify();
      return false;
    }
  }

  return { canInstall, install };
}

/** React hook — returns true when the page is running as an installed
 *  PWA (standalone display mode). Used to hide install CTAs once the
 *  user is already in the app.
 *
 *  Detection paths:
 *    1. `matchMedia('(display-mode: standalone)')` — modern Chromium /
 *       Firefox / Safari 17+. The matchMedia object also fires change
 *       events when the display mode flips (e.g. user installs while
 *       the page is open), which we listen to so the banner disappears
 *       without a refresh.
 *    2. `navigator.standalone` — legacy iOS Safari. Read once on mount;
 *       iOS doesn't change this value during a page session.
 *
 *  Mobile-fixes batch 2 (May 2026) — issue 5. The PWA install banner
 *  on the EmptyState home view shows whenever `canInstall` is true AND
 *  this hook returns false.
 */
export function useIsStandaloneMode(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const mq = window.matchMedia?.("(display-mode: standalone)");
      const matches = mq?.matches === true;
      // iOS Safari legacy property.
      const iosStandalone =
        typeof (navigator as { standalone?: boolean }).standalone ===
          "boolean" &&
        (navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(matches || iosStandalone);
    };

    checkStandalone();

    const mq = window.matchMedia?.("(display-mode: standalone)");
    if (!mq) return;
    const handler = () => checkStandalone();
    // addEventListener is the modern API; older Safari needs addListener.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    // Legacy fallback for older browsers — addListener / removeListener
    // were deprecated in 2019 but still need to be supported on iOS 13.
    type LegacyMQL = MediaQueryList & {
      addListener: (cb: (ev: MediaQueryListEvent) => void) => void;
      removeListener: (cb: (ev: MediaQueryListEvent) => void) => void;
    };
    const legacyMq = mq as LegacyMQL;
    legacyMq.addListener(handler);
    return () => legacyMq.removeListener(handler);
  }, []);

  return isStandalone;
}
