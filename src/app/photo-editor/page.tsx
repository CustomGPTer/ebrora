// src/app/photo-editor/page.tsx
//
// Server component for /photo-editor. Loads the editor as a dynamic, ssr:false
// client component because Konva and the rich-text engine need the DOM.
//
// PWA chrome: scoped manifest at /photo-editor/manifest.webmanifest, six PNG
// icons at /photo-editor/icon-*.png, theme colour matched to the rest of
// Ebrora (#1B5B50). Orientation is intentionally NOT locked — Q15 says the
// device handles it freely.
//
// Viewport zoom is locked because we use canvas-level pinch-to-zoom (Q14)
// and we don't want iOS Safari intercepting two-finger gestures with its
// own page-zoom behaviour.

import { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";

function ClientSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-[#1B5B50] animate-spin" />
        <p className="text-sm text-gray-500">Loading editor…</p>
      </div>
    </div>
  );
}

const PhotoEditorClient = dynamic(
  () => import("@/components/photo-editor/PhotoEditorClient"),
  { ssr: false, loading: () => <ClientSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Photo Editor | Add Text, Stickers, Stamps to Photos | Free Online Editor | Ebrora",
  description:
    "Free online photo editor for site teams and anyone who needs to add text, stickers, shapes, gradients and stamps to photos. 1,800+ fonts, full per-letter styling, layers, undo/redo, EXIF date and GPS one-tap stamps, batch mode with multi-page PDF export. Works in your browser — photos never leave your device.",

  // ─── PWA: scoped manifest so /photo-editor installs as its own standalone app ───
  manifest: "/photo-editor/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Photo Editor",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/photo-editor/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/photo-editor/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/photo-editor/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/photo-editor/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },

  alternates: {
    canonical: "https://www.ebrora.com/photo-editor",
  },
  openGraph: {
    title: "Photo Editor — Free Online Photo & Text Editor | Ebrora",
    description:
      "Add text, stamps, stickers and shapes to photos in your browser. 1,800+ fonts, layers, EXIF date / GPS one-tap stamps, batch export to multi-page PDF. No upload — runs entirely on your device.",
    url: "https://www.ebrora.com/photo-editor",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Editor | Ebrora",
    description:
      "Free online photo and text editor. 1,800+ fonts, layers, EXIF stamps, batch PDF export. Runs in your browser, photos stay on your device.",
  },
};

// Viewport (Next 14+ expects theme colour and zoom controls here, not in metadata).
export const viewport: Viewport = {
  themeColor: "#1B5B50",
  width: "device-width",
  initialScale: 1,
  // Locked to prevent iOS Safari from hijacking the canvas pinch-to-zoom gesture.
  maximumScale: 1,
  userScalable: false,
};

// ─── SEO schemas (multi-keyword target per Q16) ─────────────────

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ebrora Photo Editor",
  description:
    "Free online photo editor with 1,800+ fonts, per-letter text styling, layers, stickers, shapes, gradients, erase / text-behind effect, EXIF date and GPS one-tap stamps, batch mode and multi-page PDF export. Runs entirely in the browser — photos never leave your device.",
  url: "https://www.ebrora.com/photo-editor",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web, iOS, Android",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
  featureList: [
    "1,800+ Google Fonts available on demand",
    "Per-letter and per-word text styling",
    "Layered editing with reorder, lock, visibility",
    "Erase / text-behind brush effect",
    "Photo, gradient, solid and transparent backgrounds",
    "Stickers and shapes with full transform",
    "EXIF date and GPS one-tap stamping",
    "Batch mode — apply same edits to up to 20 photos",
    "Multi-page PDF export",
    "PWA — installable as a home-screen app",
    "All processing on device — photos never uploaded",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the photo editor free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every feature of the editor is free, including the 1,800-font library, layers, erase tool, batch mode and PDF export. Free-tier exports carry a small Ebrora corner watermark; paid Ebrora subscribers get watermark-free exports and can upload their own .ttf and .otf font files.",
      },
    },
    {
      "@type": "Question",
      name: "Do my photos get uploaded to a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The editor runs entirely in your browser. Photos, EXIF metadata and edits are processed on your device and never uploaded. There is no account required to use it.",
      },
    },
    {
      "@type": "Question",
      name: "Can I add text to a photo and style individual letters differently?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Each text layer supports per-letter and per-word styling — you can select one character or a single word and change its font, colour, stroke or shadow without affecting the rest of the layer.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work on mobile?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The editor is built mobile-first with a bottom toolbar, sliding tool panels, pinch-to-zoom and two-finger rotate gestures, and full Add to Home Screen support so it launches like a native app.",
      },
    },
    {
      "@type": "Question",
      name: "Can I edit multiple photos at once?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Batch mode lets you drop in up to 20 photos, apply the same set of stamps and edits to all of them, and export the results as numbered images or a single multi-page PDF report.",
      },
    },
  ],
};

export default function PhotoEditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PhotoEditorClient />
    </>
  );
}
