// src/components/site-photo-stamp/LockControl.tsx
//
// Shared lock chip.
//
// Shows the current lock state for the user's current template selection
// with a short plain-English explainer, and offers a single button to
// toggle it. Used in three places:
//   • Landing screen — above the template grid.
//   • Captured preview — next to the quick-switcher pill.
//   • Result screen — next to the quick-switcher pill.
//
// The component is presentational. State transitions are owned by the
// parent (which composes `engageLock` / `releaseLock` from
// sticky-selection.ts into a Settings patch).
"use client";

import type { Template, TemplateVariant } from "@/lib/site-photo-stamp/types";

interface Props {
  template: Template;
  variant: TemplateVariant;
  /** True when a lock is currently live on exactly this template + variant. */
  locked: boolean;
  /** Called to engage (if unlocked) or release (if locked). */
  onToggle: () => void;
  /** When true, render a compact single-row version for capture/result screens. */
  compact?: boolean;
}

function LockIcon({ locked, className = "w-4 h-4" }: { locked: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={locked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={locked ? 1.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" fill="none" />
    </svg>
  );
}

export default function LockControl({
  template,
  variant,
  locked,
  onToggle,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors active:scale-[0.98] ${
          locked
            ? "bg-amber-500 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
        aria-pressed={locked}
        aria-label={
          locked
            ? `Unlock ${template.title}`
            : `Lock ${template.title} for 6 hours`
        }
      >
        <LockIcon locked={locked} className="w-3.5 h-3.5" />
        {locked ? "Locked · 6h" : "Lock"}
      </button>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        locked
          ? "bg-amber-50 border-amber-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          locked ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-500"
        }`}
      >
        <LockIcon locked={locked} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 leading-tight">
          {locked ? "Locked to this template" : "Lock template for the shift"}
        </p>
        <p className="text-[11.5px] text-gray-600 leading-snug mt-0.5">
          {locked ? (
            <>
              <span className="font-medium text-gray-900">{template.title}</span>{" "}
              · {variant.label} — stays on for 6 hours after the last photo.
              Tap Unlock to end it early.
            </>
          ) : (
            <>
              Keeps <span className="font-medium text-gray-900">{template.title}</span>{" "}
              · {variant.label} on for every photo for the next 6 hours. Best
              for site safety walk-arounds.
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors active:scale-[0.98] ${
          locked
            ? "bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
            : "bg-[#1B5B50] text-white hover:bg-[#144540]"
        }`}
        aria-pressed={locked}
      >
        {locked ? "Unlock" : "Lock"}
      </button>
    </div>
  );
}
