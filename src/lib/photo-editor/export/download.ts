// src/lib/photo-editor/export/download.ts
//
// Trigger a Blob download (the "Save" path — distinct from explicit
// "Share" UI which lives in SaveAndSharePage.handleShare and calls
// navigator.share directly).
//
// The historical issue: an earlier version of this file defaulted to
// Web Share whenever `navigator.canShare({ files })` returned true,
// reasoning that iOS Safari needs Web Share because <a download>
// doesn't reliably save the file there. That's correct for iOS — but
// modern Android Chrome ALSO returns true for canShare({ files }),
// and on Android the user tapping "Save" expects a silent download
// to /Downloads/, not a system share sheet listing every messaging
// app on their device. Same goes for desktop Chrome on Android-style
// share-API-enabled builds.
//
// Corrected routing:
//
//   • iOS Safari (and all iOS browsers, since they're all WebKit):
//       prefer navigator.share({ files }). Anchor download is
//       unreliable here.
//
//   • Everything else (Android, desktop, etc.):
//       use the anchor + URL.createObjectURL flow. The blob URL is
//       revoked after a short delay so the browser has time to start
//       the download.
//
// The anchor path is always available as a fallback when Web Share is
// preferred but fails (other than user-cancel, which we treat as a
// final state — re-triggering a download the user just declined would
// be hostile).

const REVOKE_DELAY_MS = 60_000;

export interface DownloadOptions {
  blob: Blob;
  /** Filename including extension. */
  filename: string;
  /** When provided, used as the share-sheet title on iOS. */
  shareTitle?: string;
}

/** Trigger a download of `blob` as `filename`. Returns "share" if the
 *  Web Share API was used (iOS), "download" if the anchor click path
 *  was used, or "fallback" if neither succeeded (the caller may want
 *  to surface a "download blocked" message). */
export async function downloadBlob(
  options: DownloadOptions,
): Promise<"share" | "download" | "fallback"> {
  const { blob, filename, shareTitle } = options;

  // iOS-only: prefer Web Share. Anchor downloads on iOS Safari
  // typically navigate to the blob URL inline rather than saving it,
  // so the share sheet is the only reliable user-facing save path.
  if (isIOS() && canShareFiles(blob, filename)) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      await (navigator as Navigator & {
        share: (data: ShareData) => Promise<void>;
      }).share({
        files: [file],
        title: shareTitle ?? filename,
      } as ShareData);
      return "share";
    } catch (err) {
      if (isAbortError(err)) {
        // User explicitly cancelled the share sheet — treat as final
        // state. Falling through to the anchor path here would
        // re-trigger a download the user just declined.
        return "share";
      }
      // Any other failure falls through to the anchor path so the
      // export is never silently lost.
    }
  }

  // Anchor download path — Android, desktop, and iOS fallback.
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    return "download";
  } catch {
    return "fallback";
  }
}

/** True when running in any iOS browser (all of which are WebKit and
 *  share the same <a download> limitations). Catches iPadOS 13+ which
 *  reports as "MacIntel" but has touch points. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ desktop-class UA workaround.
  if (
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

function canShareFiles(blob: Blob, filename: string): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (!nav.canShare || !nav.share) return false;
  try {
    const file = new File([blob], filename, { type: blob.type });
    return nav.canShare({ files: [file] } as ShareData);
  } catch {
    return false;
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string };
  return e.name === "AbortError";
}
