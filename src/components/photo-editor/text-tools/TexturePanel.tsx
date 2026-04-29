// src/components/photo-editor/text-tools/TexturePanel.tsx
//
// Texture tab body — drives `GlyphRun.texture` (image fill repeated
// across the glyph mask). New for Batch D2b. Engine path
// (`engine.ts::resolveFillStyle`) was already in place pre-D2b.
//
// 8 textures shipped, all programmatically generated at panel-mount
// time (see `lib/photo-editor/rich-text/textures.ts`). The grid renders
// preview tiles by sourcing the cached HTMLCanvasElements directly into
// `<canvas>` thumbnails.
//
// Scale + offset + rotation are exposed as simple sliders. The engine
// applies them via `pat.setTransform(matrix)` on the CanvasPattern.
// Opacity is NOT a TextureFill field — texture intensity is controlled
// by run.opacity (which already exists on every run).
//
// Inline-only — no drawer mount path.

"use client";

import { Fragment, useEffect, useRef } from "react";
import { useTextTool } from "./use-text-tool";
import {
  DimmedWhen,
  MixedHint,
  Row,
  Section,
  SectionDivider,
  Slider,
  Toggle,
} from "./controls";
import {
  TEXTURE_IDS,
  TEXTURE_LABELS,
  getTextureCanvas,
  getTextureMap,
  type TextureId,
} from "@/lib/photo-editor/rich-text/textures";
import type { TextureFill } from "@/lib/photo-editor/types";

interface TexturePanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

const DEFAULT_TEXTURE: TextureFill = {
  enabled: false,
  src: "",
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export function TexturePanel(_props: TexturePanelProps = {}) {
  const tool = useTextTool();

  // Build the texture map once on first mount so the grid thumbnails
  // can paint synchronously below. After this call returns, every
  // TEXTURE_IDS entry has a cached canvas.
  useEffect(() => {
    getTextureMap();
  }, []);

  const current = tool.runValue("texture");
  const mixed = current === null;
  const texture: TextureFill = current ?? DEFAULT_TEXTURE;

  function patchTexture(next: Partial<TextureFill>) {
    tool.patchRuns({ texture: { ...texture, ...next } });
  }

  function pickTexture(id: TextureId) {
    patchTexture({ enabled: true, src: id });
  }

  if (!tool.layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to apply a texture.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Texture" right={mixed ? <MixedHint /> : null}>
        <Toggle
          checked={texture.enabled}
          onChange={(v) => patchTexture({ enabled: v })}
          label="Enable texture"
        />
      </Section>

      <SectionDivider />

      <DimmedWhen disabled={!texture.enabled}>
        <Section title="Pattern">
          <div className="grid grid-cols-4 gap-2 px-1">
            {TEXTURE_IDS.map((id) => (
              <Fragment key={id}>
                <TextureTile
                  id={id}
                  selected={texture.src === id}
                  onPick={() => pickTexture(id)}
                />
              </Fragment>
            ))}
          </div>
        </Section>

        <SectionDivider />

        <Section title="Pattern transform">
          <Row label="Scale">
            <Slider
              ariaLabel="Texture scale"
              value={texture.scale}
              min={0.25}
              max={3}
              step={0.05}
              onChange={(v) => patchTexture({ scale: v })}
              format={(n) => `${n.toFixed(2)}×`}
            />
          </Row>
          <Row label="Rotation">
            <Slider
              ariaLabel="Texture rotation"
              value={texture.rotation}
              min={0}
              max={360}
              step={1}
              onChange={(v) => patchTexture({ rotation: Math.round(v) })}
              format={(n) => `${Math.round(n)}°`}
            />
          </Row>
        </Section>
      </DimmedWhen>
    </div>
  );
}

interface TextureTileProps {
  id: TextureId;
  selected: boolean;
  onPick: () => void;
}

function TextureTile({ id, selected, onPick }: TextureTileProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const target = canvasRef.current;
    const source = getTextureCanvas(id);
    if (!target || !source) return;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    // Draw the cached 256×256 source into a 64×64 preview. The
    // CanvasPattern in the engine repeats; the preview thumbnail just
    // shows one tile.
    ctx.drawImage(source, 0, 0, 64, 64);
  }, [id]);

  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`Apply ${TEXTURE_LABELS[id]} texture`}
      className="flex flex-col items-center gap-1 rounded-md p-1 transition"
      style={{
        background: selected ? "var(--pe-surface-2)" : "transparent",
        border: `1.5px solid ${
          selected ? "var(--pe-accent)" : "transparent"
        }`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        className="rounded-sm"
        style={{
          width: 56,
          height: 56,
          border: "1px solid var(--pe-border)",
        }}
      />
      <span
        className="text-[10px] leading-tight text-center"
        style={{ color: "var(--pe-text-muted)" }}
      >
        {TEXTURE_LABELS[id]}
      </span>
    </button>
  );
}
