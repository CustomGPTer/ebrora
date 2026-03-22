// src/components/free-templates/UsageCounter.tsx
// USAGE COUNTER — Shows "X of Y downloads remaining this month"
// Fetches from /api/usage/template on mount
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UsageData {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
  tier: string | null;
  resetsAt?: string;
}

export function UsageCounter() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetch("/api/usage/template")
      .then((res) => res.json())
      .then((data) => {
        setUsage(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  // Don't show for non-logged-in users
  if (!session?.user || loading) return null;
  if (!usage || !usage.authenticated) return null;

  const isAtLimit = usage.remaining === 0;
  const isLow = usage.remaining > 0 && usage.remaining <= 2;
  const resetDate = usage.resetsAt
    ? new Date(usage.resetsAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
        isAtLimit
          ? "bg-red-50 text-red-700 border border-red-200"
          : isLow
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-[#1B5745]/5 text-[#1B5745] border border-[#1B5745]/10"
      }`}
    >
      {/* Icon */}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>

      {isAtLimit ? (
        <span>
          0 downloads remaining
          {resetDate && (
            <span className="text-red-500"> · Resets {resetDate}</span>
          )}
        </span>
      ) : (
        <span>
          {usage.remaining} of {usage.limit} remaining this month
        </span>
      )}

      {/* Upgrade link for free users at or near limit */}
      {(isAtLimit || isLow) && usage.tier === "FREE" && (
        <a
          href="/pricing"
          className="font-bold underline hover:no-underline ml-1"
        >
          Upgrade
        </a>
      )}
    </div>
  );
}
