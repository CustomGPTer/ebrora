// src/components/site-photo-stamp/GalleryScreen.tsx
//
// Grid view of all saved stamped photos. Loads records from IndexedDB on
// mount, renders thumbnails in a 2-column grid, and supports:
//   • Opening a record (tap thumbnail) — the parent swaps to GalleryItemView.
//   • Deleting all records (with a confirm modal).
//   • Quota banner when approaching / at the 500-record cap.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { StampedRecord } from "@/lib/site-photo-stamp/types";
import { TEMPLATE_MAP } from "@/lib/site-photo-stamp/templates";
import {
  listRecords,
  clearAll,
  estimateUsage,
  MAX_RECORDS,
  WARN_THRESHOLD,
} from "@/lib/site-photo-stamp/gallery-db";

interface Props {
  onClose: () => void;
  onOpen: (record: StampedRecord) => void;
  /** Bumped by the parent after a delete/save to force a reload. */
  refreshToken?: number;
}

// ─── Relative date formatter ────────────────────────────────────

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const d = new Date(ts);
  const thisYear = new Date().getFullYear();
  const sameYear = d.getFullYear() === thisYear;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Card ───────────────────────────────────────────────────────

function Thumbnail({
  record,
  onOpen,
}: {
  record: StampedRecord;
  onOpen: (r: StampedRecord) => void;
}) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const u = URL.createObjectURL(record.thumbnailBlob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [record.thumbnailBlob]);

  const tmpl = TEMPLATE_MAP[record.templateId];
  const accent = tmpl?.baseColor ?? "#1B5B50";

  return (
    <button
      type="button"
      onClick={() => onOpen(record)}
      className="group text-left rounded-xl overflow-hidden bg-white ring-1 ring-gray-200 hover:ring-gray-300 transition-all active:scale-[0.98]"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={record.meta.templateTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-200" />
        )}
        <span
          className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          {tmpl?.title ?? record.meta.templateTitle}
        </span>
      </div>
      <div className="px-2.5 py-2 border-t border-gray-100">
        <p className="text-[11px] text-gray-500">{relativeDate(record.createdAt)}</p>
        <p className="text-[10px] font-mono text-gray-400 truncate">{record.meta.uniqueId}</p>
      </div>
    </button>
  );
}

// ─── Confirm modal ──────────────────────────────────────────────

function ConfirmDeleteAll({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-safe">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 animate-in slide-in-from-bottom duration-200">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete all records?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          This permanently removes all {count} stamped photos from this device. This can't be undone.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Delete all
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function GalleryScreen({ onClose, onOpen, refreshToken }: Props) {
  const [records, setRecords] = useState<StampedRecord[] | null>(null);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      const [rows, est] = await Promise.all([listRecords(), estimateUsage()]);
      setRecords(rows);
      setUsage(est);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load gallery");
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, refreshToken]);

  const count = records?.length ?? 0;
  const showQuotaBanner = count >= WARN_THRESHOLD;
  const atCap = count >= MAX_RECORDS;

  const onClearAll = async () => {
    setConfirmClear(false);
    try {
      await clearAll();
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't clear gallery");
    }
  };

  return (
    <div className="pb-28 min-h-[60vh]">
      {/* Top bar */}
      <section className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Gallery
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {records == null
              ? "Loading…"
              : count === 0
              ? "No saved photos"
              : `${count} of ${MAX_RECORDS}${usage?.usage ? ` · ${formatBytes(usage.usage)}` : ""}`}
          </p>
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5"
          >
            Clear all
          </button>
        )}
      </section>

      {/* Quota banner */}
      {showQuotaBanner && (
        <section className="px-4 pb-3">
          <div
            className={`rounded-xl px-3 py-2.5 border flex items-start gap-2 ${
              atCap
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs leading-relaxed">
              {atCap
                ? `Gallery is full (${MAX_RECORDS} records). Delete older photos to save new ones.`
                : `You've got ${count} of ${MAX_RECORDS} records. Consider clearing older photos soon.`}
            </p>
          </div>
        </section>
      )}

      {/* Body */}
      {error ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="text-sm font-medium text-[#1B5B50] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : records == null ? (
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No photos yet</h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            Stamped photos are saved here automatically. Take a photo to get started.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B5B50] hover:underline"
          >
            Take a photo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {records.map((r) => (
            <Thumbnail key={r.id} record={r} onOpen={onOpen} />
          ))}
        </div>
      )}

      {/* Footer hint */}
      {records && count > 0 && (
        <p className="mt-6 px-6 text-[11px] text-gray-400 text-center leading-relaxed">
          Gallery data lives on this device only. Clearing your browser data or uninstalling the
          home-screen app will remove everything saved here.
        </p>
      )}

      {confirmClear && (
        <ConfirmDeleteAll
          count={count}
          onCancel={() => setConfirmClear(false)}
          onConfirm={onClearAll}
        />
      )}
    </div>
  );
}
