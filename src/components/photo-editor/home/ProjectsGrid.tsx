// src/components/photo-editor/home/ProjectsGrid.tsx
//
// "Projects" section of the home screen — a horizontal-scrolling row of
// SavedProject cards. Replaces RecentProjects.tsx visually while keeping
// its data-flow contract intact (listProjects via IndexedDB, deserialize
// via unwrap, hand the Project + savedProjectId up to PhotoEditorClient).
//
// Each card:
//   ┌────────────────┐
//   │   thumbnail   ⋮│   ← three-dot menu trigger
//   │                │
//   │                │
//   ├────────────────┤
//   │ project-name   │
//   │ updated-time   │
//   └────────────────┘
//
// Card tap opens the project. The three-dot menu is a small overflow
// (Open / Delete) — Delete asks for confirmation before destroying the
// SavedProject record.
//
// Empty state: when listProjects returns nothing (or fails), the entire
// section is hidden — same behaviour as the previous RecentProjects.tsx.
// We don't fabricate a CTA card here because the BackgroundQuickPick +
// GalleryCard sections already cover "start a new project."

"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  deleteProject as deleteProjectRecord,
  listProjects,
} from "@/lib/photo-editor/saved-projects/db";
import { FALLBACK_THUMBNAIL_DATA_URL } from "@/lib/photo-editor/saved-projects/thumbnail";
import type { Project, SavedProject } from "@/lib/photo-editor/types";

const MAX_VISIBLE = 12;

interface ProjectsGridProps {
  /** Called when the user taps a card. Receives the unwrapped Project
   *  ready for the editor + the SavedProject id so autosave / overwrite-
   *  save knows it's editing an existing record. */
  onProjectLoaded: (project: Project, savedProjectId: string) => void;
}

export function ProjectsGrid({ onProjectLoaded }: ProjectsGridProps) {
  const [items, setItems] = useState<SavedProject[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listProjects();
        if (!cancelled) setItems(list.slice(0, MAX_VISIBLE));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setHasLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Close any open card menu when the user taps anywhere else ──
  useEffect(() => {
    if (openMenuFor === null) return;
    const onDocPointerDown = () => setOpenMenuFor(null);
    // Schedule on next tick so the very click that opened the menu
    // doesn't immediately close it.
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", onDocPointerDown);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", onDocPointerDown);
    };
  }, [openMenuFor]);

  async function handleDelete(record: SavedProject) {
    setOpenMenuFor(null);
    if (deleting !== null) return;
    const confirmed = window.confirm(
      `Delete "${record.name}"? This can't be undone.`,
    );
    if (!confirmed) return;
    setDeleting(record.id);
    try {
      await deleteProjectRecord(record.id);
      setItems((prev) => prev.filter((p) => p.id !== record.id));
    } catch {
      // Quiet failure — nothing actionable for the user. They can retry.
    } finally {
      setDeleting(null);
    }
  }

  if (!hasLoaded || items.length === 0) return null;

  return (
    <section aria-label="Recent projects">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          Projects
        </h2>
        <span
          className="text-xs"
          style={{ color: "var(--pe-text-muted)" }}
        >
          Stored on this device
        </span>
      </div>

      <div
        className="flex items-stretch gap-3 overflow-x-auto pb-2 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((p) => {
          const menuOpen = openMenuFor === p.id;
          const isDeleting = deleting === p.id;
          return (
            <div
              key={p.id}
              className="flex-none w-44 rounded-xl overflow-hidden flex flex-col relative"
              style={{
                border: "1px solid var(--pe-border-strong)",
                background: "var(--pe-surface)",
                opacity: isDeleting ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Tap target — opens the project ─────────────── */}
              <button
                type="button"
                onClick={() => {
                  if (menuOpen) {
                    setOpenMenuFor(null);
                    return;
                  }
                  onProjectLoaded(unwrap(p), p.id);
                }}
                disabled={isDeleting}
                aria-label={`Open ${p.name}`}
                className="w-full text-left disabled:cursor-not-allowed"
              >
                <div
                  className="w-full aspect-video overflow-hidden"
                  style={{ background: "#FFFFFF" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnail || FALLBACK_THUMBNAIL_DATA_URL}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="px-3 py-2">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--pe-text)" }}
                  >
                    {p.name}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--pe-text-muted)" }}
                  >
                    {formatShortDate(p.updatedAt)}
                  </div>
                </div>
              </button>

              {/* Three-dot menu trigger — overlay, top-right ── */}
              <button
                type="button"
                aria-label={`Project options for ${p.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuFor(menuOpen ? null : p.id);
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors"
                style={{
                  background: "rgba(15, 17, 21, 0.55)",
                  color: "#FFFFFF",
                }}
              >
                <MoreVertical className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Tiny popover menu ──────────────────────────── */}
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute top-9 right-1.5 z-10 rounded-lg overflow-hidden"
                  style={{
                    background: "var(--pe-surface)",
                    border: "1px solid var(--pe-border-strong)",
                    boxShadow: "var(--pe-shadow-lg)",
                    minWidth: 140,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuFor(null);
                      onProjectLoaded(unwrap(p), p.id);
                    }}
                    className="w-full text-left px-3 py-2 text-sm"
                    style={{ color: "var(--pe-text)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--pe-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleDelete(p)}
                    className="w-full text-left px-3 py-2 text-sm inline-flex items-center gap-2"
                    style={{ color: "#DC2626" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(220, 38, 38, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function unwrap(saved: SavedProject): Project {
  if (typeof structuredClone === "function") {
    return structuredClone(saved.snapshot);
  }
  return JSON.parse(JSON.stringify(saved.snapshot)) as Project;
}

function formatShortDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) {
    const h = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));
    return `${h}h ago`;
  }
  if (diff < 7 * day) {
    const d = Math.floor(diff / day);
    return `${d}d ago`;
  }
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}
