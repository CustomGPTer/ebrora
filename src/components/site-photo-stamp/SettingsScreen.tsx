// src/components/site-photo-stamp/SettingsScreen.tsx
//
// Settings screen for Site Photo Stamp.
//
// Sections:
//   1. Record defaults — default template + variant + on-stamp toggles
//   2. Your details   — free-text defaults that appear on every stamp
//   3. Branding       — company name + logo upload (paid tiers only)
//
// All fields write through to `localStorage` via the useSettings hook.
"use client";

import { useRef, useState } from "react";
import type { Settings, TemplateId, VariantId, Tier } from "@/lib/site-photo-stamp/types";
import { TEMPLATES, getTemplate } from "@/lib/site-photo-stamp/templates";

const PAID_TIERS = new Set<Tier>(["STARTER", "STANDARD", "PROFESSIONAL", "UNLIMITED"]);

interface Props {
  settings: Settings;
  tier: Tier;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

// ─── Reset confirm modal ────────────────────────────────────────

function ConfirmReset({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 animate-in slide-in-from-bottom duration-200">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Reset all settings?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          This clears your defaults, project details, and company branding. Saved gallery photos
          aren't affected.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2 className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        {title}
      </h2>
      {subtitle && (
        <p className="px-4 -mt-1 mb-2 text-[12px] font-medium text-[#991B1B]">
          {subtitle}
        </p>
      )}
      <div className="mx-4 bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="px-4 py-3">
      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength ?? 80}
      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50] focus:outline-none transition-colors"
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-[#1B5B50]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
              selected
                ? "bg-[#1B5B50]/5 border-[#1B5B50]/40"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
            aria-pressed={selected}
          >
            <span
              className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
                selected ? "border-[#1B5B50] bg-white" : "border-gray-300"
              } flex items-center justify-center`}
            >
              {selected && <span className="w-2 h-2 rounded-full bg-[#1B5B50]" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium ${selected ? "text-[#1B5B50]" : "text-gray-900"}`}>
                {opt.label}
              </p>
              {opt.hint && <p className="text-[11px] text-gray-500">{opt.hint}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Company logo upload (paid) ────────────────────────────────

function LogoUploader({
  dataUrl,
  onChange,
  onToast,
}: {
  dataUrl: string;
  onChange: (v: string) => void;
  onToast: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const readFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      onToast("Logo must be under 2 MB.");
      return;
    }
    if (!/^image\/(png|jpe?g|svg\+xml|webp)/i.test(file.type)) {
      onToast("Logo must be a PNG, JPEG, WebP or SVG image.");
      return;
    }
    setBusy(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Couldn't read that file."));
        r.readAsDataURL(file);
      });
      onChange(url);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Couldn't load logo.");
    } finally {
      setBusy(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) readFile(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onInputChange}
        className="hidden"
        aria-hidden
      />
      {dataUrl ? (
        <div className="flex items-center gap-3">
          <div className="h-14 w-20 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Company logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex-1 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex-1 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60"
        >
          <svg className="w-5 h-5 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {busy ? "Loading…" : "Upload company logo"}
        </button>
      )}
    </div>
  );
}

// ─── Paid upgrade gate ──────────────────────────────────────────

