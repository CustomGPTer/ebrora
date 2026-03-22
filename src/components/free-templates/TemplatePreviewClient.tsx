// src/components/free-templates/TemplatePreviewClient.tsx
// CLIENT COMPONENT — A4 preview viewer + download button
// Shows watermarked preview for non-logged-in, clean for logged-in
// Download button triggers gating modal if not authenticated
"use client";

import { useSession } from "next-auth/react";
import { formatFileSize } from "@/lib/free-templates";

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

  const handleDownload = async () => {
    if (!isLoggedIn) {
      // TODO Section 3: Open gating modal
      // For now, redirect to login
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    // TODO Section 3: Check usage limit via API, increment counter, then download
    // For now, direct download
    window.open(`/api/download/template/${categorySlug}/${subcategorySlug}/${templateSlug}`, "_blank");
  };

  return (
    <div>
      {/* A4 Preview Area */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
        {previewPath ? (
          <div className="relative bg-gray-50">
            {/* Preview image */}
            <img
              src={previewPath}
              alt={`Preview of ${templateTitle} — first two pages at A4 size`}
              className="w-full h-auto"
            />
            {/* Watermark overlay for non-logged-in users */}
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
          /* No preview available — show placeholder */
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
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors shadow-sm"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download .{fileType}
        </button>
      </div>

      {/* Sign-in prompt for non-logged-in users */}
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
    </div>
  );
}
