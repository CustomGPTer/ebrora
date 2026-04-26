// src/components/photo-editor/text-tools/controls.tsx
//
// Shared form-control primitives for the Batch C text-tool panels. The
// six panels (Format / Color / Stroke / Highlight / Shadow / Position)
// would otherwise duplicate ~150 lines of slider / toggle / input /
// segmented / colour-button styling. Centralising here also keeps the
// six panels visually consistent — same paddings, same accent ring, same
// disabled treatment.
//
// Every primitive uses the editor's CSS variables (--pe-*) so light /
// dark theme switching flows automatically.

"use client";

import { type ReactNode, useCallback, useId } from "react";

// ─── Layout primitives ──────────────────────────────────────────

/** Section heading + its body. The header's `right` slot is for the
 *  optional inline action (e.g. the "applied to selection" hint or a
 *  reset link). */
export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--pe-text-muted)" }}
        >
          {title}
        </h3>
        {right ? (
          <div
            className="text-[11px]"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            {right}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** Horizontal divider between sections. */
export function SectionDivider() {
  return (
    <div
      className="h-px mx-4"
      style={{ background: "var(--pe-border)" }}
      aria-hidden
    />
  );
}

/** A label / control row. The label sits at a fixed minimum width so
 *  successive rows align cleanly. */
export function Row({
  label,
  hint,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined ? (
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--pe-text)" }}
          >
            {label}
          </span>
          {hint !== undefined ? (
            <span
              className="text-[11px]"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Wraps a sub-tree and dims it when `disabled` is true. Used by the
 *  Stroke / Highlight / Shadow panels to grey out the body when the
 *  effect's `enabled` toggle is off. */
export function DimmedWhen({
  disabled,
  children,
}: {
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "opacity 0.15s ease",
      }}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
}

// ─── Toggle (switch) ────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between cursor-pointer select-none"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--pe-text)" }}
      >
        {label}
      </span>
      <span
        className="relative inline-block transition-colors"
        style={{
          width: 36,
          height: 20,
          borderRadius: 9999,
          background: checked
            ? "var(--pe-accent)"
            : "var(--pe-surface-2)",
          border: "1px solid var(--pe-border)",
        }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 transition-all"
          style={{
            left: checked ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: checked ? "var(--pe-accent-fg)" : "var(--pe-text)",
            opacity: 0.95,
          }}
        />
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={label}
        />
      </span>
    </label>
  );
}

// ─── Slider ─────────────────────────────────────────────────────

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  /** Display formatter for the value readout. */
  format?: (n: number) => string;
  ariaLabel?: string;
}) {
  const display = format ? format(value) : value.toFixed(decimalsFor(step));
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="flex-1"
        style={{ accentColor: "var(--pe-accent)" }}
      />
      <span
        className="text-xs tabular-nums"
        style={{ color: "var(--pe-text-muted)", minWidth: 38, textAlign: "right" }}
      >
        {display}
      </span>
    </div>
  );
}

function decimalsFor(step: number): number {
  // Crude — handles 0.5, 0.05 etc. without regex acrobatics.
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  if (step >= 0.01) return 2;
  return 3;
}

// ─── Number input (for Position panel) ──────────────────────────

export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      max={max}
      aria-label={ariaLabel}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      className="w-full text-sm tabular-nums"
      style={{
        height: 32,
        padding: "0 8px",
        borderRadius: 6,
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border)",
        color: "var(--pe-text)",
        outline: "none",
      }}
    />
  );
}

// ─── Segmented control ──────────────────────────────────────────

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T | null;
  options: readonly SegmentOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full p-0.5"
      style={{
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border)",
        borderRadius: 8,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.ariaLabel ?? opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 inline-flex items-center justify-center text-xs font-medium transition-colors"
            style={{
              height: 30,
              borderRadius: 6,
              background: active ? "var(--pe-surface)" : "transparent",
              color: active ? "var(--pe-text)" : "var(--pe-text-muted)",
              boxShadow: active ? "var(--pe-shadow)" : "none",
              fontWeight: active ? 600 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Toggle pill row (B / I / U / S in FormatPanel) ─────────────

export function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center text-sm font-semibold transition-colors"
      style={{
        width: 40,
        height: 36,
        borderRadius: 8,
        background: active
          ? "var(--pe-tool-icon-active-bg)"
          : "var(--pe-surface-2)",
        border: `1px solid ${active ? "var(--pe-accent)" : "var(--pe-border)"}`,
        color: active ? "var(--pe-tool-icon-active)" : "var(--pe-text)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Colour button (circular swatch) ────────────────────────────

export function ColorButton({
  color,
  active,
  onClick,
  ariaLabel,
  size = 28,
}: {
  color: string;
  active?: boolean;
  onClick: () => void;
  ariaLabel: string;
  size?: number;
}) {
  // The inner ring is for visibility on near-white swatches; the outer
  // ring is the "active" indicator.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      title={ariaLabel}
      className="inline-flex items-center justify-center transition-transform"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        padding: 2,
        background: active ? "var(--pe-accent)" : "var(--pe-surface-2)",
        border: `1px solid ${active ? "var(--pe-accent)" : "var(--pe-border)"}`,
        cursor: "pointer",
      }}
    >
      <span
        className="block w-full h-full"
        style={{
          borderRadius: 9999,
          background: color,
          border: "1px solid rgba(0,0,0,0.10)",
        }}
      />
    </button>
  );
}

// ─── Action button (Position panel z-order, etc.) ───────────────

export function ActionButton({
  onClick,
  children,
  ariaLabel,
  fullWidth = false,
}: {
  onClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
}) {
  const handle = useCallback(() => onClick(), [onClick]);
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
      style={{
        width: fullWidth ? "100%" : "auto",
        height: 32,
        padding: "0 10px",
        borderRadius: 6,
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border)",
        color: "var(--pe-text)",
      }}
    >
      {children}
    </button>
  );
}

// ─── "Mixed" placeholder shown when runValue() returns null ─────

export function MixedHint() {
  return (
    <span
      className="text-[11px] italic"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Mixed
    </span>
  );
}
