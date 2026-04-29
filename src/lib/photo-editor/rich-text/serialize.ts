// src/lib/photo-editor/rich-text/serialize.ts
//
// JSON ↔ runtime model for TextLayer rich-text content. The GlyphRun
// shape is already JSON-friendly so this module is mostly validation
// and schema migration. Bumps will land here when the run shape
// changes incompatibly.

import type {
  GlyphRun,
  Point,
  TextBackground,
  TextLayer,
  TextLayerStyling,
} from "../types";
import {
  defaultGlyphRun,
  defaultTextBackground,
  defaultTextStyling,
} from "./factory";

/** Current schema version for serialised TextLayers. Independent of the
 *  Project schema version because rich-text shape may evolve more
 *  frequently than the overall project. */
export const TEXT_SCHEMA_VERSION = 1;

export interface SerializedTextLayer {
  version: number;
  layer: TextLayer;
}

/** Wrap a TextLayer for storage. */
export function serializeTextLayer(layer: TextLayer): SerializedTextLayer {
  return {
    version: TEXT_SCHEMA_VERSION,
    layer: cloneLayer(layer),
  };
}

/** Read a serialised TextLayer, applying version migrations and filling
 *  in defaults for fields that may be missing in older payloads. */
export function deserializeTextLayer(input: unknown): TextLayer | null {
  if (!isObject(input)) return null;
  const version = typeof input.version === "number" ? input.version : 0;
  const raw = input.layer;
  if (!isObject(raw)) return null;

  // Future migrations land here. For now the only path is identity:
  //   if (version < 2) raw = migrateV1ToV2(raw);
  void version;

  return validateLayer(raw);
}

/** Validate (and shallow-fix) a TextLayer parsed from JSON. Returns null
 *  if the shape is too broken to recover. */
export function validateLayer(raw: unknown): TextLayer | null {
  if (!isObject(raw)) return null;
  if (raw.kind !== "text") return null;
  if (!Array.isArray(raw.runs)) return null;

  const styling: TextLayerStyling = {
    ...defaultTextStyling(),
    ...(isObject(raw.styling) ? (raw.styling as Partial<TextLayerStyling>) : {}),
  };

  const background: TextBackground = {
    ...defaultTextBackground(),
    ...(isObject(raw.background)
      ? (raw.background as Partial<TextBackground>)
      : {}),
  };

  // Perspective: only accept a strict 4-point array shape; anything else
  // (missing, null, malformed) becomes null = no warp. Avoids inheriting
  // half-broken corners from older payloads.
  const perspective = parsePerspective(raw.perspective);

  const runs: GlyphRun[] = (raw.runs as unknown[])
    .map((r) => validateRun(r))
    .filter((r): r is GlyphRun => r !== null);

  if (runs.length === 0) return null;

  return {
    ...(raw as object),
    runs,
    styling,
    background,
    perspective,
    erase: Array.isArray(raw.erase) ? raw.erase : [],
  } as TextLayer;
}

function parsePerspective(
  raw: unknown,
): [Point, Point, Point, Point] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const out: Point[] = [];
  for (const p of raw) {
    if (
      !isObject(p) ||
      typeof p.x !== "number" ||
      typeof p.y !== "number"
    ) {
      return null;
    }
    out.push({ x: p.x, y: p.y });
  }
  return [out[0], out[1], out[2], out[3]];
}

function validateRun(raw: unknown): GlyphRun | null {
  if (!isObject(raw)) return null;
  if (typeof raw.text !== "string") return null;
  // Merge missing fields with defaults so older payloads upgrade cleanly.
  const base = defaultGlyphRun();
  return {
    ...base,
    ...(raw as Partial<GlyphRun>),
    gradient: {
      ...base.gradient,
      ...(isObject(raw.gradient) ? raw.gradient : {}),
    },
    texture: {
      ...base.texture,
      ...(isObject(raw.texture) ? raw.texture : {}),
    },
    stroke: {
      ...base.stroke,
      ...(isObject(raw.stroke) ? raw.stroke : {}),
    },
    highlight: {
      ...base.highlight,
      ...(isObject(raw.highlight) ? raw.highlight : {}),
    },
    shadow: {
      ...base.shadow,
      ...(isObject(raw.shadow) ? raw.shadow : {}),
    },
  } as GlyphRun;
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function cloneLayer(layer: TextLayer): TextLayer {
  // Structured-clone style deep copy via JSON. Layers contain no
  // non-JSON values so this is safe.
  return JSON.parse(JSON.stringify(layer));
}
