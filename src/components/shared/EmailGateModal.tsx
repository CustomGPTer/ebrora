// src/components/shared/EmailGateModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface EmailGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  contentTitle: string;
  source: string;
  isLoading?: boolean;
}

export function EmailGateModal({
  isOpen,
  onClose,
  onSubmit,
  contentTitle,
  source,
  isLoading = false,
}: EmailGateModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    onSubmit(trimmed);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Download with email"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#1B5745]/10 flex items-center justify-center mb-5">
            <svg className="w-6 h-6 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900">
            Download &ldquo;{contentTitle}&rdquo;
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Enter your email to get instant access. We will send you a download link and keep you updated with new resources.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="gate-email" className="sr-only">
                Email address
              </label>
              <input
                ref={inputRef}
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={isLoading}
                className={`w-full px-4 py-3 text-sm border rounded-xl transition-colors outline-none ${
                  error
                    ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-200"
                    : "border-gray-200 focus:border-[#1B5745] focus:ring-1 focus:ring-[#1B5745]/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {error && (
                <p className="text-xs text-red-500 mt-1.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B5745] text-white text-sm font-semibold rounded-xl hover:bg-[#164a3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Get Download Link
                </>
              )}
            </button>
          </form>

          {/* Privacy note */}
          <p className="text-[11px] text-gray-400 mt-4 text-center leading-relaxed">
            We respect your privacy. No spam, unsubscribe any time.
          </p>
        </div>
      </div>
    </div>
  );
}
