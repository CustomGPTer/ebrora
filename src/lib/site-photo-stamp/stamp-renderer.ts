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

  try {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    // 1. Photo base layer.
    ctx.drawImage(bitmap.source as CanvasImageSource, 0, 0, width, height);
    // Release the decoded source — the photo has been painted, we don't
    // need the original bitmap through the rest of the composite.
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
  } finally {
    // Idempotent — safe if drawImage threw before the inline close ran.
    bitmap.close?.();
    // Free the full-resolution canvas backing buffer immediately. At
    // 4000×3000 this is ~48 MB of RGBA pixels.
    canvas.width = 0;
    canvas.height = 0;
  }
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
  const headerBaseH = Math.round(base * 0.06);    // header band height (no note)
  const gap = Math.round(base * 0.012);           // row vertical gap
  const labelFs = Math.round(base * 0.022);       // label font
  const valueFs = Math.round(base * 0.024);       // value font
  const headerFs = Math.round(base * 0.028);      // header font
  const noteFs = Math.round(base * 0.023);        // note font (header subtitle)
  const iconSize = Math.round(headerFs * 1.05);   // badge icon
  const labelCol = Math.round(base * 0.12);       // width of left label column
  const colonPad = Math.round(base * 0.008);      // padding for colon separator

  // ── Compose rows ──
  interface Row { label: string; value: string; mono: boolean; }
  const rows: Row[] = [];

  rows.push({
    label: "Time",
    value: formatTimestamp(meta.timestamp, settings.timestampFormat),
    mono: false,
  });

  if (settings.showAddress && meta.address) {
    rows.push({ label: "Address", value: meta.address, mono: false });
  }

  if (settings.showCoords && meta.lat != null && meta.lon != null) {
    const c = settings.coordFormat === "dms"
      ? formatCoordsDms(meta.lat, meta.lon)
      : formatCoordsDecimal(meta.lat, meta.lon, 6);
    rows.push({ label: "Coord", value: c, mono: true });
  }

  if (settings.projectName) rows.push({ label: "Project", value: settings.projectName, mono: false });
  if (settings.siteName) rows.push({ label: "Site", value: settings.siteName, mono: false });
  if (settings.contractor) rows.push({ label: "Contractor", value: settings.contractor, mono: false });
  if (settings.operative) rows.push({ label: "Operative", value: settings.operative, mono: false });
  if (meta.uniqueId) rows.push({ label: "Record ID", value: meta.uniqueId, mono: true });

  // ── Determine card width from content ────────────────────────
  // Card shrinks to fit the longest row on a single line, capped by an
  // overall maximum so it never dominates the photo.
  const maxCardW = Math.min(Math.round(w * 0.72), Math.round(base * 1.7));
  const minCardW = Math.round(base * 0.55);

  ctx.save();

  // Measure natural widths (single-line, no wrapping yet) so we can size.
  let naturalInnerW = 0;
  for (const r of rows) {
    ctx.font = r.mono ? monoFont(valueFs, "600") : weightFont(valueFs, "600");
    const vW = ctx.measureText(r.value).width;
    const rowInnerW = labelCol + vW;
    if (rowInnerW > naturalInnerW) naturalInnerW = rowInnerW;
  }

  // Header content (icon + title) also drives minimum width.
  const hasIcon = variant.id === "icon" && !!variant.icon;
  const iconGap = Math.round(iconSize * 0.5);
  ctx.font = weightFont(headerFs, "700");
  const title = template.title.toUpperCase();
  const titleW = ctx.measureText(title).width;
  const headerInnerW = (hasIcon ? iconSize + iconGap : 0) + titleW;
  if (headerInnerW > naturalInnerW) naturalInnerW = headerInnerW;

  // Clamp to [min, max] and add padding to get final cardW.
  const targetInnerW = Math.max(
    minCardW - cardPad * 2,
    Math.min(naturalInnerW, maxCardW - cardPad * 2)
  );
  const cardInnerW = targetInnerW;
  const cardW = cardInnerW + cardPad * 2;
  const valueMaxW = cardInnerW - labelCol - colonPad;

  // ── Measure row heights with wrapping now that cardW is fixed ──
  const rowHeights = rows.map((r) => {
    ctx.font = r.mono ? monoFont(valueFs, "600") : weightFont(valueFs, "600");
    const lines = wrapText(ctx, r.value, valueMaxW, 2);
    return Math.max(lines.length * (valueFs * 1.25), valueFs * 1.25);
  });

  // ── Note (optional subtitle below title in header) ────────────
  const rawNote = (meta.note ?? "").trim();
  const hasNote = rawNote.length > 0;
  let noteLines: string[] = [];
  let headerH = headerBaseH;
  const titleAreaH = Math.round(headerFs * 1.85); // title portion when note present

  if (hasNote) {
    ctx.font = weightFont(noteFs, "500");
    noteLines = wrapText(ctx, rawNote, cardInnerW, 3);
    const noteLineH = Math.round(noteFs * 1.35);
    const notePadBottom = Math.round(base * 0.012);
    headerH = titleAreaH + noteLines.length * noteLineH + notePadBottom;
  }

  // ── Compute card position ─────────────────────────────────────
  const rowsBlockH = rowHeights.reduce((s, v) => s + v, 0) + gap * Math.max(0, rows.length - 1);
  const cardH = headerH + cardPad * 2 + rowsBlockH;
  const cardX = pad;
  const cardY = h - pad - cardH;

  const isTransparent = variant.id === "transparent";

  // ── Card background with shadow (omitted for transparent variant) ──
  if (!isTransparent) {
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = Math.round(base * 0.012);
    ctx.shadowOffsetY = Math.round(base * 0.004);

    roundRectPath(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // ── Header band (filled for solid / icon; skipped for transparent) ──
  // Solid variant gets a softened fill (0.8 alpha) so the photo shows
  // faintly through the coloured block. Icon variant stays fully opaque so
  // the badge reads crisply. Text (title + body rows) is always fully
  // opaque regardless of band — we only dim the coloured fill, not the
  // glyphs. Transparent variant is skipped entirely (no band at all).
  const SOLID_HEADER_ALPHA = 0.8;
  const headerBg =
    variant.id === "solid"
      ? withAlpha(variant.accentColor, SOLID_HEADER_ALPHA)
      : variant.accentColor;
  const headerFg = variant.textColor;

  if (!isTransparent) {
    ctx.save();
    roundRectPathTopOnly(ctx, cardX, cardY, cardW, headerH, radius);
    ctx.clip();
    ctx.fillStyle = headerBg;
    ctx.fillRect(cardX, cardY, cardW, headerH);
    ctx.restore();
  }

  // ── Header text + optional icon ──
  const headerPadX = cardPad;
  let textX = cardX + headerPadX;
  // Transparent variant: title painted in the template's base colour
  // directly on a semi-opaque white rounded background (drawn below). Solid
  // / icon variants keep the existing header foreground colour.
  const headerTextColour = isTransparent ? template.baseColor : headerFg;

  // Title sits in the top portion of the header. Vertically centered within
  // the base header height when there's no note, or within the dedicated
  // titleAreaH slot when a note is present.
  const titleCenterY = hasNote ? cardY + titleAreaH / 2 : cardY + headerBaseH / 2;

  if (hasIcon && variant.icon) {
    const iconY = titleCenterY - iconSize / 2;
    drawBadgeIcon(ctx, variant.icon, textX, iconY, iconSize, headerTextColour);
    textX += iconSize + iconGap;
  }

  ctx.font = weightFont(headerFs, "700");
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const titleMaxW = cardW - headerPadX * 2 - (hasIcon ? iconSize + iconGap : 0);
  const titleText = truncate(ctx, title, titleMaxW);

  if (isTransparent) {
    // Semi-opaque white rounded background behind the title (and note, if
    // present) so the text stays legible on any photo. Padding is equal on
    // all four sides, measured tight to the actual text block — not the
    // card/header region.
    const bgPad = Math.round(base * 0.015);
    const bgRadius = Math.round(base * 0.012);

    // Measure the real glyph width of the (already truncated) title.
    ctx.font = weightFont(headerFs, "700");
    const actualTitleW = ctx.measureText(titleText).width;

    // Measure the widest note line, if any.
    let maxNoteW = 0;
    if (hasNote) {
      ctx.font = weightFont(noteFs, "500");
      for (const line of noteLines) {
        const lineW = ctx.measureText(line).width;
        if (lineW > maxNoteW) maxNoteW = lineW;
      }
    }

    const textBlockW = Math.max(actualTitleW, maxNoteW);
    const textLeftX = cardX + cardPad;

    // Vertical bounds: from the top of the title glyph down to the bottom
    // of the last note line (or just the title if no note is present).
    const titleTopY = titleCenterY - headerFs / 2;
    let textBottomY = titleCenterY + headerFs / 2;
    if (hasNote) {
      const noteLineH = Math.round(noteFs * 1.35);
      const firstNoteCenterY =
        cardY + titleAreaH + noteLineH / 2 - Math.round(noteFs * 0.05);
      const lastNoteCenterY =
        firstNoteCenterY + (noteLines.length - 1) * noteLineH;
      textBottomY = lastNoteCenterY + noteFs / 2;
    }

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    roundRectPath(
      ctx,
      textLeftX - bgPad,
      titleTopY - bgPad,
      textBlockW + bgPad * 2,
      textBottomY - titleTopY + bgPad * 2,
      bgRadius
    );
    ctx.fill();

    // Restore title font for the fillText call below.
    ctx.font = weightFont(headerFs, "700");
  }
  ctx.fillStyle = headerTextColour;
  ctx.fillText(titleText, textX, titleCenterY);

  // Note lines (below title). Same colour treatment as the title — painted
  // directly; the transparent variant's white background behind the header
  // handles legibility, so no stroke is needed.
  if (hasNote) {
    ctx.font = weightFont(noteFs, "500");
    const noteLineH = Math.round(noteFs * 1.35);
    let ny = cardY + titleAreaH + noteLineH / 2 - Math.round(noteFs * 0.05);
    for (const line of noteLines) {
      ctx.fillStyle = headerTextColour;
      ctx.fillText(line, cardX + cardPad, ny);
      ny += noteLineH;
    }
  }

  // ── Body rows ──
  // Colour choice:
  //   • solid / icon  → grey labels, dark slate values on the white card.
  //   • transparent   → pure white labels + values, strict (no stroke); if
  //                     the photo is too bright the user switches band.
  const bodyLabelColour = isTransparent ? "rgba(255,255,255,0.85)" : "#6B7280";
  const bodyColonColour = isTransparent ? "rgba(255,255,255,0.55)" : "#9CA3AF";
  const bodyValueColour = isTransparent ? "#FFFFFF" : "#0F172A";

  let y = cardY + headerH + cardPad;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowH = rowHeights[i];
    const labelY = y + rowH / 2;

    ctx.fillStyle = bodyLabelColour;
    ctx.font = weightFont(labelFs, "600");
    ctx.textBaseline = "middle";
    ctx.fillText(r.label, cardX + cardPad, labelY);

    ctx.fillStyle = bodyColonColour;
    ctx.fillText(":", cardX + cardPad + labelCol - Math.round(base * 0.015), labelY);

    ctx.fillStyle = bodyValueColour;
    ctx.font = r.mono ? monoFont(valueFs, "600") : weightFont(valueFs, "600");
    const lines = wrapText(ctx, r.value, valueMaxW, 2);
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

  // ── FREE tier: Ebrora "E" mark + "ebrora.com" ──
  const fs = Math.round(base * 0.022);
  const markSize = Math.round(fs * 1.5);
  const gap = Math.round(base * 0.008);
  const label = "ebrora.com";

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

/**
 * Return the given CSS colour with an overridden alpha channel.
 * Handles the only input forms present in our templates:
 *   • "#RRGGBB"  (primary case — every template.baseColor is this form)
 *   • "#RGB"     (safety fallback, none in current palette)
 *   • "rgb(…)"   (safety fallback for future flexibility)
 * Any unrecognised input is returned unchanged, so a bad colour never
 * collapses the stamp to empty — it just renders at full opacity.
 */
function withAlpha(colour: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  if (colour.startsWith("#")) {
    const hex = colour.slice(1);
    let r: number, g: number, b: number;
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      return colour;
    }
    if ([r, g, b].some((n) => Number.isNaN(n))) return colour;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const rgbMatch = colour.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`;
  }
  return colour;
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 2): string[] {
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
  // Cap at maxLines to keep cards compact; collapse/truncate the rest.
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines - 1);
    const tail = truncate(ctx, out.slice(maxLines - 1).join(" "), maxW);
    return [...kept, tail];
  }
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
    let img: HTMLImageElement | null = new Image();
    img.onload = () => {
      const loaded = img!;
      resolve({
        source: loaded,
        width: loaded.naturalWidth,
        height: loaded.naturalHeight,
        close: () => {
          // Revoke the object URL and actively drop the decoded bitmap.
          // Clearing src + removing handlers lets the browser free the
          // underlying pixel buffer on the next GC cycle rather than
          // waiting for the closure scope to become unreachable — matters
          // on low-RAM Android WebViews where bulk processing otherwise
          // accumulates decoded bitmaps faster than GC reclaims them.
          URL.revokeObjectURL(url);
          loaded.onload = null;
          loaded.onerror = null;
          loaded.src = "";
          img = null;
        },
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = "";
        img = null;
      }
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
  try {
    const ctx = c.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Thumbnail context unavailable");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, tw, th);
    return await canvasToJpegBlob(c, quality);
  } finally {
    c.width = 0;
    c.height = 0;
  }
}
