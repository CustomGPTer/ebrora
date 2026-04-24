// src/components/site-photo-stamp/CapturedPreview.tsx
//
// Preview screen shown after the capture pipeline completes. Displays the
// downscaled photo with the metadata we extracted (timestamp, location,
// unique ID) plus the template/variant the user had selected.
//
// "Apply stamp" is stubbed here — the real stamp compositor ships in Batch 3.
// "Retake" discards the capture and returns to the landing screen.
"use client";

import { useEffect, useState } from "react";
import type { CapturedPhoto } from "@/lib/site-photo-stamp/capture";
import type {
  Template,
  TemplateVariant,
  TemplateId,
  VariantId,
} from "@/lib/site-photo-stamp/types";
import {
  formatCoordsDecimal,
} from "@/lib/site-photo-stamp/geolocation";
import QuickSwitcher from "./QuickSwitcher";
import LockControl from "./LockControl";

interface Props {
  captured: CapturedPhoto;
  template: Template;
  variant: TemplateVariant;
  onRetake: () => void;
  /** Called with the optional note text when the user taps Apply stamp. */
  onApply: (note: string) => void;

  // ── Sticky-template wiring (Batch 7) ──
  onTemplateChange?: (templateId: TemplateId, variantId: VariantId) => void;
  lockedTemplate?: TemplateId;
  lockedVariant?: VariantId;
  onToggleLock?: (templateId: TemplateId, variantId: VariantId) => void;
  lockActive?: boolean;
  recentlyUsed?: { template: Template; variant: TemplateVariant } | null;
}

const NOTE_MAX = 200;

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

export default function CapturedPreview({
  captured,
  template,
  variant,
  onRetake,
  onApply,
  onTemplateChange,
  lockedTemplate,
  lockedVariant,
  onToggleLock,
  lockActive = false,
  recentlyUsed = null,
}: Props) {
  const [note, setNote] = useState("");

  // Revoke preview URL when unmounting or when the captured object changes.
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(captured.previewUrl);
    };
  }, [captured.previewUrl]);

  const { meta, locationUnavailable, addressUnavailable } = captured;
  const hasCoords = meta.lat != null && meta.lon != null;

  return (
    <div className="pb-28">
      {/* Top bar */}
      <section className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onRetake}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
          aria-label="Discard and start again"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {onTemplateChange ? (
            <QuickSwitcher
              template={template}
              variant={variant}
              onSelect={onTemplateChange}
              lockedTemplate={lockedTemplate}
              lockedVariant={lockedVariant}
              onToggleLock={onToggleLock}
              lockActive={lockActive}
              recentlyUsed={recentlyUsed}
            />
          ) : (
            <p className="text-sm font-semibold text-gray-900 truncate">
              {template.title} · {variant.label}
            </p>
          )}
          {onToggleLock && (
            <LockControl
              template={template}
              variant={variant}
              locked={lockActive}
              onToggle={() => onToggleLock(template.id, variant.id)}
              compact
            />
          )}
        </div>
      </section>

      {/* Photo */}
      <section className="px-4 pb-3">
        <div className="relative rounded-xl overflow-hidden bg-black shadow-sm">
          <img
            src={captured.previewUrl}
            alt="Captured photo preview"
            className="w-full h-auto block"
            width={captured.width}
            height={captured.height}
          />
          {/* Mock stamp — approximates how the selected template will render. */}
          <div className="absolute left-2 right-2 bottom-2 pointer-events-none">
            {variant.id === "transparent" ? (
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-wide"
                style={{
                  color: template.baseColor,
                  textShadow:
                    "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 2px rgba(255,255,255,0.9)",
                }}
              >
                {template.title}
              </span>
            ) : (
              <div
                className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md shadow-sm"
                style={{
                  backgroundColor:
                    variant.id === "solid"
                      ? `${variant.accentColor}CC`
                      : variant.accentColor,
                  color: variant.textColor,
                }}
              >
                {template.title}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Note input (optional) */}
      <section className="px-4 pb-4">
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Note <span className="normal-case tracking-normal font-normal text-gray-400">(optional)</span>
            </span>
            <span className={`text-[10px] ${note.length > NOTE_MAX - 20 ? "text-amber-600" : "text-gray-400"}`}>
              {note.length} / {NOTE_MAX}
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            placeholder="Add a short description e.g. trip hazard at entrance, cones now placed"
            rows={3}
            maxLength={NOTE_MAX}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50] focus:outline-none resize-none leading-snug"
          />
        </label>
        <p className="mt-1 text-[10px] text-gray-400 leading-relaxed">
          Appears under the template title on the stamp, up to 3 lines.
        </p>
      </section>

      {/* Metadata card */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          <MetaRow
            label="Time"
            value={formatTimestamp(meta.timestamp)}
            hint={meta.timestampSource === "exif" ? "From photo EXIF" : "From device clock"}
          />
          <MetaRow
            label="Location"
            value={
              hasCoords
                ? formatCoordsDecimal(meta.lat!, meta.lon!, 6)
                : "Unavailable"
            }
            hint={
              locationUnavailable
                ? "Enable location in your browser to stamp GPS coordinates"
                : undefined
            }
            warn={locationUnavailable}
          />
          <MetaRow
            label="Address"
            value={meta.address ?? (hasCoords ? "Unavailable" : "—")}
            warn={hasCoords && addressUnavailable}
            hint={
              hasCoords && addressUnavailable
                ? "Coordinates are stamped — address will retry on the next photo"
                : undefined
            }
          />
          <MetaRow label="Record ID" value={meta.uniqueId} mono />
        </div>
      </section>

      {/* Action row */}
      <section className="px-4">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 py-3.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={() => onApply(note.trim())}
            className="flex-1 py-3.5 rounded-xl bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144540] transition-colors active:scale-[0.98] shadow-sm"
          >
            Apply stamp
          </button>
        </div>
        <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
          Stamp is composited on your device. Nothing is uploaded.
        </p>
      </section>
    </div>
  );
}

// ─── Meta row ───────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
  mono?: boolean;
}

function MetaRow({ label, value, hint, warn, mono }: RowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="shrink-0 w-20 text-[11px] font-semibold uppercase tracking-wider text-gray-400 pt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            mono ? "font-mono" : "font-medium"
          } ${warn ? "text-amber-700" : "text-gray-900"} break-words`}
        >
          {value}
        </p>
        {hint && (
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
