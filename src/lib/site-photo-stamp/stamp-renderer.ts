// src/lib/site-photo-stamp/stamp-renderer.ts
//
// Direct-to-canvas stamp compositor. Takes a captured photo blob plus the
// chosen template/variant and metadata, and produces a final stamped JPEG.
//
// Design decisions:
// • Pure Canvas2D. No html2canvas — lower bundle weight, more predictable
//   cross-browser, no font-loading ceremony, much faster on large photos.
// • Stamp is laid out in device pixels relative to the photo's long edge so
//   it scales sensibly with input size.
// • Output format: JPEG at quality 0.92. Stamped text remains crisp at this
//   quality level and file sizes stay under ~1 MB for easy sharing.

import type {
  StampMeta,
  Template,
  TemplateVariant,
  Settings,
  StampIcon,
  Tier,
} from "./types";
import { formatCoordsDecimal, formatCoordsDms } from "./geolocation";

const PAID_TIERS = new Set<Tier>(["STARTER", "STANDARD", "PROFESSIONAL", "UNLIMITED"]);

export interface RenderStampOptions {
  /** The downscaled photo blob from the capture pipeline. */
  photoBlob: Blob;
  template: Template;
  variant: TemplateVariant;
  meta: StampMeta;
  settings: Settings;
  tier: Tier;
  /** Output JPEG quality (0–1). Default 0.92. */
  quality?: number;
}

export interface RenderStampResult {
  blob: Blob;
  /** Thumbnail blob (low-res JPEG for gallery grids later in Batch 4). */
  thumbnailBlob: Blob;
  width: number;
  height: number;
}

// ─── Entry ──────────────────────────────────────────────────────

export async function renderStamp(opts: RenderStampOptions): Promise<RenderStampResult> {
  const { photoBlob, template, variant, meta, settings, tier } = opts;
  const quality = opts.quality ?? 0.92;

  const bitmap = await loadBitmap(photoBlob);
  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    bitmap.close?.();
    throw new Error("Canvas 2D context unavailable");
  }

  // 1. Photo base layer.
  ctx.drawImage(bitmap.source as CanvasImageSource, 0, 0, width, height);
  bitmap.close?.();

  // 2. Stamp card (bottom-left).
  drawStampCard(ctx, width, height, template, variant, meta, settings);

  // 3. Unique-ID vertical ribbon (right edge).
  drawVerticalRibbon(ctx, width, height, meta.uniqueId);

  // 4. Watermark / company logo.
  await drawWatermark(ctx, width, height, tier, settings);

  // 5. Encode and thumbnail.
  const blob = await canvasToJpegBlob(canvas, quality);
  const thumbnailBlob = await makeThumbnail(canvas, 512, 0.82);
  return { blob, thumbnailBlob, width, height };
}

// ─── Stamp card (bottom-left) ──────────────────────────────────

function drawStampCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  template: Template,
  variant: TemplateVariant,
  meta: StampMeta,
  settings: Settings
) {
  // Proportional scale: base all sizes off the photo's shorter edge so
  // portrait and landscape both read well.
  const base = Math.min(w, h);
  const pad = Math.round(base * 0.018);          // outer padding from edge
  const cardPad = Math.round(base * 0.02);        // inner card padding
  const radius = Math.round(base * 0.012);        // corner radius
  const headerH = Math.round(base * 0.06);        // header band height
  const gap = Math.round(base * 0.012);           // row vertical gap
  const labelFs = Math.round(base * 0.022);       // label font
  const valueFs = Math.round(base * 0.024);       // value font
  const headerFs = Math.round(base * 0.028);      // header font
  const iconSize = Math.round(headerFs * 1.05);   // badge icon
  const labelCol = Math.round(base * 0.12);       // width of left label column

  // ── Compose rows ──
  interface Row { label: string; value: string; }
  const rows: Row[] = [];

  rows.push({ label: "Time", value: formatTimestamp(meta.timestamp, settings.timestampFormat) });

  if (settings.showAddress && meta.address) {
    rows.push({ label: "Address", value: meta.address });
  }

  if (settings.showCoords && meta.lat != null && meta.lon != null) {
    const c = settings.coordFormat === "dms"
      ? formatCoordsDms(meta.lat, meta.lon)
      : formatCoordsDecimal(meta.lat, meta.lon, 6);
    rows.push({ label: "Coord", value: c });
  }

  // Optional rows from settings.
  if (settings.projectName) rows.push({ label: "Project", value: settings.projectName });
  if (settings.siteName) rows.push({ label: "Site", value: settings.siteName });
  if (settings.contractor) rows.push({ label: "Contractor", value: settings.contractor });
  if (settings.operative) rows.push({ label: "Operative", value: settings.operative });
  if (meta.uniqueId) rows.push({ label: "Record ID", value: meta.uniqueId });

  // ── Measure card ──
  ctx.save();
  const maxCardW = Math.min(Math.round(w * 0.72), Math.round(base * 1.7));
  const cardX = pad;
  const cardW = maxCardW;

  // First pass: measure row heights given wrap width.
  const valueMaxW = cardW - cardPad * 2 - labelCol - Math.round(base * 0.008);
  ctx.font = weightFont(valueFs, "500");
  const rowHeights = rows.map((r) => {
    const lines = wrapText(ctx, r.value, valueMaxW);
    return Math.max(lines.length * (valueFs * 1.25), valueFs * 1.25);
  });

  const rowsBlockH = rowHeights.reduce((s, v) => s + v, 0) + gap * (rows.length - 1);
  const cardH = headerH + cardPad * 2 + rowsBlockH;
  const cardY = h - pad - cardH;

  // ── Card background with shadow ──
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = Math.round(base * 0.012);
  ctx.shadowOffsetY = Math.round(base * 0.004);

  roundRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fill();

  // Drop shadow is applied — reset before drawing over the card so the text
  // doesn't get a visible shadow offset.
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ── Header band ──
  const headerBg = variant.accentColor;
  const headerFg = variant.textColor;
  const isOutline = variant.id === "outline";
  const headerBorder = isOutline ? (variant.borderColor ?? template.baseColor) : null;

  // Clip header to the top rounded corners only.
  ctx.save();
  roundRectPathTopOnly(ctx, cardX, cardY, cardW, headerH, radius);
  ctx.clip();

  if (isOutline) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cardX, cardY, cardW, headerH);
    // Bottom stroke as separator
    if (headerBorder) {
      ctx.fillStyle = headerBorder;
      ctx.fillRect(cardX, cardY + headerH - Math.max(2, Math.round(base * 0.003)), cardW, Math.max(2, Math.round(base * 0.003)));
    }
  } else {
    ctx.fillStyle = headerBg;
    ctx.fillRect(cardX, cardY, cardW, headerH);
  }
  ctx.restore();

  // ── Header text + optional icon ──
  const hasIcon = variant.id === "icon" && variant.icon;
  const iconGap = Math.round(iconSize * 0.5);
  const headerPadX = cardPad;
  let textX = cardX + headerPadX;
  const headerTextColour = isOutline ? (variant.borderColor ?? template.baseColor) : headerFg;

  if (hasIcon && variant.icon) {
    const iconY = cardY + (headerH - iconSize) / 2;
    drawBadgeIcon(ctx, variant.icon, textX, iconY, iconSize, headerTextColour);
    textX += iconSize + iconGap;
  }

  ctx.fillStyle = headerTextColour;
  ctx.font = weightFont(headerFs, "700");
  ctx.textBaseline = "middle";
  const title = template.title.toUpperCase();
  const headerTextY = cardY + headerH / 2;
  ctx.fillText(truncate(ctx, title, cardW - headerPadX * 2 - (hasIcon ? iconSize + iconGap : 0)), textX, headerTextY);

  // ── Body rows ──
  let y = cardY + headerH + cardPad;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowH = rowHeights[i];
    const labelY = y + rowH / 2;
    const isMono = r.label === "Coord" || r.label === "Record ID";

    ctx.fillStyle = "#6B7280";
    ctx.font = weightFont(labelFs, "600");
    ctx.textBaseline = "middle";
    ctx.fillText(r.label, cardX + cardPad, labelY);

    // Colon separator
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(":", cardX + cardPad + labelCol - Math.round(base * 0.015), labelY);

    // Value (possibly wrapped)
    ctx.fillStyle = "#0F172A";
    ctx.font = isMono ? monoFont(valueFs, "600") : weightFont(valueFs, "600");
    const lines = wrapText(ctx, r.value, valueMaxW);
    const lineH = valueFs * 1.25;
    const startY = y + rowH / 2 - ((lines.length - 1) * lineH) / 2;
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], cardX + cardPad + labelCol, startY + j * lineH);
    }

    y += rowH + gap;
  }

  ctx.restore();
}

// ─── Vertical unique-ID ribbon (right edge) ─────────────────────

function drawVerticalRibbon(ctx: CanvasRenderingContext2D, w: number, h: number, id: string) {
  const base = Math.min(w, h);
  const fs = Math.round(base * 0.022);
  const rightPad = Math.round(base * 0.015);

  ctx.save();
  ctx.translate(w - rightPad, h / 2);
  ctx.rotate(Math.PI / 2); // 90° CW

  ctx.font = monoFont(fs, "600");
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Subtle dark outline for readability over any photo content.
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = Math.max(2, Math.round(fs * 0.18));
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeText(id, 0, 0);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(id, 0, 0);

  ctx.restore();
}

