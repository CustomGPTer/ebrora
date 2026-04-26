// src/components/photo-editor/projects/ProjectsModal.tsx
//
// Saved-projects modal (Session 7).
//
// Grid of cards: thumbnail, name, last-modified, delete (with
// confirm). Tapping a card calls onLoad with the SavedProject; the
// host wires that to dispatching LOAD_PROJECT. The modal also exposes
// a soft-cap warning banner when count >= SAVED_PROJECTS_WARN_THRESHOLD.
//
// Per HANDOVER §8.5 Q1: this is a modal overlay rather than a separate
// route. Per Q2: only one project is "open" at a time — loading a new
// one replaces the current canvas (the host gates with a confirm if
// there are unsaved edits).

"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import {
  approximateStorageUsage,
  deleteProject,
  listProjects,
} from "@/lib/photo-editor/saved-projects/db";
import { FALLBACK_THUMBNAIL_DATA_URL } from "@/lib/photo-editor/saved-projects/thumbnail";
import {
  SAVED_PROJECTS_HARD_CAP,
  SAVED_PROJECTS_WARN_THRESHOLD,
  type SavedProject,
} from "@/lib/photo-editor/types";

interface ProjectsModalProps {
  open: boolean;
  /** id of the currently-open saved project, if any. Highlighted in
   *  the grid so the user knows where they came from. */
  currentProjectId: string | null;
  onClose: () => void;
  onLoad: (project: SavedProject) => void;
}

export function ProjectsModal({
  open,
  currentProjectId,
  onClose,
  onLoad,
}: ProjectsModalProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjects();
      setProjects(list);
      // Usage runs after the list resolves so the modal lands with
      // the count first and a slow usage compute won't delay the UI.
      void approximateStorageUsage().then(setStorageBytes);
    } catch {
      setError(
        "Couldn't load saved projects. Your browser may have storage disabled."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (pendingDelete) {
          setPendingDelete(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pendingDelete]);

  if (!open) return null;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteProject(pendingDelete);
      setPendingDelete(null);
      await refresh();
    } catch {
      setError("Couldn't delete the project. Try again.");
      setPendingDelete(null);
    }
  }

  const showSoftCapWarning =
    projects.length >= SAVED_PROJECTS_WARN_THRESHOLD;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-xl"
        style={{
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Saved projects"
      >
        {/* Header */}
        <div
          className="flex-none flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--pe-text)" }}
            >
              Saved projects
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--pe-text-muted)" }}
            >
              {projects.length} of {SAVED_PROJECTS_HARD_CAP} stored locally
              {storageBytes !== null && projects.length > 0
                ? ` · ${formatBytes(storageBytes)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full"
            style={{ color: "var(--pe-text-muted)" }}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {showSoftCapWarning && (
            <div
              className="mb-4 px-3 py-2 rounded-lg flex items-start gap-2 text-sm"
              style={{
                background: "rgba(234, 179, 8, 0.12)",
                color: "var(--pe-text)",
                border: "1px solid rgba(234, 179, 8, 0.5)",
              }}
              role="status"
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 flex-none"
                strokeWidth={2}
                style={{ color: "#CA8A04" }}
              />
              <span>
                You&apos;re close to the {SAVED_PROJECTS_HARD_CAP}-project
                local limit. Delete a few you no longer need to keep saving
                new ones.
              </span>
            </div>
          )}

          {error && (
            <p
              className="mb-3 text-sm"
              role="alert"
              style={{ color: "#DC2626" }}
            >
              {error}
            </p>
          )}

          {loading ? (
            <p
              className="py-8 text-center text-sm"
              style={{ color: "var(--pe-text-muted)" }}
            >
              Loading saved projects…
            </p>
          ) : projects.length === 0 ? (
            <p
              className="py-12 text-center text-sm"
              style={{ color: "var(--pe-text-muted)" }}
            >
              No saved projects yet. Save your work from the editor to
              keep it for later.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isCurrent={p.id === currentProjectId}
                  onLoad={() => onLoad(p)}
                  onDelete={() => setPendingDelete(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm-delete sub-dialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-xl px-5 py-5"
            style={{
              background: "var(--pe-surface)",
              border: "1px solid var(--pe-border)",
            }}
            role="alertdialog"
            aria-modal="true"
          >
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: "var(--pe-text)" }}
            >
              Delete project?
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--pe-text-muted)" }}
            >
              This permanently removes the saved project from your browser.
              It can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-9 px-4 rounded-lg text-sm font-medium"
                style={{
                  background: "transparent",
                  color: "var(--pe-text)",
                  border: "1px solid var(--pe-border-strong)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="h-9 px-4 rounded-lg text-sm font-medium"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProjectCard ────────────────────────────────────────────────

function ProjectCard({
  project,
  isCurrent,
  onLoad,
  onDelete,
}: {
  project: SavedProject;
  isCurrent: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        border: isCurrent
          ? "2px solid var(--pe-accent)"
          : "1px solid var(--pe-border-strong)",
        background: "var(--pe-surface-2)",
      }}
    >
      <button
        type="button"
        onClick={onLoad}
        className="block w-full aspect-video overflow-hidden"
        style={{ background: "#FFFFFF" }}
        aria-label={`Open ${project.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.thumbnail || FALLBACK_THUMBNAIL_DATA_URL}
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onLoad}
          className="flex-1 min-w-0 text-left"
        >
          <div
            className="text-sm font-medium truncate"
            style={{ color: "var(--pe-text)" }}
          >
            {project.name}
            {isCurrent && (
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--pe-accent)" }}
              >
                (open)
              </span>
            )}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--pe-text-muted)" }}
          >
            {formatRelativeDate(project.updatedAt)}
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${project.name}`}
          className="w-8 h-8 flex-none inline-flex items-center justify-center rounded-full"
          style={{ color: "var(--pe-text-muted)" }}
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

// ─── Date formatting ────────────────────────────────────────────
//
// Lightweight relative-date formatter. No date-fns / Luxon — keep the
// dependency budget tight (locked rule §4 #11).

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diff < week) {
    const d = Math.floor(diff / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  // Beyond a week, show locale date (e.g. "12 Apr 2026").
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return new Date(timestamp).toDateString();
  }
}

/** Format an approximate byte count as a human-readable string for the
 *  Projects modal header. Approximate accuracy — we're summing
 *  in-memory string lengths, so results are within ~2× of the actual
 *  IndexedDB footprint. Good enough for the user-facing "you've used X"
 *  display. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 100) return `${mb.toFixed(1)} MB`;
  return `${mb.toFixed(0)} MB`;
}
