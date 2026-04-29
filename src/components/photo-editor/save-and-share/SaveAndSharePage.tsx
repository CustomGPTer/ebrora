// src/components/photo-editor/save-and-share/SaveAndSharePage.tsx
//
// Full-screen "Save and Share" page. Destination for the top-bar
// arrow (replacing the previous direct-save behaviour). Mirrors the
// reference Add Text app's Save and Share view:
//
//   ┌──────────────────────────────────────┐
//   │  ←   Save and Share                  │
//   ├──────────────────────────────────────┤
//   │           ┌──────────┐                │
//   │           │ preview  │                │
//   │           └──────────┘                │
//   │             W × H                     │
//   │                                       │
//   │           [PNG] [JPEG]                │
//   │                                       │
//   │   Share                               │
//   │   ┌─────────── Share To ─────────┐    │
//   │   └──────────────────────────────┘    │
//   │                                       │
//   │   Save                                │
//   │   ┌─Project─┐ ┌─Image─┐ ┌──PDF──┐    │
//   └──────────────────────────────────────┘
//
// Behaviour:
//   • Format toggle PNG / JPEG. JPEG is force-disabled when the canvas
//     background is "transparent" — Jon's spec, "transparent must be
//     png". The visible state of the toggle reflects this lock.
//   • Native canvas size only — no resolution selector, by design.
//   • Project tap, when no SavedProject exists yet, closes the page so
//     the SaveProjectDialog (mounted in EditorShell at z-[80]) appears
//     cleanly above the editor rather than under this page (z-[290]).
//     Subsequent saves stay on this page so the user can also share /
//     download in the same session.
//   • Image tap renders the project at 1× through the existing
//     /lib/photo-editor/export pipeline and downloads via downloadBlob.
//   • PDF tap renders the canvas to a PDF via canvasToPdfBlob and
//     downloads it. Available to all users — Batch A removed the paid
//     gate (no PRO features inside the editor).
//   • Share To uses navigator.share({ files: [pngFile] }) where the
//     Web Share API supports it, with a download fallback otherwise.
//
// Batch A — Apr 2026: stripped all PRO gating from this page. The
// SubscribeChip (Try PRO) chip in the header is gone, the paid-only
// PDF lock is gone, and PdfUpgradeTile / usePaidToolAccess are no
// longer used here.
//
// Keep this file self-contained (no new lib functions) — every
// rendering / encoding step delegates to the export pipeline that the
// orphaned ExportPanel was already wired against. The ExportPanel.tsx
// file is left in place but remains UI-orphaned; cleaning it up is a
// separate pass.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Share2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import {
  collectImageSources,
  loadExportImages,
  renderProjectToCanvas,
} from "@/lib/photo-editor/export/render";
import { canvasToPngBlob } from "@/lib/photo-editor/export/png";
import {
  canvasToJpegBlob,
  DEFAULT_JPEG_QUALITY,
} from "@/lib/photo-editor/export/jpeg";
import { canvasToPdfBlob } from "@/lib/photo-editor/export/pdf";
import { downloadBlob } from "@/lib/photo-editor/export/download";

type ImageFormat = "png" | "jpeg";

interface SaveAndSharePageProps {
  open: boolean;
  onClose: () => void;
  /** Existing handleSaveClick from EditorShell — opens
   *  SaveProjectDialog on first save, otherwise persists silently. */
  onProjectSave: () => void;
  /** Whether a SavedProject record exists yet — drives whether
   *  Project tap closes the page (first save) or stays put. */
  savedProjectId: string | null;
  /** True while the EditorShell-level save is in flight. */
  projectSaving: boolean;
  /** Toast emitter from EditorShell — used for "Image saved" etc. */
  onToast: (msg: string) => void;
}

