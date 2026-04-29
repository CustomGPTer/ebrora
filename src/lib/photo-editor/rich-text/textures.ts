// src/lib/photo-editor/rich-text/textures.ts
//
// Eight programmatically-generated textures for use as text fills via
// `GlyphRun.texture`. New for Batch D2b.
//
// Why programmatic and not PNG assets:
//   • Zero new files in `public/` — cleaner deploy.
//   • No HTTP fetch, no async race between texture load and first paint.
//   • Tiny memory footprint — each canvas is 256×256 = 256KB max.
//   • Still respects the engine's existing texture pipeline:
//       options.textures: Map<string, CanvasImageSource>
//     The engine doesn't care whether the source is an HTMLImageElement
//     loaded from a URL or an HTMLCanvasElement we drew on the fly. As
//     long as the value type is one of the CanvasImageSource union
//     members, `ctx.createPattern(img, "repeat")` accepts it.
//
// The 8 textures are intentionally low-fidelity / abstract — they're
// fills behind text, not photographic surfaces. A more polished set
// can be commissioned later and dropped in by replacing the generator
// bodies; the public API (TEXTURE_IDS, getTextureMap) stays stable.
//
// Generation runs on first use and the canvases are cached in a
// module-level Map. The first GradientPanel/TexturePanel render on a
// session triggers it; subsequent renders return the cached map.

export const TEXTURE_IDS = [
  "brushed-metal",
  "concrete",
  "paper",
  "denim",
  "marble",
  "wood",
  "gradient-noise",
  "fabric",
] as const;

export type TextureId = (typeof TEXTURE_IDS)[number];

/** Display labels for the texture grid. */
export const TEXTURE_LABELS: Record<TextureId, string> = {
  "brushed-metal": "Brushed Metal",
  concrete: "Concrete",
  paper: "Paper",
  denim: "Denim",
  marble: "Marble",
  wood: "Wood",
  "gradient-noise": "Gradient Noise",
  fabric: "Fabric",
};

const TEXTURE_SIZE = 256;
let cachedMap: Map<string, CanvasImageSource> | null = null;

/** Returns the singleton texture map. Builds it on first call by drawing
 *  every texture into its own off-screen canvas; subsequent calls return
 *  the cached map. SSR-safe — returns an empty Map when `document` is
 *  undefined (the engine handles missing textures gracefully via the
 *  `options.textures?.get(src)` lookup falling through to solid fill). */
export function getTextureMap(): Map<string, CanvasImageSource> {
  if (cachedMap) return cachedMap;
  if (typeof document === "undefined") return new Map();

  const map = new Map<string, CanvasImageSource>();
  for (const id of TEXTURE_IDS) {
    const canvas = makeCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    drawTexture(ctx, id);
    map.set(id, canvas);
  }
  cachedMap = map;
  return map;
}

/** Returns the cached canvas for a single texture id, or null if the
 *  cache hasn't been built yet OR the id is unknown. Used by the
 *  TexturePanel grid to paint preview thumbnails. */
export function getTextureCanvas(id: TextureId): HTMLCanvasElement | null {
  const map = getTextureMap();
  const v = map.get(id);
  return v instanceof HTMLCanvasElement ? v : null;
}

// ─── Generators ─────────────────────────────────────────────────

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TEXTURE_SIZE;
  c.height = TEXTURE_SIZE;
  return c;
}

function drawTexture(ctx: CanvasRenderingContext2D, id: TextureId): void {
  switch (id) {
    case "brushed-metal":
      drawBrushedMetal(ctx);
      return;
    case "concrete":
      drawConcrete(ctx);
      return;
    case "paper":
      drawPaper(ctx);
      return;
    case "denim":
      drawDenim(ctx);
      return;
    case "marble":
      drawMarble(ctx);
      return;
    case "wood":
      drawWood(ctx);
      return;
    case "gradient-noise":
      drawGradientNoise(ctx);
      return;
    case "fabric":
      drawFabric(ctx);
      return;
  }
}

