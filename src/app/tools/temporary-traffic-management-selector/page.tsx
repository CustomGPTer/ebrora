// src/app/tools/temporary-traffic-management-selector/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Temporary Traffic Management Selector | Construction Tool | Ebrora",
  description: "Select and design temporary traffic management layouts per Chapter 8 Traffic Signs Manual, Safety at Street Works Code of Practice 2013, NRSWA 1991, and TMA 2004. Signing distances, taper lengths, cone spacing, NHSS 12A/12B requirements, NRSWA notice calculator, complexity scoring, deployment checklist, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/temporary-traffic-management-selector" },
  openGraph: { title: "Temporary Traffic Management Selector | Ebrora", description: "Chapter 8 TTM selector with signing dimensions, NHSS requirements, NRSWA notice calculator, complexity scoring, and white-label PDF.", url: "https://www.ebrora.com/tools/temporary-traffic-management-selector", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const TemporaryTrafficManagementSelectorClient = dynamic(
  () => import("@/components/temporary-traffic-management-selector/TemporaryTrafficManagementSelectorClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Temporary Traffic Management Selector", description: "Select TTM layouts per Chapter 8 Traffic Signs Manual and Safety at Street Works Code of Practice. Signing distances, NHSS requirements, NRSWA notices, complexity scoring, and white-label PDF.", url: "https://www.ebrora.com/tools/temporary-traffic-management-selector", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function TemporaryTrafficManagementSelectorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Temporary Traffic Management Selector" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Temporary Traffic Management Selector</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Select and configure temporary traffic management layouts per Chapter 8 Traffic Signs Manual and Safety at Street Works Code of Practice (2013). 9 road types, 14 works locations, 19 TM layouts, signing dimensions, taper lengths, cone spacing, NHSS 12A/12B qualification guidance, NRSWA notice calculator, 7-factor complexity scoring with radar chart, 32-point deployment checklist, and white-label PDF export.
          </p>
        </div>
        <TemporaryTrafficManagementSelectorClient />
      </div>
    </>
  );
}
