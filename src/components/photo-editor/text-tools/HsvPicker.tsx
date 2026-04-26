// src/components/photo-editor/text-tools/HsvPicker.tsx
//
// Custom HSV picker built from a saturation/value square plus a hue
// slider. Pure SVG / pointer events — no third-party colour library.
// Output is hex (#RRGGBB).
//
// Coordinates:
//   • The SV square is 100 × 100 in its own SVG viewBox. x = saturation
//     0..100; y = value 100..0 (i.e. top is value=100). The drag dot's
//     position is computed in SVG user-space and CSS pixels alike.
//   • The hue slider is a horizontal gradient bar; pointer-x maps to
//     hue 0..360.
//
// Round-tripping:
//   • value (input) is hex → parse to HSV for the initial dot position.
//   • Dragging mutates internal HSV state; on every move we emit
//     onChange(toHex(h, s, v)). The parent decides whether to dispatch
//     immediately or coalesce.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface HsvPickerProps {
  /** Current hex value (#RRGGBB). */
  value: string;
  onChange: (hex: string) => void;
}

interface HSV {
  h: number; // 0..360
  s: number; // 0..100
  v: number; // 0..100
}

export function HsvPicker({ value, onChange }: HsvPickerProps) {
  // Internal HSV state — synced from `value` on mount and whenever
  // `value` changes externally without our own emit. Internal HSV is
  // necessary because hex → HSV → hex round-trips lose precision (a
  // very-low-saturation hex collapses to 0 saturation, which would
  // snap the dot to the left every frame).
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const lastEmittedRef = useRef<string>(value);

  useEffect(() => {
    if (value.toLowerCase() === lastEmittedRef.current.toLowerCase()) return;
    setHsv(hexToHsv(value));
    lastEmittedRef.current = value;
  }, [value]);

  function emit(next: HSV) {
    setHsv(next);
    const hex = hsvToHex(next);
    lastEmittedRef.current = hex;
    onChange(hex);
  }

  // ── SV square pointer handling ──
  const svRef = useRef<HTMLDivElement>(null);
  function svFromEvent(e: PointerEvent | React.PointerEvent): { s: number; v: number } | null {
    const el = svRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    return { s: x * 100, v: (1 - y) * 100 };
  }

  function onSvPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const sv = svFromEvent(e);
    if (sv) emit({ ...hsv, s: sv.s, v: sv.v });
  }

  function onSvPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!(e.buttons & 1)) return;
    const sv = svFromEvent(e);
    if (sv) emit({ ...hsv, s: sv.s, v: sv.v });
  }

  // ── Hue slider pointer handling ──
  const hueRef = useRef<HTMLDivElement>(null);
  function hueFromEvent(e: PointerEvent | React.PointerEvent): number | null {
    const el = hueRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * 360;
  }

  function onHuePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const h = hueFromEvent(e);
    if (h !== null) emit({ ...hsv, h });
  }

  function onHuePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!(e.buttons & 1)) return;
    const h = hueFromEvent(e);
    if (h !== null) emit({ ...hsv, h });
  }

  // ── Hex input ──
  const hex = useMemo(() => hsvToHex(hsv), [hsv]);
  const [hexDraft, setHexDraft] = useState<string>(hex);
  useEffect(() => {
    setHexDraft(hex);
  }, [hex]);

  function commitHex() {
    const cleaned = hexDraft.trim().replace(/^#?/, "#");
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      const next = hexToHsv(cleaned);
      emit(next);
    } else {
      setHexDraft(hex);
    }
  }

  // The SV square's background is a solid hue (left → right white →
  // pure-hue) overlaid with a top → bottom transparent → black gradient.
  const hueRgb = hsvToHex({ h: hsv.h, s: 100, v: 100 });
  const dotX = hsv.s; // 0..100
  const dotY = 100 - hsv.v; // 0..100, but inverted

  return (
    <div className="flex flex-col gap-3">
      {/* SV square */}
      <div
        ref={svRef}
        onPointerDown={onSvPointerDown}
        onPointerMove={onSvPointerMove}
        className="relative w-full"
        style={{
          aspectRatio: "1 / 1",
          borderRadius: 8,
          overflow: "hidden",
          touchAction: "none",
          background: hueRgb,
          border: "1px solid var(--pe-border)",
          cursor: "crosshair",
        }}
        role="slider"
        aria-label="Saturation and value"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s)}
      >
        {/* Saturation overlay (white → transparent, left → right) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Value overlay (transparent → black, top → bottom) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000000 100%)",
          }}
        />
        {/* Drag dot */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${dotX}%`,
            top: `${dotY}%`,
            width: 14,
            height: 14,
            transform: "translate(-50%, -50%)",
            borderRadius: 9999,
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            background: hex,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        onPointerDown={onHuePointerDown}
        onPointerMove={onHuePointerMove}
        className="relative w-full"
        style={{
          height: 14,
          borderRadius: 9999,
          overflow: "hidden",
          touchAction: "none",
          background:
            "linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)",
          border: "1px solid var(--pe-border)",
          cursor: "ew-resize",
        }}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            top: "50%",
            width: 12,
            height: 12,
            transform: "translate(-50%, -50%)",
            borderRadius: 9999,
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            background: hueRgb,
          }}
        />
      </div>

      {/* Hex input */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--pe-text-muted)" }}
        >
          Hex
        </span>
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitHex();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
          className="flex-1 text-sm tabular-nums"
          style={{
            height: 30,
            padding: "0 8px",
            borderRadius: 6,
            background: "var(--pe-surface-2)",
            border: "1px solid var(--pe-border)",
            color: "var(--pe-text)",
            outline: "none",
          }}
          aria-label="Hex colour value"
        />
      </div>
    </div>
  );
}

// ─── HSV / hex math ─────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexToHsv(hex: string): HSV {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return { h: 0, s: 0, v: 0 };
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

function hsvToHex({ h, s, v }: HSV): string {
  const sN = s / 100;
  const vN = v / 100;
  const c = vN * sN;
  const hPrime = (h % 360) / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hPrime >= 0 && hPrime < 1) { r = c; g = x; b = 0; }
  else if (hPrime < 2) { r = x; g = c; b = 0; }
  else if (hPrime < 3) { r = 0; g = c; b = x; }
  else if (hPrime < 4) { r = 0; g = x; b = c; }
  else if (hPrime < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = vN - c;
  const toByte = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`.toUpperCase();
}
