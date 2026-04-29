// src/components/site-photo-stamp/BulkScreen.tsx
//
// Bulk photo workflow: add up to 30 photos, apply the same template/variant
// to all, process them in sequence, auto-save to gallery, then offer Export
// PDF + Share PDF + Done.
//
// Notes (Batch 8):
//   • A global note text field applies to every photo with no override.
//   • Each pending photo has a small ✎ pencil affordance that opens a
//     bottom-sheet editor for a per-photo override. Overrides win over the
//     global note. Clearing an override falls back to the global note.
//   • Thumbnails with an override show a tiny text preview strip so they're
//     scannable in a long list.
//   • The whole session (photos, global note, per-photo overrides,
//     template + variant) persists to IndexedDB for 2 hours since the last
//     edit, so a browser refresh / accidental navigation / phone lock
//     doesn't wipe a partially-prepared batch. Writes are immediate for
//     photo add/remove (expensive to re-do) and debounced 600ms for text
//     edits (cheap to retype; no point hammering IDB on every keystroke).
//   • Mid-batch progress is persisted too: after each successful stamp,
//     the photo is removed from the saved session. A refresh in the middle
//     of stamping restores only the unstamped photos with their notes.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Template,
  TemplateVariant,
  StampedRecord,
  StampMeta,
  Tier,
  Settings,
  TemplateId,
  VariantId,
} from "@/lib/site-photo-stamp/types";
import { capturePhoto, UnsupportedImageError } from "@/lib/site-photo-stamp/capture";
import { renderStamp } from "@/lib/site-photo-stamp/stamp-renderer";
import { injectExif } from "@/lib/site-photo-stamp/exif-write";
import {
  saveRecord,
  getRecord,
  GalleryFullError,
  QuotaExceededError,
  countRecords,
  MAX_RECORDS,
  saveBulkSession,
  loadBulkSession,
  clearBulkSession,
  type BulkSession,
} from "@/lib/site-photo-stamp/gallery-db";
import { getCurrentLocation } from "@/lib/site-photo-stamp/geolocation";
import { generatePdf, buildPdfFilename } from "@/lib/site-photo-stamp/pdf-export";
import { sharePdf } from "@/lib/site-photo-stamp/share";

const BULK_LIMIT = 30;
const MAX_BYTES = 15 * 1024 * 1024;
/** Character ceiling for notes — must match CapturedPreview's NOTE_MAX. */
const NOTE_MAX = 200;
/** Text edits hit IDB at most once per this interval. */
const DEBOUNCE_MS = 600;

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
  /** Per-photo note override. If undefined, falls back to the global note. */
  note?: string;
}

interface Progress {
  phase: "preparing" | "processing" | "pdf" | "sharing";
  done: number;
  total: number;
}

/**
 * Lightweight in-memory record held for the whole batch's results phase.
 * The full-size JPEG (`imageBlob`) is the biggest memory hog — at 2048 px
 * long edge it's ~500 KB–1.2 MB per photo, and a 30-photo batch pinning
 * all of them resident simultaneously has tipped low-RAM mobile devices
 * over into "low memory" errors. So we keep only the tiny thumbnailBlob
 * plus metadata here, and rehydrate the full blobs from IndexedDB on
 * demand for PDF export / share.
 *
 * `imageBlob` is kept in-memory ONLY for records that could NOT be
 * persisted (gallery full, or device storage quota full) — otherwise it's
 * null and we'll re-fetch via getRecord(id) at export time.
 */
interface LiteResult {
  id: string;
  templateId: TemplateId;
  variantId: VariantId;
  thumbnailBlob: Blob;
  meta: StampMeta;
  createdAt: number;
  /** Full JPEG retained in-memory ONLY for records that didn't make it to
   *  IndexedDB. Null for records that are safely persisted. */
  imageBlob: Blob | null;
}

/**
 * Rehydrates an array of lite results into full StampedRecord[] for the
 * PDF/share pipelines, which need `imageBlob` populated. Records with an
 * in-memory imageBlob (save failed during the batch) are used directly;
 * records with a null imageBlob are re-fetched from IndexedDB.
 *
 * Throws a friendly error if a record can't be found — this should only
 * happen if the user manually deleted it from the gallery between finishing
 * the batch and clicking Export.
 */
