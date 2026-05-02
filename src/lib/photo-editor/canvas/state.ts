// src/lib/photo-editor/canvas/state.ts
//
// Pure-logic editor state machine. Provides:
//   • createBlankProject() — factory for a fresh, empty canvas
//   • createInitialEditorState() — fresh editor runtime state
//   • editorReducer() — the action dispatcher
//
// No React, no DOM. Wired into EditorContext in /components/photo-editor/context.
//
// Session 7 changes:
//   • Replaced flat `zoom` + `pan` fields with a single `viewport` slice
//     (translateX / translateY / zoom / rotation). Fits-to-screen is
//     handled by CanvasShell computing a separate fitScale at render
//     time, so viewport.zoom = 1 always means "fits the available area".
//   • New action SET_VIEWPORT — replaces SET_ZOOM and SET_PAN. Not
//     undoable (viewport is ephemeral view state).
//   • LOAD_PROJECT now also resets the viewport to default.

import type {
  AnyLayer,
  Background,
  BackgroundFilters,
  EditorState,
  Id,
  Project,
  Rect,
  Tool,
  Viewport,
} from "../types";
import {
  DEFAULT_BACKGROUND_FILTERS,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_VIEWPORT,
  PROJECT_SCHEMA_VERSION,
} from "../types";
import { newId } from "../util/id";

// ─── Factories ──────────────────────────────────────────────────

const WHITE_BG: Background = { kind: "solid", color: "#FFFFFF" };

export function createBlankProject(opts?: {
  width?: number;
  height?: number;
  background?: Background;
  name?: string;
}): Project {
  const now = Date.now();
  return {
    id: newId("proj"),
    name: opts?.name ?? "Untitled",
    width: opts?.width ?? DEFAULT_CANVAS_SIZE.width,
    height: opts?.height ?? DEFAULT_CANVAS_SIZE.height,
    background: opts?.background ?? WHITE_BG,
    filters: cloneFilters(DEFAULT_BACKGROUND_FILTERS),
    layers: [],
    layerOrder: [],
    createdAt: now,
    updatedAt: now,
    schemaVersion: PROJECT_SCHEMA_VERSION,
  };
}

function cloneFilters(f: BackgroundFilters): BackgroundFilters {
  return {
    adjust: { ...f.adjust },
    effect: f.effect,
    blur: { ...f.blur },
  };
}

export function createInitialEditorState(project?: Project): EditorState {
  return {
    project: project ?? createBlankProject(),
    activeTool: null,
    selection: [],
    runSelection: null,
    viewport: { ...DEFAULT_VIEWPORT },
    panMode: false,
    gridVisible: false,
    // Grid spacing in canvas pixels at 1:1 zoom. 0 = off (gridVisible
    // remains the on/off switch for legacy callers; gridSize stores
    // the active preset across cycles). May 2026 — Width/Grid build.
    gridSize: 24,
    snapEnabled: false,
  };
}

// ─── Action types ───────────────────────────────────────────────

export type EditorAction =
  | { type: "LOAD_PROJECT"; project: Project }
  | { type: "SET_BACKGROUND"; background: Background }
  | { type: "SET_FILTERS"; filters: BackgroundFilters }
  | { type: "ADD_LAYER"; layer: AnyLayer }
  | { type: "REMOVE_LAYER"; id: Id }
  | { type: "UPDATE_LAYER"; id: Id; patch: Partial<AnyLayer> }
  | { type: "REORDER_LAYERS"; order: Id[] }
  | { type: "DUPLICATE_LAYER"; id: Id }
  | { type: "SET_SELECTION"; ids: Id[] }
  | {
      type: "SET_RUN_SELECTION";
      layerId: Id | null;
      start: number;
      end: number;
    }
  | { type: "SET_TOOL"; tool: Tool | null }
  | { type: "SET_VIEWPORT"; viewport: Viewport }
  | { type: "TOGGLE_PAN_MODE" }
  | { type: "TOGGLE_GRID" }
  | { type: "TOGGLE_SNAP" }
  | { type: "RENAME_PROJECT"; name: string }
  | { type: "RESIZE_CANVAS"; width: number; height: number }
  // True-crop apply: atomically updates the photo background's crop
  // rect AND resizes the project canvas to match the crop's aspect
  // ratio. Done in a single action so it produces ONE history entry
  // (Cmd-Z undoes the whole crop in one step) and so the canvas /
  // background stay aspect-aligned at all times — preventing the
  // PhotoRect distortion bug where a portrait crop into a square
  // canvas gets stretched. crop=null clears any existing crop.
  | {
      type: "APPLY_CROP";
      crop: Rect | null;
      projectWidth: number;
      projectHeight: number;
    };

