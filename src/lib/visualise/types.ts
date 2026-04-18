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
//
// AMENDMENT (Batch 10 — "Variants & Sub-text"):
//   Added per-VisualInstance fields:
//     - variants           : up to 3 AI-picked alternate {presetId, data} pairs
//                            covering the same concept in different visual styles.
//                            The active preset+data is NOT duplicated in the
//                            variants array — they represent the *other* options.
//     - caption            : 1–3 sentences of prose context for the whole visual
//                            (~200 chars). Rendered below the visual.
//     - nodeDescriptions   : ordered list of ~120-char node descriptions.
//                            Index-aligned with whatever the preset treats as its
//                            primary node list (steps, events, rows, etc.).
//                            Rendered as an ordered list below the caption.
//     - previousState      : 1-step undo snapshot captured just before a preset
//                            swap. Only the fields that change on a swap are
//                            stored. Cleared once the user swaps again or saves.
//   Rationale: chose VisualInstance-level fields over per-preset schema changes
//   to avoid touching all 50 preset Zod schemas and render functions. Captions
//   and descriptions survive preset switches unchanged. See phase-1 handover.
//
// AMENDMENT (Batch 1 bug fix — "Slot overflow + reasoning"):
//   Added optional top-level `reasoning` on VisualiseDocumentBlob. Carries the
//   AI's chain-of-thought explaining concept count + preset choice, so the
//   DocumentView can render a dismissible banner above the visuals. Optional
//   for backward compatibility with pre-Batch-1 drafts.
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

/**
 * A single alternate preset+data pair the AI generated alongside the active one.
 * The active visual's presetId + data are NOT stored here — variants are the
 * *other* options the user can swap to instantly without an AI round-trip.
 *
 * When a variant is promoted to active (user clicks the pill), the current
 * active preset+data pair is pushed back into the variants list so the swap
 * is reversible within the same session.
 */
export interface VariantOption {
  presetId: string;
  /** Preset-specific payload; validated against that preset's dataSchema. */
  data: unknown;
  /** Optional title the AI proposed for this variant. Falls back to visual.title if absent. */
  title?: string;
}

/**
 * 1-step undo snapshot, captured before a preset swap or auto-remap.
 * Only the fields that a swap touches are stored — keeps the blob small.
 * `cause` is a UI hint ('variant-swap' | 'gallery-pick' | 'auto-remap').
 */
export interface PreviousVisualState {
  presetId: string;
  data: unknown;
  title: string;
  variants: VariantOption[];
  caption?: string;
  nodeDescriptions?: string[];
  cause: 'variant-swap' | 'gallery-pick' | 'auto-remap';
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
  /**
   * Up to 3 alternate preset+data pairs the AI generated alongside the active
   * one. Empty array for legacy visuals generated before Batch 10. Swapping
   * between these is a pure client-side operation — no AI call, no quota.
   */
  variants?: VariantOption[];
  /**
   * 1–3 sentence narrative caption for the whole visual (~200 chars).
   * Rendered as a paragraph below the visual.
   */
  caption?: string;
  /**
   * Ordered list of ~120-char descriptions for the primary nodes of the visual.
   * Index-aligned with the preset's primary node list. Rendered as an ordered
   * list below the caption. Survives preset swaps — the list is semantic, not
   * preset-specific.
   */
  nodeDescriptions?: string[];
  /**
   * 1-step undo snapshot, present only immediately after a swap. Cleared
   * when the user swaps again, saves, regenerates, or dismisses the undo UI.
   */
  previousState?: PreviousVisualState;
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
  /**
   * Batch 1: AI's chain-of-thought from the most recent generate/regenerate.
   * 1–4 sentences explaining concept count + preset choices. Optional for
   * backward compat with pre-Batch-1 drafts (renderer hides the banner when
   * absent). Refreshed on every full generate; partial single-visual
   * regenerate returns its own reasoning but only the full-generate value
   * is persisted to the blob.
   */
  reasoning?: string;
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
  /**
   * Batch 10: when true, each generated concept should return 3 preset
   * variants instead of 1. The first variant becomes active; the other 2
   * become `variants` on the VisualInstance. Ignored in regenerate mode.
   * Default: true for new generations (opt-out only).
   */
  variantMode?: boolean;
  /**
   * Batch 10: marks this request as a silent auto-remap triggered by the
   * user cycling to a preset outside the variant set. Server treats this
   * identically to a visualId regenerate (same quota cost) but the client
   * suppresses the "regenerate warning" modal. Requires visualId + forcePresetId.
   */
  silent?: boolean;
  /**
   * Batch CQ: answers from the clarifying-questions flow, if the user went
   * through it. Each answer is {topic, value}. The server converts these
   * into authoritative hints in the system prompt — the AI must honour them
   * when choosing preset, count, palette, etc. Empty or absent means the
   * user either skipped clarification or had nothing to clarify.
   * Session-scoped client-side; never persisted.
   */
  clarifyAnswers?: Array<{ topic: string; value: string }>;
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
