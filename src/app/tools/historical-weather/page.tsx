// src/app/tools/historical-weather/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Historical Weather Data Tool | Construction Weather Evidence | Ebrora",
  description:
    "Look up historical weather for any UK town or city. 12PM temperature, wind speed, rainfall, humidity, cloud cover with professional weather icons. Day, week, and month views. Compare to long-term average baseline. Multi-location comparison, frost warnings, rain day counter, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/historical-weather" },
  openGraph: {
    title: "Historical Weather Data Tool | Ebrora",
    description:
      "UK historical weather lookup with day/week/month views, baseline comparison, professional icons, and PDF export for construction weather evidence.",
    url: "https://www.ebrora.com/tools/historical-weather",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const HistoricalWeatherClient = dynamic(
  () => import("@/components/historical-weather/HistoricalWeatherClient"),
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
  name: "Historical Weather Data Tool",
  description:
    "Look up historical weather for any UK town or city. 12PM readings for temperature, wind speed, rainfall, humidity, and cloud cover. Day, week, and month views with professional weather icons, long-term baseline comparison, multi-location support, frost warnings, rain day counter, combined charts, and white-label PDF export for construction weather evidence.",
  url: "https://www.ebrora.com/tools/historical-weather",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "9.99", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function HistoricalWeatherPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Historical Weather Data" }]} />

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Paid
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Historical Weather Data Tool
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Look up historical weather for any UK town or city. 12PM readings with overnight lows, professional weather icons, day/week/month views, long-term baseline comparison, multi-location support, and white-label PDF export.
          </p>
        </div>

        <HistoricalWeatherClient />
      </div>
    </>
  );
}
