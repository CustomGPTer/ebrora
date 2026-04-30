// src/components/photo-editor/text-tools/PositionPanel.tsx
//
// Position panel — LAYER-LEVEL controls for whichever single layer is
// selected (text / image / sticker / shape). Phase 1 generalisation.
// Sections: Translate, Rotate, Scale, Z-order. Z-order also reachable
// via the Layers panel; both routes dispatch REORDER_LAYERS.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronsDown,
  ChevronsUp,
  ArrowDown,
  ArrowUp,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Scaling,
  Layers as LayersIcon,
} from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import {
  ActionButton,
  Row,
  Section,
  SectionDivider,
  Slider,
  NumberInput,
} from "./controls";
import type { AnyLayer, Id, Transform } from "@/lib/photo-editor/types";

type AccordionKey = "translate" | "rotate" | "scale" | "zorder";

interface PositionPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

export function PositionPanel({
  open = false,
  onClose,
  inline = false,
}: PositionPanelProps) {
  const { state, dispatch } = useEditor();
  const [uniformScale, setUniformScale] = useState(true);

  // Apr 2026 — accordion-style sections. All collapsed by default
  // when a layer is first selected; tapping an icon opens that
  // section and collapses any other open one. null = all closed.
  const [activeSection, setActiveSection] = useState<AccordionKey | null>(
    null,
  );

  // Phase 1: any single-selected layer (was text-only).
  const layer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    return state.project.layers.find((l) => l.id === id) ?? null;
  }, [state.selection, state.project.layers]);

  // When the selected layer changes (different layer, or selection
  // cleared, or selection grew/shrunk to non-single), collapse the
  // accordion. Per spec: each fresh single-selection starts closed.
  const selectedLayerId = layer?.id ?? null;
  useEffect(() => {
    setActiveSection(null);
  }, [selectedLayerId]);

  const transform: Transform = layer?.transform ?? {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
  };

  function patchTransform(next: Partial<Transform>) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        transform: { ...layer.transform, ...next },
      } as Partial<AnyLayer>,
    });
  }

  function setScale(axis: "x" | "y", value: number) {
    if (uniformScale) {
      patchTransform({ scaleX: value, scaleY: value });
    } else if (axis === "x") {
      patchTransform({ scaleX: value });
    } else {
      patchTransform({ scaleY: value });
    }
  }

  function snapRotation(target: number) {
    patchTransform({ rotation: target });
  }

  function moveZ(direction: "back-all" | "back-1" | "front-1" | "front-all") {
    if (!layer) return;
    const order = state.project.layerOrder;
    const idx = order.indexOf(layer.id);
    if (idx === -1) return;
    const without: Id[] = order.filter((id) => id !== layer.id);
    let target: number;
    switch (direction) {
      case "back-all":
        target = 0;
        break;
      case "back-1":
        target = Math.max(0, idx - 1);
        break;
      case "front-1":
        // After splice-out the original index already shifted down by 1
        // for items above; +1 here moves us one slot further toward the
        // top of the list.
        target = Math.min(without.length, idx + 1);
        break;
      case "front-all":
        target = without.length;
        break;
    }
    const next = [...without];
    next.splice(target, 0, layer.id);
    dispatch({ type: "REORDER_LAYERS", order: next });
  }

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!layer ? (
        <EmptyState />
      ) : (
        <>
          <AccordionIconRow
            active={activeSection}
            onToggle={(key) =>
              setActiveSection((prev) => (prev === key ? null : key))
            }
          />

          {activeSection === "translate" && (
            <>
              <SectionDivider />
              <Section title="Translate">
                <div className="grid grid-cols-2 gap-3">
                  <Row label="X">
                    <NumberInput
                      ariaLabel="Translate X"
                      value={transform.x}
                      step={1}
                      onChange={(v) => patchTransform({ x: v })}
                    />
                  </Row>
                  <Row label="Y">
                    <NumberInput
                      ariaLabel="Translate Y"
                      value={transform.y}
                      step={1}
                      onChange={(v) => patchTransform({ y: v })}
                    />
                  </Row>
                </div>
              </Section>
            </>
          )}

          {activeSection === "rotate" && (
            <>
              <SectionDivider />
              <Section title="Rotate">
                <Row label="Angle">
                  <Slider
                    ariaLabel="Rotation"
                    value={normaliseDeg(transform.rotation)}
                    min={0}
                    max={360}
                    step={1}
                    onChange={(v) => patchTransform({ rotation: v })}
                    format={(n) => `${n.toFixed(0)}°`}
                  />
                </Row>
                <Row label="Snap">
                  <div className="flex flex-wrap gap-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <ActionButton
                        key={deg}
                        ariaLabel={`Snap to ${deg} degrees`}
                        onClick={() => snapRotation(deg)}
                      >
                        {deg}°
                      </ActionButton>
                    ))}
                  </div>
                </Row>
              </Section>
            </>
          )}

          {activeSection === "scale" && (
            <>
              <SectionDivider />
              <Section
                title="Scale"
                right={
                  <button
                    type="button"
                    onClick={() => setUniformScale((s) => !s)}
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--pe-text-muted)" }}
                    aria-pressed={uniformScale}
                    aria-label="Lock uniform scale"
                    title="Lock uniform scale"
                  >
                    {uniformScale ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                    <span>{uniformScale ? "Uniform" : "Free"}</span>
                  </button>
                }
              >
                <Row label="Scale X">
                  <Slider
                    ariaLabel="Scale X"
                    value={transform.scaleX}
                    min={0.1}
                    max={5}
                    step={0.05}
                    onChange={(v) => setScale("x", v)}
                    format={(n) => `${n.toFixed(2)}×`}
                  />
                </Row>
                <Row label="Scale Y">
                  <Slider
                    ariaLabel="Scale Y"
                    value={transform.scaleY}
                    min={0.1}
                    max={5}
                    step={0.05}
                    onChange={(v) => setScale("y", v)}
                    format={(n) => `${n.toFixed(2)}×`}
                  />
                </Row>
              </Section>
            </>
          )}

          {activeSection === "zorder" && (
            <>
              <SectionDivider />
              <Section title="Z-order">
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    ariaLabel="Send to back"
                    onClick={() => moveZ("back-all")}
                    fullWidth
                  >
                    <ChevronsDown className="w-4 h-4" />
                    <span>To back</span>
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Send backward"
                    onClick={() => moveZ("back-1")}
                    fullWidth
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Backward</span>
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Bring forward"
                    onClick={() => moveZ("front-1")}
                    fullWidth
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Forward</span>
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Bring to front"
                    onClick={() => moveZ("front-all")}
                    fullWidth
                  >
                    <ChevronsUp className="w-4 h-4" />
                    <span>To front</span>
                  </ActionButton>
                </div>
              </Section>
            </>
          )}
        </>
      )}
    </div>
  );

  if (inline) {
    return body;
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose ?? (() => {})}
      icon={<Move className="w-5 h-5" strokeWidth={1.75} />}
      title="Position"
      footer={<span>Applied to the whole layer.</span>}
    >
      {body}
    </PanelDrawer>
  );
}

