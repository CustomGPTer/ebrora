// src/components/photo-editor/home/InstallInstructionsModal.tsx
//
// Step-by-step "Add Photo Editor to home screen" modal — May 2026.
// Shown by InstallAppCard when the browser's auto-prompt (the
// captured `beforeinstallprompt`) isn't currently available — i.e.
// when the platform-detected browser doesn't fire that event, or
// when Chrome / Edge / Samsung Internet have throttled the prompt
// after a previous dismissal / install / uninstall.
//
// The platform is detected on mount, not on every render, because
// `navigator.userAgent` isn't available during SSR and we don't want
// a hydration mismatch. While the platform is being read the modal
// shows the "unknown" instructions, which are written to read
// reasonably for any browser; the platform-specific copy swaps in
// once the effect runs (one tick later).
//
// Visual language matches ColorPickerModal — same backdrop, same
// rounded-card frame, same close affordance — so the editor's modal
// surfaces feel consistent.

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  detectInstallPlatform,
  getInstallInstructions,
  type InstallInstructions,
  type InstallPlatform,
} from "@/lib/photo-editor/pwa/platform";

interface InstallInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

const FALLBACK: InstallPlatform = "unknown";

export function InstallInstructionsModal({
  open,
  onClose,
}: InstallInstructionsModalProps) {
  const [platform, setPlatform] = useState<InstallPlatform>(FALLBACK);

  useEffect(() => {
    if (!open) return;
    setPlatform(detectInstallPlatform());
  }, [open]);

  if (!open) return null;

  const instructions: InstallInstructions = getInstallInstructions(platform);

  return (
    <>
      {/* Backdrop — tap to close. */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
          zIndex: 500,
        }}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How to install Photo Editor"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(92vw, 420px)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
          color: "#1F2937",
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          zIndex: 501,
          padding: "20px 18px 18px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title row */}
        <div
          style={{
            textAlign: "center",
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 6,
            color: "#1F2937",
          }}
        >
          {instructions.heading}
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#6B7280",
            marginBottom: 18,
          }}
        >
          One tap install isn&apos;t available on this browser — here&apos;s
          how to add it manually.
        </div>

        {/* Numbered steps */}
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {instructions.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 14,
                lineHeight: 1.45,
                color: "#1F2937",
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#1F2937",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                }}
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {/* Optional note */}
        {instructions.note ? (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "#F3F4F6",
              borderRadius: 8,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#4B5563",
            }}
          >
            {instructions.note}
          </div>
        ) : null}

        {/* OK button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#1F2937",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            GOT IT
          </button>
        </div>

        {/* Top-right close — small × */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "transparent",
            border: "none",
            color: "#9CA3AF",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </>
  );
}
