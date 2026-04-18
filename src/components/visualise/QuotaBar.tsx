'use client';

// =============================================================================
// QuotaBar — compact chip showing "N/M uses this month · D/3 drafts saved"
// Refreshed by parent after generate/regenerate/save/reset calls.
// =============================================================================

import type { AccessResponse } from '@/lib/visualise/types';

interface Props {
  access: AccessResponse | null;
}

export default function QuotaBar({ access }: Props) {
  if (!access) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" />
        Loading quota…
      </span>
    );
  }

  const { used, limit, draftCount, draftLimit, remaining } = access;
  const isLow = remaining <= 1 && limit > 0;
  const isOut = remaining === 0 && limit > 0;

  return (
    <span
      className={`inline-flex items-center gap-3 text-xs px-3 py-1.5 rounded-full border ${
        isOut
          ? 'border-red-200 bg-red-50 text-red-700'
          : isLow
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-[#B5DAD2] bg-[#E6F0EE] text-[#1B5B50]'
      }`}
    >
      <span className="font-semibold tabular-nums">
        {used}/{limit}
      </span>
      <span className="text-[11px] opacity-75">uses this month</span>
      <span className="w-px h-3 bg-current opacity-30" />
      <span className="font-semibold tabular-nums">
        {draftCount}/{draftLimit}
      </span>
      <span className="text-[11px] opacity-75">drafts</span>
    </span>
  );
}
