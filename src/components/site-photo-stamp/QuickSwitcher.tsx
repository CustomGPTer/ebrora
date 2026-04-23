// src/components/site-photo-stamp/QuickSwitcher.tsx
//
// Quick-switcher pill with bottom-sheet modal.
//
// Surfaces the current template + variant as a compact tappable pill on
// the captured-preview and result screens. Tapping opens a bottom-sheet
// modal that hosts the full banded TemplateGrid — same component used on
// the landing screen — so the user can change selection without going all
// the way back.
//
// The pill is decorative on the result screen (the stamp is already baked
// in); changes take effect for the next capture. The captured-preview
// screen re-uses the changed variant when Apply stamp is tapped, so
// switching there changes the stamped output.
"use client";

import { useEffect, useState } from "react";
import TemplateGrid from "./TemplateGrid";
import LockControl from "./LockControl";
import type {
  Template,
  TemplateVariant,
  TemplateId,
  VariantId,
} from "@/lib/site-photo-stamp/types";

interface Props {
  template: Template;
  variant: TemplateVariant;
  onSelect: (templateId: TemplateId, variantId: VariantId) => void;

  lockedTemplate?: TemplateId;
  lockedVariant?: VariantId;
  onToggleLock?: (templateId: TemplateId, variantId: VariantId) => void;
  /** Whether the *currently-selected* pair is locked. Drives the chip. */
  lockActive?: boolean;

  recentlyUsed?: { template: Template; variant: TemplateVariant } | null;
}

export default function QuickSwitcher({
  template,
  variant,
  onSelect,
  lockedTemplate,
  lockedVariant,
  onToggleLock,
  lockActive = false,
  recentlyUsed,
}: Props) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Dismiss on Escape for desktop / PWA keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelect = (t: TemplateId, v: VariantId) => {
    onSelect(t, v);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-800 active:scale-[0.98] hover:bg-gray-50 transition-colors max-w-full min-w-0"
        aria-label={`Current template: ${template.title}, ${variant.label}. Tap to change.`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0 border border-gray-200"
          style={{ backgroundColor: template.baseColor }}
          aria-hidden
        />
        <span className="truncate text-[13px] font-semibold text-gray-900">
          {template.title}
        </span>
        <span className="text-[11px] text-gray-500 shrink-0">
          · {variant.label}
        </span>
        {lockActive && (
          <span
            className="text-[10px] font-bold uppercase tracking-wide text-amber-600 shrink-0"
            aria-label="Locked"
          >
            🔒
          </span>
        )}
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Change template"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />

          {/* Sheet */}
          <div className="relative z-10 bg-white w-full max-h-[88vh] rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Change template
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Pick a new template for your next photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {onToggleLock && (
                <div className="mb-4">
                  <LockControl
                    template={template}
                    variant={variant}
                    locked={lockActive}
                    onToggle={() => onToggleLock(template.id, variant.id)}
                  />
                </div>
              )}

              <TemplateGrid
                selectedTemplate={template.id}
                selectedVariant={variant.id}
                onSelect={handleSelect}
                lockedTemplate={lockedTemplate}
                lockedVariant={lockedVariant}
                onToggleLock={onToggleLock}
                recentlyUsed={recentlyUsed ?? null}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
