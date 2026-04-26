// src/lib/photo-editor/export/pdf.ts
//
// PDF encoder (Session 8). Wraps jspdf — already a project dependency
// (used by the AI-tool engine elsewhere in Ebrora). Single-page PDFs
// only — locked decision §6.4. Page size = canvas dimensions plus a
// 24pt margin all around.
//
// Image is embedded as JPEG at 0.92 quality. JPEG vs PNG embed in PDF:
// JPEG is dramatically smaller for photo content and visually
// indistinguishable at 0.92, and PNG-in-PDF can hit pathological size
// blowups on large canvases. The cost is a tiny quality loss on
// flat-coloured graphics, which the user can always re-export as PNG
// or JPEG separately if they need lossless.
//
// Unit handling: jspdf accepts unit: "px" which treats 1 px = 1 pt.
// For a photo editor that's the most intuitive mapping — a 1080×1080
// canvas becomes a 1080×1080-pt PDF (15"×15" at 72 dpi).

import jsPDF from "jspdf";
import { compositeOntoWhite } from "./jpeg";

/** Margin around the image inside the PDF page, in points. */
export const PDF_PAGE_MARGIN_PT = 24;

/** Encode a canvas as a single-page PDF Blob. Page size is canvas
 *  dimensions plus a 24pt margin on all sides; the image is centred
 *  within. The source canvas's alpha channel is flattened onto white
 *  before embedding. */
export async function canvasToPdfBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  const opaque = compositeOntoWhite(canvas);
  const w = opaque.width;
  const h = opaque.height;
  const margin = PDF_PAGE_MARGIN_PT;

  const orientation: "p" | "l" = w >= h ? "l" : "p";
  const doc = new jsPDF({
    orientation,
    unit: "px",
    format: [w + margin * 2, h + margin * 2],
    hotfixes: ["px_scaling"],
    compress: true,
  });

  const imageData = opaque.toDataURL("image/jpeg", 0.92);
  // (image, format, x, y, w, h). x/y use the page's top-left as origin.
  doc.addImage(imageData, "JPEG", margin, margin, w, h);

  const blob = doc.output("blob");
  return blob;
}
