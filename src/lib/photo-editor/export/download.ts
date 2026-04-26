// src/lib/photo-editor/export/download.ts
//
// Trigger a Blob download. Two paths:
//
//   • Mobile Safari: <a download> opens the file inline rather than
//     saving — a long-standing iOS quirk. We use Web Share API
//     (`navigator.share({ files })`) when available, which presents
//     the native share sheet so the user can save to Files / Photos /
//     send to another app.
//
//   • Desktop / Android: classic anchor + URL.createObjectURL flow.
//     The blob URL is revoked after a short delay so the browser has
//     time to start the download.
//
// "Web Share is available" is sniffed via `navigator.canShare` because
// `navigator.share` exists in non-mobile contexts but won't accept
// files. canShare with the actual files we want to share is the only
// reliable feature-detect.

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

  // Web Share with files — preferred on iOS Safari.
  if (canShareFiles(blob, filename)) {
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
      // User cancelled the share sheet, or share failed. Fall through
      // to the anchor path so the export is never silently lost.
      if (isAbortError(err)) {
        // User explicitly cancelled — don't fall back, that would
        // re-trigger a download the user just declined.
        return "share";
      }
    }
  }

  // Anchor download path.
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
