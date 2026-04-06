// src/app/tools/confined-space-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Confined Space Category Calculator | Construction Tool | Ebrora",
  description: "Calculate confined space risk category (NC1 to NC4) using weighted scoring per Confined Spaces Regulations 1997 and C&G 6160 framework. Full requirements checklist, score breakdown, and professional PDF assessment.",
  alternates: { canonical: "https://www.ebrora.com/tools/confined-space-calculator" },
};

const ConfinedSpaceCalculatorClient = dynamic(() => import("@/components/confined-space-calculator/ConfinedSpaceCalculatorClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function ConfinedSpaceCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Confined Space Category Calculator", url: "https://www.ebrora.com/tools/confined-space-calculator" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Confined Space Category Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Confined Space Category Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Calculate the confined space risk category (NC1 Low Risk through NC4 High Risk with Rescue) using a weighted scoring system
            per the Confined Spaces Regulations 1997 and City &amp; Guilds 6160 framework. Covers foreseeable specified risks, depth,
            access/egress, ventilation, atmosphere, communication, and temperature. Full requirements checklist with C&amp;G qualification
            mapping. White-label PDF.
          </p>
        </div>
        <ConfinedSpaceCalculatorClient />
      </div>
    </>
  );
}
