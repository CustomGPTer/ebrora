// src/components/site-photo-stamp/BulkScreen.tsx
//
// Bulk photo workflow: add up to 30 photos, apply the same template/variant
// to all, process them in sequence, auto-save to gallery, then offer Export
// PDF + Share PDF + Done.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Template,
  TemplateVariant,
  StampedRecord,
  StampMeta,
  Tier,
  Settings,
} from "@/lib/site-photo-stamp/types";
import { capturePhoto, UnsupportedImageError } from "@/lib/site-photo-stamp/capture";
import { renderStamp } from "@/lib/site-photo-stamp/stamp-renderer";
import {
  saveRecord,
  GalleryFullError,
  QuotaExceededError,
  countRecords,
  MAX_RECORDS,
} from "@/lib/site-photo-stamp/gallery-db";
import { getCurrentLocation } from "@/lib/site-photo-stamp/geolocation";
import { generatePdf, buildPdfFilename } from "@/lib/site-photo-stamp/pdf-export";
import { sharePdf } from "@/lib/site-photo-stamp/share";

const BULK_LIMIT = 30;
const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  template: Template;
  variant: TemplateVariant;
  tier: Tier;
  settings: Settings;
  onClose: () => void;
  onOpenGallery: () => void;
  onToast: (msg: string) => void;
  /** Triggered after records are saved so the parent can refresh gallery count. */
  onBatchSaved: () => void;
}

interface Pending {
  id: string;
  file: File;
  thumbnailUrl: string;
}

interface Progress {
  phase: "preparing" | "processing" | "pdf" | "sharing";
  done: number;
  total: number;
}

