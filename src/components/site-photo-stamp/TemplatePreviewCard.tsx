// src/components/site-photo-stamp/TemplatePreviewCard.tsx
//
// Small visual card that previews how a template's variant will look on a
// stamped photo. Used by the template grid on the landing screen and inside
// the quick-switcher modal.
//
// Three variant rendering modes:
//   • solid       — filled coloured strip at the bottom of the faux photo.
//   • transparent — no strip; title text floats on the photo in the
//                   template's base colour with a thin white stroke (matches
//                   the real stamp renderer).
//   • icon        — filled strip + leading badge icon.
//
// A small lock button sits in the top-right corner of every card. Tapping
// it engages or releases the 6-hour lock on that exact template + variant,
// *without* triggering a tap on the card itself (click event stops
// propagation in the lock button).
"use client";

import type {
  Template,
  TemplateVariant,
  StampIcon,
} from "@/lib/site-photo-stamp/types";

interface Props {
  template: Template;
  variant: TemplateVariant;
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
  onLockToggle?: () => void;
}

// ─── Badge icons (lucide-style inline SVG) ───────────────────────

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

// ─── Lock icon ─────────────────────────────────────────────────

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg
      width="14"
      height="14"
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

// ─── Auto-contrast outline ─────────────────────────────────────

/**
 * Picks a contrasting outline colour for transparent-variant titles, so
 * white/pale fills get a dark outline and dark fills get a white outline —
 * matching the canvas renderer's logic so the preview matches the stamp.
 * Templates use hex baseColors, so a hex-only parser is sufficient here.
 */
function contrastingOutline(hex: string): "#FFFFFF" | "#1F2937" {
  const h = hex.trim().replace(/^#/, "");
  let r = 255, g = 255, b = 255;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6 || h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#FFFFFF";
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#1F2937" : "#FFFFFF";
}

// ─── Card ───────────────────────────────────────────────────────

export default function TemplatePreviewCard({
  template,
  variant,
  selected,
  locked = false,
  onClick,
  onLockToggle,
}: Props) {
  const isTransparent = variant.id === "transparent";

  // Ring styling — lock takes precedence visually when engaged.
  const ringClass = selected
    ? "ring-2 ring-[#1B5B50] ring-offset-2 scale-[1.02]"
    : locked
    ? "ring-2 ring-amber-400 ring-offset-1"
    : "ring-1 ring-gray-200 hover:ring-gray-300 active:scale-[0.98]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group flex flex-col items-stretch rounded-xl overflow-hidden transition-all duration-150 text-left bg-white ${ringClass}`}
      aria-pressed={selected}
      aria-label={`${template.title} — ${variant.label}${locked ? ", locked" : ""}`}
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

        {/* Lock button — top-right, stops click propagation */}
        {onLockToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle();
            }}
            className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              locked
                ? "bg-amber-500 text-white shadow"
                : "bg-black/40 text-white/90 hover:bg-black/60"
            }`}
            aria-label={
              locked
                ? `Unlock ${template.title}`
                : `Lock ${template.title} for 6 hours`
            }
            aria-pressed={locked}
          >
            <LockIcon locked={locked} />
          </button>
        )}

        {/* Stamp preview */}
        {isTransparent ? (
          <div
            className="absolute left-2 right-2 bottom-2 flex items-center pointer-events-none"
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wide truncate"
              style={{
                color: template.baseColor,
                // Thin outline mimics the canvas stroke applied by the real
                // stamp renderer. Outline colour auto-contrasts against the
                // fill so white/pale titles don't become an invisible
                // white-on-white blob.
                textShadow: (() => {
                  const o = contrastingOutline(template.baseColor);
                  const oDim = o === "#FFFFFF"
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(31,41,55,0.9)";
                  return `-1px -1px 0 ${o}, 1px -1px 0 ${o}, -1px 1px 0 ${o}, 1px 1px 0 ${o}, 0 0 2px ${oDim}`;
                })(),
              }}
            >
              {template.title}
            </span>
          </div>
        ) : (
          <div
            className="absolute left-2 right-2 bottom-2 rounded-md px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm pointer-events-none"
            style={{
              // Solid variant: 0.8 alpha so the photo shows through, matching
              // the real canvas renderer. Icon variant: full opacity.
              backgroundColor:
                variant.id === "solid"
                  ? `${variant.accentColor}CC`
                  : variant.accentColor,
              color: variant.textColor,
            }}
          >
            {variant.icon && (
              <span className="shrink-0" aria-hidden>
                <BadgeIcon name={variant.icon} colour={variant.textColor} />
              </span>
            )}
            <span className="truncate uppercase tracking-wide">
              {template.title}
            </span>
          </div>
        )}
      </div>

      {/* Card label row.
          `leading-tight` + `mb-0` scope away the global `p { margin-bottom: 1rem }`
          and `body { line-height: 1.6 }` rules in globals.css that would
          otherwise inflate this row by ~33 px per tile. `mt-0.5` puts a tiny
          2 px gap between the title and subtitle lines. py-1 keeps vertical
          padding tight. */}
      <div className="px-2.5 py-1 bg-white border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-900 truncate leading-tight mb-0">
          {template.title}
        </p>
        <p className="text-[10px] truncate leading-tight mb-0 mt-0.5">
          {locked ? (
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              <span aria-hidden>
                <LockIcon locked />
              </span>
              Locked · 6h
            </span>
          ) : (
            <span className="text-gray-500">{variant.label}</span>
          )}
        </p>
      </div>
    </button>
  );
}
