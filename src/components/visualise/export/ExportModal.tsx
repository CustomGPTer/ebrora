'use client';

// =============================================================================
// ExportModal — PNG / SVG / PDF export for the current document.
//
// Mounted by VisualiseClient on the `visualise:open-export` CustomEvent.
// Reads the full document from props (parent passes it), never refetches.
//
// The modal itself renders a HIDDEN staging area containing one `<svg>` per
// visual, rendered via each preset's own `Render` component. The export
// helpers read from this staging area rather than scraping DocumentView,
// which keeps export working even if the canvas editor is on top.
//
// Fields (matching the Batch 7 spec):
//   Format radio: PNG / SVG / PDF
//   PNG resolution: 1× / 2× / 3×   (default 2×)
//   PDF page size: A4 P / A4 L / A3 P / A3 L   (default A4 L)
//   PDF layout: one-per-page / continuous   (default one-per-page)
//   Logo upload: PNG/JPG/SVG, ≤ VISUALISE_LOGO_MAX_BYTES, injected top-right
//   Filename prefix: defaults to slugified title; editable
//
// Logo capping happens in the file handler (1 MB from constants). Export
// handlers are dynamically imported so their dep trees (jspdf, html2canvas)
// don't bloat the initial bundle.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { getPresetById } from '@/lib/visualise/presets';
import type {
  VisualInstance,
  VisualiseDocumentBlob,
} from '@/lib/visualise/types';
import { VISUALISE_LOGO_MAX_BYTES } from '@/lib/visualise/constants';
import {
  loadLogo,
  slugifyFilename,
  type LogoInfo,
} from './exportHelpers';

type Format = 'png' | 'svg' | 'pdf';
type PngRes = 1 | 2 | 3;
type PdfPage = 'a4-portrait' | 'a4-landscape' | 'a3-portrait' | 'a3-landscape';
type PdfLayout = 'per-page' | 'continuous';

interface Props {
  document: VisualiseDocumentBlob;
  onClose: () => void;
}

const STAGE_W = 800;
const STAGE_H = 400;

