// src/components/photo-editor/export/ExportProgress.tsx
//
// Blocking progress overlay shown while the export render runs. The
// render happens on the main thread (locked decision §6.4) so the UI
// can't actually receive other input while it runs — this overlay just
// makes that visible and prevents accidental double-clicks on the
// Download button.
//
// The label string is updated as the export pipeline moves through its
// phases (load assets → render → encode → save) so the user knows
// progress is being made even though we don't have a numeric percent.

"use client";

import { Loader2 } from "lucide-react";

interface ExportProgressProps {
  open: boolean;
  /** Phase label — "Rendering…", "Encoding…", etc. */
  label: string;
}

export function ExportProgress({ open, label }: ExportProgressProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Exporting"
      aria-busy="true"
    >
      <div
        className="px-6 py-5 rounded-xl shadow-xl flex items-center gap-3 min-w-[220px]"
        style={{
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border)",
        }}
      >
        <Loader2
          className="w-5 h-5 animate-spin"
          strokeWidth={2}
          style={{ color: "#1B5B50" }}
          aria-hidden
        />
        <span
          className="text-sm font-medium"
          style={{ color: "var(--pe-text)" }}
          aria-live="polite"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
