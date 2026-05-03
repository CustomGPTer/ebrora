// src/components/photo-editor/home/InstallAppCard.tsx
//
// Inline "Add Photo Editor to home screen" card on the home view —
// May 2026, replaces the prior sticky-bottom PwaInstallBanner.
//
// Visibility:
//   • Hidden when running standalone (already installed) — there's
//     nothing left for the user to do.
//   • Otherwise always visible. No dismiss-for-this-session memory
//     per Jon's spec.
//
// Tap behaviour:
//   1. If a `beforeinstallprompt` is currently captured (canInstall
//      === true), fire it via install() — that's the system one-tap
//      flow on Chrome / Edge / Samsung Internet on Android, and on
//      Chromium-based desktop browsers.
//   2. Otherwise open the InstallInstructionsModal which shows
//      OS-tailored Add-to-Home-Screen steps.
//
// Why both paths matter:
//   • beforeinstallprompt isn't supported on iOS Safari, iOS Chrome,
//     or Firefox at all — modal is the only path there.
//   • Even on supporting browsers, the event isn't refired after a
//     dismissal (~90 day Chrome throttle), after a previous install,
//     or before the engagement heuristic clears. The modal is the
//     fallback when canInstall is false on a browser that *can*
//     install — the user gets manual steps that work today rather
//     than waiting for the browser to refire the event.
//
// Visual language: matches the GalleryCard pattern (rounded card,
// surface bg, subtle border, vertical icon + text + caption stack)
// so it slots naturally between Style presets and Projects on the
// home view.

"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { InstallInstructionsModal } from "./InstallInstructionsModal";

interface InstallAppCardProps {
  /** True when the browser captured a beforeinstallprompt and the
   *  prompt is ready to fire. */
  canInstall: boolean;
  /** True when the page is running as a standalone PWA — card hides. */
  isStandalone: boolean;
  /** Triggers the captured browser prompt. Resolves true if the user
   *  accepted, false if they dismissed or the prompt isn't available. */
  onInstall: () => Promise<boolean>;
}

export function InstallAppCard({
  canInstall,
  isStandalone,
  onInstall,
}: InstallAppCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isStandalone) return null;

  async function handleClick() {
    if (canInstall) {
      // Try the system one-tap flow. install() returns false if the
      // prompt wasn't actually available (e.g. it was consumed in a
      // race). In that case fall through to the manual modal so the
      // user always sees something actionable.
      const accepted = await onInstall();
      if (accepted) return;
      // If user dismissed the system prompt, don't immediately spam
      // them with the manual modal — they declined consciously.
      // Only open the modal when the prompt itself wasn't available.
      // We can't tell those two cases apart from the boolean alone,
      // but install() is documented to return false in both. The
      // safer UX is to NOT auto-escalate after a system prompt
      // dismissal — they can tap the card again to see manual steps.
      return;
    }
    setModalOpen(true);
  }

  return (
    <>
      <section aria-label="Install Photo Editor as an app">
        <button
          type="button"
          onClick={() => void handleClick()}
          className="w-full rounded-2xl flex items-center gap-3 px-4 py-3 text-left transition-colors active:opacity-90"
          style={{
            background: "var(--pe-surface)",
            border: "1px solid var(--pe-border-strong)",
            color: "var(--pe-text)",
          }}
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center rounded-xl"
            style={{
              width: 40,
              height: 40,
              flex: "0 0 auto",
              background: "var(--pe-accent)",
              color: "var(--pe-accent-fg)",
            }}
          >
            <Download className="w-5 h-5" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col min-w-0">
            <span
              className="text-[14px] font-semibold leading-tight"
              style={{ color: "var(--pe-text)" }}
            >
              Add Photo Editor to home screen
            </span>
            <span
              className="text-[12px] leading-snug mt-0.5"
              style={{ color: "var(--pe-text-muted)" }}
            >
              Open like an app — no app store, no account.
            </span>
          </span>
        </button>
      </section>

      <InstallInstructionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
