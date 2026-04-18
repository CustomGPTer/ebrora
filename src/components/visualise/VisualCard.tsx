'use client';

// =============================================================================
// VisualCard — single visual inside DocumentView.
// Controls:
//   ← →  cycle preset (client-side swap; data preserved if the new preset's
//                       Zod schema accepts existing data, else defaults are
//                       applied with an inline warning per your spec decision)
//   Edit     → open canvas editor (Batch 6; dispatches event for now)
//   Regenerate → shows warning modal, then calls onRegenerate()
//   Delete   → remove from document (in-memory; Save flushes)
// =============================================================================

import { useMemo, useState } from 'react';
import type { VisualInstance } from '@/lib/visualise/types';
import { getAllPresets, getPresetById } from '@/lib/visualise/presets';
import RegenerateWarningModal from './RegenerateWarningModal';

interface Props {
  visual: VisualInstance;
  isGenerating: boolean;
  onUpdate: (patch: Partial<VisualInstance>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

export default function VisualCard({ visual, isGenerating, onUpdate, onDelete, onRegenerate }: Props) {
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(visual.title);
  const [regenOpen, setRegenOpen] = useState(false);
  const [swapWarning, setSwapWarning] = useState<string | null>(null);

  const preset = useMemo(() => getPresetById(visual.presetId), [visual.presetId]);
  const allPresets = useMemo(() => getAllPresets(), []);

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

  const currentIndex = allPresets.findIndex((p) => p.id === visual.presetId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allPresets.length - 1;

  const cycleTo = (targetIndex: number) => {
    const target = allPresets[targetIndex];
    if (!target) return;

    const parsed = target.dataSchema.safeParse(visual.data);
    if (parsed.success) {
      onUpdate({ presetId: target.id, data: parsed.data });
      setSwapWarning(null);
    } else {
      // Schema mismatch — apply defaults with an inline warning.
      onUpdate({ presetId: target.id, data: target.defaultData });
      setSwapWarning(
        `Data didn't fit "${target.name}" — showing default content. Click Regenerate to let the AI re-map your original text.`,
      );
    }
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

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cycle preset */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => cycleTo(currentIndex - 1)}
              disabled={!hasPrev || isGenerating}
              aria-label="Previous preset"
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => cycleTo(currentIndex + 1)}
              disabled={!hasNext || isGenerating}
              aria-label="Next preset"
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

      {/* Swap warning */}
      {swapWarning ? (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start justify-between gap-3">
          <p className="text-xs text-amber-800 flex-1">{swapWarning}</p>
          <button
            type="button"
            onClick={() => setSwapWarning(null)}
            className="text-xs font-semibold text-amber-800 hover:underline flex-shrink-0"
          >
            Dismiss
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
      </div>

      {/* Regenerate warning modal */}
      <RegenerateWarningModal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        onConfirm={() => {
          setRegenOpen(false);
          onRegenerate();
        }}
      />
    </div>
  );
}
