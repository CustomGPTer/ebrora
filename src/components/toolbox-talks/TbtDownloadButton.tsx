"use client";

import { useState } from "react";

interface TbtDownloadButtonProps {
  htmlFile: string;
  title: string;
}

export function TbtDownloadButton({ htmlFile, title }: TbtDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "limited" | "error">("idle");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleDownload() {
    setStatus("loading");

    try {
      const res = await fetch("/api/tbt-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlFile, title }),
      });

      if (res.status === 429) {
        setStatus("limited");
        const data = await res.json();
        setRemaining(data.remaining ?? 0);
        return;
      }

      if (!res.ok) {
        setStatus("error");
        return;
      }

      // Get remaining count from header
      const rem = res.headers.get("X-Downloads-Remaining");
      if (rem) setRemaining(parseInt(rem, 10));

      // Download the PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 -]/g, "").replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handlePrint() {
    // Client-side fallback: open HTML in new tab for printing
    window.open(`/toolbox-talks/${htmlFile}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Download PDF button */}
        <button
          onClick={handleDownload}
          disabled={status === "loading" || status === "limited"}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            status === "limited"
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : status === "loading"
              ? "bg-[#1B5745]/80 text-white cursor-wait"
              : "bg-[#1B5745] text-white hover:bg-[#164a3b] active:scale-[0.98]"
          }`}
        >
          {status === "loading" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating PDF&hellip;
            </>
          ) : status === "limited" ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Daily limit reached
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </>
          )}
        </button>

        {/* Print fallback */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-3 0h.008v.008h-.008V12z" />
          </svg>
          Print
        </button>
      </div>

      {/* Status messages */}
      {status === "limited" && (
        <p className="text-xs text-amber-600">
          You&apos;ve reached the limit of 5 free downloads per day. Downloads reset at midnight.
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500">
          Something went wrong generating the PDF. Try the print button instead.
        </p>
      )}
      {remaining !== null && status !== "limited" && (
        <p className="text-xs text-gray-400">{remaining} download{remaining !== 1 ? "s" : ""} remaining today</p>
      )}
    </div>
  );
}
