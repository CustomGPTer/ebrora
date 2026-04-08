// src/app/tools/daywork-rate-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Daywork Rate Calculator | Construction Tool | Ebrora",
  description: "Calculate daywork valuations per RICS Definition of Prime Cost of Daywork (Civil Engineering & Building editions). Multi-line labour, plant, and materials sections with CIJC 2025/26 rates, percentage additions, measured rate comparison, cost breakdown charts, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/daywork-rate-calculator" },
  openGraph: { title: "Daywork Rate Calculator | Ebrora", description: "RICS daywork valuation calculator with CIJC rates, percentage additions, and white-label PDF.", url: "https://www.ebrora.com/tools/daywork-rate-calculator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const DayworkRateCalculatorClient = dynamic(() => import("@/components/daywork-rate-calculator/DayworkRateCalculatorClient"), {
  ssr: false, loading: () => (
    <div className="animate-pulse space-y-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-64 bg-gray-50 rounded-xl" />
    </div>
  ),
});

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Daywork Rate Calculator", description: "Calculate daywork valuations per RICS Definition of Prime Cost of Daywork. Multi-line labour, plant, and materials with CIJC rates, percentage additions, measured rate comparison, and white-label PDF.", url: "https://www.ebrora.com/tools/daywork-rate-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function DayworkRateCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Daywork Rate Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Daywork Rate Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate daywork valuations per RICS Definition of Prime Cost of Daywork (Civil Engineering &amp; Building editions). Multi-line labour with 12 trade grades (CIJC 2025/26 rates), plant, and materials sections. Percentage additions, optional measured rate comparison, cost breakdown charts, and white-label PDF daywork sheet.
          </p>
        </div>
        <DayworkRateCalculatorClient />
      </div>
    </>
  );
}
