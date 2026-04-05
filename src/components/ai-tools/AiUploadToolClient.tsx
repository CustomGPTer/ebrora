'use client';

// =============================================================================
// AiUploadToolClient — Full Component
// Used by: Programme Checker (/programme-checker-builder)
//          RAMS Review Tool  (/rams-review-builder)
//
// UX flow:
//   1. Signed-out / free tier → locked overlay (same message as other restricted tools)
//   2. Upload step → drag-drop or click, format badges, size limit shown
//   3. Processing step → animated progress steps
//   4. Download step → filename, expiry, download button
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { AiToolConfig } from '@/lib/ai-tools/types';

interface AiUploadToolClientProps {
  toolConfig: AiToolConfig;
  /** Programme Checker multi-template — passed to upload route */
  programmeCheckerTemplateSlug?: string;
}

type UploadStep = 'upload' | 'processing' | 'download' | 'error';

interface DownloadData {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
  generationId: string;
  fileType: string;
  characterCount: number;
}

// ─── Processing steps shown during upload/analysis ───────────────────────────
const PROCESSING_STEPS = [
  'Uploading file to secure server…',
  'Extracting document content…',
  'Parsing structure and data…',
  'Analysing with AI…',
  'Identifying issues and gaps…',
  'Building review report…',
  'Generating professional document…',
  'Finalising and packaging…',
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function UploadIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function SpinnerIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`animate-spin ${className}`} style={style} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DocumentIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AiUploadToolClient({ toolConfig, programmeCheckerTemplateSlug }: AiUploadToolClientProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const accentColor = `#${toolConfig.accentColor}`;

  // ── Access check ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch(`/api/ai-tools/check-access?tool=${toolConfig.slug}`);
        if (res.ok) {
          const data = await res.json();
          setIsLocked(!data.allowed);
          if (!data.allowed && data.tier === 'NONE') setUpgradeRequired(false); // not signed in
          if (!data.allowed && data.limit === 0) setUpgradeRequired(true);
        }
      } catch {
        // fail open
      } finally {
        setAccessChecked(true);
      }
    }
    checkAccess();
  }, [toolConfig.slug]);

  // ── Processing animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'processing') {
      processingTimerRef.current = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < PROCESSING_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 3500);
    }
    return () => {
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    };
  }, [step]);

  // ── File validation ──────────────────────────────────────────────────────
  function validateFile(file: File): string | null {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 10 MB.`;
    }

    const ext = file.name.toLowerCase().split('.').pop() || '';
    const allowedExts = (toolConfig.uploadFormats || []).map(f =>
      f.toLowerCase().replace('xer / xml', 'xer').replace(' / ', '/').split('/').map(x => x.trim().replace('.', ''))
    ).flat();

    // Build accepted extension list
    const accepted = ['pdf', 'xlsx', 'xls', 'docx', 'xer', 'xml'];
    if (toolConfig.slug === 'programme-checker') {
      // PDF, XLSX, XER/XML
      if (!['pdf', 'xlsx', 'xls', 'xer', 'xml'].includes(ext)) {
        return `File type .${ext} is not accepted. Please upload a PDF, Excel (.xlsx), or P6/MSP export (.xer or .xml) file.`;
      }
    } else if (toolConfig.slug === 'rams-review') {
      // PDF, DOCX, XLSX
      if (!['pdf', 'docx', 'xlsx', 'xls'].includes(ext)) {
        return `File type .${ext} is not accepted. Please upload a PDF, Word document (.docx), or Excel workbook (.xlsx).`;
      }
    }

    return null;
  }

  // ── Drag and drop ────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }, []);

  function handleFileSelected(file: File) {
    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      setStep('error');
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
    // Auto-scroll to the submit button so it's obvious
    setTimeout(() => {
      submitBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  }

  // ── Submit upload ────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return;

    setStep('processing');
    setProcessingStep(0);
    // Scroll to top so the user sees the spinner
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('toolSlug', toolConfig.slug);
      if (programmeCheckerTemplateSlug) {
        formData.append('programmeCheckerTemplateSlug', programmeCheckerTemplateSlug);
      }

      // 5-minute client-side timeout to match Vercel maxDuration=300
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch('/api/ai-tools/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Safely parse JSON — Vercel timeouts return HTML, not JSON
      let data: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Non-JSON response (Vercel 504 timeout, HTML error page, etc.)
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(
          res.status === 504
            ? 'The document took too long to process. Please try a smaller file or try again in a moment.'
            : `Server error (${res.status}). Please try again.`
        );
        setStep('error');
        return;
      }

      if (!res.ok) {
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(data.error || 'An error occurred. Please try again.');
        setStep('error');
        return;
      }

      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setDownloadData(data);
      setStep('download');
    } catch (err: any) {
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      const msg = err.name === 'AbortError'
        ? 'The request timed out. Please try a smaller file or try again.'
        : err.name === 'TypeError'
        ? 'Network error. Please check your connection and try again.'
        : (err.message || 'Something went wrong. Please try again.');
      setErrorMessage(msg);
      setStep('error');
    }
  }

  function handleReset() {
    setStep('upload');
    setSelectedFile(null);
    setErrorMessage(null);
    setDownloadData(null);
    setProcessingStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Locked overlay ───────────────────────────────────────────────────────
  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SpinnerIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gray-100">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{toolConfig.name}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {upgradeRequired
              ? 'This tool is available on Starter, Professional, and Unlimited plans.'
              : 'Please sign in to use this tool.'}
          </p>
          {upgradeRequired ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ backgroundColor: accentColor }}
            >
              View Plans
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ backgroundColor: accentColor }}
            >
              Sign In
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ─── UPLOAD STEP ─────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI-Powered Review
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{toolConfig.name}</h1>
            <p className="text-gray-500 text-sm">{toolConfig.description}</p>
          </div>

          {/* Upload instructions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <p className="text-sm text-gray-600 mb-4">{toolConfig.uploadInstructions}</p>

            {/* Format badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(toolConfig.uploadFormats || []).map(fmt => (
                <span
                  key={fmt}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                  style={{ borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}08` }}
                >
                  {fmt}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100">
                Max 10 MB
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? accentColor : (selectedFile ? accentColor : '#E5E7EB'),
                backgroundColor: isDragging ? `${accentColor}08` : (selectedFile ? `${accentColor}05` : '#FAFAFA'),
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept={
                  toolConfig.slug === 'programme-checker'
                    ? '.pdf,.xlsx,.xls,.xer,.xml'
                    : '.pdf,.docx,.xlsx,.xls'
                }
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <DocumentIcon className="w-6 h-6" style={{ color: accentColor } as any} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <p className="text-xs text-gray-400">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <UploadIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key sections preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Your report will include
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {toolConfig.keySections.slice(0, 8).map((section, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-xs text-gray-600">{section}</span>
                </div>
              ))}
              {toolConfig.keySections.length > 8 && (
                <p className="text-xs text-gray-400 pl-4">
                  + {toolConfig.keySections.length - 8} more sections
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            ref={submitBtnRef}
            onClick={handleUpload}
            disabled={!selectedFile}
            className={`w-full py-4 rounded-xl font-bold text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 ${selectedFile ? 'animate-pulse ring-2 ring-offset-2 shadow-lg' : ''}`}
            style={{
              backgroundColor: selectedFile ? accentColor : '#9CA3AF',
              ...(selectedFile ? { ringColor: accentColor, animationDuration: '2s' } : {}),
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {selectedFile ? '⬇ Start AI Review Now — Analyse Your Document' : 'Upload a file above to get started'}
          </button>
        </div>
      </div>
    );
  }

  // ─── PROCESSING STEP ─────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <SpinnerIcon className="w-8 h-8" style={{ color: accentColor } as any} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Analysing your document</h2>
            <p className="text-sm text-gray-500">
              {selectedFile?.name} — this usually takes 30–60 seconds
            </p>
          </div>

          {/* Processing steps */}
          <div className="space-y-3">
            {PROCESSING_STEPS.map((stepText, i) => {
              const isDone = i < processingStep;
              const isActive = i === processingStep;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    ) : isActive ? (
                      <SpinnerIcon className="w-5 h-5" style={{ color: accentColor } as any} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  <span className={`text-sm ${isDone ? 'text-gray-400 line-through' : isActive ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── DOWNLOAD STEP ───────────────────────────────────────────────────────
  if (step === 'download' && downloadData) {
    const expiryDate = new Date(downloadData.expiresAt);
    const expiryStr = expiryDate.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">

          {/* Success icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <CheckIcon className="w-8 h-8" style={{ color: accentColor } as any} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Your report is ready</h2>
          <p className="text-sm text-gray-500 mb-6">
            {toolConfig.documentLabel} generated from <strong>{selectedFile?.name}</strong>
          </p>

          {/* File info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <DocumentIcon className="w-5 h-5" style={{ color: accentColor } as any} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{downloadData.filename}</p>
                <p className="text-xs text-gray-400 mt-0.5">Expires {expiryStr}</p>
              </div>
            </div>
          </div>

          {/* Download button */}
          <a
            href={downloadData.downloadUrl}
            download={downloadData.filename}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 mb-3"
            style={{ backgroundColor: accentColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download {toolConfig.documentLabel}
          </a>

          {/* Analyse another */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl font-medium text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all"
          >
            Analyse another file
          </button>

          {/* Disclaimer */}
          <p style={{
            marginTop: '2rem',
            fontSize: '0.75rem',
            color: '#6B7280',
            maxWidth: '400px',
            textAlign: 'center',
            lineHeight: '1.5',
          }}>
            Ebrora can make mistakes. Always review AI-generated documents before use and verify compliance with current regulations and site-specific requirements.
          </p>
        </div>
      </div>
    );
  }

  // ─── ERROR STEP ──────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMessage || 'An unexpected error occurred. Please try again.'}</p>
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ backgroundColor: accentColor }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back to tools
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
