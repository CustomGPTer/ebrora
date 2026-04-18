// =============================================================================
// Visualise — Shared Types
// Top-level document/blob schema, visual instance shape, canvas state.
// Preset-specific data shapes live in src/lib/visualise/presets/*.
//
// AMENDMENT (Batch 3): Added `sourceText` to VisualiseDocumentBlob so the
// regenerate endpoint can re-call the AI with the user's original context
// when they click Regenerate on an individual visual card.
//
// AMENDMENT (Batch 6c): Added optional `hidden` flag on `VisualCanvasState.nodes[id]`
// for soft-delete. A hidden node is still present in the preset's data + the
// canvas state, but rendered with `display: none` by CanvasEditor's DOM
// transform effect. Reversible via undo. Fixed-length preset schemas (e.g.
// `flow-linear-4step` requires exactly 4 steps) can't accept hard-delete,
// so every preset supports soft-hide uniformly.
// =============================================================================

import type { PresetCategory } from './presets/types';

/** IDs of the 6 built-in palettes (see palettes.ts). */
export type PaletteId =
  | 'ebrora-primary'
  | 'ebrora-gold'
  | 'hi-vis'
  | 'slate'
  | 'mono'
  | 'earth';

/** Per-visual rendering settings. */
export interface VisualSettings {
  paletteId: PaletteId;
  font: string;
  showTitle: boolean;
  layout?: 'horizontal' | 'vertical' | 'radial';
  /** Maps node ID → hex colour for per-node overrides from the canvas editor. */
  customColors: Record<string, string>;
}

/** Canvas state for a single visual — positions, z-order, groups. */
export interface VisualCanvasState {
  viewBox: { x: number; y: number; w: number; h: number };
  nodes: Record<
    string,
    {
      /** Translation delta from the node's natural SVG position (6b). */
      x: number;
      y: number;
      /** Scale factor applied around the natural bbox origin — default 1 (6b). */
      w: number;
      h: number;
      /** Stacking override. Higher = rendered later (on top). Default 0 (6c). */
      zIndex: number;
      /** Optional group membership (6b). */
      groupId?: string;
      /** Soft-delete flag (6c). Hidden nodes render as display:none. */
      hidden?: boolean;
    }
  >;
  groups: Record<string, { nodeIds: string[] }>;
}

/** A single visual inside a document. */
export interface VisualInstance {
  /** Client-generated UUID. */
  id: string;
  /** Matches a preset in the catalogue. */
  presetId: string;
  title: string;
  /** Preset-specific payload; validated against that preset's Zod schema at runtime. */
  data: unknown;
  settings: VisualSettings;
  canvas: VisualCanvasState;
  /** Stack order within the document — used for vertical placement in DocumentView. */
  order: number;
}

/**
 * The full blob payload stored in Vercel Blob per draft.
 * Versioned so we can evolve the schema without breaking old drafts.
 */
export interface VisualiseDocumentBlob {
  schemaVersion: 1;
  title: string;
  /**
   * The original text the user pasted at Generate time.
   * Preserved so per-visual Regenerate has the full context when re-calling the AI.
   * Truncated to the canonical word cap at store time (see VISUALISE_TEXT_MAX_WORDS).
   */
  sourceText: string;
  visuals: VisualInstance[];
  createdAt: string;
  updatedAt: string;
}

/** Visual count preference the user can send with a Generate request. */
export type VisualCountPreference = 1 | 2 | 3 | 'any';

/** Request body for POST /api/visualise/generate. */
export interface GenerateRequest {
  /**
   * User-pasted text for a new generation. Required if `visualId` is absent.
   * If `visualId` is present (regenerate mode), server uses the blob's stored
   * sourceText instead and this field is ignored.
   */
  text?: string;
  forcePresetId?: string;
  visualCountPreference?: VisualCountPreference;
  /** Present when writing into an existing draft (regenerate or replace-all). */
  documentId?: string;
  /**
   * Present when regenerating a single visual inside an existing document.
   * Requires documentId to be set. Cost: 1 use, same as a full generation.
   */
  visualId?: string;
}

/** Response from GET /api/visualise/access. */
export interface AccessResponse {
  allowed: boolean;
  tier: string; // SubscriptionTier at runtime — kept loose here to avoid Prisma client import in client code
  limit: number;
  used: number;
  remaining: number;
  draftCount: number;
  draftLimit: number;
}

/** Lightweight draft card data for the draft list UI. */
export interface DraftSummary {
  id: string;
  title: string | null;
  visualCount: number;
  lastSavedAt: string; // ISO
  expiresAt: string; // ISO
  daysUntilExpiry: number;
}

/** Re-export for callers that import both from one place. */
export type { PresetCategory };
