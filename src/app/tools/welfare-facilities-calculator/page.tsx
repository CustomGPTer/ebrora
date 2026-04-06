// src/app/tools/welfare-facilities-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Welfare Facilities Calculator (CDM 2015) | Construction Tool | Ebrora",
  description: "Calculate minimum welfare facility requirements for construction sites per CDM 2015 Schedule 2, HSG150, and BS 6465. Toilet, wash, rest, first aid, drying room provisions with compliance checking and unit hire recommendations.",
  alternates: { canonical: "https://www.ebrora.com/tools/welfare-facilities-calculator" },
  openGraph: { title: "Welfare Facilities Calculator (CDM 2015) | Ebrora", url: "https://www.ebrora.com/tools/welfare-facilities-calculator", type: "website" },
};

const WelfareFacilitiesClient = dynamic(() => import("@/components/welfare-facilities-calculator/WelfareFacilitiesCalculatorClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function WelfareFacilitiesCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Welfare Facilities Calculator (CDM 2015)", url: "https://www.ebrora.com/tools/welfare-facilities-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Welfare Facilities Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Welfare Facilities Calculator (CDM 2015)</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Calculate minimum welfare facility requirements for construction sites based on peak operatives, site type, and duration. CDM 2015 Schedule 2, HSG150, and BS 6465 compliant with male/female separate provision, unit hire recommendations, compliance traffic light, and white-label PDF export.
          </p>
        </div>
        <WelfareFacilitiesClient />
      </div>
    </>
  );
}