export default function BulkScreen({
  template,
  variant,
  tier,
  settings,
  onClose,
  onOpenGallery,
  onToast,
  onBatchSaved,
}: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [results, setResults] = useState<StampedRecord[] | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [galleryCount, setGalleryCount] = useState<number>(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfLinkRef = useRef<HTMLAnchorElement>(null);

  // ── Gallery count (for capacity check) ────────────────────────
  useEffect(() => {
    countRecords().then(setGalleryCount).catch(() => setGalleryCount(0));
  }, []);

  // Revoke pending preview URLs on unmount/clear.
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add photos ────────────────────────────────────────────────

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: Pending[] = [];
      const rejected: string[] = [];
      const incoming = Array.from(files);
      const remaining = BULK_LIMIT - pending.length;
      const toAdd = incoming.slice(0, Math.max(0, remaining));

      for (const file of toAdd) {
        if (file.size > MAX_BYTES) {
          rejected.push(file.name);
          continue;
        }
        if (!/^image\//i.test(file.type)) {
          rejected.push(file.name);
          continue;
        }
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          thumbnailUrl: URL.createObjectURL(file),
        });
      }

      if (newItems.length > 0) {
        setPending((prev) => [...prev, ...newItems]);
      }
      if (rejected.length > 0) {
        onToast(`${rejected.length} photo(s) skipped — too large or unsupported format.`);
      }
      if (incoming.length > toAdd.length) {
        onToast(`Bulk is capped at ${BULK_LIMIT} photos. Extras weren't added.`);
      }
    },
    [pending.length, onToast]
  );

  const onCameraChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Materialise the FileList into a plain File[] before clearing the
      // input. Without this snapshot, `e.target.value = ""` immediately
      // empties the FileList (it's a live collection tied to the input),
      // and `addFiles` would iterate nothing.
      const f = e.target.files;
      const snapshot = f ? Array.from(f) : [];
      e.target.value = "";
      if (snapshot.length) addFiles(snapshot);
    },
    [addFiles]
  );

  const onGalleryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files;
      const snapshot = f ? Array.from(f) : [];
      e.target.value = "";
      if (snapshot.length) addFiles(snapshot);
    },
    [addFiles]
  );

  const removePending = useCallback((id: string) => {
    setPending((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.thumbnailUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    pending.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    setPending([]);
  }, [pending]);

  // ── Process batch ─────────────────────────────────────────────

  const remainingGallerySpace = Math.max(0, MAX_RECORDS - galleryCount);
  const cappedForGallery = pending.length > remainingGallerySpace && remainingGallerySpace > 0;

  const processBatch = useCallback(async () => {
    if (pending.length === 0 || progress) return;

    // Resolve location ONCE up front — used as fallback for photos without
    // EXIF GPS. If the user denies, processing still continues.
    setProgress({ phase: "preparing", done: 0, total: pending.length });
    const live = await getCurrentLocation(8000);
    const fallback = live ? { lat: live.lat, lon: live.lon } : undefined;

    const produced: StampedRecord[] = [];
    let galleryFull = false;
    let quotaFull = false;

    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      setProgress({ phase: "processing", done: i, total: pending.length });
      try {
        const captured = await capturePhoto(p.file, {
          fallbackCoords: fallback,
          skipLiveLocation: true,
        });
        const fullMeta: StampMeta = {
          templateTitle: template.title,
          ...captured.meta,
          projectName: settings.projectName || undefined,
          siteName: settings.siteName || undefined,
          contractor: settings.contractor || undefined,
          operative: settings.operative || undefined,
        };
        const rendered = await renderStamp({
          photoBlob: captured.blob,
          template,
          variant,
          meta: fullMeta,
          settings,
          tier,
        });
        const record: StampedRecord = {
          id: captured.meta.uniqueId,
          templateId: template.id,
          variantId: variant.id,
          imageBlob: rendered.blob,
          thumbnailBlob: rendered.thumbnailBlob,
          meta: fullMeta,
          createdAt: Date.now(),
        };
        URL.revokeObjectURL(captured.previewUrl);

        // Save to gallery (best effort).
        try {
          if (!galleryFull && !quotaFull) await saveRecord(record);
        } catch (err) {
          if (err instanceof GalleryFullError) galleryFull = true;
          else if (err instanceof QuotaExceededError) quotaFull = true;
        }

        produced.push(record);
      } catch (err) {
        const msg =
          err instanceof UnsupportedImageError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Couldn't process one of the photos.";
        onToast(msg);
      }
    }

    setProgress({ phase: "processing", done: pending.length, total: pending.length });
    // Clear the pending list so the user sees the results phase.
    pending.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    setPending([]);
    setResults(produced);
    setProgress(null);
    onBatchSaved();

    if (galleryFull) {
      onToast(`Gallery is full — newest photos weren't auto-saved. You can still export them.`);
    } else if (quotaFull) {
      onToast(`Device storage is full — some photos weren't saved. Export them now.`);
    }
  }, [pending, progress, template, variant, tier, onToast, onBatchSaved]);

  // ── Export PDF ───────────────────────────────────────────────

  const exportPdf = useCallback(async () => {
    if (!results || results.length === 0 || progress) return;
    setProgress({ phase: "pdf", done: 0, total: results.length });
    try {
      const blob = await generatePdf({
        records: results,
        settings,
        tier,
        companyName: settings.companyName || undefined,
        onProgress: (done, total) => setProgress({ phase: "pdf", done, total }),
      });
      setPdfBlob(blob);

      const url = URL.createObjectURL(blob);
      const a = pdfLinkRef.current ?? document.createElement("a");
      a.href = url;
      a.download = buildPdfFilename(results);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setProgress(null);
    }
  }, [results, progress, tier, onToast]);

  const sharePdfBlob = useCallback(async () => {
    if (!results || progress) return;
    setProgress({ phase: "sharing", done: 0, total: 1 });
    try {
      let blob = pdfBlob;
      if (!blob) {
        blob = await generatePdf({
          records: results,
          settings,
          tier,
          companyName: settings.companyName || undefined,
          onProgress: (done, total) => setProgress({ phase: "pdf", done, total }),
        });
        setPdfBlob(blob);
      }
      const outcome = await sharePdf(
        blob,
        buildPdfFilename(results),
        "Site photo records",
        `${results.length} stamped site photo${results.length === 1 ? "" : "s"}.`
      );
      if (outcome === "unsupported") onToast("Sharing isn't supported on this device — use Export PDF instead.");
      else if (outcome === "error") onToast("Couldn't open the share sheet. Try Export PDF instead.");
    } finally {
      setProgress(null);
    }
  }, [results, progress, pdfBlob, tier, onToast]);

  const startOver = useCallback(() => {
    setResults(null);
    setPdfBlob(null);
  }, []);

  // ── Template summary card ─────────────────────────────────────
  const templateSummary = useMemo(
    () => (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
        <div
          className="w-10 h-10 rounded-lg shrink-0 shadow-sm"
          style={{
            backgroundColor: variant.accentColor,
            border: variant.id === "transparent"
              ? "1px dashed rgba(0,0,0,0.2)"
              : "none",
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
            Applying
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {template.title} · {variant.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-medium text-[#1B5B50] hover:underline"
        >
          Change
        </button>
      </div>
    ),
    [template, variant, onClose]
  );

  // ── Results view ─────────────────────────────────────────────
  if (results) {
    return (
      <div className="pb-28">
        <section className="px-4 pt-2 pb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
            aria-label="Done"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Bulk complete
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {results.length} photo{results.length === 1 ? "" : "s"} stamped
            </p>
          </div>
        </section>

        <section className="px-4 pb-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">
                Stamped and saved to your gallery
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                Export as a single PDF, share the batch, or view each photo in your gallery.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 grid grid-cols-3 gap-2">
          {results.slice(0, 9).map((r) => (
            <ResultThumb key={r.id} record={r} />
          ))}
          {results.length > 9 && (
            <div
              className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 cursor-pointer"
              onClick={onOpenGallery}
            >
              +{results.length - 9} more
            </div>
          )}
        </section>

        <section className="px-4 mt-5">
          <button
            type="button"
            onClick={exportPdf}
            className="w-full py-3.5 rounded-xl bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144540] transition-colors active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export as PDF
          </button>

          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={sharePdfBlob}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share PDF
            </button>
            <button
              type="button"
              onClick={onOpenGallery}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
              </svg>
              View gallery
            </button>
          </div>

          <button
            type="button"
            onClick={startOver}
            className="mt-2.5 w-full py-3 rounded-xl bg-transparent border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            Start another batch
          </button>
        </section>

        <a ref={pdfLinkRef} className="hidden" aria-hidden />
        <BatchProgress progress={progress} />
      </div>
    );
  }

  // ── Pending / add phase ──────────────────────────────────────
  return (
    <div className="pb-28">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCameraChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onGalleryChange}
        className="hidden"
        aria-hidden="true"
      />

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
            Bulk mode
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {pending.length} of {BULK_LIMIT} selected
          </p>
        </div>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5"
          >
            Clear
          </button>
        )}
      </section>

      {/* Template summary */}
      <section className="px-4 pb-3">{templateSummary}</section>

      {/* Add photo buttons */}
      <section className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={pending.length >= BULK_LIMIT}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={pending.length >= BULK_LIMIT}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
            Add from gallery
          </button>
        </div>
      </section>

      {/* Capacity warning */}
      {cappedForGallery && (
        <section className="px-4 pb-3">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Gallery has space for only {remainingGallerySpace} more. Extra photos will be stamped
            and available for export, but not all will auto-save to your gallery.
          </div>
        </section>
      )}

      {/* Pending grid */}
      {pending.length > 0 ? (
        <section className="px-4">
          <div className="grid grid-cols-3 gap-2">
            {pending.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                  aria-label="Remove photo"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="px-6 py-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">No photos yet</p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Add up to {BULK_LIMIT} photos from your camera or gallery. They'll all be stamped with
            the same template.
          </p>
        </section>
      )}

      {/* Primary action */}
      {pending.length > 0 && (
        <section className="px-4 mt-5">
          <button
            type="button"
            onClick={processBatch}
            className="w-full py-3.5 rounded-xl bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144540] transition-colors active:scale-[0.98] shadow-sm"
          >
            Stamp {pending.length} photo{pending.length === 1 ? "" : "s"}
          </button>
        </section>
      )}

      <BatchProgress progress={progress} />
    </div>
  );
}

// ─── Result thumb ───────────────────────────────────────────────

function ResultThumb({ record }: { record: StampedRecord }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const u = URL.createObjectURL(record.thumbnailBlob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [record.thumbnailBlob]);
  return (
    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
      {url && <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />}
    </div>
  );
}

// ─── Progress overlay ──────────────────────────────────────────

function BatchProgress({ progress }: { progress: Progress | null }) {
  if (!progress) return null;
  const pct = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  const label =
    progress.phase === "preparing"
      ? "Getting ready…"
      : progress.phase === "processing"
      ? `Stamping ${progress.done} of ${progress.total}…`
      : progress.phase === "pdf"
      ? `Building PDF — ${progress.done} of ${progress.total}…`
      : "Opening share…";
  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
      role="dialog"
      aria-busy="true"
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[#1B5B50] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-[#1B5B50] transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Everything runs on your device.</p>
      </div>
    </div>
  );
}
