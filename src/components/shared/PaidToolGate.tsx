// src/components/shared/PaidToolGate.tsx
"use client";

import Link from "next/link";
import { usePaidToolAccess } from "@/hooks/usePaidToolAccess";

/**
 * Wraps a PDF download button for paid tools.
 * If user has a paid subscription → renders children (the button).
 * If not → renders a locked button linking to /pricing.
 */
export function PaidDownloadButton({
  children,
  hasData,
}: {
  children: React.ReactNode;
  hasData: boolean;
}) {
  const { isPaid, isLoading } = usePaidToolAccess();

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-wait">
        Loading...
      </span>
    );
  }

  if (!isPaid) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors no-underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Upgrade to Download PDF
      </Link>
    );
  }

  // Paid user — show the actual download button
  return <>{children}</>;
}
