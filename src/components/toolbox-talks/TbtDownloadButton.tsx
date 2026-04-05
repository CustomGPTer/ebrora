"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/shared/UpgradeModal";

interface TbtDownloadButtonProps {
  htmlFile: string;
  title: string;
}

export function TbtDownloadButton({ htmlFile, title }: TbtDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ used: 0, limit: 0, tier: "FREE" });
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const handleDownload = useCallback(async () => {
    // Not logged in -> redirect to login
    if (sessionStatus !== "authenticated" || !session) {
      router.push("/auth/login");
      return;
    }

    setStatus("loading");

    try {
      // Check and record download in one call
      const checkRes = await fetch("/api/downloads/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "TOOLBOX_TALK" }),
      });

      if (checkRes.status === 401) {
        router.push("/auth/login");
        setStatus("idle");
        return;
      }

      if (checkRes.status === 429) {
        const data = await checkRes.json();
        setModalData({ used: data.used, limit: data.limit, tier: data.tier });
        setShowModal(true);
        setStatus("idle");
        return;
      }

      if (!checkRes.ok) {
        throw new Error("Download check failed");
      }

      // Usage check passed - open the HTML with ?print param
      // The injected script in the HTML auto-triggers window.print() on load
      const url = `/toolbox-talks/${htmlFile}?print`;
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup was blocked - fall back to navigating current tab
        window.location.href = url;
      }
      setStatus("idle");
    } catch (err) {
      console.error("PDF download error:", err);
      setStatus("idle");
    }
  }, [htmlFile, title, session, sessionStatus, router]);

  function handlePrint() {
    window.open(`/toolbox-talks/${htmlFile}`, "_blank");
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={status === "loading"}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              status === "loading"
                ? "bg-[#1B5745]/80 text-white cursor-wait"
                : "bg-[#1B5745] text-white hover:bg-[#164a3b] active:scale-[0.98]"
            }`}
          >
            {status === "loading" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF&hellip;
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
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-3 0h.008v.008h-.008V12z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        contentType="toolbox talk"
        used={modalData.used}
        limit={modalData.limit}
        tier={modalData.tier}
      />
    </>
  );
}
