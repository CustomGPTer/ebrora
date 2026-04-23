// src/components/site-photo-stamp/InstallPrompt.tsx
//
// Dedicated install card for Ebrora Photo Stamp.
//
// Behaviour:
//   • Shows only when the page is NOT already running as an installed PWA
//   • Honours a local dismissal cookie so we don't nag people who said no
//   • Registers the /site-photo-stamp/ service worker on mount — this is
//     required before Chrome / Chromium will ever fire the install event.
//     Without a registered SW the Android branch is dead code.
//   • On Android / Chromium: listens for `beforeinstallprompt`, then triggers
//     the native install dialog when the user taps our Install button
//   • On iOS Safari: Apple doesn't support programmatic install, so we show
//     an inline "Share → Add to Home Screen" illustration instead
//   • Fallback: after FALLBACK_DELAY_MS the card is surfaced with the
//     "open your browser menu" hint even if `beforeinstallprompt` never
//     fires (Firefox, Samsung Internet, Brave, and Chrome before the user
//     has built up enough engagement all fall into this bucket).
//   • The card uses the Photo Stamp wordmark so it's visually distinct from
//     any future Ebrora-wide install prompt
"use client";

import { useEffect, useState, useCallback } from "react";

const DISMISS_KEY = "spstamp:install:dismissed-until";
const DISMISS_DAYS = 14;            // how long to suppress after the user closes the card
const APPEAR_DELAY_MS = 1800;       // let the page render first so we're not intrusive
const FALLBACK_DELAY_MS = 4500;     // surface the soft-hint card anyway if the install event
                                    // never fires — covers non-Chromium mobile browsers

type Platform = "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    const n = parseInt(until, 10);
    if (Number.isNaN(n)) return false;
    return Date.now() < n;
  } catch {
    return false;
  }
}

// ─── Service worker registration ────────────────────────────────

function registerPhotoStampServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Don't bother in non-secure contexts (SW registration would fail anyway).
  if (!window.isSecureContext) return;

  const register = () => {
    navigator.serviceWorker
      .register("/site-photo-stamp/sw.js", { scope: "/site-photo-stamp/" })
      .catch(() => {
        // Non-fatal — the app still works without SW; we just won't be able
        // to surface the native install dialog, and the fallback card will
        // direct the user to their browser menu instead.
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installing, setInstalling] = useState(false);

  // Register the SW on mount. This needs to run before Chrome will ever
  // decide the page is installable, and it's idempotent so re-mounts are
  // fine. Not gated on isStandalone / isDismissed — we want the SW live
  // even for users who've dismissed the install card, so the PWA still
  // works offline and is installable through their browser menu.
  useEffect(() => {
    registerPhotoStampServiceWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't show when already installed.
    if (isStandalone()) return;
    // Respect prior dismissal.
    if (isDismissed()) return;

    const p = detectPlatform();
    setPlatform(p);

    // iOS has no beforeinstallprompt — show our inline instructions after
    // a short delay so the page has time to render first.
    if (p === "ios") {
      const t = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
      return () => clearTimeout(t);
    }

    // Android / Chromium — wait for the browser to signal installability,
    // then surface our styled prompt in place of the native mini-infobar.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Fallback timer — covers browsers that never fire beforeinstallprompt
    // (Firefox, Samsung Internet, Brave) and Chrome pre-engagement. If the
    // real event fires later, AndroidAction upgrades the soft-hint text to
    // a live "Install app" button because `deferred` flips truthy.
    const fallback = setTimeout(() => setVisible(true), FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(fallback);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred || installing) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        // User picked "cancel" inside the native dialog — snooze our card too.
        snooze();
        setVisible(false);
      }
      setDeferred(null);
    } catch {
      // Rare: the prompt can be rejected by the browser if called twice.
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  }, [deferred, installing]);

  const snooze = () => {
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      // ignore quota / private mode failures
    }
  };

  const dismiss = () => {
    snooze();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 pt-6 pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <div
        role="dialog"
        aria-labelledby="spstamp-install-title"
        className="pointer-events-auto max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300"
      >
        {/* Header row with icon + wordmark text + close */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/site-photo-stamp/icon-192.png"
            alt=""
            className="w-14 h-14 rounded-2xl shrink-0 shadow-sm ring-1 ring-black/5"
            width={56}
            height={56}
          />
          <div className="flex-1 min-w-0">
            <h3
              id="spstamp-install-title"
              className="text-[15px] font-bold text-gray-900 leading-tight"
            >
              Install Ebrora Photo Stamp
            </h3>
            <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
              Add to your home screen — opens fullscreen like a native app.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
            aria-label="Not now"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4">
          {platform === "ios" ? <IosInstructions /> : <AndroidAction onInstall={install} ready={!!deferred} installing={installing} />}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 -mt-1 flex items-center justify-center gap-1.5 text-[10.5px] text-gray-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No app store. No login. Works offline.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Android / Chromium ─────────────────────────────────────────

function AndroidAction({
  onInstall,
  ready,
  installing,
}: {
  onInstall: () => void;
  ready: boolean;
  installing: boolean;
}) {
  if (ready) {
    return (
      <button
        type="button"
        onClick={onInstall}
        disabled={installing}
        className="w-full py-3 rounded-xl bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144540] transition-colors active:scale-[0.98] shadow-sm disabled:opacity-70"
      >
        {installing ? "Opening install…" : "Install app"}
      </button>
    );
  }
  // Browsers that haven't fired beforeinstallprompt yet — show a soft hint.
  return (
    <div className="px-3 py-2.5 rounded-xl bg-gray-50 text-[12px] text-gray-600 leading-relaxed">
      In your browser menu (⋮), tap{" "}
      <span className="font-semibold text-gray-900">Install app</span> or{" "}
      <span className="font-semibold text-gray-900">Add to Home screen</span>.
    </div>
  );
}

// ─── iOS Safari ─────────────────────────────────────────────────

function IosInstructions() {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[12px] font-semibold text-gray-900 mb-2">To install:</p>
      <ol className="space-y-2 text-[12px] text-gray-700">
        <li className="flex items-center gap-2.5">
          <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
            1
          </span>
          <span className="flex items-center gap-1.5 flex-1">
            Tap the Share icon
            <svg className="w-4 h-4 text-[#1B5B50] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
            </svg>
            at the bottom of Safari
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
            2
          </span>
          <span className="flex-1">
            Choose <span className="font-semibold text-gray-900">Add to Home Screen</span>
          </span>
        </li>
      </ol>
    </div>
  );
}
