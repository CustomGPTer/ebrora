// src/lib/site-photo-stamp/pdf-export.ts
//
// A4 PDF generation for stamped records.
//
// Two layouts, selected by record count:
//   • 1 record   → full-page report (photo + metadata table)
//   • 2+ records → 2×2 grid per page, up to 30 records total
//
// Uses jsPDF (already a repo dependency). All work is client-side.

import type { StampedRecord, StampMeta, Settings, Tier } from "./types";
import { formatCoordsDecimal } from "./geolocation";

const PAID_TIERS = new Set<Tier>(["STARTER", "STANDARD", "PROFESSIONAL", "UNLIMITED"]);

// A4 portrait in mm.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10;
const HEADER_H = 14;
const FOOTER_H = 8;

export interface PdfOptions {
  records: StampedRecord[];
  settings: Settings;
  tier: Tier;
  /** Optional company name used in the PDF header (from settings). */
  companyName?: string;
  /** Progress callback during rendering. */
  onProgress?: (done: number, total: number) => void;
}

export async function generatePdf(options: PdfOptions): Promise<Blob> {
  const { records } = options;
  if (records.length === 0) throw new Error("No records to export");

  // Dynamic import keeps jsPDF out of the main bundle.
  const { default: JsPDF } = await import("jspdf");
  const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  if (records.length === 1) {
    await renderSingleReport(pdf, records[0], options);
  } else {
    await renderGridReport(pdf, records, options);
  }

  return pdf.output("blob") as Blob;
}

// ─── Single-photo full-page report ─────────────────────────────

async function renderSingleReport(
  pdf: import("jspdf").jsPDF,
  record: StampedRecord,
  opts: PdfOptions
) {
  drawHeader(pdf, 1, 1, opts);
  drawFooter(pdf, opts);

  // Photo area: full content width, up to ~60% page height.
  const contentTop = MARGIN + HEADER_H;
  const photoMaxH = (PAGE_H - contentTop - FOOTER_H - 90) * 1.0; // leave ~90mm for metadata
  const photoMaxW = PAGE_W - MARGIN * 2;

  const img = await blobToImageData(record.imageBlob);
  const { x, y, w, h } = fitContain(img.width, img.height, MARGIN, contentTop, photoMaxW, photoMaxH);

  pdf.addImage(img.dataUrl, "JPEG", x, y, w, h, undefined, "FAST");

  // Metadata table below photo.
  const tableTop = y + h + 6;
  drawMetadataTable(pdf, record, MARGIN, tableTop, PAGE_W - MARGIN * 2);

  opts.onProgress?.(1, 1);
}

// ─── Multi-photo 2×2 grid report ───────────────────────────────

async function renderGridReport(
  pdf: import("jspdf").jsPDF,
  records: StampedRecord[],
  opts: PdfOptions
) {
  const perPage = 4;
  const totalPages = Math.ceil(records.length / perPage);

  // Cell geometry — 2 cols × 2 rows with a 4mm gutter.
  const contentTop = MARGIN + HEADER_H;
  const contentH = PAGE_H - contentTop - MARGIN - FOOTER_H;
  const gutter = 4;
  const cellW = (PAGE_W - MARGIN * 2 - gutter) / 2;
  const cellH = (contentH - gutter) / 2;
  const captionH = 18;
  const photoCellH = cellH - captionH - 2;

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) pdf.addPage();
    drawHeader(pdf, p + 1, totalPages, opts);
    drawFooter(pdf, opts);

    for (let s = 0; s < perPage; s++) {
      const idx = p * perPage + s;
      if (idx >= records.length) break;
      const record = records[idx];

      const col = s % 2;
      const row = Math.floor(s / 2);
      const cellX = MARGIN + col * (cellW + gutter);
      const cellY = contentTop + row * (cellH + gutter);

      // Photo.
      const img = await blobToImageData(record.imageBlob);
      const { x, y, w, h } = fitContain(img.width, img.height, cellX, cellY, cellW, photoCellH);

      // Background so blank space around portrait photos looks intentional.
      pdf.setFillColor(245, 245, 245);
      pdf.rect(cellX, cellY, cellW, photoCellH, "F");
      pdf.addImage(img.dataUrl, "JPEG", x, y, w, h, undefined, "FAST");

      // Caption beneath.
      drawCaption(pdf, record, cellX, cellY + photoCellH + 2, cellW, captionH);

      opts.onProgress?.(idx + 1, records.length);
    }
  }
}

// ─── Header / footer ───────────────────────────────────────────

