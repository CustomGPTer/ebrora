// src/lib/photo-editor/pwa/platform.ts
//
// Platform detection + Add-to-Home-Screen instructions for the
// install-app card on /photo-editor/. May 2026 — paired with
// InstallAppCard + InstallInstructionsModal.
//
// Only Chromium-family browsers (Chrome / Edge / Samsung Internet /
// Brave) on Android + Chromium-family on desktop fire the
// `beforeinstallprompt` event that drives the one-tap install flow.
// Every other browser × OS combo needs manual instructions — this
// module supplies them, tailored to the user's UA so they read like
// "Tap Share → Add to Home Screen" not a generic catch-all.
//
// Detection deliberately leans conservative — only a positive UA
// signal returns a specific platform. Anything ambiguous falls
// through to "unknown" which carries the most-common iOS-style
// Share-menu instructions (the most common manual path users hit
// in practice).

export type InstallPlatform =
  | "chrome-android"
  | "samsung-internet"
  | "firefox-android"
  | "edge-android"
  | "ios-safari"
  | "ios-chrome"
  | "ios-firefox"
  | "ios-edge"
  | "macos-safari"
  | "macos-chrome"
  | "macos-edge"
  | "macos-firefox"
  | "windows-edge"
  | "windows-chrome"
  | "windows-firefox"
  | "unknown";

export interface InstallInstructions {
  /** Short heading for the modal — already includes "Photo Editor" so
   *  it doesn't double up with the modal's main title. */
  heading: string;
  /** Numbered steps. Plain strings; the UI is responsible for
   *  rendering the iconography. UI symbols are referenced by name in
   *  the copy where it helps — the modal renders them inline as
   *  emoji-style glyphs that read on every OS. */
  steps: string[];
  /** Optional callout shown beneath the steps, e.g. for Firefox iOS
   *  where the user has to copy the URL into Safari first. */
  note?: string;
}

/** Best-effort browser × OS detection from `navigator.userAgent` and
 *  related signals. Run client-side only — server-side this is just
 *  going to return "unknown" because UA isn't available. */
