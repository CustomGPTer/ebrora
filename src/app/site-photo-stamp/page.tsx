// src/app/site-photo-stamp/page.tsx
import { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function ClientSkeleton() {
  return (
    <div className="pb-28 animate-pulse">
      <div className="px-4 pt-2 pb-4">
        <div className="bg-gradient-to-br from-[#1B5B50]/80 to-[#144540]/80 rounded-2xl p-5 h-40" />
      </div>
      <div className="px-4 pb-6">
        <div className="h-4 w-40 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

const SitePhotoStampClient = dynamic(
  () => import("@/components/site-photo-stamp/SitePhotoStampClient"),
  { ssr: false, loading: () => <ClientSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Site Photo Stamp | Construction Record, Close Call, Near Miss Photos | Ebrora",
  description:
    "Capture, stamp and share site photos on mobile. 13 construction templates (Construction Record, Close Call, Near Miss, Good Practice, Defect, Quality Record and more) with date, location and project metadata. Works offline on your phone — photos never leave your device unless you share them.",
  // ─── PWA: Scoped manifest so /site-photo-stamp installs as its own standalone app ───
  manifest: "/site-photo-stamp/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Photo Stamp",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/site-photo-stamp/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/site-photo-stamp/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/site-photo-stamp/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/site-photo-stamp/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.ebrora.com/site-photo-stamp",
  },
  openGraph: {
    title: "Site Photo Stamp | Ebrora",
    description:
      "Mobile tool for UK site teams. Stamp site photos with date, location and record type — Construction Record, Close Call, Near Miss, Good Practice and more.",
    url: "https://www.ebrora.com/site-photo-stamp",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Site Photo Stamp | Ebrora",
    description:
      "Stamp site photos with date, location and record type. Free for UK construction site teams.",
  },
};

// Viewport (Next.js 14+ expects theme colour here, not in metadata).
export const viewport: Viewport = {
  themeColor: "#1B5B50",
  width: "device-width",
  initialScale: 1,
  // Locking zoom keeps the camera capture UI stable when users tap fields.
  maximumScale: 1,
  userScalable: false,
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Site Photo Stamp",
  description:
    "Mobile construction photo recording tool with 13 built-in record templates (Construction Record, Close Call, Near Miss, Good Practice, Safety Observation, Defect/Snag, Quality Record, Progress Photo, Delivery Record, Plant Inspection, Permit Photo, Environmental Record, Before/After). All processing on device.",
  url: "https://www.ebrora.com/site-photo-stamp",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web, iOS, Android",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
  featureList: [
    "13 construction photo record templates",
    "3 visual variants per template",
    "Date, time and GPS location stamping",
    "Reverse-geocoded address overlay",
    "Unique record ID per photo",
    "Bulk mode — up to 30 photos at once",
    "PDF export with 2×2 grid layout",
    "Share via WhatsApp, email and Web Share API",
    "Fully on-device — no server uploads",
    "Installable as a home screen app (PWA)",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do my site photos get uploaded to a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Site Photo Stamp runs entirely in your browser on your phone. Photos, location data and metadata are processed on your device and stay on your device unless you choose to share or export them.",
      },
    },
    {
      "@type": "Question",
      name: "Which photo record templates are included?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "13 built-in templates: Construction Record, Close Call, Near Miss, Good Practice, Safety Observation, Defect / Snag, Quality Record, Progress Photo, Delivery Record, Plant Inspection, Permit Photo, Environmental Record, and Before / After. Each template has three visual variants.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use this on desktop?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Site Photo Stamp is designed for mobile use because it captures directly from your device camera. Opening the page on desktop shows a QR code so you can continue on your phone.",
      },
    },
    {
      "@type": "Question",
      name: "Is Site Photo Stamp free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — it's free for all users. A small Ebrora watermark appears on photos for free users. Paid subscribers can remove the watermark and add their own company logo.",
      },
    },
  ],
};

export default function SitePhotoStampPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="px-4 pt-4 pb-1">
            <BreadcrumbNav
              items={[
                { label: "Resources" },
                { label: "Site Photo Stamp" },
              ]}
            />
          </div>
          <SitePhotoStampClient />
        </div>
      </div>
    </>
  );
}
