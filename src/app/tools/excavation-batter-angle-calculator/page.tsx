// src/app/tools/excavation-batter-angle-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Excavation Batter Angle Calculator | Paid Construction Tool | Ebrora",
  description:
    "Determine safe open-cut batter angles for UK excavations per BS 6031, BS EN 1997-1 and HSE HSG150. Covers 11 soil types, six surcharge loadings, four water conditions, four duration bands, with live cross-section diagram, volume increase vs vertical cut, and a professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/excavation-batter-angle-calculator" },
  openGraph: {
    title: "Excavation Batter Angle Calculator | Ebrora",
    description:
      "BS 6031 / Eurocode 7 batter-angle decision tool with live cross-section diagram and PDF export.",
    url: "https://www.ebrora.com/tools/excavation-batter-angle-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const ExcavationBatterAngleCalculatorClient = dynamic(
  () =>
    import("@/components/excavation-batter-angle-calculator/ExcavationBatterAngleCalculatorClient"),
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
  name: "Excavation Batter Angle Calculator",
  description:
    "Open-cut batter angle calculator for UK excavations. Covers BS 6031:2009, BS EN 1997-1 (Eurocode 7), CDM 2015 reg 22, HSE HSG150 and CIRIA R97. Includes 11 soil types, six surcharge loadings, four water conditions, four duration bands, live cross-section diagram, toe-to-crest plan distance, top-of-excavation dimensions, volume increase vs vertical cut, and a professional white-label PDF export.",
  url: "https://www.ebrora.com/tools/excavation-batter-angle-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function ExcavationBatterAngleCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[{ label: "Calculators & Tools", href: "/tools" }, { label: "Excavation Batter Angle Calculator" }]}
        />

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
            Excavation Batter Angle Calculator
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            BS 6031 / Eurocode 7 batter-angle assessment for UK open-cut excavations. 11 soil types, live cross-section diagram, volume and footprint calcs, RAG-rated output, and a professional PDF export.
          </p>
        </div>

        <ExcavationBatterAngleCalculatorClient />
      </div>
    </>
  );
}
