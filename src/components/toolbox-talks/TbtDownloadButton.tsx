"use client";

import { useState } from "react";

interface TbtDownloadButtonProps {
  htmlFile: string;
    title: string;
    }

    export function TbtDownloadButton({ htmlFile, title }: TbtDownloadButtonProps) {
      const [status, setStatus] = useState<"idle" | "loading">("idle");

        async function handleDownload() {
            setStatus("loading");

                try {
                      // Fetch the HTML content
                            const res = await fetch(`/toolbox-talks/${htmlFile}`);
                                  if (!res.ok) throw new Error("Failed to fetch");
                                        const html = await res.text();

                                              // Create a hidden iframe to render the HTML with its full CSS
                                                    const iframe = document.createElement("iframe");
                                                          iframe.style.position = "fixed";
                                                                iframe.style.left = "-9999px";
                                                                      iframe.style.top = "0";
                                                                            iframe.style.width = "210mm";
                                                                                  iframe.style.height = "297mm";
                                                                                        iframe.style.border = "none";
                                                                                              document.body.appendChild(iframe);

                                                                                                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                                                                                                          if (!doc) throw new Error("Could not access iframe");

                                                                                                                doc.open();
                                                                                                                      doc.write(html);
                                                                                                                            doc.close();

                                                                                                                                  // Wait for fonts and content to load
                                                                                                                                        await new Promise<void>((resolve) => {
                                                                                                                                                if (iframe.contentWindow) {
                                                                                                                                                          iframe.contentWindow.onload = () => resolve();
                                                                                                                                                                    setTimeout(resolve, 3000);
                                                                                                                                                                            } else {
                                                                                                                                                                                      setTimeout(resolve, 3000);
                                                                                                                                                                                              }
                                                                                                                                                                                                    });

                                                                                                                                                                                                          // Extra time for web fonts to render
                                                                                                                                                                                                                await new Promise((r) => setTimeout(r, 500));

                                                                                                                                                                                                                      // Load html2canvas and jsPDF dynamically
                                                                                                                                                                                                                            const [html2canvasModule, jsPDFModule] = await Promise.all([
                                                                                                                                                                                                                                    import("html2canvas"),
                                                                                                                                                                                                                                            import("jspdf"),
                                                                                                                                                                                                                                                  ]);
                                                                                                                                                                                                                                                        const html2canvas = html2canvasModule.default;
                                                                                                                                                                                                                                                              const { jsPDF } = jsPDFModule;

                                                                                                                                                                                                                                                                    // Render the iframe body to canvas at high DPI for crisp text
                                                                                                                                                                                                                                                                          const canvas = await html2canvas(doc.body, {
                                                                                                                                                                                                                                                                                  scale: 4,
                                                                                                                                                                                                                                                                                          useCORS: true,
                                                                                                                                                                                                                                                                                                  allowTaint: true,
                                                                                                                                                                                                                                                                                                          width: 794,
                                                                                                                                                                                                                                                                                                                  height: 1123,
                                                                                                                                                                                                                                                                                                                          windowWidth: 794,
                                                                                                                                                                                                                                                                                                                                  windowHeight: 1123,
                                                                                                                                                                                                                                                                                                                                          backgroundColor: "#ffffff",
                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                      // Create A4 PDF from canvas using PNG for lossless text quality
                                                                                                                                                                                                                                                                                                                                                            const pdf = new jsPDF({
                                                                                                                                                                                                                                                                                                                                                                    orientation: "portrait",
                                                                                                                                                                                                                                                                                                                                                                            unit: "mm",
                                                                                                                                                                                                                                                                                                                                                                                    format: "a4",
                                                                                                                                                                                                                                                                                                                                                                                            compress: true,
                                                                                                                                                                                                                                                                                                                                                                                                  });

                                                                                                                                                                                                                                                                                                                                                                                                        const imgData = canvas.toDataURL("image/png");
                                                                                                                                                                                                                                                                                                                                                                                                              pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");

                                                                                                                                                                                                                                                                                                                                                                                                                    // Save
                                                                                                                                                                                                                                                                                                                                                                                                                          const safeTitle = title
                                                                                                                                                                                                                                                                                                                                                                                                                                  .replace(/[^a-zA-Z0-9 -]/g, "")
                                                                                                                                                                                                                                                                                                                                                                                                                                          .replace(/\s+/g, "-");
                                                                                                                                                                                                                                                                                                                                                                                                                                                pdf.save(`${safeTitle}.pdf`);

                                                                                                                                                                                                                                                                                                                                                                                                                                                      // Clean up
                                                                                                                                                                                                                                                                                                                                                                                                                                                            document.body.removeChild(iframe);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  setStatus("idle");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            console.error("PDF generation error:", err);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  window.open(`/toolbox-talks/${htmlFile}`, "_blank");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        setStatus("idle");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                function handlePrint() {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    window.open(`/toolbox-talks/${htmlFile}`, "_blank");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return (
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
  );
}