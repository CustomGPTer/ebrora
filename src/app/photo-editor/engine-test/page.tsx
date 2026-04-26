// src/app/photo-editor/engine-test/page.tsx
//
// Engine sandbox — internal test page for the rich-text engine.
// Renders a column of test cards at /photo-editor/engine-test, each
// driving a TextLayer through the engine and painting the result onto
// its own canvas.
//
// This is a development-time tool, not a user-facing feature. The
// metadata below noindexes the page; the route can be deleted before
// public launch.

import dynamic from "next/dynamic";
import type { Metadata } from "next";

const EngineTestClient = dynamic(
  () => import("@/components/photo-editor/__engine-test/EngineTestClient"),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Photo Editor — Rich-text engine sandbox",
  robots: { index: false, follow: false },
};

export default function EngineTestPage() {
  return <EngineTestClient />;
}
