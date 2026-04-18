// =============================================================================
// SVG export — serializes each visual's SVG with canvas overrides applied
// and optional logo + title band injected as extra SVG elements (not a
// rasterised wrapper — SVG export keeps everything vector).
//
// Multi-visual → JSZip with one .svg per visual.
// Single-visual → direct download.
//
// The SVGs this runs against are the offscreen copies rendered inside the
// ExportModal's hidden stage.
// =============================================================================

import type { VisualInstance } from '@/lib/visualise/types';
import {
  applyCanvasOverridesToSvg,
  downloadBlob,
  measureNaturalBBoxes,
  slugifyFilename,
  type LogoInfo,
} from './exportHelpers';

export interface SvgExportOptions {
  filenamePrefix: string;
  logo: LogoInfo | null;
}

interface StageVisual {
  visual: VisualInstance;
  svg: SVGSVGElement;
}

export async function exportSvg(
  stageVisuals: StageVisual[],
  options: SvgExportOptions,
): Promise<void> {
  if (stageVisuals.length === 0) return;

  const prefix = slugifyFilename(options.filenamePrefix);
  const files: Array<{ name: string; body: string }> = [];

  for (let i = 0; i < stageVisuals.length; i++) {
    const sv = stageVisuals[i];
    const nat = measureNaturalBBoxes(sv.svg);
    const clone = sv.svg.cloneNode(true) as SVGSVGElement;
    applyCanvasOverridesToSvg(clone, sv.visual.canvas, nat);

    // Title + logo get wrapped in a new root SVG that sits above the
    // original content, so the export is still a single valid SVG file.
    const wrapped = wrapWithTitleAndLogo(clone, sv.visual, options.logo);
    const source = serializeSvg(wrapped);

    const slug = slugifyFilename(sv.visual.title || `visual-${i + 1}`);
    const name =
      stageVisuals.length === 1 ? `${prefix}.svg` : `${prefix}-${i + 1}-${slug}.svg`;
    files.push({ name, body: source });
  }

  if (files.length === 1) {
    const blob = new Blob([files[0].body], { type: 'image/svg+xml' });
    downloadBlob(blob, files[0].name);
    return;
  }

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.body);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${prefix}.zip`);
}

/**
 * Build a root SVG that contains:
 *   [optional title text at the top]
 *   [optional logo top-right]
 *   [the original preset SVG, inset by a margin]
 *
 * Dimensions are computed so nothing overflows. Viewbox is set accordingly.
 */
function wrapWithTitleAndLogo(
  inner: SVGSVGElement,
  visual: VisualInstance,
  logo: LogoInfo | null,
): SVGSVGElement {
  const padding = 24;
  const titleHeight = visual.settings.showTitle && visual.title ? 32 : 0;
  const logoMaxH = 48;
  const logoMaxW = logo
    ? Math.round((logoMaxH * Math.max(logo.width, 1)) / Math.max(logo.height, 1))
    : 0;
  const topPad = Math.max(titleHeight, logo ? logoMaxH : 0);

  // Derive inner viewBox dimensions.
  const vb = inner.getAttribute('viewBox') || '0 0 800 400';
  const [, , vwStr, vhStr] = vb.split(/\s+/);
  const vw = Number(vwStr) || 800;
  const vh = Number(vhStr) || 400;

  const totalW = vw + padding * 2;
  const totalH = vh + padding * 2 + (topPad > 0 ? topPad + 12 : 0);

  const xmlns = 'http://www.w3.org/2000/svg';
  const xlink = 'http://www.w3.org/1999/xlink';
  const root = document.createElementNS(xmlns, 'svg') as SVGSVGElement;
  root.setAttribute('xmlns', xmlns);
  root.setAttribute('xmlns:xlink', xlink);
  root.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
  root.setAttribute('width', String(totalW));
  root.setAttribute('height', String(totalH));

  // White background rect so viewers that default to checkerboard behave.
  const bg = document.createElementNS(xmlns, 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('fill', '#ffffff');
  root.appendChild(bg);

  // Title.
  if (titleHeight > 0) {
    const t = document.createElementNS(xmlns, 'text');
    t.setAttribute('x', String(padding));
    t.setAttribute('y', String(padding + 20));
    t.setAttribute('font-family', visual.settings.font || 'Inter, sans-serif');
    t.setAttribute('font-size', '18');
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', '#111827');
    t.textContent = visual.title;
    root.appendChild(t);
  }

  // Logo as embedded raster (its original bytes).
  if (logo) {
    const img = document.createElementNS(xmlns, 'image');
    img.setAttribute('x', String(totalW - padding - logoMaxW));
    img.setAttribute('y', String(padding));
    img.setAttribute('width', String(logoMaxW));
    img.setAttribute('height', String(logoMaxH));
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Modern SVG viewers accept `href`; `xlink:href` kept for older viewers.
    img.setAttribute('href', logo.dataUrl);
    img.setAttributeNS(xlink, 'xlink:href', logo.dataUrl);
    root.appendChild(img);
  }

  // Inner preset SVG wrapped in a <g> translated below the header band.
  const innerY = padding + (topPad > 0 ? topPad + 12 : 0);
  const g = document.createElementNS(xmlns, 'g');
  g.setAttribute('transform', `translate(${padding}, ${innerY})`);

  // Copy the inner SVG's children over into the g (rather than nesting
  // an <svg> inside <svg>, which some viewers handle imperfectly).
  // Also bring across <defs> if present so markers/filters resolve.
  Array.from(inner.childNodes).forEach((node) => {
    g.appendChild(node.cloneNode(true));
  });
  root.appendChild(g);

  return root;
}

function serializeSvg(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  const body = serializer.serializeToString(svg);
  // Prepend XML declaration so the file opens cleanly in Illustrator etc.
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${body}`;
}
