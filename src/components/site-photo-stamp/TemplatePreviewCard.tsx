// src/components/site-photo-stamp/TemplatePreviewCard.tsx
//
// Small visual card that previews how a template's variant will look
// on a stamped photo. Used on the landing screen's template grid.
"use client";

import type { Template, TemplateVariant, StampIcon } from "@/lib/site-photo-stamp/types";

interface Props {
  template: Template;
  variant: TemplateVariant;
  selected: boolean;
  onClick: () => void;
}

// ─── Badge icons (lucide-react style, inline SVG) ────────────────

function BadgeIcon({ name, colour }: { name: StampIcon; colour: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: colour,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "check":
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "cross":
      return (
        <svg {...common}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Card ────────────────────────────────────────────────────────

export default function TemplatePreviewCard({ template, variant, selected, onClick }: Props) {
  const isOutline = variant.id === "outline";
  const borderColour = isOutline ? (variant.borderColor ?? template.baseColor) : "transparent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group flex flex-col items-stretch rounded-xl overflow-hidden transition-all duration-150 text-left ${
        selected
          ? "ring-2 ring-[#1B5B50] ring-offset-2 scale-[1.02]"
          : "ring-1 ring-gray-200 hover:ring-gray-300 active:scale-[0.98]"
      }`}
      aria-pressed={selected}
      aria-label={`${template.title} — ${variant.label}`}
    >
      {/* Faux photo area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {/* Simulated photo grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 50%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.15), transparent 50%)",
          }}
        />

        {/* Stamp strip (bottom of 'photo') */}
        <div
          className="absolute left-2 right-2 bottom-2 rounded-md px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm"
          style={{
            backgroundColor: variant.accentColor,
            color: variant.textColor,
            border: isOutline ? `2px solid ${borderColour}` : "none",
          }}
        >
          {variant.icon && (
            <span className="shrink-0" aria-hidden>
              <BadgeIcon name={variant.icon} colour={variant.textColor} />
            </span>
          )}
          <span className="truncate uppercase tracking-wide">{template.title}</span>
        </div>
      </div>

      {/* Card label */}
      <div className="px-2.5 py-2 bg-white border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-900 truncate">
          {template.title}
        </p>
        <p className="text-[10px] text-gray-500">{variant.label}</p>
      </div>
    </button>
  );
}