async function rehydrateResults(lite: LiteResult[]): Promise<StampedRecord[]> {
  const full: StampedRecord[] = [];
  for (const r of lite) {
    if (r.imageBlob) {
      full.push({
        id: r.id,
        templateId: r.templateId,
        variantId: r.variantId,
        imageBlob: r.imageBlob,
        thumbnailBlob: r.thumbnailBlob,
        meta: r.meta,
        createdAt: r.createdAt,
      });
      continue;
    }
    const fromIdb = await getRecord(r.id);
    if (!fromIdb) {
      throw new Error(
        "One of the photos in this batch is no longer in your gallery — it may have been deleted. Please re-stamp before exporting."
      );
    }
    full.push(fromIdb);
  }
  return full;
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
  const [results, setResults] = useState<LiteResult[] | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [galleryCount, setGalleryCount] = useState<number>(0);

  // Notes (Batch 8)
  const [globalNote, setGlobalNote] = useState<string>("");
  /** ID of the pending photo whose note editor is currently open, else null. */
  const [editorTargetId, setEditorTargetId] = useState<string | null>(null);
  /** Once the IDB restore attempt completes (success or failure), this flips
   *  true so the persistence effect can start saving without clobbering an
   *  in-flight restore. */
  const [restoreAttempted, setRestoreAttempted] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfLinkRef = useRef<HTMLAnchorElement>(null);

  // Latest props for use inside the persistence effect — the effect
  // fires on state changes; capturing props via ref keeps it from
  // saving whenever the parent re-renders with a new template object
  // identity.
  const templateIdRef = useRef<TemplateId>(template.id);
  const variantIdRef = useRef<VariantId>(variant.id);
  templateIdRef.current = template.id;
  variantIdRef.current = variant.id;

  // One-shot flag: set immediately after a successful restore, consumed
  // by the next persistence run. Prevents the restore's state update
  // from triggering a wasteful re-save and — more importantly — stops
  // it from bumping lastEditAt, which would artificially extend the
  // 2-hour TTL every time the user reopens the app.
  const skipNextPersistRef = useRef(false);

  // ── Gallery count (for capacity check) ────────────────────────
  useEffect(() => {
    countRecords().then(setGalleryCount).catch(() => setGalleryCount(0));
  }, []);

  // ── Scroll to top when BulkScreen opens ──────────────────────
  //
  // The parent keeps the user's scroll position when it swaps views,
  // so without this the user lands on the bulk screen still scrolled
  // wherever they were on the template picker. Use `auto` (instant)
  // rather than `smooth` so there's no visible jump animation during
  // the view transition — the content just starts at the top.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  // Revoke pending preview URLs on unmount/clear.
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restore bulk session from IDB (one-shot on mount) ─────────
  //
  // Runs exactly once. If the session is within the 2-hour TTL, we
  // rehydrate photos, notes, and template selection. Per the UX
  // decisions: toast the user so they know what happened; silently
  // skip if no session or it's expired.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await loadBulkSession();
        if (cancelled) return;
        if (!session || session.photos.length === 0) {
          setRestoreAttempted(true);
          return;
        }

        // Convert persisted Blobs back into browser File objects +
        // fresh object URLs. We key each on its original pending id
        // so per-photo note overrides remain valid.
        const restored: Pending[] = session.photos.map((p) => ({
          id: p.id,
          file: new File([p.blob], p.name, { type: p.blob.type || "image/jpeg" }),
          thumbnailUrl: URL.createObjectURL(p.blob),
          note: p.note && p.note.length > 0 ? p.note : undefined,
        }));

        setPending(restored);
        setGlobalNote(session.globalNote ?? "");
        // Skip the single persist-effect run triggered by this state
        // update, otherwise we'd immediately re-save and bump lastEditAt.
        skipNextPersistRef.current = true;
        const overrideCount = restored.filter((p) => p.note).length;
        const plural = restored.length === 1 ? "" : "s";
        onToast(
          overrideCount > 0
            ? `Bulk session restored — ${restored.length} photo${plural}, ${overrideCount} custom note${overrideCount === 1 ? "" : "s"}.`
            : `Bulk session restored — ${restored.length} photo${plural}.`
        );
      } catch {
        // Silent — the user just sees an empty bulk screen, no harm done.
      } finally {
        if (!cancelled) setRestoreAttempted(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Mount-only. Intentionally excludes onToast from deps — see comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist bulk session to IDB ───────────────────────────────
  //
  // Writes the current (pending, globalNote, template, variant) state to
  // IDB whenever the user edits anything meaningful. Text changes are
  // debounced by DEBOUNCE_MS so rapid typing doesn't spam IDB; photo
  // add/remove reaches IDB immediately via its own handlers below.
  //
  // Guarded by restoreAttempted so we don't overwrite a pending restore
  // with the empty initial state.
  useEffect(() => {
    if (!restoreAttempted) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    // If nothing to persist and no session to clear, do nothing. We only
    // want the effect to actively clear when pending was non-empty and
    // has just become empty (explicit clear or last photo removed).
    const handle = setTimeout(async () => {
      if (pending.length === 0 && globalNote.length === 0) {
        await clearBulkSession();
        return;
      }
      const session: BulkSession = {
        id: "current",
        photos: pending.map((p) => ({
          id: p.id,
          blob: p.file,
          name: p.file.name,
          note: p.note,
        })),
        globalNote,
        templateId: templateIdRef.current,
        variantId: variantIdRef.current,
        lastEditAt: Date.now(),
      };
      const ok = await saveBulkSession(session);
      if (!ok) {
        // Storage full. Try metadata-only salvage so at least the notes
        // and template selection survive a refresh — photos will be
        // lost, but the user's typing isn't wasted.
        await saveBulkSession({
          ...session,
          photos: [],
        });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [restoreAttempted, pending, globalNote]);

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

  // Set or clear the per-photo note override. Passing empty string clears
  // the override (photo falls back to the global note at stamp time).
  const setPendingNote = useCallback((id: string, note: string) => {
    setPending((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, note: note.trim().length > 0 ? note.slice(0, NOTE_MAX) : undefined }
          : p
      )
    );
  }, []);

  const editorTarget = useMemo(
    () => (editorTargetId ? pending.find((p) => p.id === editorTargetId) ?? null : null),
    [editorTargetId, pending]
  );

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

    const produced: LiteResult[] = [];
    let galleryFull = false;
    let quotaFull = false;
    // Note text that wins per photo: override if set, else the trimmed
    // global note if non-empty, else undefined (no note on stamp).
    const trimmedGlobal = globalNote.trim();

    // Mutable list of unprocessed photo ids. After each successful stamp
    // we drop the id and rewrite the bulk session so a refresh mid-batch
    // restores only the remaining photos.
    const remainingIds = new Set(pending.map((p) => p.id));

    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      setProgress({ phase: "processing", done: i, total: pending.length });
      try {
        const captured = await capturePhoto(p.file, {
          fallbackCoords: fallback,
          skipLiveLocation: true,
        });
        const effectiveNote =
          (p.note && p.note.trim().length > 0
            ? p.note.trim()
            : trimmedGlobal.length > 0
            ? trimmedGlobal
            : undefined) ?? undefined;
        const fullMeta: StampMeta = {
          templateTitle: template.title,
          ...captured.meta,
          projectName: settings.projectName || undefined,
          siteName: settings.siteName || undefined,
          contractor: settings.contractor || undefined,
          operative: settings.operative || undefined,
          note: effectiveNote,
        };
        const rendered = await renderStamp({
          photoBlob: captured.blob,
          template,
          variant,
          meta: fullMeta,
          settings,
          tier,
        });

        // Embed EXIF metadata into the stamped JPEG when the user has
        // it enabled (default on). Same fallback as the single-capture
        // path — a writer failure must never block the bulk run.
        let finalImageBlob: Blob = rendered.blob;
        if (settings.embedExif) {
          try {
            finalImageBlob = await injectExif(rendered.blob, {
              timestamp: fullMeta.timestamp,
              lat: fullMeta.lat,
              lon: fullMeta.lon,
            });
          } catch {
            finalImageBlob = rendered.blob;
          }
        }

        const record: StampedRecord = {
          id: captured.meta.uniqueId,
          templateId: template.id,
          variantId: variant.id,
          imageBlob: finalImageBlob,
          thumbnailBlob: rendered.thumbnailBlob,
          meta: fullMeta,
          createdAt: Date.now(),
        };
        URL.revokeObjectURL(captured.previewUrl);

        // Save to gallery (best effort). Track whether THIS record made
        // it to IndexedDB — if not, we need to keep its full imageBlob
        // in memory so the user can still export/share it.
        let persisted = false;
        try {
          if (!galleryFull && !quotaFull) {
            await saveRecord(record);
            persisted = true;
          }
        } catch (err) {
          if (err instanceof GalleryFullError) galleryFull = true;
          else if (err instanceof QuotaExceededError) quotaFull = true;
        }

        // Push only a lite record. If the record is safely in IDB we drop
        // the full imageBlob from memory immediately (it gets rehydrated
        // on demand during PDF export). If saving failed, keep the blob
        // so the user can still share/export before leaving the screen.
        produced.push({
          id: record.id,
          templateId: record.templateId,
          variantId: record.variantId,
          thumbnailBlob: record.thumbnailBlob,
          meta: record.meta,
          createdAt: record.createdAt,
          imageBlob: persisted ? null : record.imageBlob,
        });

        // Drop this photo from the persisted session. If the user
        // refreshes mid-batch, only unstamped photos restore.
        remainingIds.delete(p.id);
        if (remainingIds.size > 0) {
          const stillPending = pending.filter((pp) => remainingIds.has(pp.id));
          void saveBulkSession({
            id: "current",
            photos: stillPending.map((pp) => ({
              id: pp.id,
              blob: pp.file,
              name: pp.file.name,
              note: pp.note,
            })),
            globalNote,
            templateId: template.id,
            variantId: variant.id,
            lastEditAt: Date.now(),
          });
        }
      } catch (err) {
        const msg =
          err instanceof UnsupportedImageError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Couldn't process one of the photos.";
        onToast(msg);
      }

      // Yield to the event loop between photos. Gives the browser a
      // chance to run GC (dropping the just-used canvas + decoded
      // bitmap), repaint the progress UI, and service any pending
      // tasks — critical on low-RAM mobile devices where a tight serial
      // loop otherwise accumulates pressure until a canvas alloc fails.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setProgress({ phase: "processing", done: pending.length, total: pending.length });
    // Clear the pending list so the user sees the results phase.
    pending.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    setPending([]);
    setResults(produced);
    setProgress(null);
    onBatchSaved();

    // Once we reach the results phase the session is fully consumed —
    // drop it regardless of whether every photo succeeded.
    void clearBulkSession();

    if (galleryFull) {
      onToast(`Gallery is full — newest photos weren't auto-saved. You can still export them.`);
    } else if (quotaFull) {
      onToast(`Device storage is full — some photos weren't saved. Export them now.`);
    }
  }, [pending, progress, template, variant, tier, settings, onToast, onBatchSaved, globalNote]);

  // ── Export PDF ───────────────────────────────────────────────

  const exportPdf = useCallback(async () => {
    if (!results || results.length === 0 || progress) return;
    setProgress({ phase: "pdf", done: 0, total: results.length });
    try {
      // Fetch full-size JPEG blobs from IndexedDB for records that were
      // persisted. Lite records keep their in-memory blob (they're the
      // ones that couldn't be saved, so they'd be lost without this copy).
      const fullRecords = await rehydrateResults(results);
      const blob = await generatePdf({
        records: fullRecords,
        settings,
        tier,
        companyName: settings.companyName || undefined,
        onProgress: (done, total) => setProgress({ phase: "pdf", done, total }),
      });
      setPdfBlob(blob);

      const url = URL.createObjectURL(blob);
      const a = pdfLinkRef.current ?? document.createElement("a");
      a.href = url;
      a.download = buildPdfFilename(fullRecords);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setProgress(null);
    }
  }, [results, progress, tier, settings, onToast]);

  const sharePdfBlob = useCallback(async () => {
    if (!results || progress) return;
    setProgress({ phase: "sharing", done: 0, total: 1 });
    try {
      let blob = pdfBlob;
      let filename: string;
      if (!blob) {
        const fullRecords = await rehydrateResults(results);
        blob = await generatePdf({
          records: fullRecords,
          settings,
          tier,
          companyName: settings.companyName || undefined,
          onProgress: (done, total) => setProgress({ phase: "pdf", done, total }),
        });
        setPdfBlob(blob);
        filename = buildPdfFilename(fullRecords);
      } else {
        // Previously cached blob — we just need a filename; buildPdfFilename
        // only reads record.meta, which lite results already carry.
        filename = buildPdfFilename(results);
      }
      const outcome = await sharePdf(
        blob,
        filename,
        "Site photo records",
        `${results.length} stamped site photo${results.length === 1 ? "" : "s"}.`
      );
      if (outcome === "unsupported") onToast("Sharing isn't supported on this device — use Export PDF instead.");
      else if (outcome === "error") onToast("Couldn't open the share sheet. Try Export PDF instead.");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Couldn't share this batch.");
    } finally {
      setProgress(null);
    }
  }, [results, progress, pdfBlob, tier, settings, onToast]);

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

      {/* Global note — applies to every photo without a per-photo override */}
      <section className="px-4 pb-4">
        <div className="rounded-xl bg-white border border-gray-200 p-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <label
              htmlFor="bulk-global-note"
              className="text-[11px] font-semibold uppercase tracking-widest text-gray-500"
            >
              Note for all photos{" "}
              <span className="normal-case tracking-normal font-normal text-gray-400">(optional)</span>
            </label>
            <span
              className={`text-[10px] ${
                globalNote.length > NOTE_MAX - 20 ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {globalNote.length} / {NOTE_MAX}
            </span>
          </div>
          <textarea
            id="bulk-global-note"
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value.slice(0, NOTE_MAX))}
            maxLength={NOTE_MAX}
            rows={2}
            placeholder={
              pending.length === 0
                ? "e.g. Gate left open — contractor access road"
                : "e.g. Progress update at Chamber 3"
            }
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent border-0 p-0 resize-none focus:outline-none focus:ring-0"
          />
          {pending.some((p) => p.note) && (
            <p className="text-[10.5px] text-gray-400 mt-1.5 leading-snug">
              Tap any photo thumbnail below for a one-off note that overrides this.
              Photos with their own note show a blue strip.
            </p>
          )}
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
            {pending.map((p) => {
              const hasOverride = !!p.note;
              return (
                <div
                  key={p.id}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ${
                    hasOverride ? "ring-blue-300" : "ring-gray-200"
                  }`}
                >
                  <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />

                  {/* Remove × — top-right */}
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

                  {/* Note pencil — top-left, filled when a custom note is set */}
                  <button
                    type="button"
                    onClick={() => setEditorTargetId(p.id)}
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition ${
                      hasOverride
                        ? "bg-blue-500 text-white shadow"
                        : "bg-black/50 text-white/90 hover:bg-black/70"
                    }`}
                    aria-label={hasOverride ? "Edit custom note" : "Add custom note"}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>

                  {/* Note preview strip — bottom overlay, only when override set */}
                  {hasOverride && (
                    <div
                      className="absolute left-0 right-0 bottom-0 bg-blue-600/90 text-white text-[9.5px] leading-tight px-1.5 py-1 truncate"
                      title={p.note}
                    >
                      {p.note}
                    </div>
                  )}
                </div>
              );
            })}
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

      {editorTarget && (
        <NoteEditor
          key={editorTarget.id}
          thumbnailUrl={editorTarget.thumbnailUrl}
          initial={editorTarget.note ?? ""}
          globalNote={globalNote.trim()}
          onSave={(text) => {
            setPendingNote(editorTarget.id, text);
            setEditorTargetId(null);
          }}
          onClear={() => {
            setPendingNote(editorTarget.id, "");
            setEditorTargetId(null);
          }}
          onCancel={() => setEditorTargetId(null)}
        />
      )}

      <BatchProgress progress={progress} />
    </div>
  );
}

// ─── Result thumb ───────────────────────────────────────────────

function ResultThumb({ record }: { record: LiteResult }) {
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

// ─── Per-photo note editor (bottom sheet) ──────────────────────
//
// Opened by tapping the pencil icon on any pending thumbnail. Shows the
// photo, an editable text field seeded with the current override (or
// empty), a short hint about the global note that would otherwise apply,
// and three actions:
//   • Save  — write the typed text as the per-photo override.
//   • Clear — delete the override; the photo falls back to the global note.
//   • Cancel — bail without changes.
//
// The Clear action is only offered when an override is already set, since
// "clear" is otherwise indistinguishable from "cancel".

interface NoteEditorProps {
  thumbnailUrl: string;
  initial: string;
  globalNote: string;
  onSave: (text: string) => void;
  onClear: () => void;
  onCancel: () => void;
}

function NoteEditor({
  thumbnailUrl,
  initial,
  globalNote,
  onSave,
  onClear,
  onCancel,
}: NoteEditorProps) {
  const [text, setText] = useState(initial);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const hadOverride = initial.length > 0;
  const trimmed = text.trim();

  return (
    <div
      className="fixed inset-0 z-[115] flex items-end"
      role="dialog"
      aria-modal="true"
      aria-label="Edit note for this photo"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={onCancel}
        aria-label="Close"
      />

      <div className="relative z-10 w-full bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-200">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 leading-tight">
              Note for this photo
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {globalNote
                ? <>Overrides the shared note <span className="text-gray-700">"{globalNote}"</span>.</>
                : "Just this photo — no shared note is set."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 flex-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <label
              htmlFor="note-editor-input"
              className="text-[11px] font-semibold uppercase tracking-widest text-gray-500"
            >
              Custom note
            </label>
            <span
              className={`text-[10px] ${
                text.length > NOTE_MAX - 20 ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {text.length} / {NOTE_MAX}
            </span>
          </div>
          <textarea
            id="note-editor-input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, NOTE_MAX))}
            maxLength={NOTE_MAX}
            rows={3}
            autoFocus
            placeholder="Describe what's in this photo…"
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#1B5B50] focus:border-[#1B5B50]"
          />
        </div>

        <div className="px-4 pt-2 pb-5 border-t border-gray-100 flex gap-2">
          {hadOverride && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 active:scale-[0.98] transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(trimmed)}
            disabled={trimmed === initial.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144540] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hadOverride ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
