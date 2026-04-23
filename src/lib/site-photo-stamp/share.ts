// src/lib/site-photo-stamp/share.ts
//
// Web Share API wrapper with file attachment support, plus mailto fallback
// for browsers that only support text share (or none at all).
//
// Behaviour:
//   • If `navigator.canShare({ files })` is true → share the image blob
//     directly. The native share sheet shows WhatsApp, Mail, Messages,
//     Drive etc. and the image is attached for real.
//   • If Web Share is unavailable but text share is (rare) → share text only.
//   • Otherwise → open a prefilled mailto: draft. Email clients can't
//     receive binary attachments via mailto, so the body explicitly
//     prompts the user to attach the saved photo.

import type { StampedRecord } from "./types";
import { formatCoordsDecimal } from "./geolocation";

export type ShareOutcome = "shared" | "cancelled" | "unsupported" | "error";

interface NavigatorShareFallback {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

// ─── Filename helper (shared with gallery + result screens) ─────

export function buildRecordFilename(record: StampedRecord, ext: "jpg" | "pdf" = "jpg"): string {
  const slug = record.meta.templateTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const d = new Date(record.createdAt);
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${slug}-${dateStr}-${record.meta.uniqueId}.${ext}`;
}

// ─── Build human-readable share text ────────────────────────────

function buildShareText(record: StampedRecord): string {
  const lines: string[] = [];
  lines.push(record.meta.templateTitle);
  lines.push("");
  lines.push(`Time: ${formatTimestamp(record.meta.timestamp)}`);
  if (record.meta.address) lines.push(`Address: ${record.meta.address}`);
  if (record.meta.lat != null && record.meta.lon != null) {
    lines.push(`Coord: ${formatCoordsDecimal(record.meta.lat, record.meta.lon, 6)}`);
  }
  if (record.meta.projectName) lines.push(`Project: ${record.meta.projectName}`);
  if (record.meta.siteName) lines.push(`Site: ${record.meta.siteName}`);
  if (record.meta.contractor) lines.push(`Contractor: ${record.meta.contractor}`);
  if (record.meta.operative) lines.push(`Operative: ${record.meta.operative}`);
  lines.push(`Record ID: ${record.meta.uniqueId}`);
  lines.push("");
  lines.push("— Generated with Ebrora Site Photo Stamp (ebrora.com/site-photo-stamp)");
  return lines.join("\n");
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

// ─── Single photo share ─────────────────────────────────────────

export async function sharePhoto(record: StampedRecord): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "unsupported";
  const nav = navigator as NavigatorShareFallback;
  if (!nav.share) return "unsupported";

  const filename = buildRecordFilename(record, "jpg");
  const file = new File([record.imageBlob], filename, {
    type: record.imageBlob.type || "image/jpeg",
    lastModified: record.createdAt,
  });
  const title = record.meta.templateTitle;
  const text = buildShareText(record);

  const filePayload: ShareData = { title, text, files: [file] };

  // Prefer file-sharing when supported.
  if (nav.canShare && nav.canShare(filePayload)) {
    try {
      await nav.share(filePayload);
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "cancelled";
      return "error";
    }
  }

  // Fall back to text-only share (very rare now; kept for older Androids).
  try {
    await nav.share({ title, text });
    return "shared";
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

// ─── Share a generated PDF ──────────────────────────────────────

export async function sharePdf(
  pdfBlob: Blob,
  filename: string,
  title: string,
  text: string
): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "unsupported";
  const nav = navigator as NavigatorShareFallback;
  if (!nav.share) return "unsupported";

  const file = new File([pdfBlob], filename, { type: "application/pdf" });
  const payload: ShareData = { title, text, files: [file] };

  if (nav.canShare && !nav.canShare(payload)) return "unsupported";

  try {
    await nav.share(payload);
    return "shared";
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "cancelled";
    return "error";
  }
}

// ─── Mailto fallback ────────────────────────────────────────────

export function shareViaMailto(record: StampedRecord): void {
  const subject = `Site photo: ${record.meta.templateTitle} (${record.meta.uniqueId})`;
  const body =
    buildShareText(record) +
    "\n\n(Please attach the saved photo from your device — email doesn't attach it automatically.)";
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (typeof window !== "undefined") {
    window.location.href = href;
  }
}
