// src/lib/photo-editor/export/jpeg.ts
//
// JPEG encoder (Session 8). Wraps HTMLCanvasElement.toBlob with a
// Promise-shaped API. JPEG has no alpha channel; if the source canvas
// is partly transparent, the canvas's compositing default (black)
// shows through. We composite onto white before encoding so users get
// a sensible default.
//
// Quality is a 0-1 value passed straight to toBlob. The export panel
// exposes a slider; the default is 0.92 which is the canvas spec
// default and looks visually identical to lossless for most photos at
// roughly 1/4 the file size.

/** Encode a canvas as a JPEG Blob at the given quality (0-1). The
 *  source canvas may have transparent pixels; this function composites
 *  onto white first since JPEG is opaque. */
export async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  const opaque = compositeOntoWhite(canvas);

  if (typeof opaque.toBlob === "function") {
    return new Promise<Blob>((resolve, reject) => {
      opaque.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob returned null."));
        },
        "image/jpeg",
        clamp01(quality),
      );
    });
  }

  // Synchronous fallback.
  try {
    const dataUrl = opaque.toDataURL("image/jpeg", clamp01(quality));
    return dataUrlToBlob(dataUrl);
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Failed to encode canvas as JPEG.");
  }
}

/** Render `canvas` onto a fresh canvas pre-filled with white. Returns
 *  a NEW canvas — does not mutate the input. Used to guarantee
 *  transparent backgrounds land on white when the user picks JPEG. */
export function compositeOntoWhite(
  canvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.92;
  return Math.max(0, Math.min(1, n));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",", 2);
  if (!header || !data) {
    throw new Error("Malformed data URL.");
  }
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const isBase64 = header.includes(";base64");
  const decoded = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export const DEFAULT_JPEG_QUALITY = 0.92;
