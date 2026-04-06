// src/app/tools/hav-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "HAV Exposure Calculator | Construction Tool | Ebrora",
  description: "Calculate hand-arm vibration exposure using the HSE points method. 151-tool library with multi-operative daily and weekly logging, EAV/ELV traffic light scoring, and per-operative PDF assessment.",
  alternates: { canonical: "https://www.ebrora.com/tools/hav-calculator" },
};

const HAVCalculatorClient = dynamic(() => import("@/components/hav-calculator/HAVCalculatorClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function HAVCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "HAV Exposure Calculator", url: "https://www.ebrora.com/tools/hav-calculator" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "HAV Exposure Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">HAV Exposure Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate hand-arm vibration exposure using the HSE points method per the Control of Vibration at Work Regulations 2005.
            151-tool library with searchable filters, multi-operative daily and weekly logging, EAV/ELV traffic light scoring,
            magnitude override for tested tools, and per-operative PDF assessment with sign-off. White-label PDF.
          </p>
        </div>
        <HAVCalculatorClient />
      </div>
    </>
  );
}