export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";

  // ── iOS / iPadOS ───────────────────────────────────────────────
  // iPadOS 13+ identifies as "MacIntel" in navigator.platform but has
  // touch points, so combine the two signals. CriOS / FxiOS / EdgiOS
  // are the in-WebView Chrome / Firefox / Edge on iOS — they all use
  // WKWebView so the install path is identical to Safari, but the
  // Share menu sits in different places depending on the wrapper app.
  const isIPadOS =
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIPadOS;
  if (isIOS) {
    if (/CriOS/i.test(ua)) return "ios-chrome";
    if (/FxiOS/i.test(ua)) return "ios-firefox";
    if (/EdgiOS/i.test(ua)) return "ios-edge";
    // Default-bucket iOS browsers (including Safari) into ios-safari —
    // Safari is the canonical installer on iOS and the Share-menu UI
    // is the same across Safari and most Apple apps that share to
    // Safari (Mail, Messages).
    return "ios-safari";
  }

  // ── Android ────────────────────────────────────────────────────
  const isAndroid = /Android/i.test(ua);
  if (isAndroid) {
    // Order matters — Samsung Internet UA includes "SamsungBrowser"
    // *and* "Chrome" so check Samsung first.
    if (/SamsungBrowser/i.test(ua)) return "samsung-internet";
    if (/EdgA\//i.test(ua)) return "edge-android";
    if (/Firefox\//i.test(ua)) return "firefox-android";
    // Chrome / Brave / Vivaldi / etc. all support the same install
    // prompt path — bucket them as chrome-android.
    return "chrome-android";
  }

  // ── macOS ──────────────────────────────────────────────────────
  const isMac = /Macintosh|MacIntel|Mac OS X/i.test(ua) && !isIPadOS;
  if (isMac) {
    if (/Edg\//i.test(ua)) return "macos-edge";
    if (/Chrome\//i.test(ua)) return "macos-chrome";
    if (/Firefox\//i.test(ua)) return "macos-firefox";
    return "macos-safari";
  }

  // ── Windows ────────────────────────────────────────────────────
  if (/Windows/i.test(ua)) {
    if (/Edg\//i.test(ua)) return "windows-edge";
    if (/Chrome\//i.test(ua)) return "windows-chrome";
    if (/Firefox\//i.test(ua)) return "windows-firefox";
  }

  return "unknown";
}

/** OS-tailored step-by-step instructions for adding /photo-editor/ to
 *  the home screen. Phrasing is consistent across platforms — the
 *  variable bits are the menu names ("Share" / "tap ⋮ / Install" /
 *  "tap ⋮ / Add to Home screen") and any platform-specific gotchas. */
export function getInstallInstructions(
  platform: InstallPlatform,
): InstallInstructions {
  switch (platform) {
    case "ios-safari":
      return {
        heading: "Add Photo Editor to your iPhone or iPad",
        steps: [
          "Tap the Share button at the bottom of Safari (square with an arrow pointing up).",
          "Scroll down and tap “Add to Home Screen”.",
          "Tap “Add” in the top-right corner.",
        ],
      };

    case "ios-chrome":
      return {
        heading: "Add Photo Editor on iOS Chrome",
        steps: [
          "Tap the Share icon (square with an arrow pointing up) in the address bar.",
          "Tap “Add to Home Screen”.",
          "Tap “Add” to confirm.",
        ],
        note:
          "iOS only allows installation through Safari-based menus — Chrome on iOS uses the same one under the hood.",
      };

    case "ios-firefox":
      return {
        heading: "Add Photo Editor on iOS Firefox",
        steps: [
          "Tap the menu (three lines) in the address bar.",
          "Tap “Share”.",
          "Tap “Add to Home Screen”, then “Add”.",
        ],
        note:
          "If you don't see “Add to Home Screen”, open this page in Safari instead — iOS only allows installation through Safari-backed share menus.",
      };

    case "ios-edge":
      return {
        heading: "Add Photo Editor on iOS Edge",
        steps: [
          "Tap the menu (three dots) at the bottom of the screen.",
          "Tap “Share”, then “Add to Home Screen”.",
          "Tap “Add” to confirm.",
        ],
      };

    case "chrome-android":
      return {
        heading: "Add Photo Editor on Android Chrome",
        steps: [
          "Tap the menu (three dots) in the top-right.",
          "Tap “Add to Home screen” or “Install app”.",
          "Tap “Install” to confirm.",
        ],
        note:
          "If you don't see the option, the browser may have shown the install prompt recently — try again in a few days, or use the menu manually.",
      };

    case "samsung-internet":
      return {
        heading: "Add Photo Editor on Samsung Internet",
        steps: [
          "Tap the menu (three lines) at the bottom of the screen.",
          "Tap “Add page to”.",
          "Tap “Home screen”, then “Add”.",
        ],
      };

    case "edge-android":
      return {
        heading: "Add Photo Editor on Android Edge",
        steps: [
          "Tap the menu (three dots) at the bottom of the screen.",
          "Tap “Add to phone”.",
          "Tap “Install” to confirm.",
        ],
      };

    case "firefox-android":
      return {
        heading: "Add Photo Editor on Android Firefox",
        steps: [
          "Tap the menu (three dots) in the address bar.",
          "Tap “Install” or “Add to Home screen”.",
          "Tap “Add” to confirm.",
        ],
      };

    case "macos-safari":
      return {
        heading: "Add Photo Editor on Mac Safari",
        steps: [
          "Open the File menu in the menu bar.",
          "Click “Add to Dock…”.",
          "Click “Add” to confirm.",
        ],
        note: "Requires macOS Sonoma (14) or later.",
      };

    case "macos-chrome":
    case "macos-edge":
    case "windows-chrome":
    case "windows-edge":
      return {
        heading: "Add Photo Editor on your computer",
        steps: [
          "Click the install icon at the right of the address bar (it looks like a small monitor with a downward arrow).",
          "Click “Install” to confirm.",
        ],
        note:
          "If the install icon isn't visible, open the browser menu (three dots in the top-right) and look for “Install Photo Editor”.",
      };

    case "macos-firefox":
    case "windows-firefox":
      return {
        heading: "Add Photo Editor on Firefox",
        steps: [
          "Bookmark this page (Ctrl+D on Windows, ⌘+D on Mac).",
          "Drag the bookmark to your desktop or taskbar for one-click access.",
        ],
        note:
          "Firefox doesn't offer a one-click install on desktop. For the full app experience, open this page in Chrome, Edge, or another Chromium-based browser.",
      };

    default:
      return {
        heading: "Add Photo Editor to your home screen",
        steps: [
          "Open your browser's menu (usually three dots or three lines).",
          "Look for “Add to Home screen”, “Install app”, or “Add to Dock”.",
          "Confirm to add Photo Editor.",
        ],
      };
  }
}