/** Wrap rotation into [0, 360) so the slider doesn't snap to its bounds
 *  when the underlying transform's rotation drifts via gestures. */
function normaliseDeg(deg: number): number {
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped;
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select a layer to access position controls.
    </div>
  );
}

// ── Accordion icon row ─────────────────────────────────────────
//
// Apr 2026 — replaces the always-expanded Translate / Rotate / Scale /
// Z-order stack with an icon-and-label row. Tapping an icon opens that
// section; tapping it again (or another icon) closes it. All collapsed
// by default per the agreed UX. The row sits at the top of the panel
// body so the section that opens appears directly underneath it.

interface AccordionIconRowProps {
  active: AccordionKey | null;
  onToggle: (key: AccordionKey) => void;
}

const ACCORDION_ITEMS: ReadonlyArray<{
  key: AccordionKey;
  label: string;
  Icon: typeof Move;
  ariaLabel: string;
}> = [
  { key: "translate", label: "Translate", Icon: Move, ariaLabel: "Translate" },
  { key: "rotate", label: "Rotate", Icon: RotateCw, ariaLabel: "Rotate" },
  { key: "scale", label: "Scale", Icon: Scaling, ariaLabel: "Scale" },
  { key: "zorder", label: "Z-order", Icon: LayersIcon, ariaLabel: "Z-order" },
];

function AccordionIconRow({ active, onToggle }: AccordionIconRowProps) {
  return (
    <div
      role="tablist"
      aria-label="Layer transform sections"
      className="grid grid-cols-4 gap-1 px-2 pt-3 pb-2"
    >
      {ACCORDION_ITEMS.map(({ key, label, Icon, ariaLabel }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={ariaLabel}
            onClick={() => onToggle(key)}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors"
            style={{
              background: isActive ? "var(--pe-surface-2)" : "transparent",
              color: isActive ? "var(--pe-accent)" : "var(--pe-text)",
            }}
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
