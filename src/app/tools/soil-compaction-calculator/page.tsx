// src/app/tools/soil-compaction-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Soil Compaction Calculator | SHW Table 6/1 | Ebrora",
  description:
    "Calculate compaction layer thickness, passes, and time estimates per SHW Series 600 Table 6/1. 8 material types, 11 equipment categories, multi-zone assessment, automatic equipment comparison, end-product testing requirements, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/soil-compaction-calculator" },
  openGraph: {
    title: "Soil Compaction Calculator | Ebrora",
    description: "SHW Table 6/1 compaction calculator. Layer thickness, passes, time estimates, equipment comparison. Professional PDF export.",
    url: "https://www.ebrora.com/tools/soil-compaction-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const SoilCompactionCalculatorClient = dynamic(
  () => import("@/components/soil-compaction-calculator/SoilCompactionCalculatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Soil Compaction Calculator", description: "Calculate compaction layer thickness, minimum passes, and estimated time per SHW Series 600 Table 6/1. 8 material types, 11 equipment categories, multi-zone assessment, automatic equipment comparison, and white-label PDF export.", url: "https://www.ebrora.com/tools/soil-compaction-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function SoilCompactionCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Soil Compaction Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Soil Compaction Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate compaction layer thickness, minimum passes, and estimated time per SHW Series 600 Table 6/1. Multi-zone assessment with automatic equipment comparison and end-product testing requirements.
          </p>
        </div>
        <SoilCompactionCalculatorClient />
      </div>
    </>
  );
}
