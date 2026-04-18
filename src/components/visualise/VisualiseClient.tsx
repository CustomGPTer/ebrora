'use client';

// =============================================================================
// VisualiseClient — top-level client component for paid users.
// Manages:
//   - Quota/access polling via /api/visualise/access
//   - View state: 'generate' (empty) → 'document' (has visuals)
//   - Current document state (in-memory edits, dirty tracking)
//   - Integration with Save / Reset / Regenerate
//   - Canvas editor overlay (Batch 6) — listens for `visualise:open-canvas`
//     events dispatched from VisualCard and mounts <CanvasEditor> over the
//     document view.
//   - Export modal (Batch 7) — listens for `visualise:open-export` events
//     dispatched from DocumentView's Export button and mounts <ExportModal>.
//
// The canvas editor mutates the same in-memory document state via the
// existing `updateVisual` callback. Closing the editor just unmounts —
// changes persist in memory; the document-level Save button flushes them
// to disk like any other edit.
//
// AMENDMENT (Batch 9): CanvasEditor and ExportModal are now lazy-loaded via
// next/dynamic with ssr: false. Both are large and only needed after the
// user interacts with a document, so they don't need to ship in the initial
// client bundle. Loading skeletons appear momentarily while the chunks
// fetch — typical sub-100 ms on Vercel's edge.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  VisualiseDocumentBlob,
  VisualInstance,
  AccessResponse,
  VisualCountPreference,
} from '@/lib/visualise/types';

import GenerateScreen from './GenerateScreen';
import DocumentView from './DocumentView';
import QuotaBar from './QuotaBar';
import DraftList from './DraftList';

// ── Lazy-loaded heavy components (Batch 9 bundle split) ─────────────────────
// CanvasEditor pulls in the full preset registry, selection/drag/resize
// logic, sidebar panels, text edit registry, history stack, etc. It's only
// opened when the user clicks Edit on a VisualCard, so it doesn't need to
// be in the initial bundle.
const CanvasEditor = dynamic(() => import('./Canvas/CanvasEditor'), {
  ssr: false,
  loading: () => <CanvasEditorLoadingOverlay />,
});

// ExportModal pulls in html2canvas and jspdf (via its helpers), both of
// which are large. Only opened when the user clicks Export.
const ExportModal = dynamic(() => import('./Export/ExportModal'), {
  ssr: false,
  loading: () => <ExportModalLoadingOverlay />,
});

function CanvasEditorLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-[#1B5B50] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 text-sm">Loading canvas editor…</p>
      </div>
    </div>
  );
}

function ExportModalLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl px-6 py-5 shadow-xl text-center">
        <div className="inline-block w-7 h-7 border-4 border-[#1B5B50] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-gray-600 text-sm">Preparing export…</p>
      </div>
    </div>
  );
}

interface Props {
  tier: string;
  initialDocumentId?: string;
}

type View = 'generate' | 'document' | 'loading';

