// src/components/site-photo-stamp/CaptureProgress.tsx
//
// Full-screen overlay shown whilst the capture pipeline is running.
// Stage labels match the CaptureStage union in capture.ts.
"use client";

import type { CaptureStage } from "@/lib/site-photo-stamp/capture";

const LABELS: Record<CaptureStage, string> = {
  reading: "Reading photo…",
  downscaling: "Preparing photo…",
  locating: "Getting location…",
  geocoding: "Looking up address…",
  finalising: "Finalising…",
};

interface Props {
  stage: CaptureStage | null;
}

export default function CaptureProgress({ stage }: Props) {
  if (!stage) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
      role="dialog"
      aria-busy="true"
      aria-label="Processing photo"
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[#1B5B50] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {LABELS[stage]}
        </p>
        <p className="text-xs text-gray-500">
          Everything runs on your device.
        </p>
      </div>
    </div>
  );
}
