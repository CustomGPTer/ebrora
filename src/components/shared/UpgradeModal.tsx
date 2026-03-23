'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'toolbox talk' | 'template';
  used: number;
  limit: number;
  tier: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  contentType,
  used,
  limit,
  tier,
}: UpgradeModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Download limit reached
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-1">
          You&rsquo;ve used all {limit} of your free {contentType} downloads this month ({used}/{limit}).
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Upgrade your plan to unlock more downloads and access premium features.
        </p>

        {/* Upgrade tiers */}
        <div className="space-y-3 mb-6">
          {tier !== 'STANDARD' && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">Standard</p>
                <p className="text-xs text-gray-500">
                  {contentType === 'toolbox talk' ? '10' : '20'} {contentType}s/month
                </p>
              </div>
              <span className="text-sm font-bold text-[#1B5745]">£9.99/mo</span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#1B5745] bg-[#f0f9f6]">
            <div>
              <p className="text-sm font-semibold text-gray-900">Professional</p>
              <p className="text-xs text-gray-500">
                {contentType === 'toolbox talk' ? '20' : '40'} {contentType}s/month
              </p>
            </div>
            <span className="text-sm font-bold text-[#1B5745]">£19.99/mo</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/rams-builder/pricing"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#143f33] transition-colors"
          >
            Upgrade Now
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
