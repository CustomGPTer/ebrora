// =============================================================================
// Visualise — Preset Type Definitions
// Every preset in the catalogue conforms to the Preset<TData> interface.
// TData is the Zod-validated shape of that preset's content (steps, bars, nodes, etc.).
// =============================================================================

import type { ComponentType, ReactElement } from 'react';
import type { z } from 'zod';
import type { PaletteId, VisualSettings } from '../types';

/** The 11 top-level taxonomy buckets from §10.2. */
export type PresetCategory =
  | 'flow'
  | 'process'
  | 'timeline'
  | 'hierarchy'
  | 'relationships'
  | 'comparison'
  | 'positioning'
  | 'funnel-pyramid'
  | 'cycle'
  | 'charts'
  | 'construction';

/** Props passed to a preset's render function. */
export interface PresetRenderProps<TData = unknown> {
  data: TData;
  settings: VisualSettings;
  /** Target width in SVG user units. The preset chooses an appropriate viewBox. */
  width: number;
  /** Target height in SVG user units. */
  height: number;
}

/**
 * A single preset definition.
 *
 * Naming: use `Preset<TData>` where TData is inferred from the Zod schema via
 * z.infer — this keeps defaultData and render prop-typing in sync automatically.
 *
 * Example:
 *   const schema = z.object({ steps: z.array(z.object({ label: z.string() })) });
 *   type Data = z.infer<typeof schema>;
 *   export const myPreset: Preset<Data> = { ... };
 */
export interface Preset<TData = unknown> {
  /** Stable slug used in blob storage, URLs, and AI responses. Kebab-case. */
  id: string;
  /** Human-readable name for UI pickers (e.g. "Linear Flow — 4 Steps"). */
  name: string;
  category: PresetCategory;
  /** Free-text tags to help AI matching (e.g. ['process', 'sequence']). */
  tags: string[];
  /** One-line description shown in preset gallery tooltips. */
  description: string;
  /**
   * Longer description injected into the AI system prompt.
   * Tell the AI when to pick this preset — what concept pattern it matches.
   */
  aiDescription: string;
  /** Zod schema validating the shape of `data`. */
  dataSchema: z.ZodType<TData>;
  /** Sample/demo data that satisfies dataSchema. Used for preview page and empty state. */
  defaultData: TData;
  /** Static inline SVG snippet for gallery thumbnails (typically viewBox 0 0 120 80). */
  thumbnailSvg: string;
  /**
   * React component that renders the visual as SVG.
   * Must be a pure function of props — no external state, no refs, no side effects.
   */
  render: ComponentType<PresetRenderProps<TData>> | ((props: PresetRenderProps<TData>) => ReactElement);
  /**
   * Field paths within `data` that are safe for inline text-edit on the document view.
   * The canvas editor can edit anything, but these are the fast-path inline edits.
   */
  editableFields: string[];
  /**
   * Preset families this one can losslessly swap into.
   * If user cycles and the target preset's category is in this list, the current
   * data is passed through directly. Otherwise the AI is asked to re-map, or data
   * is reset to defaultData (UI asks for confirmation).
   */
  compatibleFamilies: PresetCategory[];
}

/** Convenience type for the registry — all presets stored as unknown-data. */
export type AnyPreset = Preset<unknown>;
