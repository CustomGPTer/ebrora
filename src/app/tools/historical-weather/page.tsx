// src/app/tools/historical-weather/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Historical Weather Data & Works Planning Tool | Construction Weather Evidence | Ebrora",
  description:
    "Historical weather data and works planning for any UK town or city. Daily highs, lows, and 24-hour rainfall with professional weather icons. Day, week, and month views with baseline comparison. Works planning mode with rain probability, frost risk, wind threshold warnings, best working window finder, confidence ratings. Multi-location comparison, CSV export, and white-label PDF reports.",
  alternates: { canonical: "https://www.ebrora.com/tools/historical-weather" },
  openGraph: {
    title: "Historical Weather Data & Works Planning Tool | Ebrora",
    description:
      "UK historical weather and works planning tool. Daily highs/lows, rain probability, frost risk, wind thresholds (crane/MEWP/site closure), best working windows, multi-location comparison, CSV and PDF export.",
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
  name: "Historical Weather Data & Works Planning Tool",
  description:
    "Historical weather data and works planning for any UK town or city. Daily highs, lows, and 24-hour rainfall. Day, week, and month views with baseline comparison. Works planning mode with rain probability, frost risk, wind threshold warnings (crane, MEWP, site closure), best working window finder, confidence ratings. Multi-location comparison, CSV export for programmes, and white-label PDF reports.",
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
            Historical Weather Data &amp; Works Planning Tool
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Historical weather data and works planning for any UK town or city. Daily highs, lows, and 24-hour rainfall with professional weather icons. Day, week, and month views with baseline comparison. Works planning mode with rain probability, frost risk, wind threshold warnings (crane, MEWP, site closure), best working window finder, and confidence ratings. Multi-location comparison, CSV export for programmes, and white-label PDF reports.
          </p>
        </div>

        <HistoricalWeatherClient />
      </div>
    </>
  );
}
