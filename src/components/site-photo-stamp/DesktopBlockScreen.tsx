// src/components/site-photo-stamp/DesktopBlockScreen.tsx
//
// Shown when the user opens /site-photo-stamp on a device that isn't
// a mobile phone. Displays the URL + a QR code so they can hop across.
//
// Also provides an escape hatch ("Continue on this device") in case our
// detection misfires — e.g. iPad with desktop UA, "Request Desktop Site"
// mode on iOS, or any browser that doesn't identify itself as mobile.
"use client";

import { useEffect, useState } from "react";

interface Props {
  onOverride?: () => void;
}

export default function DesktopBlockScreen({ onOverride }: Props) {
  const [url, setUrl] = useState("");
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = `${window.location.origin}/site-photo-stamp`;
    setUrl(u);

    // Lazy-load qrcode only on desktop (it's not needed on mobile).
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const svg = await QRCode.toString(u, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 1,
          color: { dark: "#1B5B50", light: "#FFFFFF" },
        });
        setQrSvg(svg);
      } catch {
        // QR is a nice-to-have; URL alone is still useful.
      }
    })();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1B5B50]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#1B5B50]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Open on your phone
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Site Photo Stamp is designed for mobile use so you can capture photos
          directly from your device camera while on site.
        </p>

        {/* QR + URL */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6">
          <div className="flex justify-center mb-4">
            {qrSvg ? (
              <div
                className="w-40 h-40 sm:w-48 sm:h-48"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-lg border border-gray-200 animate-pulse" />
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Or open this link on your phone
          </p>
          <p className="text-sm font-mono text-[#1B5B50] break-all select-all">
            {url || "\u00a0"}
          </p>
        </div>

        <div className="text-xs text-gray-400">
          Add to your phone's home screen once opened for quick access.
        </div>

        {onOverride && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              Already on your phone? Some mobile browsers aren't detected
              automatically.
            </p>
            <button
              type="button"
              onClick={onOverride}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B5B50] hover:underline"
            >
              Continue on this device
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
