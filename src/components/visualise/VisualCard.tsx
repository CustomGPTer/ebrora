'use client';

// =============================================================================
// VisualCard — single visual inside DocumentView.
//
// Batch 10 Phase 1 rewrite ("Variants & Sub-text"):
//   - ← → arrows now cycle ONLY through the AI-picked variants (plus the
//     active preset), not the full 50-preset list. Out-of-variant swaps go
//     through the gallery modal, which fires a server-side auto-remap.
//   - New variant pill row (VariantPicker) above the visual body.
//   - New "Browse all templates" button opens TemplateGalleryModal. Picking
//     a preset from the gallery fires onGalleryPick → parent runs a silent
//     auto-remap API call.
//   - Sub-text: caption paragraph + ordered-list node descriptions rendered
//     below the visual body when present on the VisualInstance.
//   - 1-step undo: after any preset swap (variant click, arrow cycle, or
//     gallery pick), a toast shows "Switched to X — Undo". Clicking Undo
//     restores the VisualInstance.previousState. Dismissed after next swap
//     or after 15 seconds.
//
// Callbacks:
//   onUpdate      (patch)                → in-memory update (variants/swap)
//   onDelete      ()                     → remove visual
//   onRegenerate  ()                     → full regenerate via AI (warning modal)
//   onGalleryPick (presetId)             → silent AI auto-remap to this preset
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import type { VisualInstance, VariantOption, PreviousVisualState } from '@/lib/visualise/types';
import { getPresetById } from '@/lib/visualise/presets';
import RegenerateWarningModal from './RegenerateWarningModal';
import VariantPicker from './VariantPicker';
import TemplateGalleryModal from './TemplateGalleryModal';

interface Props {
  visual: VisualInstance;
  isGenerating: boolean;
  onUpdate: (patch: Partial<VisualInstance>) => void;
  onDelete: () => void;
  onRegenerate: (source?: 'original' | 'current-content') => void;
  onGalleryPick: (presetId: string) => void;
}

const UNDO_DISMISS_MS = 15_000;

