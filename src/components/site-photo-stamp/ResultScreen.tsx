// src/components/site-photo-stamp/ResultScreen.tsx
//
// Shown after the stamp compositor has produced a final JPEG.
//
// Batch 5: Share and Export PDF are wired for real.
//   • Share uses the Web Share API with file attachment.
//   • Export PDF creates a full-page single-photo A4 report.
//   • Fallback to mailto: when Web Share isn't available.
"use client";

import { useEffect, useRef, useState } from "react";
import type { StampedRecord, Settings, Tier } from "@/lib/site-photo-stamp/types";
import { sharePhoto, shareViaMailto, buildRecordFilename } from "@/lib/site-photo-stamp/share";
import { generatePdf, buildPdfFilename } from "@/lib/site-photo-stamp/pdf-export";

interface Props {
  stamped: StampedRecord;
  filenameHint?: string;
  tier: Tier;
  settings: Settings;
  onRetake: () => void;
  onToast: (msg: string) => void;
}

export default function ResultScreen({ stamped, tier, settings, onRetake, onToast }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const pdfLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(stamped.imageBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stamped.imageBlob]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const url = URL.createObjectURL(stamped.imageBlob);
      const a = linkRef.current ?? document.createElement("a");
      a.href = url;
      a.download = buildRecordFilename(stamped, "jpg");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const outcome = await sharePhoto(stamped);
      if (outcome === "unsupported") {
        // Fall back to mailto so the user still has a path to share.
        shareViaMailto(stamped);
        onToast("Opened your email app — attach the saved photo to the draft.");
      } else if (outcome === "error") {
        onToast("Couldn't open the share sheet. Try saving the photo and sharing manually.");
      }
      // "shared" and "cancelled" are both terminal — no toast needed.
    } finally {
      setSharing(false);
    }
  };

  const exportPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const blob = await generatePdf({
        records: [stamped],
        settings,
        tier,
        companyName: settings.companyName || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = pdfLinkRef.current ?? document.createElement("a");
      a.href = url;
      a.download = buildPdfFilename([stamped]);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="pb-28">
      <section className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onRetake}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
          aria-label="Start again"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Ready to share
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {stamped.meta.templateTitle}
          </p>
        </div>
      </section>

      <section className="px-4 pb-4">
        <div className="rounded-xl overflow-hidden bg-black shadow-sm">
          {previewUrl && (
            <img src={previewUrl} alt="Stamped site photo" className="w-full h-auto block" />
          )}
        </div>
        <p className="mt-2 text-[11px] text-gray-400 text-center">
          Record ID: <span className="font-mono">{stamped.meta.uniqueId}</span>
        </p>
      </section>

      <section className="px-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${
            saved ? "bg-emerald-600 text-white" : "bg-[#1B5B50] text-white hover:bg-[#144540]"
          } disabled:opacity-70`}
        >
          {saved ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Saved to your device
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Save photo
            </>
          )}
        </button>
      </section>

      <section className="px-4 mt-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={share}
            disabled={sharing}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={pdfBusy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {pdfBusy ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#1B5B50] animate-spin" />
                Building…
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={onRetake}
          className="mt-2.5 w-full py-3 rounded-xl bg-transparent border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.98]"
        >
          New photo
        </button>
      </section>

      <a ref={linkRef} className="hidden" aria-hidden />
      <a ref={pdfLinkRef} className="hidden" aria-hidden />
    </div>
  );
}
