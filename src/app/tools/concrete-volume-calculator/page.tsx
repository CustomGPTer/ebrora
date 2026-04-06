// src/app/tools/concrete-volume-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Concrete Volume Calculator | Construction Tool | Ebrora",
  description: "Calculate concrete volumes for 9 shape types. Multi-element, waste factor, truck loads, UK mix selector, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/concrete-volume-calculator" },
  openGraph: { title: "Concrete Volume Calculator | Ebrora", url: "https://www.ebrora.com/tools/concrete-volume-calculator", type: "website" },
};

const ConcreteVolumeClient = dynamic(() => import("@/components/concrete-volume-calculator/ConcreteVolumeClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function ConcreteVolumeCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Concrete Volume Calculator", url: "https://www.ebrora.com/tools/concrete-volume-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Concrete Volume Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Concrete Volume Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate concrete volumes for 9 shape types including slabs, columns, beams, ring beams, pile caps, and stairs. Multi-element take-off with waste factor, truck load calculation, UK concrete mix selector, and white-label PDF export.
          </p>
        </div>
        <ConcreteVolumeClient />
      </div>
    </>
  );
}
