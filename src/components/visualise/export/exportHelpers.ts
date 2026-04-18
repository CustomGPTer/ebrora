// =============================================================================
// Export — shared helpers.
//
// Split out of the PNG/SVG/PDF export modules because all three need the
// same transform application (so canvas-editor edits carry into exports),
// the same filename slugifier, and the same logo-rasterisation path.
// =============================================================================

import type {
  VisualCanvasState,
  VisualInstance,
} from '@/lib/visualise/types';

export interface NaturalBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Measure natural bboxes of every `<g data-id>` in an SVG. Clears any
 * existing `transform` attr and `display:none` before measuring so the
 * result is the preset's native geometry — mirrors CanvasEditor's measure
 * pass so exports are consistent with what the editor sees.
 *
 * Only call against an SVG that's currently attached to a rendered DOM;
 * `getBBox()` throws on detached or display:none subtrees in some browsers.
 */
export function measureNaturalBBoxes(svg: SVGSVGElement): Record<string, NaturalBBox> {
  const out: Record<string, NaturalBBox> = {};
  const gs = svg.querySelectorAll<SVGGElement>('g[data-id]');
  gs.forEach((g) => {
    g.removeAttribute('transform');
    g.style.removeProperty('display');
  });
  gs.forEach((g) => {
    const id = g.getAttribute('data-id');
    if (!id) return;
    try {
      const b = g.getBBox();
      out[id] = { x: b.x, y: b.y, w: b.width, h: b.height };
    } catch {
      // Skip — would also be invisible in the editor.
    }
  });
  return out;
}

/**
 * Apply canvas.nodes overrides (translation, scale, hidden, zIndex) to the
 * `<g data-id>` children of an SVG. Designed to be called on a clone that
 * we're about to serialize/rasterise — leaves the DOM in its final visual
 * state before export, matching what the user sees in the canvas editor.
 *
 * zIndex reordering is done per-parent (so nested `<g data-id>` groupings
 * stack correctly) with a stable sort on the original DOM index.
 */
export function applyCanvasOverridesToSvg(
  svg: SVGSVGElement,
  canvas: VisualCanvasState,
  naturalBBoxes: Record<string, NaturalBBox>,
): void {
  const gElements = Array.from(svg.querySelectorAll<SVGGElement>('g[data-id]'));

  // ── z-order reorder ───────────────────────────────────────────────────
  const byParent = new Map<Element, Array<{ el: SVGGElement; z: number; origIdx: number }>>();
  gElements.forEach((g, i) => {
    const parent = g.parentElement;
    if (!parent) return;
    const id = g.getAttribute('data-id');
    const override = id ? canvas.nodes[id] : undefined;
    const z = override?.zIndex ?? 0;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push({ el: g, z, origIdx: i });
  });
  byParent.forEach((items, parent) => {
    if (items.every((x) => x.z === 0)) return;
    items.sort((a, b) => a.z - b.z || a.origIdx - b.origIdx);
    for (const item of items) parent.appendChild(item.el);
  });

  // ── transforms + hidden ────────────────────────────────────────────────
  gElements.forEach((g) => {
    const id = g.getAttribute('data-id');
    if (!id) return;
    const override = canvas.nodes[id];

    if (override?.hidden) {
      // Prefer actually removing hidden nodes from the export so nothing
      // leaks into the rasterised output or SVG source.
      g.parentElement?.removeChild(g);
      return;
    }

    const tx = override?.x ?? 0;
    const ty = override?.y ?? 0;
    const sx = override?.w && override.w > 0 ? override.w : 1;
    const sy = override?.h && override.h > 0 ? override.h : 1;
    const parts: string[] = [];
    if (tx !== 0 || ty !== 0) parts.push(`translate(${tx}, ${ty})`);
    if (sx !== 1 || sy !== 1) {
      const nat = naturalBBoxes[id];
      if (nat) {
        parts.push(`translate(${nat.x}, ${nat.y}) scale(${sx}, ${sy}) translate(${-nat.x}, ${-nat.y})`);
      } else {
        parts.push(`scale(${sx}, ${sy})`);
      }
    }
    if (parts.length === 0) g.removeAttribute('transform');
    else g.setAttribute('transform', parts.join(' '));
  });
}

