// src/components/site-photo-stamp/InstallPrompt.tsx
//
// Add-to-home-screen prompt. Shows once per session.
//
// - Android + modern Chromium browsers: uses `beforeinstallprompt`.
// - iOS Safari (no event API): static instruction card with step-by-step.
// - Already installed (standalone display mode) or dismissed this session: hidden.
"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "spstamp:install-dismissed";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Mode = "android" | "ios" | null;

export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>(null);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip if already dismissed this session.
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      // sessionStorage unavailable (e.g. private browsing restrictions) — proceed.
    }

    // Skip if already installed (standalone or iOS standalone).
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Android path — listen for the native event.
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setMode("android");
      // Small delay so it doesn't jump in on first paint.
      setTimeout(() => setVisible(true), 1200);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS detection — Safari on iOS/iPadOS. Exclude in-app browsers.
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (isIOS && isSafari) {
      setMode("ios");
      setTimeout(() => setVisible(true), 1500);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // user cancelled or platform error — either way, dismiss for this session.
    }
    dismiss();
  };

  if (!mode || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[90] px-4 pb-4 pt-3"
      role="dialog"
      aria-label="Install Site Photo Stamp"
    >
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-4 flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-[#1B5B50] flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            E
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">
              Install Site Photo Stamp
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {mode === "android"
                ? "Add to your home screen for quick one-tap access to site photo recording."
                : "Tap the Share button, then choose 'Add to Home Screen' for quick access on site."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 text-gray-400 hover:text-gray-600 p-1 -m-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === "android" && (
          <div className="px-4 pb-4 flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={install}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#1B5B50] hover:bg-[#144540] rounded-lg transition-colors"
            >
              Install
            </button>
          </div>
        )}

        {mode === "ios" && (
          <div className="px-4 pb-4">
            <ol className="text-xs text-gray-600 space-y-1.5 pl-1">
              <li className="flex gap-2">
                <span className="font-semibold text-[#1B5B50]">1.</span>
                <span>
                  Tap the <strong>Share</strong> icon{" "}
                  <span className="inline-flex items-center justify-center w-4 h-4 align-middle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </span>{" "}
                  at the bottom of Safari.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[#1B5B50]">2.</span>
                <span>
                  Scroll and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[#1B5B50]">3.</span>
                <span>
                  Tap <strong>Add</strong> in the top right.
                </span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
