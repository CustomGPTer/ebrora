// src/components/site-photo-stamp/GalleryItemView.tsx
//
// Single stamped record view.
//
// Batch 5: Share + PDF buttons are wired.
//   • Share: Web Share API with file attachment, mailto fallback.
//   • Export PDF: full-page A4 single-photo report.
"use client";

import { useEffect, useRef, useState } from "react";
import type { StampedRecord, Tier, Settings } from "@/lib/site-photo-stamp/types";
import { TEMPLATE_MAP } from "@/lib/site-photo-stamp/templates";
import { formatCoordsDecimal } from "@/lib/site-photo-stamp/geolocation";
import { deleteRecord } from "@/lib/site-photo-stamp/gallery-db";
import { sharePhoto, shareViaMailto, buildRecordFilename } from "@/lib/site-photo-stamp/share";
import { generatePdf, buildPdfFilename } from "@/lib/site-photo-stamp/pdf-export";

interface Props {
  record: StampedRecord;
  tier: Tier;
  settings: Settings;
  onClose: () => void;
  onDeleted: () => void;
  onToast: (msg: string) => void;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 animate-in slide-in-from-bottom duration-200">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete this record?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          This permanently removes the stamped photo from this device. Files you've already saved
          or shared are not affected.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-t border-gray-100 first:border-t-0">
      <span className="shrink-0 w-20 text-[11px] font-semibold uppercase tracking-wider text-gray-400 pt-0.5">
        {label}
      </span>
      <p className={`flex-1 text-sm ${mono ? "font-mono" : "font-medium"} text-gray-900 break-words leading-snug`}>
        {value}
      </p>
    </div>
  );
}

export default function GalleryItemView({ record, tier, settings, onClose, onDeleted, onToast }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const pdfLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const u = URL.createObjectURL(record.imageBlob);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [record.imageBlob]);

  const tmpl = TEMPLATE_MAP[record.templateId];
  const templateTitle = tmpl?.title ?? record.meta.templateTitle;

  const save = () => {
    const url = URL.createObjectURL(record.imageBlob);
    const a = linkRef.current ?? document.createElement("a");
    a.href = url;
    a.download = buildRecordFilename(record, "jpg");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const outcome = await sharePhoto(record);
      if (outcome === "unsupported") {
        shareViaMailto(record);
        onToast("Opened your email app — attach the saved photo to the draft.");
      } else if (outcome === "error") {
        onToast("Couldn't open the share sheet. Try saving the photo and sharing manually.");
      }
    } finally {
      setSharing(false);
    }
  };

  const exportPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const blob = await generatePdf({
        records: [record],
        settings,
        tier,
        companyName: settings.companyName || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = pdfLinkRef.current ?? document.createElement("a");
      a.href = url;
      a.download = buildPdfFilename([record]);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  const del = async () => {
    setConfirming(false);
    try {
      await deleteRecord(record.id);
    } catch {
      // Still treat as deleted — the gallery will re-load and show truth.
    }
    onDeleted();
  };

  const hasCoords = record.meta.lat != null && record.meta.lon != null;

  return (
    <div className="pb-28">
      <section className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
          aria-label="Back to gallery"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Record
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">{templateTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-red-600 hover:bg-red-50 active:scale-95 transition"
          aria-label="Delete this record"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </section>

      <section className="px-4 pb-4">
        <div className="rounded-xl overflow-hidden bg-black shadow-sm">
          {previewUrl && (
            <img src={previewUrl} alt={templateTitle} className="w-full h-auto block" />
          )}
        </div>
      </section>

      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl border border-gray-100">
          <MetaRow label="Time" value={formatTimestamp(record.meta.timestamp)} />
          {hasCoords && (
            <MetaRow
              label="Location"
              value={formatCoordsDecimal(record.meta.lat!, record.meta.lon!, 6)}
              mono
            />
          )}
          {record.meta.address && <MetaRow label="Address" value={record.meta.address} />}
          {record.meta.projectName && <MetaRow label="Project" value={record.meta.projectName} />}
          {record.meta.siteName && <MetaRow label="Site" value={record.meta.siteName} />}
          {record.meta.contractor && <MetaRow label="Contractor" value={record.meta.contractor} />}
          {record.meta.operative && <MetaRow label="Operative" value={record.meta.operative} />}
          <MetaRow label="Record ID" value={record.meta.uniqueId} mono />
        </div>
      </section>

      <section className="px-4">
        <button
          type="button"
          onClick={save}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${
            saved ? "bg-emerald-600 text-white" : "bg-[#1B5B50] text-white hover:bg-[#144540]"
          }`}
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
              Save to device
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
      </section>

      <a ref={linkRef} className="hidden" aria-hidden />
      <a ref={pdfLinkRef} className="hidden" aria-hidden />

      {confirming && <ConfirmDelete onCancel={() => setConfirming(false)} onConfirm={del} />}
    </div>
  );
}
