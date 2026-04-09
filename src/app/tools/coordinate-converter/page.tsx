// src/app/tools/coordinate-converter/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Coordinate Converter (OS Grid / Lat Long) | Free Construction Tool | Ebrora",
  description:
    "Convert between OS National Grid references (OSGB36) and WGS84 latitude/longitude. Helmert 7-parameter datum transformation, batch conversion, UK mini map, copy-to-clipboard, and professional PDF export for construction setting-out.",
  alternates: { canonical: "https://www.ebrora.com/tools/coordinate-converter" },
  openGraph: {
    title: "Coordinate Converter (OS Grid / Lat Long) | Ebrora",
    description:
      "Convert OS Grid references to GPS coordinates and back. Batch mode, UK map, and PDF export for construction sites.",
    url: "https://www.ebrora.com/tools/coordinate-converter",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const CoordinateConverterClient = dynamic(
  () => import("@/components/coordinate-converter/CoordinateConverterClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-50 rounded-xl" />
        <div className="h-48 bg-gray-50 rounded-xl" />
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Coordinate Converter (OS Grid / Lat Long)",
  description:
    "Convert between OS National Grid references (OSGB36) and WGS84 latitude/longitude using the Helmert 7-parameter datum transformation. Single and batch conversion, UK mini map sanity check, copy-to-clipboard, and professional PDF export for construction setting-out lists.",
  url: "https://www.ebrora.com/tools/coordinate-converter",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function CoordinateConverterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Coordinate Converter" }]} />

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Free
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Coordinate Converter (OS Grid &#8596; Lat/Long)
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Convert between OS National Grid references (OSGB36) and WGS84 latitude/longitude using the Helmert 7-parameter datum transformation. Single and batch conversion, UK mini map, copy-to-clipboard, and professional PDF export.
          </p>
        </div>

        <CoordinateConverterClient />
      </div>
    </>
  );
}
