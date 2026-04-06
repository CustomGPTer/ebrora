// src/app/tools/trench-backfill-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Trench Backfill & Pipe Bedding Calculator | Construction Tool | Ebrora",
  description: "Calculate bedding, side fill, and backfill volumes per HAUC/SROH. Material selectors per zone, import/export tonnage, and white-label PDF.",
  alternates: { canonical: "https://www.ebrora.com/tools/trench-backfill-calculator" },
};

const TrenchBackfillClient = dynamic(() => import("@/components/trench-backfill-calculator/TrenchBackfillClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function TrenchBackfillCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Trench Backfill & Pipe Bedding Calculator", url: "https://www.ebrora.com/tools/trench-backfill-calculator" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Trench Backfill & Pipe Bedding Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Trench Backfill &amp; Pipe Bedding Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate bedding, side fill (haunch), and backfill volumes per HAUC/SROH specification. Separate material selectors per zone, re-use toggle for excavated material, net import/export tonnage, and white-label PDF with full sign-off.
          </p>
        </div>
        <TrenchBackfillClient />
      </div>
    </>
  );
}