// ─── Reducer ────────────────────────────────────────────────────

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "LOAD_PROJECT":
      return {
        ...state,
        project: action.project,
        selection: [],
        runSelection: null,
        viewport: { ...DEFAULT_VIEWPORT },
      };

    case "SET_BACKGROUND":
      return withProjectPatch(state, { background: action.background });

    case "SET_FILTERS":
      return withProjectPatch(state, { filters: action.filters });

    case "ADD_LAYER": {
      const layer = action.layer;
      const project = state.project;
      const layers = [...project.layers, layer];
      const layerOrder = [...project.layerOrder, layer.id];
      return withProjectPatch(state, { layers, layerOrder });
    }

    case "REMOVE_LAYER": {
      const project = state.project;
      const layers = project.layers.filter((l) => l.id !== action.id);
      const layerOrder = project.layerOrder.filter((id) => id !== action.id);
      return {
        ...state,
        project: { ...project, layers, layerOrder, updatedAt: Date.now() },
        selection: state.selection.filter((id) => id !== action.id),
      };
    }

    case "UPDATE_LAYER": {
      const project = state.project;
      const layers = project.layers.map((l) =>
        l.id === action.id ? ({ ...l, ...action.patch } as AnyLayer) : l
      );
      return withProjectPatch(state, { layers });
    }

    case "REORDER_LAYERS":
      return withProjectPatch(state, { layerOrder: action.order });

    case "DUPLICATE_LAYER": {
      const project = state.project;
      const original = project.layers.find((l) => l.id === action.id);
      if (!original) return state;
      const dup = {
        ...original,
        id: newId("layer"),
        name: `${original.name} copy`,
        transform: {
          ...original.transform,
          x: original.transform.x + 16,
          y: original.transform.y + 16,
        },
      } as AnyLayer;
      const layers = [...project.layers, dup];
      const layerOrder = [...project.layerOrder, dup.id];
      return {
        ...state,
        project: { ...project, layers, layerOrder, updatedAt: Date.now() },
        selection: [dup.id],
      };
    }

    case "SET_SELECTION":
      return { ...state, selection: action.ids, runSelection: null };

    case "SET_RUN_SELECTION":
      return action.layerId === null
        ? { ...state, runSelection: null }
        : {
            ...state,
            runSelection: {
              layerId: action.layerId,
              start: action.start,
              end: action.end,
            },
          };

    case "SET_TOOL":
      return { ...state, activeTool: action.tool };

    case "SET_VIEWPORT":
      return { ...state, viewport: action.viewport };

    case "TOGGLE_PAN_MODE":
      return { ...state, panMode: !state.panMode };

    case "TOGGLE_GRID": {
      // 4-state cycle (May 2026): off → 16 → 32 → 64 → off.
      // gridSize stores the active preset; gridVisible is the visible
      // boolean read by the overlay. The cycle order matches the size
      // labels in EditorTopBar's a11y label.
      const cycle = [16, 32, 64];
      if (!state.gridVisible) {
        return { ...state, gridVisible: true, gridSize: cycle[0] };
      }
      const currentIdx = cycle.indexOf(state.gridSize ?? 24);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= cycle.length) {
        return { ...state, gridVisible: false, gridSize: cycle[0] };
      }
      return { ...state, gridVisible: true, gridSize: cycle[nextIdx] };
    }

    case "TOGGLE_SNAP":
      return { ...state, snapEnabled: !state.snapEnabled };

    case "RENAME_PROJECT":
      return withProjectPatch(state, { name: action.name });

    case "RESIZE_CANVAS":
      return withProjectPatch(state, {
        width: action.width,
        height: action.height,
      });

    case "APPLY_CROP": {
      // Atomic: resize the project AND swap the background's crop in
      // one shot. We require a photo background — for any other kind
      // (solid / gradient / transparent) crop is a no-op so we just
      // resize the canvas.
      const project = state.project;
      const bg = project.background;
      const nextBg: Background =
        bg.kind === "photo" ? { ...bg, crop: action.crop } : bg;
      return withProjectPatch(state, {
        width: action.projectWidth,
        height: action.projectHeight,
        background: nextBg,
      });
    }

    default:
      return state;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function withProjectPatch(
  state: EditorState,
  patch: Partial<Project>
): EditorState {
  return {
    ...state,
    project: { ...state.project, ...patch, updatedAt: Date.now() },
  };
}

// ─── History action labels ──────────────────────────────────────
//
// Returns a human-readable label for the action — used as the snapshot
// label in the undo/redo stack. Empty string means "do not snapshot."
//
// Session 7: SET_VIEWPORT replaces SET_ZOOM / SET_PAN as the non-
// undoable viewport action.

export function describeAction(action: EditorAction): string {
  switch (action.type) {
    case "LOAD_PROJECT":
      return "Open project";
    case "SET_BACKGROUND":
      return "Change background";
    case "SET_FILTERS":
      return "Adjust filters";
    case "ADD_LAYER":
      return "Add layer";
    case "REMOVE_LAYER":
      return "Delete layer";
    case "UPDATE_LAYER":
      return "Edit layer";
    case "REORDER_LAYERS":
      return "Reorder layers";
    case "DUPLICATE_LAYER":
      return "Duplicate layer";
    case "RENAME_PROJECT":
      return "Rename project";
    case "RESIZE_CANVAS":
      return "Resize canvas";
    case "APPLY_CROP":
      return "Crop";

    // Non-undoable: viewport, selection, tool, panel state.
    case "SET_SELECTION":
    case "SET_RUN_SELECTION":
    case "SET_TOOL":
    case "SET_VIEWPORT":
    case "TOGGLE_PAN_MODE":
    case "TOGGLE_GRID":
    case "TOGGLE_SNAP":
      return "";
  }
}

/** Whether a given action mutates the project shape and should snapshot history. */
export function isUndoable(action: EditorAction): boolean {
  return describeAction(action).length > 0;
}
