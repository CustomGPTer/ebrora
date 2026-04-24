// src/components/site-photo-stamp/SitePhotoStampClient.tsx
//
// Top-level client for /site-photo-stamp.
//
// Batch 6 additions (final batch):
//   • Settings screen wired through.
//   • `useSettings()` hook persists to localStorage.
//   • settings threaded into renderStamp(), generatePdf(), and initial
//     selected template/variant on the landing screen.
//   • Default template + variant now reflect user preferences.
//
// All six batches are now live. No stubs remain.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { TEMPLATES, getTemplate } from "@/lib/site-photo-stamp/templates";
import type {
  TemplateId,
  VariantId,
  Template,
  TemplateVariant,
  StampedRecord,
  StampMeta,
  Tier,
} from "@/lib/site-photo-stamp/types";
import {
  capturePhoto,
  UnsupportedImageError,
  type CapturedPhoto,
  type CaptureStage,
} from "@/lib/site-photo-stamp/capture";
import { renderStamp } from "@/lib/site-photo-stamp/stamp-renderer";
import {
  saveRecord,
  countRecords,
  GalleryFullError,
  QuotaExceededError,
} from "@/lib/site-photo-stamp/gallery-db";
import { useSettings } from "@/lib/site-photo-stamp/use-settings";
import {
  resolveSticky,
  isLockActive,
  markUsed,
  engageLock,
  releaseLock,
} from "@/lib/site-photo-stamp/sticky-selection";
import { usePaidToolAccess } from "@/hooks/usePaidToolAccess";
import TemplateGrid from "./TemplateGrid";
import LockControl from "./LockControl";

const DesktopBlockScreen = dynamic(() => import("./DesktopBlockScreen"), { ssr: false });
const InstallPrompt = dynamic(() => import("./InstallPrompt"), { ssr: false });
const CaptureProgress = dynamic(() => import("./CaptureProgress"), { ssr: false });
const CapturedPreview = dynamic(() => import("./CapturedPreview"), { ssr: false });
const ResultScreen = dynamic(() => import("./ResultScreen"), { ssr: false });
const GalleryScreen = dynamic(() => import("./GalleryScreen"), { ssr: false });
const GalleryItemView = dynamic(() => import("./GalleryItemView"), { ssr: false });
const BulkScreen = dynamic(() => import("./BulkScreen"), { ssr: false });
const SettingsScreen = dynamic(() => import("./SettingsScreen"), { ssr: false });

// ─── Mobile detection ───────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const w = window.innerWidth;
      const ua = window.navigator.userAgent;
      const uaMobile = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      setIsMobile(w <= 900 || uaMobile || !!standalone);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Toast ──────────────────────────────────────────────────────

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 3200);
    return () => clearTimeout(t);
  }, [onHide]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-24 z-[95] flex justify-center px-4 pointer-events-none"
    >
      <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom duration-200 pointer-events-auto max-w-[90%] text-center">
        {message}
      </div>
    </div>
  );
}

// ─── View state ─────────────────────────────────────────────────

type View =
  | { kind: "landing" }
  | { kind: "captured"; captured: CapturedPhoto }
  | { kind: "result"; stamped: StampedRecord }
  | { kind: "gallery" }
  | { kind: "gallery-item"; record: StampedRecord }
  | { kind: "bulk" }
  | { kind: "settings" };

const MAX_BYTES = 25 * 1024 * 1024;

