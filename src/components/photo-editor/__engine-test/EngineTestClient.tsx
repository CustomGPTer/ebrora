// src/components/photo-editor/__engine-test/EngineTestClient.tsx
//
// Sandbox page for the rich-text engine. Renders eleven test scenarios so
// kerning, line-wrap, alignment, per-letter styling, stroke, shadow,
// gradient, highlight and decorations can be validated end-to-end before
// the engine is wired into the main editor canvas.
//
// Each scenario is a TextLayer constructed in code, laid out via
// layoutText(), and drawn onto its own canvas via renderTextToCanvas().
// This file is the only consumer of renderTextToCanvas in Session 2.

"use client";

import { useEffect, useRef } from "react";
import {
  layoutText,
  renderTextToCanvas,
} from "@/lib/photo-editor/rich-text/engine";
import {
  createTextLayer,
  defaultGlyphRun,
} from "@/lib/photo-editor/rich-text/factory";
import { applyStylePatch } from "@/lib/photo-editor/rich-text/glyph-run";
import type { TextLayer } from "@/lib/photo-editor/types";

interface Scenario {
  title: string;
  description: string;
  layer: TextLayer;
  /** Optional fixed canvas pixel dimensions — defaults to the layer's
   *  laid-out bounding box plus 24px padding. */
  size?: { width: number; height: number };
  debug?: boolean;
}

const PAD = 24;

const SCENARIOS: Scenario[] = [
  {
    title: "1 — Plain text, single run",
    description:
      "Default sans-serif at 96px. Confirms basic measurement, layout, and fill paint.",
    layer: createTextLayer({ text: "Hello world", width: 700 }),
  },
  {
    title: "2 — Multi-line wrap",
    description:
      "Width-constrained layer with overflow at word boundaries. Confirms greedy line-break.",
    layer: createTextLayer({
      text: "The quick brown fox jumps over the lazy dog and back again",
      width: 480,
      fontSize: 48,
    }),
    size: { width: 540, height: 280 },
  },
  {
    title: "3 — Centred alignment",
    description: "Multiple lines centred within the layer width.",
    layer: createTextLayer({
      text: "Centred line one\nA much longer line two\nShort\nFour",
      width: 520,
      fontSize: 40,
      align: "center",
    }),
    size: { width: 560, height: 260 },
  },
  {
    title: "4 — Right alignment",
    description: "Same content right-aligned.",
    layer: createTextLayer({
      text: "Right-aligned\nText sits flush\nto the right edge",
      width: 520,
      fontSize: 40,
      align: "right",
    }),
    size: { width: 560, height: 200 },
  },
  {
    title: "5 — Per-word styling: HEALTH & SAFETY",
    description:
      "Single text layer; the & character is its own run with red fill. The defining demo for per-letter styling (Q1).",
    layer: makeHealthAndSafety(),
    size: { width: 760, height: 160 },
  },
  {
    title: "6 — Stroke (outlined text)",
    description: "White fill, black 6px stroke.",
    layer: makeStrokeDemo(),
    size: { width: 600, height: 160 },
  },
  {
    title: "7 — Drop shadow",
    description: "Shadow with soft blur and positive offset.",
    layer: makeShadowDemo(),
    size: { width: 600, height: 200 },
  },
  {
    title: "8 — Linear gradient fill",
    description:
      "Gradient applied per glyph (each character carries the full gradient range).",
    layer: makeGradientDemo(),
    size: { width: 720, height: 180 },
  },
  {
    title: "9 — Highlight (per-word)",
    description:
      "The middle word highlighted yellow. Highlight rectangles span the line height of their glyphs.",
    layer: makeHighlightDemo(),
    size: { width: 720, height: 160 },
  },
  {
    title: "10 — Underline + strikethrough",
    description: "Two runs with different decorations.",
    layer: makeDecorationDemo(),
    size: { width: 600, height: 160 },
  },
  {
    title: "11 — Debug overlay",
    description:
      "Same as #1 but with the engine's debug overlay on. Red = layout bbox, blue = baselines, green = line bboxes.",
    layer: createTextLayer({ text: "Hello world", width: 700 }),
    debug: true,
  },
];

// ─── Scenario builders ──────────────────────────────────────────

