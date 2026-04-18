'use client';

// =============================================================================
// DraftList — compact dropdown listing the user's saved drafts.
// Calls /api/visualise/drafts (ships in Batch 5). Until Batch 5 lands, this
// will return 404; dropdown gracefully shows "No saved drafts".
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { DraftSummary } from '@/lib/visualise/types';

interface Props {
  currentDocumentId: string | null;
}

export default function DraftList({ currentDocumentId }: Props) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visualise/drafts', { cache: 'no-store' });
      if (res.ok) {
        setDrafts((await res.json()) as DraftSummary[]);
      } else {
        setDrafts([]);
      }
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load drafts when the dropdown is first opened, and whenever current doc changes.
  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load, currentDocumentId]);

  // Dismiss on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:border-[#1B5B50] hover:text-[#1B5B50] transition-colors inline-flex items-center gap-1.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Drafts
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Your drafts
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">Loading…</div>
          ) : drafts && drafts.length > 0 ? (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {drafts.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/visualise/${d.id}`}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 text-sm hover:bg-[#E6F0EE] transition-colors ${
                      d.id === currentDocumentId ? 'bg-[#E6F0EE]' : ''
                    }`}
                  >
                    <div className="font-medium text-[#1B5B50] truncate">
                      {d.title || 'Untitled'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                      <span>
                        {d.visualCount} visual{d.visualCount === 1 ? '' : 's'}
                      </span>
                      <span>
                        Expires in {d.daysUntilExpiry} day{d.daysUntilExpiry === 1 ? '' : 's'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No saved drafts yet. Generate and click Save to store one here.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
