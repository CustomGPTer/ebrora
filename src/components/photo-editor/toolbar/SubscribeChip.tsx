// src/components/photo-editor/toolbar/SubscribeChip.tsx
//
// Compact "Subscribe" pill for free-tier users — replaces the "Try PRO"
// button from the reference Add Text app. Routes to /pricing on tap.
//
// Visibility rules (Batch 1, mobile-editor rebuild):
//   • Free / unauthenticated user → pill renders (encourages sign-up)
//   • Paid user (any active tier)  → pill is suppressed
//   • While the session resolves   → pill is suppressed (avoid flicker)
//
// We deliberately mirror the visual weight of the reference's Try PRO
// pill (small, dark-on-light, rounded-full) but in Ebrora's brand green
// rather than black. Sits in the Add Layer header on mobile.

"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePaidToolAccess } from "@/hooks/usePaidToolAccess";

interface SubscribeChipProps {
  /** Optional override for the destination. Defaults to /pricing. */
  href?: string;
  /** Optional explicit label. Defaults to "Subscribe". */
  label?: string;
  /** Compact variant — smaller padding, used in tight headers. */
  compact?: boolean;
}

export function SubscribeChip({
  href = "/pricing",
  label = "Subscribe",
  compact = false,
}: SubscribeChipProps) {
  const { isPaid, isLoading } = usePaidToolAccess();

  // Suppress for paid users and while the session resolves — we don't
  // want the chip to flash in for a frame on paid users while NextAuth
  // is still hydrating the session.
  if (isLoading) return null;
  if (isPaid) return null;

  const padX = compact ? "px-3" : "px-3.5";
  const padY = compact ? "py-1" : "py-1.5";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 ${padX} ${padY} rounded-full text-xs font-semibold transition-colors`}
      style={{
        background: "#1B5B50",
        color: "#FFFFFF",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "#144540";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "#1B5B50";
      }}
      aria-label="Subscribe to Ebrora — see pricing plans"
    >
      <Sparkles className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
