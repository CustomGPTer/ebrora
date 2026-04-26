// src/components/photo-editor/export/ExportPanel.tsx
//
// Export panel (Session 8). Side drawer. Format / resolution /
// quality / filename. Download button kicks the off-screen render and
// the encode in sequence, surfacing progress via ExportProgress.
//
// Locked decisions in scope (HANDOVER-7 §6.4):
//   • PNG / JPEG / PDF only — no WebP, no vector
//   • Resolution multipliers 1× / 2× / 4× (4× is paid-tier-gated)
//   • Maximum output dimension 8000 px on the longest axis (clamped
//     in render.ts; this panel surfaces the warning)
//   • Filename default = project name
//   • UI is blocked while the render runs — single-export-at-a-time
//
// Free-tier export count is unlimited (Q5 resolved in the Session 8
// kickoff).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Lock } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { ExportProgress } from "./ExportProgress";
import { useEditor } from "../context/EditorContext";
import { usePaidToolAccess } from "@/hooks/usePaidToolAccess";
import {
  EXPORT_RESOLUTIONS,
  MAX_EXPORT_DIMENSION,
  collectImageSources,
  loadExportImages,
  renderProjectToCanvas,
  type ExportResolution,
} from "@/lib/photo-editor/export/render";
import { canvasToPngBlob } from "@/lib/photo-editor/export/png";
import {
  canvasToJpegBlob,
  DEFAULT_JPEG_QUALITY,
} from "@/lib/photo-editor/export/jpeg";
import { canvasToPdfBlob } from "@/lib/photo-editor/export/pdf";
import { downloadBlob } from "@/lib/photo-editor/export/download";
import { STORAGE_PREFIX } from "@/lib/photo-editor/types";

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = "png" | "jpeg" | "pdf";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  jpeg: "JPEG",
  pdf: "PDF",
};

const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  png: "png",
  jpeg: "jpg",
  pdf: "pdf",
};

const FORMAT_NOTES: Record<ExportFormat, string> = {
  png: "Lossless. Preserves transparency.",
  jpeg: "Smaller files. White background where transparent.",
  pdf: "Single-page PDF, 24 pt margin.",
};

