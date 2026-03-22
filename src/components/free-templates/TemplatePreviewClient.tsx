// src/components/free-templates/TemplatePreviewClient.tsx
// CLIENT COMPONENT — A4 preview viewer + gated download button
// Shows watermarked preview for non-logged-in, clean for logged-in
// Download button triggers gating modal or usage-checked download
"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { DownloadGateModal } from "./DownloadGateModal";
import { UsageCounter } from "./UsageCounter";

interface TemplatePreviewClientProps {
  templateTitle: string;
  previewPath: string | null;
  publicPath: string;
  fileType: string;
  fileTypeLabel: string;
  fileSize: number;
  categorySlug: string;
  subcategorySlug: string;
  templateSlug: string;
}

const FILE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  xlsx: { bg: "bg-emerald-50", text: "text-emerald-600" },
  xlsm: { bg: "bg-emerald-50", text: "text-emerald-600" },
  docx: { bg: "bg-blue-50", text: "text-blue-600" },
  pptx: { bg: "bg-orange-50", text: "text-orange-600" },
  pdf: { bg: "bg-red-50", text: "text-red-500" },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function TemplatePreviewClient({
  templateTitle,
  previewPath,
  publicPath,
  fileType,
  fileTypeLabel,
  fileSize,
  categorySlug,
  subcategorySlug,
  templateSlug,
}: TemplatePreviewClientProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const style = FILE_TYPE_STYLES[fileType] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
  };

  const [gateOpen, setGateOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  const handleDownload = useCallback(async () => {
    setError(null);

    // Non-logged-in: show gating modal
    if (!isLoggedIn) {
      setGateOpen(true);
      return;
    }

    // Logged-in: call download API
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/download/template/${categorySlug}/${subcategorySlug}/${templateSlug}`
      );
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          setLimitReached(true);
          setLimitMessage(data.message || "Monthly download limit reached.");
          return;
        }
        if (data.code === "AUTH_REQUIRED") {
          setGateOpen(true);
          return;
        }
        setError(data.message || data.error || "Download failed. Please try again.");
        return;
      }

      // Success — trigger the actual file download
      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.fileName || "";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      setError("Download failed. Please check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  }, [
    isLoggedIn,
    categorySlug,
    subcategorySlug,
    templateSlug,
  ]);

  return (
    <div>
      {/* Usage counter — only shown for logged-in users */}
      {isLoggedIn && (
        <div className="mb-4">
          <UsageCounter />
        </div>
      )}

      {/* A4 Preview Area */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
        {previewPath ? (
          <div className="relative bg-gray-50">
            <img
              src={previewPath}
              alt={`Preview of ${templateTitle} — first two pages at A4 size`}
              className="w-full h-auto"
            />
            {/* Watermark overlay for non-logged-in */}
            {!isLoggedIn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-400/20 -rotate-45 select-none whitespace-nowrap"
                  style={{ letterSpacing: "0.15em" }}
                >
                  PREVIEW — EBRORA.COM
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`${style.bg} flex flex-col items-center justify-center py-20`}
          >
            <svg
              className={`w-16 h-16 ${style.text} mb-3`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={0.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className={`text-sm font-semibold ${style.text}`}>
              {fileTypeLabel} Document
            </span>
            <span className="text-xs text-gray-400 mt-1">
              Preview not yet available
            </span>
          </div>
        )}
      </div>

      {/* Download bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
        {limitReached ? (
          /* Limit reached state */
          <div className="text-center py-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Monthly limit reached
            </p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {limitMessage}
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors"
            >
              Upgrade for more downloads
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
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        ) : (
          /* Normal download state */
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Download {templateTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {fileTypeLabel} format
                {fileSize > 0 && ` · ${formatFileSize(fileSize)}`}
                {" · Free with account"}
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download .{fileType}
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Sign-in prompt for non-logged-in */}
      {!isLoggedIn && status !== "loading" && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-800">
            <strong>Sign in</strong> to download this template and remove
            the watermark from previews.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Free accounts get 5 downloads per month.{" "}
            <a
              href="/pricing"
              className="font-semibold underline hover:text-amber-800"
            >
              See all plans →
            </a>
          </p>
        </div>
      )}

      {/* Gating modal */}
      <DownloadGateModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        templateTitle={templateTitle}
        callbackUrl={currentPath}
      />
    </div>
  );
}
