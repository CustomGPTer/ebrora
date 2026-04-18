// =============================================================================
// PDF export — one PDF per document, with either one visual per page or
// continuous layout (visuals flowed vertically, wrapping onto new pages).
//
// Visuals are rasterised via html2canvas (at 2× for print quality) and
// placed into jspdf. A4 and A3 page sizes, portrait and landscape.
//
// The title band and logo are rendered alongside each visual's rasterised
// image, not baked into the image itself — this gives sharper vector text
// for the title and a crisp logo, at the cost of jspdf-level layout work.
// =============================================================================

import type { VisualInstance } from '@/lib/visualise/types';
import {
  applyCanvasOverridesToSvg,
  buildExportStageForRaster,
  downloadBlob,
  measureNaturalBBoxes,
  slugifyFilename,
  type LogoInfo,
} from './exportHelpers';

export type PdfPageSize = 'a4-portrait' | 'a4-landscape' | 'a3-portrait' | 'a3-landscape';
export type PdfLayout = 'per-page' | 'continuous';

export interface PdfExportOptions {
  pageSize: PdfPageSize;
  layout: PdfLayout;
  filenamePrefix: string;
  logo: LogoInfo | null;
}

interface StageVisual {
  visual: VisualInstance;
  svg: SVGSVGElement;
}

// Page sizes in mm, for jspdf's unit: 'mm'.
const PAGE_SIZES: Record<PdfPageSize, { w: number; h: number; orientation: 'p' | 'l'; format: 'a4' | 'a3' }> = {
  'a4-portrait':  { w: 210, h: 297, orientation: 'p', format: 'a4' },
  'a4-landscape': { w: 297, h: 210, orientation: 'l', format: 'a4' },
  'a3-portrait':  { w: 297, h: 420, orientation: 'p', format: 'a3' },
  'a3-landscape': { w: 420, h: 297, orientation: 'l', format: 'a3' },
};

export async function exportPdf(
  stageVisuals: StageVisual[],
  options: PdfExportOptions,
): Promise<void> {
  if (stageVisuals.length === 0) return;

  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const page = PAGE_SIZES[options.pageSize];
  const pdf = new jsPDF({
    orientation: page.orientation,
    unit: 'mm',
    format: page.format,
    compress: true,
  });

  // Offscreen holder to stage rasterised visuals.
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-100000px';
  holder.style.top = '0';
  holder.style.pointerEvents = 'none';
  holder.style.opacity = '0';
  holder.setAttribute('aria-hidden', 'true');
  document.body.appendChild(holder);

  // Rasterise each visual once. The same image gets placed into pages by
  // either the per-page or continuous path below.
  const rasterised: Array<{ visual: VisualInstance; dataUrl: string; aspect: number }> = [];

  try {
    for (const sv of stageVisuals) {
      const nat = measureNaturalBBoxes(sv.svg);
      const clone = sv.svg.cloneNode(true) as SVGSVGElement;
      applyCanvasOverridesToSvg(clone, sv.visual.canvas, nat);

      const stage = buildExportStageForRaster(clone, sv.visual, {
        logo: options.logo,
        background: '#ffffff',
      });
      holder.appendChild(stage);

      const canvas = await html2canvas(stage, {
        backgroundColor: '#ffffff',
        scale: 2, // print-quality constant; user-facing knob is PNG resolution, not PDF
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const aspect = canvas.width > 0 ? canvas.height / canvas.width : 0.5;
      rasterised.push({ visual: sv.visual, dataUrl, aspect });

      // Free the stage — we only need the dataUrl from here on.
      holder.removeChild(stage);
    }
  } finally {
    holder.parentElement?.removeChild(holder);
  }

  if (rasterised.length === 0) return;

  const margin = 12; // mm
  const usableW = page.w - margin * 2;
  const usableH = page.h - margin * 2;

  if (options.layout === 'per-page') {
    rasterised.forEach((r, i) => {
      if (i > 0) pdf.addPage([page.w, page.h], page.orientation);
      placeImage(pdf, r.dataUrl, r.aspect, margin, margin, usableW, usableH);
    });
  } else {
    // Continuous: stack visuals top-to-bottom with a small gap. When the
    // next visual wouldn't fit on the current page, start a new page.
    let cursorY = margin;
    const gap = 8;
    const maxBlockH = usableH;
    rasterised.forEach((r, i) => {
      // Each visual scales to full usable width or half-page height, whichever
      // is smaller — avoids single visuals taking a whole page on continuous.
      const targetW = usableW;
      const targetH = targetW * r.aspect;
      const fittedH = Math.min(targetH, maxBlockH);
      const fittedW = fittedH / Math.max(r.aspect, 0.0001);

      if (cursorY + fittedH > page.h - margin) {
        pdf.addPage([page.w, page.h], page.orientation);
        cursorY = margin;
      }
      pdf.addImage(r.dataUrl, 'JPEG', margin, cursorY, fittedW, fittedH, undefined, 'FAST');
      cursorY += fittedH + gap;
      // Page break for the next visual if we've filled the page exactly.
      if (i < rasterised.length - 1 && cursorY > page.h - margin - gap) {
        pdf.addPage([page.w, page.h], page.orientation);
        cursorY = margin;
      }
    });
  }

  const prefix = slugifyFilename(options.filenamePrefix);
  const blob = pdf.output('blob');
  downloadBlob(blob, `${prefix}.pdf`);
}

/**
 * Centre-fit a rasterised visual into a box, preserving aspect ratio.
 * Fills to usableW first; if the resulting height exceeds usableH, it
 * re-fits to height.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function placeImage(pdf: any, dataUrl: string, aspect: number, x: number, y: number, boxW: number, boxH: number) {
  let w = boxW;
  let h = w * aspect;
  if (h > boxH) {
    h = boxH;
    w = h / Math.max(aspect, 0.0001);
  }
  const ox = x + (boxW - w) / 2;
  const oy = y + (boxH - h) / 2;
  pdf.addImage(dataUrl, 'JPEG', ox, oy, w, h, undefined, 'FAST');
}
