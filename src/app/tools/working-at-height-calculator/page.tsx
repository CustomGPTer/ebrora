// src/app/tools/working-at-height-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Working at Height Risk Score Calculator | Construction Tool | Ebrora",
  description: "Calculate working at height risk scores per WAHR 2005, CDM 2015, BS 8437. Weighted factor scoring, control hierarchy with residual risk, equipment recommendations, radar and bar charts, method statement and rescue plan checklists, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/working-at-height-calculator" },
  openGraph: { title: "Working at Height Risk Score Calculator | Ebrora", description: "WAHR 2005 working at height risk scorer with control hierarchy, equipment recommendations, and white-label PDF.", url: "https://www.ebrora.com/tools/working-at-height-calculator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const WorkingAtHeightCalculatorClient = dynamic(
  () => import("@/components/working-at-height-calculator/WorkingAtHeightCalculatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Working at Height Risk Score Calculator", description: "Calculate working at height risk scores per WAHR 2005, CDM 2015, and BS 8437 with control hierarchy, equipment recommendations, and white-label PDF export.", url: "https://www.ebrora.com/tools/working-at-height-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function WorkingAtHeightCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Working at Height Risk Score Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Working at Height Risk Score Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate working at height risk scores per WAHR 2005 and CDM 2015. Weighted factor scoring with radar and bar charts, interactive control hierarchy with residual risk, detailed equipment recommendations, method statement and rescue plan checklists, and white-label PDF export.
          </p>
        </div>
        <WorkingAtHeightCalculatorClient />
      </div>
    </>
  );
}
