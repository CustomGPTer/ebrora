// src/lib/photo-editor/saved-projects/thumbnail.ts
//
// Best-effort thumbnail generation for SavedProject (Session 7).
//
// Renders the editor's Konva stage to a JPEG data URL ≤ 256 × 256.
// The intended caller is the Save flow — the EditorShell holds a ref
// to the Konva stage and passes it into generateThumbnail() right
// before persisting via saveProject().
//
// Failure modes:
//   • Stage not yet mounted → fall back to placeholder.
//   • Cross-origin photo background tainted the canvas → toDataURL
//     throws SecurityError. Fall back to placeholder. Same-origin
//     photos (the typical case — photos uploaded by the user are
//     blob: URLs which count as same-origin) are unaffected.
//   • Sticker SVGs from cdn.jsdelivr.net are CORS-friendly per the
//     Twemoji jsdelivr distribution, so they don't taint the canvas.
//
// A failed thumbnail MUST NOT block the save (locked decision in
// HANDOVER §8.4). The caller catches and proceeds with the placeholder.

import type Konva from "konva";
import { SAVED_PROJECT_THUMBNAIL_DIMENSION } from "../types";

const JPEG_QUALITY = 0.8;

/** Generate a thumbnail data URL for the current canvas state. Always
 *  resolves — never rejects — so callers can `await` without catching.
 *  If the Konva stage can't be turned into a thumbnail (taint,
 *  unmounted stage, etc.) the placeholder data URL is returned. */
export async function generateThumbnail(
  stage: Konva.Stage | null,
): Promise<string> {
  if (!stage) return PLACEHOLDER_DATA_URL;
  try {
    // Compute the aspect-preserving scale factor that fits the stage
    // into SAVED_PROJECT_THUMBNAIL_DIMENSION on the longer edge.
    const stageW = stage.width();
    const stageH = stage.height();
    if (stageW <= 0 || stageH <= 0) return PLACEHOLDER_DATA_URL;
    const longest = Math.max(stageW, stageH);
    const pixelRatio = SAVED_PROJECT_THUMBNAIL_DIMENSION / longest;
    const dataUrl = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: JPEG_QUALITY,
      pixelRatio,
    });
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return PLACEHOLDER_DATA_URL;
    }
    return dataUrl;
  } catch {
    // Most common failure: SecurityError from a tainted canvas. The
    // user's photo is fine to view but cross-origin export blocked.
    return PLACEHOLDER_DATA_URL;
  }
}

// ─── Placeholder ────────────────────────────────────────────────
//
// 256×256 SVG placeholder, encoded inline as a data URL. Kept as an
// SVG (not JPEG) so it's tiny and always loads even when JPEG decoding
// fails for whatever reason. Mirrors the editor's accent colour
// (#1B5B50 — locked rule §4 #10) so the placeholder reads as part of
// the editor surface, not an error icon.

const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' +
  '<rect width="256" height="256" fill="#F1F5F4"/>' +
  '<rect x="32" y="32" width="192" height="192" rx="16" fill="#1B5B50" opacity="0.08"/>' +
  '<path d="M88 168l32-40 24 28 16-20 32 40H72z" fill="#1B5B50" opacity="0.45"/>' +
  '<circle cx="172" cy="100" r="14" fill="#1B5B50" opacity="0.45"/>' +
  "</svg>";

const PLACEHOLDER_DATA_URL =
  "data:image/svg+xml;utf8," + encodeURIComponent(PLACEHOLDER_SVG);

/** Exported for use by RecentProjects / ProjectsModal when a record
 *  somehow has an empty thumbnail string. */
export const FALLBACK_THUMBNAIL_DATA_URL = PLACEHOLDER_DATA_URL;
