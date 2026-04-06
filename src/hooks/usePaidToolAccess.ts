// src/hooks/usePaidToolAccess.ts
"use client";

import { useSession } from "next-auth/react";

const PAID_TIERS = new Set(["STARTER", "STANDARD", "PROFESSIONAL", "UNLIMITED"]);

/**
 * Hook for paid tool gating.
 * Returns { isPaid, isLoading, tier } based on session subscription tier.
 * Paid = any active subscription (STARTER, STANDARD, PROFESSIONAL, UNLIMITED).
 * Free tools should NOT use this hook.
 */
export function usePaidToolAccess() {
  const { data: session, status } = useSession();
  const tier = (session?.user as any)?.subscriptionTier || "FREE";
  const isLoading = status === "loading";
  const isPaid = PAID_TIERS.has(tier);

  return { isPaid, isLoading, tier };
}
