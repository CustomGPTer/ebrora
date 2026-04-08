// src/app/tools/cable-trench-depth-checker/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Cable Trench Depth & Separation Checker | Construction Tool | Ebrora",
  description: "Check minimum cover depths and horizontal separation distances for underground utilities per NJUG Vol 1, NRSWA 1991, ENA TS 09, IGEM/TD/3, Water UK, and BT specs. Interactive trench cross-section diagram, compliance checklist, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/cable-trench-depth-checker" },
  openGraph: { title: "Cable Trench Depth & Separation Checker | Ebrora", description: "Check cover depths and separation distances for underground utilities per NJUG, NRSWA, and utility-specific standards. Live cross-section diagram and PDF export.", url: "https://www.ebrora.com/tools/cable-trench-depth-checker", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const ToolClient = dynamic(
  () => import("@/components/cable-trench-depth-checker/CableTrenchDepthCheckerClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Cable Trench Depth & Separation Checker", description: "Check minimum cover depths and horizontal separation distances for underground utilities in shared trenches. Covers LV/HV electricity, gas, water, telecoms, drainage, and street lighting per NJUG Vol 1, NRSWA 1991, ENA TS 09-1/09-2, IGEM/TD/3, Water UK, and BT/Openreach specifications. Interactive cross-section diagram and professional PDF export.", url: "https://www.ebrora.com/tools/cable-trench-depth-checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function CableTrenchDepthCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Cable Trench Depth & Separation Checker" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Cable Trench Depth & Separation Checker</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">Check minimum cover depths and horizontal separation distances for underground utilities per NJUG Vol 1, NRSWA 1991, and utility-specific standards. Interactive cross-section diagram with professional PDF export.</p>
        </div>
        <ToolClient />
      </div>
    </>
  );
}
