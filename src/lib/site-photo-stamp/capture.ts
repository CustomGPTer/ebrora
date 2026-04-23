// src/lib/site-photo-stamp/capture.ts
//
// Orchestrates the full capture pipeline for a single photo:
//
//   1. Read EXIF (for original timestamp, GPS coords if embedded, orientation).
//   2. Downscale to 2560px long edge, rotated to upright.
//   3. Resolve geolocation — use EXIF coords if present, otherwise ask the
//      device for live coords (run in parallel with steps 1–2).
//   4. Reverse-geocode the winning coords to an address (best effort).
//   5. Generate a short unique ID.
//
// Everything stays on-device. The result is a blob + populated StampMeta
// ready for the Batch 3 stamp compositor.

import type { StampMeta } from "./types";
import { readExif } from "./exif";
import { downscalePhoto, UnsupportedImageError } from "./downscaler";
import { getCurrentLocation, reverseGeocode } from "./geolocation";
import { generateUniqueId } from "./unique-id";

export interface CapturedPhoto {
  /** Downscaled, upright JPEG ready to be stamped. */
  blob: Blob;
  /** Object URL for preview. Caller must `URL.revokeObjectURL` when done. */
  previewUrl: string;
  /** Downscaled dimensions in CSS pixels. */
  width: number;
  height: number;
  /** Partial stamp metadata — template-specific fields are added later. */
  meta: Omit<StampMeta, "templateTitle">;
  /** Set when reverse geocode failed or was skipped. */
  addressUnavailable: boolean;
  /** Set when geolocation + EXIF both failed / denied. */
  locationUnavailable: boolean;
}

export interface CaptureOptions {
  /** Progress callback for UI. */
  onProgress?: (stage: CaptureStage) => void;
  /**
   * Pre-resolved coordinates used ONLY when the photo has no EXIF GPS.
   * Set this in bulk mode so we call the geolocation prompt once per batch
   * rather than once per photo.
   */
  fallbackCoords?: { lat: number; lon: number };
  /** Skip the live geolocation prompt entirely. Useful when fallbackCoords
   *  is provided or when the batch has already asked and been denied. */
  skipLiveLocation?: boolean;
}

export type CaptureStage =
  | "reading"
  | "downscaling"
  | "locating"
  | "geocoding"
  | "finalising";

export async function capturePhoto(
  file: File,
  opts: CaptureOptions = {}
): Promise<CapturedPhoto> {
  const notify = (s: CaptureStage) => opts.onProgress?.(s);

  // ── 1. EXIF first (cheap, informs downscale orientation). ─────
  notify("reading");
  const exif = await readExif(file);

  // ── 2. Downscale + 3. geolocation in parallel. ────────────────
  notify("downscaling");
  const downscalePromise = downscalePhoto(file, {
    orientation: exif.orientation,
  }).catch((err) => {
    // Bubble Unsupported errors; swallow other decode failures into a
    // generic error upstream.
    if (err instanceof UnsupportedImageError) throw err;
    throw new Error(
      "Couldn't read that image. Try a JPEG from your camera roll, or retake with the camera button."
    );
  });

  // If EXIF already has GPS, we don't need live geolocation — skip the
  // permission prompt entirely. Otherwise, use the batch-resolved fallback
  // coords if provided (bulk mode), or prompt for live location.
  const haveExifGps = exif.latitude != null && exif.longitude != null;

  let geoPromise: Promise<{ lat: number; lon: number } | null>;
  if (haveExifGps) {
    geoPromise = Promise.resolve({ lat: exif.latitude!, lon: exif.longitude! });
  } else if (opts.fallbackCoords) {
    geoPromise = Promise.resolve(opts.fallbackCoords);
  } else if (opts.skipLiveLocation) {
    geoPromise = Promise.resolve(null);
  } else {
    notify("locating");
    geoPromise = getCurrentLocation().then((c) => (c ? { lat: c.lat, lon: c.lon } : null));
  }

  const [down, coords] = await Promise.all([downscalePromise, geoPromise]);

  // ── 4. Reverse geocode (non-blocking-ish, short timeout). ─────
  let address: string | null = null;
  let addressUnavailable = true;
  if (coords) {
    notify("geocoding");
    address = await reverseGeocode(coords.lat, coords.lon);
    addressUnavailable = address == null;
  }

  // ── 5. Finalise ──────────────────────────────────────────────
  notify("finalising");
  const previewUrl = URL.createObjectURL(down.blob);

  const timestampSource: "exif" | "device" = exif.timestamp ? "exif" : "device";
  const timestamp = exif.timestamp ?? new Date().toISOString();

  const meta: Omit<StampMeta, "templateTitle"> = {
    timestamp,
    timestampSource,
    lat: coords?.lat,
    lon: coords?.lon,
    address: address ?? undefined,
    uniqueId: generateUniqueId(),
  };

  return {
    blob: down.blob,
    previewUrl,
    width: down.width,
    height: down.height,
    meta,
    addressUnavailable,
    locationUnavailable: coords == null,
  };
}

// Re-export for callers that want to detect specifically the
// unsupported-format branch.
export { UnsupportedImageError };