export default function SitePhotoStampClient() {
  const isMobile = useIsMobile();
  const paid = usePaidToolAccess();
  const tier = (paid.tier ?? "FREE") as Tier;

  const { settings, update: updateSettings, reset: resetSettings, loaded: settingsLoaded } =
    useSettings();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("construction-record");
  const [selectedVariant, setSelectedVariant] = useState<VariantId>("solid");
  const [initialisedFromSettings, setInitialisedFromSettings] = useState(false);

  const [toast, setToast] = useState<string>("");
  const [stage, setStage] = useState<CaptureStage | null>(null);
  const [rendering, setRendering] = useState(false);
  const [view, setView] = useState<View>({ kind: "landing" });
  const [galleryCount, setGalleryCount] = useState<number>(0);
  const [galleryRefresh, setGalleryRefresh] = useState<number>(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Once settings load from localStorage, resolve the sticky selection —
  // priority: active lock → last-used within 30 min → default. We only do
  // this once per session so subsequent settings changes (e.g. the user
  // editing their default in Settings) don't overwrite mid-session picks.
  //
  // We also garbage-collect expired lock fields here: if lockedAt is past
  // the 6h window but lockedTemplate / lockedVariant are still in storage,
  // we clear them. Without this step stale IDs accumulate in localStorage
  // and various downstream components would (incorrectly) read them as
  // indicating a live lock.
  useEffect(() => {
    if (settingsLoaded && !initialisedFromSettings) {
      const sticky = resolveSticky(settings);
      const tmpl = getTemplate(sticky.templateId);
      const variantId = tmpl.variants.find((v) => v.id === sticky.variantId)
        ? sticky.variantId
        : tmpl.variants[0].id;
      setSelectedTemplate(tmpl.id);
      setSelectedVariant(variantId);
      setInitialisedFromSettings(true);

      // Expired-lock cleanup. Uses the same predicate as isLockActive so
      // the two can never disagree about what "expired" means.
      const hasLockRemnants =
        settings.lockedTemplate !== undefined ||
        settings.lockedVariant !== undefined ||
        settings.lockedAt !== undefined;
      if (hasLockRemnants && !isLockActive(settings)) {
        updateSettings(releaseLock());
      }
    }
  }, [settingsLoaded, initialisedFromSettings, settings, updateSettings]);

  const resolvedTemplate: Template = useMemo(
    () => getTemplate(selectedTemplate),
    [selectedTemplate]
  );
  const resolvedVariant: TemplateVariant = useMemo(
    () =>
      resolvedTemplate.variants.find((v) => v.id === selectedVariant) ??
      resolvedTemplate.variants[0],
    [resolvedTemplate, selectedVariant]
  );

  // ── Lock state / recently-used ──────────────────────────────

  const lockLive = isLockActive(settings);
  const lockOnCurrent =
    lockLive &&
    settings.lockedTemplate === resolvedTemplate.id &&
    settings.lockedVariant === resolvedVariant.id;

  // Gated copies — only expose the stored lock IDs to the UI if the 6h
  // window is still live. Without this gate, expired locks leave
  // lockedTemplate / lockedVariant in localStorage and downstream
  // components (TemplateGrid, TemplatePreviewCard) flag them as "locked"
  // purely by ID match, ignoring the expiry clock entirely.
  const liveLockedTemplate = lockLive ? settings.lockedTemplate : undefined;
  const liveLockedVariant = lockLive ? settings.lockedVariant : undefined;

  // Template + variant objects for the currently-locked pair (or last-used
  // if no lock is live). Used to populate the Recently Used row.
  const recentlyUsed = useMemo<{ template: Template; variant: TemplateVariant } | null>(() => {
    // Only prefer the locked pair if the 6h window is still live; otherwise
    // fall back to last-used. Without this gate an expired lock lingering
    // in storage would keep showing as "Recently used" forever.
    const t = (lockLive ? settings.lockedTemplate : undefined) ?? settings.lastUsedTemplate;
    const v = (lockLive ? settings.lockedVariant : undefined) ?? settings.lastUsedVariant;
    if (!t || !v) return null;
    // Only surface if it's actually different from what's selected right now,
    // so the Recently Used row isn't the same thing the user is already on.
    if (t === resolvedTemplate.id && v === resolvedVariant.id) return null;
    const tmpl = getTemplate(t);
    const vt = tmpl.variants.find((x) => x.id === v);
    if (!vt) return null;
    return { template: tmpl, variant: vt };
  }, [settings, lockLive, resolvedTemplate, resolvedVariant]);

  // ── Pick / lock handlers ────────────────────────────────────

  const pickTemplate = useCallback(
    (templateId: TemplateId, variantId: VariantId) => {
      setSelectedTemplate(templateId);
      setSelectedVariant(variantId);
      // Always refresh soft memory on an explicit pick.
      const patch: Partial<typeof settings> = { ...markUsed(templateId, variantId) };
      // If a lock is currently engaged, let it follow the new selection —
      // the lock is a "sticky mode", not a specific-template binding. This
      // also refreshes the 6h lockedAt stamp.
      if (isLockActive(settings)) {
        Object.assign(patch, engageLock(templateId, variantId));
      }
      updateSettings(patch);
    },
    [settings, updateSettings]
  );

  const toggleLock = useCallback(
    (templateId: TemplateId, variantId: VariantId) => {
      const locked =
        isLockActive(settings) &&
        settings.lockedTemplate === templateId &&
        settings.lockedVariant === variantId;
      if (locked) {
        updateSettings(releaseLock());
        setToast("Lock released.");
      } else {
        // Tapping a card's lock icon also selects that card — the user's
        // intent is "use this and keep using it".
        setSelectedTemplate(templateId);
        setSelectedVariant(variantId);
        updateSettings(engageLock(templateId, variantId));
        setToast("Template locked for 6 hours.");
      }
    },
    [settings, updateSettings]
  );

  // ── Gallery count ────────────────────────────────────────────

  const refreshCount = useCallback(async () => {
    try {
      const c = await countRecords();
      setGalleryCount(c);
    } catch {
      setGalleryCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount, galleryRefresh]);

  // ── Capture ──────────────────────────────────────────────────

  const runCapture = useCallback(async (file: File) => {
    if (file.size > MAX_BYTES) {
      setToast(
        `Photo is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please use an image under 25 MB.`
      );
      return;
    }
    setStage("reading");
    try {
      const result = await capturePhoto(file, { onProgress: (s) => setStage(s) });
      setView({ kind: "captured", captured: result });
    } catch (err) {
      if (err instanceof UnsupportedImageError) setToast(err.message);
      else if (err instanceof Error) setToast(err.message);
      else setToast("Something went wrong processing that photo. Try another image.");
    } finally {
      setStage(null);
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) runCapture(file);
    },
    [runCapture]
  );

  const discardCaptured = useCallback(() => {
    if (view.kind === "captured") URL.revokeObjectURL(view.captured.previewUrl);
    setView({ kind: "landing" });
  }, [view]);

  // ── Apply stamp ──────────────────────────────────────────────

  const applyStamp = useCallback(async (note?: string) => {
    if (view.kind !== "captured" || rendering) return;
    const captured = view.captured;

    setRendering(true);
    try {
      // Merge user-details settings into the stamp metadata so Project / Site
      // / Contractor / Operative appear on the stamp when configured.
      const fullMeta: StampMeta = {
        templateTitle: resolvedTemplate.title,
        ...captured.meta,
        note: note && note.length > 0 ? note : undefined,
        projectName: settings.projectName || undefined,
        siteName: settings.siteName || undefined,
        contractor: settings.contractor || undefined,
        operative: settings.operative || undefined,
      };
      const result = await renderStamp({
        photoBlob: captured.blob,
        template: resolvedTemplate,
        variant: resolvedVariant,
        meta: fullMeta,
        settings,
        tier,
      });
      const record: StampedRecord = {
        id: captured.meta.uniqueId,
        templateId: resolvedTemplate.id,
        variantId: resolvedVariant.id,
        imageBlob: result.blob,
        thumbnailBlob: result.thumbnailBlob,
        meta: fullMeta,
        createdAt: Date.now(),
      };

      try {
        await saveRecord(record);
        setToast("Saved to gallery");
      } catch (err) {
        if (err instanceof GalleryFullError) {
          setToast("Stamped — but gallery is full. Delete old records to auto-save new ones.");
        } else if (err instanceof QuotaExceededError) {
          setToast("Stamped — but device storage is full. Save to your camera roll instead.");
        } else if (err instanceof Error) {
          setToast(`Stamped, but couldn't save to gallery: ${err.message}`);
        } else {
          setToast("Stamped, but couldn't save to gallery.");
        }
      }

      // Refresh the sticky soft-memory and (if live) the lock window, so a
      // rapid sequence of captures doesn't age out mid-walk.
      const stickyPatch: Partial<typeof settings> = {
        ...markUsed(resolvedTemplate.id, resolvedVariant.id),
      };
      if (isLockActive(settings)) {
        Object.assign(
          stickyPatch,
          engageLock(resolvedTemplate.id, resolvedVariant.id)
        );
      }
      updateSettings(stickyPatch);

      URL.revokeObjectURL(captured.previewUrl);
      setView({ kind: "result", stamped: record });
      setGalleryRefresh((n) => n + 1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Stamp rendering failed. Please try again.");
    } finally {
      setRendering(false);
    }
  }, [view, rendering, resolvedTemplate, resolvedVariant, tier, settings, updateSettings]);

  // ── Navigation ───────────────────────────────────────────────

  const openGallery = useCallback(() => setView({ kind: "gallery" }), []);
  const openBulk = useCallback(() => setView({ kind: "bulk" }), []);
  const openSettings = useCallback(() => setView({ kind: "settings" }), []);
  const openGalleryItem = useCallback(
    (record: StampedRecord) => setView({ kind: "gallery-item", record }),
    []
  );
  const backToLanding = useCallback(() => setView({ kind: "landing" }), []);
  const backToGallery = useCallback(() => {
    setView({ kind: "gallery" });
    setGalleryRefresh((n) => n + 1);
  }, []);
  const onGalleryItemDeleted = useCallback(() => {
    setView({ kind: "gallery" });
    setGalleryRefresh((n) => n + 1);
  }, []);
  const onBatchSaved = useCallback(() => setGalleryRefresh((n) => n + 1), []);

  // ── Early returns ─────────────────────────────────────────────
  if (isMobile === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-[#1B5B50] animate-spin" />
      </div>
    );
  }

  if (!isMobile) return <DesktopBlockScreen />;

  // ── Settings ─────────────────────────────────────────────────
  if (view.kind === "settings") {
    return (
      <>
        <SettingsScreen
          settings={settings}
          tier={tier}
          onChange={updateSettings}
          onReset={resetSettings}
          onClose={backToLanding}
          onToast={setToast}
        />
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Bulk view ────────────────────────────────────────────────
  if (view.kind === "bulk") {
    return (
      <>
        <BulkScreen
          template={resolvedTemplate}
          variant={resolvedVariant}
          tier={tier}
          settings={settings}
          onClose={backToLanding}
          onOpenGallery={openGallery}
          onToast={setToast}
          onBatchSaved={onBatchSaved}
        />
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Gallery item view ────────────────────────────────────────
  if (view.kind === "gallery-item") {
    return (
      <>
        <GalleryItemView
          record={view.record}
          tier={tier}
          settings={settings}
          onClose={backToGallery}
          onDeleted={onGalleryItemDeleted}
          onToast={setToast}
        />
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Gallery grid ────────────────────────────────────────────
  if (view.kind === "gallery") {
    return (
      <>
        <GalleryScreen
          onClose={backToLanding}
          onOpen={openGalleryItem}
          refreshToken={galleryRefresh}
        />
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Result screen ────────────────────────────────────────────
  if (view.kind === "result") {
    return (
      <>
        <ResultScreen
          stamped={view.stamped}
          filenameHint={resolvedTemplate.id}
          tier={tier}
          settings={settings}
          onRetake={backToLanding}
          onToast={setToast}
          currentTemplate={resolvedTemplate}
          currentVariant={resolvedVariant}
          onTemplateChange={pickTemplate}
          lockedTemplate={liveLockedTemplate}
          lockedVariant={liveLockedVariant}
          onToggleLock={toggleLock}
          lockActive={lockOnCurrent}
          recentlyUsed={recentlyUsed}
        />
        <div className="px-4 -mt-6 pb-6">
          <button
            type="button"
            onClick={openGallery}
            className="w-full text-center text-xs font-medium text-[#1B5B50] hover:underline py-2"
          >
            View in gallery →
          </button>
        </div>
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Captured preview ─────────────────────────────────────────
  if (view.kind === "captured") {
    return (
      <>
        <CapturedPreview
          captured={view.captured}
          template={resolvedTemplate}
          variant={resolvedVariant}
          onRetake={discardCaptured}
          onApply={applyStamp}
          onTemplateChange={pickTemplate}
          lockedTemplate={liveLockedTemplate}
          lockedVariant={liveLockedVariant}
          onToggleLock={toggleLock}
          lockActive={lockOnCurrent}
          recentlyUsed={recentlyUsed}
        />
        {rendering && (
          <div
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            role="dialog"
            aria-busy="true"
            aria-label="Rendering stamp"
          >
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[#1B5B50] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Applying stamp…</p>
              <p className="text-xs text-gray-500">Compositing on your device.</p>
            </div>
          </div>
        )}
        {toast && <Toast message={toast} onHide={() => setToast("")} />}
      </>
    );
  }

  // ── Landing ──────────────────────────────────────────────────
  return (
    <div className="pb-28">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <section className="px-4 pt-2 pb-4">
        <div className="bg-gradient-to-br from-[#1B5B50] to-[#144540] rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                Site Photo Stamp
              </p>
              <h1 className="text-xl font-bold mt-0.5 !text-white">Record a site photo</h1>
            </div>
            <button
              type="button"
              onClick={openSettings}
              className="shrink-0 -mr-1 -mt-1 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Capture, stamp and share site photos with date, location and template.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-white text-[#1B5B50] font-semibold text-sm shadow-sm hover:shadow transition-shadow active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Choose a template</h2>
          <span className="text-[11px] text-gray-500">
            {TEMPLATES.length} templates · 3 styles
          </span>
        </div>

        <div className="mb-4">
          <LockControl
            template={resolvedTemplate}
            variant={resolvedVariant}
            locked={lockOnCurrent}
            onToggle={() => toggleLock(resolvedTemplate.id, resolvedVariant.id)}
          />
        </div>

        <TemplateGrid
          selectedTemplate={selectedTemplate}
          selectedVariant={selectedVariant}
          onSelect={pickTemplate}
          lockedTemplate={liveLockedTemplate}
          lockedVariant={liveLockedVariant}
          onToggleLock={toggleLock}
          recentlyUsed={recentlyUsed}
        />
      </section>

      <section className="px-4">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={openGallery}
            className="relative flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Gallery
            {galleryCount > 0 && (
              <span className="ml-1 text-[10px] font-semibold bg-[#1B5B50] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {galleryCount > 99 ? "99+" : galleryCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openBulk}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Bulk mode
          </button>
        </div>

        <p className="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
          Site Photo Stamp runs entirely on your device. Photos, location and
          metadata never leave your phone unless you share or export them.
        </p>
      </section>

      {toast && <Toast message={toast} onHide={() => setToast("")} />}
      <CaptureProgress stage={stage} />
      <InstallPrompt />
    </div>
  );
}