/** Turn a document title into a safe filename prefix. */
export function slugifyFilename(input: string): string {
  const s = (input || 'visualise')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return s.length > 0 ? s.slice(0, 60) : 'visualise';
}

/** Read a File as a data URL (used for logo injection). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error ?? new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

export interface LogoInfo {
  dataUrl: string;
  /** Natural dimensions read from the image at data-URL load time. */
  width: number;
  height: number;
  /** MIME type, used by SVG export to decide between `image/png` etc. */
  type: string;
}

/**
 * Load a logo into a dataUrl + its natural size. Returns null on failure
 * (malformed image, unsupported format, etc.) — caller should treat null
 * as "no logo" rather than blocking the export.
 */
export async function loadLogo(file: File): Promise<LogoInfo | null> {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = dataUrl;
      },
    );
    return { dataUrl, width, height, type: file.type || 'image/png' };
  } catch {
    return null;
  }
}

/** Force-download a Blob as the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick — Safari needs the URL alive during the click dispatch.
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/**
 * Wrap preset visuals in a title block for rasterised exports. When
 * `settings.showTitle` is true, we prepend a `<div>` with the visual title
 * above the SVG so html2canvas includes it. Returns the wrapper element;
 * caller owns the DOM lifecycle.
 */
export function buildExportStageForRaster(
  svg: SVGSVGElement,
  visual: VisualInstance,
  options: { logo: LogoInfo | null; background?: string },
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.style.background = options.background ?? '#ffffff';
  wrap.style.padding = '24px';
  wrap.style.boxSizing = 'border-box';
  wrap.style.display = 'inline-block';
  wrap.style.fontFamily = visual.settings.font || 'Inter, sans-serif';
  wrap.style.color = '#111827';
  wrap.style.position = 'relative';

  // Title band.
  if (visual.settings.showTitle && visual.title) {
    const h = document.createElement('div');
    h.textContent = visual.title;
    h.style.fontSize = '18px';
    h.style.fontWeight = '700';
    h.style.color = '#111827';
    h.style.marginBottom = '12px';
    h.style.paddingRight = options.logo ? '120px' : '0';
    wrap.appendChild(h);
  }

  // Logo, top-right. Constrained to 48 px height.
  if (options.logo) {
    const img = document.createElement('img');
    img.src = options.logo.dataUrl;
    const ratio = options.logo.width > 0 ? options.logo.height / options.logo.width : 1;
    const maxH = 48;
    const maxW = Math.round(maxH / Math.max(ratio, 0.0001));
    img.style.position = 'absolute';
    img.style.top = '16px';
    img.style.right = '16px';
    img.style.height = `${maxH}px`;
    img.style.width = `${maxW}px`;
    img.style.objectFit = 'contain';
    wrap.appendChild(img);
  }

  // The SVG itself. Clone so we don't steal it from a rendered stage.
  const svgClone = svg.cloneNode(true) as SVGSVGElement;
  // Ensure the SVG renders at a predictable pixel size for html2canvas.
  // 800×400 is the canonical CONTENT_W×CONTENT_H from the editor.
  const vb = svgClone.getAttribute('viewBox');
  if (vb) {
    const [, , vw, vh] = vb.split(/\s+/).map(Number);
    if (Number.isFinite(vw) && Number.isFinite(vh)) {
      svgClone.setAttribute('width', String(vw));
      svgClone.setAttribute('height', String(vh));
    }
  }
  svgClone.style.display = 'block';
  wrap.appendChild(svgClone);

  return wrap;
}
