// src/app/tools/concrete-curing-estimator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Concrete Curing Time Estimator | Construction Tool | Ebrora",
  description: "Estimate concrete curing time using the Nurse-Saul maturity method per BS EN 1992-1-1 (Eurocode 2). Strength development curves, milestone tracking, temperature sensitivity analysis, element thickness insulation boost, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/concrete-curing-estimator" },
  openGraph: { title: "Concrete Curing Time Estimator | Ebrora", description: "BS EN 1992-1-1 concrete curing time estimator with strength curves, milestones, and white-label PDF.", url: "https://www.ebrora.com/tools/concrete-curing-estimator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const ConcreteCuringEstimatorClient = dynamic(() => import("@/components/concrete-curing-estimator/ConcreteCuringEstimatorClient"), {
  ssr: false, loading: () => (
    <div className="animate-pulse space-y-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-64 bg-gray-50 rounded-xl" />
    </div>
  ),
});

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Concrete Curing Time Estimator", description: "Estimate concrete curing time using the Nurse-Saul maturity method per BS EN 1992-1-1 (Eurocode 2) and PD 6687. 12 strength classes, 7 cement types, 5 curing methods, element thickness insulation boost, strength development curves, milestone tracking, temperature sensitivity, and white-label PDF.", url: "https://www.ebrora.com/tools/concrete-curing-estimator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function ConcreteCuringEstimatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Concrete Curing Time Estimator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Concrete Curing Time Estimator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Estimate concrete curing time using the Nurse-Saul maturity method per BS EN 1992-1-1 (Eurocode 2). 12 strength classes (C8/10 to C50/60), 7 cement types, 5 curing methods, element thickness insulation boost, strength development curves, milestone tracking, temperature sensitivity analysis, and white-label PDF export.
          </p>
        </div>
        <ConcreteCuringEstimatorClient />
      </div>
    </>
  );
}
