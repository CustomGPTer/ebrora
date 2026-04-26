// src/components/photo-editor/home/GalleryCard.tsx
//
// "Gallery" card — a large, high-affordance tile that opens the OS file
// picker so the user can drop a photo in as the project background.
// Mirrors the leftmost large card in the reference Add Text app's home
// screen (Image 1 from the design brief).
//
// Behaviour: identical to the previous EmptyState's "Upload photo"
// button (createObjectURL, decode for natural dimensions, clamp to
// MAX_CANVAS_DIMENSION, hand the seeded project up via onProjectReady)
// — re-implemented here to keep the visual primitive self-contained.
//
// Loading + error states are visible inside the tile itself so the user
// gets feedback without us having to plumb error-banner state up to
// EmptyState. Pure presentational on the happy path; the only side
// effect is the URL.createObjectURL call.

"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { createBlankProject } from "@/lib/photo-editor/canvas/state";
import {
  MAX_CANVAS_DIMENSION,
  type Project,
} from "@/lib/photo-editor/types";

interface GalleryCardProps {
  /** Called with a project seeded with a `photo` background ready for
   *  the editor. */
  onProjectReady: (project: Project) => void;
}

export function GalleryCard({ onProjectReady }: GalleryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (JPG / PNG / WebP).");
      return;
    }
    setBusy(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const dim = await loadImageDimensions(objectUrl);
      const { width, height } = clampCanvasSize(
        dim.naturalWidth,
        dim.naturalHeight,
      );
      const project = createBlankProject({
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
      onProjectReady(project);
    } catch {
      URL.revokeObjectURL(objectUrl);
      setError("Couldn't load that image. Try a different file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Open a photo from your device">
      <h2
        className="sr-only"
      >
        Gallery
      </h2>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        className="w-full rounded-2xl flex flex-col items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-wait"
        style={{
          aspectRatio: "16 / 10",
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border-strong)",
        }}
        onMouseEnter={(e) => {
          if (busy) return;
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface-2)";
        }}
        onMouseLeave={(e) => {
          if (busy) return;
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface)";
        }}
        aria-label="Open photo from gallery"
      >
        <span
          className="w-14 h-14 rounded-2xl inline-flex items-center justify-center mb-3"
          style={{
            background: "var(--pe-tool-icon-active-bg)",
            color: "var(--pe-tool-icon-active)",
          }}
        >
          <ImagePlus className="w-7 h-7" strokeWidth={1.5} aria-hidden />
        </span>
        <span
          className="text-base font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          {busy ? "Loading…" : "Gallery"}
        </span>
        <span
          className="text-xs mt-1 px-4 text-center"
          style={{ color: "var(--pe-text-muted)" }}
        >
          Open a photo from your device — JPG, PNG or WebP.
        </span>
        {error && (
          <span
            className="text-xs mt-2 px-4 text-center"
            role="alert"
            style={{ color: "#DC2626" }}
          >
            {error}
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </section>
  );
}

// ─── Helpers (mirror the previous EmptyState locally) ───────────

function loadImageDimensions(
  src: string,
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
  height: number,
): { width: number; height: number } {
  const max = MAX_CANVAS_DIMENSION;
  if (width <= max && height <= max) return { width, height };
  const scale = Math.min(max / width, max / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
