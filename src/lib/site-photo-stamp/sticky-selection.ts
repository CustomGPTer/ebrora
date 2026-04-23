// src/lib/site-photo-stamp/sticky-selection.ts
//
// Pure logic for resolving which template + variant the user should land on
// for the next capture, based on their settings:
//
//   • Lock (hard memory) — survives 6h after the last time the lock was
//     engaged, refreshed, or had its selection changed. Intended for site
//     walk-arounds where every photo uses the same template.
//   • Last used (soft memory) — survives 30 minutes after the last
//     selection. Intended to keep the picker steady between quick,
//     back-to-back captures.
//   • Default — falls back to the user's default template/variant in
//     Settings. Used when neither lock nor last-used is live.
//
// All functions are pure — they read from a Settings snapshot and return a
// result or a Partial<Settings> patch. No side effects, no I/O. This keeps
// the rules trivially unit-testable and safe to call from any React layer.

import type { Settings, TemplateId, VariantId } from "./types";
import { getTemplate } from "./templates";

const LOCK_DURATION_MS = 6 * 60 * 60 * 1000;       // 6 hours
const LAST_USED_DURATION_MS = 30 * 60 * 1000;      // 30 minutes

export type StickySource = "lock" | "last-used" | "default";

export interface StickySelection {
  templateId: TemplateId;
  variantId: VariantId;
  source: StickySource;
}

// ─── Queries ────────────────────────────────────────────────────

export function isLockActive(settings: Settings, now: number = Date.now()): boolean {
  return !!(
    settings.lockedTemplate &&
    settings.lockedVariant &&
    settings.lockedAt &&
    now - settings.lockedAt < LOCK_DURATION_MS
  );
}

export function isLastUsedActive(settings: Settings, now: number = Date.now()): boolean {
  return !!(
    settings.lastUsedTemplate &&
    settings.lastUsedVariant &&
    settings.lastUsedAt &&
    now - settings.lastUsedAt < LAST_USED_DURATION_MS
  );
}

/**
 * Resolve the template + variant to start the next capture on.
 * Priority: live lock → live last-used → default.
 */
export function resolveSticky(settings: Settings, now: number = Date.now()): StickySelection {
  if (isLockActive(settings, now)) {
    return {
      templateId: settings.lockedTemplate!,
      variantId: settings.lockedVariant!,
      source: "lock",
    };
  }
  if (isLastUsedActive(settings, now)) {
    return {
      templateId: settings.lastUsedTemplate!,
      variantId: settings.lastUsedVariant!,
      source: "last-used",
    };
  }
  const tmpl = getTemplate(settings.defaultTemplate);
  const variant = tmpl.variants.find((v) => v.id === settings.defaultVariant)
    ? settings.defaultVariant
    : tmpl.variants[0].id;
  return { templateId: tmpl.id, variantId: variant, source: "default" };
}

// ─── Mutations (produce Settings patches) ──────────────────────

/** Mark a selection as the most recently used (refreshes the 30-min window). */
export function markUsed(templateId: TemplateId, variantId: VariantId): Partial<Settings> {
  return {
    lastUsedTemplate: templateId,
    lastUsedVariant: variantId,
    lastUsedAt: Date.now(),
  };
}

/**
 * Engage — or refresh — the 6-hour lock on the given template/variant.
 * Also updates the last-used slot so soft and hard memory stay consistent.
 */
export function engageLock(templateId: TemplateId, variantId: VariantId): Partial<Settings> {
  const now = Date.now();
  return {
    lockedTemplate: templateId,
    lockedVariant: variantId,
    lockedAt: now,
    lastUsedTemplate: templateId,
    lastUsedVariant: variantId,
    lastUsedAt: now,
  };
}

/** Release the lock. Leaves the last-used slot untouched. */
export function releaseLock(): Partial<Settings> {
  return {
    lockedTemplate: undefined,
    lockedVariant: undefined,
    lockedAt: undefined,
  };
}
