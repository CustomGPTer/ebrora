// =============================================================================
// PNG export — rasterises each visual via html2canvas, at 1×/2×/3× the
// native canvas content size (800×400), and downloads a PNG per visual.
//
// Multi-visual → JSZip with one PNG per visual. Single-visual → direct
// download.
//
// The SVGs this runs against are the OFFSCREEN copies rendered inside the
// ExportModal's hidden stage — we don't scrape DocumentView, which might be
// hidden behind the canvas editor at export time.
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

export interface PngExportOptions {
  /** 1 / 2 / 3 — pixel density multiplier. */
  resolution: number;
  /** Filename prefix (already slugified or will be slugified by caller). */
  filenamePrefix: string;
  /** Optional logo, applied top-right of every visual. */
  logo: LogoInfo | null;
}

interface StageVisual {
  visual: VisualInstance;
  /** The `<svg>` element rendered offscreen by ExportModal. */
  svg: SVGSVGElement;
}

export async function exportPng(
  stageVisuals: StageVisual[],
  options: PngExportOptions,
): Promise<void> {
  if (stageVisuals.length === 0) return;

  // Dynamic import keeps html2canvas out of the initial bundle — it only
  // loads when the user actually clicks Export with PNG selected.
  const html2canvas = (await import('html2canvas')).default;

  const prefix = slugifyFilename(options.filenamePrefix);
  const multiplier = clamp(options.resolution, 1, 3);
  const stages: Array<{ visual: VisualInstance; stage: HTMLDivElement }> = [];

  // Stage every visual in the document body — html2canvas needs them
  // attached to render fonts/images correctly. Positioned offscreen.
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-100000px';
  holder.style.top = '0';
  holder.style.pointerEvents = 'none';
  holder.style.opacity = '0';
  holder.setAttribute('aria-hidden', 'true');
  document.body.appendChild(holder);

  try {
    for (const sv of stageVisuals) {
      // Apply overrides on a per-visual clone.
      const nat = measureNaturalBBoxes(sv.svg);
      const clone = sv.svg.cloneNode(true) as SVGSVGElement;
      applyCanvasOverridesToSvg(clone, sv.visual.canvas, nat);

      const stage = buildExportStageForRaster(clone, sv.visual, {
        logo: options.logo,
        background: '#ffffff',
      });
      holder.appendChild(stage);
      stages.push({ visual: sv.visual, stage });
    }

    const pngs: Array<{ blob: Blob; filename: string }> = [];

    for (let i = 0; i < stages.length; i++) {
      const { visual, stage } = stages[i];
      // html2canvas options: transparent background off (white paper),
      // scale = resolution, useCORS true for logo data URLs (harmless).
      const canvas = await html2canvas(stage, {
        backgroundColor: '#ffffff',
        scale: multiplier,
        useCORS: true,
        logging: false,
      });
      const blob = await canvasToBlob(canvas);
      if (!blob) continue;
      const slug = slugifyFilename(visual.title || `visual-${i + 1}`);
      const fname =
        stages.length === 1 ? `${prefix}.png` : `${prefix}-${i + 1}-${slug}.png`;
      pngs.push({ blob, filename: fname });
    }

    if (pngs.length === 0) return;

    if (pngs.length === 1) {
      downloadBlob(pngs[0].blob, pngs[0].filename);
      return;
    }

    // Multi-visual → zip.
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const p of pngs) zip.file(p.filename, p.blob);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${prefix}.zip`);
  } finally {
    // Always tear down the offscreen stages.
    holder.parentElement?.removeChild(holder);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