function drawHeader(
  pdf: import("jspdf").jsPDF,
  page: number,
  totalPages: number,
  opts: PdfOptions
) {
  const title = opts.companyName
    ? `${opts.companyName} · Site Photo Record`
    : "Site Photo Record";

  // Title (left).
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(27, 91, 80); // Ebrora primary
  pdf.text(title, MARGIN, MARGIN + 6);

  // Meta (right): date + page numbers.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const rightText = totalPages > 1 ? `${today} · Page ${page} of ${totalPages}` : today;
  pdf.text(rightText, PAGE_W - MARGIN, MARGIN + 6, { align: "right" });

  // Divider.
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, MARGIN + 10, PAGE_W - MARGIN, MARGIN + 10);
}

function drawFooter(pdf: import("jspdf").jsPDF, opts: PdfOptions) {
  const y = PAGE_H - 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);

  if (PAID_TIERS.has(opts.tier)) {
    // Paid tiers — no Ebrora mark in the footer.
    if (opts.companyName) {
      pdf.text(opts.companyName, MARGIN, y);
    }
  } else {
    pdf.text("Generated with Ebrora · ebrora.com/site-photo-stamp", MARGIN, y);
  }
}

// ─── Metadata table (single-photo layout) ──────────────────────

function drawMetadataTable(
  pdf: import("jspdf").jsPDF,
  record: StampedRecord,
  x: number,
  y: number,
  w: number
) {
  const rows: [string, string][] = [];
  rows.push(["Template", record.meta.templateTitle]);
  rows.push(["Time", formatTimestamp(record.meta.timestamp)]);
  if (record.meta.lat != null && record.meta.lon != null) {
    rows.push(["Location", formatCoordsDecimal(record.meta.lat, record.meta.lon, 6)]);
  }
  if (record.meta.address) rows.push(["Address", record.meta.address]);
  if (record.meta.projectName) rows.push(["Project", record.meta.projectName]);
  if (record.meta.siteName) rows.push(["Site", record.meta.siteName]);
  if (record.meta.contractor) rows.push(["Contractor", record.meta.contractor]);
  if (record.meta.operative) rows.push(["Operative", record.meta.operative]);
  rows.push(["Record ID", record.meta.uniqueId]);

  const rowH = 7;
  const labelW = 35;

  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.2);

  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    const yy = y + i * rowH;

    // Separator
    pdf.line(x, yy + rowH - 0.3, x + w, yy + rowH - 0.3);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(label.toUpperCase(), x + 1, yy + 4.8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 30, 30);
    // Wrap long values (address) to fit.
    const lines = pdf.splitTextToSize(value, w - labelW - 2) as string[];
    const firstLine = lines[0] ?? value;
    pdf.text(firstLine, x + labelW, yy + 4.8);
    if (lines.length > 1) {
      pdf.setFontSize(8.5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(lines.slice(1).join(" ").slice(0, 120), x + labelW, yy + 9);
    }
  }
}

// ─── Caption (grid layout) ─────────────────────────────────────

function drawCaption(
  pdf: import("jspdf").jsPDF,
  record: StampedRecord,
  x: number,
  y: number,
  w: number,
  _h: number
) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(27, 91, 80);
  pdf.text(record.meta.templateTitle, x, y + 4);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(formatTimestamp(record.meta.timestamp), x, y + 9);

  if (record.meta.address) {
    const addr = pdf.splitTextToSize(record.meta.address, w) as string[];
    pdf.text(addr[0], x, y + 13);
  }

  pdf.setFont("courier", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(140, 140, 140);
  pdf.text(record.meta.uniqueId, x + w, y + 17, { align: "right" });
}

// ─── Helpers ───────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

interface ImageData {
  dataUrl: string;
  width: number;
  height: number;
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
  const dataUrl = await blobToDataUrl(blob);
  const dim = await imageDimensions(dataUrl);
  return { dataUrl, width: dim.w, height: dim.h };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("FileReader failed"));
    r.readAsDataURL(blob);
  });
}

function imageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

/** Fit (srcW × srcH) inside (boxX, boxY, boxW, boxH), preserving aspect. */
function fitContain(
  srcW: number,
  srcH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  const boxAr = boxW / boxH;
  const srcAr = srcW / srcH;
  let w: number, h: number;
  if (srcAr > boxAr) {
    w = boxW;
    h = boxW / srcAr;
  } else {
    h = boxH;
    w = boxH * srcAr;
  }
  const x = boxX + (boxW - w) / 2;
  const y = boxY + (boxH - h) / 2;
  return { x, y, w, h };
}

// ─── Filename helper ───────────────────────────────────────────

export function buildPdfFilename(
  records: ReadonlyArray<{ meta: StampMeta }>
): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  if (records.length === 1) {
    const slug = records[0].meta.templateTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${slug}-${dateStr}-${records[0].meta.uniqueId}.pdf`;
  }
  return `site-photos-${dateStr}-${records.length}.pdf`;
}