// ─── Watermark / company logo (bottom-right) ───────────────────

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tier: Tier,
  settings: Settings
) {
  const base = Math.min(w, h);
  const pad = Math.round(base * 0.018);
  const isPaid = PAID_TIERS.has(tier);

  // Paid users with a custom logo → render the logo in the corner.
  if (isPaid && settings.companyLogoDataUrl) {
    try {
      const logoImg = await loadImage(settings.companyLogoDataUrl);
      const maxH = Math.round(base * 0.06);
      const scale = maxH / logoImg.height;
      const lW = logoImg.width * scale;
      const lH = logoImg.height * scale;
      const x = w - pad - lW;
      const y = h - pad - lH;

      // White backdrop pill for contrast
      const bgPad = Math.round(maxH * 0.2);
      roundRectPath(ctx, x - bgPad, y - bgPad, lW + bgPad * 2, lH + bgPad * 2, bgPad);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      ctx.drawImage(logoImg, x, y, lW, lH);
      return;
    } catch {
      // fall through to nothing
    }
  }

  if (isPaid) return; // Paid users without a logo get no watermark.

  // ── FREE tier: Ebrora "E" mark + "Photo by Ebrora" ──
  const fs = Math.round(base * 0.022);
  const markSize = Math.round(fs * 1.5);
  const gap = Math.round(base * 0.008);
  const label = "Photo by Ebrora";

  ctx.font = weightFont(fs, "600");
  const labelW = ctx.measureText(label).width;
  const totalW = markSize + gap + labelW;
  const totalH = markSize;

  const x = w - pad - totalW;
  const y = h - pad - totalH;

  // White translucent pill background for legibility over any photo.
  const bgPad = Math.round(markSize * 0.28);
  roundRectPath(ctx, x - bgPad, y - bgPad, totalW + bgPad * 2, totalH + bgPad * 2, bgPad);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();

  // "E" mark — brand primary square.
  roundRectPath(ctx, x, y, markSize, markSize, Math.round(markSize * 0.22));
  ctx.fillStyle = "#1B5B50";
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = weightFont(Math.round(markSize * 0.6), "700");
  ctx.fillText("E", x + markSize / 2, y + markSize / 2 + Math.round(markSize * 0.02));

  // Wordmark
  ctx.fillStyle = "#1B5B50";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = weightFont(fs, "600");
  ctx.fillText(label, x + markSize + gap, y + markSize / 2);
}

// ─── Badge icons (mirror of TemplatePreviewCard) ──────────────

function drawBadgeIcon(
  ctx: CanvasRenderingContext2D,
  name: StampIcon,
  x: number,
  y: number,
  size: number,
  colour: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Icons sized to a 24-unit grid, then scaled to `size`.
  const s = size / 24;
  ctx.scale(s, s);

  ctx.beginPath();
  switch (name) {
    case "check":
      ctx.moveTo(20, 6); ctx.lineTo(9, 17); ctx.lineTo(4, 12);
      ctx.stroke();
      break;
    case "cross":
      ctx.moveTo(6, 6); ctx.lineTo(18, 18);
      ctx.moveTo(18, 6); ctx.lineTo(6, 18);
      ctx.stroke();
      break;
    case "warning":
      ctx.moveTo(12, 3);
      ctx.lineTo(22, 21);
      ctx.lineTo(2, 21);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 10); ctx.lineTo(12, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 17.5, 0.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "eye":
      ctx.ellipse(12, 12, 10, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "clipboard":
      ctx.rect(6, 5, 12, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(9, 3, 6, 4);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

// ─── Utility helpers ────────────────────────────────────────────

const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const MONO = `"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

function weightFont(size: number, weight: string) {
  return `${weight} ${size}px ${SANS}`;
}
function monoFont(size: number, weight: string) {
  return `${weight} ${size}px ${MONO}`;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function roundRectPathTopOnly(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cand = text.slice(0, mid) + "…";
    if (ctx.measureText(cand).width <= maxW) lo = mid + 1;
    else hi = mid;
  }
  return text.slice(0, Math.max(0, lo - 1)) + "…";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  // Word-wrap that respects commas and spaces. If a single token is too long,
  // it's allowed to overflow (better than truncating an address mid-word).
  if (!text) return [""];
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line + w;
    if (ctx.measureText(test).width <= maxW || line === "") {
      line = test;
    } else {
      out.push(line.trimEnd());
      line = w.replace(/^\s+/, "");
    }
  }
  if (line) out.push(line.trimEnd());
  // Cap at 2 lines to keep cards compact; collapse the rest.
  if (out.length > 2) return [out[0], truncate(ctx, out.slice(1).join(" "), maxW)];
  return out;
}

function formatTimestamp(iso: string, fmt: "24h" | "12h"): string {
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: fmt === "12h",
    };
    return d.toLocaleString("en-GB", opts);
  } catch {
    return iso;
  }
}

// ─── Image loading helpers ──────────────────────────────────────

interface LoadedBitmap {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  close?: () => void;
}

async function loadBitmap(blob: Blob): Promise<LoadedBitmap> {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const b = await createImageBitmap(blob);
      return { source: b, width: b.width, height: b.height, close: () => b.close() };
    } catch {
      // fall through
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode photo for stamping."));
    };
    img.src = url;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      quality
    );
  });
}

async function makeThumbnail(source: HTMLCanvasElement, maxDim: number, quality: number): Promise<Blob> {
  const sw = source.width, sh = source.height;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const tw = Math.max(1, Math.round(sw * scale));
  const th = Math.max(1, Math.round(sh * scale));
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Thumbnail context unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, tw, th);
  return canvasToJpegBlob(c, quality);
}
