// src/components/toolbox-talks/TbtDownloadButton.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/shared/UpgradeModal";

interface TbtDownloadButtonProps {
  htmlFile: string;
  title: string;
}

export function TbtDownloadButton({ htmlFile, title }: TbtDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ used: 0, limit: 0, tier: "FREE" });
  const [usageOk, setUsageOk] = useState<boolean | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Pre-fetch usage on mount
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/downloads/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const remaining = data?.tbt?.remaining ?? 0;
        const limit = data?.tbt?.limit ?? 0;
        const used = data?.tbt?.used ?? 0;
        const tier = data?.tier ?? "FREE";
        setModalData({ used, limit, tier });
        setUsageOk(remaining > 0);
      })
      .catch(() => setUsageOk(null));
  }, [sessionStatus]);

  const handleDownload = useCallback(async () => {
    // Auth check
    if (sessionStatus !== "authenticated" || !session) {
      router.push("/auth/login");
      return;
    }

    // Over limit
    if (usageOk === false) {
      setShowModal(true);
      return;
    }

    setStatus("loading");

    try {
      // 0. Record download FIRST — server enforces tier limits
      try {
        const usageRes = await fetch("/api/downloads/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "TOOLBOX_TALK" }),
        });

        if (usageRes.status === 429) {
          const data = await usageRes.json();
          setModalData({ used: data.used, limit: data.limit, tier: data.tier });
          setUsageOk(false);
          setShowModal(true);
          setStatus("idle");
          return;
        }

        if (usageRes.ok) {
          const usageData = await usageRes.json();
          if (usageData?.tbt) {
            setModalData({ used: usageData.tbt.used, limit: usageData.tbt.limit, tier: usageData.tier });
            setUsageOk(usageData.tbt.remaining > 0);
          }
        }
      } catch {
        // Network/fetch error — allow download rather than blocking the user
        console.warn("TBT usage recording failed, allowing download");
      }

      // 1. Create hidden iframe — NO ?print param (that triggers window.print)
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);

      // 2. Load the HTML file into the iframe and wait for load event
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Iframe load timeout")), 15000);
        iframe.onload = () => { clearTimeout(timeout); resolve(); };
        iframe.onerror = () => { clearTimeout(timeout); reject(new Error("Iframe load error")); };
        iframe.src = `/toolbox-talks/${htmlFile}`;
      });

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe document");

      // 3. Wait for web fonts to finish loading inside the iframe
      if (iframeDoc.fonts && typeof iframeDoc.fonts.ready !== "undefined") {
        await Promise.race([
          iframeDoc.fonts.ready,
          new Promise((r) => setTimeout(r, 4000)), // 4s font safety timeout
        ]);
      }

      // 4. Extra settle time for full render (fonts, images, layout)
      await new Promise((r) => setTimeout(r, 800));

      // 5. Override iframe body styles for clean white capture
      iframeDoc.documentElement.style.background = "#ffffff";
      iframeDoc.body.style.margin = "0";
      iframeDoc.body.style.boxShadow = "none";
      iframeDoc.body.style.border = "none";
      iframeDoc.body.style.background = "#ffffff";

      // 6. Capture with html2canvas
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 5000,
        onclone: (clonedDoc: Document) => {
          clonedDoc.documentElement.style.background = "#ffffff";
          clonedDoc.body.style.background = "#ffffff";
          clonedDoc.body.style.margin = "0";
          clonedDoc.body.style.border = "none";
          clonedDoc.body.style.boxShadow = "none";
        },
      });

      // 7. Create PDF from canvas
      const jsPDFModule = await import("jspdf");
      const { jsPDF } = jsPDFModule;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");

      // 8. Save — instant download
      const safeTitle = title
        .replace(/[^a-zA-Z0-9 -]/g, "")
        .replace(/\s+/g, "-");
      pdf.save(`${safeTitle}.pdf`);

      // 9. Clean up iframe
      document.body.removeChild(iframe);

      setStatus("idle");
    } catch (err) {
      console.error("TBT PDF generation error:", err);
      // Remove any leftover iframe
      const staleIframe = document.querySelector("iframe[style*='-9999px']");
      if (staleIframe) staleIframe.remove();
      setStatus("error");
      // TODO: consider refunding the download credit if PDF generation fails
      // e.g. POST /api/downloads/usage/undo { contentType: "TOOLBOX_TALK" }
      // Reset error state after 3 seconds so user can retry
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [htmlFile, title, session, sessionStatus, router, usageOk]);

  function handlePrint() {
    window.open(`/toolbox-talks/${htmlFile}?print`, "_blank");
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
                : status === "error"
                ? "bg-red-600 text-white"
                : "bg-[#1B5745] text-white hover:bg-[#164a3b] active:scale-[0.98]"
            }`}
          >
            {status === "loading" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : status === "error" ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Failed - Try Again
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
