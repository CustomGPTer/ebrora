// src/app/tools/brick-block-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Brick & Block Quantity Calculator | Construction Tool | Ebrora",
  description: "Calculate brick and block quantities for UK masonry. 17 unit types, 4 mortar mixes, opening deductions, mortar volume with cement bags and sand tonnage.",
  alternates: { canonical: "https://www.ebrora.com/tools/brick-block-calculator" },
};

const BrickBlockClient = dynamic(() => import("@/components/brick-block-calculator/BrickBlockClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function BrickBlockCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Brick & Block Quantity Calculator", url: "https://www.ebrora.com/tools/brick-block-calculator" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Brick & Block Quantity Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Brick &amp; Block Quantity Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate brick and block quantities for 17 UK masonry unit types. Opening deductions for doors and windows, 4 mortar mix designations (M2–M12), cement bags and sand tonnage, multi-wall section take-off, and white-label PDF.
          </p>
        </div>
        <BrickBlockClient />
      </div>
    </>
  );
}