/** Deterministic pseudo-random — the same texture is generated every
 *  session, so the visual character stays stable across reloads. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function drawBrushedMetal(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, TEXTURE_SIZE);
  grad.addColorStop(0, "#cfd2d6");
  grad.addColorStop(0.5, "#a8acb1");
  grad.addColorStop(1, "#cfd2d6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const r = rng(11);
  for (let y = 0; y < TEXTURE_SIZE; y++) {
    const v = (r() - 0.5) * 24;
    ctx.fillStyle = `rgba(${128 + v},${128 + v},${128 + v},0.18)`;
    ctx.fillRect(0, y, TEXTURE_SIZE, 1);
  }
}

function drawConcrete(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#b8b8b8";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const r = rng(23);
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 60;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);

  // A few darker blotches.
  for (let i = 0; i < 18; i++) {
    const cx = r() * TEXTURE_SIZE;
    const cy = r() * TEXTURE_SIZE;
    const rad = 6 + r() * 24;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, "rgba(80,80,80,0.18)");
    g.addColorStop(1, "rgba(80,80,80,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
}

function drawPaper(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#f4ecdc";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const r = rng(41);
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 18;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n - 4);
  }
  ctx.putImageData(img, 0, 0);

  // Faint fibre lines.
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(180,160,120,${0.08 + r() * 0.1})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(r() * TEXTURE_SIZE, r() * TEXTURE_SIZE);
    ctx.lineTo(r() * TEXTURE_SIZE, r() * TEXTURE_SIZE);
    ctx.stroke();
  }
}

function drawDenim(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#3b5b87";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Diagonal weave lines.
  ctx.strokeStyle = "rgba(20,40,70,0.4)";
  ctx.lineWidth = 1;
  for (let i = -TEXTURE_SIZE; i < TEXTURE_SIZE * 2; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(180,200,220,0.18)";
  for (let i = -TEXTURE_SIZE; i < TEXTURE_SIZE * 2; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.stroke();
  }

  const r = rng(57);
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 24;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function drawMarble(ctx: CanvasRenderingContext2D): void {
  // Base marble white.
  ctx.fillStyle = "#f1ece4";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const r = rng(73);
  // Drift bands of colour using radial gradients in random spots.
  for (let i = 0; i < 6; i++) {
    const cx = r() * TEXTURE_SIZE;
    const cy = r() * TEXTURE_SIZE;
    const rad = 60 + r() * 80;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, "rgba(200,180,140,0.18)");
    g.addColorStop(1, "rgba(200,180,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }

  // Veining.
  ctx.strokeStyle = "rgba(110,90,70,0.45)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    let x = r() * TEXTURE_SIZE;
    let y = r() * TEXTURE_SIZE;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (r() - 0.5) * 60;
      y += (r() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawWood(ctx: CanvasRenderingContext2D): void {
  // Vertical brown bands of varying width.
  const r = rng(89);
  let x = 0;
  while (x < TEXTURE_SIZE) {
    const w = 4 + r() * 16;
    const shade = 80 + r() * 50;
    ctx.fillStyle = `rgb(${shade + 30},${shade},${shade - 30})`;
    ctx.fillRect(x, 0, w, TEXTURE_SIZE);
    x += w;
  }

  // Horizontal noise pass.
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 18;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n - 2);
    img.data[i + 2] = clamp255(img.data[i + 2] + n - 4);
  }
  ctx.putImageData(img, 0, 0);

  // Knots.
  for (let i = 0; i < 5; i++) {
    const cx = r() * TEXTURE_SIZE;
    const cy = r() * TEXTURE_SIZE;
    const rad = 6 + r() * 14;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, "rgba(40,20,5,0.7)");
    g.addColorStop(1, "rgba(40,20,5,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
}

function drawGradientNoise(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  grad.addColorStop(0, "#ff6b9d");
  grad.addColorStop(0.5, "#a259ff");
  grad.addColorStop(1, "#3ec0ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const r = rng(101);
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 40;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function drawFabric(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#7a8896";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Cross-hatch warp/weft.
  ctx.strokeStyle = "rgba(40,50,60,0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i < TEXTURE_SIZE; i += 3) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(TEXTURE_SIZE, i);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(220,230,240,0.18)";
  for (let i = 0; i < TEXTURE_SIZE; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, TEXTURE_SIZE);
    ctx.stroke();
  }

  const r = rng(127);
  const img = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 16;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function clamp255(n: number): number {
  if (n < 0) return 0;
  if (n > 255) return 255;
  return n;
}
