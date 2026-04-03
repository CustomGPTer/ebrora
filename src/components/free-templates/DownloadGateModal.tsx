// src/components/free-templates/DownloadGateModal.tsx
// DOWNLOAD GATE MODAL — Shown when non-logged-in user clicks download
// Polite prompt with sign-in/sign-up buttons and tier comparison
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

interface DownloadGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateTitle: string;
  callbackUrl: string;
}

export function DownloadGateModal({
  isOpen,
  onClose,
  templateTitle,
  callbackUrl,
}: DownloadGateModalProps) {
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSignIn = useCallback(() => {
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router, callbackUrl]);

  const handleSignUp = useCallback(() => {
    router.push(
      `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }, [router, callbackUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B5745] to-[#236b55] px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">
            Sign in to download
          </h2>
          <p className="text-sm text-white/75 mt-2 max-w-sm mx-auto">
            Create a free account to download up to 5 templates per month,
            plus access toolbox talks, RAMS Builder, and interactive safety
            tools.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleSignIn}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#1B5745] text-sm font-semibold rounded-lg border-2 border-[#1B5745] hover:bg-[#1B5745]/5 transition-colors"
            >
              Create Free Account
            </button>
          </div>

          {/* Tier comparison */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-700">
                    Feature
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-gray-700">
                    Free
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-[#1B5745] bg-[#1B5745]/5">
                    Starter
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-gray-700">
                    Pro
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-gray-700">
                    Unlimited
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 text-gray-600">Templates</td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    1/mo
                  </td>
                  <td className="text-center px-2 py-2 text-[#1B5745] font-bold bg-[#1B5745]/5">
                    10/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    30/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    ∞
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-600">Toolbox Talks</td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    1/mo
                  </td>
                  <td className="text-center px-2 py-2 text-[#1B5745] font-bold bg-[#1B5745]/5">
                    10/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    20/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    ∞
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-600">RAMS Builder</td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    1/mo
                  </td>
                  <td className="text-center px-2 py-2 text-[#1B5745] font-bold bg-[#1B5745]/5">
                    5/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    15/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    ∞
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-600">AI Documents</td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    1/mo
                  </td>
                  <td className="text-center px-2 py-2 text-[#1B5745] font-bold bg-[#1B5745]/5">
                    30/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    150/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    ∞
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-600">Price</td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    Free
                  </td>
                  <td className="text-center px-2 py-2 text-[#1B5745] font-bold bg-[#1B5745]/5">
                    £9.99/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    £24.99/mo
                  </td>
                  <td className="text-center px-2 py-2 text-gray-900 font-medium">
                    £49.99/mo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full pricing link */}
          <div className="text-center mt-4">
            <a
              href="/pricing"
              className="text-xs font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
            >
              See full pricing →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
