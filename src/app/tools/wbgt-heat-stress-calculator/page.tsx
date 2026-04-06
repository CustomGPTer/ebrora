// src/app/tools/wbgt-heat-stress-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "WBGT Heat Stress Calculator | Free Construction Tool | Ebrora",
  description:
    "Calculate Wet Bulb Globe Temperature (WBGT) for construction sites using ISO 7243. Work/rest ratios, heat stress action plans, daily and weekly assessments with professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/wbgt-heat-stress-calculator" },
  openGraph: {
    title: "WBGT Heat Stress Calculator | Ebrora",
    description:
      "ISO 7243 WBGT calculator with work/rest ratios, heat stress controls, and professional PDF export for construction sites.",
    url: "https://www.ebrora.com/tools/wbgt-heat-stress-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const WBGTHeatStressClient = dynamic(
  () => import("@/components/wbgt-heat-stress-calculator/WBGTHeatStressClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-10 bg-gray-100 rounded-lg w-64" />
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "WBGT Heat Stress Calculator",
  description:
    "ISO 7243 Wet Bulb Globe Temperature calculator for construction sites with work/rest ratios and heat stress action plans.",
  url: "https://www.ebrora.com/tools/wbgt-heat-stress-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function WBGTHeatStressCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "WBGT Heat Stress Calculator" }]} />

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
            WBGT Heat Stress Calculator
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Assess heat stress risk using ISO 7243 Wet Bulb Globe Temperature. Enter conditions directly or estimate from basic weather data. Get work/rest ratios, action plans, and a professional PDF assessment.
          </p>
        </div>

        <WBGTHeatStressClient />
      </div>
    </>
  );
}
