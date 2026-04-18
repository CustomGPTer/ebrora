'use client';

// =============================================================================
// DocumentView — stacked visual cards with an inline-editable title at the top
// and a footer toolbar (Save / Export / Reset).
// =============================================================================

import { useState } from 'react';
import type { VisualiseDocumentBlob, VisualInstance } from '@/lib/visualise/types';
import VisualCard from './VisualCard';
import ResetModal from './ResetModal';

interface Props {
  document: VisualiseDocumentBlob;
  isDirty: boolean;
  isGenerating: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateVisual: (visualId: string, patch: Partial<VisualInstance>) => void;
  onDeleteVisual: (visualId: string) => void;
  onRegenerateVisual: (visualId: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export default function DocumentView({
  document,
  isDirty,
  isGenerating,
  onUpdateTitle,
  onUpdateVisual,
  onDeleteVisual,
  onRegenerateVisual,
  onSave,
  onReset,
}: Props) {
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document.title);
  const [resetOpen, setResetOpen] = useState(false);

  const commitTitle = () => {
    setTitleEditing(false);
    if (titleDraft.trim() && titleDraft !== document.title) {
      onUpdateTitle(titleDraft.trim());
    } else {
      setTitleDraft(document.title);
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
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
                setTitleDraft(document.title);
                setTitleEditing(false);
              }
            }}
            className="w-full text-2xl font-bold text-[#1B5B50] bg-white border border-[#1B5B50] rounded px-2 py-1 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleDraft(document.title);
              setTitleEditing(true);
            }}
            className="w-full text-left group"
          >
            <h2 className="text-2xl font-bold text-[#1B5B50] inline-flex items-center gap-2">
              {document.title}
              <span className="text-xs font-normal text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                click to edit
              </span>
            </h2>
          </button>
        )}
        {isDirty ? (
          <p className="text-xs text-amber-700 mt-1">Unsaved changes</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">{document.visuals.length} visual{document.visuals.length === 1 ? '' : 's'}</p>
        )}
      </div>

      {/* Visual cards */}
      {document.visuals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-600 mb-3">All visuals have been removed.</p>
          <button
            type="button"
            onClick={onReset}
            className="text-[#1B5B50] font-semibold hover:underline"
          >
            Start a new draft
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {document.visuals
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((visual) => (
              <VisualCard
                key={visual.id}
                visual={visual}
                isGenerating={isGenerating}
                onUpdate={(patch) => onUpdateVisual(visual.id, patch)}
                onDelete={() => onDeleteVisual(visual.id)}
                onRegenerate={() => onRegenerateVisual(visual.id)}
              />
            ))}
        </div>
      )}

      {/* Footer toolbar */}
      <div className="sticky bottom-0 mt-6 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || isGenerating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isDirty && !isGenerating
                ? 'bg-[#1B5B50] text-white hover:bg-[#144840]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save draft
          </button>
          <span className="text-xs text-gray-500">
            {isDirty ? 'Unsaved' : 'Saved'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              // Batch 7: open export modal. For now, dispatch event so a late-
              // merging ExportModal can listen without coupling in Batch 4.
              window.dispatchEvent(new CustomEvent('visualise:open-export'));
            }}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg border border-[#1B5B50] text-[#1B5B50] text-sm font-semibold hover:bg-[#E6F0EE] transition-colors disabled:opacity-50"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      <ResetModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          onReset();
        }}
      />
    </div>
  );
}