export default function VisualiseClient({ tier, initialDocumentId }: Props) {
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [view, setView] = useState<View>(initialDocumentId ? 'loading' : 'generate');
  const [document, setDocument] = useState<VisualiseDocumentBlob | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(initialDocumentId ?? null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Canvas editor — which visual is being edited right now, or null if closed.
  // Opened by a `visualise:open-canvas` custom event dispatched from VisualCard.
  const [editingVisualId, setEditingVisualId] = useState<string | null>(null);

  // Export modal — open/closed toggle, opened by `visualise:open-export` event.
  const [exportOpen, setExportOpen] = useState(false);

  // ── Access / quota refresh ──────────────────────────────────────────────
  const refreshAccess = useCallback(async () => {
    try {
      const res = await fetch('/api/visualise/access', { cache: 'no-store' });
      if (res.ok) {
        setAccess((await res.json()) as AccessResponse);
      }
    } catch {
      // Non-fatal — quota bar will show dashes until next refresh.
    }
  }, []);

  useEffect(() => {
    refreshAccess();
  }, [refreshAccess]);

  // ── Load initial draft if deep-linked ───────────────────────────────────
  useEffect(() => {
    if (!initialDocumentId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/visualise/drafts/${initialDocumentId}`, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setError('Could not load this draft.');
          return;
        }
        const blob = (await res.json()) as VisualiseDocumentBlob;
        if (!cancelled) {
          setDocument(blob);
          setDocumentId(initialDocumentId);
          setView('document');
        }
      } catch {
        if (!cancelled) setError('Could not load this draft.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDocumentId]);

  // ── Canvas-editor open listener ─────────────────────────────────────────
  // VisualCard's Edit button dispatches `visualise:open-canvas` with
  // `{ detail: { visualId } }`. We mount <CanvasEditor> when that fires.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<{ visualId?: string }>;
      const visualId = ce.detail?.visualId;
      if (typeof visualId === 'string' && visualId.length > 0) {
        setEditingVisualId(visualId);
      }
    };
    window.addEventListener('visualise:open-canvas', onOpen as EventListener);
    return () => window.removeEventListener('visualise:open-canvas', onOpen as EventListener);
  }, []);

  // If the currently-edited visual disappears from the document (e.g. deleted
  // via the document view while the editor is open), close the editor.
  useEffect(() => {
    if (!editingVisualId || !document) return;
    const stillThere = document.visuals.some((v) => v.id === editingVisualId);
    if (!stillThere) setEditingVisualId(null);
  }, [editingVisualId, document]);

  const closeCanvas = useCallback(() => {
    setEditingVisualId(null);
  }, []);

  // ── Export-modal open listener ─────────────────────────────────────────
  // DocumentView's Export button dispatches `visualise:open-export` (no
  // detail payload). We mount <ExportModal> when that fires.
  useEffect(() => {
    const onOpenExport = () => setExportOpen(true);
    window.addEventListener('visualise:open-export', onOpenExport);
    return () => window.removeEventListener('visualise:open-export', onOpenExport);
  }, []);

  // If the document is cleared out (Reset / New draft) while the modal is
  // open, close the modal too — nothing left to export.
  useEffect(() => {
    if (!document && exportOpen) setExportOpen(false);
  }, [document, exportOpen]);

  const closeExport = useCallback(() => {
    setExportOpen(false);
  }, []);

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (text: string, forcePresetId?: string, visualCountPreference?: VisualCountPreference) => {
      setIsGenerating(true);
      setError(null);
      try {
        const res = await fetch('/api/visualise/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            forcePresetId: forcePresetId || undefined,
            visualCountPreference: visualCountPreference === 'any' ? undefined : visualCountPreference,
          }),
        });

        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error ?? 'Generation failed');
          return;
        }

        setDocument(payload.document as VisualiseDocumentBlob);
        setDocumentId(payload.documentId);
        setIsDirty(false);
        setView('document');
        refreshAccess();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Generation failed');
      } finally {
        setIsGenerating(false);
      }
    },
    [refreshAccess],
  );

  // ── Regenerate one visual ───────────────────────────────────────────────
  const handleRegenerateVisual = useCallback(
    async (visualId: string) => {
      if (!documentId) return;
      setIsGenerating(true);
      setError(null);
      try {
        const res = await fetch('/api/visualise/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, visualId }),
        });
        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error ?? 'Regenerate failed');
          return;
        }
        setDocument(payload.document as VisualiseDocumentBlob);
        // Regenerate writes the blob server-side, so client state matches the blob again.
        setIsDirty(false);
        refreshAccess();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Regenerate failed');
      } finally {
        setIsGenerating(false);
      }
    },
    [documentId, refreshAccess],
  );

  // ── In-memory mutations (Save will flush; canvas editor uses these) ─────
  const updateDocumentTitle = useCallback((title: string) => {
    setDocument((prev) => (prev ? { ...prev, title } : prev));
    setIsDirty(true);
  }, []);

  const updateVisual = useCallback((visualId: string, patch: Partial<VisualInstance>) => {
    setDocument((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        visuals: prev.visuals.map((v) => (v.id === visualId ? { ...v, ...patch } : v)),
      };
    });
    setIsDirty(true);
  }, []);

  const deleteVisual = useCallback((visualId: string) => {
    setDocument((prev) => {
      if (!prev) return prev;
      const remaining = prev.visuals
        .filter((v) => v.id !== visualId)
        .map((v, i) => ({ ...v, order: i }));
      return { ...prev, visuals: remaining };
    });
    setIsDirty(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!documentId || !document) return;
    try {
      const res = await fetch('/api/visualise/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, blobPayload: document }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? 'Save failed');
        return;
      }
      setIsDirty(false);
      refreshAccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [documentId, document, refreshAccess]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (!documentId) return;
    try {
      await fetch(`/api/visualise/drafts/${documentId}`, { method: 'DELETE' });
    } catch {
      /* ignore — still reset locally */
    }
    setDocument(null);
    setDocumentId(null);
    setIsDirty(false);
    setEditingVisualId(null);
    setExportOpen(false);
    setView('generate');
    refreshAccess();
  }, [documentId, refreshAccess]);

  // ── New draft ───────────────────────────────────────────────────────────
  const handleNewDraft = useCallback(() => {
    if (isDirty && !confirm('You have unsaved changes. Start a new draft anyway?')) return;
    setDocument(null);
    setDocumentId(null);
    setIsDirty(false);
    setEditingVisualId(null);
    setExportOpen(false);
    setView('generate');
  }, [isDirty]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pt-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B5B50]">Visualise</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4A44C] bg-[#FDF6E8] px-2 py-0.5 rounded">
            New
          </span>
          <QuotaBar access={access} />
        </div>
        <div className="flex items-center gap-2">
          <DraftList currentDocumentId={documentId} />
          <button
            type="button"
            onClick={handleNewDraft}
            className="px-4 py-2 rounded-lg bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144840] transition-colors"
          >
            New draft
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 text-sm font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* View */}
      {view === 'loading' ? (
        <div className="py-20 text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#1B5B50] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading draft…</p>
        </div>
      ) : view === 'generate' ? (
        <GenerateScreen
          access={access}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          tier={tier}
        />
      ) : document ? (
        <DocumentView
          document={document}
          isDirty={isDirty}
          isGenerating={isGenerating}
          onUpdateTitle={updateDocumentTitle}
          onUpdateVisual={updateVisual}
          onDeleteVisual={deleteVisual}
          onRegenerateVisual={handleRegenerateVisual}
          onSave={handleSave}
          onReset={handleReset}
        />
      ) : null}

      {/* Canvas editor overlay — mounts on `visualise:open-canvas` event. */}
      {document && editingVisualId ? (
        <CanvasEditor
          document={document}
          editingVisualId={editingVisualId}
          onUpdateVisual={updateVisual}
          onClose={closeCanvas}
        />
      ) : null}

      {/* Export modal — mounts on `visualise:open-export` event. */}
      {document && exportOpen ? (
        <ExportModal document={document} onClose={closeExport} />
      ) : null}
    </div>
  );
}
