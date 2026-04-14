// src/components/guides/GuideDownloadGate.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface GuideDownloadGateProps {
  guideSlug: string;
  guideTitle: string;
}

export function GuideDownloadGate({ guideSlug, guideTitle }: GuideDownloadGateProps) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setError("");

    // Not logged in
    if (!session) {
      setShowModal(true);
      return;
    }

    // Check tier via API
    setDownloading(true);
    try {
      const res = await fetch(`/api/guides/download?slug=${guideSlug}`);
      const data = await res.json();

      if (res.status === 401) {
        setShowModal(true);
        setDownloading(false);
        return;
      }

      if (res.status === 403) {
        // Free tier — show upgrade
        setShowModal(true);
        setDownloading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Download failed");
        setDownloading(false);
        return;
      }

      // Success — trigger download
      if (data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = `${guideTitle.replace(/\s+/g, "-")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      setError("Download failed — please try again");
    }
    setDownloading(false);
  };

  return (
    <>
      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 bg-[#1B5B50] hover:bg-[#144840] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {downloading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span>Download PDF</span>
        {!session && (
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Pro</span>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#1B5B50] to-[#2A7A6C]" />

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#1B5B50]/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {!session ? (
                <>
                  {/* Not logged in */}
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    Sign in to download
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    Create a free account or sign in to access PDF downloads. The full interactive guide
                    is always free to use online.
                  </p>
                  <div className="space-y-3">
                    <Link
                      href={`/auth/login?callbackUrl=/guides/${guideSlug}`}
                      className="block w-full py-3 bg-[#1B5B50] hover:bg-[#144840] text-white text-sm font-semibold rounded-xl text-center transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/auth/register?callbackUrl=/guides/${guideSlug}`}
                      className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl text-center transition-colors"
                    >
                      Create free account
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* Logged in but free tier */}
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    Upgrade for PDF downloads
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    PDF downloads are available on Starter plans and above.
                    The full interactive guide is always free to use online.
                  </p>

                  {/* Feature comparison */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                    {[
                      { feature: "Full interactive guide online", free: true, paid: true },
                      { feature: "228-term searchable glossary", free: true, paid: true },
                      { feature: "32 interactive calculators", free: true, paid: true },
                      { feature: "PDF download (full guide)", free: false, paid: true },
                      { feature: "White-label PDF (your logo)", free: false, paid: true },
                    ].map((row) => (
                      <div key={row.feature} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{row.feature}</span>
                        <div className="flex items-center gap-4">
                          <span className={row.free ? "text-emerald-500" : "text-gray-300"}>
                            {row.free ? "✓" : "—"}
                          </span>
                          <span className={row.paid ? "text-emerald-500 font-semibold" : "text-gray-300"}>
                            {row.paid ? "✓" : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider pt-1 border-t border-gray-200">
                      <span>Free</span>
                      <span>Paid</span>
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    className="block w-full py-3 bg-[#1B5B50] hover:bg-[#144840] text-white text-sm font-semibold rounded-xl text-center transition-colors"
                  >
                    View plans from £4.99/mo
                  </Link>
                </>
              )}

              {/* Close */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
              >
                Continue reading for free
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
