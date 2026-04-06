// src/app/tools/concrete-pour-planner/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Concrete Pour Planner | Construction Tool | Ebrora",
  description: "Plan concrete pours with truck dispatch schedules. Calculate trucks required, pour duration, arrival times, and concurrent trucks to keep the pump fed continuously.",
  alternates: { canonical: "https://www.ebrora.com/tools/concrete-pour-planner" },
};

const ConcretePourPlannerClient = dynamic(() => import("@/components/concrete-pour-planner/ConcretePourPlannerClient"), {
  ssr: false, loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function ConcretePourPlannerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Concrete Pour Planner", url: "https://www.ebrora.com/tools/concrete-pour-planner" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Concrete Pour Planner" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Concrete Pour Planner</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Plan ready-mix concrete pours with a full truck dispatch schedule. Calculate trucks required, concurrent trucks on-site to keep the pump fed, pour duration, first/last arrival times, and visual progress tracking. UK concrete mix database and white-label PDF.
          </p>
        </div>
        <ConcretePourPlannerClient />
      </div>
    </>
  );
}