export default function ExportModal({ document: docBlob, onClose }: Props) {
  const [format, setFormat] = useState<Format>('png');
  const [pngRes, setPngRes] = useState<PngRes>(2);
  const [pdfPage, setPdfPage] = useState<PdfPage>('a4-landscape');
  const [pdfLayout, setPdfLayout] = useState<PdfLayout>('per-page');
  const [filenamePrefix, setFilenamePrefix] = useState<string>(() =>
    slugifyFilename(docBlob.title || 'visualise'),
  );
  const [logo, setLogo] = useState<LogoInfo | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  // ── Escape closes the modal (unless an export is in progress). ─────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const onLogoChange = async (f: File | null) => {
    setLogoError(null);
    if (!f) {
      setLogo(null);
      return;
    }
    if (f.size > VISUALISE_LOGO_MAX_BYTES) {
      setLogoError('Logo is too large. 1 MB maximum.');
      return;
    }
    const ok = /^image\/(png|jpe?g|svg\+xml)$/.test(f.type);
    if (!ok) {
      setLogoError('Use a PNG, JPG, or SVG.');
      return;
    }
    const info = await loadLogo(f);
    if (!info) {
      setLogoError('Could not read the image.');
      return;
    }
    setLogo(info);
  };

  // Collect stage visuals — one <svg> DOM node per visual from the hidden
  // staging div. Called at export-time so the caller gets live references.
  const collectStageVisuals = (): Array<{ visual: VisualInstance; svg: SVGSVGElement }> => {
    const out: Array<{ visual: VisualInstance; svg: SVGSVGElement }> = [];
    const root = stageRef.current;
    if (!root) return out;
    for (const v of docBlob.visuals) {
      const wrap = root.querySelector<HTMLElement>(`[data-stage-visual-id="${v.id}"]`);
      const svg = wrap?.querySelector<SVGSVGElement>('svg');
      if (svg) out.push({ visual: v, svg });
    }
    return out;
  };

  const runExport = async () => {
    if (busy) return;
    setExportError(null);
    setBusy(true);
    try {
      const stageVisuals = collectStageVisuals();
      if (stageVisuals.length === 0) {
        setExportError('No visuals to export.');
        return;
      }
      const prefix = filenamePrefix.trim() || slugifyFilename(docBlob.title || 'visualise');

      if (format === 'png') {
        const { exportPng } = await import('./exportPng');
        await exportPng(stageVisuals, {
          resolution: pngRes,
          filenamePrefix: prefix,
          logo,
        });
      } else if (format === 'svg') {
        const { exportSvg } = await import('./exportSvg');
        await exportSvg(stageVisuals, { filenamePrefix: prefix, logo });
      } else {
        const { exportPdf } = await import('./exportPdf');
        await exportPdf(stageVisuals, {
          pageSize: pdfPage,
          layout: pdfLayout,
          filenamePrefix: prefix,
          logo,
        });
      }

      // Close on successful export.
      onClose();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const visualCount = docBlob.visuals.length;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export document"
      onClick={(e) => {
        if (busy) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Export</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Format ────────────────────────────────────────────────── */}
          <Field label="Format">
            <div className="flex gap-2">
              {(['png', 'svg', 'pdf'] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    format === f
                      ? 'border-[#1B5B50] bg-[#E6F0EE] text-[#1B5B50]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={format === f}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {format === 'png'
                ? 'Raster image. Best for slides and email.'
                : format === 'svg'
                  ? 'Vector. Best for editing in Illustrator or Figma.'
                  : 'Portable document. Best for print and distribution.'}
            </p>
          </Field>

          {/* ── Format-specific options ──────────────────────────────── */}
          {format === 'png' ? (
            <Field label="Resolution">
              <div className="flex gap-2">
                {([1, 2, 3] as PngRes[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPngRes(r)}
                    className={`flex-1 border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      pngRes === r
                        ? 'border-[#1B5B50] bg-[#E6F0EE] text-[#1B5B50]'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={pngRes === r}
                  >
                    {r}×
                  </button>
                ))}
              </div>
            </Field>
          ) : null}

          {format === 'pdf' ? (
            <>
              <Field label="Page size">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['a4-portrait', 'A4 portrait'],
                    ['a4-landscape', 'A4 landscape'],
                    ['a3-portrait', 'A3 portrait'],
                    ['a3-landscape', 'A3 landscape'],
                  ] as Array<[PdfPage, string]>).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPdfPage(key)}
                      className={`border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        pdfPage === key
                          ? 'border-[#1B5B50] bg-[#E6F0EE] text-[#1B5B50]'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-pressed={pdfPage === key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              {visualCount > 1 ? (
                <Field label="Layout">
                  <div className="flex gap-2">
                    {([
                      ['per-page', 'One per page'],
                      ['continuous', 'Continuous'],
                    ] as Array<[PdfLayout, string]>).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPdfLayout(key)}
                        className={`flex-1 border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          pdfLayout === key
                            ? 'border-[#1B5B50] bg-[#E6F0EE] text-[#1B5B50]'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-pressed={pdfLayout === key}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              ) : null}
            </>
          ) : null}

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Field label="Logo (optional)">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <span>{logo ? 'Replace logo' : 'Choose file'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    // Reset so choosing the same file twice still fires onChange.
                    e.currentTarget.value = '';
                    onLogoChange(f);
                  }}
                />
              </label>
              {logo ? (
                <>
                  <img
                    src={logo.dataUrl}
                    alt="Logo preview"
                    className="h-8 w-auto border border-gray-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  PNG, JPG or SVG. Up to {Math.round(VISUALISE_LOGO_MAX_BYTES / (1024 * 1024))} MB.
                </p>
              )}
            </div>
            {logoError ? <p className="mt-1 text-xs text-red-700">{logoError}</p> : null}
          </Field>

          {/* ── Filename prefix ───────────────────────────────────────── */}
          <Field label="Filename">
            <input
              type="text"
              value={filenamePrefix}
              onChange={(e) => setFilenamePrefix(e.target.value)}
              onBlur={() => setFilenamePrefix((p) => slugifyFilename(p))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B5B50] focus:border-[#1B5B50] outline-none"
              placeholder="visualise"
            />
            <p className="mt-1 text-xs text-gray-500">
              {visualCount > 1
                ? `Becomes "${slugifyFilename(filenamePrefix) || 'visualise'}.zip" containing one file per visual.`
                : `Becomes "${slugifyFilename(filenamePrefix) || 'visualise'}.${format}".`}
            </p>
          </Field>

          {exportError ? (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <p className="text-sm text-red-800">{exportError}</p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={runExport}
            disabled={busy || visualCount === 0}
            className="px-4 py-2 bg-[#1B5B50] text-white text-sm font-semibold rounded-md hover:bg-[#144840] disabled:opacity-50"
          >
            {busy ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Hidden staging area ─────────────────────────────────────────
          Renders each visual's preset SVG off-screen so the exporters can
          read the DOM without depending on DocumentView being visible.
          Positioned at -100000px (not display:none) so getBBox still works. */}
      <div
        ref={stageRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-100000px',
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        {docBlob.visuals.map((v) => (
          <StageVisual key={v.id} visual={v} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

/** Renders a single visual's preset into the staging area. */
function StageVisual({ visual }: { visual: VisualInstance }) {
  const preset = useMemo(() => getPresetById(visual.presetId), [visual.presetId]);
  if (!preset) {
    return <div data-stage-visual-id={visual.id} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Render = preset.render as any;
  return (
    <div data-stage-visual-id={visual.id}>
      <Render
        data={visual.data}
        settings={visual.settings}
        width={STAGE_W}
        height={STAGE_H}
      />
    </div>
  );
}
