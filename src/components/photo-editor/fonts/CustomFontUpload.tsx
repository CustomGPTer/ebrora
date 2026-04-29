// src/components/photo-editor/fonts/CustomFontUpload.tsx
//
// Custom-fonts tab body. Two states:
//
//   • Empty — friendly hint plus the upload control.
//   • Has uploads — list of previously-uploaded fonts, each with a
//     Delete button. Tapping a row applies that font to the active
//     layer (same dispatch path as the Google catalogue rows).
//
// Upload pipeline:
//   1. User picks a .ttf / .otf via <input type="file">.
//   2. Read bytes as ArrayBuffer.
//   3. Construct a FontFace and await its load() so we surface invalid
//      files before persisting.
//   4. Persist to IndexedDB via addCustomFont — which also pushes into
//      the font-store so the list re-renders.
//
// The family name is derived from the filename (stripped extension).
// Variant defaults to "regular" — Session 4 doesn't surface an upload-
// time variant chooser; the user can re-upload the same family with a
// different filename if they want different weights.
//
// Batch A — Apr 2026: removed the paid-tier paywall. Custom font
// upload is now available to every user (no PRO features inside the
// editor).

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import {
  addCustomFont,
  customFontId,
  ensureCustomFontLoaded,
  loadAllCustomFonts,
  removeCustomFont,
  type CustomFontRecord,
} from "@/lib/photo-editor/fonts/custom-fonts-db";
import { useCustomFonts } from "@/lib/photo-editor/fonts/font-store";

interface CustomFontUploadProps {
  /** Currently active family on the selected text layer (drives the
   *  active-row indicator). */
  activeFamily: string | null;
  /** True when a custom font is in the middle of being applied. */
  loadingFamily: string | null;
  /** Whether a text layer is selected — drives whether tapping a custom
   *  font row applies it. */
  canApplyToLayer: boolean;
  onApply: (record: CustomFontRecord) => void;
}

const ACCEPTED_EXTENSIONS = /\.(ttf|otf)$/i;

function familyFromFilename(filename: string): string {
  return filename.replace(ACCEPTED_EXTENSIONS, "").trim() || filename;
}

export function CustomFontUpload({
  activeFamily,
  loadingFamily,
  canApplyToLayer,
  onApply,
}: CustomFontUploadProps) {
  const customFonts = useCustomFonts();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [bringUpDone, setBringUpDone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // First mount: enumerate IndexedDB so the list reflects whatever the
  // user uploaded in previous sessions. Bring-up registers each record
  // with document.fonts so the canvas engine can paint with them
  // immediately.
  useEffect(() => {
    void loadAllCustomFonts().finally(() => setBringUpDone(true));
  }, []);

  function pickFile() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setUploadError(null);
    if (!ACCEPTED_EXTENSIONS.test(file.name)) {
      setUploadError("File must be a .ttf or .otf font.");
      return;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const family = familyFromFilename(file.name);
      const variant = "regular";

      // Validate by trying to load it as a FontFace before we persist.
      const face = new FontFace(family, buffer, {
        style: "normal",
        weight: "400",
        display: "swap",
      });
      await face.load();
      (document as Document & { fonts: FontFaceSet }).fonts.add(face);

      const record: CustomFontRecord = {
        id: customFontId(family, variant),
        family,
        variant,
        filename: file.name,
        blob: new Blob([buffer], { type: file.type || "font/ttf" }),
        addedAt: Date.now(),
      };
      await addCustomFont(record);
      // Make sure the FontFace is registered (the addCustomFont path
      // doesn't itself add to document.fonts — we did that above).
      await ensureCustomFontLoaded(record);
    } catch (err) {
      console.warn("[photo-editor] custom font upload failed", err);
      setUploadError(
        err instanceof Error ? err.message : "Could not load that font file.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeCustomFont(id);
    } catch (err) {
      console.warn("[photo-editor] custom font removal failed", err);
    }
  }

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ background: "var(--pe-surface)" }}
    >
      {/* Upload control — sticky at top of the tab. */}
      <div
        className="flex-none px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--pe-border)" }}
      >
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "var(--pe-accent)",
            color: "var(--pe-accent-fg)",
          }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="w-4 h-4" strokeWidth={2} />
          )}
          {uploading ? "Uploading…" : "Upload .ttf / .otf"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf,application/font-sfnt,application/x-font-ttf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {uploadError ? (
          <span
            className="text-xs"
            style={{ color: "#DC2626" }}
            role="status"
          >
            {uploadError}
          </span>
        ) : null}
      </div>

      {/* Uploaded fonts list. */}
      <div className="flex-1 overflow-y-auto">
        {!bringUpDone ? (
          <div
            className="px-4 py-8 text-sm text-center"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            <Loader2
              className="w-5 h-5 animate-spin inline-block"
              strokeWidth={2}
            />
          </div>
        ) : customFonts.length === 0 ? (
          <div
            className="px-4 py-8 text-sm text-center"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            No custom fonts yet. Upload a{" "}
            <span className="font-medium">.ttf</span> or{" "}
            <span className="font-medium">.otf</span> file to get started.
          </div>
        ) : (
          <div className="flex flex-col">
            {customFonts.map((record) => {
              const isActive = record.family === activeFamily;
              const isLoading = record.family === loadingFamily;
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-2 px-4"
                  style={{
                    height: 56,
                    background: isActive
                      ? "var(--pe-tool-icon-active-bg)"
                      : "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onApply(record)}
                    disabled={!canApplyToLayer || isLoading}
                    className="flex-1 flex items-center justify-between text-left disabled:cursor-not-allowed transition-opacity"
                    style={{
                      opacity: !canApplyToLayer ? 0.6 : 1,
                    }}
                  >
                    <span
                      className="truncate"
                      style={{
                        fontFamily: `"${record.family}", sans-serif`,
                        fontSize: 22,
                        lineHeight: 1.2,
                        color: "var(--pe-text)",
                      }}
                    >
                      {record.family}
                    </span>
                    {isLoading ? (
                      <Loader2
                        className="w-4 h-4 animate-spin ml-2"
                        strokeWidth={2}
                        style={{ color: "var(--pe-text-muted)" }}
                      />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(record.id)}
                    aria-label={`Remove ${record.family}`}
                    className="flex-none w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors"
                    style={{ color: "var(--pe-text-muted)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--pe-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
