// src/app/tools/dust-silica-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Dust & Silica Exposure Calculator (COSHH) | Construction Tool | Ebrora",
  description: "Calculate respirable crystalline silica (RCS) and dust 8-hour TWA exposure for construction activities per COSHH 2002, EH40/2005, and HSE INDG463. Control measure hierarchy, RPE recommendations, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/dust-silica-calculator" },
  openGraph: { title: "Dust & Silica Exposure Calculator (COSHH) | Ebrora", url: "https://www.ebrora.com/tools/dust-silica-calculator", type: "website" },
};

const DustSilicaClient = dynamic(() => import("@/components/dust-silica-calculator/DustSilicaCalculatorClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function DustSilicaCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Dust & Silica Exposure Calculator (COSHH)", url: "https://www.ebrora.com/tools/dust-silica-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Dust & Silica Exposure Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dust & Silica Exposure Calculator (COSHH)</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Calculate respirable crystalline silica (RCS) and dust exposure for construction activities. 8-hour TWA against EH40 workplace exposure limits, COSHH control hierarchy with cost/practicality ranking, RPE recommendations, and white-label PDF assessment export.
          </p>
        </div>
        <DustSilicaClient />
      </div>
    </>
  );
}
