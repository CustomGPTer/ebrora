// src/app/tools/plant-hire-comparator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Plant Hire Cost Comparator (Hire vs Buy) | Construction Tool | Ebrora",
  description: "Compare plant hire vs purchase costs using RICS methodology. Cumulative cost crossover chart, breakeven analysis, ownership cost breakdown, duration sensitivity, effective hourly rates, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/plant-hire-comparator" },
  openGraph: { title: "Plant Hire Cost Comparator | Ebrora", description: "Hire vs buy analysis for construction plant using RICS Schedule of Basic Plant Charges methodology.", url: "https://www.ebrora.com/tools/plant-hire-comparator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const PlantHireComparatorClient = dynamic(
  () => import("@/components/plant-hire-comparator/PlantHireComparatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Plant Hire Cost Comparator", description: "Compare plant hire vs purchase costs using RICS Schedule of Basic Plant Charges methodology. Breakeven analysis, cumulative cost charts, and white-label PDF export.", url: "https://www.ebrora.com/tools/plant-hire-comparator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function PlantHireComparatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Plant Hire Cost Comparator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Plant Hire Cost Comparator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Compare the total cost of hiring vs buying construction plant using RICS methodology. Cumulative cost crossover chart with breakeven analysis, ownership cost breakdown, duration sensitivity, effective hourly rates, multi-item support, and white-label PDF export.
          </p>
        </div>
        <PlantHireComparatorClient />
      </div>
    </>
  );
}
