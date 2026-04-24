// src/lib/site-photo-stamp/downscaler.ts
//
// Canvas-based image downscaler.
//
// • Target: 2048px long edge, JPEG quality 0.92 (configurable).
// • Applies EXIF orientation so portrait photos from iOS don't come out
//   sideways.
// • Uses createImageBitmap where available (much faster on large photos).
// • Rejects HEIC/HEIF with a recognisable error — these cannot be decoded in
//   canvas by any current browser, and photos shot by iOS through the
//   <input capture="environment"> API are already JPEG.
// • Releases the decoded bitmap and collapses the canvas backing buffer as
//   soon as the JPEG has been encoded, to keep peak memory down on
//   low-RAM Android WebViews.

export interface DownscaleResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface DownscaleOptions {
  /** Long-edge pixel target. Default 2048. */
  longEdge?: number;
  /** JPEG quality 0–1. Default 0.92. */
  quality?: number;
  /**
   * EXIF orientation code (1–8). If omitted, image is drawn as-is. Most
   * mobile browsers already auto-rotate; pass this only when you've
   * explicitly read EXIF and want belt-and-braces handling.
   */
  orientation?: number;
}

export class UnsupportedImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedImageError";
  }
}

export async function downscalePhoto(
  file: File | Blob,
  opts: DownscaleOptions = {}
): Promise<DownscaleResult> {
  const mime = (file as File).type || "";
  if (/heic|heif/i.test(mime)) {
    throw new UnsupportedImageError(
      "HEIC/HEIF photos can't be processed in the browser. On iPhone, set Settings → Camera → Formats to 'Most Compatible', or share the photo as JPEG."
    );
  }

  const bitmap = await decodeImage(file);
  const { naturalWidth, naturalHeight } = bitmap;

  const longEdge = opts.longEdge ?? 2048;
  const quality = opts.quality ?? 0.92;
  const orientation = opts.orientation ?? 1;

  // Scale so the longest edge equals `longEdge`, preserving aspect. Don't
  // upscale — preserve originals smaller than the target.
  const srcLong = Math.max(naturalWidth, naturalHeight);
  const scale = srcLong > longEdge ? longEdge / srcLong : 1;

  const scaledW = Math.round(naturalWidth * scale);
  const scaledH = Math.round(naturalHeight * scale);

  // Swap width/height for orientation codes 5–8 (90°/270° rotations).
  const rotated = orientation >= 5 && orientation <= 8;
  const outputWidth = rotated ? scaledH : scaledW;
  const outputHeight = rotated ? scaledW : scaledH;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  try {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    applyOrientationTransform(ctx, orientation, scaledW, scaledH);

    // drawImage accepts both ImageBitmap and HTMLImageElement.
    ctx.drawImage(bitmap.source as CanvasImageSource, 0, 0, scaledW, scaledH);
    // Release the decoded source as soon as it's been painted — no need
    // to hold 30+ MB of pixel data through the encode step.
    bitmap.close?.();

    const blob = await canvasToJpegBlob(canvas, quality);
    return {
      blob,
      width: outputWidth,
      height: outputHeight,
      originalWidth: naturalWidth,
      originalHeight: naturalHeight,
    };
  } finally {
    // Belt-and-braces: idempotent, safe to call again if drawImage threw
    // before we could close it above.
    bitmap.close?.();
    // Zeroing dimensions drops the canvas's backing pixel buffer on
    // every major engine without waiting for GC.
    canvas.width = 0;
    canvas.height = 0;
  }
}

// ─── Decode helpers ─────────────────────────────────────────────

interface DecodedImage {
  source: ImageBitmap | HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  close?: () => void;
}

async function decodeImage(file: File | Blob): Promise<DecodedImage> {
  // Prefer createImageBitmap — faster, off the main thread, and it
  // applies the browser's built-in EXIF orientation when supported.
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        naturalWidth: bitmap.width,
        naturalHeight: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall through to <img> decode — some browsers reject certain formats
      // here but will still load them via an <img> element.
    }
  }
  return decodeViaImageElement(file);
}

function decodeViaImageElement(file: File | Blob): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image — format may be unsupported."));
    };
    img.decoding = "async";
    img.src = url;
  });
}

// ─── Orientation transform ──────────────────────────────────────

function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  w: number,
  h: number
) {
  switch (orientation) {
    case 2: // flip horizontal
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      break;
    case 3: // 180°
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 4: // flip vertical
      ctx.translate(0, h);
      ctx.scale(1, -1);
      break;
    case 5: // transpose
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6: // 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -h);
      break;
    case 7: // transverse
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(w, -h);
      ctx.scale(-1, 1);
      break;
    case 8: // 90° CCW
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-w, 0);
      break;
    default:
      // 1 = upright, do nothing.
      break;
  }
}

// ─── Canvas → Blob ──────────────────────────────────────────────

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas export failed"));
      },
      "image/jpeg",
      quality
    );
  });
}