function makeHealthAndSafety(): TextLayer {
  const base = defaultGlyphRun({
    text: "HEALTH & SAFETY",
    fontFamily: "sans-serif",
    fontWeight: 800,
    fontSize: 88,
    fill: "#111827",
  });
  const layer = createTextLayer({
    runs: [base],
    width: 760,
    align: "left",
  });
  // "HEALTH & SAFETY" — the & is at code-point offset 7.
  layer.runs = applyStylePatch(layer.runs, 7, 8, { fill: "#DC2626" });
  return layer;
}

function makeStrokeDemo(): TextLayer {
  return createTextLayer({
    runs: [
      defaultGlyphRun({
        text: "OUTLINE",
        fontWeight: 800,
        fontSize: 96,
        fill: "#FFFFFF",
        stroke: { enabled: true, color: "#111827", width: 6, opacity: 1 },
      }),
    ],
    width: 600,
  });
}

function makeShadowDemo(): TextLayer {
  return createTextLayer({
    runs: [
      defaultGlyphRun({
        text: "Shadow",
        fontWeight: 700,
        fontSize: 96,
        fill: "#1B5B50",
        shadow: {
          enabled: true,
          color: "#000000",
          opacity: 0.4,
          blur: 12,
          offsetX: 6,
          offsetY: 6,
        },
      }),
    ],
    width: 600,
  });
}

function makeGradientDemo(): TextLayer {
  return createTextLayer({
    runs: [
      defaultGlyphRun({
        text: "GRADIENT",
        fontWeight: 800,
        fontSize: 88,
        gradient: {
          enabled: true,
          angle: 0,
          stops: [
            { position: 0, color: "#1B5B50" },
            { position: 1, color: "#4ECDC4" },
          ],
        },
      }),
    ],
    width: 720,
  });
}

function makeHighlightDemo(): TextLayer {
  const base = defaultGlyphRun({
    text: "Highlight middle word",
    fontWeight: 600,
    fontSize: 64,
  });
  const layer = createTextLayer({ runs: [base], width: 720 });
  // "Highlight middle word" — "middle" starts at offset 10, length 6.
  layer.runs = applyStylePatch(layer.runs, 10, 16, {
    highlight: { enabled: true, color: "#FACC15", opacity: 1 },
  });
  return layer;
}

function makeDecorationDemo(): TextLayer {
  const base = defaultGlyphRun({
    text: "Underline strike",
    fontWeight: 500,
    fontSize: 72,
    fill: "#111827",
  });
  const layer = createTextLayer({ runs: [base], width: 600 });
  // "Underline strike" — first 9 chars get underline, last 6 get strikethrough.
  layer.runs = applyStylePatch(layer.runs, 0, 9, { decoration: "underline" });
  layer.runs = applyStylePatch(layer.runs, 10, 16, {
    decoration: "strikethrough",
  });
  return layer;
}

// ─── Render ─────────────────────────────────────────────────────

export default function EngineTestClient() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 16px 64px",
        background: "#F8F9FA",
        color: "#111827",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Rich-text engine — sandbox
        </h1>
        <p style={{ color: "#4B5563", marginBottom: 32, fontSize: 14 }}>
          Each card below renders a TextLayer through the engine. If anything
          looks visually wrong, note which card and why. This page is internal
          and can be deleted before launch.
        </p>

        {SCENARIOS.map((s, i) => (
          <ScenarioCard key={i} scenario={s} />
        ))}
      </div>
    </main>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const layout = layoutText(scenario.layer);
    const w = scenario.size?.width ?? Math.ceil(layout.width + PAD * 2);
    const h = scenario.size?.height ?? Math.ceil(layout.height + PAD * 2);

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(PAD, PAD);
    renderTextToCanvas(ctx, scenario.layer, layout, {
      debug: scenario.debug ?? false,
    });
    ctx.restore();
  }, [scenario]);

  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        {scenario.title}
      </h2>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
        {scenario.description}
      </p>
      <div
        style={{
          background:
            "repeating-conic-gradient(#F3F4F6 0% 25%, #FFFFFF 0% 50%) 0 0 / 20px 20px",
          borderRadius: 8,
          overflow: "auto",
          maxWidth: "100%",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
    </section>
  );
}