export function SaveAndSharePage({
  open,
  onClose,
  onProjectSave,
  savedProjectId,
  projectSaving,
  onToast,
}: SaveAndSharePageProps) {
  const { state } = useEditor();
  const { project } = state;

  const isTransparent = project.background.kind === "transparent";

  const [format, setFormat] = useState<ImageFormat>("png");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareSupported, setShareSupported] = useState(true);

  // Track the most recent preview blob URL so the cleanup closure
  // revokes the right one even when the effect re-runs mid-render.
  const previewUrlRef = useRef<string | null>(null);

  // ── Force PNG when canvas is transparent ──────────────────────
  // If the user toggled JPEG and the project subsequently became
  // transparent (e.g. they reopened the page after deleting the
  // background), snap them back to PNG.
  useEffect(() => {
    if (isTransparent && format === "jpeg") setFormat("png");
  }, [isTransparent, format]);

  // ── Render preview on open (and on project change while open) ──
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewError(false);
    setPreviewUrl(null);
    void (async () => {
      try {
        const sources = collectImageSources(project);
        const images = await loadExportImages(sources);
        if (cancelled) return;
        const result = renderProjectToCanvas({
          project,
          multiplier: 1,
          images,
          preserveTransparency: isTransparent,
        });
        const blob = await canvasToPngBlob(result.canvas);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        // Revoke any previous preview URL before swapping in the new one.
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, project, isTransparent]);

  // Revoke the last preview URL when the page fully unmounts /
  // closes, so we don't leak object URLs across sessions.
  useEffect(() => {
    if (open) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
  }, [open]);

  // ── Detect Web Share API support (file-share specifically) ────
  useEffect(() => {
    if (typeof navigator === "undefined") {
      setShareSupported(false);
      return;
    }
    // navigator.canShare may not exist on older browsers — guard it.
    const probe = new File([new Blob(["x"])], "probe.png", {
      type: "image/png",
    });
    setShareSupported(
      typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [probe] }),
    );
  }, []);

  // ── Close on Escape ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── Helpers ───────────────────────────────────────────────────

  function safeFilename(): string {
    const cleaned = project.name.replace(/[^A-Za-z0-9-_ ]/g, "").trim();
    return cleaned.length > 0 ? cleaned : "ebrora-export";
  }

  async function renderForExport(
    preserveTransparency: boolean,
  ): Promise<HTMLCanvasElement> {
    const sources = collectImageSources(project);
    const images = await loadExportImages(sources);
    const { canvas } = renderProjectToCanvas({
      project,
      multiplier: 1,
      images,
      preserveTransparency,
    });
    return canvas;
  }

  // ── Handlers ──────────────────────────────────────────────────

  function handleProjectClick() {
    if (savedProjectId === null) {
      // First save — close the page so SaveProjectDialog (z-[80])
      // isn't trapped beneath it.
      onClose();
      onProjectSave();
      return;
    }
    onProjectSave();
  }

  async function handleImageDownload() {
    if (imageBusy) return;
    setImageBusy(true);
    try {
      // PNG preserves transparency when the canvas is transparent;
      // JPEG always composites onto white. PDF, similarly, prefers
      // a solid background.
      const preserve = format === "png" && isTransparent;
      const canvas = await renderForExport(preserve);
      const blob =
        format === "png"
          ? await canvasToPngBlob(canvas)
          : await canvasToJpegBlob(canvas, DEFAULT_JPEG_QUALITY);
      await downloadBlob({
        blob,
        filename: `${safeFilename()}.${format === "png" ? "png" : "jpg"}`,
      });
      onToast("Image saved");
    } catch {
      onToast("Couldn't export image. Try again.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handlePdfDownload() {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const canvas = await renderForExport(false);
      const blob = await canvasToPdfBlob(canvas);
      await downloadBlob({ blob, filename: `${safeFilename()}.pdf` });
      onToast("PDF saved");
    } catch {
      onToast("Couldn't export PDF. Try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleShare() {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const canvas = await renderForExport(isTransparent);
      const blob = await canvasToPngBlob(canvas);
      const file = new File([blob], `${safeFilename()}.png`, {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: project.name });
        } catch (err) {
          // User cancelled the share sheet — silently ignore.
          if (
            err instanceof Error &&
            (err.name === "AbortError" || err.name === "NotAllowedError")
          ) {
            return;
          }
          throw err;
        }
      } else {
        // Fallback for desktop / browsers without Web Share file support.
        await downloadBlob({ blob, filename: `${safeFilename()}.png` });
        onToast("Sharing isn't available — saved instead");
      }
    } catch {
      onToast("Couldn't share. Try again.");
    } finally {
      setShareBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save and Share"
      className="fixed inset-0 z-[290] flex flex-col"
      style={{ background: "var(--pe-bg)" }}
    >
      {/* Top bar */}
      <div
        className="flex-none flex items-center justify-between px-2"
        style={{
          height: 56,
          borderBottom: "1px solid var(--pe-border)",
          background: "var(--pe-toolbar-bg)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to editor"
          className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--pe-tool-icon)" }}
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={1.75} />
        </button>
        <span
          className="text-[15px] font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          Save and Share
        </span>
        {/* Empty spacer to keep the title visually centred against
         *  the back button on the left. Previously held a Try PRO
         *  chip — removed in Batch A. */}
        <div className="w-10 h-10" aria-hidden />
      </div>

      {/* Body — scrolls if it overflows on short viewports */}
      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="px-4 pt-5 pb-2 flex flex-col items-center">
          <PreviewFrame
            project={project}
            previewUrl={previewUrl}
            previewError={previewError}
            isTransparent={isTransparent}
          />
          <span
            className="mt-2 text-[13px]"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            {project.width} × {project.height}
          </span>
        </div>

        {/* Format toggle */}
        <div className="px-4 pt-3 pb-1 flex flex-col items-center">
          <div
            role="radiogroup"
            aria-label="Image format"
            className="inline-flex p-1 rounded-full"
            style={{
              background: "var(--pe-surface-2)",
              border: "1px solid var(--pe-border)",
            }}
          >
            <FormatPill
              label="PNG"
              active={format === "png"}
              onClick={() => setFormat("png")}
            />
            <FormatPill
              label="JPEG"
              active={format === "jpeg"}
              disabled={isTransparent}
              onClick={() => setFormat("jpeg")}
            />
          </div>
          {isTransparent ? (
            <p
              className="mt-2 text-[12px] text-center max-w-[320px]"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              Background is transparent — JPEG isn't available because it
              would replace transparency with white.
            </p>
          ) : null}
        </div>

        {/* Share section */}
        <div className="px-4 pt-5 pb-1">
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            Share
          </span>
        </div>
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={shareBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 transition-opacity disabled:opacity-60"
            style={{
              background: "var(--pe-surface)",
              border: "1px solid var(--pe-border)",
              color: "var(--pe-text)",
            }}
          >
            {shareBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <Share2 className="w-5 h-5" strokeWidth={1.75} aria-hidden />
            )}
            <span className="text-sm font-semibold">
              {shareBusy ? "Sharing…" : "Share To"}
            </span>
          </button>
          {!shareSupported ? (
            <p
              className="mt-2 text-[12px]"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              Web Share isn't available in this browser — Share To will save
              the image to your device instead.
            </p>
          ) : null}
        </div>

        {/* Save section */}
        <div className="px-4 pt-4 pb-1">
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            Save
          </span>
        </div>
        <div
          className="px-4 grid grid-cols-3 gap-2"
          style={{
            paddingBottom:
              "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          }}
        >
          <SaveTile
            icon={<Save className="w-5 h-5" strokeWidth={1.75} aria-hidden />}
            label="Project"
            onClick={handleProjectClick}
            busy={projectSaving}
          />
          <SaveTile
            icon={
              <ImageIcon className="w-5 h-5" strokeWidth={1.75} aria-hidden />
            }
            label="Image"
            onClick={handleImageDownload}
            busy={imageBusy}
          />
          <SaveTile
            icon={
              <FileText
                className="w-5 h-5"
                strokeWidth={1.75}
                aria-hidden
              />
            }
            label="PDF"
            onClick={handlePdfDownload}
            busy={pdfBusy}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function PreviewFrame({
  project,
  previewUrl,
  previewError,
  isTransparent,
}: {
  project: { width: number; height: number; name: string };
  previewUrl: string | null;
  previewError: boolean;
  isTransparent: boolean;
}) {
  // Cap the on-screen preview height so very tall portrait projects
  // still leave room for the buttons below without forcing scroll.
  // Width caps at 360 to match the reference's compact preview.
  const aspectRatio = `${project.width} / ${project.height}`;

  // Tiny inline SVG checkerboard — only used when the canvas is
  // transparent so the user can see what their export looks like.
  const checkerBg = isTransparent
    ? `url("data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='8' height='8' fill='%23E5E7EB'/><rect x='8' y='8' width='8' height='8' fill='%23E5E7EB'/><rect x='8' width='8' height='8' fill='%23F3F4F6'/><rect y='8' width='8' height='8' fill='%23F3F4F6'/></svg>`,
      )}")`
    : undefined;

  return (
    <div
      className="w-full max-w-[300px] rounded-lg overflow-hidden flex items-center justify-center"
      style={{
        aspectRatio,
        maxHeight: "44vh",
        background: isTransparent ? undefined : "var(--pe-surface-2)",
        backgroundImage: checkerBg,
        backgroundRepeat: "repeat",
        border: "1px solid var(--pe-border)",
      }}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={`Preview of ${project.name || "project"}`}
          className="w-full h-full object-contain"
        />
      ) : previewError ? (
        <span
          className="text-xs px-3 text-center"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Couldn't render preview
        </span>
      ) : (
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: "var(--pe-tool-icon)" }}
          aria-label="Rendering preview"
        />
      )}
    </div>
  );
}

function FormatPill({
  label,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active && !disabled ? "var(--pe-surface)" : "transparent",
        color: active && !disabled ? "var(--pe-text)" : "var(--pe-text-subtle)",
        boxShadow: active && !disabled ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function SaveTile({
  icon,
  label,
  onClick,
  busy,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl transition-opacity disabled:opacity-60"
      style={{
        background: "var(--pe-surface)",
        border: "1px solid var(--pe-border)",
        color: "var(--pe-text)",
      }}
    >
      {busy ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}
