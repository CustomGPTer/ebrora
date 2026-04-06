// src/app/tools/topsoil-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Topsoil Volume & Tonnage Calculator | Construction Tool | Ebrora",
  description: "Calculate topsoil volumes, tonnage, wagon loads, and costs for landscaping and reinstatement. BS 3882:2015 grade specifications, multi-area take-off, settlement factor, depth guidance, and PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/topsoil-calculator" },
  openGraph: { title: "Topsoil Volume & Tonnage Calculator | Ebrora", url: "https://www.ebrora.com/tools/topsoil-calculator", type: "website" },
};

const TopsoilClient = dynamic(() => import("@/components/topsoil-calculator/TopsoilCalculatorClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function TopsoilCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Topsoil Volume & Tonnage Calculator", url: "https://www.ebrora.com/tools/topsoil-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Topsoil Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Topsoil Volume &amp; Tonnage Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Calculate topsoil volumes, tonnage, wagon loads, and costs for landscaping and reinstatement. BS 3882:2015 grade specifications, multi-area take-off, settlement factor, depth guidance, and PDF export.
          </p>
        </div>
        <TopsoilClient />
      </div>
    </>
  );
}
