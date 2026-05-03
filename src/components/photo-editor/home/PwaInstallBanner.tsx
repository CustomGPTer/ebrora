// src/components/photo-editor/home/PwaInstallBanner.tsx
//
// Sticky-bottom CTA on the photo-editor home view inviting the user to
// install the editor as a PWA. Mobile-fixes batch 2 (May 2026) — issue 5.
//
// Visibility rules:
//   • The browser fired `beforeinstallprompt` (canInstall === true) AND
//   • The page is NOT already running as an installed PWA (no display-
//     mode: standalone / navigator.standalone) AND
//   • The user is on a device where the prompt() one-tap install flow
//     actually works (any browser that fires `beforeinstallprompt` does;
//     Chrome / Edge / Samsung Internet / desktop Chromium).
//
// Why no localStorage dismissal memory: per Q1 of the second-round
// clarifications, Jon wants the banner to appear on every page load
// where the conditions above hold. The browser's own `beforeinstallprompt`
// throttling already suppresses repeated prompts after a dismissal
// (~90 day window in Chrome), so there's no risk of nagging — when the
// browser stops firing the event the banner stops appearing of its own
// accord.
//
// A single tap calls install() which fires the captured browser prompt.
// On accept, `appinstalled` fires → deferredPrompt is nulled →
// canInstall flips false → banner unmounts naturally.
//
// Layout: sticky at the bottom of the EmptyState scroll container with
// safe-area-inset padding for devices with a home indicator. Accent
// colour matches the editor's brand green so it reads as a primary CTA
// without being shouty. Pointer-events live on the banner itself; the
// scroll container around it is unaffected.

"use client";

import { Download } from "lucide-react";

interface PwaInstallBannerProps {
  /** True when the browser captured a beforeinstallprompt and the
   *  prompt is ready to fire. */
  canInstall: boolean;
  /** True when the page is running as a standalone PWA — banner hides. */
  isStandalone: boolean;
  /** Triggers the captured browser prompt. */
  onInstall: () => void;
}

export function PwaInstallBanner({
  canInstall,
  isStandalone,
  onInstall,
}: PwaInstallBannerProps) {
  if (!canInstall || isStandalone) return null;

  return (
    <div
      role="region"
      aria-label="Install Photo Editor"
      className="sticky bottom-0 left-0 right-0 z-30"
      style={{
        // Safe-area padding so the banner clears the iOS home indicator.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-3 pt-2"
        style={{
          // Subtle gradient fade to soften the boundary between the
          // scrollable content above and the banner — without this the
          // banner looks tacked on. Background is the page bg colour
          // fading to transparent at the top, so content visually flows
          // under the banner.
          background:
            "linear-gradient(to top, var(--pe-bg) 70%, rgba(0,0,0,0) 100%)",
        }}
      >
        <button
          type="button"
          onClick={onInstall}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity active:opacity-80"
          style={{
            background: "var(--pe-accent)",
            color: "var(--pe-accent-fg)",
            boxShadow: "var(--pe-shadow)",
          }}
        >
          <Download className="w-4 h-4" strokeWidth={2.25} aria-hidden />
          <span>Install Photo Editor app</span>
        </button>
      </div>
    </div>
  );
}
