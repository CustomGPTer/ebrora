// src/app/tools/excavation-spoil-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Excavation & Spoil Calculator | Construction Tool | Ebrora",
  description: "Calculate bank and bulked volumes, tonnage and wagon loads for 8 soil types. Multi-area with manual override on densities and bulking factors.",
  alternates: { canonical: "https://www.ebrora.com/tools/excavation-spoil-calculator" },
};

const ExcavationSpoilClient = dynamic(() => import("@/components/excavation-spoil-calculator/ExcavationSpoilClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function ExcavationSpoilCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Excavation & Spoil Calculator", url: "https://www.ebrora.com/tools/excavation-spoil-calculator" }) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Excavation & Spoil Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Excavation &amp; Spoil Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate cut volumes with bank and bulked outputs for 8 soil types. Includes tonnage, wagon loads for disposal, multi-area take-off, and manual override on all densities and bulking factors. White-label PDF export.
          </p>
        </div>
        <ExcavationSpoilClient />
      </div>
    </>
  );
}
