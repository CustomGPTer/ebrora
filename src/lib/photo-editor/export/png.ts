// src/lib/photo-editor/export/png.ts
//
// PNG encoder (Session 8). Wraps HTMLCanvasElement.toBlob with a
// Promise-shaped API and a defensive synchronous fallback via
// toDataURL → Blob. Both paths preserve the canvas's alpha channel —
// transparent backgrounds export correctly.

/** Encode a canvas as a PNG Blob. Always resolves; rejects only if the
 *  canvas is unreadable (taint, zero-size, etc.). */
export async function canvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  // Modern path — toBlob is supported everywhere we care about (iOS
  // Safari 11+, Android Chrome, Edge, Firefox).
  if (typeof canvas.toBlob === "function") {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob returned null."));
        },
        "image/png",
      );
    });
  }

  // Synchronous fallback for ancient browsers — we shouldn't hit this
  // in practice but it lets the type signature stay simple.
  try {
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrlToBlob(dataUrl);
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Failed to encode canvas as PNG.");
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",", 2);
  if (!header || !data) {
    throw new Error("Malformed data URL.");
  }
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1] ?? "image/png";
  const isBase64 = header.includes(";base64");
  const decoded = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
