// src/lib/photo-editor/saved-projects/serialize.ts
//
// Envelope serialisation for SavedProject (Session 7).
//
// The Project type itself is already serialisable (no functions, no
// classes, no DOM nodes) — the rich-text engine's GlyphRun model and
// the Konva-free shape / sticker / image layers are all plain data.
// So "serialise" here is mostly about wrapping a Project in the
// SavedProject envelope (id, name, dates, thumbnail) and accepting
// replacement values for the editable metadata fields.
//
// We deep-clone via structuredClone to defend against caller code that
// might still hold a reference to the same Project object after save.
// IndexedDB itself does a structured clone on put(), but doing it here
// too means the SavedProject record we return can be safely mutated by
// callers without affecting the persisted copy.

import { newId } from "../util/id";
import type { Project, SavedProject } from "../types";

interface SerializeOpts {
  /** Existing record id to preserve on Save. Omit for first-save. */
  id?: string;
  /** Display name. Mutates project.name as well so the Project's own
   *  name field stays in sync with the envelope. */
  name: string;
  /** Existing createdAt to preserve on Save. Omit for first-save. */
  createdAt?: number;
  /** Thumbnail data URL — see thumbnail.ts. */
  thumbnail: string;
}

/** Wrap a Project in a SavedProject envelope. The Project's name and
 *  updatedAt are aligned with the envelope so a future load round-trips
 *  the same metadata that the Projects modal displays. */
export function serializeSavedProject(
  project: Project,
  opts: SerializeOpts,
): SavedProject {
  const now = Date.now();
  const cloned = deepClone(project);
  cloned.name = opts.name;
  cloned.updatedAt = now;
  return {
    id: opts.id ?? newId("save"),
    name: opts.name,
    createdAt: opts.createdAt ?? now,
    updatedAt: now,
    snapshot: cloned,
    thumbnail: opts.thumbnail,
  };
}

/** Unwrap a SavedProject back to a Project ready to load into the
 *  editor. Deep-clones so the editor's mutations don't leak back into
 *  the in-memory list of saved records. */
export function deserializeSavedProject(saved: SavedProject): Project {
  const project = deepClone(saved.snapshot);
  // Compatibility shim: backfill ImageLayer fields that were added in
  // later patches (Phase 1 stroke, Phase 3 adjust/filterEffect/blur)
  // so the renderer doesn't crash on legacy saved projects.
  for (const layer of project.layers) {
    if (layer.kind !== "image") continue;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const anyLayer = layer as any;
    if (anyLayer.stroke === undefined) {
      anyLayer.stroke = {
        color: "#000000",
        width: 0,
        opacity: 1,
      };
    }
    if (anyLayer.adjust === undefined) {
      anyLayer.adjust = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        exposure: 0,
      };
    }
    if (anyLayer.filterEffect === undefined) {
      anyLayer.filterEffect = null;
    }
    if (anyLayer.blur === undefined) {
      anyLayer.blur = { radius: 0, kind: "gaussian" };
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return project;
}

/** Use the structured clone algorithm where available; fall back to a
 *  JSON-roundtrip otherwise. JSON loses Date objects (we don't have
 *  any in Project), Map/Set (also none), and undefined (we use null).
 *  All Project fields are JSON-safe so the fallback is acceptable. */
function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