function UpgradeGate() {
  return (
    <div className="px-4 py-5 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#D4A44C]/15 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#B38434]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Branding is a paid feature</h3>
      <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-[260px] mx-auto">
        Remove the Ebrora watermark and add your own company logo to every stamped photo and PDF.
      </p>
      <a
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B5B50] text-white text-xs font-semibold hover:bg-[#144540] transition-colors"
      >
        See plans
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function SettingsScreen({
  settings,
  tier,
  onChange,
  onReset,
  onClose,
  onToast,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const isPaid = PAID_TIERS.has(tier);

  const defaultTmpl = getTemplate(settings.defaultTemplate);
  // Guard: if defaultVariant isn't in current template (e.g. corrupted state),
  // fall back to the first variant.
  const validVariant = defaultTmpl.variants.some((v) => v.id === settings.defaultVariant)
    ? settings.defaultVariant
    : defaultTmpl.variants[0].id;

  return (
    <div className="pb-28">
      {/* Top bar */}
      <section className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Site Photo Stamp
          </p>
          <p className="text-sm font-semibold text-gray-900">Settings</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5"
        >
          Reset
        </button>
      </section>

      {/* Record defaults */}
      <SectionCard title="Record defaults">
        <Row label="Default template">
          <select
            value={settings.defaultTemplate}
            onChange={(e) => {
              const nextT = e.target.value as TemplateId;
              const t = getTemplate(nextT);
              // Keep variant if still valid; otherwise reset to first variant
              // of the new template to avoid stale combinations.
              const nextV = t.variants.some((v) => v.id === settings.defaultVariant)
                ? settings.defaultVariant
                : t.variants[0].id;
              onChange({ defaultTemplate: nextT, defaultVariant: nextV });
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50] focus:outline-none appearance-none"
            style={{ backgroundImage: "none" }}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Default variant">
          <RadioGroup<VariantId>
            value={validVariant}
            onChange={(v) => onChange({ defaultVariant: v })}
            options={defaultTmpl.variants.map((v) => ({ value: v.id, label: v.label }))}
          />
        </Row>

        <ToggleRow
          label="Show address on stamp"
          hint="Reverse-geocoded from coordinates when available"
          checked={settings.showAddress}
          onChange={(v) => onChange({ showAddress: v })}
        />

        <ToggleRow
          label="Show coordinates"
          hint="Latitude and longitude stamp on the photo"
          checked={settings.showCoords}
          onChange={(v) => onChange({ showCoords: v })}
        />

        <Row label="Coordinate format">
          <RadioGroup<"decimal" | "dms">
            value={settings.coordFormat}
            onChange={(v) => onChange({ coordFormat: v })}
            options={[
              { value: "decimal", label: "Decimal degrees", hint: "54.024454°N, 2.825112°W" },
              { value: "dms", label: "Degrees / minutes / seconds", hint: "54°01'28.0\"N, 2°49'30.4\"W" },
            ]}
          />
        </Row>

        <Row label="Time format">
          <RadioGroup<"24h" | "12h">
            value={settings.timestampFormat}
            onChange={(v) => onChange({ timestampFormat: v })}
            options={[
              { value: "24h", label: "24-hour", hint: "14:30" },
              { value: "12h", label: "12-hour", hint: "2:30 pm" },
            ]}
          />
        </Row>
      </SectionCard>

      {/* Your details */}
      <SectionCard
        title="Your details"
        subtitle="Appears as a row on every stamp when set"
      >
        <Row label="Project">
          <TextField
            value={settings.projectName}
            onChange={(v) => onChange({ projectName: v })}
            placeholder="e.g. Salford WwTW Inlet Works"
          />
        </Row>
        <Row label="Site">
          <TextField
            value={settings.siteName}
            onChange={(v) => onChange({ siteName: v })}
            placeholder="e.g. Zone A"
          />
        </Row>
        <Row label="Contractor">
          <TextField
            value={settings.contractor}
            onChange={(v) => onChange({ contractor: v })}
            placeholder="e.g. Volker Stevin Ltd"
          />
        </Row>
        <Row label="Operative">
          <TextField
            value={settings.operative}
            onChange={(v) => onChange({ operative: v })}
            placeholder="e.g. J. Jackson"
          />
        </Row>
      </SectionCard>

      {/* Branding */}
      <SectionCard title="Branding">
        {isPaid ? (
          <>
            <Row label="Company name" hint="Shown in PDF headers and footers">
              <TextField
                value={settings.companyName}
                onChange={(v) => onChange({ companyName: v })}
                placeholder="e.g. Volker Stevin Ltd"
              />
            </Row>
            <Row
              label="Company logo"
              hint="Appears in place of the Ebrora watermark on every stamped photo"
            >
              <LogoUploader
                dataUrl={settings.companyLogoDataUrl}
                onChange={(v) => onChange({ companyLogoDataUrl: v })}
                onToast={onToast}
              />
            </Row>
          </>
        ) : (
          <UpgradeGate />
        )}
      </SectionCard>

      {/* Footer hint */}
      <p className="px-6 mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
        Settings are stored on this device only. Signing out, clearing browser data, or
        uninstalling the home-screen app will reset them.
      </p>

      {confirmReset && (
        <ConfirmReset
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false);
            onReset();
            onToast("Settings reset");
          }}
        />
      )}
    </div>
  );
}