export default function VisualCard({
  visual,
  isGenerating,
  onUpdate,
  onDelete,
  onRegenerate,
  onGalleryPick,
}: Props) {
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(visual.title);
  const [regenOpen, setRegenOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const preset = useMemo(() => getPresetById(visual.presetId), [visual.presetId]);
  const variants: VariantOption[] = visual.variants ?? [];
  const hasVariants = variants.length > 0;

  // Auto-dismiss the undo toast after 15 seconds of inactivity.
  useEffect(() => {
    if (!visual.previousState) return;
    const t = setTimeout(() => {
      onUpdate({ previousState: undefined });
    }, UNDO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visual.previousState, onUpdate]);

  if (!preset) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-700">
          Unknown preset: <code className="font-mono">{visual.presetId}</code>. This visual can&apos;t
          be rendered. Delete it or regenerate.
        </p>
      </div>
    );
  }

  // ── Variant swap (client-side only, no AI call) ──────────────────────────
  // Clicking a variant pill promotes that variant to active; the currently
  // active preset+data pair is pushed into the variants list so the action
  // is reversible within the session.
  const swapToVariantIndex = (variantIndex: number) => {
    const target = variants[variantIndex];
    if (!target) return;

    const snapshot: PreviousVisualState = {
      presetId: visual.presetId,
      data: visual.data,
      title: visual.title,
      variants: variants,
      caption: visual.caption,
      nodeDescriptions: visual.nodeDescriptions,
      cause: 'variant-swap',
    };

    const newVariants: VariantOption[] = variants.map((v, i) =>
      i === variantIndex
        ? { presetId: visual.presetId, data: visual.data, title: visual.title }
        : v,
    );

    onUpdate({
      presetId: target.presetId,
      data: target.data,
      title: target.title ?? visual.title,
      variants: newVariants,
      previousState: snapshot,
    });
  };

  // ── Arrow cycling (gated to the variant set) ─────────────────────────────
  // Phase 1 scope: arrows cycle through [active, ...variants] as a ring.
  // Out-of-variant presets are reached via the gallery.
  const ringPresetIds = [visual.presetId, ...variants.map((v) => v.presetId)];
  const ringLen = ringPresetIds.length;
  const hasRing = ringLen > 1;

  const cycleRing = (direction: 1 | -1) => {
    if (!hasRing) return;
    // Active is always index 0; direction picks the next variant index (1-based)
    const nextIndex = direction === 1 ? 1 : ringLen - 1;
    // Translate ring-index to variants-array-index (variants index 0 = ring index 1).
    const variantIndex = nextIndex - 1;
    const wrappedVariantIndex = ((variantIndex % variants.length) + variants.length) % variants.length;
    swapToVariantIndex(wrappedVariantIndex);
  };

  // ── Undo ─────────────────────────────────────────────────────────────────
  const undoLastSwap = () => {
    if (!visual.previousState) return;
    const prev = visual.previousState;
    onUpdate({
      presetId: prev.presetId,
      data: prev.data,
      title: prev.title,
      variants: prev.variants,
      caption: prev.caption,
      nodeDescriptions: prev.nodeDescriptions,
      previousState: undefined,
    });
  };

  const dismissUndo = () => onUpdate({ previousState: undefined });

  // ── Gallery pick (server-side silent auto-remap) ─────────────────────────
  // The parent handles the API call; we just capture an undo snapshot first
  // so the user can revert even though the server will have replaced the data.
  const handleGalleryPick = (presetId: string) => {
    const snapshot: PreviousVisualState = {
      presetId: visual.presetId,
      data: visual.data,
      title: visual.title,
      variants: variants,
      caption: visual.caption,
      nodeDescriptions: visual.nodeDescriptions,
      cause: 'gallery-pick',
    };
    // Stash the snapshot so when the parent writes the new visual back in,
    // the previousState travels with it (parent merges rather than replaces).
    onUpdate({ previousState: snapshot });
    onGalleryPick(presetId);
  };

  const commitTitle = () => {
    setTitleEditing(false);
    if (titleDraft.trim() && titleDraft !== visual.title) {
      onUpdate({ title: titleDraft.trim() });
    } else {
      setTitleDraft(visual.title);
    }
  };

  const Render = preset.render as React.ComponentType<{
    data: unknown;
    settings: typeof visual.settings;
    width: number;
    height: number;
  }>;

  const nodeDescriptions = visual.nodeDescriptions ?? [];
  const hasSubText = (visual.caption && visual.caption.trim().length > 0) || nodeDescriptions.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cycle preset — gated to ring (active + variants) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => cycleRing(-1)}
              disabled={!hasRing || isGenerating}
              aria-label="Previous variant"
              title={hasRing ? 'Previous variant' : 'Only one template available'}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => cycleRing(1)}
              disabled={!hasRing || isGenerating}
              aria-label="Next variant"
              title={hasRing ? 'Next variant' : 'Only one template available'}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
            >
              →
            </button>
          </div>

          {/* Title (inline editable) */}
          <div className="min-w-0 flex-1">
            {titleEditing ? (
              <input
                autoFocus
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle();
                  if (e.key === 'Escape') {
                    setTitleDraft(visual.title);
                    setTitleEditing(false);
                  }
                }}
                className="w-full text-sm font-semibold text-[#1B5B50] bg-white border border-[#1B5B50] rounded px-2 py-1 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(visual.title);
                  setTitleEditing(true);
                }}
                className="text-left w-full truncate text-sm font-semibold text-[#1B5B50] hover:text-[#144840]"
              >
                {visual.title}
                <span className="ml-2 text-xs font-normal text-gray-400">{preset.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('visualise:open-canvas', { detail: { visualId: visual.id } }),
              )
            }
            disabled={isGenerating}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-[#1B5B50] hover:bg-[#E6F0EE] disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setRegenOpen(true)}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-[#1B5B50] hover:bg-[#E6F0EE] disabled:opacity-50"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Remove this visual from the document?')) onDelete();
            }}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Variant picker row (only shown when AI returned variants) */}
      {hasVariants ? (
        <VariantPicker
          activePresetId={visual.presetId}
          activeTitle={visual.title}
          activeData={visual.data}
          settings={visual.settings}
          variants={variants}
          disabled={isGenerating}
          onSelect={swapToVariantIndex}
          onReorder={(newVariants) => onUpdate({ variants: newVariants })}
          onOpenGallery={() => setGalleryOpen(true)}
        />
      ) : (
        // Legacy visuals (no variants) still need a way into the gallery
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            disabled={isGenerating}
            className="text-[11px] font-semibold text-[#1B5B50] hover:underline disabled:opacity-50"
          >
            Browse all templates →
          </button>
        </div>
      )}

      {/* Undo toast (after any swap) */}
      {visual.previousState ? (
        <div className="px-4 py-2 bg-[#E6F0EE] border-b border-[#CFE3DF] flex items-start justify-between gap-3">
          <p className="text-xs text-[#1B5B50] flex-1">
            {visual.previousState.cause === 'gallery-pick'
              ? 'Switched template via the gallery.'
              : visual.previousState.cause === 'auto-remap'
                ? 'Re-mapped to a new template.'
                : 'Switched to another AI pick.'}
          </p>
          <button
            type="button"
            onClick={undoLastSwap}
            className="text-xs font-semibold text-[#1B5B50] hover:underline flex-shrink-0"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={dismissUndo}
            className="text-xs font-semibold text-[#1B5B50]/60 hover:text-[#1B5B50] flex-shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}

      {/* Render body */}
      <div className="bg-white p-4">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-hidden">
          <Render
            data={visual.data}
            settings={visual.settings}
            width={800}
            height={400}
          />
        </div>

        {/* Sub-text block — caption + ordered-list descriptions */}
        {hasSubText ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {visual.caption ? (
              <p className="text-sm text-gray-700 leading-relaxed">{visual.caption}</p>
            ) : null}
            {nodeDescriptions.length > 0 ? (
              <ol className="mt-3 space-y-1.5 text-sm text-gray-700">
                {nodeDescriptions.map((desc, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className="flex-shrink-0 w-5 font-semibold text-[#1B5B50] tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="min-w-0">{desc}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Regenerate warning modal */}
      <RegenerateWarningModal
        open={regenOpen}
        templateLocked={Boolean(visual.templateLocked)}
        onClose={() => setRegenOpen(false)}
        onConfirm={(source) => {
          setRegenOpen(false);
          onRegenerate(source);
        }}
      />

      {/* Template gallery modal — for out-of-variant swaps */}
      <TemplateGalleryModal
        open={galleryOpen}
        activePresetId={visual.presetId}
        excludePresetIds={variants.map((v) => v.presetId)}
        onClose={() => setGalleryOpen(false)}
        onPick={handleGalleryPick}
      />
    </div>
  );
}