const FORMAT_STORAGE_KEY = `${STORAGE_PREFIX}export-format`;
const RESOLUTION_STORAGE_KEY = `${STORAGE_PREFIX}export-resolution`;
const QUALITY_STORAGE_KEY = `${STORAGE_PREFIX}export-jpeg-quality`;

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const { state } = useEditor();
  const { project } = state;
  const { isPaid } = usePaidToolAccess();

  const [format, setFormat] = useState<ExportFormat>(() =>
    readStoredFormat(),
  );
  const [resolution, setResolution] = useState<ExportResolution>(() =>
    readStoredResolution(),
  );
  const [quality, setQuality] = useState<number>(() => readStoredQuality());
  const [filename, setFilename] = useState<string>("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);
  const [progressLabel, setProgressLabel] = useState("Preparing…");

  // Sync filename to project name when the panel opens (or the project
  // is renamed while open). The user can override but we don't trample
  // their override mid-edit, so we only re-seed on open transitions.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setFilename(sanitiseFilename(project.name));
      setExportError(null);
    }
    wasOpenRef.current = open;
  }, [open, project.name]);

  // Persist user choices so they're sticky across sessions.
  useEffect(() => {
    try {
      window.localStorage.setItem(FORMAT_STORAGE_KEY, format);
    } catch {
      /* localStorage may be unavailable in private mode */
    }
  }, [format]);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        RESOLUTION_STORAGE_KEY,
        String(resolution),
      );
    } catch {
      /* ignore */
    }
  }, [resolution]);
  useEffect(() => {
    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, String(quality));
    } catch {
      /* ignore */
    }
  }, [quality]);

  // If a free-tier user has 4× selected and we discover their tier
  // (isPaid resolves async), drop them back to 2×.
  useEffect(() => {
    if (!isPaid && resolution === 4) {
      setResolution(2);
    }
  }, [isPaid, resolution]);

  const desiredW = project.width * resolution;
  const desiredH = project.height * resolution;
  const willClamp = Math.max(desiredW, desiredH) > MAX_EXPORT_DIMENSION;
  const clampScale = willClamp
    ? MAX_EXPORT_DIMENSION / Math.max(desiredW, desiredH)
    : 1;
  const finalW = Math.round(desiredW * clampScale);
  const finalH = Math.round(desiredH * clampScale);

  const filenameWithExt = useMemo(() => {
    const base = sanitiseFilename(filename || project.name);
    return `${base}.${FORMAT_EXTENSIONS[format]}`;
  }, [filename, project.name, format]);

  async function handleDownload() {
    if (inFlight) return;
    setExportError(null);
    setInFlight(true);
    setProgressLabel("Loading assets…");

    try {
      // Pre-load every image / sticker / photo background. Done first
      // so the actual paint pass is synchronous (and the progress
      // overlay's spinner has something meaningful to wait on).
      const sources = collectImageSources(project);
      const images = await loadExportImages(sources);

      setProgressLabel("Rendering…");
      // Yield to the event loop so the React state update flushes
      // before the synchronous paint pass kicks off.
      await nextFrame();

      const { canvas, clamped } = renderProjectToCanvas({
        project,
        multiplier: resolution,
        images,
        preserveTransparency: format === "png",
      });

      setProgressLabel("Encoding…");
      await nextFrame();

      let blob: Blob;
      if (format === "png") {
        blob = await canvasToPngBlob(canvas);
      } else if (format === "jpeg") {
        blob = await canvasToJpegBlob(canvas, quality);
      } else {
        blob = await canvasToPdfBlob(canvas);
      }

      setProgressLabel("Saving…");
      const result = await downloadBlob({
        blob,
        filename: filenameWithExt,
        shareTitle: project.name,
      });

      if (result === "fallback") {
        setExportError(
          "Your browser blocked the download. Try the Download button again.",
        );
      } else if (clamped) {
        setExportError(
          `Output was clamped to ${MAX_EXPORT_DIMENSION} px to fit browser limits.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Export failed. Try a smaller resolution or a different format.";
      setExportError(message);
    } finally {
      setInFlight(false);
      setProgressLabel("Preparing…");
    }
  }

  const footer = (
    <span>
      {finalW.toLocaleString()} × {finalH.toLocaleString()} px
      {willClamp ? " · clamped" : ""}
    </span>
  );

  return (
    <>
      <PanelDrawer
        open={open}
        onClose={onClose}
        icon={<Download className="w-5 h-5" strokeWidth={1.75} />}
        title="Export"
        footer={footer}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          {/* Format ─────────────────────────────────────────── */}
          <div>
            <Label>Format</Label>
            <div
              className="grid grid-cols-3 rounded-lg overflow-hidden mt-1.5"
              style={{ border: "1px solid var(--pe-border)" }}
              role="radiogroup"
              aria-label="Export format"
            >
              {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={format === f}
                  onClick={() => setFormat(f)}
                  className="py-2 text-sm font-medium transition-colors"
                  style={{
                    background:
                      format === f
                        ? "var(--pe-tool-icon-active-bg)"
                        : "var(--pe-surface)",
                    color:
                      format === f
                        ? "var(--pe-tool-icon-active)"
                        : "var(--pe-text)",
                  }}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              {FORMAT_NOTES[format]}
            </p>
          </div>

          {/* Resolution ─────────────────────────────────────── */}
          <div>
            <Label>Resolution</Label>
            <div
              className="grid grid-cols-3 rounded-lg overflow-hidden mt-1.5"
              style={{ border: "1px solid var(--pe-border)" }}
              role="radiogroup"
              aria-label="Resolution multiplier"
            >
              {EXPORT_RESOLUTIONS.map((mult) => {
                const locked = mult === 4 && !isPaid;
                const active = resolution === mult;
                return (
                  <button
                    key={mult}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={
                      locked
                        ? `${mult}× — paid plan required`
                        : `${mult}×`
                    }
                    onClick={() => {
                      if (locked) return;
                      setResolution(mult);
                    }}
                    className="py-2 text-sm font-medium transition-colors inline-flex items-center justify-center gap-1"
                    style={{
                      background: active
                        ? "var(--pe-tool-icon-active-bg)"
                        : "var(--pe-surface)",
                      color: locked
                        ? "var(--pe-text-subtle)"
                        : active
                          ? "var(--pe-tool-icon-active)"
                          : "var(--pe-text)",
                      cursor: locked ? "not-allowed" : "pointer",
                    }}
                  >
                    {mult}×
                    {locked && (
                      <Lock
                        className="w-3 h-3"
                        strokeWidth={2}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {!isPaid && (
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--pe-text-subtle)" }}
              >
                4× is included in paid plans.{" "}
                <a
                  href="/pricing"
                  className="underline"
                  style={{ color: "var(--pe-text-muted)" }}
                >
                  See plans
                </a>
              </p>
            )}
          </div>

          {/* JPEG quality ───────────────────────────────────── */}
          {format === "jpeg" && (
            <div>
              <div className="flex items-center justify-between">
                <Label>Quality</Label>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--pe-text-muted)" }}
                >
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={Math.round(quality * 100)}
                onChange={(e) => setQuality(Number(e.target.value) / 100)}
                aria-label="JPEG quality"
                className="w-full mt-1.5"
              />
            </div>
          )}

          {/* Filename ──────────────────────────────────────── */}
          <div>
            <Label htmlFor="export-filename">Filename</Label>
            <div className="flex items-stretch mt-1.5 rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--pe-border)" }}>
              <input
                id="export-filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={project.name}
                className="flex-1 text-sm px-3 py-2 outline-none"
                style={{
                  background: "var(--pe-surface)",
                  color: "var(--pe-text)",
                }}
              />
              <span
                className="flex-none px-3 py-2 text-sm tabular-nums"
                style={{
                  background: "var(--pe-surface-2)",
                  color: "var(--pe-text-subtle)",
                  borderLeft: "1px solid var(--pe-border)",
                }}
              >
                .{FORMAT_EXTENSIONS[format]}
              </span>
            </div>
          </div>

          {/* Error ─────────────────────────────────────────── */}
          {exportError && (
            <p
              role="alert"
              className="text-sm"
              style={{ color: "#DC2626" }}
            >
              {exportError}
            </p>
          )}

          {/* Download ──────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={inFlight}
            className="w-full mt-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#1B5B50",
              color: "#FFFFFF",
            }}
            aria-label={`Export as ${FORMAT_LABELS[format]}`}
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            {inFlight ? "Exporting…" : `Export ${FORMAT_LABELS[format]}`}
          </button>
        </div>
      </PanelDrawer>

      <ExportProgress open={inFlight} label={progressLabel} />
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color: "var(--pe-text-muted)" }}
    >
      {children}
    </label>
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(() => resolve(), 0);
    }
  });
}

function sanitiseFilename(input: string): string {
  // Strip characters that are problematic on Windows / macOS / iOS as
  // filename components. Keep spaces — most platforms accept them and
  // users care about readability over command-line friendliness.
  const cleaned = input
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : "export";
}

function readStoredFormat(): ExportFormat {
  if (typeof window === "undefined") return "png";
  try {
    const v = window.localStorage.getItem(FORMAT_STORAGE_KEY);
    if (v === "png" || v === "jpeg" || v === "pdf") return v;
  } catch {
    /* ignore */
  }
  return "png";
}

function readStoredResolution(): ExportResolution {
  if (typeof window === "undefined") return 2;
  try {
    const v = Number(window.localStorage.getItem(RESOLUTION_STORAGE_KEY));
    if (v === 1 || v === 2 || v === 4) return v as ExportResolution;
  } catch {
    /* ignore */
  }
  return 2;
}

function readStoredQuality(): number {
  if (typeof window === "undefined") return DEFAULT_JPEG_QUALITY;
  try {
    const v = Number(window.localStorage.getItem(QUALITY_STORAGE_KEY));
    if (Number.isFinite(v) && v > 0 && v <= 1) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_JPEG_QUALITY;
}
