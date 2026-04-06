// src/app/tools/aggregate-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Aggregate & MOT Type 1 Calculator | Construction Tool | Ebrora",
  description: "Calculate tonnage, volume, wagon loads and bulk bags for 26 aggregate materials including MOT Type 1, 6F2, GSB, sands, gravels, and recycled materials.",
  alternates: { canonical: "https://www.ebrora.com/tools/aggregate-calculator" },
  openGraph: { title: "Aggregate & MOT Type 1 Calculator | Ebrora", url: "https://www.ebrora.com/tools/aggregate-calculator", type: "website" },
};

const AggregateCalculatorClient = dynamic(() => import("@/components/aggregate-calculator/AggregateCalculatorClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function AggregateCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Aggregate & MOT Type 1 Calculator", url: "https://www.ebrora.com/tools/aggregate-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Aggregate & MOT Type 1 Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Aggregate &amp; MOT Type 1 Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Calculate tonnage, compacted and loose volumes, wagon loads, and bulk bag counts for 26 UK aggregate materials. Includes MOT Type 1 &amp; 2, 6F2, 6F5, GSB, sands, gravels, recycled aggregates, and specialist materials. Multi-row with editable densities and white-label PDF.
          </p>
        </div>
        <AggregateCalculatorClient />
      </div>
    </>
  );
}
