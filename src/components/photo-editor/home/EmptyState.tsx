// src/components/photo-editor/home/EmptyState.tsx
//
// Home view. Two big buttons — "Upload photo" and "Start blank" — exactly
// as Q28 specified (no samples, no template gallery). The Upload flow
// reads the picked file via URL.createObjectURL, gets natural dimensions,
// clamps to MAX_CANVAS_DIMENSION if needed, and seeds the editor with a
// photo-background project.
//
// This is also where a future paid-tier upgrade hint or a "recent projects"
// row would land, but neither is in scope for Session 1.

"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileImage, ImagePlus, Sparkles } from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { HamburgerCorner } from "../mobile/HamburgerCorner";
import { RecentProjects } from "./RecentProjects";
import { createBlankProject } from "@/lib/photo-editor/canvas/state";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { Project } from "@/lib/photo-editor/types";

interface EmptyStateProps {
  onStartBlank: () => void;
  /** Called when a project is ready to load. savedProjectId is
   *  non-null when the project came from the saved-projects store
   *  (Session 7), enabling autosave to overwrite the same record.
   *  null when the project came from a fresh upload. */
  onProjectLoaded: (project: Project, savedProjectId: string | null) => void;
}

export function EmptyState({
  onStartBlank,
  onProjectLoaded,
}: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Try a JPG, PNG, or WebP.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const project = await loadFileAsProject(file);
      onProjectLoaded(project, null);
    } catch {
      setError("Couldn't load that image. Try a different file.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Top chrome — same layout as the editor view so the transition
          between home and editor is visually steady. */}
      <div
        className="flex-none flex items-center justify-between px-3"
        style={{
          height: 52,
          borderBottom: "1px solid var(--pe-border)",
          background: "var(--pe-toolbar-bg)",
        }}
      >
        <HamburgerCorner />
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          Photo Editor
        </span>
        <ThemeToggle />
      </div>

      {/* Hero / two-button picker */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{ background: "var(--pe-accent)" }}
          >
            <Sparkles
              className="w-10 h-10"
              strokeWidth={1.5}
              style={{ color: "var(--pe-accent-fg)" }}
            />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-semibold mb-3"
            style={{ color: "var(--pe-text)" }}
          >
            Start editing
          </h1>
          <p
            className="text-sm sm:text-base mb-8 leading-relaxed"
            style={{ color: "var(--pe-text-muted)" }}
          >
            Add text, stickers, shapes and stamps to a photo, or start from
            a blank canvas. Everything happens in your browser — your photos
            stay on your device.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrimaryButton
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              icon={<ImagePlus className="w-5 h-5" strokeWidth={1.75} />}
              label={loading ? "Loading…" : "Upload photo"}
            />
            <SecondaryButton
              onClick={onStartBlank}
              disabled={loading}
              icon={<FileImage className="w-5 h-5" strokeWidth={1.75} />}
              label="Start blank"
            />
          </div>

          {error && (
            <p
              className="mt-4 text-sm"
              role="alert"
              style={{ color: "#DC2626" }}
            >
              {error}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            aria-hidden
          />
        </div>
      </main>

      <RecentProjects
        onProjectLoaded={(project, savedProjectId) =>
          onProjectLoaded(project, savedProjectId)
        }
      />
    </div>
  );
}

// ─── Buttons ────────────────────────────────────────────────────

function PrimaryButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 sm:flex-initial sm:min-w-[200px] inline-flex items-center justify-center gap-2 h-14 px-6 rounded-2xl text-base font-medium transition-colors disabled:opacity-60 disabled:cursor-wait"
      style={{
        background: "var(--pe-accent)",
        color: "var(--pe-accent-fg)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-accent-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-accent)";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 sm:flex-initial sm:min-w-[200px] inline-flex items-center justify-center gap-2 h-14 px-6 rounded-2xl text-base font-medium transition-colors disabled:opacity-60"
      style={{
        background: "var(--pe-surface)",
        color: "var(--pe-text)",
        border: "1px solid var(--pe-border-strong)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface)";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── File loading ───────────────────────────────────────────────

async function loadFileAsProject(file: File): Promise<Project> {
  const objectUrl = URL.createObjectURL(file);
  const dim = await loadImageDimensions(objectUrl);
  const { width, height } = clampCanvasSize(
    dim.naturalWidth,
    dim.naturalHeight
  );

  return createBlankProject({
    width,
    height,
    name: file.name.replace(/\.[^.]+$/, "") || "Photo",
    background: {
      kind: "photo",
      src: objectUrl,
      naturalWidth: dim.naturalWidth,
      naturalHeight: dim.naturalHeight,
      crop: null,
      flip: { horizontal: false, vertical: false },
      rotation: 0,
    },
  });
}

function loadImageDimensions(
  src: string
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () =>
      resolve({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function clampCanvasSize(
  width: number,
  height: number
): { width: number; height: number } {
  const max = MAX_CANVAS_DIMENSION;
  if (width <= max && height <= max) return { width, height };
  const scale = Math.min(max / width, max / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
