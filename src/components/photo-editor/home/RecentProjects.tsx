// src/components/photo-editor/home/RecentProjects.tsx
//
// Strip of recent saved projects on the EmptyState (Session 7).
//
// Loads the last 6 most-recently-updated SavedProjects from IndexedDB
// and renders them as a horizontally-scrolling row of cards. Tapping
// a card calls onProjectLoaded which routes through PhotoEditorClient
// to switch into editor view with that project loaded.
//
// Strip is hidden entirely when no saved projects exist — the empty
// state shouldn't grow new chrome until there's something to show.

"use client";

import { useEffect, useState } from "react";
import { listProjects } from "@/lib/photo-editor/saved-projects/db";
import { FALLBACK_THUMBNAIL_DATA_URL } from "@/lib/photo-editor/saved-projects/thumbnail";
import type { Project, SavedProject } from "@/lib/photo-editor/types";

const MAX_VISIBLE = 6;

interface RecentProjectsProps {
  /** Called with the unwrapped Project to load into the editor. The
   *  SavedProject id is also passed so PhotoEditorClient can track
   *  it for autosave / overwrite-save. */
  onProjectLoaded: (project: Project, savedProjectId: string) => void;
}

export function RecentProjects({ onProjectLoaded }: RecentProjectsProps) {
  const [items, setItems] = useState<SavedProject[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await listProjects();
        setItems(list.slice(0, MAX_VISIBLE));
      } catch {
        setItems([]);
      } finally {
        setHasLoaded(true);
      }
    })();
  }, []);

  if (!hasLoaded || items.length === 0) return null;

  return (
    <section
      className="w-full max-w-3xl mx-auto mt-10"
      aria-label="Recent projects"
    >
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          Recent projects
        </h2>
        <span
          className="text-xs"
          style={{ color: "var(--pe-text-muted)" }}
        >
          Stored in your browser
        </span>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2 px-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onProjectLoaded(unwrap(p), p.id)}
            className="flex-none w-40 rounded-xl overflow-hidden text-left"
            style={{
              border: "1px solid var(--pe-border-strong)",
              background: "var(--pe-surface)",
            }}
            aria-label={`Open ${p.name}`}
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
            <div className="px-2.5 py-2">
              <div
                className="text-xs font-medium truncate"
                style={{ color: "var(--pe-text)" }}
              >
                {p.name}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: "var(--pe-text-muted)" }}
              >
                {formatShortDate(p.updatedAt)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function unwrap(saved: SavedProject): Project {
  // Same deep-clone strategy as serialize.ts. Inlined here so this
  // module doesn't have to depend on the saved-projects serializer.
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
