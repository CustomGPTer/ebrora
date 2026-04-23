// src/components/site-photo-stamp/TemplateGrid.tsx
//
// Banded template picker.
//
// Templates are primary: the 18 templates keep their stable order, but the
// grid is chunked into three style bands — Solid (always visible),
// Transparent (revealed on first "Show more"), Icon (revealed on second
// "Show more"). The band expansion state is local to this component and is
// intentionally *not* persisted — each visit starts collapsed again.
//
// If the user's current sticky selection (lock or last-used) belongs to a
// band that is currently collapsed, the grid surfaces it in a small
// "Recently used" row above the Solid band so it's always one tap away.
"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/site-photo-stamp/templates";
import TemplatePreviewCard from "./TemplatePreviewCard";
import type {
  Template,
  TemplateVariant,
  TemplateId,
  VariantId,
} from "@/lib/site-photo-stamp/types";

interface Props {
  selectedTemplate: TemplateId;
  selectedVariant: VariantId;
  onSelect: (templateId: TemplateId, variantId: VariantId) => void;

  /** Template + variant currently covered by an active 6h lock, if any. */
  lockedTemplate?: TemplateId;
  lockedVariant?: VariantId;
  onToggleLock?: (templateId: TemplateId, variantId: VariantId) => void;

  /** Pair to show in a dedicated "Recently used" row above Solid when its
   *  band is currently collapsed. Usually the lock or last-used pair. */
  recentlyUsed?: { template: Template; variant: TemplateVariant } | null;
}

const BAND_LABELS: Record<VariantId, string> = {
  solid: "Solid",
  transparent: "Transparent",
  icon: "With badge",
};

const BAND_HINTS: Record<VariantId, string> = {
  solid: "Full colour block — highest legibility on any photo.",
  transparent: "Text floats on the photo — cleanest look, needs a clear background.",
  icon: "Coloured block with a badge icon — quickest to scan.",
};

function cardsForVariant(variantId: VariantId) {
  return TEMPLATES.flatMap((t) => {
    const v = t.variants.find((x) => x.id === variantId);
    return v ? [{ template: t, variant: v }] : [];
  });
}

export default function TemplateGrid({
  selectedTemplate,
  selectedVariant,
  onSelect,
  lockedTemplate,
  lockedVariant,
  onToggleLock,
  recentlyUsed,
}: Props) {
  // 1 = Solid only, 2 = + Transparent, 3 = + Icon.
  const [expanded, setExpanded] = useState<1 | 2 | 3>(1);

  const renderBand = (variantId: VariantId) => {
    const cards = cardsForVariant(variantId);
    return (
      <section className="mb-5" key={variantId} aria-label={`${BAND_LABELS[variantId]} templates`}>
        <header className="mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            {BAND_LABELS[variantId]}
          </h3>
          <p className="text-[10.5px] text-gray-400 leading-tight mt-0.5">
            {BAND_HINTS[variantId]}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-2.5">
          {cards.map(({ template, variant }) => {
            const isSelected =
              selectedTemplate === template.id && selectedVariant === variant.id;
            const isLocked =
              !!lockedTemplate &&
              lockedTemplate === template.id &&
              lockedVariant === variant.id;
            return (
              <TemplatePreviewCard
                key={`${template.id}:${variant.id}`}
                template={template}
                variant={variant}
                selected={isSelected}
                locked={isLocked}
                onClick={() => onSelect(template.id, variant.id)}
                onLockToggle={
                  onToggleLock
                    ? () => onToggleLock(template.id, variant.id)
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>
    );
  };

  // Only surface Recently used when its band is currently collapsed.
  // Otherwise it would be visible twice on the same screen.
  const showRecent =
    !!recentlyUsed &&
    ((recentlyUsed.variant.id === "transparent" && expanded < 2) ||
      (recentlyUsed.variant.id === "icon" && expanded < 3));

  return (
    <div>
      {showRecent && recentlyUsed && (
        <section className="mb-5" aria-label="Recently used template">
          <header className="mb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Recently used
            </h3>
            <p className="text-[10.5px] text-gray-400 leading-tight mt-0.5">
              Picked up where you left off.
            </p>
          </header>
          <div className="grid grid-cols-2 gap-2.5">
            <TemplatePreviewCard
              template={recentlyUsed.template}
              variant={recentlyUsed.variant}
              selected={
                selectedTemplate === recentlyUsed.template.id &&
                selectedVariant === recentlyUsed.variant.id
              }
              locked={
                !!lockedTemplate &&
                lockedTemplate === recentlyUsed.template.id &&
                lockedVariant === recentlyUsed.variant.id
              }
              onClick={() =>
                onSelect(recentlyUsed.template.id, recentlyUsed.variant.id)
              }
              onLockToggle={
                onToggleLock
                  ? () =>
                      onToggleLock(
                        recentlyUsed.template.id,
                        recentlyUsed.variant.id
                      )
                  : undefined
              }
            />
          </div>
        </section>
      )}

      {renderBand("solid")}

      {expanded >= 2 ? (
        renderBand("transparent")
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(2)}
          className="w-full py-2.5 mb-5 rounded-xl bg-white border border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors active:scale-[0.98]"
        >
          Show transparent styles
          <span className="text-gray-400 ml-1.5">↓</span>
        </button>
      )}

      {expanded >= 3 ? (
        renderBand("icon")
      ) : expanded >= 2 ? (
        <button
          type="button"
          onClick={() => setExpanded(3)}
          className="w-full py-2.5 mb-5 rounded-xl bg-white border border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors active:scale-[0.98]"
        >
          Show icon styles
          <span className="text-gray-400 ml-1.5">↓</span>
        </button>
      ) : null}
    </div>
  );
}
