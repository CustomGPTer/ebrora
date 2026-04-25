// src/app/tools/uv-index-exposure-checker/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "UV Index Exposure Checker | Free Construction Tool | Ebrora",
  description:
    "Calculate UV index exposure for outdoor construction workers using solar position equations, WHO/WMO data, and HSE guidance. Hourly UV chart, cumulative SED tracking, Fitzpatrick skin type burn estimates, PPE protection comparison, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/uv-index-exposure-checker" },
  openGraph: {
    title: "UV Index Exposure Checker | Ebrora",
    description:
      "Solar UV exposure assessment tool for construction sites. Hourly UV chart, SED tracking, PPE comparison, and PDF export.",
    url: "https://www.ebrora.com/tools/uv-index-exposure-checker",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const UVIndexExposureCheckerClient = dynamic(
  () => import("@/components/uv-index-exposure-checker/UVIndexExposureCheckerClient"),
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
        <div className="h-64 bg-gray-50 rounded-xl" />
        <div className="h-48 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "UV Index Exposure Checker",
  description:
    "Calculate UV index exposure for outdoor construction workers using solar position equations, WHO/WMO UV data, cumulative SED tracking, Fitzpatrick skin type support, and PPE protection comparison with professional PDF export.",
  url: "https://www.ebrora.com/tools/uv-index-exposure-checker",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function UVIndexExposureCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "UV Index Exposure Checker" }]} />

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
            UV Index Exposure Checker
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate UV index exposure for outdoor construction workers using solar position equations and WHO/WMO data. Hourly UV chart, cumulative SED tracking against the ICNIRP-derived 2 SED/day threshold, Fitzpatrick skin type burn time estimates, PPE protection comparison, and professional PDF export.
          </p>
        </div>

        <UVIndexExposureCheckerClient />
      </div>
    </>
  );
}
